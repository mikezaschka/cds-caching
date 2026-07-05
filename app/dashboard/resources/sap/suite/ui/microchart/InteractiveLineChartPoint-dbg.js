/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(['./library', 'sap/ui/core/Element', 'sap/ui/core/Lib'],
	function(library, Element, CoreLib) {
	"use strict";

	/**
	 * Constructor for the point element of the InteractiveLineChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class A point element for the InteractiveLineChart.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.42.0
	 * @constructor
	 * @alias sap.suite.ui.microchart.InteractiveLineChartPoint
	 */
	var InteractiveLineChartPoint = Element.extend("sap.suite.ui.microchart.InteractiveLineChartPoint", /** @lends sap.suite.ui.microchart.InteractiveLineChartPoint.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The bottom label for the chart point.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The label that is displayed right below the <code>label</code>..
				 */
				secondaryLabel: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if the chart point is selected.
				 */
				selected: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false
				},

				/**
				 * The numeric value of the chart point.
				 */
				value: {
					type: "float",
					group: "Data",
					defaultValue: null
				},

				/**
				 * The value label to be displayed near the point in the chart.
				 */
				displayedValue: {
					type: "string",
					group: "Data",
					defaultValue: null
				},

				/**
				 * Determines the color of the point.
				 * @since 1.50.0
				 */
				color: {
					type: "sap.m.ValueColor",
					group: "Misc",
					defaultValue: "Neutral"
				}
			}
		}
	});

	InteractiveLineChartPoint.prototype.init = function() {
		this._bNullValue = true;
		this._oRb = CoreLib.getResourceBundleFor("sap.suite.ui.microchart");
	};

	InteractiveLineChartPoint.prototype.validateProperty = function(sPropertyName, oValue) {
		if (sPropertyName === "value" && (oValue === null || oValue === undefined)) {
			this._bNullValue = true;
		} else if (sPropertyName === "value") {
			this._bNullValue = false;
		}
		return Element.prototype.validateProperty.apply(this, arguments);
	};

	InteractiveLineChartPoint.prototype.getTooltip_AsString = function() { //eslint-disable-line
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
	 * Creates internal tooltip value for the interaction area.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveLineChartPoint.prototype._createTooltipText = function() {
		var sTooltipText = "";
		var sLabel = this.getLabel();
		if (sLabel && sLabel.length > 0) {
			sTooltipText = sLabel + ":\n";
		}
		if (this._bNullValue) {
			sTooltipText += this._oRb.getText("INTERACTIVECHART_NA");
		} else {
			sTooltipText += this.getValue();
		}
		var sColor = this._getSemanticColor();
		if (sColor) {
			sTooltipText += " " + sColor;
		}

		return sTooltipText;
	};

	/**
	 * Determines the semantic color of the localized point.
	 *
	 * @returns {string} The localized color name or an empty string
	 * @private
	 */
	InteractiveLineChartPoint.prototype._getSemanticColor = function() {
		var sColor = this.getColor();
		var oParent = this.getParent();

		if (oParent && oParent._bSemanticTooltip) {
			return this._oRb.getText("SEMANTIC_COLOR_" + sColor.toUpperCase());
		}
		return "";
	};

	/**
	 * Returns the interaction area tooltip to be used for creating the chart tooltip text.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveLineChartPoint.prototype._getAreaTooltip = function() {
		var sTooltip = this.getTooltip_AsString();
		if (sTooltip && !this._bCustomTooltip) {
			sTooltip = sTooltip.replace("\n", " ");
		}

		return sTooltip;
	};

	return InteractiveLineChartPoint;
});
