/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/* global */

sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/Lib",
	"sap/ui/rta/plugin/annotations/AnnotationTypes",
	"sap/ui/comp/delegates/Label",
	"sap/ui/comp/delegates/TextArrangement"
], function(
	BaseObject,
	library,
	AnnotationTypes,
	LabelDelegate,
	TextArrangementDelegate
) {
	"use strict";

	/**
	 * FlexibilityDelegate class that provides useful functionality for RTA.
	 * @namespace
	 * @alias sap.ui.comp.delegates.FlexibilityDelegate
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @since 1.134
	 */
	var FlexibilityDelegate = BaseObject.extend("sap.ui.comp.delegates.FlexibilityDelegate", /** @lends sap.ui.comp.delegates.FlexibilityDelegate.prototype */ {
		constructor: function() {
			BaseObject.apply(this, arguments);
		}
	});

	FlexibilityDelegate.getTextArrangementDelegate = function() {
		return {
			isEnabled: true,
			changeType: "textArrangement",
			title: library.getResourceBundleFor("sap.ui.comp").getText("TEXTARRANGEMENT_RTA_DIALOG_TITLE"),
			type: AnnotationTypes.ValueListType,
			annotation: "textArrangement",
			delegate: TextArrangementDelegate,
			additionalInfoKey: "TEXTARRANGEMENT_RTA_CONTEXT_MENU_INFO"
		};
	};

	FlexibilityDelegate.getLabelDelegate = function(oSettings) {
		const oLabelDelegate = new LabelDelegate(oSettings);

		return Object.assign({
			isEnabled: true,
			changeType: "annotationRename",
			title: oSettings?.singleRename ? library.getResourceBundleFor("sap.ui.comp").getText("RENAME_RTA_LABEL_ACTION") : library.getResourceBundleFor("sap.ui.comp").getText("LABEL_RTA_DIALOG_TITLE"),
			type: AnnotationTypes.StringType,
			annotation: "label",
			delegate: oLabelDelegate,
			objectTemplateInfo: {
				templateAsString: '{"String": "%%placeholder%%"}',
				placeholder: "%%placeholder%%"
			},
			additionalInfoKey: "LABEL_RTA_CONTEXT_MENU_INFO"
		}, oSettings);
	};

	return FlexibilityDelegate;
});
