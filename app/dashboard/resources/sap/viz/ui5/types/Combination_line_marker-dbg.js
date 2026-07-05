/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Combination_line_marker.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Combination_line_marker
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for the visual markers for data points
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
	 * @alias sap.viz.ui5.types.Combination_line_marker
	 */
	var Combination_line_marker = BaseStructuredType.extend("sap.viz.ui5.types.Combination_line_marker", /** @lends sap.viz.ui5.types.Combination_line_marker.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the visibility of the data point markers
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set the shape of the data point markers
			 */
			shape : {type : "string[]", defaultValue : ['circle']},

			/**
			 * Set the size of the data point markers, ranging from '4' to '32'. If you enter a value outside the range, the size defaults to '6'.
			 */
			size : {type : "int", defaultValue : 6},

			/**
			 * Set the number to enable events for markers when they are invisible. If the total amount of markers is bigger than this value, markers will remain hidden when selected or hovered over. The default value is Number.POSITIVE_INFINITY, which is the largest possible value.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			number : {type : "int", deprecated: true}
		}
	}});


	return Combination_line_marker;

});
