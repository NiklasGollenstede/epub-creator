(function(exports) { 'use strict';



exports = function collect() {

	const doc = document.querySelector('#container').cloneNode(true);

	const resources = Array.map(doc.querySelectorAll('img'), ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], }));
	const title = doc.querySelector('#reader-title').textContent;

	Array.forEach(doc.querySelectorAll('img'), img => {
		!img.alt && (img.alt = 'IMAGE');
		img.src = img.src.match(/:\/\/.*?\/(.*)$/)[1];
	});
	Array.forEach(doc.querySelectorAll('style, link, menu'), element => element.remove());

	return ({
		chapters: [ {
			name: 'content.xhtml',
			title,
			content: doc.outerHTML
				.replace(/(<[^>]+?) ?class=""/g, '$1')
				.replace(/(<[^>]+?) ?style=""/g, '$1')
				.replace(/<img.*?>/g, m => m +'</img>')
				.replace(/<br.*?>/g, m => m +'</br>')
				.replace(/&nbsp;/g, ' '),
			mimeType: 'text/xhtml-body',
			linear: true,
		}, ],
		title,
		description: `Offline reader version of [${ doc.querySelector('#reader-domain').href }]`,
		language: null,
		creator: [ ],
		resources,
		cover: false,
		nav: false,
	});
};

const moduleName = 'collect/aboutReader'; if (typeof module !== 'undefined') { module.exports = exports; } else if (typeof define === 'function') { define(moduleName, exports); } else if (typeof window !== 'undefined' && typeof module === 'undefined') { window[moduleName] = exports; } return exports; })({ });
