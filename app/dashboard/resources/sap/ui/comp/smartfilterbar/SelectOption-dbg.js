/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartfilterbar.SelectOption.
sap.ui.define(['sap/ui/comp/library', 'sap/ui/core/Element', 'sap/ui/model/FilterOperator'], function(library, Element, FilterOperator) {
	"use strict";

	/**
	 * Constructor for a new smartfilterbar/SelectOption.
	 *
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A Select Option can be used to specify default filter values for a control configuration of the SmartFilterBar.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.SelectOption
	 */
	var SelectOption = Element.extend("sap.ui.comp.smartfilterbar.SelectOption", /** @lends sap.ui.comp.smartfilterbar.SelectOption.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * The sign for a Select Option. Possible values are I for include or E for exclude.
				 */
				sign: {
					type: "sap.ui.comp.smartfilterbar.SelectOptionSign",
					group: "Misc",
					defaultValue: 'I'
				},

				/**
				 * The operator for a select option. The default value is EQ "for equals".
				 * @type {sap.ui.model.FilterOperator}
				 */
				operator: {
					type: "string",
					group: "Misc",
					defaultValue: 'EQ'
				},

				/**
				 * The low value for a select option.
				 */
				low: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The high value for a select option. The high value is only required for a few operators, e.g. BT (between).
				 */
				high: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			}
		},
		setOperator(sValue) {
			if (sValue != null && !(sValue in FilterOperator)) {
				throw new Error(`"${sValue}" is not a valid sap.ui.model.FilterOperator`);
			}
			return this.setProperty("operator", sValue);
		}
	});

	// Assign types from library for backward compatibility!
	SelectOption.SIGN = library.smartfilterbar.SelectOptionSign;
	SelectOption.OPERATOR = FilterOperator;

	return SelectOption;

});
