/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/changePropertyValueByPath","sap/ui/fl/util/DescriptorChangeCheck"],function(n,t){"use strict";const e=["UPDATE","UPSERT","DELETE","INSERT"];const o=["semanticObject","action","hideLauncher","icon","title","shortTitle","subTitle","info","indicatorDataSource","deviceTypes","displayMode","signature/parameters/*"];const i=["semanticObject","action"];const s={semanticObject:"^[\\w\\*]{0,30}$",action:"^[\\w\\*]{0,60}$"};const a={applyChange(a,c){const r=a["sap.app"].crossNavigation;const p=c.getContent();t.checkEntityPropertyChange(p,o,e,s,i);if(r&&r.inbounds){const t=r.inbounds[p.inboundId];if(t){n(p.entityPropertyChange,t)}else{throw new Error(`Nothing to update. Inbound with ID "${p.inboundId}" does not exist.`)}}else{throw new Error("sap.app/crossNavigation or sap.app/crossNavigation/inbounds sections have not been found in manifest.json")}return a}};return a});
//# sourceMappingURL=ChangeInbound.js.map