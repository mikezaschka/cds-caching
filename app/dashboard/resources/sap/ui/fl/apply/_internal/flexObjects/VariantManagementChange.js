/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/util/reflection/JsControlTreeModifier","sap/ui/fl/apply/_internal/flexObjects/FlexObject"],function(e,t){"use strict";const n=t.extend("sap.ui.fl.apply._internal.flexObjects.VariantManagementChange",{metadata:{properties:{selector:{type:"object",defaultValue:{}}}},constructor:function(...e){t.apply(this,e);this.setFileType("ctrl_variant_management_change")}});n.getMappingInfo=function(){return{...t.getMappingInfo(),selector:"selector"}};n.prototype.getMappingInfo=function(){return n.getMappingInfo()};n.prototype.getIdForCondensing=function(t,n){return e.getControlIdBySelector(this.getSelector(),n)};n.prototype.canBeCondensed=function(){return true};return n});
//# sourceMappingURL=VariantManagementChange.js.map