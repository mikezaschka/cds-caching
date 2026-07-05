/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
    "sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/matchers/Ancestor",
    "sap/ui/test/matchers/Matcher"
], function(
	Opa5,
    PropertyStrictEquals,
    Ancestor,
    Matcher
) {
	"use strict";

	return function waitForLink(oLinkIdentifier, oSettings) {
        var sText = oLinkIdentifier.text;
        var sId = oLinkIdentifier.id;
        var bObjectIdentifier = oLinkIdentifier.objectIdentifier;

        Opa5.assert.ok(sText || sId, "LinkIdentifier correct Text: '" + sText + "' - ID: '" + sId + "'");
        var fnCallSuccess = function(oLink) {
            if (typeof oSettings.success === "function") {
                oSettings.success.call(this, oLink);
            }
        };

        var sControlType = bObjectIdentifier ? "sap.m.Link" : "sap.ui.comp.navpopover.SmartLink";

        var oOpaSettings = {
            controlType: sControlType,
            actions: oSettings.actions,
            matchers: []
        };

        if (sText) {
            oOpaSettings.matchers.push(new PropertyStrictEquals({
                name: "text",
                value: sText
            }));
        }

        if (sId) {
            oOpaSettings.id = sId;
            oOpaSettings.success = function(oLinkControl) {
                Opa5.assert.ok(oLinkControl, sControlType + " found");
                fnCallSuccess.call(this, oLinkControl);
            };
        } else {
            oOpaSettings.success = function(aLinkControls) {
                Opa5.assert.equal(aLinkControls.length, 1, sControlType + " found");
                fnCallSuccess.call(this, aLinkControls[0]);
            };
        }

        if (bObjectIdentifier) {
            var oMatcher = new Matcher();
            oMatcher.isMatching = function(oObjectIdentifier) {
                var oTitleControl = oObjectIdentifier._getTitleControl();
                var bTextMatching = sText ? oTitleControl.getText() === sText : true;
                var bIdMatching = sId ? oTitleControl.getId() === sId : true;
                return (sId || sText) && bTextMatching && bIdMatching;
            };
            var oObjectIdentifierSettings = {
                controlType: "sap.m.ObjectIdentifier",
                matchers: oMatcher,
                success: function(aObjectIdentifiers) {
                    oOpaSettings.matchers.push(new Ancestor(aObjectIdentifiers[0], true));
                    this.waitFor(oOpaSettings);
                }
            };
            return this.waitFor(oObjectIdentifierSettings);
        } else {
            return this.waitFor(oOpaSettings);
        }
    };
});
