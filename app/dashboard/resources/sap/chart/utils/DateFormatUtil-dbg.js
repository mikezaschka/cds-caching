/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/*
 * Parse and Format Date String depending on sap.ui.core.format.DateFormat
 */
sap.ui.define([
	'sap/chart/TimeUnitType',
	'sap/ui/core/format/DateFormat',
	'sap/base/i18n/date/CalendarType'
], function(
	TimeUnitType,
	DateFormat,
	CalendarType
) {
	"use strict";

	var PATTERN_TABLE = {};
	PATTERN_TABLE[TimeUnitType.yearmonthday] =  "yyyyMMdd";
	PATTERN_TABLE[TimeUnitType.yearquarter] =  "yyyyQQQQQ";
	PATTERN_TABLE[TimeUnitType.yearmonth] =  "yyyyMM";
	PATTERN_TABLE[TimeUnitType.yearweek] =  "yyyyww";


	function getInstance(sTimeUnitType) {
		var sPattern = PATTERN_TABLE[sTimeUnitType];
		if (sPattern) {
			if (sPattern === PATTERN_TABLE[TimeUnitType.yearweek]) {
				return DateFormat.getDateInstance({pattern: sPattern, calendarType: CalendarType.Gregorian});
			}
			return DateFormat.getDateInstance({pattern: sPattern});
		} else {
			return null;
		}
	}
	function getInstanceByEnLocal(sTimeUnitType) {
		var sPattern = PATTERN_TABLE[sTimeUnitType];
		if (sPattern) {
			if (sPattern === PATTERN_TABLE[TimeUnitType.yearweek]) {
				return DateFormat.getDateInstance({pattern: sPattern, calendarType: CalendarType.Gregorian},
					new sap.ui.core.Locale("en"));
			}
			return DateFormat.getDateInstance({pattern: sPattern}, new sap.ui.core.Locale("en"));
		} else {
			return null;
		}
	}

	return {
		getInstance: getInstance,
		getInstanceByEnLocal: getInstanceByEnLocal
	};
});
