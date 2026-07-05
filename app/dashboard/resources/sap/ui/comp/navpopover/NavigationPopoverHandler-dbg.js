/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.NavigationPopoverHandler.
sap.ui.define([
	"sap/ui/core/Element",
	'sap/ui/core/Lib',
	'sap/ui/thirdparty/jquery',
	'sap/ui/comp/library',
	'sap/ui/base/ManagedObject',
	'./SemanticObjectController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/BindingMode',
	'sap/ui/core/Control',
	'./Factory',
	'./NavigationPopover',
	'./Util',
	'sap/m/VBox',
	'./LinkData',
	'sap/m/MessageBox',
	'sap/ui/comp/personalization/Controller',
	'sap/ui/comp/personalization/Util',
	'./NavigationContainer',
	'./ContactDetailsController',
	'./Log',
	'sap/ui/core/InvisibleText',
	'sap/ui/core/CustomData',
	'sap/base/Log',
	'sap/base/util/isPlainObject',
	'sap/ui/core/Component',
	"sap/base/util/merge",
	"sap/base/strings/whitespaceReplacer"
], function(Element, Library, jQuery, CompLibrary, ManagedObject, SemanticObjectController, JSONModel, BindingMode, Control, Factory, NavigationPopover, Util, VBox, LinkData, MessageBox, Controller, PersonalizationUtil, NavigationContainer, ContactDetailsController, Log, InvisibleText, CustomData, SapBaseLog, isPlainObject, Component, merge, whitespaceReplacer) {
	"use strict";

	/**
	 * Constructor for a new navpopover/NavigationPopoverHandler.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The NavigationPopoverHandler control determines navigation targets for a semantic object and shows them together with further information in a Popover.<br>
	 * <b>Note:</b> Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.
	 * @extends sap.ui.base.ManagedObject
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.navpopover.NavigationPopoverHandler
	 * @deprecated since 1.121 - SmartLink no longer uses the NavigationPopoverHandler, it got replaced by a sap.ui.mdc.Link implementation. All event handlings can be done directly on the SmartLink / SemanticObjectController.
	 */
	var NavigationPopoverHandler = ManagedObject.extend("sap.ui.comp.navpopover.NavigationPopoverHandler",
		/** @lends sap.ui.comp.navpopover.NavigationPopoverHandler.prototype */
		{
			metadata: {

				library: "sap.ui.comp",
				properties: {

					/**
					 * Name of semantic object which is used to determine target navigations.
					 *
					 * @since 1.36.0
					 */
					semanticObject: {
						type: "string",
						defaultValue: null
					},

					/**
					 * Names of additional semantic objects which are used to determine target navigations.
					 *
					 * @since 1.42.0
					 */
					additionalSemanticObjects: {
						type: "string[]",
						defaultValue: []
					},

					/**
					 * The semantic object controller controls events for several NavigationPopoverHandler controls. If the controller is not set
					 * manually, it tries to find a SemanticObjectController in its parent hierarchy.
					 *
					 * @since 1.36.0
					 */
					semanticObjectController: {
						type: "any",
						defaultValue: null
					},

					/**
					 * The metadata field name for this NavigationPopoverHandler control.
					 *
					 * @since 1.36.0
					 */
					fieldName: {
						type: "string",
						defaultValue: null
					},

					/**
					 * Shown title of semantic object.
					 *
					 * @deprecated As of version 1.40.0 Title section with <code>semanticObjectLabel</code> has been removed due to new UI design
					 * @since 1.36.0
					 */
					semanticObjectLabel: {
						type: "string",
						defaultValue: null
					},

					/**
					 * If set to <code>false</code>, the NavigationPopoverHandler control will not replace its field name with the according
					 * <code>semanticObject</code> property during the calculation of the semantic attributes. This enables the usage of several
					 * NavigationPopoverHandler on the same semantic object. *
					 *
					 * @since 1.36.0
					 */
					mapFieldToSemanticObject: {
						type: "boolean",
						defaultValue: true
					},

					/**
					 * Navigation property that points from the current to the related entity type where the com.sap.vocabularies.Communication.v1.Contact
					 * annotation is defined, for example, <code>'to_Supplier'</code>. An empty string means that the related entity type is the
					 * current one.
					 *
					 * @since 1.40.0
					 */
					contactAnnotationPath: {
						type: "string",
						defaultValue: undefined
					},

					/**
					 * Determines whether the personalization link is shown inside the NavigationPopover control.
					 *
					 * @since 1.44.0
					 */
					enableAvailableActionsPersonalization: {
						type: "boolean",
						defaultValue: true
					},
					/**
					 * Function that is called before the actual navigation happens. This function has to return a <code>Promise</code> resolving into a Boolean value for
					 *  which the navigation will wait. If the Boolean value is <code>true</code>, the navigation will be processed.
					 * The <code>beforeNavigationCallback(oNavigationInfo)</code> parameter contains the following data:
					 * <ul>
					 * 	<li>{String} text: Text of the navigation intent</li>
					 *	<li>{String} href: HREF of the navigation intent</li>
					 *	<li>{String} originalId: ID of the control that fires the navigation intent</li>
					 *	<li>{String} semanticObject: Name of the <code>SemanticObject</code> of the navigation intent</li>
					 *	<li>{Object} semanticAttributes: Object containing the <code>SemanticAttributes</code> of the navigation intent</li>
					 * </ul>
					 * @since 1.75.0
					 */
					beforeNavigationCallback: {
						type: "function"
					},
					/**
					 * Function that is called when the navigation targets provided by the SAP Fiori launchpad are obtained.
					 * The function is called with one <code>oNavigationTargets</code> parameter of type {@link sap.ui.comp.navpopover.NavigationTargets}.
					 * This function has to return a <code>Promise</code> resolving into an <code>Object</code> of type {@link sap.ui.comp.navpopover.NavigationTargets}.
					 * The provided <code>oNavigationTargets</code> can be manipulated in this callback before being returned to the <code>NavigationPopoverHandler</code>.
					 * The <code>Popover</code> will open after the <code>Promise</code> has been resolved.
					 * This function replaces the <code>navigationTargetsObtained</code> event. The event handling is ignored if this callback is set.
					 * @since 1.126
					 */
					navigationTargetsObtainedCallback: {
						type: "function"
					}
				},
				aggregations: {
					/**
					 * Stores the inner popover to influence design-time
					 */
					_popover : {
						type: "sap.ui.comp.navpopover.NavigationPopover",
						multiple: false,
						visibility: "hidden"
					}
				},
				associations: {
					/**
					 * The parent control.
					 *
					 * @since 1.36.0
					 */
					control: {
						type: "sap.ui.core.Control",
						multiple: false
					}
				},
				events: {

					/**
					 * Event is fired before the navigation popover opens and before navigation target links are getting retrieved. Event can be used to
					 * change the parameters used to retrieve the navigation targets. In case of NavigationPopoverHandler, the
					 * <code>beforePopoverOpens</code> is fired after the link has been clicked.
					 *
					 * @since 1.36.0
					 */
					beforePopoverOpens: {
						parameters: {
							/**
							 * The semantic object for which the navigation targets will be retrieved.
							 */
							semanticObject: {
								type: "string"
							},

							/**
							 * Map containing the semantic attributes calculated from the binding that will be used to retrieve the navigation targets.
							 *
							 * @deprecated Since 1.42.0. The parameter <code>semanticAttributes</code> is obsolete. Instead use the parameter
							 *             <code>semanticAttributesOfSemanticObjects</code>.
							 */
							semanticAttributes: {
								type: "object"
							},

							/**
							 * A map of semantic objects for which the navigation targets will be retrieved and it's semantic attributes calculated from
							 * the binding context. The semantic attributes will be used as parameters in order to retrieve the navigation targets.
							 *
							 * @since 1.42.0
							 */
							semanticAttributesOfSemanticObjects: {
								type: "object"
							},

							/**
							 * This callback function enables you to define a changed semantic attributes map. Signatures:
							 * <code>setSemanticAttributes(oSemanticAttributesMap)</code> Parameter:
							 * <ul>
							 * <li>{object} oSemanticAttributesMap New map containing the semantic attributes</li>
							 * <li>{string} sSemanticObject Semantic Object for which the oSemanticAttributesMap belongs</li>
							 * </ul>
							 */
							setSemanticAttributes: {
								type: "function"
							},

							/**
							 * This callback function sets an application state key that is used over the cross-application navigation. Signatures:
							 * <code>setAppStateKey(sAppStateKey)</code> Parameter:
							 * <ul>
							 * <li>{string} sAppStateKey</li>
							 * </ul>
							 */
							setAppStateKey: {
								type: "function"
							},

							/**
							 * The ID of the NavigationPopoverHandler.
							 */
							originalId: {
								type: "string"
							},

							/**
							 * This callback function triggers the retrieval of navigation targets and leads to the opening of the navigation popover.
							 * Signatures: <code>open()</code> If the <code>beforePopoverOpens</code> has been registered, the <code>open</code>
							 * function has to be called manually in order to open the navigation popover.
							 */
							open: {
								type: "function"
							}
						}
					},

					/**
					 * After the navigation targets are retrieved, <code>navigationTargetsObtained</code> is fired and provides the possibility to
					 * change the targets.
					 *
					 * @since 1.36.0
					 * @deprecated As of version 1.126, replaced by <code>navigationTargetsObtainedCallback</code> property.
					 */
					navigationTargetsObtained: {
						parameters: {
							/**
							 * The main navigation object.
							 */
							mainNavigation: {
								type: "sap.ui.comp.navpopover.LinkData"
							},

							/**
							 * Array of available navigation target objects.
							 */
							actions: {
								type: "sap.ui.comp.navpopover.LinkData[]"
							},

							/**
							 * The navigation object for the own application. This navigation option is by default not visible on the popover.
							 */
							ownNavigation: {
								type: "sap.ui.comp.navpopover.LinkData"
							},

							/**
							 * Array containing contact data.
							 */
							popoverForms: {
								type: "sap.ui.layout.form.SimpleForm[]"
							},

							/**
							 * The semantic object for which the navigation targets have been retrieved.
							 */
							semanticObject: {
								type: "string"
							},

							/**
							 * Map containing the semantic attributes.
							 */
							semanticAttributes: {
								type: "object"
							},

							/**
							 * The ID of the NavigationPopoverHandler.
							 */
							originalId: {
								type: "string"
							},

							/**
							 * This callback function shows the actual navigation popover. If the <code>navigationTargetsObtained</code> has been
							 * registered, the <code>show</code> function has to be called manually in order to open the navigation popover. Signatures:
							 * <code>show()</code>
							 * <ul>
							 * <li><code>show(oMainNavigation, aAvailableActions, oAdditionalContent)</code> Parameters:
							 * <ul>
							 * <li>{sap.ui.comp.navpopover.LinkData | null | undefined} oMainNavigation The main navigation object. With
							 * <code>null</code> the main navigation object will be removed. With <code>undefined</code> the old object will remain.</li>
							 * <li>{sap.ui.comp.navpopover.LinkData[] | [] | undefined} aAvailableActions Array containing the cross application
							 * navigation links. With empty array all available links will be removed. With <code>undefined</code> the old links will
							 * remain.</li>
							 * <li>{sap.ui.core.Control | null | undefined} oAdditionalContent Control that will be displayed in extra content section on
							 * the popover. With <code>null</code> the main extra content object will be removed. With <code>undefined</code> the old
							 * object still remains.</li>
							 * </ul>
							 * </li>
							 * <li><code>show(sMainNavigationId, oMainNavigation, aAvailableActions, oAdditionalContent)</code> Parameters:
							 * <ul>
							 * <li>{string | undefined} sMainNavigationId The visible description for the main navigation link. With <code>''</code>,
							 * both the description and subtitle will be removed. With <code>undefined</code>, the description is calculated using the
							 * binding context of a given source object (for example <code>SmartLink</code> control).</li>
							 * <li>{sap.ui.comp.navpopover.LinkData | null | undefined} oMainNavigation The main navigation object. With
							 * <code>null</code> the main navigation object will be removed. With <code>undefined</code> the old object will remain.</li>
							 * <li>{sap.ui.comp.navpopover.LinkData[] | [] | undefined} aAvailableActions Array containing the cross application
							 * navigation links. With empty array all available links will be removed. With <code>undefined</code> the old links will
							 * remain.</li>
							 * <li>{sap.ui.core.Control | null | undefined} oAdditionalContent Control that will be displayed in extra content section on
							 * the popover. With <code>null</code> the main extra content object will be removed. With <code>undefined</code> the old
							 * object still remains.</li>
							 * </ul>
							 * </li>
							 * </ul>
							 */
							show: {
								type: "function"
							}
						}
					},

					/**
					 * This event is fired after a navigation link on the navigation popover has been clicked. This event is only fired, if the user
					 * left-clicks the link. Right-clicking the link and selecting 'Open in New Window' etc. in the context menu does not fire the event.
					 *
					 * @since 1.36.0
					 */
					innerNavigate: {
						parameters: {
							/**
							 * The UI text shown in the clicked link.
							 */
							text: {
								type: "string"
							},

							/**
							 * The navigation target of the clicked link.
							 */
							href: {
								type: "string"
							},

							/**
							 * The semantic object used to retrieve this target.
							 */
							semanticObject: {
								type: "string"
							},

							/**
							 * Map containing the semantic attributes used to retrieve this target.
							 */
							semanticAttributes: {
								type: "object"
							},

							/**
							 * The ID of the NavigationPopoverHandler.
							 */
							originalId: {
								type: "string"
							}
						}
					}
				}
			}
		});

	NavigationPopoverHandler.prototype.init = function() {
		this._oPopover = null;
		this._oContactDetailsController = new ContactDetailsController();

		var oModel = new JSONModel({
			semanticObject: undefined,
			// Internal map containing the semantic attributes calculated from the binding that will be used
			// to retrieve the navigation targets.
			semanticAttributes: undefined,
			appStateKey: undefined,
			mainNavigationId: undefined,
			navigationTarget: {
				mainNavigation: undefined,
				enableAvailableActionsPersonalization: undefined,
				extraContent: undefined
			},
			// Store internally the available links returned from FLP and modified by application
			availableActions: []
		});
		oModel.setDefaultBindingMode(BindingMode.TwoWay);
		oModel.setSizeLimit(1000);
		this.setModel(oModel, "$sapuicompNavigationPopoverHandler");
		this._oRTANavigationHandling = {
			enabled: false,
			initialValue: undefined
		};

		this._oLog = SapBaseLog.getLevel() >= SapBaseLog.Level.INFO ? new Log() : undefined; //3
	};

	NavigationPopoverHandler.prototype.applySettings = function(mSettings) {
		ManagedObject.prototype.applySettings.apply(this, arguments);
		// Initialize 'semanticAttributes' after all properties in constructor have been set
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
	};

	// ----------------------- Public Methods --------------------------

	/**
	 * Opens the <code>sap.m.Popover</code> with navigation targets in an asynchronous manner.
	 *
	 * @param {object} oDomRef Optional DOM reference to which the popover is attached. By default
	 * the <code>control</code> association is used as DOM reference.
	 *
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	NavigationPopoverHandler.prototype.openPopover = function(oDomRef) {
		var that = this;
		return this._getPopover().then(function(oPopover) {

			// Popover with direct link should not be opened.
			var oLink = oPopover.getDirectLink();
			if (oLink) {
				that._fireInnerNavigate({
					text: oLink.getText(),
					href: oLink.getHref(),
					internalHref: oLink.data("internalHref")
				});
				// Destroy popover with StableID.
				that._destroyPopover();
				return;
			}
			oPopover.show(oDomRef);
		});
	};

	/**
	 * Gets the current value assigned to the field with the NavigationPopoverHandler's semantic object name.
	 *
	 * @returns {object} The semantic object's value.
	 * @public
	 */
	NavigationPopoverHandler.prototype.getSemanticObjectValue = function() {
		var oSemanticAttributes = this._getSemanticAttributes();
		if (oSemanticAttributes) {
			return oSemanticAttributes[this.getSemanticObject()][this.getSemanticObject()];
		}
		return undefined;
	};

	/**
	 * Gets the stable ID, if <code>semanticObject</code> property and component are set.
	 *
	 * @returns {string | undefined} Stable ID
	 * @private
	 */
	NavigationPopoverHandler.prototype.getNavigationPopoverStableId = function() {
		var oControl = Element.getElementById(this.getControl());
		if (!oControl) {
			SapBaseLog.error("NavigationPopoverHandler: Stable ID could not be determined because the control is undefined");
			return undefined;
		}
		var oAppComponent = this._getComponent(oControl);
		if (!oAppComponent) {
			SapBaseLog.error("NavigationPopoverHandler: Stable ID could not be determined because the app component is not defined for control '" + oControl.getId() + "'");
			return undefined;
		}

		var sSemanticObjectDefault = this.getModel("$sapuicompNavigationPopoverHandler").getProperty("/semanticObject");
		if (!sSemanticObjectDefault) {
			SapBaseLog.error("NavigationPopoverHandler: Stable ID could not be determined because no default semantic object is defined");
			return undefined;
		}
		var aSemanticObjects = [
			sSemanticObjectDefault
		].concat(this.getAdditionalSemanticObjects());
		Util.sortArrayAlphabetical(aSemanticObjects);
		var sSemanticObjects = aSemanticObjects.join("--");

		return oAppComponent.createId("sapuicompnavpopoverNavigationPopover---" + sSemanticObjects);
	};

	// ----------------------- Overwrite Methods --------------------------

	NavigationPopoverHandler.prototype.updateBindingContext = function() {
		var oBCOld = this.getBindingContext("$sapuicompNavigationPopoverHandler");
		Control.prototype.updateBindingContext.apply(this, arguments);
		var oBCNew = this.getBindingContext("$sapuicompNavigationPopoverHandler");

		// Update 'semanticAttributes' due to new 'semanticObject'
		if (oBCNew && oBCNew !== oBCOld) {
			this._setSemanticAttributes(this._calculateSemanticAttributes(null));
			this._destroyPopover();
		}
	};

	NavigationPopoverHandler.prototype.setSemanticObject = function(sSemanticObject) {

		this._destroyPopover();

		this.setProperty("semanticObject", sSemanticObject);
		this.getModel("$sapuicompNavigationPopoverHandler").setProperty("/semanticObject", sSemanticObject);

		// Update 'semanticAttributes' due to new 'semanticObject'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype._setSemanticAttributes = function(oSemanticAttributes) {
		this.getModel("$sapuicompNavigationPopoverHandler").setProperty("/semanticAttributes", oSemanticAttributes);
	};

	NavigationPopoverHandler.prototype._getSemanticAttributes = function() {
		return this.getModel("$sapuicompNavigationPopoverHandler").getProperty("/semanticAttributes");
	};

	NavigationPopoverHandler.prototype.setEnableAvailableActionsPersonalization = function(bEnableAvailableActionsPersonalization) {
		this.setProperty("enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization);
		this.getModel("$sapuicompNavigationPopoverHandler").setProperty("/navigationTarget/enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization);
		return this;
	};

	NavigationPopoverHandler.prototype.setFieldName = function(sFieldName) {
		this.setProperty("fieldName", sFieldName);

		// Update 'semanticAttributes' due to new 'fieldName'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));

		return this;
	};

	NavigationPopoverHandler.prototype.setControl = function(oControl) {
		this.setAssociation("control", oControl);

		this.setModel(oControl.getModel());

		// TODO: SmartTable -> ControlProvider for each ObjectIdentifier there is only one NavigationPopoverHandler which gets set a new 'control'
		this._destroyPopover();

		this._updateSemanticObjectController();

		// Update 'semanticAttributes' due to new 'control'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype.setMapFieldToSemanticObject = function(bMapFieldToSemanticObject) {
		this.setProperty("mapFieldToSemanticObject", bMapFieldToSemanticObject);

		// Update 'semanticAttributes' due to new 'mapFieldToSemanticObject'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype.setSemanticObjectController = function(oSemanticObjectController) {
		this._updateSemanticObjectController(oSemanticObjectController);

		// Update 'semanticAttributes' due to new 'semanticObjectController'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype.exit = function() {
		this._oContactDetailsController.destroy();
		this._destroyPopover();

		// Disconnect from SemanticObjectController
		if (this.getSemanticObjectController()) {
			this.getSemanticObjectController().unregisterControl(this);
		}

		// destroy model and its data
		if (this.getModel("$sapuicompNavigationPopoverHandler")) {
			this.getModel("$sapuicompNavigationPopoverHandler").destroy();
		}
		this._oRTANavigationHandling = undefined;
	};

	// -------------------------- Private Methods ------------------------------------

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._initModel = function() {
		var that = this;

		var oSemanticAttributes;
		var sSemanticObjectDefault = this.getSemanticObject();
		var aAdditionalSemanticObjects = this.getAdditionalSemanticObjects();

		var sContactAssociationPath = Util.getContactAnnotationPath(this, this.getSemanticObjectController());
		var oControl = Element.getElementById(this.getControl());
		if (!oControl) {
			SapBaseLog.error("sap.ui.comp.navpopover.NavigationPopoverHandler: No control provided, popover cannot be attached.");
		}
		var sBindingPath = oControl && oControl.getBindingContext() ? oControl.getBindingContext().getPath() : null;
		if (!sBindingPath) {
			SapBaseLog.warning("sap.ui.comp.navpopover.NavigationPopoverHandler: Binding Context is null. Please be aware that without binding context no semantic attributes can be calculated. Without semantic attributes no URL parameters can be created.");
		}
		var oODataModel = this.getModel();
		var oComponent = this._getComponent(oControl);

		var sId = oControl && oControl.getId();
		var sMainNavigationId, sSemanticObjectValue, aNavigationTargets;

		if (this._oLog) {
			this._oLog.reset();
		}

		// 0. Load depending library
		return Library.load({name: 'sap.ui.fl'}).then(function() {

			// 1. Read metadata in order to calculate the semanticAttributes
			return Util.retrieveSemanticObjectMapping(that.getFieldName(), oODataModel, sBindingPath);
		}).then(function(oSemanticObjects) {

			// Determine 'semanticAttributes' as it is the latest point in time before passing it to the applications
			that._setSemanticAttributes(that._calculateSemanticAttributes(oSemanticObjects, that._oLog));
			oSemanticAttributes = that._getSemanticAttributes();

			// 2. Fire 'beforePopoverOpens' event. Here 'semanticAttributes' can be changed and 'appStateKey' can be set by application.
			return that._fireBeforePopoverOpens(oSemanticAttributes, sSemanticObjectDefault, sId, that._oLog);
		}).then(function(oResultFromOpen) {

			oSemanticAttributes = oResultFromOpen.semanticAttributes;

			// Set the potentially modified semanticAttributes
			that._setSemanticAttributes(oSemanticAttributes);

			// Set depending on semanticAttributes 'sSemanticObjectValue'
			sSemanticObjectValue = that.getSemanticObjectValue();

			// Set depending on semanticAttributes 'sMainNavigationId'.
			// Note: if binding context does not contain attribute equals to semantic object (either because the mapping didn't taken place or
			// because no attribute equals to semantic object exists) we take the value of the field name. We do so in order to avoid standard text
			// 'Display Fact Sheet' and show instead of it the text of SmartLink which user can see.
			sMainNavigationId = (oControl && oControl._getTextOfDom && oControl._getTextOfDom()) || that.getSemanticObjectValue();

			that.getModel("$sapuicompNavigationPopoverHandler").setProperty("/appStateKey", oResultFromOpen.appStateKey);

			// 3. Retrieve navigationTargets from UShell service
			return Util.retrieveNavigationTargets(sSemanticObjectDefault, aAdditionalSemanticObjects, oResultFromOpen.appStateKey, oComponent, oSemanticAttributes, sMainNavigationId, that.getFieldName(), oODataModel, sBindingPath, that._oLog);
		}).then(function(aTargets) {

			aNavigationTargets = aTargets;

			// 4 Read OData Metadata with BindingContext
			that._oContactDetailsController.setModel(oODataModel);
			return that._oContactDetailsController.getBindingPath4ContactAnnotation(sBindingPath, sContactAssociationPath, sSemanticObjectValue);
		}).then(function(sBindingPathOfAnnotation) {

			var aForms = that._oContactDetailsController.getContactDetailsContainers(sBindingPathOfAnnotation);

			// 5. Fire 'navigationTargetsObtained' event. Here 'Form' and 'navigationTargets' can be changed by application.
			return that._fireNavigationTargetsObtained(sMainNavigationId, sSemanticObjectDefault, oSemanticAttributes, sId, aForms, aNavigationTargets, that._oLog);
		}).then(function(oResultFromNavigationObtained) {
			var aAvailableActions = oResultFromNavigationObtained.availableActions;
			var aConvertToExternalPromises = [];

			if (aAvailableActions) {
				aAvailableActions.forEach(function(oAvailableAction) {
					if (oAvailableAction.getText()) {
						oAvailableAction.setText(whitespaceReplacer(oAvailableAction.getText()));
					}
					if (oAvailableAction.getHref()) {
						oAvailableAction.setInternalHref(oAvailableAction.getHref());

						aConvertToExternalPromises.push(that._convertToExternal(oAvailableAction.getHref()).then(function(sConvertedHref) {
							oAvailableAction.setHref(sConvertedHref);
						}));
					}
				});
			}

			var oMainNavigation = oResultFromNavigationObtained.mainNavigation;

			if (oMainNavigation) {
				if (oMainNavigation.getDescription()) {
					oMainNavigation.setDescription(whitespaceReplacer(oMainNavigation.getDescription()));
				}
				if (oMainNavigation.getText()) {
					oMainNavigation.setText(whitespaceReplacer(oMainNavigation.getText()));
				}
				if (oMainNavigation.getHref()) {
					oMainNavigation.setInternalHref(oMainNavigation.getHref());
					aConvertToExternalPromises.push(that._convertToExternal(oMainNavigation.getHref()).then(function(sConvertedHref) {
						oMainNavigation.setHref(sConvertedHref);
					}));
				}
			}

			if (oResultFromNavigationObtained.mainNavigationId) {
				oResultFromNavigationObtained.mainNavigationId = whitespaceReplacer(oResultFromNavigationObtained.mainNavigationId);
			}

			return Promise.all(aConvertToExternalPromises).then(function() {
				var oModel = that.getModel("$sapuicompNavigationPopoverHandler");
				oModel.setProperty("/mainNavigationId", oResultFromNavigationObtained.mainNavigationId);
				oModel.setProperty("/navigationTarget/mainNavigation", oMainNavigation);
				oModel.setProperty("/navigationTarget/extraContent", oResultFromNavigationObtained.extraContent);
				oModel.setProperty("/availableActions", that._updateVisibilityOfAvailableActions(LinkData.convert2Json(aAvailableActions)));
				oModel.setProperty("/navigationTarget/enableAvailableActionsPersonalization", that._getEnableAvailableActionsPersonalization(oModel.getProperty("/availableActions")));

				if (SapBaseLog.getLevel() >= SapBaseLog.Level.TRACE) { //5
					SapBaseLog.info("sap.ui.comp.NavigationPopoverHandler: calculation of semantic attributes\n---------------------------------------------\nBelow you can see detailed information regarding semantic attributes which have been calculated for one or more semantic objects defined in a SmartLink control. Semantic attributes are used to create the URL parameters. Additionally you can see all links containing the URL parameters.\n" + that._getLogFormattedText());
				}
			});
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._initPopover = function() {
		var that = this;

		return this._initModel().then(function() {
			var oModel = that.getModel("$sapuicompNavigationPopoverHandler");

			var oPopover = that._createPopover();

			// JSONModel
			oPopover.setModel(oModel, "$sapuicompNavigationPopoverHandler");

			var oControl = Element.getElementById(that.getControl());
			if (oControl) {
				oControl.addDependent(oPopover);
			}

			return oPopover;
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._initNavigationContainer = function() {
		var that = this;

		return this._initModel().then(function() {
			var oModel = that.getModel("$sapuicompNavigationPopoverHandler");

			var oNavigationContainer = that._createNavigationContainer();

			// JSONModel
			oNavigationContainer.setModel(oModel, "$sapuicompNavigationPopoverHandler");

			var oControl = Element.getElementById(that.getControl());
			if (oControl) {
				oControl.addDependent(oNavigationContainer);
			}

			return oNavigationContainer;
		});
	};

	/**
	 * The NavigationPopoverHandler is responsible for destroying of NavigationPopover instance. This is done whenever the NavigationPopover is
	 * closed.
	 *
	 * @private
	 */
	NavigationPopoverHandler.prototype._getPopover = function() {
		if (!this._oPopover) {
			return this._initPopover();
		} else {
			return Promise.resolve(this._oPopover);
		}
	};

	/**
	 * The NavigationPopoverHandler can not be responsible for destroying of NavigationContainer instance. This should be done by requester.
	 *
	 * @private
	 */
	NavigationPopoverHandler.prototype._getNavigationContainer = function() {
		return this._initNavigationContainer().then(function(oNavigationContainer) {
			return oNavigationContainer;
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._destroyPopover = function() {
		if (this._oPopover) {
			this._oPopover.destroy();
			this._oPopover = null;
		}
	};

	/**
	 * Creates the <code>NavigationPopover</code>.
	 *
	 * @returns {sap.ui.comp.navpopover.NavigationPopover}
	 * @private
	 */
	NavigationPopoverHandler.prototype._createPopover = function() {
		if (this._oPopover) {
			return this._oPopover;
		}
		var oNavigationContainer = this._createNavigationContainer();

		// this._oTimestampStart = Date.now();

		this._oPopover = new NavigationPopover({
			customData: new CustomData({
				key: "useExternalContent"
			}),
			content: [
				oNavigationContainer
			],
			title: "{$sapuicompNavigationPopoverHandler>/mainNavigationId}", // Ignored when not on Phone
			source: this.getControl(),
			beforeClose: function() {
				this.removeAllContent().forEach(function(oControl) {
					oControl.destroy();
				});
			},
			afterClose: this._destroyPopover.bind(this),
			ariaLabelledBy: oNavigationContainer.getExtraContent() || oNavigationContainer._oHeaderArea.getItems()[0].getContent().getId()
		});


		this.setAggregation("_popover", this._oPopover);

		return this._oPopover;
	};

	/**
	 * Creates the NavigationContainer.
	 *
	 * @private
	 */
	NavigationPopoverHandler.prototype._createNavigationContainer = function() {

		var sStableId = this.getNavigationPopoverStableId();
		if (!sStableId) {
			SapBaseLog.error("NavigationPopoverHandler: Due to undefined stable ID the button of action personalization is set to disabled");
		}
		var oExistingNavigationContainer = Element.getElementById(sStableId);
		if (oExistingNavigationContainer) {
			if (oExistingNavigationContainer.getParent() &&
				oExistingNavigationContainer.getParent().getParent() &&
				oExistingNavigationContainer.getParent().getParent().isA("sap.ui.comp.navpopover.NavigationPopover")) {
				// There is already an open popover -> close and destroy navigationContainer to avoid duplicate ID
				oExistingNavigationContainer.getParent().getParent().close();
				if (!oExistingNavigationContainer.isDestroyed()) {
					oExistingNavigationContainer.destroy();
				}
			} else {
				SapBaseLog.error("Duplicate ID '" + sStableId + "'. The instance of NavigationContainer should be destroyed first in order to avoid duplicate creation of NavigationContainer with stable ID.");
				throw "Duplicate ID";
			}
		}

		var oModel = this.getModel("$sapuicompNavigationPopoverHandler");

		return new NavigationContainer(sStableId, {
			mainNavigationId: "{$sapuicompNavigationPopoverHandler>/mainNavigationId}",
			mainNavigation: oModel.getProperty("/navigationTarget/mainNavigation"),
			availableActions: {
				path: '$sapuicompNavigationPopoverHandler>/availableActions',
				templateShareable: false,
				template: new LinkData({
					key: "{$sapuicompNavigationPopoverHandler>key}",
					href: "{$sapuicompNavigationPopoverHandler>href}",
					internalHref: "{$sapuicompNavigationPopoverHandler>internalHref}",
					text: "{$sapuicompNavigationPopoverHandler>text}",
					target: "{$sapuicompNavigationPopoverHandler>target}",
					description: "{$sapuicompNavigationPopoverHandler>description}",
					visible: "{$sapuicompNavigationPopoverHandler>visible}"
				})
			},
			extraContent: oModel.getProperty("/navigationTarget/extraContent") ? oModel.getProperty("/navigationTarget/extraContent").getId() : undefined,
			component: this._getComponent(Element.getElementById(this.getControl())),
			enableAvailableActionsPersonalization: "{$sapuicompNavigationPopoverHandler>/navigationTarget/enableAvailableActionsPersonalization}",
			beforePopoverOpen: function() {
				// Note: in Key User Adaptation mode we do not open the navigation popover, the selection dialog is opened directly.
				if (this._oPopover) {
					this._oPopover.setModal(true);
				}
			}.bind(this),
			afterPopoverClose: function() {
				// Note: in the meantime the _oPopover could be closed outside of NavigationPopoverHandler, so we have to check if the instance still exists.
				if (this._oPopover) {
					this._oPopover.setModal(false);
				}
			}.bind(this),
			navigate: this._onNavigate.bind(this),
			control: this.getControl()
		});
	};

	/**
	 * @private
	 */
	 NavigationPopoverHandler.prototype._convertToExternal = function(sHref) {
		return Factory.getServiceAsync("Navigation").then(function(oNavigationService) {
			if (!oNavigationService) {
				return Promise.resolve(sHref);
			}
			return oNavigationService.getHref({
				target: {
					shellHash: sHref
				}
			}, this._getComponent());
		}.bind(this));
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._fireBeforePopoverOpens = function(oSemanticAttributes, sSemanticObjectDefault, sId, oLog) {
		var that = this;
		return new Promise(function(resolve) {
			var oResult = {
				semanticAttributes: oSemanticAttributes,
				appStateKey: undefined
			};
			if (!that.hasListeners("beforePopoverOpens")) {
				resolve(oResult);
				return;
			}

			var fnExistsSemanticAttributeForAnySemanticObject = function(oSemanticAttributes) {
				var aSemanticObjectsWithExistingSemanticAttributes = Object.keys(oSemanticAttributes).filter(function(sSemanticObject) {
					return !jQuery.isEmptyObject(oSemanticAttributes[sSemanticObject]);
				});
				return !!aSemanticObjectsWithExistingSemanticAttributes.length;
			};
			that.fireBeforePopoverOpens({
				originalId: sId,
				semanticObject: sSemanticObjectDefault,
				semanticAttributes: !jQuery.isEmptyObject(oSemanticAttributes[sSemanticObjectDefault]) ? oSemanticAttributes[sSemanticObjectDefault] : null,
				semanticAttributesOfSemanticObjects: fnExistsSemanticAttributeForAnySemanticObject(oSemanticAttributes) ? oSemanticAttributes : null,
				setSemanticAttributes: function(oSemanticAttributes, sSemanticObject) {
					sSemanticObject = sSemanticObject || sSemanticObjectDefault;
					oResult.semanticAttributes = oResult.semanticAttributes || {};

					if (oLog) {
						oLog.updateSemanticObjectAttributes(sSemanticObject, oResult.semanticAttributes[sSemanticObject], oSemanticAttributes);
					}

					oResult.semanticAttributes[sSemanticObject] = oSemanticAttributes;
				},
				setAppStateKey: function(sAppStateKey) {
					oResult.appStateKey = sAppStateKey;
				},
				open: function() {
					return resolve(oResult);
				}
			});
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._fireNavigationTargetsObtained = async function(sMainNavigationId, sSemanticObjectDefault, oSemanticAttributes, sId, aForms, oNavigationTargets, oLog) {
		var that = this;

		const fnApplyResults = (oResult, oResultsToApply) => {
			oResultsToApply ??= oResult;
			const sMainNavigationId = oResultsToApply.mainNavigationId;
			// Empty string '' is allowed
			if (sMainNavigationId !== undefined && sMainNavigationId !== null) {
				oResult.mainNavigationId = sMainNavigationId;
			}

			const oMainNavigation = oResultsToApply.mainNavigation;
			if (oMainNavigation !== undefined) {
				oResult.mainNavigation = oMainNavigation;

				if (oLog && oMainNavigation) {
					oLog.addIntent({
						text: oMainNavigation.getText(),
						intent: oMainNavigation.getHref()
					});
				}
			}

			const aAvailableActions = oResultsToApply.actions;
			if (aAvailableActions) {
				aAvailableActions.forEach(function(oAvailableAction) {
					// If 'key' is not provided by application, this link should be always shown in NavigationPopover (due to personalization
					// reasons - 1. the link can not be stored as change and therefore this link will not appear in selection dialog. 2. The
					// user is not able to set this link as visible in case that there are a lot of links and only 'Define Links' is
					// provided).
					if (oAvailableAction.getKey() === undefined) {
						SapBaseLog.error("'key' attribute of 'availableAction' '" + oAvailableAction.getText() + "' is undefined. Links without 'key' can not be persisted.");
						SapBaseLog.warning("The 'visible' attribute of 'availableAction' '" + oAvailableAction.getText() + "' is set to 'true'");
						oAvailableAction.setVisible(true);
					}
					if (oLog && oAvailableAction) {
						oLog.addIntent({
							text: oAvailableAction.getText(),
							intent: oAvailableAction.getHref()
						});
					}
				});
				oResult.availableActions = aAvailableActions;
			}

			const oAdditionalContent = oResultsToApply.extraContent;
			if (oAdditionalContent) {
				oResult.extraContent = oAdditionalContent;
			}

			return oResult;
		};

		const oResultParams = {
			mainNavigationId: sMainNavigationId,
			extraContent: aForms.length ? new VBox({
				items: aForms
			}) : undefined
		};

		const oNavigationTargetsObtainedParams = {
			mainNavigation: oNavigationTargets.mainNavigation,
			actions: oNavigationTargets.availableActions,
			ownNavigation: oNavigationTargets.ownNavigation,
			popoverForms: aForms,
			semanticObject: sSemanticObjectDefault,
			semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObjectDefault] : oSemanticAttributes,
			originalId: sId
		};

		const fnNavigationTargetsObtainedCallback = this.getNavigationTargetsObtainedCallback();
		if (fnNavigationTargetsObtainedCallback) {
			if (that.hasListeners("navigationTargetsObtained")) {
				that.fireNavigationTargetsObtained({
					...oNavigationTargetsObtainedParams,
					show: function() {
						SapBaseLog.warning(`sap.ui.comp.navpopover.NavigationPopoverHandler: "navigationTargetsObtained" event handling will be ignored as "navigationTargetsObtainedCallback" property is set.`);
					}
				});
			}
			const oCallbackObject = {
				...oNavigationTargetsObtainedParams,
				...oResultParams
			};
			const oResultFromCallback = await fnNavigationTargetsObtainedCallback(oCallbackObject);

			return fnApplyResults(oCallbackObject, oResultFromCallback);
		}

		return new Promise(function(resolve) {
			const oResultFromEvent = {
				...oNavigationTargets,
				...oResultParams
			};
			if (!that.hasListeners("navigationTargetsObtained")) {
				resolve(oResultFromEvent);
				return;
			}

			that.fireNavigationTargetsObtained({
				...oNavigationTargetsObtainedParams,
				show: function(sMainNavigationId, oMainNavigation, aAvailableActions, oAdditionalContent) {
					// Due to backward compatibility we have to support the use-case where only 3 parameters can be passed. The meaning for these
					// parameters is: [oMainNavigation, aAvailableActions, oAdditionalContent]
					if (arguments.length > 0 && !(typeof sMainNavigationId === "string" || oMainNavigation instanceof LinkData || Array.isArray(aAvailableActions)) && oAdditionalContent === undefined) {
						oAdditionalContent = aAvailableActions;
						aAvailableActions = oMainNavigation;
						oMainNavigation = sMainNavigationId;
						sMainNavigationId = undefined;
					}

					return resolve(fnApplyResults(oResultFromEvent, {
						mainNavigationId: sMainNavigationId,
						mainNavigation: oMainNavigation,
						actions: aAvailableActions,
						extraContent: oAdditionalContent
					}));
				}
			});
		});
	};

	/**
	 * Eventhandler for NavigationPopover's navigate event, exposes event
	 *
	 * @param {object} oEvent The event parameters
	 * @private
	 */
	NavigationPopoverHandler.prototype._onNavigate = function(oEvent) {
		var aParameters = oEvent.getParameters();
		this._fireInnerNavigate({
			text: aParameters.text,
			href: aParameters.href,
			internalHref: aParameters.internalHref
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._fireInnerNavigate = function(aParameters) {
		var oControl = Element.getElementById(this.getControl());
		var sSemanticObjectDefault = this.getSemanticObject();
		var oSemanticAttributes = this._getSemanticAttributes();
		if (this.getAdditionalSemanticObjects().length > 0) {
			var sAdditionalSemanticObject = this.getAdditionalSemanticObjects().find(function(sAdditionalSemanticObject) {
				return aParameters.href.includes(sAdditionalSemanticObject);
			});
			if (sAdditionalSemanticObject) {
				sSemanticObjectDefault = sAdditionalSemanticObject;
			}
		}
		var oNavigationInfo = {
			text: aParameters.text,
			href: aParameters.href,
			originalId: oControl ? oControl.getId() : undefined,
			semanticObject: sSemanticObjectDefault,
			semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObjectDefault] : oSemanticAttributes
		};

		if (this.getBeforeNavigationCallback()) {
			this.getBeforeNavigationCallback()(merge({}, oNavigationInfo)).then(function(bNavigate) {
				if (bNavigate === true) {
					// Add internalHref to navigationInfo as we need it in the event handling of the SemanticObjectController
					// but we don't want to expose it to the application in the beforeNavigationCallback
					oNavigationInfo.internalHref = aParameters.internalHref;
					this.fireInnerNavigate(oNavigationInfo);
					if (!this.getSemanticObjectController()) {
						Util.navigate(aParameters.internalHref);
					}
				}
			}.bind(this));
		} else {
			// Add internalHref to navigationInfo as we need it in the event handling of the SemanticObjectController
			// but we don't want to expose it to the application in the beforeNavigationCallback
			oNavigationInfo.internalHref = aParameters.internalHref;
			this.fireInnerNavigate(oNavigationInfo);
			if (!this.getSemanticObjectController()) {
				Util.navigate(aParameters.internalHref);
			}
		}
	};

	/**
	 * Finds the parental component.
	 *
	 * @private
	 * @returns {sap.ui.core.Component | undefined} the found component or undefined
	 */
	NavigationPopoverHandler.prototype._getComponent = function(oControl) {
		if (!oControl) {
			return null;
		}
		var oParent = oControl.getParent();
		while (oParent) {
			if (oParent instanceof Component) {
				// special case for SmartTemplating to reach the real appComponent
				if (oParent && oParent.getAppComponent) {
					oParent = oParent.getAppComponent();
				}
				return oParent;
			}
			oParent = oParent.getParent();
		}

		// If the Component is not reached via parent - child relationship, we try to get it via OwnerIdFor property
		return Component.getComponentById(Component.getOwnerIdFor(oControl));
	};

	NavigationPopoverHandler.prototype.getAppComponent = function() {
		return this._getComponent(Element.getElementById(this.getControl()));
	};

	NavigationPopoverHandler.prototype._getBindingContextObject = function() {
		var oControl = Element.getElementById(this.getControl());
		var oBindingContext = this.getBindingContext() || (oControl && oControl.getBindingContext());
		return oBindingContext ? oBindingContext.getObject(oBindingContext.getPath()) : null;
	};

	NavigationPopoverHandler.prototype._getLogFormattedText = function() {
		return this._oLog ? this._oLog.getFormattedText() : "No logging data available";
	};
	/**
	 * Gets the current binding context and creates a copied map where all empty and unnecessary data is deleted from.
	 *
	 * @param {object | null} oSemanticObjects Format: {/semanticObjectName/: {{/localProperty/: string},...}}
	 * @param {sap.ui.comp.navpopover.Log} oLog Log object
	 * @returns{object}
	 * @private
	 */
	NavigationPopoverHandler.prototype._calculateSemanticAttributes = function(oSemanticObjects, oLog) {
		var oContextObject = this._getBindingContextObject();

		var sCurrentField = this.getFieldName();
		var that = this;
		var aSemanticObjects = [
			"", this.getSemanticObject()
		].concat(this.getAdditionalSemanticObjects());
		var oResults = {};

		aSemanticObjects.forEach(function(sSemanticObject) {
			oResults[sSemanticObject] = {};
			var oMappingRules = that._getMappingRules(sSemanticObject, oSemanticObjects, oContextObject);

			for (var sAttributeName in oContextObject) {
				var oAttribute = null, oTransformationAdditional = null;
				if (oLog && sSemanticObject) {
					oAttribute = {
						transformations: []
					};
					oLog.addSemanticObjectAttribute(sSemanticObject, sAttributeName, oAttribute);
				}
				// Ignore undefined and null values
				if (oContextObject[sAttributeName] === undefined || oContextObject[sAttributeName] === null) {
					if (oAttribute) {
						oAttribute.transformations.push({
							value: oContextObject[sAttributeName],
							description: "\u2139 Undefined and null values have been removed in NavigationPopoverHandler."
						});
					}
					continue;
				}
				// Ignore plain objects (BCP 1770496639)
				if (isPlainObject(oContextObject[sAttributeName])) {
					if (oAttribute) {
						oAttribute.transformations.push({
							value: oContextObject[sAttributeName],
							description: "\u2139 Plain objects has been removed in NavigationPopoverHandler."
						});
					}
					continue;
				}

				var sAttributeNameMapped = oMappingRules[sAttributeName];

				if (oAttribute && sAttributeName !== sAttributeNameMapped) {
					oTransformationAdditional = oSemanticObjects ? {
						value: undefined,
						description: "\u2139 The attribute " + sAttributeName + " has been renamed to " + sAttributeNameMapped + " in NavigationPopoverHandler.",
						reason: "\ud83d\udd34 A com.sap.vocabularies.Common.v1.SemanticObjectMapping annotation is defined for semantic object " + sSemanticObject + " with source attribute " + sAttributeName + " and target attribute " + sAttributeNameMapped + ". You can modify the annotation if the mapping result is not what you expected."
					} : {
							value: undefined,
							description: "\u2139 The attribute " + sAttributeName + " has been renamed to " + sAttributeNameMapped + " in NavigationPopoverHandler.",
							reason: "\ud83d\udd34 The property mapFieldToSemanticObject is set to true. Attribute " + sAttributeName + " is mapped to " + sAttributeNameMapped + ". (semantic object is " + that.getSemanticObject() + ", field name is " + that.getFieldName() + "). If this is not what you expected, you can set the property to false or define a com.sap.vocabularies.Common.v1.SemanticObjectMapping annotation."
						};
				}

				// If more then one attribute field maps to the same semantic object we take the value of the current binding path.
				var oAttributeValue = oContextObject[sAttributeName];
				if (oResults[sSemanticObject][sAttributeNameMapped]) {
					if (oContextObject[sCurrentField]) {
						// Take over the value of current field in case of clash. If other field has clash we have no clue which value is the right one. So write error log.
						// Keep in mind: we do not explicitly check whether we are in the 'mapping' use-case when calling _mapFieldToSemanticObject because in not 'mapping'
						// use-case we do not come in the clash situation at all.
						if (sAttributeNameMapped === oMappingRules[that.getFieldName()]) {
							oAttributeValue = oContextObject[sCurrentField];
						} else {
							SapBaseLog.error("The attribute " + sAttributeName + " can not be renamed to the attribute " + sAttributeNameMapped + " due to a clash situation. This can lead to wrong navigation later on.");
						}
					}
				}

				// Copy the value replacing the attribute name by semantic object name
				oResults[sSemanticObject][sAttributeNameMapped] = oAttributeValue;

				if (oAttribute) {
					oAttribute.transformations.push({
						value: oContextObject[sAttributeName],
						description: "\u2139 The attribute " + sAttributeName + " with the value " + oContextObject[sAttributeName] + " is taken from the binding context in NavigationPopoverHandler."
					});
					if (oTransformationAdditional) {
						oAttribute.transformations.push(oTransformationAdditional);
						oLog.addSemanticObjectAttribute(sSemanticObject, sAttributeNameMapped, {
							transformations: [
								{
									value: oAttributeValue,
									description: "\u2139 The attribute " + sAttributeNameMapped + " with the value " + oAttributeValue + " has been added due to a mapping rule regarding the attribute " + sAttributeName + " in NavigationPopoverHandler."
								}
							]
						});
					}
				}
			}
		});

		return oResults;
	};

	NavigationPopoverHandler.prototype._getMappingRules = function(sSemanticObject, oSemanticObjects, oContextObject) {
		// Default value of mapFieldtoSemanticObject property can be overwritten by SemanticObjectController
		var bMapFieldToSemanticObject = this.getMapFieldToSemanticObject();
		if (this.getSemanticObjectController() && this.getSemanticObjectController().getMapFieldToSemanticObject() !== undefined) {
			bMapFieldToSemanticObject = this.getSemanticObjectController().getMapFieldToSemanticObject();
		}

		var sAttributeName;
		var oMappingRules = {};

		// Take over first the attributes for which mapping rules exist.
		// Priority: 1. mapping from SemanticObjectMapping annotation 2. mapFieldToSemanticObject
		if (oSemanticObjects) {
			for (sAttributeName in oSemanticObjects[sSemanticObject]) {
				if (typeof oSemanticObjects[sSemanticObject][sAttributeName] === "string") {
					oMappingRules[sAttributeName] = oSemanticObjects[sSemanticObject][sAttributeName];
				}
			}
		} else if (bMapFieldToSemanticObject) {
			if (this.getSemanticObjectController()) {
				var oMap = this.getSemanticObjectController().getFieldSemanticObjectMap();
				for (sAttributeName in oMap) {
					oMappingRules[sAttributeName] = oMap[sAttributeName];
				}
			}
			// For own field return the semantic object if exists
			// Note: if the field is assigned to another semantic object in 'SemanticObject' annotation than in the 'semanticObject' property then the
			// property 'semanticObject' is preferred.
			if (this.getFieldName() && this.getSemanticObject()) {
				oMappingRules[this.getFieldName()] = this.getSemanticObject();
			}
		}

		// Take over then the remaining attributes
		for (sAttributeName in oContextObject) {
			if (!oMappingRules.hasOwnProperty(sAttributeName)) {
				oMappingRules[sAttributeName] = sAttributeName;
			}
		}

		return oMappingRules;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._updateSemanticObjectController = function(oControllerNew) {
		// In case that 'semantiObjectController' has not been set, check if parent has a SemanticObjectController and take it as
		// 'semanticObjectController' property. This is especially needed when SmartLink is manually defined as column in view.xml and
		// SemanticObjectController is defined at the SmartTable. It is also needed in case of SmartField embedded into SmartForm which provides
		// 'semanticObjectController' aggregation.
		var oControllerOld = this.getProperty("semanticObjectController");
		var oControl = Element.getElementById(this.getControl());
		oControllerNew = oControllerNew || this.getSemanticObjectController() || this._getSemanticObjectControllerOfControl(oControl);

		if (oControllerNew && oControl && oControllerNew.isControlRegistered(oControl)) {
			oControllerNew.unregisterControl(this);
		}

		if (oControllerNew !== oControllerOld && oControllerOld) {
			oControllerOld.unregisterControl(this);
		}

		this.setProperty("semanticObjectController", oControllerNew);

		// Register NavigationPopoverHandler if the SmartLink was not registered. In case of ObjectIdentifier the 'control' property is set later on.
		// In this case the 'control' is of type ObjectIdentifier.
		if (oControllerNew && !oControllerNew.isControlRegistered(oControl)) {
			oControllerNew.registerControl(this);
		}
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._getSemanticObjectControllerOfControl = function(oControl) {
		if (!oControl) {
			return undefined;
		}
		var oSemanticObjectController;
		var oParent = oControl.getParent();
		while (oParent) {
			if (oParent.getSemanticObjectController) {
				oSemanticObjectController = oParent.getSemanticObjectController();
				if (oSemanticObjectController) {
					this.setSemanticObjectController(oSemanticObjectController);
					break;
				}
			}
			oParent = oParent.getParent();
		}
		return oSemanticObjectController;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._updateVisibilityOfAvailableActions = function(aMAvailableActions) {
		var bEnableAvailableActionsPersonalization = this._oRTANavigationHandling.initialValue === undefined ? this._getEnableAvailableActionsPersonalization(aMAvailableActions) : this._oRTANavigationHandling.initialValue;
		if (!bEnableAvailableActionsPersonalization) {
			return aMAvailableActions;
		}

		// Update the 'visible' attribute only for valid (i.g. storable links with filled 'key') availableActions.
		var aMValidAvailableActions = Util.getStorableAvailableActions(aMAvailableActions);
		var bHasSuperiorAction = aMValidAvailableActions.some(function(oMAvailableAction) {
			return !!oMAvailableAction.isSuperiorAction;
		});
		aMValidAvailableActions.forEach(function(oMAvailableAction) {
			// Do not show links as 'Related Apps' in case of many links. Exception: the links without 'key' which should be shown always.
			if (aMAvailableActions.length > 10) {
				oMAvailableAction.visible = false;
			}
			// If at least one superiorAction exists, do not show other links
			if (bHasSuperiorAction) {
				oMAvailableAction.visible = false;
			}
			// Show always superiorAction
			if (oMAvailableAction.isSuperiorAction) {
				oMAvailableAction.visible = true;
			}
		});

		if (aMAvailableActions.every(function(oMAvailableAction) { return !oMAvailableAction.visible; })) {
			if (aMAvailableActions[0]) { aMAvailableActions[0].visible = true; }
			if (aMAvailableActions[1]) { aMAvailableActions[1].visible = true; }
			if (aMAvailableActions[2]) { aMAvailableActions[2].visible = true; }
		}

		return aMAvailableActions;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._getEnableAvailableActionsPersonalization = function(aMAvailableActions) {

		// Do not show any text if there are no valid (i.g. storable links with filled 'key') available actions
		var aMValidAvailableActions = Util.getStorableAvailableActions(aMAvailableActions);
		if (aMValidAvailableActions.length === 0) {
			return false;
		}

		// Default: value of 'enableAvailableActionsPersonalization' property
		var bEnableAvailableActionsPersonalization = this.getEnableAvailableActionsPersonalization();
		// SemanticObjectController can overwrite value of 'enableAvailableActionsPersonalization' property
		if (this.getSemanticObjectController() && this.getSemanticObjectController().getEnableAvailableActionsPersonalization() && this.getSemanticObjectController().getEnableAvailableActionsPersonalization()[this.getFieldName()] !== undefined) {
			bEnableAvailableActionsPersonalization = this.getSemanticObjectController().getEnableAvailableActionsPersonalization()[this.getFieldName()];
		}
		return bEnableAvailableActionsPersonalization;
	};

	return NavigationPopoverHandler;

});
