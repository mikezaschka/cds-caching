/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/model/odata/type/Guid",
	"sap/ui/model/ValidateException",
	"sap/ui/core/Lib"
], function(GuidBase, ValidateException, Lib) {
	"use strict";

	var rGuid = /^[A-F0-9]{8}-([A-F0-9]{4}-){3}[A-F0-9]{12}$/i;

	function getErrorMessage(settings) {
		if (!settings.resourceBundle) { // workaround to fall back to default if none or empty provided
			settings.resourceBundle = 'sap.ui.core';
		}
		return Lib.getResourceBundleFor(settings.resourceBundle).getText(settings.text);
	}

	function showErrorMessage(oValidateExceptionSettings) {
		throw new ValidateException(getErrorMessage(oValidateExceptionSettings));
	}
	var Guid = GuidBase.extend("sap.ui.comp.smartfield.type.Guid", {
		constructor: function(oFormatOptions, oConstraints, oSettings) {
			GuidBase.apply(this, arguments);
			this.oSettings = oSettings;
			this.oFieldControl = null;
			this.oValidateExceptionSettings = this.oSettings && this.oSettings.validateException || {resourceBundle: "", text: "EnterGuid"};
		}
	});

	Guid.prototype.parseValue = function(sValue, sSourceType) {
		sValue = GuidBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return sValue;
	};

	Guid.prototype.validateValue = function(sValue) {
		if (sValue === null) {
			if (this.oConstraints && this.oConstraints.nullable === false) {
				showErrorMessage.call(this, this.oValidateExceptionSettings);
			}
			return;
		}
		if (typeof sValue !== "string") {
			// This is a "technical" error by calling validate w/o parse
			throw new ValidateException("Illegal " + this.getName() + " value: " + sValue);
		}
		if (!rGuid.test(sValue)) {
			showErrorMessage.call(this, this.oValidateExceptionSettings);
		}
	};

	Guid.prototype.destroy = function() {
		GuidBase.prototype.destroy.apply(this, arguments);
		this.oFieldControl = null;
	};

	Guid.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Guid";
	};

	return Guid;
});
