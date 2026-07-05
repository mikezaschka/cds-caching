/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * @namespace Provides validator functions for the personalization dialog
 * @name sap.ui.comp.personalization.Validator
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.48.0
 */
sap.ui.define([
	'sap/ui/comp/library',
	'sap/m/library',
	"sap/ui/core/Lib",
	'sap/ui/core/message/MessageType'
], function(library, MLibrary, Library, MessageType) {
	"use strict";

	// shortcut for sap.m.P13nPanelType
	var P13nPanelType = MLibrary.P13nPanelType;

	// shortcut for sap.ui.comp.personalization.TableType
	var TableType = library.personalization.TableType;

	var Validator = {

		/**
		 * Also if in case of the AnalyticalTable the inResult=true we have to show warning if the column is not visible.
		 */
		checkGroupAndColumns: function(sTableType, oSetting, oColumnKey2ColumnMap, oPersistentDataTotal, aResult) {
			if (sTableType !== TableType.AnalyticalTable || !oSetting.group || !oSetting.columns) {
				return Promise.resolve(aResult);
			}
			for ( var sColumnKey in oColumnKey2ColumnMap) {
				var bColumnSelected = oSetting.columns.controller.isColumnSelected(oPersistentDataTotal.columns, sColumnKey);
				var bGroupSelected = oSetting.group.controller.isGroupSelected(oPersistentDataTotal.group, sColumnKey);
				if (bGroupSelected && !bColumnSelected) {
					aResult.push({
						columnKey: sColumnKey,
						panelTypes: [
							P13nPanelType.group, P13nPanelType.columns
						],
						messageType: MessageType.Warning,
						messageText: Library.getResourceBundleFor("sap.ui.comp").getText("PERSODIALOG_MSG_GROUPING_NOT_POSSIBLE_DESCRIPTION")
					});
				}
			}
			return Promise.resolve(aResult);
		},

		checkSaveChanges: function(sTableType, oSetting, oPersistentDeltaData, aResult) {
			if (sTableType !== TableType.SelectionWrapper) {
				return Promise.resolve(aResult);
			}

			return oSetting.selection.payload.callbackSaveChanges(oPersistentDeltaData).then(function(bSaved) {
				if (bSaved) {
					return aResult;
				}
				aResult.push({
					panelTypes: [
						P13nPanelType.selection
					],
					messageType: MessageType.Error,
					messageText: Library.getResourceBundleFor("sap.ui.comp").getText("PERSODIALOG_MSG_CHANGES_SAVE_FAILED")
				});
				return aResult;
			});
		},

		checkChartConsistency: function(sTableType, oSetting, oControlDataReduce, aResult) {
			if (sTableType !== TableType.ChartWrapper) {
				return Promise.resolve(aResult);
			}

			return oSetting.dimeasure.controller.isChartConsistent(oControlDataReduce).then(function(bIsConsistent){
				if (!bIsConsistent) {
					aResult.push({
						panelTypes: [
							P13nPanelType.dimeasure
						],
						messageType: MessageType.Error,
						messageText: Library.getResourceBundleFor("sap.ui.comp").getText("PERSODIALOG_MSG_VALIDATION_CHARTTYPE")
					});
				}
				return aResult;
			});
		},

		checkVisibleItemsThreshold: function(sTableType, oSetting, oControlDataReduce, aResult) {
			if (!oSetting.columns) {
				return Promise.resolve(aResult);
			}

			var iThreshold = -1;

			if (oSetting.columns.payload && oSetting.columns.payload.visibleItemsThreshold) {
				iThreshold = oSetting.columns.payload.visibleItemsThreshold;
			}

			var iVisibleColumns = oControlDataReduce.columns.columnsItems.filter(function(oColumnItem){
				return oColumnItem.visible;
			}).length;

			if (iThreshold > -1 && iVisibleColumns > iThreshold) {
				aResult.push({
					panelTypes: [
						P13nPanelType.columns
					],
					messageType: MessageType.Warning,
					messageText: Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_P13N_VISIBLE_ITEMS_THRESHOLD_MESSAGE")
				});
			}

			return Promise.resolve(aResult);
		}
	};
	return Validator;
}, /* bExport= */true);
