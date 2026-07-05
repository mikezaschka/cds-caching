/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexState/UI2Personalization/UI2PersonalizationState","sap/ui/fl/apply/_internal/flexState/FlexState","sap/ui/fl/apply/_internal/flexState/ManifestUtils"],function(e,t,a){"use strict";var n={async load(n){n.reference=a.getFlexReferenceForSelector(n.selector);if(!n.reference||!n.containerKey){throw new Error("not all mandatory properties were provided for the loading of the personalization")}await t.initialize({componentId:n.selector.getId()});return e.getPersonalization(n.reference,n.containerKey,n.itemName)}};return n});
//# sourceMappingURL=UI2PersonalizationApplyAPI.js.map