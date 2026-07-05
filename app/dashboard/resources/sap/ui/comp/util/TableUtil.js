/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var e={getCustomColumns:function(e){if(!e.isInitialised()){throw new Error("getCustomColumns method called before the SmartTable is initialized - "+e.getId())}return e._aExistingColumns.map(t=>e._getColumnByKey(t))},getRedundantProperties:function(e){const t=new Set,n=new Set(e._aColumnKeys);n.forEach(i=>{if(t.has(i)){return}const r=e._getColumnByKey(i);const o=r?.data("p13nData")??e._mLazyColumnMap[i];if(o?.displayBehaviour&&o?.description){if(n.has(o.description)){t.add(o.description)}}});return Array.from(t)}};return e},true);
//# sourceMappingURL=TableUtil.js.map