'use strict';
(function(global) {

const {
	TemplateEngine,  ForEach, ForOf, While, If, Value, Index, Key, Call, Predicate, End, NoMap,
	escape: { escapeHtml, removeTags, }
} = require('./node_modules/es6lib/template/index.js');

const engine = TemplateEngine({ trim: 'front parts strong', mapper: escapeHtml, });

const navHtml = exports.navHtml = ({ language, chapters, title, nav, }, prefix = '')  => (engine`
<?xml version="1.0" encoding="UTF-8" ?>
<html xmlns="http://www.w3.org/1999/xhtml"
	xmlns:ops="http://www.idpf.org/2007/ops"
	xml:lang="${ language }">
	<head>
		<title>${ 'Table of Content' }</title>
	</head>
	<body>
		<nav ops:type="toc">

			<h1>${ title }</h1>

			<ol>
				${ If(nav === true)}
				<li><a href="nav.xhtml">${ 'Table of Content' }</a></li>
				${ End.If }
				${ ForEach(chapters) }
				<li><a href="${ Call(v => prefix + v.name) }">${ Call(v => v.title) }</a></li>
				${ End.ForEach }
			</ol>

		</nav>
	</body>
</html>
`);

const containerXml = exports.containerXml = ({ opf, }) => (engine`
<?xml version="1.0" encoding="UTF-8" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
	<rootfiles>
		<rootfile full-path="OEBPS/${ opf.name }" media-type="${ opf.mimeType || 'application/oebps-package+xml' }"/>
	</rootfiles>
</container>
`);

const contentOpf = exports.contentOpf = ({ guid, language, title, description, creators, published, chapters, resources, markNav, nav, cover, ncx, }) => (engine`
<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:opf="http://www.idpf.org/2007/opf"
	xmlns="http://www.idpf.org/2007/opf"
	unique-identifier="Id">
	<metadata>
		<dc:identifier id="Id">${ guid }</dc:identifier>
		<meta property="identifier-type" refines="#Id">UUID</meta>
		<meta property="dcterms:modified">${ new Date().toISOString().replace(/\.\d+/, '') }</meta>
		<dc:language>${ language }</dc:language>
		<dc:title xml:lang="${ language }">${ title }</dc:title>

		${ If(description) }
		<dc:description xml:lang="${ language }">${
			removeTags(typeof description === 'object' ? description.full || description.short : description)
		}</dc:description>
		${ End.If }
		${ ForEach(creators) }
			<dc:creator id="author${ Index }" xml:lang="${ language }">${ Call(v => v.name) }</dc:creator>
			${ If(v => v.as) }
			<meta refines="#author${ Index }" property="file-as">${ Call(v => v.as) }</meta>
			${ End.If }
			${ If(v => v.role) }
			<meta refines="#author${ Index }" property="role" scheme="marc:relators">${ Call(v => v.role) }</meta>
			${ End.If }
			${ If(v => v.bio) }
			<!-- <meta refines="#author${ Index }" property="bio" scheme="marc:relators">${
				Call(v => removeTags(v.bio))
			}</meta> -->
			${ End.If }
		${ End.ForEach }
		${ If(published) }
		<meta property="dcterms:created">${ new Date(+(published || 0)).toISOString().match(/^.*?T/)[0].slice(0, -1) }</meta>
		${ End.If }
	</metadata>

	<manifest>
		<item id="ncx" href="${ ncx.name }" media-type="${ ncx.mimeType || 'application/x-dtbncx+xml' }"/>
		${ ForEach(chapters) }
		<item id="chapter${ Index }" href="${ Call(v => v.name) }" media-type="${ Call(v => v.mimeType) }"${ If(markNav && (v => v === nav)) } properties="nav"${ End.If }/>
		${ End.ForEach }
		${ ForEach(resources) }
		<item id="resource${ Index }" href="${ Call(v => v.name) }" media-type="${ Call(v => v.mimeType) }"/>
		${ End.ForEach }
	</manifest>

	<spine toc="ncx">
		${ ForEach(chapters) }
		<itemref idref="chapter${ Index }"/>
		${ End.ForEach }
	</spine>
	<guide>
		${ If(cover) }
		<reference href="${ cover.name }" title="${ cover.title }" type="cover"/>
		${ End.If }
		${ If(nav) }
		<reference href="${ nav.name }" title="${ nav.title }" type="toc"/>
		${ End.If }
	</guide>
</package>
`);

const contentNcx = exports.contentNcx = ({ guid, language, title, description, creators, published, chapters, }) => (engine`
<?xml version="1.0" encoding="UTF-8"?>
<ncx
	xmlns="http://www.daisy.org/z3986/2005/ncx/"
	version="2005-1"
	xml:lang="${ language }">
	<head>
		<meta name="dtb:uid" content="${ guid }"/>
	</head>
	<docTitle>
		<text>${ title }</text>
	</docTitle>
	<docAuthor>
		<text>${ creators.find(it => it.role === 'author').name }</text>
	</docAuthor>
	<navMap>
		${ ForEach(chapters) }
		<navPoint playOrder="${ Index }" id="chapter${ Index }">
			<navLabel>
				<text>${ Call(v => v.title) }</text>
			</navLabel>
			<content src="${ Call(v => v.name) }"/>
		</navPoint>
		${ End.ForEach }
	</navMap>
</ncx>
`);

const htmlFrame = exports.htmlFrame = (content) => (`
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	</head>
	<body>
${ content }
	</body>
</html>
`);

return Object.freeze(exports);
})((typeof exports !== 'undefined') ? exports : ((typeof window !== 'undefined') ? window.Templates = { } : { }));
