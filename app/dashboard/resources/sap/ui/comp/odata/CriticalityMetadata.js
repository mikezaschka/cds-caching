/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var i={"com.sap.vocabularies.UI.v1.CriticalityType/Neutral":0,"com.sap.vocabularies.UI.v1.CriticalityType/Negative":1,"com.sap.vocabularies.UI.v1.CriticalityType/Critical":2,"com.sap.vocabularies.UI.v1.CriticalityType/Positive":3,0:0,1:1,2:2,3:3};var t={0:"None",1:"Error",2:"Warning",3:"Success"};var r={0:null,1:"sap-icon://error",2:"sap-icon://alert",3:"sap-icon://sys-enter-2"};var a={getCriticalityState:function(r){if(typeof r==="string"){r=i[r]}return t[r]},getCriticalityIcon:function(t){if(typeof t==="string"){t=i[t]}return r[t]},getShowCriticalityIcon:function(i){return i==="com.sap.vocabularies.UI.v1.CriticalityRepresentationType/WithoutIcon"?false:true}};return a},true);
//# sourceMappingURL=CriticalityMetadata.js.map