/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/viz/library","./Dataset"],function(t,a){"use strict";var e=a.extend("sap.viz.ui5.data.CustomDataset",{metadata:{library:"sap.viz",properties:{data:{type:"object",group:"Misc"}}}});e.prototype.getRawDataset=function(){return this.getProperty("data")};e.prototype.isReady=function(){return true};return e});
//# sourceMappingURL=CustomDataset.js.map