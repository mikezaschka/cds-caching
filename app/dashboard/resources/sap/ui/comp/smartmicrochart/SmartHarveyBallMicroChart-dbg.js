/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/library",
	"sap/m/library",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"sap/suite/ui/microchart/HarveyBallMicroChart",
	"sap/suite/ui/microchart/HarveyBallMicroChartItem",
	"sap/base/Log",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function (library, Control, MicroChartLibrary, MobileLibrary, SmartMicroChartBase, HarveyBallMicroChart, HarveyBallMicroChartItem, Log, SmartMicroChartRenderer, Decimal) {
	"use strict";

	/**
	 * Constructor for a new SmartHarveyBallMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class
	 * The SmartHarveyBallMicroChart control creates a {@link sap.suite.ui.microchart.HarveyBallMicroChart}
	 * based on OData metadata and the configuration specified in the <code>mSettings</code> of the {@link sap.ui.base.ManagedObject}.
	 * <br>The <code>entitySet</code> property is required. The entity set is used to fetch OData metadata and
	 * annotation information from the provided default OData model. The chart's UI is created based on this data.
	 * <br>
	 * <b><i>Note:</i></b><br>
	 * Most of the properties are not dynamic and cannot be changed once the control has been
	 * initialized.
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @constructor
	 * @public
	 * @since 1.62.0
	 * @alias sap.ui.comp.smartmicrochart.SmartHarveyBallMicroChart
	 */
	var SmartHarveyBallMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartHarveyBallMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartHarveyBallMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartHarveyBallMicroChart.designtime",
			properties: {
				/**
				 * If set to <code>true</code>, the chart is automatically bound using the <code>chartBindingPath</code>
				 * property, if it is specified.
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its <code>text</code> property is set to
				 * the free text provided by annotations. The <code>Value</code> property of the <code>DataPoint</code>
				 * annotation should be annotated with this free text. The <code>Label</code> annotation from the
				 * <code>OData Common</code> vocabulary can be used.
				 */
				freeText: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				}
			}
		},
		renderer: SmartMicroChartRenderer
	});

	SmartHarveyBallMicroChart._CHART_TYPE = ["Pie"];

	SmartHarveyBallMicroChart.prototype.init = function () {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Pie", true);
		this.setAggregation("_chart", new HarveyBallMicroChart(), true);
	};

	SmartHarveyBallMicroChart.prototype.onBeforeRendering = function () {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
	};

	/**
	 * Creates and binds the inner chart once the metadata is loaded.
	 * @private
	 */
	SmartHarveyBallMicroChart.prototype._createAndBindInnerChart = function () {
		if (!(this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartHarveyBallMicroChart");
			return;
		}

		// Binding value and valueLabel property
		var oChart = this.getAggregation("_chart"),
			oItem = new HarveyBallMicroChartItem({
				fraction: {
					path: this._oDataPointAnnotations.Value.Path,
					type: new Decimal()
				}
			});

		var oVFormatter = this._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.Value.Path);

		oItem.bindProperty("fractionLabel", {
			path: this._oDataPointAnnotations.Value.Path,
			formatter: oVFormatter.format.bind(oVFormatter)
		});

		var oMVFormatter = this._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.MaximumValue.Path);

		// Bind total and totalLabel property
		if (this._oDataPointAnnotations.MaximumValue && this._oDataPointAnnotations.MaximumValue.Path) {
			oChart.bindProperty("total", {
				path: this._oDataPointAnnotations.MaximumValue.Path,
				type: new Decimal()
			});

			oChart.bindProperty("totalLabel", {
				path: this._oDataPointAnnotations.MaximumValue.Path,
				formatter: oMVFormatter.format.bind(oMVFormatter)
			});
		}

		if (this._getAnnotation("unitOfMeasure").Path) {
			oChart.bindProperty("totalScale", {
				path: this._getAnnotation("unitOfMeasure").Path
			});
			oItem.bindProperty("fractionScale", {
				path: this._getAnnotation("unitOfMeasure").Path
			});
		}

		// Binding color property
		if (this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path) {
			oItem.bindProperty("color", {
				path: this._oDataPointAnnotations.Criticality.Path,
				formatter: this._mapCriticalityTypeWithColor.bind(this)
			});
		}

		oChart.addItem(oItem);
		this._updateAssociations();
	};

	/**
	 * Gets the supported types of <code>ChartType</code> in the <code>Chart</code> annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartHarveyBallMicroChart.prototype._getSupportedChartTypes = function () {
		return SmartHarveyBallMicroChart._CHART_TYPE;
	};

	return SmartHarveyBallMicroChart;
});
