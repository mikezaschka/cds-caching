/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */


sap.ui.define([
    'sap/base/i18n/Localization',
    'sap/ui/core/format/NumberFormat',
    'sap/ui/core/format/DateFormat',
    'sap/ui/core/format/FileSizeFormat',
    "sap/base/i18n/date/CalendarType"
], function(Localization, NumberFormat, DateFormat, FileSizeFormat, CalendarType) {
    "use strict";

    var semicolon = ":";
    var formatFunctionsWithUTC = ["MediumYear", "MediumMonth", "MediumDay", "MediumHour",
    "MediumMinute", "MediumSecond", "YearMonthDay", "Quarter", "Week", "hh:mm", "hh:mm:ss",
    "MMM d", "d", "YearQuarter", "YearMonth"];
    /**
     * @class Provides methods set chart formatter for VizFrame.
     *
     * @public
     * @alias sap.viz.ui5.format.ChartFormatter
     */
    var ChartFormatter = function () {
        if (this.caller != this.getInstance) {
            throw new Error("This object cannot be instantiated");
        }
        this.formatFunctions = [];
        this._updatePatternTable();
        this._locale = Localization.getLanguage();

        // The following function is for CVOM info time Axis label level format
        // for internal use. These does not expose to end user.
        // So function name is hard code.
        this.formatFunctions["hh:00"] = this._getCVOMHourZeroFormatter.bind(this);
        this.formatFunctions["ss''"] = this._getCVOMSecondFormatter.bind(this);
        this.formatFunctions["MMM"] = this._getCVOMMonthFormatter.bind(this);
        this.formatFunctions["d"] = this._getCVOMDayFormater.bind(this);
    };

    // Default formatting functions
    /**
     * List (Enum) type sap.viz.ui5.format.ChartFormatter.DefaultPattern
     *
     * @enum {string}
     * @public
     */
    ChartFormatter.DefaultPattern = {
        /**
         *
         * type: Integer
         *
         * style: "short"
         *
         * e.g. 234M
         * @public
         */
        SHORTINTEGER: "ShortInteger",
        /**
         *
         * type: Integer
         *
         * style: "standard"
         *
         * e.g. 234234234
         * @public
         */
        STANDARDINTEGER: "StandardInteger",
        /**
         *
         * type: Float
         *
         * style: "short"
         *
         * e.g. 2.3M
         * @public
         */
        SHORTFLOAT: "ShortFloat",
        /**
         * type: Float
         *
         * style: "short"
         *
         * maxFractionDigits: 2
         *
         * e.g. 2.34234234 is formatted as 2.34
         * @public
         */
        SHORTFLOAT_MFD2: "ShortFloat_MFD2",
        /**
         *
         * type: Float
         *
         * style: "standard"
         *
         * e.g. 234,234.234
         * @public
         */
        STANDARDFLOAT: "StandardFloat",
        /**
         * type: Float
         *
         * style: "long"
         *
         * e.g. 2.3 million
         * @public
         */
        LONGFLOAT: "LongFloat",
        /**
         * type: Percentage
         *
         * style: "standard"
         *
         * e.g. 0.0234234 is formatted as 2.34234%
         * @public
         */
        STANDARDPERCENT: "StandardPercent",
        /**
         * type: Percentage
         *
         * style: "standard"
         *
         * maxFractionDigits: 2
         *
         * e.g. 0.0234234 is formatted as 2.34%
         * @public
         */
        STANDARDPERCENT_MFD2: "StandardPercent_MFD2",
        /**
         * type: Percentage
         *
         * style: "standard"
         *
         * e.g. 0.0234 is formatted as 2.34%
         * @public
         * @deprecated Since version 1.48.0.
         */
        PERCENT: "Percent",
        /**
         * type: Currency
         *
         * style: "standard"
         *
         * e.g. 234234.234 is formatted as 234,234.23
         * @public
         */
        STANDARDCURRENCY: "StandardCurrency",
        /**
         * type: Currency
         *
         * style: "standard"
         *
         * e.g. 234234.234 is formatted as 234,234.23
         * @public
         * @deprecated Since version 1.48.0.
         */
        CURRENCY: "Currency",
        // In first version only support below date format
        /**
         * Medium year
         *
         * e.g. 2015
         * @public
         */
        MEDIUMYEAR: "MediumYear",
        /**
         * Medium quarter
         *
         * e.g. Q3
         * @public
         */
        MEDIUMQUARTER: "MediumQuarter",
        /**
         * Quarter
         *
         * e.g. Q3
         * @public
         * @deprecated Since version 1.48.0.
         */
        QUARTER: "Quarter",
        /**
         * Medium month
         *
         * e.g. Aug
         * @public
         */
        MEDIUMMONTH: "MediumMonth",
        /**
         * Medium week
         *
         * e.g. CW35
         * @public
         */
        MEDIUMWEEK: "MediumWeek",
        /**
         * Week
         *
         * e.g. CW35
         * @public
         * @deprecated Since version 1.48.0.
         */
        WEEK: "Week",
        /**
         * Medium day
         *
         * e.g. 01
         * @public
         */
        MEDIUMDAY: "MediumDay",
        /**
         * Medium hour
         *
         * e.g. 18
         * @public
         */
        MEDIUMHOUR: "MediumHour",
        /**
         * Medium minute
         *
         * e.g. 18
         * @public
         */
        MEDIUMMINUTE: "MediumMinute",
        /**
         * Medium second
         *
         * e.g. 59
         * @public
         */
        MEDIUMSECOND: "MediumSecond",
        /**
         * Medium format pattern for combination of year, month, and day
         *
         * e.g. Aug 28, 2015
         * @public
         */
        MEDIUMYEARMONTHDAY: "MediumYearMonthDay",
        /**
         * Format pattern for combination of year, month, and day
         *
         * e.g. Aug 28, 2015
         * @public
         * @deprecated Since version 1.48.0.
         */
        YEARMONTHDAY: "YearMonthDay",
        /**
         * Binary file size
         *
         * e.g. 1 Kibibyte = 1024 Byte
         * @public
         */
        BINARYFILESIZE: "BinaryFileSize",
        /**
         * Decimal file size
         *
         * e.g. 1 Kilobyte = 1000 Byte
         * @public
         */
        DECIMALFILESIZE: "DecimalFileSize"
    };

    ChartFormatter.prototype._updatePatternTable = function () {
        this.formatFunctions["ShortInteger"] = this._getShortIntegerFormatter();
        this.formatFunctions["StandardInteger"] = this._getStandardIntegerFormatter();
        this.formatFunctions["ShortFloat"] = this._getShortFloatFormatter();
        this.formatFunctions["ShortFloat_MFD2"] = this._getShortFloatMFD2Formatter();
        this.formatFunctions["StandardFloat"] = this._getStandardFloatFormatter();
        this.formatFunctions["LongFloat"] = this._getLongFloatFormatter();
        this.formatFunctions["StandardPercent"] = this._getStandardPercentFormatter();
        this.formatFunctions["StandardPercent_MFD2"] = this._getStandardPercentMFD2Formatter();
        this.formatFunctions["Percent"] = this._getPercentFormatter();
        this.formatFunctions["StandardCurrency"] = this._getStandardCurrencyFormatter();
        this.formatFunctions["Currency"] = this._getCurrencyFormatter();
        this.formatFunctions["MediumYear"] = this._getMediumYearFormatter();
        this.formatFunctions["MediumMonth"] = this._getMediumMonthFormatter();
        this.formatFunctions["MediumDay"] = this._getMediumDayFormatter();
        this.formatFunctions["MediumHour"] = this._getMediumHourFormatter();
        this.formatFunctions["MediumMinute"] = this._getMediumMinuteFormatter();
        this.formatFunctions["MediumSecond"] = this._getMediumSecondFormatter();
        this.formatFunctions["YearMonthDay"] = this._getYearMonthDayFormatter();
        this.formatFunctions["BinaryFileSize"] = this._getBinaryFileSizeFormatter();
        this.formatFunctions["DecimalFileSize"] = this._getDecimalFileSizeFormatter();
        this.formatFunctions["Quarter"] = this._getQuarterFormatter();
        this.formatFunctions["Week"] = this._getWeekFormatter();
        this.formatFunctions["hh:mm"] = this._getHourMinuteFormatter();
        this.formatFunctions["hh:mm:ss"] = this._getHourMinuteSecondFormatter();
        this.formatFunctions["MMM d"] = this._getMonthDayFormatter();
        this.formatFunctions["YearQuarter"] = this._getYearQuarterFormatter();
        this.formatFunctions["YearMonth"] = this._getYearMonthFormatter();
        // Internal function
        this.formatFunctions["WeekYear"] = this._getWeekYearFormatter();
    };

    /**
     * Get an instance of ChartFormatter
     * @public
     */
    ChartFormatter.getInstance = function () {
        if (!this.instance) {
            this.instance = new ChartFormatter();
        }
        return this.instance;
    };

    /**
     * Format the value according to the custom format function
     * @public
     */
    ChartFormatter.prototype.format = function (value, pattern, isUTC) {
        if (pattern) {
            var currentLocale = Localization.getLanguage();
            if (this._locale !== currentLocale) {
                this._locale = currentLocale;
                this._updatePatternTable();
            }
            if (!Array.isArray(value) && isNaN(value)) {
                return value;
            }

            if (this.formatFunctions[pattern]) {
                if (formatFunctionsWithUTC.indexOf(pattern) > -1) {
                    return this.formatFunctions[pattern](value, isUTC);
                }
                return this.formatFunctions[pattern](value);
            } else {
                return "use_default_formatter";
            }
        }
        return value;
    };

    // ----
    ChartFormatter.prototype._getShortIntegerFormatter = function () {
        var numberFormatter = NumberFormat.getIntegerInstance({style: 'short'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getStandardIntegerFormatter = function () {
        var numberFormatter = NumberFormat.getIntegerInstance({style: 'standard'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getShortFloatFormatter = function () {
        var numberFormatter = NumberFormat.getFloatInstance({style: 'short'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getShortFloatMFD2Formatter = function () {
        var numberFormatter = NumberFormat.getFloatInstance({style: 'short', maxFractionDigits: 2});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getStandardFloatFormatter = function () {
        var numberFormatter = NumberFormat.getFloatInstance({style: 'standard'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getLongFloatFormatter = function () {
        var numberFormatter = NumberFormat.getFloatInstance({style: 'long'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getPercentFormatter = function () {
        var numberFormatter = NumberFormat.getPercentInstance({style: 'standard'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getStandardPercentFormatter = function () {
        var numberFormatter = NumberFormat.getPercentInstance({style: 'standard'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getStandardPercentMFD2Formatter = function () {
        var numberFormatter = NumberFormat.getPercentInstance({style: 'standard', maxFractionDigits:2});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getCurrencyFormatter = function () {
        var numberFormatter = NumberFormat.getCurrencyInstance({style: 'standard'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getStandardCurrencyFormatter = function () {
        var numberFormatter = NumberFormat.getCurrencyInstance({style: 'standard'});
        return numberFormatter.format.bind(numberFormatter);
    };

    ChartFormatter.prototype._getMediumYearFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({pattern: 'yyyy'});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getMediumMonthFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({pattern: 'MMM'});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getMediumDayFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({pattern: 'dd'});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getMediumHourFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({pattern: 'HH'});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getMediumMinuteFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({pattern: 'mm'});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getQuarterFormatter = function () {
        var dateFormatter = DateFormat.getDateInstance({pattern: "qqq"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getWeekFormatter = function () {
        return function(value, isUTC) {
            var dateFormatter = _getDateInstance({pattern: 'www', calendarType: CalendarType.Gregorian});
            return dateFormatter.format(value, isUTC);
        };
    };

    ChartFormatter.prototype._getWeekYearFormatter = function () {
        return function(value, isUTC) {
            var dateFormatter = _getDateInstance({pattern: "YYYY", calendarType: CalendarType.Gregorian});
            return dateFormatter.format(value, isUTC);
        };
    };

    ChartFormatter.prototype._getHourMinuteFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({format: "HHmm"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getCVOMHourZeroFormatter = function (value, bUTC) {
        return this.formatFunctions["MediumHour"](value, bUTC) + semicolon + "00";
    };

    ChartFormatter.prototype._getHourMinuteSecondFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({format: "HHmmss"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getYearQuarterFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({format: "yQ"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getYearMonthFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({format: "yMMM"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getCVOMSecondFormatter = function (value, bUTC) {
        return this.formatFunctions["MediumSecond"](value, bUTC) + "''";
    };

    ChartFormatter.prototype._getCVOMMonthFormatter = function (value, bUTC) {
        return this.formatFunctions["MediumMonth"](value, bUTC);
    };

    ChartFormatter.prototype._getCVOMDayFormater = function (value, bUTC) {
        return this.formatFunctions["MediumDay"](value, bUTC);
    };

    ChartFormatter.prototype._getMonthDayFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({format: "MMMdd"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getMediumSecondFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({pattern: 'ss'});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getYearMonthDayFormatter = function () {
        var dateFormatter = DateFormat.getDateTimeInstance({format: "yMMMdd"});
        return dateFormatter.format.bind(dateFormatter);
    };

    ChartFormatter.prototype._getBinaryFileSizeFormatter = function () {
        var fileSizeFormatter = FileSizeFormat.getInstance({binaryFilesize: true});
        return fileSizeFormatter.format.bind(fileSizeFormatter);
    };

    ChartFormatter.prototype._getDecimalFileSizeFormatter = function () {
        var fileSizeFormatter = FileSizeFormat.getInstance({binaryFilesize: false});
        return fileSizeFormatter.format.bind(fileSizeFormatter);
    };

    ChartFormatter.prototype.registerCustomFormatter = function (pattern, formatter) {
        this.formatFunctions[pattern] = formatter;
    };
    // options : {pattern, calendarType}
    function _getDateInstance(options) {
        var dateFormatter = DateFormat.getDateInstance({
            pattern: options.pattern,
            calendarType: options.calendarType
        });
        return dateFormatter;
    }

    return ChartFormatter;
}, true);
