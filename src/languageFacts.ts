/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Adopted from https://github.com/Microsoft/vscode-css-languageservice/blob/b3ff936/src/services/languageFacts.ts */

function getEntryStatus(status: string) {
	switch (status) {
		case 'e':
			return '⚠️ Property is experimental. Be cautious when using it.️\n\n';
		case 'n':
			return '🚨️ Property is nonstandard. Avoid using it.\n\n';
		case 'o':
			return '🚨️️️ Property is obsolete. Avoid using it.\n\n';
		default:
			return '';
	}
}

function getBrowserLabel(b: Browsers): string {
	let result = '';
	if (!b || b.all || b.count === 0) {
		return null;
	}
	for (let curr in browserNames) {
		if (typeof (<any>b)[curr] === 'string') {
			if (result.length > 0) {
				result = result + ', ';
			}
			result = result + (<any>browserNames)[curr];
			let version = (<any>b)[curr];
			if (version.length > 0) {
				result = result + ' ' + version;
			}
		}
	}
	return result;
}

export function getPropertyDescription(property: { desc: string; browsers: Browsers, status: string, syntax: string }): string | null {
	if (!property.desc || property.desc === '') {
		return null;
	}

	let desc: string = '';

	if (property.status) {
		desc += getEntryStatus(property.status);
	}

	desc += property.desc;

	let browserLabel = getBrowserLabel(property.browsers);
	if (browserLabel) {
		desc += '\n(' + browserLabel + ')';
	}
	if (property.syntax) {
		desc += `\n\nSyntax: ${property.syntax}`;
	}
	return desc;
}

export let browserNames = {
	E: 'Edge',
	FF: 'Firefox',
	S: 'Safari',
	C: 'Chrome',
	IE: 'IE',
	O: 'Opera'
};

export interface Browsers {
	E?: string;
	FF?: string;
	IE?: string;
	O?: string;
	C?: string;
	S?: string;
	count: number;
	all: boolean;
	onCodeComplete: boolean;
}
