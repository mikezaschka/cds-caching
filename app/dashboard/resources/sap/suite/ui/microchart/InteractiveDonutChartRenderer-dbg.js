/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/Theming",
	"sap/m/library",
	"sap/base/Log"
],
	function(Theming, MobileLibrary, Log) {
	"use strict";

	// lazy dependency to avoid cyclic dependency
	var InteractiveDonutChart;

	/**
	 * InteractiveDonutChartRenderer renderer.
	 * @namespace
	 */
	var InteractiveDonutChartRenderer = {
		apiVersion: 2
	};

	InteractiveDonutChartRenderer.TOTAL_RADIUS_ABSOLUTE = 3.625;
	InteractiveDonutChartRenderer.OUTER_RADIUS_ABSOLUTE = 3.25;
	InteractiveDonutChartRenderer.SELECTION_THICKNESS_ABSOLUTE = 0.375;
	InteractiveDonutChartRenderer.HOLE_SIZE_RATIO_COMPACT = 0.48;
	InteractiveDonutChartRenderer.HOLE_SIZE_RATIO_COZY = 0.48; //donut hole: 48% of diameter
	InteractiveDonutChartRenderer.SEGMENT_HALF_GAP_SIZE = 0; // gap width between segments equal to 0px
	InteractiveDonutChartRenderer.SEGMENT_HALF_GAP_SIZE_HCB = 0.5; // gap width between segments equal to 1px for sap_hcb theme only
	InteractiveDonutChartRenderer.GHOST_BORDER_HALF_THICKNESS_HCB = 0.5; // the ghost segment has a border of 1 px for hcb theme

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.InteractiveDonutChart} oControl The control to be rendered
	 * @public
	 */
	InteractiveDonutChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		// resolve lazy dependency
		InteractiveDonutChart = InteractiveDonutChart || sap.ui.require("sap/suite/ui/microchart/InteractiveDonutChart");

		this._aSegments = oControl.getSegments();
		var iSegmentsNum = oControl._iVisibleSegments;

		// in case of sap_hcb or sap_belize_hcb theme, activate the gap size and deactivate the stroke inside css
		this._fSegmentHalfGapSize = this.SEGMENT_HALF_GAP_SIZE;
		this._fGhostHalfGapSize = 0;
		if (this._isThemeHighContrast()) {
			this._fSegmentHalfGapSize = this.SEGMENT_HALF_GAP_SIZE_HCB;
			this._fGhostHalfGapSize = this.GHOST_BORDER_HALF_THICKNESS_HCB;
		}
		if (oControl.getShowError()) {
			oRm.openStart("div", oControl);
			oRm.class("sapSuiteUiMicroChartNoData");
			oRm.openEnd();
			oRm.renderControl(oControl._oIllustratedMessageControl);
			oRm.close("div");
			return;
		}

		oRm.openStart("div", oControl);
		oRm.class("sapSuiteIDC");

		//tooltip for non-interactive chart
		if (!oControl._isChartEnabled()) {
			var sAreaTooltip = oControl.getTooltip_AsString();
			if (typeof sAreaTooltip === "string" || sAreaTooltip instanceof String) {
				oRm.attr("title", sAreaTooltip);
			}
		}
		// container accessibility
		var oAccOptions = {};
		oAccOptions.role = "listbox";
		oAccOptions.roledescription = oControl._oRb.getText("INTERACTIVEDONUTCHART");
		oAccOptions.multiselectable = true;
		oAccOptions.disabled = !oControl._isChartEnabled();
		oAccOptions.labelledby = oControl.getAriaLabelledBy();
		oRm.accessibilityState(oControl, oAccOptions);
		oRm.openEnd();

		//adds an extra overlay for a disabled chart
		if (!oControl.getSelectionEnabled()) {
			this._renderDisabledOverlay(oRm, oControl);
		}

		this._renderDonut(oRm, oControl, iSegmentsNum);
		this._renderLegend(oRm, oControl, iSegmentsNum);

		oRm.close("div");
	};

	/**
	 * Renders the HTML for the donut.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.InteractiveDonutChart} oControl The control to be rendered
	 * @param {int} segmentsNum The amount of segments
	 * @private
	 */
	InteractiveDonutChartRenderer._renderDonut = function(oRm, oControl, segmentsNum) {
		var oSegment, fSum, fStart, sSegmentPath, iTotalRadius, iInnerRadius, iOuterRadius, iHoverThickness,
			bCompact = oControl._bCompact;

		oRm.openStart("div");
		oRm.class("sapSuiteIDCChart");
		oRm.openEnd();
		oRm.openStart("svg");
		oRm.class("sapSuiteIDCChartSVG");
		oRm.attr("viewBox", "-2 -2 104 104");
		oRm.attr("focusable", "false");
		oRm.openEnd();
		oRm.openStart("g");
		// the shift in fractional parts is added to avoid pixel rastering issues that
		// are caused by defining the width of the separating line between segments being equal to 1 px.
		oRm.attr("transform", "translate(50.5 50.5)");
		oRm.openEnd();

		//size calculations to convert absolute units to SVG-units
		iTotalRadius = 50; //radius including hover ghost thickness (in relative SVG-units)
		iOuterRadius = (this.OUTER_RADIUS_ABSOLUTE / this.TOTAL_RADIUS_ABSOLUTE) * iTotalRadius;
		if (bCompact) {
			//compact mode
			iInnerRadius = this.HOLE_SIZE_RATIO_COMPACT * iOuterRadius;
		} else {
			//cozy mode
			iInnerRadius = this.HOLE_SIZE_RATIO_COZY * iOuterRadius;
		}
		iHoverThickness = iTotalRadius * (this.SELECTION_THICKNESS_ABSOLUTE / this.TOTAL_RADIUS_ABSOLUTE);

		//render segments ghosts, i.e. the highlighting paths for selection
		fSum = this._calculateSum(oControl);
		fStart = 0.0;
		var i;
		for (i = 0; i < segmentsNum; i++) {
			oSegment = this._aSegments[i];
			if (oSegment.getValue() > 0) {
				sSegmentPath = this._calculateSegmentPath(fSum, oSegment.getValue(), fStart, iOuterRadius + iHoverThickness, iInnerRadius - iHoverThickness, this._fGhostHalfGapSize);

				oRm.openStart("path");
				oRm.attr("d", sSegmentPath);
				oRm.attr("data-sap-ui-idc-selection-index", i);
				oRm.class(InteractiveDonutChart.CHART_SEGMENT_GHOST.CSSCLASS);
				if (oSegment.getSelected()) {
					oRm.class(InteractiveDonutChart.CHART_SEGMENT_GHOST.CSSCLASS_SELECTED);
				}
				oRm.openEnd();
				// write tooltip for ghost segment
				if (oControl._isChartEnabled()) {
					this._renderTitle(oSegment.getTooltip_AsString(), oRm);
				}
				oRm.close("path");

				fStart += this._aSegments[i].getValue();
			}
		}

		//render donut segments
		fStart = 0.0;
		for (i = 0; i < segmentsNum; i++) {
			oSegment = this._aSegments[i];
			if (oSegment.getValue() > 0) {
				sSegmentPath = this._calculateSegmentPath(fSum, oSegment.getValue(), fStart, iOuterRadius, iInnerRadius, 0);

				oRm.openStart("path");
				oRm.attr("d", sSegmentPath);
				oRm.attr("fill", this._getSegmentColor(i, segmentsNum, oControl));
				oRm.attr("cursor", "pointer");
				oRm.attr("data-sap-ui-idc-selection-index", i);
				oRm.class(InteractiveDonutChart.CHART_SEGMENT.CSSCLASS);
				if (oSegment.getSelected()) {
					oRm.class(InteractiveDonutChart.CHART_SEGMENT.CSSCLASS_SELECTED);
				}
				oRm.openEnd();
				// write tooltip for donut segment
				if (oControl._isChartEnabled()) {
					this._renderTitle(oSegment.getTooltip_AsString(), oRm);
				}
				oRm.close("path");

				fStart += this._aSegments[i].getValue();
			}
		}
		oRm.close("g");
		oRm.close("svg");
		oRm.close("div");
	};

	/**
	 * Renders the HTML for the legend.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.InteractiveDonutChart} oControl The control to be rendered
	 * @param {int} segmentsNum The amount of segments
	 * @private
	 */
	InteractiveDonutChartRenderer._renderLegend = function(oRm, oControl, segmentsNum) {
		oRm.openStart("div");
		oRm.class("sapSuiteIDCLegend");
		oRm.openEnd();

		for (var i = 0; i < segmentsNum; i++) {
			this._renderLegendSegment(oRm, oControl, i, segmentsNum);
		}

		oRm.close("div");
	};

	/**
	 * Renders the legend area for the given control.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.InteractiveDonutChart} oControl The control to be rendered
	 * @param {int} index The index inside segments aggregation
	 * @param {int} segmentsNum The amount of segments
	 * @private
	 */
	InteractiveDonutChartRenderer._renderLegendSegment = function(oRm, oControl, index, segmentsNum) {
		var oSegment = this._aSegments[index],
			sLabel = oSegment.getLabel(),
			sDisplayedValue = oSegment.getDisplayedValue() || String(oSegment.getValue()),
			sTooltip,
			sColor = oSegment._getSemanticColor();

		// 'N/A' is displayed if value does not exist (regardless of whether the displayedValue exists or not)
		if (oSegment._bNullValue) {
			sDisplayedValue = oControl._oRb.getText("INTERACTIVECHART_NA");
		}
		sDisplayedValue = sDisplayedValue.substring(0, InteractiveDonutChart.CHART_SEGMENT_LABEL_MAXLENGTH);

		// segment accessibility
		var sTooltip = oSegment.getTooltip_Text();
		var sAriaLabel;
		if (sTooltip && sTooltip.trim()) {
			sAriaLabel = sTooltip;
		} else {
			sAriaLabel = sLabel;
			if (sAriaLabel) {
				sAriaLabel = sAriaLabel + " " + sDisplayedValue;
			} else {
				sAriaLabel = sDisplayedValue;
			}
			if (sColor) {
				sAriaLabel += " " + sColor;
			}
		}
		var oAccOptions = {};
		oAccOptions.role = "option";
		oAccOptions.label = sAriaLabel.trim();
		oAccOptions.selected = oSegment.getSelected();
		oAccOptions.posinset = index + 1;
		oAccOptions.setsize = segmentsNum;

		oRm.openStart("div", oControl.getId() + "-interactionArea-" + index);
		oRm.accessibilityState(oSegment, oAccOptions);
		oRm.attr("data-sap-ui-idc-selection-index", index);
		oRm.class("sapSuiteIDCLegendSegment");
		if (oSegment.getSelected()) {
			oRm.class(InteractiveDonutChart.SEGMENT_CSSCLASS_SELECTED);
		}
		// the first segment has tabindex 0
		if (index === 0 && oControl.getSelectionEnabled()) {
			oRm.attr("tabindex", "0");
		}
		// tooltip for legend segment
		// if (oControl._isChartEnabled()) {
		// 	sTooltip = oSegment.getTooltip_AsString();
		// 	if (typeof sTooltip === "string" || sTooltip instanceof String) {
		// 		oRm.writeAttributeEscaped("title", sTooltip);
		// 	}
		// }
		oRm.openEnd();

		sColor = oSegment.getColor();
		if (sColor !== MobileLibrary.ValueColor.Neutral) {
			oRm.openStart("div");
			oRm.class("sapSuiteIDCSemanticMarker");
			oRm.class("sapSuiteICSemanticColor" + sColor);
			oRm.openEnd();
			oRm.close("div");
		}

		//writes the square marker
		oRm.openStart("div");
		oRm.class("sapSuiteIDCLegendMarker");
		oRm.style("background-color", this._getSegmentColor(index, segmentsNum, oControl));
		oRm.openEnd();
		oRm.close("div");
		oRm.openStart("div");
		oRm.class("sapSuiteIDCLegendLabelValue");
		oRm.openEnd();
		oRm.openStart("div");
		oRm.class("sapSuiteIDCLegendLabel");
		oRm.openEnd();
		oRm.text(sLabel);
		oRm.close("div");
		oRm.openStart("div");
		oRm.class("sapSuiteIDCLegendValue");
		oRm.openEnd();
		oRm.text(sDisplayedValue);
		oRm.close("div");
		oRm.close("div");
		oRm.close("div");
	};

	/**
	 * Returns the color value of the less parameter for the segment at the given position
	 * of the color palette.
	 *
	 * @param {int} position The position in the color palette array
	 * @param {int} segmentsNum The amount of segments
	 * @param {object} oControl The current control
	 * @returns {string} The color of the segment
	 * @private
	 */
	InteractiveDonutChartRenderer._getSegmentColor = function(position, segmentsNum, oControl) {
		var fWeight = 1 - (segmentsNum - position) / segmentsNum,
			sColor = oControl.DEFAULT_SEGMENT_COLOR || "white"; //fallback to white

		if (this._isThemeHighContrast()) {
			return sColor;
		}

		return this._mixColors(sColor, "#ffffff", fWeight);
	};

	/**
	 * Creates the object needed for SVG containing the necessary values.
	 * Based on scalable units from 0 to 100 the attributes of the SVG are computed. We assume to
	 * have an outer radius of 50 and an inner radius of 30, which corresponds to 60% of diameter for
	 * the donut hole.
	 *
	 * @param {float} sum The sum for the complete circle
	 * @param {float} segmentValue The proportional value
	 * @param {float} start The start point inside the circle
	 * @param {float} outerRadius The radius of the outer circle (whole size)
	 * @param {float} innerRadius The radius of the inner circle (hole size)
	 * @param {float} borderWidth The width of the border applied for the element
	 * @returns {string} The segment path in the form of a string
	 * @private
	 */
	InteractiveDonutChartRenderer._calculateSegmentPath = function(sum, segmentValue, start, outerRadius, innerRadius, borderWidth) {
		var iMinimumValue = 0.01,
			sSVGData,
			oLinePointA,
			oLinePointB,
			oLinePointC,
			oLinePointD,
			fStartAngle,
			fEndAngle,
			fSegmentAngle,
			bLargeAngle,
			fSegmentWithBorderHalfGapSize = this._fSegmentHalfGapSize + borderWidth,
			fGapSizeSqr = Math.pow(2 * fSegmentWithBorderHalfGapSize, 2),
			fGapRadiusInner,
			fGapRadiusOuter,
			fGapAngleInner,
			fGapAngleOuter;

		outerRadius = this._formatFloat(outerRadius); //format float to only contain 2 digits
		innerRadius = this._formatFloat(innerRadius); //format float to only contain 2 digits

		fStartAngle = this._calculateCircleFraction(sum, start);
		fEndAngle = this._calculateCircleFraction(sum, start + segmentValue);
		fSegmentAngle = this._calculateCircleFraction(sum, segmentValue);
		/* bLargeAngle: If the segment angle is <= PI, SVG has to render a small arc (bLargeAngle = 0)
		 * and if the segment angle is > PI, it has to render a large arc (bLargeAngle = 1) */
		if (fSegmentAngle <= Math.PI) {
			bLargeAngle = 0;
		} else {
			bLargeAngle = 1;
		}

		//calculations for 1 unit gap between segments
		if (sum === segmentValue) { //only one segment is to be displayed
			fGapRadiusInner = innerRadius;
			fGapRadiusOuter = outerRadius;
			fGapAngleInner = 0;
			fGapAngleOuter = 0;
		} else {
			fGapRadiusInner = Math.sqrt(Math.pow(innerRadius, 2) + fGapSizeSqr);
			fGapRadiusOuter = Math.sqrt(Math.pow(outerRadius, 2) + fGapSizeSqr);
			fGapAngleInner = Math.atan(fSegmentWithBorderHalfGapSize / innerRadius);
			fGapAngleOuter = Math.atan(fSegmentWithBorderHalfGapSize / outerRadius);
		}

		oLinePointA = {
			"x" : this._formatFloat(fGapRadiusInner * Math.sin(fStartAngle + fGapAngleInner)),
			"y" : this._formatFloat(-fGapRadiusInner * Math.cos(fStartAngle + fGapAngleInner))
		};
		oLinePointB = {
			"x" : this._formatFloat(fGapRadiusOuter * Math.sin(fStartAngle + fGapAngleOuter)),
			"y" : this._formatFloat(-fGapRadiusOuter * Math.cos(fStartAngle + fGapAngleOuter))
		};
		// subtract the minimum coordinate value (0.01) from x values of point C & D to avoid having start and end at the same point
		oLinePointC = {
			"x" : this._formatFloat(outerRadius * Math.sin(fEndAngle - fGapAngleOuter) - iMinimumValue),
			"y" : this._formatFloat(-outerRadius * Math.cos(fEndAngle - fGapAngleOuter))
		};
		oLinePointD = {
			"x" : this._formatFloat(innerRadius * Math.sin(fEndAngle - fGapAngleInner) - iMinimumValue),
			"y" : this._formatFloat(-innerRadius * Math.cos(fEndAngle - fGapAngleInner))
		};

		sSVGData = "";
		// Draw a line from A (inner circle start) to B (outer circle start)
		sSVGData += "M" + oLinePointA.x + " " + oLinePointA.y + " ";
		sSVGData += "L" + oLinePointB.x + " " + oLinePointB.y + " ";
		// Draw an arc from B (outer circle start) to C (outer circle end), clockwise
		sSVGData += "A" + outerRadius + "," + outerRadius + " 0 " + bLargeAngle + ",1" +
			" " + oLinePointC.x + "," + oLinePointC.y + " ";
		// Draw a line from C (outer circle end) to D (inner circle end)
		sSVGData += "L" + oLinePointD.x + " " + oLinePointD.y + " ";
		// Draw the arc back from D (inner circle end) to A (inner circle start), counterclockwise
		sSVGData += "A" + innerRadius + "," + innerRadius + " 0 " + bLargeAngle + ",0" +
			" " + oLinePointA.x + "," + oLinePointA.y;

		return sSVGData;
	};

	/**
	 * First formats the given value to two places after the decimal point, then parses the result to float.
	 *
	 * @param {float} value The value which is formatted and parsed
	 * @returns {float} The result as float value
	 * @private
	 */
	InteractiveDonutChartRenderer._formatFloat = function(value) {
		return parseFloat(value.toFixed(2));
	};

	/**
	 * Calculates the sum of the values of the first displayed segments.
	 *
	 * @param {sap.suite.ui.microchart.InteractiveDonutChart} oControl The control to be rendered
	 * @returns {float} The sum of the values of the first displayed segments
	 * @private
	 */
	InteractiveDonutChartRenderer._calculateSum = function(oControl) {
		var fSum = 0;
		var iDisplayedSegments = oControl.getDisplayedSegments();

		for (var i = 0; i < this._aSegments.length && i < iDisplayedSegments; i++) {
			var fValue = this._aSegments[i].getValue();
			if (fValue > 0) {
				fSum += fValue;
			}
		}

		return fSum;
	};

	/**
	 * Calculates the fraction of the current segment.
	 *
	 * @param {float} sum The sum of all segment values
	 * @param {float} segmentValue The value of the current segment
	 * @returns {float} The fraction based on segmentValue
	 * @private
	 */
	InteractiveDonutChartRenderer._calculateCircleFraction = function(sum, segmentValue) {
		return (2 * Math.PI * segmentValue) / sum;
	};

	/**
	 * Adds an extra disabling overlay
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager It can be used for writing to the Render-Output-Buffer
	 * @private
	 */
	InteractiveDonutChartRenderer._renderDisabledOverlay = function(oRm) {
		oRm.openStart("div");
		oRm.class("sapSuiteIDCDisabledOverlay");
		oRm.openEnd();
		oRm.close("div");
	};

	/**
	 * Creates the value of the aria-describedby accessibility attribute
	 *
	 * @param {sap.suite.ui.microchart.InteractiveDonutChart} oControl The control to be rendered
	 * @param {int} segmentsNum The amount of segments
	 * @returns {string} A comma-separated list of all InteractionArea's IDs
	 * @private
	 */
	InteractiveDonutChartRenderer._getAriaDescribedBy = function(oControl, segmentsNum) {
		var aAreaIds = [];
		for (var i = 0; i < segmentsNum; i++) {
			aAreaIds.push(oControl.getId() + "-interactionArea-" + i);
		}
		return aAreaIds.join(",");
	};

	/**
	 * Mixes two hex colors with the given weight
	 * This function is equivalent to the LESS function "mix"
	 *
	 * @param {string} color1 The first color to mix
	 * @param {string} color2 The second color to mix
	 * @param {float} weight The mixing weight applied to color1
	 * @returns {string} The hex representation of the mixed colors
	 * @private
	 */
	InteractiveDonutChartRenderer._mixColors = function(color1, color2, weight) {
		if (weight === 1 || color1.toLowerCase() === color2.toLowerCase()) {
			return color1;
		}

		var aColor1 = this._hexToRgb(color1);
		var aColor2 = this._hexToRgb(color2);
		var sColorMixR = Math.round((aColor1[0] + (Math.abs(aColor1[0] - aColor2[0]) * weight)) % 255);
		var sColorMixG = Math.round((aColor1[1] + (Math.abs(aColor1[1] - aColor2[1]) * weight)) % 255);
		var sColorMixB = Math.round((aColor1[2] + (Math.abs(aColor1[2] - aColor2[2]) * weight)) % 255);

		return "#" + this._intToHex(sColorMixR) + this._intToHex(sColorMixG) + this._intToHex(sColorMixB);
	};

	/**
	 * Checks whether the current theme is a high contrast theme like sap_belize_hcb or sap_belize_hcw.
	 * @returns {boolean} True if the theme name contains hcb or hcw, false otherwise
	 * @private
	 */
	InteractiveDonutChartRenderer._isThemeHighContrast = function() {
		return /(hcw|hcb)/g.test(Theming.getTheme());
	};

	/**
	 * Converts hexadecimal color string to array containing RGB values
	 *
	 * @param {string} hexColor The hexadecimal representation of a color
	 * @returns {array} The RGB representation of the color
	 * @private
	 */
	InteractiveDonutChartRenderer._hexToRgb = function(hexColor) {
		var aColor = [];
		hexColor = hexColor.replace(/[^0-9a-f]+/ig, '');
		if (hexColor.length === 3) {
			aColor = hexColor.split('');
		} else if (hexColor.length === 6) {
			aColor = hexColor.match(/(\w{2})/g);
		} else {
			Log.warning("Invalid color input: hex string must be in the format #FFFFFF or #FFF");
		}
		return aColor.map(function(x) { return parseInt(x, 16); });
	};

	/**
	 * Converts decimal integers into hexadecimal string
	 *
	 * @param {int} value The decimal number
	 * @returns {string} The hexadecimal representation of the input value
	 * @private
	 */
	InteractiveDonutChartRenderer._intToHex = function(value) {
		var sHex = value.toString(16);
		if (sHex.length === 1) {
			sHex = '0' + sHex;
		}
		return sHex;
	};

	/**
	 * Renders the title attribute for the tooltip as part of the SVG DOM elements
	 *
	 * @param {string} tooltip The tooltip of the instance to render
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @private
	 */
	InteractiveDonutChartRenderer._renderTitle = function(tooltip, oRm) {
		if (typeof tooltip === "string" || tooltip instanceof String) {
			oRm.openStart("title");
			oRm.style("visibility", "hidden");
			oRm.openEnd();
			oRm.text(tooltip);
			oRm.close("title");
		}
	};

	return InteractiveDonutChartRenderer;

}, /* bExport= */ true);
