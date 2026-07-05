/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartvariants.SmartVariantManagement control.
sap.ui.define(["sap/ui/comp/smartvariants/SmartVariantManagement"], function(VariantManagement) {
	"use strict";
	return {
		actions: {
			compVariant: function(oSmartVariantManagement) {
				return {
					validators: [
						"noEmptyText",
						{
							validatorFunction: function(sNewText) {
								return !oSmartVariantManagement.isNameDuplicate(sNewText);
							},
							errorMessage: oSmartVariantManagement.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_DUPLICATE")
						},
						{
							validatorFunction: function(sNewText) {
								return !oSmartVariantManagement.isNameTooLong(sNewText);
							},
							errorMessage: oSmartVariantManagement.oResourceBundle.getText("VARIANT_MANAGEMENT_MAX_LEN", [ VariantManagement.MAX_NAME_LEN ])
						}
					]
				};
			}
		},
		aggregations: {
			personalizableControls: {
				propagateMetadata : function () {
					return {
						actions: "not-adaptable"
					};
				}
			}
		},
		annotations: {},
		properties: {
			persistencyKey: {
				ignore: true
			},
			entitySet: {
				ignore: true
			},
			displayTextForExecuteOnSelectionForStandardVariant: {
				ignore: false
			}
		},
		variantRenameDomRef: function(oSmartVariantManagement) {
			return oSmartVariantManagement.getTitle().getDomRef("inner");
		},
		tool: {
			start: function(oSmartVariantManagement) {
				oSmartVariantManagement.enteringDesignMode();
			},
			stop: function(oSmartVariantManagement) {
				oSmartVariantManagement.leavingDesignMode();
			}
		},
		customData: {}
	};
});
