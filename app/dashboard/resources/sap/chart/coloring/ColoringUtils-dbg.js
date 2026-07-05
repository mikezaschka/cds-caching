/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['sap/chart/ChartLog', 'sap/chart/data/TimeDimension'], function(ChartLog, TimeDimension) {
	"use strict";

	var Util = {};
	Util.find = function(sMsrName, aList) {
		for (var i = 0; i < aList.length; i++) {
			if (sMsrName === aList[i].getName()) {
				return aList[i];
			}
		}
		return null;
	};

	Util.isNumber = function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] !== 'number') {
				return false;
			}
		}
		return true;
	};

	Util.thresholdValue = function(values) {
		values = values.filter(function(e){
			return values != null;
		});

		var bString = values.map(function(e){
			return typeof e === "string" || e instanceof String;
		});

		return function (oCtx, oAdditionCtx) {
			for (var ii = 0; ii < values.length; ii++) {
				var result;
				if (bString[ii]) {
					// use addition context when threshold is in visible measures in order to differeniate:
					//    1. coloring measure which refers to threshold measure
					//    2. unmentioned threshold measure
					if (oCtx[values[ii]] != null) {
						result = oCtx[values[ii]];
					} else {
						result = oAdditionCtx[values[ii]];
					}
				} else {
					result = values[ii];
				}
				if (result != null) {
					return result;
				}
			}
		};
	};

	Util.isInRange = function(val, lo, hi, loInclusive, hiInclusive) {
		if (!Util.isNumber(val, lo, hi)) {
			return false;
		}
		var loTest = loInclusive ? (lo <= val) : (lo < val);
		var hiTest = hiInclusive ? (val <= hi) : (val < hi);

		return loTest && hiTest;
	};

	Util.assignColor = function(aColors, iLvls) {
		switch (iLvls) {
			case 1:
				return [aColors[3]];
			case 2:
				return [aColors[1], aColors[3]];
			case 3:
				return [aColors[1], aColors[3], aColors[5]];
			case 4:
				return aColors.slice(1, 5);
			case 5:
				return aColors.slice(1, 6);
			case 6:
				return aColors.slice(0, 6);
			default:
				return null;
		}
	};

	Util.assignUnmentionedColor = function(aColors, iLvls) {
		switch (iLvls) {
			case 1:
				return [aColors[1]];
			case 2:
				return [aColors[1], aColors[5]];
			case 3:
				return [aColors[1], aColors[2], aColors[4]];
			case 4:
				return [aColors[1], aColors[2], aColors[4], aColors[5]];
			case 5:
			    return aColors.filter(function(idx) {
				    return idx !== 3;
			    });
			default:
				return null;
		}
	};

	Util.dimOrMsrUse = function(oColorings, oParams, supportedType, sColoringType){
		var	type = Object.keys(oColorings).filter(function(sType) {
				return supportedType.indexOf(sType) > -1;
		});
		if (oParams.dimension && oParams.measure) {
			//clid5
			throw new ChartLog('error', 'activeColoring', 'Either "dimension" or "measure" can be set in activeColoring.parameters, but not both of them.');
		} else if (oParams.measure) {
			if (sColoringType === 'Gradation') {
				if (Array.isArray(oParams.measure) && oParams.measure.length > 1) {
					type = 'DelineatedMeasures';
				} else {
					type = 'RankedMeasureValues';
				}
			} else {
				type = 'MeasureValues';
			}
		} else if (oParams.dimension) {
			type = sColoringType === 'Gradation' ? 'DelineatedDimensionValues' : 'DimensionValues';
		} else if (type.length > 1) {
			//clid6
			throw new ChartLog('error', 'colorings.' + sColoringType, '"' + type.join('" and "') + '" all exist in ' + sColoringType + ', please resolve by activeColoring property.');
		} else if (type.length === 1) {
			type = type[0];
		}
		return type;
	};

	var _notIn = function(src, des, errorType, prefix, postfix) {
		src.forEach(function(value){
			if (des.indexOf(value) < 0) {
				throw new ChartLog('error', errorType, prefix + value + postfix);
			}
		});
	};

	var checkVisibleMsr = function(measure, aMsr) {
		var aVisibleMsr = aMsr.map(function(oMsr){
			return oMsr.getName();
		});
		//clid7
		_notIn(measure, aVisibleMsr, 'activeColoring.parameters.measure', 'Active measure, ', ', should be visible.');
	};

	var checkVisibleDim = function(dimension, aDim) {
		var aVisibleDim = aDim.map(function(oDim){
			return oDim.getName();
		});
		//clid9
		_notIn(dimension, aVisibleDim, 'activeColoring.parameters.dimension', 'Active dimension, ', ', should be visible.');
	};

	var msrConfig = function(measure, coloringMsr) {
		var measureValue = Object.keys(coloringMsr);
		//clid8
		_notIn(measure, measureValue, 'activeColoring.parameters.measure', 'Active measure, ', ', should be configured in coloring.');
	};

	var dimConfig = function(dimension, coloringDim) {
		var dimensionValue = Object.keys(coloringDim);
		//clid11
		_notIn(dimension, dimensionValue, 'activeColoring.parameters.dimension', 'Active dimension, ', ', should be configured in coloring.');
	};

	var multipleDim = function(dimension){
		if (dimension.length > 1) {
			//clid10
			throw new ChartLog('error', 'activeColoring.parameters.dimension', 'Multiple dimensions are defined. Please resolve by activeColoring property.');
		}
	};

	var timeDim = function(dimension, aVisibleDimension, type, subType){
		var oDim = Util.find(dimension, aVisibleDimension);
		if (oDim instanceof TimeDimension && oDim.getRole() === 'category') {
			//clid27&&clid28
			throw new ChartLog('error', 'Colorings.' + type + '.' + subType, 'Do not support coloring on timeDimension, ' + oDim.getName() + '.');
		}
	};

	var isHeatmap = function(options) {
		if (options.bMBC) {
			//clid29
			throw new ChartLog('error', 'Colorings', 'Heatmap only support Criticality.MeasureValues.ConstantThresholds or Gradation.RankedMeasureValues.');
		}
	};

	var hasColoring = function(oDimMsr, options) {
		if (!options.bWaterfall && ((options.bShowUnmentionedMsr && oDimMsr.aMsr.length > 1) || options.bHasOtherSeriesDim ||
			options.bIsPie && oDimMsr.aDim.length > 1)){
			//clid22
			throw new ChartLog('error', 'Colorings.' + options.type + '.' + options.subType,
				'Semantic coloring could not be applied if chart already has coloring.');
		}
	};

	Util.checkColoringDimension = function(aActiveDimension, oDimMsr, aColoringDimension, options) {
		var aVisibleDimension = oDimMsr.aDim;
		checkVisibleDim(aActiveDimension, aVisibleDimension);
		dimConfig(aActiveDimension, aColoringDimension);
		multipleDim(aActiveDimension);
		timeDim(aActiveDimension[0], aVisibleDimension, options.type, options.subType);
		isHeatmap(options);
		hasColoring(oDimMsr, options);
	};

	Util.checkColoringMeasure = function(aActiveMeasure, aVisibleMeasure, aColoringMeasure) {
		checkVisibleMsr(aActiveMeasure, aVisibleMeasure);
		msrConfig(aActiveMeasure, aColoringMeasure);
	};

	Util.hasSeriesDim = function(oDimMsr) {
		return oDimMsr.aDim.some(function(oDim) {
			return oDim._getFixedRole() === "series";
		});
	};

	Util.hasOtherSeriesDim = function(dim, oDimMsr) {
		return oDimMsr.aDim.some(function(oDim) {
			return oDim._getFixedRole() === "series" && oDim.getName() !== dim;
		});
	};

	Util.hasDuplicatedValues = function(aValues) {
		var result = false, hash = {};
		aValues.forEach(function(sVal) {
			if (hash[sVal]) {
				result = true;
			} else {
				hash[sVal] = true;
			}
		});
		return result;
	};

	Util.notIn = _notIn;

	return Util;
});
