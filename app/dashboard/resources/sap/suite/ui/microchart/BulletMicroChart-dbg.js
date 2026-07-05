/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/base/i18n/Localization",
	"sap/m/library",
	"sap/ui/core/Control",
	"sap/m/FlexBox",
	"sap/ui/core/ResizeHandler",
	"sap/ui/events/KeyCodes",
	"sap/suite/ui/microchart/MicroChartUtils",
	"./BulletMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"./BulletMicroChartData"
], function(
	library,
	Localization,
	MobileLibrary,
	Control,
	FlexBox,
	ResizeHandler,
	KeyCodes,
	MicroChartUtils,
	BulletMicroChartRenderer,
	Core,
	Theming,
	BulletMicroChartData
) {
	"use strict";

	// shortcut for sap.m.Size
	var Size = MobileLibrary.Size;

	/**
	 * Constructor for a new BulletMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Displays a colored horizontal bar representing a current value on top of a background bar representing the compared value. The vertical bars can represent the numeric values, the scaling factors, the thresholds, and the target values.  This control replaces the deprecated sap.suite.ui.commons.BulletChart.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string. The aggregated data of the microchart can also be customized.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.BulletMicroChart
	 */
	var BulletMicroChart = Control.extend("sap.suite.ui.microchart.BulletMicroChart", /** @lends sap.suite.ui.microchart.BulletMicroChart.prototype */ {
		metadata : {

			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the bullet micro chart is included.
				 */
				size: {type: "sap.m.Size", group: "Misc", defaultValue: Size.Auto},

				/**
				 * The mode of displaying the actual value itself or the delta between the actual value and the target value. If not set, the actual value is displayed.
				 */
				mode: {type: "sap.suite.ui.microchart.BulletMicroChartModeType", group: "Misc", defaultValue: "Actual"},

				/**
				 * The scaling suffix that is added to all values.
				 */
				scale: {type: "string", group: "Misc", defaultValue: ""},

				/**
				 * The forecast value that is displayed in Actual  mode only. If set, the forecast value bar appears in the background of the actual value bar.
				 */
				forecastValue: {type: "float", group: "Misc", defaultValue: null},

				/**
				 * The target value that is displayed as a black vertical bar.
				 */
				targetValue: {type: "float", group: "Misc", defaultValue: null},

				/**
				 * The minimum scale value for the bar chart used for defining a fixed size of the scale in different instances of this control.
				 */
				minValue: {type: "float", group: "Misc", defaultValue: null},

				/**
				 * The maximum scale value for the bar chart used for defining a fixed size of the scale in different instances of this control.
				 */
				maxValue: {type: "float", group: "Misc", defaultValue: null},

				/**
				 * If set to true, shows the numeric actual value. This property works in Actual mode only.
				 */
				showActualValue: {type: "boolean", group: "Misc", defaultValue: true},

				/**
				 * If set to true, shows the calculated delta value instead of the numeric actual value regardless of the showActualValue setting. This property works in Delta mode only.
				 */
				showDeltaValue: {type: "boolean", group: "Misc", defaultValue: true},

				/**
				 * If set to true, shows the numeric actual value and possibly hides the delta value, if showDeltaValue is set to true.
				 * This property works in Delta mode only and has priority over showDeltaValue.
				 */
				showActualValueInDeltaMode: {type: "boolean", group: "Misc", defaultValue: false},

				/**
				 * If set to true, shows the numeric target value.
				 */
				showTargetValue: {type: "boolean", group: "Misc", defaultValue: true},

				/**
				 * If set to true, shows the value marker.
				 */
				showValueMarker: {type: "boolean", group: "Misc", defaultValue: false},

				/**
				 * If set to true, shows the threshold markers.
				 */
				showThresholds: {type: "boolean", group: "Misc", defaultValue: true},

				/**
				 * If set, displays a specified label instead of the numeric actual value.
				 */
				actualValueLabel: {type: "string", group: "Misc", defaultValue: ""},

				/**
				 * If set, displays a specified label instead of the calculated numeric delta value.
				 */
				deltaValueLabel: {type: "string", group: "Misc", defaultValue: ""},

				/**
				 * If set, displays a specified label instead of the numeric target value.
				 */
				targetValueLabel: {type: "string", group: "Misc", defaultValue: ""},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The background color of the scale. The theming is enabled only for the default value of this property.
				 */
				scaleColor: {type: "sap.suite.ui.microchart.CommonBackgroundType", group: "Misc", defaultValue: "MediumLight"},

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed or by the width and height property.
				 * @since 1.38.0
				 *
				 * @deprecated as of version 1.58, the concept has been discarded.
				 */
				isResponsive: {type: "boolean", group: "Appearance", defaultValue: false},

				/**
				 * If this is set to True, the control will be hidden in 'No data' scenario.
				 * @since 1.84
				 */
				hideOnNoData: { type: "boolean", group: "Appearance", defaultValue: false },

				/**
				 * If set to True, the control allows small value ranges for comparing different values. The minimum value of the value range is not taken as 0.
				 * @since 1.86
				 */
				smallRangeAllowed: { type: "boolean", group: "Appearance", defaultValue: false }
			},
			associations: {

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			defaultAggregation : "actual",
			aggregations: {
				/**
				 * Actual data of the BulletMicroChart.
				 */
				actual: {type: "sap.suite.ui.microchart.BulletMicroChartData", defaultClass: BulletMicroChartData, multiple: false, bindable : "bindable"},

				/**
				 * Threshold data of the BulletMicroChart.
				 */
				thresholds: {type: "sap.suite.ui.microchart.BulletMicroChartData", defaultClass: BulletMicroChartData, multiple: true, singularName: "threshold", bindable : "bindable"}
			},
			events: {
				/**
				 * The event is triggered when the chart is pressed.
				 */
				press : {}
			}
		},
		renderer: BulletMicroChartRenderer
	});

	// numbers are in rem units
	BulletMicroChart.THRESHOLD_SMALL_LABEL = 3.5;
	BulletMicroChart.THRESHOLD_BIG_LABEL = 4.5;

	BulletMicroChart.THRESHOLD_SMALL_LOOK = 3.5;
	BulletMicroChart.THRESHOLD_EXTRASMALL_LOOK = 1.3125;

	BulletMicroChart.THRESHOLD_THRESHOLDS = 6;

	BulletMicroChart.prototype.init = function() {
		this._oRb = Core.getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "((AltText))", true);
		this._bThemeApplied = false;
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all
	 * themes are loaded and everything is properly initialized. We attach a theme
	 * check here.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * Calculates the width in percents of the chart elements according to the provided chart values.
	 *
	 * @returns {Object} object that contains calculated values for actual value, target value, thresholds and their colors.
	 * @private
	 */
	BulletMicroChart.prototype._calculateChartData = function() {
		var fScaleWidthPct = 100,
			aThresholds = this.getThresholds(),
			aCalculatedThresholds = [],
			fTarget = this.getTargetValue(),
			fForecast = this.getForecastValue(),
			fActual = this.getActual() && this.getActual().getValue() ? this.getActual().getValue() : 0,
			aValues = [],
			fLowestValue = 0,
			fHighestValue = 0,
			fTotal = 0,
			i;

		if (this.getActual() && this.getActual()._isValueSet) {
			aValues.push(fActual);
		}

		if (this._isForecastValueSet) {
			aValues.push(fForecast);
		}

		if (this._isTargetValueSet) {
			aValues.push(fTarget);
		}

		if (this._isMinValueSet) {
			aValues.push(this.getMinValue());
		}

		if (this._isMaxValueSet) {
			aValues.push(this.getMaxValue());
		}

		for (i = 0; i < aThresholds.length; i++) {
			aValues.push(aThresholds[i].getValue());
		}

		if (aValues.length > 0) {
			fLowestValue = fHighestValue = aValues[0];
			for (i = 0; i < aValues.length; i++){
				if (aValues[i] < fLowestValue) {
					fLowestValue = aValues[i];
				}
				if (aValues[i] > fHighestValue) {
					fHighestValue = aValues[i];
				}
			}

			if (this.getSmallRangeAllowed() == false) {
				fHighestValue = (fHighestValue < 0 && fHighestValue < 3 * (fLowestValue - fHighestValue)) ? 0 : fHighestValue;
				fLowestValue = (fLowestValue > 0 && fLowestValue > 3 * (fHighestValue - fLowestValue)) ? 0 : fLowestValue;
			}

			fTotal = fHighestValue - fLowestValue;

			for (i = 0; i < aThresholds.length; i++) {
				aCalculatedThresholds[i] = {color: aThresholds[i].getColor(), valuePct: (!aThresholds[i]._isValueSet || fTotal === 0) ? 0 : ((aThresholds[i].getValue() - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2)};
			}
		}

		var nActualValuePct, nTargetValuePct;
		if (this.getMode() === library.BulletMicroChartModeType.Delta) {
			// In case delat mode is used, the zero handling is different, as the left position is 49 instead of 0
			nActualValuePct = (!this.getActual() || !this.getActual()._isValueSet || fTotal === 0) ? 50 : (0.05 + (fActual - fLowestValue) * (fScaleWidthPct) / fTotal).toFixed(2);
			nTargetValuePct = (!this._isTargetValueSet || fTotal === 0) ? 50 : ((fTarget - fLowestValue) * (fScaleWidthPct) / fTotal).toFixed(2);
		} else {
			nActualValuePct = (!this.getActual() || !this.getActual()._isValueSet || fTotal === 0 || fLowestValue === 0 && this.getActual().getValue() === 0) ? 0 : (0.05 + (fActual - fLowestValue) * (fScaleWidthPct) / fTotal).toFixed(2);
			nTargetValuePct = (!this._isTargetValueSet || fTotal === 0) ? 0 : ((fTarget - fLowestValue) * (fScaleWidthPct) / fTotal).toFixed(2);
		}
		return {
			actualValuePct: nActualValuePct,
			targetValuePct: nTargetValuePct,
			forecastValuePct: (!this._isForecastValueSet || fTotal === 0) ? 0 : ((fForecast - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2),
			thresholdsPct: aCalculatedThresholds,
			fScaleWidthPct: fScaleWidthPct
		};
	};

	/**
	 * Calculates the delta between actual value and threshold.
	 *
	 * @returns {number} Delta value of delta between actual value and threshold.
	 * @private
	 */
	BulletMicroChart.prototype._calculateDeltaValue = function() {
		if (!this.getActual()._isValueSet || !this._isTargetValueSet) {
			return 0;
		} else {
			var fActual = this.getActual().getValue();
			var fTarget = this.getTargetValue();
			return Math.abs(fActual - fTarget).toFixed(Math.max(this._digitsAfterDecimalPoint(fActual), this._digitsAfterDecimalPoint(fTarget)));
		}
	};


	BulletMicroChart.prototype.setMinValue = function(fMinValue) {
		this._isMinValueSet = this._fnIsNumber(fMinValue);
		return this.setProperty("minValue", this._isMinValueSet ? fMinValue : NaN);
	};


	BulletMicroChart.prototype.setMaxValue = function(fMaxValue) {
		this._isMaxValueSet = this._fnIsNumber(fMaxValue);
		return this.setProperty("maxValue", this._isMaxValueSet ? fMaxValue : NaN);
	};


	BulletMicroChart.prototype.setTargetValue = function(fTargetValue) {
		this._isTargetValueSet = this._fnIsNumber(fTargetValue);
		return this.setProperty("targetValue", this._isTargetValueSet ? fTargetValue : NaN);
	};


	BulletMicroChart.prototype.setForecastValue = function(fForecastValue) {
		this._isForecastValueSet = this._fnIsNumber(fForecastValue);
		return this.setProperty("forecastValue", this._isForecastValueSet ? fForecastValue : NaN);
	};

	BulletMicroChart.prototype.setSize = function(size) {
		if (this.getSize() !== size) {
			this.setProperty("size", size, false);
		}
		return this;
	};

	BulletMicroChart.prototype.ontap = function(oEvent) {
		this.firePress();
	};

	BulletMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which ===  KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	BulletMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	BulletMicroChart.prototype._fnIsNumber = function(value) {
		return typeof value === 'number' && !isNaN(value) && isFinite(value);
	};

	BulletMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	BulletMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	BulletMicroChart.prototype.onBeforeRendering = function() {
		if (this._sChartResizeHandlerId ) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}

		//removes handler for mouseenter event
		this._unbindMouseEnterLeaveHandler();
	};

	BulletMicroChart.prototype.onAfterRendering = function() {
		library._checkControlIsVisible(this, this._onControlIsVisible);

		//attaches handler for mouseenter event
		this._bindMouseEnterLeaveHandler();
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._onControlIsVisible = function() {
		this._onResize();
		this._sChartResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
	};

	/**
	 * Conducts size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._onResize = function() {
		var $this = this.$(),
			iCurrentControlHeight = Math.round(parseFloat(this.$().css("height"))),
			iCurrentControlWidth = parseInt($this.css("width"));

		if (this.getShowValueMarker()) {
			this._adjustValueToMarker();
		}

		$this.removeClass("sapSuiteBMCSmallFont sapSuiteBMCNoLabels sapSuiteBMCSmallLook sapSuiteBMCExtraSmallLook sapSuiteBMCThresholdHidden");

		if (iCurrentControlHeight <= this.convertRemToPixels(BulletMicroChart.THRESHOLD_EXTRASMALL_LOOK)) {
			$this.addClass("sapSuiteBMCExtraSmallLook");
		} else if (iCurrentControlHeight <= this.convertRemToPixels(BulletMicroChart.THRESHOLD_SMALL_LOOK)) {
			$this.addClass("sapSuiteBMCSmallLook");
		}

		// small label
		if (iCurrentControlHeight >= this.convertRemToPixels(BulletMicroChart.THRESHOLD_SMALL_LABEL) &&
			iCurrentControlHeight <= this.convertRemToPixels(BulletMicroChart.THRESHOLD_BIG_LABEL)) {
			$this.addClass("sapSuiteBMCSmallFont");
		}
		// hide labels
		if (iCurrentControlHeight < this.convertRemToPixels(BulletMicroChart.THRESHOLD_SMALL_LABEL) ||
			this._isAnyChartLabelTruncated()) {
			$this.addClass("sapSuiteBMCNoLabels");
		}

		// hide thresholds and diamonds
		if (iCurrentControlWidth < this.convertRemToPixels(BulletMicroChart.THRESHOLD_THRESHOLDS )) {
			$this.addClass("sapSuiteBMCThresholdHidden");
		}

		this._adjustLabelsPos();
	};

	/**
	 * Checks if any label on the chart is truncated.
	 * @returns {boolean} True if the label is truncated, false if not.
	 * @private
	 */
	BulletMicroChart.prototype._isAnyChartLabelTruncated = function() {
		var $Labels = this.$().find(".sapSuiteBMCItemValue, .sapSuiteBMCTargetValue");
		return this._isAnyLabelTruncated($Labels);

	};

	BulletMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
	};

	BulletMicroChart.prototype._adjustLabelsPos = function() {
		var bRtl = Localization.getRTL();
		var oTBarVal = this.$("bc-target-bar-value");
		var oChartBar = this.$("chart-bar");
		var fFullWidth = oChartBar.width();
		if (fFullWidth) {
			var fTValWidth = 0;
			if (oTBarVal && oTBarVal.offset()) {
				fTValWidth = oTBarVal.offset().left - oChartBar.offset().left;
				if (bRtl) {
					fTValWidth = fFullWidth - fTValWidth;
				}
				this._adjustLabelPos(this.$("bc-target-value"), fFullWidth, fTValWidth, bRtl);
			}

			var oBarValue = this.$("bc-bar-value");
			if (oBarValue && oBarValue.offset()) {
				var fAValWidth = oBarValue.offset().left + oBarValue.width() - oChartBar.offset().left;
				if (bRtl) {
					fAValWidth = (oBarValue.offset().left - oChartBar.offset().left);
				}

				if (this.getMode() === library.BulletMicroChartModeType.Delta) {
					fAValWidth = oBarValue.width();

					if (!this.getShowActualValueInDeltaMode()) {
						fAValWidth = fAValWidth / 2;
					}

					var iSign = this.getTargetValue() < this.getActual().getValue() ? 1 : -1;

					if (bRtl) {
						fAValWidth = oTBarVal.offset().left - oChartBar.offset().left - (fAValWidth * iSign);
					} else {
						fAValWidth = oTBarVal.offset().left - oChartBar.offset().left + (fAValWidth * iSign);
					}
				}

				this._adjustLabelPos(this.$("bc-item-value"), fFullWidth, fAValWidth, bRtl);
			}
		}
	};

	BulletMicroChart.prototype._adjustLabelPos = function(oLabel, fFullWidth, fOffset, bRtl) {
		var sDirection = "left";
		var fLabelWidth = oLabel.width();
		if (fLabelWidth > fFullWidth) {
			oLabel.css(sDirection, "0");
		} else {
			var fLabelLeft = fOffset - 0.5 * fLabelWidth;
			if (fLabelLeft < 0) {
				fLabelLeft = 0;
			}

			if (fLabelLeft + fLabelWidth > fFullWidth) {
				fLabelLeft = fFullWidth - fLabelWidth;
			}
			oLabel.css(sDirection, fLabelLeft);
		}
	};

	BulletMicroChart.prototype._adjustValueToMarker = function() {
		var oValue = this.$("bc-bar-value");
		var oMarker = this.$("bc-bar-value-marker");
		var oContainer = this.$().find(".sapSuiteBMCVerticalAlignmentContainer");
		if (oValue.offset() && oMarker.offset()) {
			var fValueWidth = oValue.width();
			var fValueLeft = oValue.offset().left;
			var fMarkerWidth = oMarker.width();
			var fMarkerLeft = oMarker.offset().left;

			if (Localization.getRTL()) {
				if (fMarkerLeft < fValueLeft) { // browser's subpixel problem fix
					oMarker.css("right", "");
					oMarker.offset({left: fValueLeft});
				}
				if (fMarkerLeft + fMarkerWidth > fValueLeft + fValueWidth) { // bar value is less than marker min-width
					oMarker.css("right", "");
					oMarker.offset({left: fValueLeft + fValueWidth - fMarkerWidth});
				}
			} else {
				if (fMarkerLeft < fValueLeft) { // bar value is less than marker min-width
					oMarker.offset({left: fValueLeft});
				}
				if (fMarkerLeft + fMarkerWidth > fValueLeft + fValueWidth) { // browser's subpixel problem fix
					oValue.width((fMarkerLeft + fMarkerWidth - fValueLeft) / oContainer.width() * 100 + "%");
				}
			}
		}
	};

	BulletMicroChart.prototype._getLocalizedColorMeaning = function(sColor) {
		return this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase());
	};

	BulletMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sAltText = this._oRb.getText("BULLETMICROCHART");

		if (bIsActive) {
			sAltText += " " + this._oRb.getText("IS_ACTIVE");
		}

		if (!this._hasData()) {
			sAltText += "\n" + this._oRb.getText("NO_DATA");
			return sAltText;
		}

		var bIsActualSet = this.getActual() && this.getActual()._isValueSet;
		var sScale = this.getScale();
		var sTargetValueLabel = this.getTargetValueLabel();
		var sMeaning = !this.getActual() || !this.getActual().getColor() ? "" : this._getLocalizedColorMeaning(this.getActual().getColor());


		if (bIsActualSet) {
			var sActualValueLabel = this.getActualValueLabel();
			var sAValToShow = (sActualValueLabel) ? sActualValueLabel : "" + this.getActual().getValue();
			sAltText += "\n" + this._oRb.getText("BULLETMICROCHART_ACTUAL_TOOLTIP", [sAValToShow + sScale, sMeaning]);
		}
		if (this.getMode() === library.BulletMicroChartModeType.Delta) {
			if (this._isTargetValueSet && bIsActualSet) {
				var sDeltaValueLabel = this.getDeltaValueLabel();
				var sDValToShow = (sDeltaValueLabel) ? sDeltaValueLabel : "" + this._calculateDeltaValue();
				sAltText += "\n" + this._oRb.getText("BULLETMICROCHART_DELTA_TOOLTIP", [sDValToShow + sScale, sMeaning]);
			}
		} else if (this._isForecastValueSet) {
			sAltText += (this._isForecastValueSet) ? "\n" + this._oRb.getText("BULLETMICROCHART_FORECAST_TOOLTIP", [this.getForecastValue() + sScale, sMeaning]) : "";
		}

		if (this._isTargetValueSet) {
			var sTValToShow = (sTargetValueLabel) ? sTargetValueLabel : "" + this.getTargetValue();
			sAltText += "\n" + this._oRb.getText("BULLETMICROCHART_TARGET_TOOLTIP", [sTValToShow + sScale]);
		}

		return sAltText;
	};

	BulletMicroChart.prototype._getAltSubText = function(bIsFirst) {
		var sAltText = "";

		var aThresholds = this.getThresholds().sort(function(oFirst, oSecond) { return oFirst.getValue() - oSecond.getValue(); });

		for (var i = 0; i < aThresholds.length; i++) {
			var oThreshold = aThresholds[i],
				sThreshTooltip = oThreshold.getTooltip_AsString(),
				sAltThreshText = "";

			if (!sThreshTooltip) {
				continue;
			}

			sAltThreshText += (bIsFirst ? "" : "\n") + this._oRb.getText("BULLETMICROCHART_THRESHOLD_TOOLTIP", [oThreshold.getValue() + this.getScale(), this._getLocalizedColorMeaning(oThreshold.getColor())]);

			sAltThreshText = sThreshTooltip.split("((AltText))").join(sAltThreshText);

			if (sAltThreshText) {
				sAltText += sAltThreshText;
				bIsFirst = false;
			}
		}

		return sAltText;
	};

	BulletMicroChart.prototype.clone = function(sIdSuffix, aLocalIds, oOptions) {
		var oClone = Control.prototype.clone.apply(this, arguments);
		oClone._isMinValueSet = this._isMinValueSet;
		oClone._isMaxValueSet = this._isMaxValueSet;
		oClone._isForecastValueSet = this._isForecastValueSet;
		oClone._isTargetValueSet = this._isTargetValueSet;
		return oClone;
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._bindMouseEnterLeaveHandler = function () {

		// handlers need to be saved intermediately in order to unbind successfully
		if (!this._oMouseEnterLeaveHandler) {
			this._oMouseEnterLeaveHandler = {
				mouseEnterChart: this._addTitleAttribute.bind(this),
				mouseLeaveChart: this._removeTitleAttribute.bind(this)
			};
		}
		// bind events on chart
		this.$().on("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
		this.$().on("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._unbindMouseEnterLeaveHandler = function () {
		if (this._oMouseEnterLeaveHandler) {
			this.$().off("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
			this.$().off("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
		}
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	BulletMicroChart.prototype._hasData = function() {
		return this.getActual();
	};

	// to prevent press event in No Data mode
	BulletMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(BulletMicroChart);

	return BulletMicroChart;
});
