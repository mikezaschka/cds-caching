/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
// Provides sap.ui.comp.config.condition.DateRangeType.
sap.ui.define([
	"sap/ui/core/Lib",
	'sap/ui/core/date/UI5Date',
	"sap/ui/thirdparty/jquery",
	'sap/ui/comp/config/condition/Type',
	'sap/ui/Device',
	'sap/ui/core/library',
	"sap/ui/comp/library",
	'sap/m/library',
	'sap/m/Input',
	'sap/m/Text',
	'sap/ui/core/ListItem',
	'sap/m/Label',
	'sap/ui/core/date/UniversalDate',
	'sap/ui/core/format/DateFormat',
	'sap/ui/comp/config/condition/NullableInteger',
	"sap/base/Log",
	"sap/ui/core/date/UniversalDateUtils",
	"sap/m/DynamicDateRange",
	"sap/m/DynamicDateUtil",
	"sap/m/DynamicDateFormat",
	"sap/m/DynamicDateOption",
	'sap/m/DynamicDateValueHelpUIType',
	"sap/m/StandardDynamicDateOption",
	"sap/ui/comp/util/DateTimeUtil",
	// jQuery Plugin "cursorPos"
	"sap/ui/dom/jquery/cursorPos",
	"sap/ui/core/Core",
	"sap/ui/model/type/Date",
	"sap/ui/model/type/Integer",
	"sap/ui/model/odata/type/String"
], function(
	Library,
	UI5Date,
	jQuery,
	Type,
	Device,
	coreLibrary,
	compLibrary,
	mLibrary,
	Input,
	Text,
	ListItem,
	Label,
	UniversalDate,
	DateFormat,
	NullableInteger,
	Log,
	UniversalDateUtils,
	DynamicDateRange,
	DynamicDateUtil,
	DynamicDateFormat,
	DynamicDateOption,
	DynamicDateValueHelpUIType,
	StandardDynamicDateOption,
	DateTimeUtil,
	cursorPos,
	Core,
	DateType,
	IntegerType,
	StringType
) {
	"use strict";

	var ValueState = coreLibrary.ValueState,
		StandardDynamicDateRangeKeys = Object.keys(mLibrary.StandardDynamicDateRangeKeys).concat(["LAST2WEEKS", "LAST3WEEKS", "LAST4WEEKS", "LAST5WEEKS", "NEXT2WEEKS", "NEXT3WEEKS", "NEXT4WEEKS", "NEXT5WEEKS"]);

	var DateRangeType = Type.extend("sap.ui.comp.config.condition.DateRangeType", /** @lends "sap.ui.comp.config.condition.DateRangeType.prototype */ {

		constructor: function(sFieldName, oFilterProvider, oFieldViewMetadata) {
			Type.apply(this, [
				sFieldName, oFilterProvider, oFieldViewMetadata
			]);
			this.oDateFormat = oFilterProvider && oFilterProvider._oDateFormatSettings ? oFilterProvider._oDateFormatSettings : {
				UTC: true
			};

			this._bIgnoreTime = false;
			this._maxIntValue = 10000; // max int value for "LAST/NEXT X DAYS/MONTH...." operators
			this.bMandatory = this.oFieldMetadata ? this.oFieldMetadata.isMandatory : false;
			var sFieldMetadataName = this.oFieldMetadata && this.oFieldMetadata.name,
				oControlConfiguration = oFilterProvider && oFilterProvider._oAdditionalConfiguration &&
			(oFilterProvider._oAdditionalConfiguration.getControlConfigurationByKey(sFieldName) || (sFieldMetadataName && oFilterProvider._oAdditionalConfiguration.getControlConfigurationByKey(sFieldMetadataName)));
			this._bSingleFilterRestriction = oFieldViewMetadata && oFieldViewMetadata.filterRestriction === compLibrary.smartfilterbar.FilterType.single &&
				(oFilterProvider._bUseDateRangeType || oControlConfiguration && (oControlConfiguration.conditionType === this.getName() ||
				(typeof oControlConfiguration.conditionType === "object" && oControlConfiguration.conditionType.module === this.getName())));
			this._bDTOffset = oFieldViewMetadata && oFieldViewMetadata.filterRestriction === compLibrary.smartfilterbar.FilterType.interval && oFieldViewMetadata.type === "Edm.DateTimeOffset";
			this._customSemanticOperation = null;
		}
	});

	DateRangeType.prototype.applySettings = function(oSettings) {
		Type.prototype.applySettings.apply(this, arguments);

		if (oSettings && oSettings.ignoreTime) {
			this._bIgnoreTime = oSettings.ignoreTime;
		}
	};

	/**
	 * Sets and returns the given date with the start time 00:00:00.000 UTC
	 *
	 * @param {sap.ui.core.date.UniversalDate} oDate the date
	 * @returns {sap.ui.core.date.UniversalDate} the given date with the start time 00:00:00.000 UTC
	 */
	DateRangeType.setStartTime = function(oDate) {
		oDate = DateRangeType.toUniversalDate(oDate);
		return UniversalDateUtils.resetStartTime(oDate);
	};

	/**
	 * Sets and returns the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
	 *
	 * @param {sap.ui.core.date.UniversalDate} oDate the date
	 * @param {boolean} bIgnoreTime If false the time will be set to 00:00:00 otherwise 23:59:59
	 * @returns {sap.ui.core.date.UniversalDate} the given date with the end time 23:59:59.999 UTC
	 */
	DateRangeType.setEndTime = function(oDate, bIgnoreTime) {
		oDate = DateRangeType.toUniversalDate(oDate);
		if (!bIgnoreTime) {
			return UniversalDateUtils.resetEndTime(oDate);
		} else {
			return UniversalDateUtils.resetStartTime(oDate);
		}
	};

	/**
	 * Sets and returns time with milliseconds (depending on given precision)
	 *
	 * @param {sap.ui.core.date.UniversalDate} oDate the date
	 * @returns {sap.ui.core.date.UniversalDate} the given date with the end .999
	 */
	DateRangeType.setMilliseconds = function(oDate) {
		oDate = DateRangeType.toUniversalDate(oDate);
		oDate.setMilliseconds(999);
		return oDate.oDate;
	};

	/**
	 * Converts oDate into an UniversalDate instance
	 *
	 * @param {object} [oDate] the date
	 * @returns {sap.ui.core.date.UniversalDate} the given date as UniversalDate
	 */
	DateRangeType.toUniversalDate = function(oDate) {
		if (oDate instanceof Date) {
			return UniversalDate.getInstance(oDate);
		}
		if (!oDate) {
			return UniversalDate.getInstance();
		}
		if (!(oDate instanceof UniversalDate)) {
			return DateRangeType.toUniversalDate(UI5Date.getInstance(oDate));
		}

		return oDate;
	};

	/**
	 * Returns the weeks start date of a given universal date based on the locale and format settings
	 */
	DateRangeType.getWeekStartDate = function(oUniversalDate) {
		return UniversalDateUtils.getWeekStartDate(oUniversalDate);
	};

	/**
	 * Returns the month start date of a given universal date
	 */
	DateRangeType.getMonthStartDate = function(oUniversalDate) {
		return UniversalDateUtils.getMonthStartDate(oUniversalDate);
	};

	/**
	 * Returns the quarter start date of a given universal date
	 */
	DateRangeType.getQuarterStartDate = function(oUniversalDate) {
		return UniversalDateUtils.getQuarterStartDate(oUniversalDate);
	};

	/**
	 * Returns the years start date of a given universal date. If no date is given, today is used.
	 *
	 * @param {sap.ui.core.date.UniversalDate} [oUniversalDate] the universal date
	 * @returns the years start date of a given universal date.
	 * @public
	 */
	DateRangeType.getYearStartDate = function(oUniversalDate) {
		return UniversalDateUtils.getYearStartDate(oUniversalDate);
	};

	/**
	 * Returns an array of a date range based on the given universal date If no date is given, today is used.
	 *
	 * @param {int} iValue positive and negative values to calculate the date range
	 * @param {string} sType defines the range that the iValue refers to ("DAY","WEEK","MONTH","QUARTER","YEAR")
	 * @param {sap.ui.core.date.UniversalDate} [oUniversalDate] the universal date
	 * @param {boolean} bCalcBaseStartDate calculate start date even if Date is provided
	 * @param {boolean} bIgnoreCurrentInterval If iValue > 0 the start date is the begin of the next interval
	 * @returns {sap.ui.core.date.UniversalDate[]} array with 2 values where [0] is the start and [1] is the end date for the range
	 * @public
	 */
	DateRangeType.getDateRange = function(iValue, sType, oUniversalDate, bCalcBaseStartDate, bIgnoreCurrentInterval) {
		if (oUniversalDate === true) {
			bCalcBaseStartDate = true;
			oUniversalDate = null;
		}
		if (!oUniversalDate) {
			oUniversalDate = new UniversalDate();
		} else {
			oUniversalDate = new UniversalDate( oUniversalDate);
		}

		if (bCalcBaseStartDate) {
			switch (sType) {
			case "DAY":
				break;
			case "WEEK":
				oUniversalDate = UniversalDateUtils.getWeekStartDate(oUniversalDate);
				break;
			case "MONTH":
				oUniversalDate = UniversalDateUtils.getMonthStartDate(oUniversalDate);
				break;
			case "QUARTER":
				oUniversalDate = UniversalDateUtils.getQuarterStartDate(oUniversalDate);
				break;
			case "YEAR":
				oUniversalDate = UniversalDateUtils.getYearStartDate(oUniversalDate);
				break;
			}
		}

		if (!bIgnoreCurrentInterval && iValue > 0) {

			if (iValue !== 0 && !isNaN(iValue)) {
				var offset = -1;
				switch (sType) {
					case "DAY":
					oUniversalDate.setDate(oUniversalDate.getDate() + offset);
					break;
				case "WEEK":
					oUniversalDate.setDate(oUniversalDate.getDate() + (offset * 7));
					break;
				case "MONTH":
					oUniversalDate.setMonth(oUniversalDate.getMonth() + offset);
					break;
				case "QUARTER":
					oUniversalDate.setMonth(oUniversalDate.getMonth() + (offset * 3));
					break;
				case "YEAR":
					oUniversalDate.setFullYear(oUniversalDate.getFullYear() + offset);
					break;
				}
			}
		}

		return UniversalDateUtils.getRange(iValue, sType, oUniversalDate, false);
	};

	DateRangeType.getTextField = function(oInstance, bExpression) {
		var sId = Type._createStableId(oInstance, "text");

		if (bExpression) {
			return new Text(sId, {
				text: {
					parts: [
						{
							path: '$smartEntityFilter>value1',
							type: new DateType({
								style: oInstance.oDateFormat.style,
								pattern: oInstance.oDateFormat.pattern
							})
						},
						{
							path: '$smartEntityFilter>value2',
							type: new DateType({
								style: oInstance.oDateFormat.style,
								pattern: oInstance.oDateFormat.pattern
							})
						}
					],
					formatter: (v1,v2) => `${v1} - ${v2}`
				}
			});
		} else {
			return new Text(sId, {
				text: {
					path: '$smartEntityFilter>value1',
					type: new DateType({
						style: oInstance.oDateFormat.style,
						pattern: oInstance.oDateFormat.pattern
					})
				}
			});
		}

	};

	DateRangeType.getIntField = function(oInstance) {
		return new Input(Type._createStableId(oInstance, "field"), {
			value: {
				path: "$smartEntityFilter>value1",
				type: new NullableInteger({}, { minimum: 0, maximum: oInstance._maxIntValue })
			},
			textAlign: "End",
			//type: "Number",
			width: "100%"
		});
	};

	DateRangeType.getIntFromToField = function(oInstance, aResult, oOperation) {
		var oLabel = new Label({ text: Type.getTranslatedText("CONDITION_DATERANGETYPE_DATERANGE_LABELFROM") });
		oLabel.addStyleClass("sapUiCompFilterBarCTPaddingTop");
		aResult.push(oLabel);
		var oControlFrom = oInstance._createIntFromToControl(oInstance, "fieldFrom", "value1");
		oLabel.setLabelFor(oControlFrom);
		aResult.push(oControlFrom);

		oLabel = new Label({ text: Type.getTranslatedText("CONDITION_DATERANGETYPE_DATERANGE_LABELTO") });
		oLabel.addStyleClass("sapUiCompFilterBarCTPaddingTop");
		aResult.push(oLabel);
		var oControlTo = oInstance._createIntFromToControl(oInstance, "fieldTo", "value2");
		oLabel.setLabelFor(oControlTo);
		aResult.push(oControlTo);
		oInstance._setIntControlBinding(oControlFrom,  oOperation, "value1");
		oInstance._setIntControlBinding(oControlTo,  oOperation, "value2");
	};

	DateRangeType.ControlFactory = function(oInstance, aResult, oOperation) {
		if (oOperation.type === "range") {
			var oControl = DateRangeType.getTextField(oInstance, oOperation.display !== "start");
			oControl.addStyleClass("sapUiCompFilterBarCTPaddingTop");
			aResult.push(oControl);
			return;
		}
		if (oOperation.type === "int") {
			var oControl = DateRangeType.getIntField(oInstance);
			aResult.push(oControl);
			if (oOperation.descriptionTextKeys) {
				oControl.setFieldWidth("auto");
				oControl.bindProperty("description", {
					path: "$smartEntityFilter>value1",
					type: new IntegerType(),
					formatter: function() {
						var sTextKey = oOperation.descriptionTextKeys[0];
						var sTextMulti = oOperation.descriptionTextKeys[1];
						if (this.getBinding("description").getValue() === 1) {
							return Type.getTranslatedText(sTextKey);
						} else {
							return Type.getTranslatedText(sTextMulti || sTextKey);
						}
					}
				});
			}
		}
		if (oOperation.type === "[int,int]") {
			DateRangeType.getIntFromToField(oInstance,aResult, oOperation);
		}
	};

	DateRangeType._defaultOnChangeHandler = function(sValue, oInstance) {
		//console.log("---> onChange :" + sValue);
		if (sValue.toLowerCase() === this.languageText.toLowerCase()) {
			oInstance.oModel.setProperty("/condition/operation", this.key);
			oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());

			if (this.category.indexOf("FIXED") !== 0) {
				//oInstance._toggleOpen();
				oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
			}

			return true;
		}
		return false;
	};

	DateRangeType._IntOnChangeHandler = function(sValue, oInstance) {
		if (this.basicLanguageText.indexOf("{0}") >= 0) {
			var rx = new RegExp(this.basicLanguageText.replace("+", "\\+").replace("{0}", "([a-zA-Z0-9_]+)") + "$", 'i');
			if (sValue.match(rx)) {
				var sValue = sValue.match(rx)[1];
				if (sValue) {
					var iValue = parseInt(sValue);

					if (!isNaN(iValue) && iValue <= oInstance._maxIntValue) {
						oInstance.oModel.setProperty("/condition/operation", this.key);
						oInstance.oModel.setProperty("/condition/value1", iValue);
						oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
					} else {
						oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
					}
					return true;
				}
			}
		}
		return false;
	};

	DateRangeType._DefaultFilterSuggestItem = function(sValue, oItem, oInstance) {
		var bMatch = false;
		if (this.languageText.toLowerCase().startsWith(sValue.toLowerCase())) {
			bMatch = true;
		} else {
			var aWords = this.languageText.split(" ");
			for (var i = 0; i < aWords.length; i++) {
				var sWord = aWords[i];
				if (sWord.toLowerCase().startsWith(sValue.toLowerCase())) {
					bMatch = true;
				}
			}
		}

		oItem.setAdditionalText(this.textValue);
		oItem.setText(this.languageText);
		return bMatch;
	};

	DateRangeType._HideFilterSuggestItem = function(sValue, oItem, oInstance) {
		return false;
	};

	DateRangeType._IntFilterSuggestItem = function(sValue, oItem, oInstance) {
		if (!this.basicLanguageText) {
			this.basicLanguageText = oInstance.basicLanguageText;
		}

		if (!this.basicLanguageText){
			this.basicLanguageText = this.languageText || Type.getTranslatedText(this.textKey);
		}

		var xPos = this.basicLanguageText.indexOf("{0}");
		var sPart1;
		var sPart2;
		if (xPos >= 0) {
			sPart1 = this.basicLanguageText.slice(0, xPos).trim();
			sPart2 = this.basicLanguageText.slice(xPos + 3).trim();
		}

		var aParts = sValue.split(" ");
		if (aParts.length < 1 || aParts.length > 3) {
			return false;
		}
		var bMatch = false;
		var sNumber;
		var isValidNumber = function(sValue) {
			return !!sValue.match(/(^[0-9]+$)/) && parseInt(sValue) >= 0;
		};

		if (sPart1.toLowerCase().startsWith(aParts[0].toLowerCase())) {
			// starts with the first word
			if (aParts[1]) {
				if (isValidNumber(aParts[1])) {
					// second part is number
					sNumber = aParts[1];
					if (aParts[2]) {
						if (sPart2.toLowerCase().startsWith(aParts[2].toLowerCase())) {
							bMatch = true;
						}
					} else {
						bMatch = true;
					}
				}
			} else {
				// only first part -> OK
				bMatch = true;
			}
		} else if (isValidNumber(aParts[0]) && aParts.length < 3) {
			// starts with number
			sNumber = aParts[0];
			if (aParts[1]) {
				if (sPart2.toLowerCase().startsWith(aParts[1].toLowerCase())) {
					bMatch = true;
				}
			} else {
				// only number -> OK
				bMatch = true;
			}
		} else if (sPart2.toLowerCase().startsWith(aParts[0].toLowerCase()) && aParts.length == 1) {
			// starts with last word
			bMatch = true;
		}

		if (bMatch && sNumber) {
			var sType;
			switch (this.category) {
				case "DYNAMIC.DATE.INT":
					sType = "DAY";
					break;
				case "DYNAMIC.WEEK.INT":
					sType = "WEEK";
					break;
				case "DYNAMIC.MONTH.INT":
					sType = "MONTH";
					break;
				case "DYNAMIC.QUARTER.INT":
					sType = "QUARTER";
					break;
				case "DYNAMIC.YEAR.INT":
					sType = "YEAR";
					break;

				default:
					sType = "DAY";
					break;
			}

			var iNumber = parseInt(sNumber),
				bFlag = true;

			if (!oInstance._maxIntValue) {
				oInstance._maxIntValue = oInstance.getControls(oInstance.key)[0].getBindingInfo('value').type.oConstraints.maximum;
			}
			if (iNumber > oInstance._maxIntValue) {
				bMatch = false;
			}

			if (this.key.startsWith("LAST")) {
				iNumber = iNumber * -1;
				bFlag = false;
			}

			var aDates;
			if (this.getDateRange) {
				var oRange = this.getDateRange({ operation: this.key, value1: iNumber });
				aDates = [oRange.value1, oRange.value2];

			} else {
				aDates = DateRangeType.getDateRange(iNumber, sType, true, bFlag, bFlag);
			}
			var oDateFormatter = oInstance._getDateFormatter(true);
			if (Math.abs(iNumber) === 1 && this.singulareBasicLanguageText) {
				oItem.setText(this.singulareBasicLanguageText);
				if (sType !== "DAY") {
					oItem.setAdditionalText(oDateFormatter.format(aDates[0]) + " - " + oDateFormatter.format(aDates[1]));
				} else {
					oItem.setAdditionalText(oDateFormatter.format(aDates[0]));
				}
			} else {
				oItem.setText(oInstance._fillNumberToText(this.basicLanguageText, sNumber));
				oItem.setAdditionalText(oDateFormatter.format(aDates[0]) + " - " + oDateFormatter.format(aDates[1]));
			}
			oItem._value1 = parseInt(sNumber);
		} else {
			oItem.setAdditionalText(null);
			oItem.setText(this.languageText);
			oItem._value1 = null;
		}
		return bMatch;
	};

	DateRangeType._DefaultOnItemSelected = function(sValue, oItem, oInstance) {

		oInstance.oModel.setProperty("/condition/operation", this.key);
		if ("value1" in this) {
			oInstance.oModel.setProperty("/condition/value1", oItem._value1);
		}
		if ("value2" in this) {
			oInstance.oModel.setProperty("/condition/value2", oItem._value2);
		}
		oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
		oInstance._bSuggestItemSelected = true;

	};

	DateRangeType._IntOnItemSelected = function(sValue, oItem, oInstance) {

		var iNumber = oItem._value1;

		oInstance.oModel.setProperty("/condition/operation", this.key);
		oInstance.oModel.setProperty("/condition/value1", iNumber);
		oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
		oInstance._bSuggestItemSelected = true;
	};

	DateRangeType.getFixedRangeOperation = function(sKey, sTextKey, sCategory, aDefaults, fnFilterSuggestItem, iOrder) {
		return Object.assign({
			textKey: sTextKey,
			filterSuggestItem: fnFilterSuggestItem || DateRangeType._DefaultFilterSuggestItem,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			getControls: DateRangeType.ControlFactory
		}, DateRangeType._getFixedRangeOperation(sKey, sCategory, aDefaults, iOrder));
	};

	/**
	 * Used internally because text keys are not used anymore. We rely on the DynamicDateRange for the default operations
	 * and on the DynamicDateRange control for suggestions and change handlers
	 *
	 * @private
	 */
	DateRangeType._getFixedRangeOperation = function(sKey, sCategory, aDefaults, iOrder) {
		return {
			key: sKey,
			category: sCategory,
			order: iOrder || 100,
			defaultValues: aDefaults || null,
			type: "range",
			display: "range"
		};
	};

	/**
	 * function to create a new operation for a dynamic int value with a single int value.
	 *
	 * @public
	 * @since 1.60.0
	 * @param {string} sKey unique key for the new operation
	 * @param {string} sTextKey text for the new operation
	 * @param {string} sSingularTextKey singular text for the new operation
	 * @param {string} sCategory category of the operation
	 * @param {int} iDefault the default int value for the operation
	 * @param {string[]} aDescriptionTextKeys array of two descriptions text (multiple/singular text)
	 * @param {int} iOrder the order value of the new operation in the operations list
	 * @param {string} sZeroNumberTextKey zero text for the new operation
	 *
	 * @returns {object} object for the new created operation. The getDateRange on this object must be implemented.
	 */
	DateRangeType.createSingleIntRangeOperation = function(sKey, sTextKey, sSingularTextKey, sCategory, iDefault, aDescriptionTextKeys, iOrder, sZeroNumberTextKey) {
		return Object.assign({
			textKey: sTextKey,
			singularTextKey: sSingularTextKey,
			zeroNumberTextKey: sZeroNumberTextKey,
			descriptionTextKeys: aDescriptionTextKeys,
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory

			/**
			 * function to determine the date values that are used in the filter request.
			 *
			 * Normally the returned values are based on the conditions value1 and value2.
			 *
			 * @public
			 * @since 1.60.0
			 * @param {object} oCondition current DateRange condition (operation, value1, value2)
			 * @param {string} oCondition.operation Name of the custom operation
			 * @param {any} oCondition.value1 value of a condition
			 * @param {any} oCondition.value2 second value of a condition (if exist)
			 *
			 * @returns {any[] | null} object with operation and value1, value2 or null if value is not set.
			 */
			//getDateRange: function(oCondition) { return null; },
		}, DateRangeType._createSingleIntRangeOperation(sKey, sCategory, iDefault, iOrder));
	};

	/**
	 * Used internally because text keys are not used anymore. We rely on the DynamicDateRange for the default operations
	 * and on the DynamicDateRange control for suggestions and change handlers
	 *
	 * @private
	 */
	DateRangeType._createSingleIntRangeOperation = function(sKey, sCategory, iDefault, iOrder) {
		return {
			key: sKey,
			category: sCategory,
			order: iOrder,
			defaultValues: [iDefault],
			value1: null,
			type: "int",
			_getInitialValues: function(oCondition) {
				return [oCondition.value1, oCondition.value2];
			}
		};
	};

	/**
	 * Supported operations of the DateRangeType
	 */
	DateRangeType.Operations = {
		DATERANGE: {
			key: "DATERANGE",
			category: "DYNAMIC.DATERANGE",
			order: 2,
			defaultOperation: true,
			defaultValues: [
				null, null
			],
			value1: null,
			value2: null
		},
		DATE: {
			key: "DATE",
			category: "DYNAMIC.DATE",
			order: 0,
			defaultValues: [
				null
			],
			value1: null
		},
		FROM: {
			key: "FROM",
			category: "DYNAMIC.DATE",
			order: 0,
			defaultValues: [
				null
			],
			value1: null
		},
		TO: {
			key: "TO",
			category: "DYNAMIC.DATE",
			order: 1,
			defaultValues: [
				null
			],
			value1: null
		},
		LASTDAYS: DateRangeType._createSingleIntRangeOperation("LASTDAYS", "DYNAMIC.DATE.INT", 1, 4),
		LASTWEEKS: DateRangeType._createSingleIntRangeOperation("LASTWEEKS", "DYNAMIC.WEEK.INT", 1, 8),
		LASTMONTHS: {
			key: "LASTMONTHS",
			category: "DYNAMIC.MONTH.INT",
			order: 14,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		LASTQUARTERS: {
			key: "LASTQUARTERS",
			category: "DYNAMIC.QUARTER.INT",
			order: 19,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		LASTYEARS: {
			key: "LASTYEARS",
			category: "DYNAMIC.YEAR.INT",
			order: 28,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		NEXTDAYS: {
			key: "NEXTDAYS",
			category: "DYNAMIC.DATE.INT",
			order: 5,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		NEXTWEEKS: {
			key: "NEXTWEEKS",
			category: "DYNAMIC.WEEK.INT",
			order: 10,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		NEXTMONTHS: {
			key: "NEXTMONTHS",
			category: "DYNAMIC.MONTH.INT",
			order: 16,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		NEXTQUARTERS: {
			key: "NEXTQUARTERS",
			category: "DYNAMIC.QUARTER.INT",
			order: 21,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		NEXTYEARS: {
			key: "NEXTYEARS",
			category: "DYNAMIC.YEAR.INT",
			order: 30,
			defaultValues: [
				1
			],
			value1: null,
			type: "int"
		},
		SPECIFICMONTH: {
			key: "SPECIFICMONTH",
			category: "DYNAMIC.MONTH",
			order: 11,
			defaultValues: function() {
				var oDate = new UniversalDate();
				return [
					oDate.getMonth()
				];
			},
			value1: null
		},
		YESTERDAY: {
			key: "YESTERDAY",
			category: "FIXED.DATE",
			order: 3.1,
			defaultValues: function() {
				return UniversalDateUtils.ranges.yesterday();
			},
			type: "range",
			display: "start"
		},
		TODAY: {
			key: "TODAY",
			category: "FIXED.DATE",
			order: 3,
			defaultValues: function() {
				return UniversalDateUtils.ranges.today();
			},
			type: "range",
			display: "start"
		},
		TOMORROW: {
			key: "TOMORROW",
			category: "FIXED.DATE",
			order: 3.2,
			defaultValues: function() {
				var aDateRange = UniversalDateUtils.ranges.tomorrow();
				return aDateRange;
			},
			type: "range",
			display: "start"
		},
		THISWEEK: DateRangeType._getFixedRangeOperation("THISWEEK", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.currentWeek("Default");
		}, 6),
		LASTWEEK: DateRangeType._getFixedRangeOperation("LASTWEEK", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.lastWeek("Default");
		}, 7),
		LAST2WEEKS: DateRangeType._getFixedRangeOperation("LAST2WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.lastWeeks(-2, "Default");
		}, -1),
		LAST3WEEKS: DateRangeType._getFixedRangeOperation("LAST3WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.lastWeeks(-3, "Default");
		}, -1),
		LAST4WEEKS: DateRangeType._getFixedRangeOperation("LAST4WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.lastWeeks(-4, "Default");
		}, -1),
		LAST5WEEKS: DateRangeType._getFixedRangeOperation("LAST5WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.lastWeeks(-5, "Default");
		}, -1),
		NEXTWEEK: DateRangeType._getFixedRangeOperation("NEXTWEEK", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.nextWeek("Default");
		}, 9),
		NEXT2WEEKS: DateRangeType._getFixedRangeOperation("NEXT2WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.nextWeeks(2, "Default");
		}, -1),
		NEXT3WEEKS: DateRangeType._getFixedRangeOperation("NEXT3WEEKS", "FIXED.WEEK", function() {
			return  UniversalDateUtils.ranges.nextWeeks(3, "Default");
		}, -1),
		NEXT4WEEKS: DateRangeType._getFixedRangeOperation("NEXT4WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.nextWeeks(4, "Default");
		}, -1),
		NEXT5WEEKS: DateRangeType._getFixedRangeOperation("NEXT5WEEKS", "FIXED.WEEK", function() {
			return UniversalDateUtils.ranges.nextWeeks(5, "Default");
		}, -1),
		THISMONTH: DateRangeType._getFixedRangeOperation("THISMONTH", "FIXED.MONTH", function() {
			return UniversalDateUtils.ranges.currentMonth();
		}, 12),
		LASTMONTH: DateRangeType._getFixedRangeOperation("LASTMONTH", "FIXED.MONTH", function() {
			return UniversalDateUtils.ranges.lastMonth();
		}, 13),
		NEXTMONTH: DateRangeType._getFixedRangeOperation("NEXTMONTH", "FIXED.MONTH", function() {
			return UniversalDateUtils.ranges.nextMonth();
		}, 15),
		THISQUARTER: DateRangeType._getFixedRangeOperation("THISQUARTER", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.currentQuarter();
		}, 17),
		LASTQUARTER: DateRangeType._getFixedRangeOperation("LASTQUARTER", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.lastQuarter();
		}, 18),
		NEXTQUARTER: DateRangeType._getFixedRangeOperation("NEXTQUARTER", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.nextQuarter();
		}, 20),
		YEARTODATE: DateRangeType._getFixedRangeOperation("YEARTODATE", "FIXED.YEAR", function() {
			return UniversalDateUtils.ranges.yearToDate();
		}, 31),
		THISYEAR: DateRangeType._getFixedRangeOperation("THISYEAR", "FIXED.YEAR", function() {
			return UniversalDateUtils.ranges.currentYear();
		}, 26),
		LASTYEAR: DateRangeType._getFixedRangeOperation("LASTYEAR", "FIXED.YEAR", function() {
			return UniversalDateUtils.ranges.lastYear();
		}, 27),
		NEXTYEAR: DateRangeType._getFixedRangeOperation("NEXTYEAR", "FIXED.YEAR", function() {
			return UniversalDateUtils.ranges.nextYear();
		}, 29),
		QUARTER1: DateRangeType._getFixedRangeOperation("QUARTER1", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.quarter(1);
		}, 22),
		QUARTER2: DateRangeType._getFixedRangeOperation("QUARTER2", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.quarter(2);
		}, 23),
		QUARTER3: DateRangeType._getFixedRangeOperation("QUARTER3", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.quarter(3);
		}, 24),
		QUARTER4: DateRangeType._getFixedRangeOperation("QUARTER4", "FIXED.QUARTER", function() {
			return UniversalDateUtils.ranges.quarter(4);
		}, 25),
		TODAYFROMTO: {
			key: "TODAYFROMTO",
			category: "DYNAMIC.DATE.INT",
			order: 3.3,
			defaultValues: [1, 1],
			type: "[int,int]",
			display: "int",
			value1: null,
			value2: null
		}
	};

	DateRangeType.SingleOperations = {
		DATE: Object.assign({},
			DateRangeType.Operations.DATE,
			{
				defaultOperation: true
			}),
		YESTERDAY: DateRangeType.Operations.YESTERDAY,
		TODAY: DateRangeType.Operations.TODAY,
		TOMORROW: DateRangeType.Operations.TOMORROW,
		FIRSTDAYWEEK:{
			key: "FIRSTDAYWEEK",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "FIRSTDAYWEEK", values:[]}, "Default");
			}
		},
		LASTDAYWEEK:{
			key: "LASTDAYWEEK",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "LASTDAYWEEK", values:[]}, "Default");
			}
		},
		FIRSTDAYMONTH:{
			key: "FIRSTDAYMONTH",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "FIRSTDAYMONTH", values:[]});
			}
		},
		LASTDAYMONTH:{
			key: "LASTDAYMONTH",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "LASTDAYMONTH", values:[]});
			}
		},
		FIRSTDAYQUARTER:{
			key: "FIRSTDAYQUARTER",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "FIRSTDAYQUARTER", values:[]});
			}
		},
		LASTDAYQUARTER:{
			key: "LASTDAYQUARTER",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "LASTDAYQUARTER", values:[]});
			}
		},
		FIRSTDAYYEAR:{
			key: "FIRSTDAYYEAR",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "FIRSTDAYYEAR", values:[]});
			}
		},
		LASTDAYYEAR:{
			key: "LASTDAYYEAR",
			category: "FIXED.DATE",
			type: "range",
			display: "start",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "LASTDAYYEAR", values:[]});
			}
		}
	};

	/**
	 * Additional supported operations of new DynamicDateRange in DateRangeType
	 */
	DateRangeType.NewDynamicDateRangeOperations = {
		DATETOYEAR:{
			key: "DATETOYEAR",
			category: "FIXED.YEAR",
			type: "range",
			display: "range",
			defaultValues: function() {
				return new StandardDynamicDateOption().toDates({operator: "DATETOYEAR", values:[]});
			}
		},
		LASTDAYSINCLUDED: {
			key: "LASTDAYSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTWEEKSINCLUDED: {
			key: "LASTWEEKSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTMONTHSINCLUDED: {
			key: "LASTMONTHSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTQUARTERSINCLUDED: {
			key: "LASTQUARTERSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTYEARSINCLUDED: {
			key: "LASTYEARSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTDAYSINCLUDED: {
			key: "NEXTDAYSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTWEEKSINCLUDED: {
			key: "NEXTWEEKSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTMONTHSINCLUDED: {
			key: "NEXTMONTHSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTQUARTERSINCLUDED: {
			key: "NEXTQUARTERSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTYEARSINCLUDED: {
			key: "NEXTYEARSINCLUDED",
			category: "DYNAMIC.DATE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		}
	};

	DateRangeType.DTOffsetOperations = Object.assign({
		NEXTMINUTES: {
			key: "NEXTMINUTES",
			category: "DYNAMIC.MINUTE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTHOURS: {
			key: "NEXTHOURS",
			category: "DYNAMIC.HOUR.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTMINUTES: {
			key: "LASTMINUTES",
			category: "DYNAMIC.MINUTE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTHOURS: {
			key: "LASTHOURS",
			category: "DYNAMIC.HOUR.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTMINUTESINCLUDED: {
			key: "LASTMINUTESINCLUDED",
			category: "DYNAMIC.MINUTE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		LASTHOURSINCLUDED: {
			key: "LASTHOURSINCLUDED",
			category: "DYNAMIC.HOUR.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTMINUTESINCLUDED: {
			key: "NEXTMINUTESINCLUDED",
			category: "DYNAMIC.MINUTE.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		},
		NEXTHOURSINCLUDED: {
			key: "NEXTHOURSINCLUDED",
			category: "DYNAMIC.HOUR.INT",
			type: "int",
			value1: null,
			defaultValues: [null]
		}
	},
	DateRangeType.Operations,
	DateRangeType.NewDynamicDateRangeOperations,
	{
		DATERANGE: Object.assign({}, DateRangeType.Operations.DATERANGE, {
			defaultOperation: false
		}),
		DATETIME: {
			key: "DATETIME",
			category: "DYNAMIC.DATETIME",
			type: "range",
			display: "range",
			value1: null,
			value2: null,
			defaultValues: [null]
		},
		DATETIMERANGE: {
			key: "DATETIMERANGE",
			category: "DYNAMIC.DATETIMERANGE",
			type: "range",
			display: "range",
			defaultOperation: true,
			value1: null,
			value2: null,
			defaultValues: [null, null]
		}
	});

	/**
	 * Returns the controls to be used for the given operation
	 *
	 * @param {object} oOperation the current operation of the condition type
	 * @returns [sap.ui.core.Control] Array of controls to be used to visualize the condition types operation
	 * @protected
	 */
	DateRangeType.prototype.getControls = function(oOperation) {
		var aControls = [];
		if (!oOperation) {
			return;
		}

		if (!oOperation.getControls){
			oOperation.getControls = DateRangeType.ControlFactory;
		}

		oOperation.getControls(this, aControls, oOperation);
		return aControls;
	};


	/**
	 * Property setter for the ignoreTime
	 *
	 * @param {boolean} bIgnoreTime new value of this property
	 * @public
	 */
	DateRangeType.prototype.setIgnoreTime = function(bIgnoreTime) {
		this._bIgnoreTime = bIgnoreTime;
	};

	/**
	 * Gets current value of property ignoreTime.
	 * When the value is true, the returned range enddate has a time stamp of 00:00:00. The default for the time stamp is 23:59:59:999
	 *
	 * Default value is false.
	 *
	 * @returns {boolean} of controls to be used to visualize the condition types operation
	 * @public
	 */
	Type.prototype.getIgnoreTime = function(bIgnoreTime) {
		return this._bIgnoreTime;
	};

	/**
	 * Returns the default values for the given operation
	 *
	 * @param {object} oOperation the current operation of the condition type
	 * @returns [object] Array of default values to be used for the operation
	 * @protected
	 */
	DateRangeType.prototype.getDefaultValues = function(oOperation) {
		if (!oOperation) {
			return [];
		}
		var aDefaultValues = oOperation.defaultValues || [];
		if (typeof aDefaultValues === "function") {
			aDefaultValues = oOperation.defaultValues();
		}
		var oCondition = this.getCondition(),
			oValue1 = aDefaultValues[0] || null,
			oValue2 = aDefaultValues[1] || null;
		if (oOperation.key === "DATERANGE" && oCondition && oCondition.value1 && oCondition.value2 &&
			(oCondition.value1 instanceof Date && oCondition.value2 instanceof Date ||
			oCondition.value1.oDate && oCondition.value2.oDate )) {
			//Default fallback to a date range if value1 and value2 are already provided as dates
			oValue1 = oCondition.value1.oDate || oCondition.value1;
			oValue2 = oCondition.value2.oDate || oCondition.value2;
		} else {
			// make sure that both values are of type UniversalDate
			if (oValue1 instanceof Date) {
				oValue1 = new UniversalDate(oValue1);
			}
			if (oValue2 instanceof Date) {
				oValue2 = new UniversalDate(oValue2);
			}
		}

		return [
			oValue1, oValue2
		];
	};

	DateRangeType.prototype.getOperations = function() {
		if (this._bSingleFilterRestriction) {
			return this.getSingleOperations();
		}

		if (this._bDTOffset) {
			return this.getDTOffsetOperations();
		}

		var aOperations = [];

		var oDateRangeOperations = Object.assign({}, DateRangeType.Operations, DateRangeType.NewDynamicDateRangeOperations);

		for (var n in oDateRangeOperations) {
			var oOperation = oDateRangeOperations[n];
			if (this._filterOperation(oOperation)) {
				aOperations.push(oOperation);
			}
		}

		return aOperations;
	};

	DateRangeType.prototype.getSingleOperations = function() {
		var aOperations = [];
		for (var n in DateRangeType.SingleOperations) {
			var oOperation = DateRangeType.SingleOperations[n];
			if (this._filterOperation(oOperation)) {
				aOperations.push(oOperation);
			}
		}
		return aOperations;
	};

	DateRangeType.prototype.getDTOffsetOperations = function() {
		var aOperations = [];
		for (var n in DateRangeType.DTOffsetOperations) {
			var oOperation = DateRangeType.DTOffsetOperations[n];
			if (this._filterOperation(oOperation)) {
				aOperations.push(oOperation);
			}
		}
		return aOperations;
	};

	DateRangeType.prototype._updateOperation = function(oOperation) {
		Type.prototype._updateOperation.apply(this, [oOperation]);

		if (oOperation.languageText && !oOperation.basicLanguageText) {
			oOperation.basicLanguageText = oOperation.languageText;
			if (!oOperation.singulareBasicLanguageText && oOperation.singularTextKey) {
				oOperation.singulareBasicLanguageText = this.getTranslatedText(oOperation.singularTextKey);
			}

			if (!oOperation.zeroNumberLanguageText && oOperation.zeroNumberTextKey) {
				oOperation.zeroNumberLanguageText = this.getTranslatedText(oOperation.zeroNumberTextKey);
			}
			oOperation.languageText = this._fillNumberToText(oOperation.languageText);
		}

		if (oOperation.display) {
			var aDefaultValues = this.getDefaultValues(oOperation);
			var oDateFormatter = this._getDateFormatter(false);

			if (oOperation.display === "start" && aDefaultValues[0] !== null) {
				oOperation.textValue = oDateFormatter.format(aDefaultValues[0].oDate);
			} else if (oOperation.display === "range" && aDefaultValues && aDefaultValues[0] && aDefaultValues[1]) {
				// in some cases (when you toggle between variants which use async app operations) the aDefaultValues can be empty or the values null
				// BCP 002075129500003647642017
				oOperation.textValue = oDateFormatter.format(aDefaultValues[0].oDate) + " - " + oDateFormatter.format(aDefaultValues[1].oDate);
			}
		}

		oOperation.suggestText = oOperation.languageText;
	};

	DateRangeType.prototype.isValidCondition = function() {
		var oCondition = this.getCondition(),
			oOperation = this.getOperation(oCondition.operation);
		if (oOperation && oCondition && oCondition.key && oCondition.operation) {
			if ("value1" in oOperation && "value2" in oOperation) {
				return "value1" in oCondition && oCondition.value1 !== null && "value2" in oCondition && oCondition.value2 !== null;
			} else if ("value1" in oOperation) {
				return "value1" in oCondition && oCondition.value1 !== null;
			} else if ("value2" in oOperation) {
				return "value2" in oCondition && oCondition.value2 !== null;
			} else if (!("value1" in oOperation) && !("value2" in oOperation)) {
				return true;
			}
		}
		return false;
	};

	DateRangeType.prototype.hasSemanticDate = function(oJson) {
		var aOperations = this.getOperations();
		if (oJson.ranges[0].semantic && oJson.ranges[0].semantic.operation) {
			var i = 0;
			for (i = 0; i < aOperations.length; i++) {
				if (aOperations[i].key.indexOf(oJson.ranges[0].semantic.operation) !== -1) {
					return true;
				}
			}

			return false;
		}
	};

	DateRangeType.prototype.hasCustomSemanticDate = function(oJson) {
		return oJson.ranges[0] && oJson.ranges[0].semantic && oJson.ranges[0].semantic.operation && oJson.ranges[0].semantic.operation !== this.getDefaultOperation().key;
	};

	DateRangeType.prototype.providerDataUpdated = function(aUpdatedFieldNames, oData) {
	};

	DateRangeType.prototype.initialize = function(oJson) {
		if (!oJson) {
			oJson = {};
		}
		Type.prototype.initialize.apply(this, [oJson]);
		this.oModel.suspend();
		var oOrgJson = Object.assign({}, oJson, true),
		oSemanticValue1,
		oSemanticValue2;

		this.oLastJson = oOrgJson;

		var sCalendarType = (new UniversalDate()).getCalendarType();

		if (!oJson.conditionTypeInfo) {
			if (oJson.ranges && oJson.ranges.length == 1) {
				var sOperation;
				// if no conditionTypeInfo exist but one ranges item we restore the date range as DATERANGE operation. This is required for a better deserialize handling of DataSuite format.
				if (this.hasSemanticDate(oJson) && !this._bSingleFilterRestriction) {
					sOperation = oJson.ranges[0].semantic.operation;
					if (oJson.ranges[0].semantic.value1 || oJson.ranges[0].semantic.value1 == 0) {
						oSemanticValue1 = oJson.ranges[0].semantic.value1;
					}
					if (oJson.ranges[0].semantic.value2 || oJson.ranges[0].semantic.value2 == 0) {
						oSemanticValue2 = oJson.ranges[0].semantic.value2;
					}
					if (this.getDefaultOperation().key === sOperation) {
						var oDefaultOperation = this.getOperation(sOperation),
							aDefaultValues = oDefaultOperation && oDefaultOperation._getInitialValues ? oDefaultOperation._getInitialValues(oJson) : null;
						if (!aDefaultValues) {
							aDefaultValues = this.getDefaultValues(oDefaultOperation);
						}
						if ((aDefaultValues[0] && aDefaultValues[0].oDate && aDefaultValues[0].oDate.toISOString() !== oJson.ranges[0].value1) ||
							(aDefaultValues[1] && aDefaultValues[1].oDate && aDefaultValues[1].oDate.toISOString() !== oJson.ranges[0].value2)) {
							sOperation = "DATERANGE";
						}
					}
				} else if (this.hasSemanticDate(oJson) && this._bSingleFilterRestriction) {
					sOperation = oJson.ranges[0].semantic.operation;
					if (oJson.ranges[0].semantic.value1 || oJson.ranges[0].semantic.value1 == 0) {
						oSemanticValue1 = oJson.ranges[0].semantic.value1;
					}

					oJson.ranges[0].value2 = null;

					if (oJson.ranges[0].semantic.value2 || oJson.ranges[0].semantic.value2 == 0) {
						oSemanticValue2 = null;
					}
					if (this.getDefaultOperation().key === sOperation) {
						var oDefaultOperation = this.getOperation(sOperation),
							aDefaultValues = oDefaultOperation && oDefaultOperation._getInitialValues ? oDefaultOperation._getInitialValues(oJson) : null;
						if (!aDefaultValues) {
							aDefaultValues = this.getDefaultValues(oDefaultOperation);
						}
						if ((aDefaultValues[0] && aDefaultValues[0].oDate && aDefaultValues[0].oDate.toISOString() !== oJson.ranges[0].value1) ||
							(aDefaultValues[1] && aDefaultValues[1].oDate && aDefaultValues[1].oDate.toISOString() !== oJson.ranges[0].value2)) {
							sOperation = "DATE";
						}
						if (aDefaultValues[0] && aDefaultValues[0].oDate && aDefaultValues[0].oDate.toISOString() === oSemanticValue1) {
							oSemanticValue1 = oJson.ranges[0].value1 ? oJson.ranges[0].value1 : oJson.ranges[0].semantic.value1;
						}
					}
				} else if (this.hasCustomSemanticDate(oJson)) {
					this._customSemanticOperation = oJson.ranges[0].semantic.operation;
					if (this._bSingleFilterRestriction) {
						sOperation = "DATE";
					} else {
						sOperation = "DATERANGE";
					}
				} else if (this._bSingleFilterRestriction) {
					sOperation = "DATE";
				} else {
					sOperation = "DATERANGE";
				}
				if (oJson.ranges[0].operation === "GE") {
					//if the range operation is GE we map it on the FROM DateRangeType operation
					sOperation = "FROM";
				}
				if (oJson.ranges[0].operation === "LE") {
					//if the range operation is LE we map it on the TO DateRangeType operation
					sOperation = "TO";
				}
				oJson.conditionTypeInfo = {
					name: this.getName(),
					data: {
						key: this.sFieldName,
						operation: sOperation,
						value1: (oSemanticValue1 || oSemanticValue1 == 0) ? oSemanticValue1 : oJson.ranges[0].value1,
						value2: (oSemanticValue2 || oSemanticValue2 == 0) ? oSemanticValue2 : oJson.ranges[0].value2,
						calendarType: sCalendarType
					}
				};
			} else {
				var oDefaultOperation = this.getDefaultOperation(),
					sKey = oDefaultOperation ? oDefaultOperation.key : "";
				if (oJson.value1){
					var oValue1 = oJson.value1;
				}
				if (oJson.value2){
					var oValue2 = oJson.value2;
				}
				oJson.conditionTypeInfo = {
					name: this.getName(),
					data: {
						key: this.sFieldName,
						operation: sKey,
						calendarType: sCalendarType
					}
				};
				if (oValue1){
					oJson.conditionTypeInfo.data.value1 = oValue1;
				}
				if (oValue2){
					oJson.conditionTypeInfo.data.value2 = oValue2;
				} else if (oJson.conditionTypeInfo.data.operation === "DATERANGE") {
					oJson.conditionTypeInfo.data.operation = 'DATE';
				}
			}
		}
		if (oJson.conditionTypeInfo) {
			oJson = oJson.conditionTypeInfo;
		}
		if (oJson.name && oJson.data) {
			if (oJson.name !== this.getName()) {

				Log.debug("ConditionType " + this.getName() + " tries to deserialize data from " + oJson.name);
			}
			oJson = oJson.data;
		}
		if (!oJson.operation) {
			return;
		}


		// map not supported operations like NEXT2WEEKS to NEXTWEEKS with value1=2
		if (this.getOperation(oJson.operation) && this.getOperation(oJson.operation).order < 0) {
			var index = ["LAST2WEEKS", "LAST3WEEKS", "LAST4WEEKS", "LAST5WEEKS"].indexOf(oJson.operation);
			if (index >= 0) {
				oJson.operation = "LASTWEEKS";
				oJson.value1 = index + 2;
			}
			index = ["NEXT2WEEKS", "NEXT3WEEKS", "NEXT4WEEKS", "NEXT5WEEKS"].indexOf(oJson.operation);
			if (index >= 0) {
				oJson.operation = "NEXTWEEKS";
				oJson.value1 = index + 2;
			}
		}

		var oOperation = this.getOperation(oJson.operation);
		if (!oOperation) {
			// if no operation is found and the Type is async we wait for PendingChange
			if (this.getAsync()) {

				this.setPending(true);

				var that = this,
					fnHandler = function(oEvent) {
						if (oEvent.getParameter("pending") === false) {
							that.oFilterProvider.detachPendingChange(fnHandler);
							that.initialize(that.oLastJson);
						}
					};
				this.oFilterProvider.attachPendingChange(fnHandler);

				this.oModel.resume();
				return;
			}
			//TODO if not async we could use the DefaultOperation????
		}

		var aValues;
		// handle transform from calendar type differences
		if (sCalendarType !== oJson.calendarType && (oJson.calendarType === "Islamic" || sCalendarType === "Islamic") && oJson.operation === "SPECIFICMONTH") {
			oJson.operation = "DATERANGE";
			var iValue = parseInt(oJson.value1),
				oDate = UniversalDate.getInstance(UI5Date.getInstance(), oJson.calendarType);
			oDate.setMonth(iValue);
			oDate = UniversalDateUtils.getMonthStartDate(oDate);
			aValues = UniversalDateUtils.getRange(0, "MONTH", oDate);
			oJson.value1 = aValues[0].oDate.toISOString();
			oJson.value2 = aValues[1].oDate.toISOString();
		}

		var oProperty = this.getConditionContext().getObject();

		oProperty.operation = oJson.operation;
		oProperty.key = oJson.key;
		oProperty.value1 = null;
		oProperty.value2 = null;

		var oTempODataType,
			oODataType = this.oFieldMetadata && this.oFieldMetadata.ui5Type;

		if (oODataType && oODataType.isA(StringType.getMetadata().getName())) {
			// If Edm.String is used without IsCalendarDate annotation a wrong UI5 type is created
			// and date parsing is not possible. That's why we create a temporary StringDate type
			// to parse the value.
			// This is done for backwards compatibility for old applications with such a wrong configuration
			oTempODataType = this.oFilterProvider._getType(
				Object.assign({}, this.oFieldMetadata, {
					isCalendarDate: true,
					ui5Type: null
				})
			);
			oODataType = oTempODataType;
		}

		if (oJson.operation === "DATERANGE") {
			if (typeof oJson.value1 === "string") {
				if (this.oFieldMetadata && this.oFieldMetadata.type === "Edm.String") {
					oJson.value1 = oODataType.formatValue(oJson.value1);
				} else {
					oJson.value1 = oJson.value1 === "" ? null : (new UniversalDate(oJson.value1)).oDate;
				}
			}
			if (typeof oJson.value2 === "string") {
				if (this.oFieldMetadata && this.oFieldMetadata.type === "Edm.String") {
					oJson.value2 = oODataType.formatValue(oJson.value2);
				} else {
					oJson.value2 = oJson.value2 === "" ? null : (new UniversalDate(oJson.value2)).oDate;
				}
			}
			oProperty.value1 = oJson.value1;
			oProperty.value2 = oJson.value2;
		} else if (["DATE", "FROM", "TO"].indexOf(oJson.operation) !== -1) {
			if (typeof oJson.value1 === "string") {
				if (this.oFieldMetadata && this.oFieldMetadata.type === "Edm.String") {
					oJson.value1 = oODataType.formatValue(oJson.value1);
				} else {
					oJson.value1 = oJson.value1 === "" ? null : (new UniversalDate(oJson.value1)).oDate;
				}
			}
			oProperty.value1 = oJson.value1;
		} else if (["DATETIME", "DATETIMERANGE"].indexOf(oJson.operation) !== -1) {
			if (typeof oJson.value1 === "string") {
				oJson.value1 = oJson.value1 === "" ? null : (new UniversalDate(oJson.value1)).oDate;
			}
			oProperty.value1 = oJson.value1;

			if (typeof oJson.value2 === "string") {
				oJson.value2 = oJson.value2 === "" ? null : (new UniversalDate(oJson.value2)).oDate;
			}
			oProperty.value2 = oJson.value2;
		} else if ([
				"LASTMINUTES", "LASTHOURS", "LASTDAYS", "LASTWEEKS", "LASTMONTHS", "LASTQUARTERS", "LASTYEARS", "NEXTMINUTES", "NEXTHOURS", "NEXTDAYS", "NEXTWEEKS", "NEXTMONTHS", "NEXTQUARTERS", "NEXTYEARS"
			].indexOf(oJson.operation) > -1) {
			oProperty.value1 = oJson.value1;
		} else if (oJson.operation === "SPECIFICMONTH") {
			oProperty.value1 = oJson.value1 + "";
		} else if (oJson.operation === "TODAYFROMTO") {
			oProperty.value1 = oJson.value1;
			oProperty.value2 = oJson.value2;
		} else {
			oOperation = this.getOperation(oJson.operation);
			aValues = oOperation && oOperation._getInitialValues ? oOperation._getInitialValues(oJson) : null;
			if (!aValues) {
				aValues = this._getValuesFromCurrentOperation(oJson);
			}
			if (!aValues) {
				aValues = this.getDefaultValues(oOperation);
			}
			oProperty.value1 = aValues[0];
			oProperty.value2 = aValues[1];
		}

		// ignore some model change events, so that we not overwrite the values by some defaultValues
		this.bIgnoreBindingChange = true;
		this.oModel.resume();
		delete this.bIgnoreBindingChange;

		this.serialize(true, false);

		this._setDDROperation.call(this, oJson);

		if (oTempODataType) {
			oTempODataType.destroy();
		}
	};

	DateRangeType.prototype._getValuesFromCurrentOperation = function (oCondition) {
		var aResult = [];
		if (Number.isInteger(oCondition.value1)) {
			aResult.push(oCondition.value1);
		}

		if (Number.isInteger(oCondition.value2)) {
			aResult.push(oCondition.value2);
		}

		if (aResult.length > 0) {
			return aResult;
		}

		return null;
	};

	DateRangeType.prototype.serialize = function(bUpdateProviderSyncron, bFireFilterChange) {
		var oJson = {},
			oCondition = this.getCondition();
		if (!oCondition.operation) {
			return null;
		}
		var oOperation = this.getOperation(oCondition.operation);
		if (!oOperation || !("value1" in oOperation)) {
			oCondition.value1 = null;
		}
		if (!oOperation || !("value2" in oOperation)) {
			oCondition.value2 = null;
		}
		oCondition.calendarType = (new UniversalDate()).getCalendarType();
		oJson.conditionTypeInfo = {
			name: this.getName(),
			data: oCondition
		};

		if (this.iChangeTimer) {
			clearTimeout(this.iChangeTimer);
			delete this.iChangeTimer;
		}

		if (bUpdateProviderSyncron) {
			this._updateProvider(oJson, true, bFireFilterChange);
		} else {
			this.iChangeTimer = setTimeout(this._updateProvider.bind(this, oJson, false, bFireFilterChange), 0);
		}

		return oJson;
	};

	DateRangeType.prototype.updateFilters = function() {
		if (!this._bDTOffset || !this.oConditionContext?.oModel?.oData?.condition?.value1){
			return;
		}

		var oJson = {},
			oCondition = this.getCondition();
		if (!oCondition.operation) {
			return;
		}
		var oOperation = this.getOperation(oCondition.operation);
		if (!oOperation || !("value1" in oOperation)) {
			oCondition.value1 = null;
		}
		if (!oOperation || !("value2" in oOperation)) {
			oCondition.value2 = null;
		}
		oCondition.calendarType = (new UniversalDate()).getCalendarType();
		oJson.conditionTypeInfo = {
			name: this.getName(),
			data: oCondition
		};
		oJson.ranges = this.getFilterRanges();
		oJson.items = [];
		this.oFilterProvider?.oModel?.setProperty("/" + this.sFieldName, oJson);
	};

	DateRangeType.prototype._updateProvider = function(oJson, bSync, bFireFilterChange) {
		oJson.ranges = this.getFilterRanges();
		oJson.items = [];
		var bSetCursor = false;
		var iCursorPos = 0;
		var iSelectionStart = 0;
		var iSelectionEnd = 0;

		//  update the formattedText which we display in the input field
		var oData = this.oModel.getData(),
			oCurrentOperation = oData.currentoperation;

		if (oJson && oCurrentOperation) {
			this._clearModelInputState(oJson, oCurrentOperation);
		}

		if (this.oFieldMetadata && this.oFieldMetadata.type === "Edm.String" && oJson.ranges[0]) {
			var oTempODataType,
				oODataType = this.oFieldMetadata.ui5Type;

			if (oODataType.isA(StringType.getMetadata().getName())) {
				// If Edm.String is used without IsCalendarDate annotation a wrong UI5 type is created
				// and date parsing is not possible. That's why we create a temporary StringDate type
				// to parse the value.
				// This is done for backwards compatibility for old applications with such a wrong configuration
				oTempODataType = this.oFilterProvider._getType(
					Object.assign({}, this.oFieldMetadata, {
						isCalendarDate: true,
						ui5Type: null
					})
				);
				oODataType = oTempODataType;
			}

			if (!oCurrentOperation.type || !oCurrentOperation.type.includes("int")) {
				oJson.conditionTypeInfo.data.value1 = oODataType.parseValue(oJson.conditionTypeInfo.data.value1);
				oJson.conditionTypeInfo.data.value2 = oODataType.parseValue(oJson.conditionTypeInfo.data.value2);
			}

			oJson.ranges[0].value1 = oODataType.parseValue(oJson.ranges[0].value1);

			if (oJson.ranges[0].value2) {
				oJson.ranges[0].value2 = oODataType.parseValue(oJson.ranges[0].value2);
			}

			if (oTempODataType) {
				oTempODataType.destroy();
			}
		}

		if (oCurrentOperation && oCurrentOperation.languageText) {
			var sFormattedText = oCurrentOperation.languageText;

			// Almost the same code as _customDDOptionFormatter. If something is changed here check _customDDOptionFormatter as well
			if (this._isIntIntInterval(oCurrentOperation)) {
				if (oJson.conditionTypeInfo.data.value1 != null && oJson.conditionTypeInfo.data.value1 !== ""
					&& oJson.conditionTypeInfo.data.value2 != null && oJson.conditionTypeInfo.data.value2 !== "") {
					sFormattedText = this._formatIntIntInterval(oCurrentOperation, oJson);
				}
			} else if (this._isIntInterval(oCurrentOperation)) {
				if (oJson.conditionTypeInfo.data.value1 !== null && oJson.conditionTypeInfo.data.value1 !== "") {
					sFormattedText = this._formatIntInterval(oCurrentOperation, oJson);
				} else if (this._bSuggestItemSelected) {
					sFormattedText = this._fillNumberToText(oCurrentOperation.basicLanguageText);
					var xPos = oCurrentOperation.basicLanguageText.indexOf("{0}");
					iCursorPos = xPos + 1;
					iSelectionStart = xPos;
					iSelectionEnd = xPos + 1;
					bSetCursor = true;
				} else {
					sFormattedText = "";
				}
			} else if (this._isFixedRange(oCurrentOperation)) {
				sFormattedText = this._formatFixedRange(oCurrentOperation, oCurrentOperation.textValue);
			} else {
				if (oJson.conditionTypeInfo.data.value1 !== null && oJson.conditionTypeInfo.data.value1 !== "") {
					var oRes = this._calculateDateRangeValueText(oCurrentOperation, oJson);
					var sValue = oRes.value;
					bSetCursor = oRes.bSetCursor;

					if (sValue) {
						sFormattedText = this._formatFixedRange(oCurrentOperation, sValue);
						iCursorPos = sFormattedText.length - 1;
					} else {
						sFormattedText = "";
					}
				} else {
					// not a valid condition
					sFormattedText = "";
				}
			}
			this._bSuggestItemSelected = false;
			this.oModel.setProperty("/formattedText", sFormattedText);

			if (bSetCursor && this._oInput) {
				// set cursor to placeholder
				this._oInput.$("inner").cursorPos(iCursorPos);
				if (iSelectionStart < iSelectionEnd) {
					this._oInput.selectText(iSelectionStart, iSelectionEnd);
				}
				this._oInput._lastValue = ""; // to recheck by focusout again as it might be an invalid value
			}
		}

		if (this.oFilterProvider) {
			this.oFilterProvider.oModel.setProperty("/" + this.sFieldName, oJson);
			this.oFilterProvider.setFilterData({}, false, this.sFieldName, true);

			if (bFireFilterChange && this.oFilterProvider._oSmartFilter) {
				//call the fireFilterChange syncron
				this.oFilterProvider._oSmartFilter.fireFilterChange();
			}
		}
	};

	DateRangeType.prototype.getFilterRanges = function() {
		var oSecondDate,
			oCondition = this.getCondition(),
			aValues = [],
			oRange;
		if (this._bSingleFilterRestriction){
			oCondition.operation = "EQ";
			delete oCondition.value2;
		} else if (oCondition.operation === "LASTMINUTES") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastMinutes(oCondition.value1);
			}
			aValues[0]?.setMilliseconds(0);
			aValues[0]?.setSeconds(0);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTMINUTESINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastMinutes(oCondition.value1 - 1);
			}

			aValues[0]?.setMilliseconds(0);
			aValues[0]?.setSeconds(0);
			aValues[1]?.setSeconds(59);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTHOURS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastHours(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTHOURSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastHours(oCondition.value1 - 1);
			}
			aValues[0]?.setMinutes(0);
			aValues[0]?.setMilliseconds(0);
			aValues[0]?.setSeconds(0);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTDAYS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastDays(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTDAYSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastDays(oCondition.value1 - 1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
		} else if (oCondition.operation === "LASTWEEKS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastWeeks(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTWEEKSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastWeeks(oCondition.value1 - 1, this.sCalendarWeekNumbering);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
		} else if (oCondition.operation === "LASTMONTHS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastMonths(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTMONTHSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastMonths(oCondition.value1 - 1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
		} else if (oCondition.operation === "LASTQUARTERS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastQuarters(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTQUARTERSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastQuarters(oCondition.value1 - 1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
		} else if (oCondition.operation === "LASTYEARS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastYears(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTYEARSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.lastYears(oCondition.value1 - 1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
		} else if (oCondition.operation === "NEXTMINUTES") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextMinutes(oCondition.value1);
			}

			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTMINUTESINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextMinutes(oCondition.value1 - 1);
			}

			aValues[0]?.setMilliseconds(0);
			aValues[0]?.setSeconds(0);
			aValues[1]?.setSeconds(59);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTHOURS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextHours(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTHOURSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextHours(oCondition.value1 - 1);
			}
			aValues[1]?.setMinutes(59, 59);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTDAYS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextDays(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTDAYSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextDays(oCondition.value1 - 1);
			}
			oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTWEEKS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextWeeks(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTWEEKSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextWeeks(oCondition.value1 - 1, this.sCalendarWeekNumbering);
			}
			oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
			oCondition.value2 = aValues[1];
		}  else if (oCondition.operation === "NEXTMONTHS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextMonths(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTMONTHSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextMonths(oCondition.value1 - 1);
			}
			oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTQUARTERS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextQuarters(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTQUARTERSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextQuarters(oCondition.value1 - 1);
			}
			oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTYEARS") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextYears(oCondition.value1);
			}
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTYEARSINCLUDED") {
			if (!isNaN(oCondition.value1)) {
				aValues = UniversalDateUtils.ranges.nextYears(oCondition.value1 - 1);
			}
			oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "SPECIFICMONTH") {
			var iValue = parseInt(oCondition.value1),
				oDate = new UniversalDate();

			if (Number.isFinite(iValue)) {
				oDate.setDate(1);
				oDate.setMonth(iValue);
				oDate = UniversalDateUtils.getMonthStartDate(oDate);
				aValues =  UniversalDateUtils.getRange(0, "MONTH", oDate);
				oCondition.value1 = aValues[0];
				oCondition.value2 = aValues[1];
			}
		} else if (oCondition.operation === "TODAYFROMTO") {
			if (!isNaN(parseInt(oCondition.value1))) {
				oCondition.value1 = this._getTodayFromToValueFrom(oCondition.value1);
			}
			if (!isNaN(parseInt(oCondition.value2))) {
				oCondition.value2 = this._getTodayFromToValueTo(oCondition.value2);
			}
		} else {
			// Dynamic Int Operation handling
			var oOperation = this.getOperation(oCondition.operation);
			if (oOperation && oOperation.getDateRange) {
				oRange = oOperation.getDateRange(oCondition);
				if (!oRange) {
					return [];
				}
				oCondition.value1 = oRange && oRange.value1 ? oRange.value1 : null;
				oCondition.value2 = oRange && oRange.value2 ? oRange.value2 : null;
			}
		}

		if (oCondition.value1 instanceof UniversalDate) {
			oCondition.value1 = oCondition.value1.oDate;
		}
		if (oCondition.value2 instanceof UniversalDate) {
			oCondition.value2 = oCondition.value2.oDate;
		}
		if (oCondition.operation === "DATE") {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
			oCondition.operation = "BT";
			oCondition.value2 = oCondition.value1;
			// ensure the day and set time to beginning of day
			oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;
			// include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
			oCondition.value2 = DateRangeType.setEndTime(oCondition.value2, this._bIgnoreTime, this._Precision).oDate;
		} else if (oCondition.operation === "FROM") {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
			oCondition.operation = "GE";
			delete oCondition.value2;
			oCondition.value1 = DateRangeType.setStartTime(oCondition.value1, this._bIgnoreTime).oDate;
		} else if (oCondition.operation === "TO") {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
			oCondition.operation = "LE";
			delete oCondition.value2;

			// include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
			oCondition.value1 = DateRangeType.setEndTime(oCondition.value1, this._bIgnoreTime).oDate;
		} else if (this._bSingleFilterRestriction) {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
		} else if (oCondition.operation === "DATETIME") {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
			oCondition.operation = "BT";

			// include [:999] (milliseconds depending on given precision)
			oCondition.value2 = oCondition.value2 ? DateRangeType.setMilliseconds(oCondition.value2) : null;
		} else if (oCondition.operation === "DATETIMERANGE" ||
					oCondition.operation === "LASTMINUTES" ||
					oCondition.operation === "LASTHOURS" ||
					oCondition.operation === "NEXTHOURS" ||
					oCondition.operation === "NEXTMINUTES" ||
					oCondition.operation === "LASTMINUTESINCLUDED" ||
					oCondition.operation === "LASTHOURSINCLUDED" ||
					oCondition.operation === "NEXTMINUTESINCLUDED" ||
					oCondition.operation === "NEXTHOURSINCLUDED") {
			if (!(this.isValidCondition() && oCondition.value1 && oCondition.value2)) {
				return [];
			}
			oCondition.operation = "BT";
		} else {
			if (oRange) {
				oCondition.operation = oRange.operation;

				// ensure the day and set time to beginning of day
				oCondition.value1 = oCondition.value1 ? DateRangeType.setStartTime(oCondition.value1).oDate : null;

				// include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
				oCondition.value2 = oCondition.value2 ? DateRangeType.setEndTime(oCondition.value2, this._bIgnoreTime).oDate : null;
			} else {
				if (!(this.isValidCondition() && oCondition.value1 && oCondition.value2)) {
					return [];
				}
				// ensure the day and set time to beginning of day in the case new the option is not NEXT<X>INCLUDED
				if (!this._bDTOffset || (this._bDTOffset && oCondition.operation.indexOf("INCLUDED") === -1  && oCondition.operation.indexOf("NEXT") === -1)) {
					oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;
				}

				oCondition.operation = "BT";

				// include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
				oCondition.value2 = DateRangeType.setEndTime(oCondition.value2, this._bIgnoreTime).oDate;
			}
		}

		oCondition.exclude = false;
		oCondition.keyField = oCondition.key;
		delete oCondition.key;

		if (oCondition.value2) {
			if (typeof oCondition.value1.getTime === "function" &&
				typeof oCondition.value2.getTime === "function" &&
				oCondition.value1.getTime() > oCondition.value2.getTime()) {
				oSecondDate =  oCondition.value2;
				oCondition.value2 = oCondition.value1;
				oCondition.value1 = oSecondDate;
			}
		}

		return [
			oCondition
		];
	};

	DateRangeType.prototype.getTokenText = function() {
		return "";
	};

	DateRangeType.prototype.getName = function() {
		return this.getMetadata().getName();
	};

	DateRangeType.prototype.getType = function() {
		return "Edm.Date";
	};

	DateRangeType.prototype._bindValueState = function(oControl) {
		oControl.bindProperty("valueState", {
			path: "$smartEntityFilter>inputstate",
			formatter: function() {
				if (this.getBinding("valueState").getValue() === "ERROR") {
					return ValueState.Error;
				} else {
					return ValueState.None;
				}
			}
		});
	};

	DateRangeType.prototype.initializeFilterItem = function () {
		return this._initializeFilterItemNew.apply(this, arguments);
	};

	DateRangeType.prototype._getDateFormatter = function(bStrict) {
		var oFormatSettings = {
			style: this.oDateFormat.style,
			pattern: this.oDateFormat.pattern,
			strictParsing: bStrict
		};

		if (JSON.stringify(oFormatSettings) !== this._sFormatSettings) {
			this._sFormatSettings = JSON.stringify(oFormatSettings);
			this._oDateFormatter = DateFormat.getInstance(oFormatSettings);
		}
		return this._oDateFormatter;
	};

	DateRangeType.prototype._fillNumberToText = function(sText, iNumberFrom, iNumberTo) {
		var sNumberFrom = "X",
			sNumberTo = "Y";

		if (iNumberFrom || iNumberFrom === 0) {
			sNumberFrom = String(iNumberFrom);
		}

		if (iNumberTo || iNumberTo === 0) {
			sNumberTo = String(iNumberTo);

			if (iNumberFrom < 0){
				sNumberFrom = "(" + sNumberFrom + ")";
			}

			if (iNumberTo < 0){
				sNumberTo = "(" + sNumberTo + ")";
			}

		}
		sText = sText.replace("{0}", sNumberFrom);
		sText = sText.replace("{1}", sNumberTo);
		return sText;
	};

	DateRangeType.prototype._setIntControlBinding = function (oControl, oOperation, sValuePath) {
		oControl.setFieldWidth("auto");
		oControl.bindProperty("description", {
			path: "$smartEntityFilter>" + sValuePath,
			type: new IntegerType(),
			formatter: function() {
				var sTextKey = oOperation.descriptionTextKeys[0];
				var sTextMulti = oOperation.descriptionTextKeys[1];
				if (this.getBinding("description").getValue() === 1) {
					return Type.getTranslatedText(sTextKey);
				} else {
					return Type.getTranslatedText(sTextMulti || sTextKey);
				}
			}
		});
	};

	DateRangeType.prototype._createIntFromToControl = function (oInstance, sSuffix, sValuePath) {
		return new Input(Type._createStableId(oInstance, sSuffix), {
			value: {
				path: "$smartEntityFilter>" + sValuePath,
				type: new NullableInteger({}, { minimum: -oInstance._maxIntValue, maximum: oInstance._maxIntValue })
			},
			textAlign: "End",
			width: "100%"
		});
	};

	DateRangeType.prototype._isValidFromToPeriod = function (iValueFrom, iValueTo) {
		if ((!iValueFrom && iValueFrom !== 0) || isNaN(iValueFrom)) {
			return false;
		}

		if ((!iValueTo && iValueTo !== 0) || isNaN(iValueTo)) {
			return false;
		}

		if (iValueFrom < -this._maxIntValue ||
			iValueFrom > this._maxIntValue) {
			return false;
		}

		if (iValueTo < -this._maxIntValue ||
			iValueTo > this._maxIntValue) {
			return false;
		}

		if ((iValueFrom < 0 &&  Math.abs(iValueFrom) >  Math.abs(iValueTo)) ||
			(iValueFrom === 0 &&  iValueTo < 0) ||
			(iValueTo < 0 &&  Math.abs(iValueTo) > Math.abs(iValueFrom)) ||
			(iValueTo === 0 &&  iValueFrom < 0) ||
			(iValueFrom < 0 &&  iValueTo < 0)) {
			return false;
		}

		return true;
	};

	DateRangeType.prototype._getTodayFromToValueFrom = function (iValueFrom) {
		if (iValueFrom < 0) {
			var oValueFrom = UniversalDateUtils.getRange((-1 * iValueFrom), "DAY")[1];
			oValueFrom.setHours(0,0,0);

			return oValueFrom;
		}

		return UniversalDateUtils.getRange(-iValueFrom, "DAY")[0];
	};

	DateRangeType.prototype._getTodayFromToValueTo = function (iValueTo) {
		if (iValueTo < 0){
			var oValueTo = UniversalDateUtils.getRange(iValueTo, "DAY")[0];
			oValueTo.setHours(23,59,59);
			return oValueTo;
		}
		return UniversalDateUtils.getRange(iValueTo, "DAY")[1];
	};

	DateRangeType.prototype._getInputValueState = function () {
		if (this._oInput) {
			return this._oInput.getValueState();
		}
	};

	DateRangeType.prototype.destroy = function() {
		if (this.iChangeTimer) {
			clearTimeout(this.iChangeTimer);
			delete this.iChangeTimer;
		}
		Type.prototype.destroy.apply(this, arguments);
	};

	// Start: Methods to be changed if new or old implementation is used
	DateRangeType.prototype._initializeFilterItemNew = function(sContext) {
		var oFormatOptions = {
			style: this.oDateFormat.style,
			pattern: this.oDateFormat.pattern,
			strictParsing: false
		};

		this.sCalendarWeekNumbering = this.oFilterProvider && this.oFilterProvider._oCalendarWeekSettings
			? this.oFilterProvider._oCalendarWeekSettings : undefined;
		this._oInput = new DynamicDateRange(Type._createStableId(this), {
			name: this.sFieldName,
			formatter: DynamicDateFormat.getInstance({ date: oFormatOptions }),
			enableGroupHeaders: !this._bSingleFilterRestriction,
			calendarWeekNumbering: this.sCalendarWeekNumbering,
			standardOptions: {
				path: "$smartEntityFilter>/operations",
				formatter: function (aOperations) {
					return aOperations.reduce(function(aResult, oOperation) {
						if (StandardDynamicDateRangeKeys.includes(oOperation.key)) {
							aResult.push(oOperation.key);
						}

						return aResult;
					}, []);
				}
			},
			change: this._onDDRChange.bind(this)
		});

		if (this.oFieldMetadata && this.oFieldMetadata["com.sap.vocabularies.Common.v1.DocumentationRef"]) {
			this.oFilterProvider._setControlDocumentationRef(this._oInput, this.oFieldMetadata["com.sap.vocabularies.Common.v1.DocumentationRef"]);
		}

		this._createCustomDDOptions(this.getOperations());

		if (sContext !== "mdcFilterPanel") {
			this._oInput.setValue(this._getDefaultValueDDR());
		}

		this._bindValueState(this._oInput);
		this._oInput.setBindingContext(this.getContext(), "$smartEntityFilter");
		this._oInput.setModel(this.getModel(), "$smartEntityFilter");
		this.bFireFilterChange = false;
		this.getModel().checkUpdate(true);
		this.bFireFilterChange = true;

		return this._oInput;
	};

	DateRangeType.prototype.updateOperations = function() {
		var aOperations = this.getOperations();
		for (var i = 0; i < aOperations.length; i++) {
			this._updateOperation(aOperations[i]);
		}

		this._createCustomDDOptions(aOperations);

		this.oModel.setProperty("operations", aOperations, this.getContext(), true);

		if (this._customSemanticOperation) {
			var oOperation = aOperations.find(function(oOperation){
				return oOperation.key === this._customSemanticOperation;
			}.bind(this));

			if (oOperation) {
				this.setOperation(this._customSemanticOperation);
				this._customSemanticOperation = null;
			}
		}

		return;
	};

	DateRangeType.prototype.setCondition = function(oCondition) {
		Type.prototype.setCondition.apply(this, arguments);
		this._setDDROperation.call(this, oCondition);

		return this;
	};
	// End: Methods to be changed if new or old implementation is used

	DateRangeType.prototype._onDDRChange = function (oEvent) {
		var oOperation,
			vValues,
			oValue = oEvent.getParameter("value"),
			bValid = oEvent.getParameter("valid");

		if (bValid && oValue) {
			var sOperationName = this._getOptionName(oValue.operator);
			oOperation = this.getOperation(sOperationName);

			vValues = this._prepareDDRValues(oOperation, oValue, sOperationName);

			this.oModel.setProperty("/currentoperation", oOperation);
			this.oModel.setProperty("/condition/operation", sOperationName);
			this.oModel.setProperty("/condition/value1", vValues[0]);
			this.oModel.setProperty("/condition/value2", vValues[1]);
		} else if (bValid) {
			oOperation = this.getOperation("DATERANGE");
			this.oModel.setProperty("/currentoperation", oOperation);
			this.oModel.setProperty("/condition/operation", "DATERANGE");
			this.oModel.setProperty("/condition/value1", null);
			this.oModel.setProperty("/condition/value2", null);
		}
		oEvent.getSource().setValueStateText('');
		this.oModel.setProperty("inputstate", bValid ? "NONE" : "ERROR", this.getContext());
	};

	DateRangeType.prototype._getDefaultValueDDR = function () {
		var oDefaultOperation = this.getDefaultOperation(),
			sOperationKey = oDefaultOperation && oDefaultOperation.key;

		if (!this._getDDROption(sOperationKey)) {
			return null;
		}

		var vValues = typeof oDefaultOperation.defaultValues === "function"
			? oDefaultOperation.defaultValues() : oDefaultOperation.defaultValues;

		if (!StandardDynamicDateRangeKeys.includes(sOperationKey)) {
			sOperationKey = this._getCustomDDOptionName(sOperationKey);
		}

		if (Array.isArray(vValues) && vValues.length > 0 && vValues[0] !== null) {
			return {
				operator: sOperationKey,
				values: vValues
			};
		}

		return null;
	};

	DateRangeType.prototype._getDDROption = function (sName) {
		if (!this._oInput) {
			return null;
		}

		if (StandardDynamicDateRangeKeys.includes(sName)) {
			return this._oInput.getOption(sName);
		}

		return this._oInput.getOption(this._getCustomDDOptionName(sName));
	};

	DateRangeType.prototype._getCustomDDOptionName = function (sName) {
		return this.sFieldName + "__custom__" + sName;
	};

	DateRangeType.prototype._getOptionName = function (sName) {
		var aResult = sName.split("__custom__");

		if (aResult.length > 1) {
			return aResult[1];
		}

		return aResult[0];
	};

	DateRangeType.prototype._createCustomDDOptions = function (aOperations) {
		if (!this._oInput) {
			return;
		}

		var oValue = this._oInput.getValue();

		this._oInput.destroyAggregation("customOptions");
		aOperations.forEach(this._createCustomDDOption, this);

		if (oValue && !this._getDDROption(this._getOptionName(oValue.operator))) {
			this._oInput.setValue(null);
			this._oInput._oInput.setValue(null);
			this.oModel.setProperty("/currentoperation", null);
			this.oModel.setProperty("/condition/value1", null);
			this.oModel.setProperty("/condition/value2", null);
		}
	};

	DateRangeType.prototype._createCustomDDOption = function (oCustomOperation) {
		if (StandardDynamicDateRangeKeys.includes(oCustomOperation.key)) {
			return;
		}

		var oCustomDynamicDateOption;

		var sCategoty = typeof oCustomOperation.category === "object" ? oCustomOperation.category.key : oCustomOperation.category;
		if (sCategoty.toLowerCase().startsWith("fixed") || oCustomOperation.type === "range") {
			oCustomDynamicDateOption = this._createCustomFixedDDOption(oCustomOperation);
		} else {
			oCustomDynamicDateOption = this._createCustomDynamicDDOption(oCustomOperation);
		}

		oCustomDynamicDateOption.getGroupHeader = function () {
			if (typeof oCustomOperation.category === "object") {
				var sResourceBundle = oCustomOperation.category.bundle;
				var sTextKey = oCustomOperation.category.key;

				if (Library.getResourceBundleFor(sResourceBundle).hasText(sTextKey)) {
					return Library.getResourceBundleFor(sResourceBundle).getText(sTextKey);
				}
			}

			if (Library.getResourceBundleFor("sap.ui.comp").hasText(oCustomOperation.category)) {
				return Library.getResourceBundleFor("sap.ui.comp").getText(oCustomOperation.category);
			}

			if (Library.getResourceBundleFor("sap.m").hasText(oCustomOperation.category)) {
				return Library.getResourceBundleFor("sap.m").getText(oCustomOperation.category);
			}

			return Library.getResourceBundleFor("sap.m").getText("DDR_OPTIONS_GROUP_0");
		};

		oCustomDynamicDateOption.getGroup = function () {
			return oCustomOperation.order;
		};

		this._oInput.addAggregation("customOptions", oCustomDynamicDateOption);
	};

	DateRangeType.prototype._createCustomFixedDDOption = function (oCustomOperation) {
		var sOptionId = this._getCustomDDOptionName(oCustomOperation.key);
		var that = this;
		var CustomDynamicDateOptionClass = DynamicDateOption.extend(sOptionId, {
			metadata: {
				library: "sap.ui.comp"
			},
			getText: function () {
				return oCustomOperation.languageText || Type.getTranslatedText(oCustomOperation.textKey);
			},
			getValueHelpUITypes: function () {
				return [];
			},
			enhanceFormattedValue: function () {
				if (!that.getOperation(that._getOptionName(oCustomOperation.key))){
					return false;
				}
				var sCategoty = typeof oCustomOperation.category === "object" ? oCustomOperation.category.key : oCustomOperation.category;
				if (sCategoty.toUpperCase().startsWith('FIXED.') && oCustomOperation.type === "int"){
					return false;
				}
				return true;
			},
			format: this._customDDOptionFormatter.bind(this),
			toDates: function (oValue) {
				var aDefaultValues = oCustomOperation.defaultValues;
				if (typeof aDefaultValues === "function") {
					aDefaultValues = aDefaultValues();
				}

				if (oValue && aDefaultValues.length > 0 && !(aDefaultValues[0] instanceof Date)) {
					var oCondition = that.oModel.getProperty("", that.oConditionContext),
						sOldOperationName = oCondition.operation,
						vOldValue1 = aDefaultValues[0],
						vOldValue2 = aDefaultValues[1];

					// Change operation to the current value
					oCondition.operation = that._getOptionName(oValue.operator);
					oCondition.value1 = !isNaN(aDefaultValues[0]) ? parseInt(aDefaultValues[0]) : aDefaultValues[0];
					oCondition.value2 = !isNaN(aDefaultValues[1]) ? parseInt(aDefaultValues[1]) : aDefaultValues[1];

					var aResult = that.getFilterRanges();

					// Restore to the selected operation
					oCondition.operation = sOldOperationName;
					oCondition.value1 = vOldValue1;
					oCondition.value2 = vOldValue2;

					if (aResult.length === 0) {
						return [];
					}

					return [aResult[0].value1];
				}

				return aDefaultValues;
			},
			parse: function(sValue) {
				var sText = oCustomOperation.basicLanguageText || oCustomOperation.languageText || Type.getTranslatedText(oCustomOperation.textKey);
				if (sValue && sText && sText.toLowerCase().startsWith(sValue.toLowerCase())) {
					return {
						operator: this.getKey(),
						values: this.toDates()
					};
				}

				return null;
			}
		});

		return new CustomDynamicDateOptionClass({
			key: sOptionId
		});
	};

	DateRangeType.prototype._createCustomDynamicDDOption = function (oCustomOperation) {
		var sOptionId = this._getCustomDDOptionName(oCustomOperation.key);
		var that = this;
		var CustomDynamicDateOptionClass = DynamicDateOption.extend(sOptionId, {
			metadata: {
				library: "sap.ui.comp"
			},
			getText: function () {
				var sText = (oCustomOperation.languageText || Type.getTranslatedText(oCustomOperation.textKey));
				if (sText.indexOf("{0}") >= 0) {
					return that._fillNumberToText(sText);
				}
				return sText;
			},
			getValueHelpUITypes: function () {
				if (oCustomOperation.type === "int") {
					return [new DynamicDateValueHelpUIType({ type: "int" })];
				} else if (oCustomOperation.type === "[int,int]") {
					return [new DynamicDateValueHelpUIType({ type: "int" }), new DynamicDateValueHelpUIType({ type: "int" })];
				}
			},
			createValueHelpUI: function(oDynamicDateRange, fnControlsUpdated) {
				oDynamicDateRange.aControlsByParameters = {};
				oDynamicDateRange.aControlsByParameters[this.getKey()] = [];

				that.setControls([]);

				var aControls = that.getControls(oCustomOperation),
					aDefaultValuesLength = oCustomOperation.defaultValues.length,
					aDefaultValues = oCustomOperation.defaultValues;

				if (typeof aDefaultValues === "function") {
					aDefaultValues = aDefaultValues();
				}

				aControls.forEach(function (oControl) {
					if (!oControl.getValue() && aDefaultValues && aDefaultValues[0]) {
						if (typeof aDefaultValues === "function") {
							aDefaultValues = aDefaultValues();
						}
						oControl.setValue(aDefaultValues[0]);
						aDefaultValues.shift();
						that.oModel.setProperty("/condition/value" + (aDefaultValuesLength - aDefaultValues.length) , oControl.getValue());
					}
					if (typeof fnControlsUpdated === "function") {
						oControl.attachChange(function() {
							fnControlsUpdated(this);
						}, this);
					}

					oDynamicDateRange.aControlsByParameters[this.getKey()].push(oControl);
				}, this);

				that.setControls(aControls);

				return aControls;
			},
			format: this._customDDOptionFormatter.bind(this),
			toDates: function (oValue) {
				var oCondition = that.oModel.getProperty("", that.oConditionContext),
					sOldOperationName = oCondition.operation,
					vOldValue1 = oCondition.value1,
					vOldValue2 = oCondition.value2;

				// Change operation to the current value
				oCondition.operation = that._getOptionName(oValue.operator);
				oCondition.value1 = !isNaN(oValue.values[0]) ? parseInt(oValue.values[0]) : oValue.values[0];
				oCondition.value2 = !isNaN(oValue.values[1]) ? parseInt(oValue.values[1]) : oValue.values[1];

				var aResult = that.getFilterRanges();

				// Restore to the selected operation
				oCondition.operation = sOldOperationName;
				oCondition.value1 = vOldValue1;
				oCondition.value2 = vOldValue2;

				if (aResult.length === 0) {
					return [];
				}

				return [aResult[0].value1, aResult[0].value2];
			},
			parse: function (sValue) {
				var oListItems = new ListItem({
					key: oCustomOperation.key
					}),
					bMatch = oCustomOperation.filterSuggestItem.call(oCustomOperation, sValue, oListItems, that);

				if (bMatch) {
					return {
						operator: this.getKey(),
						values: [oListItems._value1, oListItems._value2 || null]
					};
				}

				return null;
			},
			validateValueHelpUI: function (oControl) {
				var _isValidFromToPeriod = function (oInput) {
					var iValue = oInput.getValue(),
						_maxIntValue = this._maxIntValue,
						_minIntValuethis = -this._maxIntValue;
					if ((!iValue && iValue !== 0) || isNaN(iValue)) {
						return false;
					}

					if (oInputControl && oInputControl.getBindingInfo('value') && oInputControl.getBindingInfo('value').type &&
						oInputControl.getBindingInfo('value').type.oConstraints){
						if (oInputControl.getBindingInfo('value').type.oConstraints.hasOwnProperty("minimum")) {
							_minIntValuethis = oInputControl.getBindingInfo('value').type.oConstraints.minimum;
						}

						if (oInputControl.getBindingInfo('value').type.oConstraints.hasOwnProperty("maximum")) {
							_maxIntValue = oInputControl.getBindingInfo('value').type.oConstraints.maximum;
						}
					}

					if (iValue < _minIntValuethis ||
						iValue > _maxIntValue) {
						return false;
					}

					return true;
				};

				var aParams = this.getValueHelpUITypes();

				for (var i = 0; i < aParams.length; i++) {
					var oInputControl = oControl.aControlsByParameters[this.getKey()][i];

					switch (aParams[i].getType()) {
						case "int":
							return _isValidFromToPeriod.call(that, oInputControl);
						case "month":
						case "date":
						case "daterange":
							if (!oInputControl.getSelectedDates() || oInputControl.getSelectedDates().length == 0) {
								return false;
							}
							break;
						case "options":
							if (oInputControl.getSelectedIndex() < 0) {
								return false;
							}
							break;
					}
				}

				return true;
			}
		});

		return new CustomDynamicDateOptionClass({
			key: sOptionId
		});
	};

	DateRangeType.prototype._customDDOptionFormatter = function (oValue) {
		var sOperationName = this._getOptionName(oValue.operator),
			oCurrentOperation = this.getOperation(sOperationName);

		if (!oCurrentOperation) {
			this._oInput.setValue(null);
			this._oInput._oInput.setValue(null);
			this.oModel.setProperty("/currentoperation", null);
			this.oModel.setProperty("/condition/value1", null);
			this.oModel.setProperty("/condition/value2", null);
			return "";
		}
		var vValues = this._prepareDDRValues(oCurrentOperation, oValue, sOperationName);

		var oJson = {
			conditionTypeInfo: {
				data: {
					value1: vValues[0],
					value2: vValues[1]
				}
			}
		};

		// Almost the same code as _updateProvider. If something is changed here check _updateProvider as well
		if (oCurrentOperation.languageText) {
			var sFormattedText = oCurrentOperation.languageText;

			if (this._isIntIntInterval(oCurrentOperation)) {
				if (oJson.conditionTypeInfo.data.value1 != null && oJson.conditionTypeInfo.data.value1 !== ""
					&& oJson.conditionTypeInfo.data.value2 != null && oJson.conditionTypeInfo.data.value2 !== "") {
					sFormattedText = this._formatIntIntInterval(oCurrentOperation, oJson);
				}
			} else if (this._isIntInterval(oCurrentOperation)) {
				if (oJson.conditionTypeInfo.data.value1 !== null && oJson.conditionTypeInfo.data.value1 !== "") {
					sFormattedText = this._formatIntInterval(oCurrentOperation, oJson);
				} else {
					sFormattedText = "";
				}
			} else if (this._isFixedRange(oCurrentOperation)) {
				sFormattedText = this._formatFixedRange(oCurrentOperation, oCurrentOperation.textValue);
			} else {
				if (oJson.conditionTypeInfo.data.value1 !== null && oJson.conditionTypeInfo.data.value1 !== "") {
					var oRes = this._calculateDateRangeValueText(oCurrentOperation, oJson);
					var sValue = oRes.value;

					if (sValue) {
						sFormattedText = this._formatFixedRange(oCurrentOperation, sValue);
					} else {
						sFormattedText = "";
					}
				} else {
					// not a valid condition
					sFormattedText = "";
				}
			}
		}

		return sFormattedText;
	};

	// Start: Methods used in both old and new implementation
	DateRangeType.prototype._isIntInterval = function (oCurrentOperation) {
		return oCurrentOperation.basicLanguageText.indexOf("{0}") >= 0;
	};

	DateRangeType.prototype._formatIntInterval = function (oCurrentOperation, oJson) {
		if (oJson.conditionTypeInfo.data.value1 === 0 && oCurrentOperation.zeroNumberTextKey) {
			return oCurrentOperation.zeroNumberLanguageText;
		}

		if (oJson.conditionTypeInfo.data.value1 === 1 && oCurrentOperation.singulareBasicLanguageText) {
			return oCurrentOperation.singulareBasicLanguageText;
		}

		return this._fillNumberToText(oCurrentOperation.basicLanguageText, oJson.conditionTypeInfo.data.value1);
	};

	DateRangeType.prototype._isIntIntInterval = function (oCurrentOperation) {
		return oCurrentOperation.basicLanguageText.indexOf("{0}") >= 0 && oCurrentOperation.basicLanguageText.indexOf("{1}") >= 0;
	};

	DateRangeType.prototype._formatIntIntInterval = function (oCurrentOperation, oJson) {
		return this._fillNumberToText(oCurrentOperation.basicLanguageText, oJson.conditionTypeInfo.data.value1, oJson.conditionTypeInfo.data.value2);
	};

	DateRangeType.prototype._isFixedRange = function (oCurrentOperation) {
		//TODO: needs to be improved
		//failing test with custom operation: opaTests/DateRangeType/Opa.page3
		//var sCategory = typeof oCurrentOperation.category === "object" ? oCurrentOperation.category.key : oCurrentOperation.category;
		//return sCategory?.toUpperCase().startsWith("FIXED");
		return oCurrentOperation.textValue;
	};

	DateRangeType.prototype._formatFixedRange = function (oCurrentOperation, sValue) {
		return oCurrentOperation.languageText;
	};

	DateRangeType.prototype._calculateDateRangeValueText = function (oCurrentOperation, oJson) {
		var v1 = oJson.conditionTypeInfo.data.value1;
		var v2 = oJson.conditionTypeInfo.data.value2;
		var sValue;
		var bSetCursor = false;
		if ((typeof v1 === "number" || typeof v1 === "string"  && !isNaN(parseInt(v1))) && oCurrentOperation.valueList) {
			// in case of number access the month from  the value List array
			sValue = oCurrentOperation.valueList[v1].text;
		} else if (v1 instanceof Date) {
			var oDateFormatter = this._getDateFormatter(false);
			if (oJson.conditionTypeInfo.data.operation !== "DATERANGE" && (v1 && !v2)) {
				sValue = oDateFormatter.format(v1);
			} else if (oJson.conditionTypeInfo.data.operation === "DATERANGE" && v1 && v2) {
				//TODO replace "-" by Delimiter
				sValue = oDateFormatter.format(v1) + " - " + oDateFormatter.format(v2);
			} else if (oJson.conditionTypeInfo.data.operation === "DATERANGE" && v1 && !v2) {
				//TODO replace "-" by Delimiter
				sValue = oDateFormatter.format(v1) + " - ";
				bSetCursor = true;
			} else {
				sValue = "";
			}
		} else {
			sValue = oJson.conditionTypeInfo.data.value1;
		}

		return { value: sValue, bSetCursor: bSetCursor };
	};
	// End: Methods used in both old and new implementation

	DateRangeType.prototype._convertUniversalDateToDate = function (aDates) {
		return aDates.map(function (oDate) {
			if (oDate.getJSDate) {
				return oDate.getJSDate();
			}

			return oDate;
		});
	};

	DateRangeType.prototype._clearModelInputState = function (oJson, oOperation) {
		if (
			oOperation.type === "[int,int]" &&
			this._isValidFromToPeriod(oJson.conditionTypeInfo.data.value1, oJson.conditionTypeInfo.data.value2)
		){
			this.oModel.setProperty("inputstate", "NONE", this.getContext());
		} else if (
			oOperation.type === "int" &&
			oJson.conditionTypeInfo.data.value1 !== null &&
			oJson.conditionTypeInfo.data.value1 !== ""
		){
			this.oModel.setProperty("inputstate", "NONE", this.getContext());
		} else if (this._isFixedRange(oOperation)) {
			this.oModel.setProperty("inputstate", "NONE", this.getContext());
		} else if (
			oJson.conditionTypeInfo.data.value1 !== null &&
			oJson.conditionTypeInfo.data.value1 !== ""
		){
			var oRes = this._calculateDateRangeValueText(oOperation, oJson);

			if (oRes.value) {
				this.oModel.setProperty("inputstate", "NONE", this.getContext());
			}
		}
	};

	DateRangeType.prototype._prepareDDRValues = function (oOperation, oValue, sOperationName) {
		if (sOperationName === "SPECIFICMONTH") {
			return [].concat(oValue.values);
		}

		var sCategoty = typeof oOperation.category === "object" ? oOperation.category.key : oOperation.category;
		if (oOperation.type === "int" && !sCategoty.toUpperCase().startsWith('FIXED.')) {
			return [parseInt(oValue.values[0]), null];
		}
		if (oOperation.type === "[int,int]") {
			return [parseInt(oValue.values[0]), parseInt(oValue.values[1])];
		}

		var vValues = this._oInput.toDates(oValue);
		if (this._bDTOffset && (sOperationName === "DATETIME" || sOperationName === "DATETIMERANGE")){
			if (vValues[0]) {
				vValues[0] = DateTimeUtil.localToUiTimezone(vValues[0].oDate);
			}

			if (vValues[1]) {
				vValues[1] = DateTimeUtil.localToUiTimezone(vValues[1].oDate);
				vValues[1] = DateRangeType.setMilliseconds(vValues[1]);
			}
		}

		return this._convertUniversalDateToDate(vValues);
	};

	DateRangeType.prototype._setDDROperation = function (oCondition) {
		if (this._oInput && oCondition.key && oCondition.operation) {
			var aValues = [];
			if (oCondition.value1 || oCondition.value1 === 0) {
				aValues[0] = oCondition.value1;
				if (oCondition.value2 || oCondition.value2 === 0) {
					aValues[1] = oCondition.value2;
				}
			}
			var oOption = this._getDDROption(oCondition.operation),
				oOperation = this.getOperation(oCondition.operation),
				bValidCondition = function (oOperation, aValues) {
					if (!oOperation) {
						return false;
					}

					if (oOperation.hasOwnProperty("value1") && !aValues[0] && aValues[0] !== 0) {
						return false;
					}

					if (oOperation.hasOwnProperty("value2") && !aValues[1] && aValues[1] !== 0) {
						return false;
					}

					return true;
				};
			if (this._bDTOffset && (oOption.getKey() === "DATETIME" || oOption.getKey() === "DATETIMERANGE")) {
				if (aValues[0]) {
					aValues[0] = DateTimeUtil.uiTimezoneToLocal(aValues[0]);
				}

				if (aValues[1]) {
					aValues[1] = DateTimeUtil.uiTimezoneToLocal(aValues[1]);
					aValues[1] = DateRangeType.setMilliseconds(aValues[1]);
				}
			}
			if (bValidCondition(oOperation, aValues)) {
				this._oInput.setValue({
					key: oCondition.key,
					operator: oOption.getKey(),
					values: aValues
				});
			} else {
				this._oInput.setValue(null);
				this._oInput._oInput.setValue(null);
			}
		}
	};

	return DateRangeType;
});
