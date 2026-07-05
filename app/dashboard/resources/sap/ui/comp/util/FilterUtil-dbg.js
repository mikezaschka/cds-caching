/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// --------------------------------------------------------------------------------
// Utility class used by smart controls for filtering
// --------------------------------------------------------------------------------
sap.ui.define([], function() {
	"use strict";

	/**
	 * Utility class used by smart controls for filtering
	 *
	 * @private
	 */
	return {

		/**
		 * Transforms operation for exclude
		 * @private
		 * @static
		 * @param {string} sOperation the input operation
		 * @returns {string} Transformed operation
		 */
		getTransformedExcludeOperation: function (sOperation) {
			var sTransformedOperation = {
				"EQ": "NE",
				"GE": "LT",
				"LT": "GE",
				"LE": "GT",
				"GT": "LE",
				"BT": "NB",
				"Contains": "NotContains",
				"StartsWith": "NotStartsWith",
				"EndsWith": "NotEndsWith"
			}[sOperation];

			return sTransformedOperation ? sTransformedOperation : sOperation;
		}

	};

});
