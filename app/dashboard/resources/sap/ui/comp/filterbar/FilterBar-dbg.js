/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.filterbar.FilterBar.
sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	"sap/ui/core/Control",
	"sap/ui/core/ResizeHandler",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/Title",
	"sap/m/Text",
	"sap/m/AssociativeOverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/ui/Device",
	"sap/ui/comp/state/UIState",
	"./VariantConverterFrom",
	"./VariantConverterTo",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/comp/smartvariants/SmartVariantManagementUi2",
	"sap/m/library",
	"sap/ui/model/json/JSONModel",
	"./FilterGroupItem",
	"./FilterBarRenderer",
	"sap/base/Log",
	"sap/base/util/merge",
	"sap/ui/core/ShortcutHintsMixin",
	"sap/base/util/Deferred",
	'sap/m/delegate/ValueStateMessage',
	"sap/m/ToolbarSeparator",
	"sap/ui/layout/form/Form"
], function(
	Localization,
	Element,
	Library,
	coreLib,
	Control,
	ResizeHandler,
	Button,
	Label,
	Title,
	Text,
	AssociativeOverflowToolbar,
	ToolbarSpacer,
	Device,
	UIState,
	VariantConverterFrom,
	VariantConverterTo,
	PersonalizableInfo,
	SmartVariantManagementUi2,
	mLibrary,
	JSONModel,
	FilterGroupItem,
	FilterBarRenderer,
	Log,
	merge,
	ShortcutHintsMixin,
	Deferred,
	ValueStateMessage,
	ToolbarSeparator,
	Form
) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLib.ValueState;

	var SymbolValidationWarningMessage = Library.getResourceBundleFor("sap.ui.comp").getText("SEARCH_FIELD_VALIDATION_WARNING_MESSAGE");

	// shortcut for sap.ui.core.TextAlign
	var TextAlign = coreLib.TextAlign;

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLib.TitleLevel;

	// shortcut for sap.m.ButtonType
	var ButtonType = mLibrary.ButtonType;

	var Form;

	/**
	 * @typedef {Object} sap.ui.comp.filterbar.FilterBar.fetchVariantResponse
	 *
	 * @property {string|Object} filterBarVariant
	 * @property {Object} filterbar
	 * @property {string} orderedFilterItems
	 * @property {string} singleInputsTextArrangementData
	 * @property {string|undefined} version
	 * @property {string|undefined} basicSearch
	 *
	 * @public
	 */

	/**
	 * @callback sap.ui.comp.filterbar.FilterBar.fGetFiltersWithValuesCallBack
	 * @param  {void|undefined} fCallBack - Called when a variant must be applied
	 */

	/**
	 * Constructor for a new FilterBar.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class
	 * The <code>FilterBar</code> displays filters in a user-friendly manner to populate values for a query. The
	 * <code>FilterBar</code> consists of a row containing the {@link sap.ui.comp.smartvariants.SmartVariantManagementUi2 <code>SmartVariantManagementUi2</code>}
	 * control, the related buttons, and an area underneath displaying the filters.
	 *
	 * The filters are arranged in a logical row that is divided depending on the space available and the width of the filters.
	 * The area containing the filters can be hidden or shown using the <b>Hide FilterBar</b> / <b>Show FilterBar</b> button.
	 * The <b>Go</b> button triggers the search event, and the <b>Adapt Filters</b> button shows the <code>Adapt Filters Dialog</code>.
	 *
	 * In this dialog, the user has full control over the <code>FilterBar</code>.

	 * @extends sap.ui.core.Control
	 * @author SAP
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.filterbar.FilterBar
	 * @see {@link topic:2ae520a67c44495ab5dbc69668c47a7f Filter Bar}
	 * @see {@link fiori:https://experience.sap.com/fiori-design-web/filter-bar/ Filter Bar}
	 */
	var FilterBar = Control.extend("sap.ui.comp.filterbar.FilterBar", /** @lends sap.ui.comp.filterbar.FilterBar.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/filterbar/FilterBar.designtime",
			properties: {

				/**
				 * Key used to access personalization data. Only if the persistencyKey is provided, will the <code>VariantManagement</code> control
				 * be used.
				 */
				persistencyKey: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * The advanced mode is only relevant for the value help scenario. UI representation is different from the standard FilterBar.
				 */
				advancedMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Collapses/expands the advanced area.
				 * @deprecated Since version 1.30.0. Replaced by property <code>filterBarExpanded</code> This property is mapped to the
				 *             filterBarExpanded property.
				 */
				expandAdvancedArea: {
					type: "boolean",
					group: "Misc",
					defaultValue: false,
					deprecated: true
				},

				/**
				 * Enables/disables the Search button.
				 * @deprecated As of version 1.32.0. with no replacement.
				 */
				searchEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true,
					deprecated: true
				},

				/**
				 * Shows the filters area. When property <code>useToolbar</code> is set to <code>false</code>, <code>filterBarExpanded</code>
				 * is ignored automatically and the <code>FilterBar</code> is always expanded.
				 * <b>Note:</b> When <code>SmartFilterBar</code> is used inside a <code>ValueHelpDialog</code>, it is initially collapsed. The filter bar is
				 * initially expanded in the following cases:
				 *
				 * - When there is no basic search field.
				 *
				 * - When <code>preventInitialDataFetchInValueHelpDialog</code> is set to <code>true</code> or the <code>fetchValues</code> property of the <code>valueList</code> annotation is set to <code>2</code>.
				 *
				 * - When there are mandatory fields, all fields are expanded (not only the first 7).
				 * @since 1.26.1
				 */
				filterBarExpanded: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If this property is set, then the label for filters will be prefixed with the group title.
				 * @since 1.28.0
				 */
				considerGroupTitle: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set to <code>true</code>, when the <code>FilterBar</code> is expanded it will show all filters, not only the first 7.
				 *
				 * <b>Note:</b> This is valid only when the <code>FilterBar</code> is used inside a <code>ValueHelpDialog</code>
				 * @since 1.116.0
				 */
				showAllFilters: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Clear button on the Filters dialog.
				 * @deprecated As of version 1.84 with no replacement. Users can select any Variant instead.
				 */
				showClearButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false,
					deprecated: true
				},

				/**
				 * Handles visibility of the "Restore" button on the "Filters" dialog. <b>Note:</b> Restore works only automatically when a property
				 * <code>persistencyKey</code> is set and therefore Variant Management is used. In all other cases the "restore" behavior needs to
				 * be implemented by the app, based on the event <code>reset</code>.
				 * Since 1.84 the "Restore" button text is changed to "Reset"
				 * @since 1.26.1
				 */
				showRestoreButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Handles visibility of the Go button on the FilterBar.
				 * @since 1.28.0
				 */
				showGoOnFB: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Handles visibility of the Restore button on the FilterBar.
				 * @since 1.28.0
				 */
				showRestoreOnFB: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Clear button on the FilterBar.
				 * @since 1.28.0
				 */
				showClearOnFB: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Go button on the FilterBar.
				 * @since 1.26.1
				 * @deprecated Since version 1.28.0. Replaced by property <code>showGoOnFB</code>
				 */
				showGoButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				},

				/**
				 * Stores the delta as compared to the standard variant.
				 * @since 1.34.0
				 */
				deltaVariantMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Sets the width of the filters container.
				 * @since 1.34.0
				 */
				filterContainerWidth: {
					type: "string",
					group: "Misc",
					defaultValue: "12rem"
				},

				/**
				 * Determines what design is used. Default is the design with toolbar.
				 * If the property <code>useToolbar</code> is set to <code>false</code>,
				 * the property <code>filterBarExpanded</code> is ignored automatically and the <code>FilterBar</code> is always expanded.
				 * <b>Note:</b><br>
				 * If set to <code>false</code>, the <code>VariantManagement</code> control is not available at all.
				 * This scenario is only intended for the {@link sap.ui.comp.smartfilterbar.SmartFilterBar}.
				 * @since 1.38.0
				 */
				useToolbar: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies header text that is shown in the toolbar on the first position. This property is ignored, when <code>useToolbar</code>
				 * is set to <code>false</code>.
				 * @since 1.38.0
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Handles visibility of the Filters button on the FilterBar.
				 * @since 1.38.0
				 */
				showFilterConfiguration: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Determines the behavior when <code>reset</code> is executed. <br>
				 * <b>Note:</b> This property is only relevant if no variant management is used, and the filter bar is not used in the advanced mode.
				 * A snapshot shows the current state of the filter bar, just before the Filters dialog is opened.
				 * <ul>
				 * <li><code>undefined</code> (default) defines the standard behavior: snapshot will be applied after <code>reset</code> was
				 * triggered</li>
				 * <li><code>false</code> defines that the snapshot will not be applied</li>
				 * <li><code>true</code>is not considered at all</li>
				 * </ul>
				 * @since 1.44
				 */
				useSnapshot: {
					type: "boolean",
					group: "Misc"
				},
				/**
				 * Sets whether the filter bar should look like the filters area in a ValueHelpDialog.
				 * True for SmartFilterBar when used in a ValueHelpDialog. False otherwise.
				 */
				isRunningInValueHelpDialog: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},
				/**
				 * Disables the warning for special symbols.
				 *
				 * <b>Note:</b> Changing the values here after the SmartFilter is initialized (<code>initialise</code>
				 * event was fired) has no effect.
				 * @since 1.102
				 */
				disableSearchMatchesPatternWarning: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},
				/**
				 * Specifies the semantic header level of the {@link #getHeader header} text property. For more information, see {@link sap.m.Title#setLevel}.
				 * This property is ignored, when <code>useToolbar</code> is set to <code>false</code>.
				 *
				 * @since 1.121
				 */
				headerLevel: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance",
					defaultValue: TitleLevel.Auto
				}
			},
			aggregations: {

				/**
				 * Filters belonging to the basic group.
				 * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
				 */
				filterItems: {
					type: "sap.ui.comp.filterbar.FilterItem",
					multiple: true,
					singularName: "filterItem"
				},

				/**
				 * Contains all FilterBar filters. <br>
				 * <code>Note:</code>In case a filter has to be added to the basic group
				 * <ul>
				 * <li>the property <code>groupName</code> has to be set to the constant
				 * <code>sap.ui.comp.filterbar.FilterBar.INTERNAL_GROUP</code></li>
				 * <li>the property <code>groupLabel</code> will be handled internally and will be ignored, if set</li>
				 * <li>the property <code>partOfCurrentVariant</code> has to be set to <code>true</code></li>
				 * <li>if the property <code>visibleInFilterBar</code> is set to <code>true</code>, the property
				 * <code>partOfCurrentVariant</code> will be set internally also to <code>true</code></li>
				 * </ul>
				 */
				filterGroupItems: {
					type: "sap.ui.comp.filterbar.FilterGroupItem",
					multiple: true,
					singularName: "filterGroupItem"
				},

				/**
				 * Do NOT use this aggregation directly. The <code>FilterBar</code> control is not meant to be used with
				 * arbitrary content. It renders filterFields which are added by <code>filterGroupItems</code> aggregation.
				 * If you need to add some content below the <code>FilterBar</code>, this can be done by adding it as sibling
				 * of the <code>FilterBar</code>. For example, if <code>FilterBar</code> is child of <code>DynamicPageHeader</code>,
				 * the custom content can be added to the <code>DynamicPageHeader</code> as well.
				 * @deprecated As of version 1.122 with no replacement.
				 */
				content: {
					type: "sap.ui.core.Control",
					multiple: true
				},

				/**
				 * Special handling for analytic parameters.
				 */
				_parameters: {
					type: "sap.ui.comp.filterbar.FilterGroupItem",
					multiple: true,
					singularName: "_parameter",
					visibility: "hidden"
				},

				_toolbar: { type: "sap.m.AssociativeOverflowToolbar", multiple: false, visibility: "hidden" },
				_headerTitle: { type: "sap.m.Title", multiple: false, visibility: "hidden" },
				_variantManagement: { type: "sap.ui.core.Control", multiple: false, visibility: "hidden" },
				_basicSearch: { type: "sap.ui.core.Control", multiple: false, visibility: "hidden" },
				_searchButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
				_hideShowButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
				_clearButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
				_restoreButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
				_filtersButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
				_showAllFiltersButton: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
				_hintText: { type: "sap.m.Text", multiple: false, visibility: "hidden" }

			},
			/**
			 * @deprecated Since version 1.122
			 */
			defaultAggregation: "content",
			associations: {

				/**
				 * Populates the basic search area on the FilterBar and the Filters dialog.
				 * @since 1.30.0
				 */
				basicSearch: {
					type: "sap.m.SearchField",
					multiple: false
				}
			},
			events: {

				/**
				 * This event is fired when the Cancel button on the Filters dialog is pressed and the variant is marked as dirty.
				 */
				cancel: {},

				/**
				 * This event is fired when the Restore button is pressed.
				 */
				reset: {
					parameters: {
						/**
						 * Visible controls
						 */
						selectionSet: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * This event is fired when the Go button is pressed.
				 */
				search: {
					parameters: {
						/**
						 * Visible controls
						 */
						selectionSet: {
							type: "sap.ui.core.Control[]"
						},

						/**
						 * Set to <code>true</code> when event is fired due to user action in <code>FilterBar</code>
						 *
						 * @since 1.107
						 */
						firedFromFilterBar: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired before a variant is saved. The event can be used to adapt the data of the custom filters, which will be saved
				 * as variant later.
				 * <b>Note:</b> This event is not fired during key user adaptation of the <code>FilterBar</code> right away. The variant is saved when the key user saves the draft.
				 * Therefore it's recommended to use the <code>beforeVariantFetch</code> event to adapt the data of custom filters for key user scenarios.
				 */
				beforeVariantSave: {
					parameters: {
						/**
						 * Context of the event. Can also be <code>null</code> or <code>undefined</code>
						 */
						context: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired before a variant is fetched.
				 * @since 1.28.13
				 */
				beforeVariantFetch: {},

				/**
				 * This event is fired after a variant has been loaded and applied to the <code>FilterBar</code>. The event can be used to adapt custom filters
				 * with data from the variant.
				 */
				afterVariantLoad: {
					parameters: {
						/**
						 * Context of the event. Can also be <code>null</code> or <code>undefined</code>
						 */
						context: {
							type: "string"
						},
						/**
						 * executeOnSelect indicates if the variant will trigger search
						 * @since 1.44.0
						 */
						executeOnSelect: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired when a filter or multiple filters has changed.
				 */
				filterChange: {
					parameters: {
						/**
						 * This property is provided, whenever a filter is added via the add/remove filters dialog.
						 */
						added: {
							type: "sap.ui.core.Control"
						},
						/**
						 * This property is provided, whenever a filter is removed via the add/remove filters dialog.
						 */
						deleted: {
							type: "sap.ui.core.Control"
						},

						/**
						 * The filter item is only provided along with added or deleted properties.
						 */
						filterItem: {
							type: "sap.ui.comp.filterbar.FilterGroupItem"
						}
					}
				},

				/**
				 * This event is fired when the Clear button is pressed. The consumer has to clear all filters.
				 */
				clear: {
					parameters: {
						/**
						 * Visible controls
						 */
						selectionSet: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * This event is fired when the FilterBar is initialized to indicate that metadata are available.
				 */
				initialise: {},

				/**
				 * This event is fired after the <code>FilterBar</code> has been initialized, the user's default variant has been applied, and a
				 * stable filter state has been achieved. With this event all relevant filter information, for example, for navigation-related
				 * actions, is available via {@link sap.ui.comp.filterbar.FilterBar#getUiState}.
				 * @since 1.38.0
				 */
				initialized: {},

				/**
				 * This event is fired after a variant has been saved.
				 */
				afterVariantSave: {},

				/**
				 * This event is fired after the filters dialog is closed.
				 * @since 1.34.0
				 */
				filtersDialogClosed: {
					parameters: {
						/**
						 * Context of the event. Can also be <code>null</code> or <code>undefined</code>
						 */
						context: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired after the filters dialog is opened.
				 * @since 1.48.0
				 */
				filtersDialogBeforeOpen: {},

				/**
				 * This event is fired when the Go button on the filters dialog is pressed.
				 * @since 1.48.0
				 * @deprecated As of version 1.84 with no replacement.
				 */
				filtersDialogSearch: {},

				/**
				 * This event is fired when the Cancel button on the filters dialog is pressed.
				 * @since 1.48.0
				 */
				filtersDialogCancel: {},

				/**
				 * This event is fired when search field of the filter dialog is changed.
				 * @since 1.48.0
				 * @deprecated As of version 1.84 with no replacement.
				 */
				filtersDialogSearchForFilters: {
					parameters: {

						/**
						 * Contains the entered search filed value
						 */
						newValue: {
							type: "string"
						}
					}

				},

				/**
				 * This event is fired when the filters information has changed. It indicates specifically that the count of assigned filters may be
				 * changed. One of the intended reaction to this event would be to call <code>retrieveFiltersWithValuesAsText</code> method.
				 * @since 1.38.0
				 */
				assignedFiltersChanged: {}
			}
		},

		renderer: FilterBarRenderer
	});

	FilterBar.INTERNAL_GROUP = "__$INTERNAL$";

	/**
	 * Initializes the FilterBar control.
	 * @private
	 */
	FilterBar.prototype.init = function() {
		Control.prototype.init.apply(this, arguments);

		// Call grid init method
		this._filterGroupItemChange = this._filterGroupItemChange.bind(this);
		this._filterItemChange = this._filterItemChange.bind(this, null);
		this._onLocalizationChanged = this._onLocalizationChanged.bind(this);
		this._oVariantManagement = null;
		this._oCollectiveSearch = null;

		this._aBasicAreaSelection = null;
		this._mAdvancedAreaFilter = null;
		this._mAdvancedAreaFilterFlat = [];
		this._aOrderedFilterItems = [];
		this._aAdaptFilterItems = [];
		this._mAdvancedAreaHiddenFilters = [];
		this._mAdaptFiltersDialogInitialItemsOrder = [];

		this._fRegisteredFetchData = null;
		this._fRegisteredApplyData = null;
		this._fRegisterGetFiltersWithValues = null;

		this._bIsInitialized = false;
		this._bSearchFiredFromFilterBar = false;
		this._bMoveTriggered = false;
		this._bDelegateAdded = false;
		this._oInitializedDeferred = new Deferred();

		this._aFields = null;

		this._oBasicSearchField = null;

		this._oVariant = {};
		this._oSelectedVariantBase = null;

		this._filterChangeSemaphore = true;
		this._triggerFilterChangeState = true;

		this._fRegisteredFilterChangeHandlers = null;
		this._fInitialiseVariants = null;

		this._bHostedVariantManagement = false;

		// Set default number of visible filters to 7
		this._nMaxFiltersByDefault = 7;

		this._bResetFiltersDialogTriggered = false;

		this._oRb = Library.getResourceBundleFor("sap.ui.comp");

		this._createVariantLayout();
		this._createButtons();
		this._createHeaderTitle();
		this._createToolbar();

		this.oModel = new JSONModel({});
		this.setModel(this.oModel, "FilterBar");

		this._oHintText = new Text({
			text: this._oRb.getText("FILTER_BAR_NO_FILTERS_ON_FB"),
			textAlign: TextAlign.Center
		}).addStyleClass("sapUiCompFilterBarHint");
		this.setAggregation("_hintText", this._oHintText);

		if (this._isTablet() || this._isPhone()) {
			this.setFilterBarExpanded(false);
		}

		this.getMetadata().addPublicMethods("getInitializedPromise");

		// SNOW CS20240007319987 Temporary fix. Should be removed after confiramtion
		this._oClearButtonOnFB = this._getClearButton();
		Localization.attachChange(this._onLocalizationChanged);
	};

	FilterBar.prototype.onBeforeRendering = function() {
		const bButtonsEnabled = !!this._mAdvancedAreaFilter;

		Control.prototype.onBeforeRendering.apply(this, arguments);

		this._updateHideShowButtonText();
		this._updateHeaderTitle();
		this._updateToolbarText();

		this._getClearButton().setVisible(this.getShowClearOnFB());
		this._getRestoreButton().setVisible(this.getShowRestoreOnFB());
		this._calcVisibilityFiltersButton();
		this._calcVisibilityHideShowButton();
		this._calcVisibilityGoButton();
		this._calcVisibilityVariant();
		this._calcVisibilityBasicSearch();
		this._calcVisibilitySeparator();

		this._getClearButton().setEnabled(bButtonsEnabled);
		this._getRestoreButton().setEnabled(bButtonsEnabled);
		this._getFiltersButton().setEnabled(bButtonsEnabled);
		this._getHideShowButton().setEnabled(bButtonsEnabled);
		this._getSearchButton().setEnabled(this.getSearchEnabled());

		this._deregisterResizeHandlers();
	};

	FilterBar.prototype.onAfterRendering = function(oEvent) {
		Control.prototype.onAfterRendering.apply(this, arguments);

		this._applyAttributes();

		this._registerResizeHandlers();
		this._onResize();
	};

	FilterBar.prototype._registerResizeHandlers = function () {
		const oButtonsArea = this.$("item-buttons").get(0);
		this._iResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));

		if (oButtonsArea) {
			this._iButtonsAreaResizeHandlerId = ResizeHandler.register(oButtonsArea, this._onResize.bind(this));
		}
	};

	FilterBar.prototype._deregisterResizeHandlers = function () {
		if (this._iResizeHandlerId) {
			ResizeHandler.deregister(this._iResizeHandlerId);
			this._iResizeHandlerId = null;
		}

		if (this._iButtonsAreaResizeHandlerId) {
			ResizeHandler.deregister(this._iButtonsAreaResizeHandlerId);
			this._iButtonsAreaResizeHandlerId = null;
		}
	};

	FilterBar.prototype._onResize = function () {
		if (!this.getAdvancedMode() || this.getIsRunningInValueHelpDialog()) {
			this._onNonAdvancedModeResize();
		} else if (this.getAdvancedMode()) {
			this._onAdvancedModeResize();
		}
	};

	FilterBar.prototype._onAdvancedModeResize = function () {
		const oFB = this.getDomRef();

		if (!oFB)  {
			return;
		}

		oFB.classList.remove("sapUiCompFilterBarTablet");
		oFB.classList.remove("sapUiCompFilterBarDesktop");

		if (oFB.offsetWidth > 605 && oFB.offsetWidth <= 1024) {
			oFB.classList.add("sapUiCompFilterBarTablet");
		}
		if (oFB.offsetWidth > 1024) {
			oFB.classList.add("sapUiCompFilterBarDesktop");
		}
	};

	FilterBar.prototype._onNonAdvancedModeResize = function () {
		const iItemsGap = 16,
			oFB = this.getDomRef(),
			oButtons = oFB?.querySelector(".sapUiCompFilterBarButtons"),
			oBasicSearch = oFB?.querySelector(".sapUiCompFilterBarBasicSearch"),
			aFilterItems = oFB?.querySelectorAll(".sapUiCompFilterBarItem"),
			oFirstItem = aFilterItems?.length > 0 ? aFilterItems[0] : oBasicSearch,
			oLastItem = aFilterItems?.length > 0 ? aFilterItems[aFilterItems.length - 1] : oBasicSearch;

		if (!oFirstItem || !oLastItem || !oButtons || oFB?.offsetHeight === 0) {
			return;
		}

		const oButtonsDim = oButtons.getBoundingClientRect(),
			oFirstItemDim = oFirstItem.getBoundingClientRect(),
			oLastItemDim = oLastItem.getBoundingClientRect();
		let sButtonStyle = "";
		if (oButtonsDim.x - iItemsGap >= oLastItemDim.x + oLastItemDim.width) {
			sButtonStyle = `margin-top: -${oLastItemDim.height}px`;
		}
		oButtons.style = sButtonStyle;

		if (oFirstItemDim.y === oLastItemDim.y) {
			oFB.classList.add("sapUiCompFilterBarOneLine");
		} else {
			oFB.classList.remove("sapUiCompFilterBarOneLine");
		}
	};

	FilterBar.prototype.getShowAllFiltersButton = function () {
		return this._getShowAllFiltersButton();
	};

	FilterBar.prototype._getMaxItemWidth = function() {
		var sDimension, nWidth, sValue = this.getFilterContainerWidth();

		[
			"rem", "%", "px", "em"
		].some(function(sDim) {
			var i = sValue.indexOf(sDim);
			if (i > 0) {
				sValue = sValue.substring(0, i);
				sDimension = sDim;
				return true;
			}
			return false;
		});

		if (sDimension) {
			nWidth = parseInt(sValue);
			if (!isNaN(nWidth)) {
				nWidth *= 2;
				return nWidth + sDimension;
			}
		}
	};

	FilterBar.prototype._hasAnyVisibleFiltersOnFB = function() {

		var aItems = this._retrieveVisibleAdvancedItems();

		for (var i = 0; i < aItems.length; i++) {
			if (aItems[i].filterItem.getVisibleInFilterBar()) {
				return true;
			}
		}

		return false;
	};

	FilterBar.prototype._hasRelevantFilters = function() {
		var i, n = null, oItem;

		if (!this._mAdvancedAreaFilter || (Object.keys(this._mAdvancedAreaFilter) < 1)) {
			return false;
		}

		if (this.getAdvancedMode()) {
			for (n in this._mAdvancedAreaFilter) {
				var oGroupElement = this._mAdvancedAreaFilter[n];
				if (oGroupElement && oGroupElement.items) {
					for (i = 0; i < oGroupElement.items.length; i++) {
						oItem = oGroupElement.items[i];
						if (oItem) {
							if (this._determineVisibility(oItem.filterItem)) {
								return true;
							}
						}
					}
				}
			}

			return false;
		}

		return true;
	};

	/**
	 * Returns the associated VariantManagement control. The returned VariantManagement instance should not be cached or manipulated in any ways. It
	 * should offer the application a convenient way to verify the dirty state and to check for page variant scenario. The method may return
	 * <code>null</code> or a disabled VariantManagement control.
	 * @public
	 * @since 1.44.0
	 * @returns {null|sap.ui.comp.variants.VariantManagement} the associated VariantManagement control.
	 */
	FilterBar.prototype.getVariantManagement = function() {
		return this._oVariantManagement;
	};

	FilterBar.prototype._updateHideShowButtonText = function () {
		let sHideShowButtonTextKey = this.getFilterBarExpanded() ? "FILTER_BAR_HIDE" : "FILTER_BAR_SHOW";
		if (this.getAdvancedMode()) {
			sHideShowButtonTextKey = this.getFilterBarExpanded() ? "FILTER_BAR_VH_HIDE_FILTERS" : "FILTER_BAR_VH_SHOW_FILTERS";
		}
		this._getHideShowButton().setText(this._oRb.getText(sHideShowButtonTextKey));
	};

	FilterBar.prototype._calcVisibilityBasicSearch = function () {
		let bVisible = true;
		if (!this._oBasicSearchField) {
			return;
		}

		if (!this._isNewFilterBarDesign() && this._isPhone() && !this.getAdvancedMode()) {
			bVisible = false;
		}

		this._oBasicSearchField.setVisible(bVisible);
	};

	FilterBar.prototype._calcVisibilitySeparator = function () {
		const oHeaderText = this.getAggregation("_headerTitle"),
			oVariant = this._oVariantManagement;
		let bVisible = false;

		if (!this._isPhone() && !this.getIsRunningInValueHelpDialog() && (oHeaderText?.getVisible() || oVariant?.getVisible())) {
			bVisible = true;
		}

		this._oSeparator.setVisible(bVisible);
	};

	FilterBar.prototype._calcVisibilityVariant = function () {
		if (!this._oVariantManagement || this.getAssociation("smartVariant")) {
			return false;
		}

		let bVisible = true;
		if (this._possibleToChangeVariantManagement() && (this.getAdvancedMode() || !this.getPersistencyKey())) {
			bVisible = false;
		}

		this._oVariantManagement.setVisible(bVisible);
	};

	FilterBar.prototype._calcVisibilityFiltersButton = function() {
		this._getFiltersButton().setVisible(!this.getAdvancedMode() && this.getShowFilterConfiguration());
	};

	FilterBar.prototype._calcVisibilityHideShowButton = function() {
		if (this.getAdvancedMode() && !this._isPhone()) {
			this._getHideShowButton().setVisible(this._hasRelevantFilters());
		} else if (this._isPhone()) {
			this._getHideShowButton().setVisible(false);
		}
	};

	FilterBar.prototype._calcVisibilityGoButton = function() {
		var bVisible = this.getShowGoOnFB();
		if (bVisible && !this._isPhone() && this.isLiveMode && this.isLiveMode()) {
			bVisible = false;
		}

		this._getSearchButton().setVisible(bVisible);
	};

	/*
	 * @override
	 */
	FilterBar.prototype.setShowGoButton = function(bFlag) {
		return this.setShowGoOnFB(bFlag);
	};

	/*
	 * @override
	 */
	FilterBar.prototype.getShowGoButton = function() {
		return this.getShowGoOnFB();
	};

	/**
	 * Hides the Go button on FilterBar. Allows to hide the Go-button for dedicated scenarios, like liveMode.
	 * @protected
	 * @since 1.40.4
	 */
	FilterBar.prototype.hideGoButton = function() {
		this._getSearchButton().setVisible(false);
	};

	/**
	 * Restores the visibility of the Go button on FilterBar. The visibility of the Go button will be set, according to the showGoOnFB property.
	 * @protected
	 * @since 1.40.4
	 */
	FilterBar.prototype.restoreGoButton = function() {
		this._getSearchButton().setVisible(this.getShowGoOnFB());
	};

	/**
	 * Determines if the current variant is the standard variant
	 * @public
	 * @since 1.44.0
	 * @returns {boolean| undefined} indicates if the current variant is the standard variant. In case the variant management does not exists,
	 *          <code>undefined</code> is returned.
	 */
	FilterBar.prototype.isCurrentVariantStandard = function() {

		var sKey;
		if (this._oVariantManagement) {
			sKey = this._oVariantManagement.getCurrentVariantId();
			if (sKey === "") {
				return true;
			}
			return (sKey === this._oVariantManagement.getStandardVariantKey());
		}

		return undefined;
	};

	/**
	 * Sets the current variant ID.
	 * @public
	 * @since 1.28.0
	 * @param {string} sVariantId ID of the variant
	 * @param {boolean} bDoNotApplyVariant If set to <code>true</code>, the <code>applyVariant</code> method is not executed yet. Relevant during
	 *        navigation, when called before the initialise event has been executed.
	 */
	FilterBar.prototype.setCurrentVariantId = function(sVariantId, bDoNotApplyVariant) {

		if (this._oVariantManagement) {
			this._oVariantManagement.setCurrentVariantId(sVariantId, bDoNotApplyVariant);
		}
	};

	/**
	 * Retrieves the current variant ID.
	 * @public
	 * @since 1.28.0
	 * @returns {string} ID of the current variant
	 */
	FilterBar.prototype.getCurrentVariantId = function() {

		var sKey = "";

		if (this._oVariantManagement) {
			sKey = this._oVariantManagement.getCurrentVariantId();
		}

		return sKey;
	};

	/**
	 * Retrieves the current variant as selection variant for UI navigation
	 * @public
	 * @since 1.28.0
	 * @deprecated As of version 1.48, replaced by {@link sap.ui.comp.filterbar.FilterBar#getUiState}
	 * @param {boolean} bConsiderAllFilters also include empty/invisible fields filter data
	 * @returns {string} JSON string representing the selection variant for UI navigation; <code>null</code> otherwise
	 */
	FilterBar.prototype.getDataSuiteFormat = function(bConsiderAllFilters) {

		return this._getDataSuiteFormat(bConsiderAllFilters, null);
	};

	FilterBar.prototype._getDataSuiteFormat = function(bConsiderAllFilters, sVersion) {

		var sSuiteVariant = null, sKey, sContent, aFiltersInfo, sParameterContextURL, sFilterContextUrl;

		if (this._oVariantManagement) {
			sKey = this.getCurrentVariantId();

			if (this.getFilterDataAsString) {
				aFiltersInfo = this._determineVariantFiltersInfo(bConsiderAllFilters, true);

				if (this.getFilterContextUrl) {
					sFilterContextUrl = this.getFilterContextUrl();
				}

				if (this.getParameterContextUrl) {
					sParameterContextURL = this.getParameterContextUrl();
				}

				sContent = this.getFilterDataAsString(bConsiderAllFilters);
				if (sContent) {
					var oConverter = new VariantConverterTo();
					sSuiteVariant = oConverter.convert(sKey, aFiltersInfo, sContent, this, sVersion, sParameterContextURL, sFilterContextUrl);
				}
			}
		}

		return sSuiteVariant;
	};

	/**
	 * Determine the internal basic search field name.
	 * @protected
	 * @returns {string} name of the basic search field.
	 */
	FilterBar.prototype.getBasicSearchName = function() {

		var sBasicSearchFieldName = null;

		if (this._oBasicSearchField && this.getEntitySet) {
			sBasicSearchFieldName = "$" + this.getEntitySet() + ".basicSearch";
		}

		return sBasicSearchFieldName;
	};

	/**
	 * Determine the value of the basic search.
	 * @protected
	 * @returns {string} current value of the basic search field.
	 */
	FilterBar.prototype.getBasicSearchValue = function() {
		return this._getBasicSearchValue();
	};

	/**
	 * Apply the SelectionPresentationVariant annotated information as a variant. The current UI state represents the data suite format.
	 * @public
	 * @since 1.54
	 * @param {sap.ui.comp.state.UIState} oUiState object representing the ui-state.Only the SelectionVariant part is considered
	 * @param {string} sContext Describes in which context the variant is applied. The context is passed on to the application via the
	 *        afterVariantLoad event
	 */
	FilterBar.prototype.setUiStateAsVariant = function(oUiState, sContext) {
		var mProperties = {
			replace: true,
			strictMode: true
		};

		this.setUiState(oUiState, mProperties);

		this.fireAfterVariantLoad(sContext, false);

		this._applyVisibility(oUiState.getSelectionVariant());
	};

	FilterBar.prototype._applyVisibility = function(oSelectionVariant) {

		var fSetVisibile = function(oFilterItem) {
			if (oFilterItem && oFilterItem.getVisible() && !oFilterItem.getHiddenFilter()) {
				if (!oFilterItem.getVisibleInFilterBar()) {
					oFilterItem.setVisibleInFilterBar(true);
				}
				if (!oFilterItem.getPartOfCurrentVariant()) {
					oFilterItem.setPartOfCurrentVariant(true);
				}
			}
		};

		if (this._bIsInitialized) {

			for ( var n in this._mAdvancedAreaFilter) {
				if (n) {
					/* eslint-disable no-loop-func */
					this._mAdvancedAreaFilter[n].items.forEach(function(oItem) {
						if (oItem && oItem.filterItem && oItem.filterItem.getMandatory()) {
							fSetVisibile(oItem.filterItem);
						} else if (oItem && oItem.filterItem) {
							if (oItem.filterItem.getVisibleInFilterBar()) {
								oItem.filterItem.setVisibleInFilterBar(false);
							}

							/**
							 * @deprecated As of version 1.87. Will be internally treated as if always set to <code>true<code>
							 * @private
							 */
							(function() {
								if (oItem.filterItem.getPartOfCurrentVariant()) {
									if (n === FilterBar.INTERNAL_GROUP) {
										oItem.filterItem.setPartOfCurrentVariant(true);
									} else {
										oItem.filterItem.setPartOfCurrentVariant(false);
									}
								}
							}());
						}
					});
					/* eslint-enable no-loop-func */
				}
			}

			if (oSelectionVariant && oSelectionVariant.Parameters) {
				oSelectionVariant.Parameters.forEach(function(oEntry) {
					var oFilterItem = this.determineFilterItemByName(oEntry.PropertyName);
					fSetVisibile(oFilterItem);
				}.bind(this));
			}

			if (oSelectionVariant && oSelectionVariant.SelectOptions) {
				oSelectionVariant.SelectOptions.forEach(function(oEntry) {
					var oFilterItem = this.determineFilterItemByName(oEntry.PropertyName);
					fSetVisibile(oFilterItem);
				}.bind(this));
			}
		}
	};

	/**
	 * Retrieves the current UI state of the <code>FilterBar</code> control.<br>
	 * The current UI state represents the data suite format.
	 * @public
	 * @since 1.48
	 * @param {object} mProperties controls the API behavior
	 * @param {boolean} [mProperties.allFilters=false] include empty/invisible fields filter data
	 * @returns {sap.ui.comp.state.UIState} object representing the ui-state. Currently only the SelectionVariant part is considered.
	 */
	FilterBar.prototype.getUiState = function(mProperties) {
		var oUiState, sSelectionVariant, bConsiderAllFilters = false, oData = null, oValueTexts, oSemanticDates;

		if (mProperties) {
			bConsiderAllFilters = (mProperties.allFilters === true);
		}

		sSelectionVariant = this._getDataSuiteFormat(bConsiderAllFilters, "13.0");

		oUiState = new UIState();

		oUiState.selectionVariant = JSON.parse(sSelectionVariant); // compatibility wise

		oUiState.setSelectionVariant(oUiState.selectionVariant);
		var oSelectionVariant = oUiState.getSelectionVariant();

		if (oSelectionVariant) {
			if (this.getModelData && this.getModelData()) {
				oData = this.getModelData();
			}
			oSemanticDates = UIState.calcSemanticDates(oSelectionVariant, oData);
			oUiState.setSemanticDates(oSemanticDates);
			oValueTexts = UIState.calculateValueTexts(oSelectionVariant, oData);
			oUiState.setValueTexts(oValueTexts);
			window.sessionStorage.setItem(this.getId(), JSON.stringify(oValueTexts));
			window.sessionStorage.setItem("semanticDates", JSON.stringify(oSemanticDates));
		}

		return oUiState;
	};

	/**
	 * Sets the current UI state of the <code>FilterBar</code> control.<br>
	 * The current UI state represents the data suite format.
	 * @public
	 * @since 1.48
	 * @param {sap.ui.comp.state.UIState} oUiState object representing the ui-state. Currently only the SelectionVariant part is considered.
	 * @param {object} mProperties controls the API behavior
	 * @param {boolean} mProperties.replace Replaces existing filter data
	 * @param {boolean} mProperties.strictMode Determines filters and parameters based on the name.<BR>
	 *        <ul>
	 *        <li><code>true</code>: Determines filters and parameters based on their exact name and type. If there is no exact match, the
	 *        filter/parameter will be ignored.</li>
	 *        <li><code>false</code>: Determines parameters first following this rule set:
	 *        <ul>
	 *        <li>If a parameter is found, use it.</li>
	 *        <li>If a filter is found, check first if a matching parameter exists with the filter name prefixed with "P_". If there is a match, use
	 *        it as parameter, otherwise use it as filter.</li>
	 *        </ul>
	 *        </ul>
	 */
	FilterBar.prototype.setUiState = function(oUiState, mProperties) {
		var oValueTexts, sSelectionVariant, oSelectionVariant = null, bReplace = false, bStrictMode = true, oSemanticDates;

		if (mProperties && typeof mProperties.replace === "boolean") {
			bReplace = mProperties.replace;
		}

		if (mProperties && typeof mProperties.strictMode === "boolean") {
			bStrictMode = mProperties.strictMode;
		}

		if (oUiState) {
			oSelectionVariant = oUiState.getSelectionVariant();
			if (oSelectionVariant) {
				sSelectionVariant = JSON.stringify(oSelectionVariant);
			}

			oValueTexts = oUiState.getValueTexts();
			oSemanticDates = oUiState.getSemanticDates();
		}

		if (!oValueTexts) {
			oValueTexts = JSON.parse(window.sessionStorage.getItem(this.getId()));
		}

		if (!oSemanticDates) {
			oSemanticDates = JSON.parse(window.sessionStorage.getItem("semanticDates"));
		}

		this._setDataSuiteFormat(sSelectionVariant, bReplace, bStrictMode, oValueTexts, oSemanticDates);
		this._enhanceFilterItemsWithTextValue(oValueTexts, oSelectionVariant);
	};

	/**
	 * Reads the descriptions for given filters and value keys.
	 * @protected
	 * @param {array} aFiltersWithValuesToBeRead List of filters with value keys to be retrieved
	 * @since 1.75
	 */
	FilterBar.prototype.getDescriptionForKeys = function(aFiltersWithValuesToBeRead) {
	};

	FilterBar.prototype._enhanceFilterItemsWithTextValue = function(oValueTexts, oSelectionVariant) {
		var aInfoResulting = UIState.determineFiltersWithOnlyKeyValues(oValueTexts, oSelectionVariant, [
			this.getBasicSearchName()
		]);

		this.getDescriptionForKeys(aInfoResulting);
	};

	/**
	 * Sets the selection variant for UI navigation to FilterBar.
	 * @public
	 * @since 1.28.0
	 * @deprecated As of version 1.48, replaced by {@link sap.ui.comp.filterbar.FilterBar#setUiState}
	 * @param {string} sSuiteData Represents the selection variants for UI navigation
	 * @param {boolean} bReplace Replaces existing filter data
	 */
	FilterBar.prototype.setDataSuiteFormat = function(sSuiteData, bReplace) {

		this._setDataSuiteFormat(sSuiteData, bReplace, true);

	};

	FilterBar.prototype._setDataSuiteFormat = function(sSuiteData, bReplace, bStrictMode, oValueTexts, oSemanticDates) {

		var oConverter, oContent, sPayload;

		if (sSuiteData) {

			oConverter = new VariantConverterFrom();
			oContent = oConverter.convert(sSuiteData, this, bStrictMode);
			if (oContent) {

				this._clearErrorState();

				if (oContent.variantId && this._oVariantManagement) {

					if (this._bIsInitialized) {
						if (this._oVariantManagement.isPageVariant()) {
							this._oVariantManagement._selectVariant(oContent.variantId, "DATA_SUITE");
						} else {
							this._setFilterVisibility(oContent.variantId);
						}
					}

					this._oVariantManagement.setInitialSelectionKey(oContent.variantId);
				}

				if (oContent.payload && (bReplace || (Object.keys(JSON.parse(oContent.payload)).length > 0)) && this.setFilterDataAsString) {

					sPayload = oContent.payload;
					if (oValueTexts) {
						sPayload = UIState.enrichWithValueTexts(sPayload, oValueTexts);
					}
					if (oSemanticDates) {
						sPayload = UIState.enrichWithSemanticDates(sPayload, oSemanticDates);
					}

					this.setFilterDataAsString(sPayload, bReplace);
				}

				if (oContent.basicSearch && this._oBasicSearchField && this._oBasicSearchField.setValue) {
					this._oBasicSearchField.setValue(oContent.basicSearch);

					this.fireAssignedFiltersChanged();
				}

			}
		}

	};

	FilterBar.prototype._setFilterVisibility = function(sVariantId) {

		if (this._oVariantManagement.getSelectionKey() !== sVariantId) {
			this._oVariantManagement.setInitialSelectionKey(sVariantId);

			var oStandardVariant = this._getStandardVariant();
			if (oStandardVariant) {
				var oVariant = this._oVariantManagement.getVariantContent(this, sVariantId);
				if (oVariant && oVariant.filterbar) {
					if (oVariant.hasOwnProperty("version")) {
						oVariant = this.mergeVariant(oStandardVariant, oVariant);
					}

					this._reapplyVisibility(oVariant.filterbar);
				}
			}
		}
	};

	FilterBar.prototype.applySettings = function(mSettings) {
		Control.prototype.applySettings.apply(this, arguments);

		if (this._possibleToChangeVariantManagement()) {
			if (mSettings && mSettings.customData) {
				for (var i = 0; i < mSettings.customData.length; i++) {
					var oCustomData = mSettings.customData[i];
					if (oCustomData && oCustomData.mProperties && oCustomData.mProperties.key === "pageVariantPersistencyKey") {
						this._oVariantManagement.setPersistencyKey(oCustomData.mProperties.value);
						this._oVariantManagement.setVisible(true);
						this._bHostedVariantManagement = true;
					}
				}
			}
		}

		if (mSettings && mSettings.persistencyKey) {
			this._bHostedVariantManagement = true;
		}
	};

	FilterBar.prototype._possibleToChangeVariantManagement = function() {
		return this._oVariantManagement && !this._oVariantManagement.isPageVariant();
	};

	/**
	 * Resets the current selection in the variant management control to standard.
	 * @public
	 */
	FilterBar.prototype.clearVariantSelection = function() {

		if (this._oVariantManagement) {
			this._oVariantManagement.clearVariantSelection();
		}
	};

	/**
	 * Sets the type of the Search to Emphasize.
	 * @private
	 * @param {boolean} bSetEmphasize Sets the type to Emphasize or Default
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.setSearchButtonEmphType = function(bSetEmphasize) {

	};

	/**
	 * Sets the simplified mode.
	 * @param {boolean} bFlag Sets the simplified mode
	 * @private
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.setSimplifiedMode = function(bFlag) {

		// the simplified mode is with beginning of 1.25 always implicitly used.
		// The former setter-method method stays in place, so that the former usages do not have to be adapted.
	};

	/**
	 * Retrieves the simplified mode.
	 * @returns {boolean} Indicates if the current advanced mode is set
	 * @private
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.getSimplifiedMode = function() {
		return !this.getAdvancedMode();
	};

	/**
	 * Sets the advanced area to collapsed or expanded mode.
	 * @private
	 * @param {boolean} bFlag Sets the advanced area to expanded/collapsed
	 * @returns {sap.ui.comp.filterbar.FilterBar} an instance to itself
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.setExpandAdvancedArea = function(bFlag) {
		return this.setFilterBarExpanded(bFlag);
	};

	/**
	 * Determines if the advanced area is displayed collapsed or expanded.
	 * @private
	 * @returns {boolean} The state of the advanced area
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.getExpandAdvancedArea = function() {
		return this.getFilterBarExpanded();
	};

	FilterBar.prototype._isNewFilterBarDesign = function() {
		if (this.getAdvancedMode() /* || this._isPhone() */) {
			return false;
		}

		if (!this.getUseToolbar()) {
			return true;
		}

		return false;

	};

	FilterBar.prototype._setCollectiveSearch = function(oCollectiveSearch) {
		const oToolbar = this.getAggregation("_toolbar");
		if (!oToolbar || !this.getAdvancedMode()) {
			return;
		}

		if (this._oVariantManagement) {
			oToolbar.removeContent(this._oVariantManagement);
			this._unregisterVariantManagement(this._oVariantManagement);
			this._oVariantManagement = null;
		}

		if (this._oCollectiveSearch) {
			oToolbar.removeContent(this._oCollectiveSearch);
		}
		this._oCollectiveSearch = oCollectiveSearch;
		// Collective Search should be right after the Header
		if (this._oCollectiveSearch) {
			oToolbar.insertContent(this._oCollectiveSearch, oToolbar.indexOfContent(this.getAggregation("_headerTitle")) + 1);
		}
	};

	FilterBar.prototype.setBasicSearch = function(oBasicSearchField) {
		const oToolbar = this.getAggregation("_toolbar");

		this.setAssociation("basicSearch", oBasicSearchField, true);
		if (typeof oBasicSearchField === "string") {
			oBasicSearchField = Element.getElementById(oBasicSearchField);
		}

		if (oBasicSearchField && !oBasicSearchField.getParent()) {
			// Basic Search should be right before the separator
			oToolbar.insertContent(oBasicSearchField, oToolbar.indexOfContent(this._oSeparator));
		}

		this._oBasicSearchField = oBasicSearchField;

		if (oBasicSearchField && oBasicSearchField.getParent()) {
			if (this._isUi2Mode()) {
				oBasicSearchField.attachLiveChange((oEvent) => {
					this.fireFilterChange(oEvent);
				});
			}

			return;
		}

		this.setAggregation("_basicSearch", oBasicSearchField);

		if (oBasicSearchField) {
			const fnOriginalSetParent = oBasicSearchField.setParent;
			const that = this;

			oBasicSearchField.setParent = function () {
				fnOriginalSetParent.apply(this, arguments);

				if (oBasicSearchField.getParent() !== that || (oBasicSearchField.getParent() === that && oBasicSearchField.sParentAggregationName === "content")) {
					oToolbar.removeContent(oBasicSearchField);
				}
			};
		}

		return this;
	};

	FilterBar.prototype._getBasicSearchValue = function() {
		if (this._oBasicSearchField && this._oBasicSearchField.getValue) {
			return this._oBasicSearchField.getValue();
		}

		return null;
	};

	/*
	 * @public Add a FilterItem to the <code>filterItems</code> aggregation.
	 * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
	 */
	FilterBar.prototype.addFilterItem = function(oFilterItem) {

		var sName, oControl, oFilterGroupItem, sFilterGroupItemId;

		if (!oFilterItem) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterItem()" + " Expected argument 'oFilterItem' may not be null nor empty");
		}

		sName = oFilterItem.getName();
		if (!sName) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterItem()" + " Expected argument 'oFilterItem.name' may not be null nor empty");
		}

		oControl = oFilterItem._getControl();
		if (!oControl) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterItem()" + " Expected argument 'oFilterItem.control' may not be null nor empty");
		}

		this.addAggregation("filterItems", oFilterItem, true);

		// has to be initialized before the call to the container creation
		if (!this._aBasicAreaSelection) {
			this._aBasicAreaSelection = [];
		}

		var oObj = {
			control: oFilterItem._getControl(),
			filterItem: oFilterItem
		};
		this._aBasicAreaSelection.push(oObj);

		// Since removeFilterItem method is not supposed to destroy the filterGroupItem or the control,
		// check if there is already created filterGroupItem and use it, otherwise create new filterGroupItem
		sFilterGroupItemId = oFilterItem.getId() + "__filterGroupItem";
		oFilterGroupItem = Element.getElementById(sFilterGroupItemId);

		if (!oFilterGroupItem) {
			oFilterGroupItem = new FilterGroupItem(oFilterItem.getId() + "__filterGroupItem", {
				label: oFilterItem.getLabel(),
				controlTooltip: oFilterItem.getControlTooltip(),
				name: oFilterItem.getName(),
				mandatory: oFilterItem.getMandatory(),
				visible: oFilterItem.getVisible(),
				visibleInFilterBar: oFilterItem.getVisibleInFilterBar(),
				partOfCurrentVariant: true,
				control: oFilterItem._getControl(),
				groupName: FilterBar.INTERNAL_GROUP,
				groupTitle: "",
				hiddenFilter: oFilterItem.getHiddenFilter(),
				entitySetName: oFilterItem.getEntitySetName(),
				entityTypeName: oFilterItem.getEntityTypeName()
			});
		}

		if (oFilterItem.data('isCustomField')) {
			oFilterGroupItem.data('isCustomField', true);
		}

		oFilterItem.attachChange(this._filterItemChange);

		this.addFilterGroupItem(oFilterGroupItem);

		return this;
	};

	FilterBar.prototype.addFilterGroupItem = function(oFilterGroupItem) {

		var sName, sGroupName, oObj;
		if (!oFilterGroupItem) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterGroupItem()" + " Expected argument 'oFilterGroupItem' may not be null nor empty");
		}

		this.addAggregation("filterGroupItems", oFilterGroupItem);

		sGroupName = oFilterGroupItem.getGroupName();
		if (!sGroupName) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterGroupItems()" + " GroupName may not be null nor empty");
		}

		sName = oFilterGroupItem.getName();
		if (!sName) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterGroupItems()" + " Name may not be null nor empty");
		}

		if (!this._mAdvancedAreaFilter) {
			this._mAdvancedAreaFilter = {};
		}
		if (!this._mAdvancedAreaFilter[sGroupName]) {
			this._mAdvancedAreaFilter[sGroupName] = {};
			this._mAdvancedAreaFilter[sGroupName].filterItem = null;
			this._mAdvancedAreaFilter[sGroupName].items = [];
		}

		if (!this._mAdvancedAreaFilter[sGroupName].items) {
			this._mAdvancedAreaFilter[sGroupName].items = [];
		}

		if (!this._mAdvancedAreaFilter[sGroupName].filterItem) {
			this._mAdvancedAreaFilter[sGroupName].filterItem = oFilterGroupItem;
		}

		oObj = {
			control: oFilterGroupItem._getControl(),
			filterItem: oFilterGroupItem
		};

		if (this.getAdvancedMode() || oFilterGroupItem.getVisibleInFilterBar()) {
			oFilterGroupItem.setVisibleInFilterBar(true);
		} else {
			oFilterGroupItem.setVisibleInFilterBar(false);
		}

		this._mAdvancedAreaFilter[sGroupName].items.push(oObj);

		if (!oFilterGroupItem.getHiddenFilter()) {

			this._prepareFilterItemAndLabel(oFilterGroupItem);

			if (oFilterGroupItem.getVisibleInFilterBar()) {
				oFilterGroupItem.setPartOfCurrentVariant(oFilterGroupItem.getVisibleInFilterBar());
			}
			oFilterGroupItem.attachChange(this._filterGroupItemChange);
		}

		this._mAdvancedAreaFilterFlat = [];

		return this;
	};

	FilterBar.prototype.removeFilterItem = function(vObject) {
		var i, oItem, sFilterGroupItemId, oGroupItem,
			aAllFilterItems = this.getFilterItems(),
			aAllFilterGroupItems = this.getFilterGroupItems();

		if (!aAllFilterItems || !aAllFilterItems.length) {
			return null;
		}

		oItem =	this._getRemovedItemAsObject(vObject, aAllFilterItems);
		if (!oItem) {
			return null;
		}

		oItem.detachChange(this._filterItemChange);

		for (i = 0; i < this._aBasicAreaSelection.length; i++) {
			if (this._aBasicAreaSelection[i].filterItem.getId() === oItem.getId()) {
				this._aBasicAreaSelection.splice(i, 1);
				if (this._aBasicAreaSelection.length === 0) {
					this._aBasicAreaSelection = null;
				}
				break;
			}
		}

		this.removeAggregation("filterItems", oItem, true);

		sFilterGroupItemId = oItem.getId() + "__filterGroupItem";
		oGroupItem = this._getRemovedItemAsObject(sFilterGroupItemId, aAllFilterGroupItems);
		this._removeFilterGroupItem(oGroupItem);

		return oItem;
	};

	FilterBar.prototype.removeFilterGroupItem = function(vObject) {

		var oItem,
			aAllFilterGroupItems = this.getFilterGroupItems();

		if (!aAllFilterGroupItems || !aAllFilterGroupItems.length) {
			return null;
		}

		oItem = this._getRemovedItemAsObject(vObject, aAllFilterGroupItems);
		if (!oItem) {
			return null;
		}

		return this._removeFilterGroupItem(oItem);
	};

	FilterBar.prototype._getRemovedItemAsObject = function(vObject, aAllItems) {

		var i, oItem;

		if (typeof vObject === "string") {
			for (i = 0; i < aAllItems.length; i++) {
				if (aAllItems[i].getId() === vObject) {
					oItem = aAllItems[i];
					break;
				}
			}
		}
		if (typeof vObject === "number") {
			if (vObject < 0 || vObject >= aAllItems.length) {
				Log.warning("sap.ui.comp.filterbar.FilterBar.prototype.removeFilterGroupItems() is called with invalid index " +  vObject);
			} else {
				oItem = aAllItems[vObject];
			}
		}
		if (typeof vObject === "object") {
			oItem = vObject;
		}

		return oItem;
	};

	FilterBar.prototype._removeFilterGroupItem = function(oItem) {

		var i, oAdvancedAreaFilterGroup, oAdvancedItem,
		sGroupName = oItem.getGroupName();

		oItem.detachChange(this._filterGroupItemChange);
		this.removeAggregation("filterGroupItems", oItem, true);

		if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			oAdvancedAreaFilterGroup = this._mAdvancedAreaFilter[sGroupName];

			for (i = 0; i < oAdvancedAreaFilterGroup.items.length; i++) {
				oAdvancedItem = oAdvancedAreaFilterGroup.items[i];
				if (oAdvancedItem.filterItem.getId() === oItem.getId()) {
					oAdvancedAreaFilterGroup.items.splice(i, 1);

					if (oAdvancedAreaFilterGroup.filterItem.getId() === oItem.getId()) {
						if (oAdvancedAreaFilterGroup.items.length) {

							// If the default item is removed, make the first filterItem of the group default
							oAdvancedAreaFilterGroup.filterItem = oAdvancedAreaFilterGroup.items[0].filterItem;
						} else {

							// If there are no items left in the group, remove the group
							delete this._mAdvancedAreaFilter[sGroupName];
						}
					}
					break;
				}
			}
			if (this.getFilterGroupItems().length === 0) {
				this._mAdvancedAreaFilter = null;
			}
		}

		return oItem;
	};

	/**
	 * Adds a <code>FilterGroupItem</code> element to the aggregation <code>_parameters</code>.
	 * @protected
	 * @param {sap.ui.comp.filterbar.FilterGroupItem} oParameter adding a analytical parameter
	 * @returns {this} Reference to this in order to allow method chaining
	 */
	FilterBar.prototype._addParameter = function(oParameter) {
		var i, oObj, bInserted = false, sGroupName = FilterBar.INTERNAL_GROUP;

		oParameter._setParameter(true);
		oParameter.setVisibleInFilterBar(true);
		oParameter.setPartOfCurrentVariant && oParameter.setPartOfCurrentVariant(true);

		this.addAggregation("_parameters", oParameter, true);

		oObj = {
			control: oParameter._getControl(),
			filterItem: oParameter
		};

		if (!this._mAdvancedAreaFilter) {
			this._mAdvancedAreaFilter = {};
		}
		if (!this._mAdvancedAreaFilter[sGroupName]) {
			this._mAdvancedAreaFilter[sGroupName] = {};
			this._mAdvancedAreaFilter[sGroupName].filterItem = null;
		}

		if (!this._mAdvancedAreaFilter[sGroupName].items) {
			this._mAdvancedAreaFilter[sGroupName].items = [];
		}

		for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
			var oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
			if (oItem.filterItem._isParameter()) {
				continue;
			}
			this._mAdvancedAreaFilter[sGroupName].items.splice(i, 0, oObj);
			bInserted = true;
			break;
		}

		if (!bInserted) {
			this._mAdvancedAreaFilter[sGroupName].items.push(oObj);
		}

		this._prepareFilterItemAndLabel(oParameter);
		oParameter.attachChange(this._filterGroupItemChange.bind(this));

		return this;

	};

	/**
	 * Event-handler is called when the property of a filter item has changed.
	 * @private
	 * @param {object} oContainer the container of the filter item's control and label
	 * @param {object} oEvent the event
	 */
	FilterBar.prototype._filterItemChange = function(oContainer, oEvent) {

		var oItem, bFlag, sPropertyName, oControl;

		if (oEvent && oEvent.oSource && (oEvent.oSource.isA("sap.ui.comp.filterbar.FilterItem"))) {

			sPropertyName = oEvent.getParameter("propertyName");

			if (sPropertyName === "visibleInFilterBar" || sPropertyName === "visible" || sPropertyName === "label" || sPropertyName === "labelTooltip" || sPropertyName === "controlTooltip" || sPropertyName === "mandatory") {
				oItem = this._determineItemByName(oEvent.oSource.getName(), FilterBar.INTERNAL_GROUP);

				if (oItem && oItem.filterItem) {
					if ((sPropertyName === "visible")) {
						bFlag = oEvent.oSource.getVisible();
						oItem.filterItem.setVisible(bFlag);
					} else if (sPropertyName === "visibleInFilterBar") {
						bFlag = oEvent.oSource.getVisibleInFilterBar();
						var bChangePossible = this._checkChangePossibleVisibleInFilterBar(oItem.filterItem, bFlag);
						if (bChangePossible) {
							oItem.filterItem.setVisibleInFilterBar(bFlag);
						} else {
							oEvent.oSource.setVisibleInFilterBar(true);
						}

					} else if (sPropertyName === "label") {
						oItem.filterItem.setLabel(oEvent.oSource.getLabel());
					} else if (sPropertyName === "labelTooltip") {
						oItem.filterItem.setLabelTooltip(oEvent.oSource.getLabelTooltip());
					} else if (sPropertyName === "controlTooltip") {
						oControl = this.determineControlByFilterItem(oItem.filterItem, true);
						if (oControl && oControl.setTooltip) {
							oControl.setTooltip(oItem.filterItem.getControlTooltip());
						}
					} else if (sPropertyName === "mandatory") {
						bFlag = oEvent.oSource.getMandatory();
						oItem.filterItem.setMandatory(bFlag);
					}
				}
			}
		}
	};

	/**
	 * Event handler called when the property of a filter group item has changed.
	 * @private
	 * @param {object} oEvent the event
	 */
	FilterBar.prototype._filterGroupItemChange = function(oEvent) {

		var oItem;
		var sPropertyName;

		if (oEvent && oEvent.oSource) {
			sPropertyName = oEvent.getParameter("propertyName");

			if (sPropertyName === "visibleInFilterBar" || sPropertyName === "visible") {

				oItem = this._determineItemByName(oEvent.oSource.getName(), oEvent.oSource.getGroupName());
				if (oItem) {
					if (sPropertyName === "visibleInFilterBar") {
						var bVisibleInFilterBar = oEvent.oSource.getVisibleInFilterBar();
						var bFlag = bVisibleInFilterBar;

						var bChangePossible = this._checkChangePossibleVisibleInFilterBar(oEvent.oSource, bVisibleInFilterBar);
						if (!bChangePossible) {
							oEvent.oSource.setVisibleInFilterBar(true);
							bFlag = true;
						}

						if (bFlag) {
							oEvent.oSource.setPartOfCurrentVariant(true);
						}

						if (!bVisibleInFilterBar && !this._isFilterItemInBasicGroup(oItem.filterItem)) {
							oEvent.oSource.setPartOfCurrentVariant(false);
						}
					} else if (sPropertyName === "visible") {

						if (!this._oAdaptFiltersDialog) {
							if (!this.getAdvancedMode()) {
								this.fireAssignedFiltersChanged();
							}
						}
					}
				}
			} else if (sPropertyName === "groupTitle") {
				if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[oEvent.oSource.getGroupName()]) {
					this._adaptGroupTitle(oEvent.oSource.getGroupName());
				}
			} else if (sPropertyName === "label") {
				if (!this._oAdaptFiltersDialog) { // do not adapt in case the advanced filters dialog is active
					this._adaptGroupTitleForFilter(oEvent.oSource);
				}
			} else if (sPropertyName === "mandatory") {
				this._mandatoryFilterItemChange(oEvent.oSource);
			} else if ((sPropertyName === "partOfCurrentVariant") && this.ensureLoadedValueHelpList) {
				var oFilterItem = this.determineFilterItemByName(oEvent.oSource.getName());
				if (oFilterItem && oFilterItem.getPartOfCurrentVariant && oFilterItem.getPartOfCurrentVariant()) {
					this.ensureLoadedValueHelpList(oEvent.oSource.getName());
				}
			}
		}
	};

	/**
	 * VisibleInFilterBar-property may not be changed to false, when the filter is mandatory and has no value
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem in question
	 * @param {boolean} bFlag - represents the value of visibleInFilterBar
	 * @returns {boolean} allowed or not allowed change
	 */
	FilterBar.prototype._checkChangePossibleVisibleInFilterBar = function(oFilterItem, bFlag) {

		if (oFilterItem && oFilterItem.getMandatory() && !bFlag) {
			var bHasValue = this._hasFilterValue(oFilterItem);
			if (!bHasValue) {
				oFilterItem.setVisibleInFilterBar(true);
				return false;
			}
		}

		return true;
	};


	/**
	 * Checks if a filter has a value.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem the filter
	 * @returns {boolean} returns if the filter has a value or not
	 */
	FilterBar.prototype._hasFilterValue = function(oFilterItem) {

		var aFilters;

		if (!this._getTriggerFilterChangeState() && this.getAllFiltersWithValues) {
			// BCP: 1870505654
			// during variant appliance and in SmartFilterBar scenario; check for mandatory non-visible filter value
			aFilters = this.getAllFiltersWithValues();
		} else {
			aFilters = this._getFiltersWithValues();
		}

		return this._checkFilterForValue(aFilters, oFilterItem);
	};


	/**
	 * In case considerGroupTitle is set then all labels of filters of a specific group will post-fixed with the group title.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterGroupItem} oFilterItem the filter
	 */
	FilterBar.prototype._adaptGroupTitleForFilter = function(oFilterItem) {

		var sLabel;
		var oLabel;

		if (oFilterItem && !oFilterItem.getHiddenFilter()) {
			sLabel = oFilterItem.getLabel();
			oLabel = oFilterItem.getLabelControl(this.getId());
			if (this.getConsiderGroupTitle()) {
				if (oLabel && oFilterItem.getGroupTitle()) {
					oLabel.setText(sLabel + " (" + oFilterItem.getGroupTitle() + ')');
				}
			} else {
				oLabel.setText(sLabel);
			}
		}
	};

	/**
	 * In case considerGroupTitle is set then all labels of filters of a specific group will post-fixed with the group title.
	 * @private
	 * @param {string} sGroupName filter group name
	 */
	FilterBar.prototype._adaptGroupTitle = function(sGroupName) {

		var i;
		var oItem;

		if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
				oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
				if (oItem && oItem) {
					this._adaptGroupTitleForFilter(oItem.filterItem);
				}
			}
		}
	};

	/**
	 * Registration of a callback function. The provided callback function is executed to obtain the filters with values.
	 * @public
	 * @since 1.26.1
	 * @param {sap.ui.comp.filterbar.FilterBar.fGetFiltersWithValuesCallBack} fCallBack Called when a variant must be applied
	 * @returns {this} Reference to this in order to allow method chaining.
	 */
	FilterBar.prototype.registerGetFiltersWithValues = function(fCallBack) {

		this._fRegisterGetFiltersWithValues = fCallBack;

		return this;
	};

	/**
	 * Registration of a callback function. The provided callback function is executed when saving a variant is triggered and must provide all
	 * relevant fields and values in JSON.
	 * @public
	 * @param {function(string)} fCallBack Called when a variant must be fetched
	 * @returns {this} Returns <code>this</code> to allow method chaining.
	 */
	FilterBar.prototype.registerFetchData = function(fCallBack) {

		this._fRegisteredFetchData = fCallBack;

		return this;
	};

	/**
	 * Registration of a callback function. The provided callback function is executed when a variant must be applied. The callback function will
	 * receive the corresponding data set containing all relevant data in JSON, as initially provided by the callback for fetchData.
	 * @public
	 * @param {function(string, string)} fCallBack Called when a variant must be applied
	 * @returns {this} Returns <code>this</code> to allow method chaining.
	 */
	FilterBar.prototype.registerApplyData = function(fCallBack) {

		this._fRegisteredApplyData = fCallBack;

		return this;
	};

	FilterBar.prototype._isTINAFScenario = function() {

		if (this._oVariantManagement) {

			if (!this._isUi2Mode()) {
				return true;
			}
		} else {

			/* eslint-disable no-lonely-if */
			// scenario: VH dialog: VM replaced with collective search control
			if (this._oCollectiveSearch && this.getAdvancedMode()) {
				return true;
			}
			/* eslint-enable no-lonely-if */
		}

		return false;
	};

	FilterBar.prototype.fireInitialise = function() {
		if (this._isTINAFScenario()) {
			this._createVisibleFilters();
			if (this.getAdvancedMode()) {
				this._ensureFilterLoaded(null);
			}
			this._fireInitialiseEvent();
		} else {
			this._initializeVariantManagement();
		}
	};

	/**
	 * This method will be called by the SmartVariantMangement and indicates, that the standard variant was obtained. It indicates, that the variant
	 * management is fully initialized.
	 * @protected
	 */
	FilterBar.prototype.variantsInitialized = function() {
		this.fireInitialized();
		this._oInitializedDeferred.resolve();
	};

	FilterBar.prototype.fireInitialized = function() {
		this.fireEvent("initialized");
		this._mAdvancedAreaFilterFlat = this._getAllFilterItemsFlat();
		this._oInitializedDeferred.resolve();
	};

	/**
	 * Returns promise which will be resolve when the initialized event is fired.
	 * @returns {Promise<undefined>}
	 * @public
	 */
	FilterBar.prototype.getInitializedPromise = function () {
		return this._oInitializedDeferred.promise;
	};

	/**
	 * Initializes the variant management, when the prerequisites are fulfilled. In this case the "initialise" event will be triggered only after the
	 * variant management's initialization. Triggers the "initialise" event immediately in case the prerequisites are not fulfilled.
	 * @private
	 */
	FilterBar.prototype._initializeVariantManagement = function() {
		this._createVisibleFilters();
		// initialise SmartVariant stuff only if it is necessary! (Ex: has a persistencyKey)
		if (this._oVariantManagement && this.getPersistencyKey()) {

			if (this._isTINAFScenario()) {
				this._oVariantManagement.initialise(this._initialiseVariants, this);
			} else {
				// Ui2 handling
				this._fInitialiseVariants = this._initialiseVariants.bind(this);
				this._oVariantManagement.attachInitialise(this._fInitialiseVariants, this);
				this._oVariantManagement.initialise();
			}

		} else {
			this._fireInitialiseEvent();
		}
	};

	FilterBar.prototype._fireInitialiseEvent = function() {

		try {
			this.fireEvent("initialise");
		} catch (ex) {
			Log.error("error during initialise event handling - " + ex.message);
		}

		this._bIsInitialized = true;

		this.fireAssignedFiltersChanged();
	};

	/**
	 * Is triggered, whenever the flex layer is initialized.
	 * @private
	 */
	FilterBar.prototype._initialiseVariants = function() {

		this._fireInitialiseEvent();
		if (this._oVariantManagement) { // mark any changes as irrelevant
			this._oVariantManagement.currentVariantSetModified(false);
		}
	};

	/**
	 * Informs the consumer of the FilterBar that a new variant was applied.
	 * @private
	 * @param {string} sContext may be undefined, has the values 'RESET'/'CANCEL/'DATA_SUITE'/'SET_VM_ID'/'INIT' and indicates the initial trigger
	 *        source
	 * @param {boolean} bExecuteOnSelect indicates if a follow-on search will be triggered automatically
	 */
	FilterBar.prototype.fireAfterVariantLoad = function(sContext, bExecuteOnSelect) {
		this._aAdaptFilterItems = []; // cleanup
		this._oSelectedVariantBase = null;

		var oEvent = {
			context: sContext,
			executeOnSelect: bExecuteOnSelect
		};

		try {
			this.fireEvent("afterVariantLoad", oEvent);
		} catch (ex) {
			Log.error("error during 'afterVariantLoad' event handling - " + ex.message);
		}
	};

	/**
	 * Informs the consumer of the FilterBar, that a variant is about to be saved.
	 * @private
	 * @param {string} sContext may be undefined, have the value <code>STANDARD</code> and indicates the initial trigger source
	 */
	FilterBar.prototype.fireBeforeVariantSave = function(sContext) {

		var oEvent = {
			context: sContext
		};

		var bFlag = this._getConsiderFilterChanges();

		if (sContext) {
			this._setConsiderFilterChanges(false);
		}

		this.fireEvent("beforeVariantSave", oEvent);

		if (sContext) {
			this._setConsiderFilterChanges(bFlag);
		}
	};

	FilterBar.prototype.destroyFilterGroupItems = function() {

		var aFilterGroupItems = this.getFilterGroupItems();
		this._destroyItems(aFilterGroupItems);

		return this;
	};

	FilterBar.prototype.destroyFilterItems = function() {

		var aFilterItems = this.getFilterItems();
		this._destroyItems(aFilterItems);

		return this;
	};

	/**
	 * Removes all entries in the aggregation filterItems.
	 * @public
	 * @returns {sap.ui.comp.filterbar.FilterItem[]} An array of the removed elements (might be empty).
	 * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
	 */
	FilterBar.prototype.removeAllFilterItems = function() {

		var i, aFilters = this.getFilterItems();

		if (aFilters && aFilters.length) {
			for (i = 0; i < aFilters.length; i++) {
				this.removeFilterItem(aFilters[i]);
			}
		}

		return aFilters;
	};

	/**
	 * Removes all entries in the aggregation filterGroupItems.
	 * @public
	 * @returns {sap.ui.comp.filterbar.FilterGroupItem[]} An array of the removed elements (might be empty).
	 */
	FilterBar.prototype.removeAllFilterGroupItems = function() {

		var  i, aFilterGroupItems = [], aFilters = this.getFilterGroupItems();

		if (aFilters && aFilters.length) {
			for (i = 0; i < aFilters.length; i++) {
				aFilterGroupItems.push(aFilters[i]);
				this.removeFilterGroupItem(aFilters[i]);
			}
		}

		return aFilterGroupItems;
	};

	/**
	 * Removes all entries in the aggregations filterItems, filterGroupItems, basicSearch
	 * @public
	 */
	FilterBar.prototype.removeAllFilters = function() {
		this.removeAllFilterItems && this.removeAllFilterItems();
		this.removeAllFilterGroupItems();
		this.removeBasicSearch();
	};

	FilterBar.prototype.removeBasicSearch = function() {
		this.setBasicSearch(null);
	};

	/**
	 * Retrieves filters belonging to the current variant.
	 * @public
	 * @param {boolean} bConsiderOnlyVisibleFields Indicates that only visible filters are retrieved. <b>Note:</b> hidden filters are treated as
	 *        visible filters.
	 * @returns {array} filters Of the current variant
	 */
	FilterBar.prototype.getAllFilterItems = function(bConsiderOnlyVisibleFields) {

		var i, n = null;
		var aFilters = [];
		var oElement, oItem;

		if (!bConsiderOnlyVisibleFields) {
			this._ensureFilterLoaded(null);
		}

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					oElement = this._mAdvancedAreaFilter[n];
					if (oElement.items) {
						for (i = 0; i < oElement.items.length; i++) {
							oItem = oElement.items[i];
							if (oItem && oItem.filterItem && oItem.filterItem.getVisible()) {
								if (bConsiderOnlyVisibleFields) {
									if (oItem.filterItem.getVisibleInFilterBar() || this._checkIfFilterHasValue(oItem.filterItem.getName()) || (oItem.filterItem.data("isCustomField") && this._checkIfCustomControlFilterHasValue(oItem))/* || oItem.filterItem.getPartOfCurrentVariant()*/) {
										aFilters.push(oItem.filterItem);
									}
								} else {
									aFilters.push(oItem.filterItem);
								}
							}
						}
					}
				}
			}
		}

		return aFilters;
	};

	/**
	 * @param sFilterName filter name to be checked
	 * @returns {boolean}
	 * @private
	 */
	FilterBar.prototype._checkIfFilterHasValue = function (sFilterName) {
		return false;
	};

	/**
	 * @param oFilterItem filter item to be checked
	 * @returns {boolean}
	 * @private
	 */
	FilterBar.prototype._checkIfCustomControlFilterHasValue = function (oFilterItem) {
		return false;
	};

	/**
	 * Clears an eventual error state on all filter.
	 * @private
	 */
	FilterBar.prototype._clearErrorState = function() {

		this._resetFiltersInErrorValueState();
	};

	FilterBar.prototype.getAggregation = function(sName) {

		if (sName == "filterGroupItems" && !this.__bDeleteMode) {
			this._ensureFilterLoaded(null);
		}

		return Control.prototype.getAggregation.apply(this, arguments);
	};

	/**
	 * Provides filter information for lazy instantiation. Is overwritten by the SmartFilterBar.
	 * @private
	 * @returns {array} of filter information
	 */
	FilterBar.prototype._getFilterInformation = function() {
		return [];
	};

	/**
	 * Indicates whether the context is FilterBar. Overwritten by the SmartFilterBar.
	 *
	 * @private
	 * @returns {boolean} <code>true</code> if the instance is FilterBar or <code>false</code> otherwise
	 */
	FilterBar.prototype._isFilterBarContext = function() {
		return true;
	};

	FilterBar.prototype._createVisibleFilters = function() {

		this._getFilters();
	};

	FilterBar.prototype._getFilters = function() {
		var aFiltersWithValues = [],
			oFiltersData = this._oFilterProvider && this._oFilterProvider.getModel() && this._oFilterProvider.getModel().getData();

		if (oFiltersData) {
			aFiltersWithValues = Object.keys(oFiltersData).filter(function(sFilterName) {
				return this._checkIfFilterHasValue(sFilterName);
			}.bind(this));
		}

		this._aFields = this._getFilterInformation();
		var i, oField;

		if (this._aFields && this._aFields.length > 0) {
			if (!this._mAdvancedAreaFilter) {
				this._mAdvancedAreaFilter = {};

				if (!this.getAdvancedMode()) {
					this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP] = {};
					this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].filterItem = null;
					this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items = null;
				}
			}

			for (i = 0; i < this._aFields.length; i++) {
				oField = this._aFields[i];

				if (oField.groupName !== FilterBar.INTERNAL_GROUP) {
					if (!this._mAdvancedAreaFilter[oField.groupName]) {
						this._mAdvancedAreaFilter[oField.groupName] = {};
						this._mAdvancedAreaFilter[oField.groupName].groupTitle = oField.groupTitle;
						this._mAdvancedAreaFilter[oField.groupName].filterItem = null;
						this._mAdvancedAreaFilter[oField.groupName].items = [];
					}
				}
				if (oField.visibleInAdvancedArea || (oField.groupName === FilterBar.INTERNAL_GROUP) || aFiltersWithValues.includes(oField.name)) {

					this._instanciateFilterItem(oField);
				}
			}
		}
	};

	/**
	 * Determines if an filter is visible on he filterbar. This API is only relevant for the Smart Templates scenario any may not be used in any other
	 * cases.
	 * @private
	 * @param {string} sName of a filter.
	 * @returns {boolean} determines if a specific filter is visible in the filterbar.
	 */
	FilterBar.prototype.isVisibleInFilterBarByName = function(sName) {
		var oFilterItem, oField = this._getFilterMetadata(sName);
		if (oField && oField.factory) {
			if ((oField.hasOwnProperty("visibleInAdvancedArea") && oField.visibleInAdvancedArea) || (oField.groupName === FilterBar.INTERNAL_GROUP)) {
				return true;
			}
		} else {
			oFilterItem = this.determineFilterItemByName(sName);
			if (oFilterItem) {
				return oFilterItem.getVisibleInFilterBar();
			}
		}

		return false;
	};

	FilterBar.prototype._getFilterMetadata = function(sName) {
		if (this._aFields) {
			for (var i = 0; i < this._aFields.length; i++) {
				if (this._aFields[i].fieldName === sName) {
					return this._aFields[i];
				}
			}
		}

		return null;
	};

	/**
	 * Determines an array of filter names, which are custom filters and non visible on the FilterBar. This API is only relevant for the Smart
	 * Templates scenario any may not be used in any other cases.
	 * @private
	 * @returns {array} of filter names.
	 */
	FilterBar.prototype.getNonVisibleCustomFilterNames = function() {

		if (this._aFields.length > 0) {
			return this._getLazyNonVisibleCustomFilterNames();
		} else {
			return this._getNonVisibleCustomFilterNames();
		}

	};

	FilterBar.prototype._getLazyNonVisibleCustomFilterNames = function() {
		var that = this, aArray = [];

		this._aFields.forEach(function(oField) {

			if (oField.factory) {
				if (oField.isCustomFilterField && !oField.visibleInAdvancedArea) {
					aArray.push(oField.fieldName);
				}
			} else if (that._isNonVisibleCustomFilterNamesByName(oField.fieldName, oField.groupName)) {
				aArray.push(oField.fieldName);
			}

		});

		return aArray;
	};

	FilterBar.prototype._isNonVisibleCustomFilterNamesByName = function(sName, sGroupName) {
		var i, oItem;
		if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
				oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
				if (oItem.filterName && (oItem.filterItem.getName() === sName)) {
					return this._isNonVisibleCustomFilterNamesByFilter(oItem.filterItem);
				}
			}
		}

		return false;
	};

	FilterBar.prototype._isNonVisibleCustomFilterNamesByFilter = function(oFilterItem) {
		if (oFilterItem.data("isCustomField") && !oFilterItem.getVisibleInFilterBar()) {
			return true;
		}

		return false;
	};

	FilterBar.prototype._getNonVisibleCustomFilterNames = function() {
		var that = this, aArray = [], aFilterItems = this.getAllFilterItems();

		if (aFilterItems) {
			aFilterItems.forEach(function(oFilterItem) {
				if (that._isNonVisibleCustomFilterNamesByFilter(oFilterItem)) {
					aArray.push(oFilterItem.getName());
				}
			});
		}

		return aArray;
	};

	FilterBar.prototype._ensureFilterLoaded = function(aFilterNames) {
		var i, j, oField;

		if (this._aFields && this._aFields.length > 0) {

			for (j = 0; j < this._aFields.length; j++) {
				oField = this._aFields[j];

				if (!oField.factory) {
					continue;
				}

				if (aFilterNames) {
					for (i = 0; i < aFilterNames.length; i++) {
						if (oField.fieldName === aFilterNames[i].name) {
							if (oField.groupName === aFilterNames[i].group) {
								this._instanciateFilterItem(oField);
								break;
							} else if (oField.groupEntityType === aFilterNames[i].group) {
								this._instanciateFilterItem(oField);
							}
						}
					}
				} else {
					this._instanciateFilterItem(oField);
				}
			}

			if (!aFilterNames) {
				this._aFields = [];
			}
			this._mAdvancedAreaFilterFlat = this._getAllFilterItemsFlat();
		}
	};

	FilterBar.prototype._instanciateFilterItem = function(oField) {

		var factory = oField.factory;
		if (factory) {
			// first remove factory to avoid endless recursion, then call it
			delete oField.factory;
			factory.call(oField);
		}

	};

	/**
	 * Destroys the passed filters.
	 * @private
	 * @param {array} aFilterItems aggregation items
	 */
	FilterBar.prototype._destroyItems = function(aFilterItems) {

		if (aFilterItems && aFilterItems.length) {
			for (var i = 0; i < aFilterItems.length; i++) {
				aFilterItems[i].destroy();
			}
		}
	};

	/**
	 * Handles the visibility of the filters, during the variant appliance, according to the persisted information.
	 * @private
	 * @param {array} aPersData information about the filter fields
	 * @param {boolean} bCancelMode Flag indicating cancel mode
	 */
	FilterBar.prototype._reapplyVisibility = function(aPersData, bCancelMode) {

		var i, n = null;
		var oItem;
		var aFiltersNotPartOfCurrentVariant = [];

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					var oGroup = this._mAdvancedAreaFilter[n];
					if (oGroup && oGroup.items) {
						for (i = 0; i < oGroup.items.length; i++) {
							oItem = oGroup.items[i];
							if (oItem && oItem.filterItem) {
								this._setPersVisibility(aPersData, oItem.filterItem, aFiltersNotPartOfCurrentVariant, bCancelMode);
							}
						}
					}
				}
			}
		}

		return aFiltersNotPartOfCurrentVariant;
	};

	/**
	 * Determines if the current filter is marks as visible via the personalization
	 * @private
	 * @param {array} aPersData array of filters as obtain by the persistence layer
	 * @param {sap.ui.comp.filterBar.FilterItem} oFilterItem current filterItem
	 * @param {array} aFiltersNotPartOfCurrentVariant
	 * @param {boolean} bCancelMode Flag indicating cancel mode
	 */
	FilterBar.prototype._setPersVisibility = function(aPersData, oFilterItem, aFiltersNotPartOfCurrentVariant, bCancelMode) {

		var sGroupName, oFilterInfo;

		if (oFilterItem && !oFilterItem.getHiddenFilter()) {
			sGroupName = oFilterItem.getGroupName();

			oFilterInfo = this._checkForFilterInfo(aPersData, oFilterItem);
			if (this._isTINAFScenario()) {
				if (oFilterInfo) {
					oFilterItem.setVisibleInFilterBar(oFilterInfo.visibleInFilterBar);

					if (oFilterInfo.hasOwnProperty("visible")) {
						oFilterItem.setVisible(oFilterInfo.visible);
					}
				} else {
					oFilterItem.setVisibleInFilterBar(false);
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (oFilterInfo && (oFilterInfo.visibleInFilterBar !== undefined)) {
					oFilterItem.setVisibleInFilterBar((oFilterInfo.visibleInFilterBar));
				} else { // old format
					if ((sGroupName !== FilterBar.INTERNAL_GROUP) && oFilterInfo && (oFilterInfo.group === sGroupName)) {

						oFilterItem.setVisibleInFilterBar((oFilterInfo !== null));
					}
				}
				/* eslint-enable no-lonely-if */
			}

			if (oFilterItem) {
				var oControl = this.determineControlByFilterItem(oFilterItem, true);
				if (!bCancelMode && oControl && oControl.getValueState && (oControl.getValueState() !== ValueState.None)) {
					oControl.setValueState(ValueState.None);
				}

				if (oFilterInfo && oFilterInfo.hasOwnProperty("partOfCurrentVariant") && (!oFilterInfo.partOfCurrentVariant)) {
					aFiltersNotPartOfCurrentVariant.push(oFilterItem);
				}
			}

		}
	};

	FilterBar.prototype._checkForFilterInfo = function(aPersData, oFilterItem) {

		var i, j, sName = oFilterItem.getName(), aGroupName = [
			oFilterItem.getGroupName(), oFilterItem.getEntitySetName(), oFilterItem.getEntityTypeName()
		];

		var aHits = [];
		if (aPersData && aPersData.length) {
			for (i = 0; i < aPersData.length; i++) {
				if (aPersData[i].name === sName) {
					if (aGroupName.indexOf(aPersData[i].group) > -1) {
						aHits.push(aPersData[i]);
					}
				}
			}
		}

		if (aHits.length === 1) {
			return aHits[0];
		} else if (aHits.length > 1) {
			for (j = 0; j < aGroupName.length; j++) {
				for (i = 0; i < aHits.length; i++) {
					if (aHits[i].group === aGroupName[j]) {
						return aHits[i];
					}
				}
			}
		}


		return null;
	};

	/**
	 * Creates the variant management control.
	 * @private
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagementUi2} the instance of variant management
	 */
	FilterBar.prototype._createVariantManagement = function() {

		var oVarMgm = new SmartVariantManagementUi2(this.getId() + "-variantUi2", {
		});

		var oPersInfo = new PersonalizableInfo({
			type: "filterBar",
			keyName: "persistencyKey"
		});
		oPersInfo.setControl(this);

		oVarMgm.addPersonalizableControl(oPersInfo);

		oVarMgm.addStyleClass("sapUiCompFilterBarMarginLeft");
		return oVarMgm;
	};

	FilterBar.prototype.fireAssignedFiltersChanged = function() {
		this.fireEvent("assignedFiltersChanged");
	};

	/**
	 * Returns a summary string that contains information about the filters currently assigned. The string starts with the number of set filters, followed by
	 * "filters active" and their labels.<br>
	 * Example:<br>
	 * <i>(3) filters active: Company Code, Fiscal Year, Customer</i>
	 * @public
	 * @returns {string} A string that contains the number of set filters and their names
	 */
	FilterBar.prototype.retrieveFiltersWithValuesAsText = function() {
		var sText, sCSVText, aFiltersWithValues = this.retrieveFiltersWithValues(), nCount, sBasicSearchValue = this.getBasicSearchValue();

		if (sBasicSearchValue && aFiltersWithValues) {
			aFiltersWithValues.splice(0, 0, this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_SEARCH_TERM"));
		}

		if (!aFiltersWithValues || (aFiltersWithValues.length === 0)) {
			sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_ZERO");
		} else if (aFiltersWithValues && aFiltersWithValues.length === 1) {
			if (!this._isPhone()) {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_ONE_FILTER", [
					aFiltersWithValues.length, aFiltersWithValues[0]
				]);
			} else {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_ONE_FILTER_MOBILE", [
					aFiltersWithValues.length
				]);
			}
		} else {

			/* eslint-disable no-lonely-if */
			if (!this._isPhone()) {
				nCount = Math.min(5, aFiltersWithValues.length);
				sCSVText = "";
				for (var i = 0; i < nCount; i++) {
					sCSVText += aFiltersWithValues[i];
					if (i < (nCount - 1)) {
						sCSVText += ', ';
					}
				}

				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS", [
					aFiltersWithValues.length, sCSVText
				]);

				if (nCount < aFiltersWithValues.length) {
					sText += ", ...";
				}

			} else {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_MOBILE", [
					aFiltersWithValues.length
				]);
			}

			/* eslint-disable no-lonely-if */
		}

		return sText;
	};

	/**
	 * Returns a summary string that contains information about the filters currently assigned. This string is intended to be used in expanded state. The string starts with the total number of filters set, followed by
	 * "filters active" and if available non-visible, the number of the non-visible with label "hidden" in brackets.<br>
	 * Example:<br>
	 * <i>(3) filters active (1 hidden)</i>
	 * @public
	 * @returns {string} A string that contains the number of set filters and their names
	 */
	FilterBar.prototype.retrieveFiltersWithValuesAsTextExpanded = function() {
		var sText,
			sHiddenFilters = '',
			aFiltersWithValues = this.retrieveFiltersWithValues(),
			sBasicSearchValue = this.getBasicSearchValue(),
			aNonVisibleFiltersWithValues = this.retrieveNonVisibleFiltersWithValues();

		if (aNonVisibleFiltersWithValues.length > 0) {
			sHiddenFilters = " " + this._oRb.getText("FILTER_BAR_ASSIGNED_HIDDEN_FILTERS", [
				aNonVisibleFiltersWithValues.length
			]);
		}

		if (sBasicSearchValue && aFiltersWithValues) {
			aFiltersWithValues.splice(0, 0, this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_SEARCH_TERM"));
		}

		if (aFiltersWithValues.length === 0) {
			sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_ZERO");
		} else if (aFiltersWithValues.length === 1) {
			if (!this._isPhone()) {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_ONE_FILTER_EXPANDED", [
					aFiltersWithValues.length
				]);
				sText += sHiddenFilters;
			} else {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_ONE_FILTER_MOBILE", [
					aFiltersWithValues.length
				]);
				sText += sHiddenFilters;
			}
		} else {
			/* eslint-disable no-lonely-if */
			if (!this._isPhone()) {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_EXPANDED", [
					aFiltersWithValues.length
				]);
				sText += sHiddenFilters;
			} else {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_MOBILE", [
					aFiltersWithValues.length
				]);
				sText += sHiddenFilters;
			}
			/* eslint-disable no-lonely-if */
		}

		return sText;
	};

	/**
	 * Retrieves the labels of all visible filters that belongs to the current variant and have an assigned value.
	 * @public
	 * @returns {array} Filter labels that represents relevant filters with values
	 */
	FilterBar.prototype.retrieveFiltersWithValues = function() {

		var i, aResultingFilters = [];
		var aFilters = this._getFiltersWithValues();
		if (aFilters) {
			for (i = 0; i < aFilters.length; i++) {
				if (aFilters[i].getHiddenFilter()) {
					continue;
				}
				if (aFilters[i].getVisible() && aFilters[i].getPartOfCurrentVariant()) {
					aResultingFilters.push(aFilters[i].getLabel());
				}
			}
		}

		return aResultingFilters;
	};

	FilterBar.prototype.retrieveNonVisibleFiltersWithValues = function() {
		var i, aResultingFilters = [], oFilterItem, aFilters = this._getFiltersWithValues();

		if (aFilters) {
			for (i = 0; i < aFilters.length; i++) {
				oFilterItem = aFilters[i];
				if (oFilterItem.getHiddenFilter()) {
					continue;
				}
				if (oFilterItem.getVisible() && !oFilterItem.getVisibleInFilterBar() && oFilterItem.getPartOfCurrentVariant && oFilterItem.getPartOfCurrentVariant()) {
					aResultingFilters.push(oFilterItem.getLabel());
				}
			}
		}

		return aResultingFilters;
	};

	/**
	 * Retrieves all filters with values.
	 * @private
	 * @returns {sap.ui.comp.filterbar.FilterItem[]} of filters with values
	 */
	FilterBar.prototype._getFiltersWithValues = function() {

		if (this._fRegisterGetFiltersWithValues) {
			try {
				return this._fRegisterGetFiltersWithValues();
			} catch (ex) {
				Log.error("callback for obtaining the filter count throws an exception");
			}
		}

		return null;
	};

	/**
	 * Retrieve the count for visible filters with values.
	 * @private
	 * @returns {number} count of visible filters with values
	 */
	FilterBar.prototype._getFiltersWithValuesCount = function() {

		var n = 0;

		var aFilters = this.retrieveFiltersWithValues();
		n = aFilters.length;

		if (this._oBasicSearchField && this._oBasicSearchField.getValue && this._oBasicSearchField.getValue()) {
			n++;
		}

		return n;
	};

	/**
	 * Determines if at least one filter is visible.
	 * @private
	 * @param {array} aFilterItemsWithValues contains all filters with values
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem filter to check
	 * @returns {boolean} indicated whether at least one filter is visible
	 */
	FilterBar.prototype._checkFilterForValue = function(aFilterItemsWithValues, oFilterItem) {

		var i;
		if (aFilterItemsWithValues) {
			for (i = 0; i < aFilterItemsWithValues.length; i++) {
				if (aFilterItemsWithValues[i] === oFilterItem) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Checks if there are mandatory fields.
	 * @private
	 */
	FilterBar.prototype._hasMandatoryFields = function() {
		return this.getFilterGroupItems().some(function(oItem) {
			return oItem.getMandatory();
		});
	};

	/**
	 * Toggles the filterbar mode Hide/Show.
	 * @private
	 */
	FilterBar.prototype._toggleHideShow = function() {
		if (this._hasAnyVisibleFiltersOnFB()) {
			this.setFilterBarExpanded(!this.getFilterBarExpanded());
		}

		if (this.isPropertyInitial("showAllFilters")) {
			this.setShowAllFilters(this._hasMandatoryFields());
		}
	};

	FilterBar.prototype._updateHeaderTitle = function () {
		const sHeaderText = this.getHeader(),
			oHeaderTitle = this.getAggregation("_headerTitle");

		if (!oHeaderTitle) {
			return;
		}

		oHeaderTitle.setVisible(!!sHeaderText);
		oHeaderTitle.setText(sHeaderText);
		oHeaderTitle.setLevel(this.getHeaderLevel());
	};

	/**
	 * Updates the 'Filters'-button text with the count of filters with values
	 * @protected
	 */
	FilterBar.prototype._updateToolbarText = function() {
		if (this.bPreventUpdateToolbarText) {
			return;
		}
		var sFiltersKey = this._isNewFilterBarDesign() ? "FILTER_BAR_ADAPT_FILTERS" : "FILTER_BAR_ACTIVE_FILTERS";
		var sZeroFiltersKey = this._isNewFilterBarDesign() ? "FILTER_BAR_ADAPT_FILTERS_ZERO" : "FILTER_BAR_ACTIVE_FILTERS_ZERO";

		var nFilterCount = this._getFiltersWithValuesCount();
		var sText = nFilterCount ? (this._oRb.getText(sFiltersKey, [
			nFilterCount
		])) : (this._oRb.getText(sZeroFiltersKey));

		this._getFiltersButton().setText(sText);
	};

	FilterBar.prototype._selectionChangedInFilterDialogByValue = function(bValue, oFilterItem) {

		oFilterItem.setVisibleInFilterBar(bValue);

		if (this._getConsiderFilterChanges() && this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
			this._oVariantManagement.currentVariantSetModified(true);
		}

		this._bDirtyViaDialog = true;

		if (bValue) {
			this._aAddedFilters.push(oFilterItem);
		} else {
			this._bFilterRemoved = true;
		}

		this._oFilterToFocus = this._calculateFilterToFocus(oFilterItem);

	};

	FilterBar.prototype._onLocalizationChanged = function() {
		this._oRb = Library.getResourceBundleFor("sap.ui.comp");

		// remove buttons aggregations
		this.destroyAggregation("_searchButton");
		this.destroyAggregation("_hideShowButton");
		this.destroyAggregation("_clearButton");
		this.destroyAggregation("_restoreButton");
		this.destroyAggregation("_filtersButton");
		this.destroyAggregation("_showAllFiltersButton");

		this._createButtons(); // recreate buttons aggregations

		this.invalidate();
	};

	/**
	 * Calculates which filter should get the focus after AdaptFilters dialog is closed.
	 * @returns {object} the filter that should get the focus or <code>null</code> if no filter should be focused
	 * @private
	 */
	FilterBar.prototype._calculateFilterToFocus = function(oFilterItem) {
		const aAdaptFilterItems = this._oAdaptFiltersDialogModel.getProperty("/items");
		if (this._aAddedFilters.length === 0) {
			if (this._bFilterRemoved) {
				// In case no filters are added and there are removed filters
				// we set the focus to the first visible filter
				this._bFilterRemoved = false;
				return this._retrieveVisibleAdvancedItems()[0]?.control;
			} else {
				// In case no filters are added or removed we do nothing
				return null;
			}
		}

		if (this._bFilterRemoved) {
			this._bFilterRemoved = false;
			return this._oFilterToFocus;
		}

		// In case only one filter was added we set the focus to it
		if (this._aAddedFilters.length === 1) {
			return this._aAddedFilters[0];
		}
		const iItemToFocusIndex = aAdaptFilterItems.findIndex((oItem) => {
			return oItem.name === this._oFilterToFocus.getName();
		});
		const iCurrentAddedFilterIndex = aAdaptFilterItems.findIndex((oItem) => {
			return oItem.name === oFilterItem.getName();
		});

		// In case many filters are added we set the focus to the first one
		return iCurrentAddedFilterIndex < iItemToFocusIndex ? oFilterItem : this._oFilterToFocus;

	};

	/**
	 * Called when the control is changed. Validates the symbols passing the search pattern
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	FilterBar.prototype._onLiveChangeValidateSymbols = function(oEvent) {
		var rValidateSymbolAsteriskRegex = new RegExp("[\\w][*][\\w]"),
			rValidateSymbolPlusRegex = new RegExp("[+]"),
			oControl = oEvent.getSource(),
			sText = oControl.getValue(),
			bContainSpecialSymbol = rValidateSymbolAsteriskRegex.test(sText) || rValidateSymbolPlusRegex.test(sText);

		this._onSymbolsValidationSetValueState.call(this, bContainSpecialSymbol, oControl);
	};

	/**
	 * Setting Warning value state and related value text if any special symbol is entered
	 * @private
	 * @param {Boolean} bContainSpecialSymbol - flag contains special symbol
	 * @param {Object} oControl - target control
	 */
	FilterBar.prototype._onSymbolsValidationSetValueState = function (bContainSpecialSymbol, oControl){
		var oValueStateMessage = oControl._oValueStateMessage,
			sWarningClassName = "sapMSFContentWrapperWarning";
		if (bContainSpecialSymbol && !oControl.hasStyleClass(sWarningClassName) && oControl.setValueState === undefined) {
			oControl.addStyleClass(sWarningClassName);
			oControl.getValueState = function () {
				return ValueState.Warning;
			};

			oValueStateMessage.open();
		} else if (!bContainSpecialSymbol && oControl.hasStyleClass(sWarningClassName) && oControl.setValueState === undefined) {
			oControl.getValueState = function () {
				return ValueState.None;
			};

			oValueStateMessage.close();
			oControl.removeStyleClass(sWarningClassName);
		} else if (bContainSpecialSymbol && oControl.getValueState && oControl.getValueState() === ValueState.None){
			oControl.setValueState(ValueState.Warning);
			oControl.setValueStateText(SymbolValidationWarningMessage);
		} else if (!bContainSpecialSymbol && oControl.getValueState() === ValueState.Warning) {
			oControl.setValueState(ValueState.None);
		}
	};

	/**
	 * Cross-checks if a mandatory filter has a value.
	 * @private
	 * @param {object } oEvent general event object
	 */
	FilterBar.prototype._mandatoryFilterChange = function(oEvent) {
		if (!oEvent) {
			return;
		}

		var params = oEvent.getParameters();
		if (!params || !params.oSource) {
			return;
		}

		var oItem = this._determineByControl(params.oSource);
		if (oItem) {
			this._mandatoryFilterItemChange(oItem.filterItem);
		}
	};

	FilterBar.prototype._mandatoryFilterItemChange = function(oFilterItem) {

		if (oFilterItem) {

			if (!oFilterItem.getMandatory()) {
				return;
			}

			var bHasValue = this._hasFilterValue(oFilterItem);
			if (!oFilterItem.getVisibleInFilterBar() && !bHasValue) {
				oFilterItem.setVisibleInFilterBar(true);
			}
		}
	};

	/**
	 * Checks if running on phone.
	 * @protected
	 * @returns {boolean} <code>True</code> if phone, <code>false</code> otherwise
	 */
	FilterBar.prototype._isPhone = function() {
		return !!(Device.system.phone);
	};

	/**
	 * Checks if running on tablet.
	 * @protected
	 * @returns {boolean} <code>True</code> if tablet, <code>false</code> otherwise
	 */
	FilterBar.prototype._isTablet = function() {
		return !!(Device.system.tablet && !Device.system.desktop);
	};


	FilterBar.prototype.fireSearch = function(oEvent) {

		if (this._bOKFiltersDialogTriggered && this._oAdaptFiltersDialog) {
			this._oAdaptFiltersDialog.close();
		} else if (this._oAdaptFiltersDialog) {
			this._bEnterPressedLeadsToSearch = true;
		}

		this.fireEvent("search", oEvent);

	};

	FilterBar.prototype._variantSave = function(oEvent) {

		this._oVariant = {};

		this.fireBeforeVariantSave();
	};

	FilterBar.prototype._afterVariantSave = function(oEvent) {
		this._aOrderedFilterItems = this._aAdaptFilterItems; // refresh
		this._aAdaptFilterItems = []; // clear adapt filter items temp
		this.fireAfterVariantSave();
	};

	// indicates a filter change in the control, but not in the model
	FilterBar.prototype._filterSetInErrorState = function(oControl) {
		if (this._oAdaptFiltersDialog && this._oAdaptFiltersDialog.isOpen()) {
			if (this._getConsiderFilterChanges() && this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
				this._oVariantManagement.currentVariantSetModified(true);
			}
			this._bDirtyViaDialog = true;
		}
	};

	FilterBar.prototype._cancelFilterDialog = function(bVariantSaveTriggered) {

		// in case the save variant was canceled by the user, set the dirty flag to true,
		// since the save variant was only possible with a dirty variant
		// BCP: 1670342256
		if (bVariantSaveTriggered && this._oVariantManagement) {
			this._bDirtyViaDialog = this._oVariantManagement._bSaveCanceled;
		}

		// BCP: 1780159203
		if (!this.getPersistencyKey() && (this.getUseSnapshot() === false)) {
			this.fireCancel();
			return;
		}

		if (this._oInitialVariant && this._oInitialVariant.content && this._bDirtyViaDialog) {
			var aSelectionSet = this._retrieveCurrentSelectionSet(false);
			this._deleteValidatingTokenFlag(aSelectionSet);

			this.applyVariant(this._oInitialVariant.content, "CANCEL");

			if (this._oVariantManagement) {
				if (!this._oVariantManagement.isPageVariant()) {
					this._oVariantManagement.setCurrentVariantKey(this._oInitialVariant.key);
				}

				this._oVariantManagement.currentVariantSetModified(this._oInitialVariant.modified);
			}

			this.fireCancel();
		}
	};

	/**
	 * Resets filters in value state error to value state none. The error value is set in control and not propagated to the model. It is not possible
	 * to restore a filter which was already in error state, once the filters dialog is opened.
	 * @private
	 */
	FilterBar.prototype._resetFiltersInErrorValueState = function() {
		var aNameControls;

		aNameControls = this._retrieveCurrentSelectionSet(true, true);
		aNameControls.forEach(function(oObj) {
			if (oObj.control && oObj.control.setValueState && oObj.control.getValueState) {
				if (oObj.control.getValueState() === ValueState.Error) {
					if (oObj.control.isA("sap.m.DynamicDateRange")) {
						oObj.control.setValue(null);
					} else if (oObj.control.setValue) {
						oObj.control.setValue("");
					}

					oObj.control.setValueState(ValueState.None);
				}
			}

		});

	};


	/**
	 * Sets the width of the content area of the dialog. The passed dimension will be interpreted as 'px'.
	 * @public
	 * @param {float} fWidth the content width of the filters dialog.
	 */
	FilterBar.prototype.setContentWidth = function(fWidth) {

		if (this._oAdaptFiltersDialog) {
			this._oAdaptFiltersDialog.setContentWidth(fWidth + "px");
		}
	};


	/**
	 * Sets the height of the content area of the dialog. The passed dimension will be interpreted as 'px'.
	 * @public
	 * @param {float} fHeight the content height of the filters dialog.
	 */
	FilterBar.prototype.setContentHeight = function(fHeight) {
		if (this._oAdaptFiltersDialog) {
			this._oAdaptFiltersDialog.setContentHeight(fHeight + "px");
		}
	};


	/**
	 * Enables to add application specific content as a custom view to the new adapt filters dialog.
	 *
	 * @param {object} mCustomView the setting for the custom view
	 * @param {sap.m.SegmentedButtonItem} mCustomView.item the custom button used in the view switch
	 * @param {sap.ui.core.Control} mCustomView.content the content displayed in the custom view
	 * @param {function} [mCustomView.search] callback triggered by search - executed with the string as parameter
	 * @param {function} [mCustomView.filterSelect] callback triggered by the <code>Select</code> control in the header area - executed with the selected key as parameter
	 * @param {function} [mCustomView.selectionChange] callback triggered by selecting a view - executed with the key as parameter
	 *
	 * Note: This API is designed to fulfill the need of adding visual filters to "Adapt Filters" dialog so applications
	 * can achieve the ALP scenario in free style. Other usages are not encouraged.
	 *
	 * @public
	 */
	FilterBar.prototype.addAdaptFilterDialogCustomContent = function(mCustomView) {
		this._mCustomViewInfo = {
			item: mCustomView.item,
			search : mCustomView.search,
			selectionChange: mCustomView.selectionChange,
			filterSelect: mCustomView.filterSelect,
			content : mCustomView.content
		};
	};


	FilterBar.prototype._createStructureForAdaptFiltersDialog = function() {
		var oGroup, oItem, mState = { filtersOnFilterBar: {}, allFilters: []};

		var bHasValue, aFilters = this.getAllFiltersWithValues ? this.getAllFiltersWithValues() : this._getFiltersWithValues();

		if (this._mAdvancedAreaFilter) {
			for (var n in this._mAdvancedAreaFilter) {
				if (n) {
					oGroup = this._mAdvancedAreaFilter[n];
					if (oGroup.items) {
						for (var i = 0; i < oGroup.items.length; i++) {
							oItem = oGroup.items[i];

							bHasValue = this._checkFilterForValue(aFilters, oItem.filterItem);

							if (oItem.filterItem.getVisibleInFilterBar()) {
								mState.filtersOnFilterBar[oItem.filterItem.getName()] = oItem.filterItem;
							}

							var sGroupName = oItem.filterItem.getGroupName() ? oItem.filterItem.getGroupName() : FilterBar.INTERNAL_GROUP;
							var sGroupLabel = (sGroupName === FilterBar.INTERNAL_GROUP) ? this._oRb.getText("FILTER_BAR_BASIC_GROUP") : oItem.filterItem.getGroupTitle();

							var sTooltip = oItem.filterItem.getControlTooltip() ? oItem.filterItem.getControlTooltip() : "";

							mState.allFilters.push({
								name: oItem.filterItem.getName(),
								label: oItem.filterItem.getLabel(),
								group: sGroupName,
								groupLabel: sGroupLabel,
								tooltip: sTooltip,
								visibleInDialog: oItem.filterItem.getVisible(),
								filterItem: oItem.filterItem,
								active: bHasValue,
								required: oItem.filterItem.getMandatory()
							});
						}
					}
				}
			}

			// apply items order based on "fresh" _aAdaptFilterItems or _aOrderedFilterItems from variant
			if (mState.allFilters.length > 0) {
				var aItemsOrder = [],
					aItemsOrderToApply = this._aAdaptFilterItems.length > 0 ? this._aAdaptFilterItems : this._aOrderedFilterItems;

				if (aItemsOrderToApply.length > 0) {
					aItemsOrderToApply.forEach(function (oItem, iIndex) {
						aItemsOrder[oItem.name] = iIndex;
					});
					mState.allFilters.sort(function (a, b) {
						return aItemsOrder[a.name] - aItemsOrder[b.name];
					});
				}
			}
		}

		return mState;
	};

	FilterBar.prototype._getAllFilterItemsFlat = function() {
		var oGroup, oItem, oItemFilterItem, allFilters = [];

		if (this._mAdvancedAreaFilter) {
			for (var n in this._mAdvancedAreaFilter) {
				if (n) {
					oGroup = this._mAdvancedAreaFilter[n];
					if (oGroup.items) {
						for (var i = 0; i < oGroup.items.length; i++) {
							oItem = oGroup.items[i];
							oItemFilterItem = oItem.filterItem;

							var sGroupName = oItemFilterItem.getGroupName() ? oItemFilterItem.getGroupName() : FilterBar.INTERNAL_GROUP;
							var sGroupLabel = (sGroupName === FilterBar.INTERNAL_GROUP) ? this._oRb.getText("FILTER_BAR_BASIC_GROUP") : oItemFilterItem.getGroupTitle();

							var sTooltip = oItemFilterItem.getControlTooltip() ? oItemFilterItem.getControlTooltip() : "";

							allFilters.push({
								name: oItemFilterItem.getName(),
								label: oItemFilterItem.getLabel(),
								group: sGroupName,
								groupLabel: sGroupLabel,
								tooltip: sTooltip,
								visibleInDialog: oItemFilterItem.getVisible(),
								filterItem: oItemFilterItem,
								required: oItemFilterItem.getMandatory()
							});
						}
					}
				}
			}

			if (allFilters.length > 0) {
				var aItemsOrder = [],
					aItemsOrderToApply = this._aOrderedFilterItems;

				aItemsOrderToApply.forEach(function (oItem, iIndex) {
					aItemsOrder[oItem.name] = iIndex;
				});
				allFilters.sort(function (a, b) {
					return aItemsOrder[a.name] - aItemsOrder[b.name];
				});
			}
		}

		return allFilters;
	};

	FilterBar.prototype._restoreControls = function(fVisibilityChanged, bCancelMode) {
		var oGroup, oItem;

		if (this._fRegisteredFilterChangeHandlers) {
			this.detachFilterChange(this._fRegisteredFilterChangeHandlers);
			this._fRegisteredFilterChangeHandlers = null;
		}

		if (this._mAdvancedAreaFilter) {
			for (var n in this._mAdvancedAreaFilter) {
				if (n) {
					oGroup = this._mAdvancedAreaFilter[n];
					if (oGroup.items) {
						for (var i = 0; i < oGroup.items.length; i++) {
							oItem = oGroup.items[i];

							if (oItem.filterItem && !oItem.filterItem.getHiddenFilter() && oItem.control) {

								if (oItem.contentReplaced) {
									oItem.contentReplaced = undefined;

									var oFirstContent = oItem.filterItem._getControl();
									if (oFirstContent && oFirstContent.getValueState) {
										if (bCancelMode && (oFirstContent.getValueState() != oItem.control.getValueState())) {
											oItem.control.setValueState(oFirstContent.getValueState());
										}
									}
									oFirstContent.destroy();
									oItem.filterItem._oLabel.setLabelFor && oItem.filterItem._oLabel.setLabelFor(oItem.control);
									oItem.filterItem.setControl(oItem.control);
									if (this._isPhone() || this._isTablet()) {
										oItem.control.sName = oItem.filterItem.getName();
										oItem.control._onAfterInputRenderingDelegate = {
											onAfterRendering: function (oEvent) {
												this._applyInputModeAttribute(oEvent.srcControl, oEvent.srcControl.sName);
											},
											sName: oItem.filterItem.getName()
										};
										oItem.control.addDelegate(oItem.control._onAfterInputRenderingDelegate, this);
									}
								}

								oItem.filterItem.detachChange(fVisibilityChanged);
							}
						}
					}
				}
			}
		}
	};


	FilterBar.prototype._expandGroup = function(oItem)	{
		if (this._oAdaptFiltersDialog && this._oAdaptFiltersDialogModel && this._oAdaptFiltersPanel && oItem && oItem.filterItem) {

			var sGroupName = oItem.filterItem.getGroupName() ? oItem.filterItem.getGroupName() : FilterBar.INTERNAL_GROUP;

			var aItemsGrouped = this._oAdaptFiltersDialogModel.getData().itemsGrouped;
			for (var i = 0; i < aItemsGrouped.length; i++) {
				if (aItemsGrouped[i].group === sGroupName) {
					for (var j = 0; j < aItemsGrouped[i].items.length; j++) {
						if (aItemsGrouped[i].items[j].name === oItem.filterItem.getName()) {
							this._oAdaptFiltersPanel.setGroupExpanded(aItemsGrouped[i].items[j].group, true);
							return;
						}
					}
					return;
				}
			}
		}
	};

	var P13nBuilder, AdaptFiltersPanel;

	FilterBar.prototype._getEntitiesLazy = function() {
		if (P13nBuilder && AdaptFiltersPanel) {
			return Promise.resolve();
		}

		this.setBusy(true);

		return Library.load('sap.ui.mdc', {
			async: true
		}).then(function() {
			return new Promise(function(resolve) {
				sap.ui.require([
					"sap/ui/mdc/p13n/P13nBuilder",
					"sap/ui/mdc/p13n/panels/AdaptFiltersPanel"
				], function(fnP13nBuilder, fnAdaptFiltersPanel) {
					P13nBuilder = fnP13nBuilder;
					AdaptFiltersPanel = fnAdaptFiltersPanel;
					resolve();

					this.setBusy(false);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};


	FilterBar.prototype._filtersButtonPressed = function()	{
		this._getFiltersButton().focus();

		this.showAdaptFilterDialog();
	};

	FilterBar.prototype._checkAssignedFilters = function()	{
		if (this._oAdaptFiltersDialog) {
			var aFilters = this.getAllFiltersWithValues ? this.getAllFiltersWithValues() : this._getFiltersWithValues();

			var aItems = this._oAdaptFiltersDialogModel.getData().items;
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].hasOwnProperty("filterItem")) {
					var bHasValue = this._checkFilterForValue(aFilters, aItems[i].filterItem);
					if (aItems[i].active !== bHasValue) {
						aItems[i].active = bHasValue;
					}
				}
			}
		}
	};

	/**
	 * Opens the Adapt Filters Dialog for the UI adaptation.
	 * <br><b>Note:</b> This function must only be used internally during the UI adaptation.
	 *
	 * @private
	 * @ui5-restricted sap.ui.rta
	 *
	 * @param {string} sStyleClass indicating the ui adaption area
	 * @param {function} fCallBack will be executed, once the dialog closes with 'Save'
	 */
	FilterBar.prototype.showAdaptFilterDialogForKeyUser = function(sStyleClass, fCallBack)	{

		this._fGetDataForKeyUser = fCallBack;
		return this.showAdaptFilterDialog().then(function() {
			this._oAdaptFiltersDialog._oPopup && this._oAdaptFiltersDialog._oPopup.addStyleClass(sStyleClass);

			P13nBuilder.addRTACustomFieldButton(this._oAdaptFiltersDialog._oPopup);

		}.bind(this));
	};


	FilterBar.prototype._createKeyUserChange = function() {
		var oObj = [];

		if (this._bOKFiltersDialogTriggered && this._oVariantManagement &&
			this._oVariantManagement.isA("sap.ui.comp.smartvariants.SmartVariantManagement") &&
			this._oVariantManagement.getVisible() && this._oVariantManagement._getPersoController()) {

			oObj = [{
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
		}

		return oObj;
	};

	/**
	 * Opens the Adapt Filters Dialog
	 *
	 * @private
	 * @ui5-restricted sap.ui.generic
	 *
	 * @param {string} sView initially shown view
	 */
	FilterBar.prototype.showAdaptFilterDialog = function(sView)	{

		return new Promise(function(fResolve) {

			this._getEntitiesLazy().then(function() {
				var oDummyJSONModel;

				if (!this._oAdaptFiltersDialog) {
					oDummyJSONModel = new JSONModel();
					oDummyJSONModel.setSizeLimit(0);
					var fHandleGroupVisibility = function(aItemsGrouped, sGroupName) {
						for (var i = 0; i < aItemsGrouped.length; i++) {
							if (aItemsGrouped[i].group === sGroupName) {

								var aItems = aItemsGrouped[i].items;
								for (var j = 0; j < aItems.length; j++) {

									if (aItems[j].filterItem && aItems[j].filterItem.getVisible()) {
										if (!aItemsGrouped[i].groupVisible) {
											aItemsGrouped[i].groupVisible = true;
										}

										return;
									}
								}

								if (aItemsGrouped[i].groupVisible) {
									aItemsGrouped[i].groupVisible = false;
								}

								return;
							}
						}
					};

					var fVisibilityChanged = function(oEvent) {
						if (oEvent && oEvent.oSource && (oEvent.oSource.isA("sap.ui.comp.filterbar.FilterItem"))) {
							var sPropertyName = oEvent.getParameter("propertyName");
							if (this._oAdaptFiltersDialogModel && sPropertyName) {
								var aItems = this._oAdaptFiltersDialogModel.getData().items;
								for (var i = 0; i < aItems.length; i++) {
									if (aItems[i].hasOwnProperty("filterItem") && aItems[i].filterItem === oEvent.oSource) {
										if (sPropertyName === "visible") {
											var bFlag = oEvent.oSource.getVisible();
											if (aItems[i].visibleInDialog != bFlag) {
												aItems[i].visibleInDialog = bFlag;

												//check for group
												fHandleGroupVisibility(this._oAdaptFiltersDialogModel.getData().itemsGrouped, aItems[i].group);

												// trigger bindings
												this._oAdaptFiltersDialogModel.checkUpdate();
												break;
											}
										} else if (sPropertyName === "visibleInFilterBar") {
											aItems[i].visible = oEvent.oSource.getVisibleInFilterBar();

											// trigger bindings
											this._oAdaptFiltersDialogModel.checkUpdate();
											break;
										}
									}
								}
							}
						}
					}.bind(this);

					this._ensureFilterLoaded(null);

					var mState = this._createStructureForAdaptFiltersDialog();
					var that = this;

					var oP13nData = P13nBuilder.prepareAdaptationData(mState.allFilters, function(mItem, oItem) {
						//mItem --> Item which will be included in the model (can be customized in this callback)
						//oItem --> according item from the provided array in the first argument
						merge(mItem, oItem);

						var bIncludeInDialog = true;

						if (!oItem.filterItem || oItem.filterItem.getHiddenFilter()) {
							that._mAdvancedAreaHiddenFilters.push(mItem);
							bIncludeInDialog = false;
						}

						mItem.visible = !!mState.filtersOnFilterBar[oItem.name]; //visible in AF Dialog == visibleOnFilterBar
						return bIncludeInDialog; //flag decides if the item will be included in the p13n model structure
					}, true);

					P13nBuilder.sortP13nData({
						visible: "visible",
						position: "position"
					}, oP13nData.items);

					this._oAdaptFiltersDialogModel = new JSONModel();
					this._oAdaptFiltersDialogModel.setSizeLimit(1000);
					this._oAdaptFiltersDialogModel.setData(oP13nData);
					this._mAdaptFiltersDialogInitialItemsOrder = [].concat(this._oAdaptFiltersDialogModel.getData().items, this._mAdvancedAreaHiddenFilters);

					var aItems = this._oAdaptFiltersDialogModel.getData().items;
					for (var i = 0; i < aItems.length; i++) {
						if (aItems[i].hasOwnProperty("filterItem")) {
							aItems[i].filterItem.attachChange(fVisibilityChanged);
						}
					}

					this._fRegisteredFilterChangeHandlers = function(oEvent) {
						this._mandatoryFilterChange(oEvent);
					}.bind(this);
					this.attachFilterChange(this._fRegisteredFilterChangeHandlers);

					var fItemHandler = function(oItem, bVisible) {
						if (oItem && oItem.filterItem && oItem.filterItem.getVisibleInFilterBar() !== bVisible) {
							this._selectionChangedInFilterDialogByValue(bVisible, oItem.filterItem);
						}
					}.bind(this);

					var fChange = function(oEvent) {
						var i,
							sTargetGroup,
							aItems,
							bindingContextPath,
							mItem = oEvent.getParameter("item"),
							sReason = oEvent.getParameter("reason"),
							bVisible = sReason === "Add" || sReason === "SelectAll" || sReason === "RangeSelect";

						if ((sReason === "SelectAll" || sReason === "DeselectAll")) {
							if (this._oAdaptFiltersPanel.getCurrentViewKey() === this._oAdaptFiltersPanel.GROUP_KEY) {
								sTargetGroup = oEvent.getParameter("item").group;
								aItems = this._oAdaptFiltersDialogModel.getProperty("/itemsGrouped").filter(function(oItemsGrouped){
									return oItemsGrouped.group === sTargetGroup;
								})[0].items;
							} else {
								aItems = this._oAdaptFiltersDialogModel.getProperty("/items");
							}
							for (i = 0; i < aItems.length; i++) {
								mItem = aItems[i];
								if (!bVisible && this._shouldBeVisible(mItem)) {
									bindingContextPath = "/items/" + i;
									this._oAdaptFiltersDialogModel.setProperty(bindingContextPath + "/visible", true);
								} else {
									fItemHandler(mItem, bVisible);
								}
							}
						} else if (sReason === "RangeSelect" && mItem) {
							if (this._oAdaptFiltersPanel.getCurrentViewKey() === this._oAdaptFiltersPanel.LIST_KEY) {
								// mItem is array containing items for "range selection"
								for (i = 0; i < mItem.length; i++) {
									var mItemInRangeSelection = mItem[i];
									if (!bVisible && this._shouldBeVisible(mItemInRangeSelection)) {
										bindingContextPath = "/items/" + i;
										this._oAdaptFiltersDialogModel.setProperty(bindingContextPath + "/visible", true);
									} else {
										fItemHandler(mItemInRangeSelection, bVisible);
									}
								}
							}
						} else if ((sReason === "Add" || sReason === "Remove") && mItem) {
							if (!bVisible && this._shouldBeVisible(mItem)) {
								mItem.visible = true;
							} else {
								fItemHandler(mItem, bVisible);
							}
						} else if (sReason === "Move") {
							this._bDirtyViaDialog = true;
							this._bMoveTriggered = true;
						}

						this._oAdaptFiltersPanel.setP13nData(this._oAdaptFiltersDialogModel.getData());
					}.bind(this);

					var oFilterPanel = new AdaptFiltersPanel({
						enableReorder: true
					});

					oFilterPanel.getView(oFilterPanel.GROUP_KEY).getContent().attachChange(fChange);
					oFilterPanel.getView(oFilterPanel.LIST_KEY).getContent().attachChange(fChange);

					this._oAdaptFiltersPanel = oFilterPanel;

					oFilterPanel.setItemFactory(function(oContext) {

						var oControl, oControlClone, oItem, oObj;

						oObj = oContext.getObject();
						if (!oObj) {
							return undefined;
						}

						oItem = this._determineItemByName(oObj.name, oObj.group);
						if (!oItem || !oItem.filterItem || !oItem.control) {
							return undefined;
						}

						oControl = oItem.control;

						if (!oItem.contentReplaced && oItem.filterItem._getControl() === oControl) {
							oItem.contentReplaced = true;
							const oCloneSettings = { cloneChildren: true, cloneBindings: false }; // clone without the bindings by default

							//Clone the bindings for MCB is required for proper token removal in the adapt filters dialog
							if (oControl.isA("sap.ui.comp.smartfilterbar.SFBMultiComboBox")) {
								oCloneSettings.cloneBindings = true;
							}

							oControlClone = oControl.clone("", [], oCloneSettings);
							oItem.filterItem._oLabel.setLabelFor && oItem.filterItem._oLabel.setLabelFor(oControlClone);

							// The cloned control is used for presentation purposes only and
							// with replacing the default ODataModel with the dummy JSONmodel we prevent unnecessary requests to the backend.
							oControlClone.setModel(oDummyJSONModel);

							oItem.filterItem.setControl(oControlClone);
						}

						return oControl;
					}.bind(this));

					this.fireFiltersDialogBeforeOpen({newDialog: true});

					if (this._mCustomViewInfo && this._mCustomViewInfo.item && this._mCustomViewInfo.item.getKey()) {
						oFilterPanel.addCustomView(this._mCustomViewInfo);
						oFilterPanel.switchView(sView ? sView : oFilterPanel.getDefaultView());
					}

					sap.ui.require(["sap/m/p13n/Popup"], function(P13nPopup){
						var oAdaptFilterDialog = new P13nPopup(this.getId() + "-adapt-filters", {
							panels: [oFilterPanel],
							title: this._oRb.getText(this._isNewFilterBarDesign() ? "FILTER_BAR_ADAPT_FILTERS_DIALOG" : "FILTER_BAR_ADV_FILTERS_DIALOG"),
							reset: this.getShowRestoreButton() && !this._fGetDataForKeyUser ? this._dialogRestore.bind(this) : null,
							warningText: Library.getResourceBundleFor("sap.m").getText("p13n.RESET_WARNING_TEXT"),
							close: function(oEvt) {

								if (oEvt.getParameter("reason") === "Ok") {
									this._bOKFiltersDialogTriggered = true;
								} else {
									this._dialogCancel(this._oAdaptFiltersDialog);
								}

								if (this._bOKFiltersDialogTriggered && typeof this._clearErroneusControlValues === 'function') {
									this._clearErroneusControlValues();
								}
								this._restoreControls(fVisibilityChanged, !this._bOKFiltersDialogTriggered);

								if (!this._bOKFiltersDialogTriggered) {
									this._cancelFilterDialog(false);
								}

								if (this._bOKFiltersDialogTriggered) {
									this._aAdaptFilterItems = this._oAdaptFiltersDialogModel.getProperty("/items");
									this._mAdvancedAreaFilterFlat = this._aAdaptFilterItems;
									this._aAdaptFilterItems = [].concat(this._aAdaptFilterItems, this._mAdvancedAreaHiddenFilters); // add hidden filters
									this._mAdvancedAreaFilter = this._mapReorderedFilterItemsInGroups(this._aAdaptFilterItems);
									this._bMoveTriggered = false; // reset move action
									this._mAdvancedAreaHiddenFilters = [];
								} else {
									this._aAdaptFilterItems = []; // cleanup
								}

								if (this._fGetDataForKeyUser) {
									this._fGetDataForKeyUser(this._createKeyUserChange());
								}

								this._applyAttributes();

								this._oAdaptFiltersDialogModel = null;
								this._oAdaptFiltersPanel = null;
								this._oVariant = {};
								this._oInitialVariant = null;
								this._oAdaptFiltersDialog.destroy();
								this._oAdaptFiltersDialog = null;
								this._fGetDataForKeyUser = null;

								if ((this._bOKFiltersDialogTriggered && this._bDirtyViaDialog || this._bResetFiltersDialogTriggered) && !this._bEnterPressedLeadsToSearch) {
									if (!this.isLiveMode || !this.isLiveMode()) {
										this.fireFilterChange();
									}
								}

								this._bEnterPressedLeadsToSearch = false;
								this._bResetFiltersDialogTriggered = false;

								this.fireFiltersDialogClosed({
									context: this._bOKFiltersDialogTriggered ? "SEARCH" : "CANCEL"
								});
								setTimeout(function() {
									if (!this._oFilterToFocus) {
										return;
									}
									this._oFilterToFocus.getControl ? this._oFilterToFocus.getControl()?.focus() : this._oFilterToFocus.focus();
								}.bind(this), 301);

							}.bind(this)
						});

						oAdaptFilterDialog._getIdPrefix = function() {
							return "-dialog";
						};
						this._oAdaptFiltersDialog = oAdaptFilterDialog;
						this._oAdaptFiltersDialog.setParent(this);

						this._oVariant.content = this.fetchVariant();
						if (this._oVariantManagement) {
							this._oVariant.key = this._oVariantManagement.getSelectionKey();
							this._oVariant.modified = this._oVariantManagement.currentVariantGetModified();
						}
						this._oInitialVariant = {};
						merge(this._oInitialVariant, this._oVariant);

						this._bOKFiltersDialogTriggered = false;
						this._bDirtyViaDialog = false;
						this._bEnterPressedLeadsToSearch = false;

						if (this.$().closest(".sapUiSizeCompact").length > 0) {
							this._oAdaptFiltersDialog.addStyleClass("sapUiSizeCompact");
						}

						this._oAdaptFiltersDialog.isPopupAdaptationAllowed = function() {
							return false;
						};

						const dialogSettings = {
							enableReset: this._hasChanges(),
							confirm: {
								text: this._oRb.getText("FILTER_BAR_OK")
							}
						};

						this._oAdaptFiltersDialog.open(undefined, dialogSettings);
						this._aAddedFilters = [];
						this._oFilterToFocus = undefined;


						fResolve();
					}.bind(this));

					oFilterPanel.setP13nModel(this._oAdaptFiltersDialogModel);

					return;
				}

				fResolve();
			}.bind(this));
		}.bind(this));
	};

	/**
	 * Returns if the variant is modified or not.
	 *
	 * @returns {boolean} <code>true</code> if variant is modified or <code>false</code> if not
	 * @private
	 */
	FilterBar.prototype._hasChanges = function() {
		return !!(this._oVariantManagement?.currentVariantGetModified());
	};

	/**
	 * Maps filter items by their groups after reorder applied
	 *
	 * @param {array} aItems filter items
	 * @returns {array} filter groups with filter items
	 * @private
	 */
	FilterBar.prototype._mapReorderedFilterItemsInGroups = function(aItems) {
		var aResult = [];

		aItems.forEach(function (item) {
			if (!aResult[item.group]) {
				aResult[item.group] = {};
				aResult[item.group].filterItem = null;
				aResult[item.group].items = [];
			}

			if (!aResult[item.group].items) {
				aResult[item.group].items = [];
			}
			aResult[item.group].items.push(this._mAdvancedAreaFilter[item.group].items.find(function(oFilterItem) {
				return oFilterItem.filterItem === item.filterItem;
			}));

			if (!aResult[item.group].filterItem) {
				aResult[item.group].filterItem = item.filterItem;
			}

		}.bind(this));

		return aResult;
	};

	/**
	 * Applies items order in <code>_mAdvancedAreaFilter</code> based on order from variant
	 *
	 * @private
	 */
	FilterBar.prototype._reorderItemsInAdvancedAreaFilter = function () {
		var mState, aReorderedFilterItems;

		mState = this._createStructureForAdaptFiltersDialog();
		aReorderedFilterItems = mState.allFilters;
		this._mAdvancedAreaFilterFlat = aReorderedFilterItems;
		this._mAdvancedAreaFilter = this._mapReorderedFilterItemsInGroups(aReorderedFilterItems);
	};

	/**
	 * Determines if the filters dialog is opened.
	 * @protected
	 * @returns {boolean} State of filters dialog
	 */
	FilterBar.prototype.isDialogOpen = function() {
		return this._oAdaptFiltersDialog;
	};

	FilterBar.prototype._dialogCancel = function(oFilterDialog) {
		if (oFilterDialog) {
			this._bOKFiltersDialogTriggered = false;

			this.fireFiltersDialogCancel();
		}
	};


	FilterBar.prototype._dialogRestore = function() {

		this.reset();

		if (this._oVariantManagement && this._oVariantManagement.getVisible() && !this._oVariantManagement.getInErrorState()) {
			this._oVariantManagement.currentVariantSetModified(false);
		}

		if (this._oAdaptFiltersPanel) {
			var aItemsOrder = [], oAdaptFiltersDialogData = this._oAdaptFiltersDialogModel.getData();

			if (this._bMoveTriggered && this._mAdaptFiltersDialogInitialItemsOrder.length > 0) {
				// apply items order based on _mAdaptFiltersDialogInitialItemsOrder filled in on open dialog from variant
				this._mAdaptFiltersDialogInitialItemsOrder.forEach(function (oItem, iIndex) {
					aItemsOrder[oItem.name] = iIndex;
				});
				oAdaptFiltersDialogData.items.sort(function (a, b) {
					return aItemsOrder[a.name] - aItemsOrder[b.name];
				});
			} else {
				// apply items order based on _aOrderedFilterItems from variant
				this._aOrderedFilterItems.forEach(function (oItem, iIndex) {
					aItemsOrder[oItem.name] = iIndex;
				});
				oAdaptFiltersDialogData.items.sort(function (a, b) {
					return aItemsOrder[a.name] - aItemsOrder[b.name];
				});
				P13nBuilder.sortP13nData({
					visible: "visible",
					position: "position"
				}, oAdaptFiltersDialogData.items);
			}
			this._oAdaptFiltersPanel.setP13nData(oAdaptFiltersDialogData);
		}

		this._bDirtyViaDialog = false;
		this._bResetFiltersDialogTriggered = true;
	};

	FilterBar.prototype._getSearchButton = function () {
		return this.getAggregation("_searchButton");
	};

	FilterBar.prototype._getHideShowButton = function () {
		return this.getAggregation("_hideShowButton");
	};

	FilterBar.prototype._getClearButton = function () {
		return this.getAggregation("_clearButton");
	};

	FilterBar.prototype._getRestoreButton = function () {
		return this.getAggregation("_restoreButton");
	};

	FilterBar.prototype._getFiltersButton = function () {
		return this.getAggregation("_filtersButton");
	};

	FilterBar.prototype._getShowAllFiltersButton = function () {
		return this.getAggregation("_showAllFiltersButton");
	};

	FilterBar.prototype._createButtons = function() {

		const oSearchButton = new Button(this.getId() + "-btnGo", {
			visible: this.getShowGoOnFB(),
			text: this._oRb.getText("FILTER_BAR_GO"),
			type: ButtonType.Emphasized
		}).addStyleClass("sapUiCompFilterBarPaddingRightBtn");

		oSearchButton.addEventDelegate({
			ontouchstart: () => {
				this.bPreventUpdateToolbarText = true;
			},
			ontouchend: () => {
				this.bPreventUpdateToolbarText = false;
				this._updateToolbarText();
				this.fireAssignedFiltersChanged();
			}
		});

		ShortcutHintsMixin.addConfig(
			oSearchButton, {
				event: "search",
				message: this._oRb.getText("FILTER_BAR_GO_BTN_SHORTCUT_HINT"),
				addAccessibilityLabel: true
			},
			this
		);

		oSearchButton.attachPress(() => {
			oSearchButton.focus();
			this._searchFromFilterBar();
		});
		this.setAggregation("_searchButton", oSearchButton);

		const oHideShowButton = new Button(this.getId() + "-btnShowHide", {
			text: this._oRb.getText("FILTER_BAR_HIDE"),
			type: ButtonType.Transparent,
			enabled: false
		}).addStyleClass("sapUiCompFilterBarPaddingRightBtn");
		oHideShowButton.attachPress(() => {
			this._toggleHideShow();
		});
		this.setAggregation("_hideShowButton", oHideShowButton);

		const oClearButtonOnFB = new Button(this.getId() + "-btnClear", {
			visible: this.getShowClearOnFB(),
			text: this._oRb.getText("FILTER_BAR_CLEAR"),
			type: ButtonType.Transparent,
			enabled: false
		}).addStyleClass("sapUiCompFilterBarPaddingRightBtn");
		oClearButtonOnFB.attachPress(() => {
			this.clear();
			if (this.isLiveMode && this.isLiveMode()) {
				this._searchFromFilterBar();
			}
		});
		this.setAggregation("_clearButton", oClearButtonOnFB);

		const oRestoreButtonOnFB = new Button(this.getId() + "-btnRestore", {
			visible: this.getShowRestoreOnFB(),
			text: this._oRb.getText("FILTER_BAR_RESTORE"),
			type: ButtonType.Transparent,
			enabled: false
		}).addStyleClass("sapUiCompFilterBarPaddingRightBtn");
		oRestoreButtonOnFB.attachPress(() => {
			this.reset();
			if (this._oVariantManagement) {
				this._oVariantManagement.currentVariantSetModified(false);
			}
		});
		this.setAggregation("_restoreButton", oRestoreButtonOnFB);

		const oFiltersButton = new Button(this.getId() + "-btnFilters", {
			visible: this.getShowFilterConfiguration(),
			text: this._oRb.getText("FILTER_BAR_ACTIVE_FILTERS_ZERO"),
			type: ButtonType.Transparent,
			enabled: false
		});

		oFiltersButton.attachPress(() => {
			this._filtersButtonPressed();
		});
		this.setAggregation("_filtersButton", oFiltersButton);

		const oShowAllFiltersButton = new Button(this.getId() + "-btnShowAll", {
			text: this._oRb.getText("FILTER_BAR_VH_SHOW_ALL"),
			type: ButtonType.Transparent,
			press: this._toggleAllFilters.bind(this)
		});
		this.setAggregation("_showAllFiltersButton", oShowAllFiltersButton);
	};

	/**
	 * If this methods needs to be deleted, check usage of ecm-cp/sdi app
	 * @private
	 */
	FilterBar.prototype._shouldSkipRenderButtons = function () {
		return this.getUseToolbar();
	};

	/**
	 * If this methods needs to be deleted, check usage of ecm-cp/sdi app
	 * @private
	 */
	FilterBar.prototype._getButtons = function () {
		return [
			this.getAggregation("_searchButton"),
			this.getAggregation("_clearButton"),
			this.getAggregation("_restoreButton"),
			this.getAggregation("_filtersButton")
		];
	};

	FilterBar.prototype._createHeaderTitle = function () {
		const oHeader = new Title(`${this.getId()}-HeadText`, {
			level: this.getHeaderLevel()
		});
		oHeader.addStyleClass("sapMH4Style");
		oHeader.addStyleClass("sapUiCompSmartChartHeader");

		this.setAggregation("_headerTitle", oHeader);
	};

	FilterBar.prototype._toggleAllFilters = function() {
		var oInputToFocus, oDelegate;
		this.setShowAllFilters(!this.getShowAllFilters());
		this._getShowAllFiltersButton().setVisible(!this.getShowAllFilters());

		if (!this._bDelegateAdded && this.getFilterGroupItems()) {
			// After the 'Show all filters' button disappear for acc reasons the focus should go
			// to the input which appears visible in the place of the button
			oInputToFocus = this.getFilterGroupItems()[this._nMaxFiltersByDefault]._getControl();
			oDelegate = {
				onAfterRendering: function () {
					oInputToFocus.focus();
				}
			};
			oInputToFocus.addDelegate(oDelegate, this);
			this._bDelegateAdded = true;
		}
	};

	FilterBar.prototype._shouldSkipRenderFilters = function (index) {
		return this.getIsRunningInValueHelpDialog() && this._nMaxFiltersByDefault === index && !this.getShowAllFilters();
	};

	FilterBar.prototype._shouldRenderAdvancedLayout = function () {
		return this.getAdvancedMode() && !this.getIsRunningInValueHelpDialog();
	};

	/**
	 * Creates the variant management.
	 * @private
	 * @returns {sap.ui.comp.variants.VariantManagement} the VM control
	 */
	FilterBar.prototype._createVariantLayout = function() {

		this._oVariantManagement = this._createVariantManagement();
		this.setAggregation("_variantManagement", this._oVariantManagement);

		if (this._possibleToChangeVariantManagement()) {
			this._oVariantManagement.setVisible(false);
		}

		this._registerVariantManagement();

		return this._oVariantManagement;
	};

	FilterBar.prototype._createToolbar = function() {
		const oToolbar = new AssociativeOverflowToolbar(`${this.getId()}-toolbar`);

		this._oToolbarSpacer = new ToolbarSpacer();
		this._oSeparator = new ToolbarSeparator().addStyleClass("sapUiTinyMarginEnd");

		oToolbar.addContent(this.getAggregation("_headerTitle"));
		oToolbar.addContent(this._oVariantManagement);
		oToolbar.addContent(this._oSeparator);
		oToolbar.addContent(this._oToolbarSpacer);
		oToolbar.addContent(this._getSearchButton());
		oToolbar.addContent(this._getHideShowButton());
		oToolbar.addContent(this._getClearButton());
		oToolbar.addContent(this._getRestoreButton());
		oToolbar.addContent(this._getFiltersButton());

		oToolbar.addStyleClass("sapUiCompFilterBarToolbar");

		this.setAggregation("_toolbar", oToolbar);
	};

	FilterBar.prototype._replaceVariantManagement = function(oVariantManagement) {
		if (this._oVariantManagement) {
			this._unregisterVariantManagement();

			const oToolbar = this.getAggregation("_toolbar");
			if (oToolbar && oToolbar.getContent(this._oVariantManagement)) {
				oToolbar.removeContent(this._oVariantManagement);
			}

			this._oVariantManagement.destroy();
		}

		this._oVariantManagement = oVariantManagement;
		this._registerVariantManagement();
	};

	FilterBar.prototype._prepareFilterItemAndLabel = function(oFilterItem) {
		var oControl = oFilterItem._getControl();
		if (!oControl) {
			Log.error("no Control obtained");
			return null;
		}

		var oLabel = oFilterItem.getLabelControl(this.getId());
		if (!oLabel) {
			Log.error("no Label obtained");
			return null;
		}

		this._adaptGroupTitleForFilter(oFilterItem);

		this._connectLabelAndControl(oFilterItem, oControl, oLabel);
	};

	FilterBar.prototype._connectLabelAndControl = function(oFilterItem, oControl, oLabel) {
		if (oControl.setWidth) {
			oControl.setWidth("100%");
		}

		if (!oLabel) {
			return;
		}

		if (!oLabel.hasStyleClass("sapUiCompFilterLabel")) {
			oLabel.addStyleClass("sapUiCompFilterLabel");
		}

		if (oFilterItem && oControl) {
			oLabel.setLabelFor(oControl);
		}

		if (oFilterItem.getControlTooltip() && oControl.setTooltip) {
			oControl.setTooltip(oFilterItem.getControlTooltip());
		}
	};

	FilterBar.prototype._groupsWithVisibleFilters = function() {
		var nItemsInGroup, oFilterItem, mGroups = this._mAdvancedAreaFilter;
		if (this._mAdvancedAreaFilter && Object.keys(this._mAdvancedAreaFilter).length > 1) {
			mGroups = {};
			for ( var sGroupName in this._mAdvancedAreaFilter) {
				if (sGroupName && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
					nItemsInGroup = this._mAdvancedAreaFilter[sGroupName].items.length;
					for (var i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
						oFilterItem = this._mAdvancedAreaFilter[sGroupName].items[i].filterItem;
						if (oFilterItem && (oFilterItem.getHiddenFilter() || !oFilterItem.getVisible())) {
							nItemsInGroup--;
						}
					}

					if (nItemsInGroup) {
						mGroups[sGroupName] = {};
					}
				}
			}
		}

		return mGroups;
	};

	FilterBar.prototype._setTriggerFilterChangeState = function(bFlag) {

		this._triggerFilterChangeState = bFlag;
	};
	FilterBar.prototype._getTriggerFilterChangeState = function() {

		return this._triggerFilterChangeState;
	};

	/**
	 * Sets the semaphore for variant change.
	 * @private
	 * @param {boolean} bFlag setting the semaphore state
	 */
	FilterBar.prototype._setConsiderFilterChanges = function(bFlag) {

		this._filterChangeSemaphore = bFlag;
	};

	/**
	 * Retrieves the semaphore for variant change.
	 * @private
	 * @returns {boolean} the semaphore state
	 */
	FilterBar.prototype._getConsiderFilterChanges = function() {

		return this._filterChangeSemaphore;
	};

	FilterBar.prototype.fireFilterChange = function(oEvent) {
		if (!this.bPreventUpdateToolbarText) {
			this._updateToolbarText();
			this.fireAssignedFiltersChanged();
		}

		if (!this._getTriggerFilterChangeState()) {
			return;
		}

		if (this._getConsiderFilterChanges() && this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
			this._oVariantManagement.currentVariantSetModified(true);
		}

		if (this._oAdaptFiltersDialog && !(this._oAdaptFiltersDialog.isOpen())) {
			return;
		}

		if (this._oAdaptFiltersDialog) {
			this._bDirtyViaDialog = true;
			this._checkAssignedFilters();
			this._oAdaptFiltersDialog.getResetButton?.()?.setEnabled(true); // enable it as even invalid should be possible to be reset
		}

		this.fireEvent("filterChange", oEvent);
	};

	/**
	 * Prepares event object and fire the 'filterChange' event.
	 * @private
	 * @param {boolean} bVisible indicated whether an filter was added or removed
	 * @param {sap.ui.core.Control} oControl which was either added or removed
	 */
	FilterBar.prototype._notifyAboutChangedFilters = function(bVisible, oControl) {

		var oObj, oFilterItem = this._determineByControl(oControl);

		if (bVisible) {
			oObj = {
				"added": oControl,
				"filterItem": oFilterItem
			};
		} else {
			oObj = {
				"deleted": oControl,
				"filterItem": oFilterItem
			};
		}

		this.fireFilterChange(oObj);

	};

	FilterBar.prototype._determineVariantFiltersInfo = function(bConsiderInvisibleFilters, bIgnoreConsiderFilter) {
		var i;
		var n = null, oItem, oFilter;
		var aFilters = [];
		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					if (this._mAdvancedAreaFilter[n].items) {
						for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
							oItem = this._mAdvancedAreaFilter[n].items[i];
							if (bConsiderInvisibleFilters || oItem.filterItem.getVisible()) {
								oFilter = {
									group: oItem.filterItem.getGroupName(),
									name: oItem.filterItem.getName(),
									partOfCurrentVariant: oItem.filterItem.getPartOfCurrentVariant(),
									visibleInFilterBar: oItem.filterItem.getVisibleInFilterBar(),
									visible: oItem.filterItem.getVisible()
								};
								if (bIgnoreConsiderFilter || this._considerFilter(oFilter)) {
									aFilters.push(oFilter);
								}
							}
						}
					}
				}
			}
		}

		return aFilters;
	};

	FilterBar.prototype.mergeVariant = function(oBase, oDelta) {

		var oMerge = {};
		merge(oMerge, oDelta);
		oMerge.filterbar = [];
		oMerge.filterBarVariant = {};

		merge(oMerge.filterbar, oBase.filterbar);
		merge(oMerge.filterBarVariant, oBase.filterBarVariant);

		if (oDelta && (oDelta.hasOwnProperty("version"))) {
			oMerge.filterbar = this._mergeVariantFields(oMerge.filterbar, oDelta.filterbar);
			oMerge.filterBarVariant = oDelta.filterBarVariant;
		}

		return oMerge;
	};

	FilterBar.prototype._mergeVariantFields = function(aBaseFilters, aDeltaFilters) {

		var i;

		aDeltaFilters.forEach(function(element) {
			for (i = 0; i < aBaseFilters.length; i++) {
				if ((aBaseFilters[i].group === element.group) && (aBaseFilters[i].name === element.name)) {
					aBaseFilters.splice(i, 1);
					break;
				}
			}

		});

		return aBaseFilters.concat(aDeltaFilters);

	};

	FilterBar.prototype._isUi2Mode = function() {
		return this._oVariantManagement instanceof SmartVariantManagementUi2;
	};

	FilterBar.prototype._isDeltaHandling = function() {
		if (this._isUi2Mode()) {
			return false;
		}

		return this.getDeltaVariantMode();
	};

	FilterBar.prototype._getStandardVariant = function() {

		return this._oVariantManagement.getStandardVariant(this);

	};

	FilterBar.prototype._considerFilter = function(oFilter) {

		if (!this._isDeltaHandling()) {
			return true;
		}

		var oBaseFilter = null;
		var oStandardVariant = this._getStandardVariant();
		if (oStandardVariant && oStandardVariant.filterbar) {
			for (var i = 0; i < oStandardVariant.filterbar.length; i++) {
				if ((oStandardVariant.filterbar[i].group === oFilter.group) && (oStandardVariant.filterbar[i].name === oFilter.name)) {
					oBaseFilter = oStandardVariant.filterbar[i];
					break;
				}
			}
		}

		if (!oBaseFilter) {

			if (!oFilter.partOfCurrentVariant) {
				return false;
			}
			return true;
		}

		if ((oBaseFilter.partOfCurrentVariant !== oFilter.partOfCurrentVariant) || (oBaseFilter.visibleInFilterBar !== oFilter.visibleInFilterBar) || (oBaseFilter.visible !== oFilter.visible)) {
			return true;
		}

		return false;
	};

	/**
	 * Determines if an item is relevant for the query, based on its visibility.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem which is being checked
	 * @returns {boolean} true for relevant, false for not relevant
	 */
	FilterBar.prototype._determineVisibility = function(oFilterItem) {

		var bVisible = false;

		if (oFilterItem) {
			bVisible = oFilterItem.getVisible() && (oFilterItem.getVisibleInFilterBar() || this._checkIfFilterHasValue(oFilterItem.getName()));
			bVisible = bVisible && !oFilterItem.getHiddenFilter();
		}

		return bVisible;
	};

	/**
	 * Returns an array of all visible filters.
	 * @private
	 * @returns {array} all visible advanced items
	 */
	FilterBar.prototype._retrieveVisibleAdvancedItems = function() {

		var i, n = null, oItem;
		var aAdvancedItems = [];

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					if (this._mAdvancedAreaFilter[n] && this._mAdvancedAreaFilter[n].items) {
						for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
							oItem = this._mAdvancedAreaFilter[n].items[i];
							if (oItem) {
								if (this._determineVisibility(oItem.filterItem)) {
									aAdvancedItems.push(oItem);
								}
							}
						}
					}
				}
			}
		}

		return aAdvancedItems;
	};

	/**
	 * Retrieves the controls for all visible filters.
	 * @protected
	 * @param {boolean} bWithName determines the returning structure. Either list of controls, or list of filter name and control.
	 * @param {boolean} bConsiderParameters determines if parameters should be considered.
	 * @returns {array} all visible controls/filter name & controls
	 */
	FilterBar.prototype._retrieveCurrentSelectionSet = function(bWithName, bConsiderParameters) {

		var i, oItem, oObj, aArray = [];

		var aItems = this._retrieveVisibleAdvancedItems();

		for (i = 0; i < aItems.length; i++) {
			oItem = aItems[i];
			if (oItem.control && oItem.filterItem && (bConsiderParameters || !oItem.filterItem._isParameter())) {
				if (bWithName) {
					oObj = {
						name: aItems[i].filterItem.getName(),
						control: aItems[i].control
					};
				} else {
					oObj = aItems[i].control;
				}

				aArray.push(oObj);
			}
		}

		return aArray;
	};

	/**
	 * Executes the search event. Controls of all visible filters will be passed as event-parameters.
	 * @public
	 * @returns {boolean} indicates the validation result. true means no validation errors.
	 */
	FilterBar.prototype.search = function() {
		this.fireSearch({
			selectionSet: this._retrieveCurrentSelectionSet(false),
			firedFromFilterBar: this._bSearchFiredFromFilterBar
		});
		this._bSearchFiredFromFilterBar = false;
		return true;
	};

	/**
	 * This method should be called whenever a search of the FilterBar needs to be triggered as if the "Go" button is
	 * pressed.
	 * IMPORTANT: If just a search is needed and no need to simuate "Go" button press, the public "search" method
	 * should be used.
	 *
	 * By calling this method the "search" event of the FilterBar is triggered with additional parameter
	 * that indicates that the search is triggered due to user interaction with the "Go" button. This
	 * effectively simulates a press of the "Go" button.
	 *
	 * @ui5-restricted sap.suite.ui.generic.template, fin.gl.glview.display
	 * @private
	 */
	FilterBar.prototype._searchFromFilterBar = function () {
		this._bSearchFiredFromFilterBar = true;
		this.search.apply(this, arguments);
	};

	/**
	 * Executes the clear event. Controls of all visible filters will be passed as event-parameters.
	 * @private
	 */
	FilterBar.prototype.clear = function() {

		var parameter = {};
		parameter.selectionSet = this._retrieveCurrentSelectionSet(false);

		this._deleteValidatingTokenFlag(parameter.selectionSet);

		this._clearErrorState();

		this.fireClear(parameter);

		this.fireAssignedFiltersChanged();
	};

	FilterBar.prototype._deleteValidatingTokenFlag = function (aSelectionSet) {
		aSelectionSet.forEach(function(oControl) {

			// ignore the token completion
			if (oControl.hasOwnProperty("__bValidatingToken")) {
				delete oControl.__bValidatingToken;
			}
		});
	};

	/**
	 * Executes the reset event. Controls of all visible filters will be passed as event-parameters.
	 * @private
	 */
	FilterBar.prototype.reset = function() {

		var parameter = {};
		parameter.selectionSet = this._retrieveCurrentSelectionSet(false);

		this.fireReset(parameter);

		this._resetVariant();
	};

	/**
	 * Obtains from the variant management the current selected entry and applies the corresponding variant. In case nothing was selected variant
	 * management returns null -> no variant will be applied.
	 * @private
	 */
	FilterBar.prototype._resetVariant = function() {

		var oVariant = null, oVariantSnapshot = null;

		this._resetFiltersInErrorValueState();

		var aSelectionSet = this._retrieveCurrentSelectionSet(false);
		this._deleteValidatingTokenFlag(aSelectionSet);

		if (this._oVariantManagement) { // in case a variant is currently selected, re-apply this variant

			var sKey = this._oVariantManagement.getSelectionKey() || this._oVariantManagement.getStandardVariantKey();
			if (sKey) {

				oVariant = this._oVariantManagement.getVariantContent(this, sKey);
				if (this._oVariant) {
					this._oVariant.content = oVariant;
					this._oVariant.modified = false;

					if (this.getPersistencyKey() && this._oInitialVariant) {
						// BCP: 1780323271
						// reset the snapshot
						this._oInitialVariant.content = oVariant;
						this._oInitialVariant.modified = false;

						// BCP: 1770468283
						// reset the variant key
						this._oInitialVariant.key = sKey;
					}
				}

				if (!this.getPersistencyKey() && (this.getUseSnapshot() === undefined) && this._oInitialVariant && this._oInitialVariant.content) {
					oVariantSnapshot = this._oInitialVariant.content;
				}

				if (oVariant || oVariantSnapshot) {
					this.applyVariant(oVariant || oVariantSnapshot, "RESET");
				}

				if (this._oSelectedVariantBase && this._isFilterBarContext()) {
					this.applyVariant(this._oSelectedVariantBase, "RESET");
				}
			}
		}
	};

	FilterBar.prototype._removeValuesForNonPartOfCurrentVariants = function(aFilterNonPartOfCurrentVariant) {
		// non smart filterbar scenario
	};

	FilterBar.prototype._removeEmptyFilters = function(mFilterValues) {
		// non smart filterbar scenario
		return mFilterValues;
	};

	/**
	 * Retrieve the data for a specific variant and apply it.
	 * @private
	 * @param {object} oVariant the variant
	 * @param {string} sContext may be undefined, RESET or CANCEL and indicates the source of the appliance
	 * @param {boolean} bInitial indicates if the apply was executed during the initialization phase
	 * @param {string} sVersion of the variant
	 */
	FilterBar.prototype._applyVariant = function(oVariant, sContext, bInitial, sVersion) {

		var aFieldsAndValues, aPersFields = null, bTriggerFilterChangeState, bExecuteOnSelection = false, aOrderedFields = [];

		if (oVariant) {

			if (bInitial) {
				bTriggerFilterChangeState = this._getTriggerFilterChangeState();
				this._setTriggerFilterChangeState(false);
			}

			this._setConsiderFilterChanges(false);

			aFieldsAndValues = oVariant.filterBarVariant;
			aPersFields = oVariant.filterbar;

			if (this._oFilterProvider) {
				this._oFilterProvider._setSingleInputsTextArrangementData(JSON.parse(oVariant.singleInputsTextArrangementData || "{}"));
			}

			aOrderedFields = oVariant.orderedFilterItems ? JSON.parse(oVariant.orderedFilterItems) : [];
			if (!aOrderedFields.length) {
				aOrderedFields = this._mAdvancedAreaFilterFlat;
			}

			if (Array.isArray(aPersFields) && aPersFields.length) {
				this._ensureFilterLoaded(aPersFields.filter(function (oField) {
					return oField.visibleInFilterBar;
				}));
			}

			this._applyVariantFields(aFieldsAndValues, sVersion); // BCP: 188new0228255
			var aFilterNonPartOfCurrentVariant = this._reapplyVisibility(aPersFields, (sContext === "CANCEL"));

			this._removeValuesForNonPartOfCurrentVariants(aFilterNonPartOfCurrentVariant);

			if (this._oBasicSearchField && this._oBasicSearchField.setValue) {
				this._oBasicSearchField.setValue(oVariant.basicSearch || "");
			}

			if (oVariant.executeOnSelection) {
				bExecuteOnSelection = oVariant.executeOnSelection;
			}

			this._aOrderedFilterItems = aOrderedFields;
			this._reorderItemsInAdvancedAreaFilter();

			this.fireAfterVariantLoad(sContext, bExecuteOnSelection);

			this._setConsiderFilterChanges(true);

			this.fireAssignedFiltersChanged();

			if (bExecuteOnSelection || (this.getLiveMode && this.getLiveMode())) {
				this._searchFromFilterBar();
			} else if (sContext !== "CANCEL") {
				this._clearErrorState();
			}

			if (bInitial) {
				this._setTriggerFilterChangeState(bTriggerFilterChangeState);
			}

			if ((!sContext || sContext === "RESET") && this._isFilterBarContext()) {
				this._oSelectedVariantBase = oVariant;
			}
		}
	};

	/**
	 * Triggers the registered callBack for fetching the current variant data.
	 * @private
	 * @param {string} sVersion of the variant
	 * @returns {Object} the data representing part of the variant content
	 */
	FilterBar.prototype._fetchVariantFiltersData = function(sVersion) {

		if (this._fRegisteredFetchData) {
			try {
				return this._fRegisteredFetchData(sVersion);
			} catch (ex) {
				Log.error("callback for fetching data throws an exception");
			}
		} else {
			Log.warning("no callback for fetch data supplied");
		}

		return null;
	};

	/**
	 * Triggers the registered callBack for applying the variant data.
	 * @private
	 * @param {object} oJson the data blob representing part of the variant content
	 * @param {string} sVersion of the variant
	 * @returns {object} data to be stored as part of the variant content
	 */
	FilterBar.prototype._applyVariantFields = function(oJson, sVersion) {

		if (this._fRegisteredApplyData) {
			try {
				return this._fRegisteredApplyData(oJson, sVersion);
			} catch (ex) {
				Log.error("callback for applying data throws an exception");
			}
		} else {
			Log.warning("no callback for apply data supplied");
		}
	};

	FilterBar.prototype._isStandardVariant = function() {
		var sKey = this.getCurrentVariantId();
		if (!sKey) {
			return true;
		}
		if (this._oVariantManagement) {
			if ((sKey === this._oVariantManagement.getStandardVariantKey())) {
				return true;
			}

			if (this._oVariantManagement._oStandardVariant === null) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Returns the information whether the flag 'executeOnSelect' is set or not on current variant.
	 * @public
	 * @returns {boolean} Flag 'executeOnSelect' flag. If variant management is disabled <code>false</code> is returned.
	 */
	FilterBar.prototype.isCurrentVariantExecuteOnSelectEnabled = function() {
		if (this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {

			var sKey = this.getCurrentVariantId();
			if (!sKey) {
				return this._oVariantManagement.getExecuteOnSelectForStandardVariant();
			}

			var oItem = this._oVariantManagement.getItemByKey(sKey);
			if (oItem) {
				return oItem.getExecuteOnSelect();
			}
		}
		return false;
	};

	/**
	 * Creates and returns the variant representation.
	 * @returns {sap.ui.comp.filterbar.FilterBar.fetchVariantResponse} An arbitrary Object with an example structure:<br><pre>{<br>  filterBarVariant: any,<br>  filterbar: [<br>    {<br>      group: string,<br>      name: string,<br>      partOfCurrentVariant: boolean,<br>      visible: boolean,<br>      visibleInFilterBar: boolean<br>    },<br>    ...<br>  ],<br>  orderedFilterItems: string,<br>  singleInputsTextArrangementData: string,<br>  version: string|undefined,<br>  basicSearch: string|undefined<br>}</pre>
	 * @public
	 */
	FilterBar.prototype.fetchVariant = function() {

		var aFiltersInfo, oVariant = {}, sBasicSearch, mFilterValues, oFlattenedFilterItems = [];

		if (this._isDeltaHandling()) {
			if (!this._isStandardVariant()) {
				oVariant.version = "V3";
			}
		}

		this.fireBeforeVariantFetch();

		aFiltersInfo = this._determineVariantFiltersInfo(true, !oVariant.version);
		oVariant.filterbar = (!aFiltersInfo) ? [] : aFiltersInfo;

		var fSimplifyFilterItemHandler = function (aFilterItems) {
			aFilterItems.forEach(function (oItem) {
				oFlattenedFilterItems.push({
					name: oItem.name,
					group: oItem.group
				});
			});
		};

		// _aAdaptFilterItems is filled in when move in Adapt Filters Dialog is applied and submitted
		if (this._aAdaptFilterItems && this._aAdaptFilterItems.length > 0) {
			fSimplifyFilterItemHandler(this._aAdaptFilterItems);
			oVariant.orderedFilterItems = JSON.stringify(oFlattenedFilterItems);
		} else {
			// _mAdvancedAreaFilterFlat filled when sfb initialized (see: FilterBar.prototype.fireInitialized)
			if (this._aOrderedFilterItems.length > 0) {
				fSimplifyFilterItemHandler(this._aOrderedFilterItems);
			} else {
				this._mAdvancedAreaFilterFlat = this._getAllFilterItemsFlat(); // refresh
				fSimplifyFilterItemHandler(this._mAdvancedAreaFilterFlat);
			}
			oVariant.orderedFilterItems = JSON.stringify(oFlattenedFilterItems);
		}

		mFilterValues = this._fetchVariantFiltersData(oVariant.version);

		oVariant.filterBarVariant = this._removeEmptyFilters(mFilterValues);
		oVariant.singleInputsTextArrangementData = JSON.stringify(this._oFilterProvider ? this._oFilterProvider._getSingleInputsTextArrangementData() : {});

		sBasicSearch = this._getBasicSearchValue();
		if (sBasicSearch) {
			oVariant.basicSearch = sBasicSearch;
		}

		if (this._oVariant && this._oVariant.content) {
			this._oVariant.content = oVariant;
		}

		if (!this._oSelectedVariantBase || this._oSelectedVariantBase === null) {
			this._oSelectedVariantBase = oVariant;
		}

		return oVariant;
	};

	/**
	 * Applies the variant.
	 * @param {Object} oVariant JSON object
	 * @param {string} sContext Describes in which context the variant is applied. The context is passed on to the application via the
	 *        afterVariantLoad event
	 * @param {boolean} bInitial indicates if the apply was executed during the initialization phase.
	 * @public
	 */
	FilterBar.prototype.applyVariant = function(oVariant, sContext, bInitial) {

		if (oVariant.hasOwnProperty("version")) {
			oVariant = this.mergeVariant(this._getStandardVariant(), oVariant, sContext);
		}

		this._applyVariant(oVariant, sContext, bInitial, oVariant.version);
		this.invalidate();
	};

	/**
	 * Retrieves the mandatory filters.
	 * @public
	 * @returns {array} Of visible mandatory filters
	 */
	FilterBar.prototype.determineMandatoryFilterItems = function() {

		var i;
		var aMandatoryFilters = [];

		var aItems = this._retrieveVisibleAdvancedItems();

		for (i = 0; i < aItems.length; i++) {
			if (aItems[i].filterItem.getMandatory() === true) {
				if (aItems[i].control) {
					aMandatoryFilters.push(aItems[i].filterItem);
				}
			}
		}

		return aMandatoryFilters;
	};

	/**
	 * Determines the visible filters that need async validation ignoring the custom filters.
	 *
	 * @param {object} oSettings Settings
	 * @param {boolean} [oSettings.bAll = false]
	 * @param {boolean} [oSettings.bMandatory = false]
	 * @param {boolean} [oSettings.bNonMandatory = false]
	 * @returns {array} Of async filters
	 */
	FilterBar.prototype.determineAsyncFilters = function(oSettings) {
		var i,
			oControl,
			oFilterItem,
			aFilters = [],
			aFilterItems = this.getAllFilterItems(true);

		for (i = 0; i < aFilterItems.length; i++) {
			oFilterItem = aFilterItems[i];
			oControl = this.determineControlByFilterItem(oFilterItem, true);

			if (oControl &&
				oControl.isA("sap.m.ComboBox") &&
				oControl.getDomRef() !== null &&
				!oFilterItem.data("isCustomField")) {
					if (oSettings.bAll) {
						aFilters.push(oFilterItem);
					} else if ( oSettings.bNonMandatory && !oFilterItem.getMandatory()) {
						aFilters.push(oFilterItem);
					} else if ( oSettings.bMandatory && oFilterItem.getMandatory()) {
						aFilters.push(oFilterItem);
					}
			}
		}

		return aFilters;
	};

	/**
	 * Retrieves the control associated to the filter.
	 *
	 * @public
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem From the aggregations
	 * @param {boolean} bConsiderParameters check also analytics parameter
	 * @returns {sap.ui.core.Control} The corresponding control. If no match is found <code>null</code> is returned.
	 */
	FilterBar.prototype.determineControlByFilterItem = function(oFilterItem, bConsiderParameters) {

		var i, n = null;
		var oItem, oGroupElement;

		if (!oFilterItem || (!bConsiderParameters && oFilterItem._isParameter())) {
			return null;
		}

		if (this._aBasicAreaSelection) {
			for (i = 0; i < this._aBasicAreaSelection.length; i++) {
				oItem = this._aBasicAreaSelection[i];
				if (oFilterItem === oItem.filterItem) {
					return oItem.control;
				}
			}
		}

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					oGroupElement = this._mAdvancedAreaFilter[n];
					if (oGroupElement && oGroupElement.items) {
						for (i = 0; i < oGroupElement.items.length; i++) {
							oItem = oGroupElement.items[i];
							if ((bConsiderParameters || !oItem.filterItem._isParameter()) && (oFilterItem === oItem.filterItem)) {
								return oItem.control;
							}
						}
					}
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves the control based on the name and group name.
	 *
	 * @public
	 * @param {string} sName Name of the filter.
	 * @param {string} [sGroupName] Group name of the filter; <code>null</code> for filter that belongs to basic group.
	 * @returns {sap.ui.core.Control} The corresponding control, if no match is found, <code>null</code> is returned.
	 */
	FilterBar.prototype.determineControlByName = function(sName, sGroupName) {

		var oItem = this._determineEnsuredItemByName(sName, sGroupName);
		if (oItem && oItem.filterItem && !oItem.filterItem._isParameter()) {
			return oItem.control;
		}

		return null;
	};

	/**
	 * Retrieves the associated label based on the name and group name.
	 * @public
	 * @param {string} sName Name of the filter.
	 * @param {string} sGroupName Group name of the filter; <code>null</code> for filter that belongs to basic group.
	 * @returns {sap.m.Label} The associated Label, if no match is found, <code>null</code> is returned.
	 */
	FilterBar.prototype.determineLabelByName = function(sName, sGroupName) {

		var oItem = this._determineEnsuredItemByName(sName, sGroupName);
		if (oItem && oItem.filterItem) {
			return oItem.filterItem._oLabel;
		}

		return null;
	};

	FilterBar.prototype._determineEnsuredItemByName = function(sName, sGroupName) {

		if (!sGroupName) {
			sGroupName = this._determineGroupNameByName(sName);
		}

		this._ensureFilterLoaded([
			{
				name: sName,
				group: sGroupName
			}
		]);

		return this._determineItemByName(sName, sGroupName);
	};

	FilterBar.prototype._determineGroupNameByName = function(sName) {

		if (this._aFields) {
			for (var i = 0; i < this._aFields.length; i++) {
				if (this._aFields[i].fieldName === sName) {
					return this._aFields[i].groupName;
				}
			}
		}

		var oFilterItem = this._determineFilterItemByName(sName);
		if (oFilterItem) {
			var sGroupName = oFilterItem.getGroupName();
			if (sGroupName !== FilterBar.INTERNAL_GROUP) {
				return sGroupName;
			}
		}

		return null;
	};

	/**
	 * Retrieves the internal filter representation based on the name and (optional) group name.
	 * @private
	 * @param {string} sName the control's name
	 * @param {string} sGrpName sGroupName is null for basic area
	 * @returns {object} the corresponding internal item. If no match is found null will returned.
	 */
	FilterBar.prototype._determineItemByName = function(sName, sGrpName) {

		var i;
		var oItem, oGroupElement;
		var sGroupName = sGrpName;

		if (!sName) {
			return null;
		}

		if (!sGroupName) {
			sGroupName = FilterBar.INTERNAL_GROUP;
		}

		if (this._mAdvancedAreaFilter) {
			// check the filter
			oGroupElement = this._mAdvancedAreaFilter[sGroupName];
			if (oGroupElement && oGroupElement.items) {
				for (i = 0; i < oGroupElement.items.length; i++) {
					oItem = oGroupElement.items[i];
					if (oItem && oItem.filterItem && (oItem.filterItem.getName() === sName)) {
						return oItem;
					}
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves the filter corresponding to the filter name.
	 *
	 * @public
	 * @param {string} sName the control's name
	 * @param {string} sGroupName the filter's group name
	 * @returns {sap.ui.comp.filterbar.FilterGroupItem} the corresponding filter item. If no match is found <code>null</code> will returned.
	 */
	FilterBar.prototype.determineFilterItemByName = function(sName, sGroupName) {

		var oItem;
		if (sGroupName){
			oItem = this._determineEnsuredItemByName(sName, sGroupName);
		} else {
			oItem = this._determineEnsuredItemByName(sName);
		}

		if (oItem && oItem.filterItem) {
			return oItem.filterItem;
		}

		return null;
	};

	FilterBar.prototype._determineFilterItemByName = function(sName) {

		var n, oItem;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				oItem = this._determineItemByName(sName, n);
				if (oItem) {
					return oItem.filterItem;
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves for a given control the corresponding filter.
	 * @private
	 * @param {sap.ui.core.Control} oControl for a filter
	 * @returns {object} the corresponding internal representation. If no match is found null will returned.
	 */
	FilterBar.prototype._determineByControl = function(oControl) {

		var n = null, i;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					var oGroupElement = this._mAdvancedAreaFilter[n];
					if (oGroupElement && oGroupElement.items) {
						for (i = 0; i < oGroupElement.items.length; i++) {
							if (oGroupElement.items[i] && oGroupElement.items[i].control === oControl) {
								return oGroupElement.items[i];
							}
						}
					}
				}
			}
		}

		return null;
	};

	FilterBar.prototype._applyAttributes = function(){
		if (this._isPhone() || this._isTablet()) {
			var aVisibleFiltersFieldArray = this.getAllFilterItems(true);
			if (aVisibleFiltersFieldArray.length > 0) {
				for (var i = 0; i < aVisibleFiltersFieldArray.length; i++) {
					var oCurrentField = aVisibleFiltersFieldArray[i],
						oControl = oCurrentField._getControl(),
						sName = oCurrentField.getName();
					this._applyInputModeAttribute(oControl, sName);
				}
			}
		}
	};

	FilterBar.prototype._applyInputModeAttribute = function(oControl, sName) {
		if (this._oFilterProvider && this._oFilterProvider._aFilterBarNumericFieldMetadata && this._oFilterProvider._aFilterBarNumericFieldMetadata.indexOf(sName) !== -1) {
			var oDomRef = oControl.getDomRef("inner");
			if (oDomRef) {
				oDomRef.setAttribute("inputmode", "decimal");
				oDomRef.setAttribute("pattern", "[0-9]+([\.,][0-9]+)?");
			}
		}
	};

	FilterBar.prototype._destroyLazyFilterControl = function() {
		var j, oField;

		if (this._aFields && (this._aFields.length > 0)) {
			// delete eventuell not yet created filteritems
			if (this._aFields && this._aFields.length > 0) {
				for (j = 0; j < this._aFields.length; j++) {
					oField = this._aFields[j];

					if (oField.factory) {
						/* eslint-disable no-lonely-if */
						if (oField.control) {
							oField.control.destroy();
						}
						/* eslint-enable no-lonely-if */
					}
				}
			}
		}
	};

	FilterBar.prototype._removeInputRenderingDelegate = function() {
		var i, n, oItem;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n && this._mAdvancedAreaFilter[n] && this._mAdvancedAreaFilter[n].items) {
					for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
						oItem = this._mAdvancedAreaFilter[n].items[i];
						if (oItem && oItem.control && oItem.control._onAfterInputRenderingDelegate) {
							oItem.control.removeDelegate(oItem.control._onAfterInputRenderingDelegate);
						}
					}
				}
			}
		}
	};

	FilterBar.prototype._destroyFilterControls = function() {

		if (!this.getAdvancedMode()) {

			// delete eventuell not yet created filteritems
			this._destroyLazyFilterControl();
		}

		this._removeInputRenderingDelegate();
	};

	FilterBar.prototype._registerVariantManagement = function() {
		if (this._oVariantManagement) {
			this._oVariantManagement.attachSave(this._variantSave, this);
			this._oVariantManagement.attachAfterSave(this._afterVariantSave, this);
		}
	};

	FilterBar.prototype._unregisterVariantManagement = function() {

		if (this._oVariantManagement) {

			if (this._fInitialiseVariants) {
				this._oVariantManagement.detachInitialise(this._fInitialiseVariants);
				this._fInitialiseVariants = null;
			}

			this._oVariantManagement.detachSave(this._variantSave, this);
			this._oVariantManagement.detachAfterSave(this._afterVariantSave, this);

			// VM was created by the smart filterbar without a toolbar and has a custom-data persistency key
			// BCP: 1680052358
			// Destroy the VM whenever it was created, but not added to the UI-tree
			// BCP: 1670396582
			if ((!this.getUseToolbar() || this.getAdvancedMode()) && !this._oVariantManagement.getDomRef()) {
				this._oVariantManagement.destroy();
			}
		}
	};

	/**
	 * For backward compatibility. Creates adapt filters dialog
	 * @public
	 */
	FilterBar.prototype.showFilterDialog = function() {
		if (!this._oAdaptFiltersDialog) {
			this.showAdaptFilterDialog();
		}
	};

	/**
	 * Enables to add application specific content to the filters dialog. If the content was not yet added it will be added. The content will be set
	 * to visible, all other filters dialog content will be set to invisible.
	 * Not implemented yet for the new Adapt Filters Dialog
	 * @public
	 * @deprecated As of version 1.84 with no replacement.
	 * @param {sap.ui.core.Control} oContent to be added; if empty, nothing is inserted.
	 * @returns {sap.ui.core.Control|null} <code>oContent</code> added or <code>null</code> when filters dialog is not active
	 */
	FilterBar.prototype.addFilterDialogContent = function(oContent) {
		if (this._oAdaptFiltersDialog) {
			return oContent;
		}
		return null;
	};

	/**
	 * Returns the filter dialog content. <code>Node:</code>The original content is a {@link sap.ui.layout.form.Form Form}. The form may be
	 * enhanced with a toolbar to enable the inner switch to an added custom content. Besides such operations, the original content should not be
	 * manipulated in any way.
	 * @public
	 * @deprecated As of version 1.84 with no replacement.
	 * @returns {array} of filters dialog content.
	 */
	FilterBar.prototype.getFilterDialogContent = function() {
		if (this._oAdaptFiltersDialog) {
			return new Form();
		}

		return null;
	};

	/**
	 * Once set, the activation of the 'Adapt Filters' button will open the 'old' filters dialog.
	 * This method offers an intermediate solution for the visual filters scenario,
	 * which relies on the old filters dialog.
	 * @deprecated As of version 1.84 with no replacement.
	 * @protected
	 */
	FilterBar.prototype.setShowOldFilterDialog = function()	{
		// Do nothing. This method will be removed
	};

	/**
	 * Returns the first filter control whose ID matches the passed parameter
	 * @param {string} sId The ID of the filter control
	 * @returns {sap.ui.core.Control} The filter control or null
	 * @private
	 */
	FilterBar.prototype._getFilterControlById = function(sId) {
		for (var sGroupName in this._mAdvancedAreaFilter){
			var oGroup = this._mAdvancedAreaFilter[sGroupName];
			for (var i = 0; i < oGroup.items.length; i++){
				var oItem = oGroup.items[i];
				if (oItem.control && oItem.control.getId() === sId){
					return oItem.control;
				}
			}
		}
		return null;
	};


	/**
	 * Returns the visible filter control at position <code>nIndex</code>
	 * @param {number} nIndex The position of the filter control
	 * @returns {sap.ui.core.Control} The filter control or null
	 * @private
	 */
	FilterBar.prototype._getFilterControlByIndex = function(nIndex){
		var counter = 0;
		for (var sGroupName in this._mAdvancedAreaFilter){
			var oGroup = this._mAdvancedAreaFilter[sGroupName];
			for (var i = 0; i < oGroup.items.length; i++){
				var oItem = oGroup.items[i];
				if (oItem.filterItem.getVisibleInFilterBar()){
					if (counter === nIndex) {
						return oItem.control;
					}
					counter++;
				}
			}
		}
	};

	/**
	* Checks if <code>sLabel</code> is contained in <code>aLabels</code>
	 * @param {array} aLabels An array of {@link sap.m.Label}
	 * @param {string} sLabel The label text whose match we look for among <code>aLabels</code>
	 * @returns {boolean} True if <code>sLabel<code> matches at least one label text from <code>aLabels</code>
	 */
	function containsLabel(aLabels, sLabel){
		var aMatches = aLabels.filter(function(l){ return l.getText() === sLabel;});
		return aMatches.length > 0;
	}

	/**
	 * Returns the first filter control whose ID matches the passed parameter
	 * @param {string} sLabel The label text for which we want to obtain the filter control
	 * @returns {sap.ui.core.Control} The filter control or null if the text doesn't match the label of any filter
	 * @private
	 */
	FilterBar.prototype._getFilterControlByLabel = function(sLabel) {
		for (var sGroupName in this._mAdvancedAreaFilter){
			var oGroup = this._mAdvancedAreaFilter[sGroupName];
			for (var i = 0; i < oGroup.items.length; i++){
				var oItem = oGroup.items[i];
				if (oItem.control){
					if (containsLabel(oItem.control.getLabels(), sLabel)){
						return oItem.control;
					}
				}
			}
		}
	};

	/**
	 * Checks if a filter is part of the basic filter group
	 * @param {object} oFilterItem The filter item
	 * @returns {boolean} True if <code>oFilterItem</code> is part of <code>FilterBar.INTERNAL_GROUP</code>
	 * @private
	 */
	FilterBar.prototype._isFilterItemInBasicGroup = function(oFilterItem){
		return oFilterItem && !oFilterItem.getGroupName() || oFilterItem.getGroupName() === FilterBar.INTERNAL_GROUP;
	};

	FilterBar.prototype._shouldBeVisible = function(mItem){
		return (mItem.filterItem.getMandatory() && !this._hasFilterValue(mItem.filterItem)) || (mItem.name === "_BASIC_SEARCH_FIELD");
	};

	/**
	 * @override
	 */
	FilterBar.prototype.exit = function() {
		Control.prototype.exit.apply(this, arguments);

		this._unregisterVariantManagement();

		this._destroyFilterControls();

		window.sessionStorage.removeItem(this.getId());
		window.sessionStorage.removeItem("semanticDates");

		if (this._oAdaptFiltersDialog) {
			this._oAdaptFiltersDialog.destroy();
			this._oAdaptFiltersDialog = null;
		}

		if (this._oAdaptFiltersDialogModel) {
			this._oAdaptFiltersDialogModel = null;
		}

		if (this._oAdaptFiltersPanel) {
			this._oAdaptFiltersPanel = null;
		}

		if (this.oModel) {
			this.oModel.destroy();
			this.oModel = null;
		}

		if (this._oToolbarSpacer) {
			this._oToolbarSpacer.destroy();
			this._oToolbarSpacer = null;
		}
		if (this._oSeparator) {
			this._oSeparator.destroy();
			this._oSeparator = null;
		}

		this._aFields = null;

		this._aBasicAreaSelection = null;
		this._mAdvancedAreaFilter = null;
		this._oVariantManagement = null;

		this._oCollectiveSearch = null;

		this._oVariant = null;

		this._fRegisteredFetchData = null;
		this._fRegisteredApplyData = null;
		this._fRegisterGetFiltersWithValues = null;
		this._fRegisteredFilterChangeHandlers = null;

		this._oBasicSearchField = null;

		this._bSearchFiredFromFilterBar = false;
		this._oInitializedDeferred = null;
		this._bDelegateAdded = false;
		Localization.detachChange(this._onLocalizationChanged);
	};

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#insertFilterItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#insertFilterGroupItem
	 * @private
	 */

	return FilterBar;

});
