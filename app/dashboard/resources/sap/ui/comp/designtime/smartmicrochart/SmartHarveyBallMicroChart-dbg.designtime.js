/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartmicrochart.SmartHarveyBallMicroChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {
			/**
			 * Renders a HarveyBallMicroChart based on the <code>Chart</code> annotation.
			 * <i>XML Example of SmartHarveyBallMicroChart with Chart Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;HbmcNamespace.ProductType&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;PieChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot; numMember=&quot;com.sap.vocabularies.UI.v1.Chart/Pie&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Description&quot; Path=&quot;Description&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;Sold&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record Type=&quot;ChartMeasureAttributeType&quot;&gt;
			 *                &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#PieChartDataPoint&quot; /&gt;
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
				since: "1.62.0"
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
				since: "1.62.0"
			},

			/**
			 * The <code>ChartType</code> is <code>EnumType</code> that is provided within the <code>Chart</code> annotation. The <code>ChartType</code> property value must be Pie.
			 * <i>XML Example of SmartHarveyBallMicroChart with chartType Pie</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;HbmcNamespace.ProductType&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;PieChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Pie&quot; /&gt;
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
					values: ["Pie"]
				},
				defaultValue: null,
				since: "1.62.0"
			},

			/**
			 * Based on the <code>DataPoint</code> annotation that is provided by the <code>MeasureAttributes</code>, the color of the chart is defined
			 * due to the thresholds by using the <code>Criticality</code> property.
			 * <code>DataPoint</code> must be defined for an <code>EntityType</code>
			 *
			 * <i>XML Example with DataPoint annotation and Criticality property</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;PieChartDataPointPercent&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Sold&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;MaximumValue&quot;&gt; /&gt;
			 *        &lt;PropertyValue Property=&quot;Criticality&quot;&gt; /&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			dataPoint: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPoint",
				target: ["EntityType"],
				defaultValue: null,
				since: "1.62.0"
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
						"MaximumValue",
						"Criticality"
					]
				},
				defaultValue: null,
				since: "1.62.0"
			},

			/**
			 * The <code>ISOCurrency</code> annotation describes the value property of the <code>DataPoint</code> annotation.
			 * <i>XML Example of ISOCurrency annotation</i>. The <code>totalScale</code> and <code>fractionScale</code> properties of the chart
			 * are defined by this annotation.
			 *
			 * <pre>
			 *    &lt;Annotations xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot; Target=&quot;HbmcNamespace.ProductType/Sold&quot; &gt;
			 *      &lt;Annotation Term=&quot;Org.OData.Measures.V1.ISOCurrency&quot; Path=&quot;Unit&quot;&gt;&lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			currency: {
				namespace: "Org.OData.Measures.V1",
				annotation: "ISOCurrency",
				target: ["Property"],
				defaultValue: null,
				since: "1.62.0"
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
				since: "1.62.0"
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
				since: "1.62.0"
			}
		}
	};
});