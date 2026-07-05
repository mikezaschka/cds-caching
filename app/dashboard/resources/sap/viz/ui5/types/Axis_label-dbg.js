/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Axis_label.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Axis_label
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for the labels on this axis
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 * @alias sap.viz.ui5.types.Axis_label
	 */
	var Axis_label = BaseStructuredType.extend("sap.viz.ui5.types.Axis_label", /** @lends sap.viz.ui5.types.Axis_label.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the visibility of the labels on this axis
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set the number format for the value axis
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			numberFormat : {type : "string", defaultValue : '', deprecated: true},

			/**
			 * Set the format strings for labels on the value axis. If a single format string is entered, it is applied to all measures. A two-dimensional array of format strings can be entered for scatter matrix charts and multiple charts with measureNamesDimension, to apply different formats to each sub-chart. For all other chart types, the first value of the first dimension of a two-dimensional array is used as a global format string. The following characters are reserved as tokens for format code: MDYHSAmdyhsa#?%0@. The letter "u" is used at the end of a format string to format values in SI units. If the letter "u" is added to a value between 1e12 and 1e-3 before SI units are applied, the value is formatted in exponential style. The remaining syntax matches Excel format strings. The following is a simple example of a two-dimensional array for a chart with two measures: [["#,##0.00 DM;-#,##.00 DM","#,##.00;-#,##.00"]].
			 */
			formatString : {type : "any", defaultValue : null},

			/**
			 * Set the unit format type. If set MetricUnits, unit K,M,G,T will be applied, eg, 5000 will display as 5K, 5000000 will display as 5M, 5000000000 will display as 5G and so on. If set FinancialUnits, unit K,M,B,T will be applied. 5000000000 will display as 5B.
			 */
			unitFormatType : {type : "sap.viz.ui5.types.Axis_label_unitFormatType", defaultValue : sap.viz.ui5.types.Axis_label_unitFormatType.FinancialUnits},

			/**
			 * Set the visibility of the sub levels of labels on this axis
			 */
			hideSubLevels : {type : "boolean", defaultValue : false}
		}
	}});


	return Axis_label;

});
