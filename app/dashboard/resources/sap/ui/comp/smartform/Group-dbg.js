/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartform.Group.
sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/Element',
	'sap/ui/layout/library', // as a type of the library is used in Metadata
	'sap/ui/layout/form/FormContainer',
	"sap/base/Log",
	'sap/m/Label', // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
	'sap/m/Button', // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
	'sap/m/Text' // As there is a hard dependency to sap.m load the requred controls to make FormHelper run synchonously
], function(library, Element, layoutLibrary, FormContainer, Log, Label, Button, Text) {
	"use strict";

	var ResponsiveFlowLayoutData;

	/**
	 * Constructor for a new smartform/Group.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Groups are used to group group elements.
	 * @extends sap.ui.layout.form.FormContainer
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartform.Group
	 */
	var Group = FormContainer.extend("sap.ui.comp.smartform.Group", /** @lends sap.ui.comp.smartform.Group.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartform/Group.designtime",
			properties: {
				/**
				 * Specifies whether the groups are rendered in a <code>ResponsiveLayout</code> with label on top of the group element. Each group will be
				 * rendered in a new line.
				 *
				 * <b>Note:</b> If <code>Group</code> is assigned to a <code>SmartForm</code> control,
				 * this property is inherited from the <code>SmartForm</code> control.
				 *
				 * So don't set it to a different value from the one in the <code>SmartForm</code> control. For performance reasons it might
				 * make sense to set it manually to the same value as the one in the <code>SmartForm</code> control when creating the <code>Group</code> element.
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
				 * Label for the group.
				 *
				 * @deprecated As of version 1.88, replaced by <code>title</code> aggregation.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				}

			},
			defaultAggregation: "groupElements",
			aggregations: {

				/**
				 * A <code>GroupElement</code> is a combination of one label and different controls associated to this label.
				 */
				groupElements: {
					type: "sap.ui.comp.IFormGroupElement",
					multiple: true,
					singularName: "groupElement"
				},

				/**
				 * Layout to specify how the group shall be rendered (e.g. span and line-break)
				 *
				 * <b>Note:</b> Do not use <code>layout</code> and <code>layoutData</code> aggregations combined.
				 *
				 * @deprecated Since version 1.48.0, please use <code>layoutData</code> aggregation instead.
				 */
				layout: {
					type: "sap.ui.layout.GridData",
					multiple: false
				}
			},
			_bVisibleElements: false
		}
	});

	Group.prototype.init = function(){

		FormContainer.prototype.init.apply(this, arguments);

		this._oObserver.observe(this, {
			properties: ["useHorizontalLayout", "horizontalLayoutGroupElementMinWidth", "label"]
		});

	};

	function _useHorizontalLayoutChanged(bValue) {

		// update all GroupElements
		var aGroupElements = this.getGroupElements();
		for (var i = 0; i < aGroupElements.length; i++) {
			if (aGroupElements[i].isA("sap.ui.comp.smartform.SemanticGroupElement")){
				Log.error("useHorizontalLayout can't be used for SemanticGroupElement", this);
			} else if (aGroupElements[i].getUseHorizontalLayout() != bValue) {
				aGroupElements[i].setUseHorizontalLayout(bValue);
			}
		}

		this._updateLayoutData();

	}

	Group.prototype._updateLayoutData = function() {

		if (this.getUseHorizontalLayout && this.getUseHorizontalLayout()) {
			// only needed if ResponsiveLayout used in Form
			var oSmartForm = this.getParent();
			while (oSmartForm && !oSmartForm.addGroup && oSmartForm.getParent) {
				// could be Form or Panel
				oSmartForm = oSmartForm.getParent();
			}
			if (oSmartForm) {
				// add LayoutData only if assigned to SmartForm
				var oLayout = oSmartForm.getLayout();
				if (!oLayout || !oLayout.getGridDataSpan()) {
					if (!this.getLayoutData()) { // don't overwrite LayoutData set from outside
						if (!ResponsiveFlowLayoutData && !this._bResponsiveFlowLayoutDataRequested) {
							ResponsiveFlowLayoutData = sap.ui.require("sap/ui/layout/ResponsiveFlowLayoutData");
							if (!ResponsiveFlowLayoutData) {
								sap.ui.require(["sap/ui/layout/ResponsiveFlowLayoutData"], _ResponsiveFlowLayoutDataLoaded.bind(this));
								this._bResponsiveFlowLayoutDataRequested = true;
							}
						}
						if (ResponsiveFlowLayoutData && !this._bResponsiveFlowLayoutDataRequested) {
							var oResponsiveLayout = new ResponsiveFlowLayoutData({
								"linebreak": true,
								"linebreakable": true
							});
							oResponsiveLayout._bCreatedByGroup = true;
							this.setLayoutData(oResponsiveLayout);
						}
					}
				} else {
					this._updateLineBreaks();
				}
			}
		} else {
			var oLayoutData = this.getLayoutData();
			if (oLayoutData && oLayoutData._bCreatedByGroup) {
				this.destroyLayoutData();
			}
		}

	};

	function _ResponsiveFlowLayoutDataLoaded(fnResponsiveFlowLayoutData) {

		ResponsiveFlowLayoutData = fnResponsiveFlowLayoutData;
		this._bResponsiveFlowLayoutDataRequested = false;

		if (!this._bIsBeingDestroyed) {
			this._updateLayoutData();
		}

	}

	function _horizontalLayoutGroupElementMinWidthChanged(nValue) {

		Log.error("HorizontalLayoutGroupElementMinWidth is deprecated", this);

		var aGroupElements = this.getGroupElements();
		for (var i = 0; i < aGroupElements.length; i++) {
			aGroupElements[i].setHorizontalLayoutGroupElementMinWidth(nValue);
		}

	}

	/**
	 * Setter for property <code>editable</code> of all smart fields in children hierarchy.
	 *
	 * @param {boolean} bEditMode new value for editable property of smart fields.
	 * @returns {this} <code>this</code> to allow method chaining.
	 * @public
	 * @deprecated Since version 1.74.0, please do not change the edit mode on group level, let the SmartForm inheritance do it
	 */
	Group.prototype.setEditMode = function(bEditMode) {

		this._setEditable(bEditMode);
		return this;

	};

	/**
	 * Updates line breaks of group elements
	 *
	 * @private
	 */
	Group.prototype._updateLineBreaks = function() {

		if (this.getUseHorizontalLayout && !this.getUseHorizontalLayout()) {
			return;
		}

		var oSmartForm = this.getParent();

		if (!oSmartForm) {
			return;
		}

		while (oSmartForm && !oSmartForm._getGridDataSpanNumbers && oSmartForm.getParent) {
			// could be Form and Panel
			oSmartForm = oSmartForm.getParent();
		}

		if (oSmartForm && !oSmartForm._getGridDataSpanNumbers) {
			return;
		}

		var oSpan = oSmartForm && oSmartForm._getGridDataSpanNumbers();

		if (!oSpan) {
			return;
		}

		var aElements = this.getGroupElements();

		aElements = aElements.filter(function(oElement) {
			return oElement.isVisible();
		});

		var iCountXL = 0;
		var iCountL = 0;
		var iCountM = 0;
		var iCountS = 0;
		var bLinebreakXL = false;
		var bLinebreakL = false;
		var bLinebreakM = false;
		var bLinebreakS = false;

		for (var i = 0; i < aElements.length; i++) {
			var oElement = aElements[i];
			iCountXL++;
			iCountL++;
			iCountM++;
			iCountS++;
			if (oSpan.XL * iCountXL > 12) {
				bLinebreakXL = true;
				iCountXL = 1;
			} else {
				bLinebreakXL = false;
			}

			if (oSpan.L * iCountL > 12) {
				bLinebreakL = true;
				iCountL = 1;
			} else {
				bLinebreakL = false;
			}

			if (oSpan.M * iCountM > 12) {
				bLinebreakM = true;
				iCountM = 1;
			} else {
				bLinebreakM = false;
			}

			if (oSpan.S * iCountS > 12) {
				bLinebreakS = true;
				iCountS = 1;
			} else {
				bLinebreakS = false;
			}

			oElement._setLinebreak(bLinebreakXL, bLinebreakL, bLinebreakM, bLinebreakS);
		}

	};

	/*
	 * triggers the data span update of the assigned GroupElements
	 */
	Group.prototype._updateGridDataSpan = function() {

		if (this.getUseHorizontalLayout && !this.getUseHorizontalLayout()) {
			return;
		}

		var aGroupElements = this.getGroupElements();
		for (var i = 0; i < aGroupElements.length; i++) {
			aGroupElements[i]._updateGridDataSpan();
		}

	};

	Group.prototype._updateFormContainerVisibility = function() {

		var aGroupElements = this.getGroupElements();

		var bVisible = false;
		bVisible = aGroupElements.some(function(oGroupElement) {
			return oGroupElement.isVisible();
		});

		if (this._bVisibleElements !== bVisible) {
			this._bVisibleElements = bVisible;
			if (this.isPropertyInitial("visible")) {
				// as property can over rule the elements settings
				this.fireEvent("_visibleChanged");
			}
		}

	};

	function _labelChanged(sLabel) {

		var sTitle = this.getTitle();

		if (sTitle && (typeof sTitle !== "string")) {
			// Title property must not be used, only Label must be used.
			Log.error("Title already set, Label can not be set", this);
		} else {
			this.setTitle(sLabel);
		}

	}

	/**
	 * Sets a new value for property <code>visible</code>. If set to <code>false</code>, the <code>Group</code> is not rendered.
	 * Default value is true.
	 *
	 * @param {boolean} bVisible New value for property <code>visible</code>
	 * @returns {this} <code>this</code> to allow method chaining.
	 * @public
	 */
	Group.prototype.setVisible = function(bVisible) { // don't use observer as needs to be checked even if no change

		var bOldVisible = this.getVisible();
		FormContainer.prototype.setVisible.apply(this, arguments);

		if (bVisible != bOldVisible || bVisible != this._bVisibleElements) {
			this.fireEvent("_visibleChanged");
		}

		return this;

	};

	Group.prototype.isVisible = function(){

		if (this.isPropertyInitial("visible")) {
			// use visibility based on elements
			return this._bVisibleElements;
		} else {
			// visible is set -> retutn it
			return this.getVisible();
		}

	};

	Group.prototype.addGroupElement = function(oGroupElement) {
		return this.addFormElement(oGroupElement);
	};

	Group.prototype.insertGroupElement = function(oGroupElement, iIndex) {
		return this.insertFormElement(oGroupElement, iIndex);
	};

	Group.prototype.getGroupElements = function() {
		return this.getFormElements();
	};

	Group.prototype.indexOfGroupElement = function(oGroupElement) {
		return this.indexOfFormElement(oGroupElement);
	};

	Group.prototype.removeGroupElement = function(vGroupElement) {
		return this.removeFormElement(vGroupElement);
	};

	Group.prototype.removeAllGroupElements = function() {
		return this.removeAllFormElements();
	};

	Group.prototype.destroyGroupElements = function() {
		return this.destroyFormElements();
	};

	Group.prototype.addFormElement = function(oGroupElement) {

		if (!oGroupElement) {
			return this;
		}

		// as "groupElements" aggregation is not used, at least validate it

		oGroupElement = this.validateAggregation("groupElements", oGroupElement, /* multiple */ true);

		// before addFormElement to prevent GridDataSpan update executed twice
		_enhanceGroupElementBefore.call(this, oGroupElement);

		FormContainer.prototype.addFormElement.apply(this, arguments);

		_enhanceGroupElementAfter.call(this, oGroupElement);

		return this;

	};

	Group.prototype.insertFormElement = function(oGroupElement, iIndex) {

		if (!oGroupElement) {
			return this;
		}

		// as "groupElements" aggregation is not used, at least validate it
		oGroupElement = this.validateAggregation("groupElements", oGroupElement, /* multiple */ true);

		// before insertFormElement to prevent GridDataSpan update executed twice
		_enhanceGroupElementBefore.call(this, oGroupElement);

		FormContainer.prototype.insertFormElement.apply(this, arguments);

		_enhanceGroupElementAfter.call(this, oGroupElement);

		return this;
	};

	Group.prototype.removeFormElement = function(vGroupElement) {

		var oGroupElement = FormContainer.prototype.removeFormElement.apply(this, arguments);

		if (oGroupElement) {
			oGroupElement.detachVisibleChanged(this._updateFormContainerVisibility, this);
			_removeCustomData.call(this, oGroupElement);
			this._updateFormContainerVisibility();
			this._updateLineBreaks();
		}

		return oGroupElement;

	};

	Group.prototype.removeAllFormElements = function() {

		var aGroupElements = FormContainer.prototype.removeAllFormElements.apply(this, arguments);

		for (var i = 0; i < aGroupElements.length; i++) {
			var oGroupElement = aGroupElements[i];
			oGroupElement.detachVisibleChanged(this._updateFormContainerVisibility, this);
			_removeCustomData.call(this, oGroupElement);
		}

		this._updateFormContainerVisibility();
		this._updateLineBreaks();

		return aGroupElements;

	};

	Group.prototype.destroyFormElements = function() {

		FormContainer.prototype.destroyFormElements.apply(this, arguments);

		this._updateFormContainerVisibility();
		this._updateLineBreaks();

		return this;

	};

	/**
	 *
	 * @param {sap.ui.comp.smartform.GroupElement|sap.ui.comp.smartform.SemanticGroupElement} oGroupElement
	 * @private
	 */
	function _enhanceGroupElementBefore(oGroupElement) {
		/**
		 * @deprecated As both settings are deprecated since 1.86 or 1.48 respectively
		 */
		if (!oGroupElement.isA("sap.ui.comp.smartform.SemanticGroupElement")) {
			const iHorizontalLayoutGroupElementMinWidth = this.getHorizontalLayoutGroupElementMinWidth();
			if (iHorizontalLayoutGroupElementMinWidth != oGroupElement.getHorizontalLayoutGroupElementMinWidth()) {
				oGroupElement.setHorizontalLayoutGroupElementMinWidth(iHorizontalLayoutGroupElementMinWidth);
			}
			const bUseHorizontalLayout = this.getUseHorizontalLayout();
			if (bUseHorizontalLayout != oGroupElement.getUseHorizontalLayout()) {
				oGroupElement.setUseHorizontalLayout(bUseHorizontalLayout);
			}
		}

		oGroupElement.attachVisibleChanged(this._updateFormContainerVisibility, this);
		_inheritCustomData.call(this, oGroupElement);

	}

	function _enhanceGroupElementAfter(oGroupElement) {

		this._updateFormContainerVisibility();
		if (this.getUseHorizontalLayout() && this.getUseHorizontalLayout()) {
			oGroupElement._updateGridDataSpan();
			this._updateLineBreaks();
		}

	}

	Group.prototype.setLayout = function(oLayout) {
		oLayout = this.validateAggregation("layout", oLayout, /* multiple */ false);
		return this.setLayoutData(oLayout);
	};

	Group.prototype.getLayout = function() {
		return this.getLayoutData();
	};

	Group.prototype.destroyLayout = function(oLayout) {
		return this.destroyLayoutData();
	};

	/**
	 * Adds some CustomData into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>GroupElement</code> elements and the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the customData to add; if empty, nothing is added
	 * @returns {this} Reference to <code>this</code> to allow method chaining.
	 * @public
	 */
	Group.prototype.addCustomData = function(oCustomData) {

		if (!oCustomData) {
			return this;
		}

		FormContainer.prototype.addCustomData.apply(this, arguments);

		var aGroupElements = this.getGroupElements();
		for (var i = 0; i < aGroupElements.length; i++) {
			_addCustomDataToGroupElement.call(this, aGroupElements[i], oCustomData);
		}

		return this;

	};

	/**
	 * Inserts some customData into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>GroupElement</code> elements and the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the customData to insert; if empty, nothing is inserted
	 * @param {int} iIndex the 0-based index the customData should be inserted at; for a negative value of iIndex, the customData is inserted at position 0; for a value greater than the current size of the aggregation, the customData is inserted at the last position
	 * @returns {this} Reference to <code>this</code> to allow method chaining.
	 * @public
	 */
	Group.prototype.insertCustomData = function(oCustomData, iIndex) {

		if (!oCustomData) {
			return this;
		}

		FormContainer.prototype.insertCustomData.apply(this, arguments);

		var aGroupElements = this.getGroupElements();
		for (var i = 0; i < aGroupElements.length; i++) {
		// order doesn't matter
			_addCustomDataToGroupElement.call(this, aGroupElements[i], oCustomData);
		}

		return this;

	};

	Group.prototype.removeCustomData = function(vCustomData) {

		var oCustomData = FormContainer.prototype.removeCustomData.apply(this, arguments);

		if (oCustomData) {
			var aGroupElements = this.getGroupElements();
			for (var i = 0; i < aGroupElements.length; i++) {
				_removeCustomData.call(this, aGroupElements[i], oCustomData.getId());
			}
		}

		return oCustomData;

	};

	Group.prototype.removeAllCustomData = function() {

		var aCustomData = FormContainer.prototype.removeAllCustomData.apply(this, arguments);

		if (aCustomData.length > 0) {
			var aGroupElements = this.getGroupElements();
			for (var i = 0; i < aGroupElements.length; i++) {
				_removeCustomData.call(this, aGroupElements[i]);
			}
		}

		return aCustomData;

	};

	Group.prototype.destroyCustomData = function() {

		FormContainer.prototype.destroyCustomData.apply(this, arguments);

		var aGroupElements = this.getGroupElements();
		for (var i = 0; i < aGroupElements.length; i++) {
			_removeCustomData.call(this, aGroupElements[i]);
		}

		return this;

	};

	function _inheritCustomData(oGroupElement) {

		var aCustomData = this.getCustomData();

		for (var i = 0; i < aCustomData.length; i++) {
			_addCustomDataToGroupElement.call(this, oGroupElement, aCustomData[i]);
		}

	}

	function _addCustomDataToGroupElement(oGroupElement, oCustomData) {

		if (library.smartform.inheritCostomDataToFields(oCustomData)) {
			var oNewCustomData = oCustomData.clone();
			oNewCustomData._bFromGroup = true;
			oNewCustomData._sOriginalId = oCustomData.getId();
			oGroupElement.addCustomData(oNewCustomData);
		}

	}

	function _removeCustomData(oGroupElement, sOriginalId) {

		var aCustomData = oGroupElement.getCustomData();

		for (var i = 0; i < aCustomData.length; i++) {
			var oCustomData = aCustomData[i];
			if (oCustomData._bFromGroup && (!sOriginalId || sOriginalId == oCustomData._sOriginalId)) {
				oGroupElement.removeCustomData(oCustomData);
			}
		}

	}

	/*
	 * to have the right event handlers attached to the GroupElements and CustomData settings we need
	 * to remove all GroupElement before cloning, add them again afterwards and clone them manually.
	 */
	Group.prototype.clone = function(sIdSuffix, aLocalIds){

		var aGroupElements = this.removeAllGroupElements();

		var oClone = FormContainer.prototype.clone.apply(this, arguments);

		for (var i = 0; i < aGroupElements.length; i++) {
			var oGroupElement = aGroupElements[i];
			var oGroupElementClone = oGroupElement.clone(sIdSuffix, aLocalIds);
			this.addGroupElement(oGroupElement);
			oClone.addGroupElement(oGroupElementClone);
		}

		return oClone;

	};

	/**
	 * @deprecated As of version 1.88 as all branches below are deprecated since then
	 */
	Group.prototype._observeChanges = function(oChanges){

		FormContainer.prototype._observeChanges.apply(this, arguments);

		if (oChanges.name == "label") {
			/**
			 * @deprecated As of version 1.88
			 * @private
			 */
			_labelChanged.call(this, oChanges.current);
		} else if (oChanges.name == "useHorizontalLayout") {
			/**
			 * @deprecated As of version 1.86
			 * @private
			 */
			_useHorizontalLayoutChanged.call(this, oChanges.current);
		} else if (oChanges.name == "horizontalLayoutGroupElementMinWidth") {
			/**
			 * @deprecated As of version 1.48.0
			 * @private
			 */
			_horizontalLayoutGroupElementMinWidthChanged.call(this, oChanges.current);
		}

	};

	// remove "internal" FormContainer functionality from API documentation

	/**
	 * Sets the aggregated <code>title</code>.
	 *
	 * Can either be a <code>Title</code> element or a string.
	 * If a <code>Title</code> element is used, the style of the title can be set.
	 *
	 * <b>Note:</b> If the title is provided as a string, the title is rendered with a theme-dependent default level.
	 * As the <code>SmartForm</code> control cannot know the structure of the page, this might not fit the page structure.
	 * In this case provide the title using a <code>Title</code> element and set its {@link sap.ui.core.Title#setLevel level}
	 * to the required value.
	 *
	 * @param {sap.ui.core.Title|string} vTitle The title to set
	 * @returns {this} <code>this</code> to allow method chaining
	 * @public
	 * @name sap.ui.comp.smartform.Group#setTitle
	 * @function
	 */

	/**
	 * Gets content of aggregation <code>title</code>.
	 *
	 * Can either be a <code>Title</code> element or a string.
	 *
	 * @returns {sap.ui.core.Title|string} Title
	 * @public
	 * @name sap.ui.comp.smartform.Group#getTitle
	 * @function
	 */

	/**
	 * Destroys the title in the aggregation <code>title</code>.
	 *
	 * @returns {this} <code>this</code> to allow method chaining
	 * @public
	 * @name sap.ui.comp.smartform.Group#destroyTitle
	 * @function
	 */

	/**
	 * Adds some <code>formElement</code> to the aggregation <code>formElements</code>.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @param {sap.ui.layout.form.FormElement} oFormElement the <code>formElement</code> to add; if empty, nothing is inserted
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.Group#addFormElement
	 */

	/**
	 * Inserts a <code>formElement</code> into the aggregation <code>formElements</code>.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @param {sap.ui.layout.form.FormElement} oFormElement the <code>formElement</code> to insert; if empty, nothing is inserted
	 * @param {int} iIndex the 0-based index the <code>formElement</code> should be inserted at; for a negative value of iIndex, the <code>formElement</code> is inserted at position 0; for a value greater than the current size of the aggregation, the <code>formElement</code> is inserted at the last position
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.Group#insertFormElement
	 */

	/**
	 * Gets content of aggregation <code>formElements</code>.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @returns {sap.ui.layout.form.FormElement[]} The <code>formElements</code>
	 * @private
	 * @name sap.ui.comp.smartform.Group#getFormElements
	 */

	/**
	 * Checks for the provided <code>sap.ui.layout.form.FormElement</code> in the aggregation <code>groupElements</code>. and returns its index if found or -1 otherwise.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @param {sap.ui.layout.form.FormElement} oFormElement the <code>formElement</code> whose index is looked for
	 * @returns {int} The index of the provided control in the aggregation if found, or -1 otherwise
	 * @private
	 * @name sap.ui.comp.smartform.Group#indexOfFormElement
	 */

	/**
	 * Removes a <code>formElement</code> from the aggregation <code>formElements</code>.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @param {int|string|sap.ui.layout.form.FormElement} vFormElement The <code>formElement</code> to remove or its index or id
	 * @returns {sap.ui.layout.form.FormElement} The removed <code>formElement</code> or null
	 * @private
	 * @name sap.ui.comp.smartform.Group#removeFormElement
	 */

	/**
	 * Removes all the controls from the aggregation <code>formElements</code>.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @returns {sap.ui.layout.form.FormElement[]} An array of the removed elements (might be empty)
	 * @private
	 * @name sap.ui.comp.smartform.Group#removeAllFormElements
	 */

	/**
	 * Destroys all the <code>formElements</code> in the aggregation <code>formElements</code>.
	 *
	 * Do not use the <code>formElements</code> aggregation, use the <code>groupElements</code> aggregation instead.
	 *
	 * @returns {this} Reference to <code>this</code> in order to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.Group#destroyFormElements
	 */

	/**
	 * Sets the aggregated <code>toolbar</code>.
	 *
	 * The <code>toolbar</code> is not supported in <code>sap.ui.comp.smartform.Group</code>.
	 *
	 * @param {sap.ui.core.Toolbar} vToolbar The toolbar to set
	 * @returns {this} <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.Group#setToolbar
	 * @function
	 */

	/**
	 * Gets content of aggregation <code>toolbar</code>.
	 *
	 * The <code>toolbar</code> is not supported in <code>sap.ui.comp.smartform.Group</code>.
	 *
	 * @returns {sap.ui.core.Toolbar} Toolbar
	 * @private
	 * @name sap.ui.comp.smartform.Group#getToolbar
	 * @function
	 */

	/**
	 * Destroys the toolbar in the aggregation <code>toolbar</code>.
	 *
	 * The <code>toolbar</code> is not supported in <code>sap.ui.comp.smartform.Group</code>.
	 *
	 * @returns {this} <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.comp.smartform.Group#destroyToolbar
	 * @function
	 */

	return Group;

});
