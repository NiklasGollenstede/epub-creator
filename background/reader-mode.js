(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { Tabs, },
	'node_modules/web-ext-utils/loader/views': { openView, },
	'shim!node_modules/readability/Readability:Readability': Readability,
}) => async url => {

/**
 * Can't access pages in reader mode (yet?), so this emulates the reader mode
 * in an extension view to transparently run content scripts in it.
 */

// normalize url and start document download
// TODO: should grab the DOM of the rendered page (after 'load' event?)
url = url.replace(/^about:reader\?url=(.*)$/, (_, url) => decodeURIComponent(url));
const getHtml = fetch(url).then(_=>_.text());

// prepare a fake content page (needs to be visible to load)
const { view, view: { document, }, tabId, } = (await openView(
	'reader-mode-fix', 'popup', { width: 500, height: 500, }, // must be large enough for prompt()
)); try {

	document.head.innerHTML = `
<style> :root {
	background: #424F5A; filter: invert(1) hue-rotate(180deg);
	font-family: Segoe UI, Tahoma, sans-serif;
	padding: 20px; text-align: center;
} </style>`;
	document.body.innerHTML = `
<h1>Loading ...<br><small>Please keep this open.</small></h1>
<div class="container" style="display:none">
	<div class="header reader-header">
		<a class="domain reader-domain" href="$uri.spec">$uri.host</a>
		<h1 class="reader-title">$title</h1>
		<div class="credits reader-credits">$credits</div>
	</div>
	<hr><div class="content">$content</div>
</div>`;

	// load the module loader
	(await new Promise(callback => {
		view.require = { callback, };
		const script = document.createElement('script');
		script.src = 'node_modules/web-ext-utils/lib/pbq/require.js?baseUrl=/';
		document.head.appendChild(script);
	}));
	const { require, } = view, collector = 'about-reader';

	// build the reader mode DOM content
	const doc = new view.DOMParser().parseFromString((await getHtml), 'text/html');
	const parsed = new Readability(makeURI(new URL(url)), doc).parse();
	document.querySelector('.reader-domain').href = parsed.uri.spec || '';
	document.querySelector('.reader-domain').textContent = (parsed.uri.host || '').replace(/^www\./, '');
	document.querySelector('.reader-title').textContent = parsed.title || '';
	document.querySelector('.reader-credits').textContent = parsed.byline || '';
	document.querySelector('.container>.content').innerHTML = sanatize(parsed.content || ''); // https://github.com/mozilla/readability/issues/404

	// and now we can pretend that we are in a content script on `about:reader?url=${url}`:
	const name = (await require.async('content/collect').then(_=>_(collector)));

	document.body.innerHTML = `<h1>Done!<br><small>Please close the window once the ePub is saved.</small></h1>`;
	return name || false;
} catch (error) {
	Tabs.remove(tabId);
	throw error;
}


/**
 * Removes any tags (not their content) that are not listed in 'allowed' and any attributes
 * except for href (not data: or javascript:) and title (order must be href, title)
 * @param  {string}   html  Untrusted HTML markup.
 * @return {string}         Sanitized, simple HTML.
 */
function sanatize(html) {
	const allowed = /^(?:a|abbr|b|big|br|code|div|i|p|pre|kbd|li|ol|ul|semantics|small|spam|span|sup|sub|tt|var|math|annotation(?:-xml)?|m(?:enclose|error|fenced|frac|i|n|o|over|padded|root|row|s|space|sqrt|sub|supsubsup|table|td|text|tr|under|underover))$/;
	return html.replace(
		(/<(\/?)(\w+)[^>]*?(\s+href="(?!(?:javascript|data):)[^"]*?")?(\s+title="[^"]*?")?[^>]*?>/g), // this is probably not precise enough for malformed HTML (but the HTML returned by Readability is a serialized DOM, so it shouldn't be malformed)
		(match, slash, tag, href, title) => allowed.test(tag) ? ('<'+ slash + tag + (title || '') + (href ? href +'target="_blank"' : '') +'>') : ''
	);
}

function makeURI(url) { return {
	spec: url.href, host: url.host,
	prePath: url.protocol + "//" + url.host,
	scheme: url.protocol.substr(0, url.protocol.indexOf(":")),
	pathBase: url.protocol + "//" + url.host + url.pathname.substr(0, url.pathname.lastIndexOf("/") + 1),
}; }

}); })(this);
