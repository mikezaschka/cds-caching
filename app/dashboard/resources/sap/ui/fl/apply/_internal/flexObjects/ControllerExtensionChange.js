/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexObjects/FlexObject"],function(e){"use strict";var t=e.extend("sap.ui.fl.apply._internal.flexObjects.ControllerExtensionChange",{metadata:{properties:{controllerName:{type:"string"}}}});t.getMappingInfo=function(){return{...e.getMappingInfo(),controllerName:"selector.controllerName"}};t.prototype.getMappingInfo=function(){return t.getMappingInfo()};t.prototype.getSelector=function(){return{controllerName:this.getControllerName()}};t.prototype.getVariantReference=function(){return undefined};t.prototype.isValidForDependencyMap=function(){return false};t.prototype.setInitialApplyState=function(){};t.prototype.getModuleName=function(){return this.getFlexObjectMetadata().moduleName};return t});
//# sourceMappingURL=ControllerExtensionChange.js.map