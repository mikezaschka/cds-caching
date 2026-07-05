/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/util/isEmptyObject",
	"sap/ui/fl/changeHandler/condenser/Classification",
	"sap/ui/fl/changeHandler/HideControl",
	"sap/ui/fl/changeHandler/UnhideControl",
	"sap/ui/mdc/flexibility/Panel.flexibility"
], function(isEmptyObject, CondenserClassification, HideControl, UnhideControl, PanelFlex) {
	"use strict";

	const PROPERTY_NAME = "visible";

	const _completeChangeContentSmartLink = (oChange, mSpecificChangeInfo, mPropertyBag) => {
		if (isEmptyObject(mSpecificChangeInfo.content)) {
			throw new Error("mSpecificChangeInfo.content should be filled");
		}
		if (!mSpecificChangeInfo.content.key) {
			throw new Error("In mSpecificChangeInfo.content.key attribute is required");
		}
		if (mSpecificChangeInfo.changeType === "addLink") {
			if (mSpecificChangeInfo.content.visible !== true) {
				throw new Error("In mSpecificChangeInfo.content.visible attribute should be 'true'");
			}
		} else if (mSpecificChangeInfo.changeType === "removeLink") {
			if (mSpecificChangeInfo.content.visible !== false) {
				throw new Error("In mSpecificChangeInfo.content.visible attribute should be 'false'");
			}
		}

		oChange.setContent(mSpecificChangeInfo.content);
	};

	const _getCondenserInfo = (oChange) => {
		return {
			affectedControl: { id: oChange.getContent().key, idIsLocal: true },
			uniqueKey: PROPERTY_NAME,
			classification: CondenserClassification.Reverse
		};
	};

	return {
		createChanges: function(oPanel, aDeltaMItems) {
			// Create a 'create' change only for items which does not exist
			const aNotExistingItems = aDeltaMItems.filter((oDeltaMItem) => {
				return !Element.getElementById(oDeltaMItem.id);
			});
			// Create a 'create' change only once for an item
			const oNotExistingItemIds = {};
			return aNotExistingItems.reduce((aResult, oDeltaMItem) => {
				if (!oNotExistingItemIds[oDeltaMItem.id]) {
					oNotExistingItemIds[oDeltaMItem.id] = true;
					aResult.push(oDeltaMItem);
				}
				return aResult;
			}, []).map((oDeltaMItem) => {
				return {
					selectorElement: oPanel,
					changeSpecificData: {
						changeType: "addLink",
						content: {
							selector: oDeltaMItem.id
						}
					}
				};
			});
		},
		addLink: {
			layers: {
				USER: true
			},
			changeHandler: {
				applyChange: function(oChange, oPanel, mPropertyBag) {
					const oContent = oChange.getContent();
					oContent.selector ??= {
						id: oContent.key,
						idIsLocal: false
					};
					const oModifier = mPropertyBag.modifier;
					let oItem = oModifier.bySelector(oContent.selector, mPropertyBag.appComponent, mPropertyBag.view);
					if (oItem) {
						UnhideControl.applyChange(oChange, oItem, mPropertyBag);
					} else {
						PanelFlex.createItem.changeHandler.applyChange(oChange, oPanel, mPropertyBag).then(() => {
							oItem = oModifier.bySelector(oContent.key, mPropertyBag.appComponent, mPropertyBag.view);
							UnhideControl.applyChange(oChange, oItem, mPropertyBag);
						});
					}
				},
				revertChange: function(oChange, oPanel, mPropertyBag) {
					const oRevertData = oChange.getRevertData();
					if (oRevertData) { // RevertData is only set in UnhideControl changes
						const oContent = oChange.getContent();
						const oModifier = mPropertyBag.modifier;
						const oItem = oModifier.bySelector(oContent.key, mPropertyBag.appComponent, mPropertyBag.view);
						UnhideControl.revertChange(oChange, oItem, mPropertyBag);
						return;
					}
					PanelFlex.createItem.changeHandler.revertChange(oChange, oPanel, mPropertyBag);
				},
				completeChangeContent: function(oChange, mSpecificChangeInfo, mPropertyBag) {
					_completeChangeContentSmartLink(oChange, mSpecificChangeInfo, mPropertyBag);
				},
				getCondenserInfo: _getCondenserInfo
			}
		},
		removeLink: {
			layers: {
				USER: true
			},
			changeHandler: {
				applyChange: function(oChange, oPanel, mPropertyBag) {
					const oContent = oChange.getContent();
					const oModifier = mPropertyBag.modifier;
					const oItem = oModifier.bySelector(oContent.key, mPropertyBag.appComponent, mPropertyBag.view);
					HideControl.applyChange(oChange, oItem, mPropertyBag);
				},
				revertChange: function(oChange, oPanel, mPropertyBag) {
					const oContent = oChange.getContent();
					const oModifier = mPropertyBag.modifier;
					const oItem = oModifier.bySelector(oContent.key, mPropertyBag.appComponent, mPropertyBag.view);
					if (oItem) {
						HideControl.revertChange(oChange, oItem, mPropertyBag);
					}
				},
				completeChangeContent: function(oChange, mSpecificChangeInfo, mPropertyBag) {
					_completeChangeContentSmartLink(oChange, mSpecificChangeInfo, mPropertyBag);
				},
				getCondenserInfo: _getCondenserInfo
			}
		}
	};
},
/* bExport= */true);
