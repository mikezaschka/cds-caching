/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'sap/base/i18n/Formatting',
	'sap/chart/library',
	'sap/viz/ui5/controls/VizFrame',
	'sap/viz/ui5/controls/common/BaseControl',
	'sap/viz/ui5/data/Dataset',
	'sap/viz/ui5/data/FlattenedDataset',
	'sap/viz/ui5/data/DimensionDefinition',
	'sap/viz/ui5/data/MeasureDefinition',
	'sap/chart/data/Dimension',
	'sap/chart/data/TimeDimension',
	'sap/chart/data/HierarchyDimension',
	'sap/chart/data/Measure',
	'sap/ui/model/analytics/ODataModelAdapter',
	'sap/chart/utils/RoleFitter',
	'sap/chart/utils/ChartUtils',
	'sap/chart/utils/ChartTypeAdapterUtils',
	'sap/chart/utils/DateFormatUtil',
	'sap/chart/utils/DataSourceUtils',
	'sap/chart/utils/SelectionAPIUtils',
	'sap/chart/utils/MeasureSemanticsUtils',
	'sap/viz/ui5/controls/common/feeds/FeedItem',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/FilterType',
	'sap/ui/model/analytics/odata4analytics',
	'sap/ui/Device',
	'sap/chart/TimeUnitType',
	'sap/chart/coloring/Colorings',
	'sap/chart/ChartLog',
	'sap/chart/pagination/PagingController',
	'sap/ui/core/LocaleData',
	'sap/ui/core/Control',
	'sap/ui/core/BusyIndicatorUtils',
	'sap/ui/core/Lib',
	'sap/ui/core/theming/Parameters',
	'sap/chart/SeriesColorTracker',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/chart/utils/ValueAxisScaleUtils',
	'sap/chart/AutoScaleMode',
	'sap/chart/ScaleBehavior',
	'sap/viz/ui5/utils/CommonUtil',
	"sap/base/Log",
	"sap/ui/thirdparty/jquery"
], function(
	Formatting,
	chartLibrary,
	VizFrame,
	BaseControl,
	Dataset,
	FlattenedDataset,
	DimensionDefinition,
	MeasureDefinition,
	Dimension,
	TimeDimension,
	HierarchyDimension,
	Measure,
	ODataModelAdapter,
	RoleFitter,
	ChartUtils,
	ChartTypeAdapterUtils,
	DateFormatUtil,
	DataSourceUtils,
	SelectionAPIUtils,
	MeasureSemanticsUtils,
	FeedItem,
	Filter,
	FilterOperator,
	FilterType,
	odata4analytics,
	Device,
	TimeUnitType,
	Colorings,
	ChartLog,
	PagingController,
	LocaleData,
	Control,
	BusyIndicatorUtils,
	Library,
	ThemeParameters,
	SeriesColorTracker,
	ChartFormatter,
	ValueAxisScaleUtils,
	AutoScaleMode,
	ScaleBehavior,
	CommonUtil,
	Log,
	jQuery
) {
	"use strict";

	var SelectionBehavior = chartLibrary.SelectionBehavior,
		SelectionMode = chartLibrary.SelectionMode;

	/**
	 * Constructor for a new Chart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * UI5 Chart control
	 *
	 * @extends sap.viz.ui5.controls.common.BaseControl
	 *
	 * @constructor
	 * @public
	 * @since 1.32.0
	 * @alias sap.chart.Chart
	 */
	var Chart = BaseControl.extend("sap.chart.Chart", {
		metadata: {
			library: "sap.chart",
			designtime: "sap/chart/designtime/Chart.designtime",
			properties: {
				/**
				 * Type of the Chart.
				 *
				 */
				chartType						: {type: "string", defaultValue: "bar"},
				/**
				 * Configuration for initialization to VizControl. This property could only set via settings parameter in Constructor.
			 	 */
				uiConfig : {type : "object", group : "Misc"},
				/**
				 * Names of the Dimensions to be displayed in the Chart, all available dimensions will automatically append when the property isAnalytical is false.
				 *
				 * Depending on chart type, insufficient number of visible <code>Dimension</code>s will cause error.
				 */
				visibleDimensions						: {type: "string[]", defaultValue: []},
				/**
				 * Names of the inResult dimensions.
				 *
				 * inResult dimension do not show up in chart layout, i.e. axis/legend. They do show in tooltip, popover, and in selection results.
				 */
				inResultDimensions						: {type: "string[]", defaultValue: []},
				/**
				 * Names of the Measures to be displayed in the Chart.
				 *
				 * Depending on chart type, insufficient number of visible <code>Measure</code>s will cause errors.
				 */
				visibleMeasures						  : {type: "string[]", defaultValue: []},
				/** Chart properties, refer to chart property <a href="docs/vizdocs/index.html" target="_blank">documentation</a> for more details. */
				vizProperties								: {type: "object", group: "Misc"},
				/** Chart scales, refer to chart property <a href="docs/vizdocs/index.html" target="_blank">documentation</a> for more details. */
				vizScales										: {type : "object[]", group : "Misc"},
				/** Whether or not an aggregated entity set is bound to the chart. */
				isAnalytical								 : {type: "boolean"},
				/**
				 * Chart selection behavior.
				 *
				 */
				selectionBehavior						: {type: "sap.chart.SelectionBehavior", defaultValue: SelectionBehavior.DataPoint},
				/**
				 * Chart selection mode.
				 *
				 */
				selectionMode			: {type: "sap.chart.SelectionMode", defaultValue: SelectionMode.Multi},
				/**
				 * Enable pagination mode.
				 *
				 * Pagination mode empowers users to visualize dataset page by page by scrolling back or forth. Currently there are some restrictions of this mode in some chart transversal features, such as:
				 * <ol>
				 *   <li>Selection status might lost for new batch data</li>
				 *   <li>Keyboard navigation will be only available for current continuous batch data</li>
				 *	 <li>Zoom out might have inconsistent behavior, Hence the gesture in mobile might have the same issue</li>
				 *	 <li>Time charts did not enable pagination yet</li>
				 *	 <li>Series color might be inconsistent before/after jump pages</li>
				 *	 <li>OData V4 Model with relative binding is not supported in pagination</li>
				 * </ol>
				 * Please refer to release notes for details.
				 */
				enablePagination			 : {type: "boolean", defaultValue: false},

				/**
				 * Enable Stable color mode.
				 * To keep the same colors for the same dimension values or measure names.
				 */
				enableStableColor             : {type: "boolean", defaultValue: false},

				/**
				 * Enable scaling factor.
				 */
				enableScalingFactor             : {type: "boolean", defaultValue: false},
				/**
				 *
				 Chart custom messages.
				*/
				customMessages				  : {type: "object", defaultValue: null},
				/**
				 * Chart colorings.
				 *
				 * Holds an object with information about the possible options how colors can be applied for indicating <code>Criticality</code> or <code>Emphasis</code> in the chart.
				 * <pre>
				 * Colorings: {
				 *     Criticality: {
				 *         …
				 *     },
				 *     Emphasis: {
				 *         …
				 *     }
				 * }
				 * </pre>
				 *
				 * <b>NOTE:</b> Dimension-based coloring does not work when {@link sap.chart.data.Measure#setSemantics} is set to {@link sap.chart.data.MeasureSemantics.Projected} or {@link sap.chart.data.MeasureSemantics.Reference} for visible measure(s).
				 *
				 * Refer to<br/>
				 *   {@link sap.chart.ColoringType.Criticality}<br/>
				 *   {@link sap.chart.ColoringType.Emphasis}<br/>
				 * for detailed usage
				 */
				colorings: {type: "object", defaultValue: null},
				/**
				 * Active coloring configurations.
				 *
				 * specifies which coloring of the possible colorings is to be applied for the current chart layout. It holds an object with two properties：
				 *
				 * <ol>
				 *   <li>coloring: <b>mandatory</b>, specify which kind of coloring should take effect in current chart layout. Possible values refer to {@link sap.chart.ColoringType}</li>
				 *   <li>parameters:
				 *     <ul>
				 *       <li>
				 *         <code>Criticality</code> supports two parameters: <code>"dimension"</code> and <code>"measure"</code>. Both are <b>optional</b>, one (and only one) must be provided.
				 *         This setting disambiguates when multiple colorings for different visible dimensions and measures are applicable.
				 *
				 *         <code>"measure"</code> supports two input types:
				 *           <ol>
				 *             <li><code>string</code> for single measure name</li>
				 *             <li><code>string[]</code> of multiple measure names(only supported in <b>static</b>), which is relevant in case of a <b>static</b> measure criticality defined on multiple measures.</li>
				 *           </ol>
				 *         <code>"dimension"</code> holds the dimension name as string value.
				 *       </li>
				 *       <li>
				 *         <code>Emphasis</code> supports only one parameter: <code>"dimension"</code> which is <b>optional</b>.
				 *
				 *         <code>"dimension"</code> holds the dimension name as string value.
				 *       </li>
				 *     </ul>
				 *   </li>
				 * </ol>
				 *
				 * Example:
				 * <pre>
				 * activeColoring: {
				 *     coloring: sap.chart.ColoringType.Criticality,
				 *     parameters: {
				 *         dimension: "AvailabilityStatus”
				 *     }
				 * }
				 * </pre>
				 */
				activeColoring: {type: "object", defaultValue: null},
				/**
				 * Value Axis Scale.
				 *
				 * Specifies the scale of the chart value axes.
				 *
				 * <ol>
				 *   <li>scaleBehavior: <b>optional</b>, determines whether or not all value axes in the chart should have a fixed scale. Possible values refer to {@link sap.chart.ScaleBehavior}. The default value is sap.chart.ScaleBehavior.AutoScale.
				 *       In order to apply a fixed scale, boundary values for minimum and maximum must have been specified for all visible measures, and the axes boundaries are then created from the largest maximum and the smallest minimum value of the measures put on the respective axis.
				 *       If any visible measure lacks this information, or scaleBehavior is set to sap.chart.ScaleBehavior.AutoScale, the chart will apply an automatic scaling for all value axes.
				 *   </li>
				 *   <li>fixedScaleSettings:
				 *     <ul>
				 *       <li>measureBoundaryValues: An object holding the fixed “minimum” and “maximum” values for all the measures.
				 *         Stacked chart with only one measure also uses this object to describe the fixed “minimum” and “maximum” value.
				 *         <ul>
				 *           <li>
				 *             <code>measure</code> Measure name
				 *           </li>
				 *         </ul>
				 *       </li>
				 *       <li>stackedMultipleMeasureBoundaryValues: An array of objects holding the fixed “minimum” and “maximum” values only for stacked chart with multiple measures.
				 *         <ul>
				 *           <li>
				 *             <code>measures</code> the array of measure name applied to the axis.
				 *           </li>
				 *           <li>
				 *             <code>boundaryValues：</code> An object holding the fixed “minimum” and “maximum” value all the measures applied to certain axis.
				 *           </li>
				 *         </ul>
				 *       </li>
				 *     </ul>
				 *   </li>
				 *   <li>autoScaleSettings:
				 *     <ul>
				 *       <li>
				 *         <code>zeroAlwaysVisible</code> forces the value axis to always display the zero value (only a few chart types support the opposite), which is <b>optional</b>. The default value is true.
				 *       </li>
				 *       <li>
				 *         <code>syncWith</code> selects how the chart adapts the value axis to the data: The axis boundaries may be determined from the loaded data, which is <b>optional</b>. The default value is "DataSet".
				 *         Possible values refer to {@link sap.chart.AutoScaleMode}.
				 *       </li>
				 *     </ul>
				 *   </li>
				 * </ol>
				 *
				 * Example:
				 * <pre>
				 * valueAxisScale: {
				 *     scaleBehavior: sap.chart.ScaleBehavior,
				 *     fixedScaleSettings: {
				 *         measureBoundaryValues: {
				 *             measure_1: {
				 *                 minimum: Number,
				 *                 maximum: Number
				 *             },
				 *             measure_2: {
				 *                 minimum: Number,
				 *                 maximum: Number
				 *             }
				 *         },
				 *         stackedMultipleMeasureBoundaryValues: [{
				 *             measures: [ 'measure_1', 'measure_2', … ],
				 *             boundaryValues： {
				 *                 minimum: Number,
				 *                 maximum: Number
				 *             }
				 *         }， {
				 *             measures: [ 'measure_3', 'measure_4', … ],
				 *             boundaryValues： {
				 *                 minimum: Number,
				 *                 maximum: Number
				 *             }
				 *         }]
				 *     },
				 *     autoScaleSettings: {
				 *         zeroAlwaysVisible: Boolean,
				 *         syncWith: sap.chart.autoScaleMode
				 *     }
				 * }
				 * </pre>
				 *
				 * Refer to<br/>
				 *   {@link sap.chart.AutoScaleMode.DataSet}<br/>
				 *   {@link sap.chart.AutoScaleMode.VisibleData}<br/>
				 *   {@link sap.chart.ScaleBehavior.AutoScale}<br/>
				 *   {@link sap.chart.ScaleBehavior.FixedScale}<br/>
				 * for detailed usage
				 */
				valueAxisScale: {type: "object", defaultValue: null},
				/**
				 * Hide shared dimensions from selected data points when you drill down. A dimension is hidden if all selected data points share the same.
				 */
				hideSharedInformation: {type: 'boolean', defaultValue: true}

			},
			aggregations: {
				/**
				 * Actual data. It can be bound to an (analytical) ODataModel.
				 *
				 * <b>NOTE:</b> The metadataLoaded event {@link sap.ui.model.odata.v2.ODataModel#attachMetadataLoaded} need to be listened when bind to v2 ODataModel.
				 */
				data	   : {type: "sap.ui.core.Element", multiple: true, bindable: "bindable"},
				/** Internal VizFrame instance which does the actual rendering work. */
				_vizFrame  : {type: "sap.viz.ui5.controls.VizFrame", multiple: false, visibility: "hidden"},
				/** Dimensions of the data. */
				dimensions : {type: "sap.chart.data.Dimension", multiple: true},
				/** Measures of the data. */
				measures   : {type: "sap.chart.data.Measure", multiple: true}
			},
			events: {
				/** fired after a drill-down operation */
				drilledDown : {
					parameters : {
						/** array of strings holding the names of the added dimensions */
						dimensions : {type : "string[]"}
					}
				},
				/** fired after a drill-up operation */
				drilledUp : {
					parameters : {
						/** array of strings holding the names of the removed dimensions */
						dimensions : {type : "string[]"}
					}
				},
				/** Event fires when the rendering ends. */
				renderComplete : {},
				/** Event fires when certain data point(s) is(are) selected, data context of selected item(s) would be passed in. */
				selectData	   : {},
				/** Event fires when certain data point(s) is(are) deselected, data context of deselected item(s) would be passed in */
				deselectData   : {},
				/** Event fires when fixed scale is turned off by adding or removing dimension */
				valueAxisFixedScaleTurnedOff : {},
				/**	Event fires when drill stack changed. API that relies on drill stack like {@link #drillDown}, {@link #drillUp} shall be called in this event or after chart is rendered */
				drillStackChanged : {}
			}
		},
		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				// write the HTML into the render manager
				oRm.openStart("div", oControl)
					.style("width", oControl.getWidth())
					.style("height", oControl.getHeight())
					.openEnd()
					.renderControl(oControl.getAggregation("_vizFrame"))
					.close("div");
			}
		}
	});

	Chart.getMetadata().getAggregation("data")._doesNotRequireFactory = true;

	// ******** Overridden property getters/setters ********

	function vizFrameSize (sValue) {
		return sValue.indexOf("%") !== -1 ? "100%" : sValue;
	}
	Chart.prototype.setHeight = function(sValue) {
		this.setProperty("height", sValue);
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			oVizFrame.setHeight(vizFrameSize(this.getProperty("height")));
		}
		return this;
	};

	Chart.prototype.setWidth = function(sValue) {
		this.setProperty("width", sValue);
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			oVizFrame.setWidth(vizFrameSize(this.getProperty("width")));
		}
		return this;
	};

	Chart.prototype.setChartType = function(sChartType, bSuppressInvalidate) {
		this.setProperty("chartType", sChartType, bSuppressInvalidate);
		this._sAdapteredChartType = sChartType;
		this._bIsPagingChartType =  ChartUtils.CONFIG.pagingChartTypes.indexOf(sChartType) > -1;

		if (this._isEnablePaging()) {
			this._getPagingController().init(false);
		} else {
			//TODO, move this logic out of chart.js
			var oDataset = this._getDataset();
			if (oDataset) {
				oDataset.setPagingOption(null);
				oDataset.setRange(-1, -1);
			}
		}
		this._invalidateBy({
			source: this,
			keys: {
				vizFrame: true
			}
		});

		this._bNeedToApplyDefaultProperties = true;
		return this;
	};

	Chart.prototype.setColorings = function(oValue) {
		this.setProperty("colorings", oValue);

		this._invalidateBy({
			source: this,
			keys: {
				vizFrame: true,
				checkBinding: true
			}
		});

		return this;
	};

	Chart.prototype.setActiveColoring = function(oValue) {
		this.setProperty("activeColoring", oValue);

		this._invalidateBy({
			source: this,
			keys: {
				vizFrame: true,
				checkBinding: true
			}
		});

		return this;
	};

	Chart.prototype.setValueAxisScale = function(oValue) {
		this._bEnbableValueAxisScale = true;
		this.setProperty("valueAxisScale", oValue);

		if (this._oValueScaleSetting && this._oValueScaleSetting.fireValueAxisFixedScaleTurnedOff) {
			this._oValueScaleSetting.fireValueAxisFixedScaleTurnedOff = false;
			this._oValueScaleSetting.resetValueAxisScale = true;
		}

		this._invalidateBy({
			source: this,
			keys: {
				vizFrame: true
			}
		});

		return this;
	};

	Chart.prototype._setValueAxisScale = function() {
		var oValueAxisScale = this.getValueAxisScale(),
			bApplyInitialValeScale = !this._rendered && !!oValueAxisScale,
			bUpdateValueScale = !(this._mNeedToUpdate['binding'] && this._oValueScaleSetting) && this._bEnbableValueAxisScale;
		if ( bApplyInitialValeScale || bUpdateValueScale) {
			//When initial chart with vizScales and vizValueScales, to make sure the flag is true.
			if (!this._bEnbableValueAxisScale) {
				this._bEnbableValueAxisScale = true;
			}
			this._oValueScaleSetting =  ValueAxisScaleUtils.getValueAxisScaleSetting(
			this.getChartType(), oValueAxisScale, this.getMeasures(), this.getVisibleMeasures());
		}
	};

	Chart.prototype._getValueAxisScaleSetting = function() {
		return this._bEnbableValueAxisScale ? this._oValueScaleSetting || {} : {};
	};

	Chart.prototype._validateValueScaleOnDimChange = function(aNewDimensions, aOldDimensions) {
		if (aOldDimensions && this._oValueScaleSetting) {
			var oValueAxisScale = this.getValueAxisScale();
			if (oValueAxisScale && oValueAxisScale.scaleBehavior === ScaleBehavior.FixedScale) {
				var aDimUpdated = [];
				aNewDimensions.forEach(function(oDimension) {
					var idx = aOldDimensions.indexOf(oDimension);
					if (idx < 0) {
						aDimUpdated.push(oDimension);
					} else {
						aOldDimensions.splice(idx, 1);
					}
				});
				aDimUpdated = aDimUpdated.concat(aOldDimensions);

				if (aDimUpdated.length > 0) {
					var bFixedScale = false, sChartType = this.getChartType();
					if (ChartUtils.isStackedLikeChart(sChartType)) {
						bFixedScale = true;
						aDimUpdated.forEach(function(oDimension) {
							if (oDimension._getFixedRole() !== 'series') {
								bFixedScale = false;
							}
						});
					}
					if (!bFixedScale) {
						this._oValueScaleSetting.fireValueAxisFixedScaleTurnedOff = true;
						oValueAxisScale.scaleBehavior = ScaleBehavior.AutoScale;
						this.setProperty('valueAxisScale', oValueAxisScale);
						this.fireValueAxisFixedScaleTurnedOff();
						if (this._oValueScaleSetting.resetValueAxisScale) {
							oValueAxisScale = this.getValueAxisScale();
							this.setProperty('valueAxisScale', oValueAxisScale);
						}
						this._oValueScaleSetting =
							ValueAxisScaleUtils.getValueAxisScaleSetting(
								sChartType, oValueAxisScale, this.getMeasures(),
								this.getVisibleMeasures());
					}
				} else {
					this._oValueScaleSetting =
						ValueAxisScaleUtils.getValueAxisScaleSetting(
							this.getChartType(), oValueAxisScale,
							this.getMeasures(), this.getVisibleMeasures());
				}
			}
		}
	};

	/**
	 * Adds some dimension to the aggregation dimensions.
	 *
	 * Render a chart with time axis when the dimension type is {@link sap.chart.data.TimeDimension}.
	 * Please be advised that time axis is supported with limited chart types (column, line, combination, stacked_column, bubble, scatter, dual_combination, vertical_bullet, waterfall).
	 *
	 * @name sap.chart.Chart#addDimension
	 * @public
	 * @function
	 * @param {sap.chart.data.Dimension|sap.chart.data.TimeDimension} oDimension
	 * The dimension to add; if empty, nothing is inserted
	 * @returns {this} Reference to this in order to allow method chaining
	 */

	/**
	 * Removes a dimension from the aggregation dimensions, remove a visible dimension is unsupported when the property isAnalytical is false.
	 *
	 * @public
	 *
	 * @param {int|string|sap.chart.data.Dimension} oDimension
	 * The dimension to remove or its index or id.
	 *
	 * @return {sap.chart.data.Dimension} The removed dimension or null
	 */
	Chart.prototype.removeDimension = function(oDimension) {
		var aVisibleDimensions = this._getVisibleDimensions() || [];
		var iIndex;
		if (this.getIsAnalytical() === false && oDimension && oDimension.getName()) {
			iIndex = aVisibleDimensions.indexOf(oDimension.getName());
			if (iIndex !== -1) {
				Log.error('Data source does not support aggregation. The method "removeDimension" therefore cannot be used!');
				return;
			}
		}
		var oResult = this.removeAggregation("dimensions", oDimension);

		if (oResult) {
			iIndex = aVisibleDimensions.indexOf(oResult.getName());
			if (iIndex !== -1) {
				aVisibleDimensions.splice(iIndex, 1);
				this.setVisibleDimensions(aVisibleDimensions);
			}
			var aInResultDimensions = this.getInResultDimensions() || [];
			iIndex = aInResultDimensions.indexOf(oResult.getName());
			if (iIndex !== -1) {
				aInResultDimensions.splice(iIndex, 1);
				this.setInResultDimensions(aInResultDimensions);
			}
		}
		return oResult;
	};

	/**
	 * Removes all the controls from the aggregation dimensions, only works when the property isAnalytical is true.
	 *
	 * Additionally, it unregisters them from the hosting UIArea.
	 *
	 * @public
	 *
	 * @return {sap.chart.data.Dimension[]} An array of the removed elements (might be empty)
	 */
	Chart.prototype.removeAllDimensions = function() {
		var oResult;
		if (this.getIsAnalytical() === false) {
			Log.error('Data source does not support aggregation. The method "removeAllDimensions" therefore cannot be used!');
		} else {
			oResult = this.removeAllAggregation("dimensions");
			this.setVisibleDimensions([]);
			this.setInResultDimensions([]);
		}

		return oResult;
	};

	/**
	 * Destroys all the dimensions in the aggregation dimensions, only works when the property isAnalytical is true.
	 *
	 * @public
	 *
	 * @returns {this} Reference to this in order to allow method chaining
	 */
	Chart.prototype.destroyDimensions = function() {
		var oResult;
		if (this.getIsAnalytical() === false) {
			Log.error('Data source does not support aggregation. The method "destroyDimensions" therefore cannot be used!');
		} else {
			oResult = this.destroyAggregation("dimensions");
			this.setVisibleDimensions([]);
			this.setInResultDimensions([]);
		}

		return oResult;
	};

	Chart.prototype.removeMeasure = function(oMeasure) {
		var oResult = this.removeAggregation("measures", oMeasure);

		if (oResult) {
			var aVisibleMeasures = this._getVisibleMeasures() || [],
			iIndex = aVisibleMeasures.indexOf(oResult.getName());
			if (iIndex !== -1) {
				aVisibleMeasures.splice(iIndex, 1);
				this.setVisibleMeasures(aVisibleMeasures);
			}
		}
		return oResult;
	};

	Chart.prototype.removeAllMeasures = function() {
		var oResult = this.removeAllAggregation("measures");
		this.setVisibleMeasures([]);
		return oResult;
	};

	Chart.prototype.destroyMeasures = function() {
		var oResult = this.destroyAggregation("measures");
		this.setVisibleMeasures([]);
		return oResult;
	};
	Chart.prototype._getVisibleDimensions = function(bNormalize) {
		var oStackTop = this._getDrillStateTop();
		var aDims = oStackTop ? oStackTop.dimensions : this.getProperty("visibleDimensions");
		return bNormalize ? this._normalizeDorM(aDims, true) : aDims;
	};

	Chart.prototype.getVisibleDimensions = function() {
		var aVisibleDimensions = this._getVisibleDimensions();
		return this._aFeeds ? aVisibleDimensions.filter(function(d) {
			return this._aFeeds._unused.indexOf(d) === -1;
		}, this) : aVisibleDimensions;
	};

	Chart.prototype._getVisibleMeasures = function(bNormalize) {
		var oStackTop = this._getDrillStateTop();
		var aMsrs = oStackTop ? oStackTop.measures : this.getProperty("visibleMeasures");
		return bNormalize ? this._normalizeDorM(aMsrs) : aMsrs;
	};

	Chart.prototype.getVisibleMeasures = function() {
		var aVisibleMeasures = this._getVisibleMeasures();
		return this._aFeeds ? aVisibleMeasures.filter(function(d) {
			return this._aFeeds._unused.indexOf(d) === -1;
		}, this) : aVisibleMeasures;
	};

	/**
	 * Sets a new value for property visibleDimensions.
	 *
	 * Names of the Dimensions to be displayed in the Chart, all available dimensions will automatically append when the property isAnalytical is false.
	 *
	 * Depending on chart type, insufficient number of visible Dimensions will cause error.
	 *
	 * When called with a value of null or undefined, the default value of the property will be restored.
	 *
	 * Default value is [].
	 *
	 * @public
	 *
	 * @param {string[]} sVisibleDimensions
	 * New value for property visibleDimensions
	 *
	 * @returns {this} Reference to this in order to allow method chaining
	 */
	Chart.prototype.setVisibleDimensions = function(sVisibleDimensions, bSuppressInvalidate) {
		var mSanity = this._dimensionSanityCheck({visible: sVisibleDimensions});
		this.setProperty("visibleDimensions", sVisibleDimensions, bSuppressInvalidate);
		this.setProperty("inResultDimensions", mSanity.inResult, bSuppressInvalidate);
		this._createDrillStack();
		this._invalidateBy({
			source: this,
			keys: {
				binding: true,
				dataSet: true,
				vizFrame: true
			}
		});

		return this;
	};

	Chart.prototype.setInResultDimensions = function(aInResultDimensionNames, bSuppressInvalidate) {
		var mSanity = this._dimensionSanityCheck({inResult: aInResultDimensionNames});
		this.setProperty("inResultDimensions", aInResultDimensionNames, bSuppressInvalidate);
		this.setProperty("visibleDimensions", mSanity.visible, bSuppressInvalidate);
		this._createDrillStack();
		this._invalidateBy({
			source: this,
			keys: {
				binding: true,
				dataSet: true,
				vizFrame: true
			}
		});
		return this;
	};

	Chart.prototype.setVisibleMeasures = function(aMeasureNames, bSuppressInvalidate, bIsValidated) {
		this.setProperty("visibleMeasures", aMeasureNames, bSuppressInvalidate);
		var oDrillStateStack = this._drillStateStack || [];
		if (!this._bIsInitialized) {
			this._createDrillStack();
		} else {
			//Update all drill-stack levels with new visible measures.
			oDrillStateStack.forEach(function(oDrillState){
				oDrillState.measures = this.getProperty("visibleMeasures");
			}.bind(this));
		}
		//If the bIsValidated is false, should invalidate the chart.
		if (!bIsValidated) {
			this._invalidateBy({
				source: this,
				keys: {
					binding: true,
					dataSet: true,
					vizFrame: true
				}
			});
		}
		return this;
	};

	Chart.prototype.setEnableStableColor = function(bValue){
		bValue = !!bValue;
		if (this.getProperty("enableStableColor") !== bValue){
			this.setProperty("enableStableColor", bValue);
			this._invalidateBy({
				source:this,
				keys:{
					vizFrame:true
				}
			});
		}
		return this;
	};


	/**
	 * Sets a new value for property enablePagination, only works for oData model.
	 *
	 * <b>NOTE:</b> setEnablePagination currently only works in constructor.
	 *
	 * Enable pagination mode.
	 *
	 * Pagination mode empowers users to visualize dataset page by page by scrolling back or forth. Currently there are some restrictions of this mode in some chart transversal features, such as:
	 * <ol>
	 *   <li>Selection status might lost for new batch data</li>
	 *   <li>Keyboard navigation will be only available for current continuous batch data</li>
	 *	 <li>Zoom out might have inconsistent behavior, hence the gesture in mobile might have the same issue</li>
	 *	 <li>Time charts did not enable pagination yet</li>
	 *	 <li>Series color might be inconsistent before/after jump pages</li>
	 *	 <li>parameter <code>oBindingInfo.length</code> during {@link sap.ui.base.ManagedObject#bindAggregation bindAggregation} of {@link #getData data} will not be respected in value axis scale</li>
	 * </ol>
	 * Please refer to release notes for details.
	 *
	 * When called with a value of null or undefined, the default value of the property will be restored.
	 *
	 * Default value is false.
	 *
	 * @public
	 *
	 * @param {boolean}	bEnablePagination
	 * New value for property enablePagination
	 *
	 * @returns {this} Reference to this in order to allow method chaining
	 */
	Chart.prototype.setEnablePagination = function(bEnablePagination, bSuppressInvalidate) {
		if (!this._bIsInitialized) {
			this.setProperty("enablePagination", bEnablePagination, bSuppressInvalidate);
			this._createDrillStack();
			this._invalidateBy({
				source: this,
				keys: {
					binding: true,
					dataSet: true,
					vizFrame: true
				}
			});
		}
		return this;
	};

	// ******** Private helper functions ********
	/*
	 * Since we allow inResult and visible to race for a Dimension, we need to move a Dimension out of visible if it's
	 * being set as InResult, and vice versa.
	 */
	Chart.prototype._dimensionSanityCheck = function(oDims) {
		var aVisibles = oDims.visible || this.getVisibleDimensions() || [],
			aInResult = oDims.inResult || this.getInResultDimensions() || [];

		var mSummary = [].concat(aVisibles).concat(aInResult).reduce(function(mSumm, sId) {
			var bVisible  = aVisibles.indexOf(sId) !== -1,
				bInResult = aInResult.indexOf(sId) !== -1;
			if (bVisible && bInResult) {
				mSumm.common[sId] = true;
			} else if (bVisible) {
				mSumm.visible[sId] = true;
			} else if (bInResult) {
				mSumm.inResult[sId] = true;
			}

			return mSumm;
		}, {
			visible: {},
			inResult:{},
			common:  {}
		});

		mSummary.visible = Object.keys(mSummary.visible);
		mSummary.inResult = Object.keys(mSummary.inResult);
		mSummary.common = Object.keys(mSummary.common);

		return mSummary;
	};

	Chart.prototype._prepareFeeds = function() {
		if (!this._aFeeds) {
			var aDimensions = this._normalizeDorM(this._getVisibleDimensions(), true),
				aMeasures = this._normalizeDorM(this._getVisibleMeasures(), false),
				aInResults = this._normalizeDorM(this.getInResultDimensions(), true),
				aInvisibleMeasures;
			this._sAdapteredChartType = this.getEnablePagination() ? this.getChartType() : ChartTypeAdapterUtils.adaptChartType(this.getChartType(), aDimensions);

			//Semantic relation can also start from invisible measures.
			var aVisibleMeasures = this._getVisibleMeasures();
			aInvisibleMeasures = this._normalizeDorM(this.getMeasures().filter(function(value){
				return aVisibleMeasures.indexOf(value.getName()) === -1;
			}), false);

			var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
			var bV4ODataModel = V4ODataModel && (this.getModel() instanceof V4ODataModel);
			this._aFeeds = RoleFitter.fit(this._sAdapteredChartType, aDimensions, aMeasures, aInResults, this._enableSemanticPattern(), aInvisibleMeasures, bV4ODataModel);
			if ((!this._aFeeds._valid || this._aFeeds._unused.length) && this._sAdapteredChartType !== this.getChartType()) {
				// fall back to original chart type if feeding is invalid for adapted chart type
				this._sAdapteredChartType = this.getChartType();
				this._aFeeds = RoleFitter.fit(this._sAdapteredChartType, aDimensions, aMeasures, aInResults, this._enableSemanticPattern());
			}
			if (this._sAdapteredChartType !== this.getChartType()) {
				this._bNeedToApplyDefaultProperties = true;
			}
		}
		return this._aFeeds;
	};



	/**
	 * Convert an array containing any number of Dimension/Measure instances (object) and Dimension/Measure names (string)
	 * an array of Dimension/Measure instances. And filter out any Dimensions/Measures that are not in the Dimension/Measure
	 * aggregation.
	 *
	 * @param {array} aMixed the mixed array of Dimension/Measure instances and names
	 * @param {boolean} bIsDimension whether the input array are Dimensions
	 * @return {array} an array of Dimension/Measure instances that present in the visible Dimension/Measure aggregation
	 *				   result.error will contain all the non-normalizable input from the mixed array passed in
	 * @private
	 */
	Chart.prototype._normalizeDorM = function(aMixed, bIsDimension) {
		var aAll = bIsDimension ? this.getDimensions() : this.getMeasures(),
			mLookUp = aAll.reduce(function(mMap, oDimOrMsr) {
				mMap[oDimOrMsr.getName()] = oDimOrMsr;
				return mMap;
			}, {}),
			clazz = bIsDimension ? Dimension : Measure;

		var oResult = aMixed.reduce(function(oResult, oNameOrDM) {
			var sName;
			if (typeof oNameOrDM === "string") {
				sName = oNameOrDM;
			} else if (oNameOrDM instanceof clazz) {
				sName = oNameOrDM.getName();
			} else {
				oResult.errors.push(oNameOrDM);
			}
			if (mLookUp[sName]) {
				oResult.normalized.push(mLookUp[sName]);
			} else {
				oResult.errors.push(oNameOrDM);
			}
			return oResult;
		}, {
			normalized: [],
			errors: []
		});

		var aNormalized = oResult.normalized;
		if (oResult.errors.length > 0) {
			aNormalized.errors = oResult.errors;
		}

		return aNormalized;
	};

	/**
	 * Calculate redundant Dimensions and Measures from selected data points (selection)
	 * against visible Dimensions and Measures.
	 *
	 * A Dimension is considered to be redundant if all selected data points share the same value for it.
	 * A Measure is considered to be redundant if none of the selected data point are of this measure.
	 *
	 * @return {object} key, value pairs for redundant Dimensions and Measures.
	 *					For Dimensions, key is the Dimension name and value is the redundant value;
	 *					For Measures, key is "measureNames" and value is an map having the redundant Measure names as keys
	 * @private
	 */
	Chart.prototype._redundantsFromSelection = function() {
		var aSelections = this._getVizFrame().vizSelection();
		if (!aSelections || aSelections.length === 0) {
			return {measureNames: {}};
		}
		var oSemanticTuples = this._getContinuesSemanticTuples();

		var mSelectionSummary = aSelections.reduce(function(mSummary, oSelection) {
			var aInvisibleSemMsr = [];
			for (var tuple in oSemanticTuples) {
				if (oSemanticTuples.hasOwnProperty(tuple)) {
					var semanticRule = oSemanticTuples[tuple];
					if (oSelection.data[tuple]) {
						//Filter measures according with semantic relations
						aInvisibleSemMsr.push((oSelection.data[semanticRule.timeAxis] < semanticRule.projectedValueStartTime) ? semanticRule.projected : semanticRule.actual);
					} else {
						//Filter internal unbound measures which is invisible for chart.
						aInvisibleSemMsr.push(semanticRule.actual);
						aInvisibleSemMsr.push(semanticRule.projected);
					}
				}
			}

			jQuery.each(oSelection.data, function(k, v) {
				if (!(aInvisibleSemMsr.length > 0 && aInvisibleSemMsr.indexOf(k) > -1)) {
					if (!mSummary[k]) {
						mSummary[k] = [];
					}
					if (mSummary[k].indexOf(v) === -1) {
						mSummary[k].push(v);
					}
				}
			});
			return mSummary;
		}, {});

		var mRedundants = !this.getHideSharedInformation() ? {} : this._getVisibleDimensions().reduce(function(mRedundantDimensions, sDimensionName) {
			var aValues = mSelectionSummary[sDimensionName];
			if (aValues.length === 1) {
				mRedundantDimensions[sDimensionName] = aValues[0];
			}
			return mRedundantDimensions;
		}, {});

		mRedundants.measureNames = this._getVisibleMeasures().reduce(function(mRedundantMeasures, sMsrName) {
			if (!mSelectionSummary[sMsrName]) {
				mRedundantMeasures[sMsrName] = true;
			}
			return mRedundantMeasures;
		}, {});

		return mRedundants;
	};

	/**
	 * Derive a filter from the selected data points (selection).
	 * The returned Filter will make sure only the Dimension values that presents in the selection are retained.
	 *
	 * NOTE: Redundant Measures is to be handled in the request rather than here in Filter
	 *
	 * @return {object} { filters: ... hierarchyFilters: ... }
	 * @private
	 */
	Chart.prototype._deriveFilterFromSelection = function() {
		var aVisibleDimensions = this._getVisibleDimensions();
		var that = this;
		var vizSelection = this._getVizFrame().vizSelection();
		if (this.getSelectionBehavior().toUpperCase() === SelectionBehavior.Category) {
			vizSelection = vizSelection.category;
		} else if (this.getSelectionBehavior().toUpperCase() === SelectionBehavior.Series) {
			vizSelection = vizSelection.series;
		}
		var bHasHierarchyDim = false;
		var aFilterCfgs = vizSelection.map(function(oSelection) {
			var oConfig = aVisibleDimensions.reduce(function(oFilterCfg, sDimensionName) {
				var oDimension = that.getDimensionByName(sDimensionName);
				var value;
				value = oSelection.data[sDimensionName];
				if (value != null) {
					if (ChartUtils.CONFIG.timeChartTypes.indexOf(that._sAdapteredChartType) > -1 &&
						 oDimension instanceof TimeDimension) {
						var oDateInstance = DateFormatUtil.getInstance(oDimension.getTimeUnit());
						if (oDateInstance) {
							var fnFormat = oDateInstance.format.bind(oDateInstance);
							value = fnFormat(new Date(oSelection.data[sDimensionName]));
						}
					}
					var oFilter = new Filter({path: sDimensionName, operator: FilterOperator.EQ, value1: value});
					if (oDimension instanceof HierarchyDimension) {
						oFilterCfg.hierarchyFilters.push(oFilter);
						bHasHierarchyDim = true;
					} else {
						oFilterCfg.filters.push(oFilter);
					}
					oFilterCfg.signature.push(sDimensionName + "=" + oSelection.data[sDimensionName]);
				}
				return oFilterCfg;
			}, {
				filters: [],
				hierarchyFilters: [],
				signature: []
			});
			oConfig.signature = oConfig.signature.join(";");
			return oConfig;
		});

		var mUniqFilters = aFilterCfgs.reduce(function(mFilters, oCfg) {
			if (!mFilters[oCfg.signature] && (oCfg.filters.length + oCfg.hierarchyFilters.length > 0)) {
				mFilters[oCfg.signature] = {
					filters: oCfg.filters.length ? new Filter(oCfg.filters, true) : null,
					hierarchyFilters: oCfg.hierarchyFilters.length ? new Filter(oCfg.hierarchyFilters, true) : null
				};
			}
			return mFilters;
		}, {});

		var aFilters = Object.keys(mUniqFilters).map(function(k) {
			return {
				filters: mUniqFilters[k].filters,
				hierarchyFilters: mUniqFilters[k].hierarchyFilters
			};
		});

		if (aFilters.length > 1) {
			if (bHasHierarchyDim) {
				return {
					hierarchyFilters: new Filter(aFilters.map(function(oFilter) {
						return oFilter.hierarchyFilters;
					}), false)
				};
			} else {
				return {
					filters: new Filter(aFilters.map(function(oFilter) {
						return oFilter.filters;
					}), false)
				};
			}
		} else if (aFilters.length === 1) {
			return {
				filters: aFilters[0].filters,
				hierarchyFilters: aFilters[0].hierarchyFilters
			};
		} else {
			return {
				filters: null,
				hierarchyFilters: null
			};
		}
	};

	function checkHierarchySelectionValid() {
		var selectionBehavior = this.getSelectionBehavior();
		var selectedDims = this._getVisibleDimensions().concat(this.getInResultDimensions()).filter(function(sDim) {
			var oDim = this.getDimensionByName(sDim);
			if (selectionBehavior.toUpperCase() === SelectionBehavior.Category) {
				return oDim._getFixedRole() === "category" || oDim._getFixedRole() === "category2";
			} else if (selectionBehavior.toUpperCase() === SelectionBehavior.Series) {
				return oDim._getFixedRole() === "series";
			}
			return true;
		}.bind(this));
		var bHasHierarchyDim = selectedDims.some(function(sDim) {
			var oDim = this.getDimensionByName(sDim);
			return oDim instanceof HierarchyDimension;
		}.bind(this));
		var selectedItems;
		if (selectionBehavior.toUpperCase() === SelectionBehavior.Category) {
			selectedItems = this.getSelectedCategories().categories;
		} else if (selectionBehavior.toUpperCase() === SelectionBehavior.Series) {
			selectedItems = this.getSelectedSeries().series;
		} else {
			selectedItems = this.getSelectedDataPoints().dataPoints;
		}

		// do not allow drill down with multiple selection when hierarchy dimension found in mulitple layers of dimensions
		if (bHasHierarchyDim && Object.keys(selectedDims).length > 1 && selectedItems.length > 1) {
			return false;
		}
		return true;
	}

	/**
	 * Check that the dimension to be drilled down actually can be drilled down
	 *
	 * @private
	 * @param {array} aIncomingDimensions an array of Dimensions to be drilled down
	 * @return {boolean} true if the chart can drill down on all provided Dimensions, otherwise return false
	 */
	Chart.prototype._checkDrilldownValid = function(aIncomingDimensions) {
		if (this._bEmptyData) {
			Log.error("Drill down not possible, because there is already no data available!");
			return false;
		}

		var aInResultDimensions = this.getInResultDimensions();
		var mVisibleDimensions = this._getVisibleDimensions().concat(aInResultDimensions).reduce(function(mMap, sDimensionName) {
			mMap[sDimensionName] = true;
			return mMap;
		}, {});

		if (!checkHierarchySelectionValid.call(this)) {
			Log.error("Drill down not possible, because multiple selections on hierarchy/regular mixed dimension is not supported in backend service!");
			return false;
		}

		function verifyDim(oDim, mSelectedDims) {
			var result = true;
			if (mSelectedDims[oDim.getName()]) {
				if (!(oDim instanceof HierarchyDimension)) {
					Log.error("Drill down not possible, because one of the given dimensions is already drilled down!");
					result = false;
				} else {
					if (aInResultDimensions.indexOf(oDim.getName()) > -1) {
						// inResult dimension does not appear in drill path, disable drill down if it is a hierarchy dimension
						Log.error("Drill down not possible, because one of the given dimensions is inResult!");
						result = false;
					}
				}
			}
			return result;
		}

		// Prevent drill down again on dimensions that are visible already
		for (var i = 0; i < aIncomingDimensions.length; ++i) {
			if (!verifyDim(aIncomingDimensions[i], mVisibleDimensions)) {
				return false;
			}
		}

		var mArgumentDimensionNames = aIncomingDimensions.reduce(function(oResult, oDimension) {
			oResult[oDimension.getName()] = oDimension;
			return oResult;
		}, {});


		var that = this;
		// recursively check the filter tree for a dimension which we want to drill down into
		function findFilter(oFilter) {
			if (Array.isArray(oFilter.aFilters)) { // Subtree
				return oFilter.aFilters.some(findFilter);
			} else { // Leaf
				return !verifyDim(that.getDimensionByName(oFilter.sPath), mArgumentDimensionNames);
			}
		}

		var oStackTop = this._getDrillStateTop();
		if (oStackTop && oStackTop.filter && findFilter(oStackTop.filter)) {
			return false;
		}

		return true;
	};

	/**
	 * Create the drill stack from visible Dimensions and Measures.
	 *
	 * The created drill stack should allow user to drill up by removing one visible Dimension
	 * each time until no Dimension is left
	 *
	 * If some of visible dimensions are unavailable and contain hierarchy dimensions, drill stack will be initialized by treating
	 * them as regular dimensions and update drill stack when they are available. Backward compatibility for behavior of synchronous
	 * call of 'getDrillStack()' can be ensured if user only use regular dimensions.
	 *
	 * @private
	 */
	Chart.prototype._createDrillStack = function() {
		this._drillStateStack = createDrillStack.call(this);

		var aVisibleDimensions = this.getProperty("visibleDimensions") || [];
		this._aUnavailableDims = aVisibleDimensions.filter(function(sDim) {
			return !this.getDimensionByName(sDim);
		}.bind(this));

		if (this._aUnavailableDims.length) {
			// some dims unavailable, check drill stack when rerendering
			this._invalidateBy({
				source: this,
				keys: {
					drillStack: true
				}
			});
		} else {
			// all dims available, fire drillStackInitialized event
			this.fireDrillStackChanged(this.getDrillStack());
		}
	};

	Chart.prototype._updateDrillStack = function() {
		var bHasHierarchyDim = this._aUnavailableDims.some(function(sDim) {
			return this.getDimensionByName(sDim) instanceof HierarchyDimension;
		}.bind(this));
		if (bHasHierarchyDim) {
			// update drill stack only when there are hierarchy dimensions in unavailable dims
			this._drillStateStack = createDrillStack.call(this);
		}
		this._aUnavailableDims = [];
		this.fireDrillStackChanged(this.getDrillStack());
	};

	function createDrillStack() {
		var aVisibleDimensions = this.getProperty("visibleDimensions") || [],
			aVisibleMeasures = this.getProperty("visibleMeasures") || [],
			aStack = [{
				dimensions: [],
				measures: aVisibleMeasures,
				filter: undefined,
				nonHierarchyFilters: undefined,
				hierarchyFilters: undefined,
				hierarchylevel: {}
			}],
			aStackDimensions = [];

		var oHierarchylevel = {};
		for (var i = 0; i < aVisibleDimensions.length; i++) {
			var sDim = aVisibleDimensions[i];
			aStackDimensions.push(sDim);
			var oDim = this.getDimensionByName(sDim);
			if (oDim && oDim instanceof HierarchyDimension) {
				oHierarchylevel[sDim] = oDim.getLevel();
			}
			aStack.push({
				dimensions: aStackDimensions.slice(),
				measures: aVisibleMeasures,
				filter: undefined,
				nonHierarchyFilters: undefined,
				hierarchyFilters: undefined,
				hierarchylevel: jQuery.extend(true, {}, oHierarchylevel)
			});
		}
		return aStack;
	}

	/**
	 * Invalidate certain aspect of the Chart control so it gets updated accordingly on the re-render phase.
	 *
	 * It is not required to update all aspects on each invalidation because some causes only changes certain, but not all, aspect.
	 * For example
	 *	 a. If the cause is Dimension/Measure property (label, role, or format etc) change, it is not necessary to update the binding and drill state;
	 *	 b. If the cause is visibleDimensions/visibleMeasures change, it is required to update almost everything.
	 * and the cases goes on.
	 *
	 * @param {object} oCause the cause of the invalidation
	 * @private
	 */
	Chart.prototype._invalidateBy = function(oCause) {
		var oSource = oCause.source;

		var aAdditionalDims = this._oCandidateColoringSetting ? (this._oCandidateColoringSetting.additionalDimensions || []) : [];
		if (oSource === this) {
			jQuery.each(oCause.keys || {}, function(k, v) {
				this._markForUpdate(k, v);
			}.bind(this));
		} else if (oSource instanceof Measure && this._getVisibleMeasures().indexOf(oSource.getName()) !== -1) {
			this._markForUpdate("dataSet", true);
			this._markForUpdate("vizFrame", true);
			if (oCause.property === "unitBinding" ||
				(this.getColorings() && (oCause.property === 'semantics' || oCause.property === 'semanticallyRelatedMeasures'))
				// measure semantics will influence colorings and may need update binding in some cases
				) {
				this._markForUpdate("binding", true);
			}
		} else if (oSource instanceof Dimension && this._getVisibleDimensions().concat(aAdditionalDims).indexOf(oSource.getName()) !== -1) {
			// visible dimensions(including drilled down dimensions)
			this._markForUpdate("dataSet", true);
			this._markForUpdate("vizFrame", true);
			if ((oSource.getDisplayText() && (oCause.property === "textProperty" || oCause.property === "displayText" ))) {
				this._markForUpdate("binding", true);
			} else if (oCause.property === 'level' && this.getProperty('visibleDimensions').indexOf(oSource.getName()) > -1) {
				// reset drill stack when hierarchy level of hierarchy dimension in 'visibleDimensions' is changed
				this._createDrillStack();
				this._markForUpdate("binding", true);
			}
		} else if (oSource instanceof Dimension && this.getProperty('inResultDimensions').indexOf(oSource.getName()) > -1) {
			// inResult dimension
			if (oCause.property === 'level') {
				this._markForUpdate("dataSet", true);
				// hierarchy level change will cause binding to request new data
				this._markForUpdate("binding", true);
				this._markForUpdate("vizFrame", true);
			}
		}

		this.invalidate(oCause);
	};

	Chart.prototype._handleNonAnalyticalFeeding = function() {
		var that = this;
		var inResult = this.getInResultDimensions();
		var visibleDimensions = this._getVisibleDimensions(),
			allDimensions = this.getDimensions().map(function(oValue) {
				return oValue.getName();
			});
		//arr contains textProperty
		var arr = [];
		allDimensions.forEach(function(dimension) {
			if (that.getDimensionByName(dimension)) {
				var textProperty = that.getDimensionByName(dimension).getTextProperty();
				if (textProperty) {
					arr.push(textProperty);
				}
			}
		});

		/*Merge visibleDimensions and allDimensions, remove duplicate items, and textProperty and inresultDimension.
		 *Keep the user settings of visibleDimensions, then auto append other dimensions for user.
		 *Filter unitBinding/textProperty/inResult behind auto appending to prevent this three dimensions are already exist in visibleDimensions.
		 */
		var vDimensions = visibleDimensions.concat(allDimensions.filter(function(item) {
			return (visibleDimensions.indexOf(item) < 0);
		})).filter(function(item) {
			return (arr.indexOf(item) < 0) && (inResult.indexOf(item) < 0);
		});
		this.setProperty("visibleDimensions", vDimensions);
		this._createDrillStack();
	};

	// ******** Private updaters. These updaters are meant to be triggered by the _render function. ********

	Chart.prototype._markForUpdate = function(key, bNeedUpdate) {
		if (!this._mNeedToUpdate) {
			this._mNeedToUpdate = {};
		}
		this._mNeedToUpdate[key] = bNeedUpdate;
		var fnOnInvalidate = this._updaters.onInvalidate[key];
		if (fnOnInvalidate) {
			fnOnInvalidate.call(this);
		}
	};
	Chart.prototype._updaters = (function() {
		return {
			onInvalidate: {
				vizFrame: function() {
					this._aFeeds = null;
					this._bColoringParsed = null;
				},
				checkBinding: function() {
					this._bColoringParsed = null;
				},
				binding: function() {
					this._bColoringParsed = null;
				},
				loopData: function() {
					this._bColoringParsed = null;
				}
			},
			checkBinding: function() {
				// sync point for colorings & activeColoring properties to decide if binding should be updated
				var oCandidateColoringSetting = this._getCandidateColoringSetting();
				var aAdditionalDimensions = oCandidateColoringSetting.additionalDimensions;
				var aAdditionalMeasures = oCandidateColoringSetting.additionalMeasures;
				if ((aAdditionalDimensions && aAdditionalDimensions.length) ||
					(aAdditionalMeasures && aAdditionalMeasures.length)) {
					this._mNeedToUpdate["binding"] = true;
				}
			},
			drillStack: function() {
				// update drill stack if some dimension is not available when drill stack is created
				this._updateDrillStack();
			},
			dataSet: function() {
				this._getDataset().invalidate();
			},
			/* This BINDING is NOT the chart binding */
			binding: function() {
				var oBinding = this._getDataset().getBinding("data"),
					inResult = this.getInResultDimensions();
				if (!oBinding) {
					return;
				}


				var aDimensions = this._getVisibleDimensions(true).concat(this._normalizeDorM(inResult, true));
				var aMeasures = this._getVisibleMeasures(true);
				this._oMeasureRangePromise = DataSourceUtils.updateModel(this.getIsAnalytical())(this, aDimensions, aMeasures);
				var oStackTop = this._getDrillStateTop();
				if (aDimensions.length > 0 || aMeasures.length > 0) {
					//this._getVizFrame()._pendingDataRequest(true); // prevent vizFrame from updating by an empty dataset before data is received
					this._getVizFrame()._readyToRender(false);
					this.setBusy(true);
				}
				this._bFilterCalledByChart = true;
				// default filtertype in v2 ODataModel and v4 ODataModel is different.
				oBinding.filter((oStackTop && oStackTop.filter) ? oStackTop.filter : undefined, FilterType.Control);
				var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
				if (V4ODataModel && (this.getModel() instanceof V4ODataModel)) {
					if (oBinding._bSuspendCalledByChart) {
						oBinding._bSuspendCalledByChart = false;
						oBinding.getRootBinding().resume();
					}
				}
				if (this._bEnbableValueAxisScale) {
					this._validateValueScaleOnDimChange(aDimensions, this._aDimensions);
				}
				this._aDimensions = aDimensions;
			},
			vizFrame: function() {
				var that = this,
				oDataset = this._getDataset(),
				oVizFrame = this._getVizFrame();
				var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
				if (this._mNeedToUpdate['binding']) {
					var oBinding = this._getDataset().getBinding("data");
					if (V4ODataModel && (this.getModel() instanceof V4ODataModel)) {
						var oRootBinding = oBinding.getRootBinding();
						if (oRootBinding && !oRootBinding.isSuspended()) {
							oRootBinding.suspend();
							oBinding._bSuspendCalledByChart = true;
						}
					}
					if (this._isEnablePaging()) {
						this._getPagingController().reset();
						this._oColoringStatus = {};
					} else {
						//TODO, move this logical out of chart
						this._getDataset().setPagingOption(null);
					}
				} else {
					// loop cached data if there is no binding change
					this._markForUpdate('loopData', true);
				}
				if ( this.getEnableStableColor()){
					this._oColorTracker.add(oVizFrame._runtimeScales());
					oVizFrame._runtimeScales(this._oColorTracker.get(), true);

				} else {
					this._resetRuntimeScale();
				}
				var mMeasureRange = this._isEnablePaging() ? this._getPagingController().getMeasureRange() : {};


				oDataset.removeAllAggregation("dimensions", true);
				oDataset.removeAllAggregation("measures", true);

				oVizFrame.removeAllAggregation("feeds", true);

				if (this.getIsAnalytical() === false) {
					this._handleNonAnalyticalFeeding();
				}
				var aFeeds = {};
				try {
					aFeeds = this._prepareFeeds();
					aFeeds._def.dim.forEach(function(oDim) {
						oDataset.addAggregation("dimensions", oDim, true);
					}, this);
					aFeeds._def.msr.forEach(function(oMsr) {
						if (oMsr) {
							var oRange = mMeasureRange[oMsr.getIdentity()];
							if (oRange) {
								oMsr.setRange([oRange.min, oRange.max]);
							}
							if (!that.getDimensionByName(oMsr.getUnit())) {
								oMsr.setUnit(null);
							}
							oDataset.addAggregation("measures", oMsr, true);
						}
					}, this);
					aFeeds.forEach(function(oFeedItem) {
						oVizFrame.addFeed(oFeedItem);
					});
				} catch (e) {
					// catch the feeds' error
					// need vizFrame to handle the error
				}

				this._semanticTuples = aFeeds._semanticTuples;
				var oCandidateColoringSetting = this._getCandidateColoringSetting();

				var aDatasetContexts = aFeeds._context || [];
				var aAdditionalMeasures = oCandidateColoringSetting.additionalMeasures || [];
				var aAdditionalDimensions = oCandidateColoringSetting.additionalDimensions || [];
				var bV4ODataModel = V4ODataModel && (this.getModel() instanceof V4ODataModel);
				aAdditionalMeasures.forEach(function(sMsr) {
					aDatasetContexts.push({
						id: sMsr,
						showInTooltip: false
					});
					var measure = new MeasureDefinition({
						name: sMsr,
						identity: sMsr,
						value: '{' + sMsr + '}'
					});
					if (bV4ODataModel) {
						measure.setBindingContext(null);
					}
					oDataset.addMeasure(measure);
				});

				aAdditionalDimensions.forEach(function(sDim) {
					aDatasetContexts.push({
						id: sDim,
						showInTooltip: false
					});
					var dimension = new DimensionDefinition({
						name: sDim,
						identity: sDim,
						value: '{' + sDim + '}'
					});
					if (bV4ODataModel) {
						dimension.setBindingContext(null);
					}
					oDataset.addDimension(dimension);
				});

				oDataset.setContext(aDatasetContexts);

				oVizFrame.invalidate();
				oDataset.invalidate();
				oVizFrame.setVizType(this._reset100DonutChartType(this._sAdapteredChartType));

				oVizFrame._setCustomMessages(this.getCustomMessages());
				this._setValueAxisScale();
				//LoopData will call _setEffectiveScales and setVizProperties
				if (!this._mNeedToUpdate['loopData']) {
					this._setEffectiveScales();
					oVizFrame.setVizProperties(this._getEffectiveProperties());
				}
			},
			loopData: function() {
				var oVizFrame = this._getVizFrame();
				try {
					this._prepareData();
				} catch (e) {
					if (e instanceof ChartLog) {
						e.display();
					} else {
						throw e;
					}
				}
				var oVizProperties = this._getEffectiveProperties();
				//TODO: merge 'using DisplayName' logic into one loop in 'prepareData'
				this._usingDisplayNameForSemantics(oVizProperties);
				oVizFrame.setVizProperties(oVizProperties);
				this._setEffectiveScales();
			}
		};

		//return [oDrillStackUpdater, oDataSetUpdater, oVizFrameUpdater, oBindingUpdater];
	})();

	// ******** Private Accessors ********
	Chart.prototype._getDrillStateTop = function() {
		return this._drillStateStack ? this._drillStateStack[this._drillStateStack.length - 1] : null;
	};

	Chart.prototype._getVizFrame = function() {
		return this.getAggregation("_vizFrame");
	};

	Chart.prototype._getDataset = function() {
		var oVizFrame = this._getVizFrame();
		return oVizFrame ? oVizFrame.getDataset() : null;
	};

	Chart.prototype._prepareData = function() {
		var aContext = this._getContexts();
		if (aContext) {
			this._bEmptyData = aContext.length ? false : true;

			// 1) get context handler of Colorings
			var oColoringHandler = this._getCandidateColoringSetting().contextHandler;

			// 2) loop context if necessary in Colorings
			var aContextHandlers = [];
			if (oColoringHandler) {
				aContextHandlers.push(oColoringHandler);
				try {
					this._loopContext(aContextHandlers);
				} catch (e) {
					if (e instanceof ChartLog) {
						e.display();
						// invalidate coloring setting if error
						this._oCandidateColoringSetting = {};
					} else {
						throw e;
					}
				}
			}

			// 3) Generate semantic rules with Pattern and Coloring
			this._oSemanticVizSettings = MeasureSemanticsUtils.getSemanticVizSettings(
				this._sAdapteredChartType,
				this._semanticTuples,
				this._oCandidateColoringSetting,
				this._enableSemanticPattern(),
				this._bDataPointStyleSetByUser,
				this._bLegendSetByUser
			);
		}
	};

	Chart.prototype._getContexts = function() {
		return this._getDataset()._getDataContexts();
	};

	Chart.prototype._loopContext = function(aContextHandlers) {
		var aContexts = this._getContexts();
		if (aContexts.length > 0 && !aContexts.dataRequested) {
			var that = this;
			aContexts.forEach(function(oContext) {
				aContextHandlers.forEach(function(fnContextHandler) {
					fnContextHandler.call(that, oContext);
				});
			});
		}
	};

	Chart.prototype._filterHandler = function() {
		if (!this._bFilterCalledByChart) {
			this._bFilterCalledByCustomer = true;

			// Coloring.Criticality.MeasureValues.ConstantThresholds shall take Filter into consideration
			// filter will eventually trigger bindingChange, re-calculate coloring setting at that time
			this._bColoringParsed = false;
		}
		this._bFilterCalledByChart = false;
	};

	Chart.prototype._dataRefreshListener = function(oEvent) {
		if (oEvent.getParameters().reason === 'filter') {
			this._filterHandler();
		}
		if (this.getIsAnalytical() && oEvent.getParameters().updateAnalyticalInfo) {
			DataSourceUtils.updateModel(true)(this);
		}
	};

	Chart.prototype._bindingChangeListener = function(oEvent) {
		var oVizFrame = this._getVizFrame();
		if (oEvent.getParameters().reason === 'filter') {
			//set filter on client model will directly trigger 'dataChange' event
			this._filterHandler();
		}

		if (this.getEnableStableColor()){

			this._oColorTracker.add(oVizFrame._runtimeScales());
			oVizFrame._runtimeScales(this._oColorTracker.get(), true);
		}

		//Here we can get the source dataset, and then set the data's displayValue to legend's displayName in the semantic rules of vizProperties automatically for specific requirement.
		oVizFrame.invalidate(); // prevent an unnecessary immediate VizFrame re-render, re-render should happen after all invalidates
		this.setBusy(false);
		if (this._isEnablePaging()) {
			this._getPagingController().bindingChanged();
		} else {
			//allow vizframe to render
			oVizFrame._readyToRender(true);
		}

		try {
			this._prepareData();
		} catch (e) {
			if (e instanceof ChartLog) {
				e.display();
			}
		}

		var oVizProperties = this._getEffectiveProperties();
		//TODO: merge 'using DisplayName' logic into one loop in 'prepareData'
		this._usingDisplayNameForSemantics(oVizProperties);

		oVizFrame.setVizProperties(oVizProperties);
		this._setEffectiveScales();
		this._bFilterCalledByChart = false;
		this._bFilterCalledByCustomer = false;
	};

	Chart.prototype._resetRuntimeScale = function(){
		this._oColorTracker.clear();
		this._getVizFrame()._runtimeScales(this._oColorTracker.get(), true);
	};

	Chart.prototype._hasUserSemanticProps = function() {
		var oVizProperties = this.getProperty("vizProperties");
		if (oVizProperties && oVizProperties.plotArea) {
			if (oVizProperties.plotArea.dataPointStyle || oVizProperties.plotArea.seriesStyle) {
				return true;
			}
		}
		return false;
	};

	Chart.prototype._enableSemanticColoring = function() {
		var result = true;
		if (this._sAdapteredChartType === "heatmap") {
			var oVizScales = this.getProperty("vizScales") || [];
			var oVizColorScale = oVizScales.filter(function(oVizScale) {
				return oVizScale.feed === "color";
			})[0];
			if (oVizColorScale) {
				result = false;
			}
		} else {
			if (this._hasUserSemanticProps()) {
				result = false;
			}
		}
		return result;
	};

	/************* Semantic Pattern's internal method *******************/

	Chart.prototype._enableSemanticPattern = function() {
		return !this._hasUserSemanticProps() &&
		ChartUtils.CONFIG.nonSemanticPatternChartType.indexOf(this._sAdapteredChartType) === -1;
	};

	Chart.prototype._hasSemanticPattern = function() {
		return this._enableSemanticPattern() && MeasureSemanticsUtils.hasSemanticRelation(this._semanticTuples);
	};

	Chart.prototype._getContinuesSemanticTuples = function(){
		var tuples = {};
		if (this._hasSemanticPattern()) {
			tuples = this._semanticTuples.reduce(function(arrs, tuple){
				if (tuple.semanticMsrName) {
					arrs[tuple.semanticMsrName] = tuple;
				}
				return arrs;
			}, {});
		}
		return tuples;
	};

	Chart.prototype._getContinuesSemanticMap = function(){
		var tuples = [];
		if (this._hasSemanticPattern()) {
			tuples = this._semanticTuples.filter(function(tuple){
				return tuple.projectedValueStartTime;
			});
		}
		return tuples;
	};

	Chart.prototype._getInternalVisibleMeasures = function(){
		var aMsrs = this._getVisibleMeasures();
		if (this._hasSemanticPattern()) {
			aMsrs = aMsrs.concat(this._getContinuesSemanticMap().map(function(tuple){
				return tuple.semanticMsrName;
			}));
		}
		return aMsrs;
	};

	Chart.prototype._buildSelectedDataPoints = function(oBinding, aDataPoints){
		//For get/setSelectedDataPoints API
		//Build vizframe's selected datapoint structure.
		var aMsrs = this._getInternalVisibleMeasures(),
			aDims = this._getVisibleDimensions().concat(this.getInResultDimensions()),
			aSelectedDataPoints = this._getEffectiveContinuesDataPoints(aDataPoints);
		return SelectionAPIUtils.buildSelectionVizCtx(aMsrs, aDims, oBinding, aSelectedDataPoints);
	};

	Chart.prototype._getEffectiveContinuesSeries = function(aSeries){
		var aSelectedSeries = aSeries.slice(), continuesSemanticTuples = this._getContinuesSemanticMap();
		if (this._hasSemanticPattern()) {
			var msrsMap = aSelectedSeries.map(function(series){
				return series.measures;
			});

			continuesSemanticTuples.forEach(function(tuple){
				if (msrsMap.indexOf(tuple.actual) > -1 || msrsMap.indexOf(tuple.projected) > -1) {
					aSelectedSeries = aSelectedSeries.filter(function(series){
						return series.measures !== tuple.actual && series.measures !== tuple.projected;
					});
					if (msrsMap.indexOf(tuple.actual) > -1 && msrsMap.indexOf(tuple.projected) > -1) {
						aSelectedSeries.push({
							measures : tuple.semanticMsrName
						});
					}
				}
			});
		}
		return aSelectedSeries;
	};

	Chart.prototype._getEffectiveContinuesDataPoints = function(aDataPoints){
		var aSelectedDataPoints = aDataPoints.slice(),  continuesSemanticTuples = this._getContinuesSemanticMap();
		if (this._hasSemanticPattern()) {
			var actIndex, proIndex, measures, tuple;
			for (var i = 0; i < aSelectedDataPoints.length; i++) {
				measures = aSelectedDataPoints[i].measures;
				for (var j = 0; j < continuesSemanticTuples.length; j++) {
					tuple = continuesSemanticTuples[j];
					actIndex = measures.indexOf(tuple.actual);
					if (actIndex > -1) {
						measures.splice(actIndex, 1);
					}
					proIndex = measures.indexOf(tuple.projected);
					if (proIndex > -1) {
						measures.splice(proIndex, 1);
					}
					if (actIndex > -1 || proIndex > -1) {
						measures.push(tuple.semanticMsrName);
					}
				}
			}
		}
		return aSelectedDataPoints;
	};

	Chart.prototype._buildSelectEventData = function(data) {
		if (data && data.length > 0 && this._hasSemanticPattern()) {
			var value, tuple;
			var continuesSemanticTuples = this._getContinuesSemanticMap();
			for (var i = 0; i < data.length; i++) {
				value = jQuery.extend(true, {}, data[i].data);
				for (var j = 0; j < continuesSemanticTuples.length; j++) {
					tuple = continuesSemanticTuples[j];
					if (value.measureNames === tuple.semanticMsrName) {
						//Need to filter interval unbound measures
						//TODO check null value case
						if (value[tuple.timeAxis] < tuple.projectedValueStartTime) {
							value.measureNames = tuple.actual;
							delete value[tuple.projected];
							delete value[tuple.semanticMsrName];
						} else {
							value.measureNames = tuple.projected;
							delete value[tuple.actual];
							delete value[tuple.semanticMsrName];
						}
					} else {
						if (value[tuple.actual] && value.measureNames !== tuple.actual) {
							delete value[tuple.actual];
						}
						if (value[tuple.projected] && value.measureNames !== tuple.projected) {
							delete value[tuple.projected];
						}
					}
				}
				data[i].data = value;
			}
		}
	};
	// ******** overridden functions ********

	// override standard aggregation methods for 'data' and report an error when they are used
	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "addData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.addData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "addData" therefore cannot be used programmatically!');
	};

	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "destroyData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.destroyData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "destroyData" therefore cannot be used programmatically!');
	};

	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "getData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.getData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "getData" therefore cannot be used programmatically!');
	};

	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "indexOfData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.indexOfData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "indexOfData" therefore cannot be used programmatically!');
	};

	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "insertData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.insertData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "insertData" therefore cannot be used programmatically!');
	};

	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "removeData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.removeData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "removeData" therefore cannot be used programmatically!');
	};

	/**
	 * Binds aggregation {@link #getData data} to model data.
	 *
	 * See {@link sap.ui.base.ManagedObject#bindAggregation ManagedObject.bindAggregation} for a detailed description of the possible properties of <code>oBindingInfo</code>.
	 *
	 * <b>NOTE:</b> If the {@link sap.ui.model.odata.v4.ODataListBinding list binding} is suspended, data related requests in Chart will be impacted, and the corresponding operations might not work as expected.
	 *
	 * @param {object} oBindingInfo The binding information
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 * @public
	 * @name sap.chart.Chart#bindData
	 * @function
	 */


	/**
	 * Unsupported.
	 * Chart manages the "data" aggregation only via data binding. The method "removeAllData" therefore cannot be used programmatically!
	 *
	 * @public
	 */
	Chart.prototype.removeAllData = function() {
		Log.error('Chart manages the "data" aggregation only via data binding. The method "removeAllData" therefore cannot be used programmatically!');
	};

	Chart.prototype._createOData4SAPAnalyticsModel = function(oModel) {
		var oOData4SAPAnalyticsModel = null;
		try {
			oOData4SAPAnalyticsModel = new odata4analytics.Model(new odata4analytics.Model.ReferenceByModel(oModel));
		} catch (exception) {
			return undefined;
		}
		return oOData4SAPAnalyticsModel;

	};

	/**
	 * Gets current value of property isAnalytical.
	 *
	 * Whether or not an aggregated entity set is bound to the chart.
	 *
	 * The property isAnalytical will programmatically set according to data source. When the data source has an aggregated entity set, isAnalytical is true, otherwise it's false.
	 *
	 * @public
	 *
	 * @return {boolean} Value of property isAnalytical
	 */
	Chart.prototype.getIsAnalytical = function() {
		return this.getProperty("isAnalytical");
	};

	/**
	 * Whether or not an aggregated entity set is bound to the chart. Deprecated.
	 *
	 * @returns {this}
	 * @public
	 */
	Chart.prototype.setIsAnalytical = function(oValue, bSuppressInvalidate) {
		if (this._bIsInitialized) {
			Log.error('The proeprty isAnalytical will programmatically set according to data source. The method "setIsAnalytical" therefore cannot be used!');
		} else {
			this.setProperty("isAnalytical", oValue, bSuppressInvalidate);
		}
		return this;
	};

	Chart.prototype._setIsAnalyticalProperty = function(oOData4SAPAnalyticsModel, oBindingInfo) {
		var oValue = oOData4SAPAnalyticsModel.findQueryResultByName(DataSourceUtils.getEntitySet(this.getIsAnalytical())(oBindingInfo)) !== undefined;
		if (this.getIsAnalytical() !== oValue) {
			this.setProperty("isAnalytical", oValue);
		}
	};

	Chart.prototype.bindAggregation = function(sName, oBindingInfo) {
		if (sName === "data") {
			// This may fail, in case the model is not yet set.
			// If this case happens, the ODataModelAdapter is added by the overridden _bindAggregation,
			// which is called during setModel(...)
			this._oBindingInfo = jQuery.extend(true, {}, oBindingInfo);
			var oModel = this.getModel(oBindingInfo.model);
			var oOData4SAPAnalyticsModel;
			if (oModel) {
				var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
				var JSONModel = sap.ui.require("sap/ui/model/json/JSONModel");
				if (JSONModel && oModel instanceof JSONModel) {
					if (this.getIsAnalytical() !== false) {
						this.setProperty("isAnalytical", false);
					}
				} else if (V4ODataModel && oModel instanceof V4ODataModel) {
					this.setProperty("isAnalytical", true);
					if (oBindingInfo) {
						oBindingInfo.parameters = jQuery.extend(true, {
							$count: true
						}, oBindingInfo.parameters);
					}
				} else {
					oOData4SAPAnalyticsModel = this._createOData4SAPAnalyticsModel(oModel);
					this._setIsAnalyticalProperty(oOData4SAPAnalyticsModel, oBindingInfo);
					if (this.getIsAnalytical()) {
						var V2ODataModel = sap.ui.require("sap/ui/model/odata/v2/ODataModel");
						if (oBindingInfo) {
							var bNoPaging = true;
							if (oBindingInfo.length != undefined || this._isEnablePaging() || V2ODataModel && (oModel instanceof V2ODataModel)) {
								bNoPaging = false;
							}
							oBindingInfo.parameters = jQuery.extend(true, {
										analyticalInfo: [],
										useBatchRequests: true,
										provideGrandTotals: false,
										reloadSingleUnitMeasures: true,
										noPaging: bNoPaging
									},
									oBindingInfo.parameters);
						}

						ODataModelAdapter.apply(oModel);
						if (oOData4SAPAnalyticsModel) {
							oModel.setAnalyticalExtensions(oOData4SAPAnalyticsModel);
						}
					}
				}
			}
		}
		return BaseControl.prototype.bindAggregation.apply(this, arguments);
	};

	Chart.prototype._bindAggregation = function(sName, oBindingInfo) {
		if (sName === "data") {
			// This may fail, in case the model is not yet set.
			// If this case happens, the ODataModelAdapter is added by the overridden _bindAggregation, which is called during setModel(...)
			var oModel = this.getModel(oBindingInfo.model);
			var oOData4SAPAnalyticsModel;
			if (oModel) {
				var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
				var JSONModel = sap.ui.require("sap/ui/model/json/JSONModel");
				if (JSONModel && oModel instanceof JSONModel) {
					if (this.getIsAnalytical() !== false) {
						this.setProperty("isAnalytical", false);
					}
					this._deriveColumns(oModel, oBindingInfo);
				} else if (V4ODataModel && oModel instanceof V4ODataModel) {
					this.setProperty("isAnalytical", true);
					if (oBindingInfo) {
						oBindingInfo.parameters = jQuery.extend(true, {
							$count: true
						}, oBindingInfo.parameters);
					}
				} else {
					oOData4SAPAnalyticsModel = this._createOData4SAPAnalyticsModel(oModel);
					this._setIsAnalyticalProperty(oOData4SAPAnalyticsModel, oBindingInfo);
					if (this.getIsAnalytical()) {
						var V2ODataModel = sap.ui.require("sap/ui/model/odata/v2/ODataModel");
						if (oBindingInfo) {
							var bNoPaging = true;
							if (oBindingInfo.length != undefined || this._isEnablePaging() || V2ODataModel && (oModel instanceof V2ODataModel)) {
								bNoPaging = false;
							}
							oBindingInfo.parameters = jQuery.extend(true, {
										analyticalInfo: [] ,
										useBatchRequests: true,
										provideGrandTotals: false,
										reloadSingleUnitMeasures: true,
										noPaging: bNoPaging
									},
									oBindingInfo.parameters);
						}

						ODataModelAdapter.apply(oModel);
						if (oOData4SAPAnalyticsModel) {
							oModel.setAnalyticalExtensions(oOData4SAPAnalyticsModel);
						}
					}
					this._deriveColumns(oModel, oBindingInfo);
				}
			}
			var oDataset = this._getDataset();
			oDataset.bindAggregation("data", oBindingInfo);
			var oBinding = oDataset.getBinding("data");
			if (oBinding && oModel) {
				var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
				if (V4ODataModel && oModel instanceof V4ODataModel) {
					oBinding._bSuspendCalledByChart = false;
				}
			}
			this._invalidateBy({
				source: this,
				keys: {
					binding: true,
					vizFrame: true
				}
			});
		} else {
			BaseControl.prototype._bindAggregation.apply(this, arguments);
		}
	};

	Chart.prototype._dataErrorListener = function(mEventParams){
		var oVizFrame = this._getVizFrame();
		if (oVizFrame){
			oVizFrame._readyToRender(true);
			oVizFrame.invalidate();
			this.setBusy(false);
		}
	};


	Chart.prototype.unbindAggregation = function(sName, bSuppressReset) {
		var bIsDuplicateUnbindAggregationData = false;
		if (sName === "data") {
			var oDataset = this._getDataset();
			if (oDataset) {
				var oBinding = oDataset.getBinding("data");
				if (oBinding) {
					delete oBinding._bSuspendCalledByChart;
				}
				oDataset.unbindAggregation.apply(oDataset, arguments);
			}
			bSuppressReset = true; // since we explicitly prohibit call to destroyData

			// some functions wull trigger this._getDataset().unbindAggregation('data', true)
			// (for example Chart.prototype.exit). if another unbindAggregation("data") is triggered
			// (bIsBeingDestroyed), we do not run BaseControl.prototype.unbindAggregation again
			// if this.bHasAnalyticalInfo is true and this.aContexts === undefined,
			// BaseControl.prototype.unbindAggregation will not duplicate unbind
			bIsDuplicateUnbindAggregationData = (!this.bHasAnalyticalInfo && this.aContexts === undefined && this._getDataset &&
				this._getDataset() === null && this.mBindingInfos && this.mBindingInfos[sName] &&
				this.mBindingInfos[sName].binding && this.mBindingInfos[sName].binding.bIsBeingDestroyed);
		}
		if (!bIsDuplicateUnbindAggregationData) {
			return BaseControl.prototype.unbindAggregation.apply(this, [sName, bSuppressReset]);
		}
	};

	Chart.prototype.unbindData = function() {
		//remove all dimensions/visibleDimensions,measures/visibleMeasures
		if (!this.getIsAnalytical()) {
			this.removeAllAggregation("dimensions");
			this.removeAllAggregation("measures");
			this.setProperty("visibleDimensions", []);
			this.setProperty("inResultDimensions", []);
			this.setProperty("visibleMeasures", []);
			this._createDrillStack();
		}
		this.unbindAggregation("data");
	};

	Chart.prototype._deriveColumns = function(oModel, oBindingInfo) {
		// derive dimensions and measures from metadata, if not yet set
		var aDimensions = this.getAggregation("dimensions");
		var aMeasures = this.getAggregation("measures");
		if ((aDimensions === null || aDimensions.length === 0) && (aMeasures === null || aMeasures.length === 0)) {
			var mColumns = DataSourceUtils.deriveColumns(this.getIsAnalytical())(oModel, oBindingInfo);
			mColumns.dimensions.forEach(this.addDimension.bind(this));
			mColumns.measures.forEach(this.addMeasure.bind(this));
		}
	};

	/*
	 * @override
	 * @private
	 */
	Chart.prototype.onBeforeRendering = function() {
		this._bIsInitialized = true;
		BaseControl.prototype.onBeforeRendering.apply(this, arguments);
		var aOrder = ["onInvalidate", "drillStack", "dataSet", "vizFrame", "checkBinding", "binding", "loopData"];
		// ensure "vizFrame" updaters earlier than binding since semantic coloring depends on auto-feeding
		aOrder.forEach(function(key) {
			if (this._mNeedToUpdate[key]) {
				this._updaters[key].call(this);
			}
		}.bind(this));

		jQuery.each(this._mNeedToUpdate, function(key) {
			this._mNeedToUpdate[key] = false;
		}.bind(this));
	};

	// Override to prevent Basecontrol._render from creating DOM node, since Chart performs rendering via _vizFrame
	Chart.prototype.onAfterRendering = function () {
		this._showLoading(this._bLoading);
		this._rendered = true;
	};

	Chart.prototype.onLocalizationChanged = function() {
		this._invalidateBy({
			source: this,
			keys: {
				vizFrame: true
			}
		});
	};

	/**
	 * @deprecated As of version 1.120
	 */
	Chart.prototype.onlocalizationChanged = Chart.prototype.onLocalizationChanged;

	/*
	 * @override
	 */
	Chart.prototype.exit = function() {
		this._getDataset().unbindAggregation('data', true);
		this._oColorTracker.clear();
		BaseControl.prototype.exit.apply(this, arguments);
		var oVizFrame = this._getVizFrame();
		if (this._delegateEventHandlers) {
			this._delegateEventHandlers.forEach(function(oHandler) {
				oVizFrame["detach" + oHandler.name](oHandler.handler, this);
				delete oHandler.handler;
			}, this);
			delete this._delegateEventHandlers;
		}
		oVizFrame.detachRenderComplete(this._vizFrameRenderCompleteHandler, this);
		oVizFrame.detachEvent("_zoomDetected", vizFrameZoomDetectedHandler.bind(this), this);
		oVizFrame.detachEvent("_selectionDetails", vizFrameSelectionDetailsHandler.bind(this), this);
	};


	/*
	 * @override
	 */
	Chart.prototype.applySettings = function() {
		this._mNeedToUpdate = {};

		Control.prototype.applySettings.apply(this, arguments);

		var oDataset = new FlattenedDataset();
		oDataset.attachEvent("dataChange", {}, this._bindingChangeListener, this);
		oDataset.attachEvent("dataRefresh", {}, this._dataRefreshListener, this);
		oDataset.attachEvent("dataError", {}, this._dataErrorListener, this);

		// make applicationSet : fiori as default. If we write it in the metadata, the jsdoc could not be generated correctly.
		var uiConfig = jQuery.extend(true, {}, {
			'applicationSet': 'fiori'
		}, this.getUiConfig());
		this.setUiConfig(uiConfig);
		this._bNeedToApplyDefaultProperties = true;
		this._oSemanticVizSettings = {};

		var oVizFrame = new VizFrame({
			width: vizFrameSize(this.getWidth()),
			height: vizFrameSize(this.getHeight()),
			vizType: this.getChartType(),
			uiConfig: this.getUiConfig(),
			vizProperties: jQuery.extend(true, {
				'title' : {
					'visible' : false
				}
			}, this._getEffectiveProperties())
		});

		oVizFrame.setDataset(oDataset);
		oVizFrame.attachRenderComplete(null, this._updateLoadingIndicator.bind(this));

		oVizFrame.attachEvent("_zoomDetected", vizFrameZoomDetectedHandler.bind(this));

		// The loading page should hide after renderfail when in pagination.
		oVizFrame.attachEvent("renderFail", null, function(e) {
			var pagingController =  this._getPagingController();
			if (pagingController._sLoadingTimer) {
				clearTimeout(pagingController._sLoadingTimer);
				pagingController._sLoadingTimer = null;
			}
			this._showLoading(false);
		}, this);

		this._rendered = false;
		//prevent chart to be rendered if no dimension or measure is feed
		oVizFrame._readyToRender(false);

		this.setAggregation("_vizFrame", oVizFrame);
		this._delegateEvents();

		this._sAdapteredChartType = this.getChartType();
		this._oCandidateColoringSetting = {};

		this._oColoringStatus = {};
		this._oColorTracker = new SeriesColorTracker();
		if (this._isEnablePaging()) {
			this._getPagingController();
		}
	};

	/**
	 * Set the chart custom messages. Supported messages please refer to enum {@link sap.chart.MessageId}.
	 *
	 * The user should handle the message localization.
	 *
	 * Example:
	 *
	 * <pre>
	 * oChart.setCustomMessages({
	 *	 'NO_DATA': "No data. Please change your filter"
	 * });
	 * </pre>
	 *
	 *When called with an invalid value, the default value will be restored.
	 *
	 * @param {object} oCustomMessages object containing customMessage values to update
	 * @public
	 * @returns {this}
	 */
	Chart.prototype.setCustomMessages = function(oCustomMessages) {
		this.setProperty("customMessages", oCustomMessages);
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			oVizFrame._setCustomMessages(oCustomMessages);
		}
		return this;
	};


	/**
	 * Get zoom information.
	 *
	 * Return the zooming enablement and current zooming level of chart.
	 *
	 * Object has the following structure:
	 *
	 * Example:
	 * <pre>
	 * {
	 *     "enabled":true,
	 *     "currentZoomLevel":0.16
	 * }
	 * </pre>
	 * @public
	 * @since 1.54
	 * @return {object} The zooming enablement and current zooming level of chart.The zooming level is between 0 and 1, and null when zooming isn't applicable.
	 */
	Chart.prototype.getZoomInfo = function() {
		return this._getZoomInfo();
	};

	//internal method for customer before version rel-1.54.
	Chart.prototype._getZoomInfo = function() {
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			return oVizFrame._getZoomInfo();
		}
	};

	// ******** Public API ********

	/**
	 * Reset to visible layout.
	 * @public
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.resetLayout = function() {
		this._createDrillStack();
		this._invalidateBy({
			source: this,
			keys: {
				binding: true,
				vizFrame: true,
				dataSet: true
			}
		});
		return this;
	};

	// ******************** Datapoint Selection ********************
	/**
	 * Select one or more data points, specified by datapoint objects.
	 *
	 * Datapoint object has the following structure:
	 * <pre>
	 * {
	 * 		groupId:  "groupId",		  // group ID (optional)
	 * 		index:		index,				  // index of the data in the group
	 * 		measures: ["measureId"]   // measure IDs
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "DATAPOINT"
	 *
	 * @param {array} aDataPoints an array of datapoint objects.
	 *
	 * @public
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.setSelectedDataPoints = function(aDataPoints) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oBinding = this.getBinding("data"),
			oVizFrame = this._getVizFrame();
			if (!oBinding || !oVizFrame || this.getSelectionBehavior().toUpperCase() !== "DATAPOINT") {
				return this;
			}
			oVizFrame.vizSelection([], {clearSelection: true});
			oVizFrame.vizSelection(this._buildSelectedDataPoints(oBinding, aDataPoints), {
				selectionMode: this.getSelectionMode()
			});
		}
		return this;

	};

	/**
	 * Add one or more data points to current data point selection, specified by datapoint objects.
	 *
	 * Datapoint object has the following structure:
	 * <pre>
	 * {
	 * 		groupId:  "groupId",		  // group ID (optional)
	 * 		index:		index,				  // index of the data in the group
	 * 		measures: ["measureId"]   // measure IDs
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "DATAPOINT"
	 *
	 * @param {array} aDataPoints an array of datapoint objects.
	 *
	 * @public
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.addSelectedDataPoints = function(aDataPoints) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oBinding = this.getBinding("data"),
			oVizFrame = this._getVizFrame();
			if (!oBinding || !oVizFrame || this.getSelectionBehavior().toUpperCase() !== "DATAPOINT") {
				return this;
			}
			oVizFrame.vizSelection(this._buildSelectedDataPoints(oBinding, aDataPoints), {
				selectionMode: SelectionMode.Multi
			});
		}
		return this;
	};

	/**
	 * Return a total number and an array of datapoint objects (including a Context object) of currently selected data points.
	 *
	 * Datapoint object has the following structure:
	 * <pre>
	 * {
	 * 		index:		index,		  // index of the data in the group
	 * 		measures: ["measureId"]   // measure IDs (data points created from the same Context object
	 * 														  // differing only in measure names are merged together)
	 * 		context:  [Context]		   // Context object
	 *		unit: {
	 *			measureId : ""	  // unit of measure
	 *		}
	 *		dataName: {
	 *			measureId or dimensionId : ""      // dataName of measure or dimension
	 *		}
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "DATAPOINT"
	 *
	 * @public
	 *
	 * @return {object} a total number of selected data points, and an array of datapoint objects.
	 */
	Chart.prototype.getSelectedDataPoints = function() {
		var oVizFrame = this._getVizFrame();
		if (!oVizFrame || this.getSelectionBehavior().toUpperCase() !== "DATAPOINT") {
			return {
				count: 0,
				dataPoints: []
			};
		}
		var oSemanticTuples = this._getContinuesSemanticTuples();
		var mVisibleMsrs = this._getVisibleMeasures(),
			oDataSet = this._getDataset(),
			aSelectedDataPoints = oVizFrame.vizSelection() || [], mSelectedDataPoints = {};
		for (var i = 0, len = aSelectedDataPoints.length; i < len; i++) {
			var dataPoint = aSelectedDataPoints[i],
				idx = dataPoint.data._context_row_number;
			if (!mSelectedDataPoints[idx]) {
				mSelectedDataPoints[idx] = {
					index: idx,
					measures: [],
					context: oDataSet.findContext({"_context_row_number": idx})
				};
			}
			dataPoint.measures = SelectionAPIUtils.filterVisibleMsr(dataPoint.data, mVisibleMsrs);
			if (!jQuery.isEmptyObject(oSemanticTuples)) {
				SelectionAPIUtils.filterSemMsr(oSemanticTuples, mVisibleMsrs, dataPoint);
			}
			mSelectedDataPoints[idx].measures = mSelectedDataPoints[idx].measures.concat(dataPoint.measures);
			if (dataPoint.unit) {
				mSelectedDataPoints[idx].unit = jQuery.extend(true, mSelectedDataPoints[idx].unit, dataPoint.unit);
			}
			if (dataPoint.dataName) {
				mSelectedDataPoints[idx].dataName = jQuery.extend(true, mSelectedDataPoints[idx].dataName, dataPoint.dataName);
			}
		}
		return {
			count: aSelectedDataPoints.length,
			dataPoints: Object.keys(mSelectedDataPoints).map(function(id) {
				return mSelectedDataPoints[id];
			})
		};
	};

	/**
	 * Deselect one or more data points from current data point selections, specified by datapoint objects.
	 *
	 * Datapoint object has the following structure:
	 * <pre>
	 * {
	 * 		groupId:  "groupId",		  // group ID (optional)
	 * 		index:		index,				  // index of the data in the group
	 * 		measures: ["measureId"]   // measure IDs
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "DATAPOINT"
	 *
	 * @public
	 *
	 * @param {array} aDataPoints an array of datapoint objects.
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.removeSelectedDataPoints = function(aDataPoints) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oBinding = this.getBinding("data"),
			oVizFrame = this._getVizFrame();
			if (!oVizFrame || this.getSelectionBehavior().toUpperCase() !== "DATAPOINT") {
				return this;
			}
			var aToRemove = this._buildSelectedDataPoints(oBinding, aDataPoints);
			oVizFrame.vizSelection(aToRemove, {
				deselection: true
			});
		}
		return this;
	};

	// ******************** Category Selection ********************
	/**
	 * Select one or more categories, specified by category objects.
	 *
	 * Category object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "CATEGORY"
	 *
	 * @public
	 *
	 * @param {array} aCategories an array of category objects
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.setSelectedCategories = function(aCategories) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
			if (!oVizFrame || sBehavior !== "CATEGORY") {
				return this;
			}
			oVizFrame.vizSelection([], {clearSelection: true});
			oVizFrame.vizSelection(aCategories.map(SelectionAPIUtils.toVizCSCtx), {
				selectionMode: this.getSelectionMode()
			});
		}
		return this;
	};

	/**
	 * Add one or more categories to current category selections, specified by category objects.
	 *
	 * Category object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "CATEGORY"
	 *
	 * @public
	 *
	 * @param {array} aCategories an array of category objects
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.addSelectedCategories = function(aCategories) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
			if (!oVizFrame || sBehavior !== SelectionBehavior.Category) {
				return this;
			}
			oVizFrame.vizSelection(aCategories.map(SelectionAPIUtils.toVizCSCtx), {
				selectionMode: SelectionMode.Multi
			});
		}
		return this;
	};

	/**
	 * Deselect one or more categories from current category selections, specified by category objects.
	 *
	 * Category object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "CATEGORY"
	 *
	 * @public
	 *
	 * @param {array} aCategories an array of category objects
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.removeSelectedCategories = function(aCategories) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
			if (!oVizFrame || sBehavior !== SelectionBehavior.Category) {
				return this;
			}
			oVizFrame.vizSelection(aCategories.map(SelectionAPIUtils.toVizCSCtx), {
				deselection: true
			});
		}
		return this;
	};

	/**
	 * Return category objects of currently selected categories and a total number of selected data points.
	 *
	 * Category object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Return 0 and empty list if selectionBehavior is not "CATEGORY"
	 *
	 * @public
	 *
	 * @return {object} a total number of selected data points, and an array of category objects for selected categories.
	 */
	Chart.prototype.getSelectedCategories = function() {
		var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
		if (!oVizFrame || sBehavior !== SelectionBehavior.Category) {
			return {
				count: 0,
				categories: []
			};
		} else {
			var aSelections = oVizFrame.vizSelection() || [];
			return {
				count: aSelections.length,
				categories: (aSelections.category || []).map(SelectionAPIUtils.fromVizCSCtx)
			};
		}
	};

	// ******************** Series Selection ********************
	/**
	 * Select one or more series, specified by series objects.
	 *
	 * Series object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "SERIES"
	 *
	 * @public
	 *
	 * @param {array} aSeries an array of series objects
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.setSelectedSeries = function(aSeries) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
			if (!oVizFrame || sBehavior !== SelectionBehavior.Series) {
				return this;
			}
			oVizFrame.vizSelection([], {clearSelection: true});
			var aSelectedSeries = this._getEffectiveContinuesSeries(aSeries);
			oVizFrame.vizSelection(aSelectedSeries.map(SelectionAPIUtils.toVizCSCtx), {
				selectionMode: this.getSelectionMode()
			});
		}
		return this;
	};

	/**
	 * Add one or more series to current series selections, specified by series objects.
	 *
	 * Series object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "SERIES"
	 *
	 * @public
	 *
	 * @param {array} aSeries an array of series objects
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.addSelectedSeries = function(aSeries) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
			if (!oVizFrame || sBehavior !== SelectionBehavior.Series) {
				return this;
			}
			var aSelectedSeries = this._getEffectiveContinuesSeries(aSeries);
			oVizFrame.vizSelection(aSelectedSeries.map(SelectionAPIUtils.toVizCSCtx), {
				selectionMode: SelectionMode.Multi
			});
		}
		return this;
	};

	/**
	 * Deselect one or more series from current series selections, specified by series objects.
	 *
	 * Series object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Only works when selectionBehavior is "SERIES"
	 *
	 * @public
	 *
	 * @param {array} aSeries an array of series objects
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 */
	Chart.prototype.removeSelectedSeries = function(aSeries) {
		if (this.getSelectionMode() !== SelectionMode.None) {
			var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
			if (!oVizFrame || sBehavior !== SelectionBehavior.Series) {
				return this;
			}
			var aSelectedSeries = this._getEffectiveContinuesSeries(aSeries);
			oVizFrame.vizSelection(aSelectedSeries.map(SelectionAPIUtils.toVizCSCtx), {
				deselection: true
			});
		}
		return this;
	};

	/**
	 * Return series objects of currently selected series and a total number of selected data points.
	 *
	 * Series object has the following structure:
	 * <pre>
	 * {
	 *	   measure: measureName,
	 *	   dimensions: {
	 *		   dimensionName1: dimensionValue1,
	 *		   dimensionName2: dimensionValue2,
	 *		   ...
	 *	   }
	 * }
	 * </pre>
	 *
	 * Return 0 and empty list if selectionBehavior is not "SERIES"
	 *
	 * @public
	 *
	 * @return {object} object containing a total number of selected data points,
	 * and an array of series objects for selected series.
	 *
	 */
	Chart.prototype.getSelectedSeries = function() {
		var oVizFrame = this._getVizFrame(),
			sBehavior = this.getSelectionBehavior().toUpperCase();
		if (!oVizFrame || sBehavior !== SelectionBehavior.Series) {
			return {
				count: 0,
				series: []
			};
		} else {
			var aSelections = oVizFrame.vizSelection() || [],
				aSeries = (aSelections.series || []).map(SelectionAPIUtils.fromVizCSCtx),
				aSemanticMsrs = [], semanticTuples = this._getContinuesSemanticTuples();

			aSeries = aSeries.filter(function(series){
				var accepted = true;
				if (series && series.measures) {
					var semanticTuple = semanticTuples[series.measures];
					if (semanticTuple &&  semanticTuple.semanticMsrName === series.measures) {
						aSemanticMsrs.push({
							measures : semanticTuple.actual
						});
						aSemanticMsrs.push({
							measures : semanticTuple.projected
						});
						accepted = false;
					}
				}
				return accepted;
			});
			aSeries = aSeries.concat(aSemanticMsrs);
			return {
				count: aSelections.length,
				series: aSeries
			};
		}
	};

	function getAndFilter(aFilters) {
		var aNonEmptyFilters = aFilters.filter(function(oFilter) {
			return oFilter;
		});
		if (aNonEmptyFilters.length === 0) {
			return null;
		} else if (aNonEmptyFilters.length === 1) {
			return aNonEmptyFilters[0];
		} else {
			return new Filter(aNonEmptyFilters, true);
		}
	}

	// ******** Drill down/up API ********

	/**
	 * Drill down on specific Dimension(s), only works when the property isAnalytical is true.
	 *
	 * The drill down Dimension(s) must present in the Dimension aggregation
	 * and must NOT present in previous drill down or be visible already.
	 *
	 * <b>NOTE:</b> parameter <code>oBindingInfo.length</code> during {@link sap.ui.base.ManagedObject#bindAggregation bindAggregation} of {@link #getData data} always takes effect in drill workflow.
	 *
	 * @public
	 *
	 * @param {array} vDimensions an array, or just a single instance, of either Dimension instance or Dimension name to drill down
	 */
	Chart.prototype.drillDown = function(vDimensions) {
		if (this.getIsAnalytical() === false) {
			Log.error('Data source does not support drillDown/drillUp. The method "drillDown" therefore cannot be used!');
			return;
		}
		// make sure that only dimensions are drilled down
		if (vDimensions && !(vDimensions instanceof Array)) {
			vDimensions = [vDimensions];
		}
		var aDimensions = this._normalizeDorM(vDimensions, true);

		if (aDimensions.length === 0) {
			return;
		}
		if (!this._checkDrilldownValid(aDimensions)) {
			return;
		}

		var oStackTop = this._getDrillStateTop(),
			mRedundants = this._redundantsFromSelection(),
			oSelectionFilter = this._deriveFilterFromSelection();

		var nonHierarchyFilter, hierarchyFilter, oNewFilter;
		if (oSelectionFilter) {
			nonHierarchyFilter = getAndFilter([oSelectionFilter.filters, oStackTop.nonHierarchyFilters]);
			// update hierarchy filter instead of directly combined with previous one due to backend restriction
			hierarchyFilter = oSelectionFilter.hierarchyFilters || oStackTop.hierarchyFilters;
			oNewFilter = getAndFilter([nonHierarchyFilter, hierarchyFilter]) || undefined;
		}
		var oHierarchylevel = jQuery.extend(true, {}, oStackTop.hierarchylevel);

		aDimensions.forEach(function(oDim) {
			if (oDim instanceof HierarchyDimension) {
				if (oHierarchylevel[oDim.getName()] == null) {
					oHierarchylevel[oDim.getName()] = oDim.getLevel();
				} else {
					oHierarchylevel[oDim.getName()] += 1;
				}
			}
		});

		var newStackTopDims = oStackTop.dimensions.slice().filter(function(sDim) {
			return !mRedundants[sDim];
		});
		newStackTopDims = newStackTopDims.concat(aDimensions.filter(function(oDim) {
			return newStackTopDims.indexOf(oDim.getName()) === -1;
		}).map(function(oDim) {
			return oDim.getName();
		}));

		// dimension(s) can be used for drill down
		this._drillStateStack.push({
			dimensions: newStackTopDims,
			measures:  oStackTop.measures.filter(function(sMsr) {
				return !mRedundants.measureNames[sMsr];
			}),
			filter: oNewFilter,
			hierarchylevel: oHierarchylevel,
			nonHierarchyFilters: nonHierarchyFilter,
			hierarchyFilters: hierarchyFilter,
			redundant: mRedundants
		});

		if (this._aUnavailableDims.length === 0) {
			this.fireDrillStackChanged(this.getDrillStack());
		}

		var aDimensionNames = aDimensions.map(function(oDim) {
			return oDim.getName();
		});
		this.fireDrilledDown({
			dimensions: aDimensionNames
		});
		this._invalidateBy({
			source: this,
			keys: {
				binding: true,
				vizFrame: true
			}
		});
	};

	/**
	 * Drill up to previous drill down state, only works when the property isAnalytical is true.
	 *
	 * <b>NOTE:</b> parameter <code>oBindingInfo.length</code> during {@link sap.ui.base.ManagedObject#bindAggregation bindAggregation} of {@link #getData data} always takes effect in drill workflow.
	 *
	 * @param {int} iIndex index of drill state in history to drill up. Default to the previous state in history if available.
	 *
	 * @public
	 */
	Chart.prototype.drillUp = function(iIndex) {
		if (this.getIsAnalytical() === false) {
			Log.error('Data source does not support drillDown/drillUp. The method "drillUp" therefore cannot be used!');
			return;
		}
		if (arguments.length === 0) {
			iIndex = this._drillStateStack.length - 2;
		}
		var oNewStackTop = this._drillStateStack[iIndex];
		if (oNewStackTop && iIndex != this._drillStateStack.length - 1) {
			var oPreviousState = this._drillStateStack.pop();
			this._drillStateStack.splice(iIndex + 1);
			if (this._aUnavailableDims.length === 0) {
				this.fireDrillStackChanged(this.getDrillStack());
			}
			this.fireDrilledUp({
				dimensions: oPreviousState.dimensions.filter(function(d) {
					return oNewStackTop.dimensions.indexOf(d) === -1;
				})
			});
			this._invalidateBy({
				source: this,
				keys: {
					binding: true,
					vizFrame: true
				}
			});
		}
	};

	/**
	 * Return all drill down states, only works when the property isAnalytical is true.
	 *
	 * NOTE: If {@link sap.chart.data.HierarchyDimension} is used when calling {@link #setVisibleDimensions}, drill stack could not be determined synchronously. Listen to <code>drillStackChanged</code> event instead.
	 *
	 * @return {Object[]} array of drill state objects
	 * @public
	 */
	Chart.prototype.getDrillStack = function() {
		if (this.getIsAnalytical() === false) {
			Log.error('Data source does not support drillDown/drillUp. The method "getDrillStack" therefore cannot be used!');
			return;
		}
		return jQuery.map(this._drillStateStack || [], function(oState, i) {
			return {
				dimension: oState.dimensions.slice(),
				measure: oState.measures.slice(),
				filter: oState.filter,
				hierarchylevel: jQuery.extend(true, {}, oState.hierarchylevel)
			};
		});
	};

	/**
		 * Setter for property uiConfig. uiConfig could only set via settings parameter
		 * of constructor.
		 *
		 * uiConfig from base type could config the instance. Supported uiConfig
		 * keyword: applicationSet, showErrorMessage
		 *
		 * Example:
		 *
		 * <pre>
		 * var chart = new sap.chart.Chart({
		 *  'chartType' : 'bar',
		 *  'uiConfig' : {
		 *		  'applicationSet' : 'fiori',
		 *		  'showErrorMessage' : true
		 *  }
		 * });
		 * </pre>
		 *
		 * @param {object}
		 *						oUiConfig the UI configuration
		 * @returns {this}
		 * @public
		 * @name sap.chart.Chart#setUiConfig
		 * @function
		 */
	Chart.prototype.setUiConfig = function(oUiConfig) {
		this.setProperty("uiConfig", oUiConfig);
		if (this._getVizFrame()) {
			this._getVizFrame().setUiConfig(oUiConfig);
		}
		return this;
	};

	var VizPropertiesHelper = (function() {
		var BLACKLIST = [
			"interaction.selectability.mode",		// via setSelectionMode API
			"interaction.selectability.behavior"	// via setSelectionBehavior API
		];

		function deleteProp(obj, propPath) {
			var target = obj,
				vals;
			vals = propPath.reduce(function(entries, prop) {
				if (target.hasOwnProperty(prop)) {
					entries.push({parent: target, val: target[prop], key:prop});
					target = target[prop];
				}
				return entries;
			}, []);
			if (vals.length !== propPath.length) {
				return;
			}
			var entry = vals.pop();
			delete entry.parent[entry.key];
			while (vals.length > 0) {
				entry = vals.pop();
				if (Object.keys(entry.val).length > 0) {
					return;
				} else {
					delete entry.parent[entry.key];
				}
			}
		}

		function sanitize(oVizProperties, type) {
			var oResult = jQuery.extend(true, {}, oVizProperties);
			BLACKLIST.forEach(function(prop) {
				delete oResult[prop];
				deleteProp(oResult, prop.split("."));
			});
			return oResult;
		}
		return {
			sanitize: sanitize,
			modify: function(oProps, sKey, fnReplace) {
				var aPath = sKey.split("."),
					oNode = oProps;
				while (aPath.length > 1 && oNode.hasOwnProperty(aPath[0])) {
					oNode = oNode[aPath.shift()];
				}
				var sProp = aPath[0];
				if (aPath.length === 1 && oNode.hasOwnProperty(sProp)) {
					oNode[sProp] = fnReplace(oNode[sProp]);
				}
			}
		};
	})();

	/**
	 * Change Chart's properties.
	 *
	 * Chart's properties will be updated with the parameter.
	 *
	 * Refer to chart property <a href="docs/vizdocs/index.html" target="_blank">documentation</a> for more details.
	 *
	 * @param {object}
	 *			  oVizProperties object containing vizProperty values to update
	 * @returns {this}
	 * @public
	 */
	Chart.prototype.setVizProperties = function(oVizProperties) {
		oVizProperties = VizPropertiesHelper.sanitize(oVizProperties);
		var _mergeProperties = function(destination, source) {
			for (var sourceKey in source) {
				var sourceVal = source[sourceKey];
				if (sourceVal !== undefined) {
					if (!jQuery.isPlainObject(sourceVal)) {
						destination[sourceKey] = sourceVal;
					} else {
						var destVal = destination[sourceKey];
						if (!destVal || !jQuery.isPlainObject(destVal)) {
							destVal = destination[sourceKey] = {};
						}
						_mergeProperties(destVal, sourceVal);
					}
				}
			}
		};

		var mergeProperties = function(destination, source) {
			destination = destination || {};
			_mergeProperties(destination, oVizProperties);
			return destination;
		};

		oVizProperties = mergeProperties(jQuery.extend(true, { 'title' : {'visible' : false}}, this.getProperty("vizProperties")), oVizProperties);
		this.setProperty("vizProperties", oVizProperties);
		if (oVizProperties.plotArea && oVizProperties.plotArea.dataPointStyle) {
			this._bDataPointStyleSetByUser = true;
			this._invalidateBy({
				source: this,
				keys: {
					// update vizFrame since feeding depends on semantic rules in coloring case
					vizFrame: true,
					loopData: true
				}
			});
		}

		if (oVizProperties.legend && oVizProperties.legend.title) {
			this._bLegendSetByUser = true;
		}

		// always call setVizProperties of vizframe to cache properties when initialization
		// currently there is no implementation to operate cached property(e.g. modify dataPointStyle's displayName)
		// in this case we respect user's original input
		if (this._getVizFrame()) {
			this._getVizFrame().setVizProperties(this._getEffectiveProperties());
		}

		return this;
	};

	/**
	 * Return Chart's properties.
	 *
	 * Refer to chart property <a href="docs/vizdocs/index.html" target="_blank">documentation</a> for more details.
	 *
	 * @returns {object} the Chart properties object
	 * @public
	 */
	Chart.prototype.getVizProperties = function() {
		var oVizFrame = this._getVizFrame();
		var oVizProps = VizPropertiesHelper.sanitize(oVizFrame ? oVizFrame.getVizProperties() : this.getProperty("vizProperties"));

		function stripUnit(oFmtStr) {
			var oFormatter = sap.viz.api.env.Format.numericFormatter();
			if (!oFormatter || typeof oFormatter.stripUnit !== "function") {
				return oFmtStr;
			}

			if (typeof oFmtStr === "string" || oFmtStr instanceof String) {
				return oFormatter.stripUnit(oFmtStr);
			} else if (oFmtStr && typeof oFmtStr === "object") {
				jQuery.each(oFmtStr, function(k, v){
					oFmtStr[k] = oFormatter.stripUnit(v);
				});
				return oFmtStr;
			} else {
				return oFmtStr;
			}
		}

		VizPropertiesHelper.modify(oVizProps, "plotArea.dataLabel.formatString", stripUnit);
		VizPropertiesHelper.modify(oVizProps, "tooltip.formatString", stripUnit);

		return oVizProps;
	};

	/**
	 * Change Chart's scales.
	 *
	 * Chart's scales will be updated with the parameters.
	 *
	 * Refer to chart property <a href="docs/vizdocs/index.html" target="_blank">documentation</a> for more details.
	 *
	 * @param {object[]}
	 *			  oVizScales array of vizScale objects
	 * @returns {this}
	 * @public
	 */
	Chart.prototype.setVizScales = function(oVizScales) {
		this.setProperty("vizScales", oVizScales);
		this._aVizValueScales = oVizScales.filter(function(oVizScale) {
			return oVizScale.feed === "valueAxis" ||
				oVizScale.feed === "valueAxis2" ||
				oVizScale.feed === "actualValues";
		});
		if (this._aVizValueScales && this._aVizValueScales.length > 0) {
			this._bEnbableValueAxisScale = false;
		}
		if (this._getVizFrame()) {
			this._getVizFrame().setVizScales(oVizScales);
		}
		return this;
	};

	/**
	 * Return Chart's scales.
	 *
	 * Refer to chart property <a href="docs/vizdocs/index.html" target="_blank">documentation</a> for more details.
	 *
	 * @returns {object[]} an array of scale objects
	 * @public
	 */
	Chart.prototype.getVizScales = function() {
		var oVizFrame = this._getVizFrame();
		return oVizFrame ? oVizFrame.getVizScales() : this.getProperty("vizScales");

	};

	// ******** Delegations of VizFrame API ********
	/**
	 * Get the UID for Chart. It supports other controls to connect to a viz instance.
	 *
	 * @return {string} Chart UID
	 * @public
	 */
	Chart.prototype.getVizUid = function() {
		return this._getVizFrame().getVizUid();
	};

	/**
	 * Zoom the chart plot.
	 *
	 * Example:
	 * <pre>
	 *	var oChart = new sap.chart.Chart(...);
	 *	oChart.zoom({direction: "in"});
	 * </pre>
	 *
	 * @param {object} oConfig
	 *			  contains a "direction" attribute with value "in" or "out" indicating zoom to enlarge or shrink respectively
	 * @public
	 */
	Chart.prototype.zoom = function(oConfig) {
		this._getVizFrame().zoom(oConfig);
	};

	// ******** Delegations of VizFrame events ********
	var DELEGATED_EVENTS = ["selectData", "deselectData"];
	Chart.prototype._delegateEvents = function() {
		if (this._delegateEventHandlers) {
			return;
		}
		var oVizFrame = this._getVizFrame();
		this._delegateEventHandlers = DELEGATED_EVENTS.map(function(sEvent) {
			var sName = sEvent.charAt(0).toUpperCase() + sEvent.slice(1);
			var handler = function(oEvent) {
				var oParameters = oEvent.getParameters();
				this._buildSelectEventData(oParameters.data);
				delete oParameters.id;
				this.fireEvent(sEvent, oParameters);
			};
			handler = handler.bind(this);

			oVizFrame["attach" + sName](null, handler);
			return {
				name: sName,
				handler: handler
			};
		}, this);

		this._vizFrameRenderCompleteHandler = vizFrameRenderCompleteHandler.bind(this);
		oVizFrame.attachRenderComplete(null, this._vizFrameRenderCompleteHandler);
		oVizFrame.attachEvent("_selectionDetails", vizFrameSelectionDetailsHandler.bind(this));
	};

	/**
	 * @private
	 */
	Chart.getChartTypes = chartLibrary.api.getChartTypes;

	/**
	 * Returns available and unavailable chart types with current Dimensions and Measures.
	 * An error info will be returned along with each unavailable chart types.
	 *
	 * <pre>
	 * {
	 *		 available: [{
	 *				 chart: "chartType"
	 *		 }, ...],
	 *		 unavailable: [{
	 *				 chart: "chartType"
	 *				 error: {
	 *						 missing: {
	 *								 Dimension: n,
	 *								 Measure: n,
	 *								 DateTimeDimension: n
	 *						 }
	 *				 }
	 *		 }, ...]
	 * }
	 * </pre>
	 *
	 * @public
	 *
	 * @returns {object} chart types and errors for unavailable chart types, grouped by availability
	 */
	Chart.prototype.getAvailableChartTypes = function () {
		var aDims = this._getVisibleDimensions(true),
			aMsrs = this._getVisibleMeasures(true);
		return ChartUtils.CONFIG.chartTypes.reduce(function(oResult, sChartType) {
			var oCompatibility = RoleFitter.compatible(sChartType, aDims, aMsrs);
			if (oCompatibility.compatible) {
				oResult.available.push({chart: sChartType});
			} else {
				var oMissing = {};
				if (oCompatibility.error.missing.dim) {
					oMissing.Dimension = oCompatibility.error.missing.dim;
				}
				if (oCompatibility.error.missing.time) {
					oMissing.DateTimeDimension = oCompatibility.error.missing.time;
				}
				if (oCompatibility.error.missing.msr) {
					oMissing.Measure = oCompatibility.error.missing.msr;
				}
				oResult.unavailable.push({
					chart: sChartType,
					error: oMissing
				});
			}
			return oResult;
		}, {
			available: [],
			unavailable: []
		});
	};

	Chart.prototype._getDynamicScaleProp =  function(){
		return {
			general : {
				enableScalingFactor: this.getEnableScalingFactor()
			}
		};
	};

	Chart.prototype._getEffectiveProperties = function() {
		var oVizProperties = {};
		if (this._bNeedToApplyDefaultProperties) {
			oVizProperties = jQuery.extend(true, oVizProperties, this._getDefaultVizProperties());
			this._bNeedToApplyDefaultProperties = false;
		}

		var chartType = this.getChartType();

		oVizProperties = jQuery.extend(true, oVizProperties,
			this._get100DonutProperty(chartType),
			this._oSemanticVizSettings.properties || {},
			this.getProperty("vizProperties"),
			this._getHostedVizProperties(),
			this._getPagingVizProperties(),
			this._getTimeProperties(),
			this._getValueAxisScaleSetting().property || {},
			this._getDynamicScaleProp(),
			MeasureSemanticsUtils.getSemanticSettingsForCombination(
				this._semanticTuples, chartType));

		return oVizProperties;
	};

	Chart.prototype._get100DonutProperty = function (chartType) {
		return {
			'tooltip' : {
				'bodyMeasureValue' : {
					'type' : (chartType.indexOf("100_") === 0) ? 'percentage' : 'value'
				}
			}
		};
	};

	Chart.prototype._reset100DonutChartType = function(chartType){
		return chartType.indexOf('donut') > -1 ? 'donut' : chartType;
	};

	Chart.prototype._setEffectiveScales = function() {
		/* Priority order:
		* 1. valueAxisScales > vizValueScales.
		* 2. vizColorScales > _oSemanticScales(_oSemanticScales will be empty if vizColorScales is not set).
		* So effectiveScales is consist of valueAxisScales, vizScales(including vizValueScales and vizColorScales), and semanticScales.
		*/
		var oVizFrame = this._getVizFrame(),
			oVizScales = this.getProperty('vizScales'),
			oValueAxisScaleSetting = this._getValueAxisScaleSetting(),
			vizColorScale = (oVizScales || []).filter(function(oScale){
				return oScale.feed === 'color';
			});
		var effecttiveScales = CommonUtil.extendScales(oVizScales, oValueAxisScaleSetting.scale || [], this._oSemanticVizSettings.scales || []);
		if (this._oSemanticVizSettings.replaceColorScales && vizColorScale.length === 0) {
			//Clear color scale if there isn't any color scales setting.
			oVizFrame.setVizScales(effecttiveScales, {replace: true});
		} else {
			oVizFrame.setVizScales(effecttiveScales);
		}
	};

	Chart.prototype._usingDisplayNameForSemantics = function(oVizProperties) {
		//check whether the parameter is undefined or null
		var isExist = function(o) {
			if ((typeof (o) === 'undefined') || (o === null)) {
				return false;
			}
			return true;
		};

		if (oVizProperties.plotArea && oVizProperties.plotArea.dataPointStyle && oVizProperties.plotArea.dataPointStyle.rules) {

			/*
			If semantic rules meet the following 4 conditions:
			(1) aRules[i].displayName === undefined : displayName isn’t defined
			(2) akeys.length === 1 : Only one semantic rules condition;
			(3) oDataContext[key].hasOwnProperty("equal") == true : use ‘equal’ label;
			(4) aVisibleDimensions.indexOf(key) !== -1 : the condition is for dimension;
			Then if the value of 'equal' is equal to some value in oBindingData, when meet the any of the following 2 conditions:
			(1) this.getDimensionByName(key).getTextProperty() === undefined
			(2) this.getDimensionByName(key).getDisplayText() === false
			set the corresponding value of 'equal' to the the rule's displayName. otherwise, set the displayText to the rule's displayName.
			Otherwise show the default "Semantic Range1".
			*/

			//currently, there are only two types of binding
			var aContexts = this._getContexts();
			if (aContexts.length > 0 && !aContexts.hasOwnProperty("dataRequested")) {
				var aVisibleDimensions = this.getVisibleDimensions(),
					aRules = oVizProperties.plotArea.dataPointStyle.rules;
				for (var i = 0; i < aRules.length; i++) {
					var oDataContext = aRules[i].dataContext;
					if (oDataContext && oDataContext.length !== 0) {
						var akeys = Object.keys(oDataContext);
						if ( !isExist(aRules[i].displayName) && akeys.length === 1) {
							var key = akeys[0];
							if (oDataContext[key].hasOwnProperty("equal") && aVisibleDimensions.indexOf(key) !== -1) {
								var sTextProperty = this.getDimensionByName(key).getTextProperty();
								for (var j = 0; j < aContexts.length; j++) {
									if (aContexts[j].getProperty(key) === oDataContext[key].equal) {
										var sDisplayName = aContexts[j].getProperty(sTextProperty);
										if (!isExist(sTextProperty) || !isExist(sDisplayName) || typeof (sDisplayName) === "object" || this.getDimensionByName(key).getDisplayText() === false) {
											aRules[i].displayName = oDataContext[key].equal;
											break;
										} else {
											aRules[i].displayName = sDisplayName;
											break;
										}
									}
								}
							}
						}
					}
				}
			}
		}
	};

	Chart.prototype._getCandidateColoringSetting = function() {
		if (!this._bColoringParsed && this._semanticTuples) {
			// this method could be called when data responses but chart UI is not shown(tuples are not generated because render is not processed)
			// so make this._semanticTuples as a dependency for calculating coloring settings here
			if (this._enableSemanticColoring()) {
				this._bColoringParsed = true;
				this._oCandidateColoringSetting = {};
				var oDimMsr = {},
				oColoring = this.getColorings(),
				oActiveColoring = this.getActiveColoring();
				oDimMsr.aMsr = this._normalizeDorM(this.getVisibleMeasures());

				var oStackTop = this._getDrillStateTop();
				var aRedundantDims = [], aVisibleDims;
				if (oStackTop.redundant) {
				// consider redundant dimensions as visible dim when matching ConstantThresholds.AggregationLevels.VisibleDimensions
				var aRedundantDims = Object.keys(oStackTop.redundant).filter(function(key) {
					return key !== 'measureNames';
				});
				}
				aVisibleDims = this._normalizeDorM(this.getVisibleDimensions().concat(aRedundantDims), true);
				oDimMsr.aDim = aVisibleDims;

				oDimMsr.aInResultDim = this._normalizeDorM(this.getInResultDimensions(), true);
				oDimMsr.allMsr = this.getMeasures().map(function(oMsr){
					return oMsr.getName();
				});
				oDimMsr.allDim = this.getDimensions().map(function(oDim){
					return oDim.getName();
				});

				if (oColoring) {
					try {
						const oBundle = Library.getResourceBundleFor("sap.chart");
						var options = {
							bFiltered: this._bFilterCalledByCustomer
						};
						this._oCandidateColoringSetting = Colorings.getCandidateSetting(oColoring, oActiveColoring, this._semanticTuples, oDimMsr, this._oColoringStatus || {}, this._sAdapteredChartType || this.getChartType(), oBundle, options);
						//use original chartType here since adapted chartType is not ready in some workflow
					} catch (e) {
						if (e instanceof ChartLog) {
							e.display();
						} else {
							throw e;
						}
					}
				}
			} else {
				this._oCandidateColoringSetting = {};
			}

		}
		return this._oCandidateColoringSetting;
	};


	// ---------------- Hosted VizProperties ----------------
	Chart.prototype._hostedVizProperties = {
		selectionMode: {prop: "interaction.selectability.mode"},
		selectionBehavior: {prop: "interaction.selectability.behavior"}
	};

	Chart.prototype._getHostedVizProperties = function() {
		return Object.keys(this._hostedVizProperties).reduce(function(obj, prop) {
			var oSubProp = this._hostedVizProperties[prop].prop.split(".").reverse().reduce(function(obj, path) {
				var result = {};
				result[path] = obj;
				return result;
			}, this.getProperty(prop));
			return jQuery.extend(true, obj, oSubProp);
		}.bind(this), {});

	};

	Chart.prototype._getDefaultVizProperties = function() {
		// Use UI5 formatter by default in analytic chart
		var type = (this._sAdapteredChartType || this.getChartType());
		var bIsPercentage = (type.indexOf("100_") === 0);
		var bIsPie = (type === "pie" || type.indexOf("donut") > -1);

		//Switch 100_donut to donut, because there is no 100_donut in CVOM chart.
		type = 'info/' + this._reset100DonutChartType(type);

		var oDefaults = {
			interaction: {
				extraEventInfo: true
			}
		};

		return jQuery.extend(true, oDefaults,
							 applyDefaultFormatString({}, type,
													  ["valueAxis.label.formatString", "valueAxis2.label.formatString"],
													  bIsPercentage ? '' : ChartFormatter.DefaultPattern.SHORTFLOAT),
							 applyDefaultFormatString({}, type,
													  ["legend.formatString", "sizeLegend.formatString"],
													  ChartFormatter.DefaultPattern.SHORTFLOAT_MFD2),
							 applyDefaultFormatString({}, type,
													  ["plotArea.dataLabel.formatString"],
								 bIsPie ? '' : ChartFormatter.DefaultPattern.SHORTFLOAT_MFD2),
							 applyDefaultFormatString({}, type,
													  ["tooltip.formatString"],
													  bIsPercentage ? '' : ChartFormatter.DefaultPattern.STANDARDFLOAT));

		function setPropertiesValue(properties, path, value) {
			if (path.length === 0) {
				return value;
			}
			properties = properties || {};
			var p = properties[path[0]];
			properties[path[0]] = setPropertiesValue(p, path.slice(1), value);
			return properties;
		}

		function getPropertiesDefinition(propDef, path) {
			if (propDef == null || path.length === 0) {
				return propDef;
			}
			var e = propDef[path[0]];
			if (e && e.children) {
				return getPropertiesDefinition(e.children, path.slice(1));
			}
			return e;
		}

		function applyDefaultFormatString(properties, chartType, formatStringPaths, formatString) {
			var metadata = sap.viz.api.metadata.Viz.get(chartType);
			if (metadata) {
				var propDef = metadata.properties;
				formatStringPaths.forEach(function(path) {
					path = path.split(".");
					var p = getPropertiesDefinition(propDef, path);
					if (p && p.hasOwnProperty("defaultValue")) {
						setPropertiesValue(properties, path, formatString);
					}
				});
			}
			return properties;
		}
	};

	Chart.prototype._getPagingVizProperties = function() {
		if (this._isEnablePaging()) {
			var oPagingProperties = {
				interaction: {
					zoom: {
						enablement: false
					},
					selectability: {
						mode: "NONE"
					}
				},
				plotArea: {
					isFixedDataPointSize: true
				}
			};
			return oPagingProperties;
		} else {
			return {};
		}
	};

	Chart.prototype._getTimeProperties = function() {
		var aTimeLevels = ["year", "month", "day"]; //default value
		var oFiscalYearPeriodCount = null;  //default value
		var that = this;
		var sTimeDim = this.getVisibleDimensions().filter(function(sDim) {
			var oDim = that.getDimensionByName(sDim);
			return (oDim instanceof TimeDimension && oDim._getFixedRole() === "category");
		})[0];

		var sweekConfig = "ISO";
		var iMinDays, iFirstDayOfWeek, region;

		if (sTimeDim) {
			var oTimeDim = this.getDimensionByName(sTimeDim);
			switch (oTimeDim.getTimeUnit()) {
				case TimeUnitType.yearmonthday:
					aTimeLevels = ["year", "month", "day"];
					break;
				case TimeUnitType.yearquarter:
					aTimeLevels = ["year", "quarter"];
					break;
				case TimeUnitType.yearmonth:
					aTimeLevels = ["year", "month"];
					break;
				case TimeUnitType.yearweek:
					aTimeLevels = ["year", "week"];

					var oLanguageTag = Formatting.getLanguageTag(),
						oLocaleData = LocaleData.getInstance(oLanguageTag),
						region = oLanguageTag.region;

					iMinDays = oLocaleData.getMinimalDaysInFirstWeek();
					iFirstDayOfWeek = oLocaleData.getFirstDayOfWeek();
					iFirstDayOfWeek = iFirstDayOfWeek === 0 ? 7 : iFirstDayOfWeek;  //info uses 7 for Sunday
					sweekConfig = "Gregorian";
					break;
				case TimeUnitType.fiscalyear:
					aTimeLevels = ["fiscal_year"];
					break;
				case TimeUnitType.fiscalyearperiod:
					aTimeLevels = ["fiscal_period", "fiscal_year"];
					break;
				default:
			}

			oFiscalYearPeriodCount = oTimeDim.getFiscalYearPeriodCount();
		}

		var oProps = this.getProperty("vizProperties");
		if (oProps && oProps.timeAxis) {
			// user properties have higher priority
			var timeAxis = oProps.timeAxis;
			if (timeAxis.levels) {
				aTimeLevels = timeAxis.levels;
			}
			if (timeAxis.fiscal && timeAxis.fiscal.periodNumbers) {
				oFiscalYearPeriodCount = timeAxis.fiscal.periodNumbers;
			}
		}

		return {
			"timeAxis": {
				"levels": aTimeLevels,
				"fiscal": {
					"periodNumbers": oFiscalYearPeriodCount
				},
				"levelConfig" : {
					"week" : {
						"type" : sweekConfig,
						"minDays" : iMinDays,
						"firstDayOfWeek" : iFirstDayOfWeek,
						"region" : region
					}
				}
			}
		};
	};

	Chart.prototype.setSelectionMode = function (oValue) {
		this.setProperty("selectionMode", oValue);
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			oVizFrame.setVizProperties({interaction: {selectability: {mode: oValue}}});
		}
		return this;
	};

	Chart.prototype.getSelectionMode = function () {
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			return oVizFrame.getVizProperties().interaction.selectability.mode;
		} else {
			return this.getProperty("selectionMode");
		}
	};

	Chart.prototype.setSelectionBehavior = function(oValue){
		this.setProperty("selectionBehavior", oValue);
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			oVizFrame.setVizProperties({interaction: {selectability: {behavior: oValue}}});
		}
		return this;
	};


	Chart.prototype.setEnableScalingFactor = function(value){
		this.setProperty("enableScalingFactor", value);
		this._invalidateBy({
			source: this,
			keys: {
				vizFrame: true
			}
		});
		return this;
	};

	/**
	 * return the scaling factor. Or return null when scaling factor is disable.
	 *
	 * @public
	 *
	 * @return {object} A scaling factor object or null
	 */
	Chart.prototype.getScalingFactor = function(){
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			var temp = oVizFrame._states()["dynamicScale"];
			if (temp) {
				var result = null;
				var keys = ["primaryValues", "secondaryValues"];
				var axes = [temp.valueAxis, temp.valueAxis2];
				for (var ii = 0; ii < keys.length; ii++) {
					var scaleFactor = axes[ii];
					if (scaleFactor && (scaleFactor.symbol || scaleFactor.unit)) {
						result = result || {};
						var key = keys[ii];
						result[key] = {
							scalingFactor: scaleFactor.symbol
						};

						if (scaleFactor.unit) {
							result[key]["unit"] = scaleFactor.unit;
						}
					}
				}
				return result;
			}
		}
		return null;
	};

	Chart.prototype.getSelectionBehavior = function () {
		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			return oVizFrame.getVizProperties().interaction.selectability.behavior;
		} else {
			return this.getProperty("selectionBehavior");
		}
	};

	// ---------------- Public Helpers ----------------
	/**
	 * Return Dimension with the given name.
	 *
	 * @param {string} sName name of the Dimension to get
	 * @public
	 * @return {sap.chart.data.Dimension} Dimension of the specified name.
	 */
	Chart.prototype.getDimensionByName = function(sName) {
		return this.getDimensions().filter(function(d) {return d.getName() === sName;})[0];
	};
	/**
	 * Return Measure with the given name.
	 *
	 * @param {string} sName name of the Measure to get
	 * @public
	 * @return {sap.chart.data.Measure} Measure of the specified name.
	 */
	Chart.prototype.getMeasureByName = function(sName) {
		return this.getMeasures().filter(function(m) {return m.getName() === sName;})[0];
	};
	/**
	 * Return all TimeDimensions from current Dimensions.
	 *
	 * @public
	 * @return {array} Dimensions which are instance of TimeDimension.
	 */
	Chart.prototype.getTimeDimensions = function() {
		return this.getDimensions().filter(function(d) {return d instanceof TimeDimension;});
	};

	Chart.prototype._isEnablePaging = function() {
		this._bMobile = (Device.system.tablet && !Device.system.desktop) || Device.system.phone;
		var model = this.getModel();
		var JSONModel = sap.ui.require("sap/ui/model/json/JSONModel");
		var ret = !(JSONModel && model instanceof JSONModel) &&
			this.getEnablePagination() && this._bIsPagingChartType && !this._bMobile;
		return ret;
	};

	function vizFrameRenderCompleteHandler(oEvent) {
		var oParameters = oEvent.getParameters();
		delete oParameters.id;

		if (this._isEnablePaging()) {
			this._getPagingController().vizFrameRenderCompleted();
		}

		this.fireEvent("renderComplete", oParameters);
	}

	function vizFrameZoomDetectedHandler(oEvent) {
		var oParameters = oEvent.getParameters();
		delete oParameters.id;
		this.fireEvent("_zoomDetected", oParameters);
	}

	function vizFrameSelectionDetailsHandler(oEvent) {
		var oParameters = oEvent.getParameters();
		delete oParameters.id;
		var oDataSet = this._getDataset();
		oParameters.data.forEach(function(data){
			data.context = oDataSet.findContext({
				"_context_row_number": data.data._context_row_number
			});
		});
		this.fireEvent("_selectionDetails", oParameters);
	}


	/*
	 * TODO: Comment this function later
	 * debug function to draw page scale on scroll bar
	 */
//		Chart.prototype._drawPageScale = function() {
//			var dataLength = this._iTotalSize;
//			var pageLength = this._iPageSize;
//				var thumb = $(".v-m-scrollbarThumb")[0].getBoundingClientRect();
//				var track = $(".v-m-scrollbarTrack")[0].getBoundingClientRect();
//
//				for (var i = 0; i * pageLength < dataLength; ++i) {
//						var line = $("<line>");
//						$("body").append(line);
//						line.css({
//								position: "absolute",
//								"background-color": "red",
//								width: 1,
//								height: thumb.height,
//								left: thumb.right + i * pageLength / dataLength * (track.width - thumb.width),
//								top: thumb.top
//						});
//				}
//		};

	Chart.prototype._showLoading = function(bLoading) {
		var $this = this.$();
		if (!$this) {
			return;
		}

		if (!bLoading) {
			if (this._$loadingIndicator) {
				this._$loadingIndicator.remove();
			}
		} else {
			if (!this._$loadingIndicator) {
				this._$loadingIndicator = this._createLoadingIndicator();
			}
			this._updateLoadingIndicator();
			$this.append(this._$loadingIndicator);
		}
		this._bLoading = bLoading;
	};

	Chart.prototype._createLoadingIndicator = function() {
		var $indicator = jQuery(BusyIndicatorUtils.getElement());
		var $text = jQuery("<p>").attr("class", "loading-text").text("Loading");
		$text.css({
			"position": "absolute",
			"transform": "translateY(-3em)",
			"width": "100%",
			"text-align": "center"
		});
		$text.insertBefore($indicator.children()[0]);
		$indicator.css({opacity: 1});
		return $indicator;
	};

	Chart.prototype._updateLoadingIndicator = function() {
		var $this = this.$();
		if (!$this || !this._$loadingIndicator) {
			return;
		}
		var sChartType = this._sAdapteredChartType,
			bHorizontal = sChartType === "bar" || sChartType.indexOf("horizontal") !== -1;
		var $plot = $this.find(".v-plot-bound"),

			oThisOffset = $this.offset(),
			oPosition = {
				top: oThisOffset.top,
				left: oThisOffset.left,
				width: $this.width(),
				height: $this.height()
			};

		if ($plot.length) {
			var oPlotOffset = $plot.offset(),
				oPlotBound = $plot[0].getBoundingClientRect(); // jQuery returns 0 for width/height of this element somehow
			oPosition.top = oPlotOffset.top - 1;
			oPosition.left = oPlotOffset.left;

			oPosition.width = oPlotBound.width + 1;
			if (bHorizontal) {
				oPosition.height = Math.ceil(oPlotBound.height + 1);
			} else {
				oPosition.height = Math.floor(oPlotBound.height + 1);
			}
		}
		this._$loadingIndicator.css(oPosition);

		var $text = this._$loadingIndicator.find(".loading-text");
		//var $next = $text.next();
		$text.css({
			"top": oPosition.height / 2,
			"font-weight": ThemeParameters.get({name: ["sapUiChartTitleFontWeight"], callback: function() {}}),
			"font-size": ThemeParameters.get({name: ["sapUiChartMainTitleFontSize"], callback: function() {}}),
			"color": ThemeParameters.get({name: ["sapUiChartMainTitleFontSize"], callback: function() {}})
		});

		this._$loadingIndicator.css({
			"background-color": ThemeParameters.get({name: ["sapUiExtraLightBG"], callback: function() {}})
		});
	};

	Chart.prototype._getRequiredDimensions = function() {
		var aVisDims = this._getVisibleDimensions(),
			aInResultDims = this.getInResultDimensions();
		return this._normalizeDorM(aVisDims.concat(aInResultDims), true);
	};

	Chart.prototype._getRequiredMeasures = function() {
		return this._getVisibleMeasures(true);
	};

	/**
	 * Export the current chart as SVG String.
	 * The chart is ready to be exported to SVG ONLY after the initialization is finished.
	 * Any attempt to export to SVG before that will result in an empty SVG string.
	 * @public
	 * @param {Object} [option]
	 * <pre>
	 * {
	 *     width: Number - the exported svg will be scaled to the specific width.
	 *     height: Number - the exported svg will be scaled to the specific height.
	 *     hideTitleLegend: Boolean - flag to indicate if the exported SVG includes the original title and legend.
	 *     hideAxis: Boolean - flag to indicate if the exported SVG includes the original axis.
	 * }
	 * </pre>
	 * @return {string} the SVG string of the current viz or empty svg if error occurs.
	 */
	Chart.prototype.exportToSVGString = function(option) {
		var sSVGString = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\"/>",
			oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			sSVGString = oVizFrame.exportToSVGString(option);
		}
		return sSVGString;
	};

	Chart.prototype._getPagingController = function(){
		if (!this._pagingController){
			this._pagingController = new PagingController(this);
		}

		return this._pagingController;
	};

	return Chart;
});
