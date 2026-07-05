/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/FakeLrepConnector","sap/ui/fl/write/_internal/connectors/LocalStorageConnector"],function(e,n){"use strict";return{enableFakeConnector(n){var o=n?n.sInitialComponentJsonPath:undefined;e.setFlexibilityServicesAndClearCache("LocalStorageConnector",o)},disableFakeConnector(){e.disableFakeConnector()},forTesting:{spyWrite(o,r){return e.forTesting.spyMethod(o,r,n,"write")},getNumberOfChanges(o){return e.forTesting.getNumberOfChanges(n,o)},synchronous:{clearAll(){e.forTesting.synchronous.clearAll(window.localStorage)},store(n,o){e.forTesting.synchronous.store(window.localStorage,n,o)}}}}},true);
//# sourceMappingURL=FakeLrepConnectorLocalStorage.js.map