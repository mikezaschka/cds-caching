/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartlist.SmartList.
sap.ui.define([
	'sap/ui/comp/library',
	'sap/m/library',
	'sap/m/VBox',
	'sap/m/FlexItemData',
	'sap/m/List',
	'sap/m/Tree',
	'sap/m/Title',
	'sap/m/Toolbar',
	'sap/m/OverflowToolbar',
	'sap/m/ToolbarSpacer',
	'sap/m/OverflowToolbarButton',
	'sap/ui/comp/odata/ODataModelUtil',
	'sap/ui/comp/util/FullScreenUtil',
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	'sap/ui/core/format/NumberFormat',
	"sap/base/util/deepEqual"
], function(library, MLibrary, VBox, FlexItemData, List, Tree, Title, Toolbar, OverflowToolbar, ToolbarSpacer, OverflowToolbarButton, ODataModelUtil, FullScreenUtil, Element, Library, NumberFormat, deepEqual) {
	"use strict";

	// shortcut for sap.m.ToolbarDesign
	var ToolbarDesign = MLibrary.ToolbarDesign;

	/**
	 * Constructor for a new smartlist/SmartList.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A smart control to simplify using the <code>sap.m.List</code> and <code>sap.m.Tree</code> controls in list patterns.
	 *        <h3>Overview</h3>
	 *        The <code>SmartList</code> control creates a list or tree based on the configuration specified. There is, however, a difference to
	 *        other smart controls: This control does not use annotations to automatically create its content. Hence, a template must always be
	 *        provided for this control.
	 *        <h3>Structure</h3>
	 *        The <code>SmartList</code> control consists of the following elements:
	 *        <ul>
	 *        <li> <code>OverflowToolbar</code> control: Displays the header and other action buttons. Users can add their own toolbar and buttons
	 *        in the view.</li>
	 *        <li> <code>List</code> or <code>Tree</code> control: The actual list/tree control. Users can also add this in the view with the
	 *        required configuration.</li>
	 *        </ul>
	 *        The <code>entitySet</code> property must be specified to use the control. This attribute is used to fetch the actual data.<br>
	 *        The <code>listItemTemplate</code> aggregation must also be specified with the required item template, such as
	 *        <code>StandardListItem/StandardTreeItem</code>, which will be used during binding.
	 *        <h3><b>Note:</b></h3>
	 *        Most of the attributes/properties are not dynamic and cannot be changed once the control has been initialized.
	 * @extends sap.m.VBox
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @since 1.48
	 * @alias sap.ui.comp.smartlist.SmartList
	 */
	var SmartList = VBox.extend("sap.ui.comp.smartlist.SmartList", /** @lends sap.ui.comp.smartlist.SmartList.prototype */
	{
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * The entity set name from which to fetch data.<br>
				 * <i>Note:</i><br>
				 * This is not a dynamic UI5 property.
				 *
				 * @since 1.48.0
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be selected when request is sent to the backend.<br>
				 * <i>Note:</i><br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.<br>
				 * This property is only needed when used together with an <code>ODataModel</code>.
				 *
				 * @since 1.48.0
				 */
				selectFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be expanded when request is sent to the backend.<br>
				 * <i>Note:</i><br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.<br>
				 * This property is only needed when used together with an <code>ODataModel</code>.
				 *
				 * @since 1.48.0
				 */
				expandFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The number of rows is shown along with the header text if the property <code>showRowCount</code> is set to <code>true</code>.
				 *
				 * <b>Note:</b>
				 * <ul>
				 * <li>To improve your application's performance, activate the inline count for OData bindings to avoid sending dedicated OData requests.</li>
				 * <li>If no stable overall count can be retrieved from the binding, the count will not be displayed. This is currently the case for TreeBinding or if no count is requested by the binding.</li>
				 * </ul>
				 *
				 * @since 1.48.0
				 */
				showRowCount: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Specifies header text that is shown in list.
				 *
				 * @since 1.48.0
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * When set to <code>true</code>, this enables automatic binding of the list using the <code>listBindingPath</code> (if it
				 * exists) or <code>entitySet</code> property. This happens right after the <code>initialise</code> event has been fired.
				 *
				 * @since 1.48.0
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},
				/**
				 * Specifies the path that is used during the binding of the list. If not specified, the <code>entitySet</code> property is used
				 * instead. (used only if binding is done automatically or when using <code>rebindList</code>)
				 *
				 * @since 1.48.0
				 */
				listBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * Specifies the type of list to be created in the <code>SmartList</code> control.<br>
				 * <i>Note:</i><br>
				 * If you add a <code>List</code> or <code>Tree</code> to the content of the <code>SmartList</code> control in the view, this
				 * property has no effect.
				 *
				 * @since 1.48.0
				 */
				listType: {
					type: "sap.ui.comp.smartlist.ListType",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * Controls the visibility of the full screen button.
				 *
				 * @since 1.48.0
				 */
				showFullScreenButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			},
			associations: {
				/**
				 * The <code>SmartFilterBar</code> control to be linked to the <code>SmartList</code> control. Some events of the
				 * <code>SmartFilterBar</code> control are then used to fetch data, show overlay etc.
				 *
				 * @since 1.48.0
				 */
				smartFilter: {
					type: "sap.ui.core.Control"
				}
			},
			aggregations: {
				/**
				 * Specifies the template that is used for the inner <code>List</code> or <code>Tree</code> control.<br>
				 * <b>Note:</b><br>
				 * This template is used when binding the <code>items</code> of <code>sap.m.List</code> or <code>sap.m.Tree</code> control, and
				 * will not be available in the <code>SmartList</code> control once the binding has been done.
				 *
				 * @since 1.48.0
				 */
				listItemTemplate: {
					type: "sap.m.ListItemBase",
					multiple: false
				}
			},
			events: {
				/**
				 * Event fired once the control has been initialized.
				 *
				 * @since 1.48.0
				 */
				initialise: {},
				/**
				 * Event fired right before the binding is being done.
				 *
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.bindingParams The bindingParams object contains filters, sorters and other
				 *        binding-related information for the list
				 * @param {boolean} oControlEvent.getParameters.bindingParams.preventTableBind If set to <code>true</code> by the listener, binding
				 *        is prevented
				 * @param {sap.ui.model.Filter[]} oControlEvent.getParameters.bindingParams.filters The combined filter array containing a set of
				 *        <code>sap.ui.model.Filter</code> instances from the <code>SmartList</code> and <code>SmartFilter</code> controls; can
				 *        be modified by users to influence filtering
				 * @param {sap.ui.model.Sorter[]} oControlEvent.getParameters.bindingParams.sorter An array containing a set of
				 *        <code>sap.ui.model.Sorter</code> instances from the <code>SmartList</code> control (personalization); can be modified by
				 *        users to influence sorting
				 * @since 1.48.0
				 */
				beforeRebindList: {},
				/**
				 * Event fired when data is received after binding. The event is usually only fired if the binding for the list is done by the
				 * <code>SmartList</code> control itself.
				 *
				 * @since 1.48.0
				 */
				dataReceived: {}
			}
		},
		renderer: {
			apiVersion: 2
		},
		constructor: function() {
			VBox.apply(this, arguments);
			this.addStyleClass("sapUiCompSmartList");
			this._createToolbar();
			this._createList();
			this.attachModelContextChange(this._initialiseMetadata, this);
		}
	});
	// default aggregation
	SmartList.prototype._sAggregation = "items";

	SmartList.prototype.setHeader = function(sText) {
		this.setProperty("header", sText, true);
		this._refreshHeaderText();
		return this;
	};

	SmartList.prototype.setShowRowCount = function(bShow) {
		this.setProperty("showRowCount", bShow, true);
		this._refreshHeaderText();
		return this;
	};

	SmartList.prototype.setShowFullScreenButton = function(bShowFullScreenButton) {
		this.setProperty("showFullScreenButton", bShowFullScreenButton, true);
		if (this._oFullScreenButton) {
			this._oFullScreenButton.setVisible(this.getShowFullScreenButton());
		}
		return this;
	};

	SmartList.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName);
		this._initialiseMetadata();
		return this;
	};

	/**
	 * sets the header text
	 *
	 * @private
	 */
	SmartList.prototype._refreshHeaderText = function() {
		if (!this._headerText) {
			return;
		}

		var sText = this.getHeader();
		var bTextVisible = !!sText;
		this._headerText.setVisible(bTextVisible);

		if (bTextVisible && this.getShowRowCount()) {
			var iRowCount = parseInt(this._getRowCount(true));
			if (iRowCount > 0) {
				if (!this._oNumberFormatter) {
					this._oNumberFormatter = NumberFormat.getFloatInstance();
				}
				var sValue = this._oNumberFormatter.format(iRowCount);
				sText += " (" + sValue + ")";
			}
		}
		this._headerText.setText(sText);
	};

	/**
	 * creates the fullscreen button and adds it into toolbar
	 */
	SmartList.prototype._addFullScreenButton = function() {
		// always remove content first
		if (this._oFullScreenButton) {
			this._oToolbar.removeContent(this._oFullScreenButton);
		}
		if (this.getShowFullScreenButton()) {
			if (!this._oFullScreenButton) {
				this._oFullScreenButton = new OverflowToolbarButton(this.getId() + "-btnFullScreen", {
					press: function() {
						this._toggleFullScreen(!this.bFullScreen);
					}.bind(this)
				});
			}
			this._toggleFullScreen(this.bFullScreen, true);
			this._oToolbar.addContent(this._oFullScreenButton);
		}
	};
	/**
	 * creates the toolbar
	 *
	 * @private
	 */
	SmartList.prototype._createToolbar = function() {
		var aContent, iLen, oToolbar;
		if (!this._oToolbar) {
			aContent = this.getItems();
			iLen = aContent ? aContent.length : 0;
			// Check if a Toolbar already exists in the content (Ex: from view.xml)
			while (iLen--) {
				oToolbar = aContent[iLen];
				if (oToolbar instanceof Toolbar) {
					break;
				}
				oToolbar = null;
			}
			if (oToolbar) {
				this._oToolbar = oToolbar;
			} else {
				this._oToolbar = new OverflowToolbar(this.getId() + "-toolbar", {
					design: ToolbarDesign.Transparent
				});
				this.insertItem(this._oToolbar, 0);
			}
			// Set layoutData on the toolbar, if none already exists
			if (!this._oToolbar.getLayoutData()) {
				this._oToolbar.setLayoutData(new FlexItemData({
					shrinkFactor: 0
				}));
			}
		}
	};
	/**
	 * Toggles between fullscreen and normal view mode
	 *
	 * @param {boolean} bValue - the new value of FullScreen
	 * @param {boolean} bForced - whether setting FullScreen is forced
	 * @private
	 */
	SmartList.prototype._toggleFullScreen = function(bValue, bForced) {
		var resourceB = Library.getResourceBundleFor("sap.ui.comp"), sText;

		if (!this._oFullScreenButton || (bValue === this.bFullScreen && !bForced)) {
			return;
		}

		this.bFullScreen = bValue;

		FullScreenUtil.toggleFullScreen(this, this.bFullScreen, this._oFullScreenButton, this._toggleFullScreen);

		sText = this.bFullScreen ? resourceB.getText("CHART_MINIMIZEBTN_TOOLTIP") : resourceB.getText("CHART_MAXIMIZEBTN_TOOLTIP");
		this._oFullScreenButton.setTooltip(sText);
		this._oFullScreenButton.setText(sText);
		this._oFullScreenButton.setIcon(this.bFullScreen ? "sap-icon://exit-full-screen" : "sap-icon://full-screen");
	};

	/**
	 * creates the toolbar content
	 *
	 * @private
	 */
	SmartList.prototype._createToolbarContent = function() {
		if (!this._oToolbar) {
			this._createToolbar();
		}
		// insert the items in the custom toolbar in reverse order => insert always at position 0
		this._addHeaderToToolbar();

		// add spacer to toolbar
		this._addSpacerToToolbar();

		// First show Display/Edit icon, then Personalisation and finally Excel Export
		this._addFullScreenButton();

		this._oToolbar.addStyleClass("sapMTBHeader-CTX");
	};

	/**
	 * adds the header line to the toolbar
	 *
	 * @private
	 */
	SmartList.prototype._addHeaderToToolbar = function() {
		// always remove content first
		if (this._headerText) {
			this._oToolbar.removeContent(this._headerText);
		}

		if (!this._headerText) {
			this._headerText = new Title(this.getId() + "-header");
			this._headerText.addStyleClass("sapMH4Style");
			this._headerText.addStyleClass("sapUiCompSmartTableHeader");
		}

		this._refreshHeaderText();
		this._oToolbar.insertContent(this._headerText, 0);
	};

	/**
	 * adds a spacer to the toolbar
	 *
	 * @private
	 */
	SmartList.prototype._addSpacerToToolbar = function() {
		var bFoundSpacer = false, aItems = this._oToolbar.getContent(), i, iLength;
		if (aItems) {
			iLength = aItems.length;
			i = 0;
			for (i; i < iLength; i++) {
				if (aItems[i] instanceof ToolbarSpacer) {
					bFoundSpacer = true;
					break;
				}
			}
		}

		if (!bFoundSpacer) {
			this._oToolbar.addContent(new ToolbarSpacer(this.getId() + "-toolbarSpacer"));
		}
	};

	/**
	 * gets list's row count
	 *
	 * @private
	 * @returns {int} the row count
	 */
	SmartList.prototype._getRowCount = function(bConsiderTotal) {
		var oRowBinding = this._getRowBinding();

		if (!oRowBinding) {
			return bConsiderTotal ? undefined : 0;
		}

		var iRowCount;

		if (!bConsiderTotal) {
			iRowCount = oRowBinding.getLength();
		} else {
			if (typeof oRowBinding.getCount === 'function') {
				iRowCount = oRowBinding.getCount();
			} else if (!oRowBinding.isA('sap.ui.model.TreeBinding')
					&& typeof oRowBinding.isLengthFinal === 'function'
					&& oRowBinding.isLengthFinal()) {
				// This branch is only fallback and for TreeBindings (Explicitly excluded because Binding#getLength is numberOfExpandedLevels dependent)
				// ListBindings should in general get a getCount function in nearer future (5341464)
				iRowCount = oRowBinding.getLength();
			}
		}

		if (iRowCount < 0 || iRowCount === "0") {
			iRowCount = 0;
		}

		return iRowCount;
	};

	/**
	 * returns the row/items binding of the currently used internal list
	 *
	 * @private
	 * @returns {sap.ui.model.Binding} the row/items binding
	 */
	SmartList.prototype._getRowBinding = function() {
		if (this._oList) {
			return this._oList.getBinding(this._sAggregation);
		}
	};

	/**
	 * Initialises the OData metadata necessary to create the list
	 *
	 * @private
	 */
	SmartList.prototype._initialiseMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInitialised);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 *
	 * @private
	 */
	SmartList.prototype._onMetadataInitialised = function() {
		this._bMetaModelLoadAttached = false;
		if (!this.bIsInitialised) {
			this.detachModelContextChange(this._initialiseMetadata, this);
			// Indicates the control is initialised and can be used in the initialise event/otherwise!
			this.bIsInitialised = true;
			this._listenToSmartFilter();
			this._createToolbarContent();
			this._createContent();
			this.fireInitialise();
			this._checkAndTriggerBinding();
		}
	};

	/**
	 * Check if control needs to be bound and trigger binding accordingly.
	 *
	 * @private
	 */
	SmartList.prototype._checkAndTriggerBinding = function() {
		if (!this._bAutoBindingTriggered) {
			this._bAutoBindingTriggered = true;
			if (this.getEnableAutoBinding()) {
				if (this._oSmartFilter) {
					this._oSmartFilter.search();
				} else {
					this._reBindList();
				}
			}
		}
	};

	/**
	 * Listen to changes on the corresponding SmartFilter (if any)
	 *
	 * @private
	 */
	SmartList.prototype._listenToSmartFilter = function() {
		var sSmartFilterId = null;
		// Register for SmartFilter Search
		sSmartFilterId = this.getSmartFilter();
		if (typeof sSmartFilterId === "string") {
			this._oSmartFilter = Element.getElementById(sSmartFilterId);
		} else {
			this._oSmartFilter = sSmartFilterId;
		}

		if (this._oSmartFilter) {
			this._oSmartFilter.attachSearch(this._reBindList, this);
			this._oSmartFilter.attachFilterChange(this._filterChangeEvent, this);
			this._oSmartFilter.attachCancel(this._cancelEvent, this);

			// Set initial empty text only if a valid SmartFilter is found
			this._setNoDataText(Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_NO_DATA"));
		}
	};

	SmartList.prototype._filterChangeEvent = function() {
		if (this._isListBound() && this._oSmartFilter && !this._oSmartFilter.getLiveMode()) {
			this._showOverlay(true);
		}
	};

	SmartList.prototype._cancelEvent = function() {
		if (this._oSmartFilter && !this._oSmartFilter.getLiveMode()) {
			this._showOverlay(false);
		}
	};

	/**
	 * sets the ShowOverlay property on the inner list, fires the ShowOverlay event
	 *
	 * @param {boolean} bShow true to display the overlay, otherwise false
	 * @private
	 */
	SmartList.prototype._showOverlay = function(bShow) {
		// to be implemented --> Not supported by the List/Tree
	};

	/**
	 * This can be used to trigger binding on the list used in the SmartList
	 *
	 * @param {boolean} bForceRebind - force bind call to be triggered on the inner list
	 * @protected
	 */
	SmartList.prototype.rebindList = function(bForceRebind) {
		this._reBindList(null, bForceRebind);
	};

	/**
	 * Re-binds the list
	 *
	 * @param {Object} mEventParams - the event parameters
	 * @param {boolean} bForceRebind - force bind call to be triggered on the list
	 * @private
	 */
	SmartList.prototype._reBindList = function(mEventParams, bForceRebind) {
		var oListBinding, sListBindingPath, aSmartFilters, aFilters, aSorters, mParameters = {}, mBindingParams = {
			preventListBind: false
		};

		// Get Filters and parameters from SmartFilter
		if (this._oSmartFilter) {
			aSmartFilters = this._oSmartFilter.getFilters();
			mParameters = this._oSmartFilter.getParameters() || {};
		}
		aFilters = aSmartFilters;

		// No sorters yet!
		if (!aSorters) {
			aSorters = [];
		}

		// Select parameters
		mParameters["select"] = this.getSelectFields();

		// expand parameters
		if (this.getExpandFields()) {
			mParameters["expand"] = this.getExpandFields();
		}

		// Enable batch requests (by default)
		mParameters["useBatchRequests"] = true;

		mBindingParams.filters = aFilters;
		mBindingParams.sorter = aSorters;
		mBindingParams.parameters = mParameters;
		mBindingParams.length = undefined;
		mBindingParams.startIndex = undefined;
		// fire event to enable user modification of certain binding options (Ex: Filters)
		this.fireBeforeRebindList({
			bindingParams: mBindingParams
		});

		if (!mBindingParams.preventListBind) {
			aSorters = mBindingParams.sorter;
			aFilters = mBindingParams.filters;
			mParameters = mBindingParams.parameters;

			sListBindingPath = this.getListBindingPath() || ("/" + this.getEntitySet());
			this._bDataLoadPending = true;
			this._bIgnoreChange = false; // if a 2nd request is sent while the 1st one is in progress the dataReceived event may not be fired!
			// Only check if binding exists, if list is not being forcefully rebound
			if (!bForceRebind) {
				oListBinding = this._oList.getBinding(this._sAggregation);
				if (oListBinding && oListBinding.mParameters) {
					// Check if binding needs to be redone!
					// Evaluate to true if:
					// binding parameters change -or- custom binding parameters change -or- if length, startIndex or listBindingPath change!
					bForceRebind = !(deepEqual(mParameters, oListBinding.mParameters, true) && deepEqual(mParameters.custom, oListBinding.mParameters.custom) && !mBindingParams.length && !mBindingParams.startIndex && sListBindingPath === oListBinding.getPath());
				}
			}

			// do the binding if no binding is already present or if it is being forced!
			if (!oListBinding || !this._bIsListBound || bForceRebind) {
				this._oList.bindItems({
					path: sListBindingPath,
					filters: aFilters,
					sorter: aSorters,
					parameters: mParameters,
					length: mBindingParams.length,
					startIndex: mBindingParams.startIndex,
					template: this._oTemplate,
					templateShareable: true,
					events: {
						dataRequested: function() {
							this._bIgnoreChange = true;
						}.bind(this),
						dataReceived: function(mEventParams) {
							this._bIgnoreChange = false;
							this._onDataLoadComplete(mEventParams, true);
							// notify any listeners about dataReceived
							this.fireDataReceived(mEventParams);
						}.bind(this),
						change: function(mEventParams) {
							if (this._bIgnoreChange) {
								return;
							}
							var sReason, bForceUpdate = false;
							sReason = (mEventParams && mEventParams.getParameter) ? mEventParams.getParameter("reason") : undefined;
							// Force update state if reason for binding change is "context" or "filter" -or- not defined
							if (!sReason || sReason === "filter" || sReason === "context") {
								bForceUpdate = true;
							}
							if (sReason === "change" || bForceUpdate) {
								this._onDataLoadComplete(mEventParams, bForceUpdate);
							}
						}.bind(this)
					}
				});
				// Flag to indicate if list was bound (data fetch triggered) at least once
				this._bIsListBound = true;
			} else {
				oListBinding.sort(aSorters);
				oListBinding.filter(aFilters, "Application");
			}
			this._showOverlay(false);
		}
	};

	/**
	 * Called once data is loaded in the binding (i.e. either backend fetch or once change event is fired)
	 *
	 * @param {Object} mEventParams - the event parameters
	 * @param {boolean} bForceUpdate - force update
	 * @private
	 */
	SmartList.prototype._onDataLoadComplete = function(mEventParams, bForceUpdate) {
		if (this._bDataLoadPending || bForceUpdate) {
			this._bDataLoadPending = false;
			// Update No data text (once) only if list has no results!
			if (!this._bNoDataUpdated && !this._getRowCount()) {
				this._bNoDataUpdated = true;
				this._setNoDataText();
			}
			this._refreshHeaderText();
		}
	};

	/**
	 * Returns true if the inner UI5 list was bound at least once by the SmartList -or- if binding was done by the app.
	 *
	 * @returns {boolean} whether the inner UI5 list is bound
	 * @private
	 */
	SmartList.prototype._isListBound = function() {
		if (this._bIsListBound) {
			return true;
		}
		if (this._oList) {
			return this._oList.isBound(this._sAggregation);
		}
		return false;
	};

	/**
	 * Sets the no data text to the internal list
	 *
	 * @param {string} sOverwriteText - optional text to set on the list
	 * @private
	 */
	SmartList.prototype._setNoDataText = function(sOverwriteText) {
		if (this._oList) {
			if (!sOverwriteText) {
				sOverwriteText = Library.getResourceBundleFor("sap.ui.comp").getText("SMARTTABLE_NO_RESULTS");
			}
			this._oList.setNoDataText(sOverwriteText);
		}
	};

	/**
	 * Creates the content based on the metadata/configuration
	 *
	 * @private
	 */
	SmartList.prototype._createContent = function() {
		if (!this._oTemplate) {
			this._oTemplate = this.getListItemTemplate();
		}
	};

	/**
	 * Creates a list based on the configuration, if necessary. This also prepares the methods to be used based on the list type.
	 *
	 * @private
	 */
	SmartList.prototype._createList = function() {
		var aContent = this.getItems(), iLen = aContent ? aContent.length : 0, oList, sId;
		// Check if a List already exists in the content (Ex: from view.xml)
		while (iLen--) {
			oList = aContent[iLen];
			if (oList instanceof List || oList instanceof Tree) {
				break;
			}
			oList = null;
		}

		// If a List exists determine its type else create one based on the listItemType property!
		if (oList) {
			this._oList = oList;
			if (oList instanceof Tree) {
				this._isTree = true;
			} else {
				this._isList = true;
			}
			// get the item template from the view
			this._oTemplate = (oList.getItems() && oList.getItems().length > 0) ? oList.getItems()[0] : this.getListItemTemplate();
			oList.removeAllItems();
		} else {
			sId = this.getId() + "-ui5list";
			// Create list/tree
			if (this.getListType() === "Tree") {
				this._oList = new Tree(sId);
				this._isTree = true;
			} else {
				this._oList = new List(sId, {
					growing: true,
					growingScrollToLoad: true
				});
				this._isList = true;
			}
			this.insertItem(this._oList, 2);
		}

		if (!this._oList.getLayoutData()) {
			this._oList.setLayoutData(new FlexItemData({
				growFactor: 1,
				baseSize: "auto"
			}));
		}

	};

	/**
	 * Returns the <code>List</code> or <code>Tree</code> used internally.
	 *
	 * @public
	 * @returns {object} the control
	 */
	SmartList.prototype.getList = function() {
		return this._oList;
	};

	/**
	 * Checks whether the control is initialized.
	 *
	 * @returns {boolean} returns whether control has already been initialized
	 * @protected
	 */
	SmartList.prototype.isInitialised = function() {
		return !!this.bIsInitialised;
	};

	/**
	 * Cleans up the control
	 *
	 * @protected
	 */
	SmartList.prototype.exit = function() {
		// Cleanup smartFilter events as it can be used again stand-alone without being destroyed!
		if (this._oSmartFilter) {
			this._oSmartFilter.detachSearch(this._reBindList, this);
			this._oSmartFilter.detachFilterChange(this._filterChangeEvent, this);
			this._oSmartFilter.detachCancel(this._cancelEvent, this);
			this._oSmartFilter = null;
		}

		FullScreenUtil.cleanUpFullScreen(this);

		if (this._oTemplate) {
			this._oTemplate.destroy();
		}
		this._oTemplate = null;
		this._oToolbar = null;
		this._headerText = null;
		this._oFullScreenButton = null;
		this._oNumberFormatter = null;
		this._oList = null;
	};

	return SmartList;

});
