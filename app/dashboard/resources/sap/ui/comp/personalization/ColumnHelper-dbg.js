/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/base/DataType', 'sap/ui/base/ManagedObject', './Util', './ColumnWrapper', 'sap/base/util/isEmptyObject'
], function(DataType, ManagedObject, Util, ColumnWrapper, isEmptyObject) {
	"use strict";

	/**
	 * Constructor for a helper class.
	 *
	 * This module is only for internal use!
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Helper class
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.136.0
	 * @constructor
	 * @private
	 * @since 1.38.0
	 * @alias sap.ui.comp.personalization.ColumnHelper
	 */
	var ColumnHelper = ManagedObject.extend("sap.ui.comp.personalization.ColumnHelper", /** @lends sap.ui.comp.personalization.ColumnHelper.prototype */
	{
		constructor: function(sId, mSettings) {
			ManagedObject.apply(this, arguments);
		},
		metadata: {
			properties: {
				callbackOnSetVisible: {
					type: "object",
					defaultValue: null
				},
				callbackOnSetSummed: {
					type: "object",
					defaultValue: null
				},
				callbackOnSetGrouped: {
					type: "object",
					defaultValue: null
				}
			}
		}
	});

	ColumnHelper.prototype.init = function() {
		this._oColumnKey2ColumnMap = {};
		this._oColumnKeyIsMonkeyPatched = {};
	};
	ColumnHelper.prototype.exit = function() {
		this._oColumnKey2ColumnMap = null;
		this._oColumnKeyIsMonkeyPatched = null;
	};

	// ------------------- setter methods ---------------------------------------------
	ColumnHelper.prototype.addColumns = function(aColumns) {
		if (!aColumns) {
			return;
		}
		aColumns.forEach(function(oColumn) {
			this._addColumnToMap(Util.getColumnKey(oColumn), oColumn);
		}, this);
		this._checkConsistencyOfColumns(this._oColumnKey2ColumnMap);
	};
	ColumnHelper.prototype.addColumnMap = function(oColumnKey2ColumnMap) {
		if (!oColumnKey2ColumnMap) {
			return;
		}
		for ( var sColumnKey in oColumnKey2ColumnMap) {
			this._addColumnToMap(sColumnKey, oColumnKey2ColumnMap[sColumnKey]);
		}
		this._checkConsistencyOfColumns(this._oColumnKey2ColumnMap);
	};
	// ------------------- getter methods -------------------------------------------
	ColumnHelper.prototype.getColumnMap = function() {
		return this._oColumnKey2ColumnMap;
	};

	// ------------------- internal methods -------------------------------------------
	ColumnHelper.prototype._checkConsistencyOfColumns = function(oColumnKey2ColumnMap) {
		if (isEmptyObject(oColumnKey2ColumnMap)) {
			return;
		}
		var sColumnKeyOfFirstColumn = Object.keys(oColumnKey2ColumnMap)[0];
		var bHasColumnKeyFirst = !!Util._getCustomProperty(oColumnKey2ColumnMap[sColumnKeyOfFirstColumn], "columnKey");
		for ( var sColumnKey in oColumnKey2ColumnMap) {
			// Check that all columns should have a 'columnKey' or they should not have a 'columnKey'.
			if (bHasColumnKeyFirst !== !!Util._getCustomProperty(oColumnKey2ColumnMap[sColumnKey], "columnKey")) {
				throw "The table instance contains some columns for which a columnKey is provided, some for which a columnKey is not provided.";
			}
		}
	};
	ColumnHelper.prototype._addColumnToMap = function(sColumnKey, oColumn) {
		if (this._oColumnKey2ColumnMap[sColumnKey]) {
			throw "Duplicate 'columnKey': The column '" + oColumn.getId() + "' and column '" + this._oColumnKey2ColumnMap[sColumnKey] + "' have same 'columnKey' " + sColumnKey;
		}
		if (!this._oColumnKey2ColumnMap[sColumnKey]) {
			this._oColumnKey2ColumnMap[sColumnKey] = oColumn;
			this._monkeyPatchColumn(oColumn, sColumnKey);
		}
	};
	ColumnHelper.prototype._monkeyPatchColumn = function(oColumn, sColumnKey) {
		if (oColumn instanceof ColumnWrapper) {
			return;
		}

		if (this._oColumnKeyIsMonkeyPatched[sColumnKey]) {
			// Do nothing if for the current column the methods are already overwritten.
			return;
		}
		this._oColumnKeyIsMonkeyPatched[sColumnKey] = true;

		// Monkey patch setVisible
		var fCallbackOnSetVisible = this.getCallbackOnSetVisible();
		var fSetVisibleOrigin = oColumn.setVisible.bind(oColumn);
		var fSetVisibleOverwritten = function(bVisible) {
			if (fCallbackOnSetVisible) {
				fCallbackOnSetVisible(bVisible, sColumnKey);
			}
			fSetVisibleOrigin(bVisible);
		};
		oColumn.setVisible = fSetVisibleOverwritten;

		// Monkey patch setSummed of AnalyticalTable
		if (oColumn.setSummed) {
			var fCallbackOnSetSummed = this.getCallbackOnSetSummed();
			var fSetSummedOrigin = oColumn.setSummed.bind(oColumn);
			var fSetSummedOverwritten = function(bIsSummed) {
				if (fCallbackOnSetSummed) {
					fCallbackOnSetSummed(bIsSummed, oColumn);
				}
				fSetSummedOrigin(bIsSummed);
			};
			oColumn.setSummed = fSetSummedOverwritten;
		}

		// Monkey patch setGrouped of AnalyticalTable
		if (oColumn.isA("sap.ui.table.AnalyticalColumn")) {
			var fCallbackOnSetGrouped = this.getCallbackOnSetGrouped();
			if (typeof fCallbackOnSetGrouped === "function") {
				var fSetGroupedOrigin = oColumn.setGrouped.bind(oColumn);
				var fSetGroupedOverwritten = function(bGrouped, bIsSetFromGroupController) {
					if (!bIsSetFromGroupController && fCallbackOnSetGrouped) {
						fCallbackOnSetGrouped(bGrouped, oColumn);
					}
					fSetGroupedOrigin(bGrouped);
				};
				oColumn.setGrouped = fSetGroupedOverwritten;
			}
		}
	};

	return ColumnHelper;
});
