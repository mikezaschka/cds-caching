/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Lib","sap/ui/fl/Layer","sap/ui/fl/registry/Settings"],function(e,t,r){"use strict";return(n,s,i)=>{const u=n||"";const c=r.getInstanceOrUndef();if(s===t.USER||u===c?.getUserId()){return e.getResourceBundleFor("sap.ui.fl").getText("VARIANT_SELF_OWNER_NAME")}if(![t.PUBLIC,t.CUSTOMER].includes(s)){return u}return i?.[u]||u}});
//# sourceMappingURL=getVariantAuthor.js.map