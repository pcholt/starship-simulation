import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', json);

export function highlightJson(jsonText: string): string {
	return hljs.highlight(jsonText, { language: 'json' }).value;
}
