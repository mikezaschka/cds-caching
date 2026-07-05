/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/ActionToolbar","sap/m/p13n/Engine","../Util"],(n,t,e)=>{"use strict";const a={description:"{description}",name:"{name}",aggregations:{between:{propagateMetadata:function(n){if(n.isA("sap.ui.fl.variants.VariantManagement")){return null}return{actions:"not-adaptable"}}},actions:{propagateRelevantContainer:true}},properties:{},actions:{settings:{"sap.ui.mdc":{name:"actiontoolbar.RTA_SETTINGS_NAME",handler:function(n,e){return t.getInstance().getRTASettingsActionHandler(n,e,"actionsKey").then(n=>n)},CAUTION_variantIndependent:true}}}},i=["actions","between"],r=[];return e.getDesignTime(n,r,i,a)});
//# sourceMappingURL=ActionToolbar.designtime.js.map