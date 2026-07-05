/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/criticality/measureValues/MeasureValues',
	'sap/chart/coloring/criticality/DimensionValues',
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/ColorPalette',
	'sap/chart/coloring/CriticalityType',
	'sap/chart/data/MeasureSemantics',
	"sap/ui/thirdparty/jquery"
], function(
	MeasureValues,
	DimensionValues,
	ColoringUtils,
	ColorPalette,
	CriticalityType,
	MeasureSemantics,
	jQuery
) {
	"use strict";

	var SUPPORTED_TYPES = ['DimensionValues', 'MeasureValues'];
	var aMeasureLegendOrder = [
		CriticalityType.Positive,
		CriticalityType.Neutral,
		CriticalityType.Critical,
		CriticalityType.Negative,
		'Unmentioned'
	];
	var aDimensionLegendOrder = [
		CriticalityType.Positive,
		CriticalityType.Critical,
		CriticalityType.Negative,
		CriticalityType.Neutral
	];

	function createRules(aCandidateSettings, aLegendOrder) {
		var aRules = [];
		aLegendOrder.forEach(function(sCriticalityType) {
			aCandidateSettings.forEach(function(oCandidateSetting) {
				if (oCandidateSetting.chartLog) {
					throw oCandidateSetting.chartLog;
				}
				var aCbs = oCandidateSetting.parsed.callbacks[sCriticalityType] || [];
				aCbs.forEach(function(fnCb, idx) {
					var aColors, sDisplayName;
					if (sCriticalityType === "Unmentioned") {
						aColors = ColoringUtils.assignUnmentionedColor(ColorPalette.CRITICALITY.Neutral, aCbs.length);
						sDisplayName = oCandidateSetting.parsed.legend[idx];
					} else {
						aColors = ColoringUtils.assignColor(ColorPalette.CRITICALITY[sCriticalityType], aCbs.length);
						var oLegend = oCandidateSetting.parsed.legend[sCriticalityType];
						sDisplayName = Array.isArray(oLegend) ? oLegend[idx] : oLegend;
					}
					var oRule = {
						callback: fnCb,
						properties: {
							color: aColors[idx]
						},
						displayName: sDisplayName
					};
					aRules.push(oRule);
				});
			});
		});
		return aRules;
	}

	function createScales(aCandidateSettings) {
		var oCandidate = aCandidateSettings[0];
		var oLegend = oCandidate.parsed.legend;

		var aPalettes = [], aBoundaries = [];
		var bNeedMin = oLegend.segments[0].upperBound > oLegend.min;
		var bNeedMax = (oLegend.segments.length < 2) || (oLegend.segments[oLegend.segments.length - 2].upperBound < oLegend.max);

		oLegend.segments.forEach(function(oSegment) {
			var color = ColoringUtils.assignColor(ColorPalette.CRITICALITY[oSegment.CriticalityType], 1)[0];
			aPalettes.push(color);
			aBoundaries.push(oSegment.upperBound);
		});

		if (bNeedMin) {
			aBoundaries = [oLegend.min].concat(aBoundaries);
		} else {
			aPalettes.splice(0, 1);
		}

		if (bNeedMax) {
			aBoundaries[aBoundaries.length - 1] = oLegend.max;
		} else {
			aPalettes.splice(aPalettes.length - 1, 1);
			aBoundaries.splice(aBoundaries.length - 1, 1);
		}

		var numOfSegments = aPalettes.length;
		if (aPalettes.length === 1) {
			aPalettes = [aPalettes[0], aPalettes[0]];
			numOfSegments = 2;
		} else if (aPalettes.length === 0) {
			return null;
		}

		return {
			feed: "color",
			palette: aPalettes,
			numOfSegments: numOfSegments,
			legendValues: aBoundaries
		};
	}

	function getLegendProps(aCandidateSettings) {
		var oLegendProps;
		if (aCandidateSettings && aCandidateSettings.legendTitle) {
			oLegendProps = {
				title: {
					text: aCandidateSettings.legendTitle,
					visible: true
				}
			};
		}
		return oLegendProps;
	}

	function getRuleGenerator(aCandidateSettings, aLegendOrder) {
		return function() {
			var colorScale, properties;
			if (aCandidateSettings.bMBC) {
				colorScale = createScales(aCandidateSettings);
			} else {
				var rules = createRules(aCandidateSettings, aLegendOrder);
				properties = {
					plotArea: {
						dataPointStyle: {
							rules: rules
						}
					},
					legend: getLegendProps(aCandidateSettings)
				};
			}
			return {
				colorScale: colorScale,
				properties: properties
			};
		};
	}

	function adjustTuplesOrderByColoring(aTuples, aColorings) {
		var aSemanticRoles = [
		MeasureSemantics.Actual,
		MeasureSemantics.Projected,
		MeasureSemantics.Reference
		];

		var aMeasureLegendOrder = [
		CriticalityType.Positive,
		CriticalityType.Neutral,
		CriticalityType.Critical,
		CriticalityType.Negative
		];

		var aColoringTuples = [];
		var aNonColoringTuples = [];
		var bMultipleCriticality = false;

		aTuples.forEach(function(oTuple) {
			var bColoring = false;
			var nonColoringSemantics = [];
			oTuple.order = [];

			if (oTuple.criticalityType) {
				bMultipleCriticality = true;
			}

			aSemanticRoles.forEach(function(semanticRole) {
				if (oTuple[semanticRole]) {
					var oMarchedColoringMsr = aColorings.filter(function(oMsr) {
						return oTuple[semanticRole] === oMsr.msr.getName();
					})[0];
					if (oMarchedColoringMsr) {
						bColoring = true;
						oTuple.order.push(semanticRole);
					} else {
						nonColoringSemantics.push(semanticRole);
					}
				}
			});

			oTuple.order = oTuple.order.concat(nonColoringSemantics);
			if (bColoring) {
				aColoringTuples.push(oTuple);
			} else {
				aNonColoringTuples.push(oTuple);
			}
		});

		if (bMultipleCriticality) {
			aColoringTuples.sort(function(oTupleA, oTupleB) {
				return aMeasureLegendOrder.indexOf(oTupleA.criticalityType) - aMeasureLegendOrder.indexOf(oTupleB.criticalityType);
			});
		}

		aTuples.splice(0, aTuples.length);
		aTuples.push.apply(aTuples, aColoringTuples.concat(aNonColoringTuples));
	}

	return {
		getCandidateSetting: function(oColorings, oActiveColoring, aTuples, oDimMsr, oStatus, options, oLocale) {
			var oCriticality = oColorings.Criticality || {},
				oParams = oActiveColoring.parameters || {};
			var sUseType = ColoringUtils.dimOrMsrUse(oCriticality, oParams, SUPPORTED_TYPES, 'Criticality');
			var oCandidateSetting = {
				additionalMeasures: [],
				additionalDimensions: []
			};
			var bMBC = options.bMBC, aQualifiedSettings, oParsed, sCriticalityMethod;

			switch (sUseType) {
				case 'DimensionValues':
					var activeDimension = oParams.dimension || Object.keys(oCriticality.DimensionValues);
					if (typeof activeDimension === 'string' || activeDimension instanceof String) {
						activeDimension = [activeDimension];
					}
					aQualifiedSettings = DimensionValues.qualify(oCriticality.DimensionValues, activeDimension, oDimMsr, options);
					if (aQualifiedSettings) {
						oCandidateSetting.qualifiedSettings = aQualifiedSettings;
						aQualifiedSettings.parsed = DimensionValues.parse(aQualifiedSettings, oDimMsr.aDim, oStatus, oLocale, options);
						oCandidateSetting.contextHandler = DimensionValues.getContextHandler(aQualifiedSettings, oLocale, options);
						oCandidateSetting.ruleGenerator = getRuleGenerator([aQualifiedSettings], aDimensionLegendOrder);
					}
					break;
				case 'MeasureValues':
					var activeMeasure = oParams.measure || Object.keys(oCriticality.MeasureValues);
					if (typeof activeMeasure === 'string' || activeMeasure instanceof String) {
						activeMeasure = [activeMeasure];
					}
					aQualifiedSettings = MeasureValues.qualify(oCriticality.MeasureValues, aTuples, activeMeasure, oDimMsr, oStatus, options);
					if (aQualifiedSettings.sMethod) {
						jQuery.each(aQualifiedSettings, function(i, oQualified) {
							oParsed = MeasureValues.parse(oQualified, oDimMsr, oStatus, options, oLocale);
							jQuery.each(oParsed.additionalMeasures, function(i, sThresholdMsrName) {
								oCandidateSetting.additionalMeasures.push(sThresholdMsrName);
							});
							jQuery.each(oParsed.additionalDimensions, function(i, sCalculatedName) {
								oCandidateSetting.additionalDimensions.push(sCalculatedName);
							});
							oQualified.parsed = oParsed;
							if (oQualified.settings.Legend && oQualified.settings.Legend.Title) {
								aQualifiedSettings.legendTitle = oQualified.settings.Legend.Title;
							}
						});
						sCriticalityMethod = aQualifiedSettings.sMethod;
						oCandidateSetting.contextHandler = MeasureValues.getContextHandler(sCriticalityMethod, aQualifiedSettings, bMBC, oLocale);
						oCandidateSetting.qualifiedSettings = aQualifiedSettings;
						oCandidateSetting.ruleGenerator = getRuleGenerator(aQualifiedSettings, aMeasureLegendOrder);
						aQualifiedSettings.bMBC = bMBC;

						adjustTuplesOrderByColoring(aTuples, aQualifiedSettings);
					}
					break;
				default:
					return {};
			}

			if (aQualifiedSettings.length) {
				oCandidateSetting.subType = sUseType;
			}

			return oCandidateSetting;
		},
		getLegendProps: getLegendProps
	};
});
