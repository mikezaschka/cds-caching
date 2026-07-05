/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartfilterbar.ControlConfiguration.
sap.ui.define(['sap/ui/comp/library', 'sap/ui/comp/config/ControlConfigurationBase'], function(library, ControlConfigurationBase) {
	"use strict";

	/**
	 * Constructor for a new smartfilterbar/ControlConfiguration.
	 *
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class ControlConfiguration can be used to add additional configuration for filter fields in the SmartFilterBar control, in order to overwrite
	 *        the default settings from the OData metadata. For instance, it is possible to change the label, index or control type of a filter field.
	 * @extends sap.ui.comp.config.ControlConfigurationBase
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.ControlConfiguration
	 */
	var ControlConfiguration = ControlConfigurationBase.extend("sap.ui.comp.smartfilterbar.ControlConfiguration", /** @lends sap.ui.comp.smartfilterbar.ControlConfiguration.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * The groupId can be used to move a field from one group to another. The groupId corresponds to the EntityName from the OData
				 * metadata. It is also possible to move a field from the advanced area to the basic area by specifying the groupId _BASIC.
				 */
				groupId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Using this property it is possible to overwrite the label of a filter field in the SmartFilterBar.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Using this flag it is possible to hide fields from the OData metadata.
				 */
				visible: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies whether a value help dialog is available or not.
				 */
				hasValueHelpDialog: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies whether <code>sap.m.ComboBox</code> selectedKey has corresponding item or not.
				 */
				 hasValidation: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The SmartFilterBar calculates which kind of control will be used for a filter fields based on multiple OData Attributes and
				 * annotations. Using this property it is possible to overwrite the OData metadata.
				 */
				controlType: {
					type: "sap.ui.comp.smartfilterbar.ControlType",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The filter type specifies whether the filter field is of type single value, multi-value, or interval. The filter type is
				 * calculated by the {@link sap.ui.comp.smartfilterbar.SmartFilterBar} control based on the OData metadata. Using this property the filter type can be configured manually.
				 */
				filterType: {
					type: "sap.ui.comp.smartfilterbar.FilterType",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The index property specifies the initial order of fields without any variants. It's zero based so in order for it to be taken into account,
				 * its value must be equal to or bigger than 0.
				 * <b>Note:</b> To ensure the expected sorting behavior, the index property should have a unique value.
				 */
				index: {
					type: "int",
					group: "Misc",
					defaultValue: -1
				},

				/**
				 * Property can be used to enable the TypeAhead service. TypeAhead does not work with all controls, e.g it does not work for
				 * DropDownListbox
				 */
				hasTypeAhead: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Property can be used to overwrite the mandatory state of a filter field. Property can only be set during initialization. Changes at
				 * runtime will be ignored.
				 */
				mandatory: {
					type: "sap.ui.comp.smartfilterbar.MandatoryType",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The width of the filter field in a CSS compatible format. The width can be set only once during initialization. Changes at runtime
				 * will not be reflected. The width will not be applied to custom controls.
				 */
				width: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to true this field will be added to the advanced area (aka. Dynamic Selection) by default.
				 */
				visibleInAdvancedArea: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * In case there are value help annotations for this filter field, it is possible to specify whether the table in the value help
				 * dialog for this field will be filled initially. The default value is <code>false</code>, which means the table will be filled as the data
				 * fetch is not prevented.
				 * <b>Note:</b> As of version 1.78 the default value has been changed from <code>true</code> to <code>false</code>.
				 */
				preventInitialDataFetchInValueHelpDialog: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * The displayBehaviour specifies how the content should be displayed on certain controls. Ex: DescriptionOnly for Combobox (DropDown
				 * text) , Description and ID for MultiInput (token text)
				 */
				displayBehaviour: {
					type: "sap.ui.comp.smartfilterbar.DisplayBehaviour",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * If set to <code>false</code> history values are disabled.
				 *
				 * <b>Note:</b> For {@link sap.m.ComboBox} and {@link sap.m.MultiComboBox} the history values are disabled by default.
				 * To enable them for these controls, you need to set the <code>historyEnabled</code> property to <code>true</code>.
				 *
				 * @since 1.84
				 */
				historyEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Sets default operation for Condition Panel of the Value Help dialog. In case the newly set
				 * default operation is not valid for the filter's EDM data type, then it is ignored.
				 *
				 * @since 1.99
				 */
				conditionPanelDefaultOperation: {
					type: "sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Sets time zone for filter of type Edm.DateTimeOffset
				 *
				 * <b>Note:</b> The property is IANA timezone ID, e.g. "America/New_York".
				 * An invalid IANA timezone ID will fall back to the UTC.
				 * @since 1.103
				 */
				timezone: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			},
			aggregations: {

				/**
				 * Default value for a filter field.
				 * The aggregation expects {@link sap.ui.comp.smartfilterbar.SelectOption|SelectOption} instances, where the values' format
				 * (properties <code>low</code> and <code>high</code>) match the type of the referneced property and consider also the
				 * given constraints of the property.
				 *
				 * Samples for valid formats:
				 * <code>Edm.DateTime</code> with constraint <code>sap:display-format='Date'</code>:
				 * "2018-12-24" (you optionally can provide a time-part and timezone, too, (2018-12-24T00:00:00Z) but this is ignored)
				 *
				 * <code>Edm.DateTimeOffset</code>:
				 * "2018-12-24T13:55:59Z"
				 *
				 * <code>Edm.Time</code>:
				 * "PT12H34M56S"
				 *
				 * <code>Edm.Boolean</code>:
				 * "false"
				 *
				 * <code>Edm.Decimal</code>:
				 * "2983.12"
				 */
				defaultFilterValues: {
					type: "sap.ui.comp.smartfilterbar.SelectOption",
					multiple: true,
					singularName: "defaultFilterValue"
				},

				/**
				 * If a custom control is specified, the SmartFilterBar will not create a control but use the custom control. Additional services like
				 * TypeAhead have to implemented manually.
				 */
				customControl: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			events: {

				/**
				 * Fired when the value of a property, for example isVisible, has changed.
				 */
				change: {
					parameters: {

						/**
						 * Name of the changed property
						 */
						propertyName: {
							type: "string"
						}
					}
				}
			}
		}
	});

	ControlConfiguration.prototype.setVisible = function(bIsVisible) {
		this.setProperty("visible", bIsVisible);
		this.fireChange({
			propertyName: "visible"
		});
		return this;
	};

	ControlConfiguration.prototype.setLabel = function(sLabel) {
		this.setProperty("label", sLabel);
		this.fireChange({
			propertyName: "label"
		});
		return this;
	};

	ControlConfiguration.prototype.setVisibleInAdvancedArea = function(bVisible) {
		this.setProperty("visibleInAdvancedArea", bVisible);
		this.fireChange({
			propertyName: "visibleInAdvancedArea"
		});
		return this;
	};

	// Assign types from library for backward compatibility!
	ControlConfiguration.FILTERTYPE = library.smartfilterbar.FilterType;
	ControlConfiguration.CONTROLTYPE = library.smartfilterbar.ControlType;
	ControlConfiguration.MANDATORY = library.smartfilterbar.MandatoryType;
	ControlConfiguration.DISPLAYBEHAVIOUR = library.smartfilterbar.DisplayBehaviour;

	return ControlConfiguration;

});
