/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],()=>{"use strict";const e={apiVersion:2};e.CSS_CLASS="sapUiMdcFilterBarBase";e.render=function(t,i){t.openStart("div",i);t.class(e.CSS_CLASS);if(i.isA("sap.ui.mdc.filterbar.p13n.AdaptationFilterBar")&&i.getProperty("_useFixedWidth")){t.style("width",i.getWidth())}t.openEnd();const r=i.getAggregation("layout")?i.getAggregation("layout").getInner():null;t.renderControl(r);t.close("div")};return e},true);
//# sourceMappingURL=FilterBarBaseRenderer.js.map