/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/date/CalendarType",
	"sap/ui/core/Lib",
	"sap/ui/comp/smartfield/type/String",
	"sap/ui/comp/odata/type/NumericText",
	"sap/ui/comp/odata/CalendarFormat",
	"sap/ui/model/ValidateException"
], function(CalendarType, Library, String, NumericText, CalendarFormat, ValidateException) {
	"use strict";
	/**
	 * Constructor for a calendar date type.
	 *
	 * This module is only for internal use!
	 *
	 * @class Calendar Date data type support parsing and formatting of calendar dates that follow the pattern 'yM'
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @param {object} oSettings Settings.
	 * @version 1.136.0
	 * @private
	 * @extends sap.ui.comp.smartfield.type.String
	 * @alias {sap.ui.comp.odata.type.CalendarDate} the calendar date implementation.
	 */
	var CalendarDate = String.extend("sap.ui.comp.odata.type.CalendarDate", {
		constructor: function(oFormatOptions, oConstraints, oSettings) {
			String.call(this, oFormatOptions, oConstraints);
			if (this.oConstraints && this.oConstraints.isDigitSequence) {
				NumericText.call(this, oFormatOptions, oConstraints);
			}
			this.sCalendarType = oSettings.calendarType;
			this.formatter = CalendarFormat.getDateInstance(Object.assign({ format: CalendarDate.CalendarDateFormatter[this.sCalendarType], calendarType: CalendarType.Gregorian }, oFormatOptions));
		}
	});

	/**
	 * Parses the given value which is expected to be of the Calendar type to a string.
	 *
	 * @param {string|number|boolean} vValue the value to be parsed
	 * @returns {string} the parsed value
	 * @override
	 * @private
	 */
	CalendarDate.prototype.parseValue = function(vValue) {
		if (vValue === "") {
			return null;
		}
		if (this.oConstraints && this.oConstraints.isDigitSequence) {
			return this.formatter.parse(NumericText.prototype.parseValue.apply(this, arguments));
		}
		return this.formatter.parse(String.prototype.parseValue.apply(this, arguments));
	};

	/**
	 * Formats the given value to the given Calendar type.
	 *
	 * @param {string} sValue the value to be formatted
	 * @param {string} sValue the value to be formatted
	 * @returns {string|number|boolean} the formatted output value; <code>undefined</code> is always formatted
	 * to <code>null</code>.
	 * @function
	 * @override
	 * @private
	 */
	CalendarDate.prototype.formatValue = function(sValue) {
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
	CalendarDate.prototype.validateValue = function(sValue) {
		try {
			String.prototype.validateValue.apply(this, arguments);
		} catch (error) {
			if (!this.formatter.validate(sValue)) {
				throw new ValidateException(this.getErrorMessage(this.sCalendarType));
			}
		}

		if (sValue === null) {
			return;
		}
		if (!this.formatter.validate(sValue)) {
			throw new ValidateException(this.getErrorMessage(this.sCalendarType));
		}
	};

	/**
	 * @inheritDoc
	 */
	CalendarDate.prototype.destroy = function() {
		String.prototype.destroy.apply(this, arguments);
		if (this.formatter) {
			this.formatter.destroy();
			this.formatter = null;
		}
	};

	/**
	 * Returns the matching locale-dependent error message for the type based on the Calendar type.
	 *
	 * @param {string} sCalendarType the Calendar type
	 * @returns {string} The locale-dependent error message
	 * @private
	 */
	CalendarDate.prototype.getErrorMessage = function(sCalendarType) {
		var sValue;
		this.iFullYear = this.iFullYear || new Date().getFullYear().toString();

		switch (sCalendarType) {
			case "IsCalendarYear":
				sValue = this.iFullYear;
				break;
			case "IsCalendarQuarter":
				sValue = "1 - 4";
				break;
			case "IsCalendarYearQuarter":
				sValue = this.iFullYear + "1";
				break;
			case "IsCalendarWeek":
				sValue = "01";
				break;
			case "IsCalendarYearWeek":
				sValue = this.iFullYear + "01";
				break;
			case "IsCalendarMonth":
				sValue = "01 - 12";
				break;
			case "IsCalendarYearMonth":
				sValue = this.iFullYear + "01";
				break;
			default:
				sValue = this.iFullYear;
		}

		return Library.getResourceBundleFor("sap.ui.comp").getText("CALENDAR_VALIDATION_FAILS", [this.formatValue(sValue, "string")]);
	};

	/**
	 * Local formatting/parsing pattern mapping to corresponding calendar type configuration.
	 */
	CalendarDate.CalendarDateFormatter =  {
		"IsCalendarYear": "YYYY",
		"IsCalendarWeek": "WW",
		"IsCalendarMonth":"MM",
		"IsCalendarQuarter": "Q",
		"IsCalendarYearWeek": "YYYYWW",
		"IsCalendarYearMonth": "YYYYMM",
		"IsCalendarYearQuarter": "YYYYQ"
	};

	CalendarDate.prototype.getName = function() {
		return "sap.ui.comp.odata.type.CalendarDate";
	};

	/**
	 * Returns the formatter that is assigned to this particular CalendarDate type.
	 *
	 * @returns {null|object} The assigned instance of PeriodDateFormat
	 * @private
	 * @ui5-restricted sap.ui.comp.SmartTable
	 */
	CalendarDate.prototype.getFormatter = function () {
		return this.formatter;
	};

	return CalendarDate;
});
