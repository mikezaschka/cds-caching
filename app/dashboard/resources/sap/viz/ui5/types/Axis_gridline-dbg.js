/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Axis_gridline.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Axis_gridline
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for the gridlines on the axis
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
	 * @alias sap.viz.ui5.types.Axis_gridline
	 */
	var Axis_gridline = BaseStructuredType.extend("sap.viz.ui5.types.Axis_gridline", /** @lends sap.viz.ui5.types.Axis_gridline.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the visibility of gridlines on the axis
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Disable gridline or not
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			disable : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether the first gridline on the axis appears
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			showFirstLine : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether the last gridline on the axis appears
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			showLastLine : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the line type of gridlines on the axis
			 */
			type : {type : "sap.viz.ui5.types.Axis_gridline_type", defaultValue : sap.viz.ui5.types.Axis_gridline_type.line},

			/**
			 * Set the color of the gridlines on the axis
			 */
			color : {type : "string", defaultValue : '#d8d8d8'},

			/**
			 * Set the line size of gridlines on the axis
			 */
			size : {type : "int", defaultValue : 1}
		}
	}});


	return Axis_gridline;

});
