/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['./library', 'sap/ui/core/Element'],
	function(library, Element) {
	"use strict";

	/**
	 * Constructor for a new BulletMicroChartData.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Contains the thresholds data.
	 * @extends sap.ui.core.Element
	 *
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.BulletMicroChartData
	 */
	var BulletMicroChartData = Element.extend("sap.suite.ui.microchart.BulletMicroChartData", /** @lends sap.suite.ui.microchart.BulletMicroChartData.prototype */ { metadata : {
		library: "sap.suite.ui.microchart",
		properties: {
			/**
			 * The actual value.
			 */
			value: {type: "float", group: "Misc", defaultValue: "0"},

			/**
			 * The semantic color of the actual value.
			 */
			color: {type: "sap.m.ValueColor", group: "Misc", defaultValue: "Neutral"}
		}
	}});

	BulletMicroChartData.prototype.init = function() {
		this.setAggregation("tooltip", "((AltText))", true);
	};

	BulletMicroChartData.prototype.setValue = function(fValue) {
		this._isValueSet = this._fnIsNumber(fValue);
		return this.setProperty("value", this._isValueSet ? fValue : NaN);
	};

	BulletMicroChartData.prototype._fnIsNumber = function(n) {
		return typeof n == 'number' && !isNaN(n) && isFinite(n);
	};

	BulletMicroChartData.prototype.clone = function(sIdSuffix, aLocalIds, oOptions) {
		var oClone = Element.prototype.clone.apply(this, arguments);
		oClone._isValueSet = this._isValueSet;
		return oClone;
	};

	return BulletMicroChartData;

});
