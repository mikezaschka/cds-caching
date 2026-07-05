/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Control",
	"sap/ui/Device",
	"sap/ui/events/KeyCodes",
	"sap/suite/ui/microchart/MicroChartUtils",
	"sap/ui/core/ResizeHandler",
	"./HarveyBallMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"./HarveyBallMicroChartItem"
], function (library, Control, Device, KeyCodes, MicroChartUtils, ResizeHandler, HarveyBallMicroChartRenderer, Core, Theming, HarveyBallMicroChartItem) {
	"use strict";

	const MicroChartColorType = library.MicroChartColorType;

	/**
	 * Constructor for a new HarveyBallMicroChart.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * A radial chart that displays a value compared to its total.
	 * <br>Unlike a pie chart, which shows multiple values or sectors, a Harvey Ball microchart shows only one value from a total.
	 * <br>The sector that represents a value being compared to a total is defined by {@link sap.suite.ui.microchart.HarveyBallMicroChartItem}.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string. The aggregated data of the microchart can also be customized.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.HarveyBallMicroChart
	 */
	var HarveyBallMicroChart = Control.extend("sap.suite.ui.microchart.HarveyBallMicroChart", /** @lends sap.suite.ui.microchart.HarveyBallMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {

				/**
				 * The total value. The total value is represented by a full circle, or 360 degrees value on the chart.
				 */
				total: {group: "Misc", type: "float", defaultValue: null},

				/**
				 * The total label. If specified, it is displayed instead of the total value.
				 */
				totalLabel: {group: "Misc", type: "string"},

				/**
				 * The scaling factor that is displayed next to the total value.
				 */
				totalScale: {group: "Misc", type: "string"},

				/**
				 * If set to <code>true</code>, the <code>totalLabel</code> property is used instead of the combination of
				 * the total value and its scaling factor.
				 * <br>The default value is <code>false</code>, which means that the total value, defined by the <code>total</code>
				 * property, and the scaling factor, defined by the <code>totalScale</code> property, are displayed separately.
				 */
				formattedLabel: {group: "Misc", type: "boolean", defaultValue: false},

				/**
				 * If set to <code>true</code>, the total value is displayed next to the chart. The default setting
				 * is <code>true</code>.
				 */
				showTotal: {group: "Misc", type: "boolean", defaultValue: true},

				/**
				 * If set to <code>true</code>, the fraction values are displayed next to the chart. The default setting is
				 * <code>true</code>.
				 */
				showFractions: {group: "Misc", type: "boolean", defaultValue: true},

				/**
				 * The size of the chart. If not set, the default size is applied based on the device type.
				 */
				size: {group: "Misc", type: "sap.m.Size", defaultValue: "Auto"},

				/**
				 * The color palette for the chart. Currently only a single color (first color in the array) is supported.
				 * <br>If this property is defined, the semantic color defined in the {@link sap.suite.ui.microchart.HarveyBallMicroChartItem}
				 * is ignored.
				 */
				colorPalette: {type: "string[]", group: "Appearance", defaultValue: []},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 * @since 1.62.0
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 *The alignment of the content. If not set, the <code>Left</code> alignment type is used.
				 * @since 1.62.0
				 */
				alignContent: {group: "Misc", type: "sap.suite.ui.microchart.HorizontalAlignmentType", defaultValue: "Left"},

				/**
				 * If set to <code>true</code>, the width and height of the control are determined by the width and height
				 * of the parent container, in which case the <code>size</code> and <code>width</code> properties are ignored.
				 * @since 1.38.0
				 * @deprecated as of version 1.62.0, the concept has been discarded.
				 */
				isResponsive: {type: "boolean", group: "Appearance", defaultValue: false},

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
				ariaLabelledBy: {type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy"}
			},
			defaultAggregation: "items",
			aggregations: {
				/**
				 * The set of items. Currently only a single item is supported.
				 */
				items: {
					multiple: true,
					type: "sap.suite.ui.microchart.HarveyBallMicroChartItem",
					bindable: "bindable",
					defaultClass: HarveyBallMicroChartItem
				}
			},
			events: {
				/**
				 * This event is fired when the chart is clicked or tapped.
				 */
				press: {}
			}
		},
		renderer: HarveyBallMicroChartRenderer
	});

	HarveyBallMicroChart.VALUE_TRUNCATION_DIGITS = 5;

	// numbers are in rem units
	HarveyBallMicroChart.THRESHOLD_LOOK_XS = 1.125;
	HarveyBallMicroChart.THRESHOLD_LOOK_S = 3.5;
	HarveyBallMicroChart.THRESHOLD_LOOK_M = 4.5;
	HarveyBallMicroChart.THRESHOLD_LOOK_L = 5.875;

	HarveyBallMicroChart.prototype._getAltHeaderText = function (bIsActive) {
		var sAltText = this._oRb.getText("HARVEYBALLMICROCHART");

		if (bIsActive) {
			sAltText += " " + this._oRb.getText("IS_ACTIVE");
		}


		if (!this._hasData()) {
			sAltText += "\n" + this._oRb.getText("NO_DATA");
			return sAltText;
		}
		return sAltText;
	};

	HarveyBallMicroChart.prototype._getAltSubText = function(bIsFirst) {
		var sAltText = "";

		var aItems = this.getItems();
		aItems.forEach(function(oItem) {
			var sItemColor = oItem.getColor(),
				sItemTooltip = oItem.getTooltip_AsString(),
				sAltItemText = "";

			if (!sItemTooltip) {
				return;
			}

			var sColor = (this.getColorPalette().length === 0 && MicroChartColorType.hasOwnProperty(sItemColor)) ? this._oRb.getText(("SEMANTIC_COLOR_" + sItemColor).toUpperCase()) : "";
			var sLabel = oItem.getFractionLabel();
			var sScale = oItem.getFractionScale();
			if (!sLabel && sScale) {
				sLabel = oItem.getFormattedLabel() ? oItem.getFraction() : oItem.getFraction() + oItem.getFractionScale().substring(0, 3);
			} else if (!oItem.getFormattedLabel() && oItem.getFractionLabel() && sScale) {
				sLabel += oItem.getFractionScale().substring(0, 3);
			}

			sAltItemText += sLabel + " " + sColor;

			sAltItemText = sItemTooltip.split("((AltText))").join(sAltItemText);

			if (sAltItemText) {
				sAltText += "\n" + sAltItemText;
				bIsFirst = false;
			}
		}.bind(this));

		if (this.getTotal()) {
			var sTLabel = this.getTotalLabel();
			if (!sTLabel) {
				if (this.getFormattedLabel() && this.getTotal()) {
					sTLabel = this.getTotal();
				} else if (this.getTotalScale() && this.getTotal()) {
					sTLabel = this.getTotal() + this.getTotalScale().substring(0, 3);
				}
			} else if (!this.getFormattedLabel() && this.getTotalScale()) {
				sTLabel += this.getTotalScale().substring(0, 3);
			}
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText("HARVEYBALLMICROCHART_TOTAL_TOOLTIP") + " " + sTLabel;
		}
		return sAltText;
	};

	/**
	 * Overrides the getTooltip_AsString function from {@link sap.ui.core.Element}
	 * @param {boolean} bIsActive True if the chart is active, false if not.
	 * @returns {object|string} tooltip text as string.
	 * @private
	 */
	HarveyBallMicroChart.prototype.getTooltip_AsString = function(bIsActive) { //eslint-disable-line
		var sTooltip = Control.prototype.getTooltip_AsString.apply(this, arguments),
			sTooltipHeader = this._getAltHeaderText(bIsActive),
			bIsFirst = false;

		if (sTooltip) {
			sTooltipHeader = sTooltip.split("((AltText))").join(sTooltipHeader);
		}

		if (!sTooltip || !sTooltipHeader) {
			sTooltipHeader = "";
			bIsFirst = true;
		}

		sTooltipHeader += this._getAltSubText(bIsFirst);

		return sTooltipHeader;
	};

	HarveyBallMicroChart.prototype.init = function () {
		this._oRb = Core.getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "((AltText))", true);
		Device.media.attachHandler(this.invalidate, this, Device.media.RANGESETS.SAP_STANDARD);
		this._sChartResizeHandlerId = null;
		this._bThemeApplied = false;
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	HarveyBallMicroChart.prototype.setSize = function (size) {
		if (this.getSize() !== size) {
			this.setProperty("size", size, false);
		}
		return this;
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._handleCoreInitialized = function () {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._handleThemeApplied = function () {
		this._bThemeApplied = true;
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	HarveyBallMicroChart.prototype.onBeforeRendering = function () {
		if (this._sChartResizeHandlerId) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}
		this._unbindMouseEnterLeaveHandler();
	};

	HarveyBallMicroChart.prototype.onAfterRendering = function () {
		library._checkControlIsVisible(this, this._onControlIsVisible);
		this._bindMouseEnterLeaveHandler();
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._onControlIsVisible = function () {
		this._onResize();
		this._sChartResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
	};

	/**
	 * Conducts size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._onResize = function() {
		var $Control = this.$(),
			fControlHeight = $Control.height(),
			$PieContainer = $Control.find(".sapSuiteHBMCChart").first(),
			$TextContainer = $Control.find(".sapSuiteHBMCTextContainer").first(),
			fControlWidth,
			fPieAndTextWidth;

		$Control.removeClass("sapSuiteHBMCLookL sapSuiteHBMCLookM sapSuiteHBMCLookS sapSuiteHBMCLookXS");
		$TextContainer.removeClass("sapSuiteHBMCTextContainerHide");

		// flex+svg was not a good match for IE, this fixes width and keeps aspect ratio
		$PieContainer.css("width", $PieContainer.css("height"));

		var oSvg = $Control.find(".sapSuiteHBMCChartSvg")[0];
		if (oSvg) {
			oSvg.setAttribute("viewBox", "0 0 72 72");
		}

		if (fControlHeight < this.convertRemToPixels(HarveyBallMicroChart.THRESHOLD_LOOK_S)) {
			$Control.addClass("sapSuiteHBMCLookXS");
			// Change viewBox size of svg because small chart has different svg design
			if (oSvg) {
				oSvg.setAttribute("viewBox", "5 5 62 62");
			}
		} else if (fControlHeight < this.convertRemToPixels(HarveyBallMicroChart.THRESHOLD_LOOK_M)) {
			$Control.addClass("sapSuiteHBMCLookS");
		} else if (fControlHeight < this.convertRemToPixels(HarveyBallMicroChart.THRESHOLD_LOOK_L)) {
			$Control.addClass("sapSuiteHBMCLookM");
		} else {
			$Control.addClass("sapSuiteHBMCLookL");
		}

		fControlWidth = $Control.width();
		fPieAndTextWidth = $PieContainer.width() + $TextContainer.outerWidth();
		if (fControlWidth < fPieAndTextWidth) {
			$TextContainer.addClass("sapSuiteHBMCTextContainerHide");
		}
	};

	HarveyBallMicroChart.prototype._parseFormattedValue = function (sValue) {
		return {
			scale: sValue.replace(/.*?([^+-.,\d]*)$/g, "$1").trim(),
			value: sValue.replace(/(.*?)[^+-.,\d]*$/g, "$1").trim()
		};
	};

	HarveyBallMicroChart.prototype.ontap = function (oEvent) {
		// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
		if (this.hasListeners("press") === true) {
			// mark the event for components that needs to know if the event was handled.
			oEvent.setMarked();
			oEvent.stopPropagation();
		}
		this.firePress();
	};

	HarveyBallMicroChart.prototype.onkeydown = function (oEvent) {
		if (oEvent.which == KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	HarveyBallMicroChart.prototype.onkeyup = function (oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	HarveyBallMicroChart.prototype.attachEvent = function (sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	HarveyBallMicroChart.prototype.detachEvent = function (sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	HarveyBallMicroChart.prototype.exit = function (oEvent) {
		Device.media.detachHandler(this.invalidate, this, Device.media.RANGESETS.SAP_STANDARD);
		ResizeHandler.deregister(this._sChartResizeHandlerId);
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._addTitleAttribute = function () {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._removeTitleAttribute = function () {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._bindMouseEnterLeaveHandler = function () {
		this.$().on("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().on("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	HarveyBallMicroChart.prototype._unbindMouseEnterLeaveHandler = function () {
		this.$().off("mouseenter.tooltip");
		this.$().off("mouseleave.tooltip");
	};

	/**
	 * Truncates the given string to the given number of digits.
	 * If the given string ends on a decimal separator, be it a period or a comma, this character is also removed.
	 *
	 * @param {string} value The value string to be truncated.
	 * @param {int} digits The number of digits the number is to be truncated to.
	 * @returns {string} The truncated text
	 * @static
	 * @private
	 */
	HarveyBallMicroChart._truncateValue = function (value, digits) {
		// skipping scale value while truncating
		var sTrimmedValue = value.replace(String.fromCharCode(8206), "").replace(String.fromCharCode(8207), "");
		var sScale = sTrimmedValue.replace(/[+-., \d]*(.*)$/g, "$1").trim().replace(/\.$/, "");
		value = sTrimmedValue.replace(/([+-., \d]*).*$/g, "$1").trim();
		var bHasDecimalSeparator = value[digits - 1] === "." || value[digits - 1] === ",";
		if (value.length >= digits && bHasDecimalSeparator) {
			return value.substring(0, digits - 1) + sScale;
		} else {
			return value.substring(0, digits) + sScale;
		}
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	HarveyBallMicroChart.prototype._hasData = function () {
		return this.getItems().length > 0;
	};

	// to prevent press event in No Data mode
	HarveyBallMicroChart.prototype.firePress = function () {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(HarveyBallMicroChart);

	return HarveyBallMicroChart;
});
