/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/mdc/link/PanelRenderer","sap/ui/mdc/link/Panel","sap/ui/comp/personalization/LinkPanelController","sap/m/p13n/Engine","sap/ui/mdc/mixin/AdaptationMixin"],(e,n,t,i,r)=>{"use strict";const a=n.extend("sap.ui.comp.navpopover.Panel",{renderer:e});a.prototype._registerP13n=function(){i.getInstance().register(this,{controller:{LinkItems:new t({control:this})}});r.call(a.prototype);i.getInstance().defaultProviderRegistry.attach(this,"Global")};return a});
//# sourceMappingURL=Panel.js.map