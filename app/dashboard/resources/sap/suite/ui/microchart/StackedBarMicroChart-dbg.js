/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/ui/core/Control",
	"sap/m/library",
	"sap/m/FlexBox",
	"sap/suite/ui/microchart/MicroChartUtils",
	"sap/ui/core/ResizeHandler",
	"./StackedBarMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"sap/ui/core/Lib",
	"./StackedBarMicroChartBar"
], function(jQuery, library, Control, MobileLibrary, FlexBox, MicroChartUtils, ResizeHandler, StackedBarMicroChartRenderer, Core, Theming, CoreLib, StackedBarMicroChartBar) {
	"use strict";

	var Size = MobileLibrary.Size;
	const MicroChartColorType = library.MicroChartColorType;

	/**
	 * Constructor for a new StackedBarMicroChart control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Illustrates values as stacked and colored bar charts displaying numeric values (as absolute values or percentages) inside the bars.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string. The aggregated data of the microchart can also be customized.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.136.0
	 * @since 1.44.0
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.StackedBarMicroChart
	 */
	var StackedBarMicroChart = Control.extend("sap.suite.ui.microchart.StackedBarMicroChart", /** @lends sap.suite.ui.microchart.StackedBarMicroChart.prototype */ {
		metadata : {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The size of the chart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the stacked bar micro chart is included.
				 */
				size: {type: "sap.m.Size", group: "Appearance", defaultValue: Size.Auto},
				/**
				 * The maximum value can be set to scale StackedBarMicroChartBar values to the same base.
				 * If maxValue is smaller than the sum of all StackedMicroChartBar values, the maxValue is ignored. All values are shown as percentage values (same behavior as maxValue is not used).
				 * If maxValue is equal or bigger than the sum of all StackedMicroChartBars, all values are scaled to the value of maxValue and the percentage mode is turned off. Absolute values are shown instead.
				 * The difference between the sum and maxValue is shown as invisible bar, thus e.g. different StackedBarMicroChart instances can be compared.
				 */
				maxValue: {type: "float", group: "Appearance", defaultValue: null},
				/**
				 * The precision of the rounding for the calculated percentage values of the bars. It defines how many digits after the decimal point are displayed. The default is set to 1 digit.
				 */
				precision: {type: "int", group: "Appearance", defaultValue: 1},
				/**
				 * Defines whether stacked bars with zero value should be rendered. The default is <code>true</code> where these zero value stacked bars are rendered with a minimum width of 0.25rem.
				 * @since 1.76
				 */
				displayZeroValue: {type: "boolean", group: "Appearance", defaultValue: true},
				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * Defines whether the bar labels should be rendered. If set to <code>true</code>, the labels that were specified for each bar become visible.
				 */
				showLabels: {type: "boolean", group: "Misc", defaultValue: true},

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
			defaultAggregation : "bars",
			aggregations: {
				/**
				 * The stacked bar chart items.
				 */
				bars: {type: "sap.suite.ui.microchart.StackedBarMicroChartBar", multiple: true, bindable : "bindable", defaultClass: StackedBarMicroChartBar}
			},
			events: {
				/**
				 * The event is fired when the user chooses the microchart.
				 */
				press : {}
			}
		},
		renderer: StackedBarMicroChartRenderer
	});

	StackedBarMicroChart.THRESHOLD_SMALL_LOOK = 1; // rem
	StackedBarMicroChart.BAR_COLOR_PARAM_DEFAULT = "sapUiChartPaletteQualitativeHue";
	StackedBarMicroChart.BAR_LABEL_CSSCLASS = ".sapSuiteStackedMCBarLabel";
	StackedBarMicroChart.BAR_CSSCLASS = ".sapSuiteStackedMCBar";

	/* =========================================================== */
	/* API events */
	/* =========================================================== */
	StackedBarMicroChart.prototype.attachEvent = function() {
		Control.prototype.attachEvent.apply(this, arguments);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	StackedBarMicroChart.prototype.detachEvent = function() {
		Control.prototype.detachEvent.apply(this, arguments);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	/**
	 * Handler for click button event
	 * @param {jQuery} oEvent The jQuery event object
	 */
	StackedBarMicroChart.prototype.onclick = function(oEvent) {
		if (this.hasListeners("press")) {
			oEvent.stopPropagation();
			this.firePress();
		}
	};

	/**
	 * Handler for space button event
	 */
	StackedBarMicroChart.prototype.onsapspace = StackedBarMicroChart.prototype.onclick;

	/**
	 * Handler for enter button event
	 */
	StackedBarMicroChart.prototype.onsapenter = StackedBarMicroChart.prototype.onclick;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */
	StackedBarMicroChart.prototype.setMaxValue = function(fMaxValue) {
		var bMaxValueValid = Number.isFinite(Number(fMaxValue));
		this.setProperty("maxValue", bMaxValueValid ? fMaxValue : null);
		return this;
	};

	StackedBarMicroChart.prototype.setTooltip = function(tooltip) {
		this._title = null;
		this.setAggregation("tooltip", tooltip, true);
		return this;
	};

	/* =========================================================== */
	/* Protected methods */
	/* =========================================================== */
	StackedBarMicroChart.prototype.init = function() {
		this._oRb = CoreLib.getResourceBundleFor("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "((AltText))", true);
		this._bThemeApplied = false;
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	/**
	 * Handler for the core's init event. In order for the control to be rendered only if all themes are loaded
	 * and everything is properly initialized, we attach a theme check in here.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._handleCoreInitialized = function() {
		// handleThemeApplied has to be called on every theme change as label colors are dependant on current theme and calculated in the renderer
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The StackedBarMicroChart is not being rendered until the theme was applied.
	 * If the theme is applied, rendering starts by the control itself.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
	};

	StackedBarMicroChart.prototype.onBeforeRendering = function() {
		if (this._sChartResizeHandlerId ) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}

		this.$().off("mouseenter");
		this.$().off("mouseleave");
	};

	StackedBarMicroChart.prototype.onAfterRendering = function() {
		library._checkControlIsVisible(this, this._onControlIsVisible);
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._onControlIsVisible = function() {
		this._sChartResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		this._onResize();

		//attaches handler for mouse enter event
		this.$().on("mouseenter", this._addTitleAttribute.bind(this));
		this.$().on("mouseleave", this._removeTitleAttribute.bind(this));
	};

	StackedBarMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	/**
	 * Returns the localized text corresponding to the semantic color
	 *
	 * @private
	 * @param {string} color The semantic color
	 * @returns {string} localized semantic color text
	 */
	StackedBarMicroChart.prototype._getLocalizedColorMeaning = function(color) {
		return this._oRb.getText(("SEMANTIC_COLOR_" + color).toUpperCase());
	};

	/**
	 * Calculates the width in percents of chart bars' elements accordingly with provided chart values.
	 *
	 * @private
	 * @returns {Array} Array of calculated values for each chart bar.
	 */
	StackedBarMicroChart.prototype._calculateChartData = function() {
		var aCalculatedData = [];
		var aData = this.getBars();
		var iItemsCount = aData.length;
		var iCPLength = 12;
		var iCPIndex = 1;
		var iPrecision = this.getPrecision();

		var fnNextColor = function() {
			if (iCPLength) {
				if (iCPIndex === iCPLength) {
					iCPIndex = 1;
				}
				return StackedBarMicroChart.BAR_COLOR_PARAM_DEFAULT + (iCPIndex++);
			}
		};

		// calculates the max width
		var fTotalValue = 0;
		var fMaxValue = this.getMaxValue();
		var i = 0;
		for (i; i < iItemsCount; i++) {
			if (!isNaN(aData[i].getValue())) {
				fTotalValue = fTotalValue + aData[i].getValue();
			}
		}
		var fTotal = Math.max(fMaxValue, fTotalValue);
		var bValidMaxValue = fMaxValue >= fTotalValue;

		// calculates the items percentages
		var fPercTotal = 0;
		var fWidthPercTotal = 0;
		var oItem;
		for (i = 0; i < iItemsCount; i++) {
			oItem = {
				oBarData: aData[i]
			};

			// color
			oItem.color = aData[i].getValueColor();
			if (!oItem.color) {
				oItem.color = fnNextColor();
			}

			// value
			var fItemValue = isNaN(aData[i].getValue()) ? 0 : aData[i].getValue();
			var fValueNotRounded = fTotal === 0 ? 0 : fItemValue * 100 / fTotal;
			oItem.value = this._roundFloat(fValueNotRounded, iPrecision);
			oItem.width = this._roundFloat(fValueNotRounded, 2);
			// increase total
			fPercTotal = fPercTotal + oItem.value;
			fWidthPercTotal = fWidthPercTotal + oItem.width;

			// display value
			if (bValidMaxValue) {
				// absolute value
				oItem.displayValue = aData[i].getDisplayValue() || String(fItemValue);
			} else {
				// percentage value
				oItem.displayValue = aData[i].getDisplayValue() || String(oItem.value + "%");
			}

			aCalculatedData.push(oItem);
		}
		fPercTotal = this._roundFloat(fPercTotal, iPrecision);
		fWidthPercTotal = this._roundFloat(fWidthPercTotal, 2);

		// total > 100% (can make problems by displaying the bars on the same line)
		var oMax;
		if (fWidthPercTotal > 100 && aCalculatedData.length > 0) {
			oMax = aCalculatedData.slice(0).sort(function(a, b) { return b.width - a.width; })[0];
			oMax.width = this._roundFloat(oMax.width - fWidthPercTotal + 100, 2);
		}

		var hasAtLeastOnePositiveWidth = function(aData) {
			return aData.some(
				function(oData) {
					return oData.width > 0;
				}
			);
		};

		// calculates the transparent bar percentage
		if (fMaxValue > fTotalValue) {
			oItem = {
				value: this._roundFloat(100 - fPercTotal, iPrecision),
				width: this._roundFloat(100 - fWidthPercTotal, 2)
			};
			aCalculatedData.push(oItem);
		} else if (aCalculatedData.length > 0 && fWidthPercTotal < 100 &&
			(!this.getDisplayZeroValue() || hasAtLeastOnePositiveWidth(aCalculatedData))
		) {
			// total < 100%: avoiding empty space in case at least one value is not zero
			oMax = aCalculatedData.slice(0).sort(function(a, b) { return b.width - a.width; })[0];
			oMax.width = this._roundFloat(oMax.width - fWidthPercTotal + 100, 2);
		}

		return aCalculatedData;
	};

	/**
	 * Rounds the number to float with the specified precision
	 *
	 * @private
	 * @param {float} fNumber The number to be rounded
	 * @param {int} iPrecision The rounding precision
	 * @returns {float} the rounded object
	 */
	StackedBarMicroChart.prototype._roundFloat = function(fNumber, iPrecision) {
		return parseFloat(fNumber.toFixed(iPrecision));
	};

	/**
	 * Conducts size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._onResize = function() {
		this._resizeVertically();
		this._resizeHorizontally();
	};

	/**
	 * Performs vertical responsiveness adjustment.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._resizeVertically = function() {
		var $this = this.$();
		var iChartHeight = parseFloat($this.height());

		if (iChartHeight <= this.convertRemToPixels(StackedBarMicroChart.THRESHOLD_SMALL_LOOK)) {
			$this.addClass("sapSuiteStackedMCSmallLook");
		} else {
			$this.removeClass("sapSuiteStackedMCSmallLook");
		}
	};

	/**
	 * Performs horizontal responsiveness adjustment.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._resizeHorizontally = function() {
		this._hideTruncatedLabels(StackedBarMicroChart.BAR_LABEL_CSSCLASS);
	};

	/**
	 * Checks if any label of the specified CSS class on the chart is truncated or not matching inside the area;
	 * If yes, do not show the label
	 *
	 * @private
	 * @param {string} classSelector The class selector
	 */
	StackedBarMicroChart.prototype._hideTruncatedLabels = function(classSelector) {
		var $this = this.$();
		var $Labels = $this.find(classSelector);

		$Labels.removeClass("sapSuiteStackedMCBarLabelHidden"); // show all labels to then find out which ones are truncated

		for (var i = 0; i < $Labels.length; i++) {
			if (this._isLabelTruncated($Labels[i])) {
				$this.find($Labels[i]).addClass("sapSuiteStackedMCBarLabelHidden");
			}
		}
	};

	/**
	 * Returns the text for the ARIA label.
	 * If the tooltip is set to an empty string (using whitespaces) by the application, or the tooltip was not set (null/undefined),
	 * the ARIA text is generated by the control. Otherwise, the given tooltip is also set as the ARIA text.
	 *
	 * @param {boolean} bIsActive Whether StackedBarMicroChart is active (with tabindex 0)
	 * @returns {string} chartData The data needed for the chart to be displayed
	 * @private
	 */
	StackedBarMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var aChartData = this._calculateChartData(),
			sTooltipText = this._oRb.getText("STACKEDBARMICROCHART");

		if (bIsActive) {
			sTooltipText += " " + this._oRb.getText("IS_ACTIVE");
		}

		sTooltipText += "\n";

		if (!this._hasData()) {
			sTooltipText += this._oRb.getText("NO_DATA");
			return sTooltipText;
		}

		var oData,
			oBar,
			sBarTooltip,
			bAddNewline = false;

		for (var i = 0; i < aChartData.length; i++) {
			oData = aChartData[i];
			oBar = oData.oBarData;
			sBarTooltip = oBar && oBar.getTooltip_AsString();

			if (library._isTooltipSuppressed(sBarTooltip)) {
				continue;
			}

			if (bAddNewline) {
				sTooltipText += "\n";
			}
			bAddNewline = true;

			if (sBarTooltip) {
				sTooltipText += sBarTooltip;
			} else if (oData.displayValue) {
				sTooltipText += oData.displayValue;
				if (MicroChartColorType.hasOwnProperty(oData.color)) {
					sTooltipText += " " + this._getLocalizedColorMeaning(oData.color);
				}
			}
		}

		return sTooltipText;
	};

	/**
	 * Returns value that indicates if the tooltip was configured as empty string (e.g. one whitespace).
	 *
	 * @private
	 * @returns {boolean} Value that indicates true, if whitespace was set, false in any other case, also null/undefined
	 */
	StackedBarMicroChart.prototype._isTooltipSuppressed = function() {
		var sTooltip = this.getTooltip_AsString();
		return sTooltip && sTooltip.trim().length === 0;
	};

	/**
	 * Adds title attribute to show tooltip when the mouse enters chart.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._addTitleAttribute = function() {
		if (this.$().attr("title")) {
			return;
		}
		if (!this._title && this._hasData()) {
			this._title = this.getTooltip_AsString();
		}
		if (this._title) {
			this.$().attr("title", this._title);
		}
	};

	/**
	 * Removes title attribute to let tooltip disappear when the mouse left the chart.
	 *
	 * @private
	 */
	StackedBarMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this._title = this.$().attr("title");
			this.$().removeAttr("title");
		}
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	StackedBarMicroChart.prototype._hasData = function() {
		return this.getBars().length > 0;
	};

	// to prevent press event in No Data mode
	StackedBarMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(StackedBarMicroChart);

	return StackedBarMicroChart;
});
