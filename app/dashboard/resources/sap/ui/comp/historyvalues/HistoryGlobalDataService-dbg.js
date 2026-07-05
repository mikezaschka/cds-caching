/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/base/Object",
	"./Constants"
], function(BaseObject, constants) {
	"use strict";

	/**
	 * Service to communicate with the global container for the history values.
	 *
	 * The global container is responsible to store the following information about the
	 * history values:
	 * - Is the history enabled: historyEnabled
	 * - What are the app container ids: apps
	 *
	 * This configuration is used to store in a container with known name two important things.
	 * Is the history enabled and more importantly a map with the name of the application containers.
	 * In The application containers the history for each field is stored.
	 *
	 * @private
	 * @author SAP SE
	 */
	var oInstance;
	var HistoryGlobalDataService = BaseObject.extend("sap.ui.comp.historyvalues.HistoryGlobalDataService", {
		constructor: function () {
			BaseObject.apply(this, arguments);

			this._initialize();
		}
	});

	HistoryGlobalDataService.prototype._initialize = function () {
		this._initializeHistoryData = this._initializeHistoryData.bind(this);

		this._sContainerId = constants.getHistoryPrefix() + "HistorySettings";
		this._sItemId = constants.getHistoryPrefix() + "settings";
		this._oPersonalizer = null;
		this._oData = {};
		this._oDataReadyPromise = this._getPersonalizer().then((oPersonalizer) => oPersonalizer.getPersData())
			.then(this._initializeHistoryData);
	};

	HistoryGlobalDataService.prototype._initializeHistoryData = function (oData) {
		this._oData = oData || this._getDefaultData();

		return Object.assign({}, this._oData);
	};

	HistoryGlobalDataService.prototype._getPersonalizer = function () {
		if (this._oPersonalizer) {
			return Promise.resolve(this._oPersonalizer);
		}

		const Container = sap.ui.require("sap/ushell/Container");
		return Container.getServiceAsync("PersonalizationV2").then(async (oPersonalizationService) => {
			const oScope = {
				keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
				writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
				clientStorageAllowed: false,
				validity: Infinity
			},
			oPersId = {
				container: this._sContainerId,
				item: this._sItemId
			};

			this._oPersonalizer = await oPersonalizationService.getPersonalizer(oPersId, oScope);

			return this._oPersonalizer;
		});
	};

	HistoryGlobalDataService.prototype._getDefaultData = function () {
		return {
			historyEnabled: true,
			apps: {}
		};
	};

	HistoryGlobalDataService.prototype._isDataReady = function () {
		// Ensure that the data is loaded before requesting it
		return this._oDataReadyPromise;
	};

	HistoryGlobalDataService.prototype.getHistoryEnabled = function () {
		return this._isDataReady().then(function () {
			return this._oData.historyEnabled;
		}.bind(this));
	};

	HistoryGlobalDataService.prototype.setHistoryEnabled = function (bEnabled) {
		return this._isDataReady().then(function () {
			this._oData.historyEnabled = bEnabled;

			return this._getPersonalizer().then((oPersonalizer) => oPersonalizer.setPersData(this._oData));
		}.bind(this));
	};

	HistoryGlobalDataService.prototype.getApps = function () {
		return this._isDataReady().then(function () {
			return Object.assign({}, this._oData.apps);
		}.bind(this));
	};

	HistoryGlobalDataService.prototype.setApps = function (oApps) {
		return this._isDataReady().then(function () {
			this._oData.apps = oApps;

			return this._getPersonalizer().then((oPersonalizer) => oPersonalizer.setPersData(this._oData));
		}.bind(this));
	};

	HistoryGlobalDataService.prototype.deleteHistory = function () {
		return this._isDataReady().then(function () {
			var oData = this._oData,
				aAppIds = oData.apps,
				Container = sap.ui.require("sap/ushell/Container");

			return Container.getServiceAsync("PersonalizationV2").then((oPersonalizationService) => {
				const aDeletePromises = Object.values(aAppIds).map(function (sValue) {
					return oPersonalizationService.deleteContainer(sValue);
				});

				return Promise.all(aDeletePromises);
			});
		}.bind(this));
	};

	HistoryGlobalDataService.prototype.destroy = function () {
		BaseObject.prototype.destroy.apply(this, arguments);

		this._sContainerId = "";
		this._sItemId = "";
		this._oPersonalizer = null;
		this._oData = {};
		this._oDataReadyPromise = null;
	};

	return {
		getInstance: function () {
			if (!oInstance) {
				oInstance = new HistoryGlobalDataService();
			}
			return Promise.resolve(oInstance);
		}
	};
});
