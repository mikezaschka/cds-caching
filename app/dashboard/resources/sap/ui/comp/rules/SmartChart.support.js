/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the SmartChart control of sap.ui.comp library.
 */
 sap.ui.define(['sap/ui/support/library', 'sap/base/Log'],
 function(SupportLib, Log) {
     'use strict';

     // shortcuts
     var Categories = SupportLib.Categories; // Accessibility, Performance, Memory, ...
     var Severity = SupportLib.Severity; // Hint, Warning, Error
     var Audiences = SupportLib.Audiences; // Control, Internal, Application

     //**********************************************************
     // Rule Definitions
     //**********************************************************

     /* eslint-disable no-lonely-if */

     var oSmartChartRebindChartBeforeInitialise = {
        id: "oSmartChartRebindChartBeforeInitialise",
        audiences: [Audiences.Application],
        categories: [Categories.Usage],
        enabled: true,
        minversion: '1.71',
        title: 'SmartChart: The rebindChart method usage',
        description: 'The call to the rebindChart method was done before the SmartChart control is initialized',
        resolution: 'Applications can listen to the "initialized" event of the SmartChart and then call the rebindChart method. This ensures that the SmartChart control can correctly create and update the binding for the inner chart',
        resolutionurls: [{
            text: 'API Reference: initialized event',
            href: 'https://ui5.sap.com/#/api/sap.ui.comp.smartchart.SmartChart/events/initialized'
        }],
        check: function(oIssueManager, oCoreFacade, oScope) {
            var aRelevantLogEntries = Log.getLogEntries().filter(function(oLogEntry) {
                return oLogEntry.component == "sap.ui.comp.smartChart";
            });

            oScope.getElementsByClassName("sap.ui.comp.smartChart").forEach(function(oSmartChart) {
                var sId = oSmartChart.getId();
                var oControlSpecificErrorLog = aRelevantLogEntries.find(function(oErrorLog) {
                    return oErrorLog.details == sId && oErrorLog.message.indexOf("rebindChart method called before the metadata is initialized") > -1;
                });

                if (oControlSpecificErrorLog) {
                    oIssueManager.addIssue({
                        severity: Severity.High,
                        details: 'The rebindChart method is called before the metadata for SmartChart ' + sId + ' is initialized',
                        context: {
                            id: sId
                        }
                    });
                }
            });
        }
    };

    var oSmartChartGetChartBeforeInitialise = {
        id: "oSmartChartGetChartBeforeInitialise",
        audiences: [Audiences.Application],
        categories: [Categories.Usage],
        enabled: true,
        minversion: '1.71',
        title: 'SmartChart: The getChart/getChartAsync method usage',
        description: 'The call to the getChart or getChartAsync method was done before the SmartChart control is initialized',
        resolution: 'Applications can listen to the "initialized" event of the SmartChart and then call the getChart/getChartAsync method. This ensures that the SmartChart control can correctly create and update the binding for the inner chart',
        resolutionurls: [{
            text: 'API Reference: initialized event',
            href: 'https://ui5.sap.com/#/api/sap.ui.comp.smartchart.SmartChart/events/initialized'
        }],
        check: function(oIssueManager, oCoreFacade, oScope) {
            var aRelevantLogEntries = Log.getLogEntries().filter(function(oLogEntry) {
                return oLogEntry.component == "sap.ui.comp.smartChart";
            });

            oScope.getElementsByClassName("sap.ui.comp.smartChart").forEach(function(oSmartChart) {
                var sId = oSmartChart.getId();
                var oControlSpecificErrorLog = aRelevantLogEntries.find(function(oErrorLog) {
                    return oErrorLog.details == sId && oErrorLog.message.indexOf("Accesing the inner chart before the metadata is initialized will not work. Instead, wait for the initialized event!") > -1;
                });

                if (oControlSpecificErrorLog) {
                    oIssueManager.addIssue({
                        severity: Severity.High,
                        details: 'The getChart/getChartAsync method is called before the metadata for SmartChart ' + sId + ' is initialized',
                        context: {
                            id: sId
                        }
                    });
                }
            });
        }
    };

     return [
        oSmartChartRebindChartBeforeInitialise,
        oSmartChartGetChartBeforeInitialise
     ];

 }, true);
