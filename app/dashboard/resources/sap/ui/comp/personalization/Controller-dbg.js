/* eslint-disable strict */

/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides Controller
sap.ui.define([
	'sap/base/Log',
	"sap/base/util/merge",
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	'sap/ui/thirdparty/jquery',
	'sap/ui/base/ManagedObject',
	'sap/m/library',
	'sap/ui/comp/library',
	'./ColumnsController',
	'./FilterController',
	'./GroupController',
	'./SortController',
	'./DimeasureController',
	'./SelectionController',
	'./Util',
	'./ChartWrapper',
	'./SelectionWrapper',
	'./ColumnHelper',
	'sap/m/MessageStrip',
	'sap/m/P13nDialog',
	'./Validator',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'sap/ui/model/BindingMode',
	"sap/ui/core/Lib"
], function(Log, merge, Element, Library, jQuery, ManagedObject, MLibrary, CompLibrary, ColumnsController, FilterController, GroupController, SortController, DimeasureController, SelectionController, Util, ChartWrapper, SelectionWrapper, ColumnHelper, MessageStrip, P13nDialog, Validator, JSONModel, Device, BindingMode, CoreLib) {
	"use strict";

	/**
	 * The controller represents the central communication hub with respect to personalisation. It makes sure to present the right user interface, do
	 * the necessary communication with this user interface and to provide events with which the consumer can require additional information needed,
	 * e.g. when an additional column is chosen via the user interface. It also exposes methods to set personalisation data 'from outside' and to
	 * revert to a latest clean state (with different definitions of "clean"). It is important to notice that the controller in general exposes
	 * changes as delta to a "baseline state". The "baseline state" is first and foremost the state defined via the table instance used to instantiate
	 * the controller. (We use the phrase "first and foremost" since the controller also exposes json objects which represents deltas to the last
	 * personalisation data set 'from outside' - this can be used by the consumer to handle dirty state.) This table instance, and thus the "baseline
	 * state", cannot be changed at a later point in time. As a consequence, the consumer should instantiate the controller with exactly the table
	 * instance on which she wishes the deltas to be calculated.
	 *
	 * This module is only for internal use!
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The personalization Controller provides capabilities in order to orchestrate the P13nDialog.
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.136.0
	 * @constructor
	 * @private
	 * @since 1.26.0
	 * @alias sap.ui.comp.personalization.Controller
	 */
	var Controller = ManagedObject.extend("sap.ui.comp.personalization.Controller", /** @lends sap.ui.comp.personalization.Controller.prototype */ {
		constructor: function(sId, mSettings) {
			ManagedObject.apply(this, arguments);
		},
		metadata: {
			library: "sap.ui.comp",
			interfaces: [
				"sap.m.p13n.modules.AdaptationProvider"
			],
			properties: {

				/**
				 * For each panel type, the <code>setting</code> property can contain <code>visible</code>, <code>controller</code>,
				 * <code>payload</code> and <code>ignoreColumnKeys</code> attributes. The <code>setting</code> property is used
				 * in a block list, meaning that specific panels can be overwritten. In this example, the Group panel will not be shown, and for the
				 * Columns panel the <code>visibleItemsThreshold</code> is set to 10. The attribute <code>ignoreColumnKeys</code> provides an
				 * array of column keys which should be ignored in the Columns panel. Additionally, a new controller instance can be defined.
				 * <bold>Note</bold>: this property should be passed into constructor and is not allowed to be changed afterwards.
				 *
				 * <pre><code>
				 * {
				 * 	group: {
				 * 		visible: false,
				 * 		ignoreColumnKeys: []
				 * 	},
				 * 	filter: {
				 * 		visible: true,
				 * 		createMessageStrip: function() {
				 * 			return new sap.m.MessageStrip({
				 * 				text: "Some info for the user",
				 * 				type: "Information"
				 * 			});
				 * 		}
				 * 	},
				 * 	columns: {
				 * 		visible: true,
				 * 	    ignoreColumnKeys: [],
				 * 		payload: {
				 * 			visibleItemsThreshold: 10
				 * 		},
				 * 		controller: new sap.ui.comp.personalization.TestController(&quot;TestController&quot;)
				 * 	},
				 * 	dimeasure: {
				 * 		visible: true,
				 * 	    ignoreColumnKeys: [],
				 * 		payload: {
				 * 			availableChartTypes: [
				 * 				&quot;pie&quot;, &quot;column&quot;, &quot;line&quot;, &quot;donut&quot;
				 * 			]
				 * 		}
				 * 	},
				 * 	selection: {
				 * 		visible: true,
				 * 	    ignoreColumnKeys: [],
				 * 		payload: {
				 * 			callbackSaveChanges: function
				 * 		}
				 * 	},
				 *  stableColumnKeys: []
				 * }
				 * </code></pre>
				 */
				setting: {
					type: "object",
					defaultValue: {}
				},
				/**
				 * The current state can be set back either to the state of initial table (ResetFull) or to the specific state of the table
				 * (ResetPartial) which has been set via <code>setPersonalizationData</code> method
				 */
				resetToInitialTableState: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Once the <code>columnKeys</code> is passed it must contain all possible column keys. The order of the column keys is taken into account.
				 * <bold>Note</bold>: this property should be passed into constructor and is not allowed to be changed afterwards.
				 */
				columnKeys: {
					type: "string[]",
					defaultValue: []
				},
				redundantColumnKeys: {
					type: "string[]",
					defaultValue: []
				}
			},
			associations: {
				/**
				 * Table on which the personalization will be performed. <bold>Note</bold>: this property is mandatory and should be passed into
				 * constructor and is not allowed to be changed afterwards.
				 */
				table: {
					type: "object",
					multiple: false
				}
			},
			events: {
				/**
				 * If a table is manipulated directly, such as column move, column resize etc., this event is raised <b>before</b> the action has
				 * been finished. However, that does not mean that the table is really changed. For example, the column touched could be moved to a
				 * new position or could also be dropped at the old position.
				 */
				beforePotentialTableChange: {},
				/**
				 * If a table is manipulated directly, such as column move, column resize etc., this event is raised <b>after</b> the action has been
				 * finished. However, that does not mean that the table is really changed. For example, the column touched could be moved to a new
				 * position or could also be dropped at the old position.
				 */
				afterPotentialTableChange: {},

				/**
				 * Event is fired if the personalization model data is changed
				 */
				afterP13nModelDataChange: {
					parameters: {
						/**
						 * JSON object that is relevant for persistence.
						 */
						persistentData: {
							type: "object"
						},
						/**
						 * Information about what has been changed since last variant (including the standard variant) was set.
						 * Consumers of the personalization dialog have to react on it in order to show dirty flag.
						 */
						persistentDataChangeType: {
							type: "sap.ui.comp.personalization.ChangeType"
						},
						/**
						 * JSON object that has been changed since last <code>afterP13nModelDataChange</code> event was
						 * raised. Consumers of the personalization dialog have to react on it in order to sort or filter the table.
						 */
						runtimeDeltaData: {
							type: "object"
						},
						/**
						 * Information about what has been changed with respect to the restore point. This "restore point" is dependent upon
						 * resetToInitialTableState; if "true" then this restore point is equal to initial state of the table
						 * (controlDataInitial), if "false" then the restore point is equal to the current variant
						 * (this.getVariantDataInitial).
						 */
						runtimeDeltaDataChangeType: {
							type: "sap.ui.comp.personalization.ChangeType"
						}
					}
				},
				/**
				 * Event is fired in order to request columns which were not passed together with table in constructor.
				 *
				 * @since 1.38.0
				 */
				requestColumns: {
					parameters: {
						columnKeys: {
							type: "string"
						}
					}
				},
				/**
				 * Event is fired after the dialog has been closed and in case that some changes have been done, the <code>afterP13nModelDataChange</code> has been raised.
				 *
				 * @since 1.46.0
				 */
				dialogAfterClose: {
					parameters: {
						cancel: {
							type: "boolean"
						}
					}
				},
				/**
				 * Event is fired after the dialog has been opened.
				 *
				 * @since 1.56.0
				 */
				dialogAfterOpen: {},
				/**
				 * Event is fired after the Restore button has been pressed and, at the same time, after it has been confirmed by pressing the OK
				 * button in the dialog.
				 *
				 * @since 1.46.0
				 */
				dialogConfirmedReset: {}
			}
		}
	});

	Controller.prototype.applySettings = function(mSettings) {
		ManagedObject.prototype.applySettings.apply(this, arguments);
		this._initialize();
	};
	Controller.prototype._initialize = function() {
		this._bInitCalled = true;

		var oParentTable, oTable = this.getTable();

		if (!oTable) {
			throw "The table instance should be passed into constructor.";
		}

		oParentTable = oTable.getParent();

		if (oParentTable && oParentTable.isA('sap.ui.comp.smarttable.SmartTable')) {
			this._aAvailablePanels = oParentTable._aAvailablePanels.map(function(sPanel) {
				return sPanel.toLowerCase();
			});
		}
		// 1. Instantiate Sub-Controllers based on <code>setting</code> property
		this._createSettingCurrent(this.getSetting());

		// 2. Store 'columnKeys' of current columns
		var aColumns = oTable.getColumns();
		if (!this.getColumnKeys().length) {
			this.setProperty("columnKeys", Util.getColumnKeys(aColumns), true);
		}

		// 3. Instantiate internal model
		var oModel = this._createInternalModel(this.getColumnKeys());
		this._callControllers(this._oSettingCurrent, "initializeInternalModel", oModel);

		// 4. Propagate some properties to Sub-Controllers
		this._oColumnHelper = new ColumnHelper({
			callbackOnSetVisible: this._onSetVisible.bind(this),
			callbackOnSetSummed: this._onSetSummed.bind(this),
			callbackOnSetGrouped: oTable.fireGroup ? this._onSetGrouped.bind(this) : null
		});
		this._oColumnHelper.addColumns(aColumns);
		this._callControllers(this._oSettingCurrent, "setColumnHelper", this._oColumnHelper);

		this._callControllers(this._oSettingCurrent, "setTriggerModelChangeOnColumnInvisible");

		this._callControllers(this._oSettingCurrent, "setTable", oTable);
		this._callControllers(this._oSettingCurrent, "setColumnKeys", this.getColumnKeys());
		this._callControllers(this._oSettingCurrent, "setRedundantColumnKeys", this.getRedundantColumnKeys());

		this._callControllers(this._oSettingCurrent, "setIgnoreColumnKeys");
		this._callControllers(this._oSettingCurrent, "setStableColumnKeys");
		this._callControllers(this._oSettingCurrent, "checkConsistency");
		this._callControllers(this._oSettingCurrent, "calculateIgnoreData");

		// Take current columns in order of "columnKeys"
		var aColumnKeys = Controller._getOrderedColumnKeys(this._oColumnHelper.getColumnMap(), this.getColumnKeys());

		// Take initial snapshot of table so that we can restore this state later. Is based on
		// columnKeys (complete amount of columns with predefined order).
		// Contains ignored columns and not yet created columns.
		this._extendModelStructure(aColumnKeys);

		// As interaction is also possible direct with the table we have to prepare 'controlData' as well
		this._callControllers(this._oSettingCurrent, "calculateControlData");

		this._suspendTable();
		this._syncTableUi();
		this._resumeTable(true);

		this._fireChangeEvent();
	};
	Controller.prototype.init = function() {
		this._oDialog = null;
		this._bInitCalled = false;
		this._bSuspend = false;
		this._bUnconfirmedResetPressed = false;
		this._oColumnHelper = null;
		this._oSettingCurrent = {};
	};
	Controller.prototype.setSetting = function(oSetting) {
		if (this._bInitCalled) {
			throw "The setting instance should be passed only into constructor.";
		}
		oSetting = this.validateProperty("setting", oSetting);
		this.setProperty("setting", oSetting, true); // no rerendering
		return this;
	};
	Controller.prototype.setResetToInitialTableState = function(bResetToInitialTableState) {
		if (this._bInitCalled) {
			throw "The resetToInitialTableState property should be passed only into constructor.";
		}
		bResetToInitialTableState = this.validateProperty("resetToInitialTableState", bResetToInitialTableState);
		this.setProperty("resetToInitialTableState", bResetToInitialTableState, true); // no rerendering
		return this;
	};
	Controller.prototype.setColumnKeys = function(aColumnKeys) {
		if (this._bInitCalled) {
			throw "The columnKeys array should be passed only into constructor.";
		}
		aColumnKeys = this.validateProperty("columnKeys", aColumnKeys);

		// Check duplicate columnKeys (BCP 0020751295 0000634662 2018)
		var aColumnKeysValid = aColumnKeys.filter(function(sColumnKey, iIndex) {
			var bInvalid = aColumnKeys.indexOf(sColumnKey, iIndex + 1) > -1;
			if (bInvalid) {
				Log.warning("The provided columnKeys is inconsistent as columnKey " + sColumnKey + " is not unique and therefore the duplicate entry is deleted from columnKeys.");
			}
			return !bInvalid;
		});
		this.setProperty("columnKeys", aColumnKeysValid, true); // no rerendering
		return this;
	};
	Controller.prototype.setTable = function(oTable) {
		if (this._bInitCalled) {
			throw "The table instance should be passed only into constructor.";
		}
		this.setAssociation("table", oTable);
		return this;
	};

	Controller.prototype._createSettingCurrent = function(oSetting) {
		// NOTE: instantiating the sub-Controllers only when opening the dialog is too late since this data could be set before (e.g. via column menu)
		// and we expect sub-Controllers to handle these data
		var sTableType = Util.getTableType(this.getTable());
		var aSettingCurrent, sType;
		switch (sTableType) {
			case CompLibrary.personalization.TableType.ChartWrapper:
				aSettingCurrent = [
					MLibrary.P13nPanelType.dimeasure, MLibrary.P13nPanelType.sort, MLibrary.P13nPanelType.filter
				];
				break;
			case CompLibrary.personalization.TableType.SelectionWrapper:
				aSettingCurrent = [
					MLibrary.P13nPanelType.selection
				];
				break;
			default:
				aSettingCurrent = [
					MLibrary.P13nPanelType.columns, MLibrary.P13nPanelType.sort, MLibrary.P13nPanelType.filter, MLibrary.P13nPanelType.group
				];
		}

		// Take over 'setting'. Default: all panels are set to visible.
		for (sType in oSetting) {
			// Remove types which are set to 'visible=false' via 'setting'
			if (oSetting[sType].visible === false && aSettingCurrent.indexOf(sType) > -1) {
				aSettingCurrent.splice(aSettingCurrent.indexOf(sType), 1);
			}
			// Enrich customer types coming via 'setting'
			if (oSetting[sType].visible === true && aSettingCurrent.indexOf(sType) < 0) {
				aSettingCurrent.push(sType);
			}
		}

		aSettingCurrent.forEach(function(sType) {
			this._oSettingCurrent[sType] = {
				visible: true,
				controller: (oSetting[sType] && oSetting[sType].controller) ? oSetting[sType].controller : this._controllerFactory(sType),
				payload: (oSetting[sType] && oSetting[sType].payload) ? oSetting[sType].payload : undefined,
				ignoreColumnKeys: (oSetting[sType] && oSetting[sType].ignoreColumnKeys) ? oSetting[sType].ignoreColumnKeys : [],
				triggerModelChangeOnColumnInvisible: (oSetting[sType] && oSetting[sType].triggerModelChangeOnColumnInvisible) ? oSetting[sType].triggerModelChangeOnColumnInvisible : undefined,
				createMessageStrip: (oSetting[sType] && oSetting[sType].createMessageStrip) ? oSetting[sType].createMessageStrip : undefined
			};
			if (sType == "columns") {
				this._oSettingCurrent.columns.stableColumnKeys = oSetting.stableColumnKeys;
			}
		}, this);
	};

	Controller.prototype._mixSetting = function(oSettingGlobal, oSetting) {
		if (!oSetting) {
			return oSettingGlobal;
		}
		if (oSetting.useAvailablePanels === false) {
			const oMixedSetting = { useAvailablePanels: false };
			for (const sType in oSetting) {
				if (oSetting[sType]) {
					oMixedSetting[sType] = merge(oMixedSetting[sType], oSettingGlobal[sType]);
				}
			}
			return oMixedSetting;
		}
		return merge({}, oSettingGlobal, oSetting);
	};

	// ----------------------------------------------------------- Public API -----------------------------------------------------------------------------------

	/**
	 * Opens the personalization dialog
	 *
	 * @param {object} oSettingsForOpen contains additional settings information for opening the dialog with its panels. Settings information is used
	 *        in the manner of allow list, meaning that only specified panels are considered. Example for a dialog with sort, filter, dimeasure and selection panels:
	 *
	 * <pre>
	 * {
	 *  useAvailablePanels: true, //This can be set to false if only a specific panel should open
	 * 	contentWidth: CSSSize,
	 * 	contentHeight: CSSSize,
	 * 	styleClass: <string>,
	 * 	showReset: <boolean>,
	 * 	sort: {
	 * 		visible: true
	 * 	},
	 * 	filter: {
	 * 		visible: true
	 * 	},
	 * 	dimeasure: {
	 * 		visible: true,
	 * 		payload: {
	 * 			availableChartTypes: [
	 * 				new sap.ui.core.Item({
	 * 					key: sap.chart.ChartType.Column,
	 * 					text: 'Column'
	 * 				}), new sap.ui.core.Item({
	 * 					key: sap.chart.ChartType.Donut,
	 * 					text: 'Donut'
	 * 				})
	 * 			]
	 * 		}
	 * 	},
	 * 	selection: {
	 * 		visible: true
	 * 	}
	 * }
	 * </pre>
	 */
	Controller.prototype.openLegacyDialog = function(oSettingsForOpen) {

		this._suspendTable();

		this._prepareDialogUi();

		var oSettingForOpen = this._mixSetting(this._oSettingCurrent, oSettingsForOpen);

		this._bCancelPressed = false;

		this._oDialog = new P13nDialog(this.getId() + "-P13nDialog", {
			stretch: Device.system.phone,
			showReset: (oSettingsForOpen && oSettingsForOpen.showReset !== undefined) ? oSettingsForOpen.showReset : true,
			showResetEnabled: {
				path: '$sapuicomppersonalizationBaseController>/isDirty'
			},
			initialVisiblePanelType: this._oInitialVisiblePanelType,
			validationExecutor: function() {
				var sTableType = Util.getTableType(this.getTable());
				var oColumnKey2ColumnMap = this._oColumnHelper.getColumnMap();
				var oControlDataReduceTotal = this._callControllers(oSettingForOpen, "getUnionData", this._getControlDataInitial(), this._getControlDataReduce());
				return Validator.checkGroupAndColumns(sTableType, oSettingForOpen, oColumnKey2ColumnMap, oControlDataReduceTotal, []).then(function(aResultTotal) {

					// Note: this is the copy of _fireChangeEvent with one exception. As the validator is called before the logic of OK is processed we have to update
					// the oControlData and oControlDataBase manually here.

					// oControlData is exchanged by oControlDataReduce
					var oControlDataBase = this._callControllers(oSettingForOpen, "getUnionData", this._getControlDataBase(), this._getControlDataReduce());
					var oControlDataBaseTotal = this._callControllers(oSettingForOpen, "getUnionData", this._getControlDataInitial(), oControlDataBase);
					var oPersistentDeltaData = this._callControllers(oSettingForOpen, "getChangeData", oControlDataBaseTotal, this._getAlreadyKnownPersistentData());

					return Validator.checkSaveChanges(sTableType, oSettingForOpen, oPersistentDeltaData, aResultTotal);
				}.bind(this)).then(function(aResultTotal) {
					return Validator.checkChartConsistency(sTableType, oSettingForOpen, oControlDataReduceTotal, aResultTotal);
				}).then(function(aResultTotal) {
					return aResultTotal;
				});
			}.bind(this)
		});
		this._oDialog.setModel(this._getInternalModel(), "$sapuicomppersonalizationBaseController");
		// Set compact style class if the table is compact too
		this._oDialog.toggleStyleClass("sapUiSizeCompact", !!jQuery(this.getTable().getDomRef()).closest(".sapUiSizeCompact").length);

		if (oSettingsForOpen && oSettingsForOpen.contentWidth) {
			this._oDialog.setContentWidth(oSettingsForOpen.contentWidth);
		}
		if (oSettingsForOpen && oSettingsForOpen.contentHeight) {
			this._oDialog.setContentHeight(oSettingsForOpen.contentHeight);
		}
		if (oSettingsForOpen && oSettingsForOpen.styleClass) {
			this._oDialog.addStyleClass(oSettingsForOpen.styleClass);
		}

		this._callControllers(this._oSettingCurrent, "setMessageStrip");

		var oPromises = this._callControllers(oSettingForOpen, "getPanel");
		var aPromises = [];
		for (var sType in oPromises) {
			if (oPromises[sType]) {
				aPromises.push(oPromises[sType]);
			}
		}

		Promise.all(aPromises).then(function(aPanels) {
			aPanels.forEach(function(oPanel) {
				this._oDialog.addPanel(oPanel);
			}, this);
			this._oDialog.attachOk(this._handleDialogOk, this);
			this._oDialog.attachCancel(this._handleDialogCancel, this);
			this._oDialog.attachReset(this._handleDialogReset, this);
			this._oDialog.attachAfterClose(this._handleDialogAfterClose, this);
			// Disable dialog adaptation
			this._oDialog.isPopupAdaptationAllowed = function() {
				return false;
			};
			this._oDialog.setEscapeHandler(function() {
				//in case of 'escape' the dialog should behave as if the user would press 'cancel'
				this._handleDialogCancel().bind(this);
			}.bind(this));
			this._oDialog.open();
			this.fireDialogAfterOpen();
		}.bind(this));
	};

	Controller.prototype.getUISettings = function() {

		var oSettingForOpen = this._oUISetting;

		var oPromises = this._callControllers(oSettingForOpen, "retrieveAdaptationUI");

		var oUISettings = {
			resetEnabled: oSettingForOpen.showReset,
			contentHeight: oSettingForOpen.contentHeight,
			contentWidth: oSettingForOpen.contentWidth
		};

		var aPromises = [];
		var aKeys = Object.keys(oPromises);

		var oRB = Library.getResourceBundleFor("sap.ui.mdc");

		var mTabText = {
			columns: oRB.getText("p13nDialog.TAB_Column"),
			dimeasure: oRB.getText("p13nDialog.TAB_Chart"),
			filter: oRB.getText("p13nDialog.TAB_Filter"),
			sort: oRB.getText("p13nDialog.TAB_Sort"),
			group: oRB.getText("p13nDialog.TAB_Group"),
			selection: oRB.getText("info.SELECTION_DIALOG_ALIGNEDTITLE")
		};

		var oResetWarning = this._callControllers(oSettingForOpen, "getResetWarningText");

		aKeys.forEach(function(sKey){
			var sTabText = mTabText[sKey];
			var pPanel = oPromises[sKey];

			oUISettings[sKey] = {
				resetEnabled: true,
				adaptationUI: pPanel instanceof Promise ? pPanel : Promise.resolve(),
				reset: {
					warningText: oResetWarning[sKey]
				},
				containerSettings: {
					title: sTabText,
					tabText: sTabText,
					contentHeight: oUISettings.contentHeight,
					contentWidth: oUISettings.contentWidth
				}
			};
			aPromises.push(oPromises[sKey]);
		}, this);

		Promise.all(aPromises).then(function(aPanel){
			this._callControllers(this._oSettingCurrent, "setModelFunction");
		}.bind(this));

		return oUISettings;
	};

	Controller.prototype.initAdaptation = function() {
		return Promise.resolve();
	};

	Controller.prototype.reset = function(o, aKeys) {
		this._resetMessageStrip();
		return new Promise(function(resolve){
			this.resetPersonalization();
			this._syncDialogUi();
			this._callControllers(this._oSettingCurrent, "setBeforeOpenData2Model", this._getControlDataBase());
			for (var sKey in this._oSettingCurrent) {
				var oSubController = this._oSettingCurrent[sKey].controller;
				if (oSubController && oSubController.getAdaptationUI() && oSubController.getAdaptationUI().setP13nData) {
					oSubController.getAdaptationUI().setP13nData(oSubController.getAdaptationData());
				}
			}

			//TBD: cleanup
			return new Promise(function(resolve) {
				if (o) {
					CoreLib.load('sap.ui.fl', {
						async: true
					}).then(function() {
						sap.ui.require([
							'sap/ui/comp/navpopover/FlexConnector'
						], function(FlexConnector) {
							return FlexConnector.discardChangesForControl(o._container).then(function() {
								resolve(true);
							}, function(oError) {
								Log.error("Changes could not be discarded in LRep: " + oError);
								resolve(false);
							});
						});
					});
				} else {
					resolve(false);
				}
			})
			.then(function(){
				this._syncDialogUi();
				for (var sKey in this._oSettingCurrent) {
					var oSubController = this._oSettingCurrent[sKey].controller;
					if (oSubController && oSubController.getAdaptationUI() && oSubController.getAdaptationUI().setP13nData) {
						oSubController.getAdaptationUI().setP13nData(oSubController.getAdaptationData());
					}
				}
				resolve();
			}.bind(this));
		}.bind(this));
	};

	Controller.prototype.validateP13n = function(vControl, sKey, oAdaptationUI) {

		var sTableType = Util.getTableType(this.getTable());
		var oColumnKey2ColumnMap = this._oColumnHelper.getColumnMap();
		var oControlDataReduceTotal = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataInitial(), this._getControlDataReduce());
		return Validator.checkGroupAndColumns(sTableType, this._oSettingCurrent, oColumnKey2ColumnMap, oControlDataReduceTotal, [])
		.then(function(aResultTotal) {
			return Validator.checkChartConsistency(sTableType, this._oSettingCurrent, oControlDataReduceTotal, aResultTotal);
		}.bind(this))
		.then(function(aResultTotal){
			return Validator.checkVisibleItemsThreshold(sTableType, this._oSettingCurrent, oControlDataReduceTotal, aResultTotal);
		}.bind(this))
		.then(function(aResultTotal) {
			if (aResultTotal.length > 0) {
				aResultTotal.forEach(function(oValidation){
					for (var sKey in this._oSettingCurrent) {
						var oSubController = this._oSettingCurrent[sKey].controller;
						if (oValidation.panelTypes.indexOf(sKey) > -1 && oSubController){
							oSubController.getAdaptationUI().setMessageStrip(new MessageStrip({
								type: oValidation.messageType,
								text: oValidation.messageText
							}));
						}
					}

				}.bind(this));
			} else {
				this._resetMessageStrip();
			}
		}.bind(this));
	};

	/**
	 * Prepare the personalization controller for usage.
	 */
	Controller.prototype.preparePersonalization = function () {
		this._prepareDialogUi();
	};

	Controller.prototype.openDialog = function(oSettingsForOpen) {

		var oUISettingsForReset;

		this._suspendTable();

		this._prepareDialogUi();

		this._oUISetting = this._mixSetting(this._oSettingCurrent, oSettingsForOpen);

		if (this._oUISetting && this._oUISetting.showReset !== undefined) {
			oUISettingsForReset = {
				showReset: this._oUISetting.showReset
			};
		}

		this._callControllers(this._oSettingCurrent, "setMessageStrip");

		var aKnownKeys = Object.keys(this._getControllers());
		var aKeysForOpen = Object.assign([], aKnownKeys);
		if (oSettingsForOpen && (oSettingsForOpen.useAvailablePanels === false)) {
			var aDesiredKeys = Object.keys(oSettingsForOpen);
			aKnownKeys.forEach(function(sKnownKey, iIndex){
				if (aDesiredKeys.indexOf(sKnownKey) < 0) {
					aKeysForOpen.splice(aKeysForOpen.indexOf(sKnownKey), 1);
				}
			});
		}

		// When dialog is opened from a Column header or from a custom button in the SmartTable's toolbar
		// the expectation is that only one panel is opened (e.g. sort) so we set the showReset to false
		if (!oUISettingsForReset && aKeysForOpen && aKeysForOpen.length === 1 && this._aAvailablePanels && this._aAvailablePanels.indexOf(aKeysForOpen[0]) > -1) {
			oUISettingsForReset = {
				showReset: false
			};
		}
		return CoreLib.load('sap.ui.mdc', {
			async: true
		})
		.then(function() {
			return new Promise(function(resolve, reject){
				sap.ui.require(["sap/ui/comp/personalization/UIManager", "sap/ui/comp/config/condition/DateRangeType"], function(COMPUIManager, DateRangeType){
					resolve(COMPUIManager);
				}, reject);
			});
		})
		.then(function(COMPUIManager){
			if (!this._oUIManager) {
				/**
				 * Note: The UIManager should in general be accessed using UIManager#getInstance
				 * as it is implemented as singleton. The Controller however holds state specific
				 * information for each associated table, hence individual UIManagers are currently
				 * necessary to properly handle the AdaptationProvider interface
				 *
				 * TODO: reconsider AdaptationProvider interface in mdc so the UIManager can also be
				 * accessed via #getInstance in comp as the p13n creation is mainly static coding.
				 */
				this._oUIManager = new COMPUIManager(this);
			}

			if (this._sActivePanel && aKeysForOpen.includes(this._sActivePanel)) {
				oUISettingsForReset ??= {};
				oUISettingsForReset.activePanel ??= this._sActivePanel;
			}

			return this._oUIManager.show(this.getTable(), aKeysForOpen, oUISettingsForReset).then(function(oDialog){
				if (oDialog.getCustomHeader()) {
					var oResetBtn = oDialog.getCustomHeader().getContentRight()[0];

					if (oResetBtn) {
						//Note: Check if this also required in MDC
						oResetBtn.bindProperty("enabled", {
							model: "$sapmP13nPanel",
							path: "/isDirty",
							formatter: function(bDirty) {
								return !!bDirty;
							}
						});
					}
				}

				oDialog.getButtons()[1].attachPress(this._handleDialogCancel, this);
				oDialog.attachAfterClose(this._handleDialogAfterClose, this);

				if (aKeysForOpen.length > 1 && this._sActivePanel) {
					oDialog.getContent()[0].switchView(this._sActivePanel);
				}

				if (oSettingsForOpen && oSettingsForOpen.styleClass) {
					oDialog.addStyleClass(oSettingsForOpen.styleClass);
				}

				oDialog.setModel(this._getInternalModel(), "$sapmP13nPanel");
				this._oDialog = oDialog;
				this.fireDialogAfterOpen();
				return oDialog;
			}.bind(this));
		}.bind(this));

	};

	/**
	 * Adds all requested columns.
	 * @param {object} oColumnKey2ColumnMap Format: {<path>: oColumn}
	 */
	Controller.prototype.addColumns = function(oColumnKey2ColumnMap) {
		var oTable = this.getTable();
		Object.keys(oColumnKey2ColumnMap).forEach(function(sColumnKey) {
			if (!oColumnKey2ColumnMap[sColumnKey].getParent()) {
				oTable.addDependent(oColumnKey2ColumnMap[sColumnKey]);
			}
		});

		this._oColumnHelper.addColumnMap(oColumnKey2ColumnMap);
	};

	/**
	 * Returns a current snapshot of controlData data in DataSuiteFormat.
	 * @returns {Object} DataSuiteFormat
	 */
	Controller.prototype.getDataSuiteFormatSnapshot = function() {
		this._callControllers(this._oSettingCurrent, "calculateControlData");

		var oRuntimeDataSuiteFormat = {};
		this._callControllers(this._oSettingCurrent, "getDataSuiteFormatSnapshot", oRuntimeDataSuiteFormat);
		return oRuntimeDataSuiteFormat;
	};

	/**
	 * Replaces the current snapshot with the controlData data represented in Data Suite Format <code>oRuntimeDataSuiteFormat</code>.
	 * The <code>oControlDataReduceVariant</code> defines the base line of restore.
	 * @param {object} oRuntimeDataSuiteFormat
	 * @param {object} oPersonalizationData
	 * @param {boolean} [bConvert=false] indicates whether time and date fields specified as strings should be converted to javscript Date objects. Default is false.
	 */
	Controller.prototype.setDataSuiteFormatSnapshot = function(oRuntimeDataSuiteFormat, oPersonalizationData, bConvert) {

		// TODO: notice that this conversion is a workaraound - really all data should be provided without the need to do any
		// conversion !  Think about a more central solution nearer to the persistence layer ! Also note that this conversion
		// assumes that we can reconstruct the 'lost type information' with the current valid types.
		if (bConvert) {
			Util.convertSelectOptions(oRuntimeDataSuiteFormat, this._oColumnHelper.getColumnMap());
			Util.convertFilters(oPersonalizationData, this._oColumnHelper.getColumnMap());
		}

		// Note: oRuntimeData is a complete snapshot (and not delta to the controlDataInitial)!!!
		// Note: we have also to 'turn back' columns which are visible in controlDataInitial but do not occur in oRuntimeDataSuiteFormat!!!
		var oRuntimeData = this._callControllers(this._oSettingCurrent, "getDataSuiteFormat2Json", oRuntimeDataSuiteFormat);
		this._setRuntimeAndPersonalizationData(oRuntimeData, oPersonalizationData);
	};

	Controller.prototype.setPersonalizationDataAsDataSuiteFormat = function(oRuntimeDataSuiteFormat, bConvert) {
		// Note: oRuntimeData is a complete snapshot (and not delta to the controlDataInitial)!!!
		// Note: we have also to 'turn back' columns which are visible in controlDataInitial but do not occur in oRuntimeDataSuiteFormat!!!

		// TODO: notice that this conversion is a workaraound - really all data should be provided without the need to do any
		// conversion !  Think about a more central solution nearer to the persistence layer ! Also note that this conversion
		// assumes that we can reconstruct the 'lost type information' with the current valid types.
		if (bConvert) {
			Util.convertSelectOptions(oRuntimeDataSuiteFormat, this._oColumnHelper.getColumnMap());
		}

		var oRuntimeData = this._callControllers(this._oSettingCurrent, "getDataSuiteFormat2Json", oRuntimeDataSuiteFormat);

		this._setRuntimeAndPersonalizationData(oRuntimeData, oRuntimeData);
	};

	/**
	 * Setter for personalization model. Note: for data of type Date the object instance is expected and not string representation.
	 * --> TODO: with the Util.convertFilters, this comment no longer relevant (?)
	 *
	 * Example:
	 * { sort: sortItems:[{columnKey: "A", operation: "Ascending"}]}
	 *
	 * @param {object} oPersonalizationData Contains personalization data that is taken over into the model
	 * @param {boolean} bConvert indicates whether time and date fields specified as strings should be converted to javscript Date objects. Default is false.
	 */
	Controller.prototype.setPersonalizationData = function(oPersonalizationData, bConvert) {

		// In case of both new column is added and a filter is added we request the missing columns first before the filters are converted
		// so they can be marked if they are of type date and their filter values to be converted, otherwise they will not be converted
		this._extendModelStructure(this._requestMissingColumnsWithoutIgnore(oPersonalizationData));

		// TODO: notice that this conversion is a workaraound - really all data should be provided without the need to do any
		// conversion !  Think about a more central solution nearer to the persistence layer ! Also note that this conversion
		// assumes that we can reconstruct the 'lost type information' with the current valid types.
		if (bConvert) {
			Util.convertFilters(oPersonalizationData, this._oColumnHelper.getColumnMap());
		}

		// Note: oPersonalizationData is delta to the controlDataInitial!!!
		this._setRuntimeAndPersonalizationData(oPersonalizationData, oPersonalizationData);
	};

	/**
	 * Reset the filter provider of the mdc FilterPanel and hides the cleared fields
	 *
	 * @param {boolean} bFullReset indicates whether the reset will be full or partial (there is already stored data in the VariantManagement)
	 */
	Controller.prototype._resetFilters = function(bFullReset) {

		var aP13nData, oFilterProvider, oFilterPanel,
			oFilterController = this._oSettingCurrent && this._oSettingCurrent.filter && this._oSettingCurrent.filter.controller,
			aVariantItems = (this._getVariantData() && this._getVariantData().filter && this._getVariantData().filter.filterItems) || [],
			aInitialItems = this._getControlDataInitial() && this._getControlDataInitial().filter && this._getControlDataInitial().filter.filterItems;

		if (oFilterController) {
			oFilterProvider = oFilterController.oFilterProvider;
			oFilterPanel = oFilterController.oFilterPanel;
		}

		if (oFilterPanel && this._oDialog && this._oDialog.isOpen()) {
			if (bFullReset) {
				if (!this._getControlDataInitial()) {
					if (oFilterProvider) {
						oFilterProvider.clear();
					}
					// Make all fields not active and re-set the P13nData so that the FilterPanel can be cleared
					aP13nData = aP13nData.map(function(oItem) {
						oItem.active = false;
						return oItem;
					});
					oFilterPanel.setP13nData(aP13nData);
				} else {
					this._resetToState(aInitialItems, oFilterProvider, oFilterController, oFilterPanel);
				}
			} else {
				this._resetToState(aVariantItems, oFilterProvider, oFilterController, oFilterPanel);
			}

		}
	};

	Controller.prototype._resetToState = function(aItems, oFilterProvider, oFilterController, oFilterPanel) {
		var i, j, oItem, oP13nItem, oFieldMetadata, sName, oControl,
			sFilterProperty,
			aP13nData = oFilterPanel.getP13nData();

		if (aP13nData && aItems) {
			for (i = 0; i < aP13nData.length; i++) {
				oP13nItem = aP13nData[i];
				sName = oP13nItem.name;
				sFilterProperty = oFilterController._getFilterPropertyFromColumn(sName);
				oP13nItem.active = false;
				oControl = oFilterController._getControlByName(sName);

				if (oFilterProvider) {
					if (sFilterProperty && sFilterProperty.includes("/")) {
						oFieldMetadata = oFilterProvider._oMetadataAnalyser.extractNavigationPropertyField(sFilterProperty, oFilterProvider.sEntitySet);
						oFieldMetadata = oFilterProvider._createFieldMetadata(oFieldMetadata);
					} else {
						oFieldMetadata = oFilterProvider._getFieldMetadata(sFilterProperty);
					}
					if (oFieldMetadata && !oFieldMetadata.control && oControl) {
						oFieldMetadata.control = oControl;
					}
					oFilterProvider._createInitialModelForField(oFilterProvider.getFilterData(), oFieldMetadata);
				}
				if (oControl) {
					if (oControl.setValue) {
					  oControl.setValue(null);
					}
					if (oControl.setTokens) {
						oControl.setTokens([]);
					}
				}
				for (j = 0; j < aItems.length; j++) {
					oItem = aItems[j];
					if (oItem.columnKey === sName) {
						oP13nItem.active = true;
						break;
					}
				}

			}
			oFilterPanel.setP13nData(aP13nData);
			if (oFilterProvider) {
				oFilterController._updateFilterData(aItems);
			} else {
				oFilterController._updateBasicFilters(aItems);
			}
		}
	};

	/**
	 * Notice that the dirty calculation and hence intrinsic restore handling is based exclusively on the property "resetToInitialTableState", the
	 * parameter sResetType is ignored !! TODO: not quite clear if there are use cases in which this (the above statement) is a problem --> maybe
	 * remove the parameter sResetType.
	 *
	 * @param {sap.ui.comp.personalization.ResetType} sResetType is optional.
	 */
	Controller.prototype.resetPersonalization = function(sResetType) {
		sResetType = this._determineResetType(sResetType);
		// preReset
		if (sResetType === CompLibrary.personalization.ResetType.ResetFull) {
			this._resetFull();
			this._resetFilters(true);
		} else {
			this._resetPartial();
			this._resetFilters(false);
		}
		// Note: oControlDataBase dependents on reset type either controlDataInitial or variantDataInitial.
		// Note: oPersonalizationData is the current variant.
		this._setRuntimeAndPersonalizationData(this._getControlDataBase(), this._getVariantData());
	};

	/**
	 * if types are present which are defined as ignored these types are not taken into account !
	 *
	 * @param {string[]} aColumnKeys Array of columnKeys
	 * @returns {sap.ui.comp.personalization.Controller} Controller
	 */
	Controller.prototype.addToSettingIgnoreColumnKeys = function(aColumnKeys) {
		if (this._isEqualAdditionalIgnoreColumnKeys(aColumnKeys)) {
			return this;
		}
		this._callControllers(this._oSettingCurrent, "setAdditionalIgnoreColumnKeys", aColumnKeys);
		this._callControllers(this._oSettingCurrent, "calculateIgnoreData");

		this._requestMissingColumnsWithoutIgnore(this._getControlDataBase());

		this._suspendTable();
		this._syncTableUi();
		this._resumeTable(true);

		this._fireChangeEvent();
		return this;
	};

	// ----------------------------------------------------------------------------------------------------------------------------------------------------

	Controller.prototype._handleDialogReset = function() {

		this._bUnconfirmedResetPressed = true;

		var sResetType = this._determineResetType();
		if (sResetType === CompLibrary.personalization.ResetType.ResetFull) {
			this._resetFull();
		} else {
			this._resetPartial();
		}

		// update UI
		this._syncDialogUi();
	};

	Controller.prototype._handleDialogOk = function() {
		if (this._oDialog.isA("sap.m.P13nDialog")){
			this._oDialog.detachOk(this._handleDialogOk, this);
		}

		if (this._bUnconfirmedResetPressed) {
			this.fireDialogConfirmedReset();
		}
		setTimeout(function() {
			// 'controlDataReduce' is up-to-date due to the binding.
			this._postDialogUi(this._getControlDataReduce());
			this._syncTableUi();

			var fn = function(oEvent) {
				// check if at least one "ModelChanged" sent
				var bModelChanged = false;
				for (var sType in this._oSettingCurrent) {
					bModelChanged = bModelChanged || oEvent.getParameter("runtimeDeltaDataChangeType")[sType] === "ModelChanged";
					if (bModelChanged) {
						break;
					}
				}

				// we assume that when we have at least one "ModelChanged", the consumer will trigger (perhaps implicitly) an invalidation and thus we do not need it here
				var bInvalidate = !bModelChanged;

				this._resumeTable(bInvalidate);
			};

			this.attachEventOnce("afterP13nModelDataChange", fn, this);
			this._fireChangeEvent();

		}.bind(this), 0);

		if (this._oDialog.isA("sap.m.P13nDialog")){
			this._oDialog.close();
		}
	};

	Controller.prototype.handleP13n = function() {
		return new Promise(function(resolve){

			var oWrapper = this._oDialog.getContent()[0];
			if (oWrapper.isA("sap.m.p13n.Container")) {
				this._sActivePanel = oWrapper.getCurrentViewKey();
			}

			// oControlData is exchanged by oControlDataReduce
			var sTableType = Util.getTableType(this.getTable());
			var oControlDataBase = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataBase(), this._getControlDataReduce());
			var oControlDataBaseTotal = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataInitial(), oControlDataBase);
			var oPersistentDeltaData = this._callControllers(this._oSettingCurrent, "getChangeData", oControlDataBaseTotal, this._getAlreadyKnownPersistentData());

			this._handleDialogOk(true);

			return Validator.checkSaveChanges(sTableType, this._oSettingCurrent, oPersistentDeltaData, [])
			.then(function(){
				resolve();
			});
		}.bind(this));
	};

	Controller.prototype._handleDialogCancel = function() {
		if (this._oDialog.isA("sap.m.P13nDialog")){
			this._oDialog.detachCancel(this._handleDialogCancel, this);
		}

		setTimeout(function() {
			this._postDialogUi(this._getBeforeOpenData());
			this._resumeTable(false);

			this._callControllers(this._oSettingCurrent, "calculateControlData");
		}.bind(this), 0);

		this._bCancelPressed = true;

		if (this._oDialog.isA("sap.m.P13nDialog")){
			this._oDialog.close();
		}
	};

	Controller.prototype._handleDialogAfterClose = function() {
		// Store the latest open panel
		if (this._oDialog.isA("sap.m.P13nDialog")) {
			this._oInitialVisiblePanelType = this._oDialog.getVisiblePanel() ? this._oDialog.getVisiblePanel().getType() : this._getInitialVisiblePanelType();
		}

		// Initialize '_bUnconfirmedResetPressed'
		this._bUnconfirmedResetPressed = false;

		//fire dialogAfterClose after P13nDialog has been closed (ok/cancel/ESC)
		this.fireDialogAfterClose({cancel: this._bCancelPressed});

		if (this._oDialog) {
			this._oDialog.destroy();
			this._oDialog = null;
		}
	};

	/**
	 * Get first property of current setting object
	 *
	 * @returns {string} that represents the panel type
	 */
	Controller.prototype._getInitialVisiblePanelType = function() {
		// eslint-disable-next-line no-unreachable-loop
		for (var sType in this._oSettingCurrent) {
			return sType;
		}
	};
	Controller.prototype._suspendTable = function() {
		if (Util.getTableBaseType(this.getTable()) === CompLibrary.personalization.TableType.Table) {
			this._bSuspend = true;
		}
	};
	Controller.prototype._resumeTable = function(bInvalidate) {
		// default is to invalidate table
		bInvalidate = (bInvalidate === undefined) ? true : bInvalidate;
		var oTable = this.getTable();
		if (this._bSuspend) {
			if (oTable) {
				if (bInvalidate) {
					oTable.invalidate();
				}
			}
			this._bSuspend = false;
		}
	};

	Controller.prototype._requestMissingColumnsWithoutIgnore = function(oJsonNew) {
		var oJsonMissingColumnKeys = this._callControllers(this._oSettingCurrent, "determineMissingColumnKeys", oJsonNew);
		var aMissingColumnKeys = Util.getUnionOfColumnKeys(oJsonMissingColumnKeys);
		if (!aMissingColumnKeys.length) {
			return [];
		}
		this.fireRequestColumns({
			columnKeys: aMissingColumnKeys
		});
		return aMissingColumnKeys;
	};
	Controller.prototype._extendModelStructure = function(aColumnKeys) {
		if (!aColumnKeys.length) {
			return;
		}
		var oJsonColumnKeys = this._callControllers(this._oSettingCurrent, "createColumnKeysStructure", aColumnKeys);
		var oJson = this._callControllers(this._oSettingCurrent, "getTable2Json", oJsonColumnKeys); // keep the metadata order
		this._callControllers(this._oSettingCurrent, "extendControlDataInitial", oJson);
		this._callControllers(this._oSettingCurrent, "extendVariantDataInitial", oJson);
		this._callControllers(this._oSettingCurrent, "extendControlDataBase", oJson);
		this._callControllers(this._oSettingCurrent, "extendAlreadyKnownRuntimeData", oJson);
		this._callControllers(this._oSettingCurrent, "extendAlreadyKnownPersistentData", oJson);
	};

	Controller.prototype._setRuntimeAndPersonalizationData = function(oRuntimeData, oPersonalizationData) {
		oRuntimeData = (oRuntimeData === null ? {} : oRuntimeData);
		if (!this._sanityCheck(oRuntimeData)) {
			return;
		}
		oPersonalizationData = (oPersonalizationData === null ? {} : oPersonalizationData);
		if (!this._sanityCheck(oPersonalizationData)) {
			return;
		}

		if (
			typeof oRuntimeData?.columns?.fixedColumnCount === "undefined" &&
			typeof oPersonalizationData?.columns?.fixedColumnCount !== "undefined"
		) {
			oRuntimeData.columns.fixedColumnCount = oPersonalizationData.columns.fixedColumnCount;
		}

		if (
			typeof oRuntimeData?.columns?.showDetails === "undefined" &&
			typeof oPersonalizationData?.columns?.showDetails !== "undefined"
		) {
			oRuntimeData.columns.showDetails = oPersonalizationData.columns.showDetails;
		}

		this._setVariantData(oPersonalizationData);

		// extend controlDataInitial with missing (if any)
		this._extendModelStructure(this._requestMissingColumnsWithoutIgnore(oRuntimeData));

		// update variant
		var oJson = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataInitial(), oPersonalizationData);
		this._callControllers(this._oSettingCurrent, "setVariantDataInitial2Model", oJson);

		// now deal with runtime data ... i.e. controlDataBase

		// We have to build total data because otherwise the information like e.g. 'visible' gets lost (in case that the variant does not have 'visible').
		// The binding of the table of the dialog assumes that 'visible' should exist
		var oRuntimeDataTotal = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataInitial(), oRuntimeData);

		// we now make sure that any conflicts in oRuntimeDataTotal are fixed
		this._callControllers(this._oSettingCurrent, "fixConflictWithIgnore", oRuntimeDataTotal, this._getIgnoreData());
		this._callControllers(this._oSettingCurrent, "setControlDataBase2Model", oRuntimeDataTotal);
		for (var sType in this._oSettingCurrent) {
			this._calculateChangeType(sType, oRuntimeDataTotal);
		}

		this._suspendTable();
		this._syncTableUi();
		this._resumeTable(true);

		this._fireChangeEvent();
	};
	Controller.prototype._prepareDialogUi = function() {
		var oJsonColumnKeys = this._callControllers(this._oSettingCurrent, "createColumnKeysStructure", this.getColumnKeys());
		this._extendModelStructure(this._requestMissingColumnsWithoutIgnore(oJsonColumnKeys));

		this._callControllers(this._oSettingCurrent, "setBeforeOpenData2Model", this._getControlDataBase());
		// controlData-> controlDataReduce
		this._callControllers(this._oSettingCurrent, "calculateControlDataReduce");

		// we assume at this point that the binding is done !!
		var oJson = this._callControllers(this._oSettingCurrent, "getTable2JsonTransient", oJsonColumnKeys);
		this._callControllers(this._oSettingCurrent, "calculateTransientData", oJson);
		this._callControllers(this._oSettingCurrent, "calculatePropertyInfo", oJson);
	};
	Controller.prototype._postDialogUi = function(oJsonNew) {
		// 'controlDataReduce' is up-to-date due to the binding. Distribute now the new data to dependent data.
		this._callControllers(this._oSettingCurrent, "updateControlDataBaseFromJson", oJsonNew);

		this._callControllers(this._oSettingCurrent, "setBeforeOpenData2Model", undefined);
		this._callControllers(this._oSettingCurrent, "setControlDataReduce2Model", undefined);
		this._callControllers(this._oSettingCurrent, "setTransientData2Model", undefined);
	};
	Controller.prototype._syncDialogUi = function() {
		this._callControllers(this._oSettingCurrent, "calculateControlDataReduce");
	};
	Controller.prototype._syncTableUi = function() {
		this._callControllers(this._oSettingCurrent, "calculateControlData");
		// notice we need to update the Table directly since the metadata is not bound
		this._callControllers(this._oSettingCurrent, "syncJson2Table", this._getControlData());
	};
	Controller.prototype._resetFull = function() {
		this._setVariantData(undefined);
		this._callControllers(this._oSettingCurrent, "setControlDataBase2Model", this._getControlDataInitial());
	};
	Controller.prototype._resetPartial = function() {
		this._callControllers(this._oSettingCurrent, "setControlDataBase2Model", this._getVariantDataInitial());
	};
	Controller.prototype._calculateChangeType = function(sType, oJson) {
		var oSubController = {};
		oSubController[sType] = this._oSettingCurrent[sType];
		this._callControllers(oSubController, "calculatePersistentChangeTypesFromJson", oJson, this._determineResetType());

		// Aggregate 'persistentDataChangeType' to the dirty flag
		var oPersistentDataChangeType = this._getPersistentDataChangeType();
		var bIsDirty = false;
		for (sType in this._oSettingCurrent) {
			if (oPersistentDataChangeType[sType] !== CompLibrary.personalization.ChangeType.Unchanged) {
				bIsDirty = true;
			}
		}
		this._setIsDirty(bIsDirty);
	};

	/**
	 * Fire 'afterP13nModelDataChange' event with model data and change information.
	 *
	 * @param {sap.ui.comp.personalization.ResetType} sResetType is optional. Contains the reason why it has been changed
	 */
	Controller.prototype._fireChangeEvent = function(sResetType) {
		// sResetType = this._determineResetType(sResetType);

		var oChangeInformation = {};
		// note that oControlDataTotal semantically equals 'oRuntimeDataTotal' ! (i.e. table / chart ...)
		var oControlDataTotal = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataInitial(), this._getControlData());
		// Note that .runtimeDeltaDataChangeType is also really semantically .changeTypeAlreadyKnown
		oChangeInformation.runtimeDeltaDataChangeType = this._callControllers(this._oSettingCurrent, "getChangeType", oControlDataTotal, this._getAlreadyKnownRuntimeData());
		// var oControlDataBaseTotal = this._callControllers(this._oSettingCurrent, "getUnionData", this._getControlDataInitial(), this._getControlDataBase());
		// oChangeInformation.persistentDeltaDataChangeType = this._callControllers(this._oSettingCurrent, "getChangeType", oControlDataBaseTotal, this._getAlreadyKnownPersistentData());
		//
		// // note that dirty means if there are changes to the last set 'clean' state
		// if (sResetType === CompLibrary.personalization.ResetType.ResetFull) {
		// 	// we care about the change compared to initial
		// 	oChangeInformation.persistentDataChangeType = this._callControllers(this._oSettingCurrent, "getChangeType", this._getControlDataBase(), this._getControlDataInitial());
		// } else if (sResetType === CompLibrary.personalization.ResetType.ResetPartial) {
		// 	// we care about the change compared to the current active variant (could also be STANDARD)
		// 	oChangeInformation.persistentDataChangeType = this._callControllers(this._oSettingCurrent, "getChangeType", this._getControlDataBase(), this._getVariantDataInitial());
		// }
		// this._bIsDirty = Util.hasChangedType(oChangeInformation.persistentDataChangeType);

		oChangeInformation.persistentDeltaDataChangeType = this._getPersistentDeltaDataChangeType();
		oChangeInformation.persistentDataChangeType = this._getPersistentDataChangeType();

		if (!Util.hasChangedType(oChangeInformation.runtimeDeltaDataChangeType) && !Util.hasChangedType(oChangeInformation.persistentDeltaDataChangeType)) {
			return;
		}

		// New data compare to the last AlreadyKnown
		// note that oControlDataDelta semantically equals 'oRuntimeDataTotal' ! (i.e. table / chart ...)
		var oControlDataDelta = this._callControllers(this._oSettingCurrent, "getChangeData", oControlDataTotal, this._getAlreadyKnownRuntimeData());
		oChangeInformation.runtimeDeltaData = Util.removeEmptyProperty(Util.copy(oControlDataDelta));

		// oPersistentData = oPersistentDataTotal - oControlDataInitial, oPersistentDataTotal = oControlDataBase + oControlDataInitial
		var oPersistentData = this._callControllers(this._oSettingCurrent, "getChangeData", this._getControlDataBase(), this._getControlDataInitial());
		oChangeInformation.persistentData = Util.removeEmptyProperty(oPersistentData);

		// the below call can be safely replaced with
		// this._callControllers(this._oSettingCurrent, "setAlreadyKnownRuntimeData2Model", oControlDataTotal);
		// since oControlDataTotal only contains additional stuff that the consumer initially know and use
		// to instantiate the personalization controller
		this._callControllers(this._oSettingCurrent, "setAlreadyKnownRuntimeData2Model", this._getControlData());
		this._callControllers(this._oSettingCurrent, "setAlreadyKnownPersistentData2Model", this._getControlDataBase());

		// at the moment we do not expose this information !
		delete oChangeInformation.persistentDeltaDataChangeType;
		this.fireAfterP13nModelDataChange(oChangeInformation);
	};

	Controller.prototype._onSetVisible = function(bVisible, sColumnKey) {
		if (bVisible) {
			var aIgnoredColumnKeys = Util.getUnionOfAttribute(this._oSettingCurrent, "ignoreColumnKeys");
			if (aIgnoredColumnKeys.indexOf(sColumnKey) > -1) {
				throw "The provided 'ignoreColumnKeys' are inconsistent. No column specified as ignored is allowed to be visible. " + this;
			}
		}
	};
	Controller.prototype._onSetSummed = function(bIsSummed, oColumn) {
		this._oSettingCurrent.columns.controller._onColumnTotal({
			column: oColumn,
			isSummed: bIsSummed
		});
	};

	Controller.prototype._onSetGrouped = function(bGrouped, oColumn) {
		this._oSettingCurrent.group.controller._setGroup(bGrouped, oColumn);
	};

	/**
	 * Gets arguments of corresponding type.
	 *
	 * @param {array} aArgs contains all arguments in which the search for type is done
	 * @param {string} sType is the type for which the search is done
	 * @returns {array} aResult contains the identified arguments
	 */
	Controller.prototype._getArgumentsByType = function(aArgs, sType) {
		var aResult = [], oObject = null;
		if (aArgs && aArgs.length && sType) {
			aArgs.forEach(function(oArg) {
				if (oArg && oArg[sType] && typeof oArg[sType] !== "function") {
					oObject = {};
					oObject[sType] = oArg[sType];
					aResult.push(oObject);
				} else {
					aResult.push(oArg);
				}
			});
		}
		return aResult;
	};

	/**
	 * Calls a method "sMethodName" of all controllers in generic way.
	 *
	 * @param {string} oSettings contains additional setting for execution of mini-controller methods
	 * @param {string} sMethodName that is executed in the mini-controller
	 * @returns {object} oResult contains the result of the called mini-controller method packaged into mini-controller specific namespace.
	 */
	Controller.prototype._callControllers = function(oSettings, sMethodName) {
		var oSetting, oController, aArgsPartially;
		var oResults = {}, aArgs = Array.prototype.slice.call(arguments, 2);

		for (var sType in oSettings) {
			oSetting = oController = aArgsPartially = null;

			oSetting = oSettings[sType];
			oController = oSetting.controller;
			if (!oController || !oSetting.visible || !oController[sMethodName]) {
				continue;
			}
			aArgsPartially = this._getArgumentsByType(aArgs, sType);
			if (sMethodName === "getPanel" || sMethodName === "retrieveAdaptationUI" ) {
				aArgsPartially.push(oSetting.payload);
			} else if (sMethodName === "setIgnoreColumnKeys") {
				aArgsPartially.push(oSetting.ignoreColumnKeys);
			} else if (sMethodName === "setTriggerModelChangeOnColumnInvisible") {
				aArgsPartially.push(oSetting.triggerModelChangeOnColumnInvisible);
			}

			if (sMethodName === "setStableColumnKeys" && sType == "columns") {
				aArgsPartially.push(oSettings.columns.stableColumnKeys);
			}

			if (sMethodName === "setMessageStrip" && oSetting.createMessageStrip) {
				var oMessageStrip = oSetting.createMessageStrip();
				aArgsPartially.push(oMessageStrip);
			}

			var oResult = oController[sMethodName].apply(oController, aArgsPartially);
			if (oResult !== null && oResult !== undefined && oResult[sType] !== undefined) {
				oResults[sType] = oResult[sType];
			} else {
				oResults[sType] = oResult;
			}
		}

		return oResults;
	};

	Controller.prototype._sanityCheck = function(oJsonNew) {
		// TODO: sanity check
		// Only allow the right format e.g. "sort.sortItems" but not "sort".
		// {} is also allowed i.e. all personalization data are deleted.
		// null is also allowed i.e. go back to restore
		return true;
	};

	Controller.prototype._createInternalModel = function(aColumnKeys) {
		var oModel = new JSONModel();
		oModel.setDefaultBindingMode(BindingMode.TwoWay);
		oModel.setSizeLimit(10000);
		this.setModel(oModel, "$sapuicomppersonalizationBaseController");
		return oModel;
	};
	Controller.prototype._getInternalModel = function() {
		return this.getModel("$sapuicomppersonalizationBaseController");
	};
	Controller.prototype._getInternalModelData = function(sDataName) {
		return this._getInternalModel().getProperty("/" + sDataName);
	};
	Controller.prototype._getControlDataInitial = function() {
		return this._getInternalModelData("controlDataInitial");
	};
	Controller.prototype._getControlDataBase = function() {
		return this._getInternalModelData("controlDataBase");
	};
	Controller.prototype._getIgnoreData = function() {
		return this._getInternalModelData("ignoreData");
	};
	Controller.prototype._getPersistentDataChangeType = function() {
		return this._getInternalModelData("persistentDataChangeType");
	};
	Controller.prototype._getPersistentDeltaDataChangeType = function() {
		return this._getInternalModelData("persistentDeltaDataChangeType");
	};
	Controller.prototype._getControlData = function() {
		return this._getInternalModelData("controlData");
	};
	Controller.prototype._getControlDataReduce = function() {
		return this._getInternalModelData("controlDataReduce");
	};
	Controller.prototype._getTransientData = function() {
		return this._getInternalModelData("transientData");
	};
	Controller.prototype._getAlreadyKnownRuntimeData = function() {
		return this._getInternalModelData("alreadyKnownRuntimeData");
	};
	Controller.prototype._getAlreadyKnownPersistentData = function() {
		return this._getInternalModelData("alreadyKnownPersistentData");
	};
	Controller.prototype._getVariantDataInitial = function() {
		return this._getInternalModelData("variantDataInitial");
	};
	Controller.prototype._getBeforeOpenData = function() {
		return this._getInternalModelData("beforeOpenData");
	};

	Controller.prototype._setVariantData = function(oJson) {
		this._getInternalModel().setProperty("/variantData", oJson ? Util.copy(oJson) : undefined);
	};
	Controller.prototype._setIsDirty = function(bIsDirty) {
		this._getInternalModel().setProperty("/isDirty", bIsDirty);
	};

	Controller.prototype._getVariantData = function() {
		return this._getInternalModel().getProperty("/variantData");
	};

	Controller.prototype._getControllers = function() {
		var mControllers = {};
		Object.keys(this._oSettingCurrent).forEach(function(sKey){
			var oSetting = this._oSettingCurrent[sKey];
			if (oSetting.hasOwnProperty("controller")) {
				mControllers[sKey] = oSetting;
			}
		}.bind(this));
		return mControllers;
	};

	Controller.prototype._controllerFactory = function(sType) {
		var that = this;
		switch (sType) {
			case MLibrary.P13nPanelType.columns:
				return new ColumnsController({
					afterColumnsModelDataChange: function() {
						var fnListener = this.mEventRegistry.afterColumnsModelDataChange[0].fFunction;

						this.detachAfterColumnsModelDataChange(fnListener);
						that._syncTableUi();
						this.attachAfterColumnsModelDataChange(fnListener);

						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					},
					afterPotentialModelChange: function(oEvent) {
						that._calculateChangeType(sType, oEvent.getParameter("json"));
					}
				});
			case MLibrary.P13nPanelType.sort:
				return new SortController({
					afterSortModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					},
					afterPotentialModelChange: function(oEvent) {
						that._calculateChangeType(sType, oEvent.getParameter("json"));
					}
				});
			case MLibrary.P13nPanelType.filter:
				return new FilterController({
					afterFilterModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					},
					afterPotentialModelChange: function(oEvent) {
						that._calculateChangeType(sType, oEvent.getParameter("json"));
					}
				});
			case MLibrary.P13nPanelType.group:
				return new GroupController({
					afterGroupModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					},
					afterPotentialModelChange: function(oEvent) {
						that._calculateChangeType(sType, oEvent.getParameter("json"));
					}
				});
			case MLibrary.P13nPanelType.dimeasure:
				return new DimeasureController({
					afterDimeasureModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					},
					afterPotentialModelChange: function(oEvent) {
						that._calculateChangeType(sType, oEvent.getParameter("json"));
					}
				});
			case MLibrary.P13nPanelType.selection:
				return new SelectionController({
					afterSelectionModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					},
					afterPotentialModelChange: function(oEvent) {
						that._calculateChangeType(sType, oEvent.getParameter("json"));
					}
				});
			default:
				throw "Panel type '" + sType + "' is not valid";
		}
	};
	Controller.prototype.getTable = function() {
		var oTable = this.getAssociation("table");
		if (typeof oTable === "string") {
			oTable = Element.getElementById(oTable);
		}
		return oTable;
	};

	/**
	 * Returns a mapping object that references all columns that are
	 * known by the personalization Controller.
	 *
	 * @returns {object} Mapping object with all columns
	 */
	Controller.prototype.getColumnMap = function() {
		return this._oColumnHelper?.getColumnMap();
	};

	Controller._getOrderedColumnKeys = function(oColumnMap, aColumnKeys) {
		var aMapKeys = Object.keys(oColumnMap);
		return aColumnKeys.reduce(function(aResult, sColumnKey) {
			if (aMapKeys.indexOf(sColumnKey) > -1) {
				aResult.push(sColumnKey);
			}
			return aResult;
		}, []);
	};

	/**
	 * Cleans up before destruction.
	 */
	Controller.prototype.exit = function() {
		var sType;

		// if for some reason we exit when suspended we should put table back into resume mode
		this._resumeTable(false);

		// destroy dialog
		if (this._oDialog) {
			this._oDialog.destroy();
			this._oDialog = null;
		}

		if (this._oUIManager) {
			this._oUIManager.destroy();
			this._oUIManager = null;
		}
		this._oUISetting = null;

		// destroy controllers
		this._callControllers(this._oSettingCurrent, "destroy");
		for (sType in this._oSettingCurrent) {
			this._oSettingCurrent[sType] = null;
		}
		this._oSettingCurrent = null;
		this._oColumnHelper = null;
	};

	Controller.prototype._determineResetType = function(sResetType) {
		sResetType = sResetType || (this.getResetToInitialTableState() ? CompLibrary.personalization.ResetType.ResetFull : CompLibrary.personalization.ResetType.ResetPartial);
		if (sResetType === CompLibrary.personalization.ResetType.ResetFull || this._getVariantData() === undefined) {
			return CompLibrary.personalization.ResetType.ResetFull;
		}
		return CompLibrary.personalization.ResetType.ResetPartial;
	};

	Controller.prototype._isEqualAdditionalIgnoreColumnKeys = function(aColumnKeys) {
		var oJson = this._callControllers(this._oSettingCurrent, "isEqualAdditionalIgnoreColumnKeys", aColumnKeys);
		var bIsEqual = true;
		for (var sType in oJson) {
			bIsEqual = bIsEqual && oJson[sType];
		}
		return bIsEqual;
	};
	Controller.prototype._resetMessageStrip = function(aColumnKeys) {
		for (var sKey in this._oSettingCurrent) {
			var oSubController = this._oSettingCurrent[sKey].controller;
			if (oSubController && oSubController.getAdaptationUI() && oSubController.getAdaptationUI().isA("sap.m.p13n.BasePanel")) {
				oSubController.getAdaptationUI().setMessageStrip(undefined);
			}
		}
	};

	/**
	 * Sets the state of showHideDetails button in the <code>VariantManagement</code>
	 *
	 * @param {boolean} bShowDetails Value of the ShowHideDetails button in the <code>SmartTable</code>
	 * @private
	 * @ui5-restricted sap.ui.comp.smartTable.SmartTable
	 */
	Controller.prototype._setShowDetails = function(bShowDetails) {
		this._callControllers(this._oSettingCurrent, "_updateInternalModelShowHide", bShowDetails);
	};

	Controller.SyncReason = {
		ResetFull: 14,
		ResetPartial: 15,

		NewModelDataMixedWithVariant: 7
	};

	/* eslint-enable strict */

	return Controller;

});
