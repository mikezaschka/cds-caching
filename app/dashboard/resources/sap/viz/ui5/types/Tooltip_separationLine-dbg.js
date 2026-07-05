/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Tooltip_separationLine.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Tooltip_separationLine
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Define the color of the value of the tooltip separation line.
	 * @extends sap.viz.ui5.core.BaseStructuredType
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.12.
	 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
	 * @alias sap.viz.ui5.types.Tooltip_separationLine
	 */
	var Tooltip_separationLine = BaseStructuredType.extend("sap.viz.ui5.types.Tooltip_separationLine", /** @lends sap.viz.ui5.types.Tooltip_separationLine.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Property borderBottomColor
			 */
			borderBottomColor : {type : "string", defaultValue : '#a7a9ac'}
		}
	}});


	return Tooltip_separationLine;

});
