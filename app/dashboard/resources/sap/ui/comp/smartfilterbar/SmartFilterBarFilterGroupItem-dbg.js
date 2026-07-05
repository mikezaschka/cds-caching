/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.filterbar.FilterGroupItem.
sap.ui.define([
	'sap/ui/comp/filterbar/FilterGroupItem', 'sap/ui/comp/library', "sap/base/Log"
], function(FilterGroupItem, library, Log) {
	"use strict";

	/**
	 * Constructor for a new FilterBar/FilterGroupItem.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Represents a filter belonging to a group other than basic.
	 * @extends sap.ui.comp.filterbar.FilterGroupItem
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem
	 */
	var SmartFilterBarFilterGroupItem = FilterGroupItem.extend("sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem", /** @lends sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem.prototype */
		{
			metadata: {
				library: "sap.ui.comp"
			}
		});

	/**
	 * Returns instance of the control
	 *
	 * @returns {sap.ui.core.Control|null} A control or <code>null</code> if there is no control with provided name
	 * @public
	 *
	 * @deprecated Since version 1.99. Use {@link sap.ui.core.Core.byId} instead!
	 * @ui5-not-supported
	 */
	SmartFilterBarFilterGroupItem.prototype.getControl = function () {
		Log.warning("Using deprecated method: sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem#getControl. Use sap.ui.core.Core.byId instead.");
		return SmartFilterBarFilterGroupItem.prototype._getControl.apply(this, arguments);
	};

	/**
	 * Returns instance of the control
	 *
	 * @returns {sap.ui.core.Control|null} A control or <code>null</code> if there is no control with provided name
	 * @ui5-restricted sap.suite.ui.generic.template
	 * @private
	 */
	SmartFilterBarFilterGroupItem.prototype._getControl = function () {
		return FilterGroupItem.prototype.getControl.apply(this, arguments);
	};

	/**
	 *
	 * @public
	 * @deprecated As of version 1.99. There is no replacement as all internal controls are considered private.
	 * @ui5-not-supported
	 *
	 * @function
	 * @type void
	 * @param {sap.ui.core.Control} oControl associated with the filter.
	 * @returns {sap.ui.core.Control} oControl associated with the filter.
	 * @name sap.ui.comp.smartfilterbar.SmartFilterBarFilterGroupItem#setControl
	 */

	return SmartFilterBarFilterGroupItem;

});
