/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexObjects/FlexObject"],function(t){"use strict";var e=t.extend("sap.ui.fl.apply._internal.flexObjects.AnnotationChange",{metadata:{properties:{serviceUrl:{type:"string",defaultValue:""}}},constructor:function(...e){t.apply(this,e);this.setFileType("annotation_change")}});e.getMappingInfo=function(){return{...t.getMappingInfo(),serviceUrl:"selector.serviceUrl"}};e.prototype.getMappingInfo=function(){return e.getMappingInfo()};e.prototype.getValue=function(){return this.getText("annotationText")?this.getText("annotationText"):this.getContent().value};e.prototype.getIdForCondensing=function(){return this.getServiceUrl()};e.prototype.canBeCondensed=function(){return true};return e});
//# sourceMappingURL=AnnotationChange.js.map