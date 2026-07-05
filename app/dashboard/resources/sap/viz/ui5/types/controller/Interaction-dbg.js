/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.controller.Interaction.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.controller.Interaction
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.controller.Interaction
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
	 * @alias sap.viz.ui5.types.controller.Interaction
	 */
	var Interaction = BaseStructuredType.extend("sap.viz.ui5.types.controller.Interaction", /** @lends sap.viz.ui5.types.controller.Interaction.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set supported event names
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			supportedEventNames : {type : "string[]", defaultValue : ['mouseup','mousedown','mousemove','mouseout','mouseover','touchstart'], deprecated: true},

			/**
			 * Set whether mouse move is enabled
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			enableMouseMove : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set whether mouse over is enabled
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			enableMouseOver : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set whether mouse out is enabled
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			enableMouseOut : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set whether support lasso event is enabled
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			supportLassoEvent : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set whether hold selection is enabled
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			holdSelection : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether preserve selection when dragging is enabled
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			preserveSelectionWhenDragging : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set decorations relating to interaction. Each item
			 *                 that is an object of {name: 'decoration name', fn: 'decoration callback function'} is a decoration.
			 *                 Currently two decorations are supported: showDetail and hideDetail.
			 *                 These two decorations can be used to create a user-defined tooltip.
			 *
			 * If these 2 decorations are used, the default tooltip is not used,
			 *                 and the user should implement a custom tooltip.
			 *                 The showDetail decoration is called when the tooltip is shown,
			 *                 and the hideDetail decoration is called when the tooltip is hidden.
			 *
			 * The arguments of showDetail are one object of {mode: 'tooltip mode',
			 *                 data: 'data of hovering selected data point', position: 'mouse position',
			 *                 container: 'chart container dom element', selectedNumber: 'number of selected data points'}.
			 *                 'tooltip mode' is either 'infoMode' or 'actionMode'. Hovering over an unselected data point displays the infoMode tooltip,
			 *                 while hovering over a selected data point displays the actionMode tooltip.
			 *                 'data' is an array of dimensions and measures, where each item is an object of
			 *                 {name: 'dimension name or measure name', value: 'dimension member or measure value',
			 *                 type: 'literal string of dimension or measure'}. For instance,
			 *                 {name: 'Country', value: 'China', type: 'dimension'}, or
			 *                 {name: 'Profit', value: 159, type: 'measure'}.
			 *
			 * The arguments of hideDetail are a string representing tooltip mode,
			 *                 i.e. what kind of tooltip should be hidden.
			 */
			decorations : {type : "any"},

			/**
			 * Set triggers for behavior decration.
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			triggers : {type : "any", deprecated: true},

			/**
			 * Set handlers for behavior decration.
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			handlers : {type : "any", deprecated: true}
		},

		aggregations: {

			/**
			 * Settings for selectability
			 */
			selectability : {type : "sap.viz.ui5.types.controller.Interaction_selectability", multiple : false},

			/**
			 * add documentation for aggregation pan
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			pan : {type : "sap.viz.ui5.types.controller.Interaction_pan", multiple : false, deprecated: true}
		}
	}});


	return Interaction;

});
