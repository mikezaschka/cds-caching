/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Adds support rules of the sap.ui.table library to the support infrastructure.
 */
sap.ui.define([
	"./rules/Accessibility.support",
	"./rules/Binding.support",
	"./rules/ColumnTemplate.support",
	"./rules/Plugins.support",
	"./rules/Rows.support"
], function(AccessibilityRules, BindingRules, ColumnTemplateRules, PluginRules, RowRules) {
	"use strict";

	return {
		name: "sap.ui.table",
		niceName: "UI5 Table Library",
		ruleset: [
			AccessibilityRules,
			BindingRules,
			ColumnTemplateRules,
			PluginRules,
			RowRules
		]
	};

}, true);