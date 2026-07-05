/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/p13n/Engine","sap/ui/mdc/Chart","../Util"],(e,n,t)=>{"use strict";const i={actions:{settings:{"sap.ui.mdc":function(n){return e.getInstance()._runWithPersistence(n,n=>({name:"p13nDialog.VIEW_SETTINGS",handler:function(n,t){const i=n.getP13nMode();const r=i.indexOf("Type");if(r>-1){i.splice(r,1)}if(n.isPropertyHelperFinal()){return e.getInstance().getRTASettingsActionHandler(n,t,i)}else{return n.finalizePropertyHelper().then(()=>e.getInstance().getRTASettingsActionHandler(n,t,i))}},CAUTION_variantIndependent:n}))}}},aggregations:{_toolbar:{propagateMetadata:function(e){return null}}}};const r=["_toolbar"],a=["headerLevel","headerVisible"];return t.getDesignTime(n,a,r,i)});
//# sourceMappingURL=Chart.designtime.js.map