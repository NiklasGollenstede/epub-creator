'use strict';

const { viewFor } = require("sdk/view/core");
const Windows = require("sdk/windows").browserWindows;
const Tabs = require("sdk/tabs");
const { ActionButton, } = require("sdk/ui");

const { concurrent: { spawn, }, functional: { log, }, } = require('es6lib');

const { collect, } = require('./collect.js');
const { EPub, } = require('./epub.js');

const runInTab = require('es6lib/runInTab');

ActionButton({
	id: 'button',
	label: 'Save book',
	icon: { 16: './../icon.png', 32: './../icon.png', 64: './../icon.png', },
	onClick: function() {
		spawn(function*() {
			this.progress('Collecting data', 0, true);
			const options = yield(runInTab(Tabs.activeTab, [ './../collect.js', ], () => (require("collect/overdrive")())));
			console.log('options', options);

			this.progress('Building book', 30);
			const book = new EPub(options);

			this.progress('Loading images', 50);
			yield(book.loadResources());
			console.log('book', book);

			this.progress('Saving file', 80);
			book.save(viewFor(Windows.activeWindow).gBrowser.contentWindow);

		}, this)
		.catch(error => console.error('collection threw', error))
		.then(() => this.progress('Save book', null, false));
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
