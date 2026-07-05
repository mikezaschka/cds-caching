/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Lib"],function(e){"use strict";const t={apiVersion:2};t.render=function(t,n){const s=n.getExpanded(),i=n._containsIcon(),a=n.getItems().filter(e=>e.getVisible());t.openStart("ul",n).class("sapTntNL");if(!s){t.class("sapTntNLCollapsed")}if(!i){t.class("sapTntNLNoIcons")}var r=n.getWidth();if(r&&s){t.style("width",r)}const o=!s&&!n.hasStyleClass("sapTntNLPopup")?"menubar":"tree";t.accessibilityState(n,{role:o,orientation:o==="menubar"?"vertical":undefined,roledescription:e.getResourceBundleFor("sap.tnt").getText(o==="menubar"?"NAVIGATION_LIST_ITEM_ROLE_DESCRIPTION_MENUBAR":"NAVIGATION_LIST_ITEM_ROLE_DESCRIPTION_TREE")});t.openEnd();const c=a.find(e=>e.isA("sap.tnt.NavigationListGroup"));a.forEach(e=>{e.render(t,n,e===c)});if(!s){n._getOverflowItem().render(t,n)}t.close("ul")};return t},true);
//# sourceMappingURL=NavigationListRenderer.js.map