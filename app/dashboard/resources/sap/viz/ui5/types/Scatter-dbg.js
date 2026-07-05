/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Scatter.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Scatter
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Scatter
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
	 * @alias sap.viz.ui5.types.Scatter
	 */
	var Scatter = BaseStructuredType.extend("sap.viz.ui5.types.Scatter", /** @lends sap.viz.ui5.types.Scatter.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the color of the bubbles
			 */
			colorPalette : {type : "string[]", defaultValue : ['#748CB2','#9CC677','#EACF5E','#F9AD79','#D16A7C','#8873A2','#3A95B3','#B6D949','#FDD36C','#F47958','#A65084','#0063B1','#0DA841','#FCB71D','#F05620','#B22D6E','#3C368E','#8FB2CF','#95D4AB','#EAE98F','#F9BE92','#EC9A99','#BC98BD','#1EB7B2','#73C03C','#F48323','#EB271B','#D9B5CA','#AED1DA','#DFECB2','#FCDAB0','#F5BCB4']},

			/**
			 * Set the shape of the bubbles
			 */
			shapePalette : {type : "string[]", defaultValue : ['circle','square','diamond','triangleUp','triangleDown','triangleLeft','triangleRight','cross','intersection']},

			/**
			 * Set the max value of primary values
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			maxPriValue : {type : "float", defaultValue : 0, deprecated: true},

			/**
			 * Set the minimum value of primary values
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			minPriValue : {type : "float", defaultValue : 0, deprecated: true},

			/**
			 * Set the max value of secondary values
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			maxSecValue : {type : "float", defaultValue : 0, deprecated: true},

			/**
			 * Set the minimum value of secondary values
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			minSecValue : {type : "float", defaultValue : 0, deprecated: true},

			/**
			 * Set whether it is time based scatter/bubble
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			timeBased : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the drawing effect for the bubbles
			 */
			drawingEffect : {type : "sap.viz.ui5.types.Scatter_drawingEffect", defaultValue : sap.viz.ui5.types.Scatter_drawingEffect.normal},

			/**
			 * Sample value for formatRules:  [{condition: [{Key1:Value1, Key2:Value2}], color:"#00ff00"}, {condition: [{Key3:Value3}], color:"#00ffff"}].   Each rule has two properties: the "condition" and the "color".   Value1, Value2 and Value3 are values. <br />  The value of a dimension may be <br />  1, Single value (string), like "China" . <br />  2. Array (enumeration), like ["UK","USA"] . <br />  The value of a measure may be <br />  1, Single value (number), like 20 . <br />  2. Arry (enumeration), like [121,122] . <br />  3. Object (range), like {min:100, max 200} . Min and max are inclusive.   If users want to inlcude 200, but not 100 in the range, they may use {min:100.00001, max:200}.   If users want values larger than 100, they may write {min:100}. <br />   The color is applied if one or more conditions in the condition array is met.   If multiple rules could apply on the same data point, it is the last rule that takes effect.
			 */
			formatRules : {type : "object[]"},

			/**
			 * Show/hide the data of negetive value.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			showNegativeValues : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set the marker size for data points. The available range is from '4' to '32'.
			 */
			markerSize : {type : "int", defaultValue : 10}
		},

		aggregations: {

			/**
			 * Settings for animations in bubble and scatter charts
			 */
			animation : {type : "sap.viz.ui5.types.Scatter_animation", multiple : false},

			/**
			 * Set tooltip related properties.
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			axisTooltip : {type : "sap.viz.ui5.types.Scatter_axisTooltip", multiple : false, deprecated: true},

			/**
			 * Settings for hoverline properties.
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			hoverline : {type : "sap.viz.ui5.types.Scatter_hoverline", multiple : false, deprecated: true}
		}
	}});


	return Scatter;

});
