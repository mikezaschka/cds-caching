/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";return{getAppInfo:function e(){const n=sap.ui.require("sap/ushell/Container");return n.getServiceAsync("AppLifeCycle").then(e=>{const n=e.getCurrentApplication(),t={};let i,p;if(n){i=n.componentInstance;t.homePage=n.homePage}if(i){p=i.getManifest()}if(p){t.id=p["sap.app"].id}return t})}}});
//# sourceMappingURL=Utils.js.map