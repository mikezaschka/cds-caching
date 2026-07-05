/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/suite/ui/microchart/ComparisonMicroChart",
	"sap/suite/ui/microchart/ComparisonMicroChartData",
	"sap/ui/core/Control",
	"sap/ui/model/odata/CountMode",
	"sap/ui/core/format/DateFormat",
	"sap/m/library",
	"sap/base/Log",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(CompLibrary, ComparisonMicroChart, ComparisonMicroChartData, Control, CountMode, DateFormat, mobileLibrary,
			Log, SmartMicroChartBase, SmartMicroChartRenderer, Decimal) {
	"use strict";

	/**
	 * Constructor for a new SmartComparisonMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartComparisonMicroChart control creates a ComparisonMicroChart based on OData metadata and the configuration
	 *        specified. The <code>entitySet</code> property is required to use the control.
	 *        The entity set you specify in this property is used to feetch OData metadata and to generate the micro chart's UI.
	 *        This property can also be used to fetch actual data.<br>
	 *        <b><i>Notes:</i></b><br>
	 *        <ol><li>Most properties are not dynamic and cannot be changed, once the control has been
	 *        initialized.</li><li>
	 *        SmartComparisonMicroChart does not have its own ChartType/Enum annotation.
	 *        This means that ChartType annotation is not specified and SmartComparisonMicroChart cannot be created with a <code>SmartMicroChart</code>.</li></ol>
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @since 1.58
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartComparisonMicroChart
	 */
	var SmartComparisonMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartComparisonMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartComparisonMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartComparisonMicroChart.designtime"
		},
		renderer: SmartMicroChartRenderer
	});

	SmartComparisonMicroChart.prototype._CHART_TYPE = ["Comparison"]; // this type does not have equvalent in annotation ChartType/Enum

	SmartComparisonMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Comparison", true);
		this.setAggregation("_chart", new ComparisonMicroChart(), true);
	};

	SmartComparisonMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
	};

	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained ComparisonMicroChart.
	 * @private
	 */
	SmartComparisonMicroChart.prototype._createAndBindInnerChart = function() {
		if (!(this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartComparisonMicroChart");
			return;
		}

		var oChart = this.getAggregation("_chart"),
			oBarTemplate = new ComparisonMicroChartData({
				value: {
					path: this._oDataPointAnnotations.Value.Path,
					type: new Decimal()
				}
			});

		if (this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path) {
			oBarTemplate.bindProperty("color", {
				path: this._oDataPointAnnotations.Criticality.Path,
				formatter: this._mapCriticalityTypeWithColor.bind(this)
			});
		}

		if (this._oDataPointAnnotations.Title && this._oDataPointAnnotations.Title.Path) {
			oBarTemplate.bindProperty("title", this._oDataPointAnnotations.Title.Path);
		}

		var oAnnotation = this._getPropertyAnnotation.call(this, this._oDataPointAnnotations.Value.Path);
		var oDisplayValue = oAnnotation["com.sap.vocabularies.Common.v1.Text"];
		if (oDisplayValue && oDisplayValue.Path) {
			oBarTemplate.bindProperty("displayValue", oDisplayValue.Path);
		}

		oChart.bindAggregation("data", {
			path: this._getBindingPath(),
			template: oBarTemplate,
			events: {
				change: this._onBindingDataChange.bind(this)
			}
		});
	};


	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartComparisonMicroChart.prototype._onBindingDataChange = function() {
		var oDataBinding = this.getAggregation("_chart").getBinding("data");
		this._updateAssociations(oDataBinding);
	};

	return SmartComparisonMicroChart;
});
