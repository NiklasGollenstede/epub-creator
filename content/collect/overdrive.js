(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/utils/inject': { inject, },
}) => async function collect(options = { }) { /* global window, */
/**
 * Collects the book contents from the online reader of overdrive.com.
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */

// get a JSON clone of window.wrappedJSObject.bData
const bData = inject(() => window.bData);

const resources = [ ]; let nav = false, cover = false;

const chapters = (await Promise.all(bData.spine.map(async ({
	path, '-odread-original-path': name, linear,
}, index) => { let frame; {
	frame = global.document.createElement('iframe');
} try {
	frame.style.visibility = 'none'; frame.style.pointerEvents = 'none';
	(await new Promise((onload, onerror) => {
		frame.onload = onload; frame.onerror = onerror;
		frame.src = path; global.document.body.appendChild(frame);
	})); frame.onload = frame.onerror = null;
	const { document, window, } = frame.contentWindow;
	if (document.title.trim() === 'Not found - OverDrive Read') { return null; }

	// remove duplicate images
	document.querySelectorAll('img').forEach(e => e.previousSibling && e.previousSibling.src === e.src && e.remove());
	// find linked images
	resources.push(...Array.from(document.images, ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], })));

	const styles = new Map([ [ '', 0, ], ]);
	document.querySelectorAll('*').forEach(element => {
		const style = element.getAttribute('style') || '';
		if (style && !styles.has(style)) {
			styles.set(style, styles.size);
		}
		const index = styles.get(style);
		element.removeAttribute('style');
		element.removeAttribute('data-loc');
		const computed = window.getComputedStyle(element);
		if (index && options.styles) {
			element.className = 'inline-'+ index;
		} else {
			element.removeAttribute('class');
		}
		// TODO: this doesn't work
		computed.fontStyle !== 'normal' && element.classList.add('italic');
		(/^underline /).test(computed.textDecoration) && element.classList.add('underline');
		computed.fontWeight >= 500 && element.classList.add('bold');
	});
	styles.delete('');

	let css = (`
		img { max-width: 100%; max-width: 100vw; }
		.italic { font-style: italic; }
		.underline { text-decoration: underline; }
		.bold { font-weight: bold; }
	`);
	options.styles && (css += Array.from(styles, ([ style, index, ]) => `\t\t.inline-${index} { ${style} }\n`).join(''));

	// html clean-up
	document.documentElement.setAttribute('xmlns', "http://www.w3.org/1999/xhtml");
	document.querySelectorAll('style, link, menu').forEach(element => element.remove());
	document.querySelectorAll('img').forEach(img => !img.alt && (img.alt = 'IMAGE'));

	// find meta data
	!name && (name = (document.querySelector('base') && document.querySelector('base').href.match(/^.*?:\/\/.*?\/(.*?)$/) || [])[1]);
	const navToc = name && findRecursive(bData.nav.toc, ({ path, }) => (path.replace(/[?#].*/, '')) === name, 'contents');
	const title = navToc && navToc.title || (document.querySelector('h1, h2, h3, h4') || { textContent: '', }).textContent || document.title;

	// TODO: use something nicer than 'innerHTML ='
	document.querySelector('head').innerHTML = `<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8"><title></title><style></style>`;
	document.querySelector('title').textContent = title;
	document.querySelector('style').textContent = css;

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
		content: toXML(document).replace(/^.*?>/, `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n`),
		mimeType: 'xhtml', // toXML produces xhtml
		linear,
	});
} finally {
	frame.remove();
} }))).filter(_=>_);

return ({
	chapters,
	title: bData.title.main,
	description: bData.description,
	language: bData.language,
	creator: bData.creator,
	resources,
	cover,
	nav: nav || true,
});

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

function toXML(element) {
	return (new global.XMLSerializer).serializeToString(element);
}

}); })(this);
