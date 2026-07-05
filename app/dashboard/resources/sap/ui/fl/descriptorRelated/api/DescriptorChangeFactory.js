/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/descriptorRelated/api/DescriptorChange"],function(e){"use strict";var t=function(){};t.prototype.createNew=function(t,r,a,n,o){if(r.setHostingIdForTextKey){r.setHostingIdForTextKey(t)}var i={};const p=r.getMap();i.changeType=p.changeType;i.fileName=r.fileName;i.componentName=t;i.reference=t;i.generator=o;i.support=p.support;i.adaptationId=p.adaptationId;i.layer=a||"CUSTOMER";return Promise.resolve(new e(i,r))};return t});
//# sourceMappingURL=DescriptorChangeFactory.js.map