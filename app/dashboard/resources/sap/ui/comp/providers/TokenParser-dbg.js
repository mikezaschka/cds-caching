/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/base/ManagedObject",
	"sap/m/Token",
	"sap/m/library",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/core/Core",
	"sap/ui/core/Lib"
],
	function(library, ManagedObject, Token, mLibrary, FormatUtil, Core, Lib) {
		"use strict";

	// shortcut for sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
	var ValueHelpRangeOperation = library.valuehelpdialog.ValueHelpRangeOperation;
	var	P13nConditionOperation = mLibrary.P13nConditionOperation;
	var	oDefaultTypeOperations = {
		"default": [
			P13nConditionOperation.EQ,
			P13nConditionOperation.BT,
			P13nConditionOperation.LT,
			P13nConditionOperation.LE,
			P13nConditionOperation.GT,
			P13nConditionOperation.GE,
			P13nConditionOperation.NotEQ,
			P13nConditionOperation.NotBT,
			P13nConditionOperation.NotLT,
			P13nConditionOperation.NotLE,
			P13nConditionOperation.NotGT,
			P13nConditionOperation.NotGE
		],
		"string": [
			P13nConditionOperation.Empty,
			P13nConditionOperation.NotEmpty,
			P13nConditionOperation.Contains,
			P13nConditionOperation.EQ,
			P13nConditionOperation.BT,
			P13nConditionOperation.StartsWith,
			P13nConditionOperation.EndsWith,
			P13nConditionOperation.LT,
			P13nConditionOperation.LE,
			P13nConditionOperation.GT,
			P13nConditionOperation.GE,
			P13nConditionOperation.NotEQ,
			P13nConditionOperation.NotContains,
			P13nConditionOperation.NotStartsWith,
			P13nConditionOperation.NotEndsWith,
			P13nConditionOperation.NotBT,
			P13nConditionOperation.NotLT,
			P13nConditionOperation.NotLE,
			P13nConditionOperation.NotGT,
			P13nConditionOperation.NotGE
		],
		"date": [
			P13nConditionOperation.Empty,
			P13nConditionOperation.NotEmpty,
			P13nConditionOperation.EQ,
			P13nConditionOperation.BT,
			P13nConditionOperation.LT,
			P13nConditionOperation.LE,
			P13nConditionOperation.GT,
			P13nConditionOperation.GE,
			P13nConditionOperation.NotEQ,
			P13nConditionOperation.NotBT,
			P13nConditionOperation.NotLT,
			P13nConditionOperation.NotLE,
			P13nConditionOperation.NotGT,
			P13nConditionOperation.NotGE
		],
		"time": [
			P13nConditionOperation.EQ,
			P13nConditionOperation.BT,
			P13nConditionOperation.LT,
			P13nConditionOperation.LE,
			P13nConditionOperation.GT,
			P13nConditionOperation.GE,
			P13nConditionOperation.NotEQ,
			P13nConditionOperation.NotBT,
			P13nConditionOperation.NotLT,
			P13nConditionOperation.NotLE,
			P13nConditionOperation.NotGT,
			P13nConditionOperation.NotGE
		],
		"numeric": [
			P13nConditionOperation.EQ,
			P13nConditionOperation.BT,
			P13nConditionOperation.LT,
			P13nConditionOperation.LE,
			P13nConditionOperation.GT,
			P13nConditionOperation.GE,
			P13nConditionOperation.NotEQ,
			P13nConditionOperation.NotBT,
			P13nConditionOperation.NotLT,
			P13nConditionOperation.NotLE,
			P13nConditionOperation.NotGT,
			P13nConditionOperation.NotGE
		],
		"numc": [
			P13nConditionOperation.Contains,
			P13nConditionOperation.EQ,
			P13nConditionOperation.BT,
			P13nConditionOperation.EndsWith,
			P13nConditionOperation.LT,
			P13nConditionOperation.LE,
			P13nConditionOperation.GT,
			P13nConditionOperation.GE,
			P13nConditionOperation.Empty,
			P13nConditionOperation.NotContains,
			P13nConditionOperation.NotEQ,
			P13nConditionOperation.NotBT,
			P13nConditionOperation.NotEndsWith,
			P13nConditionOperation.NotLT,
			P13nConditionOperation.NotLE,
			P13nConditionOperation.NotGT,
			P13nConditionOperation.NotGE
		],
		"boolean": [P13nConditionOperation.EQ]
	};
	var	aDefaultRangeOperationsKeys = [
		P13nConditionOperation.Empty,
		P13nConditionOperation.BT,
		P13nConditionOperation.EQ,
		P13nConditionOperation.Contains,
		P13nConditionOperation.StartsWith,
		P13nConditionOperation.EndsWith,
		P13nConditionOperation.LT,
		P13nConditionOperation.LE,
		P13nConditionOperation.GT,
		P13nConditionOperation.GE,

		P13nConditionOperation.NotEmpty,
		P13nConditionOperation.NotBT,
		P13nConditionOperation.NotEQ,
		P13nConditionOperation.NotContains,
		P13nConditionOperation.NotStartsWith,
		P13nConditionOperation.NotEndsWith,
		P13nConditionOperation.NotLT,
		P13nConditionOperation.NotLE,
		P13nConditionOperation.NotGT,
		P13nConditionOperation.NotGE
	];

		/**
		 * Constructs a class to parse condition values and create token elements inside a MultiInput field
		 *
		 * This module is only for internal use!
		 *
		 * @constructor
		 * @private
		 * @param {object|string} [oSettings] Settings
		 * @param {object} [oSettings.defaultOperation] - default operation for the token parsing
		 * @param {object} [oSettings.typeOperations] - Type operations
		 * @param {Array} [oSettings.rangeOperationsKeys] - Range Operations Keys
		 * @author Peter Harbusch
		 */
		var TokenParser = function(oSettings) {
			var aRangeOperationsKeys = oSettings && oSettings.rangeOperationsKeys || aDefaultRangeOperationsKeys;

			this._aKeyFields = [];
			this._sDefaultOperation = typeof oSettings === "string" && oSettings || oSettings && oSettings.defaultOperation && oSettings.defaultOperation || undefined;
			this._mTypeOperations = oSettings && oSettings.typeOperations || oDefaultTypeOperations;

			this._initRangeOperations(aRangeOperationsKeys);
		};

		function parseBT(sText) {
			var aValues = this.re.exec(sText),
				sValue1 = aValues[1],
				sValue2 = aValues[2];

			if (aValues) {
				// the regex for the between operator is returning two groups (.+) with the matching value.
				if (sValue1 && sValue1.trim) { sValue1 = sValue1.trim(); }
				if (sValue2 && sValue2.trim) { sValue2 = sValue2.trim(); }
				return [sValue1, sValue2];
			}
			return  [];
		}

		TokenParser.rangeOperations = {};
		TokenParser.rangeOperations[P13nConditionOperation.Empty] = {
			regex: new RegExp(
				"^" +
					FormatUtil.getFormattedRangeText(
						ValueHelpRangeOperation.Empty,
						null,
						null,
						false
					) +
					"$",
				"i"
			),
			operator: P13nConditionOperation.Empty,
			example: FormatUtil.getFormattedRangeText(
				ValueHelpRangeOperation.Empty,
				null,
				null,
				false
			),
			template: FormatUtil.getFormattedRangeText(
				ValueHelpRangeOperation.Empty,
				null,
				null,
				false
			),
			exclude: false,
			parse: function (sText) {
				return [];
			}
		};
		TokenParser.rangeOperations[P13nConditionOperation.BT] = {
			regex: /^([^!].*)\.\.\.(.+)$/,
			operator: P13nConditionOperation.BT,
			example: "foo...bar",
			template: "$0...$1",
			exclude: false,
			parse: parseBT
		};
		TokenParser.rangeOperations[P13nConditionOperation.EQ] = {
			regex: /^\=(.+)$/,
			operator: P13nConditionOperation.EQ,
			example: "=foo",
			template: "=$0",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.Contains] = {
			regex: /^\*(.+)\*$/,
			operator: P13nConditionOperation.Contains,
			example: "*foo*",
			template: "*$0*",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.StartsWith] = {
			regex: /^([^\*!].*)\*$/,
			operator: P13nConditionOperation.StartsWith,
			example: "foo*",
			template: "$0*",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.EndsWith] = {
			regex: /^\*(.*[^\*])$/,
			operator: P13nConditionOperation.EndsWith,
			example: "*foo",
			template: "*$0",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.LT] = {
			regex: /^\<([^\=].*)$/,
			operator: P13nConditionOperation.LT,
			example: "< foo",
			template: "<$0",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.LE] = {
			regex: /^\<\=(.+)$/,
			operator: P13nConditionOperation.LE,
			example: "<=foo",
			template: "<=$0",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.GT] = {
			regex: /^\>([^\=].*)$/,
			operator: P13nConditionOperation.GT,
			example: "> foo",
			template: ">$0",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.GE] = {
			regex: /^>=(.+)$/,
			operator: P13nConditionOperation.GE,
			example: ">=foo",
			template: ">=$0",
			exclude: false
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotEmpty] = {
			regex: new RegExp(
				"^" +
					FormatUtil.getFormattedRangeText(
						ValueHelpRangeOperation.Empty,
						null,
						null,
						true
					)
						.replace("(", "\\(")
						.replace(")", "\\)") +
					"$",
				"i"
			),
			operator: P13nConditionOperation.NotEmpty,
			example: FormatUtil.getFormattedRangeText(
				ValueHelpRangeOperation.Empty,
				null,
				null,
				true
			),
			template: FormatUtil.getFormattedRangeText(
				ValueHelpRangeOperation.Empty,
				null,
				null,
				true
			),
			exclude: true,
			parse: function (sText) {
				return [];
			}
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotBT] = {
			regex: /^![(]?(.+)\.\.\.([^)]+)[)]?$/,
			operator: P13nConditionOperation.NotBT,
			example: "!foo...bar",
			template: "!($0...$1)",
			exclude: true,
			parse: parseBT
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotEQ] = {
			regex: /^![(]?=(.+?)[)]?$/,
			operator: P13nConditionOperation.NotEQ,
			example: "!=foo",
			template: "!(=$0)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotContains] = {
			regex: /^![(]?\*(.+)\*[)]?$/,
			operator: P13nConditionOperation.NotContains,
			example: "!*foo*",
			template: "!(*$0*)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotStartsWith] = {
			regex: /^![(]?([^\\*].*)\*[)]?$/,
			operator: P13nConditionOperation.NotStartsWith,
			example: "!foo*",
			template: "!($0*)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotEndsWith] = {
			regex: /^![(]?\*([^\*)]*)[)]?$/,
			operator: P13nConditionOperation.NotEndsWith,
			example: "!*foo",
			template: "!(*$0)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotLT] = {
			regex: /^![(]?<([^=].*?)[)]?$/,
			operator: P13nConditionOperation.NotLT,
			example: "!<foo",
			template: "!(<$0)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotLE] = {
			regex: /^![(]?<=(.+?)[)]?$/,
			operator: P13nConditionOperation.NotLE,
			example: "!<=foo",
			template: "!(<=$0)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotGT] = {
			regex: /^![(]?>([^=].*?)[)]?$/,
			operator: P13nConditionOperation.NotGT,
			example: "!>foo",
			template: "!(>$0)",
			exclude: true
		};
		TokenParser.rangeOperations[P13nConditionOperation.NotGE] = {
			regex: /^![(]?>=(.+?)[)]?$/,
			operator: P13nConditionOperation.NotGE,
			example: "!>=foo",
			template: "!(>=$0)",
			exclude: true
		};

		TokenParser.excludeOperationsMapping = {};
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotEmpty] = P13nConditionOperation.Empty;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotLT] = P13nConditionOperation.LT;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotLE] = P13nConditionOperation.LE;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotGT] = P13nConditionOperation.GT;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotGE] = P13nConditionOperation.GE;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotContains] = P13nConditionOperation.Contains;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotStartsWith] = P13nConditionOperation.StartsWith;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotEndsWith] = P13nConditionOperation.EndsWith;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotBT] = P13nConditionOperation.BT;
		TokenParser.excludeOperationsMapping[P13nConditionOperation.NotEQ] = P13nConditionOperation.EQ;


		/**
		 * initialize all operations
		 *
		 * @private
		 */
		TokenParser.prototype._initRangeOperations = function(aRangeOperationsKeys) {
			aRangeOperationsKeys.forEach(function(sKey){
				this.createOperation(TokenParser.rangeOperations[sKey]);
			}, this);
		};

		TokenParser.prototype.destroy = function() {
			if (this._oInput && !this._oInput.bIsDestroyed) {
				this._oInput.removeValidator(this._validator);
				if (this._aOrgValidators && this._aOrgValidators.length > 0) {
					this._oInput.addValidator(this._aOrgValidators);
				}
				this._oInput = null;
			}
			this._aOrgValidators = null;
			this._aKeyFields = null;
			this._mTypeOperations = null;
		};

		/**
		 * Specifies the default operation for the token parser
		 *
		 * @param {string} sOperationKey - the key of the default operation
		 * @public
		 */
		TokenParser.prototype.setDefaultOperation = function(sOperationKey) {
			this._sDefaultOperation = sOperationKey;
		};

		/**
		 * returns the default operation for the token parser
		 *
		 * @returns {string} the default operation key
		 * @public
		 */
		TokenParser.prototype.getDefaultOperation = function() {
			return this._sDefaultOperation;
		};

		/**
		 * returns the map of all operations
		 *
		 * @returns {map}
		 * @public
		 */
		TokenParser.prototype.getOperations = function() {
			return this._mOperations;
		};

		/**
		 * returns a specific operation
		 *
		 * @param {string} sOperationKey - the key of the operation
		 * @returns {object}
		 * @public
		 */
		TokenParser.prototype.getOperation = function(sOperationKey) {
			return this._mOperations && this._mOperations[sOperationKey];
		};

		/**
		 * returns the KeyField by label
		 *
		 * @param {string} sLabel - the label of the keyfield
		 * @private
		 */
		TokenParser.prototype._getKeyFieldByLabel = function(sLabel) {
			var keyField;
			this._aKeyFields.some(function(oKeyField) {
				if (oKeyField.label.toUpperCase() === sLabel.toUpperCase()) {
					keyField = oKeyField;
				}
			}, this);
			return keyField;
		};

		TokenParser.prototype.addKeyField = function(oKeyField) {
			this._aKeyFields.push(oKeyField);
		};

		TokenParser.prototype.getKeyFields = function() {
			return this._aKeyFields;
		};

		TokenParser.prototype.addTypeOperations = function(sType, aOperations) {
			this._mTypeOperations[sType] = aOperations;
		};

		TokenParser.prototype.removeTypeOperations = function(sType) {
			delete this._mTypeOperations[sType];
		};

		TokenParser.prototype.getTypeOperations = function(sType) {
			return this._mTypeOperations[sType] || this._mTypeOperations["default"];
		};

		/**
		 * create a new operation for the parser
		 *
		 * @param {object} operation
		 * @param {string} operation.operator - operation key
		 * @param {string} operation.example - shown as  help text in  suggest
		 * @param {RegExp} operation.regex
		 * @param {string} operation.template - template for formatter which will be shown as token text
		 * @param {function} [operation.parse] - parser callback function
		 * @param {boolean} operation.exclude
		 * @public
		 */
		TokenParser.prototype.createOperation = function(operation) {
			var sOperationKey = operation.operator,
				sExample = operation.example,
				regEx = operation.regex,
				sTemplate = operation.template,
				fParse = operation.parse,
				bExclude = operation.exclude;

			if (!this._mOperations) {
				this._mOperations = {};
			}

			this._mOperations[sOperationKey] = {
				key: sOperationKey,
				example: sExample,
				re: regEx,
				template: sTemplate,
				exclude: bExclude,
				parser: this,
				match: function(sText, oKeyField) {
					var result = this.re.exec(sText);
					if (result) {
						var aValues = this.parse(sText);
						if (oKeyField) {
							aValues.forEach(function(sValue) {
								if (oKeyField.hasOwnProperty("maxLength") && oKeyField.maxLength >= 0 && sValue.length > oKeyField.maxLength) {
									result = null;
								}
								if (oKeyField.oType) {
									try {
										sValue = oKeyField.oType.parseValue(sValue, "string");
										oKeyField.oType.validateValue(sValue);
									} catch (err) {
										result = null;
									}
								}
							}, this);
						}
					}
					return result;
				},
				parse: fParse || function(sText) {
					var aValues = this.re.exec(sText);
					if (aValues) {
						// regex uses one or two groups (.+) which returns the matching value.
						// most of the operators only use one group and the value of this is returns as aValues[1]. Only the NE operator has two groups and only one is filled.
						var sValue = aValues[1] || aValues[2];
						if (sValue && sValue.trim) {
							sValue = sValue.trim();
						}
						return [sValue];
					}
					return [];
				},
				getFilledTemplate: function(sText, oKeyField) {
					var aValues = this.parse(sText);
					var sValues = [];
					var sTokenText = "";
					for (var i = 0; i < aValues.length; i++) {
						sValues[i] = this.formatValue(aValues[i], false, oKeyField);
					}
					sTokenText = TokenParser._templateReplace(this.template, sValues);
					return sTokenText;
				},
				getConditionData: function(sText, oKeyField) {
					var range = {};
					range.exclude = this.exclude;
					if (this.exclude) {
						range.operation = TokenParser.excludeOperationsMapping[this.key];

						if (!range.operation) {
							range.operation = this.key;
						}
					} else {
						range.operation = this.key;
					}

					var aValues = this.parse(sText);
					for (var i = 0; i < aValues.length; i++) {
						range["value" + (i + 1)] = this.formatValue(aValues[i], true, oKeyField);
					}

					return range;
				},
				formatValue: function(sValue, bParseOnly, oKeyField) {
					if (!oKeyField) {
						return sValue;
					}

					if (oKeyField.hasOwnProperty("maxLength")) {
						if (oKeyField.maxLength >= 0) {
							sValue = sValue.substring(0, oKeyField.maxLength);
						}
					}

					if (oKeyField.displayFormat) {
						if (oKeyField.displayFormat === "UpperCase") {
							sValue = sValue.toUpperCase();
						}
					}

					if (oKeyField.oType) {
						try {
							sValue = oKeyField.oType.parseValue(sValue, "string");
							oKeyField.oType.validateValue(sValue);
						} catch (err) {
							return "ERROR";
						}
						if (!bParseOnly) {
							sValue = oKeyField.oType.formatValue(sValue, "string");
						}
					}

					return sValue;
				}
			};

			return this._mOperations[sOperationKey];
		};

		/**
		 * remove an operation of the parser
		 *
		 * @param {string} sOperationKey - key of the operation which will be removed
		 * @public
		 */
		TokenParser.prototype.removeOperation = function(sOperationKey) {
			delete this._mOperations[sOperationKey];
		};

		/**
		 * remove all operations of the parser
		 *
		 * @public
		 */
		TokenParser.prototype.removeAllOperations = function() {
			var aOperationKeys = Object.keys(this._mOperations);
			aOperationKeys.forEach(function(operationKey) {
				delete this._mOperations[operationKey];
			}, this);
		};

		/**
		 * returns the translated name of the operation
		 *
		 * @param {string} sType - type of the field
		 * @param {object} oOperation
		 * @param {string} sResourceBundle - name of the resource bundle
		 * @returns {string} translated name
		 * @public
		 */
		TokenParser.prototype.getTranslatedText = function(sType, oOperation, sResourceBundle) {
			var sTextKey = oOperation.key;

			sType = sType !== "default" ? "_" + sType.toUpperCase() + "_" : "";

			if (sType === "_STRING_" || sType === "_BOOLEAN_" || sType === "_NUMC_") {
				sType = "";
			}
			if (sType === "_TIME_") {
				sType = "_DATE_";
			}

			if (!sResourceBundle) {
				sResourceBundle = "sap.m";
			}

			sTextKey = "CONDITIONPANEL_OPTION" + sType + sTextKey;
			var sText = Lib.getResourceBundleFor(sResourceBundle).getText(sTextKey) || sTextKey;
			if (sText.startsWith("CONDITIONPANEL_OPTION")) {
				// when for the specified type the resource does not exist use the normal string resource text
				sTextKey = "CONDITIONPANEL_OPTION" + oOperation.key;
				sText = Lib.getResourceBundleFor(sResourceBundle).getText(sTextKey);
			}

			return sText;
		};

		/**
		 * associates an multiInput control with the token parser. The function is adding a validator to the multiInput and creates tokens when the input is matching to an operation
		 *
		 * @param {control} oInput - multiInput control
		 * @public
		 */
		TokenParser.prototype.associateInput = function(oInput) {
			this._oInput = oInput;

			//get the existing validators. We call this in our new added validator
			this._aOrgValidators = this._oInput && this._oInput.isA('sap.m.MultiInput') ? this._oInput.getValidators().slice() : [];

			this._oInput.removeAllValidators();
			this._oInput.addValidator(this._validator.bind(this));
		};

		TokenParser.prototype._validator = function(args) {
			//queue the validator calls
			if (this._aOrgValidators) {
				var oToken;

				this._aOrgValidators.some(function(fValidator) {
					oToken = fValidator(args);
					return oToken;
				}, this);

				if (oToken) {
					return oToken;
				}
			}

			if (args.text) {
				return this._onValidate(args.text);
			}

			return null;
		};

		/**
		 * fills the template string placeholder $0, $1 with the values from the aValues array and returns a formatted text for the specified condition
		 * @private
		 * @param {string} sTemplate the template which should be filled
		 * @param {string[]} aValues value array for the template placeholder
		 * @returns {string} the filled template text
		 */
		TokenParser._templateReplace = function(sTemplate, aValues) {
			return sTemplate.replace(/\$\d/g, function(sMatch) { return aValues[parseInt(sMatch.substr(1))]; });
		};

		/**
		 * called from the multiInput validator
		 *
		 * @param {string} sText - the entered text which should be parsed and validated
		 * @private
		 */
		TokenParser.prototype._onValidate = function(sText) {
			var oKeyField = this._aKeyFields.length > 0 ? this._aKeyFields[0] : null;

			// Ticket 1780396542
			if (this._oInput._getIsSuggestionPopupOpen && this._oInput._getIsSuggestionPopupOpen() &&
				this._oInput._oSuggestionsTable && this._oInput._oSuggestionsTable.getSelectedItem()) {
				//avoid the validation handling when the suggest list is open and the user has clicked on a suggest item.
				return null;
			}

			if (oKeyField) {
				var akeyFieldMaches = /^\w+\:\s/.exec(sText);
				if (akeyFieldMaches) {
					var sKeyLabel = akeyFieldMaches[0];
					var oTempKeyField = this._getKeyFieldByLabel(sKeyLabel.slice(0, sKeyLabel.indexOf(":")));
					if (oTempKeyField) {
						oKeyField = oTempKeyField;
						sText = sText.slice(akeyFieldMaches[0].length).trim();
					}
				}
			}

			var type = oKeyField && oKeyField.type || "default";
			var aTypeOperations = this.getTypeOperations(type);

			var fCheck = function(oOperation, sText) {
				if (oOperation.match(sText, oKeyField)) {
					var range = oOperation.getConditionData(sText, oKeyField);
					range.keyField = oKeyField ? oKeyField.key : null;

					//if maxLength is set to 1 we have to ignore the Contains, StartsWith or EndsWith operations
					if (oKeyField.hasOwnProperty("maxLength") && oKeyField.maxLength === 1) {
						if ([P13nConditionOperation.Contains, P13nConditionOperation.EndsWith, P13nConditionOperation.StartsWith].indexOf(oOperation.key) !== -1) {
							return;
						}
					}

					//for numc type the and operation Contains or EndsWith, we remove the leading zeros via the formatValue call
					if (type === "numc") {
						if ([P13nConditionOperation.Contains, P13nConditionOperation.EndsWith].indexOf(oOperation.key) !== -1) {
							range.value1 = oKeyField.oType.formatValue(range.value1, "string");
						}
					}

					var sTokenText = (oKeyField && oKeyField.label && this._aKeyFields.length > 1 ? oKeyField.label + ": " : "") + oOperation.getFilledTemplate(sText, oKeyField);
					sTokenText = ManagedObject.escapeSettingsValue(sTokenText);
					return new Token({ text: sTokenText, tooltip: sTokenText }).data("range", range);
				}
				return null;
			}.bind(this);

			var token;
			if (aTypeOperations.some(function(operationKey) {
					token = fCheck(this._mOperations[operationKey], sText);
					return token;
				}, this)) {
				return token;
			}

			// check for default operation
			//var sDefaultOperation = "EQ";
			if (this._sDefaultOperation && this._mOperations[this._sDefaultOperation]) {
				sText = TokenParser._templateReplace(this._mOperations[this._sDefaultOperation].template, [sText]);
				return fCheck(this._mOperations[this._sDefaultOperation], sText);
			}

			return null;
		};

		/**
		 * Creates a range token from text
		 *
		 * @param {string} sText - the entered text which should be converted to a range token
		 * @private
		 */
		TokenParser._createRangeByText = function(sText){
			var sOperation = TokenParser._matchOperationFromText(sText);

			if (!sOperation) {
				return {
					"exclude": false,
					"operation": P13nConditionOperation.EQ,
					"tokenText": null,
					"value1": sText,
					"value2": null
				};
			}

			var sConditionOperation = sOperation;
			var bExclude = false;

			if (TokenParser.excludeOperationsMapping[sOperation]) {
				sConditionOperation = TokenParser.excludeOperationsMapping[sOperation];
				bExclude = true;
			}

			var bMultipleOperands = sConditionOperation === P13nConditionOperation.BT ? true : false;

			return TokenParser._getRangeByTextAndOperation(sText, sConditionOperation, bExclude, bMultipleOperands);
		};

		/**
		 * Finds the best matching range operator from given text
		 *
		 * @param {string} sText - the text that may contain a range operation in it
		 * @private
		 */
		TokenParser._matchOperationFromText = function(sText){
			var aMatchingOperations = [];

			for (var operation in TokenParser.rangeOperations) {
				if (TokenParser.rangeOperations[operation].regex.test(sText)){
					aMatchingOperations.push(operation);
				}
			}

			if (aMatchingOperations.length === 0){
				return null;
			}
			if (aMatchingOperations.length > 1 ) {
				// When we have <empty> and <
				if (sText === FormatUtil.getFormattedRangeText(ValueHelpRangeOperation.Empty, null, null, false) &&
					aMatchingOperations.indexOf(TokenParser.rangeOperations[P13nConditionOperation.Empty].operator) > -1 ){
					aMatchingOperations = [TokenParser.rangeOperations[P13nConditionOperation.Empty].operator];
				}
				// When we have !<empty> and !<
				if (sText === FormatUtil.getFormattedRangeText(ValueHelpRangeOperation.Empty, null, null, true) &&
					aMatchingOperations.indexOf(TokenParser.rangeOperations[P13nConditionOperation.NotEmpty].operator) > -1 ){
					aMatchingOperations = [TokenParser.rangeOperations[P13nConditionOperation.NotEmpty].operator];
				}
				// When we have !(*$0*) and !($0*)
				if (aMatchingOperations.indexOf(TokenParser.rangeOperations[P13nConditionOperation.NotContains].operator) > -1 &&
					aMatchingOperations.indexOf(TokenParser.rangeOperations[P13nConditionOperation.NotStartsWith].operator) > -1 ) {
						return TokenParser.rangeOperations[P13nConditionOperation.NotContains].operator;
				}
			}

			return aMatchingOperations[0];
		};

		TokenParser._getRangeByTextAndOperation = function(sText, sOperation, bExclude, bMultipleOperands) {
			var aValues = [];

			if (bExclude && sText.startsWith("!(") && sText.endsWith(")")) {
				sText = sText.slice(2,-1);
			}

			var sTemplate = TokenParser.rangeOperations[sOperation].template;

			if (bMultipleOperands) {
				// $0...$1
				 aValues = sText.split("...");
				 return {
					"exclude": bExclude,
					"operation": sOperation,
					"value1": aValues[0],
					"value2": aValues[1]
				};
			} else {
				// sTemplate = "*$0*" or "=$0" etc...;
				var iStartIndex = sTemplate.indexOf("$0");
				var iEndIndex = iStartIndex + 2;

				if (iEndIndex === sTemplate.length) {
					sText = sText.slice(iStartIndex);
				} else {
					iEndIndex = (sTemplate.length - iEndIndex );
					sText = sText.slice(iStartIndex, -iEndIndex);
				}

				return {
					"exclude": bExclude,
					"operation": sOperation,
					"value1": sText,
					"value2": null
				};
			}
		};

		return TokenParser;
	}, true);
