/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/BindingMode",
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	"sap/base/Log"
], function(
	JSONModel,
	BindingMode,
	Library,
	coreLibrary,
	Log
) {
	"use strict";

	// shortcut for sap.ui.core.TitleLevel
	const { TitleLevel } = coreLibrary;

	const DEFAULT_CONTEXT_PATH = "/data";

	const DEFAULT_MODEL_NAME = "$sVM";

	const PROPERTIES = [
		"creationAllowed",
		"currentVariant",
		"defaultVariant",
		"headerLevel",
		"modified",
		"showExecuteOnSelection",
		"showFavorites",
		"standardItemText",
		"supportDefault",
		"supportPublic",
		"titleStyle",
		"variants",
		"variantsEditable"
	];

	/**
	 *
	 * @class JSON based Model for {@link sap.ui.comp.smartvariants.SmartVariantManagement SmartVariantManagement} controls.
	 * The model stores the current state of the {@link sap.ui.comp.smartvariants.SmartVariantManagement SmartVariantManagement}.
	 * @extends sap.ui.model.json.JSONModel
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.128.0
	 * @alias sap.ui.comp.smartvariants.SmartVariantManagementModel
	 *
	 * @private
	*/
	const SmartVariantManagementModel = JSONModel.extend("sap.ui.comp.smartvariants.SmartVariantManagementModel", {
		constructor: function() {
			JSONModel.apply(this, arguments);
			this.setSizeLimit(1000);
			this.setDefaultBindingMode(BindingMode.OneWay);

			this._aContexts = [];

			if (!this.getProperty(DEFAULT_CONTEXT_PATH)) {
				this.createContext(DEFAULT_CONTEXT_PATH);
			}

			this._sDefaultVariantId = null;
		}
	});

	SmartVariantManagementModel.prototype.createContext = function(sContextPath, oValues) {
		if (!sContextPath) {
			return;
		}

		if (this._aContexts.includes(sContextPath)) {
			return;
		}

		if (!sContextPath.startsWith("/")) {
			Log.warning("SmartVariantManagementModel: you've called 'createContext' with a context path that's not starting with a '/'.");
			return;
		}

		this._aContexts.push(sContextPath);
		this.setProperty(sContextPath, oValues || {
			creationAllowed: true,
			currentVariant: "",
			defaultVariant: "",
			headerLevel: TitleLevel.Auto,
			modified: false,
			showExecuteOnSelection: false,
			showFavorites: false,
			standardItemText: null,
			supportDefault: true,
			supportPublic: false,
			titleStyle: TitleLevel.Auto,
			variants: [],
			variantsEditable: true
		});
	};

	//							setter + getter for each property

	PROPERTIES.forEach(function(sPropertyName) {
		const fnCapitalizeFirstLetter = (sString) => {
			return sString[0].toUpperCase() + sString.slice(1);
		};
		const sPropertyCapitalized = fnCapitalizeFirstLetter(sPropertyName);
		const sGetterName = `get${sPropertyCapitalized}`,
			sSetterName = `set${sPropertyCapitalized}`;

		SmartVariantManagementModel.prototype[sGetterName] = function(sContextPath) {
			return this._getProperty(sPropertyName, sContextPath);
		};

		SmartVariantManagementModel.prototype[sSetterName] = function(vValue, sContextPath) {
			return this._setProperty(sPropertyName, vValue, sContextPath);
		};
	});

	SmartVariantManagementModel.prototype._getProperty = function(sPropertyName, sContextPath) {
		return this.getProperty(`${sContextPath || DEFAULT_CONTEXT_PATH}/${sPropertyName}`);
	};

	SmartVariantManagementModel.prototype._setProperty = function(sPropertyName, vValue, sContextPath) {
		return this.setProperty(`${sContextPath || DEFAULT_CONTEXT_PATH}/${sPropertyName}`, vValue);
	};

	SmartVariantManagementModel.prototype.getContexts = function() {
		return this._aContexts;
	};

	SmartVariantManagementModel.prototype._getDefaultVariantId = function() {
		return this._sDefaultVariantId || "";
	};

	SmartVariantManagementModel.prototype._setDefaultVariantId = function(sVariantKey, oPersoControl) {
		if (FlexWriteAPI && oPersoControl) {
			FlexWriteAPI.setDefaultVariantId({
				control: oPersoControl,
				defaultVariantId: sVariantKey
			});
		}

		this._sDefaultVariantId = sVariantKey;
	};

	SmartVariantManagementModel.prototype.prepareVariantsForTitleBindings = function(sContextPath, mViewsToCheck) {
		if (!mViewsToCheck) {
			const aVariants = this.getVariants(sContextPath);
			mViewsToCheck = aVariants.map((oVariant) => {
				// Find model and key from patterns like {i18n>TextKey} or {i18n>namespace.textkey} - only resource models are supported
				const aMatches = oVariant.title && oVariant.title.match(/{(\w+)>(\w.+)}/);
				if (!aMatches) {
					return undefined;
				}
				return {
					key: oVariant.key,
					sResourceModel: aMatches[1],
					sResourceKey: aMatches[2]
				};
			}).filter((oVariant) => {
				return oVariant !== undefined;
			});
		}

		return mViewsToCheck;
	};

	SmartVariantManagementModel.prototype.updateVariant = function(oVariant) {
		var mView, aVariants, nIdx, nNewIdx, sTitle;

		if (oVariant) {
			aVariants = this.getVariants();
			nIdx = this.findVariantIndex(oVariant.getVariantId());
			if (nIdx > -1) {

				mView = aVariants[nIdx];

				mView["executeOnSelect"] = oVariant.getExecuteOnSelection();
				mView["originalExecuteOnSelect"] = oVariant.getExecuteOnSelection();

				mView["favorite"] = oVariant.getFavorite();
				mView["originalFavorite"] = oVariant.getFavorite();


				if (oVariant.getContexts) {
					mView["contexts"] = oVariant.getContexts();
					mView["originalContexts"] = oVariant.getContexts();
				}

				sTitle = oVariant.getText("variantName");
				if (mView["title"] !== sTitle) {

					nNewIdx = this.getIdxSorted(sTitle);
					if (nIdx !== nNewIdx) {
						aVariants.splice(nIdx, 1);
						aVariants.splice(nNewIdx, 0, mView);
					}

					mView["title"] = sTitle;
					mView["originalTitle"] = sTitle;
				}
				//oVariantItem.setText(sTitle);

				this.setVariants(aVariants);
				this.checkUpdate(true);
			}
		}
	};

	SmartVariantManagementModel.prototype.reorderVariants = function(sKey, sNewTitle, nFromIndex = 0) {
		const aVariants = this.getVariants();
		var mView;
		var nIdx = this.findVariantIndex(sKey, nFromIndex);

		if (nIdx > 0) {
			mView = aVariants[nIdx];
			aVariants.splice(nIdx, 1);

			nIdx = this.getIdxSorted(sNewTitle);
			if (nIdx > 0) { // this is always true
				mView.title = sNewTitle;
				aVariants.splice(nIdx, 0, mView);
				this.setVariants(aVariants);
			}
		} else if (nIdx === 0) {             // vendor standard
			aVariants[nIdx]['title'] = sNewTitle;
			this.setVariants(aVariants);
		}

	};

	SmartVariantManagementModel.prototype.getIdxSorted = function(sTitle) {
		const aVariants = this.getVariants();
		const sUpperTitle = sTitle.toUpperCase();
		const nIdx = aVariants.findIndex((oElement, idx) => {
			if (idx > 0) {
				if (oElement.title.toUpperCase() > sUpperTitle) {
					return true;
				}
			}

			return false;
		});

		return nIdx > -1 ? nIdx : aVariants.length;
	};

	SmartVariantManagementModel.prototype.removeVariant = function(sKey) {
		const aVariants = this.getVariants();
		var nIdx = this.findVariantIndex(sKey);
		if (nIdx > -1) {
			aVariants.splice(nIdx, 1);
			this.setVariants(aVariants);
		}
	};

	SmartVariantManagementModel.prototype.updateView = function(sKey, sPropertyName, vValue) {
		const aVariants = this.getVariants();

		var nIdx = this.findVariantIndex(sKey, -1);
		if (nIdx > -1) {
			aVariants[nIdx][sPropertyName] = vValue;
			this.setVariants(aVariants);
		}
	};

	SmartVariantManagementModel.prototype.findVariantIndex = function(sKey, nFromIndex = 0) {
		return this.getVariants().findIndex((oVariant, idx) => {
			if (idx > nFromIndex) {
				if (oVariant.key === sKey) {
					return true;
				}
			}
			return false;
		});
	};

	// sap/fl relevant

	// sap.ui.fl-related classes (loaded async after library load)
	let FlexApplyAPI,
		FlexWriteAPI,
		FlexRuntimeInfoAPI;

	SmartVariantManagementModel.prototype.retrieveDataFromFlex = function() {
		if (!FlexWriteAPI) {
			throw new Error("SmartVariantManagementModel.retrieveDataFromFlex: FlexWriteAPI is not available. Please call 'loadFlex' before this method.");
		}

		return [
			FlexWriteAPI.isVariantSharingEnabled(),
			FlexWriteAPI.isVariantPersonalizationEnabled(),
			FlexWriteAPI.isVariantAdaptationEnabled()
		];
	};

	SmartVariantManagementModel.prototype.loadFlex = function() {
		const fnRequireFlexAPI = () => {
			return new Promise((fResolve) => {
				sap.ui.require([
					"sap/ui/fl/apply/api/SmartVariantManagementApplyAPI",
					"sap/ui/fl/write/api/SmartVariantManagementWriteAPI",
					"sap/ui/fl/apply/api/FlexRuntimeInfoAPI"
				], function(fFlexApplyAPI, fFlexWriteAPI, fFlexRuntimeInfoAPI) {
					FlexApplyAPI = fFlexApplyAPI;
					FlexWriteAPI = fFlexWriteAPI;
					FlexRuntimeInfoAPI = fFlexRuntimeInfoAPI;
					fResolve();
				});
			});
		};

		if (!this._oFlLibrary) {

			if (!this._oPersistencyPromise) {
				this._oPersistencyPromise = new Promise((fResolve, fReject) => {
					this._fResolvePersistencyPromise = fResolve;
					this._fRejectPersistencyPromise = fReject;
				});
			}
			this._oFlLibrary = new Promise((fResolve, fReject) => {
				Library.load({ name: 'sap.ui.fl' }).then(() => {
					fnRequireFlexAPI().then(fResolve);
				}).catch((oError) => {
					if (this._fRejectPersistencyPromise) {
						this._fRejectPersistencyPromise();
					}
					fReject(oError);
				});
			});
		}

		return this._oFlLibrary;
	};

	/**
	 * This method unloads the Flex APIs, this is designed to be used in tests only
	 * @private
	 */
	SmartVariantManagementModel.prototype._unloadFlex = function() {
		FlexApplyAPI = undefined;
		FlexWriteAPI = undefined;
		FlexRuntimeInfoAPI = undefined;
		this._oFlLibrary = undefined;
	};

	SmartVariantManagementModel.prototype.isFlexLoaded = function() {
		return FlexApplyAPI !== undefined
			&& FlexWriteAPI !== undefined
			&& FlexRuntimeInfoAPI !== undefined;
	};

	SmartVariantManagementModel.prototype.isFlexSupported = function(oControl) {
		if (this.isFlexLoaded()) {
			return Promise.resolve(this._isFlexSupported(oControl));
		} else {
			return this.loadFlex().then(() => {
				return this._isFlexSupported(oControl);
			});
		}
	};

	SmartVariantManagementModel.prototype._isFlexSupported = function(oControl) {
		if (!FlexRuntimeInfoAPI) {
			throw new Error("SmartVariantManagementModel._isFlexSupported: FlexRuntimeInfoAPI is not available. Please call 'loadFlex' before this method.");
		}

		return FlexRuntimeInfoAPI.isFlexSupported({ element: oControl });
	};

	SmartVariantManagementModel.prototype.loadVariants = function(mPropertyBag, resolveControlPromise, rejectControlPromise) {
		if (!FlexApplyAPI) {
			throw new Error("SmartVariantManagementModel.loadVariant: FlexApplyAPI is not available. Please call 'loadFlex' before this method.");
		}

		return FlexApplyAPI.loadVariants(mPropertyBag).then((mVariants) => {
			this._fResolvePersistencyPromise();
			resolveControlPromise(mVariants);
		}).catch((args) => {
			this._fRejectPersistencyPromise(args);
			rejectControlPromise(args);
		});
	};

	SmartVariantManagementModel.prototype.flUpdateVariant = function(oVariant, mProperties, oPersoControl) {
		let oUpdatedVariant;
		if (mProperties.hasOwnProperty("content") || mProperties.hasOwnProperty("name")) {
			oUpdatedVariant = this._handleLayerUpdate(oVariant, mProperties, oPersoControl);
		}

		if (mProperties.hasOwnProperty("favorite") || mProperties.hasOwnProperty("executeOnSelection")) {
			oUpdatedVariant = this._handleUserDependentUpdate(oVariant, mProperties, oPersoControl);
		}

		return oUpdatedVariant;
	};

	SmartVariantManagementModel.prototype._handleLayerUpdate = function(oVariant, mProperties, oPersoControl) {
		const mParameters = {
			control: oPersoControl,
			id: oVariant.getVariantId(),
			layer: oVariant.getLayer()
		};

		if (mProperties.hasOwnProperty("content")) {
			mParameters.content = mProperties.content;
		}

		if (mProperties.hasOwnProperty("name")) {
			mParameters.name = mProperties.name;
		}

		if (mProperties.hasOwnProperty("packageName")) {
			mParameters.packageName = mProperties.packageName;
		}

		if (mProperties.hasOwnProperty("transportId")) {
			mParameters.transportId = mProperties.transportId;
		}

		return this._handleUpdate(mParameters);
	};

	SmartVariantManagementModel.prototype._handleUserDependentUpdate = function(oVariant, mProperties, oPersoControl) {
		const mParameters = {
			control: oPersoControl,
			id: oVariant.getVariantId(),
			isUserDependent: true
		};

		if (mProperties.hasOwnProperty("favorite")) {
			mParameters.favorite = mProperties.favorite;
		}

		if (mProperties.hasOwnProperty("executeOnSelection")) {
			mParameters.executeOnSelection = mProperties.executeOnSelection;
		}

		return this._handleUpdate(mParameters);
	};

	SmartVariantManagementModel.prototype._handleUpdate = function(mParameters) {
		return this._flWriteUpdateVariant(mParameters);
	};

	SmartVariantManagementModel.prototype._flWriteUpdateVariant = function(mProperties) {
		return FlexWriteAPI?.updateVariant(mProperties) ?? null;
	};

	SmartVariantManagementModel.prototype._flWriteRemoveVariant = function(mProperties) {
		return FlexWriteAPI?.removeVariant(mProperties) ?? null;
	};

	SmartVariantManagementModel.prototype._flWriteAddVariant = function(mProperties) {
		return FlexWriteAPI?.addVariant(mProperties) ?? null;
	};

	SmartVariantManagementModel.prototype.flWriteOverrideStandardVariant = function(bFlag, oPersoControl) {
		if (FlexWriteAPI) {
			FlexWriteAPI.overrideStandardVariant({
				control: oPersoControl,
				executeOnSelection: bFlag
			});
		}
	};

	SmartVariantManagementModel.prototype.save = function(oPersoControl) {
		if (!FlexWriteAPI) {
			throw new Error("SmartVariantManagementModel.save: FlexWriteAPI is not set. Please call 'loadFlex' before calling this method.");
		}
		return FlexWriteAPI.save({ control: oPersoControl });
	};

	SmartVariantManagementModel.prototype._createMetadataPromise = function() {
		this._oMetadataPromise = new Promise((resolve/*, reject*/) => {
			this._fResolveMetadataPromise = resolve;
		});
	};

	SmartVariantManagementModel.prototype._resolveMetadataPromise = function() {
		if (this._fResolveMetadataPromise) {
			this._fResolveMetadataPromise();
		}
	};

	SmartVariantManagementModel.prototype.getPersistencyPromise = function() {
		return this._oPersistencyPromise;
	};

	// static

	SmartVariantManagementModel.getDefaultContextPath = () => {
		return DEFAULT_CONTEXT_PATH;
	};

	SmartVariantManagementModel.getDefaultModelName = () => {
		return DEFAULT_MODEL_NAME;
	};

	SmartVariantManagementModel.prototype.destroy = function() {
		this._oPersistencyPromise = null;
		this._sDefaultVariantId = null;

		this._fResolveMetadataPromise = null;
		this._oMetadataPromise = null;

		this._aContexts = undefined;

		JSONModel.prototype.destroy.apply(this, arguments);
	};

	return SmartVariantManagementModel;
});
