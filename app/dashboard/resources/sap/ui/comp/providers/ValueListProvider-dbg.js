/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// -----------------------------------------------------------------------------
// Retrieves the data for a value list from the OData metadata to bind to a given control/aggregation
//
// -----------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/core/Lib",
	'sap/ui/core/library',
	'sap/ui/comp/library',
	'sap/m/library',
	'sap/ui/comp/odata/MetadataAnalyser',
	'sap/ui/comp/util/DateTimeUtil',
	'sap/ui/core/SeparatorItem',
	'sap/m/GroupHeaderListItem',
	'sap/m/Column',
	'sap/m/ColumnListItem',
	'sap/m/Text',
	'sap/m/Token',
	'./BaseValueListProvider',
	'sap/ui/core/ListItem',
	'sap/ui/model/Filter',
	'sap/ui/model/Sorter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/FilterOperator',
	'sap/ui/comp/util/FormatUtil',
	'sap/ui/comp/historyvalues/HistoryValuesProvider',
	'sap/ui/comp/historyvalues/HistoryOptOutProvider',
	'sap/ui/comp/historyvalues/Constants',
	'sap/m/ComboBox',
	'sap/m/MultiComboBox',
	'sap/m/Select',
	'sap/base/util/deepEqual',
	'sap/ui/Device',
	'sap/base/Log',
	'sap/base/util/values',
	'sap/m/Label',
	'sap/base/strings/whitespaceReplacer',
	"sap/ui/comp/smartfilterbar/FilterProviderUtils",
	"sap/base/util/Deferred"
], function(Library, coreLibrary, library, mLibrary, MetadataAnalyser, DateTimeUtil, SeparatorItem, GroupHeaderListItem, Column, ColumnListItem, Text, Token, BaseValueListProvider, ListItem, Filter, Sorter, JSONModel, FilterOperator, FormatUtil, HistoryValuesProvider, HistoryOptOutProvider, HistoryConstants, ComboBox, MultiComboBox, Select, deepEqual, Device, Log, values, Label, whitespaceReplacer, FilterProviderUtils, Deferred) {
	"use strict";

	// shortcut for sap.ui.comp.smartfilterbar.DisplayBehaviour
	var DisplayBehaviour = library.smartfilterbar.DisplayBehaviour;

	// shortcut for sap.m.PopinDisplay
	var PopinDisplay = mLibrary.PopinDisplay;

	var WrappingType = mLibrary.WrappingType;

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	var SymbolValidationWarningMessage = Library.getResourceBundleFor("sap.ui.comp").getText("SEARCH_FIELD_VALIDATION_WARNING_MESSAGE");

	var HEADER_GROUPS = {
		Recommendations: 10,
		RecentlyUsed: 20,
		Others: 30
	};
	var SUGGESTIONS_MODEL_NAME = "list";

	/**
	 * Retrieves the data for a collection from the OData metadata to bind to a given control/aggregation
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @private
	 * @param {object} mParams - map containing the control,aggregation,annotation and the oODataModel
	 * @param {string} mParams.aggregation - name of the control aggregation which shows the value list (items or suggestRows)
	 * @param {boolean} mParams.typeAheadEnabled - enable typeAhead (default false)
	 * @param {boolean} [mParams.enableShowTableSuggestionValueHelp] - makes the Show More on the suggest drop down visible (default true)
	 * @param {} mParams.dropdownItemKeyType - type of the suggest item key part
	 * @param {} mParams.deferredGroupId
	 * @param {string} [mParams.context] context for which ValueListProvider is initiated. For example: "SmartFilterBar", "SmartField", "ValueHelp" ...
	 * @author SAP SE
	 */
	var ValueListProvider = BaseValueListProvider.extend("sap.ui.comp.providers.ValueListProvider", {
		constructor: function(mParams) {
			if (mParams) {
				this.sAggregationName = mParams.aggregation;
				this.bTypeAheadEnabled = !!mParams.typeAheadEnabled;
				this.bEnableShowTableSuggestionValueHelp = mParams.enableShowTableSuggestionValueHelp === undefined ? true : mParams.enableShowTableSuggestionValueHelp;
				this.dropdownItemKeyType = mParams.dropdownItemKeyType;
				this.sDeferredGroupId = mParams.deferredGroupId;
				this._fieldHistoryEnabled = mParams.fieldHistoryEnabled;
				this._fieldHistoryEnabledInitial = mParams.fieldHistoryEnabledInitial;
				this._bSuggestionsEnabled = this._getSuggestionsEnabled();
				this.bShowAllSuggestionsButton = mParams.bShowAllSuggestionsButton;
			}
			this._aRecommendations = [];
			this._oRecommendationListPromise = Promise.resolve();
			this._oResourceBundle = Library.getResourceBundleFor("sap.ui.comp");
			this._groupHeaderFactory = this._groupHeaderFactory.bind(this);
			this._pendingValidationCount = 0;

			this._bConsiderPresentationVariant =
				typeof mParams.considerPresentationVariant === "undefined" ? true : mParams.considerPresentationVariant;

			BaseValueListProvider.apply(this, arguments);
			this._onInitialise();
		}
	});


	/**
	 * Initialise the relevant stuff
	 *
	 * @private
	 */
	ValueListProvider.prototype._onInitialise = function() {
		if (!this.bTypeAheadEnabled) {

			/**
			 * Delay the fetch of data for standard dropdowns until the rendering is done! This inherently causes only the relevant data to be fetched
			 * from the backend!
			 */
			this.oAfterRenderingEventDelegate = {
				onAfterRendering: this._onMetadataInitialised
			};
			this.oControl.addEventDelegate(this.oAfterRenderingEventDelegate, this);

		} else if (this.oControl.attachSuggest) {

			// Check if Suggest is supported by the control
			this._fSuggest = function(oEvent) {
				this.oControl = oEvent.getSource();
				if (!this.bInitialised) {
					return;
				}
				// if _disableSearchMatchesPatternWarning is false and input contains special symbol not call backend for suggestions
				if (!this.isDisableSearchMatchesPatternWarning() && this.oControl.getValueState && this.oControl.getValueState() === ValueState.Warning &&
					this.oControl.getValueStateText && this.oControl.getValueStateText()  === SymbolValidationWarningMessage) {
					return;
				}

				if (!this._oTemplate || !this.oControl.data("_hassuggestionTemplate")) {
					this._createSuggestionTemplate();
				}
				var sSearchText = oEvent.getParameter("suggestValue");
				this._fetchData(sSearchText);
			}.bind(this);
			this.oControl.attachSuggest(this._fSuggest);

			if (!this.oFilterModel) {
				var that = this;

				// store original reference to the ManagedObject.prototype.setParent() method
				var fnSetParent = this.oControl.setParent;

				// decorate the .setParent() method of the this.oControl control instance to detect when the control is removed
				// from the control tree
				this.oControl.setParent = function(oNewParent, sAggregationName, bSuppressInvalidate) {

					// get the current parent
					var oOldParent = this.getParent();

					// call the ManagedObject.prototype.setParent() method with the same arguments passed to this function
					var oReturn = fnSetParent.apply(this, arguments);

					// get the possible new parent
					oNewParent = this.getParent();

					var bAggregationChanged = !(oNewParent && (oOldParent === null));

					// unbind the aggregation only if the parent changes
					if ((oNewParent !== oOldParent) && bAggregationChanged) {
						that.unbindAggregation();
					}

					return oReturn;
				};
			}

			this._handleSelect();
		}

		this.oControl.setModel(new JSONModel(), SUGGESTIONS_MODEL_NAME);
		this._setupHistoryValues();
		this._setupRecommendations();
	};

	/**
	 * Metadata is available --> Initialise the relevant stuff
	 *
	 * @private
	 */
	ValueListProvider.prototype._onMetadataInitialised = function() {
		if (this.bInitialised) {

			if (this.oAfterRenderingEventDelegate) {
				this.oControl.removeEventDelegate(this.oAfterRenderingEventDelegate);
			}

			if (this.oPrimaryValueListAnnotation) {
				this._oPresentationVariant = this._handlePresentationVariantSortOrderAnnotation();

				if (this.sAggregationName && this.sAggregationName == "suggestionRows") {
					this._createSuggestionTemplate();
				} else {
					this._createDropDownTemplate();
				}
				this._fetchData();

				// add handler for fixed-values with InOut Parameters
				if (this._isControlDropdown()) {
					if (this.mOutParams && Object.keys(this.mOutParams).length > 1) {
						this._handleOutParameters();
					}
					if (this.mInParams && Object.keys(this.mInParams).length > 1) {
						this._handleInParameters();
					}
				}
			} else {
				Log.error("ValueListProvider", "Missing primary ValueListAnnotation for " + (this._sFullyQualifiedFieldName || this.sFieldName));
			}

			if (this.oAfterRenderingEventDelegate) {
				delete this.oAfterRenderingEventDelegate;
			}
		}
	};

	ValueListProvider.prototype._onAnnotationLoad = function (mValueList) {
		var oAnnotation = BaseValueListProvider.prototype._onAnnotationLoad.call(this, mValueList);
		if (!this._isControlSupportedForHistory(this.oControl)) {
			return oAnnotation;
		}

		if (this._shouldHaveRecommendations() || this._shouldHaveHistory()) {
			this._setupSuggestionInteractions();
		}

		if (this.sContext === "SmartFilterBar" && this._hasNotValidatedSingleField(this.sFieldName)) {
			this._validateInput(this.oFilterProvider._oNotValidatedSingleFields[this.sFieldName], undefined, true);
			this.oFilterProvider._oNotValidatedSingleFields[this.sFieldName] = "";
		}

		return oAnnotation;
	};

	ValueListProvider.prototype._isSortable = function(sName) {
		if (this.oPrimaryValueListAnnotation) {
			for (var i = 0; i < this.oPrimaryValueListAnnotation.valueListFields.length; i++) {
				if (this.oPrimaryValueListAnnotation.valueListFields[i].name === sName) {
					return this.oPrimaryValueListAnnotation.valueListFields[i].sortable !== false;
				}
			}

			return false;
		}

		return false;
	};

	/**
	 * Creates a template for drop down fields
	 *
	 * @private
	 */
	ValueListProvider.prototype._createDropDownTemplate = function() {
		if (this.dropdownItemKeyType && this.dropdownItemKeyType.oFormatOptions) {
			this.dropdownItemKeyType.oFormatOptions.bFixedKey = true;
		}

		var aTextParts = [
				{
					path: this._resolveSuggestionBindingPath(this.sKey),
					type: this.dropdownItemKeyType
				}
			],
			sDDLBDisplayBehaviour = this.sValueListsDDLBDisplayBehaviour || this.sDDLBDisplayBehaviour,
			oControlRealValueType = this.oControl.getBinding("realValue") && this.oControl.getBinding("realValue").getType();

		if (this.oControl.isA("sap.ui.comp.IDropDownTextArrangement") &&
			this.sValueListsDDLBDisplayBehaviour &&
			this.sValueListsDDLBDisplayBehaviour !== this.sDDLBDisplayBehaviour) {
			this.oControl.setTextArrangement(this.sDDLBDisplayBehaviour);
		}

		if (this.sDescription) {
			aTextParts.push({
				path: this._resolveSuggestionBindingPath(this.sDescription)
			});
		}
		if (this.sContext === "SmartField" && MetadataAnalyser.getIsTimezoneProperty(this._fieldViewMetadata)) {
			this._oTemplate = new ListItem({
				key: {
					path: this._resolveSuggestionBindingPath(this.sKey),
					parts :  [{value : null}, {path : this._resolveSuggestionBindingPath(this.sKey)}],
					type : this.dropdownItemKeyType || oControlRealValueType
				},
				text: {
					parts :  [{value : null}, {path : this._resolveSuggestionBindingPath(this.sKey)}],
					type : this.dropdownItemKeyType || oControlRealValueType
				}
			});
		} else {
			this._oTemplate = new ListItem({
				key: {
					path: this._resolveSuggestionBindingPath(this.sKey),
					type : this.dropdownItemKeyType
				},
				text: {
					parts: aTextParts,
					formatter: function(sKey, sDescription) {
						var fnFormatter = FormatUtil.getFormatterFunctionFromDisplayBehaviour(sDDLBDisplayBehaviour),
							sItemText = fnFormatter(sKey, sDescription);

						return whitespaceReplacer(sItemText);
					}
				}
			});
		}

		if (this._oRecommendationListAnnotation) {
			this._oTemplate.bindProperty("additionalText", {
				path: this._resolveSuggestionBindingPath(this._oRecommendationListAnnotation.rankProperty)
			});
		}

		this._oSorter = null;
		var bKeyIsSortable = this._isSortable(this.sKey),
			bDescriptionIsSortable =  this._isSortable(this.sDescription);

		if (this._oPresentationVariant) {
			if (this._oPresentationVariant._bIsPresentationVariantSortPathInVHDEntityType && this._oPresentationVariant._bIsPresentationVariantSortOrderPropertySortable) {
					this._oSorter = new Sorter(this._oPresentationVariant.sPresentationVariantSortPath, this._oPresentationVariant.sortOrderFields[0].descending);
			} else {
				Log.error("ValueListProvider", "Is Presentation Variant SortOrder property path part of EntityType = " + this._oPresentationVariant._bIsPresentationVariantSortPathInVHDEntityType + ". Is property sortable =" + this._oPresentationVariant._bIsPresentationVariantSortOrderPropertySortable);
			}
		} else {
			// ComboBox/MultiComboBox:
			// Sort based on key if displayBehaviour is based on id
			if (this.sDDLBDisplayBehaviour === DisplayBehaviour.idOnly || this.sDDLBDisplayBehaviour === DisplayBehaviour.idAndDescription || this.sDDLBDisplayBehaviour === DisplayBehaviour.descriptionAndId) {
				if (bKeyIsSortable) {
					this._oSorter = new Sorter(this.sKey);
				}
			} else {
				// Sort based on description by default
				if (bDescriptionIsSortable) {
					this._oSorter = new Sorter(this.sDescription);
				} else if ((this.sDescription !== this.sKey) && bKeyIsSortable) {
					this._oSorter = new Sorter(this.sKey);
				}
			}
		}
	};

	/**
	 * Creates a template for multi-column suggest
	 *
	 * @private
	 */
	ValueListProvider.prototype._createSuggestionTemplate = function() {
		var i = 0, iLen = 0, fSuggestWidth = 0,
			aCols = this._aHighImportanceCols || this._aRecommendationCols || this._aCols,
			oTextBinding;
		// Create a template
		this._oTemplate = new ColumnListItem();
		if (aCols) {
			// remove any exiting columns
			this.oControl.removeAllSuggestionColumns();
			iLen = aCols.length;
			for (i = 0; i < iLen; i++) {
				var bDemandPopin = false, sMinScreenWidth = "1px", sWidth = aCols[i].suggestionsWidth;
				// In the phone mode don't set a fixed width for columns;
				// instead enable demand popin when there are over 2 columns, and not enough space
				if (Device.system.phone) {
					sWidth = undefined;
					if (i >= 2) {
						bDemandPopin = true;
						sMinScreenWidth = (i + 1) * 10 + "rem";
					}
				}
				// add Column headers
				this.oControl.addSuggestionColumn(new Column({
					header: new Label({
						wrapping: true,
						wrappingType: WrappingType.Hyphenated,
						text: aCols[i].label
					}),
					demandPopin: bDemandPopin,
					popinDisplay: PopinDisplay.Inline,
					minScreenWidth: sMinScreenWidth,
					width: sWidth
				}));

				if (aCols[i].isTimezone) {
					oTextBinding = {
						path: this._resolveSuggestionBindingPath(aCols[i].template),
						parts :  [{value : null}, {path : this._resolveSuggestionBindingPath(aCols[i].template)}],
						type : aCols[i].oType
					};
				} else {
					oTextBinding = {
						path: this._resolveSuggestionBindingPath(aCols[i].template),
						type: aCols[i].oType,
						formatter: function(sInput) {
							return whitespaceReplacer(sInput);
						}
					};
				}

				if (Array.isArray(aCols[i].template)) {
					oTextBinding = {
						parts: [
							{
								path: this._resolveSuggestionBindingPath(aCols[i].template[0])
							}, {
								path: this._resolveSuggestionBindingPath(aCols[i].template[1])
							}
						],
						formatter: function(sDisplayBehaviour, sKey, sDescription) {
							var fnFormatter = FormatUtil.getFormatterFunctionFromDisplayBehaviour(sDisplayBehaviour),
								sItemText = fnFormatter(sKey, sDescription);

							return whitespaceReplacer(sItemText);
						}.bind(this, aCols[i].displayBehaviour)
					};
				}

				// Add cells to the template
				this._oTemplate.addCell(new Label({
					wrapping: true,
					text: oTextBinding
				}));

				// we calculate the sum of all columns width (assumption is that the sWidth is always given in em)
				if (sWidth) {
					fSuggestWidth += parseFloat(sWidth.substring(0, sWidth.length - 2));
				}
			}

			// set the total width of all columns as Width for the suggest popover.
			// Add a small delta based on number of columns since there seems to be a padding added for some browsers
			if (fSuggestWidth > 0) {
				// BCP: 1770294638
				// this.oControl.setMaxSuggestionWidth(fSuggestWidth + iLen + "em");
				this.oControl.setProperty('maxSuggestionWidth', fSuggestWidth + iLen + "em", true);
			}

			if (iLen === 1) {
				this.oControl._setSeparateSuggestions(false);
			}
		}
		this.oControl.data("_hassuggestionTemplate", true);

		// add CSS to the table to override styles for the dummy cell introduced from it
		if (this.oControl && this.oControl._oSuggestionTable) {
			this.oControl._oSuggestionTable.addStyleClass("sapUiCompValueListProviderTable");
		}
	};

	/**
	 * @private
	 */
	ValueListProvider.prototype._handleRowSelect = function(oDataModelRow, fCallback, oDataContext) {
		var sKey, sText, oToken, sAbsolutePathToVLProperty = oDataContext && typeof oDataContext.getPath === "function" && oDataContext.getPath() || "";
		if (oDataModelRow) {
			sKey = oDataModelRow[this.sKey];
			sText = oDataModelRow[this.sDescription];
		}
		// Key found
		if (sKey || (sKey === "")) {
			// MultiInput field --> Create a token with the selected key
			if (this.oControl.addToken) {
				// Format the text as per the displayBehaviour
				sText = whitespaceReplacer(FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.sTokenDisplayBehaviour, sKey, sText));
				oToken = new Token();
				oToken.setKey(sKey);
				oToken.setText(sText);
				oToken.setTooltip(sText);
				oToken.data("row", oDataModelRow);
				if (this.oControl.getMetadata() && this.oControl.getMetadata()?.getName() === 'sap.ui.comp.smartfilterbar.SFBMultiInput') {
					oToken.getTextForCopy = this.oControl._getTextForCopy.bind(this.oControl, oToken);
				}
				if (fCallback) {
					fCallback(oToken);
				}

				// BCP: 1980361768 Upon creating the token from suggest sometimes the model binding is not updated when
				// the element in the suggest is highlighted and than the focus moves -> a token is created but the value
				// in the model is not reset to an empty string. By setting the value again in this case we force the
				// control to update the model.
				// Note: This should be removed only when the issue is fully resolved by the MultiInput control.
				if (this.oControl.getValue() === "") {
					this.oControl.setValue("");
				}

				// Clear the ValidationText
				delete this.oControl.__sValidationText;
			} else {
				// Provide data row as to skip backend request for description from SmartField
				if (this.sContext === "SmartField" && this._selectedODataRowHandler) {
					this._selectedODataRowHandler(sKey, oDataModelRow, sAbsolutePathToVLProperty);
				}

				// normal input field --> just set the value
				this.setValue(sKey);

				if (this.sContext === "SmartFilterBar" || this.sContext === "mdcFilterPanel") {
					this.oControl.setValue(FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.sSingleFieldDisplayBehaviour, sKey, sText));
					this.oControl.setValueState("None");
					this.oFilterProvider.oModel.setProperty("/" + this.sFieldName, sKey);
					this.oFilterProvider._setSingleInputsTextArrangementFieldData(this.sFieldName, sKey, sText);

					if (!this.oFilterProvider._oSingleFieldSetFromFilterData[this.sFieldName]) {
						this.oControl.fireChange({
							value: sKey,
							validated: true
						});
					}
					delete this.oFilterProvider._oSingleFieldSetFromFilterData[this.sFieldName];
				}

				if (this.sContext !== "SmartFilterBar") {
					// Manually trigger the change event on sapUI5 control since it doesn't do this internally on setValue!
					this.oControl.fireChange({
						value: sKey,
						validated: true
					});
				}
			}
		}

		// do this last --> since when used in an aggregation - some model updates (setting IN/OUT params to ODataModel) destroy this
		// instance/control!
		if (this.fnAsyncWritePromise) {
			// In case of SmartField with TextArrangement we have to account for asynchronous write to the model of the
			// main property before we apply the out parameters.
			this.fnAsyncWritePromise().then(this._calculateAndSetFilterOutputData.bind(this, [oDataModelRow]));
		} else {
			this._calculateAndSetFilterOutputData([oDataModelRow]);
		}
	};

	/**
	 * @private
	 */
	ValueListProvider.prototype._multiInputValidator = function(oData) {
		if (!this.bInitialised) {
			return;
		}

		// queue the validator calls
		if (this._aValidators) {
			var oToken;
			this._aValidators.some(function(fValidator) {
				oToken = fValidator(oData);
				return oToken;
			}, this);

			if (oToken) {
				return oToken;
			}
		}

		var oRow = oData.suggestionObject, oDataModelRow, sInput = oData.text;
		// Selection via suggestion row --> no round trip needed
		if (oRow) {
			// Get the actual datamodel row
			// BCP: 0020751294 0000254992 2019
			// because the this.oOdataModel instance can be old and the controls has a different model attached,
			// we always have to fetch the Data from the current model attached to the control/row.
			var sModelName = this._getSuggestionsModelName(),
				oBindingContext = oRow.getBindingContext(sModelName);
			oDataModelRow = oBindingContext.getObject();
			this._handleRowSelect(oDataModelRow, oData.asyncCallback, oBindingContext);
		} else if (sInput) {
			// Validation required from backend
			this._validateInput(sInput, oData.asyncCallback);
		}
	};

	ValueListProvider.prototype._resetErrorState = function() {
		if (this.oControl.data("__validationError")) {
			this.oControl.data("__validationError", null);
			this.oControl.setValueStateText("");
			this.oControl.setValueState("None");
		}
	};

	ValueListProvider.prototype._setErrorState = function() {
		this.oControl.setValueStateText(this._oResourceBundle.getText("VALUELIST_NOT_UNIQUE_ERROR"));
		this.oControl.setValueState(ValueState.Error);
		this.oControl.data("__validationError", true);
	};

	ValueListProvider.prototype._onFilterError = function(fnResolve, bSkipAfterTokenValidate) {
		// Clear previous validation error state if current validation fails!
		this._resetErrorState();

		// Remove the token validation flag
		delete this.oControl.__bValidatingToken;
		// Trigger after token validation handling
		if (!bSkipAfterTokenValidate) {
			this._afterTokenValidate();
		}
		fnResolve();
	};

	ValueListProvider.prototype._onFilterSuccess = function(oResponseData, fAsyncCallback, fnResolve, bSkipAfterTokenValidate, bIsTextOnly, aFilters, mParams) {
		var oFilterByTextPromise,
			oResultRow = oResponseData;

		if (!this.oControl || (!this._pendingValidationCount && !this.oControl.hasOwnProperty("__bValidatingToken"))) {
			// ignore the result completely
			return;
		}
		// first remove the token validation flag
		delete this.oControl.__bValidatingToken;
		this._pendingValidationCount--;

		if (oResponseData) {

			// handle response for creating tokens only if 1 unique result exists!
			if (oResponseData.results?.length === 1) {

				oResultRow = oResponseData.results[0];

				this._resetErrorState();

			} else if (bIsTextOnly && this.sContext === "SmartFilterBar") {

					this._pendingValidationCount++;

					oFilterByTextPromise = new Promise(function (fnResolve, fnReject) {
						this.oODataModel.read("/" + this.sValueListEntitySetName, {
							filters: aFilters,
							urlParameters: mParams,
							success: function(oRespData) {
								this._onFilterSuccess(oRespData, fAsyncCallback, fnResolve, bSkipAfterTokenValidate);
							}.bind(this),
							error: function () {
								this._onFilterError(fnResolve, bSkipAfterTokenValidate);
							}.bind(this)
						});
					}.bind(this));

					this._removeValidationPromise(this._aValidationPromises.length - 1);
					this._addValidationPromise(oFilterByTextPromise);

			} else if (!bIsTextOnly && oResponseData.results?.length > 1) {

				if (this.sContext === "SmartFilterBar" && this._fieldViewMetadata.filterRestriction === "single") {
					if (oResponseData.results.length > 1) {
						// In case of SmartFilterbar and single field if more results than one are returned, this means
						// that more results have the same value for the key field used for the valuelist.
						// This could happen if the uniqueness of an item is determined by several fields.
						// In other words there are more than one key fields for this entity type.
						// In this case we just update the model with the current value, but do not select any row.
						this.oFilterProvider.oModel.setProperty("/" + this.sFieldName, oResponseData.results[0][this.sKey]);
					}
					if (!oResultRow.results) {
						this._oHistoryValuesProvider && this._oHistoryValuesProvider.setFieldData([oResultRow]);
					}
				}
				this._resetErrorState();
			} else {
				this._setErrorState();
			}

			// If returned row has the key do the selection!
			if (oResultRow && oResultRow[this.sKey]) {
				// BCP: 2070305180 - do not fire change event during token auto-generation
				this.oControl._pendingAutoTokenGeneration = true;
				this._handleRowSelect(oResultRow, fAsyncCallback);
				this.oControl._pendingAutoTokenGeneration = false;
			}
		}

		// Trigger after token validation handling
		if (!bSkipAfterTokenValidate) {
			this._afterTokenValidate();
		}
		fnResolve();
	};

	/**
	 * @private
	 */
	ValueListProvider.prototype._validateInput = function (sInput, fAsyncCallback, bSkipAfterTokenValidate) {
		var oValidationPromise,
			aFilters = [],
			oControl = this.oControl,
			mParams,
			sFilterFieldPath,
			bIsTextOnly = false;

		// Check if input needs to be converted to upper case
		if (this.sDisplayFormat === "UpperCase") {
			sInput = sInput.toUpperCase();
		}

		// Check if the entered input text is same as the ValidationText
		if (oControl.__sValidationText !== sInput) {
			// Store the input as Validation text
			oControl.__sValidationText = sInput;

			if (sInput === this._truncateSearchText(sInput)) {
				// Set flag to indicate token validation is in progress
				oControl.__bValidatingToken = true;
				this._calculateFilterInputData();
				if (this.mFilterInputData && this.aFilterField) {
					const mParams = {
						dateSettings: this._oDateFormatSettings
					};

					if (this.oFilterProvider) {
						mParams.useContainsAsDefault = this.oFilterProvider._bUseContainsAsDefault;
						mParams.stringFields = this.oFilterProvider._aFilterBarStringFieldNames;
						mParams.timeFields = this.oFilterProvider._aFilterBarTimeFieldNames;
						mParams.dateTimeOffsetValueFields = this.oFilterProvider._aFilterBarDateTimeFieldNames;
						mParams.dateTimeOffsetWithTimeZone = this.oFilterProvider._aFilterBarDateTimeOffsetWithTimezoneFieldNames;
						mParams.viewMetadataData = this.oFilterProvider._aFilterBarViewMetadata;
					}
					aFilters = FilterProviderUtils.generateFilters(this.aFilterField, this.mFilterInputData, mParams);
				}

				if (
					this._getDisplayBehaviour() === "descriptionOnly" &&
					this.sDescription &&
					this.sContext === "SmartFilterBar"
				){
					sFilterFieldPath = this.sDescription;
					bIsTextOnly = true;
				} else {
					sFilterFieldPath = this.sKey;
				}

				aFilters.push(new Filter(sFilterFieldPath, FilterOperator.EQ, sInput));
				if (this.bSupportBasicSearch) {
					mParams = {
						"search-focus": sFilterFieldPath
					};
				}

				if (!fAsyncCallback) {
					// In case of multiinput multi token paste we want to skip the abort
					// because the tokens won't be created. This is valid for SmartMultiInput usecase
					this._abortPendingValidations();
				}

				this._pendingValidationCount++;

				oValidationPromise = new Promise(function (fnResolve, fnReject) {
					this._oValidationRead = this.oODataModel.read("/" + this.sValueListEntitySetName, {
						filters: aFilters,
						urlParameters: mParams,
						success: function(oRespData) {
							if (bIsTextOnly && oRespData.results?.length !== 1) {
								aFilters.splice(aFilters.length - 1, 1, new Filter(this.sKey, FilterOperator.EQ, sInput));
							}
							this._onFilterSuccess(oRespData, fAsyncCallback, fnResolve, bSkipAfterTokenValidate, bIsTextOnly, aFilters, mParams);

						}.bind(this),
						error: function () {
							this._onFilterError(fnResolve, bSkipAfterTokenValidate);
						}.bind(this)
					});
				}.bind(this));

				this._addValidationPromise(oValidationPromise);

			} else if (this.sContext === "SmartFilterBar" && this._fieldViewMetadata.filterRestriction === "single") {
				this._setErrorState();
			}
		} else {
			// Re-set the error state if same value is entered again!
			if (oControl.data("__validationError")) {
				this._setErrorState();
			}
		}
	};

	ValueListProvider.prototype._fetchSingleFieldDescription = function (sInput) {
		var aFilters = [],
			mParams;

		if (this.sDisplayFormat === "UpperCase") {
			sInput = sInput.toUpperCase();
		}

		if (sInput === this._truncateSearchText(sInput)) {
			this._calculateFilterInputData();
			if (this.mFilterInputData && this.aFilterField) {
				aFilters = FilterProviderUtils.generateFilters(this.aFilterField, this.mFilterInputData);
			}

			aFilters.push(new Filter(this.sKey, FilterOperator.EQ, sInput));
			if (this.bSupportBasicSearch) {
				mParams = {
					"search-focus": this.sKey
				};
			}

			this._abortPendingValidations();

			this._oSingleFieldDescriptionRead = this.oODataModel.read("/" + this.sValueListEntitySetName, {
				filters: aFilters,
				urlParameters: mParams,
				success: function (oResponseData) {
					if (!this.oControl) {
						return;
					}

					if (oResponseData?.results && oResponseData?.results?.length === 1) {
						if (this.oControl.data("__validationError")) {
							this.oControl.data("__validationError", null);
							this.oControl.setValueState("None");
						}
						var oResultRow = oResponseData.results[0],
							sKey = oResultRow[this.sKey],
							sText = oResultRow[this.sDescription];

						Promise.all(this._aValidationPromises).then(() => {
								this.oControl.setValue(FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.sSingleFieldDisplayBehaviour, sKey, sText));
								this.oFilterProvider.oModel.setProperty("/" + this.sFieldName, sKey);
							}
						);
					} else {
						this.oControl.setValueState("Error");
						this.oControl.data("__validationError", true);
					}
				}.bind(this)
			});
		}
	};

	/**
	 * This method is used to validate string single field with value list
	 * @private
	 */
	ValueListProvider.prototype._validateStringSingleWithValueList = function (oEvent) {
		var sValue,
			aResult;

		// In case the event object is already validated (from suggest row) we don't do any further validation
		if (oEvent.getParameter("validated")) {
			return;
		}

		// In case the value is equal to empty string or it is undefined we don't do any further validation
		sValue = oEvent.getParameter("value");
		if (sValue === "" || sValue === undefined) {
			return;
		}

		if (this.sSingleFieldDisplayBehaviour === "idAndDescription") {
			aResult = /^([\S\s]+?)\s\([\S\s]+\)$/.exec(sValue);
		} else if (this.sSingleFieldDisplayBehaviour === "descriptionAndId") {
			aResult = /^[\S\s]+\s\(([\S\s]+?)\)$/.exec(sValue);
		}

		if (Array.isArray(aResult) && aResult[1]) {
			sValue = aResult[1];
		}

		this._validateInput(sValue);
	};

	ValueListProvider.prototype._abortPendingValidations = function () {
		if (this._oSingleFieldDescriptionRead?.abort) {
			this._oSingleFieldDescriptionRead.abort();
		}

		if (this._oValidationRead?.abort && this._pendingValidationCount > 0) {
			this._oValidationRead.abort();
			this._pendingValidationCount--;
		}
	};

	/**
	 * @private
	 */
	ValueListProvider.prototype._afterTokenValidate = function() {
		// trigger search on the SmartFilter if search was pending
		if (this.oFilterProvider && this.oFilterProvider._oSmartFilter && this.oFilterProvider._oSmartFilter.bIsSearchPending && this.oFilterProvider._oSmartFilter.search) {
			if (this.oFilterProvider._oSmartFilter.getLiveMode && this.oFilterProvider._oSmartFilter.getLiveMode()) {
				return;
			}

			this.oFilterProvider._oSmartFilter.search();
		}
	};

	/**
	 * @private
	 */
	ValueListProvider.prototype._onSuggestionItemSelected = function(oEvent) {
		var oDataContext,
			oRow = oEvent.getParameter("selectedRow");
		// MultiColumn Suggest
		if (oRow) {
			// Get the actual data model row
			var sModelName = this._getSuggestionsModelName();
			oDataContext = oRow.getBindingContext(sModelName);
			this._handleRowSelect(oDataContext.getObject(), null, oDataContext);
		}
	};

	ValueListProvider.prototype._setFilterOutputDataFromSelectedRow = function(oRow) {
		var sModelName, oBindingContext, oDataModelRow;
		if (oRow) {
			// Get the actual data model row
			sModelName = this._getSuggestionsModelName();
			oBindingContext = oRow.getBindingContext(sModelName);
			oDataModelRow = oBindingContext.getObject();
			this._calculateAndSetFilterOutputData([
				oDataModelRow
			]);
		}
	};

	/**
	 * Called when MultiComboBox selectionChange is fired to handle Out parameters
	 * @private
	 */
	ValueListProvider.prototype._onMultiComboBoxItemSelected = function(oEvent) {

		// For MultiComboBox when item is deselected do not set filter output data
		if (!oEvent.getParameter("selected")) {
			return;
		}

		var oRow = oEvent.getParameter("changedItem");

		this._setFilterOutputDataFromSelectedRow(oRow);
	};

	/**
	 * Called when ComboBox change event is fired to handle Out parameters
	 * @private
	 */
	ValueListProvider.prototype._onComboBoxItemSelected = function(oEvent) {
		var sValue = oEvent.getParameter("value"),
			sNewValue = oEvent.getParameter("newValue"),
			sFilterChangeReason = oEvent.getParameter("filterChangeReason");

		// When ComboBox is used in SmartFilterBar, the Change event is fired by the SelectionChange event in FIlterProvider
		// In that case do not set filter output data
		if (sFilterChangeReason && !sValue && !sNewValue) {
			return;
		}

		var oRow = this.oControl.getSelectedItem();

		this._setFilterOutputDataFromSelectedRow(oRow);
	};

	/**
	 * Handle validation/selection of Item
	 *
	 * @private
	 */
	ValueListProvider.prototype._handleSelect = function() {
		// Selection handling has to be done manually for Multi-Column suggest!
		// add Validators --> Only available for Multi-Input
		if (this.oControl.addValidator) {
			this._aValidators = this.oControl && this.oControl.isA('sap.m.MultiInput') ? this.oControl.getValidators().slice() : [];
			this.oControl.removeAllValidators();

			this._fValidator = this._multiInputValidator.bind(this);
			this.oControl.addValidator(this._fValidator);
		} else if (this.oControl.attachSuggestionItemSelected) {
			// Single-Input --> just enable selection handling
			this.oControl.attachSuggestionItemSelected(this._onSuggestionItemSelected, this);
		}
		// custom result filter function for tabular suggestions - selection text;
		// the returned result will be shown on the input when the user uses the arrow key on suggest
		if (this.oControl.setRowResultFunction) {
			this.oControl.setRowResultFunction(function (oSelectedItem) {
				var oContext, sResult = "", sModelName = this._getSuggestionsModelName();
				if (oSelectedItem) {
					oContext = oSelectedItem.getBindingContext(sModelName);
				}
				if (oContext && this.sKey) {
					sResult = oContext.getProperty(this.sKey);
				}
				if (sResult && this.sContext == "SmartField" && MetadataAnalyser.getIsTimezoneProperty(this._fieldViewMetadata)) {
					sResult = this.oControl.getBinding("value").getType().formatValue([null, sResult], "string");
				}
				return sResult;
			}.bind(this));
		}
	};

	ValueListProvider.prototype._filterDropdownRowsByInParameters = function () {
		this._calculateFilterInputData();

		if (this.mFilterInputData && this.aFilterField && this.aFilterField.length > 0) {
			// Filter
			this._fetchData();

			// Cache last executed filters
			this._mLastFilterInputData = this.mFilterInputData;

			// Clean existing control selection
			if (!this.oControl.isA("sap.m.Select")) {
				this._cleanupControlSelection();
			}
		}
	};

	ValueListProvider.prototype.isInSmartFilterBar = function () {
		return !!this.oFilterModel;
	};

	ValueListProvider.prototype.isDisableSearchMatchesPatternWarning = function () {
		if (this._disableSearchMatchesPatternWarning === undefined && this.isInSmartFilterBar() && this.oFilterProvider && this.oFilterProvider._oSmartFilter) {
			this._disableSearchMatchesPatternWarning = this.oFilterProvider._oSmartFilter.getDisableSearchMatchesPatternWarning();
		}

		return this._disableSearchMatchesPatternWarning;
	};

	ValueListProvider.prototype._isControlDropdown = function (oControl) {
		if (!oControl) {
			oControl = this.oControl;
		}
		return !!(oControl.isA("sap.m.MultiComboBox") || oControl.isA("sap.m.ComboBox")) || oControl.isA("sap.m.Select");
	};

	ValueListProvider.prototype._cleanupControlSelection = function () {
		if (this.oControl.isA("sap.m.MultiComboBox")) {
			// For MultiComboBox clear the model and selected keys, because when changing the In field
			// the model is not changed
			this.oControl.setSelectedKeys(null);
			if (this.isInSmartFilterBar()) {
				this.oFilterModel.setProperty("/" + this.sFieldName + "/items", []);
			}
		} else {
			this.oControl.setSelectedKey(null);
			this.oControl.clearSelection();
		}
	};

	ValueListProvider.prototype._openDropdown = function() {
		if (this.oControl.isA("sap.m.MultiComboBox")) {
			MultiComboBox.prototype.open.apply(this.oControl, arguments);
		} else if (this.oControl.isA("sap.m.ComboBox")) {
			ComboBox.prototype.open.apply(this.oControl, arguments);
		} else if (this.oControl.isA("sap.m.Select")) {
			Select.prototype.open.apply(this.oControl, arguments);
		}
	};

	ValueListProvider.prototype._handleOutParameters = function() {
		if (this.oControl.isA("sap.m.MultiComboBox")) {
			this.oControl.attachSelectionChange(this._onMultiComboBoxItemSelected, this);
		} else if (this.oControl.isA("sap.m.ComboBox") || this.oControl.isA("sap.m.Select")) {
			// for ComboBox attach change instead of selectionChange, because selectionchange is called
			// each time when typing is finding a match among the items
			this.oControl.attachChange(this._onComboBoxItemSelected, this);
		}
	};

	ValueListProvider.prototype._handleInParameters = function() {

		this.oControl.setBusyIndicatorDelay(0);

		// On initial loading make _mLastFilterInputData to be equal to mFilterInputData to prevent double filtering
		this._calculateFilterInputData();
		this._mLastFilterInputData = this.mFilterInputData;

		this.oControl.open = function () {

			this._calculateFilterInputData();

			// Prevent double filtering if the filter values have not changed
			if (deepEqual(this._mLastFilterInputData, this.mFilterInputData)) {
				this._openDropdown();
				return;
			}

			// Filter the drop down list and open
			this._filterDropdownRowsByInParameters();
			this._openDropdown();

		}.bind(this);

		this.oControl.addEventDelegate({

			onmousedown: function (oEvent) {
				if (
					this.oControl.getArrowIcon && oEvent.target === this.oControl.getArrowIcon().getFocusDomRef() // The focus target is the icon dom reference
				) {
					// We should skip filtering on focus in when the mouse down is in the icon dom reference
					this._bSkipFocusIn = true;
				}
			}.bind(this),

			onmouseup: function (oEvent) {
				if (
					this._bSkipFocusIn && // We had skipped the focus in event
					(this.oControl.getArrowIcon && oEvent.target === this.oControl.getArrowIcon().getFocusDomRef()) // The focus target is the icon dom reference
				) {
					this.oControl.open();
				}
				this._bSkipFocusIn = false;
			}.bind(this),

			onfocusin: function (oEvent) {

				if (this._bSkipFocusIn) {
					return oEvent;
				}

				setTimeout(function () {

					this._calculateFilterInputData();

					// Prevent double filtering if the filter values have not changed
					if (deepEqual(this._mLastFilterInputData, this.mFilterInputData)) {
						return;
					}

					// Filter the drop down list
					this._filterDropdownRowsByInParameters();
				}.bind(this));

				return oEvent;

			}.bind(this)

		});
	};

	ValueListProvider.prototype._updateBindings = function () {

		this._calculateFilterInputData();

		// Prevent double filtering if the filter values have not changed or if there is no lastFilterInputData
		if (!this._mLastFilterInputData || deepEqual(this._mLastFilterInputData, this.mFilterInputData)) {
			return;
		}

		// Filter the drop down list
		this._filterDropdownRowsByInParameters();
	};

	ValueListProvider.prototype._primaryValueListAnnotationChanged = function(sSearchText) {

		var oControl = this.oControl,
			oAnalyzer = this._oMetadataAnalyser,
			oBindingContext,
			oPropertyContext,
			aRelevantQualifiers = [],
			sBindingContextPath = oControl.getBindingContext() && oControl.getBindingContext().getPath();

		if (sBindingContextPath) {
			oBindingContext = oControl.getModel() && oControl.getModel().getContext(sBindingContextPath);
			oPropertyContext = oAnalyzer.getPropertyContextByPath(this._sFullyQualifiedFieldName);
			aRelevantQualifiers = oAnalyzer._getODataValueListRelevantQualifiers(oPropertyContext, oBindingContext);
		}
		if (aRelevantQualifiers.length > 0 && (!aRelevantQualifiers.includes(this.oPrimaryValueListAnnotation.qualifier) || (aRelevantQualifiers.includes("") && this.oPrimaryValueListAnnotation.qualifier !== "") )) {
			oAnalyzer.getValueListAnnotationLazy(this._sFullyQualifiedFieldName, sBindingContextPath).then(function(oAnnotation) {
				if (oControl.oParent && oControl.oParent._oFactory) {
					oControl.oParent._oFactory._initValueList(oAnnotation);
				}
				this._onAnnotationLoad(oAnnotation);
				this._rebindInnerControlSuggestions();
				this._fetchData(sSearchText);
			}.bind(this));
			return true;
		}

		return false;
	};

	/**
	 *
	 * @private
	 */
	ValueListProvider.prototype._prepareValueListSearchParameters = function (sSearchText) {
		var mParams = {},
			aFilters = [],
			sFilterFieldPath,
			length = this._getBindingLength(),
			sSearchTextTruncated = "";

		if (MetadataAnalyser.hasValueListRelevantQualifiers(this._fieldViewMetadata) && this._primaryValueListAnnotationChanged(sSearchText)) {
			return;
		}

		if (this.sDDLBDisplayBehaviour === "descriptionOnly" && this.sDescription) {
			sFilterFieldPath = this.sDescription;
		} else {
			sFilterFieldPath = this.sKey;
		}

		sSearchText = sSearchText || "";
		if (this.bTypeAheadEnabled) {
			// Convert search text to UpperCase if displayFormat = "UpperCase"
			if (sSearchText && this.sDisplayFormat === "UpperCase") {
				sSearchText = sSearchText.toUpperCase();
			}
			if (this.bSupportBasicSearch) {
				if (this._shouldHaveRecommendations() || this._shouldHaveHistory()) {
					mParams = {
						"search-focus": sFilterFieldPath,
						"search": sSearchText
					};
				} else {
					mParams.custom = {
						"search-focus": sFilterFieldPath,
						"search": sSearchText
					};
				}
			}
			this._calculateFilterInputData();
			if (this.mFilterInputData && this.aFilterField) {
				aFilters = FilterProviderUtils.generateFilters(this.aFilterField, this.mFilterInputData, {
					dateSettings: this._oDateFormatSettings
				});
			}
			// If SearchSupported = false; create a $filter for the keyfield with a StartsWith operator for the typed in/search text
			if (!this.bSupportBasicSearch) {

				if (this._fieldViewMetadata && this._fieldViewMetadata.filterType === "numc") {
					aFilters.push(new Filter(sFilterFieldPath, FilterOperator.Contains, sSearchText));
				} else {
					sSearchTextTruncated = this._truncateSearchText(sSearchText);
					if (sSearchTextTruncated === sSearchText) {
						aFilters.push(new Filter(sFilterFieldPath, FilterOperator.StartsWith, sSearchTextTruncated));
					}
				}
			}

			length = 10;
		}

		mParams["$top"] = length;
		mParams["$skip"] = 0;

		if (!this.sValueListEntitySetName) {
			Log.error("ValueListProvider", "Empty sValueListEntitySetName for " + this.sAggregationName + " binding! (missing primaryValueListAnnotation)");
		}

		if (this.sDeferredGroupId) {
			// notice according to documentation, of sap.ui.model.odata.v2.ODataListBinding, it really is called "batchGroupId" and not "groupId"
			mParams["batchGroupId"] = this.sDeferredGroupId;
		}

		if (this.aSelect && this.aSelect.length) {
			mParams["$select"] = this.aSelect.toString();
		}

		return {
			mParams, aFilters, sSearchTextTruncated, length
		};
	};

	/**
	 * This method retrieves data from all datasets (suggestions, recommendations, and input history), then combines
	 * only the unique ones and maps them to a custom JSON model that is bound to an inner control.
	 *
	 * @param {string} sSearchText - the optional search text
	 * @private
	 */
	ValueListProvider.prototype._fetchData = function (sSearchText) {
		var { mParams, aFilters, sSearchTextTruncated, length } = this._prepareValueListSearchParameters(sSearchText),
			oValueListPromise,
			oEvents,
			oDataReceivedPromise;

		if (this.bTypeAheadEnabled && !this.bSupportBasicSearch &&
			!(this._fieldViewMetadata && this._fieldViewMetadata.filterType === "numc") &&
			!(sSearchTextTruncated === sSearchText)) {
			this.oControl.closeSuggestions();
			return;
		}

		if (!(this._shouldHaveRecommendations() || this._shouldHaveHistory()) || !this._isControlSupportedForHistory(this.oControl)) {
			if (this.bTypeAheadEnabled && this.bEnableShowTableSuggestionValueHelp && this._isSuggestionEnabled()) {
				// Hide the Show All Items button if the number if items is less than the length (restriction)
				oEvents = {
					dataReceived: function(oEvent) {
						var oBinding = oEvent.getSource(), iBindingLength;
						if (oBinding) {
							iBindingLength = oBinding.getLength();
							if (iBindingLength && iBindingLength <= length) {
								this.oControl.setShowTableSuggestionValueHelp(false);
							} else if (!this.bShowAllSuggestionsButton) {
									this.oControl.setShowTableSuggestionValueHelp(false);
								} else {
									this.oControl.setShowTableSuggestionValueHelp(true);
								}
						}
					}.bind(this)
				};
			} else if (!this._isSuggestionEnabled() && this.oControl.setShowTableSuggestionValueHelp && this.oControl.setShowSuggestion) {
				// Hide the Show All Items as per configuration
				this.oControl.setShowTableSuggestionValueHelp(false);
				this.oControl.setShowSuggestion(false);
			} else if (this.bTypeAheadEnabled) {
				// Hide the Show All Items as per configuration
				this.oControl.setShowTableSuggestionValueHelp(false);
			}

			if (this.aSelect && this.aSelect.length) {
				mParams["select"] = this.aSelect.toString();
				delete mParams["$select"];
			}

			// Add InParams as filter in the initial GET request for ComboBox/MultiComboBox
			if (this._isControlDropdown(this.oControl) &&
				(this.mInParams && Object.keys(this.mInParams).length >= 1 ||
				this.mConstParams && Object.keys(this.mConstParams).length >= 1)) {

				// When the request is completed and the filtering is done remove the busy indicator
				if (!oEvents) {
					oDataReceivedPromise = new Deferred();
					this.oControl.data("__dataReceivedPromise", oDataReceivedPromise.promise);
					this.oControl.setBusy(true);
					oEvents = {
						dataReceived: function (oEvent) {
							oDataReceivedPromise.resolve();
							this.oControl.setBusy(false);
							this._resetValueState(oEvent);
							this._applyValueIfNeeded();
						}.bind(this)
					};
				}

				this._calculateFilterInputData();

				if (this.mFilterInputData && this.aFilterField) {
					aFilters = FilterProviderUtils.generateFilters(this.aFilterField, this.mFilterInputData, {
						dateSettings: this._oDateFormatSettings,
						viewMetadataData: this._createViewMetadataData()
					});
				}
			}

			this.oControl.bindAggregation(this.sAggregationName, {
				path: "/" + this.sValueListEntitySetName,
				length: length,
				parameters: mParams,
				filters: aFilters,
				sorter: this._oSorter,
				events: oEvents,
				template: this._oTemplate,
				templateShareable: true
			});

			return;
		}

		this._bindInnerControlSuggestions();
		var that = this;
		oValueListPromise = new Promise(function (resolve, reject) {
			if (!that.sValueListEntitySetName || (!that._isSuggestionEnabled() && !that._isControlDropdown())) {
				resolve({ results: [] });
				return;
			}

			if (!that._isSuggestionEnabled()) {
				resolve({ results: [] });
				return;
			}

			that.oODataModel.read("/" + that.sValueListEntitySetName, {
				urlParameters: mParams,
				filters: aFilters,
				sorters: that._oSorter && [that._oSorter],
				success: function (oData) {
					resolve(oData);
				},
				error: function (oData) {
					reject(oData);
				}
			});
		});

		var oHistoryPromise = Promise.resolve([]);

		if (this._shouldHaveHistory()) {
			oHistoryPromise = that._oHistoryValuesProvider.getFieldData();
		}

		Promise.all([oValueListPromise, this._oRecommendationListPromise, oHistoryPromise]).then(function (aResults) {
			var aData = [],
				aSuggestions = [],
				aRecommendations = [],
				aHistoryData = [],
				sModelName = that._getSuggestionsModelName(),
				oControl = that.oControl;

			if (!oControl) {
				return;
			}

			var oModel = oControl.getModel(sModelName);

			if (Array.isArray(aResults[0] && aResults[0].results)) {
				aSuggestions = that._addSuggestionsToGroup(aResults[0].results, HEADER_GROUPS.Others);
			}

			if (Array.isArray(aResults[1] && aResults[1].results)) {
				aRecommendations = that._addSuggestionsToGroup(aResults[1].results, HEADER_GROUPS.Recommendations);
			}

			if (that._shouldHaveHistory() && Array.isArray(aResults[2])) {
				aHistoryData = that._addSuggestionsToGroup(aResults[2], HEADER_GROUPS.RecentlyUsed);
				aHistoryData = that._parseHistoryJsonDates(aHistoryData);
			}

			aData = aData.concat(aRecommendations).concat(aHistoryData).concat(aSuggestions);
			aData = that._getDistinctSuggestions(aData);
			// Filter data based on In Params
			aData = aData.filter(
				that._filterSuggestionsWithInParams.bind(that, that.mFilterInputData)
			);

			that._showSuggestionsMoreButton(aSuggestions.length >= length);

			if (that.oControl.isA("sap.m.MultiInput")) {
				// Clear proposed item from suggestions because the model will be changed and
				// it won't be valid anymore. If we do not clear it the text of wrong item
				// will be used as binding for the value and this will break the filter query
				that.oControl._oSuggPopover._oProposedItem = null;
			}

			oModel.setData(aData);
		});
	};

	/**
	 * @private
	 */
	ValueListProvider.prototype._getSuggestionsData = function () {
		return new Promise((resolve, reject) => {
			var { mParams, aFilters } = this._prepareValueListSearchParameters();

			if (this._isControlDropdown(this.oControl) &&
				(this.mInParams && Object.keys(this.mInParams).length >= 1 ||
					this.mConstParams && Object.keys(this.mConstParams).length >= 1)) {

				this._calculateFilterInputData();

				if (this.mFilterInputData && this.aFilterField) {
					aFilters = FilterProviderUtils.generateFilters(this.aFilterField, this.mFilterInputData, {
						dateSettings: this._oDateFormatSettings,
						viewMetadataData: this._createViewMetadataData()
					});
				}
			}

			this.oODataModel.read("/" + this.sValueListEntitySetName, {
				urlParameters: mParams,
				filters: aFilters,
				sorters: this._oSorter && [this._oSorter],
				success: (oData) => {
					resolve(oData.results.map((oItem) => {
						return {
							key: oItem[this.sKey],
							description: oItem[this.sDescription]
						};
					}));
				},
				error: function (oData) {
					reject(oData);
				}
			});
		});
	};

	/**
	 * Adds boolean attributes to the viewMetadataData needed for the generateFilters function
	 * @private
	 */
	ValueListProvider.prototype._createViewMetadataData = function() {
		var aConstantParams = this.mConstParams && Object.keys(this.mConstParams),
			aValueSignificantFields = this.oPrimaryValueListAnnotation.aInitialValueIsSignificantFields,
			viewMetadataDataFields = [];

		if (Array.isArray(this.aFilterField) && this.aFilterField.length > 0){
			viewMetadataDataFields = this.aFilterField.map(function(sFieldName) {
				var oField = {};
				oField.name = sFieldName;
				oField.fieldName = sFieldName;
				oField.isConstant = Array.isArray(aConstantParams) && aConstantParams.indexOf(sFieldName) !== -1;
				oField.isInitialValueSignificant = Array.isArray(aValueSignificantFields) && aValueSignificantFields.indexOf(sFieldName) !== -1;
				return oField;
			});
		}

		return [{fields: viewMetadataDataFields}];
	};

	/**
	 * Called when ComboBox dataRecieved event is fired to reset valueState property
	 * @param {object} oEvent - the dataRecieved event object
	 * @private
	 */
	ValueListProvider.prototype._resetValueState = function (oEvent) {
		var oData = oEvent.getParameter("data"),
			aItems = oData && oData.results,
			i;

		if (this.oControl.isA("sap.m.ComboBox") && aItems) {
			for (i = 0; i < aItems.length; i++) {
				if (aItems[i][this.sKey] == this.oControl.getSelectedKey() &&
					this.oControl.getValueState() === ValueState.Error) {
					this.oControl.setValueState(ValueState.None);
				}
			}
		}
	};

	ValueListProvider.prototype._applyValueIfNeeded = function() {
		var oControl = this.oControl,
			aKeys,
			sSelectedKey,
			sValue;

		if (!oControl.isA("sap.m.ComboBox")) {
			return;
		}

		aKeys = oControl.getKeys();
		sSelectedKey = oControl.getSelectedKey();
		sValue = oControl.getValue();

		if (sValue && !sSelectedKey && aKeys.indexOf(sValue) !== -1) {
			oControl.setSelectedKey(sValue);
		}
	};

	ValueListProvider.prototype._isSuggestionEnabled = function () {
		return this._bSuggestionsEnabled;
	};

	ValueListProvider.prototype._sortRecommendations = function (a, b) {
		var sRankPropertyName = this._oRecommendationListAnnotation.rankProperty,
			aRank = parseFloat(a[sRankPropertyName]),
			bRank = parseFloat(b[sRankPropertyName]);

		return bRank - aRank;
	};

	ValueListProvider.prototype._showSuggestionsMoreButton = function (bShow) {
		if (!this.bTypeAheadEnabled) {
			return;
		}

		if (this.bEnableShowTableSuggestionValueHelp) {
			// Hide the Show All Items button if the number if items is less than the length (restriction)
			this.oControl.setShowTableSuggestionValueHelp(bShow);
		} else {
			// Hide the Show All Items as per configuration
			this.oControl.setShowTableSuggestionValueHelp(false);
		}
	};

	ValueListProvider.prototype._addSuggestionsToGroup = function (aSuggestions, iGroupIndex) {
		if (!aSuggestions) {
			return [];
		}

		return aSuggestions.map(function (oSuggestion) {
			var oGroupObject = {};
			oGroupObject[HistoryConstants.getSuggestionsGroupPropertyName()] = iGroupIndex;

			return Object.assign({}, oSuggestion, oGroupObject);
		});
	};

	ValueListProvider.prototype._groupHeaderFactory = function (oGroup) {
		var sTitle = this._getGroupHeaderTitle(oGroup.key);

		if (this._isControlDropdown()) {
			return new SeparatorItem({
				key: HistoryConstants.getHistoryPrefix() + oGroup.key + ".key",
				text: sTitle
			});
		}

		return new GroupHeaderListItem({
			title: sTitle
		});
	};

	ValueListProvider.prototype._getGroupHeaderTitle = function (sGroupKey) {
		switch (sGroupKey) {
			case HEADER_GROUPS.Recommendations:
				return this._oResourceBundle.getText("VALUELIST_RECOMMENDATIONS_TITLE");
			case HEADER_GROUPS.RecentlyUsed:
				return this._oResourceBundle.getText("VALUELIST_RECENTLY_USED_TITLE");
			default:
				return this._oResourceBundle.getText("VALUELIST_OTHERS_TITLE");
		}
	};

	ValueListProvider.prototype._getGroupHeaderSorter = function () {
		if (this._groupHeaderSorter) {
			return this._groupHeaderSorter;
		}

		this._groupHeaderSorter = new Sorter({
			path: HistoryConstants.getSuggestionsGroupPropertyName(),
			descending: false,
			group: function (oContext) {
				return oContext.getProperty(HistoryConstants.getSuggestionsGroupPropertyName());
			}
		});

		return this._groupHeaderSorter;
	};

	ValueListProvider.prototype._getDistinctSuggestions = function (aData) {
		var oUnique = {},
			aDistinct = [],
			aCols = (this._aHighImportanceCols || this._aCols),
			aKeysToCheck = aCols && aCols.reduce(function (aResult, oCol) {
				return aResult.concat(oCol.template);
			}, []);

		if (!aKeysToCheck && aData.length > 0) {
			aKeysToCheck = Object.keys(aData[0]);
		}

		aData.forEach(function (x) {
			var aKeyValues = aKeysToCheck.reduce(function (aResult, sKey) {
				aResult.push([sKey, x[sKey]]);

				return aResult;
			}, []);

			var sKey = aKeyValues.toString();

			if (!oUnique[sKey]) {
				aDistinct.push(x);
				oUnique[sKey] = {
					index: aDistinct.length - 1
				};
			} else if (oUnique[sKey] && Number.isInteger(oUnique[sKey].index)) {
				var iItemIndex = oUnique[sKey].index,
					sItemGroup = aDistinct[iItemIndex][HistoryConstants.getSuggestionsGroupPropertyName()];

				if (sItemGroup !== HEADER_GROUPS.Others) {
					aDistinct[oUnique[sKey].index][HistoryConstants.getForcedVisiblePropertyName()] = true;
				}

			}
		}, this);

		return aDistinct;
	};

	ValueListProvider.prototype._resolveRecommendationListAnnotationData = function (oRecommendationListAnnotation) {
		var aColumns = oRecommendationListAnnotation.fieldsToDisplay,
			oField,
			oColumnConfig,
			oRankField;

		this._aRecommendationCols = [];
		this.aRecommendationSelect = [];

		for (var i = 0; i < aColumns.length; i++) {
			oField = aColumns[i];
			oColumnConfig = this._getColumnConfigFromField(oField);

			if (oField.visible) {
				this._aRecommendationCols.push(oColumnConfig);
				this.aRecommendationSelect.push(oField.name);
			}
		}
		if (this._aHighImportanceCols && this._oRecommendationListAnnotation) {
			oRankField = this._oRecommendationListAnnotation.rankField[0];
			oRankField = this._getColumnConfigFromField(oRankField);
			this._aHighImportanceCols.push(oRankField);
		}
	};

	ValueListProvider.prototype._setupRecommendations = function () {
		if (!this._shouldHaveRecommendations() || !this._isControlSupportedForHistory(this.oControl)) {
			return;
		}

		this._resolveRecommendationListAnnotationData(this._getRecommendationListAnnotation());
		this._fetchRecommendations();
	};

	ValueListProvider.prototype._shouldHaveRecommendations = function () {
		return MetadataAnalyser.isRecommendationList(this._fieldViewMetadata);
	};

	ValueListProvider.prototype._getRecommendationListAnnotation = function () {
		if (!this._oRecommendationListAnnotation) {
			var oRecommendationListAnnotation = this._oMetadataAnalyser._getRecommendationListAnnotation(this._sFullyQualifiedFieldName);
			this._oRecommendationListAnnotation = this._oMetadataAnalyser._enrichRecommendationListAnnotation(oRecommendationListAnnotation);
		}

		return this._oRecommendationListAnnotation;
	};

	ValueListProvider.prototype._fetchRecommendations = function () {
		var that = this;
		this._oRecommendationListPromise = new Promise(function (resolve, reject) {
			that.oODataModel.read("/" + that._oRecommendationListAnnotation.path, {
				urlParameters: { $skip: 0, $top: 5, $select: that.aRecommendationSelect.toString() },
				sorter: that._oSorter,
				success: function (aData) {
					var aRecommendations = that._addSuggestionsToGroup(aData.results, HEADER_GROUPS.Recommendations),
						sModelName = that._getSuggestionsModelName(),
						oModel = that.oControl.getModel(sModelName),
						aCurrentData = oModel.getData(),
						aDataToSet = aRecommendations.sort(that._sortRecommendations.bind(that));

					that._aRecommendations = aDataToSet;

					if (Array.isArray(aCurrentData)) {
						aDataToSet = [].concat(aCurrentData).concat(aDataToSet);
					}

					oModel.setData(aDataToSet);
					that._showSuggestionsMoreButton(false);
					resolve(aData);
				},
				error: function (oData) {
					reject(oData);
				}
			});
		});
	};

	ValueListProvider.prototype._createHistoryValuesProvider = function () {
		return new HistoryValuesProvider(this.oControl, this._sFullyQualifiedFieldName);
	};

	ValueListProvider.prototype._createHistoryOptOutProvider = function () {
		return HistoryOptOutProvider.createOptOutSettingPage();
	};

	ValueListProvider.prototype._setupHistoryValues = function () {
		if (!this._shouldHaveHistory() || !this._isControlSupportedForHistory(this.oControl)) {
			return;
		}

		this._oHistoryValuesProvider = this._createHistoryValuesProvider();
		this._createHistoryOptOutProvider();

		this._oHistoryValuesProvider.getHistoryEnabled().then(function (bEnabled) {
			if (!bEnabled || !this._oHistoryValuesProvider) {
				return;
			}

			this._oHistoryValuesProvider.attachChangeListener();
			this._oHistoryValuesProvider.attachEvent("fieldUpdated", this._onHistoryFieldUpdated, this);
			this._oHistoryValuesProvider.getFieldData()
				.then(this._onHistoryDataInitialized.bind(this));
		}.bind(this));
	};

	ValueListProvider.prototype._onHistoryDataInitialized = function (aData) {
		this._updateModelHistoryData(aData);

		return aData;
	};

	ValueListProvider.prototype._onHistoryFieldUpdated = function (oEvent) {
		var aData = oEvent.getParameter("fieldData") || [];

		if (this.oControl.isA("sap.m.Input")) {
			// close the suggestions popover
			// when the value is selected the focus is returned in the input
			// which triggers our onfocusin logic to open the history values.
			// TODO: check if this is still needed if onfocusin logic
			// in _setupComboBoxSuggestionInteractions/_setupInputSuggestionInteractions is removed
			this._updateModelHistoryData(aData);

			setTimeout(function () {
				this.oControl && this.oControl._oSuggPopover._oPopover.close();
			}.bind(this), 50);
			return;
		}

		this._updateModelHistoryData(aData);
		if (this.oControl.isA("sap.m.ComboBox")) {
			// close the suggestions popover
			// when the value is selected the focus is returned in the comboBox
			// which triggers our onfocusin logic to open the history values.
			// TODO: check if this is still needed if onfocusin logic
			// in _setupComboBoxSuggestionInteractions/_setupInputSuggestionInteractions is removed
			setTimeout(function () {
				this.oControl && this.oControl._oSuggestionPopover._oPopover.close();
			}.bind(this));
		}
	};

	ValueListProvider.prototype._updateModelHistoryData = function (aData) {
		if (!this.oControl) {
			// the ValueListProvider was destroyed and no model update of the history data is needed
			return;
		}

		aData = this._parseHistoryJsonDates(aData);

		var aDataToSet = [],
			aRecentlyUsed = this._addSuggestionsToGroup(aData, HEADER_GROUPS.RecentlyUsed),
			sModelName = this._getSuggestionsModelName(),
			oModel = this.oControl.getModel(sModelName),
			oOldData = oModel.getData();

		if (!Array.isArray(oOldData)) {
			oOldData = [];
		}

		aDataToSet = this._getDistinctSuggestions(aDataToSet.concat(aRecentlyUsed).concat(oOldData));

		oModel.setData(aDataToSet);
		this._showSuggestionsMoreButton(false);
	};
	ValueListProvider.prototype._getShellConfig = function () {
		var oShellConfig = window["sap-ushell-config"];
		if (oShellConfig) {
			return oShellConfig.apps;
		}

		return null;
	};

	ValueListProvider.prototype._getSuggestionsEnabled = function () {
		var oShellAppsConfig = this._getShellConfig(),
			oInputFieldSuggestionsSetting;

		if (oShellAppsConfig) {
			oInputFieldSuggestionsSetting = oShellAppsConfig.inputFieldSuggestions;
		}

		if (oInputFieldSuggestionsSetting) {
			return oInputFieldSuggestionsSetting.enabled;
		}

		return true;
	};

	ValueListProvider.prototype._getUShellContainer = function () {
		return sap.ui.require("sap/ushell/Container");
	};

	ValueListProvider.prototype._shouldHaveHistory = function () {

		if (!this._fieldHistoryEnabled || !this._fieldViewMetadata || !this._sFullyQualifiedFieldName || !this.oControl || (this._isControlDropdown() && (this._fieldHistoryEnabledInitial || this._fieldHistoryEnabledInitial === undefined) && this._fieldHistoryEnabled)) {
			return false;
		}

		var oShellAppsConfig = this._getShellConfig(),
			oInputFieldHistory,
			bEnabled;

		if (oShellAppsConfig) {
			oInputFieldHistory = oShellAppsConfig.inputFieldHistory;
		}

		if (oInputFieldHistory) {
			bEnabled = oInputFieldHistory.enabled;
		}

        var oShellContainer = this._getUShellContainer();

		return oShellContainer && bEnabled && !MetadataAnalyser.isPotentiallySensitive(this._fieldViewMetadata);
	};

	ValueListProvider.prototype._bindInnerControlSuggestions = function () {
		if (this.sAggregationName && this.oControl.isBound(this.sAggregationName)) {
			return;
		}

		this._rebindInnerControlSuggestions();
	};

	ValueListProvider.prototype._rebindInnerControlSuggestions = function () {
		if (this.sAggregationName && this.sAggregationName === "suggestionRows") {
			this._createSuggestionTemplate();
		} else {
			this._createDropDownTemplate();
		}

		var oBindingParams = {
			path: this._getSuggestionsModelName() + ">/" ,
			template: this._oTemplate,
			templateShareable: true,
			length: this._getBindingLength()
		};

		oBindingParams.groupHeaderFactory = this._groupHeaderFactory;
		oBindingParams.sorter = this._getGroupHeaderSorter();

		if (this.sAggregationName) {
			// Bind the specified aggregation with valueList path in the model
			this.oControl.bindAggregation(this.sAggregationName, oBindingParams);
		}
	};

	ValueListProvider.prototype._setupSuggestionInteractions = function () {
		if (this.sAggregationName === "suggestionRows") {
			this._setupInputSuggestionInteractions();
			return;
		}

		this._setupComboBoxSuggestionInteractions();
	};

	ValueListProvider.prototype._setupInputSuggestionInteractions = function () {
		var oInput = this.oControl;

		oInput.setFilterSuggests(true);
		oInput.setFilterFunction(function (sValue, oItem) {
			var sModelName = this._getSuggestionsModelName(),
				oItemData = oItem.getBindingContext(sModelName).getObject(),
				sKey = oItemData[this.sKey],
				sDescription = oItemData[this.sDescription],
				fnFormatter = FormatUtil.getFormatterFunctionFromDisplayBehaviour(this.sDDLBDisplayBehaviour),
				sItemText = fnFormatter(sKey, sDescription);

			if (oItemData[HistoryConstants.getForcedVisiblePropertyName()] || oItemData[HistoryConstants.getSuggestionsGroupPropertyName()] === HEADER_GROUPS.Others) {
				// do not filter out others. The server should do the filtering
				return true;
			}

			// remove * from the start or end of the string. They are used for wildfire search, which
			// is handled on the oData service. Locally we do not want to filter by this text
			sValue = sValue.replace(/\*$/, "");
			sValue = sValue.replace(/^\*/, "");

			var bValueInOneProperty = Object.keys(oItemData).some(function (sKey) {
				var sPropertyData = oItemData[sKey] + "";

				return sPropertyData.toLowerCase().indexOf(sValue.toLowerCase()) !== -1;
			});

			var bValueInFormattedText = sItemText && sItemText.toLowerCase().indexOf(sValue.toLowerCase()) !== -1;

			return bValueInOneProperty || bValueInFormattedText;
		}.bind(this));

		// Handles the state of the Input while input
		oInput.attachLiveChange(function(oEvent) {
			var sValue = oEvent.getParameter("value"),
				aAllowedGroups = [HEADER_GROUPS.RecentlyUsed, HEADER_GROUPS.Recommendations];

			if (sValue === "") {
				this.oControl._oSuggPopover._oPopover.close();
				this._showInitialSuggestions(aAllowedGroups);
			}
		}, this);

		oInput.addEventDelegate({
			onmousedown: function (oEvent) {
				if ((this.oControl.getAggregation("_suggestionPopup") && this.oControl.getAggregation("_suggestionPopup").isOpen()) || oEvent.target.tagName !== "INPUT") {
					return;
				}

				this._bindInnerControlSuggestions();

				if (this._oHistoryValuesProvider) {
					this._oHistoryValuesProvider.getFieldData().then(function (aData) {
						this._updateModelHistoryData(aData);
						this._showInitialSuggestions("suggestionRows", oInput.getValue());
					}.bind(this));
				}

			},
			onkeyup: function (oEvent) {
				this._bindInnerControlSuggestions();

				if (oEvent.keyCode !== 9) {
					return;
				}
				if (this._oHistoryValuesProvider) {
					this._oHistoryValuesProvider.getFieldData().then(function (aData) {
						this._updateModelHistoryData(aData);
						this._showInitialSuggestions("suggestionRows", oInput.getValue());
					}.bind(this));
				}
			}
		}, this);

		if (oInput.isA("sap.m.MultiInput") || !this._shouldHaveRecommendations()) {
			// Skip Value state setting
			return;
		}

		// Handles the state of the Input after suggestion item selection
		oInput.attachSuggestionItemSelected(function (oEvent) {
			var sModelName = this._getSuggestionsModelName(),
				oSelectedRow = oEvent.getParameter("selectedRow"),
				oItemText;

			if (oSelectedRow) {
				var oSelectedRowData = oSelectedRow.getBindingContext(sModelName).getObject();
				oItemText = oSelectedRowData && oSelectedRowData[this.sKey];
			}

			if (this._isNotRecommendationItemSelected("suggestionRows", oItemText)) {
				this._setControlValueState(ValueState.Warning);
			} else {
				this._setControlValueState(ValueState.None);
			}
		}, this);
	};

	ValueListProvider.prototype._setupComboBoxSuggestionInteractions = function () {
		var oComboBox = this.oControl;

		oComboBox.setShowSecondaryValues(true);

		oComboBox.addEventDelegate({
			onmousedown: function (oEvent) {
				if ((this.oControl.getPicker() && this.oControl.getPicker().isOpen()) || oEvent.target.tagName !== "INPUT") {
					return;
				}

				this._bindInnerControlSuggestions();

				setTimeout(function () {
					this._showInitialSuggestions("items", oComboBox.getValue());
				}.bind(this));
			},
			onkeyup: function (oEvent) {
				this._bindInnerControlSuggestions();

				if (oEvent.keyCode !== 9) {
					return;
				}

				setTimeout(function () {
					this._showInitialSuggestions("items", oComboBox.getValue());
				}.bind(this));
			}
		}, this);

		if (oComboBox.isA("sap.m.MultiComboBox") || !this._shouldHaveRecommendations()) {
			// Skip Value state setting
			return;
		}
		// Resets the state of the ComboBox after interraction with the control
		oComboBox.attachChange(function (oEvent) {
			if (this._isNotRecommendationItemSelected("items", oEvent.getParameter("value"))) {
				this._setControlValueState(ValueState.Warning);
			} else {
				this._setControlValueState(ValueState.None);
			}
		}, this);
	};

	ValueListProvider.prototype._isNotRecommendationItemSelected = function (sAggregationName, sValue) {
		return this._findSuggestionItemGroup(sAggregationName, sValue) !== HEADER_GROUPS.Recommendations;
	};

	ValueListProvider.prototype._findSuggestionItemGroup = function (sAggregationName, sValue) {
		var oBinding = this.oControl.getBinding(sAggregationName),
		    aItemContexts = oBinding ? oBinding.getCurrentContexts() : [],
			oSelectedItem;

		for (var i = 0; i < aItemContexts.length; i++) {
			var oCurrentItem = aItemContexts[i].getObject(),
				sKey = oCurrentItem[this.sKey],
				sDescription = oCurrentItem[this.sDescription];

			if (sKey === sValue || sDescription === sValue) {
				oSelectedItem = oCurrentItem;
				break;
			}
		}

		return oSelectedItem ? oSelectedItem[HistoryConstants.getSuggestionsGroupPropertyName()] : null;
	};

	ValueListProvider.prototype._setControlValueState = function (sState) {
		this.oControl.setValueState(sState ? sState : ValueState.None);
		this.oControl.setValueStateText(" ");
	};

	ValueListProvider.prototype._showInitialSuggestions = function (sAggregationName, sValue) {
		var that = this,
			aGroupNames = [HEADER_GROUPS.RecentlyUsed, HEADER_GROUPS.Recommendations],
			aHistoryGroup = [HEADER_GROUPS.RecentlyUsed],
			aGroupsToShow = [];

		if (this._isNotRecommendationItemSelected(sAggregationName, sValue)) {
			aGroupsToShow = aGroupNames;
		} else if (this._shouldHaveHistory()) {
			aGroupsToShow = aHistoryGroup;
		}

		this._calculateFilterInputData();
		this.oControl.showItems(function (sValue, oItem) {
			var sModelName = that._getSuggestionsModelName(),
				oItemBindingContext = oItem.getBindingContext(sModelName),
				oItemData = oItemBindingContext ? oItemBindingContext.getObject() : {},
				iOrder = oItemData[HistoryConstants.getSuggestionsGroupPropertyName()];

			return that._filterSuggestionsWithInParams(that.mFilterInputData, oItemData) && aGroupsToShow.indexOf(iOrder) !== -1;
		});
	};

	ValueListProvider.prototype._filterSuggestionsWithInParams = function (oFilterInputData, oItemData) {
		if (!oFilterInputData || oFilterInputData.length === 0) {
			// in case we do not have any filter input data just return true
			// so no filtering by input data will be made
			return true;
		}

		return Object.keys(oFilterInputData).every(function (sKey) {
			var sCurrentItem = oItemData[sKey];
			var vFilteredItem = oFilterInputData[sKey];

			if (!sCurrentItem) {
				// if current item does not have property for filtering just return it
				return true;
			}

			if (typeof vFilteredItem === "string") {
				// if filter data item is string directly compare to it
				return vFilteredItem === sCurrentItem;
			}

			if (typeof vFilteredItem === "object" && vFilteredItem.items && vFilteredItem.items.length > 0) {
				// if filter data item is object and has items, compare current item against every item from filter data array
				return vFilteredItem.items.some(function (oFilterItem) {
					return oFilterItem.key === sCurrentItem;
				});
			}

			// If not filter data could be obtained just return true
			return true;
		});
	};

	ValueListProvider.prototype._getSuggestionsModelName = function () {
		var sPath;

		if (!this._isControlSupportedForHistory(this.oControl)) {
			return sPath;
		}

		if (this._shouldHaveRecommendations() || this._shouldHaveHistory()) {
			sPath = SUGGESTIONS_MODEL_NAME;
		}

		return sPath;
	};

	ValueListProvider.prototype._resolveSuggestionBindingPath = function (sPath) {
		var sModelName = this._getSuggestionsModelName();

		if (sModelName) {
			sPath = sModelName + ">" + sPath;
		}

		return sPath;
	};

	ValueListProvider.prototype._isControlSupportedForHistory = function (oControl) {
		if (!oControl) {
			return false;
		}

		if (oControl.isA("sap.ui.comp.smartfield.DisplayComboBox")) {
			return false;
		}

		if (oControl.isA("sap.m.ComboBox") || oControl.isA("sap.m.MultiComboBox") || oControl.isA("sap.m.Input") || oControl.isA("sap.m.MultiInput")) {
			return true;
		}

		return false;
	};

	ValueListProvider.prototype._getBindingLength = function () {
		var iLength = 300;

		if (this.oODataModel && this.oODataModel.iSizeLimit && this.oODataModel.iSizeLimit > iLength) {
			iLength = this.oODataModel.iSizeLimit;
		}

		return iLength;
	};

	ValueListProvider.prototype._parseHistoryJsonDates = function (aData) {
		return aData.map(function (oItem) {
			return Object.keys(oItem).reduce(function (oResult, sKey) {
				if (DateTimeUtil._hasJsonDateString(oItem[sKey])) {
					oResult[sKey] = DateTimeUtil._parseJsonDateString(oItem[sKey]);
				} else {
					oResult[sKey] = oItem[sKey];
				}
				return oResult;
			}, {});
		});
	};

	/**
	 * check if a maxLength is given for the field and truncate the entered searchText if length > maxLength
	 *
	 * @param {string} sSearchText - the search text
	 * @returns {string} new truncated sSearchText
	 * @private
	 */
	ValueListProvider.prototype._truncateSearchText = function(sSearchText) {
		// because the Field itself allow to enter many characters, but the fieldMetadata has set a maxLength, we truncate the SearchText when we
		// reach the maxLength
		var iMaxLength = -1;
		if (this._sMaxLength) {
			// maxLength can be given as property (SmartField)
			iMaxLength = parseInt(this._sMaxLength);
		} else if (this._fieldViewMetadata && this._fieldViewMetadata.maxLength) {
			// or as part of the metadat object (for Filterbar fields)
			iMaxLength = parseInt(this._fieldViewMetadata.maxLength);
		}

		if (iMaxLength > -1 && sSearchText.length > iMaxLength) {
			sSearchText = sSearchText.substr(0, iMaxLength);
		}
		return sSearchText;
	};

	/**
	 * Handles the <code>PresentationVariant/SortOrder</code> annotation
	 * @returns {object|boolean} Returns an object with properties of the <code>PresentationVariant/SortOrder</code> annotation
	 * @private
	 */
	ValueListProvider.prototype._handlePresentationVariantSortOrderAnnotation = function() {
		var sQualifier,
			oPresentationVariantAnnotation,
			sValueHelpEntityTypeName =  this.oPrimaryValueListAnnotation.valueListEntityName;

		if (!this._bConsiderPresentationVariant) {
			return false;
		}

		if (!this._oMetadataAnalyser) {
			this._oMetadataAnalyser = new MetadataAnalyser(this.oODataModel);
			this._bCleanupMetadataAnalyser = true;
		}

		sQualifier = this._oMetadataAnalyser._getPresentationVariantQualifierForVHD(sValueHelpEntityTypeName);
		oPresentationVariantAnnotation = this._oMetadataAnalyser.getPresentationVariantAnnotation(sValueHelpEntityTypeName, sQualifier);

		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.sortOrderFields.length !== 0) {
			oPresentationVariantAnnotation.sPresentationVariantSortPath = oPresentationVariantAnnotation.sortOrderFields[0].name;
			this._oMetadataAnalyser._getEntityDefinition(sValueHelpEntityTypeName).property.forEach(function(oProperty){
				if (oProperty.name === oPresentationVariantAnnotation.sPresentationVariantSortPath) {
					oPresentationVariantAnnotation._bIsPresentationVariantSortPathInVHDEntityType = true;
				}
			});

			this.oPrimaryValueListAnnotation.fields.forEach(function(oField){
				if (oField.name === oPresentationVariantAnnotation.sPresentationVariantSortPath && oField.sortable === true) {
					oPresentationVariantAnnotation._bIsPresentationVariantSortOrderPropertySortable = true;
				}
			});
		}

		return oPresentationVariantAnnotation;
	};

	ValueListProvider.prototype._hasNotValidatedSingleField = function (sFieldName) {
		return this.oFilterProvider && this.oFilterProvider._oNotValidatedSingleFields && this.oFilterProvider._oNotValidatedSingleFields[sFieldName];
	};

	/**
	 * Unbind the aggregation from the model.
	 *
	 * @returns {this} The <code>this</code> instance to allow method chaining
	 * @protected
	 * @since 1.54
	 */
	ValueListProvider.prototype.unbindAggregation = function() {
		if (this.oControl) {
			this.oControl.unbindAggregation(this.sAggregationName);
		}

		return this;
	};

	/**
	 * Destroys the object
	 */
	ValueListProvider.prototype.destroy = function() {
		if (this.oControl) {
			if (this.oControl.detachSuggest && this._fSuggest) {
				this.oControl.detachSuggest(this._fSuggest);
				this._fSuggest = null;
			}
			if (this.oControl.removeValidator && this._fValidator) {
				this.oControl.removeValidator(this._fValidator);
				this._fValidator = null;
			} else if (this.oControl.detachSuggestionItemSelected) {
				this.oControl.detachSuggestionItemSelected(this._onSuggestionItemSelected, this);
			}
			if (this.oControl.detachChange) {
				this.oControl.detachChange(this._validateStringSingleWithValueList, this);
			}
			this.oControl.unbindAggregation(this.sAggregationName);
			this.oControl.data("_hassuggestionTemplate", false);
			delete this.oControl.__sValidationText;
			delete this.oControl.__bValidatingToken;
		}

		if (this._oHistoryValuesProvider) {
			this._oHistoryValuesProvider.destroy();
			this._oHistoryValuesProvider = null;
		}

		BaseValueListProvider.prototype.destroy.apply(this, arguments);
		// Destroy other local data
		if (this.oJsonModel) {
			this.oJsonModel.destroy();
			this.oJsonModel = null;
		}

		if (this._oTemplate) {
			this._oTemplate.destroy();
		}

		this._oTemplate = null;
		this.sAggregationName = null;
		this.bTypeAheadEnabled = null;
		this._oSorter = null;
		this._oResourceBundle = null;
	};

	return ValueListProvider;

});
