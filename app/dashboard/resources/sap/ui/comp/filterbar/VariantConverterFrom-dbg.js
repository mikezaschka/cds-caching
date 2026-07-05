/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'sap/ui/comp/library', 'sap/ui/core/date/UI5Date', 'sap/ui/comp/util/DateTimeUtil', 'sap/m/DatePicker', 'sap/m/DateRangeSelection', "sap/base/Log", "sap/ui/core/format/DateFormat"
], function(library, UI5Date, DateTimeUtil, DatePicker, DateRangeSelection, Log, DateFormat) {
	"use strict";

	// shortcut for sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX
	var ANALYTICAL_PARAMETER_PREFIX = library.ANALYTICAL_PARAMETER_PREFIX;

	// var shortcut for sap.ui.comp.smartfilterbar.FilterType
	var FilterType = library.smartfilterbar.FilterType;

	// shortcut for sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
	var ValueHelpRangeOperation = library.valuehelpdialog.ValueHelpRangeOperation;

	/**
	 * Constructs a utility class to convert the FilterBar variant from/to internal to suite format
	 * @constructor
	 * @public
	 * @author SAP
	 */
	var VariantConverterFrom = function() {
	};

	/**
	 * the variant in suite format will be transformed to the internal format
	 * @public
	 * @param {string} sSuiteContent object representing the variant data
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar instance of the filter bar control
	 * @param {boolean} [bStrictMode=true] determines if a passed filter name is checked by exact match,<br>
	 *        or verified against the analytical parameters by adding the prefix 'P_' to its name.
	 * @returns {object} variant in the internal format
	 */
	VariantConverterFrom.prototype.convert = function(sSuiteContent, oFilterBar, bStrictMode) {
		var oContent = null, oRetContent = null, oSuiteContent;

		if (sSuiteContent) {

			this._bStrictMode = bStrictMode;

			oSuiteContent = JSON.parse(sSuiteContent);

			if (oFilterBar && oFilterBar.getFilterBarViewMetadata && oSuiteContent) {

				this._sBasicSearchName = null;
				this._sBasicSearchValue = null;

				if (oFilterBar.getBasicSearchName) {
					this._sBasicSearchName = oFilterBar.getBasicSearchName();
				}

				oContent = {};
				if (oSuiteContent.Parameters) {
					this._addParameters(oSuiteContent.Parameters, oFilterBar, oContent);
				}

				if (oSuiteContent.SelectOptions) {
					this._addSelectOptions(oSuiteContent.SelectOptions, oFilterBar, oContent);
				}

				oRetContent = {
					payload: null,
					variantId: null
				};
				oRetContent.payload = JSON.stringify(oContent);

				if (oSuiteContent.SelectionVariantID) {
					oRetContent.variantId = oSuiteContent.SelectionVariantID;
				}

				if (this._sBasicSearchValue) {
					oRetContent.basicSearch = this._sBasicSearchValue;
				}

			}
		}

		return oRetContent;
	};

	VariantConverterFrom.prototype.retrieveVariantId = function(sSuiteContent) {
		var sVariantId = null;
		var oSuiteContent;

		if (sSuiteContent) {

			oSuiteContent = JSON.parse(sSuiteContent);

			if (oSuiteContent && oSuiteContent.SelectionVariantID) {
				sVariantId = oSuiteContent.SelectionVariantID;
			}
		}

		return sVariantId;
	};

	/**
	 * Retrieve the meta data for a given filter name. If the non-strict mode is set, we check first if the name identifies an analytical parameter.
	 * 1. check with complete name; 2. with $Parameter.P_ name. In strict mode only $Parameter. may be omit.
	 * @private
	 * @param {string} sName of the filter
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar instance of the filter bar control
	 * @param {boolean} bIsParameter defines if the current name is from the parameters or selectoption section.
	 * @returns {object} meta data of the filter; null otherwise
	 */
	VariantConverterFrom.prototype._getParameterMetaData = function(sName, oFilterBar, bIsParameter) {

		if (this._bStrictMode) {
			return this._getParameterMetaDataStrictMode(sName, oFilterBar);
		}

		return this._getParameterMetaDataNonStrictMode(sName, oFilterBar, bIsParameter);
	};

	VariantConverterFrom.prototype._getFilter = function(sName, oFilterBar) {
		var i, j, oGroup, aFilterMetaData;

		aFilterMetaData = oFilterBar.getFilterBarViewMetadata();
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

		return null;
	};

	VariantConverterFrom.prototype._getParameter = function(sName, oFilterBar) {
		var j, aAnaParameterMetaData;

		if (oFilterBar.getAnalyticalParameters) {
			aAnaParameterMetaData = oFilterBar.getAnalyticalParameters();
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

	VariantConverterFrom.prototype._getParameterWithInnerPrefix = function(sName, oFilterBar) {
		var sParamName = sName;
		if (sName.indexOf(ANALYTICAL_PARAMETER_PREFIX) !== 0) {
			sParamName = ANALYTICAL_PARAMETER_PREFIX + sName;
		}
		return this._getParameter(sParamName, oFilterBar);
	};

	VariantConverterFrom.prototype._getParameterMetaDataStrictMode = function(sName, oFilterBar) {

		var oMetadata = this._getExactFilterParameterMatch(sName, oFilterBar);
		if (oMetadata) {
			return oMetadata;
		}

		return null;
	};

	VariantConverterFrom.prototype._getParameterMetaDataNonStrictMode = function(sOrigName, oFilterBar, bIsParameter) {
		var oMetadata, sNameWithPrefix, sNameWithoutPrefix, sTryName, sName = sOrigName, bHasAnalyticalPrefix = false,
			_bIsFilterParameter = function() {
			return (bHasAnalyticalPrefix && sName === sTryName) || (!bHasAnalyticalPrefix && sName !== sTryName);
		};

		if (sOrigName.indexOf(ANALYTICAL_PARAMETER_PREFIX) === 0) {
			sName = sOrigName.substr(ANALYTICAL_PARAMETER_PREFIX.length); // remove $Parameter. prefix
			bHasAnalyticalPrefix = true;
		}

		if (sName.indexOf("P_") === 0) {
			sNameWithPrefix = sName;
			sNameWithoutPrefix = sName.substr(2); // remove P_ prefix
		} else {
			sNameWithPrefix = "P_" + sName;
			sNameWithoutPrefix = sName;
		}

		if (sName !== sNameWithPrefix) {
			sTryName = sNameWithPrefix;
		} else if (sName !== sNameWithoutPrefix) {
			sTryName = sNameWithoutPrefix;
		}

		oMetadata = this._getExactParameterMatch(sName, oFilterBar);
		if (oMetadata) {
			return oMetadata;
		}

		oMetadata = this._getExactParameterMatch(sTryName, oFilterBar);
		if (oMetadata) {
			return oMetadata;
		}

		if (_bIsFilterParameter()) {
			oMetadata = this._getFilter(sNameWithoutPrefix, oFilterBar);
			if (oMetadata) {
				return oMetadata;
			}
		}

		return null;
	};

	VariantConverterFrom.prototype._getExactParameterMatch = function(sName, oFilterBar) {
		var oParameter;

		oParameter = this._getParameterWithInnerPrefix(sName, oFilterBar);
		if (oParameter) {
			return oParameter;
		}

		return null;
	};

	VariantConverterFrom.prototype._getExactFilterParameterMatch = function(sName, oFilterBar) {
		var oFilter, oParameter;

		oFilter = this._getFilter(sName, oFilterBar);
		if (oFilter) {
			return oFilter;
		}

		oParameter = this._getParameterWithInnerPrefix(sName, oFilterBar);
		if (oParameter) {
			return oParameter;
		}

		return null;
	};

	/**
	 * convert a simple parameter
	 * @private
	 * @param {object} oSuiteParameters object representing the suite single value parameters
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar instance of the filter bar control
	 * @param {object} oContent representing the resulting internal format
	 */
	VariantConverterFrom.prototype._addParameters = function(oSuiteParameters, oFilterBar, oContent) {
		var i;
		var sName, sValue;
		var oFilterMetaData;

		for (i = 0; i < oSuiteParameters.length; i++) {
			sValue = oSuiteParameters[i].PropertyValue;
			sName = oSuiteParameters[i].PropertyName;

			if (this._sBasicSearchName && (sName === this._sBasicSearchName)) {
				this._sBasicSearchValue = sValue;
				continue;
			}

			oFilterMetaData = this._getParameterMetaData(sName, oFilterBar, true);
			if (oFilterMetaData) {

				oFilterBar.determineControlByName(sName);
				this._addAccordingMetaData(oContent, oFilterBar, oFilterMetaData, sValue);

			} else {
				Log.error("neither metadata nor custom information for filter '" + sName + "'");
			}
		}
	};

	/**
	 * convert a simple parameter
	 * @private
	 * @param {object} oSuiteSelectOptions object representing the suite SelectOptions entity
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar instance of the filter bar control
	 * @param {object} oContent representing the resulting internal format
	 */
	VariantConverterFrom.prototype._addSelectOptions = function(oSuiteSelectOptions, oFilterBar, oContent) {
		var i;
		var sName, aRanges;
		var oFilterMetaData, oControl;
		// var oConditionTypeInfo;

		for (i = 0; i < oSuiteSelectOptions.length; i++) {
			sName = oSuiteSelectOptions[i].PropertyName;
			aRanges = oSuiteSelectOptions[i].Ranges;

			if (this._sBasicSearchName && (sName === this._sBasicSearchName)) {
				if (aRanges && aRanges.length > 0) {
					this._sBasicSearchValue = aRanges[0].Low;
				}
				continue;
			}

			oFilterBar.determineControlByName(sName);

			// oConditionTypeInfo = oSuiteSelectOptions[i]["__ConditionTypeInfo"];
			oFilterMetaData = this._getParameterMetaData(sName, oFilterBar, false);
			if (oFilterMetaData) {
				oControl = oFilterMetaData.control;
				this._addRangesAccordingMetaData(oContent, oFilterBar, oFilterMetaData, aRanges, oControl);
				// if (oConditionTypeInfo) {
				// this._addConditionTypeInfo(oContent, oFilterMetaData, oConditionTypeInfo);
				// }

			} else {
				Log.error("neither metadata nor custom information for filter '" + sName + "'");
			}
		}
	};

	/**
	 * Convert suite ranges to UI5. Domain 'DDOPTION' P13nCond. Description
	 * --------------------------------------------------------------------------------- I EQ -> I EQ Equals I BT -> I BT Between ... and ... I LE ->
	 * I LE Less than or equal to I GE -> I GE Greater than or equal to I GT -> I GT Greater than I LT -> I LT Less than I CP -> I Contains or
	 * Contains the template StartsWith or EndsWith I NE -> not supported Not equal to I NB -> not supported Not between ... and ... I NP -> not
	 * supported Does not contain the template E EQ -> E EQ E BT -> not supported E ... -> not supported
	 * @protected
	 * @param {string} sSuiteOption Suite option
	 * @param {string} sValue Suite value
	 * @returns {object} Format: {op: string, v: string}
	 */
	VariantConverterFrom.convertOption = function(sSuiteOption, sValue, oMetadata) {
		var sInternalOperation;
		switch (sSuiteOption) {
			case "CP":
				sInternalOperation = ValueHelpRangeOperation.Contains;
				if (sValue) {
					var nIndexOf = sValue.indexOf('*');
					var nLastIndex = sValue.lastIndexOf('*');

					// only when there are '*' at all
					if (nIndexOf > -1) {
						if ((nIndexOf === 0) && (nLastIndex !== (sValue.length - 1))) {
							sInternalOperation = ValueHelpRangeOperation.EndsWith;
							sValue = sValue.substring(1, sValue.length);
						} else if ((nIndexOf !== 0) && (nLastIndex === (sValue.length - 1))) {
							sInternalOperation = ValueHelpRangeOperation.StartsWith;
							sValue = sValue.substring(0, sValue.length - 1);
						} else {
							sValue = sValue.substring(1, sValue.length - 1);
						}
					}
				}
				break;
			case "EQ":
				 var oType = oMetadata?.type;

				 if (oType) {
					var bIsStringType = oType === "Edm.String" ? true : false;
				 }

				if ((!bIsStringType && sValue === "") || sValue === null ){
					sInternalOperation = ValueHelpRangeOperation.Empty;

					// For dates we have to ensure value1 is null - no check needed as it works for strings also
					sValue = null;
				} else {
					sInternalOperation = sSuiteOption;
				}
				break;
			case "BT":
			case "LE":
			case "GE":
			case "GT":
			case "LT":
				sInternalOperation = sSuiteOption;
				break;
			default:
				Log.error("Suite Option is not supported '" + sSuiteOption + "'");
				sInternalOperation = undefined;
				sValue = undefined;
		}

		return {
			op: sInternalOperation,
			v: sValue
		};
	};

	VariantConverterFrom.prototype._getYearMonthDatePattern = function(sDate){
		var aMatch = sDate.match(/^([0-9]{4})([0-9]{2})([0-9]{2})$/);

		if (aMatch) {
			return [aMatch[1], aMatch[2], aMatch[3]];
		}
	};

	VariantConverterFrom.prototype._getTimeZoneFormat = function(sMillis){
		return sMillis.split(/[\s+-]/)[0]; // Remove timezone
	};

	VariantConverterFrom.prototype._createDateObject = function(sDateString/* "2015-02-28T23:00:00.000" || "20160708" || "2015-02-28T23:00:00.000 01"*/) {
		var aDateString,
			sDateTimeString,
			sMillis,
			aPattern,
			aParts,
			oDate,
			aTP,
			aDP;

		if (!sDateString) {
			return;
		}

		aDateString = sDateString.split(".");
		sDateTimeString = aDateString[0];
		sMillis = aDateString[1];

		if (sMillis) {
			sMillis = this._getTimeZoneFormat(sMillis);
		}

		aParts = sDateTimeString.split("T");
		aDP = aParts[0].split("-");

		if (aDP.length === 1) {
			aPattern = this._getYearMonthDatePattern(aDP[0]);
			if (aPattern) {
				aDP = aPattern;
			}
		}

		if (aParts.length < 2) { // There are no Time parts if aParts length is less than 2
			oDate = UI5Date.getInstance(aDP[0], aDP[1] - 1, aDP[2]);
		} else {
			aTP = aParts[1].split(":");
			oDate = UI5Date.getInstance(aDP[0], aDP[1] - 1, aDP[2], aTP[0], aTP[1], aTP[2], sMillis ? sMillis : 0);
		}

		// BCP: 2080454042 Otherwise year one will be converted to 1901 - see Date.setYear documentation for more details
		oDate.setFullYear(aDP[0]);
		return oDate;
	};

	VariantConverterFrom.prototype._addRangesAccordingMetaData = function(oContent, oFilterBar, oFilterMetaData, aRanges, oControl, sName) {
		var i, oObj;

		var fgetDateFormatLogic = function (oFilterMetaData, oFilterBar, sValue, oValue) {
			if (oFilterBar && oFilterBar.isInUTCMode && sValue.indexOf("PT") === -1 && (oFilterMetaData.filterType === "date")) {
				if (oFilterBar.isInUTCMode()) {
					sValue = sValue.split('T')[0] + "T00:00:00";
				} else if (!oFilterBar.isInUTCMode() && (sValue.split("T").length === 1)) {
					sValue += "T00:00:00";
				}
			}

			if (sValue.indexOf('Z') !== (sValue.length - 1)) {
				if (oFilterBar && oFilterBar.isInUTCMode && !oFilterBar.isInUTCMode()) {
					oValue = DateTimeUtil.localToUtc(this._createDateObject(sValue)).toJSON();
				} else {
					oValue = this._createDateObject(sValue).toJSON();
				}
			} else {
				Log.error("Property '" + oFilterMetaData.fieldName + "' was added with zulu time zone information.");
			}
			return oValue;
		}.bind(this);

		var fgetTime = function(sValue) {
			var oFormat = DateFormat.getTimeInstance({
				pattern: "'PT'hh'H'mm'M'ss'S'"
			});

			return oFormat.parse(sValue);
		};

		var fgetValueTypeCompliant = function(sValue) {
			var oValue = sValue;
			if (sValue && oFilterMetaData) {

				if (oFilterMetaData.filterType === "numeric") {
					if ((oFilterMetaData.type === "Edm.Decimal") || (oFilterMetaData.type === "Edm.Float") || (oFilterMetaData.type === "Edm.Double") || (oFilterMetaData.type === "Edm.Single")) {
						oValue = parseFloat(sValue);
					} else {
						oValue = parseInt(sValue);
					}
				} else {

					switch (oFilterMetaData.type) {
						case "Edm.DateTime":
							oValue = fgetDateFormatLogic(oFilterMetaData, oFilterBar, sValue, oValue);
						break;
						case "Edm.Time":
							if (sValue.indexOf("PT") === 0) {
								oValue = fgetTime(sValue);
							} else {
								oValue = fgetDateFormatLogic(oFilterMetaData, oFilterBar, sValue, oValue);
							}
						break;
						case "Edm.String":
							if (oFilterMetaData.isCalendarDate && !oFilterMetaData.calendarType && !(oFilterMetaData.filterType === "stringdate" && oFilterMetaData.controlType === "date")){
								oValue = fgetDateFormatLogic(oFilterMetaData, oFilterBar, sValue, oValue);
							}
						break;
						case "Edm.DateTimeOffset":
							oValue = sValue;
						break;
						case "Edm.Date":
							var aSplitedDateAndTime = sValue.split('T'),
								sTime = aSplitedDateAndTime[1];
							if (sTime){
								sTime = this._getTimeZoneFormat(sTime);
							}
							oValue = (sTime) ? aSplitedDateAndTime[0] + "T" + sTime : sValue;
						break;
						default:
							oValue = sValue;
						break;
					}
				}
			}

			return oValue;
		};

		var fCreateRanges = function(sFilterName, aRanges) {

			var i, oItem, oObj;

			for (i = 0; i < aRanges.length; i++) {
				oObj = VariantConverterFrom.convertOption(aRanges[i].Option, aRanges[i].Low);

				if (oObj && oObj.op) {
					oItem = {
						"exclude": (aRanges[i].Sign === "E"),
						"operation": oObj.op,
						"keyField": sFilterName,
						"value1": fgetValueTypeCompliant(oObj.v),
						"value2": fgetValueTypeCompliant(aRanges[i].High)
					};

					if (!oContent[sFilterName]) {
						oContent[sFilterName] = {
							ranges: [],
							items: [],
							value: null
						};
					}

					oContent[sFilterName].ranges.push(oItem);
				}
			}
		};

		var fConsiderExclude = function(aRanges) {
			for (var i = 0; i < aRanges.length; i++) {
				if (aRanges[i].Sign === "E") {
					return true;
				}
			}

			return false;
		};

		if (aRanges && aRanges.length > 0) {

			// custom filters
			if (oFilterMetaData.isCustomFilterField) {
				if (!oContent._CUSTOM) {
					oContent._CUSTOM = {};
				}
				if (Array.isArray(aRanges) && aRanges.length > 1) {
					oContent._CUSTOM[oFilterMetaData.fieldName] = aRanges.map(function (oRange) {
						return oRange.Low;
					});
				} else {
					oContent._CUSTOM[oFilterMetaData.fieldName] = aRanges[0].Low;
				}
				return;
			}

			// conditiontype filters
			if (oFilterMetaData.conditionType) {
				for (i = 0; i < aRanges.length; i++) { // ensure the upper value is set
					if (!aRanges[i].High) {
						aRanges[i].High = aRanges[i].Low;
					}
				}
				fCreateRanges(oFilterMetaData.fieldName, aRanges);
				return;
			}

			// consider filter restrictions
			if (oFilterMetaData.filterRestriction === FilterType.single) {
				if (!aRanges[0].Low && oControl && (oControl instanceof DatePicker)) {
					oContent[oFilterMetaData.fieldName] = null;
				} else {
					oContent[oFilterMetaData.fieldName] = fgetValueTypeCompliant(aRanges[0].Low);
				}

			} else if (oFilterMetaData.filterRestriction === FilterType.interval) {

				/* eslint-disable no-lonely-if */
				if (oControl && (oControl instanceof DateRangeSelection)) {

					if (aRanges[0].Low && aRanges[0].High) {
						oContent[oFilterMetaData.fieldName] = {
							low: fgetValueTypeCompliant(aRanges[0].Low),
							high: fgetValueTypeCompliant(aRanges[0].High)
						};
					} else if (aRanges[0].Low && !aRanges[0].High) {
						oContent[oFilterMetaData.fieldName] = {
							low: fgetValueTypeCompliant(aRanges[0].Low),
							high: fgetValueTypeCompliant(aRanges[0].Low)
						};

					} else if (!aRanges[0].Low && aRanges[0].High) {
						oContent[oFilterMetaData.fieldName] = {
							low: fgetValueTypeCompliant(aRanges[0].High),
							high: fgetValueTypeCompliant(aRanges[0].High)
						};
					} else {
						oContent[oFilterMetaData.fieldName] = {
							low: null,
							high: null
						};
					}

				} else {

					if (oFilterMetaData.type === "Edm.Time") {
						fCreateRanges(oFilterMetaData.fieldName, aRanges);
					} else if (oFilterMetaData.type === "Edm.DateTimeOffset" && aRanges[0].Option === "EQ") {
						oContent[oFilterMetaData.fieldName] = {
							low: aRanges[0].Low === undefined ? null : fgetValueTypeCompliant(aRanges[0].Low),
							high: null
						};
					} else {
						oContent[oFilterMetaData.fieldName] = {
							low: aRanges[0].Low === undefined ? null : fgetValueTypeCompliant(aRanges[0].Low),
							high: aRanges[0].High === undefined ? null : fgetValueTypeCompliant(aRanges[0].High)
						};
					}
				}
				/* eslint-enable no-lonely-if */

			} else if (oFilterMetaData.filterRestriction === FilterType.multiple) {

				oContent[oFilterMetaData.fieldName] = {
					ranges: [],
					items: [],
					value: null
				};

				var bSpecialMetadataHandling = (oFilterMetaData.type === "Edm.DateTimeOffset") || oFilterMetaData.isCalendarDate || (oFilterMetaData.type === "Edm.DateTime") || (oFilterMetaData.type === "Edm.Time");
				var bConsiderExclude = oControl && oControl.isA('sap.m.MultiInput') && fConsiderExclude(aRanges);
				if (oControl && !bSpecialMetadataHandling && (oControl.isA('sap.m.MultiComboBox') || oControl.isA('sap.m.MultiInput')) && !bConsiderExclude) {
					var sValueTypeCompliant;
					for (i = 0; i < aRanges.length; i++) {
						sValueTypeCompliant = fgetValueTypeCompliant(aRanges[i].Low);
						// If the option is "EQ" and the Low is empty string, it will be treated like "Empty", which is not relevant to MultiComboBox and MultiInput
						// We need to make an exception and skip VariantConverterFrom.convertOption.
						if (aRanges[i].Option === "EQ" && sValueTypeCompliant === "") {
							oObj = {
								op: aRanges[i].Option,
								v: sValueTypeCompliant
							};
						} else {
							oObj = VariantConverterFrom.convertOption(aRanges[i].Option, sValueTypeCompliant);
						}

						if (oObj.op === ValueHelpRangeOperation.EQ) {
							oContent[oFilterMetaData.fieldName].items.push({
								key: fgetValueTypeCompliant(oObj.v)
							});
						}
					}
				} else {
					fCreateRanges(oFilterMetaData.fieldName, aRanges);
				}

			} else {

				fCreateRanges(oFilterMetaData.fieldName, aRanges);
			}

			Log.warning("potential reduced information for filter '" + oFilterMetaData.fieldName + "'");

		} else {
			Log.warning("no Ranges-section found for filter '" + oFilterMetaData.fieldName + "'");
		}
	};

	VariantConverterFrom.prototype._addAccordingMetaData = function(oContent, oFilterBar, oFilterMetaData, sValue) {

		var sHigh = oFilterMetaData.type === "Edm.DateTime" ? "" : sValue;

		var aRanges = [
			{
				Sign: "I",
				Low: sValue,
				High: sHigh,
				Option: "EQ"
			}
		];

		this._addRangesAccordingMetaData(oContent, oFilterBar, oFilterMetaData, aRanges);

	};

	// VariantConverterFrom.prototype._addConditionTypeInfo = function(oContent, oFilterMetaData, oInfo) {
	// return;
	// oContent[oFilterMetaData.fieldName].conditionTypeInfo = {
	// data : oInfo.Data,
	// name: oInfo.Name,
	// }
	// };

	return VariantConverterFrom;

}, /* bExport= */true);
