/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Element",
	'sap/ui/comp/library',
	'sap/ui/comp/odata/ODataModelUtil',
	'sap/ui/comp/odata/MetadataAnalyser',
	'./SmartVariantManagementAdapter',
	'./SmartVariantManagementBase',
	'sap/base/Log',
	'sap/base/util/merge',
	'sap/ui/base/SyncPromise'
], function(
	Element,
	library,
	ODataModelUtil,
	MetadataAnalyser,
	SmartVariantManagementAdapter,
	SmartVariantManagementBase,
	Log,
	merge,
	SyncPromise
) {
	"use strict";

	/**
	 * Constructor for a new SmartVariantManagement.<br>
	 * The call sequence is as follows:<br>
	 * A control for which personalization is used has to be registered first via the <code>personalizableControls</code> association. Then it has
	 * to call the <code>initialise</code> method with the arguments <code>fCallback</code> function which will be called once the personalization
	 * data has been retrieved and <code>oPersoControl</code>, the control itself.<BR>
	 * <b>Note:</b> the function callback has to be defined in the personalizable control.<BR>
	 * The old behavior, where the control has to register to the <code>initialise</code> event, before the <code>initialise</code> method call,
	 * should not be used any longer and is not supported at all for the page variant scenarios.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class
	 *        <h3>Overview</h3>
	 *        The <code>SmartVariantManagement</code> control communicates with the flexibility library that offers SAPUI5 flexibility to manage the variants.<br>
	 *        <h3>Usage</h3>
	 *        You can use this control in combination with the following controls:
	 *        <ul>
	 *        <li><code>SmartFilterBar</code></li>
	 *        <li><code>SmartChart</code></li>
	 *        <li><code>SmartTable</code></li>
	 *        </ul>
	 * @extends sap.ui.comp.smartvariants.SmartVariantManagementBase
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartvariants.SmartVariantManagement
	 * @see {@link topic:06a4c3ac1cf545a7b51864e7f3aa02da Smart Variant Management}
	 * @see {@link topic:a8e55aa2f8bc4127923b20685a6d1621 SAPUI5 Flexibility: Adapting UIs Made Easy}
	 */
	var SmartVariantManagement = SmartVariantManagementBase.extend("sap.ui.comp.smartvariants.SmartVariantManagement", /** @lends sap.ui.comp.smartvariants.SmartVariantManagement.prototype */
		{
			metadata: {
				library: "sap.ui.comp",
				designtime: "sap/ui/comp/designtime/smartvariants/SmartVariantManagement.designtime",
				interfaces: [
					"sap.ui.core.IShrinkable"
				],
				properties: {
					/**
					 * Key used to access personalization data.
					 */
					persistencyKey: {
						type: "string",
						group: "Misc",
						defaultValue: null
					},

					/**
					 * The v2 oData entity set whose metadata is used to create the variant items based on the <code>SelectionPresentationVariant</code> annotation.
					 * <br><b>Note:</b>This property may be set only once during the initialization phase and may not be changed afterwords.
					 */
					entitySet: {
						type: "string",
						group: "Misc",
						defaultValue: null
					}
				},
				aggregations: {

					/**
					 * All controls that rely on variant handling have to be added to this aggregation.
					 */
					personalizableControls: {
						type: "sap.ui.comp.smartvariants.PersonalizableInfo",
						multiple: true,
						singularName: "personalizableControl"
					}
				},
				events: {

					/**
					 * This event is fired when the SmartVariantManagement control is initialized.
					 * @deprecated Since version 1.38.0. Replaced by providing the personalizable control and the callback via the <code>initialise</code>-method.
					 */
					initialise: {},

					/**
					 * This event is fired after a variant has been saved.
					 */
					save: {
						parameters: {
							/**
							 * If the property <code>showCreateTile</code> is set, the Create Tile checkbox is shown and its value is passed to this
							 * event parameter.<br>
							 * If the property <code>showCreateTile</code> is not set, this event parameter is skipped.
							 */
							tile: {
								type: "boolean"
							},
							/**
							 * Variant title. Will be passed for new and for updated variants.
							 */
							name: {
								type: "string"
							}
						}
					},

					/**
					 * This event is fired after all changes are successfully stored.
					 */
					afterSave: {}
				}
			},
			renderer: {
				apiVersion: 2
			}
		});

	SmartVariantManagement.prototype.init = function() {
		SmartVariantManagementBase.prototype.init.apply(this); // Call base class

		this._bIsInitialized = false;
		this._bIsVariantAdaptationEnabled = false;

		this._oStandardVariant = null;

		this._oControlPromise = null;

		this._oPersoControl = null;
		this._sAppStandardVariantKey = null;


		this._oSelectionVariantHandler = {};

		this._oAppStdContent = null;

		this._aPersonalizableControls = [];

		this._oAdapter = null;

		this._bApplyingUIState = false;

		this._loadFlex();
	};


	/**
	 * The entity set name from OData metadata, with which the smart variant control must be bound.
	 *
	 * @param {string} sEntitySetName The entity set
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagement} The control instance
	 * @public
	 */
	SmartVariantManagement.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName, true);

		this._checkEntitySet(sEntitySetName);
		return this;
	};

	SmartVariantManagement.prototype._checkEntitySet = function(sEntitySetName) {
		if (!this._oMetadataPromise) {

			this.attachModelContextChange(this._initializeMetadata, this);
			this._createMetadataPromise();

			this._initializeMetadata();
		}
		return this;
	};

	SmartVariantManagement.prototype._createMetadataPromise = function() {
		this._oMetadataPromise = new Promise((resolve/*, reject*/) => {
			this._fResolveMetadataPromise = resolve;
		});
	};

	SmartVariantManagement.prototype._resolveMetadataPromise = function() {
		if (this._fResolveMetadataPromise) {
			this._fResolveMetadataPromise();
		}
	};

	/**
	 * Initialises the OData metadata necessary to create the table
	 *
	 * @param {Object} oEvt The event object
	 * @private
	 */
	SmartVariantManagement.prototype._initializeMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInitialised);
		}
	};

	SmartVariantManagement.prototype._onMetadataInitialised = function() {
		this._bMetaModelLoadAttached = false;
		if (!this.bIsInitialised) {

			var oMetadataAnalyser = new MetadataAnalyser(this.getModel());

			if (oMetadataAnalyser) {
				this._oAdapter = new SmartVariantManagementAdapter({
					selectionPresentationVariants: oMetadataAnalyser.getSelectionPresentationVariantAnnotationList(this.getEntitySet())
				});

				this.detachModelContextChange(this._initializeMetadata, this);
				// Indicates the control is initialised and can be used in the initialise event/otherwise!
				this.bIsInitialised = true;
				this._resolveMetadataPromise();
			}
		}
	};


	SmartVariantManagement.prototype.applySettings = function(mSettings) {

		if (!mSettings || !mSettings.hasOwnProperty("useFavorites")) {
			this.setUseFavorites(true);
		}

		if (mSettings && Object.hasOwn(mSettings, "entitySet") && mSettings.entitySet) {
			this._checkEntitySet(mSettings.entitySet);
		}

		SmartVariantManagementBase.prototype.applySettings.apply(this, arguments);
	};

	SmartVariantManagement.prototype._createControlWrapper = function(oCurrentControlInfo) {
		var oControlInfo = null;
		var oControl = Element.getElementById(oCurrentControlInfo.getControl());
		if (oControl) {
			/* eslint-disable new-cap */
			let fnResolve, fnReject;
			const loaded = {
				promise: new SyncPromise((resolve, reject) => {
					fnResolve = resolve;
					fnReject = reject;
				}),
				reject: fnReject,
				resolve: fnResolve
			};
			oControlInfo = {
				control: oControl,
				type: oCurrentControlInfo.getType(),
				dataSource: oCurrentControlInfo.getDataSource(),
				keyName: oCurrentControlInfo.getKeyName(),
				loaded
			};
			/* eslint-enable new-cap */
		}

		return oControlInfo;
	};

	SmartVariantManagement.prototype._getControlWrapper = function(oControl) {
		var aCurrentControls = this._getAllPersonalizableControls();
		if (aCurrentControls && aCurrentControls.length) {
			for (var i = 0; i < aCurrentControls.length; i++) {
				if (aCurrentControls[i].control === oControl) {
					return aCurrentControls[i];
				}
			}
		}

		return null;
	};

	/**
	 * Registers all controls interested and relying on variant handling.
	 * @public
	 * @param {sap.ui.comp.smartvariants.PersonalizableInfo} oCurrentControlInfo Wrapper for the personalizable control
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagement} Current instance
	 */
	SmartVariantManagement.prototype.addPersonalizableControl = function(oCurrentControlInfo) {
		var oControlWrapper, sControlId = oCurrentControlInfo.getControl();

		var oControl = Element.getElementById(sControlId);
		if (!oControl) {
			Log.error("couldn't obtain the control with the id=" + sControlId);
			return this;
		}

		this.addAggregation("personalizableControls", oCurrentControlInfo, true);

		oControlWrapper = this._createControlWrapper(oCurrentControlInfo);
		if (oControlWrapper) {
			this._aPersonalizableControls.push(oControlWrapper);
		}

		if (this.isPageVariant()) {
			return this;
		}

		this.setPersControler(oControl);

		return this;
	};


	SmartVariantManagement.prototype._loadFlex = function() {
		return this.oModel.loadFlex().catch((oError) => {
			Log.error(oError);
		});
	};

	SmartVariantManagement.prototype.setPersControler = function(oControl) {
		if (this.oModel.isFlexLoaded() && this.oModel._isFlexSupported(oControl)) {
			this._oPersoControl = oControl;
			this._handleGetChanges(oControl);
			return;
		}
		if (!this._oPersoControl) {
			this.oModel.isFlexSupported(oControl).then((bFlexSupported) => {
				if (bFlexSupported) {
					this._oPersoControl = oControl;
					this._handleGetChanges(oControl);
				}
			});
		}
	};

	SmartVariantManagement.prototype.setPersistencyKey = function(sKey) {
		this.setProperty("persistencyKey", sKey);

		this.setPersControler(this);
		return this;
	};

	/**
	 * Determines if the <code>SmartVariantManagement</code> instance is a page variant.
	 * @public
	 * @return {boolean} <code>true</code> if it is a page variant, otherwise <code>false</code>
	 */
	SmartVariantManagement.prototype.isPageVariant = function() {
		if (this.getPersistencyKey()) {
			return true;
		}

		return false;
	};

	SmartVariantManagement.prototype._getAdapter = function() {
		return this._oAdapter;
	};

	SmartVariantManagement.prototype._handleGetChanges = function (oControl) {

		if (!oControl || !this.oModel.isFlexLoaded()) {
			return;
		}

		this._oControlPromise = new Promise((resolve, reject) => {
			Promise.all([this._getStandardVariantItemName(), this._oMetadataPromise]).then((args) => {
				if (this._bIsBeingDestroyed) {
					return;
				}

				const sStandardName = args[0];

				var mPropertyBag = {
					control: this._oPersoControl,
					standardVariant: {
						id: this.STANDARDVARIANTKEY,
						name: sStandardName,
						executeOnSelection: this.bExecuteOnSelectForStandardViaXML
					}
				};

				if (this._getAdapter()) {
					mPropertyBag.variants = this._getAdapter().getODataVariants();
				} else {
					/**
					 * @deprecated As of version 1.127.0, the concept has been discarded.
					 **/
					if (this._getFilterBarAdapter()) {
						mPropertyBag.variants = this._getFilterBarAdapter().variants;
					}
				}

				this.oModel.loadVariants(mPropertyBag, resolve, reject);
			});
		});
	};

	/**
	 * @deprecated As of version 1.127.0, the concept has been discarded.
	 */
	SmartVariantManagement.prototype._getFilterBarAdapter = function() {
		return (this._oSelectionVariantHandler["#"]);
	};

	SmartVariantManagement.prototype._getVariantById = function(sKey) {

		if (this._mVariants && this._mVariants[sKey]) {
			return this._mVariants[sKey];
		}

		return null;
	};

	/**
	 * Retrieves the variant content.
	 * @public
	 * @param {sap.ui.core.Control} oControl Current personalizable control
	 * @param {string} sKey The variant key
	 * @returns {object} JSON Representing the content of the variant
	 */
	SmartVariantManagement.prototype.getVariantContent = function(oControl, sKey) {
		var sPersKey, oContent = this._getVariantContent(sKey);

		if (oContent && this.isPageVariant() && oControl) {
			sPersKey = this._getControlPersKey(oControl);
			if (sPersKey) {
				oContent = this._retrieveContent(oContent, sPersKey);
			}
		}

		return oContent;
	};


	SmartVariantManagement.prototype._getContent = function(oVariant) {
		return oVariant.getContent();
	};
	/*
	 * Retrieves the content of a variant.
	 * @private
	 * @ui5-restricted sap.ui.comp, sap.ui.rta
	 * @returns {object} The content of a variant or <code>null</code>
	 */
	SmartVariantManagement.prototype._getVariantContent = function(sKey) {
		var oVariant = this._getVariantById(sKey);
		if (oVariant) {
			var oContent = this._getContent(oVariant);
			if (oContent) {
				if ((sKey === this.STANDARDVARIANTKEY) && (Object.keys(oContent).length < 1)) {
					oContent = this.getStandardVariant();
				}

				return merge({}, oContent);
			}
		}

		return null;
	};

	/**
	 * Returns all registered providers.
	 * @private
	 * @returns {array} a list of all registered controls
	 */
	SmartVariantManagement.prototype._getAllPersonalizableControls = function() {
		return this._aPersonalizableControls;
	};

	/**
	 * Removes all registered personalizable controls.
	 * @public
	 */
	SmartVariantManagement.prototype.removeAllPersonalizableControls = function() {
		this.removeAllAggregation("personalizableControls");
		this._aPersonalizableControls = [];
	};

	/**
	 * Removes a registered personalizable control.
	 * @public
	 * @param {sap.ui.comp.smartvariants.PersonalizableInfo} oCurrentControlInfo Wrapper for the personalizable control
	 * @returns {sap.ui.comp.smartvariants.PersonalizableInfo} Removed wrapper for the personalizable control
	 */
	SmartVariantManagement.prototype.removePersonalizableControl = function(oCurrentControlInfo) {

		var oPersonalizableInfo = this.removeAggregation("personalizableControls", oCurrentControlInfo);

		if (oPersonalizableInfo) {

			this._aPersonalizableControls.some((oPerso, index) => {
				if (oPerso.control.getId() === oPersonalizableInfo.getControl()) {
					this._aPersonalizableControls.splice(index, 1);
					return true;
				}

				return false;
			});
		}

		return oPersonalizableInfo;
	};

	/**
	 * Removes a registered personalizable control.
	 * @public
	 * @param {sap.ui.core.Control} oControl the personalizable control
	 */
	SmartVariantManagement.prototype.removePersonalizableControlById = function(oControl) {

		var aPersonalizableControls = this.getAggregation("personalizableControls");

		if (aPersonalizableControls) {

			aPersonalizableControls.some((oPerso, index) => {
				if (oPerso.getControl() === oControl.getId()) {
					this.removePersonalizableControl(oPerso);
					return true;
				}

				return false;
			});

		}
	};

	SmartVariantManagement.prototype._createVariantItem = function(oVariant) {
		try {
			const mViewData = {
				key: oVariant.getVariantId(),
				title: oVariant.getName(),
				sharing: oVariant.isUserDependent() ? "private" : "public",
				remove: oVariant.isDeleteEnabled(),
				favorite: oVariant.getFavorite(),
				executeOnSelect: oVariant.getExecuteOnSelection(),
				rename: oVariant.isRenameEnabled(),
				visible: true,
				changeable: oVariant.isEditEnabled(),
				author: oVariant.getAuthor(),
				contexts: oVariant.getContexts()
			};

			this._mVariants[oVariant.getVariantId()] = oVariant;

			this._insertVariantItem(oVariant, mViewData);
		} catch (ex) {
			Log.error(ex.message);
		}
	};

	/**
	 * Creates entries into the variant management control, based on the list of variants.
	 * @private
	 * @param {map} mVariants list of variants, as determined by the flex layer
	 */
	SmartVariantManagement.prototype._createVariantEntries = function(mVariants) {
		//this.removeAllVariantItems();

		if (mVariants) {
			if (mVariants.defaultVariantId) {
				this._setDefaultVariantKey(mVariants.defaultVariantId, false);
			}

			if (mVariants.standardVariant) {
				this._createVariantItem(mVariants.standardVariant);
				var oContent = this._getVariantContent(mVariants.standardVariant.getVariantId());
				if (Object.keys(oContent).length > 0) {
					this._sAppStandardVariantKey = mVariants.standardVariant.getVariantId();
					if (this._sAppStandardVariantKey !== this.STANDARDVARIANTKEY) {
						this.setStandardVariantKey(this._sAppStandardVariantKey);
					}
				}
			}

			if (mVariants.variants) {
				mVariants.variants.forEach((oVariant) => {
					this._createVariantItem(oVariant);
				});
			}

			//this._checkUpdate();
			this.resolveTitleBindings();
		}
	};


	/**
	 * @param {object[]} aFavorites - Format: {key: {string}, visible: {boolean}}
	 * @private
	 */
	SmartVariantManagement.prototype._addFavorites = function(aFavorites) {
		aFavorites.forEach((oEntry) => {
			if (oEntry.key !== this.STANDARDVARIANTKEY) {
				var oVariant = this._getVariantById(oEntry.key);
				if (oVariant) {
					this._flUpdateVariant(oVariant, { favorite: oEntry.visible });
					this._updateView(oEntry.key, "favorite", oEntry.visible);
				}
			}
		});
	};

	SmartVariantManagement.prototype._flUpdateVariant = function(oVariant, mProperties) {
		return this.oModel.flUpdateVariant(oVariant, mProperties, this._oPersoControl);
	};


	SmartVariantManagement.prototype._flRemoveVariant = function(oVariant) {
		var mParameters = {
			control: this._oPersoControl,
			id: oVariant.getVariantId(),
			layer: oVariant.getLayer()
		};

		var oDeletedVariant = this.oModel._flWriteRemoveVariant(mParameters);
		if (oDeletedVariant) {
			delete this._mVariants[oDeletedVariant.getVariantId()];   // update
		}
	};

	SmartVariantManagement.prototype.flWriteOverrideStandardVariant = function(bFlag) {
		this.oModel.flWriteOverrideStandardVariant(bFlag, this._oPersoControl);
	};


	/**
	 * Retrieves the current variant ID. For a standard variant, an empty string is returned.
	 * @public
	 * @since 1.28.1
	 * @returns {string} Current variant ID
	 */
	SmartVariantManagement.prototype.getCurrentVariantId = function() {

		if (this._bDuringVariantCreation) {
			return "SV1656651501366";
		}

		var sKey = this.getCurrentVariantKey();
		if (sKey === this.STANDARDVARIANTKEY) {
			sKey = "";
		}

		return sKey;
	};

	/**
	 * Removes the current variant selection and resets to Standard.
	 * Note: this method only set the variant title to Standard; it does not trigger a view selection change and does not change the modify indicator.
	 * In case this is required, please use the corresponding method <code>setCurrentVariantId</code>.
	 * @public
	 * @since 1.22.0
	 */
	SmartVariantManagement.prototype.clearVariantSelection = function() {
		this.setSelectionKey(this.getStandardVariantKey());
	};

	/**
	 * Sets the current variant ID.
	 * @public
	 * @since 1.28.1
	 * @param {string} sVariantId ID of the variant
	 * @param {boolean} bDoNotApplyVariant If set to <code>true</code>, the <code>applyVariant</code> method is not executed yet.
	 */
	SmartVariantManagement.prototype.setCurrentVariantId = function(sVariantId, bDoNotApplyVariant) {
		var sId;

		if (this._oPersoControl) {
			sId = this._determineVariantId(sVariantId);

			this.setCurrentVariantKey(sId);

			if (this._oStandardVariant) {
				this.setModified(false);
				if (!bDoNotApplyVariant) {
					this._triggerSelectVariant(sId, "SET_VM_ID");
				}
			}
		}
	};

	SmartVariantManagement.prototype._determineVariantId = function(sVariantId) {
		var sId = sVariantId;
		if (!sId || !this.getItemByKey(sId)) {
			sId = this.getStandardVariantKey();
		}

		return sId;
	};

	/**
	 * Initializes the control by retrieving the variants from SAPUI5 flexibility. Once the initialization has been completed, the
	 * controls for personalization are notified via the <code>initialise</code> event.
	 * @public
	 * @param {function} fCallback Function will be called whenever the data for the personalizable control is received
	 * @param {sap.ui.core.Control} oPersoControl Current control that can be personalized
	 */
	SmartVariantManagement.prototype.initialise = function(fCallback, oPersoControl) {
		var oCurrentControlWrapper, sError;

		try {

			if (oPersoControl && fCallback) {
				oCurrentControlWrapper = this._getControlWrapper(oPersoControl);
				if (!oCurrentControlWrapper) {
					Log.error("initialise on an unknown control.");
					return;
				}

				if (oCurrentControlWrapper.bInitialized) {
					Log.error("initialise on " + oPersoControl.getId() + " already executed");
					return;
				}

				oCurrentControlWrapper.fInitCallback = fCallback;

			} else if (!this.isPageVariant()) {
				oCurrentControlWrapper = this._getControlWrapper(this._oPersoControl);
			}

			const oPersistencyPromise = this.oModel.getPersistencyPromise();
			if (!oPersistencyPromise) {
				this._errorHandling("'initialise' no '_oPersistencyPromise'  available", fCallback, oPersoControl);
				return;
			}

			return oPersistencyPromise.then(() => {
				if (!this._oControlPromise || !this._oPersoControl || !oCurrentControlWrapper) {
					this._errorHandling("'initialise' no personalizable component available", fCallback, oPersoControl);
					return;
				}

				Promise.all([this._oMetadataPromise, this._oControlPromise, ...this.oModel.retrieveDataFromFlex()]).then((aVariants) => {
					const [
							/*vMetadata*/, // skip vMetadata as it's currently not used
						mVariants,
						bIsVariantSharingEnabled,
						bIsVariantPersonalizationEnabled,
						bIsVariantAdaptationEnabled
					] = aVariants;
					this._dataReceived(mVariants, bIsVariantSharingEnabled, bIsVariantPersonalizationEnabled, bIsVariantAdaptationEnabled, oCurrentControlWrapper);

				}, (args) => {
					sError = "'loadVariants' failed:";
					if (args && args.message) {
						sError += (' ' + args.messages);
					}

					this._errorHandling(sError, fCallback, oPersoControl);
				}, (args) => {
					if (args && args.message) {
						sError = args.message;
					} else {
						sError = "accessing either flexibility functionality or odata metadata.";
					}
					this._errorHandling("'initialise' failed: " + sError, fCallback, oPersoControl);
				});
			}).catch((oError) => {
				if (oError && oError.message) {
					sError = oError.message;
				} else {
					sError = "accessing the flexibility functionality.";
				}
				this._errorHandling("'initialise' failed: " + sError, fCallback, oPersoControl);
			});
		} catch (ex) {
			this._errorHandling("exception occurs during 'initialise' processing", fCallback, oPersoControl);
		}
	};

	SmartVariantManagement.prototype._errorHandling = function(sErrorText, fCallback, oPersoControl) {
		var parameter = {
			variantKeys: []
		};

		this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"), sErrorText);

		if (fCallback && oPersoControl) {
			fCallback.call(oPersoControl);
		} else {
			/**
			 * @deprecated As of version 1.38.0, the concept has been discarded.
			 */
			this.fireEvent("initialise", parameter);  //TODO: remove deprecated event
		}

		if (oPersoControl.variantsInitialized) {
			oPersoControl.variantsInitialized();
		}

		this.setInErrorState(true);
	};

	SmartVariantManagement.prototype.isVariantAdaptationEnabled = function() {
		return this._bIsVariantAdaptationEnabled;
	};

	SmartVariantManagement.prototype._dataReceived = function(mVariants, bIsVariantSharingEnabled, bIsVariantCreationEnabled, bIsVariantAdaptationEnabled, oCurrentControlWrapper) {
		var oDefaultVariant, sKey, parameter = {
			variantKeys: []
		};

		if (this._bIsBeingDestroyed) {
			return;
		}

		if (!this._bIsInitialized) {

			this._bIsVariantAdaptationEnabled = bIsVariantAdaptationEnabled;

			this.setVariantCreationByUserAllowed(bIsVariantCreationEnabled);

			this.setShowShare(bIsVariantSharingEnabled);

			this._bIsInitialized = true;

			this._createVariantEntries(mVariants);

			sKey = this._getDefaultVariantKey();
			if (!sKey || (!this._getVariantById(sKey) && sKey.substring(0, 1) !== "#")) {
				sKey = this.getStandardVariantKey();
			}

			oDefaultVariant = this._getVariantById(sKey);
			if (oDefaultVariant) {
				this.setDefaultVariantKey(sKey); // set the default variant
				this.setSelectionKey(sKey); // set the current selected variant
			}

			if (this._sAppStandardVariantKey) {
				this._oAppStdContent = this._getVariantContent(this._sAppStandardVariantKey);
			}
		}
		this._initialize(parameter, oCurrentControlWrapper);
	};

	SmartVariantManagement.prototype._initialize = function(parameter, oCurrentControlWrapper) {

		var sKey, oContent = null, bIsPageVariant = this.isPageVariant();
		var oVariant, bExecuteOnSelection = false;

		if (this._oAppStdContent) {
			if ((oCurrentControlWrapper.type === "table") || (oCurrentControlWrapper.type === "chart")) {
				if (bIsPageVariant) {
					this._applyControlVariant(oCurrentControlWrapper.control, this._oAppStdContent, "STANDARD", true);
				} else {
					this._applyVariant(oCurrentControlWrapper.control, this._oAppStdContent, "STANDARD", true);
				}
			}
		}

		if (oCurrentControlWrapper.fInitCallback) {
			oCurrentControlWrapper.fInitCallback.call(oCurrentControlWrapper.control);
			delete oCurrentControlWrapper.fInitCallback;
			oCurrentControlWrapper.bInitialized = true;
		} else /** @deprecated the concept has been discarded */ {
			parameter.variantKeys = Object.keys(this._mVariants);
			this.fireEvent("initialise", parameter);  //TODO: remove deprecated event
		}

		sKey = this.getCurrentVariantKey();
		if (sKey && (sKey !== this.getStandardVariantKey())) {
			oContent = this._getVariantContent(sKey);
			oVariant = this._getVariantById(sKey);
			if (oVariant) {
				bExecuteOnSelection = oVariant.getExecuteOnSelection();
			}
		} else if (this._oAppStdContent) {
			oContent = this._oAppStdContent;

			if ((oCurrentControlWrapper.type === "table") || (oCurrentControlWrapper.type === "chart")) {
				// chart and table are already applied with with STANDARD context
				oContent = null;
			}
		}

		if (this._sAppStandardVariantKey) {
			this._updateStandardVariant(oCurrentControlWrapper, this._oAppStdContent);
		} else {
			this._setStandardVariant(oCurrentControlWrapper);
		}

		try {
			oCurrentControlWrapper.loaded.resolve();

			if (oContent) {
				if (this._getAdapter() && (sKey.substring(0, 1) === "#") && (Object.entries(oContent).length === 0)) {
					this._applyUiState(sKey, "INIT", bExecuteOnSelection);
				} else if (bIsPageVariant) {
					this._applyControlVariant(oCurrentControlWrapper.control, oContent, "INIT", true, bExecuteOnSelection);
				} else {
					this._applyVariant(oCurrentControlWrapper.control, oContent, "INIT", true, bExecuteOnSelection);
				}
			}

			if (this.bConsiderXml !== undefined) {
				this._executeOnSelectForStandardVariantByXML(this.bConsiderXml);
			}

			if (oCurrentControlWrapper.control.variantsInitialized) {
				oCurrentControlWrapper.control.variantsInitialized();
			}


			if (this.getCurrentVariantKey() === this.getStandardVariantKey()) {
				if (this._getApplyAutomaticallyOnStandardVariant() && oCurrentControlWrapper.control.search) {
					oCurrentControlWrapper.control.search();
				}

				if (this.getExecuteOnSelectForStandardVariant() && this._oAppStdContent) {
					var oItem = this.getItemByKey(this.getCurrentVariantKey());
					if (oItem) {
						oItem.setExecuteOnSelect(true);
					}
				}
			}

			if (!this.getEnabled()) {
				this.setEnabled(true);
			}
		} catch (oException) {
			Log.error("'_initialize' throws an exception:" + oException.message);
		}
	};


	SmartVariantManagement.prototype._updateVariant = function(oVariantInfo) {

		return SyncPromise.resolve(this._fetchContentAsync()).then((oContent) => {

			if (oVariantInfo.key !== this.getStandardVariantKey()) {

				var oVariant = this._getVariantById(oVariantInfo.key);
				if (oVariant) {

					if (oContent) {

						var oItem = this.getItemByKey(oVariantInfo.key);

						var mParameters = {
							content: oContent
						};

						if (oVariant.getPackage()) {
							mParameters.transportId = oVariant.getPackage();
						}

						if (oVariant.getRequest()) {
							mParameters.packageName = oVariant.getRequest();
						}

						if (oItem) {
							mParameters.executeOnSelection = oItem.getExecuteOnSelect();
						}

						this._flUpdateVariant(oVariant, mParameters);

						if (oVariantInfo.def === true) {
							this._setDefaultVariantKey(oVariantInfo.key);
						}
					}

					this._afterSave(oVariantInfo, false);
				}
			}

		}).catch((oException) => {
			Log.error("'_updateVariant' throws an exception:" + oException.message);
		}).unwrap();
	};

	SmartVariantManagement.prototype._createChangeHeader = function() {

		if (this.isPageVariant()) {
			return {
				type: "page",
				dataService: "n/a"
			};
		}

		var aCurrentControls = this._getAllPersonalizableControls();
		if (aCurrentControls && aCurrentControls.length > 0) {
			return {
				type: aCurrentControls[0].type,
				dataService: aCurrentControls[0].dataSource
			};
		}

	};

	SmartVariantManagement.prototype._newVariant = function(oVariantInfo) {

		this._bDuringVariantCreation = true;

		return SyncPromise.resolve(this._fetchContentAsync()).then((oContent) => {

			var oTypeDataSource = this._createChangeHeader();

			var mParams = {
				type: oTypeDataSource.type,
				ODataService: oTypeDataSource.dataSource,
				texts: { variantName: oVariantInfo.name },
				content: oContent,
				isVariant: true,
				isUserDependent: !oVariantInfo.public,
				executeOnSelection: oVariantInfo.execute
			};

			var oVariant = this.oModel._flWriteAddVariant({
				control: this._oPersoControl,
				changeSpecificData: mParams
			});

			if (oVariant) {

				var sId = oVariant.getVariantId();
				this._mVariants[sId] = oVariant;

				const oUpdatedVariant = this._flUpdateVariant(oVariant, { favorite: true });
				if (oUpdatedVariant) {
					this._mVariants[oUpdatedVariant.getVariantId()] = oUpdatedVariant;
				}

				this._createVariantItem(oVariant);
				this.setSelectionKey(sId);

				this._bDuringVariantCreation = false;

				if (oVariantInfo.def === true) {
					this._setDefaultVariantKey(sId);
					this.setDefaultVariantKey(sId);
				}

				this._afterSave(oVariantInfo, true);
			}

		}).catch((oException) => {
			this._bDuringVariantCreation = false;
			Log.error("'_newVariant' throws an exception:" + oException.message);
		}).unwrap();
	};


	SmartVariantManagement.prototype._fetchContent = function() {

		var oCurrentControlInfo, sPersKey, oContent, oControlContent = {};

		var aCurrentControls = this._getAllPersonalizableControls();

		for (var i = 0; i < aCurrentControls.length; i++) {

			oCurrentControlInfo = aCurrentControls[i];

			if (oCurrentControlInfo && oCurrentControlInfo.control && oCurrentControlInfo.control.fetchVariant) {

				oContent = oCurrentControlInfo.control.fetchVariant();
				if (oContent) {
					oContent = merge({}, oContent);

					if (this.isPageVariant()) {

						sPersKey = this._getControlPersKey(oCurrentControlInfo);
						if (sPersKey) {
							// oControlContent[sPersKey] = oContent;
							oControlContent = this._assignContent(oControlContent, oContent, sPersKey);
						} else {
							Log.error("no persistancy key retrieved");
						}

					} else {
						oControlContent = oContent;
						break;
					}
				}

			}
		}

		return oControlContent;

	};

	// TODO: check this
	SmartVariantManagement.prototype._fetchContentAsync = function() {

		var oCurrentControlInfo, sPersKey, oContent, oControlContent = {}, aFetchPromise = [], aCurrentControlInfo = [];

		var aCurrentControls = this._getAllPersonalizableControls();

		for (var i = 0; i < aCurrentControls.length; i++) {

			oCurrentControlInfo = aCurrentControls[i];

			if (oCurrentControlInfo && oCurrentControlInfo.control && oCurrentControlInfo.control.fetchVariant) {

				oContent = oCurrentControlInfo.control.fetchVariant();
				if (oContent) {

					if (oContent && oContent instanceof Promise) {
						this.setEnabled(false);
						aFetchPromise.push(oContent);
						aCurrentControlInfo.push(oCurrentControlInfo);
						continue;
					}

					oContent = merge({}, oContent);

					if (this.isPageVariant()) {

						sPersKey = this._getControlPersKey(oCurrentControlInfo);
						if (sPersKey) {
							oControlContent = this._assignContent(oControlContent, oContent, sPersKey);
						} else {
							Log.error("no persistancy key retrieved");
						}

					} else {
						oControlContent = oContent;
						break;
					}
				}
			}
		}


		if (aFetchPromise.length > 0) {

			var fResolve = null;

			var oPromise = new Promise((resolve, failure) => {
				fResolve = resolve;
			});

			Promise.all(aFetchPromise).then((aContent) => {
				for (var i = 0; i < aContent.length; i++) {

					oContent = merge({}, aContent[i]);

					if (this.isPageVariant()) {

						sPersKey = this._getControlPersKey(aCurrentControlInfo[i]);
						if (sPersKey) {
							oControlContent = this._assignContent(oControlContent, oContent, sPersKey);
						} else {
							Log.error("no persistancy key retrieved");
						}

					} else {
						oControlContent = oContent;
						break;
					}
				}

				fResolve(oControlContent);
			});

			return oPromise;
		} else {
			return oControlContent;
		}

	};

	SmartVariantManagement.prototype._getControlInfoPersKey = function(oControlInfo) {
		var sPersKey = null;
		if (oControlInfo.keyName === "id") {
			sPersKey = oControlInfo.control.getId();
		} else {
			sPersKey = oControlInfo.control.getProperty(oControlInfo.keyName);
		}

		return sPersKey;
	};

	SmartVariantManagement.prototype._getControlPersKey = function(oControlOrWrapper) {
		var oControlWrapper = oControlOrWrapper;

		if (!oControlOrWrapper.keyName) { // is a Control
			oControlWrapper = this._getControlWrapper(oControlOrWrapper);
		}

		return this._getControlInfoPersKey(oControlWrapper);
	};


	SmartVariantManagement.prototype._appendLifecycleInformation = function(oVariant, sId) {

		var sTransportId;

		if (oVariant) {
			sTransportId = oVariant.getRequest();
			if (sTransportId === null || sTransportId === undefined) {
				sTransportId = "";
			}
		}

		return sTransportId;
	};

	SmartVariantManagement.prototype._renameVariant = function(oVariantInfo) {

		if (oVariantInfo.key !== this.getStandardVariantKey()) {
			if (oVariantInfo) {
				var oVariant = this._getVariantById(oVariantInfo.key);
				if (oVariant) {
					var mParameters = {
						name: oVariantInfo.name
					};

					var sTransportId = this._appendLifecycleInformation(oVariant, oVariantInfo.key);
					if (sTransportId != undefined) {
						mParameters.transportId = sTransportId;
					}
					this._flUpdateVariant(oVariant, mParameters);

					this._reorderList(oVariantInfo.key, oVariantInfo.name);
				}
			}
		}
	};

	SmartVariantManagement.prototype._deleteVariants = function(aVariantInfo) {
		var sTransportId;
		var sDefaultKey = this._getDefaultVariantKey();
		var sCurrentSelectedKey = this.getCurrentVariantKey();

		if (aVariantInfo && aVariantInfo.length) {
			for (var i = 0; i < aVariantInfo.length; i++) {
				var sVariantKey = aVariantInfo[i];
				var oVariant = this._getVariantById(sVariantKey);
				if (oVariant) {
					sTransportId = this._appendLifecycleInformation(oVariant, sVariantKey);
					oVariant.setRequest(sTransportId);
					this._flRemoveVariant(oVariant);

					var oVariantItem = this.getItemByKey(sVariantKey);
					if (oVariantItem) {
						this._removeViewItem(oVariantItem.getKey());
						this.removeVariantItem(oVariantItem);
					}

					if (sDefaultKey && (sDefaultKey === sVariantKey)) {
						this._setDefaultVariantKey("");
					}

					if (sVariantKey === sCurrentSelectedKey) {
						this.setModified(false);
						this.setCurrentVariantKey(this.STANDARDVARIANTKEY);
						this._selectVariant(this.STANDARDVARIANTKEY);
					}
				}
			}
		}
	};

	//overwrites the corresponding VM method
	SmartVariantManagement.prototype._executeOnSelectForStandardVariantByXML = function(bSelect) {

		// has to be set immediately, to support legacy behavior: BCP: 2170116029
		SmartVariantManagementBase.prototype._executeOnSelectForStandardVariantByXML.apply(this, arguments);

		this._reapplyExecuteOnSelectForStandardVariant(bSelect);
	};

	SmartVariantManagement.prototype._reapplyExecuteOnSelectForStandardVariant = function(bSelect) {

		if (Object.keys(this._mVariants).length > 0) {
			this.bConsiderXml = undefined;

			this.flWriteOverrideStandardVariant(bSelect);

			var sStdKey = this.getStandardVariantKey();
			var oVariant = this._getVariantById(sStdKey);
			if (oVariant) {
				var oStandardVariantItem = this.getItemByKey(sStdKey);
				if (oStandardVariantItem) {
					oStandardVariantItem.setExecuteOnSelect(oVariant.getExecuteOnSelection());
					this._reapplyExecuteOnSelectForStandardVariantItem(oVariant.getExecuteOnSelection());
				}
			}
		} else {
			this.bConsiderXml = bSelect;
		}
	};


	/**
	 * Allows the FE-based applications to set the 'apply automatically' behavior for the standard variant.
	 * If 'apply automatically' end-user changes for the standard variant exists, they will be reapplied, after the setting.
	 * So, basically existing end-user changes always overwrite the intention.
	 *
	 * @private
	 * @ui5-restricted sap.ui.generic
	 * @param {boolean} bSelect defines the 'apply automatically' intention for the standard variant
	 */
	SmartVariantManagement.prototype.setExecuteOnStandard = function(bSelect) {
		this._reapplyExecuteOnSelectForStandardVariant(bSelect);
	};

	/**
	 * Returns the current 'apply automatically' behavior for the standard variant.
	 * If called before the variants are completely initialized <code>undefined</code> is returned.
	 *
	 * @private
	 * @ui5-restricted sap.ui.generic
	 * @returns {boolean | undefined} The 'apply automaticaly' state of the standard variant.
	 */
	SmartVariantManagement.prototype.getExecuteOnStandard = function() {
		var sStdKey = this.getStandardVariantKey();

		var oStandardVariantItem = this.getItemByKey(sStdKey);
		if (oStandardVariantItem) {
			return oStandardVariantItem.getExecuteOnSelect();
		}

		return undefined;
	};

	SmartVariantManagement.prototype._getApplyAutomaticallyOnStandardVariant = function() {

		var bExecuteOnSelection = this.getExecuteOnSelectForStandardVariant();

		if (this._fRegisteredApplyAutomaticallyOnStandardVariant && this.getDisplayTextForExecuteOnSelectionForStandardVariant()) {
			try {
				bExecuteOnSelection = this._fRegisteredApplyAutomaticallyOnStandardVariant();
			} catch (ex) {
				Log.error("callback for determination of apply automatically on standard variant failed");
			}
		}

		return bExecuteOnSelection;
	};

	SmartVariantManagement.prototype._getDefaultVariantKey = function() {
		return this.oModel._getDefaultVariantId();
	};

	SmartVariantManagement.prototype._setDefaultVariantKey = function(sVariantKey, bCreateFlexChange = true) {
		return this.oModel._setDefaultVariantId(sVariantKey, bCreateFlexChange ? this._oPersoControl : undefined);
	};

	SmartVariantManagement.prototype._setExecuteOnSelections = function(aVariantInfo) {

		if (aVariantInfo && aVariantInfo.length) {

			for (var i = 0; i < aVariantInfo.length; i++) {
				var oVariant = this._getVariantById(aVariantInfo[i].key);
				if (oVariant) {
					var sKey = aVariantInfo[i].key;

					this._flUpdateVariant(oVariant, { executeOnSelection: aVariantInfo[i].exe });
					this._updateView(sKey, "executeOnSelect", aVariantInfo[i].exe);
				}
			}
		}
	};

	/**
	 * Save all variants.
	 * @private
	 * @param {boolean} bNewVariant indicates, if the save was triggered after new variant creation
	 * @param {boolean} bIgnoreVariantHandling indicates, if the save was triggered after new variant creation
	 */
	SmartVariantManagement.prototype._save = function(bNewVariant, bIgnoreVariantHandling) {
		if (this.oModel.isFlexLoaded()) {
			try {
				this.oModel.save(this._oPersoControl).then(() => {
					if (!bIgnoreVariantHandling) {

						if (bNewVariant) {
							this._updateUser();
						}
						this.fireEvent("afterSave");
					}

				}).catch((oException) => {
					var sError = "'_save' failed:";
					if (oException && oException.message) {
						sError += (' ' + oException.message);
					}
					this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE_FAILED"), sError);
				});
			} catch (oException) {
				this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE_FAILED"), "'_save' throws an exception");
			}
		}
	};

	SmartVariantManagement.prototype._updateUser = function() {
		var sId = this.getInitialSelectionKey();
		var sUserName, oVariant = this._getVariantById(sId);
		if (oVariant) {
			sUserName = oVariant.getAuthor();
			if (sUserName) {
				this._assignUser(sId, sUserName);
			}
		}
	};

	/**
	 * Eventhandler for the save event of the <code>SmartVariantManagement</code> control.
	 * @param {object} oVariantInfo Describes the variant to be saved
	 */
	SmartVariantManagement.prototype.fireSave = function(oVariantInfo) {
		var oEvent = {};

		if (oVariantInfo) {
			if (oVariantInfo.hasOwnProperty("tile")) {
				oEvent.tile = oVariantInfo.tile;
			}
			oEvent.name = oVariantInfo.name;

			if (oVariantInfo.overwrite) {
				if (oVariantInfo.key !== this.getStandardVariantKey()) { // Prohibit save on standard variant
					this.fireEvent("save", oEvent);
					if (oVariantInfo.key === this.STANDARDVARIANTKEY) {
						this._newVariant(oVariantInfo);
					} else {
						this._updateVariant(oVariantInfo);
					}
				}
			} else {
				this.fireEvent("save", oEvent);
				this._newVariant(oVariantInfo);
			}
		}
	};

	SmartVariantManagement.prototype._afterSave = function(oVariantInfo, bSaveState) {
		//		var oEvent = {};
		//
		//		if (oVariantInfo.hasOwnProperty("tile")) {
		//			oEvent.tile = oVariantInfo.tile;
		//		}
		//		oEvent.name = oVariantInfo.name;
		//
		//		this.fireEvent("save", oEvent);

		this.setEnabled(true);

		this.setModified(false);

		this._save(bSaveState);
	};


	/**
	 * Eventhandler for the manage event of the <code>SmartVariantManagement</code> control. Raises the base class event for spacial handlings like
	 * save tile.
	 * @param {object} oVariantInfo Describes the variants that will be deleted/renamed
	 */
	SmartVariantManagement.prototype.fireManage = function(oVariantInfo) {

		var i, bDefaultChanged = false;

		if (oVariantInfo) {

			if (oVariantInfo.renamed) {

				for (i = 0; i < oVariantInfo.renamed.length; i++) {
					this._renameVariant(oVariantInfo.renamed[i]);
				}
			}

			if (oVariantInfo.deleted) {
				this._deleteVariants(oVariantInfo.deleted);
			}

			if (oVariantInfo.exe) {
				this._setExecuteOnSelections(oVariantInfo.exe);
			}

			if (oVariantInfo.def) {

				var sDefaultVariantKey = this._getDefaultVariantKey();
				if (sDefaultVariantKey !== oVariantInfo.def) {
					if (!((sDefaultVariantKey === "") && (oVariantInfo.def === this.STANDARDVARIANTKEY))) {
						this._setDefaultVariantKey(oVariantInfo.def);
						this.setDefaultVariantKey(oVariantInfo.def);
						bDefaultChanged = true;
					}
				}
			}

			if (oVariantInfo.fav && (oVariantInfo.fav.length > 0)) {
				this._addFavorites(oVariantInfo.fav);
			}

			this._checkUpdate();

			if ((oVariantInfo.deleted && oVariantInfo.deleted.length > 0) || (oVariantInfo.renamed && oVariantInfo.renamed.length > 0) || (oVariantInfo.exe && oVariantInfo.exe.length > 0) || bDefaultChanged) {
				this._save();
			} else if (oVariantInfo.fav && (oVariantInfo.fav.length > 0)) {
				this._save(false, true);
			}

			this.fireEvent("manage", oVariantInfo);
		}

	};

	/**
	 * Eventhandler for the select event of the <code>SmartVariantManagement</code> control.
	 * @param {object} oVariantInfo Describes the selected variant
	 * @param {string} sContext context
	 */
	SmartVariantManagement.prototype.fireSelect = function(oVariantInfo, sContext) {

		if (this._oPersoControl && oVariantInfo && oVariantInfo.key) {
			this._triggerSelectVariant(oVariantInfo.key, sContext);

			this.fireEvent("select", oVariantInfo);
		}
	};

	SmartVariantManagement.prototype._selectVariant = function(sVariantKey, sContext) {
		this.setModified(false);
		this.fireSelect({
			key: sVariantKey
		}, sContext);
	};

	/**
	 * @deprecated As of version 1.127.0, the concept has been discarded.
	 **/
	SmartVariantManagement.prototype._checkForSelectionHandler = function(sVariantKey) {

		var oHandler = null, aHandler = Object.keys(this._oSelectionVariantHandler);

		if (aHandler.length > -1) {

			aHandler.some((oKey) => {
				if (sVariantKey.indexOf(oKey) === 0) {
					oHandler = this._oSelectionVariantHandler[oKey];
					return true;
				}

				return false;
			});

		}

		return oHandler;
	};

	SmartVariantManagement.prototype._triggerSelectVariant = function(sVariantKey, sContext) {

		var bExecuteOnSelection, oContent, bHasOwnContent = false;
		/**
		 * @ui5-transform-hint (1.127) replace-local undefined
		 **/
		var oHandler = this._checkForSelectionHandler(sVariantKey);

		var oVariant = this._getVariantById(sVariantKey);
		if (oVariant) {
			bExecuteOnSelection = oVariant.getExecuteOnSelection();

			if (sVariantKey === this.getStandardVariantKey()) {
				bExecuteOnSelection = this._getApplyAutomaticallyOnStandardVariant();
			}

			bHasOwnContent = (Object.entries(this._getContent(oVariant)).length === 0) ? false : true;
		}

		if (bHasOwnContent) {
			oContent = this._getGeneralSelectVariantContent(sVariantKey, sContext);
		} else if (this._getAdapter() && (sVariantKey.substring(0, 1) === "#")) { // handling of SelectionPresentationVariant
			this._applyUiState(sVariantKey, "SPV_VARIANT", bExecuteOnSelection);
			return;
		} else if (oHandler) {
			oContent = this._getSpecialSelectVariantContent(sVariantKey, sContext, oHandler); // handling for SelectionVariant
		} else {
			oContent = this._getGeneralSelectVariantContent(sVariantKey, sContext);
		}


		if (oContent) {
			if (this.isPageVariant()) {
				this._applyVariants(oContent, sContext, bExecuteOnSelection);
			} else {
				this._applyVariant(this._oPersoControl, oContent, sContext, false, bExecuteOnSelection);
			}
		}
	};

	/**
	* @deprecated As of version 1.127.0, the concept has been discarded.
	**/
	SmartVariantManagement.prototype._getSpecialSelectVariantContent = function(sVariantKey, sContext, oHandler) {
		return oHandler.callback.call(oHandler.handler, sVariantKey, sContext);
	};

	SmartVariantManagement.prototype._getGeneralSelectVariantContent = function(sVariantKey, sContext) {

		var oContent = this._getVariantContent(sVariantKey);
		if (oContent) {
			oContent = merge({}, oContent);
		}

		return oContent;
	};

	/**
	 * Sets the dirty flag of the current variant.
	 * @public
	 * @param {boolean} bFlag The value indicating the dirty state of the current variant
	 */
	SmartVariantManagement.prototype.currentVariantSetModified = function(bFlag) {

		if (!this._bApplyingUIState) {
			SmartVariantManagementBase.prototype.currentVariantSetModified.apply(this, arguments);
		}
	};

	SmartVariantManagement.prototype._applyControlUiState = function(oControlWrapper, oContent, sContext) {
		if (oControlWrapper && oContent) {
			oControlWrapper.loaded.promise.then(() => {
				if (oControlWrapper.control.setUiStateAsVariant) {
					oControlWrapper.control.setUiStateAsVariant(oContent, sContext);
				}
			});
		}
	};

	SmartVariantManagement.prototype._applyUiState = function(sVariantKey, sContext, bExecuteOnSelection) {

		var i, oAdapter = this._getAdapter(), oContent = null, aCurrentControls = this._getAllPersonalizableControls();
		var oSearchControl = null;

		if (oAdapter) {
			oContent = oAdapter.getUiState(sVariantKey);

			this._bApplyingUIState = true;
			for (i = 0; i < aCurrentControls.length; i++) {
				if (aCurrentControls[i]?.control && aCurrentControls[i]?.loaded) {
					this._applyControlUiState(aCurrentControls[i], oContent, sContext);

					if (aCurrentControls[i].control.search) {
						oSearchControl = aCurrentControls[i].control;
					}
				}
			}
			this._bApplyingUIState = false;

			if (bExecuteOnSelection && oSearchControl) {
				oSearchControl.search();
			}
		}
	};

	SmartVariantManagement.prototype._applyControlWrapperVariants = function(oControlWrapper, oContent, sContext, bExecuteOnSelection) {
		if (oControlWrapper) {
			return oControlWrapper.loaded.promise.then(() => {
				this._applyControlVariant(oControlWrapper.control, oContent, sContext, false, bExecuteOnSelection);
			});
		}
		return Promise.resolve();
	};

	SmartVariantManagement.prototype._applyVariants = function(oContent, sContext, bExecuteOnSelection) {

		var i, aCurrentControls = this._getAllPersonalizableControls();
		const aPromises = [];
		for (i = 0; i < aCurrentControls.length; i++) {
			if (aCurrentControls[i]?.control && aCurrentControls[i]?.loaded) {
				aPromises.push(this._applyControlWrapperVariants(aCurrentControls[i], oContent, sContext, bExecuteOnSelection));
			}
		}
		return aPromises;
	};

	SmartVariantManagement.prototype._setStandardVariant = function(oCurrentControlInfo) {

		var oCurrentControl = oCurrentControlInfo.control;

		if (oCurrentControl) {

			if (oCurrentControl.fireBeforeVariantSave) {
				oCurrentControl.fireBeforeVariantSave(library.STANDARD_VARIANT_NAME); // to obtain the CUSTOM_DATA
			}

			return this._assignStandardVariantAsync(oCurrentControlInfo);
		}
	};

	SmartVariantManagement.prototype._retrieveContent = function(oContent, sPersKey) {

		var oRetContent = oContent;

		if (this.isPageVariant() && oContent) {
			oRetContent = oContent[sPersKey];
			if (!oRetContent && (sPersKey === this.getPersistencyKey()) && this._aPersonalizableControls && this._aPersonalizableControls.length === 1) {
				oRetContent = oContent;
			}
		}

		return oRetContent;
	};

	SmartVariantManagement.prototype._assignContent = function(oTargetContent, oContent, sPersKey) {

		if (this.isPageVariant()) {
			oTargetContent[sPersKey] = oContent;
			//			if (!((sPersKey === this.getPersistencyKey()) && this._aPersonalizableControls && this._aPersonalizableControls.length === 1)) {
			//				oTargetContent[sPersKey] = oContent;
			//			} else {
			//				oTargetContent = oContent;
			//			}
		} else {
			oTargetContent = oContent;
		}

		return oTargetContent;
	};

	SmartVariantManagement.prototype._updateStandardVariant = function(oCurrentControlInfo, oContent) {

		if (oCurrentControlInfo.control) {
			var oControlContent = oContent;
			if (this.isPageVariant()) {
				var sPersKey = this._getControlPersKey(oCurrentControlInfo);
				if (sPersKey) {
					// oControlContent = oContent[sPersKey];
					oControlContent = this._retrieveContent(oContent, sPersKey);
				}
			}

			return this._assignStandardVariantForControl(oCurrentControlInfo, oControlContent);
		}

		return oContent;
	};

	SmartVariantManagement.prototype._assignStandardVariantAsync = function(oCurrentControlInfo) {

		var oStandardVariant = null;

		if (oCurrentControlInfo.control) {

			if (oCurrentControlInfo.control.fetchVariant) {
				oStandardVariant = oCurrentControlInfo.control.fetchVariant();
			}

			if (oStandardVariant instanceof Promise) {
				this.setEnabled(false);
			}

			//if (oStandardVariant instanceof Promise) {
			return SyncPromise.resolve(oStandardVariant).then((oStandardVariant) => {
				return this._assignStandardVariantForControl(oCurrentControlInfo, oStandardVariant);
			}).catch((oError) => {
				Log.error("'_assignStandardVariant' throws an exception: " + oError.message);
			}).unwrap();
		}

		return null;
	};

	SmartVariantManagement.prototype._assignStandardVariantForControl = function(oCurrentControlInfo, oStandardVariant) {

		var oControlContent = oStandardVariant;

		if (oCurrentControlInfo) {
			if (this.isPageVariant()) {
				var sPersKey = this._getControlPersKey(oCurrentControlInfo.control);
				if (sPersKey) {
					if (!this._oStandardVariant) {
						this._oStandardVariant = {};
					}
					this._oStandardVariant = this._assignContent(this._oStandardVariant, oControlContent, sPersKey);
				}
			} else {

				this._oStandardVariant = oControlContent;
			}
		}

		return this._oStandardVariant;

	};

	/**
	 * Returns the standard variant.
	 * @public
	 * @param {sap.ui.core.Control} oCurrentControl Current personalizable control
	 * @returns {Object} The standard variant.
	 */
	SmartVariantManagement.prototype.getStandardVariant = function(oCurrentControl) {
		var sPersKey, oControlInfo, oContent = null;

		if (this._oStandardVariant) {

			if (!oCurrentControl) {
				oContent = this._oStandardVariant;
			} else {
				/* eslint-disable no-lonely-if */
				if (this.isPageVariant()) {
					oControlInfo = this._getControlWrapper(oCurrentControl);
					if (oControlInfo) {
						sPersKey = this._getControlPersKey(oCurrentControl);
						if (sPersKey) {
							// oContent = this._oStandardVariant[sPersKey];
							oContent = this._retrieveContent(this._oStandardVariant, sPersKey);
						}
					}
				} else {
					if ((oCurrentControl === this._oPersoControl)) {
						oContent = this._oStandardVariant;
					}
				}
				/* eslint-enable no-lonely-if */
			}
		}

		return oContent;
	};


	/*
	 * Applies the variant content on the passed personalizable control.
	 *
	 * @private
	 * @ui5-restricted sap.ui.comp, sap.ui.rta
	 * @param {object} oCurrentControl - The personalizable control
	 * @param {object} oContent - The variant content which will be applied
	 * @param {string} sContext - The context of this execution
	 * @param {boolean} bInitial - The context of this execution
	 * @param {boolean} bExecuteOnSelection - The indicator if a search should be triggered
	 */
	SmartVariantManagement.prototype._applyVariant = function(oCurrentControl, oContent, sContext, bInitial, bExecuteOnSelection) {

		if (oCurrentControl && oCurrentControl.applyVariant) {

			if (bExecuteOnSelection != undefined) {
				oContent.executeOnSelection = bExecuteOnSelection;
			}
			oCurrentControl.applyVariant(oContent, sContext, bInitial);
		}
	};


	/*
	 * Determines the personalizable control based on the provided key and applies on it the provided content
	 * @private
	 * @ui5-restricted sap.ui.comp, sap.ui.rta
	 * @param {string} sPersoKey - Identifies the responsible control
	 * @param {object} oContent - The variant content which will be applied
	 * @param {string} sContext - The context of this execution
	 */
	SmartVariantManagement.prototype._applyVariantByPersistencyKey = function(sPersoKey, oContent, sContext) {

		var oControl = null;

		this.getAggregation("personalizableControls", []).some((oPersoControl) => {
			var oControlTmp = Element.getElementById(oPersoControl.getControl());
			if (oControlTmp) {
				var sPersoKeyName = oPersoControl.getKeyName();
				if (oControlTmp.getProperty(sPersoKeyName) === sPersoKey) {
					oControl = oControlTmp;
				}
				return oControl != null;
			}
		});

		if (oControl) {
			var oControlContent = this._retrieveContent(oContent, sPersoKey);
			this._applyVariant(oControl, oControlContent, sContext);
		}
	};

	SmartVariantManagement.prototype._applyControlVariant = function(oControl, oContent, sContext, bInitial, bExecuteOnSelection) {
		var oControlContent, sPersKey;

		sPersKey = this._getControlPersKey(oControl);
		if (sPersKey) {
			oControlContent = this._retrieveContent(oContent, sPersKey);

			if (oControlContent) {
				this._applyVariant(oControl, oControlContent, sContext, bInitial, bExecuteOnSelection);
			}
		}
	};

	/**
	 * Registers for a givven key prefix a select variant handler. For a givven key prefix only one handler is possible.
	 * @private
	 * @deprecated As of version 1.127.0, the concept has been discarded.
	 * @param {sap.ui.core.Control} oHandler receives the selectEvent
	 * @param {string} sKeyPrefix handler identifier
	 */
	SmartVariantManagement.prototype.registerSelectionVariantHandler = function(oHandler, sKeyPrefix) {
		this._oSelectionVariantHandler[sKeyPrefix] = oHandler;
	};

	/**
	 * Unregisters a select variant handler.
	 * @private
	 * @deprecated As of version 1.127.0, the concept has been discarded.
	 * @param {sap.ui.core.Control} oHandler receives the selectEvent
	 * @param {string} sKeyPrefix handler identifier
	 */
	SmartVariantManagement.prototype.unregisterSelectionVariantHandler = function(oHandler) {

		var sEntryToBeDeleted = null;

		if (!this._oSelectionVariantHandler) {
			return;
		}

		if (typeof oHandler === 'string') {
			sEntryToBeDeleted = oHandler;
		} else {

			Object.keys(this._oSelectionVariantHandler).some((oKey) => {
				if (this._oSelectionVariantHandler[oKey].handler === oHandler) {
					sEntryToBeDeleted = oKey;
					return true;
				}
				return false;
			});
		}

		if (sEntryToBeDeleted) {
			delete this._oSelectionVariantHandler[sEntryToBeDeleted];
		}

	};

	/**
	 * Sets an error state on the variant management control.
	 * @private
	 * @param {string} sText describing the error reason
	 * @param {string} sLogText describing the error reason for logging
	 */
	SmartVariantManagement.prototype._setErrorValueState = function(sText, sLogText) {
		this.setInErrorState(true);

		if (sLogText) {
			Log.error(sLogText);
		}
	};

	SmartVariantManagement.prototype.exit = function() {
		SmartVariantManagementBase.prototype.exit.apply(this, arguments);

		this._aPersonalizableControls = null;

		this._oMetadataPromise = null;
		this._fResolveMetadataPromise = null;

		this._oControlPromise = null;

		this._oPersoControl = null;

		this._oAppStdContent = null;
		this._sAppStandardVariantKey = null;

		this._oSelectionVariantHandler = null;

		if (this._oAdapter) {
			this._oAdapter.destroy();
			this._oAdapter = null;
		}
	};

	return SmartVariantManagement;

});
