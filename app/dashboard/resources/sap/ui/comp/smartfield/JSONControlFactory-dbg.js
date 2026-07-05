/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Factory class to create controls that are hosted by <code>sap.ui.comp.smartfield.SmartField</code>.
 *
 * @name sap.ui.comp.smartfield.JSONControlFactory
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @returns {sap.ui.comp.smartfield.JSONControlFactory} new control factory instance.
 */
sap.ui.define([
	"sap/m/CheckBox",
	"sap/m/ComboBox",
	"sap/m/DatePicker",
	"sap/m/Input",
	"sap/m/Text",
	"sap/ui/comp/smartfield/ControlFactoryBase",
	"sap/ui/comp/smartfield/JSONTypes"
], function(CheckBox, ComboBox, DatePicker, Input, Text, ControlFactoryBase, JSONTypes) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {sap.ui.model.json.JSONModel} oModel the JSON model currently used.
	 * @param {sap.ui.core.Control} oParent the parent control.
	 * @param {object} oMetaData the meta data used to initialize the factory.
	 * @param {object} oMetaData.model the name of the model.
	 * @param {object} oMetaData.path the path identifying the JSON property.
	 */
	var JSONControlFactory = ControlFactoryBase.extend("sap.ui.comp.smartfield.JSONControlFactory", {
		constructor: function(oModel, oParent, oMetaData) {
			ControlFactoryBase.apply(this, [
				oModel, oParent
			]);
			this.sName = "JSONControlFactory";
			this._oMetaData = oMetaData;
			this._oTypes = new JSONTypes();
		}
	});

	/**
	 * Returns the name of a method to create a control.
	 *
	 * @returns {string} the name of the factory method to create the control.
	 * @private
	 */
	JSONControlFactory.prototype._getCreator = function() {
		var mMethods = {
			"Boolean": "_createBoolean",
			"Date": "_createDate",
			"DateTime": "_createString",
			"Float": "_createString",
			"Integer": "_createString",
			"String": "_createString"
		};

		if (!this._oParent.getEditable() || !this._oParent.getEnabled()) {
			if (this._oParent.getJsontype() === "Boolean") {
				return "_createBoolean";
			}

			return "_createDisplay";
		}

		return mMethods[this._oParent.getJsontype()] || "_createString";
	};

	/**
	 * Creates a control instance to edit a model property of type <code>String</code>, <code>Integer</code> or <code>Float</code>. Either
	 * <code>sap.m.Input</code> is returned or <code>sap.m.Combobox</code> depending on configuration.
	 *
	 * @returns {sap.ui.core.Control} the new control instance.
	 * @private
	 */
	JSONControlFactory.prototype._createString = function() {
		var bNoValueHelp, bNoTypeAhead, mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			name: true,
			maxLength: true
		};

		// get the configuration properties.
		bNoValueHelp = !this._oParent.getShowValueHelp();
		bNoTypeAhead = !this._oParent.getShowSuggestion();

		// create and return a combo box, if it has been configured.
		if (bNoValueHelp) {
			if (((this._oParent.data("controlType") === "dropDownList"))) {
				return this._createComboBox({
					annotation: null,
					noDialog: bNoValueHelp,
					noTypeAhead: true
				});
			}
		}

		return {
			control: new Input(this.createAttributes("value", this._oParent.getJsontype(), mNames, {
				event: "change",
				parameter: "value"
			})),
			onCreate: "_onCreate",
			noDialog: bNoValueHelp,
			noTypeAhead: bNoTypeAhead,
			params: {
				getValue: "getValue"
			}
		};
	};

	/**
	 * Creates an instance of <code>sap.m.Combobox</code> based on OData meta data.
	 *
	 * @param {object} oValueHelp the value help configuration.
	 * @param {object} oValueHelp.annotation the value help annotation.
	 * @param {object} oValueHelp.noDialog if set to <code>true</code> the creation of a value help dialog is omitted.
	 * @param {object} oValueHelp.noTypeAhead if set to <code>true</code> the type ahead functionality is omitted.
	 * @returns {sap.m.Combobox} the new control instance.
	 * @private
	 */
	JSONControlFactory.prototype._createComboBox = function(oValueHelp) {
		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			name: true
		};

		return {
			control: new ComboBox(this.createAttributes("value", this._oParent.getJsontype(), mNames, {
				event: "selectionChange",
				parameter: "selectedItem"
			})),
			onCreate: "_onCreate",
			params: {
				valuehelp: oValueHelp,
				getValue: "getValue"
			}
		};
	};

	/**
	 * Creates a control instance to edit a model property that is of type <code>Boolean</code>
	 *
	 * @returns {sap.m.CheckBox} the new control instance.
	 * @private
	 */
	JSONControlFactory.prototype._createBoolean = function() {
		var mAttributes = this.createAttributes("selected", this._oParent.getJsontype(), {}, {
			event: "select",
			parameter: "selected"
		});
		mAttributes.enabled = this._oParent.getEditable() && this._oParent.getEnabled();

		return {
			control: new CheckBox(mAttributes),
			onCreate: "_onCreate",
			params: {
				getValue: "getSelected"
			}
		};
	};

	/**
	 * Creates a control instance to edit a model property of type <code>Date</code>.
	 *
	 * @returns {sap.m.DatePicker} the new control instance.
	 * @private
	 */
	JSONControlFactory.prototype._createDate = function() {
		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			name: true
		};

		return {
			control: new DatePicker(this.createAttributes("value", this._oParent.getJsontype(), mNames, {
				event: "change",
				parameter: "value"
			})),
			onCreate: "_onCreate",
			params: {
				getValue: "getValue"
			}
		};
	};

	/**
	 * Creates a control instance for display-only use cases.
	 *
	 * @returns {sap.m.Text} the new control instance.
	 * @private
	 */
	JSONControlFactory.prototype._createDisplay = function() {
		var mNames = {
			width: true,
			textAlign: true
		};

		return {
			control: new Text(this.createAttributes("text", this._oParent.getJsontype(), mNames))
		};
	};

	/**
	 * Event handler, that is invoked after successful creation of a nested control.
	 *
	 * @param {sap.ui.core.Control} oControl the new control.
	 * @param {map} mParams parameters to further define the behavior of the event handler.
	 * @private
	 */
	JSONControlFactory.prototype._onCreate = function(oControl, mParams) {
		var sGetValue;

		// place validations.
		this.addValidations(oControl, "setSimpleClientError");

		// add optional getValue call-back.
		if (mParams.getValue) {
			sGetValue = mParams.getValue;
			mParams.getValue = function() {
				return oControl[sGetValue]();
			};
		}
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	JSONControlFactory.prototype.destroy = function() {
		this._oTypes.destroy();
		this._oTypes = null;
		this._oMetaData = null;

		ControlFactoryBase.prototype.destroy.apply(this, []);
	};

	return JSONControlFactory;
}, true);