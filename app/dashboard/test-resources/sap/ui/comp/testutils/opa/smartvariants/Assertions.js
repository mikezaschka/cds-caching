/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	'sap/base/Log'
], function (
	Opa5,
	Log
) {
	"use strict";

	return {

		/**
		 * Checks the expected variant title.
		 *
		 * @param {string} sSVMId The smart variant management control ID
		 * @param {string} sVariantTitle The name of the expected variant
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theVariantShouldBeDisplayed: function (sSVMId, sVariantTitle) {
			return this.waitFor({
				id: sSVMId,
				success: function (oVariantManagement) {
					Opa5.assert.equal(oVariantManagement.getTitle().getText(), sVariantTitle, "Expected " + sVariantTitle + " to be displayed.");
				},
				errorMessage: "VariantManagement could't be found"
			});
		},

		/**
		 * Checks the expected variant titles.
		 * Prerequisite is an open My Views popup.
		 * @param {string} sSVMId The smart variant management control ID
		 * @param {array} aVariantNames List of the expected variants
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theMyViewShouldContain: function (sSVMId, aVariantNames) {
			return this.waitFor({
				id: sSVMId + "-vm-popover-popover",
				success: function (oPopover) {

					return this.waitFor({
						controlType: "sap.m.SelectList",
						id: sSVMId + "-vm-list",
						success: function (oVariantList) {

							return this.waitFor({
								controlType: "sap.ui.core.Item",
								matchers: function (oVariantItem) {
									return oVariantItem.getId().indexOf(sSVMId + "-vm-list-") >= 0;
								},
								success: function (aItems) {
									var aIsVariantTitle = [];
									aItems.forEach(function (oItem) { aIsVariantTitle.push(oItem.getText()); });
									Opa5.assert.deepEqual(aVariantNames, aIsVariantTitle, "expected [" + aVariantNames + "], found [" + aIsVariantTitle + "] titles");
								}
							});
						},
						errorMessage: "Did not find any variants"
					});
				},
				errorMessage: "'My Views' could not be found"
			});
		},

		/**
		 * Checks is the expected Save View dialog is open.
		 * @param {string} sSVMId The smart variant management control ID
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theOpenSaveViewDialog: function (sSVMId) {
			return this.waitFor({
				id: sSVMId + "-vm-savedialog",
				success: function (oSaveViewDialog) {
					Opa5.assert.ok(oSaveViewDialog);
				}
			});
		},

		/**
		 * Checks is the expected Manage Views dialog is open.
		 * @param {string} sSVMId The smart variant management control ID
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theOpenManageViewsDialog: function (sSVMId) {
			return this.waitFor({
				id: sSVMId + "-vm-managementdialog",
				success: function (oManageDialog) {
					Opa5.assert.ok(oManageDialog);
				}
			});
		},

		/**
		 * Checks the variants in the Manage Views dialog.
		 * Prerequisite is an open Manage Views dialog.
		 * @param {array} aVariantNames List of the expected variants
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theOpenManageViewsDialogTitleShouldContain: function (aVariantNames) {
			return this.waitFor({
				controlType: "sap.m.ColumnListItem",
				success: function (aManageVariantItems) {

					var aIsVariantTitle = [];
					aManageVariantItems.forEach(function (oItem) {
						var oCell = oItem.getCells()[1];
						if (oCell.isA("sap.m.ObjectIdentifier")) {
							aIsVariantTitle.push(oCell.getTitle());
						} else {
							aIsVariantTitle.push(oCell.getValue());
						}
					});

					Opa5.assert.deepEqual(aVariantNames, aIsVariantTitle, "expected [" + aVariantNames + "], found [" + aIsVariantTitle + "] titles found");
				},
				errorMessage: "No variant list items found"
			});
		},

		/**
		 * Checks the variants with the Favorite checkbox set in the Manage Views dialog.
		 * Prerequisite is an open Manage Views dialog.
		 * @param {array} aVariantFavorites List of the expected variants
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theOpenManageViewsDialogFavoritesShouldContain: function (aVariantFavorites) {
			return this.waitFor({
				controlType: "sap.m.ColumnListItem",
				success: function (aManageVariantItems) {

					var aIsVariantFavorites = [];
					aManageVariantItems.forEach(function (oItem) {
						var oCell = oItem.getCells()[0];
						aIsVariantFavorites.push(oCell.getSrc() === "sap-icon://favorite");
					});

					Opa5.assert.deepEqual(aVariantFavorites, aIsVariantFavorites, "expected [" + aVariantFavorites + "], found [" + aIsVariantFavorites + "] favorite states found");
				},
				errorMessage: "No variant list items found"
			});
		},

		/**
		 * Checks the variants with the Apply Automatically checkbox set in the Manage Views dialog.
		 * Prerequisite is an open Manage Views dialog.
		 * @param {array} aVariantApplayAutos List of the expected variants
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theOpenManageViewsDialogApplyAutomaticallyShouldContain: function (aVariantApplayAutos) {
			return this.waitFor({
				controlType: "sap.m.ColumnListItem",
				success: function (aManageVariantItems) {

					var aIsVariantApplyAutos = [];
					aManageVariantItems.forEach(function (oItem) {
						var oCell = oItem.getCells()[4];
						aIsVariantApplyAutos.push(oCell.getSelected());
					});

					Opa5.assert.deepEqual(aVariantApplayAutos, aIsVariantApplyAutos, "expected [" + aVariantApplayAutos + "], found [" + aIsVariantApplyAutos + "] apply automatic states");
				},
				errorMessage: "No variant list items found"
			});
		},

		/**
		 * Checks for the expected default variant.
		 * Prerequisite is an open Manage Views dialog.
		 * @param {string} sVariantName The expected default variant
		 * @returns {object} The result of the {@link sap.ui.test.Opa5#waitFor} function, to be used for chained statements
		 * @public
		 */
		theOpenManageViewsDialogDefaultShouldBe: function (sVariantName) {
			return this.waitFor({
				controlType: "sap.m.ColumnListItem",
				success: function (aManageVariantItems) {

					var oListItem = aManageVariantItems.filter(function (oItem) {
						var oCell = oItem.getCells()[1];
						if (oCell.isA("sap.m.ObjectIdentifier")) {
							return oCell.getTitle() === sVariantName;
						} else {
							return oCell.getValue() === sVariantName;
						}
					})[0];

					if (!oListItem) {
						Log.error("No variant with name " + sVariantName + " was found in 'Manage Views'");
					} else {
						var oDefault = oListItem.getCells()[3];
						Opa5.assert.ok(oDefault.getSelected(), "the default for " + sVariantName + " was expected to be set");
					}

				},
				errorMessage: "No variant list items found"
			});
		}
	};
});
