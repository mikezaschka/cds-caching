/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.NavigationPopover.
sap.ui.define([
	'sap/m/Link',
	'sap/m/ResponsivePopover',
	'sap/m/Button',
	'sap/m/Title',
	'sap/m/Image',
	'sap/m/Text',
	'sap/m/VBox',
	'sap/m/HBox',
	'./Factory',
	'./LinkData',
	"sap/ui/core/Element",
	"sap/ui/core/Lib",
	'sap/ui/model/json/JSONModel',
	'sap/ui/base/ManagedObjectObserver',
	'sap/m/FlexItemData',
	'sap/ui/model/BindingMode',
	'sap/ui/Device',
	'sap/m/library',
	'sap/base/Log',
	'sap/ui/core/CustomData',
	'sap/ui/core/Component'
], function(Link, ResponsivePopover, Button, Title, Image, Text, VBox, HBox, Factory, LinkData, Element, Library, JSONModel, ManagedObjectObserver, FlexItemData, BindingMode, Device, mLibrary, Log, CustomData, Component) {
	"use strict";

	// shortcut for sap.m.PlacementType
	var PlacementType = mLibrary.PlacementType;

	// shortcut for sap.m.FlexJustifyContent
	var FlexJustifyContent = mLibrary.FlexJustifyContent;

	// shortcut for sap.m.ButtonType
	var ButtonType = mLibrary.ButtonType;

	/**
	 * Constructor for a new navpopover/NavigationPopover.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The NavigationPopover control is used to present information in a specific format. <b>Note</b>: This control is used by the
	 *        {@link sap.ui.comp.navpopover.NavigationPopoverHandler NavigationPopoverHandler} and must not be used manually.
	 * @extends sap.m.ResponsivePopover
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.navpopover.NavigationPopover
	 * @deprecated since 1.121 - SmartLink no longer opens a NavigationPopover, it got replaced by the sap.ui.mdc.link.Panel in a sap.m.ResponsivePopover
	 */
	var NavigationPopover = ResponsivePopover.extend("sap.ui.comp.navpopover.NavigationPopover", /** @lends sap.ui.comp.navpopover.NavigationPopover.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * The name of the semantic object.
				 *
				 * @deprecated Since 1.40.0. The property <code>semanticObjectName</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				semanticObjectName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Describes the semantic attributes. The attribute has to be a map.
				 *
				 * @deprecated Since 1.40.0. The property <code>semanticAttributes</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				semanticAttributes: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The application state key passed to retrieve the navigation targets.
				 *
				 * @deprecated Since 1.40.0. The property <code>appStateKey</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				appStateKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Sets the description of the main navigation link. If <code>mainNavigation</code> also contains an href description, then
				 * <code>mainNavigationId</code> is displayed. If <code>mainNavigationId</code> is set to an empty string <code>''</code>,
				 * neither description nor subtitle are displayed.
				 *
				 * @since 1.28.0
				 */
				mainNavigationId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines the text of personalization link. If this property is set to some string, choosing the personalization link will trigger
				 * the <code>availableActionsPersonalizationPress</code> event. If this property is not set, the personalization link is not shown.
				 *
				 * @since 1.44.0
				 */
				availableActionsPersonalizationText: {
					type: "string",
					group: "Misc",
					defaultValue: undefined
				}
			},
			aggregations: {

				/**
				 * A list of available actions shown as links.
				 *
				 * @since 1.28.0
				 */
				availableActions: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: true,
					singularName: "availableAction"
				},

				/**
				 * The main navigation link. If <code>mainNavigationId</code> is not set then <code>text</code> of <code>mainNavigation</code>
				 * is displayed. Otherwise the <code>mainNavigationId</code> is displayed.
				 *
				 * @since 1.28.0
				 */
				mainNavigation: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: false
				},

				/**
				 * The navigation taking the user back to the source application.
				 *
				 * @deprecated Since 1.40.0. The property <code>ownNavigation</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				ownNavigation: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: false
				}
			},
			associations: {

				/**
				 * Source control for which the popover is displayed.
				 *
				 * @since 1.28.0
				 */
				source: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * In addition to main navigation link and available links some additional content can be displayed in the popover.
				 *
				 * @since 1.28.0
				 */
				extraContent: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * The parent component.
				 */
				component: {
					type: "sap.ui.core.Element",
					multiple: false
				}
			},
			events: {

				/**
				 * The navigation targets that are shown.
				 *
				 * @deprecated Since 1.40.0. The event <code>navigationTargetsObtained</code> is obsolete as target determination is no longer done
				 *             by NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination. The event
				 *             <code>navigationTargetsObtained</code> is fired from NavigationPopoverHandler after navigation targets are
				 *             determined.
				 * @since 1.28.0
				 */
				targetsObtained: {},

				/**
				 * This event is fired when a link is chosen.
				 *
				 * @since 1.28.0
				 */
				navigate: {
					parameters: {
						/**
						 * The UI text shown in the chosen link
						 */
						text: {
							type: "string"
						},

						/**
						 * The navigation target of the chosen link
						 */
						href: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired when personalization of <code>availableActions</code> is chosen.
				 *
				 * @since 1.44.0
				 */
				availableActionsPersonalizationPress: {}
			}
		},
		renderer: {
			apiVersion: 2
		}
	});

	NavigationPopover.prototype.init = function() {
		ResponsivePopover.prototype.init.call(this);

		var oModel = new JSONModel({
			mainNavigationLink: {
				title: undefined,
				subtitle: undefined,
				href: undefined,
				target: undefined
			},
			ownNavigation: undefined, // obsolete
			availableActions: [],
			availableActionsPersonalizationText: undefined,
			extraContent: undefined
		});
		oModel.setDefaultBindingMode(BindingMode.TwoWay);
		oModel.setSizeLimit(1000);
		this.setModel(oModel, "$sapuicompNavigationPopover");

		this._bUseExternalContent = false;

		this.addStyleClass("navigationPopover");
		this.setContentWidth("380px");
		this.setHorizontalScrolling(false);
		this.setShowHeader(Device.system.phone);
		this.setPlacement(PlacementType.Auto);

		this._oObserver = null;
	};

	NavigationPopover.prototype.applySettings = function(mSettings) {
		if (mSettings && mSettings.customData && mSettings.customData.getProperty("key") === "useExternalContent") {
			this._bUseExternalContent = true;
		}
		this._createContent();
		ResponsivePopover.prototype.applySettings.apply(this, arguments);
	};

	NavigationPopover.prototype.exit = function(oControl) {
		// destroy model and its data
		if (this._getInternalModel()) {
			this._getInternalModel().destroy();
		}
		if (this._oObserver) {
			this._oObserver.disconnect();
			this._oObserver = null;
		}
		ResponsivePopover.prototype.exit.apply(this, arguments);
	};
	// ----------------------- Public Methods --------------------------

	/**
	 * Determines the potential navigation targets for the semantical object and visualize the popover.
	 *
	 * @public
	 * @deprecated Since 1.42.0. Target determination is no longer done by NavigationPopover. Instead the NavigationPopoverHandler is responsible for
	 *             target determination.
	 */
	NavigationPopover.prototype.retrieveNavTargets = async function() {
		Log.warning("sap.ui.comp.navpopover.NavigationPopover#retrieveNavTargets called. This function is deprecated since UI5 version 1.42!");

		var oXApplNavigation = await Factory.getServiceAsync("CrossApplicationNavigation");
		var oURLParsing = await Factory.getServiceAsync("URLParsing");
		if (!oXApplNavigation || !oURLParsing) {
			Log.error("Service 'CrossApplicationNavigation' could not be obtained");
			// still fire targetsObtained event: easier for testing and the eventhandlers still could provide static links
			this.fireTargetsObtained();
			return;
		}

		var that = this;

		this.setMainNavigation(null);
		this.setOwnNavigation(null);
		this.removeAllAvailableActions();

		var oPromise = oXApplNavigation.getLinks({
			semanticObject: this.getSemanticObjectName(),
			params: this.getSemanticAttributes(),
			appStateKey: this.getAppStateKey(),
			ui5Component: this._getComponent(),
			sortResultOnTexts: true
		// ignoreFormFactor: false
		});
		oPromise.done(function(aLinks) {
			if (!aLinks || !aLinks.length) {
				that.fireTargetsObtained();
				return;
			}

			var sCurrentHash = oXApplNavigation.hrefForExternal();
			if (sCurrentHash && sCurrentHash.indexOf("?") !== -1) {
				// sCurrentHash can contain query string, cut it off!
				sCurrentHash = sCurrentHash.split("?")[0];
			}

			aLinks.forEach(function(oLink) {
				if (oLink.intent.indexOf(sCurrentHash) === 0) {
					// Prevent current app from being listed
					// NOTE: If the navigation target exists in
					// multiple contexts (~XXXX in hash) they will all be skipped
					that.setOwnNavigation(new LinkData({
						href: oLink.intent,
						text: oLink.text
					}));
					return;
				}
				// Check if a FactSheet exists for this SemanticObject (to skip the first one found)
				var oShellHash = oURLParsing.parseShellHash(oLink.intent);
				if (oShellHash.action && (oShellHash.action === 'displayFactSheet')) {
					// Prevent FactSheet from being listed in 'Related Apps' section. Requirement: Link with action 'displayFactSheet' should
					// be shown in the 'Main Link' Section
					that.setMainNavigation(new LinkData({
						href: oLink.intent,
						text: Library.getResourceBundleFor("sap.ui.comp").getText("POPOVER_FACTSHEET")
					}));
					return;
				}

				that.addAvailableAction(new LinkData({
					href: oLink.intent,
					text: oLink.text
				}));
			});

			that.fireTargetsObtained();
		});
		oPromise.fail(function() {
			// Reset actions
			Log.error("'retrieveNavTargets' failed");
		});
	};

	/**
	 * Displays the popover. This method should be called, once all navigation targets are adapted by the application.
	 *
	 * @public
	 */
	NavigationPopover.prototype.show = function(oDomRef) {
		var oControl = oDomRef || this._getControl();
		if (!oControl) {
			Log.error("no source assigned");
			return;
		}

		this.openBy(oControl);
	};

	/**
	 * Returns link for direct navigation if the NavigationPopover has only <code>mainNavigation</code> or
	 * one <code>availableAction</code> and no <code>extraContent</code>.
	 *
	 * @returns {sap.m.Link | null} Link for direct navigation
	 * @public
	 */
	NavigationPopover.prototype.getDirectLink = function() {
		if (this._bUseExternalContent) {
			return this.getContent()[0].getDirectLink();
		}
		var oModel = this._getInternalModel();

		// Extra content should be shown always, no direct navigation possible
		if (oModel.getProperty('/extraContent')) {
			return null;
		}

		// If only main navigation link exists, direct navigation is possible
		if (oModel.getProperty('/mainNavigationLink/href') && !oModel.getProperty('/availableActions').length) {
			return this._oHeaderArea.getItems()[0];
		}

		// If only one available action exists (independent whether it is visible or not), direct navigation is possible
		if (oModel.getProperty('/availableActions').length === 1 && !oModel.getProperty('/mainNavigationLink/href')) {
			return this._oActionArea.getItems()[0].getItems()[0];
		}
		return null;
	};

	/**
	 * @private
	 */
	NavigationPopover.prototype.hasContent = function() {
		if (this._bUseExternalContent) {
			return this.getContent()[0].hasContent();
		}
		var oModel = this._getInternalModel();
		return !!oModel.getProperty("/mainNavigationLink/href") || !!oModel.getProperty("/availableActions").length || !!oModel.getProperty('/extraContent');
	};

	// ----------------------- Overwrite Property Methods --------------------------

	NavigationPopover.prototype.setMainNavigationId = function(sMainNavigationId) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.setProperty("mainNavigationId", sMainNavigationId, true);
		var oModel = this._getInternalModel();
		if (typeof sMainNavigationId === "string") {
			oModel.setProperty("/mainNavigationLink/title", sMainNavigationId);
		}
		return this;
	};

	NavigationPopover.prototype.setAvailableActionsPersonalizationText = function(sAvailableActionsPersonalizationText) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.setProperty("availableActionsPersonalizationText", sAvailableActionsPersonalizationText, true);
		var oModel = this._getInternalModel();
		oModel.setProperty("/availableActionsPersonalizationText", sAvailableActionsPersonalizationText);
		return this;
	};

	// ----------------------- Overwrite Aggregation Methods --------------------------

	// ----------------------- Overwrite Association Methods --------------------------

	NavigationPopover.prototype.setExtraContent = function(oControl) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		var oModel = this._getInternalModel();
		if (oModel.getProperty("/extraContent")) {
			this._getContentContainer().removeItem(1);
		}
		// Note: 'extraContent' is an association of an control which is created by application in 'navigationTargetsObtained' event. Now we have to
		// add this control to the popover content aggregation. Doing so the NavigationPopover is responsible for life cycle of this control which
		// will be destroyed together with NavigationPopover.
		if (typeof oControl === "string") {
			oControl = Element.getElementById(oControl);
		}

		this._getContentContainer().insertItem(oControl, 1);

		this.setAssociation("extraContent", oControl);
		oModel.setProperty("/extraContent", oControl);
		return this;
	};

	NavigationPopover.prototype.setMainNavigation = function(oLinkData) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
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

	NavigationPopover.prototype.addAvailableAction = function(oLinkData) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.addAggregation("availableActions", oLinkData);
		if (!oLinkData) {
			return this;
		}

		oLinkData.setPress(this._onLinkPress.bind(this));

		var oModel = this._getInternalModel();
		oModel.setProperty("/availableActions/" + this.indexOfAvailableAction(oLinkData) + "/", oLinkData.getJson());
		return this;
	};

	NavigationPopover.prototype.insertAvailableAction = function(oLinkData, iIndex) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.insertAggregation("availableActions", oLinkData, iIndex);
		if (!oLinkData) {
			return this;
		}
		oLinkData.setPress(this._onLinkPress.bind(this));

		var oModel = this._getInternalModel();

		// reorder all availableActions after inserting one
		this.getAvailableActions().forEach(function(oAvailableAction, iAvailableActionIndex) {
			oModel.setProperty("/availableActions/" + iAvailableActionIndex + "/", oAvailableAction.getJson());
		});
		return this;
	};

	NavigationPopover.prototype.removeAvailableAction = function(oLinkData) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		var iIndex = this.indexOfAvailableAction(oLinkData);
		if (iIndex > -1) {
			// Remove item data from model
			var oModel = this._getInternalModel();
			oModel.getData().availableActions.splice(iIndex, 1);
			oModel.refresh(true);
		}
		oLinkData = this.removeAggregation("availableActions", oLinkData);
		return oLinkData;
	};

	NavigationPopover.prototype.removeAllAvailableActions = function() {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		var aAvailableActions = this.removeAllAggregation("availableActions");
		// Remove items data from model
		var oModel = this._getInternalModel();
		oModel.setProperty("/availableActions", []);
		oModel.refresh(true);
		return aAvailableActions;
	};

	NavigationPopover.prototype.onAfterRenderingActionForm = function() {
		var oModel = this._getInternalModel();
		var $ContentContainer = oModel.getProperty("/extraContent") ? oModel.getProperty("/extraContent").$()[0] : undefined;

		if ($ContentContainer && $ContentContainer.scrollHeight > $ContentContainer.clientHeight) {
			// Change the default behavior for the case that all three sections can not fit the height of phone (e.g. the additionalContentSection is
			// larger then the spared place
			this._getContentContainer().setFitContainer(false).setJustifyContent(FlexJustifyContent.Start);
		}
	};

	// -------------------------- Private Methods ------------------------------------

	/**
	 * @private
	 */
	NavigationPopover.prototype._createContent = function() {
		if (this._bUseExternalContent) {
			return;
		}
		var that = this;

		var oTitle = new Link({
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
			value: "/mainNavigationLink/internalHref"
		});
		oTitle.addCustomData(oCustomData);
		oTitle.addStyleClass("sapFontHeader5Size");

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

		this._oHeaderArea = new VBox({
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
		this._oHeaderArea.addStyleClass("navigationPopoverTitleH1");
		this._oHeaderArea.addStyleClass("navigationPopoverHeader");
		this._oHeaderArea.setModel(this._getInternalModel());

		this._oObserver = new ManagedObjectObserver(function(oChanges) {
			if (oChanges.type === "property" && oChanges.name === "visible") {
				var aMVisibleAvailableActions = this._getInternalModel().getProperty("/availableActions").filter(function(oMAvailableAction) {
					return oMAvailableAction.visible === true;
				});
				oSeparator.setVisible(aMVisibleAvailableActions.length > 0 || this._getInternalModel().getProperty("/enableAvailableActionsPersonalization"));
				this._oActionArea.setVisible(aMVisibleAvailableActions.length > 0);
			}
		}.bind(this));

		var oSeparator = new VBox();
		oSeparator.setModel(this._getInternalModel());
		oSeparator.addStyleClass("navigationPopoverSeparator");

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
		this._oActionArea.setModel(this._getInternalModel());

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
				text: {
					path: '/availableActionsPersonalizationText'
				},
				press: function() {
					that.fireAvailableActionsPersonalizationPress();
				}
			})
		});
		this._oPersonalizationButton.setModel(this._getInternalModel());
		this._oPersonalizationButton.addStyleClass("navigationPopoverPersonalizationButton");

		var oContent = new VBox({
			// Default behavior for the case that all three sections can fit the height of phone (e.g. only mainNavigationSection and
			// relatedAppsSection w/o additionalContentSection or mainNavigationSection, relatedAppsSection and small additionalContentSection)
			fitContainer: true,
			justifyContent: FlexJustifyContent.Start,
			items: [
				this._oHeaderArea
			]
		});
		if (this._getInternalModel().getProperty("/extraContent")) {
			oContent.addItem(this._getInternalModel().getProperty("/extraContent"));
		}
		oContent.addItem(oSeparator)
			.addItem(this._oActionArea)
			.addItem(this._oPersonalizationButton);

		this.addContent(oContent);
	};

	/**
	 * EventHandler for all link press on this popover
	 *
	 * @param {object} oEvent - the event parameters
	 * @private
	 */
	NavigationPopover.prototype._onLinkPress = function(oEvent) {
		this.fireNavigate({
			text: oEvent.getSource().getText(),
			href: oEvent.getSource().getHref(),
			internalHref: oEvent.getSource().data("internalHref")
		});
	};



	/**
	 * Returns the control instance for which the popover should be displayed.
	 *
	 * @returns { sap.ui.core.Control}
	 * @private
	 */
	NavigationPopover.prototype._getControl = function() {
		var oControl = this.getAssociation("source");
		if (typeof oControl === "string") {
			oControl = Element.getElementById(oControl);
		}
		return oControl;
	};

	/**
	 * Returns the component object.
	 *
	 * @returns {object} the component
	 * @private
	 */
	NavigationPopover.prototype._getComponent = function() {
		var oComponent = this.getComponent();
		if (typeof oComponent === "string") {
			oComponent = Component.getComponentById(oComponent);
		}
		return oComponent;
	};

	/**
	 * Returns the container (currently VBox) which contains the mainNavigationSection, additionalContentSection and relatedAppsSection.
	 * @private
	 */
	NavigationPopover.prototype._getContentContainer = function() {
		return this.getContent()[0];
	};

	NavigationPopover.prototype._getInternalModel = function() {
		return this.getModel("$sapuicompNavigationPopover");
	};

	return NavigationPopover;

});
