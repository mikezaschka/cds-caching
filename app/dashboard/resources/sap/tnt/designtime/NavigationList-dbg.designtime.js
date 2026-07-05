/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides the design time metadata for the sap.tnt.NavigationList control
sap.ui.define([
], function () {
	"use strict";

	return {
		aggregations: {
			items: {
				domRef: ":sap-domref",
				actions: {
					move: "moveControls"
				}
			}
		}
	};
});