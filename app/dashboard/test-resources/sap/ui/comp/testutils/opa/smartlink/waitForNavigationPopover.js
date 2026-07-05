/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5"
], function(
	Opa5
) {
	"use strict";

    return function waitForNavigationPopover(oSettings) {
        var aMatchers = oSettings.matchers ? oSettings.matchers : [];

        return this.waitFor({
            controlType: "sap.ui.comp.navpopover.NavigationPopover",
            matchers: aMatchers,
            success: function(aNavigationPopovers) {
                Opa5.assert.strictEqual(aNavigationPopovers.length, 1, 'NavigationPopover is open');

				if (typeof oSettings.success === "function") {
					var oNavigationPopover = aNavigationPopovers[0];
					oSettings.success.call(this, oNavigationPopover);
				}
            },
            errorMessage: "No open NavigationPopover found"
        });
    };
});
