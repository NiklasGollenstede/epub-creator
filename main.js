(function(global) { 'use strict'; const factory = function mail(exports) { // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

require('chrome').Cu.importGlobalProperties([ 'URL', ]); /* globals URL */

const {
	concurrent: { async, sleep, },
	functional: { log, },
} = require('es6lib');

/**
 * Adds a toolbar button that starts the ebook saving/download when clicked while a supported url os open in the activeTab.
 */
new (require('sdk/ui').ActionButton)({
	id: 'button',
	label: 'Save as ePub',
	icon: { 16: './../icon.png', 32: './../icon.png', 64: './../icon.png', },
	onClick: async(function*() {
		const { viewFor } = require('sdk/view/core');
		const Windows = require('sdk/windows').browserWindows;
		const Tabs = require('sdk/tabs');
		const Prefs = require('sdk/simple-prefs').prefs;
		try {
			const { EPub, } = require('./epub.js');
			const runInTab = require('es6lib/runInTab');

			this.progress('Collecting data', 0, true);
			const tab = Tabs.activeTab;
			let collector;
			if (/about\:reader\?url\=/.test(tab.url)) {
				collector = './../collect/aboutReader.js';
			} else if (/https:\/\/[^\/]*read\.overdrive\.com/.test(tab.url)) {
				collector = './../collect/overdrive.js';
			} else {
				if (viewFor(Windows.activeWindow).confirm(`\tPage not supported.\n\tDo you want to open the Reader View to try again?`)) {
					tab.url = 'about:reader?url='+ tab.url;
				} return;
			}
			const options = (yield runInTab(tab, collector, o => window.collect(o), { styles: Prefs.collectStyles, }));
			// console.log('options', options);

			this.progress('Building book', 30);
			const book = new EPub(Object.assign(options, { markNav: Prefs.setNavProperty, }));

			this.progress('Loading images', 50);
			(yield book.loadResources());
			// console.log('book', book);

			this.progress('Saving file', 80);

			(yield runInTab(tab, './../node_modules/es6lib/dom.js', (url, name) => {
				es6lib_dom.saveAs(url, name);
			}, book.toDataURL(), book.name));

			this.progress('Book saved', 100);
		} catch(error) {
			if (error && error.message === '__MSG__Operation_canceled') { return console.log('canceled'); }
			console.error('collection threw', error);
			viewFor(Windows.activeWindow).alert('Something went wrong: '+ (error.message || error.name || error.constructor.name || error.stack));
		} finally {
			this.progress('Save as ePub', null, false);
		}
	}),
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


}; if (typeof define === 'function' && define.amd) { define([ 'exports', ], factory); } else { const exports = { }, result = factory(exports) || exports; if (typeof exports === 'object' && typeof module === 'object') { module.exports = result; } else { global[factory.name] = result; } } })((function() { return this; })());
