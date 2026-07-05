/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Initialization Code and shared classes of library sap.chart.
 */
sap.ui.define([
	'sap/base/i18n/Localization',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/ui/base/DataType',
	'sap/ui/core/Lib',
	'sap/ui/core/library', // library dependency
	'sap/viz/library',
	'sap/chart/utils/RoleFitter',
	'sap/chart/utils/ChartTypeAdapterUtils',
	'sap/chart/ChartType',
	'sap/chart/data/Dimension',
	'sap/chart/data/Measure',
	'sap/chart/AutoScaleMode',
	'sap/chart/ScaleBehavior',
	'sap/chart/data/MeasureSemantics',
	'sap/chart/coloring/CriticalityType',
	'sap/chart/ColoringType',
	'sap/chart/data/DimensionRoleType',
	'sap/chart/data/MeasureRoleType'
], function(
	Localization,
	ChartFormatter,
	DataType,
	Library,
	corelib,
	vizlib,
	RoleFitter,
	ChartTypeAdapterUtils,
	ChartType,
	Dimension,
	Measure,
	AutoScaleMode,
	ScaleBehavior,
	MeasureSemantics
)	{
	"use strict";

	/**
	 * Chart controls based on Vizframe
	 *
	 * @namespace
	 * @alias sap.chart
	 * @public
	 */
	const thisLib = Library.init({
		name: "sap.chart",
		apiVersion: 2,
		dependencies: ["sap.ui.core", "sap.viz"],
		types: [
			"sap.chart.SelectionBehavior",
			"sap.chart.SelectionMode",
			"sap.chart.data.MeasureSemantics"
		],
		interfaces: [],
		controls: [
			"sap.chart.Chart"
		],
		elements: [
			"sap.chart.data.Dimension",
			"sap.chart.data.TimeDimension",
			"sap.chart.data.HierarchyDimension",
			"sap.chart.data.Measure"
		],
		noLibraryCSS: true,
		version: "1.136.0"
	});

	/**
	 * Enumeration for supported selection mode in analytical chart
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.SelectionMode = {
		/**
		 * Multi selection mode, multiple sets of data points can be selected at once.
		 * @public
		 */
		Multi: "MULTIPLE",
		/**
		 * Single selection mode, only one set of data points can be selected at once.
		 * @public
		 */
		Single: "SINGLE",
		/**
		 * None selection mode, no data points can be selected.
		 * @public
		 */
		None : "NONE"
	};
	DataType.registerEnum("sap.chart.SelectionMode", thisLib.SelectionMode);

	/**
	 * Enumeration for supported selection behavior in analytical chart
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.SelectionBehavior = {
		/**
		 * Data point selection behavior, only one data point can be selected at once.
		 * @public
		 */
		DataPoint: "DATAPOINT",
		/**
		 * Category selection behavior, one category of data points can be selected at once.
		 * @public
		 */
		Category: "CATEGORY",
		/**
		 * Series selection behavior, one seies of data points can be selected at once.
		 * @public
		 */
		Series: "SERIES"
	};
	DataType.registerEnum("sap.chart.SelectionBehavior", thisLib.SelectionBehavior);

	/**
	 * Enumeration for supported message types in analytical chart.
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.MessageId = {
		/**
		 * No data message, metadata is defined but all data values are empty.
		 * @public
		 */
		NoData: "NO_DATA",
		/**
		 * Multiple units message, multiple unites are not allowed in one measure for analytical chart.
		 * @public
		 */
		MultipleUnits: "MULTIPLE_UNITS"
	};

	/**
	 * Package with additional chart APIs.
	 * @namespace
	 * @public
	 */
	thisLib.api = {};

	let sBundleLocale;
	let oLibBundle;

	/**
	 * Returns all chart types currently supported by chart control (subset of viz types).
	 *
	 * @public
	 * @returns {object} a map with chartType as key, localized chart name as value.
	 * @alias sap.chart.api.getChartTypes
	 */
	thisLib.api.getChartTypes = function() {
		if (oLibBundle == null || sBundleLocale !== Localization.getLanguage()) {
			sBundleLocale = Localization.getLanguage();
			oLibBundle = Library.getResourceBundleFor("sap.chart");
		}
		return Object.keys(ChartType).reduce(function(oMap, sChartTypeKey) {
			var sChartType = ChartType[sChartTypeKey];
			oMap[sChartType] = oLibBundle.getText("info/" + sChartType);
			return oMap;
		}, {});
	};

	/**
	 * Package with additional chart data APIs
	 * @namespace
	 * @public
	 */
	thisLib.data = thisLib.data || {};

	/**
	 * Package with colorings enumeration
	 * @namespace
	 * @public
	 */
	thisLib.coloring = thisLib.coloring || {};

	/**
	 * Enumeration for supported ImprovementDirection types in analytical chart
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.coloring.ImprovementDirectionType = {
		/**
		 * Lower is better.
		 *
		 * Positive if the value is lower than or equal to <code>AcceptanceRangeHighValue</code>.
		 *
		 * Neutral if the value is greater than <code>AcceptanceRangeHighValue</code> and lower than or equal to <code>ToleranceRangeHighValue</code>.
		 *
		 * Critical if the value is greater than <code>ToleranceRangeHighValue</code> and lower than or equal to <code>DeviationRangeHighValue</code>.
		 *
		 * Negative if the value is greater than <code>DeviationRangeHighValue</code>.
		 * @public
		 */
		Minimize: "Minimize",

		/**
		 * Closer to the target is better.
		 *
		 * Positive if the value is greater than or equal to <code>AcceptanceRangeLowValue</code> and lower than or equal to <code>AcceptanceRangeHighValue</code>.
		 *
		 * Neutral if the value is greater than or equal to <code>ToleranceRangeLowValue</code> and lower than <code>AcceptanceRangeLowValue</code> OR greater than <code>AcceptanceRangeHighValue</code> and lower than or equal to <code>ToleranceRangeHighValue</code>.
		 *
		 * Critical if the value is greater than or equal to <code>DeviationRangeLowValue</code> and lower than <code>ToleranceRangeLowValue</code> OR greater than <code>ToleranceRangeHighValue</code> and lower than or equal to <code>DeviationRangeHighValue</code>.
		 *
		 * Negative if the value is lower than <code>DeviationRangeLowValue</code> or greater than <code>DeviationRangeHighValue</code>.
		 * @public
		 */
		Target: "Target",

		/**
		 * Higher is better.
		 *
		 * Positive if the value is greater than or equal to <code>AcceptanceRangeLowValue</code>.
		 *
		 * Neutral if the value is lower than <code>AcceptanceRangeLowValue</code> and greater than or equal to <code>ToleranceRangeLowValue</code>.
		 *
		 * Critical if the value is lower than <code>ToleranceRangeLowValue</code> and greater than or equal to <code>DeviationRangeLowValue</code>.
		 *
		 * Negative if the value is lower than <code>DeviationRangeLowValue</code>.
		 * @public
		 */
		Maximize: "Maximize"
	};
	// Note: `ImprovementDirectionType` is not yet used as type of a managed property

	/**
	 * Enumeration for supported Gradation single color scheme in analytical chart
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.coloring.GradationSingleColorScheme = {
		/**
		 * NoSemantics
		 * @public
		 */
		NoSemantics: "NoSemantics",

		/**
		 * Positive
		 * @public
		 */
		Positive: "Positive",

		/**
		 * Negative
		 * @public
		 */
		Negative: "Negative"
	};
	// Note: `GradationSingleColorScheme` is not yet used as type of a managed property

	/**
	 * Enumeration for supported Gradation diverging color scheme in analytical chart
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.coloring.GradationDivergingColorScheme = {
		/**
		 * NoSemantics
		 * @public
		 */
		NoSemantics: "NoSemantics",

		/**
		 * PositiveToNegative
		 * @public
		 */
		PositiveToNegative: "PositiveToNegative",

		/**
		 * NegativeToPositive
		 * @public
		 */
		NegativeToPositive: "NegativeToPositive",

		/**
		 * PositiveToNegative
		 * @public
		 */
		ColdToHot: "ColdToHot",

		/**
		 * HotToCold
		 * @public
		 */
		HotToCold: "HotToCold"
		};

		/**
		 * Enumeration for supported Gradation target color scheme in analytical chart
		 *
		 * @enum {string}
		 * @public
		 */
		thisLib.coloring.GradationTargetColorScheme = {
		/**
		 * PositiveTarget
		 * @public
		 */
		PositiveTarget: "PositiveTarget"
	};
	// Note: `GradationDivergingColorScheme` is not yet used as type of a managed property

	/**
	 * Enumeration for supported Gradation color saturation in analytical chart
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.coloring.GradationSaturation = {
		/**
		 * LightToDark
		 * @public
		 */
		LightToDark: "LightToDark",

		/**
		 * DarkToLight
		 * @public
		 */
		DarkToLight: "DarkToLight"
	};
	// Note: `GradationSaturation` is not yet used as type of a managed property

	/**
	 * Get the Dimensions and Measures layout for a certain ChartType with provided Dimensions and Measures.
	 *
	 * @param {string} sChartType chart type
	 * @param {object[]|sap.chart.data.Dimension[]} aDimensions visible Dimensions of the form {name: sName} or {@link sap.chart.data.Dimension} instance.
	 * @param {object[]|sap.chart.data.Measure[]} aMeasures visible Measures of the form {name: sName} or {@link sap.chart.data.Measure} instance.
	 *
	 * @public
	 * @returns {object} the chart layout object of the following form:
	 * <pre>
	 * {
	 *   dimensions: [],     // names of dimensions that will be rendered
	 *	 measures:	 [],     // names of measures that will be rendered
	 *	 errors:	 [],     // reasons of why the chart cannot be rendered with the given (chartType, dimensions, measures) combination
	 * }
	 * </pre>
	 * @alias sap.chart.api.getChartTypeLayout
	 */
	thisLib.api.getChartTypeLayout = function(sChartType, aDimensions, aMeasures) {
		var aDims, aMsrs;
		if (!sChartType) {
			throw new Error("Invalid chart type: " + String(sChartType));
		}
		if (aDimensions) {
			aDims = aDimensions.map(function(oDimCfg, i) {
				if (oDimCfg instanceof Dimension) {
					return oDimCfg;
				} else  if (oDimCfg && (oDimCfg.name)) {
					return {
						getName: function() {return oDimCfg.name;},
						getRole: function() {return oDimCfg.role || "category";}
					};
				} else {
					throw new Error("Invalid Dimension at [" + i + "]: " + String(oDimCfg) + ". Dimension should be an object of the format{name:'name'} or an instance of sap.chart.data.Dimension.");
				}
			});
		} else {
			aDims = [];
		}
		if (aMeasures) {
			aMsrs = aMeasures.map(function(oMsrCfg, i) {
				if (oMsrCfg instanceof Measure){
					return oMsrCfg;
				} else if (oMsrCfg && oMsrCfg.name) {
					return {
						getName: function() {return oMsrCfg.name;},
						getRole: function() {return oMsrCfg.role || "axis1";}
					};
				} else {
					throw new Error("Invalid Measure at [" + i + "]: " +  String(oMsrCfg) + ". Measure should be an object of the format{name:'name'} or an instance of sap.chart.data.Measure.");
				}
			});
		} else {
			aMsrs = [];
		}
		var adapteredChartType = ChartTypeAdapterUtils.adaptChartType(sChartType, aDims);
		var oCompatibility = RoleFitter.compatible(adapteredChartType, aDims, aMsrs);

		return {
			dimensions: oCompatibility.used.Dimension || [],
			measures: oCompatibility.used.Measure || [],
			errors: Object.keys(oCompatibility.error || {}).reduce(function(aErrs, sCause) {
				return aErrs.concat({cause: sCause, detail: oCompatibility.error[sCause]});
			}, [])
		};
	};

	var chartFormatter = ChartFormatter.getInstance();

	if (!(sap.viz.api.env.Format.numericFormatter() instanceof ChartFormatter)) {
		sap.viz.api.env.Format.numericFormatter(chartFormatter);
	}

	return thisLib;

});