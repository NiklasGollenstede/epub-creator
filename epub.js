'use strict';

const JSZip = (typeof process !== 'undefined' && process.versions && process.versions.node) ? require('jszip/lib') : require('./jszip/jszip.js');
const { functional: { log, }, format: { Guid, }, concurrent: { spawn, }, network: { HttpRequest, }, dom: { saveAs, }, } = require('./node_modules/es6lib');

const Templates = require('./templates.js');

const mimeTypes = {
	html: 'text/html',
};

log(JSZip);

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
			nav.name = 'nav.xhtml'; // rename: makes chapters referenciable without resolving, but destroyes references to nav itself
			// keep title and position
			nav.mimeType = 'application/xhtml+xml';
			nav.content = Templates.navHtml(this);
		}
	}

	if (this.nav === true) {
		this.chapters.unshift({
			name: 'nav.xhtml',
			title: 'Table of Content',
			mimeType: 'application/xhtml+xml',
			content: log('nav', Templates.navHtml(this))
		});
		this.nav = 'nav.xhtml';
	}
};
EPub.prototype = {
	loadResources() { // dosn't work
		if (!this.resources) { return Promise.resolve(); }
		return spawn(function*() {
			console.log('resources', this.resources);
			for (let resource of this.resources) {
				console.log('resource', resource);
				if (resource.src && !resource.content) {
					resource.options = Object.assign(resource.options || { }, { responseType: 'arraybuffer', binary: true, });
					let req = (yield HttpRequest(resource.src, resource.options));
					console.log('req', req);
					resource.content = req.response;
					console.log('content', resource.content);
					resource.name = resource.name || resource.src.match(/\/\/.*?\/(.*)$/)[1];
				}
			}
		}.bind(this));
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
