/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
// -------------------------------------------------------------------------------
// Helper class used for generic ODataModel related handling
// -------------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/core/Lib",
	"sap/ui/model/odata/v2/ODataModel"
], function(Lib, ODataModelV2) {
	"use strict";
	/**
	 * Object used to for generic ODataModel related handling
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var ODataModelUtil = {
		/**
		 * Static function that takes care of ODataModel initialisation (all parameters are mandatory)
		 *
		 * @param {Object} oSmartControl - the Smart control (e.g. SmartTable, SmartFilter)
		 * @param {function} fModelInitCallback - the callback function (will be triggered in the SmartControl scope)
		 * @param {boolean|object[]} vWaitForFlexChanges - defines whether an await for flex changes is to be done.
		 *           Add support to wait for flex changes for inner control via 'complexSelectors', e.g., [{selector: oSmartControl, changeTypes: ["addXML", "someOtherChangeType"]}]
		 * @private
		 */
		handleModelInit: function(oSmartControl, fModelInitCallback, vWaitForFlexChanges) {
			var bLoadMetadataAsync = false, oModel;
			if (oSmartControl && !oSmartControl._bMetaModelLoadAttached && fModelInitCallback) {
				oModel = oSmartControl.getModel();
				if (oModel) {
					// Check if ODataMetaModel was loaded
					// If not, delay the creation of table content/helpers until ODataMetaModel is loaded!
					// Do this only for async ODataModel
					if (oModel.getMetadata() && oModel instanceof ODataModelV2) {
						bLoadMetadataAsync = true; // always true for v2.ODataModel
					} else if (oModel.bLoadMetadataAsync || (oModel.getServiceMetadata && !oModel.getServiceMetadata())) {
						bLoadMetadataAsync = true; // assume async if bLoadMetadataAsync or if no service metadata has been loaded for the ODataModel
					}
					oSmartControl._bMetaModelLoadAttached = true;
					if (bLoadMetadataAsync && oModel.getMetaModel() && oModel.getMetaModel().loaded) {
						var bWaitForFlexChanges = !!vWaitForFlexChanges;
						if (!bWaitForFlexChanges) {
							// wait for the ODataMetaModel loaded promise to be resolved
							oModel.getMetaModel().loaded().then(fModelInitCallback.bind(oSmartControl));
						} else {
							this._getFlexRuntimeInfoAPI().then(function(FlexRuntimeInfoAPI) {
								var pFlexChanges;
								if (!FlexRuntimeInfoAPI.isFlexSupported({element: oSmartControl})) {
									pFlexChanges = Promise.resolve();
								} else if (typeof vWaitForFlexChanges === "boolean"){
									pFlexChanges = FlexRuntimeInfoAPI.waitForChanges({element: oSmartControl});
								} else {
									pFlexChanges = FlexRuntimeInfoAPI.waitForChanges({complexSelectors: vWaitForFlexChanges});
								}
								Promise.all([oModel.getMetaModel().loaded(), pFlexChanges]).then(fModelInitCallback.bind(oSmartControl));
							});
						}
					} else {
						// Could be a non ODataModel or a synchronous ODataModel --> just create the necessary helpers
						fModelInitCallback.apply(oSmartControl);
					}
				}
			}
		},
		_getFlexRuntimeInfoAPI: function() {
			return Lib.load('sap.ui.fl').then(function() {
				return new Promise(function(fResolve) {
					sap.ui.require([
						"sap/ui/fl/apply/api/FlexRuntimeInfoAPI"
					], function(FlexRuntimeInfoAPI) {
						fResolve(FlexRuntimeInfoAPI);
					});
				});
			});
		}
	};
	return ODataModelUtil;
}, /* bExport= */true);
