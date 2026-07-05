/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/m/ComboBox",
	"sap/m/ComboBoxRenderer",
	"sap/ui/comp/util/ComboBoxUtils"
], function(
	BaseComboBox,
	ComboBoxRenderer,
	ComboBoxUtils
) {
	"use strict";

	/**
	 * Constructor for a new <code>odata/ComboBox</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Extends the functionalities in sap.m.ComboBox
	 * @extends sap.m.ComboBox
	 * @constructor
	 * @protected
	 * @alias sap.ui.comp.odata.ComboBox
	 */
	 var ComboBox = BaseComboBox.extend("sap.ui.comp.odata.ComboBox",
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
			},
			events: {
				/**
				 * This event is fired when the selected key has changed only when:
				 * The key is valid.
				 * The control is visible
				 * There is a change when the control gets visible.
				 */
				selectedKeyChange: {
					parameters: {

						/**
						 * The selected key.
						 */
						selectedKey: {
							type: "string"
						}
					}
				}
			}
		},
		renderer: ComboBoxRenderer
	 });

	 ComboBox.prototype.onBeforeRendering = function () {
		BaseComboBox.prototype.onBeforeRendering.apply(this, arguments);
		this._processSelectedKeyChange();
	};

	 ComboBox.prototype._processSelectedKeyChange = function(){
		var aKeys,
			vItem,
			sKey = this.getSelectedKey();

		if (sKey !== this._sKey ) {
			aKeys = this.getKeys();
			vItem = this.getItemByKey("" + sKey);

			if (vItem && aKeys.indexOf(sKey) !== -1) {
				this.fireSelectedKeyChange({
					selectedKey: sKey
				});

				this._sKey = sKey;
			}
		}
	};

	ComboBox.prototype.setValue = function(sValue) {
		var sSelectedKey = this.getSelectedKey(),
			oSelectedItem = this.getItemByKey("" + sSelectedKey),
			sTextArrangement = this.getTextArrangement();

		if (sTextArrangement && oSelectedItem !== null) {
			sValue = ComboBoxUtils.formatDisplayBehaviour(oSelectedItem, sTextArrangement);
		}

		return BaseComboBox.prototype.setValue.call(this, sValue);
	};

	return ComboBox;
});
