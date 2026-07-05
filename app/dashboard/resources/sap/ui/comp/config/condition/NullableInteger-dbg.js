/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides sap.ui.comp.config.condition.NullableInteger.
sap.ui.define([
    "sap/ui/model/type/Integer"
], function (
    Integer
) {
    "use strict";

    var NullableInteger = Integer.extend("sap.ui.model.type.NullableInteger", {
        parseValue: function (oValue, sInternalType) {
            if (this.getPrimitiveType(sInternalType) == "string") {
                if (oValue === "") {
                    return null;
                }
            }
            return Integer.prototype.parseValue.apply(this, arguments);
        }
    });

    return NullableInteger;
});