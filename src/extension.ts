'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages, workspace } from 'vscode';

import CompletionProvider from './completion-item-provider';
import { StylusDocumentSimbolsProvider } from './symbols-provider';
import { StylusColorProvider } from './color-provider';

const DOCUMENT_SELECTOR = {
	language: 'stylus',
	scheme: 'file'
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	const editorConfig = workspace.getConfiguration('editor');
	const config = workspace.getConfiguration('languageStylus');
	const completionItemProvider = new CompletionProvider();
	const completionProviderDisposable = languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, completionItemProvider, '\\.', '$', '-', '&', '@');
	context.subscriptions.push(completionProviderDisposable);

	// symbol
	const symbolsProvider = new StylusDocumentSimbolsProvider();
	const symbolsProviderDisposable = languages.registerDocumentSymbolProvider(DOCUMENT_SELECTOR, symbolsProvider);
	context.subscriptions.push(symbolsProviderDisposable);

	// color
	const colorProvider = new StylusColorProvider();
	const colorProviderDisposable = languages.registerColorProvider(DOCUMENT_SELECTOR, colorProvider);
	context.subscriptions.push(colorProviderDisposable);
}
