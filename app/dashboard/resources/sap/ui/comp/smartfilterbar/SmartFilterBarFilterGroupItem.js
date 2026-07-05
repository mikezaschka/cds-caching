/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/filterbar/FilterGroupItem","sap/ui/comp/library","sap/base/Log"],function(t,r,e){"use strict";var o=t.extend("sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem",{metadata:{library:"sap.ui.comp"}});o.prototype.getControl=function(){e.warning("Using deprecated method: sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem#getControl. Use sap.ui.core.Core.byId instead.");return o.prototype._getControl.apply(this,arguments)};o.prototype._getControl=function(){return t.prototype.getControl.apply(this,arguments)};return o});
//# sourceMappingURL=SmartFilterBarFilterGroupItem.js.map