/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";return{addToChangesMap(e,n,t){if(!e[n.uniqueKey]){n.change=t;e[n.uniqueKey]=n;t.condenserState="select"}else{e[n.uniqueKey].oldestChange=t;t.condenserState="delete"}},getChangesFromMap(e,n){return Object.values(e[n]).map(e=>e.change)}}});
//# sourceMappingURL=LastOneWins.js.map