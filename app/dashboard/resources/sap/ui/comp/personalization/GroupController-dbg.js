/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides GroupController
sap.ui.define([
	'./BaseController',
	'sap/m/library',
	'sap/ui/comp/library',
	'./Util',
	'sap/m/P13nConditionPanel',
	"sap/ui/core/Element"
], function(BaseController, MLibrary, CompLibrary, Util, P13nConditionPanel /*Needed for Enum sap.m.P13nConditionOperation */, Element) {
	"use strict";

	// shortcut for sap.m.P13nConditionOperation TODO: use enum in library.js or official API
	var P13nConditionOperation = MLibrary.P13nConditionOperation;

	/**
	 * The GroupController can be used to handle the grouping of the Analytical and sap.m.Table. The grouping of the sap.ui.table.Table is not
	 * supported and the existing coding is only for testing and finding the restrictions integrated.
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP
	 * @version 1.25.0-SNAPSHOT
	 * @private
	 * @alias sap.ui.comp.personalization.GroupController
	 */
	var GroupController = BaseController.extend("sap.ui.comp.personalization.GroupController", /** @lends sap.ui.comp.personalization.GroupController.prototype */
	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(MLibrary.P13nPanelType.group);
			this.setItemType(MLibrary.P13nPanelType.group + "Items");
		},
		metadata: {
			events: {
				afterGroupModelDataChange: {}
			}
		}
	});

	GroupController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (this.getTableType() === CompLibrary.personalization.TableType.ResponsiveTable) {
			oTable.detachEvent("_group", this._onGroup, this);
			oTable.attachEvent("_group", this._onGroup, this);
		} else if (oTable && oTable.detachGroup && oTable.attachGroup) {
			oTable.detachGroup(this._onGroup, this);
			oTable.attachGroup(this._onGroup, this);
		}
	};

	GroupController.prototype.getColumn2Json = function(oColumn, sColumnKey, iIndex) {
		if (this.getTableType() !== CompLibrary.personalization.TableType.AnalyticalTable) {
			return null;
		}
		// Collect first grouped columns
		if (!oColumn.getGrouped()) {
			return null;
		}
		return {
			columnKey: sColumnKey,
			isGrouped: oColumn.getGrouped(),
			operation: oColumn.getSortOrder && oColumn.getSortOrder() !== "Descending" ? P13nConditionOperation.GroupAscending : P13nConditionOperation.GroupDescending,
			showIfGrouped: oColumn.getShowIfGrouped ? oColumn.getShowIfGrouped() : false
		};
	};
	GroupController.prototype.getAdditionalData2Json = function(oJson, oTable) {
		if (this.getTableType() !== CompLibrary.personalization.TableType.AnalyticalTable) {
			return;
		}
		if (!oJson.group.groupItems.length) {
			return;
		}
		// Move collected grouped columns respectively there orders
		oTable.getGroupedColumns().forEach(function(oColumn, iIndexNew) {
			if (typeof oColumn === "string") {
				oColumn = Element.getElementById(oColumn);
			}
			var iIndexOld = Util.getIndexByKey("columnKey", Util.getColumnKey(oColumn), oJson.group.groupItems);
			if (iIndexOld > -1 && iIndexNew === iIndexOld) {
				return;
			}
			var oItem = oJson.group.groupItems.splice(iIndexOld, 1);
			oJson.group.groupItems.splice(iIndexNew, 0, oItem);
		});
	};
	GroupController.prototype.getColumn2JsonTransient = function(oColumn, sColumnKey, sText, sTooltip) {
		if (!Util.isGroupable(oColumn)) {
			return null;
		}
		return {
			columnKey: sColumnKey,
			text: sText,
			//Only show tooltips in the 'Columns' tab in case the information is different compared to the label.
			//Note: the 'ControlProvider' is setting the fallback as label, hence the tooltip provided by the
			//metadata can not be used
			tooltip: sTooltip !== sText ? sTooltip : undefined
		};
	};

	GroupController.prototype.handleIgnore = function(oJson, iIndex) {
		oJson.sort.sortItems.splice(iIndex, 1);
	};

	GroupController.prototype.syncJson2Table = function(oJson) {
		var oColumnKey2ColumnMap = this.getColumnMap();
		var oTable = this.getTable();
		var oColumn;

		this.fireBeforePotentialTableChange();

		if (this.getTableType() === CompLibrary.personalization.TableType.TreeTable) {
			return;

		} else if (this.getTableType() === CompLibrary.personalization.TableType.AnalyticalTable) {
			var bIsSetFromGroupController = true;

			// we have to set all columns first to unGrouped
			for ( var sColumnKey in oColumnKey2ColumnMap) {
				oColumn = oColumnKey2ColumnMap[sColumnKey];
				if (!oColumn) {
					return;
				}
				if (oColumn.getGrouped()) {
					oColumn.setGrouped(false, bIsSetFromGroupController);
					oColumn.setShowIfGrouped(false);
				}
			}

			oJson.group.groupItems.forEach(function(oMGroupItem) {
				oColumn = oColumnKey2ColumnMap[oMGroupItem.columnKey];
				if (!oColumn) {
					return;
				}
				oColumn.setGrouped(true, bIsSetFromGroupController);
				oColumn.setShowIfGrouped(oMGroupItem.showIfGrouped);
			});

		} else if (this.getTableType() === CompLibrary.personalization.TableType.Table || this.getTableType() === CompLibrary.personalization.TableType.AnalyticalTable || this.getTableType() === CompLibrary.personalization.TableType.TreeTable) {
			// TODO clean up
			if (!oTable.getGroupBy) {
				return;
			}

			if (oJson.group.groupItems.length > 0) {
				oJson.group.groupItems.some(function(oMGroupItem) {
					oColumn = oColumnKey2ColumnMap[oMGroupItem.columnKey];
					if (oColumn) {
						oTable.setGroupBy && oTable.setGroupBy(oColumn);
						return true;
					}
				});
			} else {
				// TODO removing the grouping does not work. we need a correction on the ui.table cf. commit Ifda0dbbfd22a586415f53aa99cbe6663577fe847
				oTable.setGroupBy && oTable.setGroupBy(null);
			}
		}

		this.fireAfterPotentialTableChange();
	};

	/**
	 * Note: the DataSuiteFormate does not support group sort order and 'showIfGrouped'.
	 * @param oDataSuiteFormat
	 * @returns {Object}
	 */
	GroupController.prototype.getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJson = this.createControlDataStructure();

		if (!oDataSuiteFormat.GroupBy || !oDataSuiteFormat.GroupBy.length) {
			return oJson;
		}
		oJson.group.groupItems = oDataSuiteFormat.GroupBy.map(function(sGroupBy) {
			return {
				columnKey: sGroupBy,
				operation: P13nConditionOperation.GroupAscending,
				showIfGrouped: false
			};
		});
		return oJson;
	};
	/**
	 * Creates property <code>GroupBy</code> in <code>oDataSuiteFormat</code> object if at least one group item exists. The <code>GroupBy</code> contains the current PersistentData snapshot.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	GroupController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oControlDataTotal = this.getUnionData(this.getControlDataInitial(), this.getControlData());
		if (!oControlDataTotal.group || !oControlDataTotal.group.groupItems || !oControlDataTotal.group.groupItems.length) {
			return;
		}
		oDataSuiteFormat.GroupBy = oControlDataTotal.group.groupItems.map(function(oMGroupItem) {
			return oMGroupItem.columnKey;
		});
	};

	GroupController.prototype._onGroup = function(oEvent) {
		this.fireBeforePotentialTableChange();

		this._updateInternalModel(oEvent.getParameter("groupedColumns"));

		this.fireAfterPotentialTableChange();
		this.fireAfterGroupModelDataChange();
	};

	GroupController.prototype._setGroup = function(bGrouped, oColumn) {
		this.fireBeforePotentialTableChange();

		if (bGrouped) {
			this._updateInternalModel([oColumn]);
		  } else {
			this._updateInternalModel([]);
		  }

		this.fireAfterPotentialTableChange();
		this.fireAfterGroupModelDataChange();
	};

	GroupController.prototype._updateInternalModel = function(aGroupedColumns) {

		// 1. Prepare 'controlData'
		this.getInternalModel().setProperty("/controlData/group/groupItems", []);

		// 2. update / insert groupItem in 'controlData'
		var oControlData = this.getControlData();
		aGroupedColumns.forEach(function(oColumn) {
			if (typeof oColumn === "string") {
				oColumn = Element.getElementById(oColumn);
			}
			var sColumnKey = Util.getColumnKey(oColumn);
			var iIndex = Util.getIndexByKey("columnKey", sColumnKey, oControlData.group.groupItems);
			iIndex = (iIndex > -1) ? iIndex : oControlData.group.groupItems.length;
			this.getInternalModel().setProperty("/controlData/group/groupItems/" + iIndex + "/", {
				columnKey: sColumnKey,
				showIfGrouped: oColumn.getShowIfGrouped ? oColumn.getShowIfGrouped() : false
			});
		}, this);

		// 3. update 'controlDataBase'
		this.updateControlDataBaseFromJson(oControlData);
	};

	// GroupController.prototype.getPanel = function() {
	// 	// Note: in the time where controller gets the panel all table columns are present (also missing columns).
	// 	// Note: in case that all groupable columns are excluded we nevertheless have to create the panel for the case that some groupable columns will be included.
	// 	if (!Util.hasGroupableColumns(this.getColumnMap())) {
	// 		return null;
	// 	}

	// 	return new Promise(function(resolve) {
	// 		// Dynamically load panel once it is needed
	// 		sap.ui.require([
	// 			'sap/m/P13nGroupPanel', 'sap/m/P13nItem', 'sap/m/P13nGroupItem'
	// 		], function(P13nGroupPanel, P13nItem, P13nGroupItem) {
	// 			return resolve(new P13nGroupPanel({
	// 				maxGroups: this.getTableType() === CompLibrary.personalization.TableType.AnalyticalTable ? "-1" : "1",
	// 				containerQuery: true,
	// 				items: {
	// 					path: "$sapmP13nPanel>/transientData/group/groupItems",
	// 					template: new P13nItem({
	// 						columnKey: "{$sapmP13nPanel>columnKey}",
	// 						text: "{$sapmP13nPanel>text}",
	// 						tooltip: "{$sapmP13nPanel>tooltip}"
	// 					})
	// 				},
	// 				groupItems: {
	// 					path: "$sapmP13nPanel>/controlDataReduce/group/groupItems",
	// 					template: new P13nGroupItem({
	// 						columnKey: "{$sapmP13nPanel>columnKey}",
	// 						operation: "{$sapmP13nPanel>operation}",
	// 						showIfGrouped: "{$sapmP13nPanel>showIfGrouped}"
	// 					})
	// 				},
	// 				beforeNavigationTo: this.setModelFunction(),
	// 				updateGroupItem:function () {
	// 					this.fireAfterPotentialModelChange({
	// 						json: this.getControlDataReduce()
	// 					});
	// 				}.bind(this),
	// 				addGroupItem: function(oEvent) {
	// 					if (!oEvent.getParameter("groupItemData")) {
	// 						return;
	// 					}
	// 					var iIndex = oEvent.getParameter("index");
	// 					var oGroupItemData = oEvent.getParameter("groupItemData");
	// 					var oGroupItem = {
	// 						columnKey: oGroupItemData.getColumnKey(),
	// 						operation: oGroupItemData.getOperation(),
	// 						showIfGrouped: oGroupItemData.getShowIfGrouped()
	// 					};
	// 					var oControlDataReduce = this.getControlDataReduce();
	// 					if (iIndex > -1) {
	// 						oControlDataReduce.group.groupItems.splice(iIndex, 0, oGroupItem);
	// 					} else {
	// 						oControlDataReduce.group.groupItems.push(oGroupItem);
	// 					}
	// 					this.setControlDataReduce2Model(oControlDataReduce);
	// 					this.fireAfterPotentialModelChange({
	// 						json: oControlDataReduce
	// 					});
	// 				}.bind(this),
	// 				removeGroupItem: function(oEvent) {
	// 					var iIndex = oEvent.getParameter("index");
	// 					if (iIndex < 0) {
	// 						return;
	// 					}
	// 					var oControlDataReduce = this.getControlDataReduce();
	// 					oControlDataReduce.group.groupItems.splice(iIndex, 1);
	// 					this.setControlDataReduce2Model(oControlDataReduce);
	// 					this.fireAfterPotentialModelChange({
	// 						json: oControlDataReduce
	// 					});
	// 				}.bind(this)
	// 			}));
	// 		}.bind(this));
	// 	}.bind(this));
	// };

	GroupController.prototype.retrieveAdaptationUI = function(oPayload) {

		// Note: in the time where controller gets the panel all table columns are present (also missing columns).
		// Note: in case that all groupable columns are excluded we nevertheless have to create the panel for the case that some groupable columns will be included.
		if (!Util.hasGroupableColumns(this.getColumnMap())) {
			return null;
		}

		return new Promise(function(resolve){
			sap.ui.require([
				'sap/m/p13n/GroupPanel'
			], function(GroupPanel) {

				var aGroupItems = this.getAdaptationData();

				var bIsAnalyticalTable = this.getTableType() === CompLibrary.personalization.TableType.AnalyticalTable;

				var oGroupPanel = new GroupPanel({
					queryLimit: bIsAnalyticalTable ? undefined : 1, //Unlimited groups only for AT
					enableShowField: bIsAnalyticalTable // 'Show Field as Column' only for AT
				});

				this.oPanel = oGroupPanel;
				oGroupPanel.setP13nData(aGroupItems);

				oGroupPanel.attachChange(function(oEvt){

					var oItem = oItem = oEvt.getParameter("item");

					var aGroups = oGroupPanel.getP13nData(true);

					var oNew = this.getControlDataReduce();
					oNew.group.groupItems = aGroups.map(function(o){
						return {
							isGrouped: true,
							columnKey: o.name,
							operation: o.descending ? "GroupDescending" : "GroupAscending",
							showIfGrouped: oItem.name === o.name ? oItem.showIfGrouped : o.showIfGrouped
						};
					});

					this.setControlDataReduce2Model(oNew);
					this.fireAfterPotentialModelChange({
						json: oNew
					});
				}.bind(this));

				resolve(oGroupPanel);
			}.bind(this));
		}.bind(this));
	};

	GroupController.prototype._transformAdaptationData = function(oReduce, oTransient) {
		var oAdaptationItem = BaseController.prototype._transformAdaptationData.apply(this, arguments);
		oAdaptationItem.grouped = !!oReduce;
		oAdaptationItem.showIfGrouped = oReduce ? oReduce.showIfGrouped : true;
		return oAdaptationItem;
	};

	GroupController.prototype._sortAdaptationData = function(aItems) {
		this._getP13nBuilder().sortP13nData({
			visible: "grouped",
			position: "position"
		}, aItems);
	};

	GroupController.prototype._getPresenceAttribute = function() {
		return "grouped";
	};

	/**
	 * Operations on group are processed every time directly at the table. In case that something has been changed via Personalization Dialog or via
	 * user interaction at table, the change is instantly applied at the table.
	 */
	GroupController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataCompare || !oPersistentDataCompare.group || !oPersistentDataCompare.group.groupItems) {
			return CompLibrary.personalization.ChangeType.Unchanged;
		}
		var bIsDirty = JSON.stringify(oPersistentDataBase.group.groupItems) !== JSON.stringify(oPersistentDataCompare.group.groupItems);

		return bIsDirty ? CompLibrary.personalization.ChangeType.ModelChanged : CompLibrary.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = CurrentModelData - oPersistentDataCompare
	 *
	 * @param oPersistentDataBase
	 * @param {object} oPersistentDataCompare JSON object
	 * @returns {object} JSON object or empty object
	 */
	GroupController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {

		if (!oPersistentDataBase || !oPersistentDataBase.group || !oPersistentDataBase.group.groupItems) {
			return this.createControlDataStructure();
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.group || !oPersistentDataCompare.group.groupItems) {
			return {
				group: Util.copy(oPersistentDataBase.group)
			};
		}

		if (JSON.stringify(oPersistentDataBase.group.groupItems) !== JSON.stringify(oPersistentDataCompare.group.groupItems)) {
			return {
				group: Util.copy(oPersistentDataBase.group)
			};
		}
		return null;
	};

	/**
	 * @param {object} oJsonBase - JSON object to which different properties from JSON oJson are added
	 * @param {object} oJson - JSON object from where the different properties are added to oJsonBase. Note: if groupItems
	 *        is [] then it means that all groupItems have been deleted
	 * @returns {object} new JSON object as union result of oJsonBase and oJson
	 */
	GroupController.prototype.getUnionData = function(oJsonBase, oJson) {
		if (!oJson || !oJson.group || !oJson.group.groupItems) {
			return {
				group: Util.copy(oJsonBase.group)
			};
		}

		return {
			group: Util.copy(oJson.group)
		};
	};

	/**
	 * Determines whether a grouping has been selected for specific column or not.
	 *
	 * @param {object} oControlDataReduce structure about the current selection coming from model
	 * @param {string} sColumnKey column key of specific column
	 * @returns {boolean} true if grouping for a specific column is selected, false if not
	 */
	GroupController.prototype.isGroupSelected = function(oControlDataReduce, sColumnKey) {
		var iIndex = -1;
		oControlDataReduce.groupItems.some(function(oMGroupItem, iIndex_) {
			if (oMGroupItem.columnKey === sColumnKey) {
				iIndex = iIndex_;
				return true;
			}
		});
		return iIndex > -1;
	};

	/**
	 * Cleans up before destruction.
	 */
	GroupController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);

		if (this.getTable() && this.getTable().detachGroup && (this.getTableType() === CompLibrary.personalization.TableType.AnalyticalTable || this.getTableType() === CompLibrary.personalization.TableType.Table || this.getTableType() === CompLibrary.personalization.TableType.TreeTable)) {
			this.getTable().detachGroup(this._onGroup, this);
		}
	};

	return GroupController;

});
