/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/m/library",
	"sap/ui/core/Control",
	"sap/ui/core/ResizeHandler",
	"sap/ui/Device",
	"sap/m/FlexBox",
	"sap/base/Log",
	"./InteractiveDonutChartSegment",
	"sap/m/IllustratedMessage",
	"./InteractiveDonutChartRenderer",
	"sap/ui/core/Core",
	"sap/ui/core/Theming",
	"sap/ui/core/theming/Parameters"
],
	function(jQuery, library, MobileLibrary, Control, ResizeHandler, Device, FlexBox, Log, InteractiveDonutChartSegment, IllustratedMessage, InteractiveDonutChartRenderer, Core, Theming, Parameters) {
	"use strict";

	/**
	 * Constructor for InteractiveDonutChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The InteractiveDonutChart control belongs to a chart control group in the MicroChart library with a number of interactive features. These interactive features provide more information on a chart value.
	 * For example, by selecting a segment you can get more details on the displayed value.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.42.0
	 * @constructor
	 * @alias sap.suite.ui.microchart.InteractiveDonutChart
	 */
	var InteractiveDonutChart = Control.extend("sap.suite.ui.microchart.InteractiveDonutChart", /** @lends sap.suite.ui.microchart.InteractiveDonutChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * Number of segments to be displayed.
				 */
				displayedSegments: { type: "int", group: "Appearance", defaultValue: 3 },
				/**
				 * Switch which enables or disables selection.
				 */
				selectionEnabled: { type: "boolean", group: "Behavior", defaultValue: true },
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
			defaultAggregation: "segments",
			aggregations: {
				/**
				 * Aggregation which contains all segments.
				 */
				segments: {
					type: "sap.suite.ui.microchart.InteractiveDonutChartSegment",
					multiple: true,
					bindable: "bindable",
					defaultClass: InteractiveDonutChartSegment
				}
			},
			events: {
				/**
				 * Event is fired when a user has selected or deselected a segment or a legend entry.
				 */
				selectionChanged: {
					parameters: {
						/**
						 * Contains all selected segments.
						 */
						selectedSegments: { type: "sap.suite.ui.microchart.InteractiveDonutChartSegment[]" },
						/**
						 * The segment whose selection state has changed.
						 */
						segment: { type: "sap.suite.ui.microchart.InteractiveDonutChartSegment" },
						/**
						 * Indicates whether the segment "segment" is selected or not.
						 */
						selected: { type: "boolean" }
					}
				},
				/**
				 * The event is fired when the user presses the chart while its segments are not selectable in non-interactive mode. This is decided internally, depending on the size of the chart.
				 */
				press: {}
			},
			associations: {
				/**
				 * Association to controls which label this control (see WAI-ARIA attribute aria-labelledby).
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			}
		},
		renderer: InteractiveDonutChartRenderer
	});

	/* =========================================================== */
	/* Variables and Constants */
	/* =========================================================== */

	//legend segment constants
	InteractiveDonutChart.SEGMENT_CSSCLASS_SELECTED = "sapSuiteIDCLegendSegmentSelected";
	InteractiveDonutChart.SEGMENT_CSSCLASS_HIGHLIGHT = "sapSuiteIDCLegendSegmentHover";
	InteractiveDonutChart.CHART_SEGMENT_LABEL_MAXLENGTH = 7;

	//chart segment constants
	InteractiveDonutChart.CHART_SEGMENT = {
		CSSCLASS: "sapSuiteIDCChartSegment",
		CSSCLASS_HIGHLIGHT: "sapSuiteIDCChartSegmentHighlight",
		CSSCLASS_SELECTED: "sapSuiteIDCChartSegmentSelected"
	};
	//chart segment ghost constants
	InteractiveDonutChart.CHART_SEGMENT_GHOST = {
		CSSCLASS: "sapSuiteIDCChartSegmentGhost",
		CSSCLASS_HIGHLIGHT: "sapSuiteIDCChartSegmentGhostHighlight",
		CSSCLASS_SELECTED: "sapSuiteIDCChartSegmentGhostSelected"
	};
	// Responsiveness (cozy vs compact)
	InteractiveDonutChart.AREA_HEIGHT_INTERACTIVE_MINVALUE = 48;
	InteractiveDonutChart.AREA_HEIGHT_INTERACTIVE_MINVALUE_COMPACT = 32;
	InteractiveDonutChart.AREA_HEIGHT_SMALLFONT = 36;
	InteractiveDonutChart.AREA_HEIGHT_SMALLFONT_COMPACT = 32;
	// Responsiveness (cozy and compact)
	InteractiveDonutChart.AREA_HEIGHT_MINVALUE = 18;
	InteractiveDonutChart.LEGEND_HEIGHT_PADDING = 6; // the legend top and bottom padding
	InteractiveDonutChart.CHART_HEIGHT_MINVALUE = 110;
	InteractiveDonutChart.CHART_WIDTH_MINVALUE = 130;
	InteractiveDonutChart.CHART_WIDTH_HIDEDONUT_MINVALUE = 220;
	InteractiveDonutChart.CHART_WIDTH_LEGENDPADDING_MINVALUE = 300; // corresponds to legend width of 180px
	InteractiveDonutChart.CHART_WIDTH_FULLWIDTH_SMALLFONT_MINVALUE = 180;

	/* =========================================================== */
	/* API events */
	/* =========================================================== */
	/**
	 * Event handler for InteractiveDonutChart click event.
	 *
	 * Calls the method to update the selection change and fires selection changes event.
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onclick = function(oEvent) {
		// no click for disabled mode
		if (!this.getSelectionEnabled()) {
			return;
		}
		if (this._bInteractiveMode) {
			var $Target = jQuery(oEvent.target),
				iIndex = $Target.data("sap-ui-idc-selection-index"),
				aSegments = this.getAggregation("segments"),
				$Focusables = this.$().find(".sapSuiteIDCLegendSegment"),
				iHasFocus;

			if (!(iIndex >= 0)) {
				iIndex = $Target.closest(".sapSuiteIDCLegendSegment").data("sap-ui-idc-selection-index");
			}
			if (isNaN(iIndex) || iIndex < 0 || iIndex >= aSegments.length) {
				return;
			}
			this._toggleSelected(iIndex);

			//find out which segment has now tabindex = 0
			iHasFocus = $Focusables.index(this.$().find(".sapSuiteIDCLegendSegment[tabindex='0']"));
			this._switchTabindex(iHasFocus, iIndex, $Focusables);
		} else {
			this.firePress();
		}
	};

	/**
	 * Handler for up arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapup = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteIDCLegendSegment");
		var iIndex = $Focusables.index(oEvent.target);
		if ($Focusables.length > 0) {
			this._switchTabindex(iIndex, iIndex - 1, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Handler for down arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapdown = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteIDCLegendSegment");
		var iIndex = $Focusables.index(oEvent.target);
		if ($Focusables.length > 0) {
			this._switchTabindex(iIndex, iIndex + 1, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Handler for home button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsaphome = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteIDCLegendSegment");
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
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapend = function(oEvent) {
		var $Focusables = this.$().find(".sapSuiteIDCLegendSegment");
		var iIndex = $Focusables.index(oEvent.target);
		var iLength = $Focusables.length;
		if (iIndex !== iLength - 1 && iLength > 0) {
			this._switchTabindex(iIndex, iLength - 1, $Focusables);
		}
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Handler for enter button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapenter = function(oEvent) {
		if (this._bInteractiveMode) {
			var iIndex = this.$().find(".sapSuiteIDCLegendSegment").index(oEvent.target);
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
	 * Handler for left arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapleft = InteractiveDonutChart.prototype.onsapup;

	/**
	 * Handler for right arrow button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapright = InteractiveDonutChart.prototype.onsapdown;

	/**
	 * Handler for space button event
	 *
	 * @param {sap.ui.base.Event} oEvent Event which was fired
	 */
	InteractiveDonutChart.prototype.onsapspace = InteractiveDonutChart.prototype.onsapenter;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	InteractiveDonutChart.prototype.getTooltip_AsString = function() { //eslint-disable-line
		var sTooltip = this.getTooltip_Text();
		if (!sTooltip) { // tooltip will be set by the control
			sTooltip = this._createTooltipText();
		} else if (library._isTooltipSuppressed(sTooltip)) {
			sTooltip = null;
		}

		return sTooltip;
	};
	/**
	 * Gets all selected segments or an empty array if there is no segment selected yet
	 *
	 * @returns {sap.suite.ui.microchart.InteractiveDonutChartSegment[]} All selected segments
	 * @public
	 */
	InteractiveDonutChart.prototype.getSelectedSegments = function() {
		var aSegments, aSelectedSegments;

		aSegments = this.getAggregation("segments");
		aSelectedSegments = [];
		for (var i = 0; i < aSegments.length; i++) {
			if (aSegments[i].getSelected()) {
				aSelectedSegments.push(aSegments[i]);
			}
		}

		return aSelectedSegments;
	};

	/**
	 * Already selected segments will be unselected and members of selectedSegments attribute which are part of the segments aggregation will be set to selected state.
	 *
	 * @param {sap.suite.ui.microchart.InteractiveDonutChartSegment | sap.suite.ui.microchart.InteractiveDonutChartSegment[]} selectedSegments A segment element or an array of segments for which the status should be set to selected
	 * @returns {this} The current object in order to allow method chaining
	 * @public
	 */
	InteractiveDonutChart.prototype.setSelectedSegments = function(selectedSegments) {
		var aSegments, iIndex, iSelectedSegments;

		aSegments = this.getAggregation("segments");
		this._deselectAllSelectedSegments();
		if (!selectedSegments) {
			return this;
		}

		//function is overloaded: selectedSegments can be an array or a single instance
		if (selectedSegments instanceof InteractiveDonutChartSegment) {
			selectedSegments = [ selectedSegments ];
		}

		if (Array.isArray(selectedSegments)) {
			iSelectedSegments = selectedSegments.length;
			for (var i = 0; i < iSelectedSegments; i++) {
				iIndex = this.indexOfAggregation("segments", selectedSegments[i]);
				if (iIndex >= 0 && aSegments[iIndex]) {
					aSegments[iIndex].setProperty("selected", true, true);
				} else {
					Log.warning("Method setSelectedSegments called with invalid InteractiveDonutChartSegment element");
				}
			}
		}
		this.invalidate();

		return this;
	};

	/* =========================================================== */
	/* Protected methods */
	/* =========================================================== */
	InteractiveDonutChart.prototype.init = function() {
		this._oRb = Core.getLibraryResourceBundle("sap.suite.ui.microchart");
		this._bThemeApplied = false;
		this._oIllustratedMessageControl =  new IllustratedMessage({
			illustrationSize: MobileLibrary.IllustratedMessageSize.Base,
			illustrationType: MobileLibrary.IllustratedMessageType.NoData
		   });
		Core.ready(this._handleCoreInitialized.bind(this));
	};

	InteractiveDonutChart.prototype.onBeforeRendering = function() {
		this._bCompact = this._isCompact();
		this._bInteractiveMode = true;
		this._errorMessage = this.getErrorMessage();
		this._errorMessageTitle = this.getErrorMessageTitle();
		this._oIllustratedMessageControl.setTitle(this._errorMessageTitle);
		this._oIllustratedMessageControl.setDescription(this._errorMessage);
		var aSegments = this.getSegments();
		// visible segments are determined by the lower limit of displayedSegments and actual segments present in the aggregation segments
		this._iVisibleSegments = Math.min(this.getDisplayedSegments(), aSegments.length);

		// set the data needed for responsiveness
		this._setResponsivenessData();
		var $Segments = this.$().find(".sapSuiteIDCChartSegment, .sapSuiteIDCLegendSegment, .sapSuiteIDCChartSegmentGhost");

		//remove all event handlers
		$Segments.off();

		if (!this.data("_parentRenderingContext") && typeof this.getParent === "function") {
			this.data("_parentRenderingContext", this.getParent());
		}

		this._deregisterResizeHandler();

		this._bSemanticTooltip = false;
		for (var i = 0; i < this._iVisibleSegments; i++) {
			if (aSegments[i].getColor() !== MobileLibrary.ValueColor.Neutral) {
				this._bSemanticTooltip = true;
				break;
			}
		}
	};

	InteractiveDonutChart.prototype.onAfterRendering = function() {
		this._adjustToParent(this.$());
		library._checkControlIsVisible(this, this._onControlIsVisible);
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._onControlIsVisible = function() {
		if (this._bInteractiveMode) {
			this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
			this._onResize();
			// To check whether to render in compact density mode onAfterRendering of control.
			if (this.$().length > 0) {
				var bCompact = this._isCompact();
				if (bCompact !== this._bCompact) {
					this._bCompact = bCompact;
					this.invalidate();
				}
			}
			if (Device.system.desktop) {
				this._attachHoverHandlers();
			}
		}
	};

	InteractiveDonutChart.prototype.exit = function() {
		this._deregisterResizeHandler();
			this._oIllustratedMessageControl.destroy();
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */

	/**
	 * Handler for the core's init event. In order for the control to be rendered only if all themes
	 * are loaded and everything is properly initialized, we attach a theme check in here.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._handleCoreInitialized = function() {
		Theming.attachApplied(this._handleThemeApplied.bind(this));
	};

	/**
	 * Deselects all selected segments.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._deselectAllSelectedSegments = function() {
		var aSegments = this.getAggregation("segments");
		for (var i = 0; i < aSegments.length; i++) {
			if (aSegments[i].getSelected()) {
				aSegments[i].setProperty("selected", false, true);
			}
		}
	};

	/**
	 * Attaches hover handling functions to donut segments and legend entries.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._attachHoverHandlers = function() {
		var that = this,
			$Segments = this.$().find(".sapSuiteIDCChartSegment, .sapSuiteIDCLegendSegment, .sapSuiteIDCChartSegmentGhost");

		$Segments.on({
			mousemove: function() {
				that._handleHoverSync(jQuery(this).data("sap-ui-idc-selection-index"));
			},
			mouseleave: function() {
				that._handleHoverSync(jQuery(this).data("sap-ui-idc-selection-index"), true);
			}
		});
	};

	/**
	 * Executes jQuery class assignments based on the current segment's state and mousein/mouseout interaction flag.
	 *
	 * @param {int} index The index of the legend item or donut segment
	 * @param {boolean} out Indicated whether the mouse has left or entered the segment
	 * @private
	 */
	InteractiveDonutChart.prototype._handleHoverSync = function(index, out) {
		//show segment selection ghost
		if (this._bInteractiveMode) {
			var aSegments = this.getAggregation("segments"),
				bSelected = aSegments[index].getSelected();

			this._setSegmentInteractionState(InteractiveDonutChart.CHART_SEGMENT, index, bSelected, out);
			this._setSegmentInteractionState(InteractiveDonutChart.CHART_SEGMENT_GHOST, index, bSelected, out);
			this._setLegendEntryInteractionState(index, bSelected, out, aSegments[index]);
		}
	};

	/**
	 * Sets the interaction state and the title of a particular segment based on parameters.
	 *
	 * @param {Object} segment The segment to have interaction classes assigned
	 * @param {int} index The segment to have interaction classes assigned
	 * @param {boolean} selected Whether the segment is selected or not
	 * @param {boolean} out Whether the mouse has left or entered the segment
	 * @private
	 */
	InteractiveDonutChart.prototype._setSegmentInteractionState = function(segment, index, selected, out) {
		var $Segment = this.$().find("." + segment.CSSCLASS + "[data-sap-ui-idc-selection-index='" + index + "']");

		$Segment.removeClass(segment.CSSCLASS_SELECTED);
		$Segment.removeClass(segment.CSSCLASS_HIGHLIGHT);
		if ($Segment.length > 0 && $Segment[0].children.length > 0 ){
			$Segment[0].children[0].style.visibility = "hidden";
		}

		if (!out) { //mouse-in
			$Segment.addClass(segment.CSSCLASS_HIGHLIGHT);
			if ($Segment.length > 0 && $Segment[0].children.length > 0 ){
				$Segment[0].children[0].style.visibility = "visible";
			}
		}
		if (selected) {
			$Segment.addClass(segment.CSSCLASS_SELECTED);
		}
	};

	/**
	 * Sets the interaction state and the title of a particular legend entry based on parameters.
	 *
	 * @param {int} index The index of the legend entry to have interaction classes assigned
	 * @param {boolean} selected Whether the entry is selected or not
	 * @param {boolean} out Whether the mouse has left or entered the legend entry
	 * @param {boolean} oHoveredSegment Segment which has ben hovered
	 * @private
	 */
	InteractiveDonutChart.prototype._setLegendEntryInteractionState = function(index, selected, out, oHoveredSegment) {
		var $Entry = this.$().find(".sapSuiteIDCLegendSegment[data-sap-ui-idc-selection-index='" + index + "']");
		$Entry.removeClass(InteractiveDonutChart.SEGMENT_CSSCLASS_SELECTED);
		$Entry.removeClass(InteractiveDonutChart.SEGMENT_CSSCLASS_HIGHLIGHT);
		$Entry.removeAttr("title");

		if (!out) { //mouse-in
			$Entry.addClass(InteractiveDonutChart.SEGMENT_CSSCLASS_HIGHLIGHT);
			$Entry.attr("title", oHoveredSegment.getTooltip_AsString());
		}
		if (selected) {
			$Entry.addClass(InteractiveDonutChart.SEGMENT_CSSCLASS_SELECTED);
		}
	};

	/**
	 * Switches the mode from interactive to non-interactive depending on the logic behind
	 *
	 * @param {int} areaHeight The current area selection width
	 * @private
	 */
	InteractiveDonutChart.prototype._switchModeInteractive = function(areaHeight) {
		var $this = this.$(), bSwitchMode = false;
		if (areaHeight < this._iAreaHeightInteractiveMinValue) {
			bSwitchMode = true;
			if (this._bInteractiveMode) {
				this._bInteractiveMode = false;
				$this.addClass("sapSuiteIDCNonInteractive");
				// set the focus area
				if (this.getSelectionEnabled()) {
					var $ActiveArea = $this.find(".sapSuiteIDCLegendSegment[tabindex='0']");
					this._iActiveElement = $this.find(".sapSuiteIDCLegendSegment").index($ActiveArea);
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
			bSwitchMode = true;
			this._bInteractiveMode = true;
			$this.removeClass("sapSuiteIDCNonInteractive");
			// set the focus area
			if (this.getSelectionEnabled()) {
				$this.removeAttr("tabindex");
				if (!this._iActiveElement || this._iActiveElement < 0) {
					this._iActiveElement = 0;
				}
				$this.find(".sapSuiteIDCLegendSegment").eq(this._iActiveElement).attr("tabindex", "0");
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
				// remove tooltip from the svg segments
				$this.find(".sapSuiteIDCChartSegment title, .sapSuiteIDCChartSegmentGhost title").remove();
				// remove tooltip from the legend
				$this.find(".sapSuiteIDCLegendSegment").removeAttr("title");
				$this.attr("title", this.getTooltip_AsString());
			}
		}
	};

	/**
	 * Adds a tooltip for every interaction area
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._addInteractionAreaTooltip = function() {
		// add tooltip for svg segments
		var $Title,
			$Element,
			iSelectionIndex,
			$this = this.$(),
			aSegments = this.getSegments();

		$this.find(".sapSuiteIDCChartSegment, .sapSuiteIDCChartSegmentGhost").each(function(index, element) {
			$Element = jQuery(element);
			iSelectionIndex = parseInt($Element.attr("data-sap-ui-idc-selection-index"));
			// create virtual dom for retrieval of encoded text.
			$Title = jQuery("<div></div>").text(aSegments[iSelectionIndex].getTooltip_AsString());
			$Element.html("<title>" + $Title.getEncodedText() + "</title>");
		});

		// add tooltip for legend
		$this.find(".sapSuiteIDCLegendSegment").each(function(index, element) {
			$Element = jQuery(element);
			iSelectionIndex = parseInt($Element.attr("data-sap-ui-idc-selection-index"));
			$Element.attr("title", aSegments[iSelectionIndex].getTooltip_AsString());
		});
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._onResize = function() {
		var iInteractionAreaHeight, iInteractionAreaPadding,
			$this = this.$(),
			$InteractionArea = $this.find(".sapSuiteIDCLegendSegment"),
			$DonutContainer = $this.find(".sapSuiteIDCChart"),
			iContainerHorizontalPadding = parseInt($DonutContainer.css("padding-right")) + parseInt($DonutContainer.css("padding-left")),
			iCurrentControlHeight = $this.height(),
			iCurrentControlWidth = $this.width();

		// Interaction area height
		if (this._bInteractiveMode) {
			iInteractionAreaPadding = 2;
		} else {
			iInteractionAreaPadding = 1;
		}
		iInteractionAreaHeight = ((iCurrentControlHeight - InteractiveDonutChart.LEGEND_HEIGHT_PADDING - ($InteractionArea.length * iInteractionAreaPadding)) / $InteractionArea.length);
		$InteractionArea.height(iInteractionAreaHeight + "px");

		// chart visibility
		if (iCurrentControlWidth < InteractiveDonutChart.CHART_WIDTH_MINVALUE ||
			iCurrentControlHeight < InteractiveDonutChart.CHART_HEIGHT_MINVALUE ||
			iInteractionAreaHeight < InteractiveDonutChart.AREA_HEIGHT_MINVALUE) {
			$this.css("visibility", "hidden");
			return;
		}

		// restore visibility
		$this.css("visibility", "");

		// width adjustments
		if (iCurrentControlWidth < InteractiveDonutChart.CHART_WIDTH_HIDEDONUT_MINVALUE) {
			$this.addClass("sapSuiteIDCFullWidth");
			if (iCurrentControlWidth < InteractiveDonutChart.CHART_WIDTH_FULLWIDTH_SMALLFONT_MINVALUE) {
				$this.addClass("sapSuiteIDCFullWidthSmallFont");
			} else {
				$this.removeClass("sapSuiteIDCFullWidthSmallFont");
			}
		} else {
			$this.removeClass("sapSuiteIDCFullWidth");
			if ($DonutContainer.innerWidth() < $DonutContainer.innerHeight()) {
				$this.find(".sapSuiteIDCChartSVG").css("width", "100%").css("height", $DonutContainer.innerWidth() + "px");
			} else {
				$this.find(".sapSuiteIDCChartSVG").css("height", "100%").css("width", ($DonutContainer.innerHeight() - iContainerHorizontalPadding) + "px");
			}
			// small padding between chart and legend
			if (iCurrentControlWidth < InteractiveDonutChart.CHART_WIDTH_LEGENDPADDING_MINVALUE) {
				$this.addClass("sapSuiteIDCSmallLegendPadding");
			} else {
				$this.removeClass("sapSuiteIDCSmallLegendPadding");
			}
		}

		// height adjustments
		if (iInteractionAreaHeight < this._iAreaHeightSmallFontMinValue) {
			$this.addClass("sapSuiteIDCSmallFont");
		} else {
			$this.removeClass("sapSuiteIDCSmallFont");
		}

		// position legend and inline labels
		this._handleLegendEntrySizing();

		// determine non-interactive mode
		this._switchModeInteractive(iInteractionAreaHeight);
	};

	/**
	 * Sets max-width of the legend labels in order to have them truncated when legend item space is not sufficient.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._handleLegendEntrySizing = function() {
		var $Legend = this.$().find(".sapSuiteIDCLegend"),
			$Labels = $Legend.find(".sapSuiteIDCLegendLabel"),
			$Values = $Legend.find(".sapSuiteIDCLegendValue"),
			iValueWidthMax = 0;

		$Values.each(function() {
			var iValueWidth = jQuery(this).outerWidth(true); //outer width including margins
			iValueWidthMax = Math.max(iValueWidthMax, iValueWidth);
		});

		$Labels.css("width", "calc(100% - " + iValueWidthMax + "px)");
		$Values.css("width", iValueWidthMax + "px");
	};

	/**
	 * Verifies if the chart is enabled for user actions or not.
	 *
	 * @returns {boolean} True if the chart is enabled for user actions, otherwise false.
	 * @private
	 */
	InteractiveDonutChart.prototype._isChartEnabled = function() {
		return this.getSelectionEnabled() && this._bInteractiveMode;
	};

	/**
	 * Looks for the class 'sapUiSizeCompact' on the control and its parents to determine whether to render cozy or compact density mode.
	 *
	 * @returns {boolean} True if class 'sapUiSizeCompact' was found, otherwise false.
	 * @private
	 */
	InteractiveDonutChart.prototype._isCompact = function() {
		return jQuery("body").hasClass("sapUiSizeCompact") || this.$().is(".sapUiSizeCompact") || this.$().closest(".sapUiSizeCompact").length > 0;
	};

	/**
	 * Updates the selection state of the segment.
	 *
	 * @param {int} index The index of the segment
	 * @private
	 */
	InteractiveDonutChart.prototype._toggleSelected = function(index) {
		var oSegment = this.getSegments()[index],
			bSegmentSelected = !oSegment.getSelected(), //new state is reversed
			$InteractionArea = this.$("interactionArea-" + index),
			$Segment = this.$().find("." + InteractiveDonutChart.CHART_SEGMENT.CSSCLASS + "[data-sap-ui-idc-selection-index='" + index + "']"),
			$Ghost = this.$().find("." + InteractiveDonutChart.CHART_SEGMENT_GHOST.CSSCLASS + "[data-sap-ui-idc-selection-index='" + index + "']");

		oSegment.setProperty("selected", bSegmentSelected, true);
		$InteractionArea.attr("aria-selected", oSegment.getSelected());

		if (bSegmentSelected) {
			$InteractionArea.addClass(InteractiveDonutChart.SEGMENT_CSSCLASS_SELECTED);
			$Segment.addClass(InteractiveDonutChart.CHART_SEGMENT.CSSCLASS_SELECTED);
			$Ghost.addClass(InteractiveDonutChart.CHART_SEGMENT_GHOST.CSSCLASS_SELECTED);
		} else {
			$InteractionArea.removeClass(InteractiveDonutChart.SEGMENT_CSSCLASS_SELECTED);
			$Segment.removeClass(InteractiveDonutChart.CHART_SEGMENT.CSSCLASS_SELECTED);
			$Ghost.removeClass(InteractiveDonutChart.CHART_SEGMENT_GHOST.CSSCLASS_SELECTED);
		}

		this.fireSelectionChanged({
			selectedSegments: this.getSelectedSegments(),
			segment: oSegment,
			selected: bSegmentSelected
		});
	};

	/**
	 * Adds and removes the tabindex between elements to support keyboard navigation.
	 *
	 * @param {int} oldIndex The bar index whose tabindex was 0 previously
	 * @param {int} newIndex The bar index whose tabindex should be now set to 0
	 * @param {jQuery} focusables All the elements who can have a tabindex attribute
	 * @private
	 */
	InteractiveDonutChart.prototype._switchTabindex = function(oldIndex, newIndex, focusables) {
		if (oldIndex !== newIndex && oldIndex >= 0 && oldIndex < focusables.length && newIndex >= 0 && newIndex < focusables.length) {
			focusables.eq(oldIndex).removeAttr("tabindex");
			focusables.eq(newIndex).attr("tabindex", "0");
			focusables.eq(newIndex).trigger("focus");
		}
	};

	/**
	 * Adjusts the height and width of the whole control, if this is required, depending on parent control.
	 *
	 * @param {jQuery} control the control object
	 * @private
	 */
	InteractiveDonutChart.prototype._adjustToParent = function(control) {
		var oParent = this.data("_parentRenderingContext");
		if (oParent && oParent instanceof FlexBox) {
			var $Parent = oParent.$();
			var iParentWidth = parseFloat($Parent.innerWidth());
			var iParentHeight = parseFloat($Parent.innerHeight());
			control.outerWidth(iParentWidth);
			control.outerHeight(iParentHeight);
		}
	};

	/**
	 * Changes data for compact mode related to cozy (default) mode.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._setResponsivenessData = function() {
		if (this._bCompact) {
			this._iAreaHeightInteractiveMinValue = InteractiveDonutChart.AREA_HEIGHT_INTERACTIVE_MINVALUE_COMPACT;
			this._iAreaHeightSmallFontMinValue = InteractiveDonutChart.AREA_HEIGHT_SMALLFONT_COMPACT;
		} else {
			this._iAreaHeightInteractiveMinValue = InteractiveDonutChart.AREA_HEIGHT_INTERACTIVE_MINVALUE;
			this._iAreaHeightSmallFontMinValue = InteractiveDonutChart.AREA_HEIGHT_SMALLFONT;
		}
	};

	/**
	 * Checks the current content density and invalidates the control if it is changed in order to trigger a re-rendering.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._handleThemeApplied = function() {
		// we need to invalidate in every theme changed, as some colors are not defined by CSS but in rendering routine
		this._bThemeApplied = true;
		this._bCompact = this._isCompact();

		this.DEFAULT_SEGMENT_COLOR = Parameters.get({
			name: "_sap_suite_ui_microchart_InteractiveDonutChart_SegmentFillColor",
			callback: function(mParams) {
				this.DEFAULT_SEGMENT_COLOR = mParams;
				this.invalidate();
				Theming.detachApplied(this._handleThemeApplied.bind(this));
			}
		});

		if (this.DEFAULT_SEGMENT_COLOR) {
			this.invalidate();
			Theming.detachApplied(this._handleThemeApplied.bind(this));
		}
	};

	/**
	 * Deregisters all handlers.
	 *
	 * @private
	 */
	InteractiveDonutChart.prototype._deregisterResizeHandler = function() {
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
	 * @returns {string} The tooltip text
	 * @private
	 */
	InteractiveDonutChart.prototype._createTooltipText = function() {
		var bIsFirst = true, sSegmentTooltip,
			sTooltipText = "", oSegments = this.getSegments();
		for (var i = 0; i < this._iVisibleSegments; i++) {
			// concatenate individual tooltips
			if (!oSegments[i]) {
				break;
			}
			sSegmentTooltip = oSegments[i]._getSegmentTooltip();
			if (sSegmentTooltip) {
				sTooltipText += (bIsFirst ? "" : "\n") + sSegmentTooltip;
				bIsFirst = false;
			}
		}

		return sTooltipText;
	};

	return InteractiveDonutChart;
});
