/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/*global Blob, URL, Worker */
// Provides control sap.viz.ui5.controls.VizFrame.
sap.ui.define([
    'sap/viz/library',
    'sap/viz/ui5/data/Dataset',
    'sap/ui/core/Theming',
    'sap/ui/core/theming/Parameters',
    'sap/viz/ui5/theming/Util',
    'sap/viz/ui5/utils/CommonUtil',
    './ResponsiveLegend',
    './common/BaseControl',
    './common/feeds/AnalysisObject',
    './common/feeds/FeedItem',
    './common/feeds/FeedHelper',
    './common/helpers/RuntimeOptionsHelper',
    './common/helpers/DefaultPropertiesHelper',
    './common/utils/Constants',
    './common/utils/SelectionDetailUtil',
    "sap/base/Log",
    'sap/ui/Device',
    "sap/ui/thirdparty/jquery",
    "./WorkerCode",
    "require",
    "./VizFrameRenderer"
], function(
    vizLibrary,
    Dataset,
    Theming,
    Parameters,
    Util,
    CommonUtil,
    ResponsiveLegend,
    BaseControl,
    AnalysisObject,
    FeedItem,
    FeedHelper,
    RuntimeOptionsHelper,
    DefaultPropertiesHelper,
    Constants,
    SelectionDetailUtil,
    Log,
    Device,
    jQuery,
    WorkerCode,
    require
) {
    "use strict";

    var BindingService = sap.viz.vizservices.__internal__.BindingService;
    var PropertyService = sap.viz.vizservices.__internal__.PropertyService;
    for (var ii = 0; ii < Constants.CORE_CHART_TYPES.length; ii++) {
        var chartName = Constants.CORE_CHART_TYPES[ii];
        PropertyService.getPropertiesDef(chartName);
    }

    /**
     * Constructor for a new ui5/controls/VizFrame. For more information on the available info chart types, see the following <a href="docs/vizdocs/index.html" target="_blank">documentation</a>.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * VizFrame is a viz control that manages a visualization’s initialization, layout, feeding, customization and interactions.
     *
     * At the moment, the time series chart in VizFrame only accepts time inputs in UTC and system time, and does not have the capability to switch timezones dynamically. Additionally, the week representation in VizFrame adheres to the ISO week standard, and does not support other variations of week definitions.
     * @extends sap.viz.ui5.controls.common.BaseControl
     *
     * @constructor
     * @public
     * @since 1.22.0
     * @alias sap.viz.ui5.controls.VizFrame
     */
    var VizFrame = BaseControl.extend("sap.viz.ui5.controls.VizFrame", /** @lends sap.viz.ui5.controls.VizFrame.prototype */ { metadata : {

        library : "sap.viz",
        properties : {

            /**
             * Type for viz frame. User can pass 'chartType' or 'info/chartType'. For example both 'bar' and 'info/bar' will create a info bar chart.
             * Supported chart type: column, dual_column, bar, dual_bar, stacked_bar, stacked_column, line, dual_line, combination, bullet, time_bullet, bubble, time_bubble, pie, donut,
             * timeseries_column, timeseries_line, timeseries_scatter, timeseries_bubble, timeseries_stacked_column, timeseries_100_stacked_column, timeseries_bullet, timeseries_waterfall, timeseries_stacked_combination
             * scatter, vertical_bullet, dual_stacked_bar, 100_stacked_bar, 100_dual_stacked_bar, dual_stacked_column, 100_stacked_column,
             * 100_dual_stacked_column, stacked_combination, horizontal_stacked_combination, dual_stacked_combination, dual_horizontal_stacked_combination, heatmap, treemap,
             * waterfall, horizontal_waterfall, area, radar
             */
            vizType : {type : "string", group : "Misc", defaultValue : "column"},

            /**
             * Chart properties, refer to chart property doc for more details.
             */
            vizProperties : {type : "object", group : "Misc", defaultValue : null},

            /**
             * Chart scales, refer to chart property doc for more details.
             * @since 1.25
             */
            vizScales : {type : "object", group : "Misc", defaultValue : null},

            /**
             * Chart customizations property, aim to customize existing (build-in) charts
             * to meet specific LoB requirements.
             * Currently, supported chart type : column, dual_column, bar, dual_bar, stacked_column, stacked_bar, 100_stacked_bar, 100_stacked_column, 100_dual_stacked_bar, 100_dual_stacked_column, dual_stacked_bar, dual_stacked_column, line, horizontal_line, dual_line, dual_horizontal_line, combination, horizontal_combination, stacked_combination, horizontal_stacked_combination, dual_stacked_combination, dual_horizontal_stacked_combination, scatter, bubble.
             */
            vizCustomizations : {type : "object", group : "Misc", defaultValue : null},

            /**
             * Set chart's legend properties.
             */
            legendVisible : {type : "boolean", group : "Misc", defaultValue : true}

        },
        aggregations : {

            /**
             * Dataset for chart.
             */
            dataset : {type : "sap.viz.ui5.data.Dataset", multiple : false},

            /**
             * All feeds for chart.
             */
            feeds : {type : "sap.viz.ui5.controls.common.feeds.FeedItem", multiple : true, singularName : "feed"}
        },
        events : {

            /**
             * Event fires when the rendering ends.
             */
            renderComplete : {},

            /**
             * Event fires when certain data point(s) is(are) selected, data context of selected item(s) would be passed in.
             */
            selectData : {},

            /**
             * Event fires when certain data point(s) is(are) deselected, data context of deselected item(s) would be passed in
             */
            deselectData : {}
        }
    }});



    VizFrame.prototype.init = function() {
        BaseControl.prototype.init.apply(this, arguments);

        // instance property refers to prototype method, but bound to `this`
        this._scopingChangedFun = VizFrame.prototype._scopingChangedFun.bind(this);

        this._wrapApi('setModel', function() {this._invalidateDataset = true;}.bind(this));
        this._wrapApi('setDataset', function() {this._invalidateDataset = true;}.bind(this));
        this._wrapApi('destroyDataset', function() {this._invalidateDataset = true;}.bind(this));

        this._wrapApi('addFeed', function() {this._invalidateFeeds = true;}.bind(this));
        this._wrapApi('removeFeed', function() {this._invalidateFeeds = true;}.bind(this));
        this._wrapApi('destroyFeeds', function() {this._invalidateFeeds = true;}.bind(this));

        this._vizFrame = null;
        this._currentTheme = null;
        this._connectPopover = null;
        this._currentTemplate = null;
        this._errorType = null;
        this._bulletProperties = {plotArea:{}};
        this._waterfallProperties = {plotArea:{}};
        this._bReadyToRender = true;
        this._scalesOption = null;
        this._bSupressInvisibleRender = false;
        this._bDisableIntervalSizeCheck = true;

        this._clearVariables();

        this._templateCache = {};
        this._isInitThememChanged = false;
        this.data("sap-ui-fastnavgroup", "true", true/*Write into DOM*/);
    };

    VizFrame.prototype.exit = function() {
        BaseControl.prototype.exit.apply(this, arguments);

        this._clearVariables();

        if (this._vizFrame) {
            this._vizFrame.destroy();
        }
        this._vizFrame = null;
    };

    VizFrame.prototype._getDataRange = function(start ,end){

        return (this._vizFrame && this._vizFrame._getDataRange(start, end)) || {
            displayValues:{start:start, end:end}
        };
    };

    VizFrame.prototype._setTitleAria = function(description) {
        if (this._vizFrame$.length) {
            this._vizFrame$.attr("aria-hidden", true);
            jQuery(this._app$).attr("aria-label", description);
        }
    };

    VizFrame.prototype._clearVariables = function() {
        this._clearRequestedProperties();
        this._bulletProperties = {plotArea:{}};
        this._waterfallProperties = {plotArea:{}};
        this._cachedDataset = null;
        this._connectPopover = null;
        this._templateCache = null;
        this._bSupressInvisibleRender = false;
        this._bDisableIntervalSizeCheck = true;
    };

    VizFrame.prototype._clearRequestedProperties = function() {
        this.setProperty('vizProperties', null);
        this.setProperty('vizScales', null);
        this.setProperty('vizCustomizations', null);
        this._scalesOption = null;
    };

    /**
     * Uid for this viz frame. It supports other controls to connect to a viz instance.
     *
     * @returns {string} Uid of this viz frame
     * @public
     */
    VizFrame.prototype.getVizUid = function() {
        return this.getId();
    };


    /**
     * Setter for property uiConfig. uiConfig could only set via settings parameter
     * of constructor.
     *
     * uiConfig from base type could config the instance. Supported uiConfig
     * keyword: applicationSet, showErrorMessage
     *
     * @example
     * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     * var vizFrame = new VizFrame({
     *  'vizType' : 'bar',
     *  'uiConfig' : {
     *      'applicationSet' : 'fiori',
     *      'showErrorMessage' : true
     *  }
     * });
     *
     * @param {object} oUiConfig
     * @returns {this}
     * @public
     */
    VizFrame.prototype.setUiConfig = function(oUiConfig) {
        BaseControl.prototype.setUiConfig.apply(this, arguments);
        return this;
    };

    /**
     * Setter for property vizType. vizType could only set via settings parameter in Constructor.
     * Do not set vizType at runtime.
     *
     * vizType is a string of supported chart type or extension chart type.
     *
     * Supported chart types: bubble, combination, column, bar, line, stacked_bar, stacked_column, bullet, vertical_bullet, timebubble.
     * User can pass 'chartType' or 'info/chartType' for these supported chart types.
     *
     * Example:
     * <pre>
     * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     * var vizFrame = new VizFrame({
     *  'vizType' : 'bar'
     * });
     * </pre>
     *
     * For extension chart type, user should load extension js file manually at first.
     *
     * Example:
     * <pre>
     * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     * var vizFrame = new VizFrame({
     *  'vizType' : 'myextension'
     * });
     * </pre>
     *
     * @param {string}
     *            sVizType
     * @returns {this}
     * @public
     */
    VizFrame.prototype.setVizType = function(sVizType) {
        var oldType = this._getCalculatedType();
        if (sVizType !== this.getVizType()) {
            this._invalidateVizType = true;
        }
        this.setProperty('vizType', sVizType, true);

        var newType = this._getCalculatedType();
        if (oldType !== newType && !this._pendingRerendering && (this._vizFrame || this._errorType)) {
            var userFeeds = this._userFeeds || {
                feeds: this.getFeeds(),
                vizType: oldType
            };
            if (userFeeds.vizType === newType) {
                this.destroyFeeds();
                userFeeds.feeds.forEach(function(feed) {
                    this.addFeed(feed);
                }, this);
                this._userFeeds = null;
            } else {
                this._switchFeeds(oldType, this._getCalculatedType(), userFeeds);
            }
        } else {
            this.invalidate();
        }
        return this;
    };

    VizFrame.prototype._switchFeeds = function (fromType, toType, userFeeds) {
        var lwFeeds = FeedItem.toLightWeightFmt(this.getFeeds());
        var newFeeds = sap.viz.vizservices.BVRService.switchFeeds(fromType, lwFeeds, toType).feedItems;
        var defMap = FeedHelper.getFeedDefsMap(toType);
        newFeeds.forEach(function (feed) {
            if (feed.id && defMap[feed.id]) {
                feed.type = defMap[feed.id].type;
            }
        });
        var newUi5Feeds = FeedItem.fromLightWeightFmt(newFeeds);
        userFeeds.feeds.forEach(function(feed) {
            this.removeFeed(feed, true);
        }, this);
        this.vizUpdate({feeds : newUi5Feeds});
        // this._userFeeds is reset in removeFeed above, and vizUpdate>(destroyFeeds & addFeeds), so restore it here
        this._userFeeds = userFeeds;
    };


    // override to add dataset invalidated flag
    VizFrame.prototype.invalidate = function(oOrigin) {
        if (oOrigin instanceof Dataset) {
            this._invalidateDataset = true;
        }
        if (oOrigin instanceof FeedItem) {
            this._userFeeds = null;
        }
        BaseControl.prototype.invalidate.call(this, oOrigin);
    };

    VizFrame.prototype.getVizProperties = function() {
        if (this._vizFrame) {
            return this._mergeProperties(this._mergeProperties({}, this._vizFrame.properties() || {}), this.getProperty('vizProperties') || {});
        } else {
            return this.getProperty('vizProperties');
        }
    };

    VizFrame.prototype.getVizScales = function() {
        if (this._vizFrame) {
            return CommonUtil.extendScales(this._vizFrame.scales() || [], this.getProperty('vizScales') || []);
        } else {
            return this.getProperty('vizScales');
        }
    };

    /**
     * Zoom the chart plot.
     *
     * @example
     *  // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     *  var vizFrame = new VizFrame(...);
     *  vizFrame.zoom({direction: "in"});
     *
     * @param {object} cfg
     *            contains a "direction" attribute with value "in" or "out" indicating zoom to enlarge or shrink respectively
     * @public
     */
    VizFrame.prototype.zoom = function(cfg) {
        if (this._vizFrame) {
            this._vizFrame.zoom({
                target: "plotArea",
                direction: cfg.direction
            });
        }
   };

    /**
     * Properties for viz frame.
     *
     * @example
     *  // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     *  var vizFrame = new VizFrame(...);
     *  var properties = {
     *      'legend' : { 'visible'; : true }
     * };
     * vizFrame.setVizProperties(properties);
     *
     * @param {object}
     *            oVizProperties
     * @returns {this}
     * @public
     */
    VizFrame.prototype.setVizProperties = function(oVizProperties) {
        var type = this._getCalculatedType();
        // save bullet proeprties
        if ( oVizProperties && (type === "info/bullet" || type === "info/vertical_bullet") ) {
            RuntimeOptionsHelper.processBulletProperty(this._bulletProperties, oVizProperties);
        }
        // save waterfall proeprties
        if ( oVizProperties && (type === "info/timeseries_waterfall") ) {
            RuntimeOptionsHelper.processWaterfallProperty(this._waterfallProperties, oVizProperties);
        }
        var options = sap.viz.api.serialization.migrate({
            'type' : this._getCalculatedType(),
            'properties' : oVizProperties
        });
        if (this._vizFrame && !this._pendingRerendering) {
            //If no data, don't need clear the message
            if (this._errorType !== Constants.ERROR_TYPE.NODATA) {
                this._updateDescription();
            }
            try {
                this._vizFrame.update(options);
            } catch (err) {
                this._handleErr(err);
            }
        } else {
            // Use as a cache
            this.setProperty('vizProperties', this._mergeProperties(this.getProperty('vizProperties') || {}, options.properties || {}));
            this.setVizScales(options.scales, this._scalesOption);
        }
        return this;
    };

    /**
     * Scales for VizFrame.
     *
     * @example
     * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     * var vizFrame = new VizFrame(...);
     * var scales = [{
     *      'feed': 'color',
     *      'palette': ['#ff0000']
     * }];
     * var vizScalesOption = {replace: true};
     * vizFrame.setVizScales(scales, vizScalesOption);
     *
     * @param {object}
     *            oVizScales
     * @param {object} [oVizScalesOption]
     * @param {boolean} [oVizScalesOption.replace] replace scales or not. When oVizScalesOption.replace is true,
     *                        replace existing scales with the input scales.
     * @returns {this}
     * @public
     */
    VizFrame.prototype.setVizScales = function(oVizScales, oVizScalesOption) {
        if (this._vizFrame && !this._pendingRerendering) {
            try {
                if (oVizScalesOption) {
                    this._vizFrame.scales(oVizScales, {level: 'user', replace: oVizScalesOption.replace});
                } else {
                    this._vizFrame.scales(oVizScales);
                }
            } catch (err) {
                this._handleErr(err);
            }
        } else {
            if (oVizScalesOption) {
                this._scalesOption = {level: 'user', replace: oVizScalesOption.replace};
            }
            if (oVizScalesOption && oVizScalesOption.replace) {
                //If reset scales, there is no need to use a cache.
                this.setProperty('vizScales', oVizScales);
            } else {
                this.setProperty('vizScales', CommonUtil.extendScales(this.getProperty('vizScales') || [], oVizScales || []));
            }
        }
        return this;
    };

    /**
     * Return current legend group visibility.
     *
     * @returns {boolean} current legend group visibility
     * @public
     * @since 1.28
     */
    VizFrame.prototype.getLegendVisible = function(){
        return this.getVizProperties().legendGroup.computedVisibility;
    };

    /**
     * Will respect the setting for all available legends.
     *
     * @param {boolean} visibility
     *         Set legend visibility.
     * @returns {this}
     * @public
     * @since 1.28
     */
    VizFrame.prototype.setLegendVisible = function(visibility){
        this.setVizProperties({
            'legend': {
                'visible' : visibility
            },
            'sizeLegend': {
                'visible' : visibility
            }
        });

        return this;
    };

    /**
     * Selections for viz frame.
     *
     * @example
     *  // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     *
     *  var vizFrame = new VizFrame(...);
     *  //vizSelection for set
     *  var points = [{
     *      data : {
     *          "Country" : "China",
     *          "Year" : "2001",
     *          "Product" : "Car",
     *          "Profit" : 25
     *      }}, {
     *      data : {
     *          "Country" : "China",
     *          "Year" : "2001",
     *          "Product" : "Trunk",
     *          "Profit" : 34
     *      }}];
     *  var action = {
     *      clearSelection : true
     *  };
     * vizFrame.vizSelection(points, action);
     * //vizSelection for get and return result
     * var result = vizFrame.vizSelection();
     * result = [{
     *          data : {
     *              "Country" : "China",
     *              "Year" : "2001",
     *              "Product" : "Car",
     *              "Profit" : 25
     *          },
     *          unit : {
     *              "Profit" : "$"
     *          },
     *          dataName : {
     *              "Profit" : "Actual"
     *          }
     *       }, {
     *          data : {
     *              "Country" : "China",
     *              "Year" : "2001",
     *              "Product" : "Trunk",
     *              "Profit" : 34
     *          },
     *          unit : {
     *              "Profit" : "$"
     *          },
     *          dataName : {
     *              "Profit" : "Actual"
     *          }
     *      }]
     *
     * @param {object[]}
     *            aPoints some data points of the chart
     * @param {object}
     *            oAction whether to clear previous selection, by default the
     *            selection will be incremental selection
     * @returns {this}
     * @public
     */
    VizFrame.prototype.vizSelection = function(aPoints, oAction) {
        if (this._vizFrame) {
            try {
                var result = this._vizFrame.selection.apply(this._vizFrame, arguments);
                if (result === this._vizFrame) {
                    result = this;
                }
            } catch (e) {
                return null;
            }
            return result;
        } else {
            return null;
        }
    };

    /**
     * Update viz frame according to a JSON object, it can update css, properties,
     * feeds and data model.
     *
     * VizFrame instance has to be placed at its corresponding parent at first to make this API work.
     *
     * @example
     * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     * // FlattenedDataset required from "sap/viz/ui5/data/FlattenedDataset"
     * // FeedItem required from "sap/viz/ui5/controls/common/feeds/FeedItem"
     *
     * var vizFrame = new VizFrame(...);
     * var data = new FlattenedDataset(...);
     * var properties = {
     *     'legend' : {'visible' : true},
     * };
     * var scales = [{
     *      'feed': 'color',
     *      'palette': ['#ff0000']
     * }];
     * var customizations = {id:"sap.viz.custom",customOverlayProperties: {}};
     * var feeds = [
     *     new FeedItem({'uid' : 'primaryValues',
     *                   'type' : 'Measure',
     *                   'values' : []}),
     *     new FeedItem({'uid' : 'regionColor',
     *                   'type' : 'Dimension',
     *                   'values' : []})];
     * vizFrame.vizUpdate({
     *               'data' : data,
     *               'properties' : properties,
     *               'scales' : scales,
     *               'customizations' : customizations,
     *               'feeds' : feeds
     *           });
     *
     * @param {object}
     *            oOptions a JSON object contains combination of properties, feeds
     *            and data model.
     * @public
     */
    VizFrame.prototype.vizUpdate = function(oOptions) {
        if (this._vizFrame || this._errorType) {
            if (oOptions.data || oOptions.feeds) {
                // Create requested cache when aggregation changed
                if (oOptions.properties) {
                    this.setVizProperties(oOptions.properties);
                }
                if (oOptions.scales) {
                    this.setVizScales(oOptions.scales);
                }
                if (oOptions.customizations) {
                    this.setVizCustomizations(oOptions.customizations);
                }
                if (oOptions.data) {
                    this.setDataset(oOptions.data);
                }
                if (oOptions.feeds) {
                    this.destroyFeeds();
                    oOptions.feeds.forEach(function(feedItem) {
                        this.addFeed(feedItem);
                    }.bind(this));
                }
            } else {
                try {
                    // Call _vizFrame.vizUpdate directly when aggregation not changed
                    this._vizFrame.update(oOptions);
                } catch (err) {
                    this._handleErr(err);
                }
            }
        }

    };

    /**
    * Set chart customizations,could set via settings parameter of constructor or call the function directly.
    *
    * Supported chart types: column,dual_column,bar,dual_bar,stacked_column,stacked_bar,100_stacked_bar,100_stacked_column,100_dual_stacked_bar,100_dual_stacked_column,
    * dual_stacked_bar,dual_stacked_column,line,horizontal_line,dual_line,dual_horizontal_line,combination,horizontal_combination,stacked_combination,
    * horizontal_stacked_combination,dual_stacked_combination,dual_horizontal_stacked_combination,scatter,bubble.
    *
    * @param {object} obj The object describe the customizations
    * @param {string} obj.id the customizations id
    * @param {object} [obj.customOverlayProperties] {}
    * @param {object} [obj.customRendererProperties] {id, [{ctx, properties}]}
    * @param {object} [obj.customInteractionProperties] {id, {properties}}
    *
    * @example <caption>Sample Code:</caption>
    * VizFrame.vizCustomizations({id : "", customOverlayProperties: {}, customRendererProperties: {}, customInteractionProperties: {}});
    * @returns {this}
    */
    VizFrame.prototype.setVizCustomizations = function(obj) {
        if (VizFrame._isCustomizationAPISupportedVizType(this._getCalculatedType())) {
            if (this._vizFrame && !this._pendingRerendering) {
                try {
                    this._vizFrame.customizations(obj);
                } catch (err) {
                    this._handleErr(err);
                }
            } else {
                // Use as a cache
                this.setProperty('vizCustomizations', this._mergeProperties(this.getProperty('vizCustomizations') || {}, obj || {}));
            }
        }
        return this;
    };

    VizFrame.prototype.getVizCustomizations = function(){
        if (this._vizFrame) {
            return this._mergeProperties(this._mergeProperties({}, this._vizFrame.customizations() || {}), this.getProperty('vizCustomizations') || {});
        } else {
            return this.getProperty('vizCustomizations');
        }
    };

    VizFrame._isCustomizationAPISupportedVizType = function(vizType) {
        // @formatter:off
        return Array.prototype.indexOf.call(
            [ 'info/column', 'info/dual_column','info/bar', 'info/dual_bar', 'info/stacked_bar','info/stacked_column',
              'info/100_stacked_bar','info/100_stacked_column','info/100_dual_stacked_bar','info/100_dual_stacked_column',
              'info/dual_stacked_bar','info/dual_stacked_column','info/line','info/horizontal_line','info/dual_line',
              'info/dual_horizontal_line','info/bubble', "info/scatter", 'info/combination','info/horizontal_combination',
              'info/stacked_combination', 'info/horizontal_stacked_combination','info/dual_stacked_combination',
              'info/dual_horizontal_stacked_combination', 'info/timeseries_combination', 'info/timeseries_stacked_combination',
              'info/timeseries_bullet','info/dual_timeseries_combination', 'info/dual_combination', 'info/dual_horizontal_combination'],
            vizType
        ) > -1;
        // @formatter:on
    };

    /**
     * Get ResponsiveLegend Control. (For fiori application set only. It has been deprecated since 1.28.)
     *
     * @public
     * @deprecated Since version 1.28.
     * This API has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
     */
    VizFrame.prototype.getResponsiveLegend = function(){
        if (this._vizFrame) {
            return ResponsiveLegend.createInstance(this._vizFrame.responsiveLegend());
        }
    };

    /**
     * Exports the current viz as an SVG String.
     *
     * The viz is ready to be exported to SVG ONLY after the initialization is finished.
     * Any attempt to export to SVG before that will result in an empty SVG string.
     *
     * @public
     * @param {Object} [option] Options for the export
     * @param {int} [option.width] the exported SVG will be scaled to the specific width
     * @param {int} [option.height] the exported SVG will be scaled to the specific height
     * @param {boolean} [option.hideTitleLegend] flag to indicate if the exported SVG includes the original title and legend
     * @param {boolean} [option.hideAxis] flag to indicate if the exported SVG includes the original axis
     * @return {string} the SVG string of the current viz or empty SVG if error occurs.
     */
    VizFrame.prototype.exportToSVGString = function (option) {
        var result = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\"/>";
        if (this._vizFrame) {
            result = this._vizFrame.exportToSVGString(option);
        }
        return result;
    };

    VizFrame.prototype._getScopeString = function () {
        //aScope is like [[sapContrast], [sapABC, sapD], ...]. We stringify it.
        var aScope = Parameters.getActiveScopesFor(this);
        return JSON.stringify(aScope);
    };

    VizFrame.prototype._scopingChangedFun = function (eventOptions) {
        var oElement = eventOptions.element;
        var handleScopingChange = false;
        if (this === oElement) {
            handleScopingChange = true;
        } else {
            var node = this;
            while (node) {
                node = node.getParent();
                if (node === oElement) {
                    handleScopingChange = true;
                    break;
                }
            }
        }

        if (handleScopingChange) {
            var sScopeChain = this._getScopeString();
            //undefined means vizFrame is not rendered.
            if (this._sCurrentScopeChain !== undefined &&
                this._sCurrentScopeChain !== sScopeChain) {
                this._themeChangedHandler(false, function() {
                    this._themeLoadCompleted = true;
                    this._renderVizFrame( {
                        forceThemeChange : true
                    });
                }.bind(this));

            }
        }
    };

    /*
     * Create necessary chart container before rendering.
     */
    VizFrame.prototype._createContainerDiv = function () {
        // Container
        if (!this._vizFrame$) {
            this._vizFrame$ = jQuery(document.createElement('div'));
            this._vizFrame$.addClass(Constants.CSS_PREFIX + '-viz-frame');
            this._vizFrame$.appendTo(this._app$);
        }

        //Description container
        if (!this._description$) {
            this._description$ = jQuery(document.createElement('div'));
            this._description$.addClass(Constants.CSS_PREFIX + '-viz-description');
            this._description$.appendTo(this._app$);
            this._description$.attr('tabindex', 0);

            this._descriptionTitle$ = jQuery(document.createElement('div'));
            this._descriptionTitle$.addClass(Constants.CSS_PREFIX + '-viz-description-title');
            this._descriptionTitle$.appendTo(this._description$);

            this._descriptionDetail$ = jQuery(document.createElement('div'));
            this._descriptionDetail$.addClass(Constants.CSS_PREFIX + '-viz-description-detail');
            this._descriptionDetail$.appendTo(this._description$);

            this._descriptionMessage$ = jQuery(document.createElement('div'));
            this._descriptionMessage$.addClass(Constants.CSS_PREFIX + '-viz-description-message');
            this._descriptionMessage$.appendTo(this._description$);
        }
    };

    VizFrame.prototype._createVizFrame = function (options) {
        Theming.attachThemeScopingChanged(this._scopingChangedFun);

        options.container = this._vizFrame$.get(0);

        var vizFrame = this._vizFrame = new sap.viz.vizframe.VizFrame(options, {
            'controls' : {
                'morpher' : {
                    'enabled' : false
                }
            }, 'throwError' : true
        });

        vizFrame.on('selectData', function(e) {
            this.fireEvent("selectData", e);
        }.bind(this));
        vizFrame.on('deselectData', function(e) {
            this.fireEvent("deselectData", e);
        }.bind(this));
        vizFrame.on('initialized', function(e) {
            var that = this;
            function addFocusInOutEvent() {
                var vizFrame$ = that._vizFrame$;
                vizFrame$.on("focusin", function(event){
                    event.preventDefault();
                    vizFrame$.addClass('sapMFocus');
                });
                vizFrame$.on("focusout", function(event){
                    event.preventDefault();
                    vizFrame$.removeClass('sapMFocus');
                });
            }
            function fireRenderCompleteEvent() {
                if (!this._pendingRerendering) {
                    addFocusInOutEvent();
                    this.fireEvent("renderComplete", e);
                    this.detachEvent("pendingRerenderingFalse", fireRenderCompleteEvent);
                }
            }
            if (this._pendingRerendering) {
                this.attachEvent("pendingRerenderingFalse", null, fireRenderCompleteEvent);
            } else {
                addFocusInOutEvent();
                this.fireEvent("renderComplete", e);
            }
        }.bind(this));
        vizFrame.on('scroll', function(e) {
            this.fireEvent("_scroll", e);
        }.bind(this));
        vizFrame.on('_selectionDetails', function(e) {
            SelectionDetailUtil.appendShapeStrings(e.data);
            this.fireEvent("_selectionDetails", e);
        }.bind(this));
        vizFrame.on('_zoomDetected', function(e) {
            this.fireEvent("_zoomDetected", e);
        }.bind(this));
        return vizFrame;
    };

    VizFrame.prototype._migrate = function(type, feeds) {
        feeds.forEach(function(feedItem) {
            var migrated = sap.viz.api.serialization.feedsIdToBindingId(type, feedItem.getUid());
            if (migrated) {
                feedItem.setProperty('uid', migrated, true);
            }
        });
        if (type === "info/bullet" ||
            type === "info/vertical_bullet" ||
            type === "info/timeseries_bullet") {
            var hasActualBinding = false;
            feeds.forEach(function(feedItem) {
                hasActualBinding = hasActualBinding || feedItem.getUid() === 'actualValues';
            });
            if (!hasActualBinding) {
                feeds.forEach(function(feedItem) {
                    if (feedItem.getUid() === 'valueAxis') {
                        feedItem.setUid('actualValues');
                        if (feedItem.getValues().length > 1) {
                            feeds.push(new FeedItem({
                                'uid' : 'additionalValues',
                                'type' : 'Measure',
                                'values' : [feedItem.getValues()[1]]
                            }));
                            feedItem.setValues([feedItem.getValues()[0]]);
                        }
                    }
                });
            }
        }
    };

    function indexOfColorPalette(feeds){
        for (var i = feeds.length - 1; i >= 0; i--) {
            var fd = feeds[i];
            if (fd.feed && fd.feed === "color" && fd.palette) {
                return i;
            }
        }
        return -1;
    }

    // vizFrame checks user input and adds extra props according to chart type
    VizFrame.prototype._checkProps = function(applicationSet, options, feeds){
        //decorate user property
        if (applicationSet === 'fiori') {
            options.properties =  RuntimeOptionsHelper.decorateFiori(options, feeds, this.getVizProperties());
        }

        if (options.properties) {
            options.properties = PropertyService.removeInvalid(options.type, options.properties);
        }

        if (options.type === "info/bullet" || options.type === "info/vertical_bullet") {
            options.properties = this._mergeProperties(options.properties || {},this._bulletProperties);
            RuntimeOptionsHelper.decorateBullet(options, feeds);
        }

        if (options.type === "info/timeseries_bullet") {
            RuntimeOptionsHelper.decorateTimeBullet(options);
        }

        if (options.type === "info/timeseries_waterfall") {
            RuntimeOptionsHelper.decorateWaterfall(options, feeds);
            options.properties = this._mergeProperties(options.properties || {},this._waterfallProperties);
        }
    };

    function getPropsPromise(applicationSet, allPropDefs,  allUi5Theme, cvomTemplate, extraProp, defaultFormatString ){
        return new Promise(function (resolve) {
            var worker;
            try {
                worker = new Worker(URL.createObjectURL(new Blob(["(" + WorkerCode.toString() + ")()"], {type: 'text/javascript'})));
            } catch (err) {
                // a strict content security policy might forbid the use of blob: URLs, use fallback
                Log.info("Failed to create worker via Blob (strict CSP?), falling back to separate script", null, "sap.viz.ui5.controls.VizFrame");
                worker = new Worker(require.toUrl("./WorkerCode.js"));
            }
            function workerHandler(worker) {
                worker.postMessage({applicationSet:applicationSet, allPropDefs :allPropDefs, allChartNames:Constants.CORE_CHART_TYPES, generalProps: DefaultPropertiesHelper._general,
                specificProps: DefaultPropertiesHelper._specified, defaultFioriProps: DefaultPropertiesHelper.DEFAULT_FIORI_PROPS,
                dualFioriProps: DefaultPropertiesHelper.FIORI_DUAL_PROPS, allUi5Theme:allUi5Theme, cvomTemplate:cvomTemplate, extraProp:extraProp, defaultFormatString: defaultFormatString});
                worker.onmessage = function (event) {
                    resolve(event.data);
                };
            }
            workerHandler(worker);
            worker.onerror = function (event) {
                // For browser Firefox, the strict content security policy would forbid to read the content in the resource of blob: URLs.
                // But the error couldn't be catched by Firefox. Use the onerror function to check.
                // a strict content security policy might forbid the use of blob: URLs, use fallback
                Log.info("Failed to create worker via Blob (strict CSP?), falling back to separate script", null, "sap.viz.ui5.controls.VizFrame");
                worker = new Worker(require.toUrl("./WorkerCode.js"));
                workerHandler(worker);
            };
        });
    }

    function getDefaultProp(chartName, applicationSet, oControl) {
        var mFn = PropertyService.mergeProperties;
        var getUI5Theme = Util.readCSSParameters;
        var defaultProp = DefaultPropertiesHelper.get(PropertyService, chartName, applicationSet);
        var extraProp = DefaultPropertiesHelper.getExtraProp(applicationSet);
        return mFn(chartName, defaultProp, getUI5Theme(chartName, oControl), extraProp);
    }

    //  in BITSDC2-2919, we want to merge ui5 and fiori properties into an template
    //  and pass it to cvom chart. Such that cvom will treat those properties as template prop
    //  rather than user properties
    //  this function will merge props, vizFrame will use the result to create the template
    VizFrame.prototype._getTemplateProps = function(applicationSet, cvomTemplate, newId){
        if (this._templateCache[newId]) {
            return Promise.resolve();
        }
        var chartName, ii;
        return new Promise(function(resolve, reject) {
            if (typeof (window.Worker) !== 'undefined') {
                var getUI5Theme = Util.readCSSParameters;

                var extraProp = DefaultPropertiesHelper.getExtraProp(applicationSet);
                var allPropDefs = {};
                var allUi5Theme = {};
                var allDefaultFormatString = {};

                for (ii = 0; ii < Constants.CORE_CHART_TYPES.length; ii++) {
                    chartName = Constants.CORE_CHART_TYPES[ii];
                    if (applicationSet !== 'fiori') {
                        allDefaultFormatString[chartName] = DefaultPropertiesHelper.applyDefaultFormatString({}, chartName);
                    }
                    allPropDefs[chartName] = PropertyService.getPropertiesDef(chartName);
                    allUi5Theme[chartName] = getUI5Theme(chartName, this);
                }
                this._themeLoadCompleted = false;
                return getPropsPromise(applicationSet, allPropDefs, allUi5Theme, cvomTemplate.properties, extraProp, allDefaultFormatString).then(function(mergedProps){
                    if (!this._templateCache) {
                        reject();
                    } else {
                        this._templateCache[newId] = mergedProps;
                        resolve();
                    }
                }.bind(this));
            } else {
                var mFn = PropertyService.mergeProperties;
                var mergedProps = {};
                for (ii = 0; ii < Constants.CORE_CHART_TYPES.length; ii++) {
                    chartName = Constants.CORE_CHART_TYPES[ii];
                    mergedProps[chartName] = getDefaultProp(chartName, applicationSet, this);
                }

                if (cvomTemplate.properties) {
                    for (ii = 0; ii < Constants.CORE_CHART_TYPES.length; ii++) {
                        chartName = Constants.CORE_CHART_TYPES[ii];
                        mergedProps[chartName] = mFn(chartName, cvomTemplate.properties[chartName], mergedProps[chartName]);
                        mergedProps[chartName] = PropertyService.removeInvalid(chartName, mergedProps[chartName] );
                    }
                }
                this._templateCache[newId] = mergedProps;
                resolve();
            }
        }.bind(this));

    };

    VizFrame.prototype._getOptions = function(type, feeds){
        var options = {
            'type': type,
            'properties': {}
        };

        // data
        if (this._invalidateDataset) {
            options.data = this._getVizDataset();
            this._invalidateDataset = false;
        }
        // feeds
        if (this._invalidateFeeds) {
            options.bindings = this._getVizBindings(type, feeds);
            this._invalidateFeeds = false;
        }
        // properties
        if (this.getProperty('vizProperties')) {
            options.properties = this.getProperty('vizProperties');
        }
        // scales
        if (this.getProperty('vizScales')) {
            options.scales = this.getProperty('vizScales');
        }
        if (this._scalesOption) {
            options.scalesOption = this._scalesOption;
        }
        // customized properties
        if (this.getProperty('vizCustomizations')) {
            options.customizations = this.getProperty('vizCustomizations');
        }
        // runtime color scales
        if (this._aRuntimeScales) {
            options.sharedRuntimeScales = this._aRuntimeScales;
        }

        options.template = this._currentTemplate;

        return options;
    };

    VizFrame.prototype._setCustomMessages = function (o) {
        this._errorInfo = o;
        this._handleDescription(this._errorType);
    };

    VizFrame.prototype._realRenderVizFrame = function(renderOptions){
        if (!this._readyToRender()){
            return;
        }
        var applicationSet = (this.getUiConfig() || {}).applicationSet;
        var type = this._getCalculatedType();
        var feeds = this.getFeeds();
        var mFn = PropertyService.mergeProperties;

        var originalInvalids = {
            _invalidateDataset: this._invalidateDataset,
            _invalidateVizType: this._invalidateVizType,
            _invalidateFeeds:   this._invalidateFeeds
        };

        // Migrate
        this._migrate(type, feeds);

        var themeChanged = false,
            theme = Theming.getTheme();
        if ((renderOptions && renderOptions.forceThemeChange) ||
                (this._currentTheme !== theme)) {
            themeChanged = true;
        }
        originalInvalids.theme = theme;

        //nothing changed
        if (!(this._invalidateFeeds || this._invalidateDataset || themeChanged || this._invalidateVizType || this._localeChanged) || !this._isDataReady()) {
            return;
        }

        this._createContainerDiv();

        try {
            var options = this._getOptions(type, feeds);
            if (!options){
                return;
            }
            this._currentTheme = theme;

            //extension is very sensitive, we do not want to change their behaviors
            //do not use template for extension
            if (this._isExtension()) {
                var defaultProp = getDefaultProp(type, applicationSet);
                options.properties = mFn(type, defaultProp, options.properties);
            }

            this._checkProps(applicationSet, options, feeds, type);

            if (this._invalidateVizType) {
                this._invalidateVizType = false;
            }

            options.disableIntervalSizeCheck = this._bDisableIntervalSizeCheck;

            if (!this._vizFrame) {
                if (options.data) {
                    this._createVizFrame(options);
                    this._clearRequestedProperties();
                }
            } else {
                this._vizFrame.update(options);
                this._clearRequestedProperties();
            }
            if (this._connectPopover) {
                this._connectPopover();
            }

            //If empty data, display "No Data" in center
            var vizDS = this._getVizDataset();
            if (vizDS && vizDS._FlatTableD && (!vizDS._FlatTableD._data.length)) {
                throw Constants.ERROR_MESSAGE.NODATA;
            } else {
                //clear the description here to make sure previous description is cleared
                this._errorType = null;
                this._updateDescription();
            }
            this._localeChanged = false;
        } catch (err) {
            if (!this._vizFrame) {
                this._invalidateDataset = originalInvalids._invalidateDataset;
                this._invalidateVizType = originalInvalids._invalidateVizType;
                this._invalidateFeeds = originalInvalids._invalidateFeeds;
                this._currentTheme = originalInvalids.theme;
            }
            this._handleErr(err);
        }
    };

    VizFrame.prototype._renderVizFrame = function (renderOptions) {
        if (!this._readyToRender() || (this._isInitThememChanged && !this._themeLoadCompleted)){
            return;
        }
        const templateChanged = this._getTargetTemplate() !== this._currentTemplate;
        if (!this._isInitThememChanged || templateChanged) {
            this._pendingRerendering = true;
            this._themeChangedHandler(false, function(){
                this._pendingRerendering = false;
                this._realRenderVizFrame(renderOptions);
                this._themeLoadCompleted = true;
            }.bind(this));
        } else {
             this._realRenderVizFrame(renderOptions);
        }
    };

    VizFrame.prototype._getTargetTemplate = function() {
        const applicationSet = (this.getUiConfig() || {}).applicationSet;
        const appSetId = applicationSet || "";

        //we need to append mode in newId.
        let modeString = "";
        this._sCurrentScopeChain = this._getScopeString();
        if (this._sCurrentScopeChain) {
            modeString = this._sCurrentScopeChain;
        }

        const theme = Theming.getTheme();
        const targetTemplate = theme + "_" + appSetId + "_" + Constants.TEMPLATE_POSTFIX + modeString;
        return targetTemplate;
    };

    VizFrame.prototype._themeChangedHandler = function(forceUnregister, callback){
        this._isInitThememChanged = true;
        //in librart.js  sap.viz._changeTemplate('standard_fiori') is called whenever the theme is changed
        var applicationSet = (this.getUiConfig() || {}).applicationSet;
        var newId = this._getTargetTemplate();
        if (this._currentTemplate === newId && !forceUnregister) {
            return;
        }
        this._currentTemplate = newId;

        var currentId = sap.viz.api.env.Template.get();
        var extapi = sap.viz.extapi.env.Template;

        // !!TODO the assumption is that ui5 theme parameter and fiori props won't change
        // when change bluecrystal -> hcb -> bluecrystal
        // so we can reuse the template
        // but if user change ui5 theme parameter or fiori between two same themes
        // we need to abandon the old template and generate new one
        if (!extapi.isRegistered(newId) || forceUnregister) {
            extapi.unregister(newId);

            var cvomTemplate;
            if (currentId.indexOf(Constants.TEMPLATE_POSTFIX) > -1 ) {
                cvomTemplate = extapi.getPackage('standard_fiori') || extapi.getPackage('default');
            } else {
                cvomTemplate = extapi.current();
            }

            this._getTemplateProps(applicationSet, cvomTemplate, newId).then(function(){
                //apply new dynamic template
                newId = this._getTargetTemplate();
                var cache = this._templateCache[newId];
                //default tempate has not property
                cvomTemplate.properties = cvomTemplate.properties || {};
                cvomTemplate.scales = cvomTemplate.scales || {};
                for (var chartName in cache) {
                    if (cache.hasOwnProperty(chartName)) {
                        cvomTemplate.properties[chartName] = cache[chartName];
                        // TODO: default property helper define color palette as prop
                        // standard_fiori define them as scale
                        // we prefer the color palette in default property helper
                        // in future, we should refactor
                        var tempFeeds = cvomTemplate.scales[chartName];
                        if (tempFeeds) {
                            var tempIndex = indexOfColorPalette(tempFeeds);
                            if (tempIndex > -1) {
                                tempFeeds.splice(tempIndex, 1);
                            }
                        }
                    }
                }
                cvomTemplate.id = newId;
                cvomTemplate.name = newId;
                extapi.register(cvomTemplate);
                callback();
            }.bind(this)).catch(function (err) {
                return;
            });
        } else {
            callback();
        }
    };

    VizFrame.prototype.onThemeChanged = function(e){
        if (this._app$ && this.$()) {
            this._themeChangedHandler(e.triggeredBy && e.triggeredBy === 'themedesigner',  function() {
                this.invalidate();
                this._themeLoadCompleted = true;
            }.bind(this));
        }
    };

    VizFrame.prototype.onLocalizationChanged = function(event) {
        // If there is only timezone changes, no need to render the vizFrame as the resulut won't change.
        if (event && event.changes && (Object.keys(event.changes).length === 1) && event.changes.timezone) {
            return;
        }
        // Render the chart after language resource is ready.
        if (this._app$ && this.$()) {
            vizLibrary._applyLocale(function() {
                if (this._errorType) {
                    this._localeChanged = true;
                    this.invalidate();
                }
            }.bind(this));
        }
    };

    /**
	 * @deprecated As of version 1.120
	 */
    VizFrame.prototype.onlocalizationChanged = VizFrame.prototype.onLocalizationChanged;

    VizFrame.prototype._isDataReady = function(){
        var ds = this.getDataset();
        return (!ds || !ds.isReady()) ? false : true;
    };

    VizFrame.prototype._getVizDataset = function() {
        var ds = this.getDataset();
        if (this._isExtension()) {
            var metadata = this._getMetadata();
            if (metadata) {
                if (metadata.dataType === 'raw') {
                    return ds.getRawDataset();
                } else if (metadata.dataType === 'sap.viz.api.data.CrosstableDataset') {
                    FeedHelper.updateAxis(ds.getDimensions(), this._getCalculatedType(), this.getFeeds());
                    return ds.getVIZCrossDataset();
                } else {
                    return ds.getVIZFlatDataset();
                }
            } else {
                FeedHelper.updateAxis(ds.getDimensions(), this._getCalculatedType(), this.getFeeds());
                return ds.getVIZCrossDataset();
            }
         } else {
            return ds.getVIZFlatDataset();
        }
    };

    VizFrame.prototype._getVizBindings = function(type, feeds) {
        if (feeds && feeds.length) {
            var lwFeedItems = FeedItem.toLightWeightFmt(feeds);
            lwFeedItems = sap.viz.vizservices.BVRService.suggestFeeds(type, lwFeedItems,
                [{'id' : 'MND', 'type' : 'MND'}]).feedItems;
            if (this._isExtension()) {
                var metadata = this._getMetadata();
                if (metadata) {
                    if (metadata.dataType === 'sap.viz.api.data.CrosstableDataset') {
                        return BindingService.generateBindings(type, lwFeedItems, 'CrossTableDataset');
                    } else {
                        return BindingService.generateBindings(type, lwFeedItems, 'FlatTableDataset');
                    }
                } else {
                    return BindingService.generateBindings(type, lwFeedItems, 'CrossTableDataset');
                }
            } else {
                return BindingService.generateBindings(type, lwFeedItems, 'FlatTableDataset');
            }
        } else {
            return null;
        }
    };

    VizFrame.prototype._getMetadata = function() {
        var metadata;
        try {
            metadata = sap.viz.api.metadata.Viz.get(this._getCalculatedType());
        } catch (err) {
            metadata = null;
        }
        return metadata;
    };

    VizFrame.prototype._onConnectPopover = function(callback) {
        if (arguments.length > 0) {
            this._connectPopover = callback;
        }
        return this._connectPopover;
    };

    VizFrame.prototype._createChildren = function() {
        this._renderVizFrame();
    };

    VizFrame.prototype._updateChildren = function() {
        this._renderVizFrame();
    };

    /*
     * Internal API - supress rendering when visibility: hidden.
     */
    VizFrame.prototype._suppressInvisibleRender = function(bSuppressInvisibleRender) {
        this._bSuppressInvisibleRender = !!bSuppressInvisibleRender;
    };

    /*
     * Internal API - disable interval size check
     */
    VizFrame.prototype._disableIntervalSizeCheck = function(bDisableIntervalSizeCheck) {
        this._bDisableIntervalSizeCheck = !!bDisableIntervalSizeCheck;
    };

    VizFrame.prototype._validateSize = function(event) {
        if (!this._app$ || !this.$() ||
            (event && event.size && (event.size.height == 0 || event.size.width == 0))
            || (this._bSuppressInvisibleRender && (window.getComputedStyle(this.getDomRef(), null).visibility === "hidden"))
            || this.$().prop('offsetHeight') === 0 // do not resize when app is invisible
            ) {
            return;
        }

        var appSize = {
            'width' : this.$().width(),
            'height' : this.$().height()
        };

        if (this._vizFrame) {
            var size = this._vizFrame.size();
            if (!size || size.width !== appSize.width || size.height !== appSize.height) {
                this._vizFrame.size({
                    'width' : appSize.width,
                    'height' : appSize.height,
                    'auto' : !this._bDisableIntervalSizeCheck,
                    'invisibleRender' : true
                });
            }
        }
    };

    VizFrame.prototype._getCalculatedType = function() {
        if (this._isExtension()) {
            return this.getVizType();
        } else {
            return this._getInfoType();
        }
    };

    VizFrame.prototype._isExtension = function() {
        return Constants.CORE_CHART_TYPES.indexOf(this._getInfoType()) === -1;
    };

    VizFrame.prototype._getInfoType = function() {
        var vizType = this.getVizType();
        if (vizType.indexOf("info/") === -1) {
            return 'info/' + vizType;
        } else {
            return vizType;
        }
    };

    VizFrame.prototype._mergeProperties = function(target, properties) {
        return PropertyService.mergeProperties(
            this._getCalculatedType(), target, properties);
    };

    VizFrame.prototype._wrapApi = function(name, afterCallback) {
        this[name] = function() {
            var ret = VizFrame.prototype[name].apply(this, arguments);
            afterCallback();
            return ret;
        }.bind(this);
    };

    VizFrame.prototype._updateDescription = function (desc) {

       var description$ = this._description$;
       var title$ = this._descriptionTitle$;
       var detail$ = this._descriptionDetail$;
       var message$ = this._descriptionMessage$;
       if (!this._description$.length){
              return;
       }
       if (!desc){
              description$.hide();
       } else {
            description$.show();
            title$.empty();
            detail$.empty();
            message$.empty();

            var ariaLabel = "";

            if (desc.title) {
                title$.show().text(desc.title);
                ariaLabel += desc.title + ". ";
            }
            if (desc.detail) {
                detail$.show().text(desc.detail);
                ariaLabel += desc.detail + " ";
            }
            if (desc.message) {
                message$.show().text(desc.message);
                ariaLabel += desc.message;
            }

            description$.attr('aria-label',ariaLabel);
       }
    };

    VizFrame.prototype._handleDescription = function (errorType, err) {
        var desc;
        if (!errorType) {
            return;
        }
        if (this._errorInfo && this._errorInfo[errorType]) {
            desc = {
                message : this._errorInfo[errorType]
            };
        } else if (errorType === Constants.ERROR_TYPE.INVALIDDATA) {
            desc = {
                title: sap.viz.extapi.env.Language.getResourceString("IDS_ERROR_INVALIDE_DATA"),
                detail: sap.viz.extapi.env.Language.getResourceString("IDS_ERROR_INVALIDE_DATA_DESCRIPTION")
            };
        } else if (errorType === Constants.ERROR_TYPE.MULTIPLEUNITS) {
            desc = {
                title: sap.viz.extapi.env.Language.getResourceString("IDS_ERROR_INVALIDE_DATA"),
                detail: sap.viz.extapi.env.Language.getResourceString("IDS_ERROR_INVALIDE_DATA_MULTIPLEUNITS")
            };
        } else if (errorType === Constants.ERROR_TYPE.NODATA) {
            desc = {
                title: sap.viz.extapi.env.Language.getResourceString("IDS_ERROR_ISNODATA")
            };
        } else {
            desc = {
                message: err
            };
        }
        this._updateDescription(desc);
    };

    VizFrame.prototype._handleErr = function(err) {
        var showError = (this.getUiConfig() || {}).showErrorMessage !== false;
        var isNeedFireEvent = true;
        if (showError) {
            if (err === Constants.ERROR_MESSAGE.NODATA) {
                this._errorType = Constants.ERROR_TYPE.NODATA;
                isNeedFireEvent = false;
            } else if (err === Constants.ERROR_MESSAGE.MULTIPLEUNITS){
                this._errorType = Constants.ERROR_TYPE.MULTIPLEUNITS;
                this._clearVizFrame();
            } else {
                this._errorType = err.toString().indexOf("[50060]") >= 0 ? Constants.ERROR_TYPE.INVALIDDATA :  Constants.ERROR_TYPE.OTHERS;
                if (this._vizFrame) {
                    // When switch chartType, VizFrame is updated and the Info vizInstance is recreated. If error happens, the vizInstance is not be created, but some nodes may have been appended in the dom without being cleared(BITSDC2-4741). We should empty the whole infoDOM manually, otherWise the chart will be drawn in wrong place.
                    this._vizFrame$.find(".v-info").remove();
                } else {
                    this._clearVizFrame();
                }
            }
            this._handleDescription(this._errorType, err);
        }

        if (isNeedFireEvent) {
            this.fireEvent('renderFail', {
                'id' : 'renderFail',
                'error' : err
            });
        }
    };

    VizFrame.prototype._clearVizFrame = function() {
        //The error happens before updateVizFrame is called, we should only destroy this._vizFrame to avoid other global variances(like popover) are lost when user update chart(BITSDC2-5905).
        if (this._vizFrame) {
            this._vizFrame.destroy();
            this._vizFrame = null;
            this._invalidateFeeds = true;
        }
        // If the error happens when create LightWeight VizFrame. Instance has not been created, so the dom can't be destroyed by lightWeightUVB(BITSDC2-3996). We need to clear the content of vizframeDOM manually.
        this._vizFrame$.empty();
        Theming.detachThemeScopingChanged(this._scopingChangedFun);
    };

    /*
     * Internal API - set/get runtime scales
     */
    VizFrame.prototype._runtimeScales = function(aRuntimeScales, bSuppressInvalidate) {
        if (arguments.length === 0) {
            return this._vizFrame ? this._vizFrame.runtimeScales() : this._aRuntimeScales;
        } else if (aRuntimeScales) {
            this._aRuntimeScales = [].concat(aRuntimeScales);
            if (!bSuppressInvalidate) {
                this.invalidate();
            }
        }
    };

    /*
     * Internal API - get zoom information.
     * @return {object} the zooming enablement and current zooming level of VizFrame.
     */
    VizFrame.prototype._getZoomInfo = function() {
        var zoomInOut, enabled, currentZoomLevel, zoomInfo, states = this._states();
        if (states) {
            zoomInOut = states.zoomInOut;
            if (zoomInOut) {
                enabled =  zoomInOut.enabled;
                currentZoomLevel = zoomInOut.currentZoomLevel;
            } else {
                enabled = false;
                currentZoomLevel = null;
            }
            zoomInfo =  {
                enabled: enabled,
                currentZoomLevel: currentZoomLevel
            };
        } else {
            zoomInfo = {};
        }
        return zoomInfo;
    };

    /*
     * Internal API - set/get status
     */
    VizFrame.prototype._states = function () {
        var result;
        if (this._vizFrame) {
            result = this._vizFrame.states.apply(this._vizFrame, arguments);
        }
        return result === this._vizFrame ? this : result;
    };

    /*
     * Internal API - set/get ready to render flag for analytic chart to control the rendering workflow
     */
    VizFrame.prototype._readyToRender = function (readyToRender) {
        if (arguments.length === 0) {
            return this._bReadyToRender;
        } else {
            this._bReadyToRender = readyToRender;
        }

    };

    //description for demokit explored
    /**
     * Set whether to enable overlay or not.
     * If the value is true, the chart will be blocked with a transparent overlay.
     *
     * @public
     * @function
     * @name sap.viz.ui5.controls.VizFrame#setBlocked
     * @param {boolean} [bBlocked] New value for whether to enable visibility of overlay.
     */

    // setBlocked method can be called directly here through sap/ui/core/Control.

    return VizFrame;
});
