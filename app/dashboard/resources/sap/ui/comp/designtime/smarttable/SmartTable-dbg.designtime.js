/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.smarttable.SmartTable control.
sap.ui.define([
	"./ToolbarContentMoveHandler",
	"sap/ui/core/Lib",
	"sap/ui/comp/delegates/FlexibilityDelegate"
], function(ToolbarContentMoveHandler, Library, FlexibilityDelegate) {
	"use strict";
	// Function to check if the specified element or a parent is related to some UI5 table
	function checkTableTypesMatch(oElement) {
		var oParent = oElement;
		while (oParent) {
			if (isTable(oParent) || oParent.isA("sap.m.Column")) {
				return true;
			}
			oParent = oParent.getParent();
		}
		return false;
	}

	function isTable(oElement) {
		return oElement.isA(["sap.m.Table", "sap.ui.table.Table", "sap.ui.table.TreeTable", "sap.ui.table.AnalyticalTable"]);
	}

	function isToolbar(oElement) {
		return oElement.isA(["sap.m.Toolbar", "sap.m.OverflowToolbar"]);
	}

	function isParentRowInstance(oElement) {
		var oParent = oElement;
		while (oParent) {
			if (oParent.isA(["sap.m.ColumnListItem", "sap.ui.table.Row"])) {
				return true;
			}
			oParent = oParent.getParent();
		}
		return false;
	}

	// Check if element is related to SmartLink (allow both SmartLink and ObjectIdentifier for RTA)
	function isSmartLinkRelated(oElement) {
		return oElement.isA(["sap.ui.comp.navpopover.SmartLink", "sap.m.ObjectIdentifier"]);
	}

	function getPropertyConfigFor(oElement) {
		var aAllowedProperties = null;

		if (oElement.isA("sap.m.Table")) {
			aAllowedProperties = [
				"alternateRowColors", "backgroundDesign", "footerText", "growing", "growingDirection", "growingScrollToLoad",
				"growingThreshold", "growingTriggerText", "includeItemInSelection", "mode", "noDataText", "popinLayout",
				"rememberSelections", "showSeparators", "sticky"
			];
		} else if (oElement.isA(["sap.ui.table.Table", "sap.ui.table.TreeTable", "sap.ui.table.AnalyticalTable"])) {
			aAllowedProperties = [
				"rowHeight", "columnHeaderHeight", "visibleRowCount", "selectionMode", "selectionBehavior", "threshold",
				"visibleRowCountMode", "minAutoRowCount", "enableColumnFreeze", "alternateRowColors", "scrollThreshold"
			];
		} else if (oElement.isA(["sap.m.Column"])) {
			aAllowedProperties = [
				"hAlign", "width", "autoPopinWidth"
			];
		} else if (oElement.isA(["sap.ui.table.Column"])) {
			aAllowedProperties = [
				"hAlign", "width", "minWidth"
			];
		}

		if (!aAllowedProperties) {
			return undefined;
		}

		var oPropConfig = {};
		var mAllProperties = oElement.getMetadata().getAllProperties();

		for (var key in mAllProperties) {
			oPropConfig[mAllProperties[key].name] = {
				ignore: aAllowedProperties.indexOf(mAllProperties[key].name) < 0
			};
		}

		return oPropConfig;
	}

	return {
		name: "{name}",
		description: "{description}",
		actions: {
			compVariant: function (oControl) {
				if (
					oControl.isA("sap.ui.comp.smarttable.SmartTable") &&
					oControl.getUseVariantManagement() && oControl.getUseTablePersonalisation() && oControl.getPersistencyKey() &&
					oControl.getVariantManagement() &&
					oControl.getVariantManagement().isA("sap.ui.comp.smartvariants.SmartVariantManagement") &&
					oControl.getVariantManagement().isVariantAdaptationEnabled()
				) {

					return {
						name: "VIEWSETTINGS_TITLE",
						additionalInfoKey: "VIEWSETTINGS_CONTEXT_MENU_INFO",
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
			settings: {
				toolbarActionMove: {
					name: Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_RTA_REARRANGE_TOOLBAR_CONTENT_MENU"),
					additionalInfoKey: "REARRANGE_TOOLBAR_CONTEXT_MENU_INFO",
					changeType : "ToolbarContentMove",
					isEnabled: ToolbarContentMoveHandler.isEnabled,
					icon: "sap-icon://share",
					handler: ToolbarContentMoveHandler.handleToolbarSettings,
					CAUTION_variantIndependent: true
				}
			},
			annotation:  function(oControl) {
				if (oControl.isA("sap.ui.comp.smarttable.SmartTable")) {
					return {
						textArrangement: FlexibilityDelegate.getTextArrangementDelegate(),
						label: FlexibilityDelegate.getLabelDelegate()
					};
				}
			}
		},
		propagateActions: ["compVariant", "settings", "annotation"],
		aggregations: {
			customToolbar: {
				ignore: true
			},
			semanticObjectController: {
				ignore: true
			},
			noData: {
				ignore: true
			},
			filterControlConfiguration: {
				ignore: true
			},
			items: {
				propagateMetadata: function(oElement) {
					// Disable key user adaptation for all other UI5 table related code and sap.m.Title
					if (isToolbar(oElement)) {
						return {
							actions: {
								addXML: {
									jsOnly: true
								}
							},
							aggregations: {
								content: {
									actions: {
										move: null
									}
								}
							}
						};
					} else if (isTable(oElement)) {
						return {
							properties: getPropertyConfigFor(oElement),
							actionsEffectiveAfter: "RECREATE", // actions like property change & addXML need to be done before SmartTable is initialized
							actions: null,
							aggregations: {
								columns: {
									specialIndexHandling: true // p13nData columnIndex has to be used
								},
								rows: {
									ignore: false,
									propagateMetadata: function(oElement) {
										if (!isSmartLinkRelated(oElement)) {
											return {
												actions: "not-adaptable"
											};
										}
									}
								}
							}
						};
					} else if (oElement.isA("sap.m.ColumnListItem")) {
						return {
							actionsEffectiveAfter: "RECREATE", // actions like property change & addXML need to be done before SmartTable is initialized
							actions: null,
							aggregations: {
								cells: {
									specialIndexHandling: true // p13nData columnIndex has to be used
								}
							}
						};
					} else if (!isSmartLinkRelated(oElement)) {
						// NOTES:
						// Changing column list item or other column based properties via VisualEditor might NOT work as expected, depending on how the changes are created!
						// The issue is similar to when a property is being bound --> the value depends on order of setProperty for binding/flex, whichever is called last wins.
						// We now try to disable some elements completely from being adapted, while others are kept just in case they could be adapted.
						// Also ColumnListItem is enabled for addXML (above), but is also mentioned here as it should itself not be adaptable as such, the above one wins for now.
						if (oElement.isA(["sap.m.Title", "sap.m.ColumnListItem", "sap.ui.table.Row"]) || isParentRowInstance(oElement)) {
							// Most of the column/cell relevant content should never be adapted anywhere.
							return {
								actions: "not-adaptable" // This is now the proper way to disable adaptation completely
							};
						} else if (oElement.isA(["sap.m.Column", "sap.ui.table.Column", "sap.ui.table.AnalyticalColumn"])) {
							return {
								properties: getPropertyConfigFor(oElement),
								actions: null
							};
						} else if (oElement.getParent() && isToolbar(oElement.getParent())) {
							// Element with the toolbar - disable adaptation for SmartTable created elements
							if (oElement.hasStyleClass("sapUiCompSmartTableToolbarContent")
								&& !oElement.hasStyleClass("sapUiCompSmartTableToolbarContentAllowAdaption")) {
								// allow SmartVariantManagement control actions for adaptation
								return {
									actions: "not-adaptable"
								};
							}
						} else if (checkTableTypesMatch(oElement)) {
							// Some actions that "might" work or were supported before are kept for DTA, but see note above as these too "might" not really work!
							return {
								actions: null // This only disables RTA, but DTA (Visual Editor) changes are still possible.
							};
						}
					}
				}
			}
		},



		annotations: {
			/**
			 * Defines whether a column can be sorted.
			 * Columns are sortable by default. If sorting on columns has to be restricted,
			 * then such columns must be listed under <code>NonSortableProperties</code> (exclude from sorting).
			 *
			 * The annotation is calculated from the currently bound <code>EntitySet</code> and contains a <code>Property</code> collection of the
			 * corresponding <code>EntityType</code> definition. Only <code>PropertyPath</code> for columns to be excluded from sorting can be applied.
			 *
			 * For columns added to the content of the SmartTable control, the annotation is not used, and the hosting component needs to take care
			 * of correct settings.
			 *
			 * <i>XML Example of OData V4 with Customer and CompanyCode Properties Excluded from Sorting</i>
			 * <pre>
			 *    &lt;Annotation Term="Org.OData.Capabilities.V1.SortRestrictions"&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property="NonSortableProperties"&gt;
			 *          &lt;Collection&gt;
			 *            &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:sortable</code> annotation on the <code>Property</code> can be used to exclude from sorting.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:sortable="false"/&gt;
			 *    &lt;Property Name="CompanyCode" ... sap:sortable="false"/&gt;
			 * </pre>
			 */
			sortable: {
				namespace: "Org.OData.Capabilities.V1",
				annotation: "SortRestrictions",
				target: ["EntitySet"],
				allowList: {
					properties: ["NonSortableProperties"]
				},
				defaultValue: true,
				interpretation: "exclude",
				appliesTo: ["columns/#"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether a column can be filtered.
			 * Columns are filterable by default and need to be excluded.
			 *
			 * The annotation is calculated from the currently bound <code>EntitySet</code> and contains a <code>PropertyPath</code> collection of the
			 * corresponding <code>EntityType</code> definition. Only PropertyPaths for columns to be excluded from filtering can be applied.
			 *
			 * For columns added to the content's table of the SmartTable, the annotation is not used and the hosting component needs to take care
			 * of correct settings.
			 *
			 * <i>XML Example of OData V4 with Excluded Customer and CompanyCode Properties from Filtering</i>
			 * <pre>
			 *    &lt;Annotation Term="Org.OData.Capabilities.V1.FilterRestrictions"&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property="NonFilterableProperties"&gt;
			 *          &lt;Collection&gt;
			 *            &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *      &lt;/Record&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:filterable</code> annotation on the <code>Property</code> can be used to exclude from filtering.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:filterable="false"/&gt;
			 *    &lt;Property Name="CompanyCode" ... sap:filterable="false"/&gt;
			 * </pre>
			 */
			filterable: {
				namespace: "Org.OData.Capabilities.V1",
				annotation: "FilterRestrictions",
				target: ["EntitySet"],
				allowList: {
					properties: ["NonFilterableProperties"]
				},
				defaultValue: true,
				interpretation: "exclude",
				appliesTo: ["columns/#"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * A short, human-readable text suitable for the column header's text.
			 *
			 * Either <code>com.sap.vocabularies.Common.v1.Label</code> annotation on the <code>Property</code> or <code>Label</code> annotation of
			 * <code>com.sap.vocabularies.UI.v1.DataFieldAbstract</code> within <code>com.sap.vocabularies.UI.v1.LineItem</code> annotation can be used.
			 * If <code>com.sap.vocabularies.Common.v1.Label</code> annotation is given, it has precedence.
			 * If none of the annotations is given the label will be the Property name of the column.
			 *
			 * For columns added to the content's table of the SmartTable, the annotation is not used and the hosting component needs to take care
			 * of correct settings and translation.
			 *
			 * <i>XML Example of OData V4 with CustomerName as Label for Customer Property</i>
			 * <pre>
			 *    &lt;Property Name="Customer"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.Label" String="My Customer" /&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:label</code> annotation on the <code>Property</code> can be used to define the label of the column.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:label="My Customer"/&gt;
			 * </pre>
			 *
			 */
			columnLabelOnProperty: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Label",
				target: ["Property", "PropertyPath"],
				defaultValue: null,
				appliesTo: ["columns/#/label"],
				group: ["Appearance", "Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether the column is visible.
			 * The SmartTable control interprets the <code>EnumMember</code> <code>FieldControlType/Hidden</code> of the <code>FieldControl</code> annotation for setting the visibility.
			 * If a <code>Property</code> is set to hidden in OData annotation, then the SmartTable control ignores processing this <code>Property</code>.
			 *
			 * <b>Note:</b> Currently only <code>FieldControlType/Hidden</code> is supported for statically hiding the columns.
			 * <b>Note:</b> The static <code>FieldControlType/Hidden</code> is replaced by <code>UI.Hidden</code>.
			 *
			 * <i>XML Example of OData V4 with Hidden Customer and CompanyCode Properties</i>
			 * <pre>
			 *    &lt;Property Name="Customer"&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CompanyCode"&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:visible</code> annotation on the <code>Property</code> can be used to assign visibility.
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:visible=&quot;false&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:visible=&quot;false&quot;/&gt;
			 * </pre>
			 */
			columnVisible: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FieldControlType",
				target: ["Property"],
				allowList: {
					values: ["Hidden"]
				},
				defaultValue: false,
				appliesTo: ["columns/#/visible"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines a currency code for an amount according to the ISO 4217 standard.
			 * <code>ISOCurrency</code> annotation can point to a <code>Property</code>, which can also be <code>null</code>.
			 *
			 * <i>XML Example of OData V4 with CurrencyCode Associated to Price Property</i>
			 * <pre>
			 *    &lt;Property Name="Price"&gt;
			 *       &lt;Annotation Term="Org.OData.Measures.V1.ISOCurrency" Path="CurrencyCode" /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CurrencyCode" type="Edm.String" /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:semantics="currency-code"</code> along with <code>sap:unit</code> annotations on the <code>Property</code> can be used to assign a currency code to the field.
			 * <pre>
			 *    &lt;Property Name="Price" ... sap:unit="CurrencyCode"/&gt;
			 *    &lt;Property Name="CurrencyCode" ... sap:semantics="currency-code"/&gt;
			 * </pre>
			 */
			columnCurrencyCode: {
				namespace: "Org.OData.Measures.V1",
				annotation: "ISOCurrency",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["columns/#/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * The unit of measure for a measured quantity, for example, cm for centimeters.
			 * Renders the value associated with the unit annotation of a <code>Property</code>, which can be <code>null</code>.
			 *
			 * <i>XML Example of OData V4 with OrderedUnit Associated to OrderedQuantity Property</i>
			 * <pre>
			 *   &lt;Property Name="OrderedQuantity"&gt;
			 *     &lt;Annotation Term="Org.OData.Measures.V1.Unit" Path="OrderedUnit" /&gt;
			 *   &lt;/Property&gt;
			 *   &lt;Property Name="OrderedUnit" type="Edm.String" /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:semantics="unit-of-measure"</code> along with <code>sap:unit</code> annotations on the <code>Property</code> can be used to assign unit of measure to the field.
			 * <pre>
			 *    &lt;Property Name="OrderedQuantity" ... sap:unit="OrderedUnit"/&gt;
			 *    &lt;Property Name="OrderedUnit" ... sap:semantics="unit-of-measure"/&gt;
			 * </pre>
			 */
			columnUnitOfMeasure: {
				namespace: "Org.OData.Measures.V1",
				annotation: "Unit",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["columns/#/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether a string is capitalized.
			 *
			 * <i>XML Example of OData V4 with Capitalized Customer and CompanyCode Properties</i>
			 * <pre>
			 *    &lt;Annotation Term="com.sap.vocabularies.Common.v1.IsUpperCase"&gt;
			 *        &lt;Collection&gt;
			 *           &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *           &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:display-format="UpperCase"</code> annotation on the <code>Property</code> can be used to render the text in upper case format.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:display-format="UpperCase"/&gt;
			 *    &lt;Property Name="CompanyCode" ... sap:display-format="UpperCase"/&gt;
			 * </pre>
			 */
			columnUpperCase: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsUpperCase",
				target: ["Property", "Parameter"],
				defaultValue: true,
				appliesTo: ["columns/#", "columns/#/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
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
			 * For OData V2 the <code>sap:semantics="yearmonthday"</code> annotation of the <code>Property</code> can be used to render a string as date.
			 * <pre>
			 *    &lt;Property Name="CreationDate" Type="Edm.String" ... sap:semantics="yearmonthday"/&gt;
			 *    &lt;Property Name="ChangeDate" Type="Edm.String" ... sap:semantics="yearmonthday"/&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarDate: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarDate",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.54"
			},


			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'y' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'y' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYear</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Q' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Q' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarQuarter</code> annotation is currently experimental and might be renamed or redefined.<br>
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
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'yQ' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'yQ' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYearQuarter</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarYearQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'w' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'w' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarWeek</code> annotation is currently experimental and might be renamed or redefined.<br>
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
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Yw' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Yw' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYearWeek</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarYearWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'm' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'm' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarMonth</code> annotation is currently experimental and might be renamed or redefined.<br>
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
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarMonth",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a calendar date following the 'Ym' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'Ym' pattern.
			 *
			 * <b>Note:</b> The <code>IsCalendarYearMonth</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsCalendarYearMonth&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with calendar annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnCalendarYearMonth: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsCalendarYearMonth",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.117"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'y' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'y' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalYear</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that is based on a fiscal date following the 'M' pattern.
			 *
			 * Intended for <code>Edm.String</code> properties that are stored as ABAP and follow the 'M' pattern.
			 *
			 * <b>Note:</b> The <code>IsFiscalPeriod</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalPeriod&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalPeriod: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalPeriod",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
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
			 * <b>Note:</b> The <code>IsFiscalYearPeriod</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearPeriod&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalYearPeriod: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearPeriod",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
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
			 * <b>Note:</b> The <code>IsFiscalQuarter</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
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
			 * <b>Note:</b> The <code>IsFiscalYearQuarter</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearQuarter&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalYearQuarter: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearQuarter",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
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
			 * <b>Note:</b> The <code>IsFiscalWeek</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
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
			 * <b>Note:</b> The <code>IsFiscalYearWeek</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsFiscalYearWeek&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnFiscalYearWeek: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsFiscalYearWeek",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
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
			 * <b>Note:</b> The <code>IsDayOfFiscalYear</code> annotation is currently experimental and might be renamed or redefined.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Price&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Price&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsDayOfFiscalYear&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <b>Note:</b> Columns that are related to properties with fiscal annotations of the <code>com.sap.vocabularies.Common.v1</code> vocabulary are right-aligned (in LTR languages; in RTL languages left-aligned).
			 */
			columnDayOfFiscalYear: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsDayOfFiscalYear",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/#/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.74"
			},

			/**
			 * Defines whether the column is visible. If a <code>Property</code> is set to hidden in the OData annotation,
			 * then the <code>SmartTable</code> control ignores processing this <code>Property</code>. The annotation is supported
			 * with the <code>Bool</code> attribute and also works without adding any attribute. The <code>Path</code> attribute
			 * is not supported.
			 *
			 * <b>Note:</b> UI.Hidden replaces the static FieldControlType/Hidden.
			 *
			 * <i>Example in OData V4 Notation with hidden CustomerID</i>
			 *
			 * <pre>
			 *     &lt;Annotations Target=&quot;CustomerID&quot; &gt;
			 *         &lt;Annotation Term=&quot;UI.Hidden&quot; Bool=&quot;true&quot;/&gt;
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
					"columns/#/visible"
				],
				group: [
					"Behavior"
				],
				since: "1.29"
			},

			/**
			 * Indicates whether the annotated <code>Property</code> is a string that represents an IANA time zone key.
			 *
			 * <b>Note:</b> The <code>IsTimezone</code> annotation can only be used with properties of type <code>Edm.String</code>.<br>
			 *
			 * <i>XML Example of the OData V4 Annotation</i>
			 * <pre>
			 *    &lt;Annotations Target=&quot;Namespace.EntityType/PropertyName&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.IsTimezone&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			isTimezone: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsTimezone",
				target: [
					"Property"
				],
				defaultValue: true,
				appliesTo: [
					"columns/cellContent"
				],
				group: [
					"Appearance", "Behavior"
				],
				since: "1.118"
			},

			/**
			 * Renders the initial columns for the SmartTable control.
			 *
			 * <i>XML Example of OData V4 Customer and CompanyCode Properties as LineItem</i>
			 * <pre>
			 *    &lt;Annotation Term="com.sap.vocabularies.UI.v1.LineItem"&gt;
			 *        &lt;Collection&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="Value" Path="Customer" /&gt;
			 *             &lt;PropertyValue Property="Value" Path="CompanyCode" /&gt;
			 *           &lt;/Record&gt;
			 *        &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * The following record types are supported: <code>DataFieldWithUrl</code> and <code>DataField</code>.
			 */
			lineItem: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "LineItem",
				target: ["EntityType"],
				allowList: {
					types: ["DataFieldWithUrl", "DataField"]
				},
				defaultValue: null,
				appliesTo: ["columns"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Configures the rendering of additional columns (the ones not added using the <code>LineItem</code> annotation) for the <code>SmartTable</code> control.
			 *
			 * <i>XML Example of OData V4 Customer Property with DataFieldDefault</i>
			 * <pre>
			 * &lt;Annotations Target="Namespace.EntityType/Customer"&gt;
			 * 	&lt;Annotation Term="UI.DataFieldDefault"&gt;
			 * 		&lt;Record Type="UI.DataField"&gt;
			 * 			&lt;PropertyValue Property="Label" String="Label via DataFieldDefault"/&gt;
			 * 			&lt;PropertyValue Property="Criticality" Path="to_Criticality/Criticality"/&gt;
			 * 			&lt;PropertyValue Property="CriticalityRepresentation" EnumMember="UI.CriticalityRepresentationType/WithoutIcon"/&gt;
			 * 			&lt;PropertyValue Property="Value" Path="Customer"/&gt;
			 * 		&lt;/Record&gt;
			 * 	&lt;/Annotation&gt;
			 * &lt;/Annotations&gt;
			 * </pre>
			 *
			 * The following record types are supported: <code>DataFieldWithUrl</code> and <code>DataField</code>.
			 */
			dataFieldDefault: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataFieldDefault",
				target: ["Property"],
				allowList: {
					types: ["DataFieldWithUrl", "DataField"]
				},
				defaultValue: null,
				appliesTo: ["columns"],
				group: ["Behavior"],
				since: "1.65"
			},

			/**
			 * Defines the presentation behaviour of the SmartTable control.
			 * A <code>PropertyPath</code> and an <code>AnnotationPath</code> can be used for constructing PresentationVariant annotation.
			 *
			 * <b>Note:</b><br>
			 * The following restrictions currently apply:
			 * <ul>
			 * <li><code>SortOrder</code> is not evaluated for the <code>ResponsiveTable</code> control.</li>
			 * <li><code>SortOrder</code> is ordered by the fields in the <code>LineItem</code> annotation.</li>
			 * <li><code>GroupBy</code> is only evaluated for the <code>AnalyticalTable</code> control.</li>
			 * <li>Other properties, such as <code>MaxItems</code>, <code>Total</code>, etc. are not supported by the <code>SmartTable</code> control.</li>
			 * </ul>
			 *
			 * <i>XML Example of OData V4 with Customer and CompanyCode Properties as PresentationVariant</i>
			 * <pre>
			 *    &lt;Annotation Term="com.sap.vocabularies.UI.v1.PresentationVariant"&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property="Visualizations"&gt;
			 *          &lt;Collection&gt;
			 *            &lt;AnnotationPath&gt;@UI.LineItem&lt;/AnnotationPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *        &lt;PropertyValue Property="RequestAtLeast"&gt;
			 *          &lt;Collection&gt;
			 *            &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property="SortOrder"&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property="Property" PropertyPath="CompanyCode"/&gt;
			 *                &lt;PropertyValue Property="Descending" Bool="true"/&gt;
			 *              &lt;/Record&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property="Property" PropertyPath="Customer"/&gt;
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
				target: ["EntitySet", "EntityType"],
				defaultValue: null,
				appliesTo: ["columns"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Shows columns with priority high on phones, with priority medium or high on tablets, and with all priorities on the desktop.
			 *
			 * <b>Note:</b> Currently the <code>Importance</code> annotation is only evaluated in the <code>LineItem DataField</code> annotation.
			 *
			 * <i>XML Example of OData V4 with the Importance Annotation</i>
			 * <pre>
			 *    &lt;Property Name="Customer"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.UI.v1.Importance" EnumMember="com.sap.vocabularies.UI.v1.ImportanceType/High" /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CompanyCode"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.UI.v1.Importance" EnumMember="com.sap.vocabularies.UI.v1.ImportanceType/Medium" /&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			columnImportance: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "Importance",
				target: ["Record", "Annotation"],
				defaultValue: null,
				appliesTo: ["columns/#/visible"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * This annotation can be specified along with the <code>LineItem</code> annotation in order to specify that a property
			 * is rendered as a regular data field.
			 *
			 * <i>XML Example for OData V4 with DataField Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;Annotation Term="UI.Importance" EnumMember="UI.ImportanceType/High"/&gt;
			 *      &lt;PropertyValue Property="Label" String="Language"/&gt;
			 *      &lt;PropertyValue Property="Value" Path="Language"/&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 *
			 *  Supported properties are: <code>Criticality, CriticalityRepresentation, Label</code> and <code>Value</code>.
			 */
			columnDataField: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataField",
				target: ["LineItem/Record"],
				allowList: {
					properties: [
						"Criticality",
						"CriticalityRepresentation",
						"Label",
						"Value"
					]
				},
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders the value as a URL, if a URL parameter path is present.
			 * This annotation must be specified along with the <code>LineItem</code> annotation.
			 *
			 * <b>Note:</b><br>
			 * Currently only <code>odata.fillUriTemplate</code> with LabeledElement for filling the URL parameter is supported in the <code>Apply Function</code>.
			 * For <code>AnalyticalTable</code> (supported since 1.54), the following restrictions apply:
			 * <ul>
			 * <li>Any property represented by the <code>LabeledElement</code> or <code>Url</code> annotation must not be a different dimension or a measure.</li>
			 * <li>Any property represented by the <code>LabeledElement</code> or <code>Url</code> annotation must not be a navigationProperty/association path, as this is not supported by analytical services.</li>
			 * </ul>
			 *
			 * <i>XML Example for OData V4 with DataFieldWithUrl Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataFieldWithUrl"&gt;
			 *      &lt;PropertyValue Property="Label" String="Link to"/&gt;
			 *      &lt;PropertyValue Property="Value" String="Google Maps"/&gt;
			 *      &lt;PropertyValue Property="Url"&gt;
			 *        &lt;Apply Function="odata.fillUriTemplate"&gt;
			 *          &lt;String&gt;https://www.google.de/maps/{city1}/{street},{city2}&lt;/String&gt;
			 *            &lt;LabeledElement Name="street"&gt;
			 *              &lt;Path&gt;Address/Street&lt;/Path&gt;
			 *            &lt;/LabeledElement&gt;
			 *            &lt;LabeledElement Name="city1"&gt;
			 *              &lt;Path&gt;Address/City&lt;/Path&gt;
			 *            &lt;/LabeledElement&gt;
			 *            &lt;LabeledElement Name="city2"&gt;
			 *              &lt;Path&gt;Address/City&lt;/Path&gt;
			 *            &lt;/LabeledElement&gt;
			 *        &lt;/Apply&gt;
			 *      &lt;/PropertyValue&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 *
			 * Supported properties are: <code>Url, Label</code> and <code>Value</code>.
			 */
			columnDataFieldWithUrl: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataFieldWithUrl",
				target: ["LineItem/Record"],
				allowList: {
					properties: [
						"Label",
						"Url",
						"Value"
					]
				},
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Represents the criticality state of the data that is present inside the column.
			 * This annotation must be specified along with the <code>LineItem</code> annotation.
			 * Color coding is also applied to the criticality state based on the provided <code>EnumMember</code>.
			 *
			 * <b>Note:</b><br>
			 * <code>TextArrangement</code> annotation is also considered to format the field (if a Text annotation is present) since 1.54.
			 * For <code>AnalyticalTable</code> (supported since 1.54), the following restrictions apply:
			 * <ul>
			 * <li>The property represented by the <code>Criticality</code> or <code>CriticalityRepresentation</code> annotation must not be a different dimension or a measure.</li>
			 * <li>The property represented by the <code>Criticality</code> or <code>CriticalityRepresentation</code> annotation must not be a navigationProperty/association path, as this is not supported by analytical services.</li>
			 * </ul>
			 *
			 * <i>XML Example for OData V4 with CriticalityType Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;PropertyValue Property="Criticality"
			 *        Path="to_StockAvailability/StockAvailability" /&gt;
			 *      &lt;PropertyValue Property="CriticalityRepresentation"
			 *        EnumMember="com.sap.vocabularies.UI.v1.CriticalityRepresentationType/WithoutIcon" /&gt;
			 *      &lt;PropertyValue Property="Value" Path="to_StockAvailability/StockAvailability" /&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 */
			columnCriticality: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "CriticalityType",
				target: ["PropertyPath"],
				defaultValue: null,
				appliesTo: ["columns/criticality"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Determines if criticality is visualized by means of an icon.
			 * The <code>CriticalityRepresentation</code> contains <code>EnumMember</code> that can be used to control the visibility of the icon.
			 * An icon is added along with the criticality state by default.
			 * If <code>PropertyPath</code> is to be excluded from having an icon,
			 * then <code>PropertyPath</code> must be annotated with the <code>CriticalityRepresentationType/WithoutIcon</code> annotation.
			 *
			 * <b>Note:</b> For <code>AnalyticalTable</code> (supported since 1.54), the following restrictions apply:
			 * <ul>
			 * <li>The property represented by the <code>Criticality</code> or <code>CriticalityRepresentation</code> annotation must not be a different dimension or a measure.</li>
			 * <li>The property represented by the <code>Criticality</code> or <code>CriticalityRepresentation</code> annotation must not be a navigationProperty/association path, as this is not supported by analytical services.</li>
			 * </ul>
			 *
			 * <i>XML Example for OData V4 with CriticalityRepresentationType/WithoutIcon Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;PropertyValue Property="Criticality"
			 *        Path="to_StockAvailability/StockAvailability" /&gt;
			 *      &lt;PropertyValue Property="CriticalityRepresentation"
			 *        EnumMember="com.sap.vocabularies.UI.v1.CriticalityRepresentationType/WithoutIcon" /&gt;
			 *      &lt;PropertyValue Property="Value" Path="to_StockAvailability/StockAvailability" /&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 */
			columnCriticalityRepresentationType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "CriticalityRepresentationType",
				target: ["Property"],
				allowList: {
					values: ["WithoutIcon"]
				},
				interpretation: "excludeIcon",
				defaultValue: null,
				appliesTo: ["columns/criticalityIcon"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Defines the default CSS width applied to the column.
			 * A <code>width</code> value with a <code>px, em</code> or <code>rem</code> unit is supported.
			 *
			 * <b>Note:</b> The <code>width</code> value must be specified as a constant <code>String</code> and must not contain a property path for the value.
			 *
			 * <i>XML Example for OData V4 with Width as CssDefaults Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;PropertyValue Property="Value" Path="CompanyCode" /&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.HTML5.v1.CssDefaults"&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property="width" String="8rem" /&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 */
			columnWidth: {
				namespace: "com.sap.vocabularies.HTML5.v1",
				annotation: "CssDefaults",
				target: ["DataFieldAbstract"],
				allowList: {
					values: ["width"]
				},
				defaultValue: null,
				appliesTo: ["columns/width"],
				group: ["Appearance"],
				since: "1.79"
			},

			/**
			 * Defines whether a property is a semantic key which is used for key columns (rendering <code>sap.m.ObjectIdentifier</code>).<br>
			 * In addition, the <code>Common.EditableFieldFor</code> annotation, which points to a semantic key, can be used for editable properties
			 * to achieve the same rendering in display scenarios.<br>
			 * <br>
			 * <b>Note:</b> The rendering with the <code>ObjectIdentifier</code> control is only valid for <code>ResponsiveTable</code> scenarios.
			 *
			 * <i>XML Example of OData V4 with SemanticKey Annotation</i>
			 * <pre>
			 *    &lt;Annotations Target="SalesOrderType" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.Common.v1.SemanticKey"&gt;
			 *        &lt;Collection&gt;
			 *          &lt;PropertyPath&gt;SalesOrderID&lt;/PropertyPath&gt;
			 *          &lt;PropertyPath&gt;SalesOrderItemID&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <i>XML Example of OData V4 with EditableFieldFor Annotation</i>
			 * <pre>
			 *    &lt;Annotations Target="NameSpace.SalesOrderType/SalesOrderEditable" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.Common.v1.EditableFieldFor" PropertyPath="SalesOrderID"/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			semanticKey: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticKey",
				target: ["EntityType"],
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Defines a name of the <code>SemanticObject</code> that can be represented with a <code>Property</code> that is defined within an
			 * <code>EntityType</code>. The <code>SmartTable</code> control creates a <code>SmartLink</code> control by providing relevant information
			 * to the <code>SmartLink</code> control.
			 *
			 * <br>
			 * <b>Note:</b>
			 * <ul>
			 * <li>Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.</li>
			 * <li>For an analytical service, the <code>SemanticObject</code> that is represented by a <code>Property</code> containing a <code>Path</code> (supported as of version 1.109) must not be a dimension or a measure.</li>
			 * </ul>
			 *
			 * <i>XML Example of OData V4 with SemanticObject Annotation with String Pointing to Property</i>
			 * <pre>
			 *   &lt;Annotations Target=&quot;ProductCollection.Product/Name&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;SemanticObjectName&quot; /&gt;
			 *   &lt;/Annotations&gt;
			 * </pre>
			 *
			 * <i>XML Example of OData V4 with SemanticObject Annotation with Path Pointing to Property</i>
			 * <pre>
			 *   &lt;Annotations Target=&quot;ProductCollection.Product/Name&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; Path=&quot;SemanticObjectName&quot; /&gt;
			 *   &lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObject: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObject",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders an image in the cell if the annotation is present.
			 *
			 * <i>XML Example of OData V4 with the IsImageURL Annotation</i>
			 * <pre>
			 *    &lt;Property Name="Product"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.Common.v1.IsImageURL" Bool="true" /&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			columnIsImageURL: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "IsImageURL",
				target: ["Property"],
				defaultValue: true,
				appliesTo: ["columns/image"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * A descriptive text for values of the annotated property.
			 *
			 * <b>Note:</b><br>
			 * The value must be a dynamic expression (property) when used as metadata annotation.<br>
			 * For <code>AnalyticalTable</code> (supported since 1.54), the following restrictions apply:
			 * <ul>
			 * <li>The property represented by the <code>Text</code> annotation must not be a dimension or a measure.</li>
			 * <li>The property represented by the <code>Text</code> annotation must not be a navigationProperty/association path, as this is not supported by analytical services.</li>
			 * </ul>
			 *
			 *
			 * <i>XML Example of OData V4 Text on Customer Property</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Text&quot; Path=&quot;CustomerName&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;CustomerName&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:text</code> annotation on the <code>Property</code> can be used to assign text.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:text=&quot;CustomerName&quot;/&gt;
			 *    &lt;Property Name=&quot;CustomerName&quot; type=&quot;Edm.String&quot;/&gt;
			 * </pre>
			 */
			columnText: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Text",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["column/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Describes the arrangement of a code value and its text. The <code>TextArrangement</code> annotation requires the
			 * <code>com.sap.vocabularies.Common.v1.Text</code> annotation to be defined.
			 * The enumeration members can have the following values:
			 * <ul>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst</code><br>
			 * The underlying control is represented with the specified description followed by its ID. This is the default, if no annotation is specified.</li>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly</code><br>
			 * The underlying control is represented with the specified description only. </li>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextLast</code><br>
			 * The underlying control is represented with the specified ID followed by its description. </li>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate</code><br>
			 * The underlying control is represented with the specified ID only. </li>
			 * </ul>
			 *
			 * <i>XML Example of OData V4 with EntityType ProductType</i>
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
				appliesTo: ["column/cellContent"],
				group: ["Appearance", "Behavior"],
				since: "1.38"
			},

			/**
			 * Indicates whether a <code>Property</code> contains an e-mail address.
			 *
			 * <i>XML Example of the OData V4 E-mail Address Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Email&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Email&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Communication.v1.IsEmailAddress&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			emailAddress: {
				namespace: "com.sap.vocabularies.Communication.v1",
				annotation: "IsEmailAddress",
				target: ["Property"],
				defaultValue: true,
				appliesTo: ["column/cellContent"],
				group: ["Behavior"],
				since: "1.60"
			},

			/**
			 * Indicates whether a <code>Property</code> contains a phone number.
			 *
			 * <i>XML Example of the OData V4 Phone Number Annotation</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Phone&quot; Type=&quot;Edm.String&quot;/&gt;
			 *    &lt;Annotations Target=&quot;Phone&quot;&gt;
			 *        &lt;Annotation Term=&quot;com.sap.vocabularies.Communication.v1.IsPhoneNumber&quot; Bool=&quot;true&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			phoneNumber: {
				namespace: "com.sap.vocabularies.Communication.v1",
				annotation: "IsPhoneNumber",
				target: ["Property"],
				defaultValue: true,
				appliesTo: ["fieldItem/#/value"],
				group: ["Behavior"],
				since: "1.60"
			},

			/**
			 * Indicates whether sorting and filtering amounts with multiple currencies has to be taken into consideration.
			 *
			 * <b>Note:</b>
			 * <ul>
			 * <li>During sorting, the currency fields are sorted first by unit and then by value, if the unit has not already been sorted.</li>
			 * <li>Filtering is not yet supported.</li>
			 * </ul>
			 *
			 * <i>XML Example of the OData V4 multi-unit behavior for sorting and filtering Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;
			 *        Target=&quot;Namespace.ProductEntities&quot;&gt;
			 *        &lt;Annotaion Term=&quot;com.sap.vocabularies.Common.v1.ApplyMultiUnitBehaviorForSortingAndFiltering&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			multiUnitBehaviorForSortingAndFiltering: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "ApplyMultiUnitBehaviorForSortingAndFiltering",
				target: ["EntityContainer"],
				defaultValue: true,
				appliesTo: ["column/cellContent"],
				group: ["Behavior"],
				since: "1.69"
			},

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
				appliesTo: ["column/cellContent"],
				group: ["Behavior"],
				since: "1.99"
			}
		},

		customData: {
			/**
			 * Defines whether SmartField controls can be used in the SmartTable control. For editable tables, this property must be set to <code>true</code>.
			 */
			useSmartField: {
				type: "boolean",
				defaultValue: false,
				group: ["Appearance", "Behavior"],
				since: "1.28.1"
			},

			/**
			 * Provides an option to dynamically switch between display/edit mode. The SmartTable internally creates the SmartToggle control if this is set to true.
			 */
			 useSmartToggle: {
				type: "boolean",
				defaultValue: false,
				group: ["Appearance", "Behavior"],
				since: "1.31.0"
			},

			/**
			 * Overrides the default settings for formatting dates in all columns of the SmartTable control. The format settings can be provided as a JSON object or a JSON string.
			 *
			 * @see sap.ui.model.type.Date
			 */
			dateFormatSettings: {
				type: "string",
				defaultValue: "{ UTC : true }",
				group: ["Appearance"],
				since: "1.28.1"
			},

			/**
			 * Defines whether the DateTime format should be UTC or not. By default UTC is true.
			 */
			 useUTCDateTime: {
				type: "boolean",
				defaultValue: true,
				group: ["Behavior"],
				appliesTo: ["cellContent"],
				since: "1.72.0"
			},

			/**
			 * Defines whether currency symbols are to be applied to currency fields.
			 */
			currencyFormatSettings: {
				type: "string",
				defaultValue: null,
				appliesTo: ["cellContent"],
				since: "1.28.1"
			},

			/**
			 * Overrides the default displayBehavior in all columns. The default value is "descriptionAndId". The TextArrangment annotation should be used instead.
			 * Possible values are: "idAndDescription", "descriptionAndId", "idOnly" and "descriptionOnly".
			 */
			 defaultDropDownDisplayBehaviour: {
				type: "string",
				displayValue: "idAndDescription",
				appliesTo: ["cellContent"],
				group: ["Behavior"],
				since: "1.28.0"
			},

			/**
			 * If set to <code>true</code>, then the FilterBars of the ValueHelp dialogs in the Filter Panel will be initially expanded
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
			 * If set to <code>true</code>, then the FilterBars of the ValueHelp dialogs in the Filter Panel will show all filters initially and not only the first 7
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
			 * If set to "true", then the SmartTable control will not take the UI.PresentationVariant & UI.LineItem annotations into account while initializing and creating the control.
			 */
			skipAnnotationParse: {
				type: "boolean",
				displayValue: false,
				group: ["Behavior"],
				since: "1.38.10"
			},

			/**
			 * Define the LineItem qualifier that must be used by the SmartTable control.
			 */
			lineItemQualifier: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.31.0"
			},

			/**
			 * Defines the PresentationVariant qualifier that must be used by the SmartTable control.
			 */
			presentationVariantQualifier: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.31.0"
			},

			/**
			 * Sets inResult=true for feids defined in the LineItem annotation. This is only relevant for the AnalyticalTable
			 */
			enableInResultForLineItem: {
				type: "boolean",
				defaultValue: false,
				group: ["Behavior"],
				since: "1.30.0"
			},

			/**
			 * Defines the visibility of the panels in table personalization dialog.
			 */
			p13nDialogSettings: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.26.0"
			},

			/**
			 * The OData types, such as sap.ui.model.odata.type.Decimal, sap.ui.model.odata.type.Currency, and sap.ui.model.odata.type.Unit, have the format option preserveDecimals=true by default, which preserves the decimals returned by the back end.
			 * This customdata can be used to override the default bahviour.
			 */
			preserveDecimals: {
				type: "boolean",
				defaultValue: true,
				group: ["Behavior"],
				appliesTo: ["cellContent"],
				since: "1.90.10"
			},

			/**
			 * A unique key used to save, retrieve, or apply custom personalization for a column.
			 */
			columnKey: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Sorts the table based on the column specified; ODataModel property name must be used.
			 */
			sortProperty: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Filters the table with the condition that is defined; ODataModel property name must be used.
			 */
			filterProperty: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines the column type. Value can be either date, numeric, or empty string; control will be switched accordingly in edit mode.
			 */
			type: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Numeric maximum length value for a column.
			 */
			maxLength: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.28.1"
			},

			/**
			 * Numeric maximum length value for a column
			 */
			precision: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.28.1"
			},

			/**
			 * Numeric scale value for a column.
			 */
			scale: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.28.1"
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
				ignore: false
			},
			initiallyVisibleFields: {
				ignore: false
			},
			requestAtLeastFields: {
				ignore: true
			},
			ignoreFromPersonalisation: {
				ignore: false
			},
			tableType: {
				ignore: true
			},
			useVariantManagement: {
				ignore: true
			},
			useColumnLabelsAsTooltips: {
				ignore: false
			},
			showVariantManagement: {
				ignore: false
			},
			useExportToExcel: {
				ignore: false
			},
			enableExport: {
				ignore: false
			},
			exportType: {
				ignore: false
			},
			enableCopy: {
				ignore: false
			},
			useTablePersonalisation: {
				ignore: true
			},
			showTablePersonalisation: {
				ignore: false
			},
			customizeConfig: {
				ignore: false
			},
			showRowCount: {
				ignore: false
			},
			header: {
				ignore: false
			},
			headerLevel: {
				ignore: false
			},
			headerStyle: {
				ignore: true
			},
			toolbarStyleClass: {
				ignore: true
			},
			enableCustomFilter: {
				ignore: true
			},
			persistencyKey: {
				ignore: true
			},
			useOnlyOneSolidToolbar: {
				ignore: true
			},
			placeToolbarInTable: {
				ignore: false
			},
			currentVariantId: {
				ignore: true
			},
			editable: {
				ignore: false
			},
			enableAutoBinding: {
				ignore: false
			},
			tableBindingPath: {
				ignore: false
			},
			editTogglable: {
				ignore: true
			},
			demandPopin: {
				ignore: false
			},
			showFullScreenButton: {
				ignore: true
			},
			initialNoDataText: {
				ignore: true
			},
			useInfoToolbar: {
				ignore: false
			},
			showDetailsButton: {
				ignore: false
			},
			detailsButtonSetting: {
				ignore: false
			},
			enableAutoColumnWidth: {
				ignore: false
			},
			showPasteButton: {
				ignore: false
			},
			enablePaste: {
				ignore: true
			},
			useDateRangeType: {
				ignore: true
			}
		}
	};
});
