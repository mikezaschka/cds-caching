sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Action",
	"sap/ui/thirdparty/jquery",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/matchers/Ancestor",
	"sap/base/Log",
	"../TestUtils"
], function (Opa5, Action, jQueryDOM, Press, PropertyStrictEquals, Ancestor, Log, TestUtil) {
	"use strict";

	var setControlValue = function(oControl, vValue) {
		if (oControl.isA("sap.m.CheckBox")) {
			oControl.setSelected(vValue);
		} else if (oControl.isA("sap.m.Input")) {
			oControl.setValue(vValue);
		}  else if (oControl.isA("sap.m.Select") || oControl.isA("sap.m.ComboBox")) {
			oControl.setSelectedKey(vValue);
		}
	};

	return {
		/**
		 * Selects all rows
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iSelectAllRows: function(sTableId) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					var oInnerTable = oTable._oTable;

					if (oTable.getTableType() === "Table") {
						var oSelectionPlugin = oInnerTable._getSelectionPlugin();
						if (oSelectionPlugin && oSelectionPlugin.selectAll) {
							oSelectionPlugin.selectAll();
						} else {
							oInnerTable.selectAll();
						}
					} else {
						oInnerTable.selectAll();
					}
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Clears the selection
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iClearSelection: function(sTableId) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					var oInnerTable = oTable._oTable;

					if (oTable.getTableType() === "Table") {
						var oSelectionPlugin = oInnerTable._getSelectionPlugin();

						if (oSelectionPlugin) {
							oSelectionPlugin.clearSelection();
						} else {
							oInnerTable.clearSelection();
						}
					} else {
						oInnerTable.removeSelections(true);
					}
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Adds the given selection interval to the selection
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {int} iStartIndex Index from which the selection starts
		 * @param {int} iEndIndex Index up to which to select
		 * @returns {Promise} OPA waitFor
		 */
		iSelectRows: function (sTableId, iStartIndex, iEndIndex) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					var oInnerTable = oTable._oTable;

					if (oTable.getTableType() === "Table") {
						var oSelectionPlugin = oInnerTable._getSelectionPlugin();

						if (oSelectionPlugin) {
							oSelectionPlugin.addSelectionInterval(iStartIndex, iEndIndex);
						} else {
							oInnerTable.addSelectionInterval(iStartIndex, iEndIndex);
						}
					} else {
						for (var iIndex = iStartIndex; iIndex <= iEndIndex; iIndex++){
							oInnerTable.setSelectedItem(oTable._oTable.getItems()[iIndex]);
						}
					}
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Switches the table to edit mode
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iPressToggleEditButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-btnEditToggle",
				controlType: "sap.m.OverflowToolbarButton",
				actions: new Press(),
				errorMessage: "Did not find the 'Edit'/'Display' button"
			});
		},

		/**
		 * Switches the table to full screen mode
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iPressFullScreenButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-btnFullScreen",
				controlType: "sap.m.OverflowToolbarButton",
				actions: new Press(),
				errorMessage: "Did not find the Full screen button"
			});
		},

		iPressOnButtonWithIcon: function (sIcon) {
			return this.waitFor({
				controlType: "sap.m.Button",
				matchers: new PropertyStrictEquals({
					name: "icon",
					value: sIcon
				}),
				actions: new Press()
			});
		},

		iPressOnExportButton: function() {
			return this.waitFor({
				controlType: "sap.m.Button",
				matchers: function(oButton) {
					return oButton.getText() === TestUtil.getTextFromResourceBundle("sap.ui.export", "EXPORT_BUTTON");
				},
				actions: new Press()
			});
		},

		iChangeDownloadLimit: function(iLimit) {
			return this.waitFor({
				controlType: "sap.ui.comp.smarttable.SmartTable",
				actions: function(oTable) {
					oTable.attachBeforeExport(function(oEvent) {
						var mExcelSettings = oEvent.getParameter("exportSettings");
						mExcelSettings.dataSource.downloadLimit = iLimit;
					});
				}
			});
		},

		/**
		 * Invalidate the parent of smart table
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iInvalidateParent: function(sControlId) {
			return this.waitFor({
				id: sControlId,
				controlType: "sap.ui.core.Control",
				success: function(oControl) {
					oControl.getParent().invalidate();
				},
				errorMessage: "Did not find the Control"
			});
		},
		/**
		 * Starts export to excel
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {string} [sFileName] Optional name for the exported file
		 * @param {boolean} [bIncludeFilterSettings] Optional flag whether to include the filter settings in the exported file
		 * @param {boolean} [bSplitCells] Optional flag whether to split columns with multiple values
		 * @returns {Promise} OPA waitFor
		 */
		iExportToExcel: function(sTableId, sFileName, bIncludeFilterSettings, bSplitCells) {
			if (sFileName === undefined && bIncludeFilterSettings === undefined && bSplitCells === undefined) {
				return this.waitFor({
					id: sTableId + "-btnExcelExport-internalSplitBtn-textButton",
					controlType: "sap.m.Button",
					actions: new Press(),
					errorMessage: "Did not find the 'Export' button"
				});
			} else {
				return this.waitFor({
					id: sTableId + "-btnExcelExport-internalSplitBtn-arrowButton",
					controlType: "sap.m.Button",
					success: function(oButton) {
						var oResourceBundle = Opa5.getWindow().sap.ui.require("sap/ui/core/Lib")?.getResourceBundleFor("sap.ui.comp");
						new Press().executeOn(oButton);

						return this.waitFor({
							controlType: "sap.ui.unified.MenuItem",
							matchers: new PropertyStrictEquals({
								name: "text",
								value: oResourceBundle?.getText("EXPORT_WITH_SETTINGS")
							}),
							success: function(aMenuItems) {
								new Press().executeOn(aMenuItems[0]);

								return this.waitFor({
									id: "exportSettingsDialog-fileName",
									controlType: "sap.m.Input",
									searchOpenDialogs: true,
									success: function(oInput) {
										if (sFileName !== "") {
											oInput.setValue(sFileName);
										}

										return this.waitFor({
											id: "exportSettingsDialog-includeFilterSettings",
											controlType: "sap.m.CheckBox",
											success: function(oCheckboxFilterSettings) {
												if (bIncludeFilterSettings !== undefined) {
													oCheckboxFilterSettings.setSelected(bIncludeFilterSettings);
												}

												return this.waitFor({
													id: "exportSettingsDialog-splitCells",
													controlType: "sap.m.CheckBox",
													success: function(oCheckboxSplitCells) {
														if (bSplitCells !== undefined) {
															oCheckboxSplitCells.setSelected(bSplitCells);
														}

														return this.waitFor({
															id: "exportSettingsDialog-exportButton",
															controlType: "sap.m.Button",
															actions: new Press(),
															errorMessage: "Did not find the 'Export' button"
														});
													},
													errorMessage: "Did not find the 'Split cells with multiple values' checkbox"
												});
											},
											errorMessage: "Did not find the 'Include filter settings' checkbox"
										});
									},
									errorMessage: "Did not find the 'File name' input"
								});
							},
							errorMessage: "Did not find the 'Export As...' button"
						});
					},
					errorMessage: "Did not find the 'Export' button"
				});
			}
		},

		/**
		 * Sets the value of the control in the given cell
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {int} iRow Index of the row
		 * @param {int} iCol Index of the column
		 * @param {string|boolean} vValue The value to be set
		 * @returns {Promise} OPA waitFor
		 */
		iSetControlValueInCell: function(sTableId, iRow, iCol, vValue) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					if (oTable.getTableType() === "Table") {
						return this.waitFor({
							id: sTableId + "-ui5table-rows-row" + iRow,
							controlType: "sap.ui.table.Row",
							success: function(oRow) {
								return this.waitFor({
									controlType: "sap.ui.core.Control",
									editable: true,
									matchers: new Ancestor(oRow),
									success: function(aControls) {
										var oControl, $Cell;
										for (var i = 0; i < aControls.length; i++) {
											oControl = aControls[i];
											$Cell = jQueryDOM(oControl.getDomRef()).closest(".sapUiTableCell", oTable.getDomRef());
											if ($Cell[0].id.endsWith("-col" + iCol)) {
												setControlValue.call(this, oControl, vValue);
												break;
											}
										}
									},
									errorMessage: "Did not find the Control"
								});
							},
							errorMessage: "Did not find the Row"
						});
					} else {
						return this.waitFor({
							controlType: "sap.m.ColumnListItem",
							matchers: new Ancestor(oTable),
							success: function(aItems) {
								return this.waitFor({
									controlType: "sap.ui.core.Control",
									editable: true,
									matchers: new Ancestor(aItems[iRow]),
									success: function(aControls) {
										var oControl, $Cell;
										for (var i = 0; i < aControls.length; i++) {
											oControl = aControls[i];
											$Cell = jQueryDOM(oControl.getDomRef()).closest("td", oTable.getDomRef());
											if ($Cell[0].id.endsWith("_cell" + iCol)) {
												setControlValue.call(this, oControl, vValue);
												break;
											}
										}
									},
									errorMessage: "Did not find the Control"
								});
							},
							errorMessage: "Did not find the Item"
						});
					}
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Presses the control inside the given cell
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {int} iRow Index of the row
		 * @param {int} iCol Index of the column
		 * @returns {Promise} OPA waitFor
		 */
		iPressControlInCell: function(sTableId, iRow, iCol) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					if (oTable.getTableType() === "Table") {
						return this.waitFor({
							id: sTableId + "-ui5table-rows-row" + iRow,
							controlType: "sap.ui.table.Row",
							success: function(oRow) {
								return this.waitFor({
									controlType: "sap.ui.core.Control",
									matchers: new Ancestor(oRow),
									success: function(aControls) {
										var oControl, $Cell;
										for (var i = 0; i < aControls.length; i++) {
											oControl = aControls[i];
											if (oControl.isA("sap.m.Link") || oControl.isA("sap.m.Button") || oControl.isA("sap.m.CheckBox")) {
												$Cell = jQueryDOM(oControl.getDomRef()).closest(".sapUiTableCell", oTable.getDomRef());
												if ($Cell[0].id.endsWith("-col" + iCol)) {
													oControl.firePress();
													break;
												}
											}
										}
									},
									errorMessage: "Did not find the Control"
								});
							},
							errorMessage: "Did not find a control inside the cell"
						});
					} else {
						return this.waitFor({
							controlType: "sap.m.ColumnListItem",
							matchers: new Ancestor(oTable),
							success: function(aItems) {
								return this.waitFor({
									controlType: "sap.ui.core.Control",
									matchers: new Ancestor(aItems[iRow]),
									success: function(aControls) {
										var oControl, $Cell;
										for (var i = 0; i < aControls.length; i++) {
											oControl = aControls[i];
											if (oControl.isA("sap.m.Link") || oControl.isA("sap.m.Button")) {
												$Cell = jQueryDOM(oControl.getDomRef()).closest("td", oTable.getDomRef());
												if ($Cell[0].id.endsWith("_cell" + iCol)) {
													oControl.firePress();
													break;
												}
											}
										}
									},
									errorMessage: "Did not find the Control"
								});
							},
							errorMessage: "Did not find the Item"
						});
					}
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Presses the 'More' button to display additional items
		 * Note: Only applicable when the <code>tableType</code> is set to <code>ResponsiveTable</code>
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iPressTheMoreButton: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-ui5table-trigger",
				controlType: "sap.m.CustomListItem",
				actions: new Press(),
				errorMessage: "Did not find the 'More' button"
			});
		},

		/**
		 * Scrolls the table to the given index
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {int} iIndex Index of the row to be scrolled into viewport
		 * @returns {Promise} OPA waitFor
		 */
		iScrollTableToIndex: function(sTableId, iIndex) {
			return this.waitFor({
				id: sTableId,
				controlType: "sap.ui.comp.smarttable.SmartTable",
				success: function(oTable) {
					var oInnerTable = oTable._oTable;

					if (oTable.getTableType() === "Table") {
						oInnerTable.setFirstVisibleRow(iIndex);
					} else {
						oInnerTable.scrollToIndex(iIndex);
					}
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Presses a row action in the given row
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {int} iRow Index of the row
		 * @param {int} [iAction] Optional index of the control inside the <code>RowAction</code>. In case it is not specified, the first control will
		 * be pressed.
		 * @returns {Promise} OPA waitFor
		 */
		iPressRowAction: function(sTableId, iRow, iAction) {
			return this.waitFor({
				id: sTableId + "-ui5table",
				controlType: "sap.ui.table.Table",
				success: function(oTable) {
					return this.waitFor({
						controlType: "sap.ui.table.RowAction",
						matchers: new Ancestor(oTable),
						success: function(aRowActions) {
							aRowActions[iRow].getItems()[iAction || 0].firePress();
						},
						errorMessage: "Did not find the RowAction"
					});
				},
				errorMessage: "Did not find the Table"
			});
		},

		/**
		 * Presses the given row
		 * Note: Only applicable when the <code>tableType</code> is set to <code>ResponsiveTable</code>
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @param {int} iRow Index of the row
		 * @returns {Promise} OPA waitFor
		 */
		iPressRow: function(sTableId, iRow) {
			return this.waitFor({
				id: sTableId + "-ui5table",
				controlType: "sap.m.Table",
				success: function() {
					return this.waitFor({
						controlType: "sap.m.ColumnListItem",
						success: function(aItems) {
							aItems[iRow].firePress();
						},
						errorMessage: "Did not find the ColumnListItem"
					});
				},
				errorMessage: "Did not find the table"
			});
		},

		/**
		 * Toggles the 'Show more per column'/'Show less per column' button
		 *
		 * @param {string} sTableId Id of the SmartTable
		 * @returns {Promise} OPA waitFor
		 */
		iToggleShowMorePerColumn: function(sTableId) {
			return this.waitFor({
				id: sTableId + "-btnShowHideDetails",
				controlType: "sap.m.SegmentedButton",
				success: function(oSegmentedButton) {
					if (oSegmentedButton.getSelectedKey() === "hideDetails") {
						oSegmentedButton.setSelectedKey("showDetails");
					} else {
						oSegmentedButton.setSelectedKey("hideDetails");
					}
				},
				errorMessage: "Did not find the button"
			});
		},

		iPressColumnHeader: function(sTableId, sColumnName) {
			return this.waitFor({
				id: sTableId + "-" + sColumnName,
				actions: new Press(),
				errorMessage: "Could not find Column " + sColumnName
			});
		},

		iPressSortPropertyInColumnMenu: function(sPropertyName, sSortOrder) {
			return this.waitFor({
				controlType: "sap.m.ToggleButton",
				searchOpenDialogs: true,
				success: function (aSortButtons) {
					aSortButtons = aSortButtons.filter(function(oButton) {
						const oItem = oButton.getParent().getParent();
						if (!oItem.isA("sap.m.table.columnmenu.QuickSortItem")) {
							return false;
						}
						return oItem.getProperty("key") === sPropertyName;
					});
					if (sSortOrder.toLowerCase() === "ascending") {
						new Press().executeOn(aSortButtons[0]);
					} else {
						new Press().executeOn(aSortButtons[1]);
					}
				},
				errorMessage: "No buttons were found"
			});
		}
	};
});
