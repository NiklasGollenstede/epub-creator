'use strict'; /* globals __dirname, __filename, module, process */ // license: MPL-2.0

const packageJson = require('./package.json');

// files from '/' to be included in /webextension/
const files = {
	'.': [
		'background/',
		'common/',
		'content/',
		'ui/',
		'icon.png',
		'LICENSE',
		'package.json',
	],
	node_modules: {
		jszip: [
			'dist/jszip.min.js',
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
			'.': [ 'utils.js', 'inject.js', ],
			chrome: [
				'index.js',
			],
			options: [
				'index.js',
				'editor.js',
				'editor-inline.css',
				'editor-layout.css',
			],
			update: [
				'index.js',
			],
		},
	},
};

const manifestJson = {
	manifest_version: 2,
	name: packageJson.title,
	short_name: packageJson.title,
	version: packageJson.version,
	author: packageJson.author,
	license: packageJson.license,
	description: packageJson.description,
	repository: packageJson.repository,

	icons: { 64: 'icon.png', },

	minimum_chrome_version: '50.0.0',
	applications: {
		gecko: {
			id: '@'+ packageJson.name,
			strict_min_version: '50.0',
		}
	},

	permissions: [
		'notifications',
		'storage',
		'tabs',
		'*://*/*'
	],
	optional_permissions: [ ],

	background: { page: 'background/index.html', },
	content_scripts: [ ],
	browser_action: {
		default_title: packageJson.title,
		default_popup: 'ui/panel/index.html',
		default_icon: { 64: 'icon.png', },
	},
	options_ui: {
		page: 'ui/options/index.html',
		open_in_tab: false,
	},
	web_accessible_resources: [ ], // must be empty

	run_update: { // options for the es6lib/update module
		'base_path': '/update/'
	},

	incognito: 'spanning', // firefox doesn't support anything else
};

// files from '/' to be included in '/'
const sdkRootFiles = [
	'LICENSE',
	'README.md',
];

const {
	concurrent: { async, spawn, promisify, },
	functional,
	fs: { FS, },
	process: { execute, },
} = require('es6lib');
const { join, relative, resolve, dirname, basename, } = require('path');

const fsExtra = require('fs-extra');
const copy = promisify(fsExtra.copy);
const remove = promisify(fsExtra.remove);
const writeFile = promisify(fsExtra.outputFile);

let log = function() { return arguments[arguments.length - 1]; };

const buildUpdate = async(function*(options) {
	const outputJson = promisify(require('fs-extra').outputJson);
	for (let component of (yield FS.readdir(resolve(__dirname, `update`)).catch(() => [ ]))) {
		const names = (yield FS.readdir(resolve(__dirname, `update/${ component }`)))
		.filter(_=>_ !== 'versions.json')
		.map(path => basename(path).slice(0, -3));
		(yield outputJson(resolve(__dirname, `update/${ component }/versions.json`), names));
	}
	log('wrote version info');
});

const copyFiles = async(function*(files, from, to) {
	const paths = [ ];
	(function addPaths(prefix, module) {
		if (Array.isArray(module)) { return paths.push(...module.map(file => join(prefix, file))); }
		Object.keys(module).forEach(key => addPaths(join(prefix, key), module[key]));
	})('.', files);

	(yield Promise.all(paths.map(path =>
		copy(join(from, path), join(to, path))
		.catch(error => console.warn('Skipping missing file/folder "'+ path +'"', error))
	)));
});

const build = module.exports = async(function*(options) {
	const outputName = packageJson.title.toLowerCase().replace(/[^a-z0-9\.-]+/g, '_') +'-'+ packageJson.version;
	const outDir = options.outDir || resolve(__dirname, './build');

	const trueisch = value => value === undefined || value;

	(yield Promise.all([
		trueisch(options.update)  &&  buildUpdate(options.update  || { }),
		(!options.outDir || options.clearOutDir) && (yield remove(outDir)),
	]));

	(yield Promise.all([
		copyFiles(files, '.', join(outDir, '.')),
		writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifestJson, null, '\t', 'utf8')),
	]));

	const jpm = 'node "'+ resolve(__dirname, 'node_modules/web-ext/bin/web-ext') +'"';
	const run = command => execute(command, { cwd: outDir, });

	if (options.xpi || (options.xpi !== false && !options.run && !options.post && !options.zip)) {
		log((yield run(jpm +' build --artifacts-dir .')).replace(packageJson.name, outputName));
	}
	if (options.run) {
		log((yield run(jpm +' run'+ (options.run.bin ? ' -b "'+ options.run.bin  +'"' : ''))));
	}
	if (options.post) {
		const url = options.post.url
		? typeof options.post.url === 'number' ? 'http://localhost:'+ options.post.url +'/' : options.post.url
		: 'http://localhost:8888/';
		log((yield run(jpm +' post --post-url "'+ url +'"')));
	}
	if (options.zip) {
		(yield promisify(require('zip-dir'))('./build/webextension', {
			filter: path => !(/\.(?:zip|xpi)$/).test(path),
			saveTo: join(outDir, outputName +'.zip'),
		}));
		log('wrote WebExtension zip to', join(outDir, outputName +'.zip'));
	}

	return outputName;
});


if (require.main === module) {
	log = functional.log; // enable logging
	module.exports = build(require('json5').parse(process.argv[2] || '{ }'))
	.then(name => log('Build done:', name))
	.catch(error => { console.error(error); process.exitCode = 1; throw error; });
}
