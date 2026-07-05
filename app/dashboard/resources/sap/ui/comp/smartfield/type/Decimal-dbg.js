/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Decimal data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.Decimal
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.Decimal
 * @returns {sap.ui.comp.smartfield.type.Decimal} the decimal implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/Decimal"], function (DecimalBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.Decimal</code>.
	 *
	 * @param {object} oFormatOptions format options.
	 * @param {object} oConstraints constraints.
	 * @private
	 */
	var DecimalType = DecimalBase.extend("sap.ui.comp.smartfield.type.Decimal", {
		constructor: function (oFormatOptions, oConstraints) {
			DecimalBase.apply(this, arguments);
			this.oFieldControl = null;
		}
	});

	/**
	 * Parses the given value to JavaScript <code>decimal</code>.
	 *
	 * @param {string} sValue the value to be parsed; the empty string and <code>null</code> will be parsed to <code>null</code>
	 * @param {string} sSourceType the source type (the expected type of <code>sValue</code>); must be "string".
	 * @returns {decimal} the parsed value
	 * @throws {sap.ui.model.ParseException} if <code>sSourceType</code> is unsupported or if the given string cannot be parsed to a Date
	 * @public
	 */
	DecimalType.prototype.parseValue = function (sValue, sSourceType) {
		var oReturn = DecimalBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	DecimalType.prototype.destroy = function() {
		DecimalBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	DecimalType.prototype.getName = function () {
		return "sap.ui.comp.smartfield.type.Decimal";
	};

	return DecimalType;
});
