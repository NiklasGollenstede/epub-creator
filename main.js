'use strict';

const { viewFor } = require("sdk/view/core");
const Windows = require("sdk/windows").browserWindows;
const Tabs = require("sdk/tabs");
const { ActionButton, } = require("sdk/ui");
const Prefs = require("sdk/simple-prefs").prefs;

const { concurrent: { spawn, sleep, }, functional: { log, }, } = require('es6lib');

const { EPub, } = require('./epub.js');

const runInTab = require('es6lib/runInTab');

/**
 * Adds a toolbar button that starts the ebook saving/download when clicked while a supported url os open in the activeTab.
 */
ActionButton({
	id: 'button',
	label: 'Save as ePub',
	icon: { 16: './../icon.png', 32: './../icon.png', 64: './../icon.png', },
	onClick: function() {
		spawn(function*() {

			this.progress('Collecting data', 0, true);
			const tab = Tabs.activeTab;
			let options;
			if (/about\:reader\?url\=/.test(tab.url)) {
				options = yield(runInTab(tab, './../collect/aboutReader.js', () => (require("collect/aboutReader")())));
			} else if (/https:\/\/[^\/]*read\.overdrive\.com/.test(tab.url)) {
				options = yield(runInTab(tab, './../collect/overdrive.js', () => (require("collect/overdrive")())));
			} else {
				viewFor(Windows.activeWindow).alert('Page not supported, try opening the Reader View.');
				throw new Error('ePub collection not supported for: "'+ tab.url +'"');
			}
			// console.log('options', options);

			this.progress('Building book', 30);
			const book = new EPub(Object.assign(options, { markNav: Prefs.setNavProperty, }));

			this.progress('Loading images', 50);
			yield(book.loadResources());
			// console.log('book', book);

			this.progress('Saving file', 80);
			book.save(viewFor(Windows.activeWindow).gBrowser.contentWindow); // will break with s10s, is there an alternative way of opening the download dialog?

			this.progress('Book saved', 100);
			console.info('Saved ePub as', book.name);
			yield(sleep(1500));

		}, this)
		.catch(error => console.error('collection threw', error))
		.then(() => this.progress('Save as ePub', null, false));
	},
})
.progress = function(label, badge, disabled) {
	switch (arguments.length) {
		default:
		case 3: this.disabled = disabled;
		/* falls through */
		case 2: this.badge = badge;
		/* falls through */
		case 1: this.label = label;
		/* falls through */
		case 0:
	}
};
