/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Area_marker.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Area_marker
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for marker and data point graphics
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.12.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Area_marker
	 */
	var Area_marker = BaseStructuredType.extend("sap.viz.ui5.types.Area_marker", /** @lends sap.viz.ui5.types.Area_marker.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the visibility of the markers
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			visible : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set the shape of the markers
			 */
			shape : {type : "sap.viz.ui5.types.Area_marker_shape", defaultValue : sap.viz.ui5.types.Area_marker_shape.circle},

			/**
			 * Set the marker size for data points, ranging from '4' and '32'. If you enter a value outside that range, the marker size defaults to '4'.
			 */
			size : {type : "int", defaultValue : 8},

			/**
			 * Set the number to enable events for markers when they are invisible. If the total amount of markers is bigger than this value, markers will remain hidden when selected or hovered over. The default value is Number.POSITIVE_INFINITY, which is the largest possible value.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			number : {type : "int", deprecated: true}
		}
	}});


	return Area_marker;

});
