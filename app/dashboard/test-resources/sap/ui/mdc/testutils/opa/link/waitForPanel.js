/*!
 * OpenUI5
 * (c) Copyright 2026 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/test/Opa5"
], function(
	Opa5
) {
	"use strict";

	const sPanelControlType = "sap.ui.mdc.link.Panel";

	return function fnWaitForPanel(oSettings) {
		return this.waitFor({
			...oSettings,
			controlType: sPanelControlType,
			success: function(aPanels) {
				Opa5.assert.equal(aPanels.length, 1, `should see ${sPanelControlType}`);
				const oPanel = aPanels[0];

				if (oSettings && typeof oSettings.success === "function") {
					oSettings.success.call(this, oPanel);
				}
			}
		});
	};

});
