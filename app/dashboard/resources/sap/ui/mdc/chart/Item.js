/*
 * !OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element","sap/base/Log"],(t,e)=>{"use strict";const r=t.extend("sap.ui.mdc.chart.Item",{metadata:{abstract:false,library:"sap.ui.mdc",properties:{name:{type:"string"},propertyKey:{type:"string"},label:{type:"string"},type:{type:"string"},role:{type:"string"}}}});r.prototype.getPropertyKey=function(){const t=this.getProperty("propertyKey");return t||this.getName()};return r});
//# sourceMappingURL=Item.js.map