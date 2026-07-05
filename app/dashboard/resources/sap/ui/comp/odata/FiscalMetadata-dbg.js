/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * <h3>Overview</h3>
	 *
	 * Object used to determine/retrieve Fiscal annotations for an Entity Data Model (EDM) property.
	 *
	 * This module is only for internal use!
	 *
	 * @module
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @static
	 * @alias sap.ui.comp.odata.FiscalMetadata
	 */
	var FiscalMetadata = {

	/**
	 * Checks whether the given property is some of the fiscal types.
	 *
	 * @private
	 * @static
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a property is of the fiscal types, <code>false</code> otherwise
	 */
	isFiscalValue: function(oProperty) {
		for (var i = 0; i < this.aAnnotations.length; i++) {
			if (this.isTermDefaultTrue(oProperty[this.aAnnotations[i]])) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Checks whether the Entity Data Model (EDM) property is annotated with the
	 * <code>com.sap.vocabularies.Common.v1.IsFiscalYear</code> annotation.
	 *
	 * @param {object} oProperty The EDM property from the meta model
	 * @returns {boolean} <code>true</code>, if the EDM property is annotated with the following
	 * <code>"com.sap.vocabularies.Common.v1.IsFiscalYear": { "Bool" : "true" }</code> annotation.
	 */
	isFiscalYear: function(oProperty) {
		return this.isTermDefaultTrue(oProperty["com.sap.vocabularies.Common.v1.IsFiscalYear"]);
	},

	/**
	 * Checks whether the Entity Data Model (EDM) property is annotated with the
	 * <code>com.sap.vocabularies.Common.v1.IsFiscalYearPeriod</code> annotation.
	 *
	 * @param {object} oProperty The EDM property from the meta model
	 * @returns {boolean} <code>true</code>, if the EDM property is annotated with the following
	 * <code>"com.sap.vocabularies.Common.v1.IsFiscalYearPeriod": { "Bool" : "true" }</code> annotation.
	 */
	isFiscalYearPeriod: function(oProperty) {
		return this.isTermDefaultTrue(oProperty["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"]);
	},

	/**
	 * If the property reflects a fiscal annotation and the annotation is with value <code>true</code> returns its string representation.
	 *
	 * @private
	 * @static
	 * @param {object} oProperty The OData property from the meta model
	 * annotation.
	 * @returns {string} String representation a fiscal annotation or <code>null</code>
	 */
	getFiscalAnnotationType: function(oProperty) {
		for (var i = 0; i < this.aAnnotations.length; i++) {
			var oFiscalDate = oProperty[this.aAnnotations[i]];
			var sFiscalType = this.aAnnotations[i].split('.');
			if (oFiscalDate && oFiscalDate.Bool !== "false" && sFiscalType) {
				return sFiscalType[sFiscalType.length - 1];
			}
		}

		return null;
	},

	/**
	 * Returns true if the annotation is not explicitly marked as false or if it is simply present.
	 * @private
	 * @static
	 * @param {object} oTerm The Term annotation object
	 * @returns {boolean} <code>true</code>, if the annotation exists -or- is not false
	 */
	isTermDefaultTrue: function(oTerm) {
		if (oTerm) {
			return oTerm.Bool ? oTerm.Bool !== "false" : true;
		}
		return false;
	},

	/**
	 * Updates view metadata of if needed for presentation purpose.
	 * @private
	 * @static
	 * @param {object} oViewMetadata The view metadata object
	 * @returns {object} The updated view metadata object
	 */
	updateViewMetadata: function(oViewMetadata) {
		var sAnnotationType = this.getFiscalAnnotationType(oViewMetadata);
		if (sAnnotationType === "IsFiscalYearPeriod" ||
			sAnnotationType === "IsFiscalYearQuarter" ||
			sAnnotationType === "IsFiscalYearWeek") {
			oViewMetadata.maxLength = (parseInt(oViewMetadata.maxLength) + 1).toString();
		}

		return oViewMetadata;
	},

	/**
	 * A predefined list with the fiscal annotations.
	 * @private
	 * @static
	 */
	aAnnotations: [
		"com.sap.vocabularies.Common.v1.IsFiscalYear",
		"com.sap.vocabularies.Common.v1.IsFiscalPeriod",
		"com.sap.vocabularies.Common.v1.IsFiscalYearPeriod",
		"com.sap.vocabularies.Common.v1.IsFiscalQuarter",
		"com.sap.vocabularies.Common.v1.IsFiscalYearQuarter",
		"com.sap.vocabularies.Common.v1.IsFiscalWeek",
		"com.sap.vocabularies.Common.v1.IsFiscalYearWeek",
		"com.sap.vocabularies.Common.v1.IsDayOfFiscalYear"
		//"com.sap.vocabularies.Common.v1.IsFiscalYearVariant" Not supported
	]};

	return FiscalMetadata;
});
