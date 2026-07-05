/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/Version"],function(e){"use strict";function i(i,n){var r={};if(n.minVersion){var s=new e(i.minVersion);r.minVersion=s.compareTo(n.minVersion)>=0?i.minVersion:n.minVersion}if(n.lazy){r.lazy=i.lazy===n.lazy===true}return r}var n={applyChange(e,n){e["sap.ui5"].dependencies.libs||={};var r=e["sap.ui5"].dependencies.libs;var s=n.getContent().libraries;Object.keys(s).forEach(function(e){if(r[e]){r[e]=i(r[e],s[e])}else{r[e]=s[e]}});return e}};return n});
//# sourceMappingURL=AddLibrary.js.map