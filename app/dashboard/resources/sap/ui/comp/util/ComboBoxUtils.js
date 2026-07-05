/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/util/FormatUtil"],function(t){"use strict";return{formatDisplayBehaviour:function(r,e){var i,n,a,o,p,u,s,f;if(r===null||r===undefined||!e){return}u=r.getKey();s=r&&r.getBindingInfo("text");if(u!==""&&s&&Array.isArray(s.parts)){o=s.parts[0].path;if(s.parts[1]){p=s.parts[1].path}f=r.getBindingContext();n=o&&f.getProperty(o);a=p&&f.getProperty(p);if(u!==n){return}i=t.getFormattedExpressionFromDisplayBehaviour(e,n,a)}return i}}});
//# sourceMappingURL=ComboBoxUtils.js.map