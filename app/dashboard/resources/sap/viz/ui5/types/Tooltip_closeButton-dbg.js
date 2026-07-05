/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Tooltip_closeButton.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Tooltip_closeButton
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Define the background and border color of tooltip close button.
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.12.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Tooltip_closeButton
	 */
	var Tooltip_closeButton = BaseStructuredType.extend("sap.viz.ui5.types.Tooltip_closeButton", /** @lends sap.viz.ui5.types.Tooltip_closeButton.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Property backgroundColor
			 */
			backgroundColor : {type : "string", defaultValue : '#ffffff'},

			/**
			 * Property borderColor
			 */
			borderColor : {type : "string", defaultValue : '#cccccc'}
		}
	}});


	return Tooltip_closeButton;

});
