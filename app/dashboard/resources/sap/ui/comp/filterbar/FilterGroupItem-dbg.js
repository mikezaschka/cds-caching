/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.filterbar.FilterGroupItem.
sap.ui.define([
	'./FilterItem', 'sap/ui/comp/library'
], function(FilterItem, library) {
	"use strict";

	/**
	 * Constructor for a new FilterBar/FilterGroupItem.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Represents a filter belonging to a group other than basic.
	 * @extends sap.ui.comp.filterbar.FilterItem
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.filterbar.FilterGroupItem
	 */
	var FilterGroupItem = FilterItem.extend("sap.ui.comp.filterbar.FilterGroupItem", /** @lends sap.ui.comp.filterbar.FilterGroupItem.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Title of the group.
				 */
				groupTitle: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Name of the group.
				 */
				groupName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to true, this filter is visible on the filter bar by default. Mapped against the <code>visibleInFilterBar</code> property.
				 * @since 1.24.0
				 * @deprecated Since version 1.26.1. Replaced by property <code>visibleInFilterBar</code>
				 */
				visibleInAdvancedArea: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			},
			aggregations: {
				_debug: { type: "sap.ui.core.Control", multiple: false, visibility: "hidden" }
			}
		}
	});

	FilterGroupItem.prototype.init = function() {
		this.setVisibleInAdvancedArea(false);
		this.setVisibleInFilterBar(false);
		this._setParameter(false);
	};

	/**
	 * Setter for parameter indicator.
	 * @private
	 * @param {boolean} bValue Indicator if this is a parameter.
	 */
	FilterGroupItem.prototype._setParameter = function(bValue) {
		this._bIsParameter = bValue;
	};

	/**
	 * Setter for group title.
	 * @public
	 * @param {string} sValue Group title
	 */
	FilterGroupItem.prototype.setGroupTitle = function(sValue) {
		this.setProperty("groupTitle", sValue);

		this.fireChange({
			propertyName: "groupTitle"
		});
		return this;
	};

	/**
	 * Setter for visibility of filters in the filter bar.
	 * @private
	 * @param {boolean} bValue State of visibility
	 * @deprecated Since version 1.26.1. Replaced by property <code>visibleInFilterBar</code>
	 */
	FilterGroupItem.prototype.setVisibleInAdvancedArea = function(bValue) {
		this.setVisibleInFilterBar(bValue);
		return this;
	};

	/**
	 * Getter for visibility of filters in the filter bar.
	 * @private
	 * @returns {boolean} bValue State of visibility
	 * @deprecated Since version 1.26.1. Replaced by property <code>visibleInFilterBar</code>
	 */
	FilterGroupItem.prototype.getVisibleInAdvancedArea = function() {
		return this.getVisibleInFilterBar();
	};

	/**
	 * Returns instance of the control
	 *
	 * @returns {sap.ui.core.Control|null} A control or <code>null</code> if there is no control with provided name
	 * @private
	 */
	FilterGroupItem.prototype._getControl = function () {
		return this.getControl.apply(this, arguments);
	};

	/**
	 * Destroys this element.
	 * @public
	 */
	FilterGroupItem.prototype.destroy = function() {
		FilterItem.prototype.destroy.apply(this, arguments);
	};

	/**
	 * Controls the visibility of a filter item in the filter bar.<BR>
	 * Default value is <code>false</code>.
	 * @name sap.ui.comp.filterbar.FilterGroupItem#getVisibleInFilterBar
	 * @function
	 * @returns {boolean} bValue State of visibility
	 * @public
	 * @since 1.26.1
	 */

	return FilterGroupItem;

});
