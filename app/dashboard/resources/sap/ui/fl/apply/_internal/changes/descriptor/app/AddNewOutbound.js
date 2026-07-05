/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
sap.ui.define(["sap/ui/fl/util/DescriptorChangeCheck"],function(t){"use strict";const a=["semanticObject","action"];const o=[...a,"additionalParameters","parameters"];const e={semanticObject:"^[\\w\\*]{0,30}$",action:"^[\\w\\*]{0,60}$",additionalParameters:"^(ignored|allowed|notallowed)$"};const n={applyChange(n,s){n["sap.app"].crossNavigation||={};n["sap.app"].crossNavigation.outbounds||={};const i=s.getContent();const c=t.getAndCheckContentObject(i,"outbound",s.getChangeType(),a,o,e);const r=n["sap.app"].crossNavigation.outbounds[c];if(!r){t.checkIdNamespaceCompliance(c,s);n["sap.app"].crossNavigation.outbounds[c]=i.outbound[c]}else{throw new Error(`Outbound with ID "${c}" already exist.`)}return n}};return n});
//# sourceMappingURL=AddNewOutbound.js.map