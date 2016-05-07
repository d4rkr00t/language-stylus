import {
  CompletionItemProvider, CompletionItem, CompletionItemKind,
  TextDocument, Position, CancellationToken, Range
} from 'vscode';

import {
  StylusNode,
  buildAst, flattenAndFilterAst,
  isFunctionNode, isSelectorCallNode, isSelectorNode, isVariableNode
} from './parser';

import {
  compact,
  prepareName
} from './utils';

import * as  cssSchema from './css-schema';
import builtIn from './built-in';

/**
 * Naive check whether currentWord is class or id
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isClassOrId(currentWord:string) : boolean {
  return currentWord.startsWith('.') || currentWord.startsWith('#') || currentWord.startsWith('&');
}

/**
 * Naive check whether currentWord is at rule
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isAtRule(currentWord:string) : boolean {
  return currentWord.startsWith('\@');
}

/**
 * Naive check whether currentWord is value for given property
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isValue(cssSchema, currentWord:string) : boolean {
  const property = getPropertyName(currentWord);

  return property && Boolean(findPropertySchema(cssSchema, property));
}

/**
 * Formats property name
 * @param {String} currentWord
 * @return {String}
 */
export function getPropertyName(currentWord:string) : string {
  return currentWord.trim().replace(':', ' ').split(' ')[0];
}

/**
 * Search for property in cssSchema
 * @param {Object} cssSchema
 * @param {String} property
 * @return {Object}
 */
export function findPropertySchema(cssSchema, property:string) {
  return cssSchema.data.css.properties.find(item => item.name === property);
}

/**
 * Handler for variables
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {SymbolInformation}
 */
function _variableSymbol(node:StylusNode, text:string[], currentWord:string) : CompletionItem {
  const name = node.name;
  const lineno = Number(node.val.lineno) - 1;

  const completionItem = new CompletionItem(name);
  completionItem.detail = text[lineno].trim();
  completionItem.kind = CompletionItemKind.Variable;

  return completionItem;
}

/**
 * Handler for function
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {CompletionItem}
 */
function _functionSymbol(node:StylusNode, text:string[]) : CompletionItem {
  const name = node.name;

  const completionItem = new CompletionItem(name);
  completionItem.kind = CompletionItemKind.Function;

  return completionItem;
}

/**
 * Handler for selectors
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @param {String} currentWord
 * @return {CompletionItem}
 */
function _selectorSymbol(node:StylusNode, text:string[], currentWord:string) : CompletionItem {
  const firstSegment = node.segments[0];
  const name = firstSegment.string ?
    node.segments.map(s => s.string).join('') :
    firstSegment.nodes.map(s => s.name).join('');

  const completionItem = new CompletionItem(name);
  completionItem.kind = CompletionItemKind.Class;

  return completionItem;
}

/**
 * Handler for selector call symbols
 * @param {Object} node
 * @param {String[]} text - text editor content splitted by lines
 * @return {CompletionItem}
 */
function _selectorCallSymbol(node:StylusNode, text:string[]) : CompletionItem {
  const lineno = Number(node.lineno) - 1;
  const name = prepareName(text[lineno]);

  const completionItem = new CompletionItem(name);
  completionItem.kind = CompletionItemKind.Class;

  return completionItem;
}

/**
 * Returns completion items lists from document symbols
 * @param {String} text
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getAllSymbols(text:string, currentWord:string) : CompletionItem[] {
  const ast = buildAst(text);
  const splittedText = text.split('\n');
  const rawSymbols = flattenAndFilterAst(ast).filter(item =>
    item && ['media', 'keyframes', 'atrule', 'import', 'require', 'supports', 'literal'].indexOf(item.nodeName) === -1);

  return rawSymbols.map(item => {
    if (isVariableNode(item)) {
      return _variableSymbol(item, splittedText, currentWord);
    }

    if (isFunctionNode(item)) {
      return _functionSymbol(item, splittedText);
    }

    if (isSelectorNode(item)) {
      return _selectorSymbol(item, splittedText, currentWord);
    }

    if (isSelectorCallNode(item)) {
      return _selectorCallSymbol(item, splittedText);
    }
  });
}

/**
 * Returns at rules list for completion
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getAtRules(cssSchema, currentWord:string) : CompletionItem[] {
  if (!isAtRule(currentWord)) return [];

  return cssSchema.data.css.atdirectives.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Keyword;

    return completionItem;
  });
}

/**
 * Returns property list for completion
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getProperties(cssSchema, currentWord:string) : CompletionItem[] {
  if (isClassOrId(currentWord) || isAtRule(currentWord)) return [];

  return cssSchema.data.css.properties.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.insertText = property.name + ': ';
    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Property;

    return completionItem;
  });
}

/**
 * Returns values for current property for completion list
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getValues(cssSchema, currentWord:string) : CompletionItem[] {
  const property = getPropertyName(currentWord);
  const values = findPropertySchema(cssSchema, property).values;

  if (!values) return [];

  return values.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Value;

    return completionItem;
  });
}

class StylusCompletion implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken) : CompletionItem[] {
    const start = new Position(position.line, 0);
    const range = new Range(start, position);
    const currentWord = document.getText(range).trim();
    const text = document.getText();
    const value = isValue(cssSchema, currentWord);

    let symbols = [],
        atRules = [],
        properties = [],
        values = [];

    if (value) {
      values = getValues(cssSchema, currentWord);
      symbols = compact(getAllSymbols(text, currentWord)).filter(item =>
        item.kind === CompletionItemKind.Variable
      );
    } else {
      atRules = getAtRules(cssSchema, currentWord);
      properties = getProperties(cssSchema, currentWord);
      symbols = compact(getAllSymbols(text, currentWord));
    }

    const completions = [].concat(
      symbols,
      atRules,
      properties,
      values,
      builtIn
    );

    return completions;
  }
}

export default StylusCompletion;
