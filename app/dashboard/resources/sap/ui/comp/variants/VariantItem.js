/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/library","sap/m/VariantItem"],function(e,t){"use strict";var a=t.extend("sap.ui.comp.variants.VariantItem",{metadata:{library:"sap.ui.comp",properties:{executeOnSelection:{type:"boolean",group:"Misc",defaultValue:false},readOnly:{type:"boolean",group:"Misc",defaultValue:false},lifecycleTransportId:{type:"string",group:"Misc",defaultValue:null},global:{type:"boolean",group:"Misc",defaultValue:null},lifecyclePackage:{type:"string",group:"Misc",defaultValue:null},namespace:{type:"string",group:"Misc",defaultValue:null},accessOptions:{type:"string",group:"Misc",defaultValue:null,deprecated:true},labelReadOnly:{type:"boolean",group:"Misc",defaultValue:false}},events:{change:{parameters:{propertyName:{type:"string"}}}}}});a.prototype.setText=function(e){this.setProperty("text",e);this.fireChange({propertyName:"text"});return this};return a});
//# sourceMappingURL=VariantItem.js.map