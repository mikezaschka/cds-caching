/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/core/Renderer',
	'sap/m/SearchFieldRenderer',
	'sap/ui/core/library',
	"sap/ui/core/Lib",
	"sap/ui/core/ControlBehavior",
	'sap/ui/core/ValueStateSupport'
],
function(
	Renderer,
	SearchFieldRenderer,
	coreLibrary,
	Library,
	ControlBehavior,
	ValueStateSupport
) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	const ValueState = coreLibrary.ValueState;

	const oMRB = Library.getResourceBundleFor("sap.m");

	/**
	 * SFBSearchField renderer.
	 *
	 * SFBSearchField extends the SearchFieldRenderer
	 *
	 * @namespace
	 * @alias sap.ui.comp.smartfilterbar.SFBSearchFieldRenderer
	 * @static
	 * @private
	 */
	const SFBSearchFieldRenderer = Renderer.extend(SearchFieldRenderer);
	SFBSearchFieldRenderer.apiVersion = 2;

	/**
	 * Renders the hidden aria describedby and errormessage nodes for the accessibility.
	 *
	 * @protected
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
	 * @param {sap.m.InputBase} oControl An object representation of the control that should be rendered.
	 */
	SFBSearchFieldRenderer.renderValueStateAccDom = function(oRm, oControl) {
		const sValueState = oControl.getValueState(),
			bAccessibility = ControlBehavior.isAccessibilityEnabled();

		if (sValueState === ValueState.None || !oControl.getEnabled() || !bAccessibility) {
			return;
		}

		const sValueStateTypeText = oMRB.getText("INPUTBASE_VALUE_STATE_" + sValueState.toUpperCase());

		oRm.openStart("div", oControl.getValueStateMessageId() + "-sr")
			.class("sapUiPseudoInvisibleText");

		oRm.openEnd()
			.text(sValueStateTypeText).text(" ");

		oRm.text(oControl.getValueStateText() || ValueStateSupport.getAdditionalText(oControl));

		oRm.close("div");
	};

	SFBSearchFieldRenderer.render = function(oRm, oControl) {
		SearchFieldRenderer.render.apply(this, arguments);
		this.renderValueStateAccDom(oRm, oControl);
	};

	return SFBSearchFieldRenderer;

}, /* bExport= */ true);