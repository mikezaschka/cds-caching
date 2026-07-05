/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./GridTableType"],e=>{"use strict";let t;const r=e.extend("sap.ui.mdc.table.TreeTableType",{metadata:{library:"sap.ui.mdc"}});r.prototype.loadModules=function(){if(t){return Promise.resolve()}return e.prototype.loadModules.apply(this,arguments).then(()=>new Promise((e,r)=>{sap.ui.require(["sap/ui/table/TreeTable"],r=>{t=r;e()},()=>{r("Failed to load some modules")})}))};r.prototype.createTable=function(e){const r=this.getTable();if(!r||!t){return null}const a=new t(e,this.getTableSettings());a._oProxy._bEnableV4=true;return a};return r});
//# sourceMappingURL=TreeTableType.js.map