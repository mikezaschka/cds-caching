/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/thirdparty/jquery"], function(jQuery) {
    "use strict";

    var FormatDataUtil = {};

    /**
     * Create a new copy of data with all values formatted using "formatString" property
     *
     * @param {object} options
     * @param {object} options.data original data to format
     * @param {object} config
     * @returns {object} A copy of the original data with all values formatted
     */
    FormatDataUtil.formatData = function (options, config) {
        if (!(options.data && options.data.val && options.data.val.length > 0)) {
            return options.data;
        }
        var data = options.data,
            formatFn = sap.viz.api.env.Format.format,
            formatted = jQuery.extend(true, {}, data),
            timeMeasureIdx = formatted.val.hasOwnProperty("timeMeasure") ? formatted.val.timeMeasure : -1,
            timeDimensions = formatted.val.hasOwnProperty("timeDimensions") ? formatted.val.timeDimensions : [],
            formatString = config.formatString,
            catchAll = null,
            byMeasure = {},
            pattern;

        if (typeof formatString === "string") {
            catchAll = formatString;
        } else if (formatString instanceof Object) {
            if (formatString.formatPattern || formatString.dataUnit) {
                catchAll = formatString;
            } else {
                byMeasure = formatString;
            }
        }

        // convert value of time measure from milliseconds int to javascript Date object
        //Handle measure is Time.
        if (timeMeasureIdx !== -1) {
            var timeValue = formatted.val.filter(function(i) {
                return (i.type) && (i.type.toLowerCase() === "measure");
            })[timeMeasureIdx];
            timeValue.value = new Date(timeValue.value);
        }

        if (options.timeTooltipData && config.chartType.indexOf('time') > -1) {
            //Time series chart and have time tooltip.
            var hasTimeFormatString = false;
            if (formatString) {
                timeDimensions.forEach(function(index){
                    if (formatted.val[index] && formatted.val[index].id) {
                        var formatObject = byMeasure[formatted.val[index].id];
                        if (formatObject &&
                            (typeof formatObject === "string" || formatObject.formatPattern)) {
                            hasTimeFormatString = true;
                        }
                    }
                });
            }
            if (hasTimeFormatString) {
                //Use Customer format string
                formatted.val.forEach(function(i, index){
                    if (timeDimensions.indexOf(index) > -1) {
                        //popover didnot accept time as dimension, so change it to measure.
                        i.type = "measure";
                        i.value = new Date(i.value);
                    }
                });
            } else {
                //Follow chart's format rules
                var tooltipData = jQuery.extend(true, [], options.timeTooltipData);
                tooltipData.forEach(function(i, index) {
                    if (formatted.val[index].dataName) {
                        tooltipData[index].dataName = formatted.val[index].dataName;
                    }
                });
                formatted.val = tooltipData;
                formatted.isTimeSeries = true;
            }
        }

        formatted.val.forEach(function(val, i) {
            if (val.type && val.type.toLowerCase() === "measure") {
                pattern = byMeasure[val.id] || catchAll || val.formatString;

                if (val.bothValue && val.bothValue.primaryKey === 'percentage') {
                    val.value = val.bothValue.percentage;
                    if (!pattern){
                        pattern = {'formatPattern': '0.00%'};
                    }
                } else if (val.strValue){
                    val.value = val.strValue;
                }
                if (pattern) {
                    if ((pattern.formatPattern || pattern.dataUnit)) {
                        //tooltip will render value and unit separately
                        val.value = formatFn(val.value, pattern.formatPattern);
                        var isTimeDim = formatted.val.timeDimensions && formatted.val.timeDimensions.indexOf(i) > -1;
                        if (!isTimeDim) {
                            val.unit = pattern.dataUnit || val.unit;
                        }
                        //get unit from format string or unit binding
                    } else {
                        val.value = formatFn(val.value, pattern);
                    }
                } else {
                    val.value = formatFn(val.value);
                }
            }
        });
        return formatted;
    };

    return FormatDataUtil;
});
