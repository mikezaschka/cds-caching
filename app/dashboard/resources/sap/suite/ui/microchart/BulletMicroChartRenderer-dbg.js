/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'./library',
	"sap/base/i18n/Localization",
	'sap/m/library',
	'sap/suite/ui/microchart/MicroChartRenderUtils'
], function(library, Localization, MobileLibrary, MicroChartRenderUtils) {
	"use strict";

	/**
	 * BulletMicroChart renderer.
	 * @namespace
	 */
	var BulletMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.BulletMicroChart} oControl the control to be rendered
	 */
	BulletMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		if (oControl._hasData() && !isNaN(oControl.getAggregation("actual").getValue())) {
			var oChartData = oControl._calculateChartData();
			var fForecastValuePct = +oChartData.forecastValuePct;
			var sSize;
			if (oControl._isResponsive()) {
				sSize = "sapSuiteBMCResponsive";
			} else {
				sSize = "sapSuiteBMCSize" + oControl.getSize();
			}
			var sScale = oControl.getScale();
			var sDirection = Localization.getRTL() ? "right" : "left";
			var sMode = "sapSuiteBMCModeType" + oControl.getMode();
			var sDeltaValue = oControl.getMode() === library.BulletMicroChartModeType.Delta ? oControl._calculateDeltaValue() : 0;
			var bIsActualSet = oControl.getActual() && oControl.getActual()._isValueSet;
			var bShowActualValue = oControl.getShowActualValue() && oControl.getSize() !== MobileLibrary.Size.XS && oControl.getMode() ===  library.BulletMicroChartModeType.Actual;
			var bShowActualValueInDelta = oControl.getShowActualValueInDeltaMode() && oControl.getSize() !== MobileLibrary.Size.XS && oControl.getMode() === library.BulletMicroChartModeType.Delta;
			var bShowDeltaValue = oControl.getShowDeltaValue() && oControl.getSize() !== MobileLibrary.Size.XS && oControl.getMode() === library.BulletMicroChartModeType.Delta;
			var bShowTargetValue = oControl.getShowTargetValue() && oControl.getSize() !== MobileLibrary.Size.XS;
			var bShowThresholds = oControl.getShowThresholds();
			var sActualValueLabel = oControl.getActualValueLabel();
			var sDeltaValueLabel = oControl.getDeltaValueLabel();
			var sTargetValueLabel = oControl.getTargetValueLabel();
			var aData = oControl.getThresholds();

			var sSemanticColor;
			if (bIsActualSet) {
				sSemanticColor = "sapSuiteBMCSemanticColor" + oControl.getActual().getColor();
			}

			oRm.openStart("div",oControl);
			this._writeMainProperties(oRm, oControl);
			oRm.openEnd();

			oRm.openStart("div");
			oRm.class("sapSuiteBMCVerticalAlignmentContainer");
			oRm.openEnd();

			oRm.openStart("div",oControl.getId() + "-bc-chart");
			oRm.class("sapSuiteBMCChart");
			oRm.class(sSize);
			oRm.openEnd();

			if ((bIsActualSet && (bShowActualValue || bShowActualValueInDelta)) || (bIsActualSet && oControl._isTargetValueSet && bShowDeltaValue)) {
				var sValScale = "";
				oRm.openStart("div");
				oRm.class("sapSuiteBMCTopLabel");
				oRm.openEnd();

				if (bIsActualSet && (bShowActualValue || bShowActualValueInDelta)) {
					var sActualValueToRender = sActualValueLabel ? sActualValueLabel : "" + oControl.getActual().getValue();
					sValScale = sActualValueToRender + sScale;
					oRm.openStart("div",oControl.getId() + "-bc-item-value");
					oRm.class("sapSuiteBMCItemValue");
					oRm.class(sSemanticColor);
					oRm.class(sSize);
					oRm.openEnd();
					oRm.text(sValScale);
					oRm.close("div");
				} else if (bIsActualSet && oControl._isTargetValueSet && bShowDeltaValue) {
					var sDeltaValueToRender = sDeltaValueLabel ? sDeltaValueLabel : "" + sDeltaValue;
					sValScale = sDeltaValueToRender + sScale;
					oRm.openStart("div",oControl.getId() + "-bc-item-value");
					oRm.class("sapSuiteBMCItemValue");
					oRm.class(sSemanticColor);
					oRm.class(sSize);
					oRm.openEnd();
					oRm.text("\u0394");
					oRm.text(sValScale);
					oRm.close("div");
				}
				oRm.close("div");
			}

			oRm.openStart("div");
			oRm.class("sapSuiteBMCChartCanvas");
			oRm.openEnd();

			if (bShowThresholds) {
				for (var i = 0; i < oChartData.thresholdsPct.length; i++) {
					if (aData[i]._isValueSet) {
						this.renderThreshold(oRm, oControl, oChartData.thresholdsPct[i], sSize);
					}
				}
			}

			oRm.openStart("div", oControl.getId() + "-chart-bar");
			oRm.class("sapSuiteBMCBar");
			oRm.class(sSize);
			oRm.class("sapSuiteBMCScaleColor" + oControl.getScaleColor());
			oRm.openEnd();
			oRm.close("div");

			if (bIsActualSet) {
				//render forecast value bar
				if (oControl._isForecastValueSet && oControl.getMode() === library.BulletMicroChartModeType.Actual) {
					oRm.openStart("div",oControl.getId() + "-forecast-bar-value");
					oRm.class("sapSuiteBMCForecastBarValue");
					oRm.class(sSemanticColor);
					oRm.class(sSize);
					oRm.style("width", fForecastValuePct + "%");
					oRm.openEnd();
					oRm.close("div");
				}

				oRm.openStart("div", oControl.getId() + "-bc-bar-value-marker");
				oRm.class("sapSuiteBMCBarValueMarker");
				oRm.class(sMode);
				if (!oControl.getShowValueMarker()) {
					oRm.class("sapSuiteBMCBarValueMarkerHidden");
				}
				oRm.class(sSemanticColor);
				oRm.class(sSize);

				oRm.style(sDirection, parseFloat(oChartData.actualValuePct) + parseFloat(1) + "%");

				if (oControl.getMode() === library.BulletMicroChartModeType.Delta && oChartData.actualValuePct <= oChartData.targetValuePct) {
					oRm.style("margin", "0");
				}
				oRm.openEnd();
				oRm.close("div");

				//render actual value bar
				if (oControl.getMode() === library.BulletMicroChartModeType.Actual && oChartData.actualValuePct !== 0) {
					oRm.openStart("div",oControl.getId() + "-bc-bar-value");
					oRm.class("sapSuiteBMCBarValue");
					oRm.class(sSemanticColor);
					oRm.class(sSize);
					if (oControl._isForecastValueSet) {
						oRm.class("sapSuiteBMCForecast");
					}
					oRm.style("width",oChartData.actualValuePct + "%");
					oRm.openEnd();
					oRm.close("div");
				} else if (oControl._isTargetValueSet && oControl.getMode() === library.BulletMicroChartModeType.Delta) {
					oRm.openStart("div",oControl.getId() + "-bc-bar-value");
					oRm.class("sapSuiteBMCBarValue");
					oRm.class(sSemanticColor);
					oRm.class(sSize);
					oRm.style("width", Math.abs(oChartData.actualValuePct - oChartData.targetValuePct) + "%");
					oRm.style(sDirection, (1 + Math.min(oChartData.actualValuePct, oChartData.targetValuePct)) + "%");

					oRm.openEnd();
					oRm.close("div");
				}
			}

			if (oControl._isTargetValueSet) {
				oRm.openStart("div",oControl.getId() + "-bc-target-bar-value");
				oRm.class("sapSuiteBMCTargetBarValue");
				oRm.class(sSize);
				oRm.style(sDirection, parseFloat(oChartData.targetValuePct).toFixed(2) + "%");
				oRm.openEnd();
				oRm.close("div");
				oRm.close("div");

				if (bShowTargetValue) {
					oRm.openStart("div");
					oRm.class("sapSuiteBMCBottomLabel");
					oRm.openEnd();
					var sTValToShow = sTargetValueLabel ? sTargetValueLabel : "" + oControl.getTargetValue();
					var sTValScale = sTValToShow + sScale;
					oRm.openStart("div",oControl.getId() + "-bc-target-value");
					oRm.class("sapSuiteBMCTargetValue");
					oRm.class(sSize);
					oRm.openEnd();
					oRm.text(sTValScale);
					oRm.close("div");
					oRm.close("div");
				}
			} else {
				oRm.close("div");
			}
			oRm.close("div");

			oRm.openStart("div",oControl.getId() + "-info");
			oRm.attr("aria-hidden", "true");
			oRm.style("display", "none");
			oRm.openEnd();

			oRm.close("div");
			oRm.close("div");
			oRm.close("div");
		} else {
			this._renderNoData(oRm, oControl);
		}
	};

		/**
		 * Renders control data and prepares default classes and styles
		 *
		 * @param {object} oRm render manager
		 * @param {object} oControl AreaMicroChart control
		 * @private
		 */
		BulletMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
			var bIsActive = oControl.hasListeners("press");

			this._renderActiveProperties(oRm, oControl);

			var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
			oRm.attr("role", "figure");

			if (oControl.getAriaLabelledBy().length) {
				oRm.accessibilityState(oControl);
			} else {
				oRm.attr("aria-label", sAriaLabel);
			}

			oRm.class("sapSuiteBMC");
			oRm.class("sapSuiteBMCContent");
			oRm.class(oControl._isResponsive() ? "sapSuiteBMCResponsive" : "sapSuiteBMCSize" + oControl.getSize());

			oRm.style("width", oControl.getWidth());
			oRm.style("height", oControl.getHeight());
		};

	/**
	 * Renders the HTML for the thresholds, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.suite.ui.microchart.BulletMicroChart} oControl the control to be rendered
	 * @param {object} oThreshold an object containing threshold values and colors
	 * @param {string} sSize a string representing the size CSS class
	 */
	BulletMicroChartRenderer.renderThreshold = function(oRm, oControl, oThreshold, sSize) {
		var sDirection = Localization.getRTL() ? "right" : "left",
			fValuePct = 0.98 * oThreshold.valuePct + 1,
			sColor = "sapSuiteBMCSemanticColor" + oThreshold.color;

		if (sColor === "sapSuiteBMCSemanticColor" + MobileLibrary.ValueColor.Error) {
			oRm.openStart("div");
			oRm.class("sapSuiteBMCDiamond");
			oRm.class(sSize);
			oRm.class(sColor);
			oRm.style(sDirection, fValuePct + "%");
			oRm.openEnd();
			oRm.close("div");
		}
		oRm.openStart("div");
		oRm.class("sapSuiteBMCThreshold");
		oRm.class(sSize);
		oRm.class(sColor);
		oRm.style(sDirection, fValuePct + "%");
		oRm.openEnd();
		oRm.close("div");
	};

	MicroChartRenderUtils.extendMicroChartRenderer(BulletMicroChartRenderer);

	return BulletMicroChartRenderer;

}, /* bExport= */ true);
