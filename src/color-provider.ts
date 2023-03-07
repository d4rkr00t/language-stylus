import {
	CancellationToken,
	Color,
	ColorInformation,
	ColorPresentation,
	DocumentColorProvider,
	Position,
	ProviderResult,
	Range,
	TextDocument,
	TextEdit
} from 'vscode';
import {
	buildAst, flattenAndFilterAst
} from './parser';
import {
	colors,
	colorFromHex,
	getNumericValue,
	getAngle,
	toTwoDigitHex,
	colorFromHSL,
	hslFromColor
} from './colors';
import cssColors from './css-colors-list';

function Column(search: string, text: string[], lineno: number) {
	this.textLine = text[lineno];
	this.search = search;
	this.max = Math.max(this.textLine.indexOf(this.search), 0);
}

Column.prototype.real = function () {
	return this.max;
};

Column.prototype.call = function () {
	return this.max + this.textLine.slice(this.max).indexOf(')') + 1;
};

export function normalizeColors(colorsNode: oColor[], text: string[]): ColorInformation[] {
	const colorInfo: ColorInformation[] = [];
	const colorPosistion = new Set();

	colorsNode.forEach(node => {
		const pos = `${node.lineno}-${node.column}`;

		if (!colorPosistion.has(pos) && node.type === 'string' && colors[node.name]) {
			colorPosistion.add(pos);
			const positionStart = new Position(node.lineno, new Column(node.name, text, node.lineno).real());
			const positionEnd = new Position(node.lineno, new Column(node.name, text, node.lineno).real() + node.raw.length);
			const c = colorFromHex(colors[node.name]);

			colorInfo.push(new ColorInformation(
				new Range(positionStart, positionEnd),
				new Color(c.red, c.green, c.blue, c.alpha)
			));
		} else if (!colorPosistion.has(pos) && node.type === 'rgba') {
			colorPosistion.add(pos);
			const positionStart = new Position(node.lineno, new Column(node.raw, text, node.lineno).real());
			const positionEnd = new Position(node.lineno, new Column(node.raw, text, node.lineno).real() + node.raw.length);
			const [red, green, blue, alpha] = node.color.map((el, idx, arr) => {
				if (idx < arr.length - 1) {
					return getNumericValue(el, 255);
				}
				return el;
			});

			colorInfo.push(new ColorInformation(
				new Range(positionStart, positionEnd),
				new Color(red, green, blue, alpha)
			));
		} else if (!colorPosistion.has(pos) && node.type === 'func-color') {
			colorPosistion.add(pos);
			const positionStart = new Position(node.lineno, new Column(node.name, text, node.lineno).real());
			const positionEnd = new Position(node.lineno, new Column(node.name, text, node.lineno).call());

			if (['rgb', 'rgba'].find((el) => el === node.name)) {
				const [red, green, blue, alpha] = node.color.map((el, idx, arr) => {
					if (idx < arr.length - 1) {
						return getNumericValue(el[0], 255);
					}
					return el[0];
				});

				colorInfo.push(new ColorInformation(
					new Range(positionStart, positionEnd),
					new Color(red, green, blue, alpha)
				));
			} else if (['hsl', 'hsla'].find((el) => el === node.name)) {
				const [hue, sat, light, alpha] = node.color.map((el, idx) => {
					let val: any;
					switch (idx) {
						case 0:
							val = getAngle(el[0]);
							break;
						case 1:
						case 2:
							val = getNumericValue(el[0], 100.0);
							break;
						default:
							val = el[0];
							break;
					}
					return val;
				});
				const colorRes = colorFromHSL(hue, sat, light, alpha);

				colorInfo.push(new ColorInformation(
					new Range(positionStart, positionEnd),
					new Color(colorRes.red, colorRes.green, colorRes.blue, colorRes.alpha)
				));
			}
		}
	});
	// clear 'Set' position.
	colorPosistion.clear();
	return colorInfo;
}

interface oColor {
	type: string,
	nodeName: string,
	name: string,
	color: any[],
	column: number,
	lineno: number,
	raw: string | null
}

export function extractColors(lines: any): any[] {
	let result = [];
	const innerExtractColors = (node: any): void => {
		if (node.nodeName === 'expression') {
			node.nodes.forEach((val: any) => {
				if (val.nodeName === 'ident' && cssColors.indexOf(val.name) >= 0) {
					let objColor: oColor = {
						type: 'string',
						nodeName: val.nodeName,
						name: val.name,
						color: [], // TODO: Add 'string' to 'rgba' function later
						column: val.column - 1,
						lineno: val.lineno - 1,
						raw: val.string
					};
					result.push(objColor);
				} else if (val.nodeName === 'rgba') {
					let objColor: oColor = {
						type: 'rgba',
						nodeName: val.nodeName,
						name: val.name,
						color: [val.r, val.g, val.b, val.a],
						column: val.column - 1,
						lineno: val.lineno - 1,
						raw: val.raw
					};
					result.push(objColor);
				} else if (val.nodeName === 'call') {
					const callNodes = [...val.args.nodes];
					const hasOnlyUnits = (): boolean => {
						if (callNodes.length === 1) {
							return callNodes[0].nodes.every((v: any) => v.nodeName === 'unit');
						}
						return callNodes.every((v: any) => v.nodes[0].nodeName === 'unit');
					};

					if (hasOnlyUnits()) {
						const colorUnits = (): any[] => {
							if (callNodes.length === 1) {
								return callNodes[0].nodes.map((v: any) => {
									return [v.val, v.type];
								});
							}
							return callNodes.map((v: any) => {
								return [v.nodes[0].val, v.nodes[0].type];
							});
						}

						let colorVals = colorUnits().length === 3 ? colorUnits().concat([[1, undefined]]) : colorUnits();
						let objColor: oColor = {
							type: 'func-color',
							nodeName: val.nodeName,
							name: val.name,
							color: colorVals,
							column: val.column - 1,
							lineno: val.lineno - 1,
							raw: null
						};
						result.push(objColor);
					} else {
						for (let i = 0; i < callNodes.length; i++) {
							const nodeElement = callNodes[i];
							innerExtractColors(nodeElement);
						}
					}
				} else if (val.nodeName === 'object') {
					Object.keys(val.vals).forEach(oNode => {
						result = result.concat(innerExtractColors(val.vals[oNode]));
					});
				}
			});
		}
	};
	innerExtractColors(lines);

	return result.filter((v: any) => v !== undefined);
}

export function getColorsLines(ast: any): any[] {
	return (ast.nodes || ast || []).reduce((acc: any[], node: any) => {
		if (node.nodeName === 'ident') {
			acc = acc.concat(extractColors(node.val));
		} else if (node.nodeName === 'property' && node.expr) {
			acc = acc.concat(extractColors(node.expr));
		} else if (node.nodeName === 'ternary' && node.falseExpr) {
			acc = acc.concat(extractColors(node.falseExpr.val));
		}

		return acc;
	}, []);
}

export class StylusColorProvider implements DocumentColorProvider {

	provideDocumentColors(document: TextDocument, token: CancellationToken): ProviderResult<ColorInformation[]> {
		if (token.isCancellationRequested) {
			return [];
		}
		const documentTxt = document.getText();
		const ast = flattenAndFilterAst(buildAst(documentTxt));
		const colorLines = getColorsLines(ast);
		const list = normalizeColors(colorLines, documentTxt.split('\n'));
		return new Promise(resolve => { resolve(list); });
	}

	provideColorPresentations(color: Color, context: { document: TextDocument; range: Range; }, token: CancellationToken): ProviderResult<ColorPresentation[]> {
		if (token.isCancellationRequested) {
			return [];
		}
		const result: ColorPresentation[] = [];
		const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255);

		let label;
		if (color.alpha === 1) {
			label = `rgb(${red256}, ${green256}, ${blue256})`;
		} else {
			label = `rgba(${red256}, ${green256}, ${blue256}, ${color.alpha})`;
		}
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		if (color.alpha === 1) {
			label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
		} else {
			label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`;
		}
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		const hsl = hslFromColor(color);
		if (hsl.a === 1) {
			label = `hsl(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
		} else {
			label = `hsla(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${hsl.a})`;
		}
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		return result;
	}
}
