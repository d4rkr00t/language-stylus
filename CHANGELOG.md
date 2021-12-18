# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.15.0] - 2021-12-18
### Fixed
- Fix color preview not functioning properly when using hex values, close [#96](https://github.com/d4rkr00t/language-stylus/issues/96)
- Upgrade `stylus` and `vscode-css-languageservice` to latest version

## [1.14.1] - 2021-11-25
### Fixed
- Fix duplicated color preview square shown, close [#65](https://github.com/d4rkr00t/language-stylus/issues/65)

## [1.14.0] - 2021-11-22
### Fixed
- Fix `css variables` and `at_rule` syntax highlight

### Added
- `var()` and `calc()` css builtin function autocomplete support
- color picker support, to fix [#51](https://github.com/d4rkr00t/language-stylus/issues/51)

### Changed
- Change `css function` automplete behavior, set cursor into the position between parens
- Bump `vscode-css-languageservice` from `v5.1.4` to `v5.1.8`