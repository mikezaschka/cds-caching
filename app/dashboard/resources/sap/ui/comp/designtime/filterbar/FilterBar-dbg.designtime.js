/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.filterbar.FilterBar control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {},
		properties: {
			persistencyKey: {
				ignore: true
			},
			advancedMode: {
				ignore: true
			},
			deltaVariantMode: {
				ignore: true
			},
			useToolbar: {
				ignore: true
			},
			/**
			 * @deprecated As of version 1.30.0. Replaced by property <code>filterBarExpanded</code> This property is mapped to the
			 *             filterBarExpanded property.
			 */
			expandAdvancedArea: {
				ignore: true
			},
			/**
			 * @deprecated Since version 1.32.0
			 */
			searchEnabled: {
				ignore: false
			},
			filterBarExpanded: {
				ignore: false
			},
			considerGroupTitle: {
				ignore: false
			},
			/**
			 * @deprecated Since 1.84
			 */
			showClearButton: {
				ignore: false
			},
			showRestoreButton: {
				ignore: false
			},
			showAllFilters: {
				ignore: false
			},
			showGoOnFB: {
				ignore: false
			},
			showRestoreOnFB: {
				ignore: false
			},
			showClearOnFB: {
				ignore: false
			},
			/**
			 * @deprecated Since version 1.28.0. Replaced by property <code>showGoOnFB</code>
			 */
			showGoButton: {
				ignore: true
			},
			filterContainerWidth: {
				ignore: false
			},
			header: {
				ignore: false
			},
			showFilterConfiguration: {
				ignore: false
			},
			useSnapshot: {
				ignore: false
			},
			isRunningInValueHelpDialog: {
				ignore: true
			},
			disableSearchMatchesPatternWarning: {
				ignore: true
			},
			headerLevel: {
				ignore: false
			}
		},
		customData: {

		}
	};
});
