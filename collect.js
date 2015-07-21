(function(exports) { 'use strict';

exports = function collect() {
	const bData = JSON.parse(document.head.querySelector('script:not([src])').innerHTML.match(/^[ \t]*?window.bData = (.*);$/m)[1]);

	const findRecursive = (array, test, key) => {
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
		}
		array.some(find);
		return result;
	};

	const resources = [ ];
	let nav = true;

	return ({
		chapters: Array.map(document.querySelectorAll('.bounds>iframe'), (frame, index) => {
			const doc = frame.contentDocument.documentElement.cloneNode(true);
			// console.log('doc', doc.innerHTML);
			doc.setAttribute('xmlns', "http:\/\/www.w3.org/1999/xhtml");

			resources.push(...Array.map(doc.querySelectorAll('img'), ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], })));

			Array.forEach(doc.querySelectorAll('[data-loc]'), div => {
				delete div.dataset.loc;
				div.style = null;
				div.className = '';
			});

			Array.forEach(doc.querySelectorAll('style, link, menu'), element => element.remove());

			Array.forEach(doc.querySelectorAll('img'), img => !img.alt && (img.alt = 'IMAGE'));

			const name = (doc.querySelector('base') && doc.querySelector('base').href.match(/^.*?:\/\/.*?\/(.*?)$/) || [])[1];
			const navToc = name && findRecursive(bData.nav.toc, ({ path, }) => (path.substring(0, path.indexOf('?')) || path) === name, 'contents');
			const spine = name && findRecursive(bData.spine, ({ path, }) => (path.substring(0, path.indexOf('?')) || path) === name, 'contents');
			const title = navToc && navToc.title || (doc.querySelector('h1, h2, h3, h4') || { textContent: '<unknown>', }).textContent;

			doc.querySelector('head').innerHTML = `<title>${ doc.querySelector('title') && doc.querySelector('title').innerHTML }</title>`;

			if (
				name && (/^(content|contents|nav|navigation|inhalt)$/i).test((name.match(/\/(.*?)\.\w{1,10}$/) || [ '', '' ])[1])
				|| title && (/^(content|contents|nav|navigation|inhalt)$/i).test(title)
			) {
				nav = name;
			}


			return ({
				name: name || 'unnamed'+ index +'.html',
				title,
				content: doc.outerHTML
					.replace(/(<[^>]+?) ?class=""/g, '$1')
					.replace(/(<[^>]+?) ?style=""/g, '$1')
					.replace(/(<[^>]+?) ?data-loc="\d*"/g, '$1')
					.replace(/<img.*?>/g, m => m +'</img>') //(m, i, s) => s.startsWith('</img>', m.length + i) ? m : m + '</img>')
					.replace(/<br.*?>/g, m => m +'</br>') //(m, i, s) => s.startsWith('</br>', m.length + i) ? m : m + '</br>')
					.replace(/&nbsp;/g, ' '),
				mimeType: spine && spine['media-type'] || ((doc.doctype && doc.doctype.name || 'xhtml')),
				linear: spine && spine.linear,
			});
		}),
		title: bData.title.main,
		description: bData.description,
		language: bData.language,
		creator: bData.creator,
		resources, // TODO: make unique
		nav,
	});
};

const moduleName = 'collect/overdrive'; if (typeof module !== 'undefined') { module.exports = exports; } else if (typeof define === 'function') { define(moduleName, exports); } else if (typeof window !== 'undefined' && typeof module === 'undefined') { window[moduleName] = exports; } return exports; })({ });
