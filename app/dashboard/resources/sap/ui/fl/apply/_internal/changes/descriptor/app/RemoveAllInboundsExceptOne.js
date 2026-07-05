/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";function n(n){if(!n["sap.app"].hasOwnProperty("crossNavigation")){throw new Error("No sap.app/crossNavigation path exists in the manifest")}if(!n["sap.app"].crossNavigation.hasOwnProperty("inbounds")){throw new Error("No sap.app/crossNavigation/inbounds path exists in the manifest")}}function o(n){var o=n.inboundId;if(o===""){throw new Error("The ID of your inbound is empty")}if(typeof o!=="string"){throw new Error("The type of your inbound ID must be string")}return o}function i(n,o){var i={};i[o]=n["sap.app"].crossNavigation.inbounds[o];n["sap.app"].crossNavigation.inbounds=i}var s={applyChange(s,r){n(s);var a=o(r.getContent());if(s["sap.app"].crossNavigation.inbounds[a]){i(s,a)}else{throw new Error(`No inbound exists with the ID "${a}" in sap.app/crossNavigation/inbounds`)}return s}};return s});
//# sourceMappingURL=RemoveAllInboundsExceptOne.js.map