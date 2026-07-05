/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Date Time Offset data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.DateTimeOffset
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.DateTimeOffset
 * @returns {sap.ui.comp.smartfield.type.DateTimeOffset} the date time implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/DateTimeOffset" ], function(DateTimeBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.DateTimeOffset</code>.
	 *
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @private
	 */
	var DateTimeOffset = DateTimeBase.extend("sap.ui.comp.smartfield.type.DateTimeOffset", {
		constructor: function(oFormatOptions, oConstraints) {
			DateTimeBase.apply(this, arguments);
			this.oFieldControl = null;
		}
	});

	/**
	 * Parses the given value to JavaScript <code>Date</code>.
	 *
	 * @param {string} sValue the value to be parsed; the empty string and <code>null</code> will be parsed to <code>null</code>
	 * @param {string} sSourceType the source type (the expected type of <code>sValue</code>); must be "string".
	 * @returns {Date} the parsed value
	 * @throws {sap.ui.model.ParseException} if <code>sSourceType</code> is unsupported or if the given string cannot be parsed to a Date
	 * @public
	 */
	DateTimeOffset.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = DateTimeBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	DateTimeOffset.prototype.destroy = function() {
		DateTimeBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	DateTimeOffset.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.DateTimeOffset";
	};

	return DateTimeOffset;
});
