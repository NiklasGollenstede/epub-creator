(function() { 'use strict';

/**
 * Collects the contents of an about:reader view.
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */
window.collect = function collect() {

	const doc = document.querySelector('#container').cloneNode(true);

	const resources = Array.map(doc.querySelectorAll('img'), ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], }));
	const title = doc.querySelector('#reader-title').textContent;
	const url = doc.querySelector('#reader-domain').href;
	const author = prompt(
		'Please enter/confirm the authors name',
		(
			doc.querySelector('.vcard .author.fn') || doc.querySelector('.vcard .author') || doc.querySelector('.author')
			|| doc.querySelector('#reader-credits') || { textContent: '<unknown>', }
		).textContent
	);
	if (author === null) { throw new Error('__MSG__Operation_canceled'); }

	Array.forEach(doc.querySelectorAll('img'), img => {
		!img.alt && (img.alt = 'IMAGE');
		img.src = img.src.match(/:\/\/.*?\/(.*)$/)[1];
	});
	Array.forEach(doc.querySelectorAll('style, link, menu'), element => element.remove());
	Array.forEach(doc.querySelectorAll('*'), element => {
		for (var i = element.attributes.length; i-- > 0;) {
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
		description: `Offline reader version of ${ url }`,
		language: null,
		creator: [
			{ name: author, role: 'author', },
		],
		resources,
		cover: false,
		nav: false,
	});
};

const serializer = new XMLSerializer;
function toXML(element) {
	return serializer.serializeToString(element);
}

})();
