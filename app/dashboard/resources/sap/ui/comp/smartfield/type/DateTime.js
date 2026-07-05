/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/DateTime"],function(t){"use strict";var e=t.extend("sap.ui.comp.smartfield.type.DateTime",{constructor:function(e,o){t.apply(this,arguments);this.oFieldControl=null}});e.prototype.parseValue=function(e,o){var i=t.prototype.parseValue.apply(this,arguments);if(typeof this.oFieldControl==="function"){this.oFieldControl(e,o)}return i};e.prototype.destroy=function(){t.prototype.destroy.apply(this,arguments);this.oFieldControl=null};e.prototype.getName=function(){return"sap.ui.comp.smartfield.type.DateTime"};return e});
//# sourceMappingURL=DateTime.js.map