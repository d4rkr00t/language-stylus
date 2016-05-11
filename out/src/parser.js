"use strict";
var stylus = require('stylus');
/**
 * Checks wether node is variable declaration
 * @param {StylusNode} node
 * @return {Boolean}
 */
function isVariableNode(node) {
    return node.nodeName === 'ident' && node.val && node.val.nodeName === 'expression';
}
exports.isVariableNode = isVariableNode;
/**
 * Checks wether node is function declaration
 * @param {StylusNode} node
 * @return {Boolean}
 */
function isFunctionNode(node) {
    return node.nodeName === 'ident' && node.val && node.val.nodeName === 'function';
}
exports.isFunctionNode = isFunctionNode;
/**
 * Checks wether node is selector node
 * @param {StylusNode} node
 * @return {Boolean}
 */
function isSelectorNode(node) {
    return node.nodeName === 'selector';
}
exports.isSelectorNode = isSelectorNode;
/**
 * Checks wether node is selector call node e.g.:
 * {mySelectors}
 * @param {StylusNode} node
 * @return {Boolean}
 */
function isSelectorCallNode(node) {
    return node.nodeName === 'call' && node.name === 'selector';
}
exports.isSelectorCallNode = isSelectorCallNode;
/**
 * Checks wether node is at rule
 * @param {StylusNode} node
 * @return {Boolean}
 */
function isAtRuleNode(node) {
    return ['media', 'keyframes', 'atrule', 'import', 'require', 'supports', 'literal'].indexOf(node.nodeName) !== -1;
}
exports.isAtRuleNode = isAtRuleNode;
/**
 * Parses text editor content and returns ast
 * @param {string} text - text editor content
 * @return {Object}
 */
function buildAst(text) {
    try {
        return new stylus.Parser(text).parse();
    }
    catch (error) {
        return [];
    }
}
exports.buildAst = buildAst;
/**
 * Flattens ast and removes useless nodes
 * @param {Object|Array} node
 * @return {Array}
 */
function flattenAndFilterAst(node) {
    if (Array.isArray(node)) {
        return node.reduce(function (acc, item) {
            return acc.concat(flattenAndFilterAst(item));
        }, []);
    }
    if (!node.nodeName)
        return;
    if (node.nodeName === 'property')
        return;
    if (node.nodeName === 'keyframes')
        return node;
    var nested = [];
    if (node.nodes) {
        nested = nested.concat(flattenAndFilterAst(node.nodes));
    }
    if (node.block) {
        nested = nested.concat(flattenAndFilterAst(node.block));
    }
    if (node.nodeName === 'group' || node.nodeName === 'root' || node.nodeName === 'block') {
        return nested.length ? nested : node;
    }
    // Hack prevents duplicated nodes.
    node.nodes = null;
    node.block = null;
    return nested.length ? [node].concat(nested) : node;
}
exports.flattenAndFilterAst = flattenAndFilterAst;
//# sourceMappingURL=parser.js.map