/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/smartform/flexibility/changes/RemoveGroup",
	"sap/ui/comp/smartform/flexibility/changes/AddGroup",
	"sap/ui/comp/smartform/flexibility/changes/MoveGroups",
	"sap/ui/comp/smartform/flexibility/changes/RenameTitle",
	"sap/ui/comp/smartform/flexibility/changes/CombineFields",
	"sap/ui/comp/smartform/flexibility/changes/SplitField",
	"sap/ui/comp/smartform/flexibility/changes/MoveFields",
	"sap/ui/fl/apply/api/DelegateMediatorAPI"
], function (
	RemoveGroup,
	AddGroup,
	MoveGroups,
	RenameTitle,
	CombineFields,
	SplitField,
	MoveFields,
	DelegateMediatorAPI
) {
	"use strict";

	// Required for change handler 'AddFields'
	DelegateMediatorAPI.registerWriteDelegate({
		controlType: "sap.ui.comp.smartform.SmartForm",
		delegate: "sap/ui/comp/smartfield/flexibility/SmartFieldWriteDelegate"
	});
	// Required for change handler 'AddField'
	DelegateMediatorAPI.registerWriteDelegate({
		controlType: "sap.ui.comp.smartform.Group",
		delegate: "sap/ui/comp/smartfield/flexibility/SmartFieldWriteDelegate"
	});

	return {
		"removeGroup": RemoveGroup,
		"addGroup": AddGroup,
		"moveGroups": MoveGroups,
		"renameField": RenameTitle,
		"combineFields": CombineFields,
		"splitField": SplitField,
		"moveControls": MoveFields
	};
}, /* bExport= */ true);
