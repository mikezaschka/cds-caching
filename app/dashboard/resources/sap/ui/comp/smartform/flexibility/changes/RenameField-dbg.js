/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/fl/changeHandler/BaseRename",
	"sap/base/Log",
	"sap/ui/core/util/reflection/JsControlTreeModifier"
], function(
	BaseRename,
	Log,
	JsControlTreeModifier
) {
	"use strict";

	var PROPERTY_NAME = "label";
	var CHANGE_PROPERTY_NAME = "fieldLabel";
	var TT_TYPE = "XFLD";

	/**
	 * Change handler for renaming a smart form group element.
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameField
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.27.0
	 */
	var RenameField = BaseRename.createRenameChangeHandler({
		changePropertyName : CHANGE_PROPERTY_NAME,
		translationTextType : TT_TYPE
	});

	/**
	 * Renames a SmartField.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for applying the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	RenameField.applyChange = function(oChange, oControl, mPropertyBag) {
		var sValue = oChange.getText(CHANGE_PROPERTY_NAME);

		if (typeof sValue === "string") {
			return this.setLabelPropertyOnControl(oControl, sValue, mPropertyBag.modifier, PROPERTY_NAME)
			.then(function (vOldValue) {
				oChange.setRevertData(vOldValue);
			});
		}
		return Promise.resolve();
	};

	/**
	 * Reverts a rename change on a SmartField.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object applied on the control
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for reverting the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be reverted
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	RenameField.revertChange = function(oChange, oControl, mPropertyBag) {
		var vOldValue = oChange.getRevertData();

		if (vOldValue || vOldValue === "") {
			if (vOldValue === "$$Handled_Internally$$") {
				vOldValue = undefined;
			}

			return this.setLabelPropertyOnControl(oControl, vOldValue, mPropertyBag.modifier, PROPERTY_NAME)
			.then(function () {
				oChange.resetRevertData();
			});
		}
		Log.error("Change doesn't contain sufficient information to be reverted. Most Likely the Change didn't go through applyChange.");
		return Promise.resolve();
	};

	/**
	 * Sets label property on a passed GroupElement.
	 * If this logic changes, also adapt the CombineFields change handler!
	 *
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for reverting the change
	 * @param {string} sValue - Value that needs to be set
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} oModifier - modifier for the controls
	 * @param {string} sPropertyName - Label property name
	 * @returns {Promise<string>} sPrevious - Previously set value wrapped in a Promise
	 * @private
	 */
	RenameField.setLabelPropertyOnControl = function(oControl, sValue, oModifier, sPropertyName) {
		return Promise.resolve()
		.then(oModifier.getProperty.bind(oModifier, oControl, sPropertyName))
		.then(function (vLabel) {
			// label can also be a control
			if (vLabel && (typeof vLabel !== "string")) {
				sPropertyName = "text";
				oControl = vLabel;
			}
		})
		.then(oModifier.getPropertyBindingOrProperty.bind(oModifier, oControl, sPropertyName))
		.then(function (vOldValue) {
			oModifier.setPropertyBindingOrProperty(oControl, sPropertyName, sValue);
			return vOldValue || "$$Handled_Internally$$";
		});
	};

	/**
	 * Retrieves the information required for the change visualization.
	 *
	 * @param {sap.ui.fl.Change} oChange - Object with change data
	 * @returns {object} Object with a payload containing the information required for the change visualization
	 * @public
	 */
	 RenameField.getChangeVisualizationInfo = function(oChange, oAppComponent) {
		var oNewLabel = oChange.getText(CHANGE_PROPERTY_NAME),
			vOldLabel = oChange.getRevertData(),
			oSelector,
			oElement,
			sDataSourceLabel;

		// The previous label is not saved because it is defined by the control based on binding
		if (vOldLabel === "$$Handled_Internally$$") {
			vOldLabel = undefined; // In case we can't retrieve label from data source

			oSelector = oChange.getSelector();
			oElement = JsControlTreeModifier.bySelector(oSelector, oAppComponent);

			if (oElement.isA("sap.ui.comp.smartform.GroupElement")) {
				sDataSourceLabel = oElement.getDataSourceLabel();
				if (sDataSourceLabel) {
					// Note: This label is currently retrieved from the data source and it might be different when the
					// ui change was initially created.
					vOldLabel = sDataSourceLabel;
				}
			}
		}
		return {
			descriptionPayload: {
				originalLabel: vOldLabel,
				newLabel: oNewLabel
			}
		};
	};

	return RenameField;
},
/* bExport= */true);
