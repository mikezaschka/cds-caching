/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartform.Group control
sap.ui.define([
	"sap/ui/comp/designtime/smartform/GroupElement.designtime",
	"sap/ui/core/Core",
	"sap/ui/core/Lib"
], function(GroupElementDesignTimeMetadata, Core, Lib) {
	"use strict";

	function filterIgnoredFields(oRelevantContainer, mODataProperty ) {
		var sIgnoredFields = oRelevantContainer.getMetadata().getName() === "sap.ui.comp.smartform.SmartForm" ? oRelevantContainer.getIgnoredFields() : "";
		return sIgnoredFields.indexOf(mODataProperty.name) === -1;
	}

	return {
		name : {
			singular : "GROUP_CONTROL_NAME",
			plural : "GROUP_CONTROL_NAME_PLURAL"
		},
		isVisible: function(oGroup) {
			return oGroup.isVisible();
		},
		aggregations: {
			title: {
				ignore: true
			},
			groupElements: {
				ignore: true
			},
			formElements: {
				domRef: ":sap-domref",
				childNames : {
					singular : "FIELD_CONTROL_NAME",
					plural : "FIELD_CONTROL_NAME_PLURAL"
				},
				actions: {
					move: {
						changeType : "moveControls"
					},
					remove : {
						removeLastElement: true
					},
					add : {
						delegate: {
							changeType: "addFields",
							filter: filterIgnoredFields
						}
					}
				}
			}
		},
		actions: {
			rename: {
				changeType: "renameGroup",
				isEnabled: function(oGroup) {
					return !oGroup.getExpandable();
				},
				domRef: function(oControl) {
					var oTitle = oControl.getTitle && oControl.getTitle();
					// duck typing since core.title is not an instance of Control
					if (oTitle && oTitle.getDomRef) {
						return oTitle.getDomRef();
					} else {
						return (oControl.getId() + "--title" ? window.document.getElementById(oControl.getId() + "--title") : null);
					}
				}
			},
			remove: {
				changeType: "hideControl",
				getConfirmationText: function(oGroup) {
					var oTextResources = Lib.getResourceBundleFor("sap.ui.comp.designtime");

					var aMandatoryFieldNames = [];
					oGroup.getGroupElements().forEach(function(oGroupElement) {
						if (oGroupElement.getVisible() && GroupElementDesignTimeMetadata.functions.hasMandatoryFields(oGroupElement)) {
							var sGroupElement = oGroupElement.getLabelText() || oGroupElement.getId();
							aMandatoryFieldNames.push(sGroupElement);
						}
					});

					if (aMandatoryFieldNames.length) {
						var sFormattingPrefix = "\n\u2003\u2003\u2022\u2004 "; // new line, two M whitespaces, bullet point, N whitespace
						var sMandatoryFields = "";
						aMandatoryFieldNames.forEach(function(oMandatoryFieldName) {
							sMandatoryFields += sFormattingPrefix + oMandatoryFieldName;
						});
						return oTextResources.getText("GROUP_DESIGN_TIME_REMOVE_GROUP_WITH_MANDATORY_FIELDS_MESSAGE", [sMandatoryFields]);
					}

				}
			}
		},
		properties: {
			useHorizontalLayout: {
				ignore: true
			},
			horizontalLayoutGroupElementMinWidth: {
				ignore: true
			},
			label: {
				ignore: false
			}
		}
	};

}, /* bExport= */true);
