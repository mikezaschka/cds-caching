/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/RadialMicroChartRenderer",
	"sap/ui/core/ResizeHandler",
	"sap/base/Log",
	"sap/ui/events/KeyCodes",
	"sap/suite/ui/microchart/MicroChartUtils",
	"./RadialMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"sap/m/library"
], function(library, Control, Renderer, ResizeHandler, Log, KeyCodes, MicroChartUtils, RadialMicroChartRenderer, Core, Theming, mobileLibrary) {
	"use strict";

	const MicroChartColorType = library.MicroChartColorType;
	/** @deprecated since 1.135 */
	const ValueCSSColor = mobileLibrary.ValueCSSColor;
	/**
	 * Describes the configuration of the graphic element on the chart.
	 *
	 * @class
	 * Displays a ring chart highlighting a current status. The status is displayed with a semantically colored radial bar and a percentage value.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.36.0
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.RadialMicroChart
	 */
	var RadialMicroChart = Control.extend("sap.suite.ui.microchart.RadialMicroChart", /** @lends sap.suite.ui.microchart.RadialMicroChart.prototype */ {
		/**
		 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
		 * @param {object} [mSettings] Initial settings for the new control
		 */
		constructor: function(sId, mSettings) {
			var bPercentageMode;
			if (mSettings && typeof mSettings.percentage === "number") {
				bPercentageMode = true;
			} else if (sId && typeof sId.percentage === "number") {
				bPercentageMode = true;
			} else {
				bPercentageMode = false;
			}
			try {
				Control.apply(this, arguments);
				this._bPercentageMode = bPercentageMode;
			} catch (e) {
				this.destroy();
				throw e;
			}
		},

		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The total value. This is taken as 360 degrees value on the chart.
				 */
				total: { group: "Data", type: "float" },

				/**
				 * The fraction of the total value that is displayed.
				 */
				fraction: { group: "Data", type: "float", defaultValue: null },

				/**
				 * The percentage that is displayed.
				 * When a percentage is set, properties total and fraction are not considered.
				 */
				percentage: { group: "Data", type: "float", defaultValue: null },

				/**
				 * The color shown in the completed path. For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value (or type, or property) will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				valueColor: { group: "Appearance", type: "string", defaultValue: MicroChartColorType.Neutral },

				/**
				 *The size of the chart. If it is not set, the Auto size is used.
				 *@since 1.44.0
				 */
				size: { group: "Misc", type: "sap.m.Size", defaultValue: "Auto" },

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 * @since 1.62.0
				 */
				width: {group: "Misc", type: "sap.ui.core.CSSSize"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 * @since 1.62.0
				 */
				height: {group: "Misc", type: "sap.ui.core.CSSSize"},

				/**
				 *The alignment of the content. If it is not set, the <code>Left</code> alignment type is used.
				 *@since 1.62.0
				 */
				alignContent: {group: "Misc", type: "sap.suite.ui.microchart.HorizontalAlignmentType", defaultValue: "Left"},

				/**
				 * If this is set to True, the control will be hidden in 'No data' scenario.
				 * @since 1.84
				 */
				hideOnNoData: { type: "boolean", group: "Appearance", defaultValue: false },

				/**
				 * If set to true, the percentage symbol(%) is displayed.
				 * If set to false, the percentage symbol(%) is not displayed.
				 * @since 1.121.0
				 * @deprecated since 1.123.0
				 * Setting this property does not have any impact on the display of the percentage symbol(%)
				 */
				showPercentageSymbol: {type: "boolean", group: "Appearance", defaultValue: true}
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
			}
		},
		renderer: RadialMicroChartRenderer
	});

	// numbers are in rem units
	RadialMicroChart.THRESHOLD_LOOK_XS = 1.125;
	RadialMicroChart.THRESHOLD_LOOK_S = 3.5;
	RadialMicroChart.THRESHOLD_LOOK_M = 4.5;
	RadialMicroChart.THRESHOLD_LOOK_L = 5.875;
	RadialMicroChart.THRESHOLD_WIDTH_NO_LABEL = 6;

	/* --- Lifecycle Handling --- */

	/**
	 * Init function for the control
	 */
	RadialMicroChart.prototype.init = function() {
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
	RadialMicroChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	RadialMicroChart.prototype.onBeforeRendering = function() {
		if (!this._getPercentageMode()) {
			if (this.getTotal() === 0) {
				Log.info("Total cannot be 0. Please add a valid total value.");
			} else {
				this.setProperty("percentage", Math.round((this.getFraction() * 100 / this.getTotal()) * 10) / 10, true);
			}
		}
		this._unbindMouseEnterLeaveHandler();
	};

	RadialMicroChart.prototype.onAfterRendering = function() {
		this._bindMouseEnterLeaveHandler();
		this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		this._onResize();
	};

	/* --- Event Handling --- */

	RadialMicroChart.prototype.ontouchstart = function(oEvent) {
		// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
		if (this.hasListeners("press") === true){
			// mark the event for components that needs to know if the event was handled by the RadialMicroChart
			oEvent.setMarked();
		}
	};

	RadialMicroChart.prototype.ontap = function(oEvent) {
		// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
		if (this.hasListeners("press") === true){
			// mark the event for components that needs to know if the event was handled by the RadialMicroChart
			oEvent.setMarked();
		}
		this.firePress();
	};

	RadialMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === KeyCodes.SPACE) {
			// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
			if (this.hasListeners("press") === true){
				// mark the event for components that needs to know if the event was handled by the RadialMicroChart
				oEvent.setMarked();
			}
			oEvent.preventDefault();
		}
	};

	RadialMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
			if (this.hasListeners("press") === true){
				// mark the event for components that needs to know if the event was handled by the RadialMicroChart
				oEvent.setMarked();
			}
			this.firePress();
			oEvent.preventDefault();
		}
	};

	RadialMicroChart.prototype.attachEvent = function(eventId, data, functionToCall, listener) {
		Control.prototype.attachEvent.call(this, eventId, data, functionToCall, listener);
		if (eventId === "press") {
			this.invalidate();
		}
		return this;
	};

	RadialMicroChart.prototype.detachEvent = function(eventId, functionToCall, listener) {
		Control.prototype.detachEvent.call(this, eventId, functionToCall, listener);
		if (eventId === "press") {
			this.invalidate();
		}
		return this;
	};

	RadialMicroChart.prototype.exit = function() {
		this._deregisterResizeHandler();
	};

	/* --- Getters and Setters --- */

	/**
	 * Getter for internal property _bPercentageMode.
	 * Percentage mode is configured by setting a percentage value on definition of the control.
	 * If fraction property and total property is used, this _bPercentageMode property is false since percentage gets calculated automatically by the control.
	 *
	 * @private
	 * @returns {boolean} true if chart is in percentage mode, false if not.
	 */
	RadialMicroChart.prototype._getPercentageMode = function() {
		return this._bPercentageMode;
	};

	RadialMicroChart.prototype.setPercentage = function(percentage) {
		if (typeof percentage === "number") {
			var fixedPercentage = Math.floor(percentage * 10) / 10;
			this._bPercentageMode = true;
			if (fixedPercentage !== this.getPercentage()) {
				this.setProperty("percentage", fixedPercentage);
			}
		} else {
			this._bPercentageMode = false;
			this.setProperty("percentage", null);
		}
		return this;
	};

	RadialMicroChart.prototype.setValueColor = function(sValue, bSuppressInvalidate) {
		var bIsValueSet = false;

		if (MicroChartColorType.hasOwnProperty(sValue) ){
			bIsValueSet = true;
		} else {
			/**
			* @deprecated As of version 1.135
			*/
			bIsValueSet = ValueCSSColor.isValid(sValue);
		}

		if ( sValue != null && !bIsValueSet ) {
			throw new Error(`Value ${sValue} is not valid for property "valueColor"`);
		 }

		return this.setProperty("valueColor", bIsValueSet ? sValue : null, bSuppressInvalidate);
	};

	/**
	 * Performs size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._onResize = function() {
		var $Control = this.$(),
			iControlHeight = $Control.height(),
			iControlWidth = $Control.width(),
			$OutsideLabelDiv = $Control.find(".sapSuiteRMCOutsideLabel"),
			$InsideLabelDiv = $Control.find(".sapSuiteRMCInsideLabel"),
			$InnerContainer = $Control.find(".sapSuiteRMCInnerContainer");

		$Control.removeClass("sapSuiteRMCLookL sapSuiteRMCLookM sapSuiteRMCLookS sapSuiteRMCLookXS");
		$OutsideLabelDiv.removeClass("sapSuiteRMCLabelHide");
		$InsideLabelDiv.removeClass("sapSuiteRMCLabelHide");

		$InnerContainer.css("width", $InnerContainer.height());

		if (iControlHeight < this.convertRemToPixels(RadialMicroChart.THRESHOLD_LOOK_S)) {
			$Control.addClass("sapSuiteRMCLookXS");
			$InsideLabelDiv.addClass("sapSuiteRMCLabelHide");
		} else if (iControlHeight < this.convertRemToPixels(RadialMicroChart.THRESHOLD_LOOK_M) || iControlWidth < this.convertRemToPixels(RadialMicroChart.THRESHOLD_LOOK_M)) {
			$Control.addClass("sapSuiteRMCLookS");
			$OutsideLabelDiv.addClass("sapSuiteRMCLabelHide");
		} else if (iControlHeight < this.convertRemToPixels(RadialMicroChart.THRESHOLD_LOOK_L) || iControlWidth < this.convertRemToPixels(RadialMicroChart.THRESHOLD_LOOK_L)) {
			$Control.addClass("sapSuiteRMCLookM");
			$OutsideLabelDiv.addClass("sapSuiteRMCLabelHide");
		} else {
			$Control.addClass("sapSuiteRMCLookL");
			$OutsideLabelDiv.addClass("sapSuiteRMCLabelHide");
		}

		if (this._isAnyLabelTruncated($OutsideLabelDiv)) {
			$OutsideLabelDiv.addClass("sapSuiteRMCLabelHide");
		}

		if (this._isAnyLabelTruncated($InsideLabelDiv)) {
			$InsideLabelDiv.addClass("sapSuiteRMCLabelHide");
		}
	};

	/**
	 * Checks if the valueColor property is a member of sap.m.MicroChartColorType
	 * @returns {boolean} True if the MicroChartColorType property is a member of sap.m.MicroChartColorType, false if otherwise.
	 * @private
	 */
	RadialMicroChart.prototype._isValueColorValid = function() {
		return MicroChartColorType.hasOwnProperty(this.getValueColor());
	};

	/**
	 * Returns value that indicates if the tooltip was configured as empty string (e.g. one whitespace).
	 *
	 * @private
	 * @returns {boolean} value that indicates true, if whitespace was set, false in any other case, also null/undefined
	 */
	RadialMicroChart.prototype._isTooltipSuppressed = function() {
		var sTooltip = this.getTooltip_Text();
		if (sTooltip && sTooltip.trim().length === 0) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Returns the part of the tooltip and ARIA text which is equal.
	 *
	 * @param {boolean} bIsActive Whether LineMicroChart is active (with tabindex 0)
	 *
	 * @private
	 * @returns {string} value containing the tooltip and ARIA text
	 */
	RadialMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sTextValue = this._oRb.getText("RADIALMICROCHART");

		if (bIsActive) {
			sTextValue += " " + this._oRb.getText("IS_ACTIVE");
		}

		sTextValue += "\n";

		if (!this._hasData()) {
			sTextValue += this._oRb.getText("NO_DATA");
			return sTextValue;
		}

		var fPercentage = this.getPercentage();
		if (fPercentage > 100) {
			fPercentage = 100;
		} else if (fPercentage < 0) {
			fPercentage = 0;
		}
		if (this._isValueColorValid()) {
			sTextValue += this._oRb.getText("RADIALMICROCHART_ARIA_LABEL", [ this.getPercentage(), this._getStatusText() ]);
		} else {
			sTextValue += this._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", [fPercentage]);
		}
		return sTextValue;
	};

	/**
	 * Returns the status text based on color value (to be available for other languages also)
	 *
	 * @private
	 * @returns {string} value containing the status text
	 */
	RadialMicroChart.prototype._getStatusText = function() {
		var sValueColor = this.getValueColor();
		switch (sValueColor) {
			case MicroChartColorType['Error']:
				return this._oRb.getText("SEMANTIC_COLOR_ERROR");
			case MicroChartColorType['Critical']:
				return this._oRb.getText("SEMANTIC_COLOR_CRITICAL");
			case MicroChartColorType['Good']:
				return this._oRb.getText("SEMANTIC_COLOR_GOOD");
			case MicroChartColorType['Neutral']:
				return this._oRb.getText("SEMANTIC_COLOR_NEUTRAL");
			case MicroChartColorType['Sequence1']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE1");
			case MicroChartColorType['Sequence2']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE2");
			case MicroChartColorType['Sequence3']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE3");
			case MicroChartColorType['Sequence4']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE4");
			case MicroChartColorType['Sequence5']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE5");
			case MicroChartColorType['Sequence6']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE6");
			case MicroChartColorType['Sequence7']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE7");
			case MicroChartColorType['Sequence8']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE8");
			case MicroChartColorType['Sequence9']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE9");
			case MicroChartColorType['Sequence10']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE10");
			case MicroChartColorType['Sequence11']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE11");
			case MicroChartColorType['Sequence12']:
				return this._oRb.getText("SEMANTIC_COLOR_SEQUENCE12");
			default:
				return "";
		}
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._bindMouseEnterLeaveHandler = function() {
		this.$().on("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().on("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._unbindMouseEnterLeaveHandler = function() {
		this.$().off("mouseenter.tooltip");
		this.$().off("mouseleave.tooltip");
	};

	/**
	 * A simple check to make sure the value is an actually useable number for the chart.
	 *
	 * @private
	 * @param {*} vValue Any value
	 * @returns {boolean} True if the value is a number, false for NaN but also null and +/- Infinity
	 */
	RadialMicroChart.prototype._isActuallyANumber = function(vValue) {
		return !isNaN(vValue) && vValue !== null && (vValue !== "Infinity" && vValue !== "-Infinity");
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	RadialMicroChart.prototype._hasData = function() {
		return this._getPercentageMode() || this._isActuallyANumber(this.getTotal());
	};

	// to prevent press event in No Data mode
	RadialMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	/**
	 * Deregisters all handlers.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._deregisterResizeHandler = function() {
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
			this._sResizeHandlerId = null;
		}
	};

	MicroChartUtils.extendMicroChart(RadialMicroChart);

	return RadialMicroChart;
});
