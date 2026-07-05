/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/ColorPalette',
	'sap/chart/ChartLog'
], function(ColoringUtils, ColorPalette, ChartLog) {
	"use strict";

	var Msr = {
		SingleColorScheme: {},
		DivergingColorScheme: {},
		TargetColorScheme: {}
	};

	var SUPPORTED_SINGLE_SCHEMES = ['NoSemantics', 'Positive', 'Negative'];
	var SUPPORTED_DIVERGING_SCHEMES = ['NoSemantics', 'PositiveToNegative', 'NegativeToPositive', 'ColdToHot', 'HotToCold'];
	var SUPPORTED_TARGET_SCHEMES = ['PositiveTarget'];
	var SUPPORTED_SATURATIONS = ['LightToDark', 'DarkToLight'];
	var DEFAULT_NUMBER_OF_LEVELS = 5;

	var DIVERGING_LEVELS_KEYS = ['BelowMidArea', 'AboveMidArea'];
	var DIVERGING_MIDPOINT_KEYS = ['MidAreaLowValue', 'MidAreaHighValue'];
	var TARGET_LEVELS_KEYS = ['BelowTargetMidpoint', 'AboveTargetMidpoint'];
	var TARGET_MIDPOINTS_KEYS = ['TargetMidpoint'];

	var ERR_TYPE = 'colorings.Gradation.RankedMeasureValues';

	function isValidLevelNumber(iNumberOfLevels) {
		return ColoringUtils.isNumber(iNumberOfLevels) && iNumberOfLevels % 1 === 0 && iNumberOfLevels >= 2 && iNumberOfLevels <= 6;
	}

	function getSegments(min, max, numOfSegments) {
		var aBoundaries = [];
		var step = (max - min) / numOfSegments;
		if (step > 1) {
			if (min + Math.ceil(step) * (numOfSegments - 1) < max) {
				step = Math.ceil(step);
			} else {
				step = Math.floor(step);
			}
		}
		for (var i = 0; i < numOfSegments; i++) {
			aBoundaries.push(min + step * i);
		}
		return aBoundaries;
	}

	function createScales(oLegend, aPalettesLeft, aPalettesRight, midAreaColor, fAssignColor) {
		var min = oLegend.min, max = oLegend.max,
			belowMidArea = oLegend.hasOwnProperty('belowMidArea') ? oLegend.belowMidArea : oLegend.belowTargetMidpoint,
			aboveMidArea = oLegend.hasOwnProperty('aboveMidArea') ? oLegend.aboveMidArea : oLegend.aboveTargetMidpoint,
			iMidAreaMinimum = oLegend.hasOwnProperty('midAreaLowValue') ? oLegend.midAreaLowValue : oLegend.targetMidpoint,
			iMidAreaMaximum = oLegend.midAreaHighValue;

		var boundaries = [], segments = [], palettes = [], numOfSegments = 0;
		if (iMidAreaMinimum !== undefined) {
			boundaries.push(iMidAreaMinimum);
		}
		if (iMidAreaMaximum !== undefined && boundaries.indexOf(iMidAreaMaximum) === -1) {
			boundaries.push(iMidAreaMaximum);
		}
		if (boundaries.length > 1) {
			segments.push(1);
			palettes.push(midAreaColor);
			numOfSegments++;
		}
		var tmpPalettes;
		if (min < boundaries[0]) {
			boundaries = [min].concat(boundaries);
			segments = [belowMidArea].concat(segments);
			tmpPalettes = fAssignColor(aPalettesLeft, belowMidArea);
			if (aPalettesLeft.gradationSaturation === 'DarkToLight') {
				tmpPalettes = tmpPalettes.reverse();
			}
			palettes = tmpPalettes.concat(palettes);
			numOfSegments += belowMidArea;
		}
		if (max > boundaries[boundaries.length - 1]) {
			boundaries = boundaries.concat([max]);
			segments = segments.concat([aboveMidArea]);
			tmpPalettes = fAssignColor(aPalettesRight, aboveMidArea);
			if (aPalettesRight.gradationSaturation === 'DarkToLight') {
				tmpPalettes = tmpPalettes.reverse();
			}
			palettes = palettes.concat(tmpPalettes);
			numOfSegments += aboveMidArea;
		}

		var aBoundaries = [];
		for (var i = 0; i < boundaries.length - 1; i++) {
			aBoundaries = aBoundaries.concat(getSegments(boundaries[i], boundaries[i + 1], segments[i]));
		}
		aBoundaries = aBoundaries.concat(boundaries.slice(-1));

		if (palettes.length === 0) {
			// Special case that there is only one value in the dataset
			palettes = fAssignColor(aPalettesLeft, 1);
			return {
				feed: "color",
				palette: [],
				startColor: palettes[0],
				endColor: palettes[0],
				numOfSegments: 1
			};
		}

		return {
			feed: "color",
			palette: palettes,
			numOfSegments: numOfSegments,
			maxNumOfSegments: 13,
			legendValues: aBoundaries
		};
	}

	Msr.SingleColorScheme.SUPPORTED_SINGLE_SCHEMES = SUPPORTED_SINGLE_SCHEMES;
	Msr.SingleColorScheme.SUPPORTED_SATURATIONS = SUPPORTED_SATURATIONS;

	Msr.SingleColorScheme.validate = function(oSetting, sMsr) {
		var	settings = oSetting[sMsr].SingleColorScheme || {};
		if (settings.Scheme && SUPPORTED_SINGLE_SCHEMES.indexOf(settings.Scheme) === -1) {
			//clid35
			throw new ChartLog('error', ERR_TYPE, '"SingleColorScheme.Scheme" of the measure, ' + sMsr + ', should be one of "' + SUPPORTED_SINGLE_SCHEMES.join('" or "') + '".');
		}
		if (settings.Saturation && SUPPORTED_SATURATIONS.indexOf(settings.Saturation) === -1) {
			//clid36
			throw new ChartLog('error', ERR_TYPE, '"SingleColorScheme.Saturation" of the measure, ' + sMsr + ', should be one of "' + SUPPORTED_SATURATIONS.join('" or "') + '".');
		}
	};

	Msr.SingleColorScheme.parse = function(oConfig, oParsed) {
		var oSetting = oConfig.settings[oConfig.type];
		var aSegments = [];
		if (oConfig.byAggregation) {
			aSegments = oConfig.byAggregation.LevelBoundaries;
		}
		oParsed.legend = {
			segments: aSegments,
			gradationScheme: oSetting.Scheme || SUPPORTED_SINGLE_SCHEMES[0],
			gradationSaturation: oSetting.Saturation || SUPPORTED_SATURATIONS[0],
			numberOfLevels: oSetting.NumberOfLevels || DEFAULT_NUMBER_OF_LEVELS,
			min: Number.POSITIVE_INFINITY,
			max: Number.NEGATIVE_INFINITY
		};
	};

	Msr.SingleColorScheme.createScales = function(aCandidateSettings) {
		var aBoundaries = [], oCandidate = aCandidateSettings[0];
		var oLegend = oCandidate.parsed.legend;
		var aPalettes = ColorPalette.GRADATION.SingleColorScheme[oLegend.gradationScheme];
		var numOfSegments = oLegend.numberOfLevels;
		if (oLegend.segments.length > 0) {
			aBoundaries = oLegend.segments;
			numOfSegments = aBoundaries.length - 1;
			var min = oLegend.min,
				max = oLegend.max;
			if (min < aBoundaries[0]) {
				aBoundaries = [min].concat(aBoundaries);
				numOfSegments++;
			}
			if (max > aBoundaries[aBoundaries.length - 1]) {
				aBoundaries = aBoundaries.concat([max]);
				numOfSegments++;
			}
		}
		aPalettes = ColoringUtils.assignColor(aPalettes, numOfSegments);
		if (oLegend.gradationSaturation === 'DarkToLight') {
			aPalettes = aPalettes.reverse();
		}

		return {
			feed: "color",
			palette: aPalettes,
			numOfSegments: numOfSegments,
			legendValues: aBoundaries
		};
	};

	Msr.SingleColorScheme.levels = function(oSetting, sMsr, oAggregation) {
		var settings = oSetting[sMsr].SingleColorScheme;
		if (oAggregation) {
			var bLevelBoundariesValid = false;
			var aLevelBoundaries = oAggregation.LevelBoundaries;
			if (Array.isArray(aLevelBoundaries) && aLevelBoundaries.length >= 1 && aLevelBoundaries.length <= 5) {
				bLevelBoundariesValid = aLevelBoundaries.reduce(function(max, num) {
					return max < num ? num : Number.POSITIVE_INFINITY;
				}, Number.NEGATIVE_INFINITY) < Number.POSITIVE_INFINITY;
			}
			if (!bLevelBoundariesValid) {
				//clid37
				throw new ChartLog("error", ERR_TYPE,
					'"SingleColorScheme.RankingPerAggregationLevel.LevelBoundaries" of the measure, ' + sMsr + ', may contain between 1 to 5 members in strictly increasing sequence.');
			}
		} else {
			if (settings.hasOwnProperty('NumberOfLevels')) {
				var iNumberOfLevels = settings.NumberOfLevels;
				if (!isValidLevelNumber(iNumberOfLevels)) {
					//clid38
					throw new ChartLog("error", ERR_TYPE, '"SingleColorScheme.NumberOfLevels" of the measure, ' + sMsr + ', should be an Integer between 2 to 6.');
				}
			}
		}
	};

	Msr.DivergingColorScheme.validate = function(oSetting, sMsr) {
		var	settings = oSetting[sMsr].DivergingColorScheme;
		if (settings.Scheme && SUPPORTED_DIVERGING_SCHEMES.indexOf(settings.Scheme) === -1) {
			//clid40
			throw new ChartLog('error', ERR_TYPE, '"DivergingColorScheme.Scheme" of the measure, ' + sMsr + ', should be one of "' + SUPPORTED_DIVERGING_SCHEMES.join('" or "') + '".');
		}
		var oNumberOfLevels = settings.NumberOfLevels;
		DIVERGING_LEVELS_KEYS.forEach(function(key) {
			if (!isValidLevelNumber(oNumberOfLevels && oNumberOfLevels[key])) {
				//clid41
				throw new ChartLog("error", ERR_TYPE, '"DivergingColorScheme.NumberOfLevels.' + key + '"  of the measure, ' + sMsr + ', should be an Integer between 2 to 6.');
			}
		});
	};

	Msr.DivergingColorScheme.parse = function(oConfig, oParsed) {
		var oSetting = oConfig.settings[oConfig.type];
		oParsed.legend = {
			midAreaLowValue: oConfig.byAggregation.MidAreaLowValue,
			midAreaHighValue: oConfig.byAggregation.MidAreaHighValue,
			gradationScheme: oSetting.Scheme || SUPPORTED_DIVERGING_SCHEMES[0],
			belowMidArea: oSetting.NumberOfLevels.BelowMidArea,
			aboveMidArea: oSetting.NumberOfLevels.AboveMidArea,
			min: Number.POSITIVE_INFINITY,
			max: Number.NEGATIVE_INFINITY
		};
	};

	Msr.DivergingColorScheme.createScales = function(aCandidateSettings) {
		var oCandidate = aCandidateSettings[0];
		var oLegend = oCandidate.parsed.legend;
		var aPalettes = ColorPalette.GRADATION.DivergingColorScheme[oLegend.gradationScheme],
			aPalettesLeft = aPalettes.slice(0, 6).reverse(),
			aPalettesRight = aPalettes.slice(7);
		aPalettesLeft.gradationSaturation = 'DarkToLight';

		return createScales(oLegend, aPalettesLeft, aPalettesRight, aPalettes[6], ColoringUtils.assignColor);
	};

	Msr.DivergingColorScheme.levels = function(oSetting, sMsr, oAggregation) {
		var bFound = false;
		DIVERGING_MIDPOINT_KEYS.forEach(function(key) {
			if (oAggregation.hasOwnProperty(key)) {
				bFound = true;
				if (!ColoringUtils.isNumber(oAggregation[key])) {
					//clid42
					throw new ChartLog("error", ERR_TYPE, '"DivergingColorScheme.NumberOfLevels.' + key + '"  of the measure, ' + sMsr + ', should be a number.');
				}
			}
		});
		if (!bFound) {
			//clid43
			throw new ChartLog("error", ERR_TYPE, 'At least one of the "MidAreaLowValue" or "MidAreaHighValue" in "DivergingColorScheme.RankingPerAggregationLevel" of the measure, ' + sMsr + ', should be specified.');
		}
		if (oAggregation.MidAreaLowValue > oAggregation.MidAreaHighValue) {
			//clid44
			throw new ChartLog("error", ERR_TYPE, '"MidAreaLowValue" should no more than "MidAreaHighValue" in "DivergingColorScheme.RankingPerAggregationLevel" of the measure, ' + sMsr + '.');
		}
	};

	Msr.TargetColorScheme.validate = function(oSetting, sMsr) {
		var	settings = oSetting[sMsr].TargetColorScheme;
		if (settings.Scheme && SUPPORTED_TARGET_SCHEMES.indexOf(settings.Scheme) === -1) {
			//clid45
			throw new ChartLog('error', ERR_TYPE, '"TargetColorScheme.Scheme" of the measure, ' + sMsr + ',  should be "' + SUPPORTED_TARGET_SCHEMES.join('" or "') + '".');
		}
		var oNumberOfLevels = settings.NumberOfLevels;
		TARGET_LEVELS_KEYS.forEach(function(key) {
			if (!isValidLevelNumber(oNumberOfLevels && oNumberOfLevels[key])) {
				//clid46
				throw new ChartLog("error", ERR_TYPE, '"TargetColorScheme.NumberOfLevels.' + key + '"  of the measure, ' + sMsr + ', should be an Integer between 2 to 6.');
			}
		});
	};

	Msr.TargetColorScheme.parse = function(oConfig, oParsed) {
		var oSetting = oConfig.settings[oConfig.type];
		oParsed.legend = {
			targetMidpoint: oConfig.byAggregation.TargetMidpoint,
			gradationScheme: oSetting.Scheme || SUPPORTED_TARGET_SCHEMES[0],
			belowTargetMidpoint: oSetting.NumberOfLevels.BelowTargetMidpoint,
			aboveTargetMidpoint: oSetting.NumberOfLevels.AboveTargetMidpoint,
			min: Number.POSITIVE_INFINITY,
			max: Number.NEGATIVE_INFINITY
		};
	};

	Msr.TargetColorScheme.createScales = function(aCandidateSettings) {
		var oCandidate = aCandidateSettings[0];
		var oLegend = oCandidate.parsed.legend;
		var aPalettes = ColorPalette.GRADATION.TargetColorScheme[oLegend.gradationScheme],
			aPalettesLeft = aPalettes.slice(0, 6),
			aPalettesRight = aPalettes.slice(0, 6);
		aPalettesRight.gradationSaturation = 'DarkToLight';

		return createScales(oLegend, aPalettesLeft, aPalettesRight, null, Msr.TargetColorScheme.assignColor);
	};

	Msr.TargetColorScheme.levels = function(oSetting, sMsr, oAggregation) {
		TARGET_MIDPOINTS_KEYS.forEach(function(key) {
			if (!ColoringUtils.isNumber(oAggregation[key])) {
				//clid47
				throw new ChartLog("error", ERR_TYPE, '"TargetColorScheme.NumberOfLevels.' + key + '"  of the measure, ' + sMsr + ', should be a number.');
			}
		});
	};

	Msr.TargetColorScheme.assignColor = function(aColors, iLvls) {
		switch (iLvls) {
			case 1:
				return [aColors[5]];
			case 2:
				return [aColors[0], aColors[5]];
			case 3:
				return [aColors[0], aColors[2], aColors[5]];
			case 4:
				return aColors.slice(0, 2).concat(aColors.slice(4, 6));
			case 5:
				return aColors.slice(0, 3).concat(aColors.slice(4, 6));
			case 6:
				return aColors.slice(0, 6);
			default:
				return null;
		}
	};

	return Msr;
});
