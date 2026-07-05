/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Lib"], function(Library) {
	"use strict";

	var oCompBundle = Library.getResourceBundleFor("sap.ui.comp");
	var Util = {
		texts: {
			go: oCompBundle.getText("FILTER_BAR_GO"),
			adaptFilters: oCompBundle.getText("FILTER_BAR_ADAPT_FILTERS_DIALOG")
		},
		icons: {
			decline: "sap-icon://decline",
			valueHelp: "sap-icon://value-help"
		}
	};

	return Util;
});
