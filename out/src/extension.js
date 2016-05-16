'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var completion_item_provider_1 = require('./completion-item-provider');
var symbols_provider_1 = require('./symbols-provider');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var completionItemProvider = new completion_item_provider_1.default();
    var completionProviderDisposable = vscode.languages
        .registerCompletionItemProvider('stylus', completionItemProvider, '\\.', '$', '-', '&', '@');
    context.subscriptions.push(completionProviderDisposable);
    vscode.languages.setLanguageConfiguration('stylus', {
        wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g
    });
    var symbolsProvider = new symbols_provider_1.StylusDocumentSimbolsProvider();
    var symbolsProviderDisposable = vscode.languages.registerDocumentSymbolProvider('stylus', symbolsProvider);
    context.subscriptions.push(symbolsProviderDisposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
// export function deactivate() {
// }
//# sourceMappingURL=extension.js.map