/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/write/_internal/condenser/Utils"],function(e){"use strict";return{async addToReconstructionMap(t,n){const o=await e.getContainerElementIds(n.targetContainer,n.targetAggregation,n.customAggregation,n.affectedControlIdProperty);const r=e.getInitialUIContainerElementIds(t,n.targetContainer,n.targetAggregation,o);if(r.length-1<n.sourceIndex){while(r.length-1<n.sourceIndex){const t=r.length;r.splice(r.length,0,e.PLACEHOLDER+t)}r[n.sourceIndex]=n.affectedControl}else{r.splice(n.sourceIndex,0,n.affectedControl)}},simulate(t,n,o){let r=t.indexOf(n.affectedControl);if(r===-1){const i=e.PLACEHOLDER+o.indexOf(n.affectedControl);r=t.indexOf(i)}n.revertIndex=r;if(r>-1){t.splice(r,1)}}}});
//# sourceMappingURL=Destroy.js.map