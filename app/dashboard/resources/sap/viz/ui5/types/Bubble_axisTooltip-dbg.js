/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Bubble_axisTooltip.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Bubble_axisTooltip
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Set tooltip related properties.
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.19.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Bubble_axisTooltip
	 */
	var Bubble_axisTooltip = BaseStructuredType.extend("sap.viz.ui5.types.Bubble_axisTooltip", /** @lends sap.viz.ui5.types.Bubble_axisTooltip.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * enabled/disabled tooltip.
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set format string for small tooltip.The first one is applied to xAxis and the second one is applied to yAxis.Any character in "MDYHSAmdyhsa#?%0@" is reserved as a token for format code.
			 */
			formatString : {type : "string[]", defaultValue : null}
		}
	}});


	return Bubble_axisTooltip;

});
