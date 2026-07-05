/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	'./library',
	'sap/m/library',
	'sap/ui/core/Control',
	'sap/suite/ui/microchart/InteractiveLineChartPoint',
	'sap/ui/core/ResizeHandler',
	'sap/m/FlexBox',
	"sap/base/Log",
	"sap/m/IllustratedMessage",
	"./InteractiveLineChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming"
],
	function(
		jQuery,
		library,
		MobileLibrary,
		Control,
		InteractiveLineChartPoint,
		ResizeHandler,
		FlexBox,
		Log,
		IllustratedMessage,
		InteractiveLineChartRenderer,
		Core,
		Theming
	) {
	"use strict";

	/**
	 * Constructor for a new InteractiveLineChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The InteractiveLineChart control belongs to a chart control group in the MicroChart library having a number of interactive features.
	 * @extends sap.ui.core.Control
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.42.0
	 * @constructor
	 * @alias sap.suite.ui.microchart.InteractiveLineChart
	 */
	var InteractiveLineChart = Control.extend("sap.suite.ui.microchart.InteractiveLineChart", /** @lends sap.suite.ui.microchart.InteractiveLineChart.prototype */ {
		metadata : {
			library : "sap.suite.ui.microchart",
			properties : {
				/**
				 * The maximum number of points to be displayed on the chart.
				 */
				displayedPoints : {
					type : "int",
					group : "Appearance",
					defaultValue : 6
				},
				/**
				 * Abstract invisible point outside of the chart that ensures that the graph flows smoothly into the visible part of the chart.
				 */
				precedingPoint: {
					type: "float",
					group: "Data",
					defaultValue: 0
				},
				/**
				 * Abstract invisible point outside of the chart that ensures that the graph flows smoothly out of the visible part of the chart.
				 */
				succeedingPoint: {
					type: "float",
					group: "Data",
					defaultValue: 0
				},
				/**
				 * If this property is set to true, one or multiple points are selectable.
				 */
				selectionEnabled : {
					type : "boolean",
					group : "Behavior",
					defaultValue : true
				},
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
			defaultAggregation: "points",
			aggregations : {
				/**
				 * Points displayed in the chart.
				 */
				points : {type : "sap.suite.ui.microchart.InteractiveLineChartPoint", multiple : true, bindable : "bindable", defaultClass: InteractiveLineChartPoint}
			},
			events : {
				/**
				 * Event is fired when a user has selected or deselected a point.
				 */
				selectionChanged : {
					parameters : {
						/**
						 * All points which are in selected state.
						 */
						selectedPoints : {type : "sap.suite.ui.microchart.InteractiveLineChartPoint[]"},
						/**
						 * The point which is pressed.
						 */
						point : {type : "sap.suite.ui.microchart.InteractiveLineChartPoint"},
						/**
						 * The selection state of the point which is pressed.
						 */
						selected : {type : "boolean"}
					}
				},
				/**
				 * The event is fired only in non-interactive mode when the user presses the chart; in this mode, the points and surrounding areas are not selectable. Non-interactive mode is decided upon internally, depending on the size of the areas surrounding the points.
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
		renderer: InteractiveLineChartRenderer
	});

	/* =========================================================== */
	/* Variables and Constants */
	/* =========================================================== */

	InteractiveLineChart.MAX_SCALED_CANVAS_VALUE = 99;
	InteractiveLineChart.MIN_SCALED_CANVAS_VALUE = 1;
	// Responsiveness (cozy vs compact)
	InteractiveLineChart.AREA_WIDTH_INTERACTIVE_MINVALUE = 48;
	InteractiveLineChart.AREA_WIDTH_INTERACTIVE_MINVALUE_COMPACT = 32;
	// Responsiveness (cozy and compact)
	InteractiveLineChart.CHART_HEIGHT_MINVALUE = 106;
	InteractiveLineChart.AREA_WIDTH_MINVALUE = 24;
	InteractiveLineChart.LABEL_WIDTH_MINVALUE = 32;
	InteractiveLineChart.AREA_WIDTH_SMALLFONT = 36;

	/* =========================================================== */
	/* Life-cycle Handling */
	/* =========================================================== */

	InteractiveLineChart.prototype.init = function(){
		this._oRb = Core.getLibraryResourceBundle("sap.suite.ui.microchart");
		this._aNormalizedValues = [];
		this._iAreaWidthInteractiveMinValue = InteractiveLineChart.AREA_WIDTH_INTERACTIVE_MINVALUE;
		this._bInteractiveMode = true; // in non-interactive mode, the user cannot interact with the chart (user actions are ignored)
		this._fNormalizedZero = 0;
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
	InteractiveLineChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	InteractiveLineChart.prototype.onBeforeRendering = function() {
		this._bCompact = this._isCompact();
		this._bInteractiveMode = true;
		var aPoints = this.getPoints();
		this._errorMessage = this.getErrorMessage();
		this._errorMessageTitle = this.getErrorMessageTitle();
		this._oIllustratedMessageControl.setTitle(this._errorMessageTitle);
		this._oIllustratedMessageControl.setDescription(this._errorMessage);
		// visible points number is determined by the lower limit between the displayedPoints property value and the actual number of available points
		this._iVisiblePointsCount = Math.min(this.getDisplayedPoints(), aPoints.length);
		// set the data needed for responsiveness
		this._setResponsivenessData();
		if (!this.data("_parentRenderingContext") && typeof this.getParent === "function") {
			this.data("_parentRenderingContext", this.getParent());
		}
		this._updateNormalizedValues();
		this._deregisterResizeHandler();
		this._bSemanticTooltip = false;
		for (var i = 0; i < this._iVisiblePointsCount; i++) {
			if (aPoints[i].getColor() !== MobileLibrary.ValueColor.Neutral) {
				this._bSemanticTooltip = true;
				break;
			}
		}
	};

	InteractiveLineChart.prototype.onAfterRendering = function() {
		this._adjustToParent();
		library._checkControlIsVisible(this, this._onControlIsVisible);
		this._bindMouseEnterLeaveHandler();//Bind mouse Enter/Leave
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._onControlIsVisible = function() {
		this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		this._onResize();
	};

	InteractiveLineChart.prototype.exit = function() {
		this._deregisterResizeHandler();
		this._oIllustratedMessageControl.destroy();
	};

	/* =========================================================== */
	/* Event handling */
	/* =========================================================== */

	/**
	 * Handler for click
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onclick = function (oEvent) {
		// no click for disabled mode
		if (!this.getSelectionEnabled()) {
			return;
		}

		if (this._bInteractiveMode) {
			var $InteractionSection = jQuery(oEvent.target).parent();
			var iHasFocus, $Focusables = this.$().find(".sapSuiteILCInteractionArea");
			var iIndex = this.$().find(".sapSuiteILCSection").index($InteractionSection);
			if (iIndex >= 0) {
				this._toggleSelected(iIndex);
				iHasFocus = $Focusables.index(this.$().find(".sapSuiteILCInteractionArea[tabindex='0']"));
				this._switchTabindex(iHasFocus, iIndex, $Focusables);
			}
		} else {
			this.firePress();
		}
	};

	/**
	 * Handler for left arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapleft = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteILCInteractionArea");
		var iIndex = $Focusables.index(oEvent.target);
		if ($Focusables.length > 0) {
			this._switchTabindex(iIndex, iIndex - 1, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Handler for right arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapright = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteILCInteractionArea");
		var iIndex = $Focusables.index(oEvent.target);
		if ($Focusables.length > 0) {
			this._switchTabindex(iIndex, iIndex + 1, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Handler for up arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapup = InteractiveLineChart.prototype.onsapleft;

	/**
	 * Handler for down arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapdown = InteractiveLineChart.prototype.onsapright;

	/**
	 * Handler for enter button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapenter = function(oEvent) {
		if (this._bInteractiveMode) {
			var iIndex = this.$().find(".sapSuiteILCInteractionArea").index(oEvent.target);
			if (iIndex !== -1) {
				this._toggleSelected(iIndex);
			}
			oEvent.preventDefault();
			oEvent.stopImmediatePropagation();
		} else {
			this.firePress();
		}
	};

	/**
	 * Handler for space button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapspace = InteractiveLineChart.prototype.onsapenter;

	/**
	 * Handler for home button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsaphome = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteILCInteractionArea");
		var iIndex = $Focusables.index(oEvent.target);
		if (iIndex !== 0 && $Focusables.length > 0) {
			this._switchTabindex(iIndex, 0, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Handler for end button event
	 *
	 * @param {sap.ui.base.Event} oEvent which was fired
	 */
	InteractiveLineChart.prototype.onsapend = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteILCInteractionArea");
		var iIndex = $Focusables.index(oEvent.target), iLength = $Focusables.length;
		if (iIndex !== iLength - 1 && iLength > 0) {
			this._switchTabindex(iIndex, iLength - 1, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	InteractiveLineChart.prototype.getTooltip_AsString = function(iChartIndex) { //eslint-disable-line
		//Interaction mode
		if (this._isChartEnabled()){
			sTooltip = this._createTooltipText(iChartIndex, true);
			if (!sTooltip && library._isTooltipSuppressed(sTooltip)) {
				sTooltip = null;
			}
		} else {//non Interaction mode
			var sTooltip = this.getTooltip_Text();
			if (!sTooltip) { //Tooltip will be set by control
				sTooltip = this._createTooltipText();
			} else if (library._isTooltipSuppressed(sTooltip)) {
				sTooltip = null;
			}
		}
		return sTooltip;
	};

	/**
	 * Retrieves the selected point elements from the points aggregation and returns them.
	 *
	 * @returns {sap.suite.ui.microchart.InteractiveLineChartPoint[]} Array of sap.suite.ui.microchart.InteractiveLineChartPoint instances.
	 * @public
	 */
	InteractiveLineChart.prototype.getSelectedPoints = function() {
		var aSelectedPoints = [], aPoints = this.getAggregation("points");

		for (var i = 0; i < aPoints.length; i++) {
			if (aPoints[i].getSelected()) {
				aSelectedPoints.push(aPoints[i]);
			}
		}
		return aSelectedPoints;
	};

	/**
	 * Already selected points will be deselected and members of the selectedPoints attribute which are part of the points aggregation will be set to selected state.
	 *
	 * @param {sap.suite.ui.microchart.InteractiveLineChartPoint | sap.suite.ui.microchart.InteractiveLineChartPoint[]} selectedPoints A point element or an array of points for which the status should be set to selected.
	 * @returns {this} this to allow method chaining
	 * @public
	 */
	InteractiveLineChart.prototype.setSelectedPoints = function(selectedPoints) {
		var aPoints = this.getAggregation("points"),
			iIndex;

		this._deselectAllSelectedPoints();
		if (!selectedPoints) {
			return this;
		}
		if (selectedPoints instanceof InteractiveLineChartPoint) {
			selectedPoints = [selectedPoints];
		}

		if (Array.isArray(selectedPoints)) {
			for (var i = 0; i < selectedPoints.length; i++) {
				iIndex = this.indexOfAggregation("points", selectedPoints[i]);
				if (iIndex >= 0) {
					aPoints[iIndex].setProperty("selected", true, true);
				} else {
					Log.warning("setSelectedPoints method called with invalid InteractiveLineChartPoint element");
				}
			}
		}
		this.invalidate();
		return this;
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	InteractiveLineChart.prototype._fnIsNumber = function(value) {
		return typeof value === 'number' && !isNaN(value) && isFinite(value);
	};


	/**
	 * Looks for the class '.sapUiSizeCompact' on the control and its parents to determine whether to render cozy or compact density mode.
	 *
	 * @returns {boolean} True if class 'sapUiSizeCompact' was found, otherwise false.
	 * @private
	 */
	InteractiveLineChart.prototype._isCompact = function() {
		return jQuery("body").hasClass("sapUiSizeCompact") || this.$().is(".sapUiSizeCompact") || this.$().closest(".sapUiSizeCompact").length > 0;
	};

	/**
	 * Changes data for compact mode related to cozy (default) mode.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._setResponsivenessData = function() {
		if (this._bCompact) {
			this._iAreaWidthInteractiveMinValue = InteractiveLineChart.AREA_WIDTH_INTERACTIVE_MINVALUE_COMPACT;
		} else {
			this._iAreaWidthInteractiveMinValue = InteractiveLineChart.AREA_WIDTH_INTERACTIVE_MINVALUE;
		}
	};

	/**
	 * Checks the current content density and invalidates the control if it is changed in order to trigger a re-rendering.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._handleThemeApplied = function() {
		// we need to invalidate in every theme changed, as some colors are not defined by CSS but in rendering routine
		this._bThemeApplied = true;
		this._bCompact = this._isCompact();
		// removed invalidate after testing by switching into various themes, no observed changes/issues, also
		// no visible hardcoded css in the renderer file
		this.invalidate();
		Theming.detachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * Sets all the currently selected point elements as not selected.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._deselectAllSelectedPoints = function() {
		var aPoints = this.getPoints();
		for (var i = 0; i < aPoints.length; i++) {
			if (aPoints[i].getSelected()) {
				aPoints[i].setProperty("selected", false, true);
			}
		}
	};

	/**
	 * Adds and removes the tabindex between elements to support keyboard navigation.
	 *
	 * @param {int} oldIndex which is the column index whose tabindex is 0 previously.
	 * @param {int} newIndex which is the column index whose tabindex should be set to 0 this time.
	 * @param {jQuery} focusables all the elements who has tabindex attribute.
	 * @private
	 */
	InteractiveLineChart.prototype._switchTabindex = function(oldIndex, newIndex, focusables) {
		if (oldIndex >= 0 && oldIndex < focusables.length && newIndex >= 0 && newIndex < focusables.length) {
			focusables.eq(oldIndex).removeAttr("tabindex");
			focusables.eq(newIndex).attr("tabindex", "0");
			focusables.eq(newIndex).trigger("focus");
		}
	};

	/**
	 * Updates the selection state of the point element.
	 *
	 * @param {int} index The index of the point element
	 * @private
	 */
	InteractiveLineChart.prototype._toggleSelected = function(index) {
		var oPoint = this.getPoints()[index],
			$SectionArea = this.$("point-area-" + index),
			$Point = this.$("point-" + index);

		if (oPoint.getSelected()) {
			$SectionArea.add($Point).removeClass("sapSuiteILCSelected");
			oPoint.setProperty("selected", false, true);
		} else {
			$SectionArea.add($Point).addClass("sapSuiteILCSelected");
			oPoint.setProperty("selected", true, true);
		}

		$SectionArea.find(".sapSuiteILCInteractionArea").attr("aria-selected", oPoint.getSelected());
		this.fireSelectionChanged({
			selectedPoints: this.getSelectedPoints(),
			point: oPoint,
			selected: oPoint.getSelected()
		});
	};

	/**
	 * Normalizes the values of the points on the scale 0 to 100.
	 * NA values are normalized to 0.
	 * If there is only one value except NAs then it is normalized to 50.
	 * The created values are written to the private array. The points aggregation remains unchanged.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._updateNormalizedValues = function() {
		var aPoints = this.getPoints(),
			nPointLength = aPoints.length,
			i = 0;

		this.nMax = -Number.MAX_VALUE;
		this.nMin = Number.MAX_VALUE;
		this._aNormalizedValues = [];

		for (i = 0; i < nPointLength; i++) {
			if (!aPoints[i]._bNullValue) {
				var fValue = aPoints[i].getValue();
				this.nMax =  Math.max(this.nMax, fValue);
				this.nMin =  Math.min(this.nMin, fValue);
			}
		}
		var nRange = (this.nMax != -Number.MAX_VALUE && this.nMin !== Number.MAX_VALUE) ? this.nMax - this.nMin : 0;
		var fnScaleValue = function(fValue) {
			if (typeof fValue !== "undefined") {
				var nScaledValue = (fValue - this.nMin) / nRange;
				return InteractiveLineChart.MIN_SCALED_CANVAS_VALUE + nScaledValue * (InteractiveLineChart.MAX_SCALED_CANVAS_VALUE - InteractiveLineChart.MIN_SCALED_CANVAS_VALUE);
			}

			return null;
		}.bind(this);

		for (i = 0; i < nPointLength; i++) {
			if (aPoints[i]._bNullValue) {
				this._aNormalizedValues.push(0);
			} else {
				this._aNormalizedValues.push(nRange ? fnScaleValue(aPoints[i].getValue()) : 50);
			}
		}

		if (aPoints.length > 0) {
			this._fNormalizedPrecedingPoint = this._bIsPrecedingPointSet && !aPoints[0]._bNullValue ? fnScaleValue(this.getPrecedingPoint()) : null;
			this._fNormalizedSucceedingPoint = this._bIsSucceedingPointSet && !aPoints[aPoints.length - 1]._bNullValue ? fnScaleValue(this.getSucceedingPoint()) : null;
		}

		// show divider only for mixed values
		if (this.nMin < 0 && this.nMax > 0) {
			this._fNormalizedZero = (Math.max(0 - this.nMin, 0) / nRange) * 100;
		} else {
			this._fNormalizedZero = null;
		}
	};

	/**
	 * Adjusts the height and width of the whole control if this is required depending on parent control.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._adjustToParent = function() {
		if (this.data("_parentRenderingContext") && this.data("_parentRenderingContext") instanceof FlexBox) {
			// Subtracts two pixels, otherwise there's not enough space for the outline, and the chart won't be rendered properly
			var $Parent = this.data("_parentRenderingContext").$();
			var iParentWidth = parseFloat($Parent.width()) - 2;
			var iParentHeight = parseFloat($Parent.height()) - 2;
			this.$().outerWidth(iParentWidth);
			this.$().outerHeight(iParentHeight);
		}
	};

	/**
	 * Verifies if the chart is enabled for user actions or not.
	 *
	 * @returns {boolean} True if the chart is enabled for user actions, otherwise false.
	 * @private
	 */
	InteractiveLineChart.prototype._isChartEnabled = function() {
		return this.getSelectionEnabled() && this._bInteractiveMode;
	};

	/**
	 * Switches the mode from interactive to non-interactive depending on the logic behind
	 *
	 * @param {int} areaWidth The current area selection width
	 * @private
	 */
	InteractiveLineChart.prototype._switchModeInteractive = function(areaWidth) {
		var $this = this.$(),
			bSwitchMode = false;
		if (areaWidth < this._iAreaWidthInteractiveMinValue) {
			if (this._bInteractiveMode) {
				this._bInteractiveMode = false;
				bSwitchMode = true;
				$this.addClass("sapSuiteILCNonInteractive");
				// set the focus area
				if (this.getSelectionEnabled()) {
					var $ActiveArea = $this.find(".sapSuiteILCInteractionArea[tabindex='0']");
					this._iActiveElement = $this.find(".sapSuiteILCInteractionArea").index($ActiveArea);
					$ActiveArea.removeAttr("tabindex");
					$this.attr("tabindex", "0");
				}
				$this.attr({
					"role": "button",
					"aria-multiselectable": "false",
					"aria-disabled": !this._isChartEnabled()
				});
			}
		} else if (!this._bInteractiveMode) {
			this._bInteractiveMode = true;
			bSwitchMode = true;
			$this.removeClass("sapSuiteILCNonInteractive");
			// set the focus area
			if (this.getSelectionEnabled()) {
				$this.removeAttr("tabindex");
				if (!this._iActiveElement || this._iActiveElement < 0) {
					this._iActiveElement = 0;
				}
				$this.find(".sapSuiteILCInteractionArea").eq(this._iActiveElement).attr("tabindex", "0");
			}
			$this.attr({
				"role": "listbox",
				"aria-multiselectable": "true",
				"aria-disabled": !this._isChartEnabled()
			});
		}

		//set the tooltip in case of mode switch
		if (bSwitchMode) {
			if (this._isChartEnabled()) {
				$this.removeAttr("title");
				this._addInteractionAreaTooltip();
			} else {
				$this.find(".sapSuiteILCInteractionArea").removeAttr("title");
				$this.attr("title", this.getTooltip_AsString());
			}
		}
	};

	/**
	 * Adds a tooltip for every interaction area
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._addInteractionAreaTooltip = function() {
		var $InteractionAreas = this.$().find(".sapSuiteILCInteractionArea"),
			oPoints = this.getPoints();
		$InteractionAreas.each(function(index, element) {
			jQuery(element).attr("title", oPoints[index].getTooltip_AsString());
		});
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._onResize = function() {
		var iInteractionAreaWidth,
		bBottomLabelTruncated = false,
		$this = this.$(),
		$TopLabels = $this.find(".sapSuiteILCToplabel"),
		$BottomLabels = $this.find(".sapSuiteILCBottomText"),
		$InteractionArea = $this.find(".sapSuiteILCInteractionArea"),
		iCurrentControlHeight = $this.height(),
		iCurrentControlWidth = $this.width(),
		nPointLength = this.getPoints().length,
		$FirstBottomLabel = $this.find(".sapSuiteILCSection:first-child .sapSuiteILCBottomText"),
		$LastBottomLabel = $this.find(".sapSuiteILCSection:last-child .sapSuiteILCBottomText");

		// area width
		if ($InteractionArea.length > 0) {
			iInteractionAreaWidth = $InteractionArea[0].getBoundingClientRect().width;
		}

		// chart visibility
		if (iInteractionAreaWidth < InteractiveLineChart.AREA_WIDTH_MINVALUE || iCurrentControlHeight < InteractiveLineChart.CHART_HEIGHT_MINVALUE) {
			$this.css("visibility", "hidden");
			return;
		} else {
			$this.css("visibility", "");
		}

		// non-interactive mode
		this._switchModeInteractive(iInteractionAreaWidth);

		// small font for labels and values
		if (iInteractionAreaWidth <= InteractiveLineChart.AREA_WIDTH_SMALLFONT) {
			$this.addClass("sapSuiteILCSmallFont");
		} else {
			$this.removeClass("sapSuiteILCSmallFont");
		}

		// temporarily reset bottom labels
		$this.removeClass("sapSuiteILCExpandedLabels");
		$FirstBottomLabel.add($LastBottomLabel).css("width", "");

		// value labels visibility (hide them if they do not fit in the interaction area)
		for (var i = 0; i < nPointLength; i++) {
			if ($TopLabels.eq(i).prop("offsetWidth") < $TopLabels.eq(i).prop("scrollWidth")) {
				$TopLabels.eq(i).css("visibility", "hidden");
			} else {
				$TopLabels.eq(i).css("visibility", "");
			}
			if ($BottomLabels.eq(i).prop("offsetWidth") < $BottomLabels.eq(i).prop("scrollWidth")) {
				bBottomLabelTruncated = true;
			}
		}

		// bottom labels
		if (iInteractionAreaWidth < InteractiveLineChart.LABEL_WIDTH_MINVALUE && bBottomLabelTruncated) {
			$this.addClass("sapSuiteILCExpandedLabels");
			$FirstBottomLabel.add($LastBottomLabel).css("width", (iCurrentControlWidth / 2) - 4 + "px");
		} else {
			$this.removeClass("sapSuiteILCExpandedLabels");
			$FirstBottomLabel.add($LastBottomLabel).css("width", "");
		}
	};

	/**
	 * Deregisters all handlers.
	 *
	 * @private
	 */
	InteractiveLineChart.prototype._deregisterResizeHandler = function() {
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
			this._sResizeHandlerId = null;
		}
	};

	/**
	 * Creates the tooltip value for the chart.
	 * If the tooltip was set to an empty string (using whitespaces) by the application or the tooltip was not set (null/undefined),
	 * the tooltip gets internally generated by the control.
	 *
	 * @param {int} iChartIndex The current point of the Chart
	 * @param {boolean} bInteractiveMode Current InteractionMode of the Chart
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveLineChart.prototype._createTooltipText = function(iChartIndex, bInteractiveMode) {
		var bIsFirst = true, sAreaTooltip,
			sTooltipText = "",
			oPoints = this.getPoints();
		for (var i = 0; i < this._iVisiblePointsCount; i++) {
			//Create Individual Tooltip
			if (bInteractiveMode) {
				if (iChartIndex && iChartIndex - 1 === i) {
					sAreaTooltip = oPoints[i].getTooltip_AsString();
					if (sAreaTooltip) {
						sTooltipText += (bIsFirst ? "" : "\n") + sAreaTooltip;
						bIsFirst = false;
						break;
					}
				}
			} else {//Create Concatinated Tooltip
				sAreaTooltip = oPoints[i]._getAreaTooltip();
				if (sAreaTooltip) {
					sTooltipText += (bIsFirst ? "" : "\n") + sAreaTooltip;
					bIsFirst = false;
				}
			}
		}
		return sTooltipText;
	};


	InteractiveLineChart.prototype.setPrecedingPoint = function(fValue) {
		this._bIsPrecedingPointSet = this._fnIsNumber(fValue);
		return this.setProperty("precedingPoint", this._bIsPrecedingPointSet ? fValue : NaN);

	};

	InteractiveLineChart.prototype.setSucceedingPoint = function(fValue) {
		this._bIsSucceedingPointSet = this._fnIsNumber(fValue);
		return this.setProperty("succeedingPoint", this._bIsSucceedingPointSet ? fValue : NaN);

	};

	InteractiveLineChart.prototype._bindMouseEnterLeaveHandler = function() {
		this.$().find(".sapSuiteILCInteractionArea").on("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().find(".sapSuiteILCInteractionArea").on("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	InteractiveLineChart.prototype._addTitleAttribute = function(event) {
		var iPosInSet = event.target.getAttribute("aria-posinset");
		var oLineInteractiveArea = this.getDomRef().querySelectorAll(".sapSuiteILCInteractionArea");
		//Checks for adding title to the respective Point
		if (this._isChartEnabled()
			&& this._hasData()
			&& oLineInteractiveArea[parseInt(iPosInSet) - 1]
			&& !oLineInteractiveArea[parseInt(iPosInSet) - 1].getAttribute("title")) {
			oLineInteractiveArea[parseInt(iPosInSet) - 1].setAttribute("title", this.getTooltip_AsString(parseInt(iPosInSet)));
		}
	};

	InteractiveLineChart.prototype._removeTitleAttribute = function(event) {
		var iPosInSet = event.target.getAttribute("aria-posinset");
		var oLineInteractiveArea = this.getDomRef().querySelectorAll(".sapSuiteILCInteractionArea");
		//Checks for removing title to the respective Point
		if (oLineInteractiveArea[parseInt(iPosInSet) - 1]
			&& oLineInteractiveArea[parseInt(iPosInSet) - 1].getAttribute("title")) {
			oLineInteractiveArea[parseInt(iPosInSet) - 1].removeAttribute("title");
		}
	};

	InteractiveLineChart.prototype._hasData = function() {
		return this.getPoints().length > 0;
	};

	return InteractiveLineChart;
});
