(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/es6lib/dom': { saveAs, },
	'common/epub': EPub,
	'common/options': options,
	require,
}) => async (collector, params = { }) => {

	const collect = (await require.async('content/collect/'+ collector));
	const contents = (await collect({ styles: options.collectStyles.value, ...params, }));
	if (!contents) { return null; }
	if (!contents.language) { contents.language = options.defaultLanguage.value; }

	const book = new EPub(Object.assign(contents, { markNav: options.setNavProperty.value, }));
	(await book.loadResources({ allowErrors: true, }));
	saveAs((await book.toBlob()), ((book.name || book.title || 'book') +'').replace(/(?:[.]epub)?$/, '.epub'));

	return book.name;
}); if (false) { // eslint-disable-line no-constant-condition
	// If enabled, use page context's fetch, discard all modifications by the content script environment (build in and custom).

	// TODO: Figure out what's the best behaviour here:
	// Reasons to use wrapped fetch:
	// * in FF (84), calling into a fetch function that was modified by the page itself will fail
	// Reasons to use unwrapped fetch:
	// * more consistent across browsers
	// * less of a potential privacy risk
	// * ???
	if (global.wrappedJSObject && typeof XPCNativeWrapper === 'function') {
		global.XMLHttpRequest = global.XPCNativeWrapper(global.wrappedJSObject.XMLHttpRequest);
		global.fetch = global.XPCNativeWrapper(global.wrappedJSObject.fetch);
	}
} })(this);
