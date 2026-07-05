/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/fl/changeHandler/Base",
	"sap/ui/fl/apply/api/DelegateMediatorAPI",
	"sap/ui/core/util/reflection/JsControlTreeModifier",
	"sap/base/util/merge",
	"sap/base/util/ObjectPath",
	"sap/ui/fl/changeHandler/condenser/Classification"
], function(
	Base,
	DelegateMediatorAPI,
	JsControlTreeModifier,
	merge,
	ObjectPath,
	Classification
) {
	"use strict";

	function isFunction(fn) {
		return typeof fn === "function";
	}
	function getNewFieldId(sGroupElementId, iIndex) {
		return sGroupElementId + "-element" + iIndex;
	}
	function checkChangeDefinition(oChangeContent) {
		var bMandatoryContentPresent = false;

		bMandatoryContentPresent = oChangeContent.field
			&& (oChangeContent.field.selector || oChangeContent.field.id)
			&& oChangeContent.field.jsTypes
			&& oChangeContent.field.value
			&& oChangeContent.field.valueProperty;

		if (!bMandatoryContentPresent) {
			throw new Error("Change does not contain sufficient information to be applied.");
		}
	}
	function getDelegateControlForPropertyAndLabel(mDelegatePropertyBag, oDelegate) {
		var mDelegateSettings = merge({}, mDelegatePropertyBag);
		mDelegateSettings.fieldSelector.id = getNewFieldId(mDelegateSettings.fieldSelector.id, 0);
		return oDelegate.createControlForProperty(mDelegateSettings)
			.then(function(mSpecificControlInfo) {
				var sNewFieldId = mDelegatePropertyBag.modifier.getId(mSpecificControlInfo.control);
				mDelegatePropertyBag.labelFor = sNewFieldId;
				return oDelegate.createLabel(mDelegatePropertyBag).then(function(oLabel) {
					return {
						label: oLabel,
						control: mSpecificControlInfo.control
					};
				});
			});
	}

	function getControlsFromDelegate(mDelegate, mPropertyBag) {
		var mDelegatePropertyBag = merge({
			aggregationName: "formElements",
			payload: mDelegate.payload || {}
		}, mPropertyBag);
		var oDelegate = mDelegate.instance;

		return Promise.resolve()
			.then(function() {
				if (isFunction(oDelegate.createLayout)) {
					return oDelegate.createLayout(mDelegatePropertyBag);
				}
			})
			.then(function(mLayoutControlInfo) {
				if (ObjectPath.get("control", mLayoutControlInfo)) {
					mLayoutControlInfo.layoutControl = true;
					return mLayoutControlInfo;
				}
				return getDelegateControlForPropertyAndLabel(mDelegatePropertyBag, oDelegate);
			});
	}

	/**
	 * Change handler for adding a smart form group element (representing one or more fields).
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.fl.changeHandler.AddFields
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.33.0
	 */
	var AddFields = {};

	/**
	 * Adds a smart form group element incl. one or more value controls
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.Group|Element} oGroup Group control or xml element that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
	 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
	 * @return {Promise} Resolving when fields are added
	 * @public
	 */
	AddFields.applyChange = function(oChange, oGroup, mPropertyBag) {
		var mChangeContent = oChange.getContent();
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oFieldSelector = mChangeContent.field.selector;
		var oView = mPropertyBag.view;
		var sFieldId = mChangeContent.field.id;

		if (oModifier.bySelector(oFieldSelector || sFieldId, oAppComponent, oView)) {
			return Base.markAsNotApplicable("Control to be created already exists:" + oFieldSelector || sFieldId, true/*async*/);
		}

		var insertIndex = mChangeContent.field.index;

		var oSmartForm = oChange.getDependentControl("form", mPropertyBag); //recently changes contain the info about the form
		var mDelegateInfo = oSmartForm && oModifier.getFlexDelegate(oSmartForm);
		if (!mDelegateInfo){
			//stay sync for legacy and no-delegate changes
			checkChangeDefinition(mChangeContent);

			var oGroupElement;
			return Promise.resolve()
				.then(oModifier.createControl.bind(oModifier, "sap.ui.comp.smartform.GroupElement", oAppComponent, oView, oFieldSelector || sFieldId))
				.then(function (oCreatedControl) {
					oGroupElement = oCreatedControl;
					if (!oFieldSelector) {
						oFieldSelector = oModifier.getSelector(sFieldId, oAppComponent);
					}
					oChange.setRevertData({newFieldSelector: oFieldSelector});

					return mChangeContent.field.jsTypes.reduce(function (previousPromise, sJsType, iIndex) {
						var sPropertyName = mChangeContent.field.valueProperty[iIndex];
						var oPropertyValue = mChangeContent.field.value[iIndex];
						var oEntitySet = mChangeContent.field.entitySet;
						return previousPromise.then(this.addElementIntoGroupElement.bind(this, oModifier, oView, oGroupElement, sJsType, sPropertyName, oPropertyValue, oEntitySet, iIndex, oAppComponent));
					}.bind(this), Promise.resolve());
				}.bind(this))
				.then(function () {
					return oModifier.insertAggregation(oGroup, "groupElements", oGroupElement, insertIndex);
				});
		}
		//with delegate present we get async
		return AddFields._addFieldFromDelegate(
			oSmartForm,
			oGroup,
			oFieldSelector,
			sFieldId,
			insertIndex,
			mChangeContent.field.value[0],
			oChange,
			oModifier,
			oView,
			oAppComponent
		);
	};

	//smart multiedit is calling it
	AddFields._addFieldFromDelegate = function(oSmartForm, oGroup, oFieldSelector, sFieldId, insertIndex, sBindinPath, oChange, oModifier, oView, oAppComponent) {
		var oGroupElement;
		var mInnerControls;
		return DelegateMediatorAPI.getWriteDelegateForControl({
			control: oSmartForm,
			modifier: oModifier
			//we don't want to get default delegate in the change handler as default case was handled before with smart field
		}).then(function (mDelegate) {
			var mCreateProperties = {
				appComponent: oAppComponent,
				view: oView,
				fieldSelector: oFieldSelector || sFieldId,
				bindingPath: sBindinPath,
				modifier: oModifier,
				element: oSmartForm
			};
			return getControlsFromDelegate(mDelegate, mCreateProperties);
		}).then(function(mControlsFromDelegate) {
			mInnerControls = mControlsFromDelegate;
			// "layoutControl" property is present only when the control is returned from Delegate.createLayout()
			if (!mInnerControls.layoutControl) {
				return Promise.resolve()
				.then(oModifier.createControl.bind(
					oModifier,
					"sap.ui.comp.smartform.GroupElement",
					oAppComponent,
					oView,
					oFieldSelector || sFieldId
				))
				.then(function (oCreatedControl) {
					oGroupElement = oCreatedControl;
					return Promise.resolve()
					.then(oModifier.insertAggregation.bind(oModifier, oGroupElement, "label", mInnerControls.label, 0, oView))
					.then(oModifier.insertAggregation.bind(oModifier, oGroupElement, "fields", mInnerControls.control, 0, oView))
					.then(function () {
						return oGroupElement;
					});
				});
			}
			return mInnerControls.control;
		})
		.then(function (oGroupElement) {
			return oModifier.insertAggregation(
				oGroup,
				"groupElements",
				oGroupElement,
				insertIndex,
				oView
			);
		})
		.then(function () {
			if (mInnerControls.valueHelp) {
				return oModifier.insertAggregation(
					oSmartForm,
					"dependents",
					mInnerControls.valueHelp,
					0,
					oView
				);
			}
		})
		.then(function () {
			if (!oFieldSelector) {
				oFieldSelector = oModifier.getSelector(sFieldId, oAppComponent);
			}
			oChange.setRevertData({
				newFieldSelector: oFieldSelector,
				valueHelpSelector: mInnerControls.valueHelp && oModifier.getSelector(mInnerControls.valueHelp, oAppComponent)
			});
		});
	};

	AddFields.addElementIntoGroupElement = function(oModifier, oView, oGroupElement, sJsType, sPropertyName, oPropertyValue, sEntitySet, iIndex, oAppComponent) {
		var oValueControl;
		var sGroupElementId = oModifier.getId(oGroupElement);
		var sValueControlId = getNewFieldId(sGroupElementId, iIndex);
		return Promise.resolve()
			.then(oModifier.createControl.bind(oModifier, sJsType, oAppComponent, oView, sValueControlId))
			.then(function (oCreatedControl) {
				oValueControl = oCreatedControl;
				oModifier.bindProperty(oValueControl, sPropertyName, oPropertyValue);
				oModifier.setProperty(oValueControl, "expandNavigationProperties", true);

				return oModifier.insertAggregation(oGroupElement, "elements", oValueControl, iIndex, oView, true);
			})
			.then(function () {
				if (sEntitySet) {
					oModifier.setProperty(oValueControl, "entitySet", sEntitySet);
				}
			})
			.catch(function (oError) {
				return Base.markAsNotApplicable(oError && oError.message || "Control couldn't be created", true/*async*/);
			});
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo with attributes "fieldLabel", the field label to be included in the change,
	 *          "fieldValue", the value for the control that displays the value, "valueProperty", the control property
	 *          that holds the field value, "newControlId", the control ID for the control to be added and "jsType", the
	 *          JavaScript control for the field value. Alternative new format is index, label, newControlId and bindingPath,
	 *          which will result in a new SmartField being added and bound.
	 * @param {object} mPropertyBag - Property bag
	 * @public
	 */
	AddFields.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oAppComponent = mPropertyBag.appComponent;
		var oContent = {
			field: {}
		};

		if (oSpecificChangeInfo.fieldValues) {
			oContent.field.value = oSpecificChangeInfo.fieldValues;
		} else if (oSpecificChangeInfo.bindingPath) {
			oContent.field.value = [oSpecificChangeInfo.bindingPath];
		} else {
			throw new Error("oSpecificChangeInfo.fieldValue or bindingPath attribute required");
		}
		if (oSpecificChangeInfo.valueProperty) {
			oContent.field.valueProperty = oSpecificChangeInfo.valueProperty;
		} else if (oSpecificChangeInfo.bindingPath) {
			oContent.field.valueProperty = ["value"];
		} else {
			throw new Error("oSpecificChangeInfo.valueProperty or bindingPath attribute required");
		}
		if (oSpecificChangeInfo.newControlId) {
			oContent.field.selector = JsControlTreeModifier.getSelector(oSpecificChangeInfo.newControlId, oAppComponent);
		} else {
			throw new Error("oSpecificChangeInfo.newControlId attribute required");
		}
		if (oSpecificChangeInfo.jsTypes) {
			oContent.field.jsTypes = oSpecificChangeInfo.jsTypes;
		} else if (oSpecificChangeInfo.bindingPath) {
			oContent.field.jsTypes = ["sap.ui.comp.smartfield.SmartField"];
		} else {
			throw new Error("oSpecificChangeInfo.jsTypes or bindingPath attribute required");
		}
		if (oSpecificChangeInfo.index === undefined) {
			throw new Error("oSpecificChangeInfo.index attribute required");
		} else {
			oContent.field.index = oSpecificChangeInfo.index;
		}
		if (oSpecificChangeInfo.entitySet) {
			// an optional entity set can be configured
			oContent.field.entitySet = oSpecificChangeInfo.entitySet;
		}

		oChange.setContent(oContent);
		if (oSpecificChangeInfo.relevantContainerId) {
			// new add via delegate changes contain the smartform
			oChange.addDependentControl(oSpecificChangeInfo.relevantContainerId, "form", mPropertyBag);
		}
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
	AddFields.revertChange = function(oChange, oGroup, mPropertyBag) {
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;
		var oModifier = mPropertyBag.modifier;
		var mRevertData = oChange.getRevertData();
		var mFieldSelector = mRevertData.newFieldSelector;

		var oGroupElement = oModifier.bySelector(mFieldSelector, oAppComponent, oView);
		return Promise.resolve()
			.then(oModifier.removeAggregation.bind(oModifier, oGroup, "groupElements", oGroupElement))
			.then(function () {
				oModifier.destroy(oGroupElement);

				var mValueHelpSelector = mRevertData.valueHelpSelector;
				if (mValueHelpSelector) {
					var oValueHelp = oModifier.bySelector(mValueHelpSelector, oAppComponent, oView);
					var oSmartForm = oChange.getDependentControl("form", mPropertyBag); //recently changes contain the info about the form
					return Promise.resolve()
						.then(oModifier.removeAggregation.bind(oModifier, oSmartForm, "dependents", oValueHelp))
						.then(function () {
							oModifier.destroy(oValueHelp);
						});
				}
			})
			.then(function () {
				oChange.resetRevertData();
			});
	};

	/**
	 * Retrieves the condenser-specific information.
	 *
	 * @param {sap.ui.fl.Change} oChange - Change object with instructions to be applied on the control map
	 * @returns {object} Returns condenser-specific information
	 * @public
	 */
	AddFields.getCondenserInfo = function(oChange) {
		return {
			affectedControl: oChange.getContent().field.selector,
			classification: Classification.Create,
			targetContainer: oChange.getSelector(),
			targetAggregation: "groupElements",
			setTargetIndex: function (oChange, iNewTargetIndex) {
				oChange.getContent().field.index = iNewTargetIndex;
			},
			getTargetIndex: function(oChange) {
				return oChange.getContent().field.index;
			}
		};
	};

	AddFields.getChangeVisualizationInfo = function(oChange) {
		return {
			affectedControls: [oChange.getContent().field.selector]
		};
	};

	return AddFields;
},
/* bExport= */true);
