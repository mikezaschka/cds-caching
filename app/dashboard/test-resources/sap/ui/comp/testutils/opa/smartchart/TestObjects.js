/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Actions",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Assertions",
	"../p13n/Actions"
], function(
	Opa5,
	mdcP13nActions,
	mdcP13nAssertions,
	compP13nActions
) {
	"use strict";

	Opa5.createPageObjects({
		onSmartChart: {
			actions: {
				/**
				 * @typedef {Object} ChartPersonalizationConfiguration
				 * @property {string} key Key of the value that is the result of the personalization
				 * @property {string} role Role of the given value
				 */
				/**
				 * OPA5 test action
				 * @param {sap.ui.core.Control | string} oChart Instance / ID of the <code>SmartChart</code> that is personalized
				 * @param {string} sChartType String containing the type of chart that is displayed
				 * @param {ChartPersonalizationConfiguration[]} aConfigurations Array containing the chart personalization configuration objects
				 * @returns {Promise} OPA waitFor
				 * 1. Opens the personalization dialog of a given chart.
				 * 2. Selects a chart type given by <code>sChartType</code>.
				 * 3. Executes the given ChartPersonalizationConfigurations.
				 * 4. Closes the personalization dialog.
				 */
				iPersonalizeChart: function(oChart, sChartType, aConfigurations) {
					return mdcP13nActions.iPersonalizeChart.call(this, oChart, sChartType, aConfigurations);
				},
				/**
				 * @typedef {Object} FilterPersonalizationConfiguration
				 * @property {string} key Key of the value that is the result of the personalization
				 * @property {string} operator Operator defining how the items are filtered
				 * @property {string[]} values Filter values for the given operator
				 * @property {string} inputControl <code>Control</code> that is used as input for the value
				 */
				/**
				 * OPA5 test action
				 * @param {sap.ui.core.Control | string} oChart Instance / ID of the <code>SmartChart</code> that is filtered
				 * @param {FilterPersonalizationConfiguration[]} aConfigurations Array containing the filter personalization configuration objects
				 * @returns {Promise} OPA waitFor
				 * 1. Opens the personalization dialog of a given chart.
				 * 2. Executes the given FilterPersonalizationConfiguration.
				 * 3. Closes the personalization dialog.
				 */
				 iPersonalizeFilter: function(oChart, aConfigurations) {
					return mdcP13nActions.iPersonalizeFilter.call(this, oChart, aConfigurations);
				},
				/**
				 * @typedef {Object} SortPersonalizationConfiguration
				 * @property {string} key Key of the item that is the result of the personalization
				 * @property {boolean} descending Determines whether the sort direction is descending
				 */
				/**
				 * OPA5 test action
				 * @param {sap.ui.core.Control | string} oChart Instance / ID of the <code>SmartChart</code> that is sorted
				 * @param {SortPersonalizationConfiguration[]} aConfigurations Array containing the sort personalization configuration objects
				 * @returns {Promise} OPA waitFor
				 * 1. Opens the personalization dialog of a given chart.
				 * 2. Executes the given SortPersonalizationConfiguration.
				 * 3. Closes the personalization dialog.
				 */
				iPersonalizeSort: function(oChart, aConfigurations) {
					return mdcP13nActions.iPersonalizeSort.call(this, oChart, aConfigurations);
				},
				/**
				 * Opa5 test action
				 * @param {sap.ui.core.Control | string} oChart Instance / ID of the <code>SmartChart</code> that is reset
				 * @returns {Promise} OPA waitFor
				 * 1. Opens the personalization dialog of a given chart.
				 * 2. Clicks on the reset personalization button.
				 * 3. Confirms the reset dialog.
				 * 4. Closes the personalization dialog.
				 */
				iResetThePersonalization: function(oChart) {
					return mdcP13nActions.iResetThePersonalization.call(this, oChart);
				}
            },
            assertions: {}
        }
    });

});
