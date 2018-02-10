# ePub Creator -- create ePubs `overdrive.com`s online reader


## Development builds -- ![](https://ci.appveyor.com/api/projects/status/github/NiklasGollenstede/epub-creator?svg=true)

Development builds are automatically created on every commit with [appveyor](https://ci.appveyor.com/project/NiklasGollenstede/epub-creator/history) and published as [release](https://github.com/NiklasGollenstede/epub-creator/releases) on GitHub.\
These build use a different id (`-dev` suffix), so they can / have to be installed parallel to the release versions from AMO; only keep one version installed and active.\
Dev versions therefore never update to release versions, but they use the browsers build-in update mechanism to automatically update to the latest dev release. Every release version corresponds to the dev version with the same version prefix and the highest build number.


## How to Build

### Preparation

  - `git clone https://github.com/NiklasGollenstede/epub-creator && cd epub-creator`
  - `npm install`

### Testing and packing

To build, run `npm start -- "<options>"`, where `<options>` is an single optional JSON5 object.

Without options it creates a release build for Firefox in the `build/` directory.
The `.zip` file is ready to be uploaded on AMO, and the `build/` directory or the `.zip` file can be loaded via `about:debugging`.

To test the extension in a fresh Firefox profile, use the `{run:1}` or `{run:{bin:'path/to firefox/binary'}}` option.

To build for chrome (which doesn't support `.svg` icons), add the `{chrome:1}` option.


## AMO review notes

The exact version of the minified JSZip file can be found here: `https://github.com/Stuk/jszip/blob/v3.1.5/dist/jszip.min.js`.
