/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/Log",
	"sap/ui/core/Element",
	"sap/ui/core/util/reflection/JsControlTreeModifier",
	"sap/ui/fl/changeHandler/condenser/Classification"
], function(Log, Element, JsControlTreeModifier, CondenserClassification) {
		"use strict";

		/**
		 * Change handler for moving of groups inside a smart form.
		 *
		 * This module is only for internal use!
		 *
		 * @alias sap.ui.fl.changeHandler.MoveGroups
		 * @author SAP SE
		 * @version 1.136.0
		 * @private
		 * @since 1.27.0
		 */
		var MoveGroups = { };

		MoveGroups._checkCompleteChangeContentConditions = function(oSpecificChangeInfo) {
			if (!oSpecificChangeInfo.movedElements) {
				throw new Error("oSpecificChangeInfo.movedElements attribute required");
			}
			if (oSpecificChangeInfo.movedElements.length === 0) {
				throw new Error("MovedElements array is empty");
			}
			oSpecificChangeInfo.movedElements.forEach(function (oMoveField) {
				if (!oMoveField.id) {
					throw new Error("MovedElements element has no id attribute");
				}
				if (typeof (oMoveField.targetIndex) !== "number") {
					throw new Error("Index attribute at MovedElements element is no number");
				}
			});
		};

		MoveGroups._buildStableChangeInfo = function(mMoveActionParameter){
			var sSourceParentId = mMoveActionParameter.source.id;
			var sTargetParentId = mMoveActionParameter.target.id;
			var mChangeData = {
				changeType : mMoveActionParameter.changeType,
				selector : {
					id : sSourceParentId
				},
				targetId : sTargetParentId !== sSourceParentId ? sTargetParentId : null
			};

			mChangeData[mMoveActionParameter.changeType] = [];

			mMoveActionParameter.movedElements.forEach(function(mMovedElement) {
				mChangeData[mMoveActionParameter.changeType].push({
					id : mMovedElement.id,
					sourceIndex : mMovedElement.sourceIndex,
					index : mMovedElement.targetIndex
				});
			});

			return mChangeData;
		};

		/**
		 * Moves group(s) inside a smart form
		 *
		 * @param {object} oChange Change object with instructions to be applied to the control
		 * @param {object|Element} oSmartForm Smart form instance which is referred to in change selector section
		 * @param {object} mPropertyBag - Map of properties
		 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
		 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
		 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
		 * @function
		 * @returns {Promise} resolves if change could be applied
		 * @name sap.ui.comp.smartform.flexibility.changes.MoveGroups#applyChange
		 */
		MoveGroups.applyChange = function(oChange, oSmartForm, mPropertyBag) {
			function checkConditions(oChange, oModifier) {
				if (!oChange) {
					return Promise.reject(new Error("No change instance"));
				}

				var oChangeContent = oChange.getContent();

				return Promise.resolve()
				.then(oModifier.getAggregation.bind(oModifier, oSmartForm, "groups"))
				.then(function (aAggregations) {
					if (!aAggregations) {
						Log.error("Object has no smartform elements aggregation", oModifier.getId(oSmartForm));
					}
					if (!oChangeContent || !oChangeContent.moveGroups || oChangeContent.moveGroups.length === 0) {
						return Promise.reject(new Error("Change format invalid"));
					}
					return undefined;
				});
			}

			function getGroupControlOrThrowError(oMoveGroup, oModifier, oAppComponent, oView) {
				if (!oMoveGroup.selector && !oMoveGroup.id) {
					return Promise.reject(new Error("Change format invalid - moveGroups element has no id attribute"));
				}
				if (typeof (oMoveGroup.index) !== "number") {
					return Promise.reject(new Error("Change format invalid - moveGroups element index attribute is no number"));
				}
				return Promise.resolve(oModifier.bySelector(oMoveGroup.selector || oMoveGroup.id, oAppComponent, oView));
			}

			var oModifier = mPropertyBag.modifier;
			var oView = mPropertyBag.view;
			var oAppComponent = mPropertyBag.appComponent;
			var aMovedGroups = [];

			function moveGroup (oMoveGroup, oGroupControl) {
				if (!oGroupControl) {
					return Promise.resolve(Log.warning("Group to move not found"));
				}
				return Promise.resolve()
				.then(oModifier.findIndexInParentAggregation.bind(oModifier, oGroupControl))
				.then(function (iIndex) {
					// if iIndex (current index) === index (targetIndex) the operation was already performed (e.g. in RTA)
					// in this case we need the sourceIndex that is saved in the change in order to revert it to the correct index
					// also, old changes don't have sourceIndex
					if (iIndex === oMoveGroup.index && typeof oMoveGroup.sourceIndex === "number") {
						iIndex = oMoveGroup.sourceIndex;
					}
					aMovedGroups.push({
						selector: oModifier.getSelector(oGroupControl, oAppComponent),
						index: iIndex
					});
				})
				.then(oModifier.removeAggregation.bind(oModifier, oSmartForm, "groups", oGroupControl, oView))
				.then(oModifier.insertAggregation.bind(oModifier, oSmartForm, "groups", oGroupControl, oMoveGroup.index));
			}

			return checkConditions(oChange, oModifier)
			.then(function () {
				var oChangeContent = oChange.getContent();
				return oChangeContent.moveGroups.reduce(function (previousPromise, oMoveGroup) {
					return previousPromise
						.then(getGroupControlOrThrowError.bind(null, oMoveGroup, oModifier, oAppComponent, oView))
						.then(function(oGroupControl) {
							return moveGroup(oMoveGroup, oGroupControl);
						});
				}, Promise.resolve());
			})
			.then(function () {
				oChange.setRevertData({movedGroups: aMovedGroups});
			});
		};

		/**
		 * Completes the change by adding change handler specific content
		 *
		 * @param {object} oChange change object to be completed
		 * @param {object} oSpecificChangeInfo with attribute moveGroups which contains an array which holds objects which have attributes
		 * 				   id and index - id is the id of the group to move and index the new position of the group in the smart form
		 * @param {object} mPropertyBag - map of properties
		 * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
		 * @public
		 * @function
		 * @name sap.ui.comp.smartform.flexibility.changes.MoveGroups#completeChangeContent
		 */
		MoveGroups.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
			this._checkCompleteChangeContentConditions(oSpecificChangeInfo);

			oSpecificChangeInfo = this._buildStableChangeInfo(oSpecificChangeInfo);

			var oContent = {
				moveGroups: []
			};

			var aMovedGroups = oSpecificChangeInfo.moveGroups.map(function (oGroup) {
				var oGroupControl = Element.getElementById(oGroup.id);
				var oSelector = JsControlTreeModifier.getSelector(oGroupControl, mPropertyBag.appComponent);
				oContent.moveGroups.push({
					selector: oSelector,
					sourceIndex : oGroup.sourceIndex,
					index : oGroup.index
				});
				return oGroupControl;
			});
			oChange.addDependentControl(aMovedGroups, "movedGroups", mPropertyBag);
			oChange.setContent(oContent);
		};

		/**
		 * Reverts the applied change
		 *
		 * @param {object} oChange Change object with instructions to be applied to the control
		 * @param {object|Element} oSmartForm Smart form instance which is referred to in change selector section
		 * @param {object} mPropertyBag Property bag containing the modifier, the appComponent and the view
		 * @param {object} mPropertyBag.modifier Modifier for the controls
		 * @param {object} mPropertyBag.appComponent Component in which the change should be applied
		 * @param {object} mPropertyBag.view Application view
		 * @returns {Promise} Resolves if successful
		 */
		MoveGroups.revertChange = function(oChange, oSmartForm, mPropertyBag) {
			var oAppComponent = mPropertyBag.appComponent;
			var oView = mPropertyBag.view;
			var oModifier = mPropertyBag.modifier;
			var aMovedGroups = oChange.getRevertData().movedGroups;

			return aMovedGroups.reduce(function (previousPromise, oMovedGroup) {
				var oGroup = oModifier.bySelector(oMovedGroup.selector, oAppComponent, oView);
				return previousPromise
					.then(oModifier.removeAggregation.bind(oModifier, oSmartForm, "groups", oGroup, oView))
					.then(oModifier.insertAggregation.bind(oModifier, oSmartForm, "groups", oGroup, oMovedGroup.index));
			}, Promise.resolve())

			.then(function () {
				oChange.resetRevertData();
			});
		};

		MoveGroups.getChangeVisualizationInfo = function(oChange) {
			var oChangeContent = oChange.getContent();
			return {
				affectedControls: [oChangeContent.moveGroups[0].selector],
				dependentControls: [(oChangeContent.moveGroups[0].selector.source || oChange.getSelector())]
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
		MoveGroups.getCondenserInfo = function(oChange, mPropertyBag) {
			const oChangeContent = oChange.getContent();
			const oModifier = mPropertyBag.modifier;
			const oAppComponent = mPropertyBag.appComponent;
			const oView = mPropertyBag.view;
			const oMovedGroup = oModifier.bySelector(oChangeContent.moveGroups[0].selector, oAppComponent, oView);
			const oSmartFormControl = oMovedGroup.getParent().getParent();
			return {
				affectedControl: oChangeContent.moveGroups[0].selector,
				classification: CondenserClassification.Move,
				sourceContainer: oSmartFormControl.getId(),
				targetContainer: oSmartFormControl.getId(),
				sourceIndex: oChangeContent.moveGroups[0].sourceIndex,
				sourceAggregation: "groups",
				targetAggregation: "groups",
				setTargetIndex(oChange, iNewTargetIndex) {
					const oChangeContent = oChange.getContent();
					oChangeContent.moveGroups[0].index = iNewTargetIndex;
					oChange.setContent(oChangeContent);
				},
				getTargetIndex(oChange) {
					return oChange.getContent().moveGroups[0].index;
				},
				setIndexInRevertData(oChange, iIndex) {
					const oRevertData = oChange.getRevertData();
					oRevertData.movedGroups[0].index = iIndex;
					oChange.setRevertData(oRevertData);
				}
			};
		};

		return MoveGroups;
	},
/* bExport= */true);
