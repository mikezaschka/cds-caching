/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Lib","sap/ui/core/Renderer","sap/m/TokenizerRenderer","sap/m/library"],(e,t,n,r)=>{"use strict";const{EmptyIndicatorMode:a}=r;const o=e.getResourceBundleFor("sap.m");const s=t.extend(n);s.apiVersion=2;s._renderIndicator=function(e,t){n._renderIndicator.apply(this,arguments);if(t.getEmptyIndicatorMode()!==a.Off&&t.getTokens().length==0){this._renderEmptyIndicator(e,t)}};s._renderIndicatorTabIndex=function(e,t){e.attr("tabindex","0");e.attr("role","button")};s._renderEmptyIndicator=function(e,t){e.openStart("span");e.class("sapMEmptyIndicator");if(t.getEmptyIndicatorMode()===a.Auto){e.class("sapMEmptyIndicatorAuto")}e.openEnd();e.openStart("span");e.attr("aria-hidden",true);e.openEnd();e.text(o.getText("EMPTY_INDICATOR"));e.close("span");e.openStart("span");e.class("sapUiPseudoInvisibleText");e.openEnd();e.text(o.getText("EMPTY_INDICATOR_TEXT"));e.close("span");e.close("span")};return s});
//# sourceMappingURL=TokenizerDisplayRenderer.js.map