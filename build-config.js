/*eslint strict: ["error", "global"], no-implicit-globals: "off"*/ 'use strict'; /* globals module, */ // license: MPL-2.0
module.exports = function({ /*options, packageJson,*/ manifestJson, files, }) {

	manifestJson.permissions.push(
		'notifications',
		'tabs',
		'*://*/*'
	);

	files.node_modules = {
		jszip: [
			'dist/jszip.min.js',
			'LICENSE.markdown',
		],
		es6lib: [
			'template.js',
			'concurrent.js',
			'dom.js',
			'functional.js',
			'index.js',
			'namespace.js',
			'network.js',
			'object.js',
			'port.js',
			'require.js',
			'string.js',
		],
		'web-ext-utils': {
			browser: [
				'index.js',
				'version.js',
			],
			options: {
				'.': [ 'index.js', ],
				editor: [
					'about.js',
					'about.css',
					'index.js',
					'index.css',
					'inline.css',
					'inline.html',
					'inline.js',
				],
			},
			update: [
				'index.js',
			],
			utils: [
				'files.js',
				//	'index.js',
				'inject.js',
				'run-in-tab.js',
				'semver.js',
			],
		},
	};

};
