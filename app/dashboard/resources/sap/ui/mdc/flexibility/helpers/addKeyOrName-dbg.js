/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
], () => {
	"use strict";

	/*
	 * Similar to PropertyInfo format changes, we want to interpolate 'key' or 'name' until all consuming code is updated.
	 */
	const addKeyOrName = (oTarget) => {

		if ('key' in oTarget && 'name' in oTarget && oTarget.key !== oTarget.name) {
			throw new Error(`The values of legacy-attribute 'name' and it's replacement 'key' must be identical.`, oTarget);
		}

		const sKey = oTarget.key || oTarget.name;

		oTarget.key = sKey;
		oTarget.name = sKey;

		return oTarget;
	};

	return addKeyOrName;
});
