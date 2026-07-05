/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/support/_internal/extractChangeDependencies","sap/ui/fl/Utils"],function(n,e){"use strict";function t(e){var t=e.oContainer.getComponentInstance();return n(t)}return async function(n){if(!n){const n=await e.getUShellService("AppLifeCycle");return t(n.getCurrentApplication().componentInstance)}return t(n)}});
//# sourceMappingURL=getChangeDependencies.js.map