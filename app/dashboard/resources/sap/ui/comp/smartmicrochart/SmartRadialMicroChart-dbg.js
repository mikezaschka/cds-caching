/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/library",
	"sap/suite/ui/microchart/RadialMicroChart",
	"sap/m/library",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"./SmartMicroChartRenderer",
	"sap/ui/model/odata/type/Decimal"
], function(library, Control, MicroChartLibrary, RadialMicroChart, MobileLibrary, SmartMicroChartBase, SmartMicroChartRenderer, Decimal) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartRadialMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartRadialMicroChart control creates a <code>sap.suite.ui.microchart.RadialMicroChart</code>
	 * based on OData metadata and the configuration specified by <code>mSettings</code>.
	 * The entitySet attribute must be specified to use the control. This attribute is used to fetch metadata and
	 * annotation information from the given default OData model. Based on this, the RadialMicroChart UI
	 * is created.
	 * <br>
	 * <b><i>Note:</i></b><br>
	 * Most of the attributes/properties are not dynamic and cannot be changed once the control has been
	 * initialized.
	 * @extends sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 * @version 1.136.0
	 * @constructor
	 * @public
	 * @since 1.42.0
	 * @alias sap.ui.comp.smartmicrochart.SmartRadialMicroChart
	 */
	var SmartRadialMicroChart = SmartMicroChartBase.extend("sap.ui.comp.smartmicrochart.SmartRadialMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartRadialMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartRadialMicroChart.designtime",
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
			},
			associations: {
				/**
				 * If the associated control is provided, its <code>text</code> property is set to
				 * the free text provided by annotations. The Value property of the DataPoint
				 * annotation should be annotated with this free text. The Label annotation from the
				 * OData Common vocabulary can be used.
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

	SmartRadialMicroChart.prototype._CHART_TYPE = ["Donut"];

	SmartRadialMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Donut", true);
		this.setAggregation("_chart", new RadialMicroChart(), true);
	};

	SmartRadialMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		oChart.setSize(this.getSize(), true);
		MicroChartLibrary._passParentContextToChild(this, oChart); // TODO remove after control refactoring
	};

	/**
	 * Creates and binds the inner chart once the metadata is loaded.
	 * @private
	 */
	SmartRadialMicroChart.prototype._createAndBindInnerChart = function() {
		this._bindProperties();
		this._updateAssociations.call(this); //set all associations
	};

	/**
	 * Binds control properties to the entity type properties
	 * @private
	 */
	SmartRadialMicroChart.prototype._bindProperties = function() {
		var oInnerChart = this.getAggregation("_chart");
		if (this._oDataPointAnnotations.Value && !this._oDataPointAnnotations.TargetValue) {
			if (this._hasMember(this._oDataPointAnnotations.Value, "Path")) {
				oInnerChart.bindProperty("percentage", {
					path: this._oDataPointAnnotations.Value.Path,
					type: new Decimal()
				});
			}
		} else if (this._hasMember(this, "_oDataPointAnnotations.TargetValue.Path") &&
			this._hasMember(this, "_oDataPointAnnotations.Value.Path")) {
			oInnerChart.bindProperty("total", {
				path: this._oDataPointAnnotations.TargetValue.Path,
				type: new Decimal()
			});
			oInnerChart.bindProperty("fraction", {
				path: this._oDataPointAnnotations.Value.Path,
				type: new Decimal()
			});
		}

		oInnerChart.bindProperty("valueColor", {
			parts: [
				this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path || "",
				this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path || ""
			],
			formatter: this._getValueColor.bind(this)
		});
	};

	return SmartRadialMicroChart;
});
