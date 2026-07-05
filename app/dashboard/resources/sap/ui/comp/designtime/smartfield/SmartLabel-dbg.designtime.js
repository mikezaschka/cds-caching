/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";

	return {
		tool: {
			start: function(oSmartLabel) {
				// Ensure the control is properly linked with it's SmartField
				oSmartLabel.getLabelInfo();
			},
			stop: function () {
				// We do nothing
			}
		}
	};
});
