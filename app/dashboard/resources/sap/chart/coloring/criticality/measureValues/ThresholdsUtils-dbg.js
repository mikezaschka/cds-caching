/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/CriticalityType',
	'sap/chart/ChartLog'
], function(
	ColoringUtils,
	CriticalityType,
	ChartLog
) {
	"use strict";
	var Thresholds = {};

	var Msr = {
		formulas: {}
	};

	var NEGATIVE = CriticalityType.Negative;
	var CRITICAL = CriticalityType.Critical;
	var POSITIVE = CriticalityType.Positive;
	var NEUTRAL = CriticalityType.Neutral;

	function genSegment(iUpperBound, sCriticalityType, iLvl) {
		return {
			upperBound: iUpperBound,
			CriticalityType: sCriticalityType
		};
	}

	Thresholds.fillOmit = function(oAcpRange, oTolRange, oDevRange){
		// Thresholds are optional. For unassigned values, defaults are determined in this order:
		oDevRange.hi = (oDevRange.hi == undefined) ? Number.POSITIVE_INFINITY : oDevRange.hi;
		oDevRange.lo = (oDevRange.lo == undefined) ? Number.NEGATIVE_INFINITY : oDevRange.lo;
		oTolRange.hi = (oTolRange.hi == undefined) ? oDevRange.hi : oTolRange.hi;
		oTolRange.lo = (oTolRange.lo == undefined) ? oDevRange.lo : oTolRange.lo;
		oAcpRange.hi = (oAcpRange.hi == undefined) ? oTolRange.hi : oAcpRange.hi;
		oAcpRange.lo = (oAcpRange.lo == undefined) ? oTolRange.lo : oAcpRange.lo;
	};

	Thresholds.checkThreshold = function(sDir, oAcpRange, oTolRange, oDevRange, bConstant) {
		var bCorrect;
		var loIsNum = ColoringUtils.isNumber(oAcpRange.lo, oDevRange.lo, oTolRange.lo);
		var hiIsNum = ColoringUtils.isNumber(oAcpRange.hi, oTolRange.hi, oDevRange.hi);

		switch (sDir) {
			case 'maximize':
				bCorrect = loIsNum && (oDevRange.lo <= oTolRange.lo && oTolRange.lo <= oAcpRange.lo);
				break;
			case 'minimize':
				bCorrect = hiIsNum && (oAcpRange.hi <= oTolRange.hi && oTolRange.hi <= oDevRange.hi);
				break;
			case 'target':
				bCorrect = (loIsNum && hiIsNum) &&
					(oDevRange.lo <= oTolRange.lo) && (oTolRange.lo <= oTolRange.hi) && (oTolRange.hi <= oDevRange.hi) &&
					(oTolRange.lo <= oAcpRange.lo) && (oAcpRange.lo <= oAcpRange.hi) && (oAcpRange.hi <= oTolRange.hi);
				break;
			default:
		}

		if (!bCorrect) {
			//clid17
			var name = bConstant ? "ConstantThresholds" : "DynamicThresholds";
			throw new ChartLog('error', 'Colorings.Criticality.' + name,  'Invalid Thresholds settings.');
		}
	};

	Thresholds.MBCimprovement = function(sDir, oAcpRange, oTolRange, oDevRange) {
		var devHi = oDevRange.hi;
        var devLo = oDevRange.lo;
        var tolHi = oTolRange.hi;
        var tolLo = oTolRange.lo;
        var acpHi = oAcpRange.hi;
        var acpLo = oAcpRange.lo;
		var aSegments = [];
		var aBoundaryOrder, aCriticalityOrder;
		switch (sDir) {
			case 'maximize':
				aBoundaryOrder = [devLo, tolLo, acpLo, Number.POSITIVE_INFINITY];
				aCriticalityOrder = [NEGATIVE, CRITICAL, NEUTRAL, POSITIVE];
				break;
			case 'minimize':
				aBoundaryOrder = [acpHi, tolHi, devHi, Number.POSITIVE_INFINITY];
				aCriticalityOrder = [POSITIVE, NEUTRAL, CRITICAL, NEGATIVE];
				break;
			case 'target':
				aBoundaryOrder = [devLo, tolLo, acpLo, acpHi, tolHi, devHi, Number.POSITIVE_INFINITY];
				aCriticalityOrder = [NEGATIVE, CRITICAL, NEUTRAL, POSITIVE, NEUTRAL, CRITICAL, NEGATIVE];
				break;
			default:
				throw new Error('Unsupported ImprovementDirection: ' + sDir);
		}

		//remove 0 section
		var removeIndexArray = [];
		switch (sDir) {
			case 'maximize':
				//dev -> tol -> acp
				removeIndexArray[0] = (devLo === -Infinity);
				removeIndexArray[1] = (devLo === tolLo);
				removeIndexArray[2] = (tolLo === acpLo);
				removeIndexArray[3] = (acpLo === Infinity);
				break;
			case 'minimize':
				//dev -> tol -> acp
				removeIndexArray[0] = (acpHi === -Infinity);
				removeIndexArray[1] = (acpHi === tolHi);
				removeIndexArray[2] = (tolHi === devHi);
				removeIndexArray[3] = (devHi === Infinity);
				break;
			case 'target':
				//dev -> tol -> acp <- acp <-tol <- dev
				removeIndexArray[0] = (devLo === -Infinity);
				removeIndexArray[1] = (devLo === tolLo);
				removeIndexArray[2] = (tolLo === acpLo);
				removeIndexArray[3] = (acpLo === acpHi);
				removeIndexArray[4] = (acpHi === tolHi);
				removeIndexArray[5] = (tolHi === devHi);
				removeIndexArray[6] = (devHi === Infinity);
				break;
			default:
				throw new Error('Unsupported ImprovementDirection: ' + sDir);
		}


		aBoundaryOrder = aBoundaryOrder.filter(function(e, index){
			return !removeIndexArray[index];
		});
		aCriticalityOrder = aCriticalityOrder.filter(function(e, index){
			return !removeIndexArray[index];
		});

		aSegments = aCriticalityOrder.map(function(sCriticalityType, index) {
			return genSegment(aBoundaryOrder[index], sCriticalityType, 0);
		});
		return {
			segments: aSegments,
			min: Number.POSITIVE_INFINITY,
			max: Number.NEGATIVE_INFINITY
		};
	};

	//decorate function
	function dec(fn){
		return [function(oCtx, additionCtx) {
					return fn(oCtx, additionCtx);
				}];
	}

	Thresholds.improvement = function(sDir, sMsr, oAcpRange, oTolRange, oDevRange) {
		var devHi = oDevRange.hi;
        var devLo = oDevRange.lo;
        var tolHi = oTolRange.hi;
        var tolLo = oTolRange.lo;
        var acpHi = oAcpRange.hi;
        var acpLo = oAcpRange.lo;

        //pass alternative value for dynamic threshold
        //will be used when value is omitted
		var devHiFn = ColoringUtils.thresholdValue([devHi, Number.POSITIVE_INFINITY]);
		var devLoFn = ColoringUtils.thresholdValue([devLo, Number.NEGATIVE_INFINITY]);
		var tolHiFn = ColoringUtils.thresholdValue([tolHi, devHi, Number.POSITIVE_INFINITY]);
		var tolLoFn = ColoringUtils.thresholdValue([tolLo, devLo, Number.NEGATIVE_INFINITY]);
		var acpHiFn = ColoringUtils.thresholdValue([acpHi, tolHi, devHi, Number.POSITIVE_INFINITY]);
		var acpLoFn = ColoringUtils.thresholdValue([acpLo, tolLo, devLo, Number.NEGATIVE_INFINITY]);

		var result = {};

		switch (sDir) {
			case 'maximize':
				//dev -> tol -> acp
				result["Negative"] = (devLo == -Infinity) ? null : dec(Msr.formulas.maximize.negative(sMsr, devLoFn));
				result["Critical"] = (devLo == tolLo) ? null : dec(Msr.formulas.maximize.critical(sMsr, devLoFn, tolLoFn));
				result["Neutral"] = ( tolLo == acpLo) ? null : dec(Msr.formulas.maximize.critical(sMsr, tolLoFn, acpLoFn));
				result["Positive"] = (acpLo == Infinity) ? null : dec(Msr.formulas.maximize.positive(sMsr, acpLoFn));
				break;
			case 'minimize':
				//dev -> tol -> acp
				result["Negative"] = (devHi == Infinity) ? null : dec(Msr.formulas.minimize.negative(sMsr, devHiFn));
				result["Critical"] = (tolHi == devHi) ? null : dec(Msr.formulas.minimize.critical(sMsr, tolHiFn, devHiFn));
				result["Neutral"] = (acpHi == tolHi) ? null : dec(Msr.formulas.minimize.neutral(sMsr, acpHiFn, tolHiFn));
				result["Positive"] = (acpHi == -Infinity) ? null : dec(Msr.formulas.minimize.positive(sMsr, acpHiFn));
				break;
			case 'target':
				//dev -> tol -> acp <- acp <-tol <- dev
				result["Negative"] = (devLo == -Infinity && devHi === Infinity) ? null : dec(Msr.formulas.target.negative(sMsr, devLoFn, devHiFn));
				result["Critical"] = (devLo == tolLo && tolHi == devHi) ? null : dec(Msr.formulas.target.critical(sMsr, devLoFn, tolLoFn, tolHiFn, devHiFn));
				result["Neutral"] = (tolLo == acpLo && acpHi == tolHi) ? null : dec(Msr.formulas.target.neutral(sMsr, tolLoFn, acpLoFn, acpHiFn, tolHiFn));
				// acpLo <= m <= acpHi, the range can be one single number
				result["Positive"] = dec(Msr.formulas.target.positive(sMsr, acpLoFn, acpHiFn));
				break;
			default:
				throw new Error('Unsupported ImprovementDirection: ' + sDir);
		}

		return result;
	};

	Msr.formulas.maximize = {
		negative: function(sMsrName, fnDevLo) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nHi = fnDevLo(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, Number.NEGATIVE_INFINITY, nHi, null, false);
			};
		},
		critical: function(sMsrName, fnDevLo, fnTolLo) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnDevLo(oCtx, oAdditionCtx);
				var nHi = fnTolLo(oCtx, oAdditionCtx);

				return ColoringUtils.isInRange(nVal, nLo, nHi, true, false);
			};
		},

		neutral: function(sMsrName, fnTolLo, fnAcpLo) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnTolLo(oCtx, oAdditionCtx);
				var nHi = fnAcpLo(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, nLo, nHi, true, false);
			};
		},

		positive: function(sMsrName, fnAcpLo) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnAcpLo(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, nLo, Number.POSITIVE_INFINITY, true);
			};
		}
	};

	Msr.formulas.minimize = {
		negative: function(sMsrName, fnDevHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnDevHi(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, nLo, Number.POSITIVE_INFINITY, false);
			};
		},
		critical: function(sMsrName, fnTolHi, fnDevHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnTolHi(oCtx, oAdditionCtx);
				var nHi = fnDevHi(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, nLo, nHi, false, true);
			};
		},
		neutral: function(sMsrName, fnAcpHi, fnTolHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnAcpHi(oCtx, oAdditionCtx);
				var nHi = fnTolHi(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, nLo, nHi, false, true);
			};
		},
		positive: function(sMsrName, fnAcpHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nHi = fnAcpHi(oCtx, oAdditionCtx);
				return ColoringUtils.isInRange(nVal, Number.NEGATIVE_INFINITY, nHi, null, true);
			};
		}
	};

	Msr.formulas.target = {
		negative: function(sMsrName, fnDevLo, fnDevHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLeftHi = fnDevLo(oCtx, oAdditionCtx);
				var nRightLo = fnDevHi(oCtx, oAdditionCtx);

				var inLeft = ColoringUtils.isInRange(nVal, Number.NEGATIVE_INFINITY, nLeftHi, null, false);
				var inRight = ColoringUtils.isInRange(nVal, nRightLo, Number.POSITIVE_INFINITY, false);
				return inLeft || inRight;
			};
		},
		critical: function(sMsrName, fnDevLo, fnTolLo, fnTolHi, fnDevHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLeftLo = fnDevLo(oCtx, oAdditionCtx),
					nLeftHi = fnTolLo(oCtx, oAdditionCtx);
				var nRightLo = fnTolHi(oCtx, oAdditionCtx),
					nRightHi = fnDevHi(oCtx, oAdditionCtx);

				var inLeft = ColoringUtils.isInRange(nVal, nLeftLo, nLeftHi, true, false);
				var inRight = ColoringUtils.isInRange(nVal, nRightLo, nRightHi, false, true);

				return inLeft || inRight;
			};
		},
		neutral: function(sMsrName, fnTolLo, fnAcpLo, fnAcpHi, fnTolHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLeftLo = fnTolLo(oCtx, oAdditionCtx),
					nLeftHi = fnAcpLo(oCtx, oAdditionCtx);
				var nRightLo = fnAcpHi(oCtx, oAdditionCtx),
					nRightHi = fnTolHi(oCtx, oAdditionCtx);

				var inLeft = ColoringUtils.isInRange(nVal, nLeftLo, nLeftHi, true, false);
				var inRight = ColoringUtils.isInRange(nVal, nRightLo, nRightHi, false, true);

				return inLeft || inRight;
			};
		},
		positive: function(sMsrName, fnAcpLo, fnAcpHi) {
			return function(oCtx, oAdditionCtx) {
				var nVal = oCtx[sMsrName];
				var nLo = fnAcpLo(oCtx, oAdditionCtx);
				var nHi = fnAcpHi(oCtx, oAdditionCtx);

				return ColoringUtils.isInRange(nVal, nLo, nHi, true, true);
			};
		}
	};

	return Thresholds;
});