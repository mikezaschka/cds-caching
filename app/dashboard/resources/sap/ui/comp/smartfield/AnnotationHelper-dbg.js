/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Utility to access annotations for SmartField control. As a translation of OData V2 annotations to vocabulary-based OData V4 annotations
 * is applied this utility only considers V4 annotations.
 *
 * @name sap.ui.comp.smartfield.AnnotationHelper
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.29.0
 * @returns {sap.ui.comp.smartfield.AnnotationHelper} the annotation access class.
 */
sap.ui.define([], function() {
	"use strict";

	/**
	 * @private
	 * @constructor
	 */
	var AnnotationHelper = function() {
		// nothing to do here.
	};

	/**
	 * Calculates the value of the text annotation.
	 *
	 * @param {object} oProperty the OData property from the meta model for which to calculate the value of the text annotation
	 * @returns {string} the value of the text annotation, which can be <code>null</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getText = function(oProperty) {
		return this._getObject("com.sap.vocabularies.Common.v1.Text/Path", oProperty);
	};

	/**
	 * Gets the value of the text arrangement annotation.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @param {object} oEntityType the given entity set from the meta model
	 * @param {boolean} bIsValueListNoValidation is configured as <code>ValueListNoValidation</code> optional parameter
	 * @returns {string} <code>"idOnly"</code>, <code>"descriptionOnly"</code>, <code>"idAndDescription"</code>, <code>"descriptionAndId"</code>
	 * @public
	 */
	AnnotationHelper.prototype.getTextArrangement = function(oProperty, oEntityType, bIsValueListNoValidation) {
		var oEnumTextArrangement = null,
			oPropertyTextAnnotation = null;

		oPropertyTextAnnotation = this._getObject("com.sap.vocabularies.Common.v1.Text", oProperty);

		if (oPropertyTextAnnotation) {
			oEnumTextArrangement = oPropertyTextAnnotation["com.sap.vocabularies.UI.v1.TextArrangement"];
		}

		// Derive TextArrangement from the property (not nested in com.sap.vocabularies.Common.v1.Text)
		if (!oEnumTextArrangement) {
			oEnumTextArrangement = this._getObject("com.sap.vocabularies.UI.v1.TextArrangement", oProperty);
		}

		if (!oEnumTextArrangement) {
			oEnumTextArrangement = this._getObject("com.sap.vocabularies.UI.v1.TextArrangement", oEntityType);
		}

		if (bIsValueListNoValidation && !oEnumTextArrangement && oPropertyTextAnnotation && oPropertyTextAnnotation.Path) {
			for (var i = 0; i < oEntityType.property.length; i++) {
				if (oEntityType.property[i].name === oPropertyTextAnnotation.Path) {
					oPropertyTextAnnotation = oEntityType.property[i];
					var oTextAnnotation = this._getObject("com.sap.vocabularies.Common.v1.Text", oPropertyTextAnnotation);
					if (oTextAnnotation && !oTextAnnotation.navigationPath) {
						oEnumTextArrangement = oTextAnnotation["com.sap.vocabularies.UI.v1.TextArrangement"];
					}
					break;
				}
			}
		}

		if (oEnumTextArrangement && oEnumTextArrangement.EnumMember) {

			if (oEnumTextArrangement.EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst") {
				return "descriptionAndId";
			}

			if (oEnumTextArrangement.EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast") {
				return "idAndDescription";
			}

			if (oEnumTextArrangement.EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate") {
				return "idOnly";
			}

			if (oEnumTextArrangement.EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
				return "descriptionOnly";
			}
		}

		return null;
	};

	/**
	 * Calculates the value of the unit annotation.
	 *
	 * @param {object} oProperty the OData property from the meta model for which to calculate the value of the unit annotation
	 * @returns {string} the value of the unit annotation, which can be <code>null</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getUnit = function(oProperty) {
		return this._getObject("Org.OData.Measures.V1.ISOCurrency/Path", oProperty) || this._getObject("Org.OData.Measures.V1.Unit/Path", oProperty);
	};

	/**
	 * Calculates the value of the label annotation.
	 *
	 * @param {object} oProperty the OData property for which to calculate the value of the label annotation
	 * @returns {string} the value of the label annotation, which can be <code>null</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getLabel = function(oProperty) {
		var sLabel = this._getObject("com.sap.vocabularies.UI.v1.DataFieldWithUrl/Label/String", oProperty);
		return sLabel || this._getObject("com.sap.vocabularies.Common.v1.Label/String", oProperty);
	};

	/**
	 * Calculates the value of the label annotation from the value list.
	 *
	 * @param {object} oProperty the OData property for which to calculate the value of the label annotation from the value list
	 * @returns {string} the value of the label annotation, which can be <code>null</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getValueListLabel = function(oProperty) {
		return this._getObject("com.sap.vocabularies.Common.v1.ValueList/Label/String", oProperty);
	};

	/**
	 * Calculates the value of the placeholder annotation.
	 *
	 * @param {object} oProperty the OData property for which to calculate the value of the placeholder annotation
	 * @returns {string} the value of the placeholder annotation, which can be <code>null</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getPlaceholder = function(oProperty) {
		return this._getObject("com.sap.vocabularies.UI.v1.Placeholder/String", oProperty);
	};

	/**
	 * Checks whether the given property semantically addresses a currency.
	 *
	 * @param {object} oEdmAmountProperty A amount Entity Data Model (EDM) property
	 * @param {object} oEdmCurrencyProperty A currency Entity Data Model (EDM) property
	 * @returns {boolean} <code>true</code>, if a currency is addressed, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isCurrency = function(oEdmAmountProperty, oEdmCurrencyProperty) {
		return !!(oEdmCurrencyProperty && (oEdmCurrencyProperty["sap:semantics"] === "currency-code")) ||
				!!(oEdmAmountProperty && this._getObject("Org.OData.Measures.V1.ISOCurrency/Path", oEdmAmountProperty));
	};

	/**
	 * Calculates the value of the quickinfo annotation. e.q. usage as tooltip
	 *
	 * @param {object} oProperty the OData property from the meta model
	 * @returns {string} the value of the quickinfo annotation, which can be <code>null</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getQuickInfo = function(oProperty) {
		return this._getObject("com.sap.vocabularies.Common.v1.QuickInfo/String", oProperty);
	};

	/**
	 * Checks whether the given property needs to be masked. e.q. usage as password
	 *
	 * @param {object} oProperty the OData property from the meta model
	 * @returns {boolean} <code>true</code>, if masking is required, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isMasked = function(oProperty) {
		return (!!this._getObject("com.sap.vocabularies.Common.v1.Masked", oProperty));
	};

	/**
	 * Checks whether the given property supports the multi-line-text annotation
	 *
	 * @param {object} oProperty the OData property from the meta model
	 * @returns {boolean} <code>true</code>, if this annotation exists, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isMultiLineText = function(oProperty) {
		return (!!this._getObject("com.sap.vocabularies.UI.v1.MultiLineText", oProperty));
	};

	/**
	 * Checks whether the given property is static-mandatory.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a property is static-mandatory, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isStaticMandatory = function(oProperty) {
		var oFieldControl = this._getObject("com.sap.vocabularies.Common.v1.FieldControl", oProperty);
		if (oFieldControl && oFieldControl.EnumMember) {
			return (oFieldControl.EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Mandatory");
		}

		return false;
	};

	/**
	 * Checks whether the given property is static-optional.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a property is static-optional, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isStaticOptional = function(oProperty) {
		var oFieldControl = this._getObject("com.sap.vocabularies.Common.v1.FieldControl", oProperty);
		if (oFieldControl && oFieldControl.EnumMember) {
			return (oFieldControl.EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Optional");
		}

		return false;
	};
	/**
	 * Checks whether the given property is nullable.
	 *
	 * @param {object} oProperty The OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a property is nullable, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isNullable = function(oProperty) {
		var oNullable = this._getObject("nullable", oProperty);
		if (oNullable) {
			return (oNullable === "true");
		}
		return true;
	};

	/**
	 * Checks whether the given property requires a conversion of its value to upper case.
	 *
	 * @param {object} oProperty the OData property from the meta model
	 * @returns {boolean} <code>true</code>, if a conversion to upper case is required, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.isUpperCase = function(oProperty) {
		return (this._getObject("com.sap.vocabularies.Common.v1.IsUpperCase/Bool", oProperty) === "true");
	};

	/**
	 * Checks whether creating an entity set is statically enabled.
	 *
	 * @param {object} oEntitySet the given entity set from the meta model
	 * @returns {boolean} <code>true</code>, if creating an entity set is statically enabled, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.canCreateEntitySet = function(oEntitySet) {
		return !(this._getObject("Org.OData.Capabilities.V1.InsertRestrictions/Insertable/Bool", oEntitySet) === "false");
	};

	/**
	 * Checks whether creating a property is statically enabled.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @returns {boolean} <code>true</code>, if creating a property is statically enabled, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.canCreateProperty = function(oProperty) {
		//note: for property there are combinations with updatable
		var oImmutable = this._getObject("Org.OData.Core.V1.Immutable/Bool", oProperty);
		var oComputed  = this._getObject("Org.OData.Core.V1.Computed/Bool", oProperty);


		if (oComputed) {//computed is stronger then immutable and implies immutable
			return oComputed == "false";
		}

		if (oImmutable) {
			return  oImmutable == "true";
		}

		return true;
	};

	/**
	 * Checks whether updating an entity set is statically enabled.
	 *
	 * @param {object} oEntitySet the given entity set from the meta model
	 * @returns {boolean} <code>true</code>, if updating an entity set is statically enabled, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.canUpdateEntitySet = function(oEntitySet) {
		return !(this._getObject("Org.OData.Capabilities.V1.UpdateRestrictions/Updatable/Bool", oEntitySet) === "false");
	};

	/**
	 * Checks whether updating an entity set is statically enabled.
	 *
	 * @param {object} oEntitySet the given entity set from the meta model
	 * @returns {string} the path of the field control property.
	 * @public
	 */
	AnnotationHelper.prototype.getUpdateEntitySetPath = function(oEntitySet) {
		return this._getObject("Org.OData.Capabilities.V1.UpdateRestrictions/Updatable/Path", oEntitySet);
	};

	/**
	 * Checks whether updating a property is statically enabled.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @returns {boolean} <code>true</code>, if updating a property is statically enabled, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.canUpdateProperty = function(oProperty) {
		var bNo = (this._getObject("Org.OData.Core.V1.Computed/Bool", oProperty) === "true") || (this._getObject("Org.OData.Core.V1.Immutable/Bool", oProperty) === "true") || (this._getObject("com.sap.vocabularies.Common.v1.FieldControl/EnumMember", oProperty) === "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly");
		return !bNo;
	};

	/**
	 * Calculates the path of the field control property for a given property.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @returns {string} the path of the field control property.
	 * @public
	 */
	AnnotationHelper.prototype.getFieldControlPath = function(oProperty) {
		return this._getObject("com.sap.vocabularies.Common.v1.FieldControl/Path", oProperty);
	};

	/**
	 * Calculates the path of the UI.Hidden property for a given property.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @returns {string} the path of the field control property.
	 * @public
	 */
	AnnotationHelper.prototype.getUIHiddenPath = function(oProperty) {
		return this._getObject("com.sap.vocabularies.UI.v1.Hidden/Path", oProperty);
	};

	/**
	 * Checks whether the visibility of a property is statically modeled.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @returns {string} <code>true</code>, if a property is modeled as statically visible, <code>false</code> otherwise.
	 * @public
	 */
	AnnotationHelper.prototype.getVisible = function(oProperty) {
		// "sap:visible" no longer checked as there happened a lift in _ODataMetaModelUtils
		var sValue = this._getObject("com.sap.vocabularies.Common.v1.FieldControl/EnumMember", oProperty);

		if (sValue === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden") {
			return "false";
		}

		var oHidden = this._getObject("com.sap.vocabularies.UI.v1.Hidden", oProperty);

		// Due to metamodel getODataFunctionImport where UI.Hidden is not automagically enriched with default Bool="true"
		if (oHidden && typeof oHidden.Bool === "undefined" && typeof oHidden.Path === "undefined") {
			return "false";
		}

		if (oHidden && oHidden.Bool && !(oHidden.Bool == "false")) {
			return "false";
		}

		// return default.
		return "true";
	};

	/**
	 * Checks whether a property is marked as important.
	 *
	 * @param {object} oProperty the given property from the meta model
	 * @returns {sap.ui.comp.smartfield.Importance} The value of the <code>UI.Importance</code> property. If it is not explicitly set, this method returns '<code>low</code>.
	 * @public
	 */
	AnnotationHelper.prototype.getImportanceAnnotation = function(oProperty) {
		var sImportance,
			oImportance = this._getObject("com.sap.vocabularies.UI.v1.Importance", oProperty);

        if (oImportance) {
			sImportance = oImportance.EnumMember;
        }
		switch (sImportance) {
			case "com.sap.vocabularies.UI.v1.ImportanceType/High":
				return "High";
			case "com.sap.vocabularies.UI.v1.ImportanceType/Medium":
				return "Medium";
			default:
				return "Low";
		}
	};

	/**
	 * Returns an object that is addressed by a given path. If no object can be found <code>null</code> is returned.
	 *
	 * @param {string} sPath the path to address the object
	 * @param {object} oObject the object to start with
	 * @returns {object} the target object, can be <code>null</code>.
	 * @private
	 */
	AnnotationHelper.prototype._getObject = function(sPath, oObject) {
		var oNode = oObject, aParts = sPath.split("/"), iIndex = 0;

		while (oNode && aParts[iIndex]) {
			oNode = oNode[aParts[iIndex]];
			iIndex++;
		}

		return oNode;
	};

	AnnotationHelper.prototype.destroy = function() {
		// nothing to do here.
	};

	return AnnotationHelper;
}, true);
