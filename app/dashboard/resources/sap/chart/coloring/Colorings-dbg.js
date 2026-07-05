/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/chart/coloring/criticality/Criticality",
	"sap/chart/coloring/emphasis/Emphasis",
	"sap/chart/coloring/gradation/Gradation",
	'sap/chart/ChartLog',
	"sap/ui/thirdparty/jquery"
], function(Criticality, Emphasis, Gradation, ChartLog, jQuery) {
	"use strict";

	var SUPPORTED_TYPES = ['Criticality', 'Emphasis', 'Gradation'];

	function checkColoring(oColorings, oActiveColoring, oDimMsr) {
		var inResultDim = oDimMsr.aInResultDim,
			sColoring = oActiveColoring.coloring || null;
		if (inResultDim && inResultDim.length) {
			//clid1
			throw new ChartLog('error', '', "Semantic coloring could not be applied if inResult Dimensions exist.");
		}
		if (!oActiveColoring || !oActiveColoring.coloring) {
			//clid2
			throw new ChartLog('error', 'activeColoring', "The activeColoring is mandatory.");
		}
		if (SUPPORTED_TYPES.indexOf(sColoring) < 0) {
			//clid3
			throw new ChartLog('error', 'activeColoring', "The active coloring type, " + sColoring + ", is not supported.");
		} else if (Object.keys(oColorings).indexOf(sColoring) < 0){
			//clid4
			throw new ChartLog('error', 'activeColoring', "The active coloring type, " + sColoring + ", should be configured in Coloring.");
		}
	}

	function skipTimeBullet(aMsr){
		if (aMsr.length <= 1) {
			return false;
		}
		if (aMsr.length > 2) {
			return true;
		}

		var actual, reference, error = false;
		aMsr.forEach(function(e){
			var name = e.getSemantics();
			if (name === "actual" && !actual) {
				actual = e;
			} else if (name === "reference" && !reference) {
				reference = e;
			} else {
				error = true;
			}
		});

		error = error || (actual && reference && actual.getSemanticallyRelatedMeasures() !== reference.getName());
		return error;
	}

	return {
		getCandidateSetting: function(oColorings, oActiveColoring, aTuples, oDimMsr, oStatus, sChartType, oLocale, ops) {
			checkColoring(oColorings, oActiveColoring || {}, oDimMsr);
			var coloringClz, options = {},
				colorMapping = {
					'Criticality': Criticality,
					'Emphasis': Emphasis,
					'Gradation':Gradation
				};
			coloringClz = colorMapping[oActiveColoring.coloring];
			options.bMBC = sChartType === "heatmap";
			options.bShowUnmentionedMsr = !(sChartType && sChartType.indexOf("scatter") > -1 ||
											sChartType && sChartType.indexOf("bubble") > -1);
			options.bIsScatter = sChartType && sChartType.indexOf("scatter") > -1 ||
											sChartType && sChartType.indexOf("bubble") > -1;
			options.bIsPie = sChartType && (sChartType === "pie" || sChartType.indexOf("donut") > -1);
			options.bWaterfall = sChartType && sChartType.indexOf("waterfall") > -1;
			options.bTimeChart = sChartType && sChartType.indexOf("timeseries") > -1;
			options.bIsLine = sChartType && sChartType.indexOf("line") > -1;
			jQuery.extend(true, options, ops);
			if (sChartType === "timeseries_bullet" && skipTimeBullet(oDimMsr.aMsr)) {
				return {};
			}

			if (coloringClz) {
				var oCandidateSetting = coloringClz.getCandidateSetting(oColorings, oActiveColoring, aTuples, oDimMsr, oStatus, options, oLocale);
				oCandidateSetting.type = oActiveColoring.coloring;
				return oCandidateSetting;
			} else {
				return {};
			}
		}
	};
});