/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Tooltip.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Tooltip
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Tooltip
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
	 * @alias sap.viz.ui5.types.Tooltip
	 */
	var Tooltip = BaseStructuredType.extend("sap.viz.ui5.types.Tooltip", /** @lends sap.viz.ui5.types.Tooltip.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * A callback function can be specified as a parameter and passed to chart options when the user calls the createViz function. This callback function is called before the tooltip is rendered. The input parameter is a dom element, which is at the bottom of the tooltip. Any dom element such as a button can be appended to this parent node. It can only be called when the tooltip is in actionMode.
			 */
			preRender : {type : "any", defaultValue : null},

			/**
			 * A callback function can be specified as a parameter and passed to chart options when the user calls the createViz function. This callback function is called after the tooltip is rendered. The user can select and change dom elements' properties under the tooltip element.
			 */
			postRender : {type : "any", defaultValue : null},

			/**
			 * Set the visibility of the tooltip
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set the drawing effect for the tooltip
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			drawingEffect : {type : "sap.viz.ui5.types.Tooltip_drawingEffect", defaultValue : sap.viz.ui5.types.Tooltip_drawingEffect.normal, deprecated: true},

			/**
			 * Set the format strings for text in the tooltip. For dual axis charts, the first array is applied to the primary axis and the second array is applied to the second axis. If you enter fewer format strings into an array than there are measures in the respective axis, then the last format string is applied to all remaining measures. The following characters are reserved as tokens for format code: MDYHSAmdyhsa#?%0@.The following is an example of an array for a chart with two measures: [["#,##0.00 DM;-#,##.00 DM","#,##.00;-#,##.00"]].
			 */
			formatString : {type : "any[]", defaultValue : null},

			/**
			 * Set whether the tooltip appears in the chart area
			 */
			layinChart : {type : "boolean", defaultValue : true}
		},

		aggregations: {

			/**
			 * Define the background style of the tooltip.
			 */
			background : {type : "sap.viz.ui5.types.Tooltip_background", multiple : false},

			/**
			 * Define the style of the label of the tooltip footer.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			footerLabel : {type : "sap.viz.ui5.types.Tooltip_footerLabel", multiple : false, deprecated: true},

			/**
			 * Define the color of the value of the tooltip separation line.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			separationLine : {type : "sap.viz.ui5.types.Tooltip_separationLine", multiple : false, deprecated: true},

			/**
			 * Define the color of the dimension name of the tooltip body.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			bodyDimensionLabel : {type : "sap.viz.ui5.types.Tooltip_bodyDimensionLabel", multiple : false, deprecated: true},

			/**
			 * Define the color of the dimension value of the tooltip body.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			bodyDimensionValue : {type : "sap.viz.ui5.types.Tooltip_bodyDimensionValue", multiple : false, deprecated: true},

			/**
			 * Define the color of the measure name of the tooltip body.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			bodyMeasureLabel : {type : "sap.viz.ui5.types.Tooltip_bodyMeasureLabel", multiple : false, deprecated: true},

			/**
			 * Define the color of the measure value of the tooltip body.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			bodyMeasureValue : {type : "sap.viz.ui5.types.Tooltip_bodyMeasureValue", multiple : false, deprecated: true},

			/**
			 * Define the background and border color of tooltip close button.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			closeButton : {type : "sap.viz.ui5.types.Tooltip_closeButton", multiple : false, deprecated: true}
		}
	}});


	return Tooltip;

});
