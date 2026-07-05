/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexState/changes/UIChangesState","sap/ui/fl/apply/_internal/flexState/controlVariants/VariantManagementState","sap/ui/fl/apply/_internal/flexState/FlexObjectState","sap/ui/fl/apply/_internal/flexState/FlexState","sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/ui/fl/Utils"],function(e,t,n,a,l,i){"use strict";function p(i){const p=i.oContainer.getComponentInstance();const r=l.getFlexReferenceForControl(p);return{allUIChanges:e.getAllUIChanges(r),allFlexObjects:a.getFlexObjectsDataSelector().get({reference:r}),dirtyFlexObjects:n.getDirtyFlexObjects(r),completeDependencyMap:n.getCompleteDependencyMap(r),liveDependencyMap:n.getLiveDependencyMap(r),variantManagementMap:t.getVariantManagementMap().get({reference:r})}}return async function(e){if(!e){const e=await i.getUShellService("AppLifeCycle");return p(e.getCurrentApplication().componentInstance)}return p(e)}});
//# sourceMappingURL=getFlexObjectInfos.js.map