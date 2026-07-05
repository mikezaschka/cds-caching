/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/api/connectors/ObjectStorageConnector"],function(e,t){"use strict";var a=e({},t,{storage:window.sessionStorage});a.loadFeatures=function(...a){return t.loadFeatures.apply(this,a).then(function(t){return e({isPublicLayerAvailable:true,isPublicFlVariantEnabled:true,isVariantAdaptationEnabled:true},t)})};return a});
//# sourceMappingURL=SessionStorageConnector.js.map