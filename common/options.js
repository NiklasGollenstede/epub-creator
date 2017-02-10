(function(global) { 'use strict'; define(async ({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/options/': Options,
}) => {

return new Options({ model: {
	setNavProperty: {
		title: `Set 'nav' property`,
		description: `Standard compliant when set, but disables the navigation in Sumatra PDF`,
		default: false,
		input: { type: 'bool', },
	},
	collectStyles: {
		title: `Keep style information`,
		description: `If enabled, some style information are extracted. Some readers won't be able to change the font size when styles are set.`,
		default: false,
		input: { type: 'bool', },
	},
}, });

}); })(this);
