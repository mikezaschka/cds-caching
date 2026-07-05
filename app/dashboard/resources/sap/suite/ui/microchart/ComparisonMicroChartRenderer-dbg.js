/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	    './library',
		'sap/suite/ui/microchart/MicroChartRenderUtils',
		'sap/ui/core/theming/Parameters',
		'sap/m/library'
	],
	function(library, MicroChartRenderUtils, Parameters, mobileLibrary) {
	"use strict";

	const MicroChartColorType = library.MicroChartColorType;
	// shortcut for sap.m.Size
	var Size = mobileLibrary.Size;

	/**
	 * ComparisonMicroChart renderer.
	 * @namespace
	 */
	var ComparisonMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm
	 *			the RenderManager that can be used for writing to
	 *			the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.ComparisonMicroChart} oControl
	 *			the control to be rendered
	 */
	ComparisonMicroChartRenderer.render = function (oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		if (oControl._hasData()) {
			var sAriaLabel = oControl.getTooltip_AsString(oControl.hasListeners("press"));

			oRm.openStart("div", oControl);
			this._writeMainProperties(oRm, oControl);

			if (oControl.getShrinkable()) {
				oRm.class("sapSuiteCpMCShrinkable");
				oRm.style("height", "auto");
			}

			oRm.openEnd();

			this._renderInnerContent(oRm, oControl, sAriaLabel);

			oRm.openStart("div", oControl.getId() + "-info");
			oRm.attr("aria-hidden", "true");
			oRm.style("display", "none");
			oRm.openEnd();
			oRm.text(sAriaLabel);
			oRm.close("div");

			oRm.openStart("div", oControl.getId() + "-hidden");
			oRm.attr("aria-hidden", "true");
		//	oRm.writeAttribute("tabindex", "-1");
			oRm.attr("focusable", "false");
			oRm.openEnd();
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
		ComparisonMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
			var bIsActive = oControl.hasListeners("press");

			this._renderActiveProperties(oRm, oControl);

			var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
			oRm.attr("role", "figure");

			if (oControl.getAriaLabelledBy().length) {
				oRm.accessibilityState(oControl);
			} else {
				oRm.attr("aria-label", sAriaLabel);
			}

			oRm.class("sapSuiteCpMC");
			oRm.class("sapSuiteCpMCChartContent");

			// size just defines the size of the dom element
			oRm.class(oControl._isResponsive() ? "sapSuiteCpMCResponsive" : "sapSuiteCpMCSize" + oControl.getSize());
			// view mode for backward compatibility
			oRm.class("sapSuiteCpMCViewType" + oControl.getView());

			oRm.style("width", oControl.getWidth());
			oRm.style("height", oControl.getHeight());
		};

	ComparisonMicroChartRenderer._renderInnerContent = function(oRm, oControl) {
		var iCPLength = oControl.getColorPalette().length,
			iCPIndex = 0,
			aData = oControl.getData(),
			aChartData = oControl._calculateChartData(),
			sParameterColor;

		var fnNextColor = function(sColor) {
			if (iCPLength) {
				if (iCPIndex === iCPLength) {
					iCPIndex = 0;
				}
				sColor = oControl.getColorPalette()[iCPIndex++].trim();
			}
			/**
				* @deprecated As of version 1.120
			*/
			sParameterColor = Parameters.get(sColor);

			return sParameterColor || sColor;
		};

		oRm.openStart("div");
		oRm.class("sapSuiteCpMCVerticalAlignmentContainer");
		oRm.openEnd();

		for (var i = 0; i < aChartData.length; i++) {
			this._renderChartItem(oRm, oControl, aChartData[i], i, fnNextColor(aData[i].getColor()));
		}
		oRm.close("div");
	};

	ComparisonMicroChartRenderer._renderChartItem = function(oRm, oControl, oChartData, iIndex, sColor) {
		var aData = oControl.getData();
		var sSize = oControl._getSize();
		var isChartBig = sSize === Size.L || sSize === Size.M;
		oRm.openStart("div", aData[iIndex]);
		oRm.class("sapSuiteCpMCChartItem");
		if (isChartBig) {
			this._applyAriaAttributes(oRm,oControl,iIndex);
		}
		oRm.openEnd();
			this._renderChartTitle(oRm, oControl, iIndex);
			this._renderChartBar(oRm, oControl, oChartData, iIndex, sColor);
			this._renderChartValue(oRm, oControl, iIndex, sColor);
		oRm.close("div");
	};

	ComparisonMicroChartRenderer._applyAriaAttributes = function(oRm, oControl, iIndex) {
		if (oControl.getData()[iIndex].hasListeners("press")) {
			if (iIndex === 0) {
				oRm.attr("tabindex", "0");
			}
			oRm.attr("role", "presentation");
			oRm.attr("aria-label", oControl._getBarAltText(iIndex));
			if (!library._isTooltipSuppressed(oControl._getBarAltText(iIndex))) {
				oRm.attr("title", oControl._getBarAltText(iIndex));
			} else {
				// By setting the empty title attribute on the bar, the following desired behavior is achieved:
				// no tooltip is displayed when hovering over the bar press area, independent whether the tooltip of the chart is suppressed or displayed.
				oRm.attr("title", "");
			}
			oRm.attr("data-bar-index", iIndex);
			oRm.class("sapSuiteUiMicroChartBarPointer");
		}
	};

	ComparisonMicroChartRenderer._renderChartBar = function(oRm, oControl, oChartData, iIndex, sColor) {
		var oData = oControl.getData()[iIndex];
		var sSize = oControl._getSize();
		var isChartBig = sSize === Size.L || sSize === Size.M;

		oRm.openStart("div", oControl.getId() + "-chart-item-bar-" + iIndex);
		oRm.class("sapSuiteCpMCChartBar");

		if (!isChartBig) {
			this._applyAriaAttributes(oRm,oControl,iIndex);
		}
		oRm.openEnd();

		if (oChartData.negativeNoValue > 0) {
			oRm.openStart("div");
			oRm.attr("data-bar-index", iIndex);
			oRm.class("sapSuiteCpMCChartBarNegNoValue");
			if (oChartData.value > 0 || oChartData.positiveNoValue > 0) {
				oRm.class("sapSuiteCpMCNotLastBarPart");
			}
			oRm.style("width", oChartData.negativeNoValue + "%");
			oRm.openEnd();
			oRm.close("div");
		}

		if (oChartData.value > 0) {
			oRm.openStart("div");
			oRm.attr("data-bar-index", iIndex);
			oRm.class("sapSuiteCpMCChartBarValue");
			oRm.class("sapSuiteCpMCSemanticColor" + oData.getColor());
			/**
				* @deprecated As of version 1.120
			*/
			oRm.style("background-color", sColor ? sColor : "");
			oRm.style("width", oChartData.value + "%");
			oRm.openEnd();
			oRm.close("div");
		}

		if (oChartData.positiveNoValue > 0) {
			oRm.openStart("div");
			oRm.attr("data-bar-index", iIndex);
			oRm.class("sapSuiteCpMCChartBarNoValue");
			if (oChartData.negativeNoValue && !oChartData.value) {
				oRm.class("sapSuiteCpMCNegPosNoValue");
			} else if (oChartData.negativeNoValue || oChartData.value) {
				oRm.class("sapSuiteCpMCNotFirstBarPart");
			}
			oRm.style("width", oChartData.positiveNoValue + "%");
			oRm.openEnd();
			oRm.close("div");
		}

		oRm.close("div");
	};

	ComparisonMicroChartRenderer._renderChartTitle = function(oRm, oControl, iIndex) {
		var oData = oControl.getData()[iIndex];

		oRm.openStart("div", oControl.getId() + "-chart-item-" + iIndex + "-title");
		oRm.class("sapSuiteCpMCChartItemTitle");
		oRm.openEnd();
		oRm.text(oData.getTitle());
		oRm.close("div");
	};

	ComparisonMicroChartRenderer._renderChartValue = function(oRm, oControl, iIndex, sColor) {
		var oData = oControl.getData()[iIndex];
		var sScale = oControl.getScale();
		var sDisplayValue = oData.getDisplayValue();
		var sAValToShow = sDisplayValue ? sDisplayValue : "" + oData.getValue();
		var sValScale = sAValToShow + sScale;

		oRm.openStart("div", oControl.getId() + "-chart-item-" + iIndex + "-value");
		oRm.class("sapSuiteCpMCChartItemValue");
		if (MicroChartColorType.hasOwnProperty(sColor)) {
			oRm.class("sapSuiteCpMCSemanticColor" + oData.getColor());
		}
		if (oData.getTitle()) {
			oRm.class("sapSuiteCpMCTitle");
		}
		oRm.openEnd();
		if (!isNaN(oData.getValue())) {
			oRm.text(sValScale);
		}
		oRm.close("div");
	};

	MicroChartRenderUtils.extendMicroChartRenderer(ComparisonMicroChartRenderer);

	return ComparisonMicroChartRenderer;

}, /* bExport= */ true);
