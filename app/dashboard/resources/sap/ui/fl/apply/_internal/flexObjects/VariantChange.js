/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexObjects/FlexObject"],function(t){"use strict";const n=t.extend("sap.ui.fl.apply._internal.flexObjects.VariantChange",{metadata:{properties:{variantId:{type:"string"}}},constructor:function(...n){t.apply(this,n);this.setFileType("ctrl_variant_change")}});n.getMappingInfo=function(){return{...t.getMappingInfo(),variantId:"selector.id"}};n.prototype.getMappingInfo=function(){return n.getMappingInfo()};n.prototype.getIdForCondensing=function(){return this.getVariantId()};n.prototype.canBeCondensed=function(){return true};return n});
//# sourceMappingURL=VariantChange.js.map