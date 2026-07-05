/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/suite/ui/microchart/AreaMicroChart",
	"sap/suite/ui/microchart/AreaMicroChartPoint",
	"sap/suite/ui/microchart/AreaMicroChartItem",
	"sap/suite/ui/microchart/AreaMicroChartLabel",
	"sap/ui/core/Control",
	"sap/m/library",
	"sap/ui/model/odata/CountMode",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(
	CompLibrary,
	AreaMicroChart,
	AreaMicroChartPoint,
	AreaMicroChartItem,
	AreaMicroChartLabel,
	Control,
	MLibrary,
	CountMode,
	SmartMicroChartBase,
	SmartMicroChartRenderer,
	Decimal
) {
	"use strict";

	// shortcut for sap.m.ValueColor
	var ValueColor = MLibrary.ValueColor;

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartAreaMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartAreaMicroChart control creates a AreaMicroChart based on OData metadata and the configuration
	 *        specified. The entitySet attribute must be specified to use the control. This attribute is used to fetch
	 *        fields from OData metadata, from which Micro Area Chart UI will be generated; it can also be used to fetch
	 *        the actual chart data.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most of the attributes/properties are not dynamic and cannot be changed once the control has been
	 *        initialised.
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @since 1.38
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartAreaMicroChart
	 */
	var SmartAreaMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartAreaMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartAreaMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartAreaMicroChart.designtime",
			properties: {
				/**
				 * Only <code>true</code> value is supported: the chart will be bound to the chartBindingPath or to the entitySet
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				}
			}
		},
		renderer: SmartMicroChartRenderer
	});

	SmartAreaMicroChart.prototype._CHART_TYPE = ["Area", "Line"];

	SmartAreaMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Area", true);
		this.setAggregation("_chart", new AreaMicroChart(), true);
	};

	SmartAreaMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
		oChart.setSize(this.getSize(), true);
	};


	SmartAreaMicroChart.prototype.setShowLabel = function(bShowLabel) {
		if (this.getShowLabel() !== bShowLabel) {
			this.setProperty("showLabel", bShowLabel, true);
			this.getAggregation("_chart").setProperty("showLabel", bShowLabel, true);
			this.invalidate();
		}
		return this;
	};

	/**
	 * @returns {this} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartAreaMicroChart.prototype.setEnableAutoBinding = function() {
		return this.setProperty("enableAutoBinding", true, true);
	};

	/**
	 * The control itself may not be bound.
	 * @returns {this} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartAreaMicroChart.prototype.bindElement = function() {
		return this;
	};

	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained AreaMicroChart.
	 * @private
	 */
	SmartAreaMicroChart.prototype._createAndBindInnerChart = function() {
		this._createChartLabels();
		this._createChartItem("chart", this._oDataPointAnnotations.Value.Path);
		this._createChartItem("target", this._oDataPointAnnotations.TargetValue.Path);
		this._buildThreshold();
	};

	/**
	 * The method is responsible for filling all the thresholds of the contained AreaMicroChart.
	 * @private
	 */
	SmartAreaMicroChart.prototype._buildThreshold = function() {
		var oCriticality = this._oDataPointAnnotations.CriticalityCalculation;

		if (this._hasMember(oCriticality, "ImprovementDirection.EnumMember")) {
			switch (oCriticality.ImprovementDirection.EnumMember) {
				case SmartMicroChartBase._MINIMIZE:
					this._createChartItem("minThreshold", oCriticality.ToleranceRangeHighValue.Path, ValueColor.Good);
					this._createChartItem("maxThreshold", oCriticality.DeviationRangeHighValue.Path, ValueColor.Error);
					break;
				case SmartMicroChartBase._MAXIMIZE:
					this._createChartItem("minThreshold", oCriticality.DeviationRangeLowValue.Path, ValueColor.Error);
					this._createChartItem("maxThreshold", oCriticality.ToleranceRangeLowValue.Path, ValueColor.Good);
					break;
				case SmartMicroChartBase._TARGET:
					this._createChartItem("minThreshold", oCriticality.DeviationRangeLowValue.Path, ValueColor.Error);
					this._createChartItem("maxThreshold", oCriticality.DeviationRangeHighValue.Path, ValueColor.Error);
					this._createChartItem("innerMinThreshold", oCriticality.ToleranceRangeLowValue.Path, ValueColor.Good);
					this._createChartItem("innerMaxThreshold", oCriticality.ToleranceRangeHighValue.Path, ValueColor.Good);
					break;
				default:
					break;
			}
		}
	};

	/**
	 * Creates four AreaMicroChartLabels (firstXLabel, firstYLabel, lastXLabel, lastYLabel).
	 * @private
	 */
	SmartAreaMicroChart.prototype._createChartLabels = function() {
		var oLabel, oMap = this._getLabelsMap();
		for (var k in oMap) {
			oLabel = new AreaMicroChartLabel();
			this.getAggregation("_chart").setAggregation(oMap[k], oLabel, true);
		}
	};

	/**
	 * Creates AreaMicroChartItem for the given aggregation name and based on the given path and sets its
	 * color property.
	 * Only the data binding paths are prepared. Actual data will be filled once the the binding occurs.
	 *
	 * @param {string} aggregationName The name of the aggregation to be set
	 * @param {string} path The path to the y value of the point
	 * @param {sap.m.ValueColor} color The color of the threshold
	 * @private
	 */
	SmartAreaMicroChart.prototype._createChartItem = function(aggregationName, path, color) {
		var oPointTemplate, oItem;
		oPointTemplate = new AreaMicroChartPoint({
			x: {
				path: this._oChartViewMetadata.dimensionFields[0],
				formatter: this._formatDimension.bind(this)
			},
			y: {
				path: path,
				type: new Decimal()
			}
		});

		oItem = new AreaMicroChartItem({
			points: {
				path: this._getBindingPath(),
				template: oPointTemplate,
				parameters: {
					countMode: CountMode.None
				},
				events: {
					change: this._onBindingDataChange.bind(this)
				}
			},
			color: color
		});

		this.getAggregation("_chart").setAggregation(aggregationName, oItem, true);
	};

	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartAreaMicroChart.prototype._onBindingDataChange = function() {
		var oPointsBinding = this.getAggregation("_chart").getAggregation("chart").getBinding("points");
		this._updateAssociations(oPointsBinding);
		this.updateChartLabels.call(this, oPointsBinding);
	};

	/**
	 * Updates the label of the chart.
	 * @param {string} sName The name of the aggregation to be updated.
	 * @param {object} oData A data object to be used for setting label texts directly.
	 * @private
	 */
	SmartAreaMicroChart.prototype._updateLabel = function(sName, oData) {
		var oLabel = this.getAggregation("_chart").getAggregation(sName);

		oLabel.setProperty("label", oData.text, true);

		if (oData.color) {
			oLabel.setProperty("color", oData.color, true);
		}
	};

	/**
	 * Gets the mapping of the chart labels.
	 * @returns {object} Mapping of the chart labels
	 * @private
	 */
	SmartAreaMicroChart.prototype._getLabelsMap = function() {
		return {
			"leftTop": "firstYLabel",
			"rightTop": "lastYLabel",
			"leftBottom": "firstXLabel",
			"rightBottom": "lastXLabel"
		};
	};

	return SmartAreaMicroChart;
});
