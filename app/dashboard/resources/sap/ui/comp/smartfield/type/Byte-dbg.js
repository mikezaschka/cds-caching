/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/model/odata/type/Byte"
], function(ByteBase) {
	"use strict";

	var Byte = ByteBase.extend("sap.ui.comp.smartfield.type.Byte", {
		constructor: function(oFormatOptions, oConstraints) {
			ByteBase.apply(this, arguments);
			this.oFieldControl = null;
		}
	});

	Byte.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = ByteBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	Byte.prototype.destroy = function() {
		ByteBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	Byte.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Byte";
	};

	return Byte;
});
