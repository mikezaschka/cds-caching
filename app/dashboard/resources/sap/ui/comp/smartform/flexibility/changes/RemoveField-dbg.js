/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Change handler for removing a smart form group element.
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.fl.changeHandler.RemoveField
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.27.0
	 */
	var RemoveField = { };

	/**
	 * Removes a smart form group element.
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.GroupElement|Element} oField GroupElement control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Map of properties
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
	 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
	 * @return {Promise} Resolves if successfully added
	 * @public
	 */
	RemoveField.applyChange = function(oChange, oField, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oView = mPropertyBag.view;
		var oGroup = oModifier.getParent(oField);
		if (oGroup) {
			return Promise.resolve()
			.then(oModifier.findIndexInParentAggregation.bind(oModifier, oField))
			.then(function (iFieldIndex) {
				oChange.setRevertData({fieldIndex: iFieldIndex});
				return oModifier.removeAggregation(oGroup, "groupElements", oField, oView);
			});
		}
		return Promise.resolve();
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange Change object to be completed
	 * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
	 * @public
	 */
	RemoveField.completeChangeContent = function(oChange, oSpecificChangeInfo) {
	};

	/**
	 * Reverts the applied change
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.GroupElement|Element} oField GroupElement control that matches the change selector for applying the change
	 * @param {object} mPropertyBag Property bag containing the modifier, the appComponent and the view
	 * @param {object} mPropertyBag.modifier Modifier for the controls
	 * @param {object} mPropertyBag.appComponent Component in which the change should be applied
	 * @param {object} mPropertyBag.view Application view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	RemoveField.revertChange = function(oChange, oField, mPropertyBag) {
		var oView = mPropertyBag.view;
		var oModifier = mPropertyBag.modifier;
		var iFieldIndex = oChange.getRevertData().fieldIndex;

		var oGroup = oModifier.getParent(oField);
		return Promise.resolve()
		.then(oModifier.insertAggregation.bind(oModifier, oGroup, "groupElements", oField, iFieldIndex, oView))
		.then(oChange.resetRevertData.bind(oChange));
	};

	return RemoveField;
},
/* bExport= */true);