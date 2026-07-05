/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/util/reflection/JsControlTreeModifier",
	"sap/ui/fl/changeHandler/condenser/Classification"
], function(
	JsControlTreeModifier,
	Classification
) {
	"use strict";

	/**
	 * Change handler for revealing a smart form group element.
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.comp.smartform.flexibility.changes.UnhideControl
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.44.0
	 */
	var UnhideControl = { };

	/**
	 * Reveals a smart form group element.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.GroupElement|Element} oGroupElement GroupElement control that matches the change selector for applying the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @return {Promise} Resolves if successfully added
	 * @public
	 */
	UnhideControl.applyChange = function(oChange, oGroupElement, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var bPartiallyVisible;
		var aFields = [];
		return Promise.resolve()
		.then(oModifier.getAggregation.bind(oModifier, oGroupElement, "elements"))
		.then(function (aAggregations) {
			aFields = aAggregations;
			return aFields.reduce(function(previousPromise, oField) {
				return previousPromise.then(function (bVisible) {
					return bVisible || oModifier.getVisible(oField);
				});
			}, Promise.resolve(false));
		})
		.then(function (bIsPartiallyVisible) {
			bPartiallyVisible = bIsPartiallyVisible;
			// if there is a visible field inside the group element, don't set all fields to visible
			if (!bPartiallyVisible) {
				aFields.forEach(function(oField) {
					oModifier.setVisible(oField, true);
				});
			}

			// if there is a label, it needs to be set visible aswell
			return oModifier.getAggregation(oGroupElement, "label");
		})
		.then(function (oLabel) {
			var bVisibleLabel = false;
			if (oLabel && (typeof oLabel !== "string")) {
				oModifier.setVisible(oLabel, true);
				bVisibleLabel = true;
			}
			oModifier.setVisible(oGroupElement, true);

			oChange.setRevertData({
				partiallyVisible: bPartiallyVisible,
				visibleLabel: bVisibleLabel
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
	UnhideControl.completeChangeContent = function(oChangeWrapper, oSpecificChangeInfo) {
	};

	/**
	 * Reverts the applied change
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.GroupElement|Element} oGroupElement GroupElement control that matches the change selector for applying the change
	 * @param {object} mPropertyBag Property bag containing the modifier, the appComponent and the view
	 * @param {object} mPropertyBag.modifier Modifier for the controls
	 * @param {object} mPropertyBag.appComponent Component in which the change should be applied
	 * @param {object} mPropertyBag.view Application view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	UnhideControl.revertChange = function(oChange, oGroupElement, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var mRevertData = oChange.getRevertData();

		return Promise.resolve()
		.then(oModifier.getAggregation.bind(oModifier, oGroupElement, "elements"))
		.then(function (aFields) {
			if (!mRevertData.partiallyVisible) {
				aFields.forEach(function(oField) {
					oModifier.setVisible(oField, false);
				});
			}
			if (mRevertData.visibleLabel) {
				return Promise.resolve()
				.then(oModifier.getAggregation.bind(oModifier, oGroupElement, "label"))
				.then(function (oLabel) {
					oModifier.setVisible(oLabel, false);
				});
			}
		})
		.then(function () {
			oModifier.setVisible(oGroupElement, false);
			oChange.resetRevertData();
		});
	};

	UnhideControl.getCondenserInfo = function(oChange) {
		return {
			affectedControl: oChange.getSelector(),
			classification: Classification.Reverse,
			uniqueKey: "visible"
		};
	};

	UnhideControl.getChangeVisualizationInfo = function(oChange, oAppComponent) {
		const oSelector = oChange.getSelector();
		const oElement = JsControlTreeModifier.bySelector(oSelector, oAppComponent);
		const oReturn = {
			updateRequired: true
		};

		// If the element is currently invisible, the indicator should be on its
		// first visible parent (group or form)
		if (!oElement.getVisible()) {
			const oGroup = oElement.getParent();
			if (oGroup.getVisible()) {
				oReturn.displayControls = [oGroup.getId()];
			} else {
				const oForm = oGroup.getParent();
				oReturn.displayControls = [oForm.getId()];
			}
		}

		return oReturn;
	};

	return UnhideControl;
},
/* bExport= */true);
