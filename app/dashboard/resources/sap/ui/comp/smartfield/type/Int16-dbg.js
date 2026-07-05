/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * 16 byte integer data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.Int16
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.Int16
 * @returns {sap.ui.comp.smartfield.type.Int16} the integer implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/Int16" ], function(IntBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.Int16</code>.
	 *
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @private
	 */
	var Int16Type = IntBase.extend("sap.ui.comp.smartfield.type.Int16", {
		constructor: function(oFormatOptions, oConstraints) {
			IntBase.apply(this, arguments);
			this.oFieldControl = null;
		}
	});

	/**
	 * Parses the given value to JavaScript <code>integer</code>.
	 *
	 * @param {string} sValue the value to be parsed; the empty string and <code>null</code> will be parsed to <code>null</code>
	 * @param {string} sSourceType the source type (the expected type of <code>sValue</code>); must be "string".
	 * @returns {int} the parsed value
	 * @throws {sap.ui.model.ParseException} if <code>sSourceType</code> is unsupported or if the given string cannot be parsed to a Date
	 * @public
	 */
	Int16Type.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = IntBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	Int16Type.prototype.destroy = function() {
		IntBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	Int16Type.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Int16";
	};

	return Int16Type;
});
