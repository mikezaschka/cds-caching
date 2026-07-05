/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],()=>{"use strict";const e=e=>{if("key"in e&&"name"in e&&e.key!==e.name){throw new Error(`The values of legacy-attribute 'name' and it's replacement 'key' must be identical.`,e)}const n=e.key||e.name;e.key=n;e.name=n;return e};return e});
//# sourceMappingURL=addKeyOrName.js.map