/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/odata/PeriodDateFormat"
], function(BaseFormat) {
	"use strict";

	/**
	 * Constructor for a new CalendarFormat.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} oFormatOptions Object which defines the format options.
	 *
	 * @class
	 * <h3>Overview</h3>
	 *
	 * Formatting, validating and parsing calendar dates
	 *
	 * This module is only for internal use!
	 *
	 * @extends sap.ui.base.Object
	 * @author SAP SE
	 * @param {object} oFormatOptions format options.
	 * @param {string} oFormatOptions.format format options.
	 * @param {string} oFormatOptions.calendarType format options.
	 * @version 1.136.0
	 * @private
	 * @hideconstructor
	 * @extends sap.ui.base.Object
	 * @alias sap.ui.comp.smartfield.CalendarFormat
	 */
	var CalendarFormat = BaseFormat.extend("sap.ui.comp.odata.CalendarFormat", {
		metadata: {
			library: "sap.ui.comp"
		},
		constructor: function(sId, oFormatOptions) {
			BaseFormat.apply(this, arguments);
		}
	});

	/**
	 * Get a date instance of the <code>CalendarFormat</code> class, which can be used for formatting.
	 *
	 * @param {object} oFormatOptions Object which defines the format options.
	 * @returns {sap.ui.comp.odata.CalendarFormat} Instance of the CalendarFormat.
	 * @private
	 * @static
	 */
	CalendarFormat.getDateInstance = function(oFormatOptions) {
		return new CalendarFormat(null, oFormatOptions);
	};

	CalendarFormat.prototype.getName = function() {
		return "sap.ui.comp.odata.CalendarFormat";
	};

	/**
	 * @override
	 * @inheritDoc
	 */
	CalendarFormat.oRegexFormatPatterns = {
		"year": /[1-9][0-9]{3}/,
		"period": /[0-9]{3}/,
		"quarter": /[1-4]/,
		"week": /0[1-9]|[1-4][0-9]|5[0-3]/,
		"day": /366|3[0-6][0-9]|[1-2][0-9][0-9]|[1-9][0-9]|[1-9]/,
		"month":/0[1-9]|1[0-2]/
	};

	/**
	 * @override
	 * @inheritDoc
	 */
	CalendarFormat.oRegexParsePatterns = {
		"year": /[0-9]{1,4}/,
		"period": /[0-9]{1,3}/,
		"quarter": /[1-4]/,
		"week": /[0-9]{1,2}/,
		"day": /[1-9]/,
		"month":/[0-9]{1,2}/
	};

	/**
	 * @override
	 * @inheritDoc
	 */
	CalendarFormat.prototype.oSymbols = {
		"": "", // "text"
		"y": { format: CalendarFormat.oRegexFormatPatterns.year, parse: CalendarFormat.oRegexParsePatterns.year}, // "year"
		"Y": { format: CalendarFormat.oRegexFormatPatterns.year, parse: CalendarFormat.oRegexParsePatterns.year}, // "weekYear"
		"M": { format: CalendarFormat.oRegexFormatPatterns.month, parse: CalendarFormat.oRegexParsePatterns.month}, // "month"
		"L": { format: CalendarFormat.oRegexFormatPatterns.month, parse: CalendarFormat.oRegexParsePatterns.month}, // "month"
		"Q": { format: CalendarFormat.oRegexFormatPatterns.quarter, parse: CalendarFormat.oRegexParsePatterns.quarter}, // "quarter"
		"W": { format: CalendarFormat.oRegexFormatPatterns.week, parse: CalendarFormat.oRegexParsePatterns.week}, // "weekInYear"
		"D": { format: CalendarFormat.oRegexFormatPatterns.day, parse: CalendarFormat.oRegexParsePatterns.day}, // "dayInYear"
		"d": { format: CalendarFormat.oRegexFormatPatterns.day, parse: CalendarFormat.oRegexParsePatterns.day} // "dayInYear"

	};

	return CalendarFormat;
});
