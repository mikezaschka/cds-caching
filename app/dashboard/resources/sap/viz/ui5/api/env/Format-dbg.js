/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * Provides methods set global formatter for VizFrame.
	 *
	 * @namespace
	 * @public
	 * @since 1.24.0
	 * @alias sap.viz.ui5.api.env.Format
	 */
	var Format = {};

	/**
	 * Customize the global numeric formatter. If you set a formatter, it will
	 * replace the existing formatter. This function will take effect globally.
	 *
	 *
	 * Example:
	 * <pre>
	 * // Format required from "sap/viz/ui5/api/env/Format"
	 * var customerFormatter = {
	 *     format : function(value, pattern) {
	 *         // add your codes here to convert number value to formatted string
	 *         // according to the pattern string
	 *         return formattedString;
	 *     }
	 * };
	 * Format.numericFormatter(customerFormatter);
	 * </pre>
	 *
	 * @param {function}
	 *            formatter
	 * @returns {*}
	 * @public
	 */
	Format.numericFormatter = function(formatter) {
		return sap.viz.api.env.Format.numericFormatter.apply(null, arguments);
	};



	return Format;

}, /* bExport= */ true);
