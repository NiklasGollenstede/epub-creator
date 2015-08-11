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
		&& (chapter.content = Templates.htmlFrame(chapter.content))
		&& (chapter.mimeType = 'text/html')
	);

	[].concat(this.chapters, this.resources).forEach(entry => {
		entry.name = entry.name.replace(/^oebps[\/\\]/i, '');
		!entry.mimeType && entry.name && (entry.mimeType = (entry.name.match(/\.\w+$/) || [0,'',])[1]);
		entry.mimeType = mimeTypes[entry.mimeType] || entry.mimeType;
	});

	if (typeof this.nav === 'string') {
		this.nav = this.nav.replace(/^oebps[\/\\]/i, '');
		const nav = this.chapters.find(({ name, }) => name === this.nav);
		if (!nav) {
			this.nav = true;
		} else if (!(/<nav[^>]*?ops:type="toc".*?>[^]*?<\/nav>/).test(nav.content)) { // invalid toc
			nav.mimeType = 'application/xhtml+xml';
			const prefix = nav.name.replace(/[^\/\\]+/g, '..').replace(/\.\.$/, '');
			nav.content = log('replace', nav.name, 'with', Templates.navHtml(this, prefix));
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
		this.resources = this.resources.filter((r1, i, a) => i === a.findIndex(r2 => r2.name === r1.name));
		return Promise.all(this.resources.map(
			resource => HttpRequest(Object.assign({
				responseType: 'arraybuffer',
				binary: true,
			}, resource))
			.then(request => {
				resource.content = arrayBufferToString(request.response);
				resource.mimeType = request.getResponseHeader('content-type') || resource.mimeType;
				resource.options = { binary: true, };
				resource.name = resource.name || resource.src.match(/\/\/.*?\/(.*)$/)[1].replace(/^oebps[\/\\]/i, '');
				console.log('resource', this.resources.indexOf(resource), resource);
			})
		));
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
