/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/FormatException",
	"sap/ui/model/ParseException",
	"sap/ui/model/SimpleType"
], function(FormatException, ParseException, SimpleType) {
	"use strict";

	/**
	 * Constructor for an ABAP Boolean type.
	 *
	 * @class
	 * ABAP Boolean data type.
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.28.0
	 * @extends sap.ui.model.SimpleType
	 * @alias sap.ui.comp.smartfield.type.AbapBool
	 */
	var AbapBool = SimpleType.extend("sap.ui.comp.smartfield.type.AbapBool", {
		constructor: function() {
			SimpleType.apply(this, arguments);
			this.sName = "sap.ui.comp.smartfield.type.AbapBool";
		}
	});

	/**
	 * Formats the given boolean value to the given target type.
	 *
	 * @param {boolean} bValue the value to be formatted
	 * @param {string} sTargetType the target type; may be "any" or "boolean".
	 * @returns {boolean} the formatted output value in the target type; <code>undefined</code> or <code>null</code> are formatted to
	 *          <code>null</code>
	 * @throws {sap.ui.model.FormatException} if <code>sTargetType</code> is unsupported.
	 * @public
	 */
	AbapBool.prototype.formatValue = function(bValue, sTargetType) {
		if (bValue === undefined || bValue === null) {
			return null;
		}

		switch (sTargetType) {
			case "boolean":
			case "any":
				return bValue === "X";
			default:
				throw new FormatException("Don't know how to format Boolean to " + sTargetType);
		}
	};

	/**
	 * Parses the given value from the given type to a boolean.
	 *
	 * @param {boolean} oValue the value to be parsed.
	 * @param {string} sSourceType the source type, may be "boolean".
	 * @returns {boolean} the parsed value.
	 * @throws {sap.ui.model.ParseException} if <code>sSourceType</code> is unsupported or if the given string is neither "X" nor "".
	 * @public
	 */
	AbapBool.prototype.parseValue = function(oValue, sSourceType) {
		switch (sSourceType) {
			case "boolean":
				return (oValue === true) ? "X" : "";
			default:
				throw new ParseException("Don't know how to parse Boolean from " + sSourceType);
		}
	};

	/**
	 * Validates whether the given value in model representation is valid and meets the given constraints.
	 *
	 * @param {boolean} sValue the value to be validated.
	 * @throws {sap.ui.model.ValidateException} if the value is not valid
	 * @public
	 */
	AbapBool.prototype.validateValue = function(sValue) {
		if (sValue !== null && sValue !== undefined) {
			if (sValue !== "X" && sValue !== "") {
				throw new ParseException("Invalid Boolean " + sValue);
			}
		}
	};

	return AbapBool;

});