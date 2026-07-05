/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides enumeration sap.chart.MeasureRoleType
sap.ui.define(["sap/ui/base/DataType"], function(DataType) {
    "use strict";


    /**
     * Enum of supported role types for Measure
     *
     * @enum {string}
     * @public
     * @alias sap.chart.data.MeasureRoleType
     */
    var MeasureRoleType = {
        /**
         * General Rules for all chart types
         * <ol>
         *   <li>All measues with role "axis1" are assigned to feed uid "valueaxis". All measures with role "axis2" are assigned to feed uid "valueaxis2". All measures with role "axis3" are assigned to feed uid "bubbleWidth".</li>
         *   <li>If a chart type does not use the feed uid "valueaxis2", then all measures with role "axis2" are treated as measures with role "axis1".</li>
         *   <li>If a chart type requires at least 1 measure on the feed uid "valueaxis" (true for all non-"dual" chart types), but there is no measure with role "axis1", then the first measure with role "axis2" is assigned to feed uid "valueaxis"</li>
         *   <li>If the chart type requires at least one measure on the feed uid "valueaxis2" (true for all "dual" chart types"), but there is no measure with role "axis2", then the first measure with role "axis3" or "axis4" or (if not exists) the last measure with role "axis1" is assigned to feed uid "valueaxis2".</li>
         * </ol>
         * @public
         */
        axis1: "axis1",
        /**
         * Measures with role "axis2" are assigned to feed uid "valueaxis2" if used.
         * If a chart type does not use the feed uid "bubbleWidth" (true for all chart types except bubble and radar), then all measures with role "axis3" or "axis4" are treated as measures with role "axis2".
         * @public
         */
        axis2: "axis2",
        /**
         * Measures with role "axis3" are assigned to feed uid "bubbleWidth" if used.
         * @public
         */
        axis3: "axis3",
        /**
         * Once used by Bullet Chart, but as this chart layout is configured via semantic patterns instead, "Asix4" has no special usage from now on.
         * @deprecated
		 * Please use other MeasureRoleType for specific usage.
         * @public
         */
        axis4: "axis4"
    };

    DataType.registerEnum("sap.chart.data.MeasureRoleType", MeasureRoleType);

    return MeasureRoleType;

}, /* bExport= */ true);
