/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/BaseDelegate","sap/ui/core/message/MessageType","sap/ui/mdc/enums/FilterBarValidationStatus"],(e,t,n)=>{"use strict";const i=Object.assign({},e);i.fetchProperties=function(e){return Promise.resolve([])};i.addItem=function(e,t,n){return Promise.resolve()};i.removeItem=function(e,t,n){return Promise.resolve(true)};i.validateState=function(e,n){const i=t.None;return{validation:i,message:undefined}};i.onAfterXMLChangeProcessing=function(e,t){};i.determineValidationState=function(e){return n.NoError};i.visualizeValidationState=function(e,t){};return i});
//# sourceMappingURL=AggregationBaseDelegate.js.map