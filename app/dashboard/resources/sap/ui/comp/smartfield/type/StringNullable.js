/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/smartfield/type/String"],function(t){"use strict";var e=t.extend("sap.ui.comp.smartfield.type.StringNullable",{constructor:function(e,r){e=Object.assign({parseKeepsEmptyString:true},e);t.call(this,e,r)}});e.prototype.formatValue=function(e,r){if(e===null&&this.getPrimitiveType(r)==="string"){return null}return t.prototype.formatValue.call(this,e,r)};e.prototype.getName=function(){return"sap.ui.comp.smartfield.type.StringNullable"};return e});
//# sourceMappingURL=StringNullable.js.map