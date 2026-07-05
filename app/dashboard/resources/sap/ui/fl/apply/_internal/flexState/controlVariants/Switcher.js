/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/restricted/_pick","sap/ui/fl/apply/_internal/changes/Applier","sap/ui/fl/apply/_internal/changes/Reverter","sap/ui/fl/apply/_internal/flexState/controlVariants/VariantManagementState"],function(e,a,r,n){"use strict";function t(a){const r=n.getControlChangesForVariant({...e(a,["vmReference","variantsMap","reference"]),vReference:a.currentVReference});var t=n.getControlChangesForVariant({...e(a,["vmReference","variantsMap","reference"]),vReference:a.newVReference});var i=[];if(t.length>0){i=r.slice();r.some(function(e){if(t[0]&&e.getId()===t[0].getId()){t.shift();i.shift()}else{return true}})}else{i=r}var s={changesToBeReverted:i.reverse(),changesToBeApplied:t};return s}var i={async switchVariant(e){var i=t(e);await r.revertMultipleChanges(i.changesToBeReverted,e);await a.applyMultipleChanges(i.changesToBeApplied,e);n.setCurrentVariant(e)}};return i});
//# sourceMappingURL=Switcher.js.map