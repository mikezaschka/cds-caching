/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Treemap.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Treemap
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Treemap
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
	 * @alias sap.viz.ui5.types.Treemap
	 */
	var Treemap = BaseStructuredType.extend("sap.viz.ui5.types.Treemap", /** @lends sap.viz.ui5.types.Treemap.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the starting color of the tree map
			 */
			startColor : {type : "string", defaultValue : '#C2E3A9'},

			/**
			 * Set the end color of the tree map
			 */
			endColor : {type : "string", defaultValue : '#73C03C'},

			/**
			 * Set the color palette for the various sectors. For example, ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79", "#D16A7C"].
			 */
			colorPalette : {type : "string[]"},

			/**
			 * Set the MBC legend values. For example, [10,11,12,13,14,15]. The values in the array should be in ascending order. If the number of values in the array is smaller than the MBC legend segment number, the MBC legend automatically calculates the values according to the data. If the number of values in the legendValues array is larger than MBC legend segment number, then only the first "segment number + 1" values are used.
			 */
			legendValues : {type : "int[]"},

			/**
			 * Sample value for formatRules:  [{condition: [{Key1:Value1, Key2:Value2}], color:"#00ff00"}, {condition: [{Key3:Value3}], color:"#00ffff"}].   Each rule has two properties: the "condition" and the "color".   Value1, Value2 and Value3 are values. <br />  The value of a dimension may be <br />  1, Single value (string), like "China" . <br />  2. Array (enumeration), like ["UK","USA"] . <br />  The value of a measure may be <br />  1, Single value (number), like 20 . <br />  2. Arry (enumeration), like [121,122] . <br />  3. Object (range), like {min:100, max 200} . Min and max are inclusive.   If users want to inlcude 200, but not 100 in the range, they may use {min:100.00001, max:200}.   If users want values larger than 100, they may write {min:100}. <br />   The color is applied if one or more conditions in the condition array is met.   If multiple rules could apply on the same data point, it is the last rule that takes effect.
			 */
			formatRules : {type : "object[]"}
		},

		aggregations: {

			/**
			 * Settings for the border
			 */
			border : {type : "sap.viz.ui5.types.Treemap_border", multiple : false},

			/**
			 * Settings for animations in the plot area
			 */
			animation : {type : "sap.viz.ui5.types.Treemap_animation", multiple : false},

			/**
			 * Settings for tooltip
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			toolTip : {type : "sap.viz.ui5.types.Treemap_tooltip", multiple : false, deprecated: true}
		}
	}});


	return Treemap;

});
