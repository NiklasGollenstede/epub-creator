(function() { 'use strict'; define(function({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/es6lib/port': Port, // required to use handleRequireRequests
	'node_modules/web-ext-utils/update/': updated,
	'node_modules/web-ext-utils/utils': { handleRequireRequests, },
}) {

handleRequireRequests();

}); })();
