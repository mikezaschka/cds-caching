/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// -------------------------------------------------------------------------------
// Class used to determine/retrieve OData type based on the Edm type of a property
// -------------------------------------------------------------------------------
sap.ui.define([
	'sap/ui/model/odata/type/Boolean',
	'sap/ui/model/odata/type/Byte',
	'sap/ui/model/odata/type/DateTime',
	'sap/ui/model/odata/type/DateTimeOffset',
	'sap/ui/model/odata/type/Decimal',
	'sap/ui/model/odata/type/Double',
	'sap/ui/model/odata/type/Single',
	'sap/ui/model/odata/type/Guid',
	'sap/ui/model/odata/type/Int16',
	'sap/ui/model/odata/type/Int32',
	'sap/ui/model/odata/type/Int64',
	'sap/ui/model/odata/type/SByte',
	'sap/ui/model/odata/type/String',
	'sap/ui/model/odata/type/Time',
	'sap/ui/comp/odata/type/StringDate',
	'sap/ui/comp/odata/type/FiscalDate',
	'sap/ui/comp/odata/type/NumericText',
	'sap/ui/model/odata/type/DateTimeWithTimezone',
	'sap/ui/comp/odata/type/CalendarDate'
], function(Boolean,
			Byte,
			DateTime,
			DateTimeOffset,
			Decimal,
			Double,
			Single,
			Guid,
			Int16,
			Int32,
			Int64,
			SByte,
			String,
			Time,
			StringDate,
			FiscalDate,
			NumericText,
			DateTimeWithTimezone,
			CalendarDate
) {
	"use strict";

	// @see sap.ui.model.odata.type for below types
	var mUi5TypeForEdmType = {
		"Edm.Boolean": Boolean,
		"Edm.Byte": Byte,
		"Edm.DateTime": DateTime,
		"Edm.DateTimeOffset": DateTimeOffset,
		"Edm.Decimal": Decimal,
		"Edm.Double": Double,
		"Edm.Float": Single,
		"Edm.Guid": Guid,
		"Edm.Int16": Int16,
		"Edm.Int32": Int32,
		"Edm.Int64": Int64,
		"Edm.SByte": SByte,
		"Edm.Single": Single,
		"Edm.String": String,
		"Edm.Time": Time
	};

	var mDefaultTypeForEdmType = {
		"Edm.Boolean": "Bool",
		"Edm.Byte": "Int",
		"Edm.DateTime": "Date",
		"Edm.DateTimeOffset": "DateTimeOffset",
		"Edm.Decimal": "Decimal",
		"Edm.Double": "Float",
		"Edm.Float": "Float",
		"Edm.Guid": "Guid",
		"Edm.Int16": "Int",
		"Edm.Int32": "Int",
		"Edm.Int64": "Int",
		"Edm.SByte": "Int",
		"Edm.Single": "Float",
		"Edm.String": "String",
		"Edm.Time": "TimeOfDay"
	};

	var mNumericType = {
		"Edm.Byte": true,
		"Edm.Decimal": true,
		"Edm.Double": true,
		"Edm.Float": true,
		"Edm.Int16": true,
		"Edm.Int32": true,
		"Edm.Int64": true,
		"Edm.SByte": true,
		"Edm.Single": true
	};

	var mDateOrTimeType = {
		"Edm.DateTime": true,
		"Edm.DateTimeOffset": true,
		"Edm.Time": true
	};

	/**
	 * Object used to determine/retrieve OData model type and other relevant attributes based on the Edm type (primitive types) of an OData property.
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var ODataType = {
		/**
		 * Create/Get the OData type based on Edm type.
		 *
		 * @public
		 * @param {string} sType - The Edm type from OData property
		 * @param {object} oFormatOptions format options as defined in the interface of {@link sap.ui.model.SimpleType}
		 * @param {object} oConstraints constraints as defined in interface of {@link sap.ui.model.SimpleType} or its concrete subclasses
		 * @param {boolean|object} [vSettings] Settings object or a boolean. If <code>true</code> it is the StringDate {@link sap.ui.comp.odata.type.StringDate} if <code>false</code>
		 *        the type is defined by the Edm.type
		 * @param {boolean} [vSettings.isCalendarType] Indicates if the property is of the CalendarDate {@link sap.ui.comp.odata.type.CalendarDate} type
		 * @param {boolean} [vSettings.isFiscalDate] Indicates if the property is of the FiscalDate {@link sap.ui.comp.odata.type.FiscalDate} types
		 * @param {boolean} [vSettings.fiscalType] The Fiscal Annotation type.
		 * @returns {sap.ui.model.SimpleType} the OData type
		 */
		getType: function (sType, oFormatOptions, oConstraints, vSettings) {
			var oType = null, _oType;

			if (vSettings) {
				if (vSettings.isCalendarType && vSettings.calendarType) {
					return new CalendarDate(oFormatOptions, oConstraints, {
						calendarType:  vSettings.calendarType
					});
				}

				if (typeof vSettings === "boolean" || vSettings.isCalendarDate) {
					return new StringDate(oFormatOptions);
				}

				if (vSettings.isFiscalDate && vSettings.fiscalType) {
					return new FiscalDate(oFormatOptions, oConstraints, {
						fiscalType:  vSettings.fiscalType
					});
				}

				if (oConstraints && oConstraints.isDigitSequence) {
					return new NumericText(oFormatOptions, oConstraints);
				}

				if (vSettings.isTimezone) {
					return new DateTimeWithTimezone(oFormatOptions);
				}
			}

			_oType = mUi5TypeForEdmType[sType];

			if (_oType) {
				oType = new _oType(oFormatOptions, oConstraints);
			}
			return oType;
		},
		/**
		 * Returns whether the specified type is numeric or not.
		 *
		 * @public
		 * @param {string} sType - The Edm type from OData property
		 * @returns {boolean} true|false
		 */
		isNumeric: function(sType) {
			return mNumericType[sType] ? true : false;
		},
		/**
		 * Returns whether the specified type is date (or time or datetime) or not.
		 *
		 * @public
		 * @param {string} sType - The Edm type from OData property
		 * @returns {boolean} true|false
		 */
		isDateOrTime: function(sType) {
			return mDateOrTimeType[sType] ? true : false;
		},
		/**
		 * Returns the name of the property that contains the default value (e.g. in an annotation) for the specified edm Type.
		 *
		 * @public
		 * @param {string} sType - The Edm type from OData property.
		 * @returns {string} property name containing the value.
		 */
		getDefaultValueTypeName: function(sType) {
			return mDefaultTypeForEdmType[sType];
		},
		/**
		 * Returns the name of the specified type. Basically this is the name of edm type without the "Edm." prefix.
		 *
		 * @public
		 * @param {string} sType - The Edm type from OData property.
		 * @returns {string} the type name.
		 */
		getTypeName: function(sType) {
			if (sType.indexOf("Edm.") === 0) {
				return sType.substring(4); // remove "Edm." prefix
			}
			return sType;
		}
	};

	return ODataType;

}, /* bExport= */true);
