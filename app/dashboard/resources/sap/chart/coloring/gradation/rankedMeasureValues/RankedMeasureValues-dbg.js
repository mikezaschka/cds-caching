/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/gradation/rankedMeasureValues/RankedMeasureUtils',
	'sap/chart/ChartLog',
	"sap/ui/thirdparty/jquery"
], function(ColoringUtils, RankedMeasureUtils, ChartLog, jQuery) {
	"use strict";
	var RankedMeasureValues = {};
	var SUPPORTED_SCHEMES = ["SingleColorScheme", "DivergingColorScheme", "TargetColorScheme"];

	var validate = function(oRankedMeasureValues, aActiveMsrs, oDimMsr, options) {
		if (!options.bMBC) {
			//clid33
			throw new ChartLog('error', 'colorings.Gradation',
				'"RankedMeasureValues" only applys to Heatmap.');
		}
		ColoringUtils.checkColoringMeasure(aActiveMsrs, oDimMsr.aMsr, oRankedMeasureValues);
		aActiveMsrs.forEach(function(msr){
			var aValidTypes = Object.keys(oRankedMeasureValues[msr]).filter(function(key) {
				return SUPPORTED_SCHEMES.indexOf(key) > -1;
			});

			if (aValidTypes.length > 1) {
				//clid34
				throw new ChartLog('error', 'colorings.Gradation.RankedMeasureValues',
					'One and only one of "' + SUPPORTED_SCHEMES.join('" or "') + '" can be applied to the measure, ' + msr + '.');
			} else {
				var type = aValidTypes[0] || SUPPORTED_SCHEMES[0];
				if (RankedMeasureUtils[type].validate) {
					RankedMeasureUtils[type].validate(oRankedMeasureValues, msr);
				}
			}
		});
	};

	RankedMeasureValues.qualify = function(oRankedMeasureValues, aActiveMsrs, oDimMsr, options) {
		validate(oRankedMeasureValues, aActiveMsrs, oDimMsr, options);
		var aCandidateConfigs = [],
			sAggregationKey = oDimMsr.aDim.map(function(oDim) {
				return oDim.getName();
			}).sort();

		jQuery.each(oRankedMeasureValues, function(sMsr, oSetting) {
			if (aActiveMsrs.length && aActiveMsrs.indexOf(sMsr) === -1) {
				return;
			}

			var oMatchedMsr = ColoringUtils.find(sMsr, oDimMsr.aMsr);
			if (Object.keys(oSetting).length === 0) {
				oSetting['SingleColorScheme'] = {};
			}
			Object.keys(oSetting).forEach(function(sKey) {
				if (SUPPORTED_SCHEMES.indexOf(sKey) === -1) {
					return;
				}
				aCandidateConfigs.sMethod = sKey;
				var oMatchedByAggregation = null, oGlobalSetting = null;
				var aRankingPerAggregationLevels = Array.isArray(oSetting[sKey].RankingPerAggregationLevel) ?
					oSetting[sKey].RankingPerAggregationLevel : [];
				aRankingPerAggregationLevels.forEach(function(oAggregationLevel) {
					if (oAggregationLevel && oAggregationLevel.VisibleDimensions) {
						if (Array.isArray(oAggregationLevel.VisibleDimensions) &&
							oAggregationLevel.VisibleDimensions.sort().join(",") === sAggregationKey.join(",")) {
							oMatchedByAggregation = oAggregationLevel;
						}
					} else {
						//In case the VisibleDimensions is omitted, the level boundaries are applied independent of the aggregation level in the current chart layout
						oGlobalSetting = oAggregationLevel;
					}
				});
				oMatchedByAggregation = oMatchedByAggregation || oGlobalSetting;
				if (oMatchedByAggregation || (aRankingPerAggregationLevels.length === 0 && sKey === 'SingleColorScheme')) {
					if (RankedMeasureUtils[sKey].levels) {
						RankedMeasureUtils[sKey].levels(oRankedMeasureValues, sMsr, oMatchedByAggregation);
					}
					aCandidateConfigs.push({
						type: sKey,
						msr: oMatchedMsr,
						settings: oSetting,
						byAggregation: options.bFiltered ? null : oMatchedByAggregation
					});
				} else {
					//clid39
					throw new ChartLog("error", 'colorings.Gradation.RankedMeasureValues',
						'No aggregation level in "' + sKey + '" of the measure, ' + sMsr + ',  matched with current visible dimensions.');
				}
			});
		});

		return aCandidateConfigs;
	};

	RankedMeasureValues.parse = function(oConfig) {
		var oParsed = {
			msr: oConfig.msr,
			legend: {}
		};
		RankedMeasureUtils[oConfig.type].parse(oConfig, oParsed);
		return oParsed;
	};

	RankedMeasureValues.createScales = function(aCandidateSettings) {
		return RankedMeasureUtils[aCandidateSettings.sMethod].createScales(aCandidateSettings);
	};

	RankedMeasureValues.getContextHandler = function(aCandidateSettings) {
		var oCandidate = aCandidateSettings[0];
		var sMsr = oCandidate.msr.getName();
		var oLegend = oCandidate.parsed.legend;
		return function(oContext) {
			var iVal = oContext.getProperty(sMsr);
			oLegend.min = Math.min(oLegend.min, iVal);
			oLegend.max = Math.max(oLegend.max, iVal);
		};
	};

	return RankedMeasureValues;
});
