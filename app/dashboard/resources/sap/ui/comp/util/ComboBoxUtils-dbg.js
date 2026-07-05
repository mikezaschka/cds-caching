/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
		"sap/ui/comp/util/FormatUtil"
	], function(
		FormatUtil
	) {
	"use strict";

	/**
	 * Utility class used by ComboBox and MultiComboBox
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	 return {
		/**
		 * Rearranges TextArragement Id and Description if required
		 *
		 * @param {object} oItem Selected ComboBox Item
		 * @param {string} sTextArrangement The required arrangement pattern
		 * @returns {string}
		 *
		 * @private
		 */
		formatDisplayBehaviour: function (oItem, sTextArrangement){
			var sResultValue,
				sKey,
				sDescription,
				sKeyPath,
				sDescriptionPath,
				sSelectedKey,
				oItemBindingInfoText,
				oItemBindingContext;

			if (oItem === null || oItem === undefined || !sTextArrangement) {
				return;
			}

			sSelectedKey = oItem.getKey();
			oItemBindingInfoText = oItem && oItem.getBindingInfo("text");

			if (sSelectedKey !== "" &&
				oItemBindingInfoText && Array.isArray(oItemBindingInfoText.parts)) {

				sKeyPath = oItemBindingInfoText.parts[0].path;
				if (oItemBindingInfoText.parts[1]) {
					sDescriptionPath = oItemBindingInfoText.parts[1].path;
				}
				oItemBindingContext = oItem.getBindingContext();

				sKey = sKeyPath && oItemBindingContext.getProperty(sKeyPath);
				sDescription = sDescriptionPath && oItemBindingContext.getProperty(sDescriptionPath);

				if (sSelectedKey !== sKey) {
					return;
				}

				sResultValue = FormatUtil.getFormattedExpressionFromDisplayBehaviour(sTextArrangement, sKey, sDescription);
			}

			return sResultValue;
		}

	 };
});
