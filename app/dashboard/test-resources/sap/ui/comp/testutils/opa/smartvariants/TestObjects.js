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
	Actions,
	Assertions
) {
	"use strict";

	Opa5.createPageObjects({
		onSmartVariantManagement: {
			actions: Actions,
            assertions: Assertions
        }
    });

});
