/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides sap.suite.ui.microchart.LineMicroChartEmphasizedPoint control.
sap.ui.define(["sap/suite/ui/microchart/MicroChartUtils", "./library", "sap/suite/ui/microchart/LineMicroChartPoint"],
	function(MicroChartUtils, library, LineMicroChartPoint) {
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * Constructor for a new LineMicroChartEmphasizedPoint.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Contains the emphasized point of the line micro chart.
	 * @extends sap.suite.ui.microchart.LineMicroChartPoint
	 *
	 * @version 1.136.0
	 * @since 1.48.0
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.LineMicroChartEmphasizedPoint
	 */
	var LineMicroChartEmphasizedPoint = LineMicroChartPoint.extend("sap.suite.ui.microchart.LineMicroChartEmphasizedPoint", /** @lends sap.suite.ui.microchart.LineMicroChartEmphasizedPoint.prototype */ {
		metadata: {
			properties: {
				/**
				 * Determines the color of the emphasized point.
				 * The property has an effect only if the 'show' property is true.
				 * If at least one emphasized point has a color different from Neutral, the graph is grey; otherwise, the graph is blue.
				 *
				 * For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value (or type, or property) will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				color: { group: "Misc", type: "string", defaultValue: MicroChartColorType.Neutral },
				/**
				 * Determines whether the chart point should be displayed or not.
				 */
				show: {type: "boolean", group: "Appearance", defaultValue: false}
			}
		}
	});

	MicroChartUtils.extendMicroChartSetColor(LineMicroChartEmphasizedPoint);

	return LineMicroChartEmphasizedPoint;

});
