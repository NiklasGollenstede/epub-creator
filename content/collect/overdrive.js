(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/utils/inject': { inject, },
	module,
}) => { /* global window, */


/**
 * Collects the book contents from the online reader of overdrive.com.
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */
module.exports = async function collect(options = { }) {

	// get a JSON clone of  window.wrappedJSObject.bData
	const bData = inject(() => window.bData);

	const resources = [ ];
	let nav = false;
	let cover = false;

	return ({
		chapters: (await Promise.all(bData.spine.map(async ({ path, }) => {
			let frame = global.document.querySelector('iframe[src="'+ path +'"]');
			if (frame) { return frame.contentDocument.documentElement.cloneNode(true); }

			frame = global.document.createElement('iframe'); frame.src = path;
			const loaded = new Promise((resolve, reject) => { frame.onload = resolve; frame.onerror = reject; });
			global.document.body.appendChild(frame); (await loaded);
			const doc = frame.contentDocument.title.trim() === 'Not found - OverDrive Read' ? null : frame.contentDocument.documentElement;
			if (doc) { doc.remove(); global.document.adoptNode(doc); /* avoid deadO objects in firefox */ }
			frame.remove(); return doc;
			// new global.DOMParser().parseFromString((await (await global.fetch(path)).text()), type).documentElement
		}))).filter(_=>_).map((doc, index) => {

			// find linked images
			resources.push(...Array.from(doc.querySelectorAll('img'), ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], })));

			// html clean-up
			doc.setAttribute('xmlns', "http://www.w3.org/1999/xhtml");
			doc.querySelectorAll('style, link, menu').forEach(element => element.remove());
			doc.querySelectorAll('img').forEach(img => !img.alt && (img.alt = 'IMAGE'));

			const styles = new Map([ [ '', 0, ], ]);

			doc.querySelectorAll('img').forEach(e => e.previousSibling && e.previousSibling.src === e.src && e.remove());

			doc.querySelectorAll('*').forEach(element => {
				const style = element.getAttribute('style');
				if (style && !styles.has(style)) {
					styles.set(style, styles.size);
				}
				const index = styles.get(style);
				element.removeAttribute('style');
				element.removeAttribute('data-loc');
				if (index && options.styles) {
					element.className = 'inline'+ index;
				} else {
					element.removeAttribute('class');
				}
			});

			let css = '';
			styles.forEach((index, style) => (css += style && ('\t\t\t.inline'+ index +' { '+ style +' }\n') || ''));

			// find meta data
			const name = (doc.querySelector('base') && doc.querySelector('base').href.match(/^.*?:\/\/.*?\/(.*?)$/) || [])[1];
			const navToc = name && findRecursive(bData.nav.toc, ({ path, }) => (path.replace(/[?#].*/, '')) === name, 'contents');
			const spine = name && findRecursive(bData.spine, ({ path, }) => (path.replace(/[?#].*/, '')) === name, 'contents');
			const title = navToc && navToc.title || (doc.querySelector('h1, h2, h3, h4') || { textContent: '', }).textContent;

			// TODO: use something nicer than 'innerHTML ='
			doc.querySelector('head').innerHTML = (`
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>
			${ (doc.querySelector('title') && doc.querySelector('title').innerHTML).trim() }
		</title>`) + (options.styles && css && `
		<style id="inlinetyles" type="text/css">
			${ css }
		</style>
` || '');

			// check if this document represents the (first) cover or ToC
			if (!nav && (
				name && (/^(content|contents|nav|navigation|inhalt)$/i).test((name.match(/\/(.*?)\.\w{1,10}$/) || [ '', '', ])[1])
				|| title && (/^(content|contents|nav|navigation|inhalt)$/i).test(title)
			)) {
				nav = decodeURI(name);
			}
			if (!cover && (
				name && (/^(cover|title|titel)$/i).test((name.match(/\/(.*?)\.\w{1,10}$/) || [ '', '', ])[1])
				|| title && (/^(cover|title|titel)$/i).test(title)
			)) {
				cover = decodeURI(name);
			}


			return ({
				name: name && decodeURI(name) || 'unnamed'+ index +'.html',
				title,
				content: toXML(doc),
				mimeType: spine && spine['media-type'] || doc.doctype && doc.doctype.name || 'xhtml',
				linear: spine && spine.linear,
			});
		}), // chapters
		title: bData.title.main,
		description: bData.description,
		language: bData.language,
		creator: bData.creator,
		resources,
		cover,
		nav: nav || true,
	});
};

function findRecursive(array, test, key) {
	let result;
	function find(item, index, array) {
		if (test(item, index, array)) {
			result = item;
			return true;
		}
		if (key === undefined && Array.isArray(item)) {
			return item.some(find);
		}
		if (Array.isArray(item[key])) {
			return item[key].some(find);
		}
		return false;
	}
	array.some(find);
	return result;
}

const serializer = new global.XMLSerializer;
function toXML(element) {
	return serializer.serializeToString(element);
}

}); })(this);
