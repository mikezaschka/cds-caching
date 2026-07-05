/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/enums/BaseType","sap/ui/mdc/DefaultTypeMap","sap/base/Log"],(e,t,i)=>{"use strict";const p={};p.getTypeUtil=function(e){return this.getTypeMap(e)};p.getTypeMap=function(e){if(this.getTypeUtil&&this.getTypeUtil!==p.getTypeUtil){return this.getTypeUtil(e)}return t};return p});
//# sourceMappingURL=BaseDelegate.js.map