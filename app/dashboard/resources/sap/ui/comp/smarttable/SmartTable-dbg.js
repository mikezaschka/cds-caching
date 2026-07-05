/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smarttable.SmartTable.
sap.ui.define([
	"sap/m/library",
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	"sap/ui/core/Messaging",
	"sap/ui/core/ShortcutHintsMixin",
	"sap/ui/core/format/ListFormat",
	"sap/ui/events/KeyCodes",
	"sap/ui/comp/util/DateTimeUtil",
	"sap/ui/comp/util/FilterUtil",
	"sap/m/Column",
	"sap/m/ColumnListItem",
	"sap/m/Label",
	"sap/m/MessageBox",
	"sap/m/Table",
	"sap/m/Text",
	"sap/m/Title",
	"sap/m/OverflowToolbar",
	"sap/m/OverflowToolbarLayoutData",
	"sap/m/ToolbarSpacer",
	"sap/m/OverflowToolbarButton",
	"sap/m/ToolbarSeparator",
	"sap/m/VBox",
	"sap/m/FlexItemData",
	"sap/ui/comp/library",
	"sap/ui/comp/providers/TableProvider",
	"sap/ui/comp/smartvariants/SmartVariantManagement",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/table/AnalyticalColumn",
	"sap/ui/table/AnalyticalTable",
	"sap/ui/table/Column",
	"sap/ui/table/Table",
	"sap/ui/table/TreeTable",
	"sap/ui/comp/personalization/Controller",
	"sap/ui/comp/personalization/Util",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/comp/util/FullScreenUtil",
	"sap/ui/comp/util/TableUtil",
	"sap/ui/comp/odata/ODataModelUtil",
	"sap/ui/comp/odata/ODataType",
	"sap/ui/comp/state/UIState",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/Device",
	"sap/base/Log",
	"sap/base/util/deepEqual",
	"sap/base/util/merge",
	"sap/m/ColumnHeaderPopover",
	"sap/m/ColumnPopoverActionItem",
	"sap/m/Menu",
	"sap/m/OverflowToolbarMenuButton",
	"sap/m/MenuItem",
	"sap/m/Button",
	"sap/m/Link",
	"sap/m/MessageStrip",
	"sap/ui/util/openWindow",
	"sap/ui/core/theming/Parameters",
	"sap/m/plugins/ColumnResizer",
	"sap/m/ColumnPopoverSelectListItem",
	"sap/m/table/Util",
	"sap/m/SegmentedButton",
	"sap/m/SegmentedButtonItem",
	"sap/m/table/columnmenu/Menu",
	"sap/m/table/columnmenu/QuickAction",
	"sap/m/table/columnmenu/QuickSort",
	"sap/m/table/columnmenu/QuickSortItem",
	"sap/m/table/columnmenu/QuickGroup",
	"sap/m/table/columnmenu/QuickGroupItem",
	"./flexibility/Utils",
	"sap/base/util/isEmptyObject",
	"sap/ui/performance/trace/FESRHelper",
	"sap/ui/base/DesignTime",
	"sap/m/plugins/CellSelector",
	"sap/m/plugins/CopyProvider",
	"sap/ui/core/date/UI5Date"
], function(MLibrary, Element, Library, coreLibrary, Messaging, ShortcutHintsMixin, ListFormat, KeyCodes, DateTimeUtil, FilterUtil, Column1, ColumnListItem, Label, MessageBox, ResponsiveTable, Text, Title, OverflowToolbar, OverflowToolbarLayoutData, ToolbarSpacer, OverflowToolbarButton, ToolbarSeparator, VBox, FlexItemData, library, TableProvider, SmartVariantManagement, Sorter, Filter, FilterOperator, JSONModel, AnalyticalColumn, AnalyticalTable, Column, Table, TreeTable, Controller, PersonalizationUtil, FormatUtil, FullScreenUtil, SmartTableUtil, ODataModelUtil, ODataType, UIState, PersonalizableInfo, NumberFormat, Device, Log, deepEqual, merge, ColumnHeaderPopover, ColumnPopoverActionItem, Menu, OverflowToolbarMenuButton, MenuItem, Button, Link, MessageStrip, openWindow, ThemeParameters, ColumnResizer, ColumnPopoverSelectListItem, TableUtil, SegmentedButton, SegmentedButtonItem, ColumnMenu, QuickAction, QuickSort, QuickSortItem, QuickGroup, QuickGroupItem, FlexUtils, isEmptyObject, FESRHelper, DesignTime, CellSelector, CopyProvider, UI5Date) {
	"use strict";

	// Shortcut for sap.m.ButtonType
	var ButtonType = MLibrary.ButtonType;

	// Shortcut for sap.m.MenuButtonMode
	var MenuButtonMode = MLibrary.MenuButtonMode;

	// shortcut for sap.m.ToolbarDesign
	var ToolbarDesign = MLibrary.ToolbarDesign;

	// shortcut for sap.m.ToolbarStyle
	var ToolbarStyle = MLibrary.ToolbarStyle;

	// shortcut for sap.ui.core.SortOrder
	var SortOrder = coreLibrary.SortOrder;

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	// shortcut for sap.ui.comp.smarttable.InfoToolbarBehavior
	var InfoToolbarBehavior = library.smarttable.InfoToolbarBehavior;

	const TableType = library.smarttable.TableType;

	/**
	 * Paste-related column information
	 *
	 * @typedef {object} sap.ui.comp.smarttable.ColumnInfoForPaste
	 *
	 * @property {string} columnId ID of the column
	 * @property {string} property Data property that is used when pasting data
	 * @property {boolean} ignore Defines whether the column is ignored during pasting
	 * @property {sap.ui.model.SimpleType} type The type instance that is used to parse the pasted value
	 * @property {function} [customParseFunction] Function that is used to parse the pasted value if no type instance is available (for example, for custom columns)
	 *
	 * @since 1.125
	 * @public
	 *
	 * Example <code>ColumnInfoForPaste</code>:
	 * @example
	 *   <pre>
	 *     var aColumnInfo = [
	 *       {
	 *         property: "name",
	 *         type: new sap.ui.model.odata.type.String()
	 *       },
	 *       {
	 *         property: "lastname",
	 *         type: new sap.ui.model.odata.type.String({maxLength: 30})
	 *       },
	 *       {
	 *         property: "age",
	 *         type: new sap.ui.model.odata.type.Byte()
	 *       },
	 *       {
	 *         property: "fullname",
	 *         customParseFunction: function(sCellData) { return ( doValidation(sCellData)) ...}
	 *       },
	 *       {
	 *         ignore: true
	 *       }
	 *     ];
	 *   </pre>
	 */

	/**
	 * Constructor for a new smarttable/SmartTable.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The <code>SmartTable</code> control creates a table based on OData metadata and the configuration specified. The entitySet attribute must be
	 *        specified to use the control. This attribute is used to fetch fields from OData metadata, from which columns will be generated; it can
	 *        also be used to fetch the actual table data.<br>
	 *        Based on the tableType property, this control will render a standard, analytical, tree, or responsive table.<br>
	 *
	 *        <b>Note:</b>
	 *        <ul>
	 *          <li>The <code>SmartTable</code> control supports the <code>Currency</code> and <code>Unit</code> customization referenced by the related <code>entitySet</code>. The requested code list is then used for formatting the <code>Currency</code> and <code>Unit</code> cell template. See {@link sap.ui.model.odata.v4.ODataMetaModel#requestCurrencyCodes} and {@link sap.ui.model.odata.v4.ODataMetaModel#requestUnitsOfMeasure} for more information.</li>
	 *          <li>The OData types, such as {@link sap.ui.model.odata.type.Decimal}, {@link sap.ui.model.odata.type.Currency}, and {@link sap.ui.model.odata.type.Unit}, have the format option <code>preserveDecimals=true</code> by default, which preserves the decimals returned by the back end.
	 *          The <code>SmartTable</code> control offers a global <code>customData</code> setting called <b><code>preserveDecimals</code></b> that can be used to configure the <code>preserveDecimals</code> format option. The default is <code>preserveDecimals=true</code> for the <code>customData</code>. This <code>customData</code> is then used for formatting the <code>Edm.Decimal</code> type as well as the <code>Currency</code> and <code>Unit</code> cell template. If the number of decimal digits is different from the values returned by the code list, then the decimal point alignment for the <code>Currency</code> and <code>Unit</code> values cannot be guaranteed.</li>
	 *          <li>Cell data of type <code>string</code> containing whitespace characters are replaced with unicode characters to visualize the whitespaces on the UI. This is enabled by default.</li>
	 *          <li>The <code>SmartTable</code> must not be cloned or used as a template. Doing this might cause issues with its behavior, personalization, or <code>VariantManagement</code>.</li>
	 *        </ul>
	 *
	 * @extends sap.m.VBox
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smarttable.SmartTable
	 * @see {@link topic:bed8274140d04fc0b9bcb2db42d8bac2 Smart Table}
	 */
	var SmartTable = VBox.extend("sap.ui.comp.smarttable.SmartTable", /** @lends sap.ui.comp.smarttable.SmartTable.prototype */ {
		metadata: {

			library: "sap.ui.comp",

			designtime: "sap/ui/comp/designtime/smarttable/SmartTable.designtime",

			properties: {

				/**
				 * The entity set name from which to fetch data and generate the columns. Note that this is not a dynamic UI5 property.
				 *
				 * <b>Note:</b> It is not allowed to have one of the following strings as field names for your OData entity:
				 * <ul>
				 *     <li><code>btnEditToggle</code></li>
				 *     <li><code>btnExcelExport</code></li>
				 *     <li><code>btnFullScreen</code></li>
				 *     <li><code>btnPersonalisation</code></li>
				 *     <li><code>header</code></li>
				 *     <li><code>infoToolbarText</code></li>
				 *     <li><code>persoController</code></li>
				 *     <li><code>toolbarSeperator</code></li>
				 *     <li><code>toolbarSpacer</code></li>
				 *     <li><code>ui5table</code></li>
				 *     <li><code>variant</code></li>
				 * </ul>
				 *
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.26.0
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * ID of the corresponding SmartFilter control; When specified, the SmartTable searches for the SmartFilter (also in the closest
				 * parent View) and attaches to the relevant events of the SmartFilter; to fetch data, show overlay etc.
				 *
				 * <b>Note:</b><br>
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.26.0
				 */
				smartFilterId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Comma-separated value of fields that must be ignored in the OData metadata by the <code>SmartTable</code> control.<br>
				 * The <code>SmartTable</code> control will not create built-in columns for the fields defined by this property
				 * and will not offer these fields in table personalization.
				 *
				 * <b>Note:</b><br>
				 * <ul>
				 * <li>Please ensure that you do not add spaces or special characters as no validation is done for this property.</li>
				 * <li>This is not a dynamic property and cannot be changed once the control has been initialized.</li>
				 * </ul>
				 *
				 * @since 1.26.0
				 */
				ignoredFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Comma-separated value of fields that must be shown initially in the SmartTable as visible columns and in the order specified.<br>
				 * This property is mainly meant to be used when no LineItem annotation exists.<br>
				 * If you have fields in the XMLView they are always shown first; then, the columns are added based on the LineItem annotation and
				 * finally based on this property.<br>
				 * <b>Note:</b><br>
				 * <ul>
				 * <li>If both this property and the LineItem annotation exist, the order of fields cannot be guaranteed to be as mentioned here.</li>
				 * <li>Please ensure that you do not add spaces or special characters as no validation is done for this property.</li>
				 * <li>This is not a dynamic property and cannot be changed once the control has been initialized.</li>
				 * </ul>
				 *
				 * @since 1.32.0
				 */
				initiallyVisibleFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Comma-separated value of fields that must be always requested from the backend<br>
				 * This property is mainly meant to be used when there is no PresentationVariant annotation.<br>
				 * If both this property and the PresentationVariant annotation exist, the select request sent to the backend would be a combination
				 * of both.<br>
				 * <b>Note:</b><br>
				 * For <code>AnalyticalTable</code> (supported since 1.54), the following restrictions apply:
				 * <ul>
				 * <li>The property name(s) must not point to a new dimension or a measure.</li>
				 * <li>The property name(s) must not point to a navigationProperty/association path, as this might not supported by analytical
				 * services.</li>
				 * </ul>
				 * Please ensure that you do not add spaces or special characters as no validation is done for this property.
				 *
				 * @since 1.32.0
				 */
				requestAtLeastFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Comma-separated value of fields that is not shown in the personalization dialog.<br>
				 * This property must only be used for use cases where a technical field/column is required to fetch some data from the backend but is hidden in the table personalization and on the UI.
				 *
				 * <b>Note:</b><br>
				 * <ul>
				 * <li>Please ensure that you do not add spaces or special characters as no validation is done for this property.</li>
				 * <li>Visible fields/columns cannot be included in this property as this is not supported by the <code>SmartTable</code> control.</li>
				 * <li>This is not a dynamic property and cannot be changed once the control has been initialized.</li>
				 * </ul>
				 *
				 * @since 1.32.0
				 */
				ignoreFromPersonalisation: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of table to be created in the SmartTable control.<br>
				 * <b>Note:</b><br>
				 * <ul>
				 * <li>If you add a table to the content of the SmartTable in the view, this property has no effect.</li>
				 * <li>This is not a dynamic property and cannot be changed once the control has been initialized.</li>
				 * </ul>
				 *
				 * @since 1.26.0
				 */
				tableType: {
					type: "sap.ui.comp.smarttable.TableType",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The useVariantManagement attribute can be set to true or false depending on whether you want to use variants. As a prerequisite you
				 * need to specify the persistencyKey property.
				 *
				 * @since 1.26.0
				 */
				useVariantManagement: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If no tooltips have been provided, neither by the <code>QuickInfo</code> annotation
				 * nor for custom columns directly via property, the column label will automatically be applied
				 * as a tooltip for the column.
				 *
				 * To enable this mechanism for custom columns, a <code>sap.m.Label</code> or <code>sap.m.Text</code>
				 * must be used as header label. Custom tooltips are not affected by this functionality when they are
				 * provided on the column header label for tables of type <code>ResponsiveTable</code> and on the column
				 * for other table types.
				 *
				 * <b>Note:</b><br>
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.114.0
				 */
				useColumnLabelsAsTooltips: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The showVariantManagement attribute can be set to true or false for controlling the visibility of VariantManagement button.
				 *
				 * @since 1.38.0
				 */
				showVariantManagement: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Can be set to true or false depending on whether you want to export data to a spreadsheet application, for example Microsoft Excel.<br>
				 * <b>Note:</b><br>
				 * If <code>exportType</code> is <code>sap.ui.comp.smarttable.ExportType.GW</code>, any $expand parameters are removed when
				 * sending the request to generate the spreadsheet.<br>
				 * As of UI5 version 1.56: If <code>exportType</code> is <code>sap.ui.comp.smarttable.ExportType.UI5Client</code> and
				 * <code>TreeTable</code> is used, the <code>worksheet.hierarchyLevel</code> property (see {@link sap.ui.export.Spreadsheet}) is
				 * filled from the binding, if the relevant information is available there for exporting hierarchical data in the spreadsheet.
				 * @deprecated As of version 1.100, replaced by <code>enableExport</code> property.
				 * @since 1.26.0
				 */
				useExportToExcel: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Enables the export of data from the <code>SmartTable</code> control to another file, for example, a spreadsheet.
				 * If <code>exportType</code> is <code>sap.ui.comp.smarttable.ExportType.GW</code>, any <code>$expand</code> parameters are removed when
				 * sending the request to generate the file.<br>
				 * To use the export functionality, the {@link sap.ui.export} library is required.
				 *
				 * @since 1.100.0
				 */
				enableExport: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies the type of export to be used in the <code>SmartTable</code> control.
				 *
				 * @since 1.50.0
				 */
				exportType: {
					type: "sap.ui.comp.smarttable.ExportType",
					group: "Misc",
					defaultValue: "UI5ClientPDF"
				},

				/**
				 * Enables the copy-to-clipboard functionality of the <code>SmartTable</code> control.
				 *
				 * When set to <code>true</code>, a {@link sap.m.plugins.CopyProvider} and a {@link sap.m.plugins.CellSelector}
				 * are automatically created and added to the <code>SmartTable</code> control if a custom <code>CopyProvider</code> or <code>CellSelector</code>
				 * are not already used by the application.
				 * When set to <code>false</code>, these created code>CopyProvider</code> and <code>CellSelector</code> plugins are removed again.
				 *
				 * <b>Note:</b><br>
				 * We recommend that you set the <code>enableCopy</code> property to <code>false</code> in the following cases:
				 * <ul>
				 * <li>The copy-to-clipboard functionality is not desired</li>
				 * <li>Plugins with property settings other than the default ones should be used</li>
				 * <li>Only one of the plugins should be used</li>
				 * <li>The functionality conflicts with the concrete application scenario, for example, custom columns with special content</li>
				 * <li>The functionality conflicts with the known restrictions of the <code>CopyProvider</code> and
				 * <code>CellSelector</code> plugins</li>
				 * </ul>
				 *
				 * @since 1.124.0
				 */
				enableCopy: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The <code>useTablePersonalisation</code> attribute can be set to true or false depending on whether you want to define personalized table
				 * settings. If you want to persist the table personalization, you need to specify the persistencyKey property.
				 *
				 * <b>Note:</b><br>
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.26.0
				 */
				useTablePersonalisation: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The showTablePersonalisation attribute can be set to true or false for controlling the visibility of the TablePersonalisation
				 * button.
				 *
				 * @since 1.38.0
				 */
				showTablePersonalisation: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Provides customization to the columns/cell templates generated by the <code>SmartTable</code> control.
				 *
				 * List of supported settings for the <code>customizeConfig</code> property:
				 * <ul>
				 * <li><code>textInEditModeSource</code>: For more information, see {@link sap.ui.comp.smartfield.SmartField#setTextInEditModeSource}</li>
				 * <li><code>insertIgnoreRestrictions</code>: The <code>customData</code> setting for the <code>sap.ui.comp.smartfield.SmartField</code> control. Supported as of version 1.103.</li>
				 * <li><code>autoColumnWidth</code>: This property can be used to influence the column width calculation for columns generated by the <code>SmartTable</code> control itself.
				 * The supported configuration settings are <code>truncateLabel</code>, <code>min</code>, <code>max</code>, and <code>gap</code>.
				 * Supported as of version 1.108. For more information, see {@link sap.ui.comp.smarttable.SmartTable#getEnableAutoColumnWidth}.</li>
				 * <li><code>clientSideMandatoryCheck</code>: For more information, see {@link sap.ui.comp.smartfield.SmartField#setClientSideMandatoryCheck}. Supported as of version 1.111</li>
				 * </ul>
				 * <br />
				 * <i>Examples for the <code>customizeConfig</code> property to change the <code>textInEditModeSource</code> for the default <code>smartField</code></i>
				 * <pre>
				 * &lt;!-- Sets the <code>textInEditModeSource</code> property of all the <code>SmartField</code> controls to <code<>ValueList</code> --&gt;
				 * &lt;SmartTable customizeConfig="{'textInEditModeSource': {'*': 'ValueList'}}" &gt;
				 * </pre>
				 * <pre>
				 * &lt;!-- Sets the <code>textInEditModeSource</code> property of the <code>smartField</code> with path "Bukrs" to <code>NavigationProperty</code> and
				 * others to <code<>ValueList</code>  --&gt;
				 * &lt;SmartTable customizeConfig="{'textInEditModeSource': {'*': 'ValueList','Bukrs':'NavigationProperty'}}" &gt;
				 * </pre>
				 * <pre>
				 * &lt;!-- Sets the <code>autoColumnWidth</code> property of all the columns --&gt;
				 * &lt;SmartTable customizeConfig="{'autoColumnWidth': {'*': {'min': 5, 'max': 10, 'gap': 2, 'truncateLabel': false}}}" &gt;
				 * </pre>
				 * @since 1.97.0
				 */
				customizeConfig: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The number of rows is shown along with the header text if the property <code>showRowCount</code> is set to <code>true</code>.
				 *
				 * <b>Note:</b><br>
				 * <ul>
				 * <li>To improve your application's performance, activate the inline count for OData bindings to avoid sending dedicated OData requests.</li>
				 * <li>If no stable overall count can be retrieved from the binding, the count will not be displayed. This is currently the case for TreeBinding or if no count is requested by the binding.</li>
				 * </ul>
				 *
				 * @since 1.26.0
				 */
				showRowCount: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies header text that is shown in table
				 *
				 * @since 1.26.0
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the semantic level of the header.
				 * For more information, see {@link sap.m.Title#setLevel}.
				 * @since 1.84
				 */
				headerLevel: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance",
					defaultValue: TitleLevel.Auto
				},

				/**
				 * Defines style of the header.
				 * For more information, see {@link sap.m.Title#setTitle}.
				 * @ui5-restricted sap.fe
				 * @since 1.116
				 */
				headerStyle: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance"
				},

				/**
				 * A style class which is defined for the toolbar of the table.
				 *
				 * @since 1.26.0
				 */
				toolbarStyleClass: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Can be used to override the filter behavior. If set to true (default), instead of the filter input box a button is rendered. When
				 * pressing this button, the SmartTable control opens the filter panel directly in the table personalization dialog.
				 *
				 * @deprecated Since 1.40.0. After personalization dialog has been introduced in SmartTable the property
				 *             <code>enableCustomFilter</code> does not make sense. When setting the property to <code>false</code>, the entered
				 *             custom filter value will not be shown in personalization dialog and will also not be persisted in variant management.
				 *             The custom filter will also be overwritten when rebindTable is called on the SmartTable.
				 * @since 1.26.0
				 */
				enableCustomFilter: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Key used to access personalization data.
				 *
				 * <b>Note:</b><br>
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.26.0
				 */
				persistencyKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to true, the standard toolbar and custom toolbar will be merged into one toolbar. The combined toolbar will have a solid
				 * style.
				 *
				 * @since 1.26.0
				 * @deprecated Since 1.29. This property has no effect
				 */
				useOnlyOneSolidToolbar: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Specifies whether the <code>Toolbar</code> control of the <code>SmartTable</code> is placed inside the corresponding
				 * aggregation of the inner UI5 table control.
				 *
				 * @since 1.56
				 */
				placeToolbarInTable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Retrieves or sets the current variant.
				 *
				 * @since 1.28.0
				 */
				currentVariantId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * This attribute can be used to specify if the controls created by the SmartTable control are editable. (The automatic toggle of
				 * controls works only for the SmartField/SmartToggle scenario)
				 *
				 * @since 1.28.0
				 */
				editable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * When set to true, this enables automatic binding of the table using the tableBindingPath (if it exists) or entitySet property. This
				 * happens just after the <code>initialise</code> event has been fired.
				 *
				 * <b>Note:</b><br>
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.28.0
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This attribute can be used to specify the path that is used during the binding of the table. If not specified, the entitySet
				 * attribute is used instead. (used only if binding is established after setting this property: initially due to enableAutoBinding -or- by subsequently calling rebindTable)
				 *
				 * @since 1.28.0
				 */
				tableBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies whether the editable property can be toggled via a button on the toolbar. (The automatic toggle of controls works only
				 * for the SmartField/SmartToggle scenario)
				 *
				 * @since 1.28.0
				 */
				editTogglable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * The demandPopin attribute can be set to true or false depending on whether you want to display columns as popins on the responsive
				 * table
				 *
				 * @since 1.30.0
				 */
				demandPopin: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Controls the visibility of the FullScreen button.
				 *
				 * @since 1.38
				 */
				showFullScreenButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * The text shown initially before the control is bound and initialized. The special values <code>$FILTERBAR</code> or
				 * <code>$NO_FILTERBAR</code> can be specified to make the <code>SmartTable</code> control show the initial text as if the
				 * <code>SmartFilterBar</code> control were associated with it. If nothing is specified, the default behavior is to show the initial
				 * text based on whether the <code>SmartFilterBar</code> control is actually associated with the <code>SmartTable</code> control.
				 *
				 * @since 1.58
				 */
				initialNoDataText: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Shows an info toolbar.<br>
				 * Filters that are applied using the table personalization dialog are shown in the info toolbar.<br>
				 * <b>Note:</b><br>
				 * <ul>
				 * <li>The default value for the property is <code>Auto</code>, which means that the info toolbar is shown by default if table
				 * type is <code>ResponsiveTable</code>.</li>
				 * <li>The info toolbar is hidden if the property is set to <code>Off</code>.</li>
				 * <li>The info toolbar is visible if the property is set to <code>On</code>. Currently the info toolbar is only available for the
				 * table type <code>ResponsiveTable</code>.</li>
				 * <li>If multiple filters are applied to the same column, then the info toolbar contains the column name only once.</li>
				 * <li>In case there is a custom info toolbar used for the responsive table control, then the property must be set to
				 * <code>Off</code>. Otherwise, an error is logged in the browser console.</li>
				 * </ul>
				 *
				 * @since 1.70
				 */
				useInfoToolbar: {
					type: "sap.ui.comp.smarttable.InfoToolbarBehavior",
					group: "Behavior",
					defaultValue: InfoToolbarBehavior.Auto
				},

				/**
				 * Controls the visibility of the Show / Hide Details button for the <code>ResponsiveTable</code> scenario.
				 *
				 * If the available screen space gets too narrow, the columns configured with <code>High</code> and <code>Medium</code>
				 * importance move to the pop-in area while the columns with <code>Low</code> importance are hidden.
				 * On mobile phones, the columns with <code>Medium</code> importance are also hidden.
				 * As soon as the first column is hidden, this button appears in the table toolbar and gives the user
				 * the possibility to toggle the visibility of the hidden columns in the pop-in area.
				 *
				 * <b>Note:</b><br>
				 * This is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.79
				 */
				showDetailsButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Defines which columns should be hidden instead of moved into the pop-in area
				 * depending on their importance.
				 * See {@link sap.m.Column#getImportance} and {@link sap.m.Table#getHiddenInPopin} for more details.
				 *
				 * <b>Note:</b> To hide columns based on their importance, it's mandatory to set <code>showDetailsButton="true"</code>.
				 * If no priority is given, the default configuration of {@link sap.ui.comp.smarttable.SmartTable#getShowDetailsButton} is used.
				 * If this property is changed after the <code>SmartTable</code> has been initialized, the new changes take effect only when the
				 * Show / Hide Details button is pressed a second time.
				 *
				 * @since 1.86
				 */
				detailsButtonSetting: {type: "sap.ui.core.Priority[]", group: "Behavior"},

				/**
				 * Enables heuristic column width calculation for all supported table types based on metadata information when set to <code>true</code>.
				 * The column width calculation takes OData type, column label, text arrangement, possible cell templates, additional fields and many other metadata parameters into account.
				 * Providing more precise <code>MaxLength</code> value for the <code>Edm.String</code> type or <code>precision</code> value for numeric OData types can help this algorithm to produce better results.
				 * The calculated column widths can have a minimum of 3rem and a maximum of 20rem. To avoid the heuristic column width calculation for a particular column, the {@link #annotation:CssDefaults CssDefaults} annotation can be used.
				 *
				 * If <code>tableType="ResponsiveTable"</code>, the following changes are applied:
				 * <ul>
				 *	<li>{@link #getDemandPopin demandPopin} property of the <code>SmartTable</code> is set to <code>true</code>.</li>
				 * 	<li>{@link sap.m.Table#getFixedLayout fixedLayout} property of the inner table is set to <code>Strict</code>.</li>
				 * 	<li>{@link sap.m.Table#getContextualWidth contextualWidth} property of the inner table is set to <code>Auto</code>.</li>
				 *  <li>Column resizing feature gets enabled and the wrapping of column headers get disabled for all columns, including custom columns.</li>
				 * </ul>
				 * Those properties must not be managed by the application.<br><br>
				 *
				 * By default, this feature has no effect on custom columns. To enable heuristic column width calculation also for custom columns, the <code>autoColumnWidth</code> property must be specified in the <code>p13nData</code> custom data.<br>
				 * <b>Note:</b> The automatic column width calculation for custom columns works only when the <code>width</code> property of the custom column is not set.<br>
				 * <b>Note:</b> The custom columns can have unexpected cell templates that might affect the result of the column width calculation, for example, an <code>Edm.Byte</code> field that can only have three digits might be visualized as a <code>sap.m.RatingIndicator</code> that requires more space.<br>
				 * <b>Note:</b> Defining the <code>leadingProperty</code> and a unique <code>columnKey</code> in the <code>p13nData</code> custom data is a prerequisite for all other <code>p13nData</code> properties, including the <code>autoColumnWidth</code> property.<br>
				 * <i>Examples with <code>autoColumnWidth</code> property of the <code>p13nData</code> custom data</i>
				 * <pre>
				 * &lt;!-- Enable the automatic column width calculation for a custom column --&gt;
				 * &lt;Column customdata:p13nData='\{&quot;autoColumnWidth&quot;: true, &quot;leadingProperty&quot;: &quot;PropA&quot;, &quot;columnKey&quot;: &quot;PropA&quot;}' &gt;
				 * </pre><pre>
				 * &lt;!-- Restrict the automatic width calculation to a minimum of 5rem and a maximum of 15rem --&gt;
				 * &lt;Column customdata:p13nData='\{&quot;autoColumnWidth&quot;: \{ &quot;min&quot;: 5, &quot;max&quot;: 15 }, &quot;leadingProperty&quot;: &quot;PropA&quot;, &quot;columnKey&quot;: &quot;PropA&quot;}' &gt;
				 * </pre><pre>
				 * &lt;!-- Define extra 3rem space to the automatic content width calculation --&gt;
				 * &lt;Column customdata:p13nData='\{&quot;autoColumnWidth&quot;: \{ &quot;gap&quot;: 3 }, &quot;leadingProperty&quot;: &quot;PropA&quot;, &quot;columnKey&quot;: &quot;PropA&quot;}' &gt;
				 * </pre><pre>
				 * &lt;!-- Define the visible properties that should be considered for the calculation. Multiple property names can be specified here as comma-separated values. The first property is the leading property. --&gt;
				 * &lt;Column customdata:p13nData='\{&quot;autoColumnWidth&quot;: \{ &quot;visibleProperty&quot;: &quot;PropC&quot; }, &quot;leadingProperty&quot;: &quot;PropA&quot;, &quot;additionalProperty&quot;: &quot;PropB,PropC&quot;, &quot;columnKey&quot;: &quot;PropA&quot;}' &gt;
				 * </pre><pre>
				 * &lt;!-- The calculated column width must not be smaller than the column header --&gt;
				 * &lt;Column customdata:p13nData='\{&quot;autoColumnWidth&quot;: \{ &quot;truncateLabel&quot;: false }, &quot;leadingProperty&quot;: &quot;PropA&quot;, &quot;columnKey&quot;: &quot;PropA&quot;}' &gt;
				 * </pre>
				 *
				 * <b>Note:</b><br>
				 * The <code>enableAutoColumnWidth</code> is not a dynamic property and cannot be changed once the control has been initialized.
				 *
				 * @since 1.86
				 */
				enableAutoColumnWidth: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Controls the visibility of the Paste button.
				 *
				 * @since 1.91
				 */
				showPasteButton: {
					type: "boolean",
					group: "Behavior",
					defaultValue: false
				},

				/**
				 * Determines whether the Paste button is enabled.
				 *
				 * @since 1.96
				 */
				enablePaste: {
					type: "boolean",
					group: "Behavior",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code>, all date fields in the Filter Panel of the settings dialog with filter restriction
				 * <code>interval</code> will be treated as
				 * <code>DateTimeRange</code> filters. The <code>useDateRangeType</code> can be set only once during initialization. <b>Note:</b>
				 * If this property is set to <code>true</code> and any date filters with filter restriction <code>interval</code> were stored as
				 * part of a variant, the values of these filters cannot be applied. If this property is set to <code>false</code>, any previously
				 * stored filters which were treated as type <code>DateTimeRange</code> based on the former setting, cannot be converted back to the
				 * standard date interval.
				 * @since 1.126.0
				 */
				useDateRangeType: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Determines the state of showDetailsButton button.
				 *
				 * @since 1.132.0
				 */
				showDetails: {
					type: "boolean",
					group: "Misc",
					defaultValue: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * Identifies the SmartVariant control which should be used for the personalization. Will be ignored if the advanced mode is set.
				 *
				 * @since 1.38
				 */
				smartVariant: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			aggregations: {

				/**
				 * A toolbar that can be added by the user to define their own custom buttons, icons, etc. If this is specified, the SmartTable
				 * control does not create an additional toolbar, but makes use of this one.<br>
				 * <b>Note:</b><br>
				 * The CSS class sapMTBHeader-CTX is applied on the given toolbar.
				 *
				 * @since 1.26.0
				 */
				customToolbar: {
					type: "sap.m.Toolbar",
					multiple: false
				},

				/**
				 * The Semantic Object Controller allows the user to specify and overwrite functionality for semantic object navigation.
				 *
				 * @since 1.28.0
				 */
				semanticObjectController: {
					type: "sap.ui.comp.navpopover.SemanticObjectController",
					multiple: false
				},

				/**
				 * The value for the noData aggregation can be either a string value or a control instance.<br>
				 * The control is shown, in case there is no data for the Table available. In case of a string value this will simply replace the no
				 * data text.<br>
				 * Currently the Responsive Table only supports string values.
				 *
				 * @since 1.32.0
				 */
				noData: {
					type: "sap.ui.core.Control",
					altTypes: [
						"string"
					],
					multiple: false
				},
				/**
				 * Allows users to specify an additional control that will be added to a VBox for the first semantic key field.<br>
				 * <b>Note:</b><br>
				 * This property is not meant for public use.
				 *
				 * @since 1.38.0
				 */
				semanticKeyAdditionalControl: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * Defines an aggregation for the <code>DataStateIndicator</code> plugin that can be used to show binding-related messages.
				 * If the {@link sap.m.plugins.DataStateIndicator#getEnableFiltering enableFiltering} property of the <code>DataStateIndicator</code> is set to <code>true</code>, the
				 * <code>SmartTable</code> control prevents the original behavior of the <code>DataStateIndicator</code> and manages the filtering of binding-related messages.
				 * If a user applies or clears message filters, the <code>SmartTable</code> control fires the {@link #event:beforeRebindTable beforeRebindTable} event with the <code>messageFilterActive</code>
				 * parameter that is used to determine whether message filtering is active or not.
				 * After the binding-related messages have been filtered by the user, all the existing filters, for example, those defined using <code>SmartFilterBar</code> are only taken into account once the message filter has been cleared again.
				 * Therefore the message filtering should not be used in combination with a <code>SmartFilterBar</code>. Required additional filters must be added by applications in the {@link #event:beforeRebindTable beforeRebindTable} event.
				 *
				 * @since 1.89
				 */
				dataStateIndicator: {
					type: "sap.m.plugins.DataStateIndicator",
					multiple: false
				},

				/**
				 * Defines an aggregation for the <code>CopyProvider</code> plugin that provides copy to clipboard capabilities for the selected rows of the table and creates a Copy button for the toolbar of the table.
				 * To disable the copy function of the table, including the Copy button in the toolbar, the <code>enabled</code> property of the <code>CopyProvider</code> must be set to <code>false</code>.
				 * To hide the Copy button from the toolbar, the <code>visible</code> property of the <code>CopyProvider</code> must be set to <code>false</code>.
				 *
				 * <b>Note:</b> The {@link sap.m.plugins.CopyProvider#extractData extractData} property of the <code>CopyProvider</code> must not be managed by the application.
				 * <b>Note:</b> The <code>CopyProvider</code> requires a secure context to access the clipboard API. If the context is not secure, the plugin will not be added, and the copy button will not be generated.
				 * @since 1.114
				 */
				copyProvider: {
					type: "sap.m.plugins.CopyProvider",
					multiple: false
				},

				/**
				 * Allows the user to configure filters for the table personalization
				 * @since 1.126
				 */
				filterControlConfiguration:  {
					type: "sap.ui.comp.config.FilterControlConfiguration",
					multiple: true
				}
			},
			events: {

				/**
				 * This event is fired once the control has been initialized.
				 *
				 * @since 1.26.0
				 */
				initialise: {},

				/**
				 * This event is fired just before the binding is being done.
				 *
				 * @name sap.ui.comp.smarttable.SmartTable#beforeRebindTable
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {boolean} oControlEvent.getParameters.messageFilterActive Indicates whether the message filtering is active or not
				 * @param {object} oControlEvent.getParameters.bindingParams The bindingParams object contains filters, sorters and other binding
				 *        related information for the table.
				 * @param {boolean} oControlEvent.getParameters.bindingParams.preventTableBind If set to <code>true</code> by the listener, binding
				 *        is prevented

				 * @param {sap.ui.model.Filter[]} oControlEvent.getParameters.bindingParams.filters The combined filter array containing a set of
				 *        sap.ui.model.Filter instances of the SmartTable and SmartFilter controls; can be modified by users to influence filtering
				 * @param {sap.ui.model.Sorter[]} oControlEvent.getParameters.bindingParams.sorter An array containing a set of sap.ui.model.Sorter
				 *        instances of the SmartTable control (personalization); can be modified by users to influence sorting
				 * @param {object} oControlEvent.getParameters.bindingParams.parameters a map of parameters which is passed to the binding
				 * @param {object} oControlEvent.getParameters.bindingParams.events map of event listeners for the binding events (since 1.56). The
				 *        events listeners can only be registered while the binding is created. So, ensure that the events parameter is filled from
				 *        the beginning, so that the registration can be done while the binding is created.
				 * @since 1.26.0
				 * @public
				 */
				beforeRebindTable: {},

				/**
				 * This event is fired when display/edit button is clicked.
				 *
				 * @since 1.28.0
				 */
				editToggled: {},

				/**
				 * This event is fired when data is requested after binding. The event is fired if the binding for the table is done by the SmartTable
				 * itself.
				 *
				 * @since 1.52.0
				 * @deprecated Since 1.56. Use <code>beforeRebindTable</code> event to attach/listen to the binding "events" directly
				 */
				dataRequested: {},

				/**
				 * This event is fired when data is received after binding. The event is fired if the binding for the table is done by the SmartTable
				 * itself.
				 *
				 * @since 1.28.0
				 * @deprecated Since 1.56. Use <code>beforeRebindTable</code> event to attach/listen to the binding "events" directly
				 */
				dataReceived: {},

				/**
				 * This event is fired after variant management in the SmartTable has been initialized.
				 *
				 * @since 1.28.0
				 */
				afterVariantInitialise: {},

				/**
				 * This event is fired after a variant has been saved. This event can be used to retrieve the ID of the saved variant.
				 *
				 * @since 1.28.0
				 */
				afterVariantSave: {
					parameters: {
						/**
						 * ID of the currently selected variant
						 */
						currentVariantId: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired after a variant has been applied.
				 *
				 * @since 1.28.0
				 */
				afterVariantApply: {
					parameters: {
						/**
						 * ID of the currently selected variant
						 */
						currentVariantId: {
							type: "string"
						},
						/**
						 * Context in which the variant has been applied
						 */
						variantContext: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired just before the overlay is being shown.
				 *
				 * @name sap.ui.comp.smarttable.SmartTable#showOverlay
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.overlay The overlay object contains information related to the table's overlay
				 * @param {boolean} oControlEvent.getParameters.overlay.show If set to <code>false</code> by the listener, overlay is not shown
				 * @since 1.32.0
				 * @public
				 */
				showOverlay: {},

				/**
				 * This event is fired when an editable field, created internally by the SmartTable control, is changed.
				 *
				 * @since 1.34.0
				 */
				fieldChange: {},

				/**
				 * This event is fired right after the full screen mode of the SmartTable control has been changed.
				 *
				 * @since 1.46
				 */
				fullScreenToggled: {
					parameters: {
						/**
						 * If <code>true</code>, control is in full screen mode
						 */
						fullScreen: {
							type: "boolean"
						}
					}
				},
				/**
				 * This event is fired just before export is triggered.
				 *
				 * @name sap.ui.comp.smarttable.SmartTable#beforeExport
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.exportSettings General export configuration
				 * @param {object} oControlEvent.getParameters.userExportSettings User specific settings
				 * @param {sap.ui.export.util.Filter[]} oControlEvent.getParameters.filterSettings Filter settings that will be contained in the exported file
				 * @since 1.50
				 * @public
				 */
				beforeExport: {
					allowPreventDefault: true,
					parameters: {
						/**
						 * Contains workbook.columns, dataSource and other export-related information
						 */
						exportSettings: {
							type: "object"
						},
						/**
						 * Contains the export settings defined by the user
						 */
						userExportSettings: {
							type: "object"
						},
						/**
						 * Contains the filter settings that are applied to the exported data
						 */
						filterSettings: {
							type: "object[]"
						}
					}
				},
				/**
				 * This event is fired just before the paste event is triggered and can be used to prevent the default paste behavior.
				 * <br><b>Note</b>: If no validation is desired, applications can use the <code>rawData</code> parameter to directly access the pasted data.
				 * <br><b>Note</b>: If a column contains additional properties, they are considered as separate columns for the pasting.
				 *
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {sap.ui.comp.smarttable.ColumnInfoForPaste[]} oControlEvent.getParameters.columnInfos Paste-related column information
				 * @param {string[][]} oControlEvent.getParameters.rawData Two-dimensional array of strings with data from the clipboard
				 *
				 * @since 1.64
				 * @public
				 */
				beforePaste: {
					allowPreventDefault: true,
					parameters: {
						/**
						 * Contains an array of column info objects as determined by the <code>SmartTable</code> control.
						 */
						columnInfos: {
							type: "sap.ui.comp.smarttable.ColumnInfoForPaste[]"
						},
						/**
						 * Two-dimensional array of strings with data from the clipboard.
						 * The first dimension represents the rows, and the second dimension represents the cells of the tabular data.
						 */
						rawData: {
							type: "string[][]"
						}
					}
				},
				/**
				 * This event is fired when pasting is triggered.
				 *
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.result The result of the parsing
				 *
				 * @since 1.64
				 * @public
				 */
				paste: {
					parameters: {
						/**
						 * The result of the parsing returned by <code>PasteHelper.parse</code> API.<br>
						 * The result object contains parsed data if the validation was successful (the error array has the value <code>null</code>),
						 * or it contains all collected errors if the validation failed (the data array has the value <code>null</code>).
						 *
						 * Example of the result object after the successful validation - the data array is filled, and the error object is empty:
						 * <pre>
						 *   oResult = {
						 *     parsedData: [
						 *       {FirstName: "Max", LastName : "Mustermann"},
						 *       {FirstName: "John", LastName: "Doe"}
						 *     ],
						 *     errors: null
						 *   });
						 * </pre>
						 *
						 * The error array contains objects with the following properties:
						 * <ul>
						 *   <li>row {number} Row index where the error occurred</li>
						 *   <li>column {number} Column index where the error occurred</li>
						 *   <li>property {string} The column-related property</li>
						 *   <li>value {string} The pasted value</li>
						 *   <li>type {object} The type instance that is used to parse the pasted value</li>
						 *   <li>message {string} The error message</li>
						 * </ul>
						 *
						 * Example of the result object after the failed validation - error information is available, and the data array is empty:
						 * <pre>
						 *   oResult = {
						 *     parsedData: null,
						 *     errors: [
						 *       {row: 2, column: 3, property: 'age', value: 'x', type:'sap.ui.model.odata.type.Byte', message: 'Value "x" in row 2 and column 2 cannot be parsed.'}
						 *     ]
						 *   });
						 * </pre>
						 */
						result: {
							type: "object"
						}
					}
				},
				/**
				 * This event is fired when the UI state changes either via the {@link sap.ui.comp.smarttable.SmartTable#setUiState} method or the table personalization.
				 * @since 1.96.15
				 */
				uiStateChange: {}
			}
		},
		renderer: {
			apiVersion: 2
		},
		constructor: function() {
			this._oTableReady = (function() {
				var oDeffer = {};
				oDeffer.promise = new Promise(function(resolve) {
					oDeffer.resolve = resolve;
				});
				return oDeffer;
			}());

			VBox.apply(this, arguments);
			this._aExistingColumns = [];
			this._aAlwaysSelect = [];
			this._oTemplate = null;
			this._mFieldMetadataByKey = {};
			this._bUseLegacyMenu = false;
			this._createToolbar();
			this._updateP13nDialogSettings();
			this._createTable();
			this.attachModelContextChange(this._initialiseMetadata, this);
		}
	});

	/**
	 * Check, parse and return the p13nDialog settings custom data
	 * @returns {object} p13nDialog settings
	 * @private
	 */
	SmartTable.prototype._getP13nDialogSettings = function() {
		var oP13nDialogSettings = this.data("p13nDialogSettings");

		if (typeof this._oP13nDialogSettings === "string") {
			try {
				oP13nDialogSettings = JSON.parse(this._oP13nDialogSettings);
			} catch (e) {
				oP13nDialogSettings = null;
				Log.error("Assigned p13nDialogSettings is not a valid JSON object");
			}
		}

		return oP13nDialogSettings;
	};

	/**
	 * Determines the logical owner of the plugins.
	 * @private
	 */
	["DataStateIndicator", "CopyProvider", "CellSelector"].forEach((sPlugin) => {
		SmartTable.prototype[`get${sPlugin}PluginOwner`] = function() {
			return this._oTable || this._oTableReady?.promise;
		};
	});

	SmartTable.prototype.setDataStateIndicator = function(oDataStateIndicator) {
		this._handeDataStateEvents(this.getDataStateIndicator(), "detach");
		this.setAggregation("dataStateIndicator", oDataStateIndicator, true);
		this._handeDataStateEvents(this.getDataStateIndicator(), "attach");
		return this;
	};

	SmartTable.prototype.setCopyProvider = function(oCopyProvider) {
		this.setAggregation("copyProvider", oCopyProvider, true);

		if (window.isSecureContext && oCopyProvider && this._bToolbarInsertedIntoItems) {
			this._createToolbarContent();
		}

		this._updateCopy();
		return this;
	};

	SmartTable.prototype.insertDependent = function(oElement, iIndex) {
		if (this._oCellSelector && this.indexOfDependent(this._oCellSelector) >= 0) {
			// Ensure that not accidently 2 Cellselectors (application and default) are added at the same time
			this.removeAggregation("dependents", this._oCellSelector);
		}
		VBox.prototype.insertAggregation.apply(this, arguments);
		this._updateCopy();
		return this;
	};

	SmartTable.prototype.addDependent = function(oElement) {
		if (this._oCellSelector && this.indexOfDependent(this._oCellSelector) >= 0) {
			// Ensure that not accidently 2 Cellselectors (application and default) are added at the same time
			this.removeAggregation("dependents", this._oCellSelector);
		}
		VBox.prototype.addDependent.apply(this, arguments);
		this._updateCopy();
		return this;
	};

	SmartTable.prototype.removeDependent = function(vElement) {
		var oElement = VBox.prototype.removeDependent.apply(this, arguments);
		this._updateCopy();
		return oElement;
	};

	SmartTable.prototype.removeAllDependents = function() {
		var aElements = VBox.prototype.removeAllDependents.apply(this, arguments);
		this._updateCopy();
		return aElements;
	};

	SmartTable.prototype.destroyDependents = function() {
		VBox.prototype.destroyDependents.apply(this, arguments);
		this._updateCopy();
		return this;
	};

	SmartTable.prototype.setEnableCopy = function(bCopy) {
		this.setProperty("enableCopy", bCopy, true);
		this._updateCopy();
		return this;
	};

	SmartTable.prototype._updateCopy = function() {
		if (this.isDestroyed() || this.isDestroyStarted()) {
			// No update needed if the control is destroyed or is in the process of being destroyed
			return;
		}

		const oExistingCopyProvider = this.getCopyProvider();
		const oExistingCellSelector = CellSelector.findOn(this);
		const bDefaultCopyEnabled = this.getEnableCopy();

		// Apply CopyProvider and CellSelector when not already provided by application otherwise remove them
		if (bDefaultCopyEnabled && !oExistingCopyProvider && !oExistingCellSelector) {
			if (!this._oCopyProvider || this._oCopyProvider.isDestroyed()) {
				this._oCopyProvider = new CopyProvider(this.getId() + "-cp");
			}
			if (!this._oCellSelector || this._oCellSelector.isDestroyed()) {
				this._oCellSelector = new CellSelector(this.getId() + "-cs");
			}
			this.setCopyProvider(this._oCopyProvider);
			this.addDependent(this._oCellSelector);
		} else if (!bDefaultCopyEnabled
				|| (oExistingCopyProvider && oExistingCopyProvider !== this._oCopyProvider)
				|| (oExistingCellSelector && oExistingCellSelector !== this._oCellSelector)) {
			if (this._oCopyProvider && oExistingCopyProvider === this._oCopyProvider) {
				this.setCopyProvider(null);
			}
			if (this._oCellSelector && oExistingCellSelector === this._oCellSelector) {
				this.removeDependent(this._oCellSelector);
			}
		}
	};

	/**
	 * Returns the clipboard settings for a column.
	 *
	 * @param {sap.ui.table.Column|sap.m.Column} oColumn The column for which to get the clipboard settings
	 * @returns {sap.m.plugins.CopyProvider.ColumnClipboardSettings} Clipboard setting object for the provided column.
	 * @private
	 * @ui5-restricted sap.m.plugins.CopyProvider
	 */
	SmartTable.prototype.getColumnClipboardSettings = function(oColumn) {
		var oColumnData = oColumn.data("p13nData");
		var sPath = this._getColumnLeadingProperty(oColumn, oColumnData);
		if (!oColumnData || !sPath) {
			return null;
		}

		var oType, fnUnitFormatter;
		var aProperties = [sPath];
		var sTemplate = "{0}";
		if (oColumnData.unit) {
			sTemplate = "{0} {1}";
			aProperties.push(oColumnData.unit);
			fnUnitFormatter = FormatUtil[oColumnData.isCurrency ? "getAmountCurrencyFormatter" : "getMeasureUnitFormatter"](this._bPreserveDecimals);
		} else {
			oType = oColumnData.typeInstance || (this._oTableProvider.getFieldMetadata(sPath) || {}).modelType;
			if (oColumnData.description && oColumnData.displayBehaviour !== "idOnly") {
				if (oColumnData.displayBehaviour === "descriptionOnly") {
					aProperties = [oColumnData.description];
				} else {
					sTemplate = FormatUtil.getFormattedExpressionFromDisplayBehaviour(oColumnData.displayBehaviour, "{0}", "{1}");
					aProperties.push(oColumnData.description);
				}
			}
		}

		return {
			types: [oType],
			properties: aProperties,
			unitFormatter: fnUnitFormatter,
			template: sTemplate
		};
	};

	SmartTable.prototype.setCustomizeConfig = function(oValue) {
		this.setProperty("customizeConfig", oValue, true);
		return this;
	};

	/**
	 * Sets the <code>useExportToExcel</code> property which enables export of data.
	 * The export type can be defined using <code>exportType</code> property.
	 *
	 * @param {boolean} bValue New value for property useExportToExcel
	 * @returns {sap.ui.comp.smarttable.SmartTable} Reference to <code>this<code> in order to allow method chaining
	 * @deprecated As of version 1.100, replaced by {@link #setEnableExport}.
	 * @public
	 */
	SmartTable.prototype.setUseExportToExcel = function(bValue) {
		var bOldValue = this.getUseExportToExcel();
		this.setProperty("useExportToExcel", bValue, true);

		if (bOldValue !== this.getUseExportToExcel()) {
			this.setEnableExport(bValue);
		}
		return this;
	};

	/* @deprecated As of version 1.100, can be removed when useExportToExcel is removed */
	(() => {
		/**
		 * Sets the <code>exportEnable</code> property that enables the export of data.
		 * The export type can be defined using the <code>exportType</code> property.
		 *
		 * @param {boolean} bValue New value for property enableExport
		 * @returns {sap.ui.comp.smarttable.SmartTable} Reference to <code>this<code> in order to allow method chaining
		 * @since 1.100.0
		 * @public
		 */
		SmartTable.prototype.setEnableExport = function(bValue) {
			var bOldValue = this.getEnableExport();
			this.setProperty("enableExport", bValue, true);

			if (bOldValue !== this.getEnableExport()) {
				this.setUseExportToExcel(bValue);
			}
			return this;
		};
	})();

	SmartTable.prototype._validateCustomizeConfig = function(oConfig) {
		if (!oConfig) {
			return;
		}

		if (oConfig.isA) {
			Log.error("Invalid config property. Provided configuration has been deleted from the customizeConfig property - " + this.getId());
			this.setCustomizeConfig(null);
			return;
		}

		for (var sKey in oConfig) {
			switch (sKey) {
				case "textInEditModeSource":
					this._validateTextInEditModeSource(oConfig);
					break;
				case "ignoreInsertRestrictions":
					this._validateIgnoreInsertRestrictions(oConfig);
					break;
				case "autoColumnWidth":
					this._validateAutoColumnWidth(oConfig);
					break;
				case "clientSideMandatoryCheck":
					this._validateClientSideMandatoryCheck(oConfig);
					break;
				default:
					Log.error(sKey + " is not a supported configuration for the customizeConfig property - " + this.getId());
					delete oConfig[sKey];
					break;
			}
		}
	};

	SmartTable.prototype._validateTextInEditModeSource = function(oConfig) {
		if (this._validateCustomizeConfigObjectType(oConfig["textInEditModeSource"])) {
			delete oConfig.textInEditModeSource;
			Log.error("Invalid config property textInEditModeSource. Provided configuration has been deleted from the customizeConfig property - " + this.getId());
			return;
		}

		this._checkAllowedValuesForCustomizeConfig(oConfig["textInEditModeSource"], Object.keys(library.smartfield.TextInEditModeSource), "textInEditModeSource");
	};

	/**
	 * Validates whether the property value of the customizeConfig property is of type object.
	 * @param {object} oConfig the property value from the customizeConfig object
	 * @returns {boolean} true if the passed parameter if of type object else false
	 * @private
	 */
	SmartTable.prototype._validateCustomizeConfigObjectType = function(oConfig) {
		if (typeof oConfig !== "object"
			|| !Object.keys(oConfig).length
			|| oConfig.isA) {
			return true;
		}

		return false;
	};

	/**
	 * Checks the values passed in the specific property name of the customizeConfig against the passed allowed values.
	 * @param {object} oConfig the property value from the customizeConfig object
	 * @param {array} aAllowedValues array containing allowed values for the specific customizeConfig proeprty name
	 * @param {string} sCustomizeConfigPropertyName customizeConfig property name
	 * @private
	 */
	SmartTable.prototype._checkAllowedValuesForCustomizeConfig = function(oConfig, aAllowedValues, sCustomizeConfigPropertyName) {
		for (var sKey in oConfig) {
			if (!aAllowedValues.includes(oConfig[sKey])) {
				Log.error(`Invalid config property '${sKey}' for the ${sCustomizeConfigPropertyName} property of the customizeConfig - ${this.getId()}`);
				delete oConfig[sKey];
			}
		}
	};

	/**
	 * Validates the 'ignoreInsertRestrictions' config data for the SmartField control.
	 * @param {object} oConfig the customizeConfig object
	 * @private
	 */
	SmartTable.prototype._validateIgnoreInsertRestrictions = function(oConfig) {
		if (this._validateCustomizeConfigObjectType(oConfig["ignoreInsertRestrictions"])) {
			delete oConfig.ignoreInsertRestrictions;
			Log.error("Invalid config property ignoreInsertRestrictions. Provided configuration has been deleted from the customizeConfig property - " + this.getId());
			return;
		}

		this._checkAllowedValuesForCustomizeConfig(oConfig["ignoreInsertRestrictions"], [true, false], "ignoreInsertRestrictions");
	};

	/**
	 * Validates the 'clientSideMandatoryCheck' config data for the SmartField control.
	 * @param {object} oConfig the customizeConfig object
	 * @private
	 */
	SmartTable.prototype._validateClientSideMandatoryCheck = function(oConfig) {
		if (this._validateCustomizeConfigObjectType(oConfig["clientSideMandatoryCheck"])) {
			delete oConfig.clientSideMandatoryCheck;
			Log.error("Invalid config property clientSideMandatoryCheck. Provided configuration has been deleted from the customizeConfig property - " + this.getId());
			return;
		}

		this._checkAllowedValuesForCustomizeConfig(oConfig["clientSideMandatoryCheck"], [true, false], "clientSideMandatoryCheck");
	};

	/**
	 * Validates the 'autoColumnWidth' config data for the SmartTable control, that contains configuration for enableAutoColumnWidth algorithm.
	 * Also validates the inner configuration provided for the autoColumnWidth.
	 * The expeceted value for the autoColumnWidth can be a "boolean" or an "object" with the below allowed properties:
	 * {
	 *   truncateLabel: "boolean",
	 *   min: "number",
	 *   max: "number",
	 *   gap: "number"
	 * }
	 * @param {object} oConfig the customizeConfig object
	 * @private
	 */
	SmartTable.prototype._validateAutoColumnWidth = function(oConfig) {
		if (!this.getEnableAutoColumnWidth() && oConfig.hasOwnProperty("autoColumnWidth")) {
			delete oConfig.autoColumnWidth;
			Log.error("The autoColumnWidth property is deleted from the customizeConfig, since enableAutoColumnWidth=false on the SmartTable - " + this.getId());
		}

		if (this._validateCustomizeConfigObjectType(oConfig["autoColumnWidth"])) {
			delete oConfig.autoColumnWidth;
			Log.error("Invalid config property autoColumnWidth. Provided configuration has been deleted from the customizeConfig property - " + this.getId());
			return;
		}

		if (typeof oConfig["autoColumnWidth"] === "boolean" || typeof oConfig["autoColumnWidth"] === "object") {
			var oAutoColumnWidth = oConfig["autoColumnWidth"];
			for (var sAutoColumnWidthConfig in oAutoColumnWidth) {
				if (typeof oAutoColumnWidth[sAutoColumnWidthConfig] === "boolean") {
					continue;
				}

				if (typeof oAutoColumnWidth[sAutoColumnWidthConfig] !== "object") {
					Log.error(`Expected 'object' or 'boolean', instead ${typeof oAutoColumnWidth[sAutoColumnWidthConfig]} was passed for '${sAutoColumnWidthConfig}' autoColumnWidth customizeConfig property - ${this.getId()}`);
					delete oAutoColumnWidth[sAutoColumnWidthConfig];
					continue;
				}

				var oAutoColumnWidthConfig = oAutoColumnWidth[sAutoColumnWidthConfig];

				for (var sCurrentKey in oAutoColumnWidthConfig) {
					var sType = null;
					switch (sCurrentKey) {
						case "truncateLabel":
							sType = typeof oAutoColumnWidthConfig[sCurrentKey];
							if (sType !== "boolean") {
								Log.error("The " + sCurrentKey + " property must be of type boolean, instead " + sType + " was passed - " + this.getId());
								delete oAutoColumnWidthConfig[sCurrentKey];
							}
							break;
						case "min":
						case "max":
						case "gap":
							sType = typeof oAutoColumnWidthConfig[sCurrentKey];
							if (sType !== "number") {
								Log.error("The " + sCurrentKey + " property must be of type number, instead " + sType + " was passed - " + this.getId());
								delete oAutoColumnWidthConfig[sCurrentKey];
							}
							break;
						default:
							Log.error(`Invalid config property '${sCurrentKey}' for the autoColumnWidth property of the customizeConfig - ${this.getId()}`);
							delete oAutoColumnWidthConfig[sCurrentKey];
					}
				}
			}
		}

	};

	SmartTable.prototype._handeDataStateEvents = function(oDataStateIndicator, sAction) {
		if (oDataStateIndicator) {
			oDataStateIndicator[sAction + "ApplyFilter"](this._onApplyMessageFilter, this);
			oDataStateIndicator[sAction + "ClearFilter"](this._onClearMessageFilter, this);
			oDataStateIndicator[sAction + "Event"]("filterInfoPress", this._handleInfoToolbarPress, this);
		}
	};

	/**
	 * Sets the value for the <code>headerLevel</code> property.
	 * @param {string} sLevel The level that is set to the header
	 * @returns {sap.ui.comp.smarttable.SmartTable} Reference to <code>this<code> in order to allow method chaining
	 * @public
	 */
	SmartTable.prototype.setHeaderLevel = function(sLevel) {
		if (this.getHeaderLevel() === sLevel) {
			return this;
		}
		this.setProperty("headerLevel", sLevel, true);
		this._headerText?.setLevel(sLevel);
		this._updateVariantManagement();

		return this;
	};

	/**
	 * Sets the value for the <code>headerSty;e</code> property.
	 * @param {string} sStyle The style that is set to the header
	 * @returns {sap.ui.comp.smarttable.SmartTable} Reference to <code>this<code> in order to allow method chaining
	 * @public
	 */
	SmartTable.prototype.setHeaderStyle = function(sStyle) {
		if (this.getHeaderStyle() === sStyle) {
			return this;
		}
		this.setProperty("headerStyle", sStyle, true);
		this._headerText?.setTitleStyle(sStyle || TitleLevel[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_HeaderStyle"})]);
		this._updateVariantManagement();

		return this;
	};

	/**
	 * Creates new instance MessageStrip instance for the p13nFilterPanel.
	 *
	 * @returns {undefined|sap.m.MessageStrip} returns undefined if data state filtering is not active otherwise a sap.m.MessageStrip instance
	 * @private
	 */
	SmartTable.prototype._getP13nFilterMessageStrip = function() {
		var oMessageStrip, oResourceBundle;

		if (this._oMessageFilter) {
			oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
			oMessageStrip = new MessageStrip({
				text: oResourceBundle.getText("SMARTTABLE_P13N_FILTER_MESSAGESTRIP"),
				link: new Link({
					text: oResourceBundle.getText("SMARTTABLE_MESSAGESTRIP_CLEAR_FILTER"),
					reactiveAreaMode: MLibrary.ReactiveAreaMode.Overlay,
					press: [function() {
						this._fnClearMessageFilter();
						oMessageStrip.setVisible(false);
					}, this]
				})
			});
		}

		return oMessageStrip;
	};

	/**
	 * This gets called from the DataStateIndicator plugin when data state message filter is applied
	 *
	 * @param {sap.ui.base.Event} oEvent DataStateIndicator event object
	 * @private
	 */
	SmartTable.prototype._onApplyMessageFilter = function(oEvent) {
		this._fnClearMessageFilter = oEvent.getParameter("revert");
		this._oMessageFilter = oEvent.getParameter("filter");
		oEvent.preventDefault();
		this._reBindTable();
	};

	/**
	 * This gets called from the DataStateIndicator plugin when the data state message filter is cleared
	 *
	 * @param {sap.ui.base.Event} oEvent DataStateIndicator event object
	 * @private
	 */
	SmartTable.prototype._onClearMessageFilter = function(oEvent) {
		this._oMessageFilter = null;
		oEvent.preventDefault();
		this._reBindTable();
	};

	// **
	// * This file defines behaviour for the control,
	// */
	SmartTable.prototype.init = function() {
		VBox.prototype.init.call(this);
		this.addStyleClass("sapUiCompSmartTable");
		this.setFitContainer(true);
		this._aColumnKeys = [];
		this._aDeactivatedColumns = [];
		this._mLazyColumnMap = {};
		this._mMenuShowEntryMap = new window.WeakMap();
	};

	SmartTable.prototype._getVariantManagementControl = function(oSmartVariantId) {
		var oSmartVariantControl = null;
		if (oSmartVariantId) {
			if (typeof oSmartVariantId === "string") {
				oSmartVariantControl = Element.getElementById(oSmartVariantId);
			} else {
				oSmartVariantControl = oSmartVariantId;
			}

			if (oSmartVariantControl) {
				if (!(oSmartVariantControl instanceof SmartVariantManagement)) {
					Log.error("Control with the id=" + oSmartVariantId.getId ? oSmartVariantId.getId() : oSmartVariantId + " not of expected type");
					return null;
				}
			}
		}

		return oSmartVariantControl;
	};

	/**
	 * instantiates the SmartVariantManagementControl
	 *
	 * @private
	 */
	SmartTable.prototype._createVariantManagementControl = function() {

		// Do not create variant management when it is not needed!
		if (this._oVariantManagement || (!this.getUseVariantManagement() && !this.getUseTablePersonalisation()) || !this.getPersistencyKey()) {
			return;
		}

		// always create VariantManagementControl, in case it is not used, it will take care of persisting the personalisation
		// without visualization
		var oPersInfo = new PersonalizableInfo({
			type: "table",
			keyName: "persistencyKey",
			dataSource: "TODO"
		});

		oPersInfo.setControl(this);

		var sSmartVariantId = this.getSmartVariant();
		if (sSmartVariantId) {
			this._oVariantManagement = this._getVariantManagementControl(sSmartVariantId);
		} else if (this._oSmartFilter && this._oSmartFilter.data("pageVariantPersistencyKey")) {
			sSmartVariantId = this._oSmartFilter.getSmartVariant();
			if (sSmartVariantId) {
				this._oVariantManagement = this._getVariantManagementControl(sSmartVariantId);
			}
		} else {
			this._oVariantManagement = new SmartVariantManagement(this.getId() + "-variant", {
				showShare: true
			});
		}

		if (this._oVariantManagement) {
			this._oVariantManagement.addPersonalizableControl(oPersInfo);

			// Current variant could have been set already (before initialise) by the SmartVariant, in case of GLO/Industry specific variant
			// handling
			this._oVariantManagement.attachSave(this._variantSaved, this);
			this._oVariantManagement.attachAfterSave(this._variantAfterSave, this);

			this._oVariantManagement.initialise(this._variantInitialised, this);

			this._updateVariantManagement();
		}

	};

	SmartTable.prototype._variantInitialised = function() {
		if (!this._oCurrentVariant) {
			this._oCurrentVariant = "STANDARD";
		}
		this.fireAfterVariantInitialise();
		/*
		 * If VariantManagement is disabled (no LRep connectivity) trigger the binding
		 */
		if (this._oVariantManagement && !this._oVariantManagement.getEnabled()) {
			this._checkAndTriggerBinding();
		}
	};

	SmartTable.prototype._variantSaved = function() {
		if (this._oPersController) {
			this._oPersController.setPersonalizationData(this._oCurrentVariant, true);
		}
	};

	SmartTable.prototype._variantAfterSave = function() {
		this.fireAfterVariantSave({
			currentVariantId: this.getCurrentVariantId()
		});
	};

	SmartTable.prototype.setTableBindingPath = function(sPath) {
		// only to prevent invalidation!
		this.setProperty("tableBindingPath", sPath, true);
		return this;
	};

	SmartTable.prototype.setTableType = function(sTableType) {
		if (this.getTableType() === sTableType) {
			return this;
		}

		if (this._bInitialising) {
			throw new Error("tableType changed while SmartTable control was initializing - " + this.getId());
		}

		if (this.getTable()) {
			Log.error("The inner table is already created. Changing the table type is not supported.");
			return this;
		}

		this.setProperty("tableType", sTableType);
		return this;
	};

	SmartTable.prototype.setShowTablePersonalisation = function(bShowTablePersonalisation) {
		this.setProperty("showTablePersonalisation", bShowTablePersonalisation, true);
		if (this._oTablePersonalisationButton) {
			this._oTablePersonalisationButton.setVisible(bShowTablePersonalisation);
		}
		return this;
	};

	SmartTable.prototype.setUseVariantManagement = function(bUseVariantManagement) {
		this.setProperty("useVariantManagement", bUseVariantManagement, true);
		if (this._oPersController) {
			this._oPersController.setResetToInitialTableState(!bUseVariantManagement);
		}
		return this;
	};

	SmartTable.prototype.setShowVariantManagement = function(bShowVariantManagement) {
		this.setProperty("showVariantManagement", bShowVariantManagement, true);
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.setVisible(bShowVariantManagement);
			// Hide ToolbarSeparator if VariantManagement button is hidden.
			if (this._oSeparator) {
				this._oSeparator.setVisible(bShowVariantManagement);
			}
		}
		return this;
	};

	SmartTable.prototype.setToolbarStyleClass = function(sStyleClass) {
		this.setProperty("toolbarStyleClass", sStyleClass, true);
		return this;
	};

	SmartTable.prototype.setCustomToolbar = function(oCustomToolbar) {
		this._oCustomToolbar = oCustomToolbar;
		return this;
	};

	SmartTable.prototype.getCustomToolbar = function() {
		return this._oCustomToolbar;
	};

	SmartTable.prototype.setHeader = function(sText) {
		var sOldText = this.getProperty("header"), bPreventUpdateContent;
		this.setProperty("header", sText, true);
		if (this.bIsInitialised && this._oToolbar) {
			// Update Toolbar content to show/hide separator only if text changes from empty to some value -or- from some value to empty
			// else there could be a re-render triggered on the inner table!
			bPreventUpdateContent = (!sOldText === !sText);
			if (!bPreventUpdateContent) {
				this._createToolbarContent();
			} else {
				this._refreshHeaderText();
			}
		}
		this._updateVariantManagement();
		return this;
	};

	SmartTable.prototype.setShowRowCount = function(bShow) {
		this.setProperty("showRowCount", bShow, true);
		this._refreshHeaderText();
		return this;
	};

	SmartTable.prototype.setEditable = function(bEdit) {
		if ((bEdit = !!bEdit) == this.getEditable()) {
			return this;
		}

		this.setProperty("editable", bEdit, true);
		// Update local EditModel's property
		if (this._oEditModel) {
			this._oEditModel.setProperty("/editable", bEdit);
		}
		if (this._oEditButton) {
			this._oEditButton.setIcon(bEdit ? "sap-icon://display" : "sap-icon://edit");
		}
		// update keyboard handling for sap.m.Table
		if (this._isOfType(TableType.ResponsiveTable) && this._oTable?.setKeyboardMode) {
			this._oTable.setKeyboardMode(bEdit ? "Edit" : "Navigation");
		}
		// update visible columns width
		this._updateVisibleColumnsWidthForEdit();
		return this;
	};

	SmartTable.prototype.setDemandPopin = function(bDemandPopin) {
		var bOldValue = this.getDemandPopin();
		if (bOldValue === bDemandPopin) {
			return this;
		}

		this.setProperty("demandPopin", bDemandPopin, true);

		if (this.bIsInitialised) {
			if (bDemandPopin) {
				this._updateColumnsPopinFeature();
			} else {
				this._deactivateColumnsPopinFeature();
			}
		}

		return this;
	};

	/**
	 * sets the header text
	 *
	 * @private
	 */
	SmartTable.prototype._refreshHeaderText = function() {
		if (!this._headerText) {
			return;
		}

		if (!this._oNumberFormatInstance) {
			this._oNumberFormatInstance = NumberFormat.getFloatInstance();
		}

		var iRowCount;
		var sText = this.getHeader();
		this._headerText.setVisible(!!sText);
		if (this.getShowRowCount()) {
			var oRowBinding = this._getRowBinding();
			iRowCount = oRowBinding ? oRowBinding.getCount() : 0;
			if (iRowCount > 0) {
				var sValue = this._oNumberFormatInstance.format(iRowCount);
				sText += " (" + sValue + ")";
			}
		}

		this._headerText.setText(sText);
		this._updateAriaLabelledByInfo();

		if (this._bDataLoadPending === false && this._bUpdateTableAnnouncement) {
			this._bUpdateTableAnnouncement = false;
			TableUtil.announceTableUpdate(this.getHeader(), iRowCount);
		}
	};

	/**
	 * Update the ariaLabelledBy association for the inner table.
	 * Only add the headerText to the ariaLabelledBy association of the table when the headerText control is visible.
	 * @private
	 */
	SmartTable.prototype._updateAriaLabelledByInfo = function() {
		var sTitleId = this._headerText.getId();

		if (this._oTable && this._oTable.addAriaLabelledBy) {
			if (this._headerText.getVisible()) {
				if (this._oTable.getAriaLabelledBy().indexOf(sTitleId) === -1) {
					this._oTable.addAriaLabelledBy(sTitleId);
				}
			} else {
				this._oTable.removeAriaLabelledBy(sTitleId);
			}
		}
	};

	/**
	 * creates the fullscreen button and adds it into toolbar
	 */
	SmartTable.prototype._addFullScreenButton = function() {
		// always remove content first
		if (this._oFullScreenButton) {
			this._oToolbar.removeContent(this._oFullScreenButton);
		}
		if (this.getShowFullScreenButton()) {
			if (!this._oFullScreenButton) {
				this._oFullScreenButton = new OverflowToolbarButton(this.getId() + "-btnFullScreen", {
					press: [
						function() {
							this._toggleFullScreen(!this.bFullScreen);
						}, this
					]
				});
				this._oFullScreenButton.addStyleClass("sapUiCompSmartTableToolbarContent");
				if (Device.system.phone) {
					this._oFullScreenButton.setLayoutData(new OverflowToolbarLayoutData({priority: "NeverOverflow"}));
				}
			}
			this._renderFullScreenButton();
			this._oToolbar.addContent(this._oFullScreenButton);
		}
	};

	/**
	 * creates the copy button and adds it into toolbar
	 */
	SmartTable.prototype._addCopyButton = function() {
		// always remove content first
		var sCopyButtonId = this.getId() + "-btnCopy";
		var oCopyButton = Element.getElementById(sCopyButtonId);
		if (oCopyButton) {
			this._oToolbar.removeContent(oCopyButton);
		}

		var oCopyProvider = this.getCopyProvider();
		if (oCopyProvider && window.isSecureContext) {
			if (!oCopyButton) {
				oCopyButton = oCopyProvider.getCopyButton({id: sCopyButtonId});
				oCopyButton.addStyleClass("sapUiCompSmartTableToolbarContent");
			}
			this._oToolbar.addContent(oCopyButton);
		}
	};

	/**
	 * creates the paste button and adds it into toolbar
	 */
	SmartTable.prototype._addPasteButton = function() {
		// always remove content first
		var sPasteButtonId = this.getId() + "-btnPaste";
		var oPasteButton = Element.getElementById(sPasteButtonId);
		if (oPasteButton) {
			this._oToolbar.removeContent(oPasteButton);
		}
		if (this.getShowPasteButton()) {
			if (!oPasteButton) {
				oPasteButton = new OverflowToolbarButton(sPasteButtonId);
				FESRHelper.setSemanticStepname(oPasteButton, "press", "sc:tbl:paste");
				oPasteButton.addStyleClass("sapUiCompSmartTableToolbarContent");
				sap.ui.require(["sap/m/plugins/PasteProvider"], function(PasteProvider) {
					oPasteButton.addDependent(new PasteProvider({
						pasteFor: this._oTable.getId()
					}));
				}.bind(this));
			}
			oPasteButton.setEnabled(this.getEnablePaste());
			this._oToolbar.addContent(oPasteButton);
		}
	};

	/**
	 * creates the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._createToolbar = function() {
		var oCustomToolbar = null;
		if (!this._oToolbar) {
			oCustomToolbar = this.getCustomToolbar();
			if (oCustomToolbar) {
				this._oToolbar = oCustomToolbar;
			} else {
				this._oToolbar = new OverflowToolbar({
					design: ToolbarDesign[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_ToolbarDesign"})],
					style: this._isOfType(TableType.ResponsiveTable) ? ToolbarStyle.Standard : ToolbarStyle.Clear
				});
				this._oToolbar.addStyleClass("sapUiCompSmartTableToolbar");
				if (this.getToolbarStyleClass()) {
					this._oToolbar.addStyleClass(this.getToolbarStyleClass());
				}
			}
			this._oToolbar.setLayoutData(new FlexItemData({
				shrinkFactor: 0
			}));
		}
	};

	/**
	 * Adjusts the property <code>hiddenInPopin</code> on the inner ResponsiveTable to hide columns based on
	 * SmartTable configuration if <code>showDetailsButton</code> and <code>detailsButtonSetting</code> if
	 * {@param bValue} is set to <code>false</code>.
	 *
	 * Otherwise an empty array is set to show all columns.
	 *
	 * @param {boolean} bValue Indicates if all columns in the popin area are shown
	 * @returns {undefined}
	 * @private
	 */
	SmartTable.prototype.setShowDetails = function(bValue) {
		if (!this._isOfType(TableType.ResponsiveTable) || (bValue === this.getProperty("showDetails"))) {
			return;
		}

		if (this.getUseTablePersonalisation()) {
			this._oPersController._setShowDetails(bValue);
		} else {
			this._setShowDetails(bValue);
		}
	};

	/**
	 * Updates the <code>showDetails</code> property and the hiddenInPopin property of the inner ResponsiveTable.
	 *
	 * @param {boolean} bValue Indicates if all columns in the popin area are shown
	 * @private
	 */
	SmartTable.prototype._setShowDetails = function(bValue) {
		this.setProperty("showDetails", bValue, true);

		if (this.getProperty("showDetails")) {
			this._oTable.setHiddenInPopin([]);
			this._oShowHideDetailsButton?.setSelectedKey("showDetails");
		} else {
			this._oTable.setHiddenInPopin(this._getImportanceToHide());
			this._oShowHideDetailsButton?.setSelectedKey("hideDetails");
		}
	};

	/**
	 * Helper function to get the importance of the columns that should be hidden based on
	 * SmartTable configuration.
	 *
	 * @returns {array} sap.ui.core.Priority[]
	 * @private
	 */
	SmartTable.prototype._getImportanceToHide = function() {
		var aDetailsButtonSetting = this.getDetailsButtonSetting() || [];
		var aImportanceToHide = [];

		if (aDetailsButtonSetting.length) {
			aImportanceToHide = aDetailsButtonSetting;
		} else {
			aImportanceToHide = Device.system.phone ? ["Low", "Medium"] : ["Low"];
		}

		return aImportanceToHide;
	};

	/**
	 * Toggles between fullscreen and normal view mode
	 *
	 * @param {boolean} bValue - the new value of FullScreen
	 * @param {boolean} bForced - whether setting FullScreen is forced
	 * @private
	 */
	SmartTable.prototype._toggleFullScreen = function(bValue, bForced) {
		if (!this._oFullScreenButton || (bValue === this.bFullScreen && !bForced)) {
			return;
		}

		this.bFullScreen = bValue;

		FullScreenUtil.toggleFullScreen(this, this.bFullScreen, this._oFullScreenButton, this._toggleFullScreen);

		this._renderFullScreenButton();
		// Fire the fullScreen Event
		this.fireFullScreenToggled({
			fullScreen: bValue
		});
	};

	/**
	 * Renders the look and feel of the full screen button
	 */
	SmartTable.prototype._renderFullScreenButton = function() {
		var resourceB = Library.getResourceBundleFor("sap.ui.comp"), sText;

		sText = this.bFullScreen ? resourceB.getText("CHART_MINIMIZEBTN_TOOLTIP") : resourceB.getText("CHART_MAXIMIZEBTN_TOOLTIP");
		this._oFullScreenButton.setTooltip(sText);
		this._oFullScreenButton.setText(sText);
		this._oFullScreenButton.setIcon(this.bFullScreen ? "sap-icon://exit-full-screen" : "sap-icon://full-screen");
	};

	/**
	 * creates the toolbar content
	 *
	 * @private
	 */
	SmartTable.prototype._createToolbarContent = function() {
		if (!this._oToolbar) {
			this._createToolbar();
		}

		// insert the items in the custom toolbar in reverse order => insert always at position 0
		this._addVariantManagementToToolbar();
		this._addSeparatorToToolbar();
		this._addHeaderToToolbar();

		// add spacer to toolbar
		this._addSpacerToToolbar();

		// First copy and paste button, afterwards show Display/Edit icon, then Personalisation and finally Excel Export
		this._addCopyButton();
		this._addPasteButton();
		this._addEditTogglableToToolbar();
		this._addShowHideDetailsButton();
		this._addTablePersonalisationToToolbar();
		this._addExportToExcelToToolbar();
		this._addFullScreenButton();

		this._bToolbarInsertedIntoItems = true;
		this._placeToolbar();
	};

	/**
	 * Applies a custom order on the actions in a custom toolbar.
	 *
	 * @private
	 */
	SmartTable.prototype._applyToolbarContentOrder = function() {
		if (!this.bIsInitialised || !this.getCustomToolbar()) {
			return;
		}

		var oOrderSettings = this.data("p13nData_ToolbarContentMove");
		if (!oOrderSettings) {
			return;
		}

		oOrderSettings = FlexUtils.parseChangeContent(oOrderSettings, function(oParsedSettings){
			this.data("p13nData_ToolbarContentMove", oParsedSettings);
		}.bind(this));

		if (!oOrderSettings || !oOrderSettings.order) {
			return;
		}

		var oAppComponent = FlexUtils.getAppComponentForControl(this) || null;

		var iIndex = -1;
		var aIds = oOrderSettings.order;
		var aFound = [];
		var aToolbarContent = this._oToolbar.getContent();
		for (let j = 0; j < aIds.length; j++) {
			for (let i = 0; i < aToolbarContent.length; i++) {
				if (aIds[j].id === FlexUtils.getSelectorForControl(aToolbarContent[i], oAppComponent)?.id) {
					if (iIndex < 0 || iIndex > i) {
						iIndex = i;
					}
					aFound.push(aToolbarContent[i]);
				}
			}
		}

		for (let i = 0; i < aFound.length; i++) {
			this._oToolbar.removeContent(aFound[i]);
			this._oToolbar.insertContent(aFound[i], iIndex);
			iIndex++;
		}
	};

	/**
	 * Places the toolbar in the right place
	 */
	SmartTable.prototype._placeToolbar = function() {
		if (!this.getPlaceToolbarInTable()) {
			this.insertItem(this._oToolbar, 0);
		} else if (this._isOfType(TableType.ResponsiveTable)) {
			this._oTable.setHeaderToolbar(this._oToolbar);
		} else {
			this._oTable.addExtension(this._oToolbar);
		}
	};

	/**
	 * Returns the <code>Toolbar</code> instance used inside the <code>SmartTable</code> control.
	 *
	 * @returns {sap.m.Toolbar} The <code>Toolbar</code> instance
	 * @since 1.56
	 * @public
	 */
	SmartTable.prototype.getToolbar = function() {
		return this._oToolbar;
	};

	/**
	 * Adds the button to change between edit and read only mode
	 *
	 * @private
	 */
	SmartTable.prototype._addEditTogglableToToolbar = function() {
		var sButtonLabel;
		// always remove content first
		if (this._oEditButton) {
			this._oToolbar.removeContent(this._oEditButton);
		}
		if (this.getEditTogglable()) {
			if (!this._oEditButton) {
				sButtonLabel = Library.getResourceBundleFor("sap.ui.comp").getText("TABLE_EDITTOGGLE_TOOLTIP");
				this._oEditButton = new OverflowToolbarButton(this.getId() + "-btnEditToggle", {
					icon: this.getEditable() ? "sap-icon://display" : "sap-icon://edit",
					text: sButtonLabel,
					tooltip: sButtonLabel,
					press: [
						function() {
							var bEditable = this.getEditable();
							// toggle property editable and set it on the smart table
							bEditable = !bEditable;
							this.setEditable(bEditable, true);
							// notify any listeners
							this.fireEditToggled({
								editable: bEditable
							});
						}, this
					]
				});
				this._oEditButton.addStyleClass("sapUiCompSmartTableToolbarContent");
				FESRHelper.setSemanticStepname(this._oEditButton, "press", "sc:tbl:edit");
			}
			this._oToolbar.addContent(this._oEditButton);
		}
	};

	/**
	 * adds the header line to the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._addHeaderToToolbar = function() {
		// always remove content first
		if (this._headerText) {
			this._oToolbar.removeContent(this._headerText);
		}

		if (!this._headerText) {
			this._headerText = new Title(this.getId() + "-header");
			this._headerText.addStyleClass("sapUiCompSmartTableHeader");
			this._headerText.addStyleClass("sapUiCompSmartTableToolbarContent");
			this._headerText.setLevel(this.getHeaderLevel());
			this._headerText.setTitleStyle(this.getHeaderStyle() || TitleLevel[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_HeaderStyle"})]);
		}

		this._refreshHeaderText();
		this._oToolbar.insertContent(this._headerText, 0);
	};

	/**
	 * adds a separator between header and variantmanagement to the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._addSeparatorToToolbar = function() {
		// always remove content first
		if (this._oSeparator) {
			this._oToolbar.removeContent(this._oSeparator);
		}
		if (this.getHeader() && this.getUseVariantManagement() && this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			if (!this._oSeparator) {
				this._oSeparator = new ToolbarSeparator(this.getId() + "-toolbarSeperator");
				// Hide ToolbarSeparator if VariantManagement button is hidden
				if (!this.getShowVariantManagement()) {
					this._oSeparator.setVisible(false);
				}
				this._oSeparator.addStyleClass("sapUiCompSmartTableToolbarContent");
			}
			this._oToolbar.insertContent(this._oSeparator, 0);
		}

		if (this._oToolbar) {
			this._oToolbar.addStyleClass("sapMTBHeader-CTX");
		}
	};

	/**
	 * adds the VarientManagement to the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._addVariantManagementToToolbar = function() {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			// always remove content first
			this._oToolbar.removeContent(this._oVariantManagement);
			if (this.getUseVariantManagement()) {
				this._oToolbar.insertContent(this._oVariantManagement, 0);
				this._oVariantManagement.addStyleClass("sapUiCompSmartTableToolbarContent");
				this._oVariantManagement.addStyleClass("sapUiCompSmartTableToolbarContentAllowAdaption");
				if (!this._oVariantManagement.isPageVariant()) {
					this._oVariantManagement.setVisible(this.getShowVariantManagement());
				}
			}
		}
	};

	/**
	 * adds a spacer to the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._addSpacerToToolbar = function() {
		var bFoundSpacer = false, aItems = this._oToolbar.getContent(), i, iLength;
		if (aItems) {
			iLength = aItems.length;
			i = 0;
			for (i; i < iLength; i++) {
				if (aItems[i] instanceof ToolbarSpacer) {
					bFoundSpacer = true;
					break;
				}
			}
		}

		if (!bFoundSpacer) {
			this._oToolbar.addContent(new ToolbarSpacer(this.getId() + "-toolbarSpacer").addStyleClass("sapUiCompSmartTableToolbarContent"));
		}
	};

	SmartTable.prototype._createShowHideDetailsButton = function() {
		var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
		this._oShowHideDetailsButton = new SegmentedButton(this.getId() + "-btnShowHideDetails", {
			visible: false,
			items: [
				new SegmentedButtonItem({
					icon: "sap-icon://detail-more",
					key: "showDetails",
					tooltip: oResourceBundle.getText("TABLE_SHOWDETAILS_TEXT"),
					press: [
						function() {
							this.setShowDetails(true);
						}, this
					]
				}),
				new SegmentedButtonItem({
					icon: "sap-icon://detail-less",
					key: "hideDetails",
					tooltip: oResourceBundle.getText("TABLE_HIDEDETAILS_TEXT"),
					press: [
						function() {
							this.setShowDetails(false);
						}, this
					]
				})
			]
		});
		this._oShowHideDetailsButton.addStyleClass("sapUiCompSmartTableToolbarContent");
		this._oShowHideDetailsButton.setSelectedKey("hideDetails");
	};

	/**
	 * Add Show / Hide Details button to the table toolbar
	 * if SmartTable property 'showDetailsButton' is set to {true}.
	 *
	 * @private
	 */
	SmartTable.prototype._addShowHideDetailsButton = function() {
		// always remove content first
		if (this._oShowHideDetailsButton) {
			this._oToolbar.removeContent(this._oShowHideDetailsButton);
		}
		if (this.getShowDetailsButton() && this._isOfType(TableType.ResponsiveTable)) {
			if (!this._oShowHideDetailsButton) {
				this._createShowHideDetailsButton();
			}
			this._oToolbar.addContent(this._oShowHideDetailsButton);
		}
	};

	/**
	 * adds the Table Personalisation button to the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._addTablePersonalisationToToolbar = function() {
		var sButtonLabel;
		// always remove content first
		if (this._oTablePersonalisationButton) {
			this._oToolbar.removeContent(this._oTablePersonalisationButton);
		}
		if (this.getUseTablePersonalisation()) {
			if (!this._oTablePersonalisationButton) {
				sButtonLabel = Library.getResourceBundleFor("sap.ui.comp").getText("TABLE_PERSOBTN_TOOLTIP");
				this._oTablePersonalisationButton = new OverflowToolbarButton(this.getId() + "-btnPersonalisation", {
					icon: "sap-icon://action-settings",
					text: sButtonLabel,
					tooltip: sButtonLabel,
					press: [
						function(oEvent) {
							if (!this._bPersDialogOpen) {
								this._bPersDialogOpen = true;
								this._bMissingColumnsCreated = true;
								this._oPersController.openDialog();
							}
						}, this
					]
				});

				ShortcutHintsMixin.addConfig(
					this._oTablePersonalisationButton, {
						messageBundleKey: Device.os.macintosh
							? "SMARTTABLE_SHORTCUT_SHOW_SETTINGS_MAC" : "SMARTTABLE_SHORTCUT_SHOW_SETTINGS"
					},
				this);

				this._oTablePersonalisationButton.addStyleClass("sapUiCompSmartTableToolbarContent");
				this._oTablePersonalisationButton.setVisible(this.getShowTablePersonalisation());
				FESRHelper.setSemanticStepname(this._oTablePersonalisationButton, "press", "sc:tbl:p13n");
			}
			this._oToolbar.addContent(this._oTablePersonalisationButton);
		}
	};

	/**
	 * Trigger export using Gateway service.
	 *
	 * @deprecated As of version 1.120
	 * @private
	 */
	SmartTable.prototype._triggerGWExport = function() {
		var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
		var fDownloadXls = function() {
			var oRowBinding = this._getRowBinding();
			var sUrl = oRowBinding.getDownloadUrl("xlsx");
			sUrl = this._removeExpandParameter(sUrl);
			var mExportSettings = {
				url: sUrl
			};
			// Fire event to enable export url manipulation
			this.fireBeforeExport({
				exportSettings: mExportSettings
			});
			openWindow(mExportSettings.url);
		}.bind(this);

		var oRowBinding = this._getRowBinding();
		var iRowCount = oRowBinding ? oRowBinding.getCount() : 0;

		if (iRowCount > 10000) {
			MessageBox.confirm(oResourceBundle.getText("DOWNLOAD_CONFIRMATION_TEXT", [iRowCount]), {
				actions: [
					MessageBox.Action.YES, MessageBox.Action.NO
				],
				emphasizedAction: MessageBox.Action.YES,
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.YES) {
						fDownloadXls();
					}
				}
			});
		} else {
			fDownloadXls();
		}
	};

	/**
	 * Adds the Export to Excel button to the toolbar
	 *
	 * @private
	 */
	SmartTable.prototype._addExportToExcelToToolbar = function() {
		// always remove content first
		if (this._oExportButton) {
			this._oToolbar.removeContent(this._oExportButton);
		}

		if (!this.getEnableExport()) {
			return;
		}

		if (!this._oExportButton) {
			var sButtonId = this.getId() + "-btnExcelExport";
			var sIconUrl = "sap-icon://excel-attachment";
			var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");

			if (this.getExportType().indexOf("UI5Client") > -1) {
				this._oExportButton = this._createClientExportButton(sButtonId, sIconUrl);

			} else if (this._bTableSupportsExcelExport && this.getExportType() == "GW") {
				var sButtonLabel;

				sButtonLabel = oResourceBundle.getText("TABLE_EXPORT_TEXT");

				this._oExportButton = new OverflowToolbarButton(sButtonId, {
					icon: sIconUrl,
					text: sButtonLabel,
					tooltip: sButtonLabel,
					press: [
						this._triggerGWExport, this
					]
				});
				FESRHelper.setSemanticStepname(this._oExportButton, "press", "OI:QE");
			}

			this._setExcelExportEnableState();
			if (this._oExportButton) {
				this._oExportButton.addStyleClass("sapUiCompSmartTableToolbarContent");
			}
		}
		this._oToolbar.addContent(this._oExportButton);
	};

	/**
	 * This function creates a menuButton that provides the export
	 * functionality in the SmartTable.
	 *
	 * *** IMPORTANT ***
	 * All changes to this method need to be in sync with the
	 * corresponding functionality in the sap.ui.mdc.Table
	 *
	 * @param {string} sButtonId - The ID that gets applied to the button
	 * @param {string} sIconUrl -
	 * @return {sap.m.OverflowToolbarMenuButton} - OverflowToolbarMenuButton that provides the export functionality
	 * @private
	 */
	SmartTable.prototype._createClientExportButton = function(sButtonId, sIconUrl) {
		var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
		var mDefaultExportSettings = {fileName: this.getHeader()};

		if (!this._cachedExcelSettings) {
			this._cachedExcelSettings = mDefaultExportSettings;
		}
		var oMenuButton = new OverflowToolbarMenuButton(sButtonId, {
			icon: sIconUrl,
			tooltip: oResourceBundle.getText("TABLE_EXPORT_TEXT"),
			type: ButtonType[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_ExportButton"})],
			buttonMode: MenuButtonMode.Split,
			useDefaultActionOnly: true,
			text: oResourceBundle.getText("QUICK_EXPORT"),
			defaultAction: [
				function() {
					this._triggerUI5ClientExport();
				}, this
			],
			menu: [
				new Menu({
					items: [
						new MenuItem({
							text: oResourceBundle.getText("QUICK_EXPORT"),
							press: [
								function() {
									this._triggerUI5ClientExport();
								}, this
							]
						}),
						new MenuItem({
							text: oResourceBundle.getText("EXPORT_WITH_SETTINGS"),
							press: [
								function() {
									this._triggerUI5ClientExport(true);
								},
								this
							]
						})
					]
				})
			]
		});

		FESRHelper.setSemanticStepname(oMenuButton, "defaultAction", "OI:QE");
		FESRHelper.setSemanticStepname(oMenuButton.getMenu().getItems()[0], "press", "OI:QE");
		FESRHelper.setSemanticStepname(oMenuButton.getMenu().getItems()[1], "press", "OI:EXP:SETTINGS");

		ShortcutHintsMixin.addConfig(oMenuButton._getButtonControl(), {
				addAccessibilityLabel: true,
				messageBundleKey: Device.os.macintosh
					? "SMARTTABLE_SHORTCUT_EXPORT_TO_EXCEL_MAC" : "SMARTTABLE_SHORTCUT_EXPORT_TO_EXCEL"
			},
			this);

		return oMenuButton;
	};

	SmartTable.prototype.onkeydown = function(oEvent) {
		if (oEvent.isMarked()) {
			return;
		}

		if ((oEvent.metaKey || oEvent.ctrlKey) && oEvent.shiftKey && oEvent.which === KeyCodes.E) {
			// CTRL (or Cmd) + SHIFT + E key combination to open the Export settings dialog
			if (this.getEnableExport() && this.getExportType().indexOf("UI5Client") > -1 && this._oExportButton && this._oExportButton.getEnabled()) {
				this._triggerUI5ClientExport(true);
				// Mark the event to ensure that parent handlers (e.g. FLP) can skip their processing if needed. Also prevent potential browser defaults.
				oEvent.setMarked();
				oEvent.preventDefault();
			}
		} else if ((oEvent.metaKey || oEvent.ctrlKey) && oEvent.which === KeyCodes.COMMA) {
			// CTRL (or Cmd) + COMMA key combination to open the table personalisation dialog
			if (this.getUseTablePersonalisation() && this._oTablePersonalisationButton && this._oTablePersonalisationButton.getVisible()) {
				this._oPersController.openDialog();
				// Mark the event to ensure that parent handlers (e.g. FLP) can skip their processing if needed. Also prevent potential browser defaults
				// (e.g. Cmd+, opens browser settings on Mac).
				oEvent.setMarked();
				oEvent.preventDefault();
			}
		}
	};

	SmartTable.prototype.onThemeChanged = function(){
		if (this._oExportButton) {
			const buttonType = ButtonType[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_ExportButton"})];
			this._oExportButton.setType(buttonType);
		}

		if (this._oToolbar) {
			const sToolBarDesign = ToolbarDesign[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_ToolbarDesign"})];
			this._oToolbar.setDesign(sToolBarDesign);
		}

		if (this._headerText && !this.getHeaderStyle()) {
			const sHeaderStyle = TitleLevel[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_HeaderStyle"})];
			this._headerText.setTitleStyle(sHeaderStyle);
			this._updateVariantManagement();
		}
	};

	/**
	 * Returns the label/header text of the column
	 *
	 * @param {Object|string} oColumn column object or column key
	 * @returns {string|null} column label/header text. Returns null if no column or header/label text is available.
	 * @private
	 */
	SmartTable.prototype._getColumnLabel = function(oColumn) {
		var sFieldName, oLabel;

		if (typeof oColumn === "string") {
			sFieldName = oColumn;
			oColumn = this._getColumnByKey(sFieldName);
		}

		if (!oColumn) {
			var sLabel = this._oTableProvider.getFieldLabel(this.getEntitySet(), sFieldName);

			if (sLabel && sLabel.match(/{@i18n>.+}/gi)) { // see also SmartLabel and SmartFilterBar
				var oResourceModel = this.getModel("@i18n");
				if (oResourceModel && oResourceModel.isA("sap.ui.model.resource.ResourceModel")) {
					return oResourceModel.getProperty(sLabel.slice(1, -1).substring(6)) || sLabel;
				}
			}

			if (!sLabel) {
				var oAdditionalProperty = this._mFieldMetadataByKey[sFieldName];
				if (oAdditionalProperty) {
					sLabel = oAdditionalProperty.label;
				}
			}

			return sLabel;
		}

		if (oColumn.getLabel) {
			oLabel = oColumn.getLabel();
		} else if (oColumn.getHeader) {
			oLabel = oColumn.getHeader();
		}

		return (oLabel && oLabel.getText) ? oLabel.getText() : null;
	};

	/**
	 * Returns the leadingProperty  of the column
	 *
	 * @param {Object} oColumn column object
	 * @param {Object} [oColumnP13nData] the corresponding p13nData settings of the column. When not given, it will be determined from the column.
	 * @returns {string} leadingProperty
	 * @private
	 */
	SmartTable.prototype._getColumnLeadingProperty = function(oColumn, oColumnP13nData) {
		var sLeadingProperty;
		if (oColumn.getLeadingProperty) {
			sLeadingProperty = oColumn.getLeadingProperty();
		}

		if (!sLeadingProperty) {
			var oColumnData = oColumnP13nData || oColumn.data("p13nData");
			if (oColumnData) {
				sLeadingProperty = oColumnData["leadingProperty"];
			}
		}

		return sLeadingProperty;
	};

	/**
	* Allows to manually trigger the default export without the Export As features and resolves even if <code>preventDefault()</code> is called in the <code>beforeExport</code> event if no error is thrown.<br>
	* <b>Note:</b><br>
	* <ul>
	* <li>Export must be enabled by setting the property <code>enableExport</code> to <code>true</code></li>
	* <li>The "sap.ui.export" library must be available.</li>
	* <li>The table must have at least one visible column.</li>
	* <li>Resolves even if <code>preventDefault()</code> is called in the <code>beforeExport</code> event if no error is thrown.</li>
	* </ul>
	*
	* @ui5-restricted sap.ux.eng.fioriai.reuse
	* @returns {Promise} Promise that resolves when the export is completed, rejects if the table does not have columns, the export is disabled or the sap.ui.export library is unavailable.
	* @throws {Error} If the export is disabled
	* @private
	*/
	SmartTable.prototype.triggerExport = function() {
		if (!this.getEnableExport()) {
			return Promise.reject("Export is not enabled for this table - " + this.getId());
		}

		return this._triggerUI5ClientExport();
	};

	/**
	 * Triggers export via "sap.ui.export"/"Document Export Services" export functionality
	 *
	 * @param {boolean} bExportAs controls whether the regular export or the Export As dialog should be called
	 * @returns {Promise} Promise that resolves when the export is completed
	 * @private
	 */
	SmartTable.prototype._triggerUI5ClientExport = async function(bExportAs) {
		const aSheetColumns = this._createExportColumnConfiguration();

		// If no columns exist, show message and return without exporting
		if (!aSheetColumns || !aSheetColumns.length) {
			const sErrorMessage = Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_NO_COLS_EXPORT");

			MessageBox.error(sErrorMessage, {
				styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : ""
			});
			return Promise.reject(sErrorMessage);
		}

		const oRowBinding = this._getRowBinding();
		const fnGetLabel = this._getColumnLabel.bind(this);
		const mExportSettings = {
			workbook: {
				columns: aSheetColumns,
				context: {
					title: this.getHeader()
				}
			},
			dataSource: oRowBinding,
			fileName: this.getHeader()
		};

		const fnEventHandler = (oEvent) => {

			/* Preprocess filter settings */
			var aFilters = oEvent.getParameter("filterSettings");

			aFilters.forEach((oFilter) => {
				var sPropertyName = oFilter.getProperty();
				var oColumn = this._getColumnByKey(sPropertyName) || this._getColumnFromP13nMap(sPropertyName);

				oFilter.setLabel(fnGetLabel(sPropertyName));

				if (oColumn?.data("p13nData")) {
					oFilter.setType(oColumn.data("p13nData").typeInstance);
				}
			});

			const bExecuteDefaultAction = this.fireBeforeExport({
				exportSettings: oEvent.getParameter("exportSettings"),
				userExportSettings: oEvent.getParameter("userExportSettings"),
				filterSettings: aFilters
			});

			if (!bExecuteDefaultAction) {
				oEvent.preventDefault();
			}
		};

		var oHandler, oExportCapabilities, fnExport;

		if (!this._oExportHandler) {
			const ExportHandler = await this._loadExportHandler();

			oExportCapabilities = this._oTableProvider.getExportCapabilities(this.getExportType());
			oHandler = new ExportHandler(oExportCapabilities);

			oHandler.attachBeforeExport(fnEventHandler);

			this._oExportHandler = oHandler;
		}

		fnExport = (bExportAs ? this._oExportHandler.exportAs : this._oExportHandler.export).bind(this._oExportHandler);

		return fnExport(mExportSettings, fnGetLabel);
	};

	/**
	 * Creates an instance of the ExportHandler class asynchronously.
	 *
	 * @returns {Promise} Promise that resolves with the ExportHandler instance and rejects if the class cannot be loaded
	 * @private
	 */
	SmartTable.prototype._loadExportHandler = function() {
		return Library.load({ name: "sap.ui.export" }).then(() => {
			return new Promise((resolve, reject) => {
				sap.ui.require(["sap/ui/export/ExportHandler"], (ExportHandler) => {
					if (ExportHandler) {
						resolve(ExportHandler);
					} else {
						reject(new Error("Failed to load ExportHandler"));
					}
				});
			});
		}).catch(() => {
			const oError = Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_ERROR_MISSING_EXPORT_LIBRARY");
			MessageBox.error(oError);
			throw new Error(oError + " - " + this.getId());
		});
	};

	SmartTable.prototype._createExportColumnConfiguration = function() {
		const aSheetColumns = [];
		const vUseUTCDateTime = this.data("useUTCDateTime");
		let bUtcDefault;

		if (vUseUTCDateTime != null) {
			if (typeof vUseUTCDateTime === "string") {
				bUtcDefault = vUseUTCDateTime === "true";
			} else if (typeof vUseUTCDateTime === "boolean") {
				bUtcDefault = vUseUTCDateTime;
			}
		}

		// The parameter will be ignored in case of sap.ui.table.Table and ensures the correct order in case of sap.m.Table
		const aColumns = this._oTable.getColumns(this._isOfType(TableType.ResponsiveTable));

		aColumns.filter((oColumn) => oColumn.getVisible()).forEach((oColumn) => {
			const oExportColumn = this._getExportColumnConfiguration(oColumn, bUtcDefault);

			if (oExportColumn) {
				aSheetColumns.push(oExportColumn);
			}
		});

		return aSheetColumns;
	};


	SmartTable.prototype._getExportColumnConfiguration = function(oColumn, bUtc) {
		let sProperty = this._getColumnLeadingProperty(oColumn);

		if (Array.isArray(sProperty)) {
			sProperty = sProperty[0];
		}

		if (!sProperty) {
			return undefined;
		}

		const oP13nData = oColumn.data("p13nData");
		const sLabel = this._getColumnLabel(oColumn);
		const nWidth = oColumn.getWidth().toLowerCase() || oP13nData.width;

		let oModelType = oP13nData.typeInstance;
		let sType = oP13nData.type === "numeric" ? "Number" : oP13nData.type;
		let sInputFormat, sTemplate, sTimezone, sUnitProperty;

		if (oP13nData.unit) {
			sType = oP13nData.isCurrency ? "Currency" : "Number";
			sUnitProperty = oP13nData.unit;
		} else if (oModelType && (oModelType.isA("sap.ui.comp.odata.type.FiscalDate") || oModelType.isA("sap.ui.comp.odata.type.CalendarDate"))) {
			var oFormatter = oModelType.getFormatter();

			// Provides template with different placeholders
			sTemplate = oFormatter.getTemplate().replace(/\$(\d)/g, (match, group) => `{${parseInt(group) - 1}}`);
			sInputFormat = oFormatter.getRegExPattern().toString().slice(1, -1);
			sType = "String";

		} else if (sType != "date" && ODataType.isDateOrTime(oP13nData.edmType)) {

			// set type as expected by excel for OData specific Date/Time fields
			sType = ODataType.getTypeName(oP13nData.edmType);
			if (sType === "DateTimeOffset") {
				sType = "DateTime";
				bUtc = false;

				if (oP13nData.timezone) {
					sTimezone = oP13nData.timezone;
				} else if (this._aExistingColumns.includes(sProperty) && typeof oP13nData.additionalProperty === "string") {
					[sTimezone] = oP13nData.additionalProperty.split(",");
				}
			}
		} else if (sType === "stringdate") {
			sType = "Date";
			sInputFormat = "YYYYMMDD";
		} else if (sType === "boolean") {
			sType = "Boolean";
			oModelType = oModelType ? oModelType : ODataType.getType(oP13nData.edmType);
		} else if (oP13nData.description && oP13nData.displayBehaviour !== "idOnly") {

			// check this after unit/date as at times unit, date other fields too might have a description (BCP: 0020751294 0000453653 2018)
			// Exception is for numeric fields, where we now support description handling (BCP: 1970521945)
			sType = "String";
			sTemplate = FormatUtil.getFormattedExpressionFromDisplayBehaviour(oP13nData.displayBehaviour, "{0}", "{1}");

			if (oP13nData.displayBehaviour === "descriptionOnly") {
				sProperty = oP13nData.description;
			} else {
				sProperty = [sProperty, oP13nData.description];
			}

		} else if (oP13nData.isDigitSequence) {
			sType = "Number";
		} else if (oP13nData.isTimezone) {
			sType = "Timezone";
		} else if (sType) {
			// Ensure proper case sensitive type assignment for unhandled types
			sType = sType.slice(0, 1).toUpperCase() + sType.slice(1);
		} else {
			sType = "String";
		}

		return {
			columnId: oColumn.getId(),
			property: sProperty,
			type: sType,
			inputFormat: sInputFormat,
			label: sLabel,
			width: nWidth,
			textAlign: oColumn.getHAlign(),
			template: sTemplate,
			trueValue: (sType === "Boolean" && oModelType) ? oModelType.formatValue(true, "string") : undefined,
			falseValue: (sType === "Boolean" && oModelType) ? oModelType.formatValue(false, "string") : undefined,
			unitProperty: sUnitProperty,
			displayUnit: sType === "Currency" ? true : undefined,
			precision: oP13nData.precision,
			scale: oP13nData.scale,
			autoScale: sType === "Number",
			utc: (sType === "DateTime" && bUtc != null)  ? bUtc : undefined,
			timezoneProperty: sTimezone
		};
	};

	/**
	 * removes the given Url's expand parameter
	 *
	 * @param {string} sUrl the original url
	 * @private
	 * @returns {string} the resolved url string
	 */
	SmartTable.prototype._removeExpandParameter = function(sUrl) {
		var sFinalUrl = sUrl.replace(new RegExp("([\\?&]\\$expand=[^&]+)(&?)"), function(result, match1, match2) {
			return match2 ? match1.substring(0, 1) : "";
		});
		return sFinalUrl;
	};

	/**
	 * disables the export to excel button if no data is present, otherwise enables it
	 *
	 * @private
	 */
	SmartTable.prototype._setExcelExportEnableState = function() {
		this._oExportButton?.setEnabled(!this._bDataLoadPending && TableUtil.isExportable(this._getRowBinding()));
	};

	/**
	 * creates the personalization controller if not yet done
	 *
	 * @private
	 */
	SmartTable.prototype._createPersonalizationController = function() {
		if (this._oPersController || !this.getUseTablePersonalisation()) {
			return;
		}

		var oSettings = this._oP13nDialogSettings;

		oSettings = this._setIgnoreFromPersonalisationToSettings(oSettings);
		oSettings = oSettings || {};

		if (this._isOfType(TableType.TreeTable)) {
			//The first column of the TreeTable should never be visible in p13n, as the reordering/toggling makes no sense
			oSettings.stableColumnKeys = [];
			oSettings.stableColumnKeys.push(this._aColumnKeys[0]);
		}

		//Provide a Callback for MessageStrip creation
		if (this._bIsFilterPanelEnabled) {
			oSettings.filter = oSettings.filter ? oSettings.filter : {};
			oSettings.filter.createMessageStrip = this._getP13nFilterMessageStrip.bind(this);
		}

		this._oPersController = new Controller(this.getId() + "-persoController", {
			table: this._oTable,
			columnKeys: this._aColumnKeys,
			redundantColumnKeys: SmartTableUtil.getRedundantProperties(this),
			setting: oSettings,
			resetToInitialTableState: !this.getUseVariantManagement(),
			beforePotentialTableChange: [
				this._beforePersonalisationModelDataChange, this
			],
			afterPotentialTableChange: [
				this._afterPersonalisationModelDataChange, this
			],
			afterP13nModelDataChange: [
				this._personalisationModelDataChange, this
			],
			requestColumns: [
				this._personalisationRequestColumns, this
			]
		});

		this._oPersController.attachDialogAfterClose(function(oEvent) {
			if (this._fGetDataForKeyUser) {
				if (oEvent.getParameter("cancel")) {
					this._fGetDataForKeyUser([]);
				}
				this._cleanUpKeyUser();
			}
			this._bPersDialogOpen = false;
		}.bind(this));

		if (this._aDeactivatedColumns.length > 0) {
			this._oPersController.addToSettingIgnoreColumnKeys(this._aDeactivatedColumns);
		}
	};

	/**
	 * Returns the associated SmartVariantManagement control.
	 *
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagement} the associated SmartVariantManagement control, if any.
	 */
	SmartTable.prototype.getVariantManagement = function() {
		return this._oVariantManagement;
	};

	/**
	 * Opens the View Settings Dialog for the UI adaptation.
	 * <br><b>Note:</b> This function must only be used internally during the UI adaptation.
	 *
	 * @private
	 * @ui5-restricted sap.ui.rta
	 *
	 * @param {string} sStyleClass indicating the ui adaption area
	 * @param {function} fCallBack will be executed, once the dialog closes.
	 * @returns {Promise} Promise that resolves after the dialog has been opened
	 */
	SmartTable.prototype.openDialogForKeyUser = function(sStyleClass, fCallBack) {
		this._fGetDataForKeyUser = fCallBack;
		return this._oPersController.openDialog({showReset: false, useAvailablePanels: true, styleClass: sStyleClass})
			.then(function(oDialog) {
				if (oDialog) {
					return Library.load({
						name: "sap.ui.mdc"
					}).then(function() {
						sap.ui.require([
							"sap/ui/mdc/p13n/P13nBuilder"
						], function(P13nBuilder) {
							return P13nBuilder.addRTACustomFieldButton(oDialog, this);
						}.bind(this));
					}.bind(this));
				}
			}.bind(this));
	};

	SmartTable.prototype._cleanUpKeyUser = function() {
		this._fGetDataForKeyUser = null;
	};

	SmartTable.prototype._createKeyUserChange = function() {

		return [{
			selectorControl: this._oVariantManagement._getPersoController(),
			changeSpecificData: {
				changeType: "variantContent",
				content: {
					key: this._oVariantManagement.getSelectionKey(),
					persistencyKey: this.getPersistencyKey(),
					content: this.fetchVariant()
				}
			}
		}];
	};

	/**
	 * adds the ignoreFromPersonalisation fields to the given setting
	 *
	 * @param {object} oSettings the former settings object
	 * @private
	 * @returns {object} the changed settings object
	 */
	SmartTable.prototype._setIgnoreFromPersonalisationToSettings = function(oSettings) {
		var aIgnoreFields = PersonalizationUtil.createArrayFromString(this.getIgnoreFromPersonalisation());
		if (aIgnoreFields.length) {
			if (!oSettings) {
				oSettings = {};
			}

			var fSetArray = function(sSubName) {
				if (!oSettings[sSubName]) {
					oSettings[sSubName] = {};
				}
				oSettings[sSubName].ignoreColumnKeys = aIgnoreFields;
			};

			fSetArray("filter");
			fSetArray("sort");
			fSetArray("group");
			fSetArray("columns");
		}
		return oSettings;
	};

	/**
	 * returns the row/items binding of the currently used internal table
	 *
	 * @private
	 * @returns {sap.ui.model.Binding} the row/items binding
	 */
	SmartTable.prototype._getRowBinding = function() {
		return this._oTable?.getBinding(this._sAggregation);
	};

	/**
	 * The entity set name from OData metadata, with which the table should be bound to
	 *
	 * @param {string} sEntitySetName The entity set
	 * @returns {object} the control instance
	 * @public
	 */
	SmartTable.prototype.setEntitySet = function(sEntitySetName) {
		if (this.getEntitySet() === sEntitySetName) {
			return this;
		}

		if (this._bInitialising) {
			throw new Error("entitySet changed while SmartTable control was initializing - " + this.getId());
		}

		this.setProperty("entitySet", sEntitySetName, true);
		this._initialiseMetadata();
		return this;
	};

	/**
	 * Initialises the OData metadata necessary to create the table
	 *
	 * @param {object} oEvt The event object
	 * @private
	 */
	SmartTable.prototype._initialiseMetadata = function(oEvt) {
		var that = this, oControl = that;
		// If this is called as a result of modelContextChange event -- the event may be triggered by a clone.
		// E.g. when SmartTable is used inside another bound aggregation e.g. TabContainer items
		// Hence trigger the call on the "right" clone instance and not "this"/the original control that registered the event!
		if (oEvt) {
			oControl = oEvt.getSource();
		}
		if (!oControl.bIsInitialised) {
			// passing complexSelectors for waitForFlexChanges since for the inner table we want to filter the changeTypes
			// wait for all changes for the SmartTable control and wait for "addXML", "addXMLAtExtensionPoint" change types for the inner table
			ODataModelUtil.handleModelInit(oControl, oControl._onMetadataInitialised, [
				{
					selector: oControl
				},
				{
					selector: oControl._oTable,
					changeTypes: ["addXML", "addXMLAtExtensionPoint"]
				}
			]);
		}
	};

	function _getClonedBindingInfo(oBindingInfo) {
		//see ManagedObject#cloneBinding
		var oCloneBindingInfo = Object.assign({}, oBindingInfo);
		// remove the runtime binding data (otherwise the property will not be connected again!)
		delete oCloneBindingInfo.binding;
		delete oCloneBindingInfo.modelChangeHandler;
		delete oCloneBindingInfo.dataStateChangeHandler;
		delete oCloneBindingInfo.modelRefreshHandler;
		return oCloneBindingInfo;
	}

	/**
	 * Called once the necessary Model metadata is available
	 *
	 * @private
	 */
	SmartTable.prototype._onMetadataInitialised = function() {
		this._bMetaModelLoadAttached = false;
		if (this.bIsInitialised) {
			return;
		}

		this._bUseColumnLabelsAsTooltips = this.getUseColumnLabelsAsTooltips(); // keep value stable after initialization

		// Check whether further custom columns where added in the meantime
		this._updateInitialColumns();
		this._fireBeforeInitialiseAndValidate();
		this._validateCustomizeConfig(this.getCustomizeConfig());
		this._createTableProvider();
		if (!this._oTableProvider) {
			return;
		}

		this._aTableViewMetadata = this._oTableProvider.getTableViewMetadata();
		if (!this._aTableViewMetadata) {
			return;
		}

		if (this._bUseColumnLabelsAsTooltips) {
			this._oTable.getColumns().forEach(function(oColumn) {
				var oHeader = null;
				if (oColumn.getHeader) {
					oHeader = oColumn.getHeader();
				} else if (oColumn.getLabel) {
					oHeader = oColumn.getLabel();
				}

				var oLabel = oHeader && oHeader.isA && (oHeader.isA("sap.m.Label") || oHeader.isA("sap.m.Text")) ? oHeader : null;
				var oTooltipTarget = this._isOfType(TableType.ResponsiveTable) ? oLabel : oColumn;

				var oTooltip = oTooltipTarget ? oTooltipTarget.getTooltip() : null;
				if (oTooltipTarget && oLabel && !oTooltip && !oTooltipTarget.isBound("tooltip")) {
					if (oLabel.isBound("text")) {
						var oBindingInfo = _getClonedBindingInfo(oLabel.getBindingInfo("text"));
						oTooltipTarget.bindProperty("tooltip", oBindingInfo);
					} else {
						oTooltipTarget.setTooltip(oLabel.getText());
					}
				}
			}, this);
		}

		// Set width for custom columns after metadata is initialized
		if (this.getEnableAutoColumnWidth()) {
			this._oTable.getColumns().forEach(this._setWidthForCustomColumn, this);
		}

		if (!this._isOfType(TableType.ResponsiveTable) && this.getDemandPopin()) {
			this.setDemandPopin(false);
			Log.error("use SmartTable property 'demandPopin' only  with responsive table, property has been set to false");
		}
		this.detachModelContextChange(this._initialiseMetadata, this);
		// Indicates the control is initialised and can be used in the initialise event/otherwise!
		this.bIsInitialised = true;
		delete this._bInitialising;

		this._updateP13nDialogSettings(true);

		this._bTableSupportsExcelExport = this._oTableProvider.getSupportsExcelExport();
		this._bMultiUnitBehaviorEnabled = this._oTableProvider.getMultiUnitBehaviorEnabled();
		this._listenToSmartFilter();
		this._createVariantManagementControl(); // creates VariantMngmntCtrl if useVariantManagement OR useTablePersonalisation is true.
		// Control is only added to toolbar if useVariantManagement is set otherwise it acts as
		// hidden persistance helper
		this._createToolbarContent();
		this._applyToolbarContentOrder();
		this._aAlwaysSelect = this._oTableProvider.getRequestAtLeastFields();
		this._createContent();
		this._createPersonalizationController();
		// Create a local JSONModel to handle editable switch
		this._oEditModel = new JSONModel({
			editable: this.getEditable()
		});
		// Set the local model on the SmartTable
		this.setModel(this._oEditModel, "sm4rtM0d3l");

		this.attachEvent("_change", this._onPropertyChange, this);

		this.fireInitialise();
		// Trigger initial binding if no Variant exists -or- if it is already initialised
		if (!this._oVariantManagement || (this._oVariantManagement && this._bVariantInitialised)) {
			this._checkAndTriggerBinding();
		}

		this._updateCopy();
	};

	/**
	 * Fires the <code>beforeInitialise</code> event and validates for the property changes. If any unexpected properties for control internals have changed, then an error is logged.
	 * @private
	 * @since 1.98
	 */
	SmartTable.prototype._fireBeforeInitialiseAndValidate = function() {
		// skip firing beforeInitialise and validation, if no event listener is attached
		if (!this.hasListeners("beforeInitialise")) {
			return;
		}
		this._bInitialising = true;
		// fire the beforeInitialise event, exclusive for FE. FE needs to mix up the column index settings of their own custom columns with the custom columns given by the application. JIRA: CPOUIFTEAMB-1917
		this.fireEvent("beforeInitialise");
		// validate inner table after "beforeInitialise" event has been fired
		this._validateControlConfig();
		// update the initially columns
		this._updateInitialColumns();
	};

	/**
	 * Validates the changes done to the SmartTable control via the "beforeInitialise" event. An error is logged for any unexpected changes.
	 * @private
	 * @since 1.98
	 */
	SmartTable.prototype._validateControlConfig = function() {
		var aItems = this.getItems();
		if (!aItems.length) {
			throw new Error("Internals of the SmartTable control changed via beforeInitialise event - " + this.getId());
		}

		var oTable = aItems.find(function(oItem) {
			return oItem.isA(["sap.m.Table", "sap.ui.table.Table"]);
		});

		if (!oTable) {
			throw new Error("Inner Table removed via beforeInitialise event - " + this.getId());
		}

		if (oTable !== this._oTable) {
			throw new Error("Inner table changed via beforeInitialise event for SmartTable - " + this.getId());
		}
	};

	SmartTable.prototype._updateP13nDialogSettings = function(bAttachTableCustomFilters) {
		this._oP13nDialogSettings = this._getP13nDialogSettings();
		this._bIsFilterPanelEnabled = (this._oP13nDialogSettings && this._oP13nDialogSettings.filter) ? this._oP13nDialogSettings.filter.visible !== false : true;
		this._bIsSortPanelEnabled = (this._oP13nDialogSettings && this._oP13nDialogSettings.sort) ? this._oP13nDialogSettings.sort.visible !== false : true;
		this._bIsGroupPanelEnabled = (this._oP13nDialogSettings && this._oP13nDialogSettings.group) ? this._oP13nDialogSettings.group.visible !== false : true;
		this._bIsColumnsPanelEnabled = (this._oP13nDialogSettings && this._oP13nDialogSettings.columns) ? this._oP13nDialogSettings.columns.visible !== false : true;

		if (bAttachTableCustomFilters) {
			this._attachTableCustomFilter();
		}
	};

	/**
	 * Check if control needs to be bound and trigger binding accordingly.
	 *
	 * @private
	 */
	SmartTable.prototype._checkAndTriggerBinding = function() {
		if (!this._bAutoBindingTriggered) {
			this._bAutoBindingTriggered = true;
			if (this.getEnableAutoBinding()) {
				if (this._oSmartFilter) {
					if (this._oSmartFilter.isInitialised()) {
						this._oSmartFilter.search();
					} else {
						this._oSmartFilter.attachEventOnce("initialise", function() {
							this._oSmartFilter.search();
						}, this);
					}
				} else {
					this._reBindTable();
				}
			}
		}
	};

	SmartTable.prototype._aStaticProperties = [
		"entitySet", "ignoredFields", "initiallyVisibleFields", "ignoreFromPersonalisation", "tableType", "useTablePersonalisation", "enableAutoBinding", "persistencyKey", "smartFilterId", "showDetailsButton", "enableAutoColumnWidth", "customizeConfig", "useColumnLabelsAsTooltips"
	];

	SmartTable.prototype._aToolbarRelatedProperties = [
		"enableExport", "exportType", "showFullScreenButton", "showPasteButton", "editTogglable", "placeToolbarInTable"
	];

	/**
	 * Callback when the property changes for the SmartTable control.
	 *
	 * @param {object} oEvent - the event object
	 * @private
	 */
	SmartTable.prototype._onPropertyChange = function(oEvent) {
		var sProperty = oEvent.getParameter("name");
		if (this._aStaticProperties.indexOf(sProperty) > -1) {
			Log.error("Property " + sProperty + " cannot be changed after the SmartTable with id " + this.getId() + " is initialised");
		}
		if (this._oToolbar && this._aToolbarRelatedProperties.indexOf(sProperty) > -1) {
			if (sProperty === "exportType" && this._oExportButton) {
				this._oExportButton.destroy(); // needed because we now need to switch between menu and button depending on exportType
				this._oExportButton = null;
			}
			this._createToolbarContent();
		}
	};

	/**
	 * Creates an instance of the table provider
	 *
	 * @private
	 */
	SmartTable.prototype._createTableProvider = function() {
		var oModel, sEntitySetName, sIgnoredFields, bPreserveDecimals, oCustomizeConfig;
		sEntitySetName = this.getEntitySet();
		sIgnoredFields = this.getIgnoredFields();
		oModel = this.getModel();
		bPreserveDecimals = this.data("preserveDecimals");
		oCustomizeConfig = this.getCustomizeConfig();
		if (oCustomizeConfig) {
			for (var sKey in oCustomizeConfig) {
				// this._oCustomizeConfigTextInEditModeSource = oCustomizeConfig["textInEditModeSource"] perform such assignments in a generic way
				this["_oCustomizeConfig" + sKey.charAt(0).toUpperCase() + sKey.slice(1)] = oCustomizeConfig[sKey];
			}
		}

		if (bPreserveDecimals != null) {
			if (bPreserveDecimals == false || (typeof bPreserveDecimals === "string" && bPreserveDecimals === "false")) {
				this._bPreserveDecimals = false;
			} else {
				this._bPreserveDecimals = true;
			}
		} else {
			this._bPreserveDecimals = true;
		}

		if (oModel && sEntitySetName) {
			if (this._aExistingColumns.length) {
				if (sIgnoredFields) {
					sIgnoredFields += "," + this._aExistingColumns.toString();
				} else {
					sIgnoredFields = this._aExistingColumns.toString();
				}
			}
			this._oTableProvider = new TableProvider({
				entitySet: sEntitySetName,
				ignoredFields: sIgnoredFields,
				initiallyVisibleFields: this.getInitiallyVisibleFields(),
				isEditableTable: this.getEditable(),
				smartTableId: this.getId(),
				isAnalyticalTable: this._isOfType(TableType.AnalyticalTable),
				isMobileTable: this._isOfType(TableType.ResponsiveTable),
				dateFormatSettings: this.data("dateFormatSettings"),
				useUTCDateTime: this.data("useUTCDateTime"),
				currencyFormatSettings: this.data("currencyFormatSettings"),
				defaultDropDownDisplayBehaviour: this.data("defaultDropDownDisplayBehaviour"),
				useSmartField: this.data("useSmartField"),
				useSmartToggle: this.data("useSmartToggle"),
				skipAnnotationParse: this.data("skipAnnotationParse"),
				lineItemQualifier: this.data("lineItemQualifier"),
				presentationVariantQualifier: this.data("presentationVariantQualifier"),
				enableInResultForLineItem: this.data("enableInResultForLineItem"),
				defaultFilterBarExpanded: this.data("defaultFilterBarExpanded"),
				defaultShowAllFilters: this.data("defaultShowAllFilters"),
				_semanticKeyAdditionalControl: this.getAggregation("semanticKeyAdditionalControl"),
				model: oModel,
				semanticObjectController: this.getSemanticObjectController(),
				showDetailsButton: this.getShowDetailsButton(),
				enableAutoColumnWidth: this.getEnableAutoColumnWidth(),
				preserveDecimals: this._bPreserveDecimals,
				textInEditModeSource: this._oCustomizeConfigTextInEditModeSource,
				ignoreInsertRestrictions: this._oCustomizeConfigIgnoreInsertRestrictions,
				clientSideMandatoryCheck: this._oCustomizeConfigClientSideMandatoryCheck
			});
		}
	};

	/**
	 * Listen to changes on the corresponding SmartFilter (if any)
	 *
	 * @private
	 */
	SmartTable.prototype._listenToSmartFilter = function() {
		var sSmartFilterId, sInitialNoDataText, bWithFilterBar = false;
		// Register for SmartFilter Search
		sSmartFilterId = this.getSmartFilterId();

		this._oSmartFilter = this._findControl(sSmartFilterId, "sap.ui.comp.filterbar.FilterBar");

		if (this._oSmartFilter) {
			this._oSmartFilter.attachSearch(this._reBindTable, this);
			this._oSmartFilter.attachFilterChange(this._filterChangeEvent, this);
			bWithFilterBar = true;
		}

		var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp"),
			fnGetNoDataText,
			sNoDataTextPropertyName,
			mDefaultNoDataText = {
				SMARTTABLE_NO_DATA: oResourceBundle.getText("SMARTTABLE_NO_DATA"),
				SMARTTABLE_NO_DATA_WITHOUT_FILTERBAR: oResourceBundle.getText("SMARTTABLE_NO_DATA_WITHOUT_FILTERBAR"),
				SMARTTABLE_NO_RESULTS: oResourceBundle.getText("SMARTTABLE_NO_RESULTS")
			};

		if (this._oTable) {
			fnGetNoDataText = !this._isOfType(TableType.ResponsiveTable) && this._oTable.getNoData;
			sNoDataTextPropertyName = "noData";
			if (!fnGetNoDataText) {
				fnGetNoDataText = this._oTable.getNoDataText;
				sNoDataTextPropertyName = "noDataText";
			}
		}

		if (fnGetNoDataText) {
			var vCustomNoData = fnGetNoDataText.call(this._oTable);
			if (vCustomNoData && (!this._isOfType(TableType.ResponsiveTable) || !this._oTable.isPropertyInitial(sNoDataTextPropertyName))) {
				if (Object.values(mDefaultNoDataText).indexOf(vCustomNoData) == -1) {
					this._vCustomNoData = vCustomNoData;
				}
			}
		}

		sInitialNoDataText = this.getInitialNoDataText();

		if (sInitialNoDataText) {
			bWithFilterBar = sInitialNoDataText === "$FILTERBAR";
			if (!bWithFilterBar && sInitialNoDataText !== "$NO_FILTERBAR") {
				// If the text is not one of the "special" values simply use it and return
				this._setNoDataText(sInitialNoDataText);
				return;
			}
		}

		if (bWithFilterBar) {
			// Set initial empty text only if a valid SmartFilter is found
			this._setNoDataText(mDefaultNoDataText["SMARTTABLE_NO_DATA"]);
		} else {
			// Set initial empty text for the case when no SmartFilter is attached to SmartTable
			this._setNoDataText(mDefaultNoDataText["SMARTTABLE_NO_DATA_WITHOUT_FILTERBAR"]);
		}
	};

	SmartTable.prototype._filterChangeEvent = function() {
		if (this._isTableBound() && this._oSmartFilter && !this._oSmartFilter.getLiveMode() && !this._oSmartFilter.isDialogOpen()) {
			this._showOverlay(true);
		}
	};

	/**
	 * sets the ShowOverlay property on the inner table, fires the ShowOverlay event
	 *
	 * @param {boolean} bShow true to display the overlay, otherwise false
	 * @private
	 */
	SmartTable.prototype._showOverlay = function(bShow) {
		if (bShow) {
			var oOverlay = {
				show: true
			};
			this.fireShowOverlay({
				overlay: oOverlay
			});
			bShow = oOverlay.show;
		}

		this._oTable.setShowOverlay(bShow);
	};

	/**
	 * searches for a certain control by its ID
	 *
	 * @param {string} sId the control's ID
	 * @param {string} sType the named type of the control
	 * @returns {sap.ui.core.Control} The control found by the given Id
	 * @private
	 */
	SmartTable.prototype._findControl = function(sId, sType) {
		var oResultControl, oView;
		if (sId) {
			// Try to get SmartFilter from Id
			oResultControl = Element.getElementById(sId);

			// Try to get SmartFilter from parent View!
			if (!oResultControl || !oResultControl.isA(sType)) {
				oView = this._getView();

				if (oView) {
					oResultControl = oView.byId(sId);
				}
			}
			// Check if the control is an instance of the specified type (Smart/FilterBar)
			if (oResultControl && !oResultControl.isA(sType)) {
				oResultControl = undefined;
			}
		}

		return oResultControl;
	};

	/**
	 * searches for the controls view
	 *
	 * @returns {sap.ui.core.mvc.View} The found parental View
	 * @private
	 */
	SmartTable.prototype._getView = function() {
		if (!this._oView) {
			var oObj = this.getParent();
			while (oObj) {
				if (oObj.isA("sap.ui.core.mvc.View")) {
					this._oView = oObj;
					break;
				}
				oObj = oObj.getParent();
			}
		}
		return this._oView;
	};

	/**
	 * This can be used to trigger binding on the table used in the SmartTable
	 *
	 * @param {boolean} bForceRebind - force bind call to be triggered on the inner table
	 * @public
	 */
	SmartTable.prototype.rebindTable = function(bForceRebind) {
		if (this.isInitialised()) {
			this._reBindTable(null, bForceRebind);
			return;
		}

		Log.error(
			"rebindTable method called before the SmartTable is initialized. Please execute the UI5 Support Assistant 'SmartTable' rules to get more information",
			this.getId(),
			"sap.ui.comp.smarttable.SmartTable"
		);
	};

	/**
	 * Re-binds the table
	 *
	 * @param {object} mEventParams - the event parameters
	 * @param {boolean} bForceRebind - force bind call to be triggered on the table
	 * @private
	 */
	SmartTable.prototype._reBindTable = function(mEventParams, bForceRebind) {
		var oTableBinding, sTableBindingPath, mTablePersonalisationData, i, iLen, aSmartFilters, aProcessedFilters = [], aFilters, oExcludeFilters, aAlwaysSelect, aSelect, mSelectExpand, aExpand, aSorters, mParameters = {}, mBindingParams = {
			preventTableBind: false
		};

		this._bUpdateTableAnnouncement = mEventParams && mEventParams.getId && mEventParams.getId() === "search";

		mTablePersonalisationData = this._getTablePersonalisationData() || {};
		if (this._oMessageFilter) {
			aFilters = this._oMessageFilter;
		} else {
			aFilters = mTablePersonalisationData.filters;
			oExcludeFilters = mTablePersonalisationData.excludeFilters;
		}
		aSorters = mTablePersonalisationData.sorters;

		// Get Filters and parameters from SmartFilter
		if (this._oSmartFilter) {
			aSmartFilters = this._oSmartFilter.getFilters();
			mParameters = this._oSmartFilter.getParameters() || {};
		}

		// If filters from SmartFilter exist --> process them first with SmartTable exclude filters
		// since we need to manually AND multiple multi filters!
		if (aSmartFilters && aSmartFilters.length) {
			if (oExcludeFilters) {
				aProcessedFilters = [
					new Filter([
						aSmartFilters[0], oExcludeFilters
					], true)
				];
			} else {
				aProcessedFilters = aSmartFilters;
			}
		} else if (oExcludeFilters) {
			aProcessedFilters = [
				oExcludeFilters
			];
		}
		// Combine the resulting processed filters with SmartTable include filters
		if (aFilters) {
			aFilters = aProcessedFilters.concat(aFilters);
		} else {
			aFilters = aProcessedFilters;
		}
		aAlwaysSelect = this._getRequestAtLeastFields();
		mSelectExpand = this._getRelevantColumnPaths();
		aSelect = mSelectExpand["select"];

		aSelect = this._getSemanticObjectBindingPaths(aSelect);

		// handle fields that shall always be selected
		if (!aSelect || !aSelect.length) {
			aSelect = aAlwaysSelect;
		} else {
			iLen = aAlwaysSelect.length;
			for (i = 0; i < iLen; i++) {
				if (aSelect.indexOf(aAlwaysSelect[i]) < 0) {
					aSelect.push(aAlwaysSelect[i]);
				}
			}
		}
		if (this._mSelectExpandForGroup && this._mSelectExpandForGroup.select) {
			this._mSelectExpandForGroup.select.forEach(function(sGroupSelect) {
				if (aSelect.indexOf(sGroupSelect) < 0) {
					aSelect.push(sGroupSelect);
				}
			});
		}
		oTableBinding = this._oTable.getBinding(this._sAggregation);
		if (aSelect.length) {
			this._adaptTreeBindingParameters(aSelect, mParameters, oTableBinding);
			mParameters["select"] = aSelect.toString();

			// Expand handling for navigationProperties
			aExpand = mSelectExpand["expand"] || [];
			if (this._mSelectExpandForGroup && this._mSelectExpandForGroup.expand) {
				this._mSelectExpandForGroup.expand.forEach(function(sGroupExpand) {
					if (aExpand.indexOf(sGroupExpand) < 0) {
						aExpand.push(sGroupExpand);
					}
				});
			}
			if (aExpand.length) {
				mParameters["expand"] = aExpand.join(",");
			}
		}

		// Enable batch requests (used by AnalyticalTable)
		mParameters["useBatchRequests"] = true;

		if (!aSorters) {
			aSorters = [];
		}

		mBindingParams.filters = aFilters;
		mBindingParams.sorter = aSorters;
		mBindingParams.parameters = mParameters;
		mBindingParams.length = undefined;
		mBindingParams.startIndex = undefined;
		mBindingParams.events = {};
		// fire event to enable user modification of certain binding options (Ex: Filters)
		this.fireBeforeRebindTable({
			bindingParams: mBindingParams,
			messageFilterActive: !!this._oMessageFilter
		});

		if (!mBindingParams.preventTableBind) {
			aSorters = mBindingParams.sorter;
			aFilters = mBindingParams.filters;
			mParameters = mBindingParams.parameters;
			aSelect = mBindingParams.parameters["select"];
			if (!aSelect || !aSelect.length) {
				MessageBox.error(Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_NO_COLS"), {
					styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : ""
				});
				return;
			}
			sTableBindingPath = this.getTableBindingPath() || ("/" + this.getEntitySet());

			// Reset Suppress refresh
			if (this._oTable.resumeUpdateAnalyticalInfo) {
				// resumeUpdateAnalyticalInfo forces binding change if not explicitly set to false
				this._oTable.resumeUpdateAnalyticalInfo(true, false);
			}
			this._bDataLoadPending = true;
			this._setExcelExportEnableState(); // Update export button based on this._bDataLoadPending
			this._bIgnoreChange = false; // if a 2nd request is sent while the 1st one is in progress the dataReceived event may not be fired!
			// Check if table has to be forcefully bound again!
			if (this._bForceTableUpdate) {
				bForceRebind = true;
				// Reset force update
				this._bForceTableUpdate = false;
			}
			// Only check if binding exists, if table is not being forcefully rebound
			if (!bForceRebind) {
				if (oTableBinding && oTableBinding.mParameters) {
					// Check if binding needs to be redone!
					// Evaluate to true if:
					// binding parameters change -or- custom binding parameters change -or- if length, startIndex or tableBindingPath change!
					// remove "select" from bindingParameters since deepEqual will return false if there is a string mismatch, e.g., "a,b" != "b,a"
					var sSmartTableSelectParameter = mParameters["select"];
					mParameters["select"] = "";
					var sTableSelectParameter = oTableBinding.mParameters["select"];
					oTableBinding.mParameters["select"] = "";
					// check deepEqual without "select"
					bForceRebind = !(deepEqual(mParameters, oTableBinding.mParameters, true) && deepEqual(mParameters.custom, oTableBinding.mParameters.custom) && !mBindingParams.length && !mBindingParams.startIndex && sTableBindingPath === oTableBinding.getPath());
					if (!bForceRebind) {
						// additional deepEqual for the "select"
						bForceRebind = !deepEqual(sSmartTableSelectParameter.split(",").sort(), sTableSelectParameter.split(",").sort());
					}
					// restore the "select"
					mParameters["select"] = sSmartTableSelectParameter;
					oTableBinding.mParameters["select"] = sTableSelectParameter;
				}
			}

			// Update No data text (first time), just before triggering the binding!
			if (!this._bNoDataUpdated) {
				this._bNoDataUpdated = true;
				this._setNoDataText();
			} else {
				this._setNoDataText(undefined, (this.getSmartFilterId() || this._bIsFilterPanelEnabled) && aFilters && aFilters.length);
			}

			// do the binding if no binding is already present or if it is being forced!
			if (!oTableBinding || !this._bIsTableBound || bForceRebind) {
				SmartTable._addBindingListener(mBindingParams, "change", this._onBindingChange, this);
				SmartTable._addBindingListener(mBindingParams, "dataRequested", this._onDataRequested, this);
				SmartTable._addBindingListener(mBindingParams, "dataReceived", this._onDataReceived, this);

				// if the cell contains an aggregation binding that could lead to multiple requests even for hidden cells
				// therefore here we suppress the binding of invisible column cells for the responsive table
				if (this._isOfType(TableType.ResponsiveTable)) {
					var aColumns = this._oTable ? this._oTable.getColumns() : [];
					var aCells = this._oTemplate ? this._oTemplate.getCells() : [];

					// The relationship between columns and cells cannot be determined if the number of columns and cells do not match. In this
					// case, the optimization cannot be performed.
					if (aColumns.length === aCells.length) {
						aColumns.forEach(function(oColumn, iIndex) {
							aCells[iIndex].setBindingContext(oColumn.getVisible() ? undefined : null);
						});
					}
				}

				this._oTable.bindRows({
					path: sTableBindingPath,
					filters: aFilters,
					sorter: aSorters,
					parameters: mParameters,
					length: mBindingParams.length,
					startIndex: mBindingParams.startIndex,
					template: this._oTemplate,
					templateShareable: true,
					events: mBindingParams.events
				});
				// Flag to indicate if table was bound (data fetch triggered) at least once
				this._bIsTableBound = true;
			} else {
				oTableBinding.sort(aSorters);
				oTableBinding.filter(aFilters, "Application");
			}
			this._showOverlay(false);
		}
	};

	/**
	 * Adds necessary tree hierarchy fields to $select which is also added by the ODataTreeBiniding and also other binding parameters.
	 * This will prevent rebindTable to always create a new binding when the TreeTable is already bound.
	 * ODataTreeBinding adds these properties to the $select regardless if its part of the ignoredFields.
	 * @param {array} aSelect Array containing the select parameter
	 * @param {object} mParameters The SmartTable generated binding parameters
	 * @param {sap.ui.model.Binding} oTableBinding The inner table binding
	 * @private
	 */
	SmartTable.prototype._adaptTreeBindingParameters = function(aSelect, mParameters, oTableBinding) {
		if (!this._isOfType(TableType.TreeTable)) {
			return;
		}

		/**
		* @UI5_V2_DEPRECATION_CHECK
		* expandFirstLevel, rootLevel and collapseRecursive are deprecated properties of the TreeTable which are replaced with binding parameters.
		* Once the deprecated code is removed the following 9 lines of code will become obsolete.
		* @deprecated
		*/
		if (this._oTable.getExpandFirstLevel) {
			mParameters["numberOfExpandedLevels"] = this._oTable.getExpandFirstLevel() ? 1 : 0;
		}
		if (this._oTable.getRootLevel) {
			mParameters["rootLevel"] = this._oTable.getRootLevel();
		}
		if (this._oTable.getCollapseRecursive) {
			mParameters["collapseRecursive"] = this._oTable.getCollapseRecursive();
		}

		if (!oTableBinding || !oTableBinding.getTreeAnnotation) {
			return;
		}

		// get hierarchy info from ODataTreeBinding, see ODataTreeBinding.prototype._processSelectParameters
		var mAdditionalSelect = {
			"hierarchy-level-for": oTableBinding.getTreeAnnotation("hierarchy-level-for"),
			"hierarchy-parent-node-for": oTableBinding.getTreeAnnotation("hierarchy-parent-node-for"),
			"hierarchy-node-for": oTableBinding.getTreeAnnotation("hierarchy-node-for"),
			"hierarchy-drill-state-for":  oTableBinding.getTreeAnnotation("hierarchy-drill-state-for")
		};

		for (var sKey in mAdditionalSelect) {
			// check if its not undefined and does not already exist in the select parameter
			if (mAdditionalSelect[sKey] && aSelect.indexOf(mAdditionalSelect[sKey]) === -1) {
				aSelect.push(mAdditionalSelect[sKey]);
			}
		}
	};

	/**
	 * Event handler for binding dataRequested
	 *
	 * @param {object} oEvt - the event instance
	 * @private
	 */
	SmartTable.prototype._onDataRequested = function(oEvt) {
		// AnalyticalBinding fires dataRequested too often/early
		if (oEvt && oEvt.getParameter && oEvt.getParameter("__simulateAsyncAnalyticalBinding")) {
			return;
		}
		this._bIgnoreChange = true;
		// notify any listeners about dataRequested
		/** @deprecated */
		this.fireDataRequested(oEvt.getParameters());
	};

	/**
	 * Event handler for binding dataReceived
	 *
	 * @param {object} oEvt - the event instance
	 * @private
	 */
	SmartTable.prototype._onDataReceived = function(oEvt) {
		// AnalyticalBinding fires dataReceived too often/early
		if (oEvt && oEvt.getParameter && oEvt.getParameter("__simulateAsyncAnalyticalBinding")) {
			return;
		}
		this._bIgnoreChange = false;
		this._onDataLoadComplete(oEvt, true);
		// notify any listeners about dataReceived
		/** @deprecated */
		this.fireDataReceived(oEvt);
	};

	/**
	 * Event handler for binding change
	 *
	 * @param {object} oEvt - the event instance
	 * @private
	 */
	SmartTable.prototype._onBindingChange = function(oEvt) {
		if (this._bIgnoreChange) {
			return;
		}
		var sReason, bForceUpdate = false;
		sReason = (oEvt && oEvt.getParameter) ? oEvt.getParameter("reason") : undefined;
		// Force update state if reason for binding change is "context" or "filter" -or- not defined -or- if binding changes due to a model update -or- reason is "add"/"remove" (typically in creation row scenario)
		// (e.g. $expand on a parent entity)
		if (!sReason || sReason === "filter" || sReason === "context" || (!this._bDataLoadPending && sReason === "change") || sReason === "add" || sReason === "remove") {
			bForceUpdate = true;
		}
		if (sReason === "change" || bForceUpdate) {
			this._onDataLoadComplete(oEvt, bForceUpdate);
		}
	};

	/**
	 * Static method for checking and wrapping binding event listeners
	 *
	 * @param {object} oBindingInfo - the bindingInfo (or binding parameter) instance
	 * @param {object} sEventName - the event name
	 * @param {object} fHandler - the handler to be called internally
	 * @param {object} oScope - function scope
	 * @private
	 */
	SmartTable._addBindingListener = function(oBindingInfo, sEventName, fHandler, oScope) {
		if (!oBindingInfo.events) {
			oBindingInfo.events = {};
		}

		if (!oBindingInfo.events[sEventName]) {
			// Cannot pass scope/listener for binding events, hence .bind is used!
			oBindingInfo.events[sEventName] = fHandler.bind(oScope);
		} else {
			// Wrap the event handler of the other party to add our handler.
			var fOriginalHandler = oBindingInfo.events[sEventName];
			oBindingInfo.events[sEventName] = function() {
				fHandler.apply(oScope, arguments);
				fOriginalHandler.apply(oScope, arguments);
			};
		}
	};

	/**
	 * Called once data is loaded in the binding (i.e. either backend fetch or once change event is fired)
	 *
	 * @param {object} mEventParams - the event parameters
	 * @param {boolean} bForceUpdate - force update
	 * @private
	 */
	SmartTable.prototype._onDataLoadComplete = function(mEventParams, bForceUpdate) {
		if (this._bDataLoadPending || bForceUpdate) {
			this._bDataLoadPending = false;
			this.updateTableHeaderState();
		}
	};

	/**
	 * Returns true if the inner UI5 table was bound at least once by the SmartTable -or- if binding was done by the app.
	 *
	 * @returns {boolean} whether the inner UI5 table is bound
	 * @private
	 */
	SmartTable.prototype._isTableBound = function() {
		if (this._bIsTableBound) {
			return true;
		}
		if (this._oTable) {
			return this._oTable.isBound(this._sAggregation);
		}
		return false;
	};

	SmartTable.prototype.setNoData = function(oNoData) {
		// overwrite the original aggregation setter, otherwise parent relationship will be destroyed when a control is set to the inner table's
		// noData aggregation
		this._oNoData = oNoData;
		if (this._bNoDataUpdated || this._isTableBound()) {
			this._setNoDataText();
		}
		return this;
	};

	SmartTable.prototype.getNoData = function() {
		return this._oNoData;
	};

	/**
	 * Sets the no data text to the internal table
	 *
	 * @param {string} sOverwriteText - optional text to set on the table
	 * @param {boolean} bShowNoDataTextWithFilters - show NoData text if there are filters set in FilterBar or Filter Panel
	 * @private
	 */
	SmartTable.prototype._setNoDataText = function(sOverwriteText, bShowNoDataTextWithFilters) {
		var fSetFunction = !this._isOfType(TableType.ResponsiveTable) && this._oTable.setNoData;
		if (!fSetFunction) {
			fSetFunction = this._oTable.setNoDataText;
		}

		if (!fSetFunction) {
			return;
		}

		if (this._bNoDataUpdated && this._vCustomNoData) {
			fSetFunction.call(this._oTable, this._vCustomNoData, true);
			return;
		}

		var oNoData = sOverwriteText;
		if (!oNoData) {
			oNoData = this.getNoData();
		}

		if (!oNoData) {
			if (bShowNoDataTextWithFilters) {
				oNoData = Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_NO_RESULTS");
			} else {
				oNoData = Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_NO_DATA_WITHOUT_FILTERBAR");
			}
		}

		fSetFunction.call(this._oTable, oNoData, true);
	};

	/**
	 * This can be called once data is received to update table header (count) and toolbar buttons(e.g. Excel Export) enabled state
	 *
	 * @public
	 */
	SmartTable.prototype.updateTableHeaderState = function() {
		this._refreshHeaderText();
		this._setExcelExportEnableState();
	};

	/**
	 * Creates the content based on the metadata/configuration
	 *
	 * @private
	 */
	SmartTable.prototype._createContent = function() {
		var i, iLen = 0, oField, aIndexedColumns, oColumn, aRemainingColumnKeys = [];

		// Sync the current table columns with the _aColumnKeys array
		if (this._aExistingColumns && this._aExistingColumns.length) {
			this._aColumnKeys = [].concat(this._aExistingColumns.reverse());
		}

		if (!this._bUseLegacyMenu) {
			if (this.getUseTablePersonalisation()) {
				this._oColumnHeaderPopover = new ColumnMenu({
					id: this.getId() + "-columnHeaderMenu",
					showTableSettingsButton: true,
					tableSettingsPressed: [this._showTableP13nDialog, this]
				});
				FESRHelper.setSemanticStepname(this._oColumnHeaderPopover, "beforeOpen", "sc:tbl:p13n:col");
				this._bMissingColumnsCreated = false;
				this._oColumnHeaderPopover.attachBeforeOpen(this._createColumnMenuContent, this);
			}
		}

		aIndexedColumns = this._parseIndexedColumns();

		iLen = this._aTableViewMetadata.length;
		for (i = 0; i < iLen; i++) {
			oField = this._aTableViewMetadata[i];
			// Fill only inititally visible columns coming from metadata
			if (oField.isInitiallyVisible) {
				this._aColumnKeys.push(oField.name);
			} else {
				aRemainingColumnKeys.push(oField.name);
			}

			// Store the non-relevant columns in a map
			if (!(oField.isInitiallyVisible || oField.inResult)) {
				this._mLazyColumnMap[oField.name] = oField;
			} else {
				oColumn = this._createColumnForField(oField);
				// Add the column to the table
				this._oTable.addColumn(oColumn);
			}

			// Add field metadata to internal named map for later quick access
			this._mFieldMetadataByKey[oField.name] = oField;
		}

		this._insertIndexedColumns(aIndexedColumns);

		// Fill remaining columns from metadata into the column keys array
		this._aColumnKeys = this._aColumnKeys.concat(aRemainingColumnKeys);

		// additional settings for the optimal column width
		if (this._isOfType(TableType.ResponsiveTable) && this.getEnableAutoColumnWidth()) {
			this.setDemandPopin(true);
			this._oTable.setFixedLayout("Strict");
			this._oTable.setContextualWidth("auto");
			this._oTable.addDependent(new ColumnResizer());
		}

		this._updateColumnsPopinFeature();

		if (this.getShowDetailsButton()) {
			this._oTable.setHiddenInPopin(this._getImportanceToHide());
		}
		this._storeInitialColumnSettings();
	};

	/**
	 * Creates the column from the field metadata and returns it
	 *
	 * @param {object} oField - the field metadata from which we create the columns
	 * @returns {object} the created column
	 * @private
	 */
	SmartTable.prototype._createColumnForField = function(oField) {
		var oColumn, sId;
		// Replace invalid chars in name (e.g: "/") with "_"
		sId = this.getId() + "-" + oField.name.replace(/[^A-Za-z0-9_.:-]+/g, "_");
		oColumn = this._createColumn(oField, sId);
		// Mark field as created
		oField.isColumnCreated = true;
		// Set the persoData - relevant for personalisation
		oColumn.data("p13nData", {
			columnKey: oField.name,
			leadingProperty: oField.name, // used to fetch data, by adding this to $select param of OData request
			additionalProperty: oField.additionalProperty, // additional data to fetch in $select
			additionalSortProperty: undefined, // additional sortable properties
			navigationProperty: oField.navigationProperty, // navigationProperty that has to be expanded in $expand
			sortProperty: oField.sortable ? oField.name : undefined,
			filterProperty: oField.filterable ? oField.name : undefined,
			isGroupable: oField.sortable && oField.filterable && oField.aggregationRole === "dimension",
			fullName: oField.hasValueListAnnotation ? oField.fullName : null,
			type: oField.filterType,
			typeInstance: oField.modelType, // used by p13n - Filter/Condition handling
			maxLength: oField.maxLength,
			precision: oField.precision,
			scale: oField.scale,
			align: oField.align,
			edmType: oField.type,
			displayBehaviour: oField.displayBehaviour,
			description: oField.description,
			isDigitSequence: oField.isDigitSequence,
			isCurrency: oField.isCurrencyField,
			isTimezone: oField.isTimezone,
			ignorePaste: false,
			unit: oField.unit,
			width: oField.width,
			aggregationRole: oField.aggregationRole,
			nullable: oField.nullable !== "false",
			timezone: oField.timezone || null
		});

		if (oField.filterable && oColumn.setFilterProperty) {
			oColumn.setFilterProperty(oField.name);
		}

		if (oField.sortable && oColumn.setSortProperty) {
			oColumn.setSortProperty(oField.name);
		}

		if (!this._bUseLegacyMenu && !oColumn.getAssociation("headerMenu")) {
			oColumn.setAssociation("headerMenu", this.getId() + "-columnHeaderMenu");
		}

		if (this.getEnableAutoColumnWidth()) {
			oField.width = oColumn.getWidth();
			if (this.getEditable()) {
				this._updateColumnWidthForEdit(oColumn, oField);
			}
		}

		this._registerContentTemplateEvents(oField.template);

		return oColumn;
	};

	/**
	 * searches for columns which contains a columnIndex custom data property. Removes those columns from the table and returns them
	 *
	 * @returns {array} the found columns together with their index
	 * @private
	 */
	SmartTable.prototype._parseIndexedColumns = function() {
		var i, iLength, oColumn, aIndexedColumns, oCustomData, sIndex, sColumnKey, iIndex, oTemplateCell;
		var aColumns = this._oTable.getColumns();
		var aCells = null;
		if (this._oTemplate && this._oTemplate.getCells) {
			aCells = this._oTemplate.getCells();
		}

		if (!aColumns) {
			return null;
		}

		aIndexedColumns = [];
		iLength = aColumns.length;

		for (i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			oCustomData = oColumn.data("p13nData");
			sIndex = null;
			sColumnKey = null;
			if (oCustomData) {
				sIndex = oCustomData.columnIndex;
				sColumnKey = oCustomData.columnKey;
			}
			iIndex = -1;
			if (sIndex !== null && sIndex !== undefined) {
				iIndex = parseInt(sIndex);
			}
			if (!isNaN(iIndex) && iIndex > -1) {
				if (aCells) {
					oTemplateCell = aCells[i];
					this._oTemplate.removeCell(oTemplateCell);
				} else {
					oTemplateCell = null;
				}
				// Keep in sync with table - remove the columns from existing column array
				this._aColumnKeys.splice(i - aIndexedColumns.length, 1);

				aIndexedColumns.push({
					index: iIndex,
					columnKey: sColumnKey,
					column: oColumn,
					template: oTemplateCell
				});

				this._oTable.removeColumn(oColumn);
			}
		}

		aIndexedColumns.sort(function(col1, col2) {
			return col1.index - col2.index;
		});

		return aIndexedColumns;
	};

	/**
	 * inserts columns containing an index back to the table
	 *
	 * @param {Array} aIndexedColumns - an array containing objects with index and columns
	 * @private
	 */
	SmartTable.prototype._insertIndexedColumns = function(aIndexedColumns) {
		var i, iLength, oColumn;

		if (!aIndexedColumns) {
			return;
		}

		iLength = aIndexedColumns.length;
		for (i = 0; i < iLength; i++) {
			oColumn = aIndexedColumns[i];
			// Keep in sync with table - add column at the specified location
			this._aColumnKeys.splice(oColumn.index, 0, oColumn.columnKey);
			// we keep also invisible columns in order not to loose information on the index within the table
			this._oTable.insertColumn(oColumn.column, oColumn.index);
			if (oColumn.template) {
				this._oTemplate.insertCell(oColumn.template, oColumn.index);
			}
		}
	};

	/**
	 * on sap.m.Table, this function activates the popin feature for the visible columns
	 *
	 * @private
	 */
	SmartTable.prototype._updateColumnsPopinFeature = function() {
		if (!this._isOfType(TableType.ResponsiveTable) || !this.getDemandPopin()) { // popin only available on mobile table
			return;
		}

		if (!this._oTable.getAutoPopinMode()) {
			this._oTable.setAutoPopinMode(true);
		}

		var aColumns = this._oTable.getColumns(true);
		if (!aColumns) {
			return;
		}

		// get only visible columns
		aColumns = aColumns.filter(function(col) {
			return col.getVisible();
		});

		aColumns.forEach(function(oColumn) {
			if (oColumn.getPopinDisplay() != "WithoutHeader") {
				oColumn.setPopinDisplay("Inline");
			}
		});
	};

	/**
	 * stores the initial column settings
	 *
	 * @private
	 */
	SmartTable.prototype._storeInitialColumnSettings = function() {
		var aInitialArray = PersonalizationUtil.createArrayFromString(this.getIgnoreFromPersonalisation());
		this._aInitialSorters = [];
		PersonalizationUtil.createSort2Json(this._oTable, this._aInitialSorters, aInitialArray, this._aTableViewMetadata);
	};

	/**
	 * on sap.m.Table, this function deactivates the popin feature for all columns
	 *
	 * @private
	 */
	SmartTable.prototype._deactivateColumnsPopinFeature = function() {
		if (!this._isOfType(TableType.ResponsiveTable)) { // popin only available on mobile table
			return;
		}

		if (this._oTable.getAutoPopinMode()) {
			this._oTable.setAutoPopinMode(false);
		}

		var aColumns = this._oTable.getColumns();
		if (!aColumns) {
			return;
		}

		var oColumn, iLength = aColumns.length;

		for (var i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			oColumn.setDemandPopin(false);
			oColumn.setMinScreenWidth("1px");
		}
	};

	/**
	 * registers events on the template controls which are exposed by the SmartTable
	 *
	 * @param {sap.ui.core.Control} oTemplateControl - the control on which to register the events
	 * @private
	 */
	SmartTable.prototype._registerContentTemplateEvents = function(oTemplateControl) {
		// When SmartToggle is used - get the edit content that is inside the SmartToggle
		if (oTemplateControl.isA("sap.ui.comp.SmartToggle")) {
			oTemplateControl = oTemplateControl.getEdit();
		}

		if (oTemplateControl && oTemplateControl.attachChange) {
			oTemplateControl.attachChange(function(oEventParams) {
				this.fireFieldChange({
					changeEvent: oEventParams
				});
			}, this);
		}
	};

	/**
	 * stores a list of initially created columns (if any)
	 *
	 * @private
	 */
	SmartTable.prototype._updateInitialColumns = function() {
		var aColumns = this._oTable.getColumns(), iLen = aColumns.length, oColumn, oColumnData;
		var bEnableAutoColumnWidth = this.getEnableAutoColumnWidth();
		while (iLen--) {
			oColumn = aColumns[iLen];
			// Retrieve path from the property
			oColumnData = oColumn.data("p13nData");

			if (oColumnData?.columnKey && this._aExistingColumns.indexOf(oColumnData.columnKey) >= 0) {
				// Do not process columns again which are already processed
				continue;
			}

			if (typeof oColumnData === "string") {
				try {
					oColumnData = JSON.parse(oColumnData);
					oColumn.data("p13nData", oColumnData); // Set back the object for faster access later
				} catch (e) {
					Log.error(`Assigned p13nData is not a valid JSON object for column with id ${oColumn.getId()}`);
				}
			}

			if (oColumnData?.columnKey) {
				this._aExistingColumns.push(oColumnData.columnKey);
				if (!this._bUseLegacyMenu && !oColumn.getAssociation("headerMenu")) {
					oColumn.setAssociation("headerMenu", this.getId() + "-columnHeaderMenu");
					if (!this._isOfType(TableType.ResponsiveTable)) {
						this._mMenuShowEntryMap.set(oColumn, {sort: oColumn.getShowSortMenuEntry(), filter: oColumn.getShowFilterMenuEntry()});
						oColumn.setShowSortMenuEntry(false);
						oColumn.setShowFilterMenuEntry(false);
					}
				}
			}

			if (bEnableAutoColumnWidth && this._isOfType(TableType.ResponsiveTable)) {
				var oHeader = oColumn.getHeader();
				if (oHeader && oHeader.isPropertyInitial("wrapping") && oHeader.getMetadata().getProperty("wrapping")) {
					oHeader.setWrapping(false);
				}
			}
		}
	};

	/**
	 * gets the array of visible and inResult column path, that will used to create the select query
	 *
	 * @private
	 * @returns {object} Map containing array of column paths to be selected and expanded
	 */
	SmartTable.prototype._getRelevantColumnPaths = function() {
		var mResult = {}, aSelect = [], aExpand = [], aColumns = this._oTable.getColumns(), i, iLen = aColumns ? aColumns.length : 0, oColumn, oColumnData, sPath, sAdditionalPath, sExpandPath;
		var fExtractAndInsertPathToArray = function(sPath, aArray, bAdditionalProperty) {
			var iPathLen, aPath;
			if (sPath) {
				aPath = sPath.split(",");
				iPathLen = aPath.length;
				// extract and add the additional paths if they don't already exist
				while (iPathLen--) {
					sPath = aPath[iPathLen];
					if (sPath && aArray.indexOf(sPath) < 0) {
						aArray.push(sPath);

						// Resolve transitive dependencies only for non-AnalyticalTable, as adding items to the select parameter can lead to the $select being ignored
						// Case: CS20230006036415
						if (!this._isOfType(TableType.AnalyticalTable)) {
							var oColumn = this._getColumnFromP13nMap(sPath);
							if (oColumn) {
								var sType = bAdditionalProperty ? "additionalProperty" : "navigationProperty",
									oColumnData = oColumn.data("p13nData"),
									sExtraPath = oColumnData[sType];
								if (sExtraPath) {
									fExtractAndInsertPathToArray.call(this, sExtraPath, aArray, bAdditionalProperty);
								}
							}
						}
					}
				}
			}
		};

		for (i = 0; i < iLen; i++) {
			oColumn = aColumns[i];
			sPath = null;

			if (oColumn.getVisible() || (oColumn.getInResult && oColumn.getInResult())) {
				oColumnData = oColumn.data("p13nData");
				sPath = this._getColumnLeadingProperty(oColumn, oColumnData);
				if (oColumnData) {
					sAdditionalPath = oColumnData["additionalProperty"];
					sExpandPath = oColumnData["navigationProperty"];
				}

				if (sPath && aSelect.indexOf(sPath) < 0) {
					aSelect.push(sPath);
				}

				fExtractAndInsertPathToArray.call(this, sAdditionalPath, aSelect, true);
				fExtractAndInsertPathToArray.call(this, sExpandPath, aExpand, false);
			}
		}
		mResult["select"] = aSelect;
		mResult["expand"] = aExpand;
		return mResult;
	};

	/**
	 * Creates a table based on the configuration, if necessary. This also prepares the methods to be used based on the table type.
	 *
	 * @private
	 */
	SmartTable.prototype._createTable = function() {
		const oTable = this.getTable();
		this._sAggregation = "rows";

		if (!oTable) {
			const sId = this.getId() + "-ui5table";

			switch (this.getTableType()) {
				case TableType.AnalyticalTable:
					this._oTable = new AnalyticalTable(sId, {
						enableCustomFilter: true
					});
					break;
				case TableType.ResponsiveTable:
					this._oTable = new ResponsiveTable(sId, {
						growing: true,
						autoPopinMode: this.getDemandPopin()
					});
					this._oTemplate = new ColumnListItem();
					break;
				case TableType.TreeTable:
					this._oTable = new TreeTable(sId, {
						selectionMode: "MultiToggle"
					});
					break;
				default:
					this._oTable = new Table(sId, {
						selectionMode: "MultiToggle"
					});
			}

			if (!this._isOfType(TableType.ResponsiveTable)) {
				setAutoRowMode(this._oTable);
			}

			this.insertItem(this._oTable, 2);
		}

		// the deferred object is resolved with the table instance
		this._oTableReady.resolve(this._oTable);

		// TODO: get from theme parameters
		this._fColumnPaddingBorder = (this._isOfType(TableType.ResponsiveTable)) ? 1 : 1.1875;

		if (!this._oTable.getLayoutData()) {
			let bIsGridTableInAutoMode = false;

			// Checking if Table is of type sap.m.Table and visibleRowCountMode is not set to Auto
			// Then baseSize is set to auto. This check is to ensure corrent rendering of SmartTable in IE and Safari

			if (!this._isOfType(TableType.ResponsiveTable)) {
				const vRowMode = this._oTable.getRowMode();

				/**
				 * @deprecated As of version 1.119
				 */
				if (!vRowMode) {
					bIsGridTableInAutoMode = this._oTable.getVisibleRowCountMode() === "Auto";
				}

				if (vRowMode) {
					bIsGridTableInAutoMode = vRowMode === "Auto" || vRowMode.isA("sap.ui.table.rowmodes.Auto");
				}
			}

			if (this._oTable instanceof ResponsiveTable || bIsGridTableInAutoMode) {
				this._oTable.setLayoutData(new FlexItemData({
					growFactor: 1,
					baseSize: "auto"
				}));
			} else {
				// baseSize="0%" for tables that are not of type sap.m.Table
				this._oTable.setLayoutData(new FlexItemData({
					growFactor: 1,
					baseSize: "0%"
				}));
			}
		}

		this._oTable.addStyleClass("sapUiCompSmartTableInnerTable");

		this._oTable.setEnableBusyIndicator(true);
		this._oTable.setBusyIndicatorDelay(100);

		/** @deprecated As of version 1.40 */
		if (this._oTable.setEnableCustomFilter) {
			this._oTable.setEnableCustomFilter(this.getEnableCustomFilter());
		}

		/**
		 * Always disable Column Visiblilty menu item
		 * @deprecated As of version 1.117
		 */
		if (this._oTable.setShowColumnVisibilityMenu) {
			this._oTable.setShowColumnVisibilityMenu(false);
		}

		this._attachTableCustomFilter();

		// Replace the prototype methods to suit the table being used!
		if (this._isOfType(TableType.AnalyticalTable)) {
			this._createColumn = this._createAnalyticalColumn;
		} else if (this._isOfType(TableType.ResponsiveTable)) {
			// enable active headers for ResponsiveTable and attach columnPress event to it
			// active headers are only enabled if useTablePersonalisation=true
			if (this.getUseTablePersonalisation()) {
				this._oTable.bActiveHeaders = true;
				this._oTable.attachEvent("columnPress", this._onColumnPress, this);
			}
			this._sAggregation = "items";
			this._createColumn = this._createMobileColumn;
			// map bindItems to bindRows for Mobile Table to enable reuse of rebind mechanism
			this._oTable.bindRows = this._oTable.bindItems;
			// attach popinChanged event
			if (this.getShowDetailsButton()) {
				this._oTable.attachEvent("popinChanged", this._onPopinChanged, this);
			}
		}

		if (!this._isOfType(TableType.ResponsiveTable)) {
			this._oTable.attachRowsUpdated(function() {
				this._setExcelExportEnableState();
			}, this);
		}

		if (this._isOfType(TableType.AnalyticalTable)) {
			this._oTable.setProperty("extendedGroupHeaderMenu", false);
		}

		// Always enable the better scroll behaviour - so that scroll/data request only happens once scrollbar is released
		if (this._oTable._setLargeDataScrolling) {
			this._oTable._setLargeDataScrolling(true);
		}
		// Always attach to paste event of inner table
		this._oTable.attachPaste(this._onInnerTablePaste, this);
	};

	function setAutoRowMode(oGridTable) {
		/**
		 * @deprecated As of version 1.119
		 */
		if (oGridTable.setVisibleRowCountMode) {
			oGridTable.setVisibleRowCountMode("Auto");
			return;
		}

		oGridTable.setRowMode("Auto");
	}

	SmartTable.prototype.onAfterRendering = function(oEvent) {
		if (this.bFullScreen) {
			this._toggleFullScreen(false);
		}
	};

	/**
	 * Attaches the customFilter event of the inner table. Relevant for sap.ui.table.Table controls.
	 * @private
	 */
	SmartTable.prototype._attachTableCustomFilter = function() {
		// detach event before attaching
		if (this._oTable.detachCustomFilter) {
			this._oTable.detachCustomFilter(this._onCustomFilter, this);
		}

		if (this._oTable.getEnableCustomFilter && this._oTable.getEnableCustomFilter() && this._bIsFilterPanelEnabled) {
			// disable the cell filter if custom filter is enabled
			if (this._oTable.setEnableCellFilter) {
				this._oTable.setEnableCellFilter(false);
			}
			if (this._oTable.attachCustomFilter) {
				this._oTable.attachCustomFilter(this._onCustomFilter, this);
			}
		}
	};

	/**
	 * Create ResponsivePopover
	 *
	 * @param {boolean} bResizeButton Defines if a resize button will be added to the <code>ColumnMenu</code>
	 * @private
	 */
	SmartTable.prototype._createResponsivePopover = function(bResizeButton) {
		this._oFilterButton = new ColumnPopoverActionItem({
			text: Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_RP_FILTER"),
			icon: "sap-icon://filter",
			press: [
				function(oEvent) {
					this._onCustomFilter(oEvent);
				}, this
			]
		});
		var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
		this._aSortButton = [
			new ColumnPopoverSelectListItem({
				label: oResourceBundle.getText("SMARTTABLE_RP_SORT_ASCENDING"),
				icon: "sap-icon://sort-ascending",
				action: [true, this._onCustomSort, this]
			}),
			new ColumnPopoverSelectListItem({
				label: oResourceBundle.getText("SMARTTABLE_RP_SORT_DESCENDING"),
				icon: "sap-icon://sort-descending",
				action: [false, this._onCustomSort, this]
			})
		];

		this._oColumnHeaderPopover = new ColumnHeaderPopover({
			items: [
				this._aSortButton, this._oFilterButton
			]
		});

		if (bResizeButton) {
			this._oColumnHeaderPopover.addItem(new ColumnPopoverActionItem({
				text: Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_RP_RESIZE"),
				icon: "sap-icon://resize-horizontal",
				press: [function() {
					ColumnResizer.getPlugin(this._oTable).startResizing(this._oColumnClicked.getDomRef());
				}, this]
			}));
		}
	};

	/**
	 * Create ColumnMenu
	 *
	 * @param {sap.ui.base.Event} oEvent ColumnMenu beforeOpen event object
	 * @private
	 */
	SmartTable.prototype._createColumnMenuContent = function(oEvent) {
		var oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
		var oColumn = oEvent.getParameter("openBy");
		var oColumnInfo = oColumn.data("p13nData");
		var oShowEntry;

		var bResizeButton = window.matchMedia("(hover:none)").matches && this._isOfType(TableType.ResponsiveTable) && this.getEnableAutoColumnWidth();

		this._oColumnClicked = oColumn;
		this._oColumnHeaderPopover.removeAllAggregation("quickActions");

		if (!this._bMissingColumnsCreated) {
			// if personalization is active, we need to request the missing columns via personalization, otherwise it does not work
			this._oPersController?.preparePersonalization();
			this._bMissingColumnsCreated = true;
		}

		if (this.getUseTablePersonalisation()) {
			oShowEntry = this._mMenuShowEntryMap.get(oColumn);
			if (this._bIsSortPanelEnabled && (this._isOfType(TableType.ResponsiveTable) || !this._aExistingColumns.includes(oColumnInfo.columnKey) || (oShowEntry && oShowEntry.sort))) {
				if (!this._oQuickSort) {
					this._oQuickSort = this._createQuickSort(oColumn);
				}
				this._updateQuickSort(oColumn);
				this._oColumnHeaderPopover.addQuickAction(this._oQuickSort);
			}

			if (this._bIsGroupPanelEnabled && this._isOfType(TableType.ResponsiveTable)) {
				if (!this._oQuickGroup) {
					this._oQuickGroup = this._createQuickGroup(oColumn);
				}
				this._updateQuickGroup(oColumn);
				this._oColumnHeaderPopover.addQuickAction(this._oQuickGroup);
			}

			if (bResizeButton) {
				if (!this._oQuickResize) {
					this._oQuickResize = this._createQuickResize(oResourceBundle);
				}
				this._oColumnHeaderPopover.addQuickAction(this._oQuickResize);
			}
		}
	};

	SmartTable.prototype._showTableP13nDialog = function(oEvent) {
		if (!this._bPersDialogOpen) {
			this._oPersController?.openDialog({filter: {payload: {column: this._oColumnClicked}}});
		}
	};

	SmartTable.prototype._createQuickGroup = function(oColumn) {
		return new QuickGroup({
			items: [],
			change: [
				function (oEvent) {
					var oItem = oEvent.getParameter("item"),
						oColumn = this._getColumnFromP13nMap(oItem.getKey());

					if (!oColumn) {
						return;
					}

					this._onCustomGroup(oEvent, oItem.getGrouped(), oColumn);
				}, this
			]
		});
	};

	SmartTable.prototype._createQuickSort = function(oColumn) {
		return new QuickSort({
			items: [],
			change: [
				function (oEvent) {
					var oItem = oEvent.getParameter("item"),
						oSortOrder = oItem.getSortOrder(),
						oColumn = this._getColumnFromP13nMap(oItem.getKey());

					if (!oColumn) {
						return;
					}

					if (oSortOrder === SortOrder.None) {
						var oColumnInfo = oColumn.data("p13nData");
						this._onCustomSort(oEvent, oColumnInfo.sorted && oColumnInfo.sorted.ascending, oColumn);
					} else {
						this._onCustomSort(oEvent, oSortOrder === SortOrder.Ascending, oColumn);
					}
				}, this
			]
		});
	};

	SmartTable.prototype._updateQuickGroup = function(oColumn) {
		var oColumnInfo = oColumn.data("p13nData");
		var oAdditionalPropertyColumn;

		this._oQuickGroup.destroyItems();

		if (oColumnInfo.unit || oColumnInfo.displayBehaviour !== "descriptionOnly") {
			var sSortProperty = this._getColumnSortProperty(oColumn);
			oAdditionalPropertyColumn = this._getColumnFromP13nMap(sSortProperty);
			if (sSortProperty && oAdditionalPropertyColumn) {
				this._oQuickGroup.addItem(new QuickGroupItem({
					key: sSortProperty,
					label: this._getColumnLabel(oColumn),
					grouped: oColumnInfo.grouped
				}));
			}
		}
		if (oColumnInfo.displayBehaviour !== "idOnly" && oColumnInfo.description) {
			oAdditionalPropertyColumn = this._getColumnFromP13nMap(oColumnInfo.description);
			if (oAdditionalPropertyColumn) {
				this._oQuickGroup.addItem(new QuickGroupItem({
					key: oColumnInfo.description,
					label: this._getColumnLabel(oAdditionalPropertyColumn),
					grouped: oAdditionalPropertyColumn.data("p13nData").grouped
				}));
			}
		}
		if (oColumnInfo.unit) {
			oAdditionalPropertyColumn = this._getColumnFromP13nMap(oColumnInfo.unit);
			if (oAdditionalPropertyColumn) {
				this._oQuickGroup.addItem(new QuickGroupItem({
					key: oColumnInfo.unit,
					label: this._getColumnLabel(oAdditionalPropertyColumn),
					grouped: oAdditionalPropertyColumn.data("p13nData").grouped
				}));
			}
		}
	};

	SmartTable.prototype._updateQuickSort = function(oColumn) {
		var oColumnInfo = oColumn.data("p13nData");
		var oAdditionalPropertyColumn;

		this._oQuickSort.destroyItems();

		if (oColumnInfo.unit || oColumnInfo.displayBehaviour !== "descriptionOnly") {
			var sSortProperty = this._getColumnSortProperty(oColumn);
			oAdditionalPropertyColumn = this._getColumnFromP13nMap(sSortProperty);
			if (sSortProperty && oAdditionalPropertyColumn) {
				this._oQuickSort.addItem(new QuickSortItem({
					key: sSortProperty,
					label: this._getColumnLabel(oColumn),
					sortOrder: getSortOrder(oAdditionalPropertyColumn.data("p13nData"))
				}));
			}
		}
		if (oColumnInfo.displayBehaviour !== "idOnly" && oColumnInfo.description) {
			// _getColumnByKey checks only the visible columns which might be insufficient when the additionalProperty column is not displayed as a separate column
			oAdditionalPropertyColumn = this._getColumnFromP13nMap(oColumnInfo.description);
			if (oAdditionalPropertyColumn && this._getColumnSortProperty(oAdditionalPropertyColumn)) {
				this._oQuickSort.addItem(new QuickSortItem({
					key: oColumnInfo.description,
					label: this._getColumnLabel(oAdditionalPropertyColumn),
					sortOrder: getSortOrder(oAdditionalPropertyColumn.data("p13nData"))
				}));
			}
		}
		if (oColumnInfo.unit) {
			oAdditionalPropertyColumn = this._getColumnFromP13nMap(oColumnInfo.unit);
			if (oAdditionalPropertyColumn && this._getColumnSortProperty(oAdditionalPropertyColumn)) {
				this._oQuickSort.addItem(new QuickSortItem({
					key: oColumnInfo.unit,
					label: this._getColumnLabel(oAdditionalPropertyColumn),
					sortOrder: getSortOrder(oAdditionalPropertyColumn.data("p13nData"))
				}));
			}
		}

		if (oColumnInfo.additionalProperty && oColumnInfo.additionalSortProperty) {
			var aAdditionalProperties = oColumnInfo.additionalProperty.split(",");
			var aSortProperties = oColumnInfo.additionalSortProperty.split(",");
			aSortProperties.forEach(function(sSortProperty) {
				sSortProperty = sSortProperty.trim();
				if (aAdditionalProperties.indexOf(sSortProperty) === -1) {
					return;
				}
				oAdditionalPropertyColumn = this._getColumnFromP13nMap(sSortProperty);
				if (oAdditionalPropertyColumn && this._getColumnSortProperty(oAdditionalPropertyColumn)) {
					this._oQuickSort.addItem(new QuickSortItem({
						key: sSortProperty,
						label: this._getColumnLabel(oAdditionalPropertyColumn),
						sortOrder: getSortOrder(oAdditionalPropertyColumn.data("p13nData"))
					}));
				}
			}.bind(this));
		}
	};

	/**
	 * Returns the sort property of the given <code>Columny</code>
	 *
	 * @param {sap.ui.core.Element} oColumn Table column that will be evaluated for its sort property
	 * @returns {string} Sort property of the column
	 */
	SmartTable.prototype._getColumnSortProperty = function(oColumn) {
		let sSortProperty = oColumn?.getSortProperty?.();

		sSortProperty = oColumn?.data("p13nData")?.sortProperty || sSortProperty;

		return sSortProperty ?? "";
	};

	SmartTable.prototype._createQuickResize = function(oResourceBundle) {
		return new QuickAction({
			label: oResourceBundle.getText("SMARTTABLE_RP_RESIZE"),
			content: new Button({
				icon: "sap-icon://resize-horizontal",
				press: [function() {
					this._oColumnHeaderPopover.close();
					ColumnResizer.getPlugin(this._oTable).startResizing(this._oColumnClicked.getDomRef());
				}, this]
			})
		});
	};

	function getSortOrder(oColumnInfo) {
		var sSortOrder = SortOrder.None;
		if (oColumnInfo.sorted) {
			sSortOrder = oColumnInfo.sorted.ascending ? SortOrder.Ascending : SortOrder.Descending;
		}
		return sSortOrder;
	}

	/**
	 * Event handler for the "columnPress" event of the Responsive Table.
	 *
	 * @param {object} oEvent The event object
	 * @private
	 */
	SmartTable.prototype._onColumnPress = function(oEvent) {
		if (!this._bUseLegacyMenu) {
			return;
		}

		this._oColumnClicked = oEvent.getParameter("column");
		var oColumnData = this._oColumnClicked.data("p13nData");
		var bResizeButton = window.matchMedia("(hover:none)").matches && this._isOfType(TableType.ResponsiveTable) && this.getEnableAutoColumnWidth();
		if (!oColumnData && !bResizeButton) {
			return;
		}

		var sFilterProperty = oColumnData.filterProperty;
		var sSortProperty = oColumnData.sortProperty;

		if (!this._oColumnHeaderPopover) {
			this._createResponsivePopover(bResizeButton);
		}

		// hide filter & sort button in the popover if filter & sort panel are disabled in p13nDialog
		this._oFilterButton.setVisible(!!sFilterProperty && this._bIsFilterPanelEnabled);
		var bSortButtonVisible = !!sSortProperty && this._bIsSortPanelEnabled;
		this._aSortButton.forEach(function (oItem) {
			oItem.setVisible(bSortButtonVisible);
		});

		if ((sFilterProperty && this._bIsFilterPanelEnabled) || (sSortProperty && this._bIsSortPanelEnabled) || bResizeButton) {
			this._oColumnHeaderPopover.removeAllAriaLabelledBy();
			this._oColumnHeaderPopover.addAriaLabelledBy(this._oColumnClicked.getHeader());
			this._oColumnHeaderPopover.openBy(this._oColumnClicked);
		}
	};

	/**
	 * Event handler when the custom sort is triggered. Handler is only used in case of Responsive table
	 *
	 * @param {sap.ui.base.Event} oEvent event instance
	 * @param {boolean} bAscend sorted in ascending order (true) or is descending order (false)
	 * @param {sap.m.Column} oColumn column instance
	 * @private
	 */
	SmartTable.prototype._onCustomSort = function(oEvent, bAscend, oColumn) {
		if (!oColumn) {
			oColumn = this._oColumnClicked;
		}
		var oColumnData = oColumn.data("p13nData");
		var oSorted, sSortOrder;
		if (oColumnData) {
			if (oColumnData.sorted && oColumnData.sorted.ascending === bAscend) {
				delete oColumnData.sorted;
				sSortOrder = SortOrder.None;
				if (this._isOfType(TableType.ResponsiveTable)) {
					oColumn.setSortIndicator(sSortOrder);
				}
			} else {
				oColumnData.sorted = {
					"ascending": bAscend
				};
				oSorted = oColumnData.sorted;
				sSortOrder = (oSorted && oSorted.ascending) ? SortOrder.Ascending : SortOrder.Descending;
			}
			var sEventName = this._isOfType(TableType.ResponsiveTable) ? "_sort" : "sort";
			this._oTable.fireEvent(sEventName, {
				column: oColumn,
				sortOrder: sSortOrder,
				columnAdded: false
			});
		}
	};

	SmartTable.prototype._onCustomGroup = function(oEvent, isGrouped, oColumn) {
		if (!oColumn) {
			oColumn = this._oColumnClicked;
		}
		var oColumnData = oColumn.data("p13nData");
		if (oColumnData) {
			oColumnData.grouped = isGrouped;

			this._oTable.fireEvent("_group", {
				groupedColumns: (isGrouped ? [oColumn] : [])
			});
		}
	};

	/**
	 * Event handler when the custom filter is triggered.
	 *
	 * @param {object} oEvent event object
	 * @private
	 */
	SmartTable.prototype._onCustomFilter = function(oEvent) {
		this._showTableFilterDialog(oEvent.getParameter("column") || this._oColumnClicked);
	};

	/**
	 * Event handler when the table pop-in has changed.
	 *
	 * @param {sap.ui.base.Event} oEvent - fired event object
	 * @private
	 */
	SmartTable.prototype._onPopinChanged = function(oEvent) {
		if (!this._oShowHideDetailsButton) {
			this._createShowHideDetailsButton();
		}

		var aVisibleInPopin = oEvent.getParameter("visibleInPopin");
		var aHiddenInPopin = oEvent.getParameter("hiddenInPopin");
		var aItems = oEvent.getSource().getVisibleItems();
		var bContainsHiddenInPopinColumns = aVisibleInPopin.some(function(oPopin) {
			return this._getImportanceToHide().indexOf(oPopin.getImportance()) > -1;
		}, this);

		if (aItems.length && (aHiddenInPopin.length || bContainsHiddenInPopinColumns)) {
			this._oShowHideDetailsButton.setVisible(true);
		} else {
			this._oShowHideDetailsButton.setVisible(false);
		}
	};

	/**
	 * Returns the internally used table control.
	 * Depending on the concrete scenario, the return type is a <code>sap.m.Table</code>, <code>sap.ui.table.Table</code>,
	 * <code>sap.ui.table.TreeTable</code>, or <code>sap.ui.table.AnalyticalTable</code>.
	 *
	 * If the internal table has not been initialized, the function returns <code>undefined</code>.
	 *
	 * @public
	 * @returns {sap.ui.core.Control|undefined} The table instance or undefined
	 */
	SmartTable.prototype.getTable = function() {
		if (!this._oTable) {
			const oTable = this.getItems().find((oItem) => oItem instanceof Table || oItem instanceof ResponsiveTable);

			if (!oTable) {
				return undefined;
			} else if (oTable instanceof AnalyticalTable) {
				this.setProperty("tableType", TableType.AnalyticalTable, true);
			} else if (oTable instanceof ResponsiveTable) {
				this.setProperty("tableType", TableType.ResponsiveTable, true);
				this._oTemplate = oTable.getItems()?.length > 0 ? oTable.getItems()[0] : new ColumnListItem();
				oTable.removeAllItems();
			} else if (oTable instanceof TreeTable) {
				this.setProperty("tableType", TableType.TreeTable, true);
			} else {
				this.setProperty("tableType", TableType.Table, true);
			}

			this._oTable = oTable;

			// Determine which columns already exist (custom columns)
			this._updateInitialColumns();
		}

		return this._oTable;
	};

	/**
	 * Shows the filter dialog via the Personalisation controller
	 *
	 * @private
	 */
	SmartTable.prototype._showTableFilterDialog = function() {
		if (this._oPersController) {
			var mP13nSettings = {useAvailablePanels: false, filter: {visible: true}};
			this._oPersController.openDialog(mP13nSettings);
		}
	};

	/**
	 * Calculates the column width from the metadata attributes.
	 *
	 * The optimal column width is calculated with creating the longest possible sample of the created model type.
	 * Afterwards it is formatted to string while taking the constraints and format options into account, and then measured over canvas.
	 *
	 * @param {object} oField  OData metadata for the table field
	 * @param {boolean} [bAdditionalProperty=false] Whether the calcuation of additional or leading property
	 * @param {object|boolean} [mConfig] The configuration object
	 * @param {int} [mConfig.min=2] The minimum content width of the column in rem
	 * @param {int} [mConfig.max=19] The maximum content width of the column in rem
	 * @param {boolean} [mConfig.label=true] Whether the column label should be taken into account as minimum column width or not
	 * @param {int} [mConfig.defaultWidth=8] The default column content width when type check fails or field metadata info not found
	 * @param {float} [mConfig.padding=1] The additional padding added to the content width calculation of the column to find the outer width of the column that can be used for the <code>width</code> property
	 * @param {float} [mConfig.gap=0] The additional width added to the width calculation of the column
	 * @param {boolean} [mConfig.truncateLabel=true] Whether the column header is truncated when it is much bigger than the content.
	 * @returns {float} The calculated width of the column converted to rem
	 * @private
	 */
	SmartTable.prototype._calcColumnWidth = function(oField, bAdditionalProperty, mConfig) {
		var bReturnDefaultWidth;

		// return defaultWidth, in case autoColumnWidth: false is specified for a field
		if (mConfig === false) {
			bReturnDefaultWidth = true;
		}

		mConfig = Object.assign({
			label: bAdditionalProperty ? false : true,
			defaultWidth: bAdditionalProperty ? 4 : 8,
			padding: this._fColumnPaddingBorder
		}, mConfig);

		if (!oField || bReturnDefaultWidth) {
			return mConfig.defaultWidth;
		}

		var fWidth = 0,
			fLabelWidth = 0,
			iMin = Math.max(mConfig.min || 0, (bAdditionalProperty ? 1 : 2)),
			iMax = Math.max(iMin, mConfig.max || 19),
			sAdditionalProperty = oField.additionalProperty || "",
			sDisplayBehaviour = oField.displayBehaviour,
			oModelType = oField.modelType,
			sType = oField.type || "";

		if (iMax < iMin) {
			return iMax;
		}

		if (bAdditionalProperty || oField.unit || !sAdditionalProperty || sDisplayBehaviour != "descriptionOnly") {
			if (oField.isImageURL || sType == "Edm.Byte" || sType == "Edm.SByte") {
				fWidth += iMin;
			} else if (oModelType) {
				fWidth += TableUtil.calcTypeWidth(oModelType, {
					defaultWidth: mConfig.defaultWidth,
					maxWidth: mConfig.max
				});
			} else {
				fWidth += mConfig.defaultWidth;
			}
		}

		// first column of the TreeTable has expand/collapse icons we should ensure at least 2 levels be visible
		if (this._isOfType(TableType.TreeTable) && oField.hierarchy && oField.index == 0) {
			fWidth += 3;
		}

		// store the calculated content width of the field itself
		if (!bAdditionalProperty) {
			oField.ownWidth = fWidth = Math.min(fWidth, iMax);
		}

		// If there is an additionalProperty exists in a field then this means there are other fields need to be shown in the column.
		// For idOnly and descriptionOnly cases, the leadingProperty is always the "id" and the "description" will always be part of the additionalProperty.
		// Therefore if the display behaviour is "idOnly" then the calculation for additionalProperty can be skipped
		if (!bAdditionalProperty && sDisplayBehaviour != "idOnly" && sAdditionalProperty && this._oTableProvider && fWidth < iMax) {
			sAdditionalProperty.split(",").forEach(function(sAdditionalProperty) {
				// fieldControlProperty has no representation that can occupy space in the column
				if (sAdditionalProperty == oField.fieldControlProperty) {
					return;
				}

				// get the metadate of the additional field (including navigation properties) to calculate
				var mAdditionalField = this._oTableProvider.getFieldMetadata(sAdditionalProperty);

				// for horizontal templates the additional value is shown within parenthesis therefore we spare some px
				// for vertical templates we do not need to take the padding into account
				var mAdditionalConfig = Object.assign({
					padding: 0.4,
					max: iMax - fWidth - 0.4
				}, oField.vertical && {
					padding: 0,
					max: iMax
				});

				// min width for the units
				if (sAdditionalProperty == oField.unit) {
					mAdditionalConfig.min = 3;
				}

				var fAdditionalWidth = this._calcColumnWidth(mAdditionalField, true, mAdditionalConfig);
				if (oField.vertical) {
					fWidth = Math.max(fAdditionalWidth, fWidth); // for vertical templates we take the longest one as a column width
				} else {
					fWidth += fAdditionalWidth; // for horizontal templates we sum additional fields to find the column width
				}
			}, this);

			// For descriptionOnly cases, additionalProperty defines the content width of the field itself
			if (sDisplayBehaviour == "descriptionOnly") {
				oField.ownWidth = fWidth;
			} else {
				// store the additional width calculation of the field
				oField.additionalWidth = fWidth - oField.ownWidth;
			}
		}

		// additional width for the content should not be taken into account before the label calculation
		fWidth = fWidth + (mConfig.gap || 0);

		// The column label width is taken into account as minimun column width
		// For additional fields we should not take the label length as minimum width since this must be done for the leading property
		if (mConfig.label) {
			var sLabel = oField.label || oField.fieldLabel || "";
			oField.labelWidth = fLabelWidth = TableUtil.calcHeaderWidth(sLabel, (mConfig.truncateLabel != false ? fWidth : 0), iMax, iMin);
		}

		fWidth = Math.max(iMin, fWidth, fLabelWidth);
		fWidth = Math.min(fWidth, iMax) + mConfig.padding;
		fWidth = Math.round(fWidth * 100) / 100;
		return fWidth;
	};

	/**
	 * Returns the relevant autoColumnWidth config for the enableAutoColumnWidth calculation.
	 * @param {object} oField the field metadata
	 * @returns {null|object} the autoColumnWidth for the provided field
	 * @private
	 */
	SmartTable.prototype._fetchAutoColumnWidthConfig = function(oField) {
		var vAutoColumnWidthConfig = null;

		if (this._oCustomizeConfigAutoColumnWidth) {
			if (this._oCustomizeConfigAutoColumnWidth.hasOwnProperty(oField.name)) {
				vAutoColumnWidthConfig = this._oCustomizeConfigAutoColumnWidth[oField.name];
			} else if (this._oCustomizeConfigAutoColumnWidth.hasOwnProperty("*")) {
				vAutoColumnWidthConfig = this._oCustomizeConfigAutoColumnWidth["*"];
			}
		}

		if (vAutoColumnWidthConfig && vAutoColumnWidthConfig === true) {
			// if config has a boolean value "true" then simply return null as the normal execution of the algorithm will provide the expected result
			vAutoColumnWidthConfig = null;
		}

		return vAutoColumnWidthConfig;
	};

	/**
	 * Returns the configuration for annotation based flex change delegates.
	 *
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @since 1.135
	 */
	SmartTable.prototype.getFlexConfig = function() {
		if (this.isInitialised()) {
			return {
				entitySetName: this.getEntitySet()
			};
		}
	};

	/**
	 * Sets the width for a custom column if the metadata has been
	 * initialized, autoColumnWidth property of p13nData is set, the
	 * width property of the custom columnn is in default value.
	 *
	 * @param {sap.ui.core.Element} oColumn Custom column for width adjustment
	 * @private
	 */
	SmartTable.prototype._setWidthForCustomColumn = function(oColumn) {
		var oColumnData = oColumn.data("p13nData");
		if (!this._oTableProvider || !oColumnData || !oColumnData.autoColumnWidth || oColumn.getWidth()) {
			return;
		}

		var vAutoColumnWidth = oColumnData.autoColumnWidth;
		var bOverrideAdditionalProperty = vAutoColumnWidth.visibleProperty || typeof oColumnData.additionalProperty === "string";
		var sVisibleProperty = vAutoColumnWidth.visibleProperty || [this._getColumnLeadingProperty(oColumn, oColumnData), oColumnData.additionalProperty].join(",");
		var aVisibleProperty = sVisibleProperty.split(",");
		var oField = this._oTableProvider.getFieldMetadata(aVisibleProperty.shift(), true);
		if (!oField) {
			return;
		}

		var oTempField = Object.assign({}, oField);
		oTempField.label = this._getColumnLabel(oColumn);
		if (bOverrideAdditionalProperty) {
			oTempField.additionalProperty = aVisibleProperty ? aVisibleProperty.join(",") : "";
		}

		var fWidth = this._calcColumnWidth(oTempField, false, {
			truncateLabel: vAutoColumnWidth.truncateLabel,
			min: vAutoColumnWidth.min,
			max: vAutoColumnWidth.max,
			gap: vAutoColumnWidth.gap
		});

		oField.width = fWidth + "rem";
		oColumn.setWidth(oField.width);

		if (this.getEditable()) {
			this._updateColumnWidthForEdit(oColumn, oField, vAutoColumnWidth);
		}
	};

	/**
	 * Ensures the min column width while switching between display and edit mode.
	 *
	 * @param {sap.ui.core.Element} oColumn  The column instance
	 * @param {object} oField  OData metadata that belongs to column
	 * @private
	 */
	SmartTable.prototype._updateColumnWidthForEdit = function(oColumn, oField) {
		// we ignore editable/non-editable width calculation if
		//  - there is no field metadata found or if it is a custom column
		//  - boolean type create checkbox to edit which always fits to min column width
		//  - for semantic objects smart link will be created which is not editable
		if (!oField || !oField.isColumnCreated || oField.type == "Edm.Boolean" || oField.semanticObjects) {
			return;
		}

		// SmartToggle does not take sap:updatable into account but SmartField honor this annotation
		// to determine editable, if a field is never editable then there is no need to recalculate the width
		var bSmartField = this.data("useSmartField") == "true" || this.data("useSmartField") === true;
		if (bSmartField && oField["sap:updatable"] == "false") {
			return;
		}

		// when switched between editable and display mode we need to switch editable column width and
		// display column width but this should only be done if the user did not make any column resizing
		var sColumnWidth = oColumn.getWidth();
		if (!this.getEditable()) {
			if (oField.editWidth == sColumnWidth) { // ensure that there is no column width change in edit mode
				oColumn.setWidth(oField.width);
			}
		} else if (oField.width == sColumnWidth) { // ensure that there is no column width change in display mode

			// if edit width is already calculated then we do not need to recalculate again
			if (oField.editWidth) {
				oColumn.setWidth(oField.editWidth);
				return;
			}

			// calculate the minimum editable column width from the InputBase theme parameters and cache
			// we basically have input/textarea fields without icon or combobox, valuehelp, date/time pickers with icon
			if (!this._aEditableColumnAdditionalWidth) {
				var fEditableColumnAdditionalWidth = this._fColumnPaddingBorder;
				var sCompact = this.$().closest(".sapUiSizeCompact").length ? "_Compact" : "";

				var oParams = Object.assign({
					_sap_m_InputBase_IconWidth: "2.375rem",
					_sap_m_InputBase_Compact_IconWidth: "2rem",
					_sap_m_InputBaseWrapper_Sum_Border: "0.125rem",
					_sap_m_InputBase_InnerPadding: "0 0.75rem",
					_sap_m_InputBase_Compact_InnerPadding: "0 0.5rem"
				 }, ThemeParameters.get({
					name: [
						"_sap_m_InputBase_IconWidth",
						"_sap_m_InputBase_Compact_IconWidth",
						"_sap_m_InputBaseWrapper_Sum_Border",
						"_sap_m_InputBase_InnerPadding",
						"_sap_m_InputBase_Compact_InnerPadding"
					],
					callback: function(mParams) {
					   // merge the current parameters with the actual parameters in case they are retrieved asynchronously
					   Object.assign(oParams, mParams);
					}
				 }));

				var fIconWidth = parseFloat(oParams["_sap_m_InputBase" + sCompact + "_IconWidth"]);
				fEditableColumnAdditionalWidth += parseFloat(oParams["_sap_m_InputBaseWrapper_Sum_Border"]);
				fEditableColumnAdditionalWidth += parseFloat(oParams["_sap_m_InputBase" + sCompact + "_InnerPadding"].split(" ").pop()) * 2;
				this._aEditableColumnAdditionalWidth = [fEditableColumnAdditionalWidth, fEditableColumnAdditionalWidth + fIconWidth - 0.25];
			}

			// determines whether displayFormat includes id and description together
			var bDisplayIdAndDescription = (oField.displayBehaviour || "").includes("And");
			var fColumnLabelWidth = (oField.labelWidth || 0) + this._fColumnPaddingBorder;

			// if the value list annotation has not fixed values then SmartField shows only the id field in edit case this means we can chop the additional width
			if (bSmartField && bDisplayIdAndDescription && oField.additionalWidth && oField.hasValueListAnnotation && !oField.hasFixedValues) {
				oField.editWidth = Math.max(oField.ownWidth + this._aEditableColumnAdditionalWidth[1], fColumnLabelWidth) + "rem";
				oColumn.setWidth(oField.editWidth);
				return;
			}

			// determine whether editable template have input with icon or without
			var bDateTimeField = oField.isCalendarDate || ODataType.isDateOrTime(oField.type);
			var bInputWithIcon = oField.hasValueListAnnotation || bDateTimeField;
			var fMinEditableColumnWidth = this._aEditableColumnAdditionalWidth[+bInputWithIcon];

			// If the value list annotation has fixed values then SmartField can show id and description in edit case this means we can increase the content width a little bit more
			if (bSmartField && bDisplayIdAndDescription && !oField.additionalWidth && oField.hasValueListAnnotation && oField.hasFixedValues) {
				fMinEditableColumnWidth += oField.ownWidth + 3;
			} else if (oField.ownWidth < 4 || bDateTimeField) {
				// the content of the date and time fields are always large hence we ensure their content is fully visible
				// also we make the small content fields always visible, showing ellipsis for such small fields is not good.
				// the editable field with unit shows two inputs with a little gap, we should enlarge those small fields
				if (bSmartField && oField.unit) {
					fMinEditableColumnWidth =  oField.ownWidth + oField.additionalWidth + this._aEditableColumnAdditionalWidth[1];
				} else {
					fMinEditableColumnWidth += oField.ownWidth;
				}
			} else {
				fMinEditableColumnWidth += 2;
			}

			// ensure the max column width
			fMinEditableColumnWidth = Math.min(fMinEditableColumnWidth, 19);

			// ensure that minimum column width is set for the editable case
			var fColumnWidth = parseFloat(sColumnWidth);
			if (fColumnWidth < fMinEditableColumnWidth) {
				oField.editWidth = fMinEditableColumnWidth + "rem";
				oColumn.setWidth(oField.editWidth);
			}
		}
	};

	/**
	 * Ensures the min column width of all visible columns while switching between display and edit mode
	 *
	 * @private
	 */
	SmartTable.prototype._updateVisibleColumnsWidthForEdit = function() {
		if (!this._oTable || !this._oTableProvider || !this.getEnableAutoColumnWidth()) {
			return;
		}

		this._oTable.getColumns().filter((oColumn) => oColumn.getVisible()).forEach(function(oColumn) {
				var sLeadingProperty = this._getColumnLeadingProperty(oColumn);

				if (sLeadingProperty) {
					const oField = this._oTableProvider.getFieldMetadata(sLeadingProperty);
					this._updateColumnWidthForEdit(oColumn, oField);
				}
		}, this);
	};

	SmartTable.prototype._updateVariantManagement = function() {
		// Only sync VM, if it is not customly set
		if (this._oVariantManagement && !this.getSmartVariant()) {
			this._oVariantManagement.setShowAsText(!!this.getHeader());
			this._oVariantManagement.setHeaderLevel(this.getHeaderLevel());
			this._oVariantManagement.setTitleStyle(this.getHeaderStyle() || TitleLevel[ThemeParameters.get({name: "_sap_ui_comp_SmartTable_HeaderStyle"})]);
		}
	};

	/**
	 * Returns the tooltip to be used for a column depending on property useColumnLabelsAsTooltips.
	 *
	 * @param {*} oField Field metadata
	 * @returns {string} Tooltip of the given field
	 * @private
	 */
	SmartTable.prototype._getColumnTooltip = function(oField) {
		return this._bUseColumnLabelsAsTooltips ? (oField.quickInfo || oField.label) : oField.quickInfo;
	};

	/**
	 * Creates and returns a Column that can be added to the table, based on the metadata provided by the TableProvider
	 *
	 * @param {object} oField The column's metadata
	 * @param {string} sId The id to be set on the column
	 * @returns {object} the column that is created
	 * @private
	 */
	SmartTable.prototype._createColumn = function(oField, sId) {
		var oColumn = new Column(sId, {
			autoResizable: true,
			hAlign: oField.align,
			width: oField.width,
			visible: oField.isInitiallyVisible,
			label: new Label(sId + "-header", {
				textAlign: oField.align,
				text: oField.label
			}),
			/** @deprecated As of version 1.120 */
			sorted: oField.sorted,
			sortOrder: oField.sorted ? oField.sortOrder : SortOrder.None,
			tooltip: this._getColumnTooltip(oField),
			showSortMenuEntry: this._bUseLegacyMenu ? oField.sortable && this._bIsSortPanelEnabled : !this.getUseTablePersonalisation(),
			showFilterMenuEntry: this._bUseLegacyMenu ? oField.filterable && this._bIsFilterPanelEnabled : !this.getUseTablePersonalisation(),
			name: oField.fieldName,
			template: oField.template
		});

		if (!oField.width && this.getEnableAutoColumnWidth()) {
			var vFieldAutoColumnWidthConfig = this._fetchAutoColumnWidthConfig(oField);
			oColumn.setWidth(this._calcColumnWidth(oField, false, vFieldAutoColumnWidthConfig) + "rem");
		}

		return oColumn;
	};

	/**
	 * Creates and returns an AnalyticalColumn that can be added to the AnalyticalTable, based on the metadata provided by the TableProvider
	 *
	 * @param {object} oField The column's metadata
	 * @param {string} sId The id to be set on the column
	 * @private
	 * @returns {object} the column that is created
	 */
	SmartTable.prototype._createAnalyticalColumn = function(oField, sId) {
		if (oField.aggregationRole !== "measure" && oField.isMeasureField && oField.unit && oField.template.addStyleClass) {
			// Add special style class to hide sum for measure fields that have non-measure aggregation role
			oField.template.addStyleClass("sapUiAnalyticalTableSumCellHidden sapUiAnalyticalTableGroupCellHidden");
		} else if (oField.isCurrencyField && oField.template.addStyleClass) {
			// Add a special style class to make currency fields bold in sum/total row
			oField.template.addStyleClass("sapUiCompCurrencyBold");
		}

		// oMetaModel instance is required to resolve CodeList for group header
		var oModel = this.getModel(),
			oMetaModel = oModel && oModel.getMetaModel();

		var oColumn = new AnalyticalColumn(sId, {
			autoResizable: true,
			hAlign: oField.align,
			width: oField.width,
			visible: oField.isInitiallyVisible,
			inResult: oField.inResult,
			label: new Label(sId + "-header", {
				textAlign: oField.align,
				text: oField.label
			}),
			tooltip: this._getColumnTooltip(oField),
			/** @deprecated As of version 1.120 */
			sorted: oField.sorted,
			sortOrder: oField.sorted ? oField.sortOrder : SortOrder.None,
			grouped: oField.grouped,
			showIfGrouped: oField.grouped,
			showSortMenuEntry: this._bUseLegacyMenu ? oField.sortable && this._bIsSortPanelEnabled : !this.getUseTablePersonalisation(),
			showFilterMenuEntry: this._bUseLegacyMenu ? oField.filterable && this._bIsFilterPanelEnabled : !this.getUseTablePersonalisation(),
			summed: oField.summed,
			leadingProperty: oField.name,
			template: oField.template,
			groupHeaderFormatter: FormatUtil.getInlineGroupFormatterFunction(oField, true, this._getDateFormatSettings(), this._bPreserveDecimals, true /* bReplaceWhitespace */, oMetaModel)
		});

		if (!oField.width && this.getEnableAutoColumnWidth()) {
			var vFieldAutoColumnWidthConfig = this._fetchAutoColumnWidthConfig(oField);
			oColumn.setWidth(this._calcColumnWidth(oField, false, vFieldAutoColumnWidthConfig) + "rem");
		}

		return oColumn;
	};

	/**
	 * Creates and returns a MobileColumn that can be added to the mobile table, based on the metadata provided by the TableProvider
	 *
	 * @param {object} oField The column's metadata
	 * @param {string} sId The id to be set on the column
	 * @private
	 * @returns {object} the column that is created
	 */
	SmartTable.prototype._createMobileColumn = function(oField, sId) {
		var oColumn = new Column1(sId, {
			hAlign: oField.align,
			visible: oField.isInitiallyVisible,
			header: new Label(sId + "-header", {
				textAlign: oField.align,
				text: oField.label,
				tooltip: this._getColumnTooltip(oField),
				wrapping: !this.getEnableAutoColumnWidth(),
				wrappingType: MLibrary.WrappingType.Hyphenated
			}),
			tooltip: this._getColumnTooltip(oField)
		});

		if (oField.importance && !this._oTableProvider.isLineItemDefaultImportance(oField)) {
			oColumn.setImportance(oField.importance);
		}

		if (this._oTemplate) {
			this._oTemplate.addCell(oField.template);
		}

		if (oField.width) {
			return oColumn.setWidth(oField.width);
		}

		if (!this.getEnableAutoColumnWidth()) {
			return oColumn.setWidth(oField.isImageURL ? "3em" : "auto");
		}

		var vFieldAutoColumnWidthConfig = this._fetchAutoColumnWidthConfig(oField);
		return oColumn.setWidth(this._calcColumnWidth(oField, false, vFieldAutoColumnWidthConfig) + "rem");
	};

	/**
	 * Interface function for SmartVariantManagement control, returns the current used variant data
	 *
	 * @public
	 * @returns {object} The currently set variant
	 */
	SmartTable.prototype.fetchVariant = function() {
		if (this._oCurrentVariant === "STANDARD" || this._oCurrentVariant === null) {
			return {};
		}

		var oCurrentVariant = this._processDateFiltersForVariant(this._oCurrentVariant);

		return oCurrentVariant;
	};

	/**
	 * Interface function for SmartVariantManagement control, sets the current variant. <b>Note:</b> If an application default variant exists, then
	 * all other variants are extended from this application default variant.
	 *
	 * @param {object} oVariantJSON The variants json
	 * @param {string} sContext Describes the context in which the apply was executed
	 * @public
	 */
	SmartTable.prototype.applyVariant = function(oVariantJSON, sContext) {

		this._oCurrentVariant = oVariantJSON;
		if (this._oCurrentVariant === "STANDARD") {
			this._oCurrentVariant = null;
		}

		// Set instance flag to indicate that we are currently in the process of applying the changes
		this._bApplyingVariant = true;
		// Suppress refresh to prevent backend roundtrips
		if (this._oTable._setSuppressRefresh) {
			this._oTable._setSuppressRefresh(true);
		}

		if (this._oPersController) {
			if (this._oCurrentVariant === null || isEmptyObject(this._oCurrentVariant)) {
				this._oPersController.resetPersonalization("ResetFull");
			} else {
				this._oPersController.setPersonalizationData(this._oCurrentVariant, true);
			}
		}
		// Clear apply variant flag!
		this._bApplyingVariant = false;

		this.fireAfterVariantApply({
			currentVariantId: this.getCurrentVariantId(),
			variantContext: sContext
		});
	};

	SmartTable.prototype._processDateFiltersForVariant = function (oCurrentVariant) {
		if (!this._oPersController) {
			return oCurrentVariant;
		}

		var aDateFields = PersonalizationUtil.getColumnKeysOfType("date", this._oPersController.getColumnMap()),
			aTimeFields = PersonalizationUtil.getColumnKeysOfType("time", this._oPersController.getColumnMap());

		if (aDateFields.length === 0 || !(oCurrentVariant && oCurrentVariant.filter && oCurrentVariant.filter.filterItems)) {
			return oCurrentVariant;
		}

		var aNewFilterItems = oCurrentVariant.filter.filterItems.map(function (oFilterItem) {
			if (aDateFields.concat(aTimeFields).includes(oFilterItem.columnKey) &&
				this._oTableProvider && this._oTableProvider.getIsUTCDateHandlingEnabled()) {
				oFilterItem = Object.assign({}, oFilterItem);

				if (oFilterItem.value1 instanceof Date) {
					oFilterItem.value1 = DateTimeUtil.localToUtc(oFilterItem.value1).toISOString();
					oFilterItem.value1 = oFilterItem.value1.slice(0, -1);
				}

				if (oFilterItem.value2 instanceof Date) {
					oFilterItem.value2 = DateTimeUtil.localToUtc(oFilterItem.value2).toISOString();
					oFilterItem.value2 = oFilterItem.value2.slice(0, -1);
				}
			}

			return oFilterItem;
		}, this);

		oCurrentVariant = Object.assign({}, oCurrentVariant, {
			filter: Object.assign({}, oCurrentVariant.filter, { filterItems: aNewFilterItems })
		});

		return oCurrentVariant;
	};

	/**
	 * Interface function for SmartVariantManagement control. It indicates, that the variant management is fully initialized.
	 *
	 * @internal
	 */
	SmartTable.prototype.variantsInitialized = function() {
		this._bVariantInitialised = true;
		this._checkAndTriggerBinding();
	};

	/**
	 * Returns the current UI state of the <code>SmartTable</code> control.<br>
	 * <b>Note:</b><br>
	 * The following restrictions apply:
	 * <ul>
	 * <li>Visualizations can only be used to modify the visibility, order, and width of columns, the template or importance of the column cannot be changed</li>
	 * <li>MaxItems is not supported</li>
	 * <li>RequestAtLeast contains values that are combined from both the <code>SmartTable</code> control property and PresentationVariant
	 * annotation, but when it is updated it only affects the internal array. The property in the <code>SmartTable</code> stays the same as before</li>
	 * <li>Changes to RequestAtLeast alone will not lead to a new data request</li>
	 * <li>RequestAtLeast is not supported in <code>AnalyticalTable</code> scenario</li>
	 * <li>Support for column width changes is enabled as of version 1.98.</li>
	 * <li>Any other restrictions, like the ones mentioned in {@link sap.ui.comp.state.UIState}, also apply</li>
	 * </ul>
	 *
	 * @returns {sap.ui.comp.state.UIState} Current UI state
	 * @public
	 * @since 1.52
	 */
	SmartTable.prototype.getUiState = function() {
		const oUIStateP13n = this._oPersController ? this._oPersController.getDataSuiteFormatSnapshot() : null;

		return new UIState({
			presentationVariant: {
				SortOrder: oUIStateP13n ? oUIStateP13n.SortOrder : [],
				GroupBy: oUIStateP13n ? oUIStateP13n.GroupBy : [],
				Total: oUIStateP13n ? oUIStateP13n.Total : [],
				RequestAtLeast: this._getRequestAtLeastFields(),
				Visualizations: oUIStateP13n ? oUIStateP13n.Visualizations : []
			},
			selectionVariant: {
				SelectOptions: oUIStateP13n ? oUIStateP13n.SelectOptions : []
			},
			variantName: this.getCurrentVariantId(),
			tableSettings: {
				fixedColumnCount: this.getTable().getFixedColumnCount?.(),
				showDetails: this.getProperty("showDetails")
			}
		});
	};

	/**
	 * Replaces the current UI state of the <code>SmartTable</code> control with the data represented in {@link sap.ui.comp.state.UIState}.<br>
	 * <b>Note:</b><br>
	 * The following restrictions apply:
	 * <ul>
	 * <li>Visualizations can only be used to modify the visibility, order, and width of columns, the template or importance of the column cannot be changed</li>
	 * <li>MaxItems is not supported</li>
	 * <li>RequestAtLeast contains values that are combined from both the <code>SmartTable</code> control property and PresentationVariant
	 * annotation, but when it is updated it only affects the internal array. The property in the <code>SmartTable</code> stays the same as before</li>
	 * <li>Changes to RequestAtLeast alone will not lead to a new data request</li>
	 * <li>RequestAtLeast is not supported in <code>AnalyticalTable</code> scenario</li>
	 * <li>Support for column width changes is enabled as of version 1.98.</li>
	 * <li>Any other restrictions, like the ones mentioned in {@link sap.ui.comp.state.UIState}, also apply</li>
	 * </ul>
	 *
	 * @param {sap.ui.comp.state.UIState} oUIState the new representation of UI state
	 * @public
	 * @since 1.52
	 */
	SmartTable.prototype.setUiState = function(oUIState) {
		this._setUiState(oUIState, false);
	};

	/**
	 * Replaces the current UI state of the <code>SmartTable</code> control with the data represented in {@link sap.ui.comp.state.UIState}. The UI
	 * state is handled as a variant.<br>
	 * <b>Note:</b><br>
	 * The following restrictions apply:
	 * <ul>
	 * <li>Visualizations can only be used to modify the visibility and order of columns, the template or importance of the column cannot be changed</li>
	 * <li>MaxItems is not supported</li>
	 * <li>RequestAtLeast contains values that are combined from both the <code>SmartTable</code> control property and PresentationVariant
	 * annotation, but when it is updated it only affects the internal array. The property in the <code>SmartTable</code> stays the same as before</li>
	 * <li>Changes to RequestAtLeast alone will not lead to a new data request</li>
	 * <li>RequestAtLeast is not supported in <code>AnalyticalTable</code> scenario</li>
	 * <li>Any other restrictions, like the ones mentioned in {@link sap.ui.comp.state.UIState}, also apply</li>
	 * </ul>
	 *
	 * @param {sap.ui.comp.state.UIState} oUIState the new representation of UI state
	 * @private
	 * @since 1.54
	 */
	SmartTable.prototype.setUiStateAsVariant = function(oUIState, sContext) {
		this._setUiState(oUIState, true);

		if (this._oVariantManagement){
			this.fireAfterVariantApply({
				currentVariantId: this.getCurrentVariantId(),
				variantContext: sContext
			});
		}
	};

	SmartTable.prototype._setUiState = function(oUIState, bApplyAsVariant) {
		const aRequestAtLeast = oUIState.getPresentationVariant() && oUIState.getPresentationVariant().RequestAtLeast ? [].concat(oUIState.getPresentationVariant().RequestAtLeast) : [];
		const oTableSettings = oUIState.getTableSettings();

		if (!deepEqual(aRequestAtLeast, this._getRequestAtLeastFields())) {
			this._aAlwaysSelect = aRequestAtLeast;
		}

		if (this._oPersController) {
			const oDataSuiteSnapshot = merge({}, oUIState.getPresentationVariant(), oUIState.getSelectionVariant());

			if (bApplyAsVariant) {
				this._oPersController.setPersonalizationDataAsDataSuiteFormat(oDataSuiteSnapshot, true);
			} else {
				var oPersistentDataVariant = (this._oVariantManagement && oUIState.getVariantName()) ? this._oVariantManagement.getVariantContent(this, oUIState.getVariantName()) : {};

				if (oTableSettings) {
					oPersistentDataVariant.columns ??= {};
					oPersistentDataVariant.columns.showDetails = oTableSettings.showDetails;
					oPersistentDataVariant.columns.fixedColumnCount = oTableSettings.fixedColumnCount;
				}

				this._oPersController.setDataSuiteFormatSnapshot(oDataSuiteSnapshot, oPersistentDataVariant, true);
			}
		}
	};

	/**
	 * Returns an Array containing the RequestAtLeast fields that includes both "requestAtLeast" property and back-end annotation fields
	 *
	 * @private
	 * @returns {Array} an Array containing the RequestAtLeast fields
	 */
	SmartTable.prototype._getRequestAtLeastFields = function() {
		var sRequestAtLeastFields = this.getRequestAtLeastFields();
		var aAlwaysSelect = sRequestAtLeastFields ? sRequestAtLeastFields.split(",") : [];
		return aAlwaysSelect.concat(this._aAlwaysSelect);
	};

	/**
	 * Event handler fired when a column is requested by Personalisation/VariantManagement
	 *
	 * @param {object} oEvent The event parameter
	 */
	SmartTable.prototype._personalisationRequestColumns = function(oEvent) {
		var aColumnKeys = oEvent.getParameter("columnKeys"), sColumnKey, i, iLength, oField, oColumn, oColumnKey2ColumnMap = {};

		iLength = aColumnKeys.length;
		for (i = 0; i < iLength; i++) {
			sColumnKey = aColumnKeys[i];
			oField = this._mLazyColumnMap[sColumnKey];
			if (oField) {
				oColumn = this._createColumnForField(oField);
				if (this._isOfType(TableType.ResponsiveTable)) {
					// Add the column to the table
					this._oTable.addColumn(oColumn);
				}
				oColumnKey2ColumnMap[oField.name] = oColumn;
			}
		}

		this._oPersController.addColumns(oColumnKey2ColumnMap);
	};

	/**
	 * eventhandler fired before personalisation changes are applied to the table
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartTable.prototype._beforePersonalisationModelDataChange = function(oEvent) {
		this._aFilteredColumnsBeforePersonalisationDataChange = this._oCurrentVariant?.filter?.filterItems;
		// Suppress refresh to prevent backend roundtrips
		if (this._oTable.suspendUpdateAnalyticalInfo) {
			this._oTable.suspendUpdateAnalyticalInfo();
		}
	};

	/**
	 * eventhandler fired after personalisation changes are potentially applied to the table. Event will be fired before the event
	 * "afterP13nModelDataChange"
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartTable.prototype._afterPersonalisationModelDataChange = function(oEvent) {
		this._updateColumnsPopinFeature();
		// Updates the info toolbar for the SmartTable
		this._createInfoToolbar();
		// update visible columns width for edit case
		if (this.getEditable()) {
			this._updateVisibleColumnsWidthForEdit();
		}
	};

	/**
	 * eventhandler for personalisation changed
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartTable.prototype._personalisationModelDataChange = function(oEvent) {
		this._oCurrentVariant = oEvent.getParameter("persistentData");

		if (this._fGetDataForKeyUser) {
			this._fGetDataForKeyUser(this._createKeyUserChange());
		}

		var oChangeInfo = oEvent.getParameter("runtimeDeltaDataChangeType");
		var changeStatus = this._getChangeStatus(oChangeInfo);

		if (changeStatus === "Unchanged") {
			return;
		}

		if (!(this._bApplyingVariant || this._bDeactivatingColumns)) {
			if (!this.getUseVariantManagement()) {
				this._persistPersonalisation();
			} else if (this._oVariantManagement) {
				this._oVariantManagement.currentVariantSetModified(true);
			}
		}

		if (this._isTableBound()) {
			if (changeStatus === "ModelChanged") {
				if (oChangeInfo && oChangeInfo.columns === "ModelChanged") {
					this._bForceTableUpdate = true;
					var bEnableExpandedState;

					if (this._isOfType(TableType.ResponsiveTable) && this._oTable.getHiddenInPopin()) {
						bEnableExpandedState = oEvent.getParameter("runtimeDeltaData").columns.columnsItems.some(function(oColumnItem) {
							const oColumn = this._getColumnByKey(oColumnItem.columnKey);

							return oColumn && oColumnItem.visible ? this._oTable.getHiddenInPopin().includes(oColumn.getImportance()) : false;
						}, this);
					}

					if (bEnableExpandedState) {
						this.setShowDetails(true);
					}
				}
				// if table was bound already -and:
				// If a SmartFilter is associated with SmartTable - trigger search on the SmartFilter
				if (this._oSmartFilter) {
					this._oSmartFilter.search();
				} else {
					// Rebind Table only if data was set on it once or no smartFilter is attached!
					this._reBindTable(null);
				}
			} else if (changeStatus === "TableChanged" && this._isOfType(TableType.ResponsiveTable) && this.getEditable()) {
				// update the cell binding context of columns which are hidden, if there are validation errors in the MessageModel and SmartTable's editable===true, for the ResponsiveTable
				this._updateMobileHiddenCellBindingContext(oEvent);
			}
		}

		this._adaptCustomSort();
		this._adaptCustomGroup();

		// creates or updates the info toolbar for the SmartTable
		this._createInfoToolbar();

		// If required in future we can provide a reason for the state change
		this.fireUiStateChange(/* {reason: "string"} */);
	};

	/**
	 * Update the cell binding context of columns whose visibility changed to 'hidden' via the personalization model change in the Responsive table.
	 * These update is only necessary when the SmartTable's editable property is 'true' and 'validation' errors exists in the MessageModel
	 * @param {object} oEvent event parameter from the personalisationModelChange
	 * @private
	 */
	SmartTable.prototype._updateMobileHiddenCellBindingContext = function(oEvent) {
		var aMessageModelData = Messaging.getMessageModel().getData();
		if (!aMessageModelData.length) {
			return;
		}

		var aValidationMessages = aMessageModelData.filter(function(oMessage) {
			return oMessage.validation === true;
		});
		if (!aValidationMessages.length) {
			return;
		}

		// get all the column items for which visibility has been changed to visible===false
		var aColumnsItems = oEvent.getParameter("runtimeDeltaData").columns.columnsItems.filter(function(oRuntimeDelta) {
			return oRuntimeDelta.visible === false;
		});

		aColumnsItems.forEach(function(oColumnItem) {
			const oColumn = this._getColumnByKey(oColumnItem.columnKey);
			const oCell = this._oTemplate.getCells()[this._oTable.indexOfColumn(oColumn)];
			let sRelevantControlId;

			if (oCell.isA("sap.ui.comp.SmartToggle")) {
				// get the 'edit' control template if it is a SmartToggle control
				var oEditControl = oCell.getEdit();
				// the relevant cell control template against which the MessageModel should be changed
				sRelevantControlId = oEditControl.getId();
			} else {
				// the relevant cell control template against which the MessageModel should be changed
				sRelevantControlId = oCell.getId();
			}

			if (sRelevantControlId) {
				// find the Message which contains the sRelevantControlId as a substring of the Message's controlId property
				var oRelevantMessage = aMessageModelData.find(function(oMessage) {
					// includes(sRelevantControlId), is heuristic which might need to be enhanced in future.
					return oMessage.getControlId()?.includes(sRelevantControlId);
				});

				if (oRelevantMessage) {
					var oControl = Element.getElementById(oRelevantMessage.getControlId());
					if (oControl) {
						oControl.setBindingContext(null);
					}
				}
			}
		}, this);
	};

	SmartTable.prototype._updateSortIndicator = function(oColumn, sProperty, bMobileTable) {
		var aSortItems = this._getSortItemsFromVariant();
		var oSortItem = aSortItems.find(function (oItem) {
			return !!sProperty && oItem.sortProperty === sProperty;
		});

		if (oSortItem) {
			if (bMobileTable) {
				oColumn.setSortIndicator(oSortItem.operation);
			} else {
				/** @deprecated As of version 1.120 */
				oColumn.setSorted(true);
				oColumn.setSortOrder(oSortItem.operation);
			}

			return true;
		}

		if (!oColumn.data("p13nData").sorted) {
			if (bMobileTable) {
				oColumn.setSortIndicator(SortOrder.None);
			} else {
				/** @deprecated As of version 1.120 */
				oColumn.setSorted(false);
				oColumn.setSortOrder(SortOrder.None);
			}
		}

		return false;
	};

	/**
	 * Evaluates the sortItems of the current variant. Items which
	 * reference a Column that has no sortProperty will be ignored.
	 *
	 * @returns {Array} Array of sort items that contain a sortProperty and an operation
	 */
	SmartTable.prototype._getSortItemsFromVariant = function() {
		var sSortProperty, aSortItems = [];

		if (this._oCurrentVariant.sort && this._oCurrentVariant.sort.sortItems) {
			this._oCurrentVariant.sort.sortItems.forEach(function(oSortItem) {
				sSortProperty = this._getColumnSortProperty(this._getColumnByKey(oSortItem.columnKey));
				if (sSortProperty) {
					aSortItems.push({sortProperty: sSortProperty, operation: oSortItem.operation});
				}
			}, this);
		}
		return aSortItems;
	};

	SmartTable.prototype._adaptAdditionalProperties = function(oColumn) {
		const bIsMobileTable = this._isOfType(TableType.ResponsiveTable);
		var oColumnData = oColumn.data("p13nData"), sAdditionalSortProperty;

		if (oColumnData.unit || oColumnData.displayBehaviour !== "descriptionOnly") {
			sAdditionalSortProperty = this._getColumnSortProperty(oColumn);
			this._updateSortIndicator(oColumn, sAdditionalSortProperty, bIsMobileTable);
		}
		if (oColumnData.displayBehaviour !== "idOnly" && oColumnData.description) {
			const oAdditionalPropertyColumn = this._getColumnFromP13nMap(oColumnData.description);
			if (this._getColumnSortProperty(oAdditionalPropertyColumn)) {
				sAdditionalSortProperty = oColumnData.description;
				this._updateSortIndicator(oColumn, sAdditionalSortProperty, bIsMobileTable);
			}
		}
		if (oColumnData.unit) {
			const oAdditionalPropertyColumn = this._getColumnFromP13nMap(oColumnData.unit);
			if (this._getColumnSortProperty(oAdditionalPropertyColumn)) {
				sAdditionalSortProperty = oColumnData.unit;
				this._updateSortIndicator(oColumn, sAdditionalSortProperty, bIsMobileTable);
			}
		}

		if (oColumnData.additionalProperty && oColumnData.additionalSortProperty) {
			const aAdditionalProperties = oColumnData.additionalProperty.split(",");
			const aSortProperties = oColumnData.additionalSortProperty.split(",");

			aSortProperties.every(function(sSortProperty) {
				if (aAdditionalProperties.indexOf(sSortProperty) === -1) {
					return false;
				}
				return !this._updateSortIndicator(oColumn, sSortProperty, bIsMobileTable);
			}.bind(this));
		}
	};

	SmartTable.prototype._updateColumnInfoSort = function(oSortItem, oColumnData) {
		if (oSortItem) {
			if (!oColumnData.sorted) {
				oColumnData.sorted = {
					"ascending": false
				};
			}
			if (oSortItem.operation === SortOrder.None) {
				delete oColumnData.sorted;
			} else {
				oColumnData.sorted = {
					"ascending": oSortItem.operation !== SortOrder.Descending
				};
			}
		} else if (oColumnData && oColumnData.sorted) {
			oColumnData.sorted = null;
		}
	};

	SmartTable.prototype._updateColumnInfoGroup = function(oGroupItem, oColumnData) {
		oColumnData.grouped = oGroupItem ? true : false;
	};

	/**
	 * Adapt the custom sort so that the sortItems in the p13n are also in sync.
	 *
	 * @private
	 */
	SmartTable.prototype._adaptCustomSort = function() {
		if (this._oCurrentVariant) {
			var sSortProperty, oColumnData, oSortItem;
			var aSortItems = this._getSortItemsFromVariant();

			this._oTable.getColumns().forEach(function(oColumn) {
				oColumnData = oColumn.data("p13nData");
				sSortProperty = oColumnData && oColumnData.sortProperty;
				if (sSortProperty) {
					if (aSortItems.length) {
						oSortItem = aSortItems.find(function (oSortItem) {
							return sSortProperty === oSortItem.sortProperty;
						});
					}
					this._updateColumnInfoSort(oSortItem, oColumnData);
					this._updateSortIndicator(oColumn, sSortProperty, this._isOfType(TableType.ResponsiveTable));
				}

				this._adaptAdditionalProperties(oColumn);
			}, this);
		}
	};

	SmartTable.prototype._adaptCustomGroup = function() {
		if (this._oCurrentVariant) {
			var sSortProperty, oColumnData, oSortItem, aGroupItems;

			if (this._oCurrentVariant.group && this._oCurrentVariant.group.groupItems) {
				aGroupItems = this._oCurrentVariant.group.groupItems;
			}

			this._oTable.getColumns().forEach(function(oColumn) {
				oColumnData = oColumn.data("p13nData");
				sSortProperty = oColumnData && oColumnData.sortProperty;
				if (sSortProperty) {
					if (aGroupItems) {
						oSortItem = aGroupItems.find((groupItem) => {
							return sSortProperty === this._getColumnByKey(groupItem.columnKey)?.data("p13nData")?.sortProperty;
						});
					}
					this._updateColumnInfoGroup(oSortItem, oColumnData);
				}
			}, this);
		}
	};

	SmartTable.prototype.setUseInfoToolbar = function(sValue) {
		this.setProperty("useInfoToolbar", sValue, true);

		if (this.getTable()) {
			this._createInfoToolbar();
		}

		return this;
	};

	/**
	 * Creates or updates the internal info toolbar control instance.
	 * @param {string} sInfoToolbarText text that is shown in the info toolbar
	 * @private
	 */
	SmartTable.prototype._updateInfoToolbar = function(sInfoToolbarText) {
		if (!this._oInfoToolbar) {
			this._oInfoToolbar = new OverflowToolbar({
				active: true,
				visible: true,
				design: ToolbarDesign.Info,
				content: [
					new Text({
						id: this.getId() + "-infoToolbarText",
						text: sInfoToolbarText,
						wrapping: false
					}),
					new ToolbarSpacer(),
					new Button({
						id: this.getId() + "-infoToolbarClearButton",
						icon: "sap-icon://decline",
						type: ButtonType.Transparent,
						press: [this._handleClearAllFilterButtonPress, this],
						tooltip: Library.getResourceBundleFor("sap.ui.mdc").getText("infobar.REMOVEALLFILTERS")
					})
				],
				ariaLabelledBy: this.getId() + "-infoToolbarText",
				press: [this._handleInfoToolbarPress, this]
			});
		} else {
			this._oInfoToolbar.setVisible(true);
			this._oInfoToolbar.getContent()[0].setText(sInfoToolbarText);
		}
	};

	/**
	 * Press handler for the info toolbar. Opens the p13n filter dialog.
	 * @param {object} oEvent - event parameter
	 * @private
	 */
	SmartTable.prototype._handleInfoToolbarPress = function(oEvent) {
		this._showTableFilterDialog();
	};

	/**
	 * Press handler for the info toolbar remove all filter button. Removes all filters.
	 * @private
	 */
	SmartTable.prototype._handleClearAllFilterButtonPress = function() {
		var oP13nController = this._oPersController;
		var oRuntimeData = oP13nController.getDataSuiteFormatSnapshot();
		oRuntimeData = oRuntimeData || {};
		oRuntimeData.SelectOptions = undefined;
		oP13nController.setPersonalizationDataAsDataSuiteFormat(oRuntimeData, false);
		this._updateP13nDialogSettings();
	};

	/**
	 * Creates & updates the info toolbar to show the applied filters on the SmartTable via the table personalization dialog.
	 * @private
	 */
	SmartTable.prototype._createInfoToolbar = function() {
		var sUseInfoToolbar = this.getUseInfoToolbar(), oTable = this.getTable(), sInfoToolbarTextId = this.getId() + "-infoToolbarText", oColumn,
			oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");

		var aFilters = this._oCurrentVariant?.filter?.filterItems;
		var iFiltersLength = aFilters && aFilters.length;

		if (sUseInfoToolbar === InfoToolbarBehavior.Off
			|| (!this._isOfType(TableType.ResponsiveTable) && sUseInfoToolbar === InfoToolbarBehavior.Auto)) {
			if (this._oInfoToolbar && this._oInfoToolbar.getVisible()) {
				this._oInfoToolbar.setVisible(false);
				oTable.removeAriaLabelledBy(sInfoToolbarTextId);

			}

			this._aFilteredColumnsBeforePersonalisationDataChange?.forEach((oFilter) => {
				oColumn = this._getColumnByKey(oFilter.columnKey);
				oColumn?.setFiltered?.(false);
			});

			if (iFiltersLength) {
				aFilters.forEach((oFilter) => {
					oColumn = this._getColumnByKey(oFilter.columnKey);
					oColumn?.setFiltered?.(true);
				});
			}
			return;
		}

		var bCustomInfoToolbar, fAddInfoToolbar;

		if (this._isOfType(TableType.ResponsiveTable)) {
			bCustomInfoToolbar = oTable.getInfoToolbar();
			fAddInfoToolbar = oTable.setInfoToolbar;
		} else {
			bCustomInfoToolbar = oTable.getExtension().find((oToolbar) => (oToolbar.getDesign && oToolbar.getDesign() === ToolbarDesign.Info));
			fAddInfoToolbar = oTable.addExtension;
		}

		if (bCustomInfoToolbar && !this._oInfoToolbar) {
			Log.error(`Custom infoToolbar is used, hence set useInfoToolbar property on the SmartTable with id="${this.getId()}" to Off`);
			return;
		}

		if (iFiltersLength) {
			var aFiltersColumnLabel = [], oListFormat = ListFormat.getInstance();
			aFilters.forEach(function(oFilter) {
				oColumn = this._getColumnByKey(oFilter.columnKey);
				if (oColumn) {
					var sFilterColumnLabel = this._getColumnLabel(oFilter.columnKey);
					if (sFilterColumnLabel && aFiltersColumnLabel.indexOf(sFilterColumnLabel) === -1) {
						aFiltersColumnLabel.push(sFilterColumnLabel);
					}

					if (!this._isOfType(TableType.ResponsiveTable) && oColumn.setFiltered) {
						oColumn.setFiltered(false);
					}
				}
			}, this);

			var sFilterText = oResourceBundle.getText("SMARTTABLE_INFOTOOLBAR_FILTER" + (aFiltersColumnLabel.length > 1 ? "S" : "") + "_ACTIVE", [
				aFiltersColumnLabel.length, oListFormat.format(aFiltersColumnLabel)
			]);
			this._updateInfoToolbar(sFilterText);

			if (!bCustomInfoToolbar) {
				fAddInfoToolbar.call(oTable, this._oInfoToolbar);
			}

			if (oTable.getAriaLabelledBy().indexOf(sInfoToolbarTextId) === -1) {
				oTable.addAriaLabelledBy(sInfoToolbarTextId);
			}
		} else if (this._oInfoToolbar && this._oInfoToolbar.getVisible()) {
			this._oInfoToolbar.setVisible(false);
			oTable.removeAriaLabelledBy(sInfoToolbarTextId);
		}
	};

	/**
	 * returns the current filter and sorting options from the table personalisation/variants
	 *
	 * @private
	 * @param {object} oChangeInfo The change info given by the personalization controller
	 * @returns {sap.ui.comp.personalization.ChangeType} the merged change status
	 */
	SmartTable.prototype._getChangeStatus = function(oChangeInfo) {
		if (!oChangeInfo) {
			// change info not provided return ModelChanged to indicate that we need to update everything internally
			return "ModelChanged";
		}

		if (oChangeInfo.sort === "ModelChanged" || oChangeInfo.filter === "ModelChanged" || oChangeInfo.columns === "ModelChanged" || oChangeInfo.group === "ModelChanged") {
			// model has changed and was not applied to table
			return "ModelChanged";
		}

		if (oChangeInfo.sort === "TableChanged" || oChangeInfo.filter === "TableChanged" || oChangeInfo.columns === "TableChanged" || oChangeInfo.group === "TableChanged") {
			// change was already applied to table
			return "TableChanged";
		}

		return "Unchanged";
	};

	/**
	 * Returns the dateFormatSettings computed by the TableProvider.
	 * @returns {object|undefined} dateTimeSettings object or undefined
	 * @private
	 */
	SmartTable.prototype._getDateFormatSettings = function() {
		if (this._oTableProvider && this._oTableProvider._oDateFormatSettings) {
			return this._oTableProvider._oDateFormatSettings;
		}
		return undefined;
	};

	/**
	 * returns the current filter and sorting options from the table personalisation/variants
	 *
	 * @private
	 * @returns {object} current variant's filter and sorting options
	 */
	SmartTable.prototype._getTablePersonalisationData = function() {
		// Clear the fields that are part of $select due to grouping (sap.m.Table)
		this._mSelectExpandForGroup = null;

		if (!this._oCurrentVariant) {
			return null;
		}

		var aSorters = [], aFilters = [], aExcludeFilters = [], oExcludeFilters, oGroupItem, oGroupSorter, aSortData, oColumn, oColumnData, sGroupPath, sAdditionalGroupPath, sAdditionalPath, sPath, mAdditionalSorters = {}, mExistingSorters = {}, sColumnsText = "", bIsTimeField;

		// group handling
		if (this._isOfType(TableType.ResponsiveTable) && this._oCurrentVariant.group && this._oCurrentVariant.group.groupItems) {
			oGroupItem = this._oCurrentVariant.group.groupItems[0];
			// Exclude deactivated columns
			if (this._aDeactivatedColumns.indexOf(oGroupItem.columnKey) < 0) {
				oColumn = this._getColumnByKey(oGroupItem.columnKey);
				if (oColumn) {
					sColumnsText = oColumn.getHeader().getText();
				}
				sPath = this._getPathFromColumnKeyAndProperty(oGroupItem.columnKey, "sortProperty");
			}
			// Path can be null if the variant data is invalid/contains only invalid information
			if (sPath) {
				// Initialise the GroupPath(s) to new variable(s) as they are being used in the formatter function
				sGroupPath = sPath;
				sAdditionalGroupPath = null;
				var oFieldMetadata = this._mFieldMetadataByKey[oGroupItem.columnKey], fnGroupFunction;
				if (oFieldMetadata) {
					sAdditionalGroupPath = oFieldMetadata.unit || oFieldMetadata.description;

					// oMetaModel instance is required to resolve CodeList for group header
					var oModel = this.getModel(),
						oMetaModel = oModel && oModel.getMetaModel();

					fnGroupFunction = FormatUtil.getInlineGroupFormatterFunction(oFieldMetadata, false, this._getDateFormatSettings(), this._bPreserveDecimals, true /* bReplaceWhitespace */, oMetaModel);
				}
				oGroupSorter = new Sorter(sGroupPath, oGroupItem.operation === "GroupDescending", function(oContext) {
					var sKey = oContext.getProperty(sGroupPath), sAdditionalValue;
					if (fnGroupFunction) {
						if (sAdditionalGroupPath) {
							sAdditionalValue = oContext.getProperty(sAdditionalGroupPath);
						}
						sKey = fnGroupFunction(sKey, sAdditionalValue);
					}
					// Until there is a better empty handling concept use "" for empty values in grouping!
					if (sKey === undefined || sKey === null) {
						sKey = "";
					}
					return {
						key: sKey,
						text: sColumnsText ? sColumnsText + ": " + sKey : sKey
					};
				});

				// Add the necessary group field(s) to a select/expand group map, so that it can be added to $select, $expand
				this._mSelectExpandForGroup = {
					select: [
						sGroupPath
					]
				};
				if (oFieldMetadata) {
					if (oFieldMetadata.additionalProperty) {
						this._mSelectExpandForGroup.select.push(oFieldMetadata.additionalProperty);
					}
					if (oFieldMetadata.navigationProperty) {
						this._mSelectExpandForGroup.expand = [
							oFieldMetadata.navigationProperty
						];
					}
				}
				aSorters.push(oGroupSorter);
			}
		}

		// sort handling
		if (this._oCurrentVariant.sort) {
			aSortData = this._oCurrentVariant.sort.sortItems;
		} else {
			aSortData = this._aInitialSorters;
		}

		if (aSortData) {
			aSortData.forEach(function(oModelItem, iIndex) {
				var bDescending = oModelItem.operation === "Descending";
				// Path has be re-calculated below
				sPath = null;
				sAdditionalPath = null;
				// Exclude deactivated columns
				if (this._aDeactivatedColumns.indexOf(oModelItem.columnKey) < 0) {
					sPath = this._getPathFromColumnKeyAndProperty(oModelItem.columnKey, "sortProperty");
					if (!sPath && oModelItem.initiallyNotVisibleColumn) {
						sPath = oModelItem.columnKey;
					}
				}
				// Path can be null if the variant data is invalid/contains only invalid information
				if (sPath) {
					if (oGroupSorter && oGroupSorter.sPath === sPath) {
						oGroupSorter.bDescending = bDescending;
					} else {
						var oFieldMetadata = this._mFieldMetadataByKey[sPath];

						// check for custom column
						// !oFieldMetadata indicates that sPath is a custom column
						if (!oFieldMetadata) {
							oColumn = this._getColumnByKey(oModelItem.columnKey);
							oColumnData = oColumn?.data("p13nData");
						}

						if (this._bMultiUnitBehaviorEnabled && (oFieldMetadata?.isCurrencyField || oColumnData?.isCurrency)) {
							sAdditionalPath = oFieldMetadata ? oFieldMetadata.unit : oColumnData.unit;
							var oAdditionalFieldMetadata = this._mFieldMetadataByKey[sAdditionalPath];
							var oAdditionalColumn, oAdditionalColumnData;

							if (!oAdditionalFieldMetadata) {
								oAdditionalColumn = this._getColumnByKey(sAdditionalPath);
								oAdditionalColumnData = oAdditionalColumn?.data("p13nData");
							}

							if (sAdditionalPath &&
								(oAdditionalFieldMetadata?.sortable ||
									oAdditionalColumnData?.sortProperty === sAdditionalPath ||
									oAdditionalColumn?.getSortProperty?.() === sAdditionalPath
								) && !mAdditionalSorters[sAdditionalPath]
							) {
								mAdditionalSorters[sAdditionalPath] = {
									index: iIndex,
									descending: bDescending
								};
							}
						}

						mExistingSorters[sPath] = {};

						if (mExistingSorters[sAdditionalPath]) {
							delete mAdditionalSorters[sAdditionalPath];
						} else if (mAdditionalSorters[sPath]) {
							delete mAdditionalSorters[sPath];
						}

						aSorters.push(new Sorter(sPath, bDescending));
					}
				}
			}, this);

			var aAdditionalSorterPaths = Object.keys(mAdditionalSorters),
				iAdditionalSorterIndex;
			if (aAdditionalSorterPaths.length) {
				aAdditionalSorterPaths.reverse().forEach(function(sAdditionalSorterPath) {
					iAdditionalSorterIndex = oGroupSorter ? mAdditionalSorters[sAdditionalSorterPath].index + 1 : mAdditionalSorters[sAdditionalSorterPath].index;
					aSorters.splice(iAdditionalSorterIndex, 0, new Sorter(sAdditionalSorterPath, mAdditionalSorters[sAdditionalSorterPath].descending));
				});
			}
		}

		// Filter Handling
		if (this._oCurrentVariant.filter) {
			this._oCurrentVariant.filter.filterItems.forEach(function(oModelItem) {
				var oValue1 = oModelItem.value1,
					oValue2 = oModelItem.value2,
					sOperation,
					bHasConditionType = !!oModelItem.conditionTypeInfo;

				// Filter path has be re-calculated below
				sPath = null;
				bIsTimeField = false;
				oColumn = null;
				// Exclude deactivated columns
				if (this._aDeactivatedColumns.indexOf(oModelItem.columnKey) < 0) {
					oColumn = this._getColumnByKey(oModelItem.columnKey);
				}
				if (oColumn) {
					if (oColumn.getFilterProperty) {
						sPath = oColumn.getFilterProperty();
					}
					oColumnData = oColumn.data("p13nData");
					if (oColumnData) {
						bIsTimeField = oColumnData.type === "time";
						if (!sPath) {
							sPath = oColumnData["filterProperty"];
						}
					}
				}
				// Path can be null if the variant data is invalid/contains only invalid information
				if (sPath) {
					let oMetadata;
					const bIsTypeDateTimeOffset = oColumnData?.typeInstance?.getName() === "sap.ui.model.odata.type.DateTimeOffset";

					try {
						oMetadata = this._oTableProvider && this._oTableProvider.getFieldMetadata(sPath);
					} catch (e) {
						// do nothing
					}

					if (bIsTimeField) {
						if (oValue1 instanceof Date) {
							oValue1 = FormatUtil.getEdmTimeFromDate(oValue1);
						}
						if (oValue2 instanceof Date) {
							oValue2 = FormatUtil.getEdmTimeFromDate(oValue2);
						}
					} else {
						if (oValue1 instanceof Date && !bHasConditionType && !bIsTypeDateTimeOffset && this._oTableProvider && this._oTableProvider.getIsUTCDateHandlingEnabled()) {
							// only update the time of the values when it is not of type DateTimeOffset
							// this is similar to the date value handling inside the FilterProvider. For type DateTimeOffset we do NOT correct the
							// time.
							oValue1 = DateTimeUtil.localToUtc(oValue1);

							if (oValue2) {
								// If precision is defined, adapt milliseconds to precision
								var iPrecision = parseInt(oMetadata?.precision);
								oValue2 = DateTimeUtil.localToUtc(oValue2);
								oValue2 = DateTimeUtil.adaptPrecision(oValue2, iPrecision);
							}
						}
						if (bIsTypeDateTimeOffset && !bHasConditionType && (oMetadata.filterRestriction == "interval" || oMetadata.filterRestriction == "auto")) {
							if (oModelItem.operation === "EQ" || oModelItem.operation === "BT") {
								oModelItem.operation = "BT";
								oValue2 = oValue2 ? oValue2 : UI5Date.getInstance(oValue1);
								oValue2.setMilliseconds(999);
							} else if (oModelItem.operation === "LE") {
									oValue1.setMilliseconds(999);
							}
						}
					}

					var aFilterArrReference = (oModelItem.exclude ? aExcludeFilters : aFilters);
					if (oModelItem.operation === "Empty") {
						var sFilterOperator = oModelItem.exclude ? FilterOperator.NE : FilterOperator.EQ,
							bIsColumnTypeString = false,
							bIsColumnNullable = false;

						// If nullable is not set in the p13nData we check the ODataMetadata
						// We need to specificlaly check if it is undefined as it might be string "false"
						if (oColumnData.nullable === true || oColumnData.nullable === "true") {
							bIsColumnNullable = true;
						} else if (oColumnData.nullable === undefined && oMetadata && oMetadata.nullable !== "false") {
							bIsColumnNullable = true;
						}

						// If type or edmType are not set in the p13nData we check the ODataMetadata to get the type
						if (oColumnData.edmType === "Edm.String" || oColumnData.type === "string") {
							bIsColumnTypeString = true;
						} else if (!oColumnData.edmType && !oColumnData.type && oMetadata && oMetadata.type === "Edm.String") {
							bIsColumnTypeString = true;
						}

						if (bIsColumnTypeString) {
							aFilterArrReference.push(new Filter(sPath, sFilterOperator, ""));
						}

						if (bIsColumnNullable) {
							// When the field is nullable we should also add the eq null filter
							aFilterArrReference.push(new Filter(sPath, sFilterOperator, null));
						}
					} else {
						sOperation = oModelItem.exclude ? FilterUtil.getTransformedExcludeOperation(oModelItem.operation) : oModelItem.operation;
						var oFilter = new Filter(sPath, sOperation, oValue1, oValue2);
						// Adopt milliseconds in the case of EDM.DateTimeOffset to be not only 3 but 7 meaning digits
						if (bIsTypeDateTimeOffset && oMetadata){
							oFilter = FormatUtil.adaptMilliseconds(oFilter,  oMetadata.precision, sOperation);
						}

						aFilterArrReference.push(oFilter);
					}

				}
			}, this);

			if (aExcludeFilters.length) {
				oExcludeFilters = new Filter(aExcludeFilters, true);
			}
		}

		return {
			filters: aFilters,
			excludeFilters: oExcludeFilters,
			sorters: aSorters
		};
	};

	/**
	 * Returns the column for the given column key
	 *
	 * @param {string} sColumnKey The column key for the required column
	 * @returns {object|undefined} The found column or undefined
	 * @private
	 */
	SmartTable.prototype._getColumnByKey = function(sColumnKey) {
		return this.getTable()?.getColumns().find((oColumn) => oColumn.data("p13nData")?.columnKey === sColumnKey);
	};

	/**
	 * Fetches the ColumnMap from the ColumnHelper and returns the column for the given column key.
	 * If no column gets found by its columnKey, we check for its leadingProperty as the columnKey
	 * of custom columns in most of the case differes from the property they have been created for.
	 *
	 * @param {string} sColumnKey - the column key for the required column
	 * @returns {object} The found column or null
	 * @private
	 */
	SmartTable.prototype._getColumnFromP13nMap = function(sColumnKey) {
		if (!this._oPersController) {
			return null;
		}

		const mColumnMap = this._oPersController.getColumnMap();
		let oColumn = null;

		for (const sKey in mColumnMap) {
			if (sKey === sColumnKey) {
				oColumn = mColumnMap[sKey];
				break;
			} else if (mColumnMap[sKey].getLeadingProperty && mColumnMap[sKey].getLeadingProperty() === sColumnKey) {
				oColumn = mColumnMap[sKey];
				break;
			} else if (mColumnMap[sKey].data("p13nData").leadingProperty === sColumnKey) {
				oColumn = mColumnMap[sKey];
				break;
			}
		}

		return oColumn;
	};

	/**
	 * Retrieves the path for the specified property and column key from the array of table columns
	 *
	 * @param {string} sColumnKey - the column key specified on the table
	 * @param {string} sProperty - the property path that needs to be retrieved from the column
	 * @returns {string} The path that can be used by sorters, filters etc.
	 * @private
	 */
	SmartTable.prototype._getPathFromColumnKeyAndProperty = function(sColumnKey, sProperty) {
		var sPath = null, oColumn, oColumnData;
		oColumn = this._getColumnByKey(sColumnKey) || this._getColumnFromP13nMap(sColumnKey);

		// Retrieve path from the property
		if (oColumn) {
			if (sProperty == "sortProperty" && oColumn.getSortProperty) {
				sPath = oColumn.getSortProperty();
			} else if (sProperty == "filterProperty" && oColumn.getFilterProperty) {
				sPath = oColumn.getFilterProperty();
			} else if (sProperty == "leadingProperty" && oColumn.getLeadingProperty) {
				sPath = oColumn.getLeadingProperty();
			}

			if (!sPath) {
				oColumnData = oColumn.data("p13nData");
				if (oColumnData) {
					sPath = oColumnData[sProperty];
				}
			}
		}

		return sPath;
	};

	/**
	 * triggers (hidden) VariantManagementControl to persist personalisation this function is called in case no VariantManagementControl is used
	 *
	 * @private
	 */
	SmartTable.prototype._persistPersonalisation = function() {
		var sPersonalisationVariantName = "Personalisation";
		// implicit persistency should be disabled in Visual Editor, see customer case CS20220002582153
		if (!DesignTime.isDesignModeEnabled() && this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			var sPersonalisationVariantKey = this._oVariantManagement.getViewIdByName(sPersonalisationVariantName);
			if (sPersonalisationVariantKey === null) {
				sPersonalisationVariantKey = this.getCurrentVariantId();
			}

			// It seems Save is triggered again during Save by perso controller!
			if (!this._bSaving) {
				this._bSaving = true;
				this._oVariantManagement.fireSave({
					name: sPersonalisationVariantName,
					implicit: true,
					global: false,
					overwrite: !!sPersonalisationVariantKey,
					key: sPersonalisationVariantKey,
					def: true
				});
				delete this._bSaving;
			}
		}
	};

	/**
	 * returns the id of the currently selected variant.
	 *
	 * @public
	 * @returns {string} id of the currently selected variant
	 */
	SmartTable.prototype.getCurrentVariantId = function() {
		return this._oVariantManagement ? this._oVariantManagement.getCurrentVariantId() : "";
	};

	/**
	 * Set the current variant according to the sVariantId. In case an empty string or null or undefined was passed the STANDARD will be set. STANDARD
	 * will also be set, in case the passed sVariantId could not be found. In case neither a flexibility variant, nor the content for the standard
	 * variant could not be obtained, nor the personalisable control obtained nothing will be executed/changed
	 *
	 * @public
	 * @param {string} sVariantId id of the currently selected variant
	 * @returns {object} the control instance
	 */
	SmartTable.prototype.setCurrentVariantId = function(sVariantId) {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.setCurrentVariantId(sVariantId);
		} else {
			Log.error("sap.ui.comp.smarttable.SmartTable.prototype.setCurrentVariantId: VariantManagement does not exist, or is a page variant");
		}
		return this;
	};

	SmartTable.prototype.setDetailsButtonSetting = function(aPriorities) {
		this.setProperty("detailsButtonSetting", aPriorities, true);
		return this;
	};

	/**
	 * Sets a new value for the <code>enablePaste</code> property.
	 * @public
	 * @param {boolean} bValue New value for property enablePaste
	 * @return {sap.ui.comp.smarttable.SmartTable} SmartTable control instance
	 */
	SmartTable.prototype.setEnablePaste = function(bValue) {
		this.setProperty("enablePaste", bValue, true);

		var oPasteButton = Element.getElementById(this.getId() + "-btnPaste");
		if (oPasteButton) {
			oPasteButton.setEnabled(this.getEnablePaste());
		}

		return this;
	};

	/**
	 * Checks whether the control is initialised
	 *
	 * @returns {boolean} returns whether control is already initialised
	 * @public
	 */
	SmartTable.prototype.isInitialised = function() {
		return !!this.bIsInitialised;
	};

	SmartTable.prototype._aAvailablePanels = [
		"Columns", "Sort", "Filter", "Group"
	];

	/**
	 * Opens the desired panel of the personalization dialog.<br>
	 * <i>Note:</i> Calling this for panels that are globally hidden (E.g. manually by the application, or due to unavailability of functionality)
	 * leads to an empty dialog being shown.
	 *
	 * @param {string} sPanel The desired panel; the value is either "Columns", "Sort", "Filter" or "Group"
	 * @public
	 * @since 1.48.0
	 */
	SmartTable.prototype.openPersonalisationDialog = function(sPanel) {
		if (!sPanel || this._aAvailablePanels.indexOf(sPanel) < 0) {
			Log.warning("sap.ui.comp.smarttable.SmartTable.prototype.openPersonalisationDialog: " + sPanel + " is not a valid panel!");
			return;
		}
		if (this._oPersController) {
			var oSetting = {useAvailablePanels: false};
			oSetting[sPanel.toLowerCase()] = {
				visible: true,
				payload: undefined
			};
			this._oPersController.openDialog(oSetting);
		}
	};

	/**
	 * Deactivates existing columns in the personalization dialog based on the provided column keys.<br>
	 * <i>Note:</i> The columns are set to invisible and excluded from all panels in the table personalization. Any existing sorting, filtering or
	 * grouping in the personalization dialog for such columns will no longer be taken into account.
	 *
	 * @param {string[]|null|undefined} aColumnKeys An array of column keys by which the corresponding columns are deactivated. If <code>null</code>
	 *        or <code>undefined</code> or an empty array is passed, no column is deactivated, and all previously deactivated columns will be reset
	 * @public
	 * @since 1.54.0
	 */
	SmartTable.prototype.deactivateColumns = function(aColumnKeys) {
		this._aDeactivatedColumns = aColumnKeys || [];

		this._bDeactivatingColumns = true;
		// When there is no perso controller - nothing will be done as the user cannot even use settings and can simply remove the column via code
		if (this._oPersController) {
			this._oPersController.addToSettingIgnoreColumnKeys(this._aDeactivatedColumns);
		}
		this._bDeactivatingColumns = false;
	};

	/**
	 * Returns the deactivated column keys.
	 *
	 * See {@link sap.ui.comp.smarttable.SmartTable#deactivateColumns}
	 *
	 * @returns {string[]} array of column keys
	 * @public
	 * @since 1.105.0
	 */
	SmartTable.prototype.getDeactivatedColumns = function() {
		return this._aDeactivatedColumns ? this._aDeactivatedColumns.slice() : [];
	};

	/**
	 * Handler for inner/UI5 table paste event
	 *
	 * @param {object} oEvent - the event object
	 * @private
	 */
	SmartTable.prototype._onInnerTablePaste = function(oEvent) {
		// No callback/listeners for both --> not need for paste event; return
		if (!this.getEnablePaste() || (!this.hasListeners("beforePaste") && !this.hasListeners("paste"))) {
			return;
		}

		var aPastedData = oEvent.getParameter("data");
		var aPastedDataCopy = aPastedData.slice(0); // copy to avoid changing original event array
		var aColumnInfo = this._getColumnInfoForPaste();
		// Proceed if default is not prevented
		if (this.fireBeforePaste({
			columnInfos: aColumnInfo,
			rawData: aPastedDataCopy
		})) {
			sap.ui.require([
				"sap/ui/core/util/PasteHelper"
			], function(PasteHelper) {
				PasteHelper.parse(aPastedDataCopy, aColumnInfo).then((oResult) => {
					this.firePaste({
						result: oResult
					});
				});
			}.bind(this));
		}
	};

	/**
	 * Returns an array of <code>ColumnInfoForPaste</code> objects
	 *
	 * @returns {sap.ui.comp.smarttable.ColumnInfoForPaste[]} array of <code>ColumnInfoForPaste</code> objects
	 * @private
	 */
	SmartTable.prototype._getColumnInfoForPaste = function() {
		var aVisibleColumnInfo = [], aInvisibleColumnInfo = [], aColumns = this._oTable.getColumns(), i, iLen = aColumns.length, oColumn, oColumnData, sPath, sType, oType, sAdditionalPath, bIgnore, fnParseFunction;

		if (this._isOfType(TableType.ResponsiveTable) && aColumns.length) {
			aColumns = aColumns.sort(function(oCol1, oCol2) {
				return oCol1.getOrder() - oCol2.getOrder();
			});
		}

		for (i = 0; i < iLen; i++) {
			oColumn = aColumns[i];
			sPath = null;
			sAdditionalPath = null;
			oType = null;
			bIgnore = true;

			if (oColumn.getVisible()) {
				oColumnData = oColumn.data("p13nData");

				if (oColumnData.displayBehaviour === "descriptionOnly" && oColumnData.description) {
					sPath = oColumnData.description;
				} else {
					sPath = this._getColumnLeadingProperty(oColumn, oColumnData);
				}

				sType = oColumnData.type === "numeric" ? "number" : oColumnData.type;
				bIgnore = !sPath || oColumnData.ignorePaste;
				fnParseFunction = oColumnData.customParseFunction;

				// ControlProvider._createModelTypeInstance() always overwrites the formatOption.UTC = false, so the typeInstance cannot be used, as the dateFormatSettings can be different
				// hence a new instance for the Edm.DateTime is required for the correct end result in the UI.
				if (oColumnData.type === "date") {
					var oDateFormatSettings = this._getDateFormatSettings();
					if (oDateFormatSettings && oDateFormatSettings["UTC"]) {
						var oConstraints = {
							displayFormat: "Date"
						};
						oType = ODataType.getType("Edm.DateTime", oDateFormatSettings, oConstraints);
					}
				}

				if (!oType) {
					// Use typeInstance which is as of now used for p13n alone
					oType = oColumnData["typeInstance"] || this._oTableProvider?.getFieldMetadata(sPath)?.modelType;
				}

				if (oColumnData.isCurrency || sType === "number") {
					sAdditionalPath = oColumnData.unit;
				} else if (oColumnData.description && oColumnData.displayBehaviour !== "idOnly" && oColumnData.displayBehaviour !== "descriptionOnly") { // check this last as at times numeric, date other
					// fields too might have a description
					sAdditionalPath = oColumnData.description;
				}
			}

			// This is the leadingProperty
			var oColumnInfo = {
				columnId: oColumn.getId(),
				property: sPath,
				ignore: bIgnore,
				type: oType,
				customParseFunction: fnParseFunction
			};

			// The PersoController does not ensure that the visible columns start on index 0.
			// This concatenation enforces to avoid gaps between visible columns which would
			// break the paste handling.
			if (sPath) {
				aVisibleColumnInfo.push(oColumnInfo);
			} else {
				aInvisibleColumnInfo.push(oColumnInfo);
			}

			// Description/Unit
			oType = ODataType.getType("Edm.String"); // assume string for Unit, Description.
			if (sAdditionalPath) {

				//Note: sAdditionalPath is only provided in case the column is visible
				aVisibleColumnInfo.push({
					columnId: oColumn.getId(),
					additionalProperty: true, // present/set for UoM, currency and ID/Desc scenarios
					property: sAdditionalPath,
					type: oType
				});
			}
		}

		return aVisibleColumnInfo.concat(aInvisibleColumnInfo);
	};

	SmartTable.prototype._getSemanticObjectBindingPaths = function(aSelect) {
		if (!aSelect || !aSelect.length) {
			return aSelect;
		}

		var aSemanticObjectPaths = [];
		aSelect.forEach(function(sSelect) {
			var oViewMetadata = this._aTableViewMetadata && this._aTableViewMetadata.find(function(oProperty) {
				return oProperty.name == sSelect;
			});
			if (oViewMetadata && oViewMetadata.semanticObjectPath) {
				if (!aSelect.includes(oViewMetadata.semanticObjectPath)) {
					aSemanticObjectPaths.push(oViewMetadata.semanticObjectPath);
				}
			}
		}, this);
		return aSelect.concat(aSemanticObjectPaths);
	};

	/**
	 * Determines whether the SmartTable instance is of the specified table type
	 *
	 * @param {sap.ui.comp.smarttable.TableType} oTableType The table type to check
	 * @returns {boolean} Returns true if the SmartTable instance is of the specified table type
	 */
	SmartTable.prototype._isOfType = function(oTableType) {
		return this.getTableType() === oTableType;
	};

	/**
	 * Cleans up the control
	 *
	 * @protected
	 */
	SmartTable.prototype.exit = function() {
		var i, oField;
		this.detachEvent("_change", this._onPropertyChange, this);
		// Cleanup smartFilter events as it can be used again stand-alone without being destroyed!
		if (this._oSmartFilter) {
			this._oSmartFilter.detachSearch(this._reBindTable, this);
			this._oSmartFilter.detachFilterChange(this._filterChangeEvent, this);
			this._oSmartFilter = null;
		}
		if (this._oTableProvider && this._oTableProvider.destroy) {
			this._oTableProvider.destroy();
		}
		this._oTableProvider = null;
		if (this._oPersController && this._oPersController.destroy) {
			this._oPersController.destroy();
		}
		this._oPersController = null;
		if (this._oVariantManagement) {
			this._oVariantManagement.detachSave(this._variantSaved, this);
			this._oVariantManagement.detachAfterSave(this._variantAfterSave, this);
			if (!this._oVariantManagement.isPageVariant() && this._oVariantManagement.destroy) {
				this._oVariantManagement.destroy();
			}
		}
		this._oNumberFormatInstance = null;
		FullScreenUtil.cleanUpFullScreen(this);

		if (this._oEditModel) {
			this._oEditModel.destroy();
		}

		if (this._oNoData && this._oNoData.destroy) {
			this._oNoData.destroy();
		}
		this._oNoData = null;

		// Destroy template controls for fields that have not been added as columns
		if (this._aTableViewMetadata) {
			i = this._aTableViewMetadata.length;
			while (i--) {
				oField = this._aTableViewMetadata[i];
				if (oField && !oField.isColumnCreated && oField.template) {
					oField.template.destroy();
				}
			}
		}

		if (this._oShowHideDetailsButton) {
			this._oShowHideDetailsButton.destroy();
		}

		this._oShowHideDetailsButton = null;
		this._aTableViewMetadata = null;
		this._mFieldMetadataByKey = null;
		this._mSelectExpandForGroup = null;
		this._oEditModel = null;
		this._oVariantManagement = null;
		this._oCurrentVariant = null;
		this._aExistingColumns = null;
		this._mLazyColumnMap = null;
		this._aColumnKeys = null;
		this._aDeactivatedColumns = null;
		this._aAlwaysSelect = null;
		this._oCustomToolbar = null;
		// Destroy the toolbar if it is not already inserted into items; else it will automatically be destroyed
		if (this._oToolbar && !this._bToolbarInsertedIntoItems) {
			this._oToolbar.destroy();
		}
		this._oToolbar = null;
		if (this._oSeparator) {
			this._oSeparator.destroy();
		}
		this._oSeparator = null;
		if (this._oExportButton) {
			this._oExportButton.destroy();
		}
		this._oExportButton = null;
		if (this._oExportHandler) {
			this._oExportHandler.destroy();
		}
		this._oExportHandler = null;
		if (this._oTablePersonalisationButton) {
			this._oTablePersonalisationButton.destroy();
		}
		this._oTablePersonalisationButton = null;
		this._oP13nDialogSettings = null;
		// Destroy the template always as templateShareable=true (default =1)!
		if (this._oTemplate) {
			this._oTemplate.destroy();
		}
		this._oTemplate = null;

		// Destroy ResponsivePopover and set references to its buttons to null
		if (this._oColumnHeaderPopover) {
			this._oColumnHeaderPopover.destroy();
		}
		this._oColumnHeaderPopover = null;

		if (this._oCopyProvider) {
			this._oCopyProvider.destroy();
		}
		this._oCopyProvider = null;
		if (this._oCellSelector) {
			this._oCellSelector.destroy();
		}
		this._oCellSelector = null;

		this._bMissingColumnsCreated = null;
		this._oFilterButton = null;
		this._aSortButton = null;

		this._oInfoToolbar = null;
		this._oTableReady = null;
		this._oView = null;
		this._oTable = null;
	};

	return SmartTable;

});
