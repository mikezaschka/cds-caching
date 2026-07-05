/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/ui/fl/FlexController","sap/ui/fl/Utils"],function(e,r,t,n){"use strict";var a={};a._instanceCache={};a.create=function(e){var r=a._instanceCache[e];if(!r){r=new t(e);a._instanceCache[e]=r}return r};a.createForControl=function(t){try{var o=n.getAppComponentForControl(t);var c=r.getFlexReferenceForControl(o||t);return a.create(c)}catch(r){e.error(r.message,undefined,"sap.ui.fl.FlexControllerFactory")}};a.createForSelector=function(e){var t=r.getFlexReferenceForSelector(e);return a.create(t)};return a});
//# sourceMappingURL=FlexControllerFactory.js.map