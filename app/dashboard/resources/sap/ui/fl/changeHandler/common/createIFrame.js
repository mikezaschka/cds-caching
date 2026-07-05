/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/IFrame"],function(){"use strict";return function(t,n,e,i){const s=n.modifier;const a=t.getContent();const o=n.view;const c=n.appComponent;const r={_settings:{}};["url","width","height"].forEach(function(t){const n=a[t];r[t]=n;r._settings[t]=n});if(a?.advancedSettings){r.advancedSettings=a.advancedSettings;r._settings.advancedSettings=a?.advancedSettings}if(i){r.renameInfo=i;r.asContainer=true}return s.createControl("sap.ui.fl.util.IFrame",c,o,e,r,false)}});
//# sourceMappingURL=createIFrame.js.map