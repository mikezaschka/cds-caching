/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/FakeLrepConnector","sap/ui/fl/write/_internal/connectors/SessionStorageConnector"],function(e,n){"use strict";return{enableFakeConnector(n){var r=n?n.sInitialComponentJsonPath:undefined;e.setFlexibilityServicesAndClearCache("SessionStorageConnector",r)},disableFakeConnector(){e.disableFakeConnector()},forTesting:{spyWrite(r,t){return e.forTesting.spyMethod(r,t,n,"write")},getNumberOfChanges(r){return e.forTesting.getNumberOfChanges(n,r)},clear(r){return e.forTesting.clear(n,r)},setStorage(r){e.forTesting.setStorage(n,r)},synchronous:{clearAll(){e.forTesting.synchronous.clearAll(window.sessionStorage)},getNumberOfChanges(r){return e.forTesting.synchronous.getNumberOfChanges(n.storage,r)}}}}},true);
//# sourceMappingURL=FakeLrepConnectorSessionStorage.js.map