/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['./library', 'sap/ui/core/Element', 'sap/ui/core/Control','sap/m/library', "sap/suite/ui/microchart/MicroChartUtils"],
	function(library, Element, Control,mobileLibrary, MicroChartUtils) {
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	var Size = mobileLibrary.Size;
	/**
	 * Constructor for a new ComparisonMicroChartData.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Contains the values of the comparison chart.
	 * @extends sap.ui.core.Element
	 *
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.ComparisonMicroChartData
	 */
	var ComparisonMicroChartData = Element.extend("sap.suite.ui.microchart.ComparisonMicroChartData", /** @lends sap.suite.ui.microchart.ComparisonMicroChartData.prototype */ {
		metadata : {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The value for comparison.
				 */
				value: {type: "float", group: "Misc", defaultValue: "0"},

				/**
				 * The semantic color of the value. For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				color: { group: "Misc", type: "string", defaultValue: MicroChartColorType.Neutral  },

				/**
				 * The comparison bar title.
				 */
				title: {type: "string", group: "Misc", defaultValue: ""},

				/**
				 * If this property is set then it will be displayed instead of value.
				 */
				displayValue: {type: "string", group: "Misc", defaultValue: ""}
			},
			events: {
				/**
				 * The event is fired when the user chooses the comparison chart bar.
				 */
				press : {}
			}
		}
	});

	ComparisonMicroChartData.prototype.init = function() {
		this.setAggregation("tooltip", "((AltText))", true);
	};

	ComparisonMicroChartData.prototype.setValue = function(fValue, bSuppressInvalidate) {
		this._isValueSet = this._fnIsNumber(fValue);
		return this.setProperty("value", this._isValueSet ? fValue : NaN, bSuppressInvalidate);
	};

	ComparisonMicroChartData.prototype._fnIsNumber = function(n) {
		return typeof n == 'number' && !isNaN(n) && isFinite(n);
	};

	ComparisonMicroChartData.prototype.clone = function(sIdSuffix, aLocalIds, oOptions) {
		var oClone = Control.prototype.clone.apply(this, arguments);
		oClone._isValueSet = this._isValueSet;
		return oClone;
	};

	ComparisonMicroChartData.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.getParent()) {
			this.getParent().setBarPressable(this.getParent().getData().indexOf(this), true);
		}
		return this;
	};

	ComparisonMicroChartData.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (this.getParent()) {
			this.getParent().setBarPressable(this.getParent().getData().indexOf(this), false);
		}
		return this;
	};

	ComparisonMicroChartData.prototype.onsapenter = function(event) {
		this.firePress();
	};

	ComparisonMicroChartData.prototype.onsapspace = ComparisonMicroChartData.prototype.onsapenter;


	ComparisonMicroChartData.prototype.onclick = function(oEvent) {
		var sChartSize = this.getParent()?._getSize();
		//If the chart size is S and XS, the user must click only on the bar and not on the entire chart data
		//We ensure that "data-bar-index" is present at the bar level. If the index is not present, the press even handler is not executed
		if (sChartSize === Size.XS || sChartSize === Size.S) {
			var oBar = oEvent.target;
			if (oBar && !oBar.getAttribute("data-bar-index")) {
				return;
			}
		}
		setTimeout(() => {
			var oMenu = this.getParent()?._oMenu;
			if (!oMenu.isOpen()) {
				this.firePress();
			}
		},0);
		oEvent.preventDefault();
	};

	ComparisonMicroChartData.prototype.oncontextmenu = function(oEvent) {
		if (this.getParent()) {
			this.getParent().oncontextmenu(oEvent);
		}
	};

	MicroChartUtils.extendMicroChartSetColor(ComparisonMicroChartData);


	return ComparisonMicroChartData;

});
