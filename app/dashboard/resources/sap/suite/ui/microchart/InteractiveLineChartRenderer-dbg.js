/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/m/library"
], function(MobileLibrary) {
	"use strict";

	/**
	 * InteractiveLineChartRenderer renderer.
	 * @namespace
	 */
	var InteractiveLineChartRenderer = {
		apiVersion: 2
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render - Output - Buffer
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl the control to be rendered
	 */
	InteractiveLineChartRenderer.render = function (oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}
		if (oControl.getShowError()) {
			oRm.openStart("div", oControl);
			oRm.class("sapSuiteUiMicroChartNoData");
			oRm.openEnd();
			oRm.renderControl(oControl._oIllustratedMessageControl);
			oRm.close("div");
			return;
		}

		var nPointsLength = oControl._iVisiblePointsCount,
			nPercentageWidth = 100 / nPointsLength;
		oRm.openStart("div", oControl);
		oRm.class("sapSuiteILC");

		//container accessibility
		var oAccOptions = {};
		oAccOptions.role = "listbox";
		oAccOptions.roledescription = oControl._oRb.getText("INTERACTIVELINECHART");
		oAccOptions.multiselectable = true;
		oAccOptions.disabled = !oControl._isChartEnabled();
		oAccOptions.labelledby = oControl.getAriaLabelledBy();
		oAccOptions.owns = this._getAriaOwns(oControl, nPointsLength);
		oRm.accessibilityState(oControl, oAccOptions);

		//tooltip for non-interactive chart
		if (!oControl._isChartEnabled()) {
			var sAreaTooltip = oControl.getTooltip_AsString();
			if (typeof sAreaTooltip === "string" || sAreaTooltip instanceof String) {
				oRm.attr("title", sAreaTooltip);
			}
		}

		oRm.openEnd();

		oRm.openStart("div");
		oRm.class("sapSuiteILCWrapperChild");
		oRm.attr("aria-hidden", "true");
		oRm.openEnd();
		oRm.openStart("div");
		oRm.class("sapSuiteILCInner");
		oRm.openEnd();

		if (!oControl.getSelectionEnabled()) {
			this._renderDisabledOverlay(oRm, oControl);
		}
		this._renderChartCanvas(oRm, oControl, nPointsLength, nPercentageWidth);
		oRm.openStart("div");
		oRm.class("sapSuiteILCBottomLabelArea");
		if (oControl._fNormalizedZero) {
			oRm.class("sapSuiteILCBottomLabelAreaNoDivider");
		}
		oRm.openEnd();
		oRm.close("div");

		oRm.openStart("div");
		oRm.class("sapSuiteILCInteraction");
		oRm.openEnd();

		for (var iIndex = 0; iIndex < nPointsLength; iIndex++) {
			this._renderPoint(oRm, oControl, iIndex, nPointsLength, nPercentageWidth);
		}
		oRm.close("div");
		oRm.close("div");

		var sLastLabel = "",
			bRenderedWrapper = false,
			aPoints = oControl.getPoints();

		for (var i = 0; i < nPointsLength; i++) {
			var oChild = aPoints[i],
				sSecondaryLabel = oChild.getSecondaryLabel();

			if (sSecondaryLabel && sLastLabel !== sSecondaryLabel) {
				sLastLabel = sSecondaryLabel;
				// render wrapper only if there is an item with secondary label
				if (!bRenderedWrapper) {
					bRenderedWrapper = true;
					oRm.openStart("div");
					oRm.class("sapSuiteILCInnerBottom");
					oRm.openEnd();
				}
				this._renderSecondaryLabel(oRm, oChild, i, nPercentageWidth, sLastLabel);
			}
		}
		if (bRenderedWrapper) {
			oRm.close("div");
		}

		oRm.close("div");
		oRm.close("div");
	};

	InteractiveLineChartRenderer._renderSecondaryLabel = function (oRm, oControl, index, percentageWidth, sLabel) {
		oRm.openStart("div");
		oRm.class("sapSuiteILCSecondaryLabel");

		oRm.style("width", percentageWidth + "%");
		oRm.style("left", (index * percentageWidth) + "%");
		oRm.openEnd();
		oRm.text(sLabel);
		oRm.close("div");
	};

	/**
	 * Renders the HTML for the given point, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The control to be rendered
	 * @param {int} index The index of the point to be rendered inside the points aggregation
	 * @param {int} pointsLength The amount of points to be displayed
	 * @param {int} percentageWidth The width of the current point expressed in percentage from the total available chart width
	 * @private
	 */
	InteractiveLineChartRenderer._renderPoint = function (oRm, oControl, index, pointsLength, percentageWidth) {
		var oPoint = oControl.getPoints()[index];

		oRm.openStart("div", oControl.getId() + "-point-area-" + index);
		oRm.class("sapSuiteILCSection");
		oRm.class("sapSuiteILCCanvasLayout");
		if (oPoint.getSelected()) {
			oRm.class("sapSuiteILCSelected");
		}
		oRm.style("width", percentageWidth + "%");
		oRm.style("left", (index * percentageWidth) + "%");
		oRm.openEnd();

		//render point
		var sColor = oPoint.getColor();

		if (oPoint._bNullValue) {
			oRm.openStart("div");
		} else {
			oRm.openStart("div", oControl.getId() + "-point-" + index);
			if (oPoint.getSelected()) {
				oRm.class("sapSuiteILCSelected");
			}
			if (sColor !== MobileLibrary.ValueColor.Neutral) {
				oRm.class("sapSuiteICSemanticColor" + sColor);
			}
			oRm.class("sapSuiteILCPoint");
			oRm.style("bottom", oControl._aNormalizedValues[index] + "%");
		}
		oRm.openEnd();
		oRm.close("div");

		oRm.openStart("div");
		oRm.class("sapSuiteILCBackgroundArea");
		oRm.openEnd();
		oRm.close("div");

		var sAriaLabel = this._renderPointLabel(oRm, oControl, index, pointsLength);
		var sSemanticColor = oPoint._getSemanticColor();
		if (sSemanticColor) {
			sAriaLabel += " " + sSemanticColor;
		}
		var sTooltip = oPoint.getTooltip_Text();
		if (sTooltip && sTooltip.trim()) {
			sAriaLabel = sTooltip;
		}

		oRm.openStart("div", oControl.getId() + "-interaction-area-" + index);
		oRm.class("sapSuiteILCInteractionArea");
		oRm.class("sapMPointer");
		if (index === 0 && oControl._isChartEnabled()) {
			oRm.attr("tabindex", "0");
		}

		// point accessibility
		var oAccOptions = {};
		oAccOptions.role = "option";
		oAccOptions.label = sAriaLabel;
		oAccOptions.selected = oPoint.getSelected();
		oAccOptions.posinset = index + 1;
		oAccOptions.setsize = pointsLength;
		oRm.accessibilityState(oPoint, oAccOptions);

		//tooltip for interactive mode
		// if (oControl._isChartEnabled()) {
		// 	var sAreaTooltip = oPoint.getTooltip_AsString();
		// 	if (typeof sAreaTooltip === "string" || sAreaTooltip instanceof String) {
		// 		oRm.attr("title", sAreaTooltip);
		// 	}
		// }

		oRm.openEnd();
		oRm.close("div");
		oRm.close("div");
	};

	/**
	 * Renders the HTML for the given chart canvas, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The control to be rendered
	 * @param {int} displayedPoints The amount of points to be displayed
	 * @param {int} percentageWidth The width corresponding to each point expressed in percentage from the total available chart width
	 * @private
	 */
	InteractiveLineChartRenderer._renderChartCanvas = function (oRm, oControl, displayedPoints, percentageWidth) {
		var i,
			aPoints = oControl.getPoints();
		if (aPoints.length != 0) {
			oRm.openStart("div");
			oRm.class("sapSuiteILCChartCanvas");
			oRm.class("sapSuiteILCCanvasLayout");
			oRm.openEnd();

			oRm.openStart("svg");
			oRm.class("sapSuiteILCSvgElement");
			oRm.attr("focusable", "false");
			oRm.openEnd();

			if (oControl._fNormalizedZero) {
				oRm.openStart("line");
				oRm.attr("x1", "1%");
				oRm.attr("y1", 100 - oControl._fNormalizedZero + "%");
				oRm.attr("x2", "99%");
				oRm.attr("y2", 100 - oControl._fNormalizedZero + "%");
				oRm.attr("stroke-width", "1");
				oRm.class("sapSuiteILCDivider");
				oRm.openEnd();
				oRm.close("line");
			}

			var fnCreateLine = function (i, y, y1) {
				oRm.openStart("line");
				oRm.attr("x1", percentageWidth / 2 + (i - 1) * percentageWidth + "%");
				oRm.attr("y1", 100 - y + "%");
				oRm.attr("x2", percentageWidth / 2 + (i * percentageWidth) + "%");
				oRm.attr("y2", 100 - y1 + "%");
				oRm.attr("stroke-width", "2");
				oRm.openEnd();
				oRm.close("line");
			};

			for (i = 1; i < displayedPoints; i++) {
				if (!aPoints[i - 1]._bNullValue && !aPoints[i]._bNullValue) {
					fnCreateLine(i, oControl._aNormalizedValues[i - 1], oControl._aNormalizedValues[i]);
				}
			}

			if (oControl._fNormalizedPrecedingPoint !== null) {
				fnCreateLine(0, oControl._fNormalizedPrecedingPoint, oControl._aNormalizedValues[0]);
			}

			if (oControl._fNormalizedSucceedingPoint !== null) {
				fnCreateLine(i, oControl._aNormalizedValues[i - 1], oControl._fNormalizedSucceedingPoint);
			}

			oRm.close("svg");
			oRm.close("div");
		}
	};

	/**
	 * Renders the label to be displayed for the current point, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The control to be rendered
	 * @param {int} index The index of the point to be rendered inside the points aggregation
	 * @param {int} pointsLength The amount of points to be displayed
	 * @returns {string} The value of the aria-label accessibility attribute
	 * @private
	 */
	InteractiveLineChartRenderer._renderPointLabel = function (oRm, oControl, index, pointsLength) {
		var oPoint = oControl.getPoints()[index];
		var sBottomLabelText = oPoint.getLabel() || "",
			sTopLabelText = oPoint.getDisplayedValue(),
			sSecondaryLabelText = oPoint.getSecondaryLabel() || "";
		var aHeights;
		oRm.openStart("div");
		oRm.class("sapSuiteILCTextElement");
		oRm.class("sapSuiteILCBottomText");
		oRm.class("sapMPointer");
		oRm.openEnd();
		oRm.text(sBottomLabelText);
		oRm.close("div");
		oRm.openStart("div");
		oRm.class("sapSuiteILCTextElement");
		oRm.class("sapSuiteILCToplabel");
		oRm.class("sapMPointer");
		if (!oPoint._bNullValue) {
			if (!sTopLabelText) {
				sTopLabelText = oPoint.getValue().toString();
			}
			aHeights = [oControl._aNormalizedValues[index]];
			if (index > 0 && !oControl.getPoints()[index - 1]._bNullValue) {
				aHeights.push((oControl._aNormalizedValues[index] + oControl._aNormalizedValues[index - 1]) / 2);
			}
			if (index < pointsLength - 1 && !oControl.getPoints()[index + 1]._bNullValue) {
				aHeights.push((oControl._aNormalizedValues[index] + oControl._aNormalizedValues[index + 1]) / 2);
			}
			aHeights.sort(function (a, b) {
				return a - b;
			});
			if (oPoint.getValue() === oControl.nMax && oControl.nMax !== oControl.nMin) {
				oRm.style("bottom", aHeights[aHeights.length - 1] + "%");
				oRm.class("sapSuiteILCShiftAbove");
			} else if (oPoint.getValue() === oControl.nMin && oControl.nMax !== oControl.nMin) {
				oRm.style("bottom", aHeights[0] + "%");
				oRm.class("sapSuiteILCShiftBelow");
			} else if (Math.abs(oControl._aNormalizedValues[index] - aHeights[0]) < Math.abs(oControl._aNormalizedValues[index] - aHeights[aHeights.length - 1])) {
				oRm.style("bottom", aHeights[0] + "%");
				oRm.class("sapSuiteILCShiftBelow");
			} else {
				oRm.style("bottom", aHeights[aHeights.length - 1] + "%");
				oRm.class("sapSuiteILCShiftAbove");
			}
		} else {
			sTopLabelText = oControl._oRb.getText("INTERACTIVECHART_NA");
			oRm.class("sapSuiteILCShiftBelow");
			oRm.class("sapSuiteILCNaLabel");
		}
		oRm.openEnd();
		oRm.text(sTopLabelText);
		oRm.close("div");

		return sBottomLabelText + " "
			+ (sSecondaryLabelText === "" ? "" : sSecondaryLabelText + " ")
			+ sTopLabelText;
	};

	/**
	 * Renders an additional disabling overlay.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The control to be rendered
	 * @private
	 */
	InteractiveLineChartRenderer._renderDisabledOverlay = function (oRm, oControl) {
		oRm.openStart("div");
		oRm.class("sapSuiteILCDisabledOverlay");
		oRm.openEnd();
		oRm.close("div");
	};

	/**
	 * Creates a space-separated list of one or more defined id attributes on the element(s)
	 *
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The parent control of the element(s)
	 * @param {int} pointsLength The amount of points
	 * @param {string} sIdSuffix The suffix of the element ID
	 * @returns {string} A space-separated list of IDs
	 * @private
	 */
	InteractiveLineChartRenderer._getIdReferenceList = function (oControl, pointsLength, sIdSuffix) {
		var aPointsIds = [];
		for (var i = 0; i < pointsLength; i++) {
			aPointsIds.push(oControl.getId() + sIdSuffix + i);
		}
		return aPointsIds.join(" ");
	};

	/**
	 * Creates the value of the aria-describedby accessibility attribute
	 *
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The control to be rendered
	 * @param {int} pointsLength The amount of points
	 * @returns {string} A comma-separated list of all PointAreas' IDs
	 * @private
	 */
	InteractiveLineChartRenderer._getAriaDescribedBy = function (oControl, pointsLength) {
		return this._getIdReferenceList(oControl, pointsLength, "-point-area-");
	};

	/**
	 * Creates the value of the aria-owns accessibility attribute
	 *
	 * @param {sap.suite.ui.microchart.InteractiveLineChart} oControl The control to be rendered
	 * @param {int} pointsLength The amount of points
	 * @returns {string} A space-separated list of all InteractionAreas' IDs
	 * @private
	 */
	InteractiveLineChartRenderer._getAriaOwns = function (oControl, pointsLength) {
		return this._getIdReferenceList(oControl, pointsLength, "-interaction-area-");
	};

	return InteractiveLineChartRenderer;

}, /* bExport */ true);
