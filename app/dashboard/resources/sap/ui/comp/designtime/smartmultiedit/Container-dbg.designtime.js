/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/designtime/smartform/Group.designtime",
	"sap/base/util/merge"

], function(
	GroupDesigntime,
	merge
) {
	"use strict";

	var mockedGroupMetadata = merge({}, GroupDesigntime);
	mockedGroupMetadata.aggregations.formElements.actions.add.delegate.changeType = "addMultiEditField";

	return {
		aggregations: {
			layout: {
				ignore: false,
				propagateMetadata: function (oInnerControl) {
					if (oInnerControl.getMetadata().getName() === "sap.ui.comp.smartform.Group") {
						return mockedGroupMetadata;
					}
				}
			}
		}
	};
});
