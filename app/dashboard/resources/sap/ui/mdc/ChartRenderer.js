/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./library"],r=>{"use strict";const e={apiVersion:2};e.CSS_CLASS="sapUiMDCChart";e.render=function(r,t){r.openStart("div",t);r.class(e.CSS_CLASS);r.style("height",t.getHeight());r.style("width",t.getWidth());r.style("min-height",t.getMinHeight());r.style("min-width",t.getMinWidth());r.openEnd();this.renderToolbar(r,t.getAggregation("_toolbar"));this.renderInfoToolbar(r,t.getAggregation("_infoToolbar"));this.renderBreadcrumbs(r,t.getAggregation("_breadcrumbs"));this.renderInnerStructure(r,t.getAggregation("_innerChart"));r.close("div")};e.renderNoDataStruct=function(r,e){if(e){}};e.renderToolbar=function(r,e){if(e){r.renderControl(e)}};e.renderBreadcrumbs=function(r,e){if(e){r.renderControl(e)}};e.renderInfoToolbar=function(r,e){if(e){r.renderControl(e)}};e.renderInnerStructure=function(r,e){r.renderControl(e)};return e},true);
//# sourceMappingURL=ChartRenderer.js.map