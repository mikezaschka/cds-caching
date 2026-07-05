/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// --------------------------------------------------------------------------------------------
// Class used to determine/retrieve criticality info based on the annotation UI.CriticalityType
// --------------------------------------------------------------------------------------------
sap.ui.define([], function() {
	"use strict";

	var mCriticalityValue = {
		"com.sap.vocabularies.UI.v1.CriticalityType/Neutral": 0,
		"com.sap.vocabularies.UI.v1.CriticalityType/Negative": 1,
		"com.sap.vocabularies.UI.v1.CriticalityType/Critical": 2,
		"com.sap.vocabularies.UI.v1.CriticalityType/Positive": 3,
		"0": 0,
		"1": 1,
		"2": 2,
		"3": 3
	};

	var mCriticalityToState = {
		0: "None",
		1: "Error",
		2: "Warning",
		3: "Success"
	};

	var mCriticalityToIcon = {
		0: null,
		1: "sap-icon://error",
		2: "sap-icon://alert",
		3: "sap-icon://sys-enter-2"
	};

	/**
	 * Object used to determine/retrieve criticality info based on the annotation UI.CriticalityType
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var CriticalityMetadata = {
		/**
		 * Get the state based on Annotation UI.CriticalityType
		 *
		 * @public
		 * @param {string} sType - The Annotation criticality type value
		 * @returns {string} the state (if found)
		 */
		getCriticalityState: function(sType) {
			if (typeof sType === "string") {
				sType = mCriticalityValue[sType];
			}
			return mCriticalityToState[sType];
		},

		/**
		 * Get the UI5 icon based on Annotation UI.CriticalityType
		 *
		 * @public
		 * @param {string} sType - The Annotation criticality type vaue
		 * @returns {string} the icon (if found)
		 */
		getCriticalityIcon: function(sType) {
			if (typeof sType === "string") {
				sType = mCriticalityValue[sType];
			}
			return mCriticalityToIcon[sType];
		},

		/**
		 * Determines whether an icon is shown based on the annotation UI.CriticalityRepresentationType.
		 *
		 * @public
		 * @param {string} sType - The value of the UI.CriticalityRepresentationType annotation
		 * @returns {boolean} false (if criticality icon is not shown)
		 */
		getShowCriticalityIcon: function(sType) {
			return sType === "com.sap.vocabularies.UI.v1.CriticalityRepresentationType/WithoutIcon" ? false : true;
		}
	};

	return CriticalityMetadata;

}, /* bExport= */true);
