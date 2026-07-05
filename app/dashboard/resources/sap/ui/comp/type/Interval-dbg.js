/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/Formatting",
	'sap/ui/comp/util/DateTimeUtil',
	"sap/ui/core/Locale",
	'sap/ui/model/CompositeType',
	'sap/ui/model/FormatException',
	'sap/ui/model/ParseException',
	'sap/ui/model/ValidateException',
	'sap/ui/core/LocaleData'
],
	function(
		Formatting,
		DateTimeUtil,
		Locale,
		CompositeType,
		FormatException,
		ParseException,
		ValidateException,
		LocaleData
	) {
	"use strict";

	/**
	 * Constructor for a interval type for interval fields in a filter bar.
	 *
	 * @class
	 * This class represents the interval composite type.
	 *
	 * @extends sap.ui.model.CompositeType
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.63.0
	 *
	 * @private
	 * @param {object} [oFormatOptions] Formatting options.
	 * @param {object} [oFormatOptions.type] Type of the interval parts (if no type is provided the value is taken as it is.)
	 * @param {object} [oFormatOptions.delimiter] If an different delimiter that the default one should be used, it can specified here
	 * @param {object} [oConstraints] Value constraints
	 * @alias sap.ui.comp.type.Interval
	 */
	var Interval = CompositeType.extend("sap.ui.comp.type.Interval", /** @lends sap.ui.comp.type.Interval.prototype  */ {

		constructor : function () {
			CompositeType.apply(this, arguments);
			this.sName = "Interval";
			this.bUseInternalValues = true;
		}

	});

	/**
	 * Format the given array containing to an output value of type string.
	 * Other internal types than 'string' and 'any' are not supported by the interval type.
	 *
	 * If <code>aValues</code> contains only one value this will be formatted and returned. No delimiter is added in this case.
	 * If <code>aValues</code> isn't an array, a format exception is thrown.
	 * If the first element in <code>aValues</code> is not defined or null, empty string will be returned.
	 *
	 * <b>Note</b> If <code>sap.ui.model.odata.type.Time</code> is used, for compatibility reasons we expect a Date object
	 *
	 * @function
	 * @name sap.ui.comp.type.Interval.prototype.formatValue
	 * @param {array} aValues The array of values
	 * @param {string} sInternalType The target type
	 * @return {any} The formatted output value
	 *
	 * @public
	 */
	Interval.prototype.formatValue = function(aValues, sInternalType) {

		if (aValues == undefined || aValues == null) {
			return null;
		}

		if (!Array.isArray(aValues)) {
			throw new FormatException("Cannot format interval: " + aValues + " is expected as an Array but given the wrong format");
		}

		if (aValues.length < 1 || aValues.length > 2) {
			throw new FormatException("Cannot format interval: " + aValues + " is expected as an Array with 1 or 2 entries");
		}

		if (!sInternalType) {
			sInternalType = "string";
		}

		switch (this.getPrimitiveType(sInternalType)) {
			case "string":
			case "any":
				if (aValues[0] === null && (aValues.length === 1 || aValues[1] === null)) {
					return "";
				}

				var oType = this.oFormatOptions.type;
				var sPattern = _getPattern.call(this, oType);
				var sPart1;
				var sPart2;
				var sResult;

				if (oType) {
					if (oType.isA("sap.ui.model.odata.type.Time")) {
						sPart1 = oType.formatValue(_dateToTime(aValues[0]), "string");
					} else {
						sPart1 = oType.formatValue(aValues[0], "string");
					}
				} else {
					sPart1 = aValues[0];
				}

				if (aValues.length === 1 || aValues[1] === null) {
					sResult = sPart1;
				} else {
					if (oType) {
						if (oType.isA("sap.ui.model.odata.type.Time")) {
							sPart2 = oType.formatValue(_dateToTime(aValues[1]), "string");
						} else {
							sPart2 = oType.formatValue(aValues[1], "string");
						}
					} else {
						sPart2 = aValues[1];
					}
					sResult = sPattern.replace(/\{0\}/g, sPart1).replace(/\{1\}/g, sPart2);
				}

				return sResult;
			default:
				throw new FormatException("Don't know how to format Interval to " + sInternalType);
		}
	};

	/**
	 * Parse a string value to an array containing one or two values.
	 * If there is no delimiter found, the input value will be parsed as the first and
	 * only entry in the array.
	 *
	 * Parsing of other internal types than 'string' is not supported by the Interval type.
	 *
	 * <b>Note</b> If <code>sap.ui.model.odata.type.Time</code> is used, for compatibility reasons we return a Date object
	 *
	 * @function
	 * @name sap.ui.comp.type.Interval.prototype.parseValue
	 * @param {any} sValue The value to be parsed
	 * @param {string} sInternalType The source type
	 * @param {array} aCurrentValues The current values of all binding parts
	 * @return {array} The parsed result array
	 *
	 * @public
	 */
	Interval.prototype.parseValue = function(sValue, sInternalType, aCurrentValues) {

		if ((!sInternalType || sInternalType === "any") && typeof sValue === "string") {
			sInternalType = "string";
		}

		switch (this.getPrimitiveType(sInternalType)) {
			case "string":
				if (!sValue) {
					return [null, null];
				}

				var oType = this.oFormatOptions.type;
				var sPattern = _getPattern.call(this, oType);
				var sDelimiter = _getDelimiter.call(this, oType);
				var aResult = [];
				var iIndex = sValue.indexOf(sDelimiter);
				var sPart1 = null;
				var sPart2 = null;

				if (iIndex < 0 && sDelimiter.length > 1) {
					// try without spaces
					sDelimiter = sDelimiter.replace(/\s+/g,'');
					iIndex = sValue.indexOf(sDelimiter);
				}

				if (iIndex < 0 && sDelimiter !== " - " && sDelimiter !== "-") {
					sDelimiter = " - "; // as long dash can not be typed in easily
					iIndex = sValue.indexOf(sDelimiter);
				}

				if (iIndex < 0 && sDelimiter !== "-") {
					sDelimiter = "-"; // as long dash can not be typed in easily
					iIndex = sValue.indexOf(sDelimiter);
				}

				if (iIndex === 0 && sDelimiter === "-") {
					// maybe it is a negative number, check if there is another one
					iIndex = sValue.slice(1).indexOf(sDelimiter);
					if (iIndex >= 0) {
						iIndex++;
					}
				}

				if (iIndex < 0) {
					// no delimiter found -> use as single value
					sPart1 = sValue;
					if (!sPart1) {
						throw new ParseException(sValue + " is not a valid interval");
					}
				} else if (iIndex === 0) {
					sPart1 = "";
					sPart2 = sValue.slice(sDelimiter.length);
					if (!sPart2) {
						throw new ParseException(sValue + " is not a valid interval");
					}
				} else {
					sPart1 = sValue.slice(0, iIndex);
					sPart2 = sValue.slice(iIndex + sDelimiter.length);
					if (!sPart1 || !sPart2) {
						throw new ParseException(sValue + " is not a valid interval");
					}
				}

				if (oType) {
					sPart1 = oType.parseValue(sPart1, "string");
					if (oType.isA("sap.ui.model.odata.type.Time")) {
						sPart1 = _timeToDate(sPart1);
					}
					if (iIndex >= 0) {
						sPart2 = oType.parseValue(sPart2, "string");
						if (oType.isA("sap.ui.model.odata.type.Time")) {
							sPart2 = _timeToDate(sPart2);
						}
					}
				}

				if (sPattern.indexOf("{0}") < sPattern.indexOf("{1}")) {
					aResult.push(sPart1);
					aResult.push(sPart2);
				} else {
					aResult.push(sPart2);
					aResult.push(sPart1);
				}

				return aResult;
			default:
				throw new ParseException("Don't know how to parse Interval from " + sInternalType);
		}
	};

	Interval.prototype.validateValue = function(aValues) {

		if (aValues == undefined || aValues == null) {
			return;
		}

		if (!Array.isArray(aValues)) {
			throw new ValidateException("An array is expected");
		}

		if (aValues.length < 1 || aValues.length > 2) {
			throw new ValidateException("There must be only one or two values in the array");
		}

		if (aValues.length === 2 && aValues[1] !== null && typeof aValues[0] !== typeof aValues[1]) {
			throw new ValidateException("Low and high value must have the same type");
		}

		var oType = this.oFormatOptions.type;

		if (oType) {
			if (oType.isA("sap.ui.model.odata.type.Time")) {
				oType.validateValue(_dateToTime(aValues[0]));
			} else {
				oType.validateValue(aValues[0]);
			}
			if (aValues.length === 2 && aValues[1] !== null) {
				if (oType.isA("sap.ui.model.odata.type.Time")) {
					oType.validateValue(_dateToTime(aValues[1]));
				} else {
					oType.validateValue(aValues[1]);
				}
			}
		}

		if (typeof aValues[0] === "number") { // TODO: also for string?
			if (aValues.length === 2 && aValues[1] !== null && aValues[0] > aValues[1]) {
				throw new ValidateException("Low value must be smaller than high value");
			}
		} else if (aValues[0] instanceof Date) {
			if (aValues.length === 2 && aValues[1] instanceof Date && aValues[0] > aValues[1]) {
				throw new ValidateException("Low value must be smaller than high value");
			}
		}

	};

	/**
	 * Called by the framework when any localization setting has changed
	 * @private
	 */
	Interval.prototype._handleLocalizationChange = function() {
		// get current delimiter only if it's needed
		delete this._sPattern;
		delete this._sDelimiter;
	};

	function _getPattern(oType) {

		if (this.oFormatOptions.delimiter) {
			return "{0} " + this.oFormatOptions.delimiter + " {1}";
		} else if (!this._sPattern) {
			var oLocale = new Locale(Formatting.getLanguageTag());
			var oLocaleData = LocaleData.getInstance(oLocale);

			if (oType && (
					oType.isA("sap.ui.model.type.Time") || oType.isA("sap.ui.model.odata.type.Time") ||
					oType.isA("sap.ui.model.type.Date") || oType.isA("sap.ui.model.odata.type.Date") ||
					oType.isA("sap.ui.model.type.DateTime") || oType.isA("sap.ui.model.odata.type.DateTime") ||
					oType.isA("sap.ui.model.odata.type.DateTimeOffset") || oType.isA("sap.ui.model.odata.type.TimeOfDay"))) {
				// for date types use date interval pattern
				this._sPattern = oLocaleData.getIntervalPattern();
			} else {
				this._sPattern = oLocaleData.getMiscPattern("range");
			}

			return this._sPattern;
		} else {
			return this._sPattern;
		}

	}

	function _getDelimiter(oType) {

		if (this.oFormatOptions.delimiter) {
			return this.oFormatOptions.delimiter;
		} else if (!this._sDelimiter) {
			var sPattern = _getPattern.call(this, oType);
			this._sDelimiter = sPattern.replace(/\{0\}/g, "").replace(/\{1\}/g, "");
			return this._sDelimiter;
		} else {
			return this._sDelimiter;
		}

	}

	function _dateToTime(oDate) {

		if (oDate instanceof Date) {
			oDate = DateTimeUtil.localToUtc(oDate);
			return DateTimeUtil.dateToEdmTime(oDate);
		} else {
			return oDate; // let the type handle different input
		}

	}

	function _timeToDate(oTime) {

		var oDate;
		if (oTime && oTime.ms) {
			oDate = DateTimeUtil.edmTimeToDate(oTime);
			return DateTimeUtil.utcToLocal(oDate);
		} else {
			return oTime; // just use what comes around
		}

	}

	return Interval;

});