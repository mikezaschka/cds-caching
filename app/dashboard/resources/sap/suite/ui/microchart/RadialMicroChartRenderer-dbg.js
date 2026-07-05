/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/Device",
	"sap/m/library",
	'./library',
	"sap/base/Log",
	"sap/suite/ui/microchart/MicroChartRenderUtils",
	"sap/ui/core/theming/Parameters"
],
	function(Device, mobileLibrary, library, Log, MicroChartRenderUtils, Parameters) {
	"use strict";

	var MicroChartColorType = library.MicroChartColorType;
	/**
	* RadialMicroChartRenderer renderer.
	* @namespace
	* @since 1.36.0
	*/
	var RadialMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	//Constants
	RadialMicroChartRenderer.FORM_RATIO = 100; //Form ratio for the control, means the calculation base
	RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH = 1;
	RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS = (RadialMicroChartRenderer.FORM_RATIO / 2.0) - (RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH / 2.0);
	RadialMicroChartRenderer.RING_WIDTH = 8.75; //Calculated by: RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS * 0.175<WHEEL_WIDTH_FACTOR
	RadialMicroChartRenderer.RING_CORE_RADIUS = RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS - (RadialMicroChartRenderer.RING_WIDTH / 2.0) - RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH;
	RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR = "50%";
	RadialMicroChartRenderer.X_ROTATION = 0;
	RadialMicroChartRenderer.SWEEP_FLAG = 1;
	RadialMicroChartRenderer.PADDING_WIDTH = 0.22;//Should be 1 px
	RadialMicroChartRenderer.NUMBER_FONT_SIZE = 23.5; //Calculated by: RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS * 0.47<NUMBER_FONT_SIZE_FACTOR>
	RadialMicroChartRenderer.EDGE_CASE_SIZE_USE_SMALL_FONT = 54; // this value corresponds to 14 px for text font size
	RadialMicroChartRenderer.EDGE_CASE_SIZE_SHOW_TEXT = 46;
	RadialMicroChartRenderer.EDGE_CASE_SIZE_MICRO_CHART = 24;

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render - Output - Buffer
	 * @param {sap.suite.ui.microchart.RadialMicroChart} oControl the control to be rendered
	 */
	RadialMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		if (oControl._hasData()) {
			// Write the HTML into the render manager
			this._writeDivStartElement(oControl, oRm);
			this._writeOuterContainerElement(oControl,oRm);
			oRm.close("div");
		} else {
			this._renderNoData(oRm, oControl);
		}
	};

	/**
	 * Renders the HTML for the outer container
	 *
	 * @param {object} oControl RadialMicroChart control
	 * @param {object} oRm render manager
	 * @private
	 */
	RadialMicroChartRenderer._writeOuterContainerElement = function(oControl,oRm) {
		this._writeDivVerticalContainerElement(oControl, oRm);
		this._writeDivInnerContainerElement(oControl, oRm);
		if (this._renderingOfInnerContentIsRequired(oControl)) {
			this._writeLabelInside(oControl, oRm);
		}
		this._writeSVGStartElement(oControl, oRm);
		this._writeBackground(oRm);
		if (this._renderingOfInnerContentIsRequired(oControl)) {
			this._writeBorders(oRm);
			if (this._innerCircleRequired(oControl)) {
				this._writeCircle(oControl, oRm);
			} else {
				this._writeCircleWithPathElements(oControl, oRm);
			}
		}
		oRm.close("svg");
		oRm.close("div"); //closes inner container
		if (this._renderingOfInnerContentIsRequired(oControl)) {
			this._writeLabelOutside(oControl, oRm);
		}
		oRm.close("div"); //closes vertical container
	};


	/**
	 * Renders control data and prepares default classes and styles
	 *
	 * @param {object} oRm render manager
	 * @param {object} oControl RadialMicroChart control
	 * @private
	 */
	RadialMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
		var bIsActive = oControl.hasListeners("press");

		this._renderActiveProperties(oRm, oControl);

		var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
		oRm.attr("role", "figure");

		if (oControl.getAriaLabelledBy().length) {
			oRm.accessibilityState(oControl);
		} else {
			oRm.attr("aria-label", sAriaLabel);
		}

		oRm.class("sapSuiteRMC");
		oRm.class("sapSuiteRMCSize" + oControl.getSize());

		oRm.style("width", oControl.getWidth());
		oRm.style("height", oControl.getHeight());
	};

	/* Rendering Write-Helpers */

	/**
	 * Writes the start tag for the surrounding div-element incl. ARIA text and required classes
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} oControl the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeDivStartElement = function(oControl, oRm) {
		oRm.openStart("div", oControl);
		this._writeMainProperties(oRm, oControl);

		oRm.openEnd();
	};

	/**
	 * Writes the vertical alignment container tag and required classes
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} oControl the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeDivVerticalContainerElement = function(oControl, oRm) {
		oRm.openStart("div");
		oRm.class("sapSuiteRMCVerticalAlignmentContainer");
		oRm.class("sapSuiteRMCAlign" + oControl.getAlignContent());
		oRm.openEnd();
	};

	/**
	 * Writes the inner container tag and required classes
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} oControl the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeDivInnerContainerElement = function(oControl, oRm) {
		oRm.openStart("div");
		oRm.class("sapSuiteRMCInnerContainer");
		oRm.openEnd();
	};

	/**
	 * Writes the start tag for the SVG element.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeSVGStartElement = function(control, oRm) {
		oRm.openStart("svg");
		oRm.class("sapSuiteRMCSvg");
		oRm.attr("focusable", false);
		oRm.attr("viewBox", "0 0 " + RadialMicroChartRenderer.FORM_RATIO + " " + RadialMicroChartRenderer.FORM_RATIO);
		oRm.attr("version", "1.1");
		oRm.attr("xmlns", "http://www.w3.org/2000/svg");
		oRm.openEnd();
	};

	/**
	 * Writes the background circle.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeBackground = function(oRm) {
		oRm.openStart("circle");
		oRm.class("sapSuiteRMCCircleBackground");
		oRm.attr("cx", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("cy", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("r", RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS);
		oRm.attr("stroke-width", this.BACKGROUND_CIRCLE_BORDER_WIDTH);
		oRm.openEnd().close("circle");
	};

	/**
	 * Writes the Borders, required for High Contrast themes.
	 * In case of other themes, they are also available to avoid issues while switching themes.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeBorders = function(oRm) {
		var fRadius1 = RadialMicroChartRenderer.RING_CORE_RADIUS + (RadialMicroChartRenderer.RING_WIDTH / 2.0) - (RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH / 2.0),
			fRadius2 = RadialMicroChartRenderer.RING_CORE_RADIUS - (RadialMicroChartRenderer.RING_WIDTH / 2.0) + (RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH / 2.0);

		oRm.openStart("circle");
		oRm.class("sapSuiteRMCRing");
		oRm.attr("cx", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("cy", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("r", fRadius1);
		oRm.attr("stroke-width", RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH);
		oRm.openEnd().close("circle");

		oRm.openStart("circle");
		oRm.class("sapSuiteRMCRing");
		oRm.attr("cx", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("cy", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("r", fRadius2);
		oRm.attr("stroke-width", RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH);
		oRm.openEnd().close("circle");
	};

	/**
	 * Writes the circle element, required for 0% and 100% cases.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeCircle = function(control, oRm) {
		var sColor = this._getFullCircleColor(control);
		oRm.openStart("circle");
		if (control._isValueColorValid() || sColor === "sapSuiteRMCRemainingCircle") {
			oRm.class(sColor);
		} else {
			/**
				* @deprecated As of version 1.120
			*/
			oRm.attr("stroke", Parameters.get(sColor) || sColor);
		}
		oRm.attr("cx", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("cy", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.attr("r", RadialMicroChartRenderer.RING_CORE_RADIUS);
		oRm.attr("fill", "transparent");
		oRm.attr("stroke-width", "7px");
		oRm.openEnd().close("circle");
	};

	/**
	 * Writes the two path elements, required for all cases between 1% and 99%.
	 * Keeps a padding of 1px between the paths.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeCircleWithPathElements = function(control, oRm) {
		var iLargeArcFlag = control.getPercentage() > 50 ? 1 : 0;
		//decrease/increase the percentage to have a padding between paths
		var fPercentage = this._getPercentageForCircleRendering(control) - RadialMicroChartRenderer.PADDING_WIDTH;
		var aPathCoordinates = this._calculatePathCoordinates(control, fPercentage, false);
		this._writePath1(iLargeArcFlag, aPathCoordinates, control, oRm);
		fPercentage = this._getPercentageForCircleRendering(control) + RadialMicroChartRenderer.PADDING_WIDTH;
		aPathCoordinates = this._calculatePathCoordinates(control, fPercentage, true);
		this._writePath2(iLargeArcFlag, aPathCoordinates, control, oRm);
	};

	/**
	 * Writes the first path element for cases between 1% and 99%.
	 *
	 * @private
	 * @param {int} largeArcFlag for check of smaller or bigger than 180 degrees
	 * @param {float[]} pathCoordinates array containing specific coordinates for the path
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writePath1 = function(largeArcFlag, pathCoordinates, control, oRm) {
		var sPathData1 = "M" + pathCoordinates[0] + " " + pathCoordinates[1] + " A " + RadialMicroChartRenderer.RING_CORE_RADIUS + " " + RadialMicroChartRenderer.RING_CORE_RADIUS +
		", " + RadialMicroChartRenderer.X_ROTATION + ", " + largeArcFlag + ", " + RadialMicroChartRenderer.SWEEP_FLAG + ", " + pathCoordinates[2] + " " + pathCoordinates[3];

		var sColor = this._getPathColor(control);
		oRm.openStart("path");
		oRm.class("sapSuiteRMCPath");
		if (control._isValueColorValid() || sColor === "sapSuiteRMCRemainingCircle") {
			oRm.class(sColor);
		} else {
			/**
				* @deprecated As of version 1.120
			*/
			oRm.attr("stroke", Parameters.get(sColor) || sColor);
		}
		oRm.attr("d", sPathData1);
		oRm.attr("fill", "transparent");
		oRm.attr("stroke-width", "7px");
		oRm.openEnd().close("path");
	};

	/**
	 * Writes the second path element for cases between 1% and 99%.
	 *
	 * @private
	 * @param {int} largeArcFlag for check of smaller or bigger than 180 degrees
	 * @param {float[]} pathCoordinates array containing specific coordinates for the path
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writePath2 = function(largeArcFlag, pathCoordinates, control, oRm) {
		var sPathData2 = "M" + pathCoordinates[2] + " " + pathCoordinates[3] + " A " + RadialMicroChartRenderer.RING_CORE_RADIUS + " " + RadialMicroChartRenderer.RING_CORE_RADIUS +
		", " + RadialMicroChartRenderer.X_ROTATION + ", " + (1 - largeArcFlag) + ", " + RadialMicroChartRenderer.SWEEP_FLAG + ", " + pathCoordinates[0] + " " + pathCoordinates[1];

		oRm.openStart("path");
		oRm.class("sapSuiteRMCPath");
		oRm.class("sapSuiteRMCRemainingCircle");
		oRm.attr("d", sPathData2);
		oRm.attr("fill", "transparent");
		oRm.attr("stroke-width", "7px");
		oRm.openEnd().close("path");
	};

	/**
	 * Writes the text content inside the chart.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeLabelInside = function(control, oRm) {
		oRm.openStart("div");
		oRm.class("sapSuiteRMCInsideLabel");
		oRm.class("sapSuiteRMCFont");
		oRm.class(this._getTextColorClass(control));
		oRm.openEnd();
		oRm.unsafeHtml(this._generateTextContent(control));
		oRm.close("div");
	};

	/**
	 * Places the text content outside the chart.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeLabelOutside = function(control, oRm) {
		oRm.openStart("div");
		oRm.class("sapSuiteRMCOutsideLabel");
		oRm.class("sapSuiteRMCFont");
		oRm.class("sapSuiteRMCLabelHide");
		oRm.class(this._getTextColorClass(control));
		oRm.openEnd();
		oRm.unsafeHtml(this._generateTextContent(control));
		oRm.close("div");
	};

	/* Helpers */

	/**
	 * Checks if rendering of inner content (circle or path-elements) is required.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} oControl the current chart control
	 * @returns {boolean} true if rendering is required, false if rendering is not required
	 */
	RadialMicroChartRenderer._renderingOfInnerContentIsRequired = function(oControl) {
		return oControl._hasData();
	};

	/**
	 * Returns the center factor for the text element.
	 * Since browsers interpret the text differently, the constant SVG_VIEWBOX_CENTER_FACTOR can not be used.
	 *
	 * @private
	 * @returns {string} factor for vertical center of text
	 */
	RadialMicroChartRenderer._getVerticalViewboxCenterFactorForText = function() {
		if (Device.browser.mozilla) {
			return "57%";
		} else {
			return "51%";
		}
	};

	/**
	 * Checks if the inner circle is required. This is valid for 0% or 100% scenarios.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {boolean} True if inner circle has to be rendered, false if inner circle is not required
	 */
	RadialMicroChartRenderer._innerCircleRequired = function(control) {
		return control.getPercentage() >= 100 || control.getPercentage() <= 0;
	};

	/**
	 * Generates the coordinates needed for drawing the two path elements.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control - the current chart control
	 * @param {float} percentage The calculated percentage value for bar rendering
	 * @param {boolean} hasPadding Padding is required or not
	 * @returns {float[]} Array with calculated coordinates
	 */
	RadialMicroChartRenderer._calculatePathCoordinates = function(control, percentage, hasPadding) {
		var aCoordinates = [];
		var fPadding = 0;
		var fCenter = RadialMicroChartRenderer.FORM_RATIO / 2;

		if (hasPadding) {
			fPadding = 2 * RadialMicroChartRenderer.PADDING_WIDTH / 100 * 2 * Math.PI;
		}

		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.cos(-Math.PI / 2.0 - fPadding));
		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.sin(-Math.PI / 2.0 - fPadding));
		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.cos(-Math.PI / 2.0 + percentage / 100 * 2 * Math.PI));
		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.sin(-Math.PI / 2.0 + percentage / 100 * 2 * Math.PI));

		return aCoordinates;
	};

	/**
	 * Generates percentage value for rendering the circle.
	 * For edge cases (99% and 1%) a specific handling is implemented.
	 * For values between 99.0% - 99.9%, 99% will be retrieved to make sure the circle is not completely filled setting thos big values.
	 * For values between 0.1% - 0.9%, 1% will be returned to make sure the circle is not completely empty settings those small values.
	 * This is only used for painting the circle by path elements. For the text area, the value of the percentage property can be used.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {float} the calculated percentage value for bar rendering
	 */
	RadialMicroChartRenderer._getPercentageForCircleRendering = function(control) {
		var fPercentage = control.getPercentage();
		var fPercentageForEdgeCases = fPercentage;
		if (fPercentage > 99 - RadialMicroChartRenderer.PADDING_WIDTH) {
			fPercentageForEdgeCases = 99 - RadialMicroChartRenderer.PADDING_WIDTH;
		}
		if (fPercentage < 1 + RadialMicroChartRenderer.PADDING_WIDTH) {
			fPercentageForEdgeCases = 1 + RadialMicroChartRenderer.PADDING_WIDTH;
		}
		return fPercentageForEdgeCases;
	};

	/**
	 * Returns the text color of the control. Also handles switch for accessibility features.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} value for CSS Text color class
	 */
	RadialMicroChartRenderer._getTextColorClass = function(control) {
		// Map for specific color types
		const colorClassMap = {
			[MicroChartColorType.Good]: "sapSuiteRMCTextColorGood",
			[MicroChartColorType.Error]: "sapSuiteRMCTextColorError",
			[MicroChartColorType.Critical]: "sapSuiteRMCTextColorCritical"
		  };

		  // Get the control's value color
		  const valueColor = control.getValueColor();

		  // Check the colorClassMap for specific color types
		  if (colorClassMap[valueColor]) {
			return colorClassMap[valueColor];
		  }

		  // Handle sequences (Sequence1, Sequence2, ...)
		  for (let i = 1; i <= 12; i++) {
			if (valueColor.toLowerCase() === MicroChartColorType[`Sequence${i}`].toLowerCase()) {
			  return `sapSuiteRMCTextColorSequence${i}`;
			}
		  }

		  // Default color if no match is found
		  return "sapSuiteRMCTextColorNeutral";
	};

	/**
	 * Returns the color for full circles required for 100% or 0% charts.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} value for full circle CSS color class or css attribute
	 */
	RadialMicroChartRenderer._getFullCircleColor = function(control) {
		if (control.getPercentage() >= 100) {
			return this._getPathColor(control);
		}
		if (control.getPercentage() <= 0) {
			return "sapSuiteRMCRemainingCircle";
		}
	};

	/**
	 * Gets the CSS class or CSS attribute to apply the right color to the circle path
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} containing the name of the CSS class or the CSS value
	 */
	RadialMicroChartRenderer._getPathColor = function(control) {
		var sValueColor = control.getValueColor();
		if (control._isValueColorValid()) {
			// Map for specific color types
			const colorClassMap = {
				[MicroChartColorType.Good]: "sapSuiteRMCPathGood",
				[MicroChartColorType.Error]: "sapSuiteRMCPathError",
				[MicroChartColorType.Critical]: "sapSuiteRMCPathCritical"
			};

			// Get the control's value color
			const valueColor = control.getValueColor();

			// Check the colorClassMap for specific color types
			if (colorClassMap[valueColor]) {
				return colorClassMap[valueColor];
			}

			// Handle sequences (Sequence1, Sequence2, ...)
			for (let i = 1; i <= 12; i++) {
				if (valueColor.toLowerCase() === MicroChartColorType[`Sequence${i}`].toLowerCase()) {
				return `sapSuiteRMCPathSequence${i}`;
				}
			}

			// Default color if no match is found
			return "sapSuiteRMCPathNeutral";
		} else {
			return sValueColor;
		}
	};

	/**
	 * Generates the text content of the chart
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} value for text element in the chart
	 */
	RadialMicroChartRenderer._generateTextContent = function(control) {
		var sShowPercentageSymbol = "RADIALMICROCHART_PERCENTAGE_TEXT";

		/**
		 * @deprecated since 1.123.0
		*/
		if (!control.getShowPercentageSymbol()) {
			sShowPercentageSymbol = "RADIALMICROCHART_PERCENTAGE_SYMBOL";
		}

		if (control.getPercentage() === 100) {
			return control._oRb.getText(sShowPercentageSymbol, [100]);
		}
		if (control.getPercentage() === 0) {
			return control._oRb.getText(sShowPercentageSymbol, [0]);
		}
		if (control.getPercentage() >= 100) {
			Log.error("Values over 100%(" + control.getPercentage() + "%) are not supported");
			return control._oRb.getText(sShowPercentageSymbol, [100]);
		}
		if (control.getPercentage() <= 0) {
			Log.error("Values below 0%(" + control.getPercentage() + "%) are not supported");
			return control._oRb.getText(sShowPercentageSymbol, [0]);
		}
		return control._oRb.getText(sShowPercentageSymbol, [control.getPercentage()]);
	};

	MicroChartRenderUtils.extendMicroChartRenderer(RadialMicroChartRenderer);

	return RadialMicroChartRenderer;
}, /* bExport */ true);
