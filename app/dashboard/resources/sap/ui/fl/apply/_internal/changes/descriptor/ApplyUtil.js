/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/URI"],function(r){"use strict";var e={formatBundleName(e,t){if(t.startsWith("/")){throw Error("Absolute paths are not supported")}var a=new r(`${e}/${t}`).normalize().path();return a.replace(/\//g,".").replace("..",".").replace(/.properties$/g,"")}};return e});
//# sourceMappingURL=ApplyUtil.js.map