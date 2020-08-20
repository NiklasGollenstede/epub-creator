(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { BrowserAction, Tabs, manifest, },
	'node_modules/web-ext-utils/loader/': { runInFrame, },
	'node_modules/web-ext-utils/update/': updated,
	'node_modules/web-ext-utils/utils/notify': notify,
	'common/options': options,
	require,
}) => {

BrowserAction && BrowserAction.onClicked.addListener(onClicked);
async function onClicked(tab) { return spinner.run(async () => {

	let collector, name = null;

	if (tab.isInReaderMode) {
		notify({
			title: `Exit reader mode?`, icon: 'default', // 'prompt',
			message: `${manifest.name} can only save this page after closing the reader mode.\nClick here if you want leave reader mode.\nThen try again.`,
		}).then(async clicked =>
			clicked && (await Tabs.get(tab.id)).isInReaderMode && Tabs.toggleReaderMode(tab.id)
		); return;
	} else if ((/^https:[/][/][^/]*read[.]overdrive[.]com/).test(tab.url)) {
		collector = 'overdrive';
	} else if (tab.isArticle || !('isArticle' in tab) || options.alwaysReader.value) {
		collector = 'readability';
	} else {
		notify({
			title: `Force reader mode?`, icon: 'warn',
			message: `It seems ${manifest.name} doesn't support this page.\nClick here if you want to TRY to force a book from reader mode.`,
		}).then(async clicked =>
			clicked && onClicked({ isArticle: true, id: tab.id, })
		); return;
	}

	collector && (name = (await runInFrame(tab.id, 0,
		collector => require.async('content/collect').then(_=>_(collector)), collector,
	)));

	if (name) { console.info(`Saved book "${name}"`); }
	else { console.info(`Saving as book was aborted`); }

}).catch(notify.error.bind(null, 'Failed to save as ePub')); }

const spinner = {
	active: 0, strings: String.raw`\ | / –`.split(' '),
	start() {
		spinner.active++ <= 0 && spinner.spin();
	},
	stop() {
		--spinner.active <= 0 && BrowserAction.setBadgeText({ text: '', });
	},
	spin() {
		if (spinner.active <= 0) { return; }
		BrowserAction.setBadgeText({ text: spinner.strings[0], });
		spinner.strings.push(spinner.strings.shift());
		global.setTimeout(spinner.spin, 250);
	},
	async run(action) {
		spinner.start(); try { return (await action()); } finally { spinner.stop(); }
	},
};
BrowserAction.setBadgeBackgroundColor({ color: [ 0x00, 0x7f, 0x00, 0x60, ], });

Object.assign(global, { onClicked, notify, updated, }); // for debugging

}); })(this);
