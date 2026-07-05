/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(t){"use strict";function e(t){const e=t.replaceAll("\\/","*");const r=e.split("/");return r.map(t=>t.replaceAll("*","/"))}function r(t,e){for(let r=0;r<t.length-1;r++){e=e[t[r]]}delete e[t[t.length-1]]}function o(o,a){let n;if(o.propertyPath.includes("\\")){n=e(o.propertyPath)}else{n=o.propertyPath.split("/")}const i=t.get(n,a);if(i&&o.operation==="INSERT"){throw new Error("Path has already a value. 'INSERT' operation is not appropriate.")}if(!i&&o.operation==="UPDATE"){throw new Error("Path does not contain a value. 'UPDATE' operation is not appropriate.")}if(o.operation==="DELETE"){r(n,a)}else{t.set(n,o.propertyValue,a)}}return function(t,e){if(Array.isArray(t)){t.forEach(function(t){o(t,e)})}else{o(t,e)}}});
//# sourceMappingURL=changePropertyValueByPath.js.map