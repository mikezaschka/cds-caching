/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/ui/thirdparty/jquery",
	'./library',
	'sap/m/library',
	'sap/ui/core/Control',
	'sap/m/FlexBox',
	'sap/ui/core/ResizeHandler',
	"sap/base/Log",
	"sap/m/IllustratedMessage",
	"./InteractiveBarChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"./InteractiveBarChartBar"
],
	function(Localization, jQuery, library, MobileLibrary, Control, FlexBox, ResizeHandler, Log, IllustratedMessage, InteractiveBarChartRenderer, Core, Theming, InteractiveBarChartBar) {
	"use strict";

	/**
	 * Constructor for a new InteractiveBarChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The InteractiveBarChart control belongs to a chart control group in the MicroChart library with a number of interactive features. These interactive features provide more information on a chart value.
	 * For example, by selecting a bar you can get more details on the displayed value.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.42.0
	 * @constructor
	 * @alias sap.suite.ui.microchart.InteractiveBarChart
	 *
	 */
	var InteractiveBarChart = Control.extend("sap.suite.ui.microchart.InteractiveBarChart", /** @lends sap.suite.ui.microchart.InteractiveBarChart.prototype */ {
		metadata : {
			library : "sap.suite.ui.microchart",
			properties : {
				/**
				 * The number of displayed bars.
				 */
				displayedBars : {type : "int", group : "Appearance", defaultValue : 3},
				/**
				 * Width of the labels column in the resulting layout (in percentage). Possible range of values from 0 to 100.
				 * A value of 40 results in the labels column taking up 40% of available space.
				 */
				labelWidth : {type : "sap.ui.core.Percentage", group : "Appearance", defaultValue : "40%"},
				/**
				 * Enables the selection in the chart.
				 */
				selectionEnabled : {type : "boolean", group : "Behavior", defaultValue : true},
				/**
				 * Begin of displayed scale.
				 */
				min: {type : "float", group : "Appearance"},
				/**
				 * End of displayed scale.
				 */
				max: {type : "float", group : "Appearance"},
				/**
				 * TRUE if error is present, FALSE otherwise
				 */
				showError: {type: "boolean", group: "Appearance", defaultValue: false},
				/**
				 * error message title
				 */
				errorMessageTitle: {type:"string", group: "Appearance"},
				/**
				 * error message description
				 */
				errorMessage: {type:"string", group: "Appearance"}
			},
			defaultAggregation : "bars",
			aggregations : {
				/**
				 * Bars displayed on the chart.
				 */
				bars : {type : "sap.suite.ui.microchart.InteractiveBarChartBar", defaultClass: InteractiveBarChartBar, multiple : true, bindable : "bindable"}
			},
			events : {
				/**
				 * Event is fired when user has selected or deselected a bar.
				 */
				selectionChanged : {
					parameters : {
						/**
						 * All bars which are in selected state.
						 */
						selectedBars : {type : "sap.suite.ui.microchart.InteractiveBarChartBar[]"},
						/**
						 * The bar being selected or deselected.
						 */
						bar : {type : "sap.suite.ui.microchart.InteractiveBarChartBar"},
						/**
						 * The selection state of the bar being selected or deselected.
						 */
						selected : {type : "boolean"}
					}
				},
				/**
				 * The event is fired when the user presses the chart while its bars are not selectable in non-interactive mode. This is decided internally, depending on the size of the bars.
				 */
				press: {}
			},
			associations : {
				/**
				 * Association to controls which label this control (see WAI-ARIA attribute aria-labelledby).
				 */
				ariaLabelledBy : {type : "sap.ui.core.Control", multiple : true, singularName : "ariaLabelledBy"}
			}
		},
		renderer: InteractiveBarChartRenderer
	});

	/* Constants */
	InteractiveBarChart.MIN_BAR_WIDTH_IN_PX = 1; // minimum bar width for small values (px)
	InteractiveBarChart.BAR_VALUE_PADDING_LEFT_IN_PX = 4; // 0.25rem space between the bar and the displayed value in case of the value is displayed outside of the bar
	InteractiveBarChart.BAR_VALUE_PADDING_RIGHT_IN_PX = 4; // 0.25rem space between the displayed value and the end of the bar
	InteractiveBarChart.SELECTION_AREA_BORDER_IN_PX = 1; // border width of selection area of each side
	InteractiveBarChart.DIVIDER_WIDTH_IN_PX = 1; // width of the divider separating negative and positive values
	// Responsiveness height
	InteractiveBarChart.AREA_HEIGHT_MINVALUE = 18; // area height threshold for which the chart should be hidden (px)
	InteractiveBarChart.BAR_HEIGHT_FONT_SMALLER = 20; // bar height threshold for a switch to smaller font (px)
	InteractiveBarChart.BAR_HEIGHT_MINVALUE = 6; // bar height threshold for which the chart should be hidden (px)
	InteractiveBarChart.BAR_HEIGHT_LABEL_HIDE = 16; // bar height threshold for which the labels inside bars should be hidden (px)
	// Responsiveness width
	InteractiveBarChart.CHART_WIDTH_FONT_SMALLER = 286; // chart width threshold for a switch to smaller font (px)
	InteractiveBarChart.LABEL_WIDTH_MINVALUE = 80; // label width threshold for a switch to move labels above bars (px)
	InteractiveBarChart.CHART_WIDTH_MINVALUE = 130; // chart width threshold for a switch to an invisible chart (px)
	// Responsiveness cozy vs compact mode
	InteractiveBarChart.AREA_HEIGHT_INTERACTIVE_MINVALUE = 48; // the minimum area height for an interactive mode (px)
	InteractiveBarChart.AREA_HEIGHT_INTERACTIVE_MINVALUE_COMPACT = 32;
	InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE1 = 34; // the area height threshold for a smaller padding between bar and area - stage1 (px)
	InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE1_COMPACT = 32;
	InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE2 = 28; // the area height threshold for a smaller padding between bar and area - stage2 (px)
	InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE2_COMPACT = 31;

	InteractiveBarChart.prototype.init = function() {
		/* Internal properties */
		this._iVisibleBars = 0; // visible bars is always a minimum value between available bars and displayed bars
		this._bInteractiveMode = true; // in non-interactive mode, the user cannot interact with the chart (user actions are ignored)
		this._bMinMaxValid = null;
		this._fDividerPositionRight = 0;
		this._oRb = Core.getLibraryResourceBundle("sap.suite.ui.microchart");
		this._fMin = null;
		this._fMax = null;
		this._bThemeApplied = false;
		this._oIllustratedMessageControl =  new IllustratedMessage({
			illustrationSize: MobileLibrary.IllustratedMessageSize.Base,
			illustrationType: MobileLibrary.IllustratedMessageType.NoData
		   });
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	/**
	 * Handler for the core's init event. In order for the control to be rendered only if all themes
	 * are loaded and everything is properly initialized, we attach a theme check in here.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	InteractiveBarChart.prototype.onBeforeRendering = function() {
		this._bCompact = this._isCompact();
		this._bInteractiveMode = true;
		// set the data needed for responsiveness
		this._setResponsivenessData();
		this._setInternalMinMax();
		this._errorMessage = this.getErrorMessage();
		this._errorMessageTitle = this.getErrorMessageTitle();
		this._oIllustratedMessageControl.setTitle(this._errorMessageTitle);
		this._oIllustratedMessageControl.setDescription(this._errorMessage);
		this._bMinMaxValid = this._checkIfMinMaxValid();
		if (this.getAggregation("bars") && this.getDisplayedBars()) {
			this._iVisibleBars = Math.min(this.getAggregation("bars").length, this.getDisplayedBars());
		}
		if (!this.data("_parentRenderingContext") && typeof this.getParent === "function") {
			this.data("_parentRenderingContext", this.getParent());
		}
		this._deregisterResizeHandler();
		this._updateUseSemanticTooltip();
	};

	InteractiveBarChart.prototype.onAfterRendering = function() {
		this._adjustToParent();
		library._checkControlIsVisible(this, this._onControlIsVisible);
		this._bindMouseEnterLeaveHandler();//Bind mouse Enter/Leave
	};

	/**
	 * Determines if the information about semantic colors should be added to the tooltip
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._updateUseSemanticTooltip = function() {
		var aBars = this.getBars();
		this._bUseSemanticTooltip = false;
		for (var i = 0; i < this._iVisibleBars; i++) {
			if (aBars[i].getColor() !== MobileLibrary.ValueColor.Neutral) {
				this._bUseSemanticTooltip = true;
				return;
			}
		}
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._onControlIsVisible = function() {
		this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		this._calcBarsWidth();
		this._onResize();
		// To check whether to render in compact density mode onAfterRendering of control.
		if (this.$().length > 0) {
			var bCompact = this._isCompact();
			if (bCompact !== this._bCompact) {
				this._bCompact = bCompact;
				this.invalidate();
			}
		}

	};

	InteractiveBarChart.prototype.exit = function() {
		this._deregisterResizeHandler();
		this._oIllustratedMessageControl.destroy();
	};

	/* =========================================================== */
	/* Event handling */
	/* =========================================================== */

	/**
	 * Event handler for click. In non-interactive mode, all user actions are ignored.
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onclick = function(event) {
		// no click for disabled mode
		if (!this.getSelectionEnabled()) {
			 return;
		}
		if (this._bInteractiveMode) {
			var sId = jQuery(event.target).attr("id") || jQuery(event.target).parents(".sapSuiteIBCBarInteractionArea").attr("id"),
				$Focusables = this.$().find(".sapSuiteIBCBarInteractionArea"),
				iIndex, iHasFocus;
			if (sId) {
				iIndex = sId.substring(sId.lastIndexOf("-") + 1);
				if (isNaN(iIndex)) {
					return;
				} else {
					iIndex = parseInt(iIndex);
				}
				this._toggleSelected(iIndex);
				// find out which bar has tabindex = 0 at this moment
				iHasFocus = $Focusables.index(this.$().find(".sapSuiteIBCBarInteractionArea[tabindex='0']"));
				this._switchTabindex(iHasFocus, iIndex, $Focusables);
			}
		} else {
			this.firePress();
		}
	};

	/**
	 * Handler for enter button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapenter = function(event) {
		if (this._bInteractiveMode) {
			var iIndex = this.$().find(".sapSuiteIBCBarInteractionArea").index(event.target);
			if (iIndex !== -1) {
				this._toggleSelected(iIndex);
			}
			event.preventDefault();
			event.stopImmediatePropagation();
		} else {
			this.firePress();
		}
	};

	/**
	 * Handler for space button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapspace = InteractiveBarChart.prototype.onsapenter;

	/**
	 * Handler for up arrow button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapup = function(event) {
		var $Focusables = this.$().find(".sapSuiteIBCBarInteractionArea");
		var iIndex = $Focusables.index(event.target);
		if ($Focusables.length > 0) {
			this._switchTabindex(iIndex, iIndex - 1, $Focusables);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	/**
	 * Handler for down arrow button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapdown = function(event) {
		var $Focusables = this.$().find(".sapSuiteIBCBarInteractionArea");
		var iIndex = $Focusables.index(event.target);
		if ($Focusables.length > 0) {
			this._switchTabindex(iIndex, iIndex + 1, $Focusables);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	/**
	 * Handler for home button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsaphome = function(event) {
		var $Focusables = this.$().find(".sapSuiteIBCBarInteractionArea");
		var iIndex = $Focusables.index(event.target);
		if (iIndex !== 0 && $Focusables.length > 0) {
			this._switchTabindex(iIndex, 0, $Focusables);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	/**
	 * Handler for end button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapend = function(event) {
		var $Focusables = this.$().find(".sapSuiteIBCBarInteractionArea"),
			iIndex = $Focusables.index(event.target),
			iLength = $Focusables.length;
		if (iIndex !== iLength - 1 && iLength > 0) {
			this._switchTabindex(iIndex, iLength - 1, $Focusables);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	/**
	 * Handler for left arrow button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapleft = InteractiveBarChart.prototype.onsapup;

	/**
	 * Handler for right arrow button event
	 *
	 * @param {sap.ui.base.Event} event which was fired
	 */
	InteractiveBarChart.prototype.onsapright = InteractiveBarChart.prototype.onsapdown;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	/**
	 * Gets all selected bars.
	 *
	 * @returns {sap.suite.ui.microchart.InteractiveBarChartBar[]} All selected bars
	 * @public
	 */
	InteractiveBarChart.prototype.getSelectedBars = function() {
		var aBars = this.getAggregation("bars"),
			aSelectedBars = [], i;

		for (i = 0; i < aBars.length; i++) {
			if (aBars[i].getSelected()) {
				aSelectedBars.push(aBars[i]);
			}
		}
		return aSelectedBars;
	};

	/**
	 * Already selected bars will be deselected and members of the selectedBars parameter which are part of the bars aggregation will be set to selected state.
	 *
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar | sap.suite.ui.microchart.InteractiveBarChartBar[]} selectedBars A bar element or an array of bars for which the status should be set to selected.
	 * @returns {this} this to allow method chaining
	 * @public
	 */
	InteractiveBarChart.prototype.setSelectedBars = function(selectedBars) {
		var aBars = this.getAggregation("bars"),
			i, iIndex;
		this._deselectAllSelectedBars();
		if (!selectedBars) {
			return this;
		}
		if (selectedBars instanceof InteractiveBarChartBar) {
			selectedBars = [selectedBars];
		}
		if (Array.isArray(selectedBars)) {
			for (i = 0; i < selectedBars.length; i++) {
				iIndex = this.indexOfAggregation("bars", selectedBars[i]);
				if (iIndex >= 0) {
					aBars[iIndex].setProperty("selected", true, true);
				} else {
					Log.warning("setSelectedBars method called with invalid InteractiveBarChartBar element");
				}
			}
		}
		this.invalidate();
		return this;
	};

	InteractiveBarChart.prototype.getTooltip_AsString = function(iChartIndex) { //eslint-disable-line
		//Interaction mode
		if (this._isChartEnabled()){
			sTooltip = this._createTooltipText(iChartIndex, true);
			if (!sTooltip && library._isTooltipSuppressed(sTooltip)) {
				sTooltip = null;
			}
		} else {
			var sTooltip = this.getTooltip_Text();
			if (!sTooltip) { //Tooltip will be set by control
				sTooltip = this._createTooltipText();
			} else if (library._isTooltipSuppressed(sTooltip)) {
				sTooltip = null;
			}
		}
		return sTooltip;
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */

	/**
	 * Looks for the class '.sapUiSizeCompact' on the control and its parents to determine whether to render cozy or compact density mode.
	 *
	 * @returns {boolean} True if class 'sapUiSizeCompact' was found, otherwise false.
	 * @private
	 */
	InteractiveBarChart.prototype._isCompact = function() {
		return jQuery("body").hasClass("sapUiSizeCompact") || this.$().is(".sapUiSizeCompact") || this.$().closest(".sapUiSizeCompact").length > 0;
	};

	/**
	 * Changes data for compact mode related to cozy (default) mode.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._setResponsivenessData = function() {
		if (this._bCompact) {
			this._iAreaHeightInteractiveMinValue = InteractiveBarChart.AREA_HEIGHT_INTERACTIVE_MINVALUE_COMPACT;
			this._iAreaHeightPaddingStage1 = InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE1_COMPACT;
			this._iAreaHeightPaddingStage2 = InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE2_COMPACT;
		} else {
			this._iAreaHeightInteractiveMinValue = InteractiveBarChart.AREA_HEIGHT_INTERACTIVE_MINVALUE;
			this._iAreaHeightPaddingStage1 = InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE1;
			this._iAreaHeightPaddingStage2 = InteractiveBarChart.AREA_HEIGHT_PADDING_STAGE2;
		}
	};

	/**
	 * Checks the current content density and invalidates the control if it is changed in order to trigger a re-rendering.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._handleThemeApplied = function() {
		// we need to invalidate in every theme changed, as some colors are not defined by CSS but in rendering routine
		this._bThemeApplied = true;
		this._bCompact = this._isCompact();
		// removed invalidate after testing by switching into various themes, no observed changes/issues, also
		// no visible hardcoded css in the renderer file
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * Adjusts the height and width of the whole control if this is required depending on parent control.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._adjustToParent = function() {
		var $this = this.$();
		if (this.data("_parentRenderingContext") && this.data("_parentRenderingContext") instanceof FlexBox) {
			// Subtracts two pixels, otherwise there's not enough space for the outline, and the chart won't be rendered properly
			var $Parent = this.data("_parentRenderingContext").$();
			var iParentWidth = $Parent.width() - 2;
			var iParentHeight = $Parent.height() - 2;
			$this.outerWidth(iParentWidth);
			$this.outerHeight(iParentHeight);
		}
	};

	/**
	 * Calculates the width of the bars.
	 * @returns {sap.suite.ui.microchart.InteractiveBarChart} this if min and max are invalid, otherwise undefined
	 * @private
	 */
	InteractiveBarChart.prototype._calcBarsWidth = function() {
		var $this = this.$(),
			$BarLabels = $this.find(".sapSuiteIBCBarLabel"),
			fDividerWidth = InteractiveBarChart.DIVIDER_WIDTH_IN_PX,
			fLabelAreaWidth = parseFloat(this.getLabelWidth()),
			fBarAreaWidth, fTotal,
			fBarActualNegativeSpaceInPercent, fBarActualPositiveSpaceInPercent,
			fLabelAreaWidthFullWidth, fLabelLeftPositionFullWidth,
			fValue, fEffectiveValue,
			$BarNegative, $BarPositive,
			bRTL = Localization.getRTL();

		if (!this._bMinMaxValid) {
			return this;
		}
		if (this._bFullWidth) {
			fLabelAreaWidth = 100;
			fBarAreaWidth = 100;
		} else {
			fBarAreaWidth = 100 - fLabelAreaWidth;
		}

		fTotal = Math.abs(this._fMax - this._fMin);
		if (this._fMin >= 0 && this._fMax >= 0) {
			fBarActualNegativeSpaceInPercent = 0;
			fBarActualPositiveSpaceInPercent = 1;
		} else if (this._fMin < 0 && this._fMax < 0) {
			fBarActualNegativeSpaceInPercent = 1;
			fBarActualPositiveSpaceInPercent = 0;
		} else {
			fBarActualNegativeSpaceInPercent = Math.abs(this._fMin / fTotal);
			fBarActualPositiveSpaceInPercent = Math.abs(this._fMax / fTotal);
		}

		if (this._bFullWidth) {
			if (fBarActualPositiveSpaceInPercent >= fBarActualNegativeSpaceInPercent) {
				fLabelAreaWidthFullWidth = fBarActualPositiveSpaceInPercent * 100;
				fLabelLeftPositionFullWidth = fBarActualNegativeSpaceInPercent * 100;
			} else {
				fLabelAreaWidthFullWidth = fBarActualNegativeSpaceInPercent * 100;
				fLabelLeftPositionFullWidth = 0;
			}
			$BarLabels.css("width", fLabelAreaWidthFullWidth + "%");
			$BarLabels.css(bRTL ? "right" : "left", fLabelLeftPositionFullWidth + "%");
		} else {
			$BarLabels.css("width", fLabelAreaWidth + "%");
			$BarLabels.css(bRTL ? "right" : "left", "");
		}
		$this.find(".sapSuiteIBCBarWrapper").css("width", fBarAreaWidth + "%");

		if (fBarActualNegativeSpaceInPercent > 0) {
			$this.find(".sapSuiteIBCBarWrapperNegative").width("calc(" + fBarActualNegativeSpaceInPercent * 100 + "% - " + fDividerWidth + "px)");
		} else {
			$this.find(".sapSuiteIBCBarWrapperNegative").width("0%");
		}
		if (fBarActualPositiveSpaceInPercent > 0) {
			$this.find(".sapSuiteIBCBarWrapperPositive").width("calc(" + fBarActualPositiveSpaceInPercent * 100 + "% - " + fDividerWidth + "px)");
		} else {
			$this.find(".sapSuiteIBCBarWrapperPositive").width("0%");
		}

		for (var i = 0; i < this._iVisibleBars; i++) {
			fValue = this.getBars()[i].getValue();

			$BarNegative = this.$("bar-negative-" + i);
			$BarPositive = this.$("bar-positive-" + i);

			if (this.getBars()[i]._bNullValue || fValue === 0) {
				$BarPositive.add($BarNegative).css("min-width", 0);

			} else if (!this.getBars()[i]._bNullValue) {
				if (fValue > 0) { //positive value
					fEffectiveValue = Math.min(Math.max(fValue, this._fMin), this._fMax);

					$BarPositive.css({
						"width": this._calcPercent(fEffectiveValue, fTotal, Math.max(0, this._fMin), fBarActualPositiveSpaceInPercent),
						"min-width": 1
					});
					$BarNegative.css("min-width", 0);
				} else { //negative value
					fEffectiveValue = Math.max(Math.min(fValue, this._fMax), this._fMin);

					$BarNegative.css({
						"width": this._calcPercent(fEffectiveValue, fTotal, Math.min(0, this._fMax), fBarActualNegativeSpaceInPercent),
						"min-width": 1
					});
					$BarPositive.css("min-width", 0);
				}
			}
		}
	};

	/**
	 * Calculates the percentage from the total width needed for the positive or negative bars.
	 *
	 * @param {float} value The value of the bar.
	 * @param {float} total The full scale of values in the chart.
	 * @param {float} start The start value marking the beginning of the scale.
	 * @param {float} availableSpaceFactor The value of the available space for the bar as a value between 0 and 1 representing 0% - 100%.
	 * @returns {string} The percentage value of the bar's width
	 * @private
	 */
	InteractiveBarChart.prototype._calcPercent = function(value, total, start, availableSpaceFactor) {
		return Math.abs((value - start) / (total * availableSpaceFactor) * 100).toFixed(5) + "%";
	};

	/**
	 * Deselects all selected bars.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._deselectAllSelectedBars = function() {
		var aBars = this.getAggregation("bars"),
			iBarsCount = aBars.length, i;

		for (i = 0; i < iBarsCount; i++) {
			aBars[i].setProperty("selected", false, true);
		}
	};

	/**
	 * Toggles the selection state of the bar element.
	 *
	 * @param {int} index The index of the bar element
	 * @private
	 */
	InteractiveBarChart.prototype._toggleSelected = function(index) {
		var aBars = this.getAggregation("bars"),
			oBar = aBars[index];

		if (index < 0 || index >= aBars.length) {
			return;
		}
		var $InteractionArea = this.$("interactionArea-" + index);
		if (oBar.getSelected()) {
			$InteractionArea.removeClass("sapSuiteIBCBarSelected");
			oBar.setProperty("selected", false, true);
		} else {
			$InteractionArea.addClass("sapSuiteIBCBarSelected");
			oBar.setProperty("selected", true, true);
		}
		$InteractionArea.attr("aria-selected", oBar.getSelected());
		this.fireSelectionChanged({
			selectedBars: this.getSelectedBars(),
			bar: oBar,
			selected: oBar.getSelected()
		});
	};

	/**
	 * Sets the displayed value outside of the bar if there is not enough space in the bar.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._showValueOutsideBar = function() {
		var $this = this.$(),
			$BarValues, iValueShift, fBarValueWidthWithPadding, fValue,
			fBarPositiveWidth, fBarNegativeWidth,
			fBarWrapperPositiveOuterWidth, fBarWrapperNegativeOuterWidth,
			fBarWrapperPositiveWidth = this.$("bar-positive-0").parent().width(),
			fBarWrapperNegativeWidth = this.$("bar-negative-0").parent().width(),
			bRTL = Localization.getRTL();

		$BarValues = $this.find(".sapSuiteIBCBarValue");
		if ($BarValues.length === 0) {
			return;
		}
		for (var i = 0; i < this._iVisibleBars; i++) {
			fValue = this.getBars()[i].getValue();
			fBarValueWidthWithPadding = ($BarValues.eq(i).width() + InteractiveBarChart.BAR_VALUE_PADDING_LEFT_IN_PX + InteractiveBarChart.BAR_VALUE_PADDING_RIGHT_IN_PX);
			fBarPositiveWidth = this.$("bar-positive-" + i).width();
			fBarNegativeWidth = this.$("bar-negative-" + i).width();
			fBarWrapperPositiveOuterWidth = fBarWrapperPositiveWidth - fBarPositiveWidth;
			fBarWrapperNegativeOuterWidth = fBarWrapperNegativeWidth - fBarNegativeWidth;
			if (fValue > 0 || ((this.getBars()[i]._bNullValue || fValue === 0) && this._fMin + this._fMax >= 0)) {
				// align positive labels
				if (fBarValueWidthWithPadding > fBarPositiveWidth && fBarValueWidthWithPadding > fBarWrapperPositiveOuterWidth) {
					$BarValues.eq(i).css("visibility", "hidden");
				} else {
					$BarValues.eq(i).css("visibility", "inherit");
				}
				if (fBarValueWidthWithPadding > fBarPositiveWidth) {
					// bar value width plus margins don't fit into the bar
					iValueShift = (this.$("bar-positive-" + i).width() + InteractiveBarChart.BAR_VALUE_PADDING_LEFT_IN_PX) + "px";
					$BarValues.eq(i).addClass("sapSuiteIBCBarValueOutside");
				} else {
					iValueShift = "";
					$BarValues.eq(i).removeClass("sapSuiteIBCBarValueOutside");
				}
				if (bRTL) {
					$BarValues.eq(i).css({ "right": iValueShift });
				} else {
					$BarValues.eq(i).css({ "left": iValueShift });
				}
			} else {
				// align negative labels
				if (fBarValueWidthWithPadding > fBarNegativeWidth && fBarValueWidthWithPadding > fBarWrapperNegativeOuterWidth) {
					$BarValues.eq(i).css("visibility", "hidden");
				} else {
					$BarValues.eq(i).css("visibility", "inherit");
				}
				if (fBarValueWidthWithPadding > fBarNegativeWidth) {
					//bar value width plus margins don't fit into the bar
					iValueShift = (this.$("bar-negative-" + i).width() + InteractiveBarChart.BAR_VALUE_PADDING_RIGHT_IN_PX) + "px";
					$BarValues.eq(i).addClass("sapSuiteIBCBarValueOutside");
				} else {
					iValueShift = "";
					$BarValues.eq(i).removeClass("sapSuiteIBCBarValueOutside");
				}

				if (bRTL) {
					$BarValues.eq(i).css({ "left": iValueShift });
				} else {
					$BarValues.eq(i).css({ "right": iValueShift });
				}
			}
		}
	};

	/**
	 * Checks if min and max properties contain valid data.
	 *
	 * @returns {boolean} flag for valid min / max data
	 * @private
	 */
	InteractiveBarChart.prototype._checkIfMinMaxValid = function() {
		if (this._fMin > this._fMax) {
			Log.warning("Min value for InteractiveBarChart is larger than Max value.");
			return false;
		}
		return true;
	};

	/**
	 * Sets internal values for Min and Max scale in case min, max or both are omitted
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._setInternalMinMax = function() {
		// loop over available bars to retrieve lowest and highest value
		var fMinBarValue = null, fMaxBarValue = null, fBarValue, oBars = this.getBars(),
			iRenderedBars = Math.min(this.getDisplayedBars(), oBars.length);
		for (var i = 0; i < iRenderedBars; i++) {
			if (!oBars[i]._bNullValue) {
				fBarValue = oBars[i].getValue();
				fMinBarValue = Math.min(fMinBarValue, fBarValue);
				fMaxBarValue = Math.max(fMaxBarValue, fBarValue);
			}
		}
		// initialize internal min, max with set properties and overwrite them if they are not set.
		this._fMin = this.getMin();
		this._fMax = this.getMax();
		// overwrite min and max with observed min/max if they are not set explicitly
		if (!Number.isFinite(Number(this._fMin)) || !Number.isFinite(Number(this._fMax))) {
			// only positive values
			if (fMinBarValue >= 0 && fMaxBarValue >= 0) {
				// no min set translates to min being zero regardless of actual minimal value
				if (!Number.isFinite(Number(this._fMin))) {
					this._fMin = 0;
				}
				// no max set translates to max being determined by maximum bar value
				if (!Number.isFinite(Number(this._fMax))) {
					this._fMax = fMaxBarValue;
				}
			// only negative values
			} else if (fMinBarValue < 0 && fMaxBarValue < 0) {
				// no min set translates to min being determined by minimum bar value
				if (!Number.isFinite(Number(this._fMin))) {
					this._fMin = fMinBarValue;
				}
				// no max set translates to max being zero regardless of actual maximum value
				if (!Number.isFinite(Number(this._fMax))) {
					this._fMax = 0;
				}
			// both positive and negative values
			} else {
				// no min set translates to min being determined by minimum bar value
				if (!Number.isFinite(Number(this._fMin))) {
					this._fMin = fMinBarValue;
				}
				// no max set translates to max being determined by maximum bar value
				if (!Number.isFinite(Number(this._fMax))) {
					this._fMax = fMaxBarValue;
				}
			}
		}
	};

	InteractiveBarChart.prototype.validateProperty = function(propertyName, value) {
		if (propertyName === "labelWidth" && (value !== null || value !== undefined)) {
			var fValue = parseFloat(value);
			if (fValue < 0 || fValue > 100) {
				Log.warning("LabelWidth for InteractiveBarChart is not between 0 and 100.");
				value = null;
			}
		}
		return Control.prototype.validateProperty.apply(this, [propertyName, value]);
	};

	/**
	 * Adds and removes the tabindex between elements to support keyboard navigation.
	 *
	 * @param {int} oldIndex which is the bar index whose tabindex is 0 previously.
	 * @param {int} newIndex which is the bar index whose tabindex should be set to 0 this time.
	 * @param {jQuery} focusables all the elements who can have tabindex attribute.
	 * @private
	 */
	InteractiveBarChart.prototype._switchTabindex = function(oldIndex, newIndex, focusables) {
		if (oldIndex >= 0 && oldIndex < focusables.length && newIndex >= 0 && newIndex < focusables.length) {
			focusables.eq(oldIndex).removeAttr("tabindex");
			focusables.eq(newIndex).attr("tabindex", "0");
			focusables.eq(newIndex).trigger("focus");
		}
	};

	/**
	 * Verifies if the chart is enabled for user actions or not.
	 *
	 * @returns {boolean} True if the chart is enabled for user actions, otherwise false.
	 * @private
	 */
	InteractiveBarChart.prototype._isChartEnabled = function() {
		return this.getSelectionEnabled() && this._bInteractiveMode;
	};

	/**
	 * Resizes the chart vertically. All use cases depend on the area height.
	 * Assuming that all the CSS files have already been loaded and they are available.
	 *
	 * @param {object} flags Some flags used for defining the visibility of specific chart elements
	 * @private
	 */
	InteractiveBarChart.prototype._resizeVertically = function(flags) {
		var iAreaHeight, iMargin, iBarHeight, $this = this.$(), bSwitchMode = false,
			$SelectionAreas = $this.find(".sapSuiteIBCBarInteractionArea"),
			iCurrentControlHeight = Math.round($this.height()), iInteractiveModeMarginDelta = 0,
			iVisibleBars = this._iVisibleBars;

		// margin
		if (this._bInteractiveMode) {
			iInteractiveModeMarginDelta = 1;
		}
		iMargin = parseInt($SelectionAreas.css("margin-bottom")) + parseInt($SelectionAreas.css("margin-top"));

		// selection area height
		const border_width = Number.parseFloat($SelectionAreas.css("border-bottom-width"));
		iAreaHeight = ((iCurrentControlHeight - ((iMargin + 2 * border_width) * iVisibleBars)) / iVisibleBars);

		// non-interactive mode
		if (iAreaHeight + iInteractiveModeMarginDelta < this._iAreaHeightInteractiveMinValue) {
			if (this._bInteractiveMode) {
				this._bInteractiveMode = false;
				bSwitchMode = true;
				$this.addClass("sapSuiteIBCNonInteractive");
				// set the focus area
				if (this.getSelectionEnabled()) {
					var $ActiveArea = this.$().find(".sapSuiteIBCBarInteractionArea[tabindex='0']");
					this._iActiveElement = $SelectionAreas.index($ActiveArea);
					$ActiveArea.removeAttr("tabindex");
					this.$().attr("tabindex", "0");
				}
				this.$().attr({
					"role": "button",
					"aria-multiselectable": "false",
					"aria-disabled": !this._isChartEnabled()
				});
			}
		} else if (!this._bInteractiveMode) {
			this._bInteractiveMode = true;
			bSwitchMode = true;
			$this.removeClass("sapSuiteIBCNonInteractive");
			// set the focus area
			if (this.getSelectionEnabled()) {
				this.$().removeAttr("tabindex");
				if (!this._iActiveElement || this._iActiveElement < 0) {
					this._iActiveElement = 0;
				}
				$SelectionAreas.eq(this._iActiveElement).attr("tabindex", "0");
			}
			this.$().attr({
				"role": "listbox",
				"aria-multiselectable": "true",
				"aria-disabled": !this._isChartEnabled()
			});
		}

		// set the tooltip in case of mode switch
		if (bSwitchMode) {
			if (this._isChartEnabled()) {
				$this.removeAttr("title");
				this._addInteractionAreaTooltip($SelectionAreas);
			} else {
				$SelectionAreas.removeAttr("title");
				$this.attr("title", this.getTooltip_AsString());
			}
		}

		// adjust the bar height
		$SelectionAreas.height(iAreaHeight);

		// adjust the paddings
		if (iAreaHeight <= this._iAreaHeightPaddingStage2) {
			$this.addClass("sapSuiteIBCStage2");
		} else {
			$this.removeClass("sapSuiteIBCStage2");
			if (iAreaHeight <= this._iAreaHeightPaddingStage1) {
				$this.addClass("sapSuiteIBCStage1");
			} else {
				$this.removeClass("sapSuiteIBCStage1");
			}
		}


		// adjust the font-size for value and label (based on exact dimension in float; if rounded, it will flicker)
		var $Bars = this.$().find(".sapSuiteIBCBar");
		if ($Bars.length > 0 && $Bars[0].getBoundingClientRect()) {
			iBarHeight = $Bars[0].getBoundingClientRect().height;
		}
		if (iBarHeight <= InteractiveBarChart.BAR_HEIGHT_FONT_SMALLER) {
			$this.addClass("sapSuiteIBCSmallFont");
		}

		// hide the labels inside the bars
		if (iBarHeight <= InteractiveBarChart.BAR_HEIGHT_LABEL_HIDE) {
			$this.find(".sapSuiteIBCBarValue").css("visibility", "hidden");
			flags.labelsVisible = false;
		} else {
			$this.find(".sapSuiteIBCBarValue").css("visibility", "inherit");
		}

		// hide the chart
		if (iAreaHeight < InteractiveBarChart.AREA_HEIGHT_MINVALUE) {
			$this.css("visibility", "hidden");
			flags.labelsVisible = false;
			flags.chartVisible = false;
		}
	};

	/**
	 * Resizes the chart horizontally. The use cases depend on the labels' area width and truncation.
	 * Assuming that all the CSS files have already been loaded and they are available.
	 *
	 * @param {object} flags Some flags used for defining the visibility of specific chart elements
	 * @private
	 */
	InteractiveBarChart.prototype._resizeHorizontally = function(flags) {
		if (!flags.chartVisible) {
			return;
		}

		var $this = this.$(),
			$SelectionAreas = $this.find(".sapSuiteIBCBarInteractionArea"),
			$BarLabel = $this.find(".sapSuiteIBCBarLabel"),
			iBarLabelWidth = parseFloat(this.getLabelWidth()) / 100 * $SelectionAreas.eq(0).width(),
			iBarLabelPaddingDelta = 0,
			iChartWidth = $this.width(), iBarHeight,
			bIsEllipsisActive = false;

		// font-size smaller
		if (iChartWidth < InteractiveBarChart.CHART_WIDTH_FONT_SMALLER) {
			$this.addClass("sapSuiteIBCSmallFont");
			// iBarLabelWidth to be recalculated because of possible width's changes related to font change
			iBarLabelWidth = parseFloat(this.getLabelWidth()) / 100 * $SelectionAreas.eq(0).width();
		}
		// account for changes in left padding of interactionarea present in fullwidth mode before calculating elipsis
		if (this._bFullWidth) {
			iBarLabelPaddingDelta = 6;
		}
		// verify if at least one label would be truncated if LabelArea was its original size
		for (var i = 0; i < $BarLabel.length; i++) {
			// check if label ellipsis would be active for the given labelWidth when fullWidth is not active
			$BarLabel.eq(i).css("width", iBarLabelWidth + "px");
			if ($BarLabel.eq(i).children(".sapSuiteIBCBarLabelText").prop("clientWidth") < $BarLabel.eq(i).children(".sapSuiteIBCBarLabelText").prop("scrollWidth") - iBarLabelPaddingDelta) {
				bIsEllipsisActive = true;
			}
			$BarLabel.eq(i).css("width", "100%");
		}

		// labels above
		if ( iBarLabelWidth < InteractiveBarChart.LABEL_WIDTH_MINVALUE && bIsEllipsisActive) {
			$this.addClass("sapSuiteIBCFullWidth");
			this._bFullWidth = true;
			this._calcBarsWidth();
		} else {
			$this.removeClass("sapSuiteIBCFullWidth");
			this._bFullWidth = false;
			this._calcBarsWidth();
		}

		// hide the chart
		var $Bars = this.$().find(".sapSuiteIBCBar");
		if ($Bars.length > 0 && $Bars[0].getBoundingClientRect()) {
			iBarHeight = $Bars[0].getBoundingClientRect().height;
		}
		if (iChartWidth < InteractiveBarChart.CHART_WIDTH_MINVALUE ||
				iBarHeight < InteractiveBarChart.BAR_HEIGHT_MINVALUE) {
			$this.css("visibility", "hidden");
			flags.labelsVisible = false;
			flags.chartVisible = false;
		} else if (iBarHeight <= InteractiveBarChart.BAR_HEIGHT_LABEL_HIDE) {
			$this.find(".sapSuiteIBCBarValue").css("visibility", "hidden");
			flags.labelsVisible = false;
		}
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._onResize = function() {
		var $this = this.$(),
			flags = {chartVisible : true, labelsVisible: true};

		// restore to normal state (needed to perform further processings)
		$this.css("visibility", "visible");
		$this.removeClass("sapSuiteIBCSmallFont");

		// responsiveness logic
		this._resizeVertically(flags);
		this._resizeHorizontally(flags);

		// labels
		if (flags.labelsVisible) {
			this._showValueOutsideBar();
		}
	};

	/**
	 * Deregisters all handlers.
	 *
	 * @private
	 */
	InteractiveBarChart.prototype._deregisterResizeHandler = function() {
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
			this._sResizeHandlerId = null;
		}
	};

	/**
	 * Adds a tooltip for every interaction area
	 *
	 * @param {jQuery} selectionAreas All valid selection areas inside the chart
	 * @private
	 */
	InteractiveBarChart.prototype._addInteractionAreaTooltip = function(selectionAreas) {
		var oBars = this.getBars(),
			$Element, iSelectionIndex;
		selectionAreas.each(function(index, element) {
			$Element = jQuery(element);
			iSelectionIndex = parseInt($Element.attr("data-sap-ui-ibc-selection-index"));
			$Element.attr("title", oBars[iSelectionIndex].getTooltip_AsString());
		});
	};

	/**
	 * Creates tooltip value for the chart.
	 * If tooltip was set to an empty string (using whitespaces) by the application or the tooltip was not set (null/undefined), the tooltip is generated by the control.
	 *
	 * @param {int} iChartIndex The current bar of the Chart
	 * @param {boolean} bInteractiveMode Current InteractionMode of the Chart
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveBarChart.prototype._createTooltipText = function(iChartIndex, bInteractiveMode) {
		var bIsFirst = true, oBars = this.getBars(), sBarTooltip,
			sTooltipText = "";
		for (var i = 0; i < this._iVisibleBars; i++) {
			if (bInteractiveMode) {
				if (iChartIndex && iChartIndex - 1 === i) {
					sBarTooltip = oBars[i].getTooltip_AsString();
					if (sBarTooltip) {
						sTooltipText += (bIsFirst ? "" : "\n") + sBarTooltip;
						bIsFirst = false;
						break;
					}
				}
			} else {// concatenate individual tooltips
				sBarTooltip = oBars[i]._getBarTooltip(this._bUseSemanticTooltip);
				if (sBarTooltip) {
					sTooltipText += (bIsFirst ? "" : "\n") + sBarTooltip;
					bIsFirst = false;
				}
			}
		}
		return sTooltipText;
	};

	InteractiveBarChart.prototype._bindMouseEnterLeaveHandler = function() {
		this.$().find(".sapSuiteIBCBarInteractionArea").on("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().find(".sapSuiteIBCBarInteractionArea").on("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	InteractiveBarChart.prototype._addTitleAttribute = function(event) {
		//Checks for adding title to the respective Bars
		if (this._isChartEnabled()	&& this._hasData()) {
			var oBarInteractiveArea = this.getDomRef().querySelectorAll(".sapSuiteIBCBarInteractionArea");
			var iPosInSet = event.target.getAttribute("aria-posinset");
			//If current Element is InteractionArea set title
			if (iPosInSet
				&& oBarInteractiveArea[parseInt(iPosInSet) - 1]
				&& !oBarInteractiveArea[parseInt(iPosInSet) - 1].getAttribute("title")) {
					oBarInteractiveArea[parseInt(iPosInSet) - 1].setAttribute("title", this.getTooltip_AsString(parseInt(iPosInSet)));
			} else {//If current Element is non InteractionArea, get the InteractionArea and set the title
				var oElement = event.target;
				var oClosestBarInteractiveArea = oElement.closest(".sapSuiteIBCBarInteractionArea");
				if (oClosestBarInteractiveArea
					&& !oClosestBarInteractiveArea.getAttribute("title")) {
						oClosestBarInteractiveArea.setAttribute("title", this.getTooltip_AsString(parseInt(oClosestBarInteractiveArea.getAttribute("aria-posinset"))));
				}
			}
		}
	};

	InteractiveBarChart.prototype._removeTitleAttribute = function(event) {
		var iPosInSet = event.target.getAttribute("aria-posinset");
		var oBarInteractiveArea = this.getDomRef().querySelectorAll(".sapSuiteIBCBarInteractionArea");
		//If current Element is InteractionArea remove the title
		if (iPosInSet
				&& oBarInteractiveArea[parseInt(iPosInSet) - 1]
				&& oBarInteractiveArea[parseInt(iPosInSet) - 1].getAttribute("title")) {
					oBarInteractiveArea[parseInt(iPosInSet) - 1].removeAttribute("title");
		} else {//If current Element is non InteractionArea, get the InteractionArea and remove the title
			var oElement = event.target;
			var oClosestBarInteractiveArea = oElement.closest(".sapSuiteIBCBarInteractionArea");
			if (oClosestBarInteractiveArea
				&& oClosestBarInteractiveArea.getAttribute("title")) {
					oClosestBarInteractiveArea.removeAttribute("title");
			}
		}
	};

	InteractiveBarChart.prototype._hasData = function() {
		return this.getBars().length > 0;
	};

	return InteractiveBarChart;
});
