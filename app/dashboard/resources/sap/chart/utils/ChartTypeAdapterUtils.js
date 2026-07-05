/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/chart/utils/ChartUtils","sap/chart/data/TimeDimension"],function(t,e){"use strict";var r={};function n(r,n){var a=n.some(function(t){return t instanceof e});if(a){return t.CONFIG.oAdapteredChartTypes[r]}else{return r}}r.adaptChartType=function(e,r){if(t.CONFIG.oAdapteredChartTypes[e]){return n(e,r)}else{return e}};return r});
//# sourceMappingURL=ChartTypeAdapterUtils.js.map