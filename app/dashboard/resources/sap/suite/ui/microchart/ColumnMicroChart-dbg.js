/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.suite.ui.microchart.Example.
sap.ui.define([
	"./library",
	"sap/ui/core/Control",
	"sap/ui/core/ResizeHandler",
	"sap/base/Log",
	"sap/ui/events/KeyCodes",
	"sap/suite/ui/microchart/MicroChartUtils",
    "sap/m/library",
    "./ColumnMicroChartRenderer",
    // jQuery custom selectors ":focusable"
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"./ColumnMicroChartData",
	"./ColumnMicroChartLabel"
], function(library, Control, ResizeHandler, Log, KeyCodes, MicroChartUtils, mobileLibrary, ColumnMicroChartRenderer, Core, Theming, ColumnMicroChartData, ColumnMicroChartLabel) {
	"use strict";

	// shortcut for sap.m.Size
	var Size = mobileLibrary.Size;

	const MicroChartColorType = library.MicroChartColorType;

	/**
	 * Constructor for a new ColumnMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Compares different values which are represented as vertical bars. This control replaces the deprecated sap.suite.ui.commons.ColumnMicroChart.
	 * <br>Note: You can assign a custom tooltip for this microchart. The custom tooltip can be set using expression binding. When no custom tooltip is defined, the tooltip is generated automatically based on the logic described in {@link sap.ui.core.Element#getTooltip_AsString}. For a combination of a generated and a custom tooltip, use <code>((AltText))</code> inside of the tooltip string. The aggregated data of the microchart can also be customized.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.ColumnMicroChart
	 */
	var ColumnMicroChart = Control.extend("sap.suite.ui.microchart.ColumnMicroChart", /** @lends sap.suite.ui.microchart.ColumnMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the column micro chart is included.
				 */
				size: {group: "Misc", type: "sap.m.Size", defaultValue: Size.Auto},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {group: "Misc", type: "sap.ui.core.CSSSize"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {group: "Misc", type: "sap.ui.core.CSSSize"},

				/**
				 * If set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size, width and height properties are ignored in this case.
				 * @since 1.38.0
				 * @deprecated as of version 1.60.0, the concept has been discarded.
				 */
				isResponsive: {type: "boolean", group: "Appearance", defaultValue: false},

				/**
				 * If this property is set to <code>false</code>, both top labels are hidden.
				 */
				showTopLabels: { type: "boolean", defaultValue: true },

				/**
				 * If this property is set to <code>false</code>, both bottom labels are hidden.
				 */
				showBottomLabels: { type: "boolean", defaultValue: true },

				/**
				 * If set to true and there is enough space, top labels of the chart are hidden and labels for each column are shown instead.
				 *
				 * * @since 1.60.0
				 */
				allowColumnLabels: {type: "boolean", group: "Appearance", defaultValue: false},

				/**
				 * If this is set to True, the control will be hidden in 'No data' scenario.
				 * @since 1.84
				 */
				hideOnNoData: { type: "boolean", group: "Appearance", defaultValue: false }
			},

			events : {

				/**
				 * The event is triggered when the chart is pressed.
				 */
				press : {}
			},
			associations: {

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			defaultAggregation : "columns",
			aggregations: {

				/**
				 * The column chart data.
				 */
				columns: { multiple: true, type: "sap.suite.ui.microchart.ColumnMicroChartData", defaultClass: ColumnMicroChartData, defaultValue : null, bindable : "bindable"},

				/**
				 * The label on the left top corner of the chart.
				 */
				leftTopLabel: {  multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultClass: ColumnMicroChartLabel, defaultValue : null},

				/**
				 * The label on the right top corner of the chart.
				 */
				rightTopLabel: { multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultClass: ColumnMicroChartLabel, defaultValue : null},

				/**
				 * The label on the left bottom corner of the chart.
				 */
				leftBottomLabel: { multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultClass: ColumnMicroChartLabel, defaultValue: null},

				/**
				 * The label on the right bottom corner of the chart.
				 */
				rightBottomLabel: { multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultClass: ColumnMicroChartLabel, defaultValue : null}
			}
		},
		renderer: ColumnMicroChartRenderer
	});
	// numbers are in rem units
	ColumnMicroChart.THRESHOLD_LOOK_XS = 1.125;
	ColumnMicroChart.THRESHOLD_LOOK_S = 3.5;
	ColumnMicroChart.THRESHOLD_LOOK_M = 4.5;
	ColumnMicroChart.THRESHOLD_LOOK_L = 5.875;
	ColumnMicroChart.THRESHOLD_WIDTH_NO_LABEL = 6;

	ColumnMicroChart.prototype.init = function(){
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
	ColumnMicroChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	ColumnMicroChart.prototype.onBeforeRendering = function() {
		this.$().off("mouseenter");
		this.$().off("mouseleave");
	};

	ColumnMicroChart.prototype.onAfterRendering = function() {
		if (this._sChartResizeHandlerId) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}

		library._checkControlIsVisible(this, this._onControlIsVisible);

		//attaches handler for mouse enter event
		this.$().on("mouseenter", this._addTitleAttribute.bind(this));
		this.$().on("mouseleave", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._onControlIsVisible = function() {
		this._fChartHeight = undefined;
		this._aBars = [];

		var iColumnsNum = this.getColumns().length;

		for (var i = 0; i < iColumnsNum; i++) {
			this._aBars.push({});
		}

		this._onResize();
		this._sChartResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
	};

	ColumnMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._onResize = function() {
		this._calcColumns();

		var $Control = this.$(),
			iControlWidth = parseInt($Control.width()),
			iControlHeight = parseInt($Control.height()),
			$TopLabels = $Control.find(".sapSuiteClMCPositionTop").children(),
			$ColumnLabels = $Control.find(".sapSuiteClMCLabelColumn.sapSuiteClMCLabelColumnTop,.sapSuiteClMCLabelColumn.sapSuiteClMCLabelColumnBottom"),
			oBarsContainer = $Control.find(".sapSuiteClMCBars")[0],
			aColumns = this.getColumns(),
			iColumnsCount = aColumns.length;

		$Control.removeClass("sapSuiteClMCNoLabels sapSuiteClMCNoColumnLabels sapSuiteClMCNoTopLabels sapSuiteClMCLookM sapSuiteClMCLookS sapSuiteClMCLookXS");

		// hide all labels if chart width is too small
		if (iControlWidth <= this.convertRemToPixels(ColumnMicroChart.THRESHOLD_WIDTH_NO_LABEL)) {
			$Control.addClass("sapSuiteClMCNoLabels");
		}
		if (iControlHeight < this.convertRemToPixels(ColumnMicroChart.THRESHOLD_LOOK_S)) {
			$Control.addClass("sapSuiteClMCLookXS");
		} else if (iControlHeight < this.convertRemToPixels(ColumnMicroChart.THRESHOLD_LOOK_M)) {
			if (this.getAllowColumnLabels()) {
				$Control.addClass("sapSuiteClMCNoColumnLabels");
			}
			$Control.addClass("sapSuiteClMCLookS");
		} else if (iControlHeight < this.convertRemToPixels(ColumnMicroChart.THRESHOLD_LOOK_L)) {
			$Control.addClass("sapSuiteClMCLookM");
		}

		if (this._isAnyLabelTruncated($TopLabels)) {
			$Control.addClass("sapSuiteClMCNoTopLabels");
		}

		if (this.getAllowColumnLabels() && this._isAnyLabelTruncated($ColumnLabels)) {
			$Control.addClass("sapSuiteClMCNoColumnLabels");
		}

		if (iColumnsCount > 0 && oBarsContainer) {
			$Control.find(".sapSuiteClMCBar").show();

			while (oBarsContainer.scrollWidth > oBarsContainer.offsetWidth) {
				aColumns[--iColumnsCount].$().hide();
				Log.warning(this.toString() + " Chart overflow",  "Column " + iColumnsCount + " was not rendered");
			}
		}
	};


	ColumnMicroChart.prototype._calcColumns = function() {
		var aColumns = this.getColumns();
		if (aColumns && aColumns.length === this._aBars.length) {

			var fChartHeight = parseFloat(this.$().css("height"));
			if (fChartHeight !== this._fChartHeight) {
				this._fChartHeight = fChartHeight;
				this._calcColumnsHeight(fChartHeight, this._aBars);
			}

			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].$().css(this._aBars[i]);
			}
		}
	};

	ColumnMicroChart.prototype._calcColumnsHeight = function(fChartHeight, aBars) {
		var iClmnsNum = this.getColumns().length;

		// Somehow this function can be called even though the controll is rendered as "No data".
		// Seems like this function is called from _onControlIsVisible in a moment that no data has been added yet
		// but in the mean time the data has already been added but only now the function is called.
		// aBars can be empty and this condition should prevent any errors
		if (iClmnsNum !== aBars.length) {
			return;
		}

		var fMaxVal, fMinVal, fValue;
		fMaxVal = fMinVal = 0;

		for (var i = 0; i < iClmnsNum; i++) {
			var oClmn = this.getColumns()[i];
			if (fMaxVal < oClmn.getValue()) {
				fMaxVal = oClmn.getValue();
			} else if (fMinVal > oClmn.getValue()) {
				fMinVal = oClmn.getValue();
			}
		}

		if (fMaxVal === 0 && fMinVal === 0) {
			for (var iCol = 0; iCol < iClmnsNum; iCol++) {
				aBars[iCol].top = "calc(100% - 1px)";
				aBars[iCol].height = "1px";
			}

			return;
		}

		var fDelta = fMaxVal - fMinVal;
		var fOnePxVal = fDelta / fChartHeight;

		var fDownShift, fTopShift;
		fDownShift = fTopShift = 0;

		for (var iCl = 0; iCl < iClmnsNum; iCl++) {
			fValue = this.getColumns()[iCl].getValue();

			if (Math.abs(fValue) < fOnePxVal) {
				if (fValue >= 0) {
					if (fValue === fMaxVal) {
						fTopShift = fOnePxVal - fValue;
					}
				} else if (fValue === fMinVal) {
					fDownShift = fOnePxVal + fValue;
				}
			}
		}

		if (fTopShift) {
			fMaxVal += fTopShift;
			fMinVal -= fTopShift;
		}

		if (fDownShift) {
			fMaxVal -= fDownShift;
			fMinVal += fDownShift;
		}

		var fNegativeOnePxVal =  0 - fOnePxVal;

		for (var iClmn = 0; iClmn < iClmnsNum; iClmn++) {
			fValue = this.getColumns()[iClmn].getValue();
			var fCalcVal = fValue;

			if (fValue >= 0) {
				fCalcVal = Math.max(fCalcVal + fTopShift - fDownShift, fOnePxVal);
			} else {
				fCalcVal = Math.min(fCalcVal + fTopShift - fDownShift, fNegativeOnePxVal);
			}

			aBars[iClmn].value = fCalcVal;
		}

		function calcPercent(fValue) {
			return (fValue / fDelta * 100).toFixed(2) + "%";
		}

		var fZeroLine = calcPercent(fMaxVal);

		for (var iCol = 0; iCol < iClmnsNum; iCol++) {
			fValue = aBars[iCol].value;
			aBars[iCol].top = (fValue < 0) ? fZeroLine : calcPercent(fMaxVal - fValue);
			aBars[iCol].height = calcPercent(Math.abs(fValue));
		}
	};

	ColumnMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	ColumnMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	ColumnMicroChart.prototype.getLocalizedColorMeaning = function(sColor) {
		return MicroChartColorType.hasOwnProperty(sColor)  ? this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase()) : "";
	};

	ColumnMicroChart.prototype.setSize = function(size) {
		if (this.getSize() !== size) {
			this.setProperty("size", size, false);
		}
		return this;
	};

	ColumnMicroChart.prototype._getAltHeaderText = function(bIsActive) {
		var sAltText = this._oRb.getText("COLUMNMICROCHART");

		if (bIsActive) {
			sAltText += " " + this._oRb.getText("IS_ACTIVE");
		}

		if (!this._hasData()) {
			sAltText += "\n" + this._oRb.getText("NO_DATA");
			return sAltText;
		}

		var oLeftTopLabel = this.getLeftTopLabel();
		var oRightTopLabel = this.getRightTopLabel();
		var oLeftBtmLabel = this.getLeftBottomLabel();
		var oRightBtmLabel = this.getRightBottomLabel();

		var sColor;

		if (oLeftTopLabel && oLeftTopLabel.getLabel() || oLeftBtmLabel && oLeftBtmLabel.getLabel()) {
			if (oLeftTopLabel) {
				sColor = oLeftTopLabel.getColor();
			} else if (oLeftBtmLabel){
				sColor = oLeftBtmLabel.getColor();
			} else {
				sColor = "";
			}

			sAltText += "\n" + this._oRb.getText(("COLUMNMICROCHART_START")) + ": " + (oLeftBtmLabel ? oLeftBtmLabel.getLabel() + " " : "")
				+ (oLeftTopLabel ? oLeftTopLabel.getLabel() + " " : "") + this.getLocalizedColorMeaning(sColor);
		}

		if (oRightTopLabel && oRightTopLabel.getLabel() || oRightBtmLabel && oRightBtmLabel.getLabel()) {
			if (oRightTopLabel) {
				sColor = oRightTopLabel.getColor();
			} else if (oRightBtmLabel){
				sColor = oRightBtmLabel.getColor();
			} else {
				sColor = "";
			}

			sAltText += "\n" + this._oRb.getText(("COLUMNMICROCHART_END")) + ": " + (oRightBtmLabel ? oRightBtmLabel.getLabel() + " " : "")
				+ (oRightTopLabel ? oRightTopLabel.getLabel() + " " : "") + this.getLocalizedColorMeaning(sColor);
		}

		return sAltText;
	};

	ColumnMicroChart.prototype._getAltSubText = function(bIsFirst) {
		var sAltText = "";

		var aColumns = this.getColumns();
		for (var i = 0; i < aColumns.length; i++) {
			var oBar = aColumns[i],
				sColumnTooltip = oBar.getTooltip_AsString(),
				sAltColumnText = "";

			if (!sColumnTooltip) {
				continue;
			}

			sAltColumnText += (bIsFirst ? "" : "\n") + this._getBarAltText(oBar);

			sAltColumnText = sColumnTooltip.split("((AltText))").join(sAltColumnText);

			if (sAltColumnText) {
				sAltText += sAltColumnText;
				bIsFirst = false;
			}
		}

		return sAltText;
	};

	ColumnMicroChart.prototype.onclick = function(oEvent) {
		if (!this.fireBarPress(oEvent)) {
			this.firePress();
		}
	};

	ColumnMicroChart.prototype.onkeydown = function(oEvent) {
		var iThis, oFocusables;
		switch (oEvent.keyCode) {
			case KeyCodes.SPACE:
				oEvent.preventDefault();
				break;

			case KeyCodes.ARROW_LEFT:
			case KeyCodes.ARROW_UP:
				oFocusables = this.$().find(":focusable"); // all tabstops in the control
				iThis = oFocusables.index(oEvent.target);  // focused element index
				if (oFocusables.length > 1) {
					if (iThis === -1) {
						oFocusables.eq(oFocusables.length - 2).get(0).focus();
					} else {
						oFocusables.eq((iThis - 1 >= 0) ? iThis - 1 : oFocusables.length - 1).get(0).focus();	// previous tab stop element
					}
					oEvent.preventDefault();
					oEvent.stopPropagation();
				}
				break;

			case KeyCodes.ARROW_DOWN:
			case KeyCodes.ARROW_RIGHT:
				oFocusables = this.$().find(":focusable"); // all tabstops in the control
				iThis = oFocusables.index(oEvent.target);  // focused element index
				if (oFocusables.length > 0) {
					oFocusables.eq((iThis + 1 < oFocusables.length) ? iThis + 1 : 0).get(0).focus(); // next tab stop element
					oEvent.preventDefault();
					oEvent.stopPropagation();
				}
				break;
			default:
		}
	};

	ColumnMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			if (!this.fireBarPress(oEvent)) {
				this.firePress();
				oEvent.preventDefault();
			}
		}
	};

	ColumnMicroChart.prototype.fireBarPress = function(oEvent) {
		var oCmcData = oEvent.srcControl;
		if (oCmcData && oCmcData.isA("sap.suite.ui.microchart.ColumnMicroChartData")) {
			if (oCmcData.hasListeners("press")) {
				oCmcData.firePress();
				oEvent.preventDefault();
				oEvent.stopPropagation();
				return true;
			}
		}
		return false;
	};

	ColumnMicroChart.prototype._getBarAltText = function(oBar) {
		var sMeaning = this.getLocalizedColorMeaning(oBar.getColor());
		return oBar.getLabel() + " " + oBar.getValue() + " " + sMeaning;
	};

	ColumnMicroChart.prototype.setBarPressable = function(oBar, bPressable) {
		var $bar = oBar.$();

		if (bPressable) {
			var sBarAltText = this._getBarAltText(oBar);
			$bar.addClass("sapSuiteUiMicroChartPointer").attr("tabindex", 0).attr("title", sBarAltText).attr("role", "presentation").attr("aria-label", sBarAltText);
		} else {
			$bar.removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer").removeAttr("title").removeAttr("role").removeAttr("aria-label");
		}
	};

	ColumnMicroChart.prototype.onsaptabnext = function(oEvent) {
		var oLast = this.$().find(":focusable").last();  // last tabstop in the control
		if (oLast) {
			this._bIgnoreFocusEvt = true;
			oLast.get(0).focus();
		}
	};

	ColumnMicroChart.prototype.onsaptabprevious = function(oEvent) {
		if (oEvent.target.id !== oEvent.currentTarget.id) {
			var oFirst = this.$().find(":focusable").first(); // first tabstop in the control
			if (oFirst) {
				oFirst.get(0).focus();
			}
		}
	};

	ColumnMicroChart.prototype.onfocusin = function(oEvent) {
		if (this._bIgnoreFocusEvt) {
			this._bIgnoreFocusEvt = false;
			return;
		}
		if (this.getId() + "-hidden" === oEvent.target.id) {
			this.$().trigger("focus");
			oEvent.preventDefault();
			oEvent.stopPropagation();
		}
	};

	/**
	 * Adds title attribute to show tooltip when the mouse enters chart.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes title attribute to let tooltip disappear when the mouse left the chart.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	ColumnMicroChart.prototype._hasData = function() {
		return this.getColumns().length > 0;
	};

	// to prevent press event in No Data mode
	ColumnMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(ColumnMicroChart);

	return ColumnMicroChart;
});
