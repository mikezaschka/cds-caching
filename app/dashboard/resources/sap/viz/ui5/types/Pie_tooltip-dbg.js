/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Pie_tooltip.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Pie_tooltip
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for tooltip related properties
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.19.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Pie_tooltip
	 */
	var Pie_tooltip = BaseStructuredType.extend("sap.viz.ui5.types.Pie_tooltip", /** @lends sap.viz.ui5.types.Pie_tooltip.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set whether tooltip is enabled
			 */
			visible : {type : "boolean", defaultValue : true},

			/**
			 * Set the number format of the measure value in tooltip
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			valueFormat : {type : "string", defaultValue : 'n', deprecated: true},

			/**
			 * Set the number format of the percentage label in tooltip
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			percentageFormat : {type : "string", defaultValue : '.0%', deprecated: true},

			/**
			 * Set format string of tooltip. The first string is applied to value and the second is applied to percentage.Any character in "MDYHSAmdyhsa#?%0@" is reserved as a token for format code.
			 */
			formatString : {type : "string[]", defaultValue : null}
		}
	}});


	return Pie_tooltip;

});
