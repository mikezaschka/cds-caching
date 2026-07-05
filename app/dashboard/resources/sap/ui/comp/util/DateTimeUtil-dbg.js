/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// --------------------------------------------------------------------------------
// Utility class used by smart controls for date/time conversions
// --------------------------------------------------------------------------------
sap.ui.define([
	"sap/base/i18n/Localization",
	'sap/ui/core/date/UI5Date',
	'sap/ui/core/format/TimezoneUtil'
], function(
	Localization,
	UI5Date,
	TimezoneUtil
) {
	"use strict";

	var jsonDateRE = /^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/,
		UI_TIMEZONE = Localization.getTimezone();

	/**
	 * Utility class used by smart controls for date/time conversions
	 *
	 * @private
	 */
	var DateTimeUtil = {
		/**
		 * Convert time part of a JS Date object from local time to UTC
		 *
		 * Returns a new date object, where the UTC time is set to the same value as
		 * the local time on the original date object.
		 *
		 * If a date has a local time of to 14:00 GMT+0200, the resulting date will have
		 * 14:00 UTC on the same day.
		 *
		 * @param {Date} oDate the date to convert
		 * @returns {Date} a new date object with converted time
		 * @private
		 */
		localToUtc: function(oDate) {
			var oParsedDate,
				sPadString = "0",
				/// sDate pattern is "YYYY-MM-DDTHH:mm:ss.sssZ" where "Z" stands for UTC
				// We create the date part passing a string to the Date constructor,
				// because this is the only way that I found to create dates with years starting with zeros like "0010".
				sDate = oDate.getFullYear().toString().padStart(4, sPadString) + "-" +
						(oDate.getMonth() + 1).toString().padStart(2, sPadString) + "-" +
						oDate.getDate().toString().padStart(2, sPadString) + "T00:00:00.000Z";

			oParsedDate = UI5Date.getInstance(sDate);

			// When dates are created from string, Safari may create dates with wrong milliseconds.
			// Just to be sure we set the whole time part explicitlly
			oParsedDate.setUTCHours(oDate.getHours());
			oParsedDate.setUTCMinutes(oDate.getMinutes());
			oParsedDate.setUTCSeconds(oDate.getSeconds());
			oParsedDate.setUTCMilliseconds(oDate.getMilliseconds());

			return oParsedDate;
		},

		/**
		 * Convert time part of a JS Date object from UTC to local time
		 *
		 * Returns a new date object, where the local time is set to the same value as
		 * the UTC time on the original date object.
		 *
		 * If a date has a time of to 14:00 UTC, the resulting date will have
		 * 14:00 GMT+0200 on the same day.
		 *
		 * Please be aware that due to summer/winter time and changes in timezones,
		 * not all times can be converted to local time.
		 *
		 * @param {Date} oDate the date to convert
		 * @returns {Date} a new date object with converted time
		 * @private
		 */
		utcToLocal: function(oDate) {
			var oParsedDate,
				sPadString = "0",
				/// sDate pattern is "YYYY-MM-DDTHH:mm:ss.sss"
				// We create the date part passing a string to the Date constructor,
				// because this is the only way that I found to create dates with years starting with zeros like "0010".
				sDate = oDate.getUTCFullYear().toString().padStart(4, sPadString) + "-" +
						(oDate.getUTCMonth() + 1).toString().padStart(2, sPadString) + "-" +
						oDate.getUTCDate().toString().padStart(2, sPadString) + "T00:00:00.000";

				oParsedDate = UI5Date.getInstance(sDate);

				// When dates are created from string, Safari may create dates with wrong milliseconds.
				// Just to be sure we set the whole time part explicitlly
				oParsedDate.setHours(oDate.getUTCHours());
				oParsedDate.setMinutes(oDate.getUTCMinutes());
				oParsedDate.setSeconds(oDate.getUTCSeconds());
				oParsedDate.setMilliseconds(oDate.getUTCMilliseconds());

			return oParsedDate;
		},

		/**
		 * Convert date object to Edm.Time object
		 *
		 * Returns the date object as specially formed JS object, containing
		 * type information and time in milliseconds, as used in the ODataModel.
		 *
		 * @param {Date} oDate
		 * @returns {Object} the time object
		 */
		dateToEdmTime: function(oDate) {
			return {
				__edmType: "Edm.Time",
				ms: oDate.valueOf()
			};
		},

		/**
		 * Convert Edm.Time object to date object
		 *
		 * Returns the time object, which is a specially formed JS object, containing
		 * type information and time in milliseconds, converted to a JS Date, with
		 * the time as UTC on 1st of January 1970.
		 *
		 * @param {Object} oTime
		 * @returns {Date} the date object
		 */
		edmTimeToDate: function(oTime) {
			return UI5Date.getInstance(oTime.ms);
		},

		/**
		 * Adapt the precision of a date object
		 *
		 * A JS date object may contain milliseconds, where the corresponding backend
		 * type does not. To avoid rounding issues this method can be used to reduce
		 * the precision to the given amount of fraction digits.
		 *
		 * Returns the same date object, if no adaption is necessary or a new date
		 * object with the required precision.
		 *
		 * @param {Date} oDate the date to adapt
		 * @param {number} iPrecision the precision to apply
		 * @returns {Date} the resulting date object
		 * @private
		 */
		adaptPrecision: function(oDate, iPrecision) {
			var iMilliseconds = oDate.getMilliseconds(),
				oResultDate;
			if (isNaN(iPrecision) || iPrecision >= 3 || iMilliseconds === 0) {
				return oDate;
			}
			if (iPrecision === 0) {
				iMilliseconds = 0;
			} else if (iPrecision === 1) {
				iMilliseconds = Math.floor(iMilliseconds / 100) * 100;
			} else if (iPrecision === 2) {
				iMilliseconds = Math.floor(iMilliseconds / 10) * 10;
			}
			oResultDate = UI5Date.getInstance(oDate);
			oResultDate.setMilliseconds(iMilliseconds);
			return oResultDate;
		},

		/**
		 * Checks a date object to only contain date without time
		 *
		 * When the JS date object is used for storing date information only, the hours,
		 * minutes, seconds and milliseconds should be set to zero.
		 *
		 * @param {Date} oDate the date to check
		 * @param {boolean} bUTC whether the time should be 0 o'clock local time or UTC
		 * @returns {boolean} whether the time part is zero
		 */
		isDate: function(oDate, bUTC) {
			if (bUTC) {
				return oDate.getUTCHours() === 0 &&
					oDate.getUTCMinutes() === 0 &&
					oDate.getUTCSeconds() === 0 &&
					oDate.getUTCMilliseconds() === 0;
			} else {
				return oDate.getHours() === 0 &&
					oDate.getMinutes() === 0 &&
					oDate.getSeconds() === 0 &&
					oDate.getMilliseconds() === 0;
			}
		},

		/**
		 * Checks a date object to be a valid
		 *
		 * @param {object} oDate the object to check
		 * @returns {boolean} whether the parameter is a valid Date object
		 *
		 * @protected
		 */
		_isValidDateObject: function(oDate) {
			return oDate && Object.prototype.toString.call(oDate) === "[object Date]" && !isNaN(oDate);
		},

		/**
		 * Normalize date only date object
		 *
		 * When a JS date object is used for storing date information only, the hours,
		 * minutes, seconds and milliseconds should be set to zero.
		 *
		 * Returns the same date object, if no normalization is needed or a new date
		 * object, with time part set to zero, either local time or UTC depending on the
		 * UTC flag.
		 *
		 * @param {Date} oDate the date to convert
		 * @param {boolean} bUTC whether to normalize to 0:00 UTC instead of local time
		 */
		normalizeDate: function(oDate, bUTC) {
			var oResultDate;
			if (this.isDate(oDate, bUTC)) {
				return oDate;
			}
			oResultDate = UI5Date.getInstance(oDate);
			if (bUTC) {
				oResultDate.setUTCHours(0, 0, 0, 0);
			} else {
				oResultDate.setHours(0, 0, 0, 0);
			}
			return oResultDate;
		},

		toTimezone: function(oDate, sTimeZone) {
			if (!(oDate instanceof Date)) {
				oDate = UI5Date.getInstance(oDate);
			}

			if (TimezoneUtil.isValidTimezone(sTimeZone)) {
				return TimezoneUtil.convertToTimezone(oDate, sTimeZone);
			}

			return oDate;
		},

		localToUiTimezone: function(oDate) {
			var oUiTimezoneDate = UI5Date.getInstance(oDate.toLocaleString('en-US', {
				timeZone: UI_TIMEZONE
			}));

			var iDiff = oDate.getTime() - oUiTimezoneDate.getTime();

			return UI5Date.getInstance(oDate.getTime() - iDiff);
		},

		uiTimezoneToLocal: function(oDate) {
			if (!(oDate instanceof Date)) {
				oDate = UI5Date.getInstance(oDate);
			}
			var oUiTimezoneDate = UI5Date.getInstance(oDate.toLocaleString('en-US', {
				timeZone: UI_TIMEZONE
			}));

			var iDiff = oUiTimezoneDate.getTime() - oDate.getTime();
			return UI5Date.getInstance(oDate.getTime() - iDiff);
		},

		uiTimezoneToUtc: function(oDate) {
			var oUtcDate = UI5Date.getInstance(oDate.toLocaleString('en-US', {
				timeZone: "UTC"
			}));
			var oInvdate = UI5Date.getInstance(oDate.toLocaleString('en-US', {
				timeZone: UI_TIMEZONE
			}));

			var iDiff = oInvdate.getTime() - oUtcDate.getTime();

			return UI5Date.getInstance(oDate.getTime() - iDiff);
		},

		localToTimezone: function(oDate, sTimezone) {
			if (!TimezoneUtil.isValidTimezone(sTimezone)){
				return oDate;
			}

			var oTimezoneDate = UI5Date.getInstance(oDate.toLocaleString('en-US', {
				timeZone: sTimezone
			}));
			var oUiTimezoneDate = UI5Date.getInstance(oDate.toLocaleString('en-US', {
				timeZone: UI_TIMEZONE
			}));

			var iDiff = oUiTimezoneDate.getTime() - oTimezoneDate.getTime();

			return UI5Date.getInstance(oDate.getTime() - iDiff);
		},

		/**
		 * Parses the JSON Date representation into a Date object.
		 * This method is copied from datajs.js
		 *
		 * @param {string} value String value to parse.
		 * @returns {Date|boolean} A Date object if the value matches one; false otherwise.
		 *
		 * @private
		 */
		_parseJsonDateString: function (value) {
			var arr = value && jsonDateRE.exec(value);
			if (arr) {
				// 0 - complete results; 1 - ticks; 2 - sign; 3 - minutes
				var result = UI5Date.getInstance(parseInt(arr[1]));
				if (arr[2]) {
					var mins = parseInt(arr[3]);
					if (arr[2] === "-") {
						mins = -mins;
					}

					// The offset is reversed to get back the UTC date, which is
					// what the API will eventually have.
					var current = result.getUTCMinutes();
					result.setUTCMinutes(current - mins);
					result.__edmType = "Edm.DateTimeOffset";
					// result.__offset = minutesToOffset(mins);
				}
				if (!isNaN(result.valueOf())) {
					return result;
				}
			}
		},

		/**
		 * Checks if a string contains JSON Date string
		 *
		 * @param {string} sValue String value to check
		 * @returns {boolean}
		 *
		 * @private
		 */
		_hasJsonDateString: function (sValue) {
			return jsonDateRE.test(sValue);
		}

	};

	return DateTimeUtil;
});
