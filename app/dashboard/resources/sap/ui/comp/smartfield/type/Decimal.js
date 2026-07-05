/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/Decimal"],function(t){"use strict";var o=t.extend("sap.ui.comp.smartfield.type.Decimal",{constructor:function(o,e){t.apply(this,arguments);this.oFieldControl=null}});o.prototype.parseValue=function(o,e){var i=t.prototype.parseValue.apply(this,arguments);if(typeof this.oFieldControl==="function"){this.oFieldControl(o,e)}return i};o.prototype.destroy=function(){t.prototype.destroy.apply(this,arguments);this.oFieldControl=null};o.prototype.getName=function(){return"sap.ui.comp.smartfield.type.Decimal"};return o});
//# sourceMappingURL=Decimal.js.map