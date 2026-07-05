sap.ui.define([
	"sap/ui/test/Opa5",
	"../TestUtils"
], function (Opa5, TestUtil) {
	"use strict";

	return {
		/**
		 * Checks if a SmartTable is visible on the screen
		 *
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeATable: function () {
			return this.waitFor({
				controlType: "sap.ui.comp.smarttable.SmartTable",
				check: function (aSmartTable) {
					return aSmartTable.length === 1;
				},
				success: function (aSmartTable) {
					Opa5.assert.ok(aSmartTable.length, "SmartTable is on the screen");
				},
				errorMessage: "No SmartTable found"
			});
		},

		/**
		 * Checks if the table title and count are visible on the screen
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeTheTableTitleAndCount: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-header",
				controlType: "sap.m.Title",
				success: function (oTitle) {
					Opa5.assert.ok(oTitle, "Table title is on the screen");
					var aMatches = oTitle.getText().match(/.*\([0-9]*\)/);
					Opa5.assert.ok(aMatches.length === 1, "Title contains item count");
				},
				errorMessage: "No title found"
			});
		},

		/**
		 * Checks if the variant management is visible on the screen
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeVariantManagement: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-variant",
				controlType: "sap.ui.comp.smartvariants.SmartVariantManagement",
				success: function (oVariantManagement) {
					Opa5.assert.ok(oVariantManagement, "Variant management is on the screen");
				},
				errorMessage: "No VariantManagement found"
			});
		},

		/**
		 * Checks if the Table is in Edit or Display mode
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		tableShouldBeInMode: function(sTableId, sMode) {
			return this.waitFor({
				id: sTableId + "-btnEditToggle",
				controlType: "sap.m.OverflowToolbarButton",
				success: function (oButton) {
					if (sMode === "Edit") {
						Opa5.assert.equal(oButton.getIcon(), "sap-icon://display", "Table is in Edit mode, 'Display' button is visible on the screen");
					} else {
						Opa5.assert.equal(oButton.getIcon(), "sap-icon://edit", "Table is in Display mode, 'Edit' button is visible on the screen");
					}
				},
				errorMessage: "No " + sMode === "Edit" ? "'Display'" : "'Edit'"  + " button found"
			});
		},

		/**
		 * Checks if the Table is in Full screen mode or not
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		tableShouldBeInFullScreenMode: function(sTableId, bFullScreen) {
			return this.waitFor({
				id: sTableId + "-btnFullScreen",
				controlType: "sap.m.OverflowToolbarButton",
				success: function (oButton) {
					if (bFullScreen) {
						Opa5.assert.equal(oButton.getIcon(), "sap-icon://exit-full-screen", "Table is in Full screen mode, 'Minimize' button is visible on the screen");
					} else {
						Opa5.assert.equal(oButton.getIcon(),"sap-icon://full-screen", "Table is not in Full screen mode, 'Maximize' button is visible on the screen");
					}
				},
				errorMessage: "No " + bFullScreen ? "'Minimize'" : "'Maximize'" + " button found"
			});
		},

		iShouldSeeFullScreenDialog: function () {
			return this.waitFor({
				controlType: "sap.m.Dialog",
				check: function (aDialog) {
					return aDialog.length == 1;
				},
				success: function (oDialog) {
					Opa5.assert.ok(oDialog[0].isOpen(), "Full Screen dialog is visible on the screen");
				},
				errorMessage: "No Full Screen dialog found"
			});
		},

		iShouldNotSeeFullScreenDialog: function (sTableId) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function (oTable) {
					Opa5.assert.ok(oTable._oFullScreenDialog == null || !oTable._oFullScreenDialog.isOpen(), "Full Screen dialog is not visible on the screen");
				},
				errorMessage: "Full Screen dialog is still open"
			});
		},

		iShouldSeeExportWarningDialog: function (sMessage) {
			return this.waitFor({
				controlType: "sap.m.Dialog",
				check: function (aDialog) {
					return aDialog.length == 1 && aDialog[0].getTitle() === TestUtil.getTextFromResourceBundle("sap.ui.export", "WARNING_TITLE");
				},
				success: function (oDialog) {
					Opa5.assert.equal(oDialog[0].getContent()[0].getText(), sMessage);
				},
				errorMessage: "No Warning dialog found"
			});
		},

		/**
		 * Checks if the Personalization button is visible on the screen
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeThePersonalisationButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-btnPersonalisation",
				controlType: "sap.m.OverflowToolbarButton",
				success: function (oButton) {
					Opa5.assert.equal(oButton.getIcon(), "sap-icon://action-settings", "Personalisation button is visible on the screen");
				},
				errorMessage: "No Personalisation button found"
			});
		},

		/**
		 * Checks if the Export button is visible on the screen
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeTheExportButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-btnExcelExport",
				controlType: "sap.m.MenuButton",
				success: function (oButton) {
					Opa5.assert.ok(oButton, "Export button is visible on the screen");
				},
				errorMessage: "No 'Export' button found"
			});
		},

		/**
		 * Checks if the 'Show more per column'/'Show less per column' button is visible on the screen
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeShowMorePerColumnButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-btnShowHideDetails",
				controlType: "sap.m.SegmentedButton",
				success: function(oSegmentedButton) {
					Opa5.assert.ok(oSegmentedButton, "'Show more per column'/'Show less per column' button is visible on the screen");
				},
				errorMessage: "Did not find the 'Show more per column'/'Show less per column' button"
			});
		},

		/**
		 * Checks if the 'More' button is visible on the screen
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iShouldSeeTheMoreButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-ui5table-trigger",
				controlType: "sap.m.CustomListItem",
				success: function (oItem) {
					Opa5.assert.ok(oItem, "'More' button is visible on the screen");
				},
				errorMessage: "No 'More' button found"
			});
		},

		theColumnShouldBeHidden: function(sTableId, sColumnKey) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function (oTable) {
					Opa5.assert.ok(oTable._aColumnKeys.indexOf(sColumnKey) === -1);
				},
				errorMessage: "No SmartTable with the given id was found"
			});
		},

		theColumnShouldNotBeHidden: function(sTableId, sColumnKey) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function (oTable) {
					Opa5.assert.ok(oTable._aColumnKeys.indexOf(sColumnKey) > -1);
				},
				errorMessage: "No SmartTable with the given id was found"
			});
		},

		theColumnMenuShouldOpen: function() {
			return this.waitFor({
				controlType: "sap.m.table.columnmenu.Menu",
				success: function (aMenus) {
					Opa5.assert.ok(aMenus[0].isOpen(), "Column menu is visible on the screen");
				},
				errorMessage: "No Column Menu found"
			});
		},

		thePropertyShouldBeSorted: function(sTableId, sPropertyName, sSortOrder) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					Opa5.assert.equal(oTable._getColumnByKey(sPropertyName).data("p13nData").sorted.ascending, sSortOrder.toLowerCase() === "ascending");
				},
				errorMessage: "Did not find the table"
			});
		},

		theItemCountShouldBe: function(sTableId, iCount) {
			return this.waitFor({
				id: sTableId + "-header",
				controlType: "sap.m.Title",
				success: function (oTitle) {
					var aMatches = oTitle.getText().match(/\([0-9]*\)/);
					Opa5.assert.ok(aMatches[0] === "(" + iCount + ")", "Item count is correct");
				},
				errorMessage: "No title found"
			});
		}
	};
});
