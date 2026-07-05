/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/DeltaMicroChart",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"sap/base/Log",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(library, Control, DeltaMicroChart, SmartMicroChartBase, Log, SmartMicroChartRenderer, Decimal) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartDeltaMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartDeltaMicroChart control creates a {@link sap.suite.ui.microchart.DeltaMicroChart DeltaMicroChart} based on OData metadata and the configuration
	 *        specified. The delta micro chart represents the delta of two values as a chart.<br>
	 *        The <code>entitySet</code> property is required to use the control.
	 *        The entity set you specify in this property is used to fetch OData metadata and to generate the micro chart's UI.
	 *        This property can also be used to fetch actual data.<br>
	 *        <b><i>Notes:</i></b><br>
	 *        <ul><li>Most properties are not dynamic and cannot be changed once the control has been
	 *        initialized.</li><li>
	 *        SmartDeltaMicroChart does not have its own ChartType/Enum annotation.
	 *        This means that ChartType annotation is not specified and SmartDeltaMicroChart cannot be created with a <code>SmartMicroChart</code>.</li></ul>
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @since 1.61
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartDeltaMicroChart
	 */
	var SmartDeltaMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartDeltaMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartDeltaMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartDeltaMicroChart.designtime",
			properties: {
				/**
				 * If set to <code>true</code>, this enables automatic data binding using the <code>chartBindingPath</code> property
				 * , if such a property exists.
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			}
		},
		renderer: SmartMicroChartRenderer
	});

	SmartDeltaMicroChart.prototype._CHART_TYPE = ["Delta"];

	SmartDeltaMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", this._CHART_TYPE, true);
		this.setAggregation("_chart", new DeltaMicroChart(), true);
	};

	SmartDeltaMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		// TODO uncomment once delta chart is integrated
		// oChart.setHeight(this.getHeight(), true);
	};

	SmartDeltaMicroChart.prototype._createAndBindInnerChart = function() {
		if (this._aDataPointAnnotations.length < 2) {
			Log.error("Two DataPoint annotation are needed! Cannot create the SmartColumnMicroChart");
			return;
		}

		if (!(this._aDataPointAnnotations[0].Value && this._aDataPointAnnotations[0].Value.Path &&
				this._aDataPointAnnotations[1].Value && this._aDataPointAnnotations[1].Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartColumnMicroChart");
			return;
		}

		this.bindProperties();
		this._updateAssociations();
	};

	SmartDeltaMicroChart.prototype.bindProperties = function() {
		var oChart = this.getAggregation("_chart"),
			oFormatter1 = this._getLabelNumberFormatter.call(this, this._aDataPointAnnotations[0].Value.Path),
			oFormatter2 = this._getLabelNumberFormatter.call(this, this._aDataPointAnnotations[1].Value.Path);

		oChart.bindProperty("value1", {
			path: this._aDataPointAnnotations[0].Value.Path,
			type: new Decimal(),
			events: {
				change: this._onBindingDataChange.bind(this)
			}
		});

		oChart.bindProperty("value2", {
			path: this._aDataPointAnnotations[1].Value.Path,
			type: new Decimal(),
			events: {
				change: this._onBindingDataChange.bind(this)
			}
		});

		// show formmated value based on the annotations insteaf of just number
		oChart.bindProperty("displayValue1", {
			path: this._aDataPointAnnotations[0].Value.Path,
			formatter: oFormatter1.format.bind(oFormatter1)
		});

		oChart.bindProperty("displayValue2", {
			path: this._aDataPointAnnotations[1].Value.Path,
			formatter: oFormatter1.format.bind(oFormatter2)
		});

		if (this._aDataPointAnnotations[0].Title && this._aDataPointAnnotations[0].Title.Path) {
			oChart.bindProperty("title1", {
				path: this._aDataPointAnnotations[0].Title.Path
			});
		}

		if (this._aDataPointAnnotations[1].Title && this._aDataPointAnnotations[1].Title.Path) {
			oChart.bindProperty("title2", {
				path: this._aDataPointAnnotations[1].Title.Path
			});
		}

		// criticality is taken from the first datapoint
		if (this._aDataPointAnnotations[0].Criticality && this._aDataPointAnnotations[0].Criticality.Path) {
			oChart.bindProperty("color", {
				path: this._aDataPointAnnotations[0].Criticality.Path,
				formatter: this._mapCriticalityTypeWithColor.bind(this)
			});
		}
	};

	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartDeltaMicroChart.prototype._onBindingDataChange = function() {
		// update deltaDisplayValue based on current values
		var oChart = this.getAggregation("_chart"),
			oFormatter = this._getLabelNumberFormatter.call(this, this._aDataPointAnnotations[0].Value.Path);

		oChart.setDeltaDisplayValue(oFormatter.format(oChart._getDeltaValue()));

		this._updateAssociations();
	};

	return SmartDeltaMicroChart;
});
