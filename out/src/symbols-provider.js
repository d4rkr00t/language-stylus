"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const parser_1 = require("./parser");
const utils_1 = require("./utils");
/**
 * Generates hash for symbol for comparison with other symbols
 * @param {SymbolInformation} symbol
 * @return {String}
 */
function _buildHashFromSymbol(symbol) {
    return `${symbol.kind}_${symbol.name}_${symbol.location.range.start.line}_${symbol.location.range.end.line}`;
}
exports._buildHashFromSymbol = _buildHashFromSymbol;
/**
 * Removes duplicate symbols
 * @param {SymbolInformation[]} symbols
 * @return {SymbolInformation[]}
 */
function uniq(symbols) {
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
exports.uniq = uniq;
/**
 * Handler for variables
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _variableSymbol(node, text) {
    const name = node.name;
    const lineno = Number(node.val.lineno) - 1;
    const column = Math.max(text[lineno].indexOf(name), 0);
    const posStart = new vscode_1.Position(lineno, column);
    const posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Variable, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for function
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _functionSymbol(node, text) {
    const name = node.name;
    const lineno = Number(node.val.lineno) - 1;
    const column = Math.max(text[lineno].indexOf(name), 0);
    const posStart = new vscode_1.Position(lineno, column);
    const posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Function, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for selectors
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _selectorSymbol(node, text) {
    const firstSegment = node.segments[0];
    const name = firstSegment.string ?
        node.segments.map(s => s.string).join('') :
        firstSegment.nodes.map(s => s.name).join('');
    const lineno = Number(firstSegment.lineno) - 1;
    const column = node.column - 1;
    const posStart = new vscode_1.Position(lineno, column);
    const posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Class, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for selector call symbols
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _selectorCallSymbol(node, text) {
    const lineno = Number(node.lineno) - 1;
    const name = utils_1.prepareName(text[lineno]);
    const column = Math.max(text[lineno].indexOf(name), 0);
    const posStart = new vscode_1.Position(lineno, column);
    const posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Class, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for at rules
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _atRuleSymbol(node, text) {
    const lineno = Number(node.lineno) - 1;
    const name = utils_1.prepareName(text[lineno]);
    const column = Math.max(text[lineno].indexOf(name), 0);
    const posStart = new vscode_1.Position(lineno, column);
    const posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Namespace, new vscode_1.Range(posStart, posEnd));
}
/**
 * Iterates through raw symbols and choose appropriate handler for each one
 * @param {Array} rawSymbols
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation[]}
 */
function processRawSymbols(rawSymbols, text) {
    return rawSymbols.map(symNode => {
        if (parser_1.isVariableNode(symNode)) {
            return _variableSymbol(symNode, text);
        }
        if (parser_1.isFunctionNode(symNode)) {
            return _functionSymbol(symNode, text);
        }
        if (parser_1.isSelectorNode(symNode)) {
            return _selectorSymbol(symNode, text);
        }
        if (parser_1.isSelectorCallNode(symNode)) {
            return _selectorCallSymbol(symNode, text);
        }
        if (parser_1.isAtRuleNode(symNode)) {
            return _atRuleSymbol(symNode, text);
        }
    });
}
class StylusDocumentSimbolsProvider {
    provideDocumentSymbols(document, token) {
        const text = document.getText();
        const ast = parser_1.buildAst(text);
        const rawSymbols = utils_1.compact(parser_1.flattenAndFilterAst(ast));
        // Code smell here. Lazy debug thing.
        // console.log(ast);
        // console.log(rawSymbols);
        // console.log(uniq(compact(processRawSymbols(rawSymbols, text.split('\n')))));
        return uniq(utils_1.compact(processRawSymbols(rawSymbols, text.split('\n'))));
    }
}
exports.StylusDocumentSimbolsProvider = StylusDocumentSimbolsProvider;
//# sourceMappingURL=symbols-provider.js.map