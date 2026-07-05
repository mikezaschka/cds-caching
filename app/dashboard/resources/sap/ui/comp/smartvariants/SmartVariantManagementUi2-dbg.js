/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartvariants.SmartVariantManagementUi2.
sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	'sap/ui/comp/library',
	"sap/m/VariantManagement",
	'sap/ui/comp/variants/VariantItem',
	"sap/ui/model/base/ManagedObjectModel",
	"sap/base/Log"
], function(Control, Element, Library, coreLibrary, library, MVariantManagement, VariantItem, ManagedObjectModel, Log) {
	"use strict";

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	/**
	 * Constructor for a new SmartVariantManagementUi2.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The SmartVariantManagementUi2 control communicates with the Ui2 personalization layer to manage the variants.
	 * @extends sap.ui.core.Control
	 * @constructor
	 * @public
	 * @deprecated As of version 1.136, replaced by {@link sap.ui.comp.smartvariants.SmartVariantManagement SmartVariantManagement} for smart controls / OData V2 and {@link sap.ui.fl.variants.VariantManagement VariantManagement} for OData V4 and freestyle applications.
	 * @alias sap.ui.comp.smartvariants.SmartVariantManagementUi2
	 */
	var SmartVariantManagementUi2 = Control.extend("sap.ui.comp.smartvariants.SmartVariantManagementUi2", /** @lends sap.ui.comp.smartvariants.SmartVariantManagementUi2.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {
				/**
				 * Can be set to true or false depending on whether you want to enable or disable the control.
				 */
				enabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Sets the maximum width of the control.
				 *
				 * @since 1.120
				 */
				maxWidth: {
					type: "sap.ui.core.CSSSize",
					group: "Dimension",
					defaultValue: "100%"
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
				 * Semantic level of the header.
				 * For more information, see {@link sap.m.Title#setLevel}.
				 *
				 * @since 1.120
				 */
				headerLevel: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance",
					defaultValue: TitleLevel.Auto
				},

				/**
				 * Defines the style of the title.
				 * For more information, see {@link sap.m.Title#setTitleStyle}.
				 *
				 * @since 1.120
				 */
				titleStyle: {
					type: "sap.ui.core.TitleLevel",
					group: "Appearance",
					defaultValue: TitleLevel.Auto
				}
			},
			aggregations: {

				/**
				 * All controls that rely on variant handling have to be added to this aggregation. The only consumer currently known is the
				 * <code>FilterBar</code> control.
				 */
				personalizableControl: {
					type: "sap.ui.comp.smartvariants.PersonalizableInfo",
					multiple: false
				},
				/**
				 * Used for embedded vm
				 */
				_embeddedVM: {
					type: "sap.m.VariantManagement",
					multiple: false,
					visibility: "hidden"
				}
			},
			events: {

				/**
				 * Once the <code>SmartVariantManagementUi2</code> control has been initialized, and especially after retrieving the variants via
				 * the UI2 personalization service and the default variant was applied, the registered consumer will be notified that this phase has completed.
				 */
				initialise: {},

				/**
				 * Fired after a variant is saved. This event can be used to retrieve the id of the saved variant.
				 */
				afterSave: {},

				/**
				 * This event is fired when the Save Variant dialog is closed with OK for a variant.
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
						 * The default variant indicator
						 */
						def: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired when users apply changes to variants in the Manage Variants dialog.
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
						 * The default variant key
						 */
						def: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired when a new variant is selected.
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
		renderer: {
			apiVersion: 2,
			render: function (oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.style("max-width", oControl.getMaxWidth());
				oRm.openEnd();
				oRm.renderControl(oControl._oVM);
				oRm.close("div");
			}
		}

	});

	SmartVariantManagementUi2.prototype.init = function() {
		Control.prototype.init.apply(this); // Call base class

		this.STANDARDVARIANTKEY = "*standard*";

		this.addStyleClass("sapUiCompVarMngmt");
		this.oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");

		this._oVM = new MVariantManagement(this.getId() + "-vm", {
			supportFavorites: false,
			supportApplyAutomatically: false,
			supportPublic: false,
			supportContexts: false
		});
		this.setAggregation("_embeddedVM", this._oVM, true);
		this._oVM.setStandardVariantKey(this.STANDARDVARIANTKEY);

		this._oManagedObjectModel = new ManagedObjectModel(this);
		this.setModel(this._oManagedObjectModel, "$compSmartVariantsUi2");

		this._oVM.attachManage(this._fireManage, this);
		this._oVM.attachSave(this._fireSave, this);
		this._oVM.attachSelect(this._fireSelect, this);

		this._oStandardVariant = null;
		this._oPersController = null;
		this._sKeyName = null;

		this._oContainer = null;
		this._oVariantSet = null;

		this._bindProperties();
	};

	SmartVariantManagementUi2.prototype._bindProperties = function () {

		this._oVM.bindProperty("level", {
			path: "/headerLevel",
			model: "$compSmartVariantsUi2"
		});

		this._oVM.bindProperty("titleStyle", {
			path: "/titleStyle",
			model: "$compSmartVariantsUi2"
		});
	};

	/**
	 * Returns all known variant items.
	 * @public
	 * @return {sap.ui.comp.variants.VariantItem[]} all known items.
	 */
	SmartVariantManagementUi2.prototype.getVariantItems = function() {
		return this._oVM.getItems();
	};

	/**
	 * Determines if the control instance is a page variant.
	 * @public
	 * @return {boolean} always returns <code>false</code>
	 */
	SmartVariantManagementUi2.prototype.isPageVariant = function() {
		return false;
	};

	/**
	 * Retrieves the variant content.
	 * @public
	 * @param {sap.ui.core.Control} oControl current control
	 * @param {string} sKey the variant key
	 * @returns {object} json object representing the content of the variant
	 */
	SmartVariantManagementUi2.prototype.getVariantContent = function(oControl, sKey) {
		var oContent = null;

		if (sKey === this.getStandardVariantKey()) {
			oContent = this._getStandardVariant();

		} else {

			/* eslint-disable no-lonely-if */
			if (this._oVariantSet) {
				var oVariant = this._oVariantSet.getVariant(sKey);
				if (oVariant) {
					oContent = this._getContent(oVariant);
				}
			}
			/* eslint-enable no-lonely-if */
		}

		return oContent;
	};

	/**
	 * The functionality 'apply automatically' is not supported by this control.
	 */
	SmartVariantManagementUi2.prototype.getExecuteOnSelectForStandardVariant = function() {
		return false;
	};

	SmartVariantManagementUi2.prototype.currentVariantSetModified = function(bFlag) {
		this._oVM.setModified(bFlag);
	};
	SmartVariantManagementUi2.prototype.currentVariantGetModified = function() {
		return this._oVM.getModified();
	};
	/**
	 * Retrieves the current variant ID. For a standard variant, an empty string is returned.
	 * @public
	 * @returns {string} Current variant ID
	 */
	SmartVariantManagementUi2.prototype.getCurrentVariantId = function() {
		var sKey = this._oVM.getSelectedKey();
		if (sKey === this.getStandardVariantKey()) {
			sKey = "";
		}

		return sKey;
	};

	SmartVariantManagementUi2.prototype.setSelectionKey = function(sId) {
		this._oVM.setSelectedKey(sId);
	};
	SmartVariantManagementUi2.prototype.getItemByKey = function(sId) {
		return this._oVM._getItemByKey(sId);
	};
	SmartVariantManagementUi2.prototype.setDefaultVariantKey = function(sId) {
		this._oVM.setDefaultKey(sId);
	};
	SmartVariantManagementUi2.prototype.getDefaultVariantKey = function() {
		return this._oVM.getDefaultKey();
	};
	SmartVariantManagementUi2.prototype.setInitialSelectionKey = function(sId) {
		this.setSelectionKey(sId);
	};
	SmartVariantManagementUi2.prototype.getInitialSelectionKey = function() {
		return this._oVM.getSelectedKey();
	};
	SmartVariantManagementUi2.prototype.getSelectionKey = function() {
		return this._oVM.getSelectedKey();
	};
	SmartVariantManagementUi2.prototype.addVariantItem = function(oVariantItem) {
		this._oVM.addItem(oVariantItem);
	};
	SmartVariantManagementUi2.prototype.insertVariantItem = function(oVariantItem, nPos) {
		this._oVM.insertItem(oVariantItem, nPos);
	};
	SmartVariantManagementUi2.prototype.removeVariantItem  = function(oVariantItem) {
		this._oVM.removeItem(oVariantItem);
	};
	SmartVariantManagementUi2.prototype.setCurrentVariantKey = function(sId) {
		this.setSelectionKey(sId);
	};

	SmartVariantManagementUi2.prototype._fireSelect = function (oEvent) {
		this.fireSelect(oEvent.getParameters());
	};
	SmartVariantManagementUi2.prototype._fireSave = function (oEvent) {

		var mParameters = oEvent.getParameters();

		if (mParameters.hasOwnProperty("execute")) {
			mParameters.exe = mParameters.execute;
		}

		this.fireSave(mParameters);
	};

	SmartVariantManagementUi2.prototype._fireManage = function (oEvent) {
		var mParameters = oEvent.getParameters();

		this.fireManage(mParameters);
	};
	SmartVariantManagementUi2.prototype.getStandardVariantKey = function () {
		return this.STANDARDVARIANTKEY;
	};
	SmartVariantManagementUi2.prototype._determineStandardVariantName = function () {

		var sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD");

		if (this.getStandardItemText()) {
			sText = this.getStandardItemText();
		}

		return sText;
	};
	SmartVariantManagementUi2.prototype.removeAllVariantItems = function() {
		this._oVM.removeAllItems();
	};

	SmartVariantManagementUi2.prototype._createStandardVariantItem = function() {
		this._createVariantItem(this.getStandardVariantKey(), this._determineStandardVariantName(), 	{ rename: false, remove: false, changeable: false});
		this.setSelectionKey(this.getStandardVariantKey());
	};

	SmartVariantManagementUi2.prototype._getIdxSorted = function (sTitle) {

		var aItems = this.getVariantItems();

		var sUpperTitle = sTitle.toUpperCase();
		var nIdx = aItems.findIndex(function (oElement, idx) {
			if (idx > 0) {
				if (oElement.getTitle().toUpperCase() > sUpperTitle) {
					return true;
				}
			}

			return false;
		});

		return nIdx > -1 ? nIdx : aItems.length;
	};

	SmartVariantManagementUi2.prototype._variantItemChange = function (oEvent) {
		var nIdx, sPropertyName, oVariantItem;

		if (oEvent && oEvent.oSource && (oEvent.oSource.isA("sap.ui.comp.variants.VariantItem"))) {
			oVariantItem = oEvent.oSource;

			if (oVariantItem.getKey() !== this.STANDARDVARIANTKEY) {
				sPropertyName = oEvent.getParameter("propertyName");
				if (sPropertyName === "text") {
					this.removeVariantItem(oVariantItem);
					nIdx = this._getIdxSorted(oVariantItem.getText());
					this.insertVariantItem(oVariantItem, nIdx);
				}
			}
		}
	};

	SmartVariantManagementUi2.prototype._createVariantItem = function(sKey, sTitle, mProperties)	{
		var nIdx = (sKey === this.getStandardVariantKey()) ? 0 : this._getIdxSorted(sTitle);

		if (!mProperties) {
			mProperties = { rename: true, remove: true, changeable: true};
		}

		mProperties.key = sKey;
		mProperties.text = sTitle;
		mProperties.title = sTitle;
		mProperties.visible = true;

		var oVariantItem = new VariantItem(mProperties);

		oVariantItem.attachChange(this._variantItemChange.bind(this));
		this.insertVariantItem(oVariantItem, nIdx);
	};

	SmartVariantManagementUi2.prototype.removeVariantItemByKey = function(sKey) {
		var oDelVariantItem = null;
		this.getVariantItems().some(function(oVariantItem) {
			if (oVariantItem.getKey() === sKey) {
				oDelVariantItem = oVariantItem;
			}
			return oDelVariantItem != null;
		});

		if (oDelVariantItem) {
			this.removeVariantItem(oDelVariantItem);
			oDelVariantItem.destroy();
		}
	};

	SmartVariantManagementUi2.prototype.getVariantItems = function() {
		return this._oVM.getItems();
	};

	SmartVariantManagementUi2.prototype.getInErrorState = function () {
		return this._oVM.getInErrorState();
	};

	/**
	 * Removes the current variant selection and resets to default value.
	 * @public
	 */
	SmartVariantManagementUi2.prototype.clearVariantSelection = function () {
		this.setSelectionKey(this.getStandardVariantKey());
	};
	/**
	 * Sets the current variant ID. In case an invalid ID is passed, a standard variant is set.
	 * @public
	 * @param {string} sVariantId ID of the variant
	 * @param {boolean} bDoNotApplyVariant If set to <code>true</code>, the <code>applyVariant</code> method is not executed yet. Relevant during
	 *        navigation, when called before the initialise event has be executed
	 */
	SmartVariantManagementUi2.prototype.setCurrentVariantId = function(sVariantId, bDoNotApplyVariant) {
		var oContent;

		var sId = sVariantId;
		if (!sId) {
			sId = this.getStandardVariantKey();
		} else {
			/* eslint-disable no-lonely-if */
			if (!this.getItemByKey(sId)) {
				sId = this.getStandardVariantKey();
			}
			/* eslint-enable no-lonely-if */
		}

		if (this._oVariantSet) {

			oContent = this.getVariantContent(this._oPersController, sId);
			if (oContent) {
				this.setSelectionKey(sId); // set the current selected variant
				if (bDoNotApplyVariant !== true) {
					this._applyVariantContent(oContent);
				}
			}
		}
	};

	/**
	 * Registers all controls interested and relying on variant handling. Each control has to be registered separately.
	 * @public
	 * @param {sap.ui.comp.smartvariants.PersonalizableInfo} oCurrentControlInfo control providing the required aggregation for flex-layer
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagementUi2} the current instance
	 */
	SmartVariantManagementUi2.prototype.addPersonalizableControl = function(oCurrentControlInfo) {
		this.setAggregation("personalizableControl", oCurrentControlInfo, true);

		if (oCurrentControlInfo.getControl()) {
			this._oPersController = Element.getElementById(oCurrentControlInfo.getControl());
		}

		this._sKeyName = oCurrentControlInfo.getKeyName();
		return this;
	};

	SmartVariantManagementUi2.prototype._getUShellContainer = function() {
		return sap.ui.require("sap/ushell/Container");
	};

	/**
	 * Initializes the UI2 personalization layer by retrieving the list of variants. Once the initialization has been completed, the control for
	 * personalization is informed via the initialise event.
	 * @public
	 */
	SmartVariantManagementUi2.prototype.initialise = function() {

		var sContainerKey = this._getPersistencyKey();

		if (!sContainerKey) {
			Log.warning("PersistencyKey not set");
			this.fireEvent("initialise");

			return;
		}

		var that = this;
		var oShellContainer = this._getUShellContainer();
		if (oShellContainer) {
			oShellContainer.getServiceAsync("Personalization").then(function (oPersonalization) {
				oPersonalization.getContainer(sContainerKey, {
					validity: Infinity
					}).fail(function() {
						Log.error("Loading personalization container failed");
						that._setErrorValueState(that.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"));

						that.fireEvent("initialise");
					}).done(function(oContainer) {
						that._readPersonalization(oContainer);
					});
			}, function() {
					Log.error("Loading personalization service failed");
					that._setErrorValueState(that.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"));

					that.fireEvent("initialise");
			});

			return;
		}

		Log.error("Could not obtain the personalization container");
		this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"));

		this.fireEvent("initialise");
	};

	/**
	 * Obtains from the variant management the current selected entry ands applies the corresponding variant. In case nothing was selected variant
	 * management returns null -> no variant will be applied
	 * @private
	 */
	SmartVariantManagementUi2.prototype._setSelectedVariant = function() {
		var oVariant = null;

		if (this._oVariantSet) { // in case a variant is currently selected, re-apply this variant
			var sKey = this.getSelectionKey();
			if (sKey) {
				oVariant = this._oVariantSet.getVariant(sKey);

				if (oVariant) {
					this._applyVariant(oVariant);
				}
			}
		}
	};

	/**
	 * Create the variant items.
	 * @private
	 */
	SmartVariantManagementUi2.prototype._reCreateVariantEntries = function() {

		var n = null;
		var sVariantKey = null;
		var oVariant;

		if (this._oVariantSet) {
			var mVariantList = this._getVariantNamesAndKeys();
			if (mVariantList) {
				for (n in mVariantList) {
					if (n) {
						this._createVariantItem(mVariantList[n], n);
					}
				}

				sVariantKey = this._oVariantSet.getCurrentVariantKey();
				oVariant = this._oVariantSet.getVariant(sVariantKey);
				if (!oVariant) {
					sVariantKey = this.getStandardVariantKey();
				}
				this.setDefaultVariantKey(sVariantKey); // set the default variant
				this.setInitialSelectionKey(sVariantKey); // set the current selected variant
			}
		}
	};

	SmartVariantManagementUi2.prototype._getVariantSetAdapter = function(oContainer) {
		if (!oContainer) {
			return Promise.resolve(null);
		}
		return new Promise(function(resolve) {
			sap.ui.require([
				"sap/ushell/services/PersonalizationV2/VariantSetAdapter"
			], function(VariantSetAdapter) {
				resolve(new VariantSetAdapter(oContainer));
			});
		});
	};


	SmartVariantManagementUi2.prototype._createVariantEntries = function() {

		this.removeAllVariantItems();
		this._createStandardVariantItem();

		return this._getVariantSetAdapter(this._oContainer).then(function(oVariantSetAdapter) {
			if (oVariantSetAdapter) {
				this._oVariantSet = oVariantSetAdapter.getVariantSet("filterBarVariantSet");
				if (this._oVariantSet) {
					this._reCreateVariantEntries();
				} else {
					this._oVariantSet = oVariantSetAdapter.addVariantSet("filterBarVariantSet");
				}

				this._setStandardVariant();
				if (this.getDefaultVariantKey() !== this.getStandardVariantKey()) {
					this._setSelectedVariant();
				}
			}

			this.fireEvent("initialise");
		}.bind(this));
	};

	/**
	 * Reads the personalization.
	 * @private
	 * @param {object} oContainer personalization conmteiner
	 */
	SmartVariantManagementUi2.prototype._readPersonalization = function(oContainer) {

		this._oContainer = oContainer;

		if (this._oContainer) {
			this._createVariantEntries();
		}
	};

	/**
	 * Handling the save of the personalization container.
	 * @private
	 */
	SmartVariantManagementUi2.prototype._savePersonalizationContainer = function() {

		var that = this;

		if (this._oContainer) {

			this._oContainer.save() // save the whole container!
			.fail(function() {
				Log.error("Saving personalization data failed");
				that._setErrorValueState(that.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE_FAILED"));

			}).done(function() {
				// Before the next save is triggered the last one has to be finished.
				// Could be done by disabling the save button during the save.
				Log.info("Saving personalization data succeeded");
				that.fireEvent("afterSave");
			});
		}
	};

	/**
	 * Eventhandler for the <code>SmartVariantManagementUi2</code> save event.
	 * @private
	 * @param {object} oVariantInfo Describes the variant to be saved
	 */
	SmartVariantManagementUi2.prototype.fireSave = function(oVariantInfo) {

		var oVariant = null, oNewVariant = null;
		var sVariantKey;

		if (!this._oVariantSet) {
			return;
		}

		if (oVariantInfo) {

			if (oVariantInfo.overwrite) {
				if (oVariantInfo.key) {
					oVariant = this._oVariantSet.getVariant(oVariantInfo.key);
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (oVariantInfo.name) {
					oVariant = this._oVariantSet.addVariant(oVariantInfo.name);
					oNewVariant = oVariant; // indicates that we have to adapt the variant management key

					sVariantKey = oNewVariant.getVariantKey();

					this._createVariantItem(sVariantKey, oVariantInfo.name);

					this.setInitialSelectionKey(sVariantKey);
				}
				/* eslint-enable no-lonely-if */
			}

			if (oVariant) {

				this.fireEvent("save", oVariantInfo);
				var oVariantContent = this._fetchVariant();
				if (oVariantContent) {

					oVariant.setItemValue("filterBarVariant", oVariantContent.filterBarVariant);
					oVariant.setItemValue("filterbar", oVariantContent.filterbar);
					oVariant.setItemValue("basicSearch", "");
					if (oVariantContent.basicSearch) {
						oVariant.setItemValue("basicSearch", oVariantContent.basicSearch);
					}

					sVariantKey = oVariant.getVariantKey();
					if (oVariantInfo.def) {
						if (sVariantKey) {
							this._oVariantSet.setCurrentVariantKey(sVariantKey);
						}
					} else {
						var sDefaultVariantKey = this._oVariantSet.getCurrentVariantKey();
						if (sVariantKey === sDefaultVariantKey) {
							this._oVariantSet.setCurrentVariantKey(null);
						}
					}
				}

				this.currentVariantSetModified(false);

				this._savePersonalizationContainer();
			}
		}

	};

	/**
	 * Stores the STANDARD variant.
	 * @private
	 */
	SmartVariantManagementUi2.prototype._setStandardVariant = function() {

		if (this._oPersController && this._oPersController.fireBeforeVariantSave) {
			this._oPersController.fireBeforeVariantSave(library.STANDARD_VARIANT_NAME);
		}

		this._oStandardVariant = this._fetchVariant();
	};

	/**
	 * returns a previously stored representation of the standard variant. Only relevant for the UI2 personalization-service
	 * @private
	 * @returns {object} json compatible object representing the standard variant
	 */
	SmartVariantManagementUi2.prototype._getStandardVariant = function() {
		return this._oStandardVariant;
	};


	SmartVariantManagementUi2.prototype._getVariantNamesAndKeys = function() {
		return this._oVariantSet.getVariantNamesAndKeys();
	};

	SmartVariantManagementUi2.prototype._reorderList = function (sKey) {
		var oVariant = this.getItemByKey(sKey);
		if (oVariant) {
			this.removeVariantItem(oVariant);
			var nIdx = this._getIdxSorted(oVariant.getTitle());
			this.insertVariantItem(oVariant, nIdx);
		}
	};

	/**
	 * Eventhandler for the <code>SmartVariantManagementUi2</code> manage event.
	 * @private
	 * @param {object} oVariantInfo Describes the variants, which will be deleted/renamed
	 */
	SmartVariantManagementUi2.prototype.fireManage = function(oVariantInfo) {

		var i;
		var renamed = null, deleted = null;
		var oVariant;

		if (!this._oVariantSet) {
			return;
		}

		if (oVariantInfo) {
			renamed = oVariantInfo.renamed;
			deleted = oVariantInfo.deleted;

			if (renamed) {
				for (i = 0; i < renamed.length; i++) {
					oVariant = this._oVariantSet.getVariant(renamed[i].key);
					if (oVariant) {
						oVariant.setVariantName(renamed[i].name);
						this._reorderList(renamed[i].key);
					}
				}
			}

			if (deleted) {
				var sVariantKey = this._oVariantSet.getCurrentVariantKey();
				var sCurrentVariantKey = this.getCurrentVariantId();
				for (i = 0; i < deleted.length; i++) {
					oVariant = this._oVariantSet.getVariant(deleted[i]);
					if (oVariant) {
						this._oVariantSet.delVariant(deleted[i]);
						this.removeVariantItemByKey(deleted[i]);

						if (sVariantKey && sVariantKey === oVariant.getVariantKey()) {
							this._oVariantSet.setCurrentVariantKey(null);
						}
						if (sCurrentVariantKey && sCurrentVariantKey === oVariant.getVariantKey()) {
							this.setSelectionKey(this.getStandardVariantKey());
							this.fireSelect({key: this.getStandardVariantKey()});
						}
					}
				}
			}

			if (oVariantInfo.def) {
				oVariant = this._oVariantSet.getVariant(oVariantInfo.def);
				if (oVariant || (oVariantInfo.def === this.getStandardVariantKey())) {
					this._oVariantSet.setCurrentVariantKey(oVariantInfo.def);
				}
			}

			if ((deleted && deleted.length > 0) || (renamed && renamed.length > 0) || (oVariantInfo.def)) {
				this._savePersonalizationContainer();
			}
		}

	};

	/**
	 * Eventhandler for the <code>SmartVariantManagementUi2</code> select event.
	 * @private
	 * @param {object} oVariantInfo Describes the selected variant
	 */
	SmartVariantManagementUi2.prototype.fireSelect = function(oVariantInfo) {

		var oVariant = null;

		if (oVariantInfo && oVariantInfo.key) {

			if (this._oVariantSet) {

				if (oVariantInfo.key === this.getStandardVariantKey()) {
					oVariant = this._getStandardVariant();
				} else {
					oVariant = this._oVariantSet.getVariant(oVariantInfo.key);
				}
			}
		}

		if (oVariant) {
			this.currentVariantSetModified(false);
			this._applyVariant(oVariant);
		}
	};

	/**
	 * Retrieves variant content.
	 * @private
	 * @param {object} oVariant json object representing the variant data
	 * @returns {object} the variant content
	 */
	SmartVariantManagementUi2.prototype._getContent = function(oVariant) {
		var oContent = null;

		if (oVariant) {
			if (oVariant.getItemValue) {
				oContent = {
					filterbar: oVariant.getItemValue("filterbar"),
					filterBarVariant: oVariant.getItemValue("filterBarVariant")
				};

				var sBasicSearch = oVariant.getItemValue("basicSearch");
				if (sBasicSearch) {
					oContent.basicSearch = sBasicSearch;
				}
			} else {
				oContent = oVariant; // STANDARD variant
			}
		}

		return oContent;

	};

	/**
	 * Apply a variant.
	 * @private
	 * @param {object} oVariant json object representing the variant data
	 */
	SmartVariantManagementUi2.prototype._applyVariant = function(oVariant) {

		var oContent = this._getContent(oVariant);

		this._applyVariantContent(oContent);
	};

	/**
	 * Apply a variant.
	 * @private
	 * @param {object} oContent json object representing the variant data
	 */
	SmartVariantManagementUi2.prototype._applyVariantContent = function(oContent) {

		if (oContent && this._oPersController && this._oPersController.applyVariant) {
			this._oPersController.applyVariant(oContent);
		}
	};

	/**
	 * Fetch a variant.
	 * @private
	 * @returns {object} json object representing the content of a variant
	 */
	SmartVariantManagementUi2.prototype._fetchVariant = function() {

		if (this._oPersController && this._oPersController.fetchVariant) {
			return this._oPersController.fetchVariant();
		}

		return null;
	};

	/**
	 * Retrieves the persistency key.
	 * @private
	 * @returns {string} persistency key value
	 */
	SmartVariantManagementUi2.prototype._getPersistencyKey = function() {

		if (this._oPersController && this._sKeyName) {
			return this._oPersController.getProperty(this._sKeyName);
		}

		return null;
	};

	/**
	 * Sets an error state on the variant management control.
	 * @private
	 * @param {string} sText describing the error reason
	 */
	SmartVariantManagementUi2.prototype._setErrorValueState = function(sText) {
		this.setEnabled(false);
	};

	SmartVariantManagementUi2.prototype.exit = function() {
		Control.prototype.exit.apply(this, arguments);

		if (this._oManagedObjectModel) {
			this._oManagedObjectModel.destroy();
			this._oManagedObjectModel = undefined;
		}

		this._oVM.detachManage(this._fireManage, this);
		this._oVM.detachSelect(this._fireSelect, this);
		this._oVM.detachSave(this._fireSave, this);

		this._oStandardVariant = null;
		this._oPersController = null;
		this._sKeyName = null;

		this._oContainer = null;
		this._oVariantSet = null;
	};

	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementBase#addVariantItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementBase#insertVariantItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementBase#removeVariantItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementBase#destroyVariantItems
	 * @private
	 */
	/**
	 * @name sap.ui.comp.smartvariants.SmartVariantManagementBase#removeAllVariantItems
	 * @private
	 */

	return SmartVariantManagementUi2;

});