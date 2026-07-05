/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var e={};e.applyChange=function(e,r,n){var t=n.modifier;var i=n.view;var a=t.getParent(r);if(a){return Promise.resolve().then(t.findIndexInParentAggregation.bind(t,r)).then(function(n){e.setRevertData({fieldIndex:n});return t.removeAggregation(a,"groupElements",r,i)})}return Promise.resolve()};e.completeChangeContent=function(e,r){};e.revertChange=function(e,r,n){var t=n.view;var i=n.modifier;var a=e.getRevertData().fieldIndex;var o=i.getParent(r);return Promise.resolve().then(i.insertAggregation.bind(i,o,"groupElements",r,a,t)).then(e.resetRevertData.bind(e))};return e},true);
//# sourceMappingURL=RemoveField.js.map