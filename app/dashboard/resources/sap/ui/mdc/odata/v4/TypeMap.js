/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["../TypeMap","sap/ui/mdc/enums/BaseType"],(e,t)=>{"use strict";const s=Object.assign({},e);s.addV4Constraint=function(e,t,s){return[e,Object.assign({},t,{V4:true})]};s.import(e);s.set("sap.ui.model.odata.type.DateTimeOffset",t.DateTime,s.addV4Constraint);s.freeze();return s});
//# sourceMappingURL=TypeMap.js.map