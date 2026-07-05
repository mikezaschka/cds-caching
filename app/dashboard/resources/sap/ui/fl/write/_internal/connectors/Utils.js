/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/initial/_internal/connectors/Utils"],function(n){"use strict";function t(t,e,i){if(t.initialConnector){delete t.initialConnector.xsrfToken}return n.sendRequest(t.tokenUrl,"HEAD",{initialConnector:t.initialConnector}).then(n.sendRequest.bind(undefined,e,i,t))}function e(n,t,i){if(!t[i]){t[i]=n[i];return}if(Array.isArray(t[i])){t[i]=t[i].concat(n[i]);return}if(typeof t[i]==="object"){Object.keys(n[i]).forEach(function(r){e(n[i],t[i],r)})}t[i]=n[i]}return{getRequestOptions(n,t,e,i,r){var o={tokenUrl:t,initialConnector:n};if(e){o.payload=JSON.stringify(e)}if(i){o.contentType=i}if(r){o.dataType=r}return o},sendRequest(e,i,r){if(!r.initialConnector||!r.initialConnector.xsrfToken&&!(i==="GET")&&!(i==="HEAD")){return t(r,e,i)}return n.sendRequest(e,i,r).then(function(n){return n}).catch(function(n){if(n.status===403){return t(r,e,i)}throw n})},mergeResults(n){var t={};n.forEach(function(n){Object.keys(n).forEach(function(i){e(n,t,i)})});return t}}});
//# sourceMappingURL=Utils.js.map