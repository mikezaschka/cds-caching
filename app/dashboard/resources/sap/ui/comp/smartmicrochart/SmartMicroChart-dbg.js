/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/comp/providers/ChartProvider",
	"sap/suite/ui/microchart/library",
	"sap/m/library",
	"sap/ui/core/CustomData",
	"sap/ui/comp/smartmicrochart/SmartMicroChartBase",
	"sap/base/Log",
	"./SmartMicroChartRenderer",
	"sap/ui/comp/smartmicrochart/SmartLineMicroChart",
	"sap/ui/comp/smartmicrochart/SmartAreaMicroChart",
	"sap/ui/comp/smartmicrochart/SmartBulletMicroChart",
	"sap/ui/comp/smartmicrochart/SmartRadialMicroChart",
	"sap/ui/comp/smartmicrochart/SmartStackedBarMicroChart",
	"sap/ui/comp/smartmicrochart/SmartColumnMicroChart",
	"sap/ui/comp/smartmicrochart/SmartHarveyBallMicroChart"
], function(Control, ChartProvider, MicroChartLibrary, MLibrary, CustomData, SmartMicroChartBase, Log, SmartMicroChartRenderer,
	SmartLineMicroChart, SmartAreaMicroChart, SmartBulletMicroChart, SmartRadialMicroChart, SmartStackedBarMicroChart, SmartColumnMicroChart,
	SmartHarveyBallMicroChart) {
	"use strict";

	var Size = MLibrary.Size;

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartMicroChart control creates a chart based on OData metadata and the configuration specified by <code>mSettings</code>.
	 * <br>The <code>entitySet</code> property is required. This property is used to fetch metadata and
	 * annotation information from the specified default OData model. Depending on the UI/ChartType annotation, the control
	 * creates a corresponding {@link sap.ui.comp.smartmicrochart.SmartAreaMicroChart SmartAreaMicroChart}, {@link sap.ui.comp.smartmicrochart.SmartBulletMicroChart SmartBulletMicroChart},
	 * {@link sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart SmartStackedBarMicroChart}, {@link sap.ui.comp.smartmicrochart.SmartLineMicroChart SmartLineMicroChart}, or
	 * {@link sap.ui.comp.smartmicrochart.SmartRadialMicroChart SmartRadialMicroChart} instance and delegates it to the internal control.
	 *        <br>
	 * <b><i>Note:</i></b> Most of the attributes are not dynamic and cannot be changed once the control has been initialized.
	 * @extends sap.ui.core.Control
	 * @version 1.136.0
	 * @since 1.38
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartMicroChart
	 */
	var SmartMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartMicroChart.designtime",
			properties: {

				/**
				 * The entity set name to fetch data and create the internal chart representation from.
				 * Note that this is not a dynamic UI5 property.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if any label is shown or not
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code>, this enables automatic binding of the chart using the chartBindingPath (if it exists) or entitySet
				 * property.
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This attribute can be used to specify the path that
				 * is used during the binding of the chart. If not
				 * specified, the entitySet attribute is used instead and also stored in this property.
				 * Calling <code>bindElement</code> binds the control and sets this property.
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of chart. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the micro chart is included.
				 *
				 * @since 1.62
				 */
				size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"}, // TODO which version

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed or by the width and height property.
				 *
				 * @deprecated as of version 1.62, the concept has been discarded.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false } // TODO which version
			},
			defaultAggregation: "_chart",
			aggregations: {
				/**
				 * This private aggregation is used for the internal instance of Smart<*>MicroChart.
				 */
				_chart: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Title property of the Chart annotation.
				 * Title property of the DataPoint annotation is ignored.
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Description property of the Chart annotation.
				 * Description property of the DataPoint annotation is ignored.
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Unit of Measure. The Value property of the DataPoint annotation should be annotated with this Unit of Measure. It can be either ISOCurrency or Unit from the OData Measures annotations.
				 */
				unitOfMeasure: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * If the associated control is provided, its <code>text</code> property is set to the free text provided by annotations.
				 * The Value property of the DataPoint annotation should be annotated with this free text.
				 * As of 1.42.0, this association is only available for chart type 'Donut'.
				 *
				 * @since 1.42.0
				 */
				freeText: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "ariaLabelledBy"
				}
			},
			events: {

				/**
				 * Event fired once the control has been initialized.
				 */
				initialize: {}
			}
		},
		renderer: SmartMicroChartRenderer
	});

	SmartMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
	};

	/**
	 * @private
	 * @returns {this} Returns <code>this</code> to allow method chaining
	 */
	SmartMicroChart.prototype.setChartType = function() {
		return this;
	};

	SmartMicroChart.prototype.getChartType = function() {
		return this.getAggregation("_chart").getChartType();
	};

	SmartMicroChart.prototype.propagateProperties = function() {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		this._initializeMetadata();
	};

	SmartMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");
		if (oChart) {
			if (oChart.getMetadata().hasProperty("height")) {
				oChart.setHeight(this.getHeight(), true);
			}
			if (oChart.getMetadata().hasProperty("width")) {
				oChart.setWidth(this.getWidth(), true);
			}

			if (oChart.getMetadata().hasProperty("size")) {
				oChart.setSize(this.getSize(), true);
			}
			MicroChartLibrary._passParentContextToChild(this, oChart);

			if (oChart.getMetadata().hasProperty("showLabel")) {
				oChart.setShowLabel(this.getShowLabel(), true);
			}
			if (oChart.getMetadata().hasAssociation("chartTitle")) {
				oChart.setAssociation("chartTitle", this.getChartTitle(), true);
			}
			if (oChart.getMetadata().hasAssociation("chartDescription")) {
				oChart.setAssociation("chartDescription", this.getChartDescription(), true);
			}
			if (oChart.getMetadata().hasAssociation("unitOfMeasure")) {
				oChart.setAssociation("unitOfMeasure", this.getUnitOfMeasure(), true);
			}
			if (oChart.getMetadata().hasAssociation("freeText")) {
				oChart.setAssociation("freeText", this.getFreeText(), true);
			}
		}
	};

	SmartMicroChart.prototype.setSize = function(sSize) {
		if (this.getSize() !== sSize) {
			this.setProperty("size", sSize);
		}
		return this;
	};

	SmartMicroChart.prototype.addAriaLabelledBy = function (vAriaLabelledBy) {
		this.addAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").addAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartMicroChart.prototype.removeAriaLabelledBy = function (vAriaLabelledBy) {
		this.removeAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").removeAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartMicroChart.prototype.removeAllAriaLabelledBy = function () {
		this.removeAllAssociation("ariaLabelledBy", true);
		this.getAggregation("_chart").removeAllAriaLabelledBy();
		return this;
	};

	/**
	 * Initializes the OData metadata necessary to create the chart.
	 * @private
	 */
	SmartMicroChart.prototype._initializeMetadata = function() {
		if (!this._bIsInitialized) {
			var oModel = this.getModel();
			if (oModel && (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel" || oModel.getMetadata().getName() === "sap.ui.model.odata.ODataModel")) {
				if (!this._bMetaModelLoadAttached) {
					oModel.getMetaModel().loaded().then(this._onMetadataInitialized.bind(this));
					this._bMetaModelLoadAttached = true;
				}
			} else if (oModel) {
				// Could be a non-ODataModel or a synchronous ODataModel --> just create the necessary helpers
				this._onMetadataInitialized();
			}
		}
	};

	/**
	 * Creates an instance of the chart provider
	 * @private
	 */
	SmartMicroChart.prototype._createChartProvider = function() {
		var sEntitySetName = this.getEntitySet(), oModel = this.getModel();
		// The SmartAreaMicroChart might also needs to work for non ODataModel models; hence we now create the chart
		// independent of ODataModel.
		if (oModel && sEntitySetName) {
			this._oChartProvider = new ChartProvider({
				entitySet: sEntitySetName,
				model: oModel,
				chartQualifier: this.data("chartQualifier")
			});
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 * @private
	 */
	SmartMicroChart.prototype._onMetadataInitialized = function() {
		var sQualifier,
			oDataPoint;
		this._bMetaModelLoadAttached = false;
		if (!this._bIsInitialized) {
			this._createChartProvider();
			if (this._oChartProvider) {
				this._oChartViewMetadata = this._oChartProvider.getChartViewMetadata();
				if (this._oChartViewMetadata) {
					this._bIsInitialized = true;
					this._createInnerChart();
				} else { //We might have got only DataPoint annotation
					sQualifier = this.data("chartQualifier");
					oDataPoint = this._oChartProvider.getChartDataPointMetadata();
					if (oDataPoint) {
						oDataPoint = sQualifier ? oDataPoint.additionalAnnotations[sQualifier] : oDataPoint.primaryAnnotation;
						if (oDataPoint) {
							this._bIsInitialized = true;
							this._createInnerChartFromDataPoint(oDataPoint);
						} else {
							Log.error("There is no UI.Chart annotation nore DataPoint annotation. We cannot initialize SmartMicroChart.");
						}
					} else {
						Log.error("There is no UI.Chart annotation nore DataPoint annotation. We cannot initialize SmartMicroChart.");
					}
				}
			}
		}
	};

	SmartMicroChart.prototype._createInnerChartFromDataPoint = function (oDataPoint) {
		var sType = oDataPoint.Visualization.EnumMember;
		if (SmartMicroChartBase._isBulletVizualizationType(sType)) {
			this._buildSmartBulletMicroChart();
		} else {
			Log.error("Only Bullet chart can be initialize with just DataPoint annotation. Type: " + sType + " is not a Bullet chart type.");
			return;
		}
		this.invalidate();
	};

	/**
	 * Determines which type of chart should be created depending on the ChartType annotation and creates required chart, e.g. SmartBulletChart or SmartAreaChart.
	 * @private
	 */
	SmartMicroChart.prototype._createInnerChart = function() {
		if (!this._checkChartMetadata()) {
			Log.error("Created annotations not valid. Please review the annotations and metadata.");
			return;
		}

		var sChartType = this._oChartViewMetadata.chartType;
		switch (sChartType) {
			case "line" :
			case "area" :
				var sType = this._oChartViewMetadata.annotation.ChartType.EnumMember.split("/").pop().toLowerCase();
				if (sType === "area") {
					this._buildSmartAreaMicroChart();
				} else if (sType === "line") {
					this._buildSmartLineMicroChart();
				} else {
					Log.error("Not supported chart type used.");
					return;
				}
				break;
			case "bullet" :
				this._buildSmartBulletMicroChart();
				break;
			case "donut" :
				this._buildSmartRadialMicroChart();
				break;
			case "stacked_bar":
				this._buildSmartStackedBarMicroChart();
				break;
			case "column":
				this._buildSmartColumnMicroChart();
				break;
			case "pie":
				this._buildSmartHarveyBallMicroChart();
				break;
			default :
				Log.error("Not supported chart type used.");
				return;
		}
		this.invalidate();
	};

	/**
	 * Creates an instance of SmartLineMicroChart and appends it to the _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartLineMicroChart = function() {
		this._buildSmartMicroChart(SmartLineMicroChart);
	};

	/**
	 * Constructs an instance of SmartAreaMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartAreaMicroChart = function() {
		this._buildSmartMicroChart(SmartAreaMicroChart);
	};

	/**
	 * Constructs an instance of SmartBulletMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartBulletMicroChart = function() {
		this._buildSmartMicroChart(SmartBulletMicroChart);
	};

	/**
	 * Constructs an instance of SmartRadialMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartRadialMicroChart = function() {
		this._buildSmartMicroChart(SmartRadialMicroChart);
	};

	/**
	 * Constructs an instance of SmartStackedBarMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartStackedBarMicroChart = function() {
		this._buildSmartMicroChart(SmartStackedBarMicroChart);
	};

	/**
	 * Constructs an instance of SmartColumnMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartColumnMicroChart = function() {
		this._buildSmartMicroChart(SmartColumnMicroChart);
	};

	/**
	 * Constructs an instance of SmartHarveyBallMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartHarveyBallMicroChart = function() {
		this._buildSmartMicroChart(SmartHarveyBallMicroChart);
	};

	/**
	 * Constructs an instance of given micro chart and sets it in _chart aggregation.
	 * @param {class} MicroChart micro chart class
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartMicroChart = function(MicroChart) {
		var oChart = new MicroChart({
			entitySet: this.getEntitySet(),
			chartBindingPath: this.getChartBindingPath(),
			initialize: [this._onChartInitialized, this],
			customData: [
				new CustomData({
					key: "chartQualifier",
					value: this.data("chartQualifier")
				})
			]
		});

		if (oChart.getMetadata().hasProperty("enableAutoBinding")) {
			oChart.setProperty("enableAutoBinding", this.getEnableAutoBinding(), true);
		}

		this.setAggregation("_chart", oChart, true);
	};

	/**
	 * Fires the initialize event once the chart has been initialized.
	 * @private
	 * @returns {void}
	 */
	SmartMicroChart.prototype._onChartInitialized = function() {
		this.fireInitialize();
	};

	/**
	 * Executes a validity check of the metadata of the chart, necessary to create the inner chart.
	 * In particular, checks if the chart type annotation is available in the proper format.
	 * @returns {boolean} True if the metadata of the chart is valid, otherwise false.
	 * @private
	 */
	SmartMicroChart.prototype._checkChartMetadata = function() {
		if (this._oChartViewMetadata.chartType && this._oChartViewMetadata.annotation &&
			this._oChartViewMetadata.annotation.ChartType &&
			this._oChartViewMetadata.annotation.ChartType.EnumMember &&
			this._oChartViewMetadata.annotation.ChartType.EnumMember.length > 0) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Gets the accessibility information from the underlying (inner) MicroChart instance.
	 *
	 * @returns {Object} The accessibility information object of the underlying MicroChart instance
	 * @private
	 */
	SmartMicroChart.prototype.getAccessibilityInfo = function () {
		var oAccessibilityInformation = {};
		var oInnerChart = this.getAggregation("_chart");

		if (oInnerChart && oInnerChart.getAccessibilityInfo) {
			oAccessibilityInformation = oInnerChart.getAccessibilityInfo();
		}

		return oAccessibilityInformation;
	};

	/**
	* Checkes whether current size is sap.m.Size.Responsive

	* @return {boolean} True if Responsive, false otherwise
	* @private
	*/
	SmartMicroChart.prototype._isResponsive = function () {
		return this.getSize() === Size.Responsive;
	};

	return SmartMicroChart;
});
