/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/ui/core/Control",
	"sap/ui/Device",
	"sap/m/FlexBox",
	"sap/suite/ui/microchart/MicroChartUtils",
	"sap/m/library",
	"sap/ui/core/ResizeHandler",
	"./ComparisonMicroChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"./ComparisonMicroChartData",
	"sap/m/Menu",
	"sap/m/MenuItem",
    "sap/ui/core/Lib",
	"sap/base/i18n/Localization"
], function(jQuery, library, Control, Device, FlexBox, MicroChartUtils, mobileLibrary, ResizeHandler, ComparisonMicroChartRenderer, Core, Theming, ComparisonMicroChartData,Menu,MenuItem,CoreLib,Localization) {
	"use strict";

	const MicroChartColorType = library.MicroChartColorType;
	var ComparisonMicroChartViewType = library.ComparisonMicroChartViewType;
	// shortcut for sap.m.Size
	var Size = mobileLibrary.Size;
	var EAST_ASIA_CHARS = ['zh','zh-hk','zh-cn','zh-sg','zh-sw'];

	/**
	 * Constructor for a new ComparisonMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Illustrates values as colored bar charts with title, numeric value, and scaling factor in the content area. This control replaces the deprecated sap.suite.ui.commons.ComparisonChart.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string. The aggregated data of the microchart can also be customized.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.ComparisonMicroChart
	 */
	var ComparisonMicroChart = Control.extend("sap.suite.ui.microchart.ComparisonMicroChart", /** @lends sap.suite.ui.microchart.ComparisonMicroChart.prototype */ {
		metadata : {

			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the bullet micro chart is included.
				 */
				size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"},

				/**
				 * The scaling suffix that is added to the actual and target values.
				 */
				scale: {type: "string", group: "Misc", defaultValue: ""},

				/**
				 * The minimum scale value for the chart used to define the value range of the scale for comparing different values.
				 * @since 1.42.0
				 */
				minValue: {type: "float", group: "Appearance", defaultValue: null},

				/**
				 * The maximum scale value for the chart used to define the value range of the scale for comparing different values.
				 * @since 1.42.0
				 */
				maxValue: {type: "float", group: "Appearance", defaultValue: null},

				/**
				 * The view of the chart. If not set, the Normal view is used by default.
				 */
				view: {type: "sap.suite.ui.microchart.ComparisonMicroChartViewType", group: "Appearance", defaultValue: "Normal"},

				/**
				 * The color palette for the chart. If this property is set, semantic colors defined in ComparisonData are ignored. Colors from the palette are assigned to each bar consequentially. When all the palette colors are used, assignment of the colors begins from the first palette color.
				 */
				colorPalette: {type: "string[]", group: "Appearance", defaultValue: []},

				/**
				 * If it is set to true, the height of the control is defined by its content.
				 */
				shrinkable: {type: "boolean", group: "Misc", defaultValue: false},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Appearance"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Appearance"},

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size and Width properties are ignored in such case.
				 * @since 1.38.0
				 *
				 * @deprecated as of version 1.58, the concept has been discarded.
				 * */
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
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			defaultAggregation : "data",
			aggregations: {
				/**
				 * The comparison chart bar data.
				 */
				data: {type: "sap.suite.ui.microchart.ComparisonMicroChartData", multiple: true, bindable : "bindable", defaultClass: ComparisonMicroChartData}
			},
			events: {
				/**
				 * The event is triggered when the chart is pressed.
				 */
				press : {}
			}
		},
		renderer: ComparisonMicroChartRenderer
	});

	// numbers are in rem units
	ComparisonMicroChart.THRESHOLD_LOOK_XS = 6;
	ComparisonMicroChart.THRESHOLD_LOOK_S = 8.25;
	ComparisonMicroChart.THRESHOLD_LOOK_M = 10.5;
	ComparisonMicroChart.THRESHOLD_LOOK_L = 12;

	/* =========================================================== */
	/* API events */
	/* =========================================================== */

	ComparisonMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	ComparisonMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	ComparisonMicroChart.prototype.onclick = function(oEvent) {
		if (!this.fireBarPress(oEvent)) {
			setTimeout(() => {
				var oMenu = this._oMenu;
				if (!oMenu.isOpen()) {
					this.firePress();
				}
			},0);
		}
	};

	ComparisonMicroChart.prototype.oncontextmenu = function(oEvent) {
		this._openMenu();
		oEvent.preventDefault();
		return false;
	};

	ComparisonMicroChart.prototype.fireBarPress = function(oEvent) {
		var oBar = oEvent.target;
		var iIndex = this._getBarIndex(oBar);
		var bIsLarge = this._getSize() === Size.L || this._getSize() === Size.M;
		var bIsIndexAttributePresent = !!oBar.getAttribute("data-bar-index");
		var bIsChartDataPressed = false;
		//If the chart size is L or M, the user can click any part of the child data, and we check if the index is greater than or equal to 0
		//If the chart size is S or XS, the user must click only on the bar. All the bars have the "data-bar-index" that makes it easy to check where the user has clicked
		if (bIsLarge) {
			bIsChartDataPressed = (iIndex >= 0) ? true : false;
		}
		if (bIsChartDataPressed || (!bIsLarge && bIsIndexAttributePresent)) {
			var oComparisonData = this.getData()[iIndex];
			if (oComparisonData && oComparisonData.hasListeners("press")) {
				// find out which bar has tabindex = 0 at this moment
				var $Bars = this.$().find(".sapSuiteUiMicroChartBarPointer");
				var iBarFocusedIndex = $Bars.index(this.$().find(".sapSuiteUiMicroChartBarPointer[tabindex='0']"));
				this._switchTabindex(iBarFocusedIndex, iIndex, $Bars);
				return true;
			}
		}
		return false;
	};

	ComparisonMicroChart.prototype.onsaptabprevious = function() {
		this.$().css("outline-color", "");
	};

	ComparisonMicroChart.prototype.onsaptabnext = function() {
		var $Next = this.$().next();
		// when the next element is a focusable comparison chart, activate the outline
		if ($Next.hasClass("sapSuiteCpMC") && $Next.attr("tabindex")) {
			$Next.css("outline-color", "");
		}
	};

	ComparisonMicroChart.prototype.onsapenter = function(event) {
		if (!this.fireBarPress(event)) {
			this.firePress();
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};

	ComparisonMicroChart.prototype.onsapspace = ComparisonMicroChart.prototype.onsapenter;

	ComparisonMicroChart.prototype.onsapup = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartBarPointer");
		if ($Bars.length > 0) {
			var iIndex = $Bars.index(event.target);
			this._switchTabindex(iIndex, iIndex - 1, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsapdown = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartBarPointer");
		if ($Bars.length > 0) {
			var iIndex = $Bars.index(event.target);
			this._switchTabindex(iIndex, iIndex + 1, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsaphome = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartBarPointer");
		var iIndex = $Bars.index(event.target);
		if (iIndex !== 0 && $Bars.length > 0) {
			this._switchTabindex(iIndex, 0, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsapend = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartBarPointer");
		var iIndex = $Bars.index(event.target),
			iLength = $Bars.length;
		if (iIndex !== iLength - 1 && iLength > 0) {
			this._switchTabindex(iIndex, iLength - 1, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsapleft = ComparisonMicroChart.prototype.onsapup;

	ComparisonMicroChart.prototype.onsapright = ComparisonMicroChart.prototype.onsapdown;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	ComparisonMicroChart.prototype.setMinValue = function(fMinValue) {
		this._isMinValueSet = Number.isFinite(Number(fMinValue));
		return this.setProperty("minValue", this._isMinValueSet ? fMinValue : NaN);
	};

	ComparisonMicroChart.prototype.setMaxValue = function(fMaxValue) {
		this._isMaxValueSet = Number.isFinite(Number(fMaxValue));
		return this.setProperty("maxValue", this._isMaxValueSet ? fMaxValue : NaN);
	};

	ComparisonMicroChart.prototype.setSize = function(size) {
		if (this.getSize() !== size) {
			this.setProperty("size", size, false);
		}
		return this;
	};

	/* =========================================================== */
	/* Protected methods */
	/* =========================================================== */

	ComparisonMicroChart.prototype.init = function() {
		this._oRb = CoreLib.getResourceBundleFor("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "((AltText))", true);
		this._isMinValueSet = false;
		this._isMaxValueSet = false;
		this._bThemeApplied = false;
		this._oMenu = new Menu(this.getId() + "-detailView");
		this.addDependent(this._oMenu);
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all
	 * themes are loaded and everything is properly initialized. We attach a theme
	 * check here.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If the theme is applied, rendering starts by the control itself.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The function returns the index of the bar that is inside the chart
	 * @param {HTMLElement} [oBar] The DOM reference of the bar
	 * @returns {Number} Index of the bar
	 * @private
	 */
	ComparisonMicroChart.prototype._getBarIndex = function(oBar) {
		var aData = this.getData();
		for (var i = 0; i < aData.length; i++) {
			if (aData[i].getDomRef().contains(oBar)) {
				return i;
			}
		}
		return -1;
	};

	ComparisonMicroChart.prototype.onBeforeRendering = function() {
		if (this._sChartResizeHandlerId ) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}
		//removes handler for mouseenter event
		this._unbindMouseEnterLeaveHandler();
	};

	ComparisonMicroChart.prototype.onAfterRendering = function() {
		library._checkControlIsVisible(this, this._onControlIsVisible);

		//attaches handler for mouseenter event
		this._bindMouseEnterLeaveHandler();

		var sCurrentLanguage = Localization.getLanguageTag().language;
		var bIsEastAsiaCharPresent = EAST_ASIA_CHARS.includes(sCurrentLanguage.toLowerCase());
		this.toggleStyleClass("sapCMCEastCharsPresent",bIsEastAsiaCharPresent);
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._onControlIsVisible = function() {
		this._onResize();
		this._sChartResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
	};

	ComparisonMicroChart.prototype.setBarPressable = function(iBarIndex, bPressable) {
		if (bPressable) {
			var sBarAltText = this._getBarAltText(iBarIndex);
			this.$("chart-item-bar-" + iBarIndex).addClass("sapSuiteUiMicroChartPointer").attr("tabindex", 0).attr("title", sBarAltText).attr("role", "presentation").attr("aria-label", sBarAltText);
		} else {
			this.$("chart-item-bar-" + iBarIndex).removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer").removeAttr("title").removeAttr("role").removeAttr("aria-label");
		}
	};

	ComparisonMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sAltText = this._oRb.getText("COMPARISONMICROCHART");

		if (bIsActive) {
			sAltText += " " + this._oRb.getText("IS_ACTIVE");
		}

		if (!this._hasData()) {
			sAltText += "\n" + this._oRb.getText("NO_DATA");
			return sAltText;
		}
		return sAltText;
	};

	ComparisonMicroChart.prototype._getAltSubText = function(bIsFirst) {
		var sAltText = "";

		for (var i = 0; i < this.getData().length; i++) {
			var oBar = this.getData()[i],
				sBarText = this._getBarAltText(i),
				sBarTooltip = oBar.getTooltip_AsString(),
				sAltBarText = "";

			if (!sBarTooltip) {
				continue;
			}

			sAltBarText = sBarTooltip.split("((AltText))").join(sBarText);

			if (sAltBarText) {
				sAltText += (bIsFirst ? "" : "\n") + sAltBarText;
				bIsFirst = false;
			}
		}

		return sAltText;
	};

	ComparisonMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	/**
	 * Calculates the width in percent of the chart bar elements accordingly with provided chart values.
	 *
	 * @returns {Array} array of calculated values for each chart bar.
	 * @private
	 */
	ComparisonMicroChart.prototype._calculateChartData = function() {
		var aResult = [];
		var aData = this.getData();
		var iCount = aData.length;
		var iMaxValue = 0;
		var iMinValue = 0;
		var iTotal;
		var iMaxPercent;
		var iMinPercent;
		var i;

		for (i = 0; i < iCount; i++) {
			var iDataValue = isNaN(aData[i].getValue()) ? 0 : aData[i].getValue();
			iMaxValue = Math.max(iMaxValue, iDataValue);
			iMinValue = Math.min(iMinValue, iDataValue);
		}
		if (this._isMinValueSet) {
			iMinValue = Math.min(iMinValue, this.getMinValue());
		}
		if (this._isMaxValueSet) {
			iMaxValue = Math.max(iMaxValue, this.getMaxValue());
		}

		iTotal = iMaxValue - iMinValue;
		iMaxPercent = (iTotal == 0) ? 0 : Math.round(iMaxValue * 100 / iTotal);

		if (iMaxPercent == 0 && iMaxValue != 0) {
			iMaxPercent = 1;
		} else if (iMaxPercent == 100 && iMinValue != 0) {
			iMaxPercent = 99;
		}

		iMinPercent = 100 - iMaxPercent;

		for (i = 0; i < iCount; i++) {
			var oItem = {};
			var iDataVal = isNaN(aData[i].getValue()) ? 0 : aData[i].getValue();

			oItem.value = (iTotal == 0) ? 0 : Math.round(iDataVal * 100 / iTotal);

			if (oItem.value == 0 && iDataVal != 0) {
				oItem.value = (iDataVal > 0) ? 1 : -1;
			} else if (oItem.value == 100) {
				oItem.value = iMaxPercent;
			} else if (oItem.value == -100) {
				oItem.value = -iMinPercent;
			}

			if (oItem.value >= 0) {
				oItem.negativeNoValue = iMinPercent;
				oItem.positiveNoValue = iMaxPercent - oItem.value;
			} else {
				oItem.value = -oItem.value;
				oItem.negativeNoValue = iMinPercent - oItem.value;
				oItem.positiveNoValue = iMaxPercent;
			}

			aResult.push(oItem);
		}

		return aResult;
	};

	ComparisonMicroChart.prototype._getLocalizedColorMeaning = function(sColor) {
		return MicroChartColorType.hasOwnProperty(sColor) && sColor != 'None' ? this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase()) : "";
	};

	ComparisonMicroChart.prototype._getBarAltText = function(iBarIndex) {
		var oBar = this.getData()[iBarIndex],
			sBarTooltip = Control.prototype.getTooltip_AsString.apply(oBar, arguments),
			sMeaning = this.getColorPalette().length ? "" : this._getLocalizedColorMeaning(oBar.getColor()),
			sBarAltText = oBar.getTitle() + " " + (oBar.getDisplayValue() ? oBar.getDisplayValue() : oBar.getValue()) + this.getScale() + " " + sMeaning;

		if (!sBarTooltip) {
			return "";
		}

		return sBarTooltip.split("((AltText))").join(sBarAltText);
	};

	/**
	 * Conducts size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._onResize = function() {
		this.$().find(".sapSuiteCpMCChartItem").show();
		this._resizeHorizontally();
		this._resizeVertically();
	};

	/**
	 * Performs vertical responsiveness adjustment. Assumes that the height of the control will not change afterwards. Assumes that all the CSS have already been loaded and are available.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._resizeVertically = function() {
		var fItemHeight,
			fItemMargin,
			fBarHeight,
			fContainerHeight,
			fSum,
			iCurrentWidth,
			iBaseWidth,
			fRatio,
			fDiff,
			aData = this.getData(),
			$this = this.$(),
			$lastVisibleItem,
			$items = $this.find(".sapSuiteCpMCChartItem"),
			$bars = $this.find(".sapSuiteCpMCChartBar");

		// reset height and margin to default values from CSS files
		$items.css("margin-bottom", "");
		$items.css("height", "");
		$bars.css("height", "");

		// Somehow this function can be called even though the controll is rendered as "No data".
		// Seems like this function is called from onAfterRendering in a moment that no data has been added yet
		// but in the mean time the data has already been added but only now the function is called.
		// aData[0].getDomRef() condition should prevent any errors
		if (aData.length > 0 && aData[0].getDomRef()) {
			fItemHeight = aData[0].getDomRef().getBoundingClientRect().height;
			fItemMargin = parseFloat(aData[0].$().css("margin-bottom"));
			fBarHeight =  $bars.height();
			iCurrentWidth = $this.width();

			iBaseWidth = this._getCurrentBaseWidth();

			// calculate size of heights based on current width proportionally
			// cannot be done in CSS as the height of items is dependent on width of the chart
			if (iBaseWidth > 0) {
				fRatio = iBaseWidth / fItemHeight;
				fItemHeight = iCurrentWidth / fRatio;
				$items.css("height", fItemHeight);

				fRatio = iBaseWidth / fItemMargin;
				fItemMargin = iCurrentWidth / fRatio;
				$items.css("margin-bottom", fItemMargin);

				fRatio = iBaseWidth / fBarHeight;
				$bars.css("height", iCurrentWidth / fRatio);
			}

			// hide items that would not be fully visible
			// but we don't want to hide items, just because there is not space for margin
			fContainerHeight = $this.find(".sapSuiteCpMCVerticalAlignmentContainer")[0].getBoundingClientRect().height;
			fSum = 0;
			for (var i = 0; i < aData.length; i++) {
				fSum += fItemHeight;

				if (Math.floor(fSum) > Math.floor(fContainerHeight)) {
					aData[i].$().hide();
				}

				fSum += fItemMargin;
			}

			// size of the last margin can shrink so that the items in flex are correctly centered
			$lastVisibleItem = this.$().find(".sapSuiteCpMCVerticalAlignmentContainer .sapSuiteCpMCChartItem:visible:last");
			if ($lastVisibleItem.length === 1 && !this.getShrinkable()) {
				$lastVisibleItem.css("margin-bottom", "");
				fDiff = this.getDomRef().getBoundingClientRect().bottom - $lastVisibleItem[0].getBoundingClientRect().bottom;

				if (fDiff < fItemMargin) {
					$lastVisibleItem.css("margin-bottom", fDiff < 0 ? 0 : fDiff);
				}
			}
		}
	};

	/**
	 * Performs horizontal responsiveness adjustment. Assumes that the width of the control will not change afterwards. Assumes that all the CSS have already been loaded and are available.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._resizeHorizontally = function() {
		var $this = this.$();
		var fMaxTitleWidth = 0;
		var fMaxValueWidth = 0;
		var $titles = this.$().find(".sapSuiteCpMCChartItemTitle");
		var $values = this.$().find(".sapSuiteCpMCChartItemValue");
		var oBoundingRect;
		var sLookClass;

		// ensure the correct look class
		$this.removeClass("sapSuiteCpMCLookL sapSuiteCpMCLookM sapSuiteCpMCLookS sapSuiteCpMCLookXS sapSuiteCpMCLookWide");

		sLookClass = this._getCurrentLookClass();
		$this.addClass(sLookClass);


		if (!$this.hasClass("sapSuiteCpMCLookXS")) {
			this._hideTruncatedLabels(".sapSuiteCpMCChartItemValue");
		}

		$titles.width("auto");
		$values.width("auto");
		// in Wide mode, after truncatd labels has been hidden
		// we have to find and apply the widest title and value to all chart items, to center the bars the same way
		if ($this.hasClass("sapSuiteCpMCLookWide")) {
			$titles.each(function() {
				oBoundingRect = this.getBoundingClientRect();
				if (oBoundingRect.width > fMaxTitleWidth) {
					fMaxTitleWidth = Math.ceil(oBoundingRect.width);
				}
			});
			$titles.width(fMaxTitleWidth);

			$values.each(function() {
				oBoundingRect = this.getBoundingClientRect();
				if (oBoundingRect.width > fMaxValueWidth) {
					fMaxValueWidth = Math.ceil(oBoundingRect.width);
				}
			});
			$values.width(fMaxValueWidth);
		}
	};

	ComparisonMicroChart.prototype._getCurrentBaseWidth = function() {
		var $this = this.$();
		var iWidth = parseInt($this.width());
		var iBaseWidth;

		if (this.getView() === ComparisonMicroChartViewType.Wide ||
			iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_L) || this.getSize() !== Size.Responsive) {
			iBaseWidth = 0;
		} else if (iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_M)) {
			iBaseWidth = this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_L);
		} else if (iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_S)) {
			iBaseWidth = this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_M);
		} else if (iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_XS)) {
			iBaseWidth = this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_S);
		} else {
			iBaseWidth = 0;
		}

		return iBaseWidth;
	};

	/**
	 * Returns what look should the chart have.
	 * Wide look is prioritized if it is set
	 * In responsive mode, it is chosen based on current width
	 * If other size is used, then its look is used as well.
	 *
	 * @return {string} class for current look
	 * @private
	 */
	ComparisonMicroChart.prototype._getCurrentLookClass = function () {
		var $this = this.$();
		var iWidth = parseInt($this.width());
		var sLook;

		if (this._shouldUseWideView()) {
			sLook = "sapSuiteCpMCLookWide";
		} else if (this.getSize() !== Size.Responsive) {
			sLook = "sapSuiteCpMCLook" + this._getSize();
		} else if (iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_M)) {
			sLook = "sapSuiteCpMCLookL";
		} else if (iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_S)) {
			sLook = "sapSuiteCpMCLookM";
		} else if (iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_XS)) {
			sLook = "sapSuiteCpMCLookS";
		} else {
			sLook = "sapSuiteCpMCLookXS";
		}

		return sLook;
	};

	ComparisonMicroChart.prototype._getSize = function() {
		var sSize = this.getSize();

		if (sSize === Size.Auto) {
			if (Device.system.phone) {
				sSize = Size.S;
			} else {
				sSize = Size.M;
			}
		}

		return sSize;
	};

	ComparisonMicroChart.prototype._shouldUseWideView = function() {
		var iWidth = parseInt(this.$().width());

		return this.getView() === ComparisonMicroChartViewType.Wide ||
			(this.getView() === ComparisonMicroChartViewType.Responsive && iWidth > this.convertRemToPixels(ComparisonMicroChart.THRESHOLD_LOOK_L));
	};

	/**
	 * Checks if any label of the specified CSS class on the chart is truncated or not matching inside the area;
	 * If yes, do not show the label
	 *
	 * @private
	 * @param {string} classSelector The class selector
	 */
	ComparisonMicroChart.prototype._hideTruncatedLabels = function(classSelector) {
		var $this = this.$();
		var $Labels = $this.find(classSelector);

		for (var i = 0; i < $Labels.length; i++) {
			jQuery($Labels[i]).removeClass("sapSuiteCpMCChartItemHiddenLabel");
			if (this._isLabelTruncated($Labels[i])) {
				jQuery($Labels[i]).addClass("sapSuiteCpMCChartItemHiddenLabel");
			}
		}
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._addTitleAttribute = function() {
		var sTooltip = this.getTooltip_AsString();
		if (!library._isTooltipSuppressed(sTooltip) && this._hasData()) {
			if (this._isResponsive()){
				this.$().find(".sapSuiteCpMCVerticalAlignmentContainer").attr("title", sTooltip);
			} else {
				this.$().attr("title", sTooltip);
			}
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._removeTitleAttribute = function() {
		if (this._isResponsive()){
			this.$().find(".sapSuiteCpMCVerticalAlignmentContainer").removeAttr("title");
		} else {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Resolves the chart focus in case a chart bar is activated/released.
	 * @param {jQuery.Event} oEvent The jQuery event object.
	 * @private
	 */
	ComparisonMicroChart.prototype._resolveFocus = function(oEvent) {
		var oBar = jQuery(oEvent.target);
		if (oBar && oBar.attr("data-bar-index")) {
			var iIndex = parseInt(oBar.attr("data-bar-index"));
			var oData = this.getData()[iIndex];
			if (oData && oData.hasListeners("press")) {
				this.$().css("outline-color", "transparent");
			} else {
				this.$().css("outline-color", "");
			}
		} else {
			this.$().css("outline-color", "");
		}
	};

	/**
	 * Adds and removes the tabindex between elements to support keyboard navigation.
	 *
	 * @param {int} oldIndex The index of the previously focused bar
	 * @param {int} newIndex The index of the bar that is to be focused
	 * @param {jQuery} bars All valid clickable bars inside the chart
	 * @private
	 */
	ComparisonMicroChart.prototype._switchTabindex = function(oldIndex, newIndex, bars) {
		if (oldIndex >= 0 && oldIndex < bars.length && newIndex >= 0 && newIndex < bars.length) {
			bars.eq(oldIndex).removeAttr("tabindex");
			bars.eq(newIndex).attr("tabindex", "0").trigger("focus");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._bindMouseEnterLeaveHandler = function () {

		// handlers need to be saved intermediately in order to unbind successfully
		if (!this._oMouseEnterLeaveHandler) {
			this._oMouseEnterLeaveHandler = {
				mouseEnterChart: this._addTitleAttribute.bind(this),
				mouseLeaveChart: this._removeTitleAttribute.bind(this),
				mouseDownChart: this._resolveFocus.bind(this)
			};
		}
		// bind events on chart
		this.$().on("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
		this.$().on("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
		this.$().on("mousedown", this._oMouseEnterLeaveHandler.mouseDownChart);
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._unbindMouseEnterLeaveHandler = function () {
		if (this._oMouseEnterLeaveHandler) {
			this.$().off("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
			this.$().off("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
			this.$().off("mousedown", this._oMouseEnterLeaveHandler.mouseDownChart);
		}
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	ComparisonMicroChart.prototype._hasData = function() {
		return this.getData().length > 0;
	};
	/**
	 * It opens the menu popup
	 * @private
	 */
	ComparisonMicroChart.prototype._openMenu = function() {
		if (this._isDataChanged()) {
			this._oMenu.removeAllItems();
			this._oMenu.addItem(new MenuItem({
				text: this._oRb.getText("DELTAMICROCHART_ENTIRE_CHART"),
				press: this._fireChart.bind(this)
			}));
			this.getData().forEach((oItem) => {
				this._oMenu.addItem(new MenuItem({
					text: this._oRb.getText("DELTAMICROCHART_MENU_ITEM", [oItem.getTitle()]),
					press: this._onMenuItemClick.bind(this)
				}));
			});
		}
		if (this._hasData()) {
			this._oMenu.openBy(this,true,"right");
		}
	};
	/**
	 * It activates the press event handler of the chart
	 * @private
	 */
	ComparisonMicroChart.prototype._fireChart = function() {
		this.firePress();
	};
	/**
	 * It checks if the items inside the menu and chart are different
	 * @returns {boolean} True if the above mentioned condition is met
	 * @private
	 */
	ComparisonMicroChart.prototype._isDataChanged = function() {
		var aCurrentValues = [];
		var aMenuItems = [];
		this.getData().forEach((oData) => {
			aCurrentValues.push(oData.getTitle());
		});
		this._oMenu.getItems().forEach((oItem) => {
			aMenuItems.push(oItem.getText());
		});
		if (aCurrentValues.length !== aMenuItems.length) {
			return true;
		}
		for (var i = 0; i < aCurrentValues.length; i++) {
			if (aCurrentValues[i] != aMenuItems[i]) {
				return true;
			}
		}
		return false;
	};

	/**
	 * This function is activated if the menu item is clicked
	 * @param {Object} oEvent Event object that has been triggered on menu item click
	 * @private
	 */
	ComparisonMicroChart.prototype._onMenuItemClick = function(oEvent) {
		var oMenuItem = oEvent.getSource();
		var iIndex = this._getIndex(oMenuItem,oMenuItem.getParent());
		var oComparisonData = this.getData()[iIndex - 1];
		if (oComparisonData && oComparisonData.hasListeners("press")) {
			oComparisonData.firePress();
		}
	};

	/**
	 *This function returns the menu item instance inside the menu
	 * @param {sap.m.MenuItem} oMenuItem Instance of menu item
	 * @param {sap.m.Menu} oMenu Instance of menu
	 * @returns {Number} The index of the menu item inside the menu
	 * @private
	 */
	ComparisonMicroChart.prototype._getIndex = function(oMenuItem,oMenu) {
		var aMenuItems = oMenu.getItems();
		for (var i = 0; i < aMenuItems.length; i++) {
			if (aMenuItems[i] === oMenuItem) {
				return i;
			}
		}
		return 0;
	};

	// to prevent press event in No Data mode
	ComparisonMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(ComparisonMicroChart);

	return ComparisonMicroChart;
});
