/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","./library","sap/ui/core/Element","sap/m/library"],function(jQuery,r,e,t){"use strict";const a=t.ValueCSSColor;const l=r.MicroChartColorType;var u=e.extend("sap.suite.ui.microchart.StackedBarMicroChartBar",{metadata:{library:"sap.suite.ui.microchart",properties:{value:{type:"float",group:"Data",defaultValue:"0"},valueColor:{type:"string",group:"Appearance",defaultValue:null},displayValue:{type:"string",group:"Data",defaultValue:null}}}});u.prototype.setValue=function(r,e){var t=Number.isFinite(Number(r));return this.setProperty("value",t?r:NaN,e)};u.prototype.setValueColor=function(r,e){var t=false;if(l.hasOwnProperty(r)||(r==null||r=="")){t=true}else{t=a.isValid(r)}if(r!=null&&!t){throw new Error(`Value ${r} is not valid for property "valueColor"`)}return this.setProperty("valueColor",t?r:null,e)};return u});
//# sourceMappingURL=StackedBarMicroChartBar.js.map