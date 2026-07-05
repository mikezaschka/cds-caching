/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/Localization"
],
	function(Localization) {
		"use strict";

		/**
		 * VizSliderBasic renderer.
		 * @namespace
		 */
		var SliderRenderer = {
			apiVersion: 2
		};

		/**
		 * CSS class to be applied to the HTML root element of the Slider control.
		 *
		 * @type {string}
		 */
		SliderRenderer.CSS_CLASS = "sapVizSlider";

		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the slider that should be rendered.
		 */
		SliderRenderer.render = function(oRm, oSlider) {
			var bEnabled = oSlider.getEnabled(),
				sTooltip = oSlider.getTooltip_AsString(),
				CSS_CLASS = SliderRenderer.CSS_CLASS;

			oRm.openStart("div", oSlider);
			this.addClass(oRm, oSlider);

			if (!bEnabled) {
				oRm.class(CSS_CLASS + "Disabled");
			}

			oRm.style("width", oSlider.getWidth());

			if (sTooltip && oSlider.getShowHandleTooltip()) {
				oRm.attr("title", sTooltip);
			}

			oRm.openEnd();
			oRm.openStart("div", oSlider.getId() + "-inner");
			this.addInnerClass(oRm, oSlider);

			if (!bEnabled) {
				oRm.class(CSS_CLASS + "InnerDisabled");
			}

			oRm.openEnd();

			if (oSlider.getProgress()) {
				this.renderProgressIndicator(oRm, oSlider);
			}

			this.renderHandles(oRm, oSlider);
			oRm.close("div");

			if (oSlider.getEnableTickmarks()) {
				this.renderTickmarks(oRm, oSlider);
			} else {
				// Keep the "old" labels for backwards compatibility
				this.renderLabels(oRm, oSlider);
			}

			if (oSlider.getName()) {
				this.renderInput(oRm, oSlider);
			}

			oRm.close("div");
		};

		SliderRenderer.renderProgressIndicator = function(oRm, oSlider) {
			oRm.openStart("div", oSlider.getId() + "-progress");
			this.addProgressIndicatorClass(oRm, oSlider);
			oRm.style("width", oSlider._sProgressValue);
			oRm.attr("aria-hidden", "true");
			oRm.openEnd();
			oRm.close("div");
		};

		/**
		 * This hook method is reserved for derived classes to render more handles.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the slider that should be rendered.
		 */
		SliderRenderer.renderHandles = function(oRm, oSlider) {
			this.renderHandle(oRm, oSlider,  {
				id: oSlider.getId() + "-handle"
			});

			if (oSlider.getShowAdvancedTooltip()) {
				this.renderTooltips(oRm, oSlider);
			}
		};

		SliderRenderer.renderHandle = function(oRm, oSlider, mOptions) {
			var bEnabled = oSlider.getEnabled();

			if (mOptions && (mOptions.id !== undefined)) {
				oRm.openStart("span", mOptions.id);
			} else {
				oRm.openStart("span");
			}

			if (oSlider.getShowHandleTooltip() && !oSlider.getShowAdvancedTooltip()) {
				this.writeHandleTooltip(oRm, oSlider);
			}

			this.addHandleClass(oRm, oSlider);
			oRm.style(Localization.getRTL() ? "right" : "left", oSlider._sProgressValue);
			this.writeAccessibilityState(oRm, oSlider);

			if (bEnabled) {
				oRm.attr("tabindex", "0");
			}

			oRm.openEnd();
			oRm.close("span");
		};

		/**
		 * This hook method is reserved for derived classes to render more tooltips.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the slider that should be rendered.
		 */
		SliderRenderer.renderTooltips = function(oRm, oSlider) {

			// the tooltips container
			oRm.openStart("div", oSlider.getId() + "-TooltipsContainer")
				.class(SliderRenderer.CSS_CLASS + "TooltipContainer")
				.style("left", "0%")
				.style("right", "0%")
				.style("min-width", "0%")
				.openEnd();
			this.renderTooltip(oRm, oSlider, oSlider.getInputsAsTooltips());
			oRm.close("div");
		};

		SliderRenderer.renderTooltip = function(oRm, oSlider, bInput) {
			if (bInput && oSlider._oInputTooltip) {
				oRm.renderControl(oSlider._oInputTooltip.tooltip);
			} else {
				oRm.openStart("span", oSlider.getId() + "-Tooltip")
					.class(SliderRenderer.CSS_CLASS + "HandleTooltip")
					.style("width", oSlider._iLongestRangeTextWidth + "px")
					.openEnd()
					.close("span");
			}
		};

		/**
		 * Writes the handle tooltip.
		 * To be overwritten by subclasses.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 */
		SliderRenderer.writeHandleTooltip = function(oRm, oSlider) {
			oRm.attr("title", oSlider.toFixed(oSlider.getValue()));
		};

		SliderRenderer.renderInput = function(oRm, oSlider) {
			oRm.voidStart("input", oSlider.getId() + "-input");
			oRm.attr("type", "text");
			oRm.class(SliderRenderer.CSS_CLASS + "Input");

			if (!oSlider.getEnabled()) {
				oRm.attr("disabled", "disabled");
			}

			oRm.attr("name", oSlider.getName());
			oRm.attr("value", oSlider.toFixed(oSlider.getValue()));
			oRm.voidEnd();
		};

		/**
		 * Writes the accessibility state to the control.
		 * To be overwritten by subclasses.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 */
		SliderRenderer.writeAccessibilityState = function(oRm, oSlider) {
			oRm.accessibilityState(oSlider, {
				role: "slider",
				orientation: "horizontal",
				valuemin: oSlider.toFixed(oSlider.getMin()),
				valuemax: oSlider.toFixed(oSlider.getMax()),
				valuenow: oSlider.toFixed(oSlider.getValue())
			});
		};

		SliderRenderer.renderTickmarks = function (oRm, oSlider) {
			var i, iTickmarksToRender, fTickmarksDistance, iLabelsCount, fStep, fSliderSize,fSliderStep,
				oScale = oSlider.getAggregation("scale");

			if (!oSlider.getEnableTickmarks() || !oScale) {
				return;
			}

			fSliderSize = Math.abs(oSlider.getMin() - oSlider.getMax());
			fSliderStep = oSlider.getStep();

			iLabelsCount = oScale.getTickmarksBetweenLabels();
			iTickmarksToRender = oScale.calcNumTickmarks(fSliderSize, fSliderStep, oSlider._CONSTANTS.TICKMARKS.MAX_POSSIBLE);
			fTickmarksDistance = oSlider._getPercentOfValue(
				oScale.calcTickmarksDistance(iTickmarksToRender, oSlider.getMin(), oSlider.getMax(), fSliderStep));


			oRm.openStart("ul").class(SliderRenderer.CSS_CLASS + "Tickmarks").openEnd();
			this.renderTickmarksLabel(oRm, oSlider, oSlider.getMin());

			for (i = 0; i < iTickmarksToRender; i++) {
				if (iLabelsCount && i > 0 && (i % iLabelsCount === 0)) {
					fStep = i * fTickmarksDistance;
					this.renderTickmarksLabel(oRm, oSlider, oSlider._getValueOfPercent(fStep));
				}

				oRm.openStart("li").class(SliderRenderer.CSS_CLASS + "Tick").style("width", fTickmarksDistance + "%").openEnd().close("li");
			}

			oRm.openStart("li").class(SliderRenderer.CSS_CLASS + "Tick").style("width", "0%").openEnd().close("li");
			this.renderTickmarksLabel(oRm, oSlider, oSlider.getMax());
			oRm.close("ul");
		};

		SliderRenderer.renderTickmarksLabel = function (oRm, oSlider, fValue) {
			var fOffset = oSlider._getPercentOfValue(fValue);
			var sLeftOrRightPosition = Localization.getRTL() ? "right" : "left";
			fValue = oSlider.toFixed(fValue, oSlider.getDecimalPrecisionOfNumber(oSlider.getStep()));

			oRm.openStart("li").class(SliderRenderer.CSS_CLASS + "TickLabel");

			oRm.style(sLeftOrRightPosition, fOffset + "%");

			oRm.openEnd();
			oRm.openStart("div").class(SliderRenderer.CSS_CLASS + "Label").openEnd();
			oRm.text("" + fValue);
			oRm.close("div");
			oRm.close("li");
		};

		/**
		 * This method is reserved for derived classes to add extra CSS classes to the HTML root element of the control.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 * @since 1.36
		 */
		SliderRenderer.addClass = function(oRm, oSlider) {
			oRm.class(SliderRenderer.CSS_CLASS);
		};

		/**
		 * This method is reserved for derived classes to add extra CSS classes to the inner element.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 * @since 1.38
		 */
		SliderRenderer.addInnerClass = function(oRm, oSlider) {
			oRm.class(SliderRenderer.CSS_CLASS + "Inner");
		};

		/**
		 * This method is reserved for derived classes to add extra CSS classes to the progress indicator element.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 * @since 1.38
		 */
		SliderRenderer.addProgressIndicatorClass = function(oRm, oSlider) {
			oRm.class(SliderRenderer.CSS_CLASS + "Progress");
		};

		/**
		 * This method is reserved for derived classes to add extra CSS classes to the handle element.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 * @since 1.38
		 */
		SliderRenderer.addHandleClass = function(oRm, oSlider) {
			oRm.class(SliderRenderer.CSS_CLASS + "Handle");
		};

		/**
		 * This hook method is reserved for derived classes to render the labels.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.viz.ui5.controls.VizSliderBasic} oSlider An object representation of the control that should be rendered.
		 */
		SliderRenderer.renderLabels = function (oRm, oSlider) {};

		return SliderRenderer;

	}, /* bExport= */ true);
