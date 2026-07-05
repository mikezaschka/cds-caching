/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([], () => {
	"use strict";

	// obsolete
	// @deprecated since 1.100
	const oPropertyInfoFlex = {};

	oPropertyInfoFlex.addPropertyInfo = {
		"changeHandler": {
			applyChange: function(oChange, oControl, mPropertyBag) {},
			completeChangeContent: function(oChange, mChangeSpecificInfo, mPropertyBag) {},
			revertChange: function(oChange, oControl, mPropertyBag) {}
		},
		"layers": {
			"USER": true
		}
	};

	return oPropertyInfoFlex;
});