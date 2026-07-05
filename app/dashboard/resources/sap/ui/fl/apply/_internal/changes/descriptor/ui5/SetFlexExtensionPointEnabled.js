/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(n){"use strict";var e={applyChange(e,t){if(!t.getContent().flexExtensionPointEnabled){throw new Error("No flexExtensionPointEnabled in change content provided")}n.set(["sap.ui5","flexExtensionPointEnabled"],t.getContent().flexExtensionPointEnabled,e);return e}};return e});
//# sourceMappingURL=SetFlexExtensionPointEnabled.js.map