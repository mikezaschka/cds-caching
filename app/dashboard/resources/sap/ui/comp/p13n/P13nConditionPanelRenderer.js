/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Renderer"],function(n){"use strict";return n.extend("sap.m.P13nConditionPanelRenderer",{renderer:{apiVersion:2,render:function(n,e){n.openStart("span",e.getId()+"-firstfe").class("sapMDialogFirstFE").attr("role","none").attr("tabindex","-1").openEnd().close("span");n.openStart("section",e);n.class("sapMConditionPanel");n.openEnd();n.openStart("div");n.class("sapMConditionPanelContent");n.class("sapMConditionPanelBG");n.openEnd();e.getAggregation("content").forEach(function(e){n.renderControl(e)});n.close("div");n.close("section")}}})},true);
//# sourceMappingURL=P13nConditionPanelRenderer.js.map