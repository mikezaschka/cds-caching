/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/criticality/measureValues/ThresholdsUtils',
	'sap/chart/ChartLog',
	'sap/chart/coloring/CriticalityType',
	'sap/chart/data/MeasureSemantics',
	"sap/ui/thirdparty/jquery"
], function(
	ColoringUtils,
	ThresholdsUtils,
	ChartLog,
	CriticalityType,
	MeasureSemantics,
	jQuery
) {
	"use strict";

	var Msr = {
		Static: {},
		Calculated: {},
		DynamicThresholds: {},
		ConstantThresholds: {},
		Unmentioned: {}
	};

	var SUPPORTED_IMPROVEMENT = ['Maximize', 'Minimize', 'Target'];

	Msr.Static.validate = function(oSetting, sMsr, oDimMsr, aTuples, aCriticalityTypes) {
		var staticType = oSetting[sMsr].Static;

		var semanticRoleHandler = function(key, semanticRole) {
			if (oTuple[semanticRole] === sMsr) {
				bMatched = true;
				if (oTuple.staticType) {
					if (oTuple.staticType !== staticType) {
						var sMsrs = '';
						Object.keys(MeasureSemantics).forEach(function(key, index, arr) {
							var semanticRole = MeasureSemantics[key];
							if (oTuple[semanticRole]) {
								if (index !== (arr.length - 1)) {
									sMsrs += oTuple[semanticRole] + ', ';
								} else {
									sMsrs += oTuple[semanticRole];
								}
							}
						});
						//clid31
						throw new ChartLog('error', 'Colorings.Criticality.Static', 'When ' +
							sMsrs + ' have semantic relationship, they must use the same Criticality type.');
					}
				} else {
					oTuple.staticType = staticType;
					if (aCriticalityTypes[staticType]) {
						//clid13
						throw new ChartLog('error', 'Colorings.Criticality.Static', 'Measures, ' +
							aCriticalityTypes[staticType] + ' and ' + sMsr + ', which use Static Criticality must have different types.');
					} else {
						aCriticalityTypes[staticType] = sMsr;
					}
				}
				return false;
			}
		};

		var bMatched = false;
		for (var i = 0; i < aTuples.length; ++i) {
			var oTuple = aTuples[i];
			jQuery.each(MeasureSemantics, semanticRoleHandler);
			if (bMatched) {
				break;
			}
		}

		return {supportMultiMsr : true};
	};

	Msr.Static.parse = function(oConfig, options, oParsed) {
		var sMsr = oConfig.msr ? oConfig.msr.getName() : undefined;
		var sStaticProperty = oConfig.settings[oConfig.type];
		oParsed.callbacks = Msr.Static.getCallbacks(sStaticProperty, sMsr);
		var oDefaultLegend = oConfig.msr.getLabel() || oConfig.msr.getName();
		var oCustomLegend = oConfig.settings.Legend || {};
		oParsed.legend[sStaticProperty] =  (oCustomLegend[sStaticProperty] != null) ? oCustomLegend[sStaticProperty] : oDefaultLegend;
	};

	Msr.Static.getCallbacks = function(sCriticalityType, sMsr) {
		var cb = {};
		cb[sCriticalityType] = [function(oCtx) {
			return oCtx.hasOwnProperty(sMsr);
		}];
		return cb;
	};

	Msr.Calculated.validate = function(oSetting, sMsr, oDimMsr) {
		var sCalculated = oSetting[sMsr].Calculated;
		var sMatchedDim = oDimMsr.allDim.filter(function(sDim) {
			return sDim === sCalculated;
		})[0];
		var sMatchedMsr = oDimMsr.allMsr.filter(function(sMsr) {
			return sMsr === sCalculated;
		})[0];
		if (sMatchedDim) {
			oSetting[sMsr].type = "dimension";
		} else if (sMatchedMsr) {
			oSetting[sMsr].type = "measure";
			if (oDimMsr.aMsr.find(function(oMsr) { return oMsr.getName() === sMatchedMsr; })) {
				//clid59
				throw new ChartLog('error', 'Colorings.Criticality.Calculated', 'Calculated property, ' + sCalculated + ', could not be available measure.');
			}
		}
		if (!oSetting[sMsr].type) {
			//clid23
			throw new ChartLog('error', 'Colorings.Criticality.Calculated', 'Calculated property, ' + sCalculated + ', does not exist in data model.');
		}
	};

	Msr.Calculated.parse = function(oConfig, options, oParsed, bMBC, oLocale) {
		var sCalculatedProperty = oConfig.settings[oConfig.type];
		var sCalculatedType = oConfig.settings.type;
		if (sCalculatedType === "dimension" && !ColoringUtils.find(sCalculatedProperty, options.aDims)) {
			oParsed.additionalDimensions.push(sCalculatedProperty);
		} else if (sCalculatedType === "measure") {
			if (!options.aMsrs.find(function(oMsr) { return oMsr.getName() === sCalculatedProperty; })) {
				oParsed.additionalMeasures.push(sCalculatedProperty);
			}
			options.oStatus.legend = Msr.getLegend(oConfig, oLocale);
		}
		oParsed.status = options.oStatus;
	};

	Msr.Calculated.getCallbacks = function(sPropName, sCriticalityType, sMsr) {
		var cb = function(oCtx) {
			return (oCtx[sPropName] === sCriticalityType ||
				Msr.Calculated.getCriticalityType(oCtx[sPropName]) === sCriticalityType) &&
			oCtx.hasOwnProperty(sMsr);
		};
		return [cb];
	};

	Msr.Calculated.getContextHandler = function(aCandidateSettings, bMBC, oLocale) {
		var oCandidate = aCandidateSettings[0];
		var sCalculatedProperty = oCandidate.settings[oCandidate.type];
		var sCalculatedType = oCandidate.settings.type;
		delete oCandidate.settings.type; // Remove this from original user settings
		delete oCandidate.parsed.status.callbacks;
		return function(oContext) {
			var oStatus = oCandidate.parsed.status;
			oStatus.legend = oStatus.legend || {};
			oStatus.callbacks = oStatus.callbacks || {};
			oCandidate.parsed.legend = oStatus.legend;
			oCandidate.parsed.callbacks = oStatus.callbacks;

			var sCriticalityType = oContext.getProperty(sCalculatedProperty);
			if (sCalculatedType === "measure") {
				sCriticalityType = Msr.Calculated.getCriticalityType(sCriticalityType);
			}
			if (CriticalityType[sCriticalityType]) {
				if (sCalculatedType === "dimension") {
					var oCalculatedProperty = this.getDimensionByName(sCalculatedProperty);
					var bDisplayText = this.getDimensionByName(sCalculatedProperty).getDisplayText();
					aCandidateSettings.legendTitle = aCandidateSettings.legendTitle || oCalculatedProperty.getLabel();
					var sCalculatedTextProperty = oCalculatedProperty.getTextProperty();
					if (sCalculatedTextProperty && bDisplayText) {
						var sCriticalityTypeText = oContext.getProperty(sCalculatedTextProperty);
						oCandidate.parsed.legend[sCriticalityType] = sCriticalityTypeText;
					} else if (sCriticalityType) {
						oCandidate.parsed.legend[sCriticalityType] = oLocale.getText("COLORING_TYPE_" + sCriticalityType.toUpperCase());
					}
				}
				var sMsr = oCandidate.msr.getName();
				var cb = Msr.Calculated.getCallbacks(sCalculatedProperty, sCriticalityType, sMsr);
				oCandidate.parsed.callbacks[sCriticalityType] = cb;
			}

		};
	};

	Msr.Calculated.getCriticalityType = function(value) {
		var sCriticalityType;
		switch (value) {
			case 0:
				sCriticalityType = CriticalityType.Neutral;
				break;
			case 1:
				sCriticalityType = CriticalityType.Negative;
				break;
			case 2:
				sCriticalityType = CriticalityType.Critical;
				break;
			case 3:
				sCriticalityType = CriticalityType.Positive;
				break;
			default:
				sCriticalityType = undefined;
				break;
		}
		return sCriticalityType;
	};

	Msr.DynamicThresholds.validate = function(oSetting, sMsr, oDimMsr) {
		var allMsr = oDimMsr.allMsr;
		var arr = [],
			settings = oSetting[sMsr].DynamicThresholds, sDir;
		if (SUPPORTED_IMPROVEMENT.indexOf(settings.ImprovementDirection) > -1) {
			sDir = settings.ImprovementDirection;
		} else {
			//clid32
			throw new ChartLog('error', 'Colorings.Criticality.DynamicThresholds', 'ImprovementDirection should be one of \'Maximize\', \'Minimize\' and \'Target\'.');
		}

		var lowArr = [settings.ToleranceRangeLowValue, settings.DeviationRangeLowValue, settings.AcceptanceRangeLowValue];
		var hiArr = [settings.ToleranceRangeHighValue, settings.DeviationRangeHighValue, settings.AcceptanceRangeHighValue];

		switch (sDir) {
			case "Maximize":
				arr = lowArr;
				break;
			case "Minimize":
				arr = hiArr;
				break;
			case "Target":
				arr = lowArr.concat(hiArr);
				break;
			default:
		}

		if (ColoringUtils.isNumber.apply(null, arr)) {
			//clid20
			throw new ChartLog('error', 'Colorings.Criticality.DynamicThresholds', 'Invalid Thresholds settings.');
		}

		//clid25
		//dynamic threshold allow number or empty
		//so we only check measure name
		arr = arr.filter(function(e){
			return typeof e == "string";
		});
		ColoringUtils.notIn(arr, allMsr, 'Colorings.Criticality.DynamicThresholds', 'Thresholds measure, ', ', does not exist in data model.');
	};

	Msr.DynamicThresholds.parse = function(oConfig, options, oParsed, bMBC, oLocale) {
		var oSetting = oConfig.settings[oConfig.type];
		var sMsr = oConfig.msr ? oConfig.msr.getName() : undefined;
		var sDir = oSetting.ImprovementDirection.toLowerCase();
		var oTolRange = {
			lo: oSetting.ToleranceRangeLowValue,
			hi: oSetting.ToleranceRangeHighValue
		};
		var oDevRange = {
			lo: oSetting.DeviationRangeLowValue,
			hi: oSetting.DeviationRangeHighValue
		};
		var oAcpRange = {
			lo: oSetting.AcceptanceRangeLowValue,
			hi: oSetting.AcceptanceRangeHighValue
		};

		ThresholdsUtils.fillOmit(oAcpRange, oTolRange, oDevRange);

		oParsed.additionalMeasures = [oAcpRange.lo, oAcpRange.hi, oTolRange.lo, oTolRange.hi, oDevRange.lo, oDevRange.hi].filter(function(val) {
			return typeof val === 'string' && options.aMsrs.filter(function(msr){return msr.getName() === val;}).length == 0;
		});
		oParsed.callbacks = ThresholdsUtils.improvement(sDir, sMsr, oAcpRange, oTolRange, oDevRange);
		oParsed.legend = Msr.getLegend(oConfig, oLocale);
	};

	Msr.DynamicThresholds.getContextHandler = function(aCandidateSettings, bMBC, oLocale) {
		var oCandidate = aCandidateSettings[0],
			oSetting = oCandidate.settings[oCandidate.type],
			sDir = oSetting.ImprovementDirection.toLowerCase();

			function _getValue(oContext, key){
				var result;
				if (typeof key === "number") {
					result = key;
				} else {
					result = key ? oContext.getProperty(key) : null;
					if (typeof result === "string") {
						result = Number.parseFloat(result);
					}
				}
				return result;
			}

		return function(oContext) {
			var oTolRange = {};
			oTolRange.lo = _getValue(oContext, oSetting.ToleranceRangeLowValue);
			oTolRange.hi = _getValue(oContext, oSetting.ToleranceRangeHighValue);

			var oDevRange = {};
			oDevRange.lo = _getValue(oContext, oSetting.DeviationRangeLowValue);
			oDevRange.hi = _getValue(oContext, oSetting.DeviationRangeHighValue);

			var oAcpRange = {};
			oAcpRange.lo = _getValue(oContext, oSetting.AcceptanceRangeLowValue);
			oAcpRange.hi = _getValue(oContext, oSetting.AcceptanceRangeHighValue);

			ThresholdsUtils.fillOmit(oAcpRange, oTolRange, oDevRange);
			ThresholdsUtils.checkThreshold(sDir, oAcpRange, oTolRange, oDevRange);
		};
	};

	Msr.ConstantThresholds.validate = function(oSetting, sMsr) {
		var	settings = oSetting[sMsr].ConstantThresholds;
		if (SUPPORTED_IMPROVEMENT.indexOf(settings.ImprovementDirection) === -1) {
			//clid32
			throw new ChartLog('error', 'Colorings.Criticality.ConstantThresholds', 'ImprovementDirection should be one of \'Maximize\', \'Minimize\' and \'Target\'.');
		}
		return {supportHeatMap : true};
	};

	Msr.ConstantThresholds.parse = function(oConfig, options, oParsed, bMBC, oLocale) {
		var oSetting = oConfig.settings[oConfig.type];
		var sMsr = oConfig.msr ? oConfig.msr.getName() : undefined;
		var sMsrName = oConfig.msr ? oConfig.msr.getLabel() || oConfig.msr.getName() : undefined;
		var sDir = oSetting.ImprovementDirection.toLowerCase();
		var oTolRange = {
			lo: oConfig.byAggregation.ToleranceRangeLowValue,
			hi: oConfig.byAggregation.ToleranceRangeHighValue
		};
		var oDevRange = {
			lo: oConfig.byAggregation.DeviationRangeLowValue,
			hi: oConfig.byAggregation.DeviationRangeHighValue
		};
		var oAcpRange = {
			lo: oConfig.byAggregation.AcceptanceRangeLowValue,
			hi: oConfig.byAggregation.AcceptanceRangeHighValue
		};

		ThresholdsUtils.fillOmit(oAcpRange, oTolRange, oDevRange);
		ThresholdsUtils.checkThreshold(sDir, oAcpRange, oTolRange, oDevRange, true);
		if (bMBC) {
			oParsed.legend = ThresholdsUtils.MBCimprovement(sDir, oAcpRange, oTolRange, oDevRange);
		} else {
			oParsed.callbacks = ThresholdsUtils.improvement(sDir, sMsr, oAcpRange, oTolRange, oDevRange);
			oParsed.legend = Msr.ConstantThresholds.getLegend(sDir, sMsrName, oAcpRange, oTolRange, oDevRange, oLocale);
		}
	};

	//mathSymbol
	var ge = "\u2265"; //>=
	var lt = "<";
	var le = "\u2264"; //<=
	var gt = ">";

	var symbolsRevert = {
		"<" : ">",
		">" : "<",
		"\u2265" : "\u2264",
		"\u2264" : "\u2265"
	};

	Msr.ConstantThresholds.getLegend = function(sDir, sMsr, oAcpRange, oTolRange, oDevRange, oLocale) {
		var oLegend = {};
		var devHi = oDevRange.hi;
		var devLo = oDevRange.lo;
		var tolHi = oTolRange.hi;
		var tolLo = oTolRange.lo;
		var acpHi = oAcpRange.hi;
		var acpLo = oAcpRange.lo;

		//make sure legend item is not empty
		//also not showing mathematically-meaningless item. e.g "1 < speed < infinity" or speed < infinity"
		function getText(tokens, deleteInfinity, checkEmptyRange){
			var len = tokens.length;
			var firstInf = tokens[0] === Number.POSITIVE_INFINITY;
			var firstNegInf = tokens[0] === Number.NEGATIVE_INFINITY;
			var lastInf = tokens[len - 1] === Number.POSITIVE_INFINITY;
			var lastNegInf = tokens[len - 1] === Number.NEGATIVE_INFINITY;

			// 1 < speed <= 1 is mathematically-meaningless
			if (checkEmptyRange && tokens[0] === tokens[len - 1]) {
				return "";
			}

			if (deleteInfinity) {
				if (len === 5 && !(firstNegInf && lastInf)) {
					//keep  -inf < measure < infi
					if (lastInf || lastNegInf) {
						tokens = tokens.slice(0, 3);
					}
					if (firstInf || firstNegInf) {
						tokens = tokens.slice(2);
					}
					if (tokens.length <= 1) {
						return "";
					}
				} else if (len === 3 && (firstInf || firstNegInf || lastInf || lastNegInf)) {
					return "";
				}
			}
			//replace infi with translation
			tokens = tokens.map(function(e){
				if (e === Number.POSITIVE_INFINITY) {
					return oLocale.getText("POSITIVE_INFINITY");
				} else if (e === Number.NEGATIVE_INFINITY) {
					return oLocale.getText("NEGATIVE_INFINITY");
				}
				return e;
			});

			//not 25 < speed, but speed > 25
			if (tokens.length === 3 && ColoringUtils.isNumber(tokens[0])) {
				var sym = symbolsRevert[tokens[1]];
				tokens = [tokens[2], sym, tokens[0]];
			}
			return tokens.join(" ");
		}

		var strHasLength = function(e){
			return e && e.length > 0;
		};

		var handlePair = function(pair){
			return pair.filter(strHasLength).join(' , ');
		};

		switch (sDir) {
			case 'maximize':
				oLegend = {
					Positive: getText([sMsr, ge, acpLo]),
					Critical: getText([devLo, le, sMsr, lt, tolLo], true),
					Neutral: getText([tolLo, le, sMsr, lt, acpLo], true),
					Negative: getText([sMsr, lt, devLo])
				};
				break;
			case 'minimize':
				oLegend = {
					Positive: getText([sMsr, le, acpHi]),
					Critical: getText([tolHi, lt, sMsr, le, devHi], true),
					Neutral: getText([acpHi, lt, sMsr, le, tolHi], true),
					Negative: getText([sMsr, gt, devHi])
				};
				break;
			case 'target':
				oLegend = {
					Positive: getText([acpLo, le, sMsr, le, acpHi], true),
					Critical: handlePair([getText([devLo, le, sMsr, lt, tolLo], true, true), getText([tolHi, lt, sMsr, le, devHi], true, true)]),
					Neutral: handlePair([getText([tolLo, le, sMsr, lt, acpLo], true, true), getText([acpHi, lt, sMsr, le, tolHi], true, true)]),
					Negative: handlePair([getText([sMsr, lt, devLo], true),  getText([sMsr, gt, devHi], true)])
				};
				break;
			default:
		}
		return oLegend;
	};

	Msr.ConstantThresholds.getContextHandler = function(aCandidateSettings, bMBC) {
		if (bMBC) {
			var oCandidate = aCandidateSettings[0];
			var sMsr = oCandidate.msr.getName();
			var oLegend = oCandidate.parsed.legend;
			return function(oContext) {
				var iVal = oContext.getProperty(sMsr);
				oLegend.min = Math.min(oLegend.min, iVal);
				oLegend.max = Math.max(oLegend.max, iVal);
			};
		} else {
			return null;
		}
	};

	Msr.getLegend = function(oConfig, oLocale) {
		var oDefaultLegend = {};
		jQuery.each(CriticalityType, function(key, value) {
			oDefaultLegend[value] = oLocale.getText("COLORING_TYPE_" + value.toUpperCase());
		});
		return jQuery.extend(true, {}, oDefaultLegend, oConfig.settings.Legend);
	};

	return Msr;
});
