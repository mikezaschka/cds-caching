/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Renderer","sap/ui/mdc/enums/FieldEditMode"],(e,t)=>{"use strict";let n=e.extend("sap.ui.mdc.field.FieldBaseRenderer");n=Object.assign(n,{apiVersion:2});n.render=function(e,n){const s=n.getCurrentContent();const i=n.getWidth();const d=n.getConditions();const o=n.getEditMode();const a=n.getShowEmptyIndicator()&&d.length===0&&o===t.Display&&!n.getContent()&&!n.getContentDisplay();e.openStart("div",n);e.class("sapUiMdcFieldBase");if(s.length===0&&o!==t.Display){e.attr("tabindex","-1")}if(s.length>1){e.class("sapUiMdcFieldBaseMoreFields")}if(a){e.class("sapMShowEmpty-CTX")}e.style("width",i);e.openEnd();for(const t of s){e.renderControl(t)}e.close("div")};return n});
//# sourceMappingURL=FieldBaseRenderer.js.map