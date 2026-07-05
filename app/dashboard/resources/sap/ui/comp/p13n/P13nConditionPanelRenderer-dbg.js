/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['sap/ui/core/Renderer'], function (Renderer) {
    "use strict";

    return Renderer.extend("sap.m.P13nConditionPanelRenderer", {
        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("span", oControl.getId() + "-firstfe").class("sapMDialogFirstFE")
				.attr("role", "none")
				.attr("tabindex", "-1")
				.openEnd()
				.close("span");
                oRm.openStart("section", oControl);
                oRm.class("sapMConditionPanel");
                oRm.openEnd();
                oRm.openStart("div");
                oRm.class("sapMConditionPanelContent");
                oRm.class("sapMConditionPanelBG");
                oRm.openEnd();
                oControl.getAggregation("content").forEach(function (oChildren) {
                    oRm.renderControl(oChildren);
                });
                oRm.close("div");
                oRm.close("section");
            }
        }
    });
}, true);