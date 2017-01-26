(function(global) { 'use strict'; define(async ({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/chrome/': { Tabs, },
	'node_modules/web-ext-utils/utils': { runInTab, },
}) => { try {

const tab = (await Tabs.query({ currentWindow: true, active: true, }))[0];
let collector;
if (/^about\:reader\?url\=/.test(tab.url)) {
	collector = 'about-reader';
} else if (/^https:\/\/[^\/]*read\.overdrive\.com/.test(tab.url)) {
	collector = 'overdrive';
} else {
	if (confirm(`\tPage not supported.\n\tDo you want to open the Reader View to try again?`)) {
		// console.log('redirect to ', 'about:reader?url='+ encodeURIComponent(tab.url));
		(await Tabs.update(tab.id, { url: 'about:reader?url='+ encodeURIComponent(tab.url), }));
		// console.log('done');
	} return;
}


(await runInTab(tab.id, '/node_modules/es6lib/require.js', collector => require.async('content/collect/').then(_=>_(collector)), collector));


} catch(error) {
	console.error('collection threw', error);
	alert('Something went wrong: '+ (error.message || error.name || error.constructor.name || error.stack));
} }); })(this);
