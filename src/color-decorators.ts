import { Disposable, DecorationRenderOptions, DecorationOptions, Position, Range, window, workspace, TextDocument } from 'vscode';
import {
  StylusNode,
  StylusValue,
  buildAst, flattenAndFilterAst,
  isColor
} from './parser';

import { debounce } from './utils';

const MAX_DECORATORS = 500;
const DEBOUNCE_TIME = 400;

let decorationType: any = {
	before: {
		contentText: ' ',
		border: 'solid 0.1em #000',
		margin: '0.1em 0.2em 0 0.2em',
		width: '0.8em',
		height: '0.8em'
	},
	dark: {
		before: {
			border: 'solid 0.1em #eee'
		}
	}
};

export function extractColorsFromExpression(node:StylusValue) {
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

export const buildCallValueFromArgs = args =>
  args.nodes.map(node => node.nodes[0].val).join(', ');

export const getRealColumn = (textToSearch: string, text: string[], lineno: number) =>
  Math.max(text[lineno].indexOf(textToSearch), 0);

export function normalizeColors(colors: StylusNode[], text: string[]) {
  return colors.map(color => {
    const normalized = { column: 0, lineno: color.lineno - 1, background: 'transparent' };

    if (color.nodeName === 'ident') {
      normalized.background = color.name;
      normalized.column = getRealColumn(color.name, text, normalized.lineno);
    }
    if (color.nodeName === 'rgba') {
      normalized.column = getRealColumn((color as any).raw, text, normalized.lineno);
      normalized.background = (color as any).raw;
    }

    if (color.nodeName === 'call') {
      normalized.column = getRealColumn(color.name, text, normalized.lineno);
      normalized.background = `${color.name}(${buildCallValueFromArgs((color as any).args)})`;
    }

    return normalized;
  });
}

export function updateDecorators(colorsDecorationType, editor) {
  const document = editor.document.getText();
  const ast = flattenAndFilterAst(buildAst(document));
  const colors = normalizeColors(getColors(ast), document.split('\n'));

  const decorations = colors.map(color => {
    const pos = new Position(color.lineno, color.column);
    return {
      range: new Range(pos, pos),
      renderOptions: {
        before: { backgroundColor: color.background }
      }
    };
  }).slice(0, MAX_DECORATORS);

  if (decorations && decorations.length) {
    editor.setDecorations(colorsDecorationType, decorations as any);
  }
}

export const findEditorByDocument = document =>
  window.visibleTextEditors.find(editor =>
    editor.document.uri.toString() === document.uri.toString());

export const updateDecoratorsWrapper = (colorsDecorationType, editor) =>
  updateDecorators(colorsDecorationType, editor);

export const updateDecoratorsWrapperDebounced =
  debounce(updateDecoratorsWrapper, DEBOUNCE_TIME);

export function activateColorDecorations(): Disposable {
  const disposables: Disposable[] = [];
  const colorsDecorationType = window.createTextEditorDecorationType(decorationType);
	disposables.push(colorsDecorationType);

  window.visibleTextEditors.forEach(editor => {
    if (!editor || !editor.document) return;
    updateDecoratorsWrapper(colorsDecorationType, editor);
  });

  window.onDidChangeActiveTextEditor(editor => {
    if (!editor || !editor.document) return;
    updateDecoratorsWrapperDebounced(colorsDecorationType, editor);
  });

  workspace.onDidChangeTextDocument(evt => {
    if (!evt.document) return;
    const editor = findEditorByDocument(evt.document);
    if (!editor) return;
    updateDecoratorsWrapperDebounced(colorsDecorationType, editor);
  });

  workspace.onDidOpenTextDocument(document => {
    if (!document) return;
    const editor = findEditorByDocument(document);
    if (!editor) return;
    updateDecoratorsWrapperDebounced(colorsDecorationType, editor);
  });

  (window as any).onDidChangeVisibleTextEditors(editors => {
    editors.forEach(editor => {
      if (!editor.document) return;
      updateDecoratorsWrapperDebounced(colorsDecorationType, editor);
    })
  });

  return Disposable.from(...disposables);
}
