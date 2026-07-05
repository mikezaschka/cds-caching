/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/comp/library", "sap/ui/core/Element"], function(library, Element) {
	"use strict";

	/**
	 * Constructor for a new <code>SmartField/ObjectStatus</code> to be used in the <code>controlProposal</code> configuration
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Defines a possible object status control to be rendered. The smart field may ignore the proposal.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfield.ObjectStatus
	 */
	var ObjectStatus = Element.extend("sap.ui.comp.smartfield.ObjectStatus", /** @lends sap.ui.comp.smartfield.ControlProposal.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Optional attribute to determine the rendered state. Possible values are the numeric representations of the enum members
				 * of annotation <code>com.sap.vocabularies.UI.v1.CriticalityType</code>:
				 * 0: None
				 * 1: Error
				 * 2: Warning
				 * 3: Success
				 */
				criticality: {
					type: "any",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Optional attribute, which can be set to control how the criticality is visualized.
				 */
				criticalityRepresentationType: {
					type: "sap.ui.comp.smartfield.CriticalityRepresentationType",
					group: "Misc",
					defaultValue: library.smartfield.CriticalityRepresentationType.WithIcon
				}
			}
		}
	});

	return ObjectStatus;

});