/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.m.P13nFilterPanel.
sap.ui.define([
	'sap/m/P13nFilterPanel',
	'sap/ui/comp/p13n/P13nConditionPanel',
	"sap/ui/core/Lib",
	'sap/ui/layout/form/SimpleForm',
	'sap/m/library',
	'sap/m/P13nFilterItem',
	'sap/ui/comp/p13n/P13nOperationsHelper',
	'sap/m/P13nFilterPanelRenderer',
	"sap/ui/layout/library"
], function(
	P13nFilterPanelBase,
	P13nConditionPanel,
	Library,
	SimpleForm,
	library,
	P13nFilterItem,
	P13nOperationsHelper,
	P13nFilterPanelRenderer,
	layoutLibrary
) {
	"use strict";

	var P13nPanelType = library.P13nPanelType,
		P13nConditionOperation = library.P13nConditionOperation;

	// shortcut for sap.ui.layout.form.SimpleFormLayout
	var SimpleFormLayout = layoutLibrary.form.SimpleFormLayout;

	/**
	 * Constructor for a P13nFilterPanel.
	 *
	 * This module is only for internal use!
	 *
	 * @class The P13nFilterPanel control is used to define filter-specific settings for {@link sap.ui.comp.valuehelpdialog.ValueHelpDialog} personalization.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @version 1.136.0
	 * @private
	 * @extends sap.m.P13nFilterPanel
	 * @alias {sap.ui.comp.p13n.P13nFilterPanel}
	 */
	var P13nFilterPanel = P13nFilterPanelBase.extend("sap.ui.comp.p13n.P13nFilterPanel", /** @lends sap.m.P13nFilterPanel.prototype */ {
		metadata: {
			library: "sap.ui.comp.p13n",
			properties: {
				/**
				 * Defines the maximum number of include filters.
				 * @deprecated 1.84.1
				 */
				maxIncludes: {
					type: "string",
					group: "Misc",
					defaultValue: '-1'
				},

				/**
				 * Defines the maximum number of exclude filters.
				 * @deprecated 1.84.1
				 */
				maxExcludes: {
					type: "string",
					group: "Misc",
					defaultValue: '-1'
				},

				/**
				 * Defines the maximum number of exclude filters.
				 * @since 1.84.1
				 */
				 maxConditions: {
					type: "string",
					group: "Misc",
					defaultValue: '-1'
				},

				/**
				 * Sets default operation for Condition Panel. In case the newly set
				 * default operation is not valid for the filter's EDM data type, then it is ignored.
				 * expected sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
				 *
				 * @since 1.99
				 */
				defaultOperation: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			}
		},

		renderer: P13nFilterPanelRenderer.renderer
	});

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setConditions = function (aConditions) {
		this._oConditionPanel.setConditions(aConditions);
		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.getConditions = function () {
		return this._oConditionPanel.getConditions();
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setContainerQuery = function (bContainerQuery) {
		this.setProperty("containerQuery", bContainerQuery);
		this._oConditionPanel.setContainerQuery(bContainerQuery);
		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setLayoutMode = function (sMode) {
		this.setProperty("layoutMode", sMode);

		this._oConditionPanel.setLayoutMode(sMode);
		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.validateConditions = function () {
		return this._oConditionPanel.validateConditions();
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.removeInvalidConditions = function () {
		this._oConditionPanel.removeInvalidConditions();
	};


	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.removeValidationErrors = function () {
		this._oConditionPanel.removeValidationErrors();
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setIncludeOperations = function (aOperation, sType, bIsSetExternally) {
		sType = sType || "default";

		this.bEnhanceInclude = !bIsSetExternally;
		this._aIncludeOperations[sType] = aOperation;

		if (this._oConditionPanel) {
			this._oConditionPanel.setOperations(this._aIncludeOperations[sType], sType);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.getIncludeOperations = function (sType) {
		if (this._oConditionPanel) {
			return this._oConditionPanel.getOperations(sType, false);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setExcludeOperations = function (aOperation, sType, bIsSetExternally) {
		sType = sType || "default";

		this.bEnhanceExclude = !bIsSetExternally;
		this._aExcludeOperations[sType] = aOperation;

		if (this._oConditionPanel) {
			this._oConditionPanel.setOperations(this._aExcludeOperations[sType], sType, true);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.getExcludeOperations = function (sType) {
		if (this._oConditionPanel) {
			return this._oConditionPanel.getOperations(sType, true);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setKeyFields = function (aKeyFields, aKeyFieldsExclude) {
		this._aKeyFields = aKeyFields;

		if (this._oConditionPanel) {
			aKeyFields.some(function (oKeyField) {
				if (oKeyField.isDefault) {
					this._oConditionPanel.setAutoAddNewRow(true);
				}
			}.bind(this));
			this._oConditionPanel.setKeyFields && this._oConditionPanel.setKeyFields(aKeyFields);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setMaxConditions = function (sMax) {
		this.setProperty("maxConditions", sMax);

		if (this._oConditionPanel) {
			this._oConditionPanel.setMaxConditions(sMax);
		}
		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setMaxIncludes = function (sMax) {
		this.setProperty("maxIncludes", sMax);

		this._updateIncludeOperations();

		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.setMaxExcludes = function (sMax) {
		this.setProperty("maxExcludes", sMax);

		this._updateExcludeOperations();

		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype._updatePanel = function () {};

	P13nFilterPanel.prototype.setDefaultOperation = function (sOperation) {
		this.setProperty("defaultOperation", sOperation);

		if (this._oConditionPanel) {
			this._oConditionPanel.setDefaultOperation(sOperation);
		}

		return this;
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.init = function () {
		this.setType(P13nPanelType.filter);
		this.setTitle(Library.getResourceBundleFor("sap.m").getText("FILTERPANEL_TITLE"));

		this._aKeyFields = [];

		// init some resources
		this._oRb = Library.getResourceBundleFor("sap.m");

		this._aIncludeOperations = {};
		this._aExcludeOperations = {};

		this.bEnhanceExclude = true;
		this.bEnhanceInclude = true;

		this._oPanel = new SimpleForm({
			layout: SimpleFormLayout.ResponsiveGridLayout
		});

		this._oConditionPanel = new P13nConditionPanel({
			maxConditions: this.getMaxConditions(),
			alwaysShowAddIcon: false,
			layoutMode: this.getLayoutMode(),
			dataChange: this._handleDataChange(),
			defaultOperation: this.getDefaultOperation()
		});
		this._oConditionPanel._sAddRemoveIconTooltipKey = "FILTER";

		this._oPanel.addContent(this._oConditionPanel);

		this.addAggregation("content", this._oPanel);

		if (!this._oOperationsHelper) {
			this._oOperationsHelper = new P13nOperationsHelper();
		}
		this._updateOperations();
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype.onBeforeRendering = function () {
		var aKeyFieldsExclude = [],
			aKeyFields,
			sModelName,
			bEnableEmptyOperations = this.getEnableEmptyOperations();

		if (this._bUpdateRequired) {
			this._bUpdateRequired = false;

			var oMessageStrip = this.getMessageStrip();
			if (oMessageStrip) {
				oMessageStrip.addStyleClass("sapUiResponsiveMargin");
				this.insertAggregation("content", oMessageStrip, 0);
			}

			aKeyFields = [];
			sModelName = (this.getBindingInfo("items") || {}).model;
			var fGetValueOfProperty = function (sName, oContext, oItem) {
				var oBinding = oItem.getBinding(sName),
					oMetadata;

				if (oBinding && oContext) {
					return oContext.getObject()[oBinding.getPath()];
				}
				oMetadata = oItem.getMetadata();
				return oMetadata.hasProperty(sName) ? oMetadata.getProperty(sName).get(oItem) : oMetadata.getAggregation(sName).get(oItem);
			};
			this.getItems().forEach(function (oItem_) {
				var oContext = oItem_.getBindingContext(sModelName),
					oField,
					bNullable,
					oFieldExclude;

				// Update key of model (in case of 'restore' the key in model gets lost because it is overwritten by Restore Snapshot)
				if (oItem_.getBinding("key")) {
					oContext.getObject()[oItem_.getBinding("key").getPath()] = oItem_.getKey();
				}
				aKeyFields.push(oField = {
					key: oItem_.getColumnKey(),
					text: fGetValueOfProperty("text", oContext, oItem_),
					tooltip: fGetValueOfProperty("tooltip", oContext, oItem_),
					maxLength: fGetValueOfProperty("maxLength", oContext, oItem_),
					type: fGetValueOfProperty("type", oContext, oItem_),
					typeInstance: fGetValueOfProperty("typeInstance", oContext, oItem_),
					formatSettings: fGetValueOfProperty("formatSettings", oContext, oItem_),
					precision: fGetValueOfProperty("precision", oContext, oItem_),
					scale: fGetValueOfProperty("scale", oContext, oItem_),
					isDefault: fGetValueOfProperty("isDefault", oContext, oItem_),
					values: fGetValueOfProperty("values", oContext, oItem_)
				});

				if (bEnableEmptyOperations) {
					bNullable = oItem_.getNullable();

					// Copy the oField object and add it to the exclude array - we need this only when exclude
					// operations are enabled
					oFieldExclude = {};
					Object.keys(oField).forEach(function (sKey) {
						oFieldExclude[sKey] = oField[sKey];
					});
					aKeyFieldsExclude.push(oFieldExclude);

					// Manage empty operations for include and exclude scenario
					this._enhanceFieldOperationsWithEmpty(oField, bNullable);

					this._modifyFieldOperationsBasedOnMaxLength(oFieldExclude);
				}

				this._modifyFieldOperationsBasedOnMaxLength(oField);
			}, this);

			this.setKeyFields && this.setKeyFields(aKeyFields, aKeyFieldsExclude);

			var aConditions = [];
			sModelName = (this.getBindingInfo("filterItems") || {}).model;
			this.getFilterItems().forEach(function (oFilterItem_) {

				// the "filterItems" aggregation data - obtained via getFilterItems() - has the old state !
				var oContext = oFilterItem_.getBindingContext(sModelName);
				// Update key of model (in case of 'restore' the key in model gets lost because it is overwritten by Restore Snapshot)
				if (oFilterItem_.getBinding("key") && oContext) {
					oContext.getObject()[oFilterItem_.getBinding("key").getPath()] = oFilterItem_.getKey();
				}
				aConditions.push({
					key: oFilterItem_.getKey(),
					keyField: fGetValueOfProperty("columnKey", oContext, oFilterItem_),
					operation: fGetValueOfProperty("operation", oContext, oFilterItem_),
					value1: fGetValueOfProperty("value1", oContext, oFilterItem_),
					value2: fGetValueOfProperty("value2", oContext, oFilterItem_),
					exclude: fGetValueOfProperty("exclude", oContext, oFilterItem_)
				});
			});
			this.setConditions(aConditions);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype._updateOperations = function () {
		this._updateIncludeOperations();
		this._updateExcludeOperations();
	};

	P13nFilterPanel.prototype._updateIncludeOperations = function () {
		if (this.getMaxIncludes() === "0") {
			this._oOperationsHelper.getIncludeTypes().forEach(function (sType) {
				this.setIncludeOperations([], sType);
			}.bind(this));
		} else {
			this._oOperationsHelper.getIncludeTypes().forEach(function (sType) {
				this.setIncludeOperations(this._oOperationsHelper.getIncludeOperationsByType(sType), sType);
			}.bind(this));
		}
	};

	P13nFilterPanel.prototype._updateExcludeOperations = function () {
		if (this.getMaxExcludes() === "0") {
			this._oOperationsHelper.getExcludeTypes().forEach(function (sType) {
				this.setExcludeOperations([], sType);
			}.bind(this));
		} else {
			this._oOperationsHelper.getExcludeTypes().forEach(function (sType) {
				this.setExcludeOperations(this._oOperationsHelper.getExcludeOperationsByType(sType), sType);
			}.bind(this));
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype._modifyFieldOperationsBasedOnMaxLength = function (oField) {
		var aOperations;

		// check if maxLength is 1 and remove contains, start and ends with operations
		if (oField.maxLength === 1 || oField.maxLength === "1") {
			// Take the operations from the string type (because maxLength is only supported by type string) and remove Contains, StartsWith and EndsWith
			// This operations array on the keyFields will overwrite the type operations which are defined by the type!
			// We could also handle this in the P13nConditionPanel and remove all the not supported operations (e.g. Contains, StartsWith and EndsWith when maxLength == 1)
			// BCP 1970047060
			aOperations = oField.operations ? oField.operations : this._oConditionPanel.getOperations(oField.type);
			oField.operations = [];
			aOperations.forEach(function (sOperation) {
				if ([
					P13nConditionOperation.Contains,
					P13nConditionOperation.StartsWith,
					P13nConditionOperation.EndsWith
				].indexOf(sOperation) === -1) {
					oField.operations.push(sOperation);
				}
			}, this);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype._enhanceFieldOperationsWithEmpty = function (oField, bNullable) {
		var aIncludeOperations,
			aExcludeOperations,
			bDigitSequence = oField && oField.typeInstance && oField.typeInstance.oConstraints && oField.typeInstance.oConstraints.isDigitSequence,
			bFiscalPeriod = oField && oField.typeInstance && (oField.typeInstance.sFiscalType === "IsFiscalPeriod" ||
																oField.typeInstance.sFiscalType === "IsFiscalYearPeriod");

		if (
			["string", "stringdate", "guid"].indexOf(oField.type) > -1 || // For these field types we aways add the empty operation
			(["date", "datetime"].indexOf(oField.type) > -1 && bNullable && !(bDigitSequence && bFiscalPeriod) && !this.bIsSingleIntervalRange) // For date types we add it only if nullable=true
		) {
			// Load operations from the conditions panel
			aIncludeOperations = this._oConditionPanel.getOperations(oField.type, false).slice();
			aExcludeOperations = this._oConditionPanel.getOperations(oField.type, true).slice();
			if (aIncludeOperations.length === 0) {
				// Load default operations in case type based are missing
				// For exclude operations we add only the EQ operation
				aIncludeOperations = this._oConditionPanel.getOperations("default", false);
			}
			if (aExcludeOperations.length === 0) {
				aExcludeOperations = this._oConditionPanel.getOperations("default", true);
			}

			// And we add the "Empty" operation if it's not added before
			if (aIncludeOperations.indexOf(P13nConditionOperation.Empty) === -1 && this.getMaxIncludes() !== "0" && this.bEnhanceInclude) {
				aIncludeOperations.push(P13nConditionOperation.Empty);
			}
			if (aExcludeOperations.indexOf(P13nConditionOperation.NotEmpty) === -1 && this.getMaxExcludes() !== "0" && this.bEnhanceExclude) {
				aExcludeOperations.push(P13nConditionOperation.NotEmpty);
			}

			// Make sure we have operations array available on the field object
			if (!Array.isArray(oField.operations)) {
				oField.operations = [];
			}

			// Add the operations to the field own operations set so we can customize them per field
			oField.operations = oField.operations.concat(aIncludeOperations)
				.concat(aExcludeOperations);
		}
	};

	/*
	 * @override
	 * @private
	 */
	P13nFilterPanel.prototype._handleDataChange = function () {
		var that = this;

		return function (oEvent) {
			var oNewData = oEvent.getParameter("newData"),
				sOperation = oEvent.getParameter("operation"),
				sKey = oEvent.getParameter("key"),
				iIndex = oEvent.getParameter("index"),
				oFilterItem;

			switch (sOperation) {
				case "update":
					oFilterItem = that.getFilterItems()[iIndex];
					if (oFilterItem) {
						oFilterItem.setExclude(oNewData.exclude);
						oFilterItem.setColumnKey(oNewData.keyField);
						oFilterItem.setOperation(oNewData.operation);
						oFilterItem.setValue1(oNewData.value1);
						oFilterItem.setValue2(oNewData.value2);
					}
					that.fireUpdateFilterItem({
						key: sKey,
						index: iIndex,
						filterItemData: oFilterItem
					});
					that.fireFilterItemChanged({
						reason: "updated",
						key: sKey,
						index: iIndex,
						itemData: {
							columnKey: oNewData.keyField,
							operation: oNewData.operation,
							exclude: oNewData.exclude,
							value1: oNewData.value1,
							value2: oNewData.value2
						}
					});
					break;
				case "add":
					if (iIndex >= 0) {
						iIndex++;
					}

					oFilterItem = new P13nFilterItem({
						columnKey: oNewData.keyField,
						exclude: oNewData.exclude,
						operation: oNewData.operation
					});
					oFilterItem.setValue1(oNewData.value1);
					oFilterItem.setValue2(oNewData.value2);

					that._bIgnoreBindCalls = true;
					that.fireAddFilterItem({
						key: sKey,
						index: iIndex,
						filterItemData: oFilterItem
					});

					that.fireFilterItemChanged({
						reason: "added",
						key: sKey,
						index: iIndex,
						itemData: {
							columnKey: oNewData.keyField,
							operation: oNewData.operation,
							exclude: oNewData.exclude,
							value1: oNewData.value1,
							value2: oNewData.value2
						}
					});

					that._bIgnoreBindCalls = false;
					break;
				case "remove":
					that._bIgnoreBindCalls = true;
					that.fireRemoveFilterItem({
						key: sKey,
						index: iIndex
					});
					that.fireFilterItemChanged({
						reason: "removed",
						key: sKey,
						index: iIndex
					});
					that._bIgnoreBindCalls = false;
					break;
				default:
					throw "Operation'" + sOperation + "' is not supported yet";
			}
			that._notifyChange();
		};
	};

	P13nFilterPanel.prototype.getConditionPanel = function () {
		return this._oConditionPanel;
	};

	P13nFilterPanel.prototype.setInnerTitle = function (sTitle) {
		this._oPanel && this._oPanel.setHeaderText(sTitle);
	};

	P13nFilterPanel.prototype.setSuggestCallback = function (fnSuggestCallback) {
		if (this._oConditionPanel) {
			this._oConditionPanel.setSuggestCallback(fnSuggestCallback);
		}
	};

	return P13nFilterPanel;
});
