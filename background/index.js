(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/es6lib/functional': { debounce, },
	'node_modules/web-ext-utils/browser/': { Tabs, browserAction, Notifications, },
	'node_modules/web-ext-utils/browser/version': { gecko, },
	'node_modules/web-ext-utils/loader/': { runInTab, },
	'node_modules/web-ext-utils/update/': updated,
	'node_modules/web-ext-utils/utils/files': { exsists, },
}) => {

updated.extension.to.channel !== '' && console.info('Ran updates', updated);

browserAction && browserAction.onClicked.addListener(makeBook);

async function makeBook() { try {
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
} catch (error) { reportError(error); } }

let currentTab = null; const notificationId = 'main', clearNotificationSoon = debounce(() => Notifications.clear(notificationId), 5000);

function reportError(error) {
	currentTab = null;
	Notifications.create(notificationId, {
		type: 'basic', iconUrl: require.toUrl(exsists('error.svg') ? 'error.svg' : 'icon.svg'),
		title: `That didn't work ...`,
		message: error && (error.message || error.name) || error || 'at all',
	});
	clearNotificationSoon();
	throw error;
}

function offerReader(tab) {
	currentTab = tab;
	Notifications.create(notificationId, {
		type: 'basic', iconUrl: require.toUrl('icon.svg'),
		title: !gecko ? `Not supported` : `Open reader mode?`,
		message: `ePub creator doesn't support this site.`
		+ (!gecko ? '' : `Click here if you want to open it in the reader mode and try again.`),
	});
	clearNotificationSoon();
}

Notifications.onClicked.addListener(async id => {
	if (id !== notificationId) { return; }
	Notifications.clear(notificationId);
	if (!currentTab) { return; }
	const tab = currentTab; currentTab = null;
	try {
		(await Tabs.update(tab.id, { url: 'about:reader?url='+ encodeURIComponent(tab.url), }));
	} catch (error) { reportError({ message: `It seems firefox doesn't support this yet`, }); }
});

Object.assign(global, { makeBook, reportError, offerReader, }); // for debugging

}); })(this);
