/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/fl/changeHandler/MoveControls"],function(e){"use strict";var n=Object.assign({},e);n.applyChange=function(n,t,r){var g=Object.assign({},r,{targetAggregation:"groupElements",sourceAggregation:"groupElements"});return e.applyChange.call(this,n,t,g)};n.getCondenserInfo=function(n){var t=e.getCondenserInfo.call(this,n);t.targetAggregation="groupElements";return t};return n},true);
//# sourceMappingURL=MoveFields.js.map