/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/base/EventProvider",
	"sap/base/util/values",
	"./Constants",
	"./HistoryGlobalDataService",
	"./HistoryAppDataService",
	"sap/ui/core/Element"
], function(EventProvider, values, constants, HistoryGlobalDataService, HistoryAppDataService, Element) {
	"use strict";

	/**
	 * Provider for history values
	 *
	 * @constructor
	 * @private
	 * @author SAP SE
	 */
	var HistoryValuesProvider = EventProvider.extend("sap.ui.comp.providers.HistoryValuesProvider", {
		metadata: {
			library: "sap.ui.comp",
			events: {
				fieldUpdated: {
					parameters: {
						fieldData: {
							type: "Array"
						}
					}
				}
			}
		},

		constructor: function (oControl, sFieldName) {
			EventProvider.apply(this, arguments);

			this._initialize(oControl, sFieldName);
		}
	});

	HistoryValuesProvider.prototype._initialize = function (oControl, sFieldName) {
		this._oControl = oControl;
		this._sFieldName = sFieldName;
	};

	HistoryValuesProvider.prototype._getHistoryGlobalDataService = function () {
		return HistoryGlobalDataService.getInstance();
	};

	HistoryValuesProvider.prototype._getHistoryAppDataService = function () {
		return HistoryAppDataService.getInstance();
	};

	HistoryValuesProvider.prototype.attachChangeListener = function () {
		if (this._oControl.isA("sap.m.MultiInput")) {
			this._oControl.attachTokenUpdate(this._onMultiInputChange, this);
			return;
		}

		if (this._oControl.isA("sap.m.MultiComboBox")) {
			this._oControl.attachSelectionChange(this._onMultiComboBoxChange, this);
			return;
		}

		if (this._oControl.isA("sap.m.Input")) {
			this._oControl.attachSuggestionItemSelected(this._suggestionItemSelected, this);
			return;
		}

		if (this._oControl.isA("sap.m.ComboBox")) {
			this._oControl.attachChange(this._onComboBoxChange, this);
			return;
		}
	};

	HistoryValuesProvider.prototype._detachChangeListener = function () {
		if (this._oControl.isA("sap.m.MultiInput")) {
			this._oControl.detachTokenUpdate(this._onMultiInputChange, this);
			return;
		}

		if (this._oControl.isA("sap.m.MultiComboBox")) {
			this._oControl.detachSelectionChange(this._onMultiComboBoxChange, this);
			return;
		}

		if (this._oControl.isA("sap.m.Input")) {
			this._oControl.detachSuggestionItemSelected(this._suggestionItemSelected, this);
			return;
		}

		if (this._oControl.isA("sap.m.ComboBox")) {
			this._oControl.detachChange(this._onComboBoxChange, this);
			return;
		}
	};

	HistoryValuesProvider.prototype._onMultiInputChange = function (oEvent) {
		var sType = oEvent.getParameter("type"),
			aAddedTokens = oEvent.getParameter("addedTokens");

		if (sType === "added") {
			var aDataToSave = aAddedTokens.reduce(function (aResult, oToken) {
				var oData = oToken.data("row");
				if (oData) {
					return aResult.concat(oData);
				}

				return aResult;
			}, []);

			this.setFieldData(aDataToSave);
		}
	};

	HistoryValuesProvider.prototype._onMultiComboBoxChange = function (oEvent) {
		var bSelected = oEvent.getParameter("selected"),
			oChangedItem = oEvent.getParameter("changedItem");

		if (bSelected && oChangedItem) {
			var oData = oChangedItem.getBindingContext("list").getObject();

			this._processSingleValueControl(oData);
		}
	};

	HistoryValuesProvider.prototype._suggestionItemSelected = function (oEvent) {
		var oSelectedRow = Element.getElementById(oEvent.getSource().getSelectedRow());

		if (oSelectedRow) {
			var oData = oSelectedRow.getBindingContext("list").getObject();

			this._processSingleValueControl(oData);
		}
	};

	HistoryValuesProvider.prototype._onComboBoxChange = function (oEvent) {
		var sValue = oEvent.getParameter("value"),
			sNewValue = oEvent.getParameter("newValue"),
			oSelectedItem = oEvent.getSource().getSelectedItem();

		if (sValue && sNewValue && oSelectedItem) {
			var oData = oSelectedItem.getBindingContext("list").getObject();

			this._processSingleValueControl(oData);
		}
	};

	HistoryValuesProvider.prototype._processSingleValueControl = function (oData) {
		if (oData) {
			this.setFieldData([oData]);
		}
	};

	HistoryValuesProvider.prototype._processDateValues = function (oData) {
		return Object.keys(oData).reduce(function(oResult, sKey) {
			if (typeof oData[sKey] === "object" && Object.prototype.toString.call(oData[sKey]) === "[object Date]") {
				oResult[sKey] = "/Date(" + oData[sKey].getTime() + ")/";
			} else {
				oResult[sKey] = oData[sKey];
			}

			return oResult;
		}, {});
	};

	HistoryValuesProvider.prototype._getDistinct = function (aData) {
		var oUnique = {},
			aDistinct = [];

		aData.forEach(function (x) {
			var sKey = values(x).join();
			if (!oUnique[sKey]) {
				aDistinct.push(x);
				oUnique[sKey] = true;
			}
		}, this);

		return aDistinct;
	};

	HistoryValuesProvider.prototype._getItemId = function (sMetadataId) {
		if (!sMetadataId) {
			return null;
		}

		var iLastIndexOfParentheses = sMetadataId.lastIndexOf("(");

		return sMetadataId.slice(iLastIndexOfParentheses);
	};

	HistoryValuesProvider.prototype.getFieldData = function () {
		return this._getHistoryAppDataService().then((oHistoryAppDataService) => oHistoryAppDataService.getFieldData(this._sFieldName));
	};

	HistoryValuesProvider.prototype.setFieldData = function (aFieldNewData) {
		aFieldNewData = aFieldNewData.reduce(function (aResults, oData) {
			var sItemId = this._getItemId(oData.__metadata && oData.__metadata.id);

			oData = Object.assign({}, oData);
			if (sItemId) {
				oData = Object.assign( { __ui5_id: sItemId }, oData);
			}
			delete oData.__metadata;
			delete oData[constants.getForcedVisiblePropertyName()];
			delete oData[constants.getSuggestionsGroupPropertyName()];

			oData = this._processDateValues(oData);
			aResults.push(oData);

			return aResults;
		}.bind(this), []);

		return this._getHistoryAppDataService().then((oHistoryAppDataService) => oHistoryAppDataService.getFieldData(this._sFieldName))
			.then(function (aFieldOldData) {
				var iMaxHistoryItems = constants.getMaxHistoryItems(),
					aDataToSet = this._getDistinct(aFieldNewData.concat(aFieldOldData));

				aDataToSet = aDataToSet.slice(0, iMaxHistoryItems);

				this.fireEvent("fieldUpdated", {
					fieldData: aDataToSet
				});

				return this._getHistoryAppDataService().then((oHistoryAppDataService) => oHistoryAppDataService.setFieldData(this._sFieldName, aDataToSet));
			}.bind(this));
	};

	HistoryValuesProvider.prototype.getHistoryEnabled = function () {
		return this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.getHistoryEnabled());
	};

	HistoryValuesProvider.prototype.destroy = function () {
		EventProvider.prototype.destroy.apply(this, arguments);

		if (this._oControl) {
			this._detachChangeListener();
			this._oControl = null;
		}

		this._sFieldName = "";
		this._oDataReadyPromise = null;
	};

	return HistoryValuesProvider;
});
