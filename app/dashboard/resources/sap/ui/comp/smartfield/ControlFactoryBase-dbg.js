/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Base class for factory implementations that create controls that are hosted by <code>sap.ui.comp.smartfield.SmartField</code>.
 *
 * @name sap.ui.comp.smartfield.ControlFactoryBase
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/Lib",
	"sap/ui/core/library",
	"sap/ui/comp/library",
	"sap/ui/model/BindingMode",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/comp/providers/ValueHelpProvider",
	"sap/ui/comp/providers/ValueListProvider",
	"sap/ui/comp/smartfield/BindingUtil",
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/m/HBox",
	"sap/base/Log",
	"sap/base/strings/capitalize",
	"sap/ui/comp/smartfilterbar/SmartFilterBar",
	"sap/ui/comp/smartfield/ValueListDelegate"
], function(
	BaseObject,
	Library,
	coreLibrary,
	library,
	BindingMode,
	FormatUtil,
	ValueHelpProvider,
	ValueListProvider,
	BindingUtil,
	MetadataAnalyser,
	HBox,
	Log,
	capitalize,
	SmartFilterBar,
	ValueListDelegate
) {
	"use strict";

	// shortcut for sap.ui.comp.smartfield.ControlContextType
	var ControlContextType = library.smartfield.ControlContextType;

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	/**
	 * @private
	 * @constructor
	 * @param {sap.ui.model.Model} oModel the model currently used
	 * @param {sap.ui.core.Control} oParent the parent control
	 */
	var ControlFactoryBase = BaseObject.extend("sap.ui.comp.smartfield.ControlFactoryBase", {
		constructor: function(oModel, oParent) {
			BaseObject.apply(this, arguments);
			this.sName = "ControlFactoryBase";
			this._oModel = oModel;
			this._oParent = oParent;
			this._oBinding = new BindingUtil();
			this._aProviders = [];
			this._oRb = Library.getResourceBundleFor("sap.ui.comp");
		}
	});

	/**
	 * Binds the properties of the control to formatter functions. Should be implemented in the classes that inherit <code>ControlFactoryBase</code>.
	 *
	 */
	ControlFactoryBase.prototype.bind = function() {
		return Promise.resolve();
	};

	/**
	 * Creates a control instance.
	 *
	 * @param {object} oSettings
	 * @returns {sap.ui.core.Control} the new control instance or <code>null</code>, if no control could be determined
	 * @public
	 */
	ControlFactoryBase.prototype.createControl = function(oSettings) {
		var sMethod,
			oControl;

		sMethod = this._getCreator(oSettings);

		if (sMethod) {
			oControl = this[sMethod](oSettings);

			this._addAriaLabelledBy(oControl);
			this._addAriaDescribedBy(oControl);

			if (oControl && oControl.onCreate) {
				this[oControl.onCreate](oControl.control, oControl.params);
			}
		}

		return oControl;
	};

	/**
	 * Update a control instance on display/edit modes switch.
	 *
	 * @returns {void}
	 * @private
	 */
	ControlFactoryBase.prototype.updateControl = function(oSettings) {
		var oInnerControl,
			sMode = oSettings.mode,
			oSmartField = this._oParent,
			oConfig = oSmartField.data("configdata");

		if (oConfig && oConfig.configdata) {
			oInnerControl = oSmartField.getFirstInnerControl();
			if (oConfig.configdata.onText && sMode === "display") {
				oConfig.configdata.onText(oInnerControl);
			} else if (oConfig.configdata.onInput && sMode === "edit"){
				oConfig.configdata.onInput(oInnerControl);
			}
		}
	};

	/**
	 * Sets the ariaLabelledBy attribute on the targeted inner controls
	 *
	 * @param {string} oControl The inner control of the SmartField
	 * @private
	 */
	ControlFactoryBase.prototype._addAriaLabelledBy = function(oControl) {
		var oTargetControl = this._getTargetControlForAccAttributes(oControl),
			oParentAriaLabelledBy = this._oParent.getAriaLabelledBy();

		if (oTargetControl && oTargetControl.addAriaLabelledBy && oParentAriaLabelledBy.length > 0) {
			oTargetControl.removeAllAriaLabelledBy();
			oParentAriaLabelledBy.forEach(function(vAriaLabelledBy) {
				oTargetControl.addAriaLabelledBy(vAriaLabelledBy);
			});
		}
	};

	/**
	 * Sets the ariaDescribedBy attribute on the targeted inner controls
	 *
	 * @param {string} oControl The inner control of the SmartField
	 * @private
	 */
	ControlFactoryBase.prototype._addAriaDescribedBy = function(oControl) {
		var oTargetControl = this._getTargetControlForAccAttributes(oControl),
			oParentAriaDescribedBy = this._oParent.getAriaDescribedBy();

		if (oTargetControl && oTargetControl.addAriaDescribedBy && oParentAriaDescribedBy.length > 0) {
			oTargetControl.removeAllAriaDescribedBy();
			oParentAriaDescribedBy.forEach(function(vAriaDescribedBy) {
				oTargetControl.addAriaDescribedBy(vAriaDescribedBy);
			});
		}
	};

	/**
	 * Finds the target control on which to set the aria attributes
	 *
	 * @param {string} oControl The inner oControl of the SmartField
	 * @returns {object} oTargetControl The needed target control
	 * @private
	 */
	 ControlFactoryBase.prototype._getTargetControlForAccAttributes = function (oControl) {
		var oTargetControl,
		oParentControlContext = this._oParent.getControlContext();
		if ((oParentControlContext === ControlContextType.None) || (oParentControlContext === ControlContextType.Form) || (oParentControlContext === ControlContextType.SmartFormGrid)) {

			if (oControl) {
				oTargetControl = oControl.control;

				if (oTargetControl instanceof HBox) {

					if (oTargetControl.getItems().length > 0) {
						oTargetControl = oTargetControl.getItems()[0];
					}
				}
			}
		}
		return oTargetControl;
	};

	/**
	 * Adds validations to the given control.
	 *
	 * @param {sap.ui.core.Control} oControl the given control
	 * @param {string} sMethod an optional method name of a method to be invoked on the parent smart field to notify it of the current state
	 * @public
	 */
	ControlFactoryBase.prototype.addValidations = function(oControl, sMethod) {
		var fState,
			fError,
			that = this;

		fState = function(sState, oEvent) {
			var sMessage,
				oException,
				oTargetControl = oEvent.getParameter("targetControl") || oEvent.getSource();

			if (oTargetControl) {

				if (oTargetControl.setValueState) {
					oTargetControl.setValueState(sState);
				}

				oException = oEvent.getParameter("exception");

				if (oException) {
					sMessage = oException.message;
				}

				// check also for an event parameter called message.
				if (!sMessage) {
					sMessage = oEvent.getParameter("message");
				}

				if (oTargetControl.setValueStateText) {
					oTargetControl.setValueStateText(sMessage);
				}
			}

			if (sMethod) {
				that._oParent[sMethod](sState === ValueState.Error);
			}
		};

		fError = function(oEvent) {
			fState(ValueState.Error, oEvent);
		};

		// attach to the errors.
		oControl.attachFormatError(fError);
		oControl.attachParseError(fError);
		oControl.attachValidationError(fError);
		oControl.attachValidationSuccess(function(oEvent) {
			that._oParent.onValidation(oEvent);
			fState(ValueState.None, oEvent);
		});
	};

	/**
	 * This method checks if the given control is an inner unit of measurement (UoM) control of the SmartField.
	 * @returns {boolean} <code>true</code>, if the given control is an inner UoM control
	 */
	ControlFactoryBase.prototype._isInnerUoM = function() {
		var oConfigData = this.getCustomDataConfiguration();

		return oConfigData && oConfigData.isUOM && oConfigData.isInnerControl;
	};

	/**
	 * Gets the display behaviour from the configuration
	 *
	 * @param {string} sDefaultDisplayMode determines the default display mode
	 * @returns {string} Display behaviour or <code>null</code>
	 * @private
	 */
	ControlFactoryBase.prototype._getDisplayBehaviourConfiguration = function(sDefaultDisplayMode) {
		var sDisplay = null,
			oControlSelectorConfig,
			bIsInnerControl = this._isInnerUoM(),
			bIsValueListNoValidation = this._oParent._getComputedTextInEditModeSource() === "ValueListNoValidation";

		// check the configuration for display behavior.
		var oConfig = this._oParent.getConfiguration();

		if (oConfig) {
			sDisplay = oConfig.getDisplayBehaviour();
		}

		if (!sDisplay && this._oMetaData && this._oMetaData.entityType) {
			sDisplay = this._oHelper.oAnnotation.getTextArrangement(this._oMetaData.property.property, this._oMetaData.entityType, bIsValueListNoValidation);
		}

		if (!sDisplay) {
			if (!sDefaultDisplayMode && this._oSelector) {
				oControlSelectorConfig = this._oSelector.checkComboBox({mode: "edit"});
				sDefaultDisplayMode = oControlSelectorConfig && oControlSelectorConfig.combobox ? "defaultDropDownDisplayBehaviour" : "defaultInputFieldDisplayBehaviour";
			}
			sDisplay = this._oParent.data(sDefaultDisplayMode);
		}

		if (!sDisplay && !bIsInnerControl) {
			sDisplay = library.DEFAULT_DISPLAY_BEHAVIOUR;
		}

		return sDisplay;
	};

	/**
	 * Gets the criticality qualifier from the configuration.
	 *
	 * @returns {string} The criticality qualifier name or <code>null</code>
	 * @private
	 */
	ControlFactoryBase.prototype._getCriticalityQualifierConfiguration = function() {
		var sCriticalityQualifier = null,
			oConfig = this._oParent.getConfiguration();

		if (oConfig) {
			sCriticalityQualifier = oConfig.getCriticalityQualifier && oConfig.getCriticalityQualifier();
		}

		return sCriticalityQualifier;
	};

	/**
	 * Gets the value of the <code>preventInitialDataFetchInVHDialog</code> from the configuration
	 *
	 * @returns {boolean} whether initial data fetch in value help dialog is demanded
	 * @private
	 */
	ControlFactoryBase.prototype._getPreventInitialDataFetchInVHDialog = function(oEdmProperty) {
		var oConfig = this._oParent.getConfiguration();

		if (oConfig && !oConfig.isPropertyInitial("preventInitialDataFetchInValueHelpDialog")) {
			return oConfig.getPreventInitialDataFetchInValueHelpDialog();
		}

		if (MetadataAnalyser.isValueList(oEdmProperty) && oEdmProperty["com.sap.vocabularies.Common.v1.ValueList"] && oEdmProperty["com.sap.vocabularies.Common.v1.ValueList"].FetchValues) {
			return oEdmProperty["com.sap.vocabularies.Common.v1.ValueList"].FetchValues.Int !== "1";
		}

		return false;
	};

	/**
	 * Format a value according to the display behaviour settings
	 *
	 * @param {string} sDefaultDisplayMode determines the default display mode
	 * @param {string} sKey the main value
	 * @param {string} sDescription dependent value
	 * @returns {string} relevant displayBehaviour option or <code>null</code>
	 * @private
	 */
	ControlFactoryBase.prototype._formatDisplayBehaviour = function(sDefaultDisplayMode, sKey, sDescription) {
		var sDisplay = this._getDisplayBehaviourConfiguration(sDefaultDisplayMode);

		if (sDefaultDisplayMode === "defaultCheckBoxDisplayBehaviour") {
			return this._getFormattedExpressionFromDisplayBehaviour(sDisplay, sKey);
		}

		if (sDefaultDisplayMode === "defaultComboBoxReadOnlyDisplayBehaviour" && !sDisplay) {
			sDisplay = "descriptionAndId";
		}

		return FormatUtil.getFormattedExpressionFromDisplayBehaviour(sDisplay || "idOnly", sKey, sDescription);
	};

	ControlFactoryBase.prototype._getFormattedExpressionFromDisplayBehaviour = function(sDisplay, bValue) {
		var sKey = "";

		switch (sDisplay) {

			case "OnOff":
				sKey = bValue ? "SMARTFIELD_CB_ON" : "SMARTFIELD_CB_OFF";
				break;

			case "TrueFalse":
				sKey = bValue ? "SMARTFIELD_CB_TRUE" : "SMARTFIELD_CB_FALSE";
				break;

			// case "YesNo": sKey = bValue ? "SMARTFIELD_CB_YES" : "SMARTFIELD_CB_NO"; break;
			default:
				sKey = bValue ? "SMARTFIELD_CB_YES" : "SMARTFIELD_CB_NO";
				break;
		}

		return this._oRb.getText(sKey);
	};

	ControlFactoryBase.prototype.getDropdownItemKeyType = function() {};
	ControlFactoryBase.prototype.getValueStateBindingInfoForRecommendationStateAnnotation = function() {};

	/**
	 * Checks whether an annotation for value help exists and adds type-ahead and value help.
	 *
	 * @param {object} mSettings Object with other options.
	 * @param {sap.ui.core.Control} mSettings.control The new control.
	 * @param {object} mSettings.edmProperty The Entity Data Model (EDM) property to which the <code>value</code> property of the
	 * <code>SmartField</code> control is bound.
	 * @param {object} mSettings.valueHelp The value help configuration.
	 * @param {object} mSettings.valueHelp.annotation The value help annotation.
	 * @param {string} mSettings.valueHelp.aggregation The aggregation to attach the value list to.
	 * @param {boolean} mSettings.valueHelp.noDialog If set to <code>true</code>, the creation of a value help dialog is omitted.
	 * @param {boolean} mSettings.valueHelp.noTypeAhead If set to <code>true</code>, the type ahead functionality is omitted.
	 * @param {string} [mSettings.valueHelp.displayBehaviour] This parameter is forwarded to value help providers. Default value is taken from "defaultDropDownDisplayBehaviour".
	 * @param {string} mSettings.valueHelp.dialogtitle A title for the value help dialog.
	 * @param {sap.ui.model.odata.ODataModel} mSettings.model The OData model instance object currently used.
	 * @param {function} [mSettings.onValueListChange] Event handler for change event of value list provider and value help provider.
	 * @protected
	 */
	ControlFactoryBase.prototype.createValueHelp = function(mSettings) {
		var oValueListProviderSettings,
			oControlConfig = this.getCustomDataConfiguration(),
			oSmartField = this._isInnerUoM() ? oControlConfig && oControlConfig.smartFieldRootControl : this._oParent,
			oEdmProperty = mSettings.edmProperty,
			oValueHelp = mSettings.valueHelp;

		if (oValueHelp.annotation && (oEdmProperty["sap:value-list"] || oEdmProperty["com.sap.vocabularies.Common.v1.ValueList"])) {

			// check the configuration for display behavior.
			var sDisplay = oValueHelp.displayBehaviour || this._getDisplayBehaviourConfiguration(),
				oDateFormatSettings = this._oParent.data("dateFormatSettings"),
				bPreventInitialDataFetchInVHDialog = this._getPreventInitialDataFetchInVHDialog(oEdmProperty);

			if (typeof oDateFormatSettings === "string") {
				try {
					oDateFormatSettings = JSON.parse(oDateFormatSettings);
				} catch (ex) {
					// Invalid date format settings provided, Ignore!
				}
			}

			// check what is the content of oValueHelp.annotation - path or annotation object
			var oAnnotation,
				sAnnotationPath,
				oConfigAnnotations,
				sValueListAnnotation,
				mDefaultFilterBarExpanded,
				mDefaultShowAllFilters,
				oConfigData;

			if (typeof oValueHelp.annotation === "string") {
				sAnnotationPath = oValueHelp.annotation;
			} else if (oValueHelp && typeof oValueHelp.annotation === "object") {

				if (oControlConfig) {
					oConfigAnnotations = oControlConfig.annotations;
					if (oConfigAnnotations && oConfigAnnotations.valuelist && typeof oConfigAnnotations.valuelist === "string") {
						sAnnotationPath = oConfigAnnotations.valuelist;
					}
				}

				sValueListAnnotation = oConfigAnnotations && ((oConfigAnnotations.valueListData && oConfigAnnotations.valueListData.annotation) || oConfigAnnotations.valuelist);
				oAnnotation = oValueHelp.analyser.getValueListAnnotationForFunctionImport({
					"": sValueListAnnotation || oValueHelp.annotation
				}, oEdmProperty.name).primaryValueListAnnotation;
			}

			var oControl = mSettings.control,
				oModel = mSettings.model,
				fnOnValueListChange = mSettings.onValueListChange;

			if (!oValueHelp.noDialog) {

				if (oControl.setFilterSuggests) {
					oControl.setFilterSuggests(false);
				}

				if (oSmartField) {
					if (oSmartField.isContextTable && oSmartField.isContextTable()) {
						oConfigData = oSmartField.data("configdata") && oSmartField.data("configdata").configdata;
						if (oConfigData) {
							mDefaultFilterBarExpanded = oConfigData.defaultFilterBarExpanded;
							mDefaultShowAllFilters = oConfigData.defaultShowAllFilters;
						}
					} else {
						mDefaultFilterBarExpanded = oSmartField.data("defaultFilterBarExpanded");
						mDefaultShowAllFilters = oSmartField.data("defaultShowAllFilters");
					}
				}
				var oValueHelpDlg = new ValueHelpProvider({
					context: "SmartField",
					fnAsyncWritePromise: (this._oParent._isAsync && this._oParent._isAsync()) ? this._oParent.checkValuesValidity.bind(this._oParent) : null,
					selectedODataRowHandler: this._selectedODataRowHandler.bind(this),
					fieldName: oEdmProperty.name,
					control: oControl,
					model: oModel,
					dateFormatSettings: oDateFormatSettings,
					displayBehaviour: sDisplay,
					// fieldViewMetadata: oEdmProperty,
					loadAnnotation: true,
					fullyQualifiedFieldName: sAnnotationPath,
					metadataAnalyser: oValueHelp.analyser,
					annotation: oAnnotation,

					title: oValueHelp.dialogtitle,
					preventInitialDataFetchInValueHelpDialog: bPreventInitialDataFetchInVHDialog,
					supportMultiSelect: !!oValueHelp.supportMultiSelect,
					supportRanges: !!oValueHelp.supportRanges,
					takeOverInputValue: true,
					type: oValueHelp.type,
					maxLength: oEdmProperty.maxLength,
					filterBarClass: SmartFilterBar,
					enabledMultiSelectionPlugin: oValueHelp?.enabledMultiSelectionPlugin !== undefined ? oValueHelp.enabledMultiSelectionPlugin : true,
					defaultFilterBarExpanded: mDefaultFilterBarExpanded,
					defaultShowAllFilters: mDefaultShowAllFilters
				});

				if (fnOnValueListChange) {
					oValueHelpDlg.attachValueListChanged(fnOnValueListChange);
				}

				this._aProviders.push(oValueHelpDlg);

				if (oControl.setShowValueHelp) {
					oControl.setShowValueHelp(true);
				}
			}

			var bHistoryEnabled = true,
				bHistoryEnabledInitial = true,
				bShowAllSuggestionsButton = true;

			if (this._oParent._getHistoryEnabled) {
				bHistoryEnabled = this._oParent._getHistoryEnabled();
				bHistoryEnabledInitial = this._oParent.isPropertyInitial("historyEnabled");
			}

			if (this._oParent.getShowValueHelp && !this._oParent.getShowValueHelp()) {
				bShowAllSuggestionsButton = false;
			}

			// Create ValueListProvider only for ComboBox etc and Inputs with showSuggest = true
			if (!oValueHelp.noTypeAhead || !oControl.isA("sap.m.Input")) {
				oValueListProviderSettings = {
					control: oControl,
					model: oModel,
					dateFormatSettings: oDateFormatSettings,
					displayBehaviour: sDisplay,
					fieldViewMetadata: oEdmProperty,
					loadAnnotation: true,
					fullyQualifiedFieldName: sAnnotationPath,
					metadataAnalyser: oValueHelp.analyser,
					annotation: oAnnotation,

					aggregation: oValueHelp.aggregation,
					typeAheadEnabled: !oValueHelp.noTypeAhead,
					dropdownItemKeyType: this.getDropdownItemKeyType(oControl),
					maxLength: oEdmProperty.maxLength,

					fieldHistoryEnabled: bHistoryEnabled,
					fieldHistoryEnabledInitial: bHistoryEnabledInitial,
					bShowAllSuggestionsButton: bShowAllSuggestionsButton
				};

				var oValueList = new ValueListProvider(this.getValueListProviderConfiguration(oValueListProviderSettings));

				if (!oValueHelp.noTypeAhead) {

					if (oControl.setShowSuggestion) {
						oControl.setShowSuggestion(true);
					}
				}

				if (fnOnValueListChange) {
					oValueList.attachValueListChanged(fnOnValueListChange);
				}

				this.oValueListDelegate = new ValueListDelegate(oValueList);
				this._aProviders.push(oValueList);
			}
		}
	};

	/**
	 * Gets the ValueListProvider configuration
	 *
	 * @param {object} oSettings object instance to be updated
	 * @returns {object} Display behavior or <code>null</code>
	 * @protected
	 */
	ControlFactoryBase.prototype.getValueListProviderConfiguration = function(oSettings) {
		return {
			context: "SmartField",
			fnAsyncWritePromise: (this._oParent._isAsync && this._oParent._isAsync()) ? this._oParent.checkValuesValidity.bind(this._oParent) : null,
			selectedODataRowHandler: this._selectedODataRowHandler.bind(this),
			control: oSettings.control,
			model: oSettings.model,
			dateFormatSettings: oSettings.dateFormatSettings,
			displayBehaviour: oSettings.displayBehaviour,
			fieldViewMetadata: oSettings.fieldViewMetadata,
			loadAnnotation: true,
			fullyQualifiedFieldName: oSettings.fullyQualifiedFieldName,
			metadataAnalyser: oSettings.metadataAnalyser,
			annotation: oSettings.annotation,
			aggregation: oSettings.aggregation,
			typeAheadEnabled: oSettings.typeAheadEnabled,
			dropdownItemKeyType: oSettings.dropdownItemKeyType,
			maxLength: oSettings.maxLength,
			fieldHistoryEnabled: oSettings.fieldHistoryEnabled,
			fieldHistoryEnabledInitial: oSettings.fieldHistoryEnabledInitial,
			bShowAllSuggestionsButton: oSettings.bShowAllSuggestionsButton
		};
	};

	/**
	 * Data row propagation on select from Suggestions or ValueHelpDialog
	 * @private
	 */
	ControlFactoryBase.prototype._selectedODataRowHandler = function (sValue, oDataRow, sAbsolutePathToVLProperty) {
		if (this.oTextArrangementDelegate) {
			this.oTextArrangementDelegate.setDataForNextDescriptionRequest(sValue, oDataRow);
			this.oTextArrangementDelegate.setAbsolutePathToVLProperty(sAbsolutePathToVLProperty);
		}
	};

	/**
	 * Returns a binding for a given attribute, if no binding is specified a fixed value or <code>null</code>, which is deduced from the
	 * information maintained on the parent.
	 *
	 * @param {string} sName the name of the attribute
	 * @returns {object} binding for a given attribute, if no binding is specified a fixed value or <code>null</code>.
	 * @public
	 */
	ControlFactoryBase.prototype.getAttribute = function(sName) {
		var oInfo = this._oParent.getBindingInfo(sName);

		if (oInfo) {
			return this._oBinding.toBindingPath(oInfo);
		}

		return this._oParent["get" + sName.substring(0, 1).toUpperCase() + sName.substring(1)]();
	};

	ControlFactoryBase.prototype.getCustomDataConfiguration = function() {
		var oCustomData = this._oParent && this._oParent.data && this._oParent.data("configdata");
		return oCustomData && oCustomData.configdata ? oCustomData.configdata : null;
	};

	/**
	 * Returns the standard attributes used during creation of a control.
	 *
	 * @param {string} sAttribute the "leading" attribute, can be <code>null</code>.
	 * @param {object} oTypeInfo optional type information.
	 * @param {map} mNames the names of the attributes to be set.
	 * @param {object} oEvent the optional description of an event to register to and raise the <code>change</code> event on the
	 *        <code>SmartField</code>.
	 * @param {string} oEvent.event the name of an event to register to and raise the <code>change</code> event on the <code>SmartField</code>.
	 * @param {string} oEvent.parameter the name of a parameter to send with the <code>change</code> event on the <code>SmartField</code>.
	 * @returns {map} the standard attributes used during creation of a control.
	 * @public
	 */
	ControlFactoryBase.prototype.createAttributes = function(sAttribute, oTypeInfo, mNames, oEvent) {
		var that = this,
			oFormatOptions,
			mAttributes = {};

		// check the standard attributes, whether they are bound or not.
		for (var sPropertyName in mNames) {

			if (mNames.hasOwnProperty(sPropertyName)) {
				var oBindingInfo = this._oParent.getBindingInfo(sPropertyName);

				if (oBindingInfo) {
					mAttributes[sPropertyName] = this._oBinding.toBinding(oBindingInfo);
				} else if ((sPropertyName === "valueState") && this._oParent.isPropertyInitial("valueState")) {
					oBindingInfo = this.getValueStateBindingInfoForRecommendationStateAnnotation();

					if (oBindingInfo) {
						mAttributes[sPropertyName] = oBindingInfo;
					} else {
						mAttributes[sPropertyName] = this._oParent["get" + capitalize(sPropertyName)]();
					}
				} else {
					mAttributes[sPropertyName] = this._oParent["get" + capitalize(sPropertyName)]();
				}

				if ((sPropertyName === "placeholder") && oTypeInfo && oTypeInfo.property && !mAttributes.placeholder) {
					mAttributes.placeholder = this._oHelper.oAnnotation.getPlaceholder(oTypeInfo.property);
				}
			}
		}

		// map the value binding of the parent smart field to the child control's attribute.
		if (sAttribute) {

			if (
				oTypeInfo &&
				oTypeInfo.property &&
				oTypeInfo.property.type === "Edm.String" &&
				((this._oHelper.oAnnotation.isStaticOptional(oTypeInfo.property) || (this._oParent && this._oParent._fieldControlValue === 3)) ||
				(this._oParent && !this._oParent.getClientSideMandatoryCheck()))
			) {
				oFormatOptions = {
					parseKeepsEmptyString: true
				};
			}

			if (oTypeInfo && oTypeInfo.property && MetadataAnalyser.getIsTimezoneProperty(oTypeInfo.property)) {
				mAttributes[sAttribute] = {
					model: this._oMetaData.model,
					path: this._oMetaData.path,
					parts: [{value : null}, {path : this._oMetaData.path}],
					type: oTypeInfo ? this._oTypes.getType(oTypeInfo, {showDate: false, showTime: false}) : null,
					mode: this._oParent.getBindingMode("value")
				};
			} else {
				mAttributes[sAttribute] = {
					model: this._oMetaData.model,
					path: this._oMetaData.path,
					type: oTypeInfo ? this._oTypes.getType(oTypeInfo, oFormatOptions) : null,
					mode: this._oParent.getBindingMode("value")
				};
			}
		}

		// prepare the event that triggers the parent smart field's change event.
		if (oEvent) {
			mAttributes[oEvent.event] = function(oControlEvent) {
				try {
					var mParametersOfInnerControl = oControlEvent.getParameters();
					var mParameters = {
						value: mParametersOfInnerControl[oEvent.parameter],
						newValue: mParametersOfInnerControl[oEvent.parameter]
					};

					that._oParent.fireChange(mParameters);
				} catch (ex) {
					Log.warning(ex);
				}
			};
		}

		return mAttributes;
	};

	/**
	 * Maps the bindings for the given attributes and collects.
	 *
	 * @param {map} mAttributes the standard attributes used during creation of a control.
	 * @param {map} mNames the names of the attributes to be mapped.
	 * @public
	 */
	ControlFactoryBase.prototype.mapBindings = function(mAttributes, mNames, oSettings) {
		var n,
			oInfo;

		for (n in mNames) {
			oInfo = this._oParent.getBindingInfo(n);

			if (oInfo) {
				mAttributes[mNames[n]] = this._oBinding.toBinding(oInfo);
			} else {
				mAttributes[mNames[n]] = oSettings && oSettings[mNames[n]] || this._oParent["get" + n.substring(0, 1).toUpperCase() + n.substring(1)]();
			}
		}
	};

	/**
	 * Gets the format settings given the <code>sFormat</code>.
	 *
	 * @param {string} sFormat The key identifying the format
	 * @returns {object} The format settings if available otherwise <code>null</code>
	 * @protected
	 */
	ControlFactoryBase.prototype.getFormatSettings = function(sFormat) {
		var mFormat = null,
			aCustom,
			oCustom,
			len;

		if (sFormat) {

			// check the simple data
			mFormat = this._oParent.data(sFormat);

			// check the custom data as fall-back.
			if (!mFormat) {
				aCustom = this._oParent.getCustomData();

				if (aCustom) {
					len = aCustom.length;

					while (len--) {
						oCustom = aCustom[len];

						if (oCustom.getKey() === sFormat) {
							mFormat = oCustom.getValue();
							break;
						}
					}
				}
			}

			// if we have a format, try to apply it.
			if (mFormat && typeof (mFormat) === "string") {
				try {
					mFormat = JSON.parse(mFormat);
				} catch (ex) {
					return null;
				}
			}
		}

		return mFormat;
	};

	/**
	 * Returns the ValueListProvider
	 * @returns {sap.ui.comp.providers.ValueListProvider} The value list provider if available
	 * @private
	 */
	ControlFactoryBase.prototype.getValueListProvider = function () {
		return this._aProviders.find(function (oProvider) {
			return oProvider.isA("sap.ui.comp.providers.ValueListProvider");
		});
	};

	/**
	 * Returns the ValueHelpProvider
	 * @returns {sap.ui.comp.providers.ValueHelpProvider} The value help provider if available
	 * @private
	 */
	ControlFactoryBase.prototype.getValueHelpProvider = function () {
		return this._aProviders.find(function (oProvider) {
			return oProvider.isA("sap.ui.comp.providers.ValueHelpProvider");
		});
	};

	ControlFactoryBase.prototype.destroyValueHelp = function() {
		this._aProviders.forEach(function(oProvider) {
			oProvider.destroy();
		});

		this._aProviders = [];
	};

	ControlFactoryBase.prototype.destroy = function() {
		this.destroyValueHelp();

		if (this._oBinding) {
			this._oBinding.destroy();
		}

		this._oBinding = null;
		this._oParent = null;
		this._oModel = null;
		this._oRb = null;
	};

	return ControlFactoryBase;
}, true);
