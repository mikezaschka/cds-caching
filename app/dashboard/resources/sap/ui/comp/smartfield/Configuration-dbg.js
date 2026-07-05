/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/comp/library", "sap/ui/core/Element"], function(library, Element) {
	"use strict";

	/**
	 * Constructor for a new <code>Smartfield</code>/<code>Configuration</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The configuration allows to further define the behavior of a <code>SmartField</code>.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfield.Configuration
	 */
	var Configuration = Element.extend("sap.ui.comp.smartfield.Configuration", /** @lends sap.ui.comp.smartfield.Configuration.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * By default the SmartField chooses the controls it hosts by interpreting OData metadata. This property allows to overwrite the
				 * default behavior to some extent. For example makes it possible to define that an OData property of type Edm.Boolean is displayed as
				 * a combo box.
				 */
				controlType: {
					type: "sap.ui.comp.smartfield.ControlType",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The property specifies how value help, that is available for input fields, is presented. For example, it specifies whether the
				 * descriptions of the values shown in the result after a query are displayed.
				 */
				displayBehaviour: {
					type: "sap.ui.comp.smartfield.DisplayBehaviour",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The property specifies the qualifier of the <code>DataPoint</code> or <code>FieldGroup</code> annotation from which
				 * the criticality annotation information should be taken.
				 */
				criticalityQualifier: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If there are value help annotations for a smart field, it is possible to specify whether the table in the value help dialog for
				 * this field will be filled initially. The default value is <code>false</code>, which means the table will be filled as the
				 * data fetch is not prevented.
				 * <b>Note:</b> As of version 1.78 the default value has been changed from <code>true</code> to <code>false</code>.
				 */
				preventInitialDataFetchInValueHelpDialog: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			}
		}
	});

	return Configuration;

});
