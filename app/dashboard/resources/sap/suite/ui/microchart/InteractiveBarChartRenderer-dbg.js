/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([ "sap/m/library" ],
	function(MobileLibrary) {
	"use strict";

	/**
	* InteractiveBarChartRenderer renderer.
	* @namespace
	*/
	var InteractiveBarChartRenderer = {
		apiVersion: 2
	};

	// bar direction positive constants
	InteractiveBarChartRenderer.BAR_DIRECTION_POSITIVE = {
		NAME: "positive",
		WRAPPER_CSSCLASS: "sapSuiteIBCBarWrapperPositive",
		CSSCLASS: "sapSuiteIBCBarPositive"
	};
	// bar direction negative constants
	InteractiveBarChartRenderer.BAR_DIRECTION_NEGATIVE = {
		NAME: "negative",
		WRAPPER_CSSCLASS: "sapSuiteIBCBarWrapperNegative",
		CSSCLASS: "sapSuiteIBCBarNegative"
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 */
	InteractiveBarChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}
		if (oControl.getShowError()) {
			oRm.openStart("div", oControl);
			oRm.class("sapSuiteUiMicroChartNoData");
			oRm.openEnd();
			oRm.renderControl(oControl._oIllustratedMessageControl);
			oRm.close("div");
			return;
		}

		var aBars = oControl.getBars(),
			iBarsNum =  Math.min(oControl.getDisplayedBars(), aBars.length);

		oRm.openStart("div", oControl);
		oRm.class("sapSuiteIBC");

		// tooltip for chart (non-interactive mode)
		if (!oControl._isChartEnabled()) {
			var sAreaTooltip = oControl.getTooltip_AsString();
			if (typeof sAreaTooltip === "string" || sAreaTooltip instanceof String) {
				oRm.attr("title", sAreaTooltip);
			}
		}

		// container accessibility
		var oAccOptions = {};
		oAccOptions.role = "listbox";
		oAccOptions.roledescription = oControl._oRb.getText("INTERACTIVEBARCHART");
		oAccOptions.multiselectable = true;
		oAccOptions.disabled = !oControl._isChartEnabled();
		oAccOptions.labelledby = oControl.getAriaLabelledBy();
		oRm.accessibilityState(oControl, oAccOptions);

		oRm.openEnd();
		if (!oControl.getSelectionEnabled()) {
			this.renderDisabledOverlay(oRm, oControl);
		}
		for (var i = 0; i < iBarsNum; i++) {
			this._renderBar(oRm, oControl, aBars[i], i, iBarsNum);
		}
		oRm.close("div");
	};

	/**
	 * Renders the HTML for the given bar, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {int} barIndex The index of the bar inside the bars aggregation
	 * @param {int} barsCount The total number of displayed bars
	 * @private
	 */
	InteractiveBarChartRenderer._renderBar = function(oRm, oControl, bar, barIndex, barsCount) {
		var sValue, sLabel, sTooltip, sAriaLabel, sColor, sLocalizedColor;

		oRm.openStart("div", oControl.getId() + "-interactionArea-" + barIndex);
		oRm.attr("data-sap-ui-ibc-selection-index", barIndex);
		oRm.class("sapSuiteIBCBarInteractionArea");
		if (bar.getSelected()) {
			oRm.class("sapSuiteIBCBarSelected");
		}
		// the first bar has tab-index at the first rendering
		if (barIndex === 0 && oControl._isChartEnabled()) {
			oRm.attr("tabindex", "0");
		}
		// tooltip for bar (interactive mode)
		// if (oControl._isChartEnabled()) {
		// 	sTooltip = bar.getTooltip_AsString();
		// 	if (typeof sTooltip === "string" || sTooltip instanceof String) {
		// 		oRm.writeAttributeEscaped("title", sTooltip);
		// 	}
		// }

		// bar accessibility
		sLabel = bar.getLabel();
		sAriaLabel = sLabel;
		if (oControl._bMinMaxValid) {
			sValue = this._getDisplayValue(bar, oControl);
			sTooltip = bar.getTooltip_Text();
			if (sTooltip && sTooltip.trim()) {
				sAriaLabel = sTooltip;
			} else {
				if (sAriaLabel) {
					sAriaLabel = sAriaLabel + " " + sValue;
				} else {
					sAriaLabel = sValue;
				}
				if (oControl._bUseSemanticTooltip) {
					sColor = bar.getColor();
					sLocalizedColor = oControl._oRb.getText(("SEMANTIC_COLOR_" + sColor.toUpperCase()));
					sAriaLabel += " " + sLocalizedColor;
				}
			}
		}

		var oAccOptions = {};
		oAccOptions.role = "option";
		oAccOptions.label = sAriaLabel;
		oAccOptions.selected = bar.getSelected();
		oAccOptions.posinset = barIndex + 1;
		oAccOptions.setsize = barsCount;
		oRm.accessibilityState(bar, oAccOptions);

		oRm.openEnd();
		sLabel = bar.getLabel();
		if (bar.getColor() !== MobileLibrary.ValueColor.Neutral) {
			oRm.openStart("div");
			oRm.class("sapSuiteIBCSemanticMarker");
			oRm.class("sapSuiteIBCSemantic" + bar.getColor());
			oRm.openEnd();
			oRm.close("div");
		}
		oRm.openStart("div", oControl.getId() + "-label-" + barIndex);
		oRm.class("sapSuiteIBCBarLabel");
		oRm.openEnd();
		oRm.openStart("div");
		oRm.class("sapSuiteIBCBarLabelText");
		oRm.openEnd();
		oRm.text(sLabel);
		oRm.close("div");
		oRm.close("div");
		if (oControl._bMinMaxValid) {
			//renders the wrapper
			oRm.openStart("div");
			oRm.class("sapSuiteIBCBarWrapper");
			oRm.openEnd();

			//renders the negative bar
			this._renderBarDirection(oRm, oControl, bar, barIndex, sValue, InteractiveBarChartRenderer.BAR_DIRECTION_NEGATIVE);

			//renders the divider
			oRm.openStart("div");
			oRm.class("sapSuiteIBCDivider");
			oRm.openEnd();
			oRm.close("div");

			//renders the positive bar
			this._renderBarDirection(oRm, oControl, bar, barIndex, sValue, InteractiveBarChartRenderer.BAR_DIRECTION_POSITIVE);

			oRm.close("div");
		}
		oRm.close("div");
	};

	/**
	 * Renders the HTML for the given bar direction, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {int} barIndex The index of the bar inside the bars aggregation
	 * @param {string} displayValue The bar value to be displayed
	 * @param {int} barDirection The direction of the bar (positive or negative)
	 * @private
	 */
	InteractiveBarChartRenderer._renderBarDirection = function(oRm, oControl, bar, barIndex, displayValue, barDirection) {
		var fValue = bar.getValue();
		oRm.openStart("div");
		oRm.class(barDirection.WRAPPER_CSSCLASS);
		oRm.openEnd();
		oRm.openStart("div", oControl.getId() + "-bar-" + barDirection.NAME + "-" + barIndex);
		oRm.class("sapSuiteIBCBar");
		oRm.class(barDirection.CSSCLASS);
		if (fValue > 0) {
			oRm.class("sapSuiteIBCValuePositive");
		} else if (fValue === 0 || bar._bNullValue) {
			oRm.class("sapSuiteIBCBarValueNull");
		} else {
			oRm.class("sapSuiteIBCValueNegative");
		}
		oRm.openEnd();
		this._renderDisplayedValue(oRm, oControl, bar, oControl.getId(), barIndex, displayValue, barDirection);
		oRm.close("div");
		oRm.close("div");
	};

	/**
	 * Renders the value to be displayed for the given bar, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {string} controlId The id of the control to be rendered
	 * @param {int} barIndex The index of the bar inside the bars aggregation
	 * @param {string} displayValue The bar value to be displayed
	 * @param {object} barDirection The direction of the bar (positive or negative)
	 * @private
	 */
	InteractiveBarChartRenderer._renderDisplayedValue = function(oRm, oControl, bar, controlId, barIndex, displayValue, barDirection) {
		var bIsValueZero = bar.getValue() === 0,
			bPositiveValue;

		if (bar._bNullValue || bIsValueZero) {
			if (oControl._fMin < 0 && oControl._fMax > 0) {
				// N/A position for mixed values: check which space is bigger for the label
				bPositiveValue = Math.abs(oControl._fMax) >= Math.abs(oControl._fMin);
			} else {
				// N/A position for non-mixed values: determine the direction of the space
				bPositiveValue = oControl._fMin >= 0;
			}
		} else {
			// Label position for non N/A
			bPositiveValue = bar.getValue() >= 0;
		}

		// only draw the span containing the displayedValue once in the correct corresponding positive/negative area as both areas always exist
		if (barDirection === InteractiveBarChartRenderer.BAR_DIRECTION_POSITIVE && bPositiveValue ||
				barDirection === InteractiveBarChartRenderer.BAR_DIRECTION_NEGATIVE && !bPositiveValue) {
			oRm.openStart("span", controlId + "-displayedValue-" + barIndex);
			oRm.class("sapSuiteIBCBarValue");
			if (bar._bNullValue || bIsValueZero) {
				oRm.class("sapSuiteIBCBarValueAutoAlignment");
				oRm.class("sapSuiteIBCBarValueOutside");
			}
			oRm.openEnd();
			oRm.text(displayValue);
			oRm.close("span");
		}
	};

	/**
	 * Renders an additional disabling overlay.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 * @private
	 */
	InteractiveBarChartRenderer.renderDisabledOverlay = function(oRm, oControl) {
		oRm.openStart("div");
		oRm.class("sapSuiteIBCDisabledOverlay");
		oRm.openEnd();
		oRm.close("div");
	};

	/**
	 * Creates the value to be displayed for the given bar.
	 *
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 * @returns {string} The display value for the bar
	 * @private
	 */
	InteractiveBarChartRenderer._getDisplayValue = function(bar, oControl) {
		var sValue, fValue;
		sValue = bar.getDisplayedValue();
		fValue = bar.getValue();
		if (bar._bNullValue) {
			// 'N/A' is displayed if value does not exist (regardless of whether the displayedValue exists or not)
			sValue = oControl._oRb.getText("INTERACTIVECHART_NA");
		} else if (!sValue) {
			sValue = fValue.toString();
		}
		return sValue;
	};

	/**
	 * Creates the value of the aria-describedby accessibility attribute
	 *
	 * @param {sap.suite.ui.microchart.InteractiveBarChart} oControl The control to be rendered
	 * @param {int} barsNum The amount of bars
	 * @returns {string} A comma-separated list of all InteractionArea's IDs
	 * @private
	 */
	InteractiveBarChartRenderer._getAriaDescribedBy = function(oControl, barsNum) {
		var aAreaIds = [];
		for (var i = 0; i < barsNum; i++) {
			aAreaIds.push(oControl.getId() + "-interactionArea-" + i);
		}
		return aAreaIds.join(",");
	};
	return InteractiveBarChartRenderer;

}, /* bExport */ true);
