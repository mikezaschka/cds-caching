/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/comp/odata/MetadataAnalyser"],function(e,t){"use strict";const n=e.extend("sap.ui.comp.delegates.Label",{constructor:function(t){e.apply(this,arguments);this.bSingle=t?.singleRename}});const a=(e,n,a)=>{const o=new t(e),i=o.getFieldsByEntitySetName(n)?.filter(e=>e.visible&&(!a||a===e.name));return i?.map(e=>({propertyName:e.name,annotationPath:`/dataServices/schema/0/entityType/[\${name}==='${e.entityName}']/property/[\${name}==='${e.name}']/com.sap.vocabularies.Common.v1.Label`,currentValue:e.fieldLabel}))};n.prototype.getAnnotationsChangeInfo=function(e){let t;const n=e.getFlexConfig()?.entitySetName;if(e&&e.isA("sap.ui.comp.smartform.GroupElement")&&this.bSingle){const n=e._getFieldRelevantForLabel();t=n?.getControlFactory()?.getEdmProperty()?.name}return{serviceUrl:e.getModel().getServiceUrl(),properties:a(e.getModel(),n,t)}};return n});
//# sourceMappingURL=Label.js.map