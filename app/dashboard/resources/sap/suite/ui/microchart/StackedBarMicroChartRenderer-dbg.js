/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
		'sap/m/library',
		'sap/ui/core/theming/Parameters',
		'./library',
		'sap/suite/ui/microchart/MicroChartRenderUtils'
	], function(mobileLibrary, Parameters, library, MicroChartRenderUtils) {
	"use strict";

	const MicroChartColorType = library.MicroChartColorType;

	/**
	 * StackedBarMicroChart renderer.
	 * @namespace
	 */
	var StackedBarMicroChartRenderer = {
		apiVersion: 2    // enable in-place DOM patching
	};

	StackedBarMicroChartRenderer.LABEL_COLOR_LIGHT = "#ffffff";
	StackedBarMicroChartRenderer.LABEL_COLOR_DARK = "#000000";
	StackedBarMicroChartRenderer.COLORNAME_TO_HEX_MAP = {aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc",
		bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0",
		chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", cyan: "#00ffff",
		darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", darkgreen: "#006400", darkkhaki: "#bdb76b", darkmagenta: "#8b008b",
		darkolivegreen: "#556b2f", darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
		darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff",
		dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc",
		ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", grey: "#808080", green: "#008000", greenyellow: "#adff2f", honeydew: "#f0fff0", hotpink: "#ff69b4",
		indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00",
		lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgrey: "#d3d3d3", lightgray: "#d3d3d3",
		lightgreen: "#90ee90", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899",
		lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6", magenta: "#ff00ff", maroon: "#800000",
		mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370d8", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee",
		mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1",
		moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23", orange: "#ffa500", orangered: "#ff4500",
		orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#d87093", papayawhip: "#ffefd5", peachpuff: "#ffdab9",
		peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399", red: "#ff0000", rosybrown: "#bc8f8f",
		royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d",
		silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c",
		teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff", whitesmoke: "#f5f5f5",
		yellow: "#ffff00", yellowgreen: "#9acd32"};

	StackedBarMicroChartRenderer.SEMANTIC_COLORS = {
		Good: "Good",
		Error: "Bad",
		Critical: "Critical",
		Neutral: "Neutral",
		Sequence1: "Sequence1",
		Sequence2: "Sequence2",
		Sequence3: "Sequence3",
		Sequence4: "Sequence4",
		Sequence5: "Sequence5",
		Sequence6: "Sequence6",
		Sequence7: "Sequence7",
		Sequence8: "Sequence8",
		Sequence9: "Sequence9",
		Sequence10: "Sequence10",
		Sequence11: "Sequence11",
		Sequence12: "Sequence12"
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.StackedBarMicroChart} oControl The control to be rendered
	 */
	StackedBarMicroChartRenderer.render = function (oRm, oControl) {
		if (oControl._hasData()) {
			var aChartData = oControl._calculateChartData();

			if (!oControl._bThemeApplied) {
				return;
			}
			this._aBars = oControl.getAggregation("bars");
			oRm.openStart("div", oControl);
			this._writeMainProperties(oRm, oControl);

			// tooltip and aria label
			var sTooltip = oControl.getTooltip_AsString();
			if (sTooltip && typeof sTooltip === "string") {
				oRm.attr("title", sTooltip);
			}

			oRm.openEnd();
			this._renderInnerContent(oRm, oControl, aChartData);
			oRm.close("div");
		} else {
			this._renderNoData(oRm, oControl);
		}
	};

		/**
		 * Renders control data and prepares default classes and styles
		 *
		 * @param {object} oRm render manager
		 * @param {object} oControl AreaMicroChart control
		 * @private
		 */
		StackedBarMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
			var bIsActive = oControl.hasListeners("press");

			this._renderActiveProperties(oRm, oControl);

			oRm.attr("role", "figure");

			if (oControl.getAriaLabelledBy().length) {
				oRm.accessibilityState(oControl);
			} else {
				oRm.attr("aria-label",
					oControl.getTooltip_AsString(bIsActive));
			}

			oRm.class("sapSuiteStackedMC");
			oRm.class("sapSuiteStackedMCSize" + oControl.getSize());

			oRm.style("width", oControl.getWidth());
			oRm.style("height", oControl.getHeight());
		};

	/**
	 * Renders the control's inner content, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.StackedBarMicroChart} oControl The control to be rendered
	 * @param {Object} chartData The calculated data needed for the chart to be displayed
	 */
	StackedBarMicroChartRenderer._renderInnerContent = function (oRm, oControl, chartData) {
		oRm.openStart("div");
		oRm.class("sapSuiteStackedMCContainer");
		oRm.openEnd();

		for (var i = 0; i < chartData.length; i++) {
			this._renderChartBar(oRm, oControl, chartData[i], i);
		}

		oRm.close("div");
	};

	/**
	 * Renders the bar area for the given control.
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.StackedBarMicroChart} oControl The control to be rendered
	 * @param {Object} oDataBar The calculated data needed for the bar to be displayed
	 */
	StackedBarMicroChartRenderer._renderChartBar = function(oRm, oControl, oDataBar) {
		if (!oControl.getDisplayZeroValue() && oDataBar.width === 0) {
			return;
		}

		var bRenderLabels = oControl.getShowLabels();

		if (oDataBar.oBarData) {
			oRm.openStart("div", oDataBar.oBarData);
		} else {
			oRm.openStart("div");
		}
		oRm.class("sapSuiteStackedMCBar");
		if (oControl.getDisplayZeroValue() && oDataBar?.oBarData?.getValue() === 0) {
		oRm.class("sapSuiteStackedMCBarZeroValue");
		}

		if (!oDataBar.color) {
			oRm.style("background-color", "transparent");
		} else if (MicroChartColorType.hasOwnProperty(oDataBar.color)) {
			oRm.class("sapSuiteStackedMCBarSemanticColor" + oDataBar.color);
		} else {
			/**
				* @deprecated As of version 1.120
			*/
			oRm.style("background-color", Parameters.get(oDataBar.color) || oDataBar.color);
		}
		oRm.style("width", oDataBar.width + "%");
		oRm.openEnd();
		if (bRenderLabels) {
			this._renderChartBarLabel(oRm, oDataBar.displayValue, oDataBar.color);
		}
		oRm.close("div");
	};

	/**
	 * Renders the label text for the current bar area.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {string} displayValue The value that should be displayed
	 */
	StackedBarMicroChartRenderer._renderChartBarLabel = function(oRm, displayValue, color) {
		if (!displayValue) {
			return;
		}
		oRm.openStart("div");
		oRm.class("sapSuiteStackedMCBarLabel");
		if (Object.values(StackedBarMicroChartRenderer.SEMANTIC_COLORS).includes(color)) {
			oRm.class("sapSuiteStackedMCBarLabel" + color);
		}
		oRm.openEnd();
		oRm.text(displayValue);
		oRm.close("div");
	};

	/**
	 * Returns the color css parameter
	 *
	 * @private
	 * @param {string} color The bar color
	 * @returns {string} The css parameter
	 */
	StackedBarMicroChartRenderer._getValueCssParameter = function(color) {
		var sSemanticColor = this.SEMANTIC_COLORS[color] ? "sapChart_Sequence_" + this.SEMANTIC_COLORS[color] :  "sapUi" + color + "Element";
		return sSemanticColor;
	};

	MicroChartRenderUtils.extendMicroChartRenderer(StackedBarMicroChartRenderer);

	return StackedBarMicroChartRenderer;

}, /* bExport= */ true);
