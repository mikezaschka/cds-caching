/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/library",
	"sap/ui/core/Theming",
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/Lib",
	"./library"
], function(Control, MobileLibrary, Theming, jQuery, Lib, library) {
	"use strict";
	var oRb = Lib.getResourceBundleFor("sap.suite.ui.microchart");
	var Size = MobileLibrary.Size;
	const MicroChartColorType = library.MicroChartColorType;
	/** @deprecated since 1.135 */
	const ValueCSSColor = MobileLibrary.ValueCSSColor;

	var MicroChartUtils = {
		extendMicroChart: function (MicroChart) {
			/**
			 * Checkes whether current size is sap.m.Size.Responsive

			 * @return {boolean} True if Responsive, false otherwise
			 * @private
			 */
			MicroChart.prototype._isResponsive = function () {
				return this.getSize() === Size.Responsive;
			};

			/**
			 * Calculates the number of digits after the decimal point.
			 *
			 * @param {float} fValue float value
			 * @returns {int} number of digits after the decimal point in fValue.
			 * @private
			 */
			MicroChart.prototype._digitsAfterDecimalPoint = function(fValue) {
				var sAfter = ("" + fValue).match(/[.,](\d+)/g);
				return (sAfter) ? ("" + sAfter).length - 1 : 0;
			};

			/**
			 * Overrides the method 'getAccessibilityInfo' of the given MicroChart prototype.
			 *
			 * @param {Object} microChartPrototype The MicroChart's prototype
			 * @private
			 */
			MicroChart.prototype.getAccessibilityInfo = function() {
				return {
					type: oRb.getText("ACC_CTR_TYPE_MICROCHART"),
					description: this.getTooltip_AsString()
				};
			};

			/**
			 * Checks whether the current theme is a high contrast theme like sap_belize_hcb or sap_belize_hcw.
			 * @returns {boolean} True if the theme name contains hcb or hcw, false if otherwise
			 * @private
			 */
			MicroChart.prototype._isThemeHighContrast = function() {
				return /(hcw|hcb)/g.test(Theming.getTheme());
			};

			/**
			 * Converts number in rem units to pixel units
			 * @param {number} fRem number in rem units
			 * @return {number} converted number
			 */
			MicroChart.prototype.convertRemToPixels = function(fRem) {
				return fRem * parseFloat(window.getComputedStyle(document.documentElement).fontSize);
			};


			/**
			 * Checks if any label in the list is truncated.
			 * @param {object[]} $Labels array of jQuery elements
			 * @returns {boolean} True if any label is truncated, false if not.
			 * @private
			 */
			MicroChart.prototype._isAnyLabelTruncated = function($Labels) {
				return $Labels.toArray().some(this._isLabelTruncated);
			};

			/**
			 * Checks if any label in the list is vertically truncated.
			 * @param {object[]} $Labels array of jQuery elements
			 * @returns {boolean} True if any label is truncated, false if not.
			 * @private
			 */
			MicroChart.prototype._isAnyLabelVerticallyTruncated = function($Labels) {
				return $Labels.toArray().some(this._isLabelVerticallyTruncated);
			};

			/**
			 * Checks if label is truncated.
			 * @param {object} oLabel html element
			 * @returns {boolean} True if label is truncated, false if not.
			 * @private
			 */
			MicroChart.prototype._isLabelTruncated = function(oLabel) {
				return oLabel.scrollWidth > oLabel.offsetWidth;
			};

			/**
			 * Checks if label is vertically truncated.
			 * @param {object} oLabel html element
			 * @returns {boolean} True if label is truncated, false if not.
			 * @private
			 */
			MicroChart.prototype._isLabelVerticallyTruncated = function(oLabel) {
				return Math.abs(oLabel.scrollHeight - oLabel.offsetHeight) > 1; // label can be truncated in both dimensions
			};

			/**
			 * Checks if any label in the list is truncated if it is also numeric.
			 * @param {object[]} $Labels array of jQuery elements
			 * @returns {boolean} True if any label is truncated, false if not.
			 * @private
			 */
			MicroChart.prototype._isAnyLabelNumericAndTruncated = function($Labels) {
				return $Labels.toArray().some(this._isLabelNumericAndTruncated.bind(this));
			};

			/**
			 * Checks if label is truncated.
			 * @param {object} oLabel html element
			 * @returns {boolean} True if label is truncated, false if not.
			 * @private
			 */
			MicroChart.prototype._isLabelNumericAndTruncated = function(oLabel) {
				return !Number.isFinite(Number(oLabel.textContent)) ? false : this._isLabelTruncated(oLabel);
			};

			/**
			 * Checks if color definition is correct
			 * @param {object|string} vColor color definition
			 * @returns {boolean} True if color definition is correct, false if not.
			 * @private
			 */
			MicroChart.prototype.isColorCorrect = function(vColor) {
					if (MicroChartColorType.hasOwnProperty(vColor) && vColor !== "" ){
						return true;
					}

					/**
					* @deprecated As of version 1.135
					*/
					if (MobileLibrary.ValueCSSColor.isValid(vColor) && vColor !== ""){
						return true;
					}

					/**
					* @deprecated As of version 1.135
					*/
					if (MobileLibrary.ValueCSSColor.isValid(vColor.below) && vColor.below !== "" &&
						MobileLibrary.ValueCSSColor.isValid(vColor.above) && vColor.above !== "") {
						   return true;
					}

					if (MicroChartColorType.hasOwnProperty(vColor.below) && vColor.below !== "" &&
						MicroChartColorType.hasOwnProperty(vColor.above) && vColor.above !== ""){
						return true;
					} else {
						return false;
					}
			};

			/**
			 * Overrides the getTooltip_AsString function from {@link sap.ui.core.Element}
			 * @param {boolean} bIsActive True if the chart is active, false if not.
			 * @returns {object|string} tooltip text as string.
			 * @private
			 */
			MicroChart.prototype.getTooltip_AsString = function(bIsActive) { //eslint-disable-line
				var sTooltip = Control.prototype.getTooltip_AsString.apply(this, arguments),
					sTooltipHeader = this._getAltHeaderText(bIsActive),
					bIsFirst = false;

				if (sTooltip) {
					sTooltip = sTooltip.split("((AltText))").join(sTooltipHeader);
				}

				if (!sTooltip) {
					sTooltip = "";
					bIsFirst = true;
				}

				if (this._getAltSubText) {
					sTooltip += this._getAltSubText(bIsFirst);
				}

				return sTooltip;
			};

		},
		extendMicroChartSetColor: function (MicroChart)  {
			MicroChart.prototype.setColor = function(sValue, bSuppressInvalidate) {
				var bIsValueSet = false;

				if (MicroChartColorType.hasOwnProperty(sValue) ){
					bIsValueSet = true;
				} else {
					/**
					* @deprecated As of version 1.135
					*/
					bIsValueSet = ValueCSSColor.isValid(sValue);
				}

				if ( sValue != null && !bIsValueSet ) {
					throw new Error(`Value ${sValue} is not valid for property "color"`);
				 }

				return this.setProperty("color", bIsValueSet ? sValue : null, bSuppressInvalidate);
			};
		}
	};

	return MicroChartUtils;
}, true);
