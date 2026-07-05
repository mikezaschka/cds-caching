/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element","sap/ui/fl/write/_internal/condenser/Utils"],function(t,e){"use strict";return{async addToReconstructionMap(n,a){const o=t.getElementById(a.affectedControl);const r=a.targetAggregation||o&&o.sParentAggregationName;const i=await e.getContainerElementIds(a.targetContainer,r,a.customAggregation,a.affectedControlIdProperty);const g=e.getInitialUIContainerElementIds(n,a.targetContainer,a.targetAggregation,i);const s=g.indexOf(a.affectedControl);if(s>-1){g.splice(s,1)}},simulate(t,e){t.splice(e.getTargetIndex(e.change),0,e.affectedControl)}}});
//# sourceMappingURL=Create.js.map