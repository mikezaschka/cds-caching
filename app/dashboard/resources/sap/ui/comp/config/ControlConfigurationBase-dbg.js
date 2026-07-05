/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.config.ControlConfigurationBase.
sap.ui.define(['sap/ui/core/Element'], function(Element) {
	"use strict";

	/**
	 * Constructor for a new <code>ControlConfigurationBase</code>
	 *
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class An abstract class for configuration of filters in the smart filter bar or in the smart table
	 * @extends sap.ui.core.Element
	 * @since 1.126.0
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.config.ControlConfigurationBase
	 */
	const ControlConfigurationBase = Element.extend("sap.ui.comp.config.ControlConfigurationBase", /** @lends sap.ui.comp.config.ControlConfigurationBase.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * The <code>key</code> property corresponds to the field name from the OData service $metadata document.
				 */
				key: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The <code>conditionType</code> class name to be used for this filter item. Implementation should derive from sap.ui.comp.config.condition.Type
				 */
				conditionType: {
					type: "any",
					group: "Misc",
					defaultValue: null
				}
			}
		}
	});

	return ControlConfigurationBase;

});
