/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Actions",
	"./Actions",
	"./Assertions"
], function (
	Opa5,
	p13nActions,
	filterBarActions,
	filterBarAssertions
) {
	"use strict";

	Opa5.createPageObjects({
		onFilterBar: {
			actions: {
				/**
				 * OPA5 test action
				 * <ol>
				 * 	<li>
				 * 		Opens the personalization dialog of the given <code>SmartFilterBar</code>.
				 * 	</li>
				 *  <li>
				 * 		Navigates to the "Group" tab.
				 * 	</li>
				 * 	<li>
				 * 		Opens all groups and selects / deselects all filters depending on <code>oSettings</code>. Only the labels defined in <code>oSettings</code> will be selected, others will be deselected.
				 * 	</li>
				 * 	<li>
				 * 		Closes the personalization dialog.
				 * 	</li>
				 * </ol>
				 * @param {sap.ui.core.Control | string} oSmartFilterBar Instance / ID of the <code>SmartFilterBar</code> that is filtered
				 * @param {Object} oSettings Map containing the settings for the filter personalization. Key is the label of the given group in the <code>SmartFilterBar</code> personalization dialog, and value is an array containing the labels of the filter.
				 * @returns
				 */
				iPersonalizeFilter: function (oSmartFilterBar, oSettings) {
					return p13nActions.iPersonalizeFilterBar.call(this, oSmartFilterBar, oSettings, filterBarActions.iOpenThePersonalizationDialog);
				},

				/**
				 * OPA5 test action
				 * <ol>
				 * 	<li>
				 * 		Opens the personalization dialog of the given <code>SmartFilterBar</code>.
				 * 	</li>
				 * 	<li>
				 * 		Presses the reset personalization button.
				 * 	</li>
				 * 	<li>
				 * 		Confirms the reset dialog.
				 * 	</li>
				 * 	<li>
				 * 		Closes the personalization dialog.
				 * 	</li>
				 * </ol>
				 * @param {sap.ui.core.Control | string} oSmartFilterBar Instance / ID of the <code>SmartFilterBar</code>
				 * @returns
				 */
				iResetThePersonalization: function (oSmartFilterBar) {
					return p13nActions.iResetThePersonalization.call(this, oSmartFilterBar);
				},

				/**
				 * OPA5 test action
				 * Presses the apply filters button of the <code>SmartFilterBar</code>.
				 * @param {sap.ui.core.Control | string} oFilterBar Instance / ID of the <code>SmartFilterBar</code>
				 * @returns
				 */
				iExpectSearch: function (oFilterBar) {
					return filterBarActions.iExpectSearch.call(this, oFilterBar);
				},

				/**
				 * OPA5 test action
				 * <ol>
				 * 	<li>
				 * 		Opens the personalization dialog of the given <code>SmartFilterBar</code>.
				 * 	</li>
				 *	<li>
				 * 		Navigates to the "Group" tab.
				 *	</li>
				 * 	<li>
				 * 		Opens the given groups and enters all values in the filter depending on <code>oSettings</code>.
				 * 	</li>
				 * 	<li>
				 * 		Closes the personalization dialog.
				 * 	</li>
				 * </ol>
				 * @param {sap.ui.core.Control | string} oSmartFilterBar Instance / ID of the <code>SmartFilterBar</code>
				 * @param {string} sFilterLabel Label of the filter
				 * @param {Object} mSettings Map containing the settings for the filter values. Key is the label of the given group in the <code>SmartFilterBar</code> personalization dialog, and value is an object containing the label of the filter and the values that are entered
				 * @returns
				 */
				iEnterFilterValue: function (oSmartFilterBar, mSettings) {
					return filterBarActions.iEnterFilterValue.call(this, oSmartFilterBar, mSettings);
				},

				/**
				 * OPA5 test action
				 * Clears all values of a filter with a given label on the <code>SmartFilterBar</code>.
				 * @param {sap.ui.core.Control | string} oSmartFilterBar Instance / ID of the <code>FilterBar</code>
				 * @param {string} sFilterLabel Label of the <code>FilterField</code>
				 * @returns
				 */
				iClearFilterValue: function (oSmartFilterBar, sFilterLabel) {
					return filterBarActions.iClearFilterValue.call(this, oSmartFilterBar, sFilterLabel);
				},

				/**
				 * OPA5 test action
				 * Adds values to a filter with given label on the <code>SmartFilterBar</code>.
				 * @param {sap.ui.core.Control | string} oSmartFilterBar Instance / ID of the <code>FilterBar</code>
				 * @param {string} sFilterLabel Label of the <code>FilterField</code>
				 * @param {string[]} vValues Values to be added to the <code>FilterField</code>
				 * @returns
				 */
				iAddValuesToFilterField: function (oSmartFilterBar, sFilterLabel, vValues) {
					return filterBarActions.iAddValuesToFilterField.call(this, oSmartFilterBar, sFilterLabel, vValues);
				}
			},
			assertions: {
				/**
				 * OPA5 test action
				 * Checks if given filters are displayed on a given <code>SmartFilterBar</code>.
				 * Depending on the <code>vSettings</code> type this function can be used in two different ways:
				 * <ul>
				 * 	<li>
				 *		<code>vSettings</code> is an array of strings:
				 * 		Checks if all given strings are labels for filters on a given <code>SmartFilterBar</code>.
				 * 	</li>
				 * 	<li>
				 *  	<code>vSettings</code> is an object:
				 * 		Checks for each key in the object if there is a label for a filter of a given <code>SmartFilterBar</code>.
				 * 		The value of that key is an array containing objects with the operators and values that are expected for the given filter.
				 * 		If the value is an empty array, the given filter doesn't have a value.
				 *  </li>
				 * </ul>
				 * @param {sap.ui.core.Control | string} oSmartFilterBar Instance / ID of the <code>SmartFilterBar</code>
				 * @param {string[] | Object} vSettings
				 * @returns
				 */
				iShouldSeeFilters: function (oSmartFilterBar, vSettings) {
					return filterBarAssertions.iShouldSeeFilters.call(this, oSmartFilterBar, vSettings);
				}
			}
		}
	});

});
