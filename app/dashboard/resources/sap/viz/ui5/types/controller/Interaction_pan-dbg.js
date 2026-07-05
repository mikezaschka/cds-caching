/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.controller.Interaction_pan.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.controller.Interaction_pan
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Structured Type sap.viz.ui5.types.controller.Interaction_pan
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.19.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.controller.Interaction_pan
	 */
	var Interaction_pan = BaseStructuredType.extend("sap.viz.ui5.types.controller.Interaction_pan", /** @lends sap.viz.ui5.types.controller.Interaction_pan.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Enable/disable pan
			 */
			enable : {type : "boolean", defaultValue : true},

			/**
			 * Set orientation of pan
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			orientation : {type : "sap.viz.ui5.types.controller.Interaction_pan_orientation", defaultValue : sap.viz.ui5.types.controller.Interaction_pan_orientation.both, deprecated: true}
		}
	}});


	return Interaction_pan;

});
