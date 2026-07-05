/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Control"],e=>{"use strict";const t=e.extend("sap.ui.mdc.valuehelp.base.DialogTab",{metadata:{library:"sap.ui.mdc",properties:{content:{type:"object"}},events:{select:{parameters:{type:{type:"sap.ui.mdc.enums.ValueHelpSelectionType"},conditions:{type:"object[]"}}},confirm:{parameters:{close:{type:"boolean"}}},cancel:{}}},renderer:{apiVersion:2,render:function(e,t){e.openStart("div",t);e.class("sapUiMdcDialogTab");e.openEnd();const n=t.getContent();if(n){e.renderControl(n)}e.close("div")}}});t.prototype.init=function(){e.prototype.init.apply(this,arguments)};t.prototype.exit=function(){if(this._displayContent){this._displayContent=null}return e.prototype.exit.apply(this,arguments)};return t});
//# sourceMappingURL=DialogTab.js.map