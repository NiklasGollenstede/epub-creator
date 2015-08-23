'use strict';

const { viewFor } = require("sdk/view/core");
const Windows = require("sdk/windows").browserWindows;
const Tabs = require("sdk/tabs");
const { ActionButton, } = require("sdk/ui");

const { concurrent: { spawn, }, functional: { log, }, } = require('es6lib');

const { EPub, } = require('./epub.js');

const runInTab = require('es6lib/runInTab');

ActionButton({
	id: 'button',
	label: 'Button',
	icon: { 16: './../icon.png', 32: './../icon.png', 64: './../icon.png', },
	onClick: () => spawn(function*() {

		const tab = Tabs.activeTab;

		let options;
		if (/about\:reader\?url\=/.test(tab.url)) {
			options = yield(runInTab(tab, './../collect/aboutReader.js', () => (require("collect/aboutReader")())));
		} else if (/https:\/\/[^\/]*read\.overdrive\.com/.test(tab.url)) {
			options = yield(runInTab(tab, './../collect/overdrive.js', () => (require("collect/overdrive")())));
		} else {
			yield runInTab(tab, () => window.alert('Page not supported'));
			throw new Error('ePub collection not supported for: "'+ tab.url +'"');
		}

		console.log('options', options);

		const book = new EPub(options);
		// console.log('book', book);

		yield(book.loadResources());
		console.log('book', book);

		book.save(viewFor(Windows.activeWindow).gBrowser.contentWindow);

	}).catch(error => console.error('collection threw', error)),
});
