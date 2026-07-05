/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["sap/base/Log"], (Log) => {
	"use strict";

	/**
	 * @namespace Factory to access services outside of sap.ui.mdc library like for example <code>ushell</code> services.
	 * @name sap.ui.mdc.link.Factory
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.54.0
	 */
	return {
		getUShellContainer: function() {
			return sap.ui.require("sap/ushell/Container");
		},
		getServiceAsync: function(sServiceName) {
			const oContainer = this.getUShellContainer();
			if (!oContainer) {
				return Promise.resolve(null);
			}

			switch (sServiceName) {
				case "CrossApplicationNavigation":
					Log.error("sap.ui.mdc.link.Factory: tried to retrieve deprecated service 'CrossApplicationNavigation', please use 'Navigation' instead!");
					return oContainer.getServiceAsync("CrossApplicationNavigation");
				case "Navigation":
					return oContainer.getServiceAsync("Navigation");
				case "URLParsing":
					return oContainer.getServiceAsync("URLParsing");
				default:
					return Promise.resolve(null);
			}
		}
	};
});