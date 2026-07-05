/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/chart/data/Dimension","sap/chart/utils/ChartUtils"],function(t,e){"use strict";var r=t.extend("sap.chart.data.TimeDimension",{metadata:{library:"sap.chart",properties:{timeUnit:{type:"sap.chart.TimeUnitType"},fiscalYearPeriodCount:{type:"object"},projectedValueStartTime:{type:"any"}}}});r.prototype.setTimeUnit=e.makeNotifyParentProperty("timeUnit");r.prototype.setFiscalYearPeriodCount=e.makeNotifyParentProperty("fiscalYearPeriodCount");r.prototype.setProjectedValueStartTime=e.makeNotifyParentProperty("projectedValueStartTime");r.prototype._setIsUTC=function(t){this._bUTC=t};r.prototype._getIsUTC=function(){return this._bUTC};r.prototype.setIsUTC=function(t){this._setIsUTC(t)};r.prototype.getIsUTC=function(){return this._getIsUTC()};return r});
//# sourceMappingURL=TimeDimension.js.map