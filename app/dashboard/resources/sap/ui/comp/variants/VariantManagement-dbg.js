/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.variants.VariantManagement
sap.ui.define([
	'sap/ui/Device',
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/library',
	'sap/m/library',
	'sap/m/VBox',
	'sap/m/SearchField',
	'sap/m/ToggleButton',
	'sap/m/RadioButton',
	'sap/m/Column',
	'sap/m/Text',
	'sap/m/Bar',
	'sap/m/Table',
	'sap/m/Page',
	'sap/m/OverflowToolbar',
	'sap/m/OverflowToolbarLayoutData',
	'sap/m/Toolbar',
	'sap/m/ToolbarSpacer',
	'sap/m/Button',
	'sap/m/CheckBox',
	'sap/m/Dialog',
	'sap/m/Input',
	'sap/m/Title',
	'sap/m/Label',
	'sap/m/ResponsivePopover',
	'sap/m/SelectList',
	'sap/m/ObjectIdentifier',
	'sap/ui/comp/library',
	'./EditableVariantItem',
	'./VariantItem',
	'sap/ui/core/InvisibleText',
	'sap/ui/core/Control',
	'sap/ui/core/Icon',
	'sap/ui/core/Item',
	'sap/ui/layout/HorizontalLayout',
	'sap/ui/layout/Grid',
	'sap/ui/events/KeyCodes'
], function(Device, Element, Library, JSONModel, coreLibrary, mLibrary, VBox, SearchField, ToggleButton, RadioButton, Column, Text, Bar, Table, Page, OverflowToolbar, OverflowToolbarLayoutData, Toolbar, ToolbarSpacer, Button, CheckBox, Dialog, Input, Title, Label, ResponsivePopover, SelectList, ObjectIdentifier, library, EditableVariantItem, VariantItem, InvisibleText, Control, Icon, Item, HorizontalLayout, Grid, KeyCodes) {
	"use strict";

	// shortcut for sap.ui.core.VerticalAlign
	var VerticalAlign = coreLibrary.VerticalAlign;

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	// shortcut for sap.m.ButtonType
	var ButtonType = mLibrary.ButtonType;

	// shortcut for sap.m.PlacementType
	var PlacementType = mLibrary.PlacementType;

	// shortcut for sap.m.PopinDisplay
	var PopinDisplay = mLibrary.PopinDisplay;

	// shortcut for sap.m.ScreenSize
	var ScreenSize = mLibrary.ScreenSize;

	// shortcut for sap.ui.core.TextAlign
	var TextAlign = coreLibrary.TextAlign;

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	// shortcut for sap.m.OverflowToolbarPriority
	var OverflowToolbarPriority = mLibrary.OverflowToolbarPriority;

	// shortcut for sap.m.FlexAlignItems
	var FlexAlignItems = mLibrary.FlexAlignItems;

	/**
	 * Constructor for a new VariantManagement.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The VariantManagement control can be used to manage variants, such as filter bar variants or table variants.
	 * @deprecated Since version 1.120.0, replaced by the {@link sap.m.VariantManagement} control.
	 * @extends sap.ui.core.Control
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.variants.VariantManagement
	 */
	var VariantManagement = Control.extend("sap.ui.comp.variants.VariantManagement", /** @lends sap.ui.comp.variants.VariantManagement.prototype */
	{
		metadata: {
			interfaces : [
				"sap.m.IOverflowToolbarContent"
			],
			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/variants/VariantManagement.designtime",
			properties: {

				/**
				 * Enables the setting of the initially selected variant.
				 * @since 1.22.0
				 */
				initialSelectionKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Can be set to true or false depending on whether you want to enable or disable the control.
				 * @since 1.22.0
				 */
				enabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Provides a string value to set the default variant. Used for the save dialog. Has no effect on the selected variant.
				 * @since 1.22.0
				 */
				defaultVariantKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The key of the currently selected item. Returns null if the default item list is selected.
				 * This property is calculated when accessing it via the getSelectionKey method.
				 * The corresponding setSelectionKey method is not supported.
				 * The access via the standard set/getProperty is also not supported.
				 * @since 1.24.0
				 */
				selectionKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates that a Create Tile is visible in the Create dialog.
				 * @since 1.26.0
				 */
				showCreateTile: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that Execute on Selection is visible in the Save Variant and the Manage Variants dialogs.
				 * @since 1.26.0
				 */
				showExecuteOnSelection: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that the Public checkbox is visible in the Save View and the Manage Views dialogs. Selecting this checkbox allows you to
				 * share variants with other users.
				 * @since 1.26.0
				 */
				showShare: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that set as default is visible in the Save Variant and the Manage Variants dialogs.
				 * @since 1.44.0
				 */
				showSetAsDefault: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Enables the lifecycle support. If set to true, the VariantManagement control handles the transport information for shared variants.
				 * @since 1.26.0
				 */
				lifecycleSupport: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Overwrites the default Standard variant title.
				 * @since 1.28.0
				 */
				standardItemText: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates that the 'Favorites' feature is used. Only variants marked as favorites will be displayed in the variant list.
				 * @since 1.50.0
				 */
				useFavorites: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that the control is in error state. If set to <code>true</code> error message will be displayed whenever the variant is
				 * opened.
				 * @since 1.52.0
				 */
				inErrorState: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that end users are allowed to create variants.
				 * @since 1.85
				 */
				variantCreationByUserAllowed: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Defines the author of the standard variant, for example, the name of the own company.
				 * @since 1.86
				 */
				standardItemAuthor: {
					type: "string",
					group: "Misc",
					defaultValue: "SAP"
				}

			},
			defaultAggregation: "items",
			aggregations: {

				/**
				 * Items displayed by the <code>VariantManagement</code> control.
				 * @since 1.22.0
				 * @deprecated As of version 1.26, replaced by the <code>variantItems</code> aggregation
				 *
				 */
				items: {
					type: "sap.ui.core.Item",
					multiple: true,
					singularName: "item",
					deprecated: true
				},

				/**
				 * Variant items displayed by the <code>VariantManagement</code> control.
				 * @since 1.26.0
				 *
				 * <b>Note:</b>
				 * As of version 1.26, the aggregation <code>variantItems</code> replaces the default aggregation <code>items</code>.
				 * <b>Do not use the <code>items</code> aggregation </b>.
				 * In XML views or XML fragments, the default aggregation (without any wrapping element) can still be used,
				 * although it is currently supported by the <code>items</code> aggregation.
				 * As long as the content is of type {@link sap.ui.comp.variants.VariantItem},
				 * the default aggregation will continue to work even if the default aggregation
				 * is changed from <code>items</code> to <code>variantItems</code> in the future.
				 *
				 */
				variantItems: {
					type: "sap.ui.comp.variants.VariantItem",
					multiple: true,
					singularName: "variantItem"
				}
			},
			events: {

				/**
				 * This event is fired when the Save Variant dialog is closed with OK for a variant.
				 * @since 1.22.0
				 */
				save: {
					parameters: {
						/**
						 * The variant title
						 */
						name: {
							type: "string"
						},

						/**
						 * Indicates if an existing variant is overwritten or if a new variant is created
						 */
						overwrite: {
							type: "boolean"
						},

						/**
						 * The variant key
						 */
						key: {
							type: "string"
						},

						/**
						 * The Execute on Selection indicator
						 */
						exe: {
							type: "boolean"
						},

						/**
						 * The default variant indicator
						 */
						def: {
							type: "boolean"
						},

						/**
						 * The shared variant indicator
						 */
						global: {
							type: "boolean"
						},

						/**
						 * The package name
						 */
						lifecyclePackage: {
							type: "string"
						},

						/**
						 * The transport ID
						 */
						lifecycleTransportId: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired when users apply changes to variants in the Manage Variants dialog.
				 * @since 1.22.0
				 */
				manage: {
					parameters: {
						/**
						 * List of changed variants. Each entry contains a 'key' - the variant key and a 'name' - the new title of the variant
						 */
						renamed: {
							type: "object[]"
						},

						/**
						 * List of deleted variant keys
						 */
						deleted: {
							type: "string[]"
						},

						/**
						 * List of variant keys and the associated Execute on Selection indicator
						 */
						exe: {
							type: "object[]"
						},

						/**
						 * The default variant key
						 */
						def: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired when a new variant is selected.
				 * @since 1.22.0
				 */
				select: {
					parameters: {
						/**
						 * The variant key
						 */
						key: {
							type: "string"
						}
					}
				}
			}
		},
		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
		 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
		 */
		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.class("sapUiCompVarMngmt");
				oRm.openEnd();
				oRm.renderControl(oControl.oVariantLayout);
				oRm.close("div");
			}
		}
	});

	VariantManagement.STANDARD_NAME = library.STANDARD_VARIANT_NAME;
	VariantManagement.MAX_NAME_LEN = 100;

	VariantManagement.FAV_COLUMN = 0;
	VariantManagement.NAME_COLUMN = 1;
	VariantManagement.SHARE_COLUMN = 2;
	VariantManagement.DEF_COLUMN = 3;
	VariantManagement.EXEC_COLUMN = 4;
	VariantManagement.RESTRICT_COLUMN = 5;
	VariantManagement.AUTHOR_COLUMN = 6;

	/**
	 * Constructs and initializes the VariantManagement control.
	 */
	VariantManagement.prototype.init = function() {
		var that = this;

		this.STANDARDVARIANTKEY = "*standard*";
		this.setStandardVariantKey(this.STANDARDVARIANTKEY);
		this.aRemovedVariants = [];
		this.aRenamedVariants = [];
		this.aRemovedVariantTransports = [];
		this.aExeVariants = [];
		this.oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
		this.lastSelectedVariantKey = this._sStandardVariantKey;
		this.bVariantItemMode = false;
		this.oSelectedItem = null;
		this.sNewDefaultKey = "";
		this.bManagementTableInitialized = false;
		this.sTransport = null;
		this.sPackage = null;
		this.aEvents = [];
		this.bEventRunning = false;
		this.oVariantSelectionPage = null;
		this.bManualVariantKey = false;
		this.bFireSelect = false;
		this.bExecuteOnSelectForStandardViaXML = false;
		this.bExecuteOnSelectForStandardByUser = null;
		this.bSupportExecuteOnSelectOnSandardVariant = false;
		this._bInnerControlsCreated = false;
		this._bIndustrialSolutionMode = false;

		this._bVendorLayer = false;

		this.oModel = new JSONModel({
			enabled: false,
			selectedVariant: "",
			creationAllowed: true,
			saveVariantVisible: true
		});
		this.setModel(this.oModel, "save_enablement");

		this.oVariantInvisbletext = new InvisibleText({
			text: {
				parts: [
					{
						path: 'save_enablement>/selectedVariant'
					}, {
						path: 'save_enablement>/enabled'
					}
				],
				formatter: function(sText, bValue) {
					if (bValue) {
						sText = that.oResourceBundle.getText("VARIANT_MANAGEMENT_SEL_VARIANT_MOD", [
							sText
						]);
					} else {
						sText = that.oResourceBundle.getText("VARIANT_MANAGEMENT_SEL_VARIANT", [
							sText
						]);
					}

					return sText;
				}
			}
		});

		this.oVariantText = new Title(this.getId() + "-text", {
			text: "{save_enablement>/selectedVariant}"
		});

		this._setStandardText();
		this.oVariantText.addStyleClass("sapUICompVarMngmtClickable");
		this.oVariantText.addStyleClass("sapUICompVarMngmtTitle");
		this.oVariantText.addStyleClass("sapMTitleStyleH4");

		if (Device.system.phone) {
			this.oVariantText.addStyleClass("sapUICompVarMngmtTextPhoneMaxWidth");
		} else {
			this.oVariantText.addStyleClass("sapUICompVarMngmtTextMaxWidth");
		}

		this.oVariantModifiedText = new Text(this.getId() + "-modified", {
			visible: "{save_enablement>/enabled}"
		});
		this.oVariantModifiedText.setText("*");
		this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtClickable");
		this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtModified");

		this.oVariantPopoverTrigger = new ToggleButton(this.getId() + "-trigger", {
			icon: "sap-icon://slim-arrow-down",
			type: ButtonType.Transparent,
			tooltip: this.oResourceBundle.getText("VARIANT_MANAGEMENT_TRIGGER_TT")
		});

		this.oVariantPopoverTrigger.addAriaLabelledBy(this.oVariantInvisbletext);
		this.oVariantPopoverTrigger.addStyleClass("sapUICompVarMngmtClickable");

		this.oVariantLayout = new HorizontalLayout({
			content: [
				this.oVariantText, this.oVariantModifiedText, this.oVariantPopoverTrigger
			]
		});
		this.oVariantLayout.addStyleClass("sapUICompVarMngmtLayout");

		this.oVariantInvisbletext.setModel(this.oModel, "save_enablement");
		this.oVariantInvisbletext.toStatic();

		this.addDependent(this.oVariantLayout);
	};

	/**
	 * Required by the {@link sap.m.IOverflowToolbarContent} interface.
	 * Registers invalidations event which is fired when width of the control is changed.
	 *
	 * @protected
	 * @returns {{canOverflow: boolean, invalidationEvents: string[]}} Configuration information for the <code>sap.m.IOverflowToolbarContent</code> interface
	 */
	VariantManagement.prototype.getOverflowToolbarConfig = function() {
		var oConfig = {
			canOverflow: false,
			invalidationEvents: ["save", "manage", "select"]
		};

		return oConfig;
	};

	VariantManagement.prototype._columnVisibilityManagementTable = function(nIdx, bFlag) {

		if (!this.bManagementTableInitialized) {
			return;
		}

		if (this.oManagementTable) {
			var aColumns = this.oManagementTable.getColumns();
			if (aColumns && aColumns.length >= nIdx) {
				aColumns[nIdx].setVisible(bFlag);
			}
		}
	};

	VariantManagement.prototype.setVariantCreationByUserAllowed = function(bFlag) {
		this.setProperty("variantCreationByUserAllowed", bFlag);

		this.oModel.setProperty("/creationAllowed", bFlag);
		return this;
	};

	VariantManagement.prototype.setUseFavorites = function(bFlag) {
		this.setProperty("useFavorites", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.FAV_COLUMN, bFlag);
		return this;
	};

	VariantManagement.prototype.setShowShare = function(bFlag) {
		this.setProperty("showShare", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.SHARE_COLUMN, bFlag);
		return this;
	};

	VariantManagement.prototype.setShowSetAsDefault = function(bFlag) {
		this.setProperty("showSetAsDefault", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.DEF_COLUMN, bFlag);
		return this;
	};

	VariantManagement.prototype.setShowExecuteOnSelection = function(bFlag) {
		this.setProperty("showExecuteOnSelection", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.EXEC_COLUMN, bFlag);
		return this;
	};

	VariantManagement.prototype.setStandardItemText = function(sName) {
		this.setProperty("standardItemText", sName);

		var oItem = this._getSelectedItem();
		if (!oItem || (oItem.getKey() === this.getStandardVariantKey())) {
			this.oModel.setProperty("/selectedVariant", sName);
		}
		return this;

	};

	VariantManagement.prototype._triggerSave = function() {
		var oEvent = this._createEvent("variantSaveAs", this._handleVariantSaveAs);
		this._addEvent(oEvent);
	};

	VariantManagement.prototype._checkNameValidity = function(sValue, oManagementTable) {
		var bInError = false;
		if (oManagementTable && this._getVariantNamesAndKeys) {

			var mMap = this._getVariantNamesAndKeys();
			var aItems = oManagementTable.getItems();
			aItems.forEach(function(oItem) {
				var oInput = oItem.getCells()[VariantManagement.NAME_COLUMN];
				var sKey = oItem.getKey();
				if (oInput.getValue && mMap.hasOwnProperty(oInput.getValue()) && (mMap[oInput.getValue()] !== sKey)) {
					oInput.setValueState(ValueState.Error);
					oInput.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_DUPLICATE"));
					bInError = true;
				}
			}.bind(this));
		}

		return bInError;
	};

	VariantManagement.prototype._checkVariantNameConstraints = function(oInputField, oManagementTable) {
		var sValue;

		if (!oInputField) {
			return;
		}


		sValue = oInputField.getValue().trim();

		if (!this._checkIsDuplicate(oInputField, sValue, this.oManagementTable)) {
			if (sValue === "") {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
			} else if (sValue.indexOf('{') > -1) {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_NOT_ALLOWED_CHAR", [
					"{"
				]));
			} else if (sValue.length > VariantManagement.MAX_NAME_LEN) {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_MAX_LEN", [
					VariantManagement.MAX_NAME_LEN
				]));
			} else {
				oInputField.setValueState(ValueState.None);
				oInputField.setValueStateText(null);
			}
		}


		if (oInputField.getValueState() !== ValueState.Error) {
			this._checkIsDuplicate(oInputField, sValue, oManagementTable);
		}

		if (oManagementTable && this._getVariantNamesAndKeys) {
			this._checkNameValidity(sValue, oManagementTable);
		}

	};


	VariantManagement.prototype._focusOnFirstFilterInError = function(oInput) {
		oInput.getDomRef().scrollIntoView();
	};

	VariantManagement.prototype._anyItemInErrorState = function() {
		var oItems, oInput, i;

		if (this.oManagementTable) { //
			oItems = this.oManagementTable.getItems();
			if (oItems) {
				for (i = 0; i < oItems.length; i++) {
					oInput = oItems[i].getCells()[VariantManagement.NAME_COLUMN];

					if (oInput && oInput.getValueState && (oInput.getValueState() === ValueState.Error)) {
						this._checkVariantNameConstraints(oInput, this.oManagementTable);
						if (oInput.getValueState() === ValueState.Error) {
							this._focusOnFirstFilterInError(oInput);
							return true;
						}
					}
				}

				for (i = 0; i < oItems.length; i++) {
					oInput = oItems[i].getCells()[VariantManagement.NAME_COLUMN];

					if (oInput && oInput.isA("sap.m.Input")) {
						this._checkVariantNameConstraints(oInput, this.oManagementTable);
						if (oInput.getValueState() === ValueState.Error) {
							this._focusOnFirstFilterInError(oInput);
							return true;
						}
					}
				}
			}
		}

		return false;
	};

	VariantManagement.prototype._anyInErrorState = function(oManagementTable, oInputField) {
		var oItems, oInput, i;

		if (oManagementTable) { //
			oItems = oManagementTable.getItems();
			if (oItems) {
				for (i = 0; i < oItems.length; i++) {
					oInput = oItems[i].getCells()[VariantManagement.NAME_COLUMN];

					if (oInputField && (oInputField === oInput)) {
						continue;
					}

					if (oInput && oInput.getValueState && (oInput.getValueState() === ValueState.Error)) {
						if (this._checkIsDuplicate(oInput, oInput.getValue(), oManagementTable)) {
							return true;
						}
					}
				}
			}
		}

		return false;
	};

	VariantManagement.prototype._checkIsDuplicate = function(oInputField, sValue, oManagementTable) {

		var bFlag = this._isDuplicate(oInputField, sValue, oManagementTable);

		if (bFlag) {
			oInputField.setValueState(ValueState.Error);
			oInputField.setValueStateText(this.oResourceBundle.getText(sValue ? "VARIANT_MANAGEMENT_ERROR_DUPLICATE" : "VARIANT_MANAGEMENT_ERROR_EMPTY"));
		} else {
			oInputField.setValueState(ValueState.None);
			oInputField.setValueStateText(null);
		}

		return bFlag;
	};

	VariantManagement.prototype._isDuplicate = function(oInputField, sValue, oManagementTable) {
		if (oManagementTable) {
			return this._isDuplicateManaged(oInputField, sValue, oManagementTable);
		} else {
			return this._isDuplicateSaveAs(sValue);
		}
	};

	VariantManagement.prototype._isDuplicateManaged = function(oInputField, sValue, oManagementTable) {
		var oItems, oInput, i;

		if (oManagementTable) { //
			oItems = oManagementTable.getItems();
			if (oItems && (oItems.length > 0)) {
				for (i = 0; i < oItems.length; i++) {
					oInput = oItems[i].getCells()[VariantManagement.NAME_COLUMN];

					if (oInput === oInputField) {
						continue;
					}

					if (oInput) {
						if (oInput.getValue && (sValue === oInput.getValue().trim())) {
							return true;
						} else if (oInput.getText && (sValue === oInput.getText().trim())) {
							return true;
						} else if (oInput.getTitle && (sValue === oInput.getTitle().trim())) {
							return true;
						}
					}
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this._isIndustrySolutionModeAndVendorLayer() && this.bManualVariantKey) {
					return false;
				}
				/* eslint-enable no-lonely-if */
			}
		}

		return false;
	};

	VariantManagement.prototype._isDuplicateSaveAs = function(sValue) {
		var sTrimName = sValue.trim();
		if (!sTrimName) {
			return true;
		}

		var sText = this._determineStandardVariantName();
		if (sText === sTrimName) {
			if (this._isIndustrySolutionModeAndVendorLayer() && this.bManualVariantKey) {
				return false;
			}
			return true;
		}

		var oItems = this._getItems();
		for (var iCount = 0; iCount < oItems.length; iCount++) {
			sText = oItems[iCount].getText().trim();
			if (sText === sTrimName) {
				return true;
			}
		}

		return false;
	};

	VariantManagement.prototype._createSaveDialog = function() {
		var that = this;

		if (!this.oSaveDialog) {

			this.oSaveDialog = new Dialog(this.getId() + "-savedialog", {
				title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVEDIALOG"),
				beginButton: this.oSaveSave,
				endButton: new Button(this.getId() + "-variantcancel", {
					text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_CANCEL"),
					press: function() {
						if (that._fGetDataForKeyUser) {
							that._handleSaveAsCancelPressedForKeyUser();
						} else {
							that._bSaveCanceled = true;
							that.oSaveDialog.close();
						}
					}
				}),
				content: [
					this.oLabelName, this.oInputName, this.oLabelKey, this.oInputKey, this.oSaveDialogOptionsGrid
				],
				stretch: Device.system.phone
			});

			this.oSaveDialog.setParent(this);
			this.oSaveDialog.addStyleClass("sapUiContentPadding");
			this.oSaveDialog.addStyleClass("sapUiCompVarMngmtSaveDialog");
		}
	};

	VariantManagement.prototype._createManagementDialog = function() {
		var that = this;

		if (!this.oManagementDialog) {
			this.oManagementDialog = new Dialog(this.getId() + "-managementdialog", {
				contentWidth: "64%",
                draggable: true,
                resizable: true,
				title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_MANAGEDIALOG"),
				beginButton: this.oManagementSave,
				endButton: new Button(this.getId() + "-managementcancel", {
					text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_CANCEL"),
					press: function() {
						if (that._fGetDataForKeyUser) {
							that._handleManageCancelPressedForKeyUser();
						} else {
							that.aRemovedVariants = [];
							that.oManagementDialog.close();
						}
					}
				}),
				content: [
					this.oManagementTable
				],
				stretch: Device.system.phone,
				afterClose: function() {
					if (that.bFireSelect == true) {
						that.bFireSelect = false;
						that._fireSelectAsync();
					}
				}
			});
			this.oManagementDialog.setParent(this);

			//this.oManagementDialog.setTitle(this.oResourceBundle.getText("VARIANT_MANAGEMENT_MANAGEDIALOG"));
			var oSubHeader = new Bar();
			this.oManageDialogSearchField = new SearchField();

			this.oManageDialogSearchField.attachLiveChange(function(oEvent) {
				this._triggerSearchInManageDialog(oEvent);
			}.bind(this));

			oSubHeader.addContentMiddle(this.oManageDialogSearchField);
			this.oManagementDialog.setSubHeader(oSubHeader);

		}
	};

	VariantManagement.prototype._handleArrowUpDown = function(oList, oSearch) {

		var sItemId = null;
		var that = this;

		oList.attachBrowserEvent("keydown", function(e) {
			if (e.which === 38) { // UP
				if (that.oVariantSelectionPage.getShowSubHeader()) {
					sItemId = document.activeElement.id;
				}
			}
		});

		oList.attachBrowserEvent("keyup", function(e) {
			if (e.which === 38) { // UP
				if (sItemId && (sItemId === document.activeElement.id)) {
					var aItems = oList.getItems();
					if (aItems && aItems.length > 0) {
						var oItem = Element.getElementById(sItemId);
						if (oItem === aItems[0]) {
							oSearch.focus();
						}
					}
				}

				sItemId = null;
			}
		});

		oSearch.attachBrowserEvent("keyup", function(e) {
			if (e.which === 40) { // DOWN
				var aItems = oList.getItems();
				if (aItems && aItems.length > 0) {
					aItems[0].focus();
				}
			}
		});
	};

	VariantManagement.prototype._triggerSearch = function(oEvent) {

		if (!oEvent) {
			return;
		}

		var parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		this._restoreCompleteList();

		var sValue = parameters.newValue ? parameters.newValue : "";

		this._triggerSearchByValue(sValue.toLowerCase());
	};

	VariantManagement.prototype._triggerSearchByValue = function(sValue) {
		var sText, sKey, oVariantListItem;

		this.oSelectedVariantItemKey = null;

		oVariantListItem = this.oVariantList.getItemByKey(this.getStandardVariantKey());
		if (oVariantListItem && (oVariantListItem.getText().toLowerCase().indexOf(sValue) < 0)) {

			if (this.getSelectionKey() === sKey) {
				this.oSelectedVariantItemKey = sKey;
			}
			this.oVariantList.removeItem(oVariantListItem);

			oVariantListItem.destroy();
		}

		var oItems = this._getItems();
		for (var iCount = 0; iCount < oItems.length; iCount++) {
			sText = oItems[iCount].getText();

			if (sText.toLowerCase().indexOf(sValue) < 0) {
				sKey = oItems[iCount].getKey();
				oVariantListItem = this.oVariantList.getItemByKey(sKey);
				if (oVariantListItem) {

					if (this.getSelectionKey() === sKey) {
						this.oSelectedVariantItemKey = sKey;
					}
					this.oVariantList.removeItem(oVariantListItem);

					oVariantListItem.destroy();
				}
			}
		}
	};

	VariantManagement.prototype._triggerSearchInManageDialog = function(oEvent) {
		var sValue, bNoMatch, sColumnValue = "", oCell, aCells;

		if (!oEvent) {
			return;
		}

		var parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		sValue = parameters.newValue ? parameters.newValue.toLowerCase() : "";

		if (this.oManagementTable) {
			var aVariants = this.oManagementTable.getItems();
			aVariants.forEach(function(oRow) {
				bNoMatch = true;
				sColumnValue = "";
				aCells = oRow.getCells();
				if (aCells && aCells[VariantManagement.NAME_COLUMN]) {

					oCell = aCells[VariantManagement.NAME_COLUMN];
					if (oCell.getTitle) {
						sColumnValue = oCell.getTitle();
					} else if (oCell.getValue) {
						sColumnValue = oCell.getValue();
					}

					if (sColumnValue.toLowerCase().indexOf(sValue) >= 0) {
						bNoMatch = false;
					}
				}

				if (bNoMatch && aCells && aCells[VariantManagement.AUTHOR_COLUMN]) {
					oCell = aCells[VariantManagement.AUTHOR_COLUMN];
					if (oCell.getText) {
						sColumnValue = oCell.getText();
						if (sColumnValue.toLowerCase().indexOf(sValue) >= 0) {
							bNoMatch = false;
						}
					}
				}

				oRow.setVisible(!bNoMatch);

			});

		}

	};

	VariantManagement.prototype._considerItem = function(bIgnoreFavorites, oItem) {

		if (this.getUseFavorites() && !bIgnoreFavorites) {

			if (this._isIndustrySolutionModeAndVendorLayer()) {
				return true;
			}

			if (oItem.getFavorite && oItem.getFavorite()) {
				return true;
			}
			return false;
		}
		return true;
	};

	VariantManagement.prototype._restoreCompleteList = function(bIgnoreFavorites) {
		var iCount, oItem, oItems, oVariantListItem;

		this.oVariantList.destroyItems();

		oVariantListItem = this.oVariantList.getItemByKey(this.getStandardVariantKey());
		if (!oVariantListItem) {
			oVariantListItem = this._createStandardVariantListItem();
			if (oVariantListItem) {
				if (this._considerItem(bIgnoreFavorites, oVariantListItem)) {
					this.oVariantList.insertItem(oVariantListItem, 0);
				} else {
					oVariantListItem.destroy();
				}
			}
		}

		if (oVariantListItem) {
			if (this.oSelectedVariantItemKey) {
				if (this.oSelectedVariantItemKey === oVariantListItem.getKey()) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					this.oSelectedVariantItemKey = null;
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this.getSelectionKey() == oVariantListItem.getKey() || this.getSelectionKey() === null) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					/* eslint-enable no-lonely-if */
				}
			}
		}

		oItems = this._getItems();
		oItems.sort(this._compareItems);
		for (iCount = 0; iCount < oItems.length; iCount++) {
			oItem = oItems[iCount];

			if (!this._considerItem(bIgnoreFavorites, oItem)) {
				continue;
			}

			if (oItem.getKey() === this.getStandardVariantKey()) {
				continue;
			}

			oVariantListItem = this.oVariantList.getItemByKey(oItem.getKey());
			if (!oVariantListItem) {
				oVariantListItem = this._createVariantListItem(oItem, iCount);
				this.oVariantList.addItem(oVariantListItem);
			}

			if (this.oSelectedVariantItemKey) {
				if (this.oSelectedVariantItemKey === oVariantListItem.getKey()) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					this.oSelectedVariantItemKey = null;
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this.getSelectionKey() == oVariantListItem.getKey()) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					/* eslint-enable no-lonely-if */
				}
			}

		}
	};

	VariantManagement.prototype._determineStandardVariantName = function() {

		var sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD");

		if (this.bVariantItemMode === false) {
			sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT");
		}

		if (this.getStandardVariantKey() === this.STANDARDVARIANTKEY) {
			if (this.getStandardItemText() !== null && this.getStandardItemText() != "") {
				sText = this.getStandardItemText();
			}
		}

		return sText;

	};

	VariantManagement.prototype._createStandardVariantListItem = function() {
		var oItem, oVariantListItem = null;

		var sText = this._determineStandardVariantName();

		if ((this.bVariantItemMode === true) || (this.bVariantItemMode === false && (this.getSelectionKey() === this.getStandardVariantKey() || this.getSelectionKey() === null))) {

			oVariantListItem = new VariantItem(this.oVariantPopoverTrigger.getId() + "-item-standard", {
				key: this.getStandardVariantKey(),
				// text: sText, // issue with curly brackets
				readOnly: true, // !this._getIndustrySolutionMode(),
				executeOnSelection: this.getExecuteOnSelectForStandardVariant()
			});
			oVariantListItem.setText(sText);

			if (this._isIndustrySolutionModeAndVendorLayer() && this.bVariantItemMode) {
				oVariantListItem.setGlobal(true);
				oVariantListItem.setReadOnly(false); // in vendor layer a change should be possible
			}

			if (this.getStandardVariantKey() !== this.STANDARDVARIANTKEY) {
				oItem = this.getItemByKey(this.getStandardVariantKey());
				if (oItem) {
					this._setVariantListItemProperties(oItem, oVariantListItem);
					// oVariantListItem.setReadOnly(true);
					if (oItem.getFavorite && !oItem.getFavorite() && (this.getSelectionKey() === this.getStandardVariantKey())) {
						oVariantListItem.setFavorite(true);
					}
				}
			} else {
				oVariantListItem.setAuthor(this.getStandardItemAuthor());
				oVariantListItem.setReadOnly(true); // BCP: 1880093559
				oVariantListItem.setFavorite(this.getStandardFavorite());
			}
		}

		return oVariantListItem;
	};

	VariantManagement.prototype._createVariantListItem = function(oItem, iCount) {
		var oVariantListItem = new VariantItem(this.oVariantPopoverTrigger.getId() + "-item-" + iCount, {
			key: oItem.getKey(),
			text: oItem.getText()
		// leads to issues if curly brackets are added
		});

		// oVariantListItem.setText(oItem.getText());

		this._setVariantListItemProperties(oItem, oVariantListItem);

		return oVariantListItem;
	};

	VariantManagement.prototype._setVariantListItemProperties = function(oItem, oVariantListItem) {
		if (oItem.getReadOnly) {
			oVariantListItem.setReadOnly(oItem.getReadOnly());
		}
		if (oItem.getExecuteOnSelection) {
			oVariantListItem.setExecuteOnSelection(oItem.getExecuteOnSelection());
		}
		if (oItem.getGlobal) {
			oVariantListItem.setGlobal(oItem.getGlobal());
		}
		if (oItem.getLifecyclePackage) {
			oVariantListItem.setLifecyclePackage(oItem.getLifecyclePackage());
		}
		if (oItem.getLifecycleTransportId) {
			oVariantListItem.setLifecycleTransportId(oItem.getLifecycleTransportId());
		}
		if (oItem.getNamespace) {
			oVariantListItem.setNamespace(oItem.getNamespace());
		}
		if (oItem.getAccessOptions) {
			oVariantListItem.setAccessOptions(oItem.getAccessOptions());
		}
		if (oItem.getLabelReadOnly) {
			oVariantListItem.setLabelReadOnly(oItem.getLabelReadOnly());
		}
		if (oItem.getAuthor) {
			oVariantListItem.setAuthor(oItem.getAuthor());
		}
		if (oItem.getFavorite) {
			oVariantListItem.setFavorite(oItem.getFavorite());
		}
		if (oItem.getContexts) {
			oVariantListItem.setContexts(oItem.getContexts());
		}
	};

	// exit destroy all controls created in init
	VariantManagement.prototype.exit = function() {

		if (this.oVariantInvisbletext) {
			this.oVariantInvisbletext.destroy(true);
			this.oVariantInvisbletext = undefined;
		}

		if (this.oSearchField) {
			this.oSearchField.destroy();
			this.oSearchField = undefined;
		}
		if (this.oManageDialogSearchField) {
			this.oManageDialogSearchField.destroy();
			this.oManageDialogSearchField = undefined;
		}

		if (this.oVariantManage) {
			this.oVariantManage.destroy();
			this.oVariantManage = undefined;
		}
		if (this.oVariantSave) {
			this.oVariantSave.destroy();
			this.oVariantSave = undefined;
		}
		if (this.oVariantList) {
			this.oVariantList.destroy();
			this.oVariantList = undefined;
		}
		if (this.oInputName) {
			this.oInputName.destroy();
			this.oInputName = undefined;
		}
		if (this.oLabelName) {
			this.oLabelName.destroy();
			this.oLabelName = undefined;
		}
		if (this.oDefault) {
			this.oDefault.destroy();
			this.oDefault = undefined;
		}
		if (this.oSaveSave) {
			this.oSaveSave.destroy();
			this.oSaveSave = undefined;
		}
		if (this.oSaveDialog) {
			this.oSaveDialog.destroy();
			this.oSaveDialog = undefined;
		}
		if (this.oManagementTable) {
			this.oManagementTable.destroy();
			this.oManagementTable = undefined;
		}
		if (this.oManagementSave) {
			this.oManagementSave.destroy();
			this.oManagementSave = undefined;
		}
		if (this.oManagementDialog) {
			this.oManagementDialog.destroy();
			this.oManagementDialog = undefined;
		}
		if (this.oVariantText) {
			this.oVariantText.destroy();
			this.oVariantText = undefined;
		}
		if (this.oVariantPopoverTrigger) {
			this.oVariantPopoverTrigger.destroy();
			this.oVariantPopoverTrigger = undefined;
		}
		if (this.oVariantLayout) {
			this.oVariantLayout.destroy();
			this.oVariantLayout = undefined;
		}
		if (this.oVariantPopOver) {
			this.oVariantPopOver.destroy();
			this.oVariantPopOver = undefined;
		}
		if (this.oVariantSaveAs) {
			this.oVariantSaveAs.destroy();
			this.oVariantSaveAs = undefined;
		}
		if (this.oShare) {
			this.oShare.destroy();
			this.oShare = undefined;
		}
		if (this.oExecuteOnSelect) {
			this.oExecuteOnSelect.destroy();
			this.oExecuteOnSelect = undefined;
		}
		if (this.oCreateTile) {
			this.oCreateTile.destroy();
			this.oCreateTile = undefined;
		}
		if (this.oSaveDialogOptionsGrid) {
			this.oSaveDialogOptionsGrid.destroy();
			this.oSaveDialogOptionsGrid = undefined;
		}
		if (this.oVariantSelectionPage) {
			this.oVariantSelectionPage.destroy();
			this.oVariantSelectionPage = undefined;
		}
		if (this.oErrorVariantPopOver) {
			this.oErrorVariantPopOver.destroy();
			this.oErrorVariantPopOver = undefined;
		}

		if (this.oInputKey) {
			this.oInputKey.destroy();
			this.oInputKey = undefined;
		}
		if (this.oLabelKey) {
			this.oLabelKey.destroy();
			this.oLabelKey = undefined;
		}

		if (this.oModel) {
			this.oModel.destroy();
			this.oModel = undefined;
		}
	};

	VariantManagement.prototype.addItem = function(oItem) {
		oItem = this.validateAggregation("items", oItem, true);
		this.bVariantItemMode = false;
		this.addAggregation("items", oItem, false);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oItem, _sKey);
		this._setStandardText();
		return this;
	};

	VariantManagement.prototype.insertItem = function(oItem, iIndex) {
		var _iIndex = iIndex;
		oItem = this.validateAggregation("items", oItem, true);
		this.bVariantItemMode = false;
		this.insertAggregation("items", oItem, _iIndex);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oItem, _sKey);
		this._setStandardText();
		return this;
	};

	VariantManagement.prototype.removeItem = function(oItem) {
		oItem = this.removeAggregation("items", oItem);
		return oItem;
	};

	VariantManagement.prototype.removeAllItems = function() {
		var ret = this.removeAllAggregation("items");
		this._setSelectedItem(null);
		return ret;
	};

	VariantManagement.prototype.destroyItems = function() {
		this.destroyAggregation("items");
		this._setSelectedItem(null);
		return this;
	};

	VariantManagement.prototype._getItems = function() {
		if (this.bVariantItemMode) {
			return this.getVariantItems();
		} else {
			return this.getItems();
		}
	};

	VariantManagement.prototype._removeItem = function(oItem) {
		if (this.bVariantItemMode) {
			return this.removeVariantItem(oItem);
		} else {
			return this.removeItem(oItem);
		}
	};

	VariantManagement.prototype.getItemByKey = function(sKey) {
		var oItems = this._getItems();
		for (var iCount = 0; iCount < oItems.length; iCount++) {
			if (sKey == oItems[iCount].getKey()) {
				return oItems[iCount];
			}
		}
		return null;
	};

	VariantManagement.prototype.addVariantItem = function(oVariantItem) {
		oVariantItem = this.validateAggregation("variantItems", oVariantItem, true);
		this.bVariantItemMode = true;
		this.addAggregation("variantItems", oVariantItem, false);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oVariantItem, _sKey);
		this._setStandardText();

		oVariantItem.attachChange(this._variantItemChange.bind(this, null));

		return this;
	};

	VariantManagement.prototype.insertVariantItem = function(oVariantItem, iIndex) {
		var _iIndex = iIndex;
		oVariantItem = this.validateAggregation("variantItems", oVariantItem, true);
		this.bVariantItemMode = true;
		this.insertAggregation("variantItems", oVariantItem, _iIndex);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oVariantItem, _sKey);
		this._setStandardText();

		oVariantItem.attachChange(this._variantItemChange.bind(this, null));

		return this;
	};

	/**
	 * Event-handler is called when the property of a filter item has changed.
	 * @private
	 * @param {object} oContainer the container of the filter item's control and label
	 * @param {object} oEvent the event
	 */
	VariantManagement.prototype._variantItemChange = function(oContainer, oEvent) {
		var sPropertyName;

		if (oEvent && oEvent.oSource && (oEvent.oSource.isA("sap.ui.comp.variants.VariantItem"))) {
			sPropertyName = oEvent.getParameter("propertyName");
			if (sPropertyName === "text") {
				if (oEvent.oSource === this._getSelectedItem()) {
					this.oModel.setProperty("/selectedVariant", this._getSelectedItem().getText());
				}
			}
		}
	};

	VariantManagement.prototype._setSelectedItem = function(oItem) {
		this.oSelectedItem = oItem;
		// when standard variant comes from SmartVariant Management texts from other languages overrule the translation of "Standard"
		if (oItem != null && oItem.getKey() != this.getStandardVariantKey()) {
			this._setVariantText(oItem.getText());
		} else {
			this._setStandardText();
		}
	};

	VariantManagement.prototype._getSelectedItem = function() {
		return this.oSelectedItem;
	};

	VariantManagement.prototype.setInitialSelectionKey = function(sKey) {
		this.setProperty("initialSelectionKey", sKey, true); // do not re-render !
		this._setSelectionByKey(sKey);
		return this;
	};

	VariantManagement.prototype.setEnabled = function(bEnabled) {
		this.setProperty("enabled", bEnabled, false);

		if (!bEnabled) {
			this.oVariantText.removeStyleClass("sapUICompVarMngmtClickable");
			this.oVariantModifiedText.removeStyleClass("sapUICompVarMngmtClickable");
			this.oVariantPopoverTrigger.removeStyleClass("sapUICompVarMngmtClickable");
			this.oVariantText.addStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantPopoverTrigger.addStyleClass("sapUICompVarMngmtDisabled");

		} else {
			this.oVariantText.removeStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantModifiedText.removeStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantPopoverTrigger.removeStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantText.addStyleClass("sapUICompVarMngmtClickable");
			this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtClickable");
			this.oVariantPopoverTrigger.addStyleClass("sapUICompVarMngmtClickable");
		}
		return this;
	};

	VariantManagement.prototype.getFocusDomRef = function() {
		if (this.oVariantPopoverTrigger && this.getEnabled()) {
			return this.oVariantPopoverTrigger.getFocusDomRef();
		}

		// return sap.ui.core.Element.prototype.getFocusDomRef.apply(this, []);
	};

	/**
	 * The string given as "sKey" will be used to set the initial selected item of the <code>VariantManagement</code>. If an item exists with the
	 * matching key the item will be marked as selected If the key is set before any items are added the <code>VariantManagement</code> will try to
	 * set the selection when the items are added in "addItem" or "insterItem".
	 * @param {sap.ui.core.Item} oItem the Item to be compared
	 * @param {string} sKey the string used to be compared with the item's key attribute
	 */
	VariantManagement.prototype._setSelection = function(oItem, sKey) {
		if (oItem.getKey() === sKey) {
			this._setSelectedItem(oItem);
			this.fireSelect({
				key: sKey
			});
		}
	};

	VariantManagement.prototype.addStyleClass = function(sStyleClass) {
		if (Control.prototype.addStyleClass) {
			Control.prototype.addStyleClass.apply(this, arguments);
		}
		if (this.oVariantPopOver) {
			this.oVariantPopOver.addStyleClass(sStyleClass);
		}
		if (this.oSaveDialog) {
			this.oSaveDialog.addStyleClass(sStyleClass);
		}
		if (this.oManagementDialog) {
			this.oManagementDialog.addStyleClass(sStyleClass);
		}
	};

	VariantManagement.prototype.removeStyleClass = function(sStyleClass) {
		if (Control.prototype.addStyleClass) {
			Control.prototype.removeStyleClass.apply(this, arguments);
		}
		if (this.oVariantPopOver) {
			this.oVariantPopOver.removeStyleClass(sStyleClass);
		}
		if (this.oSaveDialog) {
			this.oSaveDialog.removeStyleClass(sStyleClass);
		}
		if (this.oManagementDialog) {
			this.oManagementDialog.removeStyleClass(sStyleClass);
		}
	};

	/**
	 * Removes the current variant selection and resets to default value.
	 * @public
	 * @since 1.22.0
	 */
	VariantManagement.prototype.clearVariantSelection = function() {
		this.setInitialSelectionKey(this.getStandardVariantKey());
		this._setSelectedItem(null);
	};

	/**
	 * If the oControl has the ".sapUiSizeCompact" class it will be also set on the oDialog
	 * @param {sap.ui.core.Control} oControl the control to be checked for compact
	 * @param {sap.ui.core.Control} oDialog the dialog/popover to receive the compact style class
	 */
	VariantManagement.prototype._setDialogCompactStyle = function(oControl, oDialog) {
		if (this._checkDialogCompactStyle(oControl)) {
			oDialog.addStyleClass("sapUiSizeCompact");
		} else {
			oDialog.removeStyleClass("sapUiSizeCompact");
		}
	};

	/**
	 * If the oControl has the ".sapUiSizeCompact" the function will return true
	 * @param {sap.ui.core.Control} oControl the control to be checked for compact
	 * @returns {boolean} result
	 */
	VariantManagement.prototype._checkDialogCompactStyle = function(oControl) {
		if (oControl.$().closest(".sapUiSizeCompact").length > 0) {
			return true;
		} else {
			return false;
		}
	};

	VariantManagement.prototype.getSelectionKey = function() {
		var sKey = null;
		var oItem = this._getSelectedItem();
		if (oItem !== null) {
			sKey = oItem.getKey();
		} else if (this.bVariantItemMode) {
			sKey = this.getStandardVariantKey();
		} else {
			sKey = null;
		}
		return sKey;
	};

	VariantManagement.prototype._setSelectionByKey = function(sKey) {
		var oItems = this._getItems();
		var bFound = false;
		if (oItems.length > 0) {
			for (var iI = 0; iI < oItems.length; iI++) {
				if (oItems[iI].getKey() === sKey) {
					this._setSelectedItem(oItems[iI]);
					bFound = true;
					break;
				}
			}
		}
		if (!bFound) {
			this._setSelectedItem(null);
		}
	};

	/**
	 * Sets the new selected variant.
	 * @public
	 * @param {string} sKey - Key of the variant that should be selected.
	 */
	VariantManagement.prototype.setCurrentVariantKey = function (sKey) {
		this._setSelectionByKey(sKey);
	};

	/**
	 * Replaces the key as proposed by the <code>VariantManagement</code> control with the one as proposed by the control usage.
	 * @public
	 * @param {string} sOldKey - Key as proposed by the <code>VariantManagement</code> control.
	 * @param {string} sNewKey - New key which should be used instead of the sOldKey
	 */
	VariantManagement.prototype.replaceKey = function(sOldKey, sNewKey) {
		var oItems = this._getItems();
		if (oItems.length > 0) {
			for (var iI = 0; iI < oItems.length; iI++) {
				if (oItems[iI].getKey() === sOldKey) {
					oItems[iI].setKey(sNewKey);
					if (this.getDefaultVariantKey() == sOldKey) {
						this.setDefaultVariantKey(sNewKey);
					}
					if (this._getSelectedItem() === oItems[iI]) {
						this._setSelectedItem(null);
					}
					break;
				}
			}
		}
	};

	VariantManagement.prototype.verifyVariantKey = function(sKey) {
		return this.getItemByKey(sKey) ? true : false;
	};

	VariantManagement.prototype.createVariantEntry = function(oVariantInfo) {
		var sKey = "SV" + new Date().getTime();
		var oItem = new VariantItem({
			key: sKey,
			text: oVariantInfo.name,
			global: oVariantInfo.global
		});

		this.addAggregation("variantItems", oItem, false);

		return sKey;
	};

	VariantManagement.prototype._assignUser = function(sKey, sUser) {
		var oItem = this.getItemByKey(sKey);
		if (oItem && oItem.isA("sap.ui.comp.variants.VariantItem") && !oItem.getAuthor()) {
			oItem.setAuthor(sUser);
		}
	};

	/**
	 * Sets the dirty flag of the current variant.
	 * @public
	 * @param {boolean} bFlag The value indicating the dirty state of the current variant
	 */
	VariantManagement.prototype.currentVariantSetModified = function(bFlag) {

		if (this.oModel) {
			this.oModel.setProperty("/enabled", bFlag);
		}
	};

	/**
	 * Gets the dirty flag of the current variant.
	 * @public
	 * @returns {boolean} The dirty state of the current variant
	 */
	VariantManagement.prototype.currentVariantGetModified = function() {
		return this.oModel.getProperty("/enabled");
	};

	VariantManagement.prototype._delayedControlCreation = function() {
		var that = this;

		if (this._bInnerControlsCreated) {
			return;
		}

		this._bInnerControlsCreated = true;

		this.oVariantManage = new Button(this.getId() + "-manage", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_MANAGE"),
			enabled: true, // FIORITECHP1-3572
			press: function() {
				that._openVariantManagementDialog();
			},
			layoutData: new OverflowToolbarLayoutData({
				priority: OverflowToolbarPriority.High
			})
		});

		this.oVariantSave = new Button(this.getId() + "-mainsave", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE"),
			press: function() {
				var oEvent = that._createEvent("variantSavePressed", that._variantSavePressed);
				that._addEvent(oEvent);
			},
			visible: {
				parts: [{
					path: 'save_enablement>/creationAllowed'
				},{
					path: 'save_enablement>/saveVariantVisible'
				}],
				formatter: function(bCreationAllowed, bSaveVariantVisible) {
					return bCreationAllowed && bSaveVariantVisible;
				}
			},
			type: ButtonType.Emphasized,
			layoutData: new OverflowToolbarLayoutData({
				priority: OverflowToolbarPriority.Low
			})
		});
		this.oVariantSave.setModel(this.oModel);

		this.oVariantSaveAs = new Button(this.getId() + "-saveas", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVEAS"),
			press: function() {
				that._openSaveAsDialog();
			},
			visible: "{save_enablement>/creationAllowed}",
			layoutData: new OverflowToolbarLayoutData({
				priority: OverflowToolbarPriority.Low
			})
		});

		this.oVariantList = new SelectList(this.getId() + "-list", {
			itemPress: function(event) {
				var sSelectionKey = null;
				if (event && event.getParameters()) {
					var oItemPressed = event.getParameters().item;
					if (oItemPressed) {
						sSelectionKey = oItemPressed.getKey();

					}
				}
				if (sSelectionKey) {
					that.lastSelectedVariantKey = sSelectionKey;
					that._setSelectionByKey(sSelectionKey);
					that.oVariantPopOver.close();
					that.oModel.setProperty("/enabled", false);
					that.bFireSelect = true;
				}
			}
		});
		this.oVariantList.setNoDataText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_NODATA"));

		this.oSearchField = new SearchField();
		this.oSearchField.attachLiveChange(function(oEvent) {
			that._triggerSearch(oEvent);
		});

		this._handleArrowUpDown(this.oVariantList, this.oSearchField);

		this.oVariantSelectionPage = new Page(this.getId() + "selpage", {
			subHeader: new Toolbar({
				content: [
					this.oSearchField
				]
			}),
			content: [
				this.oVariantList
			],
			footer: new OverflowToolbar({
				content: [
					new ToolbarSpacer(this.getId() + "-spacer"), this.oVariantSave, this.oVariantSaveAs, this.oVariantManage
				]
			}),
			showSubHeader: false,
			showNavButton: false,
			showHeader: false
		});
		this.oVariantPopOver = new ResponsivePopover(this.getId() + "-popover", {
			title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTS"),
			titleAlignment: "Auto",
			contentWidth: "400px",
			placement: PlacementType.VerticalPreferredBottom,
			content: [
				this.oVariantSelectionPage
			],
			afterOpen: function() {
				that.bPopoverOpen = true;
				that.oVariantPopoverTrigger.setPressed(true);
				that._markSharedVariants();
			},
			afterClose: function() {
				that.oVariantPopoverTrigger.setPressed(false);
				if (that.bPopoverOpen) {
					if (that.bFireSelect == true) {
						that.bFireSelect = false;
						that._fireSelectAsync();
					}
					//that.bPopoverOpen = false;
					setTimeout(function() {
						that.bPopoverOpen = false;
					}, 200);
				}
			},
			contentHeight: "300px"
		});

		this.oVariantPopOver.setParent(this);

		this.oVariantPopOver.addStyleClass("sapUICompVarMngmtPopover");

		/* save new dialog */
		this.oInputName = new Input(this.getId() + "-name", {
			liveChange: function(oEvent) {
				that._checkVariantNameConstraints(this);
			}
		});
		this.oLabelName = new Label(this.getId() + "-namelabel", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_NAME")
		});
		this.oLabelName.setLabelFor(this.oInputName);
		this.oLabelName.addStyleClass("sapUiCompVarMngmtSaveDialogLabel");

		this.oDefault = new CheckBox(this.getId() + "-default", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SETASDEFAULT"),
			enabled: true,
			visible: true,
			width: "100%"
		});

		this.oExecuteOnSelect = new CheckBox(this.getId() + "-execute", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_EXECUTEONSELECT"),
			enabled: true,
			visible: false,
			width: "100%"
		});

		this.oCreateTile = new CheckBox(this.getId() + "-tile", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_CREATETILE"),
			enabled: true,
			visible: false,
			width: "100%"
		});

		this.oShare = new CheckBox(this.getId() + "-share", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SHARE"),
			enabled: true,
			visible: false,
			select: function(oControlEvent) {
				var oEvent = that._createEvent("inputfieldChange", that._handleShareSelected);
				oEvent.args.push(oControlEvent);
				that._addEvent(oEvent);
			},
			width: "100%"
		});

		this.oInputKey = new Input(this.getId() + "-key", {
			liveChange: function(oEvent) {
				that._checkVariantNameConstraints(this);
			}
		});

		this.oLabelKey = new Label(this.getId() + "-keylabel", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_KEY"),
			required: true
		});
		this.oLabelKey.setLabelFor(this.oInputKey);

		this.oSaveSave = new Button(this.getId() + "-variantsave", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE"),
			type: ButtonType.Emphasized,
			press: function() {
				that._checkVariantNameConstraints(that.oInputName);

				if (that.oInputName.getValueState() === "Error" ) {
					that.oInputName.focus();
					return;
				}
				that._bSaveCanceled = false;

				if (that._fGetDataForKeyUser) {
					that._handleSaveAsPressedForKeyUser();
				} else {
					that._triggerSave();
				}
			},
			enabled: true
		});
		this.oSaveDialogOptionsGrid = new Grid({
			defaultSpan: "L12 M12 S12"
		});

		this.oManagementTable = new Table(this.getId() + "-managementTable", {
			// autoPopinMode: true
			contextualWidth: "Auto",
			fixedLayout: false
		});

		this.oManagementSave = new Button(this.getId() + "-managementsave", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE"),
			enabled: true,
			type: ButtonType.Emphasized,
			press: function() {
				this._saveFromManagementDialog();
			}.bind(this)
		});

	};

	VariantManagement.prototype._saveFromManagementDialog = function() {

		if (this._anyItemInErrorState()) {
			return;
		}

		if (!this._fGetDataForKeyUser) {
			var oEvent = this._createEvent("managementSave", this._handleManageSavePressed);
			this._addEvent(oEvent);
		} else {
			this._handleManageSavePressedForKeyUser();
		}
	};

	VariantManagement.prototype._openInErrorState = function() {
		var that = this, oVBox;

		if (!this.oErrorVariantPopOver) {

			oVBox = new VBox({
				fitContainer: true,
				alignItems: FlexAlignItems.Center,
				items: [
					new Icon({
						size: "4rem",
						color: "lightgray",
						src: "sap-icon://message-error"
					}), new Title({
						titleStyle: TitleLevel.H2,
						text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_TEXT1")
					}), new Text({
						textAlign: TextAlign.Center,
						text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_TEXT2")
					})
				]
			});

			oVBox.addStyleClass("sapUICompVarMngmtErrorPopover");

			this.oErrorVariantPopOver = new ResponsivePopover(this.getId() + "-errorpopover", {
				title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTS"),
				contentWidth: "400px",
				placement: PlacementType.VerticalPreferredBottom,
				content: [
					new Page(this.getId() + "-errorselpage", {
						showSubHeader: false,
						showNavButton: false,
						showHeader: false,
						content: [
							oVBox
						]
					})
				],
				afterOpen: function() {
					that.bPopoverOpen = true;
				},
				afterClose: function() {
					if (that.bPopoverOpen) {
						that.bPopoverOpen = false;
					}
				},
				contentHeight: "300px"
			});

			this.oErrorVariantPopOver.attachBrowserEvent("keyup", function(e) {
				if (e.which === 32) { // UP
					this.oErrorVariantPopOver.close();
				}
			}.bind(this));
		}

		if (this.bPopoverOpen) {
			return;
		}

		this.oErrorVariantPopOver.openBy(this.oVariantLayout);
	};

	/**
	 * Hide or show "Save" button and emphasize "most positive action" - either
	 * "Save" button when visible, "Save As" button if "Save" is hidden.
	 *
	 * @param {boolean} bShow indicator if "Save" button should be visible
	 *
	 * @private
	 */
	VariantManagement.prototype.showSaveButton = function(bShow) {
		if (bShow) {
			this.oVariantSaveAs.setType(ButtonType.Default);
			//this.oVariantSave.setVisible(true);
		} else {
			this.oVariantSaveAs.setType(ButtonType.Emphasized);
			//this.oVariantSave.setVisible(false);
		}

		this.oModel.setProperty("/saveVariantVisible", bShow);
	};

	VariantManagement.prototype._openVariantSelection = function() {

		var oItems = null, oSelectedItem;

		if (this.getInErrorState()) {
			this._openInErrorState();
			return;
		}

		this._delayedControlCreation();

		if (this.bPopoverOpen) {
			return;
		}

		if (this.bVariantItemMode === false && this.getSelectionKey() !== null) {
			this.showSaveButton(true);
		} else {
			this.showSaveButton(false);
		}

		oItems = this._getItems();
		if (oItems.length < 9) {
			this.oVariantSelectionPage.setShowSubHeader(false);
		} else {
			this.oVariantSelectionPage.setShowSubHeader(true);
			this.oSearchField.setValue("");
		}

		this._restoreCompleteList();

		if (this.currentVariantGetModified()) {
			oSelectedItem = this.oVariantList.getItemByKey(this.getSelectionKey());
			if (oSelectedItem) {
				if (!oSelectedItem.getReadOnly() || (this._isIndustrySolutionModeAndVendorLayer() && (this.getStandardVariantKey() === oSelectedItem.getKey()))) {
					this.showSaveButton(true);
				}
			}
		}

		if (this._isIndustrySolutionModeAndVendorLayer() && this.bManualVariantKey && (this.getStandardVariantKey() === this.STANDARDVARIANTKEY)) {
			this.showSaveButton(false);
		}

		this._setDialogCompactStyle(this, this.oVariantPopOver);

		oSelectedItem = this.oVariantList.getSelectedItem();
		if (oSelectedItem) {
			this.oVariantPopOver.setInitialFocus(oSelectedItem.getId());
		}

		var oControlRef = this._oCtrlRef ? this._oCtrlRef : this.oVariantLayout;
		this._oCtrlRef = null;
		this.oVariantPopOver.openBy(oControlRef);
	};

	VariantManagement.prototype._obtainControl = function(oEvent) {
		if (oEvent && oEvent.target && oEvent.target.id) {
			var sId = oEvent.target.id;
			var nPos = sId.indexOf("-inner");
			if (nPos > 0) {
				sId = sId.substring(0, nPos);
			}
			return Element.getElementById(sId);
		}

		return null;
	};

	VariantManagement.prototype.handleOpenCloseVariantPopover = function(oEvent) {
		if (this.oVariantPopOver && this.oVariantPopOver.isOpen()) {
			this.oVariantPopOver.close();
		} else if (!this.bPopoverOpen) {
			this._oCtrlRef = this._obtainControl(oEvent);
			this._openVariantSelection();
		} else if (this.getInErrorState() && this.oErrorVariantPopOver && this.oErrorVariantPopOver.isOpen()) {
			this.oErrorVariantPopOver.close();
		}
	};


	VariantManagement.prototype._initalizeManagementTableColumns = function() {
		if (this.bManagementTableInitialized) {
			return;
		}

		this.oManagementTable.addColumn(new Column({
			width: "3rem",
			visible: this.getUseFavorites() && !this._isIndustrySolutionModeAndVendorLayer()
		}));

		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_NAME")
			}),
			width: "16rem"
		}));


		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTTYPE"),
				wrappingType: "Hyphenated"
			}),
			demandPopin: true,
			popinDisplay: PopinDisplay.Inline,
			minScreenWidth: ScreenSize.Tablet,
			visible: this.getShowShare()
		}));

		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT"),
				wrappingType: "Hyphenated"
			}),
			hAlign: TextAlign.Center,
			demandPopin: true,
			popinDisplay: PopinDisplay.Block,
			minScreenWidth: ScreenSize.Tablet,
			visible: this.getShowSetAsDefault()
		}));

		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_EXECUTEONSELECT"),
				wrappingType: "Hyphenated"
			}),
			hAlign: (this.getDisplayTextForExecuteOnSelectionForStandardVariant && this.getDisplayTextForExecuteOnSelectionForStandardVariant()) ? TextAlign.Begin : TextAlign.Center,
			demandPopin: true,
			popinDisplay: PopinDisplay.Block,
			minScreenWidth: ScreenSize.Tablet,
			visible: this.getShowExecuteOnSelection()
		}));

		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VISIBILITY"),
				wrappingType: "Hyphenated"
			}),
			width: "8rem",
			demandPopin: true,
			popinDisplay: PopinDisplay.Inline,
			minScreenWidth: ScreenSize.Tablet,
			visible: false
		}));

		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_AUTHOR")
			}),
			demandPopin: true,
			popinDisplay: PopinDisplay.Block,
			minScreenWidth: ScreenSize.Tablet
		}));

		this.oManagementTable.addColumn(new Column({
			header: new InvisibleText({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ACTION_COLUMN")
			}),
			hAlign: TextAlign.Center
		}));

		this.bManagementTableInitialized = true;
	};

	VariantManagement.prototype._initalizeSaveAsDialog = function() {
		this.oSaveDialogOptionsGrid.removeAllContent();

		this.oDefault.setVisible(this.getShowSetAsDefault());
		this.oShare.setVisible(this.getShowShare());
		this.oExecuteOnSelect.setVisible(this.getShowExecuteOnSelection());
		this.oCreateTile.setVisible(this.getShowCreateTile());

		if (this.getShowSetAsDefault()) {
			this.oSaveDialogOptionsGrid.addContent(this.oDefault);
		}
		if (this.getShowShare()) {
			this.oSaveDialogOptionsGrid.addContent(this.oShare);
		}
		if (this.getShowExecuteOnSelection()) {
			this.oSaveDialogOptionsGrid.addContent(this.oExecuteOnSelect);
		}
		if (this.getShowCreateTile()) {
			this.oSaveDialogOptionsGrid.addContent(this.oCreateTile);
		}
	};

	VariantManagement.prototype.ontap = function(oEvent) {
		if (this.getEnabled()) {
			if (this.oVariantPopoverTrigger && !this.bPopoverOpen) {
				this.oVariantPopoverTrigger.focus();
			}
			this.handleOpenCloseVariantPopover(oEvent);
		}
	};

	VariantManagement.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.F4 || oEvent.which === KeyCodes.SPACE || oEvent.altKey === true && oEvent.which === KeyCodes.ARROW_UP || oEvent.altKey === true && oEvent.which === KeyCodes.ARROW_DOWN) {
			if (this.getEnabled()) {
				this._oCtrlRef = this._obtainControl(oEvent);
				this._openVariantSelection();
			}
		}
	};


	VariantManagement.prototype.onAfterRendering = function() {

		this.oVariantText.$().off("mouseover").on("mouseover", function() {
			this.oVariantPopoverTrigger.addStyleClass("sapUICompVarMngmtTriggerBtnHover");
		}.bind(this));
		this.oVariantText.$().off("mouseout").on("mouseout", function() {
			this.oVariantPopoverTrigger.removeStyleClass("sapUICompVarMngmtTriggerBtnHover");
		}.bind(this));
	};

	VariantManagement.prototype.onBeforeRendering = function() {
		var fGetMax = function(aContent) {
			var len, maxLength = 0;
			for (var i = 0; i < aContent.length; i++) {
				len = aContent[i].$().width();
				if (len > maxLength) {
					maxLength = len;
				}
			}

			return maxLength;
		};

		if (this.oSaveDialogOptionsGrid && this.oSaveDialog && this.oSaveDialog.getVisible()) {
			var aContent = this.oSaveDialogOptionsGrid.getContent();
			if (aContent && aContent.length > 0) {
				var widthGrid = this.oSaveDialogOptionsGrid.$().width();

				var widthLabel = fGetMax(aContent);

				var widthPaddingLeft = 32;
				var widthCB = 12;
				if (!this._checkDialogCompactStyle(this.oSaveDialog)) {
					widthPaddingLeft = 48;
					widthCB = 18;
				}

				if ((widthPaddingLeft + widthLabel + widthCB) > widthGrid / 2) {
					this.oSaveDialogOptionsGrid.setDefaultSpan("L12 M12 S12");
				}

			}
		}
	};

	VariantManagement.prototype._markSharedVariants = function() {

		var oVariantListItem, oItem, oItems = this._getItems();

		for (var i = 0; i < oItems.length; i++) {
			oItem = oItems[i];

			if (oItem.getGlobal && oItem.getGlobal()) {
				oVariantListItem = this.oVariantList.getItemByKey(oItem.getKey());
				if (oVariantListItem) {
					var oItemElement = oVariantListItem.$();
					if (oItemElement) {
						oItemElement.addClass("sapUiCompVarMngmtSharedVariant");
					}
				}
			}
		}
	};

	VariantManagement.prototype._variantSavePressed = function() {
		var oItem = this._getSelectedItem();

		if (!oItem) {
			if (this.getStandardVariantKey() === this.STANDARDVARIANTKEY) {

				oItem = new VariantItem({
					// text: this._determineStandardVariantName(), // issues with curly brackets
					key: this.STANDARDVARIANTKEY,
					global: this._isIndustrySolutionModeAndVendorLayer()
				});

				oItem.setText(this._determineStandardVariantName());
			} else {
				oItem = this.getItemByKey(this.getStandardVariantKey());
			}
		}

		var bDefault = false;
		if (this.getDefaultVariantKey() === oItem.getKey()) {
			bDefault = true;
		}

		if (oItem.getLifecyclePackage && oItem.getGlobal() == true) {
			var that = this;
			var fOkay = function(sPackage, sTransport) {
				that.oVariantPopOver.close();
				that.sPackage = sPackage;
				that.sTransport = sTransport;
				that.fireSave({
					name: oItem.getText(),
					overwrite: true,
					key: oItem.getKey(),
					def: bDefault,
					global: (that._isIndustrySolutionModeAndVendorLayer() && (that.getStandardVariantKey() === that.getStandardVariantKey())), // eslint-disable-line
					lifecyclePackage: that.sPackage,
					lifecycleTransportId: that.sTransport
				});
				oItem.setLifecycleTransportId(that.sTransport);
				// that.bDirty = false;
				that.oModel.setProperty("/enabled", false);
				that._eventDone();
			};
			var fError = function(oResult) {
				that.sTransport = null;
				that.sPackage = null;
				that._cancelAllEvents();
			};
			this._assignTransport(oItem, fOkay, fError, this.oVariantText);
		} else {
			this.oVariantPopOver.close();
			this.fireSave({
				name: oItem.getText(),
				overwrite: true,
				key: oItem.getKey(),
				def: bDefault
			});
			this.oModel.setProperty("/enabled", false);
			this._eventDone();
		}
	};

	VariantManagement.prototype._assignTransport = function(oVariant, fOkay, fError, oControl) {
		var oObject = {
			type: "variant",
			name: "",
			namespace: ""
		};
		oObject["package"] = "";
		if (oVariant !== null) {
			oObject["package"] = oVariant.getLifecyclePackage();
			oObject["name"] = oVariant.getKey();
			oObject["namespace"] = oVariant.getNamespace();
		}
		var _fOkay = function(oResult) {
			var sPackage;
			var sTransport;
			sTransport = oResult.getParameters().selectedTransport;
			sPackage = oResult.getParameters().selectedPackage;
			fOkay(sPackage, sTransport);
		};
		var _fError = function(oResult) {
			fError(oResult);
		};
		if (this.getLifecycleSupport()) {
			var sTransport = null;
			if (oVariant) {
				sTransport = oVariant.getLifecycleTransportId();
			}
			if (sTransport != null && sTransport.trim().length > 0) {
				fOkay(oObject["package"], sTransport);
			} else {
				this._getTransportSelection().then(function(oTransports) {
					oTransports.selectTransport(oObject, _fOkay, _fError, this._checkDialogCompactStyle(oControl), oControl);
				}.bind(this));
			}
		} else {
			fOkay(oObject["package"], "");
		}
	};
	VariantManagement.prototype._getTransportSelection = function() {
		if (this.getTransportSelection) {
			return this.getTransportSelection();
		} else {
			return this._getFlTransportSelection();
		}
	};

	VariantManagement.prototype._getFlTransportSelection = function() {
		//TODO: Only load the write part of sap.ui.fl library
		return Library.load({name: 'sap.ui.fl'}).then(function() {
			return new Promise(function(fResolve) {
				sap.ui.require([
					"sap/ui/fl/write/api/SmartVariantManagementWriteAPI"
				], function(FlexWriteAPI) {
					fResolve(FlexWriteAPI._getTransportSelection());
				});
			});
		});
	};

	VariantManagement.prototype.getDefaultVariantKey = function() {
		var sValue = this.getProperty("defaultVariantKey");
		if (sValue === "") {
			if (this.bVariantItemMode) {
				sValue = this.getStandardVariantKey();
			}
		}
		return sValue;
	};

	VariantManagement.prototype._compareItems = function(first, second) {
		var sFirst = first.getText();
		var sSecond = second.getText();
		var sFirstU = sFirst.toUpperCase();
		var sSecondU = sSecond.toUpperCase();
		if (sFirstU == sSecondU) {
			if (sFirst == sSecond) {
				return 0;
			}
			if (sFirst < sSecond) {
				return -1;
			}
			if (sFirst > sSecond) {
				return 1;
			}
		}
		if (sFirstU < sSecondU) {
			return -1;
		}
		if (sFirstU > sSecondU) {
			return 1;
		}
	};

	VariantManagement.prototype._accessOptionsText = function(sOptions) {
		var sMessage = null;
		switch (sOptions) {
			case "R":
				sMessage = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LAYER");
				break;
			case "RD":
				sMessage = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LANGUAGE");
				break;
			default:
				sMessage = null;
		}
		return sMessage;
	};

	VariantManagement.prototype._openSaveAsDialog = function() {

		this._initSaveAsDialog();

		this.oSaveDialog.open();
	};

	VariantManagement.prototype._initSaveAsDialog = function() {
		this._initalizeSaveAsDialog();

		this.oInputName.setValue(this.oModel.getProperty("/selectedVariant"));

		this.oInputName.setEnabled(true);
		this.oInputName.setValueState(ValueState.None);
		this.oInputName.setValueStateText(null);
		this.oDefault.setSelected(false);
		this.oShare.setSelected(false);
		this.oCreateTile.setSelected(false);
		this.oExecuteOnSelect.setSelected(false);

		// set variant name to Standard
		if (this._isIndustrySolutionModeAndVendorLayer() /* && this.bManualVariantKey */) {
			this.oInputName.setValue(this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD"));
			// this.oInputName.setEnabled(false);
		}

		this._createSaveDialog();
		this._setDialogCompactStyle(this, this.oSaveDialog);
		this.oVariantPopOver.close();
		this.sTransport = null;
		this.sPackage = null;
		if (this.bManualVariantKey) {
			this.oInputKey.setVisible(true);
			this.oInputKey.setEnabled(true);
			this.oInputKey.setValueState(ValueState.None);
			this.oInputKey.setValueStateText(null);
			this.oLabelKey.setVisible(true);
		} else {
			this.oInputKey.setVisible(false);
			this.oLabelKey.setVisible(false);
		}
	};

	VariantManagement.prototype._checkManageItemNameChange = function(oManageItem) {
		var sText = "";
		var oInputField = null;
		var that = this;
		oInputField = oManageItem.getCells()[VariantManagement.NAME_COLUMN];

		sText = oInputField.getValue();
		sText = sText.trim();
		var oEditableVariantItem = oManageItem;
		var sKey = oEditableVariantItem.getKey();

		this._checkVariantNameConstraints(oInputField, this.oManagementTable);

		if (oInputField.getValueState() === ValueState.Error) {
			// this.oManagementSave.setEnabled(false);
			this._eventDone();
			return;
		}

		if (this.oVariantList.getItemByKey(sKey).getText().trim() === sText) {
			this._eventDone();
			return;
		}

		if (oEditableVariantItem.getGlobal()) {
			var fOkay = function(sPackage, sTransport) {
				oEditableVariantItem.setLifecyclePackage(sPackage);
				oEditableVariantItem.setLifecycleTransportId(sTransport);
				that._eventDone();
			};

			var fError = function(oResult) {
				if (that && that.oVariantList) {
					var oItem = that.oVariantList.getItemByKey(sKey); // ???
					oInputField.setValue(oItem.getText());
				}
				that._cancelAllEvents();
			};

			this._createManagementDialog();
			this._assignTransport(oEditableVariantItem, fOkay, fError, this.oManagementDialog);
		} else {
			this._eventDone();
		}
	};


	VariantManagement.prototype._handleManageSavePressed = function() {
		var oNewItems = this.oManagementTable.getItems();
		var oItem, oControl;
		var fireSelect = false;
		var sName = "";
		var oOriginalItem = null;
		var iD = 0;
		var aFavoriteChanges = [];

		for (var iG = 0; iG < oNewItems.length; iG++) {
			oItem = this.oVariantList.getItemByKey(oNewItems[iG].getKey());
			oControl = oNewItems[iG].getCells()[VariantManagement.NAME_COLUMN];
			if (oControl && oControl.getValue) {
				sName = oControl.getValue();
			} else if (oControl && oControl.getTitle) {
				sName = oControl.getTitle();
			} else if (oControl && oControl.getText) {
				sName = oControl.getText();
			}

			sName = sName.trim();
			if (oItem.getText() !== sName) {
				this.aRenamedVariants.push({
					key: oItem.getKey(),
					name: sName
				});
				oOriginalItem = this.getItemByKey(oNewItems[iG].getKey());
				oOriginalItem.setText(sName);
				if (oOriginalItem.setLifecyclePackage) {
					oOriginalItem.setLifecyclePackage(oNewItems[iG].getLifecyclePackage());
					oOriginalItem.setLifecycleTransportId(oNewItems[iG].getLifecycleTransportId());
				}

				if (this.lastSelectedVariantKey === oItem.getKey()) {
					this._setVariantText(sName);
				}
			}

			if (this.getUseFavorites() && !this._isIndustrySolutionModeAndVendorLayer()) {
				var sKey = oNewItems[iG].getKey();
				if (this._mFavoriteChanges && this._mFavoriteChanges[sKey] !== undefined) {
					var bNewSelected = this._mFavoriteChanges[sKey];

					if (sKey === this.STANDARDVARIANTKEY) {
						if (this.getStandardFavorite() !== bNewSelected) {
							aFavoriteChanges.push({
								key: sKey,
								visible: bNewSelected
							});
							this.setStandardFavorite(bNewSelected);
						}
					} else {
						oOriginalItem = this.getItemByKey(oNewItems[iG].getKey());
						if (oOriginalItem && oItem.getFavorite && (oItem.getFavorite() !== bNewSelected)) {
							aFavoriteChanges.push({
								key: sKey,
								visible: bNewSelected
							});
							oOriginalItem.setFavorite(bNewSelected);
						}
					}

				}
			}

			if (this.getShowExecuteOnSelection() && oItem.getExecuteOnSelection && oNewItems[iG].getCells()[VariantManagement.EXEC_COLUMN].isA("sap.m.CheckBox") && oItem.getExecuteOnSelection() != oNewItems[iG].getCells()[VariantManagement.EXEC_COLUMN].getSelected()) {
				// execute on selection changed
				var bFlag = oNewItems[iG].getCells()[VariantManagement.EXEC_COLUMN].getSelected();
				var oItemTmp = this.getItemByKey(oNewItems[iG].getKey());

				if (!oItemTmp && (this.getSupportExecuteOnSelectOnSandardVariant() & (oNewItems[iG].getKey() === this.getStandardVariantKey()/* this.STANDARDVARIANTKEY */))) {
					oItemTmp = new VariantItem();
				}

				if (oItemTmp && oItemTmp.setExecuteOnSelection) {
					oItemTmp.setExecuteOnSelection(bFlag);

					if (this.getSupportExecuteOnSelectOnSandardVariant() & (oNewItems[iG].getKey() === this.getStandardVariantKey())) {
						this._executeOnSelectForStandardVariantByUser(bFlag);
					}
					this.aExeVariants.push({
						key: oItem.getKey(),
						exe: bFlag
					});
					if (oItemTmp.setLifecyclePackage && !oItemTmp.getReadOnly()) {
						oItemTmp.setLifecyclePackage(oNewItems[iG].getLifecyclePackage());
						oItemTmp.setLifecycleTransportId(oNewItems[iG].getLifecycleTransportId());
					}
				}
			}
		}

		if (this.oManagementDialog) {
			this.oManagementDialog.close();
		}
		if (this.bVariantItemMode === false) {
			if (this.getDefaultVariantKey() != this.sNewDefaultKey) {
				var oItemTmpDef = null;
				if (this.sNewDefaultKey == this.getStandardVariantKey()) {
					oItemTmpDef = this.getItemByKey(this.getDefaultVariantKey());
					this.fireSave({
						name: oItemTmpDef.getText(),
						overwrite: true,
						key: oItemTmpDef.getKey(),
						def: false
					});
				} else {
					oItemTmpDef = this.getItemByKey(this.sNewDefaultKey);
					this.fireSave({
						name: oItemTmpDef.getText(),
						overwrite: true,
						key: oItemTmpDef.getKey(),
						def: true
					});
				}
			}
		}

		if (this.sNewDefaultKey != this.getDefaultVariantKey()) {
			this.setDefaultVariantKey(this.sNewDefaultKey);
		}

		for (iD = 0; iD < this.aRemovedVariants.length; iD++) {
			oItem = this.getItemByKey(this.aRemovedVariants[iD]);
			for (var iE = 0; iE < this.aRemovedVariantTransports.length; iE++) {
				if (this.aRemovedVariants[iD] === this.aRemovedVariantTransports[iE].key) {
					var oManageItem = this.aRemovedVariantTransports[iE];
					if (oItem.setLifecyclePackage) {
						oItem.setLifecycleTransportId(oManageItem.transport);
					}
					break;
				}
			}
		}

		this.fireManage({
			renamed: this.aRenamedVariants,
			deleted: this.aRemovedVariants,
			exe: this.aExeVariants,
			def: this.getDefaultVariantKey(),
			fav: aFavoriteChanges
		});

		for (iD = 0; iD < this.aRemovedVariants.length; iD++) {
			oItem = this.getItemByKey(this.aRemovedVariants[iD]);
			if (oItem) {
				this._removeItem(oItem);
				oItem.destroy();
			}
			if (this.lastSelectedVariantKey === this.aRemovedVariants[iD]) {
				fireSelect = true;
				this._setSelectedItem(null);
				this.oModel.setProperty("/enabled", false);
			}
		}

		if (fireSelect) {
			this.bFireSelect = true;
		}
		this._eventDone();
	};

	// new event processor handling
	VariantManagement.prototype._createEvent = function(sName, fCallback) {
		var oEvent = {
			name: sName,
			fFunc: fCallback,
			args: []
		};
		return oEvent;
	};

	VariantManagement.prototype._handleNextEvent = function() {
		if (this.aEvents.length > 0) {
			if (!this.bEventRunning) {
				this.bEventRunning = true;
				var nextEvent = this.aEvents.pop();
				nextEvent.fFunc.apply(this, nextEvent.args);
			}
		}
	};

	VariantManagement.prototype._addEvent = function(oEvent) {
		this.aEvents.push(oEvent);
		this._handleNextEvent();
	};

	VariantManagement.prototype._cancelAllEvents = function() {
		this.aEvents = [];
		this.bEventRunning = false;
	};

	VariantManagement.prototype._eventDone = function() {
		this.bEventRunning = false;
		this._handleNextEvent();
	};

	VariantManagement.prototype._handleManageExecuteOnSelectionChanged = function(oCheckBox) {
		var that = this;
		var oManageItem = oCheckBox.getParent();
		if (oManageItem && oManageItem.getGlobal() && !oManageItem.getReadOnly()) {
			var fOkay = function(sPackage, sTransport) {
				oManageItem.setLifecyclePackage(sPackage);
				oManageItem.setLifecycleTransportId(sTransport);
				that._eventDone();
			};
			var fError = function(oResult) {
				oCheckBox.setSelected(!oCheckBox.getSelected());
				that._cancelAllEvents();
			};

			this._createManagementDialog();
			this._assignTransport(oManageItem, fOkay, fError, this.oManagementDialog);
		} else {
			this._eventDone();
		}
	};

	VariantManagement.prototype._handleManageDeletePressed = function(oButton) {
		var that = this, oStandardItem;

		var fgetStandardEntry = function() {
			var oStandardItem = null, aItems = that.oManagementTable.getItems();
			aItems.some(function(oEntry) {
				if (oEntry.getKey() === that.getStandardVariantKey()) {
					oStandardItem = oEntry;
					return true;
				}
			});

			return oStandardItem;
		};

		this._anyInErrorState(this.oManagementTable, oButton.getParent().getCells()[VariantManagement.NAME_COLUMN]);

		oStandardItem = fgetStandardEntry();

		var oItem = oButton.getParent();
		if (oItem.getGlobal()) {

			var fOkay = function(sPackage, sTransport) {
				var sKey = oItem.getKey();
				that.aRemovedVariants.push(sKey);
				that.oManagementTable.removeItem(oItem);
				if (that.getShowSetAsDefault()) {
					if ((oItem.getKey() === that.sNewDefaultKey)) {
						if (oStandardItem) {
							oStandardItem.getCells()[VariantManagement.DEF_COLUMN].setSelected(true);
							oStandardItem.getCells()[VariantManagement.DEF_COLUMN].fireSelect({
								selected: true
							});
						} else {
							that.setStandardVariantKey(that.STANDARDVARIANTKEY);
						}
						that.sNewDefaultKey = that.getStandardVariantKey();
					}
				}
				oItem.destroy();
				var oTransportAssignment = {
					key: sKey,
					transport: sTransport
				};
				that.aRemovedVariantTransports.push(oTransportAssignment);
				that._eventDone();
			};
			var fError = function(oResult) {
				that._cancelAllEvents();
			};

			this._createManagementDialog();
			this._assignTransport(oItem, fOkay, fError, this.oManagementDialog);
		} else {
			this.aRemovedVariants.push(oItem.getKey());
			this.oManagementTable.removeItem(oItem);
			if (this.getShowSetAsDefault()) {
				if (oItem.getKey() === this.sNewDefaultKey) {
					if (oStandardItem) {
						oStandardItem.getCells()[VariantManagement.DEF_COLUMN].setSelected(true);
						oStandardItem.getCells()[VariantManagement.DEF_COLUMN].fireSelect({
							selected: true
						});
					}
					this.sNewDefaultKey = this.getStandardVariantKey();
				}
			}
			oItem.destroy();
			this._eventDone();
		}

		var oCancelButton = Element.getElementById(this.getId() + "-managementcancel");
		if (oCancelButton) {
			oCancelButton.focus();
		}
	};

	VariantManagement.prototype._handleShareSelected = function(oControlEvent) {
		var that = this;

		if (oControlEvent.getParameters && oControlEvent.getParameters() && oControlEvent.getParameters().selected) {
			var fOkay = function(sPackage, sTransport) {
				that.sTransport = sTransport;
				that.sPackage = sPackage;
				that._eventDone();
			};
			var fError = function(oResult) {
				that.oShare.setSelected(false);
				that.sTransport = null;
				that.sPackage = null;
				that._cancelAllEvents();
			};

			this._createSaveDialog();
			this._assignTransport(null, fOkay, fError, this.oSaveDialog);
		} else {
			this.sTransport = null;
			this.sPackage = null;
			this._eventDone();
		}
	};

	VariantManagement.prototype._handleVariantSaveAs = function() {
		var sKey = "SV" + new Date().getTime();
		var sName = this.oInputName.getValue();
		var sManualKey = this.oInputKey.getValue();
		var sTransport = "";
		var sPackage = "";
		var bExecuteOnSelect = false;
		var bCreateTile = false;
		var oItem = null;
		sName = sName.trim();
		if (sName == "") {
			this.oInputName.setValueState(ValueState.Error);
			this.oInputName.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
			this._cancelAllEvents();
			return;
		}
		sManualKey = sManualKey.trim();
		if (this.bManualVariantKey && sManualKey == "") {
			this.oInputKey.setValueState(ValueState.Error);
			this.oInputKey.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
			this._cancelAllEvents();
			return;
		}
		if (this.bManualVariantKey) {
			sKey = sManualKey;
		}

		if (this.oSaveDialog) {
			this.oSaveDialog.close();
		}
		if (this.oExecuteOnSelect !== null) {
			bExecuteOnSelect = this.oExecuteOnSelect.getSelected();
		}
		if (this.oCreateTile !== null) {
			bCreateTile = this.oCreateTile.getSelected();
		}
		if (this.bVariantItemMode) {
			oItem = new VariantItem({
				key: sKey,
				// text: sName, issue with curly brackets
				readOnly: false,
				executeOnSelection: bExecuteOnSelect,
				global: this.oShare.getSelected(),
				lifecycleTransportId: this.sTransport,
				lifecyclePackage: this.sPackage
			});
			oItem.setText(sName);
			this.addVariantItem(oItem);
			this._setSelectedItem(oItem);
		} else {
			oItem = new Item({
				key: sKey
			// , text: sName // issues with curly brackets
			});
			oItem.setText(sName);

			this.addItem(oItem);
			this._setSelectedItem(oItem);
		}
		if (this.oDefault.getSelected()) {
			this.setDefaultVariantKey(sKey);
		}
		if (this.oShare.getSelected()) {
			sPackage = this.sPackage;
			sTransport = this.sTransport;
		}
		this.fireSave({
			name: sName,
			overwrite: false,
			def: this.oDefault.getSelected(),
			key: sKey,
			exe: this.oExecuteOnSelect.getSelected(),
			tile: bCreateTile,
			global: this.oShare.getSelected(),
			lifecyclePackage: sPackage,
			lifecycleTransportId: sTransport
		});
		this.oModel.setProperty("/enabled", false);
		this._eventDone();
	};

	/**
	 * Defines the internal mode. The VariantManagement is able to support two different modes:<br>
	 * 1. the mode with standard entry displayed as 'Default' and<br>
	 * 2. the mode with standard entry displayed as 'Standard'.<br>
	 * The 'Default' display is the initial mode.<br>
	 * <code>Note:</code> this method has to be executed, before any items are assigned to the VariantManagement control!
	 * @public
	 * @since 1.48.0
	 * @param {boolean} bFlag defines the behavior: <code>false</code> new mode, otherwize 'old' mode.
	 */
	VariantManagement.prototype.setBackwardCompatibility = function(bFlag) {
		this._setBackwardCompatibility(bFlag);
	};

	VariantManagement.prototype._setBackwardCompatibility = function(bFlag) {
		if (this.getItems().length === 0 && this.getVariantItems().length === 0) {
			this.bVariantItemMode = !bFlag;
		}
		this._setStandardText();
	};

	VariantManagement.prototype._setStandardText = function() {
		var sKey = this.getSelectionKey();
		if (sKey === null || sKey === this.getStandardVariantKey()) {
			if (this.bVariantItemMode == false) {
				this._setVariantText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT"));
			} else {
				this._setVariantText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD"));
			}
			if (this.getStandardItemText() !== null && this.getStandardItemText() != "") {
				this._setVariantText(this.getStandardItemText());
			}
		}
	};

	VariantManagement.prototype._setVariantText = function(sText) {

		var oModel, oBInfo = this.extractBindingInfo(sText), sValue = sText;

		if ((typeof oBInfo === "object") && oBInfo.model && oBInfo.path) {
			oModel = this.getModel(oBInfo.model);
			if (oModel) {
				sValue = oModel.getProperty(oBInfo.path);
			}
		}

		this.oModel.setProperty("/selectedVariant", sValue);
	};

	VariantManagement.prototype._getVariantText = function(sText) {
		return this.oModel.getProperty("/selectedVariant");
	};

	VariantManagement.prototype._updateVariantInvisibletext = function(sText, bValue) {
		if (bValue) {
			sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_MODIFIED", [
				sText
			]);
		}

		return sText;
	};

	VariantManagement.prototype._setFavoriteIcon = function(oIcon, bFlagged) {
		oIcon.setSrc(bFlagged ? "sap-icon://favorite" : "sap-icon://unfavorite");
		oIcon.setTooltip(this.oResourceBundle.getText(bFlagged ? "VARIANT_MANAGEMENT_FAV_DEL_TOOLTIP" : "VARIANT_MANAGEMENT_FAV_ADD_TOOLTIP"));
		oIcon.setAlt(this.oResourceBundle.getText(bFlagged ? "VARIANT_MANAGEMENT_FAV_DEL_ACC" : "VARIANT_MANAGEMENT_FAV_ADD_ACC"));
	};

	VariantManagement.prototype._isFavoriteSelected = function(oIcon) {
		return oIcon.getSrc() === "sap-icon://unfavorite";
	};


	VariantManagement.prototype._openVariantManagementDialog = function() {
		var oItem;
		var oItems = null;
		var iItemNo = 0;
		var oManageItem;
		var oNameCell;
		var oTypeCell;
		var oDefaultCell;
		var oExecuteCell;
		var oDeleteCell;
		var sTypeText;
		var sTooltip;
		var fLiveChange, fChange, fSelectRB, fSelectCB, fSelectFav, fPress;

		var that = this;

		this._mFavoriteChanges = {};

		this.oManagementSave.setEnabled(true);
		this.oManagementSave.setTooltip(null);

		this.oManagementTable.destroyItems();

		fLiveChange = function(oControlEvent) {
			that._checkVariantNameConstraints(this, that.oManagementTable);
		};

		fChange = function(oControlEvent) {
			var oEvent = that._createEvent("inputfieldChange", that._checkManageItemNameChange);
			oEvent.args.push(this.getParent());
			that._addEvent(oEvent);
		};

		fSelectFav = function(oControlEvent) {
			var bSelected = that._isFavoriteSelected(oControlEvent.oSource), oItem = this.getParent();
			if (oItem && (that.sNewDefaultKey !== oItem.getKey())) {
				that._mFavoriteChanges[oItem.getKey()] = bSelected;
				that._setFavoriteIcon(oControlEvent.oSource, bSelected);
			}
		};

		fSelectRB = function(oControlEvent) {
			var bSelected = (oControlEvent.getParameters().selected === true), oItem = this.getParent();
			if (oItem) {

				if (bSelected) {
					that.sNewDefaultKey = oItem.getKey();
					that._mFavoriteChanges[oItem.getKey()] = bSelected;
				}

				var oFavCtrl = oItem.getCells()[VariantManagement.FAV_COLUMN];
				if (oFavCtrl && oItem.getFavorite) {
					if (bSelected) {
						that._setFavoriteIcon(oFavCtrl, true);

					} else if (that._mFavoriteChanges[oItem.getKey()] !== undefined) {
						that._setFavoriteIcon(oFavCtrl, that._mFavoriteChanges[oItem.getKey()]);
					} else {
						that._setFavoriteIcon(oFavCtrl, oItem.getFavorite() === true);
					}
				}
			}
		};

		fSelectCB = function(oControlEvent) {
			var oEvent = that._createEvent("executeOnSelectionChange", that._handleManageExecuteOnSelectionChanged);
			oEvent.args.push(this);
			that._addEvent(oEvent);
		};

		fPress = function(oControlEvent) {
			var oEvent = that._createEvent("manageDeletePressed", that._handleManageDeletePressed);
			oEvent.args.push(this);

			that._addEvent(oEvent);
		};

		if (this.oManageDialogSearchField) {
			this.oManageDialogSearchField.setValue("");
		}

		this._initalizeManagementTableColumns();
		this.sNewDefaultKey = this.getDefaultVariantKey();

		this._restoreCompleteList(true);

		if (this.oVariantList.getItems()[0].getKey() !== this.getStandardVariantKey() && this.bVariantItemMode == false) {
			oItem = new VariantItem(this.oVariantManage.getId() + "-item-standard", {
				key: this.getStandardVariantKey(),
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT"),
				readOnly: true,
				executeOnSelection: false
			});
			this.oVariantList.insertItem(oItem, 0);
		}

		if (this.getUseFavorites()) {

			oItem = this.oVariantList.getItemByKey(this.getStandardVariantKey());
			if (oItem) {
				this.oVariantList.removeItem(oItem);
			}
		}

		oItems = this.oVariantList.getItems();

		if (this.getUseFavorites()) {
			oItems.sort(this._compareItems);
			if (oItem) {
				this.oVariantList.insertItem(oItem);
				oItems.splice(0, 0, oItem);
			}
		}
		for (var iH = 0; iH < oItems.length; iH++) {
			if (oItems[iH].getReadOnly() || oItems[iH].getLabelReadOnly()) {
				var sOptions = oItems[iH].getAccessOptions();
				sTooltip = this._accessOptionsText(sOptions);
			} else {
				sTooltip = null;
			}
			if (oItems[iH].getReadOnly()) {
				sTooltip = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LAYER");
			} else if (oItems[iH].getLabelReadOnly() === true) {
				sTooltip = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LANGUAGE");
			}

			if (oItems[iH].getKey() === this.getStandardVariantKey()) {
				sTooltip = null;
			}
			oManageItem = new EditableVariantItem(this.oVariantManage.getId() + "-edit-" + iItemNo, {
				key: oItems[iH].getKey(),
				global: oItems[iH].getGlobal(),
				readOnly: oItems[iH].getReadOnly(),
				lifecyclePackage: oItems[iH].getLifecyclePackage(),
				lifecycleTransportId: oItems[iH].getLifecycleTransportId(),
				namespace: oItems[iH].getNamespace(),
				labelReadOnly: oItems[iH].getLabelReadOnly(),
				author: oItems[iH].getAuthor(),
				favorite: oItems[iH].getFavorite(),
				vAlign: VerticalAlign.Middle
			});

			// Favorites column
			oNameCell = new Icon(this.oVariantManage.getId() + "-fav-" + iItemNo, {
				press: fSelectFav
			});
			oNameCell.addStyleClass("sapUICompVarMngmtFavColor");
			if (oItems[iH].getFavorite) {
				this._setFavoriteIcon(oNameCell, oItems[iH].getFavorite());
			}
			oManageItem.addCell(oNameCell);

			// name column
			if (oItems[iH].getKey() === this.getStandardVariantKey() || oItems[iH].getReadOnly() === true || oItems[iH].getLabelReadOnly() === true) {
				oNameCell = new ObjectIdentifier(this.oVariantManage.getId() + "-text-" + iItemNo, {
				// title: oItems[iH].getText() // issue with curly brackets
				});
				oNameCell.setTitle(oItems[iH].getText());

				if (sTooltip) {
					oNameCell.setTooltip(sTooltip);
				}
			} else {
				oNameCell = new Input(this.oVariantManage.getId() + "-input-" + iItemNo, {
					liveChange: fLiveChange,
					change: fChange
				});

				oNameCell.setValue(oItems[iH].getText());
			}
			oManageItem.addCell(oNameCell);


			//Default column
			if (oItems[iH].getGlobal()) {
				sTypeText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_SHARED");
			} else {
				sTypeText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_PRIVATE");
			}
			oTypeCell = new Text(this.oVariantManage.getId() + "-type-" + iItemNo, {
				text: sTypeText,
				wrapping: false
			});
			oTypeCell.addStyleClass("sapUICompVarMngmtType");
			oManageItem.addCell(oTypeCell);


			oDefaultCell = new RadioButton(this.oVariantManage.getId() + "-def-" + iItemNo, {
				groupName: this.oVariantManage.getId(),
				select: fSelectRB
			});

			if (this.sNewDefaultKey === oItems[iH].getKey() || oItems[iH].getKey() === this.getStandardVariantKey() && this.sNewDefaultKey === "") {
				oDefaultCell.setSelected(true);

				if (oItems[iH].getFavorite) {
					this._setFavoriteIcon(oManageItem.getCells()[0], true);
					// oManageItem.getCells()[0].setEditable(false);
				}

			}
			oManageItem.addCell(oDefaultCell);

			//Execute on Select column
			oExecuteCell = new CheckBox(this.oVariantManage.getId() + "-exe-" + iItemNo, {
				selected: false,
				enabled: false,
				select: fSelectCB
			});

			if (oItems[iH].getExecuteOnSelection) {
				if ((oItems[iH].getKey() === this.getStandardVariantKey() && this.getSupportExecuteOnSelectOnSandardVariant())) {
					oExecuteCell.setEnabled(true);
					if (this.bExecuteOnSelectForStandardByUser !== null) {
						oExecuteCell.setSelected(this.bExecuteOnSelectForStandardByUser);
					} else {
						oExecuteCell.setSelected(oItems[iH].getExecuteOnSelection());
					}
				} else {
					oExecuteCell.setEnabled(!oItems[iH].getReadOnly());
					oExecuteCell.setSelected(oItems[iH].getExecuteOnSelection());
				}

				if (sTooltip) {
					oExecuteCell.setTooltip(sTooltip);
				}
			}

			oManageItem.addCell(oExecuteCell);

			//Roles dummy
			oManageItem.addCell(new Text());


			//Author column
			oTypeCell = new Text(this.oVariantManage.getId() + "-author-" + iItemNo, {
				text: oItems[iH].getAuthor(),
				textAlign: "Begin"
			});
			oManageItem.addCell(oTypeCell);

			oDeleteCell = new Button(this.oVariantManage.getId() + "-del-" + iItemNo, {
				icon: "sap-icon://decline",
				enabled: true,
				type: ButtonType.Transparent,
				press: fPress,
				tooltip: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DELETE")
			});

			//this._assignColumnInfoForDeleteButton(oDeleteCell);

			if (oItems[iH].getReadOnly && oItems[iH].getReadOnly()) {
				oDeleteCell.setEnabled(false);

				// FIORITECHP1-3560
				oDeleteCell.setVisible(false);
			}
			oManageItem.addCell(oDeleteCell);

			this.oManagementTable.addItem(oManageItem);
			iItemNo++;
		}

		this.aRemovedVariants = [];
		this.aRemovedVariantTransports = [];
		this.aRenamedVariants = [];

		this.aExeVariants = [];

		this._createManagementDialog();
		this._setDialogCompactStyle(this, this.oManagementDialog);
		oItem = this.oVariantList.getSelectedItem();
		if (oItem) {
			this.lastSelectedVariantKey = oItem.getKey();
		}
		this.oVariantPopOver.close();

		this.oManagementDialog.open();
	};

	VariantManagement.prototype._assignColumnInfoForDeleteButton = function(oDeleteButton) {
		if (!this._oInvisibleDeleteColumnName) {
			this._oInvisibleDeleteColumnName = new InvisibleText({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ACTION_COLUMN")
			});

			this._createManagementDialog();
			this.oManagementDialog.addContent(this._oInvisibleDeleteColumnName);

		}

		if (this._oInvisibleDeleteColumnName) {
			oDeleteButton.addAriaLabelledBy(this._oInvisibleDeleteColumnName);
		}
	};

	VariantManagement.prototype._enableManualVariantKey = function(bEnable) {
		this.bManualVariantKey = bEnable;
	};

	VariantManagement.prototype._fireSelectAsync = function(sKey) {
		var slKey;
		if (sKey === undefined || sKey === null) {
			var oItem = this._getSelectedItem();
			if (oItem === null) {
				slKey = this.getStandardVariantKey();
			} else {
				slKey = oItem.getKey();
			}
		}
		this.fireSelect({
			key: slKey
		});
	};

	VariantManagement.prototype.setSupportExecuteOnSelectOnSandardVariant = function(bFlag) {
		this.bSupportExecuteOnSelectOnSandardVariant = bFlag;
	};
	VariantManagement.prototype.getSupportExecuteOnSelectOnSandardVariant = function() {
		return this.bSupportExecuteOnSelectOnSandardVariant;
	};

	VariantManagement.prototype._executeOnSelectForStandardVariantByXML = function(bSelect) {
		this.bExecuteOnSelectForStandardViaXML = bSelect;
	};

	VariantManagement.prototype._executeOnSelectForStandardVariantByUser = function(bSelect) {
		this.bExecuteOnSelectForStandardByUser = bSelect;
	};

	VariantManagement.prototype.getExecuteOnSelectForStandardVariant = function() {

		if (this.getSupportExecuteOnSelectOnSandardVariant()) {
			if (this.bExecuteOnSelectForStandardByUser !== null) {
				return this.bExecuteOnSelectForStandardByUser;
			}
		}

		return this.bExecuteOnSelectForStandardViaXML;
	};

	VariantManagement.prototype.getStandardVariantKey = function() {
		return this._sStandardVariantKey;
	};

	VariantManagement.prototype.setStandardVariantKey = function(sStandardVariantKey) {
		this._sStandardVariantKey = sStandardVariantKey;
	};

	// TODO Check if this is needed in VariantManagement or in SmartVariantManagement
	VariantManagement.prototype._setVendorLayer = function(bVendorLayer) {
		this._bVendorLayer = bVendorLayer;
	};

	VariantManagement.prototype.setStandardFavorite = function(bFavorite) {
		this._isFavorite = bFavorite;
	};
	VariantManagement.prototype.getStandardFavorite = function() {
		return this._isFavorite;
	};

	VariantManagement.prototype._isIndustrySolutionModeAndVendorLayer = function() {
		if (this._getIndustrySolutionMode() && this._bVendorLayer) {
			return true;
		}

		return false;
	};

	VariantManagement.prototype._setIndustrySolutionMode = function(bValue) {
		this._bIndustrialSolutionMode = bValue;
	};
	VariantManagement.prototype._getIndustrySolutionMode = function() {
		return this._bIndustrialSolutionMode;
	};

	return VariantManagement;

});
