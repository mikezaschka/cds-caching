/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * VizFrame renderer.
	 * @namespace
	 */
	var VizFrameRenderer = {
		apiVersion: 2
	};


	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.viz.ui5.controls.VizFrame} oControl an object representation of the control that should be rendered
	 */
	VizFrameRenderer.render = function(oRm, oControl){
		// write the HTML into the render manager
		oRm.openStart("div", oControl)
			.class("sapVizFrame")
			.style("width", oControl.getWidth())
			.style("height", oControl.getHeight())
			.openEnd()
			.close("div");
	};


	return VizFrameRenderer;

}, /* bExport= */ true);
