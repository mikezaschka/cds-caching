/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	"sap/ui/comp/library",
	"sap/m/library",
	"./JSONControlFactory",
	"./ODataControlFactory",
	"./BindingUtil",
	"./SideEffectUtil",
	"./ODataHelper",
	"./ValidationUtil",
	"./LifecycleUtil",
	"sap/ui/core/Control",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/comp/smartfield/UoMValidateException",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/BindingMode",
	"sap/base/strings/capitalize",
	"sap/base/Log",
	"sap/base/util/Deferred",
	"sap/m/DisplayListItem",
	"sap/m/InputListItem",
	"sap/ui/core/message/MessageMixin",
	"./TextArrangementRead",
	"sap/ui/Device",
	"sap/ui/base/ManagedObjectObserver",
	"sap/ui/core/EventBus"
], function(
	Library,
	coreLibrary,
	library,
	mobileLibrary,
	JSONControlFactory,
	ODataControlFactory,
	BindingUtil,
	SideEffectUtil,
	ODataHelper,
	ValidationUtil,
	LifecycleUtil,
	Control,
	ParseException,
	ValidateException,
	UoMValidateException,
	JSONModel,
	BindingMode,
	capitalize,
	Log,
	Deferred,
	DisplayListItem,
	InputListItem,
	MessageMixin,
	TextArrangementRead,
	Device,
	ManagedObjectObserver,
	EventBus
) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	var TextInEditModeSource = library.smartfield.TextInEditModeSource;

	var Importance = library.smartfield.Importance;

	// shortcut for sap.ui.core.TextAlign
	var TextAlign = coreLibrary.TextAlign;

	var FlexJustifyContent = mobileLibrary.FlexJustifyContent;

	// shortcut for sap.ui.core.TextDirection
	var TextDirection = coreLibrary.TextDirection;

	// shortcut for sap.ui.comp.smartfield.ControlContextType
	var ControlContextType = library.smartfield.ControlContextType;

	// shortcut for sap.ui.comp.smartfield.ControlProposalType
	var ControlProposalType = library.smartfield.ControlProposalType;

	var EmptyIndicatorMode = mobileLibrary.EmptyIndicatorMode;

	var ValueHelpTitleSource = library.smartfield.ValueHelpTitleSource;
	/**
	 * Constructor for a new <code>sap.ui.comp.smartfield.SmartField</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class
	 * The <code>SmartField</code> control interprets metadata that represents entity-relationship models, data types,
	 * service capabilities, and annotations in OData services to automatically generate the underlying inner controls
	 * and reduce the amount of code needed for developing applications.
	 * In some cases, the OData entity is derived from the control's binding context. The OData entity property that
	 * is changed or displayed with the control is derived from the <code>value</code> property of the control.
	 *
	 * <h3>Structure </h3>
	 * The <code>SmartField</code> control contains a basic UI element and an optional label. In <code>display</code> mode
	 * the following UI elements are available to be rendered depending on the metadata:
	 * <ul>
	 * <li>{@link sap.m.Text Text}</li>
	 * <li>{@link sap.m.Link Link}</li>
	 * <li>{@link sap.ui.comp.navpopover.SmartLink SmartLink}</li>
	 * </ul>
	 * In <code>edit</code> mode, the available UI elements are:
	 * <ul>
	 * <li>One or two {@link sap.m.Input Input} fields (with or without a {@link sap.ui.comp.valuehelpdialog.ValueHelpDialog ValueHelpDialog})</li>
	 * <li>{@link sap.m.Select Select}</li>
	 * <li>{@link sap.m.ComboBox ComboBox}</li>
	 * <li>{@link sap.m.TextArea TextArea}</li>
	 * <li>{@link sap.m.Checkbox Checkbox}</li>
	 * <li>{@link sap.m.DatePicker DatePicker}</li>
	 * <li>{@link sap.m.DateTimePicker DateTimePicker}</li>
	 * <li>{@link sap.m.TimePicker TimePicker}</li>
	 * </ul>
	 * The <code>SmartField</code> comes with additional built-in features,
	 * such as autocomplete and suggestions, value help dialog, recently used and recommended values, textInEditModeSource, validation, and message handling.
	 *
	 * <h3>Usage</h3>
	 * <i>When to use</i>
	 * <ul>
	 * <li>You use an OData service for your app (only OData version 2).</li>
	 * <li>You use the smart table and your app is not performance critical.
	 * The <code>SmartField</code> control offers more flexibility than the controls provided directly by the smart table, especially for editing.</li>
	 * <li>You use a smart form.</li>
	 * </ul>
	 *
	 * <i>When not to use</i>
	 * <ul>
	 * <li>You are not using OData version 2.</li>
	 * <li>You need a different control for entering or displaying data, such as multi input, a multi combo box, step input,
	 * a radio button, or a title. In this case, use the corresponding control directly.</li>
	 * <li>You need a different dialog for offering value help, such as the select dialog or table select dialog.</li>
	 * <li>You use the smart table and your app is performance critical. In this case, the controls offered directly by
	 * the smart table offer less flexibility but better performance.</li>
	 * <li> You need custom validations.</li>
	 * </ul>
	 *
	 * <b>Important:</b> Keep in mind that the <code>SmartField</code> control, like all SAPUI5 smart controls, retrieves and analyzes
	 * the metadata and annotations of OData services. <b>The OData metadata is its primary API. These OData services
	 * are not part of the SAPUI5 framework and are usually maintained by the backend developers of your application.</b>
	 *
	 * With time, <code>SmartField</code> can evolve and acquire new features. This means that its behavior or functionalities
	 * may change if the annotations that define this change are maintained in your backend metadata. To benefit from the new
	 * functionalities, your application should be able to adapt the backend metadata. <b>Therefore, we recommend
	 * using <code>SmartField</code> only if you have control over the metadata of your application.</b>
	 *
	 * @extends sap.ui.core.Control
	 * @implements sap.ui.core.IFormContent
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfield.SmartField
	 * @see {@link topic:4864403f08c64ca08a2b0ee1fa9cb5e2 Smart Field}
	 * @see {@link fiori:https://experience.sap.com/fiori-design-web/smart-field/ Smart Field}
	 */
	var SmartField = Control.extend("sap.ui.comp.smartfield.SmartField", /** @lends sap.ui.comp.smartfield.SmartField.prototype */ {
		metadata: {
			interfaces : ["sap.ui.core.IFormContent", "sap.ui.core.ISemanticFormContent"],
			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartfield/SmartField.designtime",
			properties: {

				/**
				 * The binding path expression used to determine the bound Entity Data Model (EDM) property.
				 *
				 * <b>Note:</b> Composite binding expressions for this property are not supported.
				 * <b>Note:</b> Custom formatters for this property are not supported.
				 * The <code>SmartField</code> control usually creates its own data type based on the service
				 * metadata for the formatting of values.
				 * Also, when a custom formatter is specified for a property, the binding mode is automatically
				 * switched to one-way binding mode.
				 * <b>Note:</b> Named models are not supported, only the default model (named undefined) is supported.
				 * For example, when the binding path expression contains a <code>&gt;</code> sign, the string
				 * preceding it is a named model and the remainder after the <code>&gt;</code> is the binding path.
				 *
				 * @example <caption>Common Scenario with the <code>value</code> Control Property Bound to a <code>CategoryName</code> EDM Property</caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="CategoryName" Type="Edm.String"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{CategoryName}"/>
				 */
				value: {
					type: "any",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates whether the user can interact with the control or not. <b>Note:</b> Disabled controls cannot be focused and they are out
				 * of the tab order.
				 */
				enabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The name of an entity set for which the control manages values. This is an optional property.
				 *
				 * If this property is left empty, the entity set is computed by parsing the binding context path,
				 * for example, <code>Tasks('id-1428419016778-51')</code> is parsed to <code>Tasks</code>.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Indicates whether the control is in display or edit mode.
				 *
				 * <b>Note:</b> The <code>SmartField</code> control is metadata-driven, and this control
				 * property can be ignored if the following applies:
				 *
				 * <ul>
				 * <li>The bound Entity Data Model (EDM) property or its entity set are annotated with the
				 * OData V2 <code>sap:updatable</code> annotation.</li>
				 * <li>The bound EDM property or its entity set are annotated with the <code>sap:creatable</code>
				 * annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V2
				 * <code>sap:updatable-path</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Capabilities.V1.InsertRestrictions</code> annotation.</li>
				 * <li>The bound EDM property is annotated with the
				 * <code>com.sap.vocabularies.Common.v1.FieldControl</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Capabilities.V1.UpdateRestrictions</code> annotation.</li>
				 * </ul>
				 *
				 * @example <caption>Scenario with Computed <code>editable</code> Value of <code>false</code></caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="ProductId" Type="Edm.String" sap:updatable="false"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{ProductId}" editable="true"/>
				 *
				 * @example <caption>Scenario with Computed <code>editable</code> Value of <code>false</code></caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="ProductId" Type="Edm.String" sap:creatable="false"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{ProductId}" editable="true"/>
				 */
				editable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Notifies the control whether controls using the <code>SmartField</code> control are editable.
				 *
				 * @since 1.32.0
				 */
				contextEditable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Defines the width of the control.
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Horizontal alignment of the text.
				 */
				textAlign: {
					type: "sap.ui.core.TextAlign",
					group: "Misc",
					defaultValue: TextAlign.Initial
				},

				/**
				 * The available text direction options are LTR and RTL. By default, the control inherits the text
				 * direction from its parent control.
				 *
				 * The <code>textDirection</code> property can be used when, for example, the
				 *  text direction in the application is LTR but you want a specific field to have RTL text direction.
				 *
				 * <b>Note:</b> The <code>textDirection</code> property is not applicable for the <code>SmartField</code>
				 * control for units of measure use cases.
				 *
				 * @example <caption>Scenario with text direction of the application LTR
				 * and <code>textDirection</code> value <code>RTL</code></caption>
				 *
				 * <SmartField value="{ProductId}" editable="true" textDirection="RTL"/>
				 *
				 * @since 1.86.0
				 */
				textDirection: {
					type: "sap.ui.core.TextDirection",
					group: "Appearance",
					defaultValue: TextDirection.Inherit
				},


				/**
				 * Text shown when no value available.
				 */
				placeholder: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * To be used in the HTML code (for example, for HTML forms that send data to the server via 'submit').
				 */
				name: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Visualizes the validation state of the control, e.g. <code>Error</code>, <code>Warning</code>,
				 * <code>Success</code>, <code>Information</code>.
				 *
				 * <b>Note:</b> This method is public because of an implementation side effect and should not be used
				 * for validation purposes as it may conflict with the <code>SmartField</code> control's own binding
				 * type validation logic based on the underlying metadata of the bound Entity Data Model (EDM)
				 * property.
				 * Invoking the <code>.setValueState()</code> and/or <code>.setValueStateText()</code> methods in a
				 * <code>change</code> event handle to set an error state does not prevent an invalid value from
				 * being stored in the binding/model in two-way data binding scenarios.
				 * In addition, it does not fire the <code>validationError</code> event, which is usually required by
				 * some upstream modules, for example, the message manager.
				 *
				 * Custom validation logic must be implemented in a custom binding type rather than in a
				 * <code>change</code> event handler.
				 */
				valueState: {
					type: "sap.ui.core.ValueState",
					group: "Appearance",
					defaultValue: ValueState.None
				},

				/**
				 * Defines the text of the value state message popup.
				 *
				 * <b>Note:</b> This method is public because of an implementation side effect and should not be used
				 * for validation purposes as it may conflict with the <code>SmartField</code> control's own binding
				 * type validation logic based on the underlying metadata of the bound Entity Data Model (EDM)
				 * property.
				 * Invoking the <code>.setValueState()</code> and/or <code>.setValueStateText()</code> methods in a
				 * <code>change</code> event handle to set an error state does not prevent an invalid value from
				 * being stored in the binding/model in two-way data binding scenarios.
				 * In addition, it does not fire the <code>validationError</code> event, which is usually required by
				 * some upstream modules, for example, the message manager.
				 *
				 * Custom validation logic must be implemented in a custom binding type rather than in a
				 * <code>change</code> event handler.
				 */
				valueStateText: {
					type: "string",
					group: "Appearance",
					defaultValue: ""
				},

				/**
				 * Defines whether the value state message is shown or not.
				 */
				showValueStateMessage: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * Data types to be used, if the <code>SmartField</code> control is interacting with a JSON model. If the value property of the
				 * control is bound to a property of an OData entity set, this property is not taken into consideration.
				 *
				 * @deprecated As of version 1.31.0 with no replacement.
				 */
				jsontype: {
					type: "sap.ui.comp.smartfield.JSONType",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates whether user input is required.
				 *
				 * <b>Note:</b> The <code>SmartField</code> control is metadata-driven and this property can
				 * be ignored if the following applies:
				 *
				 * <ul>
				 * <li>The bound Entity Data Model (EDM) property is annotated with the <code>Nullable</code>
				 * annotation. The <code>Nullable</code> annotation is a capability of the OData service that
				 * specifies whether a value is mandatory, hence it overrules the control's API settings.
				 * Therefore, if the <code>Nullable</code> attribute is specified as <code>Nullable="false"</code>,
				 * a value is mandatory.</li>
				 * <li>The bound EDM property is annotated with the <code>com.sap.vocabularies.Common.v1.FieldControl</code>
				 * annotation.</li>
				 * </ul>
				 *
				 * @example <caption>Scenario with Computed <code>mandatory</code> Value of <code>true</code></caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="ProductId" Type="Edm.String" Nullable="false"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{ProductId}" mandatory="false"/>
				 *
				 * @example <caption>Scenario with Computed <code>mandatory</code> Value of <code>true</code></caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="Name" Type="Edm.String">
				 *     <Annotation Term="com.sap.vocabularies.Common.v1.FieldControl" EnumMember="com.sap.vocabularies.Common.v1.FieldControlType/Mandatory"/>
			     * </Property>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{Name}" mandatory="false"/>
				 */
				mandatory: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Defines the highest possible number of permitted input characters that the user can enter
				 * into the text input field.
				 *
				 * <h3>Computed <code>maxLength</code></h3>
				 * If the specified <code>maxLength</code> value is greater than the <code>maxLength</code>
				 * value specified for the underlying bound Entity Data Model (EDM) property in the service
				 * metadata document, the <code>maxLength</code> value of the EDM property takes precedence.
				 * Likewise, if the application code provides a binding data type for the <code>value</code>
				 * property of the <code>SmartField</code> control and the binding data type has
				 * <code>maxLength</code> constraints defined, this <code>maxLength</code> is also taken into
				 * consideration to compute the final <code>maxLength</code> value.
				 *
				 * <h3>Validation Behavior</h3>
				 * By design, the <code>SmartField</code> control does not restrict/validate the highest
				 * number of permitted input characters for every keystroke, but only when the text input
				 * field has changed, and the browser focus leaves the text input field or the ENTER key is
				 * pressed. The <code>SmartField</code> control is used more generically in broader contexts,
				 * and adding a <code>maxLength</code> attribute to the HTML text input control may break data
				 * type formatting in two-way data-binding scenarios.
				 * Let's say the <code>maxLength</code> property is set to 3, but the text input control has
				 * a formatter function attached to it to format the entered value "DE" to "Germany (DE)".
				 * In this case, the formatted value will be truncated by the <code>maxLength</code> setting.
				 *
				 * @example <caption>Scenario with Computed <code>maxLength</code> Value of 3</caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="ProductId" Type="Edm.String"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{ProductId}" Type="Edm.String" maxLength="3"/>
				 *
				 * @example <caption>Scenario with Computed <code>maxLength</code> Value of 2</caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="ProductId" Type="Edm.String" MaxLength="3"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{ProductId}" Type="Edm.String" maxLength="2"/>
				 *
				 * @example <caption>Scenario with Computed <code>maxLength</code> Value of 3 Instead of 4</caption>
				 *
				 * // Extract of an EDM property of a service metadata document:
				 * <Property Name="ProductId" Type="Edm.String" MaxLength="3"/>
				 *
				 * // Extract of a definition of a SmartField control in an XML view:
				 * <SmartField value="{ProductId}" Type="Edm.String" maxLength="4"/>
				 */
				maxLength: {
					type: "int",
					group: "Misc",
					defaultValue: 0
				},

				/**
				 * If set to <code>true</code>, the suggestion feature for a hosted control is enabled, if the hosted control supports it.
				 */
				showSuggestion: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code>, a value help indicator will be displayed inside the hosted control, if the hosted control supports
				 * this.
				 */
				showValueHelp: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If set to <code>false</code> the label is not displayed.
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * This property contains the text of an associated <code>SmartLabel</code>.
				 */
				textLabel: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * This property contains the tool tip of the associated <code>SmartLabel</code> control.
				 */
				tooltipLabel: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Indicates whether the unit of measure field is visible.
				 *
				 * <b>Note:</b> This control property is only valid if the <code>SmartField</code> control
				 * addresses a unit of measure composite field, for example, an amount field and its associated
				 * currency field. The field must then be annotated with one of the following annotations:
				 *
				 * <ul>
				 * <li>The bound Entity Data Model (EDM) property or its entity set are annotated with the
				 * OData V2 <code>sap:unit</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Measures.V1.ISOCurrency</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Measures.V1.Unit</code> annotation.</li>
				 * </ul>
				 *
				 * <b>Note:</b> The <code>SmartField</code> control is metadata-driven, and this property can
				 * be ignored if the bound EDM property is annotated with the <code>com.sap.vocabularies.Common.v1.FieldControl</code>
				 * annotation.
				 */
				uomVisible: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Indicates whether the unit of measure field is in display or edit mode.
				 *
				 * <b>Note:</b> This control property is only valid if the <code>SmartField</code> control
				 * addresses a unit of measure composite field, for example, an amount field and its associated
				 * currency field. The field must then be annotated with one of the following annotations:
				 *
				 * <ul>
				 * <li>The bound Entity Data Model (EDM) property or its entity set are annotated with the
				 * OData V2 <code>sap:unit</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Measures.V1.ISOCurrency</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Measures.V1.Unit</code> annotation.</li>
				 * </ul>
				 *
				 * <b>Note:</b> The <code>SmartField</code> control is metadata-driven, and this control
				 * property can be ignored if the following applies:
				 *
				 * <ul>
				 * <li>The bound Entity Data Model (EDM) property or its entity set are annotated with the
				 * OData V2 <code>sap:updatable</code> annotation.</li>
				 * <li>The bound EDM property or its entity set are annotated with the <code>sap:creatable</code>
				 * annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V2
				 * <code>sap:updatable-path</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Capabilities.V1.InsertRestrictions</code> annotation.</li>
				 * <li>The bound EDM property is annotated with the
				 * <code>com.sap.vocabularies.Common.v1.FieldControl</code> annotation.</li>
				 * <li>The entity set of the bound EDM property is annotated with the OData V4
				 * <code>Org.OData.Capabilities.V1.UpdateRestrictions</code> annotation.</li>
				 * </ul>
				 */
				uomEditable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Enabled state of the unit, if the <code>SmartField</code> control addresses unit of measure use cases, for example, an amount and
				 * its associated currency.
				 */
				uomEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Contains a URL which is used to render a link. The link is rendered, if the OData property, to which the value property of the
				 * control is bound, is of type <code>Edm.String</code> and the <code>SmartField</code> is in display mode.
				 */
				url: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * This property is for internal use only.
				 *
				 * @since 1.32.0
				 * @private
				 * @ui5-restricted sap.ui.comp.smartfield.SmartField
				 */
				uomEditState: {
					type: "int",
					group: "Misc",
					defaultValue: -1
				},

				/**
				 * Defines the context in which the layout of the <code>SmartField</code> control has to be interpreted.
				 *
				 * @since 1.32.0
				 */
				controlContext: {
					type: "sap.ui.comp.smartfield.ControlContextType",
					group: "Misc",
					defaultValue: ControlContextType.None
				},

				/**
				 * Proposes a control to be rendered. The <code>SmartField</code> control can ignore the proposal.
				 *
				 * @deprecated As of version 1.32.0 with no replacement.
				 * @since 1.32.0
				 */
				proposedControl: {
					type: "sap.ui.comp.smartfield.ControlProposalType",
					group: "Misc",
					defaultValue: ControlProposalType.None
				},

				/**
				 * Indicates whether the control break lines (in display mode) to prevent overflow.
				 *
				 * @since 1.36.6
				 */
				wrapping: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Determines if the mandatory check of whether the field has a value happens on the client side - <code>true</code> or on the server side -
				 * <code>false</code>.
				 *
				 * <b>Note:</b> If the {@link sap.ui.comp.smartfield.SmartField#value} property of the
				 * <code>SmartField</code> control is bound to an Entity Data Model (EDM) property of type different
				 * from Edm.String annotated as <code>Nullable="false"</code>, the mandatory validation is performed on the client side regardless of
				 * the <code>clientSideMandatoryCheck</code> setting.
				 *
				 * <i>Example:</i>
				 *
				 * <pre>
				 *     &lt;Property Name=&quot;CategoryID&quot; Type=&quot;Edm.Decimal&quot; Nullable=&quot;false&quot;/&gt;
				 * </pre>
				 *
				 * @since 1.38.3
				 */
				clientSideMandatoryCheck: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Indicates whether the value list collection is fetched in display mode from the resource path
				 * specified in the <code>com.sap.vocabularies.Common.v1.ValueList</code> annotation.
				 *
				 * This collection data is used to infer a descriptive text for the value of the <code>SmartField</code>
				 * control. However, fetching the value list collection for every <code>SmartField</code> instance
				 * individually may not be ideal in some performance-critical scenarios.
				 * To optimize this default behavior, you can set this property to <code>false</code> and provide the
				 * <code>com.sap.vocabularies.Common.v1.Text</code> annotation, which is used to specify the URL path
				 * name to the Entity Data Model (EDM) property from which the descriptive text for the value of the
				 * <code>SmartField</code> control is fetched, for example, LT (Laptop).
				 *
				 * <b>Note:</b> Setting this property to <code>false</code> only has an effect if the <code>value</code>
				 * property of the <code>SmartField</code> control is bound to an Entity Data Model (EDM) property typed
				 * as <code>Edm.String</code>. In addition, applications or frameworks have to make sure the descriptive
				 * text is fetched, for example, by expanding a navigation property.
				 *
				 * @since 1.42.0
				 */
				fetchValueListReadOnly: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Indicates if entities related to navigation properties inside the metadata are requested.
				 * If set to <code>true</code>, then these related entities are loaded with an <code>$expand</code> request.
				 *
				 * Annotations that can have navigation properties are the following:
				 * <ul>
				 * 	<li> <code>com.sap.vocabularies.Common.v1.Text</code> for text arrangements
				 * 	<li> <code>Org.OData.Measures.V1.Unit</code> and <code>Org.OData.Measures.V1.ISOCurrency</code> for units
				 * 	<li> <code>com.sap.vocabularies.Common.v1.FieldControl</code> for field control
				 * </ul>
				 *
				 * <b>Note:</b> Independent of the <code>fetchValueListReadOnly</code> value, setting this flag to <code>true</code>
				 * requests data from the backend.
				 *
				 * <b>Note:</b> The back-end request to expand the navigation properties is sent only if the entity to which
				 * <code>SmartField</code> is bound is persisted.
				 * For transient entities, there is no back-end request since no such data is available.
				 *
				 * @deprecated Since 1.117. It is recommended the expand to be using the OData Model.
				 * @since 1.48
				 */
				expandNavigationProperties: {
					type: "boolean",
					group: "Behavior",
					defaultValue: false
				},

				/**
				 * Sets the source from which text descriptions for <code>IDs</code> are fetched in edit mode, for example,
				 * for LT (Laptop).
				 *
				 * <b>Note</b>: The <code>sap.ui.comp.smartfield.TextInEditModeSource.NavigationProperty</code> and
				 * <code>sap.ui.comp.smartfield.TextInEditModeSource.ValueList</code> enumeration members are only supported if the
				 * following applies:
				 *
				 * <ul>
				 * <li>The <code>value</code> property of the <code>SmartField</code> control instance
				 * is bound to an Entity Data Model (EDM) property typed as <code>Edm.String</code> or <code>Edm.Guid</code>.</li>
				 * <li>The <code>com.sap.vocabularies.UI.v1.TextArrangement</code> annotation for the bound EDM property or entity
				 * type is specified in the service metadata document or annotation file.</li>
				 * <li>The binding mode for the <code>value</code> property of the <code>SmartField</code> control is the two-way binding
				 * mode.</li>
				 * <li>The field from which the description is fetched is filterable.</li>
				 * </ul>
				 *
				 * <b>Note</b>: In addition, the <code>sap.ui.comp.smartfield.TextInEditModeSource.NavigationProperty</code> enumeration
				 * member is only supported if the following applies:
				 *
				 * <ul>
				 * <li>The EDM navigation property association is defined in the service metadata document.</li>
				 * <li>The <code>com.sap.vocabularies.Common.v1.Text</code> annotation for the bound EDM property is specified in the
				 * service metadata document or annotation file whose <code>Path</code> attribute points to a EDM navigation property
				 * of a lookup entity set/type whose single key property is the <code>ID</code>, which contains (among other properties)
				 * the descriptive value.</li>
				 * <li>The lookup entity must be loaded. The lookup entity can be loaded by expanding the EDM navigation property via
				 * a <code>$expand</code> query parameter.</li>
				 * <li>The EDM navigation property association defines a referential constraint that ties values of the dependent editable
				 * entity type/set to the lookup entity type/set in the service metadata document.</li>
				 * <li>The EDM navigation property association end multiplicity of the lookup entity type/set is defined as <code>1</code>
				 * in the service metadata document. There must be a single-valued navigation from the editable entity set/type
				 * to the lookup entity set/type.</li>
				 * <li>The lookup entity type/set from which the descriptive value is fetched contains a single-key EDM property.</li>
				 * </ul>
				 *
				 * <b>Note</b>: As of version 1.82, if <code>SmartField</code> is used inside a <code>SmartForm</code>,
				 * <code>defaultTextInEditModeSource</code> can be added as custom data to the form and it will be
				 * propagated to all smart fields that cover the above criteria. However, if <code>textInEditModeSource</code> is added
				 * to the <code>SmartField</code> as property, it will override the <code>defaultTextInEditModeSource</code>
				 * propagated from the <code>SmartForm</code> custom data.
				 *
				 * <b>Note</b>: As of version 1.107 the property will be used to configure the validation for fixed list
				 * fields of type <code>ComboBox</code>. The values that will be considered:
				 * <ul>
				 *     <li>ValueList - strict validation</li>
				 *     <li>ValueListWarning - non-strict validation</li>
				 * </ul>
				 *
				 * @since 1.83
				 */
				textInEditModeSource: {
					type: "sap.ui.comp.smartfield.TextInEditModeSource",
					group: "Behavior",
					defaultValue: TextInEditModeSource.None
				},

				/**
				 * If the property is set to <code>false</code>, history values are disabled.  Changes at runtime
				 * are not reflected. The <code>historyEnabled</code> property is not applied to custom controls.
				 *
				 * <b>Note:</b> For {@link sap.m.ComboBox} and {@link sap.m.MultiComboBox} the history values
				 * are disabled by default. To enable them for these controls, you need to set the
				 * <code>historyEnabled</code> property to <code>true</code>.
				 *
				 * @since 1.84
				 */
				historyEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies the importance of the field. Applicable only when the <code>SmartField</code> is used inside <code>SmartForm</code>.
				 *
				 * @since 1.87
				 */
				importance: {
					type: "sap.ui.comp.smartfield.Importance",
					group: "Misc",
					defaultValue: Importance.Low
				},

				/**
				 * If the property is set to <code>true</code>, a standard validation for {@link sap.m.ComboBox} is performed.
				 * An inner control {@link sap.m.ComboBox} is created and the binding is to <code>selectedKey</code>.
				 * Changes at runtime are not reflected.
				 *
				 * <b>Note:</b> This property switches the control in legacy mode. If set to <code>true</code> this will override
				 * any setting to <code>textInEditModeSource</code> property regarding ComboBox validation.
				 *
				 * <b>Note:</b> If the property is set to <code>false</code>, the inner control is
				 * {@link sap.ui.comp.smartfield.ComboBox} and the binding is to <code>enteredValue</code>.
				 * In this case, any entered value is valid irrespective of whether it's in the predefined list or not.
				 *
				 * <b>Note:</b> This property is applicable only for fixed-value scenarios.
				 *
				 * @since 1.88
				 */
				fixedValueListValidationEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Providing value here will overwrite the internally assigned FieldGroupIds calculated from the service
				 * metadata. This property accepts comma delimited list of FieldGroupIds.
				 * @private
				 */
				_internalFieldGroupIds: {
					type: "string[]",
					defaultValue: [],
					visibility: "hidden"
				}
				,

				/**
				 * Controls if a query is sent to the backend in case of an empty string.
				 * @since 1.124
				 */
				suppressEmptyStringRequest: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Controls if the title is taken from the label of the main property or from the label of the value list.
				 * @since 1.132
				 */
				valueHelpTitleSource: {
					type: "sap.ui.comp.smartfield.ValueHelpTitleSource",
					group: "Behavior",
					defaultValue: ValueHelpTitleSource.Property
				}
			},
			aggregations: {
				/**
				 * The content aggregation is used to hold the control that is hosted by the <code>SmartField</code> control.
				 */
				_content: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				},

				/**
				 * Optional configuration for <code>SmartField</code>.
				 *
				 * <b>Note</b>: By default, the value of the <code>displayBehaviour</code> property is not evaluated
				 * in edit mode. To enable this feature in edit mode, set the <code>textInEditModeSource</code> control property
				 * to a non-default value.
				 */
				configuration: {
					type: "sap.ui.comp.smartfield.Configuration",
					multiple: false
				},

				/**
				 * Proposes a control to be rendered. The <code>SmartField</code> control can ignore the proposal.
				 *
				 * @since 1.32.0
				 * @deprecated As of version 1.34.0 with no replacement.
				 */
				controlProposal: {
					type: "sap.ui.comp.smartfield.ControlProposal",
					multiple: false
				},

				/**
				 * Collects the texts to be used for the ARIA labels.<br>
				 * The InvisibleText controls will be added to the DOM by the <code>SmartField</code> control.
				 *
				 * @since 1.34.2
				 */
				_ariaLabelInvisibleText: {
					type: "sap.ui.core.InvisibleText",
					multiple: true,
					visibility: "hidden"
				},

				/**
				 * The Semantic Object Controller allows the user to specify and overwrite functionality for semantic object navigation.
				 */
				semanticObjectController: {
					type: "sap.ui.comp.navpopover.SemanticObjectController",
					multiple: false
				}
			},
			associations: {
				/**
				 * Association to controls / IDs which label this control (see WAI-ARIA attribute <code>aria-labelledby</code>).
				 *
				 * @since 1.34.2
				 */
				ariaLabelledBy: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "ariaLabelledBy"
				},

				/**
				 * Association to controls / IDs that describe this control (see WAI-ARIA attribute <code>aria-describedby</code>).
				 * @since 1.96
				 */
				ariaDescribedBy: {
					type: "sap.ui.core.Control",
					 multiple: true,
					  singularName: "ariaDescribedBy"
				}
			},
			events: {
				/**
				 * The OData entity set is either derived from the control's binding context or from control's entity set property, if a value for it
				 * is specified. In both cases this event is fired.
				 */
				entitySetFound: {
					parameters: {

						/**
						 * The path to the found entity set
						 */
						entitySet: {
							type: "string"
						}
					}
				},

				/**
				 * The event is fired after the text in the field has been changed and the focus leaves the field, or after the Enter key has been
				 * pressed.
				 *
				 * <b>Note:</b> This event is fired even if the value of the text input field is subject to data type constraints and
				 * the constraints are violated. Also, the invalid value is not stored in the binding/model.
				 */
				change: {
					parameters: {

						/**
						 * The current value inside the text field
						 *
						 * <b>Note:</b> This value is the formatted value, and in some cases it might differ from the value stored in the binding/model.
						 * Usually, the value that is sent to the back-end system should be the value stored in the binding/model, which is
						 * the parsed and validated value.
						 */
						value: {
							type: "string"
						},

						/**
						 * The new value inside the text field
						 */
						newValue: {
							type: "string"
						}
					}
				},

				/**
				 * Fired after the text in the field has been changed by user interaction in combination with one of the following actions:
				 *
				 * <ul>
				 * <li>The focus leaves the field</li>
				 * <li>The Enter key is pressed</li>
				 * <li>The value is selected from the suggestions list</li>
				 * <li>The value is selected from the <code>ValueHelpDialog</code></li>
				 * </ul>
				 *
				 * If the value of the text input field is subject to data type constraints, the constraints must be fulfilled,
				 * which implies the value is stored in the binding/model before the event is fired.
				 *
				 */
				changeModelValue: {
					parameters: {

						/**
						 * Indicates whether the field quantity field has changed
						 */
						valueChanged: {
							type: "boolean"
						},

						/**
						 * Last value of the <code>valueState</code> property of the field quantity field
						 */
						valueLastValueState: {
							type: "boolean"
						},

						/**
						 * Indicates whether the field unit field has changed
						 */
						unitChanged: {
							type: "boolean"
						},

						/**
						 * Last value of the <code>valueState</code> property of the field unit field
						 */
						unitLastValueState: {
							type: "sap.ui.core.ValueState"
						}
					}
				},

				/**
				 * The event is fired after the smart field has calculated its metadata.
				 *
				 */
				initialise: {},

				/**
				 * The event is fired after the visibility of the control has changed.
				 */
				visibleChanged: {
					parameters: {

						/**
						 * If <code>true</code>, the control is visible
						 */
						visible: {
							type: "boolean"
						}
					}
				},

				/**
				 * Fired when the control is rendered if the value of <code>editable</code> property of the control has changed.
				 *
				 * @since 1.30.0
				 */
				editableChanged: {
					parameters: {

						/**
						 * If <code>true</code>, the control is in edit mode
						 */
						editable: {
							type: "boolean"
						}
					}
				},

				/**
				 * Fired when the control is rendered if the value of <code>contextEditable</code> property of the control has changed.
				 *
				 * @since 1.32.0
				 */
				contextEditableChanged: {
					parameters: {

						/**
						 * The value of the context editable property of the control
						 */
						editable: {
							type: "boolean"
						}
					}
				},

				/**
				 * The event is fired after the inner controls have been toggled.
				 *
				 * @since 1.117.0
				 */
				modeToggled: {},

				/**
				 * The event is fired after the inner controls have been created.
				 */
				innerControlsCreated: {},

				/**
				 * The event is fired when after selection of values with value help or auto-suggest, the model is updated with the selected data.
				 *
				 * @since 1.31.0
				 *
				 */
				valueListChanged: {
					parameters: {

						/**
						 * An array of selected values
						 */
						changes: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * Fires when the user triggers the link control
                                 * When handler attached, the rendered control is <code>sap.m.Link</code>
				 * @private
				 * @ui5-restricted sap.fe
				 * @since 1.127.0
				 */
				linkPress: {},

				/**
				 * Fires when the user triggers the link control or taps/clicks on an active title of the object identifier control.
				 * When handler attached, the rendered control is <code>sap.m.Link</code>
				 *
				 * @deprecated As of version 1.116.0 with no replacement.
				 * @since 1.36.0
				 */
				press: {}
			}
		},
		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
		 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered.
		 * @private
		 * @since 1.34.0
		 */
		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				var oContent = oControl.getContent(),
					oInnerControl = oControl.getFirstInnerControl();

				oRm.openStart("div", oControl);
				oRm.class("sapUiCompSmartField");

				oRm.openEnd();
				if (oContent && oControl.getMode() === "display" && oControl.isFormContextType() && oControl._innerControlHasNoValue() &&
					oInnerControl !== null && !oInnerControl.getMetadata().hasProperty("emptyIndicatorMode")) {
					oRm.openStart("span");
					oRm.class("sapUiPseudoInvisibleText");
					oRm.openEnd();
						oRm.text(Library.getResourceBundleFor("sap.ui.comp").getText("NO_VALUE"));
					oRm.close("span");
					oRm.openStart("span");
					oRm.attr("aria-hidden", "true");
					oRm.class("sapMText");
					oRm.class("sapUiSelectable");
					oRm.class("sapMTextMaxWidth");
					oRm.class("sapUiCompSmartFieldValue");
					oRm.class("sapUiCompEmptyValue");
					oRm.openEnd();
					oRm.close("span");
				}

				oRm.renderControl(oContent);

				if (oControl.getAggregation("_ariaLabelInvisibleText")) {
					oControl.getAggregation("_ariaLabelInvisibleText").forEach(function(oInvisibleText) {
						oRm.renderControl(oInvisibleText);
					});
				}
				oRm.close("div");
			}
		}
	});

	// apply the message mixin so all message on the SmartField will get the associated label-texts injected
	MessageMixin.call(SmartField.prototype);
	var fnMixinRefreshDataState = SmartField.prototype.refreshDataState;

	SmartField.prototype.init = function() {
		this._isInnerControlCreationDelayed = true;
		this._sAnnotationLabel = "";
		this._bInDestroy = false;
		this._oSideEffects = new SideEffectUtil(this);
		this._oFactory = null;

		this._oControl = {
			display: null,
			edit: null,
			current: null
		};

		this._oValue = {
			display: null,
			edit: null,
			uom: null,
			uomset: null
		};

		this._oError = {
			bComplex: false,
			bFirst: false,
			bSecond: false
		};

		this._oState = this._initState();

		this._oUtil = new BindingUtil();
		this._bSuppressToggleControl = false;

		this.oValidation = new ValidationUtil(this);

		this._oLastValidated = null;
		this._bValueNotInitial = false;

		// The creation/update of basic controls is handled in onBeforeRendering handler.
		// On model/context change we are invalidating the SF, so that onBeforeRendering handler is invoked.
		this.attachModelContextChange(function () {
			// If there is no binding context or the binding context is not pointing to the default model
			// and the default model is not propagated to the SmartField
			// we do nothing
			if (this._hasDefaultModel()) {
				LifecycleUtil._createICRenderedDeferred.call(this);
				this.invalidate();

				this._getComputedMetadata().then(function (oMetadata) {
					if (oMetadata?.annotations?.valuelistType === "fixed-values") {
						let bShouldUpdateBindings = this.getMode() === "display" ? true : false;
						const sPath = this.getBindingContext().getPath();
						const oEditControl = this._oControl?.edit;
						const sEditControlPath = oEditControl?.getBindingContext()?.getPath();

						if (oEditControl &&
							((!oEditControl.getBindingContext() && this.getBindingContext()) ||
							sPath !== sEditControlPath)
						) {
							oEditControl.setBindingContext(this.getBindingContext());
							bShouldUpdateBindings = true;
						}

						if (bShouldUpdateBindings) {
							this.getControlFactory()?.getValueListProvider()?._updateBindings();
						}
					}

				}.bind(this));
			}
		}.bind(this));
		// Internal deferred object used to track if the control state is applied initially
		this._initialStateApplied = new Deferred();

		// Initial value flag
		this._initialStateApplied.promise.then(function () {
			var oBinding = this.getBinding("value");
			if (oBinding) {
				var fnChangeHandler = function () {
					var oDataState = this.getBinding("value").getDataState();
					if (oDataState.getOriginalValue() !== oDataState.getValue()) {
						this._bValueNotInitial = true;
						oBinding.detachChange(fnChangeHandler);
					}
				}.bind(this);

				oBinding.attachChange(fnChangeHandler);
			}
		}.bind(this));

		this._oObserverConfiguration = {
			properties: [
				"visible"
			]
		};

		this._oObserver = new ManagedObjectObserver(function (oMutation) {
			if (!oMutation) {
				 return;
			}

			if (oMutation.type === "property" &&
				oMutation.name === "visible" &&
				oMutation.current === false) {
					this._oState._setProperty("VISIBLE", oMutation.current);
					this.fireVisibleChanged({
						visible: oMutation.current
					});
			}
		}.bind(this));

		// Initiate the observer
		this._oObserver.observe(this, this._oObserverConfiguration);

		// Account for late sync between SmartLabel and SmartField
		EventBus.getInstance().publish("sap.ui.comp.smartfield.SmartField", "INSTANCE_CREATED", {id: this.getId()});
	};

	/**
	 * Sets a new value for the <code>visible</code> property.
	 *
	 * <b>Note:</b> The <code>SmartField</code> control is metadata-driven, and this property can
	 * be ignored if the bound EDM property is annotated with the <code>com.sap.vocabularies.Common.v1.FieldControl</code>
	 * annotation.
	 *
	 * @example <caption>Scenario with Computed <code>visible</code> Value of <code>false</code></caption>
	 *
	 * // Extract of an EDM property of a service metadata document:
	 * <Property Name="ID" Type="Edm.Guid">
	 *     <Annotation Term="com.sap.vocabularies.Common.v1.FieldControl" EnumMember="com.sap.vocabularies.Common.v1.FieldControlType/Hidden"/>
	 * </Property>
	 *
	 * // Extract of a definition of a SmartField control in an XML view:
	 * <SmartField value="{ID}"/>
	 *
	 * @example <caption>Scenario with Computed <code>visible</code> Value of <code>false</code></caption>
	 *
	 * // Extract of an EDM property of a service metadata document:
	 * <Property Name="ID" Type="Edm.Guid">
	 *     <Annotation Term="com.sap.vocabularies.Common.v1.FieldControl" EnumMember="com.sap.vocabularies.Common.v1.FieldControlType/Hidden"/>
	 * </Property>
	 *
	 * // Extract of a definition of a SmartField control in an XML view:
	 * <SmartField value="{ID}" visible="true"/>
	 * @name sap.ui.core.Control#setVisible
	 */

	/**
	 * Promise resolves on next control mode change after control is re-rendered.
	 * @returns {promise}
	 * @ui5-restricted sap.ui.generic.template
	 * @private
	 */
	SmartField.prototype._getNextModeRenderedPromise = LifecycleUtil._getNextModeRenderedPromise;

	/**
	 * @returns {promise|undefined}
	 * @ui5-restricted sap.ui.generic.template
	 * @private
	 */
	SmartField.prototype._getICRenderedPromise = LifecycleUtil._getICRenderedPromise;

	SmartField.prototype._rejectLifecyclePromises = LifecycleUtil._rejectAll;

	/**
	 * Should the SmartField consider the Common.Text annotation.
	 * @returns {boolean}
	 */
	SmartField.prototype._shouldSuppressTextAnnotation = function () {
		return this.data("suppressCommonText") === "true";
	};

	/**
	 * Changes the visibility of the <code>SmartField</code> based on the <code>SmartField</code> and <code>SmartForm</code> <code>importance</code> property.
	 * When the <code>SmartForm</code> has <code>importance high</code>, only fields with high importance will be visible.
	 * When the <code>SmartForm</code> has <code>importance medium</code>, only fields with high or medium importance will be shown.
	 * When the <code>SmartForm</code> has <code>importance low</code>, all fields will be visible.
	 * @param {sap.ui.comp.smartform.Importance} sFormImportance The <code>SmartForm</code> <code>importance</code> property
	 * @private
	 * @ui5-restricted sap.ui.comp.smartform.SmartForm
	 */
	SmartField.prototype._setVisibilityBasedOnImportance = function(sFormImportance) {
		var oMetadata,
			oProperty,
			sFieldImportance,
			oAnnotationHelper,
			sDisplay,
			oFactory = this._oFactory,
			oGroupElementDomRef = this.oParent && this.oParent.isA("sap.ui.comp.smartform.GroupElement") && this.oParent.getDomRef();

		if (!oFactory || !oGroupElementDomRef) {
			return;
		}

		oMetadata = oFactory.getMetaData && oFactory.getMetaData();
		oProperty = oMetadata && oMetadata.property && oMetadata.property.property;
		oAnnotationHelper = oFactory._oHelper && oFactory._oHelper.oAnnotation;

		//  In case the field is annotated as mandatory or hidden do not change its visibility
		if (oAnnotationHelper) {
			if (
				!oAnnotationHelper.isNullable(oProperty) ||
				oAnnotationHelper.isStaticMandatory(oProperty) ||
				oAnnotationHelper.getVisible(oProperty) === "false"
			) {
				return;
			}
		}

		// In case the field is mandatory or hidden using property or FieldControl annotation do not change its visibility
		if (this.getMandatory() ||
			!this.getVisible() ||
			this._fieldControlValue === 0 ||
			this._fieldControlValue === 7) {
				return;
		}

		// If property Importance is set it takes precedence over the annotation
		sFieldImportance = (!this.isPropertyInitial("importance") && this.getImportance()) ||
			(oAnnotationHelper && oAnnotationHelper.getImportanceAnnotation(oProperty));

		// Calculate the CSS display for the GroupElement based on SmartForm and SmartField importance
		switch (sFormImportance) {
			case Importance.High:
				sDisplay = sFieldImportance === Importance.High ? "" : "none";
				break;
			case Importance.Medium:
				sDisplay = sFieldImportance === Importance.Low ? "none" : "";
				break;
			default:
				sDisplay = "";
		}

		oGroupElementDomRef.style.display = sDisplay;
	};

	/**
	 *  @private
	 *  @ui5-restricted sap.ui.comp.smartfield.SmartLabel,
	 *  				sap.ui.comp.smartForm.GroupElement,
	 *  				sap.ui.comp.smartfield.ODataControlFactory
	 */
	SmartField.prototype.getComputedTextLabel = function() {
		return this.getProperty("textLabel") || this._sAnnotationLabel;
	};

	// Indicates whether the property is currently being updated by the framework due to a property binding
	// change e.g., by calling .updateProperty(sPropertyName)
	SmartField.prototype.isPropertyBeingUpdatedByModel = function(sPropertyName) {
		var oBindingInfo = this.getBindingInfo(sPropertyName);
		return !!(oBindingInfo && oBindingInfo.skipModelUpdate);
	};

	SmartField.prototype._boundEntityExists = function(vBindingContext) {
		vBindingContext = vBindingContext || this.getBindingContext();
		return !!(vBindingContext && vBindingContext.getObject());
	};

	SmartField.prototype.setShowValueHelp = function(bValueHelp) {
		var bPreviousValueHelp = this.getShowValueHelp();
		this.setProperty("showValueHelp", bValueHelp, true);
		var oChild = this.getContent();

		if (oChild && (typeof oChild.setShowValueHelp === "function")) {
			bValueHelp = this.getShowValueHelp();
			var bValueHelpStateChanged = bValueHelp !== bPreviousValueHelp,
				oFactory = this._oFactory;

			if (bValueHelpStateChanged && oFactory) {

				//"SNOW: CS20240007033219": making sure before creating valueHelp any existing one is destroyed
				oFactory.destroyValueHelp();

				if (bValueHelp) {
					oFactory._createValueHelp();
				}
			}

			oChild.setShowValueHelp(bValueHelp);
		}

		return this;
	};

	SmartField.prototype.setShowSuggestion = function(bShowSuggestion) {
		var bPreviousShowSuggestion = this.getShowSuggestion();
		this.setProperty("showSuggestion", bShowSuggestion, true);
		var oChild = this.getContent();

		if (oChild && (typeof oChild.setShowSuggestion === "function")) {
			bShowSuggestion = this.getShowSuggestion();
			var bShowSuggestionStateChanged = bShowSuggestion !== bPreviousShowSuggestion,
				oFactory = this._oFactory;

			if (bShowSuggestionStateChanged && oFactory) {

				if (bShowSuggestion) {
					oFactory._createValueHelp();
				} else {
					oFactory.destroyValueHelp();
				}
			}

			oChild.setShowSuggestion(bShowSuggestion);
		}

		return this;
	};

	SmartField.prototype.setConfiguration = function(oConfig) {
		var oOldConfig = this.getConfiguration(),
			oReturn = this.setAggregation("configuration", oConfig, true);
		oConfig = this.getConfiguration();

		var bConfigAggregationChanged = !!((oConfig && (oOldConfig === null)) || (oOldConfig && (oConfig === null))),
			bHasContent = !!this.getContent();

		if (bHasContent &&
			(bConfigAggregationChanged ||
				(oConfig && oOldConfig &&
					(
						(oConfig.getControlType() !== oOldConfig.getControlType()) ||
						(oConfig.getDisplayBehaviour() !== oOldConfig.getDisplayBehaviour())
					)
				)
			)
		) {
			this._destroyControls();
			this._toggleInnerControlIfRequired({mode: this.getMode()});
			if (oConfig && oConfig.getDisplayBehaviour()) {
				this._onInnerControlToggled({
					mode: this.getMode(),
					fetchIDAndDescription: true,
					forceTextArrangementFetch: true
				});
			}

		}

		return oReturn;
	};

	SmartField.prototype.setTooltip = function(vTooltip) {
		this._refreshTooltipBaseDelegate(vTooltip);
		this.setAggregation("tooltip", vTooltip, true);
		var oChild = this.getFirstInnerControl();

		if (oChild) {
			oChild.setTooltip(vTooltip);
		}

		return this;
	};

	/**
	 * Sets the SmartField's width to the inner control
	 *
	 * @returns {this} <code>this</code> to allow method chaining
	 * @private
	 */
	SmartField.prototype._setOnInnerControl = function() {
		var sJustifyContent,
			sJustifyContentCurrent,
			oChild = this.getContent(),
			oControl = this.getFirstInnerControl(),
			sTextAlign = this.getTextAlign();

		if (oChild) {

			if (typeof oChild.setWidth === "function") {
				var sWidth = this.getWidth();

				// set the width if and only if a value other than the default is available (default is "")
				// the problem is that some controls (e.g. sap.m.Select and sap.m.ComboBox) have a width set during creation
				// we do not want to invalidate this.
				// if there are problems, always check these controls.
				if (sWidth) {
					oChild.setWidth(sWidth);
				}
			}

			this._setPropertyOnControls("wrapping", this.getWrapping());

			if (typeof oChild.setName === "function") {
				oChild.setName(this.getName());
			}

			if (typeof oChild.setPlaceholder === "function" && this.getPlaceholder() !== "") {
				oChild.setPlaceholder(this.getPlaceholder());
			}

			if (typeof oChild.setTextAlign === "function" && (!oChild.getTextAlign() || sTextAlign !== TextAlign.Initial)) {
				oChild.setTextAlign(sTextAlign);
			}

			if (typeof oChild.setJustifyContent === "function") {
				sJustifyContentCurrent = oChild.getJustifyContent();
				if (!sJustifyContentCurrent || sJustifyContentCurrent === "") {
					if (sTextAlign === TextAlign.Initial || sTextAlign === TextAlign.Begin) {
						sJustifyContent = FlexJustifyContent.Start;
					} else if (sTextAlign === "Right") {
						sJustifyContent = FlexJustifyContent.End;
					} else {
						sJustifyContent = sTextAlign;
					}
					oChild.setJustifyContent(sJustifyContent);
				}
			}

			this._setPropertyOnControls("required", this.getMandatory());
			this._setPropertyOnControls("textDirection", this.getTextDirection());

			if (oControl && oControl.getMetadata().getProperty("textAlign") && (!oControl.getTextAlign() || sTextAlign !== TextAlign.Initial) ) {
				this._setPropertyOnControls("textAlign", sTextAlign);
			}
		}

		return this;
	};

	SmartField.prototype.getUomProperty = function(sPropertyName) {
		var oUoMNestedSmartField = this._getEmbeddedSmartField(),
			oUoMNestedSmartFieldFactory = oUoMNestedSmartField && oUoMNestedSmartField.getControlFactory(),
			oUoMFieldControl = oUoMNestedSmartFieldFactory && oUoMNestedSmartFieldFactory._oFieldControl,
			sPropertyNameCapitalized = capitalize(sPropertyName),
			sUoMMutatorGetterName = "getUom" + sPropertyNameCapitalized,
			bUoMPropertyValue = this[sUoMMutatorGetterName]();

		if (oUoMNestedSmartField.isBound(sPropertyName) && oUoMFieldControl) {
			var oUoMFieldMetaData = oUoMNestedSmartFieldFactory.getMetaData();

			if (oUoMFieldMetaData) {
				var oBindingInfo = oUoMFieldControl._oStoredBindings[sPropertyName],
					oUoMFormatter = oUoMFieldControl["_get" + sPropertyNameCapitalized](oUoMFieldMetaData, oBindingInfo, sPropertyName);

				oUoMFormatter.path();
				var vState = oUoMFormatter.formatter.call(oUoMNestedSmartField, bUoMPropertyValue);
				return vState;
			}
		}

		return bUoMPropertyValue;
	};

	SmartField.prototype._setPropertyOnControls = function(sProperty, vValue, aControls) {
		aControls = aControls || this.getInnerControls();

		aControls.forEach(function(oControl) {
			var sMutator = "set" + capitalize(sProperty);

			if (typeof oControl[sMutator] === "function") {
				oControl[sMutator](this._convertValueForControl(sProperty, vValue, oControl));
			}
		}, this);
	};

	/**
	 * Gets the converted value for the given inner control instance.
	 *
	 * @param {string} sProperty The property name
	 * @param {string} vValue The value to convert
	 * @param {sap.ui.core.Control} oControl The control instance where the value is propagated
	 * @returns {boolean|string} The converted value for <code>sProperty</code> of <code>oControl</code>
	 * @private
	 * @since 1.56
	 */
	SmartField.prototype._convertValueForControl = function(sProperty, vValue, oControl) {
		var oProperty;

		if (oControl) {
			oProperty = oControl.getMetadata().getProperty(sProperty);
		}

		if (oProperty) {

			switch (sProperty) {
				case "wrapping":

					switch (oProperty.type) {
						case "boolean":
							return vValue;

						case "sap.ui.core.Wrapping":
							var mWrappingMode = coreLibrary.Wrapping;

							if (vValue) {
								return mWrappingMode.Soft;
							}

							return mWrappingMode.None;

						// no default
					}

				// no default
			}
		}

		return vValue;
	};

	SmartField.prototype.setEntitySet = function(sValue) {
		this.setProperty("entitySet", sValue, true);
		this.fireEntitySetFound({
			entitySet: sValue
		});
		return this;
	};

	/*
	 * If set to <code>false</code>, creation of inner controls is suspended until editable or contextEditable is set.
	 * As the default for editable is <code>true</code> the edit control would be created even in display scenarios.
	 * The method is used by the SmartTable control for performance reasons.
	 */
	SmartField.prototype._setPendingEditState = function(bDisplayState) {
		this.data("pendingEditableState", !bDisplayState);
	};

	SmartField.prototype.setContent = function(vContent) {
		return this.setAggregation("_content", vContent);
	};

	SmartField.prototype.getContent = function() {
		return this.getAggregation("_content");
	};

	/*
	 * Gets the control factory object.
	 *
	 * @returns {sap.ui.comp.smartfield.ControlFactoryBase} The control factory object
	 * @protected
	 * @since 1.48
	 */
	SmartField.prototype.getControlFactory = function() {
		return this._oFactory;
	};

	SmartField.prototype.getValue = function() {

		// as two-way-binding cannot be assumed to be a prerequisite,
		// check for a call-back and return the current value.
		var fnProp = this.getInnerValueFunction();

		if (fnProp) {
			return fnProp();
		}

		// as fall-back return the property value.
		return this.getProperty("value");
	};

	SmartField.prototype.getInnerValueFunction = function() {

		if (this._oValue && (typeof this._oValue[this.getMode()] === "function")) {
			return this._oValue[this.getMode()];
		}

		return null;
	};

	SmartField.prototype.getValueState = function() {
		var aChildren = this.getInnerControls(),
			iIndex = this._getMaxSeverity(aChildren);

		if (iIndex > -1) {
			return aChildren[iIndex].getValueState();
		}

		return ValueState.None;
	};

	/**
	 * Setter for property <code>valueState</code>. Default value is <code>None</code>.
	 *
	 * @param {sap.ui.core.ValueState} sValueState The new value for property <code>valueState</code>
	 * @returns {this} <code>this</code> to allow method chaining
	 * @since 1.30.0
	 * @public
	 */
	SmartField.prototype.setValueState = function(sValueState) {
		this.setProperty("valueState", sValueState, true);

		var aChildren = this.getInnerControls(),
			oChild,
			sMethod = "setSimpleClientError";

		if (aChildren && aChildren.length) {
			oChild = aChildren[0];

			if (aChildren.length > 1) {
				sMethod = "setComplexClientErrorFirstOperand";
			}
		}

		// forward the value state to the child control.
		// in unit of measure use cases and generally, if more than one control is hosted,
		// set a possible error on the first child.
		if (oChild && (typeof oChild.setValueState === "function")) {
			oChild.setValueState(sValueState);
			this[sMethod](sValueState === ValueState.Error);
		}

		return this;
	};

	SmartField.prototype.getValueStateText = function() {
		var aChildren = this.getInnerControls(),
			iIndex = this._getMaxSeverity(aChildren);

		if (iIndex > -1) {
			return aChildren[iIndex].getValueStateText();
		}

		return this.getProperty("valueStateText");
	};

	/**
	 * Setter for property <code>valueStateText</code>. Default value is empty/<code>undefined</code>.
	 *
	 * @param {string} sText The new value for property <code>valueStateText</code>
	 * @returns {this} <code>this</code> to allow method chaining
	 * @since 1.29
	 * @public
	 */
	SmartField.prototype.setValueStateText = function(sText) {
		this.setProperty("valueStateText", sText, true);

		var aChildren = this.getInnerControls(),
			oChild;

		if (aChildren && aChildren.length) {
			oChild = aChildren[0];
		}

		// forward the value state to the child control.
		// in unit of measure use cases and generally, if more than one control is hosted,
		// set a possible error on the first child.
		if (oChild && (typeof oChild.setValueStateText === "function")) {
			oChild.setValueStateText(sText);
		}

		return this;
	};

	/**
	 * Calculates the index of the child control with the most severe message.
	 *
	 * @param {array} aChildren The currently available child controls
	 * @returns {int} The index of the child control with the most severe message, can be <code>-1</code>
	 * @private
	 */
	SmartField.prototype._getMaxSeverity = function(aChildren) {
		var oState,
			oChild,
			i,
			len,
			iState = 0,
			iIndex = -1,
			mState = {
				"Error": 3,
				"Warning": 2,
				"Success": 1,
				"None": 0
			};

		len = aChildren.length;

		for (i = 0; i < len; i++) {
			oChild = aChildren[i];

			if (oChild.getValueState) {
				oState = oChild.getValueState();

				if (oState && mState[oState] > iState) {
					iState = mState[oState];
					iIndex = i;
				}
			}
		}

		return iIndex;
	};

	/**
	 * Returns the DOM element that gets the focus.
	 *
	 * @returns {Element} The DOM element that should get the focus, can be <code>null</code>
	 * @public
	 */
	SmartField.prototype.getFocusDomRef = function() {
		var aChildren = this.getInnerControls(),
			oChild,
			len = aChildren.length;

		if (len > 0) {
			oChild = aChildren[0];
		}

		if (oChild && oChild.getFocusDomRef) {
			return oChild.getFocusDomRef();
		}

		return Control.prototype.getFocusDomRef.apply(this, arguments);
	};

	/**
	 * Gets the ID of the control to which the label should point.
	 *
	 * @returns {string} The ID of the inner control if it exists, otherwise the ID of the <code>SmartField</code> control
	 * @public
	 */
	SmartField.prototype.getIdForLabel = function() {
		var aChildren = this.getInnerControls(),
			oChild,
			iLen = aChildren.length;

		if (iLen > 0) {
			oChild = aChildren[0];
		}

		if (oChild && (typeof oChild.getIdForLabel === "function")) {
			return oChild.getIdForLabel();
		}

		return this.getId();
	};

	SmartField.prototype.unbindProperty = function(sPropertyName, bSuppressReset) {
		Control.prototype.unbindProperty.apply(this, arguments);
		var aInnerControls = this.getAllInnerControls();

		aInnerControls.forEach(function(oInnerControl) {
			var sControlName = oInnerControl.getMetadata().getName();
			var vPropertiesNamesOfInnerControls = ODataControlFactory.getBoundPropertiesMapInfoForControl(sControlName, {
				propertyName: sPropertyName
			});

			if (Array.isArray(vPropertiesNamesOfInnerControls)) {
				vPropertiesNamesOfInnerControls.forEach(function(sPropertyNameOfInnerControl) {
					oInnerControl.unbindProperty(sPropertyNameOfInnerControl, bSuppressReset);
				});
			}
		});

		return this;
	};

	/**
	 * Returns the current SmartField's edit mode
	 *
	 * @returns {string} Returns "edit" or "display"
	 * @protected
	 */
	SmartField.prototype.getMode = function() {
		var bEditable = this.getEditable(),
			bEnabled = this.getEnabled(),
			bContextEditable = this.getContextEditable();

		// context editable in smart form is on parent's parent in UOM for unit.
		if (this.data("configdata") &&
			this.data("configdata").configdata &&
			this.data("configdata").configdata.isUOM &&
			this.data("configdata").configdata.isInnerControl &&
			this.data("configdata").configdata.getContextEditable) {
			bContextEditable = this.data("configdata").configdata.getContextEditable();
		}

		return bEditable && bEnabled && bContextEditable ? "edit" : "display";
	};

	SmartField.prototype.isInEditMode = function() {
		return this.getMode() === "edit";
	};

	/**
	 * Toggles the current control, depending on <code>displayMode</code> and the binding of the <code>value</code>
	 * property of the current control. If necessary a control is created.
	 *
	 * @private
	 */
	SmartField.prototype._toggleInnerControlIfRequired = function(oSettings) {
		var sMode = oSettings.mode;

		if (this._bSuppressToggleControl || (!this._oFactory || this._oFactory.bPending)) {
			return;
		}

		if (sMode === "edit") {
			this._createControlIfRequired(oSettings);
		} else {
			var sDescriptionValue,
				oValue = this.getProperty("value"),
				sLocalTextPropertyName = this._oFactory.getLocalTextPropertyName(),
				oBindingContext = this.getBindingContext(),
				bCreate = true;

			// optimization for table use cases only, if it is not a table, no configuration data set
			var oConfig = this.data("configdata");

			if (oBindingContext && sLocalTextPropertyName) {
				sDescriptionValue = oBindingContext.getProperty(sLocalTextPropertyName);
			}

			if (oConfig && oConfig.configdata && !oConfig.configdata.isUOM) {

				if (oValue === null ||
					oValue === "" && !sDescriptionValue) {
					bCreate = false;
				}
			}

			// in display mode, create control only if value is not empty
			if (bCreate) {
				this._createControlIfRequired(oSettings);
			} else {

				// if value is empty, the content aggregation has to be set to null
				this.setContent(null);

				// set the current mode, otherwise toggling the controls gets out-of-sync
				this._oControl.current = "display";

				// Cancel all lifecycle promises
				this._rejectLifecyclePromises("SmartTable context optimisation");
			}
		}
	};

	/**
	 * Lifecycle hook which should be used to propagate external settings to internally created controls.
	 * @private
	 */
	SmartField.prototype._propagateToInnerControls = function () {
		this._propagateFieldGroupIDs(this.getProperty("_internalFieldGroupIds"));

		// Generic propagation
		this._setOnInnerControl();

		// UoM propagation
		this._propagateToUoM();
	};

	SmartField.prototype._propagateToUoM = function () {
		var oUoMNestedSmartField = this._getEmbeddedSmartField(),
			bUomVisible = this.getUomVisible(),
			oInnerInput;

		if (oUoMNestedSmartField) {
			if (!this.isPropertyInitial("uomEditable")) {
				oUoMNestedSmartField.setEditable(this.getUomEditable());
			}

			if (!this.isPropertyInitial("uomEnabled")) {
				oUoMNestedSmartField.setEnabled(this.getUomEnabled());
			}

			// UoM Visible
			if (!this.isPropertyInitial("uomVisible")) {
				oUoMNestedSmartField.setVisible(bUomVisible);
				oInnerInput = oUoMNestedSmartField.getFirstInnerControl();
				if (oInnerInput) {
					oInnerInput.toggleStyleClass("smartFieldPaddingRight", bUomVisible);
				}
			}
		}
	};

	/**
	 * Propagates the fieldGroupIDs from the SmartField property to the internal input controls. In case of currency
	 * or UoM fields we currently propagate only to the measure field.
	 * Note: fieldGroupIDs set on SmartField level take precedence over internally calculated
	 * @param {string[]} aFieldGroupIDs comma delimited list of FieldGroupIds
	 * @private
	 */
	SmartField.prototype._propagateFieldGroupIDs = function (aFieldGroupIDs) {
		var oInnerControl;

		if (Array.isArray(aFieldGroupIDs) && aFieldGroupIDs.length) {
			oInnerControl = this.getFirstInnerControl(); // Currently we propagate only to the first control
			// We only propagate FieldGroupIDs if they are specifically set to parent control
			if (oInnerControl) {
				oInnerControl.setFieldGroupIds(aFieldGroupIDs);
			}
		}
	};

	SmartField.prototype._onInnerControlToggled = function(oSettings) {
		var	oUoMNestedSmartField,
			oContent = this.getContent(),
			oControlForEditMode,
			bHasInnerControlForEditMode = false,
			bUoMHasSettingUoMEditable = false,
			oValueListSettings = {
				mode: oSettings.mode,
				forceTextArrangementFetch: oSettings.forceTextArrangementFetch
			};

		if (oSettings && oSettings.fetchIDAndDescription &&
			this.getModel() &&
			this.getBindingContext() &&
			this.getBinding("value")) {
			this._oFactory.fetchIDAndDescriptionCollectionIfRequired(oValueListSettings);
		}

		// By now we know the state is initially ready
		this._initialStateApplied.resolve();

		// Lifecycle hook
		this._propagateToInnerControls();

		this._processEvents({
			editableChanged: oSettings.editableChanged,
			editable: oSettings.editable,
			contextEditableChanged: oSettings.contextEditableChanged,
			contextEditable: oSettings.contextEditable,
			visibleChanged: oSettings.visibleChanged,
			visible: oSettings.visible
		});

		if (oSettings.mode === "display" && this.isFormContextType()) {
			this._setEmptyIndicator(this.getFirstInnerControl());
		}

		if (oSettings.mode === "edit" && oContent) {
			oContent = this.getContent();
			oControlForEditMode = this._oControl.edit;
			bHasInnerControlForEditMode =  oControlForEditMode && oContent && oControlForEditMode.getId() === oContent.getId();
			if (bHasInnerControlForEditMode) {
				this._checkFieldGroups({mode: oSettings.mode});
			}
		}

		oUoMNestedSmartField = this._getEmbeddedSmartField();
		// for currency fields propagate the clientSideMandatoryCheck to the curreny code field
		if (oUoMNestedSmartField &&
			oUoMNestedSmartField.data("configdata") &&
			oUoMNestedSmartField.data("configdata").configdata.isUOM) {
			oUoMNestedSmartField.setClientSideMandatoryCheck(oSettings.clientSideMandatoryCheck);

			var oMetaData = this._oFactory.getMetaData && this._oFactory.getMetaData();
			if (oUoMNestedSmartField.getBindingInfo("editable") // if editable set
			|| (oMetaData && oMetaData.annotations && oMetaData.annotations.uom.property && // if sap:updatable set
				oMetaData.annotations.uom.property.property && oMetaData.annotations.uom.property.property['sap:updatable'])) {
				bUoMHasSettingUoMEditable = true;
			}
			// for currency fields propagate the sap:updatable to the curreny code field
			if (oSettings.isFormContextType &&
				oSettings.contextEditable &&
				oSettings.contextEditable !== oSettings.editable &&
				!bUoMHasSettingUoMEditable &&
				oUoMNestedSmartField.getEditable() !== oSettings.editable) {
				oUoMNestedSmartField.setEditable(oSettings.editable);
			}
		}
	};

	SmartField.prototype._processEvents = function(oSettings) {
		if (oSettings.editableChanged){
			this.fireEditableChanged({
				editable: oSettings.editable
			});
		}

		if (oSettings.contextEditableChanged){
			this.fireContextEditableChanged({
				editable: oSettings.contextEditable
			});
		}

		if (oSettings.visibleChanged){
			this.fireVisibleChanged({
				visible: oSettings.visible
			});
		}
	};

	SmartField.prototype._forceInitialise = function() {
		if (this._isBoundToDefaultModel()){
			return this._processStateHandler();
		} else if (!this.bIsListeningForDefaultModel){
			this.bIsListeningForDefaultModel = true;
			return new Promise(function(fnResolve, fnReject){
				this.attachEvent("modelContextChange", {resolve: fnResolve, reject: fnReject}, this._forceInitialiseHandler, this);
			}.bind(this));
		}
	};

	SmartField.prototype._forceInitialiseHandler = function(oEventObject, oPromiseObject) {
		if (this._isBoundToDefaultModel()) {
			this.detachEvent("modelContextChange", this._forceInitialiseHandler, this);
			this._processStateHandler().then(function(){
				oPromiseObject.resolve();
			}).catch(function(oError){
				oPromiseObject.reject(oError);
			});
		}
	};

	SmartField.prototype._processStateHandler = function() {
		var sMode = this.getMode();

		return this._processState().then(function(){
			var oEmbeddedSmartFiel = this._getEmbeddedSmartFieldByMode(sMode);

			return oEmbeddedSmartFiel && oEmbeddedSmartFiel._processState();
		}.bind(this));
	};

	/**
	 * @private,
	 * @ui5-restricted sap.ui.comp.smartmultiinput.SmartMultiInput
	 */
	SmartField.prototype._updateInnerControlsIfRequired = function() {
		var oUomSmartField,
			oUomControlSettings,
			oControlSettings = {
				mode: this.getMode(),
				contextEditable: this.getContextEditable(),
				editable: this.getEditable(),
				enabled: this.getEnabled(),
				visible: this.getVisible()
			};

		this._updateInnerControlsIfRequiredHandler(oControlSettings);

		oUomSmartField = this._getEmbeddedSmartField();

		if (oUomSmartField && oUomSmartField.isA("sap.ui.comp.smartfield.SmartField")) {
			oUomControlSettings = {
				mode: oUomSmartField.getMode(),
				contextEditable: oUomSmartField.getContextEditable(),
				editable: oUomSmartField.getEditable(),
				enabled: oUomSmartField.getEnabled(),
				visible: oUomSmartField.getVisible()
			};

			oUomSmartField._updateInnerControlsIfRequiredHandler(oUomControlSettings);
		}
	};

	SmartField.prototype._updateInnerControlsIfRequiredHandler = function(oControlSettings) {
		this._init();

		if (this._oFactory !== null) {
			this._oFactory._init(this._oFactory._oMeta);
		}

		this._toggleInnerControlIfRequired(oControlSettings);
	};

	SmartField.prototype._getInnerControlPropertyBinding = function(sMode) {
		var oInnerControl,
			sControlMetadataName,
			mPropertiesMap,
			sBoundPropertyNameOfInnerControl,
			oInnerControlPropertyBinding,
			oCurrentContent = this._oControl[sMode],
			aInnerControls = oCurrentContent && this._getInnerControls(oCurrentContent);

		if (Array.isArray(aInnerControls) && aInnerControls.length > 0) {
			oInnerControl = aInnerControls[0];
			sControlMetadataName = oInnerControl.getMetadata().getName();
			mPropertiesMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(sControlMetadataName, {
				propertyName: "value"
			});
		}

		if (Array.isArray(mPropertiesMap) && mPropertiesMap.length > 0) {
			sBoundPropertyNameOfInnerControl = mPropertiesMap[0];
			oInnerControlPropertyBinding = oInnerControl.getBinding(sBoundPropertyNameOfInnerControl);
		}

		return oInnerControlPropertyBinding;
	};

	SmartField.prototype.isTextInEditModeSourceNotNone = function(sMode) {
		return (this._getComputedTextInEditModeSource(false, sMode) !== TextInEditModeSource.None);
	};

	/**
	 * Returns computed textInEditModeSource by taking into account the control property and default configuration
	 * propagated via custom data.
	 * @param {boolean} bExact returns exact setting
	 * @param {string} [sMode] The value for the mode that we want to explicitly check
	 * @returns {string} computed textInEditModerSource
	 * @ui5-restricted sap.ui.comp.smartmultiinput.SmartMultiInput
	 * @private
	 */
	SmartField.prototype._getComputedTextInEditModeSource = function (bExact, sMode) {
		var sCurrentMode = sMode || this.getMode(),
			sTextInEditModeSource = this.getTextInEditModeSource(),
			sDefaultTextInEditModeSource = this.data("defaultTextInEditModeSource");

		if (
			sDefaultTextInEditModeSource &&
			this.isPropertyInitial("textInEditModeSource") &&
			sCurrentMode === "edit"
		) {
			sTextInEditModeSource = sDefaultTextInEditModeSource;
		}

		// ValueListWarning only differs in mixed validation mode, so it's
		// used only where needed and in default it is replaced with ValueListNoValidation.
		if (
			!bExact &&
			sTextInEditModeSource === TextInEditModeSource.ValueListWarning
		) {
			sTextInEditModeSource = TextInEditModeSource.ValueListNoValidation;
		}

		return sTextInEditModeSource;
	};

	/**
	 * Is SmartField textInEditModeSource in ValueListWarning mode
	 * @returns {boolean} ValueListWarning
	 * @private
	 */
	SmartField.prototype._isValueListWarning = function () {
		return this._getComputedTextInEditModeSource(true) === TextInEditModeSource.ValueListWarning;
	};

	/**
	 * Is SmartField in value list with validation mode
	 * @returns {boolean}
	 * @private
	 */
	SmartField.prototype._isValueListValidationMode = function () {
		var sTAR = this._getComputedTextInEditModeSource(true);

		if (
			sTAR === TextInEditModeSource.ValueList ||
			sTAR === TextInEditModeSource.ValueListWarning
		) {
			return true;
		}

		return false;
	};

	/**
	 * Creates the actual control depending on the current edit mode and sets it to the SmartField's content
	 *
	 * @param {object} oSettings The current mode, either "edit" or "display"
	 * @private
	 */
	SmartField.prototype._createControlIfRequired = function(oSettings) {

		if (!this._oFactory) {
			return;
		}

		var sMode = oSettings.mode,
			vControlForCurrentMode = this._oControl[sMode];

		// suppress toggling of the inner control when the mode remains unchanged,
		// except when the inner control for the current mode has not being created
		if ((sMode !== this._oControl.current) || !vControlForCurrentMode) {

			if (!vControlForCurrentMode) {
				var oControl = this._oFactory.createControl(oSettings);

				if (oControl) {
					this._oControl[sMode] = oControl.control;
					this._placeCallBacks(oControl, sMode);
				}
			}

			this._oControl.current = sMode;
			this.setContent(this._oControl[sMode]);
			// Currently this method updates only CSS properties
			this._oFactory.updateControl(oSettings);
			this._setOnInnerControl();
			this._fireInnerControlsCreated();
			this.fireModeToggled({
				mode: oSettings.mode
			});
		} else if (!this.getContent()) {
			this._oControl.current = sMode;
			this.setContent(this._oControl[sMode]);
		}
	};

	/**
	 * We wait till the embeded SmartField if any, creates its innercontrols too. Then we fire the event.
	 * @private
	 */
	SmartField.prototype._fireInnerControlsCreated = function() {
		var oEmbeddedSmartField = this._getEmbeddedSmartField();
		if (oEmbeddedSmartField && oEmbeddedSmartField.isA("sap.ui.comp.smartfield.SmartField")) {
			oEmbeddedSmartField.attachInnerControlsCreated(function(){
				this.fireInnerControlsCreated(this.getInnerControls());
			}.bind(this));
		} else {
			this.fireInnerControlsCreated(this.getInnerControls());
		}
	};

	/**
	 * Sets the available call-backs after successful control creation.
	 *
	 * @param {sap.ui.core.Control} oControl The given control
	 * @param {string} sMode The current mode, either "edit" or "display"
	 * @private
	 */
	SmartField.prototype._placeCallBacks = function(oControl, sMode) {

		// set the value call-back.
		if (oControl.params && oControl.params.getValue) {
			this._oValue[sMode] = oControl.params.getValue;
		}

		// set the unit-of-measure-get call-back.
		if (oControl.params && oControl.params.uom) {
			this._oValue.uom = oControl.params.uom;
		}

		// set the unit-of-measure-set call-back.
		if (oControl.params && oControl.params.uomset) {
			this._oValue.uomset = oControl.params.uomset;
		}
	};

	/**
	 * Initializes the control, if it has not already been initialized.
	 *
	 * @param {string} [sModelName] The name of the model currently used
	 * @private
	 */
	SmartField.prototype._init = function(sModelName) {
		var oModel,
			oConfig,
			sBindingPath;

		if (!this._oFactory) {
			oConfig = this.data("configdata");

			if (!oConfig) {
				oModel = this.getModel(sModelName);
			}

			sBindingPath = this.getBindingPath("value");

			if (sModelName === undefined && sBindingPath && (oConfig || oModel)) {
				this._oFactory = this._createFactory(sModelName, oModel, sBindingPath, oConfig);
			}
		}
	};

	/**
	 * @inheritDoc
	 */
	SmartField.prototype.clone = function () {
		var oClone = Control.prototype.clone.apply(this, arguments);

		oClone.attachModelContextChange(function () {
			this.invalidate();
		}.bind(oClone));

		// Create promise early
		LifecycleUtil._createICRenderedDeferred.call(oClone);

		return oClone;
	};

	/**
	 * Destroys the control factory and the existing inner controls.
	 *
	 * @private
	 */
	SmartField.prototype._destroyFactory = function() {
		this._bSuppressToggleControl = true;
		this._bSideEffects = false;
		this._bIsInitialized = false;

		if (this._oFactory) {
			this._oFactory.destroy();
		}

		this._oFactory = null;
		this._bSuppressToggleControl = false;
		this._destroyControls();
	};

	SmartField.prototype._destroyControls = function() {

		if (this._oControl) {

			if (this._oControl.display) {
				this._oControl.display.destroy();
			}

			if (this._oControl.edit) {
				this._oControl.edit.destroy();
			}

			this._oControl.display = null;
			this._oControl.edit = null;
			this._oControl.current = null;
		}

		this._oValue = {
			display: null,
			edit: null,
			uom: null,
			uomset: null
		};

		this.destroyAggregation("_content");
	};

	/**
	 * Creates the control factory and returns it. If the variable <code>oModel</code> is <code>null</code>
	 * or <code>undefined</code>, <code>null</code> is returned.
	 *
	 * @param {string} sModelName The name of the model currently used
	 * @param {sap.ui.model.Model} oModel The model currently used
	 * @param {string} sBindingPath The binding path for the <code>value</code> property
	 * @param {object} oConfig Optional control configuration
	 * @returns {sap.ui.comp.smartfield.ControlFactoryBase} the new control factory instance
	 * @private
	 */
	SmartField.prototype._createFactory = function(sModelName, oModel, sBindingPath, oConfig) {

		if (oModel && oModel instanceof JSONModel) {
			return new JSONControlFactory(oModel, this, {
				model: sModelName,
				path: sBindingPath
			});
		}

		var sEntitySet;

		if (!oConfig) {
			sEntitySet = this._getEntitySet(sModelName);
		}

		if (sEntitySet || oConfig) {
			var oParam;

			if (oConfig) {
				oParam = oConfig.configdata;
				this._enhanceConfigData(oParam);
			} else {
				oParam = {
					entitySet: sEntitySet,
					model: sModelName,
					path: sBindingPath
				};
			}

			return new ODataControlFactory(oModel, this, oParam);
		}

		return null;
	};

	/**
	 * Used to move configuration coming from custom data objects to configdata.
	 * @private
	 */
	SmartField.prototype._enhanceConfigData = function (oConfigData) {
		var bIgnoreInsertRestrictions = this.data("ignoreInsertRestrictions");
		if (typeof bIgnoreInsertRestrictions === "boolean") {
			oConfigData.ignoreInsertRestrictions = bIgnoreInsertRestrictions;
		}
	};

	/**
	 * Calculates the <code>entitySet</code> that is interpreted by this control.
	 * The calculation uses either the <code>bindingContext</code> of this control or
	 * alternatively the property <code>entitySet</code>.
	 *
	 * @param {string} sModelName The name of the model currently used
	 * @returns {string} The <code>entitySet</code> that is interpreted by this control
	 * @private
	 */
	SmartField.prototype._getEntitySet = function(sModelName, bSuppressEventFiring) {
		var sEntitySet = this.getEntitySet(),
			bIsEntitySetControlPropertySet = sEntitySet !== "";

		if (bIsEntitySetControlPropertySet && !sModelName) {
			return sEntitySet;
		}

		var oBindingContext = this.getBindingContext(sModelName);

		if (oBindingContext) {
			var sBindingContextPath = oBindingContext.getPath();

			// check for an invalid binding context path
			if ((sBindingContextPath === "") ||
				(sBindingContextPath === undefined) ||
				(sBindingContextPath === "/undefined")
			) {
				return "";
			}

			// parse the binding context path string to extract the entity set
			sEntitySet = this._oUtil.correctPath(sBindingContextPath);

			if (!bSuppressEventFiring) {
				this.fireEntitySetFound({
					entitySet: sEntitySet
				});
			}

			return sEntitySet;
		}

		return "";
	};

	/**
	 * Calculates the <code>entityType</code> that is interpreted by this control.
	 * The calculation uses either the <code>bindingContext</code> of this control or
	 * alternatively the property <code>entityType</code>.
	 *
	 * @param {string} sModelName The name of the model currently used
	 * @returns {string} The <code>entitySet</code> that is interpreted by this control
	 * @private
	 */
	SmartField.prototype._getODataEntityType = function(sModelName) {
		var sEntitySet,
			sEntityType,
			oFunctionImport,
			oEntitySet,
			oModel = this.getModel(),
			oMetaModel = oModel && oModel.getMetaModel();

		sEntitySet = this._getEntitySet(sModelName);

		if (sEntitySet === ""){
			return;
		}

		oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
		if (oEntitySet !== null && oEntitySet.entityType) {
			sEntityType = oEntitySet.entityType;
		}

		if (sEntityType === undefined) {
			oFunctionImport = oMetaModel.getODataFunctionImport(sEntitySet);
			if (oFunctionImport !== null && oFunctionImport.returnType){
				sEntityType = oFunctionImport.returnType;
			}
		}

		return sEntityType;
	};

	/**
	 * Returns the EDM data type of the OData property to which the value property of the control is bound.
	 * If no model or no OData property is available <code>null</code> is returned.
	 *
	 * @returns {string} The data type to which the value property is bound.
	 * @public
	 */
	SmartField.prototype.getDataType = function() {
		var oProp;

		if (this._oFactory) {

			// only ODataControlFactory has the method getDataType.
			if (this._oFactory.getDataProperty) {
				oProp = this._oFactory.getDataProperty();

				if (oProp) {
					return oProp.property.type;
				}
			}

			return this.getJsonType();
		}

		return null;
	};

	/**
	 * Returns the OData property to which the <code>value</code> property of the control is bound.
	 *
	 * @returns {Object<string>|null} The OData property.
	 * @public
	 */
	SmartField.prototype.getDataProperty = function() {
		var sPath,
			sEntityType,
			oEntityType,
			property,
			oConfigdata,
			oModel = this.getModel(),
			oMetaModel = oModel && oModel.getMetaModel();

		if (this._oFactory) {

			// only ODataControlFactory has the method getDataProperty.
			if (this._oFactory.getDataProperty) {
				return this._oFactory.getDataProperty();
			}
		} else {
			oConfigdata = this.data("configdata") && this.data("configdata").configdata;

			if (oConfigdata && oConfigdata.property) {
				return oConfigdata.property;
			}

			if (!oMetaModel || !oMetaModel.oModel) {
				return null;
			}

			sEntityType = this._getODataEntityType();

			if (sEntityType === undefined) {
				return null;
			}

			sPath = this.getBindingPath("value");

			if (sPath === undefined) {
				return null;
			}

			oEntityType = oMetaModel.getODataEntityType(sEntityType);
			property = oMetaModel.getODataProperty(oEntityType, sPath);

			if (property === null) {
				return null;
			}

			return {property: property};
		}
	};

	/**
	 * If the OData property to which the control's value property is bound semantically represents
	 * a unit of measure, the value of the current unit of measure is returned.
	 * Otherwise <code>null</code> is returned.
	 *
	 * @returns {any} The current unit of measure is returned, which can be <code>null</code
	 * @public
	 */
	SmartField.prototype.getUnitOfMeasure = function() {

		if (this._oValue.uom) {
			return this._oValue.uom();
		}

		return null;
	};

	/**
	 * If the OData property the control's value property is bound to semantically represents a
	 * unit of measure, the value of the current unit of measure can be changed.
	 *
	 * @param {string} sUnit The new unit of measure to be set.
	 * @public
	 */
	SmartField.prototype.setUnitOfMeasure = function(sUnit) {
		if (sUnit && this._oValue.uomset) {
			this._oValue.uomset(sUnit);
		}
	};

	/**
	 * Marks the <code>SmartField</code> control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setSimpleClientError = function(bError) {
		this._oError.bFirst = bError;
	};

	/**
	 * Marks the <code>SmartField</code> control and the first inner control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setComplexClientErrorFirstOperand = function(bError) {
		this._oError.bComplex = true;
		this._oError.bFirst = bError;
	};

	/**
	 * Marks the <code>SmartField</code> control and the second inner control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setComplexClientErrorSecondOperand = function(bError) {
		this._oError.bComplex = true;
		this._oError.bSecond = bError;
	};

	/**
	 * Marks the hosting <code>SmartField</code> control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setComplexClientErrorSecondOperandNested = function(bError) {
		var oParent = this.getParent().getParent();
		oParent.setComplexClientErrorSecondOperand(bError);
	};

	/**
	 * Returns whether a client error has been detected.
	 *
	 * @returns {boolean} <code>true</code>, if a client error has been detected, <code>false</code> otherwise
	 * @private
	 */
	SmartField.prototype._hasClientError = function() {

		if (this._oError.bComplex) {
			return this._oError.bFirst || this._oError.bSecond;
		}

		return this._oError.bFirst;
	};

	/**
	 * Checks whether a client error has been detected in edit mode. Additionally the error message is shown,
	 * if this is not the case already.
	 *
	 * This method is typically used to check whether the value of every inner text
	 * input field in edit mode is subject to data type constraints and whether the constraints
	 * are fulfilled.
	 *
	 * A data type constraint for a bound Entity Data Model (EDM) property can be violated
	 * in many ways, for example:
	 *
	 * <ul>
	 * <li>The <code>Nullable</code> constraint for an EDM property typed as <code>Edm.String</code>
	 * is violated.</li>
	 * <li>A user input is invalid for the bound EDM property typed as <code>Edm.DateTime</code>.</li>
	 * </ul>
	 *
	 * If this happens, the following applies:
	 *
	 * <ul>
	 * <li>A validation error state is set on the text input field.</li>
	 * <li>A validation error message is displayed for the text input field.</li>
	 * <li>The validation error message (possibly generated by a user input) is added to a
	 * <code>sap.ui.core.message.MessageManager</code> object instance if, for example, a view object
	 * instance is registered to it.</li>
	 * <li>The inner private text input field fires a {@link sap.ui.base.EventProvider#event:validationError},
	 * or {@link sap.ui.base.EventProvider#event:parseError} event.</li>
	 * </ul>
	 *
	 * @param {object} [oSettings] Settings
	 * @param {boolean} [oSettings.handleSuccess = false] Indicates whether client error checks are performed for the current value regardless of the current error state of the control. If the <code>handleSuccess</code> setting is set to <code>true</code>, the text input field fires a {@link sap.ui.base.EventProvider#event:validationSuccess} if its validation passes.
	 * @returns {boolean} <code>true</code>, if a client error has been detected, <code>false</code> otherwise
	 * @deprecated As of version 1.64, replaced by {@link sap.ui.comp.smartfield.SmartField#checkValuesValidity}
	 * @public
	 */
	SmartField.prototype.checkClientError = function (oSettings) {
		oSettings = Object.assign({ handleSuccess: false }, oSettings);
		var ERROR_MESSAGE = "The sap.ui.comp.smartfield.SmartField#checkClientError method is deprecated. " +
			"Please use the sap.ui.comp.smartfield.SmartField#checkValuesValidity method instead.";

		Log.warning(ERROR_MESSAGE, this.getMetadata().getName());

		if (this.getMode() === "display") {
			return false;
		}

		if (this._hasClientError() && !oSettings.handleSuccess) {
			return true;
		}

		this.getInnerControls().forEach(function(oInnerControl) {
			this._checkErrors(oInnerControl, { checkClientErrorsOnly: true, handleSuccess: oSettings.handleSuccess });
		}.bind(this));

		// check for a possibly detected error when calling the ._checkErrors() method
		return this._hasClientError();
	};

	/**
	 * @typedef {Object} sap.ui.comp.smartfield.checkValuesValidityInfo
	 * @property {string} property - The Edm name of the property the control is bound to.
	 * @property {sap.ui.comp.smartfield.SmartField} instance - The instance of the control on which the
	 * checkValuesValidity method was called
	 * @public
	 */

	/**
	 * Checks whether the value of every inner text input field in edit mode is valid.
	 *
	 * This method is typically used to check whether the value of every inner text
	 * input field in edit mode is subject to data type constraints and whether the constraints
	 * are fulfilled.
	 *
	 * <b>Note:</b> In some scenarios, invoking this method may also trigger a back-end request
	 * to check whether the value is valid.
	 *
	 * A data type constraint for a bound Entity Data Model (EDM) property can be violated
	 * in many ways, for example:
	 *
	 * <ul>
	 * <li>The <code>Nullable</code> constraint for an EDM property typed as <code>Edm.String</code>
	 * is violated.</li>
	 * <li>A user input is invalid for the bound EDM property typed as <code>Edm.DateTime</code>.</li>
	 * </ul>
	 *
	 * If this happens, the following applies:
	 *
	 * <ul>
	 * <li>A validation error state is set on the text input field.</li>
	 * <li>A validation error message is displayed for the text input field.</li>
	 * <li>The validation error message (possibly generated by a user input) is added to a
	 * <code>sap.ui.core.message.MessageManager</code> object instance if, for example, a view object
	 * instance is registered to it.</li>
	 * <li>The inner private text input field fires a {@link sap.ui.base.EventProvider#event:validationError},
	 * or {@link sap.ui.base.EventProvider#event:parseError} event. Note that the events are fired
	 * synchronously if the value is validated on client side or asynchronously if, for example, the value
	 * is validated on back-end side.</li>
	 * </ul>
	 *
	 * The inner private text input field fires a {@link sap.ui.base.EventProvider#event:validationSuccess} if its validation passes.
	 *
	 * <b>Note:</b> In display mode, this method always returns a fulfilled <code>Promise</code> object.
	 *
	 * <b>Note:</b> In two-way data binding scenarios, it is usually not necessary to invoke this method
	 * explicitly to validate user input, as the data type validation is done automatically when the value
	 * in the input field has changed and the focus leaves the text input field or the enter key is pressed.
	 * However, in two-way data binding scenarios, this method may be used to check whether a value is
	 * valid before submitting it to the back-end system.
	 *
	 * @example <caption>Example usage of <code>sap.ui.comp.smartfield.SmartField#checkValuesValidity</code> method</caption>
	 *	var oPromise = oSmartField.checkValuesValidity();
	 *
	 *	oPromise.then(function() {
	 *		// the value is valid and pending model changes can be submitted to the back-end system
	 *	}).catch(function() {
	 *		// the value is invalid
	 *	});
	 * @param {object} [oSettings] Settings
	 * @param {boolean} [oSettings.handleSuccess = true] Indicates whether client error checks are performed for the current value regardless of the current error state of the control. If the <code>handleSuccess</code> setting is set to <code>false</code>, the text input field will not fire a {@link sap.ui.base.EventProvider#event:validationSuccess} if its validation passes.
	 * @returns {Promise<sap.ui.comp.smartfield.checkValuesValidityInfo>} A fulfilled <code>Promise</code> object or a <code>Promise</code> object to be
	 * fulfilled if the value of every text input field is valid, otherwise a rejected <code>Promise</code>
	 * object or a <code>Promise</code> object to be rejected
	 * @public
	 * @since 1.64
	 */
	SmartField.prototype.checkValuesValidity = function(oSettings) {
		var sProperty,
			oFactory = this.getControlFactory(),
			oEdmProperty;

		if (oFactory && oFactory.getEdmProperty) {
			oEdmProperty = oFactory.getEdmProperty();

			// BCP: 2180234442 for fields added and removed via UI changes that do not exist anymore in the EntityType
			if (!oEdmProperty) {
				return Promise.resolve();
			}

			sProperty = oEdmProperty.name;
		}

		if (this.getMode() === "display") {
			return Promise.resolve({
				property: sProperty,
				instance: this
			});
		}

		oSettings = oSettings || {};

		var oDefaultSettings = {
			handleSuccess: true,
			innerControls: this.getInnerControls(),
			rawValues: []
		};
		var oUOMControl = this._getEmbeddedSmartField();

		oSettings = Object.assign(oDefaultSettings, oSettings);

		if (
			oSettings.rawValues.length === 0 && // No rawValues provided
			oUOMControl && // There is embedded control
			oUOMControl.data("configdata") &&
			oUOMControl.data("configdata").configdata.isUOM // We are in the UOM/Currency scenario
		) {
			// We need to update the rawValues as in this scenario method is most likely called from application code
			// and when this is the case we don't have a settings object with rawValues as the object is private.
			this._updateCurrencyRawValues(oSettings);
		}

		return new Promise(function(fnResolve, fnReject) {
			var oCheckErrorsSettings = {
				rawValues: oSettings.rawValues,
				handleSuccess: oSettings.handleSuccess,
				bCheckValuesValidity: true
			};

			var aPromises = oSettings.innerControls.map(function(oInnerControl) {
				return this._checkErrors(oInnerControl, oCheckErrorsSettings);
			}, this);

			Promise.all(aPromises).then(function() {
				fnResolve({
					property: sProperty,
					instance: this
				});
			}.bind(this)).catch(function(oReason) {
				fnReject({
					property: sProperty,
					instance: this
				});
			}.bind(this));
		}.bind(this));
	};

	/**
	 * Checks the validity of the values for the given control.
	 *
	 * @param {Object} [oSettings] Additional settings
	 * @returns {boolean} Indicates validity of the values
	 * @protected
	 * @since 1.90
	 */
	SmartField.prototype.checkUnitValidity = function(oSettings /** for internal use only */) {
		var bValidValue = false;
		if (this.getMode() === "display") {
			return true;
		}

		oSettings = oSettings || {};

		var oDefaultSettings = {
			handleSuccess: true,
			innerControls: this.getInnerControls(),
			rawValues: []
		};
		var oUOMControl = this._getEmbeddedSmartField();

		oSettings = Object.assign(oDefaultSettings, oSettings);

		if (oSettings.rawValues.length === 0 && // No rawValues provided
			oUOMControl && // There is embedded control
			oUOMControl.data("configdata") &&
			oUOMControl.data("configdata").configdata.isUOM /* We are in the UOM/Currency scenario*/) {
			// We need to update the rawValues as in this scenario method is most likely called from application code
			// and when this is the case we don't have a settings object with rawValues as the object is private.
			this._updateCurrencyRawValues(oSettings);
		}

		if (oDefaultSettings.innerControls.length !== 2 && (oDefaultSettings.innerControls.length !== 1 && !this._oFactory._checkSuppressUnit())) {
			throw new ValidateException();
		}
		oUOMControl = oUOMControl ? oUOMControl : oDefaultSettings.innerControls[1];

		var oMeasureControl = oDefaultSettings.innerControls[0],
			oUnitControl = oUOMControl ? oUOMControl : this._getUomControl(),
			oMeasureBinding,
			oUnitBinding,
			sMeasureParam,
			sUnitParam;

		oSettings = Object.assign({ checkClientErrorsOnly: false, handleSuccess: true }, oSettings);
		// check binding
		if (oMeasureControl) {
			var aMeasureValuesPropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(oMeasureControl.getMetadata().getName(), {
				propertyName: "value"
			});
			sMeasureParam = aMeasureValuesPropertyMap && aMeasureValuesPropertyMap[0];
		}

		if (oUnitControl) {
			var aUnitValuesPropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(oUnitControl.getMetadata().getName(), {
				propertyName: "value"
			});
			sUnitParam = aUnitValuesPropertyMap && aUnitValuesPropertyMap[0];
		}

		if (sMeasureParam) {
			oMeasureBinding = oMeasureControl.getBinding(sMeasureParam);
		}

		if (sUnitParam) {
			oUnitBinding = oUnitControl.getBinding(sUnitParam);
		}

		if (!oMeasureBinding || (!oUnitBinding && !this._oFactory._checkSuppressUnit())) {
			return true;
		}

		try {
			var sMeasureMutator = "get" + capitalize(sMeasureParam),
				oMeasureType = oMeasureBinding.getType(),
				sMeasureInternalType = oMeasureBinding.sInternalType,
				sMeasureValue = oMeasureControl[sMeasureMutator]();

			if (sMeasureInternalType && oMeasureType) {
				var vRawValues = oSettings.rawValues || oMeasureBinding.getValue(),
					vMeasureParseValueReturn = oMeasureType.parseValue(sMeasureValue, oMeasureBinding.sInternalType, vRawValues);

				if (vMeasureParseValueReturn) {
					oMeasureType.validateValue(vMeasureParseValueReturn);
				}

				if (oMeasureBinding.hasValidation()) {
					var bAllowPreventDefault = false,
						bEnableEventBubbling = true,
						mMeasureSuccessParameters = {
							element: oMeasureControl,
							property: sMeasureParam,
							type: oMeasureBinding.getType(),
							newValue: sMeasureValue,
							oldValue: oMeasureBinding.getValue(),
							mParameters: {
								suppressChangeModelValue: true
							}
						};
						oMeasureControl.fireValidationSuccess(mMeasureSuccessParameters, bAllowPreventDefault, bEnableEventBubbling);
						bValidValue = true;
				}
			}
		} catch (oException) {
			var mMeasureParameters = {
				element: oMeasureControl,
				property: sMeasureParam,
				type: oMeasureBinding.getType(),
				newValue: sMeasureValue,
				oldValue: oMeasureBinding.getValue(),
				exception: oException,
				message: oException.message
			};

			if (oException instanceof UoMValidateException) {
				mMeasureParameters.targetControl = oUOMControl && oUOMControl.getFirstInnerControl();
			}

			if (oException instanceof ParseException) {
				oMeasureControl.fireParseError(mMeasureParameters);
			} else if (oException instanceof ValidateException) {
				oMeasureControl.fireValidationError(mMeasureParameters);
			} else {
				if (oException.toString() === "TypeError: Cannot read property 'decimals' of undefined") {
					oException.validationUnitError = true;
				}
				throw oException;
			}
		}

		try {
			if (!sUnitParam || !oUnitControl.getVisible()){
				return bValidValue;
			}

			var sUnitMutator = "get" + capitalize(sUnitParam),
				oUnitType = oUnitBinding.getType(),
				sUnitInternalType = oUnitBinding.sInternalType,
				sMeasureValue = oMeasureControl[sMeasureMutator](),
				sUnitValue = oUnitControl[sUnitMutator]();

			if (sUnitInternalType && oUnitType) {
				var vRawValues = oSettings.rawValues || oMeasureBinding.getValue(),
					vUnitParseValueReturn = oUnitType.parseValue(sUnitValue, oUnitBinding.sInternalType, vRawValues);

				if (vUnitParseValueReturn) {
					oUnitType.validateValue(vUnitParseValueReturn);
				}

				if (oUnitBinding.hasValidation()) {
					var bAllowPreventDefault = false,
						bEnableEventBubbling = true,
						mUnitSuccessParameters = {
							element: oUnitControl,
							property: sUnitParam,
							type: oUnitBinding.getType(),
							newValue: sUnitValue,
							oldValue: oUnitBinding.getValue(),
							mParameters: {
								suppressChangeModelValue: true
							}
						};
						oUnitControl.fireValidationSuccess(mUnitSuccessParameters, bAllowPreventDefault, bEnableEventBubbling);
						bValidValue &= true;
				}
			}
		} catch (oException) {
			var mUnitParameters = {
				element: oUnitControl,
				property: sUnitParam,
				type: oUnitBinding.getType(),
				newValue: sUnitValue,
				oldValue: oUnitBinding.getValue(),
				exception: oException,
				message: oException.message
			};

			if (oException instanceof ParseException) {
				oUnitControl.fireParseError(mUnitParameters);
			} else if (oException instanceof ValidateException) {
				oUnitControl.fireValidationError(mUnitParameters);
			} else {
				oException.validationUnitError = true;
				throw oException;
			}
			bValidValue = false;
		}
		return bValidValue;
	};

	/**
	 * Update rawValues property
	 * @param {object} oSettings object instance to be updated
	 * @private
	 */
	SmartField.prototype._updateCurrencyRawValues = function (oSettings) {
		oSettings.rawValues = oSettings.innerControls.map(function (oControl) {
			var oMetadata = oControl.getMetadata(),
				sPropertyName = ODataControlFactory.getBoundPropertiesMapInfoForControl(oMetadata.getName(), {
					propertyName: "value"
				});
			return oMetadata.getProperty(sPropertyName).get(oControl);
		});
	};

	/**
	 * Checks for a client-side and back-end side error on the given control.
	 * Additionally the error message is shown, if this is not the case already.
	 *
	 * @param {sap.ui.core.Control} oControl The control to be checked
	 * @param {object} [oSettings] Additional settings
	 * @param {boolean} [oSettings.checkClientErrorsOnly=false] Indicates whether only client side errors are checked
	 * @param {boolean} [oSettings.handleSuccess = true] Indicates whether {@link sap.ui.base.EventProvider#event:validationSuccess} should be fired
	 * @param {any} [oSettings.rawValues] Raw values used for validation of currency field
	 * @param {boolean} [oSettings.bCheckValuesValidity] Indicates that the method is called from <code>checkValuesValidity</code>
	 * @returns {Promise} A fulfilled <code>Promise</code> object or a <code>Promise</code> object to be
	 * fulfilled if the value of every text input field is valid, otherwise a rejected <code>Promise</code>
	 * object or a <code>Promise</code> object to be rejected
	 * @private
	 */
	SmartField.prototype._checkErrors = function(oControl, oSettings) {
		oSettings = Object.assign({ checkClientErrorsOnly: false, handleSuccess: true }, oSettings);

		var oBinding,
			sParam,
			that = this;

		if (oControl) {
			var aValuesPropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(oControl.getMetadata().getName(), {
				propertyName: "value"
			});
			sParam = aValuesPropertyMap && aValuesPropertyMap[0];
		}

		if (sParam) {
			oBinding = oControl.getBinding(sParam);
		}

		if (!oBinding) {
			return Promise.resolve();
		}

		var sValue;

		function handleException(oException) {
			var oUOMControl,
				mParameters = {
					element: oControl,
					property: sParam,
					type: oBinding.getType(),
					newValue: sValue,
					oldValue: oBinding.getValue(),
					exception: oException,
					message: oException.message
				};

			if (oException instanceof UoMValidateException) {
				oUOMControl = that._getEmbeddedSmartField();
				mParameters.targetControl = oUOMControl && oUOMControl.getFirstInnerControl();
			}

			if (oException instanceof ParseException) {
				oControl.fireParseError(mParameters);
			} else if (oException instanceof ValidateException) {
				oControl.fireValidationError(mParameters);
			} else {
				throw oException;
			}
		}

		function handleSuccess() {

			if (oSettings.handleSuccess && oBinding.hasValidation()) {

				var mSuccessParameters = {
					element: oControl,
					property: sParam,
					type: oBinding.getType(),
					newValue: sValue,
					oldValue: oBinding.getValue(),
					mParameters: {
						suppressChangeModelValue: true
					}
				};

				var bAllowPreventDefault = false,
					bEnableEventBubbling = true;

				oControl.fireValidationSuccess(mSuccessParameters, bAllowPreventDefault, bEnableEventBubbling);
			}
		}

		try {
			var sMutator = "get" + capitalize(sParam),
				oType = oBinding.getType(),
				sInternalType = oBinding.sInternalType;

			sValue = oControl[sMutator]();

			if (sInternalType && oType) {

				// If the type is async, probably the value has to be validated on the back-end side.
				// In such cases, when checkClientErrorsOnly=true, the validation is skipped.
				if (oSettings.checkClientErrorsOnly && oType.async) {
					var ERROR_MESSAGE = "The deprecated sap.ui.comp.smartfield.SmartField#checkClientError method can not be " +
										 "used with async types. Please use sap.ui.comp.smartfield.SmartField#checkValuesValidity " +
										 "method instead.";
					Log.error(ERROR_MESSAGE, this.getMetadata().getName());
					this.setSimpleClientError(true);
					return Promise.reject();
				}

				// optimization to prevent an unnecessary HTTP request in case the entered
				// value did pass the type validation
				if (oType.async) {
					var oDataState = oBinding.getDataState();
					var sDataStateFormattedValue = oType.formatValue(oDataState.getValue(), sInternalType);

					// FIXME: Currently, the oDataState.isControlDirty() method only works with sync
					// binding data types. So, in the future the if statement below can be simplified
					// to if (!oDataState.isControlDirty()) ...
					if (!oDataState.isControlDirty() && (sDataStateFormattedValue === sValue)) {
						handleSuccess();
						return Promise.resolve();
					}
				}

				var vRawValues = oSettings.rawValues || oBinding.getValue(),
					vParseValueReturn = oType.parseValue(sValue, oBinding.sInternalType, vRawValues),
					vValidateValueReturn;

				if (vParseValueReturn && (vParseValueReturn instanceof Promise)) {
					vValidateValueReturn = vParseValueReturn.then(function(vValue) {
						return oType.validateValue(vValue);
					}).then(handleSuccess);

					vValidateValueReturn.catch(handleException);
					return vValidateValueReturn;
				}

				vValidateValueReturn = oType.validateValue(vParseValueReturn, oSettings.bCheckValuesValidity);

				if (vValidateValueReturn instanceof Promise) {
					vValidateValueReturn.catch(handleException);
					return vValidateValueReturn.then(handleSuccess);
				}
			}
		} catch (oException) {
			handleException(oException);
			return Promise.reject();
		}

		handleSuccess();
		return Promise.resolve();
	};

	/*
	 * Returns whether the current control context points to a table.
	 *
	 * @returns {boolean} <code>true</code> if the current <code>SmartField</code> control is used inside a table,
	 * <code>false</code> otherwise
	 * @protected
	 */
	SmartField.prototype.isContextTable = function() {
		return (this.getControlContext() === "responsiveTable" || this.getControlContext() === "table");
	};

	/*
	 * Determines whether the <code>SmartField</code> is displayed in the form context by explicitly setting the
	 * <code>controlContext</code> property.
	 *
	 * @returns {boolean} <code>true</code> if the <code>controlContext</code> control property is set to "form" or
	 * "smartFormGrid", <code>false</code> otherwise
	 * @since 1.54
	 * @protected
	 */
	SmartField.prototype.isFormContextType = function() {
		var sSmartFieldControlContext = this.getControlContext(),
			mControlContextType = library.smartfield.ControlContextType;
		return (sSmartFieldControlContext === mControlContextType.Form) ||
				(sSmartFieldControlContext === mControlContextType.SmartFormGrid);
	};

	/*
	 * Determines whether the <code>SmartField</code> is displayed in the table context by explicitly setting the
	 * <code>controlContext</code> property.
	 *
	 * @returns {boolean} <code>true</code> if the <code>controlContext</code> control property is set to "Table" or
	 * "ResponsiveTable", <code>false</code> otherwise
	 * @protected
	 */
	SmartField.prototype.isTableContextType = function() {
		var sSmartFieldControlContext = this.getControlContext(),
			mControlContextType = library.smartfield.ControlContextType;
		return (sSmartFieldControlContext === mControlContextType.Table) ||
				(sSmartFieldControlContext === mControlContextType.ResponsiveTable);
	};

	/**
	 * Resolves the controls hosted currently by this <code>SmartField</code> control.
	 *
	 * @returns {array} The controls hosted currently by this <code>SmartField</code>
	 * @protected
	 */
	SmartField.prototype.getInnerControls = function() {
		var oContent = this.getContent();

		return this. _getInnerControls(oContent);
	};

	SmartField.prototype._getInnerControls = function(oContent) {
		var fContent,
			mComplex = {
			"sap.m.HBox": function(oControl) {
				var oChild,
					aItems,
					len = 0;

				aItems = oControl.getItems();

				if (aItems) {
					len = aItems.length;
				}

				if (len === 0) {
					return [];
				}

				if (len === 1) {
					return [
						aItems[0]
					];
				}

				oChild = aItems[1].getContent();

				if (oChild) {

					return [
						aItems[0], oChild
					];
				}

				return [
					aItems[0]
				];
			},
			"sap.ui.comp.navpopover.SmartLink": function(oControl) {
				var oItem = oControl.getAggregation("innerControl");

				if (oItem) {
					return [
						oItem
					];
				}

				return [
					oControl
				];
			}
		};

		if (oContent) {
			fContent = mComplex[oContent.getMetadata()._sClassName];
		}

		if (fContent) {
			return fContent(oContent);
		}

		if (oContent) {
			return [
				oContent
			];
		}

		return [];
	};

	SmartField.prototype.getAllInnerControls = function() {
		var aInnerControls = [],
			oControls = this._oControl;

		if (oControls) {

			for (var sProperty in oControls) {

				if (oControls.hasOwnProperty(sProperty)) {
					var oControl = oControls[sProperty];

					if (oControl && (oControl instanceof Object)) {
						aInnerControls.push(oControl);
					}
				}
			}
		}

		return aInnerControls;
	};

	/**
	 * Gets the embedded <code>SmartField</code> control instance.
	 *
	 * @returns {sap.ui.comp.smartfield.SmartField | null} The embedded <code>SmartField</code> control instance if
	 * exists, otherwise <code>null</code>.
	 * @private
	 */
	SmartField.prototype._getEmbeddedSmartField = function() {
		var aContent = this.getContent();

		return this._getEmbeddedSmartFieldInstace(aContent);
	};

	SmartField.prototype._getEmbeddedSmartFieldByMode = function(sMode) {
		var aContent = sMode === "edit" ? this._oControl.edit : this._oControl.display;

		return this._getEmbeddedSmartFieldInstace(aContent);
	};

	SmartField.prototype._getEmbeddedSmartFieldInstace = function(aContent) {
		if (aContent) {

			if (aContent.isA("sap.m.HBox")) {
				var aHBoxContent = aContent.getItems();

				if (aHBoxContent) {

					for (var j = 0; j < aHBoxContent.length; j++) {

						if (aHBoxContent[j].isA("sap.ui.comp.smartfield.SmartField")) {
							return aHBoxContent[j];
						}
					}
				}
			}
		}

		return null;
	};

	SmartField.prototype.onAfterRendering = function fnOnAfterRenderingHandler() {
		Control.prototype.onAfterRendering.bind(this, arguments);
		this._applyPlaceHolder();
		this._applyAttributes();
	};

	SmartField.prototype.onBeforeRendering = function fnOnBeforeRenderingHandler() {
		var oProcessStatePromise;

		// If there is no default model is not propageted to the SmartField
		// we do nothing
		if (!this._hasDefaultModel() || this._bInDestroy) {
			return Promise.resolve();
		}

		oProcessStatePromise = this._processState()
			.then(this.accessibilityAttributesHandler.bind(this))
			.then(Control.prototype.onBeforeRendering.bind(this, arguments))
			.catch(function(oException){
				if (oException) {
					Log.error(oException);
				}
			});

		return oProcessStatePromise;
	};

	SmartField.prototype._calculateCurrentState = function() {
		var bModeInitialized,
			bForceTextArrangementFetch,
			bRebindFactory,
			bClientSideMandatoryCheck = this.getClientSideMandatoryCheck(),
			sEditModeDescriptionPath = this._getControlDescriptionPath(this._oControl.edit),
			sDisplayModeDescriptionPath = this._getControlDescriptionPath(this._oControl.display),
			bEditable = this.getEditable(),
			bContextEditable = this.getContextEditable(),
			bIsFormContextType = this.isFormContextType(),
			sMode = this.getMode(),
			bEnabled = this.getEnabled(),
			bVisible = this.getVisible(),
			oValueBinding = this.getBinding("value"),
			bValuePropertyChanged = oValueBinding && this._oState.isValuePropertyChanged(oValueBinding.getValue()),
			bValueBindingPathChanged = this._oState.isValueBindingPathChanged(this.getBindingPath("value")),
			bModelChanged = this._oState.isModelChanged(this.getModel()),
			bBindingContextChanged = this._oState.isBindingContextChanged(this.getBindingContext()),
			bEntitySetChanged = this._oState.isEntitySetChanged(this._getEntitySet(undefined, true)),
			bModeChanged = this._oState.isModeChanged(sMode),
			bEditableChanged = this._oState.isEditableChanged(bEditable),
			bVisibleChanged = this._oState.isVisibleChanged(bVisible),
			bContextEditableChanged = this._oState.isContextEditableChanged(bContextEditable),
			bTextInEditModeSourceChanged = this._oState.isTextInEditModeSourceChanged(this.getTextInEditModeSource()),
			bDescriptionBindingPathChanged = this._isDescriptionBindingPathDefault(),
			bValueListNoValidationValueChanged = (this._getComputedTextInEditModeSource() === TextInEditModeSource.ValueListNoValidation && bValuePropertyChanged),
			bShouldUpdateDescriptionBindingPath = bModeChanged && sEditModeDescriptionPath !== sDisplayModeDescriptionPath,
			bDestroyFactory = bValueBindingPathChanged || bModelChanged || bEntitySetChanged || bTextInEditModeSourceChanged,
			bIsFactoryJustCreated = bDestroyFactory;

			if (bDestroyFactory) {
				this._oState._resetProperty("EDIT");
				this._oState._resetProperty("DISPLAY");
			}

			bModeInitialized = this._oState.isModeInitialized(sMode);
			bForceTextArrangementFetch = bBindingContextChanged || !bModeInitialized;
			bRebindFactory = bValueListNoValidationValueChanged || !bModeInitialized || bDescriptionBindingPathChanged || bValuePropertyChanged || bShouldUpdateDescriptionBindingPath;

			return {
				mode: sMode,
				rebind: bRebindFactory,
				enabled: bEnabled,
				visible: bVisible,
				visibleChanged: bVisibleChanged,
				editable: bEditable,
				editableChanged: bEditableChanged,
				contextEditable: bContextEditable,
				contextEditableChanged: bContextEditableChanged,
				forceTextArrangementFetch: bForceTextArrangementFetch,
				clientSideMandatoryCheck: bClientSideMandatoryCheck,
				isFormContextType: bIsFormContextType,
				isFactoryJustCreated: bIsFactoryJustCreated,
				destroyFactory: bDestroyFactory,
				bindingContextChanged: bBindingContextChanged
			};
	};

	SmartField.prototype._processState = function() {
		var oBindPromise,
			oFactorySettings,
			oControlSettings,
			oControlToggledSettings,
			oCurrentState = this._calculateCurrentState();

			oFactorySettings = {
				mode: oCurrentState.mode,
				rebind: oCurrentState.rebind
			};

			oControlSettings = {
				mode: oCurrentState.mode,
				contextEditable: oCurrentState.contextEditable,
				editable: oCurrentState.editable,
				enabled: oCurrentState.enabled,
				visible: oCurrentState.visible
			};

			oControlToggledSettings = {
				editable: oCurrentState.editable,
				editableChanged: oCurrentState.editableChanged,
				isFormContextType: oCurrentState.isFormContextType,
				contextEditable: oCurrentState.contextEditable,
				contextEditableChanged: oCurrentState.contextEditableChanged,
				forceTextArrangementFetch: oCurrentState.forceTextArrangementFetch,
				clientSideMandatoryCheck: oCurrentState.clientSideMandatoryCheck,
				mode: oCurrentState.mode,
				visible: oCurrentState.visible,
				visibleChanged: oCurrentState.visibleChanged
			};

		// TODO Remove this code
		// This code was initially in setEditableProperty method
		// When we are in Table/responsiveTable context and we switch from "display" to "edit" mode and the control
		// already had an edit control created we reset the value state just in case the table did not reset it
		// We are in table context
		// We are switching to edit mode
		// We ware in display mode
		if (this.isContextTable() &&
			(oCurrentState.editableChanged || oCurrentState.contextEditableChanged) &&
			(oCurrentState.editable && oCurrentState.contextEditable)) {
			var oEditControl = this._oControl && this._oControl.edit;
			if (oEditControl) {
				(oEditControl.isA("sap.m.HBox") ? oEditControl.getItems() : [oEditControl]).forEach(function (oItem) {
					if (oItem.getValueState && (oItem.getValueState() === ValueState.Error || oItem.getValueState() === ValueState.Warning)) {
						oItem.setValueState(ValueState.None);
					}
				});
			}
		}

		if (this._oFactory !== null && oCurrentState.destroyFactory) {
			this._calculatePlaceHolder();
			this._destroyFactory();
		}

		if (oCurrentState.bindingContextChanged) {
			this._bSideEffects = false;
		}

		this._init();

		if (this._oFactory === null) {
			return Promise.resolve();
		} else {
			this._deletePlaceHolder();
		}

		oBindPromise = this._oFactory.bind(oFactorySettings).then(function fnFactoryBindHandler(oResult) {
			const bSkipInit = oResult && oResult.skipInit;

			if (bSkipInit || this._oFactory === null) {

				//CS20240008979538: field-control is changed from display(1) to edit(3), in table scenario with
				// configData is presented control will not re-render and stays in display mode.
				if (this._oFactory && this.isContextTable()) {
					this._toggleInnerControlIfRequired(oControlSettings);
				}

				return Promise.reject();
			}

			oControlToggledSettings.fetchIDAndDescription = oResult && oResult.fetchIDAndDescription || false;
			//oCurrentState.isFactoryJustCreated could be removed at some point with the help of _bIsInitialized
			if (oCurrentState.isFactoryJustCreated && this._oFactory.isA("sap.ui.comp.smartfield.ODataControlFactory")) {
				this._oFactory.triggerCreationOfControls();
			}

			this._toggleInnerControlIfRequired(oControlSettings);

			//DINC0312285: If the control is configured with field-control=0(hidden)
			//the fetch for description is unnecessary
			if (this._fieldControlValue === 0) {
				oControlToggledSettings.fetchIDAndDescription = false;
			}

			this._onInnerControlToggled(oControlToggledSettings);

			if (this._oFactory.isA("sap.ui.comp.smartfield.ODataControlFactory") && this._oFactory.getDataProperty() && this._oFactory.getDataProperty().property !== undefined) {
				this._fireInitialise();
			}
		}.bind(this));

		oBindPromise.catch(function (vError) {
			if (vError) {
				Log.error(vError);
			}
		});

		return oBindPromise;
	};

	/**
	 * We wait till the embeded SmartField if any, caluculates it metadata too. Then we fire the event.
	 * @private
	 */
	 SmartField.prototype._fireInitialise = function() {
		var oEmbeddedSmartField = this._getEmbeddedSmartField();

		if (oEmbeddedSmartField && oEmbeddedSmartField.isA("sap.ui.comp.smartfield.SmartField")) {
			if (!oEmbeddedSmartField.hasListeners("initialise")) {
				oEmbeddedSmartField.attachInitialise(function() {
					!this._bIsInitialized && this.fireInitialise();
					this._bIsInitialized = true;
				}.bind(this));
			}
		} else if (!this._bIsInitialized) {
			this._bIsInitialized = true;
			this.fireInitialise();
		}
	};

	SmartField.prototype._calculatePlaceHolder = function() {
		var oInnerControl = this.getFirstInnerControl(),
			oInnerControlDomRef = oInnerControl && oInnerControl.getDomRef() || null;

		this._iInnerControlHeight = oInnerControlDomRef && oInnerControlDomRef.offsetHeight || null;
	};

	SmartField.prototype._deletePlaceHolder = function() {
		this._iInnerControlHeight = null;
	};

	SmartField.prototype._applyPlaceHolder = function() {
		var oDomRef = this.getDomRef();

		if (oDomRef) {
			if (this._iInnerControlHeight) {
				oDomRef.style.minHeight = this._iInnerControlHeight + "px";
			} else {
				oDomRef.style.minHeight = "";
			}
		}
	};

	SmartField.prototype._applyAttributes = function() {
		var oDomRef = this.getFirstInnerControl() ? this.getFirstInnerControl().getDomRef("inner") : null;

		if (oDomRef && this.isInEditMode() && (this._isPhone() || this._isTablet()) && this._oFactory && this._oFactory._oMetaData) {
			if (this._oFactory._oMetaData._isNumber) {
				oDomRef.setAttribute("inputmode", "decimal");
				oDomRef.setAttribute("pattern", "[0-9]+([\.,][0-9]+)?");
			}
		}
	};

	SmartField.prototype._isPhone = function() {
		return (Device.system.phone) ? true : false;
	};

	SmartField.prototype._isTablet = function() {
		return (Device.system.tablet && !Device.system.desktop) ? true : false;
	};

	SmartField.prototype.accessibilityAttributesHandler = function() {
		var oUoMNestedSmartField = this._getEmbeddedSmartField();

		if (this.isContextTable()) {
			this._handleAriaLabelledByInSmartTable(oUoMNestedSmartField);
		}
	};

	SmartField.prototype.getFirstInnerControl = function() {
		var aControls = this.getInnerControls();

		if (aControls.length) {
			return aControls[0] || null;
		}

		return null;
	};

	/**
	 * Checks whether field groups can be set.
	 * @param {object} oSettings settings
	 * @param {boolean} oSettings.bindingContextChanged Indicates whether fieldGroupIds should get reset.
	 * @param {boolean} oSettings.mode We set fieldGroupIds only in "edit" mode
	 * @private
	 */
	SmartField.prototype._checkFieldGroups = function(oSettings) {
		var oView,
			oMetaData,
			sMode = oSettings.mode;

		if (this.getBindingContext() && this._oFactory && this._oFactory.getMetaData &&
			(sMode === "edit") && !this._bSideEffects) {

			oMetaData = this._calculateFieldGroupMetaData();

			// view should be available.
			oView = this._getView();

			// now set the field group ids.
			if (oView && oMetaData) {
				this._setFieldGroup(oMetaData, oView);
			}
		}
	};

	SmartField.prototype._calculateFieldGroupMetaData = function() {
		var oMetaData = this._oFactory.getMetaData();

		if (oMetaData && (!oMetaData.property || (oMetaData.property && !oMetaData.property.property))) {
			return;
		}

		return oMetaData;
	};

	/**
	 * Sets the field group ID according to the side effects annotation.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {sap.ui.core.mvc.View} oView the current view
	 * @private
	 */
	SmartField.prototype._setFieldGroup = function(oMetaData, oView) {
		var oInnerControl,
			aIDs = this._oSideEffects.getFieldGroupIDs(oMetaData, oView);

		if (aIDs) {
			oInnerControl = this.getFirstInnerControl();

			if (oInnerControl) {
				this._bSideEffects = true;
				oInnerControl.setFieldGroupIds(aIDs);
			}
		}
	};

	/**
	 * Returns the current view instance.
	 *
	 * @returns {sap.ui.core.mvc.View} the current view instance or <code>null</code>
	 * @private
	 */
	SmartField.prototype._getView = function() {
		var oObj = this.getParent();

		while (oObj) {
			if (oObj.isA("sap.ui.core.mvc.View")) {
				return oObj;
			}

			oObj = oObj.getParent();
		}

		return null;
	};

	/**
	 * Returns the control used for the UOM field or null if there is no UOM field
	 * @returns {object|null} Returns the control of type {@link sap.ui.comp.smartfield.SmartField} used to display the <code>SmartField</code> UOM field
	 */
	SmartField.prototype._getUomControl = function(){
		var aControls = this.getAllInnerControls();

		if (this.getUomEnabled() && aControls && aControls.length === 1 ) {
			var aItems = aControls[0].getItems ? aControls[0].getItems() : [];

			for (var i = 0; i < aItems.length; i++){
				if (aItems[i].isA("sap.ui.comp.smartfield.SmartField")){
					return aItems[i];
				}
			}
		}

		return null;
	};

	/**
	 * Event handler for data state changes.
	 *
	 * @param {string} sName The name of the property
	 * @param {object} oDataState the new data state.
	 * @private
	 */
	SmartField.prototype.refreshDataState = function(sName, oDataState) {
		var oBindingContext,
			oObject,
			oDataStateChanges,
			oDataStateChangesValue;

		if (sName === "value") {

			oDataStateChanges = oDataState && oDataState.getChanges();
			oDataStateChangesValue = oDataStateChanges && oDataStateChanges.value;
			if (oDataStateChangesValue && oDataStateChangesValue.value !== oDataStateChangesValue.oldValue) {
				this._oLastValidated = null;
			}

			fnMixinRefreshDataState.apply(this, arguments);

			if (oDataState.isLaundering()) {

				if (this.getEditable()) {
					oBindingContext = this.getBindingContext();

					if (oBindingContext && oBindingContext.getObject) {
						oObject = oBindingContext.getObject();

						if (oObject && oObject.__metadata && oObject.__metadata.created) {
							this._checkCreated = true;
							return;
						}
					}
				}
			}

			// server has accepted the new instance and it is persistent now.
			if (this._checkCreated && !oDataState.isLaundering() && !oDataState.isDirty()) {
				if (this._oFactory) {
					this._oFactory.rebindOnCreated();
				}
				this._checkCreated = false;
			}
		}
	};

	SmartField.prototype.onValidation = function(oEvent) {
		var oProperties,
			oParameters = oEvent.getParameters(),
			bChanged = oParameters.newValue !== oParameters.oldValue,
			oConfigdata = this.data("configdata") && this.data("configdata").configdata,
			oListener = oConfigdata && oConfigdata.smartFieldRootControl ? oConfigdata.smartFieldRootControl : this,
			oUOMControl = oListener._getEmbeddedSmartField(),
			oInnerControl = oUOMControl && oUOMControl.getFirstInnerControl(),
			sUOMInnerControlId = oInnerControl && oInnerControl.getId(),
			oListenerDataModel = oListener.getModel(),
			sSourceId = oEvent.getSource().getId(),
			mParameters = oParameters.mParameters,
			sOriginSourceId = mParameters && mParameters.originSource && mParameters.originSource.getId(),
			bDuplicatedValidationSuccess = this._oLastValidated !== null && this._oLastValidated.sourceId === sSourceId && this._oLastValidated.sNewValue === oParameters.newValue,
			suppressChangeModelValue = (mParameters && mParameters.suppressChangeModelValue) || bDuplicatedValidationSuccess || false,
			bIsQuantitySource =  sUOMInnerControlId && sUOMInnerControlId !== sSourceId,
			bIsUOMSource =  sUOMInnerControlId && sUOMInnerControlId === sSourceId,
			bIsCurrencyQuantitySource =  sUOMInnerControlId && sOriginSourceId && sUOMInnerControlId !== sOriginSourceId,
			bIsCurrencyUOMSource =  sUOMInnerControlId && sOriginSourceId && sUOMInnerControlId === sOriginSourceId;

		if (sOriginSourceId && sOriginSourceId !== sSourceId || // Prevent firing ChangeModelValue if the control get updated from the model
			suppressChangeModelValue || // Prevent firing ChangeModelValue if validation triggered programatically
			oListenerDataModel.getDefaultBindingMode() !== BindingMode.TwoWay) {
			return;
		}

		this._oLastValidated = {
			sourceId: sSourceId,
			sNewValue: oParameters.newValue
		};

		if (bIsCurrencyQuantitySource || bIsQuantitySource) {
			oProperties = {
				valueChanged: bChanged,
				valueLastValueState: oListener.getValueState(),
				unitChanged: false,
				unitLastValueState: oUOMControl.getValueState()
			};
		} else if (bIsCurrencyUOMSource || bIsUOMSource) {
			oProperties = {
				valueChanged: false,
				valueLastValueState: oListener.getValueState(),
				unitChanged: bChanged,
				unitLastValueState: oUOMControl.getValueState()
			};
		} else {
			oProperties = {
				valueChanged: bChanged,
				valueLastValueState: oListener.getValueState()
			};
		}
		oListener.fireChangeModelValue(oProperties);
	};

	SmartField.prototype.exit = function() {

		this._bInDestroy = true;
		var oInactiveInnerControl = null;

		if (this._oSideEffects) {
			this._oSideEffects.destroy();
		}

		if (this._oUtil) {
			this._oUtil.destroy();
		}

		if (this._oFactory) {
			this._oFactory.destroy();
		}

		var oControl = this._oControl;

		// destroy only inactive control
		// active control will be destroyed via content aggregation
		if (oControl) {

			if (oControl.current === "edit") {
				oInactiveInnerControl = oControl["display"];
			} else {
				oInactiveInnerControl = oControl["edit"];
			}

			// content can be null for performance reasons => destroy control here
			if (oControl[oControl.current] && !oControl[oControl.current].getParent()) {
				oControl[oControl.current].destroy();
			}
		}

		if (oInactiveInnerControl && (typeof oInactiveInnerControl.destroy === "function")) {
			oInactiveInnerControl.destroy();
		}

		this._oObserver.unobserve(this, this._oObserverConfiguration);

		this._oUtil = null;
		this._oError = null;
		this._oValue = null;
		this._oFactory = null;
		this._oControl = null;
		this._oSideEffects = null;
		this._oState = null;
		this._sAnnotationLabel = "";
		this._oLastValidated = null;
		this._oObserver = null;
	};

	/**
	 * Calculates the paths to the annotations used by the <code>SmartField</code> control.
	 *
	 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel The given OData meta model
	 * @param {object} oEntitySet The given entity set
	 * @param {string} sValueBinding The path identifying the OData property to which the value property
	 * of the <code>SmartField</code> control is bound
	 * @param {boolean} bNavigationPathsOnly If set to <code>true</code>, no properties are returned
	 * @returns {Object<string[]>} The resulting paths are returned
	 * @public
	 */
	SmartField.getSupportedAnnotationPaths = function(oMetaModel, oEntitySet, sValueBinding, bNavigationPathsOnly) {
		var oConfig,
			oUOM,
			aResult = [],
			oMetaData;

		if (oMetaModel && oEntitySet && sValueBinding) {

			// prepare the meta data.
			oMetaData = {
				entitySet: oEntitySet,
				entityType: oMetaModel.getODataEntityType(oEntitySet.entityType),
				path: sValueBinding
			};

			// get the config.
			oConfig = {
				helper: new ODataHelper(null, null, oMetaModel)
			};

			if (bNavigationPathsOnly) {
				oConfig.navigationPathOnly = bNavigationPathsOnly;
			}

			// complete the meta data.
			oConfig.helper.getProperty(oMetaData);

			// get the annotations from the entity set.
			SmartField._getFromEntitySet(aResult, oMetaData, oConfig);

			// get the annotations from the property.
			SmartField._getFromProperty(aResult, oMetaData, oConfig);

			// get the annotations from a unit of measure.
			oUOM = oConfig.helper.getUnitOfMeasure2(oMetaData);

			if (oUOM) {
				SmartField._getFromProperty(aResult, oUOM, oConfig);
			}

			// destroy the helper class.
			oConfig.helper.destroy();
		}

		return aResult;
	};

	/**
	 * Calculates the paths to the annotations on entity set.
	 *
	 * @param {array} aResult The resulting paths
	 * @param {object} oMetaData The given meta data
	 * @param {object} oMetaData.entitySet The OData entity set definition
	 * @param {object} oMetaData.entityType The OData entity type definition
	 * @param {object} oMetaData.property The OData property definition
	 * @param {object} oConfig The given configuration
	 * @param {sap.ui.comp.smartfield.ODataHelper} oConfig.helper The given helper
	 * @param {boolean} oConfig.navigationPathOnly If set to <code>true</code>, no properties will be returned
	 * @private
	 */
	SmartField._getFromEntitySet = function(aResult, oMetaData, oConfig) {
		var sPath;

		if (oMetaData.entitySet) {
			sPath = oConfig.helper.oAnnotation.getUpdateEntitySetPath(oMetaData.entitySet);
			SmartField._push(sPath, aResult, oMetaData, oConfig);
		}
	};

	/**
	 * Pushes a path, if it is not null.
	 *
	 * @param {string} sPath The given path
	 * @param {array} aResult The resulting paths
	 * @param {object} oMetaData The given meta data
	 * @param {object} oMetaData.entitySet The OData entity set definition
	 * @param {object} oMetaData.entityType The OData entity type definition
	 * @param {object} oMetaData.property The OData property definition
	 * @param {object} oConfig The given configuration
	 * @param {sap.ui.comp.smartfield.ODataHelper} oConfig.helper The given helper
	 * @param {boolean} oConfig.navigationPathOnly If set to <code>true</code>, no properties will be returned
	 * @private
	 */
	SmartField._push = function(sPath, aResult, oMetaData, oConfig) {
		var aPath,
			sPart,
			len,
			sOut,
			oResult = {};

		if (sPath) {
			if (oConfig.navigationPathOnly) {
				aPath = sPath.split("/");
				len = aPath.length;
				oResult.entityType = oMetaData.entityType;

				while (len--) {
					sPart = aPath.shift();

					if (sPart === "") {
						continue;
					}

					oResult = oConfig.helper.getNavigationProperty(oResult.entityType, sPart);

					if (!oResult.entitySet) {
						break;
					}

					if (sOut) {
						sOut = sOut + "/" + sPart;
					} else {
						sOut = sPart;
					}
				}
			} else {
				sOut = sPath;
			}
		}

		if (sOut) {

			if (oMetaData.navigationPath) {
				aResult.push(oMetaData.navigationPath + "/" + sOut);
			} else {
				aResult.push(sOut);
			}
		}
	};

	/**
	 * Calculates the paths to the annotations on property.
	 *
	 * @param {array} aResult The resulting path.
	 * @param {object} oMetaData The given meta data
	 * @param {object} oMetaData.entitySet The OData entity set definition
	 * @param {object} oMetaData.entityType The OData entity type definition
	 * @param {object} oMetaData.property The OData property definition
	 * @param {object} oConfig The given configuration
	 * @param {sap.ui.comp.smartfield.ODataHelper} oConfig.helper The given helper
	 * @param {boolean} oConfig.navigationPathOnly If set to <code>true</code>, no properties will be returned
	 * @private
	 */
	SmartField._getFromProperty = function(aResult, oMetaData, oConfig) {
		var sPath;

		if (oMetaData.property.property) {
			sPath = oConfig.helper.oAnnotation.getText(oMetaData.property.property);
			SmartField._push(sPath, aResult, oMetaData, oConfig);

			sPath = oConfig.helper.oAnnotation.getUnit(oMetaData.property.property);
			SmartField._push(sPath, aResult, oMetaData, oConfig);

			sPath = oConfig.helper.oAnnotation.getFieldControlPath(oMetaData.property.property);
			SmartField._push(sPath, aResult, oMetaData, oConfig);
		}
	};

	SmartField.prototype.addAssociation = function(sAssociationName, sId, bSuppressInvalidate) {

		if (sAssociationName === "ariaLabelledBy" && sId) {
			this.getInnerControls().forEach(function(oControl) {

				if (oControl.addAriaLabelledBy) {
					oControl.addAriaLabelledBy(sId);
				}
			});
		} else if (sAssociationName === "ariaDescribedBy" && sId) {
			this.getInnerControls().forEach(function(oControl) {

				if (oControl.addAriaDescribedBy) {
					oControl.addAriaDescribedBy(sId);
				}
			});
		}

		return Control.prototype.addAssociation.apply(this, arguments);
	};

	SmartField.prototype.removeAssociation = function(sAssociationName, vObject, bSuppressInvalidate) {
		var sId = Control.prototype.removeAssociation.apply(this, arguments);

		if (sAssociationName === "ariaLabelledBy" && sId) {
			this.getInnerControls().forEach(function(oControl) {
				if (oControl.removeAriaLabelledBy) {
					oControl.removeAriaLabelledBy(sId);
				}
			});
		} else if (sAssociationName === "ariaDescribedBy" && sId) {
			this.getInnerControls().forEach(function(oControl) {

				if (oControl.removeAriaDescribedBy) {
					oControl.removeAriaDescribedBy(sId);
				}
			});
		}

		return sId;
	};

	SmartField.prototype.getAccessibilityInfo = function() {
		var oControl = this.getContent();
		return oControl && oControl.getAccessibilityInfo ? oControl.getAccessibilityInfo() : null;
	};

	/*
	 * If SmartField is inside of a Form use Forms aria logic for label
	 */
	SmartField.prototype.enhanceAccessibilityState = function(oElement, mAriaProps) {
		var oParent = this.getParent();

		if (oParent && oParent.enhanceAccessibilityState) {
			oParent.enhanceAccessibilityState(oElement, mAriaProps);
		}
	};

	/**
	 * Handles AriaLabelledBy for SmartField inside of a SmartTable
	 * @private
	 * @param {object} oUoMNestedSmartField Currency field from UoM pair
	 */
	SmartField.prototype._handleAriaLabelledByInSmartTable = function(oUoMNestedSmartField) {
		var bHasAriaLabelledBy,
		that = this;

		if (this.getAriaLabelledBy().length > 0) {
			this.getInnerControls().forEach(function(oControl) {

				if (oControl.addAriaLabelledBy && oControl.getAriaLabelledBy) {
					bHasAriaLabelledBy = oControl.getAriaLabelledBy().indexOf(that.getAriaLabelledBy()[0]) > -1;

					if (!bHasAriaLabelledBy) {
						// BCP 2070307927 - when we have smart field(currency field) inside a Table, propagate the ariaLabelledBy to the inner controls
						oControl.addAriaLabelledBy(that.getAriaLabelledBy()[0]);
					}
				}
			});
		}
	};

	/**
	 * Has the initial value of the SmartField changed by user interaction or model change after the
	 * initial value the control was rendered with.
	 * @private
	 * @returns {boolean}
	 */
	 SmartField.prototype._isValueInitial = function () {
		var bIsInitial,
			oValueBinding = this.getBinding("value"),
			oDataState = oValueBinding && oValueBinding.getDataState();

		if (!oDataState || this._bValueNotInitial) {
			bIsInitial = false;
		} else if (this._isValueInValidation()) {
			bIsInitial = this._getValueInValidation() === oDataState.getOriginalValue();
		} else {
			bIsInitial = oDataState.getValue() === oDataState.getOriginalValue();
		}

		return bIsInitial;
	};

	SmartField.prototype._setValueInValidation = function (vValue) {
		this._vValueInValidation = vValue;
	};

	SmartField.prototype._getValueInValidation = function () {
		return this._vValueInValidation;
	};

	SmartField.prototype._isValueInValidation = function () {
		return this._vValueInValidation !== undefined;
	};

	/**
	 * Gets the value of the <code>mandatory</code> property.
	 *
	 * This function is needed as the "mandatory" feature is named "required" in a lot of other controls
	 * (like <code>Label</code> or <code>Form</code>).
	 * @returns {boolean} the true if the <code>SmartField</code> should be marked as required
	 * @since 1.48.0
	 * @protected
	 */
	SmartField.prototype.getRequired = function() {

		if (this.getContextEditable() && this.getEditable()) {
			return this.getMandatory();
		} else {
			return false;
		}
	};

	/**
	 * Gets binding mode of <code>sProperty</code>.
	 *
	 * @param {string} sProperty The name of the property
	 * @returns {string|undefined} The binding mode of <code>sProperty</code>
	 * @since 1.67
	 */
	SmartField.prototype.getBindingMode = function(sProperty) {
		var oBindingInfo = this.getBindingInfo(sProperty);
		return oBindingInfo ? oBindingInfo.parts[0].mode : undefined;
	};

	/**
	 * Checks if the innner control has value.
	 *
	 * @returns {boolean} <code>true</code>, if it doesn't have a value, <code>false</code> otherwise.
	 * @private
	 */
	SmartField.prototype._innerControlHasNoValue = function() {
		var i, j, iPropertiesWithNoValue, vPropertyValue, oInnerControl, sControlMetadataName, sBoundPropertyName, aBoundPropertyNames, aInnerControls = this.getInnerControls(), bHasNoValue = false;

		for (i = 0; i < aInnerControls.length; i++) {
			oInnerControl = aInnerControls[i];
			sControlMetadataName = oInnerControl.getMetadata().getName();

			if (sControlMetadataName === "sap.m.ObjectStatus" &&
				!(oInnerControl.getText().trim() || oInnerControl.getIcon().trim() || oInnerControl.getTitle().trim())) {
				bHasNoValue = true;
				break;
			} else {
				aBoundPropertyNames = ODataControlFactory.getBoundPropertiesMapInfoForControl(sControlMetadataName, {
					propertyName: "value"
				});

				if (!Array.isArray(aBoundPropertyNames)) {
					return false;
				}

				iPropertiesWithNoValue = 0;
				for (j = 0; j < aBoundPropertyNames.length; j++) {
					vPropertyValue = undefined;
					sBoundPropertyName = aBoundPropertyNames[j];
					vPropertyValue = oInnerControl.getProperty(sBoundPropertyName);
					if (vPropertyValue === "" || vPropertyValue === null) {
						iPropertiesWithNoValue += 1;
					}
				}
				if (iPropertiesWithNoValue === aBoundPropertyNames.length){
					bHasNoValue = true;
					break;
				}
			}
		}

		return bHasNoValue;
	};
	/**
	 * A private method which can be used to disable history values for a specific field.
	 * You can use it if you want to disable history values for a specific field for some
	 * reason. Just override the method for your local instance and return false
	 *
	 * NOTE: Keep in mind that this is a private method and it may change in the future. Use it
	 * only if there is no other option.
	 *
	 * @returns {boolean}
	 * @private
	 */
	SmartField.prototype._getHistoryEnabled = function () {
		return this.getHistoryEnabled();
	};

	/**
	 * Returns the name of the value-holding property of a control used in a <code>SemanticFormElement</code>.
	 *
	 * @returns {string}
	 * @since 1.88
	 * @public
	 */
	SmartField.prototype.getFormValueProperty = function () {
		return "value";
	};

	/**
	 *  Returns the formatted value of a control used in a <code>SemanticFormElement</code>.
	 *
	 * @returns {Promise<string>} Formatted value or a <code>Promise</code> returning the formatted value if resolved
	 * @since 1.88
	 * @public
	 */
	SmartField.prototype.getFormFormattedValue = function () {
		var sText,
			oInitialiseFieldPromise = this._forceInitialise();

		if (oInitialiseFieldPromise instanceof Promise) {
			return oInitialiseFieldPromise.then(function () {
				return this.getInnerControls().map(function (oControl) {
					if (oControl.isA("sap.m.Text")) {
						sText = oControl.getText();
						if (!sText && oControl.getEmptyIndicatorMode() === EmptyIndicatorMode.On) {
							sText = "-";
						}
						return sText;
					}
				}).join("");
			}.bind(this));
		}
	};

	SmartField.prototype._hasSemanticObject = function () {
		var oControlFactorySelector,
			sFactoryCreateMethod = null,
			oControlFactory = this.getControlFactory();

		if (oControlFactory) {
			oControlFactorySelector = oControlFactory._oSelector;
		}

		if (oControlFactorySelector) {
			sFactoryCreateMethod = oControlFactorySelector.getCreator({mode: "display"});
		}

		return sFactoryCreateMethod === "_createEdmSemantic";
	};

	SmartField.prototype._hasCriticality = function () {
		var oControlFactory = this.getControlFactory();

		return !!oControlFactory?.getEdmProperty()?.criticalityInfo;
	};

	/**
	 * Returns the label computed from the SmartField annotations if available
	 * @private
	 * @ui5-restricted sap.ui.comp.smartform.GroupElement
	 * @returns {string|undefined}
	 */
	SmartField.prototype.getDataSourceLabel = function () {
		return this._sAnnotationLabel;
	};

	/**
	 * Is the SmartField binding with the model in async mode.
	 *
	 * Note: Currently this would only work correct for SmartFields with TextArrangement. For other type
	 * of fields like currency and unit of measure the method needs to be enhanced further.
	 *
	 * @private
	 */
	SmartField.prototype._isAsync = function () {
		var sTEMS = this._getComputedTextInEditModeSource(),
			eTEMS = library.smartfield.TextInEditModeSource,
			sTA;

		if (sTEMS === eTEMS.ValueList) {
			return true;
		} else if (sTEMS === eTEMS.NavigationProperty) {
			return true;
		} else if (sTEMS === eTEMS.ValueListNoValidation) {
			sTA = this.getControlFactory()._getDisplayBehaviourConfiguration("defaultInputFieldDisplayBehaviour");
			return sTA === "descriptionOnly";
		}

		return false;
	};

	/**
	 * Lazy create and retrieve TextArrangementRead instance
	 * @returns {sap.ui.comp.smartfield.TextArrangementRead}
	 * @private
	 */
	SmartField.prototype._getTextArrangementRead = function () {
		if (!this._oTextArrangementRead) {
			this._oTextArrangementRead = new TextArrangementRead();
		}

		return this._oTextArrangementRead;
	};

	/**
	 * A protected method that checks if the <code>SmartField</code> has a reference to the default data model.
	 *
	 * @returns {boolean}
	 * @private
	 */
	SmartField.prototype._hasDefaultModel = function () {
		var oDefaultModel = this.getModel();

		return oDefaultModel !== undefined;
	};

	/**
	 * A protected method that checks if the <code>SmartField</code> has a <code>entitySet</code> and default data model.
	 *
	 * @returns {boolean}
	 * @private
	 */
	SmartField.prototype._isBoundToDefaultModel = function () {
		var bHasDefaultModel = this._hasDefaultModel(),
			sEntitySet = this._getEntitySet(undefined, true);

		return bHasDefaultModel && sEntitySet;
	};

	SmartField.prototype._isDescriptionBindingPathDefault = function () {
		var oInnerControl = this.getFirstInnerControl(),
			oInnerControlBinding = oInnerControl && oInnerControl.getBinding("value"),
			bDescriptionBindingPathChanged = (oInnerControlBinding &&
												oInnerControlBinding.isA("sap.ui.model.CompositeBinding") &&
												oInnerControlBinding.getBindings()[1] &&
												oInnerControlBinding.getBindings()[1].getPath() === '__$$SmartFieldNotExistingBindingPath') ||
												false;

		return bDescriptionBindingPathChanged;
	};

	SmartField.prototype._getControlDescriptionPath = function (oControl) {
		var oControlBindingInfo = oControl && oControl.getBindingInfo("value"),
			sDescriptionPath = oControlBindingInfo && Array.isArray(oControlBindingInfo.parts) && oControlBindingInfo.parts[1] && oControlBindingInfo.parts[1].path;

		return sDescriptionPath;
	};

	/**
	 * A private method that creates the internal object which holds the state.
	 *
	 * @returns {object}
	 * @private
	 */
	SmartField.prototype._initState = function () {
		var oState = Object.create({
			_setProperty: function(sPropertyName, value){
				if (this.mProperties === undefined || this.mProperties === null) {
					this.mProperties = {};
				}

				if (this.mProperties[sPropertyName] === undefined) {
					this.mProperties[sPropertyName] = {};
				}

				this.mProperties[sPropertyName].previous = this.mProperties[sPropertyName].current;
				this.mProperties[sPropertyName].current = value;
			},
			_getProperty: function(sPropertyName){
				return this.mProperties && this.mProperties[sPropertyName] && this.mProperties[sPropertyName].current;
			},
			_resetProperty: function(sPropertyName){
				if (this.mProperties[sPropertyName] !== undefined) {
					this.mProperties[sPropertyName] = {};
				}
			},
			_resetProperties: function(){
				if (this.mProperties) {
					this.mProperties = {};
				}
			},
			isModeInitialized: function (sMode) {
				var sValueProperty = sMode === "edit" ? "EDIT" : "DISPLAY",
					bIsInitialized = this._getProperty(sValueProperty);

				if (!bIsInitialized) {
					this._setProperty(sValueProperty, true);
				}

				return bIsInitialized;
			},
			isModeChanged: function (sMode) {
				var sValueProperty = "MODE",
					bHasChanged = (this._getProperty(sValueProperty) !== sMode);

				if (bHasChanged) {
					this._setProperty(sValueProperty, sMode);
				}

				return bHasChanged;
			},
			isValuePropertyChanged: function (sValue) {
				var sValueProperty = "VALUE_PROPERTY_VALUE",
					bHasChanged = (this._getProperty(sValueProperty) !== sValue);

				if (bHasChanged) {
					this._setProperty(sValueProperty, sValue);
				}

				return bHasChanged;
			},
			isModelChanged: function (oModel) {
				var sModelId = "MODEL_ID",
					sCurrentModelId = oModel && oModel.getId(),
					bHasChanged = this._getProperty(sModelId) !== sCurrentModelId;

				if (bHasChanged) {
					this._setProperty(sModelId, sCurrentModelId);
				}

				return bHasChanged;
			},
			isValueBindingPathChanged: function (sPath) {
				var sPropertyBindingPath = "VALUE_PROPERTY_BINDING_PATH",
					bHasChanged = (typeof sPath !== "undefined" && this._getProperty(sPropertyBindingPath) !== sPath);

				if (bHasChanged) {
					this._setProperty(sPropertyBindingPath, sPath);
				}

				return bHasChanged;
			},
			isEntitySetChanged: function (sEntitySet) {
				var sKey = "ENTITY_SET",
					bHasChanged = this._getProperty(sKey) !== sEntitySet;

				if (bHasChanged) {
					this._setProperty(sKey, sEntitySet);
				}

				return bHasChanged;
			},
			isBindingContextChanged: function (oBindingContext) {
				var sBindingContextPath = "BINDING_CONTEXT_PATH",
					sCurrentBindingContextPath = oBindingContext && oBindingContext.getPath(),
					bHasChanged = (typeof sCurrentBindingContextPath !== "undefined" && this._getProperty(sBindingContextPath) !== sCurrentBindingContextPath);

				if (bHasChanged) {
					this._setProperty(sBindingContextPath, sCurrentBindingContextPath);
				}

				return bHasChanged;
			},
			isEditableChanged: function (bEditable) {
				var sValueProperty = "EDITABLE",
					bHasChanged = (this._getProperty(sValueProperty) !== bEditable);

				if (bHasChanged) {
					this._setProperty(sValueProperty, bEditable);
				}

				return bHasChanged;
			},
			isContextEditableChanged: function (bContextEditable) {
				var sValueProperty = "CONTEXT_EDITABLE",
					bHasChanged = (this._getProperty(sValueProperty) !== bContextEditable);

				if (bHasChanged) {
					this._setProperty(sValueProperty, bContextEditable);
				}

				return bHasChanged;
			},
			isVisibleChanged: function (bVisible) {
				var sValueProperty = "VISIBLE",
					bHasChanged = (this._getProperty(sValueProperty) !== bVisible);

				if (bHasChanged) {
					this._setProperty(sValueProperty, bVisible);
				}

				return bHasChanged;
			},
			isTextInEditModeSourceChanged: function (sTextInEditModeSource) {
				var sValueProperty = "TEXT_IN_EDIT_SOURCE_MODE",
					bHasChanged = (this._getProperty(sValueProperty) !== sTextInEditModeSource);

				if (bHasChanged) {
					this._setProperty(sValueProperty, sTextInEditModeSource);
				}

				return bHasChanged;
			}
		});

		// Set Defaults
		oState._setProperty("TEXT_IN_EDIT_SOURCE_MODE", TextInEditModeSource.None);

		return oState;
	};

	/**
	 * Reads the label from the OData service. This method is introduced for RTA as the label is needed in some
	 * scenarios for non-rendered and not initialised SmartFields.
	 * @private
	 * @ui5-restricted sap.ui.rta, sap.ui.comp.designtime.smartfield.SmartField.designtime.js
	 * @returns {Promise}
	 */
	SmartField.prototype.readODataLabel = function () {
		return new Promise(function (fnResolve, fnReject) {
			var oModel = this.getModel(),
				oConfig = this.data("configdata"),
				sBindingPath,
				oMetaModel = oModel && oModel.getMetaModel(),
				oHelper,
				sEntitySet;

			// If annotation label is already resolved we don't do nothing
			if (this._sAnnotationLabel) {
				fnResolve(this._sAnnotationLabel);
				return;
			}

			// If field has no model nor configdata we can't resolve the label
			if (!oModel && !oConfig) {
				fnReject();
				return;
			}

			oHelper = new ODataHelper(oModel, this._oUtil, oMetaModel);

			// Resolve label from configdata -> where all the entitySet and entityType object data should already be
			// resolved and propagated to the control
			if (oConfig && oConfig.configdata) {
				this._sAnnotationLabel = oHelper.oAnnotation.getLabel(oHelper.getEdmProperty(oConfig.configdata));
				fnResolve(this._sAnnotationLabel);
				return;
			}

			// Resolve label from the service metadata
			sBindingPath = this.getBindingPath("value");
			sEntitySet = this._getEntitySet();
			if (sBindingPath && sEntitySet) {
				oMetaModel.loaded().then(function () {
					var oEntitySet = oHelper.oMeta.getODataEntitySet(sEntitySet),
						oMetaData = {
							entitySet: oEntitySet,
							entityType: oHelper.oMeta.getODataEntityType(oEntitySet.entityType),
							path: sBindingPath
						};

					oHelper.getProperty(oMetaData);
					this._sAnnotationLabel = oHelper.oAnnotation.getLabel(oHelper.getEdmProperty(oMetaData));
					fnResolve(this._sAnnotationLabel);
				}.bind(this));
			} else {
				fnReject();
			}
		}.bind(this));
	};

	SmartField.prototype._setEmptyIndicator = function (oDisplayControl) {
		if (oDisplayControl && oDisplayControl.getEmptyIndicatorMode &&
			oDisplayControl.getEmptyIndicatorMode() !== EmptyIndicatorMode.On) {
				oDisplayControl.setEmptyIndicatorMode(EmptyIndicatorMode.On);
		}
	};

	/**
	 * Should control be editable in case it's bound to a not expanded navigation property.
	 * @private
	 * @ui5-restricted sap.ui.comp.smartmultiinput.SmartMultiInput
	 */
	SmartField.prototype._getEditableForNotExpandedNavigation = function () {
		return false;
	};

	/**
	 * Returns computed service metadata in smartfield internal format. The only purpose this object
	 * is exposed is to be used to calculate the FieldGroupIDs for navigation properties.
	 * @returns {Promise<object>} internally computed service metadata
	 * @private
	 * @ui5-restricted sap.suite.ui.generic.template.ObjectPage
	 */
	SmartField.prototype._getComputedMetadata = function () {
		return this._initialStateApplied.promise.then(function () {
			return this._oFactory?.isA("sap.ui.comp.smartfield.ODataControlFactory") && this._oFactory.getMetaData();
		}.bind(this));
	};

	/**
	 * Calculates field group id's based on the provided computed service metadata
	 * @param {object} oMetadata computed service metadata
	 * @returns {array} containing calculated field group id's
	 * @private
	 * @ui5-restricted sap.suite.ui.generic.template.ObjectPage
	 */
	SmartField.prototype._calculateFieldGroupIDs = function (oMetadata) {
		return this._oSideEffects.getFieldGroupIDs(oMetadata, this._getView());
	};

	/**
	 * Sets the provided FieldGroupIds to the internally created edit controls.
	 * @param {string[]} sFieldGroups comma delimited list of FieldGroupIds
	 * @private
	 * @ui5-restricted sap.suite.ui.generic.template.ObjectPage
	 */
	SmartField.prototype._setInternalFieldGroupIds = function (sFieldGroups) {
		this.setProperty("_internalFieldGroupIds", sFieldGroups);
	};

	SmartField.prototype._isFixedValueList = function () {
		var oMetadata = this._oFactory.getMetaData();

		if (
			oMetadata &&
			oMetadata.annotations &&
			oMetadata.annotations.valuelistType === "fixed-values"
		) {
			return true;
		}

		return false;
	};

	/**
	 * Sets a new value for property <code>uomEditState</code>.
	 *
	 * @name sap.ui.comp.smartfield.SmartField#setUomEditState
	 * @function
	 * @type void
	 * @private
	 */

	/**
	 * Gets current value of property <code>uomEditState</code>.
	 *
	 * @name sap.ui.comp.smartfield.SmartField#setUomEditState
	 * @function
	 * @type void
	 * @private
	 */

	return SmartField;
}, true);
