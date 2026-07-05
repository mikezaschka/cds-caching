/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/model/odata/type/Double"
], function(DoubleBase) {
	"use strict";

	var Double = DoubleBase.extend("sap.ui.comp.smartfield.type.Double", {
		constructor: function(oFormatOptions, oConstraints) {
			DoubleBase.apply(this, arguments);
			this.oFieldControl = null;
		}
	});

	Double.prototype.parseValue = function(sValue, sSourceType) {
		sValue = DoubleBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return sValue;
	};

	Double.prototype.destroy = function() {
		DoubleBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	Double.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Double";
	};

	return Double;
});
