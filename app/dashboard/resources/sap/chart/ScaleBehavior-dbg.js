/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides enumeration for sap.chart.ScaleBehavior
sap.ui.define(["sap/ui/base/DataType"], function(DataType) {
    "use strict";

    /**
     * Enumeration for the value axes scale behavior of analytical chart.
     *
     * @enum {string}
     * @public
     * @alias sap.chart.ScaleBehavior
     */
    var ScaleBehavior = {
        /**
         * Value axes scale is automatic.
         * @public
         */
        AutoScale: "AutoScale",
        /**
         * Value axes scale is fixed.
         * @public
         */
        FixedScale: "FixedScale"
    };

    DataType.registerEnum("sap.chart.ScaleBehavior", ScaleBehavior);

    return ScaleBehavior;

}, /* bExport= */ true);
