(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { Tabs, Sessions, Windows, },
	'node_modules/web-ext-utils/loader/views': { openView, },
	'shim!node_modules/readability/Readability:Readability': Readability,
}) => async url => { /* globals fetch, */

/**
 * Can't access pages in reader mode (yet?), so this emulates the reader mode
 * in an extension view to transparently run content scripts in it.
 */

// normalize url and start document download
// TODO: should grab the DOM of the rendered page (after 'load' event?)
url = url.replace(/^about:reader\?url=(.*)$/, (_, url) => decodeURIComponent(url));
const getHtml = fetch(url).then(_=>_.text());

// prepare a fake content page (needs to be visible to load)
const { view, tabId, windowId, } = (await openView(
	'reader-mode-fix', 'popup', { width: 500, height: 500, }, // must be large enough for prompt()
)); try {

	// remove this popup from the window history once closed
	windowId && Sessions && Windows && Windows.onRemoved.addListener(async function forget(closedId) {
		if (closedId !== windowId) { return; } Windows.onRemoved.removeListener(forget);
		const session = (await Sessions.getRecentlyClosed({ maxResults: 1, }))[0];
		session && session.window && Sessions.forgetClosedWindow(session.window.sessionId);
	});

	// add "UI"
	view.document.head.innerHTML = `
<style> :root {
	background: #424F5A; filter: invert(1) hue-rotate(180deg);
	font-family: Segoe UI, Tahoma, sans-serif;
	padding: 20px; text-align: center;
} </style>`;
	view.document.body.innerHTML = `
<h1>Loading ...<br><small>Please keep this open.</small></h1>`;

	// load the module loader
	(await new Promise((callback, errback) => {
		view.require = { callback, errback, };
		const script = view.document.createElement('script'); script.onerror = errback;
		script.src = 'node_modules/pbq/require.js?baseUrl=/';
		view.document.head.appendChild(script);
	}));
	const { require, } = view, collector = 'about-reader';

	// build the reader mode DOM content
	const parsed = new Readability(new view.DOMParser().parseFromString((await getHtml), 'text/html'), { }).parse();
	const document = new view.DOMParser().parseFromString(`<!DOCTYPE html>
<html><head><meta http-equiv="Content-Security-Policy" content="default-src chrome:; img-src data: *; media-src *"></head><body>
<div class="container">
	<div class="header reader-header">
		<a class="domain reader-domain" href="$uri.spec">$uri.host</a>
		<h1 class="reader-title">$title</h1>
		<div class="credits reader-credits">$credits</div>
	</div>
	<hr><div class="content">$content</div>
</div></body></html>`, 'text/html');
	document.querySelector('.reader-domain').href = url || '';
	document.querySelector('.reader-domain').textContent = (new URL(url).host || '').replace(/^www\./, '');
	document.querySelector('.reader-title').textContent = parsed.title || '';
	document.querySelector('.reader-credits').textContent = parsed.byline || '';
	document.querySelector('.container>.content').innerHTML = parsed.content; // this is not a live document, so this should be unproblematic: https://github.com/mozilla/readability/issues/404

	// and now we can pretend that we are in a content script on `about:reader?url=${url}`:
	const name = (await require.async('content/collect').then(_=>_(collector, { document, })));

	view.document.body.innerHTML = name ? `<h1>Done!<br><small>Please close this window once the ePub is saved.</small></h1>` : `<h1>Canceled!<br><small>Please close this window.</small></h1>`;
	return name || false;
} catch (error) {
	Tabs.remove(tabId);
	throw error;
}

}); })(this);
