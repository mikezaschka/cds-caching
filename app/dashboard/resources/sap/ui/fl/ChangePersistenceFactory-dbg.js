/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/fl/apply/_internal/flexState/ManifestUtils",
	"sap/ui/fl/ChangePersistence"
], function(
	ManifestUtils,
	ChangePersistence
) {
	"use strict";

	/**
	 * Factory to get or create a new instances of {sap.ui.fl.ChangePersistence}
	 * @constructor
	 * @alias sap.ui.fl.ChangePersistenceFactory
	 * @since 1.27.0
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @ui5-restricted sap.ui.fl
	 */
	var ChangePersistenceFactory = {};
	ChangePersistenceFactory._instanceCache = {};

	/**
	 * Creates or returns an instance of the ChangePersistence
	 * @param {string} sComponentName - Name of the component
	 * @returns {sap.ui.fl.ChangePersistence} <code>ChangePersistence</code> instance
	 */
	ChangePersistenceFactory.getChangePersistenceForComponent = function(sComponentName) {
		var oChangePersistence = ChangePersistenceFactory._instanceCache[sComponentName];
		if (!oChangePersistence) {
			var oComponent = {
				name: sComponentName
			};
			oChangePersistence = new ChangePersistence(oComponent);
			ChangePersistenceFactory._instanceCache[sComponentName] = oChangePersistence;
		}

		return oChangePersistence;
	};

	/**
	 * Creates or returns an instance of the ChangePersistence for the component of the specified control.
	 * The control needs to be embedded into a component.
	 * @param {sap.ui.core.Control} oControl The control for example a SmartField, SmartGroup or View
	 * @returns {sap.ui.fl.ChangePersistence} instance
	 */
	ChangePersistenceFactory.getChangePersistenceForControl = function(oControl) {
		var sComponentId;
		sComponentId = ManifestUtils.getFlexReferenceForControl(oControl);
		return ChangePersistenceFactory.getChangePersistenceForComponent(sComponentId);
	};

	return ChangePersistenceFactory;
});