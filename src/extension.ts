'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import CompletionProvider from './completion-item-provider';
import { StylusDocumentSimbolsProvider } from './symbols-provider';
import { activateColorDecorations } from './color-decorators';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const editorConfig = vscode.workspace.getConfiguration('editor');
  console.log(editorConfig);
  const config = vscode.workspace.getConfiguration('languageStylus');
  const completionItemProvider = new CompletionProvider();
  const completionProviderDisposable = vscode.languages
    .registerCompletionItemProvider('stylus', completionItemProvider, '\\.', '$', '-', '&', '@');
  context.subscriptions.push(completionProviderDisposable);

  vscode.languages.setLanguageConfiguration('stylus', {
    wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g
  });

  const symbolsProvider = new StylusDocumentSimbolsProvider();
  const symbolsProviderDisposable = vscode.languages.registerDocumentSymbolProvider('stylus', symbolsProvider);
  context.subscriptions.push(symbolsProviderDisposable);

  if (editorConfig.get('colorDecorators')) {
    context.subscriptions.push(activateColorDecorations());
  }
}
