/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(['sap/chart/ChartType', "sap/base/util/deepEqual"], function(ChartType, deepEqual) {
	"use strict";

	var _CONFIG = {
		chartTypes: [
			ChartType.Bar,
			ChartType.Column,
			ChartType.Line,
			ChartType.Combination,
			ChartType.Pie,
			ChartType.Donut,
			ChartType.Scatter,
			ChartType.Bubble,
			ChartType.Heatmap,
			ChartType.Bullet,
			ChartType.VerticalBullet,
			ChartType.StackedBar,
			ChartType.StackedColumn,
			ChartType.StackedCombination,
			ChartType.HorizontalStackedCombination,
			ChartType.DualBar,
			ChartType.DualColumn,
			ChartType.DualLine,
			ChartType.DualStackedBar,
			ChartType.DualStackedColumn,
			ChartType.DualCombination,
			ChartType.DualHorizontalCombination,
			ChartType.DualStackedCombination,
			ChartType.DualHorizontalStackedCombination,
			ChartType.PercentageStackedBar,
			ChartType.PercentageStackedColumn,
			ChartType.PercentageDualStackedBar,
			ChartType.PercentageDualStackedColumn,
			ChartType.Waterfall,
			ChartType.HorizontalWaterfall
		],
		pagingChartTypes: [
		    ChartType.Bar,
			ChartType.Column,
			ChartType.Line,
			ChartType.Combination,
			ChartType.Bullet,
			ChartType.VerticalBullet,
			ChartType.StackedBar,
			ChartType.StackedColumn,
			ChartType.StackedCombination,
			ChartType.HorizontalStackedCombination,
			ChartType.DualBar,
			ChartType.DualColumn,
			ChartType.DualLine,
			ChartType.DualStackedBar,
			ChartType.DualStackedColumn,
			ChartType.DualCombination,
			ChartType.DualHorizontalCombination,
			ChartType.DualStackedCombination,
			ChartType.DualHorizontalStackedCombination,
			ChartType.PercentageStackedBar,
			ChartType.PercentageStackedColumn,
			ChartType.PercentageDualStackedBar,
			ChartType.PercentageDualStackedColumn
		],
		timeChartTypes: [
			"timeseries_line",
			"timeseries_column",
			"timeseries_bubble",
			"timeseries_scatter",
			"timeseries_combination",
			"dual_timeseries_combination",
			"timeseries_bullet",
			"timeseries_stacked_column",
			"timeseries_100_stacked_column",
			"timeseries_waterfall"
		],
		oAdapteredChartTypes: {
		    "line": "timeseries_line",
		    "column": "timeseries_column",
		    "scatter": "timeseries_scatter",
		    "bubble": "timeseries_bubble",
		    "combination": "timeseries_combination",
		    "dual_combination": "dual_timeseries_combination",
		    "vertical_bullet": "timeseries_bullet",
		    "stacked_column": "timeseries_stacked_column",
		    "100_stacked_column": "timeseries_100_stacked_column",
		    "waterfall": "timeseries_waterfall"
		},
		nonSemanticPatternChartType : [
			ChartType.Pie,
			ChartType.Donut,
			ChartType.PercentageDonut,
			ChartType.Scatter,
			ChartType.Bubble,
			ChartType.Heatmap,
			ChartType.Waterfall,
			ChartType.HorizontalWaterfall,
			"timeseries_bubble",
			"timeseries_scatter",
			"timeseries_waterfall"
		],
		lineChartType: [
			ChartType.Line,
			ChartType.DualLine,
			'timeseries_line'
		]
	};
	return {
		CONFIG: _CONFIG,
		makeNotifyParentProperty: function(sPropertyName) {
			return function(oValue, bSuppressInvalidate) {
				var oOldValue = this.mProperties[sPropertyName];

				oValue = this.validateProperty(sPropertyName, oValue);

				if (deepEqual(oOldValue, oValue)) {
					return this;
				}

				this.setProperty(sPropertyName, oValue, bSuppressInvalidate);

				if (bSuppressInvalidate) {
					return this;
				}

				var oParent = this.getParent();
				if (oParent && typeof oParent._invalidateBy === "function") {
					oParent._invalidateBy({
						source: this,
						property: sPropertyName,
						oldValue: oOldValue,
						newValue: oValue
					});
				}

				return this;
			};
		},
		isStackedLikeChart: function(sChartType) {
			return sChartType.indexOf('stacked') >= 0 ||
				sChartType.indexOf('waterfall') >= 0;
		},
		isBulletChart: function(sChartType) {
			return sChartType.indexOf('bullet') >= 0;
		}
	};
});