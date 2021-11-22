# vscode-stylus

[![VSCode Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/sysoev.language-stylus?label=VSCode%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=sysoev.language-stylus)
[![VSCode Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/sysoev.language-stylus)](https://marketplace.visualstudio.com/items?itemName=sysoev.language-stylus)
[![VSCode Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/sysoev.language-stylus)](https://marketplace.visualstudio.com/items?itemName=sysoev.language-stylus)
[![VSCode Marketplace Stars](https://img.shields.io/visual-studio-marketplace/r/sysoev.language-stylus)](https://marketplace.visualstudio.com/items?itemName=sysoev.language-stylus)
[![github-issues](https://img.shields.io/github/issues/d4rkr00t/language-stylus.svg)](https://github.com/d4rkr00t/language-stylus/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/d4rkr00t/language-stylus/pulls)


Adds syntax highlighting and code completion to `Stylus` files in Visual Studio Code.

### Features

* Syntax highlighting
* Symbols provider
* Completion for selectors, properties, values, variables, functions etc.
* Color preview
* Color picker

![Completion in Action](https://user-images.githubusercontent.com/14012511/142596271-9a31c14e-4df0-4b55-be9f-d0f28eba9a5d.gif)

![Symbols Provider in Action](https://user-images.githubusercontent.com/14012511/142596045-f3af818e-4df9-47b9-9c50-991bef2adfc6.gif)

### Custom Configuration
```js
{
  // Use ':' as separator between property and value
  "languageStylus.useSeparator": true, // default value
  // Toggle matches for Stylus Builtin Functions on autocomplete
  "languageStylus.useBuiltinFunctions": true, // default value
}
```

### Feature Request

Missing your wanted feature ? Please report it via [github issues](https://github.com/d4rkr00t/language-stylus/issues)
