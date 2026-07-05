/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['./library', 'sap/ui/core/Element', "sap/suite/ui/microchart/MicroChartUtils"],
	function(library, Element, MicroChartUtils) {
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * Constructor for a new ColumnMicroChartData control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Defines the column chart data.
	 * @extends sap.ui.core.Element
	 *
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.ColumnMicroChartData
	 */
	var ColumnMicroChartData = Element.extend("sap.suite.ui.microchart.ColumnMicroChartData", /** @lends sap.suite.ui.microchart.ColumnMicroChartData.prototype */ {
		metadata : {
			library : "sap.suite.ui.microchart",
			properties : {

				/**
				 * The graphic element color. For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				color: { group: "Misc", type: "string", defaultValue: MicroChartColorType.Neutral  },

				/**
				 * The line title.
				 */
				label: {type : "string", group : "Misc", defaultValue : "" },

				/**
				 * Overrides the value with a string that is shown when used in combination with
				 * {@link sap.suite.ui.microchart.ColumnMicroChart} <code>allowColumnLabels</code>.
				 */
				displayValue: { type: "string", group: "Appearance" },

				/**
				 * The actual value.
				 */
				value: {type: "float", group : "Misc"}
			},
			events: {
				/**
				 * The event is fired when the user chooses the column data.
				 */
				press: {}
			}
		}
	});

	ColumnMicroChartData.prototype.init = function() {
		this.setAggregation("tooltip", "((AltText))", true);
	};

	ColumnMicroChartData.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Element.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.getParent() && sEventId === "press") {
			this.getParent().setBarPressable(this, true);
		}
		return this;
	};

	ColumnMicroChartData.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Element.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (this.getParent() && sEventId === "press") {
			this.getParent().setBarPressable(this, false);
		}
		return this;
	};

	MicroChartUtils.extendMicroChartSetColor(ColumnMicroChartData);

	return ColumnMicroChartData;

});
