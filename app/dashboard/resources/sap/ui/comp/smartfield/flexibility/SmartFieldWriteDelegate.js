/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function(){"use strict";const e=true;function r(r){return r.modifier.createControl("sap.ui.comp.smartfield.SmartLabel",r.appComponent,r.view,r.labelFor+"-label",{labelFor:r.labelFor},e)}function t(r){return r.modifier.createControl("sap.ui.comp.smartfield.SmartField",r.appComponent,r.view,r.fieldSelector,{value:"{"+r.bindingPath+"}"},e)}var n={};n.createLabel=function(e){return r(e)};n.createControlForProperty=async function(e){const r=await t(e);return{control:r,valueHelp:undefined}};return n});
//# sourceMappingURL=SmartFieldWriteDelegate.js.map