/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the SmartFilterBar control of sap.ui.comp library.
 */
sap.ui.define(["sap/ui/support/library"], function(SupportLib) {
	"use strict";

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/* eslint-disable no-lonely-if */

	var fnGetView = function(oControl) {
		var oObj = oControl.getParent();
		while (oObj) {
			if (oObj.isA("sap.ui.core.mvc.View")) {
				return oObj;
			}
			oObj = oObj.getParent();
		}
		return null;
	};

	var oSmartFilterBarAndSmartTableRule = {
		id: "equalEntitySetInSmartFilterBarAndSmartTable",
		audiences: [
			SupportLib.Audiences.Application
		],
		categories: [
			SupportLib.Categories.Consistency
		],
		minversion: "1.56",
		async: false,
		title: "SmartFilterBar: Entity set used in SmartTable and SmartFilterBar",
		description: "Entity set of SmartTable has to be the same as the entity set of SmartFilterBar, which is associated via the property smartFilterId",
		resolution: "Make sure that the entity sets used in SmartTable and SmartFilterBar are the same",
		resolutionurls: [
			{
				text: "API Reference: SmartTable",
				href: "https://ui5.sap.com/#/api/sap.ui.comp.smarttable.SmartTable/controlProperties"
			},
			{
				text: "API Reference: SmartFilterBar",
				href: "https://ui5.sap.com/#/api/sap.ui.comp.smartfilterbar.SmartFilterBar/controlProperties"
			}
		],
		check: function(oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smarttable.SmartTable").filter(function(oSmartTable) {
				return !!oSmartTable.getSmartFilterId();
			}).forEach(function(oSmartTable) {
				var oView = fnGetView(oSmartTable);
				if (!oView) {
					return;
				}
				var oSmartFilter = oView.byId(oSmartTable.getSmartFilterId());
				if (!oSmartFilter) {
					oIssueManager.addIssue({
						severity: SupportLib.Severity.Low,
						details: "In SmartTable the smartFilterId property is linked to the control '" + oSmartTable.getSmartFilterId() + "' which does not exist",
						context: {
							id: oSmartTable.getId()
						}
					});
					return;
				}
				if (oSmartTable.getEntitySet() !== oSmartFilter.getEntitySet()) {
					oIssueManager.addIssue({
						severity: SupportLib.Severity.Low,
						details: "The entity set '" + oSmartFilter.getEntitySet() + "' of the SmartFilterBar control is not the same as the entity set '" + oSmartTable.getEntitySet() + "' of the SmartTable control",
						context: {
							id: oSmartTable.getId()
						}
					});
				}
			});

		}
	};

	var oSmartFilterBarAndSmartChartRule = {
		id: "equalEntitySetInSmartFilterBarAndSmartChart",
		audiences: [
			SupportLib.Audiences.Application
		],
		categories: [
			SupportLib.Categories.Consistency
		],
		minversion: "1.56",
		async: false,
		title: "SmartFilterBar: Entity set used in SmartChart and SmartFilterBar",
		description: "Entity set of SmartChart has to be the same as the entity set of SmartFilterBar, which is associated via the property smartFilterId",
		resolution: "Make sure that the entity sets used in SmartChart and SmartFilterBar are the same",
		resolutionurls: [
			{
				text: "API Reference: SmartChart",
				href: "https://ui5.sap.com/#/api/sap.ui.comp.smartchart.SmartChart/controlProperties"
			},
			{
				text: "API Reference: SmartFilterBar",
				href: "https://ui5.sap.com/#/api/sap.ui.comp.smartfilterbar.SmartFilterBar/controlProperties"
			}
		],
		check: function(oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartchart.SmartChart").filter(function(oSmartChart) {
				return !!oSmartChart.getSmartFilterId();
			}).forEach(function(oSmartChart) {
				var oView = fnGetView(oSmartChart);
				if (!oView) {
					return;
				}
				var oSmartFilter = oView.byId(oSmartChart.getSmartFilterId());
				if (!oSmartFilter) {
					oIssueManager.addIssue({
						severity: SupportLib.Severity.Low,
						details: "In SmartChart the smartFilterId property is linked to the control '" + oSmartChart.getSmartFilterId() + "' which does not exist",
						context: {
							id: oSmartChart.getId()
						}
					});
					return;
				}
				if (oSmartChart.getEntitySet() !== oSmartFilter.getEntitySet()) {
					oIssueManager.addIssue({
						severity: SupportLib.Severity.Low,
						details: "The entity set '" + oSmartFilter.getEntitySet() + "' of the SmartFilterBar control is not same as the entity set '" + oSmartChart.getEntitySet() + "' of the SmartChart control",
						context: {
							id: oSmartChart.getId()
						}
					});
				}
			});

		}
	};

	var oSmartFilterBarGetControlByKeyRule = {
		id: "smartFilterBarGetControlByKeytRule",
		audiences: [
			SupportLib.Audiences.Application
		],
		categories: [
			SupportLib.Categories.Usage
		],
		minversion: "1.114",
		async: false,
		title: "SmartFilterBar: getControlByKey method",
		description: "sap.ui.comp.smartfilterbar.SmartFilterBar#getControlByKey is deprecated and shouldn't get invoked.",
		resolution: "Avoid referencing the filters directly. Instead use the SmartFilterBar's public API.",
		check: function(oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartfilterbar.SmartFilterBar").forEach(function(oSmartFilterBar){
				var bIsInvoked = oSmartFilterBar._oRulesLog.getInvokedMethod("getControlByKey");

				if (bIsInvoked) {
					oIssueManager.addIssue({
						severity: SupportLib.Severity.High,
						details: "Using deprecated method: sap.ui.comp.smartfilterbar.SmartFilterBar#getControlByKey",
						context: {id: oSmartFilterBar.getId()}
					});
				}
			});
		}
	};

	const oValueHelpExpand = {
		id: "smartFilterBarValueListExpand",
		audiences: [
			SupportLib.Audiences.Application
		],
		categories: [
			SupportLib.Categories.DataModel
		],
		minversion: "1.108",
		async: false,
		title: "SmartFilterBar: ValueList with invalid navigation",
		description: "Value list property has a sap:text annotation pointing to non-existing navigation property",
		resolution: "This should be corrected in your backend service or metadata",
		check: function(oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smartfilterbar.SmartFilterBar").forEach(function(oSmartFilterBar){
				const oFP = oSmartFilterBar?._oFilterProvider,
					  oMM = oFP?._oMetadataAnalyser?._oMetaModel;

				if (!oMM) {
					return;
				}

				// Get all fields including hidden
				const aFieldNames = oSmartFilterBar._getAllFieldNames();

				// Collect all ValueList data for all filter fields
				const aValueLists = [];
				aFieldNames.forEach((sField) => {
					const oField = oFP._getFieldMetadata(sField),
						  oValueList = oField['com.sap.vocabularies.Common.v1.ValueList'],
						  sCollectionPath = oValueList?.CollectionPath?.String;

					if (!oValueList) {
						return;
					}

					const aProperties = [];

					oValueList.Parameters?.forEach((oParam) => {
						const sProperty = oParam.ValueListProperty?.String;

						if (sProperty) {
							aProperties.push(sProperty);
						}
					});

					const sEntityType = oMM.getODataEntitySet(sCollectionPath)?.entityType;

					if (!sEntityType) {
						return;
					}

					const oEntityType = oMM.getODataEntityType(sEntityType);

					if (sCollectionPath) {
						aValueLists.push({
							field: oField,
							entitySet: sCollectionPath,
							entityType: oEntityType,
							entityTypeName: sEntityType,
							properties: aProperties
						});
					}
				});

				// Iterate collected ValueLists and check for non defined navigations
				aValueLists.forEach((aList) => {
					const aVLProperties = aList.properties,
						  oET = aList.entityType;

					aVLProperties.forEach((sProperty) => {
						const oProperty = oET.property.find((o) => o.name === sProperty),
							sText = oProperty["sap:text"];

						if (sText && sText.includes("/")) {
							const sNavProperty = sText.split("/")[0];

							if (!oET.navigationProperty || !oET.navigationProperty.find((o) => o.name === sNavProperty)) {
								oIssueManager.addIssue({
									severity: SupportLib.Severity.High,
									details: `SmartFilterBar: Value list for filter "${aList.field.name}" has property "${sProperty}" with a sap:text annotation 
											pointing to non-existing navigation property "${sNavProperty}" in EntityType "${aList.entityTypeName}"`,
									context: {id: oSmartFilterBar.getId()}
								});
							}
						}
					});

				});

			});
		}
	};

	return [
		oSmartFilterBarAndSmartTableRule,
		oSmartFilterBarAndSmartChartRule,
		oSmartFilterBarGetControlByKeyRule,
		oValueHelpExpand
	];

}, true);
