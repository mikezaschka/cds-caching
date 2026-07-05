/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.data.Dataset.
sap.ui.define(['sap/ui/core/Element','sap/viz/library'],
	function(Element, library) {
	"use strict";

	/**
	 * Constructor for a new ui5/data/Dataset.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Abstract Dataset implementation
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @alias sap.viz.ui5.data.Dataset
	 */
	var Dataset = Element.extend("sap.viz.ui5.data.Dataset", /** @lends sap.viz.ui5.data.Dataset.prototype */ { metadata : {

		"abstract" : true,
		library : "sap.viz"
	}});




	return Dataset;

});
