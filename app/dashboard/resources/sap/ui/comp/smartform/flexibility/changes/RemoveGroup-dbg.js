/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Change handler for removing a smart form group.
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.fl.changeHandler.RemoveGroup
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.27.0
	 */
	var RemoveGroup = { };

	/**
	 * Removes a smart form group
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.Group|Element} oGroup Group control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Map of properties
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
	 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
	 * @return {Promise} Resolves if successfully added
	 * @public
	 */
	RemoveGroup.applyChange = function(oChange, oGroup, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oView = mPropertyBag.view;

		var oForm = oModifier.getParent(oGroup);
		var sAggregationName;
		var iGroupIndex;
		return Promise.resolve()
		.then(oModifier.findIndexInParentAggregation(oGroup))
		.then(function (iIndexInParentAggregation) {
			iGroupIndex = iIndexInParentAggregation;
			if (oModifier.getControlType(oForm) === "sap.ui.layout.form.Form") {
				sAggregationName = "formContainers";
				return oModifier.removeAggregation(oForm, "formContainers", oGroup, oView);
			}
			sAggregationName = "groups";
			return oModifier.removeAggregation(oForm, "groups", oGroup, oView);
		})
		.then(oModifier.insertAggregation.bind(oModifier, oForm, "dependents", oGroup, 0, oView))
		.then(function () {
			oChange.setRevertData({
				groupIndex: iGroupIndex,
				aggregation: sAggregationName
			});
		});
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChangeWrapper change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
	 * @public
	 */
	RemoveGroup.completeChangeContent = function(oChangeWrapper, oSpecificChangeInfo) {
	};

	/**
	 * Reverts the applied change
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.Group|Element} oGroup Group control that matches the change selector for applying the change
	 * @param {object} mPropertyBag Property bag containing the modifier, the appComponent and the view
	 * @param {object} mPropertyBag.modifier Modifier for the controls
	 * @param {object} mPropertyBag.appComponent Component in which the change should be applied
	 * @param {object} mPropertyBag.view Application view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	RemoveGroup.revertChange = function(oChange, oGroup, mPropertyBag) {
		var oView = mPropertyBag.view;
		var oModifier = mPropertyBag.modifier;
		var mRevertData = oChange.getRevertData();

		var oForm = oModifier.getParent(oGroup);
		return Promise.resolve()
		.then(oModifier.removeAggregation.bind(oModifier, oForm, "dependents", oGroup))
		.then(oModifier.insertAggregation.bind(oModifier, oForm, mRevertData.aggregation, oGroup, mRevertData.groupIndex, oView))
		.then(oChange.resetRevertData.bind(oChange));
	};

	return RemoveGroup;
},
/* bExport= */true);