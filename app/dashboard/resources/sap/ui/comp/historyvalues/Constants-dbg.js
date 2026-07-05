/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
	"use strict";

	var HISTORY_PREFIX = "sapui5.history.";
	var SHORT_HISTORY_PREFIX = "ui5.";
	var SUGGESTIONS_GROUP_PROPERTY_NAME = "__sapui5_suggestion_order";
	var MAX_HISTORY_ITEMS = 5;
	var FORCED_VISIBLE_NAME = "__sapui5_forced_visible_suggestion";

	return {
		getHistoryPrefix: function () {
			return HISTORY_PREFIX;
		},
		getShortHistoryPrefix: function () {
			return SHORT_HISTORY_PREFIX;
		},
		getSuggestionsGroupPropertyName: function () {
			return SUGGESTIONS_GROUP_PROPERTY_NAME;
		},
		getForcedVisiblePropertyName: function () {
			return FORCED_VISIBLE_NAME;
		},
		getMaxHistoryItems: function () {
			return MAX_HISTORY_ITEMS;
		}
	};
});
