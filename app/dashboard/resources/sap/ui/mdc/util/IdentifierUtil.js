/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/DataType"],e=>{"use strict";const t={replace:function(t){const r=function(){return"_"+Date.now().toString(36)+Math.random().toString(36).substring(2,12).padStart(12,0)+"_"};const n=e.getType("sap.ui.core.ID");if(!n.isValid(t)){t=t.replace(/[^A-Za-z0-9_.:]+/g,r())}return t},getFilterFieldId:function(e,r){return e.getId()+"--filter--"+t.replace(r)},getPropertyKey:function(e){return e.key||e.name},getPropertyPath:function(e){return e.path},getView:function(e){let t=null;if(e){let r=e.getParent();while(r){if(r.isA("sap.ui.core.mvc.View")){t=r;break}r=r.getParent()}}return t}};return t});
//# sourceMappingURL=IdentifierUtil.js.map