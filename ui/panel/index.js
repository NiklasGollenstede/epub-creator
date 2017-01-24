(function(global) { 'use strict'; define(function*({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/chrome/': { Tabs, },
	'node_modules/web-ext-utils/utils': { runInTab, },
}) { try {

const tab = (yield Tabs.query({ currentWindow: true, active: true, }))[0];
let collector;
if (/^about\:reader\?url\=/.test(tab.url)) {
	collector = 'about-reader';
} else if (/^https:\/\/[^\/]*read\.overdrive\.com/.test(tab.url)) {
	collector = 'overdrive';
} else {
	if (confirm(`\tPage not supported.\n\tDo you want to open the Reader View to try again?`)) {
		console.log('redirect to ', 'about:reader?url='+ encodeURIComponent(tab.url));
		(yield Tabs.update(tab.id, { url: 'about:reader?url='+ encodeURIComponent(tab.url), }));
		console.log('done');
	} return;
}

(yield runInTab(tab.id, '/node_modules/es6lib/require.js', function(collector) { const global = this;
	'use strict'; return define(function*({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
		'node_modules/es6lib/dom': { saveAs, },
		'common/epub': EPub,
		'common/options': options,
		require,
	}) {
		const collect = (yield require.async('content/collect/'+ collector));
		const contents = collect({ styles: options.children.collectStyles.value, });
		const book = new EPub(Object.assign(contents, { markNav: options.children.setNavProperty.value, }));
		(yield book.loadResources());
		saveAs((yield book.toBlob()), book.name);

		options.destroy();
		delete global.define;
	}).catch(error => {
		delete global.define;
		throw error;
	});
}, collector));


} catch(error) {
	console.error('collection threw', error);
	alert('Something went wrong: '+ (error.message || error.name || error.constructor.name || error.stack));
}

}); })((function() { /* jshint strict: false */ return this; })());
