/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function(){"use strict";var e={apiVersion:2};e.render=function(e,t){e.openStart("div",t).class("sapRangeSliderVizFrame").style("width",t.getWidth()).style("height",t.getHeight()).style("position","relative").openEnd();e.renderControl(t.getAggregation("_vizFrame"));e.renderControl(t.getAggregation("_rangeSlider"));e.close("div")};return e},true);
//# sourceMappingURL=VizSliderRenderer.js.map