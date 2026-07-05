/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/suite/ui/microchart/StackedBarMicroChart",
	"sap/suite/ui/microchart/StackedBarMicroChartBar",
	"sap/ui/core/Control",
	"sap/ui/model/odata/CountMode",
	"sap/ui/core/format/DateFormat",
	"sap/m/library",
	"sap/base/Log",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(CompLibrary, StackedBarMicroChart, StackedBarMicroChartBar, Control, CountMode, DateFormat, mobileLibrary,
			Log, SmartMicroChartBase, SmartMicroChartRenderer, Decimal) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartStackedBarMicroChart control creates a StackedBarMicroChart based on OData metadata and the configuration
	 *        specified. The <code>entitySet</code> property is required. The entity set you specify in this property is used
	 *        to fetch OData metadata and to generate the micro chart's UI. This property can also be used to fetch actual chart data.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most properties are not dynamic and cannot be changed, once the control has been
	 *        initialised.
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @since 1.58
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart
	 */
	var SmartStackedBarMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartStackedBarMicroChart.designtime"
		},
		renderer: SmartMicroChartRenderer
	});

	SmartStackedBarMicroChart.prototype._CHART_TYPE = ["BarStacked"];

	SmartStackedBarMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "BarStacked", true);
		this.setAggregation("_chart", new StackedBarMicroChart(), true);
	};

	SmartStackedBarMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
	};

	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained StackedBarMicroChart.
	 * @private
	 */
	SmartStackedBarMicroChart.prototype._createAndBindInnerChart = function() {
		if (!(this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartStackedBarMicroChart");
			return;
		}

		var oChart = this.getAggregation("_chart"),
			oBarTemplate = new StackedBarMicroChartBar({
				value: {
					path: this._oDataPointAnnotations.Value.Path,
					type: new Decimal()
				}
			});

		if (this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path) {
			oBarTemplate.bindProperty("valueColor", {
				path:this._oDataPointAnnotations.Criticality.Path,
				formatter: this._mapCriticalityTypeWithColor.bind(this)
			});
		}

		var oAnnotation = this._getPropertyAnnotation.call(this, this._oDataPointAnnotations.Value.Path);
		var oDisplayValue = oAnnotation["com.sap.vocabularies.Common.v1.Text"];
		if (oDisplayValue && oDisplayValue.Path) {
			oBarTemplate.bindProperty("displayValue", oDisplayValue.Path);
		}

		oChart.bindAggregation("bars", {
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
	SmartStackedBarMicroChart.prototype._onBindingDataChange = function() {
		var oBarsBinding = this.getAggregation("_chart").getBinding("bars");
		this._updateAssociations(oBarsBinding);
	};

	return SmartStackedBarMicroChart;
});
