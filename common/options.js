(function(global) { 'use strict'; define(async ({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/storage': { sync: storage, },
	'node_modules/web-ext-utils/browser/version': { fennec, },
	'node_modules/web-ext-utils/options/': Options,
}) => {

const model = {
	defaultLanguage: {
		title: `Default Book Language`,
		description: `Default '<dc:language>' to set if none could be detected.`,
		default: 'en',
		restrict: { match: (/^[a-z]{2,10}(:?-[A-Z]{2,10})?$/), message: `Must be n ISO language code, e.g. 'en' or 'en-US'`, },
		input: { type: 'string', },
	},
	setNavProperty: {
		title: `Set 'nav' Property`,
		description: `Standard compliant when set, but disables the navigation in Sumatra PDF.`,
		default: false,
		input: { type: 'boolean', },
	},
	collectStyles: {
		title: `Keep Style Information`,
		description: `If enabled, some style information are extracted, but some readers won't be able to change the font settings when styles are set.
		Only applies to <code>overdrive.com</code>, reader mode always removes all styles.`,
		default: false,
		input: { type: 'boolean', },
	},
	alwaysReader: {
		title: `Always force reader mode`,
		description: `Directly, without prompting, use the reader mode extraction even on pages where it is not recognized as supported.
		May lead to unexpected results or errors without warning first.`,
		default: fennec,
		input: { type: 'boolean', },
	},
};

return (await new Options({ model, storage, prefix: 'options', })).children;

}); })(this);
