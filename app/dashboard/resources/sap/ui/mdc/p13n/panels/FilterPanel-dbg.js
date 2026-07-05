/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/m/p13n/FilterPanel"
], (FilterPanel) => {
	"use strict";

	return FilterPanel.extend("sap.ui.mdc.p13n.panels.FilterPanel", {
		metadata: {
			library: "sap.ui.mdc"
		},
		renderer: {
			apiVersion: 2
		}
	});
});