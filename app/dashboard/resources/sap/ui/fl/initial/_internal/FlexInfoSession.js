/*
 * ! OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],()=>{"use strict";var e={};var n="sap.ui.fl.info.";function t(e){return n+(e||"true")}e.getByReference=function(e){return JSON.parse(window.sessionStorage.getItem(t(e)))||{}};e.setByReference=function(e,n){if(e){window.sessionStorage.setItem(t(n),JSON.stringify(e))}};e.removeByReference=function(e){window.sessionStorage.removeItem(t(e))};return e});
//# sourceMappingURL=FlexInfoSession.js.map