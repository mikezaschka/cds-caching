/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/write/_internal/flexState/UI2Personalization/UI2PersonalizationState","sap/ui/fl/apply/_internal/flexState/ManifestUtils","sap/base/util/restricted/_omit"],function(e,t,r){"use strict";var a={async create(a){a.reference=t.getFlexReferenceForSelector(a.selector);if(!a.reference||!a.containerKey||!a.itemName||!a.content||!a.category||!a.containerCategory){throw new Error("not all mandatory properties were provided for the storage of the personalization")}await e.setPersonalization(r(a,["selector"]))},async deletePersonalization(r){r.reference=t.getFlexReferenceForSelector(r.selector);if(!r.reference||!r.containerKey||!r.itemName){throw new Error("not all mandatory properties were provided for the deletion of the personalization")}await e.deletePersonalization(r.reference,r.containerKey,r.itemName)}};return a});
//# sourceMappingURL=UI2PersonalizationWriteAPI.js.map