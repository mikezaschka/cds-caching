/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/_internal/connectors/LrepConnector","sap/ui/fl/initial/_internal/connectors/NeoLrepConnector"],function(e,t,n){"use strict";return e({},t,{initialConnector:n,layers:n.layers,isContextSharingEnabled(){return Promise.resolve(false)},loadContextDescriptions(){return Promise.reject("loadContextsDescriptions is not implemented")},getContexts(){return Promise.reject("getContexts is not implemented")},contextBasedAdaptation:{create(){return Promise.reject("contextBasedAdaptation.create is not implemented")},reorder(){return Promise.reject("contextBasedAdaptation.reorder is not implemented")},load(){return Promise.reject("contextBasedAdaptation.load is not implemented")}}})});
//# sourceMappingURL=NeoLrepConnector.js.map