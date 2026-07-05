/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.controls.VizSlider.
sap.ui.define([
    'sap/ui/core/Control',
    './VizFrame',
    './VizRangeSlider',
    './common/utils/Constants',
    'sap/ui/Device',
    "sap/ui/thirdparty/jquery",
    "sap/base/util/deepEqual",
    "./VizSliderRenderer"
], function(BaseControl, VizFrame, VizRangeSlider, Constants, Device, jQuery, deepEqual) {
    "use strict";

    var DEFAULTPROPERTY =  {
            plotArea:{
                dataLabel:{visible:false}
            },
            legend:{visible:false},
            categoryAxis:{visible:false},
            valueAxis:{title:{visible:false}},
            title:{visible:false},
            interaction:{noninteractiveMode:true},
            timeAxis:{visible:false}
        };
    /**
     * Constructor for a new ui5/controls/VizSider.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * VizSlider is a viz control with range slider that provide data range selection.
     * @extends sap.ui.core.Control
     *
     * @constructor
     * @public
     * @since 1.51.0
     * @alias sap.viz.ui5.controls.VizSlider
     */
    var VizSlider = BaseControl.extend("sap.viz.ui5.controls.VizSlider", { metadata : {

        library : "sap.viz",
        properties : {

            /**
             * Type of chart. User can pass 'chartType' or 'info/chartType'. For example both 'bar' and 'info/bar' will create a info bar chart.
             * Supported chart type: column, line, timeseries_column, timeseries_line
             */
            vizType : {type : "string", group : "Misc", defaultValue : "column"},
            /**
             * Configuration for initialization to VizControl. This property could only set via settings parameter in Constructor.
             */
            uiConfig : {type : "object", group : "Misc", defaultValue : null},

            /**
             * Width of the VizControl as a CSS size.
             */
            width : {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : '800px'},

            /**
             * Height of the VizControl as a CSS size.
             */
            height : {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : '200px'},

            /**
             * Set valueAxis visible or not
             */
            valueAxisVisible:{type : "boolean", group : "Misc", defaultValue: true},
                        /**
             * Set percentage label of range slider visible or not
             */
            showPercentageLabel : {type : "boolean", group : "Appearance", defaultValue: true},
            /**
             * Set start end label of range slider visible or not
             */
            showStartEndLabel : {type: "boolean", group : "Appearance", defaultValue : true},
            /**
             * Set start end date of range slider. Supported chart type: timeseries_column, timeseries_line
             */
            range : {type : "object", group : "Appearance", defaultValue : null},
            /**
             * Set selected range of Chart with categorical axis. Supported chart type: column, line
             * @private
             */
            _categoryRange : {type : "object", group : "Appearance", defaultValue : null, visibility: "hidden"}
        },
        aggregations: {
            /** Internal VizFrame instance which does the actual rendering work. */
            _vizFrame  : {type: "sap.viz.ui5.controls.VizFrame", multiple: false, visibility: "hidden"},
            _rangeSlider: {type: "sap.viz.ui5.controls.VizRangeSlider", multiple: false, visibility: "hidden"},
            /**
             * Dataset for VizSlider.
             */
            dataset : {type : "sap.viz.ui5.data.Dataset", multiple : false},

            /**
             * All feeds for VizSlider.
             */
            feeds : {type : "sap.viz.ui5.controls.common.feeds.FeedItem", multiple : true, singularName : "feed"}
        },

        events:{
            /**
             * Event fires when selected range changes.
             * Data structure For Time chart:
             * {
             *  start: {Date: 1422181498387},
             *  end: {Date: 1422049107429}
             * }.
             * For column and line Chart:
             * {
             *   "data":[{"Country":"Canada"}, {"Country":"China"},{"Country":"France"},
             *           {"Country":"Germany"},{"Country":"India"}]
             * }.
             */
            rangeChanged:{}
        }
    }});



    VizSlider.prototype.applySettings = function() {
        BaseControl.prototype.applySettings.apply(this, arguments);
        var oVizFrame = new VizFrame({
            width: this.getWidth(),
            height: this.getHeight(),
            vizType: this.getVizType(),
            uiConfig: this.getUiConfig()
        });

        oVizFrame.attachRenderComplete( updateRangeSlider.bind(this));

        var  oRangeSlider = new VizRangeSlider({
            visible:false,
            showAdvancedTooltip:false,
            showHandleTooltip:false
        });
        oRangeSlider.setParentFrame(this);

        this.setAggregation("_vizFrame", oVizFrame);
        this.setAggregation("_rangeSlider", oRangeSlider);
        oRangeSlider.attachChange(processRangeData.bind(this));
    };
    var SUPPORTTYPES = [
                      "info/column",
                      "info/line",
                      "info/timeseries_line",
                      "info/timeseries_column"
                      ];

    VizSlider.prototype.setVizType = function(sVizType) {
        if (sVizType.indexOf("info/") !== 0){
            sVizType = "info/" + sVizType;
        }
        if (SUPPORTTYPES.indexOf(sVizType) === -1){
            sVizType = "info/null";
        }
        this.setProperty('vizType', sVizType);
        return this;
    };

    VizSlider.prototype.getDataset = function(dataset){
       var vizFrame = this._getVizFrame();
       return (vizFrame && vizFrame.getDataset()) || this.getAggregation("dataset");

    };

    VizSlider.prototype.addFeed = function(feed){
        var vizFrame = this._getVizFrame();
        if (vizFrame){
            vizFrame.addFeed(feed);
        } else {
            this.addAggregation("feeds", feed);
        }
        return this;
    };

    VizSlider.prototype.removeFeed = function(feed){
        var vizFrame = this._getVizFrame();
        if (vizFrame){
            vizFrame.removeFeed(feed);
        } else {
            this.removeAggregation("feeds", feed);
        }
        return this;
    };

    VizSlider.prototype.removeAllFeeds = function(){
        var vizFrame = this._getVizFrame();
        if (vizFrame){
            vizFrame.removeAllFeeds();
        } else {
            this.removeAllAggregation("feeds");
        }
        return this;
    };

    VizSlider.prototype.getFeeds = function(){
        var vizFrame = this._getVizFrame();
        return (vizFrame && vizFrame.getFeeds()) || this.getAggregation("feeds");
    };


    VizSlider.prototype.exit = function() {

        var oVizFrame = this._getVizFrame();
        oVizFrame && oVizFrame.detachRenderComplete(updateRangeSlider.bind(this), this);
        var rangeSlider = this.getAggregation("_rangeSlider");
        rangeSlider && rangeSlider.detachChange(processRangeData.bind(this));

    };


    VizSlider.prototype._getVizFrame = function() {
        return this.getAggregation("_vizFrame");
    };


    VizSlider.prototype._getRangeSlider = function() {
        return this.getAggregation("_rangeSlider");
    };

    VizSlider.prototype.onAfterRendering = function(){
        var oVizFrame = this._getVizFrame();
        var property = {valueAxis:{visible:  this.getProperty("valueAxisVisible")}};
        property = jQuery.extend(true, {}, property, DEFAULTPROPERTY);
        oVizFrame.setVizProperties(property);
        oVizFrame.setUiConfig(this.getProperty("uiConfig"));
        oVizFrame.setVizType(this.getProperty("vizType"));
        oVizFrame.setHeight(this.getProperty("height"));
        oVizFrame.setWidth(this.getProperty("width"));

        var dataset = this.getAggregation("dataset");
        if (dataset){
            this.removeAggregation("dataset");
            oVizFrame.setDataset(dataset);
        }

        var feeds = this.getAggregation("feeds");
        if (feeds){
            this.removeAllAggregation("feeds");
            oVizFrame.removeAllFeeds();
            for (var i = 0; i < feeds.length; ++i){
                oVizFrame.addFeed(feeds[i]);
            }
        }
        var rangeSlider = this._getRangeSlider();
        rangeSlider.setShowStartEndLabel(this.getProperty("showStartEndLabel"));
        rangeSlider.setShowPercentageLabel(this.getProperty("showPercentageLabel"));
    };

    /**
     * Set start end date of range slider. Supported chart type: timeseries_column, timeseries_line.
     *
     * @example
     * // VizSlider required from "sap/viz/ui5/controls/VizSlider"
     * var vizSlider = new VizSlider(...);
     * var range = {
     *     'start' : timestamp,
     *     'end' : timestamp
     * };
     * vizSlider.setRange(range);
     *
     * @param {object} range  {start : timestamp, end : timestamp}
     * @returns {this} Reference to this in order to allow method chaining
     * @public
     * @override
     */
    VizSlider.prototype.setRange = function(range) {

        this.setProperty("range",range);

        // if user set range twice with same value, ui5 will not rerender vizslider
        // however there might be a drag behavior between them
        // so vizslider have to invalidate forcely
        this.invalidate();

        if ( this._getVizFrame()){
            if (this._getVizFrame()._vizFrame){
               updateRangeState.call(this,range);
            }
        }

        return this;
    };

    /**
     * Set selected range of Chart with categorical axis. Supported chart type: column, line
     *
     * @example
     *
     * // VizSlider required from "sap/viz/ui5/controls/VizSlider"
     * var vizSlider = new VizSlider(...);
     * var range = {
     *     'start' : {Country: "China"},
     *     'end' : {Country: "Germany"}
     * };
     * vizSlider._setCategoryRange(range);
     *
     * @param {object} categoryRange  {start : object, end : object}
     * @returns {this} Reference to this in order to allow method chaining
     * @private
     * @override
     */
    VizSlider.prototype._setCategoryRange = function(categoryRange) {

        this.setProperty("_categoryRange", categoryRange);

        // if user set range twice with same value, ui5 will not rerender vizslider
        // however there might be a drag behavior between them
        // so vizslider have to invalidate forcedly
        this.invalidate();

        if ( this._getVizFrame()){
            if (this._getVizFrame()._vizFrame){
               updateCategoryRangeState.call(this, categoryRange);
            }
        }

        return this;
    };

    function checkVizTypeSupport(){
        var type = this.getVizType();
        return type === "info/timeseries_column" || type === "info/timeseries_line";
    }

    function checkCategoryVizTypeSupport(){
        var type = this.getVizType();
        return type === "info/column" || type === "info/line";
    }

    // the return value of oVizFrame._getDataRange() contains different types of Date
    function getFirstValue(obj){
        return obj[Object.keys(obj)[0]];
    }

    /**
     * Get start end date of range slider. Supported chart type: timeseries_column, timeseries_line.
     *
     * @public
     * @returns {object} range : {start : timestamp, end : timestamp}
     * @override
     */
    VizSlider.prototype.getRange = function() {

        if (!checkVizTypeSupport.apply(this)) {
            return null;
        }

        return this.rangeState;
    };

    /**
     * Get selected range of Chart with categorical axis. Supported chart type: column, line.
     *
     * @private
     * @returns {object} range : {start : object, end : object}
     * @override
     */
    VizSlider.prototype._getCategoryRange = function() {

        if (!checkCategoryVizTypeSupport.apply(this)) {
            return null;
        }

        return this.categoryRangeState;
    };

    /**
     * Get the handle's tooltip value
     * @private
     */
    VizSlider.prototype._getTooltipContent = function(start, end, position) {
        var min = start, max = end;
        if (checkCategoryVizTypeSupport.apply(this)) {
            if (position === "end" && max - min > 1) {max--;}
        }
        var vizFrame = this._getVizFrame();
        return vizFrame._getDataRange(min, max).displayValues[position];
    };

    function updateRangeState(range){
        var rangeSlider = this._getRangeSlider();
        var vizFrame = this._getVizFrame();
        rangeSlider.setRange(calcPercentage.call(this,range));
        //always get current rangestamp through get api
        var curPercentRange = rangeSlider.getRange();
        var dataRange = vizFrame._getDataRange(curPercentRange[0],curPercentRange[1]);
        this.rangeState = {start:getFirstValue(dataRange.start),end:getFirstValue(dataRange.end)};
    }

    function updateCategoryRangeState(categoryRange) {
        var rangeSlider = this._getRangeSlider();
        var vizFrame = this._getVizFrame();
        rangeSlider.setRange(calcCategoryPercentage.call(this, categoryRange));
        var curPercentRange = rangeSlider.getRange();
        var dataRange = vizFrame._getDataRange(curPercentRange[0] + 1, curPercentRange[1] - 1);
        this.categoryRangeState = {start:dataRange.data[0], end:dataRange.data[dataRange.data.length - 1]};
    }

    function calcPercentage(initRange){

        if (!checkVizTypeSupport.apply(this)) {
            return null;
        }


        if ( !initRange || ( !("start" in initRange) && !("end" in initRange) )) {
            return [0,100];
        }

        var rangeStart = new Date(initRange.start).getTime();
        var rangeEnd = new Date(initRange.end).getTime();

        // TODO: replace this logic with a better implement in future
        var totalRange = this._getVizFrame()._getDataRange(0, 100);
        var currRange = this.getRange();
        var totalStart = getFirstValue(totalRange.start);
        var totalEnd = getFirstValue(totalRange.end);

        if (!currRange) {
            currRange = {};
            currRange.start = totalStart;
            currRange.end = totalEnd;
        }
        rangeStart = isNaN(rangeStart) ? currRange.start : rangeStart;
        rangeEnd = isNaN(rangeEnd) ? currRange.end : rangeEnd;

        if ( rangeStart < rangeEnd && rangeStart < totalEnd && rangeEnd > totalStart ) {
            rangeStart = Math.max(rangeStart, totalStart);
            rangeEnd = Math.min(rangeEnd, totalEnd);
            var total = totalEnd - totalStart;
            return  [( rangeStart - totalStart ) / total * 100,
                     ( rangeEnd - totalStart ) / total * 100];
        }
        return [0,100];
    }

    function calcCategoryPercentage(initRange) {
        if (!checkCategoryVizTypeSupport.apply(this)) {
            return null;
        }

        if ( !initRange || ( !("start" in initRange) && !("end" in initRange) )) {
            return [0,100];
        }

        var totalRange = this._getVizFrame()._getDataRange(0, 100);
        var total = totalRange.data.length;
        var totalStart = totalRange.data[0];
        var totalEnd = totalRange.data[total - 1];
        var currRange = this._getCategoryRange() || {
            start: totalStart,
            end: totalEnd
        };

        var rangeStart = initRange.start || currRange.start;
        var rangeEnd = initRange.end || currRange.end;
        var rangeStartIndex = -1, rangeEndIndex = -1;
        totalRange.data.forEach(function(data, index) {
            if (deepEqual(rangeStart, data)) {
                rangeStartIndex = index;
            }
            if (deepEqual(rangeEnd, data)) {
                rangeEndIndex = index + 1;
            }
        });

        if (rangeStartIndex < rangeEndIndex && rangeStartIndex < total &&
            rangeEndIndex > 0) {
            rangeStartIndex = Math.max(rangeStartIndex, 0);
            rangeEndIndex = Math.min(rangeEndIndex, total);
            return [rangeStartIndex / total * 100,
                    rangeEndIndex / total * 100];
        }
        return [0, 100];
    }

    function updateRangeSlider(){

        var sizeInfo = this._getVizFrame()._states().plot.sizeInfo;
        var oVizFrame = this._getVizFrame();
        this._curRange = [];

        var rangeSlider = this._getRangeSlider();
        if (sizeInfo){
            rangeSlider.setWidth(sizeInfo.width + "px");
            rangeSlider.setHeight( sizeInfo.height + "px");
            rangeSlider.setLeft(sizeInfo.x + "px");
            rangeSlider.setTop(sizeInfo.y + "px");
            rangeSlider.setVisible(true);
            rangeSlider.invalidate();

            //update rangeState when user update rangeSlider
            if (checkVizTypeSupport.apply(this)){

                var range = this.rangeState ? this.rangeState : this.getProperty("range");
                updateRangeState.call(this,range);

            }
            if (checkCategoryVizTypeSupport.apply(this)){
                var categoryRange = this.categoryRangeState ? this.categoryRangeState : this.getProperty("_categoryRange");
                updateCategoryRangeState.call(this, categoryRange);

            }
        } else {
            rangeSlider.setVisible(false);
        }

        // Customize chart title of vizFrame to support screen reader
        oVizFrame._setTitleAria("A noninteractive " + oVizFrame._getMetadata().name + " with Range Slider ");
    }

    function processRangeData(e, data){

        var range = e.getParameters().range;
        if (this._curRange[0] === range[0] && this._curRange[1] === range[1]){
            return;
        } else {
            var vizFrame = this._getVizFrame();
            var dataRange = vizFrame._getDataRange(range[0], range[1]);
            //update rangeState when user drags vizslider
            if (checkVizTypeSupport.apply(this)){
                this.rangeState = {start:getFirstValue(dataRange.start),end:getFirstValue(dataRange.end)};
            }
            if (checkCategoryVizTypeSupport.apply(this)) {
                if (range[1] - range[0] > 1) {
                    dataRange = vizFrame._getDataRange(range[0], range[1] - 1);
                }
                this.categoryRangeState = {start:dataRange.data[0], end:dataRange.data[dataRange.data.length - 1]};
            }
            this._curRange[0] = range[0];
            this._curRange[1] = range[1];
            delete dataRange.displayValues;
            this.fireEvent("rangeChanged",  {data:dataRange});
        }

    }

    return VizSlider;
});
