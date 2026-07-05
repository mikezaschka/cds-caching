/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/library","sap/ui/core/Element"],function(e,t){"use strict";var r=t.extend("sap.ui.comp.smartfilterbar.GroupConfiguration",{metadata:{library:"sap.ui.comp",properties:{key:{type:"string",group:"Misc",defaultValue:null},index:{type:"any",group:"Misc",defaultValue:undefined},label:{type:"any",group:"Misc",defaultValue:undefined}},events:{change:{parameters:{propertyName:{type:"string"}}}}}});r.prototype.setLabel=function(e){this.setProperty("label",e);this.fireChange({propertyName:"label"});return this};return r});
//# sourceMappingURL=GroupConfiguration.js.map