(function(global) { 'use strict'; define(async ({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/storage': { sync: storage, },
	'node_modules/web-ext-utils/options/': Options,
}) => {

const model = {
	setNavProperty: {
		title: `Set 'nav' property`,
		description: `Standard compliant when set, but disables the navigation in Sumatra PDF`,
		default: false,
		input: { type: 'boolean', },
	},
	collectStyles: {
		title: `Keep style information`,
		description: `If enabled, some style information are extracted, but some readers won't be able to change the font settings when styles are set.
		Only applies to <code>overdrive.com</code>, reader mode always removes all styles.`,
		default: false,
		input: { type: 'boolean', },
	},
};

return (await new Options({ model, storage, prefix: 'options', })).children;

}); })(this);
