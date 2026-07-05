/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/designtime/smartform/Group.designtime","sap/base/util/merge"],function(e,a){"use strict";var t=a({},e);t.aggregations.formElements.actions.add.delegate.changeType="addMultiEditField";return{aggregations:{layout:{ignore:false,propagateMetadata:function(e){if(e.getMetadata().getName()==="sap.ui.comp.smartform.Group"){return t}}}}}});
//# sourceMappingURL=Container.designtime.js.map