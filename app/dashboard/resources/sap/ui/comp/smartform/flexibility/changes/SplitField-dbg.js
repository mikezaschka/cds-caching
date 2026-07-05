/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([],
		function() {
	"use strict";

	/**
	 * Change handler for splitting smart form group elements (representing one or more fields).
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.comp.smartform.flexibility.changes.SplitField
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.46.0
	 */
	var SplitField = {};

	/**
	 * Split a smart form group element incl. more value controls.
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oControl Smartform control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - Map of properties
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - Modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - Component in which the change should be applied
	 * @param {object} mPropertyBag.view - View object or xml element representing an ui5 view
	 * @return {Promise} Resolves if change could be applied
	 *
	 * @public
	 */
	SplitField.applyChange = function(oChange, oControl, mPropertyBag) {
		var oChangeContent = oChange.getContent();
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;
		var oSourceControl = oModifier.bySelector(oChangeContent.sourceSelector, oAppComponent, oView);
		var sLabelText;
		var fnSortFields = function(a, b) {
			if (a.index > b.index) {
				return 1;
			} else if (a.index < b.index) {
				return -1;
			}
		};

		var oParent = oModifier.bySelector(oChangeContent.parentSelector, oAppComponent, oView);
		var aNewElementIds = oChangeContent.newElementIds.slice();
		var aSplittedFields = [];
		var aFields;
		var iLabelElementIndex;
		var aGroupElements;
		var iControlIndex;
		return Promise.all([
			oModifier.getAggregation(oSourceControl, "elements"),
			oModifier.getProperty(oSourceControl, "elementForLabel"),
			oModifier.getAggregation(oParent, "groupElements")
		])
		.then(function (aValues) {
			aFields = aValues[0];
			iLabelElementIndex = aValues[1];
			aGroupElements = aValues[2];
			iControlIndex = aGroupElements.indexOf(oSourceControl);
			return oModifier.getProperty(oSourceControl, "label");
		})
		.then(function (vLabel) {
			if (vLabel && (typeof vLabel !== "string")){
				return oModifier.getProperty(vLabel, "text");
			}
			return vLabel;
		})
		.then(function (sLabel) {
			sLabelText = sLabel;
			return aFields.reduce(function (previousPromise, oField, iIndex) {
				if (iIndex !== iLabelElementIndex) {
					// create groupElement with new element ID
					var sNewId = aNewElementIds.pop();
					var oNewGroupElement;

					return previousPromise
					.then(oModifier.createControl.bind(oModifier,
						"sap.ui.comp.smartform.GroupElement",
						mPropertyBag.appComponent,
						oView,
						sNewId
					))
					.then(function (oCreatedGroupElement) {
						oNewGroupElement = oCreatedGroupElement;
						// remove field from combined groupElement
						aSplittedFields.push({
							groupElementSelector: oModifier.getSelector(oNewGroupElement, oAppComponent),
							index: iIndex
						});
						return Promise.resolve()
							.then(oModifier.removeAggregation.bind(oModifier, oSourceControl, "elements", oField))
							// insert field to groupElement
							.then(oModifier.insertAggregation.bind(oModifier, oNewGroupElement, "elements", oField, 0, oView))
							.then(oModifier.insertAggregation.bind(oModifier, oParent, "groupElements", oNewGroupElement, iControlIndex + iIndex, oView))
							// set label of groupElement
							.then(oModifier.getProperty.bind(oModifier, oNewGroupElement, "label"))
							.then(function (vLabel) {
								if (vLabel && (typeof vLabel !== "string")){
									oModifier.setProperty(vLabel, "text", sLabelText);
								} else {
									oModifier.setProperty(oNewGroupElement, "label", sLabelText);
								}
							});
					});
				} else {
					aSplittedFields.push({
						groupElementSelector: oModifier.getSelector(oSourceControl, oAppComponent),
						index: iIndex
					});
					if (iLabelElementIndex !== 0) {
						oModifier.setProperty(oSourceControl, "elementForLabel", 0);
					}

					return previousPromise
					.then(oModifier.removeAggregation.bind(oModifier, oSourceControl, "elements", oField))
					.then(oModifier.insertAggregation.bind(oModifier, oSourceControl, "elements", oField, 0, oView))
					.then(oModifier.getProperty.bind(oModifier, oSourceControl, "label"))
					.then(function (vLabel) {
						// set label to combined groupElement
						if (vLabel && (typeof vLabel !== "string")){
							oModifier.setProperty(vLabel, "text", sLabelText);
						} else {
							oModifier.setProperty(oSourceControl, "label", sLabelText);
						}
					});
				}
			}, Promise.resolve());
		})
		.then(function () {
			oChange.setRevertData({
				sourceControlSelector: oChangeContent.sourceSelector,
				labelText: sLabelText,
				splittedFields: aSplittedFields.sort(fnSortFields)
			});
		});
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo - specific change info containing parentId
	 * @param {object} mPropertyBag - map of properties
	 *
	 * @public
	 */
	SplitField.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oContent = {};

		if (oSpecificChangeInfo.newElementIds) {
			oContent.newElementIds = oSpecificChangeInfo.newElementIds.slice(0, -1);
		} else {
			throw new Error("oSpecificChangeInfo.newElementIds attribute required");
		}

		if (oSpecificChangeInfo.sourceControlId) {
			oContent.sourceSelector = oModifier.getSelector(oSpecificChangeInfo.sourceControlId, oAppComponent);
			oChange.addDependentControl(oSpecificChangeInfo.sourceControlId, "sourceControl", mPropertyBag);

		} else {
			throw new Error("oSpecificChangeInfo.sourceControlId attribute required");
		}

		if (oSpecificChangeInfo.parentId) {
			oContent.parentSelector = oModifier.getSelector(oSpecificChangeInfo.parentId, oAppComponent);
			oChange.addDependentControl(oSpecificChangeInfo.parentId, "parent", mPropertyBag);
		} else {
			throw new Error("oSpecificChangeInfo.parentId attribute required");
		}
		oChange.setContent(oContent);
	};

	/**
	 * Reverts the applied change
	 *
	 * @param {sap.ui.fl.Change} oChange Change wrapper object with instructions to be applied to the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oControl Smartform control that matches the change selector for applying the change
	 * @param {object} mPropertyBag Property bag containing the modifier, the appComponent and the view
	 * @param {object} mPropertyBag.modifier Modifier for the controls
	 * @param {object} mPropertyBag.appComponent Component in which the change should be applied
	 * @param {object} mPropertyBag.view Application view
	 * @returns {Promise} Resolves if successful
	 * @public
	 */
	SplitField.revertChange = function(oChange, oControl, mPropertyBag) {
		var oView = mPropertyBag.view;
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var mRevertData = oChange.getRevertData();
		var aSplittedFields = mRevertData.splittedFields;
		var oSourceControl = oModifier.bySelector(mRevertData.sourceControlSelector, oAppComponent, oView);

		return aSplittedFields.reduce(function (previousPromise, oSplittedField) {
			var oGroupElement = oModifier.bySelector(oSplittedField.groupElementSelector, oAppComponent, oView);
			return previousPromise
			.then(oModifier.getAggregation.bind(oModifier, oGroupElement, "elements"))
			.then(function (aFields) {
				var oField = aFields[0];
				return Promise.resolve()
				.then(oModifier.removeAggregation.bind(oModifier, oGroupElement, "elements", oField))
				.then(oModifier.insertAggregation.bind(oModifier, oSourceControl, "elements", oField, oSplittedField.index, oView));
			})
			.then(function () {
				if (oGroupElement !== oSourceControl) {
					oModifier.destroy(oGroupElement);
				}
			});
		}, Promise.resolve())
		.then(oModifier.getProperty.bind(oModifier, oSourceControl, "label"))
		.then(function (vLabel) {
			if (vLabel && (typeof vLabel !== "string")){
				oModifier.setProperty(vLabel, "text", mRevertData.labelText);
			} else {
				oModifier.setProperty(oSourceControl, "label", mRevertData.labelText);
			}
			oChange.resetRevertData();
		});
	};

	SplitField.getChangeVisualizationInfo = function(oChange) {
		return {
			affectedControls: [oChange.getContent().sourceSelector],
			dependentControls: oChange.getContent().newElementIds
		};
	};

	return SplitField;
},
/* bExport= */true);
