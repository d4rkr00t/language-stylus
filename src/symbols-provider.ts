import {
  DocumentSymbolProvider,
  TextDocument, CancellationToken, SymbolInformation,
  SymbolKind, Range, Position
} from 'vscode';

import {
  StylusNode,
  buildAst, flattenAndFilterAst,
  isAtRuleNode, isFunctionNode, isSelectorCallNode, isSelectorNode, isVariableNode
} from './parser';

import {
  compact,
  prepareName
} from './utils';

/**
 * Generates hash for symbol for comparison with other symbols
 * @param {SymbolInformation} symbol
 * @return {String}
 */
export function _buildHashFromSymbol(symbol:SymbolInformation) : string {
  return `${symbol.kind}_${symbol.name}_${symbol.location.range.start.line}_${symbol.location.range.end.line}`;
}

/**
 * Removes duplicate symbols
 * @param {SymbolInformation[]} symbols
 * @return {SymbolInformation[]}
 */
export function uniq(symbols:SymbolInformation[]) : SymbolInformation[] {
  const hashMap = {};

  return symbols.reduce((acc, sym, index) => {
    const hash = _buildHashFromSymbol(sym);

    if (!hashMap[hash]) {
      hashMap[hash] = true;
      return acc.concat(sym);
    }

    return acc;
  }, []);
}

/**
 * Handler for variables
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _variableSymbol(node:StylusNode, text:string[]) : SymbolInformation {
  const name = node.name;
  const lineno = Number(node.val.lineno) - 1;
  const column = Math.max(text[lineno].indexOf(name), 0);

  const posStart = new Position(lineno, column);
  const posEnd = new Position(lineno, column + name.length);

  return new SymbolInformation(name, SymbolKind.Variable, new Range(posStart, posEnd))
}

/**
 * Handler for function
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _functionSymbol(node:StylusNode, text:string[]) : SymbolInformation {
  const name = node.name;
  const lineno = Number(node.val.lineno) - 1;
  const column = Math.max(text[lineno].indexOf(name), 0);

  const posStart = new Position(lineno, column);
  const posEnd = new Position(lineno, column + name.length);

  return new SymbolInformation(name, SymbolKind.Function, new Range(posStart, posEnd))
}

/**
 * Handler for selectors
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _selectorSymbol(node:StylusNode, text:string[]) : SymbolInformation {
  const firstSegment = node.segments[0];
  const name = firstSegment.string ?
    node.segments.map(s => s.string).join('') :
    firstSegment.nodes.map(s => s.name).join('');
  const lineno = Number(firstSegment.lineno) - 1;
  const column = node.column - 1;

  const posStart = new Position(lineno, column);
  const posEnd = new Position(lineno, column + name.length);

  return new SymbolInformation(name, SymbolKind.Class, new Range(posStart, posEnd))
}

/**
 * Handler for selector call symbols
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _selectorCallSymbol(node:StylusNode, text:string[]) : SymbolInformation {
  const lineno = Number(node.lineno) - 1;
  const name = prepareName(text[lineno]);
  const column = Math.max(text[lineno].indexOf(name), 0);

  const posStart = new Position(lineno, column);
  const posEnd = new Position(lineno, column + name.length);

  return new SymbolInformation(name, SymbolKind.Class, new Range(posStart, posEnd))
}

/**
 * Handler for at rules
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _atRuleSymbol(node:StylusNode, text:string[]) : SymbolInformation {
  const lineno = Number(node.lineno) - 1;
  const name = prepareName(text[lineno]);
  const column = Math.max(text[lineno].indexOf(name), 0);

  const posStart = new Position(lineno, column);
  const posEnd = new Position(lineno, column + name.length);

  return new SymbolInformation(name, SymbolKind.Namespace, new Range(posStart, posEnd))
}

/**
 * Iterates through raw symbols and choose appropriate handler for each one
 * @param {Array} rawSymbols
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation[]}
 */
function processRawSymbols(rawSymbols:Array<StylusNode>, text:string[]) : SymbolInformation[] {
  return rawSymbols.map(symNode => {
    if (isVariableNode(symNode)) {
      return _variableSymbol(symNode, text);
    }

    if (isFunctionNode(symNode)) {
      return _functionSymbol(symNode, text);
    }

    if (isSelectorNode(symNode)) {
      return _selectorSymbol(symNode, text);
    }

    if (isSelectorCallNode(symNode)) {
      return _selectorCallSymbol(symNode, text);
    }

    if (isAtRuleNode(symNode)) {
      return _atRuleSymbol(symNode, text);
    }
  });
}

export class StylusDocumentSimbolsProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(document: TextDocument, token: CancellationToken) : SymbolInformation[] {
    const text = document.getText();
    const ast = buildAst(text);
    const rawSymbols:StylusNode[] = compact(flattenAndFilterAst(ast));

    // Code smell here. Lazy debug thing.
    // console.log(ast);
    // console.log(rawSymbols);
    // console.log(uniq(compact(processRawSymbols(rawSymbols, text.split('\n')))));

    return uniq(compact(processRawSymbols(rawSymbols, text.split('\n'))));
  }
}
