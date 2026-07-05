/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/base/DataType"],function(e){"use strict";var a={replace:function(a){var i=e.getType("sap.ui.core.ID");if(!i.isValid(a)){a=a.replace(/[^A-Za-z0-9_.:]+/g,"_");if(!i.isValid(a)){a="A_"+a}}return a}};return a},true);
//# sourceMappingURL=IdentifierUtil.js.map