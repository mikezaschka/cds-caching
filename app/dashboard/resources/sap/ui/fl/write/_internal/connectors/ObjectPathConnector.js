/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/connectors/BaseConnector","sap/ui/fl/initial/_internal/StorageUtils","sap/base/util/LoaderExtensions"],function(e,t,r,n){"use strict";var s;return e({},t,{layers:[],setJsonPath(e){s=e},loadFlexData(e){const t=s||e.path;if(t){return n.loadResource({dataType:"json",url:t,async:true}).then(function(e){return{...r.getEmptyFlexDataResponse(),...e}})}return Promise.resolve()},loadFeatures(e){var t=s||e.path;if(t){return n.loadResource({dataType:"json",url:t,async:true}).then(function(e,t){t.componentClassName=e;return t.settings||{}}.bind(null,e.flexReference))}return Promise.resolve({})},loadVariantsAuthors(){return Promise.resolve({})}})});
//# sourceMappingURL=ObjectPathConnector.js.map