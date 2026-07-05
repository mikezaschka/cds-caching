/*!
* SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
*/

sap.ui.define([
	"sap/m/library",
	"./library",
	"sap/base/security/encodeXML",
	"sap/suite/ui/microchart/MicroChartRenderUtils",
	"sap/ui/core/theming/Parameters"
], function (MobileLibrary, library, encodeXML, MicroChartRenderUtils, Parameters) {
	"use strict";

	/** @deprecated since 1.135 */
	var ValueCSSColor = MobileLibrary.ValueCSSColor;

	const MicroChartColorType = library.MicroChartColorType;

	// lazy dependency to avoid cyclic dependency
	var HarveyBallMicroChart;

	/**
	 * HarveyBallMicroChartRenderer renderer.
	 * @namespace
	 */
	var HarveyBallMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	HarveyBallMicroChartRenderer._iReferenceControlSize = 72;
	HarveyBallMicroChartRenderer._iReferenceControlCenter = HarveyBallMicroChartRenderer._iReferenceControlSize / 2;

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render - Output - Buffer
	 * @param {sap.suite.ui.microchart.HarveyBallMicroChart} oControl the control to be rendered
	 */
	HarveyBallMicroChartRenderer.render = function (oRm, oControl) {
		HarveyBallMicroChart = HarveyBallMicroChart || sap.ui.require("sap/suite/ui/microchart/HarveyBallMicroChart");

		if (!oControl._hasData()) {
			this._renderNoData(oRm, oControl);
			return;
		}

		if (!oControl._bThemeApplied) {
			return;
		}
		this._calculatePath(oControl);
		var aColorPalette = oControl.getColorPalette();
		var sTotalScale = "";
		var sValueLabel = "";
		var sValueScale = "";
		var bFmtLabel = false;
		var fValue = 0;
		var sColorClass = "";

		var fnGetColor = function (sColor) {
			if (MicroChartColorType.hasOwnProperty(sColor)) {
				sColorClass = "sapSuiteHBMCSemanticColor" + encodeXML(sColor);
			} else {
				/**
				* @deprecated As of version 1.135
				*/
				return ValueCSSColor.isValid(sColor) && Parameters.get(sColor) || sColor;
			}
			return null;
		};

		var sColor = aColorPalette.length > 0 ? fnGetColor(aColorPalette[0]) : null;
		var iCircleRadius = this._oPath.center - 1;

		// currently only value from first item is supported
		if (oControl.getItems().length) {
			var oPieItem = oControl.getItems()[0];
			fValue = oPieItem.getFraction();
			sValueLabel = oPieItem.getFractionLabel() ? oPieItem.getFractionLabel() : sValueLabel + oPieItem.getFraction();
			sValueScale = oPieItem.getFractionScale() ? oPieItem.getFractionScale().substring(0, 3) : sValueScale;
			bFmtLabel = oPieItem.getFormattedLabel();

			if (!sColor && !sColorClass) {
				// If colorPalette isn't set use color form Item
				sColor = fnGetColor(oPieItem.getColor());
			}
		}

		if (bFmtLabel) {
			var oFormattedValue = oControl._parseFormattedValue(sValueLabel);

			sValueScale = oFormattedValue.scale.substring(0, 3);
			sValueLabel = oFormattedValue.value;
		}

		var fTotal = oControl.getTotal();
		var sTotalLabel = oControl.getTotalLabel() ? oControl.getTotalLabel() : "" + oControl.getTotal();
		if (oControl.getTotalScale()) {
			sTotalScale = oControl.getTotalScale().substring(0, 3);
		}

		if (oControl.getFormattedLabel()) {
			var oFormattedTotal = oControl._parseFormattedValue(sTotalLabel);
			sTotalScale = oFormattedTotal.scale.substring(0, 3);
			sTotalLabel = oFormattedTotal.value;
		}

		if (sValueLabel) {
			sValueLabel = HarveyBallMicroChart._truncateValue(sValueLabel, HarveyBallMicroChart.VALUE_TRUNCATION_DIGITS);
		}
		if (sTotalLabel) {
			sTotalLabel = HarveyBallMicroChart._truncateValue(sTotalLabel, HarveyBallMicroChart.VALUE_TRUNCATION_DIGITS);
		}

		oRm.openStart("div", oControl);
		this._writeMainProperties(oRm, oControl);

		oRm.openEnd();

		oRm.openStart("div");
		oRm.class("sapSuiteHBMCAlign" + oControl.getAlignContent());
		oRm.class("sapSuiteHBMCVerticalAlignmentContainer");
		oRm.openEnd();

		oRm.openStart("div");
		oRm.class("sapSuiteHBMCChart");
		oRm.openEnd();

		oRm.openStart("svg", oControl.getId() + "-harvey-ball");
		oRm.class("sapSuiteHBMCChartSvg");
		oRm.attr("viewBox", "0 0 72 72");
		oRm.attr("focusable", false);
		oRm.openEnd();
		oRm.openStart("g").openEnd();
		oRm.openStart("circle");
		oRm.attr("cx", this._oPath.center);
		oRm.attr("cy", this._oPath.center);
		oRm.attr("r", iCircleRadius);
		oRm.class("sapSuiteHBMCBackgroundCircle");
		oRm.openEnd();
		oRm.close("circle");

		if (fValue && fValue >= fTotal) {
			oRm.openStart("circle");
			oRm.attr("cx", this._oPath.center);
			oRm.attr("cy", this._oPath.center);
			oRm.attr("r", iCircleRadius - this._oPath.border);
			oRm.class("sapSuiteHBMCSegment");
			if (sColor) {
				oRm.style("fill", sColor);
			} else {
				oRm.class(sColorClass);
			}
			oRm.openEnd();
			oRm.close("circle");
		} else if (fValue > 0) {
			oRm.openStart("path",oControl.getId() + "-segment");
			oRm.class("sapSuiteHBMCSegment");
			if (sColor) {
				oRm.style("fill", sColor);
			} else {
				oRm.class(sColorClass);
			}
			oRm.attr("d", this._serializePieChart());
			oRm.openEnd();
			oRm.close("path");
		}
		oRm.close("g");
		oRm.close("svg");
		oRm.close("div");

		// Text container
		oRm.openStart("div");
		oRm.class("sapSuiteHBMCTextContainer");
		oRm.openEnd();

		if (oControl.getShowFractions()) {
			oRm.openStart("div");
			oRm.class("sapSuiteHBMCValueContainer");
			oRm.openEnd();
			this.renderLabel(oRm, oControl, [
				sColorClass,
				"sapSuiteHBMCValue"
			], sValueLabel, sColor, "-fraction");
			this.renderLabel(oRm, oControl, [
				sColorClass,
				"sapSuiteHBMCValueScale"
			], sValueScale, sColor, "-fraction-scale");
			oRm.close("div");
		}

		if (oControl.getShowTotal()) {
			oRm.openStart("div");
			oRm.class("sapSuiteHBMCTotalContainer");
			oRm.openEnd();
			this.renderLabel(oRm, oControl, [
				sColorClass,
				"sapSuiteHBMCTotal"
			], sTotalLabel, sColor, "-total");
			this.renderLabel(oRm, oControl, [
				sColorClass,
				"sapSuiteHBMCTotalScale"
			], sTotalScale, sColor, "-total-scale");
			oRm.close("div");
		}
		oRm.close("div");
		oRm.close("div");
		oRm.close("div");

	};

	/**
	 * Renders control data and prepares default classes and styles
	 *
	 * @param {object} oRm render manager
	 * @param {object} oControl AreaMicroChart control
	 * @private
	 */
	HarveyBallMicroChartRenderer._writeMainProperties = function (oRm, oControl) {
		var bIsActive = oControl.hasListeners("press");

		this._renderActiveProperties(oRm, oControl);

		var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
		oRm.attr("role", "figure");

		if (oControl.getAriaLabelledBy().length) {
			oRm.accessibilityState(oControl);
		} else {
			oRm.attr("aria-label", sAriaLabel);
		}

		oRm.class("sapSuiteHBMC");
		oRm.class("sapSuiteHBMCSize" + oControl.getSize());
		oRm.style("width", oControl.getWidth());
		oRm.style("height", oControl.getHeight());
	};

	HarveyBallMicroChartRenderer.renderLabel = function (oRm, oControl, aClasses, sLabel, sColor, sId) {
		var bUseColorPalette = !(aClasses.indexOf("sapSuiteHBMCTotal") > -1 || aClasses.indexOf("sapSuiteHBMCTotalScale") > -1);
		oRm.openStart("span",oControl.getId() + sId);
		for (var i = 0; i < aClasses.length; i++) {
			// uses palette color only for fraction label and scale
			if (!(i === 0 && sColor && bUseColorPalette)) {
				oRm.class(aClasses[i]);
			}
		}

		oRm.openEnd();
		if (sLabel) {
			oRm.text(sLabel);
		}
		oRm.close("span");
	};

	HarveyBallMicroChartRenderer._calculatePath = function (oControl) {
		var fTot = oControl.getTotal();
		var fFrac = 0;
		if (oControl.getItems().length) {
			fFrac = oControl.getItems()[0].getFraction();
		}

		var iCenter = HarveyBallMicroChartRenderer._iReferenceControlCenter;
		var iBorder = 5;
		this._oPath = {
			initial: {
				x: iCenter,
				y: iCenter
			},
			lineTo: {
				x: iCenter,
				y: iBorder
			},
			arc: {
				x1: iCenter - iBorder,
				y1: iCenter - iBorder,
				largeArc: 0,
				x2: "",
				y2: ""
			},
			size: HarveyBallMicroChartRenderer._iReferenceControlSize,
			border: iBorder,
			center: iCenter
		};

		var fAngle = fFrac / fTot * 360;
		var fRad = Math.PI / 180.0;
		var fRadius = this._oPath.center - this._oPath.border;
		var ix = fRadius * Math.cos((fAngle - 90) * fRad) + this._oPath.center;
		var iy = this._oPath.size - (fRadius * Math.sin((fAngle + 90) * fRad) + this._oPath.center);
		this._oPath.arc.x2 = ix.toFixed(2);
		this._oPath.arc.y2 = iy.toFixed(2);
		var iLargeArc = fTot / fFrac < 2 ? 1 : 0;

		this._oPath.arc.largeArc = iLargeArc;
	};

	HarveyBallMicroChartRenderer._serializePieChart = function () {
		var p = this._oPath;
		return [
			"M", p.initial.x, ",", p.initial.y,
			" L", p.initial.x, ",", p.lineTo.y,
			" A", p.arc.x1, ",", p.arc.y1, " 0 ", p.arc.largeArc, ",1 ", p.arc.x2, ",", p.arc.y2,
			" L", p.initial.x, ",", p.initial.y,
			" z"
		].join("");
	};

	MicroChartRenderUtils.extendMicroChartRenderer(HarveyBallMicroChartRenderer);

	return HarveyBallMicroChartRenderer;

}, /* bExport */ true);
