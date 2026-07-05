/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";return async function(n,t,e){const i=e.modifier;const o=n.getContent();const r=o.targetAggregation;const g=o.index;if(g===undefined){const n=await i.getAggregation(t,r);return n.length}return g}});
//# sourceMappingURL=getTargetAggregationIndex.js.map