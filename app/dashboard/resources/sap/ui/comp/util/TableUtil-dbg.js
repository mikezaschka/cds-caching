/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Utility class that provides useful functionality in the <code>SmartTable</code> context.
	 *
	 * @namespace
	 * @alias sap.ui.comp.util.TableUtil
	 * @private
	 * @ui5-restricted sap.fe
	 * @since 1.121
	 */
	var TableUtil = {

		/**
		 * Returns an array of all custom columns.
		 *
		 * @param {sap.ui.comp.smarttable.SmartTable} oTable Instance of the <code>SmartTable</code>
		 * @return {sap.ui.table.Column[] | sap.m.Column[]} An array of all custom columns
		 * @private
		 * @ui5-restricted sap.fe
		 * @since 1.121
		 */
		getCustomColumns: function(oTable) {
			if (!oTable.isInitialised()) {
				throw new Error("getCustomColumns method called before the SmartTable is initialized - " + oTable.getId());
			}
			return oTable._aExistingColumns.map((sColumnKey) => {
				return oTable._getColumnByKey(sColumnKey);
			});
		},

		getRedundantProperties: function(oTable) {
			const oRedundantColumnsSet = new Set(),
				oColumnsSet = new Set(oTable._aColumnKeys);

			oColumnsSet.forEach((sColumnKey) => {
				if (oRedundantColumnsSet.has(sColumnKey)) {
					return;
				}

				const oColumn = oTable._getColumnByKey(sColumnKey);
				const oCustomData = oColumn?.data("p13nData") ?? oTable._mLazyColumnMap[sColumnKey];
				if (oCustomData?.displayBehaviour && oCustomData?.description) {
					if (oColumnsSet.has(oCustomData.description)) {
						oRedundantColumnsSet.add(oCustomData.description);
					}
				}
			});

			return Array.from(oRedundantColumnsSet);
		}

	};

	return TableUtil;
}, true);