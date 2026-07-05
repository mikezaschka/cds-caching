/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	    './library',
		'sap/suite/ui/microchart/MicroChartRenderUtils',
		'sap/ui/core/theming/Parameters'
	],
	function(library, MicroChartRenderUtils, Parameters) {
	"use strict";

	const MicroChartColorType = library.MicroChartColorType;
	var DeltaMicroChartViewType = library.DeltaMicroChartViewType;

	/**
	 * DeltaMicroChart renderer.
	 * @namespace
	 */
	var DeltaMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.DeltaMicroChart} oControl The control to be rendered
	 */
	DeltaMicroChartRenderer.render = function(oRm, oControl) {
		function getDir(bLeft) {
			return bLeft ? "sapSuiteDMCDirectionLeft" : "sapSuiteDMCDirectionRight";
		}

		if (oControl._hasData()) {
			if (!oControl._bThemeApplied) {
				return;
			}
			var sDv1 = oControl.getDisplayValue1();
			var sDv2 = oControl.getDisplayValue2();
			var fVal1 = oControl.getValue1();
			var fVal2 = oControl.getValue2();
			var sDdv = oControl.getDeltaDisplayValue();
			var sAdv1ToShow = sDv1 ? sDv1 : "" + fVal1;
			var sAdv2ToShow = sDv2 ? sDv2 : "" + fVal2;
			var sAddvToShow = sDdv ? sDdv : "" + oControl._getDeltaValue();
			var sColor = oControl.getColor();

			var fnSetColor = function(sColor, sStyle) {
				if (MicroChartColorType.hasOwnProperty(sColor)) {
					oRm.class("sapSuiteDMCSemanticColor" + sColor);
				} else {
					/**
					 * @deprecated As of version 1.120
					 */
					oRm.style(sStyle, Parameters.get(sColor) || sColor);
				}
			};

			var sTitle1 = oControl.getTitle1();
			var sTitle2 = oControl.getTitle2();
			var sView = oControl.getView();

			oRm.openStart("div", oControl);
			this._writeMainProperties(oRm, oControl);

			if (!sTitle1) {
				oRm.class("sapSuiteDMCNoTitleTop");
			}

			if (!sTitle2) {
				oRm.class("sapSuiteDMCNoTitleBottom");
			}

			if (sView === DeltaMicroChartViewType.Wide) {
				oRm.class("sapSuiteDMCWideMode");
			}

			oRm.openEnd();

			oRm.openStart("div");
			oRm.class("sapSuiteDMCVerticalAlignmentContainer");
			oRm.openEnd();

			if ((sTitle1 || sTitle2) && (sView === DeltaMicroChartViewType.Wide || sView === DeltaMicroChartViewType.Responsive)) {
				oRm.openStart("div");
				oRm.class("sapSuiteDMCWideTitles");
				oRm.class("sapSuiteDMCLabel");
					oRm.openEnd();
				this._renderTitle(oRm, sTitle1, "sapSuiteDMCPositionTop");
				this._renderTitle(oRm, sTitle2, "sapSuiteDMCPositionBtm");
				oRm.close("div"); // end ofsapSuiteDMCWideTitles

				oRm.openStart("div");
				oRm.class("sapSuiteDMCSpacer");
				oRm.class("sapSuiteDMCSpacerLeft");
					oRm.openEnd();
				oRm.close("div");
			}

			oRm.openStart("div");
			oRm.class("sapSuiteDMCCnt");
			oRm.openEnd();

			if (sTitle1 && (sView === DeltaMicroChartViewType.Normal || sView === DeltaMicroChartViewType.Responsive)) {
				this._renderTitle(oRm, sTitle1, "sapSuiteDMCPositionTop");
			}

			oRm.openStart("div", oControl.getId() + "-dmc-chart");
			oRm.class("sapSuiteDMCChart");
			oRm.openEnd();
			oRm.openStart("div", oControl.getId() + "-dmc-bar1");
			oRm.class("sapSuiteDMCBar");
			oRm.class("sapSuiteDMCBar1");

			if (oControl._oChartData.delta.isMax) {
				oRm.class("sapSuiteDMCBarDeltaMaxDelta");
			}
			if (oControl._oChartData.bar1.isSmaller) {
				oRm.class("sapSuiteDMCBarSizeSmaller");
			}
			if (parseFloat(oControl._oChartData.bar1.width) === 0) {
				oRm.class("sapSuiteDMCBarZeroWidth");
			} else if (parseFloat(oControl._oChartData.bar2.width) === 0) {
				oRm.class("sapSuiteDMCBarUniqueNonzero");
			}
			oRm.class(getDir(oControl._oChartData.bar1.left));
			oRm.style("width", oControl._oChartData.bar1.width + "%");
			oRm.openEnd();
			oRm.openStart("div");
			oRm.class("sapSuiteDMCBarInternal");
			oRm.class(getDir(oControl._oChartData.bar2.left));
			oRm.openEnd();
			oRm.close("div");
			oRm.close("div");

			oRm.openStart("div", oControl.getId() + "-dmc-bar2");
			oRm.class("sapSuiteDMCBar");
			oRm.class("sapSuiteDMCBar2");
			if (oControl._oChartData.delta.isMax) {
				oRm.class("sapSuiteDMCBarDeltaMaxDelta");
			}
			if (oControl._oChartData.bar2.isSmaller) {
				oRm.class("sapSuiteDMCBarSizeSmaller");
			}
			if (parseFloat(oControl._oChartData.bar2.width) === 0) {
				oRm.class("sapSuiteDMCBarZeroWidth");
			} else if (parseFloat(oControl._oChartData.bar1.width) === 0) {
				oRm.class("sapSuiteDMCBarUniqueNonzero");
			}
			oRm.class(getDir(oControl._oChartData.bar2.left));
			oRm.style("width", oControl._oChartData.bar2.width + "%");
			oRm.openEnd();
			oRm.openStart("div");
			oRm.class("sapSuiteDMCBarInternal");
			oRm.class(getDir(oControl._oChartData.bar1.left));
			oRm.openEnd();
			oRm.close("div");
			oRm.close("div");

			oRm.openStart("div", oControl.getId() + "-dmc-bar-delta");
			oRm.class("sapSuiteDMCBar");
			oRm.class("sapSuiteDMCBarDelta");
			if (!oControl._oChartData.delta.isMax) {
				oRm.class("sapSuiteDMCBarDeltaNotMax");
			}
			if (oControl._oChartData.delta.isZero) {
				oRm.class("sapSuiteDMCBarDeltaZero");
			}
			if (oControl._oChartData.delta.isEqual) {
				oRm.class("sapSuiteDMCBarDeltaEqual");
			}
			oRm.class(getDir(oControl._oChartData.delta.left));
			oRm.style("width", oControl._oChartData.delta.width + "%");
			oRm.openEnd();
			oRm.openStart("div");
			fnSetColor(sColor, "background-color");
			oRm.class("sapSuiteDMCBarDeltaInt");
			oRm.openEnd();
			oRm.close("div");

			oRm.openStart("div");
			oRm.class("sapSuiteDMCBarDeltaStripe");
			oRm.class(getDir(true));
			if (oControl._oChartData.delta.isEqual) {
				oRm.class("sapSuiteDMCBarDeltaEqual");
			}
			oRm.class("sapSuiteDMCBarDeltaFirstStripe" + (oControl._oChartData.delta.isFirstStripeUp ? "Up" : "Down"));
			oRm.openEnd();
			oRm.close("div");

			oRm.openStart("div");
			oRm.class("sapSuiteDMCBarDeltaStripe");
			oRm.class(getDir(false));
			oRm.class("sapSuiteDMCBarDeltaFirstStripe" + (oControl._oChartData.delta.isFirstStripeUp ? "Down" : "Up"));
			oRm.openEnd();
			oRm.close("div");
			oRm.close("div");
			oRm.close("div"); // end of sapSuiteDMCChart

			if (sTitle2 && (sView === DeltaMicroChartViewType.Normal || sView === DeltaMicroChartViewType.Responsive)) {
				this._renderTitle(oRm, sTitle2, "sapSuiteDMCPositionBtm");
			}

			oRm.close("div"); // end of sapSuiteDMCCnt

			oRm.openStart("div");
			oRm.class("sapSuiteDMCSpacer");
			oRm.class("sapSuiteDMCSpacerRight");
			oRm.openEnd();
			oRm.close("div");

			oRm.openStart("div");
			oRm.class("sapSuiteDMCLbls");
			oRm.openEnd();
			oRm.openStart("div", oControl.getId() + "-value1");
			oRm.class("sapSuiteDMCLabel");
			oRm.class("sapSuiteDMCValue1");
			oRm.openEnd();
			oRm.text(sAdv1ToShow);
			oRm.close("div");

			oRm.openStart("div", oControl.getId() + "-delta");
			oRm.class("sapSuiteDMCLabel");
			oRm.class("sapSuiteDMCDelta");
			fnSetColor(sColor, "color");
			oRm.openEnd();
			oRm.text(sAddvToShow);
			oRm.close("div");

			oRm.openStart("div", oControl.getId() + "-value2");
			oRm.class("sapSuiteDMCLabel");
			oRm.class("sapSuiteDMCValue2");
			oRm.openEnd();
			oRm.text(sAdv2ToShow);
			oRm.close("div");
			oRm.close("div"); // end of sapSuiteDMCLbls

			oRm.close("div");
			oRm.close("div");
		} else {
			this._renderNoData(oRm, oControl);
		}
	};

		DeltaMicroChartRenderer._renderTitle = function(oRm, sTitle, sClass) {
			oRm.openStart("div");
			oRm.class("sapSuiteDMCLabel");
			oRm.class("sapSuiteDMCTitle");
			oRm.class(sClass);
			oRm.openEnd();
			oRm.text(sTitle);
			oRm.close("div");
		};


		/**
		 * Renders control data and prepares default classes and styles
		 *
		 * @param {object} oRm render manager
		 * @param {object} oControl AreaMicroChart control
		 * @private
		 */
		DeltaMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
			var bIsActive = oControl.hasListeners("press");

			this._renderActiveProperties(oRm, oControl);

			var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
			oRm.attr("role", "figure");

			if (oControl.getAriaLabelledBy().length) {
				oRm.accessibilityState(oControl);
			} else {
				oRm.attr("aria-label", sAriaLabel);
			}

			oRm.class("sapSuiteDMC");
			oRm.class("sapSuiteDMCSize" + oControl.getSize());
			oRm.style("width", oControl.getWidth());
			oRm.style("height", oControl.getHeight());
		};

	MicroChartRenderUtils.extendMicroChartRenderer(DeltaMicroChartRenderer);

	return DeltaMicroChartRenderer;

}, /* bExport= */ true);
