/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/registry/Settings","sap/ui/fl/Utils"],function(t,n){"use strict";async function e(){const n=await t.getInstance();return Object.keys(n._oSettings).map(function(t){var e=n._oSettings[t];if(t==="versioning"){e=e.CUSTOMER||e.ALL}return{key:t,value:e}})}return async function(t){if(!t){const t=await n.getUShellService("AppLifeCycle");return e(t.getCurrentApplication().componentInstance)}return e(t)}});
//# sourceMappingURL=getFlexSettings.js.map