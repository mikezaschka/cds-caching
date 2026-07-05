/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Element",
	"./AreaMicroChartPoint",
	"sap/suite/ui/microchart/MicroChartUtils"
], function(library, Element, AreaMicroChartPoint,MicroChartUtils) {
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * The configuration of the graphic element on the chart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Graphical representation of the area micro chart regarding the value lines, the thresholds, and the target values.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.AreaMicroChartItem
	 */
	var AreaMicroChartItem = Element.extend("sap.suite.ui.microchart.AreaMicroChartItem", /** @lends sap.suite.ui.microchart.AreaMicroChartItem.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The graphic element color. For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				color: { group: "Misc", type: "string", defaultValue: MicroChartColorType.Neutral  },

				/**
				 * The line title.
				 */
				title: { type: "string", group: "Misc", defaultValue: null }
			},
			defaultAggregation: "points",
			aggregations: {

				/**
				 * The set of points for this graphic element.
				 */
				"points": { multiple: true, type: "sap.suite.ui.microchart.AreaMicroChartPoint", defaultClass: AreaMicroChartPoint, bindable: "bindable" }
			}
		}
	});

	AreaMicroChartItem.prototype.init = function() {
		this.setAggregation("tooltip", "((AltText))", true);
	};

	MicroChartUtils.extendMicroChartSetColor(AreaMicroChartItem);

	return AreaMicroChartItem;
});
