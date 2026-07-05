/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./SelectionController","sap/m/p13n/SelectionPanel","sap/ui/core/Lib","sap/m/library"],(e,t,n,o)=>{"use strict";const{MultiSelectMode:r}=o;const l=n.getResourceBundleFor("sap.ui.mdc");const i=e.extend("sap.ui.mdc.p13n.subcontroller.ColumnController");i.prototype.getUISettings=function(){return{title:l.getText("table.SETTINGS_COLUMN"),tabText:l.getText("p13nDialog.TAB_Column")}};i.prototype.model2State=function(){const e=[];this._oPanel.getP13nData(true).forEach(t=>{if(t.visible){e.push({name:t.name})}});return e};i.prototype.createUI=function(e){const n=new t({showHeader:true,enableCount:true,title:l.getText("fieldsui.COLUMNS"),fieldColumn:l.getText("fieldsui.COLUMNS"),multiSelectMode:r.SelectAll});n.setEnableReorder(this._bReorderingEnabled);return n.setP13nData(e.items)};i.prototype.getChangeOperations=function(){return{add:"addColumn",remove:"removeColumn",move:"moveColumn"}};return i});
//# sourceMappingURL=ColumnController.js.map