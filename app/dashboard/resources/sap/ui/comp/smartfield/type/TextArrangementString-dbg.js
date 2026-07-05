/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/smartfield/type/TextArrangement",
	"sap/ui/comp/smartfield/type/StringNullable",
	"sap/ui/model/ValidateException"
], function(
	TextArrangementType,
	StringType,
	ValidateException
) {
	"use strict";

	var TextArrangementString = TextArrangementType.extend("sap.ui.comp.smartfield.type.TextArrangementString");

	TextArrangementString.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.TextArrangementString";
	};

	TextArrangementString.prototype.validateValue = function(vValues) {
		var oConstraints = this.oConstraints || {},
			iMaxLength = oConstraints.maxLength,
			sValue = vValues[0];

		if (this.oFormatOptions && this.oFormatOptions.textArrangement === "descriptionOnly" && (sValue && sValue.length > iMaxLength)) {
			throw new ValidateException(this.getResourceBundleText("ENTER_A_VALID_VALUE"));
		} else {
			return TextArrangementType.prototype.validateValue.apply(this, arguments);
		}
	};

	TextArrangementString.prototype.getPrimaryType = function() {
		return StringType;
	};

	return TextArrangementString;
});
