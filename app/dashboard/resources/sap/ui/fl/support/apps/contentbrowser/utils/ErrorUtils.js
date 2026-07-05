/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/MessageItem","sap/m/MessagePopover","sap/ui/model/json/JSONModel"],function(e,s,o){"use strict";var t={};t._masterComponent=undefined;t._messagesModel=undefined;t._emptyModel=new o([]);t._messageTemplate=new e({type:"{messages>type}",title:"{messages>title}",description:"{messages>description}"});t._messagePopover=new s({items:{path:"messages>/",template:t._messageTemplate}});t.setMessagesModel=function(e,s){t._masterComponent=e;t._messagesModel=s;t._messagePopover.setModel(t._messagesModel,"messages")};t.handleMessagePopoverPress=function(e){t._messagePopover.openBy(e)};t.displayError=function(e,s,o){if(t._messagesModel){var a=t._messagesModel.getData();a.push({type:e||"Information",title:s||"",description:o||""});t._messagesModel.setData(a);t._masterComponent.setModel(t._emptyModel,"messages");t._masterComponent.setModel(t._messagesModel,"messages")}};return t});
//# sourceMappingURL=ErrorUtils.js.map