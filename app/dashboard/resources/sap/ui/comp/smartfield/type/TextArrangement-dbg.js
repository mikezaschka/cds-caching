/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Lib",
	"sap/ui/model/CompositeType",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/base/util/isPlainObject",
	"sap/base/util/Deferred",
	"sap/base/assert"
], function(
	Library,
	CompositeType,
	FormatUtil,
	ParseException,
	ValidateException,
	isPlainObject,
	Deferred,
	assert
) {
	"use strict";
	var TextArrangement = CompositeType.extend("sap.ui.comp.smartfield.type.TextArrangement", {
		constructor: function(oFormatOptions, oConstraints, oSettings, oSmartField) {
			this.getPrimaryType().call(this, oFormatOptions, oConstraints);
			CompositeType.call(this, oFormatOptions, oConstraints);
			this.init(oFormatOptions, oConstraints, oSettings);
			assert(oSettings.keyField !== undefined, "Missing value for the keyField. - " + this.getName());
			if (oSmartField?.isA?.("sap.ui.comp.smartfield.SmartField")) {
				this.oSmartField = oSmartField;
			}
		},

		metadata: {
			"abstract": true
		}
	});

	TextArrangement.prototype.init = function(oFormatOptions, oConstraints, oSettings) {
		this.sName = "TextArrangement";
		this.bParseWithValues = true;
		this.async = true;

		var oDefaultFormatOptions = {
			textArrangement: "idOnly"
		};

		var oDefaultSettings = {
			onBeforeValidateValue: function() {}
		};

		this.oSettings = Object.assign(oDefaultSettings, oSettings);
		this.oFormatOptions = Object.assign(oDefaultFormatOptions, oFormatOptions);

		this.fnParser = this.getValidator({
			textArrangement: this.oFormatOptions.textArrangement,
			prefix: "parse"
		});

		this.fnValidator = this.getValidator({
			textArrangement: this.oFormatOptions.textArrangement,
			prefix: "validate"
		});

		this.bValueListNoValidation = oSettings.valueListNoValidation;
		this.bClientSideMandatoryCheck = this.oSettings.clientSideMandatoryCheck !== undefined ? this.oSettings.clientSideMandatoryCheck : true;
		this.bIsInvalid = false;
		this._sSelectedValue = null;
	};

	TextArrangement.prototype.getSettings = function(){
		return this.oSettings;
	};

	TextArrangement.prototype.parseValue = function(vValue, sSourceType, aCurrentValues) {
		var aResult,
			bIsValueDeleted = vValue === "" && !this._isValueSelected(vValue),
			sTextArrangement = this.oFormatOptions.textArrangement;

		if (bIsValueDeleted &&
			(this.bClientSideMandatoryCheck ||
			(!this.bClientSideMandatoryCheck && this.oConstraints.nullable))) {
			vValue = null;
		}

		if (typeof vValue === "string" ) {
			vValue = vValue.replace(/\u0020+$/, "");
		}

		if (sTextArrangement === "idOnly") {
			aResult = this.parseIDOnly(vValue, sSourceType);
		} else {
			aResult = this.fnParser(vValue, sSourceType, aCurrentValues, this.oFormatOptions, this.oSettings);
		}

		if (aResult[0] && aResult[0].toUpperCase && this.oFormatOptions.displayFormat === "UpperCase") {
			aResult[0] = aResult[0].toUpperCase();
		}

		return aResult;
	};

	TextArrangement.prototype.parseIDOnly = function(vValue, sSourceType) {
		vValue = this.getPrimaryType().prototype.parseValue.call(this, vValue, sSourceType);
		return [vValue, undefined];
	};

	TextArrangement.prototype.setSelectedValue = function (sValue) {
		this._sSelectedValue = sValue;
	};

	TextArrangement.prototype._isValueSelected = function (sValue) {
		return this._sSelectedValue === sValue;
	};

	TextArrangement.prototype.parseIDAndDescription = function(vValue, sSourceType, aCurrentValues, oFormatOptions) {
		var aResult;

		// Only extract ID on user input
		if (!this._isValueSelected(vValue)) {

			// if the value format matches the pattern "ID (description)" or "description (ID)"
			if (oFormatOptions && oFormatOptions.textArrangement === "idAndDescription") {
				aResult = /^([\S\s]+?)\s\([\S\s]+\)$/.exec(vValue);
			} else {
				aResult = /^[\S\s]+\s\(([\S\s]+?)\)$/.exec(vValue);
			}

		}

		// TODO: We should move this after the validation phase
		this.setSelectedValue(null);

		// Assign value only if regex execution has succeeded
		if (Array.isArray(aResult) && aResult[1]) {
			vValue = aResult[1];
		}

		return this.parseIDOnly(vValue, sSourceType);
	};

	TextArrangement.prototype._parseKey = function(vValue, sSourceType) {
		const Type = this.getPrimaryType(),
			  oType = new Type(this.oFormatOptions, this.oConstraints);

		return oType.parseValue.call(this, vValue, sSourceType);
	};

	TextArrangement.prototype.parseDescriptionOnly = function(vValue, sSourceType, aCurrentValues, oFormatOptions, oSettings) {
		var _oDescriptionPromise,
			pOnBeforeValidate,
			oValidateSettings,
			iMaxLength = this.oConstraints && this.oConstraints.maxLength ? this.oConstraints.maxLength : 0;

		if (vValue && this._isValueSelected(vValue)) {
			return Promise.resolve([vValue]);
		}

		function handleSuccess(oPromise, aData) {
			var sID,
				sKeyField = oSettings.keyField,
				sDescriptionField = oSettings.descriptionField,
				fnReject = oPromise.reject;

			// filtering in the text/description field first as the textArrangement format option is set to "descriptionOnly"
			var aIDs = filterValuesByKey(vValue, {
				key: sDescriptionField,
				value: sKeyField,
				data: aData
			});

			var aIDsLength = aIDs.length;

			if (aIDsLength === 1) {
				if (this._bRevokedValue) {
					this._bRevokedValue = false;
					return false;
				}

				sID = this.getPrimaryType().prototype.parseValue.call(this, aIDs[0], sSourceType);
				oPromise.resolve([sID, undefined]);
				return true;
			}

			// if no IDs were found in the text/description field, filtering the key field
			if (aIDsLength === 0) {

				aIDs = filterValuesByKey(vValue, {
					key: sKeyField,
					value: sDescriptionField,
					data: aData
				});

				aIDsLength = aIDs.length;
			}

			// TODO: We should move the validation logic to the validate method.
			if (!this.bValueListNoValidation) {
				if (aIDsLength === 0) {
					oPromise.reject(new ValidateException(this.getResourceBundleText("SMARTFIELD_NOT_UNIQUE")));
					return false;
				}

				// duplicate IDs were found
				if (aIDsLength > 1) {
					oPromise.reject(new ValidateException(this.getResourceBundleText("SMARTFIELD_DUPLICATE_VALUES")));
					return false;
				}
			}

			if (!this._validateDeprecationCode(oSettings, vValue, aIDs, fnReject, aData)) {
				return false;
			}

			sID = this.getPrimaryType().prototype.parseValue.call(this, vValue, sSourceType);
			oPromise.resolve([sID, undefined]);
			return true;
		}

		function handleException(oPromise, error) {
			// TODO: In the future maybe handle the error from the server
			oPromise.reject(new ValidateException(this.getResourceBundleText("SMARTFIELD_INVALID_ENTRY")));
		}

		_oDescriptionPromise = new Deferred();

		if ( vValue === null ){
			_oDescriptionPromise.resolve([vValue, undefined]);
			return _oDescriptionPromise.promise;
		}

		if (vValue && vValue.toUpperCase && this.oFormatOptions.displayFormat === "UpperCase") {
			vValue = vValue.toUpperCase();
		}

		if (this.oConstraints.descriptionMaxLength) {
			iMaxLength = parseInt(this.oConstraints.descriptionMaxLength);
		}

		if (vValue && iMaxLength && vValue.length > iMaxLength) {
			_oDescriptionPromise.reject(new ValidateException(this.getCoreResourceBundleText("EnterTextMaxLength", [iMaxLength])));
			return _oDescriptionPromise.promise;
		}

		oValidateSettings = {
			filterFields: this.getFilterFields(),
			noRebind: true,
			success: function(aData){
				if (aData.length !== 1) {
					_oDescriptionPromise.resolve([null]);
					return false;
				}
				return handleSuccess.call(this, _oDescriptionPromise, aData);
			}.bind(this),
			error: handleException.bind(this, _oDescriptionPromise)
		};

		pOnBeforeValidate = this.onBeforeValidateValue(vValue, oValidateSettings);

		if (pOnBeforeValidate) {
			_oDescriptionPromise.promise.then(pOnBeforeValidate);
		}

		return _oDescriptionPromise.promise.then(function (aValues) {

			if (pOnBeforeValidate && aValues && aValues[0]) {
				vValue = aValues[0];
			}

			// Switch to KEY
			if (this.oConstraints.keyMaxLength) {
				this.oConstraints.maxLength = parseInt(this.oConstraints.keyMaxLength);
				iMaxLength = this.oConstraints.maxLength;
			}

			vValue = this._parseKey(vValue, sSourceType);

			if (vValue && iMaxLength && vValue.length > iMaxLength) {
				return new Promise((fnResolve, fnReject) => {
					fnReject(new ValidateException(this.getResourceBundleText("ENTER_A_VALID_VALUE")));
				});
			}

			return _oDescriptionPromise.promise.then(function(aParsedData){
				var _oKeyPromise,
					oValidateSettings;

				if (aParsedData[0] !== null) {
					return aParsedData;
				} else {
					_oKeyPromise = new Deferred();

					oValidateSettings = {
						filterFields: ["keyField"],
						success: handleSuccess.bind(this, _oKeyPromise),
						error: handleException.bind(this, _oKeyPromise)
					};

					this.onBeforeValidateValue(vValue, oValidateSettings);

					return _oKeyPromise.promise;
				}
			}.bind(this));
		}.bind(this));
	};

	TextArrangement.prototype.validateValue = function(aValues, bCheckValuesValidity) {
		this.validateIDOnly(aValues);
		var vID = aValues[0];

		// prevent a request to be sent when the ID value is "" (empty)
		if (vID === null) {
			return;
		}

		// prevent a request to be sent when the description is known
		if (this.oFormatOptions.textArrangement === "descriptionOnly") {
			this.validateDescriptionOnly(aValues, this.oSettings);
			return;
		}

		if (this.oFormatOptions.textArrangement === "idOnly" && this.bValueListNoValidation) {
			return;
		}

		var oPromise = new Promise(function(fnResolve, fnReject) {

			function handleSuccess(aData) {
				var oSettings = Object.assign({}, this.oSettings, {
					data: aData,
					reject: fnReject
				});

				if (vID === "" &&
					Array.isArray(aData) && aData.length === 0 &&
					this.oConstraints.nullable === false &&
					!this.bClientSideMandatoryCheck) {
						fnResolve(aValues);
						return true;
				}

				var bValidValue = this.fnValidator(aValues, oSettings);

				if (bValidValue) {
					fnResolve(aValues);
				}

				return bValidValue;
			}

			function handleException(error) {
				// TODO: In the future maybe handle the error from the server
				fnReject(new ValidateException(this.getResourceBundleText("SMARTFIELD_INVALID_ENTRY")));
			}

			var oOnBeforeValidateValueSettings = {
				filterFields: this.getFilterFields(),
				success: handleSuccess.bind(this),
				error: handleException.bind(this),
				bCheckValuesValidity: bCheckValuesValidity
			};

			this.onBeforeValidateValue(vID, oOnBeforeValidateValueSettings);
		}.bind(this));

		if (this.bValueListNoValidation) {
			return;
		} else {
			return oPromise;
		}
	};

	TextArrangement.prototype.validateIDOnly = function (aValue, oData) {
		var sValue = aValue[0],
			oResult,
			fnReject;

		this.getPrimaryType().prototype.validateValue.call(this, sValue);

		// We do validation only in valueList scenario
		if (this.getSettings().valueList && oData) {
			oResult = oData.data;
			fnReject = oData.reject;

			// if no description is found
			if (oResult.length === 0) {
				fnReject(new ValidateException(this.getResourceBundleText("SMARTFIELD_NOT_FOUND")));
				return false;
			}

			// more descriptions were found for the same ID
			if (oResult.length > 1) {
				fnReject(new ValidateException(this.getResourceBundleText("SMARTFIELD_DUPLICATE_VALUES")));
				return false;
			}
			if (!this._validateDeprecationCode(oData, aValue, [], fnReject, oData.data)) {
				return false;
			}
		}

		return true;
	};

	TextArrangement.prototype.validateIDAndDescription = function(aValues, oSettings) {
		var oFilterSettings = {
				key: oSettings.keyField,
				value: oSettings.descriptionField,
				data: oSettings.data
			};

		if (this.oFormatOptions && this.oFormatOptions.displayFormat) {
			oFilterSettings.displayFormat = this.oFormatOptions.displayFormat;
		}

		// filter for description given the ID
		var aDescription = filterValuesByKey(aValues[0], oFilterSettings, this.oConstraints);

		var fnReject = oSettings.reject;

		if (!this.bValueListNoValidation) {
			// if no description is found
			if (aDescription.length === 0) {
				fnReject(new ValidateException(this.getResourceBundleText("SMARTFIELD_NOT_FOUND")));
				return false;
			}

			// more descriptions were found for the same ID
			if (aDescription.length > 1) {
				fnReject(new ValidateException(this.getResourceBundleText("SMARTFIELD_DUPLICATE_VALUES")));
				return false;
			}
		}

		if (!this._validateDeprecationCode(oSettings, aValues, aDescription, fnReject, oSettings.data)) {
			return false;
		}

		return true;
	};

	TextArrangement.prototype._validateDeprecationCode = function (oSettings, aValues, aDescription, fnRejectPromise, aData) {
		const sDeprecationCodeFieldName = this._getDeprecationCodeField(),
			fnReject = oSettings.reject || fnRejectPromise;

		if (!sDeprecationCodeFieldName || !this.oSmartField) {
			return true;
		}

		const sDeprecationCodeValue = aData[0]?.[sDeprecationCodeFieldName];

		if (sDeprecationCodeValue === "W") {
			setTimeout(() => {
				this.oSmartField.setValueState("Warning");
				this.oSmartField.setValueStateText(this.getResourceBundleText("DEPRECATED_VALUE"));
			});
		}

		if (sDeprecationCodeValue === "E") {
			if (!this.bValueListNoValidation) {
				this._decorateRevokedValue(aValues[0], aDescription[0]);
				fnReject(new ValidateException(this.getResourceBundleText("REVOKED_VALUE")));
				return false;
			} else if (this.bValueListNoValidation) {
				setTimeout(() => {
					this.oSmartField.setValueState("Error");
					this.oSmartField.setValueStateText(this.getResourceBundleText("REVOKED_VALUE"));
				});
			}
		}

		return true;
	};

	TextArrangement.prototype._getDeprecationCodeField = function () {
		if (!this._sDeprecationCodeField) {
			this._sDeprecationCodeField = this.oSmartField?._oFactory?.getValueHelpProvider()?.oPrimaryValueListAnnotation?.deprecationCodeField;
		}

		return this._sDeprecationCodeField;
	};

	TextArrangement.prototype._decorateRevokedValue = function(sValue1, sValue2) {
		const sType = this.oSmartField?._getInnerControlPropertyBinding("edit")?.sInternalType,
		sFormattedValue = this.formatValue([sValue1, sValue2], sType);

		this.oSmartField?.getFirstInnerControl()?.setValue(sFormattedValue);
		this._bRevokedValue = true;
	};
	TextArrangement.prototype.validateDescriptionOnly = function(aValues, oSettings) {};

	TextArrangement.prototype.formatValue = function(aValues, sTargetType) {
		var sKey;

		// In case we receive a string or if context is removed we can receive a value of null
		if (!Array.isArray(aValues)) {
			return aValues;
		}

		// Handle unwanted comma in the model - In case we have only ID in the field and recieve again only ID.
		if (this.bValueListNoValidation && aValues[1] === undefined){
			aValues.splice(1, 1);
		}
		sKey = this.getPrimaryType().prototype.formatValue.call(this, aValues[0], sTargetType);

		if (sKey === null) {
			return sKey;
		}

		if (this.oConstraints.isDigitSequence && sKey === "") {
			if (aValues[0] !== "") {
				sKey = aValues[0];
			} else {
				// For NUMC empty string means no value thus we show no description
				return [];
			}
		}

		if (sKey && this.oFormatOptions.displayFormat === "UpperCase") {
			sKey = sKey.toUpperCase();
		}

		var vDescription = aValues[1];

		if (
			vDescription === "" &&
			this.oFormatOptions.textArrangement !== "idOnly" &&
			this.oSettings.delegate
		){
			this.oSettings.delegate._sTextArrangementLastReadValue = null;
		}

		// In case of descriptionOnly and no description we fallback and show the ID
		if (!vDescription && this.oFormatOptions.textArrangement === "descriptionOnly") {
			return sKey;
		}

		// in case the binding path is invalid/empty
		if (isPlainObject(vDescription) || this.bIsInvalid) {
			vDescription = "";
		}

		return FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.oFormatOptions.textArrangement, sKey, vDescription);
	};

	TextArrangement.prototype.setDescriptionIsInvalid = function(isInvalid) {
		this.bIsInvalid = isInvalid;
	};

	TextArrangement.prototype.getDescriptionIsInvalid = function() {
		return this.bIsInvalid;
	};

	TextArrangement.prototype.destroy = function() {
		this.oFormatOptions = null;
		this.oSettings = null;
		this.fnParser = null;
		this.fnValidator = null;
	};

	TextArrangement.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.TextArrangement";
	};

	TextArrangement.prototype.onBeforeValidateValue = function(vValue, mSettings) {
		return this.oSettings.onBeforeValidateValue(vValue, mSettings);
	};

	TextArrangement.prototype.getResourceBundleText = function(sKey, aParams) {
		return Library.getResourceBundleFor("sap.ui.comp").getText(sKey, aParams);
	};

	TextArrangement.prototype.getCoreResourceBundleText = function(sKey, aParams) {
		return Library.getResourceBundleFor("sap.ui.core").getText(sKey, aParams);
	};

	/**
	 * Gets the primary type of this object.
	 *
	 * @returns {sap.ui.model.odata.type.ODataType} The data type used for parsing, validation and formatting
	 * @protected
	 * @abstract
	 */
	TextArrangement.prototype.getPrimaryType = function() {};

	TextArrangement.prototype.getValidator = function(mSettings) {

		switch (mSettings.textArrangement) {

			case "idAndDescription":
			case "descriptionAndId":
				return this[mSettings.prefix + "IDAndDescription"];

			case "descriptionOnly":
				return this[mSettings.prefix + "DescriptionOnly"];

			default:
				return this[mSettings.prefix + "IDOnly"];
		}
	};

	TextArrangement.prototype.getFilterFields = function(vValue) {

		if (this.oFormatOptions && this.oFormatOptions.textArrangement === "descriptionOnly") {
			return ["descriptionField"];
		}

		return ["keyField"];
	};

	function filterValuesByKey(sKey, mSettings, oConstraints) {
		var aValues = [];
		if (mSettings.displayFormat === "UpperCase") {
			sKey = sKey.toLowerCase();
		}
		mSettings.data.forEach(function (mData) {
			let	sCurrKey = mData[mSettings.key];
			if (sCurrKey && mSettings.displayFormat === "UpperCase") {
				sCurrKey = sCurrKey.toLowerCase();
			}

			const bIsValueNumcEqual = oConstraints?.isDigitSequence && oConstraints?.maxLength && sKey.lastIndexOf(sCurrKey) !== -1;

			if (bIsValueNumcEqual || sCurrKey === sKey) {
				aValues.push(mData[mSettings.value]);
			}
		});

		return aValues;
	}

	return TextArrangement;
});
