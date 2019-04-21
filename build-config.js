/*eslint strict: ["error", "global"], no-implicit-globals: "off"*/ 'use strict'; /* globals module, */ // license: MPL-2.0
module.exports = function({ options, packageJson, manifestJson, files, }) {

	manifestJson.description = `Create offline e-books from web pages and 'overdrive.com' with a single click on the icon.`;
	manifestJson.homepage_url = packageJson.homepage;

	manifestJson.permissions.push(
		'notifications',
		'sessions', // to remove own closed popups
		'activeTab',
		'<all_urls>', // required to fetch DORS stuff
	);

	manifestJson.browser_action = {
		default_icon: manifestJson.icons,
		default_title: 'Save as ePub',
	};

	!options.viewRoot && (options.viewRoot = options.chrome ? 'ePub.html' : 'ePub');

	files.node_modules = [
		'es6lib/template.js',
		'es6lib/dom.js',
		'es6lib/network.js',
		'es6lib/object.js',
		'es6lib/string.js',
		'jszip/dist/jszip.min.js',
		'jszip/LICENSE.markdown',
		'multiport/index.js',
		'pbq/require.js',
		'readability/Readability.js',
		'web-ext-utils/browser/index.js',
		'web-ext-utils/browser/storage.js',
		'web-ext-utils/browser/version.js',
		'web-ext-utils/loader/_background.html',
		'web-ext-utils/loader/_background.js',
		'web-ext-utils/loader/_view.html',
		'web-ext-utils/loader/_view.js',
		'web-ext-utils/loader/content.js',
		'web-ext-utils/loader/index.js',
		'web-ext-utils/loader/views.js',
		'web-ext-utils/options/editor/about.js',
		'web-ext-utils/options/editor/about.css',
		'web-ext-utils/options/editor/index.js',
		'web-ext-utils/options/editor/index.css',
		'web-ext-utils/options/editor/inline.css',
		'web-ext-utils/options/editor/inline.js',
		'web-ext-utils/options/index.js',
		'web-ext-utils/update/index.js',
		'web-ext-utils/utils/icons/',
		'web-ext-utils/utils/event.js',
		'web-ext-utils/utils/files.js',
		'web-ext-utils/utils/index.js',
		'web-ext-utils/utils/inject.js',
		'web-ext-utils/utils/notify.js',
		'web-ext-utils/utils/semver.js',
	];

};
