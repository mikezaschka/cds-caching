/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/base/DataType"], function(DataType) {
    "use strict";

    /**
    * Enumeration for supported criticality types in analytical chart
    *
    * @enum {string}
    * @public
    * @alias sap.chart.coloring.CriticalityType
    */
    var CriticalityType = {
        /**
         * Negative
         * @public
         */
        Negative: "Negative",

        /**
         * Critical
         * @public
         */
        Critical: "Critical",

        /**
         * Positive
         * @public
         */
        Positive: "Positive",

        /**
         * Neutral
         * @public
         */
        Neutral: "Neutral"
    };

    DataType.registerEnum("sap.chart.coloring.CriticalityType", CriticalityType);

    return CriticalityType;

}, /* bExport= */ true);
