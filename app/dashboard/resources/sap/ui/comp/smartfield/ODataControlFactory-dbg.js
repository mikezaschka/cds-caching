/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/ui/core/Element",
	"sap/ui/core/library",
	"sap/m/library",
	"sap/ui/comp/library",
	"sap/ui/model/BindingMode",
	"sap/m/TextArea",
	"sap/m/Link",
	"sap/m/CheckBox",
	"sap/m/ComboBox",
	"sap/ui/comp/smartfield/ComboBox",
	"sap/m/DatePicker",
	"sap/m/DateTimePicker",
	"sap/m/HBox",
	"sap/m/Input",
	"sap/m/Select",
	"sap/m/Text",
	"sap/m/ExpandableText",
	"sap/ui/core/Renderer",
	"sap/ui/comp/navpopover/SmartLink",
	"./ControlFactoryBase",
	"./FieldControl",
	"./ODataControlSelector",
	"./ODataHelper",
	"sap/ui/comp/odata/ODataModelUtilSync",
	"./ODataTypes",
	"./TextArrangementDelegate",
	"sap/m/ObjectNumber",
	"sap/m/ObjectIdentifier",
	"sap/m/ObjectStatus",
	"sap/m/TimePicker",
	"sap/ui/comp/navpopover/SemanticObjectController",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/comp/smartfield/Configuration",
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/ui/comp/odata/FiscalMetadata",
	"sap/ui/core/InvisibleText",
	"sap/base/Log",
	"sap/base/assert",
	"sap/base/security/URLListValidator",
	"sap/base/util/merge",
	"sap/base/strings/capitalize",
	"sap/base/util/deepClone",
	"sap/base/strings/whitespaceReplacer",
	"sap/m/FlexItemData",
	"sap/ui/comp/odata/CalendarMetadata",
	"sap/ui/comp/odata/CriticalityMetadata"
], function(
	Localization,
	Element,
	coreLibrary,
	mobileLibrary,
	library,
	BindingMode,
	TextArea,
	Link,
	CheckBox,
	ComboBox,
	CompComboBox,
	DatePicker,
	DateTimePicker,
	HBox,
	Input,
	Select,
	Text,
	ExpandableText,
	Renderer,
	SmartLink,
	ControlFactoryBase,
	FieldControl,
	ODataControlSelector,
	ODataHelper,
	ODataModelUtilSync,
	ODataTypes,
	TextArrangementDelegate,
	ObjectNumber,
	ObjectIdentifier,
	ObjectStatus,
	TimePicker,
	SemanticObjectController,
	FormatUtil,
	Configuration,
	MetadataAnalyser,
	FiscalMetadata,
	InvisibleText,
	Log,
	assert,
	URLListValidator,
	merge,
	capitalize,
	deepClone,
	whitespaceReplacer,
	FlexItemData,
	CalendarMetadata,
	CriticalityMetadata
) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	// shortcut for sap.ui.core.TextAlign
	var TextAlign = coreLibrary.TextAlign;

	// shortcut for sap.m.InputType
	var InputType = mobileLibrary.InputType;

	// shortcut for sap.m.EmptyIndicatorMode
	var EmptyIndicatorMode = mobileLibrary.EmptyIndicatorMode;

	// shortcut for sap.m.FlexJustifyContent
	var FlexJustifyContent = mobileLibrary.FlexJustifyContent;

	// shortcut for sap.ui.comp.smartfield.CriticalityRepresentationType
	var CriticalityRepresentationType = library.smartfield.CriticalityRepresentationType;

	// shortcut for sap.ui.comp.smartfield.ControlContextType
	var ControlContextType = library.smartfield.ControlContextType;

	// shortcut for sap.ui.core.TextDirection
	var TextDirection = coreLibrary.TextDirection;

	var FlexAlignContent = mobileLibrary.FlexAlignContent;

	var TextInEditModeSource = library.smartfield.TextInEditModeSource;

	var ValueHelpTitleSource = library.smartfield.ValueHelpTitleSource;

	var SmartField;

	/**
	 * Constructor for a new <code>ODataControlFactory</code>.
	 *
	 * @param {sap.ui.model.odata.ODataModel} oModel The OData model currently used
	 * @param {sap.ui.comp.smartfield.SmartField} oParent The parent control
	 * @param {object} oMetaData The meta data used to initialize the factory
	 * @param {string} oMetaData.entitySet The name of the OData entity set
	 * @param {string} oMetaData.model The name of the model
	 * @param {string} oMetaData.path The path identifying the OData property
	 * @param {object} oMetaData.modelObject The ODataModel instance
	 *
	 * @class
	 * Factory class to create controls that are hosted by <code>sap.ui.comp.smartfield.SmartField</code>.
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @constructor
	 * @extends sap.ui.comp.smartfield.ControlFactoryBase
	 * @alias sap.ui.comp.smartfield.ODataControlFactory
	 * @private
	 * @since 1.28.0
	 */
	var ODataControlFactory = ControlFactoryBase.extend("sap.ui.comp.smartfield.ODataControlFactory", /** @lends sap.ui.comp.smartfield.ODataControlFactory.prototype */{
		constructor: function(oModel, oParent, oMetaData) {
			var oODataHelperDataModel;

			ControlFactoryBase.call(this, oModel, oParent);

			this.sName = "ODataControlFactory";
			this._oMetaData = {
				annotations: {}
			};

			this._oMeta = oMetaData;

			if (oModel) {
				oODataHelperDataModel = oModel;
			} else if (oMetaData && oMetaData.modelObject) {
				oODataHelperDataModel = oMetaData.modelObject;
			}

			this._oHelper = new ODataHelper(oODataHelperDataModel, this._oBinding, null, true);
			this._oFieldControl = new FieldControl(oParent, this._oHelper);
			this._oTypes = new ODataTypes(oParent);
			this._oSelector = new ODataControlSelector(this._oMetaData, oParent, this._oTypes);
			this.oTextArrangementDelegate = new TextArrangementDelegate(this);
			this.oValueListDelegate = null;
			this._bInitialized = false;
			this._bInitializeFromConfig = false;
			this.bPending = false;
			this.oMeasureField = null;

			// as only used in SmartField -> SmartField must already be loaded (do not put into define section to avoid cycle
			SmartField = sap.ui.require("sap/ui/comp/smartfield/SmartField");
			if (!SmartField) {
				throw new Error("SmartField module not loaded for " + this);
			}
		}
	});

	/**
	 * This flag is to be set only once if property type matches and should not
	 * be reset if the factory is destroyed or re-created.
	 * @param {object} oProperty Edm property
	 * @private
	 */
	ODataControlFactory.prototype._checkBoxFlag = function (oProperty) {
		if (!oProperty.type) {
			return;
		}

		if (oProperty.type === "Edm.Boolean") {
			// Flag is restricted for sap.ui.generic.template usage only
			this._oParent._bEdmBoolDetected = true;
		}
	};

	ODataControlFactory.prototype._findProperty = function (oFunctionImport, sPath) {
		return oFunctionImport.parameter.find(function (oParam) {
			return oParam.name === sPath;
		});
	};

	/**
	 * Initializes the meta data.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {string} oMetaData.entitySet the name of the OData entity set
	 * @param {string} oMetaData.entityType the name of the OData entity type
	 * @param {string} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @private
	 */
	ODataControlFactory.prototype._init = function(oMetaData) {
		var oEntitySet = oMetaData.entitySetObject || this._oHelper.oMeta.getODataEntitySet(oMetaData.entitySet),
			bIsMetaDataInitialised = this._oMetaData.path === oMetaData.path &&
									this._oMetaData.entitySet && oEntitySet && this._oMetaData.entitySet.name === oEntitySet.name &&
									this._oMetaData.model === oMetaData.model,
			oFunctionImport,
			oMetadataAnalyser,
			oEdmProperty;

		if (!oEntitySet) {
            oFunctionImport = this._oHelper.oMeta.getODataFunctionImport(oMetaData.entitySet);
			if (oFunctionImport) {
				oEntitySet = this._oHelper.oMeta.getODataEntitySet(oFunctionImport.entitySet) || {};
				this._oMetaData.functionImport = oFunctionImport; // Store function import object
				this._oParent._isFunctionImport = true; // Debugging trait
				this._oMetaData.functionImportProperty = this._findProperty(oFunctionImport, oMetaData.path);
			}
		}

		if (bIsMetaDataInitialised) {
			return;
		}

		// set the name of the model used, binding path of the property (complex or simple), entity set and entity type.
		this._oMetaData.model = oMetaData.model;
		this._oMetaData.path = oMetaData.path;
		this._oMetaData.entitySet = oEntitySet;

		if (this._oHelper.oMeta) {
			assert(this._oMetaData.entitySet, 'The entity set named "' + oMetaData.entitySet + '" was not found in the "' +
			this._oHelper.oMeta.getODataEntityContainer().name + '" entity container of the service metadata document. - ' +
			this.getMetadata().getName());
		}

		this._oMetaData.entityType = oMetaData.entityType || this._oHelper.oMeta.getODataEntityType(this._oMetaData.entitySet.entityType) || this._oMetaData?.functionImportProperty?.type;
		this._oMetaData.navigationPath = oMetaData.navigationPath || null;

		if (typeof oMetaData.ignoreInsertRestrictions === "boolean") {
			this._oMetaData.ignoreInsertRestrictions = oMetaData.ignoreInsertRestrictions;
		}

		if (this._oModel) {

			// get the property, considering navigation properties and complex types.
			this._oHelper.checkNavigationProperty(this._oMetaData, this._oParent);
			this._oHelper.getProperty(this._oMetaData);

			// make sure that no exceptions occur, if the property is not valid
			// => necessary for extensibility use cases, if an extension field has been deleted and the UI has not yet been adapted.
			oEdmProperty = this.getEdmProperty();

			if (this._oMetaData?.functionImportProperty) {
				if (!oEdmProperty) {
					oEdmProperty = this._oMetaData.functionImportProperty;
				} else {
					Object.assign(oEdmProperty,this._oMetaData.functionImportProperty);
				}
				if (oEdmProperty) {
					this._oMetaData.property.property = oEdmProperty;
				}
			}

			assert(!!oEdmProperty, 'The EDM property "' + oMetaData.path + '" was not found in the "' +
			this._oMetaData.entityType.namespace + "." + this._oMetaData.entityType.name + '" entity type. - ' + this.getMetadata().getName());

			if (oEdmProperty) {

				this._checkBoxFlag(oEdmProperty);

				// now get the remaining annotations, text, unit of measure and value list.
				if (!this._oParent._shouldSuppressTextAnnotation()) {
					this._oMetaData.annotations.text = this._oHelper.getTextProperty2(this._oMetaData);
				}

				oMetadataAnalyser = this._oHelper.getAnalyzer();
				this._oMetaData.annotations.uom = this._oHelper.getUnitOfMeasure2(this._oMetaData);
				this._oHelper.getValueListData(this._oMetaData);

				this._oMetaData.annotations.lineitem = oMetadataAnalyser.getLineItemAnnotation(this._oMetaData.entitySet.entityType);
				this._oMetaData.annotations.datapoint = oMetadataAnalyser.getDataPointAnnotation(this._oMetaData.entitySet.entityType);
				this._oMetaData.annotations.fieldgroup = oMetadataAnalyser.getFieldGroupAnnotation(this._oMetaData.entitySet.entityType);
				this._oMetaData.annotations.connectedfields = oMetadataAnalyser.getConnectedFieldsAnnotation(this._oMetaData.entitySet.entityType);

				this._oHelper.getUOMValueListAnnotationPath(this._oMetaData);
				this._oMetaData.annotations.semantic = MetadataAnalyser.getSemanticObjectsFromProperty(oEdmProperty);
				this._oMetaData.annotations.semanticKeys = oMetadataAnalyser.getSemanticKeyAnnotation(this._oMetaData.entitySet.entityType);
				this._oMetaData._isNumber = MetadataAnalyser.isNumber(oEdmProperty);

				this._oHelper.applyCriticality(this._oMetaData, this._getCriticalityQualifierConfiguration());

				if (this._oMetaData.annotations.uom) {
					this._oMetaData.annotations.uom.annotations = {};
					this._oHelper.getValueListData(this._oMetaData.annotations.uom);
				}

				// check for a possibly existing text annotation for the unit in unit of measure.
				this._oHelper.getUOMTextAnnotation(this._oMetaData);

				if (this._oParent && this._oParent.getExpandNavigationProperties && this._oParent.getExpandNavigationProperties()) {
					var oBindingContext = this._oParent.getBindingContext(),
						oBindingContextObject = oBindingContext && oBindingContext.getObject(),
						bCreated = oBindingContextObject && oBindingContextObject.__metadata.created;

					if (!bCreated) {

						// only auto expand when entity is persited on the server
						var sAutoExpand = this._oHelper.getAutoExpandProperties(oEdmProperty);

						if (sAutoExpand.length > 0) {
							this._oParent.bindElement({
								path: "",
								parameters: {
									expand: sAutoExpand,

									// select the data that is needed, not all properties of the entity which may have many
									select: sAutoExpand
								}
							});
						}
					}
				}
			}
		} else {
			this._oMetaData.modelObject = oMetaData.modelObject;
			this._oMetaData.property = oMetaData.property;
			this._oMetaData.annotations.text = oMetaData.annotations.text;
			this._oMetaData.annotations.uom = oMetaData.annotations.uom;

			if (this._oMetaData.annotations.uom && !this._oMetaData.annotations.uom.annotations) {
				this._oMetaData.annotations.uom.annotations = {};
			}

			if (oMetaData.annotations.valueListData) {
				this._oMetaData.annotations.valuelist = oMetaData.annotations.valueListData;
			} else {
				this._oMetaData.annotations.valuelist = oMetaData.annotations.valuelist;
			}

			this._oMetaData.annotations.lineitem = oMetaData.annotations.lineitem;
			this._oMetaData.annotations.datapoint = oMetaData.annotations.datapoint;
			this._oMetaData.annotations.fieldgroup = oMetaData.annotations.fieldgroup;
			this._oMetaData.annotations.connectedfields = oMetaData.annotations.connectedfields;

			this._oHelper.applyCriticality(this._oMetaData, this._getCriticalityQualifierConfiguration());

			this._oMetaData.annotations.valuelistType = oMetaData.annotations.valuelistType;
			this._oMetaData.annotations.semantic = oMetaData.annotations.semantic;
			this._oMetaData.annotations.valuelistuom = oMetaData.annotations.valuelistuom;
		}
	};

	ODataControlFactory.prototype._initValueList = function(oValueListAnnotations) {
		var oMetadataProperty = this._oMetaData.property,
			oValueListAnnotation = oValueListAnnotations.primaryValueListAnnotation;

		this._oMetaData.annotations.valueListData = oValueListAnnotation;
		oMetadataProperty.valueListAnnotation = oValueListAnnotation;
		oMetadataProperty.valueListKeyProperty = this._oHelper.getODataValueListKeyProperty(oValueListAnnotation);
		oMetadataProperty.valueListEntitySet = this._oHelper.oMeta.getODataEntitySet(oValueListAnnotation.valueListEntitySetName);
		oMetadataProperty.valueListEntityType = this._oHelper.oMeta.getODataEntityType(this._oHelper.oMeta.getODataEntitySet(oValueListAnnotation.valueListEntitySetName).entityType);
	};

	/**
	 * Tries to return a TextArrangement type
	 * @returns {sap.ui.comp.smartfield.type.TextArrangement|null}
	 * @private
	 */
	ODataControlFactory.prototype._getTextArrangementType = function () {
		var oType = null, mTextArrangementBindingPaths = TextArrangementDelegate.getPaths("ValueList", this._oMetaData);
		if (
			mTextArrangementBindingPaths.keyField &&
			mTextArrangementBindingPaths.descriptionField
		) {
			oType = this._oTypes.getType(this._oMetaData.property, null, null, {
				composite: true,
				keyField: mTextArrangementBindingPaths.keyField,
				descriptionField: mTextArrangementBindingPaths.descriptionField,
				valueListNoValidation: this._oParent._getComputedTextInEditModeSource() === "ValueListNoValidation"
			});

			if (Array.isArray(oType)) {
				oType = oType[0];
			}

			if (!(oType.isA("sap.ui.comp.smartfield.type.TextArrangementString") ||
					oType.isA("sap.ui.comp.smartfield.type.TextArrangementGuid"))) {
				oType = null;
			}
		}
		return oType;
	};

	/**
	 * Formats the value for rendering in display mode
	 * @param sId
	 * @param sDescription
	 * @returns {string}
	 * @privat
	 */
	ODataControlFactory.prototype._displayFormatter = function(sId, sDescription) {
		// BCP: 2370108763 In display mode with no value we should not show description
		if (sId === null) {
			return "";
		}

		if (this.oType && !this._bTextInDisplayModeValueList) {
			sId = this.oType.formatValue(sId, "string");
		}

		if (this.oType && this.oType.isA("sap.ui.comp.odata.type.NumericText") && sId === null && sDescription) {
			sId = "";
		}

		return this._formatDisplayBehaviour(null, sId, sDescription);
	};

	/**
	 * Creates a control instance based on OData meta data for display-only use cases.
	 *
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmDisplay = function(oSettings) {
		var oInnerControl,
			bMasked,
			bObjectIdentifier,
			oTextAnnotation = this._getLocalTextAnnotation(),
			vTextAnnotationPath = oTextAnnotation && oTextAnnotation.path || null,
			mAttributes,
			oBindingInfo,
			oBindingInfoSettings,
			getValue = "getText",
			that = this,
			mNames = {
				width: true,
				textAlign: true
			},
			oEdmProperty = this.getEdmProperty(),
			oConfig = this._oParent.data("configdata"),
			bDatePicker = this._oSelector.checkDatePicker() || (oEdmProperty ? oEdmProperty.type.startsWith("Edm.Date") : false),
			bTimePicker = oEdmProperty ? oEdmProperty.type === "Edm.Time" : false,
			bIsTimeZone = oEdmProperty && MetadataAnalyser.getIsTimezoneProperty(oEdmProperty),
			bIsObjectStatus = this._isObjectStatusScenario();

		if (this._checkLink() && !this._oSelector.useObjectIdentifier()) {
			return this._createLink(bDatePicker);
		}

		mAttributes = this.createAttributes(null, this._oMetaData.property, mNames);
		mAttributes.emptyIndicatorMode = EmptyIndicatorMode.Auto;

		this.oType = null;
		var sTimeZonePath = oEdmProperty && MetadataAnalyser.getTimezonePropertyPath(oEdmProperty) || false;
		if (oEdmProperty && oEdmProperty.type === "Edm.DateTimeOffset" && sTimeZonePath){
			this.oType = this._getDateFormatType();
			var fnFormatter = function (){
				if (!arguments[0] && !(this.oType.oFormatOptions && this.oType.oFormatOptions.showDate === false && this.oType.oFormatOptions.showTime === false)) {
					return "";
				}
				return this.oType.formatValue(arguments, "string");
			};
			mAttributes.text = {
				model: this._oMetaData.model,
				type: this.oType,
				parts: [
					{
						path: this._oMetaData.path,
						type: this.oType
					},
					{
						path: sTimeZonePath,
						parameters : {
							useUndefinedForUnresolved : true
						}
					}
				],
				useRawValues: true,
				formatter: fnFormatter.bind(this)
			};
		} else if (bDatePicker || bTimePicker) {
			this.oType = this._getDateFormatType();

			mAttributes.text = {
				model: this._oMetaData.model,
				path: this._oMetaData.path,
				type: this.oType
			};
		} else if (bIsTimeZone) {
			this.oType = this._oTypes.getType(this._oMetaData.property, {showDate: false, showTime: false});

			mAttributes.text = {
				model: this._oMetaData.model,
                parts :  [{value : null}, {path : this._oMetaData.path}],
                type : this.oType
			};
		} else {
			mAttributes.text = {
				model: this._oMetaData.model,
				type: this.oType
			};
			if (this._bTextInDisplayModeValueList &&
				this._oMetaData.property &&
				this._oMetaData.property.valueListAnnotation) {
				oBindingInfoSettings = {};
				if (this._oHelper.oAnnotation.isUpperCase(this._oMetaData.property.property)) {
					oBindingInfoSettings.sDisplayFormat = "UpperCase";
				}
				oBindingInfoSettings.valueListNoValidation = this._oParent._getComputedTextInEditModeSource() === "ValueListNoValidation";
				oBindingInfo = this.oTextArrangementDelegate.getBindingInfo(oBindingInfoSettings);
				this.oType = oBindingInfo.type;
				mAttributes.text.parts = oBindingInfo.parts;
			}

			if (!this.oType) {
				var bTextInEditSourceConfig = this._oParent.data("defaultTextInEditModeSource") && this._oParent.isPropertyInitial("textInEditModeSource");
				this.oTextArrangementDelegate.checkRequiredMetadata(this._oParent._getComputedTextInEditModeSource(), bTextInEditSourceConfig);
				this.oType = this._oTypes.getType(this._oMetaData.property);
				mAttributes.text.path = this._oHelper.getEdmDisplayPath(this._oMetaData);
			}

			mAttributes.text.type = this.oType;
		}

		if (oEdmProperty) {

			// password handling
			bMasked = this._oHelper.oAnnotation.isMasked(oEdmProperty);

			if (bMasked) {
				mAttributes.text.formatter = ODataTypes.maskValue;
			}

			if (vTextAnnotationPath) {
				bObjectIdentifier = this._oSelector.useObjectIdentifier(bDatePicker, bMasked);

				if (bObjectIdentifier) {
					delete mAttributes.width;
					delete mAttributes.textAlign;
					mAttributes.text = {
						path: this._oMetaData.path
					};
					mAttributes.title = {
						path: this._oHelper.getEdmDisplayPath(this._oMetaData)
					};

					if (this._oParent.hasListeners("press")) {
						mAttributes.titleActive = true;
						mAttributes.titlePress = function(oEvent) {
							that._oParent.firePress(oEvent);
						};
					} else if (this._oMetaData.annotations.semantic && this._oMetaData.annotations.semantic.defaultSemanticObject) {
						var bTitleActive;
						var oSmartLink;
						var aSemanticObjects = this._oMetaData.annotations.semantic.additionalSemanticObjects.concat(this._oMetaData.annotations.semantic.defaultSemanticObject);

						SemanticObjectController.getDistinctSemanticObjects().then(function(oSemanticObjects) {
							bTitleActive = SemanticObjectController.hasDistinctSemanticObject(aSemanticObjects, oSemanticObjects);

							if (bTitleActive) {
								var oInfo = that._oParent.getBindingInfo("value");
								var sPath = oInfo.parts[0].path;

								oSmartLink = new SmartLink({
									semanticObject: that._oMetaData.annotations.semantic.defaultSemanticObject,
									additionalSemanticObjects: that._oMetaData.annotations.semantic.additionalSemanticObjects,
									fieldName: sPath
								});

								/**
								 * @deprecated As of version 1.126
								 */
								if (!oSmartLink.hasListeners("navigationTargetsObtained")) {
									oSmartLink.attachNavigationTargetsObtained(function(oEvent) {
										const oObjectIdentifier = Element.getElementById(oEvent.getSource().getControl());
										const oMainNavigation = oEvent.getParameters().mainNavigation;

										// 'mainNavigation' might be undefined
										if (oMainNavigation) {
											oMainNavigation.setDescription(oObjectIdentifier.getText());
										}

										oEvent.getParameters().show(oObjectIdentifier.getTitle(), oMainNavigation, undefined, undefined);
									});
								}

								if (!oSmartLink.hasListeners("navigationTargetsObtained")) {
									oSmartLink.setNavigationTargetsObtainedCallback((oNavigationInformation) => {
										const oObjectIdentifier = Element.getElementById(oNavigationInformation.originalId);
										const oMainNavigation = oNavigationInformation.mainNavigation;
										// 'mainNavigation' might be undefined
										if (oMainNavigation) {
											oMainNavigation.setDescription(oObjectIdentifier.getText());
										}

										return Promise.resolve({
											mainNavigationId: oObjectIdentifier.getTitle(),
											mainNavigation: oMainNavigation
										});
									});
								}
							}
						});
						mAttributes.titleActive = {
							path: "$sapuicompsmartfield_distinctSO>/distinctSemanticObjects",
							formatter: function(oSemanticObjects) {
								return SemanticObjectController.hasDistinctSemanticObject(aSemanticObjects, oSemanticObjects);
							}
						};
						mAttributes.titlePress = function(oEvent) {
							if (bTitleActive && oSmartLink) {
								const oFieldInfo = oSmartLink.getFieldInfo();
								if (!oFieldInfo) {
									return;
								}

								oFieldInfo.open(oEvent.getSource(), oEvent);

								oFieldInfo.setSourceControl(oEvent.getSource());
								oEvent.getSource().addDependent(oSmartLink);
							}
						};
					}
				} else if (!(oConfig && (oConfig.isInnerControl === true))) {
					mAttributes.text = {};
					mAttributes.text.parts = [];
					mAttributes.text.parts.push(this._oMetaData.path);
					mAttributes.text.parts.push(this._oHelper.getEdmDisplayPath(this._oMetaData));
					mAttributes.text.formatter = this._displayFormatter.bind(this);
				}
			} else if (this._oSelector.checkCheckBox()) {
				mAttributes.text.formatter = function(sValue) {
					return that._formatDisplayBehaviour("defaultCheckBoxDisplayBehaviour", sValue);
				};
			}
		}

		if (bObjectIdentifier) {
			oInnerControl = new ObjectIdentifier(this._oParent.getId() + "-objIdentifier", mAttributes);

			if (this._oMetaData.annotations.semantic) {
				oInnerControl.setModel(SemanticObjectController.getJSONModel(), "$sapuicompsmartfield_distinctSO");
			}
		} else {
			// do not wrap for dates. Incident ID : 1570841150
			if (mAttributes.text.type && mAttributes.text.type.isA("sap.ui.comp.smartfield.type.DateTime") && mAttributes.text.type.oConstraints && mAttributes.text.type.oConstraints.isDateOnly) {
				mAttributes.wrapping = false;
			}

			if (this._oParent.isContextTable() && Localization.getRTL()) {
				mAttributes.textDirection = "LTR";
			}

			if (typeof mAttributes.text.formatter === "undefined" && !sTimeZonePath && !bIsTimeZone) {
				mAttributes.text.formatter = function(sInput) {
					return whitespaceReplacer(sInput);
				};
			}

			mAttributes.renderWhitespace = true;

			if (this._oHelper.oAnnotation.isMultiLineText(oEdmProperty)) {
				delete mAttributes.width;
				oInnerControl = new ExpandableText(this._oParent.getId() + "-expandableText", mAttributes);
			} else if (bIsObjectStatus && !this._isInnerUoM()){
				delete mAttributes.width;
				delete mAttributes.textAlign;
				delete mAttributes.renderWhitespace;

				this._addMetadataObjectStatusAttributes(mAttributes, oEdmProperty.criticalityInfo);

				oInnerControl = new ObjectStatus(this._oParent.getId() + "-objStatus", mAttributes);
			} else {
				oInnerControl = new Text(this._oParent.getId() + "-text", mAttributes);
			}
		}

		// If ObjectIdentifier onText shouldn't get invoked. This is legacy and there is no test coverage, so it should stay.
		if (bObjectIdentifier && oConfig && oConfig.configdata && oConfig.configdata.onText) {
			delete oConfig.configdata.onText;
		}

		var mControlInfo = {
			control: oInnerControl,
			onCreate: "_onCreate",
			params: {
				getValue: getValue,
				noValidations: true,
				type: null
			}
		};

		if (this.oType) {
			mControlInfo.type = {
				type: this.oType,
				property: this._oMetaData.property
			};
		}

		return mControlInfo;
	};

	/**
	 * Returns a date format object for internal use
	 * @returns {object} Date Format object
	 * @private
	 */
	ODataControlFactory.prototype._getDateFormatType = function () {
		var oDateFormatSettings = this.getFormatSettings("dateFormatSettings"),
			oEdmProperty = this.getEdmProperty(),
			mOptions;

		// BCP: 2070396210 Try to deepClone the object so we do not modify the external references
		try {
			mOptions = deepClone(oDateFormatSettings);
		} catch (e) {
			// FallBack if for some reason we can't make a clone
			mOptions = oDateFormatSettings;
		}

		// The UTC format option of the DateTimeOffset data type class should always be set to false for properties
		// typed as Edm.DateTimeOffset, as the time zone should be always UTC.
		// If the UTC setting provided by the application through custom data is set to true, it should NOT be passed to
		// the DateTimeOffset data type class as format option, because the date should be parsed and formatted as local
		// time zone instead of UTC.
		// BCP: 2070218971
		if (mOptions && oEdmProperty && oEdmProperty.type === "Edm.DateTimeOffset") {
			mOptions.UTC = false;
		}

		return this._oTypes.getType(this._oMetaData.property, mOptions);
	};

	/**
	 * Creates a control instance based on OData meta data.
	 *
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmTime = function() {
		var mOptions = this.getFormatSettings("dateFormatSettings"),
			mNames = {
				width: true,
				placeholder: true,
				valueState: true,
				valueStateText: true
			};

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(TimePicker.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mAttributes = {
			valueFormat: "HH:mm:ss" // BCP: 1580232741
		};

		mAttributes = Object.assign(mAttributes, this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames, {
			event: "change",
			parameter: "value"
		}));

		// normalise default width
		if (mAttributes.width === "") {
			mAttributes.width = "100%";
		}

		if (mOptions) {
			mAttributes[sValuePropertyMap].type = this._oTypes.getType(this._oMetaData.property, mOptions);
		}

		var oControl = new TimePicker(this._oParent.getId() + "-timePicker", mAttributes);
		this._enhanceInputControls(oControl);

		return {
			control: oControl,
			onCreate: "_onCreate",
			params: {
				getValue: "getValue",
				type: {
					type: mAttributes.value.type,
					property: this._oMetaData.property
				}
			}
		};
	};

	/**
	 * Creates a <code>sap.m.ObjectStatus</code> instance.
	 *
	 * @returns {sap.m.ObjectStatus} the new control instance
	 * @private
	 * @since 1.34.0
	 */
	ODataControlFactory.prototype._createProposedObjectStatus = function() {
		var mAttributes = this.createAttributes(null, this._oMetaData.property, null),
			oTextAnnotation = this._getLocalTextAnnotation();

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(ObjectStatus.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		if (oTextAnnotation) {
			mAttributes[sValuePropertyMap] = {
				parts: [
					this._oHelper.getEdmDisplayPath(this._oMetaData)
				]
			};
		} else {
			mAttributes[sValuePropertyMap] = {
				model: this._oMetaData.model,
				path: this._oMetaData.path,
				type: this._oTypes.getType(this._oMetaData.property)
			};
		}

		this._addProposedObjectStatusAttributes(mAttributes);

		var oInnerControl = new ObjectStatus(this._oParent.getId() + "-objStatus", mAttributes);

		return {
			control: oInnerControl,
			onCreate: "_onCreate",
			params: {
				getValue: "getText",
				noValidation: true
			}
		};
	};

	/**
	 * Adds the attributes and properties for object status to the overall attributes for control construction.
	 * This method is to be used only when the ObjectStatus is proposed.
	 *
	 * @param {object} mAttributes The overall attributes for control construction
	 * @private
	 */
	ODataControlFactory.prototype._addProposedObjectStatusAttributes = function(mAttributes) {
		var oInfo,

			// check the state and place an icon, if necessary.
			oProposal = this._oParent.getControlProposal(),
			oStatus = oProposal && oProposal.getObjectStatus();

		if (oStatus) {
			oInfo = oStatus.getBindingInfo("criticality");
		}

		var fCriticality = function(vCriticality) {
			var oStatesInt = {
				0: ValueState.None,
				1: ValueState.Error,
				2: ValueState.Warning,
				3: ValueState.Success
			};
			var oStatesString = {
				"com.sap.vocabularies.UI.v1.CriticalityType/Neutral": ValueState.Neutral,
				"com.sap.vocabularies.UI.v1.CriticalityType/Negative": ValueState.Warning,
				"com.sap.vocabularies.UI.v1.CriticalityType/Critical": ValueState.Error,
				"com.sap.vocabularies.UI.v1.CriticalityType/Positive": ValueState.Success
			};

			return oStatesString[vCriticality] || oStatesInt[vCriticality] || ValueState.None;
		};

		var fIcon = function() {
			var	oIcons = {};
			oIcons[ValueState.Error] = "sap-icon://error";
			oIcons[ValueState.Warning] = "sap-icon://alert";
			oIcons[ValueState.Success] = "sap-icon://sys-enter-2";
			oIcons[ValueState.None] = null;

			var oCriticality;

			if (oInfo) {
				if (oInfo.formatter) {
					oCriticality = oInfo.formatter.apply(null, arguments);
				} else {
					oCriticality = arguments[0];
				}
			} else {
				oCriticality = oStatus.getCriticality();
			}

			if ((oCriticality === undefined) || (oCriticality === null)) {
				return null;
			}

			return oIcons[fCriticality(oCriticality)];
		};

		var fHasIcon = function() {
			if (!oStatus) {
				return false;
			}

			return oStatus.getCriticalityRepresentationType() !== CriticalityRepresentationType.WithoutIcon;
		};

		if (oInfo) {
			mAttributes.state = {
				formatter: function() {
					var oCriticality;

					if (oInfo.formatter) {
						oCriticality = oInfo.formatter.apply(null, arguments);
					} else {
						oCriticality = arguments[0];
					}

					return fCriticality(oCriticality);
				},
				parts: oInfo.parts
			};

			if (fHasIcon()) {
				mAttributes.icon = {
					formatter: fIcon,
					parts: oInfo.parts
				};
			}
		} else {
			if (oStatus) {
				mAttributes.state = fCriticality(oStatus.getCriticality());
			}
			if (fHasIcon()) {
				mAttributes.icon = fIcon();
			}
		}
	};

	/**
	 * Adds the attributes and properties for object status to the overall attributes for control construction.
	 *
	 * @param {object} mAttributes The overall attributes for control construction
	 * @param {object} oCriticalityInfo The criticality metadata information
	 * @private
	 */
	ODataControlFactory.prototype._addMetadataObjectStatusAttributes = function(mAttributes, oCriticalityInfo) {
		var bShowIcon;

		if (!oCriticalityInfo) {
			return;
		}

		bShowIcon = CriticalityMetadata.getShowCriticalityIcon(oCriticalityInfo.criticalityRepresentationType);

		if (oCriticalityInfo.path) {
			mAttributes.state = {
				path: oCriticalityInfo.path,
				formatter: CriticalityMetadata.getCriticalityState
			};
			if (oCriticalityInfo.criticalityRepresentationPath) {
				mAttributes.icon = {
					parts: [
						{
							path: oCriticalityInfo.path
						}, {
							path: oCriticalityInfo.criticalityRepresentationPath
						}
					],
					formatter: function(sCriticality, sCriticalityRepresentationType) {
						return CriticalityMetadata.getShowCriticalityIcon(sCriticalityRepresentationType) ? CriticalityMetadata.getCriticalityIcon(sCriticality) : undefined;
					}
				};
			} else if (bShowIcon) {
				mAttributes.icon = {
					path: oCriticalityInfo.path,
					formatter: CriticalityMetadata.getCriticalityIcon
				};
			}
		} else {
			mAttributes.state = CriticalityMetadata.getCriticalityState(oCriticalityInfo.criticalityType);
			if (oCriticalityInfo.criticalityRepresentationPath) {
				mAttributes.icon = {
					path: oCriticalityInfo.criticalityRepresentationPath,
					formatter: function(sCriticalityRepresentationType) {
						return CriticalityMetadata.getShowCriticalityIcon(sCriticalityRepresentationType) ? CriticalityMetadata.getCriticalityIcon(oCriticalityInfo.criticalityType) : undefined;
					}
				};
			} else if (bShowIcon) {
				mAttributes.icon = CriticalityMetadata.getCriticalityIcon(oCriticalityInfo.criticalityType);
			}
		}
	};

	ODataControlFactory.prototype._isObjectStatusScenario = function () {
		const oEdmProperty = this.getEdmProperty();
		const oCriticalityInfo = oEdmProperty && oEdmProperty.criticalityInfo;

		if (oCriticalityInfo && oCriticalityInfo.criticalityFrom !== "ConnectedFields") {
			return true;
		}

		//Making sure the Criticality from ConnectedFields is applied only with SemanticGroupElement parent
		if (oCriticalityInfo &&
			oCriticalityInfo.criticalityFrom === "ConnectedFields" &&
			this._oParent.getParent().isA('sap.ui.comp.smartform.SemanticGroupElement')) {
			return true;
		}

		return false;
	};

	/**
	 * Creates sap.m.Input control to be used inside SmartField with appropriate ID
	 * @param {object} mAttributes to be propagated to the sap.m.Input constructor
	 * @returns {sap.m.Input} input control
	 * @private
	 */
	ODataControlFactory.prototype._createInput = function (mAttributes) {
		var oControl = new Input(this._oParent.getId() + "-input", mAttributes);

		this._enhanceInputControls(oControl);

		return oControl;
	};

	/**
	 * Sets preferUserInteraction on UI5 controls supporting it.
	 * @param {sap.ui.core.Control} oControl UI5 control instance
	 * @private
	 */
	ODataControlFactory.prototype._enhanceInputControls = function (oControl) {
		// BCP: 2270069122, 2270083721
		// We would like to preserve user input if binding resolves after it.
		if (
			oControl.isA("sap.m.InputBase") &&
			typeof oControl._setPreferUserInteraction === "function"
		) {
			oControl._setPreferUserInteraction(true);
		}
	};

	/**
	 * Creates a control instance based on OData meta data to edit a model property of type <code>Edm.String</code>.
	 * Either <code>sap.m.Input</code> is returned or <code>sap.m.ComboBox</code> depending on configuration.
	 *
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmString = function(oSettings) {
		var oBindingInfoSettings = {},
			sMode = oSettings.mode,
			mAttributes = {},
			bEmptyStringSignificant = this.isEmptyStringSignificant(),
			oFiscalControl;

		if (this._oSelector.checkCheckBox()) {
			return this._createCheckBox();
		}

		var oControlSelector = this._oSelector.checkSelection();

		if (oControlSelector.selection) {
			return this._createSelect({
				valueHelp: ODataControlFactory.getValueHelpDropdownSettings(oControlSelector)
			});
		}

		oControlSelector = this._oSelector.checkComboBox(oSettings);

		if (oControlSelector.combobox) {
			return this._createComboBox({
				valueHelp: ODataControlFactory.getValueHelpDropdownSettings(oControlSelector),
				edit: true
			});
		}

		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			tooltip: true,
			name: true,
			valueState: true,
			valueStateText: true
		};

		var oEdmProperty = this.getEdmProperty();

		if (this._oHelper.oAnnotation.isMultiLineText(oEdmProperty)) {
			delete mNames["width"];
			return this._createMultiLineText({
				attributesNamesMap: mNames
			});
		}

		var bTextInEditModeSourceNotNone = this._oParent.isTextInEditModeSourceNotNone(),
			bEdmPropertyTypeSupported = /Edm.String|Edm.Guid/.test(oEdmProperty.type);

		if (bTextInEditModeSourceNotNone || this._bTextInDisplayModeValueList) {
			assert(bEdmPropertyTypeSupported, "The ValueList and NavigationProperty" +
				"members of the sap.ui.comp.smartfield.TextInEditModeSource enumeration are only supported for OData " +
				"EDM Properties typed as Edm.String or Edm.Guid. - " + this.getMetadata().getName());
		}

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Input.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var sTextInEditModeSource = this._oParent._getComputedTextInEditModeSource(),
			bDefaultTextInEditModeSource,
			bValidForValidation;

		if (
			this._oParent.data("defaultTextInEditModeSource") &&
			this._oParent.isPropertyInitial("textInEditModeSource") &&
			sMode === "edit"
		) {
			bDefaultTextInEditModeSource = true;
		}

		if (bEdmPropertyTypeSupported) {
			this.oTextArrangementDelegate.bValidMetadata = this.oTextArrangementDelegate.checkRequiredMetadata(sTextInEditModeSource, bDefaultTextInEditModeSource);
			bValidForValidation = this._oHelper.checkValueListRequiredMetadataForValidation(this._oMetaData.property);
		}

		if (this.oTextArrangementDelegate.bValidMetadata) {
			// TextArrangement + validation
			mAttributes = this.createAttributes("", this._oMetaData.property, mNames);
			oBindingInfoSettings.valueListNoValidation = this._oParent._getComputedTextInEditModeSource() === "ValueListNoValidation";
			mAttributes[sValuePropertyMap] = this.oTextArrangementDelegate.getBindingInfo(oBindingInfoSettings);
		} else if (
			sTextInEditModeSource === TextInEditModeSource.ValueList &&
			bValidForValidation &&
			sMode === "edit"
		) {
			// Validation only in edit mode
			mAttributes = this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames);
			mAttributes[sValuePropertyMap] = this.oTextArrangementDelegate.getBindingInfo(oBindingInfoSettings);
		} else if (bEmptyStringSignificant) {
			mAttributes = this.createAttributes(sValuePropertyMap, Object.assign({isStringNullable: true},  this._oMetaData.property), mNames);
		} else {
			mAttributes = this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames);
		}


		if (FiscalMetadata.isFiscalValue(oEdmProperty)) {
				mAttributes.placeholder = mAttributes.value?.type?.formatter?.getPattern();
				oFiscalControl = this._createInput(mAttributes);
				// handle change event
				this._handleEventingForEdmString({
					control: oFiscalControl,
					edmProperty: this._oMetaData.property.property
				});
				return {
					control: oFiscalControl,
					onCreate: "_onCreate",
					params: {
						getValue: "getValue",
						type: {
							type: mAttributes.value.type,
							property: this._oMetaData.property
						}
					}
				};
		}

		if (CalendarMetadata.isCalendarValue(oEdmProperty)) {
			mAttributes.placeholder = mAttributes.value?.type?.formatter?.getPattern();
			const oCalendarControl = this._createInput(mAttributes);
			// handle change event
			this._handleEventingForEdmString({
				control: oCalendarControl,
				edmProperty: this._oMetaData.property.property
			});
			return {
				control: oCalendarControl,
				onCreate: "_onCreate",
				params: {
					getValue: "getValue",
					type: {
						type: mAttributes.value.type,
						property: this._oMetaData.property
					}
				}
			};
		}

		var oAttributesConstraints = mAttributes.value.type && mAttributes.value.type.oConstraints;

		if (oAttributesConstraints && oAttributesConstraints.maxLength && !MetadataAnalyser.isValueList(oEdmProperty)) {
			mAttributes.maxLength = oAttributesConstraints.maxLength;
		}

		var oControl = this._createInput(mAttributes);

		// password entry
		if (this._oHelper.oAnnotation.isMasked(oEdmProperty)) {
			oControl.setType(InputType.Password);
		}

		// optional call-back to layout the text as unit for unit of measure.
		var oCustomDataConfig = this.getCustomDataConfiguration();
		if (this.oTextArrangementDelegate.bValidMetadata) {
			this._handleEventingForTextArrangement({
				control: oControl
			});
			const oValueListKeyProperty = this?._oMetaData?.property?.valueListKeyProperty,
				oControlDocumentationRef = oValueListKeyProperty ? oValueListKeyProperty["com.sap.vocabularies.Common.v1.DocumentationRef"] : undefined;
			if (oControlDocumentationRef) {
				this.getODataHelper()._setControlDocumentationRef(oControl, oControlDocumentationRef);
			}
		} else {
			// add optional upper case conversion.
			this._handleEventingForEdmString({
				control: oControl,
				edmProperty: this._oMetaData.property.property,
				currency: oCustomDataConfig && oCustomDataConfig.currency
			});
		}

		return {
			control: oControl,
			onCreate: "_onCreate",
			params: {
				valuehelp: {
					annotation: oControlSelector.annotation,
					noDialog: !this._oParent.getShowValueHelp(),
					noTypeAhead: !this._oParent.getShowSuggestion(),
					aggregation: "suggestionRows"
				},
				getValue: "getValue",
				type: {
					type: mAttributes.value.type,
					property: this._oMetaData.property,
					emptyStringSignificant: bEmptyStringSignificant
				}
			}
		};
	};

	ODataControlFactory.prototype.isEmptyStringSignificant = function() {
		var oEdmProperty = this.getEdmProperty(),
			bHasSemantics = oEdmProperty && ( oEdmProperty["sap:semantics"] === "currency-code" || oEdmProperty["sap:semantics"] === "unit-of-measure" ),

			sValueListsDisplayBehavior = this._getDisplayBehaviourConfiguration(),
			bHasProperDisplayBehavior = (sValueListsDisplayBehavior === "descriptionAndId" || sValueListsDisplayBehavior === "idAndDescription") || false,

			oValueListData = this._oMetaData.annotations && this._oMetaData.annotations.valueListData,
			bHasTextAnnotation = oValueListData && oValueListData.descriptionField !== undefined;

		return bHasProperDisplayBehavior && !bHasSemantics && bHasTextAnnotation || false;
	};

	ODataControlFactory.prototype.getLocalTextPropertyName = function() {
		var sDescriptionFieldName,
			oMetadataAnalyser = this._oHelper.getAnalyzer(),
			oEdmProperty = this.getEdmProperty();

			if (oMetadataAnalyser && oEdmProperty) {
				sDescriptionFieldName = oMetadataAnalyser.getDescriptionFieldName(oEdmProperty);
			}

		return sDescriptionFieldName;
	};

	ODataControlFactory.getValueHelpDropdownSettings = function(oControlSelector) {
		return {
			annotation: oControlSelector.annotation,
			noDialog: true,
			noTypeAhead: true
		};
	};

	/**
	 * Gets the maximum length respecting type constraints and parent settings.
	 *
	 * @private
	 */
	ODataControlFactory.prototype._getMaxLength = function() {
		return this._oTypes.getMaxLength(this._oMetaData.property, this._oParent.getBindingInfo("value"));
	};

	ODataControlFactory.prototype._addAriaLabelledBy = function(oControl) {
		var oInvisibleText,
			oTargetControl,
			oConfigData,
			oParentControlContext = this._oParent.getControlContext();

		if ((oParentControlContext === ControlContextType.None) || (oParentControlContext === ControlContextType.Form) || (oParentControlContext === ControlContextType.SmartFormGrid)) {
			ControlFactoryBase.prototype._addAriaLabelledBy.apply(this, arguments);

			// only add label from meta data if we use SmartField inside SmartField
			oConfigData = this._oParent.data("configdata");

			if (oConfigData && oConfigData.configdata.isInnerControl) {

				if (oControl) {
					oTargetControl = oControl.control;
					if (oTargetControl instanceof HBox) {
						if (oTargetControl.getItems().length > 0) {
							oTargetControl = oTargetControl.getItems()[0];
						}
					}
				}

				if (oTargetControl && oTargetControl.getAriaLabelledBy && oTargetControl.getAriaLabelledBy().length === 0) {
					var oEdmProperty = this.getEdmProperty();

					if (this._oHelper.oAnnotation.getLabel(oEdmProperty)) {
						oInvisibleText = new InvisibleText({
							text: this._oHelper.oAnnotation.getLabel(oEdmProperty)
						});
						oTargetControl.addAriaLabelledBy(oInvisibleText);
						this._oParent.addAggregation("_ariaLabelInvisibleText", oInvisibleText);
					}
				}
			}
		}
	};

	/**
	 * Handles the ariaDescribedBy logic
	 *
	 * @private
	 */
	ODataControlFactory.prototype._addAriaDescribedBy = function() {
		var oParentControlContext = this._oParent.getControlContext();
		if ((oParentControlContext === ControlContextType.None) || (oParentControlContext === ControlContextType.Form) || (oParentControlContext === ControlContextType.SmartFormGrid)) {
			ControlFactoryBase.prototype._addAriaDescribedBy.apply(this, arguments);
		}
	};

	/**
	 * Event handler for live changes/changes on the input control. The live-change event handler ensures the value is always in upper case
	 *
	 * @param {object} oSettings The settings
	 * @param {object} oSettings.control attached either to liveChange or change event
	 * @param {object} oSettings.edmProperty the property for which to attach the events
	 * @param {boolean} [oSettings.currency] Whether the <code>oSettings.control</code> is a currency field
	 * @private
	 */
	ODataControlFactory.prototype._handleEventingForEdmString = function(oSettings) {
		var oControl = oSettings.control;

		if (!oControl) {
			return;
		}

		oControl.attachChange(function onCurrencyInputFieldChange(oControlEvent) {
			var oNewEvent = this._getChangeEventParams(oControlEvent),
				mParameters = oControlEvent && oControlEvent.getParameters(),
				oSource = oControlEvent && oControlEvent.getSource(),
				sValue, bIsSuggestionPopupOpen, oContent, oSuggestionPopupContainer,
				bHasSelectedSuggestedItem = null;

			if (mParameters) {
				sValue = mParameters.value;
				oNewEvent.value = sValue;
				oNewEvent.newValue = sValue;

				bIsSuggestionPopupOpen = oControl._oSuggestionPopup && oControl._oSuggestionPopup.isOpen();

				if (bIsSuggestionPopupOpen) {
					oContent = oControl._oSuggestionPopup.getContent && oControl._oSuggestionPopup.getContent();
					oSuggestionPopupContainer = (oContent && oContent.length > 0 && oContent[0] && oContent[0].isA("sap.m.Table")) && oContent[0];
					bHasSelectedSuggestedItem = (oSuggestionPopupContainer && oSuggestionPopupContainer.getSelectedItem) && oSuggestionPopupContainer.getSelectedItem();

					if (!mParameters.validated && bHasSelectedSuggestedItem) {
						return; // ignore that one; change via ValueListProvider will follow as next
					}
				}

				if (oSettings.currency) {
					var oUpdateModelPropertiesSettings = this.getCurrencyValidationSettings();
					oUpdateModelPropertiesSettings.oSource = oSource;

					if (this._oHelper.oAnnotation.isUpperCase(oSettings.edmProperty) && sValue) {
						sValue = sValue.toUpperCase();
						oControl.setValue(sValue);
					}
				}

				try {
					this._oParent.fireChange(oNewEvent);
				} catch (oException) {
					Log.error(oException);
				}
			}

		}.bind(this));
	};

	/**
	 * Event handler for live changes/changes on the input control.
	 *
	 * @param {object} oSettings The settings
	 * @param {object} oSettings.control attached either to liveChange or change event
	 * @private
	 */
	ODataControlFactory.prototype._handleEventingForTextArrangement = function(oSettings) {
		var oControl = oSettings.control;

		if (!oControl) {
			return;
		}

		oControl.attachChange(function (oControlEvent) {
			var oNewEvent = this._getChangeEventParams(oControlEvent),
				oSuggestionPopover = oControl._oSuggPopover,
				bHasSuggestions = oControl.getShowSuggestion(),
				bSuggestionsOpened = bHasSuggestions && oSuggestionPopover.isOpen(),
				bHasSelectedSuggestedItem = false;

			if (bSuggestionsOpened) {
				var oSuggItemsContainer = oSuggestionPopover.getItemsContainer && oSuggestionPopover.getItemsContainer();
				bHasSelectedSuggestedItem = oSuggItemsContainer && oSuggItemsContainer.getSelectedItem() !== null;
			}

			//onfocusleave with selected suggestion item the change event is fired twice
			//Below if statement suppresses one of the fired events
			if (bSuggestionsOpened && (!oNewEvent.validated && bHasSelectedSuggestedItem)) {
				return;
			}

			//BCP: 2370128224 - on invalid value sometimes comes with the description of the last chosen item
			//Below if statement makes sure to pass only the new input for event's value
			if (!bHasSelectedSuggestedItem && !oNewEvent.validated) {
				const oInnerControlValueBinding = this._oParent.getFirstInnerControl?.().getBinding?.("value"),
					sValue = oInnerControlValueBinding && oInnerControlValueBinding.getCurrentValues?.()[0],
					sTextArrangement = oInnerControlValueBinding && oInnerControlValueBinding?.oType?.oFormatOptions?.textArrangement;

				if (sValue && sTextArrangement &&
					(sTextArrangement === "idAndDescription" ||
					sTextArrangement === "descriptionAndId") && this._oParent.getValueState() !== "Error"){
						oNewEvent.newValue = sValue;
						oNewEvent.value = sValue;
					}
			}

			try {
				var oConfig = this._oParent.data("configdata");

				if (oConfig && oConfig.configdata && this._oParent.isTextInEditModeSourceNotNone()){
					this._oParent.checkValuesValidity()
						.catch(function(){
							//validation errors are shown on the field
						})
						.finally(function() {
							this._oParent.fireChange(oNewEvent);
						}.bind(this));
				} else {
					this._oParent.fireChange(oNewEvent);
				}

			} catch (oException) {
				Log.error(oException);
			}

		}.bind(this));
	};


	/**
	 * Gets an event handler for the <code>change</code> event for the unit of measure text input field.
	 *
	 * @param {object} oSettings The settings
	 * @param {sap.ui.comp.smartfield.SmartField} oSettings.smartFieldRootControl The SmartField control instance
	 * @param {boolean} [oSettings.unit] Flag indicating whether the measure or the unit is affected by the change
	 * @param {boolean} [oSettings.currency] Flag indicating whether the handle is for a currency field
	 * @returns {function} An event handler for the <code>change</code> event of a unit of measure text input field.
	 */
	ODataControlFactory.prototype.getUOMChangeHandler = function(oSettings) {
		return function(oControlEvent) {
			try {
				var oSmartFieldRootControl = oSettings.smartFieldRootControl,
					mParameters = oControlEvent.getParameters(),
					sMeasureValue = mParameters.value,
					oSource = oControlEvent.getSource(),
					bCurrency = oSettings.currency,
					oUpdateModelPropertiesSettings = bCurrency ? this.getCurrencyValidationSettings(oSettings)
									: this.getUnitValidationSettings(oSettings);

				oUpdateModelPropertiesSettings.oSource = oSource;
				bCurrency ? this.updateModelPropertiesForCurrency("value", oUpdateModelPropertiesSettings)
						: this.updateModelPropertiesForUnit("value", oUpdateModelPropertiesSettings);

				oSmartFieldRootControl.fireChange({
					value: sMeasureValue,
					newValue: sMeasureValue,
					unitChanged: !!oSettings.unit,
					validated: !!mParameters.validated
				});
			} catch (oException) {
				if (oException.validationUnitError) {
					oSmartFieldRootControl.fireChange({
						value: sMeasureValue,
						newValue: sMeasureValue,
						unitChanged: !!oSettings.unit,
						validated: !!mParameters.validated
					});
				}
				Log.error(oException);
			}
		}.bind(this);
	};

	ODataControlFactory.prototype.getCurrencyValidationSettings = function(oSettings) {
		var oSmartFieldRootControl;

		if (oSettings) {
			oSmartFieldRootControl = oSettings.smartFieldRootControl;
		} else {
			var oCustomDataConfig = this.getCustomDataConfiguration();
			oSmartFieldRootControl = oCustomDataConfig && oCustomDataConfig.smartFieldRootControl;
		}

		var aInnerControls = oSmartFieldRootControl.getInnerControls();

		return {
			amountField: aInnerControls[0],
			currencyField: aInnerControls[1],
			errorState: oSmartFieldRootControl._oError,
			checkValidity: oSmartFieldRootControl.checkValuesValidity.bind(oSmartFieldRootControl),
			rootControl: oSmartFieldRootControl,
			bindingContext: oSmartFieldRootControl.getBindingContext()
		};
	};

	ODataControlFactory.prototype.getUnitValidationSettings = function(oSettings) {
		var oSmartFieldRootControl;

		if (oSettings) {
			oSmartFieldRootControl = oSettings.smartFieldRootControl;
		} else {
			var oCustomDataConfig = this.getCustomDataConfiguration();
			oSmartFieldRootControl = oCustomDataConfig && oCustomDataConfig.smartFieldRootControl;
		}

		var aInnerControls = oSmartFieldRootControl.getInnerControls();

		return {
			measureField: aInnerControls[0],
			unitField: aInnerControls[1],
			errorState: oSmartFieldRootControl._oError,
			checkValidity: oSmartFieldRootControl.checkUnitValidity.bind(oSmartFieldRootControl),
			rootControl: oSmartFieldRootControl
		};
	};

	/**
	 * Handles specifics around setting values to a currency field.
	 * @private
	 */
	ODataControlFactory.prototype._setCurrencyValues = function (oBinding, aValues, oContext) {
		var aBindings = oBinding.getBindings(),
			oAmountContext = aBindings[0].getContext(),
			oCurrencyContext = aBindings[1].getContext();

		// Set validation context to field so we save values on the proper binding
		oBinding.setContext(oContext);
		oBinding.setValue(aValues);

		// Restore new context
		aBindings[0].setContext(oAmountContext);
		aBindings[1].setContext(oCurrencyContext);
	};

	ODataControlFactory.prototype.updateModelPropertiesForCurrency = function(sPropertyName, oSettings) {
		var oAmountField = oSettings.amountField,
			oCurrencyField = oSettings.currencyField,
			oOringinSource = oSettings.oSource,
			sAmountRawValue = oAmountField.getValue(),
			sCurrencyBoundPropertyName,
			oCurrencySmartField,
			sCurrencyRawValue = "";

		if (oCurrencyField) {
			var sCurrencyFieldMetadataName = oCurrencyField.getMetadata().getName();
			sCurrencyBoundPropertyName = ODataControlFactory.getBoundPropertiesMapInfoForControl(sCurrencyFieldMetadataName, {
				propertyName: sPropertyName
			})[0];

			oCurrencySmartField = oCurrencyField.getParent();
			if (this._getDisplayBehaviourConfiguration() && oCurrencySmartField && (oCurrencySmartField.getEditable && (!oCurrencySmartField.getEditable() || oCurrencySmartField._oFactory._getTextArrangementType()))) {
				sCurrencyRawValue = oCurrencySmartField.getBinding("value").getValue();
			} else {
				var sCurrencyMutatorName = "get" + capitalize(sCurrencyBoundPropertyName);
				sCurrencyRawValue = oCurrencyField[sCurrencyMutatorName]();
			}
		}

		var aRawValues = [sAmountRawValue, sCurrencyRawValue];
		var oCheckValiditySettings = {
			rawValues: aRawValues,
			handleSuccess: false
		};

		var oValuesValidityPromise = oSettings.checkValidity(oCheckValiditySettings);

		function handleCurrencyFieldsValidationSuccess(bSuppressAmountUpdate) {
			var oDataModel = oAmountField.getModel(),
				oAmountBinding = oAmountField.getBinding(sPropertyName),
				oCurrencyBinding,
				oCurrencyBindingType;

			if (oCurrencyField) {
				oCurrencyBinding = oCurrencyField.getBinding(sCurrencyBoundPropertyName);
				oCurrencyBindingType = oCurrencyBinding.getType();
			}

			var oAmountBindingType = oAmountBinding.getType(),
				sOldAmountFormatedValue = oAmountBinding.getExternalValue(),
				sOldCurrencyFormatedValue = oCurrencyBinding && oCurrencyBinding.getExternalValue(),
				aValuesParsed = oAmountBindingType.parseValue(sAmountRawValue, "string", aRawValues),
				sCurrencyValueParsed = aValuesParsed[1],
				sAmountFormatedValue = oAmountBindingType.formatValue(aValuesParsed, "string"),
				sCurrencyFormatedValue = oCurrencyBindingType && oCurrencyBindingType.formatValue(sCurrencyValueParsed, "string");

			if (oDataModel.getDefaultBindingMode() === BindingMode.TwoWay) {

				if (!bSuppressAmountUpdate) {
					this._setCurrencyValues(oAmountBinding, aValuesParsed, oSettings.bindingContext);
				}
			}

			if (!bSuppressAmountUpdate) {
				oAmountField.setValue(sAmountFormatedValue);
			}

			var bAllowPreventDefault = false,
				bEnableEventBubbling = true;

			if (oAmountBinding.hasValidation() && !bSuppressAmountUpdate) {

				var oAmountValidationSuccessSettings = {
					element: oAmountField,
					property: sPropertyName,
					type: oAmountBindingType,
					newValue: sAmountFormatedValue,
					oldValue: sOldAmountFormatedValue,
					mParameters: {
						originSource: oOringinSource
					}
				};

				oAmountField.fireValidationSuccess(oAmountValidationSuccessSettings, bAllowPreventDefault, bEnableEventBubbling);
			}

			if (oCurrencyBinding && oCurrencyBinding.hasValidation()) {

				var oCurrencyValidationSuccessSettings = {
					element: oCurrencyField,
					property: sCurrencyBoundPropertyName,
					type: oCurrencyBindingType,
					newValue: sCurrencyFormatedValue,
					oldValue: sOldCurrencyFormatedValue,
					mParameters: {
						originSource: oOringinSource
					}
				};

				oCurrencyField.fireValidationSuccess(oCurrencyValidationSuccessSettings, bAllowPreventDefault, bEnableEventBubbling);
			}

		}

		function handleCurrencyFieldsValidationError(oReason) {}

		function handleCurrencyFieldsValidationFinally() {
			var oErrorState = oSettings.errorState;

			if (oErrorState.bComplex && oErrorState.bFirst && oErrorState.bSecond) {
				var sAmountValue = oAmountField.getBinding(sPropertyName).getExternalValue();
				aRawValues = [sAmountValue, sCurrencyRawValue];

				var oCheckValiditySettings = {
					rawValues: aRawValues,
					innerControls: [oCurrencyField],
					handleSuccess: false
				};

				var oValuesValidityPromise = oSettings.checkValidity(oCheckValiditySettings);
				oValuesValidityPromise.then(function () {
						return handleCurrencyFieldsValidationSuccess.call(this, true);
					}.bind(this)).catch(handleCurrencyFieldsValidationError);
			}
		}

		oValuesValidityPromise.then(function () {
									return handleCurrencyFieldsValidationSuccess.call(this);
								}.bind(this))
								.catch(handleCurrencyFieldsValidationError)
								.finally(handleCurrencyFieldsValidationFinally);
	};

	ODataControlFactory.prototype.updateModelPropertiesForUnit = function(sPropertyName, oSettings) {
		var oMeasureField = oSettings.measureField,
			oUnitField = oSettings.unitField,
			sMeasureRawValue = oMeasureField.getValue(),
			sUnitBoundPropertyName,
			sUnitRawValue = "",
			oOringinSource = oSettings.oSource,
			sMeasureFieldMetadataName = oMeasureField.getMetadata().getName(),
			bAllowPreventDefault,
			bEnableEventBubbling,
			aMeasureValuesPropertyMap = {},
			sMeasureParam,
			mMeasureSuccessParameters;

		if (oUnitField) {
			var sUnitFieldMetadataName = oUnitField.getMetadata().getName();
			sUnitBoundPropertyName = ODataControlFactory.getBoundPropertiesMapInfoForControl(sUnitFieldMetadataName, {
				propertyName: sPropertyName
			})[0];

			var sUnitMutatorName = "get" + capitalize(sUnitBoundPropertyName),
				oUnitSmartField = oUnitField.getParent();
			if (oUnitField.isA("sap.m.ComboBox")) {
				sUnitRawValue = oUnitField.getSelectedKey();
			} else if (this._getDisplayBehaviourConfiguration() && oUnitSmartField && (!oUnitSmartField.getEditable() || oUnitSmartField._oFactory._getTextArrangementType())) {
				sUnitRawValue = oUnitSmartField.getBinding("value").getValue();
			} else {
				sUnitRawValue = oUnitField[sUnitMutatorName]();
			}
		} else if (this._checkSuppressUnit()){
			var sUnitPath = this.getMetaData().annotations.uom.path,
				oMeasureBindingContext = oMeasureField.getBindingContext();
			sUnitRawValue = this._oModel.getData(sUnitPath, oMeasureBindingContext);
		}

		var aRawValues = [sMeasureRawValue, sUnitRawValue];
		var oCheckValiditySettings = {
			rawValues: aRawValues,
			handleSuccess: false
		};

		var bValid = oSettings.checkValidity(oCheckValiditySettings);
		if (bValid) {
			var oDataModel = oMeasureField.getModel(),
				oMeasureBinding = oMeasureField.getBinding(sPropertyName),
				oUnitBinding,
				oUnitBindingType;

			if (oUnitField) {
				oUnitBinding = oUnitField.getBinding(sUnitBoundPropertyName);
				oUnitBindingType = oUnitBinding.getType();
			}

			var oMeasureBindingType = oMeasureBinding.getType(),
				aValuesParsed = oMeasureBindingType.parseValue(sMeasureRawValue, "string", aRawValues),
				sUnitValueParsed = aValuesParsed[1],
				sMeasureFormattedValue,
				sUnitFormattedValue;
				if (sUnitValueParsed === undefined && oUnitField && !oUnitField.getEditable) {
					sMeasureFormattedValue = oMeasureBindingType.formatValue([aValuesParsed[0], null], "string");
					sUnitFormattedValue = sUnitValueParsed;
				} else {
					sMeasureFormattedValue = oMeasureBindingType.formatValue(aValuesParsed, "string");

					if (!oMeasureBinding.isA("sap.ui.comp.smartfield.type.Unit")) {
						sUnitValueParsed = sUnitRawValue;
					}

					sUnitFormattedValue = oUnitBindingType && oUnitBindingType.formatValue(sUnitValueParsed, "string");
				}

			if (oDataModel.getDefaultBindingMode() === BindingMode.TwoWay) {
				oMeasureBinding.setValue(aValuesParsed);
				bAllowPreventDefault = false;
				bEnableEventBubbling = true;
				aMeasureValuesPropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(sMeasureFieldMetadataName, {
					propertyName: "value"
				});
				sMeasureParam = aMeasureValuesPropertyMap && aMeasureValuesPropertyMap[0];
				mMeasureSuccessParameters = {
					element: oMeasureField,
					property: sMeasureParam,
					type: oMeasureBinding.getType(),
					newValue: sMeasureRawValue,
					oldValue: oMeasureBinding.getValue(),
					mParameters: {
						originSource: oOringinSource
					}
				};
				oMeasureField.fireValidationSuccess(mMeasureSuccessParameters, bAllowPreventDefault, bEnableEventBubbling);
			}

			oMeasureField.setValue(sMeasureFormattedValue);

			if (oUnitField && oUnitField.getEditable && oUnitField.getEditable() && oUnitField.getParent().getVisible() && !oUnitField.isA("sap.m.ComboBox")) {
				oUnitField.setValue(sUnitFormattedValue);
			}
		}
	};

	/**
	 * Creates an instance of <code>sap.m.Combobox</code> based on OData meta data.
	 *
	 * @param {object} mSettings The settings
	 * @param {object} mSettings.valueHelp The value help configuration
	 * @param {object} mSettings.valueHelp.annotation The value help annotation
	 * @param {boolean} mSettings.valueHelp.noDialog Whether or not the value help dialog is created
	 * @param {boolean} mSettings.valueHelp.noTypeAhead Whether or not the type ahead functionality is required
	 * @param {boolean} mSettings.edit If set to <code>false</code>, the combo box will be rendered as static text
	 * @returns {sap.m.ComboBox} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createComboBox = function(mSettings) {
		var oControl = null,
			bIsMComboBoxRequired = this._isMComboBoxRequired(),
			oComboBoxType = bIsMComboBoxRequired ? ComboBox : CompComboBox,
			sComputedTEMS = this._oParent._getComputedTextInEditModeSource(),
			sCompComboBoxProperty = sComputedTEMS === "ValueList" ? "realValue" : "value",
			sPropertyName = bIsMComboBoxRequired ? "value" : sCompComboBoxProperty,
			mNames = {
				width: true,
				textAlign: true,
				placeholder: true,
				tooltip: true,
				name: true,
				valueState: true
			},
			sValuePropertyMap,
			mAttributes = {},
			// ensure that combo box always takes maximum width.
			mWidthAttributes = {width: "100%"},
			bEmptyStringSignificant = false;
		sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(oComboBoxType.getMetadata().getName(), {
			propertyName: sPropertyName
		})[0];

		mAttributes["change"] = this._oHelper.getDropdownChangeHandler(this._oParent, !bIsMComboBoxRequired);

		if (mSettings.edit) {
			if (bIsMComboBoxRequired) {
				mAttributes = Object.assign(mAttributes, this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames), mWidthAttributes);
				oControl = new ComboBox(this._oParent.getId() + "-comboBoxEdit", mAttributes);
			} else {
				if (MetadataAnalyser.getIsTimezoneProperty(this._oMetaData.property)) {
					mAttributes = Object.assign(mAttributes, this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames), mWidthAttributes);
				} else {
					bEmptyStringSignificant = true;
					mAttributes = Object.assign(mAttributes, this.createAttributes(sValuePropertyMap, Object.assign({isStringNullable: true}, this._oMetaData.property), mNames), mWidthAttributes);
				}
				oControl = new CompComboBox(this._oParent.getId() + "-comboBoxEdit", mAttributes);
			}
			this._enhanceInputControls(oControl);

			oControl.attachChange(function () {
				this._oParent.oValidation.handleComboValidation(oControl);
			}.bind(this));
		} else {
			// TODO Remove this dead code
			// DisplayedComboBox class is deleted a few years ago
			mAttributes = Object.assign(mAttributes, this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames), mWidthAttributes);
			oControl = this._createDisplayedComboBox(mAttributes);
		}

		this._oParent.oValidation.addValidationToType(mAttributes[sValuePropertyMap].type);

		oControl.setFilterFunction(function(sTerm, oItem){
			RegExp.escape = function (s) {
				return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
			};
			var escapedTerm = RegExp.escape(sTerm);
			var regexPattern  = new RegExp(escapedTerm, "i");

			return oItem.getText().match(new RegExp(regexPattern, "i")) || oItem.getKey().match(new RegExp(regexPattern, "i"));
		});

		oControl.useHighlightItemsWithContains = function() {
			return true;
		};

		return {
			control: oControl,
			onCreate: "_onCreate",
			params: {
				valuehelp: {
					annotation: mSettings.valueHelp.annotation,
					aggregation: "items",
					noDialog: mSettings.valueHelp.noDialog,
					noTypeAhead: mSettings.valueHelp.noTypeAhead
				},
				getValue: "get" + sValuePropertyMap[0].toUpperCase() + sValuePropertyMap.slice(1),
				type: {
					type: mAttributes[sValuePropertyMap].type,
					property: this._oMetaData.property,
					emptyStringSignificant: bEmptyStringSignificant
				}
			}
		};
	};

	/**
	 * Creates an instance of <code>sap.ui.comp.smartfield.DisplayComboBox</code> but with an adapted <code>sap.m.Text</code>
	 * renderer. The rendered is basically taken over and adapted from <code>sap.m.TextRenderer</code>.
	 *
	 * @param {object} mAttributes control specific attributes
	 * @returns {sap.ui.comp.smartfield.DisplayComboBox} The new control instance
	 * @private
	 */
	ODataControlFactory.prototype._createDisplayedComboBox = function(mAttributes) {

		var DisplayComboBox = ComboBox.extend("sap.ui.comp.smartfield.DisplayComboBox", {
			metadata: {
				library: "sap.ui.comp",
				properties: {

					wrapping: {
						type: "boolean",
						group: "Appearance",
						defaultValue: true
					}
				}
			},
			renderer: {
				apiVersion: 2,
				render: function(oRm, oControl) {

					// coding adapted from sap.m.Text renderer
					var sWidth = oControl.getWidth(),
						sText = oControl.getValue(),
						sTextDir = oControl.getTextDirection(),
						sTextAlign = oControl.getTextAlign(),
						sTooltip = oControl.getTooltip_AsString(),
						bWrapping = oControl.getWrapping();

					// start writing html
					oRm.openStart("span", oControl);
					oRm.class("sapMText");
					oRm.class("sapUiSelectable");

					// set classes for wrapping
					if (bWrapping) {

						// no space text must break
						if (sText && (sText.length > 0) && !/\s/.test(sText)) {
							oRm.class("sapMTextBreakWord");
						}
					} else {
						oRm.class("sapMTextNoWrap");
					}

					// write style and attributes
					if (sWidth && (sText !== "")) {
						oRm.style("width", sWidth);
					} else {
						oRm.class("sapMTextMaxWidth");
					}

					if (sTextDir !== TextDirection.Inherit) {
						oRm.attr("dir", sTextDir.toLowerCase());
					}

					if (sTooltip) {
						oRm.attr("title", sTooltip);
					}

					if (sTextAlign) {
						sTextAlign = Renderer.getTextAlign(sTextAlign, sTextDir);

						if (sTextAlign) {
							oRm.style("text-align", sTextAlign);
						}
					}

					var sWhitespaceClass = bWrapping ? "sapMTextRenderWhitespaceWrap" : "sapMTextRenderWhitespace";
					oRm.class(sWhitespaceClass);

					// finish writing html
					oRm.openEnd();

					sText.replace(/\r\n|\n\r|\r/g, "\n"); // normalize text
					oRm.text(sText);
					oRm.close("span");
				}
			},
			updateDomValue: function(sValue) {

				if (!this.isActive()) {
					return this;
				}

				// respect to max length
				sValue = this._getInputValue(sValue);

				// update the DOM value when necessary
				// otherwise cursor can goto end of text unnecessarily
				if (this.$().text() !== sValue) {
					this.$().text(sValue);

					// dom value updated other than value property
					this._bCheckDomValue = true;
				}

				return this;
			},
			getValue: function() {
				return this.getProperty("value");
			},
			getFocusDomRef: function() {
				return this.getDomRef();
			},
			getEditable: function() {
				return false;
			}
		});

		return new DisplayComboBox(this._oParent.getId() + "-comboBoxDisp", mAttributes);
	};

	/**
	 * Creates an instance of <code>sap.m.Select</code> based on OData meta data.
	 *
	 * @param {object} mSettings The settings
	 * @param {object} mSettings.valueHelp the value help configuration
	 * @param {object} mSettings.valueHelp.annotation the value help annotation
	 * @param {boolean} mSettings.valueHelp.noDialog if set to <code>true</code> the creation of a value help dialog is omitted
	 * @param {boolean} mSettings.valueHelp.noTypeAhead if set to <code>true</code> the type ahead functionality is omitted
	 * @returns {sap.m.Select} the new control instance
	 * @private
	 */
	ODataControlFactory.prototype._createSelect = function(mSettings) {
		var mNames = {
				width: true,
				name: true,
				valueState: true
			},
			oSelect;

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Select.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mAttributes = {
			change: this._oHelper.getDropdownChangeHandler(this._oParent),
			forceSelection: false
		};

		mAttributes = Object.assign(mAttributes, this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames));

		if (mAttributes.width === "") {
			mAttributes.width = "100%";
		}

		oSelect = new Select(this._oParent.getId() + "-select", mAttributes);
		this._enhanceInputControls(oSelect);

		return {
			control: oSelect,
			onCreate: "_onCreate",
			params: {
				valuehelp: {
					annotation: mSettings.valueHelp.annotation,
					aggregation: "items",
					noDialog: mSettings.valueHelp.noDialog,
					noTypeAhead: mSettings.valueHelp.noTypeAhead
				},
				getValue: "getSelectedKey",
				type: {
					type: mAttributes.selectedKey.type,
					property: this._oMetaData.property
				}
			}
		};
	};

	/**
	 * Creates an instance of <code>sap.m.CheckBox</code> based on OData meta data. The Edm.Type of the property is <code>Edm.String</code> with
	 * <code>maxLength</code> <code>1</code>.
	 *
	 * @returns {sap.m.CheckBox} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createCheckBox = function() {
		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(CheckBox.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mAttributes = this.createAttributes(sValuePropertyMap, null, {}, {
			event: "select",
			parameter: "selected"
		});

		mAttributes.editable = (this._oParent.getEditable() && this._oParent.getEnabled() && this._oParent.getContextEditable());
		mAttributes.selected.type = this._oTypes.getAbapBoolean();

		return {
			control: new CheckBox(this._oParent.getId() + "-cBox", mAttributes),
			onCreate: "_onCreate",
			params: {
				getValue: "getSelected"
			}
		};
	};

	/**
	 * Creates a control instance based on OData meta data to edit a model property of type <code>Edm.DateTime</code>. Either an instance of
	 * <code>sap.m.DateTimePicker</code> is returned or <code>sap.m.DatePicker</code>, if the attribute <code>display-format</code> of the
	 * OData property the control is bound to has the value <code>Date</code> or the control configuration is accordingly.
	 *
	 * @returns {sap.ui.core.Control} The new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmDateTime = function() {
		var mOptions = this.getFormatSettings("dateFormatSettings"),
			sValuePropertyMap,
			oDateTimePicker,
			oDatePicker;

		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			name: true,
			valueState: true
		};

		var mAttributes = this.createAttributes(null, this._oMetaData.property, mNames, {
			event: "change",
			parameter: "value"
		});

		// check whether a date picker has been configured.
		if (this._oSelector.checkDatePicker()) {
			sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(DatePicker.getMetadata().getName(), {
				propertyName: "value"
			})[0];

			mAttributes[sValuePropertyMap] = {
				path: this._oMetaData.path,
				type: this._oTypes.getType(this._oMetaData.property, mOptions, {
					displayFormat: "Date"
				}),
				model: this._oMetaData.model,
				mode: this._oParent.getBindingMode("value")
			};

			// set display format to keep data type and date picker control "in sync".
			if (mOptions && mOptions.style) {
				mAttributes.displayFormat = mOptions.style;
			}

			oDatePicker = new DatePicker(this._oParent.getId() + "-datePicker", mAttributes);
			this._enhanceInputControls(oDatePicker);

			return {
				control: oDatePicker,
				onCreate: "_onCreate",
				params: {
					getValue: "getValue",
					type: {
						type: mAttributes.value.type,
						property: this._oMetaData.property
					}
				}
			};
		}

		sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(DateTimePicker.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		mAttributes[sValuePropertyMap] = {
			path: this._oMetaData.path,
			model: this._oMetaData.model,
			type: this._oTypes.getType(this._oMetaData.property, mOptions),
			mode: this._oParent.getBindingMode("value")
		};

		oDateTimePicker = new DateTimePicker(this._oParent.getId() + "-input", mAttributes);
		this._enhanceInputControls(oDateTimePicker);

		return {
			control: oDateTimePicker,
			onCreate: "_onCreate",
			params: {
				getValue: "getValue",
				type: {
					type: mAttributes.value.type,
					property: this._oMetaData.property
				}
			}
		};
	};

	/**
	 * Creates a control instance based on OData meta data to edit a model property of type <code>Edm.DateTimeOffset</code>.
	 *
	 * @returns {sap.m.DateTimePicker} The new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmDateTimeOffset = function() {
		var mOptions,
			mDateFormatSettings = this.getFormatSettings("dateFormatSettings"),
			oEdmProperty = this.getEdmProperty(),
			oDateTimePicker;

		// BCP: 2180272821 Try to deepClone the object so we do not modify the external references
		try {
			mOptions = deepClone(mDateFormatSettings);
		} catch (e) {
			// FallBack if for some reason we can't make a clone
			mOptions = mDateFormatSettings;
		}

		// The UTC format option of the DateTimeOffset data type class should always be set to false for properties
		// typed as Edm.DateTimeOffset, as the time zone should be always UTC.
		// If the UTC setting provided by the application through custom data is set to true, it should NOT be passed to
		// the DateTimeOffset data type class as format option, because the date should be parsed and formatted as local
		// time zone instead of UTC.
		if (mOptions) {
			mOptions.UTC = false;
		}

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(DateTimePicker.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			name: true,
			valueState: true
		};

		var mAttributes = this.createAttributes(null, this._oMetaData.property, mNames, {
			event: "change",
			parameter: "value"
		});

		var sTimeZonePath = oEdmProperty && MetadataAnalyser.getTimezonePropertyPath(oEdmProperty) || false;
		if (sTimeZonePath){
			if (mDateFormatSettings && mDateFormatSettings.showTimezone === false) {
				mAttributes.showTimezone = false;
			} else {
				mAttributes.showTimezone = true;
			}

			if (mOptions && mOptions.style) {
				mAttributes.displayFormat = mOptions.style;
			}

			if (mOptions && mOptions.pattern) {
				mAttributes.displayFormat = mOptions.pattern;
			}

			this.oType = this._oTypes.getType(this._oMetaData.property, mOptions);
			mAttributes[sValuePropertyMap] = {
				model: this._oMetaData.model,
				type: this.oType,
				parts: [
					{
						path: this._oMetaData.path,
						parameters : {
							useUndefinedForUnresolved : true
						},
						type: this.oType
					},
					{
						path: sTimeZonePath,
						parameters : {
							useUndefinedForUnresolved : true
						}
					}
				],
				useRawValues: true,
				mode: this._oParent.getBindingMode("value")
			};
		} else {
			mAttributes[sValuePropertyMap] = {
				model: this._oMetaData.model,
				path: this._oMetaData.path,
				type: this._oTypes.getType(this._oMetaData.property, mOptions),
				mode: this._oParent.getBindingMode("value")
			};
		}

		oDateTimePicker = new DateTimePicker(this._oParent.getId() + "-input", mAttributes);
		this._enhanceInputControls(oDateTimePicker);

		return {
			control: oDateTimePicker,
			onCreate: "_onCreate",
			params: {
				getValue: "getValue",
				type: {
					type: mAttributes.value.type,
					property: this._oMetaData.property
				}
			}
		};
	};

	/**
	 * Creates a control instance based on OData meta data to edit a model property that is of a numeric <code>Edm type</code>.
	 *
	 * @returns {sap.m.Input} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmNumeric = function(oSettings) {
		var oControlSelector = this._oSelector.checkComboBox(oSettings),
			sMode = oSettings ? oSettings.mode : undefined,
			oInputField;

		if (oControlSelector.combobox) {
			return this._createComboBox({
				valueHelp: {
					annotation: oControlSelector.annotation,
					noDialog: true,
					noTypeAhead: true
				},
				edit: true
			});
		}

		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			name: true,
			valueState: true
		};

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Input.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mAttributes = this.createAttributes(sValuePropertyMap, this._oMetaData.property, mNames, {
			event: "change",
			parameter: "value"
		});

		if (this._oParent.isContextTable() && Localization.getRTL()) {
			mAttributes.textDirection = "LTR";
		}

		oInputField = this._createInput(mAttributes);

		if (sMode === "edit" && this._oParent.isFormContextType()) {
			oInputField.setTextAlign(TextAlign.End);
		}

		return {
			control: oInputField,
			onCreate: "_onCreate",
			params: {
				getValue: "getValue",
				type: {
					type: mAttributes.value.type,
					property: this._oMetaData.property
				}
			}
		};
	};

	/**
	 * Adds the currency text as ariaDescribedBy association to the amount field when currency is not editable
	 * and removes it when the currency is editable
	 * @param {object} oAmountField The amount input field
	 * @param {object} oCurrencyField The currency input field
	 * @param {string} sAction whether to add or remove the ariaDescribedBy association
	 * @private
	 */
	ODataControlFactory.prototype._handleUoMAriaDescribedBy = function(oAmountField, oCurrencyField, sAction) {
		var sCurrencyFieldId = oCurrencyField?.getId(),
			aAmountFieldAriaDescribedBy = oAmountField.getAriaDescribedBy();
		if (sAction === "add") {
			if (!aAmountFieldAriaDescribedBy.includes(sCurrencyFieldId)) {
				oAmountField.addAriaDescribedBy(sCurrencyFieldId);
			}
		} else if (sAction === "remove") {
			if (aAmountFieldAriaDescribedBy.includes(sCurrencyFieldId + "-text")) {
				oAmountField.removeAriaDescribedBy(sCurrencyFieldId + "-text");
			}
		}
	};

	/**
	 * Creates a control instance based on OData meta data to edit a model property that represents a unit of measure.
	 *
	 * @returns {sap.m.Input} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmUOM = function(oSettings) {
		var sMode = oSettings.mode,
			sEntitySet = this._oParent.getEntitySet(),
			sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(SmartField.getMetadata().getName(), {
				propertyName: "value"
			})[0],
			sBindingMode = this._getPropertyBindingMode(sValuePropertyMap),
			oEdmMeasureProperty = this.getEdmProperty(),
			oUoMEdmProperty = this._oMetaData.annotations.uom.property.property,
			bIsCurrency = this._oMetaData.annotations.uom && this._oHelper.oAnnotation.isCurrency(oEdmMeasureProperty, oUoMEdmProperty);

		var oCreateEdmUOMAttributesSettings = {
			currency: bIsCurrency,
			edmProperty: oUoMEdmProperty,
			bindingMode: sBindingMode
		};

		var mUOMAttributes = this._createEdmUOMAttributes(oCreateEdmUOMAttributesSettings),
			bRTL = Localization.getRTL(),
			bRTLInTable = bRTL && this._oParent.isContextTable(),
			sSmartFieldID = this._oParent.getId(),
			oType;

		if (bRTLInTable) {
			mUOMAttributes.textDirection = "LTR";
		}

		var oMeasureField = this._createInput(mUOMAttributes);
		this.oMeasureField = oMeasureField;

		if (sMode === "edit" && this._oParent.isFormContextType()) {
			oMeasureField.setTextAlign(TextAlign.End);
		}

		// if the unit is not to be displayed, just return the input for the amount.
		if (this._oParent.data("suppressUnit") === "true") {
			var mParams = {
				getValue: "getValue"
			};

			// if not currency-code, the type has to be completed.
			if (!bIsCurrency) {
				mParams.type = {
					type: mUOMAttributes.value.type,
					property: this._oMetaData.property
				};
			}

			return {
				control: oMeasureField,
				onCreate: "_onCreate",
				params: mParams
			};
		}

		// if not currency-code, the type has to be completed.
		if (!bIsCurrency) {
			oType = {
				type: mUOMAttributes.value.type,
				property: this._oMetaData.property
			};
		}

		// create the unit control as smart field.
		var mAttributes = {
			textAlign: this._getEdmUOMTextAlignment()
		};

		if (sBindingMode === "TwoWay") {
			mAttributes.change = this.getUOMChangeHandler({
				smartFieldRootControl: this._oParent,
				currency: bIsCurrency,
				unit: true
			});
		}

		var sPath = this._oHelper.getUOMPath(this._oMetaData);

		mAttributes[sValuePropertyMap] = {
			model: this._oMetaData.model,
			path: sPath,
			mode: sBindingMode
		};

		this.mapBindings(mAttributes, ODataControlFactory._getEmbeddedSmartFieldMapSettings(), oSettings);

		if (this._oParent.getConfiguration()) {
			mAttributes.configuration = new Configuration({
				preventInitialDataFetchInValueHelpDialog: this._getPreventInitialDataFetchInVHDialog()
			});
		}

		if (sEntitySet) {
			mAttributes.entitySet = sEntitySet;
		}

		var oCurrencySmartField = new SmartField(sSmartFieldID + "-sfEdit", mAttributes),
			that = this;

		oCurrencySmartField.data("configdata", {
			"configdata": {
				currency: bIsCurrency,
				smartFieldRootControl: this._oParent,
				measureField: this.oMeasureField,
				isInnerControl: true,
				isUOM: !this._oParent.data("configdata"),
				model: this._oMetaData.model,
				navigationPath: this._oMetaData.annotations.uom.navigationPath || null,
				path: sPath,
				entitySetObject: this._oMetaData.annotations.uom.entitySet,
				entityType: this._oMetaData.annotations.uom.entityType,
				property: this._oMetaData.annotations.uom.property,
				annotations: {
					valuelist: this._oMetaData.annotations.valuelistuom,
					valuelistType: this._oMetaData.annotations.uom.annotations.valuelistType,
					text: this._oMetaData.annotations.textuom
				},
				modelObject: this._oMetaData.modelObject || this._oModel,
				onText: function(oInnerControl) {
					that._updateStaticAmountInputFlexItemData(oMeasureField);
					that._updateStaticUOMTextFlexItemData(oCurrencySmartField);
					that._updateInnerControl(oInnerControl, { RTLInTable: bRTLInTable });
					that._handleUoMAriaDescribedBy(oMeasureField, oInnerControl, "add");
				},
				onInput: function(oInnerControl) {
					var bIsFullWidth = oCurrencySmartField && !oCurrencySmartField.getVisible();
					that._updateDynamicAmountInputFlexItemData(oMeasureField, { isfullWidth: bIsFullWidth});
					that._updateStaticUOMInputFlexItemData(oCurrencySmartField);
					that._updateInnerControl(oInnerControl, { RTLInTable: bRTLInTable });
					that._handleUoMAriaDescribedBy(oMeasureField, oCurrencySmartField, "remove");
				}
			}
		});

		oCurrencySmartField.attachVisibleChanged(function(oEvent) {
			var oMeasureField = this.data("configdata")?.configdata?.measureField;
			if (!oEvent.getParameter("visible")) {
				that._handleUoMAriaDescribedBy(oMeasureField, this, "remove");
			}
		});

		oCurrencySmartField.data("errorCheck", "setComplexClientErrorSecondOperandNested");

		if (oCurrencySmartField.getVisible()) {
			oMeasureField.addStyleClass("smartFieldPaddingRight");
		}

		oMeasureField.addStyleClass("sapUiCompSmartFieldValue");

		var oHBox = new HBox({
			justifyContent: FlexJustifyContent.End,
			items: [oMeasureField, oCurrencySmartField],
			fitContainer: true,
			width: this._oParent.getWidth()
		});

		// add style for nested smart field, especially display case (text box).
		oHBox.addStyleClass("sapUiCompUOM");
		oHBox.enhanceAccessibilityState = function(oElement, mAriaProps) {this._oParent.enhanceAccessibilityState(oElement, mAriaProps); }.bind(this);

		if (this._oParent.isContextTable()) {

			if (bRTLInTable) {
				oHBox.addStyleClass("sapUiCompDirectionLTR");
			}

			oHBox.addStyleClass("sapUiCompUOMInTable");

			if (sMode !== "edit") {
				oHBox.addStyleClass("sapUiCompUOMInTableDisplay");
			}
		}

		return {
			control: oHBox,
			onCreate: "_onCreateUOM",
			params: {
				getValue: true,
				valuehelp: true,
				type: oType
			}
		};
	};

	/**
	 * Creates the arguments for construction call for the unit of measure.
	 *
	 * @returns {object} the arguments for construction call for the unit of measure.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmUOMAttributes = function(mSettings) {
		mSettings = mSettings || {};
		var mAttributes = this.createUOMDefaultAttributes(mSettings);
		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Input.getMetadata().getName(), {
			propertyName: "value"
		})[0];
		var sBindingMode = mSettings.bindingMode || "TwoWay";

		var bIsCurrency = mSettings.currency || (this._oMetaData.annotations.uom && this._oHelper.oAnnotation.isCurrency(this.getEdmProperty(), this._oMetaData.annotations.uom.property.property));

			mAttributes[sValuePropertyMap] = {
				mode: BindingMode.OneWay,
				model: this._oMetaData.model,
				parts: [
					{
						mode : sBindingMode,
						path: this._oMetaData.path
					}, {
						mode : sBindingMode,
						path: this._oHelper.getUOMPath(this._oMetaData)
					}, {
						mode : 'OneTime',
						path : bIsCurrency ? '/##@@requestCurrencyCodes' : '/##@@requestUnitsOfMeasure',
						targetType : 'any'
					}
				],
				type: bIsCurrency ? this._oTypes.getCurrencyType(this._oMetaData.property) : this._oTypes.getUoMType(this._oMetaData.property)
			};

		return mAttributes;
	};

	ODataControlFactory.prototype.createUOMDefaultAttributes = function(mSettings) {
		return {
			textAlign: this._getEdmUOMTextAlignment(),
			placeholder: this.getAttribute("placeholder"),
			name: this.getAttribute("name"),
			valueState: this.getValueStateBindingInfoForRecommendationStateAnnotation(),
			change: this.getUOMChangeHandler({
				smartFieldRootControl: this._oParent,
				currency: mSettings.currency
			})
		};
	};

	/**
	 * Creates the <code>textAlignment</code> attribute value for unit of measure use cases.
	 *
	 * @returns {string} <code>textAlignment</code> attribute value for unit of measure use cases.
	 * @private
	 */
	ODataControlFactory.prototype._getEdmUOMTextAlignment = function() {
		var sAlignment = this.getAttribute("textAlign");

		if (!sAlignment) {
			sAlignment = TextAlign.Initial;
		}

		if (sAlignment === TextAlign.Initial) {

			if (this._oParent.isContextTable()) {
				return TextAlign.End;
			}

			return TextAlign.Begin;
		}

		return sAlignment;
	};

	/**
	 * Creates a control instance based on OData meta data to display a model property that represents a unit of measure.
	 *
	 * @returns {sap.m.Input} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmUOMDisplay = function(oSettings) {
		var that = this,
			sEntitySet = this._oParent.getEntitySet(),
			sPath = this._oHelper.getUOMPath(this._oMetaData),
			sAlign = this._getEdmUOMTextAlignment(),
			oSmartFieldText = null,
			oEdmProperty = this.getEdmProperty(),
			bRTL = Localization.getRTL(),
			bRTLInTable = bRTL && this._oParent.isContextTable(),
			bIsCurrency = this._oHelper.oAnnotation.isCurrency(oEdmProperty),
			sSmartFieldValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(SmartField.getMetadata().getName(), {
				propertyName: "value"
			})[0],
			sBindingMode = this._getPropertyBindingMode(sSmartFieldValuePropertyMap) || "TwoWay";

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Text.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mAttributes = {
			textAlign: sAlign
		};

		mAttributes[sValuePropertyMap] = {
			parts: [
				{
					path: this._oMetaData.path,
					type: this._oTypes.getType(this._oMetaData.property)
				}, {
					path: sPath
				}, {
				mode: 'OneTime',
				path: bIsCurrency ? '/##@@requestCurrencyCodes' : '/##@@requestUnitsOfMeasure',
				targetType: 'any'
				}
			],
			model: this._oMetaData.model,
			formatter: this._oTypes.getDisplayFormatter(oEdmProperty, {
				currency: bIsCurrency,
				mask: this._oHelper.oAnnotation.isMasked(oEdmProperty),
				type: this._oTypes.getType(this._oMetaData.property)
			}),
			useRawValues: true
		};

		if (bRTLInTable) {
			mAttributes.textDirection = "LTR";
		}

		var oText = new Text(this._oParent.getId() + "-text", mAttributes);
		sPath = this._oHelper.getUOMPath(this._oMetaData);
		mAttributes = {
			textAlign: this._getEdmUOMTextAlignment()
		};

		if (sBindingMode === "TwoWay") {
			mAttributes.change = this.getUOMChangeHandler({
				smartFieldRootControl: this._oParent,
				currency: bIsCurrency,
				unit: true
			});
		}

		sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(SmartField.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		mAttributes[sValuePropertyMap] = {
			model: this._oMetaData.model,
			path: sPath,
			mode: this._getPropertyBindingMode(sValuePropertyMap)
		};

		this.mapBindings(mAttributes, ODataControlFactory._getEmbeddedSmartFieldMapSettings(), oSettings);
		oText.addStyleClass("sapUiCompSmartFieldValue");
		oText.addStyleClass("smartFieldUoMAmountDisplayText");
		oText.addStyleClass("smartFieldPaddingRight");

		if (this._checkSuppressUnit()) {
			return {
				control: oText
			};
		}

		if (sEntitySet) {
			mAttributes.entitySet = sEntitySet;
		}

		oSmartFieldText = new SmartField(this._oParent.getId() + "-sfDisp", mAttributes);
		oSmartFieldText.data("configdata", {
			"configdata": {
				isInnerControl: true,
				isUOM: !this._oParent.data("configdata"),
				model: this._oMetaData.model,
				navigationPath: this._oMetaData.annotations.uom.navigationPath || null,
				path: sPath,
				entitySetObject: this._oMetaData.annotations.uom.entitySet,
				entityType: this._oMetaData.annotations.uom.entityType,
				property: this._oMetaData.annotations.uom.property,
				annotations: {
					valuelist: this._oMetaData.annotations.valuelistuom,
					text: this._oMetaData.annotations.textuom
				},
				modelObject: this._oMetaData.modelObject || this._oModel,
				onText: function(oInnerControl) {
					// do not wrap for UoM. Incident ID : 1570841150
					if (oInnerControl && oInnerControl.setWrapping) {
						oInnerControl.setWrapping(false);
					}

					that._updateInnerControl(oInnerControl, { RTLInTable: bRTLInTable });
				},
				onInput: function(oInnerControl) {
					that._updateInnerControl(oInnerControl, { RTLInTable: bRTLInTable });
				},
				getContextEditable: function() {
					return that._oParent.getContextEditable();
				}
			}
		});

		oSmartFieldText.data("errorCheck", "setComplexClientErrorSecondOperandNested");
		var oHBox = new HBox({
			alignItems: FlexAlignContent.Center,
			items: [oText, oSmartFieldText],
			fitContainer: true,
			width: this._oParent.getWidth()
		});
		oHBox.enhanceAccessibilityState = function(oElement, mAriaProps) {this._oParent.enhanceAccessibilityState(oElement, mAriaProps); }.bind(this);

		if (this._oParent.isContextTable()) {
			oHBox.setJustifyContent("End");
			this._oParent.addStyleClass("sapUiCompUOMInTable");

			if (bRTLInTable) {
				oHBox.addStyleClass("sapUiCompDirectionLTR");
			}

			oHBox.addStyleClass("sapUiCompUOMInTable");
		}

		return {
			control: oHBox
		};
	};

	/**
	 * Creates a control instance based on OData meta data to display a model property that represents a unit of measure.
	 *
	 * @returns {sap.m.Input} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmUOMObjectStatus = function() {
		var oObjectStatus,
			oEdmProperty = this.getEdmProperty(),
			bIsCurrency = this._oMetaData.annotations.uom && this._oHelper.oAnnotation.isCurrency(oEdmProperty),
			fFormat = this._oTypes.getDisplayFormatter(oEdmProperty, {
				currency: bIsCurrency
			}),
			sPath = this._oHelper.getUOMPath(this._oMetaData),
			mAttributes = {};

		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(ObjectStatus.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		mAttributes[sValuePropertyMap] = {
			parts: [
				{
					path: this._oMetaData.path,
					type: this._oTypes.getType(this._oMetaData.property)
				}, {
					path: sPath
				}, {
					mode : 'OneTime',
					path : bIsCurrency ? '/##@@requestCurrencyCodes' : '/##@@requestUnitsOfMeasure',
					targetType : 'any'
				}
			],
				formatter: function() {
				var sResult = fFormat.apply(this, arguments);
				return sResult + arguments[1];
			},
			useRawValues: true
		};

		this._addProposedObjectStatusAttributes(mAttributes);

		oObjectStatus = new ObjectStatus(this._oParent.getId() + "-objStatus", mAttributes);

		// add style for nested smart field, especially display case (text box).
		oObjectStatus.addStyleClass("sapUiCompUOM");

		return {
			control: oObjectStatus
		};
	};

	/**
	 * Creates a control instance based on OData meta data to display a model property that represents a unit of measure.
	 *
	 * @returns {sap.m.Input} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmUOMObjectNumber = function() {
		var mAttributes,
			oObjectNumber,
			sAlign = this._getEdmUOMTextAlignment();

		var aValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(ObjectNumber.getMetadata().getName(), {
			propertyName: "value"
		});

		// create the attributes for the currency.
		if (this._oMetaData.annotations.uom && this._oHelper.oAnnotation.isCurrency(this.getEdmProperty(), this._oMetaData.annotations.uom.property.property)) {
			mAttributes = {
				model: this._oMetaData.model,
				textAlign: sAlign
			};

			mAttributes[aValuePropertyMap[0]] = {
				parts: [{
					path: this._oMetaData.path
				}, {
					path: this._oHelper.getUOMPath(this._oMetaData)
				},{
					mode : 'OneTime',
					path : '/##@@requestCurrencyCodes',
					targetType : 'any'
				}
				],
				type: this._oTypes.getCurrencyType(this._oMetaData.property)
			};

			mAttributes[aValuePropertyMap[1]] = {
				path: this._oHelper.getUOMPath(this._oMetaData)
			};
		} else {
			mAttributes = {
				model: this._oMetaData.model,
				textAlign: sAlign
			};

			mAttributes[aValuePropertyMap[0]] = {
				path: this._oMetaData.path,
				type: this._oTypes.getType(this._oMetaData.property)
			};

			mAttributes[aValuePropertyMap[1]] = {
				path: this._oHelper.getUOMPath(this._oMetaData)
			};
		}

		oObjectNumber = new ObjectNumber(this._oParent.getId() + "-objNumber", mAttributes);

		// add style for nested smart field, especially display case (text box).
		oObjectNumber.addStyleClass("sapUiCompUOM");

		return {
			control: oObjectNumber
		};
	};

	/**
	 * Creates a control instance based on OData meta data.
	 *
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmSemantic = function() {
		var that = this,
			sPath = this._oParent.getBindingPath("value"),
			oEdmProperty = this.getEdmProperty(),
			oTextAnnotation = this._getLocalTextAnnotation(),
			vTextAnnotation = oTextAnnotation && oTextAnnotation.path || null;

		var mAttributes = {
			semanticObject: this._oMetaData.annotations.semantic.defaultSemanticObject,
			additionalSemanticObjects: this._oMetaData.annotations.semantic.additionalSemanticObjects,
			fieldName: sPath,
			width: this.getAttribute("width"),
			createControlCallback: function() {
				var oControl = this.createControl(true);

				if (oControl) {
					return oControl.control;
				}

				return null;
			}.bind(this)
		};

		this.oType = this._oTypes.getType(this._oMetaData.property);

		if (vTextAnnotation) {

			mAttributes.text = {
				parts: [
					this._oMetaData.path,
					this._oHelper.getEdmDisplayPath(this._oMetaData)
				],
				model: this._oMetaData.model,
				formatter: function(sId, sDescription) {

					if (that.oType) {
						sId = that.oType.formatValue(sId, "string");
					}

					if (that.oType && that.oType.isA("sap.ui.comp.odata.type.NumericText") && sId === null && sDescription) {
						sId = "";
					}

					if (sId && sDescription) {
						return that._formatDisplayBehaviour("defaultInputFieldDisplayBehaviour", sId, sDescription);
					}

					return sId ? sId : "";
				}
			};

			mAttributes.navigationTargetsObtained = function(oEvent) {
				var oBinding = this.getBinding("text");

				if (!Array.isArray(oBinding.getValue())) {
					oEvent.getParameters().show();
					return;
				}

				var aValues = oBinding.getValue();
				var sDisplay = that._getDisplayBehaviourConfiguration("defaultInputFieldDisplayBehaviour") || "idOnly";
				var oTexts = FormatUtil.getTextsFromDisplayBehaviour(sDisplay, aValues[0], aValues[1]);
				var oMainNavigation = oEvent.getParameters().mainNavigation;

				// 'mainNavigation' might be undefined
				if (oMainNavigation) {
					oMainNavigation.setDescription(oTexts.secondText);
				}

				oEvent.getParameters().show(oTexts.firstText, oMainNavigation, undefined, undefined);
			};
		} else {
			var sUoMPath = this._oHelper.getUOMPath(this._oMetaData);

			if (sUoMPath) {

				mAttributes.text = {
					parts: [{
						path: sPath
					}, {
						path: sUoMPath
					}],
					model: this._oMetaData.model,
					formatter: this._oHelper.oAnnotation.isCurrency(oEdmProperty, this._oMetaData.annotations.uom.property.property) ? FormatUtil.getAmountCurrencyFormatter() : FormatUtil.getMeasureUnitFormatter(),
					useRawValues: true
				};

				mAttributes.uom = {
					path: sUoMPath
				};
			} else {
				mAttributes.text = {
					path: sPath,
					model: this._oMetaData.model,
					type: this.oType
				};
			}
		}

		return {
			control: new SmartLink(this._oParent.getId() + "-sl", mAttributes),
			onCreate: "_onCreate",
			params: {
				getValue: "getInnerControlValue"
			}
		};
	};

	/**
	 * Creates a control instance based on OData meta data.
	 *
	 * @param {object} oSettings Object with settings
	 * @param {object} oSettings.attributesNamesMap Object with property names for mapping of the new inner control
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createMultiLineText = function(oSettings) {
		var sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(TextArea.getMetadata().getName(), {
			propertyName: "value"
		})[0];

		var mAttributes = this.createAttributes(sValuePropertyMap, this._oMetaData.property, oSettings.attributesNamesMap);
		var mOptions = this.getFormatSettings("multiLineSettings");
		mAttributes = merge(mAttributes, mOptions);

		if (this._oParent.isContextTable()) {
			mAttributes.width = "100%";
		}

		var oControl = new TextArea(this._oParent.getId() + "-textArea", mAttributes);
		this._enhanceInputControls(oControl);

		// add optional upper case conversion.
		this._handleEventingForEdmString({
			control: oControl,
			edmProperty: this._oMetaData.property.property
		});

		return {
			control: oControl,
			onCreate: "_onCreate",
			params: {
				type: {
					type: mAttributes.value.type,
					property: this._oMetaData.property
				},
				getValue: "getValue"
			}
		};
	};

	/**
	 * Creates a control instance based on OData meta data.
	 *
	 * @param {boolean} bDate if this link is treated as a date
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createLink = function(bDate) {
		var that = this,
			oParent = this._oParent,
			oURLBindingInfo = oParent.getBindingInfo("url");

		var mAttributes = {
			text: "",
			href: ""
		};

		var sURLPropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Link.getMetadata().getName(), {
			propertyName: "url"
		})[0];

		if (oURLBindingInfo) {
			mAttributes[sURLPropertyMap] = this._oBinding.toBinding(oURLBindingInfo);
		} else {
			mAttributes[sURLPropertyMap] = oParent.getUrl();
		}

		if (oParent.hasListeners("linkPress")) {
			mAttributes.press = function(oEvent) {
				// block href default handling
				oEvent.preventDefault();
				oParent.fireLinkPress(oEvent);
			};
		}
		if (oParent.hasListeners("press")) {
			mAttributes.press = function(oEvent) {

				// block href default handling
				oEvent.preventDefault();
				oParent.firePress(oEvent);
			};
		}

		var oValueBindingInfo = oParent.getBindingInfo("value");

		var aValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Link.getMetadata().getName(), {
			propertyName: "value"
		});

		if (oValueBindingInfo) {
			var oMetaData = this._oMetaData,
				sPath = oMetaData.path,
				oProperty = oMetaData.property.property;

			// text may be Edm.String and may have a text annotation
			if (oMetaData.annotations.text && (oProperty.type === "Edm.String")) {

				mAttributes[aValuePropertyMap[0]] = {
					parts: [
						oMetaData.path,
						this._oHelper.getEdmDisplayPath(oMetaData)
					],
					formatter: this._formatText.bind(that)
				};
			} else if (ODataControlFactory.isSpecialLink(oProperty)) {
				var fnFormatter = ODataControlFactory[ODataControlFactory._getLinkFormatterFunctionName(oProperty)];

				mAttributes[aValuePropertyMap[0]] = {
					path: sPath
				};

				mAttributes[aValuePropertyMap[1]] = {
					path: sPath,
					formatter: null
				};

				if (typeof fnFormatter === "function") {
					mAttributes[aValuePropertyMap[1]].formatter = fnFormatter;
				}
			} else if (bDate) {
				// Also a special link but we re-use type here instead of formatter
				mAttributes[aValuePropertyMap[0]] = {
					path: sPath,
					type: this._getDateFormatType()
				};
			} else {
				mAttributes[aValuePropertyMap[0]] = this._oBinding.toBinding(oValueBindingInfo);
			}
		} else {
			mAttributes[aValuePropertyMap[0]] = oParent.getValue();
		}

		return {
			control: new Link(oParent.getId() + "-link", mAttributes),
			onCreate: "_onCreate",
			params: {
				noValidation: true
			}
		};
	};

	/**
	 * Creates a control instance based on OData meta data to edit a model property that is of type <code>Edm.Boolean</code>
	 *
	 * @returns {sap.m.CheckBox} the new control instance.
	 * @private
	 */
	ODataControlFactory.prototype._createEdmBoolean = function(oSettings) {
		var oControlSelector = this._oSelector.checkComboBox(oSettings),
			bEditable = oSettings.mode === "edit",
			that = this,
			mParams = null,
			oControl;

		if (oControlSelector.combobox) {

			if (bEditable || this._oParent.getFetchValueListReadOnly()) {
				return this._createComboBox({
					valueHelp: {
						annotation: oControlSelector.annotation,
						noDialog: true,
						noTypeAhead: true
					},
					edit: bEditable
				});
			}
		}

		var mAttributes,
			sValuePropertyMap;

		if (bEditable) {

			sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(CheckBox.getMetadata().getName(), {
				propertyName: "value"
			})[0];

			mAttributes = this.createAttributes(sValuePropertyMap, this._oMetaData.property, {}, {
				event: "select",
				parameter: "selected"
			});

			oControl = new CheckBox(this._oParent.getId() + "-cBoxBool", mAttributes);
			mParams = {
				getValue: "getSelected"
			};

		} else {

			sValuePropertyMap = ODataControlFactory.getBoundPropertiesMapInfoForControl(Text.getMetadata().getName(), {
				propertyName: "value"
			})[0];

			mAttributes = this.createAttributes(sValuePropertyMap, this._oMetaData.property, {
				width: true,
				textAlign: true
			});

			mAttributes[sValuePropertyMap] = {
				model: this._oMetaData.model,
				path: this._oMetaData.path,
				formatter: function(bValue) {
					return that._formatDisplayBehaviour("defaultCheckBoxDisplayBehaviour", bValue);
				}
			};
			mAttributes.renderWhitespace = true;

			oControl = new Text(this._oParent.getId() + "-text", mAttributes);
		}

		return {
			control: oControl,
			onCreate: "_onCreate",
			params: mParams
		};
	};

	/**
	 * Add type-ahead and value help on request.
	 *
	 * @private
	 */
	ODataControlFactory.prototype._createValueHelp = function() {
		var oControl = this._oParent.getContent();

		if (!oControl) {
			return;
		}

		var oValueHelp = {
			annotation: this._oMetaData.annotations.valuelist,
			noDialog: !this._oParent.getShowValueHelp(),
			noTypeAhead: !this._oParent.getShowSuggestion(),
			aggregation: "suggestionRows"
		};

		this._getValueHelpDialogTitle(oValueHelp);
		oValueHelp.analyser = this._oHelper.getAnalyzer(this._oModel || this._oMetaData.modelObject);

		this.createValueHelp({
			control: oControl,
			edmProperty: this.getEdmProperty(),
			valueHelp: oValueHelp,
			model: this._oModel || this._oMetaData.modelObject,
			onValueListChange: function(oEvent) {
				this._oParent.fireValueListChanged({
					changes: oEvent.mParameters.changes
				});
			}.bind(this)
		});
	};

	/**
	 * Gets the ValueListProvider configuration
	 *
	 * @param {object} oSettings object instance to be updated
	 * @returns {object} Display behavior or <code>null</code>
	 * @override
	 * @private
	 */
	ODataControlFactory.prototype.getValueListProviderConfiguration = function(oSettings) {
		var oResultSettings = ControlFactoryBase.prototype.getValueListProviderConfiguration.apply(this, arguments);
		if (this._oHelper.oAnnotation.isUpperCase(this._oMetaData.property.property)) {
			oResultSettings.displayFormat = "UpperCase";
		}
		return oResultSettings;
	};

	/**
	 * Checks whether the unit in unit of measure has to be suppressed in display.
	 *
	 * @returns {boolean} <code>true</code>, if the unit in unit of measure has to be suppressed in display, <code>false</code> otherwise
	 * @private
	 */
	ODataControlFactory.prototype._checkSuppressUnit = function() {

		if (this._oParent.data("suppressUnit") === "true") {
			return true;
		}

		var oInfo = this._oParent.getBindingInfo("uomVisible");
		return (!oInfo && !this._oParent.getUomVisible());
	};

	/*
	 * Gets the metadata property.
	 *
	 * @returns {object} The metadata property
	 * @protected
	 * @since 1.48
	 */
	ODataControlFactory.prototype.getEdmProperty = function() {
		var oHelper = this._oHelper;

		if (oHelper) {
			return oHelper.getEdmProperty(this._oMetaData);
		}

		return null;
	};

	ODataControlFactory.prototype.getEntityType = function() {

		if (this._oMetaData) {
			return this._oMetaData.entityType;
		}

		return null;
	};

	/**
	 * Checks whether a link needs to be created.
	 *
	 * @returns {boolean} <code>true</code>, if a link needs to be created, <code>false</code> otherwise.
	 * @private
	 */
	ODataControlFactory.prototype._checkLink = function() {
		var oInfo = this._oParent.getBindingInfo("url"),
			oProperty = this.getEdmProperty();

		if (oInfo || this._oParent.getUrl() || ODataControlFactory.isSpecialLink(oProperty)) {
			return true;
		}

		return this._oParent.hasListeners("press") || this._oParent.hasListeners("linkPress");
	};

	ODataControlFactory._getEmbeddedSmartFieldMapSettings = function() {
		return {
			"uomEditable": "editable",
			"uomEnabled": "enabled",
			"uomVisible": "visible",
			"mandatory": "mandatory",
			"contextEditable": "contextEditable"
		};
	};

	/**
	 * Gets mapping information for the specified control name and settings.
	 *
	 * @param {string} sControlName The name of a control (including its namespace), for example: <code>sap.m.Input</code>
	 * @param {object} [mSettings] Additional settings
	 * @param {string} [mSettings.propertyName] A property name of the specified control name, for example:
	 * <code>value</code> for <code>sap.m.Input</code>
	 * @returns {Array<string>|Object<any, Array<string>>|null} The mapping information for the specified
	 * <code>sControlName</code> and <code>mSettings</code>
	 *
	 * @since 1.60
	 * @protected
	 */
	ODataControlFactory.getBoundPropertiesMapInfoForControl = function(sControlName, mSettings) {
		mSettings = mSettings || {};
		var mPropertiesMap = null;

		switch (sControlName) {

			case "sap.m.Input":
			case "sap.m.TimePicker":
			case "sap.m.DatePicker":
			case "sap.m.DateTimePicker":
			case "sap.m.TextArea":
				mPropertiesMap = {
					value: ["value"]
				};

				break;

			case "sap.m.Text":
			case "sap.m.ObjectIdentifier":
			case "sap.ui.comp.navpopover.SmartLink":
				mPropertiesMap = {
					value: ["text"]
				};

				break;

			case "sap.m.Link":
				mPropertiesMap = {
					url: ["href"],
					value: ["text", "href"]
				};

				break;

			case "sap.m.ObjectStatus":
				mPropertiesMap = {
					value: ["text", "state", "icon"]
				};

				break;

			case "sap.m.ObjectNumber":
				mPropertiesMap = {
					value: ["number", "unit"]
				};

				break;
			case "sap.m.Select":
			case "sap.m.ComboBox":
			case "sap.ui.comp.smartfield.DisplayComboBox":
				mPropertiesMap = {
					value: ["selectedKey"]
				};

				break;
			case "sap.ui.comp.smartfield.ComboBox":
				mPropertiesMap = {
					value: ["enteredValue"],
					realValue: ["realValue"]
				};

				break;
			case "sap.m.CheckBox":
				mPropertiesMap = {
					value: ["selected"]
				};

				break;

			case "sap.ui.comp.smartfield.SmartField":
				var aSmartFieldPropertiesNames = Object.keys(SmartField.getMetadata().getProperties());
				mPropertiesMap = {};

				aSmartFieldPropertiesNames.forEach(function(sPropertyName, iIndex, aProperties) {
					mPropertiesMap[sPropertyName] = [aProperties[iIndex]];
				});

				break;

			// no default
		}

		if (mPropertiesMap && mSettings.propertyName) {
			return mPropertiesMap[mSettings.propertyName] || null;
		}

		return mPropertiesMap;
	};

	ODataControlFactory.isSpecialLink = function(oProperty) {
		return MetadataAnalyser.isEmailAddress(oProperty) || MetadataAnalyser.isPhoneNumber(oProperty) || MetadataAnalyser.isURL(oProperty);
	};

	ODataControlFactory._getLinkFormatterFunctionName = function(oProperty) {
		return "_format" + MetadataAnalyser.getLinkDisplayFormat(oProperty);
	};

	ODataControlFactory._formatEmailAddress = function(sEmail) {
		return "mailto:" + sEmail;
	};

	ODataControlFactory._formatPhoneNumber = function(sPhone) {
		return "tel:" + sPhone;
	};

	ODataControlFactory._formatURL = function(sURL) {
		return URLListValidator.validate(sURL) ? sURL : "";
	};

	ODataControlFactory.prototype._formatText = function(sId, sDescription) {

		if (sId && sDescription) {
			var sText = this._formatDisplayBehaviour(
				"defaultInputFieldDisplayBehaviour",
				sId,
				sDescription
			  );

			return whitespaceReplacer(sText);
		}

		return sId || "";
	};

	/**
	 * Returns the name of a method to create a control.
	 *
	 * @param {object} oSettings
	 * @returns {string} the name of the factory method to create the control.
	 * @private
	 */
	ODataControlFactory.prototype._getCreator = function(oSettings) {

		// make sure that no exceptions occur, if the property is not valid
		// => necessary for extensibility use cases, if an extension field has been deleted and the UI has not yet been adapted.
		return this._oSelector.getCreator(oSettings);
	};

	/**
	 * Event handler, that is invoked after successful creation of a nested control.
	 *
	 * @param {sap.ui.core.Control} oControl the new control
	 * @param {object} mParams parameters to further define the behavior of the event handler
	 * @param {function} mParams.getValue optional call-back to get the current value from the current control
	 * @param {boolean} mParams.valuehelp if set to <code>true</code> a possibly existing value help is attached to the new control
	 * @param {boolean} [mParams.noValidation]
	 * @param {object} [mParams.type]
	 * @private
	 */
	ODataControlFactory.prototype._onCreate = function(oControl, mParams) {
		var bEmptyStringSignificant,
			sGetValue,
			fControl,
			bValidations = true,
			that = this;

		if (mParams) {

			// check for validation.
			if (mParams.noValidation) {
				bValidations = false;
			}

			// add optional value help.
			if (mParams.valuehelp) {
				this._getValueHelpDialogTitle(mParams.valuehelp);
				mParams.valuehelp.analyser = this._oHelper.getAnalyzer(this._oModel || this._oMetaData.modelObject);

				this.createValueHelp({
					control: oControl,
					edmProperty: this.getEdmProperty(),
					valueHelp: mParams.valuehelp,
					model: this._oModel || this._oMetaData.modelObject,
					onValueListChange: function(oEvent) {
						that._oParent.fireValueListChanged({
							changes: oEvent.mParameters.changes
						});
					}
				});
			}

			// add optional getValue call-back.
			if (mParams.getValue) {
				sGetValue = mParams.getValue;
				mParams.getValue = function() {
					return oControl[sGetValue]();
				};
			}

			// complete the data: add field-control.
			if (mParams.type) {
				bEmptyStringSignificant = mParams.type.emptyStringSignificant || false;
				fControl = this._oFieldControl.getMandatoryCheck(mParams.type.property, bEmptyStringSignificant);

				if (fControl) {
					mParams.type.type.oFieldControl = fControl;
				}
			}
		}

		// add optional validations.
		if (bValidations) {

			// if the field is a unit in unit of measure, the error check configuration is set.
			// otherwise apply the default.
			this.addValidations(oControl, this._oParent.data("errorCheck") || "setSimpleClientError");
		}

		if (!this._checkUOM()) {
			oControl.addStyleClass("sapUiCompSmartFieldValue");
		}
	};

	/**
	 * Checks whether the control was created as unit in unit of measure.
	 *
	 * @returns {boolean} <code>true</code>, if the control was created as unit in unit of measure, <code>false</code> otherwise.
	 * @private
	 */
	ODataControlFactory.prototype._checkUOM = function() {
		var oConfig = this._oParent.data("configdata");

		if (oConfig && oConfig.configdata) {
			if (oConfig.configdata.onInput || oConfig.configdata.onText) {
				return true;
			}
		}

		return false;
	};

	ODataControlFactory.prototype.getValueStateBindingInfoForRecommendationStateAnnotation = function(oEdmProperty, oEdmRecommendationProperty, oModel) {
		oEdmProperty = oEdmProperty || this.getEdmProperty();
		var vRecommendationStateAnnotation = oEdmProperty && oEdmProperty["com.sap.vocabularies.UI.v1.RecommendationState"];

		if (!vRecommendationStateAnnotation) {
			return null;
		}

		// If the Path attribute of the RecommendationState annotation is NOT specified in the (service metadata document/annotation file).
		assert(!(vRecommendationStateAnnotation.Path === undefined), 'Missing "Path" attribute of the "com.sap.vocabularies.UI.v1.RecommendationState" annotation for "' +
		oEdmProperty.name + '" EDM property of "' + this._oMetaData.entityType.name + '" entity type. - ' + this.getMetadata().getName());

		// If the path name of the RecommendationState annotation is NOT specified in the (service metadata document/annotation file).
		assert(!(vRecommendationStateAnnotation.Path === ""), 'Missing path name of "com.sap.vocabularies.UI.v1.RecommendationState" annotation for "' +
		oEdmProperty.name + '" EDM property of "' + this._oMetaData.entityType.name + '" entity type. - ' + this.getMetadata().getName());

		oEdmRecommendationProperty = oEdmRecommendationProperty || this._oHelper.findProperty(this._oMetaData.entityType.property, vRecommendationStateAnnotation.Path);

		// If the oEdmRecommendationProperty is NOT specified in the (service metadata document/annotation file).
		assert(!!oEdmRecommendationProperty, 'The EDM property was not found in the "' + this._oMetaData.entityType.name + '" entity type. - ' +
		this.getMetadata().getName());

		if (oEdmRecommendationProperty && (oEdmRecommendationProperty.type === "Edm.Byte")) {
			return {
				model: oModel || this._oMetaData.model,
				path: vRecommendationStateAnnotation.Path,
				formatter: ODataControlFactory.formatRecommendationState
			};
		}

		assert(oEdmRecommendationProperty && (oEdmRecommendationProperty.type === "Edm.Byte"), 'The EDM property "' + oEdmRecommendationProperty.name +
		'" of "' + this._oMetaData.entityType.name + '" entity type must be typed as Edm.Byte. - ' + this.getMetadata().getName());
		return null;
	};

	ODataControlFactory.formatRecommendationState = function(vValue) {
		vValue = String(vValue);

		switch (vValue) {
			case "0":
				return ValueState.None;

			case "1":
				return ValueState.Information;

			case "2":
				return ValueState.Warning;

			default:
				return ValueState.None;
		}
	};

	ODataControlFactory.prototype._updateDynamicAmountInputFlexItemData = function(oMeasureField, mSettings) {
		var oLayoutData = oMeasureField.getLayoutData() || new FlexItemData(),
			CSS_CLASS = "sapUiCompSmartFieldFlexItemAmountEdit",
			sMaxWidth = "";

		if (oLayoutData) {
			if (mSettings.isfullWidth) {
				CSS_CLASS = "sapUiCompSmartFieldFlexItemAmountNoUnitEdit";
				sMaxWidth = "100%";
			}

			oLayoutData.setGrowFactor(1);
			oLayoutData.setMaxWidth(sMaxWidth);
			oLayoutData.setStyleClass(CSS_CLASS);
			oLayoutData.setMinWidth("0"); // BCP: 2280052534
		}

		oMeasureField.setLayoutData(oLayoutData);
	};

	ODataControlFactory.prototype._updateStaticAmountInputFlexItemData = function(oMeasureField) {
		var oLayoutData = oMeasureField.getLayoutData() || new FlexItemData();

		if (oLayoutData) {
			oLayoutData.setGrowFactor(1);
			oLayoutData.setMaxWidth("");
			oLayoutData.setStyleClass("");
		}

		oMeasureField.setLayoutData(oLayoutData);
	};

	ODataControlFactory.prototype._updateStaticUOMInputFlexItemData = function(oCurrencySmartField) {
		var oLayoutData = oCurrencySmartField.getLayoutData() || new FlexItemData();

		if (oLayoutData) {
			oLayoutData.setShrinkFactor(1);
			oLayoutData.setGrowFactor(0);
			oLayoutData.setStyleClass("sapUiCompSmartFieldFlexItemUnitEdit");
			oLayoutData.setMinWidth("");
		}

		oCurrencySmartField.setLayoutData(oLayoutData);
	};

	ODataControlFactory.prototype._updateStaticUOMTextFlexItemData = function(oCurrencySmartField) {
		var oLayoutData = oCurrencySmartField.getLayoutData() || new FlexItemData();

		if (oLayoutData) {
			oLayoutData.setShrinkFactor(0);
			oLayoutData.setGrowFactor(0);
			oLayoutData.setStyleClass("sapUiCompSmartFieldUOMDisplayText");
			oLayoutData.setMinWidth("auto");
		}

		oCurrencySmartField.setLayoutData(oLayoutData);
	};

	ODataControlFactory.prototype._updateInnerControl = function(oInnerControl, oSettings) {
		var bRTLInTable = oSettings.RTLInTable, oParent, aInnerControls;

		if (oInnerControl) {
			oParent = typeof oInnerControl.getParent === "function" ? oInnerControl.getParent() : {};
			aInnerControls = oParent && oParent.getInnerControls ? oParent.getInnerControls() : [];
			if (bRTLInTable && (typeof oInnerControl.setTextDirection === "function")) {
				oInnerControl.setTextDirection("LTR");
			}
			oInnerControl.addStyleClass("sapUiCompSmartFieldUnit");
			if (aInnerControls.length > 0 && aInnerControls[0].getEditable && aInnerControls[0].getEditable() === true) {
				oInnerControl.addStyleClass("sapUiCompSmartFieldFlexItemUnitEdit");
			}
		}
	};

	/**
	 * Calculates the title for the value help dialog.
	 *
	 * @param {object} oValueHelp the value help configuration
	 * @param {object} oValueHelp.annotation the value help annotation
	 * @param {string} oValueHelp.aggregation the aggregation to attach the value list to
	 * @param {boolean} oValueHelp.noDialog if set to <code>true</code> the creation of a value help dialog is omitted
	 * @param {boolean} oValueHelp.noTypeAhead if set to <code>true</code> the type ahead functionality is omitted
	 * @param {string} oValueHelp.dialogtitle title for the value help dialog
	 * @private
	 */
	ODataControlFactory.prototype._getValueHelpDialogTitle = function(oValueHelp) {
		var oEdmProperty = this.getEdmProperty();

		oValueHelp.dialogtitle = this._oParent?.getValueHelpTitleSource() === ValueHelpTitleSource.ValueList ? this._oHelper.oAnnotation.getValueListLabel(oEdmProperty) : this._oParent.getComputedTextLabel();

		if (!oValueHelp.dialogtitle) {
			oValueHelp.dialogtitle = this._oHelper.oAnnotation.getLabel(oEdmProperty) || oEdmProperty.name;
		}
	};

	/**
	 * Event handler, that is invoked after successful creation of a nested control.
	 *
	 * @param {sap.ui.core.Control} oControl the new control
	 * @param {object} mParams parameters to further define the behavior of the event handler
	 * @param {function} mParams.getValue optional call-back to get the current value from the current control
	 * @param {boolean} mParams.valuehelp if set to <code>true</code> a possibly existing value help is attached to the new control
	 * @param {object} [mParams.type]
	 * @private
	 */
	ODataControlFactory.prototype._onCreateUOM = function(oControl, mParams) {
		var aItems = oControl.getItems(),
			fControl;

		// add validation to amount only.
		this.addValidations(aItems[0], "setComplexClientErrorFirstOperand");

		// add optional value call-back.
		if (mParams && mParams.getValue) {
			mParams.getValue = function() {
				return aItems[0].getValue();
			};
		}

		// add optional unit of measure call-back.
		mParams.uom = function() {
			return aItems[1].getValue();
		};

		mParams.uomset = function(sValue) {
			aItems[1].setValue(sValue);
		};

		// complete the data: add field-control.
		// mind that this is done explicitly only for non currency use-cases.
		if (mParams.type) {
			fControl = this._oFieldControl.getMandatoryCheck(mParams.type.property);

			if (fControl) {
				mParams.type.type.oFieldControl = fControl;
			}
		}
	};

	ODataControlFactory.prototype.triggerCreationOfControls = function() {
		try {
			this._setUOMEditState();
			this._oFieldControl.bindProperties({ metadata: this._oMetaData });
			this._addLabelAndQuickInfo();
			if (this._oParent.isContextTable() && this._oMetaData._isNumber == undefined) {
				this._oMetaData._isNumber = MetadataAnalyser.isNumber(this._oMetaData.property.property);
			}
		} catch (oError) {
			Log.error(oError, null, this.getMetadata().getName());
		}
	};

	/**
	 * Method does a smoke check if we are in a display mode with value list and text arrangement and all the other
	 * pre-requisites are met
	 * @returns {boolean} If we should try to show the description
	 * @private
	 */
	ODataControlFactory.prototype._checkTextInDisplayModeValueList = function (oSettings) {
		var sValueListPath = this._oHelper.getValueListAnnotationPath(this._oMetaData),
			oEdmProperty = this.getEdmProperty(),
			bCalendar,
			bFiscal;

		if (!oEdmProperty) {
			return false;
		}

		bFiscal = FiscalMetadata.isFiscalValue(oEdmProperty);
		bCalendar = CalendarMetadata.isCalendarValue(oEdmProperty);

		// Smoke check if we are in a value list scenario
		return !!(
			(!bFiscal && !bCalendar) && // These are not calendar or fiscal dates
			this._oMetaData.annotations && this._oMetaData.annotations.valuelist !== undefined && // We are in a value list scenario
			this._getDisplayBehaviourConfiguration() &&
			(this._oMetaData.property && (this._oMetaData.property.property.type === "Edm.String" || this._oMetaData.property.property.type === "Edm.Guid")) &&
			oSettings.mode === "display" &&
			this._oParent.getFetchValueListReadOnly() && // Fetch property is not turned off
			sValueListPath && // We have a value list annotation path
			!(this._oParent.getExpandNavigationProperties && this._oParent.getExpandNavigationProperties() && this._oParent.isPropertyInitial("expandNavigationProperties")) && // There is no navigation property
			!this._oHelper.startWithNavigationProperty(sValueListPath,this._oMetaData) && // There is no navigation property
			!this.isValueInitialWithTextArrangement(oEdmProperty) && // There should be no text annotation assigned to the main property on initial rendering
			this._getDisplayBehaviourConfiguration() !== "idOnly"
		);
	};

	ODataControlFactory.prototype.isValueInitialWithTextArrangement = function (oEdmProperty) {
		var oTextAnnotation = this._getLocalTextAnnotation();

		return this._oParent._isValueInitial() && oTextAnnotation;
	};

	/**
	 * Method checks for existing binding of FieldControl
	 * @returns {boolean} Has bound FieldControl
	 * @private
	 */
	ODataControlFactory.prototype._hasBoundFieldControl = function() {
		var aFieldControlProperties = this._oFieldControl.getPropertyNames();
		for (var i = 0; i < aFieldControlProperties.length; i++){
			if (this._oParent.getBinding(aFieldControlProperties[i])) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Binds the properties of the control to formatter functions.
	 *
	 */
	ODataControlFactory.prototype.bind = function(oSettings) {
		var sMode = oSettings.mode,
			oSettings = oSettings || {};

		this._bTextInDisplayModeValueList = this._checkTextInDisplayModeValueList(oSettings);

		// Check if we are in the following scenario
		if (!(!this._bInitialized && !this.bPending) && (!oSettings.rebind && !this._bTextInDisplayModeValueList)) {
			return Promise.resolve({skipInit: this._bInitializeFromConfig});
		}

		this._bInitialized = true;
		var oConfig = this._oParent.data("configdata");

		if (oConfig && oConfig.configdata) {
			try {
				this._init(this._oMeta);
				if (this._oMetaData && this._oMetaData.annotations && typeof oConfig.configdataVL === "function") {
					this._bInitializeFromConfig = true;
					return oConfig.configdataVL().then(function(oVLData){
						this._initValueList(oVLData);

						return Promise.resolve({fetchIDAndDescription: true});
					}.bind(this)).catch(function(oError){
						// We have to resolve even if the Back-end service responds with Error, because we need to create the base controls any way.
						return Promise.resolve();
					});
				}
			} catch (oError) {
				if (oError) {
					Log.error(oError, null, this.getMetadata().getName() + ".onMetaModelLoaded");
				}
			}

			return Promise.resolve();
		}

		if (!this._oModel) {
			return Promise.reject();
		}

		var bTextInEditModeSourceNotNone = !!(this._oParent && this._oParent.isTextInEditModeSourceNotNone());

		// trigger creation of inner controls synchronous when possible
		if (
			!bTextInEditModeSourceNotNone && // We are not in textInEditModeSource scenario
			this._oModel.bMetaModelLoaded && // FIXME: bMetaModelLoaded is a private instance member of the ODataModel class
			(
				// BCP: 2070248001 Fast check -> we are not in display mode. There are applications that rely on creation
				// of controls to be synchronous but it is never the less asynchronous because of the promise and sometimes
				// racing conditions can occur when setting property directly on the control without waiting for it to
				// fully initialize. We prefer not to break these applications.
				sMode !== "display" ||
				!this._oParent.getFetchValueListReadOnly() // property is set to false
			)
		) {
			try {
				this._init(this._oMeta);
			} catch (oError) {
				if (oError) {
					Log.error(oError, null, this.getMetadata().getName() + ".onMetaModelLoaded");
				}
			}
			return Promise.resolve();
		}

		// trigger creation of inner controls asynchronous after the meta model and
		// the value list annotation are loaded
		this.bPending = true;

		return this._metadataInitialise()
			.then(function onMetaModelLoaded() {
				// If the SmartField control is destroyed before this async callback is invoked,
				// then return a rejected promise object to prevent stop unnecessary work and
				// further invocation of .then() handlers.
				if (!this._oParent) {
					this.bPending = false;
					return Promise.reject();
				}

				// We need to init the metadata
				this._init(this._oMeta);

				// SNOW: DINC0181926 Re-calculate internal flag in display mode
				this._bTextInDisplayModeValueList = this._checkTextInDisplayModeValueList(oSettings);

				if ((sMode !== "display" && // In display mode we ignore the textInEditModeSource
					bTextInEditModeSourceNotNone ) ||
					this._bTextInDisplayModeValueList
				) {
					var vValueListAnnotationPath = this._oMetaData.annotations.valuelist;

					if (typeof vValueListAnnotationPath === "string") {

						// Suspend the execution of the next .then() handler functions until
						// the value list annotation is loaded. Notice that in most of the cases
						// the .loadValueListAnnotation() method returns another pending promise object.
						var sBindingContextPath = this._oParent && this._oParent.getBindingContext() && this._oParent.getBindingContext().getPath();
						if (this._oMetaData.functionImportProperty) {
							return this._oHelper.getAnalyzer()._getFunctionImportValueListAnnotationLazy(this._oMetaData.functionImport, this._oMetaData.functionImportProperty, vValueListAnnotationPath, sBindingContextPath);
						} else {
							return this._oHelper.loadValueListAnnotation(vValueListAnnotationPath, sBindingContextPath);
						}
					} else {
						this.bPending = false;
						return Promise.reject();
					}
				}

				this.bPending = false;
			}.bind(this))
			.then(function onValueListAnnotationLoaded(oValueListAnnotations) {
				var oResult = {fetchIDAndDescription: false};

				// If we are not in TextArrangement scenario we don't proceed
				// If the SmartField control is destroyed before this async callback is invoked,
				// then stops unnecessary processing/initialization.
				if (!bTextInEditModeSourceNotNone && !this._bTextInDisplayModeValueList || !this._oParent) {
					return;
				}

				this.bPending = false;

				if (oValueListAnnotations) {
					this._initValueList(oValueListAnnotations);
				}

				if (oValueListAnnotations && this.oTextArrangementDelegate) {
					oResult.fetchIDAndDescription = true;
				}

				return oResult;
			}.bind(this))
			.catch(function(oError) {

				// only log an error in the console if the promise is not intentionally rejected
				// by calling Promise.reject()
				if (oError) {
					Log.error(oError, null, this.getMetadata().getName() + ".onMetaModelLoaded");
					this._oParent._rejectLifecyclePromises("Metadata loading problem.");
				}
			}.bind(this));
	};

	ODataControlFactory.prototype._metadataInitialise = function() {
		// return this._oModel.getMetaModel().loaded();
		return Promise.resolve().then(function() {
			// this _bMetaModelLoadAttached flag is set internally in ODataModelUtil.handleModelInit
			if (this._oParent._bMetaModelLoadAttached) {
				return this._oModel.getMetaModel().loaded();
			} else {
				return ODataModelUtilSync.handleModelInit(
					this._oParent,
					function(){},
					true
				);
			}
		}.bind(this)).catch(function(oError) {
			Log.error("The meta model could not be loaded.", oError, this.getMetadata().getName());
		}.bind(this));
	};

	/**
	 * Insert the label and quick-info from meta data
	 */
	ODataControlFactory.prototype._addLabelAndQuickInfo = function() {
		var oProperty = this.getDataProperty();

		oProperty = oProperty.property;//data property contains typePath and property

		var sLabel = this._oHelper.oAnnotation.getLabel(oProperty);
		var sQuickInfo = this._oHelper.oAnnotation.getQuickInfo(oProperty);


		if (sLabel) {
			this._oParent._sAnnotationLabel = sLabel;
		}

		if (sQuickInfo && this._oParent.isPropertyInitial("tooltipLabel")) {
			this._oParent.setTooltipLabel(sQuickInfo);
		}
	};

	/**
	 * Rebinds properties on this smart field, if the entity instance the smart field is associated with changes its state from existing in main
	 * memory to persistent on data base.
	 *
	 * @private
	 */
	ODataControlFactory.prototype.rebindOnCreated = function() {
		var mBind,

			// make sure that no exceptions occur, if the property is not valid
			// => necessary for extensibility use cases, if an extension field has been deleted and the UI has not yet been adapted.
			// and if the smart field's value property is not bound, but a URL has to be displayed.
			mFormatters = this._oFieldControl.getControlFormatters(this._oMetaData, [
				"editable"
			]);

		for (var n in mFormatters) {
			mBind = this._oBinding.fromFormatter(this._oMetaData.model, mFormatters[n]);
			this._oParent.bindProperty(n, mBind);
		}
	};

	/**
	 * Optionally sets a formatter for the uomEditState property.
	 *
	 * @private
	 */
	ODataControlFactory.prototype._setUOMEditState = function() {

		if (this._oFieldControl.hasUomEditState(this._oMetaData)) {
			var oFormatter = this._oFieldControl.getUOMEditState(this._oMetaData);

			if (oFormatter) {
				var mBind = this._oBinding.fromFormatter(this._oMetaData.model, oFormatter);
				this._oParent.bindProperty("uomEditState", mBind);
			}
		}
	};

	/**
	 * Returns the property of the oData
	 *
	 * @returns {object} the oData property
	 * @public
	 */
	ODataControlFactory.prototype.getDataProperty = function() {
		return this._oMetaData.property;
	};

	ODataControlFactory.prototype.getDropdownItemKeyType = function(oControl) {
		var sControlMetadataName = oControl.getMetadata().getName(),
			bIsMComboBoxRequired = this._isMComboBoxRequired(),
			sComputedTEMS = this._oParent._getComputedTextInEditModeSource(),
			sCompComboBoxProperty = sComputedTEMS === "ValueList" ? "realValue" : "value",
			sPropertyName = bIsMComboBoxRequired ? "value" : sCompComboBoxProperty;

		if ((sControlMetadataName === "sap.ui.comp.smartfield.DisplayComboBox") ||
			(sControlMetadataName === "sap.m.ComboBox") ||
			(sControlMetadataName === "sap.ui.comp.smartfield.ComboBox") ||
			(sControlMetadataName === "sap.m.Select")) {

			var sBoundPropertyNameOfInnerControl = ODataControlFactory.getBoundPropertiesMapInfoForControl(sControlMetadataName, {
				propertyName: sPropertyName
			})[0];
			var oBindingInfo = oControl.getBindingInfo(sBoundPropertyNameOfInnerControl);

			return (oBindingInfo && oBindingInfo.type) || null;
		}

		return null;
	};

	/**
	 * Returns the currently available meta data.
	 *
	 * @returns {object} the currently available meta data
	 * @public
	 */
	ODataControlFactory.prototype.getMetaData = function() {
		return this._oMetaData;
	};

	/**
	 * Gets the OData helper instance.
	 *
	 * @returns {object} The OData helper instance
	 * @protected
	 */
	ODataControlFactory.prototype.getODataHelper = function() {
		return this._oHelper;
	};

	/**
	 * Gets the event object that is passed to {@link sap.ui.comp.smartfield.SmartField#event:change} event handlers.
	 * @param {sap.ui.base.Event} oControlEvent
	 * @returns {object} The object in the following form:
	 * <pre>
	 * {
	 *   value: "string",
	 *	 newValue:	 "string",
	 *	 validated:	 "boolean",
	 * }
	 * </pre>
	 * @private
	 */
	ODataControlFactory.prototype._getChangeEventParams = function(oControlEvent){
		var sValue,
			oNewControlEvent = {},
			mParameters = oControlEvent && oControlEvent.getParameters();

			if (mParameters) {
				sValue = mParameters.value;
				oNewControlEvent.value = sValue;
				oNewControlEvent.newValue = sValue;

				if (mParameters.validated) {
					oNewControlEvent.validated = mParameters.validated;
				}
			} else {
				oNewControlEvent = oControlEvent;
			}

			return oNewControlEvent;
	};

	ODataControlFactory.prototype._getPropertyBindingMode = function(sPropertyName){
		var oBinding = typeof this._oParent.getBinding === "function" && this._oParent.getBinding(sPropertyName);

		return oBinding && typeof oBinding.getBindingMode === "function" && oBinding.getBindingMode() || "TwoWay";
	};

	ODataControlFactory.prototype._getLocalTextAnnotation = function(){
		var oMetaData = this.getMetaData(),
			oTextAnnotation = oMetaData && oMetaData.annotations && oMetaData.annotations.text || null;

		return oTextAnnotation;
	};

	ODataControlFactory.prototype.fetchIDAndDescriptionCollectionIfRequired = function(oSettings){
		var bIsComboBox = oSettings.mode === "edit" &&
							this._isFixedList();

		if (this.oValueListDelegate && bIsComboBox) {
			this.oValueListDelegate.fetchIDAndDescriptionCollectionIfRequired();
		} else if (this.oTextArrangementDelegate){
			this.oTextArrangementDelegate.fetchIDAndDescriptionCollectionIfRequired(oSettings);
		}
	};

	ODataControlFactory.prototype._isFixedList = function(){
		var oMetaData = this.getMetaData();

		return oMetaData && oMetaData.annotations && oMetaData.annotations.valuelistType === "fixed-values";
	};
	ODataControlFactory.prototype._isMComboBoxRequired  = function(){
		return this._oSelector && this._oSelector._oParent &&
			this._oSelector._oParent.oParent && this._oSelector._oParent.oParent.isA("sap.ui.comp.smartmultiedit.Field") ||
			(this._oParent && this._oParent.getFixedValueListValidationEnabled && this._oParent.getFixedValueListValidationEnabled());
	};



	ODataControlFactory.prototype.destroy = function() {

		if (this._oFieldControl) {
			this._oFieldControl.destroy();
		}

		if (this._oSelector) {
			this._oSelector.destroy();
		}

		if (this._oTypes) {
			this._oTypes.destroy();
		}

		if (this._oHelper) {
			this._oHelper.destroy();
		}

		if (this.oType) {
			this.oType.destroy();
			this.oType = null;
		}

		if (this.oValueListDelegate) {
			this.oValueListDelegate.destroy();
		}

		if (this.oTextArrangementDelegate) {
			this.oTextArrangementDelegate.destroy();
		}

		this._oHelper = null;
		this._oFieldControl = null;
		this._oTypes = null;
		this._oSelector = null;
		this._oMetaData = null;
		this.oMeasureField = null;
		this.oTextArrangementDelegate = null;
		ControlFactoryBase.prototype.destroy.apply(this, arguments);
	};

	return ODataControlFactory;
}, true);
