/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/ManagedObject","sap/ui/fl/Utils"],function(e,t){"use strict";var n=e.extend("sap.ui.fl.util.HelperControl",{metadata:{library:"sap.ui.fl",properties:{resolved:{type:"any"}}}});return function(i,o){const r=t.getViewForControl(o);const s=r&&r.getController();if(!t.isBinding(i,s)){return undefined}const d=typeof i==="string"?e.bindingParser(i,s):{...i};if(!d){return undefined}const l=new n;const a=d.parts||[d];a.forEach(function(e){const t=e.model;if(t){l.setModel(o.getModel(t),t);l.setBindingContext(o.getBindingContext(t),t)}else{l.setModel(o.getModel());l.setBindingContext(o.getBindingContext())}});l.bindProperty("resolved",d);const u=l.getResolved();l.destroy();return u}});
//# sourceMappingURL=resolveBinding.js.map