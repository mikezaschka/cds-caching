/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/m/p13n/modules/UIManager",
	"sap/ui/base/Object"
], function (UIManagerBase, BaseObject) {
    "use strict";

    var COMPUIManager = UIManagerBase.extend("sap.ui.comp.personalization.UIManager", {
		constructor: function(oAdaptationProvider) {
			this.oAdaptationProvider = oAdaptationProvider;
			BaseObject.call(this);
		}
	});

	return COMPUIManager;

});
