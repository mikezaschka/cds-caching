/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/Byte"],function(t){"use strict";var o=t.extend("sap.ui.comp.smartfield.type.Byte",{constructor:function(o,e){t.apply(this,arguments);this.oFieldControl=null}});o.prototype.parseValue=function(o,e){var p=t.prototype.parseValue.apply(this,arguments);if(typeof this.oFieldControl==="function"){this.oFieldControl(o,e)}return p};o.prototype.destroy=function(){t.prototype.destroy.apply(this,arguments);this.oFieldControl=null};o.prototype.getName=function(){return"sap.ui.comp.smartfield.type.Byte"};return o});
//# sourceMappingURL=Byte.js.map