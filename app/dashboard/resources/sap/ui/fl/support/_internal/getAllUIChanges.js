/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexState/changes/UIChangesState","sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/ui/fl/Utils"],function(e,n,t){"use strict";function a(t){const a=t.oContainer.getComponentInstance();const i=n.getFlexReferenceForControl(a);return e.getAllUIChanges(i)}return async function(e){if(!e){const e=await t.getUShellService("AppLifeCycle");return a(e.getCurrentApplication().componentInstance)}return a(e)}});
//# sourceMappingURL=getAllUIChanges.js.map