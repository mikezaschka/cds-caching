/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Renderer","sap/m/MultiInputRenderer","sap/ui/mdc/field/FieldInputRenderUtil"],(e,t,i)=>{"use strict";const s=e.extend(t);s.apiVersion=2;s.addOuterClasses=function(e,i){t.addOuterClasses.apply(this,arguments);e.class("sapUiMdcFieldMultiInput")};s.getAriaRole=function(e){return i.getAriaRole.call(this,e,t)};s.getAccessibilityState=function(e){return i.getAccessibilityState.call(this,e,t)};s.writeInnerAttributes=function(e,s){return i.writeInnerAttributes.call(this,e,s,t)};return s});
//# sourceMappingURL=FieldMultiInputRenderer.js.map