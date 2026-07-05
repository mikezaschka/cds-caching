/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/api/connectors/ObjectStorageConnector"],function(e,a){"use strict";var t=e({},a,{storage:window.localStorage});t.loadFeatures=function(...t){return a.loadFeatures.apply(this,t).then(function(a){return e({isPublicLayerAvailable:true,isPublicFlVariantEnabled:true,isVariantAdaptationEnabled:true,isCondensingEnabled:false},a)})};return t});
//# sourceMappingURL=LocalStorageConnector.js.map