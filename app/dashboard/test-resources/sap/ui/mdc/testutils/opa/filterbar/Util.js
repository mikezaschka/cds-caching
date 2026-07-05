/*!
 * OpenUI5
 * (c) Copyright 2026 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/core/Lib"
], function(Library) {
	"use strict";

	var oMDCBundle = Library.getResourceBundleFor("sap.ui.mdc");
	//var oMBundle = Library.getResourceBundleFor("sap.m");

	var Util = {

		texts: {
			go: oMDCBundle.getText("filterbar.GO")
		},

		icons: {
			decline: "sap-icon://decline",
			valueHelp: "sap-icon://value-help"
		}

	};

	return Util;
});
