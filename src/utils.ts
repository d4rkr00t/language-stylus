/**
 * Removes falsy values from array
 * @param {Array} arr
 * @return Array
 */
export function compact(arr: Array<any>): Array<any> {
	return arr.filter(item => item);
}

/**
 * Removes useless characters from symbol name
 * @param {String} name
 * @return String
 */
export function prepareName(name: string): string {
	return name.replace(/\{|\}/g, '').trim();
}

export function debounce(func: (...args: any) => void, wait: number) {
	let timeout: NodeJS.Timeout;

	return (...args: any) => {
		clearTimeout(timeout);

		timeout = setTimeout(() => {
			timeout = null;
			func(...args);
		}, wait);
	};
};
