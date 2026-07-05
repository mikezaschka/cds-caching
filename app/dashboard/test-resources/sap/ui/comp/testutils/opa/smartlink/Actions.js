/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/Ancestor",
	"sap/ui/test/matchers/Descendant",
	"sap/ui/test/matchers/Matcher",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/actions/Press",
	"../TestUtils",
	"../actions/CloseNavigationPopover",
	"../actions/OpenContextMenu",
	"./waitForLink",
	"./waitForNavigationPopover",
	"./waitForP13nDialog",
	"./Util"
], function(
	Opa5,
	Ancestor,
	Descendant,
	Matcher,
	PropertyStrictEquals,
	Press,
	TestUtils,
	CloseNavigationPopover,
	OpenContextMenu,
	waitForLink,
	waitForNavigationPopover,
	waitForP13nDialog,
	Util
) {
	"use strict";

	const waitForTheWarningDialog = function(oSettings) {
		return this.waitFor({
			controlType: "sap.m.Dialog",
			matchers: new PropertyStrictEquals({
				name: "title",
				value: Util.texts.resetwarning
			}),
			success: function(aDialogs) {
				Opa5.assert.equal(aDialogs.length, 1, "warning dialog found");
				if (oSettings && typeof oSettings.success === "function") {
					oSettings.success.call(this, aDialogs[0]);
				}
			}
		});
	};

	const iPressAButtonOnTheDialog = function(oDialog, sButtonText, oSettings) {
		return this.waitFor({
			searchOpenDialogs: true,
			controlType: "sap.m.Button",
			matchers: [
				new PropertyStrictEquals({
					name: "text",
					value: sButtonText
				}),
				new Ancestor(oDialog, false)
			],
			actions: new Press(),
			success: function() {
				if (oSettings && typeof oSettings.success === "function") {
					oSettings.success.call(this);
				}
			},
			errorMessage: "Could not find the '" + sButtonText + "' button"
		});
	};

	return {
		iPressTheOKButtonOnTheDialog: function(oSettings) {
			return waitForP13nDialog.call(this, {
				success: function(oDialog) {
					return iPressAButtonOnTheDialog.call(this, oDialog, Util.texts.ok, oSettings);
				}
			});
		},
		iPressTheResetButtonOnTheDialog: function(oSettings) {
			return waitForP13nDialog.call(this, {
				success: function(oDialog) {
					return iPressAButtonOnTheDialog.call(this, oDialog, Util.texts.reset, oSettings);
				}
			});
		},
		iRightClickOnLinkInElementOverlay: function(sText) {
			return this.waitFor({
				controlType: "sap.ui.dt.ElementOverlay",
				matchers: function(oElementOverlay) {
					var oElementInstance = oElementOverlay.getElement();
					var oMetadata = oElementInstance.getMetadata();

					var bSmartLinkFitting = (oMetadata.getElementName && oMetadata.getElementName() === "sap.ui.comp.navpopover.SmartLink" && oElementInstance.getText && oElementInstance.getText() === sText);
					var bObjectIdentifierFitting = (oMetadata.getElementName && oMetadata.getElementName() === "sap.m.ObjectIdentifier" && oElementInstance.getTitle && oElementInstance.getTitle() === sText);

					return bSmartLinkFitting || bObjectIdentifierFitting;
				},
				actions: new OpenContextMenu(),
				errorMessage: "ElementOverlay '" + sText + "' not found"
			});
		},
		iSelectALinkOnP13nDialog: function(sColumnName) {
			return this.waitFor({
				controlType: "sap.m.Dialog",
				matchers: new PropertyStrictEquals({
					name: "title",
					value: TestUtils.getTextFromResourceBundle("sap.ui.comp", "POPOVER_SELECTION_TITLE")
				}),
				success: function(aP13nDialogs) {
					this.waitFor({
						controlType: "sap.m.Link",
						matchers: [
							new Ancestor(aP13nDialogs[0], false),
							new PropertyStrictEquals({
								name: "text",
								value: sColumnName
							})
						],
						success: function(aLinks) {
							this.waitFor({
								controlType: "sap.m.ColumnListItem",
								matchers: [
									new Descendant(aLinks[0])
								],
								success: function(aColumnListItems) {
									this.waitFor({
										controlType: "sap.m.CheckBox",
										matchers: new Ancestor(aColumnListItems[0], false),
										actions: new Press(),
										errorMessage: "CheckBox for ColumnListItem with text '" + sColumnName + "' not found"
									});
								}
							});
						},
						errorMessage: "Link with text '" + sColumnName + "' not found"
					});
				}
			});
		},
		iClickOnTheCheckboxSelectAll: function() {
			var oIDMatcher = new Matcher();
			oIDMatcher.isMatching = function(oControl) {
				return oControl.getId().endsWith('-sa');
			};

			return waitForP13nDialog.call(this, {
				success: function(oP13nDialog) {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.CheckBox",
						matchers: [
							new Ancestor(oP13nDialog, false),
							oIDMatcher
						],
						success: function(aCheckBoxes) {
							Opa5.assert.ok(aCheckBoxes.length, "'Select all' checkbox found");
						},
						actions: new Press(),
						errorMessage: "'Select all' checkbox not found"
					});
				}
			});
		},
		iPressOnMoreLinksButton: function(oSettings) {
			var aMatchers = oSettings.matchers ? oSettings.matchers : [];
			aMatchers.push(new PropertyStrictEquals({
				name: "text",
				value: Util.texts.moreLinks
			}));

			return this.waitFor({
				controlType: "sap.m.Button",
				matchers: aMatchers,
				actions: new Press(),
				success: function(aButtons) {
					Opa5.assert.ok(aButtons.length, "Button with text '" + Util.texts.moreLinks + "' found and pressed");
					if (oSettings.success) {
						oSettings.success.call(this, aButtons[0]);
					}
				},
				errorMessage: "Button with text '" + Util.texts.moreLinks + "' not found"
			});
		},
		iPersonalizeTheLinks: function(oLinkIdentifier, aLinks) {
			return waitForLink.call(this, oLinkIdentifier, {
				actions: new Press(),
				success: function(oLinkControl) {
					waitForNavigationPopover.call(this, {
						matchers: new Ancestor(oLinkIdentifier.objectIdentifier ? oLinkControl.getParent() : oLinkControl),
						success: function(oNavigationPopover) {
							this.iPressOnMoreLinksButton({
								matchers: [
									new Ancestor(oNavigationPopover, false)
								],
								success: function() {
									waitForP13nDialog.call(this, {
										success: function(oP13nDialog) {
											this.waitFor({
												controlType: "sap.m.ColumnListItem",
												matchers: new Ancestor(oP13nDialog, false),
												actions: function(oColumnListItem) {
													this.waitFor({
														controlType: "sap.m.Link",
														matchers: new Ancestor(oColumnListItem, false),
														success: function(aLinkControls) {
															var oLinkControl = aLinkControls[0];
															this.waitFor({
																controlType: "sap.m.CheckBox",
																matchers: [
																	new Ancestor(oColumnListItem, false)
																],
																actions: function(oCheckBox) {
																	if ((!oCheckBox.getSelected() && aLinks.includes(oLinkControl.getText())) ||
																		(oCheckBox.getSelected() && !aLinks.includes(oLinkControl.getText()))) {
																		new Press().executeOn(oCheckBox);
																	}
																}
															});
														}
													});
												}.bind(this),
												success: function() {
													this.iPressTheOKButtonOnTheDialog.call(this, oP13nDialog);
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		},
		iResetThePersonalization: function(oLinkIdentifier) {
			return waitForLink.call(this, oLinkIdentifier, {
				actions: new Press(),
				success: function(oLinkControl) {
					waitForNavigationPopover.call(this, {
						matchers: new Ancestor(oLinkIdentifier.objectIdentifier ? oLinkControl.getParent() : oLinkControl),
						success: function(oNavigationPopover) {
							this.iPressOnMoreLinksButton({
								matchers: [
									new Ancestor(oNavigationPopover, false)
								],
								success: function() {
									waitForP13nDialog.call(this, {
										success: function(oP13nDialog) {
											this.iPressTheResetButtonOnTheDialog.call(this, oP13nDialog, {
												success: function() {
													waitForTheWarningDialog.call(this, {
														success: function(oWarningDialog) {
															this.iPressTheOKButtonOnTheDialog.call(this, oWarningDialog, {
																success: function() {
																	this.iPressTheOKButtonOnTheDialog.call(this, oP13nDialog);
																}
															});
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		},
		iPressTheLink: function(oLinkIdentifier) {
			return waitForLink.call(this, oLinkIdentifier, {
				actions: new Press()
			});
		},
		iPressLinkOnPopover: function(oLinkIdentifier, sLink) {
			return waitForLink.call(this, oLinkIdentifier, {
				success: function(oLink) {
					waitForNavigationPopover.call(this, {
						matchers: new Ancestor(oLinkIdentifier.objectIdentifier ? oLink.getParent() : oLink),
						success: function(oNavigationPopover) {
							this.waitFor({
								controlType: "sap.m.Link",
								matchers: [
									new Ancestor(oNavigationPopover, false),
									new PropertyStrictEquals({
										name: "text",
										value: sLink
									})
								],
								actions: new Press(),
								success: function(aLinks) {
									Opa5.assert.equal(aLinks.length, 1, "link on NavigationPopover found and pressed");
								}
							});
						}
					});
				}
			});
		},
		iCloseThePopover: function() {
			return this.waitFor({
				controlType: "sap.ui.comp.navpopover.NavigationPopover",
				actions: new CloseNavigationPopover()
			});
		}
	};
});
