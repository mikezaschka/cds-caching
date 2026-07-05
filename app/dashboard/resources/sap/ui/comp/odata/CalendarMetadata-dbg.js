/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// ----------------------------------------------------------------------------------
// Class used to determine/retrieve Calendar annotations for an OData property
// ----------------------------------------------------------------------------------
sap.ui.define([], function() {
	"use strict";

	// Some Calendar annotations chosen from: com.sap.vocabularies.Common.v1 SAP vocabulary
	var mCalendarValues = [
		"com.sap.vocabularies.Common.v1.IsCalendarDate",
		"com.sap.vocabularies.Common.v1.IsCalendarYear",
		"com.sap.vocabularies.Common.v1.IsCalendarWeek",
		"com.sap.vocabularies.Common.v1.IsCalendarMonth",
		"com.sap.vocabularies.Common.v1.IsCalendarQuarter",
		"com.sap.vocabularies.Common.v1.IsCalendarYearWeek",
		"com.sap.vocabularies.Common.v1.IsCalendarYearMonth",
		"com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"
	];

	/**
	 * Object used to determine/retrieve determine/retrieve Calendar annotations for an OData property
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var CalendarMetadata = {
		isDate: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[0]]); // "com.sap.vocabularies.Common.v1.IsCalendarDate"
		},
		isYear: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[1]]); // "com.sap.vocabularies.Common.v1.IsCalendarYear"
		},
		isWeek: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[2]]); // "com.sap.vocabularies.Common.v1.IsCalendarWeek"
		},
		isMonth: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[3]]); // "com.sap.vocabularies.Common.v1.IsCalendarMonth"
		},
		isQuarter: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[4]]); // "com.sap.vocabularies.Common.v1.IsCalendarQuarter"
		},
		isYearWeek: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[5]]); // "com.sap.vocabularies.Common.v1.IsCalendarYearWeek"
		},
		isYearMonth: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[6]]); // "com.sap.vocabularies.Common.v1.IsCalendarYearMonth"
		},
		isYearQuarter: function(oField) {
			return this._isDefaultTrue(oField[mCalendarValues[7]]); // "com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"
		},

		isCalendarValue: function(oField) {
			return this._isMatching(oField, mCalendarValues);
		},

		_isMatching: function(oField, mMap) {
			var bMatch = false;
			for (var i = 0; i < mMap.length; i++) {
				if (this._isDefaultTrue(oField[mMap[i]])) {
					bMatch = true;
					break;
				}
			}
			return bMatch;
		},
		_isDefaultTrue: function(oTerm) {
			if (oTerm) {
				return oTerm.Bool ? oTerm.Bool !== "false" : true;
			}
			return false;
		},

		/**
		 * Updates view metadata if needed for presentation purpose.
		 * @private
		 * @static
		 * @param {object} oViewMetadata The view metadata object
		 * @returns {object} The updated view metadata object
		 */
		updateViewMetadata: function(oViewMetadata) {
			var sAnnotationType = this.getCalendarAnnotationType(oViewMetadata);
			if ((sAnnotationType === "IsCalendarYearQuarter" ||
				sAnnotationType === "IsCalendarYearWeek" ||
				sAnnotationType === "IsCalendarYearMonth")
				&& oViewMetadata.maxLength) {
				oViewMetadata.maxLength = (parseInt(oViewMetadata.maxLength) + 1).toString();
			}

			return oViewMetadata;
		},

		/**
		 * If the property reflects a calendar annotation and the annotation is with value <code>true</code> returns its string representation.
		 *
		 * @private
		 * @static
		 * @param {object} oProperty The OData property from the meta model
		 * annotation.
		 * @returns {string} String representation of calendar annotation or <code>null</code>
		 */
		getCalendarAnnotationType: function(oProperty) {
			// starting from index 1, because for IsCalendarDate we don't have a type, we used StringDate
			for (var i = 1; i < mCalendarValues.length; i++) {
				var oCalendarDate = oProperty[mCalendarValues[i]];
				var sCalendarType = mCalendarValues[i].split('.');
				if (oCalendarDate && oCalendarDate.Bool !== "false" && sCalendarType) {
					return sCalendarType[sCalendarType.length - 1];
				}
			}

			return null;
		}
	};

	return CalendarMetadata;
});
