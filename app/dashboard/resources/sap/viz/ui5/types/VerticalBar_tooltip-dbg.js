/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.VerticalBar_tooltip.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.VerticalBar_tooltip
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
	 * @deprecated Since version 1.12.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.VerticalBar_tooltip
	 */
	var VerticalBar_tooltip = BaseStructuredType.extend("sap.viz.ui5.types.VerticalBar_tooltip", /** @lends sap.viz.ui5.types.VerticalBar_tooltip.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set whether the tooltip is enabled
			 */
			enabled : {type : "boolean", defaultValue : true}
		}
	}});


	return VerticalBar_tooltip;

});
