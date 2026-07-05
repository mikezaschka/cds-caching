/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Adds support rules of the sap.ui.comp library to the support infrastructure.
 */
sap.ui.define([
	'./rules/SmartForm.support',
	'./rules/SmartLink.support',
	'./rules/SmartFilterBar.support',
	"./rules/SmartField.support",
	"./rules/SmartTable.support",
	"./rules/SmartChart.support",
	"./rules/ValueHelpDialog.support"
], function(
		SmartFormSupport,
		SmartLinkSupport,
		SmartFilterBarSupport,
		SmartFieldSupport,
		SmartTableSupport,
		SmartChartSupport,
		ValueHelpDialogSupport
) {
	"use strict";

	return {
		name: "sap.ui.comp",
		niceName: "UI5 Smart Controls Library",
		ruleset: [
			SmartFormSupport,
			SmartLinkSupport,
			SmartFilterBarSupport,
			SmartFieldSupport,
			SmartTableSupport,
			SmartChartSupport,
			ValueHelpDialogSupport
		]
	};

}, true);
