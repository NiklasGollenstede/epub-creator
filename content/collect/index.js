(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/es6lib/dom': { saveAs, },
	'common/epub': EPub,
	'common/options': options,
	require,
}) => async collector => { try {

	const collect = (await require.async('content/collect/'+ collector));
	const contents = collect({ styles: options.children.collectStyles.value, });
	const book = new EPub(Object.assign(contents, { markNav: options.children.setNavProperty.value, }));
	(await book.loadResources());
	saveAs((await book.toBlob()), book.name);

} finally {
	options.destroy();
	delete global.define;
	delete global.require;
} }); })(this);
