/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/initial/_internal/connectors/BackendConnector","sap/ui/fl/Layer"],function(e,r,a){"use strict";var t="/flex/personalization";var n="/v1";var s={isProductiveSystem:true,hasPersoConnector:true};var i=e({},r,{layers:[a.USER],ROUTES:{DATA:`${t+n}/data/`},loadFeatures(){return Promise.resolve(s)}});return i});
//# sourceMappingURL=PersonalizationConnector.js.map