/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Connector to layered repository (LRep) APIs.
 *
 * @alias sap.ui.comp.personalization.FlexConnector
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.44.0
 */

sap.ui.define([
	'sap/ui/comp/library', 'sap/ui/comp/navpopover/flexibility/LinkFlex', 'sap/base/Log', 'sap/ui/core/Lib'
], function(CompLibrary, LinkFlex, Log, Library) {
	"use strict";

	// shortcut for sap.ui.comp.navpopover.ChangeHandlerType
	var ChangeHandlerType = CompLibrary.navpopover.ChangeHandlerType;

	return {

		/**
		 * Creates flexibility changes for <code>oMLinks</code> and also saves them in the USER layer.
		 * <b>Note:</b> before using this method the sap.ui.fl library should be loaded.
		 *
		 * @param {object[]} aMAddedLinks Array of objects in format:
		 *
		 * <pre>
		 * [{key: {string}, visible: {boolean}}]
		 * </pre>
		 *
		 * @param {object[]} aMRemovedLinks Array of objects in format:
		 *
		 * <pre>
		 * [{key: {string}, visible: {boolean}}]
		 * </pre>
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 * @private
		 * @deprecated as of version 1.121
		 */
		createAndSaveChangesForControl: function(aMAddedLinks, aMRemovedLinks, oControl) {
			if (!aMAddedLinks.length && !aMRemovedLinks.length) {
				return Promise.resolve();
			}

			return this._createChangesForControl(aMRemovedLinks.concat(aMAddedLinks), oControl).then(function(aChanges) {
				return this._saveChangesForControl(oControl, aChanges);
			}.bind(this), function(oError) {
				return Promise.reject(oError);
			});
		},

		_getControlPersonalizationWriteAPI : function() {
			//TODO Only load the write part when sap.ui.fl separation is done
			return Library.load({name: 'sap.ui.fl'}).then(function() {
				return new Promise(function(fResolve) {
					sap.ui.require([
						"sap/ui/fl/write/api/ControlPersonalizationWriteAPI"
					], function(ControlPersonalizationWriteAPI) {
						fResolve(ControlPersonalizationWriteAPI);
					});
				});
			});
		},

		/**
		 * Discards flexibility changes.
		 * <b>Note:</b> before using this method the sap.ui.fl library should be loaded.
		 * <b>Note:</b> Restricted for personalization scenario.
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be discarded
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 * @private
		 */
		discardChangesForControl: function(oControl) {
			return this._getControlPersonalizationWriteAPI().then(function (ControlPersonalizationWriteAPI) {
				return ControlPersonalizationWriteAPI.reset({selectors: [oControl]});
			});
		},

		/**
		 * Saves all flexibility changes.
		 *
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @param {sap.ui.fl.Change[]} aChanges List of changes to be saved
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 * @private
		 */
		_saveChangesForControl: function(oControl, aChanges) {
			return this._getControlPersonalizationWriteAPI().then(function (ControlPersonalizationWriteAPI) {
				return ControlPersonalizationWriteAPI.save({selector: oControl, changes: aChanges});
			});
			// return new Promise(function(resolve, reject) {
			// 	setTimeout(function() {
			// 		FlexControllerFactory.createForControl(oControl).saveAll().then(function() {
			// 			return resolve();
			// 		})['catch'](function(oError) {
			// 			return reject(oError);
			// 		});
			// 		// return reject({
			// 		// 	status: "Dummy save"
			// 		// });
			// 	}, 5000);
			// });
		},

		/**
		 * Creates flexibility change for each element of <code>aMLinks</code> array for <code>oControl</code> in the USER layer.
		 *
		 * @param {object[]} aMLinks Array of objects of format {key: {string}, visible: {boolean}, index: {int}}
		 * @param {sap.ui.core.Control} oControl Control for which changes will be applied
		 * @returns {Promise[]} A <code>Promise</code> array
		 * @private
		 */
		_createChangesForControl: function(aMLinks, oControl) {
			if (!aMLinks.length) {
				return [];
			}
			var aPersonalizationChanges = [];
			aMLinks.forEach(function(oMLink) {
				var oPersonalizationChange = {
					selectorElement: oControl,
					changeSpecificData: {
						changeType: oMLink.visible ? ChangeHandlerType.addLink : ChangeHandlerType.removeLink,
						content: oMLink,
						isUserDependent: true
					}};
				aPersonalizationChanges.push(oPersonalizationChange);
			});
			return this._getControlPersonalizationWriteAPI().then(function (ControlPersonalizationWriteAPI) {
				return ControlPersonalizationWriteAPI.add({changes: aPersonalizationChanges});
			});
		},

		// ---------------------------------------------------------------------------------------------

		/**
		 * Activates a channel in order to collect statistics about flexibility changes which will be applied after the channel has been activated.
		 *
		 * @private
		 */
		activateApplyChangeStatistics: function() {
			var that = this;
			this.aStatistics = [];
			var fWriteStatistics = function(oChange, oNavigationPopover) {
				if (that.aStatistics.findIndex(function(oStatistic) {
					return oStatistic.stableId === oNavigationPopover.getId() && oStatistic.changeId === oChange.getId();
				}) < 0) {
					var oAvailableAction = oNavigationPopover.getAvailableActions().find(function(oAvailableAction_) {
						return oAvailableAction_.getKey() === oChange.getContent().key;
					});
					that.aStatistics.push({
						stableId: oNavigationPopover.getId(),
						changeId: oChange.getId(),
						layer: oChange.getLayer(),
						key: oChange.getContent().key,
						text: oAvailableAction ? oAvailableAction.getText() : '',
						changeType: oChange.getChangeType()
					});
				}
			};

			var fDiscardFromStatistics = function(sLayer) {
				that.aStatistics = that.aStatistics.filter(function(oStatistic) {
					return oStatistic.layer !== sLayer;
				});
			};

			var fAddLinkApplyChangeOrigin = LinkFlex.applyChange.bind(LinkFlex);
			LinkFlex.applyChange = function(oChange, oNavigationPopover, mPropertyBag) {
				fWriteStatistics(oChange, oNavigationPopover);
				fAddLinkApplyChangeOrigin(oChange, oNavigationPopover, mPropertyBag);
			};

			var fAddLinkDiscardChangesOfLayerOrigin = LinkFlex.discardChangesOfLayer.bind(LinkFlex);
			LinkFlex.discardChangesOfLayer = function(sLayer, oNavigationPopover) {
				fDiscardFromStatistics(sLayer);
				fAddLinkDiscardChangesOfLayerOrigin(sLayer, oNavigationPopover);
			};
		},

		_formatStatistic: function(oStatistic) {
			var sLayer = oStatistic.layer;
			switch (oStatistic.layer) {
				case "VENDOR":
					sLayer = "" + sLayer;
					break;
				case "CUSTOMER":
					sLayer = "        " + sLayer;
					break;
				case "USER":
					sLayer = "                " + sLayer;
					break;
				default:
					sLayer = "" + sLayer;
			}
			var sValue;
			switch (oStatistic.changeType) {
				case ChangeHandlerType.addLink:
					sValue = "On";
					break;
				case ChangeHandlerType.removeLink:
					sValue = "Off";
					break;
				default:
					sValue = "";
			}
			return {
				formattedLayer: sLayer,
				formattedValue: sValue
			};
		},

		/**
		 * Shows statistics for all applied links in console collected since the activation has been started.
		 *
		 * @private
		 */
		printStatisticAll: function() {
			if (!this.aStatistics) {
				Log.info("Please activate with sap.ui.comp.navpopover.FlexConnector.activateApplyChangeStatistics()");
				return;
			}
			var that = this;
			Log.info("idx - VENDOR ------------ CUSTOMER ----------- USER --------------------------------------");
			this.aStatistics.forEach(function(oStatistic, iIndex) {
				var oFormattedStatistic = that._formatStatistic(oStatistic);
				Log.info(iIndex + " " + oStatistic.stableId + " " + oFormattedStatistic.formattedLayer + " '" + oStatistic.text + "' " + oFormattedStatistic.formattedValue);
			});
		}
	};
}, /* bExport= */true);
