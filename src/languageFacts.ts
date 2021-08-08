/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MarkdownString } from "vscode";

export type EntryStatus = 'standard' | 'experimental' | 'nonstandard' | 'obsolete';

export interface IReference {
	name: string;
	url: string;
}

export interface IValueData {
	name: string;
	description?: string;
	browsers?: string[];
	status?: EntryStatus;
	references?: IReference[];
}

export interface IProperty {
	name: string;
	description?: string;
	browsers?: string[];
	restrictions?: string[];
	status?: EntryStatus;
	syntax?: string;
	values?: IValueData[];
	references?: IReference[];
	relevance?: number;
};

export let browserNames = {
	E: 'Edge',
	FF: 'Firefox',
	S: 'Safari',
	C: 'Chrome',
	IE: 'IE',
	O: 'Opera'
};

function getEntryStatus(status: EntryStatus) {
	switch (status) {
		case 'experimental':
			return '⚠️ Property is experimental. Be cautious when using it.️\n\n';
		case 'nonstandard':
			return '🚨️ Property is nonstandard. Avoid using it.\n\n';
		case 'obsolete':
			return '🚨️️️ Property is obsolete. Avoid using it.\n\n';
		default:
			return '';
	}
}

export function textToMarkedString(text: string) {
	text = text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
	return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Input is like `["E12","FF49","C47","IE","O"]`
 * Output is like `Edge 12, Firefox 49, Chrome 47, IE, Opera`
 */
 export function getBrowserLabel(browsers: string[] = []): string | null {
	if (browsers.length === 0) {
		return null;
	}

	return browsers
		.map(b => {
			let result = '';
			const matches = b.match(/([A-Z]+)(\d+)?/)!;

			const name = matches[1];
			const version = matches[2];

			if (name in browserNames) {
				result += browserNames[name as keyof typeof browserNames];
			}
			if (version) {
				result += ' ' + version;
			}
			return result;
		})
		.join(', ');
}

export function getPropertyDescription(entry: IProperty): MarkdownString {
	if (!entry.description || entry.description === '') {
		return new MarkdownString('');
	}

	let result: string = '';

	if (entry.status) {
		result += getEntryStatus(entry.status);
	}

	result += textToMarkedString(entry.description);
	const browserLabel = getBrowserLabel(entry.browsers);
	if (browserLabel) {
		result += '\n\n(' + textToMarkedString(browserLabel) + ')';
	}
	if ('syntax' in entry && entry.syntax) {
		result += `\n\nSyntax: ${textToMarkedString(entry.syntax)}`;
	}

	if (entry.references && entry.references.length > 0) {
		if (result.length > 0) {
			result += '\n\n';
		}
		result += entry.references.map(r => {
			return `[${r.name}](${r.url})`;
		}).join(' | ');
	}

	return new MarkdownString(result);
}