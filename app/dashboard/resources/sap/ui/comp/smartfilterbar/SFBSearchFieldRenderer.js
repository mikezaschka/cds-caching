/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Renderer","sap/m/SearchFieldRenderer","sap/ui/core/library","sap/ui/core/Lib","sap/ui/core/ControlBehavior","sap/ui/core/ValueStateSupport"],function(e,t,a,r,n,s){"use strict";const i=a.ValueState;const o=r.getResourceBundleFor("sap.m");const c=e.extend(t);c.apiVersion=2;c.renderValueStateAccDom=function(e,t){const a=t.getValueState(),r=n.isAccessibilityEnabled();if(a===i.None||!t.getEnabled()||!r){return}const c=o.getText("INPUTBASE_VALUE_STATE_"+a.toUpperCase());e.openStart("div",t.getValueStateMessageId()+"-sr").class("sapUiPseudoInvisibleText");e.openEnd().text(c).text(" ");e.text(t.getValueStateText()||s.getAdditionalText(t));e.close("div")};c.render=function(e,a){t.render.apply(this,arguments);this.renderValueStateAccDom(e,a)};return c},true);
//# sourceMappingURL=SFBSearchFieldRenderer.js.map