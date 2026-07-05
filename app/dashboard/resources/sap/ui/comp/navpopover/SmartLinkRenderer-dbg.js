/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.SmartLink.
sap.ui.define([
	'sap/ui/core/Renderer', 'sap/m/LinkRenderer', 'sap/base/strings/whitespaceReplacer', 'sap/m/library'
], function(Renderer, LinkRenderer, whitespaceReplacer, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.EmptyIndicator
	var EmptyIndicatorMode = mobileLibrary.EmptyIndicatorMode;

	var SmartLinkRenderer = Renderer.extend(LinkRenderer);

	SmartLinkRenderer.apiVersion = 2;

	SmartLinkRenderer.render = function(oRm, oControl) {
		var bRenderLink = true;
		if (oControl.getIgnoreLinkRendering()) {
			var oReplaceControl = oControl._getInnerControl();
			if (oReplaceControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.renderControl(oReplaceControl);
				oRm.close("div");
				bRenderLink = false;
			}
		}
		if (bRenderLink) {
			if (!oControl.getAriaLabelledBy() || (Array.isArray(oControl.getAriaLabelledBy()) && oControl.getAriaLabelledBy().length == 0)) {
				oControl.addAriaLabelledBy(oControl);
			}
			LinkRenderer.render.apply(this, arguments);
		}
	};

	SmartLinkRenderer.writeText = function(oRm, oControl) {
		var sUOM = oControl.getUom();
		var bUseEmptyIndicator = oControl.getEmptyIndicatorMode() !== EmptyIndicatorMode.Off && !oControl.getText();

		if (!sUOM) {
			this._writeText(oRm, oControl, bUseEmptyIndicator);
			return;
		}
		this._writeTextWithUom(oRm, sUOM, oControl, bUseEmptyIndicator);
	};

	SmartLinkRenderer._writeTextWithUom = function(oRm, sUOM, oSmartLink, bUseEmptyIndicator) {
		// Add "spacers" to UoM to avoid gap in the underlining between value and UOM
		// Filling up the UoM area to be atleast 5 characters wide to avoide the gap
		sUOM = sUOM.padStart(6, "\u2007");
		oRm.openStart("span");
		oRm.openEnd();
		this._writeText(oRm, oSmartLink, bUseEmptyIndicator);
		oRm.close("span");

		oRm.openStart("span");
		if (bUseEmptyIndicator) {
			oRm.class("sapMEmptyIndicator");
			oRm.class("sapMLnkDsbl");
		}
		oRm.style("display", "inline-flex");
		oRm.style("min-width", "2.5em");
		oRm.style("width", "3.0em");
		oRm.style("justify-content", "end");
		oRm.openEnd();
		oRm.text(sUOM);
		oRm.close("span");
	};

	SmartLinkRenderer._writeText = function(oRm, oSmartLink, bUseEmptyIndicator) {
		var sText = whitespaceReplacer(oSmartLink.getText());
		if (bUseEmptyIndicator) {
			LinkRenderer.renderEmptyIndicator(oRm, oSmartLink);
		} else {
			oRm.text(sText);
		}
	};

	return SmartLinkRenderer;

}, /* bExport= */true);
