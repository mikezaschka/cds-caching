/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/base/Log"], function(Log) {
	"use strict";

	function ChartLog(sType, sName, sMessage) {
		this._type = sType;
		this._name = sName;
		this._message = sMessage;
	}

	ChartLog.prototype.display = function() {
		if (this._type === "error") {
			Log.error("[Analytical Chart] " + this._name, this._message);
		}
	};

	return ChartLog;
});