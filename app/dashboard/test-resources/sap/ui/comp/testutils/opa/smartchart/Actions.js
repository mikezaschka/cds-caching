sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/Press",
    "sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/matchers/Ancestor",
    "sap/base/Log"
], function (Opa5, Press, PropertyStrictEquals, Ancestor, Log) {
	"use strict";

    var oCore = Opa5.getWindow().sap.ui.getCore();

    var waitForSmartChartWithId = function(sId, oSettings) {
        return this.waitFor({
            id: sId,
            controlType: "sap.ui.comp.smartchart.SmartChart",
            success: function(oSmartChart) {
                if (oSettings && typeof oSettings.success === "function") {
                    oSettings.success.call(this, oSmartChart);
                }
            },
            actions: oSettings.actions ? oSettings.actions : []
        });
    };

    var iClickOnOverflowToolbarButton = function(oSmartChart, oSettings) {
        this.waitFor({
            controlType: "sap.m.OverflowToolbar",
            matchers: new Ancestor(oSmartChart),
            success: function(aOverflowToolbars) {
                var oOverflowToolbar = aOverflowToolbars[0];
                oSettings.matchers.push(new Ancestor(oOverflowToolbar, false));
                this.waitFor({
                    controlType: oSettings.controlType,
                    matchers: oSettings.matchers,
                    actions: new Press()
                });

                if (oSettings && typeof oSettings.success === "function") {
                    oSettings.success.call(this);
                }
            }
        });
    };

    var iClickOnOverflowToolbarButtonWithIcon = function(oSmartChart, sIcon, oSettings) {

        var oTempSettings = oSettings ? oSettings : {};
        oTempSettings.controlType =  "sap.m.OverflowToolbarButton";
        oTempSettings.matchers = [
            new PropertyStrictEquals({
                name: "icon",
                value: sIcon
            })
        ];

        iClickOnOverflowToolbarButton.call(this, oSmartChart, oTempSettings);
    };

    var iClickOnOverflowToolbarToggleButtonWithIcon = function(oSmartChart, sIcon, oSettings) {

        var oTempSettings = oSettings ? oSettings : {};
        oTempSettings.controlType =  "sap.m.OverflowToolbarToggleButton";
        oTempSettings.matchers = [
            new PropertyStrictEquals({
                name: "icon",
                value: sIcon
            })
        ];

        iClickOnOverflowToolbarButton.call(this, oSmartChart, oTempSettings);
    };

    var iClickOnButtonWithText = function(oSmartChart, sText, oSettings) {

        var oTempSettings = oSettings ? oSettings : {};
        oTempSettings.controlType =  "sap.m.Button";
        oTempSettings.matchers = [
            new PropertyStrictEquals({
                name: "text",
                value: sText
            })
        ];

        iClickOnOverflowToolbarButton.call(this, oSmartChart, oTempSettings);
    };

	return {
        /**
         * Clicks on the "Zoom In" button in the toolbar of a smartchart.
         * @param {string} sId The id of the smartchart
         */
        iClickOnZoomIn : function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://zoom-in");
                }
            });
        },

        /**
         * Clicks on the "Zoom Out" button in the toolbar of a smartchart.
         * @param {string} sId The id of the smartchart
         */
        iClickOnZoomOut : function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://zoom-out");
                }
            });
        },

        /**
         * Clicks on the "personalisation" button in the toolbar of a smartchart.
         * @param {string} sId The id of the smartchart
         */
        iClickOnThePersonalisationButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://action-settings");
                }
            });
        },

        /**
         * Clicks on the "legend" toggle button in the toolbar of a smartchart.
         * @param {*} sId The id of the smartchart
         */
        iClickOnTheLegendToggleButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarToggleButtonWithIcon.call(this, oSmartChart, "sap-icon://legend");
                }
            });
        },

        /**
         * Clicks on the "fullscreen" button of the smartchart.
         * @param {string} sId Id of the smartchart
         */
        iClickOnTheFullscreenButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://full-screen");
                }
            });
        },

        /**
         * Clicks on the "exit fullscreen" button of the smartchart.
         * @param {string} sId Id of the smartchart
         */
         iClickOnTheExitFullscreenButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://exit-full-screen");
                }
            });
        },

        /**
         * Clicks on the "details" button of the smartchart.
         * @param {string} sId Id of the smartchart
         */
        iClickOnTheSelectionDetailsButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnButtonWithText.call(this, oSmartChart, oCore.getLibraryResourceBundle("sap.ui.comp").getText("CHART_DETAILSBTN_LABEL"));
                }
            });
        },

        /**
         * Clicks on the "Drilldown" button in the toolbar of a smartchart.
         * @param {string} sId The id of the smartchart.
         */
        iClickOnTheDrillDownButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnButtonWithText.call(this, oSmartChart, oCore.getLibraryResourceBundle("sap.ui.comp").getText("CHART_DRILLDOWNBTN_TEXT"));
                }
            });
        },

        /**
         * Clicks on the "Chart Type" button in the toolbar of a smartchart.
         * @param {string} sId The id of the smartchart.
         */
        iClickOnTheChartTypeButton: function(sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://vertical-bar-chart");
                }
            });
        },

        /**
         * Selects a specific chart type for a smartchart in an open chart type popover
         * @param {string} sChartTypeName The name of the chart type
         */
        iSelectChartTypeInPopover: function(sChartTypeName){
			return this.waitFor({
				controlType: "sap.m.StandardListItem",
				success: function(aListItems) {

                    var oListItem = aListItems.filter(function(oItem){
                        return oItem.getTitle() == sChartTypeName;
                    })[0];

                    if (!oListItem){
                        Log.error("No chart type with name " + sChartTypeName + " was found in open popovers");
                    } else {
                        new Press().executeOn(oListItem);
                    }
				},
				errorMessage: "No chartType list items found"
			});
        },

        /**
         * Clicks on an drill-down breadcrumb with given name for given smartchart
         * @param {string} sName The name (text) of the breadcrumb
         * @param {string} sId The id of the smartchart.
         */
        iClickOnTheBreadcrumbWithName : function(sName, sId){
            return this.waitFor({
                controlType: "sap.m.Link",
                success: function(aLinks){
                    var aFilteredLinks = aLinks.filter(function(oLink){return (oLink.getText() === sName && oLink.getParent().getParent().getId() === sId);});

                    if (aFilteredLinks.length == 1){
                        new Press().executeOn(aFilteredLinks[0]);
                    } else {
                        Log.error("Expected 1 Link with text " + sName + " but found " + aFilteredLinks.length);
                    }
                }
            });
        },

        /**
         * Selects a specific dimension to drill-down for a smartchart in an open chart drill-down popover
         * @param {string} sDrillName Name of the Dimension which should be drilled-down
         */
        iSelectANewDrillDimensionInPopover: function(sDrillName){
			return this.waitFor({
				controlType: "sap.m.StandardListItem",
				success: function(aListItems) {

                    var oListItem = aListItems.filter(function(oItem){
                        return oItem.getTitle() == sDrillName;
                    })[0];

                    if (!oListItem){
                        Log.error("No chart type with name " + sDrillName + " was found in open popovers");
                    } else {
                        new Press().executeOn(oListItem);
                    }
				},
				errorMessage: "No chartType list items found"
			});
        },

        /**
         * Performs a drill-down on the SmartChart
         * @param {string} sId The id of the smartchart.
         * @param {string} sDrillName Name of the Dimension which should be drilled-down.
         */
        iDrillDownInDimension: function(sId, sDrillName) {
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnButtonWithText.call(this, oSmartChart, oCore.getLibraryResourceBundle("sap.ui.comp").getText("CHART_DRILLDOWNBTN_TEXT"), {
                        success: function(){
                            this.iSelectChartTypeInPopover(sDrillName);
                        }
                    });
                }
            });
        },

            /**
         * Performs a drill-down on the SmartChart
         * @param {string} sId The id of the smartchart.
         * @param {string} sChartTypeName Name of the Dimension which should be drilled-down.
         */
        iSelectAChartType: function(sId, sChartTypeName) {
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    iClickOnOverflowToolbarButtonWithIcon.call(this, oSmartChart, "sap-icon://vertical-bar-chart", {
                        success: function(){
                            this.iSelectANewDrillDimensionInPopover(sChartTypeName);
                        }
                    });
                }
            });
        },

        /**
         * Selects given datapoints on given chart.
         * <b>Note:</b> The API used on the inner chart for this seems unstable. Ensure the chart is 100% correctly set up, otherwise the call won't work and no error will be thrown
         * @param {array} aDataPoints Datapoint objects to select (see sap.chart.Chart#setSelectedDataPoints)
         * @param {string} sId Id of the smartchart
         */
        iSelectTheDatapoint: function (aDataPoints, sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    oSmartChart.getChartAsync().then(function(oInnerChart){
                        oInnerChart.setSelectedDataPoints(aDataPoints);
                    });
                }
            });
        },

        /**
         * Selectes given categories (dimensions) for the given SmartChart
         * @param {object} oCategories Categories to select (see sap.chart.Chart#setSelectedCategories for more information)
         * @param {string} sId Id of the SmartChart
         */
        iSelectTheCategories: function (oCategories, sId){
            waitForSmartChartWithId.call(this, sId, {
                success: function(oSmartChart){
                    oSmartChart.getChartAsync().then(function(oInnerChart){
                        oInnerChart.setSelectedCategories(oCategories);
                    });
                }
            });
        }
    };
});
