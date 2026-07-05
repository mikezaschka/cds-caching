/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/data/MeasureSemantics',
	'sap/chart/coloring/gradation/rankedMeasureValues/RankedMeasureUtils',
	'sap/chart/ChartLog',
	"sap/ui/thirdparty/jquery"
], function(ColoringUtils, MeasureSemantics, RankedMeasureUtils, ChartLog, jQuery) {
	"use strict";
	var DelineatedDimensionValues = {};
	var SUPPORTED_SINGLE_SCHEMES = RankedMeasureUtils.SingleColorScheme.SUPPORTED_SINGLE_SCHEMES;
	var SUPPORTED_SATURATIONS = RankedMeasureUtils.SingleColorScheme.SUPPORTED_SATURATIONS;

	var ERR_TYPE = 'colorings.Gradation.DelineatedDimensionValues';

	var validate = function(oSetting, activeDimension, oDimMsr, options) {
		if (oSetting.SingleColorScheme && SUPPORTED_SINGLE_SCHEMES.indexOf(oSetting.SingleColorScheme) === -1) {
			//clid54
			throw new ChartLog('error', ERR_TYPE, '"SingleColorScheme" should be one of "' + SUPPORTED_SINGLE_SCHEMES.join('" or "') + '".');
		}
		if (oSetting.Saturation && SUPPORTED_SATURATIONS.indexOf(oSetting.Saturation) === -1) {
			//clid55
			throw new ChartLog('error', ERR_TYPE, '"Saturation" should be one of "' + SUPPORTED_SATURATIONS.join('" or "') + '".');
		}

		var oColoringDimension = {};
		Object.keys(oSetting).forEach(function(key) {
			if (key !== 'SingleColorScheme' && key !== 'Saturation') {
				oColoringDimension[key] = oSetting[key];
			}
		});
		var tempOpt = jQuery.extend({}, options);
		tempOpt.bHasOtherSeriesDim = ColoringUtils.hasOtherSeriesDim(activeDimension[0], oDimMsr);
		tempOpt.type = 'Gradation';
		tempOpt.subType = 'DelineatedDimensionValues';
		ColoringUtils.checkColoringDimension(activeDimension, oDimMsr, oColoringDimension, tempOpt);

		var dimensionColoring = oColoringDimension[activeDimension[0]];
		if (dimensionColoring) {
			var levels = dimensionColoring.Levels;
			if (!Array.isArray(levels) || levels.length < 2 || levels.length > 6) {
				//clid56
				throw new ChartLog("error", ERR_TYPE, 'The number of dimension names contained in "Levels" should be between 2 to 6.');
			}
			if (ColoringUtils.hasDuplicatedValues(levels)) {
				//clid58
				throw new ChartLog("error", ERR_TYPE, 'The dimension names contained in "Levels" have duplicated values.');
			}
		}

	};

	DelineatedDimensionValues.qualify = function(oDelineatedDimensionValues, activeDimension, aTuples, oDimMsr, options) {
		validate(oDelineatedDimensionValues, activeDimension, oDimMsr, options);

		var sDimName = activeDimension[0], oCandidateSetting;
		if (sDimName) {
			oCandidateSetting = {
				dim: sDimName,
				setting: oDelineatedDimensionValues
			};
		}
		return oCandidateSetting;
	};

	DelineatedDimensionValues.parse = function(oConfig) {
		var sDim = oConfig.dim, oSetting = oConfig.setting;
		var oParsed = {
			callbacks: {},
			legend: {},
			singleColorScheme: oSetting.SingleColorScheme || SUPPORTED_SINGLE_SCHEMES[0],
			saturation: oSetting.Saturation || SUPPORTED_SATURATIONS[0]
		};
		oSetting[sDim].Levels.forEach(function(member) {
			oParsed.callbacks[member] = DelineatedDimensionValues.getCallback(sDim, member);
			oParsed.legend[member] = member;
		});
		return oParsed;
	};

	DelineatedDimensionValues.getCallback = function(sDim, sVal) {
		return function(oCtx) {
			return oCtx[sDim] === sVal;
		};
	};

	DelineatedDimensionValues.getContextHandler = function(oCandidateSetting) {
		var sDim = oCandidateSetting.dim,
			levels = oCandidateSetting.setting[sDim].Levels;

		return function(oContext) {
			var sVal = oContext.getProperty(sDim);
			if (levels.indexOf(sVal) === -1 ) {
				//clid57
				oCandidateSetting.chartLog = new ChartLog('error', ERR_TYPE, 'Dimension memeber, ' + sVal + ', should be configured in "Levels".');
			}
		};
	};

	return DelineatedDimensionValues;
});
