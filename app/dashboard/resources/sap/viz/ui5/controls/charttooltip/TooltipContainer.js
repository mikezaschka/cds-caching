/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Control","./ContentPanel"],function(t,n){"use strict";var o=t.extend("sap.viz.ui5.controls.charttooltip.TooltipContainer",{metadata:{library:"sap.viz",properties:{}},renderer:{apiVersion:2,render:function(t,n){t.openStart("div",n).class("viz-controls-chartTooltip").openEnd().renderControl(n._oPanel).close("div")}}});o.prototype.init=function(){this._oPanel=new n};o.prototype.setContent=function(t){this._oPanel.setContent(t)};o.prototype.exit=function(){if(this._oPanel){this._oPanel.destroy();this._oPanel=null}};return o});
//# sourceMappingURL=TooltipContainer.js.map