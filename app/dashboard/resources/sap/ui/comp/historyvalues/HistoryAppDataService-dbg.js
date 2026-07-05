/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/ui/base/Object",
	"./Constants",
	"./Utils",
	"./HistoryGlobalDataService"
], function(Localization, BaseObject, constants, HistoryUtils, HistoryGlobalDataService) {
	"use strict";

	/**
	 * Service to communicate with the application container for the history values.
	 *
	 * The application container is responsible to store the following information about the
	 * history values:
	 * - history for each field in the application
	 *
	 * Each application should instantiate the service from the beginning, because container
	 * ids for different applications is different. Each application has separate container
	 * and stores only its data. The container id is obtained from the global container
	 * by key. The key is the name of the application obtained from the manifest. The container ID
	 * is random unique 36 hash
	 *
	 * @private
	 * @author SAP SE
	 */
	var DEFAULT_LANGUAGE = "en";
	var oInstance;
	var HistoryAppDataService = BaseObject.extend("sap.ui.comp.historyvalues.HistoryAppDataService", {
		constructor: function () {
			BaseObject.apply(this, arguments);

			this._initialize();
		}
	});

	HistoryAppDataService.prototype._initialize = function () {
		this._initializeAppContainerId = this._initializeAppContainerId.bind(this);
		this._initializeAppData = this._initializeAppData.bind(this);

		this._sContainerId = "";
		this._oPersonalizer = null;
		this._sAppId = "";
		this._oData = {};

		this._oDataReadyPromise = this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.getApps())
			.then(this._initializeAppContainerId)
			.then(this._initializeAppData);
	};

	HistoryAppDataService.prototype._getHistoryGlobalDataService = function () {
		return HistoryGlobalDataService.getInstance();
	};

	HistoryAppDataService.prototype._initializeAppContainerId = function (oAppContainerIds) {
		return HistoryUtils.getAppInfo().then((oAppInfo) => {
			this._sAppId = constants.getHistoryPrefix() + oAppInfo.id;
			this._sContainerId = oAppContainerIds[this._sAppId];

			if (!this._sContainerId) {
				this._createAndSaveContainerId(oAppContainerIds);
			}

			return this._sContainerId;
		});
	};

	HistoryAppDataService.prototype._initializeAppData = function () {
		return this._getPersonalizer().then((oPersonalizer) => oPersonalizer.getPersData()).then(function (oData) {
			this._oData = oData || this._getDefaultData();

			return this._oData;
		}.bind(this));
	};

	HistoryAppDataService.prototype._getPersonalizer = function () {
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
				item: constants.getHistoryPrefix() + "appData"
			};

			this._oPersonalizer = await oPersonalizationService.getPersonalizer(oPersId, oScope);

			return this._oPersonalizer;
		});
	};

	HistoryAppDataService.prototype._createAndSaveContainerId = function (oAppContainerIds) {
		this._sContainerId = this._createContainerId();

		oAppContainerIds[this._sAppId] = this._sContainerId;

		this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.setApps(oAppContainerIds));
	};

	HistoryAppDataService.prototype._createContainerId = function () {
		var sUuid = "xxxxxxxx.xxxx.4xxx.yxxx.xxxxxxxxxxxx".replace(/[xy]/g, function (sPosition) {
			var iRandom = Math.random() * 16 | 0;

			if (sPosition === 'y') {
				iRandom = iRandom & 0x3 | 0x8;
			}

			return iRandom.toString(16);
		});

		return constants.getShortHistoryPrefix() + sUuid;
	};

	HistoryAppDataService.prototype._getDefaultData = function () {
		return {};
	};

	HistoryAppDataService.prototype._isDataReady = function () {
		// Ensure that the data is loaded before requesting it
		return this._oDataReadyPromise;
	};

	HistoryAppDataService.prototype._getHistoryEnabled = function () {
		return this._getHistoryGlobalDataService().then((oHistoryGlobalDataService) => oHistoryGlobalDataService.getHistoryEnabled());
	};

	HistoryAppDataService.prototype.getFieldData = function (sFieldName) {
		return this._isDataReady()
			.then(this._getHistoryEnabled.bind(this))
			.then(function (bEnabled) {
				if (!bEnabled) {
					return [];
				}

				var aData = [],
					sLanguage = this._getLanguage();

				if (this._isDefaultLanguage(sLanguage)) {
					// For backwards compatibility for english store the data in the root level of the data object
					aData = this._oData[sFieldName] || [];
				} else {
					// For all the other languages create an object with language id to store the data
					var sDataLanguageKey = constants.getHistoryPrefix() + sLanguage;

					if (!this._oData[sDataLanguageKey]) {
						aData = [];
					} else {
						aData = this._oData[sDataLanguageKey][sFieldName] || [];
					}
				}

				return aData.slice();
			}.bind(this));
	};

	HistoryAppDataService.prototype.setFieldData = function (sFieldName, aData) {
		return this._isDataReady()
			.then(this._getHistoryEnabled.bind(this))
			.then(function (bEnabled) {
				if (!bEnabled) {
					return false;
				}

				var sLanguage = this._getLanguage();

				if (this._isDefaultLanguage(sLanguage)) {
					// For backwards compatibility for english store the data in the root level of the data object
					this._oData[sFieldName] = aData;
				} else {
					// For all the other languages create an object with language id to store the data
					var sDataLanguageKey = constants.getHistoryPrefix() + sLanguage;

					if (!this._oData[sDataLanguageKey]) {
						this._oData[sDataLanguageKey] = {};
					}

					this._oData[sDataLanguageKey][sFieldName] = aData;
				}

				return this._getPersonalizer().then((oPersonalizer) => oPersonalizer.setPersData(this._oData));
			}.bind(this));
	};

	HistoryAppDataService.prototype._getLanguage = function () {
		var sLanguage = Localization.getLanguage() || DEFAULT_LANGUAGE;
		var aMatch = sLanguage.match(/[a-z]+/i);

		if (aMatch[0]) {
			sLanguage = aMatch[0].toLowerCase();
		}

		return sLanguage;
	};

	HistoryAppDataService.prototype._isDefaultLanguage = function (sLanguage) {
		return sLanguage === DEFAULT_LANGUAGE;
	};

	HistoryAppDataService.prototype.destroy = function () {
		BaseObject.prototype.destroy.apply(this, arguments);

		this._sContainerId = "";
		this._oPersonalizer = null;
		this._sAppId = "";
		this._oData = {};
		this._oDataReadyPromise = null;
	};

	return {
		getInstance: function () {
			if (!oInstance) {
				oInstance = new HistoryAppDataService();
			}

			return Promise.all([oInstance._isDataReady(), HistoryUtils.getAppInfo()]).then((results) => {
				const [, oAppInfo] = results;
				const sCurrentAppId = constants.getHistoryPrefix() + oAppInfo.id;
				if (oInstance._sAppId !== sCurrentAppId) {
					// If saved application id is different then the current application id
					// Then destroy the current service instance and create a new one
					// for the new application
					oInstance.destroy();
					oInstance = new HistoryAppDataService();
				}

				return oInstance._isDataReady().then(() => oInstance);
			});
		}
	};
});
