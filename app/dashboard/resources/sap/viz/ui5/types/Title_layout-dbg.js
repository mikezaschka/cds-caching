/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Title_layout.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Title_layout
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for layout of title
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.12.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Title_layout
	 */
	var Title_layout = BaseStructuredType.extend("sap.viz.ui5.types.Title_layout", /** @lends sap.viz.ui5.types.Title_layout.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the position of the title
			 */
			position : {type : "string", defaultValue : 'right'},

			/**
			 * Set the priority of the position for the title
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			priority : {type : "int", defaultValue : 0, deprecated: true}
		}
	}});


	return Title_layout;

});
