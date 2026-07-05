/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// ----------------------------------------------------------------
// Utility class used by smart controls for multi-unit scenario
// ----------------------------------------------------------------
sap.ui.define([
	"sap/m/table/Util",
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/syncStyleClass",
	"sap/base/util/merge"
], function(
	Util,
	Element,
	Library,
	Filter,
	FilterOperator,
	syncStyleClass,
	merge
) {
	"use strict";

	/**
	 * Utility class used by smart controls for multi-unit scenario
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var MultiUnitUtil = {
		/**
		 * returns true/false based on whether multi-unit "*" value is present for unit
		 *
		 * @private
		 * @param {string} sUnit - The unit value
		 * @returns {function} whether there are multiple units - "*"
		 */
		isMultiUnit: function(sUnit) {
			return sUnit === "*";
		},
		/**
		 * returns true/false based on whether multi-unit "*" value is present for unit
		 *
		 * @private
		 * @param {string} sUnit - The unit value
		 * @returns {function} whether there are no multiple units - "*"
		 */
		isNotMultiUnit: function(sUnit) {
			return sUnit !== "*";
		},
		openMultiUnitPopover: async function(oEvent, mAdditionalParams) {
			var oSmartTable = Element.getElementById(mAdditionalParams.smartTableId);
			var oAnalyticalTable = oSmartTable.getTable();
			var oBinding = oAnalyticalTable.getBinding("rows");
			var sValue = mAdditionalParams.value;
			var sUnit = mAdditionalParams.unit;
			var oAnalyticalInfoForColumn, sDimension;

			// no binding or value or unit --> return
			if (!oBinding || !sValue || !sUnit) {
				return;
			}

			var oLink = oEvent.getSource();
			// The link is inside a container (e.g. VBox), get this layout container control in order to get the row and finally the analytical info
			var oLayout = oLink.getParent();
			if (mAdditionalParams.additionalParent) {
				oLayout = oLayout.getParent();
			}
			// via the row, we can get the analytical information
			var oAnalyticalInfo = oAnalyticalTable.getAnalyticalInfoOfRow(oLayout.getParent());
			if (!oAnalyticalInfo) {
				return;
			}
			// prepare filter statement, select and title

			var i, aFilters = [], aSelect = [
				// always request value and unit
				sValue, sUnit
			];

			// Add any application filters already present on the binding (these should be the ones already processed by SmartTable)
			if (oBinding.aApplicationFilter) {
				aFilters = [].concat(oBinding.aApplicationFilter);
			}
			// Get custom query parameters (e.g. "search" from the parent binding and apply it here!)
			var mBindingInfo = oAnalyticalTable.getBindingInfo("rows");
			var mCustomParameters = (mBindingInfo && mBindingInfo.parameters && mBindingInfo.parameters.custom) ? merge({}, mBindingInfo.parameters.custom) : undefined;

			// Grand Total --> do nothing as we already add Currency and unit to the Select clause
			if (oAnalyticalInfo.groupTotal || oAnalyticalInfo.group) {
				// Group Total / Group Header
				var aGroupedColumns = oAnalyticalInfo.groupedColumns;

				for (i = 0; i < aGroupedColumns.length; i++) {
					sDimension = Element.getElementById(aGroupedColumns[i]).getLeadingProperty();
					if (!sDimension) {
						continue;
					}
					// Get Analytical Info for column --> in order to determine/use the proper dimensionProperty!
					// When grouping is done on text column, the actual grouping happens on the dimension (code) property and not the text
					oAnalyticalInfoForColumn = oBinding.getAnalyticalInfoForColumn(sDimension);
					if (oAnalyticalInfoForColumn) {
						sDimension = oAnalyticalInfoForColumn.dimensionPropertyName;
					}
					if (sDimension) {
						aFilters.push(new Filter(sDimension, FilterOperator.EQ, oAnalyticalInfo.context.getProperty(sDimension)));
					}
				}
			} else if (!oAnalyticalInfo.grandTotal) {
				// Line item that contains multiple units
				var aProperties = Object.getOwnPropertyNames(oBinding.getDimensionDetails());
				for (i = 0; i < aProperties.length; i++) {
					aFilters.push(new Filter(aProperties[i], FilterOperator.EQ, oAnalyticalInfo.context.getProperty(aProperties[i])));
				}
			}

			var oPopover = Element.getElementById(mAdditionalParams.smartTableId + "-multiUnitPopover");
			var bPopoverAlreadyExists = (oPopover ? true : false);
			var sPopoverId = mAdditionalParams.smartTableId + "-multiUnitPopover";
			//If there is no popover, use the table id for the new popover control
			var vPopover = oPopover ? oPopover : sPopoverId;
			var oItemsBindingInfo = {
				path: oBinding.getPath(),
				filters: aFilters,
				parameters: {
					select: aSelect.join(","),
					custom: mCustomParameters
				}
			};
			var mSettings = {
				control: oAnalyticalTable,
				grandTotal: oAnalyticalInfo.grandTotal,
				itemsBindingInfo: oItemsBindingInfo,
				listItemContentTemplate: mAdditionalParams.template
			};

			oPopover = await Util.createOrUpdateMultiUnitPopover(vPopover, mSettings);

			if (!bPopoverAlreadyExists) {
				oAnalyticalTable.addDependent(oPopover);
			}

			oPopover.openBy(oLink);
		}
	};

	return MultiUnitUtil;

}, /* bExport= */true);
