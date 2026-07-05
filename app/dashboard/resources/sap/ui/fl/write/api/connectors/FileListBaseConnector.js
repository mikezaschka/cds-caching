/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/base/util/LoaderExtensions","sap/ui/fl/initial/_internal/StorageUtils","sap/ui/fl/write/connectors/BaseConnector"],function(e,t,n,r){"use strict";return e({},r,{getFileList(){return Promise.reject("not implemented")},layers:[],loadFlexData(e){return this.getFileList(e.reference).then(function(e){return Promise.all(e.map(function(e){return t.loadResource({dataType:"json",url:e,async:true})})).then(function(e){var t=n.getGroupedFlexObjects(e);return n.filterAndSortResponses(t)})})}})});
//# sourceMappingURL=FileListBaseConnector.js.map