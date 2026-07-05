/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Control"],t=>{"use strict";const e=t.extend("sap.ui.mdc.filterbar.p13n.FilterGroupLayout",{metadata:{library:"sap.ui.mdc"},renderer:{apiVersion:2,render:function(t,e){t.openStart("div",e);t.style("height","100%");t.openEnd();t.renderControl(e.getItems()[0]);t.close("div")}}});e.prototype._getFieldPath=function(){return this._oFilterField?this._oFilterField.getPropertyKey():null};e.prototype.setFilterField=function(t){this._oFilterField=t};e.prototype.getIdForLabel=function(){return this._oFilterField&&this._oFilterField.getIdForLabel()};e.prototype.getAccessibilityInfo=function(){return{children:this.getItems()}};e.prototype.getItems=function(){const t=[];t.push(this._oFilterField);return t};e.prototype.exit=function(){t.prototype.exit.apply(this,arguments);this._oFilterField=null};return e});
//# sourceMappingURL=FilterGroupLayout.js.map