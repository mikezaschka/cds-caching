/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides SelectionController
sap.ui.define(['./BaseController', 'sap/m/library', 'sap/ui/comp/library', './Util', "sap/ui/core/Lib"], function(BaseController, MLibrary, CompLibrary, Util, Library) {
	"use strict";

	/**
	 * The SelectionController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.34.0
	 * @alias sap.ui.comp.SelectionController
	 */
	var SelectionController = BaseController.extend("sap.ui.comp.personalization.SelectionController", /** @lends sap.ui.comp.personalization.SelectionController.prototype */
		{
			constructor: function(sId, mSettings) {
				BaseController.apply(this, arguments);
				this.setType(MLibrary.P13nPanelType.selection);
				this.setItemType(MLibrary.P13nPanelType.selection + "Items");
			},
			metadata: {
				events: {
					afterSelectionModelDataChange: {}
				}
			}
		});

	/**
	 * Does a complete JSON snapshot of the current table instance ("original") from the perspective of the columns controller; the JSON snapshot can
	 * later be applied to any table instance to recover all columns related infos of the "original" table
	 *
	 * @returns {objects} JSON objects with meta data from existing table columns
	 */
	SelectionController.prototype.getColumn2Json = function(oColumn, sColumnKey, iIndex) {
		return {
			columnKey: sColumnKey,
			text: oColumn.getLabel(),
			visible: oColumn.getSelected()
		};
	};

	SelectionController.prototype.getColumn2JsonTransient = function(oColumn, sColumnKey, sText, sTooltip) {
		return {
			columnKey: sColumnKey,
			text: sText,
			href: oColumn.getHref(),
			internalHref: oColumn.getInternalHref(),
			target: oColumn.getTarget(),
			press: oColumn.getPress(),
			description: oColumn.getDescription()
		};
	};

	SelectionController.prototype.syncJson2Table = function(oJson) {
		this.fireBeforePotentialTableChange();

		// Note: SelectionController is doing things in other way then all other controllers.
		// SelectionController does not need to sync changes to the NavigationContainer setting visibility of sap.m.Link because
		// it is done automatically in AddLink and RemoveLink change handlers, once the change is applied to the NavigationContainer.

		this.fireAfterPotentialTableChange();
	};

	SelectionController.prototype.retrieveAdaptationUI = function(oPayload) {
		return new Promise(function(resolve){
			sap.ui.require([
				'sap/ui/mdc/p13n/panels/LinkSelectionPanel'
			], function(LinkSelectionPanel) {

				var aP13nData = this.getAdaptationData();

				var oSelectionPanel = new LinkSelectionPanel({
					showHeader: true,
					enableCount: true,
					fieldColumn: Library.getResourceBundleFor("sap.ui.mdc").getText("info.SELECTION_DIALOG_COLUMNHEADER_WITHOUT_COUNT"),
					linkPressed: this.getTable().getPress(),
					enableReorder: false
				});

				oSelectionPanel.setP13nData(aP13nData);

				this.oPanel = oSelectionPanel;

				var aMapped;
				oSelectionPanel.attachChange(function(oChangeEvt){

					var oNew = this.getControlDataReduce();
					aMapped = oChangeEvt.getSource().getP13nData().map(function(oP13nItem, iIndex){
						return {
							columnKey: oP13nItem.name,
							visible: oP13nItem.visible
						};
					});
					oNew.selection.selectionItems = aMapped;

					this.setControlDataReduce2Model(oNew);
					this.fireAfterPotentialModelChange({
						json: oNew
					});
				}.bind(this));

				resolve(oSelectionPanel);
			}.bind(this));
		}.bind(this));
	};

	SelectionController.prototype._transformAdaptationData = function(oReduce, oTransient) {
		var oAdaptationItem = BaseController.prototype._transformAdaptationData.apply(this, arguments);
		oAdaptationItem.text = oTransient.text;
		oAdaptationItem.href = oTransient.href;
		oAdaptationItem.internalHref = oTransient.internalHref ? oTransient.internalHref : undefined;
		oAdaptationItem.visible = oReduce.visible;
		oAdaptationItem.description = oTransient.description;
		oAdaptationItem.label = oTransient.name;
		return oAdaptationItem;
	};

	/**
	 * Operations on columns are processed every time directly at the table. In case that something has been changed via Personalization Dialog or via
	 * user interaction at table, change is applied to the table.
	 *
	 * @param {object} oDataOld (new) JSON object
	 * @param {object} oDataNew (old) JSON object
	 * @returns {object} that represents the change type, like: Unchanged || TableChanged || ModelChanged
	 */
	SelectionController.prototype.getChangeType = function(oDataOld, oDataNew) {
		return this.getChangeData(oDataOld, oDataNew) ? CompLibrary.personalization.ChangeType.ModelChanged : CompLibrary.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = oDataCompare - oDataNew (new - old)
	 *
	 * @param {object} oDataBase JSON object which represents the current model state (Restore+PersistentData)
	 * @param {object} oDataCompare JSON object which represents AlreadyKnown || Restore
	 * @returns {object} JSON object or null
	 */
	SelectionController.prototype.getChangeData = function(oDataBase, oDataCompare) {
		// not valid
		if (!oDataCompare || !oDataCompare.selection || !oDataCompare.selection.selectionItems) {
			return null;
		}

		var oChangeData = {
			selection: Util.copy(oDataBase.selection)
		};

		// If no changes inside of selection.selectionItems array, return null.
		// Note: the order inside of selection.selectionItems array is irrelevant.
		if (this._isSemanticEqual(oDataBase, oDataCompare)) {
			return null;
		}

		// If corresponding items are different then delete equal properties and return the rest of item
		var aToBeDeleted = [];
		oChangeData.selection.selectionItems.forEach(function(oItemOld) {
			var oItemNew = Util.getArrayElementByKey("columnKey", oItemOld.columnKey, oDataCompare.selection.selectionItems);
			if (Util.semanticEqual(oItemOld, oItemNew)) {
				// Condenser: remove items which are not changed in a chain
				aToBeDeleted.push(oItemOld);
				return;
			}
			for ( var property in oItemOld) {
				if (property === "columnKey" || !oItemNew) {
					continue;
				}
				if (oItemOld[property] === oItemNew[property]) {
					delete oItemOld[property];
				}
			}
			// oItemOld has only one property 'columnKey'
			if (Object.keys(oItemOld).length < 2) {
				aToBeDeleted.push(oItemOld);
			}
		});
		aToBeDeleted.forEach(function(oItemOld) {
			var iIndex = Util.getIndexByKey("columnKey", oItemOld.columnKey, oChangeData.selection.selectionItems);
			oChangeData.selection.selectionItems.splice(iIndex, 1);
		});

		return oChangeData;
	};

	/**
	 * @param {object} oDataOld - JSON object to which different properties from oDataNew are added. E.g. Restore
	 * @param {object} oDataNew - JSON object from where the different properties are added to oDataOld. E.g. CurrentVariant || PersistentData
	 * @returns {object} new JSON object as union result of oDataOld and oDataNew
	 */
	SelectionController.prototype.getUnionData = function(oDataOld, oDataNew) {
		var oDataOldCopy = Util.copy(oDataOld);
		if (!oDataNew || !oDataNew.selection || !oDataNew.selection.selectionItems) {
			return oDataOldCopy.selection ? {
				selection: Util.copy(oDataOldCopy.selection)
			} : null;
		}

		if (!oDataOldCopy || !oDataOldCopy.selection || !oDataOldCopy.selection.selectionItems) {
			return {
				selection: Util.copy(oDataNew.selection)
			};
		}

		var oUnion = this.createControlDataStructure();
		oDataOldCopy.selection.selectionItems.forEach(function(oSelectionItemOld) {
			var oSelectionItemNew = Util.getArrayElementByKey("columnKey", oSelectionItemOld.columnKey, oDataNew.selection.selectionItems);
			if (oSelectionItemNew) {
				if (oSelectionItemNew.visible !== undefined) {
					oSelectionItemOld.visible = oSelectionItemNew.visible;
				}
			}
			oUnion.selection.selectionItems.push(oSelectionItemOld);
		});

		return oUnion;
	};

	SelectionController.prototype._isSemanticEqual = function(oDataOld, oDataNew) {
		var fSort = function(a, b) {
			if (a.visible === true && (b.visible === false || b.visible === undefined)) {
				return -1;
			} else if ((a.visible === false || a.visible === undefined) && b.visible === true) {
				return 1;
			} else if (a.visible === true && b.visible === true) {
				// if (a.index < b.index) {
				// return -1;
				// } else if (a.index > b.index) {
				// return 1;
				// } else {
				return 0;
				// }
			} else if ((a.visible === false || a.visible === undefined) && (b.visible === false || b.visible === undefined)) {
				if (a.columnKey < b.columnKey) {
					return -1;
				} else if (a.columnKey > b.columnKey) {
					return 1;
				} else {
					return 0;
				}
			}
		};
		var aDataOldSorted = Util.copy(oDataOld.selection.selectionItems).sort(fSort);
		var aDataNewSorted = Util.copy(oDataNew.selection.selectionItems).sort(fSort);
		return !aDataOldSorted.some(function(oSelectionItem, iIndex) {
			if (!Util.semanticEqual(oSelectionItem, aDataNewSorted[iIndex])) {
				return true;
			}
		});
	};

	SelectionController.prototype.getResetWarningText = function() {
		return Library.getResourceBundleFor("sap.ui.mdc").getText("info.SELECTION_DIALOG_RESET_WARNING");
	};

	return SelectionController;

});
