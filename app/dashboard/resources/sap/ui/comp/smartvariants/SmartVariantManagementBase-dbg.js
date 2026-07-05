/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartvariants.SmartVariantManagementBase.
sap.ui.define([
	"sap/m/VariantManagement",
	'sap/ui/model/base/ManagedObjectModel',
	'sap/ui/base/ManagedObjectObserver',
	'sap/base/Log',
	'./SmartVariantManagementMediator'
], function(
	MVariantManagement,
	ManagedObjectModel,
	ManagedObjectObserver,
	Log,
	SmartVariantManagementMediator
) {
	"use strict";

	/**
	 * Constructor for a new <code>SmartVariantManagementBase</code>.
	 * @param {string} [sId] - ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] - Initial settings for the new control
	 * @class
	 *            <h3>Overview</h3>
	 *            The <code>SmartVariantManagementBase</code> control embeds
	 *            {@link sap.m.VariantManagement VariantManagement}
	 *            control and communicates with the flexibility library that
	 *            offers SAPUI5 flexibility to manage the variants for the UI
	 *            Adaptation scenarios.<br>
	 * @see {@link topic:f1430c0337534d469da3a56307ff76af Key User Adaptation: Enable Your App}
	 * @extends sap.ui.comp.smartvariants.SmartVariantManagementMediator
	 * @constructor
	 * @public
	 * @since 1.56
	 * @alias sap.ui.comp.smartvariants.SmartVariantManagementBase
	 */
	const SmartVariantManagementBase = SmartVariantManagementMediator.extend("sap.ui.comp.smartvariants.SmartVariantManagementBase", /** @lends sap.ui.comp.smartvariants.SmartVariantManagementBase.prototype */ {
		metadata: {
			interfaces: [
				"sap.m.IOverflowToolbarContent"
			],
			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartvariants/SmartVariantManagementBase.designtime",
			properties: {

				/**
				 * Defines the author of the standard variant, for example, the name of the own company.
				 */
				standardItemAuthor: {
					type: "string",
					group: "Misc",
					defaultValue: "SAP"
				},

				/**
				 * Enables the setting of the initially selected variant.
				 * @deprecated As of version 1.103, replaced by property <code>selectionKey</code>
				 */
				initialSelectionKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Enables the lifecycle support. If set to true, the VariantManagement control handles the transport information for shared variants.
				 * @deprecated As of version 1.103, life-cycle handling of views is done internally by the SAPUI5 flexibility service.
				 */
				lifecycleSupport: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			}
		},
		renderer: {
			apiVersion: 2
		}
	});

	/*
	 * Constructs and initializes the <code>VariantManagement</code> control.
	 */
	SmartVariantManagementBase.prototype.init = function() {
		SmartVariantManagementMediator.prototype.init.apply(this); // Call base class
		this._mVariants = {};

		this.STANDARDVARIANTKEY = "*standard*";

		this._mTranslatablePromises = {};

		this.addStyleClass("sapUiCompVarMngmt");

		this.setStandardVariantKey(this.STANDARDVARIANTKEY);

		// this._oManagedObjectModel = new ManagedObjectModel(this);
		// this.setModel(this._oManagedObjectModel, "$compSmartVariants");

		this._oObserver = new ManagedObjectObserver(this._observeChanges.bind(this));
		this._oObserver.observe(this, {
			properties: ["standardItemText"]
		});

		this.setDefaultVariantKey(this.getStandardVariantKey());
		this.setPopoverTitle(this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTS"));
		this._setStandardVariantKey(this.STANDARDVARIANTKEY);
	};

	SmartVariantManagementBase.prototype._observeChanges = function(oChanges) {
		if (oChanges.type === "property") {
			if (this._mTranslatablePromises[oChanges.name] && this._mTranslatablePromises[oChanges.name].fnResolve) {
				this._mTranslatablePromises[oChanges.name].fnResolve(oChanges.current);
			} else if (!this._mTranslatablePromises[oChanges.name]) {
				this._mTranslatablePromises[oChanges.name] = {
					promise: Promise.resolve(oChanges.current)
				};
			}
		}
	};

	//						EmbeddedVM creation + deletion

	SmartVariantManagementBase.prototype._createEmbeddedVM = function() {
		SmartVariantManagementMediator.prototype._createEmbeddedVM.apply(this);
		this._oVM.attachCancel(this._onCancel, this);
		this._oVM.attachManageCancel(this._onManageCancel, this);
	};

	SmartVariantManagementBase.prototype._destroyEmbeddedVM = function() {
		if (this._oVM) {
			this._oVM.detachCancel(this._onCancel, this);
			this._oVM.detachManageCancel(this._onManageCancel, this);
		}
		SmartVariantManagementMediator.prototype._destroyEmbeddedVM.apply(this);
	};

	//						EmbeddedVM Event handlers

	SmartVariantManagementBase.prototype._onCancel = function(oEvent) {
		if (this._fGetDataForKeyUser) {
			this._fGetDataForKeyUser();
			this._cleanUpSaveForKeyUser();
		}
	};

	SmartVariantManagementBase.prototype._onSave = function(oEvent) {
		const mParameters = oEvent.getParameters();
		if (this._fGetDataForKeyUser) {
			this._prepareSaveAsKeyUserData(mParameters);
			return;
		}

		SmartVariantManagementMediator.prototype._onSave.apply(this, arguments);
	};

	SmartVariantManagementBase.prototype._onManage = function(oEvent) {
		const mParameters = oEvent.getParameters();
		if (this._fGetDataForKeyUser) {
			this._prepareManageKeyUserData(mParameters);
			return;
		}

		this.fireManage(mParameters);
	};

	SmartVariantManagementBase.prototype._onManageCancel = function(oEvent) {
		if (this._fGetDataForKeyUser) {
			this._fGetDataForKeyUser();
			this._cleanUpManageViewsForKeyUser();
		}
	};

	SmartVariantManagementBase.prototype._onSelect = function(oEvent) {
		if (!this._fGetDataForKeyUser) {
			this.setModified(false);
		}

		SmartVariantManagementMediator.prototype._onSelect.apply(this, arguments);
	};

	SmartVariantManagementBase.prototype._getStandardVariantItemName = function() {
		const sPropertyName = "standardItemText";

		if (this.getBindingInfo(sPropertyName)) {
			return this._waitForTranslation(sPropertyName);
		} else {
			return Promise.resolve(this._determineStandardVariantName());
		}
	};

	SmartVariantManagementBase.prototype._waitForTranslation = function(sPropertyName) {
		if (!this._mTranslatablePromises[sPropertyName]) {
			let fnResolve = null;
			const oPromise = new Promise((resolve) => {
				fnResolve = resolve;
			});
			this._mTranslatablePromises[sPropertyName] = {
				promise: oPromise,
				fnResolve: fnResolve
			};
		}

		return this._mTranslatablePromises[sPropertyName].promise;
	};

	SmartVariantManagementBase.prototype.setInitialSelectionKey = function(sKey) {
		return this.setSelectionKey(sKey);
	};

	SmartVariantManagementBase.prototype.getInitialSelectionKey = function() {
		return this.getSelectionKey();
	};

	/// <EVENT FORWARDING>

	SmartVariantManagementBase.prototype._prepareSaveAsKeyUserData = function(mParameters) {
		try {
			this._getContentAsync().then((oContent) => {
				const mData = {
					"default": mParameters.def,
					executeOnSelection: mParameters.execute,
					type: this._getPersoControllerType(),
					text: mParameters.name,
					contexts: mParameters.contexts,
					content: oContent
				};

				this._fGetDataForKeyUser(mData);
				this._cleanUpSaveForKeyUser();
			});
		} catch (oException) {
			Log.error("'_prepareSaveAsKeyUserData' throws an exception:" + oException.message);
			this._fGetDataForKeyUser();
			this._cleanUpSaveForKeyUser();
		}
	};

	SmartVariantManagementBase.prototype._prepareManageKeyUserData = function(mParameters) {
		const mData = {};
		let bSelectedItemDeleted = false;

		if (mParameters.hasOwnProperty("def")) {
			const sDefault = mParameters.def;
			if (sDefault !== this._oVM._sOriginalDefaultKey) {
				mData.default = sDefault;
			}
		}

		if (mParameters.hasOwnProperty("deleted")) {
			mParameters.deleted.forEach((sKey) => {
				if (!mData[sKey]) {
					mData[sKey] = {};
				}
				mData[sKey].deleted = true;

				if (this.getSelectionKey() === sKey) {
					bSelectedItemDeleted = true;
				}
			});
		}

		if (mParameters.hasOwnProperty("exe")) {
			mParameters.exe.forEach((oEntry) => {
				if (!mData[oEntry.key]) {
					mData[oEntry.key] = {};
				}
				mData[oEntry.key].executeOnSelection = oEntry.exe;
			});
		}

		if (mParameters.hasOwnProperty("fav")) {
			mParameters.fav.forEach((oEntry) => {
				if (!mData[oEntry.key]) {
					mData[oEntry.key] = {};
				}
				mData[oEntry.key].favorite = oEntry.visible;
			});
		}

		if (mParameters.hasOwnProperty("renamed")) {
			mParameters.renamed.forEach((oEntry) => {
				if (!mData[oEntry.key]) {
					mData[oEntry.key] = {};
				}
				mData[oEntry.key].name = oEntry.name;
			});
		}

		if (mParameters.hasOwnProperty("contexts")) {
			mParameters.contexts.forEach((oEntry) => {
				if (!mData[oEntry.key]) {
					mData[oEntry.key] = {};
				}
				mData[oEntry.key].contexts = oEntry.contexts;
			});
		}

		if (bSelectedItemDeleted) {
			this.activateVariant(this.getStandardVariantKey());
		}

		this._fGetDataForKeyUser(mData);

		this._cleanUpManageViewsForKeyUser();
	};

	SmartVariantManagementBase.prototype._updateLayerSpecificInformations = function() {
		this.getVariants().forEach((oItem) => {
			const oVariant = this._getVariantById(oItem.getKey());
			if (oVariant) {
				oItem.setRemove(oVariant.isDeleteEnabled(this._sLayer));
				oItem.setRename(oVariant.isRenameEnabled(this._sLayer));
			}
		});
	};

	/**
	 * Retrieves the persistency key of the current variant management control.
	 * @private
	 * @ui5-restricted sap.ui.fl
	 * @returns{string} the assigned persistncy key
	 */
	SmartVariantManagementBase.prototype.getPersonalizableControlPersistencyKey = function() {
		if (this.isPageVariant()) {
			return this.getPersistencyKey();
		}

		const aPersoInfo = this._getAllPersonalizableControls();
		if (aPersoInfo && (aPersoInfo.length === 1)) {
			return this._getControlPersKey(aPersoInfo[0]);
		}

		return null;
	};

	/**
	 * Retrieves the currently active variant id.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {string} the current active variant id
	 */
	SmartVariantManagementBase.prototype.getPresentVariantId = function() {
		return this.getCurrentVariantId() ? this.getCurrentVariantId() : this.STANDARDVARIANTKEY;
	};

	/**
	 * Retrieves the currently active variant title.
	 * @deprecated the concept has been discarded.
	 * @returns {string} the currently active variant title.
	 */
	SmartVariantManagementBase.prototype.getPresentVariantText = function() {
		return this._oVM.getSelectedVariantText(this.getPresentVariantId());
	};

	/**
	 * Retrieves the actual variant content.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {Promise} resolves with the current variant content
	 */
	SmartVariantManagementBase.prototype.getPresentVariantContent = function() {
		return this._getContentAsync();
	};

	/**
	 * Retrieves the control which personalization is handled by the current variant management.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {sap.ui.core.Control} currently under personalization
	 */
	SmartVariantManagementBase.prototype._getPersoController = function() {
		return this._oPersoControl;
	};

	SmartVariantManagementBase.prototype._getPersoControllerType = function() {
		if (this.isPageVariant()) {
			return "page";
		}

		const aPersoInfo = this._getAllPersonalizableControls();
		if (aPersoInfo && (aPersoInfo.length === 1)) {
			return aPersoInfo[0].type;
		}

		return null;
	};


	SmartVariantManagementBase.prototype._getViewByName = function(sViewName) {
		let sText;
		const sTrimName = sViewName.trim();
		const oItems = this.getVariants();
		for (let i = 0; i < oItems.length; i++) {
			sText = oItems[i].getText().trim();
			if (sText === sTrimName) {
				return oItems[i];
			}
		}

		return null;
	};

	/**
	 * Retrieves view id for a given view name.
	 * The first match will be returned.
	 * @protected
	 * @ui5-restricted sap.ui.comp
	 * @param {string} sViewName the look-up view name
	 * @returns {string} view id, if a matching view name was found, <code>null</code> otherwise
	 */
	SmartVariantManagementBase.prototype.getViewIdByName = function(sViewName) {
		const oVariantItem = this._getViewByName(sViewName);
		return oVariantItem ? oVariantItem.getKey() : null;
	};

	SmartVariantManagementBase.prototype._isDuplicateSaveAs = function(sValue) {
		const sTrimName = sValue.trim();
		if (!sTrimName) {
			return true;
		}

		const sText = this._determineStandardVariantName();
		if (sText === sTrimName) {
			return true;
		}

		return this._getViewByName(sTrimName) ? true : false;
	};

	SmartVariantManagementBase.prototype.isNameDuplicate = function(sName) {
		const sValue = sName.trim();
		return this._isDuplicateSaveAs(sValue);
	};

	SmartVariantManagementBase.prototype.isNameTooLong = function(sName) {
		const sValue = sName.trim();
		return (sValue.length > MVariantManagement.MAX_NAME_LEN);
	};

	SmartVariantManagementBase.prototype._executeOnSelectForStandardVariantByXML = function(bSelect) {
		this.bExecuteOnSelectForStandardViaXML = bSelect;
	};

	SmartVariantManagementBase.prototype.getExecuteOnSelectForStandardVariant = function() {
		let bExecForStandardVariant = false;
		const oStandardVariant = this.getItemByKey(this.getStandardVariantKey());
		if (oStandardVariant) {
			bExecForStandardVariant = oStandardVariant.getExecuteOnSelect();
		}

		return bExecForStandardVariant || this.bExecuteOnSelectForStandardViaXML;
	};

	/**
	 * Opens the Manage Views dialog when in Ui Adaptation mode.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {map} mProperties describing rta related information
	 * @param {object} fCallBack which gets executed, once the dialog is left via OK button
	 * @param {boolean} bTesting only relevant for unit tests
	 */
	SmartVariantManagementBase.prototype.openManageViewsDialogForKeyUser = function(mProperties, fCallBack, bTesting = false) {
		this._sLayer = mProperties.layer;
		this._fGetDataForKeyUser = fCallBack;

		this._updateLayerSpecificInformations();

		let bAlwaysDestroy = true;
		if (bTesting) {
			bAlwaysDestroy = false;
		}
		this._oVM.openManagementDialog(bAlwaysDestroy, mProperties.rtaStyleClass, mProperties.contextSharingComponentContainer);
	};

	/**
	 * Retrieves the title of the current variant.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {sap.m.Title} title instance of the current variant
	 */
	SmartVariantManagementBase.prototype.getTitle = function() {
		return this._oVM.getTitle();
	};

	SmartVariantManagementBase.prototype.refreshTitle = function() {
		this._oVM.refreshTitle();
	};

	/**
	 * Indicates the design mode was entered.
	 * @private
	 * @ui5-restricted sap.ui.fl, sap.ui.rta
	 */
	SmartVariantManagementBase.prototype.enteringDesignMode = function() {
		this.setDesignTimeMode(true);
	};

	/**
	 * Indicates the design mode was left.
	 * @private
	 * @ui5-restricted sap.ui.fl, sap.ui.rta
	 */
	SmartVariantManagementBase.prototype.leavingDesignMode = function() {
		this.setDesignTimeMode(false);
	};

	SmartVariantManagementBase.prototype.setDesignTimeMode = function(bValue) {
		this.oModel.setVariantsEditable(!bValue, this.oContext?.path);
		return this._oVM.setDesignMode(bValue);
	};

	/**
	 * Retrieves the Manage Views dialog instance.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {sap.m.Dialog} the instance of the Manage Views dialog.
	 */
	SmartVariantManagementBase.prototype.getManageDialog = function() {
		if (this._oVM) {
			return this._oVM.oManagementDialog;
		}

		return null;
	};

	/**
	 * Opens the Save As dialog when in Ui Adaptation mode.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {string} sStyleClass rta specific style for dialog
	 * @param {object} fCallBack which gets executed, once the dialog is left via OK button
	 * @param {object} oRolesComponentContainer representing the component responsible for role assignment
	 */
	SmartVariantManagementBase.prototype.openSaveAsDialogForKeyUser = function(sStyleClass, fCallBack, oRolesComponentContainer) {
		this._fGetDataForKeyUser = fCallBack;
		this._oVM.openSaveAsDialog(sStyleClass, oRolesComponentContainer);
	};

	SmartVariantManagementBase.prototype._cleanUpSaveForKeyUser = function() {
		if (this._oRolesComponentContainer) {
			this.oSaveDialog.removeContent(this._oRolesComponentContainer);
		}

		this._cleanUpKeyUser();
	};

	/**
	 * Retrieves the default variant id.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {string} the current default variant id
	 */
	SmartVariantManagementBase.prototype.getDefaultVariantId = function() {
		return this.getDefaultVariantKey();
	};

	/**
	 * Sets the default variant id.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {string} sVariantId is the current default variant id
	 */
	SmartVariantManagementBase.prototype.setDefaultVariantId = function(sVariantId) {
		this.setDefaultVariantKey(sVariantId);	// inform VM about the new default
	};

	/**
	 * Selects a variant.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {string} sVariantId variant to be selected
	 */
	SmartVariantManagementBase.prototype.activateVariant = function(sVariantId) {
		this.setCurrentVariantKey(sVariantId);

		this.setModified(false);

		this.fireSelect({ key: sVariantId });
	};

	/**
	 * Retrieves all variant ids.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @returns {string[]} list of all available variant ids
	 */
	SmartVariantManagementBase.prototype.getAllVariants = function() {
		const aItems = this.oModel.getVariants();
		const aVariantList = [];

		if (!aItems || (aItems.length < 1)) {
			// error case
			return aVariantList;
		}

		aItems.forEach((mView) => {
			aVariantList.push(this._getVariantById(mView.key));
		});

		return aVariantList;
	};

	/**
	 * Updates a variant.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {object} oVariant inner flex variant
	 */
	SmartVariantManagementBase.prototype.updateVariant = function(oVariant) {
		this.oModel.updateVariant(oVariant);
	};

	/**
	 * Adds a variant.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {map} oVariant inner flex variant describes the newly added variant
	 * @param {string} bIsDefault describes if the the newly added variant is defualted
	 */
	SmartVariantManagementBase.prototype.addVariant = function(oVariant, bIsDefault) {
		this._createVariantItem(oVariant);

		if (bIsDefault) {
			this.setDefaultVariantId(oVariant.getVariantId());
		}
	};

	SmartVariantManagementBase.prototype._insertVariantItem = function(oVariant, mViewData) {
		let nIdx = 0;
		const aVariants = this.oModel.getVariants();
		if (oVariant.getVariantId() === this.STANDARDVARIANTKEY) {
			mViewData.author = this.getStandardItemAuthor();
		} else {
			nIdx = this._getIdxSorted(oVariant.getName());
		}

		aVariants.splice(nIdx, 0, mViewData);
		this.oModel.setVariants(aVariants);
	};

	/**
	 * Removes a variant.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {map} mProperties describes the deleted variant
	 */
	SmartVariantManagementBase.prototype.removeVariant = function(mProperties) {

		if (mProperties.variantId) {
			this.oModel.removeVariant(mProperties.variantId);
			delete this._mVariants[mProperties.variantId];
		}

		if (mProperties.previousVariantId) {
			this.activateVariant(mProperties.previousVariantId);
		}

		if (mProperties.previousDefault) {
			this.setDefaultVariantId(mProperties.previousDefault);
		}
	};

	/**
	 * Removes a variant.
	 * @private
	 * @ui5-restricted sap.ui.rta
	 * @param {map} mProperties describes the deleted variant
	 */
	SmartVariantManagementBase.prototype.removeWeakVariant = function(mProperties) {

		if (mProperties.variantId) {
			this.oModel.removeVariant(mProperties.variantId);
			delete this._mVariants[mProperties.variantId];
		}

		if (mProperties.previousVariantId) {
			this.setSelectionKey(mProperties.previousVariantId);
		}

		if (mProperties.previousDirtyFlag) {
			this.setModified(mProperties.previousDirtyFlag);
		}

		if (mProperties.previousDefault) {
			this.setDefaultVariantId(mProperties.previousDefault);
		}
	};

	SmartVariantManagementBase.prototype._cleanUpManageViewsForKeyUser = function() {
		this._destroyManageDialog();

		this._cleanUpKeyUser();
	};

	SmartVariantManagementBase.prototype._cleanUpKeyUser = function() {

		this.setShowShare(this._bShowShare);

		this._fGetDataForKeyUser = null;
		this._sLayer = null;

		this._oRolesComponentContainer = null;
	};

	SmartVariantManagementBase.prototype._getContentAsync = function() {
		return Promise.resolve(this._fetchContentAsync()); // TODO: define this method
	};

	// exit destroy all controls created in init
	SmartVariantManagementBase.prototype.exit = function() {
		this._oObserver.disconnect();
		this._oObserver = undefined;
		this._mTranslatablePromises = null;
		this._mVariants = null;

		if (this._oManagedObjectModel) {
			this._oManagedObjectModel.destroy();
			this._oManagedObjectModel = undefined;
		}

		this._fRegisteredApplyAutomaticallyOnStandardVariant = null;

		SmartVariantManagementMediator.prototype.exit.apply(this);
	};

	return SmartVariantManagementBase;
});