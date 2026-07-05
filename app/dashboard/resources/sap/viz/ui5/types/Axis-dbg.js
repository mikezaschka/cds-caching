/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Axis.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Axis
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Axis
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
	 * @alias sap.viz.ui5.types.Axis
	 */
	var Axis = BaseStructuredType.extend("sap.viz.ui5.types.Axis", /** @lends sap.viz.ui5.types.Axis.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set whether the axis works in independent mode. Currently, this property is used only for boxplot charts.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isIndependentMode : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Show the label as a percentage. For example '0.1' would show as '10'.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isPercentMode : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Try to keep the first label and last label when the space is limited.
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isKeepFirstAndLastLabel : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the thickness of the axis line
			 */
			lineSize : {type : "int", defaultValue : 1},

			/**
			 * Set the color of the axis line
			 */
			color : {type : "string", defaultValue : '#6c6c6c'},

			/**
			 * Set the axis type
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			type : {type : "sap.viz.ui5.types.Axis_type", defaultValue : sap.viz.ui5.types.Axis_type.value, deprecated: true},

			/**
			 * Set the visibility of the entire axis, including the axis line, gridlines, and labels
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set the position of the axis
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			position : {type : "sap.viz.ui5.types.Axis_position", defaultValue : sap.viz.ui5.types.Axis_position.bottom, deprecated: true},

			/**
			 * Set whether truncation logic is available for the category axis
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isTruncateAvailable : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set whether the label area is limited to the text area
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			forceLabelArea : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether the label selection effect is enabled. For mobile devices, the default value is 'false'.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			enableLabelSelection : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Hide axis title firstly if the space is limited.
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			hideTitleFirst : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * The ratio to limit axis' space in its container, which only accepts values between 0 and 1(0 and 1 included). All the invalid values would be replaced by default value.
			 */
			maxSizeRatio : {type : "float", defaultValue : 0.25}
		},

		aggregations: {

			/**
			 * Settings for the axis title
			 */
			title : {type : "sap.viz.ui5.types.Axis_title", multiple : false},

			/**
			 * Settings for the gridlines on the axis
			 */
			gridline : {type : "sap.viz.ui5.types.Axis_gridline", multiple : false},

			/**
			 * Settings for the axis line
			 */
			axisline : {type : "sap.viz.ui5.types.Axis_axisline", multiple : false},

			/**
			 * Settings for the labels on this axis
			 */
			label : {type : "sap.viz.ui5.types.Axis_label", multiple : false},

			/**
			 * Settings for the axis indicator
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			indicator : {type : "sap.viz.ui5.types.Axis_indicator", multiple : false, deprecated: true},

			/**
			 * Set the scale of the value axis. This property only works on value type axes.
			 */
			scale : {type : "sap.viz.ui5.types.Axis_scale", multiple : false},

			/**
			 * Settings for the layout of the category axis. This property only works for category type axes.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			layoutInfo : {type : "sap.viz.ui5.types.Axis_layoutInfo", multiple : false, deprecated: true},

			/**
			 * Settings for the ticks on the axis
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			axisTick : {type : "sap.viz.ui5.types.Axis_axisTick", multiple : false, deprecated: true}
		}
	}});


	return Axis;

});
