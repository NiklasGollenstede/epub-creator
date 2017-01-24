(function() { 'use strict'; define(function*({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/options/': Options,
	'node_modules/web-ext-utils/chrome/': { Storage, },
}) {

const model = {
	setNavProperty: {
		title: `Set 'nav' property`,
		description: `Standard compliant when set, but disables the navigation in Sumatra PDF`,
		type: 'bool',
		default: false,
	},
	collectStyles: {
		title: `Keep style information`,
		description: `If enabled, some style information are extracted. Some readers won't be able to change the font size when styles are set.`,
		type: 'bool',
		default: false,
	}
};

const listerners = new WeakMap;

const options = (yield new Options({
	model,
	prefix: 'options',
	storage: Storage.sync,
	addChangeListener(listener) {
		const onChanged = changes => Object.keys(changes).forEach(key => key.startsWith('options') && listener(key, changes[key].newValue));
		listerners.set(listener, onChanged);
		Storage.onChanged.addListener(onChanged);
	},
	removeChangeListener(listener) {
		const onChanged = listerners.get(listener);
		listerners.delete(listener);
		Storage.onChanged.removeListener(onChanged);
	},
}));

options.model = Object.freeze(model);

return options;

}); })();
