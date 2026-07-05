/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/comp/odata/PeriodDateFormat"
], function(BaseFormat) {
	"use strict";

	/**
	 * Constructor for a new FiscalFormat.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} oFormatOptions Object which defines the format options.
	 *
	 * @class
	 * <h3>Overview</h3>
	 *
	 * Formatting, Validating and Parsing Fiscal dates
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
	 * @alias sap.ui.comp.smartfield.FiscalFormat
	 */
	var FiscalFormat = BaseFormat.extend("sap.ui.comp.odata.FiscalFormat", {
		metadata: {
			library: "sap.ui.comp"
		},
		constructor: function(sId, oFormatOptions) {
			BaseFormat.apply(this, arguments);
		}
	});

	/**
	 * Get a date instance of the <code>FiscalFormat</code> class, which can be used for formatting.
	 *
	 * @param {object} oFormatOptions Object which defines the format options.
	 * @returns {sap.ui.comp.odata.CalendarFormat} Instance of the FiscalFormat.
	 * @private
	 * @static
	 */
	FiscalFormat.getDateInstance = function(oFormatOptions) {
		return new FiscalFormat(null, oFormatOptions);
	};

	FiscalFormat.prototype.getName = function() {
		return "sap.ui.comp.odata.FiscalFormat";
	};

	/**
	 * @override
	 * @inheritDoc
	 */
	FiscalFormat.oRegexFormatPatterns = {
		"year": /[1-9][0-9]{3}/,
		"period": /[0-9]{3}/,
		"quarter": /[1-4]/,
		"week": /0[1-9]|[1-4][0-9]|5[0-3]/,
		"day": /371|370|3[0-6][0-9]|[1-2][0-9][0-9]|[1-9][0-9]|[1-9]/
	};

	/**
	 * @override
	 * @inheritDoc
	 */
	FiscalFormat.oRegexParsePatterns = {
		"year": /[0-9]{1,4}/,
		"period": /[0-9]{1,3}/,
		"quarter": /[1-4]/,
		"week": /[0-9]{1,2}/,
		"day": /[1-9]/
	};

	/**
	 * @override
	 * @inheritDoc
	 */
	FiscalFormat.prototype.oSymbols = {
		"": "", // "text"
		"y": { format: FiscalFormat.oRegexFormatPatterns.year, parse: FiscalFormat.oRegexParsePatterns.year}, // "year"
		"Y": { format: FiscalFormat.oRegexFormatPatterns.year, parse: FiscalFormat.oRegexParsePatterns.year}, // "weekYear"
		"P": { format: FiscalFormat.oRegexFormatPatterns.period, parse: FiscalFormat.oRegexParsePatterns.period}, // "period"
		"W": { format: FiscalFormat.oRegexFormatPatterns.week, parse: FiscalFormat.oRegexParsePatterns.week}, // "weekInYear"
		"d": { format: FiscalFormat.oRegexFormatPatterns.day, parse: FiscalFormat.oRegexParsePatterns.day}, // "dayInYear"
		"Q": { format: FiscalFormat.oRegexFormatPatterns.quarter, parse: FiscalFormat.oRegexParsePatterns.quarter}, // "quarter"
		"q": { format: FiscalFormat.oRegexFormatPatterns.quarter, parse: FiscalFormat.oRegexParsePatterns.quarter} //"quarterStandalone"
	};


	return FiscalFormat;
});
