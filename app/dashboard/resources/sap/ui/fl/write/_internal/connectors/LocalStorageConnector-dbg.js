/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/base/util/merge",
	"sap/ui/fl/write/api/connectors/ObjectStorageConnector"
], function(
	merge,
	ObjectStorageConnector
) {
	"use strict";

	/**
	 * Connector for saving data to the <code>window.localStorage</code>.
	 *
	 * @namespace sap.ui.fl.write._internal.connectors.LocalStorageConnector
	 * @since 1.70
	 * @private
	 * @ui5-restricted sap.ui.fl.write._internal.Connector
	 */
	var LocalStorageConnector = merge({}, ObjectStorageConnector, /** @lends sap.ui.fl.write._internal.connectors.LocalStorageConnector */ {
		storage: window.localStorage
	});

	LocalStorageConnector.loadFeatures = function(...aArgs) {
		return ObjectStorageConnector.loadFeatures.apply(this, aArgs)
		.then(function(oFeatures) {
			return merge({
				isPublicLayerAvailable: true,
				isPublicFlVariantEnabled: true,
				isVariantAdaptationEnabled: true,
				isCondensingEnabled: false
			}, oFeatures);
		});
	};

	return LocalStorageConnector;
});
