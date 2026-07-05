/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/comp/library", "sap/ui/core/Element"], function(library, Element) {
	"use strict";

	var ControlProposalType = library.smartfield.ControlProposalType;

	/**
	 * Constructor for a new <code>smartfield/ControlProposal</code>.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Proposes a control to be rendered. The smart field may ignore the proposal.
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfield.ControlProposal
	 */
	var ControlProposal = Element.extend("sap.ui.comp.smartfield.ControlProposal", /** @lends sap.ui.comp.smartfield.ControlProposal.prototype */ { metadata : {

		library : "sap.ui.comp",
		properties : {

			/**
			 * By default the SmartField chooses the controls it hosts by interpreting OData meta data. This property allows to overwrite the default behavior to some
			 * extent; for example this property allows to define that an OData property of type Edm.Boolean is displayed as combo box.
			 */
			controlType : {type : "sap.ui.comp.smartfield.ControlProposalType", group : "Misc", defaultValue : ControlProposalType.None}

		},
		aggregations: {

			/**
			 * Optional definition to further qualify how an object status control should be rendered.
			 *
			 * @since 1.34.0
			 */
			objectStatus : {type: "sap.ui.comp.smartfield.ObjectStatus", multiple : false}
		}
	}});


	return ControlProposal;

});