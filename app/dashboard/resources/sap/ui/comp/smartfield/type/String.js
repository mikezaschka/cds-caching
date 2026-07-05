/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/String"],function(t){"use strict";var o=t.extend("sap.ui.comp.smartfield.type.String",{constructor:function(o,e){t.apply(this,arguments);this.oFormatOptions=o;this.oFieldControl=null}});o.prototype.parseValue=function(o,e){var i=t.prototype.parseValue.apply(this,arguments);if(this.oFormatOptions&&this.oFormatOptions.displayFormat==="UpperCase"&&i&&i.toUpperCase){i=i.toUpperCase()}if(typeof this.oFieldControl==="function"){this.oFieldControl(o,e)}return i};o.prototype.getName=function(){return"sap.ui.comp.smartfield.type.String"};return o});
//# sourceMappingURL=String.js.map