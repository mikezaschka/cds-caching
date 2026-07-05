/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"../valuehelpdialog/Actions",
	"../valuehelpdialog/Assertions"
], function (
	Opa5,
	Actions,
	Assertions
) {
	"use strict";

	Opa5.createPageObjects({
		onTheValueHelpDialog: {
			actions: {
				/**
				 * OPA5 test action
				 * @param {sap.ui.core.Control | string} oInput Instance / ID of the input field.
				 * @returns {Promise} OPA waitFor
				 * Opens the value help for a given input field.
				 */
				iOpenTheValueHelpForInputField: function (oInput) {
					return Actions.iOpenTheValueHelpForInputField.call(this, oInput);
				},

				/**
				 * OPA5 test action
				 * @param {boolean} bCancel Boolean that defines if the Cancel button is pressed
				 * @returns {Promise} OPA waitFor
				 * Closes an open value help dialog by pressing the OK / Cancel button.
				 */
				iCloseTheValueHelpDialog: function (bCancel) {
					return Actions.iCloseTheValueHelpDialog.call(this, bCancel);
				}
			},
			assertions: Assertions
		}
	});

});
