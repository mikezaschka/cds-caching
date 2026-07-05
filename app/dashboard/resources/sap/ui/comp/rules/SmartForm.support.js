/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the SmartForm controls of sap.ui.comp library.
 */
sap.ui.define(["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories; // Accessibility, Performance, Memory, ...
	var Severity = SupportLib.Severity; // Hint, Warning, Error
	var Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/* eslint-disable no-lonely-if */

	var oSmartFormResponsiveLayoutRule = {
		id: "smartFormResponsiveLayout",
		audiences: [Audiences.Application],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.48",
		title: "SmartForm: Use of ResponsiveLayout",
		description: "ResponsiveLayout must not be used any longer because of UX requirements",
		resolution: "Use ColumnLayout as layout aggregation of the SmartForm",
		resolutionurls: [{
				text: "API Reference: SmartForm",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.SmartForm"
			},
			{
				text: "API Reference: ColumnLayout",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.ColumnLayout"
			}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartform.SmartForm")
			.forEach(function(oSmartForm) {
				var oLayout = oSmartForm.getLayout();
				var bUseHorizontalLayout = oSmartForm.getUseHorizontalLayout();
				var sId = oSmartForm.getId();

				if (bUseHorizontalLayout && (!oLayout || !oLayout.getGridDataSpan())) {
					oIssueManager.addIssue({
						severity: Severity.Medium,
						details: "SmartForm " + sId + " uses ResponsiveLayout.",
						context: {
							id: sId
						}
					});
				}
			});
		}
	};

	var oSmartFormToolbarRule = {
		id: "smartFormToolbar",
		audiences: [Audiences.Application],
		categories: [Categories.Functionality],
		enabled: true,
		minversion: "1.48",
		title: "SmartForm: Toolbar assigned to group",
		description: "On SmartForm groups toolbars are not supported.",
		resolution: "Use the Label proprty to ad a title to the group.",
		resolutionurls: [{
				text: "API Reference: SmartForm",
				href:"https://ui5.sap.com/#/api/symbols/sap.ui.comp.smartform.SmartForm"
			}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartform.SmartForm")
			.forEach(function(oSmartForm) {
				var aGroups = oSmartForm.getGroups();
				var sId = oSmartForm.getId();
				for (var i = 0; i < aGroups.length; i++) {
					if (aGroups[i].getToolbar && aGroups[i].getToolbar()) {
						var sGroupId = aGroups[i].getId();
						oIssueManager.addIssue({
							severity: Severity.High,
							details: "SmartForm " + sId + " Group " + sGroupId + " has Toolbar assigned.",
							context: {
								id: sGroupId
							}
						});
					}
				}
			});
		}
	};

	var oSmartFormTitleRule = {
		id: "smartFormTitle",
		audiences: [Audiences.Application],
		categories: [Categories.Functionality],
		enabled: true,
		minversion: "1.48",
		title: "SmartForm: Title assigned to group",
		description: "On SmartForm groups title elements are not supported.",
		resolution: "Use the Label property to ad a title to the group.",
		resolutionurls: [{
				text: "API Reference: SmartForm",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.SmartForm"
			}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartform.SmartForm")
			.forEach(function(oSmartForm) {
				var aGroups = oSmartForm.getGroups();
				var sId = oSmartForm.getId();
				for (var i = 0; i < aGroups.length; i++) {
					var vTitle = aGroups[i].getTitle();
					if (vTitle && (typeof vTitle !== "string")) {
						var sGroupId = aGroups[i].getId();
						oIssueManager.addIssue({
							severity: Severity.High,
							details: "SmartForm " + sId + " Group " + sGroupId + " has Title element assigned.",
							context: {
								id: sGroupId
							}
						});
					}
				}
			});
		}
	};

	var oSmartFormLabelOrAriaLabelRule = {
		id: "smartFormLabelOrAriaLabel",
		audiences: [Audiences.Application],
		categories: [Categories.Accessibility],
		enabled: true,
		minversion: "1.48",
		title: "SmartForm: Group must have a Label",
		description: "A Group must have some Title information." +
		             "\n This can be a Label on the Group or some Title assigned via AriaLabelledBy." +
		             "\n If no Label is assigned to the Group there must be at least a Title set" +
		             " on the SmartForm.",
		resolution: "Set a Title element for a SmartForm control or a Label control for the Group element or assign it via AriaLabelledBy",
		resolutionurls: [{
			text: "API Reference: SmartForm",
			href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.SmartForm"
		},
		{
			text: "API Reference: Group",
			href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.Group"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartform.Group")
			.forEach(function(oGroup) {
				var oForm = oGroup.getParent();
				if (!oForm) {
					return;
				}

				var oSmartForm = oForm.getParent();
				var sId;

				if (!oGroup.getLabel() && oGroup.getAriaLabelledBy().length == 0 && !oSmartForm.getTitle()) {
					oIssueManager.addIssue({
						severity: Severity.High,
						details: "In SmartForm " + sId + ", Group" + oGroup.getId() + " has no Title assigned.",
						context: {
							id: oGroup.getId()
						}
					});
				}
			});
		}
	};

	var oSmartFormUseHorizontalLayoutRule = {
			id: "smartFormUseHorizontalLayout",
			audiences: [Audiences.Application],
			categories: [Categories.Performance],
			enabled: true,
			minversion: "1.51",
			title: "SmartForm: UseHorizontalLayout used inconsistently",
			description: "The UseHorizontalLayout property must be set in the SmartForm control and will be passed to the Group and GroupElement elements by internal control implementation logic." +
			             "\n Setting UseHorizontalLayout directly or with different values at Group or GroupElement elements level will cause bad performance.",
			resolution: "Set UseHorizontalLayout only for the SmartForm control or with the same value for the Group and GroupElement elements",
			resolutionurls: [{
				text: "API Reference: SmartForm",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.SmartForm"
			},
			{
				text: "API Reference: Group",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.Group"
			},
			{
				text: "API Reference: GroupElement",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartform.GroupElement"
			}],
			check: function (oIssueManager, oCoreFacade, oScope) {
				oScope.getElementsByClassName("sap.ui.comp.smartform.SmartForm")
				.forEach(function(oSmartForm) {
					var bSmartFormUseHorizontalLayout = oSmartForm.getUseHorizontalLayout && oSmartForm.getUseHorizontalLayout();
					var bSmartFormUseHorizontalLayoutSet = !oSmartForm.isPropertyInitial("useHorizontalLayout");
					var aGroups = oSmartForm.getGroups();
					for (var i = 0; i < aGroups.length; i++) {
						var oGroup = aGroups[i];
						var bGroupUseHorizontalLayout = oGroup.getUseHorizontalLayout && oGroup.getUseHorizontalLayout();
						var bGroupUseHorizontalLayoutSet = !oGroup.isPropertyInitial("useHorizontalLayout");
						if (bSmartFormUseHorizontalLayout != bGroupUseHorizontalLayout) {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "Group" + oGroup.getId() + ": useHorizontalLayout set different than in the SmartForm control.",
								context: {
									id: oGroup.getId()
								}
							});
						}
						if (!bSmartFormUseHorizontalLayoutSet && bGroupUseHorizontalLayoutSet) {
							oIssueManager.addIssue({
								severity: Severity.Medium,
								details: "Group" + oGroup.getId() + ": useHorizontalLayout set but not in the SmartForm control.",
								context: {
									id: oGroup.getId()
								}
							});
						}

						var aGroupElements = oGroup.getGroupElements();
						for (var j = 0; j < aGroupElements.length; j++) {
							var oGroupElement = aGroupElements[j];
							var bGroupElementUseHorizontalLayout = oGroupElement.getUseHorizontalLayout();
							var bGroupElementUseHorizontalLayoutSet = !oGroupElement.isPropertyInitial("useHorizontalLayout");
							if (bSmartFormUseHorizontalLayout != bGroupElementUseHorizontalLayout) {
								oIssueManager.addIssue({
									severity: Severity.High,
									details: "GroupElement" + oGroupElement.getId() + ": useHorizontalLayout set different than in the SmartForm control.",
									context: {
										id: oGroupElement.getId()
									}
								});
							}
							if (!bGroupUseHorizontalLayoutSet && bGroupElementUseHorizontalLayoutSet) {
								oIssueManager.addIssue({
									severity: Severity.Medium,
									details: "GroupElement" + oGroupElement.getId() + ": useHorizontalLayout set but not in the SmartForm control.",
									context: {
										id: oGroupElement.getId()
									}
								});
							}
						}
					}
				});
			}
		};

	return [
		oSmartFormResponsiveLayoutRule,
		oSmartFormToolbarRule,
		oSmartFormTitleRule,
		oSmartFormLabelOrAriaLabelRule,
		oSmartFormUseHorizontalLayoutRule
	];

}, true);
