/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/smartfield/type/TextArrangement","sap/ui/comp/smartfield/type/StringNullable","sap/ui/model/ValidateException"],function(t,e,r){"use strict";var n=t.extend("sap.ui.comp.smartfield.type.TextArrangementString");n.prototype.getName=function(){return"sap.ui.comp.smartfield.type.TextArrangementString"};n.prototype.validateValue=function(e){var n=this.oConstraints||{},i=n.maxLength,a=e[0];if(this.oFormatOptions&&this.oFormatOptions.textArrangement==="descriptionOnly"&&(a&&a.length>i)){throw new r(this.getResourceBundleText("ENTER_A_VALID_VALUE"))}else{return t.prototype.validateValue.apply(this,arguments)}};n.prototype.getPrimaryType=function(){return e};return n});
//# sourceMappingURL=TextArrangementString.js.map