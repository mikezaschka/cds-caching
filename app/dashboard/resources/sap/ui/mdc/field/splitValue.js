/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],()=>{"use strict";const n=function(n,t){let e;if(typeof n==="string"){if(n.length&&n.endsWith("\r\n")){n=n.substring(0,n.lastIndexOf("\r\n"))}if(t){e=n.split(/\r\n|\r|\n|\t/g)}else{e=n.split(/\r\n|\r|\n/g)}}else{e=[n]}return e};return n});
//# sourceMappingURL=splitValue.js.map