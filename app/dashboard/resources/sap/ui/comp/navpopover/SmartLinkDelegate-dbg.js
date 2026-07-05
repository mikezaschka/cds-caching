/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/mdc/LinkDelegate",
	'sap/ui/mdc/enums/LinkType',
	'sap/base/Log',
	'./Util',
	"sap/base/strings/whitespaceReplacer",
	'sap/ui/core/Component',
	'sap/base/util/isPlainObject',
	'./ContactDetailsController',
	'./Factory',
	'sap/m/VBox',
	"sap/ui/mdc/library",
	"sap/base/util/merge",
	"sap/ui/mdc/link/LinkItem",
	"sap/m/Title",
	"sap/m/Link",
	'sap/m/library',
	'sap/ui/core/CustomData',
	'sap/m/Text',
	"sap/ui/comp/personalization/Util",
	'sap/ui/core/library',
	"sap/ui/mdc/link/Panel",
	"./SemanticObjectController",
	"./LinkData",
	"sap/base/util/isEmptyObject",
	"sap/ui/core/Element",
	"sap/ui/core/Lib"
], (
	LinkDelegate,
	LinkType,
	SapBaseLog,
	Util,
	whitespaceReplacer,
	Component,
	isPlainObject,
	ContactDetailsController,
	Factory,
	VBox,
	mdcLibrary,
	merge,
	LinkItem,
	Title,
	Link,
	mLibrary,
	CustomData,
	Text,
	PersonalizationUtil,
	coreLibrary,
	Panel,
	SemanticObjectController,
	LinkData,
	isEmptyObject,
	Element,
	Lib
) => {
	"use strict";

	/**
	 * Delegate for {@link sap.ui.comp.navpopover.SmartLink}. This extension provides all historical features of the NavigationPopoverHandler.
	 * This class will determine NavigationTargets depending on the semanticObjects given by a payload
	 * @author SAP SE
	 * @private
	 * @since 1.122
	 * @namespace
	 * @alias sap.ui.comp.navpopover.SmartLinkDelegate
	 * @extends module:sap/ui/mdc/LinkDelegate
	 */
	const SmartLinkDelegate = Object.assign({}, LinkDelegate);

	// ----------------------- Overwrite Methods --------------------------

	/**
	 * Calculates and returns the type of link that is displayed.
	 * @private
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code>
	 * @returns {Promise<sap.ui.mdc.link.LinkTypeWrapper>} Once resolved, a {@link sap.ui.mdc.link.LinkTypeWrapper} containing an initial {@link sap.ui.mdc.link.LinkType} and an optional <code>Promise</code> are returned.
	 * The optional <code>Promise</code> also returns a {@link sap.ui.mdc.link.LinkType} object.
	 * Once the optional <code>Promise</code> has been resolved, the returned {@link sap.ui.mdc.link.LinkType} overwrites the <code>initialType</code>.
	 */
	SmartLinkDelegate.fetchLinkType = async (oLink) => {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const bIsSmartLinkEnabled = await SmartLinkDelegate._isSmartLinkEnabled(oSmartLink);
		const oLinkTypeRet = {
			initialType: {
				type: bIsSmartLinkEnabled ? LinkType.Popover : LinkType.Text,
				directLink: undefined
			},
			runtimeType: SmartLinkDelegate._getRuntimeLinkType(oLink)
		};

		return Promise.resolve(oLinkTypeRet);
	};

	/**
	 * Retrieves and returns the relevant <code>additionalContent</code> for the <code>SmartLink</code> control as an array.
	 * @private
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {Promise<sap.ui.core.Control[]>} Once resolved, an array of {@link sap.ui.core.Control} is returned
	 */
	SmartLinkDelegate.fetchAdditionalContent = async (oLink) => {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);

		const oControl = Element.getElementById(oSmartLink.sId);
		if (!oControl) {
			SapBaseLog.error("sap.ui.comp.navpopover.SmartLinkDelegate: No control provided, popover cannot be attached.");
		}

		const aAdditionalContent = await SmartLinkDelegate._retrieveAdditionalContent(oLink);
		return aAdditionalContent;
	};

	const fnGetHref = (oLink) => {
		return oLink.getHref?.() ?? oLink.href;
	};

	const fnGetText = (oLink) => {
		return oLink.getText?.() ?? oLink.text;
	};

	const fnGetInternalHref = (oLink) => {
		if (oLink.getInternalHref !== undefined) {
			return oLink.getInternalHref();
		}

		return oLink.data?.("internalHref") ?? oLink.internalHref;
	};

	/**
	 * Fires the <code>innerNavigate</code> event on navigation.
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @param {sap.ui.base.Event} oEvent Instance of the <code>Event</code> element for pressing the <code>Link</code> control
	 * @returns {Promise<boolean>} Indicates whether the event has been fired
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate.beforeNavigationCallback = function (oLink, oEvent) {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const oMLink = oEvent.getSource();
		const oSemanticObjectController = oSmartLink?.getSemanticObjectController();
		const fnBeforeNavigationCallback = oSmartLink?.getBeforeNavigationCallback() || oSemanticObjectController?.getBeforeNavigationCallback();

		if (!fnBeforeNavigationCallback) {
			return Promise.resolve(true);
		}

		let sSemanticObject = oSmartLink?.getSemanticObject();
		const aAdditionalSemanticObjects = oSmartLink.getAdditionalSemanticObjects();
		if (aAdditionalSemanticObjects?.length > 0) {
			const sAdditionalSemanticObject = aAdditionalSemanticObjects.find((sAdditionalSemanticObject) => fnGetHref(oMLink).includes(sAdditionalSemanticObject));
			if (sAdditionalSemanticObject && sAdditionalSemanticObject.trim().length > 0) {
				sSemanticObject = sAdditionalSemanticObject;
			}
		}
		const oSemanticAttributes = oSmartLink?._getSemanticAttributes();
		const sInternalHref = fnGetInternalHref(oMLink);

		const oNavigationInfo = {
			text: fnGetText(oMLink),
			href: fnGetHref(oMLink),
			originalId: oSmartLink?.getParent()?.isA("sap.m.ObjectIdentifier") ? oSmartLink.getParent().getId() : oSmartLink?.getId(),
			semanticObject: sSemanticObject,
			semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObject] : oSemanticAttributes
		};

		return fnBeforeNavigationCallback(merge({}, oNavigationInfo))
			.then((bNavigate) => {
				if (bNavigate) {
					oSmartLink?.fireInnerNavigate({ ...oNavigationInfo, internalHref: sInternalHref });
					oSemanticObjectController?.fireNavigate({ ...oNavigationInfo, internalHref: sInternalHref });
				}
				return bNavigate;
			});
	};

	SmartLinkDelegate.getPanelId = function (oLink) {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		if (!oSmartLink) {
			SapBaseLog.error("SmartLinkDelegate: Stable ID could not be determined because the control is undefined");
			return undefined;
		}
		const oAppComponent = SmartLinkDelegate._getComponent(oSmartLink);
		if (!oAppComponent) {
			SapBaseLog.error("SmartLinkDelegate: Stable ID could not be determined because the app component is not defined for control '" + oSmartLink.getId() + "'");
			return undefined;
		}

		const sSemanticObjectDefault = oSmartLink.getSemanticObject();
		if (!sSemanticObjectDefault) {
			SapBaseLog.error("SmartLinkDelegate: Stable ID could not be determined because no default semantic object is defined");
			return undefined;
		}
		const aSemanticObjects = [
			sSemanticObjectDefault
		].concat(oSmartLink.getAdditionalSemanticObjects());
		Util.sortArrayAlphabetical(aSemanticObjects);
		const sSemanticObjects = aSemanticObjects.join("--");

		return oAppComponent.createId("sapuicompnavpopoverNavigationPopover---" + sSemanticObjects);
	};

	SmartLinkDelegate.fetchPopoverTitle = function (oLink, oPanel) {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const sTitle = oSmartLink.getMainNavigationId();
		const oLabelledByControl = SmartLinkDelegate._getLabelledByControl(oPanel);

		return Promise.resolve({ sTitle, oLabelledByControl });
	};

	SmartLinkDelegate._getLabelledByControl = function (oPanel) {
		return oPanel._getAdditionalContentArea().getItems()[0].getItems()[0].getItems()[0].getContent();
	};

	// ----------------------- Public Methods --------------------------
	/**
	 * Gets value of SemanticObject.
	 * @param {sap.ui.comp.navpopover.SmartLink} oSmartLink Instance of <code>SmartLink</code> control
	 * @returns {undefined|object} Value for SemanticObject
	 */
	SmartLinkDelegate.getSemanticObjectValue = function (oSmartLink) {
		const oSemanticObject = oSmartLink.getSemanticObject();
		const oSemanticAttributes = oSmartLink._getSemanticAttributes();
		if (oSemanticAttributes && oSemanticObject && oSemanticAttributes[oSemanticObject]) {
			return oSemanticAttributes[oSemanticObject][oSemanticObject];
		}
		return undefined;
	};

	SmartLinkDelegate.onLinkPressed = async function (oLink, oEvent) {
		const oMLink = oEvent.getSource();
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const oSemanticObjectController = oSmartLink.getSemanticObjectController();

		const bCtrlKeyPressed = oEvent.getParameters().ctrlKey || oEvent.getParameters().metaKey;
		const bBeforeNavigationCallbackSet = !!(oSmartLink.getBeforeNavigationCallback() || oSemanticObjectController?.getBeforeNavigationCallback());
		const bOpenInNewTab = oMLink?.getTarget() === "_blank" || bCtrlKeyPressed;

		if (bOpenInNewTab) {
			return;
		}

		oEvent.preventDefault();

		// Fall back to using href property when there is no internalHref
		const bUseInternalHref = oMLink?.getCustomData() && oMLink.getCustomData()[0]?.getValue();
		const sHref = bUseInternalHref ? oMLink.getCustomData()[0].getValue() : oMLink.getHref();
		if (bBeforeNavigationCallbackSet) {
			const bNavigate = await oLink._beforeNavigationCallback(oEvent);
			if (bNavigate) {
				Panel.navigate(sHref);
			}
		} else {
			Panel.navigate(sHref);
		}
	};
	/**
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @param {sap.ui.model.Context|null|undefined} oBindingContext Binding context of the <code>Link</code> control
	 * @returns {Promise} Navigation targets from UShell service
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate.fetchNavigationTargets = async (oLink, oBindingContext) => {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const oSemanticObject = oSmartLink.getSemanticObject();

		const sSemanticObjectDefault = oSemanticObject;
		const aAdditionalSemanticObjects = oSmartLink.getAdditionalSemanticObjects();

		const oControl = Element.getElementById(oSmartLink.sId);
		if (!oControl) {
			SapBaseLog.error("sap.ui.comp.navpopover.SmartLinkDelegate: No control provided, popover cannot be attached.");
		}

		const sBindingPath = oBindingContext?.getPath() ?? null;
		if (!sBindingPath) {
			SapBaseLog.warning("sap.ui.comp.navpopover.SmartLinkDelegate: Binding Context is null. Please be aware that without binding context no semantic attributes can be calculated. Without semantic attributes no URL parameters can be created.");
		}
		const oODataModel = oSmartLink.getModel();
		const oComponent = SmartLinkDelegate._getComponent(oControl);

		await Lib.load({ name: 'sap.ui.fl' });

		let sMainNavigationId = (oControl && oControl._getTextOfDom && oControl._getTextOfDom()) || SmartLinkDelegate.getSemanticObjectValue(oSmartLink);
		const oSemanticAttributes = oSmartLink._getSemanticAttributes();

		oSmartLink._setSemanticAttributes(oSemanticAttributes);
		sMainNavigationId = (oControl && oControl._getTextOfDom && oControl._getTextOfDom()) || SmartLinkDelegate.getSemanticObjectValue(oSmartLink);

		const sAppStateKey = oSmartLink._getAppStateKey();
		return Util.retrieveNavigationTargets(sSemanticObjectDefault, aAdditionalSemanticObjects, sAppStateKey, oComponent, oSemanticAttributes, sMainNavigationId, oSmartLink.getFieldName(), oODataModel, sBindingPath);
	};

	// ----------------------- Private Methods --------------------------

	/**
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @param {sap.m.Link|sap.ui.mdc.LinkItem} oNavigationLink Instance of the {@link sap.m.Link} control or {@link sap.ui.mdc.LinkItem} that is relevant for navigation
	 * @returns {object} NavigationInfo
	 */
	SmartLinkDelegate._getNavgationInfo = function (oLink, oNavigationLink) {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const oSemanticAttributes = oSmartLink?._getSemanticAttributes();
		const sSemanticObject = oSmartLink?.getSemanticObject();

		const oNavigationInfo = {
			originalId: oSmartLink?.getId(),
			semanticObject: sSemanticObject,
			semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObject] : oSemanticAttributes,
			text: fnGetText(oNavigationLink),
			href: fnGetHref(oNavigationLink),
			internalHref: fnGetInternalHref(oNavigationLink)
		};

		return oNavigationInfo;
	};

	/**
	 * Calculates and retrieves <code>additionalContent</code>.
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @param {string} sMainNavigationId ID of main navigation target
	 * @param {sap.ui.mdc.link.LinkItem} oMainNavigation Instance of the <code>ListItem</code> control for the main navigation target
	 * @returns {Promise<null|sap.ui.layout.form.SimpleForm[]>} Array of form elements
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._retrieveAdditionalContent = async (oLink) => {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);

		const oModel = oSmartLink.getModel() || oLink.getModel();
		const oContactDetailsController = new ContactDetailsController();
		oContactDetailsController.setModel(oModel);

		const oBindingContext = oSmartLink.getBindingContext() || oLink._getControlBindingContext();
		const sBindingPath = oBindingContext?.getPath() ?? null;

		const sContactAssociationPath = Util.getContactAnnotationPath(oSmartLink, oSmartLink.getSemanticObjectController());
		const sSemanticObjectValue = SmartLinkDelegate.getSemanticObjectValue(oSmartLink); // oModel.aBindings[0].getValue();
		const oMainNavigationContent = SmartLinkDelegate._getMainNavigationContent(oSmartLink);

		if (sContactAssociationPath == undefined) {
			return [oMainNavigationContent];
		}

		await Lib.load({ name: 'sap.ui.fl' });
		const sBindingPathOfAnnotation = await oContactDetailsController.getBindingPath4ContactAnnotation(sBindingPath, sContactAssociationPath, sSemanticObjectValue);
		const aForms = oContactDetailsController.getContactDetailsContainers(sBindingPathOfAnnotation);
		oContactDetailsController.destroy();
		return [oMainNavigationContent, aForms];
	};

	/**
	 * Assembles and retrieves controls for depicting the main navigation.
	 * @param {sap.ui.comp.navpopover.SmartLink} oSmartLink Instance of the <code>SmartLink</code> control for the main navigation target
	 * @returns {sap.m.VBox} Instance of the <code>VBox</code> control containing all controls for the main navigation
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getMainNavigationContent = (oSmartLink) => {
		const oModel = oSmartLink._getInternalModel();

		const oTitleLink = new Link({
			href: "{$sapuicompSmartLink>/mainNavigationLink/href}",
			text: "{$sapuicompSmartLink>/mainNavigationLink/title}",
			target: "{$sapuicompSmartLink>/mainNavigationLink/target}",
			visible: {
				path: "$sapuicompSmartLink>/mainNavigationLink/title",
				formatter: (oValue) => !!oValue
			},
			enabled: {
				path: "$sapuicompSmartLink>/mainNavigationLink/href",
				formatter: (oValue) => !!oValue
			},
			press: (oEvent) => {
				SmartLinkDelegate.onLinkPressed(oSmartLink.getFieldInfo(), oEvent);
			}
		});

		const oCustomData = new CustomData({
			key: "internalHref",
			value: "{$sapuicompSmartLink>/mainNavigationLink/internalHref}"
		});
		oTitleLink.addCustomData(oCustomData);

		const oTitle = new Title({
			level: coreLibrary.TitleLevel.Auto,
			content: oTitleLink
		});
		oTitle.addStyleClass("sapFontHeader5Size");

		const oSubTitle = new Text({
			text: "{$sapuicompSmartLink>/mainNavigationLink/subtitle}",
			visible: {
				path: "$sapuicompSmartLink>/mainNavigationLink/subtitle",
				formatter: (oValue) => !!oValue
			}
		});

		const oHeaderArea = new VBox({
			items: [
				oTitle, oSubTitle
			],
			visible: {
				path: "$sapuicompSmartLink>/mainNavigationLink/title",
				formatter: (oValue) => !!oValue
			}
		});

		oHeaderArea.addStyleClass("mdcbaseinfoPanelTitleH1");
		oHeaderArea.addStyleClass("mdcbaseinfoPanelHeader");

		const oContent = new VBox({
			// Default behavior for the case that all three sections can fit the height of phone (e.g. only mainNavigationSection and
			// relatedAppsSection w/o additionalContentSection or mainNavigationSection, relatedAppsSection and small additionalContentSection)
			fitContainer: true,
			justifyContent: mLibrary.FlexJustifyContent.Start,
			items: [oHeaderArea]
		});

		oContent.setModel(oModel, "$sapuicompSmartLink");

		return oContent;
	};

	/**
	 * Transforms and cleans string-based properties of navigation targets.
	 * @param {object} oResultFromNavigationObtained Navigation targets obtained from event
	 * @returns {object} Transformed navigation targets
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._transformNavigationTargets = (oResultFromNavigationObtained) => {
		const { availableActions, mainNavigation } = oResultFromNavigationObtained;
		const aConvertToExternalPromises = [];

		if (availableActions) {
			availableActions.forEach((oAvailableAction) => {
				if (oAvailableAction.getText()) {
					oAvailableAction.setText(whitespaceReplacer(oAvailableAction.getText()));
				}
				if (oAvailableAction.getHref()) {
					oAvailableAction.setInternalHref(oAvailableAction.getHref());

					aConvertToExternalPromises.push(SmartLinkDelegate._convertToExternal(oAvailableAction.getHref()).then((sConvertedHref) => {
						oAvailableAction.setHref(sConvertedHref);
					}));
				}
			});
		}

		if (mainNavigation) {
			if (mainNavigation.getDescription()) {
				mainNavigation.setDescription(whitespaceReplacer(mainNavigation.getDescription()));
			}
			if (mainNavigation.getText()) {
				mainNavigation.setText(whitespaceReplacer(mainNavigation.getText()));
			}
			if (mainNavigation.getHref()) {
				mainNavigation.setInternalHref(mainNavigation.getHref());
				aConvertToExternalPromises.push(SmartLinkDelegate._convertToExternal(mainNavigation.getHref()).then((sConvertedHref) => {
					mainNavigation.setHref(sConvertedHref);
				}));
			}
		}


		return Promise.all(aConvertToExternalPromises).then(() => {
			oResultFromNavigationObtained.availableActions = availableActions;
			oResultFromNavigationObtained.mainNavigation = mainNavigation;
			if (oResultFromNavigationObtained.mainNavigationId) {
				oResultFromNavigationObtained.mainNavigationId = whitespaceReplacer(oResultFromNavigationObtained.mainNavigationId);
			}
			return oResultFromNavigationObtained;
		});
	};

	/**
	 * @param {sap.ui.mdc.link.LinkItem[]} aMAvailableActions Available actions for popover
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {sap.ui.mdc.link.LinkItem[]} Available actions for popover
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._updateVisibilityOfAvailableActions = (aMAvailableActions, oLink) => {
		if (!SmartLinkDelegate._getEnableAvailableActionsPersonalization(aMAvailableActions, oLink)) {
			return aMAvailableActions.map((oAction) => {
				oAction.setInitiallyVisible(true);
				return oAction;
			});
		}

		// Update the 'visible' attribute only for valid (i.g. storable links with filled 'key') availableActions.
		const aMValidAvailableActions = Util.getStorableAvailableActions(aMAvailableActions);
		const bHasInitiallyVisibleAction = aMValidAvailableActions.some((oMAvailableAction) => {
			return !!oMAvailableAction.getInitiallyVisible();
		});
		aMValidAvailableActions.forEach((oMAvailableAction) => {
			const bInitiallyVisible = oMAvailableAction.getInitiallyVisible();

			// Do not show links as 'Related Apps' in case of many links. Exception: the links without 'key' which should be shown always.
			if (aMAvailableActions.length > 10) {
				oMAvailableAction.setInitiallyVisible(false);
			}
			// If at least one initially visible action exists, do not show other links
			if (bHasInitiallyVisibleAction) {
				oMAvailableAction.setInitiallyVisible(false);
			}
			// Show always initially visible actions
			if (bInitiallyVisible) {
				oMAvailableAction.setInitiallyVisible(true);
			}
		});

		if (aMAvailableActions.every((oMAvailableAction) => !oMAvailableAction.getInitiallyVisible())) {
			if (aMAvailableActions[0]) { aMAvailableActions[0].setInitiallyVisible(true); }
			if (aMAvailableActions[1]) { aMAvailableActions[1].setInitiallyVisible(true); }
			if (aMAvailableActions[2]) { aMAvailableActions[2].setInitiallyVisible(true); }
		}

		return aMAvailableActions;
	};

	/**
	 * Gets availability of personalization for available actions.
	 * @param {sap.ui.mdc.link.LinkItem[]} aMAvailableActions Available actions for popover
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {boolean} Indicates whether personalization for available actions is enabled
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getEnableAvailableActionsPersonalization = (aMAvailableActions, oLink) => {
		// Do not show any text if there are no valid (i.g. storable links with filled 'key') available actions
		const aMValidAvailableActions = Util.getStorableAvailableActions(aMAvailableActions);
		if (aMValidAvailableActions.length === 0) {
			return false;
		}

		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		// Default: value of 'enableAvailableActionsPersonalization' property
		let bEnableAvailableActionsPersonalization = oSmartLink.getEnableAvailableActionsPersonalization();
		// SemanticObjectController can overwrite value of 'enableAvailableActionsPersonalization' property
		const sFieldName = oSmartLink.getFieldName();
		const oAvailableActions = oSmartLink.getSemanticObjectController()?.getEnableAvailableActionsPersonalization();
		if (oAvailableActions && oAvailableActions[sFieldName] !== undefined) {
			bEnableAvailableActionsPersonalization = oAvailableActions[sFieldName];
		}
		return bEnableAvailableActionsPersonalization;
	};

	/**
	 * Finds the parental component for a specified control.
	 * @param {sap.ui.core.Control} oControl Instance of <code>Control</code> for which the parental control should be found
	 * @returns {sap.ui.core.Component|undefined|null} The found component or undefined
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getComponent = (oControl) => {
		if (!oControl) {
			return null;
		}
		let oParent = oControl.getParent();
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

	/**
	 * Gets the current binding context and creates a copied map where all empty and unnecessary data is deleted from.
	 * @param {object | null} oSemanticObjects Format: {/semanticObjectName/: {{/localProperty/: string},...}}
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @param {sap.ui.model.Context|null|undefined} oBindingContext Binding context of the <code>Link</code> control
	 * @returns {object} Semantic attributes calculated from oSemanticObjects
	 * @private
	 * @ui5-restricted
	*/
	SmartLinkDelegate._calculateSemanticAttributes = (oSemanticObjects, oLink, oBindingContext) => {
		// const oContextObject = this._getBindingContextObject();
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const oContextObject = oBindingContext?.getObject(oBindingContext.getPath()) ?? null;
		const oSemanticObject = oSmartLink.getSemanticObject();
		const aAdditionalSemanticObjects = oSmartLink.getAdditionalSemanticObjects();

		const sCurrentField = oSmartLink.getFieldName();
		const aSemanticObjects = [
			"", oSemanticObject
		].concat(aAdditionalSemanticObjects);
		const oResults = {};

		aSemanticObjects.forEach((sSemanticObject) => {
			oResults[sSemanticObject] = {};
			const oMappingRules = SmartLinkDelegate._getMappingRules(sSemanticObject, oSemanticObjects, oContextObject, oLink);

			for (const sAttributeName in oContextObject) {
				const oAttribute = {
					transformations: []
				};
				let oTransformationAdditional = null;
				// Ignore undefined and null values
				if (oContextObject[sAttributeName] === undefined || oContextObject[sAttributeName] === null) {
					if (oAttribute) {
						oAttribute.transformations.push({
							value: oContextObject[sAttributeName],
							description: "\u2139 Undefined and null values have been removed in SmartLinkDelegate."
						});
					}
					continue;
				}
				// Ignore plain objects (BCP 1770496639)
				if (isPlainObject(oContextObject[sAttributeName])) {
					if (oAttribute) {
						oAttribute.transformations.push({
							value: oContextObject[sAttributeName],
							description: "\u2139 Plain objects has been removed in SmartLinkDelegate."
						});
					}
					continue;
				}

				const sAttributeNameMapped = oMappingRules[sAttributeName];

				if (oAttribute && sAttributeName !== sAttributeNameMapped) {
					oTransformationAdditional = oSemanticObjects ? {
						value: undefined,
						description: "\u2139 The attribute " + sAttributeName + " has been renamed to " + sAttributeNameMapped + " in SmartLinkDelegate.",
						reason: `\ud83d\udd34 A com.sap.vocabularies.Common.v1.SemanticObjectMapping annotation is defined for semantic object ${sSemanticObject}
							 with source attribute ${sAttributeName} and target attribute ${sAttributeNameMapped}.
							 You can modify the annotation if the mapping result is not what you expected.`
					} : {
						value: undefined,
						description: "\u2139 The attribute " + sAttributeName + " has been renamed to " + sAttributeNameMapped + " in SmartLinkDelegate.",
						reason: "\ud83d\udd34 The property mapFieldToSemanticObject is set to true. Attribute " +
							sAttributeName + " is mapped to " + sAttributeNameMapped + ". (semantic object is " +
							oSemanticObject + ", field name is " + oSmartLink.getFieldName() +
							"). If this is not what you expected, you can set the property to false or define a com.sap.vocabularies.Common.v1.SemanticObjectMapping annotation."
					};
				}

				// If more then one attribute field maps to the same semantic object we take the value of the current binding path.
				let oAttributeValue = oContextObject[sAttributeName];
				if (oResults[sSemanticObject][sAttributeNameMapped]) {
					if (oContextObject[sCurrentField]) {
						// Take over the value of current field in case of clash. If other field has clash we have no clue which value is the right one. So write error log.
						// Keep in mind: we do not explicitly check whether we are in the 'mapping' use-case when calling _mapFieldToSemanticObject because in not 'mapping'
						// use-case we do not come in the clash situation at all.
						if (sAttributeNameMapped === oMappingRules[oSmartLink.getFieldName()]) {
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
						description: "\u2139 The attribute " + sAttributeName + " with the value " + oContextObject[sAttributeName] + " is taken from the binding context in SmartLinkDelegate."
					});
					if (oTransformationAdditional) {
						oAttribute.transformations.push(oTransformationAdditional);
					}
				}
			}
		});

		return oResults;
	};

	/**
	 * @param {string} sSemanticObject Relevant semanticObject of oSemanticObjects for which mapping rules should be retrieved
	 * @param {object|null} oSemanticObjects Object containing all SemanticObjects.
	 * @param {object} oContextObject Context of bound properties
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {object} Mapping rules for sSemanticObject
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getMappingRules = (sSemanticObject, oSemanticObjects, oContextObject, oLink) => {
		// Default value of mapFieldtoSemanticObject property can be overwritten by SemanticObjectController
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const bUseSemanticObjectControllerMap = !!oSmartLink.getSemanticObjectController()?.getMapFieldToSemanticObject();
		const bMapFieldToSemanticObject = bUseSemanticObjectControllerMap ? oSmartLink.getSemanticObjectController().getMapFieldToSemanticObject() : oSmartLink.getMapFieldToSemanticObject();

		let sAttributeName;
		const oMappingRules = {};

		// Take over first the attributes for which mapping rules exist.
		// Priority: 1. mapping from SemanticObjectMapping annotation 2. mapFieldToSemanticObject
		if (oSemanticObjects) {
			for (sAttributeName in oSemanticObjects[sSemanticObject]) {
				if (typeof oSemanticObjects[sSemanticObject][sAttributeName] === "string") {
					oMappingRules[sAttributeName] = oSemanticObjects[sSemanticObject][sAttributeName];
				}
			}
		} else if (bMapFieldToSemanticObject) {
			if (oSmartLink.getSemanticObjectController()) {
				const oMap = oSmartLink.getSemanticObjectController().getFieldSemanticObjectMap();
				for (sAttributeName in oMap) {
					oMappingRules[sAttributeName] = oMap[sAttributeName];
				}
			}
			// For own field return the semantic object if exists
			// Note: if the field is assigned to another semantic object in 'SemanticObject' annotation than in the 'semanticObject' property then the
			// property 'semanticObject' is preferred.
			if (oSmartLink.getFieldName() && oSmartLink.getSemanticObject()) {
				oMappingRules[oSmartLink.getFieldName()] = oSmartLink.getSemanticObject();
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
	 * Fires the <code>beforePopoverOpens</code> event for the control with ID sId.
	 * @param {*} oSemanticAttributes Object containing all semanticAttributes
	 * @param {string} sSemanticObjectDefault Default SemanticObject
	 * @param {string} sId ID of control for which the event should be fired
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {Promise<object>} Object containing information for the <code>beforePopoverOpens</code> event
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._fireBeforePopoverOpens = (oSemanticAttributes, sSemanticObjectDefault, sId, oLink) => {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		return new Promise((resolve) => {
			const oResult = {
				semanticAttributes: oSemanticAttributes,
				appStateKey: undefined
			};
			if (!oSmartLink.hasListeners("beforePopoverOpens")) {
				resolve(oResult);
				return;
			}

			const fnExistsSemanticAttributeForAnySemanticObject = (oSemanticAttributes) => {
				const aSemanticObjectsWithExistingSemanticAttributes = Object.keys(oSemanticAttributes).filter((sSemanticObject) => {
					return !isEmptyObject(oSemanticAttributes[sSemanticObject]);
				});
				return !!aSemanticObjectsWithExistingSemanticAttributes.length;
			};

			const oParameters = {
				originalId: sId,
				semanticObject: sSemanticObjectDefault,
				semanticAttributes: !isEmptyObject(oSemanticAttributes[sSemanticObjectDefault]) ? oSemanticAttributes[sSemanticObjectDefault] : null,
				semanticAttributesOfSemanticObjects: fnExistsSemanticAttributeForAnySemanticObject(oSemanticAttributes) ? oSemanticAttributes : null,
				setSemanticAttributes: (oSemanticAttributes, sSemanticObject) => {
					sSemanticObject = sSemanticObject || sSemanticObjectDefault;
					oResult.semanticAttributes = oResult.semanticAttributes || {};

					oResult.semanticAttributes[sSemanticObject] = oSemanticAttributes;
				},
				setAppStateKey: (sAppStateKey) => {
					oResult.appStateKey = sAppStateKey;
				},
				open: () => {
					return resolve(oResult);
				}
			};

			const fnBeforePopoverOpens = oSmartLink._onBeforePopoverOpens.bind(oSmartLink);
			fnBeforePopoverOpens(oParameters);
			// that.fireBeforePopoverOpens(oParameters);
		});
	};

	/**
	 * Fires the <code>navigationTargetsObtained</code> event for the control with ID sId.
	 * @param {string} sMainNavigationId ID of main navigation target
	 * @param {string} sSemanticObjectDefault Default SemanticObject
	 * @param {*} oSemanticAttributes Object containing all semanticAttributes
	 * @param {string} sId ID of control for which the event should be fired
	 * @param {Promise<null|sap.ui.layout.form.SimpleForm[]>} aForms Array of form elements
	 * @param {*} oNavigationTargets Object containing information about navigation targets
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {Promise<sap.ui.comp.navpopover.NavigationTargets>} Object containing information for the <code>navigationTargetsObtained</code> event
	 * @private
	 * @ui5-restricted
	 * NOTE: this function has to provide a precise timing to ensure that some scenarios in SmartLink still work. For example: there are mulitple event handlings for
	 * the 'navigationTargetsObtained' event in the SmartLink and or the SemanticObjectController. In some cases these handling will be processed slower or faster resulting
	 * in an override of the returned / resolved oResult object. Adding a breakpoint in the show method could help finding these timing issues.
	 *
	 * Due to these timing issues we've introduced the 'navigationTargetsObtainedCallback' on all of the effected controls. This will allow the first caller to ALWAYS win as
	 * there can't be multiple.
	 */
	SmartLinkDelegate._fireNavigationTargetsObtained = (sMainNavigationId, sSemanticObjectDefault, oSemanticAttributes, sId, aForms, oNavigationTargets, oLink) => {
		return new Promise((resolve) => {
			const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
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
			const bHasListeners = oSmartLink.hasListeners("navigationTargetsObtained");
			const fnNavigationTargetsObtained = oSmartLink._onNavigationTargetsObtained.bind(oSmartLink);
			const fnNavigationTargetsObtainedCallback = oSmartLink.getNavigationTargetsObtainedCallback();
			if (fnNavigationTargetsObtainedCallback) {
				if (bHasListeners) {
					fnNavigationTargetsObtained({
						...oNavigationTargetsObtainedParams,
						show: function () {
							SapBaseLog.warning(`sap.ui.comp.navpopover.SmartLinkDelegate: "navigationTargetsObtained" event handling will be ignored as "navigationTargetsObtainedCallback" property is set.`);
						}
					});
				}
				const oCallbackObject = {
					...oNavigationTargetsObtainedParams,
					...oResultParams
				};
				fnNavigationTargetsObtainedCallback(oCallbackObject).then((oResultFromCallback) => {
					resolve(SmartLinkDelegate._applyResults(oCallbackObject, oResultFromCallback));
				});
				return;
			}

			const oResultFromEvent = {
				...oResultParams,
				...oNavigationTargets
			};
			if (!bHasListeners) {
				resolve(oResultFromEvent);
				return;
			}

			fnNavigationTargetsObtained({
				...oNavigationTargetsObtainedParams,
				show: function (sMainNavigationId, oMainNavigation, aAvailableActions, oAdditionalContent) {
					// Due to backward compatibility we have to support the use-case where only 3 parameters can be passed. The meaning for these
					// parameters is: [oMainNavigation, aAvailableActions, oAdditionalContent]
					if (arguments.length > 0 && !(typeof sMainNavigationId === "string" || oMainNavigation instanceof LinkData || Array.isArray(aAvailableActions)) && oAdditionalContent === undefined) {
						oAdditionalContent = aAvailableActions;
						aAvailableActions = oMainNavigation;
						oMainNavigation = sMainNavigationId;
						sMainNavigationId = undefined;
					}
					resolve(SmartLinkDelegate._applyResults(oResultFromEvent, {
						mainNavigationId: sMainNavigationId,
						mainNavigation: oMainNavigation,
						actions: aAvailableActions,
						extraContent: oAdditionalContent
					}));
				}
			});
		});
	};

	SmartLinkDelegate._applyResults = (oResult, oResultsToApply) => {
		oResultsToApply ??= oResult;
		const {
			mainNavigationId,
			mainNavigation,
			actions,
			extraContent
		} = oResultsToApply;
		// Empty string '' is allowed
		if (mainNavigationId !== undefined && mainNavigationId !== null) {
			oResult.mainNavigationId = mainNavigationId;
		}

		if (mainNavigation !== undefined) {
			oResult.mainNavigation = mainNavigation;
		}

		if (actions) {
			actions.forEach(function (oAvailableAction) {
				// If 'key' is not provided by application, this link should be always shown in NavigationPopover (due to personalization
				// reasons - 1. the link can not be stored as change and therefore this link will not appear in selection dialog. 2. The
				// user is not able to set this link as visible in case that there are a lot of links and only 'Define Links' is
				// provided).
				if (oAvailableAction.getKey() === undefined) {
					SapBaseLog.error("'key' attribute of 'availableAction' '" + oAvailableAction.getText() + "' is undefined. Links without 'key' can not be persisted.");
					SapBaseLog.warning("The 'visible' attribute of 'availableAction' '" + oAvailableAction.getText() + "' is set to 'true'");
					oAvailableAction.setVisible(true);
				}
			});
			oResult.availableActions = actions;
		} else {
			oResult.availableActions = oResult.actions ?? oResult.availableActions;
		}

		if (extraContent) {
			oResult.extraContent = extraContent;
		}

		return oResult;
	};

	/**
	 * Convert Link path from internal navigation to external.
	 * @param {string} sHref Href for internal navigation
	 * @returns {string} Extenal Href string after conversion
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._convertToExternal = async (sHref) => {
		const oNavigationService = await Factory.getServiceAsync("Navigation");
		if (!oNavigationService) {
			return sHref;
		}
		const res = await oNavigationService.getHref({
			target: {
				shellHash: sHref
			}
		}, SmartLinkDelegate._getComponent());
		return res;
	};

	/**
	 * Sets the <code>innerControl</code> aggregation.
	 * @param {sap.ui.comp.navpopover.SmartLink} oSmartLink Instance of the <code>SmartLink</code> control
	 * @returns {undefined}
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._updateInnerControl = (oSmartLink) => {
		if (oSmartLink.getAggregation("innerControl")) {
			return;
		}
		const oInnerControl = oSmartLink._getInnerControl(); // create innerControl
		if (!oInnerControl) {
			return;
		}
		const oNewInnerControl = oInnerControl.clone("display");
		oSmartLink.setContentDisplay(oNewInnerControl);
	};

	/**
	 * Calculates and returns the runtime type of link that is displayed.
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code> control
	 * @returns {Promise<sap.ui.mdc.link.LinkTypeWrapper>} Once resolved, a {@link sap.ui.mdc.link.LinkTypeWrapper} containing a runtime {@link sap.ui.mdc.link.LinkType} is returned.
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getRuntimeLinkType = async (oLink) => {
		const oSmartLink = SmartLinkDelegate._getSmartLink(oLink);
		const bIsSmartLinkEnabled = await SmartLinkDelegate._isSmartLinkEnabled(oSmartLink);

		return {
			type: bIsSmartLinkEnabled ? LinkType.Popover : LinkType.Text,
			directLink: undefined
		};
	};

	SmartLinkDelegate._isSmartLinkEnabled = async (oSmartLink) => {

		const oSemanticObjectController = oSmartLink.getSemanticObjectController();
		const bForceLinkRendering = Util.getForceLinkRendering(oSmartLink, oSemanticObjectController);
		const bIgnoreLinkRendering = oSmartLink.getProperty("ignoreLinkRendering");
		const bHasContactAnnotationPath = Util.getContactAnnotationPath(oSmartLink, oSmartLink.getSemanticObjectController());

		const sIgnoreFields = oSemanticObjectController?.getIgnoredFields();
		const bHasNoFieldName = sIgnoreFields !== undefined && PersonalizationUtil.createArrayFromString(sIgnoreFields).includes(oSmartLink.getFieldName());
		if (bHasNoFieldName) {
			return false;
		}

		if (bIgnoreLinkRendering) {
			SmartLinkDelegate._updateInnerControl(oSmartLink);
			return false;
		}

		if (bForceLinkRendering) {
			return true;
		}

		const aSemanticObjects = [
			oSmartLink.getSemanticObject(),
			...oSmartLink.getAdditionalSemanticObjects()
		];

		const mDistinctSemanticObjects = await SemanticObjectController.getDistinctSemanticObjects();
		const bHasDisctinctSemanticObjects = SemanticObjectController.hasDistinctSemanticObject(aSemanticObjects, mDistinctSemanticObjects);

		if (!bHasDisctinctSemanticObjects && !bHasContactAnnotationPath) {
			return false;
		}

		return true;
	};

	/**
	 * Gets parental control of <code>oLink</code>.
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code>
	 * @returns {sap.ui.core.Control[]} The parental control of the oLink
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getParent = (oLink) => {
		return oLink.getParent() ? oLink.getParent() : Element.getElementById(oLink.getAssociation("sourceControl"));
	};

	/**
	 * Gets <code>SmartLink</code> control of <code>oLink</code>.
	 * @param {sap.ui.mdc.Link} oLink Instance of the <code>Link</code>
	 * @returns {sap.ui.core.Control[]} The parental <code>SmartLink</code> control of the oLink
	 * @private
	 * @ui5-restricted
	 */
	SmartLinkDelegate._getSmartLink = (oLink) => {
		const oSmartLink = oLink.getParent();
		return oSmartLink;
	};

	return SmartLinkDelegate;
});
