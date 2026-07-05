/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
    "use strict";

    /**
     * Enumeration for the constants used in vizFrame
     */
     var vizFrameConstants = {
        ERROR_TYPE: {
            NODATA: 'NO_DATA',
            MULTIPLEUNITS: 'MULTIPLE_UNITS',
            INVALIDDATA: 'INVALID_DATA',
            OTHERS: 'OTHERS'
        },
        ERROR_MESSAGE: {
            MULTIPLEUNITS: 'Multiple Units',
            NODATA: "No Data"
        },
        CSS_PREFIX: 'ui5-viz-controls',
        TEMPLATE_POSTFIX: '_merged_with_cvom_by_vizframe',
        CORE_CHART_TYPES: [
            "info/column",
            "info/bar",
            "info/stacked_bar",
            "info/stacked_column",
            "info/line",
            "info/combination",
            "info/dual_combination",
            "info/dual_horizontal_combination",
            "info/bullet",
            "info/timeseries_bullet",
            "info/bubble",
            "info/time_bubble",
            "info/pie",
            "info/donut",
            "info/scatter",
            "info/vertical_bullet",
            "info/dual_stacked_bar",
            "info/100_stacked_bar",
            "info/100_dual_stacked_bar",
            "info/dual_stacked_column",
            "info/100_stacked_column",
            "info/100_dual_stacked_column",
            "info/stacked_combination",
            "info/horizontal_stacked_combination",
            "info/dual_stacked_combination",
            "info/dual_horizontal_stacked_combination",
            "info/dual_bar",
            "info/dual_column",
            "info/dual_line",
            "info/timeseries_column",
            "info/timeseries_line",
            "info/timeseries_scatter",
            "info/timeseries_bubble",
            "info/heatmap",
            "info/treemap",
            "info/waterfall",
            "info/horizontal_waterfall",
            "info/timeseries_combination",
            "info/timeseries_stacked_combination",
            "info/dual_timeseries_combination",
            "info/timeseries_stacked_column",
            "info/timeseries_100_stacked_column",
            "info/timeseries_waterfall",
            "info/area",
            "info/radar"
        ],
        DATASET_TYPES : {
          FLATTABLEDATASET  : "FLATTABLEDATASET",
          CROSSTABLEDATASET : "CROSSTABLEDATASET",
          LEGACYCROSSTABLEDATASET : "LEGACYCROSSTABLEDATASET"
        }
     };
    return vizFrameConstants;

});
