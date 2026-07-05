/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.provider.ValueHelpProvider
sap.ui.define([], function() {
	"use strict";

	return {
		annotations: {
			/**
			 * Contains annotations that provide information for rendering a <code>ValueHelp/Suggest</code> that are set on the <code>Property</code>.
			 * Each parameter in the <code>ValueList</code> annotation has a maximum of two parameters:
			 * <ol>
			 *   <li>LocalDataProperty - Path to the property in the local entity that triggered the <code>ValueHelp/Suggest</code>.</li>
			 *   <li>ValueListProperty - Path to property in the ValueList entity.</li>
			 * </ol>
			 *
			 * <b>Note:</b> Currently only the <code>EntitySet</code> with the <code>CollectionPath</code> is supported that should be part of the same metadata service.
			 *
			 * <i>XML Example of V4 with CompanyCode ValueHelp/Suggest</i>
			 * <pre>
			 *    &lt;Annotations Target="CompanyCode" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.ValueList"&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="CollectionPath" String="Company" /&gt;
			 *             &lt;PropertyValue Property="SearchSupported" Bool="true" /&gt;
			 *             &lt;PropertyValue Property="Parameters"&gt;
			 *                &lt;Collection&gt;
			 *                   &lt;Record&gt;
			 *                      &lt;PropertyValue Property="LocalDataProperty" PropertyPath="CompanyCode" /&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="Company" /&gt;
			 *                   &lt;/Record&gt;
			 *                &lt;/Collection&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			valueList: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueList",
				target: ["Property", "Parameter"],
				defaultValue: null,
				appliesTo: ["valueHelp"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders the column fields in the <code>ValueHelp/Suggest</code>.
			 *
			 * <i>XML Example of V4 with CompanyName as Column in ValueHelp/Suggest</i>
			 * <pre>
			 *    &lt;Annotations Target="CompanyCode" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.ValueList"&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="CollectionPath" String="Company" /&gt;
			 *             &lt;PropertyValue Property="SearchSupported" Bool="true" /&gt;
			 *             &lt;PropertyValue Property="Parameters"&gt;
			 *                &lt;Collection&gt;
			 *                   &lt;Record&gt;
			 *                      &lt;PropertyValue Property="LocalDataProperty" PropertyPath="CompanyCode" /&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="Company" /&gt;
			 *                   &lt;/Record&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly"&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="CompanyName" /&gt;
			 *                   &lt;/Record&gt;
			 *                &lt;/Collection&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			valueListParameterDisplayOnly: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueListParameterDisplayOnly",
				target: ["PropertyPath"],
				defaultValue: null,
				appliesTo: ["valueHelp/#columnList"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether the data that is set in the control context for <code>LocalDataProperty</code> must be taken into consideration
			 * when the </code>ValueHelp/Suggest</code> is opened.
			 * The value will be set into the <code>ValueListProperty</code> in the <code>ValueHelp/Suggest</code>
			 * and can be used to filter data in the <code>ValueHelp/Suggest</code>.
			 *
			 * <i>XML Example of OData V4 with ValueListParameterIn on CompanyCode Property</i>
			 * <pre>
			 *    &lt;Annotations Target="CompanyCode" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.ValueList"&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="CollectionPath" String="Company" /&gt;
			 *             &lt;PropertyValue Property="SearchSupported" Bool="true" /&gt;
			 *             &lt;PropertyValue Property="Parameters"&gt;
			 *                &lt;Collection&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterIn"&gt;
			 *                      &lt;PropertyValue Property="LocalDataProperty" PropertyPath="CompanyCode" /&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="Company" /&gt;
			 *                   &lt;/Record&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly"&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="CompanyName" /&gt;
			 *                   &lt;/Record&gt;
			 *                &lt;/Collection&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			valueListParameterIn: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueListParameterIn",
				target: ["PropertyPath"],
				defaultValue: null,
				appliesTo: ["valueHelp/#field"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether the <code>ValueListProperty</code> parameter of the <code>ValueHelp/Suggest</code> selection context
			 * will set the data back into the <code>LocalDataProperty</code> context of the control that triggered the <code>ValueHelp/Suggest</code>
			 *
			 * <i>XML Example of OData V4 with ValueListParameterOut on CompanyCode Property</i>
			 * <pre>
			 *    &lt;Annotations Target="CompanyCode" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.ValueList"&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="CollectionPath" String="Company" /&gt;
			 *             &lt;PropertyValue Property="SearchSupported" Bool="true" /&gt;
			 *             &lt;PropertyValue Property="Parameters"&gt;
			 *                &lt;Collection&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterOut"&gt;
			 *                      &lt;PropertyValue Property="LocalDataProperty" PropertyPath="CompanyCode" /&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="Company" /&gt;
			 *                   &lt;/Record&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly"&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="CompanyName" /&gt;
			 *                   &lt;/Record&gt;
			 *                &lt;/Collection&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			valueListParameterOut: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueListParameterOut",
				target: ["PropertyPath"],
				defaultValue: null,
				appliesTo: ["valueHelp/#field"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * A combination of the <code>ValueListParameterIn</code> and <code>ValueListParameterOut</code> annotations that provides
			 * functions for both of these annotations.
			 *
			 * <i>XML Example of OData V4 with ValueListParameterInOut on CompanyCode Property</i>
			 * <pre>
			 *    &lt;Annotations Target="CompanyCode" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.ValueList"&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="CollectionPath" String="Company" /&gt;
			 *             &lt;PropertyValue Property="SearchSupported" Bool="true" /&gt;
			 *             &lt;PropertyValue Property="Parameters"&gt;
			 *                &lt;Collection&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterInOut"&gt;
			 *                      &lt;PropertyValue Property="LocalDataProperty" PropertyPath="CompanyCode" /&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="Company" /&gt;
			 *                   &lt;/Record&gt;
			 *                   &lt;Record Type="com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly"&gt;
			 *                      &lt;PropertyValue Property="ValueListProperty" PropertyPath="CompanyName" /&gt;
			 *                   &lt;/Record&gt;
			 *                &lt;/Collection&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			valueListParameterInOut: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueListParameterInOut",
				target: ["PropertyPath"],
				defaultValue: null,
				appliesTo: ["valueHelp/#field"],
				group: ["Behavior"],
				since: "1.28.1"
			}

		},
		customData: {
		}
	};
});