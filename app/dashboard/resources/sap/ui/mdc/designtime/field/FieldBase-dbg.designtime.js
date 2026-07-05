/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/mdc/field/FieldBase", "../Util"
], (FieldBase, Util) => {
	"use strict";

	const oDesignTime = {};

	const aAllowedAggregations = [],
		aAllowedProperties = [];

	return Util.getDesignTime(FieldBase, aAllowedProperties, aAllowedAggregations, oDesignTime);

});