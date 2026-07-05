/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/m/P13nOperationsHelper",
	"sap/m/library"
], function (
	P13nOperationsHelperBase,
	library
) {
	"use strict";
	var Operation = library.P13nConditionOperation;
	var sExcludeOperationPrefix = "Not";

	/**
	 * @private
	 * @ui5-restricted sap.ui.comp.p13n.P13nFilterPanel
	 * @version 1.136.0
	 * @alias sap.ui.comp.p13n.P13nOperationsHelper
	 */
	var P13nOperationsHelper = function () {
		P13nOperationsHelperBase.apply(this, arguments);
		this.init();
		this.oIncludeOperations.numcFiscal = [
			Operation.EQ,
			Operation.BT,
			Operation.LT,
			Operation.LE,
			Operation.GT,
			Operation.GE
		];
		this.oIncludeOperations.numc = [
			Operation.Contains,
			Operation.EQ,
			Operation.BT,
			Operation.EndsWith,
			Operation.LT,
			Operation.LE,
			Operation.GT,
			Operation.GE,
			Operation.Empty
		];
		this.oIncludeOperations.stringdate = [
			Operation.EQ,
			Operation.BT,
			Operation.LT,
			Operation.LE,
			Operation.GT,
			Operation.GE
		];
	};

	P13nOperationsHelper.prototype = Object.create(P13nOperationsHelperBase.prototype);


	P13nOperationsHelper.prototype.oIncludeOperationsOptinal = {
		"optinal": [
			Operation.Empty
		]
	};


	P13nOperationsHelper.prototype.oExcludeOperationsDefault = {
		"default": [
			Operation.NotEQ
		]
	};

	P13nOperationsHelper.prototype.oExcludeOperationsExtended = {
		"default": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"string": [
			Operation.NotContains,
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotStartsWith,
			Operation.NotEndsWith,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"date": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"stringdate": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"time": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"datetime": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"numeric": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"numc": [
			Operation.NotContains,
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotEndsWith,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE,
			Operation.NotEmpty
		],
		"numcFiscal": [
			Operation.NotEQ,
			Operation.NotBT,
			Operation.NotLT,
			Operation.NotLE,
			Operation.NotGT,
			Operation.NotGE
		],
		"boolean": [
			Operation.NotEQ
		]
	};

	P13nOperationsHelper.prototype.oExcludeOperationsOptional = {
		"optinal": [
			Operation.NotEmpty
		]
	};

	P13nOperationsHelper.prototype.isExcludeType = function (sOperation) {
		return containsOparation(sOperation, this.oExcludeOperationsExtended) ||
			containsOparation(sOperation, this.oExcludeOperationsOptional);
	};

	P13nOperationsHelper.prototype.getCorrespondingExcludeOperation = function (sOperation) {
		return sExcludeOperationPrefix + sOperation;
	};

	P13nOperationsHelper.prototype.getCorrespondingIncludeOperation = function (sOperation) {
		return sOperation.slice(sExcludeOperationPrefix.length);
	};

	function containsOparation(sSearchOperation, aOperations) {
		var i,
			sType,
			aOperationsByType,
			sOperation,
			bResult = false;

		for (sType in aOperations) {
			aOperationsByType = aOperations[sType];
			for (i = 0; i < aOperationsByType.length; i++) {
				sOperation = aOperationsByType[i];
				if (sOperation === sSearchOperation) {
					bResult = true;
					break;
				}
			}
			if (bResult) {
				break;
			}
		}

		return bResult;
	}

	return P13nOperationsHelper;

}, /* bExport= */true);
