/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * SByte data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.SByte
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.SByte
 * @returns {sap.ui.comp.smartfield.type.SByte} the byte implementation.
 */
sap.ui.define(["sap/ui/model/odata/type/SByte" ], function(SByteBase) {
	"use strict";

	/**
	 * Constructor for a primitive type <code>Edm.SByte</code>.
	 *
	 * @param {object} oFormatOptions format options
	 * @param {object} oConstraints constraints
	 * @private
	 */
	var SByteType = SByteBase.extend("sap.ui.comp.smartfield.type.SByte", {
		constructor: function(oFormatOptions, oConstraints) {
			SByteBase.apply(this, arguments);
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
	SByteType.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = SByteBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	SByteType.prototype.destroy = function() {
		SByteBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	/**
	 * Returns the type's name.
	 *
	 * @returns {string} the type's name
	 * @public
	 */
	SByteType.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.SByte";
	};

	return SByteType;
});
