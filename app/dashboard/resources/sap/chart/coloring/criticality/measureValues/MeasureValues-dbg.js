/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/ColorPalette',
	'sap/chart/coloring/criticality/measureValues/MeasureUtils',
	'sap/chart/ChartLog',
	'sap/chart/data/MeasureSemantics',
	"sap/ui/thirdparty/jquery"
], function(ColoringUtils, ColorPalette, MeasureUtils, ChartLog, MeasureSemantics, jQuery) {
	"use strict";
	var MeasureValues = {};
	var SUPPORTED_MEASUREVALUES_KEYS = ["Static", "Calculated", "DynamicThresholds", "ConstantThresholds"];

	function checkValidate(type, aTuples, msr, oDimMsr, aActiveMeasure, aColoringMeasure, options, aCriticalityType){
		var result = {supportMultiMsr : false, supportHeatMap : false};
		var multiMsr = aActiveMeasure.length > 1;
		if (MeasureUtils[type].validate) {
			jQuery.extend(result, MeasureUtils[type].validate(aColoringMeasure, msr, oDimMsr, aTuples, aCriticalityType));
		}
		if (multiMsr && !result.supportMultiMsr) {
			//clid 12
			throw new ChartLog('error', 'Colorings.Criticality', 'Only support multiple active measures when using Static Criticality.');
		}
		if (options.bMBC && !result.supportHeatMap) {
			//clid29
			throw new ChartLog('error', 'Colorings', 'Heatmap only support Criticality.MeasureValues.ConstantThresholds.');
		}
	}

	var validate = function(aColoringMeasure, aTuples, oDimMsr, aActiveMeasure, options) {
		var aVisibleMeasure = oDimMsr.aMsr;
		ColoringUtils.checkColoringMeasure(aActiveMeasure, aVisibleMeasure, aColoringMeasure);
		var aCriticalityType = [];
		aActiveMeasure.forEach(function(msr, index){
			var aValidTypes = Object.keys(aColoringMeasure[msr]).filter(function(key) {
				return SUPPORTED_MEASUREVALUES_KEYS.indexOf(key) > -1;
			}).sort();
			var isLegalCombination = isLegalCombinationFn(aValidTypes);

			if (aValidTypes.length > 1 && !isLegalCombination) {
				//clid14
				throw new ChartLog('error', 'Colorings.Criticality.MeasureValues',
					'The combination of "DynamicThresholds"and "ConstantThresholds" or only one of "Static", "Calculated", "DynamicThresholds", or "ConstantThresholds" can be applied to the measure, ' + msr + '.');
			}

			if (!isLegalCombination && aValidTypes.length === 1) {

				checkValidate(aValidTypes[0], aTuples, msr, oDimMsr, aActiveMeasure, aColoringMeasure, options, aCriticalityType);
			}
		});

		if (ColoringUtils.hasSeriesDim(oDimMsr) ||
			(options.bTimeChart && options.bWaterfall && oDimMsr.aDim.length > 1) ||
			(options.bIsPie && oDimMsr.aDim.length)) {
			//clid16
			throw new ChartLog('error', 'colorings.Criticality.MeasureValues', 'Semantic coloring could not be applied if chart already has coloring.');
		}
	};

	function isLegalCombinationFn(types){
		return types.length === 2 && types[0] == "ConstantThresholds" && types[1] === "DynamicThresholds";
	}

	function findConfigByMsr(aCandidateConfigs, sMsrName) {
		var oMatchedConfig = aCandidateConfigs.filter(function(oConfig) {
			return oConfig.msr.getName() === sMsrName;
		})[0];
		return oMatchedConfig;
	}

	function extendStaticCandidateConfigs(aCandidateConfigs, aTuples, aMsrs) {
		if (aCandidateConfigs.sMethod === 'Static') {
			var aExtendedCandidateConfigs = [];
			aTuples.forEach(function(oTuple) {
				jQuery.each(MeasureSemantics, function(currentKey, currentSemanticRole) {
					var sCurrentMsrName = oTuple[currentSemanticRole];
					if (sCurrentMsrName) {
						var oMarchedConfig = findConfigByMsr(aCandidateConfigs, oTuple[currentSemanticRole]);
						if (!oMarchedConfig) {
							// measure without 'Static' config need to be extended by tuple's setting
							jQuery.each(MeasureSemantics, function(key, semanticRole) {
								if (currentSemanticRole !== semanticRole) {
									var oConfigToAlign = findConfigByMsr(aCandidateConfigs, oTuple[semanticRole]);
									if (oConfigToAlign) {
										var oMsr = aMsrs.filter(function(oMsr) {
											return oMsr.getName() === sCurrentMsrName;
										})[0];
										var oExtendConfig = {
											msr: oMsr,
											settings: {
												Static: oConfigToAlign.settings.Static
											},
											type: 'Static'
										};
										aExtendedCandidateConfigs.push(oExtendConfig);
									}
								}
							});
						} else {
							oTuple.criticalityType = oMarchedConfig.settings.Static;
						}
					}
				});
			});
			aCandidateConfigs.push.apply(aCandidateConfigs, aExtendedCandidateConfigs);
		}
	}

	MeasureValues.qualify = function(oConfig, aTuples, aActiveMsrs, oDimMsr, oStatus, options) {
		validate(oConfig, aTuples, oDimMsr, aActiveMsrs, options);
		var aCandidateConfigs = [],
			aMentionedMsrs = [],
			sAggregationKey = oDimMsr.aDim.map(function(oDim) {
				return oDim.getName();
			}).sort();

		jQuery.each(oConfig, function(sMeasureName, oSetting) {
			var aSettingKeys = Object.keys(oSetting);
			var oMatchedMsr = ColoringUtils.find(sMeasureName, oDimMsr.aMsr);
			var aExcludeLegend = aSettingKeys.filter(function(key) {
				return key !== "Legend";
			}).sort();

			if (aActiveMsrs.length && aActiveMsrs.indexOf(sMeasureName) === -1) {
				// filter inactive config
				return;
			}

			var found = false, sKey;
			//aExcludeLegend.length should be 1 or 2
			//to find the suitable criticality for coloring
			for (var ii = 0; ii < aExcludeLegend.length && !found; ii++) {
				sKey = aExcludeLegend[ii];
				aCandidateConfigs.sMethod = sKey;
				if (sKey === "ConstantThresholds") {
					var oMatchedByAggregation = null, oGlobalSetting = null;
					for (var jj = 0; jj < oSetting[sKey].AggregationLevels.length; jj++) {
						if (oSetting[sKey].AggregationLevels[jj].VisibleDimensions) {
							var sAggKeyToTest = oSetting[sKey].AggregationLevels[jj].VisibleDimensions.sort();
							if (sAggKeyToTest.join(",") === sAggregationKey.join(",")) {
								oMatchedByAggregation = oSetting[sKey].AggregationLevels[jj];
							}
						} else {
							// if user does not explicitly assign VisibleDimensions or sets as null, we intend to ignore this constraint by default.
							oGlobalSetting = oSetting[sKey].AggregationLevels[jj];
						}
					}
					oMatchedByAggregation = oMatchedByAggregation || oGlobalSetting;
					if (oMatchedByAggregation) {
						found = true;
						// Aggregation Level is invalidated if filter is set by customer
						if (!options.bFiltered) {
							aCandidateConfigs.push({
								type: sKey,
								msr: oMatchedMsr,
								settings: oSetting,
								byAggregation: oMatchedByAggregation
							});
							aMentionedMsrs.push(oMatchedMsr.getName());
						}
					}
				} else {
					found = true;
					aCandidateConfigs.push({
						type: sKey,
						msr: oMatchedMsr,
						settings: oSetting
					});
					aMentionedMsrs.push(oMatchedMsr.getName());
				}
			}

			if (!found) {
				//clid19
				throw new ChartLog("error", 'Colorings.Criticality.MeasureValues.ConstantThresholds', "No aggregation levels matched with current visible dimensions.");
			}

			//we skip validation for the combination, we do it here for the chosen criticality
			if (isLegalCombinationFn(aExcludeLegend)) {
				checkValidate(sKey, aTuples, oMatchedMsr.getName(), oDimMsr, aActiveMsrs, oConfig, options);
			}
		});

		//extend static settings according to tuples
		extendStaticCandidateConfigs(aCandidateConfigs, aTuples, oDimMsr.aMsr);

		if (aCandidateConfigs.length) {
			var iUnMentionedTupleCount = 0;
			aTuples.forEach(function(oTuple) {
				var bMentioned = false;
				jQuery.each(MeasureSemantics, function(key, semanticRole) {
					if (aMentionedMsrs.indexOf(oTuple[semanticRole]) > -1) {
						bMentioned = true;
						return false;
					}
				});
				if (!bMentioned) {
					oTuple.iUnMentionedIndex = iUnMentionedTupleCount++;
				}
			});

			if (iUnMentionedTupleCount > 3) {
				//clid15
				throw new ChartLog("error", 'Colorings.Criticality.MeasureValues', "Too many unmentioned measures (the maximum number is 3).");
			}
		}

		aCandidateConfigs.bShowUnmentionedMsr = options.bShowUnmentionedMsr;

		return aCandidateConfigs;
	};

	MeasureValues.parse = function(oConfig, oDimMsr, oStatus, oOptions, oLocale) {
		var bMBC = oOptions.bMBC,
			options = {
				aMsrs: oDimMsr.aMsr,
				aDims: oDimMsr.aDim,
				oStatus: oStatus
			},
			oParsed = {
				msr: oConfig.msr,
				callbacks: {},
				additionalDimensions: [],
				additionalMeasures: [],
				legend: {}
			};
		MeasureUtils[oConfig.type].parse(oConfig, options, oParsed, bMBC, oLocale);
		return oParsed;
	};

	MeasureValues.getContextHandler = function(sCriticalityMethod, aCandidateSettings, bMBC, oLocale) {
		if (MeasureUtils[sCriticalityMethod].getContextHandler) {
			return MeasureUtils[sCriticalityMethod].getContextHandler(aCandidateSettings, bMBC, oLocale);
		} else {
			return null;
		}
	};

	return MeasureValues;
});