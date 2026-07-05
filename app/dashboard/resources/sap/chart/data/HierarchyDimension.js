/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/chart/data/Dimension","sap/chart/utils/ChartUtils"],function(e,t){"use strict";var i=e.extend("sap.chart.data.HierarchyDimension",{metadata:{library:"sap.chart",properties:{level:{type:"int",defaultValue:0}}}});i.prototype.setLevel=t.makeNotifyParentProperty("level");i.prototype._getEffectiveLevel=function(){if(this._iEffectiveLevel==null){return this.getLevel()}else{return this._iEffectiveLevel}};return i});
//# sourceMappingURL=HierarchyDimension.js.map