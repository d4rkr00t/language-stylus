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
  StylusNode,
  StylusValue,
  buildAst, flattenAndFilterAst,
  isColor
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

export const buildCallValueFromArgs = args =>
  args.nodes.map(node => node.nodes[0].val).join(', ');

export const getRealColumn = (textToSearch: string, text: string[], lineno: number) =>
  Math.max(text[lineno].indexOf(textToSearch), 0);

export const getRealCallColumn = (textToSearch: string, text: string[], lineno: number) => {
  const startPos = Math.max(text[lineno].indexOf(textToSearch), 0);
  const searchStr = text[lineno].slice(startPos);
  return Math.max(text[lineno].indexOf(textToSearch), 0) + searchStr.indexOf(")") + 1;
}

export function normalizeColors(colorsNode: StylusNode[], text: string[]): ColorInformation[] {
  const colorsInformation = [];
  const colorPosSet = new Set();
  colorsNode.forEach(color => {
    if (color.nodeName === 'ident' && colors[color.name]) {
      try {
        const colorObj = colorFromHex(colors[color.name]);
        const pos = `${color.lineno - 1}-${getRealColumn(color.name, text, color.lineno - 1)}`;
        if (colorPosSet.has(pos)) {
          // do nothing
        } else {
          colorPosSet.add(pos);
          colorsInformation.push(new ColorInformation(
            new Range(
              new Position(color.lineno - 1, getRealColumn(color.name, text, color.lineno - 1)),
              new Position(color.lineno - 1, getRealColumn(color.name, text, color.lineno - 1) + color.name?.length || 0)
            ),
            new Color(colorObj.red, colorObj.green, colorObj.blue, colorObj.alpha)
          ));
        }
      } catch (_) {
        // do nothing
      }
    } else if (color.nodeName === 'rgba') {
      try {
        const pos = `${color.lineno - 1}-${getRealColumn((color as any).raw, text, color.lineno - 1)}`;
        if (colorPosSet.has(pos)) {
          // do nothing
        } else {
          colorPosSet.add(pos);
          colorsInformation.push(new ColorInformation(
            new Range(
              new Position(color.lineno - 1, getRealColumn((color as any).raw, text, color.lineno - 1)),
              new Position(color.lineno - 1, getRealColumn((color as any).raw, text, color.lineno - 1) + (color as any).raw?.length || 0)
            ),
            new Color(
              // @ts-ignore
              getNumericValue(color.r, 255.0),
              // @ts-ignore
              getNumericValue(color.g, 255.0),
              // @ts-ignore
              getNumericValue(color.b, 255.0),
              1
            )
          ));
        }
      } catch (_) {
        // do nothing
      }
    } else if (color.nodeName === 'call') {
      try {
        // @ts-ignore
        const cValues = color?.args?.nodes?.length > 1
          // @ts-ignore
          ? color?.args?.nodes?.map?.((node: any) => node.nodes[0].val)
          // @ts-ignore
          : color?.args?.nodes[0]?.nodes?.map?.((node: any) => node.val);
        const colorValues = cValues;
        if (!colorValues || colorValues.length < 3 || colorValues.length > 4) {
          return;
        }
        const alpha = colorValues.length === 4 ? getNumericValue(colorValues[3], 1) : 1;
        const funcName = color.name as string;

        const pos = `${color.lineno - 1}-${getRealColumn(color.name, text, color.lineno - 1)}`;
        if (colorPosSet.has(pos)) {
          // do nothing
        } else {
          colorPosSet.add(pos);
          if (funcName === 'rgb' || funcName === 'rgba') {
            colorsInformation.push(new ColorInformation(
              new Range(
                new Position(color.lineno - 1, getRealColumn(color.name, text, color.lineno - 1)),
                new Position(color.lineno - 1, getRealCallColumn(color.name, text, color.lineno - 1))
              ),
              // @ts-ignore
              new Color(
                getNumericValue(colorValues[0], 255.0),
                getNumericValue(colorValues[1], 255.0),
                getNumericValue(colorValues[2], 255.0),
                alpha
              )
            ));
          } else if (funcName === 'hsl' || funcName === 'hsla') {
            const h = getAngle(colorValues[0]);
            const s = getNumericValue(colorValues[1], 100.0);
            const l = getNumericValue(colorValues[2], 100.0);
            const colorRes = colorFromHSL(h, s, l, alpha);
            colorsInformation.push(new ColorInformation(
              new Range(
                new Position(color.lineno - 1, getRealColumn(color.name, text, color.lineno - 1)),
                new Position(color.lineno - 1, getRealCallColumn(color.name, text, color.lineno - 1))
              ),
              new Color(colorRes.red, colorRes.green, colorRes.blue, colorRes.alpha)
            ));
          }
        }
      } catch (_) {
        // do nothing
      }
    }
  });
  // clear position set
  colorPosSet.clear();
  return colorsInformation;
}

export function extractColorsFromExpression(node: StylusValue) {
  let result = [];

  if (node.nodeName === 'expression') {
    node.nodes.forEach(valNode => {
      if (isColor(valNode)) {
        result.push(valNode);
      } else if (valNode.nodeName === 'object') {
        Object.keys(valNode.vals).forEach(subValNode => {
          result = result.concat(extractColorsFromExpression(valNode.vals[subValNode]));
        });
      }
    })
  }

  return result;
}

export function getColors(ast) {
  return (ast.nodes || ast || []).reduce((acc, node) => {
    if (node.nodeName === 'ident') {
      acc = acc.concat(extractColorsFromExpression(node.val));
    }

    if (node.nodeName === 'property' && node.expr) {
      acc = acc.concat(extractColorsFromExpression(node.expr));
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
    const list = normalizeColors(getColors(ast), documentTxt.split('\n'));
    return list;
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
