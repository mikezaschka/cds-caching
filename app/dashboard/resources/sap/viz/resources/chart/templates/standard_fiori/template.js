(function() {
    var toString = Object.prototype.toString;
    function isArray(it){
        return toString.call(it) === '[object Array]';
    }
    function isObject(it){
        return toString.call(it) === '[object Object]';
    }
    function _merge(a, b){
        for(var key in b){
            if(isArray(b[key])){
                a[key] = b[key].slice();
            }else if(isObject(b[key])){
                a[key] = a[key] || {};
                _merge(a[key], b[key]);
            }else{
                a[key] = b[key];
            }
        }
        return a;
    }
    function merge(){
        var res = {};
        for(var i = 0; i < arguments.length; ++i){
            _merge(res, arguments[i]);
        }
        return res;
    }

    var axisColor = "#333333";
    var axisGridlineColor = "#d8d8d8";
    var plotColorPalette = ["#5cbae6", "#b6d957", "#fac364", "#8cd3ff", "#d998cb", "#fade64", "#93b9c6", "#d9d6c7", "#52bacc", "#dce65c", "#98aafb"];

    var background = {
        background: {
            border: {
                top: {
                    visible: false
                },
                bottom: {
                    visible: false
                },
                left: {
                    visible: false
                },
                right: {
                    visible: false
                }
            },
            drawingEffect: "normal"
        }
    };

    var titleOpts = {
        title: {
            visible : true
        }
    };

    var legend = {
        legend: {
            selectionFeedback: true,
            drawingEffect: "normal",
            title: {
                visible: false
            },
            marker: {
                shape: "square",
                showLine: true,
                size: 14
            }
        }
    };
    var plotArea = {
        plotArea: {
            drawingEffect: "normal",
            dataPointStyleMode: "override",
            colorPalette: plotColorPalette,
            dataPoint: {
                stroke: {
                    visible : true,
                    color : '#ffffff'
                }
            },
            marker: {
                hoverOnlyMode : false
            },
            dataLabel: {
                distance: 0,
                line: {
                    color: "#e5e5e5",
                    visible: false
                },
                style:{
                    colorRange:"outside",
                    color: "#000000"
                }
            },
            gridline: {
                zeroLine: {
                    unhighlightAxis: false,
                    color: "#666666"
                }
            },
            radius: 0.33
        }
    };

    var generalOpts = {
        general : {
            'groupData' : true,
            'layout' : {
                'padding' : 16,
                'isFixedPadding' : true
            }
        },
        categoryAxis : {
            'title' : {
                'style' : {
                    'color' : "#333",
                    'fontSize' : "12px",
                    'fontWeight' : "regular",
                    'letterSpacing' : "0.5"
                }
            }
        },
        categoryAxis2 : {
            'title' : {
                'style' : {
                    'color' : "#333",
                    'fontSize' : "12px",
                    'fontWeight' : "regular",
                    'letterSpacing' : "0.5"
                }
            }
        },
        valueAxis : {
            'title' : {
                'style' : {
                    'color' : "#333",
                    'fontSize' : "12px",
                    'fontWeight' : "regular",
                    'letterSpacing' : "0.5"
                }
            }
        },
        valueAxis2 : {
            'title' : {
                'style' : {
                    'color' : "#333",
                    'fontSize' : "12px",
                    'fontWeight' : "regular",
                    'letterSpacing' : "0.5"
                }
            }
        },
        timeAxis : {
            'title' : {
                'style' : {
                    'color' : "#333",
                    'fontSize' : "12px",
                    'fontWeight' : "regular",
                    'letterSpacing' : "0.5"
                }
            }
        }
    };

    var interaction = {
        interaction : {
            deselected : {
                stroke : {
                    visible : true,
                    color: '#ffffff'
                },
                opacity : 0.6
            },
            hover : {
                stroke : {
                    color : "#666666"
                }
            },
            selected : {
                stroke : {
                    color : "#666666",
                    width : "2px"
                }
            },
            zoom: {
                enablement: 'enabled',
                direction: 'categoryAxis'
            },
            enableKeyboard: true
        }
    };

    var plotAreaDual = {
        plotArea: {
            dataPointStyleMode: "override",
            dataLabel:{
                style:{
                    colorRange:"outside",
                    color: "#000000"
                }
            },
            dataPoint: {
                stroke: {
                    visible : true,
                    color : '#ffffff'
                }
            },
            marker: {
                hoverOnlyMode : false
            },
            drawingEffect: "normal",
            primaryValuesColorPalette: ["#5cbae5", "#27a3dd", "#1b7eac"],
            secondaryValuesColorPalette: ["#b6d957", "#9dc62d", "#759422"],
            gridline: {
                zeroLine: {
                    unhighlightAxis: false,
                    color: "#666666"
                }
            }
        }
    };

    var zAxis = {
        zAxis: {
            title: {
                visible: true
            },
            color: axisColor
        }
    };

    var axis = {
        title: {
            visible: true
        },
        gridline: {
            color: axisGridlineColor
        },
        color: axisColor
    };

    var showAxisLine = {
        axisline: {
            visible: true
        }
    };

    var showInfoAxisLine = {
        axisLine: {
            visible: true
        }
    };

    var hideAxisLine = {
        axisline: {
            visible: false
        }
    };

    var hideInfoAxisLine = {
        axisLine: {
            visible: false
        }
    };

    var hideAxisTicker = {
        axisTick: {
            visible: false
        }
    };

    var gridline = {
        gridline: {
            type: "line",
            color: axisGridlineColor,
            showLastLine: true
        }
    };

    var verticalGridline = {
        gridline: {
            type: "line",
            color: axisGridlineColor,
            showFirstLine: true

        }
    };

    var dual = {
        title: {
            applyAxislineColor: true
        }
    };

    var defaultInfoOpts = merge(titleOpts, generalOpts);

    var base = merge(background, legend, interaction, plotArea);

    var baseDual = merge(background, legend, interaction, plotAreaDual);

    var horizontalEffect = {
        xAxis: merge(axis, hideAxisLine, gridline),
        yAxis: merge(axis),
        xAxis2: merge(axis, hideAxisLine)
    };

    var horizontalCategoryAxisEffect = {
        categoryAxis:{
            layout:{
                maxWidth : 0.5
            }
        }
    };

    var horizontalDualEffect = merge(horizontalEffect, {
        xAxis: dual,
        xAxis2: dual
    });

    var verticalEffect = {
        yAxis: merge(axis, hideAxisLine, verticalGridline),
        xAxis: axis,
        yAxis2: merge(axis, hideAxisLine)
    };

    var verticalDualEffect = merge(verticalEffect, {
        yAxis: dual,
        yAxis2: dual
    });

    //-------------------------------------------------------

    var barEffect = merge(base, horizontalEffect);

    var bar3dEffect = merge(base, zAxis, horizontalEffect);

    var dualbarEffect = merge(baseDual, horizontalDualEffect);

    var verticalbarEffect = merge(base, verticalEffect);

    var vertical3dbarEffect = merge(base, zAxis, verticalEffect);

    var dualverticalbarEffect = merge(baseDual, verticalDualEffect);

    var stackedbarEffect = merge(base, horizontalEffect);

    var dualstackedbarEffect = merge(baseDual, horizontalDualEffect);

    var stackedverticalbarEffect = merge(base, verticalEffect);

    var areaEffect = merge(base, {
        plotArea: {
            area: {
                stroke: {
                    visible: true,
                    color : '#ffffff'
                }
            }
        }
    });

    var dualstackedverticalbarEffect = merge(baseDual, verticalDualEffect);

    var lineEffect = merge(base, verticalEffect);

    var duallineEffect = merge(baseDual, verticalDualEffect);

    var horizontallineEffect = merge(base, horizontalEffect);

    var dualhorizontallineEffect = merge(baseDual, horizontalDualEffect);

    var combinationEffect = merge(base, verticalEffect);

    var dualcombinationEffect = merge(baseDual, verticalDualEffect);

    var horizontalcombinationEffect = merge(base, horizontalEffect);

    var dualhorizontalcombinationEffect = merge(baseDual, horizontalDualEffect);

    var bubbleEffect = merge(base, {
        yAxis: merge(axis, hideAxisLine, gridline),
        xAxis: axis
    });

    var pieEffect = merge(legend, plotArea, interaction, {
        plotArea: {
            dataLabel: {
                type: "percentage"
            },
            alignment:{
                vertical: "center"
            }
        },
        interaction : {
            hover : {
                stroke : {
                    color : "darken(0%)"
                }
            }
        }
    });

    var pieWithDepthEffect = pieEffect;

    var radarEffect = merge(legend, plotArea, {
        background: {
            visible: false
        },
        plotArea: {
            valueAxis: {
                gridline: {
                    color: axisGridlineColor
                }
            },
            dataline: {
                fill: {
                    transparency: 0
                }
            },
            polarAxis: {
                title: {
                    style: {
                        letterSpacing: "0.5"
                    }
                }
            },
            valueAxis: {
                title: {
                    style: {
                        letterSpacing: "0.5"
                    }
                }
            }
        }
    });

    var mekkoEffect = merge(base, {
        yAxis: merge(axis, hideAxisLine, {
            gridline: {
                type: "line"
            }
        }),
        xAxis: merge(axis, showAxisLine),
        xAxis2: merge(axis, showAxisLine)
    });
    var horizontalmekkoEffect = merge(base, {
        xAxis: merge(axis, hideAxisLine, {
            gridline: {
                type: "line"
            }
        }),
        yAxis: merge(axis, showAxisLine),
        yAxis2: merge(axis, showAxisLine)
    });


    var bulletEffect = merge(legend, background, plotArea, interaction, {
        valueAxis:{
            title :{
                visible :true
            }
        },
        categoryAxis :{
            title :{
                visible : true
            }
        },

        plotArea:{
            dataPoint: {
                stroke: {
                    visible: true,
                    color: "#ffffff"
                }
            },

            actualColor: ["#27a3dd","#9dc62d","#f8ac29", "#848f94"],
            additionalColor:[ "#84caec", "#c6e17d", "#fbd491","#bac1c4"],
            forecastColor:[ "#84caec", "#c6e17d", "#fbd491","#bac1c4"],
            gridline :{
                visible: true
            },
            target : {
                valueColor : "#343434",
                shadowColor : "#ffffff"
            }
        }
    });

    var vizTreemapEffect = {
        legend: {
            title: {
                visible: true
            }
        },
        plotArea:{
            dataLabel:{
                style:{
                    colorRange:"outside",
                    color: "#000000"
                }
            }
        }
    };

    var infoTreemapEffect = merge(legend,{
        plotArea:{
            dataLabel:{
                style:{
                    colorRange:"outside",
                    color: "#000000"
                }
            }
        }
    });

    var datapointColorEffect = {
        plotArea : {
            datapoint : {
                color : {
                    positive : "#61a656",
                    negative : "#d32030",
                    total : "#69767c"
                }
            }
        }
    };

    var waterfallLinkLine = {plotArea:{linkline:{size:2}}};

    var waterfallLegend= {
        legend: {
            visible: true,
            title: {
                visible: true
            },
            label: {
                text: {
                    negativeValue: '< 0',
                    positiveValue: '> 0'
                }
            }
        }
    };

    var waterfallEffect =  infoWaterfall( merge(verticalbarEffect, datapointColorEffect));

    var stackedwaterfallEffect = merge(stackedverticalbarEffect, datapointColorEffect);

    var horizontalwaterfallEffect = infoWaterfall( merge(barEffect, datapointColorEffect));;

    var horizontalstackedwaterfallEffect = merge(stackedbarEffect, datapointColorEffect);

    var gapSpacing = {
        plotArea : {
            gap : {
                barSpacing : 0.5,
                groupSpacing : 0.65
            }
        }
    };

    var gapSpacingPeriodicWaterfall = {
        plotArea : {
            gap : {
                innerGroupSpacing : 0,
                barSpacing : 0.5,
                groupSpacing : 1
            }
        }
    };

    sap.viz.extapi.env.Template.register({
        id: "standard_fiori",
        name: "Default Standard Fiori Template",
        version: "5.13.0",
        properties: {
            'viz/bar': barEffect,
            'viz/3d_bar': bar3dEffect,
            'viz/image_bar': barEffect,
            'viz/multi_bar': barEffect,
            'viz/dual_bar': dualbarEffect,
            'viz/multi_dual_bar': dualbarEffect,
            'viz/column': verticalbarEffect,
            'viz/3d_column': vertical3dbarEffect,
            'viz/multi_column': verticalbarEffect,
            'viz/dual_column': dualverticalbarEffect,
            'viz/multi_dual_column': dualverticalbarEffect,
            'viz/stacked_bar': stackedbarEffect,
            'viz/multi_stacked_bar': stackedbarEffect,
            'viz/dual_stacked_bar': dualstackedbarEffect,
            'viz/multi_dual_stacked_bar': dualstackedbarEffect,
            'viz/100_stacked_bar': stackedbarEffect,
            'viz/multi_100_stacked_bar': stackedbarEffect,
            'viz/100_dual_stacked_bar': dualstackedbarEffect,
            'viz/multi_100_dual_stacked_bar': dualstackedbarEffect,
            'viz/stacked_column': stackedverticalbarEffect,
            'viz/multi_stacked_column': stackedverticalbarEffect,
            'viz/dual_stacked_column': dualstackedverticalbarEffect,
            'viz/multi_dual_stacked_column': dualstackedverticalbarEffect,
            'viz/100_stacked_column': stackedverticalbarEffect,
            'viz/multi_100_stacked_column': stackedverticalbarEffect,
            'viz/100_dual_stacked_column': dualstackedverticalbarEffect,
            'viz/multi_100_dual_stacked_column': dualstackedverticalbarEffect,
            'riv/cbar': merge(legend, plotArea, {
                background: {
                    drawingEffect: "normal"
                },
                yAxis: axis
            }),
            'viz/combination': combinationEffect,
            'viz/horizontal_combination': horizontalcombinationEffect,
            'viz/dual_combination':dualcombinationEffect,
            'viz/dual_horizontal_combination': dualhorizontalcombinationEffect,
            'viz/boxplot': merge(base, {
                yAxis: merge(axis, hideAxisLine, verticalGridline),
                xAxis: axis
            }),
            'viz/horizontal_boxplot': merge(base, {
                xAxis: merge(axis, hideAxisLine, gridline),
                yAxis: axis
            }),
            'viz/waterfall': merge(base, {
                yAxis: merge(axis, hideAxisLine, verticalGridline),
                xAxis: {
                    title: {
                        visible: true
                    },
                    color: axisColor
                }
            }),
            'viz/horizontal_waterfall': merge(base, {
                xAxis: merge(axis, hideAxisLine, gridline),
                yAxis: {
                    title: {
                        visible: true
                    },
                    color: axisColor
                }
            }),

            'viz/stacked_waterfall': stackedverticalbarEffect,
            'viz/horizontal_stacked_waterfall': stackedbarEffect,

            'viz/line': lineEffect,
            'viz/multi_line': lineEffect,
            'viz/dual_line': duallineEffect,
            'viz/multi_dual_line': duallineEffect,
            'viz/horizontal_line': horizontallineEffect,
            'viz/multi_horizontal_line': horizontallineEffect,
            'viz/dual_horizontal_line': dualhorizontallineEffect,
            'viz/multi_dual_horizontal_line': dualhorizontallineEffect,

            'viz/area': lineEffect,
            'viz/multi_area': lineEffect,
            'viz/100_area': lineEffect,
            'viz/multi_100_area': lineEffect,
            'viz/horizontal_area': horizontallineEffect,
            'viz/multi_horizontal_area': horizontallineEffect,
            'viz/100_horizontal_area': horizontallineEffect,
            'viz/multi_100_horizontal_area': horizontallineEffect,
            'viz/pie': pieEffect,
            'viz/multi_pie': pieEffect,
            'viz/donut': pieEffect,
            'viz/multi_donut': pieEffect,
            'viz/pie_with_depth': pieWithDepthEffect,
            'viz/donut_with_depth': pieWithDepthEffect,
            'viz/multi_pie_with_depth': pieWithDepthEffect,
            'viz/multi_donut_with_depth': pieWithDepthEffect,
            'viz/bubble': bubbleEffect,
            'viz/multi_bubble': bubbleEffect,
            'viz/scatter': bubbleEffect,
            'viz/multi_scatter': bubbleEffect,
            'viz/scatter_matrix': bubbleEffect,
            'viz/radar': radarEffect,
            'viz/multi_radar': radarEffect,
            'viz/tagcloud': {
                legend: {
                    title: {
                        visible: true
                    }
                }
            },
            'viz/heatmap': {

                legend: {
                    title: {
                        visible: true
                    }
                },
                xAxis: {
                    title: {
                        visible: true
                    },
                    color: axisColor
                },
                yAxis: {
                    title: {
                        visible: true
                    },
                    color: axisColor
                }
            },
            'viz/treemap': vizTreemapEffect,
            'viz/mekko': mekkoEffect,
            'viz/100_mekko': mekkoEffect,
            'viz/horizontal_mekko': horizontalmekkoEffect,
            'viz/100_horizontal_mekko': horizontalmekkoEffect,
            'viz/number': {
                plotArea: {
                    "colorPalette": plotColorPalette,
                    valuePoint: {
                        label: {
                            fontColor: '#000000'
                        }
                    }
                }
            },

            'info/area': info(areaEffect),
            'info/radar': info(radarEffect),
            'info/column': merge(gapSpacing, info(verticalbarEffect)),
            'info/timeseries_column': merge(gapSpacing, infoTime(verticalbarEffect)),
            'info/timeseries_stacked_column': merge(gapSpacing, infoTime(verticalbarEffect)),
            'info/timeseries_100_stacked_column': merge(gapSpacing, infoTime(verticalbarEffect)),
            'info/bar': merge(gapSpacing, horizontalCategoryAxisEffect, info(barEffect)),
            'info/line': info(lineEffect),
            "info/timeseries_line": infoTimeLine(lineEffect),
            "info/timeseries_combination": merge(gapSpacing,infoTime(combinationEffect)),
            "info/timeseries_stacked_combination": merge(gapSpacing,infoTime(combinationEffect)),
            "info/dual_timeseries_combination": merge(gapSpacing,infoDualTime(dualcombinationEffect)),
            'info/pie': info(pieEffect),
            'info/donut': info(pieEffect),
            'info/scatter': infoBubble(bubbleEffect),
            'info/bubble': infoBubble(bubbleEffect),
            'info/timeseries_scatter': infoTimeBubble(bubbleEffect),
            'info/timeseries_bubble': infoTimeBubble(bubbleEffect),
            'info/stacked_column': merge(gapSpacing, info(stackedverticalbarEffect)),
            'info/stacked_bar': merge(gapSpacing, horizontalCategoryAxisEffect, info(stackedbarEffect)),
            'info/mekko': infoMekko(stackedverticalbarEffect),
            'info/100_mekko': infoMekko(stackedverticalbarEffect),
            'info/horizontal_mekko': merge(horizontalCategoryAxisEffect, infoMekko(stackedbarEffect)),
            'info/100_horizontal_mekko': merge(horizontalCategoryAxisEffect, infoMekko(stackedbarEffect)),
            'info/combination': merge(gapSpacing, info(combinationEffect)),
            'info/stacked_combination': merge(gapSpacing, info(combinationEffect)),
            'info/dual_combination': merge(gapSpacing, infoDual(dualcombinationEffect)),
            'info/dual_stacked_combination': merge(gapSpacing, infoDual(dualcombinationEffect)),
            'info/dual_column': merge(gapSpacing, infoDual(dualverticalbarEffect)),
            'info/dual_line': infoDual(duallineEffect),
            'info/dual_bar': merge(gapSpacing, horizontalCategoryAxisEffect, infoDual(dualbarEffect)),
            'info/100_stacked_column': merge(gapSpacing, info(stackedverticalbarEffect)),
            'info/100_stacked_bar': merge(gapSpacing, horizontalCategoryAxisEffect, info(stackedbarEffect)),
            'info/horizontal_line': merge(horizontalCategoryAxisEffect, info(horizontallineEffect)),
            'info/dual_horizontal_line': merge(horizontalCategoryAxisEffect, infoDual(dualhorizontallineEffect)),
            'info/horizontal_combination': merge(gapSpacing, horizontalCategoryAxisEffect, info(horizontalcombinationEffect)),
            'info/horizontal_stacked_combination': merge(gapSpacing, horizontalCategoryAxisEffect, info(horizontalcombinationEffect)),
            'info/dual_horizontal_combination': merge(gapSpacing, horizontalCategoryAxisEffect, infoDual(dualhorizontalcombinationEffect)),
            'info/dual_horizontal_stacked_combination': merge(gapSpacing, horizontalCategoryAxisEffect, infoDual(dualhorizontalcombinationEffect)),
            'info/treemap': merge(info(infoTreemapEffect), {
                interaction: {
                    deselected: {
                        opacity: 0.6
                    },
                    selected: {
                        stroke: {
                            width: 2,
                            color: "#666666"
                        }
                    },
                    hover: {
                        stroke: {
                            width: 2,
                            color: "#666666"
                        }
                    }
                }
            }),
            'info/timeseries_waterfall':merge(gapSpacingPeriodicWaterfall, infoTime(waterfallEffect)),
            'info/waterfall':merge(gapSpacing, info(waterfallEffect)),
            'info/stacked_waterfall' : merge(gapSpacing, info(stackedwaterfallEffect)),
            'info/horizontal_waterfall': merge(horizontalCategoryAxisEffect, gapSpacing, info(horizontalwaterfallEffect)),
            'info/horizontal_stacked_waterfall': merge(horizontalCategoryAxisEffect, gapSpacing, info(horizontalstackedwaterfallEffect)),

            'info/dual_stacked_bar': merge(gapSpacing, horizontalCategoryAxisEffect, infoDual(dualstackedbarEffect)),
            'info/100_dual_stacked_bar': merge(gapSpacing, horizontalCategoryAxisEffect, infoDual(dualstackedbarEffect)),
            'info/dual_stacked_column': merge(gapSpacing, infoDual(dualstackedverticalbarEffect)),
            'info/100_dual_stacked_column': merge(gapSpacing, infoDual(dualstackedverticalbarEffect)),
            'info/time_bubble': infoBubble(bubbleEffect),
            'info/bullet': merge(info(bulletEffect), {
                categoryAxis: {
                    layout:{
                        maxWidth : 0.5
                    }
                },
                valueAxis: {
                    layout: {
                        position: 'bottom'
                    }
                }
            }),
            'info/timeseries_bullet': infoTime(info(bulletEffect)),
            'info/vertical_bullet': info(bulletEffect),
            'info/heatmap': merge(defaultInfoOpts, legend, {
                plotArea: {
                   dataLabel:{
                        style:{
                            colorRange:"outside",
                            color: "#000000"
                        }
                    },
                    dimensionLabel: {
                        style: {
                            color: null
                        }
                    }
                },
                categoryAxis: {
                    title: {
                        visible : true
                    },
                    axisLine: {
                        visible: false
                    }
                },
                categoryAxis2: {
                    title: {
                        visible : true
                    },
                    axisLine: {
                        visible: false
                    },
                    layout:{
                        maxWidth : 0.5
                    }
                },
                interaction: {
                    deselected: {
                        opacity: 0.6
                    },
                    selected: {
                        stroke: {
                            width: 2,
                            color: "#666666"
                        }
                    },
                    hover: {
                        stroke: {
                            width: 2,
                            color: "#666666"
                        }
                    }
                }
            })
        },

        //v-longtick must be set after v-categoryaxisline
        css: ".v-datapoint .v-boxplotmidline{stroke:#333333}\
         .v-longtick{stroke:#b3b3b3;}",

        // css property not apply for info chart flag
        isBuiltIn : true,

        scales : function() {
            var obj = {};
            var singleChartTypes = [
                "info/column",
                "info/bar",
                "info/line",
                "info/pie",
                "info/donut",
                "info/scatter",
                "info/bubble",
                "info/stacked_column",
                "info/stacked_bar",
                "info/combination",
                "info/stacked_combination",
                "info/100_stacked_column",
                "info/100_stacked_bar",
                "info/mekko",
                "info/100_mekko",
                "info/horizontal_mekko",
                "info/100_horizontal_mekko",
                "info/horizontal_line",
                "info/horizontal_combination",
                "info/horizontal_stacked_combination",
                "info/time_bubble",
                "info/radar"
            ];
            singleChartTypes.forEach(function(e) {
                obj[e] = [{
                    "feed": "color",
                    "palette": plotColorPalette
                }];
            });
            var dualChartTypes = [
                "info/dual_combination",
                "info/dual_stacked_combination",
                "info/dual_column",
                "info/dual_line",
                "info/dual_bar",
                "info/dual_horizontal_line",
                "info/dual_horizontal_combination",
                "info/dual_horizontal_stacked_combination",
                "info/dual_stacked_bar",
                "info/100_dual_stacked_bar",
                "info/dual_stacked_column",
                "info/dual_timeseries_combination",
                "info/100_dual_stacked_column"
            ];
            dualChartTypes.forEach(function(e) {
                obj[e] = [{
                    "feed": "color",
                    "palette": [plotAreaDual.plotArea.primaryValuesColorPalette, plotAreaDual.plotArea.secondaryValuesColorPalette]
                }];
            });
            var heatmap = ['info/heatmap', "info/treemap"];
            heatmap.forEach(function(e) {
                obj[e] = [{
                    feed: "color",
                    type: "quantize",
                    nullColor: "#bac1c4",
                    palette: [
                        "#84caec",
                        "#5cbae5",
                        "#27a3dd",
                        "#1b7eac",
                        "#156489"
                    ],
                    numOfSegments: 5
                }];
            });
            return obj;
        }()
    });



    function info(obj) {
        var ret = {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                ret[i] = obj[i];
            }
        }

        ret.valueAxis = merge(axis, hideInfoAxisLine, hideAxisTicker, gridline);
        ret.categoryAxis = merge(axis);

        general(ret);
        ret = merge(ret, defaultInfoOpts);
        return ret;
    }

    function infoTime(obj){
        var ret = info(obj);
        ret.timeAxis = ret.categoryAxis;
        delete ret.categoryAxis;
        return ret;
    }

    function infoTimeLine(obj){
        var ret = info(obj);
        ret.timeAxis = ret.categoryAxis;
        delete ret.categoryAxis;

        ret = merge(ret, {
            plotArea : {
                window : {
                    start: 'firstDataPoint'
                }
            }
        });
        return ret;
    }

    function infoDual(obj) {
        var ret = {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                ret[i] = obj[i];
            }
        }
        ret.valueAxis = merge(axis, hideInfoAxisLine, gridline, dual);
        delete ret.valueAxis.color;
        ret.categoryAxis = merge(axis);
        ret.valueAxis2 = merge(axis, hideInfoAxisLine, dual);
        delete ret.valueAxis2.color;
        general(ret);
        ret = merge(ret, defaultInfoOpts);
        return ret;
    }

    function infoDualTime(obj) {
        var ret = infoTime(obj);
        ret = merge(ret, background);
        ret = infoDual(ret);
        return ret;
    }

    function infoMekko(obj) {
        return merge(infoDual(obj), {
            valueAxis: {
                title: {
                    applyAxislineColor: false
                }
            },
            valueAxis2: {
                title: {
                    applyAxislineColor: false
                },
                axisLine: {
                    visible: true
                }
            }
        });
    }

    function infoTimeBubble(obj) {
        var ret = infoBubble(obj);
        ret.valueAxis = ret.valueAxis2;
        delete ret.valueAxis2;
        ret.timeAxis = {
                title: {
                    visible: true,
                    style: {
                        color : "#333",
                        fontSize : "12px",
                        fontWeight : "regular",
                        letterSpacing : "0.5"
                    }
                },
                gridline: {
                    color: axisGridlineColor
                },
                color: axisColor
            };

        return ret;
    }

    function infoBubble(obj) {
        var ret = {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                ret[i] = obj[i];
            }
        }

        ret.valueAxis = merge(axis, showInfoAxisLine, gridline);
        ret.valueAxis2 = merge(axis, hideInfoAxisLine, hideAxisTicker);
        ret.sizeLegend = merge(obj.sizeLegend || {}, {
            title : {
                visible : true
            }
        });


        general(ret);
        ret = merge(ret, defaultInfoOpts);
        return ret;
    }

    function infoWaterfall(obj) {
        var ret = merge(obj, waterfallLinkLine, waterfallLegend);
        ret = merge(ret, defaultInfoOpts);
        return ret;
    }

    function general(obj) {
        obj.plotArea = obj.plotArea || {};
        obj.plotArea.background = obj.background;
        delete obj.background;

        delete obj.xAxis;
        delete obj.xAxis2;
        delete obj.yAxis;
        delete obj.yAxis2;
    }
})();
