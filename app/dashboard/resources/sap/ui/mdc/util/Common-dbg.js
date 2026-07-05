/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([], () => {
	"use strict";

	const Common = {
		cleanup: function(oTarget, aFields) {
			aFields.forEach((sField) => {
				const oRemovable = oTarget[sField];
				if (oRemovable) {
					if (oRemovable.destroy && !oRemovable.bIsDestroyed) {
						oRemovable.destroy();
					}
					oTarget[sField] = null;
				}
			});
		}
	};

	return Common;

});