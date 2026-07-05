/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/m/library",
	"sap/m/List",
	"sap/m/Popover",
	"sap/m/StandardListItem",
	'sap/m/MultiInput',
	'sap/m/MultiComboBox',
	'sap/m/Select',
	'sap/m/Token',
	'sap/m/Tokenizer',
	'sap/ui/comp/smartfield/SmartField',
	'sap/ui/comp/odata/MetadataAnalyser',
	"sap/ui/core/Messaging",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	'sap/ui/model/BindingMode',
	'sap/ui/comp/odata/ODataType',
	'sap/ui/comp/providers/ValueHelpProvider',
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/core/format/DateFormat",
	"sap/ui/comp/smartfilterbar/FilterProvider",
	"sap/base/Log",
	"sap/base/util/deepEqual",
	"sap/ui/comp/library",
	"sap/ui/core/library",
	"sap/ui/core/ResizeHandler",
	"sap/m/Link",
	"sap/m/Text",
	"sap/m/FlexBox",
	"sap/m/HBox",
	"sap/base/util/isEmptyObject",
	"sap/base/security/sanitizeHTML",
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/date/UI5Date",
	"sap/ui/core/Lib",
	"sap/ui/core/InvisibleText"
], function (
	MLibrary, List, Popover, StandardListItem, MultiInput, MultiComboBox, Select, Token, Tokenizer, SmartField, MetadataAnalyser,
	Messaging, ParseException, ValidateException, BindingMode, ODataType, ValueHelpProvider, FormatUtil,
	DateFormat, FilterProvider, Log, deepEqual, library, coreLibrary, ResizeHandler, Link, Text, FlexBox, HBox, isEmptyObject, sanitizeHTML,
	JQuery, UI5Date, CoreLib, InvisibleText
) {
	"use strict";

	// shortcut for sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation
	var ValueHelpRangeOperation = library.valuehelpdialog.ValueHelpRangeOperation;

	// shortcut for sap.ui.comp.smartfilterbar.DisplayBehaviour
	var DisplayBehaviour = library.smartfilterbar.DisplayBehaviour;

	// shortcut for sap.ui.comp.smartfield.TextInEditModeSource
	var TextInEditModeSource = library.smartfield.TextInEditModeSource;

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	var PlacementType = MLibrary.PlacementType;

	var sIdSuffix = "-mInput";
	var sDisplayIdSuffix = "-mInputTokenizer";
	var sDisplayHBoxSuffix = "-mInputHBox";
	var sDisplayLinkIdSuffix = "-mMoreLink";
	var oBundle = CoreLib.getResourceBundleFor("sap.ui.comp");
	var _oMCBActions = {
		SELECT: "SELECT",
		DESELECT: "DESELECT"
	};

	/**
	 * Constructor for a new <code>sap.ui.comp.smartfield.SmartMultiInput</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class The <code>SmartMultiInput</code> control is a wrapper for other controls that extends the
	 * {@link sap.ui.comp.smartfield.SmartField} control and supports the same settings and annotations.<br>
	 * It interprets OData metadata to create multi-input controls, such as {@link sap.m.MultiInput} and
	 * {@link sap.m.MultiComboBox}.<br>
	 * The OData entity property that is changed or displayed in the control is derived from the control's
	 * <code>value</code> property.
	 * You can use the <code>SmartMultiInput</code> control in two ways:
	 * <ul>
	 * <li>With data binding - the <code>value</code> property is bound to a navigation property
	 * (1:N relationship).</li>
	 * <li>Without data binding - the <code>value</code> property is bound to an arbitrary property of the entity set
	 * that is specified in the <code>entitySet</code> property.</li>
	 * </ul>
	 * Both cases are shown in the example bellow as well as in the samples.
	 * Tokens selected in <code>SmartMultiInput</code> can be retrieved using either the {@link #getTokens}
	 * or the {@link #getValue} method.
	 *
	 * <pre>
	 * &lt;sap.ui.comp.smartmultiinput.SmartMultiInput value=&quot;{Categories/CategoryId}&quot;/&gt;
	 * &lt;sap.ui.comp.smartmultiinput.SmartMultiInput entitySet=&quot;Categories&quot; value=&quot;{CategoryId}&quot;/&gt;
	 * </pre>
	 *
	 * For more details, see the {@link https://ui5.sap.com/#/entity/sap.ui.comp.smartmultiinput.SmartMultiInput samples}.
	 *
	 * Note: Just as the rest of the {@link sap.ui.comp} library, this control supports only OData V2
	 * (see {@link sap.ui.model.odata.v2.ODataModel}) and default models.
	 *
	 * @extends sap.ui.comp.smartfield.SmartField
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @public
	 * @since 1.56.0
	 * @alias sap.ui.comp.smartmultiinput.SmartMultiInput
	 * @see {@link topic:5644169deb76438f800f269b0cb715fc Smart Multi Input}
	 */
	var SmartMultiInput = SmartField.extend("sap.ui.comp.smartmultiinput.SmartMultiInput",
		{
			metadata: {
				library: "sap.ui.comp",
				properties: {
					/**
					 * Enables value help with conditions. Can only be used without binding context. Otherwise, has no effect.
					 */
					supportRanges: {
						type: "boolean",
						defaultValue: false
					},
					/**
					 * Enables multiple selection in value help dialog.
					 */
					supportMultiSelect: {
						type: "boolean",
						defaultValue: true
					},
					/**
					 * Enables specific properties to be provided in the select query.
					 */
					enableODataSelect: {
						type: "boolean",
						defaultValue: false
					},
					/**
					 * Enables requestAtLeast properties to be added additionally when enableODataSelect is set to True. These are comma-separated value of fields that must be requested from the backend.
					 */
					requestAtLeastFields: {
						type: "string",
						defaultValue: ""
					},
					/**
					 * Denotes the separator between texts in the display mode. The default value is loaded from the component resource bundle.
					 */
					textSeparator: {
						type: "string",
						defaultValue: null
					},
					/**
					 * Allows only one token to be added to the SmartMultiInput. Works only in No Data Binding Scenario.
					 * @since 1.101
					 */
					singleTokenMode: {
						type: "boolean",
						defaultValue: false
					}
				},
				aggregations: {
					/**
					 * Aggregation for storing the tokens. Works only in No Data Binding Scenario.
					 * @since 1.101
					 * @public since 1.125
					 */
					initialTokens: {
						type: "sap.m.Token",
						multiple: true
					}
				},
				events: {
					/**
					 * This event is fired before the OData model's <code>create</code> method is called.
					 * Provides object with parameters of the call for editing.
					 */
					beforeCreate: {
						allowPreventDefault: true,
						parameters: {
							/**
							 * Data of the entry that should be created.
							 */
							oData: { type: "object" },
							/**
							 * Parameter map that will be passed to the OData model's <code>create</code> method, accepts the same properties as mParameters of the <code>create</code> method.
							 * Parameters <code>success</code> and <code>error</code> have no meaning as they are changed and used internally.
							 */
							mParameters: { type: "object" }
						}
					},
					/**
					 * This event is fired before the OData model's <code>remove</code> method is called.
					 * Provides object with parameters of the call in key:value format for editing.
					 */
					beforeRemove: {
						allowPreventDefault: true,
						parameters: {
							/**
							 * Parameter map that will be passed to the OData model's <code>remove</code> method, accepts the same properties as mParameters of the <code>remove</code> method.
							 * Parameters <code>success</code> and <code>error</code> have no meaning as they are changed and used internally.
							 */
							mParameters: { type: "object" }
						}
					},
					/**
					 * This event is fired when the tokens aggregation is changed due to a user action (add / remove token).
					 * This event is fired only for token changes in <code>SmartMultiInput</code> elements.
					 */
					tokenUpdate: {
						parameters: {
							/**
							 Type of TokenUpdate event.
							 There are two TokenUpdate types: <code>added</code> and <code>removed</code>.
							 Use Tokenizer.TokenUpdateType.Added for "added" and Tokenizer.TokenUpdateType.Removed for "removed".
							 See {@link sap.m.Tokenizer} for details.
							 */
							type: {
								type: "string"
							},
							/**
							 * The array of tokens that are added.
							 * This parameter is used when tokenUpdate type is "added".
							 */
							addedTokens: { type: "sap.m.Token[]" },

							/**
							 * The array of tokens that are removed.
							 * This parameter is used when tokenUpdate type is "removed".
							 */
							removedTokens: { type: "sap.m.Token[]" }
						}
					},
					/**
					 * This event is fired when item selection is changed.
					 * It is relevant only for selection changes on <code>SmartMultiInput</code> elements with fixed values, such as {@link sap.m.MultiComboBox}.
					 */
					selectionChange: {
						parameters: {

							/**
							 * Item that was selected or deselected.
							 */
							changedItem: { type: "sap.ui.core.Item" },

							/**
							 * Selection state: <code>true</code> if the item is selected, <code>false</code> if
							 * item is not selected.
							 */
							selected: { type: "boolean" }
						}
					},
					/**
					 * Event is fired when user has finished a selection of items in a list box and list box has been closed.
					 * It is relevant only for selection finishes on <code>SmartMultiInput</code> elements with fixed values, such as {@link sap.m.MultiComboBox}.
					 */
					selectionFinish: {
						parameters: {

							/**
							 * The selected items which are selected after list box has been closed.
							 */
							selectedItems: { type: "sap.ui.core.Item[]" }
						}
					}
				}
			},

			renderer: function (oRm, oControl) {
				SmartField.getMetadata().getRenderer().render(oRm, oControl);
				//New Display Mode - Empty Dash Implementation
				if (oControl._oEmptyDash) {
					var bDashVisibility = oControl.getTokens().length > 0 ? false : true;
					oControl._oEmptyDash.setVisible(bDashVisibility);
					if (bDashVisibility && oControl._oMoreLink) {
						oControl._oMoreLink.setVisible(false);
					}
				}
			}
		});

	/**
	 * Returns tokens selected in <code>SmartMultiInput</code>
	 *
	 * @return {sap.m.Token[]} Selected tokens
	 * @public
	 */
	SmartMultiInput.prototype.getTokens = function () {
		if (this._isReadMode() && this._oTokenizer) {
			return this._oTokenizer.getTokens();
		} else if (this._oMultiComboBox && this._oMultiComboBox.getAggregation("tokenizer")) {
			return this._oMultiComboBox.getAggregation("tokenizer").getTokens();
		} else if (this._oMultiInput) {
			return this._oMultiInput.getTokens();
		}
		return [];
	};

	/**
	 * Returns tokens selected in <code>SmartMultiInput</code>
	 *
	 * @return {sap.m.Token[]} Selected tokens
	 * @public
	 */
	SmartMultiInput.prototype.getValue = function () {
		return this.getTokens();
	};

	SmartMultiInput.prototype._createMultiInput = function () {
		var mAttributes = this._createAttributes(),
			aTokens;

		if (this._oMultiComboBox) {
			this._oMultiComboBox.destroy();
			this._oMultiComboBox = null;
		}

		if (this.getSingleTokenMode() && !this.getBindingContext()) {
			mAttributes["maxTokens"] = 1;
		}
		this._oMultiInput = new MultiInput(this.getId() + sIdSuffix, mAttributes);

		this._oMultiInput.attachChange(function (oEvent) {
			this._validateValueOnChange(oEvent.getParameter("value"));
		}, this);

		// create CRUD requests when used with binding context
		if (this.getBindingContext()) {
			this._bindMultiInput();
		} else {
			aTokens = this.getAggregation("initialTokens") || [];
			aTokens.forEach(function(oToken) {
				this._oMultiInput.addToken(oToken);
			}.bind(this));
		}

		// re-fire token update from inner MultiInput
		this._oMultiInput.attachTokenUpdate(function (oEvent) {

			// Doing the validation here rather than after suggestionitemselected event is fired has added advantage that this will be performed always
			// And also, that all validation from SmartMultiInput is done before the consumer does their handling on tokenUpdate event of SmartMultiInput
			this._validateValueOnChange(this._oMultiInput.getValue());
			var mParameters = oEvent.getParameters();
			delete mParameters.id;

			//Removing tokens from inner multi-input which are deleted before firing tokenUpdate of SMI (not in case of TwoWay binding mode)
			if (this.getBinding("value").getBindingMode() !== "TwoWay" || !this.getBindingContext()) {
				if (oEvent.getParameter("removedTokens")) {
					oEvent.getParameter("removedTokens").forEach(function (oToken) {
						oToken.destroy();
					});
				}
			}

			this.fireTokenUpdate(mParameters);
		}, this);

		var mParams = {
			control: this._oMultiInput,
			onCreate: "_onMultiInputCreate", // because we need to override function inside value help provider
			params: {
				// getValue: "getTokens",
				type: {
					type: this._getType(),
					property: this._oFactory._oMetaData.property
				}
			}
		};

		this._initMultiInputValueHelp(mParams);

		return mParams;
	};

	SmartMultiInput.prototype._createMultiComboBox = function () {
		var mAttributes = this._createAttributes();

		if (this.getSingleTokenMode() && !this.getBindingContext()) {
			mAttributes["width"] = "100%";
			delete mAttributes["placeholder"];
		}

		this._oMultiComboBoxRequestStack = {};
		this._oMultiComboBox = this.getSingleTokenMode() && !this.getBindingContext() ? new Select(this.getId() + "mComboBox", mAttributes) : new MultiComboBox(this.getId() + "mComboBox", mAttributes);

		if (this.getBindingContext()) {
			this._bindMultiComboBox();

		} else {
			// for display mode
			this._oMultiInput = this._oMultiComboBox._oTokenizer;
		}
		if (!this.getSingleTokenMode()) {
			// re-fire selectionChange from inner MultiComboBox for bound/unbound filter like multi input
			this._oMultiComboBox.attachSelectionChange(function (oEvent) {
				var mParameters = oEvent.getParameters();
				delete mParameters.id;

				this.fireSelectionChange(mParameters);
			}, this);

			// re-fire selectionFinish from inner MultiComboBox for bound/unbound filter like multi input
			this._oMultiComboBox.attachSelectionFinish(function (oEvent) {
				(() => {
					// This is to handle the scenario where multiple requests are made for the same key, if multicombobox is rendered.
					var aAllKeys = Object.keys(this._oMultiComboBoxRequestStack);
					var existingTokensKeys = (this._oMultiInput.getTokens() || []).map((oToken) => oToken.getKey());
					if (aAllKeys.length > 0) {
						aAllKeys.forEach((sKey) => {
							/**
							 * 1. If the key is not present in the existing tokens, then it is a new request,
							 * 	 in this case, we need to create a new entry if last action is CREATE.
							 * 2. If the key is present in the existing tokens, and the last action is DELETE,
							 * 	 then we need to remove the entry.
							**/
							var aAllRequests = this._oMultiComboBoxRequestStack[sKey],
								index = existingTokensKeys.indexOf(sKey),
								lastRequestObject = aAllRequests[aAllRequests.length - 1],
								oModel = this._getModel();
							if (index === -1) {
								if (lastRequestObject.action === _oMCBActions.SELECT) {
									oModel.createEntry(...aAllRequests[0].params);
								}
							} else if (lastRequestObject.action === _oMCBActions.DESELECT) {
								oModel.remove(...aAllRequests[0].params);
							}
						});
					}
					this._oMultiComboBoxRequestStack = {};
				})();
				var mParameters = oEvent.getParameters();
				delete mParameters.id;
				this.fireSelectionFinish(mParameters);
			}, this);
		} else if (this.getSingleTokenMode() && !this.getBindingContext()) {
			this._oMultiComboBox.attachChange(function (oEvent) {
				var mParameters = oEvent.getParameters();
				delete mParameters.id;

				this.fireSelectionChange(mParameters);
			}, this);
		}

		var mParams = {
			control: this._oMultiComboBox,
			onCreate: "_onCreate",
			params: {
				// getValue: "getSelectedKeys",
				type: {
					type: this._getType(),
					property: this._oFactory._oMetaData.property
				},
				valuehelp: {
					annotation: this._getValueListAnnotation(),
					aggregation: "items",
					noDialog: true,
					noTypeAhead: true
				}
			}
		};

		return mParams;
	};

	SmartMultiInput.prototype._createAttributes = function () {
		var mNames = {
			width: true,
			textAlign: true,
			placeholder: true,
			tooltip: true,
			name: true,
			valueState: true,
			valueStateText: true
		};

		// attaches change event to change event of inner multiInput
		var mAttributes = this._oFactory.createAttributes(null, this._oFactory._oMetaData.property, mNames, {
			event: "change",
			parameter: "value"
		});

		return mAttributes;
	};

	function onOK(oControlEvent) {
		var aTokens = oControlEvent.getParameter("tokens"), oRangeData, sKey, i = 0, aRowData = [], oRowData = null,
			oFormat;
		// First close the dialog, since when used in an aggregation - some model updates (setting IN/OUT params to ODataModel) destroy this
		// instance/control!
		this._onCancel();
		if (this.oControl instanceof MultiInput) {
			// Clearing typed text if value is not selected from suggestion list but rather from ValueHelpDialog
			this.oControl.setValue("");

			var aOldTokens = this.oControl.getTokens();
			var aAddedTokens = [];
			var aRemovedTokens = [];
			// we need to set to controls old instances of the tokens, so that they could be in right time correctly destroyed
			var aNewTokens = [];

			aOldTokens.forEach(function (oOldToken) {
				var bFound = aTokens.some(function (oToken) {
					return oOldToken.getKey() === oToken.getKey();
				});

				if (!bFound) {
					aRemovedTokens.push(oOldToken);
				} else {
					// push new token to copy modified text (if any)
					var oNewToken = aTokens.filter(function (oToken) {
						return oOldToken.getKey() === oToken.getKey();
					})[0];
					//If Binding context is not present and support ranges token is changed
					if (!this.oControl.getBindingContext() && this.bSupportRanges && oNewToken.getKey().startsWith("range_")) {
						aNewTokens.push(oNewToken);
					} else {
						oOldToken.setText(oNewToken.getText());
						aNewTokens.push(oOldToken);
					}
				}
			}.bind(this));

			aTokens.forEach(function (oToken) {
				var bFound = aOldTokens.some(function (oOldToken) {
					return oOldToken.getKey() === oToken.getKey();
				});

				if (!bFound) {
					aAddedTokens.push(oToken);
					aNewTokens.push(oToken);
				}
			});

			this.oControl.setTokens(aNewTokens);
			// Setting the control to busy state until the tokens are created to prevent value help from being opened again
			// BCP: 2080238445
			var oSmartMultiInput = this.oControl.getParent();
			if (oSmartMultiInput && oSmartMultiInput.getBindingContext() && oSmartMultiInput.getBinding("value").getBindingMode() === "TwoWay") {
				var oModel = oSmartMultiInput._getModel(),
					sAggregationEntitySet = oSmartMultiInput._getEntitySetName(),
					mParameters = oModel._resolveGroup(sAggregationEntitySet),
					bIsInDeferredGroup = oModel.getDeferredGroups().indexOf(mParameters.groupId) >= 0;

				if (!bIsInDeferredGroup && (aRemovedTokens.length || aAddedTokens.length) && aNewTokens.length) {
					oSmartMultiInput.setBusyIndicatorDelay(oSmartMultiInput.getBusyIndicatorDelay());
					oSmartMultiInput.setBusy(true);
				}
			}

			this.oControl.fireTokenUpdate({
				type: "tokensChanged",
				removedTokens: aRemovedTokens,
				addedTokens: aAddedTokens
			});
			i = aTokens.length;
			while (i--) {
				oRowData = aTokens[i].data("row");
				if (oRowData) {
					aRowData.push(oRowData);
				}
			}
		} else {
			if (aTokens[0]) {
				// Single Interval
				if (this.bIsSingleIntervalRange) {
					oRangeData = aTokens[0].data("range");
					if (oRangeData) {
						// check if data is in the format: "2005-2014"
						if (this._sType === "datetime") {
							oFormat = DateFormat.getDateTimeInstance(Object.assign({}, this._oDateFormatSettings, {
								UTC: false
							}));

							if (typeof oRangeData.value1 === "string") {
								oRangeData.value1 = UI5Date.getInstance(oRangeData.value1);
							}
							if (oRangeData.operation === "BT") {
								if (typeof oRangeData.value2 === "string") {
									oRangeData.value2 = UI5Date.getInstance(oRangeData.value2);
								}
								sKey = oFormat.format(oRangeData.value1) + "-" + oFormat.format(oRangeData.value2);
							} else {
								sKey = oFormat.format(oRangeData.value1);
							}
						} else if (oRangeData.operation === "BT") {
							sKey = oRangeData.value1 + "-" + oRangeData.value2;
						} else {
							sKey = oRangeData.value1;
						}
					}
				} else {
					sKey = aTokens[0].getKey();
				}
				oRowData = aTokens[0].data("row");
				if (oRowData) {
					aRowData.push(oRowData);
				}
			}
			this.oControl.setValue(sKey);

			// Manually trigger the change event on sapUI5 control since it doesn't do this internally on setValue!
			this.oControl.fireChange({
				value: sKey,
				validated: true
			});
		}
		this._calculateAndSetFilterOutputData(aRowData);
	}

	function calculateAndSetODataModelOutputData(oData) {
		var sLocalFieldName, sValueListFieldName, oValue, mChangedFields = {};
		if (oData && this.mOutParams) {
			for (sLocalFieldName in this.mOutParams) {
				if (sLocalFieldName) {
					sValueListFieldName = this.mOutParams[sLocalFieldName];
					if (sValueListFieldName !== this.sKey) {
						oValue = oData[sValueListFieldName];
						mChangedFields[sLocalFieldName] = oValue;
					}
				}
			}
			if (mChangedFields && !isEmptyObject(mChangedFields)) {
				this.fireEvent("valueListChanged", {
					"changes": mChangedFields
				});
			}
		}
	}

	// function returns width of the text control in pixels when rendered in DOM
	function _getPixelWidth(sText, oControlDomRef) {
		var span = document.createElement("span");
		span.style.whiteSpace = "nowrap";
		span.style.maxWidth = "fit-content";
		span.innerHTML = sText;
		span.className = "sapMText";
		oControlDomRef.appendChild(span);
		var aChildNodes = oControlDomRef.childNodes;
		var iPixelWidth = aChildNodes[aChildNodes.length - 1].offsetWidth;
		oControlDomRef.removeChild(oControlDomRef.childNodes[aChildNodes.length - 1]);
		return iPixelWidth;
	}

	SmartMultiInput.prototype._initMultiInputValueHelp = function (mParams) {
		var sFilterType = this._getFilterType(this._oFactory._oMetaData.property.property),
			oDialog = {},
			oDateFormatSettings = this._getDateFormatSettings(),
			oValueHelpProvider;

		this._oFactory._getValueHelpDialogTitle(oDialog);

		if (this._getValueListAnnotation()) {
			// there is no way how to set display behavior, ControlFactoryBase uses "defaultDropDownDisplayBehaviour" internally
			// can causes problem when value help is generated from annotaion for smart multi input without binding
			// because there can be mismatch between the configuration of the text format of the value help and the smart multi input
			mParams.params.valuehelp = {
				annotation: this._getValueListAnnotation(),
				aggregation: "suggestionRows",
				noDialog: false,
				noTypeAhead: false,
				supportMultiSelect: this.getSingleTokenMode() ? false : this.getSupportMultiSelect(),
				supportRanges: this.getBindingContext() ? false : this.getSupportRanges(),
				type: sFilterType,
				displayBehaviour: this._getDisplayBehaviour()
			};
		} else if (this.getSupportRanges() && !this.getBindingContext()) {
			oValueHelpProvider = new ValueHelpProvider({ // eslint-disable-line no-unused-vars
				fieldName: this._getPropertyName(),
				preventInitialDataFetchInValueHelpDialog: true,
				model: this.getModel(),
				control: this._oMultiInput,
				title: oDialog.dialogtitle,
				supportMultiSelect: this.getSingleTokenMode() ? false : this.getSupportMultiSelect(),
				supportRanges: true,
				type: sFilterType,
				dateFormatSettings: oDateFormatSettings,
				isUnrestrictedFilter: this._isTimeType(sFilterType),
				displayBehaviour: this._getDisplayBehaviour()
			});

			oValueHelpProvider._onOK = onOK;
			oValueHelpProvider._calculateAndSetODataModelOutputData = calculateAndSetODataModelOutputData;
			this._oMultiInput.addValidator(this._validateToken.bind(this));
		} else {
			this._oMultiInput.setShowValueHelp(false);
			this._oMultiInput.addValidator(this._validateToken.bind(this));
		}
	};

	SmartMultiInput.prototype._bindMultiInput = function () {
		var sBindingMode = this.getBinding("value").getBindingMode();

		switch (sBindingMode) {
			case BindingMode.OneTime:
				this._bindMultiInputOneTime();
				break;

			case BindingMode.OneWay:
				this._bindMultiInputOneWay();
				break;

			case BindingMode.TwoWay:
			default:
				this._bindMultiInputTwoWay();
		}
	};

	SmartMultiInput.prototype._bindMultiInputOneTime = function () {
		var that = this;

		this._readNavigationPropertySet().then(function (oResults) {
			oResults.results.forEach(function (oResult) {
				var sKey = oResult[that._getPropertyName()];
				var sDescriptionFieldName = that._getDescriptionFieldName();
				var sDescription = sDescriptionFieldName ? oResult[sDescriptionFieldName] : "";

				that._oMultiInput.addToken(that._createToken(sKey, sDescription));
			});
		});
	};

	SmartMultiInput.prototype._bindMultiInputOneWay = function () {
		this._bindMultiInputTokens(this._oMultiInput);
	};

	SmartMultiInput.prototype._bindMultiInputTwoWay = function () {
		this._bindMultiInputTokens(this._oMultiInput);

		this._oMultiInput.attachTokenUpdate(function (oEvent) {
			// is not called when token is added from value help
			// fireTokenChange is commented out in ValueHelpProvider
			oEvent.getParameter("addedTokens").forEach(this._addToken.bind(this));
			oEvent.getParameter("removedTokens").forEach(this._removeToken.bind(this));
		}, this);
	};
	SmartMultiInput.prototype._bindMultiInputTokens = function (oParentControl) {
		var sNavigationPath = this._getNavigationPath(),
			oSelectExpandParameter = this._getSelectExpandParameter();
		if (!isEmptyObject(oSelectExpandParameter)) {
			/*
			 *	usePreliminaryContext allows multiinput's bindingContext update to be propagated correctly to oDataListBinding.
			 */
			oParentControl.bindAggregation("tokens", {
				path: sNavigationPath,
				parameters: {
					...oSelectExpandParameter,
					usePreliminaryContext: true
				},
				// create token for each entity from the navigation property
				factory: this._tokensFactory.bind(this),
				events: {
					aggregatedDataStateChange: this._processDataState.bind(this)
				}
			});
		} else {
			oParentControl.bindAggregation("tokens", {
				path: sNavigationPath,
				// create token for each entity from the navigation property
				factory: this._tokensFactory.bind(this),
				events: {
					aggregatedDataStateChange: this._processDataState.bind(this)
				}
			});
		}
	};

	/**
	 * AggregatedDataStateChange event handler for processing backend messages
	 * @param {object} oEvent event object
	 * @private
	 */
	SmartMultiInput.prototype._processDataState = function (oEvent) {
		var oDataState = oEvent.getParameter("dataState"),
			oBinding = this.getBinding("value");

		if (!oDataState || !oDataState.getChanges().messages) {
			return;
		}

		if (oBinding && oBinding.bIsBeingDestroyed) {
			return;
		}

		var aMessages = oDataState.getMessages();
		if (aMessages.length) {
			var bUpdateMessageModel = false;
			var oFirstMessage = aMessages[0];

			aMessages.forEach(function (oMessage) {
				if (oMessage.getControlIds().indexOf(this.getId()) == -1) {
					oMessage.addControlId(this.getId());
					bUpdateMessageModel = true;
				}
			}.bind(this));

			this.setValueState(oFirstMessage.getType());
			this.setValueStateText(oFirstMessage.getMessage());

			if (bUpdateMessageModel) {
				Messaging.getMessageModel().checkUpdate(false, true);
			}
		} else {
			this.setValueState(ValueState.None);
			this.setValueStateText("");
		}
	};

	SmartMultiInput.prototype._getSelectExpandParameter = function () {
		var oParameter = {};
		if (this.getEnableODataSelect()) {
			oParameter.select = this._addODataSelectParameters();
		}
		if (this._oFactory._oMetaData.annotations.text && this._oFactory._oMetaData.annotations.text.navigationPathHelp) {
			oParameter.expand = this._oFactory._oMetaData.annotations.text.navigationPathHelp;
		}
		return oParameter;
	};

	SmartMultiInput.prototype._addODataSelectParameters = function (oBinding) {
		//get the property and description
		var sSelect = this._getPropertyName();
		if (this._getDescriptionFieldName()) {
			sSelect = sSelect + "," + this._getDescriptionFieldName();
		}
		if (this.getRequestAtLeastFields()) {
			sSelect = sSelect + "," + this.getRequestAtLeastFields();
		}
		return sSelect;
	};

	/**
	 * This method is overridden from the SmartField implementation so that the metaData of
	 * the EntitySet containing the navigation property is used to determine the SideEffects
	 * instead of the EntitySet of the value to which the SmartMultiInput is bound.
	 * @override
	 */
	SmartMultiInput.prototype._calculateFieldGroupMetaData = function () {
		var oMetaData,
			oParentEntitySetName,
			oParentEntitySet,
			oParentEntityType;

		if (this._oFactory._oMeta) {
			oParentEntitySetName = this._oFactory._oMeta.entitySet;
			oParentEntitySet = this.getModel().getMetaModel().getODataEntitySet(oParentEntitySetName);
			oParentEntityType = this.getModel().getMetaModel().getODataEntityType(oParentEntitySet.entityType);
			oMetaData = {
				entitySet: oParentEntitySet,
				entityType: oParentEntityType,
				path: this._getNavigationPath()
			};
		}
		return oMetaData;
	};

	SmartMultiInput.prototype._bindMultiComboBox = function () {
		var sBindingMode = this.getBinding("value").getBindingMode();

		switch (sBindingMode) {
			case BindingMode.OneTime:
				this._bindMultiComboBoxOneTime();
				break;

			case BindingMode.OneWay:
				this._bindMultiComboBoxOneWay();
				break;

			case BindingMode.TwoWay:
			default:
				this._bindMultiComboBoxTwoWay();
		}
	};

	SmartMultiInput.prototype._bindMultiComboBoxOneTime = function () {
		var that = this;

		this._readNavigationPropertySet().then(function (oResults) {
			var aKeys = oResults.results.map(function (oResult) {
				return oResult[that._getPropertyName()];
			});

			that._oMultiComboBox.setSelectedKeys(aKeys);
		});
	};

	SmartMultiInput.prototype._bindMultiComboBoxOneWay = function () {
		this._createAndAttachHelperMultiInput();
	};

	SmartMultiInput.prototype._bindMultiComboBoxTwoWay = function () {
		this._createAndAttachHelperMultiInput();

		this._oMultiComboBox.attachSelectionChange(function (oEvent) {
			var bSelected = oEvent.getParameter("selected"),
				oItem = oEvent.getParameter("changedItem"),
				oData = {},
				oProperties, oToken, oBindingContext;

			//clear previous messages, if any
			this.setValueState(ValueState.None);
			this.setValueStateText("");

			if (bSelected) {
				oData[this._getPropertyName()] = oItem.getKey();
				oBindingContext = oItem.getBindingContext("list") || oItem.getBindingContext();
				oProperties = oBindingContext.getProperty();
				// the key of the new entity can be formed from multiple properties, in that case take the rest from the binding contect properties if there are any
				this._getEntityType().key.propertyRef.forEach(function (oKey) {
					if (oProperties && oProperties[oKey.name]) {
						oData[oKey.name] = oProperties[oKey.name];
					}
				});
			} else {
				// retrieve corresponding token from the stubbed multiInput and use its correct bindingContext for removal
				oToken = this._oMultiInput.getTokens().filter(function (oTok) {
					return oTok.getKey() === oItem.getKey();
				})[0];
			}
			if (bSelected) {
				this._createEntity(oData, oItem.getKey());
			} else {
				this._removeEntity(oToken?.getBindingContext(), oItem.getKey());
			}
		}, this);
	};

	SmartMultiInput.prototype._readNavigationPropertySet = function () {
		var that = this;

		return new Promise(function (resolve, reject) {
			var oContext = that.getBindingContext(),
				oModel = that._getModel(),
				sNavigationPath = that._getNavigationPath();

			oModel.read(
				sNavigationPath,
				{
					context: oContext,
					success: function (oResults) {
						resolve(oResults);
					},
					error: function (oError) {
						that.setValueState(ValueState.Error);
						that.setValueStateText(oError.responseText);
						reject(oError);
					}
				}
			);
		});
	};

	SmartMultiInput.prototype._createAndAttachHelperMultiInput = function () {
		// "stub" multiinput to get list binding
		this._oMultiInput = new MultiInput({
			maxTokens: this.getSingleTokenMode() ? 1 : undefined
		});
		this._oMultiInput.setBindingContext(this.getBindingContext());
		this._oMultiInput.setModel(this._getModel());
		//binding is done in one common place
		this._bindMultiInputTokens(this._oMultiInput);
		var oBinding = this._oMultiInput.getBinding("tokens");
		this._updateSelectedKeys.call(this); // call it directly because change event has been fired synchronously already
		oBinding.attachChange(this._updateSelectedKeys, this);
	};

	/**
	 * Updates the selected keys, a listener to change event of v2 oDataListBinding
	 * @private
	 */
	  SmartMultiInput.prototype._updateSelectedKeys = function(){
		var aKeys = this?._oMultiInput?.getTokens().map(function(oToken) {
		  return oToken.getKey();
		}) || [];
		if (this._oMultiComboBox) {
			var sBindingMode = this.getBinding("value").getBindingMode();
			if (sBindingMode == BindingMode.TwoWay) {
				if (this._oFactory) {
					//Code inspired from ValueListProvider focusin method
					var oValueListProvider = this._oFactory.getValueListProvider();
					if (oValueListProvider && oValueListProvider.bInitialised) {
						oValueListProvider._calculateFilterInputData();
						// Prevent double filtering if the filter values have not changed
						if (
							oValueListProvider._mLastFilterInputData &&
							!deepEqual(
								oValueListProvider._mLastFilterInputData,
								oValueListProvider.mFilterInputData
							)
						) {
							//Filter the drop down list and invoke value help
							oValueListProvider._filterDropdownRowsByInParameters();
						}
					}
				}
			}
			this._oMultiComboBox.setSelectedKeys(aKeys);
		}
	};

	SmartMultiInput.prototype._getReadTokenList = function () {
		if (!this.oReadTokenList) {
			this.oReadTokenList = new List();
			this.addDependent(this.oReadTokenList);
		}

		return this.oReadTokenList;
	};


	SmartMultiInput.prototype._getReadTokenListPopover = function () {
		if (!this.oReadTokenListPopover) {
			this.oReadTokenListPopover = new Popover({
				showArrow: true,
				placement: PlacementType.Auto,
				showHeader: false,
				contentMinWidth: "auto",
				content: [this.oReadTokenList]
			});
			this.addDependent(this.oReadTokenListPopover);
		}

		return this.oReadTokenListPopover;
	};

	SmartMultiInput.prototype._handleNMoreIndicatorPress = function () {
		var aTokens = this.getTokens();
		if (!aTokens) {
			return;
		}

		var oTokenList = this._getReadTokenList();
		var oReadTokenPopover = this._getReadTokenListPopover();

		oTokenList.removeAllItems();
		for (var i = 0, aItemsLength = aTokens.length; i < aItemsLength; i++) {
			var oToken = aTokens[i],
				oListItem = new StandardListItem({
					title: oToken.getText()
				});

			oTokenList.addItem(oListItem);
		}
		if (this._oMoreLink.getDomRef()) {
			oReadTokenPopover.openBy(this._oMoreLink.getDomRef());
		}
	};

	SmartMultiInput.prototype._onResize = function () {
		if (this._isReadMode() && this._oTokenizer) {
			// prevent rerendering during resizing
			this._deregisterResizeHandler();

			// for some reason tokenizer uses parsed maxWidth style value instead of its actuall width to calculate the number of visible tokens
			// thats why the maxWidth has to be set here to the actual width and maxWidth value of 100% cannot be used
			this._oTokenizer.setMaxWidth(this.$().width() + "px");
			// collapsed mode has to be reenabled everytime tokenizer is changed
			this._oTokenizer.setRenderMode("Narrow");

			this._oTokenizer.scrollToEnd();

			//attach display mode resize handler
			if (this.getMode() === "display" && this.getTokens().length > 0) {
				this._onDisplayResize();
			}

			this._registerResizeHandler();
		}
	};

	/**
	 * Display mode resize handler
	 * @private
	 */
	SmartMultiInput.prototype._onDisplayResize = function () {
		if (this.getDomRef() && this.getDomRef().offsetWidth > 0) {
			var iMultiInputWidth = this.getDomRef().clientWidth,
				iNMoreWidth = this._iHiddenLabelsCount ? _getPixelWidth("999 " + oBundle.getText("POPOVER_DEFINE_MORE_LINKS"), this.getDomRef()) : 0,
				bIsSizeReduced = !this._iHBoxWidth || this._iHBoxWidth + iNMoreWidth > iMultiInputWidth,
				bIsSizeIncreased = (this._iHiddenLabelsCount > 0) && (this._iHBoxWidth + iNMoreWidth + this._iFirstHiddenTokenLength < iMultiInputWidth);

			if (bIsSizeReduced || bIsSizeIncreased) {
				this._oHBox.removeAllItems();
				this.getTokens().forEach(function (oToken) {
					this._oHBox.addItem(this._generateDisplayText(oToken.getText()));
				}.bind(this));
			}
		}
	};

	SmartMultiInput.prototype.onBeforeRendering = function () {
		if (SmartField.prototype.onBeforeRendering) {
			SmartField.prototype.onBeforeRendering.apply(this, arguments);
		}

		this._deregisterResizeHandler();
	};

	SmartMultiInput.prototype.onAfterRendering = function () {
		if (SmartField.prototype.onAfterRendering) {
			SmartField.prototype.onAfterRendering.apply(this, arguments);
		}

		if (this._oTokenizer && this._oTokenizer.getBinding('tokens')) {
			this._oTokenizer.getBinding('tokens').attachChange(this._onTokenizerBindingChange.bind(this));
		}

		if (this.getMode() === "display" && this.bControlNotRendered) {
			this._oHBox.removeAllItems();
			this._oMoreLink.setVisible(false);
			this.getTokens().forEach(function (oToken) {
				var oText = this._generateDisplayText(oToken.getText());
				this._oHBox.addItem(oText);
			}, this);
		}

		if (
			this._oMultiComboBox &&
			this._oMultiInput &&
			this._oMultiInput.getBindingContext() &&
			this.getBindingContext()
		  ) {
			var sBindingPathMultiComboBox = this.getBindingContext().getPath();
			var sBindingPathHelperMultiInput = this._oMultiInput
			  .getBindingContext()
			  .getPath();
			// if bindings for multicombobox are updated.. update same to helperMultiInput.
			if (sBindingPathHelperMultiInput !== sBindingPathMultiComboBox) {
				/**
				 * expectation here is that once bindingContext is updated for _oMultiInput the context udpate gets propagated to respective oDataListBinding as well.
				 * This is handy in case the context updates while moving from the objectPage to listReport and again moving back to objectPage to create a new object and as a result, new binding context.
				 *
				 * Note :- Creating a new oDataListBinding is not recommended. Updating the bindingContext should be  sufficient.
				 * To ensure this, 'usePreliminaryContext' is sent in parameter of bindAggregation at the time of oDataListBinding creation.
				 */
				this._oMultiInput.setBindingContext(this.getBindingContext());
			}
		}
		this._registerResizeHandler();
	};

	SmartMultiInput.prototype._onTokenizerBindingChange = function () {
		/**
		 * if mode is display and there are no tokens to display after removal of tokens (via SideEffect)
		 * in this case _textFactory is not invoked (due to no context) hence display string still contains nMore link,
		 * update the moreLink & emptyDash visiblity accordingly.
		 */
		if (this.getMode() === "display" && this._oTokenizer.getTokens()?.length === 0 && (this._oMoreLink.getVisible() === true)) {
			this._oMoreLink.setVisible(false);
			this._oEmptyDash.setVisible(true);
		}
	};

	SmartMultiInput.prototype._registerResizeHandler = function () {
		if (!this._iResizeHandlerId) {
			this._iResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
		}
	};

	SmartMultiInput.prototype._deregisterResizeHandler = function () {
		if (this._iResizeHandlerId) {
			ResizeHandler.deregister(this._iResizeHandlerId);
			this._iResizeHandlerId = null;
		}
	};

	SmartMultiInput.prototype._hasHTML = function (sText) {
		// regex to check if string has '<some_text>' as it can be HTML
		var regexForHTML = /<[a-z][\s\S]*>/i;
		return regexForHTML.test(sText);
	};

	SmartMultiInput.prototype._createTokenizer = function () {

		this._oTokenizer = new Tokenizer(this.getId() + sDisplayIdSuffix, {
			editable: false,
			visible: false, // made invisible, as display behavior is changed, kept for retaining tokens
			width: "100%" // enables token swiping
		});
		// New Display Mode - Container for storing texts instead of tokens
		this._oHBox = new HBox(this.getId() + sDisplayHBoxSuffix);
		this._oMoreLink = new Link(this.getId() + sDisplayLinkIdSuffix, {
			press: this._handleNMoreIndicatorPress.bind(this),
			ariaLabelledBy: this.getId() + "-label"
		});
		// New Display Mode - Empty Input
		this._oEmptyDash = new Text({
			text: "–",
			visible: true
		});

		var sNavigationPath = this._getNavigationPath(),
			oSelectExpandParameter = this._getSelectExpandParameter();

		if (this.getBindingContext()) {
			this._bindMultiInputTokens(this._oTokenizer);
			this._oHBox.bindAggregation("items", {
				path: sNavigationPath,
				parameters: oSelectExpandParameter,
				factory: this._textFactory.bind(this)
			});
		} else {
			// has to be called every time display mode is changed
			this.attachInnerControlsCreated(this._mirrorTokensToDisplayTokenizer, this);
		}

		// Container replacing tokenizer
		var oFlexContainer = new FlexBox({
			height: "100%",
			items: [
				this._oEmptyDash,
				this._oHBox,
				this._oMoreLink,
				this._oTokenizer
			]
		});

		return {
			control: oFlexContainer,
			onCreate: "_onCreate"
		};
	};

	/**
	 * Factory function which generates texts to be placed inside the HBox
	 * @param {string} sControlId string id for the HBox control
	 * @param {object} oContext binding context
	 * @returns {object} text control, to be added to the HBox
	 * @private
	 */
	SmartMultiInput.prototype._textFactory = function (sControlId, oContext) {

		var vValue = oContext.getProperty(this._getPropertyName()) || "";
		var	sKey = vValue instanceof Date ? this._formatValue(vValue) : vValue.toString(),
			sDescriptionFieldName = this._getDescriptionFieldName(),
			sDescription = sDescriptionFieldName ? oContext.getProperty(sDescriptionFieldName) : "",
			sFormatted = this._getFormattedText(sKey, sDescription),
			oText;

		//Check if the control is already rendered
		if (this.getDomRef() && this.getDomRef().offsetWidth) {
			this.bControlNotRendered = false;
			oText = this._generateDisplayText(sFormatted);
		} else {
			this.bControlNotRendered = true;
			oText = new Text({ text: sFormatted });
		}

		if (this._oEmptyDash) {
			this._oEmptyDash.setVisible(false);
		}
		return oText;
	};

	/**
	 * Function generates texts and determines whether it should be displayed or not.
	 * It also adds N-more label.
	 * @param {string} sText string text for the text control
	 * @returns {object} text control, to be added to the HBox
	 * @private
	 */
	SmartMultiInput.prototype._generateDisplayText = function (sText) {

		var oControlDomRef = this.getDomRef(),
			iMultiInputWidth = oControlDomRef.offsetWidth,
			iNMoreWidth = _getPixelWidth("999 " + oBundle.getText("POPOVER_DEFINE_MORE_LINKS"), oControlDomRef), // more link is assumed to have 3 digit maximum tokens
			oText = new Text(),
			oFirstVisibleText,
			oLastVisibleText,
			sNewText;

		// sanitize text before adding
		sText = this._hasHTML(sText) ? sanitizeHTML(sText) : sText;

		if (!sText) {
			return oText;
		}
		//Reset HBox Width and Hidden Labels count for the first time
		if (this._oHBox.getItems().length === 0) {
			this._iHBoxWidth = 0;
			this._iHiddenLabelsCount = 0;
			this._iFirstHiddenTokenLength = 0;
		}

		//remove tokens that are invisible
		this._oHBox.getItems().filter(function (oToken) {
			return !oToken.getVisible();
		}).forEach(function (oToken) {
			this._oHBox.removeItem(oToken);
		}.bind(this));

		// Add separator only if the text is not the first text
		oText.setTooltip(sText);
		sText = this._iHBoxWidth === 0 ? sText : "\u00a0" + this.getTextSeparator() + "\u00a0" + sText;
		oText.setText(sText);
		var iTextWidth = _getPixelWidth(sText, oControlDomRef);
		this._iHBoxWidth += iTextWidth;

		if (this._iHiddenLabelsCount === 0 && this._iHBoxWidth <= iMultiInputWidth) {
			// Continue adding texts till the HBox width is less than Multi Input width
			this._oMoreLink.setVisible(false);
		} else {
			// Since overflow is happening, this loop removes tokens from the end to
			// accomodate the 'NMore' link. _iHiddenLabelsCount is incremented for
			// every hidden token
			while (this._iHBoxWidth && this._iHBoxWidth > iMultiInputWidth - iNMoreWidth) {
				this._iHiddenLabelsCount += 1;
				if (this._oHBox.getItems()[0]) {
					this._iFirstHiddenTokenLength = _getPixelWidth(this._oHBox.getItems()[0].getText(), oControlDomRef);
					this._iHBoxWidth -= this._iFirstHiddenTokenLength;
					this._oHBox.removeItem(0);
				} else {
					this._iHBoxWidth -= iTextWidth;
					oText.setVisible(false);
				}
			}
			// Display first token even if overflow happens
			if (this._oHBox.getItems().length === 0 && this._iHiddenLabelsCount === 1 && !oText.getVisible()) {
				this._iHiddenLabelsCount = 0;
				this._iHBoxWidth += iTextWidth;
				oText.setVisible(true);
				this._oMoreLink.setVisible(false);
			} else {
				if (this._oHBox.getItems().length > 0) {
					//Adjusting the first visible text
					oFirstVisibleText = this._oHBox.getItems()[0];
					oFirstVisibleText.setText(oFirstVisibleText.getTooltip());

					//Adjusting the existing last text (if any)
					if (this._oHBox.getItems().length - 1 > 0) {
						oLastVisibleText = this._oHBox.getItems()[(this._oHBox.getItems().length - 1)];
						sNewText = "\u00a0" + this.getTextSeparator() + "\u00a0" + oLastVisibleText.getTooltip();
						oLastVisibleText.setText(sNewText);
					}

					//Adding new text at the end
					oText.setText(oText.getText() + "\u00a0" + this.getTextSeparator() + "\u00a0");
				} else {
					//Adding the Text with separator if no items are there in HBox
					oText.setText(oText.getTooltip() + "\u00a0" + this.getTextSeparator() + "\u00a0");
				}
				this._oMoreLink.setVisible(true);
				this._oMoreLink.setText(this._iHiddenLabelsCount + " " + this._getDisplaySubText());
			}
		}

		return oText;
	};

	/**
	 * get text to appear in the display mode after the count (for eg; n More or n Items)
	 *
	 * @private
	 * @returns {string} string to be added as second text after count.
	 */
	SmartMultiInput.prototype._getDisplaySubText = function () {
		return this.getValue().length === this._iHiddenLabelsCount ?
			oBundle.getText("SMARTMULTIINPUT_ITEMS") :
			oBundle.getText("POPOVER_DEFINE_MORE_LINKS");
	};

	/**
	 * Mirrors current tokens from MultiInput to display mode Tokenizer
	 *
	 * @private
	 */
	SmartMultiInput.prototype._mirrorTokensToDisplayTokenizer = function () {
		if (this.getMode() === "display") {
			var aTokens = this._oMultiInput && this._oMultiInput.getTokens();
			this._oTokenizer.removeAllTokens();
			this._oHBox.removeAllItems();
			this._oMoreLink.setVisible(false);

			//Fetch initial tokens from hidden aggregation 'initialTokens'
			if (!aTokens) {
				aTokens = this.getAggregation("initialTokens") || [];
			}
			aTokens.forEach(function (oToken) {
				var oNewToken = new Token({
					text: oToken.getText(),
					key: oToken.getKey()
				});
				this._oTokenizer.addToken(oNewToken);

				var oText = this._generateDisplayText(oToken.getText());
				this._oHBox.addItem(oText);
			}, this);
		}
	};

	/**
	 * Returns the separator which is displayed between text values in display mode.
	 *
	 * @returns {string} return text separator character
	 * @override
	 */
	SmartMultiInput.prototype.getTextSeparator = function () {
		var sTextSeparator = this.getProperty("textSeparator");
		if (sTextSeparator) {
			return sTextSeparator;
		}
		return oBundle.getText("SMARTMULTIINPUT_SEPARATOR");
	};

	SmartMultiInput.prototype._tokensFactory = function (sControlId, oContext) {
		var oToken;

		this.setBusy(false);
		if (this._oFactory) {
			var vValue = oContext.getProperty(this._getPropertyName());
			if (vValue === null || vValue === undefined) {
				oToken = new Token();
				// destroy this empty token after event stack is empty.
				Promise.resolve().then(function () {
					oToken.destroy();
				});
				return oToken;
			}
			var sKey = vValue instanceof Date ? this._formatValue(vValue) : vValue.toString();
			var sDescriptionFieldName = this._getDescriptionFieldName();
			var sDescription = sDescriptionFieldName ? oContext.getProperty(sDescriptionFieldName) : "";
			oToken = this._createToken(sKey, sDescription, oContext);
		} else {
			//when setBindingContext -> null followed by reset fired
			oToken = new Token();
		}
		return oToken;
	};

	SmartMultiInput.prototype._createToken = function (sKey, sDescription, oContext) {
		var sFormatted = this._getFormattedText(sKey, sDescription);
		var oToken;

		oToken = new Token();

		oToken.setKey(sKey);
		oToken.setText(sFormatted);

		return oToken;
	};

	SmartMultiInput.prototype._addToken = function (oToken) {
		var oData = {},
			oContext,
			sLocalFieldName,
			sValueListFieldName,
			oRowData = oToken.data("row"),
			oRangeData = oToken.data("range"); // range data from ranges value help,

		// only send the key of the new entity and backend will do the rest
		oData[this._getPropertyName()] = oToken.getKey();

		// the key of the new entity can be formed from multiple properties, in that case take the rest from value help data
		if (oRowData) {
			this._getEntityType().key.propertyRef.forEach(function (oKey) {
				var sVal = oRowData[oKey.name];
				// allow all truthy values except 0.
				if (sVal || sVal === 0) {
					oData[oKey.name] = sVal;
				}
			});

			//Add properties specified by ValueListParameterOut annotation
			if (this._oFactory._aProviders && this._oFactory._aProviders[0].mOutParams) {
				var oOutParams = this._oFactory._aProviders[0].mOutParams;

				for (sLocalFieldName in oOutParams) {
					if (sLocalFieldName && sLocalFieldName !== this._getPropertyName()) {
						sValueListFieldName = oOutParams[sLocalFieldName];
						oData[sLocalFieldName] = oRowData[sValueListFieldName];
					}
				}
			}
		}

		if (oRangeData) {
			oData["range"] = oRangeData;
		}

		this.setValueState(ValueState.None);
		this.setValueStateText("");

		oContext = this._createEntity(oData);
		oToken.setBindingContext(oContext);
	};

	SmartMultiInput.prototype._createEntity = function (oData, key) {
		var oModel = this._getModel(),
			sAggregationEntitySet = this._getEntitySetName(),
			// correct group need to be added to createEntry parameters so that
			// if sAggregationEntitySet is set to have deferred request it is taken into account
			mParameters = oModel._resolveGroup(sAggregationEntitySet),
			sPath = this._getNavigationPath(),
			bShouldContinue = this.fireBeforeCreate({
				oData: oData,
				mParameters: mParameters
			});

		// force model update, so that newly added entity is properly shown as a new token
		mParameters.refreshAfterChange = true;
		mParameters.context = this.getBindingContext();
		var oBindingContext = mParameters.context;
		var bDeepCreate = oBindingContext && oBindingContext.isTransient && oBindingContext.isTransient();
		if (bDeepCreate) {
			mParameters = {};
		}
		mParameters.properties = oData;
		if (bShouldContinue) {
			if (key) {
				if (!this._oMultiComboBoxRequestStack[key]) {
					this._oMultiComboBoxRequestStack[key] = [];
				}
				this._oMultiComboBoxRequestStack[key].push({
					action: _oMCBActions.SELECT,
					params: [sPath, mParameters]
				});
			} else {
				return oModel.createEntry(
					sPath,
					mParameters
				);
			}
		}
	};

	SmartMultiInput.prototype._removeToken = function (oToken) {
		this._removeEntity(oToken.getBindingContext());

		// prevent memory leak and same id reusage error
		oToken.destroy();
	};

	SmartMultiInput.prototype._removeEntity = function (oContext, key) {
		var oModel = this._getModel(),
			sAggregationEntitySet = this._getEntitySetName(),
			mParameters = oModel._resolveGroup(sAggregationEntitySet),
			bShouldContinue = this.fireBeforeRemove({
				mParameters: mParameters
			});

		// in case of deferred groups, model.create and model.remove would create conflicting changes
		var bIsInDeferredGroup = oModel.getDeferredGroups().indexOf(mParameters.groupId) >= 0;
		if (oContext && bIsInDeferredGroup && this._entityHasPendingCreateChange(oModel, oContext)) {
			// removes entry and cancels the pending create request; does nothing if it does not exist
			oModel.deleteCreatedEntry(oContext);
			// skip calling .remove as the entry was not created on OData service
			bShouldContinue = false;
		}

		// force model update, so that removed entity token is is properly removed
		mParameters.refreshAfterChange = true;
		mParameters.context = oContext;

		if (bShouldContinue) {
			var sPath = ""; // instead of building absolute path, it is taken from the context parameter
			if (key) {
				if (!this._oMultiComboBoxRequestStack[key]) {
					this._oMultiComboBoxRequestStack[key] = [];
				}
				this._oMultiComboBoxRequestStack[key].push({
					action: _oMCBActions.DESELECT,
					params: [sPath, mParameters]
				});
			} else {
				oModel.remove(
					sPath,
					mParameters
				);

			}

		}
	};

	SmartMultiInput.prototype._entityHasPendingCreateChange = function (oModel, oContext) {
		var oPendingChanges = oModel.getPendingChanges();
		var sKey = oModel.getKey(oContext);

		return !!oPendingChanges[sKey] && deepEqual(oPendingChanges[sKey], oContext.getObject());
	};

	SmartMultiInput.prototype._getEntityKeyProperties = function (oContext) {
		var oModel = this._getModel(),
			oEntityType = oModel.oMetadata._getEntityTypeByPath(oContext.getPath()),
			mKeyProperties = {};

		oEntityType.key.propertyRef.forEach(function (oKeyProperty) {
			var sProperty = oKeyProperty.name;
			mKeyProperties[sProperty] = oContext.getProperty(sProperty);
		});

		return mKeyProperties;
	};

	/**
	 * Checks whether a client error has been detected. In addition, this method displays an error message, if it is not already displayed.
	 *
	 * @returns {boolean} <code>true</code>, if a client error has been detected, <code>false</code> otherwise
	 * @public
	 */
	SmartMultiInput.prototype.checkClientError = function () {
		// in display mode: no error.
		if (this.getMode() === "display") {
			return false;
		}

		return !this._validateMultiInput();
	};

	/**
	 * Returns an array of token values in range format.
	 * @returns {Array} array of range values, one for each token
	 * @public
	 */
	SmartMultiInput.prototype.getRangeData = function () {
		var aTokens = this.getTokens(),
			aRangeData = [];

		aTokens.forEach(function (oToken) {
			var mRangeData;
			if (oToken.data("range")) {
				mRangeData = oToken.data("range");
			} else {
				mRangeData = this._getDefaultTokenRangeData(oToken);
			}

			aRangeData.push(mRangeData);
		}, this);

		return aRangeData;
	};

	/** Sets tokens based on given objects with range data. Can only be used without a data binding. Otherwise, has no effect.
	 *
	 * @param {object|object[]} vRangeData object or array of objects with range data. Tokens are created based on this data and fed into the smart multi input.
	 * @public
	 */
	SmartMultiInput.prototype.setRangeData = function (vRangeData) {
		if (!this.getBindingContext()) {
			var aRangeData = Array.isArray(vRangeData) ? vRangeData : [vRangeData];

			if (!this._oMultiInput) {
				// initialise _oMultiInput in "editable" mode
				// change everything to editable so that _createMultiInput gets called and then restore the original state
				var bEditable = this.getEditable(),
					bEnabled = this.getEnabled(),
					bContextEditable = this.getContextEditable();

				this.setEditable(true);
				this.setEnabled(true);
				this.setContextEditable(true);
				this._updateInnerControlsIfRequired();

				this.setEditable(bEditable);
				this.setEnabled(bEnabled);
				this.setContextEditable(bContextEditable);
				this._updateInnerControlsIfRequired();
			}

			this._oMultiInput.removeAllTokens();

			aRangeData.forEach(function (oRangeData) {
				var sText = this._getTokenTextFromRangeData(oRangeData);
				var oToken = new Token({ text: sText, key: sText });

				oToken.data("range", oRangeData);
				this._oMultiInput.addToken(oToken);
			}, this);

			this._mirrorTokensToDisplayTokenizer();
		} else {
			Log.warning("setRangeData can only be used without property binding");
		}
	};

	SmartMultiInput.prototype._getTokenTextFromRangeData = function (oParams) {
		var sTokenText = "";

		switch (oParams.operation) {
			case ValueHelpRangeOperation.EQ:
				sTokenText = "=" + oParams.value1;
				break;

			case ValueHelpRangeOperation.GT:
				sTokenText = ">" + oParams.value1;
				break;

			case ValueHelpRangeOperation.GE:
				sTokenText = ">=" + oParams.value1;
				break;

			case ValueHelpRangeOperation.LT:
				sTokenText = "<" + oParams.value1;
				break;

			case ValueHelpRangeOperation.LE:
				sTokenText = "<=" + oParams.value1;
				break;

			case ValueHelpRangeOperation.Contains:
				sTokenText = "*" + oParams.value1 + "*";
				break;

			case ValueHelpRangeOperation.StartsWith:
				sTokenText = oParams.value1 + "*";
				break;

			case ValueHelpRangeOperation.EndsWith:
				sTokenText = "*" + oParams.value1;
				break;

			case ValueHelpRangeOperation.BT:
				sTokenText = oParams.value1 + "...";
				if (oParams.value2) {
					sTokenText += oParams.value2;
				}

				break;

			default:
				sTokenText = "";
		}

		if (oParams.exclude && sTokenText !== "") {
			sTokenText = "!(" + sTokenText + ")";
		}

		return sTokenText;
	};

	/**
	 * Computes the 'TextInEditModeSource' property. This method is overriden from the SmartField implementation
	 * to avoid the 'defaultTextInEditModeSource' property value propagation
	 * @returns {string} returns computed text
	 * @override
	 */
	SmartMultiInput.prototype._getComputedTextInEditModeSource = function () {
		var sTextInEditModeSource = this.getTextInEditModeSource();

		if (
			this.isPropertyInitial("textInEditModeSource") &&
			this.getMode() === "edit"
		) {
			sTextInEditModeSource = TextInEditModeSource.None;
		}

		return sTextInEditModeSource;
	};

	/**
	 * Returns a filter that can be applied to restrict the OData query.
	 * @returns {sap.ui.model.Filter} filter object based on current SmartMultiInput values
	 * @public
	 */
	SmartMultiInput.prototype.getFilter = function () {
		var aFieldNames = [this._getPropertyName()],
			oData = {},
			aRanges = this.getRangeData(),
			aFilters;

		oData[this._getPropertyName()] = {
			ranges: aRanges,
			items: []
		};


		aFilters = FilterProvider.generateFilters(aFieldNames, oData);

		return aFilters && aFilters.length === 1 && aFilters[0];
	};

	SmartMultiInput.prototype._getDefaultTokenRangeData = function (oToken) {
		var mRangeData = {
			exclude: false,
			operation: ValueHelpRangeOperation.EQ,
			value1: this._parseValue(oToken.getKey()),
			value2: "",
			keyField: this._getPropertyName()
		};

		return mRangeData;
	};

	SmartMultiInput.prototype._validateToken = function (oArgs) {
		var sText = oArgs.text;
		var bValid = this._validateValue(sText);

		if (bValid) {
			var oToken = new Token({ key: sText, text: sText });

			// extend the token with range data if added to smart multi input that supports them but is added directly, without value help
			// if added via value help, the value help provides the range data
			if (this.getSupportRanges()) { // EQ is default operation when condition value help is used
				var mRangeData = this._getDefaultTokenRangeData(oToken);
				oToken.data("range", mRangeData);
				oToken.setText("=" + sText);
			}

			return oToken;
		}
		return undefined;
	};
	SmartMultiInput.prototype._validateMultiInput = function () {
		if (this._oMultiInput.getValueState() !== ValueState.None) {
			return false;
		}

		if (this.getRequired() && this.getTokens().length === 0) {
			this.setValueStateText(
				CoreLib.getResourceBundleFor("sap.ui.comp").getText("VALUEHELPVALDLG_FIELDMESSAGE")
			);
			this.setValueState(ValueState.Error);
			return false;
		} else {
			this.setValueState(ValueState.None);
			this.setValueStateText("");
			return true;
		}
	};

	SmartMultiInput.prototype._validateValueOnChange = function (sValue) {
		if (sValue === "") {
			this.setValueState(ValueState.None);
			this.setValueStateText("");
			this._validateMultiInput();
		} else {
			this._validateValue(sValue);
		}
	};

	SmartMultiInput.prototype._parseValue = function (sValue) {
		return this._getType().parseValue(sValue, "string"); // always parsing value from string
	};

	SmartMultiInput.prototype._formatValue = function (vValue) {
		return this._getType().formatValue(vValue, "string"); // always formatValue to string
	};

	SmartMultiInput.prototype._validateValue = function (sValue) {
		try {
			// smartfield uses internal type of the inner control, smartfield itself is any
			var sParsedValue = this._parseValue(sValue);
			this._getType().validateValue(sParsedValue);
			this.setValueState(ValueState.None);
			this.setValueStateText("");

			return true;
		} catch (oException) {
			this.setValueState(ValueState.Error);
			this.setValueStateText(oException.message);

			var mParameters = {
				element: this._oMultiInput,
				property: "value",
				type: this._getType(),
				newValue: sValue,
				oldValue: null,
				exception: oException,
				message: oException.message
			};

			if (oException instanceof ParseException) {
				this.fireParseError(mParameters);
			} else if (oException instanceof ValidateException) {
				this.fireValidationError(mParameters);
			}

			return false;
		}
	};

	SmartMultiInput.prototype._getModel = function () {
		if (this._oFactory) {
			return this._oFactory._oModel;
		}
		return null;
	};

	SmartMultiInput.prototype._getDateFormatSettings = function () {
		var oDateFormatSettings = this.data("dateFormatSettings");

		if (typeof oDateFormatSettings === "string") {
			try {
				oDateFormatSettings = JSON.parse(oDateFormatSettings);
			} catch (ex) {
				// Invalid dateformat settings provided, Ignore!
			}
		}

		return oDateFormatSettings;
	};

	SmartMultiInput.prototype._getNavigationPath = function () {
		return this._oFactory._oMetaData.navigationPath;
	};

	SmartMultiInput.prototype._getDescriptionFieldName = function () {
		var oDescriptionField = this._oFactory._oMetaData.annotations.text;
		if (oDescriptionField) {
			if (oDescriptionField.navigationPathHelp) {
				return oDescriptionField.navigationPathHelp + "/" + oDescriptionField.property.property.name;
			}
			return oDescriptionField.property.property.name;
		}
	};

	SmartMultiInput.prototype._getType = function () {
		if (!this._oType) {
			var oDateFormatSettings;

			if (this._isEdmTimeType()) {
				oDateFormatSettings = this._getDateFormatSettings();
			}

			this._oType = this._oFactory._oTypes.getType(this._oFactory._oMetaData.property, oDateFormatSettings);
		}

		return this._oType;
	};

	SmartMultiInput.prototype._isEdmTimeType = function () {
		var aTimeEdmTypes = ["Edm.DateTime", "Edm.DateTimeOffset", "Edm.Time"];

		return aTimeEdmTypes.indexOf(this._oFactory._oMetaData.property.property.type) > -1;
	};

	SmartMultiInput.prototype._isTimeType = function (sType) {
		var aTimeTypes = ["date", "datetime", "time"];

		return aTimeTypes.indexOf(sType) > -1;
	};

	SmartMultiInput.prototype._getPropertyName = function () {
		return this._oFactory._oMetaData.property.property.name;
	};

	SmartMultiInput.prototype._getEntitySetName = function () {
		return this._oFactory._oMetaData.entitySet.name;
	};

	SmartMultiInput.prototype._getEntityType = function () {
		return this._oFactory._oMetaData.entityType;
	};

	SmartMultiInput.prototype._getValueListAnnotation = function () {
		return this._oFactory._oMetaData.annotations.valuelist;
	};


	SmartMultiInput.prototype._getDisplayBehaviour = function () {
		var sDisplayBehaviour = this._oFactory._getDisplayBehaviourConfiguration("defaultInputFieldDisplayBehaviour");

		if (!sDisplayBehaviour || sDisplayBehaviour === DisplayBehaviour.auto) {
			sDisplayBehaviour = DisplayBehaviour.descriptionAndId;
		}

		return sDisplayBehaviour;
	};

	/**
	 * Returns text formatted according to display behavior.
	 *
	 * @param {string} sKey key of the property
	 * @param {string} sDescription description for the property
	 * @return {string} formatted text
	 * @private
	 */
	SmartMultiInput.prototype._getFormattedText = function (sKey, sDescription) {
		// taken from BaseValueListProvider

		var sDisplayBehaviour = this._getDisplayBehaviour();
		var sFormattedText = FormatUtil.getFormattedExpressionFromDisplayBehaviour(
			sDisplayBehaviour,
			sKey,
			sDescription
		);
		return this._hasHTML(sFormattedText) ? sanitizeHTML(sFormattedText) : sFormattedText;
	};

	// taken from FilterProvider, edited
	SmartMultiInput.prototype._getFilterType = function (oProperty) {
		if (ODataType.isNumeric(oProperty.type)) {
			return "numeric";
		} else if (oProperty.type === "Edm.DateTime" && oProperty["sap:display-format"] === "Date") {
			return "date";
		} else if (oProperty.type === "Edm.String") {
			return "string";
		} else if (oProperty.type === "Edm.Boolean") {
			return "boolean";
		} else if (oProperty.type === "Edm.Time") {
			return "time";
		} else if (oProperty.type === "Edm.DateTimeOffset") {
			return "datetime";
		}
		return undefined;
	};

	// setEntitySet has to trigger updateBindingContext so that the SmartMultiInput is initialized even without element binding
	SmartMultiInput.prototype.setEntitySet = function () {
		SmartField.prototype.setEntitySet.apply(this, arguments);

		this.updateBindingContext(false, this._getModel());

		return this;
	};

	// same reason as for setEntitySet
	SmartMultiInput.prototype.bindProperty = function (sProperty, oArguments) {
		SmartField.prototype.bindProperty.apply(this, arguments);

		if (sProperty === "value") {
			this.updateBindingContext(false, this._getModel());
		}

		return this;
	};

	SmartMultiInput.prototype._checkComboBox = function () {
		var oCombobox = this._oFactory._oSelector.checkComboBox();

		return oCombobox && oCombobox.combobox;
	};

	SmartMultiInput.prototype._isReadMode = function () {
		return !this.getEditable() || !this.getEnabled() || !this.getContextEditable();
	};


	// get inside ValueHelpProvider instance to override its _onOk function
	function _onMultiInputCreate() {
		this._onCreate.apply(this, arguments);
		if (this._aProviders.length > 0) {
			this._aProviders[0]._onOK = onOK;
			this._aProviders.forEach(function (oProvider) {
				oProvider._calculateAndSetODataModelOutputData = calculateAndSetODataModelOutputData;
			});
		}

	}

	SmartMultiInput.prototype._init = function () {
		var that = this;

		this._oRb = CoreLib.getResourceBundleFor("sap.ui.comp");
		if (this.getSingleTokenMode() && !this._oInvisibleText) {
			this._oInvisibleText = new InvisibleText();
			this._oInvisibleText.toStatic();
			this.addAssociation('ariaLabelledBy', this._oInvisibleText.getId());
			this._oInvisibleText.setText(this._oRb.getText("SMARTMULTIINPUT_SINGLETOKENMODE"));
			this.addDependent(this._oInvisibleText);
		}

		SmartField.prototype._init.apply(this, arguments);

		if (this._oFactory) {
			this._oFactory._createMultiInput = this._createMultiInput.bind(this);
			this._oFactory._createMultiComboBox = this._createMultiComboBox.bind(this);
			this._oFactory._createTokenizer = this._createTokenizer.bind(this);

			this._oFactory._onMultiInputCreate = _onMultiInputCreate;

			this._oFactory._oSelector.getCreator = function (oSettings) {
				var bIsReadMode = (oSettings !== undefined && oSettings.mode !== undefined) ? oSettings.mode === "display" : that._isReadMode();

				if (bIsReadMode) {
					return "_createTokenizer";
				} else if (that._checkComboBox()) {
					return "_createMultiComboBox";
				} else {
					return "_createMultiInput";
				}
			};
		}
	};

	/**
	 * In case of SmartMultiInput it makes sense the control to be in editable state if bound to a not expanded
	 * navigation property.
	 * @override
	 */
	SmartMultiInput.prototype._getEditableForNotExpandedNavigation = function () {
		return true;
	};

	SmartMultiInput.prototype.exit = function () {
		SmartField.prototype.exit.apply(this, arguments);
		this._deregisterResizeHandler();

		if (this._oMultiInput) {
			this._oMultiInput.destroy();
		}
		if (this._oMultiComboBox) {
			this._oMultiComboBox.destroy();
		}
		if (this._oTokenizer) {
			this._oTokenizer.destroy();
		}
		if (this._oHBox) {
			this._oHBox.destroy();
		}

		this._oMultiInput = null;
		this._oMultiComboBox = null;
		this._oTokenizer = null;
		this._oHBox = null;
	};

	return SmartMultiInput;

});
