/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
sap.ui.define(["sap/ui/fl/util/DescriptorChangeCheck"],function(n){"use strict";const t=["semanticObject","action"];const e=[...t,"hideLauncher","icon","title","shortTitle","subTitle","info","indicatorDataSource","deviceTypes","displayMode","signature"];const i={semanticObject:"^[\\w\\*]{0,30}$",action:"^[\\w\\*]{0,60}$"};const a={applyChange(a,s){a["sap.app"].crossNavigation||={};a["sap.app"].crossNavigation.inbounds||={};const o=s.getContent();const c=n.getAndCheckContentObject(o,"inbound",s.getChangeType(),t,e,i);const p=a["sap.app"].crossNavigation.inbounds[c];if(!p){n.checkIdNamespaceCompliance(c,s);a["sap.app"].crossNavigation.inbounds[c]=o.inbound[c]}else{throw new Error(`Inbound with ID "${c}" already exist.`)}return a}};return a});
//# sourceMappingURL=AddNewInbound.js.map