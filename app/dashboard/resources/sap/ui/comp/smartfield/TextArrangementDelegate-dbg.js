/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/* global Map */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/core/library",
	"sap/ui/core/Core",
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/base/assert",
	"sap/base/util/deepEqual"
], function(
	compLibrary,
	coreLibrary,
	Core,
	BaseObject,
	Filter,
	FilterOperator,
	assert,
	deepEqualUtil
) {
	"use strict";

	var TextInEditModeSource = compLibrary.smartfield.TextInEditModeSource;

	var TextArrangementDelegate = BaseObject.extend("sap.ui.comp.smartfield.TextArrangementDelegate", /** @lends sap.ui.comp.smartfield.TextArrangementDelegate.prototype */ {
		constructor: function(oFactory) {
			BaseObject.apply(this, arguments);
			this.oFactory = oFactory;
			this.oSmartField = oFactory._oParent;
			this.bValidMetadata = false;
			this.sBindingContextPath = "";
			this.sAbsolutePathToVLProperty = "";

			// Cache for description request data. This is one time cache after every get the value is removed
			this._mOneTimeDescriptionCache = new Map();
			this._sTextArrangementLastReadValue = null;
			this._mTextArrangementLastReadAdditionalFilters = null;
		}
	});

	TextArrangementDelegate.getPaths = function(sTextInEditModeSource, oMetadata) {
		var oValueListAnnotation = oMetadata.property && oMetadata.property.valueListAnnotation;

		switch (sTextInEditModeSource) {
			case TextInEditModeSource.NavigationProperty:
				var oNavigationPropertyMetadata = oMetadata.annotations.text;

				if (!oNavigationPropertyMetadata) {
					return {};
				}

				return {
					keyField: oNavigationPropertyMetadata.entityType.key.propertyRef[0].name,
					descriptionField: oNavigationPropertyMetadata.property.typePath,
					entitySetName: oNavigationPropertyMetadata.entitySet.name
				};

			case TextInEditModeSource.ValueList:
				if (!oValueListAnnotation) {
					return {};
				}

				return {
					keyField: oValueListAnnotation.keyField,
					descriptionField: oValueListAnnotation.descriptionField,
					entitySetName: oMetadata.property.valueListEntitySet && oMetadata.property.valueListEntitySet.name
				};
			case TextInEditModeSource.ValueListNoValidation:
				if (!oValueListAnnotation) {
					return {};
				}

				return {
					valueListNoValidation: true,
					keyField: oValueListAnnotation.keyField,
					descriptionField: oValueListAnnotation.descriptionField,
					entitySetName: oMetadata.property.valueListEntitySet.name
				};

			// no default
		}
	};

	TextArrangementDelegate.prototype.getBindingInfo = function(oSettings) {
		var	oBindSettings,
			mTypes,
			oTextArrangementType = oSettings && oSettings.type,
			oKeyType = oSettings && oSettings.keyType,
			bValueListNoValidation = oSettings.valueListNoValidation,
			oFormatOptions = {},
			oSmartField = this.oSmartField,
			oFactory = this.oFactory,
			oMetadata = oFactory._oMetaData;

		if (!oTextArrangementType || !oTextArrangementType.isA("sap.ui.comp.smartfield.type.TextArrangement") && !oTextArrangementType.isA("sap.ui.comp.smartfield.type.TextArrangementString")) {
			var oBindingInfo = oSmartField.getBindingInfo("value");
			oTextArrangementType = (oBindingInfo && oBindingInfo.type) || {};
			var mTextArrangementBindingPaths = TextArrangementDelegate.getPaths(
				oFactory._bTextInDisplayModeValueList ? TextInEditModeSource.ValueList : oSmartField._getComputedTextInEditModeSource(),
				oMetadata
			);

			if (oFactory.isEmptyStringSignificant()) {
				oFormatOptions.isStringNullable = true;
			}

			mTypes = oFactory._oTypes.getType(oMetadata.property, Object.assign(oFormatOptions, oTextArrangementType.oFormatOptions), oTextArrangementType.oConstraints, {
				composite: true,
				keyField: mTextArrangementBindingPaths.keyField,
				descriptionField: mTextArrangementBindingPaths.descriptionField,
				valueListNoValidation: bValueListNoValidation,
				valueList: oSmartField._getComputedTextInEditModeSource() === TextInEditModeSource.ValueList,
				delegate: this
			});

			if (Array.isArray(mTypes)){
				oTextArrangementType = mTypes[0];
				oKeyType = mTypes[1];
			} else {
				oTextArrangementType = mTypes;
			}
		}
		var entityID = this.oSmartField.getBinding("value").getValue(),
			sTextInEditModeSource = oSmartField._getComputedTextInEditModeSource(),
			mTextArrangementPaths = TextArrangementDelegate.getPaths(
				this.oFactory._bTextInDisplayModeValueList ? TextInEditModeSource.ValueList : sTextInEditModeSource,
				oMetadata
			);

		var sTextAnnotationPropertyPath = this.getTextAnnotationPropertyPath({
			entitySet: { name: mTextArrangementPaths.entitySetName },
			entityID: entityID
		});

		// BCP: 1970338535 - Special case where we can't calculate the description binding path so we have to use
		// not existing one to prevent issues having an empty binding path.
		if (sTextAnnotationPropertyPath === "" || sTextAnnotationPropertyPath.indexOf("undefined") !== -1) {
			sTextAnnotationPropertyPath = "__$$SmartFieldNotExistingBindingPath";
		}

		oBindSettings = {
			model: oMetadata.model,
			type: oTextArrangementType,
			parts: [
				{
					path: oMetadata.path
				},
				{
					path: sTextAnnotationPropertyPath
				}
			]
		};

		if (oKeyType) {
			oBindSettings.parts[0].type = oKeyType;
		}

		return oBindSettings;
	};

	TextArrangementDelegate.prototype.getTextAnnotationPropertyPath = function(oSettings) {
		oSettings = oSettings || {};
		var sTextInEditModeSource = oSettings.textInEditModeSource || this.oSmartField._getComputedTextInEditModeSource(),
			oFactory = this.oFactory,
			oMetadata = oFactory._oMetaData,
			sMetadataText = oMetadata.annotations && oMetadata.annotations.text,
			oTextAnnotation = oSettings.textAnnotation || sMetadataText;

		if (oFactory._bTextInDisplayModeValueList) {
			// In this scenario we always revert to ValueList
			sTextInEditModeSource = TextInEditModeSource.ValueList;
		}

		switch (sTextInEditModeSource) {
			case TextInEditModeSource.NavigationProperty:
				return oFactory._oHelper.getTextAnnotationPropertyPath(oTextAnnotation);

			case TextInEditModeSource.ValueList:
			case TextInEditModeSource.ValueListNoValidation:
				var oEdmValueListKeyProperty = oSettings.edmValueListKeyProperty || oMetadata.property.valueListKeyProperty,
					sBindingContextPath = oSettings.bindingContextPath || this.sBindingContextPath;

				if (
					oTextAnnotation &&
					sBindingContextPath !== "/undefined" &&
					this.oSmartField._isValueInitial()
				) {
					var  sTextAnnotationPath = oFactory._oHelper.getTextAnnotationPropertyPath(oTextAnnotation);
					if (sTextAnnotationPath && sTextAnnotationPath !== this.oFactory.getMetaData().path) {
						return sTextAnnotationPath;
					}
				}
				// return the absolute path to the value list entity property e.g.: /VL_SH_H_CATEGORY('PR')/LTXT
				return oFactory._oHelper.getAbsolutePropertyPathToValueListEntity({
					property: oEdmValueListKeyProperty,
					bindingContextPath: sBindingContextPath,
					entitySet: oSettings.entitySet,
					entityID: oSettings.entityID
				});

			case TextInEditModeSource.None:
				return "";
			default:
				return "";
		}
	};

	TextArrangementDelegate.prototype.checkRequiredMetadata = function(sComputedTextInEditModeSource, bSuppressErrors) {
		var oFactory = this.oFactory,
			oMetadata = oFactory._oMetaData,
			oProperty = oMetadata.property,
			oLocalProperty = oProperty.property,
			oValueListProperty = oProperty.valueListKeyProperty,
			sTextInEditModeSource = this.oSmartField.getTextInEditModeSource(),
			bHasValidation = sTextInEditModeSource === TextInEditModeSource.ValueList || sTextInEditModeSource === TextInEditModeSource.ValueListWarning,
			bHasTextAnnotation = (oLocalProperty && oLocalProperty["com.sap.vocabularies.Common.v1.Text"]) ||
									(oValueListProperty && oValueListProperty["com.sap.vocabularies.Common.v1.Text"]);

		if (!bHasTextAnnotation && !bHasValidation) {
			return false;
		}

		switch (sComputedTextInEditModeSource) {
			case TextInEditModeSource.None:
				return false;

			case TextInEditModeSource.NavigationProperty:
				var oNavigationPropertyMetadata = oMetadata.annotations.text,
					oEntityTypeOfNavigationProperty;

				if (oNavigationPropertyMetadata) {
					oEntityTypeOfNavigationProperty = oNavigationPropertyMetadata.entityType;
				}

				var oCheckNavigationPropertyMetadata = {
					propertyName: oMetadata.property && oMetadata.property.property && oMetadata.property.property.name,
					entityType: oMetadata.entityType,
					entityTypeOfNavigationProperty: oEntityTypeOfNavigationProperty,
					textAnnotation: oMetadata.property && oMetadata.property.property && oMetadata.property.property["com.sap.vocabularies.Common.v1.Text"]
				};

				if (bSuppressErrors) {
					return oFactory._oHelper.checkNavigationPropertyRequiredMetadataNoAsserts(oCheckNavigationPropertyMetadata);
				} else {
					return oFactory._oHelper.checkNavigationPropertyRequiredMetadata(oCheckNavigationPropertyMetadata);
				}
			case TextInEditModeSource.ValueList:
			case TextInEditModeSource.ValueListNoValidation:
				var oValueListMetadata = {
					propertyName: oMetadata.property && oMetadata.property.property && oMetadata.property.property.name,
					entityType: oMetadata.entityType,
					valueListAnnotation: oMetadata.property && oMetadata.property.valueListAnnotation
				};

				if (bSuppressErrors) {
					return oFactory._oHelper.checkValueListRequiredMetadataForTextArrangmentNoAsserts(oValueListMetadata);
				} else {
					return oFactory._oHelper.checkValueListRequiredMetadataForTextArrangment(oValueListMetadata);
				}
			default:
				return false;
		 }
	};

	TextArrangementDelegate.prototype.onBeforeValidateValue = function(sValue, oSettings) {
		var oSmartField = this.oSmartField;

		// Prevent unnecessary requests to be sent and validation errors to be displayed,
		// if the binding context is not set
		if (!oSmartField.getBindingContext()) { // note: the binding context can be null or undefined
			return;
		}

		var fnOnFetchSuccess = this.onFetchIDAndDescriptionCollectionSuccess.bind(this, {
			value: sValue,
			mode: oSmartField.getMode(),
			noRebind: oSettings.noRebind,
			success: oSettings.success,
			filterFields: oSettings.filterFields,
			userInteractionValue: true
		});

		var fnOnFetchError = this.onFetchIDAndDescriptionCollectionError.bind(this, {
			error: oSettings.error
		});

		var oFetchSettings = {
			value: sValue,
			success: fnOnFetchSuccess,
			error: fnOnFetchError,
			filterFields: oSettings.filterFields,
			updateBusyIndicator: true,
			bCheckValuesValidity: oSettings.bCheckValuesValidity
		};

		return this.fetchIDAndDescriptionCollection(oFetchSettings);
	};

	TextArrangementDelegate.prototype.fetchIDAndDescriptionCollectionIfRequired = function(oSettings) {
		var oMetaData,
			oTextAnnotation,
			aFilterFields,
			oSmartField = this.oSmartField,
			sMode = oSettings.mode,
			bForceTextArrangementFetch = oSettings.forceTextArrangementFetch,
			oBaseControlBinding = oSmartField._getInnerControlPropertyBinding(sMode),
			oSmartFieldBinding = oSmartField.getBinding("value"),
			oType = oBaseControlBinding && oBaseControlBinding.getType(),
			bInnerControlHasTextArrangement =  oType && oType.isA("sap.ui.comp.smartfield.type.TextArrangement") || false,
			sTextInEditModeSource = oSmartField._getComputedTextInEditModeSource(),
			oFactory = this.oFactory,
			bValueList = sTextInEditModeSource === TextInEditModeSource.ValueList,
			bInitial = oSmartField._isValueInitial();

		if (oFactory) {
			oMetaData = oFactory.getMetaData();
			oTextAnnotation = oFactory._getLocalTextAnnotation();
		}

		if (
			oTextAnnotation &&
			(
				(oMetaData && oTextAnnotation.path === oMetaData.path) ||
				this.sBindingContextPath === "/undefined" ||
				!bInitial
			)
		) {
			oTextAnnotation = null;
		}

		// When value is initial and not transitory we use Common.Text
		if (oTextAnnotation && bInitial && !oSmartField._isValueInValidation()) {
			return;
		}

		if (
			bValueList ||
			(
				!oTextAnnotation &&
				sTextInEditModeSource === TextInEditModeSource.ValueListNoValidation &&
				this.oFactory._getDisplayBehaviourConfiguration() !== "idOnly"
			) ||
			this.oFactory._bTextInDisplayModeValueList
		) {
			var aBindings,
				vKeyValue,
				vDescriptionValue,
				bUndefinedOrEmptyValue,
				bValueIsRead = false,
				oModel = oSmartField.getModel(),
				oAdditionalFilters = this.getAdditionalFiltersData(oSmartField, oSmartField.getControlFactory().getMetaData(), {}),
				bTextArrangementLastReadFiltersDiff = this._mTextArrangementLastReadAdditionalFilters && !deepEqualUtil(this._mTextArrangementLastReadAdditionalFilters, oAdditionalFilters);

			if (oModel && oBaseControlBinding) {

				if (bInnerControlHasTextArrangement) {
					aBindings = oBaseControlBinding.getBindings();
					vKeyValue = oModel.getProperty(aBindings[0].getResolvedPath());

					if (oType.oFormatOptions.textArrangement === "descriptionOnly") {
						vDescriptionValue = oModel.getProperty(aBindings[1].getResolvedPath());
						bValueIsRead =   this._sTextArrangementLastReadValue === vDescriptionValue || this._sTextArrangementLastReadValue === vKeyValue;
					} else {
						bValueIsRead = this._sTextArrangementLastReadValue === vKeyValue;
					}

				} else {
					vKeyValue = oModel.getProperty(oSmartFieldBinding.getResolvedPath());

					bValueIsRead = this._sTextArrangementLastReadValue === vKeyValue;
				}

				bUndefinedOrEmptyValue = (vKeyValue === undefined) || (vKeyValue === null);
			}

			if (!bUndefinedOrEmptyValue &&
				((bTextArrangementLastReadFiltersDiff ||
					!bValueIsRead ||
					!bInnerControlHasTextArrangement) ||
					bForceTextArrangementFetch)) {

				aFilterFields = ["keyField"];

				var oSuccessSettings = {
					value: vKeyValue,
					mode: sMode,
					initialRendering: true,
					filterFields: aFilterFields
				};

				return this.fetchIDAndDescriptionCollection({
					value: vKeyValue,
					filterFields: aFilterFields,
					updateBusyIndicator: false,
					success: this.onFetchIDAndDescriptionCollectionSuccess.bind(this, oSuccessSettings)
				});
			}
		}
	};

	TextArrangementDelegate.prototype.fetchIDAndDescriptionCollection = function(oSettings) {
		var vValue = oSettings.value,
			oSmartField = this.oSmartField;

		if (oSettings.bCheckValuesValidity) {
			oSettings.filterFields = ["keyField"];
		}

		var oInputField = oSmartField._oControl && oSmartField._oControl.edit;

		if (oInputField && oSettings.updateBusyIndicator) {
			oInputField.setBusyIndicatorDelay(300);
			oInputField.setBusy(true);
		}

		oSmartField._setValueInValidation(vValue);

		return this.readODataModel(oSettings).then(function(){
				oSmartField._bValueNotInitial = true;
			}).finally(function(){
				if (oInputField && oSettings.updateBusyIndicator) {
					// restore the busy and busy indicator delay states to the initial value
					oInputField.setBusyIndicatorDelay(0);
					oInputField.setBusy(false);
				}

				oSmartField._setValueInValidation(undefined);
			});
	};

	/**
	 * @private
	 * @returns {Promise}
	 */
	TextArrangementDelegate.prototype.readODataModel = function(oSettings) {
			var oSmartField = this.oSmartField,
			sAbsolutePathToVLProperty,
			oVLEntitySelected,
			sFieldName,
			oAdditionalFilters,
			oCache,
			sTextInEditModeSource = oSmartField._getComputedTextInEditModeSource(),
			oMetadata = oSmartField.getControlFactory().getMetaData(),
			mTextArrangementPaths = TextArrangementDelegate.getPaths(
				this.oFactory._bTextInDisplayModeValueList ? TextInEditModeSource.ValueList : sTextInEditModeSource,
				oMetadata
			),
			sPath = "/" + mTextArrangementPaths.entitySetName,
			oValueListData = oMetadata &&
							oMetadata.annotations &&
							oMetadata.annotations.valueListData || null,
			sKeyField = mTextArrangementPaths.keyField,
			sDescriptionField = mTextArrangementPaths.descriptionField,
			oValueListProvider = this.oFactory && this.oFactory.getValueListProvider(),
			bIsValueListEntitySetRequested = oValueListData && oValueListData.valueListEntitySetName === mTextArrangementPaths.entitySetName,
			mOutParams = bIsValueListEntitySetRequested && oValueListData && oValueListData.outParams ? Object.values(oValueListData.outParams) : [],
			aAllFields = bIsValueListEntitySetRequested && oValueListData && oValueListData.fields ? oValueListData.fields : [],
			oDataModelReadSettings = {
				success: oSettings.success,
				error: oSettings.error
			},
			bSuuppressEmptyStringRequest = oSmartField.getSuppressEmptyStringRequest(),
			bIsEmptyStringSignificant = this.oFactory.isEmptyStringSignificant(),
			bIsFixedList = this.oFactory._isFixedList();

		// BCP: 2080185890 If we cannot derive the description field we skip making the backend request as it would fail
		if (
			!sDescriptionField &&
			(
				// In display mode no validation call is needed
				this.oSmartField.getMode() === "display" ||
				// If we are not in ValueList validation mode - no exception
				!oSmartField._isValueListValidationMode()
			)
		) {
			return Promise.resolve();
		}

		this._sTextArrangementLastReadValue = oSettings.value;

		try {
			// Check if entity is selected from AutoSuggestions/ValueHelpDialog
			sAbsolutePathToVLProperty = this.getAbsolutePathToVLProperty();
			if (sAbsolutePathToVLProperty) {
				oVLEntitySelected = this.getSelectedEntity(sAbsolutePathToVLProperty);

				if (oVLEntitySelected) {
					this.clearAbsolutePathToVLProperty();
					oSettings.success(oVLEntitySelected);
					return Promise.resolve();
				}
			}

		} catch (oError) {
			return Promise.reject(oError);
		}

		// Check one time cache for data from selection - Suggestions/ValueHelpDialog
		oCache = this.getDataForNextDescriptionRequest(oSettings.value);
		if (
			oCache &&
			oCache.hasOwnProperty(sDescriptionField) &&
			oValueListProvider &&
			oValueListProvider._shouldHaveHistory &&
			!oValueListProvider._shouldHaveHistory()
		) {
			// Calling within setTimeout to match async behavior
			oSettings.success(oCache);
			return Promise.resolve();
		}

		// If the end-user has manually entered value
		oAdditionalFilters = this.getAdditionalFiltersData(oSmartField, oMetadata, oCache);

		var oFiltersSettings = {
			keyFieldPath: sKeyField,
			aFilterFields: ["keyField"]
		};

		if (sDescriptionField) {
			oFiltersSettings.descriptionFieldPath = sDescriptionField;
			oFiltersSettings.aFilterFields = oSettings.filterFields;
		}

		for (sFieldName in oAdditionalFilters) {
			oSettings.filterFields.push(sFieldName);
		}

		oFiltersSettings.additionalFilters = oAdditionalFilters;

		var aFilters = this.getFilters(oSettings.value, oFiltersSettings);

		if (aFilters.length === 0) {
			return Promise.resolve();
		}

		var mUrlParameters = this.getUrlParameters({
			keyField: sKeyField,
			descriptionField: sDescriptionField,
			outParams: mOutParams,
			allFields: aAllFields
		});

		oDataModelReadSettings.filters = aFilters;
		oDataModelReadSettings.urlParameters = mUrlParameters;

		this._mTextArrangementLastReadAdditionalFilters = oAdditionalFilters;

		if (bIsEmptyStringSignificant && !bIsFixedList && bSuuppressEmptyStringRequest === true && oSettings.value === "") {
			oSettings.success = null;
			this.onFetchIDAndDescriptionCollectionSuccess(oSettings, {results: []});
			return Promise.resolve();
		}

		return oSmartField._getTextArrangementRead().read(oSmartField.getModel(), sPath, oDataModelReadSettings)
			.then(oSettings.success)
			.catch(oSettings.error);
	};

	TextArrangementDelegate.prototype.getSelectedEntity = function(sAbsolutePathToVLProperty) {
		return sAbsolutePathToVLProperty !== "" && this.oSmartField.getBindingContext().getProperty(sAbsolutePathToVLProperty);
	};

	TextArrangementDelegate.prototype.clearAbsolutePathToVLProperty = function() {
		this.sAbsolutePathToVLProperty = "";
	};

	TextArrangementDelegate.prototype.setAbsolutePathToVLProperty = function(sAbsolutePathToVLProperty) {
		this.sAbsolutePathToVLProperty = sAbsolutePathToVLProperty;
	};

	TextArrangementDelegate.prototype.getAbsolutePathToVLProperty = function() {
		return this.sAbsolutePathToVLProperty;
	};

	TextArrangementDelegate.prototype.getAdditionalFiltersData = function(oSmartField, oData, oSelectedEntity) {
		var mConstParams,
			mInParams,
			sConstFieldName,
			sInFieldName,
			sValueListFieldName,
			oAdditionalFilters = {};

		if (typeof oSelectedEntity === "undefined") {
			oSelectedEntity = {};
		}

		if (oData && oData.annotations && oData.annotations.valueListData) {
			mInParams = oData.annotations.valueListData.inParams;
			mConstParams = oData.annotations.valueListData.constParams;
		}

		if (mConstParams) {
			for (sConstFieldName in mConstParams) {
				oAdditionalFilters[sConstFieldName] = mConstParams[sConstFieldName];
			}
		}

		if (mInParams) {
			for (sInFieldName in mInParams) {
				sValueListFieldName = mInParams[sInFieldName];
				if (sValueListFieldName !== oData.annotations.valueListData.keyField) {
					oAdditionalFilters[sValueListFieldName] = oSelectedEntity[sValueListFieldName] !== undefined ? oSelectedEntity[sValueListFieldName] : oSmartField.getBindingContext().getProperty(sInFieldName);
				}
			}
		}

		return oAdditionalFilters;
	};

	TextArrangementDelegate.prototype._setBindingPath = function(oSmartField, aDataResults, sBindingProperty, oBindingControl, bValueListNoValidation) {
		var oODataModel = oSmartField.getModel(),
			vBindingContextPath;

		assert(Array.isArray(aDataResults), " - " + this.getMetadata().getName());

		if (oODataModel) {

			this.invalidateDescription(sBindingProperty, oBindingControl, false);

			// We only consider textArrangement if we have only one result from the backend
			if (Array.isArray(aDataResults) && aDataResults.length === 1) {
				vBindingContextPath = oODataModel.getKey(aDataResults[0]);
			}

			if (bValueListNoValidation && aDataResults.length !== 1){
				this.sBindingContextPath = "/" + vBindingContextPath;
				this.bindPropertyForValueList(sBindingProperty, oBindingControl, true);
			} else if (typeof vBindingContextPath === "string") {
				this.sBindingContextPath = "/" + vBindingContextPath;
				this.bindPropertyForValueList(sBindingProperty, oBindingControl, false, bValueListNoValidation);
			} else if (aDataResults.length !== 1 && sBindingProperty === "text") {
				this.sBindingContextPath = undefined;
				this.bindPropertyForValueList(sBindingProperty, oBindingControl, false);
			} else if (aDataResults.length !== 1) {
				this.invalidateDescription(sBindingProperty, oBindingControl, true);
			}
		}
	};

	TextArrangementDelegate.prototype.invalidateDescription = function(sProperty, oBindingControl, isDescriptionInvalid){
		var bIsDescriptionInvalid,
			oBinding = oBindingControl && oBindingControl.getBinding(sProperty),
			oBindingInfo,
			oType = oBinding && oBinding.getType();

		if (!oType) {
			// in case input control is still not rendered there is no binding so we get the bindingInfo
			oBindingInfo = oBindingControl && oBindingControl.getBindingInfo(sProperty);
			oType = oBindingInfo && oBindingInfo.type;
		}

		if (oType && oType.isA("sap.ui.comp.smartfield.type.TextArrangement")) {
			bIsDescriptionInvalid = oType.getDescriptionIsInvalid();
			if (bIsDescriptionInvalid !== isDescriptionInvalid) {
				oType.setDescriptionIsInvalid(isDescriptionInvalid);
				if (oBinding) {
					oBinding.refresh(true);
				}
			}
		}
	};

	TextArrangementDelegate.prototype.onFetchIDAndDescriptionCollectionSuccess = function(oSettings, oData, oResponse) {
		var oOutputData,
			bValidValue = true,
			oValueListProvider,
			sMode,
			oInputField,
			oDisplayControl,
			aDataResults,
			bValueListNoValidation,
			sComputedTextInEditModeSource,
			oSmartField = this.oSmartField;

		// If the SmartField control is destroyed before this async callback is invoked.
		if (!oSmartField) {
			return;
		}

		sMode = oSettings.mode || oSmartField.getMode();
		oOutputData = oData && Array.isArray(oData.results) && oData.results.length === 1 ? oData.results[0] : null;
		oValueListProvider = oSmartField.getControlFactory() && oSmartField.getControlFactory().getValueListProvider() || null;
		oInputField = oSmartField._oControl.edit;
		oDisplayControl = oSmartField._oControl.display;
		aDataResults = oData && oData.results === undefined ? [oData] : oData.results;
		sComputedTextInEditModeSource = oSmartField._getComputedTextInEditModeSource();

		// SNOW: DINC0420038 out parameters and history should be applied only on user interaction
		if (oOutputData && oValueListProvider && oSettings.userInteractionValue) {
			oValueListProvider._calculateAndSetODataModelOutputData(oOutputData);

			if (sMode === "edit" && !oSettings.initialRendering && sComputedTextInEditModeSource !== TextInEditModeSource.NavigationProperty) {
				oValueListProvider._oHistoryValuesProvider && oValueListProvider._oHistoryValuesProvider.setFieldData([oOutputData]);
			}
		}

		if (!oSettings.initialRendering) { // Ignore model updates and initial rendering
			oSmartField.oValidation.handleValueListWarning(aDataResults);
		}

		if (typeof oSettings.success === "function") {
			bValidValue = oSettings.success(aDataResults);
		}

		if (!bValidValue &&
			sComputedTextInEditModeSource !== TextInEditModeSource.ValueListNoValidation) {
			return;
		}

		if (oSettings.noRebind) {
			return;
		}

		if (oDisplayControl) {
			this._setBindingPath(oSmartField, aDataResults, "text", oDisplayControl);
		}

		if (
			oInputField &&
			oSmartField.isTextInEditModeSourceNotNone("edit")
		) {
			bValueListNoValidation = sComputedTextInEditModeSource === TextInEditModeSource.ValueListNoValidation;
			this._setBindingPath(oSmartField, aDataResults, "value", oInputField, bValueListNoValidation);
		}

	};

	TextArrangementDelegate.prototype.onFetchIDAndDescriptionCollectionError = function(oSettings, oError) {
		if (typeof oSettings.error === "function") {
			oSettings.error(oError);
		}
	};

	TextArrangementDelegate.prototype.bindPropertyForValueList = function(sProperty, oBindingControl, bSkipValidation, bValueListNoValidation) {
		var oSmartField = this.oSmartField,
			oSettings = {},
			oTextArrangementType,
			oBindingInfo,
			oType,
			oKeyType,
			sTextInEditModeSource = oSmartField._getComputedTextInEditModeSource();

		if (
			sTextInEditModeSource === TextInEditModeSource.ValueList || sTextInEditModeSource === TextInEditModeSource.ValueListNoValidation ||
			this.oFactory._bTextInDisplayModeValueList
		) {
			oBindingInfo = oBindingControl && oBindingControl.getBindingInfo(sProperty);

			if (this.oFactory && oBindingInfo) {
				oType = oBindingInfo.type;
				if (oBindingInfo.parts && oBindingInfo.parts[0]) {
					oKeyType = oBindingInfo.parts[0].type;
				}
				// In case improper type is set earlier - try to get the correct one
				if (
					(
						!oType || // We don't have no type
						!oType.isA("sap.ui.comp.smartfield.type.TextArrangement") // Or type is not TextArrangement type
					) &&
					this.oFactory._getTextArrangementType
				) {
					oTextArrangementType = this.oFactory._getTextArrangementType();
					if (oTextArrangementType) {
						oType = oTextArrangementType;
					}
				}

				if (oType) {
					oSettings = {type: oType};
				}

				if (oKeyType) {
					oSettings.keyType = oKeyType;
				}

				oSettings.skipValidation = bSkipValidation;
				oSettings.bValueListNoValidation = bValueListNoValidation;
				oBindingControl.bindProperty(sProperty, this.getBindingInfo(oSettings));
			}
		}
	};

	TextArrangementDelegate.prototype.getUrlParameters = function(oSettings) {
		var aSelect = [oSettings.keyField];

		if (oSettings.descriptionField) {
			aSelect.push(oSettings.descriptionField);
		}

		oSettings.outParams.forEach(function(sOutParam){
			if (aSelect.indexOf(sOutParam) === -1) {
				aSelect.push(sOutParam);
			}
		});

		if (this.oSmartField._getComputedTextInEditModeSource() !== TextInEditModeSource.NavigationProperty) {
			aSelect = oSettings.allFields.map(function (oField) {
				return oField.name;
			});
		}

		return {
			"$select": aSelect.join(","),
			"$top": 2
		};
	};

	TextArrangementDelegate.prototype.getFilters = function(vValue, oSettings) {
		this.destroyFilters();
		var aFilterFields = oSettings.aFilterFields,
			oAdditionalParamFilters;

		if (Array.isArray(aFilterFields) && aFilterFields.length === 1 && Object.keys(oSettings.additionalFilters).length === 0) {
			switch (aFilterFields[0]) {
				case "keyField":
					this.oIDFilter = getIDFilter(vValue, oSettings);
					return [this.oIDFilter];

				case "descriptionField":
					this.oDescriptionFilter = getDescriptionFilter(vValue, oSettings);
					return [this.oDescriptionFilter];

				// no default
			}
		}

		this.oIDFilter = getIDFilter(vValue, oSettings);
		oAdditionalParamFilters = this._getAdditionalFilters(oSettings);

		this.oFilters = new Filter({
			and: true,
			filters: [
				new Filter({
					and:false,
					filters: [
						this.oIDFilter
					]
				})
			]
		});

		if (oAdditionalParamFilters.aFilters.length > 0) {
			this.oFilters.aFilters.push(oAdditionalParamFilters);
		}

		return [ this.oFilters ];
	};

	/**
	 * Sets data for the next description request in one time cache
	 * @param {string} sValue The value of the field which is used for key
	 * @param {object} oData The oData row
	 * @private
	 */
	TextArrangementDelegate.prototype.setDataForNextDescriptionRequest = function (sValue, oData) {
		this._mOneTimeDescriptionCache.set(sValue, oData);
	};

	/**
	 * Retrieves the data for the next description request from the one time cache. Once data for a key
	 * is retrieved it is removed from the cache.
	 * @param {string} sValue The value of the field which is used for key
	 * @returns {object} The cached oData row
	 * @private
	 */
	TextArrangementDelegate.prototype.getDataForNextDescriptionRequest = function (sValue) {
		var oData = this._mOneTimeDescriptionCache.get(sValue);
		this._mOneTimeDescriptionCache.delete(sValue); // One time cache
		return oData;
	};

	function getIDFilter(vValue, oSettings) {
		return new Filter({
			value1: vValue,
			path: oSettings.keyFieldPath,
			operator: FilterOperator.EQ
		});
	}

	 function getDescriptionFilter(vValue, oSettings) {
		return new Filter({
			value1: vValue,
			path: oSettings.descriptionFieldPath,
			operator: FilterOperator.EQ
		});
	}

	TextArrangementDelegate.prototype._getAdditionalFilters = function (oSettings) {
		var aFilters = [],
			oMetadata = this.oSmartField.getControlFactory().getMetaData(),
			oVLData = oMetadata.annotations && oMetadata.annotations.valueListData,
			aVLFields = oVLData && oVLData.fields;

		Object.keys(oSettings.additionalFilters).forEach(function (sFieldName) {
			var vFieldValue = oSettings.additionalFilters[sFieldName],
				oFieldMetadata = aVLFields.find(function (oField) {
					return oField.name === sFieldName;
				}),
				bInitialValueIsSignificant = oVLData.aInitialValueIsSignificantFields.indexOf(sFieldName) !== -1,
				aGeneratedFilters = this._generateFiltersForField(vFieldValue, sFieldName, oFieldMetadata, bInitialValueIsSignificant);

			if (aGeneratedFilters) {
				aFilters.push(aGeneratedFilters);
			}
		}.bind(this));

		return new Filter({
			and: true,
			filters: aFilters
		});
	};

	/**
	 * Generates needed filters for specific filter value
	 * @returns {sap.ui.model.Filter|undefined}
	 * @private
	 */
	TextArrangementDelegate.prototype._generateFiltersForField = function (vValue, sFieldName, oFieldMetadata, bInitialValueIsSignificant) {
		if (vValue === null || vValue === undefined || vValue === "") {
			// If InitialValueIsSignificant annotation is not present and the value is initial we don't generate filters
			if (bInitialValueIsSignificant) {
				// Special handling for empty value additional parameters
				// If vValue is null or empty we might have to generate different filters
				return this._generateFiltersForEmptyField(sFieldName, (oFieldMetadata && oFieldMetadata.nullable === "false"));
			}
		} else {
			// This is the standard scenario where we have a value
			return new Filter({
				value1: vValue,
				path: sFieldName,
				operator: FilterOperator.EQ
			});
		}
	};

	/**
	 * Generate filter for empty ValueListParameterIn field.
	 * @returns {sap.ui.model.Filter}
	 * @private
	 */
	TextArrangementDelegate.prototype._generateFiltersForEmptyField = function (sFieldName, bNotNullable) {
		// For nullable=false field we only filter for initial value -> empty string
		// we should not send null to the backend in this case.
		if (bNotNullable) {
			return new Filter({
				value1: "",
				path: sFieldName,
				operator: FilterOperator.EQ
			});
		}

		// For nullable=true fields we have to filter for both initial value and null
		// as the UI does not distinguish by these two values and they are both
		// valid for empty Edm.String property in the backend.
		return new Filter([
				new Filter({
					value1: "",
					path: sFieldName,
					operator: FilterOperator.EQ
				}),
				new Filter({
					value1: null,
					path: sFieldName,
					operator: FilterOperator.EQ
				})
			],
			false
		);
	};

	TextArrangementDelegate.prototype.destroyFilters = function() {

		if (this.oIDFilter) {
			this.oIDFilter.destroy();
			this.oIDFilter = null;
		}

		if (this.oDescriptionFilter) {
			this.oDescriptionFilter.destroy();
			this.oDescriptionFilter = null;
		}

		if (this.oFilters) {
			this.oFilters.destroy();
			this.oFilters = null;
		}
	};

	TextArrangementDelegate.prototype.destroy = function() {
		this.oSmartField = null;
		this.bValidMetadata = false;
		this.sBindingContextPath = "";
		this.sAbsolutePathToVLProperty = "";
		this._mOneTimeDescriptionCache = null;
		this._mTextArrangementLastReadAdditionalFilters = null;
		this.destroyFilters();
	};

	return TextArrangementDelegate;
});
