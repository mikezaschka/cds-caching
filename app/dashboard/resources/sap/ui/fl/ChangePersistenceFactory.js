/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/ui/fl/ChangePersistence"],function(e,n){"use strict";var t={};t._instanceCache={};t.getChangePersistenceForComponent=function(e){var r=t._instanceCache[e];if(!r){var a={name:e};r=new n(a);t._instanceCache[e]=r}return r};t.getChangePersistenceForControl=function(n){var r;r=e.getFlexReferenceForControl(n);return t.getChangePersistenceForComponent(r)};return t});
//# sourceMappingURL=ChangePersistenceFactory.js.map