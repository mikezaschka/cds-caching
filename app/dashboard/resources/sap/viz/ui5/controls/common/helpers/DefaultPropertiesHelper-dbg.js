/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['sap/viz/ui5/format/ChartFormatter', 'sap/ui/Device', "sap/ui/thirdparty/jquery"],
    function(ChartFormatter, Device, jQuery) {
        "use strict";

        var DefaultPropertiesHelper = {};

        var FIORI_MOBILE_PROP = {
            plotArea: {
                scrollbar: {
                    spacing: 2
                }
            },
            legend: {
                scrollbar: {
                    spacing: 2
                }
            }
        };

        var isMobile = Device.system.tablet || Device.system.phone;
        var DEFAULT_FIORI_PROPS = {
            'tooltip': {
                'visible': false
            },
            'general': {
                'groupData': true
            },
            'plotArea': {
                'window': {
                    'start': 'firstDataPoint'
                },
                'dataLabel': {
                    'hideWhenOverlap': true,
                    'respectShapeWidth': true,
                    'style': {
                        'color': null
                    }
                },
                'dataPointSize': {
                    'min': (isMobile) ? 40 : 24,
                    'max': 96
                }
            },
            'interaction': {
                'behaviorType': 'noHoverBehavior',
                'selectability': {
                    'mode': 'multiple'
                },
                'zoom': {
                    'enablement': 'enabled',
                    'direction': 'categoryAxis'
                },
                'enableKeyboard': true,
                'enableInternalEvents': true
            },
        'timeAxis' : {
            'label' : {
                'forceToShowFirstLastData': true
            }
        },
            'categoryAxis': {
                'label': {
                    'angle': 45,
                    'rotation': 'auto'
                }
            },
            'legendGroup': {
                'layout': {
                    'position': 'auto',
                    'respectPlotPosition': false
                },
                'forceToShow': true
            },
            'legend': {
                'isScrollable': true,
                'selectionFeedback': true
            }
        };

        var FIORI_DUAL_PROPS = {
            'plotArea': {
                'primaryValuesColorPalette': ['sapUiChartPaletteSequentialHue1',
                    'sapUiChartPaletteSequentialHue1Light2',
                    'sapUiChartPaletteSequentialHue1Dark1'
                ],
                'secondaryValuesColorPalette': ['sapUiChartPaletteSequentialHue2',
                    'sapUiChartPaletteSequentialHue2Light2',
                    'sapUiChartPaletteSequentialHue2Dark1'
                ]
            },
            "valueAxis": {
                "title": {
                    "style": {
                        "color": "sapUiChartPaletteSequentialHue1Dark1"
                    }
                },
                "axisLine": {
                    "visible": false
                },
                "color": "sapUiChartPaletteSequentialHue1Dark1"
            },
            "valueAxis2": {
                "title": {
                    "style": {
                        "color": "sapUiChartPaletteSequentialHue2Dark1"
                    }
                },
                "axisLine": {
                    "visible": false
                },
                "color": "sapUiChartPaletteSequentialHue2Dark1"
            }
        };

        DefaultPropertiesHelper.getExtraProp = function(applicationSet) {
            if (applicationSet === "fiori" && isMobile) {
                return jQuery.extend(true, {}, FIORI_MOBILE_PROP);
            } else {
                return {};
            }
        };

        DefaultPropertiesHelper._getFiori = function(PropertyService, type) {
            var result = PropertyService.mergeProperties(type, {},
                DefaultPropertiesHelper._general,
                DefaultPropertiesHelper._specified[type.replace('info/', '')] || {}
            );

            var defFiori = jQuery.extend(true, {}, DEFAULT_FIORI_PROPS);
            result = PropertyService.mergeProperties(type, defFiori, result);

            if (/dual/.test(type)) {
                result = PropertyService.mergeProperties(type, result, FIORI_DUAL_PROPS);
            }

            return result;
        };

        DefaultPropertiesHelper.DEFAULT_FIORI_PROPS = DEFAULT_FIORI_PROPS;
        DefaultPropertiesHelper.FIORI_DUAL_PROPS = FIORI_DUAL_PROPS;

        DefaultPropertiesHelper.get = function(PropertyService, type, applicationSet) {
            if (applicationSet === "fiori") {
                return DefaultPropertiesHelper._getFiori(PropertyService, type);
            } else {
                return PropertyService.mergeProperties(type, {},
                    DefaultPropertiesHelper._general,
                    DefaultPropertiesHelper._specified[type.replace('info/', '')] || {},
                    applyDefaultFormatString({}, type)
                );
            }
        };

        function getPropertiesDefination(propDef, path) {
            if (propDef == null || path.legnth === 0) {
                return propDef;
            }
            var e = propDef[path[0]];
            if (e && e.children) {
                return getPropertiesDefination(e.children, path.slice(1));
            }
            return e;
        }

        function setPropertiesValue(properties, path, value) {
            if (path.length === 0) {
                return value;
            }
            properties = properties || {};
            var p = properties[path[0]];
            properties[path[0]] = setPropertiesValue(p, path.slice(1), value);
            return properties;
        }

        var DEFAULT_LABEL_FORMAT = "u";
        var formatStringPaths = [
            ["valueAxis", "label", "formatString"],
            ["valueAxis2", "label", "formatString"]
        ];

        function applyDefaultFormatString(properties, chartType) {
            var metadata = sap.viz.api.metadata.Viz.get(chartType);
            if (metadata) {
                var propDef = metadata.properties;
                formatStringPaths.forEach(function(path) {
                    var p = getPropertiesDefination(propDef, path);
                    if (p && p.hasOwnProperty("defaultValue")) {
                        setPropertiesValue(properties, path, DEFAULT_LABEL_FORMAT);
                    }
                });
            }
            return properties;
        }

        DefaultPropertiesHelper.applyDefaultFormatString = applyDefaultFormatString;

        DefaultPropertiesHelper._general = {
            "title": {
                "visible": true
            },
            "legend": {
                "visible": true
            },
            "plotArea": {
                //Keep animation which belongs to Viz Chart for extension chart.
                "animation": {
                    "dataLoading": false,
                    "dataUpdating": false,
                    "resizing": false
                },
                'colorPalette': ['sapUiChartPaletteQualitativeHue1',
                    'sapUiChartPaletteQualitativeHue2',
                    'sapUiChartPaletteQualitativeHue3',
                    'sapUiChartPaletteQualitativeHue4',
                    'sapUiChartPaletteQualitativeHue5',
                    'sapUiChartPaletteQualitativeHue6',
                    'sapUiChartPaletteQualitativeHue7',
                    'sapUiChartPaletteQualitativeHue8',
                    'sapUiChartPaletteQualitativeHue9',
                    'sapUiChartPaletteQualitativeHue10',
                    'sapUiChartPaletteQualitativeHue11',
                    'sapUiChartPaletteQualitativeHue12',
                    'sapUiChartPaletteQualitativeHue13',
                    'sapUiChartPaletteQualitativeHue14',
                    'sapUiChartPaletteQualitativeHue15',
                    'sapUiChartPaletteQualitativeHue16',
                    'sapUiChartPaletteQualitativeHue17',
                    'sapUiChartPaletteQualitativeHue18',
                    'sapUiChartPaletteQualitativeHue19',
                    'sapUiChartPaletteQualitativeHue20',
                    'sapUiChartPaletteQualitativeHue21',
                    'sapUiChartPaletteQualitativeHue22'
                ],
                'primaryValuesColorPalette': ['sapUiChartPaletteSequentialHue1Light1',
                    'sapUiChartPaletteSequentialHue1',
                    'sapUiChartPaletteSequentialHue1Dark1'
                ],
                'secondaryValuesColorPalette': ['sapUiChartPaletteSequentialHue2Light1',
                    'sapUiChartPaletteSequentialHue2',
                    'sapUiChartPaletteSequentialHue2Dark1'
                ]
            }
        };

        var heatmapProp = {
                "plotArea": {
                    "nullColor": "sapUiChoroplethRegionBG",
                    "colorPalette": [
                        "sapUiChartPaletteSequentialHue1Light2",
                        "sapUiChartPaletteSequentialHue1Light1",
                        "sapUiChartPaletteSequentialHue1",
                        "sapUiChartPaletteSequentialHue1Dark1",
                        "sapUiChartPaletteSequentialHue1Dark2"
                    ]
                }
            };

        DefaultPropertiesHelper._specified = {
            "heatmap": heatmapProp,
            "treemap": heatmapProp
        };


        return DefaultPropertiesHelper;
    });
