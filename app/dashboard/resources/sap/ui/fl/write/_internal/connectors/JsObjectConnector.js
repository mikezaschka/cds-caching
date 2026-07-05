/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/api/connectors/ObjectStorageConnector"],function(e,t){"use strict";var r={_itemsStoredAsObjects:true,_items:{},setItem(e,t){r._items[e]=t},removeItem(e){delete r._items[e]},clear(){r._items={}},getItem(e){return r._items[e]},getItems(){return r._items}};var i=e({},t,{storage:r});i.loadFeatures=function(...r){return t.loadFeatures.apply(this,r).then(function(t){return e({isPublicLayerAvailable:true,isVariantAdaptationEnabled:true},t)})};return i});
//# sourceMappingURL=JsObjectConnector.js.map