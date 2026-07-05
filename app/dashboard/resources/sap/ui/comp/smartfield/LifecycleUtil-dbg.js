/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define("sap/ui/comp/smartfield/LifecycleUtil", [
	"sap/base/util/Deferred"
], function(
	Deferred
) {
	"use strict";

	/**
	 * @param {sap.ui.comp.smartfield.SmartField} oSmartField control
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.110.0
	 * @alias sap.ui.comp.smartfield.LifecycleUtil
	 */
	var LifecycleUtil = {};

	LifecycleUtil._getNextModeRenderedPromise = function () {
		var oDef = new Deferred(),
			oDelegate;

		this._oNextRendering = oDef;

		oDelegate = {
			onAfterRendering: function (oEvent) {
				var oControl = this._oControl[this.getMode()];

				if (oControl && oControl.getFocusDomRef()) {
					this.removeEventDelegate(oDelegate);

					clearInterval(this._iNMRPromiseTimeout);
					oDef.resolve(this);
				}
			}.bind(this)
		};

		this.addEventDelegate(oDelegate);

		// Safety code to reject the promise after 1 second
		this._iNMRPromiseTimeout = setInterval(oDef.reject.bind(this, "rejected by timeout"), 1000);

		return oDef.promise;
	};

	LifecycleUtil._createICRenderedDeferred = function () {
		var oDef;

		// Old deferred is never resolved we just create a new one and assign it
		// as early as possible.
		oDef = new Deferred();
		this._oRenderedWithContext = oDef;

		// SmartField is rendered with inner controls
		new Promise(function (fnResolve) {
			var oDelegate = {
				onAfterRendering: function (oEvent) {
					var oControl = this._oControl[this.getMode()],
						oContent = this.getAggregation("_content");

					if (!oControl) {
						return;
					}

					// Only resolve when we have actually rendered controls
					if (
						oControl.getDomRef() &&
						oControl.getFocusDomRef() &&
						oControl.getBindingContext() &&
						oControl === oContent
					) {
						this.removeEventDelegate(oDelegate); // Resolve once
						fnResolve();
					}
				}.bind(this)
			};

			this.addEventDelegate(oDelegate);
		}.bind(this)).then(function () {
			// We have rendered internal controls with the last binding context
			oDef.resolve();
		});
	};

	LifecycleUtil._getICRenderedPromise = function () {
		var oR = this._oRenderedWithContext;
		return oR ? oR.promise : undefined;
	};

	LifecycleUtil._rejectAll = function (sReason) {
		if (this._oNextRendering) {
			this._oNextRendering.reject(sReason);
		}
		if (this._oRenderedWithContext) {
			this._oRenderedWithContext.reject(sReason);
		}
	};

	return LifecycleUtil;

}, true);
