/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'sap/ui/mdc/Link',
	'./Util',
	'./Panel',
	'sap/ui/mdc/link/Panel',
	"sap/ui/layout/form/SimpleForm",
	"sap/m/Title",
	"sap/ui/core/Lib",
	"sap/ui/layout/library"
], (
	MDCLink,
	Util,
	Panel,
	MDCPanel,
	SimpleForm,
	Title,
	Library,
	layoutLibrary
) => {
	"use strict";

	// shortcut for sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout
	const { ResponsiveGridLayout } = layoutLibrary.form.SimpleFormLayout;

	/**
	 * {@link sap.ui.mdc.Link} implementation used inside the <code>SmartLink</code> to reduce complexity and duplicated housekeeping.
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @since 1.122.0
	 * @alias sap.ui.comp.navpopover.SmartLinkFieldInfo
	 * @extends sap.ui.mdc.Link
	 */
	const SmartLinkFieldInfo = MDCLink.extend("sap.ui.comp.navpopover.SmartLinkFieldInfo", /** @lends sap.ui.comp.navpopover.SmartLinkFieldInfo.prototype */
		{
			metadata: {
				properties: {
					delegate: {
						type: "object",
						defaultValue: {
							name: "sap/ui/comp/navpopover/SmartLinkDelegate",
							payload: {}
						}
					}
				}
			}
		});

	SmartLinkFieldInfo.prototype.init = function () {
		MDCLink.prototype.init.apply(this, arguments);
	};

	SmartLinkFieldInfo.prototype.open = async function (oControl, oEvent) {
		const oSmartLink = this.getParent();

		let sFieldName = oSmartLink.getFieldName();
		if (!sFieldName?.length) {
			const oBinding = oSmartLink.getBinding("text");
			if (oBinding) {
				// BCP: 1980245820
				// check first for composite Binding because of assertion in
				// Change-Id: Ifbe8750e83b1027085a6f1b4f41e7ee2cb9b343b
				if (oBinding.getBindings) {
					// The first binding part is about field name, the second binding path is about description (see
					// ControlProvider._createSmartLinkFieldTemplate())
					sFieldName = oBinding.getBindings()[0].getPath();
				} else {
					sFieldName = oBinding.getPath();
				}
			}
			oSmartLink.setFieldName(sFieldName);
		}

		oControl = oControl ? oControl : oSmartLink;
		if (!oControl) {
			throw new Error("sap.ui.comp.navpopover.SmartLinkFieldInfo: popover can not be open because the control is undefined");
		}
		// Avoid creation of a new popover instance if the same triggerable control is triggered again.
		const oDependentPopover = this.getPopover();
		if (oDependentPopover && oDependentPopover.isOpen()) {
			return Promise.resolve();
		}

		if (!this._oGetContentPromise) {
			this._oGetContentPromise = this.getContent(() => {
				return this.getPopover();
			});
		}

		const oPanel = await this._oGetContentPromise;
		if (!this._oGetContentPromise) {
			oPanel.destroy();
			return Promise.resolve();
		}

		const bNavigate = await this.checkDirectNavigation(oEvent);
		if (bNavigate === false) {
			const oPopover = await this._createPopover(oPanel);
			if (oPopover) {
				oPopover.openBy(oControl);
				oPopover.attachAfterOpen(() => {
					this.firePopoverAfterOpen();
				});
				oPopover.attachAfterClose(() => {
					this._oGetContentPromise = undefined;
				});
			}
		} else {
			oPanel.destroy();
			this._oGetContentPromise = undefined;
		}
		return Promise.resolve();
	};

	SmartLinkFieldInfo.prototype.getContent = async function (fnGetAutoClosedControl) {
		if (!this.awaitControlDelegate()) {
			throw new Error("sap.ui.comp.navpopover.SmartLinkFieldInfo: control delegate is not set - could not load LinkItems from delegate.");
		}

		const oSmartLink = this.getParent();
		const vSourceControl = this._getSourceControl();
		const sId = vSourceControl.getId?.() ?? vSourceControl;
		const sSemanticObjectDefault = oSmartLink.getSemanticObject();
		const oControlDelegate = await this.awaitControlDelegate();
		const oBindingContext = this._getControlBindingContext();
		const sBindingPath = oBindingContext?.getPath() ?? null;
		const oODataModel = oSmartLink.getModel();

		const oSemanticObjects = await Util.retrieveSemanticObjectMapping(oSmartLink.getFieldName(), oODataModel, sBindingPath);
		oSmartLink._setSemanticAttributes(oControlDelegate._calculateSemanticAttributes(oSemanticObjects, this, oBindingContext));
		let oSemanticAttributes = oSmartLink._getSemanticAttributes();

		const oResultFromBeforePopoverOpen = await oControlDelegate._fireBeforePopoverOpens(oSemanticAttributes, sSemanticObjectDefault, sId, this);
		oSemanticAttributes = oResultFromBeforePopoverOpen.semanticAttributes;
		const sAppStateKey = oResultFromBeforePopoverOpen.appStateKey;
		oSmartLink._setSemanticAttributes(oSemanticAttributes);
		oSmartLink._setAppStateKey(sAppStateKey);

		const oAdditionalContentPromise = this.retrieveAdditionalContent();
		const oNavigationTargetsPromise = oControlDelegate.fetchNavigationTargets(this, oBindingContext);

		const aPromiseValues = await Promise.all([oNavigationTargetsPromise, oAdditionalContentPromise]);
		const [oNavigationTargets, aAdditionalContent] = aPromiseValues;
		const aContactDetails = aAdditionalContent.length === 2 ? aAdditionalContent[1] : [];

		const sMainNavigationId = (oSmartLink._getTextOfDom && oSmartLink._getTextOfDom()) || oControlDelegate.getSemanticObjectValue(oSmartLink);

		let oResultFromNavigationObtained = await oControlDelegate._fireNavigationTargetsObtained(sMainNavigationId, sSemanticObjectDefault, oSemanticAttributes, sId, aContactDetails, oNavigationTargets, this);

		oResultFromNavigationObtained = await oControlDelegate._transformNavigationTargets(oResultFromNavigationObtained);

		oSmartLink._setMainNavigation(oResultFromNavigationObtained.mainNavigation);
		oSmartLink._setMainNavigationId(oResultFromNavigationObtained.mainNavigationId);

		const aLinkItems = oResultFromNavigationObtained.availableActions ?? [];
		const aUpdatedLinkItems = oControlDelegate._updateVisibilityOfAvailableActions(aLinkItems, this);

		oSmartLink._setExtraContent(oResultFromNavigationObtained.extraContent);
		if (oResultFromNavigationObtained.extraContent) { // add event handling content if set
			aAdditionalContent[1] = oResultFromNavigationObtained.extraContent;
		}

		this._setConvertedLinkItems(aLinkItems);
		const aMLinkItems = this._getInternalModel().getProperty("/linkItems");
		if (aAdditionalContent.length === 1 && !aMLinkItems.length) {
			aAdditionalContent.push(this._getNoContent());
		}

		const oPanel = await this._getContent(aUpdatedLinkItems, aAdditionalContent, fnGetAutoClosedControl, Panel);
		oPanel.setEnablePersonalization(oControlDelegate._getEnableAvailableActionsPersonalization(aLinkItems, this));
		return oPanel;
	};

	// TODO: remove this override after change in openui5
	SmartLinkFieldInfo.prototype._getNoContent = function () {
		const oSimpleForm = new SimpleForm({
			layout: ResponsiveGridLayout,
			content: [
				new Title({
					text: Library.getResourceBundleFor("sap.ui.mdc").getText("info.POPOVER_MSG_NO_CONTENT")
				})
			]
		});
		oSimpleForm.addStyleClass("mdcbaseinfoPanelDefaultAdditionalContent");
		return oSimpleForm;
	};

	SmartLinkFieldInfo.prototype.checkDirectNavigation = async function (oEvent) {
		const oSmartLink = this.getParent();
		const aMLinkItems = this._getInternalModel().getProperty("/linkItems");
		const oExtraContent = oSmartLink.getExtraContent();

		if (oExtraContent || aMLinkItems.length > 1) {
			return false;
		}

		const oMainNavigationLink = oSmartLink.getMainNavigation();

		const fnNavigate = async (oLinkItem) => {
			oEvent.oSource = oLinkItem;
			const bNavigate = await this._beforeNavigationCallback(oEvent);
			if (bNavigate) {
				MDCPanel.navigate(oLinkItem.internalHref ?? oLinkItem.href);
				const oParameters = {
					text: oLinkItem.text ?? oLinkItem.title,
					href: oLinkItem.href,
					internalHref: oLinkItem.internalHref
				};
				oSmartLink.fireInnerNavigate(oParameters);
			}
			return bNavigate;
		};

		if (aMLinkItems.length === 1 && !oMainNavigationLink.href?.length) {
			return await fnNavigate(aMLinkItems[0]);
		}

		if (aMLinkItems.length === 0 && oMainNavigationLink.href?.length) {
			return await fnNavigate(oMainNavigationLink);
		}

		return false;
	};

	SmartLinkFieldInfo.prototype.exit = function () {
		MDCLink.prototype.exit.apply(this, arguments);
		this._oGetContentPromise = undefined;
		this.getPopover()?.destroy();
	};

	return SmartLinkFieldInfo;
});
