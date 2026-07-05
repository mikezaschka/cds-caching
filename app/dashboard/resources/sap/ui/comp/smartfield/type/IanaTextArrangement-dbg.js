/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/smartfield/type/TextArrangementString",
    "sap/ui/model/odata/type/DateTimeWithTimezone"
], function(
	TextArrangementStringType,
    DateTimeWithTimezone
) {
	"use strict";

    var IanaTextArrangement = TextArrangementStringType.extend("sap.ui.comp.smartfield.type.IanaTextArrangement", {
		constructor: function(oFormatOptions) {
			oFormatOptions = Object.assign({showDate: false, showTime: false}, oFormatOptions);
            this.DateTimeWithTimezoneType = new DateTimeWithTimezone(oFormatOptions);

          return  TextArrangementStringType.prototype.constructor.apply(this, arguments);
		}
	});

    IanaTextArrangement.prototype.formatValue = function(vValues, sTargetType) {
        vValues[0] = this.DateTimeWithTimezoneType.formatValue([null, vValues[0]], sTargetType);

        return TextArrangementStringType.prototype.formatValue.call(this, vValues, sTargetType);
    };

    IanaTextArrangement.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.IanaTextArrangement";
	};

	return IanaTextArrangement;
});
