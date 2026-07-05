/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.NavigationContainer.
sap.ui.define([
	'sap/m/Link',
	'sap/ui/core/Control',
	'sap/m/VBox',
	'sap/m/HBox',
	'sap/m/Button',
	'sap/m/Title',
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	'sap/ui/core/library',
	'sap/m/Image',
	'sap/m/Text',
	'sap/ui/layout/form/SimpleForm',
	'./Factory',
	'./LinkData',
	'sap/ui/model/json/JSONModel',
	'./Util',
	'sap/ui/layout/HorizontalLayout',
	'sap/ui/layout/VerticalLayout',
	'sap/ui/layout/library',
	'sap/ui/comp/personalization/Util',
	'sap/ui/base/ManagedObjectObserver',
	'sap/m/FlexItemData',
	'sap/ui/model/BindingMode',
	'sap/m/library',
	'sap/ui/comp/personalization/Controller',
	'sap/ui/comp/personalization/SelectionWrapper',
	'sap/ui/comp/personalization/ColumnWrapper',
	'sap/base/Log',
	'sap/ui/core/CustomData',
	'sap/ui/core/Component'
], function(Link, Control, VBox, HBox, Button, Title, Element, Library, coreLibrary, Image, Text, SimpleForm, Factory, LinkData, JSONModel, Util, HorizontalLayout, VerticalLayout, layoutLibrary, PersonalizationUtil, ManagedObjectObserver, FlexItemData, BindingMode, mLibrary, Controller, SelectionWrapper, ColumnWrapper, Log, CustomData, Component) {
	"use strict";

	// shortcut for sap.ui.layout.form.SimpleFormLayout
	var SimpleFormLayout = layoutLibrary.form.SimpleFormLayout;

	// shortcut for sap.m.FlexJustifyContent
	var FlexJustifyContent = mLibrary.FlexJustifyContent;

	// shortcut for sap.m.ButtonType
	var ButtonType = mLibrary.ButtonType;

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	/**
	 * Constructor for a new navpopover/NavigationContainer.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The NavigationContainer...
	 * @extends sap.m.VBox
	 * @constructor
	 * @private
	 * @since 1.44.0
	 * @alias sap.ui.comp.navpopover.NavigationContainer
	 * @deprecated since 1.121 - SmartLink no longer opens a NavigationPopover, it got replaced by the sap.ui.mdc.link.Panel in a sap.m.ResponsivePopover
	 */
	var NavigationContainer = VBox.extend("sap.ui.comp.navpopover.NavigationContainer", /** @lends sap.ui.comp.navpopover.NavigationContainer.prototype */
		{
			metadata: {

				library: "sap.ui.comp",
				properties: {

					/**
					 * Sets the description of the main navigation link. If <code>mainNavigation</code> also contains an href description, then
					 * <code>mainNavigationId</code> is displayed. If <code>mainNavigationId</code> is set to an empty string <code>''</code>,
					 * neither description nor subtitle are displayed.
					 */
					mainNavigationId: {
						type: "string",
						group: "Misc",
						defaultValue: null
					},

					/**
					 * Determines whether the personalization link is shown inside the NavigationPopover control.
					 *
					 * @since 1.46.0
					 */
					enableAvailableActionsPersonalization: {
						type: "boolean",
						defaultValue: true
					}
				},
				aggregations: {

					/**
					 * A list of available actions shown as links.
					 */
					availableActions: {
						type: "sap.ui.comp.navpopover.LinkData",
						multiple: true,
						singularName: "availableAction"
					},

					/**
					 * The main navigation link. If <code>mainNavigationId</code> is not set then <code>text</code> of <code>mainNavigation</code>
					 * is displayed. Otherwise the <code>mainNavigationId</code> is displayed.
					 */
					mainNavigation: {
						type: "sap.ui.comp.navpopover.LinkData",
						multiple: false
					}
				},
				associations: {

					/**
					 * In addition to main navigation link and available links some additional content can be displayed in the popover.
					 */
					extraContent: {
						type: "sap.ui.core.Control",
						multiple: false
					},
					/**
					 * The parent component. TODO: to be removed.
					 */
					component: {
						type: "sap.ui.core.Element",
						multiple: false
					},
					/**
					 * The parent control.
					 *
					 * @since 1.89.0
					 */
					control: {
						type: "sap.ui.core.Control",
						multiple: false
					}
				},
				events: {

					/**
					 * This event is fired when a link is chosen.
					 */
					navigate: {},

					/**
					 * This event is fired before selection popover is opened.
					 */
					beforePopoverOpen: {},
					/**
					 * This event is fired after selection popover is closed.
					 */
					afterPopoverClose: {}
				}
			},
			renderer: {
				apiVersion: 2
			}
		});

	NavigationContainer.prototype.init = function() {
		VBox.prototype.init.call(this);

		var oModel = new JSONModel({
			mainNavigationLink: {
				title: undefined,
				subtitle: undefined,
				href: undefined,
				target: undefined
			},
			availableActions: [],
			enableAvailableActionsPersonalization: undefined,
			extraContent: undefined,
			// Available actions which visibility has been modified by layers (e.g. 'VENDOR' or 'CUSTOMER' etc.) before the End-User layer.
			// It contains the initial state of visibility coming from FLP and changed by the application and additionally all changes done
			// in previously layers like 'VENDOR' or 'CUSTOMER' etc. We keep this state in order to use it as initial data when the selection dialog is opened.
			initialAvailableActions: []
		});
		oModel.setDefaultBindingMode(BindingMode.TwoWay);
		oModel.setSizeLimit(1000);
		this.setModel(oModel, "$sapuicompNavigationContainer");

		this._oObserver = new ManagedObjectObserver(this._observeChanges.bind(this));
		this._oAvailableActionsObserver = new ManagedObjectObserver(this._observeAvailableActionsChanges.bind(this));
		this._oAvailableActionsObserver.observe(this, {
			aggregations: [
				"availableActions"
			]
		});

		this.oPersonalizationController = null;
	};

	NavigationContainer.prototype.applySettings = function() {
		VBox.prototype.applySettings.apply(this, arguments);
		this._createContent();
	};

	NavigationContainer.prototype.exit = function(oControl) {
		// destroy model and its data
		if (this._getInternalModel()) {
			this._getInternalModel().destroy();
		}
		if (this._oObserver) {
			this._oObserver.disconnect();
			this._oObserver = null;
		}
		if (this._oAvailableActionsObserver) {
			this._oAvailableActionsObserver.disconnect();
			this._oAvailableActionsObserver = null;
		}
		this._oDefaultExtraConent = null;
		this._oSeparator = null;
	};
	// ----------------------- Public Methods -------------------------

	NavigationContainer.prototype.openSelectionDialog = function(bForbidNavigation, bShowReset, fCallbackAfterClose, bIsEndUser, sStyleClass, oControl) {
		this.fireBeforePopoverOpen();

		// We have to wait until all changes have been applied to the NavigationContainer
		return this._getFlexRuntimeInfoAPI().then(function(FlexRuntimeInfoAPI) {
			return FlexRuntimeInfoAPI.waitForChanges({ element: this }).then(function() {
				return new Promise(function(resolve) {
					var oModel = this._getInternalModel();
					// Take as initial links all changes which have NOT been applied for 'USER'. In case of 'Restore' the logic of personalization controller
					// will remove the delta to the initial links i.e. all 'USER' changes and the not 'USER' changes will remain.
					// Note: we differentiate between 'USER' and not 'USER' changes. The last can also be changes of different layers e.g. 'VENDOR', 'CUSTOMER'.
					var aInitialAvailableActions = Util.getStorableAvailableActions(oModel.getProperty("/initialAvailableActions"));
					var aSelectionItems = Util.getStorableAvailableActions(oModel.getProperty("/availableActions")).map(function(oMAvailableAction) {
						return {
							columnKey: oMAvailableAction.key,
							visible: oMAvailableAction.visible
						};
					});

					var oSelectionWrapper = new SelectionWrapper({
						press: function(oOriginEvent) {
							this._onLinkPress(oOriginEvent);
						}.bind(this),
						columns: aInitialAvailableActions.map(function(oMAvailableAction) {
							return new ColumnWrapper({
								label: oMAvailableAction.text,
								selected: oMAvailableAction.visible,
								href: bForbidNavigation ? undefined : oMAvailableAction.href,
								internalHref: bForbidNavigation ? undefined : oMAvailableAction.internalHref,
								target: oMAvailableAction.target,
								description: oMAvailableAction.description,
								customData: new CustomData({
									key: "p13nData",
									value: {
										columnKey: oMAvailableAction.key
									}
								})
							});
						})
					});

					oSelectionWrapper._container = this;

					if (!this.oPersonalizationController) {
						this.oPersonalizationController = new Controller({
							resetToInitialTableState: true,
							table: oSelectionWrapper,
							setting: {
								selection: {
									visible: true,
									payload: {
										callbackSaveChanges: function(oPersistentDeltaData) {
											var aPersistentDeltaSelectionItems = (oPersistentDeltaData && oPersistentDeltaData.selection && oPersistentDeltaData.selection.selectionItems) || [];

											if (fCallbackAfterClose) {
												fCallbackAfterClose(aPersistentDeltaSelectionItems.map(function(oMSelectionItem) {
													return {
														key: oMSelectionItem.columnKey,
														visible: oMSelectionItem.visible
													};
												}));
												return Promise.resolve(true);
											}

											var aMAddedLinks = [];
											var aMRemovedLinks = [];
											aPersistentDeltaSelectionItems.forEach(function(oMSelectionItem) {
												if (oMSelectionItem.visible === true) {
													aMAddedLinks.push({
														key: oMSelectionItem.columnKey,
														visible: oMSelectionItem.visible
													});
												} else {
													aMRemovedLinks.push({
														key: oMSelectionItem.columnKey,
														visible: oMSelectionItem.visible
													});
												}
											});

											return NavigationContainer._saveChanges(aMAddedLinks, aMRemovedLinks, this).then(function() {
												return true;
											});
										}.bind(this)
									}
								}
							},
							dialogConfirmedReset: function() {
								NavigationContainer._discardChanges(this);
							}.bind(this),
							dialogAfterClose: function() {
								this.fireAfterPopoverClose();
								resolve();
							}.bind(this)
						});
					}
					// As 'variant' we take 'USER' changes, so in case of 'Restore' we can remove all 'USER' changes. The 'KEY USER' changes will remain.
					this.oPersonalizationController.setPersonalizationData({
						selection: {
							selectionItems: aSelectionItems
						}
					});
					this.oPersonalizationController.openDialog({
						contentWidth: "28rem",
						contentHeight: "35rem",
						styleClass: "" + sStyleClass,
						showReset: bShowReset,
						selection: {
							visible: true
						}
					}).then(function() {
						var oPersonalizationDialog = this.oPersonalizationController._oDialog;
						if (oControl) {
							oControl.addDependent(oPersonalizationDialog);
						}

						resolve();
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};
	/**
	 * Discards changes.
	 * <b>Note:</b> Restricted for personalization scenario.
	 * @param {sap.ui.comp.navpopover.NavigationContainer} oSelectorControl Control
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @private
	 */
	NavigationContainer._discardChanges = function(oSelectorControl) {
		return new Promise(function(resolve) {
			Library.load({name: 'sap.ui.fl'}).then(function() {
				sap.ui.require([
					'sap/ui/comp/navpopover/FlexConnector'
				], function(FlexConnector) {
					return FlexConnector.discardChangesForControl(oSelectorControl).then(function() {
						return resolve(true);
					}, function(oError) {
						Log.error("Changes could not be discarded in LRep: " + oError);
						return resolve(false);
					});
				});
			});
		});
	};
	/**
	 * Saves changes.
	 * @param {object[]} aMAddedLinks Changes in format: {key: {string}, visible: {boolean}}
	 * @param {object[]} aMRemovedLinks Changes in format: {key: {string}, visible: {boolean}}
	 * @param {sap.ui.comp.navpopover.NavigationContainer} oSelectorControl Control
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @private
	 */
	NavigationContainer._saveChanges = function(aMAddedLinks, aMRemovedLinks, oSelectorControl) {
		return new Promise(function(resolve) {
			Library.load({name: 'sap.ui.fl'}).then(function() {
				sap.ui.require([
					'sap/ui/comp/navpopover/FlexConnector'
				], function(FlexConnector) {
					return FlexConnector.createAndSaveChangesForControl(aMAddedLinks, aMRemovedLinks, oSelectorControl).then(function() {
						return resolve(true);
					}, function(oError) {
						Log.error("Changes could not be saved in LRep: " + oError);
						return resolve(false);
					});
				});
			});
		});
	};

	/**
	 * Returns link for direct navigation if the NavigationPopover has only <code>mainNavigation</code> or one <code>availableAction</code> and no
	 * <code>extraContent</code>.
	 *
	 * @returns {sap.m.Link | null}
	 * @private
	 */
	NavigationContainer.prototype.getDirectLink = function() {
		var oModel = this._getInternalModel();

		// Extra content should be shown always, no direct navigation possible
		if (oModel.getProperty('/extraContent')) {
			return null;
		}

		// If only main navigation link exists, direct navigation is possible
		if (oModel.getProperty('/mainNavigationLink/href') && !oModel.getProperty('/availableActions').length) {
			return this._oHeaderArea.getItems()[0].getContent();
		}

		// If only one availabel action exists (independent whether it is visible or not), direct navigation is possible
		if (oModel.getProperty('/availableActions').length === 1 && !oModel.getProperty('/mainNavigationLink/href')) {
			return this._oActionArea.getItems()[0].getItems()[0];
		}
		return null;
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype.hasContent = function() {
		var oModel = this._getInternalModel();
		return !!oModel.getProperty("/mainNavigationLink/href") || !!oModel.getProperty("/availableActions").length || !!oModel.getProperty('/extraContent');
	};

	// ----------------------- Overwrite Property Methods --------------------------

	NavigationContainer.prototype.setExtraContent = function(oControl) {
		this.setAssociation("extraContent", oControl);
		if (!oControl) {
			return this;
		}
		var oModel = this._getInternalModel();
		if (oModel.getProperty("/extraContent")) {
			this.removeItem(1);
		}
		// Note: 'extraContent' is an association of an control which is created by application in 'navigationTargetsObtained' event. Now we have to
		// add this control to the popover content aggregation. Doing so the NavigationContainer is responsible for life cycle of this control which
		// will be destroyed together with NavigationContainer.
		if (typeof oControl === "string") {
			oControl = Element.getElementById(oControl);
		}

		this.insertItem(oControl, 1);

		oModel.setProperty("/extraContent", oControl);
		return this;
	};

	NavigationContainer.prototype.setMainNavigationId = function(sMainNavigationId) {
		this.setProperty("mainNavigationId", sMainNavigationId, true);
		var oModel = this._getInternalModel();
		if (typeof sMainNavigationId === "string") {
			oModel.setProperty("/mainNavigationLink/title", sMainNavigationId);
		}
		return this;
	};

	NavigationContainer.prototype.setMainNavigation = function(oLinkData) {
		this.setAggregation("mainNavigation", oLinkData, true);
		if (!oLinkData) {
			return this;
		}
		var oModel = this._getInternalModel();
		if (oLinkData.getHref()) {
			oModel.setProperty("/mainNavigationLink/href", oLinkData.getHref());
			oModel.setProperty("/mainNavigationLink/internalHref", oLinkData.getInternalHref());
			oModel.setProperty("/mainNavigationLink/target", oLinkData.getTarget());
			// this._oHeaderArea.removeStyleClass("navpopoversmallheader");
			// } else {
			// oModel.setProperty("/mainNavigationLink/href", null);
			// oModel.setProperty("/mainNavigationLink/target", null);
			// this._oHeaderArea.addStyleClass("navpopoversmallheader");
		}
		// Priority for 'title':
		// 1. 'mainNavigationId' 2. oLinkData.getText()
		// Note: Empty string '' have to lead that both title and subtitle will not be displayed. So if title is equal to '' then do not take over the
		// text of link.
		if (!oModel.getProperty("/mainNavigationLink/title") && oModel.getProperty("/mainNavigationLink/title") !== '') {
			oModel.setProperty("/mainNavigationLink/title", oLinkData.getText());
		}
		oModel.setProperty("/mainNavigationLink/subtitle", oLinkData.getDescription());
		return this;
	};

	NavigationContainer.prototype.setEnableAvailableActionsPersonalization = function(bEnableAvailableActionsPersonalization) {
		this.setProperty("enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization, true);
		this._getInternalModel().setProperty("/enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization);
		return this;
	};

	NavigationContainer.prototype.onAfterRenderingActionForm = function() {
		var oModel = this._getInternalModel();
		var $ContentContainer = oModel.getProperty("/extraContent") ? oModel.getProperty("/extraContent").$()[0] : undefined;

		if ($ContentContainer && $ContentContainer.scrollHeight > $ContentContainer.clientHeight) {
			// Change the default behavior for the case that all three sections can not fit the height of phone (e.g. the additionalContentSection is
			// larger then the spared place
			this.setFitContainer(false).setJustifyContent(FlexJustifyContent.Start);
		}
	};

	// -------------------------- Private Methods ------------------------------------
	NavigationContainer.prototype._getFlexRuntimeInfoAPI = function() {
		//TODO Only load the write part when sap.ui.fl separation is done
		return Library.load({name: 'sap.ui.fl'}).then(function() {
			return new Promise(function(fResolve) {
				sap.ui.require([
					"sap/ui/fl/apply/api/FlexRuntimeInfoAPI"
				], function(FlexRuntimeInfoAPI) {
					fResolve(FlexRuntimeInfoAPI);
				});
			});
		});
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._createContent = function() {

		this.addStyleClass("navigationPopover");

		this._oHeaderArea = this._createHeaderArea();

		this._oDefaultExtraConent = new SimpleForm({
			layout: SimpleFormLayout.ResponsiveGridLayout,
			content: [
				new Title({
					text: Library.getResourceBundleFor("sap.ui.comp").getText("POPOVER_MSG_NO_CONTENT")
				})
			]
		});
		this._oDefaultExtraConent.addStyleClass("navigationPopoverDefaultExtraContent");

		this._oSeparator = new VBox({
			visible: false
		});
		this._oSeparator.addStyleClass("navigationPopoverSeparator");

		this._oActionArea = new VBox({
			items: {
				path: '/availableActions',
				templateShareable: false,
				factory: function(sId, oBindingContext) {
					var oLink = new Link({
						visible: "{visible}",
						text: "{text}",
						href: "{href}",
						target: "{target}",
						press: oBindingContext.getProperty("press"),
						wrapping: true
					});
					var oCustomData = new CustomData({
						key: "internalHref",
						value: "{internalHref}"
					});
					oLink.addCustomData(oCustomData);
					this._oObserver.observe(oLink, {
						// If the visible value is not changed (e.g. because the default value is set), the 'properties' observer change will not be raised
						bindings: [
							"visible"
						],
						properties: [
							"visible"
						]
					});
					return new VBox({
						visible: "{visible}",
						layoutData: new FlexItemData({
							styleClass: oBindingContext.getProperty("description") ? "navigationPopoverAvailableLinkGroup" : "navigationPopoverAvailableLinkWithoutGroup"
						}),
						items: [
							oLink, new Text({
								visible: "{visible}",
								text: "{description}"
							})
						]
					});
				}.bind(this)
			}
		});
		this._oActionArea.addEventDelegate({
			onAfterRendering: this.onAfterRenderingActionForm.bind(this)
		});
		this._oActionArea.addStyleClass("navigationPopoverAvailableLinks");

		this._oPersonalizationButton = new HBox({
			visible: {
				parts: [
					{
						path: '/enableAvailableActionsPersonalization'
					}
				],
				formatter: function(bEnableAvailableActionsPersonalization) {
					return !!bEnableAvailableActionsPersonalization;
				}
			},
			justifyContent: "End",
			items: new Button({
				type: ButtonType.Transparent,
				text: Library.getResourceBundleFor("sap.ui.comp").getText("POPOVER_DEFINE_LINKS"),
				press: function(oEvent) {
					this.openSelectionDialog(false, true, undefined, true, undefined, oEvent.getSource());
				}.bind(this)
			})
		});
		this._oPersonalizationButton.addStyleClass("navigationPopoverPersonalizationButton");

		// Default behavior for the case that all three sections can fit the height of phone (e.g. only mainNavigationSection and
		// relatedAppsSection w/o additionalContentSection or mainNavigationSection, relatedAppsSection and small additionalContentSection)
		this.setFitContainer(true);
		this.setJustifyContent(FlexJustifyContent.Start);

		this.addItem(this._oHeaderArea)
			.addItem(this._getInternalModel().getProperty("/extraContent") || this._oDefaultExtraConent)
			.addItem(this._oSeparator)
			.addItem(this._oActionArea)
			.addItem(this._oPersonalizationButton);

		this._oHeaderArea.setModel(this._getInternalModel());
		this._oSeparator.setModel(this._getInternalModel());
		this._oActionArea.setModel(this._getInternalModel());
		this._oPersonalizationButton.setModel(this._getInternalModel());
	};

	NavigationContainer.prototype._createHeaderArea = function() {
		var oTitle = this._createTitle();
		var oSubTitle = this._createSubTitle();
		var oHeaderArea = new VBox({
			items: [
				oTitle, oSubTitle
			],
			visible: {
				path: '/mainNavigationLink/title',
				formatter: function(oTitle_) {
					return !!oTitle_;
				}
			}
		});
		oHeaderArea.addStyleClass("navigationPopoverTitleH1");
		oHeaderArea.addStyleClass("navigationPopoverHeader");

		return oHeaderArea;
	};

	NavigationContainer.prototype._createSubTitle = function() {
		var oSubTitle = new Text({
			text: {
				path: '/mainNavigationLink/subtitle'
			},
			visible: {
				path: '/mainNavigationLink/subtitle',
				formatter: function(oValue) {
					return !!oValue;
				}
			}
		});

		return oSubTitle;
	};

	NavigationContainer.prototype._createTitle = function() {
		var oLink = new Link({
			href: {
				path: '/mainNavigationLink/href'
			},
			text: {
				path: '/mainNavigationLink/title'
			},
			target: {
				path: '/mainNavigationLink/target'
			},
			visible: {
				path: '/mainNavigationLink/title',
				formatter: function(oTitle_) {
					return !!oTitle_;
				}
			},
			enabled: {
				path: '/mainNavigationLink/href',
				formatter: function(oValue) {
					return !!oValue;
				}
			},
			press: this._onLinkPress.bind(this),
			wrapping: true
		});
		var oCustomData = new CustomData({
			key: "internalHref",
			value: "{/mainNavigationLink/internalHref}"
		});
		oLink.addCustomData(oCustomData);
		var oTitle = new Title({
			level: TitleLevel.Auto,
			content: oLink
		});
		oTitle.addStyleClass("sapFontHeader5Size");
		this._oObserver.observe(oTitle, {
			// If the visible value is not changed (e.g. because the default value is set), the 'properties' observer change will not be raised
			bindings: [
				"visible"
			],
			properties: [
				"visible"
			]
		});

		return oTitle;
	};

	/**
	 * Returns the control instance for which the popover should be displayed.
	 *
	 * @returns { sap.ui.core.Control}
	 * @private
	 */
	NavigationContainer.prototype._getControl = function() {
		var oControl = this.getAssociation("control");
		if (typeof oControl === "string") {
			oControl = Element.getElementById(oControl);
		}
		return oControl;
	};

	/**
	 * EventHandler for all link press on this popover
	 *
	 * @param {object} oEvent - the event parameters
	 * @private
	 */
	NavigationContainer.prototype._onLinkPress = function(oEvent) {
		// In case a link is pressed on the SelectionPanel the event id is "linkPressed" and we get a different source
		var oSource = oEvent.getId() === "press" ? oEvent.getSource() : oEvent.getParameters().getSource();
		var bCtrlKeyPressed = oEvent.getParameters().ctrlKey || oEvent.getParameters().metaKey;
		if (oSource.getTarget() !== "_blank" && !bCtrlKeyPressed) {
			oEvent.preventDefault();
			this.fireNavigate({
				text: oSource.getText(),
				href: oSource.getHref(),
				internalHref: oSource.data("internalHref")
			});
		}
	};

	/**
	 * Returns the component object.
	 *
	 * @returns {object} the component
	 * @private
	 */
	NavigationContainer.prototype._getComponent = function() {
		var oComponent = this.getComponent();
		if (typeof oComponent === "string") {
			oComponent = Component.getComponentById(oComponent);
		}
		return oComponent;
	};

	NavigationContainer.prototype._observeAvailableActionsChanges = function(oChanges) {
		var oModel;
		if (oChanges.object.isA("sap.ui.comp.navpopover.NavigationContainer")) {

			switch (oChanges.name) {
				case "availableActions":
					oModel = this._getInternalModel();
					var aLinkData = oChanges.child ? [
						oChanges.child
					] : oChanges.children;
					aLinkData.forEach(function(oLinkData) {

						switch (oChanges.mutation) {
							case "insert":
								if (!oLinkData || !oLinkData.isA("sap.ui.comp.navpopover.LinkData")) {
									return;
								}
								oLinkData.setPress(this._onLinkPress.bind(this));

								this._oAvailableActionsObserver.observe(oLinkData, {
									properties: [
										"visible"
									]
								});

								oModel.setProperty("/initialAvailableActions/" + this.indexOfAvailableAction(oLinkData) + "/", oLinkData.getJson());
								oModel.setProperty("/availableActions/" + this.indexOfAvailableAction(oLinkData) + "/", oLinkData.getJson());

								break;
							case "remove":
								Log.error("Deletion of AvailableActions is not supported");
								break;
							default:
								Log.error("Mutation '" + oChanges.mutation + "' is not supported jet.");
						}
					}.bind(this));
					break;
				default:
					Log.error("The '" + oChanges.name + "' of NavigationContainer is not supported yet.");
			}

		} else if (oChanges.object.isA("sap.ui.comp.navpopover.LinkData")) {
			switch (oChanges.name) {
				case "visible":
					var oLinkData = oChanges.object;
					oModel = this._getInternalModel();
					var iIndex = -1;
					oModel.getProperty("/availableActions").some(function(oMAvailableAction, iActionIndex) {
						if (oLinkData.getKey() === oMAvailableAction.key) {
							iIndex = iActionIndex;
							return true;
						}
					});
					if (iIndex < 0) {
						Log.error("The available action with key '" + oLinkData.getKey() + "' does not exist in availableActions.");
					}
					if (oLinkData.getVisibleChangedByUser()) {
						oModel.setProperty("/availableActions/" + iIndex + "/visible", oLinkData.getVisible());
					} else {
						oModel.setProperty("/initialAvailableActions/" + iIndex + "/visible", oLinkData.getVisible());
						oModel.setProperty("/availableActions/" + iIndex + "/visible", oLinkData.getVisible());
					}
					break;
				default:
					Log.error("The '" + oChanges.name + "' of LinkData is not supported yet.");
			}
		}
	};

	NavigationContainer.prototype._observeChanges = function(oChanges) {
		if ((oChanges.type === "property" || oChanges.type === "binding") && oChanges.name === "visible") {
			var aMAvailableActions = this._getInternalModel().getProperty("/availableActions");
			var aMVisibleAvailableActions = aMAvailableActions.filter(function(oMAvailableAction) {
				return oMAvailableAction.visible === true;
			});
			this._oSeparator.setVisible(aMVisibleAvailableActions.length > 0 || !!this._getInternalModel().getProperty("/enableAvailableActionsPersonalization"));
			this._oActionArea.setVisible(aMVisibleAvailableActions.length > 0);

			if (this.hasContent() && !this._getInternalModel().getProperty("/extraContent")) {
				this._oDefaultExtraConent.setVisible(false);
			}
		}
	};

	NavigationContainer.prototype._getInternalModel = function() {
		return this.getModel("$sapuicompNavigationContainer");
	};

	return NavigationContainer;

});
