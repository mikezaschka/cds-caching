/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/ColumnListItem","sap/m/ColumnListItemRenderer","sap/m/Label"],(t,e,i)=>{"use strict";const r=t.extend("sap.ui.mdc.filterbar.p13n.FilterColumnLayout",{metadata:{library:"sap.ui.mdc"},renderer:e});r.prototype._getFieldPath=function(){return this._oFilterField?this._oFilterField.getPropertyKey():null};r.prototype.setFilterField=function(t){this._oFilterField=t;this._sLabel=t.getLabel()};r.prototype.getCells=function(){const t=[];const e=new i({text:this._sLabel});e.setParent(this);t.push(e);t.push(this._oFilterField);return t};r.prototype.exit=function(){t.prototype.exit.apply(this,arguments);this._oFilterField=null};return r});
//# sourceMappingURL=FilterColumnLayout.js.map