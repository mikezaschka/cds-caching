/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/date/CalendarType",
	"sap/ui/core/Lib",
	"sap/ui/comp/smartfield/type/String",
	"sap/ui/comp/odata/type/NumericText",
	"sap/ui/comp/odata/FiscalFormat",
	"sap/ui/model/ValidateException"
], function(CalendarType, Library, String, NumericText, FiscalFormat, ValidateException) {
	"use strict";
	/**
	 * Constructor for an fiscal date type.
	 *
	 * This module is only for internal use!
	 *
	 * @class Fiscal Date data type support parsing and formatting of fiscal dates that follow the pattern 'yM'
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @param {object} oSettings Settings.
	 * @version 1.136.0
	 * @private
	 * @extends sap.ui.comp.smartfield.type.String
	 * @alias {sap.ui.comp.odata.type.FiscalDate} the fiscal date implementation.
	 */
	var FiscalDate = String.extend("sap.ui.comp.odata.type.FiscalDate", {
		constructor: function(oFormatOptions, oConstraints, oSettings) {
			String.call(this, oFormatOptions, oConstraints);
			if (this.oConstraints && this.oConstraints.isDigitSequence) {
				NumericText.call(this, oFormatOptions, oConstraints);
			}
			this.sFiscalType = this._getFiscalType(oSettings);
			this.formatter = FiscalFormat.getDateInstance(Object.assign({ format: FiscalDate.FiscalDateFormatter[this.sFiscalType], calendarType: CalendarType.Gregorian }, oFormatOptions));
		}
	});

	/**
	 * Parses the given value which is expected to be of the fiscal type to a string.
	 *
	 * @param {string|number|boolean} vValue
	 *   the value to be parsed
	 * @returns {string}
	 *   the parsed value
	 * @override
	 * @private
	 */
	FiscalDate.prototype.parseValue = function(vValue) {
		if (vValue === "") {
			return null;
		}
		if (this.oConstraints && this.oConstraints.isDigitSequence) {
			return this.formatter.parse(NumericText.prototype.parseValue.apply(this, arguments));
		}
		return this.formatter.parse(String.prototype.parseValue.apply(this, arguments));
	};

	/**
	 * Formats the given value to the given fiscal type.
	 *
	 * @param {string} sValue
	 *   the value to be formatted
	 * @returns {string|number|boolean}
	 *   the formatted output value; <code>undefined</code> is always formatted
	 *   to <code>null</code>.
	 * @function
	 * @override
	 * @private
	 */
	FiscalDate.prototype.formatValue = function(sValue) {
		var vFormattedValue;
		if (this.oConstraints && this.oConstraints.isDigitSequence) {
			var aArguments = Array.from(arguments),
				bSkippedFormatting = true;
			aArguments.push(bSkippedFormatting);
			vFormattedValue = NumericText.prototype.formatValue.apply(this, aArguments);
		} else {
			vFormattedValue = String.prototype.formatValue.apply(this, arguments);
		}

		if (vFormattedValue === null) {
			return null;
		}
		return this.formatter.format(vFormattedValue);
	};

	/**
	 * @inheritDoc
	 */
	FiscalDate.prototype.validateValue = function(sValue) {
		try {
			String.prototype.validateValue.apply(this, arguments);
		} catch (error) {
			if (!this.formatter.validate(sValue)) {
				throw new ValidateException(this.getErrorMessage(this.sFiscalType));
			}
		}

		if (sValue === null) {
			return;
		}
		if (!this.formatter.validate(sValue)) {
			throw new ValidateException(this.getErrorMessage(this.sFiscalType));
		}
	};

	/**
	 * @inheritDoc
	 */
	FiscalDate.prototype.destroy = function() {
		String.prototype.destroy.apply(this, arguments);
		if (this.formatter) {
			this.formatter.destroy();
			this.formatter = null;
		}
	};

	/**
	 * Returns the matching locale-dependent error message for the type based on the fiscal type.
	 *
	 * @param {string} sFiscalType the fiscal type
	 * @returns {string} The locale-dependent error message
	 * @private
	 */
	FiscalDate.prototype.getErrorMessage = function(sFiscalType) {
		var sValue;
		this.iFullYear = this.iFullYear || new Date().getFullYear().toString();

		switch (sFiscalType) {
			case "IsFiscalYear":
				sValue = this.iFullYear;
				break;
			case "IsFiscalPeriod":
				sValue = "001";
				break;
			case "IsFiscalYearPeriod":
				sValue = this.iFullYear + "001";
				break;
			case "IsFiscalQuarter":
				sValue = "1";
				break;
			case "IsFiscalYearQuarter":
				sValue = this.iFullYear + "1";
				break;
			case "IsFiscalWeek":
				sValue = "01";
				break;
			case "IsFiscalYearWeek":
				sValue = this.iFullYear + "01";
				break;
			case "IsDayOfFiscalYear":
				sValue = "1";
				break;
			case "IsFiscalYearVariant":
				break;
			default:
				sValue = this.iFullYear;
		}

		return Library.getResourceBundleFor("sap.ui.comp").getText("FISCAL_VALIDATION_FAILS", [this.formatValue(sValue, "string")]);
	};

	/**
	 * Local formatting/parsing pattern mapping to corresponding fiscal type configuration.

	 */
	FiscalDate.FiscalDateFormatter =  {
			"IsFiscalYear": "YYYY",
			"IsFiscalPeriod": "PPP",
			"IsFiscalYearPeriod": "YYYYPPP",
			"IsFiscalQuarter": "Q",
			"IsFiscalYearQuarter": "YYYYQ",
			"IsFiscalWeek": "WW",
			"IsFiscalYearWeek": "YYYYWW",
			"IsDayOfFiscalYear": "d",
			"IsFiscalYearVariant": ""
	};

	FiscalDate.prototype.getName = function() {
		return "sap.ui.comp.odata.type.FiscalDate";
	};

	/**
	 * Returns the formatter that is assigned to this particular FiscalDate type.
	 *
	 * @returns {null|object} The assigned instance of FiscalFormat
	 * @private
	 * @ui5-restricted sap.ui.comp.SmartTable
	 */
	FiscalDate.prototype.getFormatter = function () {
		return this.formatter;
	};

	/**
	 * Returns fiscal type.
	 *
	 * @param {object} oSettings Settings.
	 * @returns {string} Fiscal date type.
	 * @private
	 */
	FiscalDate.prototype._getFiscalType = function(oSettings) {
		var sAnnotationNamespace = "com.sap.vocabularies.Common.v1.";

		if (oSettings.anotationType && oSettings.anotationType.indexOf(sAnnotationNamespace) != -1) {
			return oSettings.anotationType.replace(sAnnotationNamespace, "");
		}

		return oSettings.fiscalType;
	};

	return FiscalDate;
});
