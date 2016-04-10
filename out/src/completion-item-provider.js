"use strict";
var vscode_1 = require('vscode');
var cssSchema = require('./css-schema');
function isClassOrId(currentWord) {
    return currentWord.startsWith('.') || currentWord.startsWith('#');
}
exports.isClassOrId = isClassOrId;
function isAtRule(currentWord) {
    return currentWord.startsWith('\@');
}
exports.isAtRule = isAtRule;
function isValue(cssSchema, currentWord) {
    var property = getPropertyName(currentWord);
    return property && Boolean(findPropertySchema(cssSchema, property));
}
exports.isValue = isValue;
function getPropertyName(currentWord) {
    return currentWord.trim().replace(':', ' ').split(' ')[0];
}
exports.getPropertyName = getPropertyName;
function findPropertySchema(cssSchema, property) {
    return cssSchema.data.css.properties.find(function (item) { return item.name === property; });
}
exports.findPropertySchema = findPropertySchema;
function getClassesOrIds(cssSchema, currentWord) {
    if (!isClassOrId(currentWord))
        return [];
    return [];
}
exports.getClassesOrIds = getClassesOrIds;
function getAtRules(cssSchema, currentWord) {
    if (!isAtRule(currentWord))
        return [];
    return cssSchema.data.css.atdirectives.map(function (property) {
        var completionItem = new vscode_1.CompletionItem(property.name);
        completionItem.insertText = property.name.replace(/^@/, '');
        completionItem.detail = property.desc;
        completionItem.kind = vscode_1.CompletionItemKind.Keyword;
        return completionItem;
    });
}
exports.getAtRules = getAtRules;
function getProperties(cssSchema, currentWord) {
    if (isClassOrId(currentWord) || isAtRule(currentWord))
        return [];
    return cssSchema.data.css.properties.map(function (property) {
        var completionItem = new vscode_1.CompletionItem(property.name);
        completionItem.insertText = property.name + ': ';
        completionItem.detail = property.desc;
        completionItem.kind = vscode_1.CompletionItemKind.Property;
        return completionItem;
    });
}
exports.getProperties = getProperties;
function getValues(cssSchema, currentWord) {
    var property = getPropertyName(currentWord);
    var values = findPropertySchema(cssSchema, property).values;
    if (!values)
        return [];
    return values.map(function (property) {
        var completionItem = new vscode_1.CompletionItem(property.name);
        completionItem.detail = property.desc;
        completionItem.kind = vscode_1.CompletionItemKind.Value;
        return completionItem;
    });
}
exports.getValues = getValues;
// TODO: Symbols completion
// TODO: Better value completion
// TODO: Tags completion
// TODO: SVG properties completion
var StylusCompletion = (function () {
    function StylusCompletion() {
    }
    StylusCompletion.prototype.provideCompletionItems = function (document, position, token) {
        var start = new vscode_1.Position(position.line, 0);
        var range = new vscode_1.Range(start, position);
        var currentWord = document.getText(range);
        var value = isValue(cssSchema, currentWord);
        var classesOrIds = [], atRules = [], properties = [], values = [];
        if (value) {
            values = getValues(cssSchema, currentWord);
        }
        else {
            classesOrIds = getClassesOrIds(cssSchema, currentWord);
            atRules = getAtRules(cssSchema, currentWord);
            properties = getProperties(cssSchema, currentWord);
        }
        var completions = [].concat(classesOrIds, atRules, properties, values);
        return completions;
    };
    return StylusCompletion;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StylusCompletion;
//# sourceMappingURL=completion-item-provider.js.map