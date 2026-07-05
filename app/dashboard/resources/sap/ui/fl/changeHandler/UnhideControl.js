/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/core/util/reflection/JsControlTreeModifier","sap/ui/fl/changeHandler/condenser/Classification"],function(e,t,n){"use strict";const i="visible";const r={};r.applyChange=async function(e,t,n){const r=n.modifier;const o=await r.getProperty(t,i);e.setRevertData({originalValue:o});n.modifier.setVisible(t,true)};r.revertChange=function(t,n,i){const r=t.getRevertData();if(r){i.modifier.setVisible(n,r.originalValue);t.resetRevertData()}else{e.error("Attempt to revert an unapplied change.")}};r.completeChangeContent=function(){};r.getCondenserInfo=function(e){return{affectedControl:e.getSelector(),classification:n.Reverse,uniqueKey:i}};r.getChangeVisualizationInfo=function(e,n){const i=e.getSelector();const r=t.bySelector(i,n);const o={updateRequired:true};function a(e){if(!e){return null}if(e.getVisible?.()){return e}return a(e.getParent())}if(!r.getVisible()){const e=a(r.getParent());if(e){o.displayControls=[e.getId()]}}return o};return r});
//# sourceMappingURL=UnhideControl.js.map