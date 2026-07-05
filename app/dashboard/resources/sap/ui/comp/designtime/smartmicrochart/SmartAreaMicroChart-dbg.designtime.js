/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartmicrochart.SmartAreaMicroChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {
			/**
			 * Renders a AreaMicroChart based on the <code>Chart</code> annotation.
			 * <i>XML Example of SmartAreaMicroChart with Chart Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;AmcNamespace.StockPrice&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;AreaChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.Chart/Area&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Description&quot; Path=&quot;Description&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;Day&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;Price&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ChartMeasureAttributeType&quot;&gt;
			 *                &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;Price&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#AreaChartDataPoint&quot; /&gt;
			 *              &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			chart: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "Chart",
				target: ["EntityType"],
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>ChartDefinitionType</code> is <code>ComplexType</code> that is used to describe the <code>Chart</code> annotation.
			 */
			chartDefinitionType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "ChartDefinitionType",
				target: ["EntityType"],
				includeList: {
					properties: [
						"Title",
						"Description",
						"ChartType",
						"Measures",
						"MeasureAttributes",
						"Dimensions"
					]
				},
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>ChartType</code> is <code>EnumType</code> that is provided within the <code>Chart</code> annotation. The <code>ChartType</code> property value must be Area or Line.
			 * <i>XML Example of using ChartType property with Area</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;AreaChartQualifier&quot;&gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ChartDefinitionType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.Chart/Area&quot; /&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			chartType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "ChartType",
				target: ["Property"],
				includeList: {
					values: ["Area", "Line"]
				},
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * Based on the <code>DataPoint</code> annotation that is provided by the <code>MeasureAttributes</code>, the color of the chart is defined
			 * due to the thresholds by using the <code>CriticalityCalculation</code> property and <code>ImprovementDirection</code> property.
			 * <code>DataPoint</code> must be defined for an <code>EntityType</code>. The <code>total</code> chart property is defined by <code>MaximumValue</code> annotation.
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;AreaChartDataPoint&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Price&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;TargetValue&quot; Path=&quot;PriceTarget&quot;/&gt;
			 *        &lt;PropertyValue Property=&quot;CriticalityCalculation&quot;&gt;
			 *          &lt;Record Type=&quot;UI.CriticalityCalculationType&quot;&gt;
			 *            &lt;PropertyValue Property=&quot;ImprovementDirection&quot; EnumMember=&quot;UI.ImprovementDirectionType/Target&quot; /&gt;
			 *            &lt;PropertyValue Property=&quot;DeviationRangeLowValue&quot; Path=&quot;PriceDeviationLowerBound&quot;/&gt;
			 *            &lt;PropertyValue Property=&quot;ToleranceRangeLowValue&quot; Path=&quot;PriceToleranceLowerBound&quot;/&gt;
			 *            &lt;PropertyValue Property=&quot;ToleranceRangeHighValue&quot; Path=&quot;PriceToleranceUpperBound&quot;/&gt;
			 *            &lt;PropertyValue Property=&quot;DeviationRangeHighValue&quot; Path=&quot;PriceDeviationUpperBound&quot;/&gt;
			 *          &lt;/Record&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			dataPoint: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPoint",
				target: ["EntityType"],
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>DataPointType</code> is <code>ComplexType</code> that is used to define the type of the <code>DataPoint</code> annotation.
			 */
			dataPointType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPointType",
				target: ["EntityType"],
				includeList: {
					properties: [
						"Value",
						"TargetValue",
						"CriticalityCalculation"
					]
				},
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>CriticalityCalculationType</code> is <code>ComplexType</code> that is used to define the type of <code>CriticalityCalculation</code> property in the <code>DataPoint</code> annotation.
			 * <i>XML Example of using CriticalityCalculation property with the CriticalityCalculationType type</i>
			 *
			 * <pre>
			 *    &lt;PropertyValue Property=&quot;CriticalityCalculation&quot;&gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.CriticalityCalculationType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;ImprovementDirection&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ImprovementDirectionType/Target&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;DeviationRangeLowValue&quot; Path=&quot;PriceDeviationLowerBound&quot;/&gt;
			 *        &lt;PropertyValue Property=&quot;ToleranceRangeLowValue&quot; Path=&quot;PriceToleranceLowerBound&quot;/&gt;
			 *        &lt;PropertyValue Property=&quot;ToleranceRangeHighValue&quot; Path=&quot;PriceToleranceUpperBound&quot;/&gt;
			 *        &lt;PropertyValue Property=&quot;DeviationRangeHighValue&quot; Path=&quot;PriceDeviationUpperBound&quot;/&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/PropertyValue&gt;
			 * </pre>
			 */
			criticalityCalculationType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "CriticalityCalculationType",
				target: ["Property"],
				includeList: {
					properties: [
						"ImprovementDirection",
						"ToleranceRangeLowValue",
						"ToleranceRangeHighValue",
						"DeviationRangeLowValue",
						"DeviationRangeHighValue"
					]
				},
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>ISOCurrency</code> annotation describes the <code>Value</code> property of the <code>DataPoint</code> annotation.
			 * <i>XML Example of using ISOCurrency annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Revenue&quot;&gt;
			 *       &lt;Annotation Term=&quot;Org.OData.Measures.V1.ISOCurrency&quot; Path=&quot;Currency&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;Currency&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 */
			currency: {
				namespace: "Org.OData.Measures.V1",
				annotation: "ISOCurrency",
				target: ["Property"],
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>Unit</code> annotation describes the <code>Value</code> property of the <code>DataPoint</code> annotation.
			 * <i>XML Example of using Unit annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Revenue&quot;&gt;
			 *       &lt;Annotation Term=&quot;Org.OData.Measures.V1.Unit&quot; Path=&quot;Currency&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;Currency&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 */
			unit: {
				namespace: "Org.OData.Measures.V1",
				annotation: "Unit",
				target: ["Property"],
				defaultValue: null,
				since: "1.38.0"
			},

			/**
			 * The <code>IsCalendarYear</code> annotation describes the Dimensions property in the <code>Chart</code> annotation.
			 * A corresponding formatter is used to format the value of the Dimensions property.
			 * <i>XML Example of using IsCalendarYear annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Date&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYear&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			isCalendarYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYear",
				target: ["Property"],
				defaultValue: null,
				since: "1.44.0"
			},

			/**
			 * The <code>IsCalendarYearMonth</code> annotation describes the Dimensions property in the <code>Chart</code> annotation.
			 * A corresponding formatter is used to format the value of the Dimensions property.
			 * <i>XML Example of using IsCalendarYearMonth annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Date&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearMonth&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			isCalendarYearMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearMonth",
				target: ["Property"],
				defaultValue: null,
				since: "1.44.0"
			},

			/**
			 * The <code>IsCalendarDate</code> annotation describes the Dimensions property in the <code>Chart</code> annotation.
			 * A corresponding formatter is used to format the value of the Dimensions property.
			 * <i>XML Example of using IsCalendarDate annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Date&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarDate&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			isCalendarDate: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarDate",
				target: ["Property"],
				defaultValue: null,
				since: "1.44.0"
			}
		},

		customData: {
			/**
			 * Defines whether a Qualifier needs to be considered or not. If provided the value of the customData is the qualifier value without hashtag ("#").
			 */
			chartQualifier: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.42.0"
			}
		}
	};
});