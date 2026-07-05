/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * String data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.String
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.String
 */
sap.ui.define([
	"sap/ui/model/odata/type/String"
], function(
	StringBase
) {
	"use strict";

	var StringType = StringBase.extend("sap.ui.comp.smartfield.type.String", {
		constructor: function(oFormatOptions, oConstraints) {
			StringBase.apply(this, arguments);
			this.oFormatOptions = oFormatOptions;
			this.oFieldControl = null;
		}
	});

	StringType.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = StringBase.prototype.parseValue.apply(this, arguments);

		if (this.oFormatOptions && this.oFormatOptions.displayFormat === "UpperCase" && oReturn && oReturn.toUpperCase ) {
			oReturn = oReturn.toUpperCase();
		}

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	StringType.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.String";
	};

	return StringType;
});
