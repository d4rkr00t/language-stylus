import {
  DocumentSymbolProvider,
  TextDocument, CancellationToken, SymbolInformation,
  SymbolKind, Range, Position
} from 'vscode';

const CLASS_REGEXP = /(\s|^)(\..+)$/gmi
export function getClassSymbols(text:string) : SymbolInformation[] {
  const lines = text.split('\n');

  return lines.reduce((result, line, index) => {
    const symbols = line.match(CLASS_REGEXP) || [];

    return symbols
      .map(s => s.trim())
      .reduce((r, s) => {
        if (s) {
          const indexOfSymbol = line.indexOf(s);
          const posStart = new Position(index, indexOfSymbol);
          const posEnd = new Position(index, indexOfSymbol + s.length);

          r.push(
            new SymbolInformation(s, SymbolKind.Class, new Range(posStart, posEnd))
          )
        }

        return r;
      }, result);
  }, []);
}

export class StylusDocumentSimbolsProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(document: TextDocument, token: CancellationToken) : SymbolInformation[] {
    const text = document.getText();

    return [].concat(
      getClassSymbols(text)
    );
  }
}
