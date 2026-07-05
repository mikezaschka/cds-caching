/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/gradation/rankedMeasureValues/RankedMeasureValues',
	'sap/chart/coloring/gradation/DelineatedMeasures',
	'sap/chart/coloring/gradation/DelineatedDimensionValues',
	'sap/chart/coloring/ColorPalette',
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/data/MeasureSemantics',
	'sap/chart/ChartLog'
], function(
	RankedMeasureValues,
	DelineatedMeasures,
	DelineatedDimensionValues,
	ColorPalette,
	ColoringUtils,
	MeasureSemantics,
	ChartLog
) {
	"use strict";
	var SUPPORTED_TYPES = ['DelineatedDimensionValues', 'RankedMeasureValues', 'DelineatedMeasures'];

	function getRuleGenerator(aCandidateSettings) {
		return function() {
			var colorScale, properties;
			if (aCandidateSettings.bMBC) {
				colorScale = RankedMeasureValues.createScales(aCandidateSettings);
			} else {
				var rules = createRules(aCandidateSettings);
				properties = {
					plotArea: {
						dataPointStyle: {
							rules: rules
						}
					}
				};
			}
			return {
				colorScale: colorScale,
				properties: properties
			};
		};
	}

	function createRules(aCandidateSettings) {
		var aRules = [];
		aCandidateSettings.forEach(function(oCandidateSetting, idx) {
			if (oCandidateSetting.chartLog) {
				throw oCandidateSetting.chartLog;
			}
			var sDim = oCandidateSetting.dim;
			var levels = oCandidateSetting.setting[sDim].Levels;
			var aPalettes = ColorPalette.GRADATION.SingleColorScheme[oCandidateSetting.parsed.singleColorScheme];
			aPalettes = ColoringUtils.assignColor(aPalettes, levels.length);
			if (oCandidateSetting.parsed.saturation === 'DarkToLight') {
				aPalettes = aPalettes.reverse();
			}
			levels.forEach(function(memeber, idx) {
				var oRule = {
					callback: oCandidateSetting.parsed.callbacks[memeber],
					properties: {
						color: aPalettes[idx]
					},
					displayName: oCandidateSetting.parsed.legend[memeber]
				};
				if (aCandidateSettings.bIsLine) {
					oRule.properties.lineColor = oRule.properties.color;
				}
				aRules.push(oRule);
			});
		});
		return aRules;
	}

	function adjustTuplesOrderByColoring(aTuples, aColorings) {
		var aColoringTuples = [];
		aColorings.forEach(function(oConfig) {
			var sMsr = oConfig.msr.getName();
			aTuples.forEach(function(oTuple) {
				Object.keys(MeasureSemantics).forEach(function(key) {
					var semanticRole = MeasureSemantics[key];
					if (oTuple[semanticRole] === sMsr) {
						oTuple.order = [];
						oTuple.order.push(semanticRole);
						aColoringTuples.push(oTuple);
					}
				});
			});
		});
		aTuples.splice(0, aTuples.length);
		aTuples.push.apply(aTuples, aColoringTuples);
	}

	return {
		getCandidateSetting: function(oColorings, oActiveColoring, aTuples, oDimMsr, oStatus, options, oLocale) {
			var oGradation = oColorings.Gradation || {},
				oParams = oActiveColoring.parameters || {};
			var sUseType = ColoringUtils.dimOrMsrUse(oGradation, oParams, SUPPORTED_TYPES, 'Gradation');
			var oCandidateSetting = {};
			var aQualifiedSettings;

			switch (sUseType) {
				case 'RankedMeasureValues':
					var activeMeasure = oParams.measure || Object.keys(oGradation.RankedMeasureValues);
					if (typeof activeMeasure === 'string' || activeMeasure instanceof String) {
						activeMeasure = [activeMeasure];
					}
					aQualifiedSettings = RankedMeasureValues.qualify(oGradation.RankedMeasureValues, activeMeasure, oDimMsr, options);
					if (aQualifiedSettings && aQualifiedSettings.sMethod) {
						aQualifiedSettings.forEach(function(oQualified) {
							oQualified.parsed = RankedMeasureValues.parse(oQualified);
						});
						oCandidateSetting.contextHandler = RankedMeasureValues.getContextHandler(aQualifiedSettings);
						oCandidateSetting.qualifiedSettings = aQualifiedSettings;
						oCandidateSetting.ruleGenerator = getRuleGenerator(aQualifiedSettings);
						aQualifiedSettings.bMBC = options.bMBC;
					}
					break;
				case 'DelineatedMeasures':
					aQualifiedSettings = DelineatedMeasures.qualify(oGradation.DelineatedMeasures, aTuples, oDimMsr, options);
					if (aQualifiedSettings) {
						oCandidateSetting.qualifiedSettings = aQualifiedSettings;
						aQualifiedSettings.forEach(function(oQualified) {
							oQualified.type = sUseType;
							oQualified.parsed = DelineatedMeasures.parse(oQualified);
						});
						adjustTuplesOrderByColoring(aTuples, aQualifiedSettings);
					}
					break;
				case 'DelineatedDimensionValues':
					var activeDimension = oParams.dimension ||
						Object.keys(oGradation.DelineatedDimensionValues).filter(function(key) {
							return key !== 'SingleColorScheme' && key !== 'Saturation';
						});
					if (typeof activeDimension === 'string' || activeDimension instanceof String) {
						activeDimension = [activeDimension];
					}
					aQualifiedSettings = DelineatedDimensionValues.qualify(oGradation.DelineatedDimensionValues, activeDimension, aTuples, oDimMsr, options);
					if (aQualifiedSettings) {
						oCandidateSetting.qualifiedSettings = aQualifiedSettings;
						aQualifiedSettings.parsed = DelineatedDimensionValues.parse(aQualifiedSettings);
						oCandidateSetting.contextHandler = DelineatedDimensionValues.getContextHandler(aQualifiedSettings);
						var aTmpQualifiedSettings = [aQualifiedSettings];
						oCandidateSetting.ruleGenerator = getRuleGenerator(aTmpQualifiedSettings);
						aTmpQualifiedSettings.bIsLine = options.bIsLine;

					}
					break;
				default:
					return {};
			}

			if (aQualifiedSettings && aQualifiedSettings.length) {
				oCandidateSetting.subType = sUseType;
			}

			return oCandidateSetting;
		}
	};
});
