/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.VizContainer.
sap.ui.define([
	'sap/viz/library',
	'sap/viz/libs/sap-viz',
	'./container/libs/common/libs/rgbcolor/rgbcolor_static',
	'./container/libs/sap-viz-controls-vizcontainer',
	'./controls/common/BaseControl',
	'./controls/common/feeds/AnalysisObject',
	'./controls/common/feeds/FeedItem',
	'./container/VizControlsHelper',
	"sap/ui/thirdparty/jquery",
	"./VizContainerRenderer",
	"sap/ui/thirdparty/jqueryui/jquery-ui-core",
	"sap/ui/thirdparty/jqueryui/jquery-ui-widget",
	"sap/ui/thirdparty/jqueryui/jquery-ui-mouse",
	"sap/ui/thirdparty/jqueryui/jquery-ui-draggable",
	"sap/ui/thirdparty/jqueryui/jquery-ui-droppable"
], function(
	library,
	sapviz,
	rgbcolor_static,
	sapvizcontrolsvizcontainer,
	BaseControl,
	AnalysisObject,
	FeedItem,
	VizControlsHelper,
	jQuery
) {
	"use strict";

	/**
	 * Constructor for a new ui5/VizContainer.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Controls ui5/VizContainer
	 * @extends sap.viz.ui5.controls.common.BaseControl
	 *
	 * @constructor
	 * @public
	 * @since 1.19.0
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.19.0
	 * API is not finished yet and might change completely
	 * @name sap.viz.ui5.VizContainer
	 */
	var VizContainer = BaseControl.extend("sap.viz.ui5.VizContainer", /** @lends sap.viz.ui5.VizContainer.prototype */ { metadata : {

		library : "sap.viz",
		properties : {

			/**
			 * Type for visualization.
			 */
			vizType : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Css for visualization.
			 */
			vizCss : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Properties for visualization.
			 */
			vizProperties : {type : "object", group : "Misc", defaultValue : null},

			/**
			 * Enable morphing for visualization.
			 */
			enableMorphing : {type : "boolean", group : "Misc", defaultValue : null}
		},
		aggregations : {

			/**
			 * Dataset for chart.
			 */
			vizData : {type : "sap.viz.ui5.data.Dataset", multiple : false},

			/**
			 * Available sap.viz.ui5.controls.common.feeds.AnalysisObject for object picker popup UI
			 */
			analysisObjectsForPicker : {type : "sap.viz.ui5.controls.common.feeds.AnalysisObject", multiple : true, singularName : "analysisObjectsForPicker"},

			/**
			 * All feeds for chart.
			 */
			feeds : {type : "sap.viz.ui5.controls.common.feeds.FeedItem", multiple : true, singularName : "feed"}
		},
		events : {

			/**
			 * Dispatches "feedsChanged" event when the feeding changes due to add/remove/change feeding items on feeding panel, drag and drop object onto VizFrame, or switch chart type by UI operation.
			 * Application should listen to "feedsChanged" event to get the corresponding data and set it back to VizFrame to to update the visualization with the new data.
			 */
			feedsChanged : {
				parameters : {

					/**
					 * An array of changed feeds.
					 */
					feeds : {type : "sap.viz.ui5.controls.common.feeds.FeedItem[]"}
				}
			},

			/**
			 * Dispatches "vizTypeChanged" event when viz type was changed
			 */
			vizTypeChanged : {},

			/**
			 * Dispatches "vizDefinitionChanged" event when viz definition was changed.
			 */
			vizDefinitionChanged : {},

			/**
			 * Event fires when certain data point(s) is(are) selected, data context of selected item(s) would be passed in accordance with the following format.<code>{name: "selectData",data:[{
			 * //selected element's detail
			 * target:"Dom Element",//an object pointed to corresponding dom element
			 * data:[{val: "...",//value of this element
			 * ctx:{type:"Dimension"||"Measure"||"MND",
			 * //for Dimension
			 * path:{aa:"...",di:"...",dii:"..."},
			 * //for Measure
			 * path:{mg:"...",mi:"...",dii_a1:"...",dii_a2:"..."},
			 * //for MND
			 * path:{mg:"...",mi:"..."}
			 * //path: analysis path
			 * //aa: analysis axis index // 0 for analysis axis 1, 1 for analysis 2
			 * //di: dimension index //zero based
			 * //dii: dimension item index //zero based
			 * //mg: measure group index // 0 for measure group 1,1 for measure group 2
			 * //mi: measure index // measure index in measure group zero based
			 * //dii_a1: each dii of di in analysis axis 1 index
			 * //dii_a2: each dii of di in analysis axis 2 index
			 * }},{
			 * //for bubble, tagcloud and scatter, there will be more than one values in one selected element.
			 * var:"...",ctx:"..."}]},{
			 * //if under multi selection, there will be more than one selected elements
			 * target:"...",data:["..."]}]}
			 */
			selectData : {},

			/**
			 * Event fires when certain data point(s) is(are) deselected, data context of deselected item(s) would be passed in accordance with the following format.<code>{name: "deselectData",data:["---the same as selectedData---"]}
			 */
			deselectData : {},

			/**
			 * Event fires when the mouse hover onto the specific part of chart, data context of tooltip would be passed in accordance with the following format.<code>{name:"showTooltip",data:{body:[{
			 * //data of one group
			 * name:"...",val:[{
			 * //data of one row
			 * color:"...",label:"...",shape:"...",value:"..."},"..."]},"..."],footer:[{label:"...",value:"..."},"..."],plotArea:{
			 * //this object specifies the plot area of the chart
			 * height:"...",width:"...",x:"...",y:"..."},point:{
			 * //this object specifies a point which affects the position of tooltip
			 * x:"...",y:"..."}}}
			 */
			showTooltip : {},

			/**
			 * Event fires when the mouse hover out of the specific part of chart, no data is passed.
			 */
			hideTooltip : {},

			/**
			 * Event fires when the loading ends. To use the event listener when creating charts, you must use an event that is passed by the events option. For more information on events options, see the usrOptions section of the <a href="sap.viz.core.html#createViz" target="_blank">createViz</a> function in the API document.
			 */
			initialized : {}
		}
	}});


	/**
	 * Update VizContainer according to a JSON object, it can update css, properties, feeds and data model.
	 *
	 * @name sap.viz.ui5.VizContainer#vizUpdate
	 * @function
	 * @param {object} oOJson
	 *         A JSON object contains combination of css, properties, feeds and data model.
	 * @type void
	 * @public
	 */


	/**
	 * Selections for the chart instance of the VizContainer.
	 *
	 * @name sap.viz.ui5.VizContainer#vizSelection
	 * @function
	 * @param {object[]} aAPoints
	 *         Some data points of the chart
	 * @param {object} oOAction
	 *         A flag 'clearSelection', whether to clear previous selection, by default the selection will be incremental selection
	 * @type object
	 * @public
	 */
	VizContainer.prototype.init = function() {
		BaseControl.prototype.init.apply(this,
				arguments);

		this._uiConfig = {
			'layout' : 'horizontal',
			'enableMorphing' : true
		};

		this._vizFrame = null;
		this._vizBuilder = null;
		this._switchBar = null;

		this._vSplitter$ = null;

		this._clearVariables();
	};

	VizContainer.prototype.exit = function() {
		BaseControl.prototype.exit.apply(this,
				arguments);

		this._clearVariables();

		this.setVizData(null);
	};

	VizContainer.prototype._clearVariables = function() {
		this._vizFrame$ = null;
		this._vizBuilder$ = null;
		this._switchBar$ = null;

		this._clearRequestedProperties();
	};
	VizContainer.prototype._clearRequestedProperties = function() {
		this._requestedVizType = 'viz/column';
		this._requestedVizCss = null;
		this._requestedVizProperties = null;

		this._requestedOptions = null;
	};

	VizContainer.prototype.setUiConfig = function(
			oUiConfig) {
		this._mergeConfig(oUiConfig);
		return this;
	};

	VizContainer.prototype._mergeConfig = function(oUiConfig) {
		oUiConfig = oUiConfig || {};
		if (oUiConfig.layout === 'vertical' || oUiConfig.layout === 'horizontal') {
			this._uiConfig.layout = oUiConfig.layout;
		}
		this._uiConfig.enableMorphing = oUiConfig.enableMorphing !== false;
	};

	VizContainer.prototype.getFeeds = function() {
		var feeds = [];
		if (this._vizFrame && this._vizFrame.feeds()) {
			feeds = FeedItem
					.fromVizControlsFmt(this._vizFrame.feeds());
		} else {
			feeds = this.getAggregation('feeds');
		}
		return feeds;
	};

	VizContainer.prototype.getVizType = function() {
		if (this._vizFrame) {
			return this._vizFrame.vizType();
		} else {
			return this._requestedVizType;
		}
	};
	/**
	 * Setter for property vizType. A string of supported viz type: viz/column,
	 * viz/stacked_column, viz/dual_column, viz/line, viz/area, viz/combination,
	 * viz/dual_line, viz/dual_combination, viz/pie, viz/donut, viz/scatter,
	 * viz/bubble, viz/heatmap, viz/treemap.
	 *
	 * @param {string}
	 *            sVizType
	 * @returns {this}
	 * @public
	 * @function sap.viz.ui5.VizContainer.prototype.setVizType
	 */
	VizContainer.prototype.setVizType = function(sVizType) {
		if (this._vizFrame) {
			this._vizFrame.vizType(sVizType);
		} else {
			this._requestedVizType = sVizType;
		}
		return this;
	};
	VizContainer.prototype.getVizCss = function() {
		if (this._vizFrame) {
			return this._vizFrame.vizCss();
		} else {
			return this._requestedVizCss;
		}
	};
	VizContainer.prototype.setVizCss = function(sVizCss) {
		if (this._vizFrame) {
			this._vizFrame.vizCss(sVizCss);
		} else {
			this._requestedVizCss = sVizCss;
		}
		return this;
	};

	VizContainer.prototype.getVizProperties = function() {
		if (this._vizFrame) {
			return this._vizFrame.vizProperties();
		} else {
			return this._requestedVizProperties;
		}
	};
	/**
	 * Properties for visualization. Example:
	 *
	 * <pre>
	 *  var vizContainer = new sap.viz.ui5.VizContainer(...);
	 *  var properties = {
	 *      'dataLabel' : {'visible' : true },
	 *      'legend' : { &quot;visible&quot; : true },
	 *      'direction' : 'horizontal',
	 *      'stacking' : 'normal'
	 * };
	 * vizContainer.setVizProperties(properties);
	 * </pre>
	 *
	 * @param {object}
	 *            oVizProperties
	 * @returns {this}
	 * @public
	 * @function sap.viz.ui5.VizContainer.prototype.setVizProperties
	 */
	VizContainer.prototype.setVizProperties = function(oVizProperties) {
		if (this._vizFrame) {
			this._vizFrame.vizProperties(oVizProperties);
		} else {
			this._requestedVizProperties = oVizProperties;
		}
		return this;
	};

	VizContainer.prototype.getEnableMorphing = function() {
		if (this._vizFrame) {
			return this._vizFrame.enableMorphing();
		} else {
			return this._uiConfig.enableMorphing;
		}
	};
	/**
	 * Setter for property enableMorphing. If set true, a tween animation will play
	 * when chart changed.
	 *
	 * @param {boolean}
	 *            bEnableMorphing
	 * @returns {this}
	 * @public
	 * @function sap.viz.ui5.VizContainer.prototype.setEnableMorphing
	 */
	VizContainer.prototype.setEnableMorphing = function(bEnableMorphing) {
		if (this._vizFrame) {
			this._vizFrame.enableMorphing(bEnableMorphing);
		} else {
			this._uiConfig.enableMorphing = bEnableMorphing;
		}
		return this;
	};
	/**
	 * Selections for visualization. Example:
	 *
	 * <pre>
	 *  var vizContainer = new sap.viz.ui5.VizContainer(...);
	 *  var points = [{
	 *      data : {
	 *      	&quot;Country&quot; : &quot;China&quot;,
	 *          &quot;Year&quot; : &quot;2001&quot;,
	 *          &quot;Product&quot; : &quot;Car&quot;,
	 *          &quot;Profit&quot; : 25
	 *      }}, {
	 *      data : {
	 *      	&quot;Country&quot; : &quot;China&quot;,
	 *          &quot;Year&quot; : &quot;2001&quot;,
	 *          &quot;Product&quot; : &quot;Trunk&quot;,
	 *          &quot;Profit&quot; : 34
	 *      }}];
	 *  var action = {
	 *  	clearSelection : true
	 *  };
	 * vizContainer.vizSelection(points, action);
	 * </pre>
	 *
	 * @param {object[]}
	 *            aPoints some data points of the chart
	 * @param {object}
	 *            oAction whether to clear previous selection, by default the
	 *            selection will be incremental selection
	 * @returns {sap.viz.ui5.VizContainer}
	 * @public
	 * @function sap.viz.ui5.VizContainer.prototype.vizSelection
	 */
	VizContainer.prototype.vizSelection = function(aPoints, oAction) {
		if (this._vizFrame) {
			var result = this._vizFrame.vizSelection.apply(this._vizFrame,
					arguments);
			if (result === this._vizFrame) {
				result = this;
			}
			return result;
		} else {
			return null;
		}
	};
	/**
	 * Update VizContainer according to a JSON object, it can update css,
	 * properties, feeds and data model. Example:
	 *
	 * <pre>
	 * var vizContainer = new sap.viz.ui5.VizContainer(...);
	 * var vizData = new sap.viz.ui5.data.FlattenedDataset({
	 *     'dimensions' : [{
	 *         axis: 1,
	 *         name: &quot;Country&quot;,
	 *         value: &quot;{Country}&quot;
	 *         },{
	 *         axis: 2,
	 *         name: &quot;City&quot;
	 *         value: &quot;{City}&quot;
	 *      }],
	 *      'measures' : [{
	 *          group: 1,
	 *          name: &quot;Quantity sold&quot;,
	 *          value: &quot;{Quantity sold}&quot;
	 *       }],
	 *       'data' : {
	 *           'path' : &quot;/rawData&quot;
	 *       }
	 * });
	 * var cssString = 'position:absolute;left:0px;top:0px;';
	 * var properties = {
	 *     'dataLabel' : {'visible' : true },
	 *     'legend' : {&quot;visible&quot; : true},
	 *     'direction' : 'horizontal',
	 *     'stacking' : 'normal'
	 * };
	 * var FeedItem = sap.viz.ui5.controls.common.feeds.FeedItem;
	 * var feeds = [
	 *     new FeedItem({'uid' : 'primaryValues',
	 *                   'type' : 'Measure',
	 *                   'values' []}),
	 *     new FeedItem({'uid' : 'regionColor',
	 *                   'type' : 'Dimension',
	 *                   'values' []})];
	 * vizContainer.vizUpdate({
	 *               'data' : vizData,
	 *               'css' : cssString,
	 *               'properties' : properties,
	 *               'feeds' : feeds
	 *           });
	 * </pre>
	 *
	 * @param {object}
	 *            oOptions a JSON object contains combination of css, properties,
	 *            feeds and data model.
	 * @public
	 * @function sap.viz.ui5.VizContainer.prototype.vizUpdate
	 */
	VizContainer.prototype.vizUpdate = function(oOptions) {
		if (this._vizFrame) {
			if (oOptions.data || oOptions.feeds) {
				this._requestedOptions = this._requestedOptions || {};
			}

			if (this._requestedOptions) {
				// Save common keyword in options, release these options when
				// aggregations trigger render
				var requestedOptions = this._requestedOptions;
				requestedOptions.css = requestedOptions.css || oOptions.css;
				requestedOptions.properties = requestedOptions.properties
						|| oOptions.properties;

				if (oOptions.data) {
					this.setVizData(oOptions.data);
				}
				if (oOptions.feeds) {
					this._resetFeeds(oOptions.feeds);
				}
			} else {
				this._vizFrame.vizUpdate(oOptions);
			}
		}
	};

	VizContainer.prototype._resetFeeds = function(aFeeds) {
		this.destroyFeeds();

		// update feeds in sequence of aaindexs
		VizControlsHelper.updateFeedsByAAIndex(
				this.getVizType(), aFeeds);

		if (aFeeds && aFeeds.length) {
			for (var i = 0; i < aFeeds.length; i++) {
				this.addFeed(aFeeds[i]);
			}
		}
		return this;
	};
	VizContainer.prototype._setAnalysisObjectsForPicker = function(
			aAnalysisObjects) {
		this.destroyAnalysisObjectsForPicker();
		if (aAnalysisObjects && aAnalysisObjects.length) {
			for (var i = 0; i < aAnalysisObjects.length; i++) {
				this.addAnalysisObjectsForPicker(aAnalysisObjects[i]);
			}
		}
		return this;
	};

	VizContainer.prototype._createVizFrame = function(dom) {
		var VizFrame = sap.viz.controls.frame.VizFrame;
		var GlobalConfig = sap.viz.controls.common.config.GlobalConfig;

		var vizFrameConfig = GlobalConfig
				.defaultUIConfig(GlobalConfig.DEFAULT_UICONFIG_TYPE_FRAME);
		vizFrameConfig.enableFilterMenu = false;
		vizFrameConfig.enableFilterBar = false;
		vizFrameConfig.enableSettingButton = false;
		vizFrameConfig.enableFullScreenButton = false;
		vizFrameConfig.controls.chart.enableMorphing = this._uiConfig.enableMorphing;
		vizFrameConfig.controls.chart.enableTrellis = false;
		vizFrameConfig.controls.contextMenu.menu = [ [ "direction", "stacking" ],
				[ "legend", "datalabels" ] ];
		var vizFrame = new VizFrame(dom, vizFrameConfig);

		vizFrame.addEventListener('feedsChanged', jQuery.proxy(function(e) {
			this._resetFeeds(this.getFeeds());
			this.fireEvent("feedsChanged", {
				'feeds' : this.getFeeds()
			});
		}, this));

		vizFrame.addEventListener('vizTypeChanged', jQuery.proxy(function(e) {
			this.fireEvent("vizTypeChanged");
		}, this));

		vizFrame.addEventListener('vizDefinitionChanged', jQuery.proxy(function(e) {
			this.fireEvent("vizDefinitionChanged");
		}, this));

		vizFrame.vizOn('selectData', jQuery.proxy(function(e) {
			this.fireEvent("selectData", e);
		}, this));
		vizFrame.vizOn('deselectData', jQuery.proxy(function(e) {
			this.fireEvent("deselectData", e);
		}, this));
		vizFrame.vizOn('showTooltip', jQuery.proxy(function(e) {
			this.fireEvent("showTooltip", e);
		}, this));
		vizFrame.vizOn('hideTooltip', jQuery.proxy(function(e) {
			this.fireEvent("hideTooltip", e);
		}, this));
		vizFrame.vizOn('initialized', jQuery.proxy(function(e) {
			this.fireEvent("initialized", e);
		}, this));

		var options = vizFrame.getDefaultIncompleteOptions(this.getVizType());

		var feeds = this.getAggregation('feeds');
		if (feeds) {
			options.feeds = VizControlsHelper
					.getFeedInstances(feeds);
		}
		var data = VizControlsHelper
				.getFakedDataInstance(this.getVizType(), this.getVizData(), feeds);
		if (data) {
			options.data = data;
		}
		if (this.getVizCss()) {
			options.css = this.getVizCss();
		}
		if (this.getVizProperties()) {
			options.properties = this.getVizProperties();
		}
		this._clearRequestedProperties();
		vizFrame.createViz(options);
		return vizFrame;
	};
	/**
	 * Create children views.
	 *
	 * @private
	 */
	VizContainer.prototype._createChildren = function() {
		var app$ = this._app$;
		var cssPrefix = 'ui5-viz-controls';
		var GlobalConfig = sap.viz.controls.common.config.GlobalConfig;

		// VizFrame
		this._vizFrame$ = jQuery(document.createElement('div')).appendTo(app$)
				.addClass(cssPrefix + '-viz-frame');
		this._vizFrame = this._createVizFrame(this._vizFrame$[0]);

		if (this._uiConfig.layout === 'horizontal') {
			// VizBuilder
			var vizBuilderConfig = GlobalConfig
					.defaultUIConfig(GlobalConfig.DEFAULT_UICONFIG_TYPE_BUILDER);
			vizBuilderConfig.controls.feedingPanel.enableTrellis = false;
			vizBuilderConfig.controls.switchBar.groups = VizControlsHelper
					.getSwitchBarGroups();

			this._vizBuilder$ = jQuery(document.createElement('div'))
					.appendTo(app$).addClass(cssPrefix + '-viz-builder');
			this._vizBuilder = new sap.viz.controls.builder.VizBuilder(
					this._vizBuilder$[0], vizBuilderConfig);
			this._vizBuilder.connect(this._vizFrame.vizUid());
			// Splitter
			this._vSplitter$ = jQuery(document.createElement('div')).appendTo(app$)
					.addClass(cssPrefix + '-vertical-splitter');
		} else if (this._uiConfig.layout === 'vertical') {
			// SwitchBar
			var switchBarConfig = GlobalConfig
					.defaultUIConfig(GlobalConfig.DEFAULT_UICONFIG_TYPE_SWITCHBAR);
			switchBarConfig.groups = VizControlsHelper
					.getSwitchBarGroups();

			this._switchBar$ = jQuery(document.createElement('div')).appendTo(app$);
			this._switchBar = new sap.viz.controls.switchbar.SwitchBar(
					this._switchBar$[0], switchBarConfig);
			this._switchBar.connect(this._vizFrame.vizUid());
		}

		this._validateAOs();
		this._validateSize();
	};

	VizContainer.prototype._updateChildren = function() {
		var options = {};
		if (this._requestedOptions) {
			if (this._requestedOptions.css) {
				options.css = this._requestedOptions.css;
			}
			if (this._requestedOptions.properties) {
				options.properties = this._requestedOptions.properties;
			}
			this._requestedOptions = null;
		}
		options.data = VizControlsHelper
				.getFakedDataInstance(this.getVizType(), this.getVizData(), this
						.getAggregation('feeds'));
		options.feeds = VizControlsHelper
				.getFeedInstances(this.getAggregation('feeds'));

		this._vizFrame.vizUpdate(options);

		this._validateAOs();
	};

	VizContainer.prototype._validateAOs = function() {
		if (this._vizBuilder) {
			var aoInstaces = AnalysisObject
					.toVizControlsFmt(this.getAnalysisObjectsForPicker());
			this._vizBuilder.analysisObjectsForPicker(aoInstaces);
		}
	};

	// need to validateSize in case the host(browser/control) size change.
	VizContainer.prototype._validateSize = function() {

		if (this._uiConfig.layout === 'horizontal') {
			this._app$.css({
				'min-width' : '560px',
				// TODO Plus 1 for upper border, maybe it should fix in viz.controls
				'min-height' : '601px'
			});
		} else if (this._uiConfig.layout === 'vertical') {
			this._app$.css({
				'min-width' : '300px',
				'min-height' : '654px'
			});
		}

		this.$().css({
			'overflow' : 'hidden'
		});
		// this._app$.css({
		// 'width' : size.width,
		// 'height' : size.height,
		// 'overflow': 'hidden'
		// });
		var appSize = {
			'width' : this._app$.width(),
			'height' : this._app$.height()
		};

		if (this._uiConfig.layout === 'horizontal' && this._vizFrame) {
			var buiderWidth = this._vizBuilder$.width();

			this._vizFrame.size({
				'width' : appSize.width - buiderWidth,
				'height' : appSize.height
			});
			this._vizBuilder.size({
				'width' : buiderWidth,
				// TODO: Minus 1 for upper border, maybe it should fix in
				// viz.controls
				'height' : appSize.height - 1
			});
			this._vizFrame$.css({
				'left' : '0px',
				'top' : '0px'
			});
			this._vizBuilder$.css({
				'left' : appSize.width - buiderWidth + 'px',
				'top' : '0px'
			});
			this._vSplitter$.css({
				'left' : appSize.width - buiderWidth + 'px',
				'top' : '0px',
				'height' : appSize.height + 'px'
			});
		} else if (this._uiConfig.layout === 'vertical' && this._vizFrame) {
			var switchBarWidth = 388;
			var switchBarHeight = 54;
			this._vizFrame.size({
				'width' : appSize.width,
				'height' : appSize.height - switchBarHeight
			});
			this._switchBar.size({
				'width' : switchBarWidth,
				'height' : switchBarHeight
			});
			this._vizFrame$.css({
				'left' : '0px',
				'top' : switchBarHeight + 'px'
			});
			this._switchBar$.css({
				'left' : (appSize.width - switchBarWidth) / 2 + 'px',
				'top' : (switchBarHeight - 36) / 2 + 'px'
			});
		}
		this.$().css({
			'overflow' : 'auto'
		});
	};


	return VizContainer;

});
