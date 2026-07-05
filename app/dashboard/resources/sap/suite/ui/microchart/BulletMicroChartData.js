/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["./library","sap/ui/core/Element"],function(t,e){"use strict";var r=e.extend("sap.suite.ui.microchart.BulletMicroChartData",{metadata:{library:"sap.suite.ui.microchart",properties:{value:{type:"float",group:"Misc",defaultValue:"0"},color:{type:"sap.m.ValueColor",group:"Misc",defaultValue:"Neutral"}}}});r.prototype.init=function(){this.setAggregation("tooltip","((AltText))",true)};r.prototype.setValue=function(t){this._isValueSet=this._fnIsNumber(t);return this.setProperty("value",this._isValueSet?t:NaN)};r.prototype._fnIsNumber=function(t){return typeof t=="number"&&!isNaN(t)&&isFinite(t)};r.prototype.clone=function(t,r,i){var u=e.prototype.clone.apply(this,arguments);u._isValueSet=this._isValueSet;return u};return r});
//# sourceMappingURL=BulletMicroChartData.js.map