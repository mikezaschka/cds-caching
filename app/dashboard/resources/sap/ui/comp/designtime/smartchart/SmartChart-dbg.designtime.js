/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartchart.SmartChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		actions: {
			compVariant: function (oControl) {
				if (
					oControl.isA("sap.ui.comp.smartchart.SmartChart") &&
					oControl.getUseVariantManagement() && oControl.getUseChartPersonalisation() && oControl.getPersistencyKey() &&
					oControl.getVariantManagement() &&
					oControl.getVariantManagement().isA("sap.ui.comp.smartvariants.SmartVariantManagement") &&
					oControl.getVariantManagement().isVariantAdaptationEnabled()
				) {

					return {
						name: "VIEWSETTINGS_TITLE",
						changeType: "variantContent",
						handler: function(oControl, mPropertyBag) {
							return new Promise(function (resolve) {
								var fCallBack = function(oData) {
									resolve(oData);
								};
								oControl.openDialogForKeyUser(mPropertyBag.styleClass, fCallBack);
							});
						}
					};
				}
			},
			localReset: "localReset"
		},
		annotations: {

			/**
			 * Defines a name of the <code>SemanticObject</code> that can be represented with an <code>EntitySet</code>, <code>EntityType</code>
			 * or identified by a <code>Property</code>. With this annotation in place, the <code>SemanticObjectController</code> will provide
			 * all the available features for the <code>SmartChart</code> control. <i>XML Example of OData V4 with SemanticObject on ProductName</i>
			 * <br>
			 * <b>Note:</b> Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;ProductName&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;SemanticObjectName&quot; /&gt;
			 *   &lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObject: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObject",
				target: [
					"EntitySet", "EntityType", "Property"
				],
				defaultValue: null,
				appliesTo: [
					"text"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Defines whether a field in the SmartChart control is visible. The SmartChart interprets the
			 * <code>EnumMember</code> <code>FieldControlType/Hidden</code> of the <code>FieldControl</code> annotation for setting the
			 * visibility. <b>Note:</b> Currently only <code>FieldControlType/Hidden</code> is supported for statically hiding the fields. <i>XML
			 * Example of OData V4 with hidden Customer and CompanyCode Properties</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:visible</code> annotation on the <code>Property</code> can be used to assign visibility.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:visible=&quot;false&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:visible=&quot;false&quot;/&gt;
			 * </pre>
			 */
			fieldVisible: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FieldControlType",
				target: [
					"Property"
				],
				allowList: {
					values: [
						"Hidden"
					]
				},
				defaultValue: false,
				appliesTo: [
					"field/#/visible"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Renders the initial chart fields for the SmartChart control. A <code>PropertyPath</code> and an <code>AnnotationPath</code> can be
			 * used for constructing PresentationVariant annotation. <i>XML Example of OData V4 with Customer and CompanyCode Properties as
			 * PresentationVariant</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.PresentationVariant&quot;&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property=&quot;Visualizations&quot;&gt;
			 *          &lt;Collection&gt;
			 *            &lt;AnnotationPath&gt;@UI.Chart&lt;/AnnotationPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *        &lt;PropertyValue Property=&quot;RequestAtLeast&quot;&gt;
			 *          &lt;Collection&gt;
			 *            &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;SortOrder&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot;/&gt;
			 *                &lt;PropertyValue Property=&quot;Descending&quot; Bool=&quot;true&quot;/&gt;
			 *              &lt;/Record&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;Customer&quot;/&gt;
			 *              &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 * </pre>
			 */
			presentationVariant: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "PresentationVariant",
				target: [
					"EntitySet", "EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"chartFields"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Renders a chart based on the information that is provided within the <code>Chart</code> annotation. <code>Chart</code> annotation
			 * must be defined for an </code>EntityType</code>
			 *
			 * <i>XML Example of OData V4 with Chart Annotation and ChartType Column Chart</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Item&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; String=&quot;Line Items&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Column&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;AmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;AmountInTransactionCurrency&lt;/PropertyPath&gt;
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
				target: [
					"EntityType"
				],
				allowList: {
					properties: ["ChartType", "Measures", "MeasureAttributes", "Dimensions", "DimensionAttributes"]

				},
				defaultValue: null,
				appliesTo: [
					"chart"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Based on the UI.DataPoint that is provided by the measure attributes, semantic patterns and coloring can be defined for the chart. The
			 * <code>UI.DataPoint</code> annotation must be defined for an </code>EntityType</code> <i>XML Example of OData V4 with DataPoint
			 * Annotation with semantic coloring</i> For more information see {@link sap.chart.ColoringType.Criticality}
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Item&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; String=&quot;Line Items&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Column&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;AmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;AmountInTransactionCurrency&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                  &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#semanticColoring&quot; /&gt;
			 *               &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;semanticColoring&quot; &gt;
			 * 	  &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 * 		&lt;PropertyValue Property=&quot;Value&quot; Path=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 * 		&lt;PropertyValue Property=&quot;Criticality&quot; EnumMember=&quot;sap.chart.ColoringType.Negative&quot; /&gt;
			 * 	  &lt;/Record&gt;
			 *     &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * Using this UI.DataPoint annotation, the semantic coloring for a measure changes as follows:
			 *
			 * <pre>
			 *    var oColorings = {
			 *        Criticality: {
			 *           MeasureValues: {
			 *               "AmountInCompanyCodeCurrency": {
			 *                    Static: sap.chart.ColoringType.Negative
			 *               }
			 *           }
			 *    }
			 * </pre>
			 *
			 * <i>XML Example of OData V4 with DataPoint Annotation with semantic pattern</i> For more information see
			 * {@link sap.chart.data.MeasureSemantics}
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Item&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; String=&quot;Line Items&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Column&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;AmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;TargetAmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                  &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#semanticPattern&quot; /&gt;
			 *               &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;semanticPattern&quot; &gt;
			 * 	  &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 * 		&lt;PropertyValue Property=&quot;Value&quot; Path=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 * 		&lt;PropertyValue Property=&quot;TargetValue&quot; Path=&quot;TargetAmountInCompanyCodeCurrency&quot; /&gt;
			 * 	  &lt;/Record&gt;
			 *     &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * Using this UI.DataPoint annotation, the semantics of the chart measures are set as follows:
			 *
			 * <pre>
			 * var oAmountInCompanyCodeCurrency = oChart.getMeasureByName(&quot;AmountInCompanyCodeCurrency&quot;);
			 * oAmountInCompanyCodeCurrency.setSemantics(sap.chart.data.MeasureSemantics.Actual);
			 *
			 * var oTargetAmountInCompanyCodeCurrency = oChart.getMeasureByName(&quot;TargetAmountInCompanyCodeCurrency&quot;);
			 * oTargetAmountInCompanyCodeCurrency.setSemantics(sap.chart.data.MeasureSemantics.Reference);
			 * </pre>
			 */
			dataPoint: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPoint",
				target: [
					"PropertyValue"
				],
				defaultValue: null,
				appliesTo: [
					"dataPoint"
				],
				group: [
					"Behavior"
				],
				since: "1.48.0"
			},

			/**
			 * A descriptive text for values of the annotated property.
			 * If no text arrangement has been defined, the default display behavior is <code>TextFirst</code>.
			 *
			 * An example how this is set in OData v4 is shown here:
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Text&quot; Path=&quot;ProductName&quot;&gt;
			 * </pre>
			 *
			 * In OData v2 it looks like this:
			 *
			 * <pre>
			 *     &lt;Property name="ProductId" ... sap:text=&quot;ProductName&quot;/&gt;
			 * </pre>
			 */
			text: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Text",
				target: ["Property"],
				defaultValue: null,
				appliesTo: [
					"text"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.32.1"
			},

			/**
			 * Describes the arrangement of an ID value and its description.
			 *
			 * The following enumeration members are allowed:
			 *
			 * <ul>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate</code>:
			 * The control displays the specified ID only.</li>
			 *
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst</code>:
			 * The control displays the specified description followed by its ID.</li>
			 *
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextLast</code>:
			 * The control displays the specified ID followed by its description.</li>
			 *
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly</code>:
			 * The control displays the specified description only.</li>
			 * </ul>
			 *
			 * <i>XML Example of OData V4 with <code>TextArrangement</code>
			 * annotation on an entity's property</i>
			 *
			 * <pre>
			 * &lt;Annotations xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot; Target=&quot;namespace.Product/Category&quot;&gt;
			 * 	&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Text&quot; Path=&quot;CategoryName&quot;&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.TextArrangement&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.TextArrangementType/TextLast&quot; /&gt;
			 * 	&lt;/Annotation&gt;
			 * &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <i>XML Example of OData V4 with <code>TextArrangement</code>
			 * annotation on entity <code>Product</code></i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Namespace.ProductType&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.TextArrangement&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			textArrangement: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "TextArrangement",
				target: [
					"EntityType",
					"Annotation"
				],
				defaultValue: null,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.32.1"
			},

			/**
			 * Indicates whether the value of the annotated Entity Data Model (EDM) property represents a fiscal
			 * year number following the <code>YYYY(Y*)</code> pattern.
			 *
			 * The logical pattern <code>YYYY(Y*)</code> consists of at least four digits.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Year&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Year&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.82"
			},

			/**
			 * Indicates whether the value of the annotated Entity Data Model (EDM) property represents a fiscal
			 * year and period number following the <code>YYYY(Y*)PPP</code> pattern.
			 *
			 * The logical pattern <code>YYYY(Y*)PPP</code> consists of at least seven digits, where the last
			 * three digits represent the fiscal period of the year.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Year&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Year&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearPeriod&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalYearPeriod: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearPeriod",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.82"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'M' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'M' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalPeriod&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalPeriod: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalPeriod",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'Q' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Q' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'yQ' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'yQ' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalYearQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'w' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'w' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'Yw' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Yw' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsFiscalYearWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the value of the annotated Entity Data Model (EDM) property represents a calendar
			 * year following the logical pattern <code>(-?)YYYY(Y*)</code>.
			 *
			 * The logical pattern <code>(-?)YYYY(Y*)</code> consists of an optional minus sign for years B.C.
			 * followed by at least four digits.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Year&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Year&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsCalendarYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYear",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.82"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Q' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Q' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 */
			IsCalendarQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'm' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'm' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarMonth&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 */
			IsCalendarMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarMonth",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'w' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'w' pattern.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 */
			IsCalendarWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Indicates whether the value of the annotated Entity Data Model (EDM) property represents a calendar
			 * year and quarter following the logical pattern <code>(-?)YYYY(Y*)Q</code>.
			 *
			 * The logical pattern <code>(-?)YYYY(Y*)Q</code> consists of an optional minus sign for years B.C.
			 * followed by at least five digits, where the last digit represents the quarter.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Year&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Year&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsCalendarYearQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearQuarter",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.82"
			},

			/**
			 * Indicates whether the value of the annotated Entity Data Model (EDM) property represents a calendar
			 * year and month following the logical pattern <code>(-?)YYYY(Y*)MM</code>.
			 *
			 * The logical pattern <code>(-?)YYYY(Y*)MM</code> consists of an optional minus sign for years B.C.
			 * followed by at least six digits, where the last two digits represent the months January to December.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Year&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Year&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearMonth&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsCalendarYearMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearMonth",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.82"
			},

			/**
			 * Indicates whether the value of the annotated Entity Data Model (EDM) property represents a calendar
			 * year and week following the logical pattern <code>(-?)YYYY(Y*)WW</code>.
			 *
			 * The logical pattern <code>(-?)YYYY(Y*)WW</code> consists of an optional minus sign for years B.C.
			 * followed by at least six digits, where the last two digits represent the week numbers of the year.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 * 	  &lt;Property Name=&quot;Year&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Year&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			IsCalendarYearWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearWeek",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.82"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the pattern 'YYYYMMDD'.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP date strings with the pattern 'YYYYMMDD'.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; MaxLength=&quot;20&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarDate&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 */
			IsCalendarDate: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarDate",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"Dimensions"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			}
			,
			/**
			 * Indicates whether a <code>Property</code> of type <code>Edm.DateTimeOffset</code> contains a time zone.
			 *
			 * <i>XML Example of the OData V4 Timezone Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Created&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Timezone&quot; Path=&quot;Timezone&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			timezone: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Timezone",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["Dimensions"],
				group: ["Appearance", "Behavior"],
				since: "1.117"
			}
		},

		customData: {

			/**
			 * Overrides the default settings for formatting dates in all dimensions of the SmartChart control. The format settings can be provided as
			 * a JSON object or a JSON string. For more information see {@link sap.ui.model.type.Date}
			 */
			dateFormatSettings: {
				type: "string",
				defaultValue: "\{'UTC':'true'\}",
				group: [
					"Appearance"
				],
				since: "1.28.1"
			},

			/**
			 * If set to
			 * <code>true</code> the UI.Chart annotation will not be taken into account when creating the content of the Smart Chart control.
			 */
			skipAnnotationParse: {
				type: "boolean",
				defaultValue: null,
				appliesTo: [
					"content"
				],
				since: "1.28.1"
			},

			/**
			 * Used for dimension properties that has an additional sap:text annotation for further description. For more information see
			 * {@link sap.ui.comp.smartfilterbar.DisplayBehaviour} <b>Note</b> Use the annotation UI.TextArrangement instead.
			 */
			defaultDimensionDisplayBehaviour: {
				type: "sap.ui.comp.smartfilterbar.DisplayBehaviour",
				defaultValue: "",
				since: "1.28.1"
			},

			/**
			 * When set to the SmartChart control the UI.Chart annotation that matches the qualifier is rendered on the UI, otherwise the
			 * non-qualified UI.Chart annotation is rendered. <b>Note</b> the chart qualifier is only evaluated in case no presentation variant is
			 * available -or- no valid visualization in presentation variant is available.
			 */
			chartQualifier: {
				type: "string",
				defaultValue: null,
				appliesTo: [
					"content"
				]
			},

			/**
			 * When set to the SmartChart control, the UI.PresentationVariant annotation that matches the qualifier and have a visualization for the
			 * UI:Chart annotation is used to have influence on presented chart type, on sorting etc.
			 */
			presentationVariantQualifier: {
				type: "string",
				defaultValue: null,
				appliesTo: [
					"content"
				]
			},

			/**
			 * A JSON object containing the personalization dialog settings.
			 *
			 * <i>Below you can find a brief example</i>
			 *
			 * <pre><code>
			 * {
			 * 		group: {
			 * 			visible: false
			 * 		},
			 * 		sort: {
			 *      	visible: true
			 *  	},
			 *  	filter: {
			 *     	 	visible:false
			 *  	}
			 * }
			 * </code></pre>
			 */
			p13nDialogSettings: {
				type: "object",
				defaultValue: {}
			}
		},

		properties: {

			entitySet: {
				ignore: true
			},

			smartFilterId: {
				ignore: true
			},

			ignoredFields: {
				ignore: true
			},

			requestAtLeastFields: {
				ignore: false
			},

			ignoreFromPersonalisation: {
				ignore: true
			},

			chartType: {
				ignore: true
			},

			ignoredChartTypes: {
				ignore: false
			},

			useVariantManagement: {
				ignore: true
			},

			useChartPersonalisation: {
				ignore: true
			},

			header: {
				ignore: false
			},

			headerLevel: {
				ignore: false
			},

			headerStyle: {
				ignore: false
			},

			persistencyKey: {
				ignore: true
			},

			currentVariantId: {
				ignore: false
			},

			enableAutoBinding: {
				ignore: false
			},

			chartBindingPath: {
				ignore: false
			},

			showDrillButtons: {
				ignore: false
			},

			showZoomButtons: {
				ignore: false
			},

			showSemanticNavigationButton: {
				ignore: false
			},

			showVariantManagement: {
				ignore: false
			},

			showDownloadButton: {
				ignore: false
			},

			showDetailsButton: {
				ignore: false
			},

			showDrillBreadcrumbs: {
				ignore: false
			},

			showChartTooltip: {
				ignore: false
			},

			showLegendButton: {
				ignore: false
			},

			legendVisible: {
				ignore: false
			},

			selectionMode: {
				ignore: false
			},

			showFullScreenButton: {
				ignore: false
			},

			useTooltip: {
				ignore: false
			},

			useListForChartTypeSelection: {
				ignore: true
			},

			detailsItemActionFactory: {
				ignore: false
			},

			detailsListActionFactory: {
				ignore: true
			},
			noData: {
				ignore: false
			},
			showChartTypeSelectionButton: {
				ignore: false
			},
			showDimensionsTitle: {
				ignore: false
			},
			showToolbar: {
				ignore: false
			},
			toolbarStyle: {
				ignore: false
			},
			showMeasuresTitle: {
				ignore: false
			},
			activateTimeSeries: {
				ignore: true
			},
			/**
			 * Text to show for values of an empty string.
			 * <b>Note:</b> Does not change the behavior for timeseries type charts.
			 * <b>Note:</b> Can only be changed in the view. Later changes are not necessarily reflected.
			 *
			 */
			notAssignedText : {
				ignore: false,
				since: "1.106"
			}
		},
		aggregations : {
			items  : {
				ignore : false, //enable the hidden aggregation
				propagateMetadata : function(oInnerControl){  //will be called for all successor controls
					if (oInnerControl.isA("sap.ui.comp.smartvariants.SmartVariantManagement") ||
					oInnerControl.isA("sap.m.OverflowToolbar") ||
					oInnerControl.isA("sap.ui.comp.smartvariants.PersonalizableInfo") ||
					oInnerControl.isA("sap.m.Button")
					){
						return null;
					} else {
						return {
							actions: "not-adaptable" //overwrites all actions for all other controls and
														//no property changes or other technical changes are possible (not editable/selectable)
						};
					}
				},
				propagateRelevantContainer : true
			}
		}
	};
});
