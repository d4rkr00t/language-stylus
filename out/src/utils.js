"use strict";
/**
 * Removes falsy values from array
 * @param {Array} arr
 * @return Array
 */
function compact(arr) {
    return arr.filter(function (item) { return item; });
}
exports.compact = compact;
/**
 * Removes useless characters from symbol name
 * @param {String} name
 * @return String
 */
function prepareName(name) {
    return name.replace(/\{|\}/g, '').trim();
}
exports.prepareName = prepareName;
//# sourceMappingURL=utils.js.map