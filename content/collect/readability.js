(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { manifest, },
	'shim!node_modules/readability/Readability:Readability': Readability,
	aboutReader,
}) => async function collect({ document: srcDoc = global.document.cloneNode(true), url = srcDoc.URL, } = { }) { /* globals URL, */
/**
 * Collects the contents of any website that can be opened in the `about:reader` view.
 * Since extensions can't access pages in reader mode any more, this emulates the reader mode
 * in the original content page and then proceeds as if it was loaded in `about:reader`.
 * (This workaround is kept for now to be able to switch back to the reader view if it ever becomes accessible again.)
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */

const parsed = new Readability(srcDoc, { }).parse();
if (!parsed) { const error = new Error(`The version of the reader mode included with ${manifest.name} was unable to parse this article.`); error.title = 'Page could not be parsed'; throw error; }

// build the reader mode DOM content
const document = new global.DOMParser().parseFromString(`<!DOCTYPE html>
<html><head><meta http-equiv="Content-Security-Policy" content="default-src chrome:; img-src data: *; media-src *"></head><body>
<div class="container">
	<div class="header reader-header">
		<a class="domain reader-domain" href="$uri.spec">$uri.host</a>
		<span class="reader-date">$date</span>
		<h1 class="reader-title">$title</h1>
		<div class="credits reader-credits">$credits</div>
	</div>
	<hr><div class="content">$content</div>
</div></body></html>`, 'text/html');
document.querySelector('.reader-domain').href = url;
document.querySelector('.reader-domain').textContent = (new URL(url).host || '').replace(/^www\./, '');
document.querySelector('.reader-date').textContent = ` (${new Date().toISOString().replace(/T.*/, '')})`;
document.querySelector('.reader-title').textContent = parsed.title || '';
document.querySelector('.reader-credits').textContent = parsed.byline || '';
document.querySelector('.container>.content').innerHTML = parsed.content; // this is not a live document, so this should be unproblematic: https://github.com/mozilla/readability/issues/404

const content = (await aboutReader({ document, }));
return content && {
	...content,
	language: global.document.documentElement.lang || global.document.body.lang || content.language,
};

}); })(this);
