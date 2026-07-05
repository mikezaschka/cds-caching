/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/core/Element',
	'sap/ui/comp/library',
	'./ColumnWrapper',
	'sap/ui/core/CustomData'
], function(Element, library, ColumnWrapper, CustomData) {
	"use strict";

	//shortcut for sap.ui.comp.personalization.AggregationRole
	var AggregationRole = library.personalization.AggregationRole;

	/**
	 * The ChartWrapper can be used to wrap a chart.
	 *
	 * @class Chart Wrapper
	 * @extends sap.ui.core.Element
	 * @author SAP
	 * @version 1.34.0-SNAPSHOT
	 * @private
	 * @since 1.34.0
	 * @alias sap.ui.comp.personalization.ChartWrapper
	 */
	var ChartWrapper = Element.extend("sap.ui.comp.personalization.ChartWrapper",
	/** @lends sap.ui.comp.personalization.ChartWrapper.prototype */
	{
		constructor: function(sId, mSettings) {
			Element.apply(this, arguments);
		},
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * Array of filters coming from outside.
				 * @type {sap.m.P13nFilterItem[]}
				 */
				externalFilters: {
					type: "any[]",
					defaultValue: []
				}
			},
			aggregations: {
				/**
				 * Defines columns.
				 */
				columns: {
					type: "sap.ui.comp.personalization.ColumnWrapper",
					multiple: true,
					singularName: "column"
				}
			},
			associations: {
				/**
				 * Defines original chart object.
				 */
				chart: {
					type: "sap.chart.Chart",
					multiple: false
				}
			},
			events: {
				/**
				 * Fire filters set via property <code>externalFilters</code>.
				 */
				externalFiltersSet: {
					parameters: {
						/**
						 * Array of filters to be shown in the filter panel.
						 */
						filters: {
							type: "sap.m.P13nFilterItem[]"
						}
					}
				}
			}
		}
	});

	ChartWrapper.prototype.getChartObject = function() {
		var oChart = this.getAssociation("chart");
		if (typeof oChart === "string") {
			oChart = Element.getElementById(oChart);
		}
		return oChart;
	};

	ChartWrapper.prototype.getModel = function() {
		return this.getChartObject().getModel();
	};

	ChartWrapper.prototype.getDomRef = function() {
		var oChart = this.getChartObject();
		return oChart && oChart.getDomRef();
	};

	ChartWrapper.createChartWrapper = function(oChart, aAdditionalData, aColumnKeysOrdered) {
		var oP13nData;
		var oColumnKey2ColumnMap = {};
		oChart.getDimensions().forEach(function(oDimension) {
			oP13nData = oDimension.data("p13nData");
			oColumnKey2ColumnMap[oP13nData.columnKey] = new ColumnWrapper({
				label: oDimension.getLabel(),
				tooltip: oDimension.getTooltip(),
				selected: oChart.getVisibleDimensions().indexOf(oDimension.getName()) > -1,
				aggregationRole: AggregationRole.Dimension,
				role: oDimension.getRole() ? oDimension.getRole() : oDimension.getMetadata().getProperty("role").getDefaultValue(),//oRb.getText('COLUMNSPANEL_CHARTROLE_CATEGORY'),
				sorted: oP13nData.sorted,
				sortOrder: oP13nData.sortOrder,
				customData: new CustomData({
					key: "p13nData",
					value: oP13nData
				}),
				hierarchyLevel: oP13nData.hierarchyLevel,
				chart: oChart
			});
		});
		oChart.getMeasures().forEach(function(oMeasure) {
			oP13nData = oMeasure.data("p13nData");
			oColumnKey2ColumnMap[oP13nData.columnKey] = new ColumnWrapper({
				label: oMeasure.getLabel(),
				tooltip: oMeasure.getTooltip(),
				selected: oChart.getVisibleMeasures().indexOf(oMeasure.getName()) > -1,
				aggregationRole: AggregationRole.Measure,
				role: oMeasure.getRole() ? oMeasure.getRole() : oMeasure.getMetadata().getProperty("role").getDefaultValue(),//oRb.getText('COLUMNSPANEL_CHARTROLE_AXIS1'),
				sorted: oP13nData.sorted,
				sortOrder: oP13nData.sortOrder,
				customData: new CustomData({
					key: "p13nData",
					value: oP13nData
				}),
				chart: oChart
			});
		});
		if (aAdditionalData) {
			aAdditionalData.forEach(function(oP13nData) {
				oColumnKey2ColumnMap[oP13nData.columnKey] = new ColumnWrapper({
					label: oP13nData.label,
					tooltip: oP13nData.tooltip,
					selected: false,
					aggregationRole: AggregationRole.NotDimeasure,
					sorted: oP13nData.sorted,
					sortOrder: oP13nData.sortOrder,
					customData: new CustomData({
						key: "p13nData",
						value: oP13nData
					}),
					chart: oChart
				});
				if (!oColumnKey2ColumnMap[oP13nData.columnKey].getParent()) {
					oChart.addDependent(oColumnKey2ColumnMap[oP13nData.columnKey]);
				}
			});
		}
		return new ChartWrapper({
			chart: oChart,
			columns: aColumnKeysOrdered.map(function(sColumnKey) {
				return oColumnKey2ColumnMap[sColumnKey];
			})
		});
	};

	return ChartWrapper;

});
