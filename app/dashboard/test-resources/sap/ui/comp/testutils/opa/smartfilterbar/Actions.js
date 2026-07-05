/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/Matcher",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/Ancestor",
	"sap/ui/test/matchers/Descendant",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Actions",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Util",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/waitForP13nButtonWithMatchers",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/waitForP13nDialog",
	"sap/ui/comp/providers/TokenParser",
	"../valuehelpdialog/Util",
	"./Util"
], function (
	Opa5,
	Matcher,
	Properties,
	Ancestor,
	Descendant,
	PropertyStrictEquals,
	Press,
	EnterText,
	p13nActions,
	p13nUtil,
	waitForP13nButtonWithMatchers,
	waitForP13nDialog,
	TokenParser,
	valueHelpDialogUtil,
	filterBarUtil
) {
	"use strict";

	function isNotAButtonMatcher(oControl) {
		return !oControl.isA("sap.m.Button");
	}

	function iEnterValueInControl(oControl, sFieldLabel, vValues) {
		vValues.forEach(function (sValue, i) {
			new EnterText({
				text: sValue,
				clearTextFirst: i === 0, // clear text only for the first value
				pressEnterKey: true
			}).executeOn(oControl);

			Opa5.assert.ok(true, "'" + sValue + "' entered in '" + sFieldLabel + "' field");
		});
	}

	function iEnterValueInValueHelpControl(oControl, sFieldLabel, vValues) {
		new Press().executeOn(oControl);

		this.waitFor({
			controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
			searchOpenDialogs: true,
			errorMessage: "ValueHelpDialog for '" + sFieldLabel + "' field was not found",
			success: function () {
				Opa5.assert.ok(true, "ValueHelpDialog for '" + sFieldLabel + "' field was found");
			}
		});

		vValues.forEach(function (sValue, i) {
			var oRange = TokenParser._createRangeByText(sValue),
				bExclude = oRange.exclude,
				sOperation = bExclude ? "Not" + oRange.operation : oRange.operation,
				sValue1 = oRange.value1,
				sValue2 = oRange.value2;

			this.waitFor({
				controlType: "sap.m.Button",
				searchOpenDialogs: true,
				ancestor: {
					controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog"
				},
				actions: function (oButton) {
					if (oButton.getText() === valueHelpDialogUtil.texts.addRowButton) {
						new Press().executeOn(oButton);
						Opa5.assert.ok(true, "'Add' button was found");
					}
				}
			});

			this.waitFor({
				controlType: "sap.ui.comp.p13n.P13nConditionPanel",
				searchOpenDialogs: true,
				errorMessage: "P13nConditionPanel was not found",
				success: function (aControls) {
					var oP13nConditionPanel = aControls[0];
					var oConditionsGrid = oP13nConditionPanel.getAggregation("content").find(function (oControl) {
						return oControl.isA("sap.ui.layout.Grid");
					});
					var aConditions = oConditionsGrid.getContent();
					var oLastConditionGrid = aConditions[aConditions.length - 1];

					iSelectConditionInValueHelpControl.call(this, oLastConditionGrid, sOperation);
					iEnterValuesInValueHelpControl.call(this, oLastConditionGrid, sOperation, sValue1, sValue2);
				}
			});
		}, this);

		this.waitFor({
			controlType: "sap.m.Button",
			searchOpenDialogs: true,
			ancestor: {
				controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
				searchOpenDialogs: true
			},
			properties: {
				text: valueHelpDialogUtil.texts.ok
			},
			errorMessage: "'" + valueHelpDialogUtil.texts.ok + "' was not found",
			actions: new Press()
		});
	}

	function iSelectConditionInValueHelpControl(oConditionGrid, sOperation) {
		this.waitFor({
			controlType: "sap.ui.core.Item",
			visible: false,
			ancestor: {
				controlType: "sap.m.ComboBox",
				searchOpenDialogs: true,
				matchers: new Ancestor(oConditionGrid, true),
				actions: new Press()
			},
			properties: {
				key: sOperation
			},
			errorMessage: "'" + sOperation + "' operation was not found",
			actions: function (oCoreItem) {
				var oStandardListItem = oCoreItem.data("InputWithSuggestionsListItem");

				if (oStandardListItem) {
					new Press().executeOn(oStandardListItem);
				}
			},
			success: function () {
				Opa5.assert.ok(true, "'" + sOperation + "' operation was selected");
			}
		});
	}

	function iEnterValuesInValueHelpControl(oConditionGrid, sOperation, sValue1, sValue2) {
		if (sOperation !== "BT" && sOperation !== "NotBT" && sOperation !== "Empty" && sOperation !== "NotEmpty") {
			iEnterValueInValueHelpField.call(this, oConditionGrid, valueHelpDialogUtil.texts.placeholderValueField, sValue1);
		}

		if (sOperation === "BT" || sOperation === "NotBT") {
			iEnterValueInValueHelpField.call(this, oConditionGrid, valueHelpDialogUtil.texts.placeholderFromField, sValue1);
			iEnterValueInValueHelpField.call(this, oConditionGrid, valueHelpDialogUtil.texts.placeholderToField, sValue2);
		}
	}

	function iEnterValueInValueHelpField(oConditionGrid, sFieldLabel, sValue) {
		this.waitFor({
			controlType: "sap.ui.core.Control",
			searchOpenDialogs: true,
			matchers: [
				new Ancestor(oConditionGrid, true),
				isNotAButtonMatcher,
				new Properties({
					placeholder: sFieldLabel
				})
			],
			actions: new EnterText({
				text: sValue,
				pressEnterKey: true
			}),
			errorMessage: "'" + sValue + "' was not entered in '" + sFieldLabel + "' field",
			success: function () {
				Opa5.assert.ok(true, "'" + sValue + "' was entered in '" + sFieldLabel + "' field");
			}
		});
	}

	function iClearValueInControl(oControl, sFilterLabel) {
		new EnterText({
			text: '',
			clearTextFirst: true
		}).executeOn(oControl);

		Opa5.assert.ok(true, "'" + sFilterLabel + "' field was cleared");
	}

	function iClearTokensInControl(oControl, sFilterLabel) {
		this.waitFor({
			controlType: "sap.ui.core.Icon",
			ancestor: {
				id: oControl.getId()
			},
			properties: {
				src: filterBarUtil.icons.decline
			},
			actions: new Press(),
			errorMessage: "'" + sFilterLabel + "' field was not cleared. Either it does not have value or it is not a valid value",
			success: function () {
				Opa5.assert.ok(true, "'" + sFilterLabel + "' field was cleared");
			}
		});
	}

	function iOpenThePersonalizationDialog (oControl, oSettings) {
		var sControlId = typeof oControl === "string" ? oControl : oControl.getId();
		var aDialogMatchers = [];
		var aButtonMatchers = [];
		return this.waitFor({
			id: sControlId,
			success: function (oControlInstance) {
				Opa5.assert.ok(oControlInstance);

				aButtonMatchers.push(new Ancestor(oControlInstance));

				if (oControlInstance.isA("sap.ui.comp.smartfilterbar.SmartFilterBar")) {
					// Add matcher for p13n button text
					var oMatcher = new Matcher();
					oMatcher.isMatching = function (oButton) {
						return oButton.getText().includes(filterBarUtil.texts.adaptFilters);
					};
					aButtonMatchers.push(oMatcher);
					aDialogMatchers.push(new Properties({
						title: filterBarUtil.texts.adaptFilters
					}));
				}

				waitForP13nButtonWithMatchers.call(this, {
					actions: new Press(),
					matchers: aButtonMatchers,
					success: function () {
						waitForP13nDialog.call(this, {
							matchers: aDialogMatchers,
							success: function (oP13nDialog) {
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
	}

	return {
		iExpectSearch: function (oSmartFilterBar) {
			var sFilterBarId = typeof oSmartFilterBar === "string" ? oSmartFilterBar : oSmartFilterBar.getId();
			var sText = filterBarUtil.texts.go;
			return this.waitFor({
				id: sFilterBarId,
				success: function (oSmartFilterBarInstance) {
					Opa5.assert.ok(oSmartFilterBarInstance, "Found FilterBar.");
					if (!oSmartFilterBarInstance.getLiveMode()) {
						this.waitFor({
							controlType: "sap.m.Button",
							matchers: [
								new Ancestor(oSmartFilterBarInstance, false),
								new PropertyStrictEquals({
									name: "text",
									value: sText
								})
							],
							actions: new Press(),
							errorMessage: "No '" + sText + "' button found on the FilterBar."
						});
					}
				}
			});
		},
		iEnterFilterValue: function (oSmartFilterBar, mSettings) {
			var sGroupName = Object.keys(mSettings)[0];
			var sFieldLabel = mSettings[sGroupName].label;
			var vValues = mSettings[sGroupName].values;
			var oP13nDialog;

			iOpenThePersonalizationDialog.call(this, oSmartFilterBar, {
				success: function (oDialog) {
					oP13nDialog = oDialog;
				}
			});

			this.waitFor({
				controlType: "sap.m.Button",
				searchOpenDialogs: true,
				properties: {
					icon: p13nUtil.icons.group
				},
				actions: new Press(),
				errorMessage: "'Group View' button was not found",
				success: function () {
					Opa5.assert.ok(true, "'Group View' button was pressed");
				}
			});

			this.waitFor({
				controlType: "sap.m.Button",
				searchOpenDialogs: true,
				ancestor: {
					controlType: "sap.ui.mdc.p13n.panels.GroupView",
					searchOpenDialogs: true
				},
				sibling: {
					controlType: "sap.m.Toolbar",
					searchOpenDialogs: true,
					descendant: {
						controlType: "sap.m.Title",
						searchOpenDialogs: true,
						properties: {
							text: sGroupName
						},
						errorMessage: "'" + sGroupName + "' group was not found"
					}
				},
				actions: function (oButton) {
					if (oButton.getIcon() === "sap-icon://slim-arrow-right") {
						new Press().executeOn(oButton);
					}
				},
				success: function () {
					Opa5.assert.ok(true, "'" + sGroupName + "' group was expanded");
				}
			});

			this.waitFor({
				controlType: "sap.m.Label",
				searchOpenDialogs: true,
				ancestor: {
					controlType: "sap.ui.mdc.p13n.panels.GroupView",
					searchOpenDialogs: true
				},
				properties: {
					text: sFieldLabel
				},
				errorMessage: "'" + sFieldLabel + "' field was not found in '" + sGroupName + "' group",
				success: function (aControls) {
					var oLabel = aControls[0];

					this.waitFor({
						id: oLabel.getLabelFor(),
						success: function (oControl) {
							if (oControl.getValueHelpOnly && oControl.getValueHelpOnly()) {
								iEnterValueInValueHelpControl.call(this, oControl, sFieldLabel, vValues);
							} else {
								iEnterValueInControl.call(this, oControl, sFieldLabel, vValues);
							}

							p13nActions.iPressTheOKButtonOnTheDialog.call(this, oP13nDialog);
						}
					});
				}
			});
		},
		iAddValuesToFilterField: function(oSmartFilterBar, sFilterLabel, vValues) {
			var sFilterBarId = typeof oSmartFilterBar === "string" ? oSmartFilterBar : oSmartFilterBar.getId();

			this.waitFor({
				controlType: "sap.m.Label",
				ancestor: {
					controlType: "sap.ui.comp.smartfilterbar.SmartFilterBar",
					id: sFilterBarId
				},
				properties: {
					text: sFilterLabel
				},
				errorMessage: "'" + sFilterLabel + "' field was not found",
				success: function (aControls) {
					var oControl = aControls[0];

					this.waitFor({
						id: oControl.getLabelFor(),
						ancestor: {
							controlType: "sap.ui.comp.smartfilterbar.SmartFilterBar",
							id: sFilterBarId
						},
						success: function (aControls) {
							var oControl = aControls;

							if (oControl.getValueHelpOnly && oControl.getValueHelpOnly()) {
								iEnterValueInValueHelpControl.call(this, oControl, sFilterLabel, vValues);
							} else {
								iEnterValueInControl.call(this, oControl, sFilterLabel, vValues);
							}

						}
					});
				}
			});
		},
		iClearFilterValue: function (oSmartFilterBar, sFilterLabel) {
			var sFilterBarId = typeof oSmartFilterBar === "string" ? oSmartFilterBar : oSmartFilterBar.getId();

			this.waitFor({
				controlType: "sap.m.Label",
				ancestor: {
					controlType: "sap.ui.comp.smartfilterbar.SmartFilterBar",
					id: sFilterBarId
				},
				properties: {
					text: sFilterLabel
				},
				errorMessage: "'" + sFilterLabel + "' field was not found",
				success: function (aControls) {
					var oControl = aControls[0];

					this.waitFor({
						id: oControl.getLabelFor(),
						ancestor: {
							controlType: "sap.ui.comp.smartfilterbar.SmartFilterBar",
							id: sFilterBarId
						},
						success: function (aControls) {
							var oControl = aControls;

							if ((oControl.getTokens && oControl.getTokens().length) || (oControl.getSelectedItems && oControl.getSelectedItems().length)) {
								oControl.onfocusin({ target: oControl.getDomRef("inner") });
								iClearTokensInControl.call(this, oControl, sFilterLabel);
							}

							if (oControl.getValue && oControl.getValue() && oControl.getValueHelpOnly && !oControl.getValueHelpOnly()) {
								iClearValueInControl.call(this, oControl, sFilterLabel);
							}
						}
					});
				}
			});
		},
		iOpenThePersonalizationDialog: iOpenThePersonalizationDialog
	};

});
