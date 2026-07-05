/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartform.GroupElement.
sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/Element',
	'sap/ui/core/Control',
	'sap/ui/layout/form/FormElement',
	'sap/m/Label',
	'sap/m/Button', // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
	'sap/m/Text', // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
	'sap/ui/comp/smartfield/SmartLabel',
	'sap/ui/comp/smartfield/SmartField',
	"sap/base/Log"
], function(library, Element, Control, FormElement, Label, Button, Text, SmartLabel, SmartField, Log) {
	"use strict";

	var VBox;
	var HBox;
	var FlexItemData;
	var VariantLayoutData;
	var GridData;

	// shortcut for sap.ui.comp.smartfield.ControlContextType
	var ControlContextType = library.smartfield.ControlContextType;

	/**
	 * Constructor for a new smartform/GroupElement.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class A GroupElement is a combination of one label and different controls associated to this label.
	 * @extends sap.ui.layout.form.FormElement
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartform.GroupElement
	 */
	var GroupElement = FormElement.extend("sap.ui.comp.smartform.GroupElement", /** @lends sap.ui.comp.smartform.GroupElement.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			interfaces: [
				"sap.ui.comp.IFormGroupElement"
			],
			properties: {

				/**
				 * Specifies whether the groups shall be rendered in a <code>ResponsiveLayout</code> with label on top of the group element.
				 * Each group will be rendered in a new line.
				 *
				 * <b>Note:</b> If <code>Group</code> is assigned to a <code>SmartForm</code> control,
				 * this property is inherited from the <code>SmartForm</code> control.
				 *
				 * So don't set it to a different value from the one in the <code>SmartForm</code> control. For performance reasons it might
				 * make sense to set it manually to the same value as the one in the <code>SmartForm</code> control when creating the <code>GroupElement</code> element.
				 *
				 * @deprecated As of version 1.86, replaced by {@link sap.ui.comp.smartform.ColumnLayout ColumnLayout} in the <code>layout</code> aggregation of the <code>SmartForm</code> control.
				 */
				useHorizontalLayout: {
					type: "boolean",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				},

				/**
				 * Specifies the minimal size in pixels of all group elements of the form if horizontal Layout is used.
				 *
				 * <b>Note:</b> If <code>Group</code> is assigned to a <code>SmartForm</code> control,
				 * this property is inherited from the <code>SmartForm</code> control. So don't set it manually.
				 *
				 * @deprecated Since version 1.48.0, please do not use this property as it does not have any effect on the current layout of the <code>SmartForm</code> control.
				 */
				horizontalLayoutGroupElementMinWidth: {
					type: "int",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				},

				/**
				 * Index of element to be used for label determination
				 */
				elementForLabel: {
					type: "int",
					group: "Misc",
					defaultValue: 0
				}
			},
			defaultAggregation: "elements",
			aggregations: {

				/**
				 * Aggregation of controls to be displayed together with a label.
				 *
				 * <b>Warning:</b> Do not put any layout or other container controls in here.
				 * This could damage the visual layout, keyboard support and screen-reader support.
				 * Only form controls are allowed. Views are also not supported.
				 * Allowed controls implement the interface <code>sap.ui.core.IFormContent</code>.
				 */
				elements: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "element"
				}
			},
			events: {

				/**
				 * The event is fired after the visibility of the control has changed.
				 */
				visibleChanged: {}
			},
			designtime: "sap/ui/comp/designtime/smartform/GroupElement.designtime"
		},
		_bVisibleElements: false,
		_bHorizontalLayoutUsed: false
	});

	GroupElement._myVBox = undefined;

	GroupElement.prototype.init = function(){

		FormElement.prototype.init.apply(this, arguments);

		this._oObserver.observe(this, {
			properties: ["useHorizontalLayout", "horizontalLayoutGroupElementMinWidth", "elementForLabel", "_editable"]
		});

	};

	GroupElement.prototype._getFieldRelevantForLabel = function() {
		var aElements = this.getElements();
		var iIndex = this.getElementForLabel();

		if (aElements.length > iIndex && (aElements[iIndex] instanceof SmartField)) {
			return aElements[iIndex];
		}

		return null;
	};

	GroupElement.prototype._extractFields = function(aElements, bExcludeLabel) {
		var aFields = [];

		aElements.forEach(function(oElement) {
			if (oElement instanceof VBox || oElement instanceof HBox) {
				aFields = aFields.concat(oElement.getItems());
			} else {
				aFields.push(oElement);
			}
		});

		if (aFields.some(function(oElement) {
			return oElement instanceof VBox || oElement instanceof HBox;
		})) {
			aFields = this._extractFields(aFields);
		}

		if (bExcludeLabel) {
			aFields = aFields.filter(function(oField) {
				return !(oField instanceof Label);
			});
		}

		return aFields;
	};

	GroupElement.prototype.setTooltip = function(vTooltip) {

		FormElement.prototype.setTooltip.apply(this, [vTooltip]);

		var oRelevantField = this._getFieldRelevantForLabel();
		var oLabel = this._getLabel();
		_setTooltipToLabel.call(this, oLabel, oRelevantField);

		return this;

	};

	/*
	 * If a <code>Label</code> control is assigned to the <code>GroupElement</code> and this
	 * <code>Label</code> control has a tooltip, use this tooltip. (As also the text of the given
	 * <code>Label</code> control is used.)
	 * Otherwise use the tooltip of the <code>GroupElement</code>
	 */
	function _setTooltipToLabel(oLabel, oRelevantField) {

		if (oLabel == this._oSetLabel) {
			return;  // don't change label set from outside
		}

		var sTooltip;

		if (this._oSetLabel && this._oSetLabel instanceof Control) {
			sTooltip = _getTooltipString.call(this._oSetLabel);
		}

		if (!sTooltip) {
			sTooltip = _getTooltipString.call(this);
		}

		if (sTooltip) {
			if (oLabel instanceof SmartLabel) {
				if (oRelevantField && oRelevantField.setTooltipLabel) {
					oRelevantField.setTooltipLabel(sTooltip);
				}
			} else {
				oLabel.setTooltip(sTooltip);
			}
		}

	}

	GroupElement.prototype.setLabel = function(oLabel) {

		if (!oLabel && this._bMoveLabelToVBox) {
			// Label is just removed as moved to VBox -> only update aggregation
			return this.setAggregation("label", oLabel);
		}

		if (this._oSetLabel && (typeof this._oSetLabel !== "string")) {
			this._oSetLabel.detachEvent("_change", _handleLabelChanged, this);
		}

		var oOldLabel;
		var sOldLabel;
		var oSmartField;

		if (typeof oLabel === "string") {
			// label is stored in this._oLabel
			oOldLabel = this._getLabel();
			if (oOldLabel) {
				sOldLabel = oOldLabel.getText();
			}
		} else if (!oLabel && this._oSetLabel) {
			sOldLabel = this.getLabelText();
		}

		// use standard logic
		FormElement.prototype.setLabel.apply(this, [oLabel]);

		// just store given Label to access it easily
		this._oSetLabel = oLabel;
		_setLabelToVBox.call(this);

		if (typeof oLabel === "string") {
			// label is stored in this._oLabel
			if (this._oLabel instanceof SmartLabel && oLabel != sOldLabel && (oLabel.length > 0 || sOldLabel.length > 0)) {
				oSmartField = this._getFieldRelevantForLabel();
				if (oSmartField && oLabel != null) {
					if (oSmartField.getComputedTextLabel) {
						if (!oSmartField._oTextLabelSetByGroupElement) {
							oSmartField._oTextLabelSetByGroupElement = {oldText: oSmartField.getComputedTextLabel()};
						}
						oSmartField.setTextLabel(oLabel);
					}
				}
			}
			if (!this._bHorizontalLayoutUsed) {
				this.setAggregation("_label", this._oLabel, true); // use Aggregation to allow model inheritance
			}
			this._oLabel.isRequired = _labelIsRequired; // use GroupElements logic
			this._oLabel.isDisplayOnly = _labelIsDisplayOnly; // use GroupElements logic
		} else {
			if (oLabel) {
				if (oLabel.isRequired) {
					oLabel.isRequired = _labelIsRequired; // use GroupElements logic
				}
				if (oLabel.isDisplayOnly) {
					oLabel.isDisplayOnly = _labelIsDisplayOnly; // use GroupElements logic
				}
				oLabel.attachEvent("_change", _handleLabelChanged, this);
			} else {
				oSmartField = this._getFieldRelevantForLabel();
				if (oSmartField) {
					_restoreTextLabel.call(this, oSmartField, sOldLabel);
				}
			}
			this.updateLabelOfFormElement(); // maybe new SmartLabel needs to be created
		}

		return this;

	};

	GroupElement.prototype.destroyLabel = function() {

		var sOldLabel = this.getLabelText();

		// use standard logic
		FormElement.prototype.destroyLabel.apply(this);

		delete this._oSetLabel;
		_setLabelToVBox.call(this);

		var oSmartField = this._getFieldRelevantForLabel();
		if (oSmartField) {
			_restoreTextLabel.call(this, oSmartField, sOldLabel);
		}

		this.updateLabelOfFormElement(); // maybe new SmartLabel needs to be created

		return this;

	};

	function _handleLabelChanged(oEvent) {

		if (oEvent.getParameter("name") == "text") {
			var oLabel = oEvent.oSource;
			var sText = oLabel.getText();

			if (this._oLabel) {
				this._oLabel.setText(sText);
			}

			var oSmartField = this._getFieldRelevantForLabel();
			if (oSmartField && oSmartField.getComputedTextLabel) {
					if (!oSmartField._oTextLabelSetByGroupElement) {
						oSmartField._oTextLabelSetByGroupElement = {oldText: oSmartField.getComputedTextLabel()};
					}
					oSmartField.setTextLabel(sText);
			}
		}

	}

	function _setLabelToVBox() {

		if (!this._bHorizontalLayoutUsed) {
			return;
		}

		var aFields = this.getFields();
		var oOldLabel;

		if (aFields.length > 0) {
			var oVBox = this.getFields()[0];
			if (oVBox instanceof VBox) {
				var aItems = oVBox.getItems();
				var oNewLabel = this._getLabel();
				if (aItems.length > 0 && aItems[0] instanceof Label) {
					oOldLabel = aItems[0];
				}

				this._bMoveLabelToVBox = true;

				if (oOldLabel && oOldLabel != oNewLabel) {
					oVBox.removeItem(0);
					if (oOldLabel._bCreatedByGroupElement) {
						// own Label
						this.setAggregation("_label", oOldLabel, true); // use Aggregation to allow model inheritance
					} else {
						// Label set from outside -> back to aggregation
						this.setAggregation("label", oOldLabel);
					}
				}
				if (oNewLabel && oOldLabel != oNewLabel) {
					oVBox.insertItem(oNewLabel, 0);
				}

				this._bMoveLabelToVBox = false;
				_updateLabelFor.call(this);
			}
		}

	}

	function _labelIsRequired(){

		if (this.getRequired && this.getRequired()) {
			return true;
		}

		var oGroupElement = this.getParent();
		if (oGroupElement && oGroupElement.isA("sap.m.VBox")) {
			oGroupElement = oGroupElement.getParent();
		}

		var aFields = oGroupElement.getElements();

		for ( var i = 0; i < aFields.length; i++) {
			var oField = aFields[i];
			if (oField.getRequired && oField.getRequired() === true &&
					(!oField.getEditable || oField.getEditable()) &&
					(!oField.getContextEditable || oField.getContextEditable())) {
				return true;
			}
		}

		return false;

	}

	function _labelIsDisplayOnly(){

		if (this.getDisplayOnly) {
			if (!this.isPropertyInitial("displayOnly")) {
				return this.getDisplayOnly();
			}

			var oGroupElement = this.getParent();
			if (oGroupElement && oGroupElement.isA("sap.m.VBox")) {
				oGroupElement = oGroupElement.getParent();
			}
			var oGroup = oGroupElement.getParent();

			if (oGroup) {
				var oForm = oGroup.getParent();

				if (oForm) {
					return !oForm.getEditable();
				}
			}
		}

		return false;

	}


	function _labelIsWrapping(){

		// If GroupElement creates own Label, check wrapping property of original set Label
		// use this function only for Labels created by GroupElement

		var oGroupElement = this.getParent();
		if (oGroupElement && oGroupElement.isA("sap.m.VBox")) {
			oGroupElement = oGroupElement.getParent();
		}

		if (oGroupElement._oSetLabel && !(typeof oGroupElement._oSetLabel === "string") &&
				oGroupElement._oSetLabel.getWrapping && !oGroupElement._oSetLabel.isPropertyInitial("wrapping")) {
			return oGroupElement._oSetLabel.getWrapping();
		}

		return true;

	}

	// overwrite for case VBox is used
	function _updateLabelFor(){

		var oField = this._getFieldRelevantForLabel();

		if (oField) {
			if (this._oLabel) {
				this._oLabel.setLabelFor(oField); // as Label is internal of FormElement, we can use original labelFor
			}
			return; // use SmartField logic
		}

		var aFields = this.getFields();
		oField = aFields.length > 0 ? aFields[0] : null;

		if (oField instanceof VBox) {
			var aItems = oField.getItems();
			if (aItems[1] instanceof HBox) {
				oField = aItems[1].getItems()[0];
			} else {
				oField = aItems[1];
			}
		}

		var oLabel = this._oLabel;
		if (oLabel) {
			oLabel.setLabelFor(oField); // as Label is internal of FormElement, we can use original labelFor
		} else {
			oLabel = this.getLabel();
			if (oLabel instanceof Control /*might also be a string*/) {
				oLabel.setAlternativeLabelFor(oField);
			}
		}

	}

	GroupElement.prototype.getLabel = function() {

		return this._oSetLabel;

	};

	/**
	 * Returns the internal Label independent whether it comes direct from <code>GroupElement</code> or from internal used <code>VBox</code>
	 *
	 * @returns {object} which represents the internal Label
	 * @private
	 */
	GroupElement.prototype._getLabel = function() {

		if (this._oLabel) {
			return this._oLabel;
		} else {
			return this._oSetLabel;
		}

	};

	// this function is used to get the rendered Label. If Label is in VBox it should not be rendered by Form
	GroupElement.prototype.getLabelControl = function() {

		if (this._bHorizontalLayoutUsed) {
			return null;
		} else {
			return this._getLabel();
		}

	};

	/**
	 * Returns the text of the label.
	 *
	 * @returns {string} text of the label.
	 * @public
	 */
	GroupElement.prototype.getLabelText = function() {
		var sLabel = "";

		var oLabel = this._getLabel();
		if (oLabel) {
			sLabel = oLabel.getText();
		}

		return sLabel;
	};

	/**
	 * Try to return label from data source from SmartField from which label is generated
	 * @private
	 * @ui5-restricted sap.ui.comp.smartform.flexibility.changes.RenameField
	 * @returns {string|undefined}
	 */
	GroupElement.prototype.getDataSourceLabel = function () {
		var oSmartField = this._getFieldRelevantForLabel();
		if (oSmartField && oSmartField.isA("sap.ui.comp.smartfield.SmartField")) {
			return oSmartField.getDataSourceLabel();
		}
	};

	GroupElement.prototype._createLabel = function(sLabel) {
		var oLabel = null;
		var oField = this._getFieldRelevantForLabel();

		if (oField) {
			if (oField.getShowLabel && oField.getShowLabel()) {
				oLabel = new SmartLabel(oField.getId() + '-label');
				if (sLabel) {
					if (!oField._oTextLabelSetByGroupElement) {
						oField._oTextLabelSetByGroupElement = {oldText: oField.getComputedTextLabel()};
					}
					oField.setTextLabel(sLabel);
					oLabel.setText(sLabel);
				}
				oLabel.setLabelFor(oField);
			}
		} else {
			// create label with empty text too
			oLabel = new Label(this.getId() + "-label", {text: sLabel});
		}

		if (oLabel) {
			oLabel._bCreatedByGroupElement = true;
			oLabel.isRequired = _labelIsRequired;
			oLabel.isDisplayOnly = _labelIsDisplayOnly;
			oLabel.isWrapping = _labelIsWrapping;
			this._oLabel = oLabel;
			if (!this._bHorizontalLayoutUsed) {
				// if in VBox not needed to set parent here
				this.setAggregation("_label", oLabel, true); // use Aggregation to allow model inheritance
			}
			if (this._oSetLabel && typeof this._oSetLabel !== "string") {
				// remove assignment of unused label to field
				this._oSetLabel.setAlternativeLabelFor(null);
			}
		}

		return oLabel;
	};

	/*
	 * If there is a SmartField used to determine a Label create an internal SmartLabel.
	 * Otherwise use provided Label
	 * If no label is provided at all create empty label - so there is always a label
	 * If a Label was provided always use it's text, only if no Label provided use Label text of SmartField
	 */
	GroupElement.prototype.updateLabelOfFormElement = function() {
		var bCreated = false, sOldText = null;
		var aElements = this.getElements();

		var oRelevantField = this._getFieldRelevantForLabel();
		var oLabel = this._getLabel();
		var bDestroy = false;

		if (oLabel && oLabel._bCreatedByGroupElement) {
			// check if Label is still valid
			if (oLabel instanceof SmartLabel) {
				// check if Label fits to SmartField
				if (!oRelevantField || (oLabel._sSmartFieldId && oLabel._sSmartFieldId != oRelevantField.getId())) {
					bDestroy = true;
				}
			} else if (oRelevantField){
				// SmartLabel needed
				bDestroy = true;
			}

			if (bDestroy) {
				oLabel.destroy();
				delete this._oLabel;
				oLabel = null;
				if (this._oSetLabel && !oRelevantField) {
					// original Label exist and no SmartLabel needed -> go back to original Label
					// go back to original Label
					if (typeof this._oSetLabel === "string") {
						FormElement.prototype.setLabel.apply(this, [this._oSetLabel]);
						oLabel = this._oLabel;
						this._oLabel.isRequired = _labelIsRequired; // use GroupElements logic
						this._oLabel.isDisplayOnly = _labelIsDisplayOnly; // use GroupElements logic
					} else {
						oLabel = this._oSetLabel;
					}
					_setLabelToVBox.call(this);
				}
			}
		} else if (oLabel && oRelevantField) {
			// Label set from outside but SmartLabel needed
			if (oLabel == this._oLabel) {
				// destroy internal Label
				oLabel.destroy();
				delete this._oLabel;
			}
			oLabel = null; // don't use set Label
		}

		if (!oLabel) {
			if (this._oSetLabel) {
				// Label destroyed -> get text of original Label
				if (typeof this._oSetLabel === "string") {
					sOldText = this._oSetLabel;
				} else {
					sOldText = this._oSetLabel.getText();
				}
			} else {
				sOldText = "";
			}
		}

		if (!oLabel && aElements.length > 0) {
			// new Label needed
			oLabel = this._createLabel(sOldText);
			bCreated = true;
		}

		if (oLabel) {
			if (oLabel instanceof SmartLabel) {
				if (oRelevantField && oRelevantField.setTextLabel && oRelevantField.getComputedTextLabel()) {
					// if the label was implicitly created and the SF has a textLabel -> set the same a label text
					oLabel.setText(oRelevantField.getComputedTextLabel());
				}
			}

			_setTooltipToLabel.call(this, oLabel, oRelevantField);

		}

		if (bCreated) {
			_setLabelToVBox.call(this);

			if (oLabel && oLabel.setLabelFor && !(oLabel instanceof SmartLabel) && !oRelevantField && (aElements.length > 0)) {
				oLabel.setLabelFor(aElements[0]);
			}

		}

	};

	/**
	 * Setter for property editable of all smart fields in children hierarchy.
	 *
	 * @param {boolean} bEditMode new value for editable property of smart fields.
	 * @returns {this} <code>this</code> to allow method chaining.
	 * @public
	 * @deprecated Since version 1.74.0, please do not change the edit mode on groupElement level, let the SmartForm inheritance do it
	 */
	GroupElement.prototype.setEditMode = function(bEditMode) {

		this._setEditable(bEditMode);
		return this;

	};

	function _editableChanged(bEditable) {

		var aElements = this.getElements();

		for (var i = 0; i < aElements.length; i++) {
			var oElement = aElements[i];
			_changeEditableOnField.call(this, oElement, bEditable);
		}

	}

	function _changeEditableOnField(oField, bEditable) {

		if (oField instanceof SmartField) {
			if (!(oField.data("editable") === false)) {
				oField.setContextEditable(bEditable);
			}
		}

	}

	GroupElement.prototype.invalidateLabel = function(){

		var oLabel = this._getLabel();

		if (oLabel) {
			oLabel.invalidate();
		}

	};

	/**
	 * Updates the visibility of the <code>FormElement</code>
	 *
	 * @private
	 */
	GroupElement.prototype._updateFormElementVisibility = function() {

		var bVisible = this.getVisibleBasedOnElements();
		if (this._bVisibleElements !== bVisible) {
			this._bVisibleElements = bVisible;
			if (this.isPropertyInitial("visible")) {
				// as property can over rule the elements settings
				_visibilityChanged.call(this);
				this.invalidate(); // to force re-rendering
			}
		}

	};

	GroupElement.prototype._updateLayout = function() {

		var oVBox = null;
		var oHBox = null;
		var oLayoutData = null;
		var bUseHorizontalLayout = this.getUseHorizontalLayout && this.getUseHorizontalLayout();
		var aVBoxContent;
		var iIndex = 0;
		var oField;

		if (bUseHorizontalLayout == this._bHorizontalLayoutUsed) {
			// layout has not changed
			return;
		}

		if (bUseHorizontalLayout && !_checkVBoxLoaded.call(this)) {
			// VBox must be loaded async, perform later, if loaded
			return;
		}

		// get Fields corresponding to old layout
		var aElements = this.getElements();
		var oLabel = this._getLabel();

	// as fieldsAggregation is changed while moving fields from and to VBox prevent change on observer
		this._bNoObserverChange = true;

		if (bUseHorizontalLayout) {
			if (aElements.length > 0) {
				// insert internal layouts
				// keep layout data
				if (aElements[0].getLayoutData()) {
					oLayoutData = aElements[0].getLayoutData();
				}
				this.removeAllFields();

				if (aElements.length > 1) {
					// HBox needed
					for (iIndex = 0; iIndex < aElements.length; iIndex++) {
						oField = aElements[iIndex];

						if (iIndex > 0) {
							_addLayoutDataToField.call(this, oField);
						}
					}
					oHBox = _createHBox.call(this, aElements.slice(0));
				}

				if (oHBox) {
					aVBoxContent = [oHBox];
				} else {
					aVBoxContent = aElements.slice(0);
				}

				oVBox = _createVBox.call(this, aVBoxContent, oLabel, oLayoutData);
				this.addField(oVBox);

				if (oLabel) {
					_updateLabelFor.call(this); // as FormElement.addField sets Label to VBox
				}
			}
		} else {
			// remove internal layouts
			var aFields = this.getFields();
			if (aFields[0] instanceof VBox) {
				oVBox = aFields[0];
				aVBoxContent = oVBox.getItems();
				if (aElements.length > 1 && aVBoxContent.length > 0) {
					if (oLabel) {
						if (aVBoxContent.length > 1 && aVBoxContent[1] instanceof HBox) {
							oHBox = aVBoxContent[1];
						}
					} else if (aVBoxContent[0] instanceof HBox) {
						oHBox = aVBoxContent[0];
					}
					if (oHBox) {
						oHBox.removeAllItems();
						oHBox.destroy();
					}
				}
				oVBox.removeAllItems();
				oVBox.destroy();
			}
			this.removeAllFields();
			for (iIndex = 0; iIndex < aElements.length; iIndex++) {
				oField = aElements[iIndex];
				_removeLayoutDataFromField.call(this, oField);
				this.addField(oField);
			}
			if (oLabel) {
				if (oLabel == this._oLabel) {
					this.setAggregation("_label", oLabel, true); // use Aggregation to allow model inheritance
				} else {
					this.setAggregation("label", oLabel);
				}
			}
		}

		this._bHorizontalLayoutUsed = bUseHorizontalLayout;
		this._bNoObserverChange = false;

	};

	function _checkVBoxLoaded() {

		if ((!VBox || !HBox || !FlexItemData || !VariantLayoutData || !GridData) && !this._bVBoxRequested) {
			VBox = sap.ui.require("sap/m/VBox");
			HBox = sap.ui.require("sap/m/HBox");
			FlexItemData = sap.ui.require("sap/m/FlexItemData");
			VariantLayoutData = sap.ui.require("sap/ui/core/VariantLayoutData");
			GridData = sap.ui.require("sap/ui/layout/GridData");
			if (!VBox || !HBox || !FlexItemData || !VariantLayoutData || !GridData) {
				sap.ui.require(["sap/m/VBox", "sap/m/HBox", "sap/m/FlexItemData",
				                "sap/ui/core/VariantLayoutData", "sap/ui/layout/GridData"], _VBoxLoaded.bind(this));
				this._bVBoxRequested = true;
			}
		}
		if (VBox && HBox && FlexItemData && VariantLayoutData && GridData && !this._bVBoxRequested) {
			return true;
		} else {
			return false;
		}

	}

	function _VBoxLoaded(fnVBox, fnHBox, fnFlexItemData, fnVariantLayoutData, fnGridData) {

		VBox = fnVBox;
		HBox = fnHBox;
		FlexItemData = fnFlexItemData;
		VariantLayoutData = fnVariantLayoutData;
		GridData = fnGridData;
		this._bVBoxRequested = false;

		if (!this._bIsBeingDestroyed) {
			this._updateLayout();
		}

	}

	function _addLayoutDataToField(oField) {

		var oLayoutData = oField.getLayoutData();
		if (oLayoutData) {
			if (oLayoutData.getStyleClass && !oLayoutData.getStyleClass()) {
				oLayoutData.setStyleClass("sapUiCompGroupElementHBoxPadding");
			}
		} else {
			oLayoutData = new FlexItemData({
				styleClass: "sapUiCompGroupElementHBoxPadding"
			});
			oLayoutData._bCreatedByGroupElement = true;
			oField.setLayoutData(oLayoutData);
		}

	}

	function _removeLayoutDataFromField(oField) {

		var oLayoutData = oField.getLayoutData();
		if (oLayoutData) {
			if (oLayoutData._bCreatedByGroupElement) {
				oLayoutData.destroy();
			} else if (oLayoutData.getStyleClass && oLayoutData.getStyleClass() == "sapUiCompGroupElementHBoxPadding") {
				oLayoutData.setStyleClass();
			}
		}

	}

	function _createVBox(aFields, oLabel, oLayoutData) {

		if (!GroupElement._myVBox) {
			// use own VBox to have a valid Form content
			GroupElement._myVBox = VBox.extend("SmartFormVBox", {
				metadata: {
					interfaces : ["sap.ui.core.IFormContent"]
				},
				enhanceAccessibilityState: _enhanceAccessibilityStateVBox,
				renderer: {
					apiVersion: 2
				}
			});
		}

		this._bMoveLabelToVBox = true;

		var aContent = aFields.slice(0);
		if (oLabel) {
			aContent.splice(0, 0, oLabel);
		}

		var oVBox = new GroupElement._myVBox( this.getId() + "--VBox", {
			"items": aContent
		});

		this._bMoveLabelToVBox = false;

		oVBox.addStyleClass("sapUiCompGroupElementVBox");
		oVBox._oGroupElement = this;

		if (oLayoutData &&
				(oLayoutData instanceof GridData || oLayoutData instanceof VariantLayoutData ||
				 oLayoutData.isA("sap.ui.layout.ResponsiveFlowLayoutData"))) {
			// clone original LayoutData and don't remove them from Field
			// only clone LayoutData relevant for Form
			oVBox.setLayoutData(oLayoutData.clone());
		}

		_updateVBoxGridDataSpan.call(this, oVBox); // get Spans from SmartForms Layout

		return oVBox;

	}

	function _createHBox(aContent) {

		var oHBox = new HBox( this.getId() + "--HBox", {
			"items": aContent
		});

		oHBox._oGroupElement = this;
		oHBox.enhanceAccessibilityState = _enhanceAccessibilityStateVBox;

		return oHBox;

	}

	function _enhanceAccessibilityStateVBox(oElement, mAriaProps) {

		var oLabel = this._oGroupElement._getLabel();
		if (oLabel && oLabel != oElement && !(oElement instanceof HBox)) {

			var sLabelledBy = mAriaProps["labelledby"];
			if (!sLabelledBy) {
				sLabelledBy = oLabel.getId();
			} else {
				var aLabels = sLabelledBy.split(" ");
				if (((aLabels ? Array.prototype.indexOf.call(aLabels, oLabel.getId()) : -1)) < 0) {
					aLabels.splice(0, 0, oLabel.getId());
					sLabelledBy = aLabels.join(" ");
				}
			}
			mAriaProps["labelledby"] = sLabelledBy;

		}

	}

	/*
	 * gets the Span data from the SmartForm to create and update the gridData of the VBox
	 */
	GroupElement.prototype._updateGridDataSpan = function() {

		if (!this._bHorizontalLayoutUsed) {
			return;
		}

		var aFields = this.getFields();
		if (aFields.length > 0) {
			var oVBox = aFields[0];
			if (oVBox instanceof VBox) {
				_updateVBoxGridDataSpan.call(this, oVBox);
			}
		}

	};

	function _updateVBoxGridDataSpan(oVBox) {

		var oGroup = this.getParent();
		if (!oGroup || !oGroup.addGroupElement) {
			return;
		}

		var oSmartForm = oGroup.getParent();
		while (oSmartForm && !oSmartForm.addGroup && oSmartForm.getParent) {
			// could be Form and Panel
			oSmartForm = oSmartForm.getParent();
		}

		if (!oSmartForm) {
			return;
		}

		var sSpan = "";
		var oLayout = oSmartForm.getLayout();

		if (oLayout) {
			sSpan = oLayout.getGridDataSpan();
		}

		var oLayoutData = oVBox.getLayoutData();
		var oNewLayoutData;

		if (oLayoutData) {
			if (!(oLayoutData instanceof GridData) && !(oLayoutData instanceof VariantLayoutData) && sSpan) {
				oNewLayoutData = new GridData({
					span: sSpan
				});
				oNewLayoutData._bFromGroupElement = true;
				var oVariantLayout = new VariantLayoutData({
					multipleLayoutData: [oLayoutData, oNewLayoutData]
				});
				oVariantLayout._bFromGroupElement = true;
				oVBox.setLayoutData(oVariantLayout);
			} else if (oLayoutData instanceof GridData) {
				if (oLayoutData._bFromGroupElement) {
					// only update own GridData
					if (!sSpan) {
						oLayoutData.destroy();
					} else {
						oLayoutData.setSpan(sSpan);
					}
				}
			} else if (oLayoutData instanceof VariantLayoutData) {
				var bFound = false;
				oLayoutData.getMultipleLayoutData().forEach(function(oLayoutData) {
					if (oLayoutData instanceof GridData) {
						bFound = true;
						if (oLayoutData._bFromGroupElement) {
							// only update own GridData
							if (!sSpan) {
								oLayoutData.destroy();
							} else {
								oLayoutData.setSpan(sSpan);
							}
						}
					}
				});
				if (!bFound && sSpan) {
					oNewLayoutData = new GridData({
						span: sSpan
					});
					oNewLayoutData._bFromGroupElement = true;
					oLayoutData.addMultipleLayoutData(oNewLayoutData);
				}
				if (oLayoutData._bFromGroupElement && oLayoutData.getMultipleLayoutData().length == 1) {
					oNewLayoutData = oLayoutData.getMultipleLayoutData()[0];
					oVBox.setLayoutData(oNewLayoutData);
					oLayoutData.destroy();
				}
			}
		} else if (sSpan) {
			oNewLayoutData = new GridData({
				span: sSpan
			});
			oNewLayoutData._bFromGroupElement = true;
			oVBox.setLayoutData(oNewLayoutData);
		}

		var aElements = this.getElements();
		for (var i = 0; i < aElements.length; i++) {
			var oElement = aElements[i];
			if (oElement && oElement.setControlContext) {
				if (sSpan) {
					oElement.setControlContext(ControlContextType.SmartFormGrid);
				} else {
					oElement.setControlContext(ControlContextType.Form);
				}
			}
		}

	}

	GroupElement.prototype._setLinebreak = function(bLineBreakXL, bLineBreakL, bLineBreakM, bLineBreakS) {

		if (!this._bHorizontalLayoutUsed) {
			return;
		}

		var aFields = this.getFields();
		if (aFields.length > 0) {
			var oVBox = aFields[0];
			if (!(oVBox instanceof VBox)) {
				return;
			}

			var oLayoutData = oVBox.getLayoutData();

			if (oLayoutData) {
				// LayoutData must be created by _updateVBoxGridDataSpan
				if (oLayoutData instanceof VariantLayoutData) {
					var aLayoutData = oLayoutData.getMultipleLayoutData();
					for (var i = 0; i < aLayoutData.length; i++) {
						oLayoutData = aLayoutData[i];
						if (oLayoutData instanceof GridData) {
							oLayoutData.setLinebreakXL(bLineBreakXL);
							oLayoutData.setLinebreakL(bLineBreakL);
							oLayoutData.setLinebreakM(bLineBreakM);
							oLayoutData.setLinebreakS(bLineBreakS);
						}
					}
				} else if (oLayoutData instanceof GridData) {
					oLayoutData.setLinebreakXL(bLineBreakXL);
					oLayoutData.setLinebreakL(bLineBreakL);
					oLayoutData.setLinebreakM(bLineBreakM);
					oLayoutData.setLinebreakS(bLineBreakS);
				}
			}
		}

	};

	// do not use observer, as change from default to same value will not be recognized
	GroupElement.prototype.setVisible = function(bVisible) {

		var bLastVisible = this.isVisible();

		FormElement.prototype.setVisible.apply(this, arguments);

		if (bLastVisible != bVisible) {
			_visibilityChanged.call(this);
		}

		return this;

	};

	GroupElement.prototype.isVisible = function(){

		if (this.isPropertyInitial("visible")) {
			// use visibility based on elements
			return this._bVisibleElements;
		} else {
			// visible is set -> retutn it
			return this.getVisible();
		}

	};

	function _visibilityChanged() {

		this.fireVisibleChanged({
			visible: this.isVisible()
		});
		if (this.getParent()) {
			this.getParent()._updateLineBreaks();
		}

	}

	/**
	 * Returns the from element.
	 *
	 * @returns {sap.ui.layout.form.FormElement} the form element.
	 * @public
	 */
	GroupElement.prototype.getFormElement = function() {
		return this;
	};

	GroupElement.prototype.addElement = function(oElement) {

		if (!oElement) {
			return this;
		}

		// as "elements" aggregation is not used, at least validate it
		oElement = this.validateAggregation("elements", oElement, /* multiple */ true);

		_enhanceField.call(this, oElement);

		var sLabelSmartFieldId;
		if (this._oLabel && this._oLabel._bCreatedByGroupElement && this._oLabel._sSmartFieldId) {
			sLabelSmartFieldId = this._oLabel._sSmartFieldId;
		}

		if (this._bHorizontalLayoutUsed) {
			_addInsertFieldToVBox.call(this, oElement, undefined, true);
		} else {
			this.addField(oElement);
		}

		if (sLabelSmartFieldId && sLabelSmartFieldId != this._oLabel._sSmartFieldId) {
			// as FormElement always assigns first field to Label, restore old assignment and use GroupElements logic
			this._oLabel.setLabelFor(sLabelSmartFieldId);
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return this;
	};

	GroupElement.prototype.insertElement = function(oElement, iIndex) {

		if (!oElement) {
			return this;
		}

		// as "elements" aggregation is not used, at least validate it
		oElement = this.validateAggregation("elements", oElement, /* multiple */ true);

		_enhanceField.call(this, oElement);

		var sLabelSmartFieldId;
		if (this._oLabel && this._oLabel._bCreatedByGroupElement && this._oLabel._sSmartFieldId) {
			sLabelSmartFieldId = this._oLabel._sSmartFieldId;
		}

		if (this._bHorizontalLayoutUsed) {
			_addInsertFieldToVBox.call(this, oElement, iIndex, false);
		} else {
			this.insertField(oElement, iIndex);
		}

		if (sLabelSmartFieldId && sLabelSmartFieldId != this._oLabel._sSmartFieldId) {
			// as FormElement always assigns first field to Label, restore old assignment and use GroupElements logic
			this._oLabel.setLabelFor(sLabelSmartFieldId);
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return this;

	};

	GroupElement.prototype.getElements = function() {

		var aElements;
		var aFields;

		if (this._bHorizontalLayoutUsed) {
			aElements = this.getFields();
			aFields = this._extractFields(aElements, true);
		} else {
			aFields = this.getFields();
		}

		return aFields;

	};

	GroupElement.prototype.indexOfElement = function(oElement) {

		var iIndex = -1;

		if (this._bHorizontalLayoutUsed) {
			var aElements = this.getElements();
			for (var i = 0; i < aElements.length; i++) {
				if (oElement == aElements[i]) {
					iIndex = i;
					break;
				}
			}
		} else {
			iIndex = this.indexOfField(oElement);
		}

		return iIndex;

	};

	GroupElement.prototype.removeElement = function(vElement) {

		var oResult;

		var sLabelSmartFieldId;
		if (this._oLabel && this._oLabel._bCreatedByGroupElement && this._oLabel._sSmartFieldId) {
			sLabelSmartFieldId = this._oLabel._sSmartFieldId;
		}

		if (this._bHorizontalLayoutUsed) {
			oResult = _removeFieldsFromVBox.call(this, vElement, false);
		} else {
			oResult = this.removeField(vElement);
		}

		if (oResult) {
			_cleanUpField.call(this, oResult);
		}

		if (sLabelSmartFieldId && sLabelSmartFieldId != this._oLabel._sSmartFieldId) {
			// as FormElement always assigns first field to Label, restore old assignment and use GroupElements logic
			this._oLabel.setLabelFor(sLabelSmartFieldId);
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return oResult;

	};

	GroupElement.prototype.removeAllElements = function() {

		var aResult;

		if (this._bHorizontalLayoutUsed) {
			aResult = _removeFieldsFromVBox.call(this, undefined, true);
		} else {
			aResult = this.removeAllFields();
		}

		if (aResult && Array.isArray(aResult)) {
			for (var i = 0; i < aResult.length; i++) {
				_cleanUpField.call(this, aResult[i]);
			}
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return aResult;

	};

	GroupElement.prototype.destroyElements = function() {

		if (this._bHorizontalLayoutUsed) {
			var aFields = this.getFields();
			if (aFields.length > 0) {
				var oLabel = this._getLabel();
				if (oLabel) {
					aFields[0].removeItem(oLabel);
					if (oLabel == this._oLabel) {
						this.setAggregation("_label", oLabel, true); // use Aggregation to allow model inheritance
					} else {
						this.setAggregation("label", oLabel);
					}
				}
				this.destroyFields();
			}
		} else {
			this.destroyFields();
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return this;

	};

	GroupElement.prototype._observeChanges = function(oChanges){

		FormElement.prototype._observeChanges.apply(this, arguments);

		if (oChanges.object == this) {
			// it's the GroupElement
			switch (oChanges.name) {
			case "useHorizontalLayout":
				this._updateLayout();
				break;

			case "horizontalLayoutGroupElementMinWidth":
				Log.error("HorizontalLayoutGroupElementMinWidth is deprecated", this);
				this._updateLayout();
				break;

			case "elementForLabel":
				this.updateLabelOfFormElement();
				break;

			case "_editable":
				_editableChanged.call(this, oChanges.current);
				break;

			default:
				break;
			}
		} else {
			// it's some content control
			_controlChanged.call(this, oChanges);
		}

	};

	function _addInsertFieldToVBox(oField, iIndex, bAdd) {

		var oLabel = this._getLabel();
		var aFields = this.getFields();
		var oVBox;
		var oHBox;
		var aItems;

		if (aFields.length > 0) {
			oVBox = aFields[0];
		} else {
			// is first field
			aItems = [oField];

			// keep LayoutData of first field
			var oLayoutData = oField.getLayoutData();
			oVBox = _createVBox.call(this, aItems, oLabel, oLayoutData);
			this.addField(oVBox);
			if (oLabel) {
				_updateLabelFor.call(this); // as FormElement.addField sets Label to VBox
			}
			return;
		}

		if (!(oVBox instanceof VBox)) {
			return;
		}

		aItems = oVBox.getItems();

		if (oLabel) {
			if (aItems.length > 1) {
				oHBox = aItems[1];
			}
		} else if (aItems.length > 0) {
			oHBox = aItems[0];
		}

		if (oHBox instanceof HBox) {
			// insert field to existing HBox
			aItems = oHBox.getItems();
			if ((bAdd || iIndex > 0) && aItems.length > 0) {
				_addLayoutDataToField.call(this, oField);
			}
			if (bAdd) {
				oHBox.addItem(oField);
			} else {
				if (iIndex == 0 && aItems.length > 0) {
					_addLayoutDataToField.call(this, aItems[0]);
				}
				oHBox.insertItem(oField, iIndex);
			}
		} else {
			var oFirstField = oHBox;
			aItems = [];
			if (oFirstField) {
				// create new HBox and add field
				oVBox.removeItem(oFirstField);
				if (bAdd || iIndex > 0) {
					aItems.push(oFirstField);
					aItems.push(oField);
					_addLayoutDataToField.call(this, oField);
				} else {
					aItems.push(oField);
					aItems.push(oFirstField);
					_addLayoutDataToField.call(this, oFirstField);
				}
				oHBox = _createHBox.call(this, aItems);
				oVBox.addItem(oHBox);
			} else {
				// just add field to VBox
				oVBox.addItem(oField);
			}
			if (oLabel) {
				_updateLabelFor.call(this);
			}
		}

	}

	function _enhanceField(oField) {

		if (oField.getEditable) {
			if (!oField.getEditable()) {
				oField.data("editable", false);
			}
		}

		this._oObserver.observe(oField, {
			properties: ["visible"]
		});
		if (oField.attachInnerControlsCreated) {
			oField.attachInnerControlsCreated(this._updateFormElementLabel, this);
		}
		if (oField.setControlContext) {
			oField.setControlContext(ControlContextType.Form);
		}
		if (oField.getMetadata().getProperty("mandatory")) {
			this._oObserver.observe(oField, {
				properties: ["mandatory"]
			});
		}

		_changeEditableOnField.call(this, oField, this.getProperty("_editable"));

		_inheritCustomData.call(this, oField);

	}

	function _inheritCustomData(oField) {

		if (oField instanceof SmartField) {
			var aCustomData = this.getCustomData();

			for (var i = 0; i < aCustomData.length; i++) {
				_addCustomDataToField.call(this, oField, aCustomData[i]);
			}
		}

	}

	function _addCustomDataToField(oField, oCustomData) {

		if (
			oField instanceof SmartField &&
			library.smartform.inheritCostomDataToFields(oCustomData) &&
			!oField.data(oCustomData.getKey()) // Take care of precedence
		) {
			var oNewCustomData = oCustomData.clone();
			oNewCustomData._bFromGroupElement = true;
			oNewCustomData._sOriginalId = oCustomData.getId();
			oField.addCustomData(oNewCustomData);
		}

	}

	function _controlChanged(oChanges) {

		if (oChanges.name == "mandatory") {
			this.invalidateLabel();
		} else if (oChanges.name == "visible") {
			this._updateFormElementVisibility();
		}

	}

	function _removeFieldsFromVBox(vField, bAll) {

		var oLabel = this._getLabel();
		var aFields = this.getFields();
		var oVBox;
		var oHBox;
		var aItems;
		var vResult;
		var bNoFieldLeft = false;
		var oField;

		if (aFields.length > 0) {
			oVBox = aFields[0];
		}

		if (!(oVBox instanceof VBox)) {
			return null;
		}

		aItems = oVBox.getItems();

		if (oLabel) {
			if (aItems.length > 1) {
				oHBox = aItems[1];
			}
		} else if (aItems.length > 0) {
			oHBox = aItems[0];
		}

		if (oHBox instanceof HBox) {
			// remove from HBox
			if (bAll) {
				vResult = oHBox.removeAllItems();
				bNoFieldLeft = true;
			} else {
				vResult = oHBox.removeItem(vField);
				aItems = oHBox.getItems();
				if (aItems.length > 0) {
					// remove layoutData from first field (happens if first field was removed)
					_removeLayoutDataFromField.call(this, aItems[0]);
					if (aItems.length == 1) {
						// only 1 field feft -> remove HBox
						oField = aItems[0];
						oHBox.removeAllItems();
						oVBox.removeItem(oHBox);
						oHBox.destroy();
						oVBox.addItem(oField);
					}
				}
			}
		} else {
			// remove from VBox (only 1 Field exist)
			if (bAll) {
				vResult = oVBox.removeAllItems();
			} else {
				vResult = oVBox.removeItem(vField);
			}

			if (vResult) {
				bNoFieldLeft = true;
			}
		}

		if (bNoFieldLeft) {
			// remove VBox
			if (oLabel) {
				oVBox.removeItem(oLabel);
				if (oLabel == this._oLabel) {
					this.setAggregation("_label", oLabel, true); // use Aggregation to allow model inheritance
				} else {
					this.setAggregation("label", oLabel);
				}
			}
			this.removeField(oVBox);
			oVBox.destroy();
		}

		if (vResult) {
			if (Array.isArray(vResult)) {
				for (var i = 0; i < vResult.length; i++) {
					oField = vResult[i];
					_removeLayoutDataFromField.call(this, oField);
				}
			} else {
				_removeLayoutDataFromField.call(this, vResult);
			}
		}

		return vResult;

	}

	function _cleanUpField(oField) {

	// how to remove ????
//			if (oField.getEditable) {
//				if (!oField.getEditable()) {
//					oField.data("editable", false);
//				}
//			}

		if (oField.detachInnerControlsCreated) {
			oField.detachInnerControlsCreated(this._updateFormElementLabel, this);
		}
		if (oField.setControlContext) {
			oField.setControlContext(ControlContextType.None);
		}

		_removeInheritedCustomData.call(this, oField);
		_restoreTextLabel.call(this, oField, this.getLabelText());

	}

	function _restoreTextLabel(oField, sLabelText) {

		if (oField._oTextLabelSetByGroupElement) {
			if (oField.getComputedTextLabel() == sLabelText) {
				// if not changed from outside
				oField.setTextLabel(oField._oTextLabelSetByGroupElement.oldText);
			}
			delete oField._oTextLabelSetByGroupElement;
		}

	}

	function _removeInheritedCustomData(oField, sOriginalId) {

		if (oField instanceof SmartField) {
			var aCustomData = oField.getCustomData();
			for (var i = 0; i < aCustomData.length; i++) {
				var oCustomData = aCustomData[i];
				if (oCustomData._bFromGroupElement && (!sOriginalId || sOriginalId == oCustomData._sOriginalId)) {
					oField.removeCustomData(oCustomData);
					oCustomData.destroy();
				}
			}
		}

	}

	GroupElement.prototype._updateFormElementLabel = function(oEvent) {

		var oRelevantField = this._getFieldRelevantForLabel();
		var oLabel = this._getLabel();
		var oSmartField = oEvent.oSource;
		var aInnerElements = oEvent.getParameters();

		if (oLabel instanceof SmartLabel && oSmartField && aInnerElements && oSmartField === oRelevantField) {
			oLabel.updateLabelFor(aInnerElements);
		}

	};

	/**
	 * Adds some customData into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the customData to add; if empty, nothing is added
	 * @returns {this} Reference to <code>this</code> to allow method chaining.
	 * @public
	 */
	GroupElement.prototype.addCustomData = function(oCustomData) {

		if (!oCustomData) {
			return this;
		}

		FormElement.prototype.addCustomData.apply(this, arguments);

		var aElements = this.getElements();

		for (var i = 0; i < aElements.length; i++) {
			_addCustomDataToField.call(this, aElements[i], oCustomData);
		}

		return this;

	};

	/**
	 * Inserts some customData into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the customData to insert; if empty, nothing is inserted
	 * @param {int} iIndex the 0-based index the customData should be inserted at; for a negative value of iIndex, the customData is inserted at position 0; for a value greater than the current size of the aggregation, the customData is inserted at the last position
	 * @returns {this} Reference to <code>this</code> to allow method chaining.
	 * @public
	 */
	GroupElement.prototype.insertCustomData = function(oCustomData, iIndex) {

		if (!oCustomData) {
			return this;
		}

		FormElement.prototype.insertCustomData.apply(this, arguments);

		var aElements = this.getElements();

		for (var i = 0; i < aElements.length; i++) {
			// order doesn't matter
			_addCustomDataToField.call(this, aElements[i], oCustomData);
		}

		return this;

	};

	GroupElement.prototype.removeCustomData = function(vCustomData) {

		var oCustomData = FormElement.prototype.removeCustomData.apply(this, arguments);

		if (oCustomData) {
			var aElements = this.getElements();
			for (var i = 0; i < aElements.length; i++) {
				_removeInheritedCustomData.call(this, aElements[i], oCustomData.getId());
			}
		}

		return oCustomData;

	};

	GroupElement.prototype.removeAllCustomData = function() {

		var aCustomData = FormElement.prototype.removeAllCustomData.apply(this, arguments);

		if (aCustomData.length > 0) {
			var aElements = this.getElements();
			for (var i = 0; i < aElements.length; i++) {
				_removeInheritedCustomData.call(this, aElements[i]);
			}
		}

		return aCustomData;

	};

	GroupElement.prototype.destroyCustomData = function() {

		FormElement.prototype.destroyCustomData.apply(this, arguments);

		var aElements = this.getElements();
		for (var i = 0; i < aElements.length; i++) {
			_removeInheritedCustomData.call(this, aElements[i]);
		}

		return this;

	};

	/**
	 * Determines the visibility of a <code>GroupElement</code> based on elements
	 *
	 * @returns {boolean} Returns true, in case one element of the group element is visible
	 * @public
	 */
	GroupElement.prototype.getVisibleBasedOnElements = function() {
		var isVisible = false; // as if no element is assignet no visible element exist.

		var aElements = this.getElements();
		if (aElements && aElements.length > 0) {
			isVisible = aElements.some(function(oElement) {
				return oElement.getVisible();
			});
		}

		return isVisible;
	};

	function _getTooltipString() {

		var oTooltip = this.getTooltip();
		if (!oTooltip || typeof oTooltip === "string" || oTooltip instanceof String ) {
			return oTooltip;
		} else {
			return oTooltip.getText();
		}
	}

	/*
	 * to have the right event handlers attached to the elements and all internal label,
	 * VBox, HBoy, LayoutData and CustomData settings we need to remove all element before
	 * cloning, add them again afterwards and clone them manually.
	 */
	GroupElement.prototype.clone = function(sIdSuffix, aLocalIds){

		var aElements = this.removeAllElements();

		var oClone = FormElement.prototype.clone.apply(this, arguments);

		for (var i = 0; i < aElements.length; i++) {
			var oElement = aElements[i];
			var oElementClone = oElement.clone(sIdSuffix, aLocalIds);
			this.addElement(oElement);
			oClone.addElement(oElementClone);
		}

		return oClone;

	};


	/**
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @since 1.134
	 */
	GroupElement.prototype.getFlexConfig = function() {
		var oSmartField = this._getFieldRelevantForLabel();
		if (oSmartField && oSmartField.isA("sap.ui.comp.smartfield.SmartField")) {
			return {
				entitySetName: oSmartField._getEntitySet()
			};
		 }
	};

	// remove "internal" FormElement functionality from API documentation

	/**
	 * Adds some field to the aggregation <code>fields</code>.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @param {sap.ui.core.Control} oField Field to be added
	 * @returns {sap.ui.comp.snartform.GroupElement} Reference to <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#addField
	 * @function
	 */

	/**
	 * Inserts a field to the aggregation <code>fields</code>.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @param {sap.ui.core.Control} oField Field to be added
	 * @param {int} iIndex the 0-based index the field should be inserted at; for a negative value of iIndex, the field is inserted at position 0; for a value greater than the current size of the aggregation, the field is inserted at the last position
	 * @returns {sap.ui.comp.snartform.GroupElement} Reference to <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#insertField
	 * @function
	 */

	/**
	 * Gets content of aggregation <code>fields</code>.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @returns {sap.ui.core.Control[]} array of fields
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#getFields
	 * @function
	 */

	/**
	 * Checks for the provided <code>sap.ui.core.Control</code> in the aggregation <code>fields</code>.
	 * and returns its index if found or -1 otherwise.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @param {sap.ui.core.Control} oField The field whose index is looked for
	 * @returns {int} The index of the provided control in the aggregation if found, or -1 otherwise
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#indexOfField
	 * @function
	 */

	/**
	 * Removes a field from the aggregation <code>fields</code>.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @param {int|string|sap.ui.core.Control} vField The field to remove or its index or id
	 * @returns {sap.ui.core.Control} The removed field or null
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#removeField
	 * @function
	 */

	/**
	 * Removes all the controls from the aggregation <code>fields</code>.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @returns {sap.ui.core.Control[]} An array of the removed elements (might be empty)
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#removeAllFields
	 * @function
	 */

	/**
	 * Destroys all the fields in the aggregation <code>fields</code>.
	 *
	 * Do not use the <code>fields</code> aggregation, use the <code>elements</code> aggregation instead.
	 *
	 * @returns {sap.ui.comp.snartform.GroupElement} Reference to <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.GroupElement#destroyFields
	 * @function
	 */

	return GroupElement;

});
