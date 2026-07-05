/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * @namespace Factory to access <code>ushell</code> services.
 * @name sap.ui.comp.navpopover.Factory
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.36.0
 */
sap.ui.define([
	'sap/ui/comp/library',
	'sap/base/Log'
], function(CompLibrary, Log) {
	"use strict";
	var Factory = {

		getUShellContainer: function() {
			return sap.ui.require("sap/ushell/Container");
		},
		getService: function(sServiceName, bAsync) {
			if (!bAsync) {
				Log.warning("sap.ui.comp.navpopover.Factory: calling getService synchronously should not be done as it's deprecated.");
				return null;
			}

			return this.getServiceAsync(sServiceName);
		},
		getServiceAsync: function(sServiceName) {
			const oShellContainer = this.getUShellContainer();
			if (!oShellContainer) {
				return Promise.resolve(null);
			}

			switch (sServiceName) {
				case "CrossApplicationNavigation":
					Log.warning("sap.ui.comp.navpopover.Factory: Service 'CrossApplicationNavigation' should not be used as it's deprecated.");
					return oShellContainer.getServiceAsync("CrossApplicationNavigation");
				case "URLParsing":
					return oShellContainer.getServiceAsync("URLParsing");
				case "Navigation":
					return oShellContainer.getServiceAsync("Navigation");
				default:
					return Promise.resolve(null);
			}
		}
	};

	return Factory;
}, /* bExport= */true);
