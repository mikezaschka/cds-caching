/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * BaseChart renderer.
	 * @namespace
	 */
	var BaseChartRenderer = {
		apiVersion: 2
	};


	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.viz.ui5.core.BaseChart} oControl an object representation of the control that should be rendered
	 */
	BaseChartRenderer.render = function(oRm, oControl){

		var bIsEmpty = 	!oControl.getDataset() || !oControl.getDataset().getVIZDataset(),
			oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.viz.ui5.messages"); // TODO relies on undocumented behavior?

		// write the HTML into the render manager
		oRm.openStart("div", oControl);
		if (oControl.getTooltip_AsString()) {
			oRm.attr("title", oControl.getTooltip_AsString());
		}
		oRm.class("sapVizChart");
		if ( bIsEmpty ) {
			oRm.class("sapVizNoData");
		}
		oRm.style("width", oControl.getWidth());
		oRm.style("height", oControl.getHeight());
		oRm.openEnd();
		if ( !sap.viz.__svg_support ) {
			oRm.openStart("div")
				.class("sapVizNoDataDefault")
				.openEnd()
				.text(oBundle.getText("NO_SVG_SUPPORT"))
				.close("div");
		} else if ( bIsEmpty ) {
			var oNoData = oControl.getNoData();
			if ( oNoData ) {
				oRm.renderControl(oNoData);
			} else {
				oRm.openStart("div")
					.class("sapVizNoDataDefault")
					.openEnd()
					.text(oBundle.getText("NO_DATA"))
					.close("div");
			}
		}
		oRm.close("div");
	};


	return BaseChartRenderer;

}, /* bExport= */ true);
