/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides SortController
sap.ui.define([
	'./BaseController',
	'sap/m/library',
	'sap/ui/comp/library',
	'./Util',
	'sap/base/util/merge'

], function(
	BaseController,
	MLibrary,
	CompLibrary,
	Util,
	merge
) {
	"use strict";

	/**
	 * The SortController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP
	 * @version 1.25.0-SNAPSHOT
	 * @private
	 * @alias sap.ui.comp.personalization.SortController
	 */
	var SortController = BaseController.extend("sap.ui.comp.personalization.SortController", /** @lends sap.ui.comp.personalization.SortController.prototype */
	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(MLibrary.P13nPanelType.sort);
			this.setItemType(MLibrary.P13nPanelType.sort + "Items");
		},
		metadata: {
			events: {
				afterSortModelDataChange: {}
			}
		}
	});

	SortController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (this.getTableType() === CompLibrary.personalization.TableType.ResponsiveTable) {
			oTable.detachEvent("_sort", this._onSort, this);
			oTable.attachEvent("_sort", this._onSort, this);
		} else if (oTable && oTable.detachSort && oTable.detachSort) {
			oTable.detachSort(this._onSort, this);
			oTable.attachSort(this._onSort, this);
		}
	};

	SortController.prototype.getColumn2Json = function(oColumn, sColumnKey, iIndex) {
		if (!Util.isSortable(oColumn)) {
			return null;
		}
		/** @deprecated As of version 1.120 */
		if (!oColumn.getSorted || (oColumn.getSorted && !oColumn.getSorted())) {
			return null;
		}
		if (!oColumn.getSortOrder || oColumn.getSortOrder() === "None") {
			return null;
		}
		return {
			columnKey: sColumnKey,
			operation: oColumn.getSortOrder()
		};
	};

	SortController.prototype.getColumn2JsonTransient = function(oColumn, sColumnKey, sText, sTooltip) {
		if (!Util.isSortable(oColumn)) {
			return null;
		}
		return {
			columnKey: sColumnKey,
			text: sText,
			//Only show tooltips in the 'Columns' tab in case the information is different compared to the label.
			//Note: the 'ControlProvider' is setting the fallback as label, hence the tooltip provided by the
			//metadata can not be used
			tooltip: sTooltip !== sText ? sTooltip : undefined
		// maxLength: "",
		// type: ""
		};
	};

	SortController.prototype.handleIgnore = function(oJson, iIndex) {
		oJson.sort.sortItems.splice(iIndex, 1);
	};

	SortController.prototype.syncJson2Table = function(oJson) {
		var oColumnKey2ColumnMap = this.getColumnMap();
		var oColumnKey2ColumnMapUnsorted = merge({}, oColumnKey2ColumnMap);

		this.fireBeforePotentialTableChange();

		if (this.getTableType() === CompLibrary.personalization.TableType.AnalyticalTable || this.getTableType() === CompLibrary.personalization.TableType.Table || this.getTableType() === CompLibrary.personalization.TableType.TreeTable) {
			oJson.sort.sortItems.forEach(function(oMSortItem) {
				var oColumn = oColumnKey2ColumnMap[oMSortItem.columnKey];
				if (!oColumn) {
					return;
				}
				if (oMSortItem.operation === undefined) {
					return;
				}
				/** @deprecated As of version 1.120 */
				if (!oColumn.getSorted()) {
					oColumn.setSorted(true);
				}
				if (oColumn.getSortOrder() !== oMSortItem.operation) {
					oColumn.setSortOrder(oMSortItem.operation);
				}
				delete oColumnKey2ColumnMapUnsorted[oMSortItem.columnKey];
			});

			for ( var sColumnKey in oColumnKey2ColumnMapUnsorted) {
				var oColumn = oColumnKey2ColumnMapUnsorted[sColumnKey];
				/** @deprecated As of version 1.120 */
				if (oColumn && oColumn.getSorted()) {
					oColumn.setSorted(false);
				}
				if (oColumn && oColumn.getSortOrder() !== "None") {
					oColumn.setSortOrder("None");
				}
			}
		}

		this.fireAfterPotentialTableChange();
	};

	SortController.prototype.getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJson = this.createControlDataStructure();

		if (!oDataSuiteFormat.SortOrder || !oDataSuiteFormat.SortOrder.length) {
			return oJson;
		}

		// var aIgnoreColumnKeys = this.getIgnoreColumnKeys();
		oJson.sort.sortItems = oDataSuiteFormat.SortOrder.
		// filter(function(oSortOrder) {
		// 	return aIgnoreColumnKeys.indexOf(oSortOrder.Property) < 0;
		// }).
		map(function(oSortOrder) {
			return {
				columnKey: oSortOrder.Property,
				operation: oSortOrder.Descending ? "Descending" : "Ascending"
			};
		});
		return oJson;
	};

	/**
	 * Creates property <code>SortOrder</code> in <code>oDataSuiteFormat</code> object if at least one sort item exists. The <code>SortOrder</code> contains the current PersistentData snapshot.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	SortController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oControlDataTotal = this.getUnionData(this.getControlDataInitial(), this.getControlData());
		if (!oControlDataTotal.sort || !oControlDataTotal.sort.sortItems || !oControlDataTotal.sort.sortItems.length) {
			return;
		}
		oDataSuiteFormat.SortOrder = oControlDataTotal.sort.sortItems.map(function(oSortItem) {
			return {
				Property: oSortItem.columnKey,
				Descending: oSortItem.operation === "Descending"
			};
		});
	};

	SortController.prototype._onSort = function(oEvent) {
		oEvent.preventDefault();

		// this.fireBeforePotentialTableChange();

		this._updateInternalModel(Util.getColumnKey(oEvent.getParameter("column")), oEvent.getParameter("sortOrder"), oEvent.getParameter("columnAdded"));
		this.syncJson2Table(this.getControlData());

		// this.fireAfterPotentialTableChange();
		this.fireAfterSortModelDataChange();
	};

	SortController.prototype._updateInternalModel = function(sColumnKey, sOperation, bAddNewSort) {
		if (!sColumnKey || (sOperation !== "Descending" && sOperation !== "Ascending" && sOperation !== "None")) {
			return;
		}

		// 1. Prepare 'controlData'
		if (!bAddNewSort) {
			this.getInternalModel().setProperty("/controlData/sort/sortItems", []);
		}
		var oControlData = this.getControlData();

		if (sOperation != "None") {
			// 2. update / insert sortItem in 'controlData'
			var iIndex = Util.getIndexByKey("columnKey", sColumnKey, oControlData.sort.sortItems);
			iIndex = (iIndex > -1) ? iIndex : oControlData.sort.sortItems.length;
			this.getInternalModel().setProperty("/controlData/sort/sortItems/" + iIndex + "/", {
				columnKey: sColumnKey,
				operation: sOperation
			});
		}

		// 3. update 'controlDataBase'
		this.updateControlDataBaseFromJson(oControlData);
	};

	/**
	 * If there are sortable columns currently
	 * @private
	 * @returns {boolean} presence of sortable columns
	 */
	SortController.prototype._hasSortableColumns = function() {
		return Util.hasSortableColumns(this.getColumnMap());
	};

	// SortController.prototype.getPanel = function() {
	// 	// Note: in the time where controller gets the panel all table columns are present (also missing columns).
	// 	// Note: in case that all sortable columns are excluded we nevertheless have to create the panel for the case that some sortable columns will be included.
	// 	if (!this._hasSortableColumns()) {
	// 		return null;
	// 	}

	// 	return new Promise(function(resolve) {
	// 		// Dynamically load panel once it is needed
	// 		sap.ui.require([
	// 			'sap/m/P13nSortPanel', 'sap/m/P13nItem', 'sap/m/P13nSortItem'
	// 		], function(P13nSortPanel, P13nItem, P13nSortItem) {
	// 			return resolve(new P13nSortPanel({
	// 				containerQuery: true,
	// 				items: {
	// 					path: "$sapmP13nPanel>/transientData/sort/sortItems",
	// 					template: new P13nItem({
	// 						columnKey: "{$sapmP13nPanel>columnKey}",
	// 						text: "{$sapmP13nPanel>text}",
	// 						tooltip: "{$sapmP13nPanel>tooltip}"
	// 					})
	// 				},
	// 				sortItems: {
	// 					path: "$sapmP13nPanel>/controlDataReduce/sort/sortItems",
	// 					template: new P13nSortItem({
	// 						columnKey: "{$sapmP13nPanel>columnKey}",
	// 						operation: "{$sapmP13nPanel>operation}"
	// 					})
	// 				},
	// 				beforeNavigationTo: this.setModelFunction(),
	// 				updateSortItem: function() {
	// 					this.fireAfterPotentialModelChange({
	// 						json: this.getControlDataReduce()
	// 					});
	// 				}.bind(this),
	// 				addSortItem: function(oEvent) {
	// 					if (!oEvent.getParameter("sortItemData")) {
	// 						return;
	// 					}
	// 					var iIndex = oEvent.getParameter("index");
	// 					var oSortItemData = oEvent.getParameter("sortItemData");
	// 					var oSortItem = {
	// 						columnKey: oSortItemData.getColumnKey(),
	// 						operation: oSortItemData.getOperation()
	// 					};
	// 					var oControlDataReduce = this.getControlDataReduce();

	// 					if (iIndex > -1) {
	// 						oControlDataReduce.sort.sortItems.splice(iIndex, 0, oSortItem);
	// 					} else {
	// 						oControlDataReduce.sort.sortItems.push(oSortItem);
	// 					}
	// 					this.setControlDataReduce2Model(oControlDataReduce);
	// 					this.fireAfterPotentialModelChange({
	// 						json: oControlDataReduce
	// 					});
	// 				}.bind(this),
	// 				removeSortItem: function(oEvent) {
	// 					var iIndex = oEvent.getParameter("index");
	// 					if (iIndex < 0) {
	// 						return;
	// 					}
	// 					var oControlDataReduce = this.getControlDataReduce();
	// 					oControlDataReduce.sort.sortItems.splice(iIndex, 1);
	// 					this.setControlDataReduce2Model(oControlDataReduce);
	// 					this.fireAfterPotentialModelChange({
	// 						json: oControlDataReduce
	// 					});
	// 				}.bind(this)
	// 			}));
	// 		}.bind(this));
	// 	}.bind(this));
	// };


	SortController.prototype.retrieveAdaptationUI = function(oPayload) {
		// Note: in the time where controller gets the panel all table columns are present (also missing columns).
		// Note: in case that all sortable columns are excluded we nevertheless have to create the panel for the case that some sortable columns will be included.
		if (!Util.hasSortableColumns(this.getColumnMap())) {
			return null;
		}

		return new Promise(function(resolve){
			sap.ui.require([
				'sap/m/p13n/SortPanel'
			], function(SortPanel) {

				var aSortItems = this.getAdaptationData();
				var oSortPanel = new SortPanel();
				oSortPanel.setP13nData(aSortItems);

				this.oPanel = oSortPanel;
				oSortPanel.attachChange(function(oEvt){

					var aSorters = oSortPanel.getP13nData(true);

					var oNew = this.getControlDataReduce();
					oNew.sort.sortItems = aSorters.map(function(o){
						return {
							columnKey: o.name,
							operation: o.descending ? "Descending" : "Ascending"
						};
					});
					this.setControlDataReduce2Model(oNew);
					this.fireAfterPotentialModelChange({
						json: oNew
					});
				}.bind(this));

				resolve(oSortPanel);
			}.bind(this));
		}.bind(this));
	};

	SortController.prototype._transformAdaptationData = function(oReduce, oTransient) {
		var oAdaptationItem = BaseController.prototype._transformAdaptationData.apply(this, arguments);
		oAdaptationItem.sorted = !!oReduce;
		oAdaptationItem.descending = oReduce ? oReduce.operation === "Descending" : false;
		return oAdaptationItem;
	};

	SortController.prototype._sortAdaptationData = function(aItems) {
		this._getP13nBuilder().sortP13nData({
			visible: "sorted",
			position: "position"
		}, aItems);
	};

	SortController.prototype._getPresenceAttribute = function() {
		return "sorted";
	};

	/**
	 * Operations on sorting are processed sometime directly at the table and sometime not. In case that something has been changed via
	 * Personalization Dialog the consumer of the Personalization Dialog has to apply sorting at the table. In case that sorting has been changed via
	 * user interaction at table, the change is instantly applied at the table.
	 *
	 * @returns {sap.ui.comp.personalization.ChangeType}
	 */
	SortController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataCompare || !oPersistentDataCompare.sort || !oPersistentDataCompare.sort.sortItems) {
			return CompLibrary.personalization.ChangeType.Unchanged;
		}
		var bIsDirty = JSON.stringify(oPersistentDataBase.sort.sortItems) !== JSON.stringify(oPersistentDataCompare.sort.sortItems);

		return bIsDirty ? CompLibrary.personalization.ChangeType.ModelChanged : CompLibrary.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = oPersistentDataBase - oPersistentDataCompare
	 *
	 * @param oPersistentDataBase
	 * @param {object} oPersistentDataCompare JSON object. Note: if sortItems is [] then it means that all sortItems have been deleted
	 * @returns {object} JSON object or empty object
	 */
	SortController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {
		var oPersistentDataBaseSortItems = oPersistentDataBase?.sort?.sortItems,
			oPersistentDataCompareSortItems = oPersistentDataCompare?.sort?.sortItems,
			bSortDataNotEmpty = oPersistentDataBaseSortItems?.length > 0 && oPersistentDataCompareSortItems?.length > 0;

		if (!oPersistentDataBase || !oPersistentDataBase.sort || !oPersistentDataBaseSortItems) {
			return {
				sort: {
					sortItems: []
				}
			};
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.sort || !oPersistentDataCompare.sort.sortItems) {
			return {
				sort: Util.copy(oPersistentDataBase.sort)
			};
		}

		if (JSON.stringify(oPersistentDataBaseSortItems) !== JSON.stringify(oPersistentDataCompare.sort.sortItems)) {
			return {
				sort: Util.copy(oPersistentDataBase.sort)
			};
		}

		if (bSortDataNotEmpty) {
			if (JSON.stringify(oPersistentDataBaseSortItems) === JSON.stringify(oPersistentDataCompareSortItems) && JSON.stringify(oPersistentDataCompareSortItems) === JSON.stringify(this.getControlDataInitial().sort.sortItems)) {
				return {
					sort: Util.copy(oPersistentDataBase.sort)
				};
			}
		}

		return null;
	};

	/**
	 * @param {object} oJsonBase - JSON object to which different properties from JSON oJson are added
	 * @param {object} oJson - JSON object from where the different properties are added to oJsonBase. Note: if sortItems is []
	 *        then it means that all sortItems have been deleted
	 * @returns {object} new JSON object as union result of oJsonBase and oJson
	 */
	SortController.prototype.getUnionData = function(oJsonBase, oJson) {
		if (!oJson || !oJson.sort || !oJson.sort.sortItems) {
			return {
				sort: Util.copy(oJsonBase.sort)
			};
		}

		return {
			sort: Util.copy(oJson.sort)
		};
	};

	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	SortController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);
		var oTable = this.getTable();
		if (oTable && oTable.detachSort) {
			oTable.detachSort(this._onSort, this);
		}
	};

	return SortController;

});
