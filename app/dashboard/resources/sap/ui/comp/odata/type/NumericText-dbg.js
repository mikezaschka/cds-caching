/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/library",
	"sap/ui/comp/smartfield/type/String"

], function(Core, coreLibrary, String) {
	"use strict";

	var NumericText = String.extend("sap.ui.comp.odata.type.NumericText", {
		constructor: function(oFormatOptions, oConstraints) {
			if (oFormatOptions && oFormatOptions.isStringNullable) {
				oFormatOptions = Object.assign({parseKeepsEmptyString: true}, oFormatOptions);
			}
			String.call(this, oFormatOptions, oConstraints);
			this.oZerosRegex = new RegExp("^[0]*$");
		}
	});

	/**
	 * Parses the given value which is expected to be of the numeric text to a string.
	 *
	 * @param {string|number|boolean} vValue
	 *   The value to be parsed
	 *@param {string} sSourceType
	 *   The type of the source
	 *@param {boolean} bSkippedFormatting
	 *   Flag for skipping formatting of the type
	 * @returns {string}
	 *   The parsed value
	 * @override
	 * @private
	 */
	NumericText.prototype.parseValue = function(vValue, sSourceType, bSkippedFormatting) {
		if (this.oZerosRegex.test(vValue) && !bSkippedFormatting) {

			// for empty values call fieldControl function to activate mandatory check
			if (typeof this.oFieldControl === "function") {
				this.oFieldControl(vValue, sSourceType);
			}

			if (this.oFormatOptions && (this.oFormatOptions.bFixedKey || this.oFormatOptions.textArrangement)) {
				return vValue;
			}

			// When parseKeepsEmptyString is set we shaw return empty string
			// instead of null.
			//
			// Note:This is a holistic decision based on presumption
			// clientSideMandatoryCheck is set to "false" and nullable=false
			// from the presence of parseKeepsEmptyString.
			// Currently, nullable is not propagated internally by the ODataTypes
			// class and this should be corrected.
			if (this.oFormatOptions && this.oFormatOptions.parseKeepsEmptyString) {
				return "";
			}

			return null;
		}

		return String.prototype.parseValue.apply(this, arguments);
	};

	/**
	 * Formats the given value to the given numeric text.
	 *
	 * @param {string} sValue
	 *   The value to be formatted
	 *@param {string} sSourceType
	 *   The type of the source
	 *@param {boolean} bSkippedFormatting
	 *   Flag for skipping formatting of the type
	 * @returns {string|number|boolean}
	 *   The formatted output value; contains only <code>0</code> is formatted
	 *   to <code>null</code> if <code>bSkippedFormatting</code> is not <code>true</code>.
	 * @function
	 * @override
	 * @private
	 */
	NumericText.prototype.formatValue = function(sValue, sSourceType, bSkippedFormatting) {
		if (this.oZerosRegex.test(sValue)) {

			if (this.oFormatOptions && this.oFormatOptions?.bFixedKey) {
				return sValue;
			}

			if (this.oFormatOptions && this.oFormatOptions.textArrangement && sValue.toString().length !== 1) {
				return sValue;
			}

			if (bSkippedFormatting) {
				return "0";
			}

			return "";
		}

		if (sValue === null && this.oFormatOptions && this.oFormatOptions.isStringNullable) {
			return null;
		}


		return String.prototype.formatValue.apply(this, arguments);
	};

	NumericText.prototype.getName = function() {
		return "sap.ui.comp.odata.type.NumericText";
	};

	/**
	 * @inheritDoc
	 */
	NumericText.prototype.destroy = function() {
		String.prototype.destroy.apply(this, arguments);
	};

	return NumericText;
});
