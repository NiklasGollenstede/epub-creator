(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { Tabs, browserAction, },
	'node_modules/web-ext-utils/browser/version': { gecko, },
	'node_modules/web-ext-utils/loader/': { runInFrame, },
	'node_modules/web-ext-utils/update/': updated,
	'node_modules/web-ext-utils/utils/notify': notify,
	require,
}) => {

browserAction && browserAction.onClicked.addListener(onClick);
async function onClick(tab) { { spinner.start(); } try {
	let collector, name = null;

	if (tab.isInReaderMode) {

		name = (await (await require.async('./reader-mode'))(tab.url));

	} else if (/^https:\/\/[^/]*read\.overdrive\.com/.test(tab.url)) {

		collector = 'overdrive';

	} else if (gecko && tab.isArticle && !tab.isInReaderMode) {

		notify({ title: `Open reader mode?`, message: `Click here if you want to open it in the reader mode and try again.`, })
		.then(async clicked => { if (!clicked) { return; } {
			try { (await Tabs.toggleReaderMode(tab.id)); }
			catch (error) { notify.error(`Could not open Reader Mode for the current page`); }
		} });

	} else { throw { title: `Not supported`, message: `ePub creator doesn't support this site.`, }; } // eslint-disable-line no-throw-literal

	collector && (name = (await runInFrame(tab.id, 0,
		collector => require.async('content/collect').then(_=>_(collector)), collector,
	)));

	if (name) { console.info(`Saved book "${name}"`); }
} catch (error) { notify.error(error); } finally { spinner.stop(); } }

const spinner = {
	active: 0, strings: String.raw`\ | / –`.split(' '),
	start() {
		spinner.active++ <= 0 && spinner.spin();
	},
	stop() {
		--spinner.active <= 0 && browserAction.setBadgeText({ text: '', });
	},
	spin() {
		if (spinner.active <= 0) { return; }
		browserAction.setBadgeText({ text: spinner.strings[0], });
		spinner.strings.push(spinner.strings.shift());
		global.setTimeout(spinner.spin, 250);
	},
};
browserAction.setBadgeBackgroundColor({ color: [ 0x00, 0x7f, 0x00, 0x60, ], });

Object.assign(global, { onClick, notify, updated, }); // for debugging

}); })(this);
