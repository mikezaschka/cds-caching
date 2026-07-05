/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/apply/_internal/connectors/ObjectStorageUtils","sap/ui/fl/initial/_internal/StorageUtils","sap/ui/fl/interfaces/BaseLoadConnector"],function(e,t,n,r){"use strict";function a(e){var n=[];return t.forEachObjectInStorage(e,function(e){n.push(e.changeDefinition)}).then(function(){return n})}var o=e({},r,{oStorage:undefined,layers:["ALL"],loadFlexData(e){return a({storage:this.oStorage,reference:e.reference}).then(function(e){var t=n.getGroupedFlexObjects(e);return n.filterAndSortResponses(t)})}});o.storage=o.oStorage;return o});
//# sourceMappingURL=ObjectStorageConnector.js.map