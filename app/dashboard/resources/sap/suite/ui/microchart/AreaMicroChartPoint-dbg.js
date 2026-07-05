/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['./library', 'sap/ui/core/Element'],
	function(library, Element) {
	"use strict";

	/**
	 * This control contains data for the point.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Contains the data for the point.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.AreaMicroChartPoint
	 */
	var AreaMicroChartPoint = Element.extend("sap.suite.ui.microchart.AreaMicroChartPoint", /** @lends sap.suite.ui.microchart.AreaMicroChartPoint.prototype */ {
		metadata : {
			library : "sap.suite.ui.microchart",
			properties : {
				/**
				 * X value for the given point.
				 */
				x: { type : "float", group : "Misc", defaultValue : null },

				/**
				 * Y value for the given point.
				 */
				y: { type : "float", group : "Misc", defaultValue : null }
			}
		}
	});

	AreaMicroChartPoint.prototype.setX = function(value, bSuppressInvalidate) {
		this._isXValue = this._isNumber(value);

		return this.setProperty("x", this._isXValue ? value : NaN, bSuppressInvalidate);
	};


	AreaMicroChartPoint.prototype.setY = function(value, bSuppressInvalidate) {
		this._isYValue = this._isNumber(value);

		return this.setProperty("y", this._isYValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Returns the x value. It returns 'undefined', if the x property was not set or an invalid number was set.
	 *
	 * @public
	 * @returns {float} The x-value, or undefined if the value set was invalid
	 */
	AreaMicroChartPoint.prototype.getXValue = function() {
		return this._isXValue ? this.getX() : undefined;
	};

	/**
	 * Returns the y value. It returns 'undefined', if the y property was not set or an invalid number was set.
	 *
	 * @public
	 * @returns {float} The y-value, or undefined if the value set was invalid
	 */
	AreaMicroChartPoint.prototype.getYValue = function() {
		return this._isYValue ? this.getY() : undefined;
	};

	AreaMicroChartPoint.prototype._isNumber = function(n) {
	    return typeof n == 'number' && !isNaN(n) && isFinite(n);
	};

	AreaMicroChartPoint.prototype.clone = function(sIdSuffix, aLocalIds, oOptions) {
		var oClone = Element.prototype.clone.apply(this, arguments);
		oClone._isXValue = this._isXValue;
		oClone._isYValue = this._isYValue;
		return oClone;
	};

	return AreaMicroChartPoint;
});
