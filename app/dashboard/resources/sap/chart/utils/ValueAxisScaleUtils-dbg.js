/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'sap/chart/AutoScaleMode',
	'sap/chart/ScaleBehavior',
	'sap/chart/ChartLog',
	'sap/chart/utils/ChartUtils'
], function(
	AutoScaleMode,
	ScaleBehavior,
	ChartLog,
	ChartUtils
) {
	"use strict";

	var ValueAxisScaleUtils = {};

	ValueAxisScaleUtils.getValueAxisScaleSetting = function(sChartType, oValueAxisScale, aAllMeasures, aVisibleMeasures) {
		var aMeasures = aAllMeasures.filter(function(oMeasure) {
			return aVisibleMeasures.indexOf(oMeasure.getName()) !== -1;
		});

		var sRole, sMeasure, oBoundaries = {};
		aMeasures.forEach(function(oMeasure) {
			sMeasure = oMeasure.getName();
			sRole = oMeasure._getFixedRole();
			if (sRole === 'axis1' || sRole === 'axis2') {
				if (!oBoundaries[sRole]) {
					oBoundaries[sRole] = {
						measures: [],
						min : Number.POSITIVE_INFINITY,
						max : Number.NEGATIVE_INFINITY
					};
				}
				oBoundaries[sRole].measures.push(sMeasure);
			}
		});

		var oBoundaryValue,
			bFixedScale = oValueAxisScale && oValueAxisScale.scaleBehavior === ScaleBehavior.FixedScale,
			bIsMultipleStacked = ChartUtils.isStackedLikeChart(sChartType) && aMeasures.length > 1,
			oMeasureBoundaryValues = (oValueAxisScale && oValueAxisScale.fixedScaleSettings
				&& oValueAxisScale.fixedScaleSettings.measureBoundaryValues) || {};
		if (bFixedScale) {
			if (bIsMultipleStacked) {
				var aStackedBoundaryValues =
					(oValueAxisScale && oValueAxisScale.fixedScaleSettings &&
						oValueAxisScale.fixedScaleSettings.stackedMultipleMeasureBoundaryValues) || [];
				if (aStackedBoundaryValues && aStackedBoundaryValues.length > 0) {
					var getBoundarySetting = function(oBoundary) {
						return aStackedBoundaryValues.filter(function(obj) {
							return obj.measures && obj.measures.length > 0 &&
								obj.measures.sort().toString() === oBoundary.measures.sort().toString();
						});
					};
					for (var key in oBoundaries) {
						if (oBoundaries.hasOwnProperty(key)) {
							var oBoundary = oBoundaries[key];
							var aBoundarySetting = getBoundarySetting(oBoundary);
							if (aBoundarySetting && aBoundarySetting.length > 0) {
								oBoundaryValue =
									aBoundarySetting[aBoundarySetting.length - 1].boundaryValues;
								if (oBoundaryValue &&
									(isFinite(oBoundaryValue.minimum) && typeof oBoundaryValue.minimum == "number") ||
									(isFinite(oBoundaryValue.maximum) && typeof oBoundaryValue.maximum == "number") ) {
									oBoundary.min = oBoundaryValue.minimum;
									oBoundary.max = oBoundaryValue.maximum;
								}
							}
						}
					}
				}
			} else {
				aMeasures.forEach(function(oMeasure) {
					sRole = oMeasure._getFixedRole();
					if (sRole === 'axis1' || sRole === 'axis2') {
						sMeasure = oMeasure.getName();
						oBoundaryValue = oMeasureBoundaryValues[sMeasure];
						if (!oBoundaryValue || !(isFinite(oBoundaryValue.minimum) && typeof oBoundaryValue.minimum == "number" ) ||
							!(isFinite(oBoundaryValue.maximum) && typeof oBoundaryValue.maximum == "number")) {
							oBoundaries[sRole].min = Number.NEGATIVE_INFINITY;
							oBoundaries[sRole].max = Number.POSITIVE_INFINITY;
						} else {
							if (oBoundaries[sRole].min > oBoundaryValue.minimum) {
								oBoundaries[sRole].min = oBoundaryValue.minimum;
							}
							if (oBoundaries[sRole].max < oBoundaryValue.maximum) {
								oBoundaries[sRole].max = oBoundaryValue.maximum;
							}
						}
					}
				});
			}
		}

		bFixedScale = false;
		var aScale = [], bIsBullet = ChartUtils.isBulletChart(sChartType);
		for (var key in oBoundaries) {
			if (oBoundaries.hasOwnProperty(key)) {
				var oBoundary = oBoundaries[key];
				var bIsAuto = !(isFinite(oBoundary.min) && typeof oBoundary.min == "number" && isFinite(oBoundary.max) && typeof oBoundary.max == "number");
				var feed = key === 'axis1' ? "valueAxis" : "valueAxis2";
				if (bIsBullet) {
					feed = 'actualValues';
				}
				if (bIsAuto) {
					if (oValueAxisScale && oValueAxisScale.scaleBehavior === ScaleBehavior.FixedScale) {
						new ChartLog('error', 'Chart.ValueAxisScale',
							feed + ' was switched to auto scale, because minimum or maximum value is missing in measure').display();
					}
				} else if (oBoundary.min > oBoundary.max) {
					new ChartLog('error', 'Chart.ValueAxisScale',
						feed + ' was switched to auto scale, because minimum value exceeds maximum value').display();
				} else {
					bFixedScale = true;
				}
				aScale.push({
					"feed": feed,
					"type": "linear",
					"min": bIsAuto ? "auto" : oBoundary.min,
					"max": bIsAuto ? "auto" : oBoundary.max
				});
			}
		}

		var oProperty = {};
		if (!bFixedScale) {
			var bZeroAlwaysVisible = true, bSyncValueAxis = false;
			if (oValueAxisScale && oValueAxisScale.autoScaleSettings &&
				oValueAxisScale.autoScaleSettings.zeroAlwaysVisible === false) {
				bZeroAlwaysVisible = false;
			}
			if (oValueAxisScale && oValueAxisScale.autoScaleSettings &&
				oValueAxisScale.autoScaleSettings.syncWith === AutoScaleMode.VisibleData) {
				bSyncValueAxis = true;
			}

			oProperty = {
				plotArea: {
					adjustScale : !bZeroAlwaysVisible
				},
				interaction: {
					syncValueAxis : bSyncValueAxis
				}
			};
		}

		return {
			scale : aScale,
			property : oProperty
		};
	};

	return ValueAxisScaleUtils;
});
