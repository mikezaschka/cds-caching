/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.P13nAnyFilterItem.
sap.ui.define([
	'sap/m/library', 'sap/m/P13nFilterItem'
], function(library, P13nFilterItem) {
	"use strict";

	/**
	 * Constructor for a new P13nAnyFilterItem. The class extends sap.ui.comp.P13nFilterItem and changes the value1 and value2 properties type to any.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for <code>filterItems</code> aggregation in P13nFilterPanel control.
	 * @extends sap.ui.comp.P13nFilterItem
	 * @version 1.136.0
	 * @constructor
	 * @private
	 * @since 1.136
	 * @alias sap.ui.comp.P13nAnyFilterItem
	 */
	var P13nAnyFilterItem = P13nFilterItem.extend("sap.ui.comp.P13nAnyFilterItem", /** @lends sap.ui.comp.P13nAnyFilterItem.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {
				/**
				 * value of the filter. Type of value1 is any.
				 */
				value1: {
					type: "any",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * to value of the between filter. Type of value2 is any.
				 */
				value2: {
					type: "any",
					group: "Misc",
					defaultValue: null
				}
			}
		}
	});

	return P13nAnyFilterItem;

});
