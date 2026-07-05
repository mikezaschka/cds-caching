/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";function t(t,e,n){if(n!==""||n.toLowerCase()==="auto"){t.style(e,n)}}function e(t){return Object.keys(t).filter(e=>t[e]).map(t=>t.replace(/[A-Z]/g,"-$&").toLowerCase()).join(" ")}var n={apiVersion:2};n.render=function(n,o){n.openStart("iframe",o);t(n,"width",o.getWidth());t(n,"height",o.getHeight());n.style("display","block");n.style("border","none");const i=o.getAdvancedSettings();const{additionalSandboxParameters:r,...a}=i;const s=r?.join(" ");const c=e(a);const d=s?`${c} ${s}`:c;n.attr("sandbox",d);n.attr("src","about:blank");var l=o.getTitle();if(l){n.attr("title",l)}n.openEnd();n.close("iframe")};return n},true);
//# sourceMappingURL=IFrameRenderer.js.map