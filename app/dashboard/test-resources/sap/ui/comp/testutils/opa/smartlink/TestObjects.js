/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"./Actions",
	"./Assertions",
	"test-resources/sap/ui/mdc/testutils/opa/link/Actions",
	"test-resources/sap/ui/mdc/testutils/opa/link/Assertions",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Actions",
	"./waitForLink"
], function(
	Opa5,
	linkActions,
	linkAssertions,
	mdcLinkActions,
	mdcLinkAssertions,
	p13nActions,
	waitForLink
) {
	"use strict";

	Opa5.createPageObjects({
		onTheSmartLink: {
			actions: {
                 /**
                  * Object to identify a <code>sap.ui.comp.navpopover.SmartLink</code>. Should have at least one of the mentioned properties: <code>text</code> and <code>id</code>.
                 * @typedef {Object} LinkIdentifier
                 * @property {string} id ID of a given <code>sap.m.Link</code> that represents the <code>sap.ui.comp.navpopover.SmartLink</code>
                 * @property {string} text Text of a given <code>sap.m.Link</code> that represents the <code>sap.ui.comp.navpopover.SmartLink</code>
                 * @property {string} controlType (Optional) Name of the control type; default is <code>sap.ui.comp.navpopover.SmartLink</code>
                 */
                /**
                 * Opa5 test action
                 * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code>
                 * @param {string[]} aLinks Array containing the texts of the links that are the result of the personalization
                 * @returns {Promise} OPA waitFor
                 * 1. Opens the personalization dialog of a given <code>sap.ui.comp.navpopover.SmartLink</code>.
                 * 2. Selects all links given by <code>aLinks</code> and deselects all other links.
                 * 3. Closes the personalization dialog.
                 */
                iPersonalizeTheLinks: function(oLinkIdentifier, aLinks) {
					return waitForLink.call(this, oLinkIdentifier, {
						success: function(oLink) {
							p13nActions.iPersonalizeLink.call(this, oLink, aLinks, mdcLinkActions.iOpenThePersonalizationDialog);
						}
					});
                },
                /**
                 * Opa5 test action
                 * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that is reset
                 * @returns {Promise} OPA waitFor
                 * 1. Opens the personalization dialog of a given <code>sap.ui.comp.navpopover.SmartLink</code>.
                 * 2. Presses the Reset personalization button.
                 * 3. Confirms the Reset dialog.
                 * 4. Closes the personalization dialog.
                 */
                iResetThePersonalization: function(oLinkIdentifier) {
					return waitForLink.call(this, oLinkIdentifier, {
						success: function(oLink) {
							p13nActions.iResetThePersonalization.call(this, oLink, mdcLinkActions.iOpenThePersonalizationDialog);
						}
					});
                },
                /**
                * Opa5 test action
                * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that is pressed
                * @returns {Promise} OPA waitFor
                */
                iPressTheLink: function(oLinkIdentifier) {
                    return mdcLinkActions.iPressTheLink.call(this, oLinkIdentifier);
                },
                /**
                * Opa5 test action
                * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that opens the popover
                * @param {string} sLink The text of the link that is clicked on the popover
                * @returns {Promise} OPA waitFor
                * 1. Presses a given <code>sap.ui.comp.navpopover.SmartLink</code> to open its popover.
                * 2. Presses a link on the opened popover defined by <code>sLink</code>.
                */
                iPressLinkOnPopover: function(oLinkIdentifier, sLink) {
                    return mdcLinkActions.iPressLinkOnPopover.call(this, oLinkIdentifier, sLink);
                },
                /**
                 * Opa5 test action
                 * @returns {Promise} OPA waitFor
                 * Closes an open popover of the <code>sap.ui.comp.navpopover.SmartLink</code>.
                 */
                iCloseThePopover: function() {
                    return mdcLinkActions.iCloseThePopover.call(this);
                }
            },
            assertions: {
                /**
                * Opa5 test action
                * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that opens the popover
                * @returns {Promise} OPA waitFor
                * Creates an assumption that there is an open popover for a given <code>sap.ui.comp.navpopover.SmartLink</code>.
                */
                iShouldSeeAPopover: function(oLinkIdentifier) {
                    return linkAssertions.iShouldSeeAPopover.call(this, oLinkIdentifier);
                },
                /**
                 * Opa5 test action
                 * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that opens the popover
                 * @param {string[]} aLinks Array containing the texts of the links that should be visible on the popover
                 * @returns {Promise} OPA waitFor
                 * Creates an assumption that there is an open popover for a given <code>sap.ui.comp.navpopover.SmartLink</code> and checks that all given links defined in <code>aLinks</code> are on that popover in a defined order.
                 */
                iShouldSeeLinksOnPopover: function(oLinkIdentifier, aLinks) {
					return waitForLink.call(this, oLinkIdentifier, {
						success: function(oLink) {
							mdcLinkAssertions.iShouldSeeLinksOnPopover.call(this, oLink, aLinks);
						}
					});
                },
                /**
                 * Opa5 test action
                 * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that opens the popover
                 * @returns {Promise} OPA waitFor
                 * Creates an assumption that there is an open popover for a given <code>sap.ui.comp.navpopover.SmartLink</code> and checks if there is a {@link sap.ui.layout.form.SimpleForm} that represents a {@link sap.ui.comp.navpopover.ContactDetailsController}.
                 */
                iShouldSeeContactInformationOnPopover: function(oLinkIdentifier) {
                    return linkAssertions.iShouldSeeContactInformationOnPopover.call(this, oLinkIdentifier);
                },
                /**
                 * Opa5 test action
                 * @param {LinkIdentifier} oLinkIdentifier The object to identify the <code>sap.ui.comp.navpopover.SmartLink</code> that opens the popover
                 * @param {string} sSubTitleText The text value of the subtitle
                 * @returns {Promise} OPA waitFor
                 * Creates an assumption that there is an open popover for a given <code>sap.ui.comp.navpopover.SmartLink</code> and checks if it contains a {@link sap.m.Text} as subtitle to the main navigation item.
                 */
                iShouldSeeASubTitleOnPopover: function(oLinkIdentifier, sSubTitleText) {
                    return linkAssertions.iShouldSeeASubTitleOnPopover.call(this, oLinkIdentifier, sSubTitleText);
                }
            }
        }
    });
});
