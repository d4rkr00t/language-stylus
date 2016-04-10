'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var completion_item_provider_1 = require('./completion-item-provider');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var completionItemProvider = new completion_item_provider_1.default();
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "test" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.languages.registerCompletionItemProvider('stylus', completionItemProvider);
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
// export function deactivate() {
// }
//# sourceMappingURL=extension.js.map