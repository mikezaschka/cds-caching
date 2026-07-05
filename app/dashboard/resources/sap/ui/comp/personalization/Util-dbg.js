/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * @namespace Provides utitlity functions for the personalization dialog
 * @name sap.ui.comp.personalization.Util
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.25.0
 */
sap.ui.define([
	"sap/base/i18n/Localization",
	'sap/ui/comp/library',
	'sap/m/library',
	'sap/base/util/deepExtend',
	"sap/ui/core/Locale",
	'sap/ui/core/date/UI5Date'
], function(
	Localization,
	CompLibrary,
	MLibrary,
	deepExtend,
	Locale,
	UI5Date
) {
	"use strict";

	// shortcut for sap.ui.comp.personalization.ChangeType
	var ChangeType = CompLibrary.personalization.ChangeType;

	// shortcut for sap.ui.comp.personalization.AggregationRole
	var AggregationRole = CompLibrary.personalization.AggregationRole;

	// shortcut for sap.ui.comp.personalization.TableType
	var TableType = CompLibrary.personalization.TableType;

	// shortcut for sap.ui.comp.personalization.ColumnType
	var ColumnType = CompLibrary.personalization.ColumnType;

	var Util = {

		getColumnKeys: function (aColumns) {
			if (!aColumns || !aColumns.length) {
				return [];
			}
			return aColumns.map(function (oColumn) {
				return this.getColumnKey(oColumn);
			}, this);
		},

		/**
		 * Sort the items in alphabetical order.
		 *
		 * @param {object} aItems
		 */
		sortItemsByText: function (aItems, sKeyName) {
			var sLanguage;
			try {
				var sLanguage = new Locale(Localization.getLanguageTag()).toString();
				if (typeof window.Intl !== 'undefined') {
					var oCollator = window.Intl.Collator(sLanguage, {
						numeric: true
					});
					aItems.sort(function (a, b) {
						return oCollator.compare(a[sKeyName], b[sKeyName]);
					});
				} else {
					aItems.sort(function (a, b) {
						return a[sKeyName].localeCompare(b[sKeyName], sLanguage, {
							numeric: true
						});
					});
				}
			} catch (oException) {
				// this exception can happen if the configured language is not convertible to BCP47 -> getLocale will deliver an exception
			}
		},

		getUnionOfAttribute: function (oSetting, sAttributeName) {
			var aUnion = [];
			var fAddColumnKey = function (sColumnKey) {
				if (aUnion.indexOf(sColumnKey) < 0) {
					aUnion.push(sColumnKey);
				}
			};
			for (var sNamespace in oSetting) {
				var oNamespace = oSetting[sNamespace];
				if (!oNamespace[sAttributeName]) {
					continue;
				}
				oNamespace[sAttributeName].forEach(fAddColumnKey);
			}
			return aUnion;
		},

		getUnionOfColumnKeys: function (oJson) {
			var aUnion = [];
			var fnConcatUnique = function (aItems) {
				aUnion = aUnion.concat(aItems.map(function (oItem) {
					return oItem.columnKey;
				}));
				aUnion = aUnion.filter(function (sColumnKey, iIndex) {
					return aUnion.indexOf(sColumnKey) === iIndex;
				});
			};
			for (var sType in oJson) {
				for (var sItemType in oJson[sType]) {
					if (!Array.isArray(oJson[sType][sItemType])) {
						continue;
					}
					fnConcatUnique(oJson[sType][sItemType]);
				}
			}
			return aUnion;
		},

		copy: function (oObject) {
			if (oObject instanceof Array) {
				return deepExtend([], oObject);
			} else {
				return deepExtend({}, oObject);
			}
		},

		sort: function (sKeyName, aArray) {
			var aResult = this.copy(aArray);
			aResult.sort(function (a, b) {
				var aText = a[sKeyName].toLocaleLowerCase();
				var bText = b[sKeyName].toLocaleLowerCase();

				if (aText < bText) {
					return -1;
				}
				if (aText > bText) {
					return 1;
				}
				// a must be equal to b
				return 0;
			});
			return aResult;
		},

		removeEmptyProperty: function (oJson) {
			for (var sType in oJson) {
				if (oJson[sType] === null || oJson[sType] === undefined) {
					delete oJson[sType];
				}
			}
			return oJson;
		},

		semanticEqual: function (oItemA, oItemB) {
			if (!oItemA || !oItemB) {
				return false;
			}
			for (var property in oItemA) {
				if (oItemA[property] !== oItemB[property]) {
					return false;
				}
			}
			return true;
		},

		/**
		 * @param {sap.ui.comp.personalization.ChangeType} oChangeType
		 * @returns {boolean} true if at least one property of oChangeType has 'ModelChanged' or 'TableChanged'.
		 */
		hasChangedType: function (oChangeType) {
			for (var type in oChangeType) {
				if (oChangeType[type] === ChangeType.ModelChanged || oChangeType[type] === ChangeType.TableChanged) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @param {sap.ui.comp.personalization.ChangeType} oChangeType
		 * @param {string} sNamespace
		 * @returns {boolean} true if property <code>sNamespace</code> of oChangeType has 'ModelChanged' or 'TableChanged'.
		 */
		isNamespaceChanged: function (oChangeType, sNamespace) {
			if (oChangeType[sNamespace]) {
				return oChangeType[sNamespace] === ChangeType.ModelChanged || oChangeType[sNamespace] === ChangeType.TableChanged;
			}
			return false;
		},

		/**
		 * Returns an array of elements coming from sElements that are separated by commas.
		 *
		 * @param {string} sElements
		 * @returns {array}
		 */
		createArrayFromString: function (sElements) {
			if (!sElements) {
				return [];
			}
			var aElements = [];
			var aRowElements = sElements.split(",");
			aRowElements.forEach(function (sField) {
				if (sField !== "") {
					aElements.push(sField.trim());
				}
			});
			return aElements;
		},

		/**
		 * @param {string} sKeyName - property name for key
		 * @param {string} sKeyValue - key value which is looking for
		 * @param {Array} aArray - array where the element with key value 'sKeyValue' is looking for
		 * @returns {int} Index of key or -1 if not found
		 */
		getIndexByKey: function (sKeyName, sKeyValue, aArray) {
			if (!aArray || !aArray.length) {
				return -1;
			}
			var iIndex = -1;
			aArray.some(function (oElement, i) {
				if (oElement[sKeyName] !== undefined && oElement[sKeyName] === sKeyValue) {
					iIndex = i;
					return true;
				}
			});
			return iIndex;
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column | sap.ui.comp.personalization.ColumnWrapper} oColumn
		 * @returns {string | null}
		 */
		getColumnKey: function (oColumn) {
			return this._getCustomProperty(oColumn, "columnKey") || oColumn.getId();
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @returns {string | null}
		 */
		getColumnType: function (oColumn) {
			return this._getCustomProperty(oColumn, "type");
		},

		hasSortableColumns: function (oColumnKey2ColumnMap) {
			for (var sColumnKey in oColumnKey2ColumnMap) {
				if (Util.isSortable(oColumnKey2ColumnMap[sColumnKey])) {
					return true;
				}
			}
			return false;
		},
		hasGroupableColumns: function (oColumnKey2ColumnMap) {
			for (var sColumnKey in oColumnKey2ColumnMap) {
				if (Util.isGroupable(oColumnKey2ColumnMap[sColumnKey])) {
					return true;
				}
			}
			return false;
		},
		hasFilterableColumns: function (oColumnKey2ColumnMap) {
			for (var sColumnKey in oColumnKey2ColumnMap) {
				if (Util.isFilterable(oColumnKey2ColumnMap[sColumnKey])) {
					return true;
				}
			}
			return false;
		},
		hasAggregatableColumns: function (oColumnKey2ColumnMap) {
			for (var sColumnKey in oColumnKey2ColumnMap) {
				if (Util.isAggregatable(oColumnKey2ColumnMap[sColumnKey])) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.AnalyticalColumn} oColumn
		 * @returns {boolean}
		 */
		isGroupable: function (oColumn) {
			if (oColumn && oColumn.isA("sap.ui.table.AnalyticalColumn")) {
				return oColumn.isGroupableByMenu() || this._getCustomProperty(oColumn, "isGroupable");
			}

			if (oColumn && oColumn.isA("sap.m.Column")) {
				return this.isSortable(oColumn);
			}

			// Not yet supported
			// if (oColumn instanceof sap.ui.table.Column) {
			// return oColumn.getParent().getEnableGrouping() && this.isSortable(oColumn);
			// }
			return false;
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column | sap.ui.comp.personalization.ColumnWrapper} oColumn
		 * @returns {boolean}
		 */
		isSortable: function (oColumn) {
			// If oColumn implements "sortProperty" property then we take it
			if (oColumn.getSortProperty) {
				return !!oColumn.getSortProperty();
			}
			// Only if oColumn does not implement "sortProperty" property then we take "p13nData"
			return !!this._getCustomProperty(oColumn, "sortProperty");
		},
		/**
		 * @param {sap.m.Column | sap.ui.table.Column | sap.ui.comp.personalization.ColumnWrapper} oColumn
		 * @returns {boolean}
		 */
		isFilterable: function (oColumn) {
			// If oColumn implements "filterProperty" property then we take it.
			if (oColumn.getFilterProperty) {
				return !!oColumn.getFilterProperty();
			}
			// Only if oColumn does not implement "filterProperty" property then we take "p13nData".
			return !!this._getCustomProperty(oColumn, "filterProperty");
		},
		isAggregatable: function (oColumn) {
			// If oColumn implements "aggregationRole" property then we take it.
			if (oColumn.getAggregationRole) {
				return oColumn.getAggregationRole() === AggregationRole.Dimension || oColumn.getAggregationRole() === AggregationRole.Measure;
			}
			// If oColumn does not implement "getAggregationRole" property we return 'false'
			return false;
		},

		/**
		 * @param {string} sKeyName - property name for key
		 * @param {string} sKeyValue - key value which is looking for
		 * @param {Array} aArray - array where the element with key value 'sKeyValue' is looking for
		 * @returns {object | null} either found array element or null if 'sKeyValue' does not exist in aArray
		 */
		getArrayElementByKey: function (sKeyName, sKeyValue, aArray) {
			if (!aArray || !aArray.length) {
				return null;
			}
			var oElement = null;
			aArray.some(function (oElement_) {
				if (oElement_[sKeyName] !== undefined && oElement_[sKeyName] === sKeyValue) {
					oElement = oElement_;
					return true;
				}
			});
			return oElement;
		},

		/**
		 * Checks whether <code>columnKey</code> of <code>oColumn</code> exists in <code>aIgnoredColumnKeys</code>.
		 *
		 * @param {sap.ui.table.Column|sap.m.Column} oColumn The column to be checked whether it is ignored
		 * @param {array} aIgnoredColumnKeys The array with ignored column keys
		 * @returns {boolean} <code>true</code> if oColumn exists in aIgnoredColumnKeys; <code>false</code> else
		 * @public
		 */
		isColumnIgnored: function (oColumn, aIgnoredColumnKeys) {
			if (!aIgnoredColumnKeys) {
				return false;
			}
			return aIgnoredColumnKeys.indexOf(this.getColumnKey(oColumn)) > -1;
		},

		/**
		 * This method will make an initial json snapshot of the given table instance and stores the column sorting information in the given array.
		 *
		 * @param {sap.ui.table.Table | sap.ui.comp.personalization.ChartWrapper} oTable The table where the sort data has to be extracted
		 * @param {array} aDestination The array where the sort json data should be stored
		 * @param {array} aIgnoreColumnKeys Array with column keys to be ignored
		 * @param {array} aTableViewMetadata Array with the OData service metadata for the table
		 * @public
		 */
		createSort2Json: function (oTable, aDestination, aIgnoreColumnKeys, aTableViewMetadata) {
			if (this.getTableBaseType(oTable) !== TableType.Table && this.getTableType(oTable) !== TableType.ChartWrapper) {
				return;
			}
			this.addSortPersistentData(this._mapTable2P13nSortJson(oTable), {
				sort: {
					sortItems: aDestination
				}
			}, aIgnoreColumnKeys, aTableViewMetadata);
		},

		/**
		 * @private
		 */
		addSortPersistentData: function (oSourceJsonData, oDestinationJsonData, aIgnoreColumnKeys, aTableViewMetadata) {
			var aAddedColumnKeys = [];
			oSourceJsonData.sort.sortItems.forEach(function (oSourceItem) {
				if (!oSourceItem.isSorted || aIgnoreColumnKeys.indexOf(oSourceItem.columnKey) > -1) {
					return;
				}
				oDestinationJsonData.sort.sortItems.push({
					columnKey: oSourceItem.columnKey,
					operation: oSourceItem.operation
				});
				aAddedColumnKeys.push(oSourceItem.columnKey);
			});

			if (aTableViewMetadata) {
				aTableViewMetadata.forEach(function(oFieldMetadata) {
					if (aAddedColumnKeys.indexOf(oFieldMetadata.name) > -1 || !oFieldMetadata.sorted) {
						return;
					}
					oDestinationJsonData.sort.sortItems.push({
						columnKey: oFieldMetadata.name,
						operation: oFieldMetadata.sortOrder,
						initiallyNotVisibleColumn: true
					});
				});
			}
		},

		/**
		 *
		 * @param {sap.ui.table.Table | sap.ui.comp.personalization.ChartWrapper} oTable The table where the sort data has to be extracted
		 * @private
		 */
		_mapTable2P13nSortJson: function (oTable) {
			return {
				sort: {
					sortItems: oTable.getColumns().map(function (oColumn) {
						var bIsSorted = oColumn.getSortOrder() !== "None";

						/** @deprecated As of version 1.120 */
						if (!oColumn.getSorted()) {
							bIsSorted = false;
						}

						return {
							columnKey: Util.getColumnKey(oColumn),
							isSorted: bIsSorted,
							operation: oColumn.getSortOrder()
						};
					})
				}
			};
		},

		/**
		 * Determines the type of the <code>oTable</code>.
		 * @param {sap.ui.comp.personalization.ChartWrapper | sap.ui.comp.personalization.SelectionWrapper | sap.m.Table | sap.ui.table.AnalyticalTable | sap.ui.table.TreeTable | sap.ui.table.Table} oTable
		 * @returns {sap.ui.comp.personalization.TableType | null}
		 */
		getTableType: function (oTable) {
			switch (oTable && oTable.getMetadata().getName()) {
				case "sap.ui.comp.personalization.ChartWrapper":
					return TableType.ChartWrapper;
				case "sap.ui.comp.personalization.SelectionWrapper":
					return TableType.SelectionWrapper;
				case "sap.m.Table":
					return TableType.ResponsiveTable;
				case "sap.ui.table.AnalyticalTable":
					return TableType.AnalyticalTable;
				case "sap.ui.table.TreeTable":
					return TableType.TreeTable;
				case "sap.ui.table.Table":
					return TableType.Table;
			}
			return null;
		},

		/**
		 * Determines the base type of the <code>oTable</code>.
		 * @param {sap.ui.comp.personalization.ChartWrapper | sap.ui.comp.personalization.SelectionWrapper | sap.m.Table | sap.ui.table.AnalyticalTable | sap.ui.table.TreeTable | sap.ui.table.Table} oTable
		 * @returns {sap.ui.comp.personalization.TableType | null}
		 */
		getTableBaseType: function (oTable) {
			switch (this.getTableType(oTable)) {
				case TableType.ChartWrapper:
					return TableType.ChartWrapper;
				case TableType.SelectionWrapper:
					return TableType.SelectionWrapper;
				case TableType.ResponsiveTable:
					return TableType.ResponsiveTable;
				case TableType.AnalyticalTable:
				case TableType.Table:
				case TableType.TreeTable:
					return TableType.Table;
			}
			return null;
		},

		/**
		 * Determines the base type of the <code>oColumn</code>.
		 * @param {sap.ui.comp.personalization.ColumnWrapper | sap.m.Column | sap.ui.table.AnalyticalColumn | sap.ui.table.Column} oColumn
		 * @returns {sap.ui.comp.personalization.ColumnType | null}
		 */
		getColumnBaseType: function (oColumn) {
			switch (oColumn && oColumn.getMetadata().getName()) {
				case "sap.ui.comp.personalization.ColumnWrapper":
					return ColumnType.ColumnWrapper;
				case "sap.m.Column":
					return ColumnType.ResponsiveColumn;
				case "sap.ui.table.AnalyticalColumn":
				case "sap.ui.table.Column":
					return ColumnType.TableColumn;
			}
			return null;
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @param {string} sProperty
		 * @param {boolean} bParse
		 * @returns {object | null} either value of custom data property or null
		 */
		_getCustomProperty: function (oColumn, sProperty) {
			var oCustomData = this._getCustomData(oColumn);
			if (!oCustomData || !sProperty) {
				return null;
			}
			return oCustomData[sProperty];
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @returns {object | null} either custom data object or null
		 */
		_getCustomData: function (oColumn) {
			if (!oColumn) {
				return null;
			}
			var oCustomData = oColumn.data("p13nData");
			if (typeof oCustomData === "string") {
				try {
					oCustomData = JSON.parse(oCustomData);
					oColumn.data("p13nData", oCustomData);
				} catch (oException) {
					// do not update the custom data, go ahead
				}
			}
			return oCustomData;
		},

		/**
		 * Determines <code>columnKeys</code> of a specific type.
		 *
		 * @param {string} sType
		 * @param {object} oColumnKey2ColumnMap
		 * @returns {array} Array of strings representing the <code>columnKeys</code>
		 */
		getColumnKeysOfType: function (sType, oColumnKey2ColumnMap) {
			var aColumnKeys = [];
			for (var sColumnKey in oColumnKey2ColumnMap) {
				if (this.getColumnType(oColumnKey2ColumnMap[sColumnKey]) === sType) {
					aColumnKeys.push(sColumnKey);
				}
			}
			return aColumnKeys;
		},

		getColumnKeysOfFiscalTypeFields: function (oColumnKey2ColumnMap) {
			return Object.values(oColumnKey2ColumnMap).reduce((acc, oColumn) => {
				var oCustomData = this._getCustomData(oColumn);

				if (oCustomData?.typeInstance?.sFiscalType) {
					return acc.concat(oCustomData.columnKey);
				}
				return acc;
			}, []);
		},

		/**
		 * The filter values are converted from strings to date for date, time and datetime fields
		 *
		 * @param {object} oPersonalizationData
		 * @param {object} oColumnKey2ColumnMap
		 * @returns {object} converted personalization data
		 */
		convertFilters: function (oPersonalizationData, oColumnKey2ColumnMap) {
			if (oPersonalizationData && oPersonalizationData.filter && oPersonalizationData.filter.filterItems) {
				var aColumnKeysOfTypeDate = this.getColumnKeysOfType("date", oColumnKey2ColumnMap);
				var aColumnKeysOfTypeTime = this.getColumnKeysOfType("time", oColumnKey2ColumnMap);
				var aColumnKeysOfTypeDateTime = this.getColumnKeysOfType("datetime", oColumnKey2ColumnMap);
				oPersonalizationData.filter.filterItems.forEach(function (oFilterItem) {
					var oColumn = oColumnKey2ColumnMap && oColumnKey2ColumnMap[oFilterItem.columnKey];
					if (aColumnKeysOfTypeDate.indexOf(oFilterItem.columnKey) > -1 || aColumnKeysOfTypeTime.indexOf(oFilterItem.columnKey) > -1
						|| aColumnKeysOfTypeDateTime.indexOf(oFilterItem.columnKey) > -1) {
						// Fiscal dates are considered date fields, but we should not convert their values to date objects
						if (oColumn && oColumn.data("p13nData") && oColumn.data("p13nData").edmType === "Edm.String") {
							return;
						}
						if (oFilterItem.value1 && typeof (oFilterItem.value1) === "string") {
							oFilterItem.value1 = UI5Date.getInstance(oFilterItem.value1);
						}
						if (oFilterItem.value2 && typeof (oFilterItem.value2) === "string") {
							oFilterItem.value2 = UI5Date.getInstance(oFilterItem.value2);
						}
					}
				});
			}
		},

		/**
		 * The selectOptions values (low and high of each range) are converted from strings to date for date, time and datetime fields
		 *
		 * @param {object} oRuntimeDataSuiteFormat
		 * @param {object} oColumnKey2ColumnMap
		 * @returns {object} converted DataSuiteFormat data
		 */
		convertSelectOptions: function (oRuntimeDataSuiteFormat, oColumnKey2ColumnMap) {
			if (oRuntimeDataSuiteFormat && oRuntimeDataSuiteFormat.SelectOptions) {
				var aColumnKeysOfTypeDate = this.getColumnKeysOfType("date", oColumnKey2ColumnMap);
				var aColumnKeysOfTypeTime = this.getColumnKeysOfType("time", oColumnKey2ColumnMap);
				var aColumnKeysOfTypeDateTime = this.getColumnKeysOfType("datetime", oColumnKey2ColumnMap);
				var aColumnKeysOfTypeFiscal = this.getColumnKeysOfFiscalTypeFields(oColumnKey2ColumnMap);

				aColumnKeysOfTypeDate = aColumnKeysOfTypeDate.filter(function (sDateColumnKey) {
					return aColumnKeysOfTypeFiscal.indexOf(sDateColumnKey) === -1;
				});

				oRuntimeDataSuiteFormat.SelectOptions.forEach(function (oSelectOption) {
					oSelectOption.Ranges.forEach(function (oRange) {
						if (aColumnKeysOfTypeDate.indexOf(oSelectOption.PropertyName) > -1 || aColumnKeysOfTypeTime.indexOf(oSelectOption.PropertyName) > -1
							|| aColumnKeysOfTypeDateTime.indexOf(oSelectOption.PropertyName) > -1) {
							if (oRange.Low && typeof (oRange.Low) === "string") {
								oRange.Low = UI5Date.getInstance(oRange.Low);
							}
							if (oRange.High && typeof (oRange.High) === "string") {
								oRange.High = UI5Date.getInstance(oRange.High);
							}
						}
					});
				});
			}
		}

	};


	return Util;
}, /* bExport= */true);
