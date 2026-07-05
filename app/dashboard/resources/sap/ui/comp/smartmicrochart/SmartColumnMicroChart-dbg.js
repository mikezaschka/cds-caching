/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/suite/ui/microchart/library",
	"sap/ui/core/Control",
	"sap/ui/model/odata/CountMode",
	"sap/ui/core/format/DateFormat",
	"sap/m/library",
	"sap/base/Log",
	"sap/suite/ui/microchart/ColumnMicroChart",
	"sap/suite/ui/microchart/ColumnMicroChartData",
	"sap/suite/ui/microchart/ColumnMicroChartLabel",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(CompLibrary, MicroChartLibrary, Control, CountMode, DateFormat, mobileLibrary,
			Log, ColumnMicroChart, ColumnMicroChartData, ColumnMicroChartLabel, SmartMicroChartBase, SmartMicroChartRenderer, Decimal) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartColumnMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartColumnMicroChart control creates a {@link sap.suite.ui.microchart.ColumnMicroChart ColumnMicroChart} based on OData metadata and the configuration
	 *        specified. <br>The <code>entitySet</code> property is required. The entity set you specify in this property is used
	 *        to fetch OData metadata and to generate the micro chart's UI. This property can also be used to fetch actual chart data.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most properties are not dynamic and cannot be changed, once the control has been
	 *        initialized.
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @since 1.60
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartColumnMicroChart
	 */
	var SmartColumnMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartColumnMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartColumnMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartColumnMicroChart.designtime"
		},
		renderer: SmartMicroChartRenderer
	});

	SmartColumnMicroChart.prototype._CHART_TYPE = ["Column"];

	SmartColumnMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Column", true);
		this.setAggregation("_chart", new ColumnMicroChart(), true);
	};

	SmartColumnMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
	};

	SmartColumnMicroChart.prototype.setShowLabel = function(bShowLabel) {
		var oChart;

		if (this.getShowLabel() !== bShowLabel) {
			oChart = this.getAggregation("_chart");
			this.setProperty("showLabel", bShowLabel, true);
			oChart.setProperty("showTopLabels", bShowLabel, true);
			oChart.setProperty("showBottomLabels", bShowLabel, true);
			oChart.invalidate();
		}
		return this;
	};

	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained ColumnMicroChart.
	 * @private
	 */
	SmartColumnMicroChart.prototype._createAndBindInnerChart = function() {
		if (this._aDataPointAnnotations.length === 0) {
			Log.error("DataPoint annotation missing! Cannot create the SmartColumnMicroChart");
			return;
		}

		if (!(this._aDataPointAnnotations[0].Value && this._aDataPointAnnotations[0].Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartColumnMicroChart");
			return;
		}

		var oChart = this.getAggregation("_chart"),
			oColumnTemplate = new ColumnMicroChartData({
				value: {
					path: this._aDataPointAnnotations[0].Value.Path,
					type: new Decimal()
				}
			});

		if (this._aDataPointAnnotations[0].Criticality && this._aDataPointAnnotations[0].Criticality.Path) {
			oColumnTemplate.bindProperty("color", {
				path: this._aDataPointAnnotations[0].Criticality.Path,
				formatter: this._mapCriticalityTypeWithColor.bind(this)
			});
		}

		if (this._aDataPointAnnotations[0].Title && this._aDataPointAnnotations[0].Title.Path) {
			oColumnTemplate.bindProperty("label", this._aDataPointAnnotations[0].Title.Path);
		}

		var oAnnotation = this._getPropertyAnnotation.call(this, this._aDataPointAnnotations[0].Value.Path);
		var oDisplayValue = oAnnotation["com.sap.vocabularies.Common.v1.Text"];
		if (oDisplayValue && oDisplayValue.Path) {
			oChart.setAllowColumnLabels(true);
			oColumnTemplate.bindProperty("displayValue", oDisplayValue.Path);
		}

		oChart.bindAggregation("columns", {
			path: this._getBindingPath(),
			template: oColumnTemplate,
			events: {
				change: this._onBindingDataChange.bind(this)
			}
		});

		this._createChartLabels();
	};

	/**
	 * Creates four AreaMicroChartLabels (leftTopLabel, leftBottomLabel, rightTopLabel, rightBottomLabel).
	 * @private
	 */
	SmartColumnMicroChart.prototype._createChartLabels = function() {
		var oLabel, oMap = this._getLabelsMap();
		for (var k in oMap) {
			oLabel = new ColumnMicroChartLabel();
			this.getAggregation("_chart").setAggregation(oMap[k], oLabel, true);
		}
	};

	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartColumnMicroChart.prototype._onBindingDataChange = function() {
		var oPointsBinding = this.getAggregation("_chart").getBinding("columns");
		this._updateAssociations(oPointsBinding);
		this.updateChartLabels.call(this, oPointsBinding);
	};

	/**
	 * Updates the label of the chart.
	 * @param {string} sName The name of the aggregation to be updated.
	 * @param {object} oData A data object to be used for setting label texts directly.
	 * @private
	 */
	SmartColumnMicroChart.prototype._updateLabel = function(sName, oData) {
		var oLabel = this.getAggregation("_chart").getAggregation(sName);
		//Check for null to skip the assignment of property
		if (oLabel !== null) {
			oLabel.setProperty("label", oData.text, true);
			if (oData.color) {
				oLabel.setProperty("color", oData.color, true);
			}
		}
	};

	/**
	 * Gets the mapping of the chart labels.
	 * @returns {object} Mapping of the chart labels
	 * @private
	 */
	SmartColumnMicroChart.prototype._getLabelsMap = function() {
		return {
			"leftTop": "leftTopLabel",
			"rightTop": "rightTopLabel",
			"leftBottom": "leftBottomLabel",
			"rightBottom": "rightBottomLabel"
		};
	};

	return SmartColumnMicroChart;
});
