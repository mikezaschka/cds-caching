/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Lib","sap/ui/mdc/FilterBarDelegate"],(e,t)=>{"use strict";const i=e.getResourceBundleFor("sap.ui.mdc");const r=Object.assign({},t);r.fetchProperties=function(e){const t=e.getParent();let r="$search";if(t&&!t.isPropertyInitial("filterFields")){r=t.getFilterFields()}return Promise.resolve([{name:r,label:i.getText("filterbar.SEARCH"),dataType:"sap.ui.model.type.String"}])};return r});
//# sourceMappingURL=FilterBarDelegate.js.map