/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.valuehelpdialog.ValueHelpDialog.
sap.ui.define([
	"sap/ui/core/ControlBehavior",
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	'sap/ui/core/date/UI5Date',
	'sap/base/Log',
	'sap/ui/comp/library',
	'sap/m/Dialog',
	'sap/m/MessageBox',
	'sap/m/Token',
	'./ItemsCollection',
	'sap/ui/core/library',
	'sap/m/VBox',
	'sap/m/HBox',
	'sap/m/FlexBox',
	'sap/ui/comp/util/FormatUtil',
	'sap/m/FlexItemData',
	'sap/m/Title',
	'sap/m/Text',
	'sap/m/Label',
	'sap/m/Button',
	'sap/m/Bar',
	'sap/m/OverflowToolbarLayoutData',
	'sap/m/Tokenizer',
	'sap/m/Panel',
	'sap/m/StandardListItem',
	'sap/m/IconTabBar',
	'sap/m/IconTabFilter',
	'sap/m/library',
	'sap/ui/core/InvisibleText',
	'sap/ui/core/InvisibleMessage',
	'sap/ui/core/IconPool',
	'sap/ui/table/library',
	'sap/ui/table/Table',
	'sap/ui/table/Column',
	'sap/ui/table/rowmodes/Type',
	'sap/ui/table/rowmodes/Auto',
	'sap/m/Table',
	'sap/m/Column',
	'sap/m/table/columnmenu/Menu',
	"sap/m/table/columnmenu/QuickSort",
	"sap/m/table/columnmenu/QuickSortItem",
	'sap/ui/layout/HorizontalLayout',
	'sap/ui/layout/Grid',
	'sap/ui/Device',
	'sap/m/List',
	'sap/m/Link',
	'sap/ui/comp/p13n/P13nFilterPanel',
	'sap/m/P13nConditionPanel',
	'sap/m/P13nItem',
	'sap/m/P13nAnyFilterItem',
	'sap/m/CheckBox',
	'sap/ui/comp/p13n/P13nOperationsHelper',
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/ResizeHandler",
	'sap/base/strings/whitespaceReplacer',
	"sap/ui/table/plugins/MultiSelectionPlugin",
	"sap/ui/comp/rules/RulesLog",
	'sap/m/Toolbar',
	"sap/ui/core/util/ResponsivePaddingsEnablement",
	"sap/m/plugins/CellSelector",
	"sap/m/ToolbarSpacer",
	"sap/m/OverflowToolbar",
	"sap/m/plugins/CopyProvider",
	'sap/ui/model/Sorter',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function(
	ControlBehavior,
	Element,
	Library,
	UI5Date,
	Log,
	library,
	Dialog,
	MessageBox,
	Token,
	ItemsCollection,
	coreLibrary,
	VBox,
	HBox,
	FlexBox,
	FormatUtil,
	FlexItemData,
	Title,
	Text,
	Label,
	Button,
	Bar,
	OverflowToolbarLayoutData,
	Tokenizer,
	Panel,
	StandardListItem,
	IconTabBar,
	IconTabFilter,
	mLibrary,
	InvisibleText,
	InvisibleMessage,
	IconPool,
	TableLibrary,
	UiTable,
	UiColumn,
	UiRowModeType,
	UiAutoRowMode,
	Table,
	Column,
	ColumnMenu,
	QuickSort,
	QuickSortItem,
	HorizontalLayout,
	Grid,
	Device,
	List,
	Link,
	P13nFilterPanel,
	P13nConditionPanel,
	P13nItem,
	P13nAnyFilterItem,
	CheckBox,
	P13nOperationsHelper,
	NumberFormat,
	ResizeHandler,
	whitespaceReplacer,
	MultiSelectionPlugin,
	RulesLog,
	Toolbar,
	ResponsivePaddingsEnablement,
	CellSelector,
	ToolbarSpacer,
	OverflowToolbar,
	CopyProvider,
	Sorter,
	Filter,
	FilterOperator
) {
	"use strict";

	var AnalyticalColumn;
	var SmartTable;

	// shortcut for sap.m.ButtonType
	var ButtonType = mLibrary.ButtonType;

	// shortcut for sap.m.OverflowToolbarPriority
	var OverflowToolbarPriority = mLibrary.OverflowToolbarPriority;

	// shortcut for sap.m.ListMode
	var ListMode = mLibrary.ListMode;
	var ListType = mLibrary.ListType;
	// shortcut for sap.ui.core.HorizontalAlign
	var HorizontalAlign = coreLibrary.HorizontalAlign;
	// shortcut for sap.ui.core.InvisibleMessageMode
	var InvisibleMessageMode = coreLibrary.InvisibleMessageMode;
	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	// shortcut for sap.ui.comp.smartfilterbar.DisplayBehaviour
	var DisplayBehaviour = library.smartfilterbar.DisplayBehaviour;

	var ValueState = coreLibrary.ValueState;

	var ValueHelpDeprecationCode = library.ValueHelpDeprecationCode;

	var _ValueHelpViewMode = {
		DESKTOP_LIST_VIEW: "DESKTOP_LIST_VIEW",
		DESKTOP_CONDITIONS_VIEW: "DESKTOP_CONDITIONS_VIEW",
		PHONE_MAIN_VIEW: "PHONE_MAIN_VIEW",
		PHONE_SEARCH_VIEW: "PHONE_SEARCH_VIEW",
		PHONE_LIST_VIEW: "PHONE_LIST_VIEW",
		PHONE_CONDITIONS_VIEW: "PHONE_CONDITIONS_VIEW"
	};

	/**
	 * Constructor for a new valuehelpdialog/ValueHelpDialog.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class
	 * <h3>Overview</h3>
	 * The <codeph>ValueHelpDialog</codeph> helps the user to find and select single and multiple values. The user can also define and select multiple conditions.
	 * The control is generally called from an input field or a multi-input field by clicking the selection icon (value help icon) of the input field.
	 *
	 * This control only supports OData V2 model (see {@link sap.ui.model.odata.v2.ODataModel})
	 *
	 * <h3>Usage</h3>
	 * <h4>When to use:</h4>
	 * <ul>
	 * <li>The user is searching within a very large dataset </li>
	 * <li>The user needs to use different attributes to find an object (such as city, company name, and so on). </li>
	 * <li>The user needs to define conditions, such as ranges and exclusions. </li>
	 * </ul>
	 * <h4>When not to use:</h4>
	 * <li>There is a simpler control that fits the use case. Always start with the least complex control.
	 * For example, use the select control if the user needs to select only one item from a short list. </li>
	 * @extends sap.m.Dialog
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.valuehelpdialog.ValueHelpDialog
	 */
	var ValueHelpDialog = Dialog.extend("sap.ui.comp.valuehelpdialog.ValueHelpDialog", /** @lends sap.ui.comp.valuehelpdialog.ValueHelpDialog.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			properties: {
				/**
				 * Defines the value for the basic search field. The value is set into the basic search field of the filter bar used.
				 *
				 * @since 1.24
				 */
				basicSearchText: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Enables multi-selection in the table used.
				 *
				 * @since 1.24
				 */
				supportMultiselect: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Enables the ranges (conditions) feature in the dialog.
				 *
				 * @since 1.24
				 */
				supportRanges: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If this property is set to <code>true</code>, the value help dialog only supports the ranges (conditions) feature.
				 *
				 * @since 1.24
				 */
				supportRangesOnly: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Defines the key of the column used for the internal key handling. The value of the column is used for the token key and also to
				 * identify the row in the table.
				 *
				 * @since 1.24
				 */
				key: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Defines the list of additional keys of the column used for the internal key handling.
				 *
				 * @since 1.24
				 */
				keys: {
					type: "string[]",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the key of the column used for the token text.
				 *
				 * @since 1.24
				 */
				descriptionKey: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Defines the maximum number of include ranges.  If value is 0 - the include group of operators should not be displayed.
				 *
				 * @deprecated As of version 1.84.1, replaced by <code>maxConditions</code>.
				 */
				maxIncludeRanges: {
					type: "string",
					group: "Misc",
					defaultValue: '-1',
					deprecated: true
				},

				/**
				 * Defines the maximum number of exclude ranges. If value is 0 - the exclude group of operators should not be displayed.
				 *
				 * @deprecated As of version 1.84.1, replaced by <code>maxConditions</code>.
				 */
				maxExcludeRanges: {
					type: "string",
					group: "Misc",
					defaultValue: '-1',
					deprecated: true
				},

				/**
				 * Defines the maximum number of conditions allowed to be added.
				 *
				 * @since 1.84.1
				 */
				maxConditions : {
					type: "string",
					group: "Misc",
					defaultValue: '-1'
				},

				/**
				 * Represents the display format of the range values. With the <code>displayFormat</code> value UpperCase, the entered value of the
				 * range (condition) is converted to uppercase letters.
				 *
				 * @since 1.24
				 */
				displayFormat: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Represents how the item token text should be displayed in ValueHelpDialog. Use one of the valid
				 * <code>sap.ui.comp.smartfilterbar.DisplayBehaviour</code> values.
				 *
				 * @since 1.24
				 */
				tokenDisplayBehaviour: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Sets the dialog into a filter mode, which only shows ranges (conditions) and hides the tokens.
				 *
				 * @since 1.24
				 */
				filterMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Used by the ValueHelpProvider to enable enhanced exclude operations
				 * @private
				 * @since 1.74
				 */
				_enhancedExcludeOperations: {
					type: "boolean",
					group: "Misc",
					defaultValue: false,
					visibility: "hidden"
				},

				/**
				 * Sets default operation for Condition Panel of the value help dialog. In case the newly set
				 * default operation is not valid for the filter's EDM data type, then it is ignored.
				 * expected sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
				 *
				 * @private
				 * @ui5-restricted sap.ui.comp.valuehelpdialog.ValueHelpDialog
				 * @since 1.99
				 */
				conditionPanelDefaultOperation: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * Sets usage of <code>MultiSelectionPlugin</code>. If enabled the default behaviour is changed
				 * and the <code>ValueHelpDialog</code> table uses the plugin which provides only "Deselect all" option
				 * and the ability for range selection. Also a limit of 200 items that are able to be selected as a
				 * restriction.
				 *
				 * Note: Using <code>MultiSelectionPlugin</code> mode the method <code>update</code> will return a
				 * promise.
				 *
				 * @since 1.113
				 */
				enabledMultiSelectionPlugin: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},
				/**
				 * Used by the ValueHelpProvider to set calendar week setting to date controls in condition panel
				 * @private
				 * @since 1.119
				 */
				_conditionPanelCalendarWeekSettings: {
					type: "string",
					group: "Misc",
					defaultValue: "",
					visibility: "hidden"
				},
				/**
				 * Used by the <code>ValueHelpProvider</code> to set the <code>showCurrentDateButton</code> property
				 * settings to the date controls in the condition panel.
				 * @private
				 * @since 1.122
				 */
				_conditionPanelShowCurrentDateButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false,
					visibility: "hidden"
				}
			},
			aggregations: {

				/**
				 * Allows you to add a {@link sap.ui.comp.filterbar.FilterBar FilterBar} or
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar SmartFilterBar} control to the value help dialog.
				 */
				filterBar: {
					type: "sap.ui.comp.filterbar.FilterBar",
					multiple: false
				}
			},
			events: {

				/**
				 * This event is fired when the OK button is pressed.
				 *
				 * @since 1.24
				 */
				ok: {
					parameters: {
						/**
						 * The array of tokens created or modified on the ValueHelpDialog.
						 */
						tokens: {
							type: "sap.m.Token[]"
						}
					}
				},

				/**
				 * This event is fired when the Cancel button is pressed.
				 *
				 * @since 1.24
				 */
				cancel: {},

				/**
				 * This event is fired when the user selects an item in the items table.
				 *
				 * <b>Note:</b> The event will only be raised when the dialog gets a table
				 * instance from outside via <code>setTable</code>.
				 *
				 * @since 1.32
				 */
				selectionChange: {
					parameters: {
						/**
						 * The RowSelectionChange event parameter from the hosted table that contains the selected items.
						 */
						tableSelectionParams: {
							type: "object"
						},

						/**
						 * Returns an array of objects which represents all selected row tokens. The object contains the token key, the row object
						 * data from the model, and the information if the token is selected. <code>
						 *  [{sKey, oRow, bSelect}, ...]
						 *  </code>
						 */
						updateTokens: {
							type: "object[]"
						},

						/**
						 *
						 * When the value is <code>true</code>, then the default behavior of <code>ValueHelpDialog</code> will be executed.
						 */
						useDefault: {
							type: "boolean"
						},

						/**
						 * The table instance used
						 * @since 1.58
						 */
						table: {
							type: "object"
						}
					}
				},

				/**
				 * This event is fired when the user removes one or multiple existing token(s) from the dialog.
				 *
				 * <b>Note:</b> The event will only be raised when the dialog gets a table
				 * instance from outside via <code>setTable</code>.
				 *
				 * @since 1.32
				 */
				tokenRemove: {
					parameters: {
						/**
						 * The array of token keys that has been removed.
						 */
						tokenKeys: {
							type: "string[]"
						},

						/**
						 * When the value is <code>true</code>, then the default behavior of <code>ValueHelpDialog</code> will be executed.
						 */
						useDefault: {
							type: "boolean"
						}
					}

				},

				/**
				 * This event is fired when the table gets an update and all existing tokens must be selected in the table.
				 *
				 * <b>Note:</b> The event will only be raised when the dialog gets a table
				 * instance from outside via <code>setTable</code>.
				 *
				 * @since 1.32
				 */
				updateSelection: {
					parameters: {
						/**
						 * The array of existing token keys for which the selection in the table has to be updated.
						 */
						tokenKeys: {
							type: "string[]"
						},

						/**
						 * When the value is <code>true</code>, then the default behavior of <code>ValueHelpDialog</code> will be executed.
						 */
						useDefault: {
							type: "boolean"
						}
					}

				}
			}
		},
		renderer: {
			apiVersion: 2
		}
	});

	ResponsivePaddingsEnablement.call(ValueHelpDialog.prototype, {
		header: {suffix: "header"},
		subHeader: {selector: ".compVHNavigationContainer .sapMITH"},
		content: {selector: ".compVHContentContainer"},
		footer: {selector: ".sapMDialogFooter .sapMIBar"}
	});

	ValueHelpDialog.prototype.setSupportMultiselect = function(bEnabled) {
		this.setProperty("supportMultiselect", bEnabled);

		this._updatePropertySupportMultiselect(bEnabled);

		this._oTokenizerGrid.setVisible(bEnabled);
		this._oButtonOk.setVisible(bEnabled);
		return this;
	};

	ValueHelpDialog.prototype._updatePropertySupportMultiselect = function(bEnabled) {
		if (!this._oTable) {
			return undefined;
		}

		if (!this._isPhone()) {
			if (this._oTable.setSelectionMode) {
				this._oTable.setSelectionMode(bEnabled ? TableLibrary.SelectionMode.MultiToggle : TableLibrary.SelectionMode.Single);
			}
		} else if (this._oTable.setMode) {
			this._oTable.setMode(bEnabled ? ListMode.MultiSelect : ListMode.SingleSelectLeft);
		}

		return this;
	};

	ValueHelpDialog.prototype.setSupportRanges = function(bEnabled) {
		this.setProperty("supportRanges", bEnabled);

		this._updateNavigationControl();

		return this;
	};

	ValueHelpDialog.prototype.setSupportRangesOnly = function(bEnabled) {
		this.setProperty("supportRangesOnly", bEnabled);

		this._updateNavigationControl();
		return this;
	};

	// Sets the Title of the dialog.
	// The value is used for the different titles which we display during runtime on the dialog header.
	// The dialog title changes depending on the content.
	ValueHelpDialog.prototype.setTitle = function(sTitle) {
		this.setProperty("title", sTitle);

		this._updateDlgTitle();

		return this;
	};

	ValueHelpDialog.prototype.setFilterBar = function(oCtrl) {
		this.setAggregation("filterBar", oCtrl);

		if (this._oMainLayout && oCtrl) {
			if (this._isPhone()) {
				if (this._oFilterBar) {
					// Remove the old filterbar.
					this._oContentContainer.removeItem(this._oFilterBar);
					this._oFilterBar.detachInitialise(this._handleFilterBarInitialize);
				}

			} else if (this._oFilterBar) {
				// Remove the old filterbar.
				this._oMainLayout.removeItem(this._oFilterBar);
				this._oFilterBar.detachInitialise(this._handleFilterBarInitialize);
			}

			this._oFilterBar = oCtrl;

			this._oFilterBar.attachInitialise(this._handleFilterBarInitialize, this);

			if (this._oFilterBar) {

				this._oFilterBar.addStyleClass("compVHSearch");

				if (this._isPhone()) {
					// Let the Search Field on a phone show the search icon.
					var oSearchField = Element.getElementById(this._oFilterBar.getBasicSearch());
					if (oSearchField && oSearchField.isA("sap.m.SearchField")) {
						oSearchField.setShowSearchButton(true);
						oSearchField.attachSearch(function(oEvent) {
							if (oEvent.mParameters.refreshButtonPressed !== undefined) { // Workaround to ignore the remove icon click on the
								// Search control.
								this.getFilterBar().search();
							}
						}.bind(this));
					}
					this._oFilterBar.setShowGoOnFB(false);

					// Add the Collective Search as first item into the VBox.
					this._oColSearchBox.setLayoutData(new FlexItemData({
						shrinkFactor: 0
					}));
					this._oContentContainer.insertItem(this._oColSearchBox, 0);

					// The Filterbar with the Basic Search is the second item.
					this._oFilterBar.setLayoutData(new FlexItemData({
						shrinkFactor: 0
					}));
					this._oContentContainer.insertItem(this._oFilterBar, 1);

					// On the phone listen on the Search event to show the LIST_VIEW.
					this._oFilterBar.attachSearch(function(oEvent) {
						this._updateView(_ValueHelpViewMode.PHONE_LIST_VIEW);
					}.bind(this));

					if (this._currentViewMode === _ValueHelpViewMode.PHONE_LIST_VIEW) {
						// update the Filterbar states
						this._oFilterBar.setVisible(true);
						this._oFilterBar.setFilterBarExpanded(false);
						this._handleFilterBarInitialize();
					}
				} else {
					// for Tablet and Desktop add the Filterbar into the mainGrid and place the CollectiveSearch inside the Filterbar.
					this._oFilterBar._setCollectiveSearch(this._oColSearchBox);
					this._oMainLayout.insertItem(this._oFilterBar, 0);
				}
			}

			// set the initial Focus on the Search/Go button if not in the scenario of VHD with both FilterBar and Conditions
			if (_isVisibleTabBarItems(this._oTabBar) && this._oFilterBar?._oBasicSearchField?.getValueState?.() !== ValueState.Error) {
				this.setInitialFocus(this._oTabBar.getItems()[0]);
			} else if (this._oFilterBar.getAggregation("_searchButton")) {
				this.setInitialFocus(this._oFilterBar.getAggregation("_searchButton"));
			}

			// Try to fill the basic search text into the SmartFilterBar and set the initial Focus.
			if (this._oFilterBar._oBasicSearchField) {
				var oBasicSearchField = this._oFilterBar._oBasicSearchField;
				oBasicSearchField.setValue(this.getBasicSearchText());
				if (!_isVisibleTabBarItems(this._oTabBar)){
					this.setInitialFocus(oBasicSearchField);
				}
			}
		}
		return this;
	};

	ValueHelpDialog.prototype._handleFilterBarInitialize = function() {
		if (this._currentViewMode === _ValueHelpViewMode.PHONE_LIST_VIEW) {
			// update the Filterbar states
			var bShowAdvancedSearch = this._oFilterBar && this._oFilterBar.getFilterGroupItems() && this._oFilterBar.getFilterGroupItems().length > 0;
			this._oAdvancedSearchLink.setVisible(bShowAdvancedSearch);
			this._oFilterBar.setShowGoOnFB(!(this._oFilterBar && this._oFilterBar.getBasicSearch()));
		}
		this._setToolbarSpacerWidth();
		// When filterBar's initialise event is fired set the focus on the Basic Search if not in the scenario of both FilterBar and Conditions
		if (_isVisibleTabBarItems(this._oTabBar)) {
			this.setInitialFocus(this._oTabBar.getItems()[0]);
		} else if (this._oFilterBar && this._oFilterBar._oBasicSearchField) {
			this.setInitialFocus(this._oFilterBar._oBasicSearchField);
		}
	};

	ValueHelpDialog.prototype.getFilterBar = function() {
		return this._oFilterBar;
	};

	ValueHelpDialog.prototype.setBasicSearchText = function(sText) {
		this.setProperty("basicSearchText", sText);

		if (this._oFilterBar && this._oFilterBar._oBasicSearchField) {
			this._oFilterBar._oBasicSearchField.setValue(sText);
		}

		return this;
	};

	/**
	 * Sets the array of tokens. The <code>sap.m.Tokens</code> are added to the dialog tokenizer.
	 * Normal tokens are selected in the table. <code>new sap.m.Token({key: "0001", text:"SAP A.G. (0001)"});</code>
	 * Tokens with the extra data with value 'range' are handled as range tokens or exclude range tokens. <code>
	 * new sap.m.Token({key: "i1", text: "ID: a..z"}).data("range", { "exclude": false, "operation": sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.BT, "keyField": "CompanyCode", "value1": "a", "value2": "z"});
	 * </code>
	 * The selected items or range tokens are returned in the event parameters of the Ok event.
	 *
	 * @public
	 * @since 1.24
	 * @param {sap.m.Token[]} aTokens An array of token controls
	 */
	ValueHelpDialog.prototype.setTokens = function(aTokens) {
		var bUpdateTokens = true;

		if (aTokens.length) {
			var n = 0,
				sKey;
			for (var i = 0; i < aTokens.length; i++) {
				var token = aTokens[i];
				if (token.data("range")) {
					var range = Object.assign({}, token.data("range"));
					sKey = token.getKey();
					if (!sKey) {
						do {
							sKey = "range_" + n;
							n++;
						} while (this._oSelectedRanges[sKey]);
					}
					var theTokenText = this._getFormatedRangeTokenText(range.operation, range.value1, range.value2, range.exclude, range.keyField);
					this._addToken2Tokenizer(sKey, theTokenText, this._getTokenizer(), range.keyField);

					this._oSelectedRanges[sKey] = range;
					bUpdateTokens = false; // because is done in _addToken2Tokenizer
				} else {
					sKey = token.getKey();
					var sText = token.getText();
					var sLongKey = token.data("longKey");
					var oRowData = token.data("row");
					if (!sLongKey) {
						sLongKey = sKey;
					}

					this._oSelectedItems.add(sLongKey, oRowData ? oRowData : token.getText());

					var oToken = new Token(_getTokenId.call(this, sLongKey));
					oToken.setKey(sLongKey);
					oToken.setText(sText);
					oToken.setTooltip(sText);
					this._getTokenizer().addToken(oToken);
				}
			}
		} else {
			this._oSelectedItems.removeAll();
			this._oSelectedRanges = {};
			this._getTokenizer().destroyTokens();
		}

		if (bUpdateTokens) {
			this._updateTokenizer();
		}
	};

	ValueHelpDialog.prototype.open = function() {
		var oConditionPanel,
                    oConditionGrid,
                    oConditionGridContent,
                    oConditionsOperationComboBox,
                    oConditionsOperationValue1;
		// if table not loaded -> load is async and open dialog afterwards
		if (!this._oTable && !(this._isPhone() && (this.getSupportRangesOnly() || this.getFilterMode()))) {
			return _createDefaultTableAsync.call(this).then(function() {
				return this.open();
			}.bind(this));
		}
		this._bIgnoreSelectionChange = false;

		if (this._oColSearchBox) {
			this._bIsMdcCollectiveSearch = this._oColSearchBox.isA("sap.ui.mdc.valuehelp.CollectiveSearchSelect");

			if (this._bIsMdcCollectiveSearch) {
				this.bCollectiveSearchActive = this._oColSearchBox.getVisible();
			} else {
				this.bCollectiveSearchActive = this.oSelectionTitle.getVisible() && this.oSelectionButton.getVisible();
				this._oColSearchBox.setVisible(this.bCollectiveSearchActive);
			}
		}
		if (!this._isPhone()) {
			if (this.getSupportRangesOnly() || this.getFilterMode()) {
				this._updateView(_ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW);
			}
			// set the default dialog width for Tablet/Desktop only when in is not set explicitly
			if (this.isPropertyInitial("contentWidth")) {
				this.setContentWidth(this._getDefaultContentWidth());
			}
		} else {
			this._updateView(_ValueHelpViewMode.PHONE_MAIN_VIEW);
		}
		this.addStyleClass("sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer" );

		Dialog.prototype.open.apply(this);
		// When the FilterBar is used without metadata the initialise event is not fired so
		// we need to set the initial focus on the basic search after opening the dialog
		if (_isVisibleTabBarItems(this._oTabBar)) {
			this.setInitialFocus(this._oTabBar.getItems()[0]);
		} else if (this._oFilterBar && this._oFilterBar._oBasicSearchField) {
			this.setInitialFocus(this._oFilterBar._oBasicSearchField);
		} else if (!this._oFilterBar && this._currentViewMode === "DESKTOP_CONDITIONS_VIEW") {
			if (this._oFilterPanel) {
				oConditionPanel = this._oFilterPanel && this._oFilterPanel._oConditionPanel;
				oConditionGrid = oConditionPanel && oConditionPanel._oConditionsGrid;
				oConditionGridContent = oConditionGrid && oConditionGrid.getAggregation("content")[0];
				oConditionsOperationComboBox = oConditionGrid && oConditionGridContent.operation;
				if (oConditionsOperationComboBox && oConditionsOperationComboBox.getEnabled()) {
					this.setInitialFocus(oConditionsOperationComboBox);
				} else {
					oConditionsOperationValue1 = oConditionGridContent.value1;
					this.setInitialFocus(oConditionsOperationValue1);
				}
			}
		}
		return this;
	};

	/**
	 * Gives access to the internal table instance.
	 *
	 * @public
	 * @returns {sap.m.Table|sap.ui.table.Table|sap.ui.comp.smarttable.SmartTable} the used table instance
	 * @since 1.28
	 * @deprecated As of version 1.60.0, replaced by {@link sap.ui.comp.valuehelpdialog.ValueHelpDialog#getTableAsync} to prevent synchronous calls.
	 */
	ValueHelpDialog.prototype.getTable = function() {
		Log.warning("Please use getTableAsync to prevent synchronous calls.", this);
		if (!this._oTable) {
			this._createDefaultTable();
		}

		return this._oTable;
	};

	/**
	 * Gives access to the internal table instance.
	 *
	 * @public
	 * @returns {Promise<Object<sap.m.Table|sap.ui.table.Table|sap.ui.comp.smarttable.SmartTable>>} Promise that, if resolved, returns the table object
	 * @since 1.58
	 */
	ValueHelpDialog.prototype.getTableAsync = function() {
		if (this._oTablePromise) {
			return this._oTablePromise;
		} else if (!this._oTable) {
			return _createDefaultTableAsync.call(this);
		} else {
			return new Promise(function(fResolve) {
				fResolve(this._oTable);
			}.bind(this));
		}

	};

	/**
	 * Handling SmartTable specifics
	 * @param {sap.ui.comp.smarttable.SmartTable} oTable
	 * @private
	 */
	ValueHelpDialog.prototype._handleSmartTable = function (oTable) {
		// Handle initial row count
		oTable.attachBeforeRebindTable(function () {
			var oInner = oTable.getTable();
			if (oInner && oInner.isA("sap.ui.table.Table")) {
				oInner.attachEventOnce("rowsUpdated", this._updateTableTitle.bind(this));
			}
		}.bind(this));
	};

	/**
	 * Sets the table used in the value help dialog. If not used, the dialog creates a sap.ui.table.Table or sap.m.Table instance internally.
	 *
	 * @param {sap.m.Table|sap.ui.table.Table|sap.ui.comp.smarttable.SmartTable} oTable The used table control instance
	 *
	 * @since 1.32
	 * @public
	 */
	ValueHelpDialog.prototype.setTable = function(oTable) {
		if (this._oTable) {
			this._oMainLayout.removeItem(this._oTable);
			if (this._bTableCreatedInternal) {
				this._oTable.destroy();
				this._oTable = null;
			}
		}

		this._bTableCreatedInternal = (arguments.length > 1) && (arguments[1] == true);

		if (oTable && oTable.isA("sap.ui.comp.smarttable.SmartTable")) {
			this._oTable = oTable.getTable();
			this._handleSmartTable(oTable);
		} else {
			this._oTable = oTable;
		}

		if (this._oTable && this._oTable.isA("sap.ui.table.Table")) {

			this._oTable.setEnableBusyIndicator(true);

			if (this._oTable.isA("sap.ui.table.AnalyticalTable")) {
				AnalyticalColumn = sap.ui.require("sap/ui/table/AnalyticalColumn");
			}
		}

		this._oTable.setLayoutData(new FlexItemData({
			shrinkFactor: 0,
			growFactor: 1
		}));

		this.theTable = this._oTable; // support old public theTable property for usage outside the class

		this._initializeTable();
		this._oMainLayout.addItem(oTable);
	};

	/**
	 * return the default ContentWidth for the dialog
	 *
	 * @private
	 * @returns {string} The width in px
	 */
	ValueHelpDialog.prototype._getDefaultContentWidth = function() {

		var iWidth;
		if (Device.system.desktop) {
			iWidth = 1080;
		} else if (Device.system.tablet) {
			if (Device.orientation.landscape) {
				iWidth = 920;
			} else if (Device.orientation.portrait) {
				iWidth = 600;
			}
		}

		return iWidth + "px";
	};

	/**
	 * Resets the table binding and changes the table NoDataText to "Please press Search Button".
	 *
	 * @private
	 * @since 1.24
	 */
	ValueHelpDialog.prototype.resetTableState = function() {
		if (this._oTable) {
			if (this._oTable.unbindRows) {
				this._oTable.unbindRows();
			}
			this._updateNoDataText(this._oRb.getText("VALUEHELPDLG_TABLE_PRESSSEARCH"));
		}
	};

	/**
	 * Recreate the default table
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._recreateTable = function () {
		this._oDefaultSmartTable && this._oDefaultSmartTable.destroy();
		this._oTable && this._oTable.destroy();
		this._oTablePromise = null;
		this._oDefaultSmartTable = null;
		this._oTable = null;
		this._initCopyProvider();

		return _createDefaultTableAsync.call(this).then(() => {
			if (this._oTable && this._oTable.isA("sap.ui.table.Table")) {
				setRowMode(this._oTable, UiRowModeType.Auto);
			}
			return this._oTablePromise;
		});
	};

	/**
	 * Changes the table NoDataText to "Please press Search Button".
	 *
	 * @private
	 * @since 1.24
	 */
	ValueHelpDialog.prototype.TableStateSearchData = function() {
		this._updateNoDataText(this._oRb.getText("VALUEHELPDLG_TABLE_PRESSSEARCH"));
	};

	/**
	 * Changes the table NoDataText.
	 *
	 * @param {string} sNoDataText Text for "no data" information
	 * @private
	 * @since 1.40
	 */
	ValueHelpDialog.prototype._updateNoDataText = function(sNoDataText) {
		if (this._oTable) {
			if (this._oTable.setNoData) {
				this._oTable.setNoData(sNoDataText);
			} else if (this._oTable.setNoDataText) {
				this._oTable.setNoDataText(sNoDataText);
			}
		}
	};

	/**
	 * Changes the table NoDataText to "No Data found!".
	 *
	 * @private
	 * @since 1.24
	 */
	ValueHelpDialog.prototype.TableStateDataFilled = function() {
		this._updateNoDataText(this._oRb.getText("VALUEHELPDLG_TABLE_NODATA"));
	};

	/**
	 * Changes the table NoDataText to "Searching...".
	 *
	 * @private
	 * @since 1.28
	 */
	ValueHelpDialog.prototype.TableStateDataSearching = function() {
		this._updateNoDataText(this._oRb.getText("VALUEHELPDLG_TABLE_SEARCHING"));
	};

	/*
	 * Initializes the control.
	 */
	ValueHelpDialog.prototype.init = function() {
		Dialog.prototype.init.apply(this);

		this._oTokenIdCount = {};

		this._bTableCreatedInternal = false;

		this._aIncludeRangeOperations = {};
		this._aExcludeRangeOperations = {};
		this._iMaxIncludeRanges = -1; // same as default value for property maxIncludeRanges
		this._iMaxExcludeRanges = -1; // same as default value for property maxExcludeRanges
		this._bInitTokensHaveChanged;
		this.setStretch(this._isPhone());
		this.setResizable(!this._isPhone());
		this.setDraggable(!this._isPhone());

		this.bCollectiveSearchActive = false;

		// init the Dialog itself
		this.addStyleClass("compValueHelpDialog");

		// init some resources
		this._oRb = Library.getResourceBundleFor("sap.ui.comp");
		this._sTableTitle1 = this._oRb.getText("VALUEHELPDLG_TABLETITLE1");
		this._sTableTitle2 = this._oRb.getText("VALUEHELPDLG_TABLETITLE2");
		this._sSmartTableTableTitle = this._oRb.getText("VALUEHELPDLG_TABLETITLE3");
		this._sTableTitleNoCount = this._oRb.getText("VALUEHELPDLG_TABLETITLENOCOUNT");

		this._currentViewMode = null;
		this._oSelectedItems = new ItemsCollection();
		this._oSelectedRanges = {};
		this._oOperationsHelper = new P13nOperationsHelper();
		this._fnRejectTablePromise;
		this.update = this.update.bind(this);

		this._createHeaderBar();

		this._createCollectiveSearch();

		this._createTokenizer();
		this._updateTokenizer();

		this._oNavigationContainer = new VBox(this.getId() + "-navigationContainer", {
			width: "100%",
			layoutData: new FlexItemData({
				growFactor: 0,
				shrinkFactor: 0
			})
		}).addStyleClass("compVHNavigationContainer");

		this._oContentContainer = new VBox(this.getId() + "-vbox", {
			width:"100%",
			height: "100%"
		}).addStyleClass("compVHContentContainer");

		this._oContainersWrapper = new FlexBox(this.getId() + "-containersWrapper", {
			alignItems:"Start",
			height:"100%",
			width:"100%",
			direction:"Column",
			justifyContent:"SpaceBetween",
			items: [
				this._oNavigationContainer,
				this._oContentContainer
			]
		});

		this.addContent(this._oContainersWrapper);

		this._oMainLayout = new VBox(this.getId() + "-mainLayout", {
			fitContainer: true,
			items: [
				this._oFilterBar
			],
			layoutData: new FlexItemData({
				growFactor: 1,
				shrinkFactor: 0,
				styleClass: "mainLayout"
			})
		});

		this._createNavigationControl();
		this._updateNavigationControl();

		this._oContentContainer.addItem(this._oMainLayout);

		if (this.getMaxIncludeRanges() === "-1" && this.getMaxExcludeRanges() !== "0" && !this.getFilterMode()) {
			this._oContentContainer.addItem(this._oTokenizerGrid);
		}

		this._createFooterControls();

		// vertical scrolling of the dialog content is disabled to get the expected layout of the used VBox in the content.
		// scrolling itself is enabled via css overflow-y: auto
		this.setVerticalScrolling(false);
		this.setHorizontalScrolling(false);

		// to support touch scrolling we have to set the event to marked, otherwise when using a sap.m.App touch events are not handled.
		if (!Device.system.desktop) {
			this._oContentContainer.attachBrowserEvent("touchmove", function(event) {
				event.setMarked();
			});
		}

		if (!this._isPhone()) {
			this._updateView(_ValueHelpViewMode.DESKTOP_LIST_VIEW);
		}

		if (!this._oInvisibleMessage) {
			this._oInvisibleMessage = InvisibleMessage.getInstance();
		}

		this._oRulesLog = new RulesLog();
		this._initCopyProvider();

		this._initResponsivePaddingsEnablement();
	};

	ValueHelpDialog.prototype._initCopyProvider = function() {
		this._oCopyProvider = new CopyProvider({});
	};

	/**
	 * Update the visible view of the dialog. The method is changing the visibility of the used controls to only show the required parts of the view.
	 *
	 * @private
	 * @param {_ValueHelpViewMode} newViewMode View mode which should be shown
	 */
	ValueHelpDialog.prototype._updateView = function(newViewMode) {
		if (this._currentViewMode === newViewMode) {
			return;
		}

		switch (newViewMode) {
			case _ValueHelpViewMode.DESKTOP_LIST_VIEW:
				this._validateRanges(function() {
					// when valid show the Items Table
					this._oTokenizerGrid.setVisible(this.getSupportMultiselect());
					this._oMainLayout.removeAllItems();
					if (this._oTabBar && this._oTabBar.getSelectedKey() !== _ValueHelpViewMode.DESKTOP_LIST_VIEW) {
						this._oTabBar.setSelectedKey(_ValueHelpViewMode.DESKTOP_LIST_VIEW);
					}
					this._oMainLayout.addItem(this._oFilterBar);
					this._oMainLayout.addItem(this._oDefaultSmartTable || this._oTable);
					this._updateDlgTitle();
				}.bind(this), function() {
					// if not valid go back to the Ranges Tab
					this._oTabBar.setSelectedKey(_ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW);
					this._updateView(_ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW);
				}.bind(this));
				break;

			case _ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW:

				if (this.getSupportRanges()) {
					this._oMainLayout.removeAllItems();
					if (this._oTabBar && this._oTabBar.getSelectedKey() !== _ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW) {
						this._oTabBar.setSelectedKey(_ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW);
					}
					this._createAddRanges();
					this._oButtonOk.setVisible(this.getSupportRangesOnly() || this.getSupportMultiselect());

					this._oTokenizerGrid.setVisible(this.getSupportMultiselect());
					if (!(this.getMaxIncludeRanges() === "-1" && this.getMaxExcludeRanges() !== "0" && !this.getFilterMode())) {
						this._oTokenizerGrid.setVisible(false);
					}
				}
				break;

			case _ValueHelpViewMode.PHONE_MAIN_VIEW:
				this.setVerticalScrolling(false);

				this._oColSearchBox.setVisible(false);
				this._oMainListMenu.setVisible(true);
				this._updateNavigationControl();
				this._oAdvancedSearchLink.setVisible(false);
				if (this._oFilterBar) {
					this._oFilterBar.setVisible(false);
					this._oFilterBar.setFilterBarExpanded(false);
				}
				if (this._oTable) {
					this._oTable.setVisible(false);
				}

				this._oTokenizerGrid.setVisible(this.getSupportMultiselect());
				if (!(this.getMaxIncludeRanges() === "-1" && this.getMaxExcludeRanges() !== "0" && !this.getFilterMode())) {
					this._oTokenizerGrid.setVisible(false);
				}

				if (this._oRanges) {
					this._oRanges.setVisible(false);
				}

				this._oButtonGo.setVisible(false);
				this._oButtonClear.setVisible(false);
				this._oButtonOk.setVisible(true);
				this._oButtonCancel.setVisible(true);
				this._oBackButton.setVisible(false);

				this._bNoneMainView = false;
				// if we do not show the Tokenizer (Selected/Excluded Items and only have either a List or the Condition part as ListItem we directly
				// open the List or Condition view in the dialog
				if (!(this._oSelectItemLI.getVisible() && this._oDefineConditionsLI.getVisible())) {
					this._bNoneMainView = true; // used to not show the backbutton on the list and condition view
					if (this._oSelectItemLI.getVisible()) {
						// make the Selection Table visible by default
						this._updateView(_ValueHelpViewMode.PHONE_LIST_VIEW);
					}
					if (this._oDefineConditionsLI.getVisible()) {
						// make the condition screen visible by default
						this._updateView(_ValueHelpViewMode.PHONE_CONDITIONS_VIEW);
					}
					return;
				}

				break;

			case _ValueHelpViewMode.PHONE_LIST_VIEW:
				this.setVerticalScrolling(true);

				this._oColSearchBox.setVisible(this.bCollectiveSearchActive);
				if (this._bIsMdcCollectiveSearch) {
					this._oColSearchBox.addStyleClass("sapUiTinyMarginBegin");
					this._oColSearchBox.oVariantText.removeStyleClass("sapUiMdcCollectiveSearchSelectTextPhoneMaxWidth");
				}
				this._oMainListMenu.setVisible(false);
				if (this._oFilterBar) {
					var bShowAdvancedSearch = this._oFilterBar && this._oFilterBar.getFilterGroupItems() && this._oFilterBar.getFilterGroupItems().length > 0;
					this._oAdvancedSearchLink.setVisible(bShowAdvancedSearch);
					this._oFilterBar.setShowGoOnFB(!(this._oFilterBar && this._oFilterBar.getBasicSearch()));
					this._oFilterBar.setVisible(true);
					this._oFilterBar.setFilterBarExpanded(false);
				}
				if (this._oTable) {
					this._oTable.setVisible(true);
				}
				this._oTokenizerGrid.setVisible(false);
				if (this._oRanges) {
					this._oRanges.setVisible(false);
				}

				this._oButtonGo.setVisible(false);
				this._oButtonClear.setVisible(false);
				this._oButtonOk.setVisible(this.getSupportMultiselect());
				this._oButtonCancel.setVisible(true);
				this._oBackButton.setVisible(!this._bNoneMainView);
				break;

			case _ValueHelpViewMode.PHONE_SEARCH_VIEW:
				this.setVerticalScrolling(true);

				this._oColSearchBox.setVisible(false);
				this._oMainListMenu.setVisible(false);
				if (this._oFilterBar) {
					this._oFilterBar.setVisible(true);
					this._oFilterBar.setFilterBarExpanded(true);
				}
				this._oAdvancedSearchLink.setVisible(false);
				if (this._oTable) {
					this._oTable.setVisible(false);
				}
				this._oTokenizerGrid.setVisible(false);
				if (this._oRanges) {
					this._oRanges.setVisible(false);
				}

				this._oButtonGo.setVisible(true);
				this._oButtonClear.setVisible(this._oFilterBar && this._oFilterBar.getShowClearOnFB());
				this._oButtonOk.setVisible(false);
				this._oButtonCancel.setVisible(true);
				this._oBackButton.setVisible(true);
				break;

			case _ValueHelpViewMode.PHONE_CONDITIONS_VIEW:
				this.setVerticalScrolling(true);

				this._oColSearchBox.setVisible(false);
				this._oMainListMenu.setVisible(false);
				if (this._oFilterBar) {
					this._oFilterBar.setVisible(false);
				}
				this._oAdvancedSearchLink.setVisible(false);
				if (this._oTable) {
					this._oTable.setVisible(false);
				}
				this._oTokenizerGrid.setVisible(false);
				if (!this._oRanges) {
					this._createAddRanges();
				}
				if (this._oRanges) {
					this._oRanges.setVisible(true);
				}

				this._oButtonGo.setVisible(false);
				this._oButtonClear.setVisible(false);
				this._oButtonOk.setVisible(true);
				this._oButtonCancel.setVisible(true);
				this._oBackButton.setVisible(!this._bNoneMainView);
				break;

			default:
				break;
		}

		if (this._oMainListMenu && this._oContentContainer) {
			/**
			 * @deprecated As of 1.70
			 */
			(function() {
				this._oContentContainer.rerender();
			}.bind(this))();
		}

		this._currentViewMode = newViewMode;
		this._updateDlgTitle();
	};

	/**
	 * select or deselect the row in the table with the given key
	 *
	 * @private
	 * @param {string} sKey the key of the row
	 * @param {boolean} bSelect specifies if the row should be selected or deselected
	 */
	ValueHelpDialog.prototype._changeTableRowSelectionForKey = function(sKey, bSelect) {
		var i;
		var oTable = this._oTable;
		var oTableSelectionInstance = oTable;
		if (this._isMultiSelectionPluginAvailable()) {
			oTableSelectionInstance = oTable._getSelectionPlugin();
		}

		this._bIgnoreSelectionChange = true;

		if (oTable && oTable.isA("sap.ui.table.Table")) {
			var rows = oTable.getBinding("rows");
			if (rows) {
				if (rows.aKeys) {
					for (i = 0; i < rows.aKeys.length; i++) {
						if (decodeURIComponent(rows.aKeys[i]) === sKey) {
							if (bSelect) {
								oTableSelectionInstance.addSelectionInterval(i, i);
							} else {
								oTableSelectionInstance.removeSelectionInterval(i, i);
							}
							break;
						}
					}
				} else {
					this.oRows = oTable.getBinding("rows");
					if (this.oRows.aIndices) {
						for (i = 0; i < this.oRows.aIndices.length; i++) {
							var oContext = oTable.getContextByIndex(this.oRows.aIndices[i]);
							if (oContext) {
								var oRow = oContext.getObject();
								if (oRow[this.getKey()] === sKey) {
									if (bSelect) {
										oTableSelectionInstance.addSelectionInterval(i, i);
									} else {
										oTableSelectionInstance.removeSelectionInterval(i, i);
									}
									break;
								}
							}
						}
					}
				}
			}
		} else {

			// Handle selection update of the m.table
			for (i = 0; i < oTable.getItems().length; i++) {
				var oColListItem = oTable.getItems()[i];
				var oRowData = oColListItem.getBindingContext().getObject();
				if (oRowData[this.getKey()] === sKey) {
					oTable.setSelectedItem(oColListItem, bSelect);
					break;
				}
			}

		}

		this._bIgnoreSelectionChange = false;

	};

	/**
	 * Updates the selection of rows in the table. This function must be called after a first binding or binding update of the table. It will set a
	 * table row as selected if a token for this row exists.
	 *
	 * @public
	 * @since 1.24
	 */
	ValueHelpDialog.prototype.update = function() {
		if (this._oRulesLog) {
			this._oRulesLog.setInvokedMethod("update", true);
		}
		if (!this._oDefaultSmartTable) {
			this._oTable?.getBinding("rows")?.attachEventOnce("dataReceived", function() {
				var iLength = this._oTable.getBinding("rows").getLength();

				this._addInvisibleMessageSearchAndTableCount(iLength);
			}, this);
		}
		if (!this.getEnabledMultiSelectionPlugin()) {
			return this._updateSync();
		} else {
			return this._updateAsync();
		}
	};

	/**
	 * Updates the selection of rows in the table. This function must be called after a first binding or binding update of the table. It will set a
	 * table row as selected if a token for this row exists.
	 *
	 * @private
	 * @since 1.112
	 */
	ValueHelpDialog.prototype._updateSync = function() {
		var i, j, oRow, oContext;
		var sKey;
		var aItems = this._oSelectedItems.getItems();
		var eventArgs = {
			tokenKeys: aItems,
			useDefault: false
		};
		var oTableSelectionInstance;
		if (this._oTable) {
			oTableSelectionInstance = this._oTable;
			if (this._isMultiSelectionPluginAvailable()) {
				oTableSelectionInstance = this._oTable._getSelectionPlugin();
			}
		}

		this._bIgnoreSelectionChange = true;

		if (this._hasListeners("updateSelection")) {
			this.fireUpdateSelection(eventArgs);
		} else {
			eventArgs.useDefault = true;
		}

		if (eventArgs.useDefault) {

			if (this._oTable && this._oTable.isA("sap.ui.table.Table")) {

				this.oRows = this._oTable.getBinding("rows");
				oTableSelectionInstance.clearSelection();

				if (this.oRows && this.oRows.aKeys) {
					var aKeys = this.getKeys();
					var sRowKeyPartPrefix = aKeys && aKeys.length > 1 ? this.getKey() + "=" : "";

					// in case of an oDataModel binding the aKeys exist and the row will be found via the keys.
					for (j = 0; j < aItems.length; j++) {
						sKey = aItems[j];
						//sKeyEncoded = encodeURIComponent(sKey); //key of the item must be encoded before we search the item in the table row keys.

						//TODO instead of using encodeURI of the Token key we could try to use the oDataModel.createKey function to build the row key from the Token
						//var sPath = this.oRows.sPath.slice(1);
						//var oRowData = this._oSelectedItems.getItem(aItems[j]);
						//var sKey2 = this.getModel().createKey(sPath, oRowData);

						var sRowKeyPart = sRowKeyPartPrefix + "'" + sKey + "'";

						for (i = 0; i < this.oRows.aKeys.length; i++) {
							var sRowKey = this.oRows.aKeys[i];
							if (sRowKey === undefined) {
								continue;
							}
							sRowKey = decodeURIComponent(sRowKey);
							var bIsRow = sRowKey === sKey;
							if (bIsRow || // either the rowKey is equal the token key or we search if the main key with the value is part of the rowKey
								sRowKey.indexOf(sRowKeyPart) >= 0) {

								if (!bIsRow) { // in this case we will update the old key and use the longKey from the rows
									this._oSelectedItems.remove(sKey); // remove the old key
									// and update the Token key
									var token = this._getTokenByKey(sKey, this._getTokenizer());
									if (token) {
										token.setKey(sRowKey);
									}
								}

								// update the row data in the selectedItems List
								oContext = this._oTable.getContextByIndex(i);
								if (oContext) {
									oRow = oContext.getObject();
									this._oSelectedItems.add(sRowKey, oRow);
								}

								// make the row selected
								oTableSelectionInstance.addSelectionInterval(i, i);
								break;
							}
						}
					}
				} else if (this.oRows && this.oRows.aIndices) {
					oTableSelectionInstance.clearSelection();
					var oTableContexts = this._oTable.getBinding("rows").getContexts();
					for (j = 0; j < aItems.length; j++) {
						var key = aItems[j];
						for (i = 0; i < this.oRows.aIndices.length; i++) {
							oContext = oTableContexts[i];
							if (oContext) {
								oRow = oContext.getObject();
								if (oRow[this.getKey()] === key) {
									this._oSelectedItems.add(oRow[this.getKey()], oRow);
									oTableSelectionInstance.addSelectionInterval(i, i);
									break;
								}
							}
						}
					}
				}

			} else {
				// Handle selection update of the m.table
				var oTable = this._oTable;
				for (j = 0; j < aItems.length; j++) {
					sKey = aItems[j];
					for (i = 0; i < oTable.getItems().length; i++) {
						var oColListItem = oTable.getItems()[i];
						var oRowData = oColListItem.getBindingContext().getObject();
						if (oRowData[this.getKey()] === sKey) {
							oTable.setSelectedItem(oColListItem, true);
							break;
						}
					}
				}

			}
		}

		this._bIgnoreSelectionChange = false;

		this._updateTitles();
	};

	/**
	 * Updates the selection of rows in the table. This function must be called after a first binding or binding update of the table. It will set a
	 * table row as selected if a token for this row exists.
	 * Method is similar to the {@link sap.ui.comp.valuehelpdialog.ValueHelpDialog#_updateSync} but with asynchronous behaviour and is used when
	 * <code>MultiSelectionPlugin</code> is enabled.
	 *
	 * @private
	 * @returns {Promise} A Promise that resolves after the selection has been completed
	 * @since 1.112
	 */
	ValueHelpDialog.prototype._updateAsync = function() {
		var i, j, oRow, oContext;
		var sKey;
		var aItems = this._oSelectedItems.getItems();
		var eventArgs = {
			tokenKeys: aItems,
			useDefault: false
		};
		var aSelectionPromises = [], oTableSelectionInstance;
		if (this._oTable) {
			oTableSelectionInstance = this._oTable;
			if (this._isMultiSelectionPluginAvailable()) {
				oTableSelectionInstance = this._oTable._getSelectionPlugin();
			}
		}

		this._bIgnoreSelectionChange = true;

		if (this._hasListeners("updateSelection")) {
			this.fireUpdateSelection(eventArgs);
		} else {
			eventArgs.useDefault = true;
		}

		if (eventArgs.useDefault) {

			if (this._oTable && this._oTable.isA("sap.ui.table.Table")) {

				this.oRows = this._oTable.getBinding("rows");
				oTableSelectionInstance.clearSelection();

				if (this.oRows && this.oRows.aKeys) {
					var aKeys = this.getKeys();
					var sRowKeyPartPrefix = aKeys && aKeys.length > 1 ? this.getKey() + "=" : "";

					// in case of an oDataModel binding the aKeys exist and the row will be found via the keys.
					for (j = 0; j < aItems.length; j++) {
						sKey = aItems[j];
						//sKeyEncoded = encodeURIComponent(sKey); //key of the item must be encoded before we search the item in the table row keys.

						//TODO instead of using encodeURI of the Token key we could try to use the oDataModel.createKey function to build the row key from the Token
						//var sPath = this.oRows.sPath.slice(1);
						//var oRowData = this._oSelectedItems.getItem(aItems[j]);
						//var sKey2 = this.getModel().createKey(sPath, oRowData);

						var sRowKeyPart = sRowKeyPartPrefix + "'" + sKey + "'";

						for (i = 0; i < this.oRows.aKeys.length; i++) {
							var sRowKey = this.oRows.aKeys[i];
							if (sRowKey === undefined) {
								continue;
							}
							sRowKey = decodeURIComponent(sRowKey);
							var bIsRow = sRowKey === sKey;
							if (bIsRow || // either the rowKey is equal the token key or we search if the main key with the value is part of the rowKey
								sRowKey.indexOf(sRowKeyPart) >= 0) {

								if (!bIsRow) { // in this case we will update the old key and use the longKey from the rows
									this._oSelectedItems.remove(sKey); // remove the old key
									// and update the Token key
									var token = this._getTokenByKey(sKey, this._getTokenizer());
									if (token) {
										token.setKey(sRowKey);
									}
								}

								// update the row data in the selectedItems List
								oContext = this._oTable.getContextByIndex(i);
								if (oContext) {
									oRow = oContext.getObject();
									this._oSelectedItems.add(sRowKey, oRow);
								}

								// make the row selected
								aSelectionPromises.push(oTableSelectionInstance.addSelectionInterval(i, i));
								break;
							}
						}
					}
				} else if (this.oRows && this.oRows.aIndices) {
					oTableSelectionInstance.clearSelection();
					var oTableContexts = this._oTable.getBinding("rows").getContexts();
					for (j = 0; j < aItems.length; j++) {
						var key = aItems[j];
						for (i = 0; i < this.oRows.aIndices.length; i++) {
							oContext = oTableContexts[i];
							if (oContext) {
								oRow = oContext.getObject();
								if (oRow[this.getKey()] === key) {
									this._oSelectedItems.add(oRow[this.getKey()], oRow);
									oTableSelectionInstance.addSelectionInterval(i, i);
									break;
								}
							}
						}
					}
				}

			} else {
				// Handle selection update of the m.table
				var oTable = this._oTable;
				for (j = 0; j < aItems.length; j++) {
					sKey = aItems[j];
					for (i = 0; i < oTable.getItems().length; i++) {
						var oColListItem = oTable.getItems()[i];
						var oRowData = oColListItem.getBindingContext().getObject();
						if (oRowData[this.getKey()] === sKey) {
							oTable.setSelectedItem(oColListItem, true);
							break;
						}
					}
				}

			}
		}
		this._bIgnoreSelectionChange = false;

		return Promise.all(aSelectionPromises).then(function(){
			this._updateTitles();
		}.bind(this));

	};

	/**
	 * Create the header bar, the controls for the header and adds it into the custom header.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._createHeaderBar = function() {
		this._oTitle = new Title(this.getId() + "-title", { level: TitleLevel.H1 });

		var oBackButton = null;
		if (this._isPhone()) {
			oBackButton = new Button(this.getId() + "-back", {
				visible: false,
				type: ButtonType.Back,
				press: function(oEvent) {
					if (this._currentViewMode === _ValueHelpViewMode.PHONE_SEARCH_VIEW) {
						this._updateView(_ValueHelpViewMode.PHONE_LIST_VIEW);
					} else {
						this._updateView(_ValueHelpViewMode.PHONE_MAIN_VIEW);
					}
				}.bind(this)
			});

			this._oBackButton = oBackButton;
		}

		// this._oTitle.addStyleClass("sapUiSmallMarginBeginEnd");

		var oTitleBar = new Bar(this.getId() + "-header", {
			contentLeft: oBackButton,
			contentMiddle: this._oTitle,
			design: "Header"
		});

		this.setCustomHeader(oTitleBar);
		this.getCustomHeader().addStyleClass("sapContrastPlus");
	};

	/**
	 * Creates the collective search elements which are placed beside the <code>FilterBar</code>.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._createCollectiveSearch = function() {
		// the oSelectionText and oSelectionButton are accessed outside the dialog!!!
		this.oSelectionTitle = new Text(this.getId() + "-selTitle", {
			visible: false,
			wrapping: false
		}).addStyleClass("compVHColSearchText");

		if (Device.system.tablet && !Device.system.desktop) {
			this.oSelectionTitle.addStyleClass("compVHColSearchTextTabletMaxWidth");
		} else {
			this.oSelectionTitle.addStyleClass("compVHColSearchTextMaxWidth");
		}

		this.oSelectionButton = new Button(this.getId() + "-selButton", {
			icon: "sap-icon://slim-arrow-down",
			tooltip: this._oRb.getText("VALUEHELPVALDLG_SEARCHTEMPLATES_TOOLTIP"), // "Search Templates",
			type: ButtonType.Transparent,
			visible: false,
			ariaLabelledBy: this.oSelectionTitle
		}).addStyleClass("compVHColSearchBtn");

		this._oColSearchBox = new HBox(this.getId() + "-selBox", {
			fitContainer: true,
			visible: this.oSelectionButton.getVisible(),
			items: [
				this.oSelectionTitle, this.oSelectionButton
			]
		}).addStyleClass("compVHColSearchVBox");
	};

	/**
	 * Creates the footer buttons.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._createFooterControls = function() {
		this._oButtonOk = new Button(this.getId() + "-ok", {
			text: this._oRb.getText("VALUEHELPDLG_OK"),
			press: this._onCloseAndTakeOverValues.bind(this),
			visible: this.getSupportMultiselect(),
			type: ButtonType.Emphasized,
			layoutData: new OverflowToolbarLayoutData({
				priority: OverflowToolbarPriority.NeverOverflow
			})
		});

		this._oButtonCancel = new Button(this.getId() + "-cancel", {
			text: this._oRb.getText("VALUEHELPDLG_CANCEL"),
			press: this._onCancel.bind(this),
			layoutData: new OverflowToolbarLayoutData({
				priority: OverflowToolbarPriority.NeverOverflow
			})
		});

		if (this._isPhone()) {
			this._oButtonGo = new Button(this.getId() + "-go", {
				text: this._oRb.getText("VALUEHELPDLG_GO"),
				type: ButtonType.Emphasized,
				press: this._onGo.bind(this),
				visible: false,
				layoutData: new OverflowToolbarLayoutData({
					priority: OverflowToolbarPriority.NeverOverflow
				})
			});

			this._oButtonClear = new Button(this.getId() + "-clear", {
				text: this._oRb.getText("VALUEHELPDLG_CLEAR"),
				press: this._onClear.bind(this),
				visible: false,
				layoutData: new OverflowToolbarLayoutData({
					priority: OverflowToolbarPriority.NeverOverflow
				})
			});

			this.addButton(this._oButtonGo);
			this.addButton(this._oButtonClear);
		}
		this.addButton(this._oButtonOk);
		this.addButton(this._oButtonCancel);
	};

	ValueHelpDialog.prototype._handleTokenUpdateOrDelete = function (oControlEvent) {
		var aRemovedTokens,
			aTokenKeys = [],
			aRangeTokenKeys = [],
			oToken,
			sKey,
			i, j,
			eventArgs;

		if (this._ignoreRemoveToken) {
			return;
		}

		if (oControlEvent.getParameter("type") === Tokenizer.TokenChangeType.Removed) {
			aRemovedTokens = oControlEvent.getParameter("removedTokens");
		} else if (oControlEvent.getParameter("tokens")) {
			aRemovedTokens = oControlEvent.getParameter("tokens");
		}

		for (j = 0; j < aRemovedTokens.length; j++) {
			oToken = aRemovedTokens[j];
			sKey = oToken.getKey();

			if (this._oSelectedRanges && this._oSelectedRanges[sKey]) {
				aRangeTokenKeys.push(sKey);
				this._removeToken(sKey);
			} else {
				aTokenKeys.push(sKey);

				// remove single selected item
				this._oSelectedItems.remove(sKey);
				this._removeTokenFromTokenizer(sKey, this._getTokenizer());
			}
		}

		// remove range tokens
		this._removeRangeByKey(aRangeTokenKeys);

		eventArgs = {
			tokenKeys: aTokenKeys,
			useDefault: false
		};

		if (this._hasListeners("tokenRemove")) {
			this._bIgnoreSelectionChange = true;
			this.fireTokenRemove(eventArgs);
			this._bIgnoreSelectionChange = false;

			// if (eventArgs.useDefault) {
			// sap.m.MessageToast.show("useDefault");
			// }

		} else {
			eventArgs.useDefault = true;
		}

		if (eventArgs.useDefault) {
			aTokenKeys.forEach(function(sTokenKey) {
				this._changeTableRowSelectionForKey(sTokenKey, false);
			}.bind(this));
		}

		// try to set the focus to other token - Workaround because the Tokenizer does not set the focus to other token
		if (aRemovedTokens.length === 1) {
			setTimeout(function() {
				var aTokens = this._getTokenizer().getTokens();
				if (aTokens) {
					i = aTokens.length - 1;
					if (i >= 0) {
						aTokens[i].focus();
					} else {
						this._manageFocusAfterRemoveTokens();
					}
				}
			}.bind(this));
		}

		this._updateTitles();
	};

	/**
	 * Creates the tokenizer part of the dialog.
	 *
	 * @private
	 * @returns {sap.ui.layout.Grid} with all elements
	 */
	ValueHelpDialog.prototype._createTokenizer = function() {
		if (this._oTokenizerGrid) {
			return this._oTokenizerGrid;
		}

		this._oSelectedTokenTitle = new InvisibleText(this.getId() + "-selectedTokenTitle");

		this._oSelectedTokens = new Tokenizer(
			this.getId() + "-selectedTokens",
			{
				ariaLabelledBy: this._oSelectedTokenTitle
			}
		).addStyleClass("compVHTokensDiv");

		/**
		 * @deprecated As of version 1.82, replaced by <code>tokenDelete</code> event.
		 */
		(function() {
			this._oSelectedTokens.attachTokenUpdate(this._handleTokenUpdateOrDelete, this);
		}.bind(this))();
		this._oSelectedTokens.attachTokenDelete(this._handleTokenUpdateOrDelete, this);

		if (ControlBehavior.isAccessibilityEnabled()) {
			this._oSelectedTokens.addAriaDescribedBy(this._oSelectedTokens.getTokensInfoId());
		}

		// this "remove all" button is a workaround and should be part of the Tokenizer itself
		this._oRemoveAllSelectedItemsBtn = new Button(this.getId() + "-removeSelItems", {
			type: ButtonType.Transparent,
			icon: IconPool.getIconURI("decline"),
			tooltip: this._oRb.getText("VALUEHELPVALDLG_REMOVETOKENS_TOOLTIP"),
			press: function() {
				var aSelectedKeys = [], aSelectedRangesKeys = [], eventArgs;
				this._getTokenizer().destroyTokens();

				aSelectedKeys = Object.keys(this._oSelectedItems['items']);
				aSelectedRangesKeys = Object.keys(this._oSelectedRanges);

				this._removeRangeByKey(Object.keys(this._oSelectedRanges));

				this._oSelectedItems.removeAll();
				this._bIgnoreSelectionChange = true;
				if (this._oTable && this._oTable.clearSelection) {
					if (this._oTable._getSelectionPlugin && this._oTable.data("isInternal")) {
						this._oTable._getSelectionPlugin().clearSelection();
					} else {
						this._oTable.clearSelection();
					}
				}
				if (this._oTable && this._oTable.removeSelections) {
					this._oTable.removeSelections();
				}
				this._bIgnoreSelectionChange = false;

				this._updateTitles();
				this._manageFocusAfterRemoveTokens();

				if (aSelectedKeys.length > 0 || aSelectedRangesKeys.length > 0) {
					eventArgs = {
						tokenKeys: aSelectedKeys.concat(aSelectedRangesKeys),
						useDefault: false
					};
					this.fireTokenRemove(eventArgs);
				}
			}.bind(this),
			ariaDescribedBy: this._oSelectedTokenTitle
		}).addStyleClass("compVHRemoveAllBtn");

		var oHContainer1 = new HorizontalLayout(this.getId() + "-selItemsBox", {
			content: [
				this._getTokenizer(), this._oRemoveAllSelectedItemsBtn
			]
		}).addStyleClass("compVHTokenizerHLayout");

		this._oIncludeTokenGrid = new Grid(this.getId() + "-selItemsGrid", {
			width: "100%",
			defaultSpan: "L12 M12 S12",
			hSpacing: 0,
			vSpacing: 0,
			content: [
				this._oSelectedTokenTitle, oHContainer1
			]
		}).addStyleClass("sapUiRespGridOverflowHidden");

		// only on tablet and desktop we use the expandable panel
		this._oTokenizerPanel = new Panel(this.getId() + "-tokenPanel", {
			expanded: Device.system.desktop,
			expandable: false, // this._isPhone() ? false : true,
			expandAnimation: true,
			headerText: "",
			width: "auto",
			content: [
				this._oIncludeTokenGrid
			],
			expand: function(oEvent) {
				this._updateTokenizer();

				if (oEvent.mParameters.expand && this._oTable && !(this._oTable.isA("sap.m.Table"))) {
					// when we open the tokens scroll the dialog content to the end
					var oScrollDiv = window.document.getElementById(this.getId() + "-scrollCont");
					if (oScrollDiv && oScrollDiv.scrollTop) {
						oScrollDiv.stop().animate({
							scrollTop: "1000" // oScrollDiv.prop("scrollHeight") - oScrollDiv.height()
						}, 1000);
					}
				}
			}.bind(this)
		}).addStyleClass("compVHBackgroundTransparent").addStyleClass("compVHTokensPanel").addStyleClass("compValueHelpDialogTokens");

		if (this._isPhone()) {
			// workaround to get a vertical layout of the Tokens in the tokenizer
			this._getTokenizer().addStyleClass("sapMTokenizerMultiLine");
		}

		this._oTokenizerGrid = new Grid(this.getId() + "-tokenizerGrid", {
			width: "100%",
			defaultSpan: "L12 M12 S12",
			hSpacing: 0,
			vSpacing: 0,
			content: this._oTokenizerPanel
		}).addStyleClass("compVHDBackground").addStyleClass("sapUiRespGridOverflowHidden");

		return this._oTokenizerGrid;
	};

	/**
	 * Add/Modify a token in a tokenizer control.
	 *
	 * @private
	 * @param {string} sKey of the token
	 * @param {string} sText the token text
	 * @param {sap.m.Tokenizer} oTokenizer the Tokenizer which contain the token
	 * @param {string} sKeyField the token key field (if range)
	 */
	ValueHelpDialog.prototype._addToken2Tokenizer = function(sKey, sText, oTokenizer, sKeyField) {
		var sTooltip = (typeof sText === "string") ? sText : "";
		var oToken = this._getTokenByKey(sKey, oTokenizer);
		sText = whitespaceReplacer(sText);
		if (!oToken) {
			// create a new token
			oToken = new Token(_getTokenId.call(this, sKey, sKeyField));
			oToken.setKey(sKey);
			oTokenizer.addToken(oToken);
			this._updateTokenizer();
		}

		if (oToken) {
			// update existing/new token text
			oToken.setText(sText);
			oToken.setTooltip(sTooltip);
		}
	};

	/**
	 * Search a token by key in the given tokenizer.
	 *
	 * @private
	 * @param {string} sKey of the token
	 * @param {sap.m.Tokenizer} oTokenizer the Tokenizer which contain the token
	 * @returns {sap.m.Token} the found token instance or null
	 */
	ValueHelpDialog.prototype._getTokenByKey = function(sKey, oTokenizer) {
		var aTokens = oTokenizer.getTokens();
		for (var i = 0; i < aTokens.length; i++) {
			var token = aTokens[i];
			if (token.getKey() === sKey) {
				return token;
			}
		}
		return null;
	};

	/**
	 * Removes a token from the tokenizer.
	 *
	 * @private
	 * @param {string} sKey of the token
	 */
	ValueHelpDialog.prototype._removeToken = function(sKey) {
		this._removeTokenFromTokenizer(sKey, this._getTokenizer());
	};

	/**
	 * Removes a token from a tokenizer.
	 *
	 * @private
	 * @param {string} sKey of the token
	 * @param {sap.m.Tokenizer} oTokenizer the Tokenizer which contain the token
	 * @returns {boolean} true when the token has been found and removed, else false
	 */
	ValueHelpDialog.prototype._removeTokenFromTokenizer = function(sKey, oTokenizer) {
		var token = this._getTokenByKey(sKey, oTokenizer);
		if (token) {
			this._ignoreRemoveToken = true;
			oTokenizer.removeToken(token);
			token.destroy();
			this._ignoreRemoveToken = false;
			this._updateTokenizer();
			return true;
		}
		return false;
	};

	/**
	 * Updating the tokenizer title and RemoveAll buttons.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateTokenizer = function() {
		this._bInitTokensHaveChanged = true;
		var bExpanded = false,
		sSelectedItemsTitle, sNoneSelectedItemsTitle;
		if (this._oTokenizerPanel) {
			bExpanded = this._oTokenizerPanel.getExpanded();
		}

		var n1 = this._getTokenizer().getTokens().length;
		if (this.getSupportRangesOnly()) {
			sSelectedItemsTitle = this._oRb.getText("VALUEHELPDLG_SELECTEDCONDITIONS");
			sNoneSelectedItemsTitle = this._oRb.getText("VALUEHELPDLG_NONESELECTEDCONDITIONS");
		} else if (this.getSupportRanges()) {
			sSelectedItemsTitle = this._oRb.getText("VALUEHELPDLG_SELECTEDITEMS_CONDITIONS");
			sNoneSelectedItemsTitle = this._oRb.getText("VALUEHELPDLG_NONESELECTEDITEMS_CONDITIONS");
		} else {
			sSelectedItemsTitle = this._oRb.getText("VALUEHELPDLG_SELECTEDITEMS");
			sNoneSelectedItemsTitle = this._oRb.getText("VALUEHELPDLG_NONESELECTEDITEMS");
		}

		var sSelectedItemsText = sSelectedItemsTitle.replace("{0}", n1.toString());
		var sText = n1 === 0 ? sNoneSelectedItemsTitle : sSelectedItemsText;

		if (this._oTokenizerPanel) {
			if (!bExpanded) {
				sText = "";
				if (n1 !== 0) {
					sText = sSelectedItemsText;
				}
				if (sText === "") {
					sText = sNoneSelectedItemsTitle;
				}
			}
			this._oTokenizerPanel.setHeaderText(sText);
			this._oSelectedTokenTitle.setText(sText);
		} else {
			this._oSelectedTokenTitle.setText(sText);
		}
		this._oRemoveAllSelectedItemsBtn.setEnabled(n1 !== 0);
		this._oIncludeTokenGrid.removeStyleClass("displayNone");
	};

	/**
	 * Create the TabBar or on Phone the ListItems as navigation control.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._createNavigationControl = function() {
		if (!this._isPhone()) {
			this._oTabBar = new IconTabBar(this.getId() + "-navigation", {
				expandable: false,
				items: [
					new IconTabFilter(this.getId() + "-itemstable", {
						visible: true,
						text: this._getTabSearchAndSelectText(),
						key: _ValueHelpViewMode.DESKTOP_LIST_VIEW
					}), new IconTabFilter(this.getId() + "-ranges", {
						visible: true,
						text: this._getTabRangesText(),
						key: _ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW
					})
				],
				select: function(oControlEvent) {
					this._updateView(oControlEvent.getParameters().key);
				}.bind(this)
			});

			this._oTabBar.setLayoutData(new FlexItemData({
				shrinkFactor: 0
			}));
			this._oNavigationContainer.addItem(this._oTabBar);

		} else {

			this._oSelectItemLI = new StandardListItem(this.getId() + "-itemstable", {
				type: ListType.Navigation,
				title: this._getTabSearchAndSelectText()
			}).data("key", _ValueHelpViewMode.PHONE_LIST_VIEW);

			this._oDefineConditionsLI = new StandardListItem(this.getId() + "-ranges", {
				type: ListType.Navigation,
				title: this._getTabRangesText()
			}).data("key", _ValueHelpViewMode.PHONE_CONDITIONS_VIEW);

			this._oMainListMenu = new List(this.getId() + "-navigation", {
				mode: ListMode.None,
				items: [
					this._oSelectItemLI, this._oDefineConditionsLI
				],
				itemPress: function(oEvent) {
					if (oEvent) {
						this._updateView(oEvent.mParameters.listItem.data("key"));
					}
				}.bind(this)
			});

			this._oMainListMenu.setLayoutData(new FlexItemData({
				shrinkFactor: 0
			}));
			this._oContentContainer.addItem(this._oMainListMenu);

			this._oAdvancedSearchLink = new Link(this.getId() + "-advancedSearchLink", {
				text: this._oRb.getText("FILTER_BAR_ADV_FILTERS_DIALOG"),
				press: function() {
					this._updateView(_ValueHelpViewMode.PHONE_SEARCH_VIEW);
				}.bind(this)
			}).addStyleClass("compVHAdvancedSearchLink");

			this._oAdvancedSearchLink.setLayoutData(new FlexItemData({
				shrinkFactor: 0,
				alignSelf: "End"
			}));
			this._oContentContainer.addItem(this._oAdvancedSearchLink);
		}
	};

	/**
	 * Update the TabBar or on Phone the Listitems.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateNavigationControl = function() {
		var bListTabVisible = !this.getSupportRangesOnly();
		var bRangesTabVisible = this.getSupportRangesOnly() || this.getSupportRanges();

		if (this._oTabBar) {

			var aTabItems = this._oTabBar.getItems();
			aTabItems[0].setVisible(bListTabVisible);
			aTabItems[1].setVisible(bRangesTabVisible);

			this._oTabBar.setVisible(bListTabVisible && bRangesTabVisible);
			this._updateDlgTitle();
		}

		if (this._oMainListMenu) {
			this._oSelectItemLI.setVisible(bListTabVisible);
			this._oDefineConditionsLI.setVisible(bRangesTabVisible);
		}

	};

	/**
	 * Remove a single/multiple range(s) from the UI and the internal selectedRanges list.
	 *
	 * @param {string|array} sKey Single or multiple sKey of the range
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._removeRangeByKey = function(sKey) {
		var aKeys = sKey;

		if (typeof aKeys === "string") {
			aKeys = [
				aKeys
			];
		}

		aKeys.forEach(function(sKey, index, aKeys) {
			var range = this._oSelectedRanges[sKey];
			if (!range._oGrid) {
				delete this._oSelectedRanges[sKey];

				if (this._oFilterPanel) {
					var oConditionPanel = this._oFilterPanel.getConditionPanel();

					if (aKeys.length == 1) {
						// only in case of a single key we remove the condition
						oConditionPanel.removeCondition(sKey);
					} else {
						// to make it faster we only remove the key from the internal oConditionMap and later make a refresh on the conditionPanel
						oConditionPanel._removeConditionFromMap(sKey);
					}
				}
			}
		}, this);

		if (aKeys.length > 1 && this._oFilterPanel) {
			var oConditionPanel = this._oFilterPanel.getConditionPanel();
			oConditionPanel._clearConditions();
			oConditionPanel._fillConditions();
		}


	};

	// ################################################################################
	// Start Ranges handling
	// ################################################################################

	/**
	 * Create a new instance of ranges grid and adds it into the main layout.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._createAddRanges = function() {
		if (!this._oRanges) {
			if (!sap.ui.require('sap/m/P13nFilterPanel')) {
				sap.ui.require(['sap/m/P13nFilterPanel'], function() {
					this._oRanges = this._createRanges();
					this._oMainLayout.addItem(this._oRanges);
				}.bind(this));
			} else {
				this._oRanges = this._createRanges();
				this._oMainLayout.addItem(this._oRanges);
			}
		} else {
			this._oMainLayout.addItem(this._oRanges);
		}
	};

	/**
	 * Create a new instance of ranges grid with all inner controls.
	 *
	 * @private
	 * @returns {sap.ui.layout.Grid} the ranges grid
	 */
	ValueHelpDialog.prototype._createRanges = function() {
		var sType,
			oConditionPanel;

		this._oFilterPanel = new P13nFilterPanel(this.getId() + "-filterPanel", {
			maxConditions: this.getMaxConditions(),
			maxIncludes: this.getMaxIncludeRanges ? this.getMaxIncludeRanges() : this._iMaxIncludeRanges,
			maxExcludes: this.getMaxExcludeRanges ? this.getMaxExcludeRanges() : this._iMaxExcludeRanges,
			containerQuery: true,
			enableEmptyOperations: true,
			defaultOperation: this.getConditionPanelDefaultOperation(),
			filterItemChanged: function(oEvent) {
				var sReason = oEvent.getParameter("reason");
				var sKey = oEvent.getParameter("key");
				var oItem = oEvent.getParameter("itemData");

				if (oItem && sReason === "added") {
					var oRange = {
						exclude: oItem.exclude,
						keyField: oItem.columnKey,
						operation: oItem.operation,
						value1: oItem.value1,
						value2: oItem.value2
					};
					this._oSelectedRanges[sKey] = oRange;

					// the new added filterItemData instance must be passed back into the filterpanel aggregation, otherwise the index of the add, update
					// or remove events is not correct.
					//oIDs[rangeData.keyField]++;
					var oFilterItem = new P13nAnyFilterItem({ //this.getId() + "-item_" + oItem.keyField + oIDs[oItem.keyField], {
						key: sKey,
						exclude: oItem.exclude,
						columnKey: oItem.columnKey,
						operation: oItem.operation
					});
					oFilterItem.setValue1(oItem.value1);
					oFilterItem.setValue2(oItem.value2);
					this._oFilterPanel.addFilterItem(oFilterItem);


					var sTokenText = this._getFormatedRangeTokenText(oRange.operation, oRange.value1, oRange.value2, oRange.exclude, oRange.keyField);
					this._addToken2Tokenizer(sKey, sTokenText, this._getTokenizer(), oRange.keyField);
					this._updateTokenizer();
				}

				if (oItem && sReason === "updated") {
					var oRange = this._oSelectedRanges[sKey];
					oRange.exclude = oItem.exclude;
					oRange.keyField = oItem.columnKey;
					oRange.operation = oItem.operation;
					oRange.value1 = oItem.value1;
					oRange.value2 = oItem.value2;

					var sTokenText = this._getFormatedRangeTokenText(oRange.operation, oRange.value1, oRange.value2, oRange.exclude, oRange.keyField);
					this._addToken2Tokenizer(sKey, sTokenText, this._getTokenizer(), oRange.keyField);
					this._updateTokenizer();
				}

				if (sReason === "removed") {
					delete this._oSelectedRanges[sKey];
					this._removeToken(sKey);
					this._updateTokenizer();
				}

				this._updateTabRangesTitle();
			}.bind(this)
		});

		this._oFilterPanel._oPanel.addAriaLabelledBy(this.getId() + "-title");
		this._oFilterPanel.bIsSingleIntervalRange = this.bIsSingleIntervalRange;

		// Enable enhanced exclude operations
		if (this.getProperty("_enhancedExcludeOperations")) {
			this._oFilterPanel._enableEnhancedExcludeOperations();
		}

		oConditionPanel = this._oFilterPanel.getConditionPanel();
		oConditionPanel.setDisplayFormat(this.getDisplayFormat());
		oConditionPanel.setProperty("_calendarWeekSettings", this.getProperty("_conditionPanelCalendarWeekSettings"));
		oConditionPanel.setProperty("_showCurrentDateButton", this.getProperty("_conditionPanelShowCurrentDateButton"));
		this._oFilterPanel.setSuggestCallback(this._fSuggestCallback);
		oConditionPanel._sAddRemoveIconTooltipKey = "CONDITION";

		if (this._aIncludeRangeOperations) {
			for (sType in this._aIncludeRangeOperations) {
				this._oFilterPanel.setIncludeOperations(this._aIncludeRangeOperations[sType], sType, true);
			}
		}

		if (this._aExcludeRangeOperations) {
			for (sType in this._aExcludeRangeOperations) {
				this._oFilterPanel.setExcludeOperations(this._aExcludeRangeOperations[sType], sType, true);
			}
		}

		if (this._aRangeKeyFields) {
			this._aRangeKeyFields.forEach(function(item) {
				this._oFilterPanel.addItem(new P13nItem({
					columnKey: item.key,
					text: item.label,
					typeInstance: item.typeInstance,
					type: item.type,
					maxLength: item.maxLength,
					formatSettings: item.formatSettings,
					scale: item.scale,
					precision: item.precision,
					isDefault: item.isDefault,
					values: null,
					nullable: item.nullable !== "false"
				}));
			}, this);
		}

		if (this._oSelectedRanges) {
			for (var rangeId in this._oSelectedRanges) {
				var rangeData = this._oSelectedRanges[rangeId];
				var oFilterItem = new P13nAnyFilterItem({
					key: rangeId,
					exclude: rangeData.exclude,
					columnKey: rangeData.keyField,
					operation: rangeData.operation
				});
				oFilterItem.setValue1(rangeData.value1);
				oFilterItem.setValue2(rangeData.value2);
				this._oFilterPanel.addFilterItem(oFilterItem);
			}
		}

		var oRangeFieldsGrid = new Grid(this.getId() + "-rangeFieldsGrid", {
			width: "100%",
			defaultSpan: "L12 M12 S12",
			vSpacing: 0,
			hSpacing: 0,
			content: [
				this._oFilterPanel
			]
		}).addStyleClass("sapUiRespGridOverflowHidden");


		this._sValidationDialogTitle = this._oRb.getText("VALUEHELPVALDLG_TITLE");
		this._sValidationDialogMessage = this._oRb.getText("VALUEHELPVALDLG_MESSAGE");
		this._sValidationDialogFieldMessage = this._oRb.getText("VALUEHELPVALDLG_FIELDMESSAGE");

		return oRangeFieldsGrid;
	};

	ValueHelpDialog.prototype.suggest = function(fSuggestProviderCallback) {
		this._fSuggestCallback = fSuggestProviderCallback;
		if (this._oFilterPanel) {
			this._oFilterPanel.setSuggestCallback(this._fSuggestCallback);
		}
	};

	/**
	 * returns the KeyField definition with the key sKey
	 *
	 * @param {string} sKey Key of the field
	 *
	 * @returns {object} Key field definition
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._getKeyFieldByKey = function(sKey) {
		var oCurrentKeyField;
		if (this._aRangeKeyFields) {
			// search the current KeyField
			this._aRangeKeyFields.some(function(keyField) {
				if (typeof keyField !== "string") {
					if (keyField.key === sKey) {
						oCurrentKeyField = keyField;
						return true;
					}
				}
				return false;
			});
		}
		return oCurrentKeyField;
	};

	/**
	 * Check if the entered/modified ranges are correct, marks invalid fields yellow (Warning state) and opens a popup message dialog to give the user
	 * the feedback that some values are wrong or missing.
	 *
	 * @private
	 * @param {function} fnCallback will be called when all ranges are valid or the user ignores the wrong/missing fields by pressing Ok on a message
	 *        dialog
	 * @param {function} fnCancelCallback will be called when ranges are invalid and the user press Cancel on a message dialog
	 */
	ValueHelpDialog.prototype._validateRanges = function(fnCallback, fnCancelCallback) {
		if (this._oRanges) {
			if (!this._oRanges.getParent()) {
				fnCallback();
				return;
			}

			// show warnings on invalid fields.
			var bIsIncludeRangesValid = this._oFilterPanel.validateConditions();

			if (!bIsIncludeRangesValid) {
				// open a simple confirm box
				MessageBox.show(this._sValidationDialogMessage, {
					icon: MessageBox.Icon.WARNING,
					title: this._sValidationDialogTitle,
					actions: [
						MessageBox.Action.OK, MessageBox.Action.CANCEL
					],
					emphasizedAction: MessageBox.Action.OK,
					styleClass: this.$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
					onClose: function(sResult) {
						if (sResult === MessageBox.Action.OK && fnCallback) {
							fnCallback();
						}
						if (sResult === MessageBox.Action.CANCEL && fnCancelCallback) {
							fnCancelCallback();
						}
					}
				});
				return;
			}

		}

		fnCallback();
	};

	// ################################################################################
	// Start Selected Items handling
	// ################################################################################

	/**
	 * Setter for the singleRowCallback function.
	 *
	 * @param {function} fSingleRowCallback Callback function
	 * @private
	 * @deprecated
	 * @since 1.30
	 */
	ValueHelpDialog.prototype.setUpdateSingleRowCallback = function(fSingleRowCallback) {
		this.fSingleRowCallback = fSingleRowCallback;

		this._updateNavigationControl();
	};


	// ################################################################################
	// Start main Table handling
	// ################################################################################

	ValueHelpDialog.prototype._createDefaultTable = function() {
		if (!this._isPhone()) {
			this.setTable(new UiTable(this.getId() + "-table"), true);
		} else {
			this.setTable(new Table(this.getId() + "-table"), true);
			this.TableStateSearchData();
		}
	};

	function _createDefaultTableAsync() {
		if (!(this._oTablePromise instanceof Promise)) {
			this._oTablePromise = new Promise(function (fnResolve, fnReject) {
				var oTable,
					oDefaultSFBSmartTableConfig = this.data("defaultSFBSmartTableConfig");
					this._fnRejectTablePromise = fnReject;

				if (!oDefaultSFBSmartTableConfig) {
					oTable = this._createDefaultStandaloneTable();
					this.setTable(oTable, true);

					if (oTable && oTable.isA("sap.ui.comp.smarttable.SmartTable")) {
						oTable = oTable.getTable();
					}

					fnResolve(oTable);
					return;
				}

				sap.ui.require(["sap/ui/comp/smarttable/SmartTable"], function (SmartTableClass) {
					SmartTable = SmartTableClass;
					if (!oDefaultSFBSmartTableConfig) {
						return;
					}
					oTable = this._createDefaultSFBSmartTable(oDefaultSFBSmartTableConfig);
					this.setTable(oTable, true);

					fnResolve(oTable.getTable());
				}.bind(this));
			}.bind(this));
		}

		return this._oTablePromise;
	}

	/**
	 * Remove description column if there is TextArrangement with id and description
	 * because id column already renders the description
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._getSmartTableColsNames = function (oConfig) {
		return oConfig.cols.reduce(function (aResult, oCol) {
			if (Array.isArray(oCol.fieldTemplate)) {
				var oKeyField = oConfig.valueListAnnotation.fields.find(function (oField) {
					return oField.name === oCol.fieldName;
				});

				if (oKeyField["com.sap.vocabularies.Common.v1.Text"] && oKeyField["com.sap.vocabularies.Common.v1.Text"]["com.sap.vocabularies.UI.v1.TextArrangement"]) {
					// its valid TextArrangement annotation and SmartTable will show the description combined with the id
					return aResult.concat(oCol.fieldName);
				}
			}

			return aResult.concat(oCol.fieldName, oCol.description);
		}, []);
	};

	/**
	 * Remove visible columns from the all columns array
	 * @private
	 */
	ValueHelpDialog.prototype._getSmartTableIgnoredColsNames = function (aVisibleCols, aAllCols = [], aValueListCols = []) {
		return aAllCols.filter(function (oCol) {
			return oCol.visible;
		}).reduce(function (aResult, oCol) {
			const bInValueListCols = aValueListCols.some(function (oField) {
				return oField.name === oCol.name;
			});

			if (bInValueListCols && (oCol.displayBehaviour === "descriptionOnly" || oCol.displayBehaviour === "idOnly")) {
				aResult.push(oCol.description);
			} else if (!aVisibleCols.includes(oCol.name)) {
				aResult.push(oCol.name);
			}
			return aResult;
		}, []);
	};

	/**
	 * Called to check are there filters based on revoked values from deprecation code annotation
	 * @param {object} mBindingParamsFilters - the data of the control which needs to be checked for filters
	 * @param {string} sDeprecationCodeFieldName
	 * @private
	 */
	ValueHelpDialog.prototype._checkForExistingRevokedFilters = function(mBindingParamsFilters, sDeprecationCodeFieldName) {
		var bExistingRevokedFilters = false,
			aFilters;

		if (mBindingParamsFilters.sPath === sDeprecationCodeFieldName && mBindingParamsFilters.sOperator === "EQ" && mBindingParamsFilters.oValue1 ===  ValueHelpDeprecationCode.RevokedCode) {
			bExistingRevokedFilters = true;
		} else if (Array.isArray(mBindingParamsFilters)) {
			for (var index = 0; index < mBindingParamsFilters.length; index++) {
				aFilters = mBindingParamsFilters[index].aFilters || mBindingParamsFilters[index];
				bExistingRevokedFilters = this._checkForExistingRevokedFilters(aFilters, sDeprecationCodeFieldName);
				if (bExistingRevokedFilters) {
					break;
				}
			}
		}
		return bExistingRevokedFilters;
	};

	/**
	 * Ensure that all properties defined in the ValueList annotation are included in the select as this is important
	 * for ValueListParameterIn/Out functionality to work properly in case of hidden columns.
	 * @param oBindingParams
	 * @param oVLAnnotation
	 * @private
	 */
	ValueHelpDialog.prototype._ensureSelectHasAllVLFields = function (oBindingParams, oVLAnnotation) {
		var aFields = oVLAnnotation.valueListFields,
			sSelect;

		if (!Array.isArray(aFields)) {
			return;
		}

		aFields = aFields.map(function (oField) {
			return oField.name;
		});

		sSelect = aFields.join(",");

		if (sSelect && oBindingParams.parameters) {
			oBindingParams.parameters.select = sSelect;
		}
	};

	ValueHelpDialog.prototype._createDefaultSFBSmartTable = function (oConfig) {
		var aCols = this._getSmartTableColsNames(oConfig);
		this._oDefaultSmartTable = new SmartTable(this.getId() + "-table", {
				smartFilterId: this.getId() + "-smartFilterBar",
				entitySet: oConfig.entitySet,
				enableAutoBinding: oConfig.autoSearch,
				enableAutoColumnWidth: true,
				tableType: this._isPhone() ? library.smarttable.TableType.ResponsiveTable : library.smarttable.TableType.Table,
				enableExport: false,
				showTablePersonalisation: false,
				showVariantManagement: false,
				initiallyVisibleFields: aCols.join(),
				ignoredFields: this._getSmartTableIgnoredColsNames(aCols, oConfig.valueListAnnotation.fields, oConfig.valueListAnnotation.valueListFields).join(),
				header: this._sSmartTableTableTitle
			});
		this._oDefaultSmartTable.data("defaultDropDownDisplayBehaviour", "idOnly");
		var oInnerTable = this._oDefaultSmartTable.getTable();

		this._oDefaultSmartTable.setLayoutData(new FlexItemData({
			growFactor: 1,
			baseSize: "0%"
		}));

		this._oDefaultSmartTable.attachBeforeRebindTable(function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams"),
				oKeyColumn,
				sDeprecationCodeField,
				oSFB = oConfig.smartFilterBar();

			delete oEvent.mParameters.bindingParams.parameters.expand;
			delete oBindingParams.expand;

			if (!oConfig) {
				return;
			}

			if (oSFB && oSFB.getAnalyticBindingPath()) {
				oEvent.getSource().setTableBindingPath(oSFB.getAnalyticBindingPath());
			}

			// BCP: 2380134089 Ensure that all properties defined in the ValueList annotation are included in the select
			if (oConfig.valueListAnnotation) {
				this._ensureSelectHasAllVLFields(oBindingParams, oConfig.valueListAnnotation);
			}

			if (oConfig.valueListAnnotation && oConfig.valueListAnnotation.deprecationCodeField) {
				sDeprecationCodeField = oConfig.valueListAnnotation.deprecationCodeField;

				if (oBindingParams && oBindingParams.filters) {
					var bExistingDeprecationCodeFilter = this._checkForExistingRevokedFilters(oBindingParams.filters, sDeprecationCodeField);

					if (!bExistingDeprecationCodeFilter) {
						oBindingParams.filters.push(new Filter(sDeprecationCodeField, FilterOperator.NE,  ValueHelpDeprecationCode.RevokedCode));
					}
				}
			}

			oKeyColumn = this._oDefaultSmartTable.getTable().getColumns().find(function (oColumn) {
				return oColumn.data("p13nData").columnKey === oConfig.key;
			});

			if (!oKeyColumn || !oKeyColumn.data("p13nData").sortProperty) {
				return;
			}

			// Add default sorter only if there is no basic search or user sorters
			if (oBindingParams.sorter.length === 0 && oBindingParams.parameters && (!oBindingParams.parameters.custom || !oBindingParams.parameters.custom.search)) {
				oBindingParams.sorter.push(new Sorter(oConfig.key));
			}

			oKeyColumn.setSorted && oKeyColumn.setSorted(oBindingParams.sorter.some(function (oSorter) {
				return oSorter.sPath === oConfig.key;
			}));
		}.bind(this));

		this._oDefaultSmartTable.data("p13nDialogSettings", {
			columns: { visible: false },
			filter: { visible: false },
			group: { visible: false }
		});

		if (this._isPhone()) {
			oInnerTable.setMultiSelectMode(mLibrary.MultiSelectMode.ClearAll);
			oInnerTable.attachUpdateFinished(this.update);
		} else {
			if (this.getEnabledMultiSelectionPlugin()) {
				oInnerTable.addDependent(new MultiSelectionPlugin({ limit: 200, enableNotification: true }));
			}
			oInnerTable.attachRowsUpdated(this.update);
		}
		oInnerTable.data("isInternal", true); // mark as internal so we can differentiate later

		return this._oDefaultSmartTable;
	};

	ValueHelpDialog.prototype._createDefaultStandaloneTable = function () {
		var oTable;
		if (this._isPhone()) {
			oTable = new Table({
				id: this.getId() + "-table"
			});
			oTable.setMultiSelectMode(mLibrary.MultiSelectMode.ClearAll);
			this.TableStateSearchData();
		} else if (this.getEnabledMultiSelectionPlugin()) {
				oTable = new UiTable({
					id: this.getId() + "-table"
				});
				oTable.addDependent(new MultiSelectionPlugin({limit: 200, enableNotification: true})); // limited to 200
			} else {
				oTable = new UiTable({
					id: this.getId() + "-table"
				});
			}
		oTable.data("isInternal", true); // mark as internal so we can differentiate later

		return oTable;
	};

	/**
	 * Creates <code>sap.m.OverflowToolbar</code> with <code>sap.m.Title</code> and enables copy
	 * using <code>sap.m.plugins.CellSelector</code> and <code>sap.m.plugins.CopyProvider</code>
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._initializeTableToolbar = function() {
		var oTableToolbar = this._oTable.getExtension()[0],
			oTableTitle = oTableToolbar ? oTableToolbar.getContent()[0] : null,
			aExtensionContent = [],
			bTableSupportsCellSelector = this._oTable.isA("sap.ui.table.Table"),
			bSupportCopy = bTableSupportsCellSelector && this._bTableCreatedInternal && this.getSupportMultiselect();

		if (bSupportCopy && this._oDefaultSmartTable) {
			try {
				this._oTable.addDependent(new CellSelector({
					rangeLimit: 200
				}));
				this._oDefaultSmartTable.setCopyProvider(this._oCopyProvider);

			} catch (oException) {
				// some exception handling if necessary
			}
		}

		if (this._oDefaultSmartTable && this._oDefaultSmartTable.isA("sap.ui.comp.smarttable.SmartTable")) {
			// SmartTable uses `header` property and handles it by itself
			return;
		}

		if (!oTableTitle) {
			oTableTitle = new Title({text:(Device.system.desktop ? this._sTableTitleNoCount : null)});
			aExtensionContent.push(oTableTitle);

			oTableToolbar = new OverflowToolbar({
				content: [
					aExtensionContent
				]
			});
			this._oTable.addExtension(oTableToolbar);
		} else if (!oTableTitle.isA("sap.m.Title")) {
			oTableTitle = new Title({text:(Device.system.desktop ? this._sTableTitleNoCount : null)});
			oTableToolbar.insertContent(oTableTitle, 0);
		}
	};

	/**
	 * initialize the table instance
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._initializeTable = function() {

		var oTableSelectionInstance, bIsSelectionPluginAvailable = false;
		if (this._oTable) {
			oTableSelectionInstance = this._oTable;
			if (this._isMultiSelectionPluginAvailable()) {
				oTableSelectionInstance = this._oTable._getSelectionPlugin();
				bIsSelectionPluginAvailable = true;
			}
		}

		if (this._oTable && this._oTable.isA("sap.ui.table.Table")) {

			this._initializeTableToolbar(); // adds title & enables copy functionallity for VHD table

			if (this._bTableCreatedInternal) {
				this.getSupportMultiselect() ? this._oTable.setSelectionBehavior(TableLibrary.SelectionBehavior.RowSelector) :
											   this._oTable.setSelectionBehavior(TableLibrary.SelectionBehavior.RowOnly);
			}
			oTableSelectionInstance.setSelectionMode(this.getSupportMultiselect() ? TableLibrary.SelectionMode.MultiToggle : TableLibrary.SelectionMode.Single);
			this._updateNoDataText(this._oRb.getText("VALUEHELPDLG_TABLE_PRESSSEARCH"));
			// initial we use Fixed mode to give the table the chance to render and calculate the correct height
			setRowMode(this._oTable, UiRowModeType.Fixed);

			var fnChangeHandler = function(oControlEvent) {
				var bEventIsInternallyTriggered = oControlEvent.getParameter("_internalTrigger") && oControlEvent.getParameter("_internalTrigger") === true,
					oEventUserInteraction = oControlEvent.getParameter("userInteraction"),
					bHasSelectedIndex = oTableSelectionInstance.getSelectedIndex() !== -1;

				if (this._bIgnoreSelectionChange
					|| (!oEventUserInteraction && !bIsSelectionPluginAvailable)
					|| (bIsSelectionPluginAvailable && !bHasSelectedIndex && bEventIsInternallyTriggered)
				) {
					return;
				}

				var eventArgs = {
					tableSelectionParams: oControlEvent.mParameters,
					updateTokens: [], // [{sKey, oRow, bSelect}, {}],
					useDefault: false,
					table: this._oTable
				};

				if (this._hasListeners("selectionChange")) {
					this._bIgnoreSelectionChange = true;
					this.fireSelectionChange(eventArgs);
					this._bIgnoreSelectionChange = false;
					eventArgs.updateTokens.forEach(function(currentValue) {
						this._addRemoveTokenByKey(currentValue.sKey, currentValue.oRow, currentValue.bSelected);
					}.bind(this));

				} else {
					eventArgs.useDefault = true;
				}

				if (eventArgs.useDefault) {
					// collect all the new selected or removed items
					var oTable = bIsSelectionPluginAvailable ? oControlEvent.getSource().getParent() : oControlEvent.getSource();
					var oBinding = oTable.getBinding("rows");
					var aSelectedIndices = bIsSelectionPluginAvailable ? oControlEvent.getSource().getSelectedIndices() : oTable.getSelectedIndices();
					var aChangedIndices = oControlEvent.getParameter("rowIndices");
					var bSelectAll = oControlEvent.getParameter("selectAll");
					var bIsLengthFinal = oBinding && oBinding.isLengthFinal ? oBinding.isLengthFinal() : true;
					var i, n = aSelectedIndices.length;
					var index;

					var iMissingItems = 0;
					if (bIsLengthFinal) {
						// in case of a model with a CountMode check if all items exist and can be selected.
						if (oBinding.aKeys) {
							for (i = 0; i < n; i++) {
								index = aSelectedIndices[i];
								if (!oBinding.aKeys[index]) {
									iMissingItems++;
								}
							}
						}
					} else if (bSelectAll) {
						// in case the length is not known and the user SelectAll items we have to load missing items
						iMissingItems = 99999999;
					}


					// if not, we show a dialog and give the user the option to load missing items
					if (iMissingItems !== 0) {

						var loadMissingContexts = function() {
							oBinding.attachEventOnce("dataReceived", function() {
								if (bSelectAll) {
									oTable.selectAll();
									aChangedIndices = oTableSelectionInstance.getSelectedIndices();
								}
								// now all contexts should exist and we can select all items.
								this._handleSelectionUpdateTokens(oTable, aChangedIndices);
							}.bind(this));

							// trigger the load of all Contexts
							if (bSelectAll) {
								if (bIsLengthFinal) {
									oBinding.getContexts(0, n);
								} else {
									oBinding.getContexts(0, iMissingItems);
								}
							} else {
								//select range (Shift select) with missing items
								oBinding.getContexts(aChangedIndices[0], aChangedIndices[aChangedIndices.length - 1]);
							}

						}.bind(this);

						if (iMissingItems <= 400) {
							loadMissingContexts();
							return;
						} else {
							// TODO: to be removed once the MultiSelectionPlugin integration is consumed
							MessageBox.show(this._oRb.getText("VALUEHELPDLG_SELECTIONFAILEDLOAD"), {
								icon: MessageBox.Icon.WARNING,
								title:  this._oRb.getText("VALUEHELPDLG_SELECTIONFAILEDLOADTITLE"),
								actions: [
									MessageBox.Action.OK,
									MessageBox.Action.CANCEL
								],
								emphasizedAction: MessageBox.Action.OK,
								initialFocus: MessageBox.Action.CANCEL,
								styleClass: this.$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
								onClose: function(oAction) {
									if (oAction === MessageBox.Action.OK) {
										loadMissingContexts();
									} else {
										this.update();
									}
								}.bind(this)
							});

							return;
						}
					}

					this._handleSelectionUpdateTokens(oTable, aChangedIndices);
				}

				this._updateTitles();

				if (!this.getSupportMultiselect()) {
					// in case of single select we fireOk and close the dialog
					this._bIgnoreSelectionChange = true; // set to true, to avoid a double(second) click and deselect the item.
					this._onCloseAndTakeOverValues();
				}
			};

			if (bIsSelectionPluginAvailable) {
				oTableSelectionInstance.attachSelectionChange(fnChangeHandler.bind(this));
			} else {
				this._oTable.attachRowSelectionChange(fnChangeHandler.bind(this));
			}

			this._oTable.addStyleClass("compVHMainTable");

			if (!this._oTable.getParent() || !this._oTable.getParent().isA("sap.ui.comp.smarttable.SmartTable")) {
				this._oTable.bindAggregation("columns", "columns>/cols", function(sId, oContext) {
					var ctrl, oColumn,
						oCustomSort,
						oColumnMenu,
						sColumnSortProperty,
						sDescriptionLabel = oContext.getProperty("descriptionLabel"),
						sLabel = oContext.getProperty("label"),
						vTemplate = oContext.getProperty("template"),
						bHasTextArrangement = Array.isArray(vTemplate);

					if (oContext.getProperty("type") === "boolean") {
						ctrl = new CheckBox(sId + "-control", {
							enabled: false,
							selected: {
								path: vTemplate
							}
						});
						oColumnMenu = new ColumnMenu();
					} else {
						var oCurrentColumn,
							oTextBinding = {
							path: vTemplate,
							type: oContext.getProperty("oType")
						};
						if (oContext.getProperty("isTimezone")) {
							oTextBinding.parts = [{value : null}, {path : vTemplate}];
						}
						if (bHasTextArrangement) {
							oTextBinding = {
								parts: [
									{
										path: vTemplate[0]
									}, {
										path: vTemplate[1]
									}
								],
								formatter: function(sKey, sDescription) {
									var sItemText = FormatUtil.getFormattedExpressionFromDisplayBehaviour(oContext.getProperty("displayBehaviour"), sKey, sDescription);

									return whitespaceReplacer(sItemText);
								}
							};

							oCustomSort = new QuickSort({
								change: function(oEvent) {
									var oItem = oEvent.getParameter("item"),
										sName = oItem.getKey(),
										sSortOrder = oItem.getSortOrder();

									oCurrentColumn.setSortProperty(sName);
									oCurrentColumn.setSortOrder(sSortOrder);
									oCurrentColumn.sort(sSortOrder === coreLibrary.SortOrder.Descending);
								},
								items: []
							});

							oColumnMenu = new ColumnMenu({
								quickActions: [
									oCustomSort
								],
								beforeOpen: function (oEvent) {
									oCurrentColumn = oEvent.getParameter("openBy");

									if (oCurrentColumn) {
										vTemplate.forEach(function(sName, iIndex) {
											var oItem = new QuickSortItem({
												key: sName,
												label: iIndex === 0 ? sLabel : sDescriptionLabel,
												sortOrder: (sName === oCurrentColumn.getSortProperty()) ? oCurrentColumn.getSortOrder() : coreLibrary.SortOrder.None
											});
											oCustomSort.addItem(oItem);
										});
										oCustomSort.setVisible(true);
									}
								},
								afterClose: function() {
									oCustomSort.removeAllItems();
								}
							});
						} else {
							oColumnMenu = new ColumnMenu();
						}

						ctrl = new Text(sId + "-control", {
							wrapping: false,
							renderWhitespace: true,
							text: oTextBinding
						});
					}

					if (this._oTable.isA("sap.ui.table.AnalyticalTable")) {
						oColumn = new AnalyticalColumn(sId, {
							label: new Label({text: oContext.getProperty("label")}),
							template: ctrl,
							width: "{columns>width}",
							hAlign: ctrl instanceof CheckBox ? HorizontalAlign.Center : HorizontalAlign.Begin,
							filterProperty: oContext.getProperty("filter")
						});

					} else {
						oColumn = new UiColumn(sId, {
							label: new Label({text: oContext.getProperty("label")}),
							template: ctrl,
							width: "{columns>width}",
							hAlign: ctrl instanceof CheckBox ? HorizontalAlign.Center : HorizontalAlign.Begin,
							// sorting is removed at the moment
							sortProperty: oContext.getProperty("sort"),
							sorted: oContext.getProperty("sorted"),
							sortOrder: oContext.getProperty("sortOrder"),
							// removes default quick action when having a column with id and description
							showSortMenuEntry: bHasTextArrangement ? false : true,
							filterProperty: oContext.getProperty("filter")
						});

						sColumnSortProperty = oColumn.getProperty("sortProperty");

						if (sColumnSortProperty) {
							oColumn.setAssociation("headerMenu", oColumnMenu);
						}

						oColumn.data({
							fieldName: oContext.getProperty('fieldName'),
							fieldTemplate: oContext.getProperty('fieldTemplate'),
							fieldDisplayBehaviour: oContext.getProperty('displayBehaviour')
						});
					}

					return oColumn;
				}.bind(this));
			}
		} else {
			this._oTable.setMode(this.getSupportMultiselect() ? ListMode.MultiSelect : ListMode.SingleSelectLeft);
			this._oTable.setGrowing(true);

			oTableSelectionInstance.attachSelectionChange(function(oControlEvent) {
				if (this._bIgnoreSelectionChange) {
					return;
				}

				var eventParams = oControlEvent.mParameters;

				var eventArgs = {
					tableSelectionParams: oControlEvent.mParameters,
					updateTokens: [], // [{sKey, oRow, bSelect}, {}],
					useDefault: false,
					table: this._oTable
				};

				if (this._hasListeners("selectionChange")) {
					this._bIgnoreSelectionChange = true;
					this.fireSelectionChange(eventArgs);
					this._bIgnoreSelectionChange = false;

					eventArgs.updateTokens.forEach(function(currentValue) {
						this._addRemoveTokenByKey(currentValue.sKey, currentValue.oRow, currentValue.bSelected);
					}.bind(this));

				} else {
					eventArgs.useDefault = true;
				}

				if (eventArgs.useDefault) {
					var bSelected = eventParams.selected;
					var i, n = eventParams.listItems.length;

					for (i = 0; i < n; i++) {
						var oColListItem = eventParams.listItems[i];
						var oContext = oColListItem.getBindingContext();
						var oRow = oContext ? oContext.getObject() : null;

						if (oRow) {
							var sKey = oRow[this.getKey()];
							if (!this.getSupportMultiselect()) {
								// remove all existing token, before adding the new select token
								this._oSelectedItems.removeAll();
							}
							this._addRemoveTokenByKey(sKey, oRow, bSelected);
						}
					}
				}

				if (!this.getSupportMultiselect()) {
					// in case of single select we fireOk
					this._onCloseAndTakeOverValues();
				}
			}.bind(this));

			if (!this._oTable.getParent() || !this._oTable.getParent().isA("sap.ui.comp.smarttable.SmartTable")) {
				var iColumns = 0;
				this._oTable.bindAggregation("columns", "columns>/cols", function(sId, oContext) {
					var colLabel = oContext.getProperty("label");
					var bDemandPopin = this._oTable.getColumns().length >= 2;

					iColumns++;
					return new Column(this._oTable.getId() + "-column" + iColumns, {
						header: new Label(this._oTable.getId() + "-column" + iColumns + "-label", {
							text: colLabel
						}),
						demandPopin: bDemandPopin,
						minScreenWidth: bDemandPopin ? (this._oTable.getColumns().length + 1) * 10 + "rem" : "1px"
					});
				}.bind(this));
			}
		}
	};

	ValueHelpDialog.prototype._handleSelectionUpdateTokens = function(oTable, aIndices) {
		var i, n = aIndices.length;
		var index;
		var oContext;
		var oRow;
		var bUsePath = false;
		var oTableSelectionInstance = this.getEnabledMultiSelectionPlugin() && oTable._getSelectionPlugin && oTable._getSelectionPlugin().isA("sap.ui.table.plugins.MultiSelectionPlugin") && oTable.data('isInternal') ? oTable._getSelectionPlugin() : oTable;
		if (oTable.getBinding("rows").aKeys) {
			bUsePath = true;
		}

		if (!this.getSupportMultiselect()) {
			// in case of single Select Table mode remove all existing selected items
			this._oSelectedItems.removeAll();
		}

		for (i = 0; i < n; i++) {
			index = aIndices[i];
			oContext = oTable.getContextByIndex(index);
			oRow = oContext ? oContext.getObject() : null;

			if (oRow) {
				var sKey;
				if (bUsePath) {
					sKey = oContext.sPath.substring(1);
				} else {
					sKey = oRow[this.getKey()];
				}

				this._addRemoveTokenByKey(sKey, oRow, oTableSelectionInstance.isIndexSelected(index));
			}
		}
	};

	ValueHelpDialog.prototype._addRemoveTokenByKey = function(sKey, oRow, bAdd) {
		try {
			sKey = decodeURIComponent(sKey); // key of the added or removed item must be decoded
		} catch (e) {
			// do nothing in case key is not encoded
		}

		if (bAdd) {
			this._oSelectedItems.add(sKey, oRow);
			this._addToken2Tokenizer(sKey, this._getFormatedTokenText(sKey), this._getTokenizer());
		} else {
			this._oSelectedItems.remove(sKey);
			this._removeTokenFromTokenizer(sKey, this._getTokenizer());
		}
	};

	/**
	 * Handler for the Ok close handling. The function prepares the list of all selected items and token and fires the Ok event.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._onCloseAndTakeOverValues = function() {
		var that = this;

		var fnCallback = function() {
			var range;
			var aTokens = that._oSelectedItems.getSelectedItemsTokenArray(that.getKey(), that.getDescriptionKey(), that.getTokenDisplayBehaviour());

			if (that._oSelectedRanges) {
				var i = 0;
				// if the user has changed the ranges we return the new ranges from the selectedRanges
				for (var rangeId in that._oSelectedRanges) {
					range = that._oSelectedRanges[rangeId];
					var sTokenValue = range.tokenValue;
					if (!sTokenValue) {
						sTokenValue = that._getFormatedRangeTokenText(range.operation, range.value1, range.value2, range.exclude, range.keyField);
					}

					if (!range._oGrid || range._oGrid.select.getSelected()) {
						var oToken = new Token({
							key: "range_" + i
						}).data("range", {
							"exclude": range.exclude,
							"operation": range.operation,
							"keyField": range.keyField,
							"value1": range.value1,
							"value2": range.value2
						});
						oToken.setText(sTokenValue);
						oToken.setTooltip(typeof sTokenValue === "string" ? sTokenValue : null);
						aTokens.push(oToken);
						i++;
					}
				}
			}

			that.fireOk({
				"tokens": aTokens,
				"_tokensHaveChanged": that._bInitTokensHaveChanged
			});
		};

		this._validateRanges(fnCallback);
	};

	/**
	 * Returns <code>true</code> if <code>sap.ui.table.plugins.MultiSelectionPlugin</code> is available or <code>false</code> if not.
	 *
	 * @returns {boolean}
	 * @private
	 */
	ValueHelpDialog.prototype._isMultiSelectionPluginAvailable = function() {
		var bAvailable = false;

		if (this._oTable._getSelectionPlugin && this._oTable._getSelectionPlugin().isA("sap.ui.table.plugins.MultiSelectionPlugin") && this._oTable.data('isInternal')) {
			bAvailable = true;
		}

		return bAvailable;
	};

	/**
	 * Handler for the cancel button. The function fires the Cancel event.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._onCancel = function() {
		this.fireCancel();
	};

	/**
	 * Handler for the Go button. Go button is used on Phone Device and calls the search of the integrated filterbar
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._onGo = function() {
		this._oFilterBar.search();
	};

	/**
	 * Handler for the Clear button. Clear button is used on Phone Device and calls the clear of the integrated filterbar.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._onClear = function() {
		this._oFilterBar.clear();
	};

	/**
	 * Update all titles (table and tokenizer).
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateTitles = function() {
		if (!this._oDefaultSmartTable) {
			// SmartTable handles it by itself so we skip it
			this._updateTableTitle();
		}
		this._updateTokenizer();
		this._updateTabSearchAndSelectTitle();
		this._updateTabRangesTitle();
	};


	/**
	 * Adds an invisible message to announce the count of the results found after search is triggered.
	 * @param {string} sRowCount The count of the results found.
	 * @private
	 */
	ValueHelpDialog.prototype._addInvisibleMessageSearchAndTableCount = function(iRowCount) {
		let sInvisibleMessage;
		const sText = this._sTableTitleNoCount;

		if (iRowCount == undefined) {
			sInvisibleMessage = this._oRb.getText("VALUEHELPDLG_ANNOUNCEMENT_TABLE_UPDATED", [sText]);
		} else if (iRowCount > 1) {
			sInvisibleMessage = this._oRb.getText("VALUEHELPDLG_ANNOUNCEMENT_TABLE_UPDATED_MULT", [sText, iRowCount]);
		} else if (iRowCount === 1) {
			sInvisibleMessage = this._oRb.getText("VALUEHELPDLG_ANNOUNCEMENT_TABLE_UPDATED_SING", [sText, iRowCount]);
		} else {
			sInvisibleMessage = this._oRb.getText("VALUEHELPDLG_ANNOUNCEMENT_TABLE_UPDATED_NOITEMS", [sText]);
		}

		this._oInvisibleMessage.announce(sInvisibleMessage, InvisibleMessageMode.Polite);
	};

	/**
	 * Update the dialog title.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateDlgTitle = function() {
		var sMsgKey = "";
		var sMsg;

		if (this._oTitle) {

			if (this._oTabBar && !this._oTabBar.getVisible() && !this.getFilterMode()) {
				// title handling on a normal dialog (on Dekstop and Tablet) when the tabBar is not visible
				if (this._oTabBar.getSelectedKey() === _ValueHelpViewMode.DESKTOP_LIST_VIEW) {
					sMsgKey = "VALUEHELPDLG_TITLE";
				} else if (this._oTabBar.getSelectedKey() === _ValueHelpViewMode.DESKTOP_CONDITIONS_VIEW) {
					if (this.getMaxIncludeRanges() === "1" && this.getMaxExcludeRanges() === "0") {
						sMsgKey = "VALUEHELPDLG_SINGLECONDITION_TITLE";
					} else {
						sMsgKey = "VALUEHELPDLG_RANGESTITLE";
					}
				}
			} else if (this._isPhone() && !this.getFilterMode()) {
				// on a phone we show the title which depends on the current viewmode
				switch (this._currentViewMode) {
					case _ValueHelpViewMode.PHONE_MAIN_VIEW:
						sMsgKey = "";
						break;
					case _ValueHelpViewMode.PHONE_LIST_VIEW:
						sMsg = this._getTabSearchAndSelectText();
						break;
					case _ValueHelpViewMode.PHONE_SEARCH_VIEW:
						sMsgKey = "FILTER_BAR_ADV_FILTERS_DIALOG";
						break;
					case _ValueHelpViewMode.PHONE_CONDITIONS_VIEW:
						if (this.getMaxIncludeRanges() === "1" && this.getMaxExcludeRanges() === "0") {
							sMsgKey = "VALUEHELPDLG_SINGLECONDITION_TITLE";
						} else {
							sMsg = this._getTabRangesText();
						}
						break;
					default:
						break;
				}
			}

			if (!sMsg) {
				sMsg = this.getTitle();
			}

			if (sMsgKey) {
				sMsg = this._oRb.getText(sMsgKey, [sMsg]);
			}

			if (sMsg) {
				this._oTitle.setText(sMsg);
			}
		}
	};

	/**
	 * Update title of the main table.
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateTableTitle = function() {
		if (!this._oTable || (this._oDefaultSmartTable && this._oDefaultSmartTable.isA("sap.ui.comp.smarttable.SmartTable"))) {
			// if no internal table or there is a SmartTable responsible for creating the internal one => no handling
			return;
		}
		var iLength = 0, nRowCount;
		this.oRows = this._oTable.getBinding("rows");

		if (this.oRows) {
			iLength = this.oRows.getLength();
		}

		if (!this._oNumberFormatInstance) {
			this._oNumberFormatInstance = NumberFormat.getFloatInstance();
		}

		nRowCount = this._oNumberFormatInstance.format(iLength);
		if (iLength > 0 && this.oRows.isLengthFinal && this.oRows.isLengthFinal()) {
			this._setTableTitle(this._sTableTitle1.replace("{0}", nRowCount));
		} else {
			this._setTableTitle(this._sTableTitleNoCount);
		}
	};

	/**
	 * Returns the translation of the Search and Select tab title
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._getTabSearchAndSelectText = function() {
		var oTable = this._oTable;

		if (oTable) {
			if (oTable.isA("sap.ui.comp.smarttable.SmartTable")) {
				oTable = oTable.getTable();
			}

			var nCountSelectedRows = 0;

			if (this._oSelectedItems && this._oSelectedItems.getItems) {
				nCountSelectedRows = this._oSelectedItems.getItems().length;
			}

			if (nCountSelectedRows > 0) {
				return this._oRb.getText("VALUEHELPDLG_ITEMSTABLE_SELECT", [nCountSelectedRows]);
			}
		}

		return this._oRb.getText("VALUEHELPDLG_ITEMSTABLE_SELECT").replace("({0})", "");
	};

	/**
	 * Returns the translation of the Define Conditions tab title
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._getTabRangesText = function() {
		if (this._oSelectedRanges && Object.keys(this._oSelectedRanges).length > 0) {
			var nCountRanges = Object.keys(this._oSelectedRanges).length;
			return this._oRb.getText("VALUEHELPDLG_RANGES", [nCountRanges]);
		}

		return this._oRb.getText("VALUEHELPDLG_RANGES").replace("({0})", "");
	};


	/**
	 * Updates the Search and Select tab title with the count of selected items
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateTabSearchAndSelectTitle = function() {
		var bListTabVisible = !this.getSupportRangesOnly();

		if (bListTabVisible) {
			// Devices except phone
			if (this._oTabBar) {
				this._oTabBar.getItems()[0].setText(this._getTabSearchAndSelectText());
			}

			// Phone devices
			if (this._oMainListMenu && this._oSelectItemLI) {
				this._oSelectItemLI.setTitle(this._getTabSearchAndSelectText());
			}
		}
	};


	/**
	 * Updates the Define Conditions tab title with the count of selected items
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._updateTabRangesTitle = function() {
		var bRangesTabVisible = this.getSupportRangesOnly() || this.getSupportRanges();

		if (bRangesTabVisible) {
			if (this._oTabBar) {
				this._oTabBar.getItems()[1].setText(this._getTabRangesText());
			}

			if (this._oMainListMenu && this._oDefineConditionsLI) {
				this._oDefineConditionsLI.setTitle(this._getTabRangesText());
			}
		}
	};

	/**
	 * Setting the title of the table will remove the focus on a table cell. Because of this we check if the Title control exist and set the Text of
	 * the title instead.
	 *
	 * @param {string} sTitle Title text for the table
	 *
	 * @private
	 */
	ValueHelpDialog.prototype._setTableTitle = function(sTitle) {
		var oTableToolbar = this._oTable && this._oTable.getExtension && this._oTable.getExtension()[0],
			oTableTitle = oTableToolbar ? oTableToolbar.getContent()[0] : null;

		if (oTableTitle && Device.system.desktop && this._oTable && !(this._oTable.isA("sap.m.Table"))) {
			if (this._oTable.getTitle && this._oTable.getTitle()) {
				this._oTable.getTitle().setText(sTitle);
			} else {
				oTableTitle.setText(sTitle);
			}
			if (!this._oTable.getAriaLabelledBy().includes(oTableTitle.getId())) {
				this._oTable.addAriaLabelledBy(oTableTitle);
			}

		} else {
			this._oTable.addStyleClass("compValueHelpSmallMarginTop");
		}
	};

	/**
	 * Equalize OK and Cancel button widths in case both are rendered.
	 * @private
	 */
	ValueHelpDialog.prototype._equalizeButtonsWidth = function () {
		var oOk = this._oButtonOk.getDomRef(),
			oCancel = this._oButtonCancel.getDomRef(),
			iOkWidth,
			iCancelWidth;

		if (!oOk || !oCancel) {
			return;
		}

		// BCP: 2380090444 Width from offsetWidth is rounded, so we use getBoundingClientRect
		iOkWidth = oOk.getBoundingClientRect().width;
		iCancelWidth = oCancel.getBoundingClientRect().width;

		if (iOkWidth === iCancelWidth) {
			return;
		}

		// For OK and Cancel buttons adapt the width of the shorter button to be the same as the wider button
		if (iCancelWidth > iOkWidth) {
			this._oButtonOk.setWidth(iCancelWidth + "px");
		} else {
			this._oButtonCancel.setWidth(iOkWidth + "px");
		}
	};

	ValueHelpDialog.prototype.onAfterRendering = function() {
		Dialog.prototype.onAfterRendering.apply(this);

		this._equalizeButtonsWidth();

		if (this._oTable) {
			this._updateTitles();
		}

		if (!this._isPhone() && this.getContentHeight() === "") {
			if (this.getSupportRangesOnly() && (this.getMaxExcludeRanges() === "-1" || this.getMaxIncludeRanges() === "-1")) { //} && this._oSelectedTokens.getTokens().length <= 2) {
				// in case of a conditions only with multiple condition rows we give the dialog a height of 70%
				this.setContentHeight("70%");
			} else {
				// if the content height is not set we fetch the current clientHeight from the ScrollContainer and set it as fixed height
				var oResizeDomRef = this.getDomRef("scroll");
				var _iResizeDomHeight = oResizeDomRef.clientHeight;
				this.setContentHeight(_iResizeDomHeight + "px");
			}
			// correct the minRowCount
			if (this._oTable && this._oTable.isA("sap.ui.table.Table")) {
				setRowMode(this._oTable, UiRowModeType.Auto);
			}
		}
		if (this._oTabBar && this._oTabBar.getVisible() && this.getCustomHeader()) {
			this.getCustomHeader().addStyleClass("compValueHelpDialogHeaderNoBoxShadow");
		}
		this._bInitTokensHaveChanged = false;
		this._setToolbarSpacerWidth();
		this._registerVHResizeHandler();
	};

	// Overwriting the Dialog._getDialogOffset function. In our case we will return some other left and top margin values!
	ValueHelpDialog.prototype._getDialogOffset = function(windowWidth) {
		var iWindowWidth = windowWidth || this._$Window.width();
		var screenSizes = {
			small: 600,
			large: 1024
		};
		var remToPixelMargin = function(rem) {
			var iRemInPx = parseInt(window.getComputedStyle(document.body).fontSize);
			return (rem * iRemInPx) * 2;
		};
		var rem = 1;

		if (iWindowWidth > screenSizes.small && iWindowWidth < screenSizes.large) {
			rem = 2;
		} else if (iWindowWidth >= screenSizes.large) {
			rem = 2;
		}

		return {
			top: remToPixelMargin(rem),
			left: remToPixelMargin(rem)
		};
	};

	ValueHelpDialog.prototype.exit = function() {

		var destroyHelper = function(o) {
			if (o && o.destroy) {
				o.destroy();
			}
			return null;
		};

		if (this._oCopyProvider) {
			this._oCopyProvider = destroyHelper(this._oCopyProvider);
		}

		Dialog.prototype.exit.apply(this);
		if (typeof this._fnRejectTablePromise === "function") {
			this._fnRejectTablePromise();
		}
		this.removeDelegate(this._onBeforeRenderingInputEventDelegate);

		this._oTokenizerGrid = destroyHelper(this._oTokenizerGrid);
		this._oRanges = destroyHelper(this._oRanges);
		this._oFilterPanel = destroyHelper(this._oFilterPanel);
		if (this._bTableCreatedInternal) {
			this._oTable = destroyHelper(this._oTable);
			this._oDefaultSmartTable = destroyHelper(this._oDefaultSmartTable);
		}
		this._oTable = null;
		this.theTable = null;
		this._oNumberFormatInstance = null;

		this._oTabBar = destroyHelper(this._oTabBar);
		this._oMainListMenu = destroyHelper(this._oMainListMenu);
		this._oContentContainer = destroyHelper(this._oContentContainer);
		this._oVarManagment = destroyHelper(this._oVarManagment);

		this._aRangeKeyFields = destroyHelper(this._aRangeKeyFields);
		this._aIncludeRangeOperations = destroyHelper(this._aIncludeRangeOperations);
		this._aExcludeRangeOperations = destroyHelper(this._aExcludeRangeOperations);

		if (this._oFilterBar) {
			this._oFilterBar.detachInitialise(this._handleFilterBarInitialize);
			this._oFilterBar = destroyHelper(this._oFilterBar);
		}

		this._oRb = destroyHelper(this._oRb);
		this._sTableTitle1 = destroyHelper(this._sTableTitle1);
		this._sTableTitle2 = destroyHelper(this._sTableTitle2);
		this._sTableTitleNoCount = destroyHelper(this._sTableTitleNoCount);

		this._sValidationDialogTitle = destroyHelper(this._sValidationDialogTitle);
		this._sValidationDialogMessage = destroyHelper(this._sValidationDialogMessage);
		this._sValidationDialogFieldMessage = destroyHelper(this._sValidationDialogFieldMessage);

		this._oSelectedItems = destroyHelper(this._oSelectedItems);
		this._oSelectedRanges = destroyHelper(this._oSelectedRanges);

		this._oButtonOk = destroyHelper(this._oButtonOk);
		this._oButtonCancel = destroyHelper(this._oButtonCancel);
		if (this._oButtonGo) {
			this._oButtonGo = destroyHelper(this._oButtonGo);
		}
		if (this._oButtonClear) {
			this._oButtonClear = destroyHelper(this._oButtonClear);
		}
		if (this._oColSearchBox) {
			this._oColSearchBox = destroyHelper(this._oColSearchBox);
		}

		this._oRulesLog.destroy();
	};

	/**
	 * Sets a RangeKeyFields array. This method allows you to specify the KeyFields for the ranges. You can set an array of objects with Key and Label
	 * properties to define the key fields.
	 *
	 * @public
	 * @since 1.24
	 * @param {Object<Object[]>} aRangeKeyFields An array of range KeyFields
	 *        <code>[{key: "CompanyCode", label: "ID"}, {key:"CompanyName", label : "Name"}]</code>
	 */
	ValueHelpDialog.prototype.setRangeKeyFields = function(aRangeKeyFields) {
		this._aRangeKeyFields = aRangeKeyFields;

		// TODO when the type is a DateTime type and isDateOnly==true, the type internal might use UTC=true
		// result is that date values which we format via formatValue(oDate, "string") are shown as the wrong date.
		// The current Date format is yyyy-mm-ddT00:00:00 GMT+01
		// Workaround: changing the oFormat.oFormatOptions.UTC to false!
		if (this._aRangeKeyFields) {
			this._aRangeKeyFields.some(function(keyField) {
				if (keyField.typeInstance && keyField.typeInstance.isA("sap.ui.model.odata.type.DateTime")) {
					var oType = keyField.typeInstance;
					if (!oType.oFormat) {
						// create a oFormat of the type by formating a dummy date
						oType.formatValue(UI5Date.getInstance(), "string");
					}
					if (oType.oFormat) {
						// if (oType.oFormatOptions.UTC == false && oType.oFormat.oFormatOptions.UTC == true) {
						oType.oFormat.oFormatOptions.UTC = false;
						// }
					}
				}
			});
		}

	};

	ValueHelpDialog.prototype.getRangeKeyFields = function() {
		return this._aRangeKeyFields;
	};

	/**
	 * Sets the array for the supported include range operations.
	 *
	 * @public
	 * @since 1.24
	 * @param {sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation[]} aOperation An array of range operations
	 * @param {string} sType the type for which the operations are defined
	 */
	ValueHelpDialog.prototype.setIncludeRangeOperations = function(aOperation, sType) {
		sType = sType || "default";
		this._aIncludeRangeOperations[sType] = aOperation;

		if (this._oFilterPanel) {
			this._oFilterPanel.setIncludeOperations(this._aIncludeRangeOperations[sType], sType);
		}
	};

	/**
	 * Sets the array for the supported exclude range operations.
	 *
	 * @public
	 * @since 1.24
	 * @param {sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation[]} aOperation An array of range operations
	 * @param {string} sType the type for which the operations are defined
	 */
	ValueHelpDialog.prototype.setExcludeRangeOperations = function(aOperation, sType) {
		sType = sType || "default";
		this._aExcludeRangeOperations[sType] = aOperation.map(function(sOperation){
			return this._oOperationsHelper.getCorrespondingExcludeOperation(sOperation);
		}.bind(this));

		if (this._oFilterPanel) {
			this._oFilterPanel.setExcludeOperations(this._aExcludeRangeOperations[sType], sType);
		}
	};

	/**
	 * Creates and returns the token text for the selected item.
	 *
	 * @private
	 * @param {string} sKey the key of the selectedItems item
	 * @returns {string} the token text for the selected items with the sKey
	 */
	ValueHelpDialog.prototype._getFormatedTokenText = function(sKey) {
		var oItem = this._oSelectedItems.getItem(sKey);
		var sTokenText = oItem[this.getDescriptionKey()];
		var sDisplayKey = oItem[this.getKey()];
		if (sTokenText === undefined) {
			if (typeof oItem === "string") {
				sTokenText = oItem;
			} else {
				sTokenText = sDisplayKey;
			}
		} else {
			sTokenText = FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.getTokenDisplayBehaviour() ? this.getTokenDisplayBehaviour() : DisplayBehaviour.descriptionAndId, sDisplayKey, sTokenText);
		}

		return sTokenText;
	};

	/**
	 * Creates and returns the token text for a range.
	 *
	 * @private
	 * @param {string} sOperation the operation type sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
	 * @param {any} oValue1 text of the first range field
	 * @param {any} oValue2 text of the second range field
	 * @param {boolean} bExclude indicates if the range is a Exclude range
	 * @param {string} sKeyField id
	 * @returns {string} the range token text
	 */
	ValueHelpDialog.prototype._getFormatedRangeTokenText = function(sOperation, oValue1, oValue2, bExclude, sKeyField) {
		var oCurrentKeyField = this._getKeyFieldByKey(sKeyField);
		var sValue1 = oValue1;
		var sValue2 = oValue2;
		var bRangeCondition = true;
		if (oCurrentKeyField) {
			if (!oCurrentKeyField.typeInstance && P13nConditionPanel._createKeyFieldTypeInstance) {
				P13nConditionPanel._createKeyFieldTypeInstance(oCurrentKeyField);
			}

			if (oCurrentKeyField.typeInstance) {
				sValue1 = oCurrentKeyField.typeInstance.formatValue(oValue1, "string", bRangeCondition);
				sValue2 = oCurrentKeyField.typeInstance.formatValue(oValue2, "string", bRangeCondition);
			}
		}

		var sTokenText = FormatUtil.getFormattedRangeText(sOperation, sValue1, sValue2, bExclude);

		if (this._aRangeKeyFields && this._aRangeKeyFields.length > 1 && oCurrentKeyField && oCurrentKeyField.label && sTokenText !== "") {
			sTokenText = oCurrentKeyField.label + ": " + sTokenText;
		}

		return sTokenText;
	};

	ValueHelpDialog.prototype._isPhone = function() {
		return Device.system.phone;
	};

	ValueHelpDialog.prototype._hasListeners = function(sEventName) {
		if (this._bTableCreatedInternal) {
			return false;
		}

		return this.hasListeners(sEventName);
	};

	ValueHelpDialog.prototype._rotateSelectionButtonIcon = function(bFlag) {
		if (!Device.system.phone) {
			var oCtrl = Element.getElementById(this.oSelectionButton.$("img")[0].id);

			if (bFlag) {
				oCtrl.addStyleClass("sapUiVHImageExpand");
			} else {
				oCtrl.removeStyleClass("sapUiVHImageExpand");
			}
		}
	};

	/**
	 * Returns the <code>ValueHelpDialog</code> tokenizer control
	 * @returns {sap.m.Tokenizer} The tokenizer
	 * @private
	 */
	ValueHelpDialog.prototype._getTokenizer = function(){
		return this._oSelectedTokens;
	};

	/**
	 * Returns the first tab in <code>ValueHelpDialog</code>
	 * @returns {sap.m.IconTab|sap.m.StandardListItem} The first tab item for desktop devices or list item for phone devices
	 * @private
	 */
	ValueHelpDialog.prototype._getTabSearchAndSelect = function(){
		var bListTabVisible = !this.getSupportRangesOnly();

		if (bListTabVisible) {
			// Devices except phone
			if (this._oTabBar) {
				return this._oTabBar.getItems()[0];
			}

			// Phone devices
			if (this._oMainListMenu && this._oSelectItemLI) {
				return this._oSelectItemLI;
			}
		}

		return null;
	};

	/**
	 * Returns the second tab in <code>ValueHelpDialog</code>
	 * @returns {sap.m.IconTab|sap.m.StandardListItem} The second tab item for desktop devices or list item for phone devices
	 * @private
	 */
	ValueHelpDialog.prototype._getTabDefneConditions = function(){
		var bRangesTabVisible = this.getSupportRangesOnly() || this.getSupportRanges();

		if (bRangesTabVisible) {
			if (this._oTabBar) {
				return this._oTabBar.getItems()[1];
			}

			if (this._oMainListMenu && this._oDefineConditionsLI) {
				return this._oDefineConditionsLI;
			}
		}

		return null;
	};

	ValueHelpDialog.prototype._registerVHResizeHandler = function() {
		ResizeHandler.register(this, this._onVHResize.bind(this));
	};

	ValueHelpDialog.prototype._onVHResize = function() {
		this._setToolbarSpacerWidth();
	};

	ValueHelpDialog.prototype._setToolbarSpacerWidth = function() {
		var oDialogHTML,
			oToolbarSpacer,
			aContent,
			iContentWidth,
			iContentMaxWidth,
			iVHDialogWidth;

		if (!this._oFilterBar) {
			return;
		}

		if (this._oFilterBar.getAggregation("_toolbar")) {
			aContent = this._oFilterBar.getAggregation("_toolbar").getContent();
			for (var i = 0; i < aContent.length; i++) {
				if (aContent[i].isA("sap.m.ToolbarSpacer")) {
					oToolbarSpacer = aContent[i];
					break;
				}
			}
		}

		if (oToolbarSpacer && this._oFilterBar.getBasicSearch()) {
			oDialogHTML = this.getDomRef();
			if (oDialogHTML) {
				iContentWidth = parseInt(oDialogHTML.style.width);
				iContentMaxWidth = parseInt(oDialogHTML.style.maxWidth);

				if (isNaN(iContentWidth) && isNaN(iContentMaxWidth)) {
					return;
				}

				if (isNaN(iContentWidth)) {
					iVHDialogWidth = iContentMaxWidth;
				} else if (isNaN(iContentMaxWidth)) {
					iVHDialogWidth = iContentWidth;
				} else {
					iVHDialogWidth = Math.min(iContentWidth, iContentMaxWidth);
				}

				if (iVHDialogWidth >= 1000 ) {
					oToolbarSpacer.setWidth("6rem");
				} else if (iVHDialogWidth < 1000 && iVHDialogWidth > 700) {
					oToolbarSpacer.setWidth("4rem");
				} else {
					oToolbarSpacer.setWidth("0.5rem");
					// oToolbarSpacer.setVisible(false);
				}
			}
		}
	};

	ValueHelpDialog.prototype._manageFocusAfterRemoveTokens = function() {
		var oConditionsFirstInput,
			oConditionPanel = this._oFilterPanel ? this._oFilterPanel.getConditionPanel() : undefined;

		if (this._currentViewMode.toLowerCase().indexOf("list") > -1) {
			this._oButtonOk.focus();
		} else {
			this._onAfterRenderingInputDelegate = {
				onAfterRendering: function () {
					oConditionsFirstInput.focus();
				}
			};
			this._onBeforeRenderingInputEventDelegate = {
				onBeforeRendering: function () {
					if (oConditionsFirstInput.getDomRef()){
						oConditionsFirstInput.removeDelegate(this._onAfterRenderingInputDelegate, this);
					}
				}
			};

			oConditionsFirstInput = oConditionPanel._oConditionsGrid.getAggregation("content")[0].value1;
			oConditionsFirstInput.addDelegate(this._onAfterRenderingInputDelegate, this);
			oConditionsFirstInput.addDelegate(this._onBeforeRenderingInputEventDelegate, this);
			oConditionsFirstInput.focus();
		}
	};

	function _getTokenId(sKey, sKeyField) {
		if (!sKeyField) {
			sKeyField = this.getKey();
		}

		sKey = sKey.replace(/[^a-zA-Z0-9]/g, "");
		sKeyField = sKeyField.replace(/[^a-zA-Z0-9]/g, "");

		var sId = sKeyField ? sKeyField + "-" + sKey : sKey;

		if (!this._oTokenIdCount[sId]) {
			this._oTokenIdCount[sId] = 0;
		}

		this._oTokenIdCount[sId]++;

		return this.getId() + "-token-" + sId + "_" + this._oTokenIdCount[sId];
	}

	function _isVisibleTabBarItems(_oTabBar) {
		if (_oTabBar){
			var aTabItems = _oTabBar.getItems();
			return aTabItems[0].getVisible() && aTabItems[1].getVisible();
		} else {
			return false;
		}
	}

	function setRowMode(oTable, sMode) {
		/**
		 * @deprecated As of version 1.119
		 */
		if (oTable.setVisibleRowCountMode) {
			oTable.setVisibleRowCountMode(sMode);

			if (sMode === UiRowModeType.Auto) {
				oTable.setMinAutoRowCount(Device.system.desktop ? 5 : 4);
			}

			return;
		}

		if (sMode === UiRowModeType.Fixed) {
			oTable.setRowMode(UiRowModeType.Fixed);
		} else if (sMode === UiRowModeType.Auto) {
			oTable.setRowMode(new UiAutoRowMode({minRowCount: Device.system.desktop ? 5 : 4}));
		}
	}

	return ValueHelpDialog;

});
