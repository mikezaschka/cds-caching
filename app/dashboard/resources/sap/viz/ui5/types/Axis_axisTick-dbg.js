/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Axis_axisTick.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Axis_axisTick
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for the ticks on the axis
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.12.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Axis_axisTick
	 */
	var Axis_axisTick = BaseStructuredType.extend("sap.viz.ui5.types.Axis_axisTick", /** @lends sap.viz.ui5.types.Axis_axisTick.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set visibility of the ticks on the axis. For mobile devices, the default value is 'false'.
			 */
			visible : {type : "boolean", defaultValue : true}
		}
	}});


	return Axis_axisTick;

});
