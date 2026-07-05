/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/chart/TimeUnitType","sap/ui/core/format/DateFormat","sap/base/i18n/date/CalendarType"],function(e,a,n){"use strict";var t={};t[e.yearmonthday]="yyyyMMdd";t[e.yearquarter]="yyyyQQQQQ";t[e.yearmonth]="yyyyMM";t[e.yearweek]="yyyyww";function r(r){var y=t[r];if(y){if(y===t[e.yearweek]){return a.getDateInstance({pattern:y,calendarType:n.Gregorian})}return a.getDateInstance({pattern:y})}else{return null}}function y(r){var y=t[r];if(y){if(y===t[e.yearweek]){return a.getDateInstance({pattern:y,calendarType:n.Gregorian},new sap.ui.core.Locale("en"))}return a.getDateInstance({pattern:y},new sap.ui.core.Locale("en"))}else{return null}}return{getInstance:r,getInstanceByEnLocal:y}});
//# sourceMappingURL=DateFormatUtil.js.map