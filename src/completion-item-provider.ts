import {
  CompletionItemProvider, CompletionItem, CompletionItemKind,
  TextDocument, Position, CancellationToken, Range
} from 'vscode';

import * as  cssSchema from './css-schema';

export function isClassOrId(currentWord:string) : boolean {
  return currentWord.startsWith('.') || currentWord.startsWith('#');
}

export function isAtRule(currentWord:string) : boolean {
  return currentWord.startsWith('\@');
}

export function isValue(cssSchema, currentWord:string) : boolean {
  const property = getPropertyName(currentWord);

  return property && Boolean(findPropertySchema(cssSchema, property));
}

export function getPropertyName(currentWord:string) : string {
  return currentWord.trim().replace(':', ' ').split(' ')[0];
}

export function findPropertySchema(cssSchema, property:string) : any {
  return cssSchema.data.css.properties.find(item => item.name === property);
}

export function getClassesOrIds(cssSchema, currentWord:string) : CompletionItem[] {
  if (!isClassOrId(currentWord)) return [];

  return [];
}

export function getAtRules(cssSchema, currentWord:string) : CompletionItem[] {
  if (!isAtRule(currentWord)) return [];

  return cssSchema.data.css.atdirectives.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.insertText = property.name.replace(/^@/, '');
    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Keyword;

    return completionItem;
  });
}

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
    const currentWord = document.getText(range);
    const value = isValue(cssSchema, currentWord);

    let classesOrIds = [],
        atRules = [],
        properties = [],
        values = [];

    if (value) {
      values = getValues(cssSchema, currentWord);
    } else {
      classesOrIds = getClassesOrIds(cssSchema, currentWord);
      atRules = getAtRules(cssSchema, currentWord);
      properties = getProperties(cssSchema, currentWord);
    }

    const completions = [].concat(
      classesOrIds,
      atRules,
      properties,
      values
    );

    return completions;
  }
}

export default StylusCompletion;
