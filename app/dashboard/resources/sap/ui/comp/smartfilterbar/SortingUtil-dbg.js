/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Utility to access sorting for <code>SmartFilterBar</code> control.
 *
 * @name sap.ui.comp.smartfield.SortingUtil
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.85.0
 * @returns {sap.ui.comp.smartfield.SortingUtil} The sorting class.
 */
sap.ui.define([], function() {
	"use strict";

	/**
	 * @private
	 * @constructor
	 */
	var SortingUtil = {

		sortByIndex: function(aArray) {
			var aFieldsHavingAnIndex, aResult, iIndex, oField;
				if (!aArray || !aArray.length) {
					return aArray;
				}
				aResult = [];
				aFieldsHavingAnIndex = [];
				for (var i = 0; i < aArray.length; i++) {
					oField = aArray[i];
					iIndex = oField.index;
					if (iIndex >= 0) {
						aFieldsHavingAnIndex.push(oField);
					} else {
						aResult.push(oField);
						// add fields having no index to result...
					}
				}
				if (aFieldsHavingAnIndex.length) {
					// Sort fields having an index
					aFieldsHavingAnIndex = aFieldsHavingAnIndex.sort(function(field1, field2) {
						return field1.index - field2.index;
					});
					// Check if fields without index exist, if not, use the sorted indexed fields array as result
					if (!aResult.length) {
						aResult = aFieldsHavingAnIndex;
					} else {
						// add fields having an index at the right location (if possible) in result array
						for (var j = 0; j < aFieldsHavingAnIndex.length; j++) {
							oField = aFieldsHavingAnIndex[j];
							if (oField.index >= aResult.length) {
								aResult.push(oField);
							} else {
								aResult.splice(oField.index, 0, oField);
							}
						}
					}
				}
				return aResult;
		},

		groupSorting: function(aArray) {
			var aResult = [];
			aResult = this.sortByIndex(aArray);
			for (var i = 0; i < aResult.length; i++) {

				// sort fields of a group by index
				if (aResult[i].fields) {
					aResult[i].fields = this.sortByIndex(aResult[i].fields);
				}
			}

			return aResult;
		},
		/**
		 * Frees all resources claimed during the lifetime of this instance.
		 *
		 * @protected
		 */
		destroy: function() {
			//nothing to do here.
		}
	};

	return SortingUtil;
}, true);
