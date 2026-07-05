/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartvariants.PersonalizableInfo.
sap.ui.define(['sap/ui/comp/library', 'sap/ui/core/Element'], function(library, Element) {
	"use strict";

	/**
	 * Constructor for a new smartvariants/PersonalizableInfo.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The PersonalizableInfo class describes the personalizable control associated with the <code>SmartVariantManagement</code> control.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartvariants.PersonalizableInfo
	 */
	var PersonalizableInfo = Element.extend("sap.ui.comp.smartvariants.PersonalizableInfo", /** @lends sap.ui.comp.smartvariants.PersonalizableInfo.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Describes the type of variant management.
				 */
				type: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Name of the data service
				 */
				dataSource: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the property name of the personalization key.
				 */
				keyName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			},
			associations: {

				/**
				 * Contains the control that can be personalized.
				 */
				control: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			}
		}
	});

	return PersonalizableInfo;

});