/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Axis_indicator.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Axis_indicator
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for the axis indicator
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.19.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Axis_indicator
	 */
	var Axis_indicator = BaseStructuredType.extend("sap.viz.ui5.types.Axis_indicator", /** @lends sap.viz.ui5.types.Axis_indicator.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the visibility of the axis indicator
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			enable : {type : "boolean", defaultValue : false, deprecated: true}
		}
	}});


	return Axis_indicator;

});
