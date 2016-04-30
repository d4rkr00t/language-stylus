"use strict";
var vscode_1 = require('vscode');
var stylus = require('stylus');
/**
 * Removes falsy values from array
 * @param {Array} arr
 * @return Array
 */
function compact(arr) {
    return arr.filter(function (item) { return item; });
}
exports.compact = compact;
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
 * Removes useless characters from symbol name
 * @param {String} name
 * @return String
 */
function prepareName(name) {
    return name.replace(/\{|\}/g, '').trim();
}
exports.prepareName = prepareName;
/**
 * Parses text editor content and returns ast
 * @param {string} text - text editor content
 * @return {Object}
 */
function buildAst(text) {
    return new stylus.Parser(text).parse();
}
exports.buildAst = buildAst;
/**
 * Flattens ast and removes useless nodes
 * @param {Object} node
 * @return {Array}
 */
function flattenAndFilter(node) {
    if (Array.isArray(node)) {
        return node.reduce(function (acc, item) {
            return acc.concat(flattenAndFilter(item));
        }, []);
    }
    if (!node.nodeName)
        return;
    if (node.nodeName === 'property')
        return;
    if (node.nodeName === 'keyframes')
        return node;
    var nested = [];
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
exports.flattenAndFilter = flattenAndFilter;
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
    var name = prepareName(text[lineno]);
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
    var name = prepareName(text[lineno]);
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
var StylusDocumentSimbolsProvider = (function () {
    function StylusDocumentSimbolsProvider() {
    }
    StylusDocumentSimbolsProvider.prototype.provideDocumentSymbols = function (document, token) {
        var text = document.getText();
        var ast = buildAst(text);
        var rawSymbols = compact(flattenAndFilter(ast));
        // Code smell here. Lazy debug thing.
        // console.log(ast);
        // console.log(rawSymbols);
        // console.log(uniq(compact(processRawSymbols(rawSymbols, text.split('\n')))));
        return uniq(compact(processRawSymbols(rawSymbols, text.split('\n'))));
    };
    return StylusDocumentSimbolsProvider;
}());
exports.StylusDocumentSimbolsProvider = StylusDocumentSimbolsProvider;
//# sourceMappingURL=symbols-provider.js.map