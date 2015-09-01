(function(exports) { 'use strict';

/**
 * Collects the contents of an about:reader view.
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */
exports = function collect() {

	const doc = document.querySelector('#container').cloneNode(true);

	const resources = Array.map(doc.querySelectorAll('img'), ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], }));
	const title = doc.querySelector('#reader-title').textContent;

	Array.forEach(doc.querySelectorAll('img'), img => {
		!img.alt && (img.alt = 'IMAGE');
		img.src = img.src.match(/:\/\/.*?\/(.*)$/)[1];
	});
	Array.forEach(doc.querySelectorAll('style, link, menu'), element => element.remove());
	Array.forEach(doc.querySelectorAll('*'), element => {
		element.removeAttribute('style');
		element.removeAttribute('class');
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
		description: `Offline reader version of [${ doc.querySelector('#reader-domain').href }]`,
		language: null,
		creator: [ ], // TODO: try to extract meta data
		resources,
		cover: false,
		nav: false,
	});
};

const serializer = new XMLSerializer;
function toXML(element) {
	return serializer.serializeToString(element);
}

const moduleName = 'collect/aboutReader'; if (typeof module !== 'undefined') { module.exports = exports; } else if (typeof define === 'function') { define(moduleName, exports); } else if (typeof window !== 'undefined' && typeof module === 'undefined') { window[moduleName] = exports; } return exports; })({ });
