/*
 * ! OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/initial/_internal/FlexInfoSession","sap/ui/fl/registry/Settings"],function(e,n){"use strict";var i={};i.isKeyUser=async function(){const e=await n.getInstance();return e.isKeyUser()};i.getFlexVersion=function(n){return e.getByReference(n.reference)?.version};return i});
//# sourceMappingURL=InitialFlexAPI.js.map