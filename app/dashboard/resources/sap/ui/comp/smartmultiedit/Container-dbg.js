 /*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	".././library",
	"sap/ui/core/Control",
	"sap/ui/comp/smartmultiedit/Field",
	"sap/ui/model/Context",
	"sap/base/Log"
], function(jQuery, library, Control, Field, Context, Log) {
	"use strict";

	/**
	 * Constructor for a new <code>sap.ui.comp.smartmultiedit.Container</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class The SmartMultiEdit.Container control provides a layout for the smart multi edit fields
	 * ({@link sap.ui.comp.smartmultiedit.Field}) it includes and enables them to access the updated binding contexts.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.52.0
	 * @alias sap.ui.comp.smartmultiedit.Container
	 */
	var Container = Control.extend("sap.ui.comp.smartmultiedit.Container", /** @lends sap.ui.comp.smartmultiedit.Container.prototype **/ {
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * The entity set name to fetch metadata for. This entity set should have <code>sap:creatable</code> annotation set to <code>true</code>
				 * as this control needs to create an entry internally for a short period of time.<br>
				 * Please note that this is not a dynamic SAP UI5 property: setting it twice will not result in an update of the property.
				 */
				entitySet: {
					type: "string",
					defaultValue: null
				},
				// `sap.ui.model.Context` is not a valid DataType for properties.
				// We use `any`, but document `sap.ui.model.Context` as type.
				/**
				 * The binding contexts relevant to this mass editing operation.
				 * @type {sap.ui.model.Context[]}
				 */
				contexts: {
					type: "any[]",
					defaultValue: []
				}
			},
			defaultAggregation: "layout",
			aggregations: {
				/**
				 * The form that contains smart multi edit fields ({@link sap.ui.comp.smartmultiedit.Field} controls).
				 */
				layout: {
					type: "sap.ui.comp.smartform.SmartForm",
					multiple: false
				}
			},
			designTime: "sap/ui/comp/designtime/smartmultiedit/Container.designtime"
		},
		renderer: {
			apiVersion: 2,
			render: function (oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.class("sapUiCompSmartMultiEditContainer");
				oRm.openEnd();
				if (oControl._bReadyToRender) {
					oRm.renderControl(oControl.getLayout());
				}
				oRm.close("div");
			}
		}
	});

	Container.prototype.init = function () {
		this._bIsInitialized = false;
		this._bReadyToRender = false;
		this._aFields = null;
		/**
		 * Map for fields with timezone annotation
		 * Example: {TimezoneProperty1: [Field1, Field2], TimezoneProperty2: [Field3]}
		 */
		this._oAnnotatedTimezoneFields = {};
		this.attachEvent("modelContextChange", this._initializeMetadata, this);
	};

	/**
	 * Sets the entity set to read the properties from. Setting this value twice will not result in an update of the underlining components.
	 * @param {string} entitySet Entity set to use.
	 * @returns {this} Returns <code>this</code> to allow method chaining.
	 * @public
	 */
	Container.prototype.setEntitySet = function (entitySet) {
		if (entitySet !== this.getProperty("entitySet")) {
			this.setProperty("entitySet", entitySet, true);
			if (entitySet) {
				this._initializeMetadata();
			}
		}
		return this;
	};

	/**
	 * Sets the contexts to be updated. These contexts are required for offering possible values
	 * and are also used by the {@link sap.ui.comp.smartmultiedit.Container#getAllUpdatedContexts} method.
	 * @param {sap.ui.model.Context[]} contexts Contexts to be used. This property must be an array.
	 * @returns {this} Returns <code>this</code> to allow method chaining.
	 * @public
	 */
	Container.prototype.setContexts = function (contexts) {
		if (Array.isArray(contexts)) {
			for (var i = 0; i < contexts.length; i++) {
				if (!(contexts[i] instanceof Context)) {
					return this;
				}
			}
			this.setProperty("contexts", contexts, true);
			this._getFields().forEach(function(oField) {
				oField._updateContextItems();
			});
		} else {
			Log.error("Parameter contexts is expected to be an array.");
		}
		return this;
	};

	/**
	 * Sets the layout to use.
	 * @param {sap.ui.comp.smartmultiedit.Field} oSmartForm Smart form with the layout.
	 * @returns {this} Returns <code>this</code> to allow method chaining.
	 * @public
	 */
	Container.prototype.setLayout = function (oSmartForm) {
		this.setAggregation("layout", oSmartForm, true);
		this._refreshFields();
		return this;
	};

	Container.prototype.addCustomData = function(oCustomData) {
		var oCustomDataClone;
		if (!oCustomData) {
			return this;
		}
		Control.prototype.addCustomData.apply(this, arguments);
		this._getFields().forEach(function (oField) {
			oCustomDataClone = oCustomData.clone();
			oField._oSmartField.addCustomData(oCustomDataClone);
		});
		return this;
	};

	Container.prototype.insertCustomData = function(oCustomData, iIndex) {
		var oCustomDataClone;
		if (!oCustomData) {
			return this;
		}
		Control.prototype.insertCustomData.apply(this, arguments);
		this._getFields().forEach(function (oField) {
			oCustomDataClone = oCustomData.clone();
			oField._oSmartField.addCustomData(oCustomDataClone);
		});
		return this;
	};

	Container.prototype.removeCustomData = function(vCustomData) {
		var oCustomData = Control.prototype.removeCustomData.apply(this, arguments);
		if (oCustomData) {
			this._getFields().forEach(function (oField) {
				oField._oSmartField.removeCustomData(oCustomData);
			});
		}
		return oCustomData;
	};

	Container.prototype.removeAllCustomData = function() {
		var aCustomData = Control.prototype.removeAllCustomData.apply(this, arguments);
		if (aCustomData.length > 0) {
			this._getFields().forEach(function (oField) {
				aCustomData.forEach(function (oCustomData) {
					oField._oSmartField.removeCustomData(oCustomData);
				});
			});
		}
		return aCustomData;
	};

	Container.prototype.destroyCustomData = function() {
		Control.prototype.destroyCustomData.apply(this, arguments);
		this._getFields().forEach(function (oField) {
			oField._oSmartField.destroyCustomData();
		});
		return this;
	};

	/**
	 * Provides updated objects, including the values of all {@link sap.ui.comp.smartmultiedit.Field} instances in the <code>layout</code> aggregation.<br><br>
	 * The function returns a Promise that is resolved when each {@link sap.ui.model.Context} in the <code>contexts</code> property is copied and updated.
	 * The fulfilled function is called with an array that contains an object for each context in the <code>contexts</code> property.<br>
	 * Each object in this array contains:
	 * <ul>
	 *     <li>A <code>context</code> property that corresponds to the respective context.</li>
	 *     <li>A <code>data</code> property that contains the updated data object.</li>
	 * </ul>
	 *
	 * @public
	 * @param {boolean} [merge] If true, the returned data structure includes all entity set properties per context.
	 * @returns {Promise<sap.ui.model.Context>} A Promise that is resolved when all contexts ({@link sap.ui.model.Context}) are copied and updated.
	 */
	Container.prototype.getAllUpdatedContexts = function (merge) {
		var aContexts = this.getContexts(),
			aUpdatedContexts = [],
			that = this,
			iIndex = 0,
			iStep = 10;
		if (aContexts.length === 0) {
			return Promise.resolve(aUpdatedContexts);
		}
		return new Promise(function (resolve) {
			function getUpdatedContext(contexts, start, end) {
				for (iIndex = start; iIndex < Math.min(end, contexts.length); iIndex++) {
					aUpdatedContexts.push({
						context: contexts[iIndex],
						data: that._getUpdatedDataObject(contexts[iIndex].getObject(), merge)
					});
				}
				if (iIndex < contexts.length) {
					setTimeout(getUpdatedContext.bind(null, aContexts, iIndex, iIndex + iStep), 0);
				} else {
					resolve(aUpdatedContexts);
				}
			}

			getUpdatedContext(aContexts, iIndex, iIndex + iStep);
		});
	};

	/**
	 * Collects all fields that have currently client errors.
	 *
	 * @returns {sap.ui.comp.smartmultiedit.Field[]} An array of fields having client errors.
	 * @public
	 * @deprecated Since version 1.61.0, replaced by <code>getErroneousFieldsAndTokens</code>
	 */
	Container.prototype.getErroneousFields = function () {
		return this._getFields().filter(function (oField) {
			oField._performValidation();
			return oField.hasClientError();
		});
	};

	/**
	 * Collects all fields that currently have client errors.
	 *
	 * @returns {Promise} Resolves with an array of fields having client errors.
	 * @public
	 * @since 1.61.0
	 */
	Container.prototype.getErroneousFieldsAndTokens = function () {
		var aPromises = this._getFields().map(function (oField) {
			return oField._performValidation();
		});

		return Promise.all(aPromises).then(function () {
			var aErrorFields = this._getFields().filter(function (oField) {
				return oField.hasClientError();
			});
			return aErrorFields;
		}.bind(this));
	};

	/**
	 * Explicitly pushes the smart multi edit container's ({@link sap.ui.comp.smartmultiedit.Container}) custom data
	 * to the specified field ({@link sap.ui.comp.smartmultiedit.Field}).
	 * Can be useful when adding fields to a container after it has already been rendered.
	 *
	 * @public
	 * @param {sap.ui.comp.smartmultiedit.Field} oField {@link sap.ui.comp.smartmultiedit.Field} to push the custom data to.
	 */
	Container.prototype.indexField = function (oField) {
		var oCustomDataClone;

		if (!(oField instanceof Field)) {
			Log.error(
				"Container.indexField",
				"Element '" + JSON.stringify(oField) + "' must be of type sap.ui.comp.smartmultiedit.Field",
				"sap.ui.comp.smartmultiedit.Container");
			return;
		}

		this._aFields.push(oField);
		oField._setContainer(this);
		this.getCustomData().forEach(function (oCustomData) {
			if (oField.getSmartField()) {
				oCustomDataClone = oCustomData.clone();
				oField.getSmartField().addCustomData(oCustomDataClone);
			}
		});
	};

	/**
	 * Gets a context object ({@link sap.ui.model.Context}) that includes property names and their updated values.<br>
	 * If <code>merge</code> is true, the returned data structure includes all entity set properties of the context including their current values.<br>
	 * If <code>merge</code> is false, only the modified values of smart multi edit fields ({@link sap.ui.comp.smartmultiedit.Field}) and their entity set properties will be returned.
	 *
	 * @private
	 * @param {object} object Context data.
	 * @param {boolean} merge If true, all entity set properties with updated values are returned.
	 * @returns {object} A copy of a context data object with updated values.
	 */
	Container.prototype._getUpdatedDataObject = function (object, merge) {
		var oData = merge ? Object.assign({}, object) : {},
			sPropertyName, sUomPropertyName, sTextPropertyName,
			oNewValue;

		this._getFields().forEach(function (oField) {
			sPropertyName = oField.getPropertyName();
			sUomPropertyName = oField.getUnitOfMeasurePropertyName();
			oNewValue = oField.getRawValue();
			// Only changed values will be saved or modified in the data object
			if (oNewValue.hasOwnProperty(sPropertyName)) {
				if (oField.isDate() || oField.isDateTime()) {
					if (!object[sPropertyName]) {
						if (oNewValue[sPropertyName]) {
							oData[sPropertyName] = oNewValue[sPropertyName];
						} // else branch is when both are null/undefined and we want to ignore that case
					} else if (!oNewValue[sPropertyName]) {
						oData[sPropertyName] = null;
					} else if (!object[sPropertyName].getTime) {
						Log.error(
							"Container._getUpdatedDataObject",
							"Field " + sPropertyName + " has incompatible data and metadata, expected: Date/DateTime, but found " + typeof oData[sPropertyName],
							"sap.ui.comp.smartmultiedit.Container");
						return;
					} else if (oNewValue[sPropertyName].getTime() !== object[sPropertyName].getTime()) {
						oData[sPropertyName] = oNewValue[sPropertyName];
					}
				} else {
					if ((oNewValue[sPropertyName] !== object[sPropertyName])
						&& (oNewValue[sPropertyName] !== "" && oNewValue[sPropertyName] != null
							|| object[sPropertyName] !== "" && object[sPropertyName] != null)) {
						oData[sPropertyName] = oNewValue[sPropertyName];
					}
				}
			}

			if (oField.isComposite() && oNewValue.hasOwnProperty(sUomPropertyName) && oNewValue[sUomPropertyName] !== object[sUomPropertyName]) {
				oData[sUomPropertyName] = oNewValue[sUomPropertyName];
			} else if (oField.isComboBox()) {
				sTextPropertyName = oField.getRecordTextPath();
				if (oNewValue.hasOwnProperty(sTextPropertyName) && oNewValue[sTextPropertyName] !== object[sTextPropertyName]) {
					oData[sTextPropertyName] = oNewValue[sTextPropertyName];
				}
			}
		});

		return oData;
	};

	/**
	 * Collects all instances of {@link sap.ui.comp.smartmultiedit.Field} and/or {@link sap.ui.core.Control}
	 * scattered across the smart form ({@link sap.ui.comp.smartform.SmartForm}) layout.
	 *
	 * @public
	 * @param {boolean} bFetchAllControls A boolean indicating whether or not to include {@link sap.ui.core.Control} in resultant array.
	 * By default or if it is set to false, only instances of {@link sap.ui.comp.smartmultiedit.Field} are included in resultant array.
	 *
	 * @returns {Array} An array of {@link sap.ui.comp.smartmultiedit.Field} and/or {@link sap.ui.core.Control}.
	 * @public
	 */
	Container.prototype.getFields = function (bFetchAllControls) {
		return this._getFields(bFetchAllControls);
	};

	/**
	 * Collects all instances of {@link sap.ui.comp.smartmultiedit.Field} and/or {@link sap.ui.core.Control}
	 * scattered across the smart form ({@link sap.ui.comp.smartform.SmartForm}) layout.
	 *
	 * @param {boolean} bFetchAllControls A boolean indicating whether or not to include {@link sap.ui.core.Control} in resultant array.
	 * By default or if it is set to false, only instances of {@link sap.ui.comp.smartmultiedit.Field} are included in resultant array.
	 *
	 * @returns {Array} An array of {@link sap.ui.comp.smartmultiedit.Field} and/or {@link sap.ui.core.Control}.
	 * @private
	 */
	Container.prototype._getFields = function (bFetchAllControls) {
		var aAllControls = [];

		if ((bFetchAllControls || !this._aFields || (Array.isArray(this._aFields) && !this._aFields.length)) && this.getLayout()) {
			this._aFields = [];
			this.getLayout().getGroups().forEach(function (oGroup) {
				oGroup.getGroupElements().forEach(function (oGroupElement) {
					oGroupElement.getElements().forEach(function (oElement) {
						if (oElement instanceof Field) {
							this.indexField(oElement);
						} else if (bFetchAllControls) {
							aAllControls.push(oElement);
						}
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}

		return aAllControls.concat(this._aFields || []);
	};

	/**
	 * Initializes the OData metadata.
	 *
	 * @private
	 */
	Container.prototype._initializeMetadata = function () {
		var oModel = this.getModel();
		if (!this._bIsInitialized && this.getEntitySet() && oModel
			&& (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel")) {
				if (!this.getBindingContext()) {
					var oContext = oModel.createEntry("/" + this.getEntitySet());
					this.setBindingContext(oContext);
					this.getModel().resetChanges([oContext.getPath()], undefined, true);
				}
				oModel.getMetaModel().loaded().then(this._onMetadataInitialized.bind(this));
		}
	};

	/**
	 * Called when the model metadata is available.
	 *
	 * @private
	 */
	Container.prototype._onMetadataInitialized = function () {
		if (this._bIsInitialized) {
			return;
		}

		this._bIsInitialized = true;
		this._bReadyToRender = true;
		this.invalidate();
	};

	/**
	 * Resets the SmartMultiEdit Container and all it's fields
	 * @private
	 */
	Container.prototype.resetContainer = function () {
		this._aFields.forEach(function (oField) {
			oField.resetField();
		});

		this._bIsInitialized = false;
	};

	/**
	 * Refreshes internal fields array.
	 * @private
	 */
	Container.prototype._refreshFields = function () {
		this._aFields = null; // Force refresh
		this._getFields();
	};

	return Container;
});
