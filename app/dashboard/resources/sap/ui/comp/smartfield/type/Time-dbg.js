/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Time data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.Time
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.34.0
 * @extends sap.ui.model.odata.type.Time
 * @returns {sap.ui.comp.smartfield.type.Time} the time implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/Time" ], function(TimeBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.Time</code>.
	 *
	 * @param {object} oFormatOptions format options
	 * @param {object} oConstraints constraints
	 * @private
	 */
	var Time = TimeBase.extend("sap.ui.comp.smartfield.type.Time", {
		constructor: function(oFormatOptions, oConstraints) {
			TimeBase.apply(this, arguments);
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
	Time.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = TimeBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	Time.prototype.destroy = function() {
		TimeBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	Time.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Time";
	};

	return Time;
});
