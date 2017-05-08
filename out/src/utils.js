"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Removes falsy values from array
 * @param {Array} arr
 * @return Array
 */
function compact(arr) {
    return arr.filter(item => item);
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
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            func(...args);
        }, wait);
    };
}
exports.debounce = debounce;
;
//# sourceMappingURL=utils.js.map