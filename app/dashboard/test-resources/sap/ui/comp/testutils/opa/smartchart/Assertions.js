sap.ui.define([
	"sap/ui/test/Opa5"
], function (Opa5) {
    "use strict";

    return {
		/**
         * Assertion to check that there is a smartchart visible on the screen.
         */
		iShouldSeeAChart: function() {
		//return Opa5.assert.ok(true);

			return this.waitFor({
				controlType: "sap.ui.comp.smartchart.SmartChart",
				check: function(aSmartChart) {
					return aSmartChart.length === 1;
				},
				success: function(aSmartChart) {
					Opa5.assert.ok(aSmartChart.length, 'SmartChart is on the screen');
				},
				errorMessage: "No SmartChart found"
			});
		},

		/**
         * Assertion to check that there is a legend visible on the screen for given smartchart.
         * @param {string} sId Id of the chart to be checked for a visible legend
         */
		iShouldSeeALegend: function(sId) {
			//return Opa5.assert.ok(true);
			return this.waitFor({
				id: sId,
				success: function(oSmartChart) {
					var done = Opa5.assert.async();
					var assert = Opa5.assert;

					oSmartChart.getChartAsync().then(function(oInnerChart){
						assert.ok(oInnerChart.getVizProperties().legend.visible, "Legend is visible");
						done();
					});

				},
				errorMessage: "No SmartChart found"
			});

		},

		/**
         * Assertion to check that there is no legend visible on the screen for given smartchart.
         * @param {string} sId Id of the chart to be checked for a visible legend
         */
		iShouldSeeNoLegend: function(sId) {
			//return Opa5.assert.ok(true);

			return this.waitFor({
				id: sId,
				success: function(oSmartChart) {
					var done = Opa5.assert.async();
					var assert = Opa5.assert;

					oSmartChart.getChartAsync().then(function(oInnerChart){
						assert.ok(!oInnerChart.getVizProperties().legend.visible, "Legend is not visible");
						done();
					});

				},
				errorMessage: "No SmartChart found"
			});

		},

        /**
         * Assertion to check that there is a chart is in fullscreen mode.
         */
		iShouldSeeAChartInFullscreenMode: function() {

			return this.waitFor({
				controlType: "sap.m.Dialog",
				success: function(aDialogs) {
					Opa5.assert.ok(aDialogs.length, "Dialogs were found");

					var oDialog = aDialogs.filter(function(oDialog){return oDialog.getDomRef().className.includes("sapUiCompSmartFullScreenDialog");})[0];
					Opa5.assert.ok(oDialog, "Fullscreen dialog is opened");
				},
				errorMessage: "No Dialogs found"
			});

		},

		/**
         * Assertion to check that there is a chart type popover visible on the screen.
         */
		iShouldSeeAChartTypePopover: function() {

			return this.waitFor({
				controlType: "sap.m.Popover",
				success: function(aPopovers) {
					Opa5.assert.ok(aPopovers.length, "Dialogs were found");

					var oDialog = aPopovers.filter(function(oPopover){return oPopover.getDomRef().className.includes("sapUiCompSmartChartTypePopover");})[0];
					Opa5.assert.ok(oDialog, "Chart Type dialog is opened");
				},
				errorMessage: "No Dialogs found"
			});

		},

		/**
         * Assertion to check that there is chart visible with given chart type.
         * @param {string} sSmartChartId Id of the chart to be checked for a chart type
         * @param {string} sChartType Chart type which should be selected for the given chart
         */
		iShouldSeeTheChartWithChartType: function(sSmartChartId,  sChartType) {
			return this.waitFor({
				id: sSmartChartId,
				success: function(oSmartChart) {

					var done = Opa5.assert.async();
					var assert = Opa5.assert;

					oSmartChart.getChartAsync().then(function(oInnerChart){
						assert.ok(oInnerChart.getChartType() === sChartType);
						done();
					});
				},
				errorMessage: "No SmartChart found"
			});
		},

        /**
         * Assertion to check that there is a chart with given drillstack visible.
         * @param {array} aDrillStack Drillstack to check for
         * @param {string} sSmartChartId Id of the smartchart
         */
		iSeeTheDrillStack: function(aDrillStack, sSmartChartId) {

			var arraysMatchElements = function (array1, array2) {

				if (array1.length !== array2.length){
					return false;
				}

				for (var i = 0; i < array1.length; i++) {
					if (array1[i] !== array2[i]) {
						return false;
					}
				}

				return true;

			};

			return this.waitFor({
				id: sSmartChartId,
				success: function(oSmartChart) {
					Opa5.assert.ok(arraysMatchElements(oSmartChart._getDrillStackDimensions(), aDrillStack), "Drill stack is equal");
				},
				errorMessage: "No SmartChart found"
			});
		},

		/**
         * Assertion to check that there is a drilldown popover visible.
         */
		iShouldSeeADrillDownPopover: function() {

			return this.waitFor({
				controlType: "sap.m.Popover",
				success: function(aPopovers) {
					Opa5.assert.ok(aPopovers.length, "Dialogs were found");

					var oDialog = aPopovers.filter(function(oPopover){return oPopover.getDomRef().className.includes("sapUiCompSmartChartDrillDownPopover");})[0];
					Opa5.assert.ok(oDialog, "Drilldown dialog is opened");
				},
				errorMessage: "No Dialogs found"
			});

		},

		/**
         * Assertion to check that there is a drilldown popover visible.
         */
		iShouldSeeADetailsPopover: function() {

			return this.waitFor({
				controlType: "sap.m.Popover",
				success: function(aPopovers) {
					Opa5.assert.ok(aPopovers.length, "Dialogs were found");

					var oDialog = aPopovers.filter(function(oDialog){return (oDialog.getId().includes("selectionDetails"));})[0];
					Opa5.assert.ok(oDialog, "Details dialog is opened");
				},
				errorMessage: "No Dialogs found"
			});

		}

    };
});