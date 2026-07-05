/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./SelectionController"],t=>{"use strict";const e=t.extend("sap.ui.mdc.p13n.subcontroller.ChartTypeController",{constructor:function(){t.apply(this,arguments);this._bResetEnabled=true}});e.prototype.getCurrentState=function(){return{properties:{chartType:this.getAdaptationControl().getChartType()}}};e.prototype.getStateKey=function(){return"supplementaryConfig"};e.prototype.getDelta=function(t){let e;if(t.changedState&&t.changedState.properties){e=t.changedState.properties.chartType}const r=this.getAdaptationControl().getChartType();let n=[];if(e&&e!==r){n=[{selectorElement:t.control,changeSpecificData:{changeType:"setChartType",content:{chartType:e}}}]}return n};return e});
//# sourceMappingURL=ChartTypeController.js.map