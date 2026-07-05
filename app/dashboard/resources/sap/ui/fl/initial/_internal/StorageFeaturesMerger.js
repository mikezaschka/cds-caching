/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/Layer"],function(e,a){"use strict";var i={isKeyUser:false,isKeyUserTranslationEnabled:false,isVariantSharingEnabled:false,isPublicFlVariantEnabled:false,isVariantPersonalizationEnabled:true,isContextSharingEnabled:true,isAtoAvailable:false,isAtoEnabled:false,versioning:{},isProductiveSystem:true,isPublicLayerAvailable:false,isLocalResetEnabled:false,isZeroDowntimeUpgradeRunning:false,isVariantAuthorNameAvailable:false,system:"",client:""};function n(e){var i={};var n=!!e.features.isVersioningEnabled;if(e?.layers&&(e.layers.includes(a.CUSTOMER)||e.layers.includes("ALL"))){i[a.CUSTOMER]=n}return i}return{mergeResults(a){var s=i;a.forEach(function(a){Object.keys(a.features).forEach(function(e){if(e!=="isVersioningEnabled"){s[e]=a.features[e]}});s.versioning=e(s.versioning,n(a));if(a.isContextSharingEnabled!==undefined){s.isContextSharingEnabled=a.isContextSharingEnabled}});return s}}});
//# sourceMappingURL=StorageFeaturesMerger.js.map