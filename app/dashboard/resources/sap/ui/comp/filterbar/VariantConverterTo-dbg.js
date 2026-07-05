/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/comp/library', 'sap/ui/core/date/UI5Date', 'sap/ui/comp/util/DateTimeUtil', 'sap/ui/comp/odata/ODataType', 'sap/ui/comp/util/FormatUtil', 'sap/ui/core/format/DateFormat', 'sap/ui/core/format/TimezoneUtil', "sap/base/Log"
], function(library, UI5Date, DateTimeUtil, ODataType, FormatUtil, DateFormat,TimezoneUtil, Log) {
	"use strict";

	// shortcut for sap.ui.comp.smartfilterbar.FilterType
	var FilterType = library.smartfilterbar.FilterType;

	// shortcut for sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
	var ValueHelpRangeOperation = library.valuehelpdialog.ValueHelpRangeOperation;

	// shortcut for sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX
	var ANALYTICAL_PARAMETER_PREFIX = library.ANALYTICAL_PARAMETER_PREFIX;

	/**
	 * Constructs a utility class to convert the FilterBar variant from/to internal to suite format
	 * @constructor
	 * @public
	 * @author SAP
	 */
	var VariantConverterTo = function() {
	};

	/**
	 * the current variant will be transformed to suite format
	 * @public
	 * @param {string} sKey of the current variant
	 * @param {array} aFilters containing filter names
	 * @param {string} sData json string representing the filter values
	 * @param {object} oFilterBar instance of the FilterBar object
	 * @param {string} sVersion determining the API version number
	 * @param {string} sParameterContextUrl defines the context url for the parameters
	 * @param {string} sFilterContextUrl defines the context url for the filters
	 * @returns {string} variant in the suite format as json string
	 */
	VariantConverterTo.prototype.convert = function(sKey, aFilters, sData, oFilterBar, sVersion, sParameterContextUrl, sFilterContextUrl) {

		var aFields, i, oJson, oJsonCustom, n = null, sBasicSearchName, sBasicSearchValue;

		var oSuiteContent = {
			SelectionVariantID: sKey
		};

		if (sParameterContextUrl) {
			oSuiteContent.ParameterContextUrl = sParameterContextUrl;
		}
		if (sFilterContextUrl) {
			oSuiteContent.FilterContextUrl = sFilterContextUrl;
		}

		this._sAPILevel = sVersion;

		if (sData && aFilters) {
			oJson = JSON.parse(sData);
			if (oJson) {
				aFields = this._getFields(aFilters);
				if (aFields && aFields.length > 0) {
					for (i = 0; i < aFields.length; i++) {
						this._convertField(oSuiteContent, aFields[i], oJson, oFilterBar);
					}
				}

				// CUSTOM FIELDS
				if (oJson._CUSTOM) {

					if (typeof oJson._CUSTOM === "string") {
						oJsonCustom = JSON.parse(oJson._CUSTOM);
					} else {
						oJsonCustom = oJson._CUSTOM;
					}

					for (n in oJsonCustom) {
						if (n) {
							if (Array.isArray(oJsonCustom[n]) && oJsonCustom[n].length > 1) {
								this._addArrayOfSingleValues(oSuiteContent, n, oJsonCustom[n]);
							} else {
								this._addSingleValue(oSuiteContent, n, VariantConverterTo._getValue(oJsonCustom[n], true));
							}
						}
					}
				}

				if (oFilterBar && oFilterBar.getBasicSearchName) {
					sBasicSearchName = oFilterBar.getBasicSearchName();
					if (sBasicSearchName) {
						sBasicSearchValue = oFilterBar.getBasicSearchValue();
						this._addSingleValue(oSuiteContent, sBasicSearchName, VariantConverterTo._getValue(sBasicSearchValue, true));
					}
				}
			}
		}

		return JSON.stringify(oSuiteContent);
	};

	/**
	 * retrieve the meta data for a given filter
	 * @private
	 * @param {string} sName of the filter
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar instance of the filter bar control
	 * @returns {object} meta data of the filter; null otherwise
	 */
	VariantConverterTo.prototype._getParameterMetaData = function(sName, oFilterBar) {
		var i, j, oGroup;

		var aFilterMetaData = oFilterBar.getFilterBarViewMetadata();
		if (aFilterMetaData) {
			for (i = 0; i < aFilterMetaData.length; i++) {
				oGroup = aFilterMetaData[i];
				for (j = 0; j < oGroup.fields.length; j++) {
					if (sName === oGroup.fields[j].fieldName) {
						return oGroup.fields[j];
					}
				}
			}
		}

		if (oFilterBar.getAnalyticalParameters) {
			var aAnaParameterMetaData = oFilterBar.getAnalyticalParameters();
			if (aAnaParameterMetaData) {
				for (j = 0; j < aAnaParameterMetaData.length; j++) {

					if (sName === aAnaParameterMetaData[j].fieldName) {
						return aAnaParameterMetaData[j];
					}
				}
			}
		}

		return null;
	};

	/**
	 * retrieve the array of relevant filters
	 * @private
	 * @param {object} oSuiteContent represents the suite format of the variant; will be changed
	 * @param {string} sFilterName name of the filter
	 * @param {object} oContent json representing the values of the variant
	 * @param {object} oFilterBar representing the FilterBar instance
	 */
	VariantConverterTo.prototype._convertField = function(oSuiteContent, sFilterName, oContent, oFilterBar) {
		var oObj, sValue, sOp = null, oRanges, oFilterMetaData, aValue, oValue;

		if (oContent && sFilterName && oSuiteContent) {
			oObj = oContent[sFilterName];
			if (oObj || oObj === 0) {

				oFilterMetaData = this._getParameterMetaData(sFilterName, oFilterBar);
				if (oFilterMetaData) {
					if (oFilterMetaData.isCustomFilterField) {
						return; // custom fields will be handled separately
					}
					var bSingleDateRangeSelection = (oFilterBar.getUseDateRangeType() &&
							((oFilterMetaData.type === "Edm.DateTime" && oFilterMetaData.displayFormat === "Date") ||
								(oFilterMetaData.type === "Edm.String" && oFilterMetaData.isCalendarDate))) ||
						oContent[sFilterName] && oContent[sFilterName].conditionTypeInfo && oContent[sFilterName].conditionTypeInfo.name
						&& oContent[sFilterName].conditionTypeInfo.name === "sap.ui.comp.config.condition.DateRangeType";

					if (oFilterMetaData.filterRestriction === FilterType.single && (!bSingleDateRangeSelection || oFilterMetaData.isParameter)) {
						sValue = (oObj.value === undefined) ? oObj : oObj.value;

						sValue = VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, sValue, true);
						this._addSingleValue(oSuiteContent, sFilterName, sValue);

						// save the semantic data when Parameter is Dynamic Date Range
						if (bSingleDateRangeSelection && oFilterMetaData.isParameter) {
							if (oContent && sFilterName && oSuiteContent && oContent[sFilterName] && oContent[sFilterName].conditionTypeInfo) {
								var oObj = oContent[sFilterName];
								if (oObj.ranges && oObj.ranges.length > 0) {
										oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);
										VariantConverterTo.addRanges(oRanges, oObj.ranges, oFilterBar, oFilterMetaData);
									}
								}
							}
					} else if (oFilterMetaData.filterRestriction === FilterType.interval) {
						if (oObj.conditionTypeInfo) {
							this._convertFieldByValue(oSuiteContent, sFilterName, oContent, oFilterBar, oFilterMetaData);
						} else {
							oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);

							if ((oFilterMetaData.type === "Edm.DateTime") && !oObj.high) {
								oObj.high = oObj.low;
							} else if ((oFilterMetaData.type === "Edm.String") && !oObj.high) {
								sOp = "EQ";
							}

							if (oFilterMetaData.type === "Edm.Time") {
								this._addRangeMultipleRangeValues(oFilterBar, oFilterMetaData, oRanges, oObj.ranges, true);
							} else if (oFilterMetaData.type === "Edm.DateTimeOffset" && !oObj.high) {

								sOp = "BT";
								aValue = FormatUtil.parseDateTimeOffsetInterval(oObj.low);
								if (aValue && (aValue.length === 2) && aValue[0]) {

									aValue[0] = oFilterMetaData.ui5Type.parseValue(aValue[0], "string");
									if (aValue.length === 2) {
										aValue[1] = oFilterMetaData.ui5Type.parseValue(aValue[1], "string");
									}

									oValue = {
										low: aValue[0],
										high: aValue[1]
									};

									this._addRangeLowHigh(oFilterBar, oFilterMetaData, oRanges, oValue, sOp);
								} else {
									sOp = "EQ";
									oValue = {
										low: oObj.low,
										high: null
									};
									if (aValue[0].indexOf('Z') < 0) {
										oValue.low = oFilterMetaData.ui5Type.parseValue(aValue[0], "string");
									}
									this._addRangeLowHigh(oFilterBar, oFilterMetaData, oRanges, oValue, sOp);
								}
							} else if (ODataType.isNumeric(oFilterMetaData.type) && !oObj.high) {
								aValue = FormatUtil.parseFilterNumericIntervalData(oObj.low);
								if (aValue && (aValue.length === 2) && aValue[0]) {
									this._addRangeLowHigh(oFilterBar, oFilterMetaData, oRanges, {
										low: aValue[0],
										high: aValue[1]
									}, "BT");
								} else {
									this._addRangeLowHigh(oFilterBar, oFilterMetaData, oRanges, oObj, "EQ");
								}
							} else {
								this._addRangeLowHigh(oFilterBar, oFilterMetaData, oRanges, oObj, sOp);
							}
						}
					} else if (oFilterMetaData.filterRestriction === FilterType.multiple) {
						oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);
						if (oObj.items && oObj.items.length > 0) {
							this._addRangeMultipleSingleValues(oFilterBar, oFilterMetaData, oRanges, oObj.items);
						} else if (oObj.ranges && oObj.ranges.length > 0) {
							this._addRangeMultipleRangeValues(oFilterBar, oFilterMetaData, oRanges, oObj.ranges, oObj.conditionTypeInfo ? true : false);
						} else {
							this._addRangeSingleValue(oRanges, oObj.value);
						}
					} else {
						this._convertFieldByValue(oSuiteContent, sFilterName, oContent, oFilterBar, oFilterMetaData);
					}
				} else {
					this._convertFieldByValue(oSuiteContent, sFilterName, oContent, oFilterBar, oFilterMetaData);
				}

			}
		}
	};

	VariantConverterTo.prototype._convertFieldByValue = function(oSuiteContent, sFilterName, oContent, oFilterBar, oFilterMetaData) {
		var oObj;
		var oRanges;

		if (oContent && sFilterName && oSuiteContent) {
			oObj = oContent[sFilterName];
			if (oObj) {
				if (oObj.conditionTypeInfo) {
					if (oObj.ranges && oObj.ranges.length > 0) {
						oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);
						VariantConverterTo.addRanges(oRanges, oObj.ranges, oFilterBar, oFilterMetaData);
					}
				} else if ((oObj.ranges !== undefined) && (oObj.items !== undefined) && (oObj.value !== undefined)) {

					oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);

					if (oObj.ranges && oObj.ranges.length > 0) {
						VariantConverterTo.addRanges(oRanges, oObj.ranges, oFilterBar, oFilterMetaData);
					}
					if (oObj.items && oObj.items.length > 0) {
						this._addRangeMultipleSingleValues(oFilterBar, oFilterMetaData, oRanges, oObj.items);
					}
					if (oObj.value) { // date
						this._addRangeSingleValue(oRanges, VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, oObj.value));
					}

				} else if ((oObj.items !== undefined) && oObj.items && (oObj.items.length > 0)) {
					oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);
					this._addRangeMultipleSingleValues(oFilterBar, oFilterMetaData, oRanges, oObj.items);
				} else if ((oObj.low !== undefined) && oObj.low && (oObj.high !== undefined) && oObj.high) { // date
					oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);
					this._addRangeLowHigh(oFilterBar, oFilterMetaData, oRanges, oObj);
				} else if ((oObj.value !== undefined) && oObj.value) {
					this._addSingleValue(oSuiteContent, sFilterName, oObj.value);
				} else if (oObj) {
					this._addSingleValue(oSuiteContent, sFilterName, oObj);
				}
			}
		}
	};

	/**
	 * create a suite 'Ranges' object
	 * @protected
	 * @param {object} oSuiteContent represents the suite format of the variant; will be changed
	 * @param {string} sFilterName name of the filter
	 * @returns {object} representing the suite ranges segment
	 */
	VariantConverterTo.addRangeEntry = function(oSuiteContent, sFilterName) {
		var oObj = {
			PropertyName: sFilterName,
			Ranges: []
		};
		if (!oSuiteContent.SelectOptions) {
			oSuiteContent.SelectOptions = [];
		}
		oSuiteContent.SelectOptions.push(oObj);

		return oObj.Ranges;
	};

	/**
	 * Convert UI5 to suite ranges. P13nCond. Domain 'DDOPTION' Description
	 * --------------------------------------------------------------------------------- I EQ -> I EQ Equals I BT -> I BT Between ... and ... I
	 * Contains -> I CP Contains the template I StartsWith -> I CP I EndsWith -> I CP I LE -> I LE Less than or equal to I GE -> I GE Greater than or
	 * equal to I GT -> I GT Greater than I LT -> I LT Less than E EQ -> E EQ NE Not equal to NB Not between ... and ... NP Does not contain the
	 * template
	 * @protected
	 * @param {array} aOutputRanges represents the suite ranges format of the variant; will be changed
	 * @param {array} aRanges containing the ranges
	 */
	VariantConverterTo.addRanges = function(aOutputRanges, aRanges, oFilterBar, oFilterMetadata) {

		var sSign, sOption, sLow, sHigh;

		for (var i = 0; i < aRanges.length; i++) {
			sSign = aRanges[i].exclude ? "E" : "I";
			sLow = VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetadata, aRanges[i].value1, true);
			sHigh = null;
			if (aRanges[i].operation === ValueHelpRangeOperation.BT) {
				sHigh = VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetadata, aRanges[i].value2);
			}

			sLow = VariantConverterTo._prepareLowValue(aRanges[i].operation, sLow);
			sOption = VariantConverterTo._prepareOptionValue(aRanges[i].operation, sLow);

			if (sOption) {
				aOutputRanges.push({
					Sign: sSign,
					Option: sOption,
					Low: sLow,
					High: sHigh
				});
			}
		}
	};

	VariantConverterTo.addP13nRanges = function(aOutputRanges, aRanges, sFieldType, bUTC, bIsFiscalDate) {
		var sSign, sOption, sLow, sHigh;

		for (var i = 0; i < aRanges.length; i++) {
			sSign = aRanges[i].exclude ? "E" : "I";
			sLow = "" + aRanges[i].value1;
			sHigh = null;
			if (aRanges[i].operation === ValueHelpRangeOperation.BT) {
				sHigh = "" + aRanges[i].value2;
			}

			if (["date", "datetime", "time"].includes(sFieldType)) {
				sLow = VariantConverterTo._processP13NDateValue(aRanges[i].value1, sFieldType, bUTC, bIsFiscalDate);
				sHigh = VariantConverterTo._processP13NDateValue(aRanges[i].value2, sFieldType, bUTC, bIsFiscalDate);
			}

			sLow = VariantConverterTo._prepareLowValue(aRanges[i].operation, sLow);
			sOption = VariantConverterTo._prepareOptionValue(aRanges[i].operation, sLow);

			aOutputRanges.push({
				Sign: sSign,
				Option: sOption,
				Low: sLow,
				High: sHigh
			});
		}
	};

	VariantConverterTo._processP13NDateValue = function (vValue, sFieldType, bUTC, bIsFiscalDate) {
		if (!vValue || bIsFiscalDate) {
			return vValue;
		}

		if (typeof vValue === "string") {
			vValue = UI5Date.getInstance(vValue);
		}

		if (bUTC && (sFieldType === "date" || sFieldType === "time")) {
			vValue = DateTimeUtil.localToUtc(vValue);
		}

		if (sFieldType === "datetime") {
			return vValue.toISOString();
		}

		return vValue.toISOString().slice(0, -1);
	};

	VariantConverterTo._prepareLowValue = function (sOperation, sLow) {
		switch (sOperation) {
			case ValueHelpRangeOperation.Contains:
				if (sLow) {
					sLow = "*" + sLow + "*";
				}
				break;
			case ValueHelpRangeOperation.StartsWith:
				if (sLow) {
					sLow = sLow + "*";
				}
				break;
			case ValueHelpRangeOperation.EndsWith:
				if (sLow) {
					sLow = "*" + sLow;
				}
				break;
			case ValueHelpRangeOperation.Empty:
				sLow = "";
				break;
			case ValueHelpRangeOperation.EQ:
			case ValueHelpRangeOperation.BT:
			case ValueHelpRangeOperation.LE:
			case ValueHelpRangeOperation.GE:
			case ValueHelpRangeOperation.GT:
			case ValueHelpRangeOperation.LT:
				break;
			default:
				Log.error("ValueHelpRangeOperation is not supported '" + sOperation + "'");
				return;
		}

		return sLow;
	};

	VariantConverterTo._prepareOptionValue = function (sOperation, sLow) {
		var sOption;
		switch (sOperation) {
			case ValueHelpRangeOperation.Contains:
			case ValueHelpRangeOperation.StartsWith:
			case ValueHelpRangeOperation.EndsWith:
				sOption = "CP";
				break;
			case ValueHelpRangeOperation.Empty:
				sOption = "EQ";
				break;
			case ValueHelpRangeOperation.EQ:
			case ValueHelpRangeOperation.BT:
			case ValueHelpRangeOperation.LE:
			case ValueHelpRangeOperation.GE:
			case ValueHelpRangeOperation.GT:
			case ValueHelpRangeOperation.LT:
				sOption = sOperation;
				break;
			default:
				Log.error("ValueHelpRangeOperation is not supported '" + sOperation + "'");
				return;
		}

		return sOption;
	};

	/**
	 * convert UI5 to suite multiple single values
	 * @private
	 * @param oFilterBar
	 * @param oFilterMetaData
	 * @param {object} oRanges represents the suite ranges format of the variant; will be changed
	 * @param {array} aItems containing the ranges
	 */
	VariantConverterTo.prototype._addRangeMultipleSingleValues = function(oFilterBar, oFilterMetaData, oRanges, aItems) {

		for (var i = 0; i < aItems.length; i++) {
			oRanges.push({
				Sign: "I",
				Option: "EQ",
				Low: VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, aItems[i].key, true),
				High: null
			});
		}
	};

	VariantConverterTo.prototype._addRangeMultipleRangeValues = function(oFilterBar, oFilterMetaData, oRanges, aItems, bTimeInterval) {

		for (var i = 0; i < aItems.length; i++) {
			oRanges.push({
				Sign: aItems[i].exclude ? "E" : "I",
				Option: bTimeInterval ? "BT" : "EQ",
				Low: VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, aItems[i].value1, true),
				High: bTimeInterval ? VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, aItems[i].value2) : null
			});
		}
	};

	/**
	 * convert UI5 to suite between e.q. Date
	 * @private
	 * @param {object} oRanges represents the suite ranges format of the variant; will be changed
	 * @param {string} sValue of the filter
	 */
	VariantConverterTo.prototype._addRangeSingleValue = function(oRanges, sValue) {

		oRanges.push({
			Sign: "I",
			Option: "EQ",
			Low: VariantConverterTo._getValue(sValue, true),
			High: null
		});
	};

	/**
	 * convert UI5 to suite between e.q. Date
	 * @private
	 * @param oFilterBar
	 * @param oFilterMetaData
	 * @param {object} oRanges represents the suite ranges format of the variant; will be changed
	 * @param {object} oLowHigh containing the ranges
	 * @param {string} sOp override the default operation
	 */
	VariantConverterTo.prototype._addRangeLowHigh = function(oFilterBar, oFilterMetaData, oRanges, oLowHigh, sOp) {
		var sOperation = sOp || "BT";

		oRanges.push({
			Sign: "I",
			Option: sOperation,
			Low: VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, oLowHigh.low, true),
			High: VariantConverterTo._getValueWithMetadata(oFilterBar, oFilterMetaData, oLowHigh.high)
		});
	};

	/**
	 * convert UI5 to suite between e.q. Date
	 * @private
	 * @param {object} oSuiteContent represents the suite format of the variant; will be changed
	 * @param {string} sFilterName name of the filter
	 * @param {string} sValue of the filter
	 */
	VariantConverterTo.prototype._addParamaterSingleValue = function(oSuiteContent, sFilterName, sValue) {

		if (!oSuiteContent.Parameters) {
			oSuiteContent.Parameters = [];
		}

		oSuiteContent.Parameters.push({
			PropertyName: sFilterName,
			PropertyValue: sValue
		});
	};

	VariantConverterTo.prototype._createRangeSingleValue = function(oSuiteContent, sFilterName, sValue) {
		var oRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);
		this._addRangeSingleValue(oRanges, sValue);
	};

	VariantConverterTo.prototype._addSingleValue = function(oSuiteContent, sFilterName, sValue) {

		var aName;

		if (this._sAPILevel) {
			aName = sFilterName.split(ANALYTICAL_PARAMETER_PREFIX);
			if (aName.length > 1) {
				this._addParamaterSingleValue(oSuiteContent, aName[aName.length - 1], sValue);
			} else {
				this._createRangeSingleValue(oSuiteContent, sFilterName, sValue);
			}

		} else {
			this._addParamaterSingleValue(oSuiteContent, sFilterName, sValue);

		}
	};

	VariantConverterTo.prototype._addArrayOfSingleValues = function (oSuiteContent, sFilterName, aValues) {
		var aRanges = VariantConverterTo.addRangeEntry(oSuiteContent, sFilterName);

		aValues.forEach(function (sValue) {
			aRanges.push({
				Sign: "I",
				Option: "EQ",
				Low: VariantConverterTo._getValue(sValue, true),
				High: null
			});
		});
	};

	/**
	 * retrieve the array of relevant filters
	 * @private
	 * @param {array} aFilters representing the filter items
	 * @returns {array} of strings; array of filter names
	 */
	VariantConverterTo.prototype._getFields = function(aFilters) {

		var aRelevantFilters = [];

		if (aFilters) {
			for (var i = 0; i < aFilters.length; i++) {
				aRelevantFilters.push(aFilters[i].name);
			}
		}

		return aRelevantFilters;
	};

	/**
	 * returns either the value
	 * @private
	 * @param {object} oValue object
	 * @param {boolean} bUseEmptyString indicates if a default value should be null or empty string
	 * @returns {object} stringified value
	 */
	VariantConverterTo._getValue = function(oValue, bUseEmptyString) {
		if ((oValue === null) || (oValue === undefined) || (oValue === "")) {
			return (bUseEmptyString ? "" : null);
		}

		return "" + oValue;
	};

	VariantConverterTo._getValueWithMetadata = function(oFilterBar, oFilterMetadata, oValue, bUseEmptyString) {
		if ((oValue === null) || (oValue === undefined) || (oValue === "")) {
			return (bUseEmptyString ? "" : null);
		} else if (oFilterBar && oFilterMetadata) {
			if ((oFilterMetadata.type === "Edm.DateTime") || (oFilterMetadata.type === "Edm.Time")) {
				if (oFilterMetadata.isParameter && oValue.oData){
					oValue = oValue.oData;
				}

				if (oFilterMetadata.isParameter && !oValue.oData && oValue.ranges && oValue.ranges[0] && oValue.ranges[0].value1){
					oValue = oValue.ranges[0].value1;
				}

				if (oFilterBar && oFilterBar.isInUTCMode && oFilterBar.isInUTCMode()) {
					oValue = DateTimeUtil.localToUtc(UI5Date.getInstance(oValue)).toJSON();
				}

				if (oValue.indexOf('Z') === (oValue.length - 1)) {
					oValue = oValue.substr(0, oValue.length - 1);
				}
			} else if (oFilterMetadata.type === "Edm.DateTimeOffset") {
				var sTimeZone = oFilterBar && oFilterBar._oFilterProvider && oFilterBar._oFilterProvider._getFilterTimeZone(oFilterMetadata.name);
				if (sTimeZone) {
					oValue = DateTimeUtil.toTimezone(oValue, sTimeZone).toJSON();
				} else {
					oValue = UI5Date.getInstance(oValue).toJSON();
				}
			}
		}

		return "" + oValue;
	};

	return VariantConverterTo;

}, /* bExport= */true);
