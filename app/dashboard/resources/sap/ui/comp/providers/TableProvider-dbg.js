/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// -----------------------------------------------------------------------------
// Generates the view metadata required for SmartTable using SAP-Annotations metadata
// -----------------------------------------------------------------------------
sap.ui.define([
	'sap/ui/comp/odata/MetadataAnalyser', './ControlProvider', 'sap/ui/comp/util/FormatUtil', 'sap/ui/Device', 'sap/ui/comp/odata/FiscalMetadata', 'sap/ui/comp/odata/CalendarMetadata'
], function(MetadataAnalyser, ControlProvider, FormatUtil, Device, FiscalMetadata, CalendarMetadata) {
	"use strict";

	/**
	 * Constructs a class to generate the view/data model metadata for the SmartTable from the SAP-Annotations metadata
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @private
	 * @param {object} mPropertyBag - PropertyBag having members model, entitySet
	 * @author SAP SE
	 */
	var TableProvider = function(mPropertyBag) {
		if (mPropertyBag) {
			this._oParentODataModel = mPropertyBag.model;
			this.sEntitySet = mPropertyBag.entitySet;
			this._sIgnoredFields = mPropertyBag.ignoredFields;
			this._sInitiallyVisibleFields = mPropertyBag.initiallyVisibleFields;
			this.isEditableTable = mPropertyBag.isEditableTable;
			this._smartTableId = mPropertyBag.smartTableId;
			this._isAnalyticalTable = mPropertyBag.isAnalyticalTable;
			this._isMobileTable = mPropertyBag.isMobileTable;
			this.useSmartField = mPropertyBag.useSmartField;
			this.useSmartToggle = mPropertyBag.useSmartToggle;
			this.defaultFilterBarExpanded = mPropertyBag.defaultFilterBarExpanded;
			this.defaultShowAllFilters = mPropertyBag.defaultShowAllFilters;
			this.useUTCDateTime = mPropertyBag.useUTCDateTime === "true";
			this._bSkipAnnotationParse = mPropertyBag.skipAnnotationParse === "true";
			this._sLineItemQualifier = mPropertyBag.lineItemQualifier;
			this._sPresentationVariantQualifier = mPropertyBag.presentationVariantQualifier;
			this.enableInResultForLineItem = mPropertyBag.enableInResultForLineItem === "true";
			this._oSemanticKeyAdditionalControl = mPropertyBag._semanticKeyAdditionalControl;
			this._bShowDetailsButton = mPropertyBag.showDetailsButton;
			this._bEnableAutoColumnWidth = mPropertyBag.enableAutoColumnWidth;
			this._bPreserveDecimals = mPropertyBag.preserveDecimals;
			this._oCustomizeConfigTextInEditModeSource = mPropertyBag.textInEditModeSource;
			this._oCustomizeConfigIgnoreInsertRestrictions = mPropertyBag.ignoreInsertRestrictions;
			this._oCustomizeConfigClientSideMandatoryCheck = mPropertyBag.clientSideMandatoryCheck;
			try {
				var getCustomData = function(vSettings) {
					switch (typeof vSettings) {
						case "string":
							return JSON.parse(vSettings);
						case "object":
							if (vSettings == null) {
								return undefined;
							}
							return vSettings;
						default:
							return undefined;
					}
				};
				this._oDateFormatSettings = getCustomData(mPropertyBag.dateFormatSettings);
				this._oCurrencyFormatSettings = getCustomData(mPropertyBag.currencyFormatSettings);
				this._oDefaultDropDownDisplayBehaviour = mPropertyBag.defaultDropDownDisplayBehaviour;
			} catch (ex) {
				// Invalid dateformat provided!
			}
		}
		if (!this._oDateFormatSettings) {
			this._oDateFormatSettings = {};
		}
		// Default to UTC true if nothing is provided --> as sap:display-format="Date" should be used without a timezone
		if (!this._oDateFormatSettings.hasOwnProperty("UTC")) {
			this._oDateFormatSettings["UTC"] = true;
		}
		this._aODataFieldMetadata = [];
		this._aTableViewMetadata = [];
		this._aIgnoredFields = [];
		this._aInitiallyVisibleFields = [];
		this._oMetadataAnalyser = new MetadataAnalyser(this._oParentODataModel);
		this._oSemanticObjectController = mPropertyBag.semanticObjectController;
		this._intialiseMetadata();
	};

	/**
	 * Initialises the necessary table metadata
	 *
	 * @private
	 */
	TableProvider.prototype._intialiseMetadata = function() {
		var aTableViewMetadata = [], iCurrentIndex = -1, i, iLen, oField, oTableViewField, fSorter, sSupportedFormats, sFullyQualifiedEntityTypeName;
		this._aODataFieldMetadata = this._oMetadataAnalyser.getFieldsByEntitySetName(this.sEntitySet);
		sFullyQualifiedEntityTypeName = this._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.sEntitySet);
		if (!this._bSkipAnnotationParse) {
			this._oPresentationVariant = this._oMetadataAnalyser.getPresentationVariantAnnotation(sFullyQualifiedEntityTypeName, this._sPresentationVariantQualifier);
			if (this._oPresentationVariant) {
				this._oLineItemAnnotation = this._oPresentationVariant.lineItemAnnotation;
			}
			if (!this._oLineItemAnnotation) {
				this._oLineItemAnnotation = this._oMetadataAnalyser.getLineItemAnnotation(sFullyQualifiedEntityTypeName, this._sLineItemQualifier);
			}
		}

		// for ResponsiveTable - also get SemanticKey annotaiton
		if (this._isMobileTable) {
			this._oSemanticKeyAnnotation = this._oMetadataAnalyser.getSemanticKeyAnnotation(sFullyQualifiedEntityTypeName);
		}
		// for non-AnalyticalTable add navigationProperty fields from LineItem annotation to metadata
		if (!this._isAnalyticalTable) {
			this._addLineItemNavigationFields(sFullyQualifiedEntityTypeName);
		}

		sSupportedFormats = this._oMetadataAnalyser.getEntityContainerAttribute("supported-formats");
		if (sSupportedFormats) {
			this._bSupportsExcelExport = sSupportedFormats.indexOf("xlsx") > -1;

			this._oPdfAnnotation = sSupportedFormats.indexOf("pdf") > -1 && this._oMetadataAnalyser.getPDFSupportedAnnotation();
			this._bSupportsPDFExport = this._oParentODataModel.isA("sap.ui.model.odata.v2.ODataModel") && this._oPdfAnnotation;
		}

		if (!this._oDefaultDropDownDisplayBehaviour) {
			this._oDefaultDropDownDisplayBehaviour = this._oMetadataAnalyser.getTextArrangementValue(sFullyQualifiedEntityTypeName);
		}

		this._generateArrays();

		this._oControlProvider = new ControlProvider({
			metadataAnalyser: this._oMetadataAnalyser,
			model: this._oParentODataModel,
			fieldsMetadata: this._aODataFieldMetadata,
			lineItemAnnotation: this._oLineItemAnnotation,
			semanticKeyAnnotation: this._oSemanticKeyAnnotation,
			_semanticKeyAdditionalControl: this._oSemanticKeyAdditionalControl,
			processDataFieldDefault: true,
			isMobileTable: this._isMobileTable,
			isAnalyticalTable: this._isAnalyticalTable,
			smartTableId: this._smartTableId,
			dateFormatSettings: this._oDateFormatSettings,
			currencyFormatSettings: this._oCurrencyFormatSettings,
			defaultDropDownDisplayBehaviour: this._oDefaultDropDownDisplayBehaviour,
			useSmartField: this.useSmartField,
			useSmartToggle: this.useSmartToggle,
			defaultFilterBarExpanded: this.defaultFilterBarExpanded,
			defaultShowAllFilters: this.defaultShowAllFilters,
			useUTCDateTime: this.useUTCDateTime,
			enableDescriptions: true,
			entitySet: this.sEntitySet,
			semanticObjectController: this._oSemanticObjectController,
			preserveDecimals: this._bPreserveDecimals,
			textInEditModeSource: this._oCustomizeConfigTextInEditModeSource,
			ignoreInsertRestrictions: this._oCustomizeConfigIgnoreInsertRestrictions,
			clientSideMandatoryCheck: this._oCustomizeConfigClientSideMandatoryCheck
		});

		this._oFieldSemanticObjectMap = {};

		if (this._aODataFieldMetadata) {
			iLen = this._aODataFieldMetadata.length;
		}
		for (i = 0; i < iLen; i++) {
			oField = this._aODataFieldMetadata[i];
			// Ignore the fields in the ignored list -or- the one marked with visible="false" in annotation -or- "hidden"-annotated fields that not be
			// rendered on the UI
			if (this._aIgnoredFields.indexOf(oField.name) > -1 || !this._isVisible(oField)) {
				oField.visible = false;
				continue;
			}

			// Check if field is not a Primitive type --> only generate metadata for primitive/simple type fields
			if (oField.type.indexOf("Edm.") === 0) {
				oTableViewField = this._oControlProvider.getFieldViewMetadata(oField, this.isEditableTable);
				this._enrichWithTableViewMetadata(oTableViewField, iCurrentIndex++);
				aTableViewMetadata.push(oTableViewField);
				if (oTableViewField.semanticObject) {
					this._oFieldSemanticObjectMap[oTableViewField.name] = oTableViewField.semanticObject;
				}
			}
		}

		// Sorter function for sorting based on index (always expect index to be filled)
		fSorter = function(field1, field2) {
			return field1.index - field2.index;
		};
		// Sort the array based on LineItem annotation and the calculated order
		this._aTableViewMetadata = aTableViewMetadata.sort(fSorter);

		// Update Text dimension info for Analytical scenarios, if necessary
		if (this._isAnalyticalTable && this._mDimensionFromText) {
			this._aTableViewMetadata.forEach(function(oTextField) {
				// Check if field is a Text for a dimension
				var sDimensionFieldName = this._mDimensionFromText[oTextField.name];
				// Add corresponding dimension as additional property only if Text itself is not a dimension
				if (sDimensionFieldName && oTextField.aggregationRole !== "dimension") {
					if (!oTextField.additionalProperty) {
						oTextField.additionalProperty = sDimensionFieldName;
					} else {
						oTextField.additionalProperty += "," + sDimensionFieldName;
					}
				}
			}.bind(this));
		}
	};

	/**
	 * Adds the navigationProperty fields from LineItem annotation to the OData Field array
	 *
	 * @param {string} sFullyQualifiedEntityTypeName the full path of the entity type (including the namespace)
	 * @private
	 */
	TableProvider.prototype._addLineItemNavigationFields = function(sFullyQualifiedEntityTypeName) {
		var aFields, iLen, sField, oField;
		if (this._aODataFieldMetadata && this._oLineItemAnnotation) {
			aFields = this._oLineItemAnnotation.fields;
			if (aFields) {
				iLen = aFields.length;
			}
			// Check if any LineItem DataField contains a "/" (assumed to be navigationProperty path)
			while (iLen--) {
				sField = aFields[iLen];
				if (sField && sField.indexOf("/") >= 0) {
					oField = this._oMetadataAnalyser.extractNavigationPropertyField(sField, this.sEntitySet);
					// If a navigationProperty field is present - append the path so that binding and other checks work correctly!
					if (oField) {
						oField.name = oField.parentPropertyName + "/" + oField.name;
						if (oField.description) {
							oField.description = oField.parentPropertyName + "/" + oField.description;
						}
						if (oField.unit) {
							oField.unit = oField.parentPropertyName + "/" + oField.unit;
						}
						// Add the navigationProperty data field to the list of fields from the entity
						this._aODataFieldMetadata.push(oField);
					}
				}
			}
		}
	};

	/**
	 * Get the field semantic object map.
	 *
	 * @returns {object} the semantic object map
	 * @public
	 */
	TableProvider.prototype.getFieldSemanticObjectMap = function() {
		return this._oFieldSemanticObjectMap;
	};

	/**
	 * Get the fields that can be added as Columns
	 *
	 * @returns {Array} the table view metadata
	 * @public
	 */
	TableProvider.prototype.getTableViewMetadata = function() {
		return this._aTableViewMetadata;
	};

	/**
	 * Returns a flag indicating whether excel export is supported by this table (OData service).
	 *
	 * @returns {boolean} whether excel export is supported
	 * @public
	 */
	TableProvider.prototype.getSupportsExcelExport = function() {
		return this._bSupportsExcelExport;
	};

	/**
	 * Returns a flag indicating whether pdf export is supported by this table (OData service).
	 *
	 * @param {sap.ui.comp.smarttable.ExportType} sExportType Export type of the SmartTable instance
	 * @returns {object} export capabilities
	 * @public
	 */
	TableProvider.prototype.getExportCapabilities = function(sExportType) {
		var oExportCapabilities = {};
		if (sExportType.indexOf("UI5Client") > -1) {
			// default
			oExportCapabilities["XLSX"] = {};
		}

		if (this._bSupportsPDFExport && (sExportType == "UI5ClientPDF")) {
			oExportCapabilities["PDF"] = {};
			Object.assign(oExportCapabilities["PDF"], this._oPdfAnnotation);
		}

		return oExportCapabilities;
	};

	/**
	 * Returns a flag indicating whether multi-unit behavior is enabled for this table (OData service).
	 *
	 * @returns {boolean} Whether multi-unit behavior is enabled via annotation
	 * @public
	 */
	TableProvider.prototype.getMultiUnitBehaviorEnabled = function() {
		return this._oMetadataAnalyser.getMultiUnitBehaviorEnabled();
	};

	/**
	 * Returns a flag indicating whether date handling with UTC is enabled for the table.
	 *
	 * @returns {boolean} whether UTC date handling is enabled
	 * @public
	 */
	TableProvider.prototype.getIsUTCDateHandlingEnabled = function() {
		return this._oDateFormatSettings ? this._oDateFormatSettings.UTC : false;
	};

	/**
	 * Get the fields that has to be always requested via $select
	 *
	 * @returns {Array} the table view metadata
	 * @public
	 */
	TableProvider.prototype.getRequestAtLeastFields = function() {

		return (this._oPresentationVariant && this._oPresentationVariant.requestAtLeastFields) ? this._oPresentationVariant.requestAtLeastFields : [];

	};

	/**
	 * Returns whether the provided field has default importance within the line item annotations.
	 *
	 * @param {object} mField The field metadata
	 * @returns {boolean} Whether default importance or not
	 * @since 1.87
	 * @protected
	 */
	TableProvider.prototype.isLineItemDefaultImportance = function(mField) {
		if (mField.importance != "High") {
			return false;
		}

		var aLineItemAnnotations = (this._oLineItemAnnotation && this._oLineItemAnnotation.annotation) || [];
		return aLineItemAnnotations.some(function(mAnnotation) {
		    return mAnnotation.Value && mAnnotation.Value.Path == mField.name && !MetadataAnalyser.hasImportance(mAnnotation);
		});
	};

	/**
	 * Returns the metadata of the provided field path from the entity set.
	 * If the modelType is missing on the found field metadata then it is created and set on the field.
	 *
	 * @param {string} sName The path of the field
	 * @param {boolean} bAdditionalProperty Whether the missing additional properties must be set or not
	 * @returns {object|undefined} The metadata of the field
	 * @since 1.86
	 * @protected
	 */
	TableProvider.prototype.getFieldMetadata = function(sName, bAdditionalProperty) {
		var oFieldMetadata = this._aTableViewMetadata.concat(this._aODataFieldMetadata).find(function(mField) {
			return mField.name == sName;
		});

		if (!oFieldMetadata && sName && sName.includes("/")) {
			try {
				oFieldMetadata = this._oMetadataAnalyser.extractNavigationPropertyField(sName, this.sEntitySet);
			} catch (e) {
				// navigation property could not be found in the metadata
			}
		}

		if (oFieldMetadata) {
			if (!oFieldMetadata.modelType) {
				this._oControlProvider.createModelTypeInstance(oFieldMetadata);
			}
			if (bAdditionalProperty && !oFieldMetadata.hasOwnProperty("additionalProperty")) {
				oFieldMetadata.additionalProperty = this._getAdditionalProperty(oFieldMetadata).join(",");
			}
		}

		return oFieldMetadata;
	};

	/**
	 * Generate an array of fields that need to be ignored and initially made visible in the SmartTable (if any)
	 *
	 * @private
	 */
	TableProvider.prototype._generateArrays = function() {
		if (this._sIgnoredFields) {
			this._aIgnoredFields = this._sIgnoredFields.split(",");
		}
		if (this._sInitiallyVisibleFields) {
			this._aInitiallyVisibleFields = this._sInitiallyVisibleFields.split(",");
		}
	};

	/**
	 * Returns the additional properties necessary from the field metadata
	 *
	 * @private
	 */
	TableProvider.prototype._getAdditionalProperty = function(oFieldViewMetadata) {
		var aAdditionalProperty = [];

		// additional property handling for table
		if (oFieldViewMetadata.isMeasureField && oFieldViewMetadata.unit) {
			aAdditionalProperty.push(oFieldViewMetadata.unit);
		} else if (oFieldViewMetadata.description) {
			aAdditionalProperty.push(oFieldViewMetadata.description);
		}
		// Include criticality if it exists as field metadata
		if (oFieldViewMetadata.criticality) {
			aAdditionalProperty.push(oFieldViewMetadata.criticality);
		}
		// Include criticality representation if it exists as field metadata
		if (oFieldViewMetadata.criticalityRepresentation) {
			aAdditionalProperty.push(oFieldViewMetadata.criticalityRepresentation);
		}
		// Include link Properties
		if (oFieldViewMetadata.linkProperties && oFieldViewMetadata.linkProperties.length) {
			aAdditionalProperty = aAdditionalProperty.concat(oFieldViewMetadata.linkProperties);
		}
		// Include field control Properties
		if (oFieldViewMetadata.fieldControlProperty) {
			aAdditionalProperty.push(oFieldViewMetadata.fieldControlProperty);
		}
		// Include timezone path for DateTimeOffset with Timezone
		if (oFieldViewMetadata.timezone) {
			aAdditionalProperty.push(oFieldViewMetadata.timezone);
		}

		return aAdditionalProperty;
	};

	/**
	 * Calculates additional flags and attributes for a field e.g. whether TypeAhead is switched on
	 *
	 * @param {object} oFieldViewMetadata - the table view field
	 * @param {number} iCurrentIndex - the current index that is needed to calculate the final index of this item
	 * @private
	 */
	TableProvider.prototype._enrichWithTableViewMetadata = function(oFieldViewMetadata, iCurrentIndex) {
		var aNavigationProperty = [], aAdditionalProperty, sPath, iLength, sWidth;
		var fExtractNavigationProperty = function(sProperty) {
			var sNavigationPath, aTemp;
			if (sProperty && sProperty.indexOf("/") > -1) {
				aTemp = sProperty.split("/");
				// Remove the Property part
				aTemp.pop();
				// Extract only the navigationPath
				sNavigationPath = aTemp.join("/");
			}
			return sNavigationPath;
		};
		// Label is already set and can be updated if present in the LineItem annotation
		this._updateLabel(oFieldViewMetadata);
		oFieldViewMetadata.importance = this._getFieldImportance(oFieldViewMetadata) || oFieldViewMetadata.importance;
		oFieldViewMetadata.isInitiallyVisible = this._isInitiallyVisible(oFieldViewMetadata);
		oFieldViewMetadata.index = this._getIndex(oFieldViewMetadata, iCurrentIndex);
		if (!oFieldViewMetadata.width) {
			sWidth = this._getLineItemFieldWidth(oFieldViewMetadata);
			if (sWidth) {
				oFieldViewMetadata.width = sWidth;
			} else if (!this._isMobileTable && !this._bEnableAutoColumnWidth) {
				oFieldViewMetadata.width = FormatUtil.getWidth(oFieldViewMetadata);
			}
		}

		// additional property handling for table
		aAdditionalProperty = this._getAdditionalProperty(oFieldViewMetadata);
		iLength = aAdditionalProperty.length;
		if (iLength) {
			oFieldViewMetadata.additionalProperty = aAdditionalProperty.join(",");
		}
		while (iLength--) {
			sPath = fExtractNavigationProperty(aAdditionalProperty[iLength]);
			// add the navigationPath, if it exists, to the array
			if (sPath) {
				aNavigationProperty.push(sPath);
			}
		}

		// add the parentProperty (navigationProperty name to the array if it exists
		if (oFieldViewMetadata.parentPropertyName) {
			aNavigationProperty.push(oFieldViewMetadata.parentPropertyName);
		}
		oFieldViewMetadata.navigationProperty = aNavigationProperty.join(",");

		// set the sortOrder from metadata
		this._setSortOrder(oFieldViewMetadata);

		if (oFieldViewMetadata.isFiscalDate) {
			FiscalMetadata.updateViewMetadata(oFieldViewMetadata);
		}

		if (oFieldViewMetadata.isCalendarType) {
			CalendarMetadata.updateViewMetadata(oFieldViewMetadata);
		}

		oFieldViewMetadata.semanticObjectPath = (oFieldViewMetadata["com.sap.vocabularies.Common.v1.SemanticObject"] && oFieldViewMetadata["com.sap.vocabularies.Common.v1.SemanticObject"]["Path"]) || undefined;

		// below properties are only relevant for analytical table
		if (this._isAnalyticalTable) {
			// aggregation-role= "measure" --> columns shall be summed on the UI (analytical table)
			oFieldViewMetadata.summed = oFieldViewMetadata.aggregationRole === "measure";
			// set the inResult from metadata
			this._setInResult(oFieldViewMetadata);
			// set the groupBy from metadata
			this._setGroupBy(oFieldViewMetadata);
			this._mapDimensionFromTextProperty(oFieldViewMetadata);
		}
	};

	/**
	 * Returns a flag indicating whether the field should be initially visible on the UI
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @returns {boolean} if the field should be initially visible
	 * @private
	 */
	TableProvider.prototype._isInitiallyVisible = function(oField) {
		var bInitiallyVisible = false;

		// Check if field exists in LineItem annotation (based on prio)
		if (this._oLineItemAnnotation && this._oLineItemAnnotation.fields) {
			bInitiallyVisible = this._oLineItemAnnotation.fields.indexOf(oField.name) > -1;

			if (bInitiallyVisible && !Device.system.desktop && !this._bShowDetailsButton) {
				var sImportance = oField.importance;
				if (sImportance) {
					if (Device.system.tablet) {
						bInitiallyVisible = sImportance === "High" || sImportance === "Medium"; // on tablets only show initially importance
						// high/medium columns
					} else if (Device.system.phone) {
						bInitiallyVisible = sImportance === "High"; // on phones only show initially importance high columns
					}
				}
			}
		}
		// Also check if field is part of SmartTable configuration
		if (!bInitiallyVisible && this._aInitiallyVisibleFields) {
			bInitiallyVisible = this._aInitiallyVisibleFields.indexOf(oField.name) > -1;
		}
		return bInitiallyVisible;
	};

	/**
	 * Sets inResult on the field metadata if the field exists in the RequestAtLeast of PresentationVariant annotation (or when
	 * enableInResultForLineItem is set, from LineItem annotation)
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._setInResult = function(oField) {
		// first check if field is part of PresentationVariant-->RequestAtLeastFields
		if (this._oPresentationVariant) {
			if (this._oPresentationVariant.requestAtLeastFields && this._oPresentationVariant.requestAtLeastFields.indexOf(oField.name) > -1) {
				oField.inResult = true;
			}
		} else if (this.enableInResultForLineItem) {
			// else set inResult based on LineItem (mainly relevant for AnalyticalTable) only in non PresentationVariant use case
			if (this._oLineItemAnnotation && this._oLineItemAnnotation.fields && this._oLineItemAnnotation.fields.indexOf(oField.name) > -1) {
				oField.inResult = true;
			}
		}
	};

	/**
	 * Sets sorting realted info (sorted and sortOrder) on the field metadata if the field exists in the SortOrder of PresentationVariant annotation
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._setSortOrder = function(oField) {
		var iLen;
		// first check if field is part of PresentationVariant-->SortOrder
		if (this._oPresentationVariant && this._oPresentationVariant.sortOrderFields) {
			iLen = this._oPresentationVariant.sortOrderFields.length;
			for (var i = 0; i < iLen; i++) {
				if (this._oPresentationVariant.sortOrderFields[i].name === oField.name) {
					oField.sorted = true;
					oField.sortOrder = this._oPresentationVariant.sortOrderFields[i].descending ? "Descending" : "Ascending";
					break;
				}
			}
		}
	};

	/**
	 * Sets grouping realted info (grouped) on the field metadata if the field exists in the GroupBy of PresentationVariant annotation
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._setGroupBy = function(oField) {
		// first check if field is part of PresentationVariant-->GroupBy
		if (this._oPresentationVariant && this._oPresentationVariant.groupByFields && this._oPresentationVariant.groupByFields.indexOf(oField.name) >= 0) {
			oField.grouped = true;
		}
	};

	/**
	 * Returns whether the field is visible
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @returns {boolean} Whether the field is visible
	 * @private
	 */
	TableProvider.prototype._isVisible = function(oField) {
		return oField.visible && !this?._oLineItemAnnotation?.hidden?.[oField.name];
	};

	/**
	 * Returns the important annotation for the given field or null
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @returns {string} the important annotation
	 * @private
	 */
	TableProvider.prototype._getFieldImportance = function(oField) {
		var sReturnValue = null;

		if (this._oLineItemAnnotation && this._oLineItemAnnotation.importance) {
			sReturnValue = this._oLineItemAnnotation.importance[oField.name];
		}

		return sReturnValue;
	};

	/**
	 * Returns the width annotation for the given field or null
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @returns {string} the width annotation
	 * @private
	 */
	TableProvider.prototype._getLineItemFieldWidth = function(oField) {
		var sReturnValue = null;

		if (this._oLineItemAnnotation && this._oLineItemAnnotation.width) {
			sReturnValue = this._oLineItemAnnotation.width[oField.name];
		}

		return sReturnValue;
	};

	/**
	 * Updates the internal map of dimension property for a given text property
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @private
	 */
	TableProvider.prototype._mapDimensionFromTextProperty = function(oField) {
		// Create a map for all dimension fields having Text
		if (!oField.description || oField.aggregationRole !== "dimension") {
			return;
		}

		if (!this._mDimensionFromText) {
			this._mDimensionFromText = {};
		}

		// Map of description fields pointing to corresponding dimension field name
		// Assume that only 1 dimension points to the given text --> hence last one wins
		this._mDimensionFromText[oField.description] = oField.name;
	};

	/**
	 * Returns the index if the field from LineItem annotation, if it was found
	 *
	 * @param {object} oField - OData metadata for the table field
	 * @param {number} iCurrentIndex - the current index in the array
	 * @returns {string} the index of the field (or undefined)
	 * @private
	 */
	TableProvider.prototype._getIndex = function(oField, iCurrentIndex) {
		var iIndex = -1, iLineItemsLength = 0, iInitiallyVisibleFieldsLength = 0;
		// Get the field order from LineItem annotation
		if (this._oLineItemAnnotation && this._oLineItemAnnotation.fields) {
			iLineItemsLength = this._oLineItemAnnotation.fields.length;
			iIndex = this._oLineItemAnnotation.fields.indexOf(oField.name);
		}
		// If LineItem exists try to make configuration fields appear at the end
		if (iIndex < 0 && this._aInitiallyVisibleFields) {
			iInitiallyVisibleFieldsLength = this._aInitiallyVisibleFields.length;
			iIndex = this._aInitiallyVisibleFields.indexOf(oField.name);
			// set index only if field is part of configuration
			if (iIndex > -1) {
				iIndex += iLineItemsLength;
			}
		}
		if (iIndex > -1) {
			return iIndex;
		}
		// always calculate and return an index to maintain stable Array.sort result
		return iCurrentIndex + iLineItemsLength + iInitiallyVisibleFieldsLength;
	};

	/**
	 * Updated the label from LineItem annotation metadata (if it exists)
	 *
	 * @param {object} oField - OData view metadata of the field
	 * @private
	 */
	TableProvider.prototype._updateLabel = function(oField) {
		var sLabel;
		if (this._oLineItemAnnotation && this._oLineItemAnnotation.labels) {
			sLabel = this._oLineItemAnnotation.labels[oField.name];
		}
		if (sLabel) {
			oField.label = sLabel;
		}
	};

	/**
	 * Returns the field label for the provided field name and entity set name. This function also check for field name that have been ignored by the SmartTable.
	 * @param {string} sEntitySetName the entity name as specified in the metadata document
	 * @param {string} sFieldName the field name for which the label is to be found
	 * @protected
	 * @since 1.90
	 * @returns {null|string} null or field label
	 */
	TableProvider.prototype.getFieldLabel = function(sEntitySetName, sFieldName) {
		if (!sFieldName) {
			return null;
		}
		var oField;

		if (sFieldName.indexOf("/") > -1) {
			oField = this._oMetadataAnalyser.extractNavigationPropertyField(sFieldName, sEntitySetName);
		} else {
			oField = this._oMetadataAnalyser.getFieldsByEntitySetName(sEntitySetName).find(function(oCurrentField) {
				return oCurrentField.name == sFieldName;
			});
		}

		if (!oField) {
			return null;
		}

		return (oField["com.sap.vocabularies.Common.v1.Label"] && oField["com.sap.vocabularies.Common.v1.Label"]["String"]) || oField["fieldLabel"] || null;
	};

	/**
	 * Destroys the object
	 *
	 * @public
	 */
	TableProvider.prototype.destroy = function() {
		if (this._oMetadataAnalyser && this._oMetadataAnalyser.destroy) {
			this._oMetadataAnalyser.destroy();
		}
		this._oMetadataAnalyser = null;
		if (this._oControlProvider && this._oControlProvider.destroy) {
			this._oControlProvider.destroy();
		}
		this._mDimensionFromText = null;
		this._oControlProvider = null;
		this._aODataFieldMetadata = null;
		this._aTableViewMetadata = null;
		this._aIgnoredFields = null;
		this._aInitiallyVisibleFields = null;
		this._sIgnoredFields = null;
		this._sInitiallyVisibleFields = null;
		this.bIsDestroyed = true;
	};

	return TableProvider;

}, /* bExport= */true);
