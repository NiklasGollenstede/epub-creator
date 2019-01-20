# ePub Creator -- create ePubs from web pages and `overdrive.com`s online reader

<!-- This section can be copied as the AMO listing. -->

ePub creator allows you to save web pages opened in the browser as offline ePub e-books.
It currently supports:<ul>
	<li> books opened in the online reader of the library service <a href="https://www.overdrive.com/">overdrive.com</a> </li>
	<li> any web page that can be opened in Firefox's Reader Mode </li>
</ul>

<b>Instructions:</b>
<ol>
	<li> open the page / book you want to save (on overdrive, go to "Loans" and choose "Read now in browser") </li>
	<li> click the extensions icon (blue book with green arrow, should be at the top right of the browser, see screenshot) </li>
	<li> wait while the animation on the icon is spinning (this can take a while in the e-book contains many pictures etc.) </li>
	<li> save or open the e-book when prompted </li>
</ol>

Whether saving content this way is <b>legal or not</b> depends on the content and your <b>local legislation</b>. Checking this is <b>your own responsibility</b>. Just because you can do it doesn't mean you should.

<b>Permissions used</b>:<ul>
	<li> <b>Display notifications</b>: Only as direct consequence of clicks on the icon or to report errors </li>
	<li> <b>Access your data for all websites</b>: Download page content <b>if you choose so</b> </li>
	<li> <b>Access recently closed tabs</b>: Remove own popups from the recently closed windows list </li>
</ul>


## Development builds -- ![](https://ci.appveyor.com/api/projects/status/github/NiklasGollenstede/epub-creator?svg=true)

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

To build for chrome (which e.g. doesn't support `.svg` icons), add the `{chrome:1}` option.


## AMO code review notes

The exact version of the minified JSZip file can be found here: `https://github.com/Stuk/jszip/blob/v3.1.5/dist/jszip.min.js`.
