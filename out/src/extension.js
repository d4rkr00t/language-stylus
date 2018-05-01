'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const completion_item_provider_1 = require("./completion-item-provider");
const symbols_provider_1 = require("./symbols-provider");
const color_decorators_1 = require("./color-decorators");
const DOCUMENT_SELECTOR = {
    language: 'stylus',
    scheme: 'file'
};
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const editorConfig = vscode.workspace.getConfiguration('editor');
    console.log(editorConfig);
    const config = vscode.workspace.getConfiguration('languageStylus');
    const completionItemProvider = new completion_item_provider_1.default();
    const completionProviderDisposable = vscode.languages
        .registerCompletionItemProvider(DOCUMENT_SELECTOR, completionItemProvider, '\\.', '$', '-', '&', '@');
    context.subscriptions.push(completionProviderDisposable);
    vscode.languages.setLanguageConfiguration('stylus', {
        wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g,
        onEnterRules: [
            // Indent after .class_name, #id, @media, [attr=sddsf]
            {
                beforeText: /^([\s\/]?)+[\.#&@\[:].+[^,]$/gi,
                action: { indentAction: vscode.IndentAction.Indent },
            },
            // Indent after &
            {
                beforeText: /\s&(.*)[^,]$|&$/gi,
                action: { indentAction: vscode.IndentAction.Indent },
            },
            // Indent after keyfames e.g. 10%
            {
                beforeText: /^(\s?)+\d{1,3}%/gi,
                action: { indentAction: vscode.IndentAction.Indent },
            },
            // Indent after keyfames e.g. 10%
            {
                beforeText: /^(\s?)+for.+in.+$/gi,
                action: { indentAction: vscode.IndentAction.Indent },
            }
        ]
    });
    const symbolsProvider = new symbols_provider_1.StylusDocumentSimbolsProvider();
    const symbolsProviderDisposable = vscode.languages.registerDocumentSymbolProvider(DOCUMENT_SELECTOR, symbolsProvider);
    context.subscriptions.push(symbolsProviderDisposable);
    if (editorConfig.get('colorDecorators')) {
        context.subscriptions.push(color_decorators_1.activateColorDecorations());
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map