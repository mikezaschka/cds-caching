/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/util/isEmptyObject", "sap/base/Log", "sap/ui/fl/changeHandler/condenser/Classification"
], function(isEmptyObject, Log, CondenserClassification) {
	"use strict";

	/**
	 * Change handler for adding a smart form group element (representing a field).
	 *
	 * @constructor
	 * @private
	 * @since 1.44.0
	 * @alias sap.ui.comp.navpopover.flexibility.LinkFlex
	 * @deprecated as of version 1.121
	 */
	var LinkFlex = {};

	var PROPERTY_NAME = "visible";

	/**
	 * Adds a smart form group element incl. a value control.
	 *
	 * @param {sap.ui.fl.Change} oChange
	 * @param {sap.ui.comp.navpopover.NavigationContainer} oNavigationContainer
	 * @param {object} mPropertyBag
	 * @private
	 */
	 LinkFlex.applyChange = function(oChange, oNavigationContainer, mPropertyBag) {
		var oChangeContent = oChange.getContent();
		if (isEmptyObject(oChangeContent)) {
			Log.error("Change does not contain sufficient information to be applied");
			return Promise.reject("Change does not contain sufficient information to be applied");
		}

		var oAvailableAction = oNavigationContainer.getAvailableActions().find(function(oLinkData) {
			return oLinkData.getKey() === oChangeContent.key;
		});
		if (!oAvailableAction) {
			Log.error("Item with key " + oChangeContent.key + " not found in the availableAction aggregation");
			return Promise.reject("Item with key " + oChangeContent.key + " not found in the availableAction aggregation");
		}

		var oModifier = mPropertyBag.modifier;

		return Promise.resolve()
			.then(oModifier.getProperty.bind(oModifier, oAvailableAction, PROPERTY_NAME))
			.then(function(bOriginalValue) {
				// Update the value of 'availableActions' aggregation
				oModifier.setProperty(oAvailableAction, "visibleChangedByUser", oChange.getLayer() === "USER");
				oModifier.setVisible(oAvailableAction, oChangeContent.visible);
				oChange.setRevertData({
					key: oChangeContent.key,
					originalValue: bOriginalValue
				});
			});
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo
	 * @param {object} mPropertyBag
	 * @private
	 */
	LinkFlex.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		if (isEmptyObject(oSpecificChangeInfo.content)) {
			throw new Error("oSpecificChangeInfo.content should be filled");
		}
		if (!oSpecificChangeInfo.content.key) {
			throw new Error("In oSpecificChangeInfo.content.key attribute is required");
		}
		if (oSpecificChangeInfo.changeType === "addLink") {
			if (oSpecificChangeInfo.content.visible !== true) {
				throw new Error("In oSpecificChangeInfo.content.visible attribute should be 'true'");
			}
		} else if (oSpecificChangeInfo.changeType === "removeLink") {
			if (oSpecificChangeInfo.content.visible !== false) {
				throw new Error("In oSpecificChangeInfo.content.visible attribute should be 'false'");
			}
		}


		oChange.setContent(oSpecificChangeInfo.content);
	};

	LinkFlex.revertChange = function(oChange, oNavigationContainer, mPropertyBag) {
		var oChangeContent = oChange.getContent();
		if (isEmptyObject(oChangeContent)) {
			Log.error("Change does not contain sufficient information to be applied");
			return false;
		}

		var oAvailableAction = oNavigationContainer.getAvailableActions().find(function(oLinkData) {
			return oLinkData.getKey() === oChangeContent.key;
		});
		if (!oAvailableAction) {
			Log.error("Item with key " + oChangeContent.key + " not found in the availableAction aggregation");
			return false;
		}

		var mRevertData = oChange.getRevertData();
		if (mRevertData) {
			// Update the value of 'availableActions' aggregation
			mPropertyBag.modifier.setProperty(oAvailableAction, "visibleChangedByUser", oChange.getLayer() === "USER");
			mPropertyBag.modifier.setVisible(oAvailableAction, mRevertData.originalValue);
			oChange.resetRevertData();
		} else {
			Log.error("Attempt to revert an unapplied change.");
		}
	};

	LinkFlex.getCondenserInfo = function(oChange) {
		return {
			affectedControl: { id: oChange.getContent().key, idIsLocal: true },
			uniqueKey: PROPERTY_NAME,
			classification: CondenserClassification.Reverse
		};
	};

	return LinkFlex;
},
/* bExport= */true);
