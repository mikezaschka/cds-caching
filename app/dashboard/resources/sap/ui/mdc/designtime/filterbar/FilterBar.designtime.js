/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/p13n/Engine"],e=>{"use strict";return{actions:{settings:{"sap.ui.mdc":function(t){return e.getInstance()._runWithPersistence(t,t=>({name:"filterbar.ADAPT_TITLE",handler:function(t,n){return t.initializedWithMetadata().then(()=>e.getInstance().getRTASettingsActionHandler(t,n,"Item"))},CAUTION_variantIndependent:t}))}}},aggregations:{layout:{ignore:true},basicSearchField:{ignore:true},filterItems:{ignore:true}},properties:{showAdaptFiltersButton:{ignore:false},showClearButton:{ignore:false},p13nMode:{ignore:false}}}});
//# sourceMappingURL=FilterBar.designtime.js.map