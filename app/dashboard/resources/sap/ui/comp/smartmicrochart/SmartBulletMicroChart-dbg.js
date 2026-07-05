/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/library",
	"sap/suite/ui/microchart/BulletMicroChart",
	"sap/suite/ui/microchart/BulletMicroChartData",
	"sap/m/library",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(library, Control, MicroChartLibrary, BulletMicroChart, BulletMicroChartData, MLibrary, SmartMicroChartBase, SmartMicroChartRenderer, Decimal) {
	"use strict";

	// shortcut for sap.m.ValueColor
	var ValueColor = MLibrary.ValueColor;

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartBulletMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartBulletMicroChart control creates a <code>sap.suite.ui.microchart.BulletMicroChart</code>
	 * based on OData metadata and the configuration specified by <code>mSettings</code>.
	 * The entitySet attribute must be specified to use the control. This attribute is used to fetch metadata and
	 * annotation information from the given default OData model. Based on this, the BulletMicroChart UI
	 * is created.
	 * <br>
	 * <b><i>Note:</i></b><br>
	 * Most of the attributes/properties are not dynamic and cannot be changed once the control has been
	 * initialized.
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @since 1.38
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartBulletMicroChart
	 */
	var SmartBulletMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartBulletMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartBulletMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartBulletMicroChart.designtime",
			properties: {
				/**
				 * If set to <code>true</code>, this enables automatic binding of the chart using the chartBindingPath (if it exists)
				 * property.
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

	SmartBulletMicroChart._CRITICAL_COLOR = ValueColor.Critical;
	SmartBulletMicroChart._ERROR_COLOR = ValueColor.Error;

	SmartBulletMicroChart.prototype._CHART_TYPE = ["Bullet"];

	SmartBulletMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Bullet", true);
		this.setAggregation("_chart", new BulletMicroChart({ "showValueMarker": true }), true);
	};

	SmartBulletMicroChart.prototype.setShowLabel = function(bShowLabel) {
		if (this.getShowLabel() !== bShowLabel) {
			this.setProperty("showLabel", bShowLabel, true);
			var oChart = this.getAggregation("_chart");
			oChart.setProperty("showActualValue", bShowLabel, true);
			oChart.setProperty("showTargetValue", bShowLabel, true);
			oChart.setProperty("showDeltaValue", bShowLabel, true);
			oChart.setProperty("showValueMarker", bShowLabel, true);
			this.invalidate();
		}
		return this;
	};

	SmartBulletMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		oChart.setWidth(this.getWidth(), true);
		oChart.setHeight(this.getHeight(), true);
	};

	SmartBulletMicroChart.prototype._createAndBindInnerChart = function() {
		this._bindValueProperties();
		this._bindActualValue();
		this._bindChartThresholds();
		this._updateAssociations.call(this); //set all associations
		this._setMode();
	};

	/**
	 * Sets mode based on annotation.
	 * @private
	 */
	SmartBulletMicroChart.prototype._setMode = function () {
		if (this._hasMember(this, "_oDataPointAnnotations.Visualization.EnumMember")) {
			if (this._oDataPointAnnotations.Visualization.EnumMember === SmartMicroChartBase._DELTABULLET) {
				this.getAggregation("_chart").setMode(MicroChartLibrary.BulletMicroChartModeType.Delta);
			}
		}
	};

	/**
	 * Binds control properties to the entity type properties
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindValueProperties = function() {
		var fMaxValue, fMinValue, oInnerChart = this.getAggregation("_chart");

		if (this._hasMember(this, "_oDataPointAnnotations.TargetValue.Path")) {
			oInnerChart.bindProperty("targetValue", {
				path: this._oDataPointAnnotations.TargetValue.Path,
				type: new Decimal()
			});

			var oFormatter = this._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.TargetValue.Path);

			oInnerChart.bindProperty("targetValueLabel", {
				path: this._oDataPointAnnotations.TargetValue.Path,
				formatter: oFormatter.format.bind(oFormatter)
			});
		}

		if (this._hasMember(this, "_oDataPointAnnotations.ForecastValue.Path")) {
			oInnerChart.bindProperty("forecastValue", {
				path: this._oDataPointAnnotations.ForecastValue.Path,
				type: new Decimal()
			});
		}

		if (this._oDataPointAnnotations.MaximumValue) {
			if (this._oDataPointAnnotations.MaximumValue.hasOwnProperty("Path")) { // for compatibility reasons we have to support Path as well
				oInnerChart.bindProperty("maxValue", {
					path: this._oDataPointAnnotations.MaximumValue.Path,
					type: new Decimal()
				});
			} else if (this._oDataPointAnnotations.MaximumValue.hasOwnProperty("Decimal")) {
				fMaxValue = parseFloat(this._oDataPointAnnotations.MaximumValue.Decimal);
				oInnerChart.setMaxValue(fMaxValue, true);
			}
		}

		if (this._oDataPointAnnotations.MinimumValue) {
			if (this._oDataPointAnnotations.MinimumValue.hasOwnProperty("Path")) { // for compatibility reasons we have to support Path as well
				oInnerChart.bindProperty("minValue", {
					path: this._oDataPointAnnotations.MinimumValue.Path,
					type: new Decimal()
				});
			} else if (this._oDataPointAnnotations.MinimumValue.hasOwnProperty("Decimal")) {
				fMinValue = parseFloat(this._oDataPointAnnotations.MinimumValue.Decimal);
				oInnerChart.setMinValue(fMinValue, true);
			}
		}
	};

	/**
	 * Binds control aggregation 'actual' of the BulletMicroChart
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindActualValue = function() {
		var oInnerChart = this.getAggregation("_chart"),
			oFormatter = this._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.Value.Path);

		var oChartData = new BulletMicroChartData({
			value: {
				path: this._oDataPointAnnotations.Value.Path,
				type: new Decimal()
			},
			color: {
				parts: [
					this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path || "",
					this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path || ""
				],
				formatter: this._getValueColor.bind(this)
			}
		});

		oInnerChart.setAggregation("actual", oChartData, true);

		oInnerChart.bindProperty("actualValueLabel", {
			path: this._oDataPointAnnotations.Value.Path,
			formatter: oFormatter.format.bind(oFormatter)
		});
	};

	/**
	 * Binds the criticality calculation properties to the thresholds of SmartBulletMicroChart according to different direction
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindChartThresholds = function() {
		var sDirection, oCriticality;
		if (this._hasMember(this._oDataPointAnnotations, "CriticalityCalculation.ImprovementDirection.EnumMember")) {
			oCriticality = this._oDataPointAnnotations.CriticalityCalculation;
			sDirection = oCriticality.ImprovementDirection.EnumMember;
			if (sDirection !== SmartMicroChartBase._MINIMIZE && oCriticality.DeviationRangeLowValue && oCriticality.DeviationRangeLowValue.Path) {
				this._bindThresholdAggregation(oCriticality.DeviationRangeLowValue.Path, SmartBulletMicroChart._ERROR_COLOR);
			}
			if (sDirection !== SmartMicroChartBase._MINIMIZE && oCriticality.ToleranceRangeLowValue && oCriticality.ToleranceRangeLowValue.Path) {
				this._bindThresholdAggregation(oCriticality.ToleranceRangeLowValue.Path, SmartBulletMicroChart._CRITICAL_COLOR);
			}
			if (sDirection !== SmartMicroChartBase._MAXIMIZE && oCriticality.ToleranceRangeHighValue && oCriticality.ToleranceRangeHighValue.Path) {
				this._bindThresholdAggregation(oCriticality.ToleranceRangeHighValue.Path, SmartBulletMicroChart._CRITICAL_COLOR);
			}
			if (sDirection !== SmartMicroChartBase._MAXIMIZE && oCriticality.DeviationRangeHighValue && oCriticality.DeviationRangeHighValue.Path) {
				this._bindThresholdAggregation(oCriticality.DeviationRangeHighValue.Path, SmartBulletMicroChart._ERROR_COLOR);
			}
		}
	};

	/**
	 * Adds aggregation for the SmartBulletMicroChart
	 * @param {string} sPath Which is the value path from the OData metadata
	 * @param {string} sColor Which is the semantic color of the value
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindThresholdAggregation = function(sPath, sColor) {
		var oThreshold = new BulletMicroChartData({
			value: {
				path: sPath,
				type: new Decimal()
			},
			color: sColor
		});
		this.getAggregation("_chart").addAggregation("thresholds", oThreshold, true);
	};


	return SmartBulletMicroChart;
});
