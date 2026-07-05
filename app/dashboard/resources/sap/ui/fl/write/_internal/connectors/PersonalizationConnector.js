/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/write/_internal/connectors/BackendConnector","sap/ui/fl/initial/_internal/connectors/PersonalizationConnector"],function(n,e,a){"use strict";var i="/flex/personalization";var r="/v1";var t=n({},e,{layers:a.layers,ROUTES:{CHANGES:`${i+r}/changes/`,TOKEN:`${i+r}/actions/getcsrftoken`}});t.initialConnector=a;return t});
//# sourceMappingURL=PersonalizationConnector.js.map