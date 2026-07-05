/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartfilterbar.SmartFilterBar control.
sap.ui.define([
	"sap/base/i18n/date/CalendarWeekNumbering",
	"sap/ui/comp/delegates/FlexibilityDelegate"
], function(
	_CalendarWeekNumbering, // implicitly used for property calendarWeekSettings
	FlexibilityDelegate
) {
	"use strict";
	return {
		actions: {
			compVariant: function(oControl) {
				if (
					oControl.isA("sap.ui.comp.smartfilterbar.SmartFilterBar")
					&& oControl.getVariantManagement()
					&& oControl.getVariantManagement().isA("sap.ui.comp.smartvariants.SmartVariantManagement")
					&& oControl.getVariantManagement().isVariantAdaptationEnabled()
				) {
					return {
						name: "FILTER_BAR_ADAPT_FILTERS_DIALOG",
						additionalInfoKey: "FILTER_BAR_ADAPT_FILTERS_CONTEXT_MENU_INFO",
						changeType: "variantContent",
						handler: function(oControl, mPropertyBag) {
							return new Promise(function (resolve) {
								var fCallBack = function(oData) {
									resolve(oData);
								};
								oControl.showAdaptFilterDialogForKeyUser(mPropertyBag.styleClass, fCallBack);
							});
						}
					};
				}
			},
			annotation: function(oControl) {
				if (oControl.isA("sap.ui.comp.smartfilterbar.SmartFilterBar")) {
					return {
						textArrangement: FlexibilityDelegate.getTextArrangementDelegate(),
						label: FlexibilityDelegate.getLabelDelegate()
					};
				}
			}
		},
		annotations: {
			/**
			 * NonFilterableProperties defines whether a <code>Property</code> can be used for filtering data. All properties are filterable by
			 * default. In order to disable filtering capability, these properties must be excluded.
			 *
			 * <i>Example using OData V4 annotations on the entity set to excluded Customer and CompanyCode Properties</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;Org.OData.Capabilities.V1.FilterRestrictions&quot;&gt;
			 *      &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;NonFilterableProperties&quot;&gt;
			 *           &lt;Collection&gt;
			 *           	&lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *           &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filterable</code> annotation on the <code>Property</code> can be used to exclude properties from
			 * filtering.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:filterable=&quot;false&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:filterable=&quot;false&quot;/&gt;
			 * </pre>
			 *
			 * RequiredProperties defines mandatory filter fields. Filter fields with this annotation must be a part of the
			 * <code>$filter</code> request sent to the back-end.
			 * <b>Note:</b> Support for V4 annotation is added since SAPUI5 version 1.40. <i>XML
			 * Example of OData V4 with mandatory filters CompanyCode and Customer</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;Org.OData.Capabilities.V1.FilterRestrictions&quot;&gt;
			 *      &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;RequiresFilter&quot; Bool=&quot;true&quot;/&gt;
			 *          &lt;PropertyValue Property=&quot;RequiredProperties&quot;&gt;
			 *           &lt;Collection&gt;
			 *           	&lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *           &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:required-in-filter</code> annotation on the <code>Property</code> can be used for setting the filter as
			 * a mandatory filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:required-in-filter=&quot;true&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:required-in-filter=&quot;true&quot;/&gt;
			 * </pre>
			 */
			filterRestrictions: {
				namespace: "Org.OData.Capabilities.V1",
				annotation: "FilterRestrictions",
				target: [
					"EntitySet"
				],
				allowList: {
					properties: [
						"NonFilterableProperties", "RequiredProperties"
					]
				},
				defaultValue: true,
				appliesTo: [
					"filterItem/#/value"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * Defines a group with filter fields. The filter fields are listed as {@link sap.ui.comp.smartfilterbar.SmartFilterBar#DataField DataField}
			 * records that reference other properties within the same EntityType.
			 *
			 * <i>Example in OData V4 notation with properties <code>CompanyName</code> and <code>CompanyIndustry</code></i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.FieldGroup&quot; Qualifier=&quot;FieldGroup1&quot;&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property=&quot;Label&quot; String=&quot;Custom Field Group 1&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;Data&quot;&gt;
			 *          &lt;Collection&gt;
			 * 				&lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataField&quot;&gt;
			 *					&lt;PropertyValue Property=&quot;Value&quot; Path=&quot;CompanyName&quot; /&gt;
			 *					&lt;PropertyValue Property=&quot;Label&quot; String=&quot;Customer Name&quot; /&gt;
			 *				&lt;/Record&gt;
			 * 				&lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataField&quot; &gt;
			 *					&lt;PropertyValue Property=&quot;Value&quot; Path=&quot;CompanyIndustry&quot; /&gt;
			 *					&lt;PropertyValue Property=&quot;Label&quot; String=&quot;Industry&quot; /&gt;
			 *				&lt;/Record&gt;
			 *            &lt;PropertyPath&gt;CompanyName&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			fieldGroup: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "FieldGroup",
				target: [
					"EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"filterGroupItem"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * Defines the relevant field groups by referencing them as <code>ReferenceFacet</code>. If a filter facet has been defined,
			 * only the referenced field groups are displayed in the <i>Adapt Filters</i> dialog, the other filters are omitted. <br>
			 * If you don't define any filter facets all field groups are displayed.
			 *
			 * <i>Example in OData V4 notation with two relevant field groups with qualifiers <code>FieldGroup1</code> and <code>FieldGroup2</code>
			 * (see also annotation {@link sap.ui.comp.smartfilterbar.SmartFilterBar#FieldGroup FieldGroup} for reference)</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.FilterFacets&quot; &gt;
			 *      &lt;Collection&gt;
			 *        &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ReferenceFacet&quot; &gt;
			 *          &lt;PropertyValue Property=&quot;Target&quot; AnnotationPath=&quot;com.sap.vocabularies.UI.v1.FieldGroup#FieldGroup1&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Label&quot; String=&quot;Field Group 1&quot; /&gt;
			 *      &lt;/Record&gt;
			 *        &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.ReferenceFacet&quot; &gt;
			 *          &lt;PropertyValue Property=&quot;Target&quot; AnnotationPath=&quot;com.sap.vocabularies.UI.v1.FieldGroup#FieldGroup2&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Label&quot; String=&quot;Field Group 2&quot; /&gt;
			 *      &lt;/Record&gt;
			 *      &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			filterFacet: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "FilterFacets",
				target: [
					"EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"filterGroupItem"
				],
				group: [
					"Behavior"
				],
				since: "1.48"
			},
			/**
			 * A descriptive text for values of the annotated property.
			 *
			 * <b>Note:</b> The value must be a dynamic expression when used as metadata
			 * annotation.
			 *
			 * <i>XML Example of OData V4 Text on CustomerName Property</i>
			 *
			 * <pre>
			 * &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Text&quot; Path=&quot;CustomerName&quot; /&gt;
			 * </pre>
			 * <b>Note:</b> The <code>Path</code> property is mandatory.
			 *
			 * For OData V2 the <code>sap:text</code> annotation on the <code>Property</code> can be used to assign a text/description.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; type=&quot;Edm.String&quot; sap:text=&quot;CustomerName&quot;/&gt;
			 *    &lt;Property Name=&quot;CustomerName&quot; type=&quot;Edm.String&quot;/&gt;
			 * </pre>
			 *
			 * <b>Note:</b> The <code>Text</code> annotation is not respected in dropdown scenario when a <code>sap.m.ComboBox</code> or a <code>sap.m.Select</code> is rendered.
			 * For example, when you add the <code>com.sap.vocabularies.Common.v1.Text</code> annotation and set <code>com.sap.vocabularies.Common.v1.ValueListWithFixedValues</code>
			 * to true, the text will be populated with corresponding value from the ValueList Collection's item. The <code>com.sap.vocabularies.UI.v1.TextArrangement</code> will be applied in both cases.
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
				target: ["EntityType", "com.sap.vocabularies.Common.v1.Text"],
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
			 * Specifies the structure for the list of possible values. This annotation is rendered as the value help dialog and suggestion list,
			 * displayed upon typing.
			 * For the suggestion list feature, the annotation without qualifier is used.
			 *
			 * <b>Note</b>: This annotation is only supported for Entity Data Model (EDM) properties typed as:
			 *
			 * <ul>
			 * 	<li><code>Edm.String</code></li>
			 * 	<li><code>Edm.Guid</code></li>
			 * </ul>
			 *
			 * Each parameter on the <code>ValueList</code> annotation has a maximum of two properties:
			 * <ul>
			 * <li>LocalDataProperty - Path to the property of the local entity that triggered the <code>ValueList</code>.</li>
			 * <li>ValueListProperty - Path to the property of the <code>ValueList</code> entity.</li>
			 * </ul>
			 *
			 * <b>Optional</b>: <code>ValueListParameterIn</code> specifies a property that is used to filter the value list.
			 *
			 * <b>Optional</b>: <code>ValueListParameterOut</code> specifies a property that is filled depending on the selection from the value list.
			 *
			 * <b>Optional</b>: <code>ValueListParameterConstant</code> specifies a constant value that is used to filter the value list with exact match. The constant value is hidden from the UI.
			 *
			 * <b>Optional</b>: Each parameter can be statically annotated as important with the
			 * <code>com.sap.vocabularies.UI.v1.Importance</code> annotation.
			 * <code>com.sap.vocabularies.UI.v1.ImportanceType/High</code> must be provided as an enumeration member (EnumMember).
			 *
			 * Only the important parameters are displayed as columns in the suggestion list.
			 *
			 * If the <code>Importance</code> annotation is not used, all of the parameters are displayed.
			 *
			 * The annotation supports a <code>FetchValues</code> property. When it is set to 2, the table in the <code>ValueHelpDialog</code>
			 * is not populated on initial load. When it is set to 1, the table is populated with values on
			 * initial load.
			 *
			 * <b>Note</b>: The <code>CollectionPath</code> property does not support paths with navigation properties.
			 *
			 * <b>Note</b>: The <code>CollectionRoot</code> property is not supported.
			 *
			 * <i>Example in OData V4 notation with property "Category" with a <code>ValueList</code></i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.ValueList&quot;&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property=&quot;Label&quot; String=&quot;Category&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;CollectionPath&quot; String=&quot;Category&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;SearchSupported&quot; Bool=&quot;true&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;FetchValues&quot; Int=&quot;2&quot; /&gt;
			 *        &lt;PropertyValue Property=&quot;Parameters&quot;&gt;
			 *          &lt;Collection&gt;
			 *            &lt;Record Type=&quot;com.sap.vocabularies.Common.v1.ValueListParameterInOut&quot;&gt;
			 *              &lt;PropertyValue Property=&quot;LocalDataProperty&quot; PropertyPath=&quot;Category&quot; /&gt;
			 *              &lt;PropertyValue Property=&quot;ValueListProperty&quot; String=&quot;Description&quot; /&gt;
			 *              &lt;Annotation Term="com.sap.vocabularies.UI.v1.Importance"
			 *					EnumMember="com.sap.vocabularies.UI.v1.ImportanceType/High" /&gt;
			 *            &lt;/Record&gt;
			 *            &lt;Record Type=&quot;com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly&quot;&gt;
			 *              &lt;PropertyValue Property=&quot;ValueListProperty&quot; String=&quot;CategoryName&quot; /&gt;
			 *            &lt;/Record&gt;
			 *            &lt;Record Type=&quot;com.sap.vocabularies.Common.v1.ValueListParameterIn&quot;&gt;
			 *              &lt;PropertyValue Property=&quot;LocalDataProperty&quot; PropertyPath=&quot;Supplier&quot; /&gt;
			 *              &lt;PropertyValue Property=&quot;ValueListProperty&quot; String=&quot;SupplierName&quot; /&gt;
			 *            &lt;/Record&gt;
			 *            &lt;Record Type=&quot;com.sap.vocabularies.Common.v1.ValueListParameterOut&quot;&gt;
			 *              &lt;PropertyValue Property=&quot;LocalDataProperty&quot; PropertyPath=&quot;Product&quot; /&gt;
			 *              &lt;PropertyValue Property=&quot;ValueListProperty&quot; String=&quot;ProductId&quot; /&gt;
			 *            &lt;/Record&gt;
			 *            &lt;Record Type=&quot;com.sap.vocabularies.Common.v1.ValueListParameterConstant&quot;&gt;
			 *              &lt;PropertyValue Property=&quot;Constant&quot; String=&quot;Automotive&quot; /&gt;
			 *              &lt;PropertyValue Property=&quot;ValueListProperty&quot; String=&quot;CategoryType&quot; /&gt;
			 *            &lt;/Record&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 */
			valueList: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueList",
				target: [
					"Property", "Parameter"
				],
				allowList: {
					properties: [
						"Label", "CollectionPath", "Parameters", "SearchSupported", "FetchValues"
					]
				},
				defaultValue: null,
				appliesTo: [
					"field/#/fieldHelp"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * If specified as <code>true</code>, there's only one value list mapping and its value list
			 * consists of a small number of fixed values.
			 * The value list will be rendered as pick list containing all possible values.
			 *
			 * <b>Note</b>: As of version 1.78, value lists with fixed values support the use of the <code>ValueListParameterIn</code> and <code>ValueListParameterOut</code> properties.
			 *
			 * <i>Example in OData V4 notation Value List on Category Property</i>
			 *
			 * <pre>
			 *     &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.ValueListWithFixedValues&quot; Bool=&quot;true&quot;/&gt;
			 * </pre>
			 */
			valueListWithFixedValues: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ValueListWithFixedValues",
				target: [
					"Property", "Parameter"
				],
				defaultValue: null,
				appliesTo: [
					"field/#/fieldHelp"
				],
				group: [
					"Behavior"
				],
				since: "1.48.1"
			},

			/**
			* Defines the status of all fields of the <code>ValueHelpDialog</code> control as valid, deprecated or revoked. Each status has a corresponding letter. For deprecated it's ‘W’, for revoked – ‘E’ and for valid we use an empty string.
			* <b>Note:</b> Values with revoked status are hidden. The only way to visualize them is to filter all values by typing the corresponding letter for revoked types – ‘E’ in the <code>DeprecationCode</code> filtering input field in the <code>ValueHelpDialog</code>.
			*
			* <i>Example in OData V4 notation with property <code>DeprecationCode</code> </i>
			* <pre>
			*     &lt;Property Name=&quot;DeprecationCode&quot; Type=&quot;Edm.String&quot; MaxLength=&quot;1&quot;/&gt;
			*
			*     &lt;Annotations Target=&quot;DeprecationCode&quot; &gt;
			*         &lt;Annotation Term=&quot;com.sap.vocabularies.CodeList.v1.IsConfigurationDeprecationCode&quot; Bool=&quot;true&quot;/&gt;
			*     &lt;/Annotations&gt;
			* </pre>
			*/
			isConfigurationDeprecationCode: {
				namespace: "com.sap.vocabularies.CodeList.v1",
				annotation: "IsConfigurationDeprecationCode",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"field"
				],
				group: [
					"Behavior"
				],
				since: "1.77"
			},

			/**
			* Provides the possibility to order the values of the value list with fixed values by property and in ascending or descending order.
			* <b>Note:</b> The annotation should point to the EntityType of the value list with fixed values.
			* <b>Note:</b> The property by which the values are ordered should be part of the EntityType of the value list with fixed values.
			* <b>Note:</b> The annotation will be ignored if the <code>considerPresentationVariant</code> property is set to <code>false</code>.
			*
			* <i>Example in OData V4 notation with property <code>CompanyCode</code> </i>
			* <pre>
			*  &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.PresentationVariant&quot;&gt;
			*    &lt;Record&gt;
			*     &lt;PropertyValue Property=&quot;SortOrder&quot;&gt;
			*       &lt;Collection&gt;
			*         &lt;Record&gt;
			*           &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot;/&gt;
			*           &lt;PropertyValue Property=&quot;Descending&quot; Bool=&quot;true&quot;/&gt;
			*         &lt;/Record&gt;
			*       &lt;/Collection&gt;
			*     &lt;/PropertyValue&gt;
			*    &lt;/Record&gt;
			*  &lt;/Annotation&gt;
			* </pre>
			*/
			presentationVariant: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "PresentationVariant",
				target: [
					"EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"field"
				],
				group: [
					"Behavior"
				],
				since: "1.98"
			},

			/**
			 * A short, human-readable text suitable for tooltips in user interfaces.
			 *
			 * <i>XML Example of OData V4 with Tooltip on CompanyCode Property</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;CompanyCode&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.QuickInfo&quot; Path=&quot;CompanyCodeQuickInfo&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;CompanyQuickInfo&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:quickinfo</code> annotation on the <code>Property</code> can be used to assign information relevant for
			 * tooltips of the field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:quickinfo=&quot;Company Code quickinfo&quot;/&gt;
			 * </pre>
			 */
			 quickInfo: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "QuickInfo",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"fieldItem/#/tooltip"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * A short, human-readable text suitable for the filter's name. The <code>com.sap.vocabularies.Common.v1.Label</code> annotation is
			 * defined on the <code>Property</code>. If the <code>com.sap.vocabularies.Common.v1.Label</code> annotation is given, it has
			 * precedence. If none of the annotations are given, then the label will be the Property name.
			 *
			 * <i>Example in OData V4 notation where property "CustomerName" contains the label assigned to property "CustomerId"</i>
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;CustomerId&quot;&gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Label&quot; Path=&quot;Customer&quot; String=&quot;Customer Name&quot;/&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:label</code> annotation on the <code>Property</code> can be used to define the label of the column.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:label=&quot;Customer Name&quot;/&gt;
			 * </pre>
			 */
			filterLabelOnProperty: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Label",
				target: [
					"Property", "PropertyPath"
				],
				defaultValue: null,
				appliesTo: [
					"filterItem/label"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * A short, human-readable text suitable for the filter's name. The <code>Label</code> annotation of
			 * <code>com.sap.vocabularies.UI.v1.DataField</code> is defined within <code>com.sap.vocabularies.UI.v1.LineItem</code> annotation.
			 * If the <code>com.sap.vocabularies.Common.v1.Label</code> annotation is given, it has precedence.
			 * If none of the annotations are given, then the label will be the Property name of the column.
			 *
			 * <i>Example in OData V4 notation where property "CustomerName" contains the label assigned to "Customer"</i>
			 * <pre>
			 *     &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataField&quot;&gt;
			 *         &lt;PropertyValue Property=&quot;Value&quot; Path=&quot;Customer&quot; /&gt;
			 *         &lt;PropertyValue Property=&quot;Label&quot; Path=&quot;CustomerName&quot; /&gt;
			 *     &lt;/Record&gt;
			 * </pre>
			 */
			filterLabelOnLineItem: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataField",
				target: [
					"Property", "Parameter"
				],
				allowList: {
					properties: [
						"Label"
					]
				},
				appliesTo: [
					"filterItem/label"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * <b>Note:</b> The annotation com.sap.vocabularies.Common.v1.FilterExpressionRestrictions has been deprecated and replaced by
			 * Org.OData.Capabilities.V1.FilterRestrictions - FilterExpressionRestrictions.
			 *
			 * Enum member MultiValue defines whether multiple values can be used in a single filter. With multi-value filtering, more that one
			 * "equals" condition can be defined for filtering the data.
			 * <i>Example in OData V4 notation with multi-value properties "Customer" and "CompanyCode"</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FilterExpressionRestrictions&quot; &gt;
			 *       &lt;Collection&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;Customer&quot; /&gt;
			 *             &lt;PropertyValue Property=&quot;AllowedExpressions&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FilterExpressionType/MultiValue&quot; /&gt;
			 *          &lt;/Record&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot; /&gt;
			 *             &lt;PropertyValue Property=&quot;AllowedExpressions&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.Common.v1.FilterExpressionType/MultiValue&quot; /&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filter-restriction="multi-value"</code> annotation on the <code>Property</code> can be used for
			 * rendering multi-value filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:filter-restriction=&quot;multi-value&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:filter-restriction=&quot;multi-value&quot;/&gt;
			 * </pre>
			 *
			 * Enum member SingleValue restricts the filter to only <b>one</b> single value entry. With single-value filtering, you cannot define
			 * more than one "equals" condition for filtering the data. <b>Note:</b> Support for V4 annotation is added since SAPUI5 version 1.40.
			 * <i>Example in OData V4 notation with single-value properties "Customer" and "CompanyCode"</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FilterExpressionRestrictions&quot; &gt;
			 *       &lt;Collection&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;Customer&quot; /&gt;
			 *             &lt;PropertyValue Property=&quot;AllowedExpressions&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FilterExpressionType/SingleValue&quot; /&gt;
			 *          &lt;/Record&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot; /&gt;
			 *             &lt;PropertyValue Property=&quot;AllowedExpressions&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FilterExpressionType/SingleValue&quot; /&gt;
			 *          &lt;/Record&gt;
			 *       &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filter-restriction="single-value"</code> annotation on the <code>Property</code> can be used for
			 * rendering a single-value filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:filter-restriction=&quot;single-value&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:filter-restriction=&quot;single-value&quot;/&gt;
			 * </pre>
			 *
			 * Enum member SingleInterval restricts the filter to specify an interval, for example, a date interval for filtering
			 * the data present between the given dates.
			 * <i>Example in OData V4 notation with Interval Restriction on "DocumentDate" property</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FilterExpressionRestrictions&quot; &gt;
			 *      &lt;Collection&gt;
			 *         &lt;Record&gt;
			 *            &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;DocumentDate&quot; /&gt;
			 *            &lt;PropertyValue Property=&quot;AllowedExpressions&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FilterExpressionType/SingleInterval&quot; /&gt;
			 *         &lt;/Record&gt;
			 *      &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filter-restriction="interval"</code> annotation on the <code>Property</code> can be used for rendering
			 * an interval filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;DocumentDate&quot; ... sap:filter-restriction=&quot;interval&quot;/&gt;
			 * </pre>
			 */
			filterExpression: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FilterExpressionType",
				target: [
					"EntitySet"
				],
				allowList: {
					values: [
						"MultiValue", "SingleValue", "SingleInterval"
					]
				},
				defaultValue: null,
				appliesTo: [
					"filterItem/#/input"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * The filter expression restriction "MultiValue" defines whether multiple filter clauses can be defined in a filter statement.
			 * When the expression "MultiValue" is present, multiple filter clauses that use the "equals" operator can be defined by a user.
			 *
			 * <i>XML Example of OData V4 with expression "MutliValue" for properties "Customer" and "CompanyCode"</i>
			 * <pre>
			 *    &lt;Annotation Term=&quot;Org.OData.Capabilities.V1.FilterRestrictions&quot; &gt;
			 *    	&lt;Record&gt;
			 *    		&lt;PropertyValue Property=&quot;FilterExpressionRestrictions&quot; &gt;
			 *       		&lt;Collection&gt;
			 *          		&lt;Record&gt;
			 *            			&lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;Customer&quot; /&gt;
			 *            			&lt;PropertyValue Property=&quot;AllowedExpressions&quot; String=&quot;MultiValue&quot; /&gt;
			 *         		 	&lt;/Record&gt;
			 *          		&lt;Record&gt;
			 *             			&lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot; /&gt;
			 *            			&lt;PropertyValue Property=&quot;AllowedExpressions&quot; String=&quot;MultiValue&quot; /&gt;
			 *          		&lt;/Record&gt;
			 *       		&lt;/Collection&gt;
			 *       	&lt;/PropertyValue&gt;
			 *       &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filter-restriction="multi-value"</code> annotation on the <code>property</code> can be used for
			 * rendering a multi-value filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:filter-restriction=&quot;multi-value&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:filter-restriction=&quot;multi-value&quot;/&gt;
			 * </pre>
			 *
			 * The filter expression restriction "SingleValue" restricts the number of filter clauses for the given property to only one in the filter statement.
			 * When the expression "SingleValue" is present, a user cannot define more than one "equals" condition for filtering the data.
			 *
			 * <i>XML Example of OData V4 with expression "SingleValue" for properties "Customer" and "CompanyCode"</i>
			 * <pre>
			 *    &lt;Annotation Term=&quot;Org.OData.Capabilities.V1.FilterRestrictions&quot; &gt;
			 *    	&lt;Record&gt;
			 *    		&lt;PropertyValue Property=&quot;FilterExpressionRestrictions&quot; &gt;
			 *       		&lt;Collection&gt;
			 *          		&lt;Record&gt;
			 *            			&lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;Customer&quot; /&gt;
			 *            			&lt;PropertyValue Property=&quot;AllowedExpressions&quot; String=&quot;SingleValue&quot; /&gt;
			 *         		 	&lt;/Record&gt;
			 *          		&lt;Record&gt;
			 *             			&lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot; /&gt;
			 *            			&lt;PropertyValue Property=&quot;AllowedExpressions&quot; String=&quot;SingleValue&quot; /&gt;
			 *          		&lt;/Record&gt;
			 *       		&lt;/Collection&gt;
			 *       	&lt;/PropertyValue&gt;
			 *       &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filter-restriction="single-value"</code> annotation on the <code>Property</code> can be used for
			 * rendering a single-value filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:filter-restriction=&quot;single-value&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:filter-restriction=&quot;single-value&quot;/&gt;
			 * </pre>
			 *
			 * <b>Note:</b> When the restriction "SingleVale" / "single-value" is used, the "Is Empty" operator cannot be used.
			 *
			 * The filter expression restriction" SingleRange" restricts the filter to specify an interval, for example, a date interval for filtering the data present
			 * between the given dates.
			 * <i>XML Example of OData V4 with expression "SingleRange" for property "DocumentDate"</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;Org.OData.Capabilities.V1.FilterRestrictions&quot; &gt;
			 *    	&lt;Record&gt;
			 *    		&lt;PropertyValue Property=&quot;FilterExpressionRestrictions&quot; &gt;
			 *       		&lt;Collection&gt;
			 *          		&lt;Record&gt;
			 *            			&lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;DocumentDate&quot; /&gt;
			 *            			&lt;PropertyValue Property=&quot;AllowedExpressions&quot; String=&quot;SingleRange&quot; /&gt;
			 *         		 	&lt;/Record&gt;
			 *       		&lt;/Collection&gt;
			 *       	&lt;/PropertyValue&gt;
			 *       &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:filter-restriction="interval"</code> annotation on the <code>Property</code> can be used for rendering
			 * an interval/range filter field.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;DocumentDate&quot; ... sap:filter-restriction=&quot;interval&quot;/&gt;
			 * </pre>
			 */
			FilterRestrictions: {
				namespace: "Org.OData.Capabilities.V1",
				annotation: "FilterRestrictions",
				target: [
					"EntitySet"
				],
				allowList: {
					values: [
						"FilterExpressionRestrictions"
					]
				},
				defaultValue: null,
				appliesTo: [
					"filterItem/#/input"
				],
				group: [
					"Behavior"
				],
				since: "1.64"
			},

			/**
			 * Defines whether certain fields should be initially visible in the <code>SmartFilterBar</code> control. The fields will be rendered in
			 * the order that is specified in this annotation. <b>Note:</b> This annotation is supported since SAPUI5 version 1.40.
			 *
			 * <i>Example in OData V4 notation with SelectionFields annotation.</i>
			 *
			 * <pre>
			 *   &lt;Annotations Target=&quot;Product&quot;&gt;
			 *     &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.SelectionFields&quot;&gt;
			 *       &lt;Collection&gt;
			 *         &lt;PropertyPath&gt;ProductCategory&lt;/PropertyPath&gt;
			 *         &lt;PropertyPath&gt;Supplier&lt;/PropertyPath&gt;
			 *         &lt;PropertyPath&gt;Product&lt;/PropertyPath&gt;
			 *       &lt;/Collection&gt;
			 *     &lt;/Annotation&gt;
			 *   &lt;/Annotations&gt;
			 * </pre>
			 */
			selectionFields: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "SelectionFields",
				target: [
					"EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"filterItem/#/value"
				],
				group: [
					"Behavior"
				],
				since: "1.40.1"
			},

			/**
			 * Defines whether a filter is visible. The <code>SmartFilterBar</code> control interprets the <code>EnumMembers</code>
			 * <code>FieldControlType/Inapplicable</code> and <code>FieldControlType/Hidden</code> (deprecated) of the <code>FieldControl</code>
			 * annotation to set the visibility.
			 * <b>Note:</b>The <code>FieldControlType/Inapplicable</code> annotation is only supported if you want to statically hide the filter fields.
			 *
			 *
			 * <i>Example in OData V4 notation with hidden properties "Customer" and "CompanyCode"</i>
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;.../Customer&quot;&gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *     &lt;/Annotations&gt;
			 *     &lt;Annotations Target=&quot;.../CompanyCode&quot;&gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Inapplicable&quot;/&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:visible</code> annotation on the <code>Property</code> can be used to assign visibility.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:visible=&quot;false&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:visible=&quot;false&quot;/&gt;
			 * </pre>
			 */
			filterVisible: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FieldControlType",
				target: [
					"Property"
				],
				allowList: {
					values: [
						"Hidden", "Inapplicable"
					]
				},
				defaultValue: false,
				appliesTo: [
					"property/#/visible"
				],
				group: [
					"Behavior"
				],
				since: "1.32.1"
			},

			/**
			 * Defines a certain field to not be rendered in the <code>SmartFilterBar</code> control, but still used as filter that can be set by the application code.
			 * <b>Note:</b>While properties annotated with <code>HiddenFilter</code> are considered during filtering, properties annotated with <code>Hidden</code>
			 * are ignored completely. If both annotations exist, <code>Hidden</code> is taken into consideration.
			 *
			 * <i>Example in OData V4 notation with invisible, filterable property "LocationName"</i>
			 * <pre>
			 *     &lt;Annotations Target=&quot;LocationName&quot; &gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.HiddenFilter&quot;/&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 */
			hiddenFilter: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "HiddenFilter",
				target: [
					"Property"
				],
				appliesTo: [
					"filterItem/hiddenFilter"
				],
				group: [
					"Behavior"
				],
				since: "1.44.0"
			},

			/**
			 * Defines a certain property to not be rendered in an application and also not used in the <code>SmartFilterBar</code> control.
			 * In contrast to <code>HiddenFilter</code>, a property annotated with <code>Hidden</code> is not used as a filter.
			 *
			 * As of version 1.76, when <code>SmartFilterBar</code> is used inside <code>ValueHelpDialog</code>,
			 * if a property is annotated with <code>Hidden</code>, it's not rendered but it's used as a filter.
			 *
			 * <b>Note:</b>The annotations <code>com.sap.vocabularies.Common.v1.FieldControlType/Inapplicable</code> and <code>Hidden</code> are interchangeable.
			 *
			 * <i>Example in OData V4 notation with hidden ProductPictureURL</i>
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;ProductPictureURL&quot; &gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Hidden&quot;/&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 */
			hidden: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "Hidden",
				target: [
					"Property"
				],
				appliesTo: [
					"filterItem/hidden",
					"property/visible"
				],
				group: [
					"Behavior"
				],
				since: "1.54"
			},

			/**
			 * Defines variant items, based on SelectionVariant annotation. SelectionVariants with a qualifier will be added as variants to the
			 * <code>VariantManagement</code> control.
			 * A SelectionVariant annotation <bold>without</bold> a qualifier will define the Standard variant, in case no vendor Standard variant exists.
			 * All mentioned filters will be treated as at least <code>partOfCurrentVariant</code>.
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;Namespace.Product&quot;&gt;
			 *         &lt;Annotation Qualifier=&quot;Group&quot; Term=&quot;com.sap.vocabularies.UI.v1.SelectionVariant&quot;&gt;
			 *             &lt;Record&gt;
			 *                 &lt;PropertyValue Text=&quot;SelectionVariant from Annotations&quot;/&gt;
			 *                 &lt;PropertyValue Property=&quot;SelectOptions&quot;&gt;
			 *                     &lt;Collection&gt;
			 *         			       &lt;Record Type=&quot;UI.SelectOptionType&quot;&gt;
			 *            			       &lt;PropertyValue Property=&quot;PropertyName&quot; PropertyPath=&quot;Bukrs&quot;/&gt;
			 *                             &lt;PropertyValue Property=&quot;Ranges&quot; &gt;
			 *                      	       &lt;Collection&gt;
			 *                          	       &lt;Record Type=&quot;UI.SelectionRangeType&quot;&gt;
			 *            						       &lt;PropertyValue Property=&quot;Sign&quot; EnumMember=&quot;UI.SelectionRangeSignType/I&quot;/&gt;
			 *            						       &lt;PropertyValue Property=&quot;Option&quot; EnumMember=&quot;UI.SelectionRangeOptionType/EQ&quot;/&gt;
			 *            						       &lt;PropertyValue Property=&quot;Low&quot; String=&quot;0001&quot;/&gt;
			 *                          	       &lt;/Record&gt;
			 *                                 &lt;/Collection&gt;
			 *                             &lt;/PropertyValue&gt;
			 *                         &lt;/Record&gt;
			 *                     &lt;/Collection&gt;
			 *                 &lt;/PropertyValue&gt;
			 *             &lt;/Record&gt;
			 *         &lt;Annotation&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 */
			selectionBVariant: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "SelectionVariant",
				target: [
					"EntityType"
				],
				appliesTo: [
					"SmartVariantManagement"
				],
				group: [
					"Behavior"
				],
				since: "1.48.0"
			},

			/**
			 * Defines a default value for the property to be used in filter expressions.
			 * A <code>FilterDefaultValue</code> is ignored when another source for filter initialization is available, like a
			 * <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> or a variant saved with the
			 * {@link sap.ui.comp.smartvariants.SmartVariantManagement SmartVariantManagement} control.
			 *
			 * <b>Note</b>: Analytical parameters (see {@link sap.ui.comp.smartfilterbar.SmartFilterBar#setConsiderAnalyticalParameters considerAnalyticalParameters}) are
			 * technically no filters. To initialize these fields use the <code>DefaultValue</code> attribute of the repsective property in the service's
			 * OData metadata.
			 *
			 * <i>Example in OData V4 notation for a string-typed property "ContactID"</i>
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;ContactID&quot; &gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FilterDefaultValue&quot; String=&quot;A0328&quot; /&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 */
			FilterDefaultValue: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FilterDefaultValue",
				target: [
					"Property"
				],
				appliesTo: [
					"filterItem"
				],
				group: [
					"Behavior"
				],
				since: "1.48.0"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'y' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'y' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalYear</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			fiscalYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Defines whether a string value is capitalized.
			 *
			 * <i>XML Example of OData V4 with Capitalized Customer and CompanyCode Properties</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsUpperCase&quot;&gt;
			 *        &lt;Collection&gt;
			 *           &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *           &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData V2 the <code>sap:display-format="UpperCase"</code> annotation on the <code>Property</code> can be used to render the text
			 * in uppercase format.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:display-format=&quot;UpperCase&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:display-format=&quot;UpperCase&quot;/&gt;
			 * </pre>
			 */
			 upperCase: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsUpperCase",
				target: [
					"Property", "Parameter"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Behavior"
				],
				since: "1.28.1"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'M' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'M' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalPeriod</code> annotation is currently experimental and might be renamed or redefined.
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
			fiscalPeriod: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalPeriod",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'yM' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'yM' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalYearPeriod</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearPeriod&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			fiscalYearPeriod: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearPeriod",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'Q' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Q' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalQuarter</code> annotation is currently experimental and might be renamed or redefined.
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
			fiscalQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'yQ' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'yQ' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalYearQuarter</code> annotation is currently experimental and might be renamed or redefined.
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
			fiscalYearQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'w' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'w' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalWeek</code> annotation is currently experimental and might be renamed or redefined.
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
			fiscalWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'Yw' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Yw' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalYearWeek</code> annotation is currently experimental and might be renamed or redefined.
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
			fiscalYearWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'd' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'd' pattern.
			 *
			 * <b>Note:</b> The <code>IsDayOfFiscalYear</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsDayOfFiscalYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			dayOfFiscalYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsDayOfFiscalYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the pattern 'yyyyMMdd'.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the pattern 'YYYYMMDD'.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; MaxLength=&quot;20&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarDate&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			 calendarDate: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarDate",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Behavior"
				],
				since: "1.54"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> contains only digit sequences
			 * (non-negative numeric values).
			 *
			 * Other input leads to validation errors and the value state message popup is shown.
			 * In addition, whenever the control's value property is changed on the user interface side, and the change
			 * has to be propagated back into the data model, then the value is either filled with leading zeroes
			 * (if the <code>maxLength</code> attribute is given) or the leading zeroes are removed (if no
			 * <code>maxLength</code> attribute is given).
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP <code>NUMC</code> (numeric text)
			 * data type.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; MaxLength=&quot;20&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsDigitSequence&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			 digitSequence: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsDigitSequence",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Behavior"
				],
				since: "1.46"
			},
			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'y' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'y' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYear</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Q' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Q' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarQuarter</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},
			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'yQ' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'yQ' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYearQuarter</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarYearQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},
			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'w' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'w' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarWeek</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},
			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Yw' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Yw' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYearWeek</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarYearWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},
			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'm' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'm' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarMonth</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarMonth&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarMonth",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},
			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Ym' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Ym' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYearMonth</code> annotation is currently experimental and might be renamed or redefined.
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearMonth&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			calendarYearMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearMonth",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"fieldItem/#/value"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.116"
			},
			/**
			 * Defines a value for the property to be set as custom data for filter control with key "sap-ui-DocumentationRef" that is used by SAP Companion.
			 *
			 * <i>Example in OData V4 notation for a string-typed property "ContactID"</i>
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;ContactID&quot; &gt;
			 *         &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.DocumentationRef&quot; String=&quot;VALUE&quot; /&gt;
			 *     &lt;/Annotations&gt;
			 * </pre>
			 */
			DocumentationRef: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "DocumentationRef",
				target: [
					"Property"
				],
				appliesTo: [
					"filterItem"
				],
				group: [
					"Behavior"
				],
				since: "1.127.0"
			}
		},
		properties: {
			entitySet: {
				ignore: true
			},
			entityType: {
				ignore: true
			},
			// deprecated
			resourceUri: {
				ignore: true
			},
			basicSearchFieldName: {
				ignore: true
			},
			enableBasicSearch: {
				ignore: true
			},
			considerAnalyticalParameters: {
				ignore: true
			},
			liveMode: {
				ignore: false
			},
			showMessages: {
				ignore: false
			},
			useDateRangeType: {
				ignore: false
			},
			suppressSelection: {
				ignore: false
			},
			/**
			* @deprecated As of version 1.127.0 with no replacement.
			*/
			considerSelectionVariants: {
				ignore: true
			},
			defaultSelectionVariantName: {
				ignore: true
			},
			useProvidedNavigationProperties: {
				ignore: true
			},
			navigationProperties: {
				ignore: true
			},
			considerPresentationVariant: {
				ignore: false
			}
		},
		customData: {
			/**
			 * Used for properties that has an additional sap:text annotation for further description and are displayed in a dropdown selection. For
			 * more information see {@link sap.ui.comp.smartfilterbar.DisplayBehaviour} <b>Note</b> Use the annotation UI.TextArrangement instead.
			 */
			defaultDropDownDisplayBehaviour: {
				type: "sap.ui.comp.smartfilterbar.DisplayBehaviour",
				defaultValue: "",
				since: "1.28.1"
			},
			/**
			 * Used for properties that has an additional sap:text annotation for further description and are displayed as a token.
			 *
			 * @see sap.ui.comp.smartfilterbar.DisplayBehaviour <b>Note</b> Use the annotation UI.TextArrangement instead.
			 */
			defaultTokenDisplayBehaviour: {
				type: "sap.ui.comp.smartfilterbar.DisplayBehaviour",
				defaultValue: "",
				since: "1.28.1"
			},
			/**
			 * If set to <code>true</code>, then the ValueHelp dialogs of the filters will be initially expanded.
			 * Alternatively, an object can be passed providing each individual OData property with the desired expanded state.
			 * {CompanyCode: 'true', CompanyName: 'false'}
			 */
			defaultFilterBarExpanded: {
				type: "any",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.116.0"
			},

			/**
			 * If set to <code>true</code>, then the ValueHelp dialogs of the filters will show all filters initially and not only the first 7.
			 * Alternatively, an object can be passed providing each individual OData property with the desired showAllFilters state.
			 * {CompanyCode: 'true', CompanyName: 'false'}
			 */
			defaultShowAllFilters: {
				type: "any",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.116.0"
			},
			/**
			 * Overrides the default settings for formatting dates. For more information see {@link sap.ui.model.type.Date}
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
			 * If set to <code>true</code> the contains filter operator will be used as default filter. For more information see
			 * {@link sap.ui.model.FilterOperator}
			 */
			useContainsAsDefaultFilter: {
				type: "boolean",
				defaultValue: false,
				since: "1.28.1"
			},
			/**
			 * If set to <code>true</code> the standard variant of the variant management is executed on selection.
			 */
			executeStandardVariantOnSelect: {
				type: "boolean",
				defaultValue: false,
				since: "1.28.1"
			},
			/**
			 * Used for properties to configure which is the first day of the week and the first week of the year.
			 *
			 * @see {@link module:sap/base/i18n/date/CalendarWeekNumbering}
			 */
			calendarWeekSettings: {
				type: "sap.base.i18n.date.CalendarWeekNumbering",
				defaultValue: "",
				since: "1.119"
			},
			/**
			 * If set to <code>true</code> determines there is a shortcut navigation to Today.
			 */
			showCurrentDateButton: {
				type: "boolean",
				defaultValue: false,
				since: "1.122"
			},
			/**
			 *If set to <code>true</code>, the value help dialogs for the filters won't use the <code>MultiSelectionPlugin</code> in the table.
			 * Instead, they'll show the "Select All/Deselect All" checkbox.
			 */
			showSelectAll: {
				type: "boolean",
				defaultValue: false,
				since: "1.132"
			}
		},
		actionsEffectiveAfter: "RECREATE", //changes need to be done before SmartFilterBar is initialized
		aggregations: {

			content: {
				propagateMetadata: function(oElement) {
					if (oElement.isA("sap.ui.comp.smartvariants.SmartVariantManagement")) {
						return null;
					}
					return {
						actions: "not-adaptable"
					};
				}
			},

			controlConfiguration: {
				specialIndexHandling: true
			},

			filterGroupItems: {
				ignore: true
			}

		}
	};
});
