/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/Version"],function(n){"use strict";var e={applyChange(e,r){var i=r.getContent().minUI5Version;if(!i){throw new Error("No minUI5Version in change content provided")}if(typeof i==="string"){i=[i]}const o={};i.forEach(function(e){const r=new n(e);if(o[r.getMajor()]){throw new Error("Each major version can only be provided once in minUI5Version of change content")}o[r.getMajor()]=[e,r]});var{minUI5Version:t}=e["sap.ui5"].dependencies;if(!t){throw new Error("sap.ui5/dependencies/minUI5Version missing in base manifest")}if(typeof t==="string"){t=[t]}t=t.map(function(e){const r=new n(e);const i=o[r.getMajor()];if(!i){return null}const[t,s]=i;return r.compareTo(s)<=0?t:e}).filter(n=>n);if(t.length===0){throw new Error("Upgrade/Downgrade for different major version not possible")}e["sap.ui5"].dependencies.minUI5Version=t.length===1?t[0]:t;return e}};return e});
//# sourceMappingURL=SetMinUI5Version.js.map