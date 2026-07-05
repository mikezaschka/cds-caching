/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.core.BaseChart.
sap.ui.define([
	'sap/ui/core/Control',
	'sap/ui/core/ResizeHandler',
	'sap/ui/core/theming/Parameters',
	'sap/viz/library',
	'sap/viz/libs/sap-viz',
	'./BaseStructuredType',
	'./BaseChartMetadata',
	"sap/ui/thirdparty/jquery",
	"sap/base/util/each",
	'./BaseChartRenderer',
	'jquery.sap.sjax' // provides jquery.sap.syncGetText
], function(
  Control,
  ResizeHandler,
  Parameters,
  library,
  sapviz,
  BaseStructuredType,
  BaseChartMetadata,
  jQuery,
  each
) {
	"use strict";

	/**
	 * Constructor for a new ui5/core/BaseChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * An abstract base class for all VIZ charts
	 * @extends sap.ui.core.Control
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely
	 * @name sap.viz.ui5.core.BaseChart
	 */
	var BaseChart = Control.extend("sap.viz.ui5.core.BaseChart", /** @lends sap.viz.ui5.core.BaseChart.prototype */ { metadata : {

		"abstract" : true,
		library : "sap.viz",
		properties : {

			/**
			 * Width of the Chart as a CSS size.
			 */
			width : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '640px'},

			/**
			 * Height of the Chart as a CSS size.
			 */
			height : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '480px'},

			/**
			 * CSS style of Chart.
			 */
			css : {type : "string", group : "Appearance", defaultValue : null}
		},
		aggregations : {

			/**
			 * Dataset for this chart
			 */
			dataset : {type : "sap.viz.ui5.data.Dataset", multiple : false},

			/**
			 * Control tree to display when there is no data available
			 */
			noData : {type : "sap.ui.core.Control", multiple : false}
		},
		events : {

			/**
			 * Fired before a new VIZ instance is created. Event parameter "usrOptions" contains the intended value for the parameter with the same name of the createViz call.
			 */
			beforeCreateViz : {
				parameters : {

					/**
					 * Value for the parameter with the same name of the createViz call.
					 */
					usrOptions : {type : "object"}
				}
			}
		}
	}}, BaseChartMetadata);

	BaseChart.prototype.getVIZChartType = function() {
		return this.getMetadata().getVIZChartType();
	};

	BaseChart.prototype._getSapVizCSS = function() {
	  //@Alex Su: To be compatible with the less mode, the way is to load a css file by an ajax request and use less.Parser to parse it on fly.
	  var sCSSText,sCSSUrl,sCSSContent;
	  var oLink = window.document.getElementById("sap-ui-theme-sap.viz");
	  if ( oLink ) {
	    sCSSUrl = oLink.href;
	    //TODO: global jquery call found
		sCSSText = jQuery.sap.syncGetText(sCSSUrl + "?", undefined, undefined);
	    if (!sCSSText){
	      sCSSText = "";
	    }
	  }
	  if (this.getCss()){
	    sCSSContent = sCSSText + this.getCss();
	  }
	  return sCSSContent;
	};

	BaseChart.prototype._getMergedChartOptions = function (){
	  var usrOptions = this._getOptions();
	  //work around for axis line and grid line, will be removed in next push
	  var gridlineColor = Parameters.get('sapVizChartAxisGridlineColor');
	  var axislineColor = Parameters.get('sapVizChartAxisColor');
	  var cssOptions = {
	      xAxis:{
	        gridline:{
	          color:gridlineColor
	        }
	      },
	      yAxis:{
	        gridline:{
	          color:gridlineColor
	        }
	      }
	  };
	  var chartType = this.getVIZChartType();
	  switch (chartType){
	  case "viz/dual_bar":
	    cssOptions.yAxis.color = axislineColor;
	    break;
	  case "viz/dual_combination":
	  case "viz/dual_line":
	  case "viz/dual_stacked_column":
	  case "viz/100_dual_stacked_column":
	  case "viz/dual_column":
	    cssOptions.xAxis.color = axislineColor;
	    break;
	  default:
	    cssOptions.xAxis.color = axislineColor;
	    cssOptions.yAxis.color = axislineColor;
	    break;
	  }
	  return jQuery.extend(true, cssOptions, usrOptions);
	};

	BaseChart.prototype._unregisterListener = function (){
	  if ( this._sResizeListenerId ) {
	    ResizeHandler.deregister(this._sResizeListenerId);
	    delete this._sResizeListenerId;
	  }
	};

	BaseChart.prototype._registerListener = function (){
	  this._sResizeListenerId = ResizeHandler.register(this.getDomRef(), jQuery.proxy(this.onresize, this) );
	};

	BaseChart.prototype._renderChart = function (){
	  //TODO How to define feeding API?
	  if ( !sap.viz.__svg_support || !this.getDataset() || !this.getDataset().getVIZDataset() ) {
	    return;
	  }

	  // properly clean up an existing VIZ instance
	  if ( this._oVIZInstance ) {
	    this._oVIZInstance.destroy();
	    delete this._oVIZInstance;
	  }

	  var cssSettings = this._getSapVizCSS();

	  var chartOptions = this._getMergedChartOptions();

	  // collect the options for the new VIZ instance
	  var oUsrOptions = {
	    type : this.getVIZChartType(),
	    data : this.getDataset().getVIZDataset(),
	    container : this.getDomRef(),
	    options : chartOptions,
	    css : cssSettings
	   };

	  // fire event to allow apps to enhance the options. This might change the options!
	  this.fireBeforeCreateViz({
	    usrOptions : oUsrOptions
	  });

	  // create a VIZ chart out of it
	  this._oVIZInstance = sap.viz.core.createViz(oUsrOptions);

	  // attach event listeners to the VIZ instance
	  var that = this;
	  each(this._mVIZHandler, function(sName, fnHandler) {
	    that._oVIZInstance.on(sName + BaseChart.EVENT_SUFFIX, fnHandler);
	  });


	};

	BaseChart.prototype.init = function() {
		// Control.prototype.init.call(this);
		sap.viz._initializeVIZ();
		this._mVIZHandler = {};
	};

	BaseChart.prototype.exit = function() {
		// unregister from resize handler
	  this._unregisterListener();
	  // properly clean up an existing VIZ instance
		if ( this._oVIZInstance ) {
			this._oVIZInstance.destroy();
			delete this._oVIZInstance;
		}
	};

	BaseChart.prototype.onBeforeRendering = function() {
	  this._unregisterListener();
	};

	BaseChart.prototype.onAfterRendering = function() {
	  this._renderChart();
	  this._registerListener();
	};

	BaseChart.prototype.onresize = function(o) {
		// retrieve new size and set it for the viz charts
		var size = {width : this.$().width(), height: this.$().height()};
		if ( this.getDomRef() && this._oVIZInstance ) {
			this._oVIZInstance.size(size);
		}
	};

	/**
	 * Set chart's default selection.
	 *
	 * @param {object[]} Array of default selection info
	 * @deprecated Since 1.19.
	 * Please use selection API {@link sap.viz.ui5.core.BaseChart.prototype.selection}.
	 * @public
	 */
	BaseChart.prototype.setDefaultSelection = function(selectionInfos) {
	  // retrieve new size and set it for the viz charts
	  var ds = this.getDataset();
	  if (ds){
	     var vizds = ds.getVIZDataset();
	     if (vizds){
	       vizds.info({
	        'type' : 'defaultSelection',
	        'value' : selectionInfos
	       });
	     if (this._oVIZInstance){
	        this._oVIZInstance.data(vizds);
	      }
	    }
	  }
	};

	BaseChart.prototype.onThemeChanged = function (o){
	  if (!this.getDomRef()){
	    return;
	  }
	  this._renderChart();
	};

	BaseChart.prototype.onLocalizationChanged = function (o){
	  if (!this.getDomRef()){
	    return;
	  }
	  this._renderChart();
	};

	BaseChart.prototype.validateAggregation = function(sAggregationName, oObject, bMultiple) {
		if ( sAggregationName === "interaction" ) {
			// can convert types in the following case
			// - if a chart receives a controller.Interaction (e.g. via XMLView using old namespaces)
			oObject = BaseStructuredType._convertAggregatedObject.call(this, sAggregationName, oObject, bMultiple);
		}
		return Control.prototype.validateAggregation.call(this, sAggregationName, oObject, bMultiple);
	};

	BaseChart.EVENT_SUFFIX = ".sap.viz.ui5.core";
	BaseChart.prototype._getOrCreate = BaseStructuredType.prototype._getOrCreate;

	BaseChart.prototype._getOptions = BaseStructuredType.prototype._getOptions;

	BaseChart.prototype._attachVIZEvent = function(sName, oData, fnHandler, oListener) {
		var that = this;
		if (!this.hasListeners(sName)) {
			this._mVIZHandler[sName] = function(o) {
				that.fireEvent(sName, o);
			};

			if (this._oVIZInstance) {
				this._oVIZInstance.on(sName + BaseChart.EVENT_SUFFIX, this._mVIZHandler[sName]);
			}
		}

		Control.prototype.attachEvent.apply(this, arguments);
		return this;
	};

	BaseChart.prototype._detachVIZEvent = function(sName, oData, fnHandler, oListener) {
		Control.prototype.detachEvent.apply(this, arguments);
		if ( !this.hasListeners(sName) ) {
			if ( this._oVIZInstance ) {
				this._oVIZInstance.on(sName + BaseChart.EVENT_SUFFIX, null);
			}
			delete this._mVIZHandler[sName];
		}
	  return this;
	};

	BaseChart.prototype.getVIZInstance = function() {
		return this._oVIZInstance || null;
	};

	/**
	 * Get/Set selected data points.
	 * To get selection, please use selection() or selection(Options).
	 * To set selection, please use selection(selectionPoint), or selection(selectionPoint, Options)
	 *
	 *
	 * @param {object[]} [selectionPoint]
	 *       Array of Objects with either data or ctx should be set Points. Each point is
	 *<pre>
	 * {
	 *    data: {key: "value", ...},//optional
	 *    ctx:  [{mi: 0, ...}, {...}, ...], // optional. It takes higher priority when both parameters of 'data' and 'ctx' are used.
	 * }
	 *</pre>
	 *       Either data or ctx should be set.
	 * @param {object} options
	 *       selection options.
	 *       Parameters used in getting data points from selection
	 *<pre>
	 *       {
	 *           "withDataCtx": Boolean, // optional. Default value is false.
	 *           "withInfo": Boolean, // optional. Default value is false.
	 *       }
	 *</pre>
	 *       Parameters used to set data points to be selected
	 *<pre>
	 *       {
	 *           "selectionMode": "inclusive" or "exclusive" // optional. Default value keeps the same as the selection mode
	 *                                                       // set by chart property of "interaction -> selectablity -> mode".
	 *                                                       // It takes higher priority when both parameters of 'clearSelection'
	 *                                                       // and 'selectionMode' are used.
	 *           "clearSelection": Boolean // Optional, deprecated parameter. 'selectionMode' is to replace this parameter.
	 *                                     // Use 'clearSelection' for backward-compatibility only.
	 *       }
	 *</pre>
	 * @returns {object[]} | {boolean}
	 *      Array of Points(for getting selection). Each point is
	 *<pre>
	 *      {
	 *          "data": {key: 'value', ...},
	 *          "ctx":  [{mi: 0, ...}, {...}, ...], // optional. Depends on "withDataCtx".
	 *          "info":  [{type: 'additionalData', ...}, {...}, ...], // optional. Depends on "withInfo".
	 *      }
	 *</pre>
	 *      or Boolean (for setting selection)
	 *           True means setting selection is successful.
	 *           False means setting selection is unsuccessful.
	 * @public
	 */
	BaseChart.prototype.selection = function(selectionPoint, options){
	  if (this._oVIZInstance){
	      return this._oVIZInstance.selection.apply(this._oVIZInstance, arguments);
	  }
	};


	return BaseChart;

});
