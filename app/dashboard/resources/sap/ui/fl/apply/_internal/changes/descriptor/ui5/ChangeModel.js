/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/changePropertyValueByPath","sap/ui/fl/util/DescriptorChangeCheck"],function(e,t){"use strict";const o=["UPDATE","UPSERT","DELETE","INSERT"];const n=["settings/*"];const s={settings:typeof{}};const r="sap.ui.model.resource.ResourceModel";const i={applyChange(i,l){const a=i["sap.ui5"].models;const u=l.getContent();t.checkEntityPropertyChange(u,n,o,null,null,s);if(a){const t=a[u.modelId];if(t){if(t.type===r){throw new Error(`Model '${u.modelId}' is of type '${r}'. Changing models of type '${r}' are not supported.`)}e(u.entityPropertyChange,t)}else{throw new Error(`Nothing to update. Model with ID "${u.modelId}" does not exist in the manifest.json.`)}}else{throw new Error("sap.ui5/models section have not been found in manifest.json.")}return i}};return i});
//# sourceMappingURL=ChangeModel.js.map