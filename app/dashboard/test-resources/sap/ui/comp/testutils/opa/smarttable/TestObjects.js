/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Actions",
	"test-resources/sap/ui/mdc/testutils/opa/p13n/Assertions",
	"../p13n/Actions",
	"./Actions",
	"./Assertions"
], function(
	Opa5,
	mdcP13nActions,
	mdcP13nAssertions,
	compP13nActions,
	compSmartTableActions,
	compSmartTableAssertions
) {
	"use strict";

	Opa5.createPageObjects({
		onSmartTable: {
			actions: {
				iPersonalizeFilter: function(oControl, aSettings) {
					return mdcP13nActions.iPersonalizeFilter.call(this, oControl, aSettings);
				},
				iPersonalizeGroup: function(oControl, aSettings) {
					return mdcP13nActions.iPersonalizeGroup.call(this, oControl, aSettings);
				},
				iPersonalizeColumns: function(oControl, aItems) {
					return mdcP13nActions.iPersonalizeColumns.call(this, oControl, aItems);
				},
				iPersonalizeSort: function(oControl, aSettings) {
					return mdcP13nActions.iPersonalizeSort.call(this, oControl, aSettings);
				},
				iResetThePersonalization: function(oControl) {
					return mdcP13nActions.iResetThePersonalization.call(this, oControl);
				},
				iSelectAllRows: function(oControl) {
					return compSmartTableActions.iSelectAllRows.call(this, oControl);
				},
				iClearSelection: function(oControl) {
					return compSmartTableActions.iClearSelection.call(this, oControl);
				},
				iSelectRows: function(oControl, iStartIndex, iEndIndex) {
					return compSmartTableActions.iSelectRows.call(this, oControl, iStartIndex, iEndIndex);
				},
				iPressToggleEditButton: function(oControl) {
					return compSmartTableActions.iPressToggleEditButton.call(this, oControl);
				},
				iExportToExcel: function(oControl, sFileName, bIncludeFilterSettings, bSplitCells) {
					return compSmartTableActions.iExportToExcel.call(this, oControl, sFileName, bIncludeFilterSettings, bSplitCells);
				},
				iSetControlValueInCell: function(oControl, iRow, iCol, vValue) {
					return compSmartTableActions.iSetControlValueInCell.call(this, oControl, iRow, iCol, vValue);
				},
				iPressControlInCell: function(oControl, iRow, iCol) {
					return compSmartTableActions.iPressControlInCell.call(this, oControl, iRow, iCol);
				},
				iPressTheMoreButton: function(oControl) {
					return compSmartTableActions.iPressTheMoreButton.call(this, oControl);
				},
				iScrollTableToIndex: function(oControl, iIndex) {
					return compSmartTableActions.iScrollTableToIndex.call(this, oControl, iIndex);
				},
				iPressRowAction: function(oControl, iRow, iAction) {
					return compSmartTableActions.iPressRowAction.call(this, oControl, iRow, iAction);
				},
				iPressRow: function(oControl, iRow) {
					return compSmartTableActions.iPressRow.call(this, oControl, iRow);
				},
				iToggleShowMorePerColumn: function(oControl) {
					return compSmartTableActions.iToggleShowMorePerColumn.call(this, oControl);
				},
				iPressColumnHeader: function(oControl, sColumnName) {
					return compSmartTableActions.iPressColumnHeader.call(this, oControl, sColumnName);
				},
				iPressSortPropertyInColumnMenu: function(sPropertyName, sSortOrder) {
					return compSmartTableActions.iPressSortPropertyInColumnMenu.call(this, sPropertyName, sSortOrder);
				}
			},
			assertions: {
				iShouldSeeATable: function() {
					return compSmartTableAssertions.iShouldSeeATable.call(this);
				},
				iShouldSeeTheTableTitleAndCount: function(oControl) {
					return compSmartTableAssertions.iShouldSeeTheTableTitleAndCount.call(this, oControl);
				},
				iShouldSeeVariantManagement: function(oControl) {
					return compSmartTableAssertions.iShouldSeeVariantManagement.call(this, oControl);
				},
				tableShouldBeInMode: function(oControl, sMode) {
					return compSmartTableAssertions.tableShouldBeInMode.call(this, oControl, sMode);
				},
				iShouldSeeThePersonalisationButton: function(oControl) {
					return compSmartTableAssertions.iShouldSeeThePersonalisationButton.call(this, oControl);
				},
				iShouldSeeTheExportButton: function(oControl) {
					return compSmartTableAssertions.iShouldSeeTheExportButton.call(this, oControl);
				},
				iShouldSeeShowMorePerColumnButton: function(oControl) {
					return compSmartTableAssertions.iShouldSeeShowMorePerColumnButton.call(this, oControl);
				},
				iShouldSeeTheMoreButton: function(oControl) {
					return compSmartTableAssertions.iShouldSeeTheMoreButton.call(this, oControl);
				},
				theColumnShouldBeHidden: function(sTableId, sColumnKey) {
					return compSmartTableAssertions.theColumnShouldBeHidden.call(this, sTableId, sColumnKey);
				},
				theColumnMenuShouldOpen: function() {
					return compSmartTableAssertions.theColumnMenuShouldOpen.call(this);
				},
				thePropertyShouldBeSorted: function(sTableId, sPropertyName, sSortOrder) {
					return compSmartTableAssertions.thePropertyShouldBeSorted.call(this, sTableId, sPropertyName, sSortOrder);
				},
				theItemCountShouldBe: function(sTableId, iCount) {
					return compSmartTableAssertions.theItemCountShouldBe.call(this, sTableId, iCount);
				}
			}
		}
	});

});
