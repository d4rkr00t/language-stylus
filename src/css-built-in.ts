import { CompletionItem, CompletionItemKind, SnippetString } from 'vscode';

const builtIn = [
  {
    "name": "var(--css-variables)",
    "desc": "Evaluates the value of a custom variable.",
    "insertText": "var()"
  },
  {
    "name": "calc(expression)",
    "desc": "Evaluates an mathematical expression. The following operators can be used: + - * /.",
    "insertText": "calc()"
  }
];

export default builtIn.map((item) => {
  const completionItem = new CompletionItem(item.name);
  completionItem.detail = item.desc;
  completionItem.insertText = new SnippetString(`${item.insertText.replace(")", "$0)")}`);
  completionItem.kind = CompletionItemKind.Function;

  return completionItem;
});
