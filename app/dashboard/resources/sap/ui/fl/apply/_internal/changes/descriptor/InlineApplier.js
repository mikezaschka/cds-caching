/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/changes/descriptor/Applier","sap/ui/fl/apply/_internal/flexObjects/FlexObjectFactory"],function(e,t){"use strict";const n="$sap.ui.fl.changes";function r(e){const r=e&&e.getEntry&&e.getEntry(n)&&e.getEntry(n).descriptor||[];return r.map(function(e){return t.createAppDescriptorChange(e)})}const s={applyChanges(t,s){const p=r(t);const a=t.getJson();delete a[n];return p.length?e.applyChanges(a,p,s):Promise.resolve()}};return s});
//# sourceMappingURL=InlineApplier.js.map