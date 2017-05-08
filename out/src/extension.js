'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const completion_item_provider_1 = require("./completion-item-provider");
const symbols_provider_1 = require("./symbols-provider");
const color_decorators_1 = require("./color-decorators");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const config = vscode.workspace.getConfiguration('languageStylus');
    const completionItemProvider = new completion_item_provider_1.default();
    const completionProviderDisposable = vscode.languages
        .registerCompletionItemProvider('stylus', completionItemProvider, '\\.', '$', '-', '&', '@');
    context.subscriptions.push(completionProviderDisposable);
    vscode.languages.setLanguageConfiguration('stylus', {
        wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g
    });
    const symbolsProvider = new symbols_provider_1.StylusDocumentSimbolsProvider();
    const symbolsProviderDisposable = vscode.languages.registerDocumentSymbolProvider('stylus', symbolsProvider);
    context.subscriptions.push(symbolsProviderDisposable);
    if (config.get('previewColors')) {
        context.subscriptions.push(color_decorators_1.activateColorDecorations());
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map