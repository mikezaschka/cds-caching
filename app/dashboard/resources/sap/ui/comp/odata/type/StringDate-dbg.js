/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/base/i18n/date/CalendarType",
	"sap/ui/model/SimpleType",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/ValidateException"

], function(
	CalendarType,
	SimpleType,
	DateFormat,
	ValidateException
) {
	"use strict";

	/**
	 * Constructor for an string date type.
	 *
	 * This module is only for internal use!
	 *
	 * @class String Date data type support parsing and formatting of string that follow the pattern 'yyyymmdd'
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.54.0
	 * @extends sap.ui.model.SimpleType
	 * @alias {sap.ui.comp.odata.type.StringDate} the string date implementation.
	 */
	var StringDate = SimpleType.extend("sap.ui.comp.odata.type.StringDate", {
		constructor: function(oFormatOptions) {
			SimpleType.apply(this, [oFormatOptions]);

			this.sName = "sap.ui.comp.odata.type.StringDate";//in order not to redefine the getName method

			oFormatOptions = Object.assign({}, oFormatOptions, {
				UTC: false
			});

			this.displayFormatter = DateFormat.getDateInstance(oFormatOptions);

			this.parseFormatter = DateFormat.getDateInstance({
				UTC: false,
				pattern: "yyyyMMdd",
				calendarType: CalendarType.Gregorian,
				strictParsing: true
			});

		}
	});

	/*
	 * @override
	 */
	StringDate.prototype.parseValue = function(vValue, sSourceType) {
		if (vValue === "") {
			vValue = null;
		}

		if (vValue != null && vValue != "") {
			var oValueDate = sSourceType === "string" ? this.parseFormatter.parse(vValue, true) : vValue;
			vValue = this.parseFormatter.format(oValueDate);
		}
		return vValue;
	};

	/*
	 * @override
	 */
	StringDate.prototype.formatValue = function(oValue, sTargetType) {
		if (oValue === null || oValue === undefined || oValue == "") {
			return null;
		}

		if (!(oValue instanceof Date)) {
			oValue = this.parseFormatter.parse(oValue);
		}

		if (sTargetType === "string") {
			return this.displayFormatter.format(oValue);
		}

		return oValue;
	};

	/*
	 * @override
	 */
	StringDate.prototype.validateValue = function(sValue) {
		if (sValue != null) {
			var oDate = this.parseFormatter.parse(sValue);

			if (!oDate) {
				// currently not visible on the UI as only used in the TokenParser from the parsed value
				throw new ValidateException(sValue + " is not a valid date");
			}
		}
	};

	return StringDate;
});