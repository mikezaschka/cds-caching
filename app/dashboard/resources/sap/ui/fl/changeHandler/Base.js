/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/LoaderExtensions"],function(t){"use strict";const e={setTextInChange(t,e,n,o){t.texts||={};t.texts[e]||={};t.texts[e].value=n;t.texts[e].type=o},async instantiateFragment(e,n){const o=e.getFlexObjectMetadata();const s=o.moduleName;if(!s){return Promise.reject(new Error("The module name of the fragment is not set. This should happen in the backend"))}const a=n.viewId?`${n.viewId}--`:"";const i=o.projectId||"";const r=e.getExtensionPointInfo&&e.getExtensionPointInfo()&&e.getExtensionPointInfo().fragmentId||"";const c=i&&r?".":"";const d=a+i+c+r;const m=n.modifier;const u=n.view;const g=t.loadResource(s,{dataType:"text"});try{return await m.instantiateFragment(g,d,u)}catch(t){throw new Error(`The following XML Fragment could not be instantiated: ${g} Reason: ${t.message}`)}},markAsNotApplicable(t,e){const n={message:t};if(!e){throw n}return Promise.reject(n)}};return e});
//# sourceMappingURL=Base.js.map