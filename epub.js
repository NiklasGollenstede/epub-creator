'use strict';
/* global Uint8Array */
/* global process */

const JSZip = (typeof process !== 'undefined' && process.versions && process.versions.node) ? require('jszip/lib') : require('./jszip/jszip.js');
const { functional: { log, }, format: { Guid, }, concurrent: { spawn, }, network: { HttpRequest, }, dom: { saveAs, }, } = require('es6lib');

const Templates = require('./templates.js');

const mimeTypes = {
	html: 'text/html',
	xhtml: 'application/xhtml+xml',
};

function arrayBufferToString(buffer) {
	buffer = new Uint8Array(buffer);
	const ret = new Array(buffer.length);
	for (let i = 0, length = buffer.length; i < length; ++i) {
		ret[i] = String.fromCharCode(buffer[i]);
	}
	return ret.join('');
}

const EPub = exports.EPub = function EPub(options) {
	Object.assign(this, options);
	this.language = this.language || 'en';
	this.guid = this.guid || Guid();
	this.creators = [].concat(this.creators, this.creator, this.author, this.authors).filter(x => x);
	!this.creators.find(it => it.role === 'author') && this.creators.push({ name: '<unknown>', role: 'author'});

	this.chapters.forEach(chapter =>
		chapter.mimeType == 'text/html-body'
		&& (chapter.content = Templates.htmlFrame(chapter.content))
		&& (chapter.mimeType = 'text/html')
	);

	this.chapters.forEach(chapter => chapter.mimeType in mimeTypes && (chapter.mimeType = mimeTypes[chapter.mimeType]));

	if (typeof this.nav === 'string') {
		const nav = this.chapters.find(({ name, }) => name === this.nav);
		if (!nav) {
			this.nav = true;
		} else if (!(/<nav[^>]*?ops:type="toc".*?>[^]*?<\/nav>/).test(nav.content)) {
			nav.name = this.nav = 'nav.xhtml'; // rename: makes chapters referenciable without resolving, but destroyes references to nav itself
			// keep title and position
			nav.mimeType = 'application/xhtml+xml';
			nav.content = log('nav.xml', Templates.navHtml(this));
		}
	}

	if (this.nav === true) {
		this.chapters.unshift({
			name: 'nav.xhtml',
			title: 'Table of Content',
			mimeType: 'application/xhtml+xml',
			content: log('nav.xml', Templates.navHtml(this)),
		});
		this.nav = 'nav.xhtml';
	}
};
EPub.prototype = {
	loadResources() {
		if (!this.resources) { return Promise.resolve(); }
		return spawn(function*() {
			this.resources = this.resources.filter((r1, i, a) => i === a.findIndex(r2 => r2.name === r1.name));
			console.log('resources', this.resources);
			for (let resource of this.resources) {
				console.log('resource', resource);
				if (resource.src && !resource.content) {
					let request = yield(HttpRequest(Object.assign({
						responseType: 'arraybuffer',
						binary: true,
					}, resource)));
					console.log('request', request);
					resource.content = arrayBufferToString(request.response);
					resource.mimeType = request.getResponseHeader('content-type') || resource.mimeType;
					resource.options = { binary: true, };
					resource.name = resource.name || resource.src.match(/\/\/.*?\/(.*)$/)[1];
				}
			}
		}, this);
	},
	zip() {
		const zip = new JSZip();
		zip.file('mimetype', 'application/epub+zip');
		zip.folder('META-INF').file('container.xml', Templates.containerXml());

		const oebps = zip.folder('OEBPS');
		oebps.file('content.opf', log('content.opf', Templates.contentOpf(this)));
		oebps.file('content.ncx', log('content.ncx', Templates.contentNcx(this)));

		this.chapters
			.forEach(({ name, content, options, }) => oebps.file(name, content, options));
		this.resources
			.filter(({ content, }) => content)
			.forEach(({ name, content, options, }) => oebps.file(name, content, options));

		return zip;
	},
	save(name, window) {
		name = name || this.creators.find(it => it.role === 'author').name +' - '+ this.title +'.epub';

		const zip = this.zip();

		saveAs(zip, name, window);
	},
};
