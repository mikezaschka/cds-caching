/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/changePropertyValueByPath","sap/ui/fl/util/DescriptorChangeCheck"],function(t,o){"use strict";const n=["UPDATE","UPSERT","DELETE","INSERT"];const e=["semanticObject","action","additionalParameters","parameters/*"];const a=["semanticObject","action"];const s={semanticObject:"^[\\w\\*]{0,30}$",action:"^[\\w\\*]{0,60}$",additionalParameters:"^(ignored|allowed|notallowed)$"};const i={applyChange(i,r){const c=i["sap.app"].crossNavigation;const u=r.getContent();o.checkEntityPropertyChange(u,e,n,s,a);if(c&&c.outbounds){const o=c.outbounds[u.outboundId];if(o){t(u.entityPropertyChange,o)}else{throw new Error(`Nothing to update. outbound with ID "${u.outboundId}" does not exist.`)}}else{throw new Error("sap.app/crossNavigation or sap.app/crossNavigation/outbounds sections have not been found in manifest.json")}return i}};return i});
//# sourceMappingURL=ChangeOutbound.js.map