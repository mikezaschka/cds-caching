/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function() {
    "use strict";

    var CommonUtil = {};

    CommonUtil.extendScales = function() {
        var o = {}, target = arguments[0] || [], i = 0, len = target.length, result = [];
        for (; i < len; i++) {
            o[target[i].feed] = target[i];
        }
        for (i = 1, len = arguments.length; i < len; i++) {
            var source = arguments[i];
            for (var j = 0, length = source.length; j < length; j++ ) {
                //If !o[source[j].feed], assign source[j] to it. Otherwise, replace it.
                o[source[j].feed] = source[j];
            }
        }
        for (i in o) {
            result.push(o[i]);
         }
        return result;
    };

    return CommonUtil;
});
