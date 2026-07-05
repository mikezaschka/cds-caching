/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(t){"use strict";const e=["released","deprecated","obsolete"];var o={applyChange(o,a){if(!a.getContent().hasOwnProperty("cloudDevAdaptationStatus")){throw new Error("No cloudDevAdaptationStatus in change content provided")}if(typeof a.getContent().cloudDevAdaptationStatus!=="string"){throw new Error(`The current change value type of property cloudDevAdaptationStatus is '${typeof a.getContent().cloudDevAdaptationStatus}'. Only allowed type for poperty cloudDevAdaptationStatus is string`)}if(!e.includes(a.getContent().cloudDevAdaptationStatus)){throw new Error(`The current change value of property cloudDevAdaptationStatus is '${a.getContent().cloudDevAdaptationStatus}'. Supported values for property cloudDevAdaptationStatus are ${e.join("|")}`)}t.set(["sap.fiori","cloudDevAdaptationStatus"],a.getContent().cloudDevAdaptationStatus,o);return o}};return o});
//# sourceMappingURL=SetCloudDevAdaptationStatus.js.map