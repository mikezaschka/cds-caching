/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/smartfield/SideEffectUtil"],function(e){"use strict";var i={applyFieldGroupIDs:function(i,r,t,o){var n,s,t,d;if(!i||!r){throw new Error("Missing control or metadata on applying the field group ids.")}if(!i.setFieldGroupIds){throw new Error("Control does not have setFieldGroupId method.")}if(!o){s=i}else{if(!o.isA("sap.ui.model.Context")){throw new Error("The provided context is incorrect type.")}s={getBindingContext:function(){return o}}}n=new e(s);if(!t){t=i.getParent();while(t){if(t.isA("sap.ui.core.mvc.View")){break}t=t.getParent()}if(!t||!t.isA("sap.ui.core.mvc.View")){throw new Error("Missing control's view on applying the field group ids.")}}d=n.getFieldGroupIDs(r,t);i.setFieldGroupIds(d);n.destroy();return d}};return i},true);
//# sourceMappingURL=SharedUtil.js.map