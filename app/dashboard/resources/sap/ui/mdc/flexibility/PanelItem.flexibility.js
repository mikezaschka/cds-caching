/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element","sap/ui/fl/changeHandler/HideControl","sap/ui/fl/changeHandler/UnhideControl"],(e,n,r)=>{"use strict";return{createChanges:function(n){return n.map(n=>{const r=e.getElementById(n.id);if(!r){throw new Error("Invalid 'id'. For the id "+n.id+" no existing control could be found")}return{selectorElement:r,changeSpecificData:{changeType:n.visible?"revealItem":"hideItem"}}})},revealItem:{layers:{USER:true},changeHandler:r},hideItem:{layers:{USER:true},changeHandler:n}}},true);
//# sourceMappingURL=PanelItem.flexibility.js.map