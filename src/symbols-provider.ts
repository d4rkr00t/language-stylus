import {
  DocumentSymbolProvider,
  TextDocument, CancellationToken, SymbolInformation,
  SymbolKind, Range, Position
} from 'vscode';

const stylus = require('stylus');

/**
 * Removes falsy values from array
 * @param {Array} arr
 * @return Array
 */
export function compact(arr:Array<any>) : Array<any> {
  return arr.filter(item => item);
}

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
 * Removes useless characters from symbol name
 * @param {String} name
 * @return String
 */
export function prepareName(name:string) : string {
  return name.replace(/\{|\}/g, '').trim();
}

/**
 * Parses text editor content and returns ast
 * @param {string} text - text editor content
 * @return {Object}
 */
export function buildAst(text:string) {
  return new stylus.Parser(text).parse();
}

/**
 * Flattens ast and removes useless nodes
 * @param {Object} node
 * @return {Array}
 */
export function flattenAndFilter(node) {
  if (Array.isArray(node)) {
    return node.reduce((acc, item) => {
      return acc.concat(flattenAndFilter(item));
    }, []);
  }

  if (!node.nodeName) return;
  if (node.nodeName === 'property') return;
  if (node.nodeName === 'keyframes') return node;

  let nested = [];

  if (node.nodes) {
    nested = nested.concat(flattenAndFilter(node.nodes));
  }

  if (node.block) {
    nested = nested.concat(flattenAndFilter(node.block));
  }

  if (node.nodeName === 'group' || node.nodeName === 'root' || node.nodeName === 'block') {
    return nested.length ? nested : node;
  }

  // Hack prevents duplicated nodes.
  node.nodes = null;
  node.block = null;

  return nested.length ? [node].concat(nested) : node;
}

/**
 * Handler for variables
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _variableSymbol(node, text:string[]) : SymbolInformation {
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
function _functionSymbol(node, text:string[]) : SymbolInformation {
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
function _selectorSymbol(node, text:string[]) : SymbolInformation {
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
function _selectorCallSymbol(node, text:string[]) : SymbolInformation {
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
function _atRuleSymbol(node, text:string[]) : SymbolInformation {
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
function processRawSymbols(rawSymbols:Array<any>, text:string[]) : SymbolInformation[] {
  return rawSymbols.map(symNode => {
    if (symNode.nodeName === 'ident' && symNode.val && symNode.val.nodeName === 'expression') {
      return _variableSymbol(symNode, text);
    }

    if (symNode.nodeName === 'ident' && symNode.val && symNode.val.nodeName === 'function') {
      return _functionSymbol(symNode, text);
    }

    if (symNode.nodeName === 'selector') {
      return _selectorSymbol(symNode, text);
    }

    if (symNode.nodeName === 'call' && symNode.name === 'selector') {
      return _selectorCallSymbol(symNode, text);
    }

    if (['media', 'keyframes', 'atrule', 'import', 'require', 'supports', 'literal'].indexOf(symNode.nodeName) !== -1) {
      return _atRuleSymbol(symNode, text);
    }
  });
}

export class StylusDocumentSimbolsProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(document: TextDocument, token: CancellationToken) : SymbolInformation[] {
    const text = document.getText();
    const ast = buildAst(text);
    const rawSymbols = compact(flattenAndFilter(ast));

    // Code smell here. Lazy debug thing.
    // console.log(ast);
    // console.log(rawSymbols);
    // console.log(uniq(compact(processRawSymbols(rawSymbols, text.split('\n')))));

    return uniq(compact(processRawSymbols(rawSymbols, text.split('\n'))));
  }
}
