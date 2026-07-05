/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides mediator control for sap.ui.comp.smartvariants.SmartVariantManagementMediator.
sap.ui.define([
	"sap/ui/model/Context",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/VariantItem",
	"sap/m/VariantManagement",
	"sap/ui/core/Control",
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	"sap/base/Log",
	"./SmartVariantManagementModel",
	"sap/ui/model/BindingMode"
], function(
	Context,
	Filter,
	FilterOperator,
	VariantItem,
	MVariantManagement,
	Control,
	Library,
	coreLibrary,
	Log,
	SmartVariantManagementModel,
	BindingMode
) {
	"use strict";

	// shortcut for sap.ui.core.TitleLevel
	const { TitleLevel } = coreLibrary;

	const mPropertiesToModelMapping = {
		"defaultVariantKey": "defaultVariant",
		"editable": "variantsEditable",
		"headerLevel": "headerLevel",
		"selectionKey": "currentVariant",
		"showExecuteOnSelection": "showExecuteOnSelection",
		"showSetAsDefault": "supportDefault",
		"showShare": "supportPublic",
		"standardItemText": "standardItemText",
		"titleStyle": "titleStyle",
		"useFavorites": "showFavorites",
		"variantCreationByUserAllowed": "creationAllowed"
	};

	const mModelToVariantManagementMapping = {
		"creationAllowed": "creationAllowed",
		"supportDefault": "supportDefault",
		"headerLevel": "level",
		"titleStyle": "titleStyle",
		"variantsEditable": "showFooter",
		"showExecuteOnSelection": "supportApplyAutomatically",
		"supportPublic": "supportPublic",
		"showFavorites": "supportFavorites",
		"modified": "modified",
		"defaultVariant": "defaultKey",
		"currentVariant": "selectedKey"
	};

	const aPropertiesThatRequireTwoWayBinding = [
		"selectedKey"
	];

	/**
	 * Constructor for a new <code>SmartVariantManagementMediator</code>.
	 * @param {string} [sId] - ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] - Initial settings for the new control
	 * @class Can be used to manage variants. You can use this control in most controls that are enabled for <i>key user adaptation</i>.<br>
	 * <b>Note: </b>On the user interface, variants are generally referred to as "views".
	 * @see {@link topic:f1430c0337534d469da3a56307ff76af Key User Adaptation: Enable Your App}
	 * @extends sap.ui.core.Control
	 * @constructor
	 * @public
	 * @since 1.56
	 * @alias sap.ui.comp.smartvariants.SmartVariantManagementMediator
	 */
	const SmartVariantManagementMediator = Control.extend("sap.ui.comp.smartvariants.SmartVariantManagementMediator", /** @lends sap.ui.comp.smartvariants.SmartVariantManagementMediator.prototype */ {
		metadata: {
			interfaces: [
				"sap.ui.core.IShrinkable",
				"sap.m.IOverflowToolbarContent",
				"sap.m.IToolbarInteractiveControl"
			],
			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartvariants/SmartVariantManagementMediator.designtime",
			properties: {
				/**
				 * Provides a string value to set the default variant. Used for the save dialog.
				 * Has no effect on the selected variant.
				 */
				defaultVariantKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the Apply Automatically text for the standard variant in the Manage Views dialog
				 * if the application controls this behavior.
				 * <p>
				 * <b>Note:</b> The usage of this property is restricted to <code>sap.fe</code> components only.
				 */
				displayTextForExecuteOnSelectionForStandardVariant: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Indicates whether the buttons on My Views are visible.
				*/
				editable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Can be set to true or false depending on whether you want to enable or disable the control.
				 */
				enabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Determines the behavior for Apply Automatically if the standard variant is marked as the default variant.
				 */
				executeOnSelectionForStandardDefault: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Semantic level of the header.
				 * For more information, see {@link sap.m.Title#setLevel}.
				 *
				 * @since 1.104
				 */
				headerLevel: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance",
					defaultValue: TitleLevel.Auto
				},

				/**
				 * Indicates whether the control is in error state.
				 * If set to <code>true</code>, an error message will be displayed when the variant is opened.
				 */
				inErrorState: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Sets the maximum width of the control.
				 *
				 * @since 1.109
				 */
				maxWidth: {
					type: "sap.ui.core.CSSSize",
					group: "Dimension",
					defaultValue: "100%"
				},

				/**
				 * The name of the model containing the data.
				 */
				modelName: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * The key of the currently selected item.
				 */
				selectionKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates that a Create Tile is visible in the Save As dialog.
				 */
				showCreateTile: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that Execute on Selection is visible in the Save As and the Manage Views dialogs.
				 */
				showExecuteOnSelection: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates whether the functionality of setting a default variant is enabled.
				 * The Default column in Manage Views and the Set as Default checkbox in Save View will be disabled if set to <code>false</code>.
				 */
				showSetAsDefault: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Indicates that the Public checkbox is visible in the Save As and the Manage Views dialogs. Selecting this checkbox allows you to
				 * share variants with other users.
				 * <b>Note</b>: this property is controlled by the SAPUI5 flexibility service.
				 */
				showShare: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Overwrites the default Standard variant title.
				 * <b>Note</b>: This property has to be set during the <code>applySettings</code> method; it will be ignored otherwise.
				 *
				 */
				standardItemText: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the style of the title.
				 * For more information, see {@link sap.m.Title#setTitleStyle}.
				 *
				 * @since 1.109
				 */
				titleStyle: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance",
					defaultValue: TitleLevel.Auto
				},

				/**
				 * Indicates that the 'Favorites' feature is used. Only variants marked as favorites will be displayed in the variant list.
				 */
				useFavorites: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that end users are allowed to create variants
				 * <b>Note</b>: this property is controlled by the SAPUI5 flexibility service.
				 */
				variantCreationByUserAllowed: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				}
			},
			events: {
				/**
				 * This event is fired when users press the Cancel button inside the Save As dialog.
				 */
				cancel: {},

				/**
				 * This event is fired when users apply changes to variants in the Manage Views dialog.
				 */
				manage: {
					parameters: {
						/**
						 * List of changed variants.
						 * Each entry contains a <code>key</code> (the variant key)  and a <code>name</code> (the new title of the variant).
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
						 * List of variant keys and the associated Execute on Selection indicator.
						 * Each entry contains a <code>key</code> (the variant key) and an <code>exe</code> flag describing the intention.
						 */
						exe: {
							type: "object[]"
						},

						/**
						 * List of variant keys and the associated favorite indicator.
						 * Each entry contains a <code>key</code> (the variant key) and a <code>visible</code> flag describing the intention.
						 */
						fav: {
							type: "object[]"
						},

						/**
						 * The default variant key
						 */
						def: {
							type: "string"
						},

						/**
						 * List of variant keys and the associated contexts array.
						 * Each entry contains a <code>key</code> (the variant key) and a <code>contexts</code> array describing the contexts.
						 * <b>Note:</b> It is only used internally by the SAPUI5 flexibility layer.
						 */
						contexts: {
							type: "object[]"
						}
					}
				},

				/**
				 * This event is fired when the Save View dialog or the Save As dialog is closed with the Save button.
				 */
				save: {
					parameters: {
						/**
						 * Variant title
						 */
						name: {
							type: "string"
						},

						/**
						 * Indicates whether an existing variant is overwritten or whether a new variant is created
						 */
						overwrite: {
							type: "boolean"
						},

						/**
						 * Variant key. This property is set if <code>overwrite</code> is set to <code>true</code>.
						 */
						key: {
							type: "string"
						},

						/**
						 * Apply Automatically indicator
						 */
						execute: {
							type: "boolean"
						},

						/**
						 * Indicates the checkbox state for Public
						 */
						"public": {
							type: "boolean"
						},

						/**
						 * The default variant indicator
						 */
						def: {
							type: "boolean"
						},

						/**
						 * Array describing the contexts.
						 * <b>Note:</b> It is only used internally by the SAPUI5 flexibility layer.
						 */
						contexts: {
							type: "object[]"
						},

						/**
						 * The shared variant indicator
						 * @deprecated As of version 1.120.0, the concept has been discarded.
						 */
						global: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired when a new variant is selected.
				 */
				select: {
					parameters: {
						/**
						 * Variant key
						 */
						key: {
							type: "string"
						}
					}
				}
			},
			associations: {

				/**
				 * Contains the IDs of the relevant controls for which the variant management is used.
				 */
				"for": {
					type: "sap.ui.core.Control",
					multiple: true
				}
			},
			defaultAggregation: "variantItems",
			aggregations: {

				/**
				 * Variant items displayed by the <code>SmartVariantManagement</code> control.
				 * <b>Note:</b>
				 * This aggregation is managed by the control and is populated via the SAP Flexibility service.
				 */
				variantItems: {
					type: "sap.m.VariantItem",
					multiple: true
				},
				/**
				 * Used for embedded variant managment.
				 */
				_embeddedVM: {
					type: "sap.m.VariantManagement",
					multiple: false,
					visibility: "hidden"
				}
			}
		},
		renderer: {
			apiVersion: 2,
			render(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.style("max-width", oControl.getMaxWidth());
				oRm.openEnd();
				oRm.renderControl(oControl._oVM);
				oRm.close("div");
			}
		}
	});

	/**
	 * Constructs and initializes the <code>VariantManagement</code> control.
	 */
	SmartVariantManagementMediator.prototype.init = function() {
		Control.prototype.init.apply(this); // Call base class

		this.oModel = new SmartVariantManagementModel();
		this.setModel(this.oModel, "$sVM");
		this.setModelName(SmartVariantManagementModel.getDefaultModelName());

		this.oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");

		this.STANDARDVARIANTKEY = "*standard*";

		this._createEmbeddedVM();
		this.attachModelContextChange(this._setBindingContext, this);
		this._setBindingContext();
	};

	//						EmbeddedVM creation + deletion

	SmartVariantManagementMediator.prototype._createEmbeddedVM = function() {
		this._oVM = new MVariantManagement(`${this.getId()}-vm`);
		this.setAggregation("_embeddedVM", this._oVM, true);

		this._oVM.attachManage(this._onManage, this);
		this._oVM.attachSave(this._onSave, this);
		this._oVM.attachSelect(this._onSelect, this);
	};

	SmartVariantManagementMediator.prototype._destroyEmbeddedVM = function() {
		if (this._oVM) {
			this._oVM.detachManage(this._onManage, this);
			this._oVM.detachSave(this._onSave, this);
			this._oVM.detachSelect(this._onSelect, this);

			this._oVM.destroy();
			this._oVM = undefined;
		}
	};

	SmartVariantManagementMediator.prototype._setBindingContext = function() {
		const sModelName = this.getModelName();

		if (!this.oContext && sModelName === SmartVariantManagementModel.getDefaultModelName()) {
			const oModel = this.getModel(sModelName);
			if (oModel) {
				this.oContext = new Context(oModel, SmartVariantManagementModel.getDefaultContextPath());
				this.setBindingContext(this.oContext, sModelName);

				this._oVM.setModel(oModel, sModelName);

				//this._oVM.setSupportDefault(true);

				this._createItemsModel(sModelName);
				const mPropertiesToBind = Object.entries(mModelToVariantManagementMapping).map(([sNameInModel, sNameInVariantMangement]) => {
					return {
						nameInModel: sNameInModel,
						nameInVariantMangement: sNameInVariantMangement
					};
				});

				this._bindPropertiesToVM(sModelName, mPropertiesToBind, this._oVM);

				this.setPopoverTitle(this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTS"));
			}
		}
	};

	/**
	 * @typedef {object} sap.ui.comp.smartvariants.VariantManagementPropertyMapping
	 * @property {string} nameInVariantMangement The name of the property on the embedded {@link sap.m.VariantManagement}
	 * @property {string} nameInModel The name of the property in the {@link sap.ui.comp.smartvariants.SmartVariantManagementModel}
	 * @public
	 */
	/**
	 *
	 * @param {string} sModelName
	 * @param {VariantManagementPropertyMapping[]} aProperties
	 * @param {sap.m.VariantManagement} oVM
	 */
	SmartVariantManagementMediator.prototype._bindPropertiesToVM = function(sModelName, aProperties, oVM = this._oVM) {
		if (!sModelName || !aProperties?.length) {
			return;
		}

		aProperties.forEach((oVariantManagementPropertyMapping) => {
			const oBindingMode = {};
			if (aPropertiesThatRequireTwoWayBinding.includes(oVariantManagementPropertyMapping.nameInVariantMangement)) {
				oBindingMode.mode = BindingMode.TwoWay;
			}
			oVM.bindProperty(oVariantManagementPropertyMapping.nameInVariantMangement, {
				path: `${this.oContext}/${oVariantManagementPropertyMapping.nameInModel}`,
				model: sModelName,
				...oBindingMode
			});
		});
	};

	SmartVariantManagementMediator.prototype._createItemsModel = function(sModelName) {

		this._oItemsTemplate = new VariantItem({
			key: `{${sModelName}>key}`,
			title: `{${sModelName}>title}`,
			sharing: `{${sModelName}>sharing}`,
			remove: `{${sModelName}>remove}`,
			favorite: `{${sModelName}>favorite}`,
			executeOnSelect: `{${sModelName}>executeOnSelect}`,
			rename: `{${sModelName}>rename}`,
			visible: `{${sModelName}>visible}`,
			changeable: `{${sModelName}>changeable}`,
			author: `{${sModelName}>author}`,
			contexts: `{${sModelName}>contexts}`
		});

		this._oVM.bindAggregation("items", {
			path: `${this.oContext}/variants`,
			model: sModelName,
			template: this._oItemsTemplate,
			filters: new Filter({
				path: "visible",
				operator: FilterOperator.EQ,
				value1: true
			})
		});
	};

	SmartVariantManagementMediator.prototype.resolveTitleBindings = function(mViewsToCheck) {
		const aModelsRequested = [];
		this.oModel.prepareVariantsForTitleBindings(this.oContext?.sPath, mViewsToCheck).forEach((oVariant) => {
			const oResourceModel = this.getModel(oVariant.sResourceModel);
			if (oResourceModel) {
				const sResolvedTitle = oResourceModel.getResourceBundle().getText(oVariant.sResourceKey);
				this.oModel.reorderVariants(oVariant.key, sResolvedTitle, -1);
			} else if (aModelsRequested.indexOf(oVariant.sResourceModel) < 0) {
				aModelsRequested.push(oVariant.sResourceModel);
				// Wait for model to be assigned and try again
				this.attachEventOnce(
					"modelContextChange",
					this.resolveTitleBindings.bind(this, mViewsToCheck)
				);
			}
		});
	};

	//							EmbeddedVM Event handlers

	SmartVariantManagementMediator.prototype._onManage = function(oEvent) {
		const mParameters = oEvent.getParameters();
		this.fireManage(mParameters);
	};

	SmartVariantManagementMediator.prototype._onSave = function(oEvent) {
		const mParameters = oEvent.getParameters();

		if (mParameters.hasOwnProperty("execute")) {
			mParameters.exe = mParameters.execute;
		}

		/**
		* @deprecated As of version 1.120.0, the concept has been discarded.
		*/
		if (mParameters.hasOwnProperty("public")) {
			mParameters.global = mParameters.public;
		}

		this.fireSave(mParameters);
	};

	SmartVariantManagementMediator.prototype._onSelect = function(oEvent) {
		this.fireSelect(oEvent.getParameters());
	};

	//					Model interactions

	SmartVariantManagementMediator.prototype._checkUpdate = function() {
		this.oModel.checkUpdate(true);
	};

	SmartVariantManagementMediator.prototype._getIdxSorted = function(sKey) {
		return this.oModel.getIdxSorted(sKey);
	};

	SmartVariantManagementMediator.prototype._reapplyExecuteOnSelectForStandardVariantItem = function(bSelect) {
		const sStdKey = this.getStandardVariantKey();
		const aVariants = this.oModel.getVariants();

		const nIdx = this.oModel.findVariantIndex(sStdKey, -1);
		if (nIdx > -1) {
			aVariants[nIdx]["executeOnSelect"] = bSelect;
			aVariants[nIdx]["originalExecuteOnSelect"] = bSelect;
			this.oModel.setVariants(aVariants);
		}
	};

	SmartVariantManagementMediator.prototype._removeViewItem = function(sKey) {
		this.oModel.removeVariant(sKey);
	};

	SmartVariantManagementMediator.prototype._reorderList = function(sKey, sNewTitle) {
		this.oModel.reorderVariants(sKey, sNewTitle);
	};

	SmartVariantManagementMediator.prototype._updateView = function(sKey, sPropertyName, vValue) {
		this.oModel.updateView(sKey, sPropertyName, vValue);
	};

	//					Property setters + getters for model forwarding

	SmartVariantManagementMediator.prototype._setPropertyAlsoInModel = function(sPropertyName, vValue) {
		const sPropertyNameInModel = mPropertiesToModelMapping[sPropertyName];
		this._setPropertyInModel(sPropertyNameInModel, vValue);
		return this.setProperty(sPropertyName, vValue);
	};

	SmartVariantManagementMediator.prototype._setPropertyInModel = function(sPropertyName, vValue) {
		this.oModel._setProperty(sPropertyName, vValue, this.oContext?.path);
	};

	/**
	 * Gets the currently selected variant key.
	 * @public
	 * @returns {string|null} Key of the currently selected variant. In case the model is not yet set <code>null</code> will be returned
	 */
	SmartVariantManagementMediator.prototype.getCurrentVariantKey = function() {
		return this.getSelectionKey();
	};

	SmartVariantManagementMediator.prototype.setCurrentVariantKey = function(sKey) {
		return this.setSelectionKey(sKey);
	};

	SmartVariantManagementMediator.prototype.setDefaultVariantKey = function(sKey) {
		return this._setPropertyAlsoInModel("defaultVariantKey", sKey);
	};

	SmartVariantManagementMediator.prototype.setEditable = function(bValue) {
		return this._setPropertyAlsoInModel("editable", bValue);
	};

	SmartVariantManagementMediator.prototype.setHeaderLevel = function(sValue) {
		return this._setPropertyAlsoInModel("headerLevel", sValue);
	};

	/**
	 * Determines whether the current variant is modified.
	 * @public
	 * @returns {boolean} Returns <code>true</code>, if the current variant is modified, otherwise <code>false</code>
	 */
	SmartVariantManagementMediator.prototype.getModified = function() {
		return this.oModel.getModified(this.oContext?.sPath);
	};

	SmartVariantManagementMediator.prototype.setModified = function(bFlag) {
		this.oModel.setModified(bFlag, this.oContext?.sPath);
	};

	SmartVariantManagementMediator.prototype.getSelectionKey = function() {
		return this.oModel.getCurrentVariant(this.oContext?.sPath);
	};

	SmartVariantManagementMediator.prototype.setSelectionKey = function(sKey) {
		return this._setPropertyAlsoInModel("selectionKey", sKey);
	};

	SmartVariantManagementMediator.prototype.setShowExecuteOnSelection = function(bValue) {
		return this._setPropertyAlsoInModel("showExecuteOnSelection", bValue);
	};

	SmartVariantManagementMediator.prototype.setShowSetAsDefault = function(bValue) {
		return this._setPropertyAlsoInModel("showSetAsDefault", bValue);
	};

	SmartVariantManagementMediator.prototype.setShowShare = function(bValue) {
		return this._setPropertyAlsoInModel("showShare", bValue);
	};

	SmartVariantManagementMediator.prototype.setStandardItemText = function(sName) {
		return this._setPropertyAlsoInModel("standardItemText", sName);
	};

	SmartVariantManagementMediator.prototype.setTitleStyle = function(sValue) {
		return this._setPropertyAlsoInModel("titleStyle", sValue);
	};

	SmartVariantManagementMediator.prototype.setUseFavorites = function(bValue) {
		return this._setPropertyAlsoInModel("useFavorites", bValue);
	};

	SmartVariantManagementMediator.prototype.setVariantCreationByUserAllowed = function(bValue) {
		return this._setPropertyAlsoInModel("variantCreationByUserAllowed", bValue);
	};

	//						Aggregation setters + getters

	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementMediator#addVariantItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementMediator#insertVariantItem
	 * @private
	 */

	/**
	 * @returns {sap.ui.comp.variants.VariantItem[]}
	 */
	SmartVariantManagementMediator.prototype.getVariantItems = function() {
		return this.getVariants();
	};
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementMediator#removeVariantItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementMediator#destroyVariantItems
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementMediator#removeAllVariantItems
	 * @private
	 */

	SmartVariantManagementMediator.prototype.getItemByKey = function(sKey) {
		const oItems = this.getVariantItems();
		for (let iCount = 0; iCount < oItems.length; iCount++) {
			if (sKey == oItems[iCount].getKey()) {
				return oItems[iCount];
			}
		}
		return null;
	};

	//						setters + getters for embedded VM

	SmartVariantManagementMediator.prototype._getEmbeddedVM = function() {
		return this._oVM;
	};

	SmartVariantManagementMediator.prototype._assignUser = function(sKey, sUser) {
		const oItem = this._oVM.getItemByKey(sKey);
		if (!oItem) {
			return;
		}
		oItem.setAuthor(sUser);
	};

	/**
	 * Gets the dirty flag of the current variant.
	 * @public
	 * @returns {boolean} The dirty state of the current variant
	 */
	SmartVariantManagementMediator.prototype.currentVariantGetModified = function() {
		return this.getModified();
	};

	/**
	 * Sets the dirty flag of the current variant.
	 * @public
	 * @param {boolean} bFlag The value indicating the dirty state of the current variant
	 */
	SmartVariantManagementMediator.prototype.currentVariantSetModified = function(bFlag) {
		this.setModified(bFlag);
	};

	SmartVariantManagementMediator.prototype.setDisplayTextForExecuteOnSelectionForStandardVariant = function(sValue) {
		this.setProperty("displayTextForExecuteOnSelectionForStandardVariant", sValue);
		this._oVM.setDisplayTextForExecuteOnSelectionForStandardVariant(sValue);
		return this;
	};

	SmartVariantManagementMediator.prototype.setEnabled = function(bEnabled) {
		this.setProperty("enabled", bEnabled);
		const aContent = this._oVM.oVariantLayout.getContent();
		if (!bEnabled) {
			aContent[0].removeStyleClass("sapMVarMngmtClickable");
			aContent[0].addStyleClass("sapMVarMngmtDisabled");

			aContent[1].addStyleClass("sapMVarMngmtDisabled");

			aContent[2].removeStyleClass("sapMVarMngmtClickable");
			aContent[2].addStyleClass("sapMVarMngmtDisabled");

			this._oVM.bPopoverOpen = true;
		} else {
			aContent[0].removeStyleClass("sapMVarMngmtDisabled");
			aContent[0].addStyleClass("sapMVarMngmtClickable");

			aContent[1].removeStyleClass("sapMVarMngmtDisabled");

			aContent[2].removeStyleClass("sapMVarMngmtDisabled");
			aContent[2].addStyleClass("sapMVarMngmtClickable");

			this._oVM.bPopoverOpen = false;
		}
		return this;
	};

	SmartVariantManagementMediator.prototype.getFocusDomRef = function() {
		if (this._oVM) {
			return this._oVM.oVariantPopoverTrigger.getFocusDomRef();
		}

		return null;
	};

	SmartVariantManagementMediator.prototype.getInErrorState = function() {
		return this._oVM.getInErrorState();
	};

	SmartVariantManagementMediator.prototype.setInErrorState = function(bValue) {
		const oTitle = this._oVM.getTitle();
		if (bValue && oTitle && !oTitle.getText()) {
			oTitle.setText(this._determineStandardVariantName());
		}
		this.setProperty("inErrorState", bValue);
		this._oVM.setInErrorState(bValue);
		return this;
	};

	SmartVariantManagementMediator.prototype._determineStandardVariantName = function() {
		let sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD");

		if ((this.oModel.getDefaultVariant() === this.STANDARDVARIANTKEY) && this.getStandardItemText()) {
			sText = this.getStandardItemText();
		}

		return sText;
	};

	/**
	 * Sets the title for view list.
	 * @private
	 * @ui5-restricted sap.ui.fl
	 * @param {string} sTitle of the variant list
	 */
	SmartVariantManagementMediator.prototype.setPopoverTitle = function(sTitle) {
		this._oVM.setPopoverTitle(sTitle);
		return this;
	};

	/**
	 * Special handling of the rendering of this control.
	 * @returns {boolean} The current intent
	 * @private
	 * @restricted sap.ui.mdc
	*/
	SmartVariantManagementMediator.prototype.getShowAsText = function() {
		return this._oVM.getShowAsText();
	};

	/**
	 * Special handling of the rendering of this control.
	 * @param {boolean} bValue Defines the intended rendering
	 * @returns {sap.ui.comp.smatvariants.SmartVariantManagement} The current instance
	 * @private
	 * @restricted sap.ui.mdc
	*/
	SmartVariantManagementMediator.prototype.setShowAsText = function(bValue) {
		this._oVM.setShowAsText(bValue);
		return this;
	};

	SmartVariantManagementMediator.prototype.setShowCreateTile = function(bValue) {
		this.setProperty("showCreateTile", bValue);
		this._oVM._setShowCreateTile(bValue);
		return this;
	};

	SmartVariantManagementMediator.prototype.getShowCreateTile = function() {
		return this._oVM._getShowCreateTile();
	};

	SmartVariantManagementMediator.prototype.getStandardVariantKey = function() {
		return this._oVM.getStandardVariantKey();
	};

	SmartVariantManagementMediator.prototype.setStandardVariantKey = function(sStdKey) {
		this._oVM.setStandardVariantKey(sStdKey);
	};

	SmartVariantManagementMediator.prototype._setStandardVariantKey = function(sStdKey) {
		this._oVM.setStandardVariantKey(sStdKey);
	};

	/**
	 * Gets all variants.
	 * @public
	 * @returns {Array} All variants; if the model is not yet set, an empty array will be returned.
	 */
	SmartVariantManagementMediator.prototype.getVariants = function() {
		return this._oVM ? this._oVM.getItems() : [];
	};

	SmartVariantManagementMediator.prototype.getVariantByKey = function(sKey) {
		return this._oVM ? this._oVM._getItemByKey(sKey) : null;
	};

	//				Other embedded VM forwardings

	SmartVariantManagementMediator.prototype._createSaveAsDialog = function() {
		this._oVM._createSaveAsDialog();
	};

	SmartVariantManagementMediator.prototype._handleVariantSaveAs = function(sNewVariantName) {
		this._oVM._handleVariantSaveAs(sNewVariantName);
	};

	SmartVariantManagementMediator.prototype.openManagementDialog = function(bCreateAlways, sClass, oRolesComponentContainer) {
		this._oVM.openManagementDialog(bCreateAlways, sClass, oRolesComponentContainer);
	};

	SmartVariantManagementMediator.prototype._destroyManageDialog = function() {
		if (this._oVM) {
			this._oVM.destroyManageDialog();
		}
	};

	// 						ApplyAutomatically handlings

	/**
	 * Registration of a callback function.
	 * The provided callback function is executed to check if Apply Automatically on standard variant should be considered.
	 * @private
	 * @ui5-restricted sap.fe
	 * @since 1.103
	 * @param {function} fCallBack Called when standard variant must be applied. It determines if Apply Automatically on standard variant should be considered.
	 * As a convenience the current variant will be passed to the callback.
	 * This variant instance may not be changed in any ways. It is only intended to provide certain variant information.
	 * @returns {this} Reference to this in order to allow method chaining
	 */
	SmartVariantManagementMediator.prototype.registerApplyAutomaticallyOnStandardVariant = function(fCallBack) {
		this._fRegisteredApplyAutomaticallyOnStandardVariant = fCallBack;

		return this;
	};

	/**
	 * Gets the Apply Automatically state for a variant.
	 * @private
	 * @ui5-restricted sap.ui.mdc
	 * @param {object} oVariant The fl-variant object
	 * @returns {boolean} Apply Automatically state
	 */
	SmartVariantManagementMediator.prototype.getApplyAutomaticallyOnVariant = function(oVariant) {
		let bExecuteOnSelection = false;
		if (oVariant) {
			bExecuteOnSelection = oVariant.executeOnSelect;

			if (this._fRegisteredApplyAutomaticallyOnStandardVariant && this.getDisplayTextForExecuteOnSelectionForStandardVariant() && (oVariant.key === this.getStandardVariantKey())) {
				try {
					bExecuteOnSelection = this._fRegisteredApplyAutomaticallyOnStandardVariant(oVariant);
				} catch (ex) {
					Log.error("callback for determination of apply automatically on standard variant failed");
				}
			}
		}

		return bExecuteOnSelection;
	};

	//						Toolbar relevant overrides

	/**
	 * Registers an invalidation event that is fired when the width of the control is changed.
	 * <b>Note:</b> This is required by the {@link sap.m.IOverflowToolbarContent} interface.
	 *
	 * @protected
	 * @returns {{canOverflow: boolean, invalidationEvents: string[]}} Configuration information for the {@link sap.m.IOverflowToolbarContent} interface
	 */
	SmartVariantManagementMediator.prototype.getOverflowToolbarConfig = function() {
		return {
			canOverflow: false,
			invalidationEvents: ["save", "manage", "select"]
		};
	};

	/**
	 * Required by the {@link sap.m.IToolbarInteractiveControl} interface.
	 * Determines whether the control is interactive.
	 *
	 * @returns {boolean} Indicates whether the control is interactive
	 *
	 * @private
	 * @ui5-restricted sap.m.OverflowToolBar, sap.m.Toolbar
	 */
	SmartVariantManagementMediator.prototype._getToolbarInteractive = function() {
		return true;
	};

	//						Cleanup

	SmartVariantManagementMediator.prototype.exit = function(...aArgs) {
		this._destroyEmbeddedVM();

		if (this._oItemsTemplate) {
			this._oItemsTemplate.destroy();
			this._oItemsTemplate = undefined;
		}

		if (this.oModel) {
			this.oModel.destroy();
			this.oModel = undefined;
		}

		this._fRegisteredApplyAutomaticallyOnStandardVariant = null;
		this.oContext = undefined;
		this.oResourceBundle = undefined;
		Control.prototype.exit.apply(this, aArgs);
	};

	return SmartVariantManagementMediator;
});