/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/Lib"
], function(Library) {
	"use strict";

	var oMDCBundle = Library.getResourceBundleFor("sap.ui.mdc");

	var Util = {

		texts: {
			filter: oMDCBundle.getText("p13nDialog.TAB_Filter"),
			ok: oMDCBundle.getText("p13nDialog.OK")
		},

		icons: {
			decline: "sap-icon://decline",
			settings: "sap-icon://action-settings"
		}

	};

	return Util;
});
