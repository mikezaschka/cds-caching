sap.ui.define([
    "sap/ui/core/Lib",
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/Ancestor",
	"sap/ui/test/matchers/Descendant",
	"sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText",
	"./Util",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/waitForP13nButtonWithMatchers",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/waitForP13nDialog",
	"sap/ui/Device"
], function(
    Library,
	Opa5,
	Properties,
	Ancestor,
	Descendant,
	PropertyStrictEquals,
    Press,
    EnterText,
	Util,
	waitForP13nButtonWithMatchers,
	waitForP13nDialog,
	Device
) {
    "use strict";

	var oMDCBundle = Library.getResourceBundleFor("sap.ui.mdc");

    var waitForNavigationControl = function (oP13nDialog, oSettings) {
		oSettings = oSettings || {};

		//Mobile
		if (Device.system.phone) {
			return this.waitFor({
				controlType: "sap.m.List",
				success: function(aLists) {
					Opa5.assert.equal(aLists.length, 1 , "One list found");
					if (oSettings && typeof oSettings.success === "function") {
						oSettings.success.call(this, aLists[0]);
					}
				}
			});
		}

		return this.waitFor({
			controlType: "sap.m.IconTabBar",
			matchers: {
				ancestor: oP13nDialog
			},
			success: function(aTabBar) {
				Opa5.assert.ok(aTabBar.length === 1, "IconTabBar found");
				if (oSettings && typeof oSettings.success === "function") {
					oSettings.success.call(this, aTabBar[0]);
				}
			},
			errorMessage: "sap.m.IconTabBar not found"
		});
	};

    var iNavigateToPanel = function(oP13nPanel, sPanelName, oSettings) {
		return waitForNavigationControl.call(this, oP13nPanel, {
			success: function(oNavigationControl) {

				var sNavigationControlType, sInnerControlType, sInnerControlPropertyName;

				//Mobile
				if (oNavigationControl.isA("sap.m.List")) {
					sNavigationControlType = "sap.m.List";
					sInnerControlType = "sap.m.StandardListItem";
					sInnerControlPropertyName = "title";
				}

				//New Layout
				if (oNavigationControl.isA("sap.m.IconTabBar")) {
					sNavigationControlType = "sap.m.IconTabBar";
					sInnerControlType = "sap.m.IconTabFilter";
					sInnerControlPropertyName = "text";
				}

				//Old Layout
				if (oNavigationControl.isA("sap.m.SegmentedButton")) {
					sNavigationControlType = "sap.m.SegmentedButton";
					sInnerControlType = "sap.m.Button";
					sInnerControlPropertyName = "text";
				}

				return this.waitFor({
					controlType: sNavigationControlType,
					success: function(aNavigationControls) {
						var oNavigationControl = aNavigationControls[0];
						this.waitFor({
							controlType: sInnerControlType,
							matchers: [
								new Ancestor(oNavigationControl),
								new PropertyStrictEquals({
									name: sInnerControlPropertyName,
									value: sPanelName
								})
							],
							actions: new Press(),
							success: function () {
								if (oSettings && typeof oSettings.success === "function") {
									oSettings.success.call(this);
								}
							}
						});
					}
				});
			}
		});
	};

    var iPersonalize = function(oControl, sPanelName, fnOpenThePersonalizationDialog, oSettings) {
		return fnOpenThePersonalizationDialog.call(this, oControl, {
			success:  function(oP13nDialog) {
				iNavigateToPanel.call(this, oP13nDialog, sPanelName, {
					success: function() {
						if (oSettings && typeof oSettings.success === "function") {
							oSettings.success.call(this, oP13nDialog);
						}
					}
				});
			}
		});
	};

    var iPressAllDeclineButtonsOnPanel = function(oPanel, oSettings) {
		this.waitFor({
			controlType: "sap.m.Button",
			matchers: [
				new Ancestor(oPanel, false),
				new PropertyStrictEquals({
					name: "icon",
					value: Util.icons.decline
				})
			],
			actions: new Press(),
			// Add new group entries
			success: function() {
				if (oSettings && typeof oSettings.success === "function") {
					oSettings.success.call(this);
				}
			}
		});
	};

    var iChangeComboBoxSelection = function(oComboBox, sNew, oSettings) {
		new Press().executeOn(oComboBox);
		this.waitFor({
			controlType: "sap.m.Popover",
			matchers: new Ancestor(oComboBox),
			success: function(aPopovers) {
				Opa5.assert.ok(aPopovers.length === 1, "ComboBox popover found");
				var oPopover = aPopovers[0];
				this.waitFor({
					controlType: "sap.m.StandardListItem",
					matchers: [
						new Ancestor(oPopover, false),
						new PropertyStrictEquals({
							name: "title",
							value: sNew
						})
					],
					actions: new Press(),
					success: function(oSelect) {
						if (oSettings && typeof oSettings.success === "function") {
							oSettings.success.call(this, oSelect);
						}
					},
					errorMessage: "ComboBox StandardListItem with text '" + sNew + "' not found"
				});
			}
		});
	};

	var iOpenThePersonalizationDialog = function(oControl, oSettings) {
		var sControlId = typeof oControl === "string" ? oControl : oControl.getId();
		var aDialogMatchers = [];
		var aButtonMatchers = [];
		return this.waitFor({
			id: sControlId,
			success: function(oControlInstance) {
				Opa5.assert.ok(oControlInstance);

				aButtonMatchers.push(new Ancestor(oControlInstance));

				// Add matcher for p13n button icon
				aButtonMatchers.push(new Properties({
					icon: Util.icons.settings
				}));
				aDialogMatchers.push(new Properties({
					title: oMDCBundle.getText("p13nDialog.VIEW_SETTINGS")
				}));

				waitForP13nButtonWithMatchers.call(this, {
					actions: new Press(),
					matchers: aButtonMatchers,
					success: function() {
						waitForP13nDialog.call(this, {
							matchers: aDialogMatchers,
							success:  function(oP13nDialog) {
								if (oSettings && typeof oSettings.success === "function") {
									oSettings.success.call(this, oP13nDialog);
								}
							}
						});
					},
					errorMessage: "Control '" + sControlId + "' has no P13n button"
				});
			},
			errorMessage: "Control '" + sControlId + "' not found."
		});
	};

	var iAddFilterConfiguration = function(oWrappingGrid, oConfiguration, bPressAddButton) {
		this.waitFor({
			controlType: "sap.m.Button",
			matchers: [
				new PropertyStrictEquals({
					name: "text",
					value: "Add"
				}),
				new Ancestor(oWrappingGrid, false)
			],
			success: function(aAddButtons) {
				var oAddButton = aAddButtons[0];
				this.waitFor({
					controlType: "sap.ui.layout.Grid",
					matchers: [
						new Descendant(oAddButton),
						new Ancestor(oWrappingGrid)
					],
					success: function(aGrids) {
						var oGrid = aGrids[0];
						this.waitFor({
							controlType: "sap.m.ComboBox",
							matchers: new Ancestor(oGrid),
							success: function(aComboBoxes) {
								var oComboBoxName = aComboBoxes[0];
								var oComboBoxCondition = aComboBoxes[1];
								// Select name
								iChangeComboBoxSelection.call(this, oComboBoxName, oConfiguration.key , {
									success: function() {
										// Select condition
										iChangeComboBoxSelection.call(this, oComboBoxCondition, oConfiguration.operator, {
											success: function() {
												// Add filter value(s)
												if (oConfiguration.values && oConfiguration.values.length) {
													oConfiguration.values.forEach(function(sConfigurationValue) {
														this.waitFor({
															controlType: oConfiguration.inputControl,
															matchers: new Ancestor(oGrid),
															success: function(aInputs) {
																var oInput = aInputs[oConfiguration.values.indexOf(sConfigurationValue)];
																new EnterText({
																	text: sConfigurationValue
																}).executeOn(oInput);
															}
														});
													}.bind(this));
												}
												// click add button if needed
												if (bPressAddButton) {
													new Press().executeOn(oAddButton);
												}
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
	};

	var iPressTheOKButtonOnTheDialog = function(oDialog, oSettings) {
		return iPressAButtonOnTheDialog.call(this, oDialog, Util.texts.ok, oSettings);
	};

	var iPressAButtonOnTheDialog = function(oDialog, sButtonText, oSettings) {
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
        /**
		 * @typedef {object} FilterPersonalizationConfiguration
		 * @property {string} key Key of the value that is the result of the personalization
		 * @property {string} operator Operator defining how the items are filtered
		 * @property {string[]} values Filter values for the given operator
		 * @property {string} inputControl <code>Control</code> that is used as input for the value
		 */
		/**
		 * OPA5 test action
		 * 1. Opens the personalization dialog of a given chart.
		 * 2. Executes the given <code>FilterPersonalizationConfiguration</code>.
		 * 3. Closes the personalization dialog.
		 * @param {sap.ui.core.Control | string} oControl Instance / ID of the <code>Control</code> that is filtered
		 * @param {FilterPersonalizationConfiguration[]} aConfigurations Array containing the filter personalization configuration objects
		 * @param {function} fnOpenThePersonalizationDialog a function which opens the personalization dialog of the given control
		 * @returns {Promise} OPA waitFor
		 */
        iPersonalizeFilter: function(oControl, aConfigurations, fnOpenThePersonalizationDialog) {
			fnOpenThePersonalizationDialog = fnOpenThePersonalizationDialog ? fnOpenThePersonalizationDialog : iOpenThePersonalizationDialog;
            return iPersonalize.call(this, oControl, Util.texts.filter, fnOpenThePersonalizationDialog, {
				success: function(oP13nDialog) {
					this.waitFor({
                        controlType: "sap.ui.comp.p13n.P13nFilterPanel",
                        matchers: new Ancestor(oP13nDialog, false),
                        success: function(aFilterPanels) {
                            var oFilterPanel = aFilterPanels[0];
                            this.waitFor({
                                controlType: "sap.m.Panel",
                                matchers: new Ancestor(oFilterPanel),
                                success: function(aPanels) {
                                    var oPanel = aPanels[0];
                                    this.waitFor({
                                        controlType: "sap.ui.comp.p13n.P13nConditionPanel",
                                        matchers: new Ancestor(oPanel),
                                        success: function(aP13nConditionPanels) {
                                            var oP13nConditionPanel = aP13nConditionPanels[0];
                                            // Remove all filter entries
                                            iPressAllDeclineButtonsOnPanel.call(this, oP13nConditionPanel, {
                                                success: function() {
                                                    this.waitFor({
                                                        controlType: "sap.ui.layout.Grid",
                                                        matchers: new Ancestor(oP13nConditionPanel),
                                                        success: function(aGrids) {
                                                            var oWrappingGrid = aGrids[0];
                                                            aConfigurations.forEach(function(oConfiguration) {
                                                                var bPressAddButton = (aConfigurations.indexOf(oConfiguration) != aConfigurations.length - 1);
                                                                iAddFilterConfiguration.call(this, oWrappingGrid, oConfiguration, bPressAddButton);
                                                            }.bind(this));
															iPressTheOKButtonOnTheDialog.call(this, oP13nDialog);
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
    };
});