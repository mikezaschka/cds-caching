/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    'sap/chart/utils/ChartUtils',
    'sap/chart/data/TimeDimension'
],function(
    ChartUtils,
    TimeDimension
) {
    "use strict";

    var ChartTypeAdapterUtils = {};

    function timeSeriesAdaptHandler(sChartType, aDimensions) {
        var bHasTimeDimension = aDimensions.some(function(oDim) {
            return oDim instanceof TimeDimension;
        });
        if (bHasTimeDimension) {
            return ChartUtils.CONFIG.oAdapteredChartTypes[sChartType];
        } else {
            return sChartType;
        }
    }

    ChartTypeAdapterUtils.adaptChartType = function(sChartType, aDimensions) {
        if (ChartUtils.CONFIG.oAdapteredChartTypes[sChartType]) {
            return timeSeriesAdaptHandler(sChartType, aDimensions);
        } else {
            return sChartType;
        }
    };

    return ChartTypeAdapterUtils;
});
