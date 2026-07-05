/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/Control',
	'sap/ui/layout/form/SemanticFormElement',
	'sap/ui/layout/form/FormHelper',
	'sap/m/Label',
	'sap/m/Button', // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
	'sap/m/Text', // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
	'sap/ui/comp/smartfield/SmartLabel',
	'sap/ui/comp/smartfield/SmartField',
	"sap/base/Log",
	"sap/ui/core/InvisibleText"
], function(
	library,
	Control,
	FormElement,
	FormHelper,
	Label,
	Button,
	Text,
	SmartLabel,
	SmartField,
	Log,
	InvisibleText
	) {
	"use strict";

	var VBox;
	var GridData;

	var ControlContextType = library.smartfield.ControlContextType;

	/**
	 * Constructor for a new smartform/SemanticGroupElement.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class SemanticGroupElement holds the semantically connected fields divided by a delimiter.
	 * <b>Note:</b> Semantically connected fields don't support the text arrangement async control functionality.
	 * @extends sap.ui.layout.form.SemanticFormElement
	 * @constructor
	 * @public
	 * @since 1.88
	 * @alias sap.ui.comp.smartform.SemanticGroupElement
	 */
	var SemanticGroupElement = FormElement.extend("sap.ui.comp.smartform.SemanticGroupElement", /** @lends sap.ui.comp.smartform.SemanticGroupElement.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			interfaces: [
				"sap.ui.comp.IFormGroupElement"
			],
			properties: {
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
				 * Aggregation of controls to be displayed together with a label and separated by delimiter.
				 *
				 * <b>Warning:</b> Do not put any layout or other container controls in here.
				 * This could damage the visual layout, keyboard support and screen-reader support.
				 * Views are also not supported. Only form controls are allowed.
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
			}
		},
		_bVisibleElements: false
	});

	/*
	 *If a <code>Label</code> control with a tooltip is assigned to the <code>SemanticGroupElement</code>,
	 * use this tooltip as also the text of the given
	 * <code>Label</code> control is used.
	 * Otherwise, use the tooltip of the <code>SemanticGroupElement</code>
	 */
	function _setLabelTooltip(oLabel, oRelevantField) {

		if (oLabel == this._oSetLabelFromOutside) {
			return;  // don't change label set from outside
		}

		var sTooltip;

		if (this._oSetLabelFromOutside && this._oSetLabelFromOutside instanceof Control) {
			sTooltip = _getTooltipString.call(this._oSetLabelFromOutside);
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

	function _getTooltipString() {

		var oTooltip = this.getTooltip();
		if (!oTooltip || typeof oTooltip === "string" || oTooltip instanceof String ) {
			return oTooltip;
		} else {
			return oTooltip.getText();
		}
	}

	function _handleLabelChanged(oEvent) {

		if (oEvent.getParameter("name") == "text") {
			var oLabel = oEvent.oSource;
			var sText = oLabel.getText();

			if (this._oLabel) {
				this._oLabel.setText(sText);
			}

			var oSmartField = this._getFieldRelevantForLabel();
			if (oSmartField && oSmartField.getComputedTextLabel) {
					if (!oSmartField._oTextLabelSetBySemanticGroupElement) {
						oSmartField._oTextLabelSetBySemanticGroupElement = {oldText: oSmartField.getComputedTextLabel()};
					}
					oSmartField.setTextLabel(sText);
			}
		}

	}

	function _isLabelRequired(){

		if (this.getRequired && this.getRequired()) {
			return true;
		}

		var oSemanticGroupElement = this.getParent();
		var aFields = oSemanticGroupElement.getElements();

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

	function _isLabelDisplayOnly () {

		if (this.getDisplayOnly) {
			if (!this.isPropertyInitial("displayOnly")) {
				return this.getDisplayOnly();
			}

			var oSemanticGroupElement = this.getParent();
			var oGroup = oSemanticGroupElement.getParent();

			if (oGroup) {
				var oForm = oGroup.getParent();

				if (oForm) {
					return !oForm.getEditable();
				}
			}
		}

		return false;

	}

	function _isLabelWrapping(){

		// If SemanticGroupElement creates own Label, check wrapping property of original set Label
		// use this function only for Labels created by SemanticGroupElement

		var oSemanticGroupElement = this.getParent();

		if (oSemanticGroupElement._oSetLabelFromOutside && !(typeof oSemanticGroupElement._oSetLabelFromOutside === "string") &&
		oSemanticGroupElement._oSetLabelFromOutside.getWrapping && !oSemanticGroupElement._oSetLabelFromOutside.isPropertyInitial("wrapping")) {
			return oSemanticGroupElement._oSetLabelFromOutside.getWrapping();
		}

		return true;

	}

	function _restoreTextLabel(oField, sLabelText) {

		if (oField._oTextLabelSetBySemanticGroupElement) {
			if (oField.getComputedTextLabel() == sLabelText) {
				// if not changed from outside
				oField.setTextLabel(oField._oTextLabelSetBySemanticGroupElement.oldText);
			}
			delete oField._oTextLabelSetBySemanticGroupElement;
		}

	}

	function _updateCreatedLabel(oCreatedLabel) {
			oCreatedLabel._bCreatedBySemanticGroupElement = true;
			oCreatedLabel.isRequired = _isLabelRequired;
			oCreatedLabel.isDisplayOnly = _isLabelDisplayOnly;
			oCreatedLabel.isWrapping = _isLabelWrapping;
			return oCreatedLabel;
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

		_changeEditableField.call(this, oField, this.getProperty("_editable"));

		_inheritCustomData.call(this, oField);

		if (oField.isA("sap.ui.comp.smartfield.SmartField") &&
			oField._isInnerControlCreationDelayed &&
			oField.getMode() === "display") {
			oField._forceInitialise();
		}
		if (oField.isA("sap.ui.comp.smartfield.SmartField")) {
			oField.attachInnerControlsCreated(function () {
				this._observeChanges({object: oField, name: "visible"});
				oField.getInnerControls().forEach(function (oInnerControl) {
					var oTextBinding = oInnerControl.getBinding("text");
					if (oTextBinding) {
						oTextBinding.attachChange( function () {
							this._observeChanges({object: oField, name: "visible"});
						}.bind(this));
					}
				}.bind(this));
			}.bind(this));
		}
	}

	function _controlChanged(oChanges) {

		if (oChanges.name == "mandatory") {
			this.invalidateLabel();
		} else if (oChanges.name == "visible") {
			this._updateFormElementVisibility();
		}
	}

	function _visibilityChanged() {

		this.fireVisibleChanged({
			visible: this.isVisible()
		});
		if (this.getParent()) {
			this.getParent()._updateLineBreaks();
		}

	}

	function _editableChanged(bEditable) {

		var aElements = this.getElements();

		for (var i = 0; i < aElements.length; i++) {
			var oElement = aElements[i];
			_changeEditableField.call(this, oElement, bEditable);
		}

	}

	function _changeEditableField(oField, bEditable) {

		if (oField instanceof SmartField) {
			if (!(oField.data("editable") === false)) {
				oField.setContextEditable(bEditable);
			}
		}
	}

	function _inheritCustomData(oField) {

		if (oField instanceof SmartField) {
			var aCustomData = this.getCustomData();

			for (var i = 0; i < aCustomData.length; i++) {
				_addCustomDataToField.call(this, oField, aCustomData[i]);
			}
		}

	}

	function _removeInheritedCustomData(oField, sOriginalId) {

		if (oField instanceof SmartField) {
			var aCustomData = oField.getCustomData();
			for (var i = 0; i < aCustomData.length; i++) {
				var oCustomData = aCustomData[i];
				if (oCustomData._bFromSemanticGroupElement && (!sOriginalId || sOriginalId == oCustomData._sOriginalId)) {
					oField.removeCustomData(oCustomData);
					oCustomData.destroy();
				}
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
			oNewCustomData._bFromSemanticGroupElement = true;
			oNewCustomData._sOriginalId = oCustomData.getId();
			oField.addCustomData(oNewCustomData);
		}
	}

	function _cleanUpField(oField) {

		if (oField.detachInnerControlsCreated) {
			oField.detachInnerControlsCreated(this._updateFormElementLabel, this);
		}
		if (oField.setControlContext) {
			oField.setControlContext(ControlContextType.None);
		}

		_removeInheritedCustomData.call(this, oField);
		_restoreTextLabel.call(this, oField, this.getLabelText());

	}


	SemanticGroupElement.prototype.init = function(){

		FormElement.prototype.init.apply(this, arguments);

		this._oObserver.observe(this, {
			properties: ["elementForLabel", "_editable", "delimiter"]
		});

	};

	SemanticGroupElement.prototype._getFieldRelevantForLabel = function() {
		var aElements = this.getElements();
		var iIndex = this.getElementForLabel();

		if (aElements.length > iIndex && (aElements[iIndex] instanceof SmartField)) {
			return aElements[iIndex];
		}

		return null;
	};

	SemanticGroupElement.prototype._extractFields = function(aElements, bExcludeLabel) {
		var aFields = [];

		aElements.forEach(function(oElement) {
				aFields.push(oElement);
		});

		if (bExcludeLabel) {
			aFields = aFields.filter(function(oField) {
				return !(oField instanceof Label);
			});
		}

		return aFields;
	};

	SemanticGroupElement.prototype._observeChanges = function(oChanges){

		FormElement.prototype._observeChanges.apply(this, arguments);

		if (oChanges.object == this) {
			switch (oChanges.name) {
				case "useHorizontalLayout":
					Log.error("useHorizontalLayout can't be used with SemanticGroupElement", this);
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

	/**
	 * Returns the internal label independent of whether it comes directly from the <code>SemanticGroupElement</code>
	 *
	 * @returns {object} Object which represents the internal label
	 * @private
	 */
	SemanticGroupElement.prototype._getLabel = function() {

		if (this._oLabel) {
			return this._oLabel;
		} else {
			return this._oSetLabelFromOutside;
		}

	};

	/**
	 * The basic <code>FormElement</code> has some label logic to create its own <code>Label</code> controls.
	 * In case text is used, this label is stored in <code>_oLabel</code>.
	 * _oSetLabelFromOutside is used to determine what is set from outside before using the internal label
	 */
	SemanticGroupElement.prototype._createLabel = function(sLabel) {
		var oLabel = null;
		var oField = this._getFieldRelevantForLabel();

		if (oField) {
			if (oField.getShowLabel && oField.getShowLabel()) {
				oLabel = new SmartLabel(oField.getId() + '-label');
				if (sLabel) {
					if (!oField._oTextLabelSetBySemanticGroupElement) {
						oField._oTextLabelSetBySemanticGroupElement = {oldText: oField.getComputedTextLabel()};
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
			oLabel = _updateCreatedLabel(oLabel);
			this._oLabel = oLabel;
			this.setAggregation("_label", oLabel, true); // use Aggregation to allow model inheritance

			if (this._oSetLabelFromOutside && typeof this._oSetLabelFromOutside !== "string") {
				// remove assignment of unused label to field
				this._oSetLabelFromOutside.setAlternativeLabelFor(null);
			}
		}

		return oLabel;
	};

	SemanticGroupElement.prototype._updateFormElementLabel = function(oEvent) {

		var oRelevantField = this._getFieldRelevantForLabel();
		var oLabel = this._getLabel();
		var oSmartField = oEvent.oSource;
		var aInnerElements = oEvent.getParameters();

		if (oLabel instanceof SmartLabel && oSmartField && aInnerElements && oSmartField === oRelevantField) {
			oLabel.updateLabelFor(aInnerElements);
		}

	};

	/**
	 * Updates the visibility of the <code>FormElement</code>
	 *
	 * @private
	 */
	SemanticGroupElement.prototype._updateFormElementVisibility = function() {

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

	SemanticGroupElement.prototype._updateGridDataSpan = function() {};

	SemanticGroupElement.prototype._setLinebreak = function(bLineBreakXL, bLineBreakL, bLineBreakM, bLineBreakS) {

		var aFields = this.getFields();
		if (aFields.length > 0) {
			var oVBox = aFields[0];
			if (!(oVBox instanceof VBox)) {
				return;
			}

			var oLayoutData = oVBox.getLayoutData();

			if (oLayoutData instanceof GridData) {
					oLayoutData.setLinebreakXL(bLineBreakXL);
					oLayoutData.setLinebreakL(bLineBreakL);
					oLayoutData.setLinebreakM(bLineBreakM);
					oLayoutData.setLinebreakS(bLineBreakS);
			}
		}
	};

	/**
	 * override from sap.ui.layout.form.SemanticFormElement
	 * Determines which fields are rendered.
	 *
	 * In edit mode, the field controls are rendered separated by the delimiters.
	 * In display mode, one text is rendered.
	 *
	 * @returns {sap.ui.core.Control[]} Array of fields to be rendered
	 * @private
	 * @ui5-restricted sap.ui.layout.form.Form
	 */
	SemanticGroupElement.prototype.getFieldsForRendering = function(){
		var iIndex,
			oDelimiter,
			aDelemiters,
			oField,
			sDelimiter = this.getDelimiter(),
			sDelimiterId = this.getId() + "-delimiter-",
			bAllFieldsSemanticFormContent = true,
			bFieldNotEditable = true,
			bUseSmartFields = false,
			bAllFieldsNotEditable = true,
			aFieldsForRendering = [],
			aFields = this.getFields();

		for (iIndex = 0; iIndex < aFields.length; iIndex++) {
			oField = aFields[iIndex];

			if (!oField.isA("sap.ui.core.ISemanticFormContent")) {
				bAllFieldsSemanticFormContent = false;
				break;
			}

			if (bFieldNotEditable) {
				var bIsSmartField = oField.isA("sap.ui.comp.smartfield.SmartField"),
				oEmbeddedSmartField = oField._getEmbeddedSmartField(),
				bIsUom = bIsSmartField && !!oEmbeddedSmartField;

				if (bIsSmartField && !oField.getEditable()) {
					bFieldNotEditable = bIsUom ? !oEmbeddedSmartField.getEditable() : true;
				} else {
					bFieldNotEditable = false;
				}

				if (!bFieldNotEditable) {
					bAllFieldsNotEditable = false;
				}
			}

			if (oField._hasSemanticObject() || oField._hasCriticality()) {
				bUseSmartFields = true;
			}
		}

		if (!bAllFieldsSemanticFormContent) {
			return;
		}

		if (!this._bLayoutDataCreated) {
			_updateLayoutData.call(this); // as Layout might be set after Fields, so LayoutData can only be determined now
		}

		if (this.getProperty("_editable") && !bAllFieldsNotEditable ||
			bUseSmartFields) {
			aDelemiters = this.getAggregation("_delimiters", []);

			for (var i = 0; i < aFields.length; i++) {
				oField = aFields[i];
				if (oField.getVisible()) {
					if (aFieldsForRendering.length > 0) {
						oDelimiter = aDelemiters[i - 1];
						if (oDelimiter === undefined) {
							oDelimiter = FormHelper.createDelimiter(sDelimiter, sDelimiterId + i);
							oDelimiter.addStyleClass("sapUiFormDelimiter");
							this.addAggregation("_delimiters", oDelimiter);
						}
						aFieldsForRendering.push(oDelimiter);
					}
					aFieldsForRendering.push(oField);
				}
			}
		} else {
			var oDisplay = this.getAggregation("_displayField");
			if (!oDisplay) {
				_updateControlsForDisplay.call(this, true);
				oDisplay = this.getAggregation("_displayField");
			}

			aFieldsForRendering.push(oDisplay);
		}

		return aFieldsForRendering;

	};

	// override from sap.ui.layout.form.SemanticFormElement
	// as on adding the Fields the FormElement must not be already assigned to the Form,
	// the used Layout can be unknown. But latest on rendering it is known, so there the LayoutData can be set latest.
	function _updateLayoutData() {

		var aFields = this.getFields().filter(function(oField) {
			return oField.getVisible();
		});
		var aDelemiters = this.getAggregation("_delimiters", []);
		var oFormContainer = this.getParent();
		var oForm = oFormContainer && oFormContainer.getParent();
		var oLayout = oForm && oForm.getLayout();
		var oLayoutData;
		var i = 0;

		if (!oLayout || !oLayout.getLayoutDataForDelimiter) {
			return;
		}

		if (this.getProperty("_editable")) {
			// delimiters
			for (i = 0; i < aDelemiters.length; i++) {
				var oDelimiter = aDelemiters[i];
				if (!oDelimiter.getLayoutData()) {
					oLayoutData = oLayout.getLayoutDataForDelimiter();
					if (oLayoutData) {
						if (oLayoutData instanceof Promise) {
							oLayoutData.then(function(oLayoutData) {
								oLayoutData._bSetBySemanticFormElement = true;
								this.setLayoutData(oLayoutData);
							}.bind(oDelimiter));
						} else if (oLayoutData.isA("sap.ui.core.LayoutData")) {
							oLayoutData._bSetBySemanticFormElement = true;
							oDelimiter.setLayoutData(oLayoutData);
						}
					}
				}
			}

			// fields (only if have no own LayoutData)
			if (aFields.length > 1) {
				// only if there are delimiters
				for (i = 0; i < aFields.length; i++) {
					var oField = aFields[i];
					oLayoutData = oField.getLayoutData();
					if (!oLayoutData || oLayoutData._bSetBySemanticFormElement) {
						oLayoutData = oLayout.getLayoutDataForSemanticField(aFields.length, i + 1, oLayoutData);
						if (oLayoutData) {
							if (oLayoutData instanceof Promise) {
								oLayoutData.then(function(oLayoutData) {
									oLayoutData._bSetBySemanticFormElement = true;
									this.setLayoutData(oLayoutData);
								}.bind(oField));
							} else if (oLayoutData.isA("sap.ui.core.LayoutData") && !oLayoutData._bSetBySemanticFormElement) { // if already set (just updated), don't need to set again
								oLayoutData._bSetBySemanticFormElement = true;
								oField.setLayoutData(oLayoutData);
							}
						}
					}
				}
			}

			this._bLayoutDataCreated = true; // to not check it on every getFieldsForRendering call
		}

	}

	// override from sap.ui.layout.form.SemanticFormElement
	var oRenderingDelegate = {
		onBeforeRendering: function() {
			_updateDisplayText.call(this, true);
		}
	};

	// override from sap.ui.layout.form.SemanticFormElement
	function _updateControlsForDisplay(bSetTextAsync) {

		var oDisplay = this.getAggregation("_displayField");

		if (oDisplay) {
			_updateDisplayText.call(this, false); // if already rendered update text
		} else {
			var sId = this.getId() + "-display";
			oDisplay = FormHelper.createSemanticDisplayControl("", sId);
			oDisplay.addDelegate(oRenderingDelegate, true, this);
			this.setAggregation("_displayField", oDisplay);
		}

	}


	// override from sap.ui.layout.form.SemanticFormElement
	// As display text might need some logic to be determined -> determine only if really rendered and not for every update
	function _updateDisplayText(bForce) {
		var oDisplay = this.getAggregation("_displayField");

		if (oDisplay && (oDisplay.getDomRef() || bForce)) { // update only if rendered (or forced on before rendering)
			if (bForce && oDisplay._bNoForceUpdate) { // re-rendering triggered by update of text itself -> do not do twice
				oDisplay._bNoForceUpdate = false;
				return;
			}

			var aFields = this.getFields();
			var aTexts = [];
			var bAsync = false;

			for (var i = 0; i < aFields.length; i++) {
				var oField = aFields[i];
				if (oField.getVisible()) {
					var sProperyName = oField.getFormValueProperty ? oField.getFormValueProperty() : null;
					var vText;
					if (oField.getFormFormattedValue) {
						vText = oField.getFormFormattedValue();
						if (vText instanceof Promise) {
							bAsync = true;
						}
					} else if (sProperyName) {
						vText = oField.getProperty(sProperyName);
					} else if (oField.getMetadata().getProperty("value")) {
						vText = oField.getValue();
					} else if (oField.getMetadata().getProperty("text")) {
						vText = oField.getText();
					}
					aTexts.push(vText);
				}
			}

			oDisplay._bNoForceUpdate = true; // prevent double update, as setText might trigger re-rendering
			if (bAsync) {
				Promise.all(aTexts).then(function(aTexts) {
					var oDisplay = this.getAggregation("_displayField");
					var sText = _concatenateTexts.call(this, aTexts);
					oDisplay._bNoForceUpdate = true; // prevent double update, as setText might trigger re-rendering (again as a re-rendeing could happen until promise resolved)
					FormHelper.updateSemanticDisplayControl(oDisplay, sText);
				}.bind(this));
			} else {
				var sText = _concatenateTexts.call(this, aTexts);
				FormHelper.updateSemanticDisplayControl(oDisplay, sText);
			}
		} else if (oDisplay && oDisplay._bNoForceUpdate) { // execute update on next rendering
			oDisplay._bNoForceUpdate = false;
		}

	}

	// override from sap.ui.layout.form.SemanticFormElement
	function _concatenateTexts(aTexts) {
		var sDelimiter = this.getDelimiter();
		var sText = "";

		for (var i = 0; i < aTexts.length; i++) {
			sText = sText + aTexts[i];
			if (i < aTexts.length - 1) {
				sText = sText + " " + sDelimiter + " ";
			}
		}

		return sText;
	}
	SemanticGroupElement.prototype.setTooltip = function(vTooltip) {

		FormElement.prototype.setTooltip.apply(this, [vTooltip]);

		var oRelevantField = this._getFieldRelevantForLabel();
		var oLabel = this._getLabel();
		_setLabelTooltip.call(this, oLabel, oRelevantField);

		return this;

	};

	SemanticGroupElement.prototype.setLabel = function(oLabel) {

		if (this._oSetLabelFromOutside && (typeof this._oSetLabelFromOutside !== "string")) {
			this._oSetLabelFromOutside.detachEvent("_change", _handleLabelChanged, this);
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
		} else if (!oLabel && this._oSetLabelFromOutside) {
			sOldLabel = this.getLabelText();
		}

		// use standard logic
		FormElement.prototype.setLabel.apply(this, [oLabel]);

		// just store given Label to access it easily
		this._oSetLabelFromOutside = oLabel;

		if (typeof oLabel === "string") {
			// label is stored in this._oLabel
			if (this._oLabel instanceof SmartLabel && oLabel != sOldLabel && (oLabel.length > 0 || sOldLabel.length > 0)) {
				oSmartField = this._getFieldRelevantForLabel();
				if (oSmartField && oLabel != null) {
					if (oSmartField.getComputedTextLabel) {
						if (!oSmartField._oTextLabelSetBySemanticGroupElement) {
							oSmartField._oTextLabelSetBySemanticGroupElement = {oldText: oSmartField.getComputedTextLabel()};
						}
						oSmartField.setTextLabel(oLabel);
					}
				}
			}

			this.setAggregation("_label", this._oLabel, true); // use Aggregation to allow model inheritance
			this._oLabel.isRequired = _isLabelRequired; // use SemanticGroupElement logic
			this._oLabel.isDisplayOnly = _isLabelDisplayOnly; // use SemanticGroupElement logic
		} else {
			if (oLabel) {
				if (oLabel.isRequired) {
					oLabel.isRequired = _isLabelRequired; // use GroupElements logic
				}
				if (oLabel.isDisplayOnly) {
					oLabel.isDisplayOnly = _isLabelDisplayOnly; // use GroupElements logic
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

	SemanticGroupElement.prototype.destroyLabel = function() {

		var sOldLabel = this.getLabelText();

		// use standard logic
		FormElement.prototype.destroyLabel.apply(this);

		delete this._oSetLabelFromOutside;

		var oSmartField = this._getFieldRelevantForLabel();
		if (oSmartField) {
			_restoreTextLabel.call(this, oSmartField, sOldLabel);
		}

		this.updateLabelOfFormElement(); // maybe new SmartLabel needs to be created

		return this;

	};

	SemanticGroupElement.prototype.getLabel = function() {

		return this._oSetLabelFromOutside;

	};

	// this function is used to get the rendered Label.
	SemanticGroupElement.prototype.getLabelControl = function() {
			return this._getLabel();
	};

	/**
	 * Returns the text of the label.
	 *
	 * @returns {string} The text of the label.
	 * @public
	 */
	SemanticGroupElement.prototype.getLabelText = function() {
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
	SemanticGroupElement.prototype.getDataSourceLabel = function () {
		var oSmartField = this._getFieldRelevantForLabel();
		if (oSmartField && oSmartField.isA("sap.ui.comp.smartfield.SmartField")) {
			return oSmartField.getDataSourceLabel();
		}
	};

	/*
	 * If a <code>SmartField</code> is used to determine a label, create an internal <code>SmartLabel</code>.
	 * Otherwise, use the provided Label.
	 * There always needs to be a label. If an internal one is provided, use its text.
	 * If there is no internal label provided, use the label text of the <code>SmartField</code>.
	 * If no label is provided, create an empty one.
	 */
	SemanticGroupElement.prototype.updateLabelOfFormElement = function() {
		var bCreated = false, sOldText = null;
		var aElements = this.getElements();

		var oRelevantField = this._getFieldRelevantForLabel();
		var oLabel = this._getLabel();
		var bDestroy = false;

		if (oLabel && oLabel._bCreatedBySemanticGroupElement) {
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
				if (this._oSetLabelFromOutside && !oRelevantField) {
					// original Label exist and no SmartLabel needed -> go back to original Label
					// go back to original Label
					if (typeof this._oSetLabelFromOutside === "string") {
						FormElement.prototype.setLabel.apply(this, [this._oSetLabelFromOutside]);
						oLabel = this._oLabel;
						this._oLabel.isRequired = _isLabelRequired; // use GroupElements logic
						this._oLabel.isDisplayOnly = _isLabelDisplayOnly; // use GroupElements logic
					} else {
						oLabel = this._oSetLabelFromOutside;
					}
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
			if (this._oSetLabelFromOutside) {
				// Label destroyed -> get text of original Label
				if (typeof this._oSetLabelFromOutside === "string") {
					sOldText = this._oSetLabelFromOutside;
				} else {
					sOldText = this._oSetLabelFromOutside.getText();
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

			_setLabelTooltip.call(this, oLabel, oRelevantField);

		}

		if (bCreated) {

			if (oLabel && oLabel.setLabelFor && !(oLabel instanceof SmartLabel) && !oRelevantField && (aElements.length > 0)) {
				oLabel.setLabelFor(aElements[0]);
			}

		}

	};

	SemanticGroupElement.prototype.invalidateLabel = function(){

		var oLabel = this._getLabel();

		if (oLabel) {
			oLabel.invalidate();
		}
	};

	/**
	 * @deprecated As of version 1.86, replaced by {@link sap.ui.comp.smartform.ColumnLayout ColumnLayout} in the <code>layout</code> aggregation of the <code>SmartForm</code> control.
	 * @returns {boolean}
	 */
	SemanticGroupElement.prototype.getUseHorizontalLayout = function() {
		Log.error("getUseHorizontalLayout can't be used with SemanticGroupElement", this);
	};

	/**
	 * @deprecated As of version 1.86, replaced by {@link sap.ui.comp.smartform.ColumnLayout ColumnLayout} in the <code>layout</code> aggregation of the <code>SmartForm</code> control.
	 * @param {boolean} bUseHorizontalLayout
	 */
	SemanticGroupElement.prototype.setUseHorizontalLayout = function(bUseHorizontalLayout) {
		Log.error("setUseHorizontalLayout can't be used with SemanticGroupElement", this);
	};

	/**
	 * @deprecated Since version 1.48.0, please do not use this property as it does not have any effect on the current layout of the <code>SmartForm</code> control.
	 * @returns {int} The minimal size in pixels of all group elements of the form if horizontal layout is used
	 */
	SemanticGroupElement.prototype.getHorizontalLayoutGroupElementMinWidth = function() {
		Log.error("getHorizontalLayoutGroupElementMinWidth can't be used with SemanticGroupElement", this);
	};

	/**
	 * @deprecated Since version 1.48.0, please do not use this property as it does not have any effect on the current layout of the <code>SmartForm</code> control.
	 * @param {int} iMinWidth the minimal size in pixels of all group elements of the form if horizontal layout is used
	 */
	SemanticGroupElement.prototype.setHorizontalLayoutGroupElementMinWidth = function(iMinWidth) {
		Log.error("setHorizontalLayoutGroupElementMinWidth can't be used with SemanticGroupElement", this);
	};

	SemanticGroupElement.prototype.setVisible = function(bVisible) {

		var bLastVisible = this.isVisible();

		FormElement.prototype.setVisible.apply(this, arguments);

		if (bLastVisible != bVisible) {
			_visibilityChanged.call(this);
		}

		return this;

	};

	SemanticGroupElement.prototype.isVisible = function(){

		if (this.isPropertyInitial("visible")) {
			return this._bVisibleElements;
		} else {
			return this.getVisible();
		}

	};

	/**
	 * Determines the visibility of a <code>SemanticGroupElement</code> based on the inner elements
	 *
	 * @returns {boolean} Returns true in case one element of the group elements is visible
	 * @public
	 */
	SemanticGroupElement.prototype.getVisibleBasedOnElements = function() {
		var isVisible = false; // as if no element is assigned no visible element exist.

		var aElements = this.getElements();
		if (aElements && aElements.length > 0) {
			isVisible = aElements.some(function(oElement) {
				return oElement.getVisible();
			});
		}

		return isVisible;
	};

	/**
	 * Returns the semantic form element.
	 *
	 * @returns {sap.ui.layout.form.SemanticFormElement}
	 * @public
	 */
	SemanticGroupElement.prototype.getFormElement = function() {
		return this;
	};

	SemanticGroupElement.prototype.addElement = function(oElement) {

		if (!oElement) {
			return this;
		}

		// as "elements" aggregation is not used, at least validate it
		oElement = this.validateAggregation("elements", oElement, /* multiple */ true);

		_enhanceField.call(this, oElement);

		var sLabelSmartFieldId;
		if (this._oLabel && this._oLabel._bCreatedBySemanticGroupElement && this._oLabel._sSmartFieldId) {
			sLabelSmartFieldId = this._oLabel._sSmartFieldId;
		}

			this.addField(oElement);

		if (sLabelSmartFieldId && sLabelSmartFieldId != this._oLabel._sSmartFieldId) {
			// as FormElement always assigns first field to Label, restore old assignment and use GroupElements logic
			this._oLabel.setLabelFor(sLabelSmartFieldId);
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		if (oElement.isA("sap.ui.comp.smartfield.SmartField")) {
			oElement.attachEventOnce("innerControlsCreated", function() {
				this._enhanceAriaLabelledBy(oElement);
			}.bind(this));
		}

		return this;
	};

	/**
	 * If the added element is a SmartField, this method creates an invisible text from the sap:label annotation found in the OData service metadata.
	 * It then adds this as an ariaLabelledBy association to the SmartField.
	 *
	 * @param {sap.ui.comp.smartfield.SmartField} oElement The SmartField to which the ariaLabelledBy association will be added
	 * @private
	 */
	SemanticGroupElement.prototype._enhanceAriaLabelledBy = function(oElement) {
		const oLabel = oElement.getDataSourceLabel(),
			oInvisibleText = new InvisibleText({
				text: oLabel
			});

		oElement.addAriaLabelledBy(oInvisibleText);
		oElement.addAggregation("_ariaLabelInvisibleText", oInvisibleText);
	};

	SemanticGroupElement.prototype.insertElement = function(oElement, iIndex) {

		if (!oElement) {
			return this;
		}

		// as "elements" aggregation is not used, at least validate it
		oElement = this.validateAggregation("elements", oElement, /* multiple */ true);

		_enhanceField.call(this, oElement);

		var sLabelSmartFieldId;
		if (this._oLabel && this._oLabel._bCreatedBySemanticGroupElement && this._oLabel._sSmartFieldId) {
			sLabelSmartFieldId = this._oLabel._sSmartFieldId;
		}

			this.insertField(oElement, iIndex);

		if (sLabelSmartFieldId && sLabelSmartFieldId != this._oLabel._sSmartFieldId) {
			// as FormElement always assigns first field to Label, restore old assignment and use GroupElements logic
			this._oLabel.setLabelFor(sLabelSmartFieldId);
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return this;

	};

	SemanticGroupElement.prototype.getElements = function() {

		var aFields;

			aFields = this.getFields();

		return aFields;

	};

	SemanticGroupElement.prototype.indexOfElement = function(oElement) {

		var iIndex = -1;

			iIndex = this.indexOfField(oElement);

		return iIndex;

	};

	SemanticGroupElement.prototype.removeElement = function(vElement) {

		var oResult;

		var sLabelSmartFieldId;
		if (this._oLabel && this._oLabel._bCreatedBySemanticGroupElement && this._oLabel._sSmartFieldId) {
			sLabelSmartFieldId = this._oLabel._sSmartFieldId;
		}

			oResult = this.removeField(vElement);

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

	SemanticGroupElement.prototype.removeAllElements = function() {

		var aResult = this.removeAllFields();

		if (aResult && Array.isArray(aResult)) {
			for (var i = 0; i < aResult.length; i++) {
				_cleanUpField.call(this, aResult[i]);
			}
		}

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return aResult;

	};

	SemanticGroupElement.prototype.destroyElements = function() {

		this.destroyFields();

		this.updateLabelOfFormElement();
		this._updateFormElementVisibility();

		return this;

	};


	/**
	 * Adds some custom data into the aggregation <code>customData</code>.
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
	SemanticGroupElement.prototype.addCustomData = function(oCustomData) {

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
	 * Inserts some custom data into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the custom data to insert; if empty, nothing is inserted
	 * @param {int} iIndex the 0-based index the custom data should be inserted at; for a negative value of iIndex, the custom data is inserted at position 0; for a value greater than the current size of the aggregation, the custom data is inserted at the last position
	 * @returns {this} Reference to <code>this</code> to allow method chaining.
	 * @public
	 */
	SemanticGroupElement.prototype.insertCustomData = function(oCustomData, iIndex) {

		if (!oCustomData) {
			return this;
		}

		FormElement.prototype.insertCustomData.apply(this, arguments);

		var aElements = this.getElements();

		for (var i = 0; i < aElements.length; i++) {
			_addCustomDataToField.call(this, aElements[i], oCustomData);
		}

		return this;

	};

	SemanticGroupElement.prototype.removeCustomData = function(vCustomData) {

		var oCustomData = FormElement.prototype.removeCustomData.apply(this, arguments);

		if (oCustomData) {
			var aElements = this.getElements();
			for (var i = 0; i < aElements.length; i++) {
				_removeInheritedCustomData.call(this, aElements[i], oCustomData.getId());
			}
		}

		return oCustomData;

	};

	SemanticGroupElement.prototype.removeAllCustomData = function() {

		var aCustomData = FormElement.prototype.removeAllCustomData.apply(this, arguments);

		if (aCustomData.length > 0) {
			var aElements = this.getElements();
			for (var i = 0; i < aElements.length; i++) {
				_removeInheritedCustomData.call(this, aElements[i]);
			}
		}

		return aCustomData;

	};

	SemanticGroupElement.prototype.destroyCustomData = function() {

		FormElement.prototype.destroyCustomData.apply(this, arguments);

		var aElements = this.getElements();
		for (var i = 0; i < aElements.length; i++) {
			_removeInheritedCustomData.call(this, aElements[i]);
		}

		return this;

	};

	/*
	 * To have the right event handlers attached to the elements and all internal labels,
	 * the layout data and the custom data settings, we need to remove all elements before
	 * cloning, add them again afterwards and clone them manually.
	 */
	SemanticGroupElement.prototype.clone = function(sIdSuffix, aLocalIds){

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


	return SemanticGroupElement;

});
