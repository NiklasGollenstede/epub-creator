'use strict';
/* global Uint8Array */
/* global process */

const JSZip = (typeof process !== 'undefined' && process.versions && process.versions.node) ? require('jszip/lib') : require('./jszip/jszip.js');

const {
	concurrent: { spawn, },
	dom: { saveAs, },
	format: { Guid, },
	functional: { log, },
	network: { HttpRequest, mimeTypes, },
	object: { copyProperties, },
} = require('es6lib');

const Templates = require('./templates.js');

function arrayBufferToString(buffer) {
	buffer = new Uint8Array(buffer);
	const ret = new Array(buffer.length);
	for (let i = 0, length = buffer.length; i < length; ++i) {
		ret[i] = String.fromCharCode(buffer[i]);
	}
	return ret.join('');
}

const EPub = exports.EPub = function EPub(options) {
	copyProperties(this, options);
	this.language = this.language || 'en';
	this.guid = this.guid || Guid();
	this.creators = [].concat(this.creators, this.creator, this.author, this.authors).filter(x => x);
	!this.creators.find(it => it.role === 'author') && this.creators.push({ name: '<unknown>', role: 'author'});

	this.chapters.forEach(chapter =>
		chapter.mimeType == 'text/html-body'
		&& (chapter.content = Templates.htmlFrame(chapter))
		&& (chapter.mimeType = mimeTypes.html)
		|| chapter.mimeType == 'text/xhtml-body'
		&& (chapter.content = Templates.xhtmlFrame(chapter))
		&& (chapter.mimeType = mimeTypes.xhtml)
	);

	[].concat(this.chapters, this.resources).forEach(entry => {
		// entry.name = entry.name.replace(/^oebps[\/\\]/i, '');
		!entry.mimeType && entry.name && (entry.mimeType = (entry.name.match(/\.\w+$/) || [0,'',])[1]);
		entry.mimeType = mimeTypes[entry.mimeType] || entry.mimeType;
	});

	if (typeof this.cover === 'string') {
		// this.cover = this.cover.replace(/^oebps[\/\\]/i, '');
		this.cover = this.chapters.find(({ name, }) => name === this.cover);
	}

	if (typeof this.nav === 'string') {
		// this.nav = this.nav.replace(/^oebps[\/\\]/i, '');
		this.nav = this.chapters.find(({ name, }) => name === this.nav);
		if (!this.nav) {
			this.nav = true;
		} else if (!(/<nav[^>]*?ops:type="toc".*?>[^]*?<\/nav>/).test(this.nav.content)) { // invalid toc
			this.nav.mimeType = 'application/xhtml+xml';
			const prefix = this.nav.name.replace(/[^\/\\]+/g, '..').replace(/\.\.$/, '') || '';
			this.nav.originalContent = this.nav.content;
			this.nav.content = Templates.navHtml(this, prefix);
		}
	}

	if (this.nav === true) {
		this.chapters.unshift(this.nav = {
			name: 'nav.xhtml',
			title: 'Table of Content',
			mimeType: 'application/xhtml+xml',
			content: Templates.navHtml(this),
		});
	}

	if (this.ncx !== false && typeof this.ncx !== 'object') {
		this.ncx = {
			name: 'content.ncx',
			mimeType: 'application/x-dtbncx+xml',
			content: Templates.contentNcx(this),
		};
	}

	if (this.opf !== false && typeof this.opf !== 'object') {
		this.opf = {
			name: 'content.opf',
			mimeType: 'application/oebps-package+xml',
			content: Templates.contentOpf(this),
		};
	}

	this.name = this.name || this.creators.find(it => it.role === 'author').name +' - '+ this.title +'.epub';
};
EPub.prototype = {
	loadResources() {
		if (!this.resources) { return Promise.resolve(); }
		this.resources = this.resources.filter((r1, i, a) => i === a.findIndex(r2 => r2.name === r1.name));
		return Promise.all(this.resources.filter(resource => (resource.src || resource.url) && !resource.content).map(
			resource => HttpRequest(Object.assign({
				responseType: 'arraybuffer',
			}, resource))
			.then(request => {
				resource.content = arrayBufferToString(request.response);
				resource.mimeType = request.getResponseHeader('content-type') || resource.mimeType;
				resource.options = { binary: true, };
				resource.name = resource.name || resource.src.match(/\/\/.*?\/(.*)$/)[1]; //.replace(/^oebps[\/\\]/i, '');
			})
		))
		.then(() => { typeof this.opf === 'object' && (this.opf.content = Templates.contentOpf(this)); });
	},
	zip() {
		const zip = new JSZip();
		zip.file('mimetype', 'application/epub+zip');
		zip.folder('META-INF').file('container.xml', Templates.containerXml(this));

		const oebps = zip.folder('OEBPS');

		[
			this.opf,
			this.ncx,
		].concat(
			this.chapters,
			this.resources.filter(({ content, }) => content)
		)
		.forEach(({ name, content, options, }) => oebps.file(name, content, options));

		return zip;
	},
	save(window) {
		saveAs(this.zip(), this.name, window);
	},
};
