/*!
* SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
*/

sap.ui.define([
	"./library",
	"sap/suite/ui/microchart/MicroChartRenderUtils"
], function(library, MicroChartRenderUtils) {
	"use strict";

	var AreaMicroChartViewType = library.AreaMicroChartViewType;

	/**
	 * AreaMicroChartRenderer renderer.
	 * @namespace
	 */
	var AreaMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.AreaMicroChart} oControl The control to be rendered
	 */
	AreaMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		if (oControl._hasData()) {
			var bWideMode = oControl.getView() === AreaMicroChartViewType.Wide;
			var bShowLabels = oControl.getShowLabel();
			var bShouldRenderTopLabels = (bShowLabels &&
				((!bWideMode && (oControl.getFirstYLabel() || oControl.getLastYLabel())) || oControl.getMaxLabel()));
			var bShouldRenderBottomLabels = (bShowLabels &&
				((!bWideMode && (oControl.getFirstXLabel() || oControl.getLastXLabel())) || oControl.getMinLabel()));
			var bShouldRenderLeftLabels = (bShowLabels && bWideMode && (oControl.getFirstYLabel() || oControl.getFirstXLabel()));
			var bShouldRenderRightLabels = (bShowLabels && bWideMode && (oControl.getLastYLabel() || oControl.getLastXLabel()));

			oRm.openStart("div", oControl);
			this._writeMainProperties(oRm, oControl);

			if (bWideMode) {
				oRm.class("sapSuiteAMCWideMode");
			}

			oRm.openEnd();

			oRm.openStart("div");
			oRm.class("sapSuiteAMCVerticalAlignmentContainer");
			oRm.openEnd();

			if (bShouldRenderTopLabels) {
				oRm.openStart("div", oControl.getId() + "-top-labels");
				oRm.class("sapSuiteAMCLabels");
				oRm.class("sapSuiteAMCPositionTop");
				oRm.openEnd();
				if (!bWideMode) {
					this._writeLabel(oRm, oControl, oControl.getFirstYLabel(), "-top-left-lbl", "sapSuiteAMCPositionLeft");
				}
				this._writeLabel(oRm, oControl, oControl.getMaxLabel(), "-top-center-lbl", "sapSuiteAMCPositionCenter");
				if (!bWideMode) {
					this._writeLabel(oRm, oControl, oControl.getLastYLabel(), "-top-right-lbl", "sapSuiteAMCPositionRight");
				}
				oRm.close("div");
			}

			if (bWideMode) {
				oRm.openStart("div");
				oRm.class("sapSuiteAMCHorizontalContainer");
				oRm.openEnd();
			}

			if (bShouldRenderLeftLabels) {
				oRm.openStart("div", oControl.getId() + "-left-labels");
				oRm.class("sapSuiteAMCSideLabels");
				oRm.class("sapSuiteAMCPositionLeft");
				oRm.openEnd();
				this._writeLabel(oRm, oControl, oControl.getFirstYLabel(), "-top-left-lbl", "sapSuiteAMCPositionLeft");
				this._writeLabel(oRm, oControl, oControl.getFirstXLabel(), "-btm-left-lbl", "sapSuiteAMCPositionLeft", true);
				oRm.close("div");
			}

			oRm.openStart("div", oControl.getId() + "-canvas-cont");
			oRm.class("sapSuiteAMCCanvasContainer");
			oRm.openEnd();
			oRm.openStart("canvas", oControl.getId() + "-canvas");
			oRm.class("sapSuiteAMCCanvas");
			oRm.openEnd();
			oRm.close("canvas");
			oRm.close("div");

			if (bShouldRenderRightLabels) {
				oRm.openStart("div", oControl.getId() + "-right-labels");
				oRm.class("sapSuiteAMCSideLabels");
				oRm.class("sapSuiteAMCPositionRight");
				oRm.openEnd();
				this._writeLabel(oRm, oControl, oControl.getLastYLabel(), "-top-right-lbl", "sapSuiteAMCPositionRight");
				this._writeLabel(oRm, oControl, oControl.getLastXLabel(), "-btm-right-lbl", "sapSuiteAMCPositionRight", true);
				oRm.close("div");
			}

			if (bWideMode) {
				oRm.close("div"); // end of horizontal container
			}

			if (bShouldRenderBottomLabels) {
				oRm.openStart("div", oControl.getId() + "-bottom-labels");
				oRm.class("sapSuiteAMCLabels");
				oRm.class("sapSuiteAMCPositionBtm");
				oRm.openEnd();
				if (!bWideMode) {
					this._writeLabel(oRm, oControl, oControl.getFirstXLabel(), "-btm-left-lbl", "sapSuiteAMCPositionLeft", true);
				}
				this._writeLabel(oRm, oControl, oControl.getMinLabel(), "-btm-center-lbl", "sapSuiteAMCPositionCenter", true);
				if (!bWideMode) {
					this._writeLabel(oRm, oControl, oControl.getLastXLabel(), "-btm-right-lbl", "sapSuiteAMCPositionRight", true);
				}
				oRm.close("div");
			}

			oRm.openStart("div", oControl.getId() + "-css-helper");
			oRm.style("display", "none");
			oRm.openEnd();
			oRm.close("div");

			oRm.close("div");
			oRm.close("div");
		} else {
			this._renderNoData(oRm, oControl);
		}

	};

	/**
	 * Renders control data and prepares default classes and styles
	 *
	 * @param {object} oRm render manager
	 * @param {object} oControl AreaMicroChart control
	 * @private
	 */
	AreaMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
		var bIsActive = oControl.hasListeners("press");

		this._renderActiveProperties(oRm, oControl);

		var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
		oRm.attr("role", "figure");

		if (oControl.getAriaLabelledBy().length) {
			oRm.accessibilityState(oControl);
		} else {
			oRm.attr("aria-label", sAriaLabel);
		}

		oRm.class("sapSuiteAMC");

		oRm.class("sapSuiteAMCSize" + oControl.getSize());

		oRm.style("width", oControl.getWidth());
		oRm.style("height", oControl.getHeight());

	};

	AreaMicroChartRenderer._writeLabel = function(oRm, oControl, oLabel, sId, sClass, bIsBottomLabel) {
		if (!oLabel) {
			return;
		}

		var sLabel = oLabel ? oLabel.getLabel() : "";
		oRm.openStart("div", oControl.getId() + sId);

		if (bIsBottomLabel) {
			oRm.class("sapSuiteAMCTextColor");
		} else  {
			oRm.class("sapSuiteAMCSemanticColor" + oLabel.getColor());
		}

		oRm.class("sapSuiteAMCLbl");
		oRm.class(sClass);
		oRm.openEnd();
		oRm.text(sLabel);
		oRm.close("div");
	};

	MicroChartRenderUtils.extendMicroChartRenderer(AreaMicroChartRenderer);

	return AreaMicroChartRenderer;

}, /* bExport= */ true);
