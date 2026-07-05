/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/ChartLog',
	'sap/chart/data/TimeDimension',
	'sap/chart/coloring/CriticalityType',
	"sap/ui/thirdparty/jquery"
], function(ColoringUtils, ChartLog, TimeDimension, CriticalityType, jQuery) {
	"use strict";

	var Dim = {};

	var validate = function(aColoringDimension, aActiveDimension, oDimMsr, options) {
		var tempOpt = jQuery.extend({}, options);
		tempOpt.bHasOtherSeriesDim = ColoringUtils.hasOtherSeriesDim(aActiveDimension[0], oDimMsr);
		tempOpt.type = 'Criticality';
		tempOpt.subType = 'DimensionValues';
		ColoringUtils.checkColoringDimension(aActiveDimension, oDimMsr, aColoringDimension, tempOpt);
		var dimensionColoring = aColoringDimension[aActiveDimension[0]],
			categorys = Object.keys(dimensionColoring),
			oActiveDimension = ColoringUtils.find(aActiveDimension[0], oDimMsr.aDim),
			bIsSeriesBased = oActiveDimension.getRole() === 'series' ? true : false;
		categorys.forEach(function(category){
			var values = dimensionColoring[category].Values,
				legend = dimensionColoring[category].Legend;
			values = Array.isArray(values) ? values : [values];
			if (values.length > 1 && !legend) {
				//clid17
				throw new ChartLog('error', 'Colorings.Criticality.DimensionValues', 'Legend is mandatory when one criticality type has multiple values.');
			}
			if ((bIsSeriesBased || options.bIsPie) && values.length > 1) {
				//clid20
				throw new ChartLog('error', 'Colorings.Criticality.DimensionValues', 'Criticality on Series Dimension, only single value could be assigned to each CriticalityType.');
			}
		});
	};

	Dim.qualify = function(oConfig, activeDimension, oDimMsr, options) {
		validate(oConfig, activeDimension, oDimMsr, options);
		var sDimName = activeDimension[0], oCandidateSetting;
		if (sDimName) {
			oCandidateSetting = {
				dim: sDimName,
				setting: oConfig
			};
		}
		return oCandidateSetting;
	};

	Dim.parse = function(oConfig, aDim, oStatus, oLocale, options) {
		var oSetting = {},
			oLegend = {},
			sDimName = oConfig.dim,
			aCriticalityValues = [],
			oDimConfig = oConfig.setting[sDimName],
			aNeutralValues = [];

		jQuery.each(oDimConfig, function(key, val) {
			var alevels = !Array.isArray(val) ? [val] : val;
			if (key !== CriticalityType.Neutral) {
				oSetting[key] = alevels.map(function(level) {
					return Array.isArray(level.Values) ? level.Values : [level.Values];
				});
				aCriticalityValues = Array.prototype.concat.apply(aCriticalityValues, oSetting[key]);
			}
			oLegend[key] = alevels.map(function(level) {
				var sVal = Array.isArray(level.Values) ? level.Values[0] : level.Values;
				var sLegend = (level.Legend != null) ? level.Legend : sVal;
				return sLegend;
			});
		});

		if (oDimConfig.Neutral) {
			aNeutralValues = Array.isArray(oDimConfig.Neutral.Values) ? oDimConfig.Neutral.Values : [oDimConfig.Neutral.Values];
		}

		var fnNeutralCb = function (oCtx) {
			return aCriticalityValues.indexOf(oCtx[sDimName]) === -1;
		};

		function genChecker(aValues) {
			return function(oCtx) {
				return aValues.indexOf(oCtx[sDimName]) !== -1;
			};
		}
		var mCallbacks = {
			Negative: (oSetting.Negative || []).map(genChecker),
			Critical: (oSetting.Critical || []).map(genChecker),
			Positive: (oSetting.Positive || []).map(genChecker),
			Neutral: [fnNeutralCb]
		};

		return {
			callbacks: mCallbacks,
			legend: oLegend,
			aCriticalityValues: aCriticalityValues.concat(aNeutralValues),
			status: oStatus
		};
	};

	Dim.getContextHandler = function(oCandidateSetting, oLocale, options) {
		var sDim = oCandidateSetting.dim,
			aCriticalityValues = oCandidateSetting.parsed.aCriticalityValues;

		return function(oContext) {
			var sVal = oContext.getProperty(sDim),
				oCriticalityDim = this.getDimensionByName(sDim);
			if (aCriticalityValues.indexOf(sVal) === -1 ) {
				if (oCriticalityDim._getFixedRole() === "series" || options.bIsPie) {
					//clid21
					var oChartLog = new ChartLog('error', 'Colorings.Criticality.DimensionValues', 'Criticality on Series Dimension, all series must be applied coloring.');
					oCandidateSetting.chartLog = oChartLog;
				} else {
					oCandidateSetting.parsed.legend.Neutral = oLocale.getText("COLORING_TYPE_OTHER");
				}
			}
		};
	};

	return Dim;
});
