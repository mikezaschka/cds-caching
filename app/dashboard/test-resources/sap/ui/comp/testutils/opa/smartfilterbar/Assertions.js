/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/comp/providers/TokenParser"
], function (
	Opa5,
	TokenParser
) {
	"use strict";

	function labelForMatcher(sFilterBarId, sLabel, fnSuccess) {
		this.waitFor({
			controlType: "sap.m.Label",
			ancestor: {
				controlType: "sap.ui.comp.smartfilterbar.SmartFilterBar",
				id: sFilterBarId
			},
			properties: {
				text: sLabel
			},
			errorMessage: "'" + sLabel + "' field was not found in '" + sFilterBarId + "' SmartFilterBar",
			success: function () {
				Opa5.assert.ok(true, "'" + sLabel + "' field was found in '" + sFilterBarId + "' SmartFilterBar");

				fnSuccess && fnSuccess.apply(this, arguments);
			}
		});
	}

	function fieldValueMatcher(aExpectedConditions, oControl) {
		if (oControl.getTokens && oControl.getTokens().length) {
			return checkTokens(aExpectedConditions, oControl.getTokens());
		}

		if (oControl.getSelectedItems && oControl.getSelectedItems().length) {
			return checkSelectedItems(aExpectedConditions, oControl.getSelectedItems());
		}

		if (oControl.getSelectedItem && oControl.getSelectedItem()) {
			return checkSelectedItem(aExpectedConditions, oControl.getSelectedItem());
		}

		if (oControl.getValue && oControl.getValue()) {
			return checkValue(aExpectedConditions, oControl.getValue());
		}

		return false;
	}

	function checkTokens(aExpectedConditions, aTokens) {
		if (aExpectedConditions.length > aTokens.length) {
			return false;
		}

		var aTokenConditions = aTokens.map(function (oToken) {
			if (oToken.data("row")) {
				return {
					operator: "EQ",
					values: [oToken.getKey(), oToken.getText()]
				};
			}

			if (oToken.data("range")) {
				var oRange = TokenParser._createRangeByText(oToken.getText()),
					bExclude = oRange.exclude,
					sOperation = bExclude ? "Not" + oRange.operation : oRange.operation,
					sValue1 = oRange.value1,
					sValue2 = oRange.value2;

				return {
					operator: sOperation,
					values: [sValue1, sValue2]
				};
			}
		});

		return checkConditions(aExpectedConditions, aTokenConditions);
	}

	function checkSelectedItems(aExpectedConditions, aSelectedItems) {
		if (aExpectedConditions.length > aSelectedItems.length) {
			return false;
		}

		var aSelectedConditions = aSelectedItems.map(function (oSelectedItem) {
			return {
				operator: "EQ",
				values: [oSelectedItem.getText()]
			};
		});

		return checkConditions(aExpectedConditions, aSelectedConditions);
	}

	function checkSelectedItem(aExpectedConditions, oSelectedItem) {
		if (aExpectedConditions.length > 1) {
			return false;
		}

		var aSelectedConditions = [{
			operator: "EQ",
			values: [oSelectedItem.getText()]
		}];

		return checkConditions(aExpectedConditions, aSelectedConditions);
	}

	function checkValue(aExpectedConditions, sValue) {
		if (aExpectedConditions.length > 1) {
			return false;
		}

		var aSelectedConditions = [{
			operator: "EQ",
			values: [sValue]
		}];

		return checkConditions(aExpectedConditions, aSelectedConditions);
	}

	function checkConditions(aExpectedConditions, aActualConditions) {
		return aExpectedConditions.every(function (oExpectedCondition) {
			return aActualConditions.some(function (oTokenCondition) {
				var bOperatorMatched = oExpectedCondition.operator === oTokenCondition.operator,
					bValue1Matched = oExpectedCondition.values && oExpectedCondition.values[0] === oTokenCondition.values[0],
					bValue2Matched = oExpectedCondition.values && oExpectedCondition.values[1] === oTokenCondition.values[1],
					bSkipValue2 = typeof oExpectedCondition.values[1] === "undefined" || oExpectedCondition.values[1] === null;

				if (["Empty", "NotEmpty"].includes(oExpectedCondition.operator)) {
					return bOperatorMatched;
				}

				if (bSkipValue2) {
					return bOperatorMatched && bValue1Matched;
				}

				return bOperatorMatched && bValue1Matched && bValue2Matched;
			});
		});
	}

	function iShouldSeeFilterFieldWithValue(sFilterBarId, sLabel, aExpectedConditions) {
		labelForMatcher.call(this, sFilterBarId, sLabel, function (aLabels) {
			var oLabel = aLabels[0];

			this.waitFor({
				id: oLabel.getLabelFor(),
				matchers: fieldValueMatcher.bind(this, aExpectedConditions),
				errorMessage: "'" + JSON.stringify(aExpectedConditions) + "' values were not found in '" + sLabel + "'",
				success: function () {
					Opa5.assert.ok(true, "'" + JSON.stringify(aExpectedConditions) + "' values were found in '" + sLabel + "'");
				}
			});
		});
	}

	return {
		iShouldSeeFilters: function (oSmartFilterBar, vSettings) {
			var sFilterBarId = typeof oSmartFilterBar === "string" ? oSmartFilterBar : oSmartFilterBar.getId();

			if (Array.isArray(vSettings)) {
				vSettings.forEach(function (sLabel) {
					labelForMatcher.call(this, sFilterBarId, sLabel);
				}.bind(this));
			} else {
				for (var sLabel in vSettings) {
					iShouldSeeFilterFieldWithValue.call(this, sFilterBarId, sLabel, vSettings[sLabel]);
				}
			}
		}
	};
});
