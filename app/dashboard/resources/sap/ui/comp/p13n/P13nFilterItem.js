/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["./library","sap/ui/core/Item"],function(e,t){"use strict";var r=t.extend("sap.ui.comp.p13n.P13nFilterItem",{metadata:{library:"sap.ui.comp",properties:{operation:{type:"string",group:"Misc",defaultValue:null},value1:{type:"string",group:"Misc",defaultValue:null},value2:{type:"string",group:"Misc",defaultValue:null},columnKey:{type:"string",group:"Misc",defaultValue:null},exclude:{type:"boolean",group:"Misc",defaultValue:false}}}});r.prototype.setOperation=function(e){return this.setProperty("operation",e,true)};r.prototype.setColumnKey=function(e){return this.setProperty("columnKey",e,true)};r.prototype.setValue1=function(e){return this.setProperty("value1",e,true)};r.prototype.setValue2=function(e){return this.setProperty("value2",e,true)};r.prototype.setExclude=function(e){return this.setProperty("exclude",e,true)};return r});
//# sourceMappingURL=P13nFilterItem.js.map