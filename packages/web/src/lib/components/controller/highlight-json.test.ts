import { describe, expect, it } from 'vitest';
import { highlightJson } from './highlight-json';

describe('highlightJson', () => {
	it('marks object keys', () => {
		expect(highlightJson('{"air":100}')).toContain('<span class="hljs-attr">&quot;air&quot;</span>');
	});

	it('marks numbers', () => {
		expect(highlightJson('{"air":100}')).toContain('<span class="hljs-number">100</span>');
	});

	it('marks string values', () => {
		expect(highlightJson('{"mission":"patrol"}')).toContain('<span class="hljs-string">&quot;patrol&quot;</span>');
	});

	it('marks null and boolean literals', () => {
		const highlighted = highlightJson('{"destination":null,"locked":true}');

		expect(highlighted).toContain('<span class="hljs-literal"><span class="hljs-keyword">null</span></span>');
		expect(highlighted).toContain('<span class="hljs-literal"><span class="hljs-keyword">true</span></span>');
	});

	it('marks structural punctuation', () => {
		expect(highlightJson('[]')).toContain('<span class="hljs-punctuation">[</span>');
	});

	it('escapes markup in string values so it cannot inject elements', () => {
		const highlighted = highlightJson('{"name":"<img src=x onerror=alert(1)>"}');

		expect(highlighted).not.toContain('<img');
		expect(highlighted).toContain('&lt;img');
	});
});
