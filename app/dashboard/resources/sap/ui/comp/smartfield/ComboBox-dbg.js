/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/comp/odata/ComboBox",
	"sap/m/ComboBoxRenderer",
	"sap/ui/comp/util/FormatUtil"
],
function (
	BaseComboBox,
	ComboBoxRenderer,
	FormatUtil
) {
	"use strict";

	var sDefaultGUID = "00000000-0000-0000-0000-000000000000";
	function isDefaultGUID(sValue) {
		return sValue === sDefaultGUID;
	}
	/**
	 * Constructor for a new <code>SmartField/ComboBox</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Extends the functionalities in sap.m.ComboBox
	 * @extends sap.m.ComboBox
	 * @constructor
	 * @protected
	 * @alias sap.ui.comp.smartfield.ComboBox
	 */
	var ComboBox = BaseComboBox.extend("sap.ui.comp.smartfield.ComboBox",
	{
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * Key of the selected item.
				 *
				 * <b>Note:</b> If duplicate keys exist, the first item matching the key is used.
				 */
				selectedKey: {
					type: "string",
					group: "Data",
					defaultValue: null
				},
				enteredValue: {
					type: "string",
					group: "Data",
					defaultValue: null
				},
				/**
				 * Property works the same as sap.m.Input control <code>value</code>
				 */
				realValue: {
					type: "string",
					group: "Data",
					defaultValue: null
				},
				/**
				 * Sets the <code>value</code> property formatting according to the <code>com.sap.vocabularies.UI.v1.TextArrangementType</code> from the ValueList property.
				 */
				valueTextArrangement: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				}
			}
		},
		renderer: ComboBoxRenderer
	});

	ComboBox.prototype.init = function () {
		BaseComboBox.prototype.init.apply(this, arguments);

		this.attachChange(function () {
			var sValue = this._getValue();

			if (this.getItemByKey(sValue)) {
				this.setSelectedKey(sValue);
			}

			this.setProperty("realValue", sValue);
		}.bind(this));
	};

	ComboBox.prototype.onBeforeRendering = function () {
		BaseComboBox.prototype.onBeforeRendering.apply(this, arguments);
		this._processValueTextArrangement();
		this._synchronize();
	};

	ComboBox.prototype._processValueTextArrangement = function () {
		var oSelectedItemBindingText,
			sKey,
			sSelectedKey,
			oSelectedItem,
			sDescription,
			oDescriptionBinding,
			oKeyBinding,
			sNewValue,
			sValueTextArrangement = this.getValueTextArrangement();


		sSelectedKey = this.getSelectedKey();
		oSelectedItem = this.getItemByKey("" + sSelectedKey);
		oSelectedItemBindingText = oSelectedItem && oSelectedItem.getBinding("text");

		if (sValueTextArrangement &&
			oSelectedItem && (sSelectedKey !== "") &&
			oSelectedItemBindingText && Array.isArray(oSelectedItemBindingText.aBindings)) {

			oKeyBinding = oSelectedItemBindingText.aBindings[0];
			oDescriptionBinding = oSelectedItemBindingText.aBindings[1];

			sKey = oKeyBinding && oKeyBinding.getValue();
			sDescription = oDescriptionBinding && oDescriptionBinding.getValue();

			if (sSelectedKey !== sKey) {
				return;
			}

			sNewValue = FormatUtil.getFormattedExpressionFromDisplayBehaviour(sValueTextArrangement, sKey, sDescription);
			this.setValue(sNewValue);
		}
	};

	ComboBox.prototype._synchronize = function() {
		var sKey = this.getSelectedKey(),
			aKeys = this.getKeys(),
			vItem = this.getItemByKey("" + sKey);

		if (vItem &&
			(sKey !== "" || aKeys.indexOf(sKey) !== -1) &&
			sKey === this.getValue() &&
			sKey !== vItem.getText()) {

			this.setAssociation("selectedItem", vItem, true);
			this._setPropertyProtected("selectedItemId", vItem.getId(), true);

			this.setProperty("enteredValue", sKey);
			this.setProperty("realValue", sKey);
			this.setValue(vItem.getText());
			this._sValue = this.getValue();
		}
	};

	ComboBox.prototype.validateProperty = function (sPropertyName, oValue) {
		if (oValue === null &&
			(sPropertyName === "enteredValue" ||
			sPropertyName === "selectedItemId" ||
			sPropertyName === "selectedKey" ||
			sPropertyName === "realValue" ||
			sPropertyName === "value")) {
			return oValue;
		}

		return BaseComboBox.prototype.validateProperty.apply(this, arguments);
	};

	ComboBox.prototype.setRealValue = function (sValue) {
		if (sValue === null || isDefaultGUID(sValue)) {
			this.setValue("");
		} else {
			this.setValue(sValue);
		}

		this.setSelectedKey(sValue);

		return this.setProperty("realValue", sValue);
	};

	ComboBox.prototype.setEnteredValue = function (sValue) {
		var sEnteredValue,
			oSelectedItem = this.getSelectedItem();

		if (typeof sValue !== "undefined") {
			this.setSelectedKey(sValue);
		}

		if (sValue && !oSelectedItem && !isDefaultGUID(sValue)) {
			this.setValue(sValue);
		}

		sEnteredValue = this._getValue();

		this.setProperty("enteredValue", sEnteredValue);

		return this;
	};

	ComboBox.prototype._getValue = function () {
		var sValue,
			mSelectedKey = this.getSelectedKey(),
			oSelectedItem = this.getSelectedItem();

		if (oSelectedItem && mSelectedKey !== null) {
			sValue = mSelectedKey;
		} else if (mSelectedKey === null && this.getValue() === ""){
			sValue = mSelectedKey;
		} else {
			sValue = this.getValue();
		}

		return sValue;
	};

	ComboBox.prototype.shouldResetSelection = function(sKey) {
		var aKeys = this.getKeys(),
			bHasKey = aKeys.length === 0 || aKeys.indexOf(sKey) !== -1;

		return (sKey === this.getMetadata().getProperty("selectedKey").defaultValue) || !bHasKey;
	};

	return ComboBox;

});
