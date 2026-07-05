/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Overrides the Design Time Metadata for S,artChart details controls control.
sap.ui.define([], function() {
	"use strict";
	return {
		actions: "not-adaptable",
		aggregations : {
			_popover  : {
				ignore : false, //enable the hidden aggregation
				propagateMetadata : function(oInnerControl){  //will be called for all successor controls
					return {
						actions: "not-adaptable" //overwrites all actions for all other controls and
													//no property changes or other technical changes are possible (not editable/selectable)
					};
				},
				propagateRelevantContainer : true
			}
		}
	};
});
