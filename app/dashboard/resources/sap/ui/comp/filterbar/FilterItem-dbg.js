/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.filterbar.FilterItem.
sap.ui.define([
	'sap/m/Label', 'sap/ui/core/Element', 'sap/ui/comp/util/IdentifierUtil'
], function(Label, Element, IdentifierUtil) {
	"use strict";

	/**
	 * Constructor for a new FilterBar/FilterItem.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Represents a filter belonging to the basic group.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.filterbar.FilterItem
	 */
	var FilterItem = Element.extend("sap.ui.comp.filterbar.FilterItem", /** @lends sap.ui.comp.filterbar.FilterItem.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Label of the filter.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Name of the filter. This is an identifier for the filter and has to be unique.
				 */
				name: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Mandatory flag.
				 */
				mandatory: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Visibility state of the filter.
				 */
				visible: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Tooltip for the filter.
				 */
				labelTooltip: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Tooltip for the filter'c control.
				 * @since 1.52.0
				 */
				controlTooltip: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if a filter is part of the currently selected variant. <br>
				 * <b>Note:</b> This property can also be changed using the <code>visibleInFilterBar</code> property and by user interaction in the
				 * Select Filters dialog or the variant handling.
				 * @since 1.26.1
				 * @deprecated Since version 1.87. Will be internally treated as if always set to <code>true<code>
				 */
				partOfCurrentVariant: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Controls the visibility of a filter item in the filter bar.
				 * @since 1.26.1
				 */
				visibleInFilterBar: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * A hidden filter will never be visible in the filter bar control
				 * @since 1.44.0
				 */
				hiddenFilter: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * EntitySet name to which the filter belongs
				 * @since 1.58.0
				 */
				entitySetName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * EntityType name to which the filter belongs
				 * @since 1.58.0
				 */
				entityTypeName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			},
			aggregations: {

				/**
				 * The control of the filter.
				 */
				control: {
					type: "sap.ui.core.Control",
					multiple: false
				},
				_label: { type: "sap.m.Label", multiple: false, visibility: "hidden" }
			},
			events: {

				/**
				 * This event is fired when one of the properties is changed.
				 */
				change: {
					parameters: {

						/**
						 * Name of the changed property
						 */
						propertyName: {
							type: "string"
						}
					}
				}
			}
		}
	});

	/**
	 * Initializes the filter item.
	 * @public
	 */
	FilterItem.prototype.init = function() {
		this._oLabel = null;
		this._bIsParameter = false;
		this._sControlId = null;
	};

	/**
	 * Sets the corresponding control. The control may not be overwritten by the application, once the filter item is assigned to the FilterBar.
	 * @public
	 * @param {sap.ui.core.Control} oControl associated with the filter.
	 */
	FilterItem.prototype.setControl = function(oControl) {
		if (oControl && oControl.getId) {
			this._sControlId = oControl.getId();
		}

		this.setAggregation("control", oControl);
		return this;
	};

	/**
	 * Always returns the initially added control.
	 *
	 * @returns {sap.ui.core.Control | null}
	 * @public
	 */
	FilterItem.prototype.getControl = function() {
		var oControl = this.getAggregation("control");
		if (oControl) {
			return oControl;
		}

		if (this._sControlId === null) {
			return null;
		}

		return Element.getElementById(this._sControlId);
	};

	/**
	 * Always returns the initially added control.
	 *
	 * @ui5-restricted sap.suite.ui.generic.template
	 * @private
	 */
	FilterItem.prototype._getControl = function () {
		return this.getControl.apply(this, arguments);
	};

	/**
	 * @private
	 * @returns {boolean} indicates if this is a parameter.
	 */
	FilterItem.prototype._isParameter = function() {
		return this._bIsParameter;
	};

	/**
	 * Setter for visible property.
	 * @public
	 * @param {boolean} bVisible State of visibility
	 */
	FilterItem.prototype.setVisible = function(bVisible) {
		this.setProperty("visible", bVisible);
		this.fireChange({
			propertyName: "visible"
		});
		return this;
	};

	/**
	 * Setter for visible in filter bar.
	 * @public
	 * @since 1.26.1
	 * @param {boolean} bVisible State of visibility in filter bar
	 */
	FilterItem.prototype.setVisibleInFilterBar = function(bVisible) {
		this.setProperty("visibleInFilterBar", bVisible);

		this.fireChange({
			propertyName: "visibleInFilterBar"
		});
		return this;
	};

	/**
	 * Setter for partOfCurrentVariant in filter bar.
	 * @public
	 * @param {boolean} bVisible State of visibility in filter bar
	 * @deprecated Since version 1.89. This property is treated as always set to <code>true</code>.
	 */
	FilterItem.prototype.setPartOfCurrentVariant = function(bVisible) {
//		this.setProperty("partOfCurrentVariant", bVisible);
//
		if (bVisible) {
			this.fireChange({
				propertyName: "partOfCurrentVariant"
			});
		}
		return this;
	};
	FilterItem.prototype.getPartOfCurrentVariant = function() {
		return true;
	};

	FilterItem.prototype._getGroupName = function() {

		var sName = "";
		if (this.getGroupName) {
			sName = IdentifierUtil.replace(this.getGroupName());
		}

		return sName;
	};

	FilterItem.prototype._getName = function() {
		var sName = IdentifierUtil.replace(this.getName());
		var sGroupName = this._getGroupName();

		if (sGroupName) {
			sName = sGroupName + "-" + sName;
		}

		return sName;

	};

	FilterItem.prototype._createLabelControl = function(sFilterBarId) {

		var sText = this.getLabel();

		var sId = "filterItem-" + this._getName();
		if (sFilterBarId) {
			sId = sFilterBarId + "-" + sId;
		}

		var oLabelCtrl = new Label({
			id: sId,
			required: this.getMandatory(),
			textAlign: "Begin"
		});

		 oLabelCtrl.setText(sText);
		 oLabelCtrl.setTooltip(this.getLabelTooltip());

		this.setAggregation("_label", oLabelCtrl);

		return oLabelCtrl;
	};

	/**
	 * Setter for mandatory flag.
	 * @public
	 * @param {string} bValue Mandatory state
	 */
	FilterItem.prototype.setMandatory = function(bValue) {
		this.setProperty("mandatory", bValue);

		if (this._oLabel) {
			this._oLabel.setRequired(bValue);
		}

		this.fireChange({
			propertyName: "mandatory"
		});
		return this;
	};

	/**
	 * Setter for label.
	 * @public
	 * @param {string} sValue Label text
	 */
	FilterItem.prototype.setLabel = function(sValue) {
		this.setProperty("label", sValue);

		if (this._oLabel) {
			this._oLabel.setText(sValue);
		}

		this.fireChange({
			propertyName: "label"
		});
		return this;
	};

	/**
	 * Setter for tooltip.
	 * @public
	 * @param {string} sText Tooltip text
	 */
	FilterItem.prototype.setLabelTooltip = function(sText) {
		this.setProperty("labelTooltip", sText);

		if (this._oLabel) {
			this._oLabel.setTooltip(sText);
		}

		this.fireChange({
			propertyName: "labelTooltip"
		});
		return this;
	};

	FilterItem.prototype.setControlTooltip = function(sText) {
		this.setProperty("controlTooltip", sText);

		this.fireChange({
			propertyName: "controlTooltip"
		});
		return this;
	};

	/**
	 * Returns the label control.
	 * @param {string} sFilterBarId The ID of the filter bar
	 * @returns {sap.m.Label} Label control
	 */
	FilterItem.prototype.getLabelControl = function(sFilterBarId) {

		if (!this._oLabel) {
			this._oLabel = this._createLabelControl(sFilterBarId);
		}

		return this._oLabel;
	};

	/**
	 * Destroys this element.
	 * @public
	 */
	FilterItem.prototype.destroy = function() {

		Element.prototype.destroy.apply(this, arguments);

		if (this._oLabel && !this._oLabel.bIsDestroyed) {
			this._oLabel.destroy();
		}

		// Explicitly destroy the control, because with the remove methods implemented, the control is no longer destroyed
		if (this._getControl() && !this._getControl().bIsDestroyed) {
			this._getControl().destroy();
		}

		// Adding filterItem to the filterBar is also creating a filterGroupItem so we need to destroy it as well
		var sFilterGroupItemId = this.getId() + "__filterGroupItem",
			oFilterGroupItem = Element.getElementById(sFilterGroupItemId);

		if (oFilterGroupItem) {

			Element.prototype.destroy.apply(oFilterGroupItem, arguments);

			// Explicitly destroy only the label as the filterItem and the filterGroupItem created by the
			// addFilterItem method share the same control, which is already destroyed
			if (oFilterGroupItem._oLabel && !oFilterGroupItem._oLabel.bIsDestroyed) {
				oFilterGroupItem._oLabel.destroy();
			}

			oFilterGroupItem._oLabel = null;
		}

		this._oLabel = null;
		this._sQuickinfo = null;
	};

	return FilterItem;

});
