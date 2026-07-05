/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
    "sap/base/i18n/Localization",
    "sap/ui/core/Renderer",
    "./VizSliderBasicRenderer",
    "sap/ui/Device"
], function (Localization, Renderer, SliderRenderer, Device) {
    "use strict";

    /**
     * VizRangeSlider renderer.
     * @namespace
     */
    var VizRangeSliderRenderer = Renderer.extend(SliderRenderer);

    VizRangeSliderRenderer.apiVersion = 2;

    VizRangeSliderRenderer.renderHandles = function (oRM, oControl) {
        this.renderHandle(oRM, oControl, {
            id: oControl.getId() + "-handle1",
            position: "start"
        });
        this.renderHandle(oRM, oControl, {
            id: oControl.getId() + "-handle2",
            position: "end"
        });

        // Render tooltips
        this.renderTooltips(oRM, oControl);

        // Render ARIA labels
        oRM.renderControl(oControl._mHandleTooltip.start.label);
        oRM.renderControl(oControl._mHandleTooltip.end.label);
        oRM.renderControl(oControl._oRangeLabel);
    };

    VizRangeSliderRenderer.renderTooltips = function (oRM, oControl) {
        // The tooltips container
        oRM.openStart("div", oControl.getId() + "-TooltipsContainer")
            .class(SliderRenderer.CSS_CLASS + "TooltipContainer")
            .style("left","0%")
            .style("right","0%")
            .style("min-width", "0%")
            .openEnd();

        // The first tooltip
        this.renderTooltip(oRM, oControl, oControl.getInputsAsTooltips(), "Left");

        // The second tooltip
        this.renderTooltip(oRM, oControl, oControl.getInputsAsTooltips(), "Right");

        oRM.close("div");
    };

    // override sap.m.RangeSliderRenderer!!
    VizRangeSliderRenderer.renderTooltip = function(oRM, oControl, bInput, sPosition){

            oRM.openStart("span", oControl.getId() + "-" + sPosition + "Tooltip");
            oRM.class(SliderRenderer.CSS_CLASS + "HandleTooltip");
            if (!oControl.getShowStartEndLabel()) {
                oRM.style("visibility", "hidden");
            }
            oRM.style("width", oControl._iLongestRangeTextWidth + "px");
            oRM.openEnd();
            oRM.close("span");
    };

    /**
     * Used to render each of the handles of the RangeSlider.
     *
     * @param {sap.ui.core.RenderManager} oRM The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.viz.ui5.controls.VizRangeSlider} oControl An object representation of the slider that should be rendered.
     * @param {object} mOptions Options used for specificity of the handles
     * @override
     */
    VizRangeSliderRenderer.renderHandle = function (oRM, oControl, mOptions) {
        var fValue,
            aRange = oControl.getRange(),
            bEnabled = oControl.getEnabled(),
            bRTL = Localization.getRTL();

        if (mOptions && (mOptions.id !== undefined)) {
            oRM.openStart("span", mOptions.id);
        } else {
            oRM.openStart("span");
        }
        if (mOptions && (mOptions.position !== undefined)) {
            fValue = aRange[mOptions.position === "start" ? 0 : 1];

            oRM.attr("data-range-val", mOptions.position);
            oRM.attr("aria-labelledby", oControl._mHandleTooltip[mOptions.position].label.getId());

            if (oControl.getInputsAsTooltips()) {
                oRM.attr("aria-controls", oControl._mHandleTooltip[mOptions.position].tooltip.getId());
            }
        }
        if (oControl.getShowHandleTooltip()) {
            this.writeHandleTooltip(oRM, oControl);
        }

        oRM.class(SliderRenderer.CSS_CLASS + "Handle");

        //extra classes for VizFrame slider handle
        //for cozy specification

        if ((!Device.system.desktop) && (Device.system.phone || Device.system.tablet)) {
            oRM.class('viz-Mobile');
        }
        //for icon
        oRM.class('sapUiIcon');
        oRM.class('ui5-sap-viz-vizSliderHandle');

        oRM.attr("data-sap-ui-icon-content", '\ue1fa');

        //style difference of handles includes border and left&right
        if (mOptions && (mOptions.id !== undefined) && mOptions.id === (oControl.getId() + "-handle1")) {
            oRM.class('ui5-sap-viz-vizSliderHandle-left');
            oRM.style(bRTL ? "right" : "left", aRange[0]);
        }
        if (mOptions && (mOptions.id !== undefined) && mOptions.id === (oControl.getId() + "-handle2")) {
            oRM.class('ui5-sap-viz-vizSliderHandle-right');
            oRM.style(bRTL ? "right" : "left", aRange[1]);
        }

        this.writeAccessibilityState(oRM, oControl, fValue);

        if (bEnabled) {
            oRM.attr("tabindex", "0");
        }
        oRM.openEnd().close("span");
    };

    /**
     * Writes the accessibility state to the control.
     * To be overwritten by subclasses.
     * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.viz.ui5.controls.VizRangeSlider} oSlider An object representation of the control that should be rendered.
     * @param {float} fValue
     */
    VizRangeSliderRenderer.writeAccessibilityState = function(oRm, oSlider, fValue) {
        oRm.accessibilityState(oSlider, {
            role: "slider",
            orientation: "horizontal",
            valuemin: oSlider.toFixed(oSlider.getMin()),
            valuemax: oSlider.toFixed(oSlider.getMax()),
            valuenow: fValue
        });
    };

    /**
     * Renders the lower range label under the left part of the RangeSlider control.
     *
     * @param {sap.ui.core.RenderManager} oRM The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.viz.ui5.controls.VizRangeSlider} oControl An object representation of the slider that should be rendered.
     */
    VizRangeSliderRenderer.renderStartLabel = function (oRM, oControl) {
        oRM.openStart("div")
            .class(SliderRenderer.CSS_CLASS + "RangeLabel")
            .openEnd()
            .text(oControl.getMin())
            .close("div");
    };

    /**
     * Renders the higher range label under the right part of the RangeSlider control.
     *
     * @param {sap.ui.core.RenderManager} oRM The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.viz.ui5.controls.VizRangeSlider} oControl An object representation of the slider that should be rendered.
     */
    VizRangeSliderRenderer.renderEndLabel = function (oRM, oControl) {
        oRM.openStart("div")
            .class(SliderRenderer.CSS_CLASS + "RangeLabel")
            .style("width", oControl._iLongestRangeTextWidth + "px")
            .openEnd()
            .text(oControl.getMax())
            .close("div");
    };

    /**
     * Renders the label under the RangeSlider control.
     *
     * @param {sap.ui.core.RenderManager} oRM The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.viz.ui5.controls.VizRangeSlider} oControl An object representation of the slider that should be rendered.
     */
    VizRangeSliderRenderer.renderLabels = function (oRM, oControl) {
        oRM.openStart("div")
            .class(SliderRenderer.CSS_CLASS + "Labels")
            .openEnd();

        this.renderStartLabel(oRM, oControl);
        this.renderEndLabel(oRM, oControl);

        oRM.close("div");
    };

    VizRangeSliderRenderer.renderProgressIndicator = function(oRm, oSlider) {
        var aRange = oSlider.getRange();

        oRm.openStart("div", oSlider.getId() + "-progress");
        if (oSlider.getEnabled()) {
            oRm.attr("tabindex", "0");
        }
        this.addProgressIndicatorClass(oRm, oSlider);
        oRm.style("width", oSlider._sProgressValue);

        oRm.accessibilityState(oSlider, {
            role: "slider",
            orientation: "horizontal",
            valuemin: oSlider.toFixed(oSlider.getMin()),
            valuemax: oSlider.toFixed(oSlider.getMax()),
            valuenow: aRange.join("-"),
            valuetext: oSlider._oResourceBundle.getText('RANGE_SLIDER_RANGE_ANNOUNCEMENT', aRange),
            labelledby: oSlider._oRangeLabel.getId()
        });

        oRm.openEnd().close("div");
    };

    // @override sap.m.SliderRenderer!!
	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.viz.ui5.controls.VizRangeSlider} oControl an object representation of the control that should be rendered
	 */
    VizRangeSliderRenderer.render = function(oRm, oSlider) {
        var bEnabled = oSlider.getEnabled(),
            sTooltip = oSlider.getTooltip_AsString(),
            CSS_CLASS = SliderRenderer.CSS_CLASS;

        oRm.openStart("div", oSlider);
        this.addClass(oRm, oSlider);
        oRm.class("ui5-sap-viz-vizRangeSlider");
        if (!bEnabled) {
            oRm.class(CSS_CLASS + "Disabled");
        }

        oRm.style("position", "absolute")
            .style("width", oSlider.getWidth())
            .style("height", oSlider.getHeight())
            .style("top", oSlider.getTop())
            .style("left", oSlider.getLeft());

        if (sTooltip && oSlider.getShowHandleTooltip()) {
            oRm.attr("title", sTooltip);
        }

        oRm.openEnd();
        this.renderMock(oRm, oSlider);
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

    /*
     * extra functions
     */
     VizRangeSliderRenderer.renderMock = function(oRm, oSlider){
         var aRange = oSlider.getRange();
         var max = oSlider.getMax();
         var min = oSlider.getMin();
         var minRange = Math.min(aRange[0], aRange[1]);
         var maxRange = Math.max(aRange[0], aRange[1]);


         oRm.openStart("div", oSlider.getId() + "-leftMock")
             .class("ui5-sap-viz-vizSliderMock")
             .class("ui5-sap-viz-vizSliderMock-left")
             .style("right", (max - minRange) * 100 / (max - min) + "%")
             .openEnd()
             .close("div");

         oRm.openStart("div", oSlider.getId() + "-rightMock")
             .class("ui5-sap-viz-vizSliderMock")
             .class("ui5-sap-viz-vizSliderMock-right")
             .style("left", (maxRange - min) * 100 / (max - min) + "%")
             .openEnd()
             .close("div");

         oRm.openStart("div", oSlider.getId() + "-label")
             .class('ui5-sap-viz-vizSliderLabel')
             .style("left", (maxRange + minRange) * 50 / (maxRange - minRange) + "%");
         if (!oSlider.getShowPercentageLabel()) {
             oRm.style("visibility", "hidden");
         }
         oRm.openEnd()
             .text((maxRange - minRange) * 100 / (max - min) + "%")
             .close("div");
     };
    return VizRangeSliderRenderer;
}, /* bExport= */ true);
