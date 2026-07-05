/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Utility class to access OData metadata.
 *
 * @name sap.ui.comp.smartfield.ODataHelper
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @returns {sap.ui.comp.smartfield.ODataHelper} the new instance.
 */
sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/ui/comp/odata/AnalyticalAnalyser",
	"sap/ui/comp/smartfield/AnnotationHelper",
	"sap/base/Log",
	"sap/ui/model/odata/_ODataMetaModelUtils",
	"sap/ui/model/odata/ODataUtils",
	"sap/base/assert"
], function(
	library,
	MetadataAnalyser,
	AnalyticalAnalyser,
	Annotation,
	Log,
	ODataMetaModelUtils,
	ODataUtils,
	assert) {
	"use strict";

	var TextArrangementType = library.TextArrangementType;

	/**
	 * @private
	 * @constructor
	 * @param {sap.ui.model.odata.ODataModel} oModel the OData model currently used
	 * @param {sap.ui.comp.smartfield.BindingUtil} oUtil a reference to the binding utility
	 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel the given OData meta model
	 * @param {boolean} bIsAnalytical determines if the analytical extension of MetadataAnalyser should be used
	 */
	var ODataHelper = function(oModel, oUtil, oMetaModel, bIsAnalytical) {
		if (oModel) {
			this.oMeta = oModel.getMetaModel();
		}

		if (oMetaModel) {
			this.oMeta = oMetaModel;
		}

		this._oModel = oModel;
		this._oUtil = oUtil;
		this.oAnnotation = new Annotation();
		this.bIsAnalytical = bIsAnalytical;
	};

	/**
	 * Returns a reference to the metadata analyzer and creates it lazily.
	 *
	 * @param {object} [oModel] The model instance
	 * @returns {sap.ui.comp.odata.MetaDataAnalyser} metadata analyzer. It maybe also the metadata analyzer analytical extension
	 * @public
	 */
	ODataHelper.prototype.getAnalyzer = function(oModel) {
		if (!this._oAnalyzer) {
			if (this.bIsAnalytical) {
				this._oAnalyzer = new AnalyticalAnalyser(this._oModel || oModel);
			} else {
				this._oAnalyzer = new MetadataAnalyser(this._oModel || oModel);
			}
		}

		return this._oAnalyzer;
	};

	/**
	 * Checks whether the current path contains a sequence of navigation properties and corrects the current metadata accordingly. Especially the
	 * optional property <code>navigationPath</code> is added to the metadata.
	 *
	 * @param {object} oMetaData the metadata used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {sap.ui.core.Control} oControl the control
	 * @public
	 */
	ODataHelper.prototype.checkNavigationProperty = function(oMetaData, oControl) {
		var mPaths, sPath, len, oResult;

		if (oControl && oMetaData) {
			mPaths = this._oUtil.getNavigationProperties(oControl);
			len = mPaths.paths.length;

			while (len--) {
				sPath = mPaths.paths.shift();
				sPath = this._oUtil.correctPath(sPath);

				if (sPath === "" || sPath === oMetaData.entitySet.name) {
					continue;
				}

				oResult = this.getNavigationProperty(oMetaData.entityType, sPath);

				if (oResult.entitySet) {
					oMetaData.entitySet = oResult.entitySet;
					oMetaData.entityType = oResult.entityType;
				}
			}
		}
	};

	/**
	 * Checks whether a path addresses a navigation property and returns the target entity set and entity type, if this is the case.
	 *
	 * @param {object} oEntityType the OData entity type definition
	 * @param {string} sPath the binding path
	 * @returns {object} the target entity set and entity type.
	 * @public
	 */
	ODataHelper.prototype.getNavigationProperty = function(oEntityType, sPath) {
		var oNavi = this._getNamedProperty(sPath, "navigationProperty", oEntityType),
			oTarget,
			oAssociation,
			oResult = {};

		if (oNavi) {
			oTarget = this.oMeta.getODataAssociationSetEnd(oEntityType, oNavi.name);

			if (oTarget === null) {
				return;
			}

			oAssociation = this.getAssociation(oEntityType, oNavi.name);
			if (oAssociation) {
				oResult.toRoleAssociationEndMultiplicity = this.getToRoleAssociationEndMultiplicity(
					oAssociation.end,
					oNavi.toRole
				);
			}

			oResult.entitySet = this.oMeta.getODataEntitySet(oTarget.entitySet);

			if (oResult.entitySet) {
				oResult.entityType = this.oMeta.getODataEntityType(oResult.entitySet.entityType);
			}
		}

		return oResult;
	};

	/**
	 * Checks whether a given paths starts with a navigation property.
	 *
	 * @param {string} sPath the given path.
	 * @param {object} oMetaData the metadata used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {string} the first navigation property, if the given paths starts with a navigation property, <code>null</code> otherwise
	 * @public
	 */
	ODataHelper.prototype.startWithNavigationProperty = function(sPath, oMetaData) {
		var aPath = sPath.split("/"), oProperty;

		if (aPath && aPath.length > 1) {
			oProperty = this._getNamedProperty(aPath.shift(), "navigationProperty", oMetaData.entityType);
		}

		if (oProperty) {
			return oProperty.name;
		}

		return null;
	};

	/**
	 * Calculates the definition of a property of an entity type.
	 *
	 * @param {object} oMetaData the metadata used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @public
	 */
	ODataHelper.prototype.getProperty = function(oMetaData) {
		var aNavigation = [], len, aProp, oProp, sPart, sPath, oResult = {
			entityType: oMetaData.entityType,
			entitySet: oMetaData.entitySet
		};

		if (oMetaData) {
			aProp = oMetaData.path.split("/");
			len = aProp.length;

			// check for navigation properties.
			if (oResult && len > 1) {
				while (oResult && oResult.entityType) {
					sPart = aProp[0];
					oResult = this.getNavigationProperty(oResult.entityType, sPart);

					if (oResult && oResult.entityType) {
						oMetaData.entityType = oResult.entityType;
						oMetaData.entitySet = oResult.entitySet;
						oMetaData.toRoleAssociationEndMultiplicity = oResult.toRoleAssociationEndMultiplicity;
						aNavigation.push(aProp.shift());
						len--;
					}
				}
			}

			// add navigation path
			oMetaData.navigationPath = aNavigation.join("/");

			// property can be complex.
			if (len > 1) {
				oProp = this.oMeta.getODataProperty(oMetaData.entityType, aProp[0]);

				// property name may be invalid: check for existing prop to avoid exceptions
				if (oProp) {
					oMetaData.property = this._getComplex(oProp, aProp, len);
				}

				return;
			}

			// simple property (can be with and without navigation path)
			if (oMetaData.navigationPath) {
				sPath = oMetaData.path.replace(oMetaData.navigationPath + "/", "");
			} else {
				sPath = oMetaData.path;
			}

			oProp = this.oMeta.getODataProperty(oMetaData.entityType, sPath);
			oMetaData.property = {
				property: oProp,
				typePath: oMetaData.path,
				valueListAnnotation: null,
				valueListKeyProperty: null,
				valueListEntitySet: null,
				valueListEntityType: null
			};
		}
	};

	/**
	 * Returns a complex property.
	 *
	 * @param {object} oProperty the object
	 * @param {array} aProp the path to the OData property
	 * @param {int} iLen the length of the path to the OData property
	 * @returns {object} the complex property
	 * @private
	 */
	ODataHelper.prototype._getComplex = function(oProperty, aProp, iLen) {
		var oObject = oProperty, sTypePath, aComplex = [];

		while (iLen--) {
			if (oObject) {
				if (iLen === 0) {
					sTypePath = oObject.name;
					oObject = this._getNamedProperty(aProp[0], "property", oObject);

					return {
						typePath: sTypePath + "/" + aProp[0],
						property: oObject,
						complex: true,
						parents: aComplex
					};
				}

				oObject = this.oMeta.getODataComplexType(oObject.type);

				if (oObject) {
					aComplex.push(oObject);
				}
			}

			aProp.shift();
		}
	};

	/**
	 * Returns a named property.
	 *
	 * @param {string} sName the name
	 * @param {string} sArray the name of the array to scan for the property
	 * @param {object} oProperty the object
	 * @returns {object} the named property, can be <code>null</code>
	 * @private
	 */
	ODataHelper.prototype._getNamedProperty = function(sName, sArray, oProperty) {
		var oResult;

		if (oProperty[sArray]){
			for (var i = 0; i < oProperty[sArray].length; i++ ){
				if (oProperty[sArray][i].name === sName) {
					oResult = oProperty[sArray][i];
					break;
				}
			}
		}

		return oResult;
	};

	/**
	 * Checks whether an OData property has a <code>text</code> annotation and adds it to the available metadata.
	 *
	 * @param {object} oMetaDataIn the metadata used to create the control
	 * @param {object} oMetaDataIn.entitySet the OData entity set definition
	 * @param {object} oMetaDataIn.entityType the OData entity type definition
	 * @param {object} oMetaDataIn.property the OData property definition
	 * @param {string} oMetaDataIn.path the binding path
	 * @returns {object} the OData property representing the text annotation, if no text annotation is encountered, <code>null</code> is returned
	 * @public
	 */
	ODataHelper.prototype.getTextProperty2 = function(oMetaDataIn) {
		var sAnnotation, oMetaData;

		sAnnotation = this.oAnnotation.getText(oMetaDataIn.property.property);

		if (sAnnotation) {
			oMetaData = this._preprocAnnotation(sAnnotation, oMetaDataIn);
			this.getProperty(oMetaData);
			this._postprocAnnotation(oMetaData, oMetaDataIn);
		}

		return oMetaData;
	};

	/**
	 * Checks whether an OData property represents semantically a unit of measure, e.g. a currency, and returns its definition, if the property
	 * represents a unit of measure.
	 *
	 * @param {object} oMetaDataIn the metadata available
	 * @param {object} oMetaDataIn.entitySet the name of the OData entity set
	 * @param {object} oMetaDataIn.entityType the name of the OData entity type
	 * @returns {object} the OData property representing the unit, if no unit of measure is encountered, <code>null</code> is returned
	 * @public
	 */
	ODataHelper.prototype.getUnitOfMeasure2 = function(oMetaDataIn) {
		var sAnnotation, oMetaData;

		sAnnotation = this.oAnnotation.getUnit(oMetaDataIn.property.property);

		if (sAnnotation) {
			oMetaData = this._preprocAnnotation(sAnnotation, oMetaDataIn);
			this.getProperty(oMetaData);
			this._postprocAnnotation(oMetaData, oMetaDataIn);
		}

		return oMetaData;
	};

	/**
	 * Pre-processes an annotation.
	 *
	 * @param {string} sAnnotation the given annotation
	 * @param {object} oMetaDataIn the metadata available
	 * @param {object} oMetaDataIn.entitySet the name of the OData entity set
	 * @param {object} oMetaDataIn.entityType the name of the OData entity type
	 * @returns {object} the metadata representing the annotation
	 * @private
	 */
	ODataHelper.prototype._preprocAnnotation = function(sAnnotation, oMetaDataIn) {
		var sPath, oMetaData;

		// annotation can contain navigation properties: so get the entity type and set
		// additionally the navigation properties are exposed as "navigation path".
		oMetaData = this.traverseNavigationProperties(sAnnotation, oMetaDataIn.entityType);

		// set the entity set, if it is not returned from the traversal.
		if (!oMetaData.navigationPath) {
			oMetaData.entitySet = oMetaDataIn.entitySet;
		}

		// get the path identifying the property: it may contain complex types,
		// but we know the navigation properties.
		if (oMetaDataIn.navigationPath) {
			oMetaData.path = oMetaDataIn.path.replace(oMetaDataIn.navigationPath + "/", "");
		} else {
			oMetaData.path = oMetaDataIn.path;
		}

		if (oMetaData.navigationPath) {
			sPath = sAnnotation.replace(oMetaData.navigationPath + "/", "");
		} else {
			sPath = sAnnotation;
		}

		oMetaData.path = oMetaData.path.replace(oMetaDataIn.property.property.name, sPath);

		// make sure navigation path does not get lost, if after this method get property is invoked.
		if (oMetaData.navigationPath) {
			oMetaData.navigationPathHelp = oMetaData.navigationPath;
		}

		return oMetaData;
	};

	/**
	 * Post-processes an annotation.
	 *
	 * @param {object} oMetaData the new metadata
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaDataIn the metadata available
	 * @param {object} oMetaDataIn.entitySet the name of the OData entity set
	 * @param {object} oMetaDataIn.entityType the name of the OData entity type
	 * @private
	 */
	ODataHelper.prototype._postprocAnnotation = function(oMetaData, oMetaDataIn) {
		var sPath;

		// make sure navigation path does not get lost, if after this method get property is invoked.
		if (oMetaData.navigationPathHelp) {
			oMetaData.navigationPath = oMetaData.navigationPathHelp;
		}

		// now complete the navigation path of the new metadata.
		if (oMetaData.navigationPath) {
			sPath = oMetaData.navigationPath;
		} else {
			sPath = "";
		}

		if (oMetaDataIn.navigationPath) {
			if (sPath) {
				sPath = oMetaDataIn.navigationPath + "/" + sPath;
			} else {
				sPath = oMetaDataIn.navigationPath;
			}
		}

		oMetaData.navigationPath = sPath;

		// now correct the path of the new metadata, if necessary.
		if (oMetaData.navigationPath) {
			oMetaData.path = oMetaData.navigationPath + "/" + oMetaData.path;
		}
	};

	/**
	 * Traverses the navigation properties contained in a path.
	 *
	 * @param {string} sPath the given path
	 * @param {object} oEntityType the given entity type.
	 * @returns {object} the target entity set and entity type of the navigation properties
	 * @public
	 */
	ODataHelper.prototype.traverseNavigationProperties = function(sPath, oEntityType) {
		var oResult = {}, oResult1 = {}, aPath, sPart, len;

		aPath = sPath.split("/");
		len = aPath.length;
		oResult.entityType = oEntityType;
		oResult1.entityType = oEntityType;

		while (len--) {
			sPart = aPath.shift();

			if (sPart === "") {
				continue;
			}

			oResult1 = this.getNavigationProperty(oResult.entityType, sPart);

			if (!oResult1.entitySet) {
				break;
			}

			oResult.entityType = oResult1.entityType;
			oResult.entitySet = oResult1.entitySet;

			if (oResult.navigationPath) {
				oResult.navigationPath = oResult.navigationPath + "/" + sPart;
			} else {
				oResult.navigationPath = sPart;
			}
		}

		return oResult;
	};

	/**
	 * Calculates the value list annotation for the given property.
	 *
	 * @param {object} oMetaData the metadata available
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {object} the value list annotation or <code>null</code>
	 * @public
	 */
	ODataHelper.prototype.getValueListAnnotationPath = function(oMetaData) {
		var sPath, len,
			oEdmProperty = this.getEdmProperty(oMetaData),
			sEdmPropertyName = oEdmProperty ? oEdmProperty.name : "";

		if (oMetaData && oMetaData.property && oMetaData.property.complex) {
			len = oMetaData.property.parents.length - 1;
			sPath = oMetaData.property.parents[len].namespace;
			sPath = sPath + "." + oMetaData.property.typePath;
		} else if (oMetaData && oMetaData.entitySet && oEdmProperty) {
			sPath = oMetaData.entitySet.entityType + "/" + sEdmPropertyName;
		}

		return sPath;
	};

	/**
	 * Calculates the value list annotation for the given property, if it represents a unit of measure, and adds it to the metadata as
	 * <code>valuelistuom</code> in the annotations.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.getUOMValueListAnnotationPath = function(oMetaData) {
		var sPath;

		if (oMetaData.annotations.uom) {
			sPath = this.getValueListAnnotationPath(oMetaData.annotations.uom);
		}

		if (sPath) {
			oMetaData.annotations.valuelistuom = sPath;
		}
	};

	/**
	 * Calculates a possibly existing text annotation for the unit in a unit of measure field and add it, if it exists.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.getUOMTextAnnotation = function(oMetaData) {
		if (oMetaData && oMetaData.annotations && oMetaData.annotations.uom) {
			oMetaData.annotations.textuom = this.getTextProperty2(oMetaData.annotations.uom);
		}
	};

	/**
	 * Calculates the entity set a value list annotation for the given property points to and adds it to the metadata as
	 * <code>valuelistentityset</code> in the annotations.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.geValueListEntitySet = function(oMetaData) {
		if (oMetaData && oMetaData.annotations && oMetaData.annotations.valuelist) {
			if (oMetaData.annotations.valuelist.primaryValueListAnnotation && oMetaData.annotations.valuelist.primaryValueListAnnotation.valueListEntitySetName) {
				oMetaData.annotations.valuelistentityset = this.oMeta.getODataEntitySet(oMetaData.annotations.valuelist.primaryValueListAnnotation.valueListEntitySetName);
			}
		}
	};

	/*
	 * Gets the metadata property.
	 *
	 * @returns {object} The metadata property
	 * @protected
	 * @since 1.48
	 */
	ODataHelper.prototype.getEdmProperty = function(oMetaData) {
		var oMetadataProperty = oMetaData.property;

		return (oMetadataProperty && oMetadataProperty.property) || null;
	};

	/**
	 * Adds the value list data to the given metadata.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.getValueListData = function(oMetaData) {
		var oMetadataProperty = this.getEdmProperty(oMetaData),
			oAnnotations = oMetaData.annotations;

		if (MetadataAnalyser.isValueList(oMetadataProperty)) {
			oAnnotations.valuelist = this.getValueListAnnotationPath(oMetaData);

			var sValueList = MetadataAnalyser.getValueListMode(oMetadataProperty);

			if (sValueList) {
				oAnnotations.valuelistType = sValueList;
			} else {
				oAnnotations.valuelistType = this.getAnalyzer().getValueListSemantics(oMetadataProperty["com.sap.vocabularies.Common.v1.ValueList"]);
			}
		}
	};

	ODataHelper.prototype.findProperty = function(aProperties, sPropertyName) {
		return ODataMetaModelUtils.findObject(aProperties, sPropertyName);
	};

	ODataHelper.prototype.getAssociation = function(oEntityType, sName) {
		var oNavigationProperty;

		if (oEntityType) {
			oNavigationProperty = this.findProperty(oEntityType.navigationProperty, sName);
		}

		if (oNavigationProperty && this.oMeta.oModel) {
			return ODataMetaModelUtils.getObject(this.oMeta.oModel, "association", oNavigationProperty.relationship);
		}

		return null;
	};

	ODataHelper.prototype.getToRoleAssociationEnd = function(aAssociationEnd, sNavigationPropertyToRole) {
		if (Array.isArray(aAssociationEnd)) {

			for (var i = 0; i < aAssociationEnd.length; i++) {
				var oAssociationEnd = aAssociationEnd[i];

				if (oAssociationEnd.role === sNavigationPropertyToRole) {
					return oAssociationEnd;
				}
			}
		}

		return null;
	};

	ODataHelper.prototype.getToRoleAssociationEndMultiplicity = function(aAssociationEnd, sNavigationPropertyToRole) {
		var oAssociationEnd = this.getToRoleAssociationEnd(aAssociationEnd, sNavigationPropertyToRole);
		return oAssociationEnd ? oAssociationEnd.multiplicity : "";
	};

	ODataHelper.prototype.checkNavigationPropertyRequiredMetadata = function(oMetadata) {
		var sEdmPropertyName = oMetadata.propertyName,
			oTextAnnotation = oMetadata.textAnnotation,
			sTextAnnotationPropertyPath = oTextAnnotation ? oTextAnnotation.Path : "",
			oEntityType = oMetadata.entityType,
			sEntityTypeQualifiedName = oEntityType.namespace + "." + oEntityType.name,
			COMPONENT = "sap.ui.comp.smartfield.ODataHelper",
			TEXT_ANNOTATION_TERM = "com.sap.vocabularies.Common.v1.Text";

		// If the Text annotation is NOT specified in the service metadata document or annotation file.
		if (!oTextAnnotation) {
			Log.info('Missing "' + TEXT_ANNOTATION_TERM + '" annotation for "' + sEdmPropertyName + '" EDM property of "' +
				sEntityTypeQualifiedName + '" entity type.', COMPONENT);
			return false;
		}

		// If the Path attribute of the Text annotation is NOT specified in the service metadata document or annotation file.
		if (sTextAnnotationPropertyPath === undefined) {
			assert(false, 'Missing "Path" attribute of "' + TEXT_ANNOTATION_TERM + '" annotation for "' +
				sEdmPropertyName + '" EDM property of "' + sEntityTypeQualifiedName + '" entity type. - ' + COMPONENT);
			return false;
		}

		// If the path URL name of the Text annotation is NOT specified in the service metadata document or annotation file.
		if (sTextAnnotationPropertyPath === "") {
			assert(false, 'Missing URL path name of "' + TEXT_ANNOTATION_TERM + '" annotation for "' + sEdmPropertyName +
				'" EDM property of "' + sEntityTypeQualifiedName + '" entity type. - ' + COMPONENT);
			return false;
		}

		var sTextArrangementTerm = "com.sap.vocabularies.UI.v1.TextArrangement",
			oTextArrangementAnnotation = oTextAnnotation[sTextArrangementTerm];

		// If the TextArrangement annotation is NOT specified in the service metadata document or annotation file.
		if (!oTextArrangementAnnotation) {
			Log.info('Missing "' + sTextArrangementTerm + '" annotation for "' + sEdmPropertyName + '" EDM property of "' +
				sEntityTypeQualifiedName + '" entity type.', COMPONENT);
			return false;
		}

		var vTextArrangementEnumMember = oTextArrangementAnnotation.EnumMember;

		// If the "EnumMember" attribute of the TextArrangement annotation is NOT specified in the
		// service metadata document or annotation file.
		if (vTextArrangementEnumMember === undefined) {
			assert(false, 'Missing "EnumMember" attribute of "' + sTextArrangementTerm + '" annotation for "' +
				sEdmPropertyName + '" EDM property of "' + sEntityTypeQualifiedName + '" entity type. - ' + COMPONENT);
			return false;
		}

		// If the "EnumMember" attribute of the TextArrangement annotation is invalid
		if (!(vTextArrangementEnumMember.split("/")[1] in TextArrangementType)) {
			assert(false, 'Invalid "' + vTextArrangementEnumMember + '" Text annotation enumeration member for "' +
				sEdmPropertyName + '" EDM property of "' + sEntityTypeQualifiedName + '" entity type. - ' + COMPONENT);
			return false;
		}

		// If the "EnumMember" attribute of the TextArrangement annotation is set to "TextSeparate" (ID only case)
		if (oTextArrangementAnnotation.EnumMember === TextArrangementType.TextSeparate) {
			return false;
		}

		// If the navigation property URL path name specified in the path attribute of the Text annotation where
		// the text is fetched does NOT contain a "/".
		// Sample of a valid navigation property URL path name => "to_ProductCategories/Description".
		if (sTextAnnotationPropertyPath.indexOf("/") === -1) {
			assert(false, 'Invalid navigation property URL path name specified in the "' + TEXT_ANNOTATION_TERM +
				'" annotation of the "' + sEdmPropertyName + '" EDM property of the "' + sEntityTypeQualifiedName +
				'" entity type. - ' + COMPONENT);
			return false;
		}

		var sNavigationPropertyName = sTextAnnotationPropertyPath.split("/")[0],
			oNavigationProperty = this.findProperty(oEntityType.navigationProperty, sNavigationPropertyName);

		if (!oNavigationProperty) {
			assert(false, 'The navigation property URL path name "' + sNavigationPropertyName +
				'" (specified in the Text annotation of the "' + sEdmPropertyName + '" EDM property) was not found in the "' +
				sEntityTypeQualifiedName + '" entity type of the service metadata document. - ' + COMPONENT);
			return false;
		}

		var oAssociation = this.getAssociation(oEntityType, sNavigationPropertyName);

		if (!oAssociation) {
			assert(false, 'Missing "' + oNavigationProperty.relationship + '" association for "' + oNavigationProperty.name +
				'" EDM navigation property of the "' + sEntityTypeQualifiedName + '" entity type. - ' + COMPONENT);
			return false;
		}

		var oReferentialConstraint = oAssociation.referentialConstraint;

		// If referential integrity is NOT enforced.
		if (!oReferentialConstraint) {
			assert(false, 'Missing referential constraint for "' + oNavigationProperty.relationship +
				'" association in the service metadata document. - ' + COMPONENT);
			return false;
		}

		if (!Array.isArray(oAssociation.end) || !(oAssociation.end.length > 0)) {
			assert(false, 'Missing association end for "' + oNavigationProperty.relationship +
				'" association in the service metadata document. - ' + COMPONENT);
			return false;
		}

		var sToRoleAssociationEndMultiplicity = this.getToRoleAssociationEndMultiplicity(oAssociation.end, oNavigationProperty.toRole);

		// If the "toRole" association end multiplicity is NOT 1.
		if (sToRoleAssociationEndMultiplicity !== "1") {
			assert(false, 'Expected multiplicity of 1 for "' + oNavigationProperty.toRole + '" association end of the "' +
				oNavigationProperty.relationship + '" association in the service metadata document. - ' + COMPONENT);
			return false;
		}

		if ((oReferentialConstraint.principal.propertyRef.length !== 1) || (oReferentialConstraint.dependent.propertyRef.length !== 1)) {
			assert(false, 'Expected the single "' + sEdmPropertyName + '" foreign key EDM property as ' +
				'referential constraint in the "' + oNavigationProperty.relationship + '" association. - ' + COMPONENT);
			return false;
		}

		var oEntityTypeOfNavigationProperty = oMetadata.entityTypeOfNavigationProperty || this.getNavigationProperty(oEntityType, sNavigationPropertyName).entityType;

		// If the lookup entity type does NOT contain a single key property.
		if (oEntityTypeOfNavigationProperty.key.propertyRef.length !== 1) {
			assert(false, 'Expected a single key property in the lookup "' + oEntityTypeOfNavigationProperty.namespace + "." +
				oEntityTypeOfNavigationProperty.name + '" entity type. - ' + COMPONENT);
			return false;
		}

		var sReferentialConstraintPrincipalPropertyName = oReferentialConstraint.principal.propertyRef[0].name;

		// If the principal property name in the referential constraint does not match with the single key property name
		// of the lookup entity type.
		if (sReferentialConstraintPrincipalPropertyName !== oEntityTypeOfNavigationProperty.key.propertyRef[0].name) {
			assert(false, 'Expected a property named "' + sReferentialConstraintPrincipalPropertyName +
				'" to be the single key property in the lookup "' + oEntityTypeOfNavigationProperty.namespace + "." +
				oEntityTypeOfNavigationProperty.name + '" entity type. - ' + COMPONENT);
			return false;
		}

		return true;
	};
	ODataHelper.prototype.checkNavigationPropertyRequiredMetadataNoAsserts = function(oMetadata) {
		var oTextAnnotation = oMetadata.textAnnotation,
			sTextAnnotationPropertyPath = oTextAnnotation ? oTextAnnotation.Path : "",
			oEntityType = oMetadata.entityType;

		// If the Text annotation is NOT specified in the service metadata document or annotation file.
		if (!oTextAnnotation) {
			return false;
		}

		// If the Path attribute of the Text annotation is NOT specified in the service metadata document or annotation file.
		if (sTextAnnotationPropertyPath === undefined) {
			return false;
		}

		// If the path URL name of the Text annotation is NOT specified in the service metadata document or annotation file.
		if (sTextAnnotationPropertyPath === "") {
			return false;
		}

		var sTextArrangementTerm = "com.sap.vocabularies.UI.v1.TextArrangement",
			oTextArrangementAnnotation = oTextAnnotation[sTextArrangementTerm];

		// If the TextArrangement annotation is NOT specified in the service metadata document or annotation file.
		if (!oTextArrangementAnnotation) {
			return false;
		}

		var vTextArrangementEnumMember = oTextArrangementAnnotation.EnumMember;

		// If the "EnumMember" attribute of the TextArrangement annotation is NOT specified in the
		// service metadata document or annotation file.
		if (vTextArrangementEnumMember === undefined) {
			return false;
		}

		// If the "EnumMember" attribute of the TextArrangement annotation is invalid
		if (!(vTextArrangementEnumMember.split("/")[1] in TextArrangementType)) {
			return false;
		}

		// If the "EnumMember" attribute of the TextArrangement annotation is set to "TextSeparate" (ID only case)
		if (oTextArrangementAnnotation.EnumMember === TextArrangementType.TextSeparate) {
			return false;
		}

		// If the navigation property URL path name specified in the path attribute of the Text annotation where
		// the text is fetched does NOT contain a "/".
		// Sample of a valid navigation property URL path name => "to_ProductCategories/Description".
		if (sTextAnnotationPropertyPath.indexOf("/") === -1) {
			return false;
		}

		var sNavigationPropertyName = sTextAnnotationPropertyPath.split("/")[0],
			oNavigationProperty = this.findProperty(oEntityType.navigationProperty, sNavigationPropertyName);

		if (!oNavigationProperty) {
			return false;
		}

		var oAssociation = this.getAssociation(oEntityType, sNavigationPropertyName);

		if (!oAssociation) {
			return false;
		}

		var oReferentialConstraint = oAssociation.referentialConstraint;

		// If referential integrity is NOT enforced.
		if (!oReferentialConstraint) {
			return false;
		}

		if (!Array.isArray(oAssociation.end) || !(oAssociation.end.length > 0)) {
			return false;
		}

		var sToRoleAssociationEndMultiplicity = this.getToRoleAssociationEndMultiplicity(oAssociation.end, oNavigationProperty.toRole);

		// If the "toRole" association end multiplicity is NOT 1.
		if (sToRoleAssociationEndMultiplicity !== "1") {
			return false;
		}

		if ((oReferentialConstraint.principal.propertyRef.length !== 1) || (oReferentialConstraint.dependent.propertyRef.length !== 1)) {
			return false;
		}

		var oEntityTypeOfNavigationProperty = oMetadata.entityTypeOfNavigationProperty || this.getNavigationProperty(oEntityType, sNavigationPropertyName).entityType;

		// If the lookup entity type does NOT contain a single key property.
		if (oEntityTypeOfNavigationProperty.key.propertyRef.length !== 1) {
			return false;
		}

		var sReferentialConstraintPrincipalPropertyName = oReferentialConstraint.principal.propertyRef[0].name;

		// If the principal property name in the referential constraint does not match with the single key property name
		// of the lookup entity type.
		if (sReferentialConstraintPrincipalPropertyName !== oEntityTypeOfNavigationProperty.key.propertyRef[0].name) {
			return false;
		}

		return true;
	};

	ODataHelper.prototype.checkValueListRequiredMetadataForTextArrangmentNoAsserts = function(oMetadata) {
		var oValueListAnnotation = oMetadata.valueListAnnotation;

		// If the ValueList annotation is NOT specified in the service metadata document or annotation file.
		if (!oValueListAnnotation) {
			return false;
		}

		// If the ValueList annotation does NOT contains fields
		if (!Array.isArray(oValueListAnnotation.fields)) {
			return false;
		}

		var sDescriptionFieldName = oValueListAnnotation.descriptionField,
			oValueListField = this.findProperty(oValueListAnnotation.fields, sDescriptionFieldName);

		if (!oValueListField) {
			return false;
		}

		if (oValueListField["sap:filterable"] === "false") {
			return false;
		}

		return true;
	};

	ODataHelper.prototype.checkValueListRequiredMetadataForTextArrangment = function(oMetadata) {
		var oValueListAnnotation = oMetadata.valueListAnnotation,
			COMPONENT = "sap.ui.comp.smartfield.ODataHelper";

		// If the ValueList annotation is NOT specified in the service metadata document or annotation file.
		if (!oValueListAnnotation) {
			var oEntityType = oMetadata.entityType,
				sEntityTypeQualifiedName = oEntityType.namespace + "." + oEntityType.name;

			assert(false, 'Missing "ValueList" annotation for "' + oMetadata.propertyName + '" EDM property of "' +
				sEntityTypeQualifiedName + '" entity type. - ' + COMPONENT);
			return false;
		}

		// If the ValueList annotation does NOT contains fields
		if (!Array.isArray(oValueListAnnotation.fields)) {
			assert(false, 'Missing fields for "' + oValueListAnnotation.valueListEntityName + '" entity. - ' + COMPONENT);
			return false;
		}

		var sDescriptionFieldName = oValueListAnnotation.descriptionField,
			oValueListField = this.findProperty(oValueListAnnotation.fields, sDescriptionFieldName);

		if (sDescriptionFieldName !== undefined) {

			if (!oValueListField) {
				assert(false, 'The "' + sDescriptionFieldName + '" description field was not found ' +
					'in the service metadata document. - ' + COMPONENT);
				return false;
			}

			if (oValueListField["sap:filterable"] === "false") {
				assert(false, 'Expected the "' + oValueListField.fullName + '" field to be filterable. - ' + COMPONENT);
				return false;
			}

		}

		return true;
	};

	ODataHelper.prototype.checkValueListRequiredMetadataForValidation = function(oMetadata) {
		var oValueListAnnotation = oMetadata.valueListAnnotation;

		if (!oValueListAnnotation) {
			return false;
		}

		if (!Array.isArray(oValueListAnnotation.fields)) {
			return false;
		}

		return true;
	};

	/**
	 * Calculates the binding path for the <code>text</code> property for the display use case. If a Text annotation exists, it is considered,
	 * otherwise the binding path addresses the property.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {string} the binding path
	 * @public
	 */
	ODataHelper.prototype.getEdmDisplayPath = function(oMetaData) {
		var oTextAnnotation = oMetaData.annotations.text;

		if (oTextAnnotation) {
			return oTextAnnotation.path;
		}

		return oMetaData.path;
	};

	ODataHelper.prototype.getTextAnnotationPropertyPath = function(oTextAnnotation) {
		return oTextAnnotation ? oTextAnnotation.path : "";
	};

	/**
	 * Gets the absolute URL path name to the OData property of the value list entity specified in the <code>Path</code>
	 * attribute of the <code>com.sap.vocabularies.Common.v1.Text</code> annotation.
	 *
	 * @param {object} oSettings The settings
	 * @param {object} oSettings.property The property metadata
	 * @param {object} oSettings.bindingContextPath The binding context path to the value list entity
	 * @param {object} [oSettings.entitySet] The entity set metadata
	 * @param {object} [oSettings.entityID] The ID of the entity
	 * @returns {string} The absolute URL path name to a property of the value list entity
	 * @protected
	 */
	ODataHelper.prototype.getAbsolutePropertyPathToValueListEntity = function(oSettings) {
		var oValueListKeyProperty = oSettings.property,
			oValueListTextAnnotation = oValueListKeyProperty && oValueListKeyProperty["com.sap.vocabularies.Common.v1.Text"],
			sBindingContextPath = oSettings.bindingContextPath;

		if (
			typeof sBindingContextPath === "string" &&
			sBindingContextPath !== "" &&
			oValueListTextAnnotation
		) {
			return sBindingContextPath + "/" + oValueListTextAnnotation.Path;
		}
		// fallback in case the absolute binding path to the value list entity (sBindingContextPath) is unknown/undefined or empty

		var oValueListEntitySet = oSettings.entitySet,
			sEntityID = oSettings.entityID,
			vValue;

		// whether the variable sEntityID is null or undefined or "" (empty)
		if ((sEntityID == null) || (sEntityID === "")) {
			return "";
		}

		if (oValueListTextAnnotation && oValueListEntitySet) {

			// TODO: Remove when UI5 Guid Type is fixed. Guid type works only with upper case chars (due to v4) - v2 needs lower case chars.
			if (oSettings.property.type == "Edm.Guid") {
				vValue = oSettings.entityID.toLowerCase();
			} else {
				vValue = oSettings.entityID;
			}

			vValue = ODataUtils.formatValue(vValue, oSettings.property.type, true);
			return "/" + oValueListEntitySet.name + "(" + encodeURIComponent(vValue) + ")" + "/" + oValueListTextAnnotation.Path;
		}

		return "";
	};

	ODataHelper.prototype.getODataValueListKeyProperty = function(oValueListAnnotation) {
		for (var i = 0; i < oValueListAnnotation.fields.length; i++) {
			var oField = oValueListAnnotation.fields[i];

			if (oField.name === oValueListAnnotation.keyField) {
				return oField;
			}
		}
	};

	/**
	 * Calculates the binding path for the Unit of Measure.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model.
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {string} the binding path for the Unit of Measure text, which can be <code>null</code>
	 * @public
	 */
	ODataHelper.prototype.getUOMPath = function(oMetaData) {
		if (oMetaData && oMetaData.annotations && oMetaData.annotations.uom) {
			return oMetaData.annotations.uom.path;
		}

		return null;
	};

	/**
	 * Calculates the type path for the Unit of Measure.
	 *
	 * @param {object} oMetaData the metadata used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {string} the binding path for the Unit of Measure text, which can be <code>null</code>
	 * @public
	 */
	ODataHelper.prototype.getUOMTypePath = function(oMetaData) {

		if (oMetaData.property.complex) {
			return oMetaData.property.typePath.replace(oMetaData.property.property.name, oMetaData.annotations.uom.property.name);
		}

		return oMetaData.annotations.uom.property.name;
	};

	/**
	 * Returns an event handler for the change event of the dropdown controls.
	 *
	 * @param {sap.ui.core.Control} oControl the control which propagates the event
	 * @returns {function} handler for the change event
	 * @public
	 */
	ODataHelper.prototype.getDropdownChangeHandler = function(oControl, bAllowAnyValuePropagation) {
		return function(oEvent) {
			var sValue = "", bSelectionChange = false;

			try {
				if (bAllowAnyValuePropagation) {
					if (oControl.getFirstInnerControl && oControl.getFirstInnerControl().setEnteredValue) {

						oControl.getFirstInnerControl().setEnteredValue();
					}

					sValue = oEvent.getSource().getSelectedKey();
					bSelectionChange = sValue !== null;

					if (!bSelectionChange) {
						sValue = oEvent.getSource().getValue();
					}
				} else {
					var oItem = oEvent.getParameter("selectedItem");

					if (!oItem && oEvent.getSource().getSelectedItem) {
						oItem = oEvent.getSource().getSelectedItem();
					}

					if (oItem) {
						sValue = oItem.getKey();
						bSelectionChange = sValue !== null;
					}
				}

				oControl.fireChange({
					value: sValue,
					newValue: sValue,
					selectionChange: bSelectionChange
				});
			} catch (ex) {
				Log.warning(ex);
			}
		};
	};

	/**
	 * Extracts and applies the criticality information from
	 * the <code>DataFieldDefault</code>, <code>LineItem</code>, <code>DataPoint</code>, <code>FieldGroup</code> or <code>ConnectedFields</code> annotations
	 * which is then used during the initialization process to create the <code>ObjectStatus</code>.
	 *
	 * @param {object} oMetadata the metadata used to initialize the factory
	 * @param {string} sCriticalityQualifier specifies from which qualifier of the <code>DataPoint</code>, <code>FieldGroup</code> or <code>ConnectedFields</code> annotation the criticality should be taken
	 * @public
	 */
	ODataHelper.prototype.applyCriticality = function(oMetadata, sCriticalityQualifier) {
		var oEdmProperty = this.getEdmProperty(oMetadata),
			oLineItemAnnotation = oMetadata.annotations?.lineitem,
			oDataPointAnnotations = oMetadata.annotations?.datapoint,
			oFieldGroupAnnotations = oMetadata.annotations?.fieldgroup,
			oConnectedFieldsAnnotations = oMetadata.annotations?.connectedfields,
			oDataFieldDefaultAnnotation, oDataPointRecord, aAnnotationsContainer;

		if (!oEdmProperty) {
			return;
		}

		//Applying DataFieldDefault Criticality
		oDataFieldDefaultAnnotation = oEdmProperty["com.sap.vocabularies.UI.v1.DataFieldDefault"];

		if (oDataFieldDefaultAnnotation
			&& oDataFieldDefaultAnnotation.RecordType === "com.sap.vocabularies.UI.v1.DataField"
			&& oDataFieldDefaultAnnotation["Criticality"]) {
				oEdmProperty.criticalityInfo = this.getAnalyzer()._extractCriticalityInfo(oDataFieldDefaultAnnotation["Criticality"], oDataFieldDefaultAnnotation);
				oEdmProperty.criticalityInfo.criticalityFrom = "DataFieldDefault";
				return;
		}

		//Applying LineItem Criticality
		if (oLineItemAnnotation && oLineItemAnnotation.criticality && oLineItemAnnotation.criticality[oEdmProperty.name]) {
			oEdmProperty.criticalityInfo = oLineItemAnnotation.criticality[oEdmProperty.name];
			oEdmProperty.criticalityInfo.criticalityFrom = "LineItem";
			return;
		}

		//Applying DataPoint Criticality
		if (oDataPointAnnotations) {
			if (oDataPointAnnotations.primaryAnnotation && !sCriticalityQualifier) {
				oDataPointRecord = oDataPointAnnotations.primaryAnnotation;
			} else if (oDataPointAnnotations.additionalAnnotations) {
				oDataPointRecord = oDataPointAnnotations.additionalAnnotations[sCriticalityQualifier];
			}

			if (oDataPointRecord && oDataPointRecord?.Value?.Path === oEdmProperty.name && oDataPointRecord.Criticality) {
				oEdmProperty.criticalityInfo = this.getAnalyzer()._extractCriticalityInfo(oDataPointRecord.Criticality, oDataPointRecord);
				oEdmProperty.criticalityInfo.criticalityFrom = "DataPoint";
				return;
			}
		}

		//Applying FieldGroup or ConnectedFields Criticality
		aAnnotationsContainer = {"FieldGroup": oFieldGroupAnnotations, "ConnectedFields": oConnectedFieldsAnnotations};

		for (const aAnnotationGroup in aAnnotationsContainer) {
			const aAnnotations = aAnnotationsContainer[aAnnotationGroup];
			if (aAnnotations) {
				for (let i = 0; i < aAnnotations.length; i++) {
					const oCurrentAnnotation = aAnnotations[i];

					if ((!oCurrentAnnotation.groupName && !sCriticalityQualifier) || oCurrentAnnotation.groupName === sCriticalityQualifier) {
						if (oCurrentAnnotation.criticality && oCurrentAnnotation.criticality[oEdmProperty.name]) {
							oEdmProperty.criticalityInfo = oCurrentAnnotation.criticality[oEdmProperty.name];
							oEdmProperty.criticalityInfo.criticalityFrom = aAnnotationGroup;
							return;
						}
					}
				}
			}
		}
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	ODataHelper.prototype.destroy = function() {

		if (this._oAnalyzer) {
			this._oAnalyzer.destroy();
		}

		if (this.oAnnotation) {
			this.oAnnotation.destroy();
		}

		this._oUtil = null;
		this.oMeta = null;
		this.oAnalyzer = null;
		this.oAnnotation = null;
	};

	/**
	 * This method is used to scan the metadata annotations for hidden navigation properties and expand them in advance.
	 * This is done in order to be prepared for new fields on the view that may need these annotations.
	 *
	 * @param {object} oMetadataProperty - The metadata for this smart field control
	 * @returns {string} A comma separated list of auto expand properties
	 *
	 * @public
	 * @since 1.48
	 */
	ODataHelper.prototype.getAutoExpandProperties = function(oMetadataProperty) {
		var aNavigationProperties = [],
			aAsPath = [];

		for (var sAnnotation in oMetadataProperty) {
			switch (sAnnotation) {
				case "com.sap.vocabularies.Common.v1.Text":
				case "Org.OData.Measures.V1.Unit":
				case "Org.OData.Measures.V1.ISOCurrency":
				case "com.sap.vocabularies.Common.v1.FieldControl":

					if (oMetadataProperty[sAnnotation].Path) {
						aAsPath = oMetadataProperty[sAnnotation].Path.split("/");
					}

					break;

				// no default
			}

			if (aAsPath.length > 1 && aNavigationProperties.indexOf(aAsPath[0]) < 0) {
				aNavigationProperties.push(aAsPath[0]);
			}
		}

		return aNavigationProperties.join(",");
	};

	/**
	 * Loads the <code>ValueList</code> annotation of the <code>com.sap.vocabularies.Common.v1</code> vocabulary
	 * for the specified property's path.
	 * In addition, if the <code>ValueList</code> annotation cannot be loaded, an error message is logged in the console.
	 *
	 * @param {string} sPath The fully qualified URL path name of the property
	 * @returns {Promise} A <code>Promise</code> that is resolved once the <code>ValueList</code> annotation is
	 * loaded or rejected if the specified property path is incorrect or the <code>ValueList</code> could not be resolved
	 *
	 * @protected
	 * @since 1.52
	 */
	ODataHelper.prototype.loadValueListAnnotation = function(sPath, sBindingContextPath) {
		var oPromise = this.getAnalyzer().getValueListAnnotationLazy(sPath, sBindingContextPath);

		oPromise.catch(function() {
			Log.error("The value list annotation could not be loaded.", undefined, "sap.ui.comp.smartfield.ODataHelper.loadValueListAnnotation");
		});

		return oPromise;
	};

	/**
	 * Assigns the <code>DocumentationRef</code> to the specified control.
	 *
	 * This method links the provided documentation reference to the control.
	 *
	 * @param {sap.ui.core.Control} oControl The control to which the documentation reference will be set
	 * @param {object} oDocumentationRef The annotation object with a <code>String</code> property containing the documentation
	 *
	 * @private
	 * @since 1.136
	 */
	ODataHelper.prototype._setControlDocumentationRef = function(oControl, oDocumentationRef) {
		if (oDocumentationRef?.String && oControl) {
			sap.ui.require(["sap/ui/core/fieldhelp/FieldHelpUtil"], function (FieldHelpUtil) {
				FieldHelpUtil.setDocumentationRef(oControl, oDocumentationRef.String);
			});
		}
	};


	return ODataHelper;
}, true);
