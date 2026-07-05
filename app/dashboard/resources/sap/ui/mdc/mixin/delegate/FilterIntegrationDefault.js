/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/util/FilterUtil","sap/ui/core/Element","sap/ui/model/Filter"],(t,e,n)=>{"use strict";function r(e,n){return t.getFilterInfo(n,e?.getConditions()||{},e?.getPropertyHelper?.()?.getProperties()||[])?.filters}function i(t,e){return t.isFilteringEnabled()&&r(t,e)}function s(t,n){const i=t.getFilter();const s=i&&e.getElementById(i);return r(s,n)}const u={};u.getFilters=function(t){const e=this.getTypeMap(t);const r=i(t,e);const u=s(t,e);if(r&&u){return[new n([r,u],true)]}if(r||u){return[r||u]}return[]};return u});
//# sourceMappingURL=FilterIntegrationDefault.js.map