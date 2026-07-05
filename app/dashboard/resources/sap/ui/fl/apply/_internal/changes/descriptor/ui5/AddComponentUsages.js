/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e={applyChange(e,n){var s=n.getContent().componentUsages;e["sap.ui5"].componentUsages||={};var t=e["sap.ui5"].componentUsages;Object.keys(s).forEach(function(e){if(t[e]){throw new Error(`Component usage '${e}' already exists`)}else{t[e]=s[e]}});return e}};return e});
//# sourceMappingURL=AddComponentUsages.js.map