/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/comp/util/FormatUtil',
	'sap/ui/base/ManagedObject',
	'sap/m/Token'
], function(FormatUtil, ManagedObject, Token) {
	"use strict";

	/**
	 * Constructs a class to map key/object pairs
	 *
	 * @constructor
	 * @public
	 * @author Peter Harbusch
	 */
	var ItemsCollection = function() {
		this.items = {};
	};

	/**
	 * Add or overwrite a key in the map and the associated obj.
	 *
	 * @param {string} sKey the key of the obj in the map
	 * @param {object} obj the object which has to been stored in the map
	 * @public
	 */
	ItemsCollection.prototype.add = function(sKey, obj) {
		this.items[sKey] = obj;
	};

	/**
	 * Removes the key in the map and the associated obj.
	 *
	 * @param {string} sKey - the key of the obj in the map
	 * @public
	 */
	ItemsCollection.prototype.remove = function(sKey) {
		delete this.items[sKey];
	};

	/**
	 * Removes all the items.
	 *
	 * @public
	 */
	ItemsCollection.prototype.removeAll = function() {
		this.items = {};
	};

	/**
	 * Returns the obj of the key on the map.
	 *
	 * @param {string} sKey - the key of the obj in the map
	 * @returns {object} the object with the given key
	 * @public
	 */
	ItemsCollection.prototype.getItem = function(sKey) {
		return this.items[sKey];
	};

	/**
	 * returns an array of all keys in the map
	 *
	 * @returns {array} the array of all the map keys
	 * @public
	 */
	ItemsCollection.prototype.getItems = function() {
		var aKeys = [];
		for ( var item in this.items) {
			aKeys.push(item);
		}
		return aKeys;
	};

	/**
	 * Returns an array of all selected tokens in the map.
	 *
	 * @param {string} sKey - the property name of the obj in the map which will be used for the Display Key in the tokens returned in the array
	 * @param {string} sDescriptionKey - the property name of the obj in the map which will be returned in the array
	 * @param {string} sDisplayBehaviour - the behaviour/format of the token text (See: sap.ui.comp.smartfilterbar.DisplayBehaviour)
	 * @returns {sap.m.Token[]} array of tokens with the given key and the text value
	 * @public
	 */
	ItemsCollection.prototype.getSelectedItemsTokenArray = function(sKey, sDescriptionKey, sDisplayBehaviour) {
		var aTokens = [];
		for ( var sItemKey in this.items) {
			var oItem = this.items[sItemKey];
			var sText, sDisplayKey;

			if (typeof oItem === "string") {
				sDisplayKey = sItemKey;
				sText = oItem;
			} else {
				sDisplayKey = oItem[sKey];
				sText = oItem[sDescriptionKey];

				if (sText === undefined) {
					sText = this.items[sItemKey];
					if (typeof sText !== "string") {
						sText = sDisplayKey;
					}
				} else {
					if (!sDisplayBehaviour) {
						sDisplayBehaviour = "descriptionAndId";
					}
					sText = FormatUtil.getFormattedExpressionFromDisplayBehaviour(sDisplayBehaviour, sDisplayKey, sText);
				}
			}

			var oToken = new Token({
				key: ManagedObject.escapeSettingsValue(sDisplayKey)
			});
			oToken.setText( sText);
			oToken.setTooltip(typeof sText === "string" ? sText : "");

			if (typeof oItem !== "string") {
				oToken.data("row", oItem);
				oToken.data("longKey", ManagedObject.escapeSettingsValue(sItemKey));
			}
			aTokens.push(oToken);
		}
		return aTokens;
	};

	/**
	 * Returns an array of all objects in the map.
	 *
	 * @returns {string[]} array of all the map objects
	 * @public
	 */
	ItemsCollection.prototype.getModelData = function() {
		var aModelItems = [];
		for ( var itemKey in this.items) {
			var item = this.items[itemKey];
			if (typeof item === "string") {
				item = {
					missing: itemKey
				};
			}
			aModelItems.push(item);
		}
		return aModelItems;
	};

	return ItemsCollection;

}, /* bExport= */true);
