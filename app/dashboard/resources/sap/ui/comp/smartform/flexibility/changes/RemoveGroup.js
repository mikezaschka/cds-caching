/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var e={};e.applyChange=function(e,n,r){var t=r.modifier;var a=r.view;var o=t.getParent(n);var i;var g;return Promise.resolve().then(t.findIndexInParentAggregation(n)).then(function(e){g=e;if(t.getControlType(o)==="sap.ui.layout.form.Form"){i="formContainers";return t.removeAggregation(o,"formContainers",n,a)}i="groups";return t.removeAggregation(o,"groups",n,a)}).then(t.insertAggregation.bind(t,o,"dependents",n,0,a)).then(function(){e.setRevertData({groupIndex:g,aggregation:i})})};e.completeChangeContent=function(e,n){};e.revertChange=function(e,n,r){var t=r.view;var a=r.modifier;var o=e.getRevertData();var i=a.getParent(n);return Promise.resolve().then(a.removeAggregation.bind(a,i,"dependents",n)).then(a.insertAggregation.bind(a,i,o.aggregation,n,o.groupIndex,t)).then(e.resetRevertData.bind(e))};return e},true);
//# sourceMappingURL=RemoveGroup.js.map