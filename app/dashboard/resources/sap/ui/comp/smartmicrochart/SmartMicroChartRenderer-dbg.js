/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([], function() {
	"use strict";
	/**
	 * SmartMicroChart renderer.
	 * @namespace
	 * @version 1.136.0
	 * @since 1.38.0
	 */
	var SmartMicroChartRenderer = {
		apiVersion: 2
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.comp.smartmicrochart.SmartMicroChartBase} oControl an object representation of the control that should be rendered
	 */
	SmartMicroChartRenderer.render = function(oRm, oControl) {
		if (oControl._bIsInitialized) {
			oRm.openStart("div", oControl);

			if (oControl._isResponsive()) {
				oRm.class("sapSuiteUiSmartMicroChartResponsive");
			}

			oRm.openEnd();
			oRm.renderControl(oControl.getAggregation("_chart"));
			oRm.close("div");
		}
	};

	return SmartMicroChartRenderer;

}, /* bExport= */true);
