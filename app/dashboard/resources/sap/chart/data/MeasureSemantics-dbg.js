/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/base/DataType"], function(DataType) {
    "use strict";

    /**
     * Enum of available semantics value for Measure.
     *
     * @enum {string}
     * @public
     * @alias sap.chart.data.MeasureSemantics
     */
    var MeasureSemantics = {
        /**
         * facts that happened in the past.
         * @public
         */
        Actual: "actual",
        /**
         * where values will be, e.g.: forecasts, estimations, predictions.
         * @public
         */
        Reference: "reference",
        /**
         * where values should be, e.g.: thresholds, targets.
         * @public
         */
        Projected: "projected"
    };

    DataType.registerEnum("sap.chart.data.MeasureSemantics", MeasureSemantics);

    return MeasureSemantics;

}, /* bExport= */ true);
