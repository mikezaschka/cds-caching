/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/SyncPromise","sap/base/assert"],(r,e)=>{"use strict";return function s(t){e(typeof t==="string"||Array.isArray(t),"vModulePaths"+" param either must be a single string or an array of strings. - sap.ui.mdc.util.loadModules");let a;if(typeof t==="string"){a=[t]}else{a=t}const n=new Map;a.forEach(r=>{const e=sap.ui.require(r);n.set(r,e)});const i=a.filter(r=>n.get(r)===undefined);if(i.length===0){const e=Array.from(n.values());return r.resolve(e)}return new r((r,e)=>{function s(){const e=Array.from(arguments);i.forEach((r,s)=>{n.set(r,e[s])});const s=Array.from(n.values());r(s)}sap.ui.require(i,s,e)})}});
//# sourceMappingURL=loadModules.js.map