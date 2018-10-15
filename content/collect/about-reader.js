(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
}) => async function collect({ document = global.document, } = { }) {
/**
 * Collects the contents of an about:reader view.
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */

const doc = document.querySelector('.container').cloneNode(true);

const resources = (await Promise.all(Array.map(doc.querySelectorAll('img'), async img => {
	const { src, } = img, name = img.src = (await sha1(src)) +'/'+ src.match(/[^/]*[/]?(?:[?]|#|$)/)[0];
	return { src, name, };
})));
const title = doc.querySelector('.reader-title').textContent;
const url = doc.querySelector('.reader-domain').href;
const author = global.prompt('Please enter/confirm the authors name', (
	doc.querySelector('.vcard .author.fn') || doc.querySelector('.vcard .author') || doc.querySelector('.author')
	|| doc.querySelector('.reader-credits') || { textContent: '<unknown>', }
).textContent.replace(/\s+/g, ' ') || '<unknown>');
if (author == null) { return null; }

Array.forEach(doc.querySelectorAll('style, link, menu'), element => element.remove());
Array.forEach(doc.querySelectorAll('*'), element => {
	for (let i = element.attributes.length; i-- > 0;) {
		const attr = element.attributes[i];
		if ([ 'class', 'src', 'href', 'title', 'alt', ].includes(attr.name)) { continue; }
		element.removeAttributeNode(attr);
	}
});

return ({
	chapters: [ {
		name: 'content.xhtml',
		title,
		content: toXML(doc),
		mimeType: 'text/xhtml-body',
		linear: true,
	}, ],
	title,
	description: `Offline reader version of ${url}`,
	language: null,
	creator: [ { name: author, role: 'author', }, ],
	resources,
	cover: false,
	nav: false,
});


function toXML(element) {
	return (new global.XMLSerializer).serializeToString(element);
}

async function sha1(string) {
	const hash = (await global.crypto.subtle.digest('SHA-1', new global.TextEncoder('utf-8').encode(string)));
	return Array.from(new Uint8Array(hash)).map((b => b.toString(16).padStart(2, '0'))).join('');
}

}); })(this);
