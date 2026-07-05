/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/IconPool",
	"./HistoryGlobalDataService",
	"./Constants",
	"./Utils",
	"sap/m/Dialog",
	"sap/m/MessageBox",
	"sap/m/FlexBox",
	"sap/m/VBox",
	"sap/m/HBox",
	"sap/m/Switch",
	"sap/m/Button",
	"sap/m/Label",
	"sap/ui/core/Lib"
], function(BaseObject, IconPool, HistoryGlobalDataService, HistoryConstants, HistoryUtils, Dialog, MessageBox, FlexBox, VBox, HBox, Switch, Button, Label, Library) {
	"use strict";

	/**
	 * Creates the Opt Out user settings for history values
	 *
	 * @private
	 * @author SAP SE
	 */
	var oInstance;
	var HistoryOptOutProvider = BaseObject.extend("sap.ui.comp.historyvalues.HistoryOptOutProvider", {
		metadata: {
			library: "sap.ui.comp"
		},

		constructor: function () {
			BaseObject.apply(this, arguments);

			this._initialize();
		}
	});

	HistoryOptOutProvider.prototype._initialize = function () {
		this._oRB = Library.getResourceBundleFor("sap.ui.comp");
		this._oDialog = null;
		this._oHistoryEnabledSwitch = null;
		this._oHistoryEnabledLabel = null;
		this._oDeleteHistoryButton = null;
		this._oDeleteHistoryLabel = null;
		this._oSaveButton = null;
		this._oCancelButton = null;
		this._oDialogLayout = null;
		this._oHistoryEnabledLayout = null;
		this._oDeleteHistoryLayout = null;
	};

	HistoryOptOutProvider.prototype._createOptOutUserProfileEntry = function () {
		var Container = sap.ui.require("sap/ushell/Container");
		return Container.getServiceAsync("Extension").then((oExtenstionService) => {
			const oControlProperties = {
					id: HistoryConstants.getHistoryPrefix() + "optOut.trigger",
					text:  this._oRB.getText("HISTORY_SETTING_TITLE"),
					icon:  IconPool.getIconURI("history"),
					press: function () {
						this._createDialogContent();
						this._createLayouts();
						this._createDialog();

						this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.getHistoryEnabled()).then(function (bEnabled) {
							this._oHistoryEnabledSwitch.setState(bEnabled);
							if (!bEnabled) {
								this._oHistoryEnabledSwitch.setState(bEnabled);
							}
							this._oDialog.open();
						}.bind(this));
					}.bind(this)
				},
				oAddActionButtonProperties = {
					controlType: "sap.m.Button",
					bIsVisible: true,
					bCurrentState: true
				};
			return oExtenstionService.createUserAction(oControlProperties, oAddActionButtonProperties);
		});
	};

	/*
		Create Controls
	 */
	HistoryOptOutProvider.prototype._createDialogContent = function () {
		this._createHistoryEnabledSwitch();
		this._createHistoryEnabledLabel();
		this._createDeleteHistoryButton();
		this._createDeleteHistoryLabel();
		this._createSaveButton();
		this._createCancelButton();
	};

	HistoryOptOutProvider.prototype._createLayouts = function () {
		this._oHistoryEnabledLayout = new HBox({
			alignItems: "Center",
			items: [this._oHistoryEnabledLabel, this._oHistoryEnabledSwitch]
		});
		this._oDeleteHistoryLayout = new FlexBox({
			alignItems: "Center",
			items: [this._oDeleteHistoryLabel, this._oDeleteHistoryButton]
		});
		this._oDialogLayout = new VBox({
			items: [this._oHistoryEnabledLayout, this._oDeleteHistoryLayout]
		}).addStyleClass("sapUiSmallMargin");
	};

	HistoryOptOutProvider.prototype._createDialog = function () {
		this._oDialog = new Dialog(HistoryConstants.getHistoryPrefix() + "optOutDialog", {
			title: this._oRB.getText("HISTORY_SETTING_TITLE"),
			content: [this._oDialogLayout],
			buttons: [this._oSaveButton, this._oCancelButton]
		});

		this._oDialog.attachAfterClose(this._onOptOutDialogAfterClose, this);
	};

	HistoryOptOutProvider.prototype._createHistoryEnabledSwitch = function () {
		this._oHistoryEnabledSwitch = new Switch();
	};

	HistoryOptOutProvider.prototype._createHistoryEnabledLabel = function () {
		this._oHistoryEnabledLabel = new Label({
			text: this._oRB.getText("HISTORY_SETTING_ENABLE_TRACKING_DESCRIPTION")
		}).addStyleClass("sapUiSmallMarginEnd");
	};

	HistoryOptOutProvider.prototype._createDeleteHistoryButton = function () {
		this._oDeleteHistoryButton = new Button({
			busyIndicatorDelay: 0,
			text: this._oRB.getText("HISTORY_SETTING_DELETE_BUTTON")
		});

		this._oDeleteHistoryButton.attachPress(this._onDeleteHistoryPress, this);
	};

	HistoryOptOutProvider.prototype._createDeleteHistoryLabel = function () {
		this._oDeleteHistoryLabel = new Label({
			text: this._oRB.getText("HISTORY_SETTING_DELETE_DESCRIPTION")
		}).addStyleClass("sapUiSmallMarginEnd");
	};

	HistoryOptOutProvider.prototype._createSaveButton = function () {
		this._oSaveButton = new Button({
			text: this._oRB.getText("HISTORY_SETTING_SAVE")
		});

		this._oSaveButton.attachPress(this._onSavePress, this);
	};

	HistoryOptOutProvider.prototype._createCancelButton = function () {
		this._oCancelButton = new Button({
			text: this._oRB.getText("HISTORY_SETTING_CANCEL")
		});

		this._oCancelButton.attachPress(this._onCancelPress, this);
	};

	HistoryOptOutProvider.prototype._getHistoryGlobalDataService = function () {
		return HistoryGlobalDataService.getInstance();
	};

	/*
	 Handlers
	 */
	HistoryOptOutProvider.prototype._onOptOutDialogAfterClose = function () {
		this._oDialog.destroy();
	};

	HistoryOptOutProvider.prototype._onDeleteHistoryPress = function (oEvent) {
		var oButton = oEvent.getSource();
		oButton.setBusy(true);

		this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.deleteHistory()).then(function () {
			oButton.setBusy(false);
		});
	};

	HistoryOptOutProvider.prototype._onSavePress = function () {
		MessageBox.confirm(this._oRB.getText("HISTORY_SETTING_CONFIRM"), {
			onClose: function (sResult) {
				if (sResult == "CANCEL") {
					return;
				}

				this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.setHistoryEnabled(this._oHistoryEnabledSwitch.getState()))
					.then(function () {
						window.location.reload();
					});
			}.bind(this)
		});
	};

	HistoryOptOutProvider.prototype._onCancelPress = function () {
		this._oDialog.close();
	};

	HistoryOptOutProvider.prototype.exit = function () {
		if (this._oDialog) {
			this._oDialog.destroy();
			this._oDialog = null;
		}
		this._oRB = null;
		this._oHistoryEnabledSwitch = null;
		this._oHistoryEnabledLabel = null;
		this._oDeleteHistoryButton = null;
		this._oDeleteHistoryLabel = null;
		this._oSaveButton = null;
		this._oCancelButton = null;
		this._oDialogLayout = null;
		this._oHistoryEnabledLayout = null;
		this._oDeleteHistoryLayout = null;
	};

	return {
		createOptOutSettingPage: function () {
			return HistoryUtils.getAppInfo().then(function (oAppInfo) {
				if (oAppInfo.homePage === true) {
					return;
				}

				if (!oInstance) {
					oInstance = new HistoryOptOutProvider();
				}

				// A workaround for registering the user profile setting.
				// Since the HistoryOptOutProvider is called from each field with ValueList
				// we need to store the promise for first creation. addUserAction will
				// return a promise which will be resolved when the action is created
				if (!oInstance._oUserActionPromise) {
					oInstance._oUserActionPromise = oInstance._createOptOutUserProfileEntry();
					oInstance._oUserActionPromise.then((oAction) => oAction.showForCurrentApp());
				} else {
					// Every time (except the first one) when the createOptOutSettingPage is called
					// we just assign to the then of the previously created promise.
					// and there check if the control is created. If it is not created then we created it here.
					oInstance._oUserActionPromise.then(function () {
						// The setting is destroyed and we need to create it because the user
						// left out the application and enter again in it or some other application
						oInstance._oUserActionPromise = oInstance._createOptOutUserProfileEntry();
						oInstance._oUserActionPromise.then((oAction) => oAction.showForCurrentApp());
					});
				}

				return oInstance;
			});
		}
	};
});
