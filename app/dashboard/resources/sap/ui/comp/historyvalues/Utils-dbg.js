/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([],function() {
	"use strict";

	return {
		getAppInfo: function getAppInfo() {
			const Container = sap.ui.require("sap/ushell/Container");
			return Container.getServiceAsync("AppLifeCycle").then((oAppLifeCycleService) => {
				const oCurrentApplication = oAppLifeCycleService.getCurrentApplication(),
					oAppInfo = {};
				let oComponent, oManifest;

				if (oCurrentApplication) {
					oComponent = oCurrentApplication.componentInstance;
					oAppInfo.homePage = oCurrentApplication.homePage;
				}

				if (oComponent) {
					oManifest = oComponent.getManifest();
				}

				if (oManifest) {
					oAppInfo.id = oManifest["sap.app"].id;
				}

				return oAppInfo;
			});
		}
	};
});
