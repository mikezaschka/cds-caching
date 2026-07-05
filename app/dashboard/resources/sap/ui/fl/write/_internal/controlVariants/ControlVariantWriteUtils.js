/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexState/controlVariants/VariantManagementState","sap/ui/fl/registry/Settings","sap/ui/fl/write/_internal/flexState/FlexObjectManager"],function(e,n,t){"use strict";const a={};a.deleteVariant=function(a,r,s){if(!n.getInstanceOrUndef()?.isCondensingEnabled()){return[]}const i={reference:a,vmReference:r,vReference:s};const c=e.getVariantManagementChanges(i);const l=e.getControlChangesForVariant({...i,includeReferencedChanges:false});const f=e.getVariant(i).instance;const o=e.getVariantChangesForVariant(i);const g=[f,...c,...o,...l];t.deleteFlexObjects({reference:a,flexObjects:g});return g};return a});
//# sourceMappingURL=ControlVariantWriteUtils.js.map