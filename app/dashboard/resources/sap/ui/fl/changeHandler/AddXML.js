/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/changeHandler/BaseAddXml"],function(e){"use strict";var t={};t.applyChange=function(t,n,r){var g=t.getContent();var a={aggregationName:g.targetAggregation,index:g.index};return e.applyChange(t,n,r,a)};t.revertChange=e.revertChange;t.completeChangeContent=function(t,n){const r=n.content||n;const g={};if(!r.targetAggregation){e._throwMissingAttributeError("targetAggregation")}else{g.targetAggregation=r.targetAggregation}if(r.index===undefined){e._throwMissingAttributeError("index")}else{g.index=r.index}e.completeChangeContent(t,n,g)};return t});
//# sourceMappingURL=AddXML.js.map