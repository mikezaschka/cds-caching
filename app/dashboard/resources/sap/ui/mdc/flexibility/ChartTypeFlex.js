/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/flexibility/Util","sap/ui/fl/changeHandler/condenser/Classification"],(e,t)=>{"use strict";const r={};const n=function(e,t,r){const n=r.modifier;return Promise.resolve().then(n.getProperty.bind(n,t,"chartType")).then(r=>{e.setRevertData(r);n.setProperty(t,"chartType",e.getContent().chartType)})};const a=function(e,t,r){r.modifier.setProperty(t,"chartType",e.getRevertData());e.resetRevertData();return Promise.resolve()};const i=function(e,r){return{classification:t.LastOneWins,affectedControl:e.getSelector(),uniqueKey:"chartType"}};r.setChartType=e.createChangeHandler({apply:n,revert:a,getCondenserInfo:i});return r});
//# sourceMappingURL=ChartTypeFlex.js.map