/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/data/MeasureSemantics',
	'sap/chart/coloring/gradation/rankedMeasureValues/RankedMeasureUtils',
	'sap/chart/ChartLog'
], function(ColoringUtils, MeasureSemantics, RankedMeasureUtils, ChartLog) {
	"use strict";
	var DelineatedMeasures = {};
	var SUPPORTED_SINGLE_SCHEMES = RankedMeasureUtils.SingleColorScheme.SUPPORTED_SINGLE_SCHEMES;
	var SUPPORTED_SATURATIONS = RankedMeasureUtils.SingleColorScheme.SUPPORTED_SATURATIONS;

	var ERR_TYPE = 'colorings.Gradation.DelineatedMeasures';

	var validate = function(oSetting, oDimMsr, options) {
		if (options.bIsScatter) {
			//clid48
			throw new ChartLog('error', ERR_TYPE, '"DelineatedMeasures" could not apply to Scatter or Bubble.');
		}

		if (oSetting.SingleColorScheme && SUPPORTED_SINGLE_SCHEMES.indexOf(oSetting.SingleColorScheme) === -1) {
			//clid49
			throw new ChartLog('error', ERR_TYPE, '"SingleColorScheme" should be one of "' + SUPPORTED_SINGLE_SCHEMES.join('" or "') + '".');
		}
		if (oSetting.Saturation && SUPPORTED_SATURATIONS.indexOf(oSetting.Saturation) === -1) {
			//clid50
			throw new ChartLog('error', ERR_TYPE, '"Saturation" should be one of "' + SUPPORTED_SATURATIONS.join('" or "') + '".');
		}

		var aMsr = oDimMsr.aMsr.map(function(oMsr){
			return oMsr.getName();
		});
		var levels = oSetting.Levels;
		if (Array.isArray(levels) && levels.length >= 2 && levels.length <= 6) {
			//clid52
			ColoringUtils.notIn(levels, aMsr, ERR_TYPE, 'Measure, ', ', configured in "Levels" should be visible.');
			//clid52
			ColoringUtils.notIn(aMsr, levels, ERR_TYPE, 'Visible measure, ', ', should be configured in "Levels".');
			if (ColoringUtils.hasDuplicatedValues(levels)) {
				//clid58
				throw new ChartLog("error", ERR_TYPE, 'The measure names contained in "Levels" have duplicated values.');
			}
		} else {
			//clid51
			throw new ChartLog("error", ERR_TYPE, 'The number of measure names contained in "Levels" should be between 2 to 6.');
		}

		if (ColoringUtils.hasSeriesDim(oDimMsr) ||
			(options.bTimeChart && options.bWaterfall && oDimMsr.aDim.length > 1) ||
			(options.bIsPie && oDimMsr.aDim.length)) {
			//clid16
			throw new ChartLog('error', ERR_TYPE, 'Semantic coloring could not be applied if chart already has coloring.');
		}
	};

	DelineatedMeasures.qualify = function(oDelineatedMeasures, aTuples, oDimMsr, options) {
		validate(oDelineatedMeasures, oDimMsr, options);

		aTuples.forEach(function(oTuple) {
			var sMsrs;
			Object.keys(MeasureSemantics).forEach(function(key) {
				var semanticRole = MeasureSemantics[key];
				if (oTuple[semanticRole]) {
					if (!sMsrs) {
						sMsrs = oTuple[semanticRole];
					} else if (oTuple[semanticRole] !== sMsrs) {
						sMsrs += ', ' + oTuple[semanticRole];
						//clid53
						throw new ChartLog("error", ERR_TYPE, 'When ' +
							sMsrs + ' have semantic relationship, "DelineatedMeasures" could not be applied.');
					}
				}
			});
		});

		var aCandidateConfigs = [], levels = oDelineatedMeasures.Levels;
		levels.forEach(function(sMsr) {
			aCandidateConfigs.push({
				msr: ColoringUtils.find(sMsr, oDimMsr.aMsr)
			});
		});
		aCandidateConfigs.SingleColorScheme = oDelineatedMeasures.SingleColorScheme || SUPPORTED_SINGLE_SCHEMES[0];
		aCandidateConfigs.Saturation = oDelineatedMeasures.Saturation || SUPPORTED_SATURATIONS[0];
		aCandidateConfigs.Levels = levels;

		return aCandidateConfigs;
	};

	DelineatedMeasures.parse = function(oConfig) {
		var sMsr = oConfig.msr.getName();
		var oParsed = {
			msr: oConfig.msr,
			callbacks: DelineatedMeasures.getCallbacks(sMsr),
			legend: {}
		};
		oParsed.legend[sMsr] = sMsr;
		return oParsed;
	};

	DelineatedMeasures.getCallbacks = function(sMsr) {
		var cb = {};
		cb[sMsr] = [function(oCtx) {
			return oCtx.hasOwnProperty(sMsr);
		}];
		return cb;
	};

	return DelineatedMeasures;
});
