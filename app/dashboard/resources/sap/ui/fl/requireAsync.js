/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";return function(e){var i=sap.ui.require(e);if(i){return Promise.resolve(i)}return new Promise(function(i,n){sap.ui.require([e],function(e){i(e)},function(e){n(e)})})}});
//# sourceMappingURL=requireAsync.js.map