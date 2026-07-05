/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the SmartTable control of sap.ui.comp library.
 */
sap.ui.define(['sap/ui/support/library', 'sap/base/Log', "sap/ui/table/rules/TableHelper.support"],
	function(SupportLib, Log, SupportHelper) {
		'use strict';

		// shortcuts
		var Categories = SupportLib.Categories; // Accessibility, Performance, Memory, ...
		var Severity = SupportLib.Severity; // Hint, Warning, Error
		var Audiences = SupportLib.Audiences; // Control, Internal, Application

		//**********************************************************
		// Rule Definitions
		//**********************************************************

		/* eslint-disable no-lonely-if */

		var oSmartTableReservedKeywordsRule = {
			id: 'smartTableEntityFieldName',
			audiences: [Audiences.Application],
			categories: [Categories.DataModel],
			enabled: true,
			minversion: '1.52',
			title: 'SmartTable: Forbidden entity field name',
			description: 'The SmartTable entity uses reserved keywords as field names',
			resolution: 'Rename the field name of your OData entity that is using a reserved keyword',
			resolutionurls: [{
				text: 'API Reference: SmartTable -> properties -> entitySet ',
				href:'https://ui5.sap.com/#/api/sap.ui.comp.smarttable.SmartTable'
			}],
			check: function (oIssueManager, oCoreFacade, oScope) {
				oScope.getElementsByClassName('sap.ui.comp.smarttable.SmartTable')
					.forEach(function(oSmartTable) {
						var aReserved, sId = oSmartTable.getId();

						if (!oSmartTable._aTableViewMetadata) {
							return;
						}

						aReserved = [
							'variant',
							'btnFullScreen',
							'btnEditToggle',
							'header',
							'toolbarSeperator',
							'toolbarSpacer',
							'btnPersonalisation',
							'btnExcelExport',
							'persoController',
							'ui5table',
							'infoToolbarText'
						];

						oSmartTable._aTableViewMetadata.forEach(function (oField) {
							if (aReserved.indexOf(oField.name) > -1) {
								oIssueManager.addIssue({
									severity: Severity.High,
									details: 'SmartTable ' + sId + ' is assigned to an entity that is using a reserved keyword as field name. Please rename field ' + oField.name,
									context: {
										id: sId
									}
								});
							}
						});
					});
			}
		};

		var oSmartTableRebindTableBeforeInitialise = {
			id: "smartTableRebindTableBeforeInitialise",
			audiences: [Audiences.Application],
			categories: [Categories.Usage],
			enabled: true,
			minversion: '1.30',
			title: 'SmartTable: The rebindTable method usage',
			description: 'The call to the rebindTable method was done before the SmartTable control is initialized',
			resolution: 'Applications can listen to the "initialise" event or "isInitialised" method of the SmartTable and then call the rebindTable method. This ensures that the SmartTable control can correctly create and update the binding for the inner table',
			resolutionurls: [{
				text: 'API Reference: initialise event',
				href: 'https://ui5.sap.com/#/api/sap.ui.comp.smarttable.SmartTable/events/initialise'
			}, {
				text: 'API Reference: isInitialised method',
				href: 'https://ui5.sap.com/#/api/sap.ui.comp.smarttable.SmartTable/methods/isInitialised'
			}],
			check: function(oIssueManager, oCoreFacade, oScope) {
				var aRelevantLogEntries = Log.getLogEntries().filter(function(oLogEntry) {
					return oLogEntry.component == "sap.ui.comp.smarttable.SmartTable";
				});

				oScope.getElementsByClassName("sap.ui.comp.smarttable.SmartTable").forEach(function(oSmartTable) {
					var sId = oSmartTable.getId();
					var oControlSpecificErrorLog = aRelevantLogEntries.find(function(oErrorLog) {
						return oErrorLog.details == sId && oErrorLog.message.indexOf("rebindTable method called before the SmartTable is initialized") > -1;
					});

					if (oControlSpecificErrorLog) {
						oIssueManager.addIssue({
							severity: Severity.High,
							details: 'The rebindTable method is called before the SmartTable with id: ' + sId + ' is initialized',
							context: {
								id: sId
							}
						});
					}
				});
			}
		};

	/*
	 * Check for default ODataModel
	 */
	var oSmartTableModelBindingRule = {
		id: "smartTableModelBinding",
		categories: [Categories.Bindings],
		title: "SmartTable: Model and Binding",
		description: "Checks whether the default/unnamed model is present and is an ODataModel and if the binding makes use of this model",
		resolution: "Ensure that the desired ODataModel is set as an unnamed/default model on the control/view and is used in the binding accordingly",
		minversion: "1.46",
		check: function(oIssueManager, oCoreFacade, oScope) {
			var aSmartTables = SupportHelper.find(oScope, true, "sap/ui/comp/smarttable/SmartTable");
			var i, iLen = aSmartTables.length, oSmartTable, oModel, oInfo;
			for (i = 0; i < iLen; i++) {
				oSmartTable = aSmartTables[i];
				if (oSmartTable) {
					oModel = oSmartTable.getModel();
					// Check whether default model exists
					if (!oModel) {
						SupportHelper.reportIssue(oIssueManager, "The SmartTable expects a default/unnamed model to be present", Severity.Medium, oSmartTable.getId());
					}
					// Check if default model is an ODataModel (old/v2)
					if (!SupportHelper.isInstanceOf(oModel, "sap/ui/model/odata/ODataModel") && !SupportHelper.isInstanceOf(oModel, "sap/ui/model/odata/v2/ODataModel")) {
						SupportHelper.reportIssue(oIssueManager, "ODataModel should be used as the default/unnamed model", Severity.Medium, oSmartTable.getId());
					}
					// Check if binding on the inner UI5 table is done for an unnamed model
					oInfo = oSmartTable.getTable().getBindingInfo(oSmartTable._sAggregation);
					if (oInfo.model) {
						SupportHelper.reportIssue(oIssueManager, "For binding rows/items of the table in the SmartTable an unnamed (default) model should be used", Severity.Medium, oSmartTable.getId());
					}
				}
			}
		}
	};

		/*
	 * Check for default ODataModel
	 */
		var oSmartTableDeprecatedModelRule = {
			id: "smartTableDeprecatedModel",
			categories: [Categories.DataModel],
			title: "SmartTable: Deprecated Model",
			description: "Checks whether the model is a sap/ui/model/odata/ODataModel as this has been deprecated since version 1.48",
			resolution: "Use a sap/ui/model/odata/v2/ODataModel as default/unnamed model to ensure that SmartTable built-in functionality is fully available",
			minversion: "1.48",
			check: function(oIssueManager, oCoreFacade, oScope) {
				var aSmartTables = SupportHelper.find(oScope, true, "sap/ui/comp/smarttable/SmartTable");
				var i, iLen = aSmartTables.length, oSmartTable, oModel;
				for (i = 0; i < iLen; i++) {
					oSmartTable = aSmartTables[i];
					if (oSmartTable) {
						oModel = oSmartTable.getModel();
						// Check if default model is an ODataModel (old)
						if (SupportHelper.isInstanceOf(oModel, "sap/ui/model/odata/ODataModel")) {
							SupportHelper.reportIssue(oIssueManager, "Deprecated ODataModel should not be used", Severity.Medium, oSmartTable.getId());
						}
					}
				}
			}
		};

	/**
	 * Check p13nData for custom columns.
	 */
	var oSmartTableCustomColumnP13nData = {
		id: "smartTableCustomColumnPersonalizationData",
		audiences: [
			Audiences.Application
		],
		categories: [
			Categories.Consistency
		],
		minversion: "1.44",
		async: false,
		title: "SmartTable: Defining p13nData for custom column",
		description: "Incorrect p13nData configuration for custom column",
		resolution: "Make sure that the correct p13nData configuration is applied to the custom column in the SmartTable. More information is avilable on the SmartTable FAQ section.",
		resolutionurls: [
			{
				text: "API FAQ: SmartTable",
				href: "https://ui5.sap.com/#/api/sap.ui.comp.smarttable.SmartTable/faq"
			}
		],
		check: function(oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.ui.comp.smarttable.SmartTable").forEach(function(oSmartTable) {
				var aCustomColumnKeys = oSmartTable._aExistingColumns;
				if (aCustomColumnKeys.length) {
					aCustomColumnKeys.forEach(function(sColumnKey) {
						var oColumn = oSmartTable._getColumnByKey(sColumnKey),
							oP13nData = oColumn?.data("p13nData");

						if (!oP13nData.hasOwnProperty("columnKey")) {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "The p13nData columnKey configuration is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						}

						if (!oP13nData.hasOwnProperty("leadingProperty") && !oColumn.isA("sap.ui.table.AnalyticalColumn")) {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "The p13nData leadingProperty configuration value is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						} else if (!oColumn.isA("sap.ui.table.AnalyticalColumn") && typeof (oP13nData.leadingProperty) !== "string") {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "The p13nData leadingProperty configuration only supports string value.",
								context: {
									id: oColumn.getId()
								}
							});
						} else if (typeof oP13nData.leadingProperty == "string" && oP13nData.leadingProperty.split(",").length > 1) {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "The p13nData leadingProperty configuration cannot have multiple values.",
								context: {
									id: oColumn.getId()
								}
							});
						} else if (oColumn.isA("sap.ui.table.AnalyticalColumn") && !oColumn.getLeadingProperty()) {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "The leadingProperty must be defined on the AnalyticalColumn.",
								context: {
									id: oColumn.getId()
								}
							});
						}

						if (!oP13nData.hasOwnProperty("type")) {
							oIssueManager.addIssue({
								severity: Severity.High,
								details: "The p13nData type configuration value is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						}

						if (oP13nData.hasOwnProperty("additionalProperty")) {
							if (typeof (oP13nData.additionalProperty) !== "string") {
								oIssueManager.addIssue({
									severity: Severity.High,
									details: "The p13nData additionalProperty configuration only supports a string with comma separated values.",
									context: {
										id: oColumn.getId()
									}
								});
							}

							if (oP13nData.additionalProperty === oP13nData.leadingProperty) {
								oIssueManager.addIssue({
									severity: Severity.High,
									details: "The p13nData additionalProperty and leadingProperty must not be equal.",
									context: {
										id: oColumn.getId()
									}
								});
							}
						}

						if (oColumn.isA("sap.m.Column") && !oP13nData.hasOwnProperty("sortProperty")) {
							oIssueManager.addIssue({
								severity: Severity.Low,
								details: "The p13nData sortProperty configuration is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						} else if (!oColumn.isA("sap.m.Column") && !oColumn.getProperty("sortProperty")) {
							oIssueManager.addIssue({
								severity: Severity.Low,
								details: "The sortProperty on the column is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						}

						if (oColumn.isA("sap.m.Column") && !oP13nData.hasOwnProperty("filterProperty")) {
							oIssueManager.addIssue({
								severity: Severity.Low,
								details: "The p13nData filterProperty configuration is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						} else if (!oColumn.isA("sap.m.Column") && !oColumn.getProperty("filterProperty")) {
							oIssueManager.addIssue({
								severity: Severity.Low,
								details: "The filterProperty on the column is not defined.",
								context: {
									id: oColumn.getId()
								}
							});
						}
					});
				}
			});
		}
	};

		return [
			oSmartTableReservedKeywordsRule,
			oSmartTableRebindTableBeforeInitialise,
			oSmartTableModelBindingRule,
			oSmartTableDeprecatedModelRule,
			oSmartTableCustomColumnP13nData
		];

	}, true);
