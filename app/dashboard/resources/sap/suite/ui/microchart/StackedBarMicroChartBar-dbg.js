/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides sap.suite.ui.microchart.StackedBarMicroChartBar control.
sap.ui.define(["sap/ui/thirdparty/jquery", './library', 'sap/ui/core/Element', "sap/m/library"],
	function(jQuery, library, Element, mobileLibrary) {
	"use strict";
	/** @deprecated since 1.135 */
	const ValueCSSColor = mobileLibrary.ValueCSSColor;
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * Constructor for a new StackedBarMicroChartBar.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Contains the values of the stacked bar chart.
	 * @extends sap.ui.core.Element
	 *
	 * @version 1.136.0
	 * @since 1.44.0
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.StackedBarMicroChartBar
	 */
	var StackedBarMicroChartBar = Element.extend("sap.suite.ui.microchart.StackedBarMicroChartBar", /** @lends sap.suite.ui.microchart.StackedBarMicroChartBar.prototype */ {
		metadata : {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The value for stacked bar chart. It is used in order to determine the width of the bar
				 */
				value: {type: "float", group: "Data", defaultValue: "0"},

				/**
				 * The color of the bar. For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				valueColor: {type: "string", group: "Appearance", defaultValue: null},

				/**
				 * If this property is set, then it will be displayed instead of value.
				 */
				displayValue: {type: "string", group: "Data", defaultValue: null}
			}
		}
	});

	StackedBarMicroChartBar.prototype.setValue = function(fValue, bSuppressInvalidate) {
		var bIsValueSet = Number.isFinite(Number(fValue));
		return this.setProperty("value", bIsValueSet ? fValue : NaN, bSuppressInvalidate);
	};

	StackedBarMicroChartBar.prototype.setValueColor = function(sValue, bSuppressInvalidate) {
		var bIsValueSet = false;

		if (MicroChartColorType.hasOwnProperty(sValue) || (sValue == null || sValue == "")){
			bIsValueSet = true;
		} else {
			/**
			* @deprecated As of version 1.135
			*/
			bIsValueSet = ValueCSSColor.isValid(sValue);
		}

		if ( sValue != null && !bIsValueSet ) {
			throw new Error(`Value ${sValue} is not valid for property "valueColor"`);
		 }

		return this.setProperty("valueColor", bIsValueSet ? sValue : null, bSuppressInvalidate);
	};

	return StackedBarMicroChartBar;

});