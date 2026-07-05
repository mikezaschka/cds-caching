/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/matchers/PropertyStrictEquals",
    "./Util"
], function(Opa5, PropertyStrictEquals, Util) {
    "use strict";

    return function waitForP13nDialog(oSettings) {
        oSettings = oSettings || {};

        oSettings.errorMessage = oSettings.errorMessage || "sap.m.Dialog for personalization not found";

        return this.waitFor({
            controlType: "sap.m.Dialog",
            matchers: new PropertyStrictEquals({
                    name: "title",
                    value: Util.texts.p13nPopoverTitle
            }),
            success: function(aP13nDialogs) {
                Opa5.assert.ok(aP13nDialogs.length, 'SmartLink Personalization Dialog found');
                if (oSettings.success) {
                    oSettings.success.call(this, aP13nDialogs[0]);
                }
            }
        });
    };

});