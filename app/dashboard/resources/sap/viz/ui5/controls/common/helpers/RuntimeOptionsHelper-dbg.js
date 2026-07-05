/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 * set specific properties to align the Fiori UX standard at runtime according to chart type and feeding
 */

sap.ui.define(["sap/ui/thirdparty/jquery"], function(jQuery) {
    "use strict";

    var RuntimeOptionsHelper = {};

    RuntimeOptionsHelper.decorateFiori = function(options, feeds, vizProp) {
        return RuntimeOptionsHelper._processCategoryTicker(options, feeds, vizProp);
    };

    RuntimeOptionsHelper.processBulletProperty = function(savedOptions, inputOptions){
        var plotArea = inputOptions.plotArea;
        if (plotArea){
            var keys = ['colorPalette', 'actualColor', 'additionalColor', 'forecastColor'];
            for (var i = 0; i < keys.length; ++i){
                 if (plotArea.hasOwnProperty(keys[i]) ){
                    if (plotArea[keys[i]]){
                        savedOptions.plotArea[keys[i]] = plotArea[keys[i]];
                    } else {
                        delete savedOptions.plotArea[keys[i]];
                    }
                }
            }

        }
    };

    RuntimeOptionsHelper.processWaterfallProperty = function(savedOptions, inputOptions){
        var plotArea = inputOptions.plotArea;
        if (plotArea){
            if (plotArea.dataLabel && plotArea.dataLabel.hasOwnProperty('showRecap')) {
                jQuery.extend(true, savedOptions.plotArea, {
                    dataLabel: {
                        showRecap: plotArea.dataLabel.showRecap
                    }
                });
            } else {
                if (savedOptions.plotArea.dataLabel &&
                    savedOptions.plotArea.dataLabel.hasOwnProperty('showRecap')) {
                    delete savedOptions.plotArea.dataLabel.showRecap;
                }
            }

            if (plotArea.dataPoint && plotArea.dataPoint.color &&
                plotArea.dataPoint.color.hasOwnProperty('isSemanticColoring')) {
                jQuery.extend(true, savedOptions.plotArea, {
                    dataPoint: {
                        color: {
                            isSemanticColoring: plotArea.dataPoint.color.isSemanticColoring
                        }
                    }
                });
            } else {
                if (savedOptions.plotArea.dataPoint && savedOptions.plotArea.dataPoint.color &&
                    savedOptions.plotArea.dataPoint.color.hasOwnProperty('isSemanticColoring')) {
                    delete savedOptions.plotArea.dataPoint.color.isSemanticColoring;
                }
            }
        }
    };

    RuntimeOptionsHelper.decorateBullet = function(options, feeds) {
        if (!feeds || feeds.length === 0) {
            return;
        }

        jQuery.extend(true, options.properties, {plotArea:{}});
        var plotArea = options.properties.plotArea;

        if (plotArea.colorPalette ){
            if (!plotArea.actualColor || plotArea.actualColor.length === 0){
                plotArea.actualColor = [plotArea.colorPalette[0]];
            }

            if (!plotArea.additionalColor || plotArea.additionalColor.length === 0){
                plotArea.additionalColor = [plotArea.colorPalette[1]];
            }
        }

        var num = feeds.length;

        var bOldStyle = false;
        var primaryNum = 0;
        var otherNum = 0;
        var bHasColor = 0;
        for (var i = 0; !bOldStyle && i < num; ++i){
             var id = feeds[i].getUid();
             var values = feeds[i].getValues();

             if (values && values.length){
                 switch (id){
                    case 'color':
                        bHasColor = true;
                        break;
                    case 'primaryValues':
                        bOldStyle = true;
                        break;
                    case 'actualValues':
                        primaryNum += values.length;
                        break;
                    case 'additionalValues':
                    case 'forecastValues':
                        otherNum += values.length;
                        break;
                    default:
                        break;
                 }
             }
        }

        if (bOldStyle || (!bHasColor && primaryNum < 2) || otherNum === 0){
            if (!plotArea.additionalColor){
                 plotArea.additionalColor = ["sapUiChartPaletteSequentialHue2Light1"];
            }

            if (!plotArea.forecastColor){
                 plotArea.forecastColor = ["sapUiChartPaletteSequentialNeutralLight3"];
            }

            if (!plotArea.actualColor){
                 plotArea.actualColor = ["sapUiChartPaletteSequentialHue1Light1",
                                "sapUiChartPaletteQualitativeHue2",
                                "sapUiChartPaletteQualitativeHue3",
                                "sapUiChartPaletteQualitativeHue4",
                                "sapUiChartPaletteQualitativeHue5",
                                "sapUiChartPaletteQualitativeHue6",
                                "sapUiChartPaletteQualitativeHue7",
                                "sapUiChartPaletteQualitativeHue8",
                                "sapUiChartPaletteQualitativeHue9",
                                "sapUiChartPaletteQualitativeHue10",
                                "sapUiChartPaletteQualitativeHue11",
                                "sapUiChartPaletteQualitativeHue12",
                                "sapUiChartPaletteQualitativeHue13",
                                "sapUiChartPaletteQualitativeHue14",
                                "sapUiChartPaletteQualitativeHue15",
                                "sapUiChartPaletteQualitativeHue16",
                                "sapUiChartPaletteQualitativeHue17",
                                "sapUiChartPaletteQualitativeHue18",
                                "sapUiChartPaletteQualitativeHue19",
                                "sapUiChartPaletteQualitativeHue20",
                                "sapUiChartPaletteQualitativeHue21",
                                "sapUiChartPaletteQualitativeHue22"];
            }

        } else {
            if (!plotArea.additionalColor){
                 plotArea.additionalColor = ["sapUiChartPaletteSequentialHue1Light2",
                                        "sapUiChartPaletteSequentialHue2Light2",
                                        "sapUiChartPaletteSequentialHue3Light2",
                                        "sapUiChartPaletteSequentialNeutralLight2"];
            }

            if (!plotArea.forecastColor){
                 plotArea.forecastColor = ["sapUiChartPaletteSequentialHue1Light2",
                                     "sapUiChartPaletteSequentialHue2Light2",
                                     "sapUiChartPaletteSequentialHue3Light2",
                                     "sapUiChartPaletteSequentialNeutralLight2"];
            }
            if (!plotArea.actualColor){
                 plotArea.actualColor = ["sapUiChartPaletteSequentialHue1",
                                    "sapUiChartPaletteSequentialHue2",
                                    "sapUiChartPaletteSequentialHue3",
                                    "sapUiChartPaletteSequentialNeutral"];
            }
        }

        return options;
    };

    /**
     *fix BITSDC2-4455, when change chart type from bullet to timebullet,
     *properties 'actualColor/additionalColor' will be cached for timebullet.
     *so apply template color for timebullet chart
     *restriction: if customer has already set actualColor/additionalColor for bulllet, customer settings will be overwrite
    */
    RuntimeOptionsHelper.decorateTimeBullet = function(options) {
        jQuery.extend(true, options.properties, {plotArea:{}});
        var plotArea = options.properties.plotArea;
        if (!plotArea.actualColor) {
          plotArea.actualColor = ["sapUiChartPaletteSequentialHue1",
            "sapUiChartPaletteSequentialHue2",
            "sapUiChartPaletteSequentialHue3",
            "sapUiChartPaletteSequentialNeutral"];
        }

        if (!plotArea.additionalColor) {
          plotArea.additionalColor = ["sapUiChartPaletteSequentialHue1Light2",
            "sapUiChartPaletteSequentialHue2Light2",
            "sapUiChartPaletteSequentialHue3Light2",
            "sapUiChartPaletteSequentialNeutralLight2"];
        }
    };

    RuntimeOptionsHelper.decorateWaterfall = function(options, feeds) {
        if (!feeds || feeds.length === 0) {
            return;
        }
        var bMultiSeries = false;
        for (var i = 0; i < feeds.length; i++) {
             var id = feeds[i].getUid();
             var values = feeds[i].getValues();
             if (id === 'valueAxis' && values.length > 1) {
                bMultiSeries = true;
             } else if (id === 'color' && values.length > 0) {
                bMultiSeries = true;
             }
        }

        jQuery.extend(true, options.properties, {
            plotArea:{
                dataLabel: {
                    showRecap: bMultiSeries
                },
                dataPoint: {
                    color: {
                        isSemanticColoring: !bMultiSeries
                    }
                }
            }
        });
    };

    RuntimeOptionsHelper._processCategoryTicker = function(options, feeds, vizProp){
        if (!feeds || feeds.length === 0) {
            return;
        }

        // Fix BITSDC2-4741, when in analytical chart
        // switch chart type from timeseries_stacked_column (invalid data) to stacked_bar
        // the categoryAxis.axisTick.visible should be false.
        var oVizProperties = {};
        jQuery.extend(true, oVizProperties, options.properties, {categoryAxis:{axisTick:{}}});
        var axis2TickProp;
        var type = options.type;
        if (type === "info/heatmap"){
            jQuery.extend(true, oVizProperties, {categoryAxis2:{axisTick:{}}});
            axis2TickProp =  oVizProperties.categoryAxis2.axisTick;
        }
        var axisTickProp = oVizProperties.categoryAxis.axisTick;


        var len = feeds.length;
        var tickVisible = true;
        var shortTickVisible = null;//null means follow tickVisible
        var i, id, values;

        var measureNum = 0,  //primaryValues or valueAxis
            colorNum = 0, //the num of color feeding
            axisNum = 0,  //the num of feeding on axisLabels or categoryAxis
            actualNum = 0,
            axis2Num = 0,
            hasMNDColor = false,
            hasMNDCategory = false,
            valueAxis2Num = 0;

        for ( i = 0; i < len; ++i){
             id = feeds[i].getUid();
             values = feeds[i].getValues();
             if (!values){
                continue;
             }

             if (id === "primaryValues" || id === "valueAxis"){
                measureNum = values.length;
             } else if (id === "color"){
                colorNum = values.length;
                hasMNDColor = values.indexOf("MeasureNamesDimension") >= 0;
             } else if (id === "axisLabels" || id === "categoryAxis"){
                axisNum = values.length;
                hasMNDCategory = values.indexOf("MeasureNamesDimension") >= 0;
             } else if (id === "actualValues"){
                actualNum = values.length;
             } else if (id === "valueAxis2"){
                valueAxis2Num = values.length;
             } else if (id === "categoryAxis2"){
                axis2Num = values.length;
             }
        }

        var barShapeNum, valueAxis2BarShapeNum;

        if (["info/dual_horizontal_stacked_combination" , "info/dual_stacked_combination"].indexOf(type) >= 0){
            barShapeNum = 1;
            valueAxis2BarShapeNum = 1;
        } else {
            barShapeNum = 1;
            valueAxis2BarShapeNum = 0;
        }

        var shapeArr, num;
        var plotAreaProp = {};
        jQuery.extend(true, plotAreaProp, (vizProp && vizProp.plotArea) || {}, options.properties.plotArea);

        if (plotAreaProp && plotAreaProp.dataShape &&
                plotAreaProp.dataShape.primaryAxis){
            shapeArr = plotAreaProp.dataShape.primaryAxis;
            num = Math.min(shapeArr.length, measureNum);
            barShapeNum = 0;
            for (i = 0; i < num; ++i){
                 if (shapeArr[i] === "bar"){
                    barShapeNum++;
                 }
            }
        }

        if (plotAreaProp && plotAreaProp.dataShape &&
                plotAreaProp.dataShape.secondaryAxis){
            shapeArr = plotAreaProp.dataShape.secondaryAxis;
            num = Math.min(shapeArr.length, valueAxis2Num);
            valueAxis2BarShapeNum = 0;
            for (i = 0; i < num; ++i){
                if (shapeArr[i] === "bar"){
                    valueAxis2BarShapeNum++;
                }
            }
        }
        //we will check whether we need to show short ticks or not.
        //please note we just set "shortTickVisible" to false, or do not set the property,
        //because setting "shortTickVisible" to true may force short ticks visible, even if tickVisible is false.
        var onlyOneBar = barShapeNum + valueAxis2BarShapeNum === 1;

        if (type === "info/column" || type === "info/bar"){
            if (!(colorNum > 1 || (colorNum === 1 && !hasMNDColor) ||
                    (colorNum === 1 && hasMNDColor && measureNum > 1) ||
                    (!hasMNDCategory && !hasMNDColor && measureNum > 1 ))){
                if (axisNum > 1) {
                    shortTickVisible = false;
                } else {
                    tickVisible = false;
                }
            }
        } else if ( ["info/stacked_bar", "info/stacked_column",
                   "info/100_stacked_bar", "info/100_stacked_column",
                   "info/waterfall", "info/horizontal_waterfall"].indexOf(type) >= 0 ){
            if (axisNum > 1) {
                shortTickVisible = false;
            } else {
                tickVisible = false;
            }
        } else if ( ["info/stacked_combination" ,   "info/horizontal_stacked_combination" ,
                   "info/dual_horizontal_stacked_combination" , "info/dual_stacked_combination"].indexOf(type) >= 0){
            if (onlyOneBar){
                if (axisNum > 1) {
                    shortTickVisible = false;
                } else {
                    tickVisible = false;
                }
            }
         } else if (["info/combination", "info/dual_horizontal_combination" , "info/dual_combination"].indexOf(type) >= 0){
             if ( onlyOneBar && (colorNum === 0 || (colorNum === 1 && hasMNDColor ))){
                if (axisNum > 1) {
                    shortTickVisible = false;
                } else {
                    tickVisible = false;
                }
             }
          } else if (type ===  "info/bullet" || type === "info/vertical_bullet"){
            if (colorNum === 0 && actualNum <= 1){
                if (axisNum > 1) {
                    shortTickVisible = false;
                } else {
                    tickVisible = false;
                }
            }
         }

         if (type === "info/heatmap"){
             if (!(axisTickProp.visible === true || axisTickProp.visible === false)){
                 axisTickProp.visible = (axisNum > 1);
             }

             if ( !(axis2TickProp.visible === true || axis2TickProp.visible === false)){
                 axis2TickProp.visible = (axis2Num > 1);
             }

             //for heatmap we do not check colorNum, but always disable short ticks if (axisNum > 1)
             if (axisTickProp.shortTickVisible == null && axisNum > 1) {
                 axisTickProp.shortTickVisible = false;
             }

             if (axis2TickProp.shortTickVisible == null && axis2Num > 1) {
                 axis2TickProp.shortTickVisible = false;
             }

         } else {
             if (!(axisTickProp.visible === true || axisTickProp.visible === false)) {
                 axisTickProp.visible = tickVisible;
             }
             if (axisTickProp.shortTickVisible == null) {
                 axisTickProp.shortTickVisible = shortTickVisible;
             }
         }
         return oVizProperties;
    };

    return RuntimeOptionsHelper;
});
