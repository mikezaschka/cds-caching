/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["./library","sap/ui/core/Element","./AreaMicroChartPoint","sap/suite/ui/microchart/MicroChartUtils"],function(t,r,i,e){"use strict";const a=t.MicroChartColorType;var o=r.extend("sap.suite.ui.microchart.AreaMicroChartItem",{metadata:{library:"sap.suite.ui.microchart",properties:{color:{group:"Misc",type:"string",defaultValue:a.Neutral},title:{type:"string",group:"Misc",defaultValue:null}},defaultAggregation:"points",aggregations:{points:{multiple:true,type:"sap.suite.ui.microchart.AreaMicroChartPoint",defaultClass:i,bindable:"bindable"}}}});o.prototype.init=function(){this.setAggregation("tooltip","((AltText))",true)};e.extendMicroChartSetColor(o);return o});
//# sourceMappingURL=AreaMicroChartItem.js.map