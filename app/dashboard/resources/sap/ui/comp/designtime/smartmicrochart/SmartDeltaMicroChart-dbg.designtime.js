/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartmicrochart.SmartDeltaMicroChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {
			/**
			 * Renders a DeltaMicroChart based on the <code>Chart</code> annotation.
			 * SmartDeltaMicroChart does not have its own ChartType/Enum annotation.
			 * This means that ChartType annotation is not specified and SmartDeltaMicroChart cannot be created with <code>SmartMicroChart</code>.<br>
			 * SmartDeltaMicroChart expects two Measures and their respective two DataPoints.<br>
			 * <i>XML Example of SmartDeltaMicroChart with Chart Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;DmcNamespace.StockPrice&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;DeltaChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Description&quot; Path=&quot;Description&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;Day&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;Price&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Revenue&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ChartMeasureAttributeType&quot;&gt;
			 *                &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;Price&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#DeltaChartDataPoint1&quot; /&gt;
			 *              &lt;/Record&gt;
			 *              &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ChartMeasureAttributeType&quot;&gt;
			 *                &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;Revenue&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#DeltaChartDataPoint2&quot; /&gt;
			 *              &lt;/Record&gt;			 *
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
				since: "1.61.0"
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
						"Measures",
						"MeasureAttributes",
						"Dimensions"
					]
				},
				defaultValue: null,
				since: "1.61.0"
			},

			/**
			 * Based on the <code>DataPoint</code> annotation that is provided by the <code>MeasureAttributes</code>, the values, titles and colors of the chart are defined
			 * by using the <code>Value</code> property, <code>Title</code> property and <code>Criticality</code> property.
			 * <code>DataPoint</code> must be defined for an <code>EntityType</code>.<br>
			 * <i>XML Example of using DataPoint annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;DeltaChartDataPoint1&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Price&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot; /&gt;
			 *        &lt;!-- note that criticality of the first data point is used for color definition --&gt;
			 *        &lt;PropertyValue Property=&quot;Criticality&quot; Path=&quot;Criticality&quot;/&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;DeltaChartDataPoint2&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Revenue&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot; /&gt;
			 *        &lt;!-- note that criticality of the first data point is used for color definition --&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;*
			 * </pre>
			 */
			dataPoint: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPoint",
				target: ["EntityType"],
				defaultValue: null,
				since: "1.61.0"
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
						"Title",
						"Criticality"
					]
				},
				defaultValue: null,
				since: "1.61.0"
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
				since: "1.61.0"
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
				since: "1.61.0"
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