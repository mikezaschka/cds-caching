/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides enumeration sap.chart.ChartType
sap.ui.define(["sap/ui/base/DataType"], function(DataType) {
    "use strict";


    /**
    * Enumeration for supported chart types in analytical chart
    *
    * @namespace
    * @public
    * @alias sap.chart.ChartType
    */
    var ChartType = {
        /**
         * Bar Chart
         * @public
         */
        Bar: "bar",
        /**
         * Column Chart
         * @public
         */
        Column: "column",
        /**
         * Line Chart
         * @public
         */
        Line: "line",
        /**
         * Combined Column Line Chart
         * @public
         */
        Combination: "combination",
        /**
         * Pie Chart
         * @public
         */
        Pie: "pie",
        /**
         * Donut Chart
         * @public
         */
        Donut: "donut",
        /**
         * Scatter Plot
         * @public
         */
        Scatter: "scatter",
        /**
         * Bubble Chart
         * @public
         */
        Bubble: "bubble",
        /**
         * Heat Map
         * @public
         */
        Heatmap: "heatmap",
        /**
         * Bubble Chart
         * @public
         */
        Bullet: "bullet",
        /**
         * Vertical Bullet Chart
         * @public
         */
        VerticalBullet: "vertical_bullet",
        /**
         * Stacked Bar Chart
         * @public
         */
        StackedBar: "stacked_bar",
        /**
         * Stacked Column Chart
         * @public
         */
        StackedColumn: "stacked_column",
        /**
         * Combined Stacked Line Chart
         * @public
         */
        StackedCombination: "stacked_combination",
        /**
         * Horizontal Combined Stacked Line Chart
         * @public
         */
        HorizontalStackedCombination: "horizontal_stacked_combination",
        /**
         * Bar Chart with 2 X-Axes
         * @public
         */
        DualBar: "dual_bar",
        /**
         * Column Chart with 2 Y-Axes
         * @public
         */
        DualColumn: "dual_column",
        /**
         * Line Chart with 2 Y-Axes
         * @public
         */
        DualLine: "dual_line",
        /**
         * Stacked Bar Chart with 2 X-Axes
         * @public
         */
        DualStackedBar: "dual_stacked_bar",
        /**
         * Stacked Column Chart with 2 Y-Axes
         * @public
         */
        DualStackedColumn: "dual_stacked_column",
         /**
         * Combined Column Line Chart with 2 Y-Axes
         * @public
         */
        DualCombination: "dual_combination",
         /**
         * Horizontal Combined Bar Line Chart with 2 X-Axes
         * @public
         */
        DualHorizontalCombination: "dual_horizontal_combination",
        /**
         * Combined Stacked Line Chart with 2 Y-Axes
         * @public
         */
        DualStackedCombination: "dual_stacked_combination",
        /**
         * Horizontal Combined Stacked Line Chart with 2 X-Axes
         * @public
         */
        DualHorizontalStackedCombination: "dual_horizontal_stacked_combination",
        /**
         * 100% Stacked Bar Chart
         * @public
         */
        PercentageStackedBar: "100_stacked_bar",
        /**
         * 100% Stacked Column Chart
         * @public
         */
        PercentageStackedColumn: "100_stacked_column",
        /**
         * 100% Stacked Bar Chart with 2 X-Axes
         * @public
         */
        PercentageDualStackedBar: "100_dual_stacked_bar",
        /**
         * 100% Stacked Column Chart with 2 Y-Axes
         * @public
         */
        PercentageDualStackedColumn: "100_dual_stacked_column",
        /**
         * 100% Donut Chart
         * @public
         */
        PercentageDonut: "100_donut",
        /**
         * Waterfall Chart
         * @public
         */
        Waterfall: "waterfall",
        /**
         * Horizontal Waterfall Chart
         * @public
         */
        HorizontalWaterfall: "horizontal_waterfall"
    };

    DataType.registerEnum("sap.chart.ChartType", ChartType);

    return ChartType;

}, /* bExport= */ true);
