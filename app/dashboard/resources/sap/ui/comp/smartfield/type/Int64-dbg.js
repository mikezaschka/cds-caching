/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * 64 byte integer data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.Int64.
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.31.0
 * @extends sap.ui.model.odata.type.Int64
 * @returns {sap.ui.comp.smartfield.type.Int64} the integer implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/Int64" ], function(IntBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.Int64</code>.
	 *
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @private
	 */
	var Int64Type = IntBase.extend("sap.ui.comp.smartfield.type.Int64", {
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
	Int64Type.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = IntBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	Int64Type.prototype.destroy = function() {
		IntBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	Int64Type.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Int64";
	};

	return Int64Type;
});
