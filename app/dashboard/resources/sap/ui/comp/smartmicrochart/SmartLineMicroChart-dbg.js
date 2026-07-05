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
	"sap/suite/ui/microchart/LineMicroChart",
	"sap/suite/ui/microchart/LineMicroChartLine",
	"sap/suite/ui/microchart/LineMicroChartPoint",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer"
], function(CompLibrary, MicroChartLibrary, Control, CountMode, DateFormat, mobileLibrary,
			Log, LineMicroChart, LineMicroChartLine, LineMicroChartPoint, SmartMicroChartBase, SmartMicroChartRenderer) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartLineMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartLineMicroChart control creates a {@link sap.suite.ui.microchart.LineMicroChart LineMicroChart} based on OData metadata and the configuration
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
	 * @alias sap.ui.comp.smartmicrochart.SmartLineMicroChart
	 */
	var SmartLineMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartLineMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartLineMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartLineMicroChart.designtime"
		},
		renderer: SmartMicroChartRenderer
	});

	SmartLineMicroChart.prototype._CHART_TYPE = ["Line"];

	SmartLineMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Line", true);
		this.setAggregation("_chart",
			new LineMicroChart({
				showThresholdLine: false
			}
		), true);
	};

	SmartLineMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
	};

	SmartLineMicroChart.prototype.setShowLabel = function(bShowLabel) {
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
	 * Checks if the medatada is correct and fills the aggregations of the contained LineMicroChart.
	 * @private
	 */
	SmartLineMicroChart.prototype._createAndBindInnerChart = function() {
		if (this._aDataPointAnnotations.length === 0) {
			Log.error("DataPoint annotation missing! Cannot create the SmartLineMicroChart");
			return;
		}

		for (var i = 0; i < this._aDataPointAnnotations.length; i++) {
			if (!(this._aDataPointAnnotations[i].Value && this._aDataPointAnnotations[i].Value.Path)) {
				Log.error("Value DataPoint annotation missing! Cannot create the SmartLineMicroChart");
				return;
			}
		}

		var oChart = this.getAggregation("_chart"),
			oLine;

		this._aDataPointAnnotations.forEach(function(oDataPoint, iIndex) {
			oLine = new LineMicroChartLine(this.getId() + "-line-" + iIndex, {
				points: {
					path: this._getBindingPath(),
					factory: this._pointFactory.bind(this),
					events: {
						change: this._onBindingDataChange.bind(this)
					}
				}
			});
			oChart.addLine(oLine);
		}, this);
	};

	SmartLineMicroChart.prototype._pointFactory = function(sId, oContext) {
		var x, y, oPoint,
			iLine = sId.split("-").slice(-2, -1), // retrieve index of the line from its id
			oLine = this.getAggregation("_chart").getLines()[iLine],
			oDataPointAnnotation = this._aDataPointAnnotations[iLine],
			sCriticality;

		x = oContext.getProperty(this._oChartViewMetadata.dimensionFields[iLine]);
		x = this._formatDimension.call(this, x);

		y = oContext.getProperty(oDataPointAnnotation.Value.Path);
		y = Number(y);

		oPoint = new LineMicroChartPoint({
			x: x,
			y: y
		});

		if (oLine && oDataPointAnnotation.Criticality && oDataPointAnnotation.Criticality.Path) {
			sCriticality = this._mapCriticalityTypeWithColor(oContext.getProperty(oDataPointAnnotation.Criticality.Path));
			this.getAggregation("_chart").getLines()[iLine].setColor(sCriticality);
		}

		return oPoint;
	};

	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartLineMicroChart.prototype._onBindingDataChange = function() {
		var oPointsBinding = this.getAggregation("_chart").getLines()[0].getBinding("points");
		this._updateAssociations(oPointsBinding);
		this.updateChartLabels.call(this, oPointsBinding);
	};

	/**
	 * Updates the label of the chart.
	 * @param {string} sName The name of the property to be updated.
	 * @param {object} oData A data object to be used for setting label texts directly.
	 * @private
	 */
	SmartLineMicroChart.prototype._updateLabel = function(sName, oData) {
		this.getAggregation("_chart").setProperty(sName, oData.text, true);
	};

	/**
	 * Gets the mapping of the chart labels.
	 * @returns {object} Mapping of the chart labels
	 * @private
	 */
	SmartLineMicroChart.prototype._getLabelsMap = function() {
		return {
			"leftTop": "leftTopLabel",
			"rightTop": "rightTopLabel",
			"leftBottom": "leftBottomLabel",
			"rightBottom": "rightBottomLabel"
		};
	};

	return SmartLineMicroChart;
});
