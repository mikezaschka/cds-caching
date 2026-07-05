/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/util/reflection/JsControlTreeModifier",
	"sap/ui/fl/changeHandler/condenser/Classification"
], function(JsControlTreeModifier, CondenserClassification) {
	"use strict";

	/*
	 * Change handler for adding a smart form group.
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.fl.changeHandler.AddGroup
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.27.0
	 */
	var AddGroup = {};

	/**
	 * Adds a smart form group
	 *
	 * @param {sap.ui.fl.Change} oChange Change object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oForm Smart form control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
	 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
	 * @return {Promise} Resolving when group is added
	 * @public
	 */
	AddGroup.applyChange = function(oChange, oForm, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;
		var oChangeContent = oChange.getContent();
		var oTexts = oChange.getTexts();
		if (oTexts && oTexts.groupLabel && oTexts.groupLabel.value && oChangeContent && oChangeContent.group && (oChangeContent.group.selector || oChangeContent.group.id)) {
			var sLabelText = oTexts.groupLabel.value;
			var iInsertIndex = oChangeContent.group.index;
			var oGroupSelector = oChangeContent.group.selector;
			return Promise.resolve()
				.then(oModifier.createControl.bind(oModifier, "sap.ui.comp.smartform.Group", oAppComponent, oView, oChangeContent.group.selector || oChangeContent.group.id))
				.then(function (oGroup) {
					if (!oGroupSelector) {
						oGroupSelector = oModifier.getSelector(oChangeContent.group.id, oAppComponent);
					}
					oChange.setRevertData({newGroupSelector: oGroupSelector});

					oModifier.setProperty(oGroup, "visible", true);
					oModifier.setProperty(oGroup, "title", sLabelText);
					return oModifier.insertAggregation(oForm, "groups", oGroup, iInsertIndex, oView);
				});
		}
		return Promise.resolve();
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo with attributes "groupLabel", the group label to be included in the change and "newControlId", the control ID for the control to be added
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
	 * @public
	 */
	AddGroup.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oAppComponent = mPropertyBag.appComponent;
		var oContent = {
			group: {}
		};

		if (oSpecificChangeInfo.newLabel) {
			oChange.setText("groupLabel", oSpecificChangeInfo.newLabel, "XFLD");
		} else {
			throw new Error("oSpecificChangeInfo.groupLabel attribute required");
		}

		if (oSpecificChangeInfo.index === undefined) {
			throw new Error("oSpecificChangeInfo.index attribute required");
		} else {
			oContent.group.index = oSpecificChangeInfo.index;
		}

		if ( oSpecificChangeInfo.newControlId ){
			oContent.group.selector = JsControlTreeModifier.getSelector(oSpecificChangeInfo.newControlId, oAppComponent);
		} else {
			throw new Error("oSpecificChangeInfo.newControlId attribute required");
		}

		oChange.setContent(oContent);
	};

	/**
	 * Reverts the applied change
	 *
	 * @param {sap.ui.fl.Change} oChange Change object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oForm Smart form control that matches the change selector for applying the change
	 * @param {object} mPropertyBag Property bag containing the modifier, the appComponent and the view
	 * @param {object} mPropertyBag.modifier Modifier for the controls
	 * @param {object} mPropertyBag.appComponent Component in which the change should be applied
	 * @param {object} mPropertyBag.view Application view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	AddGroup.revertChange = function(oChange, oForm, mPropertyBag) {
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;
		var oModifier = mPropertyBag.modifier;
		var mGroupSelector = oChange.getRevertData().newGroupSelector;

		var oGroup = oModifier.bySelector(mGroupSelector, oAppComponent, oView);
		return Promise.resolve()
			.then(oModifier.removeAggregation.bind(oModifier, oForm, "groups", oGroup))
			.then(function () {
				oModifier.destroy(oGroup);
				oChange.resetRevertData();
			});
	};

	/**
	 * Retrieves the information required for the change visualization.
	 *
	 * @param {sap.ui.fl.Change} oChange - Object with change data
	 * @returns {object} Object with a description payload containing the information required for the change visualization
	 * @public
	 */
	AddGroup.getChangeVisualizationInfo = function(oChange) {
		var sGroupLabel = oChange.getText("groupLabel");
		return {
			affectedControls: [oChange.getContent().group.selector],
			descriptionPayload: { originalLabel: sGroupLabel }
		};
	};

	/**
	 * Retrieves the condenser-specific information.
	 *
	 * @param {object} oChange - Change object with instructions to be applied to the control
	 * @param {object} mPropertyBag - Map of properties
	 * @returns {object} - Condenser-specific information
	 * @public
	 */
	AddGroup.getCondenserInfo = function(oChange, mPropertyBag) {
		const oChangeContent = oChange.getContent();
		const oModifier = mPropertyBag.modifier;
		const oAppComponent = mPropertyBag.appComponent;
		const oView = mPropertyBag.view;
		const oAddedGroup = oModifier.bySelector(oChangeContent.group.selector, oAppComponent, oView);
		const oSmartFormControl = oAddedGroup.getParent().getParent();
		return {
			affectedControl: oChangeContent.group.selector,
			classification: CondenserClassification.Create,
			targetContainer: oSmartFormControl.getId(),
			targetAggregation: "groups",
			setTargetIndex(oChange, iNewTargetIndex) {
				const oChangeContent = oChange.getContent();
				oChangeContent.group.index = iNewTargetIndex;
				oChange.setContent(oChangeContent);
			},
			getTargetIndex(oChange) {
				return oChange.getContent().group.index;
			}
		};
	};

	return AddGroup;
},
/* bExport= */true);
