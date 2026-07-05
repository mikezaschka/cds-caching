/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["./library", "sap/ui/core/Element", "sap/ui/core/Lib"], function(library, Element, CoreLib) {
	"use strict";

	/**
	 * Constructor for InteractiveDonutChartSegment element.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new element
	 *
	 * @class A donut chart segment.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.42.0
	 * @constructor
	 * @alias sap.suite.ui.microchart.InteractiveDonutChartSegment
	 */
	var InteractiveDonutChartSegment = Element.extend("sap.suite.ui.microchart.InteractiveDonutChartSegment", /** @lends sap.suite.ui.microchart.InteractiveDonutChartSegment.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * Displayed text for the segment.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicator for the selected state.
				 */
				selected: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false
				},

				/**
				 * The value representing a percentage or an absolute value.
				 */
				value: {
					type: "float",
					group: "Data",
					defaultValue: null
				},

				/**
				 * The value that is directly displayed on the legend.
				 */
				displayedValue: {
					type: "string",
					group: "Data",
					defaultValue: null
				},

				/**
				 * Determines the color of the segment.
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

	InteractiveDonutChartSegment.prototype.init = function() {
		this._bNullValue = true;
		this._oRb = CoreLib.getResourceBundleFor("sap.suite.ui.microchart");
	};

	InteractiveDonutChartSegment.prototype.validateProperty = function(sPropertyName, oValue) {
		if (sPropertyName === "value") {
			// negative values are not allowed
			this._bNullValue = (oValue === null) || isNaN(oValue) || (typeof oValue === "undefined") || (oValue < 0);
		}
		return Element.prototype.validateProperty.apply(this, arguments);
	};

	InteractiveDonutChartSegment.prototype.getTooltip_AsString = function() { //eslint-disable-line
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
	 * Creates internal tooltip value for the segment.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveDonutChartSegment.prototype._createTooltipText = function() {
		var sTooltipText = "";
		var sLabel = this.getLabel();
		if (sLabel && sLabel.length > 0) {
			sTooltipText = sLabel + ":\n";
		}
		if (this._bNullValue) {
			sTooltipText += this._oRb.getText("INTERACTIVECHART_NA");
		} else {
			sTooltipText += this.getDisplayedValue() ? this.getDisplayedValue() : this.getValue();
		}

		var sColor = this._getSemanticColor();
		if (sColor) {
			sTooltipText += " " + sColor;
		}

		return sTooltipText;
	};

	/**
	 * Determines the localized name of the segment's semantic color.
	 *
	 * @returns {string} The localized color name or an empty string
	 * @private
	 */
	InteractiveDonutChartSegment.prototype._getSemanticColor = function() {
		var sColor = this.getColor();
		var oParent = this.getParent();

		if (oParent && oParent._bSemanticTooltip) {
			return this._oRb.getText("SEMANTIC_COLOR_" + sColor.toUpperCase());
		}
		return "";
	};

	/**
	 * Returns the segment tooltip to be used for creating the chart tooltip text.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveDonutChartSegment.prototype._getSegmentTooltip = function() {
		var sTooltip = this.getTooltip_AsString();
		if (sTooltip && !this._bCustomTooltip) {
			sTooltip = sTooltip.replace("\n", " ");
		}

		return sTooltip;
	};

	return InteractiveDonutChartSegment;
});
