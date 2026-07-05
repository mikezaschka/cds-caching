/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["./library","sap/ui/core/Element","sap/suite/ui/microchart/MicroChartUtils"],function(t,r,e){"use strict";const i=t.MicroChartColorType;var a=r.extend("sap.suite.ui.microchart.HarveyBallMicroChartItem",{metadata:{library:"sap.suite.ui.microchart",properties:{color:{group:"Misc",type:"string",defaultValue:i.Neutral},fraction:{group:"Misc",type:"float",defaultValue:0},fractionLabel:{group:"Misc",type:"string"},fractionScale:{group:"Misc",type:"string"},formattedLabel:{group:"Misc",type:"boolean",defaultValue:false}}}});a.prototype.init=function(){this.setAggregation("tooltip","((AltText))",true)};e.extendMicroChartSetColor(a);return a});
//# sourceMappingURL=HarveyBallMicroChartItem.js.map