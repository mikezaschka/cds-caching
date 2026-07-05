/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"./Actions",
	"./Assertions"
], function(
	Opa5,
	SmartFieldActions,
	SmartFieldAssertions
) {
	"use strict";

	Opa5.createPageObjects({
		onTheSmartField: {
			actions: SmartFieldActions,
            assertions: SmartFieldAssertions
        }
    });
});
