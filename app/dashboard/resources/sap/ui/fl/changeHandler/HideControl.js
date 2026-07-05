/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/fl/changeHandler/condenser/Classification","sap/ui/core/util/reflection/JsControlTreeModifier"],function(e,t,n){"use strict";const i="visible";const o={};o.applyChange=async function(e,t,n){const i=n.modifier;const o=await i.getVisible(t);e.setRevertData({originalValue:o});i.setVisible(t,false)};o.revertChange=function(t,n,i){const o=t.getRevertData();if(o){i.modifier.setVisible(n,o.originalValue);t.resetRevertData()}else{e.error("Attempt to revert an unapplied change.")}};o.completeChangeContent=function(){};o.getCondenserInfo=function(e){return{affectedControl:e.getSelector(),classification:t.Reverse,uniqueKey:i}};o.getChangeVisualizationInfo=function(e,t){const i=e.getSelector();const o=n.bySelector(i,t);const r={affectedControls:[i],updateRequired:true};function a(e){if(!e){return null}if(e.getVisible?.()){return e}return a(e.getParent())}const s=a(o);if(s){r.displayControls=[s.getId()]}return r};return o});
//# sourceMappingURL=HideControl.js.map