/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],()=>{"use strict";function e(){return{actions:{},aggregations:{},description:"{description}",name:"{name}",properties:{}}}function t(e,t,i){const n=e.includes(t);const r=n&&i[t]||{};if(!Object.keys(r).length){r[t]={ignore:!n};Object.assign(i,r)}}return{getDesignTime:function(i,n,r,s){s=s?s:e();s.actions=s.actions?s.actions:{};s.properties=s.properties?s.properties:{};s.aggregations=s.aggregations?s.aggregations:{};n=n?n:[];r=r?r:[];const g=i.getMetadata(),o=Object.keys(g.getAllProperties()).concat(Object.keys(g.getAllPrivateProperties())),a=Object.keys(g.getAllAggregations()).concat(Object.keys(g.getAllPrivateAggregations()));o.forEach(e=>{t(n,e,s.properties)});a.forEach(e=>{t(r,e,s.aggregations)});return s}}});
//# sourceMappingURL=Util.js.map