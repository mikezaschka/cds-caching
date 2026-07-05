/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexState/FlexState"],function(e){"use strict";var t={};t.getPersonalization=function(t,n,i){var r=e.getUI2Personalization(t);if(!r||!r[n]){return i?undefined:[]}if(!i){return r[n]}return r[n].filter(function(e){return e.itemName===i})[0]};return t});
//# sourceMappingURL=UI2PersonalizationState.js.map