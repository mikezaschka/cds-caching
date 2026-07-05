/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(t){"use strict";var e={applyChange(e,a){if(!a.getContent().hasOwnProperty("abstract")){throw new Error("No abstract in change content provided")}if(a.getContent().abstract!==false){throw new Error(`The current change value of property abstract is '${a.getContent().abstract}'. Only allowed value for property abstract is boolean 'false'`)}t.set(["sap.fiori","abstract"],a.getContent().abstract,e);return e}};return e});
//# sourceMappingURL=SetAbstract.js.map