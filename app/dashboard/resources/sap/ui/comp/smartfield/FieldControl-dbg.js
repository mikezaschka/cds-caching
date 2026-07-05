/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/smartfield/BindingUtil",
	"sap/ui/core/Lib",
	"sap/ui/model/ParseException",
	"sap/base/strings/capitalize",
	"sap/base/util/isPlainObject",
	"sap/ui/comp/library"
], function(
	BindingUtil,
	Library,
	ParseException,
	capitalize,
	isPlainObject,
	compLibrary
) {
	"use strict";

	// shortcut for sap.ui.comp.numericEdmTypes
	var NumericEdmTypes = compLibrary.numericEdmTypes;

	/**
	 * Utility class to support the <code>FieldControl</code> annotation.
	 *
	 * @param {sap.ui.comp.smartfield.SmartField} oParent the parent control.
	 * @param {sap.ui.comp.smartfield.ODataHelper} oHelper a reference to the oData helper implementation.
	 * @since 1.28.0
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @constructor
	 * @private
	 * @alias sap.ui.comp.smartfield.FieldControl
	 */
	var FieldControl = function(oParent, oHelper) {
		this._bIsDestroyed = false;
		this._oBinding = new BindingUtil();
		this._oStoredProperties = {};
		this._bVisibleSet = false;
		this._bEditableSet = false;
		this._bMandatorySet = false;
		this._bUomEditableSet = false;
		this._oStoredBindings = {};
		this._oParent = oParent;
		this._oHelper = oHelper;
		this._oAnnotation = oHelper.oAnnotation;
	};

	/**
	 * Gets the control properties names that can be bound to the <code>FieldControl</code>.
	 *
	 * @param {boolean} [bNoMandatory] flag indicating whether the mandatory attribute can be returned.
	 * @returns {array} The control properties names.
	 * @protected
	 */
	FieldControl.prototype.getPropertyNames = function(bNoMandatory) {

		if (bNoMandatory) {
			return [
				"editable", "visible"
			];
		}

		return [
			"editable", "visible", "mandatory"
		];
	};

	/**
	 * Returns formatter functions for the given control properties. The formatters use the given control property and its subordinate attributes.
	 * Each formatter consists of two function, one to calculate the binding paths and the formatter function itself.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {array} aPropertyNames The names of the properties to be bound, e.g. "editable", "mandatory" and "visible".
	 * @returns {object} formatter functions for the given control properties.
	 * @protected
	 */
	FieldControl.prototype.getControlFormatters = function(oMetaData, aPropertyNames) {
		var sMethod, len, sName, oResult = {};

		if (oMetaData && aPropertyNames) {
			len = aPropertyNames.length;

			while (len--) {
				sName = aPropertyNames[len];
				sMethod = "_get" + capitalize(sName);

				if (this[sMethod]) {
					oResult[sName] = this[sMethod](oMetaData, this._oParent.getBindingInfo(sName));
				}
			}
		}

		return oResult;
	};

	/**
	 * Returns formatter functions for the <code>editable</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {object} oBindingInfo the current binding of the property
	 * @param {string} [sProperty="editable"] the property
	 * @returns {object} formatter function for the given control attribute
	 * @private
	 */
	FieldControl.prototype._getEditable = function(oMetaData, oBindingInfo, sProperty) {
		if (sProperty === undefined) {
			sProperty = "editable";
		}

		var bParent,
			bParentInit = this._oParent["get" + capitalize(sProperty)](),
			iPropertyPos = -1,
			iEntitySetPos = -1,
			iBindingPos = -1,
			iNavigationPos = -1,
			that = this;

		var oParts = {
			length: 0
		};

		// if the field is not bound, use the initial value from the parent control.
		if (sProperty === "uomEditable") {
			this._bUomEditableSet = true;
		} else {
			this._bEditableSet = true;
		}

		if (!oBindingInfo) {
			bParent = this._oParent["get" + capitalize(sProperty)]();
			this._oStoredProperties[sProperty] = bParent;
			this._oStoredBindings.editable = null;
		} else if (this._oStoredBindings.editable === undefined) {
			this._oStoredBindings.editable = oBindingInfo;
		}

		return {
			path: function() {
				var aPaths = [],
					sPath,
					len = 0;

				// no value bound on smart field, but a URL could be there.
				if (!oMetaData.property || !oMetaData.property.property) {
					return [
						""
					];
				}

				// check for field-control on property level and set position.
				sPath = that._oAnnotation.getFieldControlPath(oMetaData.property.property);

				if (sPath) {
					aPaths.push(that._toPath(oMetaData, sPath));
					iPropertyPos = len;
					len++;
				}

				// check for field-control on entity set level and set position.
				// for "sap:updatable-path" no OData V4 annotation is considered,
				// because it is replaced by the instance annotation com.sap.vocabularies.Common.v1.Updatable.
				if (oMetaData.entitySet["sap:updatable-path"]) {

					if (oMetaData.toRoleAssociationEndMultiplicity === "1") {
						aPaths.push(that._toPath(oMetaData, oMetaData.entitySet["sap:updatable-path"]));
					} else {
						// We restore old behavior if the to role multiplicity is multiple
						aPaths.push(oMetaData.entitySet["sap:updatable-path"]);
					}

					iEntitySetPos = len;
					len++;
				}

				// check for binding info and set position.
				if (oBindingInfo) {
					iBindingPos = len;
					that._oBinding.getBindingParts(oBindingInfo, aPaths, oParts);
					len = len + oParts.length;
				}

				// Navigation path - check for not expanded navigation
				if (
					oMetaData &&
					oMetaData.navigationPath &&
					!that._oParent._getEditableForNotExpandedNavigation()
				) {
					aPaths.push(oMetaData.navigationPath);

					iNavigationPos = len;
					len++;
				}

				if (len > 0) {
					return aPaths;
				}

				return [
					""
				];
			},
			formatter: function formatEditable(vValue, p1, p2, p3) {

				if (that._bIsDestroyed) {
					return false;
				}

				if (!that._oAnnotation) {
					return false;
				}

				// if the formatter function is called with the expected "this" context,
				// use it, otherwise use the cached that._oParent "this" context
				var oSmartFieldThisContext = this || that._oParent;

				var oBindingContext;

				if (oSmartFieldThisContext && (typeof oSmartFieldThisContext.getBindingContext === "function")) {
					oBindingContext = oSmartFieldThisContext.getBindingContext();
				}

				var oEntity = oBindingContext && oBindingContext.getObject(),
					oEntityMetadata = oEntity && oEntity.__metadata,
					bEntityMetadataCreated = !!(oEntityMetadata && oEntityMetadata.created),
					oEdmProperty = oMetaData.property && oMetaData.property.property,
					iFcValue = iPropertyPos > -1 ? arguments[iPropertyPos] : null;

				// When bound to FunctionImport parameter field should always be editable
				if (bEntityMetadataCreated && oEntityMetadata.created.functionImport) {
					if (iFcValue === 1) {

						// FieldControl have precedence over functionImport
						return false;
					}

					if (oEdmProperty["com.sap.vocabularies.Common.v1.FieldControl"]?.EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly"
						|| oEdmProperty["com.sap.vocabularies.UI.v1.ReadOnly"]) {
						return false;
					}

					return true;
				}

				if (oEntity && oEdmProperty) {

					if (bEntityMetadataCreated) {

						if (oSmartFieldThisContext.data("ignoreInsertRestrictions") === "true") {
							return true;
						}

						if (!that._getCreatableStatic(oMetaData)) {
							return false;
						}

					} else if (!that._getUpdatableStatic(oMetaData)) {
						return false;
					}
				}

				var aEditableStates = [];

				// get the values to compare.
				// TODO: The next check seems to be wrong. iPropertyPos is used to address element in arguments, but assumption is
				// that first item is path/prop, second item is value... needs to be checked again.
				if (iPropertyPos > -1) {
					aEditableStates.push(arguments[iPropertyPos] !== 1);
				}

				// ignore updatable-path during create
				if (iEntitySetPos > -1 &&
					(!oEntity || !oEntityMetadata || !bEntityMetadataCreated) &&
					arguments[iEntitySetPos] !== undefined &&
					arguments[iEntitySetPos] !== null) {
					aEditableStates.push(!!arguments[iEntitySetPos]);
				}

				// check for binding
				if (iBindingPos > -1) {

					if (oBindingInfo.formatter) {
						aEditableStates.push(that._execFormatter(oBindingInfo.formatter, arguments, iBindingPos, oParts.length));
					} else {
						aEditableStates.push(!!arguments[iBindingPos]);
					}
				}

				// navigation pos
				if (iNavigationPos > -1) {
					aEditableStates.push(!!arguments[iNavigationPos]);
				}

				// In case nothing else is found, use value from parent
				if (aEditableStates.length === 0) {
					var oPropertyBinding = oSmartFieldThisContext && oSmartFieldThisContext.getBinding(sProperty),
						sPropertyBindingPath = oSmartFieldThisContext && oSmartFieldThisContext.getBindingPath(sProperty),
						bPropertyBindingPathEmpty = sPropertyBindingPath === "",
						bPropertyBindingInitial = !!oPropertyBinding && oPropertyBinding.isInitial(),
						bValueNullOrUndefined = (vValue == null);

					if (bValueNullOrUndefined && bPropertyBindingPathEmpty &&
					(oBindingContext && !oBindingContext.isTransient() || oBindingContext === undefined)) {
						// if the binding is initial, the value is null or undefined, and the binding
						// path is invalid (e.g. when the FieldControl annotation is not specified),
						// the bParent variable should store the initial value
						bParent = that._oParent["get" + capitalize(sProperty)]();
					} else if (bPropertyBindingPathEmpty && isPlainObject(vValue) && oEntity && oEdmProperty && that._getCreatableStatic(oMetaData) && that._getUpdatableStatic(oMetaData)) {
						bParent = that._oParent["get" + capitalize(sProperty)]();
					} else if (!bPropertyBindingInitial && bValueNullOrUndefined) {
						bParent = true; // reset
					} else if (!bPropertyBindingInitial && bParentInit &&
						oBindingContext && oBindingContext.isTransient() &&
						oEntity && oEdmProperty && that._getCreatableStatic(oMetaData)) {
						bParent = true; // reset
					} else if (!bPropertyBindingInitial && !bValueNullOrUndefined && bPropertyBindingPathEmpty && !isPlainObject(vValue)) {
						bParent = vValue;
					}

					aEditableStates.push(bParent);
				}

				return that._compare(aEditableStates, false, true);
			}
		};
	};

	/**
	 * Executes the given formatter.
	 *
	 * @param {function} fFormatter The formatter to be executed
	 * @param {array} aArguments The possible arguments
	 * @param {int} iStart The start position
	 * @param {int} iLength The length
	 * @returns {object} The formatting result
	 * @private
	 */
	FieldControl.prototype._execFormatter = function(fFormatter, aArguments, iStart, iLength) {
		var aArgs = [], i;

		if (iStart > -1 && iLength > -1) {

			for (i = 0; i < iLength; i++) {
				aArgs.push(aArguments[iStart + i]);
			}
		}

		return fFormatter.apply(this._oParent, aArgs);
	};

	/**
	 * Returns static value for the <code>enabled</code> property of a control.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @returns {boolean} static value for the <code>enabled</code> property of a control.
	 * @private
	 */
	FieldControl.prototype._getCreatableStatic = function(oMetaData) {
		var bEntitySetCreatable = this._oAnnotation.canCreateEntitySet(oMetaData.entitySet),
			bPropertyCreatable = this._oAnnotation.canCreateProperty(oMetaData.property.property),
			bIgnoreInsertRestrictions = oMetaData.ignoreInsertRestrictions;

		return (bEntitySetCreatable || bIgnoreInsertRestrictions) && bPropertyCreatable;
	};

	/**
	 * Returns static value for the <code>enabled</code> property of a control.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @returns {boolean} static value for the <code>enabled</code> property of a control.
	 * @private
	 */
	FieldControl.prototype._getUpdatableStatic = function(oMetaData) {
		return (this._oAnnotation.canUpdateEntitySet(oMetaData.entitySet) && this._oAnnotation.canUpdateProperty(oMetaData.property.property));
	};

	/**
	 * Compares the boolean values from field control evaluation. First the values are compared to <code>bPessimist</code>. If this comparison does
	 * not evaluate to <code>true</code>, <code>bDefault</code> is returned.
	 *
	 * @param {array} aArgs values to be compared.
	 * @param {boolean} bPessimist first operand.
	 * @param {boolean} bDefault second operand.
	 * @returns {boolean} comparison result.
	 * @private
	 */
	FieldControl.prototype._compare = function(aArgs, bPessimist, bDefault) {
		var i, len = aArgs.length;

		for (i = 0; i < len; i++) {

			if (aArgs[i] === bPessimist) {
				return bPessimist;
			}
		}

		return bDefault;
	};

	FieldControl.prototype._getUIVisible = function (oMetaData) {
		const oEDMProperty = this._oHelper.getEdmProperty(oMetaData),
			  bFunctionImport = !!oMetaData.functionImportProperty,
			  bPropertyVisible = this._oAnnotation.getVisible(oEDMProperty) === "true";

		if (!bFunctionImport) {
			return bPropertyVisible;
		}

		return this._oAnnotation.getVisible(oMetaData.functionImportProperty) === "true";
	};

	/**
	 * Returns formatter functions for the <code>visible</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {object} oBindingInfo the current binding of the property.
	 * @param {string} [sProperty="visible"] The property name
	 * @returns {object} formatter function for the given control attribute.
	 * @private
	 */
	FieldControl.prototype._getVisible = function(oMetaData, oBindingInfo, sProperty) {

		if (sProperty === undefined) {
			sProperty = "visible";
		}

		var bParent,
			iBindingPos = -1,
			iPropertyPos = -1,
			that = this;

		var oParts = {
			length: 0
		};

		// if the field is not bound, use the initial value from the parent control.
		this._bVisibleSet = true;

		if (!oBindingInfo) {
			bParent = this._oParent["get" + capitalize(sProperty)]();
			this._oStoredProperties[sProperty] = bParent;
			this._oStoredBindings.visible = null;
		} else if (this._oStoredBindings.visible === undefined) {
			this._oStoredBindings.visible = oBindingInfo;
		}

		return {
			path: function() {
				var aPaths = [],
					sPath,
					len = 0;

				// no value bound on smart field, but a URL could be there.
				if (!oMetaData.property || !oMetaData.property.property) {
					return [
						""
					];
				}

				sPath = that._oAnnotation.getUIHiddenPath(oMetaData.property.property);
				if (!sPath) {
					// check for field-control on entity set level and set position.
					sPath = that._oAnnotation.getFieldControlPath(oMetaData.property.property);
				}

				if (sPath) {
					aPaths.push(that._toPath(oMetaData, sPath));
					iPropertyPos = len;
					len++;
				}

				// check for binding info and set position.
				if (oBindingInfo) {
					iBindingPos = len;
					that._oBinding.getBindingParts(oBindingInfo, aPaths, oParts);
					len = len + oParts.length;
				}

				if (len > 0) {
					return aPaths;
				}

				return [
					""
				];
			},
			formatter: function formatVisible(vValue, p2) {

				if (that._bIsDestroyed) {
					return false;
				}

				if (!that._oAnnotation) {
					return false;
				}

				// if the formatter function is called with the expected "this" context,
				// use it, otherwise use the cached that._oParent "this" context
				var oSmartFieldThisContext = this || that._oParent,
					oEdmProperty = oMetaData.property && oMetaData.property.property;

				// check static property.
				if (
					oEdmProperty &&
					!that._getUIVisible(oMetaData) ||
					(that._oAnnotation.getUIHiddenPath(oEdmProperty) && vValue === true)
				) {
					return false;
				}

				var aVisibleStates = [];

				// check, if field-control is available.
				// TODO: The next check seems to be wrong. iPropertyPos is used to address element in arguments, but assumption is
				// that first item is path/prop, second item is value... needs to be checked again.
				if (iPropertyPos > -1) {
					aVisibleStates.push(arguments[iPropertyPos] !== 0);
					oSmartFieldThisContext._fieldControlValue = vValue;
				}

				// check for binding, in case of no binding, use value from parent.
				if (iBindingPos > -1) {

					if (oBindingInfo.formatter) {
						aVisibleStates.push(that._execFormatter(oBindingInfo.formatter, arguments, iBindingPos, oParts.length));
					} else {
						aVisibleStates.push(!!arguments[iBindingPos]);
					}
				}

				// When nothing else is found, use parent value
				if (aVisibleStates.length == 0) {
					var oPropertyBinding = oSmartFieldThisContext && oSmartFieldThisContext.getBinding(sProperty),
						sPropertyBindingPath = oSmartFieldThisContext && oSmartFieldThisContext.getBindingPath(sProperty),
						bPropertyBindingPathEmpty = sPropertyBindingPath === "",
						bPropertyBindingInitial = !!oPropertyBinding && oPropertyBinding.isInitial(),
						bValueNullOrUndefined = (vValue == null),
						bVisible;

						if (bPropertyBindingInitial && bValueNullOrUndefined && bPropertyBindingPathEmpty) {

							// if the binding is initial, the value is null or undefined, and the binding
							// path is invalid (e.g. when the FieldControl annotation is not specified),
							// the bParent variable should store the initial value
							bVisible = bParent;

						} else if (!bPropertyBindingInitial && bValueNullOrUndefined) {
							bVisible = true; // reset
						} else if (!bPropertyBindingInitial && !bValueNullOrUndefined && bPropertyBindingPathEmpty && !isPlainObject(vValue)) {
							bVisible = vValue;
						} else {
							bVisible = that._oParent["get" + capitalize(sProperty)]();
						}

					aVisibleStates.push(bVisible);
				}

				return that._compare(aVisibleStates, false, true);
			}
		};
	};

	/**
	 * Returns formatter functions for the <code>mandatory</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {object} oBindingInfo the current binding of the property.
	 * @returns {object} formatter function for the given control attribute.
	 * @private
	 */
	FieldControl.prototype._getMandatory = function(oMetaData, oBindingInfo) {
		var iBindingPos = -1,
			iPropertyPos = -1,
			that = this;

		var oParts = {
			length: 0
		};

		// if the field is not bound, use the initial value from the parent control.
		this._bMandatorySet = true;

		if (!oBindingInfo) {
			this._oStoredProperties.mandatory = this._oParent.getMandatory();
			this._oStoredBindings.mandatory = null;
		} else if (this._oStoredBindings.mandatory === undefined) {
			this._oStoredBindings.mandatory = oBindingInfo;
		}

		// returns an array of paths that are bound with the formatter below (i.e. these paths provide input for the formatter)
		return {
			path: function() {
				var aPaths = [], sPath, len = 0;

				// no value bound on smart field, but a URL could be there.
				if (!oMetaData.property || !oMetaData.property.property) {
					return [
						""
					];
				}

				// check for field-control on entity set level and set position.
				sPath = that._oAnnotation.getFieldControlPath(oMetaData.property.property);

				if (sPath) {
					aPaths.push(that._toPath(oMetaData, sPath));
					iPropertyPos = len;
					len++;
				}

				// check for binding info and set position.
				if (oBindingInfo) {
					iBindingPos = len;
					that._oBinding.getBindingParts(oBindingInfo, aPaths, oParts);
					len = len + oParts.length;
				}

				if (len > 0) {
					return aPaths;
				}

				return [
					""
				];
			},
			formatter: function formatMandatory(p1, p2) {
				var oEdmProperty = oMetaData.property && oMetaData.property.property,
					aMandatoryStates = [],
					bFieldControl,
					bPropertyBound,
					bMandatory;

				if (oEdmProperty && (oEdmProperty.nullable !== undefined)) {
					bMandatory = oEdmProperty && oEdmProperty.nullable === "false" ? true : false;
				}

				if (that._bIsDestroyed) {
					return true;
				}
				bFieldControl = iPropertyPos > -1;

				// Case 1: field control: check, if field-control is active.
				// "iPropertyPos" reflects the relevant path index, returned to the binding with the above "path" function
				if (bFieldControl) {
					if (arguments[iPropertyPos] === 7) {
						bMandatory = true;
					} else if (arguments[iPropertyPos] === 3) {
						bMandatory = false;
					}
				}

				// Case 2: check for static optional or static mandatory.
				if (oEdmProperty && that._oAnnotation) {
					if (that._oAnnotation.isStaticMandatory(oEdmProperty)) {
						bMandatory = true;
					} else if (that._oAnnotation.isStaticOptional(oEdmProperty)) {
						bMandatory = false;
					}
				}

				// Add the mandatory flag only if the above cases are met
				if (bMandatory !== undefined) {
					aMandatoryStates.push(bMandatory);
				}

				bPropertyBound = iBindingPos > -1;

				// Case 3: check for existing binding (w/ and w/o formatter)
				if (bPropertyBound) {

					if (oBindingInfo.formatter) {
						aMandatoryStates.push(that._execFormatter(oBindingInfo.formatter, arguments, iBindingPos, oParts.length));
					} else {
						aMandatoryStates.push(!!arguments[iBindingPos]);
					}
				}

				// if nothing else was found, use value from parent (i.e. the SmartField itself)
				if ((aMandatoryStates.length === 0) ||
					((oEdmProperty && oEdmProperty.nullable === "true") && !bFieldControl && !bPropertyBound)) {

					aMandatoryStates.push(that._oParent.getMandatory());
					//kind-of a workarround: if check for args length is not there, the parent "wins" all the time after "Mandatory" was set to true.
				}

				return that._compare(aMandatoryStates, true, false);
			}
		};
	};

	/**
	 * Constructs a binding path for a formatter from the <code>value</code> attribute of a JSON property.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {string} sPath the given path.
	 * @returns {string} binding path for an attribute.
	 * @private
	 */
	FieldControl.prototype._toPath = function(oMetaData, sPath) {

		// if the original property is a complex path,
		// impossible to have a navigation property in sPath.
		// so we assume this as a prerequisite.
		if (oMetaData.property.complex) {
			return oMetaData.path.replace(oMetaData.property.property.name, sPath);
		}

		// add an optional navigation path from value property of the smart control:
		// should be done for simple and complex properties!
		if (oMetaData.navigationPath) {
			return oMetaData.navigationPath + "/" + sPath;
		}

		return sPath;
	};

	/**
	 * Gets a function to check whether a field is mandatory.
	 *
	 * @param {object} oProperty the meta data to execute the check.
	 * @param {boolean} bEmptyStringSignificant optional parameter that determines if the empty string is significant.
	 * @returns {function|undefined} A function reference or the <code>undefined</code> value.
	 * @protected
	 */
	FieldControl.prototype.getMandatoryCheck = function(oProperty, bEmptyStringSignificant) {

		if (oProperty) {
			switch (oProperty.property.type) {
				case "Edm.DateTimeOffset":
				case "Edm.DateTime":
				case "Edm.Time":
				case "Edm.String":
				case "Edm.Decimal":
				case "Edm.Double":
				case "Edm.Float":
				case "Edm.Single":
				case "Edm.Int16":
				case "Edm.Int32":
				case "Edm.Int64":
				case "Edm.Byte":
				case "Edm.SByte":
				case "Edm.Guid":
					return function(sValue, sSourceType) {
						var sMessage,
							oRB = Library.getResourceBundleFor("sap.ui.comp"),
							bEmptyValue = bEmptyStringSignificant ? (sValue == null) : (sValue === "" || sValue == null),
							bIsNumericField = NumericEdmTypes.indexOf(oProperty.property.type) !== -1;


						if (bEmptyValue) {
							if (this._oParent && this._oParent.getComputedTextLabel && this._oParent.getComputedTextLabel()) {
								sMessage = oRB.getText("MANDATORY_FIELD_WITH_LABEL_ERROR", [this._oParent.getComputedTextLabel()]);
							} else {
								sMessage = oRB.getText("MANDATORY_FIELD_ERROR");
							}

							// The Nullable attribute boolean value specifies whether a value is required for a
							// edm:property. This attribute is a capability of the OData service and therefore it
							// overrule control's API settings.
							// When the Nullable attribute is specified as (Nullable="false") on a edm:property of a
							// service metadata document, a value is required/mandatory and the input control shall not
							// send nulled/empty values to the back-end side.
							if (
								this._oAnnotation &&
								(bIsNumericField && !this._oAnnotation.isStaticMandatory(oProperty.property)) &&
								(!this._oAnnotation.isNullable(oProperty.property) && !this._oAnnotation.isStaticOptional(oProperty.property) &&
								(this._oParent && this._oParent._fieldControlValue !== 3)) &&
								// Either clientSideMandatoryCheck is true or the OData type is different than Edm.String
								(
									this._oParent.getClientSideMandatoryCheck() ||
									oProperty.property.type !== "Edm.String"
								)
							) {
								throw new ParseException(sMessage);
							}

							// If the clientSideMandatoryCheck control property is set to true, the mandatory check has
							// to be performed on the front-end side. Otherwise the validation should be performed on
							// the back-end side.
							if (this._oParent.getClientSideMandatoryCheck() && this._oParent.getMandatory()) {
								throw new ParseException(sMessage);
							}
						}
					}.bind(this);

				// no default
			}
		}
	};

	/**
	 * Returns formatter functions for the <code>uomEditState</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {object} formatter function for the given control attribute
	 * @public
	 */
	FieldControl.prototype.getUOMEditState = function(oMetaData) {
		var mNumber, mUnit, oUnitMetaData, lenNumber = 0, oBindingInfo;

		// get the formatter for the number.
		oBindingInfo = this._oParent.getBindingInfo("editable");
		mNumber = this._getEditable(oMetaData, oBindingInfo);

		// get the formatter for the unit.
		oUnitMetaData = {
			model: oMetaData.model,
			path: this._oHelper.getUOMPath(oMetaData),
			entitySet: oMetaData.entitySet,
			entityType: oMetaData.entityType,
			property: {
				property: oMetaData.annotations.uom.property,
				complex: oMetaData.property.complex,
				typePath: this._oHelper.getUOMTypePath(oMetaData)
			}
		};

		mUnit = this._getEditable(oUnitMetaData, this._oParent.getBindingInfo("uomEditable"), "uomEditable");

		return {
			path: function() {
				var aNumber = mNumber.path(), aUnit = mUnit.path();

				if (aNumber[0] === "" && aUnit === "") {
					return [
						""
					];
				}

				lenNumber = aNumber.length;

				return aNumber.concat(aUnit);
			},
			formatter: function formatUOMEditable(v, p1, p2, p3) {
				var aArgs = [],
					i,
					bNumber,
					bUnit,
					len = arguments.length;

				// execute the formatter for the number
				for (i = 0; i < lenNumber; i++) {
					aArgs.push(arguments[i]);
				}

				bNumber = mNumber.formatter.apply(null, aArgs);

				// prepare the arguments for the unit formatter => simply remove the arguments for the number.
				aArgs = [];

				for (i = 0; i < len; i++) {
					aArgs.push(arguments[i]);
				}

				for (i = 0; i < lenNumber; i++) {
					aArgs.shift();
				}

				// execute the formatter for the unit.
				bUnit = mUnit.formatter.apply(null, aArgs);

				// calculate the result
				if (!bUnit && !bNumber) {
					return 0;
				}

				return 1;
			}
		};
	};

	/**
	 * Checks whether a formatter for the property <code>uomEditState</code> of a control can be returned.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {boolean} <code>uomEditState</code>, if a formatter for the property <code>uomEditState</code> of a control can be returned,
	 *          <code>false</code> otherwise
	 * @public
	 */
	FieldControl.prototype.hasUomEditState = function(oMetaData) {
		var oProposal;

		if (oMetaData && oMetaData.annotations && oMetaData.annotations.uom) {
			oProposal = this._oParent.getControlProposal && this._oParent.getControlProposal();

			if (oProposal) {

				if (oProposal.getControlType() === "ObjectNumber") {
					return true;
				}

				if (oProposal.getObjectStatus()) {
					return true;
				}
			}

			return this._oParent.getProposedControl && this._oParent.getProposedControl() === "ObjectNumber";
		}

		return false;
	};

	FieldControl.prototype.bindProperties = function(oSettings) {
		var oDefaultSettings = {
			propertiesNames: this.getPropertyNames()
		};

		oSettings = Object.assign(oDefaultSettings, oSettings);

		var aPropertiesNames = oSettings.propertiesNames,
			oMetadata = oSettings.metadata;

		if (aPropertiesNames.length) {
			var oFormatters = this.getControlFormatters(oMetadata, aPropertiesNames);

			for (var sProperty in oFormatters) {
				var oBindingInfo = this._oBinding.fromFormatter(oMetadata.model, oFormatters[sProperty]);
				this._oParent.bindProperty(sProperty, oBindingInfo);
			}
		}
	};

	FieldControl.prototype.destroy = function() {

		if (this._oBinding) {
			this._oBinding.destroy();
			this._oBinding = null;
		}

		this._oAnnotation = null;
		var oSmartField = this._oParent;

		if (oSmartField && !oSmartField._bInDestroy) {

			var bSuppressReset = true;

			for (var sProperty in this._oStoredProperties) {
				oSmartField.unbindProperty(sProperty, bSuppressReset);
				var sMutator = "set" + capitalize(sProperty),
					fnMutator = oSmartField[sMutator];

				if (typeof fnMutator === "function") {
					fnMutator.call(oSmartField, this._oStoredProperties[sProperty]);
				}
			}

			if (this._oStoredProperties) {

				if (!this._oStoredProperties.editable && this._bEditableSet) {
					oSmartField.unbindProperty("editable");
				}

				if (!this._oStoredProperties.visible && this._bVisibleSet) {
					oSmartField.unbindProperty("visible");
				}

				if (!this._oStoredProperties.mandatory && this._bMandatorySet) {
					oSmartField.unbindProperty("mandatory");
				}

				if (!this._oStoredProperties.uomEditable && this._bUomEditableSet) {
					oSmartField.unbindProperty("uomEditable");
				}
			}

			if (this._oStoredBindings) {

				if (this._oStoredBindings.editable) {
					oSmartField.bindProperty("editable", this._oStoredBindings.editable);
				}

				if (this._oStoredBindings.visible) {
					oSmartField.bindProperty("visible", this._oStoredBindings.visible);
				}

				if (this._oStoredBindings.mandatory) {
					oSmartField.bindProperty("mandatory", this._oStoredBindings.mandatory);
				}

				if (this._oStoredBindings.uomEditable) {
					oSmartField.bindProperty("uomEditable", this._oStoredBindings.uomEditable);
				}
			}
		}

		this._oStoredProperties = null;
		this._oStoredBindings = null;
		this._oParent = null;
		this._oHelper = null;
		this._bIsDestroyed = true;
		this._bEditableSet = false;
		this._bMandatorySet = false;
		this._bVisibleSet = false;
		this._bUomEditableSet = false;
	};

	return FieldControl;
}, true);
