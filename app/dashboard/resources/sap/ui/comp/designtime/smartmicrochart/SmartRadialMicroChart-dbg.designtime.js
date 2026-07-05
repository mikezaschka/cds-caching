/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartmicrochart.SmartRadialMicroChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {
			/**
			 * Renders a RadialMicroChart based on the <code>Chart</code> annotation.
			 * <i>XML Example of SmartRadialMicroChart with Chart Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;DmcNamespace.ProductType&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;DonutChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.Chart/Donut&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Description&quot; Path=&quot;Description&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;Sold&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record Type=&quot;ChartMeasureAttributeType&quot;&gt;
			 *                &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;Price&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#DonutChartDataPoint&quot; /&gt;
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
				since: "1.42.0"
			},

			/**
			 * The <code>ChartDefinitionType</code> is a <code>ComplexType</code> that is used to describe the <code>Chart</code> annotation.
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
						"MeasureAttributes"
					]
				},
				defaultValue: null,
				since: "1.42.0"
			},

			/**
			 * The <code>ChartType</code> is <code>EnumType</code> that is provided within the <code>Chart</code> annotation. The <code>ChartType</code> property value must be Donut.
			 * <i>XML Example of SmartRadialMicroChart with chartType Donut</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;DmcNamespace.ProductType&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;DonutChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Donut&quot; /&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			chartType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "ChartType",
				target: ["Property"],
				includeList: {
					values: ["Donut"]
				},
				defaultValue: null,
				since: "1.42.0"
			},

			/**
			 * Based on the <code>DataPoint</code> annotation that is provided by the <code>MeasureAttributes</code>, the color of the chart is defined
			 * due to the thresholds by either using the <code>Criticality</code> property or by using both <code>CriticalityCalculation</code> and <code>ImprovementDirection</code> properties.
			 * <code>DataPoint</code> must be defined for an <code>EntityType</code>
			 *
			 * <i>XML Example with DataPoint annotation and Criticality property</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;DonutChartDataPointPercent&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Price&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;TargetValue&quot;&gt; /&gt;
			 *        &lt;PropertyValue Property=&quot;Criticality&quot;&gt; /&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * <i>XML Example with DataPoint annotation and CriticalityCalculation property</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;DonutChartDataPointPercent&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Price&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;TargetValue&quot;&gt; /&gt;
			 *        &lt;PropertyValue Property=&quot;CriticalityCalculation&quot;&gt;
			 *          &lt;Record&gt;
			 *            &lt;PropertyValue Property=&quot;ImprovementDirection&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ImprovementDirectionType/Maximize&quot; /&gt;
			 *            &lt;PropertyValue Path=&quot;MinSold&quot; Property=&quot;DeviationRangeLowValue&quot;/&gt;
			 *            &lt;PropertyValue Path=&quot;ToleranceSold&quot; Property=&quot;ToleranceRangeLowValue&quot;/&gt;
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
				since: "1.42.0"
			},

			/**
			 * The <code>DataPointType</code> is <code>ComplexType</code> that is used to define the type of <code>DataPoint</code> annotation.
			 */
			dataPointType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPointType",
				target: ["EntityType"],
				includeList: {
					properties: [
						"Value",
						"TargetValue",
						"Criticality",
						"CriticalityCalculation"
					]
				},
				defaultValue: null,
				since: "1.42.0"
			},

			/**
			 * The <code>CriticalityCalculationType</code> is <code>ComplexType</code> that is used to define the type of <code>CriticalityCalculation</code> property in the <code>DataPoint</code> annotation.
			 * <i>XML Example of using CriticalityCalculation property with CriticalityCalculationType type</i>
			 *
			 * <pre>
			 *    &lt;PropertyValue Property=&quot;CriticalityCalculation&quot;&gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.CriticalityCalculationType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;ImprovementDirection&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ImprovementDirectionType/Target&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;DeviationRangeLowValue&quot; Path=&quot;DeviationLowerBound&quot;/&gt;
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
				since: "1.42.0"
			},

			/**
			 * The <code>ISOCurrency</code> annotation describes the value property of the <code>DataPoint</code> annotation.
			 * <i>XML Example of ISOCurrency annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot; Target=&quot;AmcNamespace.StockPrice/Price&quot; &gt;
			 *      &lt;Annotation Term=&quot;Org.OData.Measures.V1.ISOCurrency&quot; Path=&quot;Currency&quot;&gt;&lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			currency: {
				namespace: "Org.OData.Measures.V1",
				annotation: "ISOCurrency",
				target: ["Property"],
				defaultValue: null,
				since: "1.42.0"
			},

			/**
			 * The <code>Unit</code> annotation describes the value property of the <code>DataPoint</code> annotation.
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
				since: "1.42.0"
			},

			/**
			 * The <code>Label</code> annotation describes the value property of the <code>DataPoint</code> annotation.
			 * <i>XML Example of using Label annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Revenue&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Label&quot; Path=&quot;FreeText&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;FreeText&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 */
			label: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Label",
				target: ["Property"],
				defaultValue: null,
				since: "1.42.0"
			}
		},

		customData: {
			/**
			 * Defines whether a Qualifier needs to be considered or not. If provided, the value of the customData is the qualifier value without hashtag ("#").
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