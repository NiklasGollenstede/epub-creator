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
	label: 'Button',
	icon: { 16: './../icon.png', 32: './../icon.png', 64: './../icon.png', },
	onClick: () => spawn(function*() {

		const options = yield(runInTab(Tabs.activeTab, [ './../collect.js', ], () => (require("collect/overdrive")())));
		console.log('options', options);

		const book = new EPub(options);
		console.log('book', book);

		yield(book.loadResources());
		console.log('book', book);

		book.save(null, viewFor(Windows.activeWindow).gBrowser.contentWindow);

	}).catch(error => console.error('collection threw', error)),
});
