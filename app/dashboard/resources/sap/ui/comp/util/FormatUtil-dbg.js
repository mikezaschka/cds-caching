/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// --------------------------------------------------------------------------------
// Utility class used by smart controls for formatting related operations
// --------------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/core/format/NumberFormat", "sap/ui/core/format/DateFormat", "sap/m/P13nConditionPanel", "sap/ui/comp/odata/ODataType", "sap/ui/model/odata/type/Currency", "sap/ui/model/odata/type/Unit", "sap/base/strings/whitespaceReplacer", "sap/ui/model/FilterOperator"
], function(NumberFormat, DateFormat, P13nConditionPanel, ODataType, Currency, Unit, fnWhitespaceReplacer, FilterOperator) {
	"use strict";

	/**
	 * Utility class used by smart controls for formatting related operations
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var FormatUtil = {

		/* Initialise static variables */
		CHAR_FIGURE_SPACE: '\u2007',
		CHAR_PUNCTUATION_SPACE: '\u2008',
		MAX_CURRENCY_DIGITS: 3,

		/**
		 * Static function that returns a formatted expression based on the displayBehaviour. Fallback is to return the Id (sId)
		 *
		 * @param {string} sDisplayBehaviour - the display behaviour (e.g. as defined in: sap.ui.comp.smartfilterbar.DisplayBehaviour)
		 * @param {string} sId - the Id field value
		 * @param {string} sDescription - the Description field value
		 * @returns {string} the formatted string value based on the displayBehaviour
		 * @private
		 */
		getFormattedExpressionFromDisplayBehaviour: function(sDisplayBehaviour, sId, sDescription) {
			return FormatUtil.getFormatterFunctionFromDisplayBehaviour(sDisplayBehaviour)(sId, sDescription);
		},

		/**
		 * Static function that returns a formatter function based on the displayBehaviour. The returned function always expects sId and sDescription
		 * as parameters.
		 *
		 * @param {string} sDisplayBehaviour - the display behaviour (e.g. as defined in: sap.ui.comp.smartfilterbar.DisplayBehaviour)
		 * @param {boolean} bReplaceWhitespace - defines whether to replace whitespaces with special characters
		 * @returns {function} a static formatter function based on the displayBehaviour
		 * @private
		 */
		getFormatterFunctionFromDisplayBehaviour: function(sDisplayBehaviour, bReplaceWhitespace, oOverrideNoData) {
			var sProcessMethod = bReplaceWhitespace ? "Whitespace" : "";
			var sOverrideNoData = oOverrideNoData ? "OverrideNoData" : "";

			if (sOverrideNoData) {
				switch (sDisplayBehaviour) {
					case "descriptionAndId":
						return FormatUtil["_get" + sOverrideNoData + "TextFormatterForDescriptionAndId"].bind(oOverrideNoData);
					case "idAndDescription":
						return FormatUtil["_get" + sOverrideNoData + "TextFormatterForIdAndDescription"].bind(oOverrideNoData);
					case "descriptionOnly":
						return FormatUtil["_get" + sOverrideNoData + "TextFormatterForDescriptionOnly"].bind(oOverrideNoData);
						// idOnly and fallback to Id in case nothing was specified
					default:
						return FormatUtil["_get" + sOverrideNoData + "TextFormatterForIdOnly"].bind(oOverrideNoData);
				}
			}

			switch (sDisplayBehaviour) {
				case "descriptionAndId":
					return FormatUtil["_get" + sProcessMethod + sOverrideNoData + "TextFormatterForDescriptionAndId"];
				case "idAndDescription":
					return FormatUtil["_get" + sProcessMethod + sOverrideNoData + "TextFormatterForIdAndDescription"];
				case "descriptionOnly":
					return FormatUtil["_get" + sProcessMethod + sOverrideNoData + "TextFormatterForDescriptionOnly"];
					// idOnly and fallback to Id in case nothing was specified
				default:
					return FormatUtil["_get" + sProcessMethod + sOverrideNoData + "TextFormatterForIdOnly"];
			}
		},
		_processText: function(oTexts, bPreventProcessing) {
			if (bPreventProcessing) {
				return oTexts;
			}
			return oTexts.secondText ? oTexts.firstText + " (" + oTexts.secondText + ")" : oTexts.firstText;
		},
		_getTextFormatterForDescriptionAndId: function(sId, sDescription, bPreventProcessing) {
			return FormatUtil._processText({
				firstText: sDescription ? sDescription : sId,
				secondText: sDescription ? sId : undefined
			}, bPreventProcessing);
		},
		_getTextFormatterForIdAndDescription: function(sId, sDescription, bPreventProcessing) {
			return FormatUtil._processText({
				firstText: sId,
				secondText: sDescription ? sDescription : undefined
			}, bPreventProcessing);
		},
		_getTextFormatterForDescriptionOnly: function(sId, sDescription, bPreventProcessing) {
			return FormatUtil._processText({
				firstText: sDescription,
				secondText: undefined
			}, bPreventProcessing);
		},
		_getTextFormatterForIdOnly: function(sId, sDescription, bPreventProcessing) {
			return FormatUtil._processText({
				firstText: sId,
				secondText: undefined
			}, bPreventProcessing);
		},
		_getWhitespaceTextFormatterForDescriptionAndId: function(sId, sDescription, bPreventProcessing) {
			return fnWhitespaceReplacer(FormatUtil._getTextFormatterForDescriptionAndId.apply(FormatUtil, arguments));
		},
		_getWhitespaceTextFormatterForIdAndDescription: function(sId, sDescription, bPreventProcessing) {
			return fnWhitespaceReplacer(FormatUtil._getTextFormatterForIdAndDescription.apply(FormatUtil, arguments));
		},
		_getWhitespaceTextFormatterForDescriptionOnly: function(sId, sDescription, bPreventProcessing) {
			return fnWhitespaceReplacer(FormatUtil._getTextFormatterForDescriptionOnly.apply(FormatUtil, arguments));
		},
		_getWhitespaceTextFormatterForIdOnly: function(sId, sDescription, bPreventProcessing) {
			return fnWhitespaceReplacer(FormatUtil._getTextFormatterForIdOnly.apply(FormatUtil, arguments));
		},
		//No Data replaced for chart
		_getOverrideNoDataTextFormatterForDescriptionAndId: function(sId, sDescription, bPreventProcessing) {

			if (sId == "" && sDescription == "") {
				return this.getNotAssignedText();
			}

			return FormatUtil._getTextFormatterForDescriptionAndId.apply(FormatUtil, arguments);
		},
		_getOverrideNoDataTextFormatterForIdAndDescription: function(sId, sDescription, bPreventProcessing) {
			if (sId == "" && sDescription == "") {
				return this.getNotAssignedText();
			}

			return FormatUtil._getTextFormatterForIdAndDescription.apply(FormatUtil, arguments);
		},
		_getOverrideNoDataTextFormatterForDescriptionOnly: function(sId, sDescription, bPreventProcessing) {
			if (sDescription == "") {
				return this.getNotAssignedText();
			}

			return FormatUtil._getTextFormatterForDescriptionOnly.apply(FormatUtil, arguments);
		},
		_getOverrideNoDataTextFormatterForIdOnly: function(sId, sDescription, bPreventProcessing) {
			if (sId == "") {
				return this.getNotAssignedText();
			}

			return FormatUtil._getTextFormatterForIdOnly.apply(FormatUtil, arguments);
		},
		/**
		 * Static function that returns an object with first and second text values based on the displayBehaviour. Fallback is to return the Id (sId)
		 *
		 * @param {string} sDisplayBehaviour The display behaviour (e.g. as defined in: sap.ui.comp.smartfilterbar.DisplayBehaviour)
		 * @param {string | null} sId The ID field value
		 * @param {string} sDescription The Description field value
		 * @returns {object} Object with first and second text values based on the <code>sDisplayBehaviour</code>
		 * @private
		 */
		getTextsFromDisplayBehaviour: function(sDisplayBehaviour, sId, sDescription) {
			return FormatUtil.getFormatterFunctionFromDisplayBehaviour(sDisplayBehaviour)(sId, sDescription, true);
		},

		/**
		 * creates and returns a formatted text for the specified range
		 *
		 * @private
		 * @param {string} sOperation the operation type sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
		 * @param {string} sValue1 value of the first range field
		 * @param {string} sValue2 value of the second range field
		 * @param {boolean} bExclude indicates if the range is an Exclude range
		 * @returns {string} the range token text
		 */
		getFormattedRangeText: function(sOperation, sValue1, sValue2, bExclude) {
			return P13nConditionPanel.getFormatedConditionText(sOperation, sValue1, sValue2, bExclude);
		},
		_initialiseCurrencyFormatter: function() {
			// create number formatter instance
			if (!FormatUtil._oCurrencyFormatter) {
				FormatUtil._oCurrencyFormatter = NumberFormat.getCurrencyInstance({
					showMeasure: false
				});
			}

			if (!FormatUtil._fAmountCurrencyFormatter) {
				FormatUtil._fAmountCurrencyFormatter = function(oAmount, sCurrency) {
					var sValue, iCurrencyDigits;

					// Get the formatted numeric value
					sValue = FormatUtil._oCurrencyFormatter.format(oAmount, sCurrency);

					// Get the currency digits
					iCurrencyDigits = FormatUtil._oCurrencyFormatter.oLocaleData.getCurrencyDigits(sCurrency);

					return FormatUtil._applyPadding(sValue, iCurrencyDigits, FormatUtil.MAX_CURRENCY_DIGITS);
				};
			}
		},

		_getUnitFormatter: function(bPreserveDecimals, iScale) {
			const oFormatOptions = {
				showMeasure: false,
				maxFractionDigits: 3,
				minFractionDigits: 0,
				preserveDecimals: bPreserveDecimals
			};

			if (!isNaN(iScale)) {
				iScale = parseInt(iScale);
			}

			if (iScale >= 0 && iScale <= 3) {
				oFormatOptions.maxFractionDigits = oFormatOptions.minFractionDigits = iScale;
			}

			return NumberFormat.getUnitInstance(oFormatOptions);
		},

		/**
		 * Applies scale specific padding to the formatted string.
		 *
		 * @param {string} sValue Formatted string the padding is appended to
		 * @param {number} iScale Non-negative integer value that defines the specific scale for the given value
		 * @param {number} iMaxScale Non-negative integer value that defines the padding boundary
		 *
		 * @returns {string} Value including the padding
		 * @private
		 */
		_applyPadding: function(sValue, iScale, iMaxScale) {
			var iPadding;

			// NumberFormat and Currency provide the value as string or null
			if (typeof sValue !== "string") {
				return "";
			}

			// Add padding for decimal "."
			if (iScale === 0 && iMaxScale > 0) {
				sValue += FormatUtil.CHAR_PUNCTUATION_SPACE;
			}

			// Calculate and set padding for missing currency digits
			iPadding = iMaxScale - iScale;
			if (iPadding) {
				sValue = sValue.padEnd(sValue.length + iPadding, FormatUtil.CHAR_FIGURE_SPACE);
			}

			return sValue;
		},

		/**
		 * Returns the difference between the configured UnitSpecificScale from the code list and the actual decimal value returned by the backend.
		 * This difference is utilized by the Currency and Unit formatter function for the decimal alignment.
		 * @param {object} oTypeInstance The type instance
		 * @param {string} sValue The Formatter value
		 * @param {int} iFractionDigits the UnitSpecificScale provided for the particular UoM or Currency
		 * @param {int} iMaxFractionDigits Maximum fraction digit support for alignment of decimal point
		 * @returns {int} difference between the configure decimals and the actual decimal found in the formatted value
		 * @private
		 */
		_getFractionDigitDifference: function(oTypeInstance, sValue, iFractionDigits, iMaxFractionDigits) {
			if (!sValue) {
				return 0;
			}

			var iDecimalSeparatorIndex = sValue.indexOf(oTypeInstance.oOutputFormat.oFormatOptions.decimalSeparator);

			if (iDecimalSeparatorIndex < 0) {
				return 0;
			}

			var iFractionPartLength = sValue.substr(iDecimalSeparatorIndex + 1).length;

			if (iFractionPartLength <= iMaxFractionDigits && iFractionPartLength > iFractionDigits) {
				return iFractionPartLength - iFractionDigits;
			}

			if (iFractionPartLength > iMaxFractionDigits && iFractionDigits < iMaxFractionDigits) {
				return iMaxFractionDigits - iFractionDigits;
			}

			return 0;
		},

		/**
		 * Creates and returns an Amount Currency formatter, for formatting amount with spaces
		 *
		 * @param {boolean} bPreserveDecimals format option to preserve decimals
		 * @returns {function} a formatter function accepting raw value of amount and currency
		 * @private
		 */
		getAmountCurrencyFormatter: function(bPreserveDecimals) {
			var iMaxCurrencyFractionDigits = 0, oCurrencyInstance, mCodeList;

			FormatUtil._initialiseCurrencyFormatter();

			return function(oAmount, sCurrencyCode, mCurrencyCodeList) {
				var sValue, iCurrencyDigits;

				if (oAmount === undefined || oAmount === null || sCurrencyCode === "*") {
					return "";
				}

				if (!mCurrencyCodeList) {
					// Use static implementation
					return FormatUtil._fAmountCurrencyFormatter(oAmount, sCurrencyCode);
				}

				/*
				 * The Currency class stores the initial code list and ignores it on subsequent calls.
				 * This behavior is required in the formatter as well to ensure a stable padding.
				 */
				if (!mCodeList) {
					mCodeList = mCurrencyCodeList;

					iMaxCurrencyFractionDigits = FormatUtil._getMaxCurrencyFractionDigits(mCodeList);

					if (!oCurrencyInstance) {
						oCurrencyInstance = FormatUtil._getCurrencyInstance(bPreserveDecimals);
					}
				}


				// Get the currency digits
				iCurrencyDigits = mCodeList	&& mCodeList[sCurrencyCode]
					? mCodeList[sCurrencyCode].UnitSpecificScale : FormatUtil._oCurrencyFormatter.oLocaleData.getCurrencyDigits(sCurrencyCode);

				/* Ensure that sCurrencyCode is not equals undefined to prevent sValue being null */
				sValue = oCurrencyInstance.formatValue([oAmount, sCurrencyCode || null, mCodeList], "string");

				if (bPreserveDecimals) {
					iCurrencyDigits += FormatUtil._getFractionDigitDifference(oCurrencyInstance, sValue, iCurrencyDigits, iMaxCurrencyFractionDigits);
				}

				return FormatUtil._applyPadding(sValue, iCurrencyDigits, iMaxCurrencyFractionDigits);
			};
		},
		/**
		 * Returns the max currency fractional digit from the code list.
		 * @param {object} mCodeList Measures code list
		 * @returns {int} Max currency fraction digit
		 * @private
		 */
		_getMaxCurrencyFractionDigits: function(mCodeList) {
			var iMaxCurrencyFractionDigits = 0;

			for (var sEntry in mCodeList) {
				if (mCodeList[sEntry].UnitSpecificScale && mCodeList[sEntry].UnitSpecificScale > iMaxCurrencyFractionDigits) {
					iMaxCurrencyFractionDigits = mCodeList[sEntry].UnitSpecificScale;
				}
			}

			return iMaxCurrencyFractionDigits;
		},
		/**
		 * Returns the Currency instance which is used for formatting when Code List is available from the back-end.
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 * @returns {sap.ui.model.odata.type.Currency} Currency instance
		 * @private
		 */
		_getCurrencyInstance: function(bPreserveDecimals) {
			return new Currency({
				showMeasure: false,
				preserveDecimals: bPreserveDecimals
			});
		},
		/**
		 * creates and returns a Currency symbol formatter
		 *
		 * @private
		 * @returns {function} a formatter function accepting currency value
		 */
		getCurrencySymbolFormatter: function() {
			FormatUtil._initialiseCurrencyFormatter();
			if (!FormatUtil._fCurrencySymbolFormatter) {
				// Formatter function for currency symbol conversion
				FormatUtil._fCurrencySymbolFormatter = function(sCurrency) {
					if (!sCurrency || sCurrency === "*") {
						return "";
					}
					return FormatUtil._oCurrencyFormatter.oLocaleData.getCurrencySymbol(sCurrency);
				};
			}
			return FormatUtil._fCurrencySymbolFormatter;
		},

		/**
		 * Creates and returns a Measure Unit formatter, for formatting measure values with spaces
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 * @param {int} [iDefaultScale] Optional scale that will be used if no CodeList is available
		 *
		 * @private
		 * @returns {function} a formatter function accepting strings for value and unit
		 */
		getMeasureUnitFormatter: function(bPreserveDecimals, iDefaultScale) {
			const oDefaultFormat = FormatUtil._getUnitFormatter(bPreserveDecimals, iDefaultScale);

			/* We need to instantiate a Unit object within
			 * the scope, because we won't know during
			 * initialization, whether the function is
			 * called with or without unit code list.
			 *
			 * This ensures that we have only one Unit
			 * object per formatter function instead of
			 * creating one for each formatter call.
			 */
			var iMaxUnitFractionDigits = 0,
				oUnitInstance,
				mCodeList;

			return function(sValue, sUnit, mUnitCodeList) {
				if (sValue === undefined || sValue === null || sUnit === "*") {
					return "";
				}

				if (mUnitCodeList) {
					if (!mCodeList) {
						mCodeList = mUnitCodeList;

						iMaxUnitFractionDigits = FormatUtil._getMaxMeasureUnitFractionDigit(mCodeList);

						if (!oUnitInstance) {
							oUnitInstance = FormatUtil._getUnitInstance(bPreserveDecimals, iMaxUnitFractionDigits);
						}
					}

					sValue = oUnitInstance.formatValue([sValue, sUnit, mCodeList], "string");

					var iUnitFractionDigits = mCodeList[sUnit]?.UnitSpecificScale != null ? mCodeList[sUnit].UnitSpecificScale : iMaxUnitFractionDigits;

					if (bPreserveDecimals) {
						iUnitFractionDigits += FormatUtil._getFractionDigitDifference(oUnitInstance, sValue, iUnitFractionDigits, iMaxUnitFractionDigits);
					}

					return FormatUtil._applyPadding(sValue, iUnitFractionDigits, iMaxUnitFractionDigits);
				}

				return oDefaultFormat.format(sValue, sUnit) + FormatUtil.CHAR_FIGURE_SPACE;
			};
		},
		/**
		 * creates and returns an inline Measure Unit formatter, for formatting measure and unit values separated by a space
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 *
		 * @private
		 * @returns {function} a formatter function accepting strings for value and unit
		 */
		getInlineMeasureUnitFormatter: function(bPreserveDecimals) {
			var iMaxUnitFractionDigits = 0,
				oUnitInstance,
				mCodeList;

			if (!FormatUtil._fInlineMeasureFormatter) {
				// Formatter function for inline value and unit (measure)
				FormatUtil._fInlineMeasureFormatter = function(sValue, sUnit) {
					if (sValue === undefined || sValue === null || sUnit === "*") {
						return "";
					}
					if (!sUnit) {
						return sValue;
					}
					return sValue + FormatUtil.CHAR_FIGURE_SPACE + sUnit;
				};
			}

			return function(sValue, sUnit, mUnitCodeList) {
				if (mUnitCodeList) {
					if (!mCodeList) {
						mCodeList = mUnitCodeList;

						iMaxUnitFractionDigits = FormatUtil._getMaxMeasureUnitFractionDigit(mCodeList);

						if (!oUnitInstance) {
							oUnitInstance = FormatUtil._getUnitInstance(bPreserveDecimals, iMaxUnitFractionDigits);
						}
					}

					sValue = oUnitInstance.formatValue([sValue, sUnit, mCodeList], "string");
					// if no UnitSpecificScale found in the CodeList, then 3 this the default, to ensure alignment
					return sValue + FormatUtil.CHAR_FIGURE_SPACE + sUnit;
				}

				return FormatUtil._fInlineMeasureFormatter(sValue, sUnit);
			};
		},
		/**
		 * Returns the Unit instance which is used when Code List is available from the backend
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 * @param {*} iMaxUnitFractionDigits caluclated max measure unit fraction digits
		 * @returns {sap.ui.model.odata.type.Unit} Unit instance
		 * @private
		 */
		_getUnitInstance: function(bPreserveDecimals, iMaxUnitFractionDigits) {
			return new Unit({
				showMeasure: false,
				preserveDecimals: bPreserveDecimals,
				maxFractionDigits: iMaxUnitFractionDigits
			});
		},
		/**
		 * Returns the Max measure unit fraction digit from the code list. Max supported is 3 or less.
		 * @param {object} mCodeList Measures code list
		 * @returns {int} Max measure unit fraction digit
		 * @private
		 */
		_getMaxMeasureUnitFractionDigit: function(mCodeList) {
			let iMaxUnitFractionDigits = 0;

			for (const sUnit in mCodeList) {
				var iScale = mCodeList[sUnit].UnitSpecificScale;

				if (iScale > 3) {
					iScale = 3;
				}

				// if iMaxUnitFraction = 3, then no need to update, this can be skipped since the max is already found
				if (iMaxUnitFractionDigits < 3 && iScale > iMaxUnitFractionDigits && iScale <= 3) {
					iMaxUnitFractionDigits = iScale;
				}
			}

			return iMaxUnitFractionDigits;
		},
		/**
		 * creates and returns an inline Amount Currency formatter, for formatting amount and currency values separated by a space
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 *
		 * @private
		 * @returns {function} a formatter function accepting strings for amount and currency
		 */
		getInlineAmountFormatter: function(bPreserveDecimals) {
			var oCurrencyInstance, mCodeList;
			FormatUtil._initialiseCurrencyFormatter();

			if (!FormatUtil._fInlineAmountFormatter) {
				FormatUtil._fInlineAmountFormatter = function(oAmount, sCurrency) {
					var sValue;
					if (oAmount === undefined || oAmount === null || sCurrency === "*") {
						return "";
					}
					// Get the formatted numeric value
					sValue = FormatUtil._oCurrencyFormatter.format(oAmount, sCurrency);

					return sValue + FormatUtil.CHAR_FIGURE_SPACE + sCurrency;
				};
			}

			return function(oAmount, sCurrency, mCurrencyCodeList) {
				if (oAmount === undefined || oAmount === null || sCurrency === "*") {
					return "";
				}

				if (!mCurrencyCodeList) {
					return FormatUtil._fInlineAmountFormatter(oAmount, sCurrency);
				}

				if (!mCodeList) {
					mCodeList = mCurrencyCodeList;

					if (!oCurrencyInstance) {
						oCurrencyInstance = FormatUtil._getCurrencyInstance(bPreserveDecimals);
					}
				}

				var sValue = oCurrencyInstance.formatValue([oAmount, sCurrency || null, mCodeList], "string");

				return sValue + FormatUtil.CHAR_FIGURE_SPACE + sCurrency;
			};
		},
		/**
		 * Creates and returns an inline formatter for grouping, based on the field metadata
		 *
		 * @private
		 * @param {Object} oFieldMetadata OData metadata for the table field
		 * @param {boolean} bDisableDescription Optional flag to be used when description cannot be supported (e.g. AnalyticalBinding)
		 * @param {object} oDateFormatSettings Optional dateFormatSettings object
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 * @param {boolean} bReplaceWhitespace defines whether to replace whitespaces with special characters
		 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel the ODataMetaModel instance
		 * @returns {function} a formatter function
		 */
		getInlineGroupFormatterFunction: function(oFieldMetadata, bDisableDescription, oDateFormatSettings, bPreserveDecimals, bReplaceWhitespace, oMetaModel) {
			var bRelevantStringType = oFieldMetadata.type === "Edm.String" && !oFieldMetadata.isCalendarDate && !oFieldMetadata.isDigitSequence;
			if (oFieldMetadata.unit) {
				return FormatUtil.getRelevantUnitFormatterFunction(oMetaModel, oFieldMetadata, bPreserveDecimals);
			} else if (!bDisableDescription && (bRelevantStringType || oFieldMetadata.displayBehaviour !== "idOnly") && oFieldMetadata.description) {
				const fnFormatter = FormatUtil.getFormatterFunctionFromDisplayBehaviour(oFieldMetadata.displayBehaviour, bReplaceWhitespace);

				// Support combination of sap:display-format="NonNegative" and sap:text annotation
				if (oFieldMetadata.isDigitSequence && oFieldMetadata.modelType) {
					return function(sId, sDescription) {
						const sFormattedId = oFieldMetadata.modelType.formatValue(sId, "string");
						return fnFormatter(sFormattedId, sDescription);
					};
				}

				return fnFormatter;
			} else if (oFieldMetadata.type === "Edm.DateTime" && oFieldMetadata.displayFormat === "Date" && oDateFormatSettings && oDateFormatSettings["UTC"]) {
				// ControlProvider._createModelTypeInstance() always overwrites the formatOption.UTC = false, hence the oFieldMetadata.modelType cannot be used
				// for DateTime formatting, so we create a new instance for the DateTime groupHeaderFormatting
				var oConstraints = {
					displayFormat: "Date"
				};
				var oSettings = {
					isCalendarDate: oFieldMetadata.isCalendarDate
				};
				var oDateTimeFormatter = ODataType.getType(oFieldMetadata.type, oDateFormatSettings, oConstraints, oSettings);

				return function(oValue) {
					return oDateTimeFormatter.formatValue(oValue, "string");
				};
			} else if (oFieldMetadata.modelType) {
				return function(oValue) {
					return oFieldMetadata.modelType.formatValue(oValue, "string");
				};
			}
		},
		/**
		 * Returns the width from the metadata attributes. min-width if there is no width specified
		 *
		 * @param {object} oField - OData metadata for the table field
		 * @param {number} iMax - The max width (optional, default 30)
		 * @param {number} iMin - The min width (optional, default 3)
		 * @returns {string} - width of the filter field in em
		 * @private
		 */
		getWidth: function(oField, iMax, iMin) {
			var sWidth = oField.maxLength || oField.precision, iWidth, bIsDefaultMin;
			if (!iMax) {
				iMax = 30;
			}
			if (!iMin) {
				iMin = 3;
				bIsDefaultMin = true;
			}
			// Force set the width to 9em for date fields
			if (oField.type === "Edm.DateTime" && oField.displayFormat === "Date" || oField.isCalendarDate) {
				sWidth = "9em";
			} else if (sWidth) {
				// Use Max width for description&Id and descriptionOnly use-case to accommodate description texts better on the UI
				if (oField.type === "Edm.String" && oField.description && oField.displayBehaviour && (oField.displayBehaviour === "descriptionAndId" || oField.displayBehaviour === "descriptionOnly")) {
					sWidth = "Max";
				}

				// Use max width if "Max" is set in the metadata or above
				if (sWidth === "Max") {
					sWidth = iMax + "";
				}
				iWidth = parseInt(sWidth);
				if (!isNaN(iWidth)) {
					// Add additional .75 em (~12px) to avoid showing ellipsis in some cases!
					iWidth += 0.75;
					// use a max initial width of 30em (default)
					if (iWidth > iMax) {
						iWidth = iMax;
					} else if (iWidth < iMin) {
						// use a min width of 3em (default)
						iWidth = iMin;
					}
					sWidth = iWidth + "em";
				} else {
					// if NaN reset the width so min width would be used
					sWidth = null;
				}
			}
			if (!sWidth) {
				// For Boolean fields - Use min width as the fallabck, in case no width could be derived.
				if (oField.type === "Edm.Boolean") {
					// Add additional 0.25em (~4px) for fields of type Edm.Boolean to avoid showing ellipsis
					if (bIsDefaultMin) {
						iMin += 0.25; // BCP: 2080056307
					}
					sWidth = iMin + "em";
				} else {
					// use the max width as the fallback width of the column, if no width can be derived
					sWidth = iMax + "em";
				}
			}
			return sWidth;
		},
		/**
		 * Returns Time in 'PT'HH'H'mm'M'ss'S' format (as expected by Edm.Time fields)
		 *
		 * @private
		 * @param {Object} oDate - The input date object
		 * @returns {string} The time in 'PT'HH'H'mm'M'ss'S' format
		 */
		getEdmTimeFromDate: function(oDate) {
			if (!FormatUtil._oTimeFormat) {
				FormatUtil._oTimeFormat = DateFormat.getTimeInstance({
					pattern: "'PT'HH'H'mm'M'ss'S'"
				});
			}
			return FormatUtil._oTimeFormat.format(oDate);
		},
		/**
		 * Static function to parse the value of numeric interval field
		 *
		 * @private
		 * @param {string} oValue of interval
		 * @returns {array} containing low and high values of the passed interval
		 */
		parseFilterNumericIntervalData: function(oValue) {
			var aResult = [], aRegResult = oValue.match(RegExp("^(-?[^-]*)-(-?[^-]*)$"));

			if (aRegResult && aRegResult.length >= 2) {
				aResult.push(aRegResult[1]);
				aResult.push(aRegResult[2]);
			}

			return aResult;
		},

		parseDateTimeOffsetInterval: function(sValue) {
			var aValues = sValue.split('-'), aRetValues = [
				sValue
			], nIdx = 0;

			if ((aValues.length % 2) === 0) {

				aRetValues = [];

				for (var i = 0; i < aValues.length / 2; i++) {
					nIdx = sValue.indexOf('-', ++nIdx);
				}

				aRetValues.push(sValue.substr(0, nIdx).replace(/\s+/g, ''));
				aRetValues.push(sValue.substr(nIdx + 1).replace(/\s+/g, ''));

			}

			return aRetValues;
		},

		/**
		 * Returns the filterType (needed by p13n handling) of the field based on metadata, else undefined
		 *
		 * @param {object} oField - OData metadata for the field
		 * @returns {string} the filter type for the field as expected by p13n filter/condition handling
		 * @private
		 */
		_getFilterType: function(oField) {
			if (oField.isFiscalDate) {
				return "date";
			} else if (oField.isCalendarType && oField.calendarType) {
				return "date";
			} else if (oField.isDigitSequence) {
				return "numc";
			} else if (ODataType.isNumeric(oField.type)) {
				return "numeric";
			} else if (oField.type === "Edm.DateTime" && oField.displayFormat === "Date") {
				return "date";
			} else if (oField.type === "Edm.DateTimeOffset") {
				return "datetime";
			} else if (oField.type === "Edm.String") {
				if (oField.isCalendarDate) {
					return "stringdate";
				}
				return "string";
			} else if (oField.type === "Edm.Guid") {
				return "guid";
			} else if (oField.type === "Edm.Boolean") {
				return "boolean";
			} else if (oField.type === "Edm.Time") {
				return "time";
			}
			return undefined;
		},

		/**
		 * Returns function to replace whitespace with special characters.
		 * @param {boolean} bReplaceWhitespace - defines whether to replace whitespaces with special characters
		 * @returns {function} sap.base.strings.whitespaceReplacer function to replace whitespace with special characters
		 * @private
		 */
		getWhitespaceReplacer: function(bReplaceWhitespace) {
			return bReplaceWhitespace ? fnWhitespaceReplacer : undefined;
		},

		/**
		 * Returns a formatter function for formatting DateTimeWithTimezone.
		 * @param {object} oFormatOptions - Optional custom format options
		 * @returns {function} a formatter function
		 * @private
		 */
		getDateTimeWithTimezoneFormatter: function(oFormatOptions) {
			if (!oFormatOptions && !FormatUtil._oDateTimeWithTimezone) {
				// showDate: true (default)
				// showTime: true (default)
				// showTimezone: true (default)
				// hence DateTimeWithTimezone instance created with no formatOptions
				FormatUtil._oDateTimeWithTimezone = DateFormat.getDateTimeWithTimezoneInstance();
			}

			return function(oDateTime, sTimezone) {
				if (!oDateTime) {
					return "";
				}

				return oFormatOptions ? DateFormat.getDateTimeWithTimezoneInstance(oFormatOptions).format(oDateTime, sTimezone) : FormatUtil._oDateTimeWithTimezone.format(oDateTime, sTimezone);
			};
		},

		/**
		 * Returns the relevant formatter function, either the inline amount or the inline measure unit formatter.
		 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel the ODataMetaModel instance
		 * @param {object} oFieldMetadata OData metadata for the table field
		 * @param {boolean} bPreserveDecimals indicates whether the formatter should preserveDecimals returned by the back-end or not
		 * @returns {function} a formatter function
		 * @private
		 */
		getRelevantUnitFormatterFunction: function(oMetaModel, oFieldMetadata, bPreserveDecimals) {
			var mCodeLists,
				bCurrencyField = oFieldMetadata.isCurrencyField,
				fnInternalFormatter = bCurrencyField ? FormatUtil.getInlineAmountFormatter(bPreserveDecimals) : FormatUtil.getInlineMeasureUnitFormatter(bPreserveDecimals);

			if (oMetaModel) {
				if (bCurrencyField) {
					oMetaModel.requestCurrencyCodes().then(function(mCodeList) {
						mCodeLists = mCodeList;
					});
				} else {
					oMetaModel.requestUnitsOfMeasure().then(function(mCodeList) {
						mCodeLists = mCodeList;
					});
				}
			}

			return function(oValue, sUnit) {
				if (!mCodeLists) {
					if (bCurrencyField) {
						return fnInternalFormatter(oValue, sUnit);
					}
					if (oFieldMetadata.modelType) {
						oValue = oFieldMetadata.modelType.formatValue(oValue, "string");
					}
					return fnInternalFormatter(oValue, sUnit);
				}
				return fnInternalFormatter(oValue, sUnit, mCodeLists);
			};
		},

		/**
		 * Static function that adapts the time part of a date according to
		 * the field metadata
		 * @private
		 * @param {Object} oFilter The filter object
		 * @param {int} iPrecision The field precision
		 * @param {string} sOperation The filter operation
		 * @returns {Object} The adapted filter object
		 */
		adaptMilliseconds: function(oFilter, iPrecision, sOperation) {
			if (iPrecision && iPrecision > 3) {
				var iNumberOfAdditionalDigits = iPrecision - 3,
					sAdditionalMilliseconds = "9".repeat(iNumberOfAdditionalDigits);
				if (sOperation === FilterOperator.BT || sOperation === FilterOperator.NB) {
					oFilter.appendFractionalSeconds2(sAdditionalMilliseconds);
				} else if (sOperation === FilterOperator.LT || sOperation === FilterOperator.LE) {
					oFilter.appendFractionalSeconds1(sAdditionalMilliseconds);
				}
			}
			return oFilter;
		}
	};

	return FormatUtil;

}, /* bExport= */true);
