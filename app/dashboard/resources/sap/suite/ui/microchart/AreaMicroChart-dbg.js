/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Control",
	"sap/m/FlexBox",
	"sap/suite/ui/microchart/MicroChartUtils",
	"sap/base/Log",
	"sap/ui/events/KeyCodes",
	"sap/ui/core/theming/Parameters",
	"sap/ui/core/ResizeHandler",
	"./AreaMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"sap/base/i18n/Localization",
	"./AreaMicroChartItem",
	"./AreaMicroChartLabel",
	"sap/ui/core/Lib"
], function(library, Control, FlexBox, MicroChartUtils, Log, KeyCodes, Parameters,
			ResizeHandler, AreaMicroChartRenderer, Core, Theming, Localization, AreaMicroChartItem, AreaMicroChartLabel, CoreLib) {
	"use strict";

	var MicroChartColorType = library.MicroChartColorType;
	var AreaMicroChartViewType = library.AreaMicroChartViewType;

	/**
	 * Constructor for a new AreaMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string. The aggregated data of the microchart can also be customized.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.AreaMicroChart
	 */
	var AreaMicroChart = Control.extend("sap.suite.ui.microchart.AreaMicroChart", /** @lends sap.suite.ui.microchart.AreaMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the bullet micro chart is included.
				 */
				size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * If this property is set, it indicates the value the X-axis ends with.
				 */
				maxXValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * If this property is set it indicates the value X axis ends with.
				 */
				minXValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * If this property is set it indicates the value X axis ends with.
				 */
				maxYValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * If this property is set it indicates the value X axis ends with.
				 */
				minYValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * The view of the chart.
				 */
				view: { type: "sap.suite.ui.microchart.AreaMicroChartViewType", group: "Appearance", defaultValue: "Normal" },

				/**
				 * The color palette for the chart. If this property is set,
				 * semantic colors defined in AreaMicroChartItem are ignored.
				 * As a result, colors of the palette are assigned to each line.
				 * When all the palette colors are used up, assignment of the colors starts again from the beginning of the palette.
				 */
				colorPalette: { type: "string[]", group: "Appearance", defaultValue: [] },

				/**
				 * Determines if the labels are displayed or not.
				 */
				showLabel: { type: "boolean", group: "Misc", defaultValue: true },

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed or by the width and height property.
				 * @since 1.38.0
				 *
				 * @deprecated as of version 1.60, the concept has been discarded.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false },

				/**
				 * If this is set to True, the control will be hidden in 'No data' scenario.
				 * @since 1.84
				 */
				hideOnNoData: { type: "boolean", group: "Appearance", defaultValue: false }

			},
			associations: {

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			events: {

				/**
				 * The event is triggered when the chart is pressed.
				 */
				press: {}

			},
			defaultAggregation: "lines",
			aggregations: {
				/**
				 * The configuration of the actual values line.
				 * The color property defines the color of the line.
				 * Points are rendered in the same sequence as in this aggregation.
				 */
				chart: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem, bindable: "bindable" },

				/**
				 * The configuration of the max threshold area. The color property defines the color of the area above the max threshold line. Points are rendered in the same sequence as in this aggregation.
				 */
				maxThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem },

				/**
				 * The configuration of the upper line of the inner threshold area. The color property defines the color of the area between inner thresholds. For rendering of the inner threshold area, both innerMaxThreshold and innerMinThreshold aggregations must be defined. Points are rendered in the same sequence as in this aggregation.
				 */
				innerMaxThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem },

				/**
				 * The configuration of the bottom line of the inner threshold area. The color property is ignored. For rendering of the inner threshold area, both innerMaxThreshold and innerMinThreshold aggregations must be defined. Points are rendered in the same sequence as in this aggregation.
				 */
				innerMinThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem },

				/**
				 * The configuration of the min threshold area. The color property defines the color of the area below the min threshold line. Points are rendered in the same sequence as in this aggregation.
				 */
				minThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem },

				/**
				 * The configuration of the target values line. The color property defines the color of the line. Points are rendered in the same sequence as in this aggregation.
				 */
				target: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem, bindable: "bindable" },

				/**
				 * The label on X axis for the first point of the chart.
				 */
				firstXLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel", defaultClass: AreaMicroChartLabel },

				/**
				 * The label on Y axis for the first point of the chart.
				 */
				firstYLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel", defaultClass: AreaMicroChartLabel },

				/**
				 * The label on X axis for the last point of the chart.
				 */
				lastXLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel", defaultClass: AreaMicroChartLabel },

				/**
				 * The label on Y axis for the last point of the chart.
				 */
				lastYLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel", defaultClass: AreaMicroChartLabel },

				/**
				 * The label for the maximum point of the chart.
				 */
				maxLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel", defaultClass: AreaMicroChartLabel },

				/**
				 * The label for the minimum point of the chart.
				 */
				minLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel", defaultClass: AreaMicroChartLabel },

				/**
				 * The set of lines.
				 */
				lines: { multiple: true, type: "sap.suite.ui.microchart.AreaMicroChartItem", defaultClass: AreaMicroChartItem, bindable: "bindable" }
			}

		},
		renderer: AreaMicroChartRenderer
	});

	// numbers are in rem units
	AreaMicroChart.THRESHOLD_LOOK_XS = 1.125;
	AreaMicroChart.THRESHOLD_LOOK_S = 3.5;
	AreaMicroChart.THRESHOLD_LOOK_M = 4.5;
	AreaMicroChart.THRESHOLD_LOOK_L = 5.875;
	AreaMicroChart.THRESHOLD_WIDTH_NO_LABEL = 6;
	AreaMicroChart.THRESHOLD_WIDE_HEIGHT_NO_LABEL = 2.25;

	AreaMicroChart.ITEM_NEUTRAL_COLOR = "sapSuiteAMCSemanticColorNeutral";
	AreaMicroChart.ITEM_NEUTRAL_NOTHRESHOLD_CSSCLASS = "sapSuiteAMCNeutralNoThreshold";

	AreaMicroChart._CHARTITEM_AGGREGATIONS = ["chart", "target", "minThreshold", "maxThreshold", "innerMinThreshold", "innerMaxThreshold"];

	AreaMicroChart.prototype.init = function() {
		this._oRb = CoreLib.getResourceBundleFor("sap.suite.ui.microchart");
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
	AreaMicroChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
		Localization.attachChange(this._handleThemeApplied.bind(this)); // rerender when RTL is changed
	};

	/**
	 * The chart will only be rendered if the theme is applied. If this is the case,
	 * the control invalidates itself.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
	};

	/**
	 * Retrieves the computed styles of the internally used CSS helper element.
	 * In case the backgroundColor, outlineStyle, and outlineWidth styles do not exist, they are replaced by their hyphenated
	 * equivalents.
	 *
	 * @returns {CSSStyleDeclaration} The CSS style declaration of the internal CSS helper element
	 * @private
	 */
	AreaMicroChart.prototype._getCssValues = function() {
		this._$CssHelper.className = Array.prototype.slice.call(arguments).join(" ");
		var oStyles = window.getComputedStyle(this._$CssHelper);

		if (!oStyles.backgroundColor) {
			oStyles.backgroundColor = oStyles["background-color"];
		}

		if (!oStyles.outlineStyle) {
			oStyles.outlineStyle = oStyles["outline-style"];
		}

		if (!oStyles.outlineWidth) {
			oStyles.outlineWidth = oStyles["outline-width"];
		}
		return oStyles;
	};

	/**
	 * Fills the area between the lines specified via points1 and points2 with the given color.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points1 The points array used for rendering the multi line.
	 * @param {object[]} points2 The points array used for rendering the multi line.
	 * @param {string} color The color to fill the area with.
	 * @private
	 */
	AreaMicroChart.prototype.__fillThresholdArea = function(context, points1, points2, color) {
		context.beginPath();
		context.moveTo(points1[0].x, points1[0].y);

		for (var i = 1, length = points1.length; i < length; i++) {
			context.lineTo(points1[i].x, points1[i].y);
		}

		for (var j = points2.length - 1; j >= 0; j--) {
			context.lineTo(points2[j].x, points2[j].y);
		}

		context.closePath();

		context.fillStyle = "white";
		context.fill();

		context.fillStyle = color;
		context.fill();

		context.lineWidth = 1;
		context.strokeStyle = "white";
		context.stroke();

		context.strokeStyle = color;
		context.stroke();
	};

	/**
	 * Renders a dashed line by using the context's native line dash functionality or a helper function.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points The points array used for rendering the multi line.
	 * @param {int[]} dasharray The array containing the sequence of blanks and dashes as pixel values.
	 * @private
	 */
	AreaMicroChart.prototype._renderDashedLine = function(context, points, dasharray) {
		if (context.setLineDash) {
			context.setLineDash(dasharray);
			this._renderLine(context, points);
			context.setLineDash([]);
		} else {
			context.beginPath();
			for (var i = 0, length = points.length - 1; i < length; i++) {
				context._dashedLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, dasharray);
			}
			context.stroke();
		}
	};

	/**
	 * Renders a multi line using the given points array.
	 * If a color is to be used, it has to be set prior to calling this function.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points The points array used for rendering the multi line.
	 * @private
	 */
	AreaMicroChart.prototype._renderLine = function(context, points) {
		context.beginPath();
		context.moveTo(points[0].x, points[0].y);

		for (var i = 1, length = points.length; i < length; i++) {
			context.lineTo(points[i].x, points[i].y);
		}

		context.stroke();
	};

	/**
	 * Defines the color class based on the threshold values.
	 *
	 * @private
	 * @param {object} canvasDimensions The canvas' calculated dimensions object.
	 * @param {boolean} targetColor Flag indicating render target.
	 * @returns {string} The CSS class used for line color.
	 */
	AreaMicroChart.prototype._getItemColor = function(canvasDimensions, targetColor) {
		var sItemColor;
		if (targetColor && this.getTarget()) {
			sItemColor = "sapSuiteAMCSemanticColor" + this.getTarget().getColor();
		} else if (!targetColor && this.getChart()) {
			sItemColor = "sapSuiteAMCSemanticColor" + this.getChart().getColor();
		}
		if ((sItemColor === AreaMicroChart.ITEM_NEUTRAL_COLOR) && !this._isThresholdPresent(canvasDimensions)) {
			return AreaMicroChart.ITEM_NEUTRAL_NOTHRESHOLD_CSSCLASS;
		} else {
			return sItemColor;
		}
	};

	/**
	 * Identifies if the control has thresholds based on the threshold's number of elements.
	 *
	 * @private
	 * @param {object} canvasDimensions - the canvas' calculated dimensions object
	 * @returns {boolean} - flag showing if thresholds exist
	 */
	AreaMicroChart.prototype._isThresholdPresent = function(canvasDimensions) {
		var aThreshold = [canvasDimensions.minThreshold.length, canvasDimensions.maxThreshold.length, canvasDimensions.innerMinThreshold.length, canvasDimensions.innerMaxThreshold.length];
		for (var i = 0; i < aThreshold.length; i++) {
			if (aThreshold[i] > 1) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Renders the target line onto the given rendering context.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._renderTarget = function(context, dimensions) {
		if (dimensions.target.length > 1) {
			var sColorClass = this._getItemColor(dimensions, true);
			var oStyles = this._getCssValues("sapSuiteAMCTarget", sColorClass);
			context.strokeStyle = oStyles.color;
			context.lineWidth = parseFloat(oStyles.width);

			if (oStyles?.textShadow && oStyles.textShadow !== "none") {
				this._renderShadows(oStyles, context);
			}

			if (oStyles.outlineStyle == "dotted") {
				this._renderDashedLine(context, dimensions.target, [ parseFloat(oStyles.outlineWidth), 3 ]);
			} else {
				this._renderLine(context, dimensions.target, dimensions);
			}
		} else if (dimensions.target.length == 1) {
			Log.warning("Target is not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders the threshold line with the given points onto the given rendering context.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points The points array used for rendering the multi line.
	 * @private
	 */
	AreaMicroChart.prototype._renderThresholdLine = function(context, points) {
		if (points && points.length) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold");

			context.strokeStyle = oStyles.color;
			context.lineWidth = oStyles.width;
			this._renderLine(context, points);
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'max' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillMaxThreshold = function(context, dimensions) {
		if (dimensions.maxThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColor" + this.getMaxThreshold().getColor());

			this.__fillThresholdArea(context, dimensions.maxThreshold, [
				{ x: dimensions.maxThreshold[0].x, y: dimensions.minY },
				{ x: dimensions.maxThreshold[dimensions.maxThreshold.length - 1].x, y: dimensions.minY }
			], oStyles.backgroundColor);

			this._renderThresholdLine(context, dimensions.maxThreshold, dimensions);
		} else if (dimensions.maxThreshold.length == 1) {
			Log.warning("Max Threshold is not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'min' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillMinThreshold = function(context, dimensions) {
		if (dimensions.minThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColor" + this.getMinThreshold().getColor());
			this.__fillThresholdArea(context, dimensions.minThreshold, [
				{ x: dimensions.minThreshold[0].x, y: dimensions.maxY },
				{ x: dimensions.minThreshold[dimensions.minThreshold.length - 1].x, y: dimensions.maxY }
			], oStyles.backgroundColor);
		} else if (dimensions.minThreshold.length == 1) {
			Log.warning("Min Threshold is not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'min' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillThresholdArea = function(context, dimensions) {
		if (dimensions.minThreshold.length > 1 && dimensions.maxThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColorCritical");

			this.__fillThresholdArea(context, dimensions.maxThreshold, dimensions.minThreshold, oStyles.backgroundColor);
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'min' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillInnerThresholdArea = function(context, dimensions) {
		if (dimensions.innerMinThreshold.length > 1 && dimensions.innerMaxThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColor" + this.getInnerMaxThreshold().getColor());

			this.__fillThresholdArea(context, dimensions.innerMaxThreshold, dimensions.innerMinThreshold, oStyles.backgroundColor);
		} else if (dimensions.innerMinThreshold.length || dimensions.innerMaxThreshold.length) {
			Log.warning("Inner threshold area is not rendered because inner min and max threshold were not correctly set");
		}
	};

	/**
	 * Renders the chart line for actual value. This line's points are retrieved from the 'chart' aggregation.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._renderChart = function(context, dimensions) {
		if (dimensions.chart.length > 1) {
			var sColorClass = this._getItemColor(dimensions);
			var oStyles = this._getCssValues("sapSuiteAMCChart", sColorClass);
			context.strokeStyle = oStyles.color;
			context.lineWidth = parseFloat(oStyles.width);

			if (oStyles?.textShadow && oStyles.textShadow !== "none") {
				this._renderShadows(oStyles, context);
			}

			this._renderLine(context, dimensions.chart, dimensions);
		} else if (dimensions.chart.length == 1) {
			Log.warning("Actual values are not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders the additional lines from the 'lines' aggregation onto the canvas.
	 * The lines get a palette color or a semantic color, depending on their 'color' properties.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._renderLines = function(context, dimensions) {
		var iCpLength = this.getColorPalette().length,
			iCpIndex = 0,
			oStyles = this._getCssValues("sapSuiteAMCLine"),
			iLength = dimensions.lines.length;

		var fnNextColor = function(sColor) {
			if (iCpLength) {
				if (iCpIndex === iCpLength) {
					iCpIndex = 0;
				}
				sColor = this.getColorPalette()[iCpIndex++].trim();
			}

			if (MicroChartColorType.hasOwnProperty(sColor)) {
				oStyles = this._getCssValues("sapSuiteAMCLine", "sapSuiteAMCSemanticColor" + sColor);
				return oStyles.color;
			} else {
				/**
				 * @deprecated As of version 1.120
				 */
				return Parameters.get(sColor) || sColor;
			}
		}.bind(this);

		context.lineWidth = parseFloat(oStyles.width);
		for (var i = 0; i < iLength; i++) {
			if (dimensions.lines[i].length > 1) {
				context.strokeStyle = fnNextColor(this.getLines()[i].getColor());
				this._renderLine(context, dimensions.lines[i], dimensions);
			}
		}
	};

	/**
	 * Renders the canvas.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._renderCanvas = function() {
		var oCanvas = this.getDomRef("canvas");
		if (!this._hasData() || !oCanvas) {
			return;
		}

		this._$CssHelper = this.getDomRef("css-helper");

		var $this = this.$();

		var oCanvasSettings = window.getComputedStyle(oCanvas);

		var fWidth = parseFloat(oCanvasSettings.width);
		oCanvas.setAttribute("width", fWidth || 360); // TODO what are those magic numbers

		var fHeight = parseFloat(oCanvasSettings.height);
		oCanvas.setAttribute("height", fHeight || 242);

		var oRenderContext = oCanvas.getContext("2d");

		oRenderContext.lineJoin = "round";
		oRenderContext._dashedLine = this._drawDashedLine;

		var oDimensions = this._calculateDimensions(oCanvas.width, oCanvas.height);

		if (this._isThresholdPresent(oDimensions)) {
			$this.find(".sapSuiteAMCCanvasContainer").addClass("sapSuiteAMCWithThreshold");
		}

		this._fillMaxThreshold(oRenderContext, oDimensions);
		this._fillMinThreshold(oRenderContext, oDimensions);
		this._fillThresholdArea(oRenderContext, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.minThreshold, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.maxThreshold, oDimensions);
		this._fillInnerThresholdArea(oRenderContext, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.innerMinThreshold, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.innerMaxThreshold, oDimensions);
		this._renderTarget(oRenderContext, oDimensions);
		this._renderChart(oRenderContext, oDimensions);
		this._renderLines(oRenderContext, oDimensions);
	};

	/**
	 * Draws a single dashed line using the given dasharray from the first point with x and y to the
	 * second point with x2 and y2.
	 *
	 * @param {float} x The first x value of the line.
	 * @param {float} y The first y value of the line.
	 * @param {float} x2 The second x value of the line.
	 * @param {float} y2 The second y value of the line.
	 * @param {float[]} dasharray The array containing the sequence of blanks and dashes as pixel values.
	 * @private
	 */
	AreaMicroChart.prototype._drawDashedLine = function(x, y, x2, y2, dasharray) {
		var iDashCount = dasharray.length;
		this.moveTo(x, y);

		var fDelta = (x2 - x), dy = (y2 - y),
			fSlope = fDelta ? dy / fDelta : 1e15,
			fRemainingDist = Math.sqrt(fDelta * fDelta + dy * dy),
			i = 0,
			bDraw = true;

		while (fRemainingDist >= 0.1) {
			var dashLength = dasharray[i++ % iDashCount];
			if (dashLength > fRemainingDist) {
				dashLength = fRemainingDist;
			}
			var fStep = Math.sqrt(dashLength * dashLength / (1 + fSlope * fSlope));
			if (fDelta < 0) {
				fStep = -fStep;
			}
			x += fStep;
			y += fSlope * fStep;
			this[bDraw ? "lineTo" : "moveTo"](x, y);
			fRemainingDist -= dashLength;
			bDraw = !bDraw;
		}
	};

	/**
	 * Calculates the dimensions of the chart.
	 * The dimensions correspond to the current scaling given through control properties.
	 *
	 * @private
	 * @param {float} width Canvas width
	 * @param {float} height Canvas height
	 * @returns {object} An object containing the dimensions calculation results
	 */
	AreaMicroChart.prototype._calculateDimensions = function(width, height) {
		var fMaxX, fMaxY, fMinX, fMinY;

		function calculateExtrema() {
			if (!this._isMinXValue || !this._isMaxXValue || !this._isMinYValue || !this._isMaxYValue) {
				var aLines = this.getLines();
				if (this.getMaxThreshold()) {
					aLines.push(this.getMaxThreshold());
				}

				if (this.getMinThreshold()) {
					aLines.push(this.getMinThreshold());
				}

				if (this.getChart()) {
					aLines.push(this.getChart());
				}

				if (this.getTarget()) {
					aLines.push(this.getTarget());
				}

				if (this.getInnerMaxThreshold()) {
					aLines.push(this.getInnerMaxThreshold());
				}

				if (this.getInnerMinThreshold()) {
					aLines.push(this.getInnerMinThreshold());
				}

				for (var i = 0, iLines = aLines.length; i < iLines; i++) {
					var aPoints = aLines[i].getPoints();

					for (var k = 0, a = aPoints.length; k < a; k++) {
						var fValueX = aPoints[k].getXValue();
						if (fValueX > fMaxX || fMaxX === undefined) {
							fMaxX = fValueX;
						}
						if (fValueX < fMinX || fMinX === undefined) {
							fMinX = fValueX;
						}

						var fValueY = aPoints[k].getYValue();
						if (fValueY > fMaxY || fMaxY === undefined) {
							fMaxY = fValueY;
						}
						if (fValueY < fMinY || fMinY === undefined) {
							fMinY = fValueY;
						}
					}
				}
			}
			if (this._isMinXValue) {
				fMinX = this.getMinXValue();
			}

			if (this._isMaxXValue) {
				fMaxX = this.getMaxXValue();
			}

			if (this._isMinYValue) {
				fMinY = this.getMinYValue();
			}

			if (this._isMaxYValue) {
				fMaxY = this.getMaxYValue();
			}
		}

		calculateExtrema.call(this);

		var oResult = {
			minY: 0,
			minX: 0,
			maxY: height,
			maxX: width,
			lines: []
		};

		var kx;
		var fDeltaX = fMaxX - fMinX;

		if (fDeltaX > 0) {
			kx = width / fDeltaX;
		} else if (fDeltaX == 0) {
			kx = 0;
			oResult.maxX /= 2;
		} else {
			Log.warning("Min X is greater than max X.");
		}

		var ky;
		var fDeltaY = fMaxY - fMinY;

		if (fDeltaY > 0) {
			ky = height / (fMaxY - fMinY);
		} else if (fDeltaY == 0) {
			ky = 0;
			oResult.maxY /= 2;
		} else {
			Log.warning("Min Y is greater than max Y.");
		}

		function calculateCoordinates(line) {
			var bRtl = Localization.getRTL();

			var fnCalcX = function(fValue) {
				var x = kx * (fValue - fMinX);

				if (bRtl) {
					x = oResult.maxX - x;
				}
				return x;
			};

			var fnCalcY = function(fValue) {
				return oResult.maxY - ky * (fValue - fMinY);
			};

			var aResult = [];
			if (line && kx !== undefined && ky !== undefined) {
				var aPoints = line.getPoints();
				var iLength = aPoints.length;
				var xi, yi, tmpXValue, tmpYValue;

				if (iLength == 1) {
					tmpXValue = aPoints[0].getXValue();
					tmpYValue = aPoints[0].getYValue();

					if (tmpXValue == undefined ^ tmpYValue == undefined) {
						var xn, yn;
						if (tmpXValue == undefined) {
							yn = yi = fnCalcY(tmpYValue);
							xi = oResult.minX;
							xn = oResult.maxX;
						} else {
							xn = xi = fnCalcX(tmpXValue);
							yi = oResult.minY;
							yn = oResult.maxY;
						}

						aResult.push({ x: xi, y: yi }, { x: xn, y: yn });
					} else {
						Log.warning("Point with coordinates [" + tmpXValue + " " + tmpYValue + "] ignored");
					}
				} else {
					for (var i = 0; i < iLength; i++) {
						tmpXValue = aPoints[i].getXValue();
						tmpYValue = aPoints[i].getYValue();

						if (tmpXValue != undefined && tmpYValue != undefined) {
							xi = fnCalcX(tmpXValue);
							yi = fnCalcY(tmpYValue);

							aResult.push({ x: xi, y: yi });
						} else {
							Log.warning("Point with coordinates [" + tmpXValue + " " + tmpYValue + "] ignored");
						}
					}
				}
			}
			return aResult;
		}

		oResult.maxThreshold = calculateCoordinates(this.getMaxThreshold());
		oResult.minThreshold = calculateCoordinates(this.getMinThreshold());
		oResult.chart = calculateCoordinates(this.getChart());
		oResult.target = calculateCoordinates(this.getTarget());
		oResult.innerMaxThreshold = calculateCoordinates(this.getInnerMaxThreshold());
		oResult.innerMinThreshold = calculateCoordinates(this.getInnerMinThreshold());

		var iLength = this.getLines().length;
		for (var i = 0; i < iLength; i++) {
			oResult.lines.push(calculateCoordinates(this.getLines()[i]));
		}
		return oResult;
	};

	/**
	 * Property setter for the Min X value
	 *
	 * @param {float} value - new value Min X
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMinXValue = function(value, bSuppressInvalidate) {
		this._isMinXValue = this._isNumber(value);

		return this.setProperty("minXValue", this._isMinXValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Property setter for the Max X value
	 *
	 * @param {float} value - new value Max X
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMaxXValue = function(value, bSuppressInvalidate) {
		this._isMaxXValue = this._isNumber(value);

		return this.setProperty("maxXValue", this._isMaxXValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Property setter for the Min Y value
	 *
	 * @param {float} value - new value Min Y
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMinYValue = function(value, bSuppressInvalidate) {
		this._isMinYValue = this._isNumber(value);

		return this.setProperty("minYValue", this._isMinYValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Property setter for the Max Y value
	 *
	 * @param {float} value - new value Max Y
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMaxYValue = function(value, bSuppressInvalidate) {
		this._isMaxYValue = this._isNumber(value);

		return this.setProperty("maxYValue", this._isMaxYValue ? value : NaN, bSuppressInvalidate);
	};

	AreaMicroChart.prototype._isNumber = function(n) {
		return typeof n === "number" && !isNaN(n) && isFinite(n);
	};

	AreaMicroChart.prototype.onBeforeRendering = function() {
		if (this._bUseIndex) {
			this._indexChartItems();
		}

		if (this._sChartResizeHandlerId ) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}

		this._unbindMouseEnterLeaveHandler();
	};

	AreaMicroChart.prototype.onAfterRendering = function() {
		library._checkControlIsVisible(this, this._onControlIsVisible);

		this._bindMouseEnterLeaveHandler();
	};

	AreaMicroChart.prototype.setSize = function(sSize) {
		if (this.getSize() !== sSize) {
			this.setProperty("size", sSize);
		}
		return this;
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._onControlIsVisible = function() {
		this._onResize();
		this._sChartResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
	};

	/**
	 * Applies numeric indices to the x-coordinates of all points in all AreaMicroChartItem aggregations in order to have them be enumerable.
	 * This simple enumeration causes an equidistant point distribution on the x-axis.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._indexChartItems = function() {
		var oChartItem, n = AreaMicroChart._CHARTITEM_AGGREGATIONS.length;
		for (var i = 0; i < n; i++) {
			oChartItem = this.getAggregation(AreaMicroChart._CHARTITEM_AGGREGATIONS[i]);
			if (oChartItem) {
				this._indexChartItemPoints(oChartItem);
			}
		}
	};

	/**
	 * Sets the property "x" of all points in the given AreaMicroChartItem to their respective index in the "points" aggregation.
	 *
	 * @param {sap.suite.ui.microchart.AreaMicroChartItem} chartItem The AreaMicroChartItem whose points are to be indexed.
	 * @private
	 */
	AreaMicroChart.prototype._indexChartItemPoints = function(chartItem) {
		var oPoints = chartItem.getPoints();
		for (var i = 0; i < oPoints.length; i++) {
			oPoints[i].setProperty("x", i, true);
		}
	};

	/**
	 * Enables x-values of all points are automatically indexed with numeric, equidistant values.
	 *
	 * @param {boolean} useIndex Flag to activate automatic index
	 * @protected
	 */
	AreaMicroChart.prototype.enableXIndexing = function(useIndex) {
		this._bUseIndex = useIndex;
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._onResize = function() {
		var $Control = this.$(),
			iControlWidth = parseInt($Control.width()),
			iControlHeight = parseInt($Control.height()),
			$MinMaxLabels = $Control.find(".sapSuiteAMCPositionCenter"),
			$TopLabels = $Control.find(".sapSuiteAMCPositionTop .sapSuiteAMCPositionLeft, .sapSuiteAMCPositionTop .sapSuiteAMCPositionRight," +
				".sapSuiteAMCSideLabels .sapSuiteAMCLbl:first-child");

		$Control.removeClass("sapSuiteAMCNoLabels sapSuiteAMCLookM sapSuiteAMCLookS sapSuiteAMCLookXS sapSuiteAMCNoMinMaxLabels sapSuiteAMCNoTopLabels");

		// hide all labels if chart width is too small
		if (iControlWidth <= this.convertRemToPixels(AreaMicroChart.THRESHOLD_WIDTH_NO_LABEL)) {
			$Control.addClass("sapSuiteAMCNoLabels");
		}

		if (iControlHeight < this.convertRemToPixels(AreaMicroChart.THRESHOLD_WIDE_HEIGHT_NO_LABEL)) {
			$Control.addClass("sapSuiteAMCLookXS");
		} else if (iControlHeight < this.convertRemToPixels(AreaMicroChart.THRESHOLD_LOOK_S) && this.getView() === AreaMicroChartViewType.Normal) {
			$Control.addClass("sapSuiteAMCLookXS");
		} else if (iControlHeight < this.convertRemToPixels(AreaMicroChart.THRESHOLD_LOOK_M)) {
			$Control.addClass("sapSuiteAMCLookS");
		} else if (iControlHeight < this.convertRemToPixels(AreaMicroChart.THRESHOLD_LOOK_L)) {
			$Control.addClass("sapSuiteAMCLookM");
		}

		if (this._isAnyLabelTruncated($TopLabels) || this._isAnyLabelVerticallyTruncated($TopLabels)) {
			// try to make space by removing max label, then try again if labels fits now
			$Control.addClass("sapSuiteAMCNoMinMaxLabels");
			if (this._isAnyLabelTruncated($TopLabels)) {
				$Control.removeClass("sapSuiteAMCNoMinMaxLabels");
				$Control.addClass("sapSuiteAMCNoTopLabels");
			}
		}

		if (this._isAnyLabelTruncated($MinMaxLabels)) {
			$Control.addClass("sapSuiteAMCNoMinMaxLabels");
		}

		this._renderCanvas();
	};

	/**
	 * Checks if the label is truncated.
	 *
	 * @private
	 * @param {Object} label The label to be checked.
	 * @returns {boolean} True if the label is truncated, false if not.
	 */
	AreaMicroChart.prototype._isLabelTruncated = function(label) {
		return label.offsetWidth < label.scrollWidth;
	};

	AreaMicroChart.prototype.ontap = function(oEvent) {
		this.firePress();
	};

	AreaMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which == KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	AreaMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which == KeyCodes.ENTER || oEvent.which == KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	AreaMicroChart.prototype.attachEvent = function() {
		Control.prototype.attachEvent.apply(this, arguments);

		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	AreaMicroChart.prototype.detachEvent = function() {
		Control.prototype.detachEvent.apply(this, arguments);

		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	/**
	 * Retrieves the translated name of the given semantic color from the resource bundle.
	 *
	 * @param {sap.suite.ui.microchart.MicroChartColorType} color The semantic color to be translated.
	 * @returns {string} The translated text.
	 * @private
	 */
	AreaMicroChart.prototype._getLocalizedColorMeaning = function(color) {
		return MicroChartColorType.hasOwnProperty(color) ? this._oRb.getText(("SEMANTIC_COLOR_" + color).toUpperCase()) : "";
	};

	AreaMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sAltText = this._oRb.getText("AREAMICROCHART");

		if (bIsActive) {
			sAltText += " " + this._oRb.getText("IS_ACTIVE");
		}


		if (!this._hasData()) {
			sAltText += "\n" + this._oRb.getText("NO_DATA");
			return sAltText;
		}

		var oFirstXLabel = this.getFirstXLabel();
		var oFirstYLabel = this.getFirstYLabel();
		var oLastXLabel = this.getLastXLabel();
		var oLastYLabel = this.getLastYLabel();
		var oMinLabel = this.getMinLabel();
		var oMaxLabel = this.getMaxLabel();
		var oActual = this.getChart();
		var oTarget = this.getTarget();
		if (oFirstXLabel && oFirstXLabel.getLabel() || oFirstYLabel && oFirstYLabel.getLabel()) {
			sAltText += "\n" + this._oRb.getText(("AREAMICROCHART_START")) + ": " + (oFirstXLabel ? oFirstXLabel.getLabel() : "") + " " + (oFirstYLabel ? oFirstYLabel.getLabel() + " " + this._getLocalizedColorMeaning(oFirstYLabel.getColor()) : "");
		}
		if (oLastXLabel && oLastXLabel.getLabel() || oLastYLabel && oLastYLabel.getLabel()) {
			sAltText += "\n" + this._oRb.getText(("AREAMICROCHART_END")) + ": " + (oLastXLabel ? oLastXLabel.getLabel() : "") + " " + (oLastYLabel ? oLastYLabel.getLabel() + " " + this._getLocalizedColorMeaning(oLastYLabel.getColor()) : "");
		}
		if (oMinLabel && oMinLabel.getLabel()) {
			sAltText += "\n" + this._oRb.getText(("AREAMICROCHART_MINIMAL_VALUE")) + ": " + oMinLabel.getLabel() + " " + this._getLocalizedColorMeaning(oMinLabel.getColor());
		}
		if (oMaxLabel && oMaxLabel.getLabel()) {
			sAltText += "\n" + this._oRb.getText(("AREAMICROCHART_MAXIMAL_VALUE")) + ": " + oMaxLabel.getLabel() + " " + this._getLocalizedColorMeaning(oMaxLabel.getColor());
		}
		if (oActual && oActual.getPoints() && oActual.getPoints().length > 0) {
			sAltText += "\n" + this._oRb.getText(("AREAMICROCHART_ACTUAL_VALUES")) + ":";
			var aActual = oActual.getPoints();
			for (var i = 0; i < aActual.length; i++) {
				sAltText += " " + aActual[i].getY();
			}
		}
		if (oTarget && oTarget.getPoints() && oTarget.getPoints().length > 0) {
			sAltText += "\n" + this._oRb.getText(("AREAMICROCHART_TARGET_VALUES")) + ":";
			var aTarget = oTarget.getPoints();
			for (var j = 0; j < aTarget.length; j++) {
				sAltText += " " + aTarget[j].getY();
			}
		}
		return sAltText;
	};

	AreaMicroChart.prototype._getAltSubText = function(bIsFirst) {
		var sAltText = "";

		for (var k = 0; k < this.getLines().length; k++) {
			var oLine = this.getLines()[k],
				sLineTooltip = oLine.getTooltip_AsString(),
				sAltLineText = "",
				sTitleText = "";

			if (!sLineTooltip) {
				continue;
			}

			if (oLine.getPoints() && oLine.getPoints().length > 0) {
				sTitleText += (bIsFirst ? "" : "\n") + (oLine.getTitle() ? oLine.getTitle() : this._oRb.getText("AREAMICROCHART_LINE", [k + 1] )) + ":";
				var aLine = oLine.getPoints();
				for (var y = 0; y < aLine.length; y++) {
					sAltLineText += " " + aLine[y].getY();
				}

				if (this.getColorPalette().length === 0) {
					sAltLineText += " " + this._getLocalizedColorMeaning(oLine.getColor());
				}
			}

			sAltLineText = sLineTooltip.split("((AltText))").join(sAltLineText);

			if (sAltLineText) {
				sAltText += sTitleText + sAltLineText;
				bIsFirst = false;
			}
		}

		return sAltText;
	};

	AreaMicroChart.prototype.clone = function() {
		var oClone = Control.prototype.clone.apply(this, arguments);
		oClone._isMinXValue = this._isMinXValue;
		oClone._isMaxXValue = this._isMaxXValue;
		oClone._isMinYValue = this._isMinYValue;
		oClone._isMaxYValue = this._isMaxYValue;
		return oClone;
	};

	AreaMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
		Theming.attachApplied(this._handleThemeApplied.bind(this));
		Localization.detachChange(this._handleThemeApplied.bind(this));
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._bindMouseEnterLeaveHandler = function() {
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
	AreaMicroChart.prototype._unbindMouseEnterLeaveHandler = function() {
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
	AreaMicroChart.prototype._hasData = function() {
		return this.getLines().length > 0 || !!this.getChart();
	};

	// to prevent press event in No Data mode
	AreaMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	//Convert shadows from HTML styles to svg canvas element
	AreaMicroChart.prototype._renderShadows = function(oStyles, context) {
		//Split individual textshadows
		var sTextShadows = oStyles.textShadow.split(/,(?![^(]*\))/);

			// Remove any trailing semicolon and trim whitespace
			var aTextShadows = sTextShadows.map((shadow) => shadow.trim().replace(/;$/, ''));

			// Iterate over each shadow definition
			aTextShadows.forEach((sShadow) => {
				// Extract the color and offset values
				var aTextShadows = sShadow.match(/(rgb\([^)]+\))\s+(-?\d+px)\s+(-?\d+px)\s+(-?\d+px)/);
				if (aTextShadows) {
					var color = aTextShadows[1]; // rgb color
					var offsetX = parseInt(aTextShadows[2]); // Horizontal offset
					var offsetY = parseInt(aTextShadows[3]); // Vertical offset

					// Draw text with the extracted shadow details
					drawTextWithShadow(context, offsetX, offsetY, color);
				}
			});
			function drawTextWithShadow(context, offsetX, offsetY, color) {
				context.shadowOffsetX = offsetX;
				context.shadowOffsetY = offsetY;
				context.shadowBlur = 0;
				context.shadowColor = color;
			}
	};

	MicroChartUtils.extendMicroChart(AreaMicroChart);

	return AreaMicroChart;
});
