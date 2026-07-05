/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/base/i18n/Formatting",
	'sap/ui/comp/library',
	'sap/ui/base/ManagedObject',
	'sap/ui/comp/odata/MetadataAnalyser',
	"sap/ui/core/Locale",
	'sap/ui/model/odata/AnnotationHelper',
	'sap/ui/model/Context',
	'sap/base/util/isEmptyObject'
], function(Formatting, compLibrary, ManagedObject, MetadataAnalyser, Locale, AnnotationHelper, Context, isEmptyObject) {
	"use strict";

	/**
	 * @typedef {Object} sap.ui.comp.state.UIState.SelectionVariantParam
	 *
	 * @property {string} FilterContextUrl
	 * @property {string} ParameterContextUrl
	 * @property {Object[]} Parameters
	 * @property {Object[]} SelectOptions
	 * @property {string} SelectionVariantID
	 *
	 * @public
	 */

	/**
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Creates a new instance of an UIState class.
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.136.0
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.ui.comp.state.UIState
	 */
	var UIState = ManagedObject.extend("sap.ui.comp.state.UIState", /** @lends sap.ui.comp.state.UIState.prototype */
	{
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * Object representing the presentation variant. The structure looks like:
				 *
				 * <pre><code>
				 * {
				 * 	ContextUrl: {string},
				 * 	MaxItems: {int},
				 *  SortOrder: [],
				 * 	GroupBy: [],
				 * 	Total: [],
				 * 	RequestAtLeast: [],
				 * 	Visualizations: []
				 * }
				 * </code></pre>
				 *
				 * <b>Note:</b>
				 * <ul>
				 * <li> <code>PresentationVariantID</code> property is not provided</li>
				 * <li> <code>Text</code> property is not provided because it is translated text</li>
				 * <li> <code>TotalBy</code> is not supported yet</li>
				 * <li> <code>IncludeGrandTotal</code> is not supported yet</li>
				 * <li> <code>InitialExpansionLevel</code> is not supported yet</li>
				 * <li> <code>Title</code> of <code>Visualizations.Content</code> property is not provided because it is translated text</li>
				 * <li> <code>Description</code> of <code>Visualizations.Content</code> property is not provided because it is translated text</li>
				 * <li> <code>VariantName</code> property is not part of specified DataSuiteFormat yet
				 * </ul>
				 */
				presentationVariant: {
					type: "object"
				},
				/**
				 * Object representing the selection variant. The structure looks like:
				 *
				 * <pre><code>
				 * {
				 *  SelectionVariant: {
				 *      SelectionVariantID: {string},
				 * 		Parameters: [],
				 * 		SelectOptions: []
				 * }
				 * </code></pre>
				 */
				selectionVariant: {
					type: "object"
				},

				/**
				 * Variant name.
				 */
				variantName: {
					type: "string"
				},

				/**
				 * Structure containing filter value keys and its corresponding descriptions.
				 *
				 * <pre><code>
				 * {
				 * 	Texts: [
				 * 		{
				 * 			Language: string,
				 * 			ContextUrl: string,
				 * 			PropertyTexts: [
				 * 				{
				 * 					PropertyName: string,
				 * 					ValueTexts: [
				 * 						{
				 * 							PropertyValue: string,
				 * 							Text: string
				 * 						}
				 * 					]
				 * 				}
				 * 			]
				 * 		}
				 * 	]
				 * }
				 * </code></pre>
				 */
				valueTexts: {
					type: "object"
				},

				/**
				 * Structure containing Date range semantic data of the filter value.
				 *
				 * <pre><code>
				 * {
				 * 	Dates: [
				 * 		{
				 * 			PropertyName: string,
				 * 			Data: {
				 * 					calendarType: string,
				 * 					key: string,
				 * 					operation: string,
				 * 					value1: int,
				 * 					value2: int
				 * 				}
				 * 		}
				 * 	]
				 * }
				 * </code></pre>
				 */
				semanticDates: {
					type: "object"
				},

				/**
				 * Structure containing table related settings. The properties
				 * might be related to a specific table type and will be ignored
				 * if a different table type is used.
				 *
				 * <pre><code>
				 * {
				 *     fixedColumnCount: int,
				 *     showDetails: boolean
				 * }
				 * </code></pre>
				 */
				tableSettings: {
					type: "object"
				}
			}
		}
	});

	UIState._getFilterNamesWithValuesForCurrentLanguage = function(oValueTexts) {
		var aPropertyNames = [], sLanguage = new Locale(Formatting.getLanguageTag()).getLanguage();

		if (oValueTexts && oValueTexts.Texts) {
			oValueTexts.Texts.some(function(oText) {
				if (oText.Language === sLanguage) {
					oText.PropertyTexts.forEach(function(oProperty) {
						var oObj, bFound = false;

						for (var i = 0; i < aPropertyNames.length; i++) {
							if (aPropertyNames[i].filterName === oProperty.PropertyName) {
								oObj = aPropertyNames[i];
								bFound = true;
								break;
							}
						}

						if (oProperty.PropertyName && oProperty.ValueTexts && (Object.keys(oProperty.ValueTexts).length > 0)) {

							oProperty.ValueTexts.forEach(function(oValueText) {

								if (!oObj) {
									oObj = {
										filterName: oProperty.PropertyName,
										keys: []
									};
								}
								oObj.keys.push(oValueText.PropertyValue);
							});
						}

						if (!bFound && oObj && oObj.keys.length) {
							aPropertyNames.push(oObj);
						}
					});
					return true;
				}
				return false;
			});
		}
		return aPropertyNames;
	};

	UIState._getFilterNamesWithValuesFromSelectOption = function(oSelectionVariant, aIgnoreNames) {
		var aSelectOptions = [];

		if (oSelectionVariant && oSelectionVariant.SelectOptions) {
			oSelectionVariant.SelectOptions.forEach(function(oSelOption) {

				var bConsider = aIgnoreNames ? (aIgnoreNames.indexOf(oSelOption.PropertyName) < 0) : true;

				if (bConsider) {
					var oObj = {
						filterName: oSelOption.PropertyName,
						keys: []
					};

					oSelOption.Ranges.forEach(function(oRange) {
						if (oRange.Option === "EQ" && oRange.Sign === "I") {
							oObj.keys.push(oRange.Low);
						}
					});

					aSelectOptions.push(oObj);
				}
			});
		}

		return aSelectOptions;
	};

	UIState._determineFiltersWithOnlyKeyValues = function(aFilterFromValueTexts, aFiltersFromSelOption) {
		var bFound, oInfoFromValueTexts, aFiltersWithOnlyKeyValues = [];

		aFilterFromValueTexts = aFilterFromValueTexts || [];
		aFiltersFromSelOption = aFiltersFromSelOption || [];

		aFiltersFromSelOption.forEach(function(oInfoSelOption) {

			var oObj = {
				filterName: oInfoSelOption.filterName,
				keys: []
			};

			oInfoFromValueTexts = null;

			aFilterFromValueTexts.some(function(oInfoValueText) {
				if (oInfoSelOption.filterName === oInfoValueText.filterName) {
					oInfoFromValueTexts = oInfoValueText;
				}

				return oInfoFromValueTexts !== null;
			});

			for (var i = 0; i < oInfoSelOption.keys.length; i++) {
				bFound = false;
				if (oInfoFromValueTexts) {
					for (var j = 0; j < oInfoFromValueTexts.keys.length; j++) {
						if (oInfoSelOption.keys[i] === oInfoFromValueTexts.keys[j]) {
							bFound = true;
							break;
						}
					}
				}

				if (!bFound) {
					oObj.keys.push(oInfoSelOption.keys[i]);
				}
			}

			if (oObj.keys.length) {
				aFiltersWithOnlyKeyValues.push(oObj);
			}

		});

		return aFiltersWithOnlyKeyValues;
	};

	/**
	 * Determines the filter names with value keys where the description is not available.
	 * @protected
	 * @since 1.75
	 * @param {object} oValueTexts Containing the value description for filters
	 * @param {sap.ui.comp.state.UIState.SelectionVariantParam} oSelectionVariant The selection variant containing filters and value keys
	 * @param {Object[]} aIgnoreSelOptionNames Filter names to ignore
	 * @returns {Object<string,Object[]>} a structure [ { filterName: name of the filter, keys: [ value keys without a description]} ]
	 */
	UIState.determineFiltersWithOnlyKeyValues = function(oValueTexts, oSelectionVariant, aIgnoreSelOptionNames) {
		var aValueTextInfo = UIState._getFilterNamesWithValuesForCurrentLanguage(oValueTexts);
		var aSelectOptionInfo = UIState._getFilterNamesWithValuesFromSelectOption(oSelectionVariant, aIgnoreSelOptionNames);

		return UIState._determineFiltersWithOnlyKeyValues(aValueTextInfo, aSelectOptionInfo);
	};


	/**
	 * Constructs the value state out of a given selection variant and the current model data
	 * @protected
	 * @param {sap.ui.comp.state.UIState.SelectionVariantParam} oSelectionVariant selection variant object
	 * @param {map} mData the filter provider model data
	 * @returns {Object<Object[]>} the values texts format
	 */
	UIState.calculateValueTexts = function(oSelectionVariant, mData) {
		var oValueTexts = null;

		var fAddEntry = function(sPropertyName, oEntry) {

			var oPropTextEntry = null;

			if (!oValueTexts) {
				oValueTexts = {
					"Texts": [
						{
							"ContextUrl": "",
							"Language": new Locale(Formatting.getLanguageTag()).getLanguage(),
							"PropertyTexts": []
						}
					]
				};

			}

			for (var i = 0; i < oValueTexts.Texts[0].PropertyTexts.length; i++) {
				if (oValueTexts.Texts[0].PropertyTexts[i].PropertyName === sPropertyName) {
					oPropTextEntry = oValueTexts.Texts[0].PropertyTexts[i];
					break;
				}
			}

			if (!oPropTextEntry) {
				oPropTextEntry = {
					"PropertyName": sPropertyName,
					ValueTexts: []
				};
				oValueTexts.Texts[0].PropertyTexts.push(oPropTextEntry);
			}

			oPropTextEntry.ValueTexts.push({
				"PropertyValue": oEntry.key,
				"Text": oEntry.text
			});

		};

		if (mData && oSelectionVariant && oSelectionVariant.SelectOptions) {
			oSelectionVariant.SelectOptions.forEach(function(oSelectOption) {
				// check for type ?
				if (mData[oSelectOption.PropertyName]) {

					if (mData[oSelectOption.PropertyName].ranges) {
						mData[oSelectOption.PropertyName].ranges.forEach(function(oEntry) {
							if (oEntry.hasOwnProperty("text")) {
								fAddEntry(oSelectOption.PropertyName, oEntry);
							}
						});
					}

					if (mData[oSelectOption.PropertyName].items) {
						mData[oSelectOption.PropertyName].items.forEach(function(oEntry) {
							if (oEntry.hasOwnProperty("text")) {
								fAddEntry(oSelectOption.PropertyName, oEntry);
							}
						});
					}
				}
			});
		}

		return oValueTexts;
	};

	/**
	 * Enriches the internal filter bar value format with the information from the value state.
	 * @protected
	 * @param {string} sPayload the filter bar inner data format
	 * @param {Object<Object[]>} oValueTexts the value texts format containing the eventual descriptions.
	 * @returns {string} enriched the filter bar inner data format
	 */
	UIState.enrichWithValueTexts = function(sPayload, oValueTexts) {
		var bEnriched = false, oTextEntry, sLanguage, oPayload, sEnrichedPayload = sPayload;

		sLanguage = new Locale(Formatting.getLanguageTag()).getLanguage().toLowerCase();

		if (oValueTexts && oValueTexts.Texts) {

			oValueTexts.Texts.some(function(oEntry) {
				if (oEntry.Language && oEntry.Language.toLowerCase() === sLanguage) {
					oTextEntry = oEntry;
				}

				return oTextEntry !== null;
			});

			if (oTextEntry && oTextEntry.PropertyTexts) {

				if (!oPayload) {
					oPayload = JSON.parse(sPayload);
				}

				oTextEntry.PropertyTexts.forEach(function(oProperty) {
					var oPayloadProperty = oPayload[oProperty.PropertyName];
					if (oPayloadProperty && oPayloadProperty.ranges && oProperty.ValueTexts) {
						oProperty.ValueTexts.forEach(function(oValueEntry) {
							var oPayloadValue = null, nIdx = -1;
							if (oValueEntry.Text) {
								oPayloadProperty.ranges.some(function(oVEntry, index) {
									if (!oVEntry.exclude && (oVEntry.operation === "EQ") && (oVEntry.value1 === oValueEntry.PropertyValue)) {
										oPayloadValue = oVEntry;
										nIdx = index;
									}

									return (oPayloadValue != null);
								});
							}

							if (oPayloadValue) {
								bEnriched = true;

								if (!oPayloadProperty.items) {
									oPayloadProperty.items = [];
								}

								oPayloadProperty.items.push({
									key: oValueEntry.PropertyValue,
									text: oValueEntry.Text
								});

								oPayload[oProperty.PropertyName].ranges.splice(nIdx, 1);
							}
						});
					}
				});

				if (bEnriched) {
					sEnrichedPayload = JSON.stringify(oPayload);
				}
			}
		}

		return sEnrichedPayload;

	};

	/**
	 * Converts PresentationVariant annotation to UIState object.
	 * @param {string} sVariantName Name of the variant
	 * @param {Object} oSelectionVariantAnnotation Object representing the com.sap.vocabularies.UI.v1.SelectionVariant annotation provided by
	 *        MetadataAnalyser
	 * @param {Object} oPresentationVariantAnnotation Object representing the com.sap.vocabularies.UI.v1.PresentationVariant annotation provided by
	 *        MetadataAnalyser
	 * @returns {sap.ui.comp.state.UIState} UIState object containing converted parts of SelectionVariant and PresentationVariant annotations
	 * @protected
	 */
	UIState.createFromSelectionAndPresentationVariantAnnotation = function(sVariantName, oSelectionVariantAnnotation, oPresentationVariantAnnotation) {
		var oSelectionVariant = {};
		if (oSelectionVariantAnnotation && oSelectionVariantAnnotation.SelectOptions && oSelectionVariantAnnotation.SelectOptions.length) {
			// Convert 'SelectOptions.Ranges'
			oSelectionVariant.SelectOptions = oSelectionVariantAnnotation.SelectOptions.map(function(oSelectOptionAnnotation) {
				return {
					PropertyName: oSelectOptionAnnotation.PropertyName.PropertyPath,
					Ranges: oSelectOptionAnnotation.Ranges.map(function(oRangeAnnotation) {
						var oModelContext = new Context(null, "/");
						return {
							Sign: MetadataAnalyser.getSelectionRangeSignType([
								oRangeAnnotation.Sign.EnumMember
							]),
							Option: MetadataAnalyser.getSelectionRangeOptionType([
								oRangeAnnotation.Option.EnumMember
							]),
							// actually if annotation does not contain 'Low' parameter we should not create one with value null. 'null' could be a
							// valid value.
							Low: oRangeAnnotation.Low && AnnotationHelper.format(oModelContext, oRangeAnnotation.Low) || undefined,
							// actually if annotation does not contain 'High' parameter we should not create one with value null. 'null' could be a
							// valid value.
							High: oRangeAnnotation.High && AnnotationHelper.format(oModelContext, oRangeAnnotation.High) || undefined
						};
					})
				};
			});
		}

		if (oSelectionVariantAnnotation && oSelectionVariantAnnotation.Parameters && oSelectionVariantAnnotation.Parameters.length) {
			oSelectionVariant.Parameters = oSelectionVariantAnnotation.Parameters.map(function(oParameter) {
				var oModelContext = new Context(null, "/");
				return {
					PropertyName: oParameter.PropertyName.PropertyPath,
					PropertyValue: oParameter.PropertyValue && AnnotationHelper.format(oModelContext, oParameter.PropertyValue) || undefined
				};
			});
		}

		var oPresentationVariant = {};
		// PresentationVariantID: uid() // from sap/base/util/uid
		// ContextUrl: ""
		// Total: oUIStateP13n ? oUIStateP13n.Total : []
		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.lineItemAnnotation) {
			if (!oPresentationVariant.Visualizations) {
				oPresentationVariant.Visualizations = [];
			}

			var aFields = [];
			if (oPresentationVariantAnnotation.lineItemAnnotation.fields) {

				var mLabels = oPresentationVariantAnnotation.lineItemAnnotation.labels;
				var mURLInfo = oPresentationVariantAnnotation.lineItemAnnotation.urlInfo;
				var mImportance = oPresentationVariantAnnotation.lineItemAnnotation.importance;
				var mCriticality = oPresentationVariantAnnotation.lineItemAnnotation.criticality;

				oPresentationVariantAnnotation.lineItemAnnotation.fields.forEach(function(sField) {
					var oObj = {
						Value: sField
					};

					oObj.Label = mLabels[sField] ? mLabels[sField] : null;
					oObj.IconUrl = mURLInfo[sField] ? mURLInfo[sField] : null;
// oObj.CriticalityRepresentation = oObj.IconUrl ? CriticalityRepresentationType.WithIcon : CriticalityRepresentationType.WithoutIcon;
					oObj.Importance = mImportance[sField] ? mImportance[sField] : null;
					oObj.Criticality = mCriticality[sField] ? mCriticality[sField] : null;

					aFields.push(oObj);
				});
			}

			oPresentationVariant.Visualizations.push({
				Type: "LineItem",
				Content: aFields
			});
		}
		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.chartAnnotation) {

			if (!oPresentationVariant.Visualizations) {
				oPresentationVariant.Visualizations = [];
			}

			oPresentationVariant.Visualizations.push({
				Type: "Chart",
				Content: {
					// Title:""
					// Description:""
					ChartType: oPresentationVariantAnnotation.chartAnnotation.chartType,
					Measures: oPresentationVariantAnnotation.chartAnnotation.measureFields,
					MeasureAttributes: Object.keys(oPresentationVariantAnnotation.chartAnnotation.measureAttributes).map(function(sAttribute) {
						return {
							Measure: sAttribute,
							Role: oPresentationVariantAnnotation.chartAnnotation.measureAttributes[sAttribute].role
						};
					}),
					Dimensions: oPresentationVariantAnnotation.chartAnnotation.dimensionFields,
					DimensionAttributes: Object.keys(oPresentationVariantAnnotation.chartAnnotation.dimensionAttributes).map(function(sAttribute) {
						return {
							Dimension: sAttribute,
							Role: oPresentationVariantAnnotation.chartAnnotation.dimensionAttributes[sAttribute].role
						};
					})
				}
			});
		}
		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.maxItems) {
			oPresentationVariant.MaxItems = parseInt(oPresentationVariantAnnotation.maxItems);
		}
		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.sortOrderFields) {
			oPresentationVariant.SortOrder = oPresentationVariantAnnotation.sortOrderFields.map(function(oField) {
				return {
					Property: oField.name,
					Descending: oField.descending
				};
			});
		}
		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.groupByFields) {
			oPresentationVariant.GroupBy = oPresentationVariantAnnotation.groupByFields;
		}
		if (oPresentationVariantAnnotation && oPresentationVariantAnnotation.requestAtLeastFields) {
			oPresentationVariant.RequestAtLeast = oPresentationVariantAnnotation.requestAtLeastFields;
		}
		return new UIState({
			presentationVariant: !isEmptyObject(oPresentationVariant) ? oPresentationVariant : undefined,
			selectionVariant: !isEmptyObject(oSelectionVariant) ? oSelectionVariant : undefined,
			variantName: sVariantName ? sVariantName : undefined
		});
	};
	/**
	 * Constructs the value state out of a given selection variant and the current model data
	 * @protected
	 * @param {sap.ui.comp.state.UIState.SelectionVariantParam} oSelectionVariant selection variant object
	 * @param {map} mData the filter provider model data
	 * @returns {Object<Object[]>} the values texts format
	 */
	UIState.calcSemanticDates = function(oSelectionVariant, mData) {
			var oSemanticDates = null;
			var fAddEntry = function(sPropertyName, oEntry) {
				var oPropTextEntry = null;
				if (!oSemanticDates) {
					oSemanticDates = {
						"Dates": []
					};
				}
				for (var i = 0; i < oSemanticDates.Dates.length; i++) {
					if (oSemanticDates.Dates[i].PropertyName === sPropertyName) {
						oPropTextEntry = oSemanticDates.Dates[i];
						break;
					}
				}
				if (!oPropTextEntry) {
					oPropTextEntry = {
						"PropertyName": sPropertyName,
						"Data" : oEntry.conditionTypeInfo.data
					};
					oSemanticDates.Dates.push(oPropTextEntry);
				}
			};
			if (mData && oSelectionVariant && oSelectionVariant.SelectOptions) {
				oSelectionVariant.SelectOptions.forEach(function(oSelectOption) {
					if (mData[oSelectOption.PropertyName]) {
						if (mData[oSelectOption.PropertyName].ranges) {
							if (mData[oSelectOption.PropertyName].hasOwnProperty("conditionTypeInfo")) {
								fAddEntry(oSelectOption.PropertyName, mData[oSelectOption.PropertyName]);
							}
						}
					}
				});
			}

		return oSemanticDates;
	 };

	 /**
	 * Enriches the internal filter bar value format with the semantic date information.
	 * @protected
	 * @param {string} sPayload the filter bar inner data format
	 * @param {Object<Object[]>} oSemanticDates Semantic date information
	 * @returns {string} enriched the filter bar inner data format
	 */
	UIState.enrichWithSemanticDates = function(sPayload, oSemanticDates) {
		var bEnriched = false, oPayload, sEnrichedPayload = sPayload;

		if (oSemanticDates && oSemanticDates.Dates) {
				if (!oPayload) {
					oPayload = JSON.parse(sPayload);
				}
				oSemanticDates.Dates.forEach(function(oProperty) {
					var oPayloadProperty = oPayload[oProperty.PropertyName];
					if (oPayloadProperty && oPayloadProperty.ranges && oProperty.Data) {
							bEnriched = true;
							if (!oPayloadProperty.items) {
								oPayloadProperty.items = [];
							}
							oPayloadProperty.ranges[0].semantic = oProperty.Data;
					}
				});

				if (bEnriched) {
					sEnrichedPayload = JSON.stringify(oPayload);
				}
		}

		return sEnrichedPayload;

	};

	return UIState;
});
