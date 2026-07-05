/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Lib"],function(e){"use strict";var t={apiVersion:2,extendMicroChartRenderer:function(t){t._renderNoData=function(t,i){if(!i.getHideOnNoData()){t.openStart("div",i);this._writeMainProperties(t,i);t.openEnd();t.openStart("div");t.class("sapSuiteUiMicroChartNoData");t.openEnd();t.openStart("div");t.class("sapSuiteUiMicroChartNoDataTextWrapper");t.openEnd();var r=e.getResourceBundleFor("sap.suite.ui.microchart");var a=r.getText("NO_DATA");t.openStart("span").openEnd();t.text(a);t.close("span");t.close("div");t.close("div");t.close("div")}};t._renderActiveProperties=function(e,t){var i=t.hasListeners("press");if(i){if(t._hasData()){e.class("sapSuiteUiMicroChartPointer")}e.attr("tabindex","0")}}}};return t},true);
//# sourceMappingURL=MicroChartRenderUtils.js.map