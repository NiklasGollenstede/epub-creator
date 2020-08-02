# ePub Creator -- offline e-books in a single click

<a href="https://addons.mozilla.org/firefox/addon/epub/"><img src="./resources/get-firefox-ext-172x60.png" width="86" height="30"></a>
<a href="https://chrome.google.com/webstore/detail/dholphmppikkchmalilfkmfanembgbil/"><img src="./resources/get-chrome-ext-206x58.png" width="103" height="29"></a>

<!-- START:listing (This section can be copied as the AMO listing. The weird spacing is required.) -->

ePub creator allows you to save web pages opened in the browser as offline ePub e-books.
It currently supports:<ul>
	<li> any web page that can be opened in Firefox's Reader Mode, which should work for most text-based websites </li>
	<li> books opened in the online reader of the library service <a href="https://www.overdrive.com/">overdrive.com</a>, which cooperates with many local libraries worldwide </li>
</ul>

<b>How to</b> create/save books:</b>
<ol>
	<li> open the web page or book you want to save <ul>
		<li> on overdrive, go to "Loans" and choose "Read now in browser" </li>
	</ul></li>
	<li> click the extensions icon (blue book with green arrow, should be at the top right of the browser, see screenshot) </li>
	<li> wait while the animation on the icon is spinning <ul>
		<li> this can take a while if the e-book contains many pictures etc. </li>
		<li> for Reader Mode pages, it will prompt for the books author </li>
	</ul></li>
	<li> save or open the e-book when prompted </li>
</ol>

Whether saving content with this extension is <b>legal or not</b> depends on the content and your <b>local legislation</b>. Checking that is <b>your own responsibility</b>. Just because you can do it doesn't mean you should.


What you get &amp; <b>Troubleshooting:</b>
<ul>
	<li> For general web pages, Mozilla's <code>Readability.js</code> is used to extract the content. Since that is the same software component used by Firefox to generate the Reader view, the result should generally be the same as well. All resources (e.g. images) that show up there should also be included in the ePub book. If parts of the website are missing in the book, please check whether they show up in the reader mode. If not, there is little this extension can change about that. Also note that some sites load e.g. images on demand, usually when scrolled to; before that, they won't be captured by the reader view or this extension. </li>
	<li> Books from <a href="https://www.overdrive.com/">overdrive.com</a> are not simply downloaded, but the content is parsed from the open book. The ToC is rewritten, most of the formatting is stripped and everything gets repacked. While images are generally still included, their sizing might be off on some readers, rendering this quite useless for comics and the like. </li>
	<li> If you have a problem that is not explained by the limitations above, please check for and/or open an <a href="https://github.com/NiklasGollenstede/epub-creator/issues">Issue on GutHub</a>. </li>
</ul>


<b>Permissions used</b>:<ul>
	<li> <b>Display notifications</b>: Only as direct consequence of clicks on the icon or to report errors </li>
	<li> <b>Access your data for all websites</b>: Download page content <b>if you choose so</b> </li>
	<li> <b>Access recently closed tabs</b>: Remove own popups from the recently closed windows list </li>
</ul>

<!-- END:listing -->

## Development builds -- [![](https://ci.appveyor.com/api/projects/status/github/NiklasGollenstede/epub-creator?svg=true)](https://ci.appveyor.com/project/NiklasGollenstede/epub-creator)

Development builds are automatically created on every commit with [appveyor](https://ci.appveyor.com/project/NiklasGollenstede/epub-creator/history) and published as [release](https://github.com/NiklasGollenstede/epub-creator/releases) on GitHub.\
These build use a different id (`-dev` suffix), so they are installed as additional extension and do not replace the release version. This means that:
 * you probably want to disable the release version, while the development version is active
 * any options set are managed individually (which also means that pre-release versions can't mess with your settings)
 * they never update to release versions, but
    * they update themselves to the latest development version
    * every release version has a corresponding development version (the one with the same prefix and highest build number)


## How to Build

### Preparation

  - `git clone https://github.com/NiklasGollenstede/epub-creator && cd epub-creator`
  - `npm install`

### Testing and packing

To build, run `npm start -- "<options>"`, where `<options>` is an single optional JSON5 object.

Without options it creates a release build for Firefox in the `build/` directory.
The `.zip` file is ready to be uploaded on AMO, and the `build/` directory or the `.zip` file can be loaded via `about:debugging`.

To test the extension in a fresh Firefox profile, use the `{run:1}` or `{run:{bin:'path/to firefox/binary'}}` option.

To build for Chrome (which e.g. doesn't support `.svg` icons), add the `{chrome:1}` option.


## AMO code review notes

The exact version of the minified JSZip file can be found here: `https://github.com/Stuk/jszip/blob/v3.1.5/dist/jszip.min.js`.
