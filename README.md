## ePub Creator is a WebExtension that creates ePub e-books from web pages. Currently it only works on  `overdrive.com`s online reader.

## How to Build

### Preparation

  - `git clone https://github.com/NiklasGollenstede/epub-creator && cd epub-creator`
  - `npm install`

### Testing and packing

To build, run `npm start -- "<options>"`, where `<options>` is an single optional JSON5 object.

Without options it creates a release build for Firefox in the `build/` directory.
The `.zip` file is ready to be uploaded on AMO, and the `build/` directory or the `.zip` file can be loaded via `about:debugging`.
To create beta builds for AMO, add the `{beta:<number>}` option, where `<number>` is any natural number.

To test the extension in a fresh Firefox profile, use the `{run:1}` or `{run:{bin:'path/to firefox/binary'}}` option.

To build for chrome (which doesn't support `.svg` icons), add the `{chrome:1}` option.
