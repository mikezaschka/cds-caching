/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
// -----------------------------------------------------------------------------
// Analyses the OData service metadata doc ($metadata), having SAP-Annotations,
// to resolve all properties from entities, filterable properties, etc.
// -----------------------------------------------------------------------------
sap.ui.define([
	'./ODataType', 'sap/ui/comp/odata/FiscalMetadata', 'sap/ui/model/odata/AnnotationHelper', 'sap/m/library', 'sap/base/Log', 'sap/ui/comp/odata/CalendarMetadata'
], function(ODataType, FiscalMetadata, AnnotationHelper, mLibrary, Log, CalendarMetadata) {
	"use strict";

	// map OData v4 FilterExpressionType enum member to corresponding filter-restriction value
	var mFilterRestrictions = {
		"com.sap.vocabularies.Common.v1.FilterExpressionType/SingleInterval": "interval",
		"com.sap.vocabularies.Common.v1.FilterExpressionType/MultiValue": "multi-value",
		"com.sap.vocabularies.Common.v1.FilterExpressionType/SingleValue": "single-value"
	};
	var mSelectionRangeOptionType = {
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/EQ": "EQ",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/BT": "BT",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/CP": "CP",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/LE": "LE",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/GE": "GE",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/NE": "NE",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/NB": "NB",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/NP": "NP",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/GT": "GT",
		"com.sap.vocabularies.UI.v1.SelectionRangeOptionType/LT": "LT"
	};
	var mSelectionRangeSignType = {
		"com.sap.vocabularies.UI.v1.SelectionRangeSignType/I": "I",
		"com.sap.vocabularies.UI.v1.SelectionRangeSignType/E": "E"
	};
	var	P13nConditionOperation = mLibrary.P13nConditionOperation;

	/**
	 * Constructs a utility class to analyze the OData metadata document ($metadata) to resolve SAP annotations.<br>
	 * <b>Note:</b> Please ensure that the promise returned by {@link sap.ui.model.odata.ODataMetaModel#loaded loaded} is resolved before using this
	 * class.
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @private
	 * @param {string} oResourceRootUri - The URL of the resource or ODataModel
	 * @author SAP SE
	 */
	var MetadataAnalyser = function(oResourceRootUri) {
		if (typeof oResourceRootUri === "object") {
			this.oModel = oResourceRootUri;
		} else {
			this._sResourceRootUri = oResourceRootUri;
		}
		this._oMetadata = null;
		if (!this.oModel && this._sResourceRootUri) {
			Log.error("Analyzing metadata cannot be done without an ODataModel!");
			return;
		}
		if (this.oModel) {
			this._oMetaModel = this.oModel.getMetaModel();
		}
		if (this._oMetaModel) {
			this._oMetadata = this._oMetaModel.getProperty("/");
		}

		// store the default schema
		if (this._oMetadata && this._oMetadata.dataServices) {
			this._oSchemaDefinition = this._oMetadata.dataServices.schema[0];
		}
	};

	MetadataAnalyser.hierarchyType = {
		nodeFor: 1,
		nodeExternalKeyFor: 2,
		parentNodeFor: 3,
		levelFor: 4,
		drillStateFor: 5,
		nodeDescendantCountFor: 6
	};

	// TODO: should we cache all these entity fields for future access?
	// this.mFilterFields[sEntityTypeName] = aFinalFilterableFields;
	// TODO: consider making some APIs static (ones that just extract annotation info without needing any instance API)

	/**
	 * Returns the namespace from the Schema
	 *
	 * @returns {string} the namespace
	 * @public
	 * @deprecated Since 1.29.
	 */
	MetadataAnalyser.prototype.getNamespace = function() {
		if (this._oSchemaDefinition) {
			return this._oSchemaDefinition.namespace;
		}
	};

	/**
	 * Get the schema definition of the odata service.
	 * @public
	 * @returns {Object} The schema definition of the odata service
	 * @deprecated Since 1.29.
	 */
	MetadataAnalyser.prototype.getSchemaDefinition = function() {
		return this._oSchemaDefinition;
	};

	/**
	 * Gets the specified attribute (sap:annotation) value from the default entity container
	 *
	 * @param {string} sAttribute - The name of the attribute (sap:annotation) on the entity container
	 * @returns {string} The value of the specified attribute (if found)|null
	 * @public
	 */
	MetadataAnalyser.prototype.getEntityContainerAttribute = function(sAttribute) {
		var sAttributeValue = null, oEntityContainer;
		if (this._oMetaModel && sAttribute) {
			if (sAttribute.indexOf("sap:") < 0) {
				sAttribute = "sap:" + sAttribute;
			}
			oEntityContainer = this._oMetaModel.getODataEntityContainer();
			sAttributeValue = oEntityContainer[sAttribute] || null;
		}
		return sAttributeValue;
	};

	/**
	 * Gets the specified label for an Entity with non annotation
	 *
	 * @param {string} sEntityType - name of the entity set
	 * @returns {string} - value of the label (if found)|empty
	 * @public
	 */
	MetadataAnalyser.prototype.getEntityLabelByEntityTypeName = function(sEntityType) {
		var oEntityDef = this._getEntityDefinition(sEntityType), oResult, sResult = "";
		if (oEntityDef) {
			oResult = oEntityDef["com.sap.vocabularies.Common.v1.Label"];
			if (oResult && oResult.String) {
				sResult = oResult.String;
			}
		}

		return sResult;
	};

	/**
	 * Gets the entity definition for the specified entity type
	 *
	 * @param {string} sEntityTypeName - The entity type name as specified in the metadata document (with or without namespace)
	 * @returns {Object} entity definition
	 * @private
	 */
	MetadataAnalyser.prototype._getEntityDefinition = function(sEntityTypeName) {
		var oEntityDef = null;
		if (sEntityTypeName) {
			oEntityDef = this._oMetaModel.getODataEntityType(this._getFullyQualifiedNameForEntity(sEntityTypeName));
		}
		return oEntityDef;
	};

	/**
	 * Gets the complex type definition for the specified type
	 *
	 * @param {string} sComplexTypeName - The complex type name as specified in the metadata document (with or without namespace)
	 * @returns {Object} entity definition
	 * @private
	 */
	MetadataAnalyser.prototype._getComplexTypeDefinition = function(sComplexTypeName) {
		var oComplexTypeDef = null;
		if (sComplexTypeName) {
			oComplexTypeDef = this._oMetaModel.getODataComplexType(this._getFullyQualifiedNameForEntity(sComplexTypeName));
		}
		return oComplexTypeDef;
	};

	/**
	 * Gets the property name of a complextype in a given entityType
	 *
	 * @param {string} sEntityType - EntityType to search for the property
	 * @param {string} sComplexTypeEntityName - Type-Name of the complextype to resolve it.
	 * @returns {string} Returns the propertyname of the complextype as used in the given entityType
	 * @private
	 */
	MetadataAnalyser.prototype._getNameOfPropertyUsingComplexType = function(sEntityType, sComplexTypeEntityName) {
		var sCurrentNamespace;
		if (this._oSchemaDefinition) {
			sCurrentNamespace = this._oSchemaDefinition.namespace;
		}
		if (sEntityType && sComplexTypeEntityName && sCurrentNamespace) {
			var sTypeOnMainEntityType = sCurrentNamespace + "." + sComplexTypeEntityName;
			var oMainEntityTypeDef = this._getEntityDefinition(sEntityType);
			if (oMainEntityTypeDef) {
				var aProperties = oMainEntityTypeDef.property;
				if (aProperties && aProperties.length) {
					var i = 0;
					for (i = 0; i < aProperties.length; i++) {
						var oProperty = aProperties[i];
						if (oProperty && oProperty.type === sTypeOnMainEntityType) {
							return oProperty.name;
						}
					}
				}
			}
		}
		return null;
	};

	/**
	 * Removes the namespace from the specified string <br>
	 * returns string content that appears after the last "." separator <br>
	 * E.g.: if input is "com.sap.foo.EntityType", returns "EntityType" as the result
	 *
	 * @param {string} sString String
	 * @returns {string} String without name space. If no name space was found, the original string will be returned.
	 * @public
	 */
	MetadataAnalyser.prototype.removeNamespace = function(sString) {
		var iIndex, sResult = sString;
		// Return the result
		if (sString) {
			iIndex = sString.lastIndexOf(".") + 1;
		}
		if (iIndex > 0) {
			sResult = sString.substring(iIndex);
		}
		return sResult;
	};

	/**
	 * Gets the entity type from the Entity name (EntitySet name)
	 *
	 * @param {string} sEntitySetName - The entity name
	 * @returns {string} The entity type
	 * @private
	 */
	MetadataAnalyser.prototype.getEntityTypeNameFromEntitySetName = function(sEntitySetName) {
		var oEntitySet = null, sEntityTypeName = null;

		if (this._oMetaModel) {
			oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySetName);
			if (oEntitySet) {
				sEntityTypeName = oEntitySet.entityType;
			}
		}
		return sEntityTypeName;
	};

	/**
	 * Gets the first matching entity set from the Entity Type name (EntityType name)
	 *
	 * @param {string} sEntityTypeName - The entity name
	 * @returns {string} The entitySet name
	 * @private
	 * @deprecated Since 1.29.
	 */
	MetadataAnalyser.prototype.getEntitySetNameFromEntityTypeName = function(sEntityTypeName) {
		var sQualifiedEntity, oEntityContainer, aEntitySet, i, iLen, oEntitySet;
		// get entity type
		if (this._oMetaModel && sEntityTypeName) {
			sQualifiedEntity = this._getFullyQualifiedNameForEntity(sEntityTypeName);
			oEntityContainer = this._oMetaModel.getODataEntityContainer();
			if (oEntityContainer && sQualifiedEntity) {
				aEntitySet = oEntityContainer.entitySet;
				iLen = aEntitySet.length;
				for (i = 0; i < iLen; i++) {
					oEntitySet = aEntitySet[i];
					if (oEntitySet.entityType === sQualifiedEntity) {
						break;
					}
					oEntitySet = null;
				}
				// get entity set name
				if (oEntitySet) {
					return oEntitySet.name;
				}
			}
		}

		return null;
	};

	/**
	 * Gets a collection of keys (field names) for the specified entity name
	 *
	 * @param {string} sEntitySetName - The entity name as specified in the metadata document
	 * @returns {Array} Array of key names
	 * @public
	 */
	MetadataAnalyser.prototype.getKeysByEntitySetName = function(sEntitySetName) {
		var aKeys = null, sEntityTypeName = null;
		if (!this._oMetaModel) {
			return undefined;
		}
		sEntityTypeName = this.getEntityTypeNameFromEntitySetName(sEntitySetName);
		if (sEntityTypeName) {
			aKeys = this.getKeysByEntityTypeName(sEntityTypeName);
		}
		return aKeys;
	};

	/**
	 * Gets a collection keys (field names) for the specified entity type
	 *
	 * @param {string} sEntityTypeName - The entity type name as specified in the metadata document
	 * @returns {Array} Array of key names
	 * @public
	 */
	MetadataAnalyser.prototype.getKeysByEntityTypeName = function(sEntityTypeName) {
		var aKeys = null, aPropertyRefs = null, i, iLen = 0, oEntityDef = null;
		if (!this._oMetaModel) {
			return undefined;
		}
		oEntityDef = this._getEntityDefinition(sEntityTypeName);
		if (oEntityDef) {
			if (oEntityDef.key) {
				aPropertyRefs = oEntityDef.key.propertyRef;
				if (aPropertyRefs) {
					iLen = aPropertyRefs.length;
					aKeys = [];
					for (i = 0; i < iLen; i++) {
						aKeys.push(aPropertyRefs[i].name);
					}
				}
			}
		}
		return aKeys;
	};

	/**
	 * Gets a collection of fields for the specified entity name
	 *
	 * @param {string} sEntitySetName - The entity name as specified in the metadata document
	 * @returns {Array} Array of fields
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldsByEntitySetName = function(sEntitySetName) {
		var aFields = null, oEntitySet, sEntityTypeName = null;
		if (!this._oMetaModel) {
			return undefined;
		}
		oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySetName);
		if (oEntitySet) {
			sEntityTypeName = oEntitySet.entityType;
		}

		if (sEntityTypeName) {
			aFields = this.getFieldsByEntityTypeName(sEntityTypeName);
			this._enrichEntitySetMetadata(aFields, oEntitySet);
		}

		return aFields;
	};

	/**
	 * Enriches the fields with entitySet relevant metadata
	 *
	 * @param {Array} aFields - Array of field metadata derived from OData properties
	 * @param {Object} oEntitySet - The entity set instance from ODataMetaModel
	 * @private
	 */
	MetadataAnalyser.prototype._enrichEntitySetMetadata = function(aFields, oEntitySet) {
		var iLen, oField, aNonSortablePaths, aNonFilterablePaths, aRequiredFilterFields, mFilterExpressionRestriction;

		aNonSortablePaths = this._getNonSortableFields(oEntitySet);
		aNonFilterablePaths = this._getNonFilterableFields(oEntitySet);
		aRequiredFilterFields = this._getRequiredFilterFields(oEntitySet);
		mFilterExpressionRestriction = this._getFilterExpressionRestriction(oEntitySet);
		// Loop over the fields
		iLen = aFields.length;
		while (iLen--) {
			oField = aFields[iLen];
			// Update sortable on fields
			oField.sortable = !(aNonSortablePaths.indexOf(oField.name) > -1);
			// Update Filterable on fields
			oField.filterable = !(aNonFilterablePaths.indexOf(oField.name) > -1);
			// Update required filters
			oField.requiredFilterField = (aRequiredFilterFields.indexOf(oField.name) > -1);
			// Update FilterRestriction
			oField.filterRestriction = mFilterExpressionRestriction[oField.name];
		}
	};

	/**
	 * Extracts list of field names from the provided annotation and property (Org.OData.Capabilities.V1.SortRestrictions and NonSortableProperties)
	 *
	 * @param {Object} oAnnotation - The annotation that from which PropertyPaths needs to be extracted
	 * @param {string} sAnnotationProperty - the property on the annotation that contains the array of PropertyPaths
	 * @returns {Array} Array of field names or []
	 * @private
	 */
	MetadataAnalyser.prototype._extractPropertyPathsFromAnnotation = function(oAnnotation, sAnnotationProperty) {
		var aPaths = [], aAnnotationProperties, iLen, sPath;
		if (oAnnotation && sAnnotationProperty) {
			aAnnotationProperties = oAnnotation[sAnnotationProperty];
		}
		if (aAnnotationProperties) {
			iLen = aAnnotationProperties.length;
			while (iLen--) {
				sPath = aAnnotationProperties[iLen].PropertyPath;
				if (sPath) {
					aPaths.push(sPath);
				}
			}
		}
		return aPaths;
	};

	/**
	 * Retrieves list of non sortable fields from the entitySet annotation (Org.OData.Capabilities.V1.SortRestrictions)
	 *
	 * @param {Object} oEntitySet - The entity set instance from ODataMetaModel
	 * @returns {Array} Array of field names
	 * @private
	 */
	MetadataAnalyser.prototype._getNonSortableFields = function(oEntitySet) {
		var oSortRestrictions;
		if (oEntitySet) {
			oSortRestrictions = oEntitySet["Org.OData.Capabilities.V1.SortRestrictions"];
		}
		return this._extractPropertyPathsFromAnnotation(oSortRestrictions, "NonSortableProperties");
	};

	/**
	 * Retrieves list of non sortable fields from the entitySet annotation (Org.OData.Capabilities.V1.SortRestrictions)
	 *
	 * @param {Object} oEntitySet - The entity set instance from ODataMetaModel
	 * @returns {Array} Array of field names
	 * @private
	 */
	MetadataAnalyser.prototype._getNonFilterableFields = function(oEntitySet) {
		var oFilterRestrictions;
		if (oEntitySet) {
			oFilterRestrictions = oEntitySet["Org.OData.Capabilities.V1.FilterRestrictions"];
		}
		return this._extractPropertyPathsFromAnnotation(oFilterRestrictions, "NonFilterableProperties");
	};

	/**
	 * Retrieves list of required fields based on the entitySet annotation (Org.OData.Capabilities.V1.FilterRestrictions/RequiredProperties)
	 *
	 * @param {Object} oEntitySet - The entity set instance from ODataMetaModel
	 * @returns {Array} Array of field names
	 * @private
	 */
	MetadataAnalyser.prototype._getRequiredFilterFields = function(oEntitySet) {
		var oFilterRestrictions;
		if (oEntitySet) {
			oFilterRestrictions = oEntitySet["Org.OData.Capabilities.V1.FilterRestrictions"];
		}
		return this._extractPropertyPathsFromAnnotation(oFilterRestrictions, "RequiredProperties");
	};

	/**
	 * Retrieves map of fields with filter restriction the entitySet annotation (com.sap.vocabularies.Common.v1.FilterExpressionRestrictions)
	 *
	 * @param {Object} oEntitySet - The entity set instance from ODataMetaModel
	 * @returns {Object} JSON map of field names with filter restriction
	 * @private
	 */
	MetadataAnalyser.prototype._getFilterExpressionRestriction = function(oEntitySet) {
		var mFilterExpressionRestriction = {}, aFilterExpressionRestrictions, iLen, oFilterExpressionRestriction, oProperty, oAllowedExpression;
		if (oEntitySet) {
			var aFilterRestrictions = oEntitySet["Org.OData.Capabilities.V1.FilterRestrictions"];
			if (aFilterRestrictions) {
				aFilterExpressionRestrictions = aFilterRestrictions["FilterExpressionRestrictions"];
				if (aFilterExpressionRestrictions) {
					for (var i = 0; i < aFilterExpressionRestrictions.length; i++) {
						oProperty = aFilterExpressionRestrictions[i].Property;
						oAllowedExpression = aFilterExpressionRestrictions[i].AllowedExpressions;
						if (oAllowedExpression && oAllowedExpression.String) {
							switch (oAllowedExpression.String) {
								case "SingleValue":
									mFilterExpressionRestriction[oProperty.PropertyPath] = "single-value";
									break;
								case "MultiValue":
									mFilterExpressionRestriction[oProperty.PropertyPath] = "multi-value";
									break;
								case "SingleRange":
									mFilterExpressionRestriction[oProperty.PropertyPath] = "interval";
									break;
								case "SearchExpression":
									mFilterExpressionRestriction[oProperty.PropertyPath] = "search-expression";
									break;
								default:
									// Do nothing...
							}
						}
					}
				}
			}
			if (aFilterExpressionRestrictions == undefined) {
				// Legacy: Also check the deprecated annotation com.sap.vocabularies.Common.v1.FilterExpressionRestrictions
				// if nothing has been found with the new annotation
				aFilterExpressionRestrictions = oEntitySet["com.sap.vocabularies.Common.v1.FilterExpressionRestrictions"];
				if (aFilterExpressionRestrictions) {
					iLen = aFilterExpressionRestrictions.length;
					while (iLen--) {
						oFilterExpressionRestriction = aFilterExpressionRestrictions[iLen];
						if (oFilterExpressionRestriction) {
							oProperty = oFilterExpressionRestriction.Property;
							oAllowedExpression = oFilterExpressionRestriction.AllowedExpressions;
							if (oProperty && oAllowedExpression && oProperty.PropertyPath && oAllowedExpression.EnumMember) {
								// convert to v2 format expected in several Smart controls
								mFilterExpressionRestriction[oProperty.PropertyPath] = mFilterRestrictions[oAllowedExpression.EnumMember];
							}
						}
					}
				}
			}
		}
		return mFilterExpressionRestriction;
	};

	/**
	 * Checks if a property/navigation property is filterable (Org.OData.Capabilities.V1.FilterRestrictions/NonFilterableProperties)
	 *
	 * @param {Object} oProperty - The property instance from ODataMetaModel
	 * @param {Object} oEntitySet - The entity set from the metadata document
	 * @returns {boolean} whether the specified property is filterable
	 * @private
	 */
	MetadataAnalyser.prototype._isFilterable = function(oProperty, oEntitySet) {
		var aNonFilterablePaths, bFilterable = true;

		if (oEntitySet) {
			aNonFilterablePaths = this._getNonFilterableFields(oEntitySet);
			bFilterable = !(aNonFilterablePaths.indexOf(oProperty.name) > -1);
		}

		// fallback even if v2->v4 lift is not finished
		if (bFilterable) {
			bFilterable = !(oProperty["sap:filterable"] === "false");
		}
		return bFilterable;
	};

	/**
	 * Checks if <code>oProperty</code> is annotated as <code>com.sap.vocabularies.UI.v1.HiddenFilter</code>.
	 *
	 * @param {Object} oProperty The property instance from ODataMetaModel
	 * @returns {boolean} whether the specified property is marked as hidden filter
	 * @protected
	 */
	MetadataAnalyser.isHiddenFilter = function(oProperty) {
		return !!oProperty["com.sap.vocabularies.UI.v1.HiddenFilter"] && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.UI.v1.HiddenFilter"]);
	};

	/**
	 * Checks if <code>oProperty</code> is annotated as <code>com.sap.vocabularies.UI.v1.Hidden</code>. The semantic of hidden is: the data is
	 * available on the UI, but no control is rendered for the data.
	 *
	 * @param {Object} oProperty The property instance from ODataMetaModel
	 * @returns {boolean} whether the specified property is marked as hidden
	 * @protected
	 */
	MetadataAnalyser.isHidden = function(oProperty) {
		return !!oProperty["com.sap.vocabularies.UI.v1.Hidden"] && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.UI.v1.Hidden"]);
	};

	/**
	 * Gets a collection of fields for the specified entity type
	 *
	 * @param {string} sEntityTypeName - The entity type name as specified in the metadata document
	 * @returns {Array} Array of fields
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldsByEntityTypeName = function(sEntityTypeName) {
		var oEntityDef;
		if (!this._oMetaModel) {
			return undefined;
		}
		oEntityDef = this._getEntityDefinition(sEntityTypeName);
		return this._getFieldsByEntityDefinition(oEntityDef);
	};

	/**
	 * Gets a collection of fields for the specified complex type
	 *
	 * @param {string} sComplexTypeName - The complex type name as specified in the metadata document
	 * @param {string} sParentPropertyName - The name of the parent property (complex type property)
	 * @returns {Array} Array of fields
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldsByComplexTypeName = function(sComplexTypeName, sParentPropertyName) {
		var oComplexDef;
		if (!this._oMetaModel) {
			return undefined;
		}
		oComplexDef = this._getComplexTypeDefinition(sComplexTypeName);
		return this._getFieldsByEntityDefinition(oComplexDef, sParentPropertyName);
	};

	/**
	 * Get an array of all entity type names
	 *
	 * @returns {Array} Returns an array of entity type names
	 * @public
	 */
	MetadataAnalyser.prototype.getAllEntityTypeNames = function() {
		if (!this._oMetaModel) {
			return undefined;
		}
		var oSchema = this._oSchemaDefinition;
		if (oSchema.entityType && oSchema.entityType.length > 0) {
			var i = 0;
			var aResult = [];
			for (i = 0; i < oSchema.entityType.length; i++) {
				aResult.push(oSchema.entityType[i].name);
			}
			return aResult;
		}
		return null;
	};

	/**
	 * Gets a map with fields and their related semantic objects
	 *
	 * @param {string} sEntitySetName - The entity set for which the map should be returned
	 * @returns {object} map between fields and semantic objects
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldSemanticObjectMap = function(sEntitySetName) {
		var aODataFieldMetadata = this.getFieldsByEntitySetName(sEntitySetName);
		if (!aODataFieldMetadata) {
			return null;
		}
		var oMap = {}, i, iLen = aODataFieldMetadata.length;
		for (i = 0; i < iLen; i++) {
			var oField = aODataFieldMetadata[i];
			var mAnnotation = this.getSemanticObjectAnnotation(oField.fullName);
			if (mAnnotation && mAnnotation.semanticObject) {
				oMap[oField.name] = mAnnotation.semanticObject;
			}
		}

		return oMap;
	};

	/**
	 * Gets a collection fields for the specified entity definition
	 *
	 * @param {Object} oEntityDef - The entity definition as specified in the metadata document
	 * @param {string} sParentPropertyName - The name of the parent property (navigationProperty/complex type)
	 * @returns {Array} Array of fields
	 */
	MetadataAnalyser.prototype._getFieldsByEntityDefinition = function(oEntityDef, sParentPropertyName) {
		var aFields = null, aProperty = null, i = 0, iLen = 0, oProperty, oField;
		if (oEntityDef) {
			aProperty = oEntityDef.property;
		}

		// Enrich the fields with necessary information as an attribute (easy access)
		if (aProperty) {
			aFields = [];
			iLen = aProperty.length;
			for (i = 0; i < iLen; i++) {
				oProperty = aProperty[i];
				if (oProperty) {
					oField = this._parseV4PropertyAnnotations(oProperty, oEntityDef, sParentPropertyName);
					this._determineHierarchyInformation(oField, oProperty);
					this._determineFilterAndSortInformation(oField, oProperty, null);// no entity set
					aFields.push(oField);
				}
			}
		}

		return aFields;
	};

	MetadataAnalyser.prototype.getPropertyContextByPath = function(sPath) {
		var aPath,
			oType,
			sParentFieldName,
			sProperty,
			oPropertyContext;

		if (sPath && this._oMetaModel) {
			// Split the property path and
			aPath = sPath.split("/");
			// The type could either be an entity type or a complex type
			oType = this._oMetaModel.getODataEntityType(aPath[0]) || this._oMetaModel.getODataComplexType(aPath[0]);
			sParentFieldName = aPath[1];
			// Get the property path from the type
			sProperty = this._oMetaModel.getODataProperty(oType, sParentFieldName, true);
			if (sProperty) {
				// create property context from its path
				oPropertyContext = this._oMetaModel.createBindingContext(sProperty);
			}
		}

		return oPropertyContext;
	};

	/**
	 * DO NOT USE: This method is mainly only needed to support sap:display-format="Date" which is not automatically converted to V4.<br>
	 * Gets the display format for a field.
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {string|undefined} The display format if exists, otherwise <code>undefined</code>
	 */
	MetadataAnalyser.getDisplayFormat = function(oProperty) {
		var sDisplayFormat = oProperty["sap:display-format"];

		if (sDisplayFormat) {
			return sDisplayFormat;
		}
	};

	/**
	 * This method is used to check whether a property is a calendar date
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {boolean} <code>true</code> if the property has "com.sap.vocabularies.Common.v1.IsCalendarDate" annotation, <code>false</code>
	 *          else.
	 * @since 1.54
	 */
	MetadataAnalyser.isCalendarDate = function(oProperty) {
		return MetadataAnalyser.isPropertyStringType(oProperty) && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"]);
	};

	/**
	 * This method is used to check whether a property is a fiscal date
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {boolean} <code>true</code> if the property has one of the fiscal annotation types, <code>false</code> else.
	 * @since 1.75
	 */
	MetadataAnalyser.isFiscalDate = function(oProperty) {
		return FiscalMetadata.isFiscalValue(oProperty);
	};

	/**
	 * This method is used to check whether a property is a calendar date
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {boolean} <code>true</code> if the property has one of the calendar annotation types, <code>false</code> else.
	 * @since 1.116
	 */
	MetadataAnalyser.isCalendarType = function(oProperty) {
		return CalendarMetadata.isCalendarValue(oProperty);
	};

	/**
	 * Returns the property path from the <code>com.sap.vocabularies.Common.v1.Timezone</code> annotation.
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {string|undefined} Timezone property path or <code>undefined</code>
	 * @since 1.99
	 */
	MetadataAnalyser.getTimezonePropertyPath = function(oProperty) {
		// Common.Timezone annotation is only allowed for Edm.DateTimeOffset type
		if (oProperty["type"] !== "Edm.DateTimeOffset") {
			return undefined;
		}
		var oTimezoneAnnotation = oProperty["com.sap.vocabularies.Common.v1.Timezone"];

		return oTimezoneAnnotation ? oTimezoneAnnotation.Path : undefined;
	};

	MetadataAnalyser.getIsTimezoneProperty = function(oProperty) {
		// Common.IsTimezone annotation is only allowed for Edm.String type
		if (oProperty["type"] !== "Edm.String") {
			return undefined;
		}

		return oProperty["com.sap.vocabularies.Common.v1.IsTimezone"] && oProperty["com.sap.vocabularies.Common.v1.IsTimezone"].Bool !== "false";
	};

	/**
	 * This method is used to check whether a property has ValueListRelevantQualifiers annotation
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {boolean} <code>true</code> if the property has ValueListRelevantQualifiers annotation, <code>false</code> else.
	 * @protected
	 * @since 1.96
	 */
	MetadataAnalyser.hasValueListRelevantQualifiers = function(oProperty) {
		var bHasValueListRelevantQualifiers = false;

		if (oProperty && oProperty["com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers"]) {
			bHasValueListRelevantQualifiers = true;
		}

		return bHasValueListRelevantQualifiers;
	};

	/**
	 * Retrieve the aggregation role of the current property
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {string|undefined} The 'measure' or 'dimension' if the aggregation role exists, otherwise <code>undefined</code>
	 */
	MetadataAnalyser.getAggregationRole = function(oProperty) {
		if (oProperty["com.sap.vocabularies.Analytics.v1.Dimension"]) {
			return "dimension";
		}

		if (oProperty["com.sap.vocabularies.Analytics.v1.Measure"]) {
			return "measure";
		}

		return undefined;
	};

	/**
	 * Gets the display format for a link field.
	 *
	 * @param {Object} oProperty The property whose details need to be extracted
	 * @returns {string} The display format if exists, otherwise an empty string
	 */
	MetadataAnalyser.getLinkDisplayFormat = function(oProperty) {

		if (MetadataAnalyser.isEmailAddress(oProperty)) {
			return "EmailAddress";
		}

		if (MetadataAnalyser.isPhoneNumber(oProperty)) {
			return "PhoneNumber";
		}

		if (MetadataAnalyser.isURL(oProperty)) {
			return "URL";
		}

		return "";
	};

	MetadataAnalyser.getValueListMode = function(oProperty) {
		if (MetadataAnalyser.isValueListWithFixedValues(oProperty)) {
			return "fixed-values";
		}

		var sValueList = oProperty["sap:value-list"];
		if (sValueList) {
			return sValueList;
		}

		return "";
	};

	/**
	 * Returns true if the annotation marked as true
	 *
	 * @param {object} oTerm The Term annotation object
	 * @returns {boolean} <code>true</code>, if the annotation exists and is set to true
	 */
	MetadataAnalyser.isTermTrue = function(oTerm) {
		return !!oTerm && (oTerm.Bool === "true");
	};

	MetadataAnalyser.isPropertyStringType = function(oProperty) {
		return !!oProperty && (oProperty.type === "Edm.String");
	};

	/**
	 * Returns true if the annotation is not explicitly marked as false or if it is simply present
	 *
	 * @param {object} oTerm The Term annotation object
	 * @returns {boolean} <code>true</code>, if the annotation exists -or- is not false
	 */
	MetadataAnalyser.isTermDefaultTrue = function(oTerm) {
		if (oTerm) {
			return oTerm.Bool ? oTerm.Bool !== "false" : true;
		}
		return false;
	};

	/**
	 * Checks whether a value is required for <code>oProperty</code>.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>false</code>, if <code>oProperty</code> is defined and the <code>nullable</code> attribute/constrain is set to
	 *          <code>false</code>, otherwise <code>true</code>
	 * @protected
	 * @since 1.50
	 */
	MetadataAnalyser.isNullable = function(oProperty) {
		return !(oProperty && (oProperty.nullable === "false"));
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated so as not to check the scale of the UoM field.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 * <code>"com.sap.vocabularies.UI.v1.DoNotCheckScaleOfMeasuredQuantity": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.94
	 */
	MetadataAnalyser.isSkippingMeasuredQuantityCheck = function(oProperty) {
		var sTerm = "com.sap.vocabularies.UI.v1.DoNotCheckScaleOfMeasuredQuantity";
		return MetadataAnalyser.isTermTrue(oProperty[sTerm]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as a digit sequence. Intended for <code>Edm.String</code> fields that are internally
	 * stored as <code>NUMC</code> (numeric text) data type.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>"com.sap.vocabularies.Common.v1.IsDigitSequence": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.46
	 */
	MetadataAnalyser.isDigitSequence = function(oProperty) {
		return MetadataAnalyser.isPropertyStringType(oProperty) && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.Common.v1.IsDigitSequence"]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as upper case..
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>"com.sap.vocabularies.Common.v1.IsUpperCase": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.52
	 */
	MetadataAnalyser.isUpperCase = function(oProperty) {
		return MetadataAnalyser.isPropertyStringType(oProperty) && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.Common.v1.IsUpperCase"]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as an e-mail address.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>"com.sap.vocabularies.Common.v1.IsDigitSequence": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.46
	 */
	MetadataAnalyser.isEmailAddress = function(oProperty) {
		return MetadataAnalyser.isPropertyStringType(oProperty) && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.Communication.v1.IsEmailAddress"]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as a phone number.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>"com.sap.vocabularies.Common.v1.IsPhoneNumber": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.46
	 */
	MetadataAnalyser.isPhoneNumber = function(oProperty) {
		return MetadataAnalyser.isPropertyStringType(oProperty) && MetadataAnalyser.isTermDefaultTrue(oProperty["com.sap.vocabularies.Communication.v1.IsPhoneNumber"]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as a URL.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>"Org.OData.Core.V1.IsURL": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.46
	 */
	MetadataAnalyser.isURL = function(oProperty) {
		return MetadataAnalyser.isPropertyStringType(oProperty) && (MetadataAnalyser.isTermDefaultTrue(oProperty["Org.OData.Core.V1.IsURL"]) || MetadataAnalyser.isTermDefaultTrue(oProperty["Org.OData.Core.V1.IsUrl"]));
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as value list.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>com.sap.vocabularies.Common.v1.ValueList</code> annotation.
	 * @protected
	 * @since 1.46
	 */
	MetadataAnalyser.isValueList = function(oProperty) {
		var sTerm = "com.sap.vocabularies.Common.v1.ValueList";// still not lifted
		return !!(oProperty && (oProperty["sap:value-list"] || oProperty[sTerm]));
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as recommendation list.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>com.sap.vocabularies.UI.v1.RecommendationList</code> annotation.
	 * @protected
	 * @since 1.71
	 */
	MetadataAnalyser.isRecommendationList = function (oProperty) {
		return !!(oProperty && oProperty["com.sap.vocabularies.UI.v1.RecommendationList"]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated with sap:semantics="currency-code".
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>sap:semantics="currency-code"</code> annotation.
	 * @protected
	 * @since 1.117
	 */
	MetadataAnalyser.isCurrencyCode = function (oProperty) {
		return !!(oProperty && oProperty["sap:semantics"] === "currency-code");
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated with sap:semantics="unit-of-measure".
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>sap:semantics="unit-of-measure"</code> annotation.
	 * @protected
	 * @since 1.117
	 */
	MetadataAnalyser.isUnitOfMeasure = function (oProperty) {
		return !!(oProperty && oProperty["sap:semantics"] === "unit-of-measure");
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated as value list with fixed values.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>"com.sap.vocabularies.Common.v1.ValueListWithFixedValues": { "Bool" : "true" }</code> annotation.
	 * @protected
	 * @since 1.46
	 */
	MetadataAnalyser.isValueListWithFixedValues = function(oProperty) {
		var sTerm = "com.sap.vocabularies.Common.v1.ValueListWithFixedValues";
		return MetadataAnalyser.isTermTrue(oProperty[sTerm]);
	};

	/**
	 * Checks whether <code>oProperty</code> is annotated with importance.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if the OData property is annotated with the following
	 *          <code>com.sap.vocabularies.UI.v1.Importance</code> annotation.
	 * @protected
	 * @since 1.75
	 */
	MetadataAnalyser.hasImportance = function(oProperty) {
		return !!(oProperty && oProperty["com.sap.vocabularies.UI.v1.Importance"]);
	};

	/**
	 * Parses a property and extracts the relevant information for easy consumption
	 *
	 * @param {Object} oProperty - The property whose details need to be extracted
	 * @param {Object} oEntityDef - The entity definition as specified in the metadata document
	 * @param {string} sParentPropertyName - The name of the parent property (navigationProperty/complex type)
	 * @returns {Object} field
	 * @private
	 * @deprecated
	 */
	MetadataAnalyser.prototype._parseProperty = function(oProperty, oEntityDef, sParentPropertyName) {
		var oField = this._parseV4PropertyAnnotations(oProperty, oEntityDef, sParentPropertyName);
		this._determineHierarchyInformation(oField, oProperty);
		this._determineFilterAndSortInformation(oField, oProperty, null);

		return oField;
	};

	/**
	 * Parse the V4 part of the property annotations
	 *
	 * @param {Object} oProperty - The property whose details need to be extracted
	 * @param {Object} oEntityDef - The entity definition as specified in the metadata document
	 * @param {string} sParentPropertyName - The name of the parent property (navigationProperty/complex type)
	 * @returns {Object} field
	 * @private
	 * @since 1.52
	 */
	MetadataAnalyser.prototype._parseV4PropertyAnnotations = function(oProperty, oEntityDef, sParentPropertyName) {
		var oField = Object.assign({}, oProperty);

		var oResult = oProperty["com.sap.vocabularies.Common.v1.Label"];
		if (oResult) {
			oField.fieldLabel = oResult.String;
		}

		oResult = oProperty["com.sap.vocabularies.Common.v1.QuickInfo"];
		if (oResult) {
			oField.quickInfo = oResult.String;
		}
		// display terms
		oField.displayFormat = MetadataAnalyser.getDisplayFormat(oProperty);
		oField.isDigitSequence = MetadataAnalyser.isDigitSequence(oProperty);
		oField.isURL = MetadataAnalyser.isURL(oProperty);
		oField.isEmailAddress = MetadataAnalyser.isEmailAddress(oProperty);
		oField.isPhoneNumber = MetadataAnalyser.isPhoneNumber(oProperty);
		oField.isUpperCase = MetadataAnalyser.isUpperCase(oProperty);
		oField.isCalendarDate = MetadataAnalyser.isCalendarDate(oProperty);
		oField.isCalendarType = MetadataAnalyser.isCalendarType(oProperty);
		oField.calendarType = CalendarMetadata.getCalendarAnnotationType(oProperty);
		oField.isFiscalDate = MetadataAnalyser.isFiscalDate(oProperty);
		oField.timezone = MetadataAnalyser.getTimezonePropertyPath(oProperty);
		oField.isTimezone = MetadataAnalyser.getIsTimezoneProperty(oProperty);

		oField.aggregationRole = MetadataAnalyser.getAggregationRole(oProperty);

		oResult = oProperty["Org.OData.Measures.V1.ISOCurrency"];
		if (oResult) {
			oField.isCurrencyField = true;
			oField.isMeasureField = true;
			oField.unit = oResult.Path;
		}
		oResult = oProperty["Org.OData.Measures.V1.Unit"];
		if (oResult) {
			oField.isMeasureField = true;
			oField.unit = oResult.Path;
		}
		oResult = oProperty["com.sap.vocabularies.Common.v1.Text"];
		if (oResult) {
			oField.description = oResult.Path;
			oField.displayBehaviour = this.getTextArrangementValue(oResult);
		} else if (oProperty ["com.sap.vocabularies.UI.v1.TextArrangement"]) {
			oField.displayBehaviour = this.getTextArrangementValue(oProperty);
		}


		// Set whether field is an Image URL (twice - capital wording and CamelCase)
		// com.sap.vocabularies.UI.v1.IsImageURL is the expected one
		oResult = oProperty["com.sap.vocabularies.UI.v1.IsImageURL"] || oProperty["com.sap.vocabularies.UI.v1.IsImageUrl"];
		oField.isImageURL = MetadataAnalyser.isTermDefaultTrue(oResult);

		oField.entityName = oEntityDef.name;
		oField.parentPropertyName = sParentPropertyName;
		oField.fullName = this._getFullyQualifiedNameForField(oProperty.name, oEntityDef);

		// Set the visible attribute on the field
		oResult = oProperty["com.sap.vocabularies.Common.v1.FieldControl"];
		oField.visible = !(oResult && ((oResult.EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden") || (oResult.EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Inapplicable")));

		// hidden is mapped to visibility
		oField.visible = oField.visible && !MetadataAnalyser.isHidden(oProperty);
		// hiddenFilter is only relavant when field is visible
		oField.hiddenFilter = MetadataAnalyser.isHiddenFilter(oProperty);
		// defaultValue for parameters (and create scenarios -not yet relevant)
		if (oProperty["defaultValue"] !== undefined) {
			oField.defaultPropertyValue = oProperty["defaultValue"];
		}

		// defaultValue for filters
		oResult = oProperty["com.sap.vocabularies.Common.v1.FilterDefaultValue"];
		if (oResult) {
			oField.defaultFilterValue = this._getDefaultValues(oProperty.type, oResult, oProperty); // oResult.String;
		}

		return oField;
	};

	/**
	 * Determines the hierarchy information for the corresponding field
	 *
	 * @param {object} oField - The field to add information
	 * @param {Object} oProperty - The property instance from ODataMetaModel
	 * @private
	 */
	MetadataAnalyser.prototype._determineHierarchyInformation = function(oField, oProperty) {
		var oHierarchy = {
			field: null,
			type: null
		};

		if (oProperty["sap:hierarchy-node-for"] != null) {
			oHierarchy.field = oProperty["sap:hierarchy-node-for"];
			oHierarchy.type = MetadataAnalyser.hierarchyType.nodeFor;
		}

		if (oProperty["sap:hierarchy-node-external-key-for"] != null) {
			oHierarchy.field = oProperty["sap:hierarchy-node-external-key-for"];
			oHierarchy.type = MetadataAnalyser.hierarchyType.nodeExternalKeyFor;
		}

		if (oProperty["sap:hierarchy-parent-node-for"] != null) {
			oHierarchy.field = oProperty["sap:hierarchy-parent-node-for"];
			oHierarchy.type = MetadataAnalyser.hierarchyType.parentNodeFor;
		}

		if (oProperty["sap:hierarchy-level-for"] != null) {
			oHierarchy.field = oProperty["sap:hierarchy-level-for"];
			oHierarchy.type = MetadataAnalyser.hierarchyType.levelFor;
		}

		if (oProperty["sap:hierarchy-drill-state-for"] != null) {
			oHierarchy.field = oProperty["sap:hierarchy-drill-state-for"];
			oHierarchy.type = MetadataAnalyser.hierarchyType.drillStateFor;
		}

		if (oProperty["sap:hierarchy-node-descendant-count-for"] != null) {
			oHierarchy.field = oProperty["sap:hierarchy-node-descendant-count-for"];
			oHierarchy.type = MetadataAnalyser.hierarchyType.nodeDescendantCountFor;
		}

		if (oHierarchy.type != null) {
			oField.hierarchy = oHierarchy;
		}
	};

	/*************************************************************************************************************************************************
	 * Determine the filter and sort information for the property
	 *
	 * @param {object} oField - The field to add information
	 * @param {Object} oProperty - The property instance from ODataMetaModel
	 * @param {Object} oEntitySet - The entity set from the metadata document
	 * @private
	 */
	MetadataAnalyser.prototype._determineFilterAndSortInformation = function(oField, oProperty, oEntitySet) {
		if (oEntitySet) {
			this._enrichEntitySetMetadata([
				oField
			], oEntitySet);
		}

		// Fallback to V2 annotations for the default values
		if (oField.filterable == undefined || oField.filterable) {
			oField.filterable = oProperty["sap:filterable"] !== "false";
		}

		if (!oField.filterRestriction && oProperty["sap:filter-restriction"]) {
			oField.filterRestriction = oProperty["sap:filter-restriction"];
		}

		if (!oField.requiredFilterField) {
			oField.requiredFilterField = oProperty["sap:required-in-filter"] === "true";
		}

		if (oField.sortable == undefined || oField.sortable) {
			oField.sortable = oProperty["sap:sortable"] !== "false";
		}
	};

	MetadataAnalyser.prototype._getDefaultValues = function(sType, oResult, oProperty) {
		var vValue = null, sDefaultValueType = ODataType.getDefaultValueTypeName(sType);

		if (oResult[sDefaultValueType]) {
			vValue = oResult[sDefaultValueType];
		} else {
			Log.error("default value for " + oProperty.name + " expected through the property " + sDefaultValueType);
		}

		return vValue;

	};

	/**
	 * Extract the property at the specified navigationProperty path and entitySet name
	 *
	 * @param {string} sPropertyPath - The property path (via a navigation property) E.g. toProduct/ProductText
	 * @param {string} sEntitySetName - The entity name as specified in the metadata document
	 * @returns {Object} The extracted and parsed field (ODataProperty)
	 * @public
	 */
	MetadataAnalyser.prototype.extractNavigationPropertyField = function(sPropertyPath, sEntitySetName) {
		var sEntitySetPath, oMetaContext, oODataProperty, aPropertyPath, sPropertyName, sNavigationProperty, oEntityDef, oField = null;
		if (sEntitySetName && sPropertyPath) {
			sEntitySetPath = "/" + sEntitySetName + "/";
			aPropertyPath = sPropertyPath.split("/");
			sPropertyName = aPropertyPath.pop();
			sNavigationProperty = aPropertyPath.join("/");
			if (sNavigationProperty && sPropertyName) {
				oMetaContext = this._oMetaModel.getMetaContext(sEntitySetPath + sNavigationProperty);
				if (oMetaContext) {
					oEntityDef = this._oMetaModel.getProperty(oMetaContext.getPath());
				}
			}
			if (oEntityDef) {
				oODataProperty = this._oMetaModel.getODataProperty(oEntityDef, sPropertyName);
			}
			if (oODataProperty) {
				oField = this._parseV4PropertyAnnotations(oODataProperty, oEntityDef, sNavigationProperty);

				oField.name = sPropertyPath;
				var oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySetName);
				this._determineFilterAndSortInformation(oField, oODataProperty, oEntitySet);
				oField.name = oODataProperty.name;
			}
		}
		return oField;
	};

	/**
	 * Gets a an Array of the names of all possible filterable fields for the specified entity type
	 *
	 * @param {string} sEntityTypeName - The entity type name as specified in the metadata document
	 * @returns {Array} Array of names of overall filterable fields
	 * @internal
	 * @deprecated Since 1.40.
	 */
	MetadataAnalyser.prototype.getAllFilterableFieldNamesByEntityTypeName = function(sEntityTypeName) {
		var aGroup, i, groupLength, j, fieldLength, aResult, oGroup;

		aResult = [];
		aGroup = this.getAllFilterableFieldsByEntityTypeName(sEntityTypeName);
		if (aGroup && aGroup.length) {
			groupLength = aGroup.length;
			for (i = 0; i < groupLength; i++) {
				oGroup = aGroup[i];
				if (oGroup.fields && oGroup.fields.length) {
					fieldLength = oGroup.fields.length;
					for (j = 0; j < fieldLength; j++) {
						aResult.push(oGroup.fields[j].name);
					}
				}
			}
		}
		return aResult;
	};

	/**
	 * Takes an array of separate navigation properties and maps the navigation association with the separate properties
	 * @param {Array} aConsiderNavProperties array of separate navigation properties like ["to_CompanyCode/Delivery", "to_CompanyCode/City"]
	 * @returns {Object} an object with the mapped navigation properties
	 * @private
	 */
	MetadataAnalyser.prototype._mapSeparateNavigationProperties = function(aConsiderNavProperties) {
		var mSeparateNavProperties = {};

		aConsiderNavProperties.forEach(function(sProperty){
			var aPropertyPaths = sProperty.split("/"),
				sNavEntity = aPropertyPaths.shift(),
				sNavPropertyName = aPropertyPaths.shift();

				if (!Array.isArray(mSeparateNavProperties[sNavEntity])) {
					mSeparateNavProperties[sNavEntity] = [];
				}
				if (sNavPropertyName) {
					mSeparateNavProperties[sNavEntity].push(sNavPropertyName);
				}
		});

		return mSeparateNavProperties;
	};

	/**
	 * Gets a collection of all possible filterable fields for the specified entity type or entity set
	 *
	 * @param {string} sEntity - The entity type name or entity set name as specified in the metadata document
	 * @param {boolean} bIsEntitySet - true when entity set name is passed
	 * @param {boolean} bIgnoreAnalyticalParameters if true the entity types with <code>sap:semantic = 'parameter'</code> will be ignored
	 * @param {Array} aConsiderNavProperties List of allowed property names. If <code>null</code> all properties are taken into account
	 * @returns {Array} Array of overall filterable fields
	 * @private
	 */
	MetadataAnalyser.prototype._getAllFilterableFieldsByEntity = function(sEntity, bIsEntitySet, bIgnoreAnalyticalParameters, aConsiderNavProperties) {
		var aFilterGroups = [],
			oEntityDef,
			oEntitySet,
			mAssociations,
			sNavigationProperty,
			oResult,
			oSubEntityDef,
			oSubEntitySet,
			sSubEntityType,
			mSeparateNavProperties = {},
			aFieldsFromEntityDef,
			bSeparateNavProperties = aConsiderNavProperties && aConsiderNavProperties.some((sNavProperty) => sNavProperty.includes("/"));

		if (bSeparateNavProperties) {
			mSeparateNavProperties = this._mapSeparateNavigationProperties(aConsiderNavProperties);
		}

		if (!this._oMetaModel || !sEntity) {
			return undefined;
		}

		if (bIsEntitySet) {
			oEntitySet = this._oMetaModel.getODataEntitySet(sEntity);
			if (oEntitySet) {
				oEntityDef = this._getEntityDefinition(oEntitySet.entityType);
			}
		} else {
			oEntityDef = this._getEntityDefinition(sEntity);
		}

		if (oEntityDef) {
			// filterable fields from the main entity
			aFilterGroups.push(this._getFilterableFieldsFromEntityDefinition(oEntityDef, undefined, oEntitySet));

			// filterable fields from associations which have 0..1 or 1 cardinality
			mAssociations = this._getFilterableAssociations(oEntityDef, oEntitySet);
			for (sNavigationProperty in mAssociations) {

				if (!aConsiderNavProperties
					|| (aConsiderNavProperties.indexOf(sNavigationProperty) > -1)
					|| (bSeparateNavProperties && Object.keys(mSeparateNavProperties).includes(sNavigationProperty))) {

					sSubEntityType = mAssociations[sNavigationProperty];
					if (bIsEntitySet) {
						oResult = this._oMetaModel.getODataAssociationSetEnd(oEntityDef, sNavigationProperty);
						if (oResult.entitySet) {
							oSubEntitySet = this._oMetaModel.getODataEntitySet(oResult.entitySet);
						}
					}
					oSubEntityDef = this._getEntityDefinition(sSubEntityType);
					// Entity definition can be null when entities are loaded lazily in the metadata (e.g. ValueList)
					if (oSubEntityDef) {
						// analogon??
						if (bIgnoreAnalyticalParameters && (oSubEntityDef["sap:semantics"] === "parameters")) {
							continue;
						}

						if (bSeparateNavProperties) {
							aFieldsFromEntityDef = this._getFilterableFieldsFromEntityDefinition(oSubEntityDef, sNavigationProperty, oSubEntitySet);
							const sNavProperty = sNavigationProperty;
							if (mSeparateNavProperties[sNavProperty] && mSeparateNavProperties[sNavProperty].length > 0) {
								aFieldsFromEntityDef.fields = aFieldsFromEntityDef.fields.filter(function(oField) {
									return mSeparateNavProperties[sNavProperty].includes(oField.name);
								});
							}
							aFilterGroups.push(aFieldsFromEntityDef);
						} else {
							aFilterGroups.push(this._getFilterableFieldsFromEntityDefinition(oSubEntityDef, sNavigationProperty, oSubEntitySet));
						}
					}
				}
			}
		}
		return aFilterGroups;
	};

	/**
	 * Gets a collection of all possible filterable fields for the specified entity type or entity set
	 * where filterable fields are from associations with all endpoints (0..1, 1, *)
	 *
	 * @param {string} sEntity - The entity type name or entity set name as specified in the metadata document
	 * @param {boolean} bIsEntitySet - true when entity set name is passed
	 * @param {boolean} bIgnoreAnalyticalParameters if true the entity types with <code>sap:semantic = 'parameter'</code> will be ignored
	 * @param {Array} aConsiderNavProperties List of allowed property names. If <code>null</code> all properties are taken into account
	 * @returns {Array} Array of overall filterable fields
	 * @private
	 * @ui5-restricted sap.ui.comp.personalization.FilterController
	 */
	MetadataAnalyser.prototype._getAllFilterableFieldsByEntityForAllEndpoints = function(sEntity, bIsEntitySet, bIgnoreAnalyticalParameters, aConsiderNavProperties) {
		var aFilterGroups = [], oEntityDef, oEntitySet, mAssociations, sNavigationProperty, oResult, oSubEntityDef, oSubEntitySet, sSubEntityType;
		if (!this._oMetaModel || !sEntity) {
			return undefined;
		}

		if (bIsEntitySet) {
			oEntitySet = this._oMetaModel.getODataEntitySet(sEntity);
			if (oEntitySet) {
				oEntityDef = this._getEntityDefinition(oEntitySet.entityType);
			}
		} else {
			oEntityDef = this._getEntityDefinition(sEntity);
		}

		if (oEntityDef) {
			// filterable fields from the main entity
			aFilterGroups.push(this._getFilterableFieldsFromEntityDefinition(oEntityDef, undefined, oEntitySet));

			// filterable fields from associations with all endpoints
			mAssociations = this._getAssociations(oEntityDef, oEntitySet, true, true); // this._getFilterableAssociations(oEntityDef, oEntitySet);
			for (sNavigationProperty in mAssociations) {

				if (!aConsiderNavProperties || (aConsiderNavProperties.indexOf(sNavigationProperty) > -1)) {

					sSubEntityType = mAssociations[sNavigationProperty];
					if (bIsEntitySet) {
						oResult = this._oMetaModel.getODataAssociationSetEnd(oEntityDef, sNavigationProperty);
						if (oResult.entitySet) {
							oSubEntitySet = this._oMetaModel.getODataEntitySet(oResult.entitySet);
						}
					}
					oSubEntityDef = this._getEntityDefinition(sSubEntityType);
					// Entity definition can be null when entities are loaded lazily in the metadata (e.g. ValueList)
					if (oSubEntityDef) {
						// analogon??
						if (bIgnoreAnalyticalParameters && (oSubEntityDef["sap:semantics"] === "parameters")) {
							continue;
						}

						aFilterGroups.push(this._getFilterableFieldsFromEntityDefinition(oSubEntityDef, sNavigationProperty, oSubEntitySet));
					}
				}
			}
		}
		return aFilterGroups;
	};

	/**
	 * Gets a collection of all possible filterable fields for the specified entity name
	 *
	 * @param {string} sEntitySetName - The entity name as specified in the metadata document
	 * @param {boolean} bIgnoreAnalyticalParameters if <code>true</code> the entity types, referenced by the navigation properties with
	 *        <code>sap:semantic = 'parameter'</code> will be ignored
	 * @param {Array} aConsiderNavProperties List of allowed property names. If <code>null</code> all properties are taken into account
	 * @returns {Array} Array of overall filterable fields
	 * @public
	 */
	MetadataAnalyser.prototype.getAllFilterableFieldsByEntitySetName = function(sEntitySetName, bIgnoreAnalyticalParameters, aConsiderNavProperties) {
		if (!this._oMetaModel) {
			return undefined;
		}

		return this._getAllFilterableFieldsByEntity(sEntitySetName, true, bIgnoreAnalyticalParameters, aConsiderNavProperties);
	};

	/**
	 * Gets a collection of all possible filterable fields for the specified entity type
	 *
	 * @param {string} sEntityTypeName - The entity type name as specified in the metadata document
	 * @returns {Array} Array of overall filterable fields
	 * @public
	 */
	MetadataAnalyser.prototype.getAllFilterableFieldsByEntityTypeName = function(sEntityTypeName) {
		if (!this._oMetaModel) {
			return undefined;
		}

		return this._getAllFilterableFieldsByEntity(sEntityTypeName);
	};

	/**
	 * Gets an Object containing collection of filterable fields that are directly under the specified entity type
	 *
	 * @param {Object} oEntityDef - The entity type definition from the metadata document
	 * @param {string} sParentPropertyName - The name of the parent property (navigationProperty/complex type)
	 * @param {Object} oEntitySet - The relevant entity set from which metadata should be enriched on the entity fields
	 * @returns {Object} Object containing array of filterable fields
	 * @private
	 */
	MetadataAnalyser.prototype._getFilterableFieldsFromEntityDefinition = function(oEntityDef, sParentPropertyName, oEntitySet) {
		var oFilterData = {}, aFields = [], aHiddenFields = [], aProperties = null, oProp, i, iLen, oProperty = null;
		if (!this._oMetaModel || !oEntityDef) {
			return undefined;
		}

		if (!oEntitySet) {
			Log.error("mandatory parameter 'oEntitySet' not set or null.");

		} else {

			// Set the name and label from entity into the field's group
			oProp = oEntityDef["com.sap.vocabularies.Common.v1.Label"];
			if (oProp) {
				oFilterData.groupLabel = oProp.String;
			}
			oFilterData.groupEntitySetName = oEntitySet.name;
			oFilterData.groupEntityTypeName = oEntityDef.name;
			oFilterData.groupName = sParentPropertyName;

			aProperties = this._getFieldsByEntityDefinition(oEntityDef, sParentPropertyName);
			// If a relevant entitySet is provided - enrich the field metadata
			if (oEntitySet) {
				this._enrichEntitySetMetadata(aProperties, oEntitySet);
			}
			iLen = aProperties.length;
			// Extract only visible and filterable fields from all fields!
			for (i = 0; i < iLen; i++) {
				oProperty = aProperties[i];
				if (oProperty.filterable) {
					if (oProperty.visible) {
						oProperty.groupEntitySet = oFilterData.groupEntitySetName;
						oProperty.groupEntityType = oFilterData.groupEntityTypeName;
						aFields.push(oProperty);
					} else {
						aHiddenFields.push(oProperty);
					}
				}
			}
		}

		oFilterData.fields = aFields;
		oFilterData.hiddenFields = aHiddenFields;
		return oFilterData;
	};

	/**
	 * Returns the fully qualified name of a field which is e.g. "com.sap.GL.ZAF.GL_ACCOUNT/CompanyCode". Schema namespace, entity type name and field
	 * name.
	 *
	 * @param {string} sFieldName - the name of the field/property
	 * @param {Object} oEntityType - the entity Type under which the field/property is present
	 * @returns {string} - the fully qualified name
	 * @private
	 */
	MetadataAnalyser.prototype._getFullyQualifiedNameForField = function(sFieldName, oEntityType) {
		var sNamespace, sEntityTypeName, sResult = sFieldName;
		if (oEntityType) {
			sNamespace = oEntityType.namespace;
			sEntityTypeName = oEntityType.name;
		}
		if (sNamespace && sEntityTypeName) {
			sResult = sNamespace + "." + sEntityTypeName + "/" + sFieldName;
		}
		return sResult;
	};

	/**
	 * @param {string} sFullyQualifiedFieldName Fully qualified name
	 * @returns {string} The field name without name space and without entity
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldNameByFullyQualifiedFieldName = function(sFullyQualifiedFieldName) {
		var sResult, nPos;

		sResult = this.removeNamespace(sFullyQualifiedFieldName);
		nPos = sResult.indexOf("/");
		sResult = sResult.substring(nPos + 1);
		return sResult;
	};

	/**
	 * Gets a collection of filterable associations under the specified entity type
	 *
	 * @param {Object} oEntityDef - The entity type definition from the metadata document
	 * @param {Object} oEntitySet - The relevant entity set for which filterable associations have to be determined
	 * @returns {Object} Map of filterable associations
	 * @private
	 */
	MetadataAnalyser.prototype._getFilterableAssociations = function(oEntityDef, oEntitySet) {
		return this._getAssociations(oEntityDef, oEntitySet, true, false);
	};

	/**
	 * Gets a collection of filterable associations under the specified entity type
	 *
	 * @param {Object} oEntityDef - The entity type definition from the metadata document
	 * @param {Object} oEntitySet - The relevant entity set for which filterable associations have to be determined
	 * @param {boolean} bCheckOnlyFilterable - if set to <code>true</code> only filterable non-hidden navigation properties will be considered
	 * @param {boolean} bAllCardinality - if set to <code>true</code> all end points will be considered, otherwise only with cardinality 1 or 0..1
	 * @returns {Object} Map of associations
	 * @private
	 */
	MetadataAnalyser.prototype._getAssociations = function(oEntityDef, oEntitySet, bCheckOnlyFilterable, bAllCardinality) {
		var mFilterableAssociations = {}, aNavigationProperties = null, oNavigationProperty = null, i, iLen = 0, oEndRole = null;
		if (!this._oMetaModel || !oEntityDef) {
			return undefined;
		}
		aNavigationProperties = oEntityDef.navigationProperty;
		if (aNavigationProperties && aNavigationProperties.length) {
			iLen = aNavigationProperties.length;
			for (i = 0; i < iLen; i++) {
				oNavigationProperty = aNavigationProperties[i];
				// if the navigation property is explicitly marked as not filterable; skip it
				// also skip it, if it is marked as HiddenFilter
				if (bCheckOnlyFilterable) {
					if (!this._isFilterable(oNavigationProperty, oEntitySet) || MetadataAnalyser.isHiddenFilter(oNavigationProperty)) {
						continue;
					}
				}
				// Get the End role of the navigation property
				oEndRole = this._oMetaModel.getODataAssociationEnd(oEntityDef, oNavigationProperty.name);
				if (!oEndRole || oEndRole.type === (oEntityDef.namespace + "." + oEntityDef.name)) {
					continue;
				}
				// check if the end role has cardinality 0..1 or 1
				if (bAllCardinality || oEndRole.multiplicity === "1" || oEndRole.multiplicity === "0..1") {
					// Only add filterable entities, if they were not already added
					if (mFilterableAssociations[oNavigationProperty.name] === undefined) {
						mFilterableAssociations[oNavigationProperty.name] = oEndRole.type;
					}
				}
			}
		}
		return mFilterableAssociations;
	};

	MetadataAnalyser.prototype.getParametersByEntitySetName = function(sEntitySet) {
		var oResult, mAssociations, mSubAssociations, sNavigationProperty, sSubNavigationProperty, sSubEntityType, sSubSubEntityType, oAssocEnd, oEntityDef, oSubEntityDef, oEntitySet;

		oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySet);
		if (oEntitySet) {
			oEntityDef = this._getEntityDefinition(oEntitySet.entityType);
		}

		mAssociations = this._getAssociations(oEntityDef, null, false, false);
		for (sNavigationProperty in mAssociations) {
			sSubEntityType = mAssociations[sNavigationProperty];

			oAssocEnd = this._oMetaModel.getODataAssociationSetEnd(oEntityDef, sNavigationProperty);
			if (oAssocEnd.entitySet) {
				oSubEntityDef = this._getEntityDefinition(sSubEntityType);
				if (oSubEntityDef) {
					if ((oSubEntityDef["sap:semantics"] === "parameters") && oSubEntityDef.key) {
						oResult = {
							entitySetName: oAssocEnd.entitySet,
							parameters: [],
							navPropertyName: ""
						};
						for (var i = 0; i < oSubEntityDef.key.propertyRef.length; i++) {
							oResult.parameters.push(oSubEntityDef.key.propertyRef[i].name);
						}

						mSubAssociations = this._getAssociations(oSubEntityDef, null, false, true);
						for (sSubNavigationProperty in mSubAssociations) {
							sSubSubEntityType = mSubAssociations[sSubNavigationProperty];
							if (sSubSubEntityType === oEntitySet.entityType) {
								oResult.navPropertyName = sSubNavigationProperty;
								break;
							}
						}

						return oResult;
					}
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves the ValueList Annotation lazily for the specified property/target
	 *
	 * @param {string} sPath the full path of the property/target (including the namespace)
	 * @param {string} [sBindingContextPath] a path to a model context against which
	 * 	the annotation <code>com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers</code> will be evaluated to get a list of relevant qualifiers
	 * @returns {Promise} a Promise that would be resolved once the ValueList annotation is loaded -or- rejected if specified property path is
	 *          incorrect or value list could not be resolved
	 * @public
	 */
	MetadataAnalyser.prototype.getValueListAnnotationLazy = function(sPath, sBindingContextPath) {
		var	oProperty,
			oValueListsPromise,
			oBindingContext,
			oPromise,
			mAnnotation = {
				additionalAnnotations: [],
				additionalAnnotationsWithPVQualifier: []
			}, oResolvedAnnotation, sParentFieldName, aPath, oPropertyContext, sQualifier;

		oPromise = new Promise(function(fResolve, fReject) {
			if (sPath && this._oMetaModel) {
				oPropertyContext = this.getPropertyContextByPath(sPath);
				// Split the property path and
				aPath = sPath.split("/");
				// The type could either be an entity type or a complex type
				sParentFieldName = aPath[1];
				// Get the property path from the type
				if (oPropertyContext) {
					oProperty = oPropertyContext.getObject && oPropertyContext.getObject();
					if (sBindingContextPath && MetadataAnalyser.hasValueListRelevantQualifiers(oProperty)) {
						oBindingContext = this.oModel.getContext(sBindingContextPath);
						oValueListsPromise = this.getODataRelevantValueLists(oPropertyContext, oBindingContext);
					} else {
						oValueListsPromise = this._oMetaModel.getODataValueLists(oPropertyContext);
					}

					oValueListsPromise.then(function(mValueList) {
						for (sQualifier in mValueList) {
							oResolvedAnnotation = {
								annotation: mValueList[sQualifier]
							};
							// TODO: to be removed in the next release! - Ignore ValueList with PresentationVariantQualifier
							if (oResolvedAnnotation.annotation) {
								this._enrichValueHelpAnnotation(oResolvedAnnotation, sParentFieldName);
								if (!oResolvedAnnotation.annotation["PresentationVariantQualifier"]) {
									// Check if there is no qualifier --> the default/primaryValueListAnnotation
									if (!sQualifier) {
										mAnnotation.primaryValueListAnnotation = oResolvedAnnotation;
									} else {
										mAnnotation.additionalAnnotations.push(oResolvedAnnotation);
									}
									// Set the qualifier on the resolved annotation
									oResolvedAnnotation.qualifier = sQualifier;
								} else {
									if (!sQualifier) {
										mAnnotation.primaryValueListAnnotationWithPVQualifier = oResolvedAnnotation;
									} else {
										oResolvedAnnotation.qualifier = sQualifier;
										mAnnotation.additionalAnnotationsWithPVQualifier.push(oResolvedAnnotation);
									}
								}
							}
						}
						if (!mAnnotation.primaryValueListAnnotation) {
							mAnnotation.primaryValueListAnnotation = mAnnotation.additionalAnnotations.shift();
						}
						fResolve(mAnnotation);
					}.bind(this), fReject);
					return;
				}
			}
			fReject();
		}.bind(this));
		return oPromise;
	};
	/**
	 * Retrieves the ValueList Annotation from function import
	 *
	 * @param {object} oFunctionImport A function import object.
	 * @param {object} oFunctionImportProperty A function import property object.
	 * @param {string} sMainPath The fully qualified URL main path name of the property
	 * @param {string} [sMainBindingContextPath] a main path to a model context against which
	 * @returns {Promise} a Promise that would be resolved once the ValueList annotation is loaded -or- rejected if specified property path is
	 *          incorrect or value list could not be resolved
	 * @private
	 */
	MetadataAnalyser.prototype._getFunctionImportValueListAnnotationLazy = function(oFunctionImport, oFunctionImportProperty, sMainPath, sMainBindingContextPath) {
		var oValueList = oFunctionImportProperty["com.sap.vocabularies.Common.v1.ValueList"];
		if (oValueList) {
			return this.getValueListAnnotationFromFunctionImport(
				{"": oValueList},
				oFunctionImportProperty.name);
		}

			return this._loadValueListAnnotationForFunctionImport(oFunctionImport.name, oFunctionImportProperty.name, sMainPath, sMainBindingContextPath);
	};

	/**
	 * Retrieves the ValueList Annotation from function import
	 *
	 * @param {Map} mValueList A data object which contains the value help info in a format used by the ODataModel
	 * @param {string} sPath the path of the property/target
	 * 	the annotation <code>com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers</code> will be evaluated to get a list of relevant qualifiers
	 * @returns {Promise} a Promise that would be resolved once the ValueList annotation is loaded -or- rejected if specified property path is
	 *          incorrect or value list could not be resolved
	 * @private
	 */
	MetadataAnalyser.prototype.getValueListAnnotationFromFunctionImport = function(mValueList, sPath) {
		var oPromise,
			mPrimaryValueList,
			mAnnotation,
			oValueList;
		oPromise = new Promise(function(fResolve, fReject) {
			if (mValueList) {
				oValueList = this.getValueListAnnotationForFunctionImport(mValueList, sPath);
				if (!oValueList?.primaryValueListAnnotation) {
					fReject();
				}

				mPrimaryValueList = oValueList.primaryValueListAnnotation;

				mAnnotation = this.formatValueListFunctionImport(mPrimaryValueList, sPath);
				return fResolve(mAnnotation);
			}
			fReject();
		}.bind(this));
		return oPromise;
	};

	/**
	 * Retrieves the ValueList Annotation for the specified property/target
	 *
	 * @param {string} sFunctionImportName the function import name.
	 * @param {string} sFunctionImportPropertyName the property/target name.
	 * @param {string} sMainPath The fully qualified URL main path name of the property
	 * @param {string} [sMainBindingContextPath] a main path to a model context against which
	 * @returns {Object} a Map of resolved ValueHelpList (if any) annotations
	 * @private
	 */
	MetadataAnalyser.prototype._loadValueListAnnotationForFunctionImport = function(sFunctionImportName, sParameterName, sMainPath, sMainBindingContextPath) {
		var mAnnotation = {
				additionalAnnotations: []
			}, sPath,
			oContext = this._oMetaModel?.getFunctionImportParameterContext(sFunctionImportName, sParameterName);
		if (oContext){
			sPath = oContext.getPath();
		}

		var oPromise = new Promise(function(fResolve, fReject) {
			if (sPath && this._oMetaModel) {
				var oValueListsFunctionImportPromise = this._oMetaModel.getODataValueLists(oContext);
				oValueListsFunctionImportPromise.then(function(mValueList) {
					mAnnotation = this.formatValueListFunctionImport(mValueList, sParameterName);
					fResolve(mAnnotation);
				}.bind(this)).catch(function(error){
					Log.warning('_loadValueListAnnotationForFunctionImport oValueListsFunctionImportPromise', error);
					var oValueListMainSet = this.getValueListAnnotationLazy(sMainPath, sMainBindingContextPath);
					oValueListMainSet.then(function(mAnnotation){
						fResolve(mAnnotation);
					});
				}.bind(this),fReject);
				return;
			}
			fReject();
		}.bind(this));

		return oPromise;
	};

	/**
	 * Formats a ValueList Annotation object in the format
	 *
	 * @param {Map} mValueList A data object which contains the value help info in a format used by the ODataModel
	 * @param {string} sPath the path of the property/target
	 * @returns {Map} the formatted annotation
	 * @private
	 */
	MetadataAnalyser.prototype.formatValueListFunctionImport = function(mValueList, sPath) {
		var	mAnnotation = {
				additionalAnnotations: [],
				additionalAnnotationsWithPVQualifier: []
			}, oResolvedAnnotation, sQualifier;

						for (sQualifier in mValueList) {
							oResolvedAnnotation = {
								annotation: mValueList[sQualifier]
							};
							if (oResolvedAnnotation.annotation) {
								this._enrichValueHelpAnnotation(oResolvedAnnotation, sPath);
								if (!oResolvedAnnotation.annotation["PresentationVariantQualifier"]) {
									// Check if there is no qualifier --> the default/primaryValueListAnnotation
									if (!sQualifier) {
										mAnnotation.primaryValueListAnnotation = oResolvedAnnotation;
									} else {
										mAnnotation.additionalAnnotations.push(oResolvedAnnotation);
									}
									// Set the qualifier on the resolved annotation
									oResolvedAnnotation.qualifier = sQualifier;
								} else {
									if (!sQualifier) {
										mAnnotation.primaryValueListAnnotationWithPVQualifier = oResolvedAnnotation;
									} else {
										oResolvedAnnotation.qualifier = sQualifier;
										mAnnotation.additionalAnnotationsWithPVQualifier.push(oResolvedAnnotation);
									}
								}
							}
						}
						if (!mAnnotation.primaryValueListAnnotation) {
							mAnnotation.primaryValueListAnnotation = mAnnotation.additionalAnnotations.shift();
						}
					return mAnnotation;
	};

	/**
	 * Returns a <code>Promise</code> which is resolved with a map representing the
	 * <code>com.sap.vocabularies.Common.v1.ValueList</code> annotations of the given property or
	 * rejected with an error.
	 * The key in the map provided on successful resolution is the qualifier of the annotation or
	 * the empty string if no qualifier is defined. The value in the map is the JSON object for
	 * the annotation. The map is empty if the property has no
	 * <code>com.sap.vocabularies.Common.v1.ValueList</code> annotations.
	 *
	 * @param {sap.ui.model.Context} oPropertyContext
	 *   a model context for a structural property of an entity type or a complex type, as
	 *   returned by {@link #getMetaContext getMetaContext}
	 * @param {sap.ui.model.odata.v2.Context} oBindingContext
	 *  a model context that points to a data against which
	 * 	the annotation <code>com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers</code> gets evaluated to get a list of relevant qualifiers
	 * @returns {Promise}
	 *   a Promise that gets resolved as soon as the value lists as well as the required model
	 *   elements have been loaded
	 * @since x.xx.x
	 * @public
	 */
	 MetadataAnalyser.prototype.getODataRelevantValueLists = function(oPropertyContext, oBindingContext) {
		return this._oMetaModel.getODataValueLists(oPropertyContext).then(function(oValueList){
			var sQualifier,
				oRelevantValueList = {},
				aRelevantQualifiers = this._getODataValueListRelevantQualifiers(oPropertyContext, oBindingContext),
				bHasValueListRelevantQualifiers = Array.isArray(aRelevantQualifiers) && aRelevantQualifiers.length > 0;

			for (sQualifier in oValueList) {
				// In case we have ValueListRelevantQualifiers annotation but we do not have any relevat qualifiers we show only the primary annotation
				if ((bHasValueListRelevantQualifiers && aRelevantQualifiers.indexOf(sQualifier) !== -1)) {
					oRelevantValueList[sQualifier] = oValueList[sQualifier];
				}
			}

			return oRelevantValueList;
		}.bind(this));
	};

	MetadataAnalyser.prototype._getODataValueListRelevantQualifiers = function(oPropertyContext, oBindingContext) {
		var aRelevantQualifiers,
			oDataModel = oBindingContext.getModel(),
			oProperty = oPropertyContext.getObject(),
			aQualifiers = oProperty["com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers"];

		if (Array.isArray(aQualifiers) && oDataModel !== undefined) {
			aRelevantQualifiers = aQualifiers.filter(function findRelevantQualifiers(oQualifier){
				var oExpression,
					sPropertyPath,
					mRelevantValue,
					mPropertyCurrentValue,
					bIsRelevant = false,
					oIfStatement = oQualifier["If"],
					sShowAlways = oQualifier["String"];
					if (sShowAlways || sShowAlways === ""){
						bIsRelevant = true;
					} else if (this._isBooleanStatement(oIfStatement)) {
						sPropertyPath = oIfStatement[0]["Path"];
						mPropertyCurrentValue = oDataModel.getObject(sPropertyPath, oBindingContext);
						if (mPropertyCurrentValue === true) {
							bIsRelevant = true;
						}
					} else if (oIfStatement){
						oExpression = oIfStatement[0]["Eq"];
						sPropertyPath = oExpression[0]["Path"];
						mRelevantValue = oExpression[1]["String"];
						mPropertyCurrentValue = oDataModel.getObject(sPropertyPath, oBindingContext);

						if (mRelevantValue === mPropertyCurrentValue) {
							bIsRelevant = true;
						}
					}

				return bIsRelevant;
			}.bind(this)).map(function parseRelevantQualifiers(oQualifier){
				var sQualifier,
					oIfStatement = oQualifier["If"],
					sShowAlways = oQualifier["String"];

				if (sShowAlways  || sShowAlways === ""){
					sQualifier = sShowAlways;
				} else if (oIfStatement) {
					sQualifier = oIfStatement[1] &&
								oIfStatement[1]["String"];
				}

				return sQualifier;
			});
		}

		return aRelevantQualifiers;
	};

	MetadataAnalyser.prototype._isBooleanStatement = function(oStatement){
		var bIsBool = false;

		if (oStatement && oStatement[0] && oStatement[0]["Eq"] === undefined && oStatement[0]["Path"] !== undefined) {
			bIsBool = true;
		}

		return bIsBool;
	};

	/**
	 * Formats a ValueList Annotation object in the format which is used by BaseValueListProvider
	 *
	 * @param {Map} mValueListData A data object which contains the value help info in a format used by the ODataModel
	 * @param {string} sParentFieldName The name of the field for which the Value Help is made
	 * @returns {Map} the formatted annotation
	 * @public
	 * @since 1.38
	 */
	MetadataAnalyser.prototype.getValueListAnnotationForFunctionImport = function(mValueListData, sParentFieldName) {
		var mAnnotation = {
			additionalAnnotations: []
		}, oResolvedAnnotation, sQualifier;
		for (sQualifier in mValueListData) {
			oResolvedAnnotation = {
				annotation: mValueListData[sQualifier]
			};
			if (oResolvedAnnotation.annotation) {
				this._enrichValueHelpAnnotation(oResolvedAnnotation, sParentFieldName);
				// Check if there is no qualifier --> the default/primaryValueListAnnotation
				if (!sQualifier) {
					mAnnotation.primaryValueListAnnotation = oResolvedAnnotation;
				} else {
					// Set the qualifier on the resolved annotation
					oResolvedAnnotation.qualifier = sQualifier;
					mAnnotation.additionalAnnotations.push(oResolvedAnnotation);
				}
			}
		}
		return mAnnotation;
	};

	/**
	 * Retrieves the ValueList Annotation for the specified property/target
	 *
	 * @param {string} sPath the full path of the property/target (including the namespace)
	 * @returns {Object} a Map of resolved ValueHelpList (if any) annotations
	 * @public
	 */
	MetadataAnalyser.prototype.getValueListAnnotation = function(sPath) {
		var mAnnotation = {
			additionalAnnotations: []
		}, oResolvedAnnotation, sParentFieldName, aPath, oType, oProperty, sQualifier;
		if (sPath && this._oMetaModel) {
			// Split the property path and
			aPath = sPath.split("/");
			// The type could either be an entity type or a complex type
			oType = this._oMetaModel.getODataEntityType(aPath[0]) || this._oMetaModel.getODataComplexType(aPath[0]);
			// Get the property from the type
			oProperty = this._oMetaModel.getODataProperty(oType, aPath[1]);
			if (oProperty) {
				sParentFieldName = oProperty.name;
				for ( var sProp in oProperty) {
					if (sProp === "com.sap.vocabularies.Common.v1.ValueList" || sProp.indexOf("com.sap.vocabularies.Common.v1.ValueList#") > -1) {
						sQualifier = null;
						oResolvedAnnotation = {
							annotation: oProperty[sProp]
						};
						aPath = sProp.split("#");
						if (aPath.length === 2) {
							sQualifier = aPath[1];
						}
						if (oResolvedAnnotation.annotation) {
							this._enrichValueHelpAnnotation(oResolvedAnnotation, sParentFieldName);
							// Check if there is no qualifier --> the default/primaryValueListAnnotation
							if (!sQualifier) {
								mAnnotation.primaryValueListAnnotation = oResolvedAnnotation;
							} else {
								// Set the qualifier on the resolved annotation
								oResolvedAnnotation.qualifier = sQualifier;
								mAnnotation.additionalAnnotations.push(oResolvedAnnotation);
							}
						}
					}
				}
			}
		}
		return mAnnotation;
	};

	/**
	 * Retrieves the RecommendationList Annotation for the specified property/target
	 *
	 * @param {string} sPath the full path of the property/target (including the namespace)
	 * @returns {Object} a RecommendationList annotation (if any)
	 * @since 1.71
	 * @private
	 */
	MetadataAnalyser.prototype._getRecommendationListAnnotation = function (sPath) {
		var aPath = sPath.split("/"),
		oType = this._oMetaModel.getODataEntityType(aPath[0]) || this._oMetaModel.getODataComplexType(aPath[0]), // The type could either be an entity type or a complex type
		sFieldName = aPath[1],
		sProperty = this._oMetaModel.getODataProperty(oType, sFieldName, true), // Get the property path from the type
		oPropertyContext = this._oMetaModel.createBindingContext(sProperty),
		oPropertyDescription = oPropertyContext.getObject();

		return oPropertyDescription["com.sap.vocabularies.UI.v1.RecommendationList"];
	};

	/**
	 * Enriches the provided Value Help annotation with key and other relevant information
	 *
	 * @param {object} oAnnotation Annotation object
	 * @param {string} sParentFieldName - the parent field name
	 * @private
	 */
	MetadataAnalyser.prototype._enrichValueHelpAnnotation = function(oAnnotation, sParentFieldName) {
		var mResult, oResult, aEntitySets, oEntitySet, aKeys = [], sKey,
			mInParams = {}, mOutParams = {}, mConstParams = {},
			bIsInParam, bIsOutParam, bIsConstParam, aFields = [], aValueListFields = [], aRecords, oProperty,
			sValueListProperty, sLocalDataProperty, sConstantValue, oParam, iLen = 0, i = 0, j = 0, iFieldLen = 0, oField, aHighImportanceFields = [],
			aInitialValueIsSignificantFields = [];

		if (oAnnotation && oAnnotation.annotation) {
			mResult = oAnnotation.annotation;
			if (mResult) {
				oResult = mResult["SearchSupported"];
				oAnnotation.isSearchSupported = oResult ? oResult.Bool === "true" : false;
				oResult = mResult["CollectionPath"];
				// Set the CollectionPath on the annotation
				if (oResult) {
					oAnnotation.valueListEntitySetName = oResult.String;
					aEntitySets = this.getVLEntitySets(oAnnotation.valueListEntitySetName);
					oEntitySet = aEntitySets[0];

					if (oEntitySet) {
						oAnnotation.valueListEntityName = oEntitySet.entityType;
						oAnnotation.valueListEntitySetName = oEntitySet.name;
						oAnnotation.semantics = oEntitySet["sap:semantics"];// translation?
						aKeys = this.getKeysByEntitySetName(oEntitySet.name);
						aFields = this.getFieldsByEntitySetName(oEntitySet.name);
					}
				}

				oResult = mResult["Label"];
				// Set the valueListTitle on the annotation
				if (oResult) {
					oAnnotation.valueListTitle = oResult.String;
				}

				// Get all the params to create mappings, fields, key etc
				aRecords = mResult["Parameters"];
				if (aFields && aRecords) {
					iLen = aRecords.length;
				}
				// Loop through all the parameters/records
				for (i = 0; i < iLen; i++) {
					oParam = aRecords[i];

					sValueListProperty = undefined;
					sLocalDataProperty = undefined;
					sConstantValue = undefined;
					// Each Parameter on the VL annotation has max 3 properties:
					// LocalDataProperty - Path to the property on the local entity that triggered the ValueList
					// ValueListProperty - Path to property in on the ValueList entity
					// Constant - Constant value that is used to filter the value list with "eq" comparison
					oProperty = oParam["ValueListProperty"];
					sValueListProperty = this.getVLProperty(oProperty, aEntitySets);

					oProperty = oParam["LocalDataProperty"];
					if (oProperty) {
						sLocalDataProperty = oProperty.PropertyPath;
					}
					oProperty = oParam["Constant"];
					if (oProperty) {
						// Because the value of the constant is one of the primitive types
						// Binary, Boolean, Byte, DateTime, Decimal, Double, Single, Guid, Int16, Int32, Int64, SByte, String, Time, DateTimeOffset
						// We get the first possible type value and use it as a constant
						sConstantValue = oProperty[Object.keys(oProperty)[0]];
					}

					bIsInParam = false;
					if (oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterIn") {
						bIsInParam = true;
					}
					bIsOutParam = false;
					if (oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterOut") {
						bIsOutParam = true;
					}
					bIsConstParam = false;
					if (oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterConstant") {
						bIsConstParam = true;
					}

					// Currently only ValueListParameterIn && ValueListParameterConstant parameters support the annotation
					if (
						oParam.InitialValueIsSignificant &&
						oParam.InitialValueIsSignificant.Bool === "true" &&
						(oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterIn" ||
						oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterConstant")
					) {
						aInitialValueIsSignificantFields.push(sValueListProperty);
					}

					// Mapping for In/InOut params
					if (bIsInParam) {
						mInParams[sLocalDataProperty] = sValueListProperty;
					}

					// Mapping for Out/InOut params
					if (bIsOutParam) {
						mOutParams[sLocalDataProperty] = sValueListProperty;
					}

					if (bIsConstParam) {
						mConstParams[sValueListProperty] = sConstantValue;
					}

					// For sFin/gateway; this apparently should form the columns/fields in the list!
					if (bIsOutParam || oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly") {
						iFieldLen = aFields.length;
						while (iFieldLen--) {
							if (aFields[iFieldLen].name === sValueListProperty) {
								aValueListFields.push(aFields[iFieldLen]);
								break;
							}
						}
					}
					// The 1st InOut/Out param having the parent field as LocalDataProperty; should be the Key!
					if (!sKey && bIsOutParam && sLocalDataProperty === sParentFieldName) {
						sKey = sValueListProperty;
					}

					if (MetadataAnalyser.hasImportance(oParam) && this._getImportanceAnnotation(oParam) === "High") {
						for (j = 0; j < aFields.length; j++) {
							oField = aFields[j];
							if (oField.name === sValueListProperty) {
								aHighImportanceFields.push(oField);
								break;
							}
						}
					}
				}
			}
			// Set the mappings, fields, keys, return key and corresponding description on the annotation
			oAnnotation.inParams = mInParams;
			oAnnotation.outParams = mOutParams;
			oAnnotation.constParams = mConstParams;
			oAnnotation.fields = aFields;
			oAnnotation.valueListFields = aValueListFields;
			oAnnotation.aHighImportanceFields = aHighImportanceFields;
			oAnnotation.keys = aKeys;
			oAnnotation.keyField = sKey;
			oAnnotation.descriptionField = this.getDescriptionFieldName(oAnnotation.keyField, oAnnotation.valueListEntitySetName);
			oAnnotation.deprecationCodeField = this.getDeprecationCodeFieldName(aFields);
			oAnnotation.aInitialValueIsSignificantFields = aInitialValueIsSignificantFields;
		}
	};

	/**
	 * Returns the OData entity set with the given simple name from the default entity container.
	 *
	 * @param {string} sEntitySetName the entity set name
	 * @returns {array} Returns the OData entity set. The array is needed because of an Class extension
	 * @private
	 */
	MetadataAnalyser.prototype.getVLEntitySets = function(sEntitySetName) {
		var oEntitySet;

		if (this._oMetaModel) {
			oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySetName);
		}

		return [oEntitySet];
	};

	/**
	 * @param {Object} oProperty The value list property
	 * @returns {string} Returns the value of String attribute of the value list property
	 * @private
	 */
	MetadataAnalyser.prototype.getVLProperty = function(oProperty) {
		var sValueListProperty;

		if (oProperty) {
			sValueListProperty = oProperty.String;
		}

		return sValueListProperty;
	};

	/**
	 * Enriches the provided Recommendation annotation and format it in a convenient way for working
	 *
	 * @param {object} oRecommendationListAnnotation Annotation object
	 * @since 1.71
	 * @private
	 */
	MetadataAnalyser.prototype._enrichRecommendationListAnnotation = function (oRecommendationListAnnotation) {
		var oResultAnnotation = {},
			aFieldsToDisplay = [],
			oEntitySet,
			mResult;

		oResultAnnotation.annotation = oRecommendationListAnnotation;

		mResult = oRecommendationListAnnotation["CollectionPath"];
		if (mResult) {
			oResultAnnotation.path = mResult.String;
		}

		mResult = oRecommendationListAnnotation["RankProperty"];
		if (mResult) {
			oResultAnnotation.rankProperty = mResult.String;
		}

		mResult = oRecommendationListAnnotation["Binding"];
		if (mResult) {
			aFieldsToDisplay = mResult;
		}

		if (this._oMetaModel && oResultAnnotation.path) {
			oEntitySet = this._oMetaModel.getODataEntitySet(oResultAnnotation.path);
		}

		if (oEntitySet) {
			oResultAnnotation.entityName = oEntitySet.name;
			oResultAnnotation.keys = this.getKeysByEntitySetName(oEntitySet.name);
			oResultAnnotation.fields = this.getFieldsByEntitySetName(oEntitySet.name);
			oResultAnnotation.rankField = oResultAnnotation.fields.filter(function (oField) {
				return oField.name === oResultAnnotation.rankProperty;
			});
		}

		aFieldsToDisplay = aFieldsToDisplay.map(function (oFieldDescription) {
			var i = 0;

			while (i < oResultAnnotation.fields.length) {
				if (oResultAnnotation.fields[i].name === oFieldDescription.RecommendationListProperty.String) {
					return oResultAnnotation.fields[i];
				}

				i++;
			}

			return false;
		});

		oResultAnnotation.fieldsToDisplay = aFieldsToDisplay.concat(oResultAnnotation.rankField);

		return oResultAnnotation;
	};

	/**
	 * Gets the human readable text/description field's name from the specified Key field's name and entity name
	 *
	 * @param {string|object} sKeyField - the name of the key field / oField - the field as present in the OData metadata
	 * @param {string} sEntityName - the name of the entity (required if the name of the field is passed as the 1st param)
	 * @returns {string} the description field name, if any
	 * @public
	 */
	MetadataAnalyser.prototype.getDescriptionFieldName = function(sKeyField, sEntityName) {
		var aFields, i = 0, iLength, oField, sDescriptionField;
		if (typeof sKeyField === "object") {
			oField = sKeyField;
		} else {
			aFields = this.getFieldsByEntitySetName(sEntityName);
			if (aFields) {
				iLength = aFields.length;
				for (i = 0; i < iLength; i++) {
					oField = aFields[i];
					if (oField.name === sKeyField) {
						// Found the specified field, exit loop
						break;
					}
					oField = null;
				}
			}
		}
		if (oField && oField["com.sap.vocabularies.Common.v1.Text"]) {
			sDescriptionField = oField["com.sap.vocabularies.Common.v1.Text"].Path;
		}
		return sDescriptionField;
	};
	MetadataAnalyser.prototype.getDeprecationCodeFieldName = function(aFields) {
		var i = 0, iLength, oField, sDeprecationCodeField;
		for (i = 0, iLength = aFields.length; i < iLength; i++) {
			oField = aFields[i];
			if (MetadataAnalyser.isTermDefaultTrue(oField["com.sap.vocabularies.CodeList.v1.IsConfigurationDeprecationCode"])) {
				sDeprecationCodeField = oField.name;
					// Found the specified field, exit loop
					break;
			}
		}
		return sDeprecationCodeField;
	};

	/**
	 * Returns whether Search query is supported for this value help annotation
	 *
	 * @param {object} oAnnotation - ValueHelpAnnotation
	 * @returns {boolean} whether search query is supported
	 * @public
	 */
	MetadataAnalyser.prototype.getIsSearchSupported = function(oAnnotation) {
		var bIsSearchSupported = false, oProperty;

		if (oAnnotation) {
			oProperty = oAnnotation.SearchSupported;
			if (oProperty && oProperty.Bool === "true") {
				bIsSearchSupported = true;
			}
		}

		return bIsSearchSupported;
	};

	/**
	 * Gets the valuelist entity sets semantics from the specified ValueList annotation
	 *
	 * @param {Object} oAnnotation - the value list annotation
	 * @returns {string} - the semantics of the value list entity set (if any)
	 * @protected
	 */
	MetadataAnalyser.prototype.getValueListSemantics = function(oAnnotation) {
		var sEntitySet, oEntitySet, sSemantics;
		if (oAnnotation) {
			sEntitySet = oAnnotation["CollectionPath"] ? oAnnotation["CollectionPath"].String : undefined;
		}
		if (sEntitySet) {
			oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySet);
			if (oEntitySet) {
				sSemantics = oEntitySet["sap:semantics"];
			}
		}
		return sSemantics;
	};

	/**
	 * Retrieves the LineItem Annotation for the specified target entity type
	 *
	 * @param {string} sPath the full path of the entity type (including the namespace)
	 * @param {string} sQualifier the qualifier for retrieving the UI.LineItem annotation (optional)
	 * @returns {Object} the resolved LineItem annotation object (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getLineItemAnnotation = function(sPath, sQualifier) {
		var oEntityType, sTerm, aAnnotationData, oResolvedAnnotation;
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				sTerm = "com.sap.vocabularies.UI.v1.LineItem";
				if (sQualifier) {
					sTerm += "#" + sQualifier;
				}
				aAnnotationData = oEntityType[sTerm];
				// Resolve the annotation data into easily accessible properties
				if (aAnnotationData) {
					oResolvedAnnotation = {
						annotation: aAnnotationData
					};
					this._enrichAnnotationWithUIDataField(oResolvedAnnotation, aAnnotationData);
				}
			}
		}
		return oResolvedAnnotation;
	};

	/**
	 * Determines if the semantics annotation <code>sap:semantics</code> is set to 'aggregate'
	 *
	 * @param {string} sPath the full path of the entity type (including the namespace)
	 * @returns {boolean} the semantics=aggregate state
	 * @public
	 */
	MetadataAnalyser.prototype.isSemanticAggregation = function(sPath) {
		var oEntityType;
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				return oEntityType["sap:semantics"] === "aggregate";
			}
		}

		return false;
	};

	/**
	 * Retrieves the PresentationVariant Annotation for the specified target entity type
	 *
	 * @param {string} sPath the full path of the entity type (including the namespace)
	 * @param {string} sQualifier the qualifier for retrieving the UI.PresentationVariant annotation (optional)
	 * @returns {Object} the resolved PresentationVariant annotation object (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getPresentationVariantAnnotation = function(sPath, sQualifier) {
		var oEntityType, sTerm, aAnnotationData, iLen, i, oResolvedAnnotation, oLineItemAnnotation, oChartAnnotation, sItemPath;
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				sTerm = "com.sap.vocabularies.UI.v1.PresentationVariant";
				if (sQualifier) {
					sTerm += "#" + sQualifier;
				}
				aAnnotationData = oEntityType[sTerm];
				if (aAnnotationData) {
					oResolvedAnnotation = {
						annotation: aAnnotationData,
						requestAtLeastFields: [],
						sortOrderFields: [],
						groupByFields: [],
						maxItems: undefined
					};
					if (aAnnotationData.Visualizations) {
						iLen = aAnnotationData.Visualizations.length;
						for (i = 0; i < iLen; i++) {
							sItemPath = aAnnotationData.Visualizations[i].AnnotationPath;
							if (!oLineItemAnnotation && (sItemPath === "@com.sap.vocabularies.UI.v1.LineItem" || sItemPath.indexOf("@com.sap.vocabularies.UI.v1.LineItem#") > -1)) {
								// get the lineitem annotation from entityType, ignoring the @
								oLineItemAnnotation = oEntityType[sItemPath.substring(1)];
								// process and set the line item annotation on the resolved result
								oResolvedAnnotation.lineItemAnnotation = {
									annotation: oLineItemAnnotation
								};
								this._enrichAnnotationWithUIDataField(oResolvedAnnotation.lineItemAnnotation, oLineItemAnnotation);
							} else if (!oChartAnnotation && (sItemPath === "@com.sap.vocabularies.UI.v1.Chart" || sItemPath.indexOf("@com.sap.vocabularies.UI.v1.Chart#") > -1)) {
								// get the chart annotation from entityType, ignoring the @
								oChartAnnotation = oEntityType[sItemPath.substring(1)];
								// process and set the line item annotation on the resolved result
								oResolvedAnnotation.chartAnnotation = {
									annotation: oChartAnnotation,
									semantics: oEntityType["sap:semantics"]
								};
								this._enrichChartAnnotation(oResolvedAnnotation.chartAnnotation, oChartAnnotation);
							}

							// break only if both LineItem and Chart annotations have been found!
							if (oLineItemAnnotation && oChartAnnotation) {
								break;
							}
						}
					}
					if (aAnnotationData.RequestAtLeast) {
						iLen = aAnnotationData.RequestAtLeast.length;
						for (i = 0; i < iLen; i++) {
							oResolvedAnnotation.requestAtLeastFields.push(aAnnotationData.RequestAtLeast[i].PropertyPath);
						}
					}
					if (aAnnotationData.SortOrder) {
						iLen = aAnnotationData.SortOrder.length;
						for (i = 0; i < iLen; i++) {
							oResolvedAnnotation.sortOrderFields.push({
								name: aAnnotationData.SortOrder[i].Property.PropertyPath,
								descending: aAnnotationData.SortOrder[i].Descending ? aAnnotationData.SortOrder[i].Descending.Bool === "true" : false
							});
						}
					}

					if (aAnnotationData.GroupBy) {
						iLen = aAnnotationData.GroupBy.length;
						for (i = 0; i < iLen; i++) {
							oResolvedAnnotation.groupByFields.push(aAnnotationData.GroupBy[i].PropertyPath);
						}
					}

					if (aAnnotationData.MaxItems) {
						oResolvedAnnotation.maxItems = aAnnotationData.MaxItems.Int;
					}
				}
			}
		}
		return oResolvedAnnotation;
	};

	/**
	 * Retrieves the <code>PresentationVariant</code> annotation qualifier for the specified target entity type
	 *
	 * @param {string} sPath the full path of the entity type (including the namespace)
	 * @returns {string} the resolved <code>PresentationVariant</code> annotation qualifier (if any) or empty string
	 * @private
	 */
 MetadataAnalyser.prototype._getPresentationVariantQualifierForVHD = function(sPath) {
	var oEntityType, sTerm, sResolvedQualifier, aPath, sProp;
	if (sPath && this._oMetaModel) {
		oEntityType = this._oMetaModel.getODataEntityType(sPath);
		sTerm = "com.sap.vocabularies.UI.v1.PresentationVariant";
		for (sProp in oEntityType) {
			if (sProp.indexOf(sTerm + "#") > -1){
				aPath = sProp.split("#");
				if (aPath.length === 2) {
					sResolvedQualifier = aPath[1];
				}
			}
		}
	}
	return sResolvedQualifier || "";
};

	/**
	 * Enriches the provided FieldGroup/LineItem annotation with UI.DataField attributes
	 *
	 * @param {object} oAnnotation - the annotation that would be enriched
	 * @param {object} oAnnotationData - array of params having UI.DataField
	 * @private
	 */
	MetadataAnalyser.prototype._enrichChartAnnotation = function(oAnnotation, oAnnotationData) {
		var i, iLen, oObj;

		if (oAnnotation && oAnnotationData) {
			oAnnotation.measureFields = [];
			oAnnotation.dimensionFields = [];
			oAnnotation.measureAttributes = {};
			oAnnotation.dimensionAttributes = {};

			if (oAnnotationData.ChartType && oAnnotationData.ChartType.EnumMember) {
				oAnnotation.chartType = oAnnotationData.ChartType.EnumMember;
			}

			if (oAnnotationData.Measures) {
				iLen = oAnnotationData.Measures.length;
				for (i = 0; i < iLen; i++) {
					oAnnotation.measureFields.push(oAnnotationData.Measures[i].PropertyPath);
				}
			}

			if (oAnnotationData.MeasureAttributes) {
				iLen = oAnnotationData.MeasureAttributes.length;
				for (i = 0; i < iLen; i++) {
					oObj = oAnnotationData.MeasureAttributes[i];
					if (oObj.Measure) {
						// enrich measure attributes
						oAnnotation.measureAttributes[oObj.Measure.PropertyPath] = {
							role: oObj.Role ? oObj.Role.EnumMember : null,
							dataPoint: oObj.DataPoint ? oObj.DataPoint.AnnotationPath : null
						};
					}
				}
			}

			if (oAnnotationData.Dimensions) {
				iLen = oAnnotationData.Dimensions.length;
				for (i = 0; i < iLen; i++) {
					oAnnotation.dimensionFields.push(oAnnotationData.Dimensions[i].PropertyPath);
				}
			}

			if (oAnnotationData.DimensionAttributes) {
				iLen = oAnnotationData.DimensionAttributes.length;
				for (i = 0; i < iLen; i++) {
					oObj = oAnnotationData.DimensionAttributes[i];
					if (oObj.Dimension) {
						// enrich dimension attributes
						oAnnotation.dimensionAttributes[oObj.Dimension.PropertyPath] = {
							role: oObj.Role ? oObj.Role.EnumMember : null,
							hierarchyLevel: oObj.HierarchyLevel ? oObj.HierarchyLevel.Int : 0
						};
					}
				}
			}
		}

	};

	/**
	 * Retrieves the Chart Annotation for the specified target entity type
	 *
	 * @param {string} sPath the full path of the entity type (including the namespace)
	 * @param {string} sQualifier the qualifier for retrieving the Chart annotation (optional)
	 * @returns {Object} the resolved Chart annotation object (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getChartAnnotation = function(sPath, sQualifier) {
		var oEntityType, aAnnotationData, oResolvedAnnotation, sTerm;
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				sTerm = "com.sap.vocabularies.UI.v1.Chart";
				if (sQualifier) {
					sTerm += "#" + sQualifier;
				}
				aAnnotationData = oEntityType[sTerm];
				// Resolve the annotation data into easily accessible properties
				if (aAnnotationData) {
					oResolvedAnnotation = {
						annotation: aAnnotationData,
						semantics: oEntityType["sap:semantics"]
					};
					this._enrichChartAnnotation(oResolvedAnnotation, aAnnotationData);
				}
			}
		}
		return oResolvedAnnotation;
	};

	/**
	 * Retrieves the DataPoint Annotation for the specified target entity type
	 *
	 * @param {string} sPath the full path of the entity type (including the namespace)
	 * @returns {Object} oResolvedAnnotation - object of the resolved DataPoint annotations (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getDataPointAnnotation = function(sPath) {
		var oEntityType, sProp, sQualifier, aPath, oDataPointAnnotationData, oResolvedAnnotation = {};
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				for (sProp in oEntityType) {
					if (sProp === "com.sap.vocabularies.UI.v1.DataPoint" || sProp.indexOf("com.sap.vocabularies.UI.v1.DataPoint#") > -1) {
						sQualifier = null;
						oDataPointAnnotationData = oEntityType[sProp];
						aPath = sProp.split("#");
						if (aPath.length === 2) {
							sQualifier = aPath[1];
						}
						if (oDataPointAnnotationData) {
							// Set the qualifier of the annotation
							if (sQualifier) {
								if (!oResolvedAnnotation.additionalAnnotations) {
									oResolvedAnnotation.additionalAnnotations = {};
								}
								oResolvedAnnotation.additionalAnnotations[sQualifier] = oDataPointAnnotationData;
							} else {
								oResolvedAnnotation.primaryAnnotation = oDataPointAnnotationData;
							}
						}
					}
				}
			}
		}
		return oResolvedAnnotation;
	};

	/**
	 * Retrieves an array of FieldGroup Annotation for the specified target entity type
	 *
	 * @param {string} sPath the entity type name -or- the full path of the entity type (including the namespace)
	 * @returns {Object} the resolved array of FieldGroup annotations (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldGroupAnnotation = function(sPath) {
		var oEntityType, sQualifier, aPath, oResult, oAnnotation, oResolvedAnnotation, aResolvedAnnotation = [];
		if (sPath && this._oMetaModel) {
			// Field groups annotations are used also by SmartFilter, which can be used without a fully qualified path --> add support for that
			oEntityType = this._oMetaModel.getODataEntityType(this._getFullyQualifiedNameForEntity(sPath));
			if (oEntityType) {
				for ( var sProp in oEntityType) {
					if (sProp === "com.sap.vocabularies.UI.v1.FieldGroup" || sProp.indexOf("com.sap.vocabularies.UI.v1.FieldGroup#") > -1) {
						sQualifier = null;
						oAnnotation = oEntityType[sProp];
						aPath = sProp.split("#");
						if (aPath.length === 2) {
							sQualifier = aPath[1];
						}
						if (oAnnotation) {
							oResolvedAnnotation = {
								annotation: oAnnotation
							};
							// Set the groupName of the annotation
							if (sQualifier) {
								oResolvedAnnotation.groupName = sQualifier;
							}
							// Get the label for the group
							oResult = oAnnotation["Label"];
							if (oResult) {
								// Assign the groupLabel to the annotation if it exists
								oResolvedAnnotation.groupLabel = oResult.String;
							}

							// Get the collection of UI fields
							oResult = oAnnotation["Data"];
							if (oResult) {
								this._enrichAnnotationWithUIDataField(oResolvedAnnotation, oResult);
							}
							aResolvedAnnotation.push(oResolvedAnnotation);
						}
					}
				}
			}
		}
		return aResolvedAnnotation;
	};

	/**
	* Retrieves an array of <code>ConnectedFields</code> annotation for the specified target entity type
	*
	* @param {string} sPath the entity type name -or- the full path of the entity type (including the namespace)
	* @returns {Array} the resolved array of <code>ConnectedFields</code> annotations (if any)
	* @public
	*/
	MetadataAnalyser.prototype.getConnectedFieldsAnnotation = function(sPath) {
		var oEntityType, sQualifier, aPath, oResult, oAnnotation,
			oResolvedAnnotation, aResolvedAnnotation = [];

		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(this._getFullyQualifiedNameForEntity(sPath));
			if (oEntityType) {
				for (var sProp in oEntityType) {
					if (sProp === "com.sap.vocabularies.UI.v1.ConnectedFields" || sProp.indexOf("com.sap.vocabularies.UI.v1.ConnectedFields#") > -1) {
						sQualifier = null;
						oAnnotation = oEntityType[sProp];
						aPath = sProp.split("#");
						if (aPath.length === 2) {
							sQualifier = aPath[1];
						}
						if (oAnnotation) {
							oResolvedAnnotation = {
								annotation: oAnnotation
							};

							if (sQualifier) {
								oResolvedAnnotation.groupName = sQualifier;
							}

							oResult = oAnnotation["Label"];
							if (oResult) {
								oResolvedAnnotation.groupLabel = oResult.String;
							}

							oResolvedAnnotation.fields = [];
							oResolvedAnnotation.criticality = {};

							// Gets the collection of UI fields
							oResult = oAnnotation["Data"];
							if (oResult) {
								for (var oConnectedFieldPropName in oResult) {
									const oConnectedFieldRecord = oResult[oConnectedFieldPropName];
									if (oConnectedFieldRecord.RecordType !== "com.sap.vocabularies.UI.v1.DataField") {
										continue;
									}

									oResolvedAnnotation.fields.push(oConnectedFieldPropName);

									if (oConnectedFieldRecord.Criticality) {
										oResolvedAnnotation.criticality[oConnectedFieldPropName] = this._extractCriticalityInfo(oConnectedFieldRecord.Criticality, oConnectedFieldRecord);
									}
								}
							}
							aResolvedAnnotation.push(oResolvedAnnotation);
						}
					}
				}
			}
		}
		return aResolvedAnnotation;
	};

	/**
	 * Retrieves an array of FieldGroup annotation as specified by the FilterFacets annotation for a target entity type. If no FilterFacet annotation
	 * is provided, all the FieldGroups are returned (same behaviour as getFieldGroupAnnotation method).
	 *
	 * @param {string} sPath the entity type name -or- the full path of the entity type (including the namespace)
	 * @returns {Object} the resolved array of FieldGroup annotations (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getFieldGroupsByFilterFacetsAnnotation = function(sPath) {
		var oEntityType, aPath, sQualifier, aRecords, aResolvedAnnotation, aFieldGroupsAnnotation = this.getFieldGroupAnnotation(sPath);

		aResolvedAnnotation = aFieldGroupsAnnotation;

		if (sPath && this._oMetaModel) {
			// Field groups annotations are used also by SmartFilter, which can be used without a fully qualified path --> add support for that
			oEntityType = this._oMetaModel.getODataEntityType(this._getFullyQualifiedNameForEntity(sPath));
			if (oEntityType) {
				for ( var sProp in oEntityType) {
					if (sProp === "com.sap.vocabularies.UI.v1.FilterFacets" || sProp.indexOf("com.sap.vocabularies.UI.v1.FilterFacets#") > -1) {

						aResolvedAnnotation = [];

						aRecords = oEntityType[sProp];
						if (aRecords) {
							for (var i = 0; i < aRecords.length; i++) {
								aPath = aRecords[i].Target.AnnotationPath.split("#");
								if (aPath.length === 2) {
									sQualifier = aPath[1];
								}

								if (sQualifier) {
									/* eslint-disable no-loop-func */
									aFieldGroupsAnnotation.some(function(oFieldGroupAnnotation) {
										if (oFieldGroupAnnotation.groupName === sQualifier) {
											if (aRecords[i].Label) {
												oFieldGroupAnnotation.groupLabel = aRecords[i].Label.String;
											}
											aResolvedAnnotation.push(oFieldGroupAnnotation);
											return true;
										}
										return false;

									});
									/* eslint-enable no-loop-func */
								}
							}
						}
					}
				}
			}
		}

		return aResolvedAnnotation;
	};

	/**
	 * Enriches the provided FieldGroup/LineItem annotation with UI.DataField attributes
	 *
	 * @param {object} oAnnotation - the annotation that would be enriched
	 * @param {Array} aRecords - array of params having UI.DataField
	 * @private
	 */
	MetadataAnalyser.prototype._enrichAnnotationWithUIDataField = function(oAnnotation, aRecords) {
		var aFields = [], mURLInfo = {}, mLabels = {}, mImportance = {}, mHidden = {}, mCriticality = {}, mWidth = {}, oProperty, sField, oParam, iLen = 0, i = 0;
		if (oAnnotation && aRecords) {
			iLen = aRecords.length;
			aFields = [];
			mLabels = {};
			for (i = 0; i < iLen; i++) {
				oParam = aRecords[i];
				// Check if term is correct
				if (oParam && (oParam.RecordType === "com.sap.vocabularies.UI.v1.DataField" || oParam.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl")) {
					sField = null;
					oProperty = oParam["Value"];
					if (oProperty) {
						sField = oProperty.Path;
					}
					if (sField) {
						// Add field to the fields array
						aFields.push(sField);
						// Extract Url param only if a value path exists
						oProperty = oParam["Url"];
						if (oProperty) {
							mURLInfo[sField] = this._extractURLInfo(oProperty);
						}
						// Check if a Label is defined with the annotation
						oProperty = oParam["Label"];
						if (oProperty && oProperty.String) {
							mLabels[sField] = oProperty.String;
						}
						if (this._getHiddenAnnotation(oParam)) {
							mHidden[sField] = true;
						}
						// Calculate and set Importance metadata
						mImportance[sField] = this._getImportanceAnnotation(oParam);
						// Check if Criticality Path is defined for the DataField
						oProperty = oParam["Criticality"];
						if (oProperty) {
							mCriticality[sField] = this._extractCriticalityInfo(oProperty, oParam);
						}
						// get HTML5.CssDefaults "width" annotation
						const mWidthAnnotation = this._getWidthAnnotation(oParam);
						if (mWidthAnnotation) {
							mWidth[sField] = mWidthAnnotation;
						}
					}
				}
			}

			// Assign the resolved fields and labels to the annotation
			oAnnotation.fields = aFields;
			oAnnotation.urlInfo = mURLInfo;
			oAnnotation.labels = mLabels;
			oAnnotation.hidden = mHidden;
			oAnnotation.importance = mImportance;
			oAnnotation.criticality = mCriticality;
			oAnnotation.width = mWidth;
		}
	};

	/**
	 * Extracts the Criticality meta object and fields
	 *
	 * @param {Object} oCriticality - the Criticality parameter
	 * @param {Object} oRecord - the record containing the Criticality parameter
	 * @returns {Object} oCriticality - the parsed Criticality metadata
	 * @private
	 */
	MetadataAnalyser.prototype._extractCriticalityInfo = function(oCriticality, oRecord) {
		var oResult, oCriticalityRepresentation;
		// extract info only if a Path or EnumMember exist
		if (oCriticality.Path || oCriticality.EnumMember) {
			oResult = {};
			oResult["path"] = oCriticality.Path;
			oResult["criticalityType"] = oCriticality.EnumMember;
			oCriticalityRepresentation = oRecord["CriticalityRepresentation"];
			if (oCriticalityRepresentation) {
				if (oCriticalityRepresentation.Path) {
					oResult["criticalityRepresentationPath"] = oCriticalityRepresentation.Path;
				} else if (oCriticalityRepresentation.EnumMember) {
					oResult["criticalityRepresentationType"] = oCriticalityRepresentation.EnumMember;
				}
			}
		}
		return oResult;
	};

	/**
	 * Extracts the Apply "odata.fillUriTemplate" meta object and fields
	 *
	 * @param {Object} oParameter - the Apply "odata.fillUriTemplate" meta object
	 * @returns {Object} oUrlInfo - the parsed "odata.fillUriTemplate" metadata
	 * @private
	 */
	MetadataAnalyser.prototype._extractURLInfo = function(oParameter) {
		var oResult, aParameters, iLength, oParam;
		if (oParameter) {
			if (oParameter.Apply && oParameter.Apply.Name === "odata.fillUriTemplate") {
				oResult = {
					urlTarget: undefined,
					parameters: []
				};
				// Create a dummy annotation helper context at the instance level
				if (!this._oDummyAnnotationHelperContext) {
					this._oDummyAnnotationHelperContext = this._oMetaModel.createBindingContext("/");
				}
				if (this._oDummyAnnotationHelperContext) {
					// extract target URL from fillUriTemplate
					oResult.urlTarget = AnnotationHelper.format(this._oDummyAnnotationHelperContext, oParameter);
				}
				// extract LabeledElement --> Path from Parameters (these should be added to $select)
				aParameters = oParameter.Apply.Parameters;
				iLength = aParameters && aParameters.length ? aParameters.length : 0;
				while (iLength--) {
					oParam = aParameters[iLength];
					if (oParam && oParam.Type === "LabeledElement" && oParam.Value && oParam.Value.Path) {
						oResult.parameters.push(oParam.Value.Path);
					}
				}
			} else if (oParameter.Path) {
				oResult = {
					urlPath: oParameter.Path
				};
			}
		}
		return oResult;
	};

	/**
	 * Resolves and updates the DataFieldDefault annotation on the provided field
	 *
	 * @param {Object} oField the parsed field with OData metadata/annotations that has to be resolved
	 * @public
	 */
	MetadataAnalyser.prototype.updateDataFieldDefault = function(oField) {
		var oDataFieldDefault = oField && oField["com.sap.vocabularies.UI.v1.DataFieldDefault"], oProperty;
		if (oDataFieldDefault && (oDataFieldDefault.RecordType === "com.sap.vocabularies.UI.v1.DataField" || oDataFieldDefault.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl")) {
			// Check if a Label is defined with the annotation
			oProperty = oDataFieldDefault["Label"];
			if (oProperty && oProperty.String) {
				oField.label = oProperty.String;
			}

			// Check if Criticality Path is defined for the DataFieldDefault annotation
			oProperty = oDataFieldDefault["Criticality"];
			if (oProperty) {
				oField.criticalityInfo = this._extractCriticalityInfo(oProperty, oDataFieldDefault);
			}

			// Extract Url param only if a value path exists
			oProperty = oDataFieldDefault["Url"];
			if (oProperty) {
				oField.urlInfo = this._extractURLInfo(oProperty);
			}

			// get the width annotation
			oField.width = this._getWidthAnnotation(oDataFieldDefault);

			// get the importance annotation
			oField.importance = this._getImportanceAnnotation(oDataFieldDefault);
		}
	};

	/**
	 * Retrieves the SelectionVariant annotation for a specified entity
	 *
	 * @param {string} sPath the entity type name -or- the full path of the entity type (including the namespace)
	 * @returns {array} the resolved array of SelectionVariant annotations (if any).
	 * @public
	 */
	MetadataAnalyser.prototype.getSelectionVariantAnnotationList = function(sPath) {
		var oEntityType, oAnnotation, sQualifier, aResolvedAnnotation = [], aPath;
		if (sPath && this._oMetaModel) {
			// SelectionFields annotations is used also by SmartFilter, which can be used without a fully qualified path --> add support for that
			oEntityType = this._oMetaModel.getODataEntityType(this._getFullyQualifiedNameForEntity(sPath));
			if (oEntityType) {
				for ( var sProp in oEntityType) {
					if (sProp === "com.sap.vocabularies.UI.v1.SelectionVariant" || sProp.indexOf("com.sap.vocabularies.UI.v1.SelectionVariant#") > -1) {
						sQualifier = "";
						oAnnotation = oEntityType[sProp];
						aPath = sProp.split("#");
						if (aPath.length === 2) {
							sQualifier = aPath[1];
						}
						if (oAnnotation) {
							aResolvedAnnotation.push({
								qualifier: sQualifier,
								annotation: oAnnotation
							});
						}
					}
				}
			}
		}
		return aResolvedAnnotation;
	};

	/**
	 * Retrieves the SelectionPresentationVariant annotation for a specified entity
	 *
	 * @param {string} sEntitySetName the entity set name
	 * @returns {array} the resolved array of SelectionPresentationVariant annotations (if any).
	 * @public
	 */
	MetadataAnalyser.prototype.getSelectionPresentationVariantAnnotationList = function(sEntitySetName) {
		var aEntitiesToCheck, oEntitySet, oEntityType, oAnnotation, sQualifier, sVariantQualifier, sAnnoPath, sText = null, oSelectionVariant = null, oPresentationVariant = null, aResolvedAnnotation = [], aPath;
		if (sEntitySetName && this._oMetaModel) {

			oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySetName);
			if (oEntitySet) {
				oEntityType = this._oMetaModel.getODataEntityType(oEntitySet.entityType);
			}

			aEntitiesToCheck = [
				oEntitySet, oEntityType
			];
			var fnGetSelectionVariantForQualifier = function(sQualifier, aSelectionVariants) {
				// returns {object | undefined}
				return aSelectionVariants.filter(function(oSelectionVariant) {
					return oSelectionVariant.qualifier === sQualifier;
				})[0];
			};
			var sFullyQualifiedEntityTypeName = this.getEntityTypeNameFromEntitySetName(sEntitySetName);
			var that = this;
			aEntitiesToCheck.forEach(function(oEntity) {

				if (oEntity) {

					for ( var sProp in oEntity) {
						if (sProp === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant" || sProp.indexOf("com.sap.vocabularies.UI.v1.SelectionPresentationVariant#") > -1) {
							sQualifier = "";
							oAnnotation = oEntity[sProp];
							aPath = sProp.split("#");
							if (aPath.length === 2) {
								sQualifier = aPath[1];
							}
							if (oAnnotation) {
								sText = null;

								if (oAnnotation.Text && oAnnotation.Text.String) {
									sText = oAnnotation.Text.String;
								}

								if (oAnnotation.SelectionVariant && oAnnotation.SelectionVariant.Path) {
									sAnnoPath = oAnnotation.SelectionVariant.Path;
									sVariantQualifier = "";
									aPath = sAnnoPath.split("#");
									if (aPath.length === 2) {
										sVariantQualifier = aPath[1];
									}

									if (oEntityType[sAnnoPath.substring(1)]) {
										var oSelectionVariantAnnotation = fnGetSelectionVariantForQualifier(sVariantQualifier, that.getSelectionVariantAnnotationList(sFullyQualifiedEntityTypeName));
										oSelectionVariant = {
											qualifier: sVariantQualifier,
											annotation: oSelectionVariantAnnotation ? oSelectionVariantAnnotation.annotation : undefined
										};
									}
								}

								if (oAnnotation.PresentationVariant && oAnnotation.PresentationVariant.Path) {
									sAnnoPath = oAnnotation.PresentationVariant.Path;

									sVariantQualifier = "";
									aPath = sAnnoPath.split("#");
									if (aPath.length === 2) {
										sVariantQualifier = aPath[1];
									}

									if (oEntityType[sAnnoPath.substring(1)]) {
										oPresentationVariant = {
											qualifier: sVariantQualifier,
											annotation: that.getPresentationVariantAnnotation(sFullyQualifiedEntityTypeName, sVariantQualifier)
										};
									}
								}

								aResolvedAnnotation.push({
									qualifier: sQualifier,
									text: sText,
									annotation: oAnnotation,
									selectionVariant: oSelectionVariant,
									presentationVariant: oPresentationVariant
								});

							}
						}
					}
				}
			});
		}
		return aResolvedAnnotation;
	};

	/**
	 * Retrieves the SelectionFields annotation for a specified entity
	 *
	 * @param {string} sPath the entity type name -or- the full path of the entity type (including the namespace)
	 * @returns {Object} the resolved array of FieldGroup annotations (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getSelectionFieldsAnnotation = function(sPath) {
		var oEntityType, aAnnotationData, iLen, i, oResolvedAnnotation;
		if (sPath && this._oMetaModel) {
			// SelectionFields annotations is used also by SmartFilter, which can be used without a fully qualified path --> add support for that
			oEntityType = this._oMetaModel.getODataEntityType(this._getFullyQualifiedNameForEntity(sPath));
			if (oEntityType) {
				aAnnotationData = oEntityType["com.sap.vocabularies.UI.v1.SelectionFields"];
				if (aAnnotationData) {
					oResolvedAnnotation = {
						annotation: aAnnotationData,
						selectionFields: []
					};
					iLen = aAnnotationData.length;
					for (i = 0; i < iLen; i++) {
						oResolvedAnnotation.selectionFields.push(aAnnotationData[i].PropertyPath);
					}
				}
			}
		}
		return oResolvedAnnotation;
	};

	/**
	 * Retrieves the SemanticKey Annotation for the specified entity
	 *
	 * @param {string} sPath the full path of the entity/target (including the namespace)
	 * @returns {Object} the resolved SemanticKey annotation object (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getSemanticKeyAnnotation = function(sPath) {
		var oEntityType, aAnnotationData, iLen, i, oResolvedAnnotation;
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				aAnnotationData = oEntityType["com.sap.vocabularies.Common.v1.SemanticKey"];
				if (aAnnotationData) {
					oResolvedAnnotation = {
						annotation: aAnnotationData,
						semanticKeyFields: []
					};
					iLen = aAnnotationData.length;
					for (i = 0; i < iLen; i++) {
						oResolvedAnnotation.semanticKeyFields.push(aAnnotationData[i].PropertyPath);
					}
				}
			}
		}
		return oResolvedAnnotation;
	};

	/**
	 * Resolves and retrieves the path of the actual field (e.g. key that is not editable) for the specified editable property via EditableFieldFor
	 * annotation
	 *
	 * @param {Object} oField The field for which EditableFieldFor annotation will be checked
	 * @returns {String|undefined} The path to actual (r.g. key that is non-editable) field or undefined
	 * @public
	 */
	MetadataAnalyser.resolveEditableFieldFor = function(oField) {
		var oResult = oField && oField["com.sap.vocabularies.Common.v1.EditableFieldFor"];
		return oResult && oResult.PropertyPath;
	};

	MetadataAnalyser.isPotentiallySensitive = function (oField) {
		return this.isTermTrue(oField["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"]);
	};

	/**
	 * Returns whether the hidden annotation is set
	 *
	 * @param {Object} oParam - the parameter containing the annotations
	 * @returns {boolean} Whether the hidden annotation is set
	 * @private
	 */
	MetadataAnalyser.prototype._getHiddenAnnotation = function(oParam) {
		var oResult = oParam["com.sap.vocabularies.UI.v1.Hidden"];
		return oResult && oResult.Bool !== "false" && !oResult.Path;
	};

	/**
	 * Returns the importance annotation if available
	 *
	 * @param {Object} oParam - the parameter containing the importance annotation
	 * @returns {string} the found importance value or null
	 * @private
	 */
	MetadataAnalyser.prototype._getImportanceAnnotation = function(oParam) {
		var sImportance = null, oResult;

		oResult = oParam["com.sap.vocabularies.UI.v1.Importance"];
		if (oResult) {
			sImportance = oResult.EnumMember;
		}

		switch (sImportance) {
			case "com.sap.vocabularies.UI.v1.ImportanceType/Medium":
				return "Medium";
			case "com.sap.vocabularies.UI.v1.ImportanceType/Low":
				return "Low";
			default:
				return "High";
		}

		// return "High"; // if nothing is specified / or a unknown type is used, default to High
	};

	/**
	 * Returns the width annotation if available
	 *
	 * @param {Object} oParam - the parameter containing the width annotation
	 * @returns {string} the found width value or null
	 * @private
	 */
	MetadataAnalyser.prototype._getWidthAnnotation = function(oParam) {
		var sWidth = null, oResult, oWidth, regEx = /\d*\.?\d+(px|em|rem)/gi;

		oResult = oParam["com.sap.vocabularies.HTML5.v1.CssDefaults"];
		if (oResult) {
			oWidth = oResult.width;
			if (oWidth && oWidth.String && regEx.test(oWidth.String)) {
				sWidth = oWidth.String;
			}
		}

		return sWidth;
	};

	/**
	 * Resolves and returns the displayBehaviour from TextArrangement Annotation for the specified property/target
	 *
	 * @param {string} sPath the full path of the property/target (including the namespace) or the property itself
	 * @returns {string} the resolved displayBehaviour from TextArrangement enumeration (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getTextArrangementValue = function(sPath) {
		var aPath, oType, oObject, oAnnotation, sDisplayBehaviour;

		if (sPath && this._oMetaModel) {
			if (typeof (sPath) === "string") {
				sPath = this._getFullyQualifiedNameForEntity(sPath);
				// Split the property path and
				aPath = sPath.split("/");
				if (aPath.length > 1) {
					// The type could either be an entity type or a complex type
					oType = this._oMetaModel.getODataEntityType(aPath[0]) || this._oMetaModel.getODataComplexType(aPath[0]);
					// Get the property from the type
					oObject = this._oMetaModel.getODataProperty(oType, aPath[1]);
				} else {
					oObject = this._oMetaModel.getODataEntityType(sPath) || this._oMetaModel.getODataComplexType(sPath);
				}
			} else {
				oObject = sPath;
			}
			if (oObject) {
				oAnnotation = oObject["com.sap.vocabularies.UI.v1.TextArrangement"] ||
								oObject["com.sap.vocabularies.Common.v1.Text"] && oObject["com.sap.vocabularies.Common.v1.Text"]["com.sap.vocabularies.UI.v1.TextArrangement"];
			}
			if (oAnnotation) {
				switch (oAnnotation.EnumMember) {
					case "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst":
						sDisplayBehaviour = "descriptionAndId";
						break;
					case "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast":
						sDisplayBehaviour = "idAndDescription";
						break;
					case "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate":
						sDisplayBehaviour = "idOnly";
						break;
					case "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly":
						sDisplayBehaviour = "descriptionOnly";
						break;
					default:
						sDisplayBehaviour = undefined;
						break;
				}
			}
		}
		return sDisplayBehaviour;
	};

	/**
	 * Retrieves the SemanticObject Annotation for the specified property/target
	 *
	 * @param {string} sPath the full path of the property/target (including the namespace)
	 * @returns {Object} the resolved semanticObject annotation object (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getSemanticObjectAnnotation = function(sPath) {
		var aPath, oType, oProperty, oAnnotation;

		if (sPath && this._oMetaModel) {
			// Split the property path and
			aPath = sPath.split("/");
			// The type could either be an entity type or a complex type
			oType = this._oMetaModel.getODataEntityType(aPath[0]) || this._oMetaModel.getODataComplexType(aPath[0]);
			// Get the property from the type
			oProperty = this._oMetaModel.getODataProperty(oType, aPath[1]);
			if (oProperty) {
				oAnnotation = oProperty["com.sap.vocabularies.Common.v1.SemanticObject"];
			}
			return this._prepareSemanticObjectAnnotationFromProperty(oAnnotation);
		}
		return null;
	};

	/**
	 * Retrieves the default SemanticObject and additional SemanticObjects from Annotation for the specified property/target.
	 *
	 * @param {string} sPath the full path of the property/target (including the namespace)
	 * @returns {object | undefined} the resolved semanticObject annotation object (if any)
	 * @private
	 */
	MetadataAnalyser.prototype.getSemanticObjectsFromAnnotation = function(sPath) {
		if (!sPath || !this._oMetaModel) {
			return null;
		}
		// Note: slash inside of namespace is not allowed due to OData specification:
		// http://docs.oasis-open.org/odata/odata/v4.0/errata03/os/complete/part3-csdl/odata-v4.0-errata03-os-part3-csdl-complete.html#_Namespace
		var aPath = sPath.split("/");
		// The type could either be an entity type or a complex type
		var oType = this._oMetaModel.getODataEntityType(aPath[0]) || this._oMetaModel.getODataComplexType(aPath[0]);
		return MetadataAnalyser.getSemanticObjectsFromProperty(this._oMetaModel.getODataProperty(oType, aPath[1]));
	};

	/**
	 * Retrieves the default SemanticObject and other SemanticObjects for the specified annotations.
	 *
	 * @param {object} oProperty the given OData property
	 * @returns {object | undefined} the resolved semanticObject annotation object (if any)
	 * @private
	 */
	MetadataAnalyser.getSemanticObjectsFromProperty = function(oProperty) {
		var oSemanticObjects = {
			defaultSemanticObject: undefined,
			additionalSemanticObjects: []
		};
		for ( var sAttr in oProperty) {
			if (sAttr === "com.sap.vocabularies.Common.v1.SemanticObject") {
				oSemanticObjects.defaultSemanticObject = oProperty[sAttr]["Path"] ? MetadataAnalyser._getSemanticObjectBindingPath(oProperty[sAttr]["Path"]) : oProperty[sAttr]["String"];
			} else if (sAttr.startsWith("com.sap.vocabularies.Common.v1.SemanticObject#")) {
				oSemanticObjects.additionalSemanticObjects.push(oProperty[sAttr]["String"]);
			}
		}
		return (oSemanticObjects.defaultSemanticObject || oSemanticObjects.additionalSemanticObjects.length > 0) ? oSemanticObjects : undefined;
	};

	MetadataAnalyser._getSemanticObjectBindingPath = function(sProperty) {
		return "{" + sProperty + "}";
	};

	/**
	 * Retrieves the SemanticObject Annotation for the specified property/target
	 *
	 * @param {object} oProperty the given OData property
	 * @returns {Object} the resolved semanticObject annotation object (if any)
	 * @public
	 */
	MetadataAnalyser.prototype.getSemanticObjectAnnotationFromProperty = function(oProperty) {
		var oAnnotation;

		if (oProperty) {
			oAnnotation = oProperty["com.sap.vocabularies.Common.v1.SemanticObject"];
			return this._prepareSemanticObjectAnnotationFromProperty(oAnnotation);
		}

		return null;
	};

	/**
	 * Prepares the semantic object annotation.
	 *
	 * @param {object} oAnnotation the original annotation
	 * @returns {object} the preparation result
	 * @private
	 */
	MetadataAnalyser.prototype._prepareSemanticObjectAnnotationFromProperty = function(oAnnotation) {
		var oResult, oResolvedAnnotation;

		if (oAnnotation) {
			oResult = oAnnotation["Path"] ? MetadataAnalyser._getSemanticObjectBindingPath(oAnnotation["Path"]) : oAnnotation["String"];
			if (oResult) {
				oResolvedAnnotation = {
					annotation: oAnnotation
				};
				oResolvedAnnotation.semanticObject = oResult;
			}
		}

		return oResolvedAnnotation;
	};

	MetadataAnalyser.prototype.getContactAnnotation = function(sBindingPath) {
		var oMetaContext = this._oMetaModel.getMetaContext(sBindingPath);
		var oProperty = oMetaContext.getProperty(oMetaContext.getPath());
		return oProperty["com.sap.vocabularies.Communication.v1.Contact"];
	};

	/**
	 * Returns the fully qualified name of an entity which is e.g. "com.sap.GL.ZAF.GL_ACCOUNT" from the specified type name.
	 *
	 * @param {string} sEntityTypeName - the entity Type name which needs to be converted
	 * @returns {string} - the fully qualified name for this entity
	 * @private
	 */
	MetadataAnalyser.prototype._getFullyQualifiedNameForEntity = function(sEntityTypeName) {
		var sNamespace, sResult;
		if (!sEntityTypeName) {
			return undefined;
		}
		// if entity type name already has a ".", just return it
		if (sEntityTypeName.indexOf(".") > -1) {
			return sEntityTypeName;
		}
		if (this._oSchemaDefinition) {
			sNamespace = this._oSchemaDefinition.namespace;
		}
		if (sNamespace && !(sEntityTypeName.indexOf(sNamespace) > -1)) {
			sResult = sNamespace + "." + sEntityTypeName;
		} else {
			sResult = sEntityTypeName;
		}
		return sResult;
	};

	/**
	 * Gets the result of the <code>ApplyMultiUnitBehaviorForSortingAndFiltering</code> annotation from the entity container.
	 *
	 * @public
	 * @returns {boolean} Whether multi-unit behavior is enabled via annotation
	 */
	MetadataAnalyser.prototype.getMultiUnitBehaviorEnabled = function() {
		var oEntityContainer = this._oMetaModel && this._oMetaModel.getODataEntityContainer();
		return MetadataAnalyser.isTermDefaultTrue(oEntityContainer && oEntityContainer["com.sap.vocabularies.Common.v1.ApplyMultiUnitBehaviorForSortingAndFiltering"]);
	};

	/**
	 * Identifies the com.sap.vocabularies.PDF.v1.Features annotation and returns
	 * a simple map of its properties. If the annotation cannot be found, the returned
	 * value is undefined.
	 *
	 * @returns {Object|undefined} Annotation representation or undefined
	 */
	MetadataAnalyser.prototype.getPDFSupportedAnnotation = function() {
		var sEntityContainerPath = this._oMetaModel && this._oMetaModel.getODataEntityContainer(true);
		var oPDFAnnotation = this._oMetaModel.getObject(sEntityContainerPath + "/com.sap.vocabularies.PDF.v1.Features");
		var oPDFSupportedAnnotation = {};
		for (var sKey in oPDFAnnotation) {
			var oValue = oPDFAnnotation[sKey];
			if (oValue.Bool) {
				oPDFSupportedAnnotation[sKey] = oValue.Bool === "true";
			} else if (oValue.String) {
				oPDFSupportedAnnotation[sKey] = oValue.String;
			} else if (oValue.Int) {
				oPDFSupportedAnnotation[sKey] = parseInt(oValue.Int);
			}
		}
		return oPDFAnnotation ?  oPDFSupportedAnnotation : undefined;
	};

	/**
	 * Gets the UI5 selection range option type based on Annotation type.
	 *
	 * @public
	 * @param {string} sType The Annotation type
	 * @returns {string} The UI5 type (if found)
	 */
	MetadataAnalyser.getSelectionRangeOptionType = function(sType) {
		return mSelectionRangeOptionType[sType];
	};
	/**
	 * Gets the UI5 selection range sign type based on Annotation type.
	 *
	 * @public
	 * @param {string} sType The Annotation type
	 * @returns {string} The UI5 type (if found)
	 */
	MetadataAnalyser.getSelectionRangeSignType = function(sType) {
		return mSelectionRangeSignType[sType];
	};

	/**
	 * Checks whether the given property is annotated with TextArrangement.
	 *
	 * @private
	 * @static
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a property is annotated with TextArrangement, <code>false</code> otherwise
	 */
	MetadataAnalyser.hasTextArrangementAnnotation = function(oProperty) {
		if (oProperty["com.sap.vocabularies.UI.v1.TextArrangement"] ||
		oProperty["com.sap.vocabularies.Common.v1.Text"] && oProperty["com.sap.vocabularies.Common.v1.Text"]["com.sap.vocabularies.UI.v1.TextArrangement"]) {
			return true;
		}
		return false;
	};

	/**
	 * Checks if type is numeric.
	 *
	 * @private
	 * @static
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a type is numeric, <code>false</code> otherwise
	 */
	MetadataAnalyser.isNumber = function(oProperty) {
		return !!oProperty && (oProperty.type === "Edm.Decimal" || oProperty.type === "Edm.Double" || oProperty.type === "Edm.Int16"
			|| oProperty.type === "Edm.Int32" || oProperty.type === "Edm.Int64" || oProperty.type === "Edm.Byte"
			|| oProperty.type === "Edm.Single" || (oProperty.type === "Edm.String" && this.isDigitSequence(oProperty)));
	};

	MetadataAnalyser._getSearchExpressionTypeOperations = function(){
		var oResult = {},
			sType =  MetadataAnalyser._getSearchExpressionType();

		oResult[sType] = MetadataAnalyser._getSearchExpressionRangeOperationsKeys();
		return oResult;
	};

	MetadataAnalyser._getSearchExpressionRangeOperationsKeys = function(){
		return [
			P13nConditionOperation.Contains,
			P13nConditionOperation.StartsWith,
			P13nConditionOperation.EndsWith
		];
	};

	MetadataAnalyser._getSearchExpressionType = function(){
		return "string";
	};

	/**
	 * Destroys the object
	 *
	 * @public
	 */
	MetadataAnalyser.prototype.destroy = function() {
		this.oModel = null;
		this._oMetaModel = null;
		this._oMetadata = null;
		this._oSchemaDefinition = null;
		this._sResourceRootUri = null;
		this.bIsDestroyed = true;
		this._oDummyAnnotationHelperContext = null;
	};

	return MetadataAnalyser;

}, /* bExport= */true);
