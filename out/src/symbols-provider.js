"use strict";
var vscode_1 = require('vscode');
var parser_1 = require('./parser');
var utils_1 = require('./utils');
/**
 * Generates hash for symbol for comparison with other symbols
 * @param {SymbolInformation} symbol
 * @return {String}
 */
function _buildHashFromSymbol(symbol) {
    return symbol.kind + "_" + symbol.name + "_" + symbol.location.range.start.line + "_" + symbol.location.range.end.line;
}
exports._buildHashFromSymbol = _buildHashFromSymbol;
/**
 * Removes duplicate symbols
 * @param {SymbolInformation[]} symbols
 * @return {SymbolInformation[]}
 */
function uniq(symbols) {
    var hashMap = {};
    return symbols.reduce(function (acc, sym, index) {
        var hash = _buildHashFromSymbol(sym);
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
    var name = node.name;
    var lineno = Number(node.val.lineno) - 1;
    var column = Math.max(text[lineno].indexOf(name), 0);
    var posStart = new vscode_1.Position(lineno, column);
    var posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Variable, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for function
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _functionSymbol(node, text) {
    var name = node.name;
    var lineno = Number(node.val.lineno) - 1;
    var column = Math.max(text[lineno].indexOf(name), 0);
    var posStart = new vscode_1.Position(lineno, column);
    var posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Function, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for selectors
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _selectorSymbol(node, text) {
    var firstSegment = node.segments[0];
    var name = firstSegment.string ?
        node.segments.map(function (s) { return s.string; }).join('') :
        firstSegment.nodes.map(function (s) { return s.name; }).join('');
    var lineno = Number(firstSegment.lineno) - 1;
    var column = node.column - 1;
    var posStart = new vscode_1.Position(lineno, column);
    var posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Class, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for selector call symbols
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _selectorCallSymbol(node, text) {
    var lineno = Number(node.lineno) - 1;
    var name = utils_1.prepareName(text[lineno]);
    var column = Math.max(text[lineno].indexOf(name), 0);
    var posStart = new vscode_1.Position(lineno, column);
    var posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Class, new vscode_1.Range(posStart, posEnd));
}
/**
 * Handler for at rules
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _atRuleSymbol(node, text) {
    var lineno = Number(node.lineno) - 1;
    var name = utils_1.prepareName(text[lineno]);
    var column = Math.max(text[lineno].indexOf(name), 0);
    var posStart = new vscode_1.Position(lineno, column);
    var posEnd = new vscode_1.Position(lineno, column + name.length);
    return new vscode_1.SymbolInformation(name, vscode_1.SymbolKind.Namespace, new vscode_1.Range(posStart, posEnd));
}
/**
 * Iterates through raw symbols and choose appropriate handler for each one
 * @param {Array} rawSymbols
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation[]}
 */
function processRawSymbols(rawSymbols, text) {
    return rawSymbols.map(function (symNode) {
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
var StylusDocumentSimbolsProvider = (function () {
    function StylusDocumentSimbolsProvider() {
    }
    StylusDocumentSimbolsProvider.prototype.provideDocumentSymbols = function (document, token) {
        var text = document.getText();
        var ast = parser_1.buildAst(text);
        var rawSymbols = utils_1.compact(parser_1.flattenAndFilterAst(ast));
        // Code smell here. Lazy debug thing.
        // console.log(ast);
        // console.log(rawSymbols);
        // console.log(uniq(compact(processRawSymbols(rawSymbols, text.split('\n')))));
        return uniq(utils_1.compact(processRawSymbols(rawSymbols, text.split('\n'))));
    };
    return StylusDocumentSimbolsProvider;
}());
exports.StylusDocumentSimbolsProvider = StylusDocumentSimbolsProvider;
//# sourceMappingURL=symbols-provider.js.map