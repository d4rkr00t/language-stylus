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
import * as CSSColor from './colors';

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

export function normalizeColors(colorsNode: StylusNodeColor[], text: string[]): ColorInformation[] {
	const colorInfo: ColorInformation[] = [];
	const colorPosistion = new Set();

	colorsNode.forEach(node => {
		const pos = `${node.lineno}-${node.column}`;

		if (!colorPosistion.has(pos) && node.type === 'string' && CSSColor.hasColorName(node.raw)) {
			colorPosistion.add(pos);
			const positionStart = new Position(node.lineno, node.column);
			const positionEnd = new Position(node.lineno, node.column + node.raw.length);
			const { red, green, blue, alpha } = node.color;

			colorInfo.push(new ColorInformation(
				new Range(positionStart, positionEnd),
				new Color(red, green, blue, alpha)
			));
		} else if (!colorPosistion.has(pos) && node.type === 'rgba') {
			colorPosistion.add(pos);
			const positionStart = new Position(node.lineno, node.column);
			const positionEnd = new Position(node.lineno, node.column + node.raw.length);
			const { red, green, blue, alpha } = node.color;

			colorInfo.push(new ColorInformation(
				new Range(positionStart, positionEnd),
				new Color(red, green, blue, alpha)
			));
		} else if (!colorPosistion.has(pos) && node.type === 'func-color') {
			colorPosistion.add(pos);
			const positionStart = new Position(node.lineno, node.column);
			const positionEnd = new Position(node.lineno, new Column(node.name, text, node.lineno).call());
			const { red, green, blue, alpha } = node.color;

			colorInfo.push(new ColorInformation(
				new Range(positionStart, positionEnd),
				new Color(red, green, blue, alpha)
			));
		}
	});
	// clear 'Set' position.
	colorPosistion.clear();
	return colorInfo;
}

interface StylusNodeColor {
	type: string,
	nodeName: string,
	name: string,
	color: CSSColor.ColorRGBA,
	column: number,
	lineno: number,
	raw: string | null
}

export function extractColors(lines: any): any[] {
	let result = [];
	const innerExtractColors = (node: any): void => {
		if (node.nodeName === 'expression') {
			node.nodes.forEach((val: any) => {
				if (val.nodeName === 'ident' && CSSColor.hasColorName(val.string)) {
					const objColor: StylusNodeColor = {
						type: 'string',
						nodeName: val.nodeName,
						name: val.name,
						color: CSSColor.colorFromHex(CSSColor.colors[val.string]),
						column: val.column - 1,
						lineno: val.lineno - 1,
						raw: val.string
					};
					result.push(objColor);
				} else if (val.nodeName === 'rgba') {
					const objColor: StylusNodeColor = {
						type: 'rgba',
						nodeName: val.nodeName,
						name: val.name,
						color: CSSColor.colorFrom256RGB(val.r, val.g, val.b, val.a),
						column: val.column - 1,
						lineno: val.lineno - 1,
						raw: val.raw
					};
					result.push(objColor);
				} else if (val.nodeName === 'call') {
					const callNodes = [...val.args.nodes];
					const hasOnlyUnits = (): boolean => {
						if (callNodes.length === 1) {
							return callNodes[0].nodes.every((el: any) => {
								if (el.nodeName === 'binop') {
									return el.left.nodeName === 'unit' && el.right.nodeName === 'unit';
								}
								return el.nodeName === 'unit';
							});
						}
						return callNodes.every((el: any) => el.nodes[0].nodeName === 'unit');
					};

					if (hasOnlyUnits() && CSSColor.isColorConstructor(val.name)) {
						const units = (): string[] => {
							if (callNodes.length === 1) {
								let sUnits: string[] = [];
								callNodes[0].nodes.forEach((el: any) => {
									if (el.nodeName === 'binop') {
										let uLeft = `${el.left.val + (el.left.type ?? '')}`;
										let uRight = `${el.right.val + (el.right.type ?? '')}`;
										sUnits = [...sUnits, uLeft, uRight];
									} else {
										let uVal = `${el.val + (el.type ?? '')}`;
										sUnits = [...sUnits, uVal];
									}
								});
								return sUnits;
							}
							return callNodes.map((el: any) => `${el.nodes[0].val + (el.nodes[0].type ?? '')}`);
						}
						const colorUnits = units().length === 3 ? units().concat(['1']) : units();
						const alpha = CSSColor.getNumericValue(colorUnits[3], 1);

						let colorVal: CSSColor.ColorRGBA;

						if (['rgb', 'rgba'].find((v: any) => v === val.name)) {
							const r = CSSColor.getNumericValue(colorUnits[0], 255.0);
							const g = CSSColor.getNumericValue(colorUnits[1], 255.0);
							const b = CSSColor.getNumericValue(colorUnits[2], 255.0);

							colorVal = { red: r, green: g, blue: b, alpha: alpha };
						} else if (['hsl', 'hsla'].find((v: any) => v === val.name)) {
							const h = CSSColor.getAngle(colorUnits[0]);
							const s = CSSColor.getNumericValue(colorUnits[1], 100.0);
							const l = CSSColor.getNumericValue(colorUnits[2], 100.0);

							colorVal = CSSColor.colorFromHSL(h, s, l, alpha);
						} else if (['hwb'].find((v: any) => v === val.name)) {
							const h = CSSColor.getAngle(colorUnits[0]);
							const w = CSSColor.getNumericValue(colorUnits[1], 100.0);
							const b = CSSColor.getNumericValue(colorUnits[2], 100.0);

							colorVal = CSSColor.colorFromHWB(h, w, b, alpha);
						}

						const objColor: StylusNodeColor = {
							type: 'func-color',
							nodeName: val.nodeName,
							name: val.name,
							color: colorVal,
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
				} else if (val.nodeName === 'atblock') {
					console.log(val);
					const arrNodes = val.nodes;
					for (let i = 0; i < arrNodes.length; i++) {
						const element = arrNodes[i].expr;
						result = result.concat(innerExtractColors(element));
					}
				}
			});
		}
	};
	innerExtractColors(lines);

	return result.filter((v: any) => v !== undefined);
}

export function getColorsLines(ast: any): any[] {
	console.log(ast);
	
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

		let label: string;

		label = CSSColor.rgbStringFromColor(color);
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		label = CSSColor.hexStringFromColor(color);
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		label = CSSColor.hslStringFromColor(color);
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		label = CSSColor.hwbStringFromColor(color);
		result.push({ label: label, textEdit: TextEdit.replace(context.range, label) });

		return result;
	}
}
