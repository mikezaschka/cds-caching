/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(e){"use strict";const t=new RegExp("^([a-zA-Z0-9]{2,3})(-[a-zA-Z0-9]{1,6})*$");const r={applyChange(r,n){if(!n.getContent().hasOwnProperty("ach")){throw new Error("No 'Application Component Hierarchy' (ACH) in change content provided")}if(typeof n.getContent().ach!=="string"){throw new Error(`The current change value type of property ach is '${typeof n.getContent().ach}'. Only allowed type for poperty ach is string`)}if(!t.test(n.getContent().ach)){throw new Error(`The current change value of property ach is '${n.getContent().ach}'. Supported values for property ach is the regular expression ${t}`)}e.set(["sap.app","ach"],n.getContent().ach,r);return r}};return r});
//# sourceMappingURL=SetAch.js.map