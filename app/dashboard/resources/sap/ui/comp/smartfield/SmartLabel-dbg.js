/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Label",
	"sap/ui/comp/library",
	"./BindingUtil",
	"./AnnotationHelper",
	"./SmartField",
	"sap/base/strings/capitalize",
	"sap/ui/core/Element",
	"sap/ui/core/EventBus"
], function(
	Control,
	Label,
	library,
	BindingUtil,
	AnnotationHelper,
	SmartField,
	capitalize,
	Element,
	EventBus
) {
	"use strict";

	/**
	 * Constructor for a new smartfield/SmartLabel.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The SmartLabel control extends {@link sap.m.Label sap.m.Label} and displays the label for
	 *        {@link sap.ui.comp.smartfield.SmartField SmartField}. It uses the annotations <code>sap:label</code> or
	 *        <code>com.sap.vocabularies.Common.v1.Label</code> for the label text and <code>sap:quickinfo</code> or
	 *        <code>com.sap.vocabularies.Common.v1.QuickInfo</code> for the tooltip. The mandatory indicator is obtained from the SmartField
	 *        control. The association with a SmartField control is built using the setLabelFor method.
	 * @extends sap.m.Label
	 * @constructor
	 * @alias sap.ui.comp.smartfield.SmartLabel
	 */
	var SmartLabel = Label.extend("sap.ui.comp.smartfield.SmartLabel", /** @lends sap.ui.comp.smartfield.SmartLabel.prototype */
	{
		metadata: {
			designtime: "sap/ui/comp/designtime/smartfield/SmartLabel.designtime",
			interfaces: [
				"sap.ui.core.Label",
				"sap.ui.core.IShrinkable",
				"sap.m.IOverflowToolbarContent",
				"sap.m.IHyphenation"
			],
			library: "sap.ui.comp"
		},
		renderer: {
			apiVersion: 2
		}
	});

	SmartLabel.prototype.init = function() {
		this._sSmartFieldId = null;
		this._bMetaDataApplied = false;
		this._fInnerControlsCreatedHandlers = null;
	};

	/**
	 * Binds the label properties.
	 *
	 * @private
	 */
	SmartLabel.prototype._bindProperties = function() {

		var oSmartField = this._getField();

		if (oSmartField) {
			var oBinding = new BindingUtil();
			var oInfo = null;

			if (!this.isBound("visible")) {
				this.setVisible(oSmartField.getVisible());
			}

			// Label text shouldn't be overwritten if this has
			// already been explicitly set by a public method
			if (!this._bTextSetExplicitly) {
				oInfo = oSmartField.getBindingInfo("textLabel");

				if (oInfo) {
					this.bindProperty("text", oBinding.toBinding(oInfo));
				} else if (!this.getBindingInfo("text")) {
					this._setText(oSmartField.getComputedTextLabel());
				}
			}

			oInfo = oSmartField.getBindingInfo("tooltipLabel");
			if (oInfo) {
				this.bindProperty("tooltip", oBinding.toBinding(oInfo));
			} else {
				this.setTooltip(oSmartField.getTooltipLabel());
			}
		}
	};

	SmartLabel.prototype.onFieldVisibilityChange = function(oControlEvent) {

		if (!this.isBound("visible")) {
			this.setVisible(oControlEvent.getSource().getVisible());
		}
	};

	/**
	 * Triggers the obtainment of the meta data.
	 *
	 * @private
	 */
	SmartLabel.prototype.getLabelInfo = function() {

		var oMetaDataProperty, oLabelInfo;

		var oSmartField = this._getField();

		if (oSmartField) {

			this._bindProperties();
			oMetaDataProperty = oSmartField.getDataProperty();

			if (oMetaDataProperty) {
				oLabelInfo = this._getLabelInfo(oMetaDataProperty);

				if (oLabelInfo) {

					// Label text shouldn't be overwritten if this has
					// already been explicitly set by a public method
					if (oLabelInfo.text && !this._bTextSetExplicitly) {
						this._setProperty(this, "text", oLabelInfo.text);
					}

					if (oLabelInfo.quickinfo) {
						this._setProperty(this, "tooltip", oLabelInfo.quickinfo);
					}
				}
			}
		}
	};

	SmartLabel.prototype._setProperty = function(oObj, sProperty, sValue) {

		if (oObj && sProperty) {

			if (sValue.match(/{@i18n>.+}/gi)) {
				oObj.bindProperty(sProperty, sValue.slice(1, -1));
			} else {
				var sProp = capitalize(sProperty);

				if (!oObj.getBindingInfo(sProperty) && (!oObj["get" + sProp]())) {
					oObj["set" + sProp](sValue);
				}
			}
		}
	};

	SmartLabel.prototype.setLabelFor = function(vSmartField) {
		var oOldLabelForControl = this._getField();
		var sNewSmartFieldId = "";

		if (vSmartField) {
			if (typeof vSmartField === "string") {
				sNewSmartFieldId = vSmartField;
			} else if (vSmartField.getId) {
				sNewSmartFieldId = vSmartField.getId();
			}
		}

		if ((this._fChange || this._fInitialized) && sNewSmartFieldId.length > 0 && sNewSmartFieldId === this._sSmartFieldId) {
			// field not changed do nothing
			return this;
		}

		if (oOldLabelForControl) {
			if (this._fChange) {
				oOldLabelForControl.detachEvent("_change", this._fChange);
				this._fChange = null;
			}
			if (this._fInitialized) {
				oOldLabelForControl.detachInitialise(this._fInitialized);
				this._fInitialized = null;
			}
			this.detachFieldVisibilityChange(oOldLabelForControl);
			this._bMetaDataApplied = false;
		}

		if (sNewSmartFieldId.length > 0) {
			this._sSmartFieldId = sNewSmartFieldId;

			this._setLabelFor();
		} else {
			this._sSmartFieldId = null;
		}

		Label.prototype.setLabelFor.apply(this, arguments);
		var oLabelForControl = Element.getElementById(this.getLabelFor());
		this.detachFieldVisibilityChange(oLabelForControl);
		this.attachFieldVisibilityChange(oLabelForControl);
		return this;
	};

	/**
	 * Attempts to restore link between the SmartLabel and SmartField in cases
	 * where the label is created before the SmartField instance is available.
	 * Mostly during cloning.
	 * @private
	 */
	SmartLabel.prototype._lazyLinkRestore = function () {
		var oEventBus = EventBus.getInstance(),
			fnListener = function (sChannel, sEventId, oData) {
				if (oData.id && oData.id === this._sSmartFieldId) {
					oEventBus.unsubscribe("sap.ui.comp.smartfield.SmartField", "INSTANCE_CREATED", fnListener);
					setTimeout(function () {
						this.getLabelInfo();
					}.bind(this));
				}
			}.bind(this);

		oEventBus.subscribe("sap.ui.comp.smartfield.SmartField", "INSTANCE_CREATED", fnListener);
	};

	SmartLabel.prototype._getField = function() {

		if (this._sSmartFieldId) {
			return Element.getElementById(this._sSmartFieldId);
		}

		return null;
	};

	SmartLabel.prototype._setLabelFor = function() {

		var oDataProperty,
			oSmartField = this._getField();

		if (oSmartField && !this._bMetaDataApplied) {
			this._bMetaDataApplied = true;

			if (oSmartField.getDataProperty) {
				oDataProperty = oSmartField.getDataProperty();

				if (oDataProperty) {
					this.getLabelInfo();
				} else {

					if (!this._fInitialized) {
						this._fInitialized = this.getLabelInfo.bind(this);
						oSmartField.attachInitialise(this._fInitialized);
					}

					if (!this._fChange) {
						this._fChange = function(oEvent) {

							if (oEvent.getParameter("name") === "textLabel") {
								this.getLabelInfo();
							} else if (oEvent.getParameter("name") === "mandatory") {
								this.invalidate(); // as Label gets the required information from field via isRequired of LabelEnablement
							}
						}.bind(this);

						oSmartField.attachEvent("_change", this._fChange);
					}
				}

				this._lateUpdateLabelFor(oSmartField);
			}
		}
	};

	SmartLabel.prototype.updateLabelFor = function(aControls) {
		var aInnerControls = aControls.slice(0);

		if (aInnerControls && aInnerControls.length > 0) {
			this.invalidate();//invalidate for rendering the labelFor is updated via smartfield itsself
			Label.prototype.setLabelFor.call(this, aInnerControls.shift());
			this.updateAriaLabeledBy(aInnerControls);
		}
	};

	SmartLabel.prototype.updateAriaLabeledBy = function(aControls) {

		if (aControls) {

			for (var i = 0; i < aControls.length; i++) {
				var oControl = aControls[i];

				if (typeof oControl.addAriaLabelledBy === "function") {
					oControl.removeAriaLabelledBy(this); // avoid duplicates
					oControl.addAriaLabelledBy(this);
				}
			}
		}
	};

	SmartLabel.prototype.setText = function(sValue) {
		this.setProperty("text", sValue);
		this._bTextSetExplicitly = true;
		return this;
	};

	SmartLabel.prototype._setText = function(sValue) {
		this.setProperty("text", sValue);
	};

	/**
	 * Retrieves all label related data from the OData property of a field
	 *
	 * @param {object} oProperty the definition of a property of an OData entity.
	 * @returns {object} describing label specific data
	 * @private
	 */
	SmartLabel.prototype._getLabelInfo = function(oProperty) {
		var oAnnotationHelper = new AnnotationHelper();

		if (oProperty && oProperty.property) {
			return {
				text: oAnnotationHelper.getLabel(oProperty.property),
				quickinfo: oAnnotationHelper.getQuickInfo(oProperty.property)
			};
		}
	};

	SmartLabel.prototype._delayUpdateLabelFor = function(oSmartField) {
		var that = this;

		if (oSmartField.attachInnerControlsCreated && !this._fInnerControlsCreatedHandlers) {
			this._fInnerControlsCreatedHandlers = function(oEvent) {
				that.updateLabelFor(oEvent.getParameters());
			};

			oSmartField.attachInnerControlsCreated(this._fInnerControlsCreatedHandlers);
		}
	};

	SmartLabel.prototype._lateUpdateLabelFor = function(oSmartField) {
		var aInnerControls;

		if (oSmartField && (oSmartField instanceof SmartField)) {
			aInnerControls = oSmartField.getInnerControls();

			if (aInnerControls && (aInnerControls.length > 0)) {
				this.updateLabelFor(aInnerControls);
			} else {
				this._delayUpdateLabelFor(oSmartField);
			}

			var oLabelForControl = Element.getElementById(this.getLabelFor());
			this.detachFieldVisibilityChange(oLabelForControl);
			this.attachFieldVisibilityChange(oLabelForControl);
		}
	};

	SmartLabel.prototype.onBeforeRendering = function() {
		if (this._sSmartFieldId) {
			var oSmartField = this._getField();

			if (!this._bMetaDataApplied) {
				this._setLabelFor();

				if (!oSmartField) {
					this._lazyLinkRestore();
				} else if (oSmartField && oSmartField.getId() === this.getLabelFor()) {
					this._lateUpdateLabelFor(oSmartField);
				}
			}
		}
	};

	SmartLabel.prototype.attachFieldVisibilityChange = function(oControl) {
		if (oControl && (typeof oControl.attachVisibleChanged === "function")) {
			oControl.attachVisibleChanged(this.onFieldVisibilityChange, this);
		}
	};

	SmartLabel.prototype.detachFieldVisibilityChange = function(oControl) {
		if (oControl && (typeof oControl.detachVisibleChanged === "function")) {
			oControl.detachVisibleChanged(this.onFieldVisibilityChange, this);
		}
	};

	/**
	 * Cleans up the resources associated with this element and all its children. After an element has been destroyed, it can no longer be used on the
	 * UI. Applications should call this method if they don't need the element any longer.
	 *
	 * @param {boolean} bSuppressInvalidate If set to <code>true</code>, UI element is not marked for redraw
	 * @public
	 */
	SmartLabel.prototype.destroy = function(bSuppressInvalidate) {
		var oSmartField = this._getField();
		delete this._bTextSetExplicitly;

		if (oSmartField) {

			if (this._fInnerControlsCreatedHandlers && oSmartField.detachInnerControlsCreated) {
				oSmartField.detachInnerControlsCreated(this._fInnerControlsCreatedHandlers);
				this._fInnerControlsCreatedHandlers = null;
			}

			if (this._fInitialized && oSmartField.detachInitialise) {
				oSmartField.detachInitialise(this._fInitialized);
				this._fInitialized = null;
			}

			if (this._fChange) {
				oSmartField.detachEvent("_change", this._fChange);
				this._fChange = null;
			}
		}

		this._sSmartFieldId = null;
		return Label.prototype.destroy.apply(this, arguments);
	};

	SmartLabel.prototype.exit = function() {
		Label.prototype.exit.apply(this, arguments);
		this.detachFieldVisibilityChange(Element.getElementById(this.getLabelFor()));
	};

	return SmartLabel;

});
