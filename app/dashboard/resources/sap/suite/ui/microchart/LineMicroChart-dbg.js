/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/ui/core/Control",
	"sap/ui/core/ResizeHandler",
	"sap/ui/events/KeyCodes",
	"sap/base/Log",
	"sap/suite/ui/microchart/MicroChartUtils",
	"sap/suite/ui/microchart/LineMicroChartLine",
	"./LineMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"./LineMicroChartPoint"
], function(jQuery, library, Control, ResizeHandler, KeyCodes, Log, MicroChartUtils,
			LineMicroChartLine, LineMicroChartRenderer, Core, Theming, LineMicroChartPoint) {
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * Constructor for a new LineMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Chart that displays the history of values as segmented lines along a threshold line. The scale is optional and showing the points is also optional.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.136.0
	 * @since 1.48.0
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.LineMicroChart
	 */
	var LineMicroChart = Control.extend("sap.suite.ui.microchart.LineMicroChart", /** @lends sap.suite.ui.microchart.LineMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {

				/**
				 * The size of the chart. If not set, the default size is applied based on the type of the device.
				 */
				size: { type: "sap.m.Size", group: "Appearance", defaultValue: "Auto" },

				/**
				 * Determines the chart threshold which is used for vertical normalization.
				 * If the threshold does not belong to the value range given by minYValue...maxYValue, the threshold is ignored.
				 * By setting the threshold property's value to null, the threshold is disabled and excluded from range calculations.
				 */
				threshold: { type: "float", group: "Appearance", defaultValue: 0 },

				/**
				 * If this property is set to <code>false</code>, the threshold line is hidden.
				 */
				showThresholdLine: { type: "boolean", group: "Appearance", defaultValue: true },

				/**
				 * If this property is set to <code>false</code>, the threshold value is hidden.
				 * <br>If this property is set to <code>true</code>, the value will be shown only if the
				 * <code>showThresholdLine</code> property is also set to <code>true</code>.
				 */
				showThresholdValue: { type: "boolean", group: "Appearance", defaultValue: false },

				/**
				 * Overrides the threshold value with a string that is shown instead.
				 */
				thresholdDisplayValue: { type: "string", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the X-axis starts with.
				 */
				minXValue: { type: "float", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the X-axis ends with.
				 */
				maxXValue: { type: "float", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the Y-axis starts with.
				 */
				minYValue: { type: "float", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the Y-axis ends with.
				 */
				maxYValue: { type: "float", group: "Appearance" },

				/**
				 * Describes the left top label of the chart.
				 * The label color is determined by the color property of the first LineMicroChartPoint in the points aggregation.
				 * The space for the label is not reserved if the label is not set.
				 */
				leftTopLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the right top label of the chart.
				 * The label color is determined by the color property of the last LineMicroChartPoint in the points aggregation.
				 * The space for the label is not reserved if the label is not set.
				 */
				rightTopLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the left bottom label of the chart.
				 * The label color is set internally.
				 * The space for the label is not reserved if the label is not set.
				 */
				leftBottomLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the right bottom label of the chart.
				 * The label color is set automatically.
				 * The space for the label is not reserved if the label is not set.
				 */
				rightBottomLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * If this property is set to <code>false</code>, both top labels are hidden.
				 */
				showTopLabels: { type: "boolean", defaultValue: true },

				/**
				 * If this property is set to <code>false</code>, both bottom labels are hidden.
				 */
				showBottomLabels: { type: "boolean", defaultValue: true },

				/**
				 * Describes the color of the chart.
				 * <br>In conjunction with emphasized points, it is only used if all points have the sap.m.ValueColor.Neutral color.
				 * <br>The color can be set as an {@link sap.m.ValueCSSColor} or as a plain object. It has the 'above|' and 'below' properties that determine the color of the graph above and below the threshold, respectively.
				 *
				 * <br>The <code>color</code> property of {@link sap.suite.ui.microchart.LineMicroChartLine} has priority over this property in case it is set.
				 */
				color: { type: "any", group: "Appearance", defaultValue: "Neutral" },

				/**
				 * Defines if the control renders the points or not.
				 * <br>If emphasized points are used, there is no effect.
				 * <br>If the value is true, the points in the aggregation are shown.
				 *
				 * <br>The <code>showPoints</code> property of the {@link sap.suite.ui.microchart.LineMicroChartLine} control has priority over this property in case it is set.
				 */
				showPoints: { type: "boolean", group: "Appearance", defaultValue: false },

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

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
			defaultAggregation: "points",
			aggregations: {
				/**
				 * Aggregation that contains all data points that should be provided in an ordered way.
				 * If both the <code>points</code> and <code>lines</code> aggregations are used, the chart
				 * is rendered based on the <code>points</code> aggregation, while the lines from the <code>lines</code> aggregations are ignored.
				 * <br>The <code>points</code> aggregation can be used to ensure backward compatibility.
				 * However in general, the <code>lines</code> aggregation should be preferred.
				 */
				points: { type: "sap.suite.ui.microchart.LineMicroChartPoint",defaultClass: LineMicroChartPoint, multiple: true, bindable: "bindable", forwarding: {getter: "_getInternalLine", aggregation: "points"} },

				/**
				 * Aggregation that containes lines with data points.
				 * <br>This aggregation should be used instead of the <code>points</code> aggregation.
				 */
				lines: { type: "sap.suite.ui.microchart.LineMicroChartLine", defaultClass: LineMicroChartLine, multiple: true, bindable: "bindable"},

				/**
				 * {@link sap.suite.ui.microchart.LineMicroChartLine} for the cases when a single line with the legacy <code>points</code> aggregation is used.
				 * Rest of the control can than work with LineMicroChartLines, regardless of this use case.
				 *
				 * @private
				 */
				_line: { type: "sap.suite.ui.microchart.LineMicroChartLine", defaultClass: LineMicroChartLine, multiple: false, visibility: "hidden"}
			},
			events: {
				/**
				 * The event is triggered when the chart is pressed.
				 */
				press: {}
			}
		},
		renderer: LineMicroChartRenderer
	});

	// numbers are in rem units
	LineMicroChart.THRESHOLD_LOOK_XS = 1.125;
	LineMicroChart.THRESHOLD_LOOK_S = 3.5;
	LineMicroChart.THRESHOLD_LOOK_M = 4.5;
	LineMicroChart.THRESHOLD_LOOK_L = 5.875;
	LineMicroChart.THRESHOLD_WIDTH_NO_LABEL = 6;

	/* =========================================================== */
	/* Events */
	/* =========================================================== */
	LineMicroChart.prototype.ontap = function(oEvent) {
		this.firePress();
	};

	LineMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	LineMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	LineMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	LineMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	/**
	 * Handler for click event
	 */
	LineMicroChart.prototype.onclick = function() {
		this.firePress();
	};

	/**
	 * Handler for space button event
	 */
	LineMicroChart.prototype.onsapspace = LineMicroChart.prototype.onclick;

	/**
	 * Handler for enter button event
	 */
	LineMicroChart.prototype.onsapenter = LineMicroChart.prototype.onclick;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	LineMicroChart.prototype.getThreshold = function() {
		if (this._bThresholdNull) {
			return null;
		} else {
			return this.getProperty("threshold");
		}
	};

	/* =========================================================== */
	/* Protected methods */
	/* =========================================================== */
	LineMicroChart.prototype.init = function() {
		this._minXScale = null;
		this._maxXScale = null;
		this._minYScale = null;
		this._maxYScale = null;
		this._fNormalizedThreshold = 0;
		this._bScalingValid = false;
		this._bThresholdNull = false;
		this._bNoTopLabels = false;
		this._bNoBottomLabels = false;

		this._oRb = Core.getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "((AltText))", true);
		this._bThemeApplied = false;
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	LineMicroChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	LineMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	LineMicroChart.prototype.onBeforeRendering = function() {
		if (this._hasData()) {
			this._setModeFlags();
			this._normalizePoints();
		}
		this._unbindMouseEnterLeaveHandler();
	};

	LineMicroChart.prototype.onAfterRendering = function() {
		this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		this._onResize();

		this._bindMouseEnterLeaveHandler();
	};

	LineMicroChart.prototype.exit = function() {
		this._deregisterResizeHandler();
	};

	LineMicroChart.prototype.validateProperty = function(propertyName, value) {
		if (propertyName === "threshold") {
			this._bThresholdNull = value === null;
		}
		if (value === null || value === undefined) {
			return Control.prototype.validateProperty.apply(this, [propertyName, null]);
		}
		// a valid color must consist of either a single valid ValueCSSColor or an object composed of the valid ValueCSSColor properties 'above' and 'below'
		if (propertyName === "color" && !this.isColorCorrect(value)) {
			Log.warning("Color property of LineMicroChart must be of type sap.m.ValueCSSColor either as single value or as composite value (above: value, below: value)");
			value = null;
		} else if (["minXValue", "maxXValue", "minYValue", "maxYValue"].indexOf(propertyName) >= 0) {
			// min and max X/Y values must not be smaller/greater than their respective min/max coordinate;
			// otherwise, a warning will be logged and the property value will be set to null
			if (!(isFinite(value) && !isNaN(parseFloat(value)))) {
				Log.warning("Property " + propertyName + " of LineMicroChart is not numeric and it will be reset to default");
				value = null;
			}
		}
		return Control.prototype.validateProperty.apply(this, [propertyName, value]);
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */

	LineMicroChart.prototype._getInternalLine = function() {
		var oLine = this.getAggregation("_line");

		if (!oLine) {
			oLine = new LineMicroChartLine();
			this.setAggregation("_line", oLine);
		}

		return oLine;
	};

	LineMicroChart.prototype._getLines = function() {
		var oLine = this.getAggregation("_line");

		return (oLine && oLine._getPoints().length > 0) ? [oLine] : this.getLines();
	};

	/**
	 * Determines the semantic and focused modes.
	 *
	 * @private
	 */
	LineMicroChart.prototype._setModeFlags = function() {
		var aPoints;

		// initialize scale variables
		this._minXScale = Infinity;
		this._maxXScale = -Infinity;
		// initialize with threshold value if not null. Upper/lower boundries will be overwritten later if applicable.
		if (this._bThresholdNull) {
			this._minYScale = Infinity;
			this._maxYScale = -Infinity;
		} else {
			this._minYScale = this._maxYScale = this.getThreshold();
		}

		this._getLines().forEach(function(oLine) {
			aPoints = oLine._getPoints();
			oLine._bFocusMode = false;
			oLine._bSemanticMode = false;

			for (var i = 0; i < aPoints.length; i++) {
				this._minXScale = Math.min(aPoints[i].getX(), this._minXScale);
				this._maxXScale = Math.max(aPoints[i].getX(), this._maxXScale);
				this._minYScale = Math.min(aPoints[i].getY(), this._minYScale);
				this._maxYScale = Math.max(aPoints[i].getY(), this._maxYScale);
				// focusMode is activated if emphasizedPoints are used
				if (aPoints[i].getMetadata().getName() === "sap.suite.ui.microchart.LineMicroChartEmphasizedPoint") {
					oLine._bFocusMode = true;
					// semanticMode is only active for emphasized points if at least one emphasized point is shown and has a different color than Neutral.
					if (aPoints[i].getColor() !== MicroChartColorType["Neutral"] && aPoints[i].getShow()) {
						oLine._bSemanticMode = true;
					}
				}
			}

			// if focusMode is not active, only simple points can be used
			if (!oLine._bFocusMode) {
				// semanticMode is only active if the chart's color property is an object composed of both above and below entries.
				oLine._bSemanticMode = (oLine.getColor() && oLine.getColor().above && oLine.getColor().below && !this._bThresholdNull);
			}

			// log warnings for invalid properties if they are different from the default value
			if (oLine._bFocusMode && oLine._bSemanticMode && oLine.getColor() !== MicroChartColorType["Neutral"]) {
				Log.info("Property Color of LineMicroChart has no effect if EmphasizedPoints with colors different from Neutral are used.");
			}
			if (oLine._bFocusMode && oLine.getShowPoints()) {
				Log.info("Property ShowPoints of LineMicroChart has no effect if EmphasizedPoints are used.");
			}
			if (oLine.getColor() && oLine.getColor().above && oLine.getColor().below && this._bThresholdNull) {
				Log.info("Property Color of LineMicroChart has no effect if it is composed of colors for above and below when property Threshold is null");
			}
		}, this);


		// set markers for space allocation of labels
		var sLeftTopLabel = this.getLeftTopLabel(), sRightTopLabel = this.getRightTopLabel(),
			sLeftBottomLabel = this.getLeftBottomLabel(), sRightBottomLabel = this.getRightBottomLabel();
		this._bNoBottomLabels = (sRightBottomLabel.length === 0 && sLeftBottomLabel.length === 0);
		this._bNoTopLabels = (sLeftTopLabel.length === 0 && sRightTopLabel.length === 0);
	};

	/**
	 * Normalizes the points based on the scale determined by the min and max values.
	 *
	 * @private
	 */
	LineMicroChart.prototype._normalizePoints = function() {
		// compute min and max chart values
		var iMinXActual = this._minXScale,
			iMaxXActual = this._maxXScale,
			iMinYActual = this._minYScale,
			iMaxYActual = this._maxYScale;

		// determine if set min/max values are smaller/greater than their non-set min/max counterpart and log errors.
		// e.g.: maxXValue = 50 & observed minimal X value = 51
		if (Number.isFinite(Number(this.getMinXValue()))) {
			this._minXScale = this.getMinXValue();
			if (!Number.isFinite(Number(this.getMaxXValue())) && this._minXScale > iMaxXActual) {
				Log.error("Property minXValue of LineMicroChart must be smaller to at least one X value of the points aggregation if property maxXValue is not set");
			}
		}
		if (Number.isFinite(Number(this.getMaxXValue()))) {
			this._maxXScale = this.getMaxXValue();
			if (!Number.isFinite(Number(this.getMinXValue())) && this._maxXScale < iMinXActual) {
				Log.error("Property maxXValue of LineMicroChart must be greater to at least one X value of the points aggregation if property minXValue is not set");
			}
		}
		if (Number.isFinite(Number(this.getMinYValue()))) {
			this._minYScale = this.getMinYValue();
			if (!Number.isFinite(Number(this.getMaxYValue())) && this._minYScale > iMaxYActual) {
				Log.error("Property minYValue of LineMicroChart must be greater to threshold or at least one Y value of the points aggregation if property maxYValue is not set");
			}
		}
		if (Number.isFinite(Number(this.getMaxYValue()))) {
			this._maxYScale = this.getMaxYValue();
			if (!Number.isFinite(Number(this.getMinYValue())) && this._maxYScale < iMinYActual) {
				Log.error("Property maxYValue of LineMicroChart must be smaller to threshold or at least one Y value of the points aggregation if property minYValue is not set");
			}
		}
		// log error if X or Y boundaries overlap.
		if (this.getMaxYValue() < this.getMinYValue()) {
			Log.error("Property maxYValue of LineMicroChart must not be smaller to minYValue");
		}
		if (this.getMaxXValue() < this.getMinXValue()) {
			Log.error("Property maxXValue of LineMicroChart must not be smaller to minXValue");
		}

		var aPoints,
			fXScale = this._maxXScale - this._minXScale,
			fYScale = this._maxYScale - this._minYScale,
			fNormalizedX, fNormalizedY;
		// set flag for valid scaling which influences the rendering of points and lines (used in renderer).
		// no point will be drawn if delta of min and max X/Y is negative
		this._bScalingValid = fXScale >= 0 && fYScale >= 0;
		if (this._bScalingValid) {
			this._getLines().forEach(function(oLine) {
				aPoints = oLine._getPoints();
				oLine._aNormalizedPoints = [];

				for (var i = 0; i < aPoints.length; i++) {
					// normalize Points in relation to scale but draw straight line in the middle of the chart
					if (this._minXScale === this._maxXScale && aPoints[i].getX() === this._maxXScale) {
						fNormalizedX = 50;
					} else {
						fNormalizedX = (((aPoints[i].getX() - this._minXScale) / fXScale) * 100);
					}
					if (this._minYScale === this._maxYScale && aPoints[i].getY() === this._maxYScale) {
						fNormalizedY = 50;
					} else {
						fNormalizedY = (((aPoints[i].getY() - this._minYScale) / fYScale) * 100);
					}
					oLine._aNormalizedPoints.push({ x: fNormalizedX, y: fNormalizedY });
				}
			}, this);

			this._fNormalizedThreshold = ((this.getThreshold() - this._minYScale) / fYScale) * 100;
		}
	};

	/**
	 * Performs size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	LineMicroChart.prototype._onResize = function() {
		var $Control = this.$(),
			iControlWidth = parseInt($Control.width()),
			iControlHeight = parseInt($Control.height()),
			$TopLabels = $Control.find(".sapSuiteLMCLeftTopLabel, .sapSuiteLMCRightTopLabel"),
			$ThresholdLabel = $Control.find(".sapSuiteLMCThresholdLabel");

		$Control.removeClass("sapSuiteLMCNoLabels sapSuiteLMCLookM sapSuiteLMCLookS sapSuiteLMCLookXS");

		// hide all labels if chart width is too small
		if (iControlWidth <= this.convertRemToPixels(LineMicroChart.THRESHOLD_WIDTH_NO_LABEL)) {
			$Control.addClass("sapSuiteLMCNoLabels");
		}

		if (this.getShowTopLabels()) {
			$Control.removeClass("sapSuiteLMCNoTopLabels");
		}

		if (this.getShowBottomLabels()) {
			$Control.removeClass("sapSuiteLMCNoBottomLabels");
		}

		if (iControlHeight < this.convertRemToPixels(LineMicroChart.THRESHOLD_LOOK_S)) {
			$Control.addClass("sapSuiteLMCLookXS");
		} else if (iControlHeight < this.convertRemToPixels(LineMicroChart.THRESHOLD_LOOK_M)) {
			$Control.addClass("sapSuiteLMCLookS");
		} else if (iControlHeight < this.convertRemToPixels(LineMicroChart.THRESHOLD_LOOK_L)) {
			$Control.addClass("sapSuiteLMCLookM");
		}

		if (this.getShowThresholdValue()) {
			$Control.removeClass("sapSuiteLMCNoThresholdLabel");
		}

		if (this._isAnyLabelTruncated($TopLabels)) {
			$Control.addClass("sapSuiteLMCNoTopLabels");
		}

		if (this._isAnyLabelTruncated($ThresholdLabel)) {
			$Control.addClass("sapSuiteLMCNoThresholdLabel");
		}

		this._adjustThresholdLabelPos();
	};

	/**
	 * Adjust threshold label next to threshold line
	 *
	 * @private
	 */
	LineMicroChart.prototype._adjustThresholdLabelPos = function() {
		var $this = this.$();
		var iContainerHeight = $this.find(".sapSuiteLMCThresholdLabelWrapper").height();
		var $label = $this.find(".sapSuiteLMCThresholdLabel");
		var iLabelHeight = $label.outerHeight();
		var fThresholdPosition = (iContainerHeight * (100 - this._fNormalizedThreshold)) * 0.01;
		var fLabelPos = fThresholdPosition - (iLabelHeight / 2);

		if (fLabelPos < 0) {
			fLabelPos = 0;
		} else if (fLabelPos + iLabelHeight > iContainerHeight) {
			fLabelPos = iContainerHeight - iLabelHeight;
		}

		$label.css("top", fLabelPos * 100 / iContainerHeight + "%");
	};

	/**
	 * Creates text for ARIA label and tooltip value.
	 * If tooltip was set to an empty string (using whitespaces) by the application or the tooltip was not set (null/undefined),
	 * the ARIA text gets generated by the control. Otherwise, the given tooltip will also be set as ARIA text.

	 * @param {boolean} bIsActive Whether LineMicroChart is active (with tabindex 0)
	 * @returns {string} The tooltip text
	 * @private
	 */
	LineMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sTooltipText = this._oRb.getText("LINEMICROCHART");

		if (bIsActive) {
			sTooltipText += " " + this._oRb.getText("IS_ACTIVE");
		}

		sTooltipText += "\n";

		if (!this._hasData()) {
			sTooltipText += this._oRb.getText("NO_DATA");
			return sTooltipText;
		}

		var sStartTopLabel = this.getLeftTopLabel();
		var sStartBottomLabel = this.getLeftBottomLabel();
		var sEndTopLabel = this.getRightTopLabel();
		var sEndBottomLabel = this.getRightBottomLabel();
		var bIsFirst = true;

		// add the start labels
		if (sStartTopLabel || sStartBottomLabel) {
			sTooltipText += this._oRb.getText(("LINEMICROCHART_START")) + ": " + sStartBottomLabel + " " + sStartTopLabel;
			bIsFirst = false;
		}
		// add the end labels
		if (sEndTopLabel || sEndBottomLabel) {
			sTooltipText += (bIsFirst ? "" : "\n") + this._oRb.getText(("LINEMICROCHART_END")) + ": " + sEndBottomLabel + " " + sEndTopLabel;
		}

		return sTooltipText;
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	LineMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	LineMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	LineMicroChart.prototype._bindMouseEnterLeaveHandler = function() {
		this.$().on("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().on("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	LineMicroChart.prototype._unbindMouseEnterLeaveHandler = function() {
		this.$().off("mouseenter.tooltip");
		this.$().off("mouseleave.tooltip");
	};

	/**
	 * Deregisters all handlers.
	 *
	 * @private
	 */
	LineMicroChart.prototype._deregisterResizeHandler = function() {
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
			this._sResizeHandlerId = null;
		}
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	LineMicroChart.prototype._hasData = function() {
		return this._getLines().length > 0;
	};

	// to prevent press event in No Data mode
	LineMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(LineMicroChart);

	return LineMicroChart;
});
