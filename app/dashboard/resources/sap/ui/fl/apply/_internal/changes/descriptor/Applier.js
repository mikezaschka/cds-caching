/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/isEmptyObject","sap/ui/fl/apply/_internal/changes/Utils"],function(t,s){"use strict";const e={async applyChanges(e,n,a){const c=[];for(const t of n){c.push(await s.getChangeHandler({flexObject:t,strategy:a}))}c.forEach(function(s,c){try{const r=n[c];e=s.applyChange(e,r);if(!s.skipPostprocessing&&!t(r.getTexts())){e=a.processTexts(e,r.getTexts())}}catch(t){a.handleError(t)}});return e}};return e});
//# sourceMappingURL=Applier.js.map