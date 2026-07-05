/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";const e={apiVersion:2};e.render=function(e,t){e.openStart("div",t);e.class("sapUiTableAction");if(!t.getRow()){e.style("display","none")}if(!t.getVisible()){e.class("sapUiTableActionHidden")}const n=t.getTooltip_AsString();if(n){e.attr("title",n)}e.openEnd();const i=t.getAggregation("_icons");e.renderControl(i[0]);e.renderControl(i[1]);e.close("div")};return e},true);
//# sourceMappingURL=RowActionRenderer.js.map