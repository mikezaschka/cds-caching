/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function(){"use strict";var e={};e.extendScales=function(){var e={},r=arguments[0]||[],n=0,t=r.length,f=[];for(;n<t;n++){e[r[n].feed]=r[n]}for(n=1,t=arguments.length;n<t;n++){var u=arguments[n];for(var a=0,i=u.length;a<i;a++){e[u[a].feed]=u[a]}}for(n in e){f.push(e[n])}return f};return e});
//# sourceMappingURL=CommonUtil.js.map