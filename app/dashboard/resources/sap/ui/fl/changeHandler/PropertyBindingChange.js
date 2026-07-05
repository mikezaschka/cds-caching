/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/fl/changeHandler/condenser/Classification"],function(e,t){"use strict";var n={};n.applyChange=function(e,t,n){var r=e.getContent();var i=r.property;var o=r.newBinding;var a=n.modifier;return Promise.resolve().then(a.getPropertyBindingOrProperty.bind(a,t,i)).then(function(n){e.setRevertData({originalValue:n});a.setPropertyBinding(t,i,o)})};n.revertChange=function(t,n,r){var i=t.getRevertData();if(i){var o=t.getContent();var a=o.property;var s=i.originalValue;var p=r.modifier;p.setPropertyBindingOrProperty(n,a,s);t.resetRevertData()}else{e.error("Attempt to revert an unapplied change.")}};n.completeChangeContent=function(e,t){if(!t.content){throw new Error("oSpecificChangeInfo attribute required")}e.setContent(t.content)};n.getCondenserInfo=function(e){return{affectedControl:e.getSelector(),classification:t.LastOneWins,uniqueKey:e.getContent().property}};return n},true);
//# sourceMappingURL=PropertyBindingChange.js.map