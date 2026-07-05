/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/fl/changeHandler/MoveControls"
], function(
	MoveControls
) {
	"use strict";

	/**
	 * Change handler for moving of fields within/between groups.
	 *
	 * This module is only for internal use!
	 *
	 * @alias sap.ui.comp.smartform.flexibility.changes.MoveFields
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.27.0
	 */
	var MoveFields = Object.assign({}, MoveControls);

	/**
	 * Moves field(s) within a group or between groups.
	 *
	 * @param {object} oChange change object with instructions to be applied on the control
	 * @param {object} oControl Smart form group instance which is referred to in change selector section
	 * @param {object} mPropertyBag - map of properties
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @public
	 * @function
	 * @returns {boolean} true - if change could be applied
	 * @name sap.ui.comp.smartform.flexibility.changes.MoveFields#applyChange
	 */
	MoveFields.applyChange = function(oChange, oControl, mPropertyBag) {
		var mMoveFieldsPropertyBag = Object.assign({}, mPropertyBag, {
			targetAggregation: "groupElements",
			sourceAggregation: "groupElements"
		});
		return MoveControls.applyChange.call(this, oChange, oControl, mMoveFieldsPropertyBag);
	};

	MoveFields.getCondenserInfo = function(oChange) {
		var oCondenserInfo = MoveControls.getCondenserInfo.call(this, oChange);
		oCondenserInfo.targetAggregation = "groupElements";
		return oCondenserInfo;
	};

	return MoveFields;
},
/* bExport= */true);