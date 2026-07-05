/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the ValueHelpDialog control of sap.ui.layout library.
 */
sap.ui.define(["sap/ui/core/LabelEnablement", "sap/ui/support/library"],
	function(LabelEnablement, SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories; // Accessibility, Performance, Memory, ...
	var Severity = SupportLib.Severity; // Hint, Warning, Error
	var Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	var oValueHelpDialogCounter = {
		id: "valueHelpCounter",
		audiences: [Audiences.Application],
		categories: [Categories.Usability],
		minversion: "1.114",
		async: false,
		title: "ValueHelpDialog: Counter of the nested table is missing",
		description: "All of the items are fetched and the nested table is populated with them, but the counter of the items is missing",
		resolution: "The ValueHelpDialog#update method should be invoked after the items are fetched",
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.valuehelpdialog.ValueHelpDialog").forEach(function(oValueHelpDialog){
				var bIsInvoked = oValueHelpDialog._oRulesLog.getInvokedMethod("update");

				if (!bIsInvoked) {
					oIssueManager.addIssue({
						severity: Severity.Low,
						details: "Update method was NOT invoked and the the counter of the Value Help Dialog is NOT updated.",
						context: {id: oValueHelpDialog.getId()}
					});
				}
			});
		}
	};

	return [
		oValueHelpDialogCounter
	];

}, true);
