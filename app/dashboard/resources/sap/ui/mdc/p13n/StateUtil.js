/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/p13n/Engine"],e=>{"use strict";const t={applyExternalState:function(t,n){const a=e.getInstance().internalizeKeys(t,n);return e.getInstance().applyState(t,a,false)},retrieveExternalState:function(t){return e.getInstance().retrieveState(t).then(n=>e.getInstance().externalizeKeys(t,n))},resetState:function(t){const n=e.getInstance().getRegisteredControllers(t);return e.getInstance().reset(t,n)},diffState:function(t,n,a){return e.getInstance().diffState(t,e.getInstance().internalizeKeys(t,n),e.getInstance().internalizeKeys(t,a)).then(n=>e.getInstance().externalizeKeys(t,n))},attachStateChange:function(t){e.getInstance().stateHandlerRegistry.attachChange(t)},detachStateChange:function(t){e.getInstance().stateHandlerRegistry.detachChange(t)}};return t});
//# sourceMappingURL=StateUtil.js.map