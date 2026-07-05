/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartmicrochart.SmartColumnMicroChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {
			/**
			 * Renders a ColumnMicroChart based on the <code>Chart</code> annotation.
			 * <i>XML Example of SmartColumnMicroChart with Chart Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;CmcNamespace.StockPrice&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;ColumnChartQualifier&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;ChartTitle&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.Chart/Column&quot; /&gt;
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
			 *                &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#ColumnChartDataPoint&quot; /&gt;
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
				since: "1.60.0"
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
				since: "1.60.0"
			},

			/**
			 * The <code>ChartType</code> is <code>EnumType</code> that is provided within the <code>Chart</code> annotation. The <code>ChartType</code> property value must be Column.
			 * <i>XML Example of a ChartType property with Column</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot; Qualifier=&quot;ColumnChartQualifier&quot;&gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ChartDefinitionType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;ChartType&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.Chart/Column&quot; /&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			chartType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "ChartType",
				target: ["Property"],
				includeList: {
					values: ["Column"]
				},
				defaultValue: null,
				since: "1.60.0"
			},

			/**
			 * Based on the <code>DataPoint</code> annotation that is provided by the <code>MeasureAttributes</code>, the values and colors of the chart are defined
			 * by using the <code>Value</code> property and <code>Criticality</code> property.
			 * Property <code>Title</code> of the column micro chart is set based on the <code>Title</code> property of the <code>DataPoint</code>.
			 * <code>DataPoint</code> must be defined for an <code>EntityType</code>.<br>
			 * <i>XML Example of using DataPoint annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;ColumnChartDataPoint&quot; &gt;
			 *      &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 *        &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Price&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;Criticality&quot; Path=&quot;Criticality&quot;/&gt;
			 *        &lt;PropertyValue Property=&quot;Title&quot; Path=&quot;Title&quot;/&gt;*
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			dataPoint: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPoint",
				target: ["EntityType"],
				defaultValue: null,
				since: "1.60.0"
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
						"Criticality"
					]
				},
				defaultValue: null,
				since: "1.60.0"
			},

			/**
			 * The <code>ISOCurrency</code> annotation describes the <code>Value</code> property of the <code>DataPoint</code> annotation.
			 * <i>XML Example of an ISOCurrency annotation</i>
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
				since: "1.60.0"
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
				since: "1.60.0"
			},

			/**
			 * The <code>Text</code> annotation describes the display value of <code>Value</code> property of the <code>DataPoint</code> annotation.
			 * Activates property <code>allowColumnLabels</code> of the inner column micro chart.
			 * <i>XML Example of using Text annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Text&quot; Path=&quot;DisplayValue&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;DisplayValue&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 */
			text: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Text",
				target: ["Property"],
				defaultValue: null,
				since: "1.60.0"
			},

			/**
			 * The <code>IsCalendarYear</code> annotation describes the Dimensions property in the <code>Chart</code> annotation.
			 * A corresponding formatter is used to format the value of the Dimensions property.
			 * <i>XML Example of an IsCalendarYear annotation</i>
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
				since: "1.60.0"
			},

			/**
			 * The <code>IsCalendarYearMonth</code> annotation describes the Dimensions property in the <code>Chart</code> annotation.
			 * A corresponding formatter is used to format the value of the Dimensions property.
			 * <i>XML Example of an IsCalendarYearMonth annotation</i>
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
				since: "1.60.0"
			},

			/**
			 * The <code>IsCalendarDate</code> annotation describes the Dimensions property in the <code>Chart</code> annotation.
			 * A corresponding formatter is used to format the value of the Dimensions property.
			 * <i>XML Example of an IsCalendarDate annotation</i>
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
				since: "1.60.0"
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
				since: "1.60.0"
			}
		}
	};
});