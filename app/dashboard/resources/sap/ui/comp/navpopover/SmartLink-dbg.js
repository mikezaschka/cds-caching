/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.SmartLink.
sap.ui.define([
	'./SmartLinkFieldInfo',
	'./SemanticObjectController',
	'sap/base/Log',
	'sap/ui/comp/navpopover/SmartLinkDelegate',
	'./SmartLinkRenderer',
	'sap/ui/model/json/JSONModel',
	'sap/ui/comp/navpopover/Util',
	'sap/m/Link',
	'sap/m/library'
], function (SmartLinkFieldInfo, SemanticObjectController, Log, SmartLinkDelegate, SmartLinkRenderer, JSONModel, Util, MLink, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.EmptyIndicator
	var EmptyIndicatorMode = mobileLibrary.EmptyIndicatorMode;

	/**
	 * Object holding the information regarding the obtained navigation targets and extra content.
	 * This is used as parameter and return value of the <code>Promise</code> in the <code>navigationTargetsObtainedCallback</code>.
	 * @typedef {object} sap.ui.comp.navpopover.NavigationTargets
	 * @property {string} mainNavigationId The text of the main link / text that is displayed in the header of the popover.
	 * @property {sap.ui.comp.navpopover.LinkData} mainNavigation The main navigation object
	 * @property {sap.ui.comp.navpopover.LinkData[]} actions Array of available navigation target objects
	 * @property {sap.ui.comp.navpopover.LinkData} ownNavigation The navigation object for the own application. This navigation option is not visible on the popover by default.
	 * @property {sap.ui.layout.form.SimpleForm[]} popoverForms Array containing contact data. Manipulating this property won't have an effect, it's only relevant to be streamlined
	 * with the old API. The <code>extraContent</code> property is used to return the intended content.
	 * @property {String} semanticObject The semantic object for which the navigation targets have been retrieved
	 * @property {object} semanticAttributes Map containing the semantic attributes
	 * @property {String} originalId The ID of the <code>SmartLink</code> or other parent control
	 * @property {sap.ui.core.Control | null | undefined} extraContent The control that is displayed in the extra content section on the popover.
	 * If set to <code>null</code>, the extra content is removed.
	 * If set to <code>undefined</code>, a {@link sap.m.VBox} containing the <code>popoverForms</code> as items is used as extra content. The <code>popoverForms</code> can be empty.
	 * @public
	 */

	/**
	 * @class
	 * The <code>SmartLink</code> control uses a semantic object to display {@link sap.ui.comp.navpopover.NavigationPopover NavigationPopover}
	 * for further navigation steps.<br>
	 * <b>Note:</b> Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.
	 *
	 * <b>Important:</b> Keep in mind that <code>SmartLink</code>, like all SAPUI5 smart controls, retrieves and analyzes
	 * the metadata and annotations of OData services. <b>The OData metadata is its primary API. These OData services
	 * are not part of the SAPUI5 framework and are usually maintained by the backend developers of your application.</b>
	 *
	 * With time, <code>SmartLink</code> can evolve and acquire new features. This means that its behavior or functionalities
	 * may change if the annotations that define this change are maintained in your backend metadata. To benefit from the new
	 * functionalities, your application should be able to adapt the backend metadata. <b>Therefore, we recommend
	 * using <code>SmartLink</code> only if you have control over the metadata of your application.</b>
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control

	 * @extends sap.m.Link
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.navpopover.SmartLink
	 * @see {@link topic:f638884d0d624ad8a243f4005f8e9972 Smart Link}
	 */
	var SmartLink = MLink.extend("sap.ui.comp.navpopover.SmartLink", /** @lends sap.ui.comp.navpopover.SmartLink.prototype */
		{
			metadata: {
				library: "sap.ui.comp",
				designtime: "sap/ui/comp/designtime/navpopover/SmartLink.designtime",
				properties: {
					/**
					 * Name of semantic object which is used to fill the navigation popover. <b>Note</b>: Setting a value triggers an asynchronous
					 * determination, so the effect can be delayed.
					 *
					 * @since 1.28.0
					 */
					semanticObject: {
						type: "string",
						defaultValue: null
					},

					/**
					 * Semantic object names which can be used additional to the default <code>semanticObject</code> property in order to get navigation
					 * targets links.
					 *
					 * @since 1.42.0
					 */
					additionalSemanticObjects: {
						type: "string[]",
						defaultValue: []
					},

					/**
					 * The semantic object controller controls events for several SmartLink controls. If the controller is not set manually, it tries to
					 * find a SemanticObjectController in its parent hierarchy.
					 *
					 * @since 1.28.0
					 */
					semanticObjectController: {
						type: "any",
						defaultValue: null
					},

					/**
					 * The metadata field name for this SmartLink control.
					 *
					 * @since 1.28.0
					 */
					fieldName: {
						type: "string",
						defaultValue: null
					},

					/**
					 * Shown label of semantic object.
					 *
					 * @deprecated As of version 1.40.0 Title section with <code>semanticObjectLabel</code> has been removed due to new UI design
					 * @since 1.28.0
					 */
					semanticObjectLabel: {
						type: "string",
						defaultValue: null
					},

					/**
					 * Function that enables the SmartLink control to create an alternative control, which is displayed if <code>ignoreLinkRendering</code>
					 * is enabled. The function has no parameters and has to return an instance of sap.ui.core.Control.
					 *
					 * @since 1.28.0
					 */
					createControlCallback: {
						type: "function",
						defaultValue: null
					},

					/**
					 * If set to <code>false</code>, the SmartLink control will not replace its field name with the according
					 * <code>semanticObject</code> property during the calculation of the semantic attributes. This enables the usage of several
					 * SmartLink controls on the same semantic object.
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
					 * If set to <code>true</code>, the SmartLink control will render the <code>innerControl</code> or the control provided by
					 * <code>createControlCallback</code> instead of the actual link. This is used for example by the SemanticObjectController if this
					 * SmartLink is listed in its <code>ignoredFields</code> or no navigation targets were found during prefetch.
					 *
					 * @since 1.28.0
					 */
					ignoreLinkRendering: {
						type: "boolean",
						defaultValue: false
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
					 * If set to true, the <code>SmartLink</code> control is rendered as a link even if <code>contactAnnotationPath</code> is not set  and navigation targets do not exist.
					 * Setting this property to <code>true</code> allows the application, for example, to modify the <code>SmartLink</code> control in the event handler, after the user
					 * has clicked on a link and the registered event handler has been called.
					 *
					 * <b>Note:</b> The <code>ignoreLinkRendering</code> property and the <code>ignoredFields</code> property of the associated <code>SemanticObjectController</code>
					 * take precedence over <code>forceLinkRendering</code>.
					 *
					 * @since 1.58.0
					 */
					forceLinkRendering: {
						type: "boolean",
						defaultValue: false
					},

					/**
					 * Additionally to the <code>text</code> property the Unit of Measure can be displayed.
					 *
					 * @since 1.48.0
					 */
					uom: {
						type: "string",
						defaultValue: undefined
					},
					/**
					 * Function that is called before the actual navigation happens. This function has to return a promise resolving into a Boolean value for
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
					 * Determines whether the link can be triggered by the user.
					 */
					enabled: {
						type: "boolean",
						group: "Behavior",
						defaultValue: true
					},

					/**
					 * Determines whether the link text is allowed to wrap when there is no sufficient space.
					 */
					wrapping: {
						type: "boolean",
						group: "Appearance",
						defaultValue: false
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
					 * Control that is displayed instead of SmartLink control, if the SmartLink is disabled (for example, if no navigation targets are
					 * available). If <code>innerControl</code> is not provided, the SmartLink control tries to create one with property
					 * <code>createControlCallback</code>.
					 *
					 * @since 1.28.0
					 */
					innerControl: {
						type: "sap.ui.core.Control",
						multiple: false
					}
				},
				events: {

					/**
					 * Event is fired before the navigation popover opens and before navigation target links are getting retrieved. Event can be used to
					 * change the parameters used to retrieve the navigation targets. In case of SmartLink control, the <code>beforePopoverOpens</code>
					 * is fired after the link has been clicked.
					 *
					 * @since 1.28.0
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
							 * The ID of the SmartLink control.
							 */
							originalId: {
								type: "string"
							},

							/**
							 * This callback function triggers the retrieval of navigation targets and leads to the opening of the navigation popover.
							 * Signatures: <code>open()</code> If the <code>beforePopoverOpens</code> has been registered, the <code>open</code>
							 * function has to be called manually in order to open the navigation popover or trigger a direct navigation.
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
					 * @since 1.28.0
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
							 * The ID of the SmartLink control.
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
					 * @since 1.28.0
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
							 * The ID of the SmartLink control.
							 */
							originalId: {
								type: "string"
							}
						}
					}
				}
			},
			renderer: SmartLinkRenderer
		});

	// ----------------------- Overwrite Methods --------------------------

	SmartLink.prototype.init = function () {
		// In order to consume available semanticObjects from FLP we have to instantiate SemanticObjectController object
		SemanticObjectController.prefetchDistinctSemanticObjects();
		this._bIsTriggerable = false;

		const oModel = new JSONModel({
			mainNavigationLink: {
				title: undefined,
				subtitle: undefined,
				href: undefined,
				internalHref: undefined,
				target: undefined
			},
			// mainNavigationId: null,
			semanticAttributes: null,
			appStateKey: null,
			extraContent: undefined
		});
		this.setModel(oModel, "$sapuicompSmartLink");
		this.attachPress(this._onLinkPressed, this);
		this.addStyleClass("sapUiCompSmartLink");
		// call setter for text to determine if link is visible or not
		this.setText(this.getText());

		MLink.prototype.init.apply(this, arguments);
	};

	SmartLink.prototype.applySettings = function (mSettings) {
		MLink.prototype.applySettings.apply(this, arguments);
		this.addDependent(this.getFieldInfo());
	};

	SmartLink.prototype.exit = function () {
		// Disconnect from SemanticObjectController
		if (this.getSemanticObjectController()) {
			this.getSemanticObjectController().unregisterControl(this);
		}
	};

	SmartLink.prototype.clone = function () {
		let oFieldInfo = this._getFieldInfo();
		if (oFieldInfo) {
			oFieldInfo.detachEvent("dataUpdate", this._handleInfoDataUpdate.bind(this));
		}

		const oClone = MLink.prototype.clone.apply(this, arguments);

		oFieldInfo = this._getFieldInfo(oClone);
		if (oFieldInfo) {
			oClone._applyFieldInfoHandling(oFieldInfo);
		}

		if (this._bIsTriggerable) {
			oClone._bIsTriggerable = this._bIsTriggerable;
		}

		return oClone;
	};

	SmartLink.prototype.setText = function (sText) {
		if (this._isRenderingInnerControl()) {
			this.setProperty("text", sText, true);
		} else {
			MLink.prototype.setText.call(this, sText);
		}
		return this;
	};

	SmartLink.prototype.onBeforeRendering = function () {
		MLink.prototype.onBeforeRendering.apply(this, arguments);

		// In case that 'semantiObjectController' has not been set, check if parent has a SemanticObjectController and take it as
		// 'semanticObjectController' property. This is especially needed when SmartLink is manually defined as column in view.xml and
		// SemanticObjectController is defined at the SmartTable. It is also needed in case of SmartField embedded into SmartForm which provides
		// 'semanticObjectController' aggregation.
		if (!this.getSemanticObjectController()) {
			var oSOC = this._getSemanticObjectControllerOfParent();
			if (oSOC) {
				this.setSemanticObjectController(oSOC);
			}
		}
	};

	SmartLink.prototype.onAfterRendering = function () {
		MLink.prototype.onAfterRendering.apply(this, arguments);
		const oDomRef = this.getDomRef();
		// set aria-hidden to true when there is no text and no empty indicator
		if (!this.getText() && this.getEmptyIndicatorMode() === EmptyIndicatorMode.Off) {
			oDomRef.setAttribute("aria-hidden", true);
		} else if (oDomRef.getAttribute("aria-hidden")) {
			oDomRef.removeAttribute("aria-hidden");
		}
	};

	SmartLink.prototype.getAccessibilityInfo = function () {
		// BCP 1880542324
		const oAccessibilityInfo = this.getEnabled() ? MLink.prototype.getAccessibilityInfo.apply(this, arguments) : {
			description: this.getText() || this.getHref() || ""
		};

		if (oAccessibilityInfo.description === undefined) {
			oAccessibilityInfo.description = "";
		}

		if (this.getUom() && oAccessibilityInfo.description && oAccessibilityInfo.description !== "" && !oAccessibilityInfo.description.includes(this.getUom())) {
			oAccessibilityInfo.description += this.getUom();
		}

		return oAccessibilityInfo;
	};

	SmartLink.prototype.setSemanticObjectController = function (oControllerNew) {
		if (oControllerNew && !(oControllerNew.isA("sap.ui.comp.navpopover.SemanticObjectController"))) {
			Log.warning("Warning: setSemanticObjectController() has to be an object of sap.ui.comp.navpopover.SemanticObjectController instances", this);
			return this;
		}
		var oControllerOld = this.getProperty("semanticObjectController");

		if (oControllerOld === oControllerNew) {
			return this;
		}
		if (oControllerOld) {
			oControllerOld.unregisterControl(this);
		}
		this.setProperty("semanticObjectController", oControllerNew, true);
		if (oControllerNew) {
			if (oControllerNew.getReplaceSmartLinkNavigationTargetsObtained()) {
				if (this.hasListeners("navigationTargetsObtained") && oControllerNew.hasListeners("navigationTargetsObtained")) {
					this.mEventRegistry.navigationTargetsObtained.forEach(function (oNavigationTargetsObtainedListener) {
						this.detachNavigationTargetsObtained(oNavigationTargetsObtainedListener.fFunction);
					}.bind(this));
				}
				this.setNavigationTargetsObtainedCallback(oControllerNew.getNavigationTargetsObtainedCallback());
			}
			oControllerNew.registerControl(this);
			if (!this.getBeforeNavigationCallback()) {
				this.setBeforeNavigationCallback(oControllerNew.getBeforeNavigationCallback());
			}
		}

		this._determineEnabled();
		return this;
	};

	SmartLink.prototype.setSemanticObject = function (sSemanticObject) {
		this.setProperty("semanticObject", sSemanticObject);
		this._determineEnabled();
		return this;
	};

	SmartLink.prototype.setAdditionalSemanticObjects = function (aSemanticObjects) {
		this.setProperty("additionalSemanticObjects", aSemanticObjects);
		this._determineEnabled();
		return this;
	};

	SmartLink.prototype.setContactAnnotationPath = function (sContactAnnotationPath) {
		this.setProperty("contactAnnotationPath", sContactAnnotationPath);
		this._determineEnabled();
		return this;
	};

	SmartLink.prototype.setIgnoreLinkRendering = function (bIgnoreLinkRendering) {
		this.setProperty("ignoreLinkRendering", bIgnoreLinkRendering);

		// If link should not be rendered, but no inner control is available, deactivate SmartLink
		// ER: also if the inner control is available e.g. sap.m.Text, we have to deactivate SmartLink. Otherwise the sap.m.Text becomes capability to
		// be clicked.
		this._determineEnabled();
		return this;
	};

	SmartLink.prototype.setFieldName = function (sFieldName) {
		this.setProperty("fieldName", sFieldName);
		this._determineEnabled();
		return this;
	};

	// ----------------------- Public Methods --------------------------

	/**
	 * Gets the value of the <code>innerControl</code> aggregate if available, otherwise the text of SmartLink control will be returned.
	 *
	 * @returns {object} The value of <code>innerControl</code> aggregate or the text of the SmartLink
	 * @public
	 */
	SmartLink.prototype.getInnerControlValue = function () {
		if (this._isRenderingInnerControl()) {
			var oInnerControl = this._getInnerControl();

			if (oInnerControl) {
				if (oInnerControl.getText) {
					return oInnerControl.getText();
				}

				if (oInnerControl.getValue) {
					return oInnerControl.getValue();
				}
			}
		}

		return this.getText();
	};

	/**
	 * Gets the composition NavigationPopoverHandler
	 *
	 * @throws Method is deprecated
	 * @private
	 * @ui5-restricted
	 * @deprecated since version 1.122. The SmartLink does not use the NavigationPopoverHandler anymore due to deprecation.
	 */
	SmartLink.prototype.getNavigationPopoverHandler = function () {
		throw new Error("Function is depracted due to missing NavigationPopoverHandler " + this);
	};

	/**
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @returns {sap.ui.comp.navpopover.SmartLinkFieldInfo} Inner FieldInfo
	 */
	SmartLink.prototype.getFieldInfo = function () {
		let oFieldInfo = this._getFieldInfo();
		if (!oFieldInfo) {
			const sParentId = this.getId();

			oFieldInfo = new SmartLinkFieldInfo(sParentId + "-nsl", {
				sourceControl: sParentId
			});

			this._applyFieldInfoHandling(oFieldInfo);
		}

		return oFieldInfo;
	};

	/**
	 * @public
	 * @ui5-restricted sap.ui.comp
	 * @returns {sap.ui.core.Control[]} extra content
	 */
	SmartLink.prototype.getExtraContent = function () {
		const oModel = this._getInternalModel();
		return oModel.getProperty("/extraContent");
	};

	/**
	 * @public
	 * @ui5-restricted sap.ui.comp
	 * @returns {sap.ui.comp.navpopover.LinkData} the mainNavigationLink
	 */
	SmartLink.prototype.getMainNavigation = function () {
		const oModel = this._getInternalModel();
		return oModel.getProperty("/mainNavigationLink");
	};

	/**
	 * @public
	 * @ui5-restricted sap.ui.comp
	 * @returns {string} mainNavigationId
	 */
	SmartLink.prototype.getMainNavigationId = function () {
		const oModel = this._getInternalModel();
		return oModel.getProperty("/mainNavigationId");
	};

	// -------------------------- Private Methods ------------------------------------

	SmartLink.prototype._getFieldInfo = function (oControl) {
		if (!oControl) {
			oControl = this;
		}
		return oControl.getDependents().find((oDependent) => {
			return oDependent.isA("sap.ui.comp.navpopover.SmartLinkFieldInfo");
		});
	};

	SmartLink.prototype._applyFieldInfoHandling = function (oFieldInfo) {
		this.attachEvent("modelContextChange", this._handleModelContextChange);
		oFieldInfo.attachEvent("dataUpdate", this._handleInfoDataUpdate.bind(this));
	};

	SmartLink.prototype._handlePress = function (oEvent) {
		// In case of UOM wthe target property of the event is a span element inside the SmartLink.
		// Therefore setting it manually to SmartLinks DomRef / parentElement of the target.
		if (this.getUom() && oEvent.target.localName === "span") {
			var oTarget = this.getDomRef() ? this.getDomRef() : oEvent.target.parentElement;
			oEvent.target = oTarget;
		}
		MLink.prototype._handlePress.apply(this, arguments);
	};

	SmartLink.prototype.onsapenter = SmartLink.prototype._handlePress;
	SmartLink.prototype.onclick = SmartLink.prototype._handlePress;

	SmartLink.prototype._handleModelContextChange = function () {
		this.getFieldInfo().fireDataUpdate();
	};

	SmartLink.prototype._handleInfoDataUpdate = async function () {
		await this._updateEnabled();
	};

	SmartLink.prototype._getTextOfDom = function () {
		if (!this.getDomRef()) {
			return "";
		}
		if (this.$().find("span").length === 2) {
			return this.$().find("span")[0].textContent + this.$().find("span")[1].textContent;
		} else {
			return this.$()[0].textContent;
		}
	};

	SmartLink.prototype._getEnabled = function () {
		return this.getEnabled() && this._bIsTriggerable;
	};

	/**
	 * @param {sap.ui.base.Event} oEvent Instance of the <code>Event</code> element for pressing the <code>Link</code> control
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._onLinkPressed = function (oEvent) {
		this.getFieldInfo().open(this, oEvent);
	};

	/**
	 * @param {object} oParameters Contains information for the <code>navigationTargetsObtained</code> event
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._onNavigationTargetsObtained = function (oParameters) {
		if (!this.hasListeners("navigationTargetsObtained")) {
			oParameters.show();
			return;
		}
		this.fireNavigationTargetsObtained(oParameters);
	};

	/**
	 * @param {object} oParameters Contains information for the <code>beforePopoverOpens</code> event
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._onBeforePopoverOpens = function (oParameters) {
		if (!this.hasListeners("beforePopoverOpens")) {
			oParameters.open();
			return;
		}
		this.fireBeforePopoverOpens(oParameters);
	};

	/**
	 * @returns {boolean} Indicates whether the <code>innerControl<code> aggregation is being rendered
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._isRenderingInnerControl = function () {
		return this.getIgnoreLinkRendering() && this._getInnerControl() !== null;
	};

	/**
	 * Gets the value of the <code>innerControl<code> aggregation which is provided by the CreateControlCallback.
	 *
	 * @returns {sap.ui.core.Control} The control provided for the <code>innerControl<code> aggregation.
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._getInnerControl = function () {
		var oInnerControl = this.getAggregation("innerControl");
		if (oInnerControl) {
			return oInnerControl;
		}

		var fCreate = this.getCreateControlCallback();
		if (fCreate) {
			oInnerControl = fCreate();
			this.setAggregation("innerControl", oInnerControl, true);
			return oInnerControl;
		}

		return null;
	};

	/**
	 * @returns {sap.ui.comp.navpopover.SemanticObjectController} Instance of the <code>SemanticObjectController</code> control for the parent control
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._getSemanticObjectControllerOfParent = function () {
		var oSemanticObjectController;
		var oParent = this.getParent();
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

	SmartLink.prototype._getInternalModel = function () {
		const oModel = this.getModel("$sapuicompSmartLink");
		return oModel;
	};

	SmartLink.prototype._setMainNavigation = function (oLinkData) {
		if (oLinkData === undefined) {
			return;
		}

		const oModel = this._getInternalModel();
		if (oLinkData === null) {
			oModel.setProperty("/mainNavigationLink/href", null);
			oModel.setProperty("/mainNavigationLink/internalHref", null);
			oModel.setProperty("/mainNavigationLink/target", null);
			oModel.setProperty("/mainNavigationLink/subtitle", null);
			return;
		}

		if (!oModel.getProperty("/mainNavigationLink/title") && oModel.getProperty("/mainNavigationLink/title") !== '') {
			oModel.setProperty("/mainNavigationLink/title", oLinkData.getText());
		}

		oModel.setProperty("/mainNavigationLink/href", oLinkData.getHref());
		oModel.setProperty("/mainNavigationLink/internalHref", oLinkData.getInternalHref());
		oModel.setProperty("/mainNavigationLink/target", oLinkData.getTarget());
		oModel.setProperty("/mainNavigationLink/subtitle", oLinkData.getDescription());
	};

	SmartLink.prototype._setMainNavigationId = function (sMainNavigationId) {
		if (sMainNavigationId === undefined) {
			return;
		}

		const oModel = this._getInternalModel();
		if (sMainNavigationId === null) {
			oModel.setProperty("/mainNavigationId", null);
			oModel.setProperty("/mainNavigationLink/title", null);
			return;
		}

		oModel.setProperty("/mainNavigationId", sMainNavigationId);
		oModel.setProperty("/mainNavigationLink/title", sMainNavigationId);
	};

	SmartLink.prototype._setExtraContent = function (aExtraContent) {
		const oModel = this._getInternalModel();
		oModel.setProperty("/extraContent", aExtraContent);
	};

	SmartLink.prototype._setAppStateKey = function (sAppStateKey) {
		if (sAppStateKey === undefined) {
			return;
		}

		const oModel = this._getInternalModel();
		oModel.setProperty("/appStateKey", sAppStateKey);
	};

	SmartLink.prototype._getAppStateKey = function () {
		const oModel = this._getInternalModel();
		return oModel.getProperty("/appStateKey");
	};

	/**
	 * @param {object} oSemanticAttributes Object containing semantic objects
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._setSemanticAttributes = function (oSemanticAttributes) {
		const oModel = this._getInternalModel();
		oModel.setProperty("/semanticAttributes", oSemanticAttributes);
	};

	/**
	 * @returns {object} Object containing semantic objects
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._getSemanticAttributes = function () {
		const oModel = this._getInternalModel();
		return oModel.getProperty("/semanticAttributes");
	};

	/**
	 * @returns {object} Object containing semantic objects
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._updateEnabled = async function () {
		const oFieldInfo = this.getFieldInfo();
		const bTriggerable = await oFieldInfo.isTriggerable();
		this.setEnabled(bTriggerable);
		this._bIsTriggerable = bTriggerable;
	};

	/**
	 * @private
	 * @ui5-restricted
	 */
	SmartLink.prototype._determineEnabled = function () {
		const oFieldInfo = this._getFieldInfo();
		if (oFieldInfo) {
			this.getFieldInfo().fireDataUpdate();
		}
	};

	return SmartLink;
});
