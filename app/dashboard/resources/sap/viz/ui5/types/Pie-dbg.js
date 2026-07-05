/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Pie.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Pie
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Pie
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
	 * @alias sap.viz.ui5.types.Pie
	 */
	var Pie = BaseStructuredType.extend("sap.viz.ui5.types.Pie", /** @lends sap.viz.ui5.types.Pie.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the color palette for the sectors of the pie chart
			 */
			colorPalette : {type : "string[]", defaultValue : ['#748CB2','#9CC677','#EACF5E','#F9AD79','#D16A7C','#8873A2','#3A95B3','#B6D949','#FDD36C','#F47958','#A65084','#0063B1','#0DA841','#FCB71D','#F05620','#B22D6E','#3C368E','#8FB2CF','#95D4AB','#EAE98F','#F9BE92','#EC9A99','#BC98BD','#1EB7B2','#73C03C','#F48323','#EB271B','#D9B5CA','#AED1DA','#DFECB2','#FCDAB0','#F5BCB4']},

			/**
			 * Set the chart to display as a donut or a pie. If this value is set to 'true', the chart displays as a donut. If this value is set to 'false', the chart displays as a pie.
			 */
			isDonut : {type : "boolean", defaultValue : false},

			/**
			 * Set whether the chart displays as a geo pie chart. If this value is set to 'true', the chart displays as a geo pie chart. If this value is set to 'false', the chart does not display as a geo pie chart.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isGeoPie : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the vertical aligment of the chart
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			valign : {type : "sap.viz.ui5.types.Pie_valign", defaultValue : sap.viz.ui5.types.Pie_valign.top, deprecated: true},

			/**
			 * Set the drawing effect of the pie
			 */
			drawingEffect : {type : "sap.viz.ui5.types.Pie_drawingEffect", defaultValue : sap.viz.ui5.types.Pie_drawingEffect.normal},

			/**
			 * Rules to format data points, sample:  [{condition: [{Key1:"Value1", Key2:"Value2"}], color:"#00ff00"}, {condition: [{Key3:"Value3"}], color:"#00ffff"}].  Each rule has two properties: "condition" and "color". The relation among the condition object in "condition" array is "OR",  which means the data point that met any condition in the array will apply the "color".  If multiple rules could apply on the same data point, the last rule would take effect.
			 */
			formatRules : {type : "object[]"},

			/**
			 * Set the plot scale of the pie
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			plotScale : {type : "float", defaultValue : 1, deprecated: true}
		},

		aggregations: {

			/**
			 * Settings for animations in the plot area
			 */
			animation : {type : "sap.viz.ui5.types.Pie_animation", multiple : false},

			/**
			 * Settings for tooltip related properties
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			toolTip : {type : "sap.viz.ui5.types.Pie_tooltip", multiple : false, deprecated: true}
		}
	}});


	return Pie;

});
