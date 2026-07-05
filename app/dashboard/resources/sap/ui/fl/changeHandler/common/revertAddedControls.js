/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Utils"],function(e){"use strict";return async function(t,o,n){const r=n.modifier;let i=t.getContent().targetAggregation;const a=n.view||e.getViewForControl(o);const s=n.appComponent;const c=t.getRevertData()||[];for(const e of c){let t;if(typeof e==="string"){t=e}else{t=e.id;i||=e.aggregationName}const n=r.bySelector(t,s,a)||a?.createId&&r.bySelector(a.createId(t));if(n.destroy){n.destroy()}await r.removeAggregation(o,i,n)}t.resetRevertData()}});
//# sourceMappingURL=revertAddedControls.js.map