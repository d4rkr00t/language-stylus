"use strict";
var vscode_1 = require('vscode');
var CLASS_REGEXP = /(\s|^)(\..+)$/gmi;
function getClassSymbols(text) {
    var lines = text.split('\n');
    return lines.reduce(function (result, line, index) {
        var symbols = line.match(CLASS_REGEXP) || [];
        return symbols
            .map(function (s) { return s.trim(); })
            .reduce(function (r, s) {
            if (s) {
                var indexOfSymbol = line.indexOf(s);
                var posStart = new vscode_1.Position(index, indexOfSymbol);
                var posEnd = new vscode_1.Position(index, indexOfSymbol + s.length);
                r.push(new vscode_1.SymbolInformation(s, vscode_1.SymbolKind.Class, new vscode_1.Range(posStart, posEnd)));
            }
            return r;
        }, result);
    }, []);
}
exports.getClassSymbols = getClassSymbols;
var StylusDocumentSimbolsProvider = (function () {
    function StylusDocumentSimbolsProvider() {
    }
    StylusDocumentSimbolsProvider.prototype.provideDocumentSymbols = function (document, token) {
        var text = document.getText();
        return [].concat(getClassSymbols(text));
    };
    return StylusDocumentSimbolsProvider;
}());
exports.StylusDocumentSimbolsProvider = StylusDocumentSimbolsProvider;
//# sourceMappingURL=symbols-provider.js.map