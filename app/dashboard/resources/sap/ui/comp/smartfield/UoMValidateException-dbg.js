/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/model/ValidateException"
], function(ValidateException) {
	"use strict";
	/**
	 * This module is only for internal use!
	 *
	 * @class UoMValidateException is used to indicate that the ValueState target control is the UoM control.
	 * @version 1.136.0
	 * @private
	 * @extends sap.ui.model.ValidateException
	 * @alias sap.ui.comp.smartfield.UoMValidateException
	 */
	var UoMValidateException = function (message, violatedConstraints) {
		ValidateException.apply(this, arguments);
	};

	UoMValidateException.prototype = Object.create(ValidateException.prototype);

	return UoMValidateException;
});
