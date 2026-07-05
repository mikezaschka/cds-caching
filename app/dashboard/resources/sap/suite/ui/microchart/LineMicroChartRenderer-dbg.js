/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
		'./library',
		'sap/ui/core/theming/Parameters',
		'sap/suite/ui/microchart/MicroChartRenderUtils'
	],
	function(library, Parameters, MicroChartRenderUtils) {
	"use strict";

	/**
	 * LineMicroChart renderer.
	 * @namespace
	 */
	var LineMicroChartRenderer = {
		apiVersion: 2    // enable in-place DOM patching
	};
	var LineType = library.LineType;
	const MicroChartColorType = library.MicroChartColorType;
	LineMicroChartRenderer.QUALITATIVE_COLOR_CLASS = "sapChart_Sequence_";
	LineMicroChartRenderer.QUALITATIVE_CLASS = "Sequence";
	LineMicroChartRenderer.QUALITATIVE_MAX = 13;

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @public
	 */
	LineMicroChartRenderer.render = function(oRm, oControl) {
		if (oControl._hasData()) {
			oRm.openStart("div", oControl);
			this._writeMainProperties(oRm, oControl);

			if (oControl._bSemanticMode) {
				oRm.class("sapSuiteLMCSemanticMode");
			}
			if (oControl._bFocusMode) {
				oRm.class("sapSuiteLMCFocusMode");
			}

			if (oControl._bNoBottomLabels || !oControl.getShowBottomLabels()) {
				oRm.class("sapSuiteLMCNoBottomLabels");
			}
			if (oControl._bNoTopLabels || !oControl.getShowTopLabels()) {
				oRm.class("sapSuiteLMCNoTopLabels");
			}
			oRm.openEnd();

			oRm.openStart("div");
			oRm.class("sapSuiteLMCVerticalAlignmentContainer");
			oRm.openEnd();

			// Top Labels
			this._renderLabelsTop(oRm, oControl);

			oRm.openStart("div");
			oRm.class("sapSuiteLMCContentWrapper");
			oRm.openEnd();

			// Canvas and SVG
			this._renderCanvas(oRm, oControl);

			this._renderThresholdLabel(oRm, oControl);

			oRm.close("div"); // end of sapSuiteLMCContentWrapper

			// Bottom Labels
			this._renderLabelsBottom(oRm, oControl);
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
		LineMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
			var bIsActive = oControl.hasListeners("press");

			this._renderActiveProperties(oRm, oControl);
			// screen reader
			var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
			oRm.attr("role", "figure");

			if (oControl.getAriaLabelledBy().length) {
				oRm.accessibilityState(oControl);
			} else {
				oRm.attr("aria-label", sAriaLabel);
			}

			oRm.class("sapSuiteLMC");
			oRm.class("sapSuiteLMCSize" + oControl.getSize());

			oRm.style("width", oControl.getWidth());
			oRm.style("height", oControl.getHeight());
		};

	/**
	 * Renders the HTML for the canvas.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderCanvas = function(oRm, oControl) {
		var aPoints;
		var iPointsCount;

		oRm.openStart("div");
		oRm.class("sapSuiteLMCSvgCanvas");
		oRm.openEnd();

		// render the lines if valid scaling
		if (oControl._bScalingValid) {
			oRm.openStart("svg", oControl.getId() + "-sapSuiteLMCSvgElement");
			oRm.attr("focusable", "false");
			oRm.class("sapSuiteLMCSvgElement");
			oRm.openEnd();

			this._renderThresholdLine(oRm, oControl);

			oControl._getLines().forEach(function(oLine, iIndex) {
				oRm.openStart("g", oLine);
				oRm.openEnd();

				iPointsCount = oLine._getPoints().length;

				for (var i = 1; i < iPointsCount; i++) {
					this._renderLine(oRm, oControl, iIndex,
						oLine._aNormalizedPoints[i - 1].x, oLine._aNormalizedPoints[i - 1].y,
						oLine._aNormalizedPoints[i].x, oLine._aNormalizedPoints[i].y);
				}

				oRm.close("g");
			}, this);
			oRm.close('svg');


			oRm.openStart("div", oControl.getId() + "-sapSuiteLMCPointsContainer");
			oRm.class("sapSuiteLMCPointsContainer");
			oRm.openEnd();

			oControl._getLines().forEach(function(oLine, iIndex) {
				aPoints = oLine._getPoints();
				iPointsCount = aPoints.length;

				// render the points if valid scaling
				var bShowPoints = oLine.getShowPoints(),
					oPoint,
					bPointEmphasized;
				if (oLine._bFocusMode || bShowPoints) {
					for (var j = 0; j < iPointsCount; j++) {
						oPoint = aPoints[j];
						bPointEmphasized = this._isPointEmphasized(oPoint);
						if (!oLine._bFocusMode && bShowPoints || oLine._bFocusMode && bPointEmphasized && oPoint.getShow()) {
							this._renderPoint(oRm, oControl, iIndex, oPoint, j, bPointEmphasized);
						}
					}
				}
			}, this);
			oRm.close("div");
		}


		oRm.close("div");
	};

		/**
		 * Renders HTML for the threshold label
		 *
		 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
		 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
		 * @private
		 */
		LineMicroChartRenderer._renderThresholdLabel = function(oRm, oControl) {
		var sValue = oControl.getThresholdDisplayValue();

		if (this._isThresholdValue(oControl) && oControl.getShowThresholdLine() && oControl.getShowThresholdValue()) {
			oRm.openStart("div");
			oRm.class("sapSuiteLMCThresholdLabelWrapper");
			oRm.openEnd();

			oRm.openStart("div");
			oRm.class("sapSuiteLMCThresholdLabel");
			oRm.openEnd();

			sValue = sValue ? sValue : oControl.getThreshold();

			oRm.text(sValue);

			oRm.close("div"); // end of sapSuiteLMCThresholdLabel
			oRm.close("div"); // end of sapSuiteLMCThresholdLabelWrapper
		}
	};

	/**
	 * Renders the HTML for the point.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @param {int} iLineIndex index of the current line
	 * @param {sap.suite.ui.microchart.LineMicroChartPoint} oPoint The point to be rendered
	 * @param {int} iPointIndex The position of the point in the aggregation
	 * @param {boolean} bEmphasized Sets whether or not an emphasized point is to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderPoint = function(oRm, oControl, iLineIndex, oPoint, iPointIndex, bEmphasized) {
		var oLine = oControl._getLines()[iLineIndex],
			sType = oLine.getType(),
			oNormalizedPoint = oLine._aNormalizedPoints[iPointIndex],
			oChartColor = oLine.getColor(),
			oPointColor,
			sStyle,
			bColorSet = false;

		// do not draw point if it is outside the canvas
		if (oNormalizedPoint.x < 0 || oNormalizedPoint.x > 100 || oNormalizedPoint.y < 0 || oNormalizedPoint.y > 100) {
			return;
		}

		oRm.openStart("div");
		oRm.style("left", oNormalizedPoint.x + "%");
		oRm.style("top", (100 - oNormalizedPoint.y) + "%");


		sStyle = (sType === LineType.Dotted) ? "border-color" : "background-color";
		oRm.class("sapSuiteLMCPoint" + sType);

		if (oLine._bFocusMode && oLine._bSemanticMode) {
			oPointColor = oPoint.getColor();
			if (MicroChartColorType.hasOwnProperty(oPointColor)) {
				oRm.class("sapSuiteLMCPoint" + oPointColor);
			} else {
				/**
				 * @deprecated As of version 1.120
				 */
				oRm.style(sStyle, this._getHexColor(oPointColor));
			}
		} else if (!oLine._bFocusMode && oLine._bSemanticMode) {
			if (oPoint.getY() >= oControl.getThreshold()) {
				if (MicroChartColorType.hasOwnProperty(oChartColor.above)) {
					oRm.class("sapSuiteLMCPoint" + oChartColor.above);
				} else {
					/**
					 * @deprecated As of version 1.120
					 */
					oRm.style(sStyle, this._getHexColor(oChartColor.above));
				}
			} else if (MicroChartColorType.hasOwnProperty(oChartColor.below)) {
				oRm.class("sapSuiteLMCPoint" + oChartColor.below);
			} else {
				/**
				 * @deprecated As of version 1.120
				 */
				oRm.style(sStyle, this._getHexColor(oChartColor.below));
			}
		} else if (!oLine._bSemanticMode && typeof oChartColor === "string") {
			if (oLine.getColor() === "Neutral") { // in this case, neutral color changes for each new line
				/**
					* @deprecated As of version 1.135, the concept has been discarded.
				*/
				if (this._getQualitativeColor) {
					oRm.style(sStyle, this._getQualitativeColor(iLineIndex + 1));
					bColorSet = true;
				}
				if (!bColorSet) {
					oRm.class(this._getQualitativeColorClass(iLineIndex + 1, sStyle));
				}
			} else if (MicroChartColorType.hasOwnProperty(oChartColor)) {
				oRm.class("sapSuiteLMCPoint" + oChartColor);
			} else {
				/**
				 * @deprecated As of version 1.120
				 */
				oRm.style(sStyle, this._getHexColor(oChartColor));
			}
		} else {
			/**
				* @deprecated As of version 1.135, the concept has been discarded.
			*/
			if (this._getQualitativeColor) {
				oRm.style(sStyle, this._getQualitativeColor(iLineIndex + 1));
				bColorSet = true;
			}
			if (!bColorSet) {
				oRm.class(this._getQualitativeColorClass(iLineIndex + 1, sStyle));
			}
		}

		oRm.class("sapSuiteLMCPoint");
		if (bEmphasized && oPoint.getShow()) {
			oRm.class("sapSuiteLMCPointEmphasized");
		}

		oRm.openEnd();
		oRm.close("div");
	};

	/**
	 * Renders the HTML for the threshold line.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderThresholdLine = function(oRm, oControl) {
		if (this._isThresholdValue(oControl) && oControl.getShowThresholdLine()) {
			oRm.openStart("line");
			oRm.attr("x1", "0%");
			oRm.attr("y1", (100 - oControl._fNormalizedThreshold) + "%");
			oRm.attr("x2", "100%");
			oRm.attr("y2", (100 - oControl._fNormalizedThreshold) + "%");
			oRm.class("sapSuiteLMCLineThreshold");
			oRm.openEnd();
			oRm.close("line");
		}
	};

	LineMicroChartRenderer._isThresholdValue = function(oControl) {
		return oControl._fNormalizedThreshold >= 0 && oControl._fNormalizedThreshold <= 100
			&& !oControl._bThresholdNull;
	};

	/**
	 * Renders the HTML for the line.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @param {int} iLineIndex index of the current line
	 * @param {int} iStartPosX The horizontal dimension of the starting point
	 * @param {int} iStartPosY The vertical dimension of the starting point
	 * @param {int} iEndPosX The horizontal dimension of the ending point
	 * @param {int} iEndPosY The vertical dimension of the ending point
	 * @private
	 */
	LineMicroChartRenderer._renderLine = function(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, iEndPosX, iEndPosY) {
		// ignore the points which are outside of the scaled canvas ({0, 0}; {100, 100})
		if (this._isDimensionLineOutsideCanvas(oControl, iStartPosX, iEndPosX, "X") || // X dimension
			this._isDimensionLineOutsideCanvas(oControl, iStartPosY, iEndPosY, "Y")) { // Y dimension
			return;
		}

		var fIntersectionX, fIntersectionY,
			iLineWidth = iEndPosX - iStartPosX,
			iLineHeight = iEndPosY - iStartPosY;
		if ((iStartPosY - oControl._fNormalizedThreshold) * (iEndPosY - oControl._fNormalizedThreshold) < 0) {
			// in case the line intersects 0, two different lines will be drawn instead;
			// infinite loop will not occur because the above condition (0*0) < 0 is always false
			fIntersectionX = iStartPosX + (oControl._fNormalizedThreshold - iStartPosY) * iLineWidth / iLineHeight;
			this._renderLine(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, fIntersectionX, oControl._fNormalizedThreshold);
			this._renderLine(oRm, oControl, iLineIndex, fIntersectionX, oControl._fNormalizedThreshold, iEndPosX, iEndPosY);
			// for line strokes to be round rather than cut-off, we must allow visible overflow and get rid of actual overflowing elements manually;
			// detect intersections with regard to the given scaling and split lines recursively while keeping directional angles unchanged
		} else if (iStartPosY * iEndPosY < 0) { // intersection bottom
			fIntersectionX = iStartPosX - iStartPosY * iLineWidth / iLineHeight;
			this._renderLine(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, fIntersectionX, 0);
			this._renderLine(oRm, oControl, iLineIndex, fIntersectionX, 0, iEndPosX, iEndPosY);
		} else if ((iStartPosY - 100) * (iEndPosY - 100) < 0) { // intersection top
			fIntersectionX = iStartPosX + (100 - iStartPosY) * iLineWidth / iLineHeight;
			this._renderLine(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, fIntersectionX, 100);
			this._renderLine(oRm, oControl, iLineIndex, fIntersectionX, 100, iEndPosX, iEndPosY);
		} else if (iStartPosX * iEndPosX < 0) { // intersection left
			fIntersectionY = iStartPosY - iStartPosX * iLineHeight / iLineWidth;
			this._renderLine(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, 0, fIntersectionY);
			this._renderLine(oRm, oControl, iLineIndex, 0, fIntersectionY, iEndPosX, iEndPosY);
		} else if ((iStartPosX - 100) * (iEndPosX - 100) < 0) { // intersection right
			fIntersectionY = iStartPosY + (100 - iStartPosX) * iLineHeight / iLineWidth;
			this._renderLine(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, 100, fIntersectionY);
			this._renderLine(oRm, oControl, iLineIndex, 100, fIntersectionY, iEndPosX, iEndPosY);
		} else {
			this._displayLine(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, iEndPosX, iEndPosY);
		}
	};

	/**
	 * Displays the HTML for the line.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @param {int} iLineIndex index of the current line
	 * @param {int} iStartPosX The horizontal dimension of the starting point
	 * @param {int} iStartPosY The vertical dimension of the starting point
	 * @param {int} iEndPosX The horizontal dimension of the ending point
	 * @param {int} iEndPosY The vertical dimension of the ending point
	 * @private
	 */
	LineMicroChartRenderer._displayLine = function(oRm, oControl, iLineIndex, iStartPosX, iStartPosY, iEndPosX, iEndPosY) {
		var oLine = oControl._getLines()[iLineIndex],
			oChartColor = oLine.getColor(),
			bColorSet = false;

		oRm.openStart("line");
		oRm.attr("x1", iStartPosX + "%");
		oRm.attr("y1", (100 - iStartPosY) + "%");
		oRm.attr("x2", iEndPosX + "%");
		oRm.attr("y2", (100 - iEndPosY) + "%");
		oRm.class("sapSuiteLMCLine");
		oRm.class("sapSuiteLMCLine" + oLine.getType());

		if (oLine._bSemanticMode && oLine._bFocusMode) {
			oRm.class("sapSuiteLMCLineNeutral");
		} else if (oLine._bSemanticMode && !oLine._bFocusMode) {
			if (iStartPosY >= oControl._fNormalizedThreshold && iEndPosY >= oControl._fNormalizedThreshold) {
				if (MicroChartColorType.hasOwnProperty(oChartColor.above)) {
					oRm.class("sapSuiteLMCLine" + oChartColor.above);
				} else {
					/**
					 * @deprecated As of version 1.120
					 */
					oRm.style("stroke", this._getHexColor(oChartColor.above));
				}
			} else if (MicroChartColorType.hasOwnProperty(oChartColor.below)) {
				oRm.class("sapSuiteLMCLine" + oChartColor.below);
			} else {
				/**
				 * @deprecated As of version 1.120
				 */
				oRm.style("stroke", this._getHexColor(oChartColor.below));
			}
		} else if (!oLine._bSemanticMode && typeof oChartColor === "string") {
			if (oChartColor === "Neutral") { // in this case, neutral color changes for each new line
			/**
				* @deprecated As of version 1.135, the concept has been discarded.
			*/
			if (this._getQualitativeColor) {
				oRm.style("stroke", this._getQualitativeColor(iLineIndex + 1));
				bColorSet = true;
			}
			if (!bColorSet) {
				oRm.class(this._getQualitativeColorClass(iLineIndex + 1));
			}
			} else if (MicroChartColorType.hasOwnProperty(oChartColor)) {
				oRm.class("sapSuiteLMCLine" + oChartColor);
			} else {
				/**
				 * @deprecated As of version 1.120
				 */
				oRm.style("stroke", this._getHexColor(oChartColor));
			}
		} else {
			/**
				* @deprecated As of version 1.135, the concept has been discarded.
			*/
			if (this._getQualitativeColor) {
				oRm.style("stroke", this._getQualitativeColor(iLineIndex + 1));
				bColorSet = true;
			}
			if (!bColorSet) {
				oRm.class(this._getQualitativeColorClass(iLineIndex + 1));
			}
		}
		oRm.openEnd();
		oRm.close("line");
	};

	/**
		* @deprecated As of version 1.135, the concept has been discarded.
	*/
	LineMicroChartRenderer._getQualitativeColor = function(iIndex) {
		return this._getHexColor(this.QUALITATIVE_COLOR_CLASS + (iIndex % this.QUALITATIVE_MAX));
	};

	LineMicroChartRenderer._getQualitativeColorClass = function(iIndex, sStyle) {
		if (sStyle == "border-color") {
			return "sapSuiteLMCBorder" + this.QUALITATIVE_CLASS + (iIndex % this.QUALITATIVE_MAX);
		} else if (sStyle == "background-color") {
			return "sapSuiteLMCBackground" + this.QUALITATIVE_CLASS + (iIndex % this.QUALITATIVE_MAX);
		} else {
			return "sapSuiteLMCStroke" + this.QUALITATIVE_CLASS + (iIndex % this.QUALITATIVE_MAX);
		}
	};

	/**
	 * Renders the HTML for the bottom labels.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderLabelsBottom = function(oRm, oControl) {
		var sLeftBottomLabel = oControl.getLeftBottomLabel(),
			sRightBottomLabel = oControl.getRightBottomLabel();

		if (!oControl.getShowBottomLabels() || (!sLeftBottomLabel && !sRightBottomLabel)) {
			return;
		}

		oRm.openStart("div");
		oRm.class("sapSuiteLMCLabels");
		oRm.class("sapSuiteLMCLabelsBottom");
		oRm.openEnd();

		if ((sLeftBottomLabel && sLeftBottomLabel.length > 0) || (sRightBottomLabel && sRightBottomLabel.length > 0)) {
			// left bottom label
			oRm.openStart("div");
			oRm.class("sapSuiteLMCLeftBottomLabel");
			oRm.class("sapSuiteLMCLabel");
			oRm.openEnd();
			oRm.text(sLeftBottomLabel);
			oRm.close("div");

			// right bottom label
			oRm.openStart("div");
			oRm.class("sapSuiteLMCRightBottomLabel");
			oRm.class("sapSuiteLMCLabel");
			oRm.openEnd();
			oRm.text(sRightBottomLabel);
			oRm.close("div");
		}

		oRm.close("div");
	};

	/**
	 * Renders the HTML for the top labels.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderLabelsTop = function(oRm, oControl) {
		var sLeftTopLabel = oControl.getLeftTopLabel(),
			sRightTopLabel = oControl.getRightTopLabel(),
			oLine = oControl._getLines()[0];

		if (!oControl.getShowTopLabels() || (!sLeftTopLabel && !sRightTopLabel)) {
			return;
		}

		var sTopLeftSemanticClass = "",
			sTopRightSemanticClass = "",
			sTopLeftColorStyle = "",
			sTopRightColorStyle = "",
			aPoints,
			iPointsNum,
			oFirstPoint,
			oLastPoint,
			oColor;



		var fnAddColorStyle = function (sColor) {
			oRm.style("color", sColor);
		};

		var fnSetClassOrStyle = function (oPoint, bIsTopRight) {
			var sSemanticClass = "",
				sColorStyle = "";

			if (this._isPointEmphasized(oPoint) && oPoint.getShow()) {
				oColor = oPoint.getColor();
				if (MicroChartColorType.hasOwnProperty(oColor)) {
					sSemanticClass = "sapSuiteLMCLabel" + oColor;
				} else {
					/**
					 * @deprecated As of version 1.120
					 */
					sColorStyle = this._getHexColor(oColor);
				}
			} else {
				sSemanticClass = "sapSuiteLMCLabelNeutral";
			}

			if (bIsTopRight) {
				sTopRightColorStyle = sColorStyle;
				sTopRightSemanticClass = sSemanticClass;
			} else {
				sTopLeftColorStyle = sColorStyle;
				sTopLeftSemanticClass = sSemanticClass;
			}
		}.bind(this);

		if (oLine && oLine._getPoints().length > 1) {
			aPoints = oLine._getPoints();
			iPointsNum = aPoints.length;
			oFirstPoint = aPoints[0];
			oLastPoint = aPoints[iPointsNum - 1];
			var oChartColor = oLine.getColor();

			if (oLine._bFocusMode && oLine._bSemanticMode && oControl._bScalingValid) {
				fnSetClassOrStyle(oFirstPoint, false);
				fnSetClassOrStyle(oLastPoint, true);
			} else if (!oLine._bFocusMode && oLine._bSemanticMode && oControl._bScalingValid && oLine.getShowPoints() &&
					MicroChartColorType.hasOwnProperty(oChartColor.above) && MicroChartColorType.hasOwnProperty(oChartColor.below)) {

				if (oFirstPoint.getY() >= oControl.getThreshold()) {
					sTopLeftSemanticClass = "sapSuiteLMCLabel" + oChartColor.above;
				} else {
					sTopLeftSemanticClass = "sapSuiteLMCLabel" + oChartColor.below;
				}
				if (oLastPoint.getY() >= oControl.getThreshold()) {
					sTopRightSemanticClass = "sapSuiteLMCLabel" + oChartColor.above;
				} else {
					sTopRightSemanticClass = "sapSuiteLMCLabel" + oChartColor.below;
				}
			} else {
				sTopLeftSemanticClass = "sapSuiteLMCLabelNeutral";
				sTopRightSemanticClass = "sapSuiteLMCLabelNeutral";
			}
		}

		oRm.openStart("div");
		oRm.class("sapSuiteLMCLabels");
		oRm.class("sapSuiteLMCLabelsTop");
		oRm.openEnd();

		if ((sLeftTopLabel && sLeftTopLabel.length > 0) || (sRightTopLabel && sRightTopLabel.length > 0)) {
			// left top label
			oRm.openStart("div");
			oRm.class("sapSuiteLMCLeftTopLabel");
			oRm.class("sapSuiteLMCLabel");
			oRm.class(sTopLeftSemanticClass);
			if (sTopLeftColorStyle) {
				fnAddColorStyle(sTopLeftColorStyle);
			}
			oRm.openEnd();
			oRm.text(sLeftTopLabel);
			oRm.close("div");

			// right top label
			oRm.openStart("div");
			oRm.class("sapSuiteLMCRightTopLabel");
			oRm.class("sapSuiteLMCLabel");
			oRm.class(sTopRightSemanticClass);
			if (sTopRightColorStyle) {
				fnAddColorStyle(sTopRightColorStyle);
			}
			oRm.openEnd();
			oRm.text(oControl.getRightTopLabel());
			oRm.close("div");
		}

		oRm.close("div");
	};

	/**
	 * Checks if the given point is an emphasized point.
	 * @param {sap.suite.ui.microchart.LineMicroChartPoint} point The instance of point to be checked
	 * @returns {boolean} True if the given point is emphasized, false if not
	 * @private
	 */
	LineMicroChartRenderer._isPointEmphasized = function(point) {
		return point && point.getMetadata().getName() === "sap.suite.ui.microchart.LineMicroChartEmphasizedPoint";
	};

	/**
	 * Returns the hex color corresponding to the provided color name.
	 *
	 * @private
	 * @param {string} color The name of the color
	 * @returns {string} The corresponding hex color
	 * @deprecated As of version 1.120, the concept has been discarded.
	 */
	LineMicroChartRenderer._getHexColor = function(color) {
		var sColor = Parameters.get({
			name: color,
			callback: function(mParams) {
				sColor = mParams;
			}
		});
		return sColor || color;
	};

	/**
	 * Tests (one dimension only) if the line is outside of the scaled canvas.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.LineMicroChart} oControl The control to be rendered
	 * @param {int} startPos The starting point dimension
	 * @param {int} endPos The ending point dimension
	 * @param {string} axis The axis type of values ('X' or 'Y')
	 * @returns {boolean} True if the line is outside, false otherwise.
	 */
	LineMicroChartRenderer._isDimensionLineOutsideCanvas = function(oControl, startPos, endPos, axis) {
		var iMaxLimit = 100, iMinLimit = 0;
		if (axis === "X" && oControl._minXScale === oControl._maxXScale) { // X axis limits
			iMaxLimit = 50;
			iMinLimit = 50;
		} else if (axis === "Y" && oControl._minYScale === oControl._maxYScale) { // Y axis limits
			iMaxLimit = 50;
			iMinLimit = 50;
		}

		return ((startPos >= iMaxLimit && endPos >= iMaxLimit) && !(startPos === iMaxLimit && endPos === iMaxLimit)) || // iMaxLimit
			((startPos <= iMinLimit && endPos <= iMinLimit) && !(startPos === iMinLimit && endPos === iMinLimit)); // iMinLimit
	};

	MicroChartRenderUtils.extendMicroChartRenderer(LineMicroChartRenderer);

	return LineMicroChartRenderer;

}, /* bExport= */ true);
