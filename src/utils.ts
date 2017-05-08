/**
 * Removes falsy values from array
 * @param {Array} arr
 * @return Array
 */
export function compact(arr:Array<any>) : Array<any> {
  return arr.filter(item => item);
}

/**
 * Removes useless characters from symbol name
 * @param {String} name
 * @return String
 */
export function prepareName(name:string) : string {
  return name.replace(/\{|\}/g, '').trim();
}

export function debounce(func, wait) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
};
