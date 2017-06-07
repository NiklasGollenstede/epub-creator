(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { Tabs, browserAction, Notifications, },
	'node_modules/web-ext-utils/browser/version': { gecko, },
	'node_modules/web-ext-utils/loader/': { runInTab, },
	'node_modules/web-ext-utils/update/': updated,
	'node_modules/web-ext-utils/utils/': { reportError, reportSuccess, },
	require,
}) => {

updated.extension.to.channel !== '' && console.info('Ran updates', updated);

browserAction && browserAction.onClicked.addListener(onClick);
async function onClick() { try {
	spinner.start();
	const tab = (await Tabs.query({ currentWindow: true, active: true, }))[0];
	let collector;
	if (/^about\:reader\?url\=/.test(tab.url)) {
		collector = 'about-reader';
	} else if (/^https:\/\/[^\/]*read\.overdrive\.com/.test(tab.url)) {
		collector = 'overdrive';
	} else {
		return void (await offerReader(tab));
	}

	const name = (await runInTab(tab.id, collector => require.async('content/collect/').then(_=>_(collector)), collector));
	console.info(`Saved book "${ name }"`);
} catch (error) {
	currentTab = null; reportError(error);
} finally {
	spinner.stop();
} }

const spinner = {
	strings: [ '\\', '|', '/', '–', ],
	active: 0,
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

let currentTab = null;
function offerReader(tab) {
	if (gecko) {
		currentTab = tab;
		reportSuccess(`Open reader mode?`, `Click here if you want to open it in the reader mode and try again.`);
	} else {
		reportError(`Not supported`, `ePub creator doesn't support this site.`);
	}
}

gecko && Notifications.onClicked.addListener(async id => {
	if (id !== 'web-ext-utils:success') { return; }
	Notifications.clear('web-ext-utils:success');
	if (!currentTab) { return; }
	const tab = currentTab; currentTab = null;
	try {
		(await Tabs.update(tab.id, { url: 'about:reader?url='+ encodeURIComponent(tab.url), }));
	} catch (error) { reportError({ message: `It seems firefox doesn't support this yet`, }); }
});

Object.assign(global, { onClick, offerReader, reportError, reportSuccess, }); // for debugging

}); })(this);
