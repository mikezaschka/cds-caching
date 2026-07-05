/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * VizContainer renderer.
	 * @namespace
	 */
	var VizContainerRenderer = {
		apiVersion: 2
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager}
	 *            oRm the RenderManager that can be used for writing to the render
	 *            output buffer
	 * @param {sap.viz.ui5.VizContainer}
	 *            oControl an object representation of the control that should be
	 *            rendered
	 */
	VizContainerRenderer.render = function(oRm, oControl) {

		// write the HTML into the render manager
		// oRm.openStart("div").openEnd().text("This is sap.viz.ui5.VizContainer").close("div");
		oRm.openStart("div", oControl);

		oRm.class("sapVizContainer")
			.style("width", oControl.getWidth() || "100%")
			.style("height", oControl.getHeight() || "100%")
			.openEnd()
			.close("div");
	};

	return VizContainerRenderer;

}, /* bExport= */ true);
