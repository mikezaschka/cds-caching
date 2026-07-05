/*
 * ! OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/base/Object"],function(jQuery,n){"use strict";const e=["sapUiSizeCozy","sapUiSizeCompact","sapUiSizeCondensed"];const t=e[0];const s=function(n,t){if(!t||!t[n]){return undefined}for(let s=0;s<e.length;s++){if(t[n](e[s])){return e[s]}}return undefined};const i=function(t){const i=!n.isA(t,"sap.ui.core.Control");return i?s("hasClass",jQuery(t).closest("."+e.join(",."))):s("hasStyleClass",t)};const o={};o.syncDensity=function(n,e){if(!i(n)){const s=e&&i(e)||i(document.body)||t;return n.addStyleClass(s)}return undefined};return o});
//# sourceMappingURL=DensityHelper.js.map