/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/type/Integer"],function(e){"use strict";var t=e.extend("sap.ui.model.type.NullableInteger",{parseValue:function(t,i){if(this.getPrimitiveType(i)=="string"){if(t===""){return null}}return e.prototype.parseValue.apply(this,arguments)}});return t});
//# sourceMappingURL=NullableInteger.js.map