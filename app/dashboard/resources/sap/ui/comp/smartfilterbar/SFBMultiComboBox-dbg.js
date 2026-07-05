/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/m/MultiComboBox",
	"sap/m/MultiComboBoxRenderer",
	"sap/ui/comp/util/ComboBoxUtils",
	"sap/m/inputUtils/ListHelpers",
	"sap/ui/base/ManagedObjectObserver"
], function(
	BaseMultiComboBox,
	MultiComboBoxRenderer,
	ComboBoxUtils,
	ListHelpers,
	ManagedObjectObserver
) {
	"use strict";

	var sTOKEN_KEY = ListHelpers.CSS_CLASS + "Token";

	/**
	 * Constructor for a new <code>SmartFilterBar/SFBMultiComboBox</code>.
	 *
	 * @class Extends the functionalities in sap.m.MultiComboBox
	 * @extends sap.m.MultiComboBox
	 * @constructor
	 * @protected
	 * @alias sap.ui.comp.smartfilterbar.SFBMultiComboBox
	 */
	 var SFBMultiComboBox = BaseMultiComboBox.extend("sap.ui.comp.smartfilterbar.SFBMultiComboBox",
	 {
		metadata: {
			library: "sap.ui.comp",
			interfaces: [
				"sap.ui.comp.IDropDownTextArrangement"
			],
			properties: {
				/**
				 * Sets the <code>value</code> property formatting according to the <code>com.sap.vocabularies.UI.v1.TextArrangementType</code> from the ValueList property.
				 */
				textArrangement: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				}
			}
		},
		renderer: MultiComboBoxRenderer
	 });

	SFBMultiComboBox.prototype.init = function() {
		var bDataRecievedPromiseAttached = false;

		BaseMultiComboBox.prototype.init.apply(this, arguments);

		this._oObserver = new ManagedObjectObserver(function (oMutation) {
			if (!oMutation) {
				return;
			}

			//CS20240007935809: Firing selection change ensures the already selected keys
			//are updated the model at the start
			if (oMutation.type === "aggregation" &&
				oMutation.name === "items" && this.data("__dataReceivedPromise") && !bDataRecievedPromiseAttached) {
					bDataRecievedPromiseAttached = true;
					this.data("__dataReceivedPromise").then(function() {
						this.fireSelectionChange({stopChangePropagation: true});
					}.bind(this));
			}
		}.bind(this));

		this._oObserver.observe(this, {
			aggregations: [
				"items"
			]
		});
	};

	 SFBMultiComboBox.prototype.onBeforeRendering = function () {
		BaseMultiComboBox.prototype.onBeforeRendering.apply(this, arguments);
		this._processTextArrangement();
	};

	SFBMultiComboBox.prototype._processTextArrangement = function (){
		var i,
			oToken,
			sSelectedKey,
			oSelectedItem,
			sNewValue,
			aSelectedKeys = this.getSelectedKeys(),
			sTextArrangement = this.getTextArrangement();

		if (!sTextArrangement || aSelectedKeys.length === 0) {
			return;
		}

		for (i = 0; i < aSelectedKeys.length; i++) {
			sSelectedKey = aSelectedKeys[i];
			oSelectedItem = this.getItemByKey("" + sSelectedKey);

			sNewValue = ComboBoxUtils.formatDisplayBehaviour(oSelectedItem, sTextArrangement);

			if (sNewValue) {
				oToken = oSelectedItem.data(sTOKEN_KEY);
				if (oToken && oToken.isA("sap.m.Token")) {
					oToken.setText(sNewValue);
				}
			}
		}
	};

	SFBMultiComboBox.prototype.useHighlightItemsWithContains = function() {
		return true;
	};

	SFBMultiComboBox.prototype.destroy = function() {
		BaseMultiComboBox.prototype.destroy.apply(this, arguments);
		this._oObserver = null;
	};

	return SFBMultiComboBox;
});
