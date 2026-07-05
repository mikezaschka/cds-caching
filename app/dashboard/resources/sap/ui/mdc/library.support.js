/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Adds support rules of the sap.ui.table library to the support infrastructure.
 */
sap.ui.define([
	"./rules/Table.support"
], function(MDCTableRules) {
	"use strict";

	return {
		name: "sap.ui.mdc",
		niceName: "UI5 MDC Library",
		ruleset: [
			MDCTableRules
		]
	};

}, true);