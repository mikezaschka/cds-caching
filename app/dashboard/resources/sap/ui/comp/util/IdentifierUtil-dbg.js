/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// ------------------------------------------------------------------------------------------
// Utility class used by smart controls for creating stable ids.
// ------------------------------------------------------------------------------------------
sap.ui.define(['sap/ui/base/DataType'], function(DataType) {
	"use strict";

	/**
	 * Utility class used by smart controls for creating stable ids
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var IdentifierUtil = {
		/**
		 * Static function that replaces special characters with a underscore.<br>
		 *
		 * @param {string} sName - String whose special characters shall be replaced.
		 * @returns {string} Cleaned up String
		 *
		 */
		replace: function(sName){

			var t = DataType.getType("sap.ui.core.ID");
			if (!t.isValid(sName)) {
				sName = sName.replace(/[^A-Za-z0-9_.:]+/g, "_");
				if (!t.isValid(sName)) {
					sName = "A_" + sName;
				}
			}
			return sName;
		}
	};
	return IdentifierUtil;
}, /* bExport= */true);