/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/smarttable/flexibility/Utils",
    "sap/ui/core/Lib",
	"sap/ui/core/util/reflection/JsControlTreeModifier",
	"sap/ui/base/ManagedObjectMetadata"
], function(Utils, Library, Modifier, ManagedObjectMetadata) {
	"use strict";

	var Handler = {};

	/**
	 * Returns a human radable "name" representing a control
	 */
	function findText(oControl) {
		var sType = oControl.getMetadata().getName();
		var sName = sType.slice(sType.lastIndexOf('.') + 1) + " - ";

		if (oControl.getText && oControl.getText()) {
			sName = sName + oControl.getText();
		} else if (oControl.getTooltip_AsString && oControl.getTooltip_AsString()) {
			sName = sName + oControl.getTooltip_AsString();
		} else {
			sName = sName + oControl.getId();
		}

		return sName;
	}

	/**
	 * Returns the items of the given toolbar content which can be rearranged
	 */
	function filterRelevantContent(aContent, oSmartTable) {
		var aResult = [];
		for (var i = 0; i < aContent.length; i++) {
			if (!aContent[i].hasStyleClass("sapUiCompSmartTableToolbarContent")
				&& aContent[i] != oSmartTable._oSeparator
				&& !ManagedObjectMetadata.isGeneratedId(aContent[i].getId())) {
				aResult.push(aContent[i]);
			}
		}
		return aResult;
	}

	/**
	 * Checks whether the RTA for Toolbar Content Rearranging is possible
	 */
	Handler.isEnabled = function (oSmartTable) {
		var oToolbar = oSmartTable.getCustomToolbar();
		if (oToolbar && !oToolbar.hasStyleClass("sapUiCompSmartTableToolbar")) {
			var aContent = filterRelevantContent(oToolbar.getContent(), oSmartTable);
			return aContent.length >= 2;
		}
		return false;
	};

	Handler.handleToolbarSettings = function (oSmartTable, mPropertyBag) {
		return new Promise(function(resolve, reject) {
			sap.ui.require(["sap/m/p13n/Popup", "sap/m/p13n/SelectionPanel"], function(Popup, SelectionPanel) {
				var aState = [];
				var aBefore = [];

				var oToolbar = oSmartTable.getCustomToolbar();
				var aContent = filterRelevantContent(oToolbar.getContent(), oSmartTable);
				var oAppComponent = Utils.getAppComponentForControl(oSmartTable) || null;

				for (var i = 0; i < aContent.length; i++) {
					var oSelector = Utils.getSelectorForControl(aContent[i], oAppComponent);
					aState.push({visible: true, name: oSelector.id, label: findText(aContent[i]), selector: oSelector});
					aBefore.push(oSelector);
				}

				var oSelectionPanel = new SelectionPanel({
					title: Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_RTA_REARRANGE_TOOLBAR_CONTENT_TABLE_TITLE"),
					enableCount: false,
					showHeader: false
				});
				var oPopup = new Popup({
					title: Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_RTA_REARRANGE_TOOLBAR_CONTENT_TITLE"),
					close: function(oEvent) {
						var sReason = oEvent.getParameter("reason");
						if (sReason === "Cancel") {
							oPopup.destroy();
							reject();
							return;
						}
						aState = oSelectionPanel.getP13nData();
						oPopup.destroy();

						var bChanged = false;
						var aAfter = [];
						for (var i = 0; i < aState.length; i++) {
							aAfter.push(aState[i].selector);
							if (aBefore[i].id != aAfter[i].id) {
								bChanged = true;
							}
						}

						if (bChanged){
							resolve([{
								selectorControl : oSmartTable,
								changeSpecificData : {
									changeType : "ToolbarContentMove",
									content : {
										order: aAfter/*,
										before: aBefore*/
									}
								}
							}]);
						} else {
							reject();
						}
					},
					panels: [
						oSelectionPanel
					]
				});


				//************* Adapt the SelectionPanel to only enable reordering
				// TBD This should be some offical functionality of the Panel

				oSelectionPanel.getSelectedFields = function() {
					var aSelectedItems = [];
					this._loopItems(this._oListControl, function(oItem, sKey){
						aSelectedItems.push(sKey);
					});

					return aSelectedItems;
				};

				oSelectionPanel._oListControl.setMode("None");

				//********************** */

				oSelectionPanel.setP13nData(aState);

				oPopup.open(oToolbar);
				oPopup.addStyleClass(mPropertyBag.styleClass);
			});

		});

	};

	return Handler;
});