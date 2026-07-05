sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/comp/smartfield/ODataControlFactory"
], function (Opa5, ODataControlFactory) {
    "use strict";

    return {
		/**
		 * Checks that the <code>SmartField</code> is not in busy state
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
        iCheckSmartFieldIsNotBusy: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					Opa5.assert.strictEqual(
						oSmartField.getFirstInnerControl().getBusy(),
						false,
						"Inner control should not be in a busy state"
					);
				}
			});
		},
		/**
		 * Checks if <code>SmartField</code> property has certain value
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sProperty The property
		 * @param {object} oValue The value to check for
		 */
		iCheckSmartFieldProperyHasValue: function (sId, sProperty, oValue) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oPropertyInfo = oSmartField.getMetadata().getPropertyLikeSetting(sProperty);
					Opa5.assert.strictEqual(
						oSmartField[oPropertyInfo._sGetter](),
						oValue,
						"SmartField has right value"
					);
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> is visible and has value
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {object} oValue The value to check for
		 */
        iShouldSeeSmartFieldWithIdAndValue: function (sId, oValue) {
            return this.waitFor({
				id: sId,
				controlType: "sap.ui.comp.smartfield.SmartField",
				success: function (oSmartField) {
					let vCurrentValue = oSmartField.getValue();
					if (typeof vCurrentValue === "string") {
						// Normalize spaces for comparison to make test independent from future CLDR data changes
						vCurrentValue = vCurrentValue.replace(/\s/g, " ");
						oValue = oValue.replace(/\s/g, " ");
					}
					Opa5.assert.equal(vCurrentValue, oValue, "The SmartField with the id " + sId + " contains the correct value!");
				},
				errorMessage: "Could not find SmartField with id " + sId
			});
		},
		/**
		 * Checks that the <code>SmartField</code> is visible and has a binding value
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {object} oValue The value of the <code>SmartField</code> binding value
		 */
        iShouldSeeSmartFieldWithIdAndBindingValue: function (sId, oValue){
            return this.waitFor({
				id: sId,
				controlType: "sap.ui.comp.smartfield.SmartField",
				success: function (oSmartField) {
					Opa5.assert.equal(oSmartField.getBinding("value").getValue(), oValue, "The Binding of the SmartField with the id " + sId + " contains the correct value!");
				},
				errorMessage: "Could not find SmartField with id " + sId
			});
		},
		/**
		 * Checks that the <code>SmartField</code> value is equal to <code>oValue</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {object} oValue The value to check for
		 */
        iShouldSeeSmartFieldWithIdAndDateTimeValue: function (sId, oValue){
            return this.waitFor({
				id: sId,
				controlType: "sap.ui.comp.smartfield.SmartField",
				success: function (oSmartField) {
					Opa5.assert.equal(oSmartField.getFirstInnerControl().getDateValue().toString(), oValue, "The SmartField with the id " + sId + " contains the correct value!");
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> is in particular <code>ValueState</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {object} oState The <code>ValueState</code>
		 */
        iShouldSeeSmartFieldWithValueState: function(sId, oState){
            return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					Opa5.assert.equal(oSmartField.getValueState(), oState, "The SmartField with the id " + sId + " has correct value state " + oState + "!");
					Opa5.assert.equal(oSmartField.getFirstInnerControl().getValueState(), oState, "The inner control of SmartField with the id " + sId + " has correct value state " + oState + "!");
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> is in particular <code>ValueState</code> with specified error
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {object} oState The <code>ValueState</code>
		 * @param {object} oStateError The <code>ValueState</code> error
		 */
		iShouldSeeSmartFieldWithValueStateError: function(sId, oState, sError){
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					Opa5.assert.equal(oSmartField.getValueState(), oState, "The SmartField with the id " + sId + " has correct value state " + oState + "!");
					Opa5.assert.equal(oSmartField.getFirstInnerControl().getValueState(), oState, "The inner control of SmartField with the id " + sId + " has correct value state " + oState + "!");
					Opa5.assert.equal(oSmartField.getFirstInnerControl().getValueStateText(), sError, "The inner control of SmartField with the id " + sId + " has correct value state " + sError + "!");
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> has a particular <code>ValueState</code> text
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sText The <code>ValueState</code> text
		 */
        iShouldSeeSmartFieldWithValueStateText: function (sId, sText) {
                return this.waitFor({
					id: sId,
					success: function (oSmartField) {
						// Normalize spaces for comparison to make test independent from future CLDR data changes
						Opa5.assert.equal(oSmartField.getFirstInnerControl().getValueStateText().replace(/\s/g, " "), sText.replace(/\s/g, " "), "The Field with the id " + sId + " has correct value state text!");
					}
				});
		},
		/**
		 * Checks that the <code>SmartField</code> popup items count is equal to <code>nItemsCount</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {number} nItemsCount The count of popup items
		 */
        iShouldSeeSmartFiledPopupFiltered: function( sId, nItemsCount ){
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var nSuggestionsCount = oSmartField.getFirstInnerControl().getPicker().getContent()[0].getItems().length;
					Opa5.assert.equal(nSuggestionsCount, nItemsCount, "The Popup list with the id " + sId + " contains the correct number of Items");
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> popup items count is equal to <code>nItemsCount</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {number} nItemsCount The count of popup items
		 */
        iShouldSeeSmartFiledSelectPopupFiltered: function( sId, nItemsCount ){
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var nSuggestionsCount = oSmartField.getFirstInnerControl().getPicker().getContent()[0].getFlexContent()[0].getItems().length;
					Opa5.assert.equal(nSuggestionsCount, nItemsCount, "The Popup list with the id " + sId + " contains the correct number of Items");
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> popup item has title equal to <code>sTitle</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {number} nIndex The index of popup item
		 * @param {string} sTitle The title to check for
		 */
		iShouldSeeSmartFieldPopupItemWithTitle: function(sId, nIndex, sTitle ){
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var nSuggestionsItemTitle = oSmartField.getFirstInnerControl().getPicker().getContent()[0].getItems()[nIndex].getTitle();
					Opa5.assert.strictEqual(nSuggestionsItemTitle, sTitle, "The Popup list with the id " + sId + " contains the correct item with title");
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> suggestions popup item has text equal to <code>sText</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {number} nIndex The index of popup item
		 * @param {string} sText The text to check for
		 */
		iShouldSeeSmartFieldSuggestionItemWithText: function(sId, nIndex, sText){
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					if (!oSmartField.getFirstInnerControl()._oSuggestionPopup.isOpen()) {
						oSmartField.getFirstInnerControl()._openSuggestionPopup(true);
					}
					return this.waitFor({
						controlType: "sap.m.ColumnListItem",
						searchOpenDialogs: true,
						success: function (aColumns) {
							var sItemText = aColumns[nIndex].mAggregations.cells[0].getText();
							Opa5.assert.strictEqual(sItemText, sText, "The Suggestions Popup list with the id " + sId + " contains the correct item with text");
						}
					});
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> has an empty indicator
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
		iShouldSeeSmartFieldWithEmptyIndicator: function (sId) {
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					var oReferenceNode = oSmartField.getDomRef(),
						oInnerControl = oSmartField.getFirstInnerControl();

					if (oInnerControl.getMetadata().hasProperty("emptyIndicatorMode")) {
						Opa5.assert.equal(oInnerControl.getEmptyIndicatorMode(), "On", "Base control hase implemented emptyIndicatorMode and it is On");
					} else if (oInnerControl !== null && (oInnerControl.isA("sap.m.Text") || oInnerControl.isA("sap.m.ObjectStatus"))) {
							var oScreenReaderEmptyFieldIndicator = oReferenceNode.children[0];
							if (oScreenReaderEmptyFieldIndicator.children.length === 2 && oInnerControl.isA("sap.m.Text")) {
								var oUIEmptyFieldIndicator = oScreenReaderEmptyFieldIndicator.children[0].children[0].children[0],
									oUIEmptyFieldIndicatorHiddenAttribute = oUIEmptyFieldIndicator && oUIEmptyFieldIndicator.children[0],
									oUIEmptyFieldIndicatorInvisibleText = oUIEmptyFieldIndicator && oUIEmptyFieldIndicator.children[1];
							} else {
								var oUIEmptyFieldIndicator = oScreenReaderEmptyFieldIndicator.children[0],
									oUIEmptyFieldIndicatorHiddenAttribute = oUIEmptyFieldIndicator && oUIEmptyFieldIndicator.children[0],
									oUIEmptyFieldIndicatorInvisibleText = oUIEmptyFieldIndicator && oUIEmptyFieldIndicator.children[1];
							}

							Opa5.assert.equal(oUIEmptyFieldIndicator.children.length, 2, "The SmartField text has 2 children");
							Opa5.assert.ok(oUIEmptyFieldIndicator.classList.contains("sapMEmptyIndicator"), "The SmartField has a class 'sapMEmptyIndicator'");
							Opa5.assert.ok(oUIEmptyFieldIndicatorHiddenAttribute.getAttribute('aria-hidden') === "true", "The SmartField has a UI indicator for empty fields");
							Opa5.assert.ok(oUIEmptyFieldIndicatorInvisibleText.classList.contains("sapUiPseudoInvisibleText"), "The SmartField has a class 'sapUiPseudoInvisibleText'");
					} else {
						var oScreenReaderEmptyFieldIndicator = oReferenceNode.children[0],
							oUIEmptyFieldIndicator = oReferenceNode.children[1];
						Opa5.assert.ok(oScreenReaderEmptyFieldIndicator.classList.contains("sapUiPseudoInvisibleText"), "The SmartField has a screen reader indicator for empty fields");
						Opa5.assert.ok(oUIEmptyFieldIndicator.classList.contains("sapUiCompEmptyValue") && oUIEmptyFieldIndicator.getAttribute('aria-hidden') === "true", "The SmartField has a UI indicator for empty fields");
					}
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> does not have an empty indicator
		 * @param {string} sId The ID of the <code>SmartField</code>
		 */
        iShouldNotSeeSmartFieldWithEmptyIndicator: function (sId) {
				return this.waitFor({
					id: sId,
					success: function (oSmartField) {
						var oReferenceNode = oSmartField.getDomRef();
						if (oSmartField.getInnerControls()[0] && oSmartField.getInnerControls()[0].isA("sap.m.Text")) {
							var oScreenReaderEmptyFieldIndicator = oReferenceNode.children[0];
							if (oScreenReaderEmptyFieldIndicator.children.length === 2) {
								var oUIEmptyFieldIndicator = oScreenReaderEmptyFieldIndicator.children[0] &&
									oScreenReaderEmptyFieldIndicator.children[0].children[0] &&
									oScreenReaderEmptyFieldIndicator.children[0].children[0].children[0],
									oUIEmptyFieldIndicatorHiddenAttribute = oUIEmptyFieldIndicator ? oUIEmptyFieldIndicator.children[0] : undefined,
									oUIEmptyFieldIndicatorInvisibleText = oUIEmptyFieldIndicator ? oUIEmptyFieldIndicator.children[1] : undefined;
							} else {
								var oUIEmptyFieldIndicator = oScreenReaderEmptyFieldIndicator.children[0],
									oUIEmptyFieldIndicatorHiddenAttribute = oUIEmptyFieldIndicator ? oUIEmptyFieldIndicator.children[0] : undefined,
									oUIEmptyFieldIndicatorInvisibleText = oUIEmptyFieldIndicator ? oUIEmptyFieldIndicator.children[1] : undefined;
							}

							Opa5.assert.notOk(oUIEmptyFieldIndicator && oUIEmptyFieldIndicator.classList.contains("sapMEmptyIndicator"), "The SmartField has NOT a class 'sapMEmptyIndicator'");
							Opa5.assert.notOk(oUIEmptyFieldIndicator && oUIEmptyFieldIndicatorHiddenAttribute && oUIEmptyFieldIndicatorHiddenAttribute.getAttribute('aria-hidden') === "true", "The SmartField has NOT a UI indicator for empty fields");
							Opa5.assert.notOk(oUIEmptyFieldIndicator && oUIEmptyFieldIndicatorInvisibleText && oUIEmptyFieldIndicatorInvisibleText.classList.contains("sapUiPseudoInvisibleText"), "The SmartField has NOT a class 'sapUiPseudoInvisibleText'");
						} else {
							var oScreenReaderEmptyFieldIndicator = oReferenceNode.children[0],
								oUIEmptyFieldIndicator = oReferenceNode.children[1];
							Opa5.assert.notOk(oScreenReaderEmptyFieldIndicator && oScreenReaderEmptyFieldIndicator.classList.contains("sapUiPseudoInvisibleText"), "The SmartField has NOT a screen reader indicator for empty fields");
							Opa5.assert.notOk(oUIEmptyFieldIndicator && oUIEmptyFieldIndicator.classList.contains("sapUiCompEmptyValue") && oUIEmptyFieldIndicator.getAttribute('aria-hidden') === "true", "The SmartField has NOT a UI indicator for empty fields");
						}
					}
				});
		},
		/**
		 * Checks that the <code>SmartField</code> UOM field has a shrink factor <code>nShrinkFactor</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {number} nShrinkFactor The shrink factor
		 */
        iShouldSeeUomFieldWithShrinkFactorOf: function (sId, nShrinkFactor) {
				return this.waitFor({
					id: sId,
					success: function (oSmartField) {
						var oUomField = oSmartField._getUomControl(),
							iFieldShrinkFactor = oUomField.getLayoutData().getShrinkFactor();

						Opa5.assert.ok(iFieldShrinkFactor === nShrinkFactor, "The SmartField's UOM Field has proper shrink factor");
					}
				});
		},
		/**
		 * Checks that the <code>SmartField</code> renders a DOM attribute
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sDomAttribute The DOM attribute name
		 * @param {string} sValue The DOM attribute value
		 */
        iShouldSeeSmartFieldWithDomAttribute: function (sId, sDomAttribute, sValue) {
				return this.waitFor({
					id: sId,
					success: function (oControl) {
						var oInnerControl = oControl.getFirstInnerControl(),
							oInnerControlReferenceNode = oInnerControl.getDomRef();

						Opa5.assert.ok(oInnerControlReferenceNode.getAttribute(sDomAttribute) === sValue);
					}
				});
		},
		/**
		 * Checks that the <code>SmartField</code> does not have a value for DOM attribute with name <code>sDomAttribute</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sDomAttribute The DOM attribute name
		 */
        iShouldSeeSmartFieldWithoutDomAttribute: function (sId, sDomAttribute) {
				return this.waitFor({
					id: sId,
					success: function (oControl) {
						var oInnerControl = oControl.getFirstInnerControl(),
							oInnerControlReferenceNode = oInnerControl.getDomRef();

						Opa5.assert.ok(oInnerControlReferenceNode.getAttribute(sDomAttribute) === null);
					}
				});
		},
		/**
		 * Checks that the <code>SmartField</code> displays a token <code>sTokenText</code> at position <code>nIndex</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sTokenText The token name
		 * @param {number} nIndex The position of the token
		 */
		iCheckFieldContainsTokenAtPosition: function(sId, sTokenText, nIndex){
			return this.waitFor({
				id: sId,
				success: function (oControl) {
					Opa5.assert.equal(oControl.getTokens()[nIndex].getText(), sTokenText,
						"The Field with the id " + sId + " contains the correct token!");
				}
			});
		},
		/**
		 * Checks that the parent <code>GroupElement</code> of the <code>SmartField</code> has CSS display property
		 * @param {string} sGroupId The ID of the <code>Group</code> element that is parent of the <code>GroupElement</code>
		 * @param {string} sFieldId The ID of the <code>SmartField</code>
		 * @param {string} sDisplay The CSS display property that is expected. Could be empty string
		 */
		iShouldSeeGroupElementWithCSSDisplay: function (sGroupId, sFieldId, sDisplay) {
			return this.waitFor({
				id: sGroupId,
				success: function (oGroup) {
					var sCSSDisplay,
						oGroupElement = oGroup.getGroupElements().find(function(oElement) {
							return oElement.getFields()[0].getId() === sFieldId;
						});

						sCSSDisplay = oGroupElement && oGroupElement.getDomRef() && oGroupElement.getDomRef().style.display;

					Opa5.assert.equal(sCSSDisplay, sDisplay, "The GroupElement with the id " + sFieldId + " has correct visibility" );
				}
			});
		},
		/**
		 * Checks that the <code>SmartField</code> is visible and displays a value
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sValue The value to be displayed
		 */
		iShouldSeeSmartFieldWithIdAndInnerControlValue: function (sId, sValue) {
			return this.waitFor({
				id: sId,
				success: function (oField) {
					var sControlValue,
						oInnerControl,
						sControlMetadataName,
						oInnerControlGetter,
						sBoundPropertyNameOfInnerControl;
					// The SmartField getValue is not always returning the value shown to the end-user
					// This is why we try to get the real value from the inner base control
					if (oField.getFirstInnerControl) {
							oInnerControl = oField.getFirstInnerControl();
							sControlMetadataName = oInnerControl.getMetadata().getName();

							if (oInnerControl.isA("sap.m.ComboBox")) {
								oInnerControlGetter = "getValue";
							} else {
								sBoundPropertyNameOfInnerControl = ODataControlFactory.getBoundPropertiesMapInfoForControl(sControlMetadataName, {
									propertyName: "value"
								})[0];
								oInnerControlGetter = "get" + sBoundPropertyNameOfInnerControl[0].toUpperCase() + sBoundPropertyNameOfInnerControl.slice(1);
							}

						sControlValue = oInnerControl[oInnerControlGetter]();
					}

					Opa5.assert.equal(sControlValue, sValue, "The Field with the id " + sId + " contains the correct value!");
				}
			});
		},
		/**
		 * Checks whether the <code>SmartField</code> is in Display or in Edit mode
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sMode The expected Display or Edit mode
		 */
		 iShouldSeeSmartFieldInMode: function (sId, sMode) {
			return this.waitFor({
				id: sId,
				success: function (oControl) {
					Opa5.assert.ok(oControl.getMode() === sMode, "The SmartField is in " + sMode + " mode.");
				}
			});
		},
		/**
		 * Checks if the <code>SmartField</code> first inner control is equal to <code>sControlType</code>
		 * @param {string} sId The ID of the <code>SmartField</code>
		 * @param {string} sControlType SmartField's first inner control type
		 */
		iShouldSeeSmartFieldFirstInnerControlIsA: function(sId, sControlType){
			return this.waitFor({
				id: sId,
				success: function (oSmartField) {
					Opa5.assert.ok(oSmartField.getFirstInnerControl().isA(sControlType), "SmartField's first inner control is a " + sControlType);
				}
			});
		},
		iShouldSeeDialogTitleWithValue: function (sValue) {
            return this.waitFor({
				searchOpenDialogs: true,
				controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
				success: function (oDialog) {
					Opa5.assert.equal(oDialog[0].getTitle(), sValue, "The dialog title is set with correct text value");
				},
				errorMessage: "The dialog title is not correct"
			});
		}
	};
});
