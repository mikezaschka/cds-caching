/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object"],function(e){"use strict";var t=e.extend("sap.ui.comp.rules.RulesLog");t.prototype.setInvokedMethod=function(e,t){if(this.mProperties===undefined||this.mProperties===null){this.mProperties={}}if(this.mProperties[e]===undefined){this.mProperties[e]=t}};t.prototype.getInvokedMethod=function(e){var t=null;if(this.mProperties!==undefined&&this.mProperties[e]!==undefined){t=this.mProperties[e]}return t};t.prototype.getInvokedMethods=function(){var e=null;if(this.mProperties!==undefined){e=this.mProperties}return e};return t},true);
//# sourceMappingURL=RulesLog.js.map