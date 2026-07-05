/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define("sap/ui/comp/smartfield/ValidationUtil", [
	"sap/ui/comp/library",
	"sap/ui/core/Lib",
	"sap/ui/core/Messaging",
	"sap/ui/core/message/Message",
	"sap/ui/core/message/MessageType",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/model/ValidateException"
], function(
	CompLibrary,
	Library,
	Messaging,
	Message,
	MessageType,
	ControlMessageProcessor,
	ValidateException
) {
	"use strict";

	var TextInEditModeSource = CompLibrary.smartfield.TextInEditModeSource;

	/**
	 * Creates a new instance.
	 *
	 * @param {sap.ui.comp.smartfield.SmartField} oSmartField control
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.107.0
	 * @alias sap.ui.comp.smartfield.ValidationUtil
	 */
	var ValidationUtil = function(oSmartField) {
		this.oSmartField = oSmartField;
		this.oRB = Library.getResourceBundleFor("sap.ui.comp");
	};

	ValidationUtil.prototype._getPropertyName = function (oInput) {
		if (oInput.isA("sap.ui.comp.smartfield.ComboBox")) {
			return "enteredValue";
		} else if (oInput.isA("sap.m.ComboBox")) {
			return "selectedKey";
		} else {
			return "value";
		}
	};

	ValidationUtil.prototype._createMessage = function (sMessageID, oInput, sMessageType) {
		var sProperty = this._getPropertyName(oInput),
			oMessage;

		// Remove any old message
		this._removeMessage();

		oMessage = new Message({
			message: this.oRB.getText(sMessageID),
			type: sMessageType,
			target: oInput.getId() + "/" + sProperty,
			processor: this._getMessageProcessor()
		});

		this._oCurrentMessage = oMessage;
		Messaging.addMessages(oMessage);
	};

	/**
	 * Remove previously created message
	 * @private
	 */
	ValidationUtil.prototype._removeMessage = function () {
		if (this._oCurrentMessage) {
			Messaging.removeMessages(this._oCurrentMessage);
			this._oCurrentMessage.destroy();
			this._oCurrentMessage = null;
		}
	};

	/**
	 * Handles textInEditModeSource=ValueListWarning lifecycle
	 * @param {object} oResults oData result object
	 * @private
	 */
	ValidationUtil.prototype.handleValueListWarning = function (oResults) {
		var oInputField = this.oSmartField._oControl.edit;

		if (oInputField && this.oSmartField._isValueListWarning()) {

			if (oResults.length === 0) {
				this._createMessage("SMARTFIELD_NOT_FOUND", oInputField, MessageType.Warning);
			} else if (oResults.length > 1) {
				this._createMessage("SMARTFIELD_DUPLICATE_VALUES", oInputField, MessageType.Warning);
			} else {
				this._removeMessage();
			}

		}
	};

	/**
	 * Lazy instantiate and return the message processor
	 * @returns {sap.ui.core.message.ControlMessageProcessor} ControlMessageProcessor
	 * @private
	 */
	ValidationUtil.prototype._getMessageProcessor = function () {
		var oMessageProcessor;

		if (this._oMessageProcessor) {
			return this._oMessageProcessor;
		}

		// Create and register
		oMessageProcessor = new ControlMessageProcessor();
		Messaging.registerMessageProcessor(oMessageProcessor);

		this._oMessageProcessor = oMessageProcessor;
		return this._oMessageProcessor;
	};

	ValidationUtil.prototype.handleComboValidation = function (oControl) {
		if (!this._isComboBoxValidationWarning()) {
			return;
		}

		if (oControl.getEnteredValue() && !oControl.getSelectedKey() && oControl.getValue() !== "") {
			this._createMessage("SMARTFIELD_NOT_FOUND", oControl, MessageType.Warning);
		} else {
			this._removeMessage();
		}
	};

	ValidationUtil.prototype._isComboBoxValueInvalid = function (oControl, oType, sValue) {
		if (sValue === null || sValue === "" && oType.isA("sap.ui.comp.odata.type.NumericText")) {
			return false;
		}
		return !oControl.getSelectedItem() && oControl.getValue();
	};

	ValidationUtil.prototype.addValidationToType = function (oType) {
		var fnOriginalValidateValue;

		if (!oType) {
			return; // Do not modify type
		}

		fnOriginalValidateValue = oType.validateValue;
		if (this._isComboBoxValidationStrict()) {
			// Wrapper validation method
			oType.validateValue = function (sValue) {
				var oControl = this.oSmartField._oControl.edit;

				// Throw validation exception if no item is selected
				if (this._isComboBoxValueInvalid(oControl, oType, sValue)) {
					if (oControl.getTextArrangement() === "descriptionOnly") {
						throw new ValidateException(this.oRB.getText("SMARTFIELD_NOT_UNIQUE"));
					} else {
						throw new ValidateException(this.oRB.getText("SMARTFIELD_NOT_FOUND"));
					}
				}

				return fnOriginalValidateValue.apply(this, arguments);
			}.bind(this);
		} else {
			oType.validateValue = function () {
				try {
					fnOriginalValidateValue.apply(oType, arguments);
				} catch (e) {
					throw new ValidateException(this.oRB.getText("SMARTFIELD_NOT_FOUND"));
				}
			}.bind(this);
		}
	};

	ValidationUtil.prototype._isLegacyMode = function () {
		var oSF = this.oSmartField;
		return oSF._isFixedValueList() && oSF.getFixedValueListValidationEnabled();
	};

	ValidationUtil.prototype._isComboBoxValidationStrict = function () {
		if (this._isLegacyMode()) {
			return false;
		}

		return this.oSmartField._getComputedTextInEditModeSource() === TextInEditModeSource.ValueList;
	};

	ValidationUtil.prototype._isComboBoxValidationWarning = function () {
		if (this._isLegacyMode()) {
			return false;
		}

		return this.oSmartField._isValueListWarning();
	};

	return ValidationUtil;

}, true);
