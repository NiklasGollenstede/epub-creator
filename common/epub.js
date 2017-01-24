(function(global) { 'use strict'; define(function({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/es6lib/network': { HttpRequest, mimeTypes, arrayBufferToString, },
	'node_modules/es6lib/object': { cloneOnto, },
	'node_modules/es6lib/string': { Guid, },
	'node_modules/jszip/dist/jszip.min': JsZip,
	Templates,
}) {

const mimeType = mimeTypes.epub;

class EPub {
	/**
	 * Creates an ePub file from (x)html-documents
	 * @param {object}  options  Object describing the book
	 *     @property {string}  title     The books title.
	 *     @property {string}  language  Two letter language description. Default: 'en'.
	 *     @property {string}  guid      Guid of the book. Default: new rfc4122 v4 compliant GUID.
	 *     @property {array}   creators  Array of { name, role, as, } describing the books creators. One should have .role === 'author'.
	 *     @property {array}   chapters  Array of objects describing the (x)html pages of the book:
	 *         @property {string}  name      The (relative) path this document will be / is referenced by.
	 *         @property {string}  title     The documents title, used e.g. for the table of contents.
	 *         @property {string}  content   The (text representation of) the document itself.
	 *         @property {string}  mimeType  The chapters mine-type (or file extension which can be mapped to the mime-type). Default: dirived from file extension (name).
	 *         @property {object}  options   Passed to JSZip. Necessary if content is not an utf8-string (e.g. base64, binary).
	 *     @property {array} resources   Array of objects describing (external) resources to include. Same parameters as chapters, plus:
	 *         @property {string}  src       Specifies the resources url if 'content' is empty.
	 *         @property {object}  options   If the recourse is externally loaded, these options are also passed to the HttpRequest.
	 *     @property {string}  cover     Name of the cover page. Optional.
	 *     @property {string}  nav       Name of the table of contents. Optional. If set but not ePub 3 compliant, it will be replaced a generated toc.
	 *     @property {object}  ncx       Object { name, content, mimeType, } describing the ePub's .ncx file. Default: auto-generated.
	 *     @property {object}  opf       Object { name, content, mimeType, } describing the ePub's .opf file. Default: auto-generated.
	 *     @property {string}  name      The books (file) name. Default: `${ creator with role 'author' } - ${ title }.epub`.
	 * Notes:
	 *     If an chapters mimeType is 'text/(x)html-body', its content will be wrapped in a matching document.
	 *     To load external resources, .loadRecources() must be called before .zip()'ing or .save()'ing.
	 * @return {EPub}  EPub instance that can be .zip()'ed .save()'d.
	 */
	constructor(options) {
		cloneOnto(this, options);
		this.language = this.language || 'en';
		this.guid = this.guid || Guid();
		this.creators = [].concat(this.creators, this.creator, this.author, this.authors).filter(x => x);
		!this.creators.find(it => it.role === 'author') && this.creators.push({ name: '<unknown>', role: 'author'});

		this.chapters.forEach(chapter =>
			chapter.mimeType === 'text/html-body'
			&& (chapter.content = Templates.htmlFrame(chapter))
			&& (chapter.mimeType = mimeTypes.html)
			|| chapter.mimeType === 'text/xhtml-body'
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
	}

	/**
	 * Loads all resources specified in the constructor, that have a .src or .url set, but empty content.
	 * @async
	 * @return {Promise}  Promise that resolves to this.
	 */
	loadResources() {
		if (!this.resources) { return Promise.resolve(this); }
		this.resources = this.resources.filter((r1, i, a) => i === a.findIndex(r2 => (r1.name || r1.src) === (r2.name || r2.src)));
		return Promise.all(this.resources.filter(
			resource => (resource.src || resource.url) && !resource.content
		).map(
			resource => HttpRequest((resource.src || resource.url), Object.assign({
				responseType: 'arraybuffer',
			}, resource.options))
			.then(request => {
				resource.content = arrayBufferToString(request.response);
				resource.mimeType = request.getResponseHeader('content-type') || resource.mimeType;
				resource.options = Object.assign({ binary: true, }, resource.options);
				resource.name = resource.name || resource.src.match(/\/\/.*?\/(.*)$/)[1]; //.replace(/^oebps[\/\\]/i, '');
			})
		))
		.then(() => {
			typeof this.opf === 'object' && (this.opf.content = Templates.contentOpf(this));
			return this;
		});
	}

	/**
	 * Used JSZip to pack all specified and processed files.
	 * @return {JSZip} The resulting JSZip instance.
	 */
	zip() {
		const zip = new JsZip();
		zip.file('mimetype', 'application/epub+zip');
		zip.folder('META-INF').file('container.xml', Templates.containerXml(this));

		const oebps = zip.folder('OEBPS');

		[
			this.opf,
			this.ncx,
		].concat(
			this.chapters,
			this.resources.filter(_=>_.content)
		)
		.forEach(({ name, content, options, }) => oebps.file(name, content, options));

		return zip;
	}

	/**
	 * Saves the book into a Blob object.
	 * @return {Promise<Blob>}  A promise to the book as a Blob.
	 */
	toBlob() {
		const zip = this.zip();
		try {
			return zip.generateAsync({ mimeType, type: 'blob', });
		} catch (error) {
			return zip.generateAsync({ mimeType, type: 'uint8array', }).then(array => new Blob([ array, ], { type: mimeType, }));
		}
	}

	/**
	 * Saves the book into a data URL.
	 * @return {Promise<string>}  A promise to the book as a data:-url.
	 */
	toDataURL() {
		return this.zip().generateAsync({ mimeType, type: 'base64', }).then(data => `data:${ mimeType };base64,`+ data);
	}

}

return (EPub.EPub = EPub);

}); })((function() { /* jshint strict: false */ return this; })());
