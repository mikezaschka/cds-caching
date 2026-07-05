/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/requireAsync","sap/base/Log"],function(r,e){"use strict";function t(r,e){const n=Array.isArray(r)?[...r]:{...r};Object.entries(n).forEach(([r,s])=>{if(typeof s==="object"&&s!==null){n[r]=t(s,e)}else if(typeof s==="string"){n[r]=s.replaceAll(/{{.*?}}/g,r=>{const t=r.slice(2,-2);const n=e[t];return n||r})}});return n}var n={registry(){return r("sap/ui/fl/apply/_internal/changes/descriptor/Registration")},handleError(r){e.error(r)},processTexts(r,n){const s={};Object.entries(n).forEach(([r,{value:t}])=>{if(t[""]){s[r]=t[""];return}e.error("Text change has to contain default language")});return t(r,s)}};var s={getRuntimeStrategy(){return n}};return s});
//# sourceMappingURL=ApplyStrategyFactory.js.map