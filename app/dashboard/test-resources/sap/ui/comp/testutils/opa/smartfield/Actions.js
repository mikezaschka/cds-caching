sap.ui.define([
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText",
	'sap/ui/test/Opa5',
	"sap/ui/events/KeyCodes",
	"sap/ui/qunit/utils/nextUIUpdate"
], function (
	Press,
	EnterText,
	Opa5,
	KeyCodes,
	nextUIUpdate
) {
	"use strict";

	return {
		/**
		 * Enters text in the <code>SmartField</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sText The text to enter
		 * @param {boolean} bKeepFocus True if we want to keep focus on the field, false otherwise
		 */
		iEnterTextInSmartField: function (sId, sText, bKeepFocus, bClearTextFirst, bPressEnterKey) {
			return this.waitFor({
				id: sId,
				controlType: "sap.ui.comp.smartfield.SmartField",
				matchers: function (oSmartField) {
					var bMatched = false,
						oControl = oSmartField.getFirstInnerControl();

					if (!oControl || oControl && typeof oControl.isA !== "function") {
						return false;
					}

					if (oControl.isA("sap.m.ComboBox")) {
						bMatched = oControl.getItems().length > 0;
					} else {
						bMatched = true;
					}

					return bMatched;
				},
				actions: new EnterText({
					text: sText,
					keepFocus: !!bKeepFocus,
					clearTextFirst: bClearTextFirst,
					pressEnterKey: bPressEnterKey
				})
			});
		},
		/**
		 * Enters a value in the UOM field of the <code>SmartField</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sValue The new value
		 */
		iEnterValueInUomRelatedField: function (sId, sValue) {
			this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oControlUom = oSmartField._getUomControl();
					new EnterText({ text: sValue }).executeOn(oControlUom);
				}
			});
		},
		/**
		 * Toggles edit mode of the UOM field of the <code>SmartField</code>
		 * @param {*} sId The ID of the <code>SmartField</code>
		 * @param {*} bEditable True for edit mode, false for display mode
		 */
		iToggleUomEditMode: function (sId, bEditable) {
			this.waitFor({
				id: sId,
				success: function (oSmartField) {
					oSmartField.setUomEditable(bEditable);
				}
			});
		},
		/**
		 * Sets a value to a <code>SmartField</code> property
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sProperty The property to change
		 * @param {object} oValue The new value of <code>sProperty</code>
		 */
		iSetSmartFieldControlProperty: function (sId, sProperty, oValue) {
			this.waitFor({
				id: sId,
				success: function (oControl) {
					var oPropertyInfo = oControl.getMetadata().getPropertyLikeSetting(sProperty);

					oControl[oPropertyInfo._sMutator](oValue);
				}
			});
		},
		/**
		 * Sets a value to a <code>SmartForm</code> property
		 * @param {string} sId The ID of the <code>SmartForm</code>
		 * @param {string} sProperty The property to change
		 * @param {object} oValue The new value of <code>sProperty</code>
		 */
		iSetSmartFormControlProperty: function (sId, sProperty, oValue) {
			this.waitFor({
				id: sId,
				success: function (oControl) {
					var oPropertyInfo = oControl.getMetadata().getPropertyLikeSetting(sProperty);

					oControl[oPropertyInfo._sMutator](oValue);
				}
			});
		},
		/**
		 * Toggles edit mode of <code>SmartForm</code>
		 * @param {*} sId The ID of the <code>SmartForm</code>
		 */
		iToggleSmartFormEditMode: function (sId) {
			this.waitFor({
				id: sId,
				success: function (oSmartForm) {
					var bEditable = oSmartForm.getEditable();
					oSmartForm.setEditable(!bEditable);
				}
			});
		},
		/**
		 * Changes properties of the <code>SmartField</code> first inner control
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {object} oProperties The properties to change
		 */
		iSetSmartFieldInnerControlProperties: function (sId, oProperties) {
			return this.waitFor({
				id: sId,
				success: async function (oControl) {
					var sProperty, vValue, oPropertyInfo, oInnerControl = oControl.getFirstInnerControl();
					for (sProperty in oProperties) {
						vValue = oProperties[sProperty];
						oPropertyInfo = oInnerControl.getMetadata().getPropertyLikeSetting(sProperty);
						oInnerControl[oPropertyInfo._sMutator](vValue);
					}

					await nextUIUpdate(); // to render
				}
			});
		},
		/**
		 * Selects the first item of a <code>SmartField</code> displayed by a select list
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iSelectSmartFieldFirstDropdownItem: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oInnerControl = oSmartField.getFirstInnerControl();
					this.waitFor({
						id: oInnerControl.getPicker().getId(),
						searchOpenDialogs: true,
						success: function (oPopup) {
							var oList = oPopup.getContent()[0];
							var oFirstItem = oList.getItems()[0];
							new Press().executeOn(oFirstItem);
						}
					});
				}
			});
		},
		/**
		 * Selects the first item of a <code>SmartField</code> displayed as sap.m.Select
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iSelectSmartFieldFirstDropdownItemForSelect: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oInnerControl = oSmartField.getFirstInnerControl();
					this.waitFor({
						id: oInnerControl.getPicker().getId(),
						searchOpenDialogs: true,
						success: function (oPopup) {
							var oList = oPopup.getContent()[0].getFlexContent()[0],
								oFirstItem = oList.getItems()[0];
							new Press().executeOn(oFirstItem);
						}
					});
				}
			});
		},
		/**
		 * Selects item of <code>SmartField</code> by key
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sKey The key of the item
		 */
		iSelectSmartFieldItemByKey: function (sId, sKey) {
			return this.waitFor({
				id: sId,
				success: function (oControl) {
					var i,
						aItems,
						oItem,
						oInnerControl = oControl.getFirstInnerControl();

					if (oInnerControl.isA("sap.m.ComboBox")) {
						oInnerControl.open();
						aItems = oInnerControl.getItems();
						for (i = 0; i < aItems.length; i++) {
							oItem = aItems[i];
							if (oItem.getKey() === sKey) {
								oInnerControl.setSelectedItem(oItem);
								oInnerControl.fireChange();
								break;
							}
						}
						oInnerControl.close();
					}
				}
			});
		},
		/**
		 * Checks the <code>SmartField</code> displayed by a checkbox
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iCheckSmartFieldItem: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oControl = oSmartField.getFirstInnerControl();
					if (oControl.isA("sap.m.CheckBox") && !oControl.getSelected()) {
						new Press().executeOn(oControl);
					}
				}
			});
		},
		/**
		 * Unchecks the <code>SmartField</code> displayed by a checkbox
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iUncheckSmartFieldItem: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oControl = oSmartField.getFirstInnerControl();
					if (oControl.isA("sap.m.CheckBox") && oControl.getSelected()) {
						new Press().executeOn(oControl);
					}
				}
			});
		},
		/**
		 * Opens the suggestions popup of a <code>SmartField</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iOpenSuggestionsForSmartField: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					if (oSmartField.getShowSuggestion()) {
						new Press().executeOn(oSmartField.getFirstInnerControl());
					}
				}
			});
		},
		iOpenItemsPopover: function (sId) {
			return this.waitFor({
				id: sId,
				controlType: "sap.ui.comp.smartfield.SmartField",
				success: function (oSmartField) {
					var oControl = oSmartField.getFirstInnerControl();
					if (oControl.isA("sap.m.ComboBox")) {
						new Press().executeOn(oControl);
					}
				}
			});
		},
		iSelectsPopoverItemByIndex: function (sId, iIndex, bAdaptedCombo = false) {
			return this.waitFor({
				id: sId,
				controlType: "sap.ui.comp.smartfield.SmartField",
				success: function (oSmartField) {
					var oUtils = Opa5.getUtils(),
						oControl = oSmartField.getFirstInnerControl(),
						oDomRef = oControl.getDomRef();

					if (oDomRef) {
						if (bAdaptedCombo) {
							oUtils.triggerKeydown(oDomRef, KeyCodes.ARROW_DOWN);
							oUtils.triggerKeyup(oDomRef, KeyCodes.ARROW_DOWN);
						}

						while (iIndex >= 0) {
							if (bAdaptedCombo) {
								oUtils.triggerKeydown(oDomRef, KeyCodes.ARROW_UP);
								oUtils.triggerKeyup(oDomRef, KeyCodes.ARROW_UP);
							} else {
								oUtils.triggerKeydown(oDomRef, KeyCodes.ARROW_DOWN);
								oUtils.triggerKeyup(oDomRef, KeyCodes.ARROW_DOWN);
							}
							if (iIndex === 0) {
								oUtils.triggerKeydown(oDomRef, KeyCodes.ENTER);
								oUtils.triggerKeyup(oDomRef, KeyCodes.ENTER);
							}

							iIndex--;
						}
					}
				}
			});
		},
		iSelectAnItemFromTheSuggest: function (iIndex) {
			return this.waitFor({
				controlType: "sap.m.ColumnListItem",
				searchOpenDialogs: true,
				success: function (aColumns) {
					new Press().executeOn(aColumns[iIndex]);
				}
			});
		},
		iSelectAnItemFromSuggestions: function (sID, iIndex) {
			return this.waitFor({
				id: sID,
				success: function () {
					this.iOpenSuggestionsForSmartField(sID);
					this.iSelectAnItemFromTheSuggest(iIndex);
				}
			});
		},
		/**
		 * Disables the <code>SmartField</code> time picker mask
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iDisableSmartFieldTimePickerMask: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oControl) {
					var oTimePicker = oControl.getFirstInnerControl();
					oTimePicker.setMaskMode("Off");
				}
			});
		},
		/**
		 * Disables the <code>SmartField</code> time picker mask
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {boolean} bForce True if we want to force the update of the control values
		 */
		iRefreshDataModel: function (sId, bForce) {
			return this.waitFor({
				id: sId,
				success: function (oControl) {
					bForce = bForce === undefined ? false : bForce;
					oControl.getModel().refresh(bForce);
				}
			});
		}
	};
});
