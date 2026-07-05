/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Bar.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Bar
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Bar
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
	 * @alias sap.viz.ui5.types.Bar
	 */
	var Bar = BaseStructuredType.extend("sap.viz.ui5.types.Bar", /** @lends sap.viz.ui5.types.Bar.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set the orientation of the plot area.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			orientation : {type : "sap.viz.ui5.types.Bar_orientation", defaultValue : sap.viz.ui5.types.Bar_orientation.vertical, deprecated: true},

			/**
			 * Set the color palette for the chart. This is not supported for dual axis charts that have measureNamesDimension bound to the legend.
			 */
			colorPalette : {type : "string[]", defaultValue : ['#748CB2','#9CC677','#EACF5E','#F9AD79','#D16A7C','#8873A2','#3A95B3','#B6D949','#FDD36C','#F47958','#A65084','#0063B1','#0DA841','#FCB71D','#F05620','#B22D6E','#3C368E','#8FB2CF','#95D4AB','#EAE98F','#F9BE92','#EC9A99','#BC98BD','#1EB7B2','#73C03C','#F48323','#EB271B','#D9B5CA','#AED1DA','#DFECB2','#FCDAB0','#F5BCB4']},

			/**
			 * Set the color palette for axis 1 in dual charts.
			 */
			primaryValuesColorPalette : {type : "string[]", defaultValue : ['#8FBADD','#B8D4E9','#7AAED6','#A3C7E3','#3D88C4','#66A1D0','#297CBE','#5295CA','#005BA3','#146FB7','#005395','#0063B1']},

			/**
			 * Set the color palette for axis 2 in dual chart.
			 */
			secondaryValuesColorPalette : {type : "string[]", defaultValue : ['#F6A09B','#F9C3C0','#F58E88','#F8B1AD','#F05B52','#F37D76','#EE4A40','#F16C64','#D92419','#ED382D','#C52117','#EB271B']},

			/**
			 * Set the drawing effect for the plot area. If this value is set to 'glossy', the plot area is glossy. If this value is set to 'normal', the plot area is matte.
			 */
			drawingEffect : {type : "sap.viz.ui5.types.Bar_drawingEffect", defaultValue : sap.viz.ui5.types.Bar_drawingEffect.normal},

			/**
			 * Set whether bars have rounded corners
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isRoundCorner : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set where the image fill is enabled.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			imageFill : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the images that fill the bars.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			imagePalette : {type : "string[]", defaultValue : ['http://www.sap.com/global/ui/images/global/sap-logo.png'], deprecated: true},

			/**
			 * Sample value for formatRules:  [{condition: [{Key1:Value1, Key2:Value2}], color:"#00ff00"}, {condition: [{Key3:Value3}], color:"#00ffff"}].   Each rule has two properties: the "condition" and the "color".   Value1, Value2 and Value3 are values. <br />  The value of a dimension may be <br />  1, Single value (string), like "China" . <br />  2. Array (enumeration), like ["UK","USA"] . <br />  The value of a measure may be <br />  1, Single value (number), like 20 . <br />  2. Arry (enumeration), like [121,122] . <br />  3. Object (range), like {min:100, max 200} . Min and max are inclusive.   If users want to inlcude 200, but not 100 in the range, they may use {min:100.00001, max:200}.   If users want values larger than 100, they may write {min:100}. <br />   The color is applied if one or more conditions in the condition array is met.   If multiple rules could apply on the same data point, it is the last rule that takes effect.
			 */
			formatRules : {type : "object[]"}
		},

		aggregations: {

			/**
			 * Settings for tooltip related properties
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			toolTip : {type : "sap.viz.ui5.types.Bar_tooltip", multiple : false, deprecated: true},

			/**
			 * Settings for animations in the plot area
			 */
			animation : {type : "sap.viz.ui5.types.Bar_animation", multiple : false}
		}
	}});


	return Bar;

});
