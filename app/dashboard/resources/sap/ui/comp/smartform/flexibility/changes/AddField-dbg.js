/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/fl/changeHandler/Base",
	"sap/ui/core/util/reflection/JsControlTreeModifier",
	"sap/ui/comp/smartform/flexibility/changes/AddFields"
], function(
	Base,
	JsControlTreeModifier,
	AddFields
) {
	"use strict";

	/**
	 * Change handler for adding a smart form group element (representing a field).
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.AddField
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.27.0
	 */
	var AddField = {};

	/**
	 * Adds a smart form group element incl. a value control
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.Group|Element} oGroup Group control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
	 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
	 * @return {Promise} Resolves if successfully added
	 * @public
	 */
	AddField.applyChange = function(oChange, oGroup, mPropertyBag) {
		var oTexts = oChange.getTexts();
		var oContent = oChange.getContent();

		var fnCheckChangeDefinition = function() {
			var bMandatoryTextsArePresent = oTexts && oTexts.fieldLabel && oTexts.fieldLabel.value;
			var bContentPresent = oContent;
			var bMandatoryContentPresent = false;

			if (bContentPresent) {
				bMandatoryContentPresent = oContent.field && (oContent.field.selector || oContent.field.id) &&
					oContent.field.jsType && oContent.field.value && oContent.field.valueProperty;
			}

			return  bMandatoryTextsArePresent && bContentPresent && bMandatoryContentPresent;
		};

		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;


		if (fnCheckChangeDefinition()) {
			var oFieldSelector = oContent.field.selector;
			var sFieldId = oContent.field.id;
			var sLabelText = oTexts.fieldLabel.value;
			var sJsType = oContent.field.jsType;
			var sPropertyName = oContent.field.valueProperty;
			var oPropertyValue = oContent.field.value;
			var oEntitySet = oContent.field.entitySet;
			var insertIndex = oContent.field.index;

			if (oModifier.bySelector(oFieldSelector || sFieldId, oAppComponent, oView)) {
				return Base.markAsNotApplicable("Control to be created already exists:" + oFieldSelector || sFieldId, true/*async*/);
			}
			return Promise.resolve()
				.then(oModifier.createControl.bind(oModifier, "sap.ui.comp.smartform.GroupElement", oAppComponent, oView, oFieldSelector || sFieldId))
				.then(function (oGroupElement) {
					if (!oFieldSelector) {
						oFieldSelector = oModifier.getSelector(sFieldId, oAppComponent);
					}
					oChange.setRevertData({newFieldSelector: oFieldSelector});

					oModifier.setProperty(oGroupElement, "label", undefined);
					oModifier.setProperty(oGroupElement, "label", sLabelText);

					return Promise.resolve()
						.then(oModifier.insertAggregation.bind(oModifier, oGroup, "groupElements", oGroupElement, insertIndex, oView))
						.then(function () {
							return AddFields.addElementIntoGroupElement(oModifier, oView, oGroupElement, sJsType, sPropertyName, oPropertyValue, oEntitySet, insertIndex, oAppComponent);
						});
				});
		}
		return Promise.resolve();
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo with attributes "fieldLabel", the field label to be included in the change,
	 * 								 "fieldValue", the value for the control that displays the value,
	 * 								 "valueProperty", the control property that holds the field value,
	 * 								 "newControlId", the control ID for the control to be added
	 * 								 and "jsType", the JavaScript control for the field value.
	 * @param {object} mPropertyBag - map of properties
	 * @public
	 */
	AddField.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oAppComponent = mPropertyBag.appComponent;

		if (oSpecificChangeInfo.fieldLabel) {
			oChange.setText("fieldLabel", oSpecificChangeInfo.fieldLabel, "XFLD");
		} else {
			throw new Error("oSpecificChangeInfo.fieldLabel attribute required");
		}
		var oContent = {
			field: {}
		};
		if (oSpecificChangeInfo.fieldValue) {
			oContent.field.value = oSpecificChangeInfo.fieldValue;
		} else {
			throw new Error("oSpecificChangeInfo.fieldValue attribute required");
		}
		if (oSpecificChangeInfo.valueProperty) {
			oContent.field.valueProperty = oSpecificChangeInfo.valueProperty;
		} else {
			throw new Error("oSpecificChangeInfo.valueProperty attribute required");
		}
		if ( oSpecificChangeInfo.newControlId ){
			oContent.field.selector = JsControlTreeModifier.getSelector(oSpecificChangeInfo.newControlId, oAppComponent, {
				index : oSpecificChangeInfo.index
			});
		} else {
			throw new Error("oSpecificChangeInfo.newControlId attribute required");
		}
		if (oSpecificChangeInfo.jsType) {
			oContent.field.jsType = oSpecificChangeInfo.jsType;
		} else {
			throw new Error("oSpecificChangeInfo.jsType attribute required");
		}
		if (oSpecificChangeInfo.index === undefined) {
			throw new Error("oSpecificChangeInfo.index attribute required");
		} else {
			oContent.field.index = oSpecificChangeInfo.index;
		}
		if (oSpecificChangeInfo.entitySet){
			//an optional entity set can be configured
			oContent.field.entitySet = oSpecificChangeInfo.entitySet;
		}

		oChange.setContent(oContent);
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
	AddField.revertChange = function(oChange, oGroup, mPropertyBag) {
		return AddFields.revertChange(oChange, oGroup, mPropertyBag);
	};

	AddField.getChangeVisualizationInfo = function(oChange) {
		return {
			affectedControls: [oChange.getContent().field.selector]
		};
	};

	return AddField;
},
/* bExport= */true);
