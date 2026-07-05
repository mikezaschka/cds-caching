/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Date Time data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.DateTime
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.DateTime
 * @returns {sap.ui.comp.smartfield.type.DateTime} the date time implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/DateTime" ], function(DateTimeBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.DateTime</code>.
	 *
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @private
	 */
	var DateTime = DateTimeBase.extend("sap.ui.comp.smartfield.type.DateTime", {
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
	DateTime.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = DateTimeBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	DateTime.prototype.destroy = function() {
		DateTimeBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	DateTime.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.DateTime";
	};

	return DateTime;
});
