/*
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["../library","./RowMode"],function(t,e){"use strict";const o=e.extend("sap.ui.table.rowmodes.Variable",{metadata:{library:"sap.ui.table",properties:{tableHeight:{type:"sap.ui.core.CSSSize",defaultValue:"100%",group:"Dimension"}}}});o.prototype.getComputedRowCounts=function(){const t=this.getTotalRowCountOfTable();const e=this.getHideEmptyRows()?Math.min(this.getRowCount(),t):this.getRowCount();return{count:e,fixedTopCount:this.getFixedTopRowCount(),fixedBottomCount:this.getFixedBottomRowCount()}};o.prototype.getTableHeight=function(){return{height:this.getTableHeight()}};o.prototype.getRowContainerHeight=function(){return{height:this.getComputedRowCounts().count*this.getBaseRowHeightOfTable()}};return o});
//# sourceMappingURL=Variable.js.map