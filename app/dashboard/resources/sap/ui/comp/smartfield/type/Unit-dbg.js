/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Lib",
	"sap/ui/model/odata/type/Unit",
	"sap/ui/comp/smartfield/type/Decimal",
	"sap/ui/comp/smartfield/type/Int16",
	"sap/ui/comp/smartfield/type/Int32",
	"sap/ui/comp/smartfield/type/Int64",
	"sap/ui/comp/smartfield/type/Byte",
	"sap/ui/comp/smartfield/type/SByte",
	"sap/ui/comp/smartfield/type/Double",
	"sap/ui/model/ValidateException",
	"sap/ui/comp/smartfield/UoMValidateException"
], function(
	Library,
	ODataUnit,
	DecimalType,
	Int16Type,
	Int32Type,
	Int64Type,
	ByteType,
	SByteType,
	DoubleType,
	ValidateException,
	UoMValidateException
) {
	"use strict";
	var _rDecimal = /^([-]?)(\d+)(?:\.(\d+))?$/;

	var Unit = ODataUnit.extend("sap.ui.comp.smartfield.type.Unit", {
		constructor: function(oFormatOptions, oConstraints) {
			oFormatOptions.decimals = oConstraints.scale;
			ODataUnit.apply(this, [oFormatOptions, { skipDecimalsValidation: oConstraints.skipDecimalsValidation }]);
			this.oConstraints = oConstraints;
			this.sName = "Unit";
		}
	});

	Unit.prototype.parseValue = function(vValue, sInternalType, aCurrentValues) {
		var aValues = ODataUnit.prototype.parseValue.apply(this, arguments),
			sIntegerPart,
			sFractionPart,
			aMatches = Array.isArray(aValues) && aValues[0] && _splitDecimals(aValues[0]);

		if (Array.isArray(aMatches)) {
			sIntegerPart = aMatches[1] + aMatches[2];
			sFractionPart = aMatches[3];
			if (Number.parseInt(sFractionPart) === 0) {
				aValues[0] = sIntegerPart;
			}
		}

		if (aValues[1] === undefined && aCurrentValues) {
			aValues[1] = aCurrentValues[1];
		}

		if (aValues[1] && this.shouldConvertUnitToUpperCase(aValues[1])) {
			aValues[1] = aValues[1].toUpperCase();
		}

		return aValues;
	};

	Unit.prototype.validateValue = function(vValues) {
		var aMatches,
			sValue = vValues[0],
			sUnit = vValues[1],
			bNullValue = sValue === null,
			oUnitCustomizing = this.oFormatOptions && this.oFormatOptions.customUnits;

		if (oUnitCustomizing && sUnit &&
			Object.keys(oUnitCustomizing).indexOf(sUnit) === -1) {
			throw new UoMValidateException(getTextCompLibrary("UNIT_VALIDATION_FAILS", [sUnit]));
		}

		ODataUnit.prototype.validateValue.apply(this, arguments);

		if (this.oConstraints.nullable && (bNullValue || (sValue === this.oFormatOptions.emptyString))) {
			return;
		}

		aMatches = _splitDecimals(sValue);

		if (aMatches === null) {
			throw new ValidateException(getText("EnterNumber"));
		}

		if (this.oConstraints && !this.oConstraints.scale && this.oConstraints.skipDecimalsValidation) {
			// In case of "UI.DoNotCheckScaleOfMeasuredQuantity" true the validation should be skipped
			return;
		}

		_checkPimitiveType.call(this, this.oConstraints.type, sValue);

		var iIntegerValue = parseInt(aMatches[2]),
			iScale,
			iPropertyScale = this.oConstraints && this.oConstraints.scale,
			iUnitScale = iPropertyScale,
			iIntegerDigits = iIntegerValue === 0 ? 0 : aMatches[2].length,
			iFractionDigits = (aMatches[3] || "").length,
			iConstraintsPrecision = this.oConstraints && this.oConstraints.precision,
			iPrecision = typeof iConstraintsPrecision === "number" ? iConstraintsPrecision : Infinity,
			iScaleOfCustomUnit = this.mCustomUnits && this.mCustomUnits[sUnit] && this.mCustomUnits[sUnit].decimals;

		if ((iScaleOfCustomUnit || iScaleOfCustomUnit === 0) && !this.oConstraints.skipDecimalsValidation) {
			// In case of "UI.DoNotCheckScaleOfMeasuredQuantity" true iScaleOfCustomUnit is discarded, no longer used
			// for validation. In that case the validation is only against the provided scale as a constraint
			iUnitScale = iScaleOfCustomUnit;
		}

		if (this.oConstraints && this.oConstraints.variableScale) {
			// In case of sap:variable-scale="true" the provided scale can vary depending on the current currency scale
			// up to the size of the precision.
			iScale = Math.min(iPrecision, iUnitScale);
			iPropertyScale = iScale;
		} else {
			iScale = Math.min(iPropertyScale || 0, iUnitScale);
		}

		// The Scale value can range from 0 through the specified Precision value.
		if (iScale > iPrecision) {
			iScale = iPrecision;
		}

		if (iFractionDigits > iScale) {

			if (iScale === 0) {

				// enter a number with no decimal places
				throw new ValidateException(getText("EnterInt"));
			}

			if ((iIntegerDigits + iScale) > iPrecision) {

				// enter a number with a maximum of {iPrecision - iScale} digits to the left of the decimal
				// separator and a maximum of {iScale} decimal places
				throw new ValidateException(getText("EnterNumberIntegerFraction", [iPrecision - iScale, iScale]));
			}

			// enter a number with a maximum of {iScale} decimal places
			throw new ValidateException(getText("EnterNumberFraction", [iScale]));
		}

		// Keep in mind the following: If Precision is equal to Scale, a single zero MUST precede the decimal point.
		if (iIntegerDigits > (iPrecision - iPropertyScale)) {
			// enter a number with a maximum of {iPrecision - iPropertyScale} digits to the left of
			// the decimal separator
			throw new ValidateException(getText("EnterNumberInteger", [iPrecision - iPropertyScale]));
		}
	};

	function _splitDecimals(sValue) {
		return _rDecimal.exec(sValue);
	}

	function getText(sKey, aParams) {
		return Library.getResourceBundleFor("sap.ui.core").getText(sKey, aParams);
	}

	function getTextCompLibrary(sKey, aParams) {
		return Library.getResourceBundleFor("sap.ui.comp").getText(sKey, aParams);
	}

	function _checkPimitiveType(sType, sValue) {
		if (sType) {
			var oType;
			switch (sType) {
				case "Edm.Double":
					oType = new DoubleType({}, this.oConstraints);
					break;
				case "Edm.Decimal":
					oType = new DecimalType({}, this.oConstraints);
					break;
				case "Edm.Int16":
					oType = new Int16Type({}, this.oConstraints);
					break;
				case "Edm.Int32":
					oType = new Int32Type({}, this.oConstraints);
					break;
				case "Edm.Int64":
					oType = new Int64Type({}, this.oConstraints);
					break;
				case "Edm.Byte":
					oType = new ByteType({}, this.oConstraints);
					break;
				case "Edm.SByte":
					oType = new SByteType({}, this.oConstraints);
					break;
			}
			oType.validateValue(sValue);
		}
	}

	Unit.prototype.shouldConvertUnitToUpperCase = function(sValue) {
		return this.mCustomUnits && !this.mCustomUnits[sValue] && this.mCustomUnits[sValue.toUpperCase()];
	};

	Unit.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.Unit";
	};

	return Unit;
});

