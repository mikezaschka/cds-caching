/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/* global */

sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/deepEqual"
], function(
	BaseObject,
	deepEqual
) {
	"use strict";

	var ValueListDelegate = BaseObject.extend("sap.ui.comp.smartfield.ValueListDelegate", /** @lends sap.ui.comp.smartfield.ValueListDelegate.prototype */ {
		constructor: function(oValueListProvider) {
			BaseObject.apply(this, arguments);
			this.oValueListProvider = oValueListProvider;
		}
	});

	ValueListDelegate.prototype.fetchIDAndDescriptionCollectionIfRequired = function() {
		if (!this.oValueListProvider.bInitialised) {
			return;
		}

		this.oValueListProvider._calculateFilterInputData();

		if (!deepEqual(this.oValueListProvider._mLastFilterInputData, this.oValueListProvider.mFilterInputData)) {
				this.oValueListProvider._fetchData();
				this.oValueListProvider._mLastFilterInputData = this.oValueListProvider.mFilterInputData;
		}
	};

	ValueListDelegate.prototype.destroy = function() {
		this.oValueListProvider = null;
	};

	return ValueListDelegate;
});
