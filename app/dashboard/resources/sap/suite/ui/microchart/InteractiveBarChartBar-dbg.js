/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(['./library', 'sap/ui/core/Element', 'sap/ui/core/Lib'],
	function(library, Element, CoreLib) {
	"use strict";

	/**
	 * Constructor for the bar element of the InteractiveBarChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class A bar element for the InteractiveBarChart.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.42.0
	 * @constructor
	 * @alias sap.suite.ui.microchart.InteractiveBarChartBar
	 */
	var InteractiveBarChartBar = Element.extend("sap.suite.ui.microchart.InteractiveBarChartBar", /** @lends sap.suite.ui.microchart.InteractiveBarChartBar.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The label for the chart bar.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if the chart bar is selected.
				 */
				selected: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false
				},

				/**
				 * The value label to be displayed on the bar in the chart.
				 */
				displayedValue: {
					type: "string",
					group: "Data",
					defaultValue: null
				},

				/**
				 * Determines the color of the bar.
				 * @since 1.50.0
				 */
				color: {
					type: "sap.m.ValueColor",
					group: "Misc",
					defaultValue: "Neutral"
				},

				/**
				 * The numeric value of the chart bar to be displayed on the bar.
				 */
				value: {
					type: "float",
					group: "Data"
				}
			}
		}
	});

	InteractiveBarChartBar.prototype.init = function() {
		this._bNullValue = true;
		this._oRb = CoreLib.getResourceBundleFor("sap.suite.ui.microchart");
	};

	InteractiveBarChartBar.prototype.validateProperty = function(sPropertyName, oValue) {
		if (sPropertyName === "value" && (oValue === null || oValue === undefined || isNaN(oValue))) {
			this._bNullValue = true;
		} else if (sPropertyName === "value") {
			this._bNullValue = false;
		}
		return Element.prototype.validateProperty.apply(this, arguments);
	};

	InteractiveBarChartBar.prototype.getTooltip_AsString = function() { //eslint-disable-line
		var sTooltip = this.getTooltip_Text();
		this._bCustomTooltip = true;
		if (!sTooltip) { // tooltip will be set by the control
			sTooltip = this._createTooltipText();
			this._bCustomTooltip = false;
		} else if (library._isTooltipSuppressed(sTooltip)) {
			sTooltip = null;
		}

		return sTooltip;
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */

	/**
	 * Creates internal tooltip value for the bar.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveBarChartBar.prototype._createTooltipText = function() {
		var sTooltipText = "",
			sLabel = this.getLabel(),
			bIncludeColor = this.getParent() && this.getParent()._bUseSemanticTooltip,
			sColor, sLocalizedColor;
		if (sLabel && sLabel.length > 0) {
			sTooltipText = sLabel + ":\n";
		}
		if (this._bNullValue) {
			sTooltipText += this._oRb.getText("INTERACTIVECHART_NA");
		} else {
			sTooltipText += this.getValue();
		}
		if (bIncludeColor) {
			sColor = this.getColor();
			sLocalizedColor = this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase());
			sTooltipText += " " + sLocalizedColor;
		}
		return sTooltipText;
	};

	/**
	 * Returns the bar tooltip to be used for creating the chart tooltip text.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveBarChartBar.prototype._getBarTooltip = function() {
		var sTooltip = this.getTooltip_AsString();
		if (sTooltip && !this._bCustomTooltip) {
			sTooltip = sTooltip.replace("\n", " ");
		}

		return sTooltip;
	};

	return InteractiveBarChartBar;
});