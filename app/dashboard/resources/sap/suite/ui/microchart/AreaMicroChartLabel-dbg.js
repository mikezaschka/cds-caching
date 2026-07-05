/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['./library', 'sap/ui/core/Element', "sap/suite/ui/microchart/MicroChartUtils"],
	function(library, Element, MicroChartUtils) {
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * Constructor for a new AreaMicroChart control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Displays or hides the labels for start and end dates, start and end values, and minimum and maximum values.
	 * @extends sap.ui.core.Element
	 *
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.AreaMicroChartLabel
	 */
	var AreaMicroChartLabel = Element.extend("sap.suite.ui.microchart.AreaMicroChartLabel", /** @lends sap.suite.ui.microchart.AreaMicroChartLabel.prototype */ {
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
				label: {type : "string", group : "Misc", defaultValue : "" }
			}
		}
	});

	MicroChartUtils.extendMicroChartSetColor(AreaMicroChartLabel);

	return AreaMicroChartLabel;
});
