/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Lib",
	"sap/ui/model/type/Currency",
	"sap/ui/model/odata/type/Currency",
	"sap/ui/model/ValidateException",
	"sap/ui/comp/smartfield/UoMValidateException"
], function(
	Library,
	CurrencyBase,
	ODataCurrency,
	ValidateException,
	UoMValidateException
) {
	"use strict";
	var _rDecimal = /^([-]?)(\d+)(?:\.(\d+))?$/;

	var Currency = ODataCurrency.extend("sap.ui.comp.smartfield.type.Currency", {
		constructor: function(oFormatOptions, oConstraints) {
			ODataCurrency.apply(this, [oFormatOptions]);
			this.oConstraints = oConstraints;
			this.bParseWithValues = true;
			this.sName = "Currency";
		}
	});

	Currency.prototype.parseValue = function(vValue, sInternalType, aCurrentValues) {
		if (aCurrentValues[1] && this.shouldConvertUnitToUpperCase(aCurrentValues[1])) {
			arguments[2][1] = arguments[2][1].toUpperCase();
		}
		var aValues = ODataCurrency.prototype.parseValue.apply(this, arguments),
			sIntegerPart,
			sFractionPart,
			aMatches = Array.isArray(aValues) && aValues[0] && _splitDecimals(aValues[0]);

		if (Array.isArray(aMatches)) {
			sIntegerPart = aMatches[1] + aMatches[2];
			sFractionPart = aMatches[3];
			if (Number.parseInt(sFractionPart) === 0) {
				aValues[0] = sIntegerPart;
			}
		}

		if (aValues[1] === undefined) {
			aValues[1] = aCurrentValues[1];
		}

		return aValues;
	};

	Currency.prototype.validateValue = function(vValues) {
		var aMatches,
			sValue = vValues[0],
			sCurrencyCode = vValues[1],
			bNullValue = sValue === null,
			iScale = 0,
			oCurrencyCustomizing = this.oFormatOptions && this.oFormatOptions.customCurrencies;

		if (sCurrencyCode && this.shouldConvertUnitToUpperCase(sCurrencyCode)) {
			sCurrencyCode = sCurrencyCode.toUpperCase();
		}

		if (this.oConstraints && this.oConstraints.nullable && (bNullValue || (sValue === this.oFormatOptions.emptyString))) {
			return;
		}

		if (oCurrencyCustomizing && sCurrencyCode &&
			Object.keys(oCurrencyCustomizing).indexOf(sCurrencyCode) === -1) {
			throw new UoMValidateException(getTextCompLibrary("CURRENCY_VALIDATION_FAILS", [sCurrencyCode]));
		}

		if ((typeof sValue !== "string") || (aMatches === null)) {
			throw new ValidateException(getText("EnterNumber"));
		}

		aMatches = _splitDecimals(sValue);

		if ((typeof sValue !== "string") || (aMatches === null)) {
			throw new ValidateException(getText("EnterNumber"));
		}

		var iIntegerValue = parseInt(aMatches[2]),
			iIntegerDigits = iIntegerValue === 0 ? 0 : aMatches[2].length,
			iFractionDigits = (aMatches[3] || "").length,
			iConstraintsPrecision = this.oConstraints && this.oConstraints.precision,
			iPrecision = typeof iConstraintsPrecision === "number" ? iConstraintsPrecision : Infinity,
			sCurrency = sCurrencyCode,
			iScaleOfCurrency = this.oOutputFormat.oLocaleData.getCurrencyDigits(sCurrency),
			iScaleOfCustomCurrency = this.mCustomUnits && this.mCustomUnits[sCurrency] && this.mCustomUnits[sCurrency].decimals;

		if (iScaleOfCustomCurrency || iScaleOfCustomCurrency === 0) {
			iScaleOfCurrency = iScaleOfCustomCurrency;
		}

		if (this.oConstraints && this.oConstraints.variableScale) {
			// In case of sap:variable-scale="true" the provided scale can vary depending on the current currency scale
			// up to the size of the precision.
			iScale = Math.min(iPrecision, iScaleOfCurrency);
		} else {
			iScale = Math.min((this.oConstraints && this.oConstraints.scale) || 0, iScaleOfCurrency);
		}

		// The Scale value can range from 0 through the specified Precision value.
		if (iScale > iPrecision) {
			iScale = iPrecision;
		}

		if (iFractionDigits > iScale) {

			if (iScale === 0) {

				// enter a number with no decimal places
				throw new ValidateException(getText("EnterInt"));
			}

			if ((iIntegerDigits + iScale) > iPrecision) {

				// enter a number with a maximum of {iPrecision - iScale} digits to the left of the decimal
				// separator and a maximum of {iScale} decimal places
				throw new ValidateException(getText("EnterNumberIntegerFraction", [iPrecision - iScale, iScale]));
			}

			// enter a number with a maximum of {iScale} decimal places
			throw new ValidateException(getText("EnterNumberFraction", [iScale]));
		}

		// Keep in mind the following: If Precision is equal to Scale, a single zero MUST precede the decimal point.
		if (iIntegerDigits > (iPrecision - iScale)) {
			// enter a number with a maximum of {iPrecision - iScale} digits to the left of
			// the decimal separator
			throw new ValidateException(getText("EnterNumberInteger", [iPrecision - iScale]));
		}
	};

	function _splitDecimals(sValue) {
		return _rDecimal.exec(sValue);
	}

	function getText(sKey, aParams) {
		return Library.getResourceBundleFor("sap.ui.core").getText(sKey, aParams);
	}

	function getTextCompLibrary(sKey, aParams) {
		return Library.getResourceBundleFor("sap.ui.comp").getText(sKey, aParams);
	}

	Currency.prototype.shouldConvertUnitToUpperCase = function(sValue) {
		return this.mCustomUnits && !this.mCustomUnits[sValue] && this.mCustomUnits[sValue.toUpperCase()];
	};

	Currency.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Currency";
	};

	return Currency;
});
