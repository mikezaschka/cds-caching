/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/appVariant/DescriptorChangeTypes","sap/ui/fl/apply/_internal/flexObjects/FlexObject"],function(e,t){"use strict";var n=t.extend("sap.ui.fl.apply._internal.flexObjects.AppDescriptorChange",{metadata:{properties:{appDescriptorChange:{type:"boolean",defaultValue:true}}}});n.getMappingInfo=function(){return{...t.getMappingInfo(),appDescriptorChange:"appDescriptorChange"}};n.prototype.getMappingInfo=function(){return n.getMappingInfo()};n.prototype.getIdForCondensing=function(){return`appDescriptor_${this.getFlexObjectMetadata().reference}`};n.prototype.canBeCondensed=function(){return e.getCondensableChangeTypes().includes(this.getChangeType())};n.prototype.getSelector=function(){return{}};n.prototype.isValidForDependencyMap=function(){return false};n.prototype.getVariantReference=function(){return undefined};return n});
//# sourceMappingURL=AppDescriptorChange.js.map