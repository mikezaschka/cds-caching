/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/ui/comp/smartform/flexibility/changes/RenameField"
], function(
	Localization,
	RenameField
) {
	"use strict";

	/**
	 * Change handler for combining smart form group elements (representing one or more fields).
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.comp.smartform.flexibility.changes.CombineFields
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.47.0
	 */
	var CombineFields = { };

	function checkSingleFieldsForMandatoryFlag(oModifier, aSingleFields, mResult) {
		return Promise.all(aSingleFields.map(function (oSingleField) {
			if (!mResult.found) {
				mResult.index++;
				return oModifier.getProperty(oSingleField, "mandatory")
					.then(function (bMandatory) {
						mResult.found = mResult.found || bMandatory;
					});
			}
			return undefined;
		}));
	}

	function evaluateMandatoryFieldIndex(oModifier, aGroupElements) {
		var mResult = {
			found: false,
			index: -1
		};

		return aGroupElements.reduce(function (previousPromise, oGroupElement) {
			return previousPromise
				.then(oModifier.getAggregation.bind(oModifier, oGroupElement, "fields"))
				.then(function (aSingleFields) {
					if (!mResult.found) {
						return checkSingleFieldsForMandatoryFlag(oModifier, aSingleFields, mResult);
					}
					return undefined;
				});
		}, Promise.resolve())

		.then(function () {
			return mResult.found ? mResult.index : -1;
		});
	}

	/**
	 * Gets label property on a passed GroupElement.
	 * If this logic changes, also adapt the CombineFields change handler!
	 *
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for reverting the change
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} oModifier - modifier for the controls
	 * @param {string} sPropertyName - Label property name
	 * @returns {Promise<string>} sPrevious - Previously set value
	 * @private
	 */
	CombineFields._getPreviousLabelPropertyOnControl = function(oControl, oModifier, sPropertyName) {
		return Promise.resolve()
		.then(oModifier.getProperty.bind(oModifier, oControl, sPropertyName))
		.then(function (vLabel) {
			if (vLabel && (typeof vLabel !== "string")) {
				sPropertyName = "text";
				oControl = vLabel;
			}

			return oModifier.getPropertyBindingOrProperty(oControl, sPropertyName);
		})
		.then(function (sPrevious) {
			return sPrevious ? sPrevious : "$$Handled_Internally$$";
		});
	};

	function isNewSourceElementOnCombineRequired(oChangeContent) {
		return !!oChangeContent.newElementId;
	}

	function createNewGroupElement(mPropertyBag, oChangeContent, oParent) {
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;

		if (isNewSourceElementOnCombineRequired(oChangeContent)) {
			return oModifier.getAggregation(oParent, "dependents")
				.then(function (aDependentGroupElements) {
					var oDependentControl = aDependentGroupElements.find(function (oElement) {
						return oModifier.bySelector(oChangeContent.newElementId, oAppComponent, oView);
					});
					if (oDependentControl) {
						return oModifier.removeAggregation(oParent, "dependents", oDependentControl)
							.then(function () {
								return oDependentControl;
							});
					}
					return oModifier.createControl(
						"sap.ui.comp.smartform.GroupElement",
						mPropertyBag.appComponent,
						mPropertyBag.view,
						oChangeContent.newElementId
					);
				});
		}
		// old combine change handler handling, where the sourceControl was not replaced by a new one
		return Promise.resolve(oModifier.bySelector(oChangeContent.sourceSelector, oAppComponent, oView));
	}

	function evaluateNewGroupElementIndex(oParent, oSourceControl, aSelectedGroupElements, oModifier) {
		return oModifier.getAggregation(oParent, "groupElements")
			.then(function (aAllGroupElements) {
				var iControlIndex = aAllGroupElements.indexOf(oSourceControl);
				return aSelectedGroupElements.reduce(function (iAggr, oSelectedElement) {
					var iSelectedElementIndex = aAllGroupElements.indexOf(oSelectedElement);
					if (iSelectedElementIndex > -1 && iSelectedElementIndex < iControlIndex) {
						iAggr = iAggr - 1;
					}
					return iAggr;
				}, iControlIndex);
			});
	}

	function combineSingleFields(oGroupElement, oSourceControl, oModifier, oView, oChangeContent, i, aSingleFields) {
		if (oChangeContent.newElementId || oGroupElement !== oSourceControl) {
			var oParent = oModifier.getParent(oGroupElement);
			return aSingleFields.reduce(function (previousFieldsPromise, oSingleField, k) {
				return previousFieldsPromise
					.then(oModifier.removeAggregation.bind(oModifier, oGroupElement, "elements", oSingleField))
					.then(oModifier.insertAggregation.bind(oModifier, oSourceControl, "elements", oSingleField, i + k, oView));
			}, Promise.resolve())
				.then(oModifier.removeAggregation.bind(oModifier, oParent, "groupElements", oGroupElement))
				// The removed GroupElement must be destroyed when the app is closed, therefore it must be
				// placed in another aggregation (the "dependents" aggregation is invisible)
				.then(oModifier.insertAggregation.bind(oModifier, oParent, "dependents", oGroupElement, 0, oView))
				.then(function () {
					return i + (aSingleFields.length || 0);
				});
		}
		return Promise.resolve(0);
	}

	/**
	 * Combines content from other smart group elements into the selected group element
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oControl smartform control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - map of properties
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @return {Promise} Resolving when fields are combined
	 * @public
	 */
	CombineFields.applyChange = function(oChange, oControl, mPropertyBag) {
		var oChangeContent = oChange.getContent();
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView =  mPropertyBag.view;
		var oSourceControl = oModifier.bySelector(oChangeContent.sourceSelector, oAppComponent, oView);
		var oParent = oModifier.getParent(oSourceControl);
		var aLabelText = [];
		var sPreviousLabel;
		var sText;
		var mRevertData;
		var iSourceControlIndex;

		var aGroupElements = oChangeContent.combineFieldSelectors.map(function (oCombineFieldSelector) {
			return oModifier.bySelector(oCombineFieldSelector, oAppComponent, oView);
		});

		return createNewGroupElement(mPropertyBag, oChangeContent, oParent)
		.then(function (oCreatedGroupElement) {
			if (oCreatedGroupElement) {
				return evaluateNewGroupElementIndex(oParent, oSourceControl, aGroupElements, oModifier)
					.then(function (iIndex) {
						if (iIndex > -1) {
							iSourceControlIndex = iIndex;
							oSourceControl = oCreatedGroupElement;
						}
					})
					.then(this._collectRevertDataForElements.bind(this, oModifier, aGroupElements, oAppComponent, oCreatedGroupElement, oParent));
			}
			return this._collectRevertDataForElements(oModifier, aGroupElements, oAppComponent);
		}.bind(this))
		.then(function (mCollectedData) {
			mRevertData = mCollectedData;

		})
		.then(function () {
			return evaluateMandatoryFieldIndex(oModifier, aGroupElements)
				.then(function (iMandatoryFieldIndex) {
					if (iMandatoryFieldIndex > 0) {
						oModifier.setProperty(oSourceControl, "elementForLabel", iMandatoryFieldIndex);
					}
				});
		})
		.then(function () {
			var bIsRtl = Localization.getRTL();
			var iFieldIndex = 0;
			return aGroupElements.reduce(function (previousPromise, oGroupElement, iIndex) {
				return previousPromise.then(function (iFieldsAdded) {
					iFieldIndex = iFieldIndex + iFieldsAdded;
					var sLabel = "fieldLabel" + iIndex.toString();
					sText = oChange.getText(sLabel);
					if (sText && sText !== sPreviousLabel) {
						if (bIsRtl) {
							aLabelText.unshift(sText);
						} else {
							aLabelText.push(sText);
						}
						sPreviousLabel = sText;
					}

					return oModifier.getAggregation(oGroupElement, "elements");
				})
				.then(function (aSingleFields) {
					return combineSingleFields(
						oGroupElement,
						oSourceControl,
						oModifier,
						oView,
						oChangeContent,
						iFieldIndex,
						aSingleFields
					);
				});
			}, Promise.resolve(0));
		})
		.then(function () {
			// This is effectively a rename on a GroupElement, so the logic has to be as complex as in the rename change handler
			// -> If this logic changes in the rename change handler, adapt here as well! (and vice-versa)
			return RenameField.setLabelPropertyOnControl(oSourceControl, aLabelText.join("/"), oModifier, "label");
		})
		.then(function () {
			if (isNewSourceElementOnCombineRequired(oChangeContent)) {
				return oModifier.insertAggregation(oParent, "groupElements", oSourceControl, iSourceControlIndex, oView);
			}
			return undefined;
		})
		.then(function () {
			oChange.setRevertData(mRevertData);
		});
	};

	CombineFields._collectRevertDataForElements = function(oModifier, aGroupElements, oAppComponent, oCreatedGroupElement, oSourceParent){
		var mRevertData = {
			elementStates : []
		};

		var iFieldIndex = 0;
		var iLastFieldIndex = 0;

		var aRevertRelevantElements = [];
		if (oCreatedGroupElement) {
			aRevertRelevantElements.push(oCreatedGroupElement);
			aRevertRelevantElements = aRevertRelevantElements.concat(aGroupElements);
		}

		return Promise.all(aRevertRelevantElements.map(function (oElement) {
			var oParent = oModifier.getParent(oElement) || oSourceParent;
			return Promise.all([
				oModifier.getAggregation(oElement, "elements"),
				oModifier.getAggregation(oParent, "groupElements"),
				this._getPreviousLabelPropertyOnControl(oElement, oModifier, "label"),
				oModifier.getProperty(oElement, "elementForLabel")
			])
			.then(function (aReturnValues) {
				iLastFieldIndex = iFieldIndex + aReturnValues[0].length - 1;

				// Save the fields' indices because we can't ensure that they will have stable ids
				// GroupElement1 = fields 0 to 1; GroupElement2 = fields 2 to 3; etc...
				mRevertData.elementStates.push({
					groupElementSelector: oModifier.getSelector(oModifier.getId(oElement), oAppComponent),
					parentSelector : oModifier.getSelector(oModifier.getId(oParent), oAppComponent),
					groupElementIndex : aReturnValues[1].indexOf(oElement),
					firstFieldIndex : iFieldIndex,
					lastFieldIndex: iLastFieldIndex,
					label: aReturnValues[2],
					elementForLabel: aReturnValues[3]
				});

				iFieldIndex = iLastFieldIndex + 1;
			});
		}.bind(this)))
		.then(function () {
			return mRevertData;
		});
	};

	/**
	 * Reverts applied change
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.SmartForm} oSmartForm - SmartForm that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Property bag containing the modifier and the view
	 * @param {object} mPropertyBag.modifier - modifier for the controls
	 * @param {object} mPropertyBag.view - application view
	 * @return {Promise} Resolves if successful
	 * @public
	 */
	CombineFields.revertChange = function(oChange, oSmartForm, mPropertyBag){
		var mRevertData = oChange.getRevertData();
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var aFields = [];

		// sort revert data by groupelement index. When the groupelements gets added not in the ascending order
		// of the indizies, then the fields could appear on the wrong position when all fields are added.
		mRevertData.elementStates = mRevertData.elementStates.sort(function (mState1, mState2) {
			return mState1.groupElementIndex - mState2.groupElementIndex;
		});

		return mRevertData.elementStates.reduce(function (previousPromise, mElementState) {
			var oParent = oModifier.bySelector(mElementState.parentSelector, oAppComponent);
			var oGroupElement = oModifier.bySelector(mElementState.groupElementSelector, oAppComponent);
			return previousPromise
				.then(oModifier.getAggregation.bind(oModifier, oParent, "groupElements"))
				.then(function (oAggregation) {
					if (oAggregation.indexOf(oGroupElement) === -1) {
						// Removed group elements are placed in the "dependents" aggregation, so here they must be cleaned up
						return Promise.resolve()
							.then(oModifier.removeAggregation.bind(oModifier, oParent, "dependents", oGroupElement))
							.then(oModifier.insertAggregation.bind(oModifier, oParent, "groupElements", oGroupElement, mElementState.groupElementIndex));
					} else {
						// Collect all fields and remove them from the combined groupelement
						return Promise.resolve()
							.then(oModifier.getAggregation.bind(oModifier, oGroupElement, "elements"))
							.then(function (aReturnedFields) {
								aFields = aReturnedFields;
								return oModifier.removeAllAggregation(oGroupElement, "elements");
							})
							.then(function () {
								if (isNewSourceElementOnCombineRequired(oChange.getContent())) {
									return oModifier.removeAggregation(oParent, "groupElements", oGroupElement)
										.then(oModifier.insertAggregation.bind(oModifier, oParent, "dependents", oGroupElement));
								}
								return undefined;
							});
					}
				});
		}, Promise.resolve())

		.then(function () {
			return mRevertData.elementStates.reduce(function(previousPromise, mElementState) {
				var oGroupElement;
				var sPreviousLabel;
				return previousPromise.then(function () {
					oGroupElement = oModifier.bySelector(mElementState.groupElementSelector, oAppComponent);
					var aInsertAggregationPromises = [];
					for (var i = mElementState.firstFieldIndex; i <= mElementState.lastFieldIndex; i++){
						// add the current field to the end of the aggregation
						aInsertAggregationPromises.push(oModifier.insertAggregation(oGroupElement, "elements", aFields[i], aFields.length));
					}
					return Promise.all(aInsertAggregationPromises);
				})
				.then(function () {
					// Label handling - if originally the label was set by a smartfield, this has to be the case after the revert as well
					// -> Set the label property to "undefined" + set the proper elementForLabel = SmartField will set the label
					sPreviousLabel = mElementState.label;
					if (sPreviousLabel === "$$Handled_Internally$$") {
						sPreviousLabel = undefined;
						return oModifier.getAggregation(oGroupElement, "fields");
					}
					return undefined;
				})
				.then(function (aAggregations) {
					if (aAggregations && aAggregations.length) {
						var oElementForLabel = aAggregations[mElementState.elementForLabel];
						oModifier.setProperty(oElementForLabel, "textLabel", undefined);
					}
					oModifier.setProperty(oGroupElement, "elementForLabel", mElementState.elementForLabel);
					return RenameField.setLabelPropertyOnControl(oGroupElement, sPreviousLabel, oModifier, "label");
				});
			}, Promise.resolve());
		})

		.then(oChange.resetRevertData.bind(oChange));
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo - specific info object
	 * @param {object} oSpecificChangeInfo.combineElementIds - ids of selected fields
	 *  to be combined
	 * @param {object} [oSpecificChangeInfo.newElementId] - stable id of the new element
	 *  that will be created in the changehandler when combine action is executed
	 * @param {object} mPropertyBag - map of properties
	 * @param {object} mPropertyBag.modifier - modifier for the controls
	 *
	 * @public
	 */
	CombineFields.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oView = mPropertyBag.view;
		var oAppComponent = mPropertyBag.appComponent;
		var oContent = {};

		if (oSpecificChangeInfo.newElementId) {
			oContent.newElementId = oSpecificChangeInfo.newElementId;
		}

		var aCombineFieldIds = oSpecificChangeInfo.combineElementIds;
		if (aCombineFieldIds && aCombineFieldIds.length >= 2) {
			oContent.combineFieldSelectors = aCombineFieldIds.map(function(sCombineFieldId) {
				return oModifier.getSelector(sCombineFieldId, oAppComponent);
			});
			oChange.addDependentControl(aCombineFieldIds, "combinedFields", mPropertyBag);
		} else {
			throw new Error("oSpecificChangeInfo.combineElementIds attribute required");
		}

		if (oSpecificChangeInfo.sourceControlId) {
			oContent.sourceSelector = oModifier.getSelector(oSpecificChangeInfo.sourceControlId, oAppComponent);
			oChange.addDependentControl(oSpecificChangeInfo.sourceControlId, "sourceControl", mPropertyBag);
		} else {
			throw new Error("oSpecificChangeInfo.sourceControlId attribute required");
		}

		var sText;
		var sFieldLabel;
		var oGroupElement;
		for (var i = 0; i < oContent.combineFieldSelectors.length; i++) {
			var mSelector = oContent.combineFieldSelectors[i];
			oGroupElement = oModifier.bySelector(mSelector, oAppComponent, oView);
			sText = oGroupElement.getLabelText();
			if (sText) {
				sFieldLabel = "fieldLabel" + i;
				oChange.setText(sFieldLabel, sText, "XFLD");
			}
		}
		oChange.setContent(oContent);
	};

	CombineFields.getChangeVisualizationInfo = function(oChange) {
		var oContent = oChange.getContent();
		return {
			displayControls: [oContent.newElementId],
			affectedControls: [oContent.sourceSelector],
			descriptionPayload: {
				originalSelectors: oContent.combineFieldSelectors
			}
		};
	};

	return CombineFields;
},
/* bExport= */true);
