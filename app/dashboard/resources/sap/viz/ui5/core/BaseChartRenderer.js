/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function(){"use strict";var t={apiVersion:2};t.render=function(t,e){var a=!e.getDataset()||!e.getDataset().getVIZDataset(),s=sap.ui.getCore().getLibraryResourceBundle("sap.viz.ui5.messages");t.openStart("div",e);if(e.getTooltip_AsString()){t.attr("title",e.getTooltip_AsString())}t.class("sapVizChart");if(a){t.class("sapVizNoData")}t.style("width",e.getWidth());t.style("height",e.getHeight());t.openEnd();if(!sap.viz.__svg_support){t.openStart("div").class("sapVizNoDataDefault").openEnd().text(s.getText("NO_SVG_SUPPORT")).close("div")}else if(a){var i=e.getNoData();if(i){t.renderControl(i)}else{t.openStart("div").class("sapVizNoDataDefault").openEnd().text(s.getText("NO_DATA")).close("div")}}t.close("div")};return t},true);
//# sourceMappingURL=BaseChartRenderer.js.map