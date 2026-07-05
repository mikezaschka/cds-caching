/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.legend.Common.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.legend.Common
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.legend.Common
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
	 * @alias sap.viz.ui5.types.legend.Common
	 */
	var Common = BaseStructuredType.extend("sap.viz.ui5.types.legend.Common", /** @lends sap.viz.ui5.types.legend.Common.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the visibility of the legend
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set the format string for the legend. The following characters are reserved as tokens for format code: MDYHSAmdyhsa#?%0@.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			formatString : {type : "string", defaultValue : null, deprecated: true},

			/**
			 * Set whether the legend is hierarchical. This is only supported if the legend is located to the right of the chart.
			 */
			isHierarchical : {type : "boolean", defaultValue : false},

			/**
			 * Set whether the legend is scrollable. If this value is set to 'false', and there is not enough room to show the whole legend, an ellipsis (...) indicates the missing legend items.
			 */
			isScrollable : {type : "boolean", defaultValue : false},

			/**
			 * It is a deprecated property. Please use "legendGroup.layout.position" property to set legend position.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			position : {type : "sap.viz.ui5.types.legend.Common_position", defaultValue : sap.viz.ui5.types.legend.Common_position.right, deprecated: true},

			/**
			 * Set legend type for Bubble charts. Non-bubble charts are not supported.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			type : {type : "sap.viz.ui5.types.legend.Common_type", defaultValue : sap.viz.ui5.types.legend.Common_type.ColorLegend, deprecated: true},

			/**
			 * Set the alignment of the legend
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			alignment : {type : "sap.viz.ui5.types.legend.Common_alignment", defaultValue : sap.viz.ui5.types.legend.Common_alignment.start, deprecated: true},

			/**
			 * Set the drawing effect for colors in the legend. If this value is set to 'glossy', colors are glossy. If this value is set to 'normal', colors are matte.
			 */
			drawingEffect : {type : "sap.viz.ui5.types.legend.Common_drawingEffect", defaultValue : sap.viz.ui5.types.legend.Common_drawingEffect.normal}
		},

		aggregations: {

			/**
			 * Settings for the legend title
			 */
			title : {type : "sap.viz.ui5.types.legend.Common_title", multiple : false}
		}
	}});


	return Common;

});
