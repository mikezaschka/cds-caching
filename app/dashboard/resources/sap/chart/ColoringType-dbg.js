/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides enumeration sap.chart.ColoringType
sap.ui.define(["sap/ui/base/DataType"], function(DataType) {
    "use strict";


    /**
     * Enum of available colorings.
     *
     * @enum {string}
     * @public
     * @alias sap.chart.ColoringType
     */
    var ColoringType = {
        /**
         * Criticality is based on the semantic color palette.
         *
         * It can be defined for measure values and dimension values.
         * <pre>
         * Criticality: {
         *     MeasureValues: {
         *         ...
         *     },
         *     DimensionValues: {
         *         ...
         *     }
         * }
         * </pre>
         *
         * <b>For measure values</b>, criticality can be based on <code>static</code>, <code>calculated</code>, <code>DynamicThresholds</code> and <code>ConstantThresholds</code>
         *
         * <code>Legend</code> is <b>optional</b> and can be used for custom legend labels.
         * <pre>
         * MeasureValues: {
         *     'measureName': {
         *         Static: ... ,
         *         Calculated: ... ,
         *         DynamicThresholds: {
         *             ...
         *         },
         *         ConstantThresholds: {
         *             ...
         *         },
         *         Legend: {
         *             Title: string,    // (optional) fixed, localized label
         *             Positive: string, // fixed, localized label
         *             Critical: string, // fixed, localized label
         *             Negative: string, // fixed, localized label
         *             Neutral:  string  // fixed, localized label
         *         }
         *     },
         *     'measureName': {
         *         ...
         *     }
         * }
         * </pre>
         * <ul>
         *   <li><code>static</code>
         *
         *   It indicates that the measure is always considered in the same way, for example positive.
         *
         *   The value of <code>static</code> is listed in {@link sap.chart.coloring.CriticalityType}
         *
         *   Example:
         *
         *   In this case, all 'Profit' datapoints shall use Positive semantic color and all 'Revenue' datapoints shall use Negative semantic color.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                   Static: sap.chart.ColoringType.Positive
         *               },
         *               Revenue: {
         *                   Static: sap.chart.ColoringType.Negative
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit', 'Revenue']
         *       }
         *   };
         *   </pre>
         *   </li>
         *   <li><code>Calculated</code>
         *
         *   Criticality is calculated by the backend service.
         *
         *   For a <code>Calculated</code> criticality, the value will be determined from a property contained in the model of the “data” aggregation.
         *   Since the calculation must always take the currently visible dimensions into account, this property will be a measure holding an aggregated criticality for the current aggregation level.
         *   The concrete possible values held by this property are defined in {@link sap.chart.coloring.CriticalityType}: Neutral = 0, Negative = 1, Critical = 2, Positive =3.
         *
         *   If Legend is present, the legend shows the title and the fixed, localized texts defined for the different criticality classes. Otherwise, the chart uses the default texts “Good”, “Warning”, “Bad”, and “Neutral” as localized labels in the legend.
         *
         *   If the value of <code>Calculated</code> is a dimension name. The criticality of the measure of a datapoint is determined by the value of this dimension
         *   and its textProperty(if exists) will be used as legend label.
         *
         *   The possible values of this certain dimension are listed in {@link sap.chart.coloring.CriticalityType}.
         *
         *   Example:
         *
         *   In this case, the criticality of 'Profit' measure is determined by the value of 'ProfitCriticality' dimension which is calculated by backend service.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                   Calculated: 'ProfitCriticality'
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *
         *   In this case, the criticality of 'Profit' measure is determined by the value of 'ProfitCriticalityM' measure which is calculated by backend service.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                   Calculated: 'ProfitCriticalityM',
         *                   Legend: {
         *                       Title: "Legend Title",
         *                       Positive: "Good",
         *                       Negative: "Weak",
         *                       Critical: "Soso",
         *                       Neutral: "Crossbench"
         *                   }
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *   </li>
         *   <li><code>DynamicThresholds</code>
         *
         *   Criticality is expressed with thresholds for the boundaries between negative, critical, neutral, and positive.
         *
         *   The direction of improvement for measure values is mandatory, combined with corresponding thresholds.
         *
         *   Thresholds are optional. For unassigned values, defaults are determined in this order:
         *
         *   - For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
         *
         *   - For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
         *
         *   - For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue
         *
         *   Please refer to {@link sap.chart.coloring.ImprovementDirectionType} for detailed usage.
         *   <pre>
         *   DynamicThresholds: {
         *       ImprovementDirection: string,    // refer to sap.chart.coloring.ImprovementDirectionType for detailed definition
         *       AcceptanceRangeLowValue: string or number, // property name or number
         *       AcceptanceRangeHighValue: string or number, // property name or number
         *       ToleranceRangeLowValue: string or number, // property name or number
         *       ToleranceRangeHighValue: string or number, // property name or number
         *       DeviationRangeLowValue: string or number, // property name or number
         *       DeviationRangeHighValue: string or number, // property name or number
         *   }
         *   </pre>
         *   Example:
         *
         *   In this case, the criticality of 'Profit' measure is determined by the value of 'ProfitAcceptanceRangeLowValue', 'ProfitToleranceRangeLowValue' and 'ProfitDeviationRangeLowValue' measure calculated with improvement direction <code>'Maximize'</code>.
        *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                    DynamicThresholds : {
         *                        ImprovementDirection: sap.chart.coloring.ImprovementDirectionType.Maximize,
         *                        AcceptanceRangeLowValue: 'ProfitAcceptanceRangeLowValue',
         *                        ToleranceRangeLowValue: 'ProfitToleranceRangeLowValue',
         *                        DeviationRangeLowValue: 'ProfitDeviationRangeLowValue'
         *                    }
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *   </li>
         *   <li><code>ConstantThresholds</code>
         *
         *   Criticality is expressed with thresholds for the boundaries between negative, critical, neutral, and positive.
         *
         *   The direction of improvement for measure values is mandatory, combined with corresponding thresholds.
         *
         *   Thresholds are optional. For unassigned values, defaults are determined in this order:
         *
         *   - For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
         *
         *   - For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
         *
         *   - For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue
         *
         *   Also Aggregation level (the visible dimensions) must be specified for providing the context for assessing the criticality.
         *
         *   Legend label is shown as value range and do not support customization in ConstantThresholds.
         *
         *   Please refer to {@link sap.chart.coloring.ImprovementDirectionType} for detailed usage.
         *   <pre>
         *   ConstantThresholds: {
         *       ImprovementDirection: string, refer to sap.chart.coloring.ImprovementDirectionType for detailed definition
         *       AggregationLevels: [{
         *            VisibleDimensions: ['dimensionName', ...],
         *            AcceptanceRangeLowValue: Number,
         *            AcceptanceRangeHighValue:Number,
         *            ToleranceRangeLowValue: Number,
         *            ToleranceRangeHighValue: Number,
         *            DeviationRangeLowValue: Number,
         *            DeviationRangeHighValue: Number
         *       },
         *       ...]
         *   }
         *   </pre>
         *   Example:
         *
         *   In this case, the criticality of 'Profit' measure is determined by two concrete thresholds calculated with improvement direction <code>'Maximize'</code>.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                    ConstantThresholds : {
         *                        ImprovementDirection: sap.chart.coloring.ImprovementDirectionType.Maximize,
         *                        AcceptanceRangeLowValue:100,
         *                        ToleranceRangeLowValue: 80,
         *                        DeviationRangeLowValue: 60
         *                    }
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *   </li>
         * </ul>
         *
         * <b>For dimension values</b>
         *
         * Criticality can be expressed by assigning values to negative, critical, and positive. Unassigned dimension values are automatically assigned to neutral.
         *
         * <code>'Values'</code> is used to specify concrete dimension value(s). <code>'Legend'</code> is used to customize legend label which is mandatory when multiple dimension values defined in <code>'Values'</code>.
         *
         * <pre>
         * DimensionValues: {
         *     'dimensionName': {
         *          Positive: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          },
         *          Critical: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          },
         *          Negative: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          },
         *          Neutral: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          }
         *     },
         *     'dimensionName': {
         *         ...
         *     }
         * }
         * </pre>
         * Example:
         *
         * In this case, the criticality of 'OrderStatus' dimension is determined by values specified to different criticality classes.
         * <pre>
         * var oColorings = {
         *     Criticality: {
         *         DimensionValues: {
         *             OrderStatus: {
         *                  Positive : {
         *                      Values: 'Finished'
         *                  },
         *                  Critical : {
         *                      Values: 'Pending'
         *                  },
         *                  Negative : {
         *                      Values: ['Stopped', 'Not Started'],
         *                      Legend: 'Alert'
         *                  },
         *                  Neutral : {
         *                      Values: ['Processing', 'Surveyed'],
         *                      Legend: 'Normal'
         *                  }
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Criticality,
         *     parameters: {
         *         dimension: ['OrderStatus']
         *     }
         * };
         * </pre>
         * @public
         */
        Criticality: "Criticality",
        /**
         * Emphasis is about highlighting certain data points in a chart.
         *
         * It can be defined for dimension values.
         * <pre>
         * Emphasis: {
         *     DimensionValues: {
         *         ...
         *     }
         * }
         * </pre>
         * <b>For dimension values</b>
         *
         * Highlight a specified set of values of a dimension visible in the current chart layout. The qualitative color palette is used.
         *
         * <code>'Values'</code> is used to specify dimension value(s) for highlight. <code>'Legend'</code> is used to customize legend label whose <code>'Hightlighted'</code> is mandatory when multiple dimension values defined in <code>'Values'</code>.
         * <pre>
         * DimensionValues: {
         *     'dimensionName': {
         *         Values: 'dimensionValue' or ['dimensionValue', ...],
         *         Legend: {
         *            Highlighted: string // mandatory for value array
         *            Others: string      // optional
         *         }
         *     },
         *     'dimensionName': {
         *         ...
         *     }
         * }
         * </pre>
         * Example:
         *
         * In this case, 'Germany' and 'France' are highlighted in 'Country' dimension with customized legend label 'Europe'.
         * <pre>
         * var oColorings = {
         *     Emphasis: {
         *         DimensionValues: {
         *             Country: {
         *                 Values: ['Germany', 'France']
         *                 Legend: 'Europe'
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Emphasis,
         *     parameters: {
         *         dimension: ['Country']
         *     }
         * };
         * </pre>
         * @public
         */
        Emphasis: "Emphasis",
        /**
         * Gradation introduces the notion of levels to visually separate chart elements by different hues of colors.
         *
         * Gradation coloring is based on predefined color palettes implementing one of the following color schemes:
         *
         * 1. Single-color scheme:
         *
         *    Palette consists of a linear sequence of hues of the same color in increasing or decreasing saturation. Every hue represents a level.
         *
         * 2. Diverging color scheme:
         *
         *    Palette consists of two hues of different colors at the outer ends, and a linear sequence of other color hues between them. Every color hue represents a level.
         *    The palette has a central mid area with an own color separating the levels before and after the midpoint.
         *
         * 3. Target color scheme:
         *
         *    Palette consists of two instances of a diverging color scheme palette, where the second is appended at the end of the first with reverse order of hues. Every color hue represents a level.
         *    The palette has a central midpoint for the target value positioned between the two palette instances, separating the levels before and after the midpoint.
         *
         * Whether a gradation can be applied depends on the chart layout. The <code>Colorings.Gradation</code> object has the overall structure:
         * <pre>
         * Gradation: {
         *     RankedMeasureValues: { // Only for heatmap charts, if the measure is visible in the chart layout.
         *         …
         *     },
         *     DelineatedMeasures: { // More than one of these measures is visible in the chart layout.
         *         …
         *     },
         *     DelineatedDimensionValues: { // If the dimension is the only visible dimension in the chart layout and has the category role, or if the dimension is the only dimension with the series role.
         *         …
         *     }
         * }
         * </pre>
         *
         * The option for ranked measure values can be specified for one or more measures identified by name:
         * <pre>
         * RankedMeasureValues: {
         *     'measureName': {
         *         SingleColorScheme: {
         *             Scheme: string, // enumeration: NoSemantics, Positive, Negative
         *             Saturation: string, // enumeration: LightToDark, DarkToLight
         *             NumberOfLevels: number, // between 2-6
         *             RankingPerAggregationLevel: [
         *                 {
         *                     VisibleDimensions: [ 'dimensionName', … ],
         *                     LevelBoundaries: [ number, … ] // array with 1-5 numbers
         *                 },
         *                 …
         *             ]
         *         },
         *         DivergingColorScheme: {
         *             Scheme: string, // enumeration: NoSemantics, PositiveToNegative, NegativeToPositive, ColdToHot, HotToCold
         *             NumberOfLevels: {
         *                 BelowMidArea: number, // between 2-6
         *                 AboveMidArea: number  // between 2-6
         *             },
         *             RankingPerAggregationLevel: [
         *                 {
         *                     VisibleDimensions: [ 'dimensionName', … ],
         *                     MidAreaLowValue: number,
         *                     MidAreaHighValue: number
         *                 },
         *                 …
         *             ]
         *         },
         *         TargetColorScheme: {
         *             Scheme: string, // enumeration: PositiveTarget
         *             NumberOfLevels: {
         *                 BelowTargetMidpoint: number, // between 2-6
         *                 AboveTargetMidpoint: number  // between 2-6
         *             },
         *             RankingPerAggregationLevel: [
         *                 {
         *                     VisibleDimensions: [ 'dimensionName', … ],
         *                     TargetMidpoint: number
         *                 },
         *                 …
         *             ]
         *         },
         *     },
         *     'measureName': { … },
         *     ...
         * }
         * </pre>
         *
         * For a single color scheme, Scheme names the scheme to be applied. If it is not specified, the default is NoSemantics.
         * The possible values of scheme name are listed in {@link sap.chart.coloring.GradationSingleColorScheme}.
         * If Saturation is not specified, the default is LightToDark. The possible values of saturation are listed in {@link sap.chart.coloring.GradationSaturation}
         *
         * For an aggregation level specified by a list of visible dimensions, the level boundary array is a strictly increasing sequence of numbers establishing a series of consecutive value intervals.
         * In case VisibleDimensions is omitted, the level boundaries are applied independent of the aggregation level in the current chart layout.
         *
         * If RankingPerAggregationLevel is not provided, the chart will apply a default ranking by determining the minimum and maximum value of the measure in the data set and cutting this value range into equally sized intervals for the requested NumberOfLevels.
         * If NumberOfLevels to be distinguished is not specified, the default is 5 levels.
         *
         *
         * Example:
         * In this case, the values of 'Age' are ranked as 4 levels following the color scheme 'Positive' from dark to light.
         * <pre>
         * var oColorings = {
         *     Gradation: {
         *         RankedMeasureValues: {
         *             Age: {
         *                  SingleColorScheme : {
         *                      Scheme: 'Positive',
         *                      Saturation: 'DarkToLight',
         *                      RankingPerAggregationLevel: [
         *                          {
         *                              VisibleDimensions: ["Name"],
         *                              LevelBoundaries: [20, 25, 28]
         *                          }
         *                      ]
         *                  }
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Gradation
         * };
         * </pre>
         *
         * For a diverging color scheme, Scheme names the scheme to be applied. If it is not specified, the default is NoSemantics.
         * The possible values of scheme name are listed in {@link sap.chart.coloring.GradationDivergingColorScheme}.
         *
         * A diverging color scheme circles around a mid area represented by a level on its own. Therefore, two level counts are to be specified, one for the range of values below the mid area, and another for the range above the mid area.
         *
         * For an aggregation level specified by a list of visible dimensions, the boundary values for the mid area must be specified in MidAreaLowValue and MidAreaHighValue.
         * If both values are equal, the mid area collapses into a single point and the mid area level vanishes.
         *
         * The chart determines the minimum and maximum values from the data set. To cut the value range before the mid area into the specified number of levels NumberOfLevels.BelowMidArea, the value interval from the MidAreaLowValue down to the minimum value is divided into as many equally sized intervals.
         * In the same way, the value interval above the mid area is cut into the specified number of levels NumberOfLevels.AboveMidArea above the mid area using the determined maximum value.
         *
         * In case VisibleDimensions is omitted, this ranking becomes the default and is applied independent of the aggregation level in the current chart layout.
         * Further entries in RankingPerAggregationLevel must then include VisibleDimensions and are used to describe exceptions from the default ranking for the specified aggregation level.
         *
         *
         * Example:
         * In this case, the values of 'Age' are ranked as 7 levels with a mid area [22, 27] following the color scheme 'PositiveToNegative'.
         * <pre>
         * var oColorings = {
         *     Gradation: {
         *         RankedMeasureValues: {
         *             Age: {
         *                  DivergingColorScheme : {
         *                      Scheme: 'PositiveToNegative',
         *                      NumberOfLevels: {
         *                          BelowMidArea: 3,
         *                          AboveMidArea: 3
         *                      },
         *                      RankingPerAggregationLevel: [
         *                          {
         *                              VisibleDimensions: ["Name"],
         *                              MidAreaLowValue: 22,
         *                              MidAreaHighValue: 27
         *                          }
         *                      ]
         *                  }
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Gradation
         * };
         * </pre>
         *
         * For a target color scheme, Scheme names the scheme to be applied. If it is not specified, the default is PositiveTarget.
         * The possible values of scheme name are listed in {@link sap.chart.coloring.GradationTargetColorScheme}.
         *
         * For an aggregation level specified by a list of visible dimensions, the measure value to be used as target midpoint must be specified in TargetMidpoint.
         *
         * The chart determines the minimum and maximum values from the data set. To cut the value range before the target midpoint into the specified number of levels NumberOfLevels.BelowTargetMidPoint, the value interval from the TargetMidpoint down to the minimum value is divided into as many equally sized intervals.
         * In the same way, the value interval above the midpoint is cut into the specified number of levels NumberOfLevels.AboveTargetMidPoint above the midpoint using the determined maximum value.
         *
         * In case VisibleDimensions is omitted, the midpoint is applied independent of the aggregation level in the current chart layout.
         * Further entries in RankingPerAggregationLevel must then include VisibleDimensions and are used to describe exceptions from the general midpoint for the specified aggregation level.
         *
         *
         * Example:
         * In this case, the values of 'Age' are ranked as 12 levels with a target mid point following the color scheme 'PositiveTarget'.
         * <pre>
         * var oColorings = {
         *     Gradation: {
         *         RankedMeasureValues: {
         *             Age: {
         *                  TargetColorScheme : {
         *                      Scheme: 'PositiveTarget',
         *                      NumberOfLevels: {
         *                          BelowTargetMidpoint: 6,
         *                          AboveTargetMidpoint: 6
         *                      },
         *                      RankingPerAggregationLevel: [
         *                          {
         *                              VisibleDimensions: ["Name"],
         *                              TargetMidpoint: 25
         *                          }
         *                      ]
         *                  }
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Gradation
         * };
         * </pre>
         *
         * If no gradation has been specified for a measure (meaning: neither a single nor a diverging color nor a target scheme), then the ranked measure values option still can be applied via activeColoring. In this case, the default is a single-color scheme with defaults applied to all its component as described above.
         *
         *
         * The option for delineated measures maps (between two and six) measures identified by name to gradation levels, with increasing index numbers. It shall be applied only if the measures visible in the chart are a subset of those specified here:
         * <pre>
         * DelineatedMeasures: {
         *     SingleColorScheme: string, // enumeration of schemes-see above
         *     Saturation: string, // enumeration: LightToDark, DarkToLight
         *     Levels: [ 'measureName', … ] // between 2-6 members
         * }
         * </pre>
         *
         * If the color scheme is not specified, the default is NoSemantic. If Saturation is not specified, the default is LightToDark.
         *
         * If delineated measure gradation is to be shown, and if the chart layout contains further visible measures not mentioned in the delineated measure configuration, then gradation coloring must not be applied.
         *
         *
         * Example:
         * In this case, the value of 'Win', 'Draw' and 'Lose' are shown in 3 color levels.
         * <pre>
         * var oColorings = {
         *     Gradation: {
         *         DelineatedMeasures: {
         *             SingleColorScheme: 'PositiveTarget',
         *             Saturation: 'DarkToLight',
         *             Levels: ['Win', 'Draw', 'Lose']
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Gradation
         * };
         * </pre>
         *
         *
         * The option for delineated dimension values can map (between two and six) dimension values to gradation levels, with increasing index numbers. It shall be applied only if the data set to be visualized contains no dimension values other than those specified.
         * <pre>
         * DelineatedDimensionValues: {
         *     SingleColorScheme: string, // enumeration of schemes-see above
         *     Saturation: string, // enumeration: LightToDark, DarkToLight
         *     'dimensionName': {
         *         Levels: [ 'dimensionValue', … ] // between 2-6 members
         *     },
         *     'dimensionName': {...},
         *     ...
         * }
         * </pre>
         *
         * If color scheme is not specified, the default is NoSemantic. If Saturation is not specified, the default is LightToDark.
         *
         * If delineated dimension value gradation is to be shown, and the “data” model contains dimension values not mentioned in the configuration, then gradation coloring must not be applied.
         *
         *
         * Example:
         * In this case, the measures mapping to the dimension value 'Injured', 'Normal', 'Superb' and 'Tired' are shown in 4 color levels.
         * <pre>
         * var oColorings = {
         *     Gradation: {
         *         DelineatedDimensionValues: {
         *             SingleColorScheme: 'PositiveTarget',
         *             Saturation: 'DarkToLight',
         *             Fitness: {
         *                 Levels: ['Injured', 'Normal', 'Superb', 'Tired']
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Gradation
         * };
         * </pre>
         * @public
         */
        Gradation: "Gradation"
    };

    DataType.registerEnum("sap.chart.ColoringType", ColoringType);

    return ColoringType;

}, /* bExport= */ true);
