/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Component","sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/ui/fl/write/api/ContextBasedAdaptationsAPI","sap/ui/core/ComponentContainer","sap/ui/fl/Layer","sap/ui/fl/registry/Settings"],function(e,t,n,a,r,i){"use strict";let o=Promise.resolve();var s={async isContextSharingEnabled(e){if(e.layer!==r.CUSTOMER){return false}const a=t.getFlexReferenceForControl(e.variantManagementControl);const o=await i.getInstance();const s=o.isContextSharingEnabled()&&!n.adaptationExists({reference:a,layer:r.CUSTOMER});return s},async createComponent(t){if(await this.isContextSharingEnabled(t)){o=o.then(async t=>{if(t&&!t.isDestroyed()){return t}const n=await e.create({name:"sap.ui.fl.variants.context",id:"contextSharing"});n.showMessageStrip(true);n.setSelectedContexts({role:[]});t=new a("contextSharingContainer",{component:n});await n.getRootControl().oAsyncState.promise;return t});return o}return undefined}};return s});
//# sourceMappingURL=ContextSharingAPI.js.map